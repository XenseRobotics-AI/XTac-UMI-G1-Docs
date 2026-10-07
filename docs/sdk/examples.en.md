# Examples

The SDK source has a set of ready-to-run scripts under `python/examples/`. Get the scripts working first, then model your own program on them.
Run the commands below from the SDK source directory: with the collection environment that is `third_party/taccap-gripper` in the data-collection repository;
with a standalone install it is `TacCap-Gripper`.

Every script selects a gripper with `left`, `right` or a full serial number, which can be omitted when only one gripper is attached. When a leader and a follower gripper are attached on the same side, use the full serial number.
**A script interrupts any other program using a gripper when it starts, so do not run example scripts while collection or control is running.**

## Scripts at a glance {#scripts}

| Script | Purpose | Moves the motor or rewrites the gripper? |
|---|---|---|
| `follower_status.py` | Follower gripper self-check | Read-only |
| `gripper_console.py` | Keyboard control of the follower gripper | **Moves the motor** |
| `impedance_control.py` | Impedance control test; view / write the motion safety envelope | **Moves the motor**; `--set-envelope` rewrites the gripper |
| `force_position_control.py` | Force-position control grasp test | **Moves the motor** |
| `control_and_read.py` | Read state while controlling | **Moves the motor** |
| `control_ripple.py` | Measure motion smoothness | **Moves the motor** |
| `calibrate.py` | Leader gripper travel calibration | Rewrites the gripper |
| `leader_normalized_position.py` | Read the leader gripper's opening | Read-only |
| `fisheye_cal.py` | View / write fisheye intrinsics | `show` is read-only, the rest rewrite the gripper |
| `read_intrinsics.py` | Export the wrist camera intrinsics | Read-only |
| `wrist_camera.py` | Wrist camera viewer | Read-only |
| `ota_update.py` | Gripper firmware upgrade | **Flashes firmware** |
| `motor_ota_update.py` | Motor firmware upgrade | **Flashes firmware** |

Every script accepts `--help` to list its arguments.

## Follower gripper {#follower}

```bash
python python/examples/follower_status.py left
python python/examples/gripper_console.py left
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
```

Before first use, run through [Setup and self-check](../follower/setup.md).

## Leader gripper {#leader}

```bash
python python/examples/calibrate.py right
python python/examples/leader_normalized_position.py right
```

The calibration procedure is in [Calibration and self-check](../pc/calibration.md).

## Wrist camera {#camera}

```bash
python python/examples/wrist_camera.py --list                  # list cameras and their serial numbers
python python/examples/wrist_camera.py <camera serial> --undistort   # undistorted image
```

## Firmware {#firmware}

For a follower gripper see [Firmware and motor upgrades](../follower/firmware.md); for a leader gripper see [Firmware OTA upgrade](../pc/versions.md#ota).

## Migrating from older versions {#migrate}

Programs written against 0.1.x / 0.2.x mainly see these changes when upgrading to 0.4.1:

- The follower gripper now uses controllers: `ImpedanceController` or `ForcePositionController`, configured with `for_spec()`.
  The old `ControlLoop`, `set_position()` and similar interfaces have been removed.
- Velocity and torque are now uniformly positive = toward closing.
- Follower gripper firmware must be 1.2.5 or later; below 1.2.11 you are prompted to upgrade.
- The example scripts now select a gripper with a positional argument `left` / `right` / serial number, and the old control-type example scripts have been removed.
- The wrist camera frames delivered by gripper objects are now RGB by default.

When upgrading from 0.3.x to 0.4.x:

- Force-position control now uses a single torque-limited control law, which holds more steadily when grasping; `snapshot().holding` becomes true about 150 ms later than before,
  so revalidate any program that relies on it.
- When closing to 0, the final state may be either `HOLDING_FORCE` or `HOLDING_POSITION`; both are normal.
- During operation, `set_target(opening, grip_force)` with a grip force above 1.1 N·m now raises an error instead of being silently accepted.
- New `g.motor.motor_version()` reads the motor firmware version (from gripper firmware 1.2.14 on, this works regardless of the motor's communication mode).

The full list of changes is in the SDK's [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.4.1/CHANGELOG.md).
