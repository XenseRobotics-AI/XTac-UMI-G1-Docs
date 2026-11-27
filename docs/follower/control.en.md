# Motion control

Before you start, complete [Setup and self-check](setup.md), including the [motion check](setup.md#motion-check).

!!! danger "This drives a real motor"
    Before running, clear the fingers' range of motion, keep your hands away from the gripper, and make sure you can cut the 24V at any moment. For a follower gripper on a robot, test first with the robot stationary.

## Keyboard control {#first-motion}

Use the keyboard console for the first motion.

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

## Two control modes {#choose}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Suited to | Following an opening: teleoperation, following the leader gripper, running a policy | Grasping an object with a set force |
| When blocked by an object | Presses with 1.1N·m | Presses with the set grip force and reports that it is holding |

The opening is expressed from 0 to 1: **0 = closed, 1 = open**.

## Control from a program {#basic}

<span id="impedance"></span>

**Impedance control**

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

<span id="force-position"></span>

**Force-position control**

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

In SDK 0.5.0, `c.set_target(opening, grip=True)` marks the target opening as the expected contact position for thin-object grasping. The release also supports configurable acceleration at startup and braking for smoother motion near endpoints.

!!! danger "The gripper releases when control stops or the link drops"
    When the controller stops (leaving the `with` block, program exit), when you press `d` / `q` in the console, or when USB disconnects, the gripper releases, and **whatever it is holding will drop**.
    When the robot is holding an object, put the object somewhere safe before stopping control.

!!! warning "Holding for a long time reduces the grip force"
    The firmware reduces output as the motor heats up.
    If you need to hold continuously for tens of minutes, lower the grip force to around 0.6N·m.

For method signatures and state fields, see [API and examples](api.md).

## Faults and recovery {#fault}

When the controller detects an anomaly it stops and releases its torque; `c.snapshot().state` becomes `FAULT`, and the reason is in `c.snapshot().fault_reason`.
Once the cause is removed, call `g.motor.clear_fault()` and then `c.reset()` to continue; if it cannot recover, power-cycle the gripper.
For common causes, see [Troubleshooting](troubleshooting.md#fault).
