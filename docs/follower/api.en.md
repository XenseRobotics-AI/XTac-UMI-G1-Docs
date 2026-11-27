# API and examples

<span id="first-motion"></span><span id="full-chain"></span><span id="basic"></span><span id="impedance"></span><span id="force-position"></span><span id="fault"></span>

For installation, see [Setup and self-check](setup.md#install). For keyboard and programmatic control, see [Motion control](control.md). The examples use Python. C++ interfaces share the names, and `help(t.FollowerGripper)` provides the full reference.

## Opening the follower gripper {#open}

```python
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)        # one connected

ep = next(e for e in t.scan_grippers()                     # several: pick by side and role
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

Follower serials end in `s`; see [Serial number](index.md#sn). Scanning interrupts other programs (see [Find the device](setup.md#discover)); scan only once, at start-up.

## Controllers {#controllers}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Controller | `ImpedanceController` | `ForcePositionController` |
| Config | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| Tunable | Usually left alone | `grasp_torque_nm` (grip force, ≤ 1.1N·m) |
| Common | `set_target(opening)` | `set_target(opening)`, `release()`, `hold_position()` |

- The opening is expressed from 0 to 1: **0 = closed, 1 = open**.
- Both have `start()` / `stop()` (or `with`), `snapshot()` and `reset()`.
- Order: `g.motor.clear_fault()` → start the controller → `g.motor.enable()` → `set_target()` → stop the controller.
- Always generate the config with `for_spec(g.motor.get_spec())`, and change only the grip force as needed.
- Run only one controller per gripper at a time.

See [Control from a program](control.md#basic) for worked examples.

## Reading state {#state}

| When | Interface | Contents |
|---|---|---|
| While controlling | `c.snapshot().observation` | `position` (opening), `velocity`, `torque` (positive = closing), `motor_temp_c` |
| While controlling | `c.snapshot().holding` | Holding (force-position control) |
| Not controlling | `g.position()` | Opening |
| Any time | `g.motor.motor_version()` | See [Motor firmware version](firmware.md#motor-version) |

While controlling, read only through `snapshot()`; reading the motor separately competes for the link.

## Low-level motor interfaces {#motor-primitives}

`g.motor.submit_*` and other low-level interfaces bypass the controller's protection. **Use a controller**.

These rewrite gripper or motor configuration; **only under technical support's guidance**:
`set_model()`, `set_startup_limit_torque()`, `switch_protocol()`, `set_can_id()`, `set_private_param()`,
`set_zero()`, `set_gripper_config()`, `set_envelope()`, `set_auto_cal_config()`, `set_motor_fw_version()`.

## Wrist camera {#camera}

Off by default; enable it the same way as on the leader gripper, see [Wrist camera and fisheye undistortion](../sdk/index.md#camera).

## Example scripts {#examples}

Scripts are in `python/examples/`; run them from the SDK source directory (the collection repository's `third_party/taccap-gripper`, or a standalone `TacCap-Gripper`). Pick the gripper with `left`, `right` or the full serial, optional with only one connected; options via `--help`.

!!! warning "Before running the examples"
    Complete [Setup and self-check](setup.md) before the first run and review the safety requirements in [Motion control](control.md). Scripts scan for devices at start-up. Stop any active control or data collection program first.

| Script | Purpose | Effect |
|---|---|---|
| `follower_status.py` | [Self-check](setup.md#self-check) | Read-only |
| `gripper_console.py` | Keyboard control; `--rerun` for the [full-chain check](control.md#full-chain) (SDK 0.4.4 and later) | **Moves motor** |
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
