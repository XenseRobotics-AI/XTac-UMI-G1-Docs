# Examples

The SDK source has a set of ready-to-run scripts under `python/examples/`. Get the scripts working first, then model your own program on them.
Run the commands below from the SDK source directory: with the collection environment that is `third_party/taccap-gripper` in the data-collection repository;
with a standalone install it is `TacCap-Gripper`.

Every script selects a gripper with `left`, `right` or a full serial number, which can be omitted when only one gripper is attached. When a leader and a follower gripper are attached on the same side, use the full serial number.
**A script interrupts any other program using a gripper when it starts, so do not run example scripts while collection or control is running.**

## Scripts at a glance {#scripts}

| Script | Purpose | Moves the motor or rewrites the gripper? |
|---|---|---|
| `calibrate.py` | Leader gripper travel calibration | Rewrites the gripper |
| `leader_normalized_position.py` | Read the leader gripper's opening | Read-only |
| `fisheye_cal.py` | View / write fisheye intrinsics | `show` is read-only, the rest rewrite the gripper |
| `read_intrinsics.py` | Export the wrist camera intrinsics | Read-only |
| `wrist_camera.py` | Wrist camera viewer | Read-only |
| `tactile_sensor.py` | Visuotactile sensor viewer (SDK 0.4.4 and later) | Read-only |
| `rerun_viewer.py` | Gripper state, wrist camera and visuotactile in one view (SDK 0.4.4 and later) | Read-only |
| `ota_update.py` | Gripper firmware upgrade | **Flashes firmware** |
| `motor_ota_update.py` | Motor firmware upgrade | **Flashes firmware** |

Every script accepts `--help` to list its arguments. The follower gripper's scripts (self-check, keyboard control, impedance and force-position control and so on) are in [Follower gripper → Example scripts](../follower/api.md#examples).

## Follower gripper {#follower}

See [Follower gripper → Example scripts](../follower/api.md#examples).

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

## Visuotactile sensors {#tactile}

Included from SDK 0.4.4. Visuotactile images are read by `xensesdk`, which the standalone `taccap` environment already contains.

```bash
python python/examples/tactile_sensor.py --list     # which gripper and which finger each sensor is on
python python/examples/tactile_sensor.py left       # both sensors of the left gripper
python python/examples/tactile_sensor.py left --finger right --outputs rectify,difference
```

Each gripper carries two sensors, one in each finger. `left` / `right` refers to the **gripper**, taken from the gripper on the same USB hub,
so the gripper must be plugged in; the finger comes from the last digit of the sensor serial number, odd for left and even for right.

The window shows one column per sensor: rectified image, difference image, depth and force distribution. Orientation and colours match what data collection records.
**Do not touch the gel at startup**: the difference image and the force use the moment of startup as the no-contact reference. Press `c` to take a new reference (again with nothing touching).

## Full-chain check {#full-chain}

Included from SDK 0.4.4. It uses [Rerun](https://rerun.io) to put all of one gripper's data on a single timeline:
gripper state (opening, velocity, torque, temperature, status bits), the wrist camera, and both visuotactile sensors (image, force-distribution arrows on top, resultant-force plot).

```bash
python python/examples/rerun_viewer.py left                  # view only, the motor does not move
python python/examples/rerun_viewer.py left --save rig.rrd --duration 20   # save to a file
```

To watch while opening and closing a follower gripper, use the keyboard console's `--rerun`; see [Motion control → Full-chain check](../follower/control.md#full-chain).

!!! warning "The Developer Kit collection environment shows images only"
    The collection environment has no visuotactile inference engine, so force distribution and depth fail with `No module named 'onnxruntime'`.
    When running in the collection environment, add `--no-force` to `rerun_viewer.py` and `gripper_console.py --rerun`,
    and `--outputs rectify,difference` to `tactile_sensor.py`. The standalone `taccap` environment does not have this limit.

With cameras and visuotactile sensors running together, every camera must use MJPEG; see [Host setup](../pc/host-setup.md). If another program holds the wrist camera, add `--no-wrist`.

## Firmware {#firmware}

For a follower gripper see [Firmware and motor upgrades](../follower/firmware.md); for a leader gripper see [Firmware OTA upgrade](../pc/versions.md#ota).

## Migrating from older versions {#migrate}

Programs written against 0.1.x / 0.2.x are mainly affected by these changes when upgrading to 0.4.x:

- The follower gripper now uses controllers: `ImpedanceController` or `ForcePositionController`, configured with `for_spec()`.
  The old `ControlLoop`, `set_position()` and similar interfaces have been removed.
- Positive velocity and torque now consistently mean the closing direction.
- Follower gripper firmware must be 1.2.5 or later; below 1.2.11 you are prompted to upgrade.
- The example scripts now select a gripper with a positional argument `left` / `right` / serial number, and the old control-type example scripts have been removed.
- The wrist camera frames delivered by gripper objects are now RGB by default.

When upgrading from 0.3.x to 0.4.x:

- Force-position control now uses a single torque-limited control law, which holds more steadily when grasping; `snapshot().holding` becomes true about 150ms later than before,
  so revalidate any program that relies on it.
- When closing to 0, the final state may be either `HOLDING_FORCE` or `HOLDING_POSITION`; both are normal.
- During operation, `set_target(opening, grip_force)` with a grip force above 1.1N·m now raises an error instead of being silently accepted.
- New `g.motor.motor_version()` reads the motor firmware version (from gripper firmware 1.2.14 on, this works regardless of the motor's communication mode).

Upgrading from 0.4.1 to 0.4.3 (no API changes):

- `ForcePositionController` no longer stutters when following a streamed target, at the cost of about 10–15ms more tracking lag.
- A stall short of a target that is still moving enters `HOLDING_FORCE` about 150ms later than before; review programs that rely on it to detect a grasp.
- The bundled follower firmware moves to 1.2.16; [upgrade the firmware](../follower/firmware.md#mcu-ota).

Upgrading from 0.4.3 to 0.4.4 (no API changes):

- New [visuotactile](#tactile) and [full-chain check](#full-chain) examples.
- `environment.yml` adds `xensesdk` and `rerun-sdk` and pins NumPy to 2.2.4 (required by `xensesdk`).
  For an existing `taccap` environment, run `mamba env update -f environment.yml --prune`, then rerun `uv pip install -e . --no-build-isolation`.
- Log and error messages are now in English. Scripts that match on the Chinese message text need updating; for example the firmware-below-1.2.11 warning now reads `is below 1.2.11`.
- EL05 motor firmware ships with the SDK; without an image argument, `motor_ota_update.py` picks one from the motor model recorded on the gripper.

The full list of changes is in the SDK's [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.4.4/CHANGELOG.md).
