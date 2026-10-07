# API and examples

The SDK interfaces and example scripts used with the follower gripper. Examples are in Python; the C++ interfaces have the same names, and `help(t.FollowerGripper)` shows the full reference. Installation is in [Setup and self-check](setup.md#install); how to make the gripper move is in [Motion control](control.md).

```python
import xense.taccap as t
```

## Opening the follower gripper {#open}

With only one follower gripper connected:

```python
g = t.FollowerGripper(t.find_follower().mcu_device)
```

With several grippers connected, pick the one you want by side and role:

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

Follower serial numbers end in `s`; see [Serial number](index.md#sn).

!!! danger "Scanning interrupts other programs"
    A scan stops the gripper data streams other programs are using, and a follower gripper that is holding something goes limp. In your own program, scan only once, at start-up.

## Controllers {#controllers}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Controller | `ImpedanceController` | `ForcePositionController` |
| Config | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| Tunable parameters | Usually left alone | `grasp_torque_nm` (grip force, ≤ 1.1 N·m) |
| Common calls | `set_target(opening)` | `set_target(opening)`, `release()`, `hold_position()` |
| Is it holding | — | `snapshot().holding` |

Both controllers have `start()` / `stop()` (or use `with`), `snapshot()` and `reset()`. Call order:

`g.motor.clear_fault()` → start the controller → `g.motor.enable()` → `set_target()` → stop the controller

The full code is in [Control from a program](control.md#basic).

## Reading state {#state}

| When | Interface | Contents |
|---|---|---|
| While controlling | `c.snapshot().observation` | `position` (opening), `velocity`, `torque` (positive = toward closing), `motor_temp_c` |
| While controlling | `c.snapshot().holding` | Whether force-position control is holding something |
| Not controlling | `g.position()` | Opening |
| Any time | `g.motor.motor_version()` | Motor firmware version; see [Motor firmware version](firmware.md#motor-version) |

While a controller is running, always read state through `snapshot()` rather than reading the motor directly, which would compete with the control commands on the same link.

## Low-level motor interfaces {#motor-primitives}

`g.motor.submit_*` and the other low-level interfaces send commands straight to the motor, bypassing the controller's protection. **Use a controller** and do not call them.

The following interfaces change configuration stored in the gripper or the motor; **use them only under technical support's guidance**:
`set_model()`, `set_startup_limit_torque()`, `switch_protocol()`, `set_can_id()`, `set_private_param()`,
`set_zero()`, `set_gripper_config()`, `set_envelope()`, `set_auto_cal_config()`, `set_motor_fw_version()`.

## Wrist camera {#camera}

The follower gripper also has a wrist camera, closed by default. It opens the same way as on the leader gripper; see [Wrist camera and fisheye undistortion](../sdk/api.md#camera) in the SDK appendix.

## Example scripts {#examples}

The scripts live under `python/examples/` in the SDK source and run from the SDK source directory: `third_party/taccap-gripper` in the collection repository when you use the collection environment, or `TacCap-Gripper` for a standalone install. Choose the gripper with `left`, `right` or the full serial number (optional when only one is connected); every script accepts `--help`.

| Script | Purpose | Moves the motor or rewrites the gripper? |
|---|---|---|
| `follower_status.py` | Self-check | Read-only |
| `gripper_console.py` | Keyboard control | **Moves the motor** |
| `impedance_control.py` | Impedance control test; view / write the motion safety envelope | **Moves the motor**; `--set-envelope` rewrites the gripper |
| `force_position_control.py` | Force-position grasp test | **Moves the motor** |
| `control_and_read.py` | Read state while controlling | **Moves the motor** |
| `control_ripple.py` | Measure motion smoothness | **Moves the motor** |
| `ota_update.py` | Gripper firmware upgrade | **Flashes firmware** |
| `motor_ota_update.py` | Motor firmware upgrade | **Flashes firmware** |

```bash
python python/examples/follower_status.py left
python python/examples/gripper_console.py left
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
python python/examples/control_and_read.py left
```

!!! warning "Before running the examples"
    On first use, finish the [Setup and self-check](setup.md) first. A script interrupts any other program using the gripper when it starts, so do not run the examples while control or collection is running. Firmware upgrade steps are in [Firmware and motor upgrades](firmware.md).
