# API and examples

Examples are in Python; the C++ interfaces share the names, and `help(t.FollowerGripper)` has the full reference. Installation: [Setup and self-check](setup.md#install); motion: [Motion control](control.md).

```python
import xense.taccap as t
```

## Opening the follower gripper {#open}

With one connected:

```python
g = t.FollowerGripper(t.find_follower().mcu_device)
```

With several, pick by side and role:

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

Follower serials end in `s`; see [Serial number](index.md#sn).

!!! danger "Scanning interrupts other programs"
    It stops other programs' gripper data streams, and a holding follower goes limp; scan only once, at start-up.

## Controllers {#controllers}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Controller | `ImpedanceController` | `ForcePositionController` |
| Config | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| Tunable | Usually left alone | `grasp_torque_nm` (grip force, ≤ 1.1N·m) |
| Common | `set_target(opening)` | `set_target(opening)`, `release()`, `hold_position()` |

Both have `start()` / `stop()` (or `with`), `snapshot()` and `reset()`. Order:

`g.motor.clear_fault()` → start the controller → `g.motor.enable()` → `set_target()` → stop the controller

Code: [Control from a program](control.md#basic).

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

Closed by default; it opens as on the leader gripper, see [Wrist camera and fisheye undistortion](../sdk/api.md#camera).

## Example scripts {#examples}

- Scripts are in `python/examples/`; run them from the SDK source directory (the collection repository's `third_party/taccap-gripper`, or a standalone `TacCap-Gripper`).
- Pick the gripper with `left`, `right` or the full serial, optional with only one connected; options via `--help`.

| Script | Purpose | Effect |
|---|---|---|
| `follower_status.py` | Self-check | Read-only |
| `gripper_console.py` | Keyboard control | **Moves motor** |
| `impedance_control.py` | Impedance test; view / write the motion safety envelope | **Moves motor**; `--set-envelope` rewrites the gripper |
| `force_position_control.py` | Force-position grasp test | **Moves motor** |
| `control_and_read.py` | Read state while controlling | **Moves motor** |
| `control_ripple.py` | Measure motion smoothness | **Moves motor** |
| `ota_update.py` | Gripper firmware upgrade | **Flashes** |
| `motor_ota_update.py` | Motor firmware upgrade | **Flashes** |

```bash
python python/examples/follower_status.py left
python python/examples/gripper_console.py left
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
python python/examples/control_and_read.py left
```

!!! warning "Before running the examples"
    - First time: run the [self-check](setup.md).
    - A script scans at start-up; do not run one while control or collection is running.
    - Upgrades: [Firmware and motor upgrades](firmware.md).
