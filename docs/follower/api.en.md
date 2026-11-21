# Motion control and API

Before you start, complete [install and self-check](index.md#install), **especially the [motion check](index.md#motion-check)**. Examples are in Python; the C++ interfaces share the names, and `help(t.FollowerGripper)` has the full reference.

!!! danger "This drives a real motor"
    Before running, clear the fingers' range of motion, keep your hands away from the gripper, and make sure you can cut the 24V at any moment. For a follower gripper on a robot, test first with the robot stationary.

## Keyboard control {#first-motion}

```bash
python python/examples/gripper_console.py left
```

| Key | Action |
|---|---|
| `j` / `k` | Open / close one step |
| `o` / `c` | Fully open / fully close |
| `h` | Hold at the current position |
| `d` / `e` | Release the motor / resume control |
| `f` | Clear fault |
| `q` or `Esc` | Quit |

The default is impedance control. To grasp with a set force, add `--mode force-position --grasp-torque 0.6` (grip force in N·m, no more than 1.1).

### Full-chain check {#full-chain}

From SDK 0.4.4, add `--rerun` to the console to see all of this follower gripper's data live in [Rerun](https://rerun.io) while the keys open and close it:

```bash
python python/examples/gripper_console.py left --mode force-position --rerun
```

| Plot / view | What to look for |
|---|---|
| Opening and target opening | With no load the opening follows the target; when grasping an object it stops short of the target |
| Measured and commanded torque | Rise to the set grip force when grasping |
| Controller state | Text log: `HOLDING_FORCE` while grasping, `FAULT` on a fault |
| Wrist camera | Steady at 30Hz |
| Visuotactile image, marker flow, resultant force | Respond when grasping an object and fall back after release |

Before putting the gripper into service or starting collection, grasp an object and check each of these. The cameras and the viewer open before the motor is enabled; **do not touch the gel at startup**.
The other options (`--no-wrist`, `--save` and so on) are the same as `rerun_viewer.py`; see [SDK examples → Full-chain check](../sdk/index.md#full-chain).

## The two controllers {#controllers}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Suited to | Following an opening: teleoperation, following the leader gripper, running a policy | Grasping an object with a set force |
| When blocked by an object | Presses with 1.1N·m | Presses with the set grip force and reports that it is holding |
| Controller | `ImpedanceController` | `ForcePositionController` |
| Config | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| Tunable | Usually left alone | `grasp_torque_nm` (grip force, ≤ 1.1N·m) |
| Common | `set_target(opening)` | `set_target(opening)`, `release()`, `hold_position()` |

- The opening is expressed from 0 to 1: **0 = closed, 1 = open**.
- Both have `start()` / `stop()` (or `with`), `snapshot()` and `reset()`.
- Order: `g.motor.clear_fault()` → start the controller → `g.motor.enable()` → `set_target()` → stop the controller.
- Always generate the config with `for_spec(g.motor.get_spec())`, and change only the grip force as needed.
- Run only one controller per gripper at a time.

## Control from a program {#basic}

### Opening the follower gripper {#open}

```python
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)        # one connected

ep = next(e for e in t.scan_grippers()                     # several: pick by side and role
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

Follower serials end in `s`; see [Serial number](index.md#sn). Scanning interrupts other programs (see [Find the device](index.md#discover)); scan only once, at start-up.

### Impedance control {#impedance}

```python
import time
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)
cfg = t.ImpedanceConfig.for_spec(g.motor.get_spec())

g.motor.clear_fault()
with t.ImpedanceController(g, cfg) as c:   # stops and releases the motor automatically on leaving the with block
    g.motor.enable()
    c.set_target(0.0)                       # close
    time.sleep(2)
    print("opening", c.snapshot().observation.position)
    c.set_target(1.0)                       # open
    time.sleep(2)
```

For teleoperation or running a policy, just call `c.set_target(opening)` once per cycle in your control loop; there is no need to wait.

### Force-position control {#force-position}

A different config and controller; everything else is the same:

```python
cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())
cfg.grasp_torque_nm = 0.6                   # grip force, no more than 1.1 N·m

g.motor.clear_fault()
with t.ForcePositionController(g, cfg) as c:
    g.motor.enable()
    c.set_target(0.0)                       # close to grasp
    time.sleep(2)
    print("holding" if c.snapshot().holding else "nothing gripped")
    c.release()                             # release
    time.sleep(2)
```

Force-position control follows a streamed target about one send interval behind (about 20ms at 50Hz), in exchange for smooth motion.

!!! danger "The gripper releases when control stops or the link drops"
    When the controller stops (leaving the `with` block, program exit), when you press `d` / `q` in the console, or when USB disconnects, the gripper releases, and **whatever it is holding will drop**.
    When the robot is holding an object, put the object somewhere safe before stopping control.

!!! warning "Holding for a long time reduces the grip force"
    As the motor heats up, the firmware automatically reduces output. In testing, holding at 1.1N·m for 10 minutes brought the motor to about 70°C; at 0.6N·m it settled at about 49°C.
    If you need to hold continuously for tens of minutes, lower the grip force to around 0.6N·m.

## Reading state {#state}

| When | Interface | Contents |
|---|---|---|
| While controlling | `c.snapshot().observation` | `position` (opening), `velocity`, `torque` (positive = closing), `motor_temp_c` |
| While controlling | `c.snapshot().holding` | Holding (force-position control) |
| Not controlling | `g.position()` | Opening |
| Any time | `g.motor.motor_version()` | See [Motor firmware version](firmware.md#motor-version) |

While controlling, read only through `snapshot()`; reading the motor separately competes for the link.

## Faults and recovery {#fault}

When the controller detects an anomaly it stops and releases its torque; `c.snapshot().state` becomes `FAULT`, and the reason is in `c.snapshot().fault_reason`.
Once the cause is removed, call `g.motor.clear_fault()` and then `c.reset()` to continue; if it cannot recover, power-cycle the gripper.
For common causes, see [Troubleshooting](troubleshooting.md#fault).

## Low-level motor interfaces {#motor-primitives}

`g.motor.submit_*` and other low-level interfaces bypass the controller's protection. **Use a controller**.

These rewrite gripper or motor configuration; **only under technical support's guidance**:
`set_model()`, `set_startup_limit_torque()`, `switch_protocol()`, `set_can_id()`, `set_private_param()`,
`set_zero()`, `set_gripper_config()`, `set_envelope()`, `set_auto_cal_config()`, `set_motor_fw_version()`.

## Wrist camera {#camera}

Off by default; enable it the same way as on the leader gripper, see [Wrist camera and fisheye undistortion](../sdk/index.md#camera).

## Example scripts {#examples}

Scripts are in `python/examples/`; run them from the SDK source directory (the collection repository's `third_party/taccap-gripper`, or a standalone `TacCap-Gripper`). Pick the gripper with `left`, `right` or the full serial, optional with only one connected; options via `--help`. A script scans at start-up, so do not run one while control or collection is running.

| Script | Purpose | Effect |
|---|---|---|
| `follower_status.py` | [Self-check](index.md#self-check) | Read-only |
| `gripper_console.py` | Keyboard control; `--rerun` for the [full-chain check](#full-chain) (SDK 0.4.4 and later) | **Moves motor** |
| `impedance_control.py` | Impedance test; view / write the motion safety envelope | **Moves motor**; `--set-envelope` rewrites the gripper |
| `force_position_control.py` | Force-position grasp test, e.g. `--grasp-torque 0.6` | **Moves motor** |
| `control_and_read.py` | Read state while controlling | **Moves motor** |
| `control_ripple.py` | Measure motion smoothness | **Moves motor** |
| `ota_update.py` | [Gripper firmware upgrade](firmware.md#mcu-ota) | **Flashes** |
| `motor_ota_update.py` | [Motor firmware upgrade](firmware.md#motor-ota) | **Flashes** |

```bash
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
python python/examples/control_and_read.py left
```
