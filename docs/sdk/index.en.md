# SDK & development

`xense.taccap` (repository [TacCap-Gripper](https://github.com/XenseRobotics-AI/TacCap-Gripper)) is the SDK for the XTac UMI G1 grippers. It provides both Python and C++ interfaces, for writing your own programs that read the leader gripper and control the follower gripper. This page is written for SDK 0.5.0.

## What it can do {#scope}

| | Leader gripper | Follower gripper |
|---|---|---|
| Opening | Encoder, 0..1 opening | Motor position, 0..1 opening |
| Other data | IMU, buttons | Motor velocity, torque, temperature |
| Control | — | Impedance control (default), force-position control |
| Shared | LED, wrist camera, fisheye intrinsics, firmware upgrade | Same as the leader gripper, plus motor firmware upgrade and version query |

Visuotactile images are captured by `xensesdk` and are not part of this SDK; from SDK 0.4.4 it includes [examples](#tactile) that view visuotactile data through `xensesdk`. Teleoperation, grasping policies and data recording belong to higher-level applications. The follower gripper's controllers, state reading and example scripts are in [Follower gripper → API and examples](../follower/api.md).

## Before you start {#notes}

- The computer never drives the motor directly: every command is relayed by the gripper's main control board, and no program can bypass the protection on that board (the motion safety envelope).
- A gripper can be used by only one program and one controller at a time.
- Logs are written to `~/.taccaplogs/` (change it with the environment variable `TACCAP_LOG_DIR`), one file per run. Attach the matching log when reporting a problem.

!!! danger "Scanning interrupts other programs"
    `scan_grippers()` and every example script, on startup, stop the gripper data streams other programs are using, and a follower gripper that is holding an object releases its torque. Do not scan or run example scripts while collection or control is running; in your own program, scan only once at startup.

## Install {#python}

**We recommend using the collection environment directly**: once the data-collection repository `xense-taccap-lerobot` v0.1.6 is set up per [Installation](../pc/install.md) it already includes SDK 0.5.0 (submodule `third_party/taccap-gripper`), and the source and example scripts are all in that directory. To verify:

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.5.0`. If the version is wrong, pull the submodules and rerun `./setup_env.sh --install`, see [Repo and submodule update](../pc/versions.md#repo-update).

### Standalone install (Backpack Kit, or without the data-collection repository) {#standalone}

Backpack Kit customers, and computers that do not use the data-collection repository, install from scratch per [Follower gripper · Install the SDK and set up the host](../follower/setup.md#install): Miniforge → `v4l-utils` → download the SDK → create the mamba environment → build and install → host setup. Leader and follower grippers use the same steps.

### Hardware self-check {#self-check}

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

One line per gripper: a leader gripper shows `Role.Leader` (serial number ending in `m`), a follower gripper `Role.Follower` (ending in `s`). For the follower gripper, continue with its [self-check](../follower/setup.md#self-check); serial permissions and similar issues are covered in [Host setup](../pc/host-setup.md#first-use).

### Integrating into C++ / ROS 2 projects {#cpp}

Add the SDK source as a CMake subdirectory and link `taccap_core`:

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

For the build environment use the `taccap` environment created by the standalone install above; it has every build dependency. The C++ interface uses the same names as Python, in the `xense::taccap` namespace. For gripper models in ROS 2 (URDF / Xacro), see [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description).

## API essentials {#api}

Examples are in Python. For full documentation use `help()`, for example `help(t.FollowerGripper)`.

```python
import xense.taccap as t
```

### Device discovery {#discovery}

```python
for e in t.scan_grippers():
    print(e.side, e.role, e.firmware_sn, e.mcu_device)
```

With several grippers attached, pick the one you want by side and by leader/follower role together, then open it with its `mcu_device`:

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

With only one gripper attached you can also use `t.find_follower()` / `t.find_leader()`.

### Leader gripper: reading {#leader}

```python
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)   # ep: pick the leader gripper as shown above
g.encoder.on_data(lambda s: print(s.position))   # 0 = closed, 1 = open
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)
# ...
g.stop_streaming()
```

`normalize_position=True` requires the leader gripper's travel calibration to be done; see [Gripper calibration](../pc/calibration.md#41).

### Follower gripper: control {#follower}

See [Follower gripper → API and examples](../follower/api.md).

<span id="motor-primitives"></span>
The low-level motor interfaces bypass the controller's protection and must not be called directly; see [Low-level motor interfaces](../follower/api.md#motor-primitives).

### Wrist camera and fisheye undistortion {#camera}

Gripper objects do not open the wrist camera by default. When you need it:

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<camera>-video-index0",
                      open_cameras=True, undistort_wrist=True,
                      wrist_width=1920, wrist_height=1080)   # default 640×480 at 30fps
g.wrist_camera.start(lambda f: print(f.frame_index))
```

Frames are RGB by default. To just view the image, use the example `wrist_camera.py`. `close()` releases the camera, so you can reopen it right away at another resolution (0.5.0 and later).

<span id="fisheye-fallback"></span>
Fisheye intrinsics are stored in each gripper. If calibration is missing for the current resolution, the SDK reports an error or explicitly warns that reference values are in use, depending on the calibration state. Reference intrinsics are for viewing only. Use device-specific calibration for capture. To read the intrinsics:

```python
cal, is_reference, reason = g.calibration.resolve_fisheye_for(1920, 1080)   # by camera resolution
```

- **Stored per resolution**: Firmware 1.3.1 reads and writes independent calibration for 640×480 and 1920×1080. Neither replaces the other. `undistort_wrist=True` selects parameters for the active camera resolution. Upgraded devices retain existing 640×480 calibration, with the 1920×1080 slot empty. Calibrate that resolution before using 1080p.
- **Calibrated only at the other resolution**: opening raises an error asking you to calibrate this resolution or run the camera at the calibrated one; it does not silently switch to the reference intrinsics.
- **Reference intrinsics**: if `is_reference` is True, this gripper has no calibration at that resolution and the reference intrinsics are in use; they are only good for viewing. When you need pixel measurements on the undistorted image, write its own calibration: `python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz --width 1920 --height 1080` (add `--follower` for a follower gripper; `--width` / `--height` are required). `fisheye_cal.py show` lists the intrinsics for both resolutions. An off-center image after undistortion is normal; do not change `cx` in the intrinsics. Details are in [What happens when the fisheye calibration cannot be read](../pc/recording.md#fisheye-fallback).

## Example scripts {#scripts}

The scripts are under `python/examples/` in the SDK source. Run the commands below from the SDK source directory: with the collection environment that is `third_party/taccap-gripper` in the data-collection repository; with a standalone install it is `TacCap-Gripper`.

Every script selects a gripper with `left`, `right` or a full serial number, which can be omitted when only one gripper is attached; when a leader and a follower gripper are attached on the same side, use the full serial number. Every script accepts `--help` to list its arguments.

| Script | Purpose | Moves the motor or rewrites the gripper? |
|---|---|---|
| `calibrate.py` | Leader gripper travel calibration; procedure in [Gripper calibration](../pc/calibration.md#41) | Rewrites the gripper |
| `leader_normalized_position.py` | Read the leader gripper's opening | Read-only |
| `fisheye_cal.py` | View / write fisheye intrinsics | `show` is read-only, the rest rewrite the gripper |
| `read_intrinsics.py` | Export the wrist camera intrinsics | Read-only |
| `wrist_camera.py` | Wrist camera viewer | Read-only |
| `tactile_sensor.py` | Visuotactile sensor viewer (SDK 0.4.4 and later) | Read-only |
| `rerun_viewer.py` | Gripper state, wrist camera and visuotactile in one view (SDK 0.4.4 and later) | Read-only |
| `ota_update.py` | Gripper firmware upgrade | **Flashes firmware** |
| `motor_ota_update.py` | Motor firmware upgrade | **Flashes firmware** |

```bash
python python/examples/calibrate.py right
python python/examples/leader_normalized_position.py right
python python/examples/wrist_camera.py --list                  # list cameras and their serial numbers
python python/examples/wrist_camera.py <camera serial> --undistort   # undistorted image
```

The follower gripper's scripts (self-check, keyboard control, impedance and force-position control and so on) are in [Follower gripper → Example scripts](../follower/api.md#examples).

<span id="firmware"></span>
Firmware upgrades: for a leader gripper see [Firmware OTA upgrade](../pc/versions.md#ota); for a follower gripper see [Firmware and motor upgrades](../follower/firmware.md).

### Visuotactile sensors {#tactile}

Included from SDK 0.4.4. Visuotactile images are read by `xensesdk`, which the standalone `taccap` environment already contains.

```bash
python python/examples/tactile_sensor.py --list     # which gripper and which finger each sensor is on
python python/examples/tactile_sensor.py left       # both sensors of the left gripper
python python/examples/tactile_sensor.py left --finger right --outputs rectify,difference
```

- `left` / `right` refers to the **gripper**, taken from the gripper on the same USB hub, so the gripper must be plugged in; the finger comes from the last digit of the sensor serial number, odd for left and even for right.
- The window shows one column per sensor: rectified image, marker flow, difference image and depth. Orientation and colours match what data collection records.
- **Do not touch the gel at startup**: the difference image and the force use the moment of startup as the no-contact reference. Press `c` to take a new reference (again with nothing touching).

### Full-chain check {#full-chain}

Included from SDK 0.4.4. It uses [Rerun](https://rerun.io) to put all of one gripper's data on a single timeline: gripper state (opening, velocity, torque, temperature, status bits), the wrist camera, and both visuotactile sensors (image, marker-flow arrows on top, resultant-force plot).

```bash
python python/examples/rerun_viewer.py left                  # view only, the motor does not move
python python/examples/rerun_viewer.py left --save rig.rrd --duration 20   # save to a file
```

- The green arrows on the image are marker flow: from each marker's rest position to where it is now, drawn the same way as `xensesdk`'s own `drawMarkerMove`, **at 1:1 with no gain**, so an arrow's length is the real displacement in pixels. With nothing touching, only green dots remain.
- To watch while opening and closing a follower gripper, use the keyboard console's `--rerun`; see [Follower gripper → Full-chain check](../follower/control.md#full-chain).
- With cameras and visuotactile sensors running together, every camera must use MJPEG; see [USB bandwidth budget](../pc/host-setup.md#usb-budget). If another program holds the wrist camera, add `--no-wrist`.

!!! warning "The Developer Kit collection environment shows images only"
    The collection environment has no visuotactile inference engine, so marker flow, resultant force and depth fail with `No module named 'onnxruntime'`. When running in the collection environment, add `--no-force` to `rerun_viewer.py` and `gripper_console.py --rerun`, and `--outputs rectify,difference` to `tactile_sensor.py`. The standalone `taccap` environment does not have this limit.

## Migrating from older versions {#migrate}

The full list of changes is in the SDK's [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.5.0/CHANGELOG.md).

**0.1.x / 0.2.x → 0.4.x**

- The follower gripper now uses controllers: `ImpedanceController` or `ForcePositionController`, configured with `for_spec()`. The old `ControlLoop`, `set_position()` and similar interfaces have been removed.
- Positive velocity and torque now consistently mean the closing direction.
- Follower gripper firmware must be 1.2.5 or later; below 1.2.11 you are prompted to upgrade.
- The example scripts now select a gripper with a positional argument `left` / `right` / serial number, and the old control-type example scripts have been removed.
- The wrist camera frames delivered by gripper objects are now RGB by default.

**0.3.x → 0.4.x**

- Force-position control now uses a single torque-limited control law, which holds more steadily when grasping; `snapshot().holding` becomes true about 150ms later than before, so revalidate any program that relies on it.
- When closing to 0, the final state may be either `HOLDING_FORCE` or `HOLDING_POSITION`; both are normal.
- During operation, `set_target(opening, grip_force)` with a grip force above 1.1N·m now raises an error instead of being silently accepted.
- New `g.motor.motor_version()` reads the motor firmware version (from gripper firmware 1.2.14 on, this works regardless of the motor's communication mode).

**0.4.1 → 0.4.3** (no API changes)

- `ForcePositionController` no longer stutters when following a streamed target, at the cost of about 10–15ms more tracking lag.
- A stall short of a target that is still moving enters `HOLDING_FORCE` about 150ms later than before; review programs that rely on it to detect a grasp.
- The bundled follower firmware moves to 1.2.16; [upgrade the firmware](../follower/firmware.md#mcu-ota).

**0.4.3 → 0.4.4** (no API changes)

- New [visuotactile](#tactile) and [full-chain check](#full-chain) examples.
- `environment.yml` adds `xensesdk` and `rerun-sdk` and pins NumPy to 2.2.4 (required by `xensesdk`). For an existing `taccap` environment, run `mamba env update -f environment.yml --prune`, then rerun `uv pip install -e . --no-build-isolation`.
- Log and error messages are now in English. Scripts that match on the Chinese message text need updating; for example the firmware-below-1.2.11 warning now reads `is below 1.2.11`.
- EL05 motor firmware ships with the SDK; without an image argument, `motor_ota_update.py` picks one from the motor model recorded on the gripper.

**0.4.4 → 0.4.5** (existing APIs unchanged)

- The bundled firmware moves to leader 1.2.7 / follower 1.2.17; [upgrade the firmware](../follower/firmware.md#mcu-ota). The new firmware moves the IMU / encoder device timestamps to a 1 MHz timebase, which SDK 0.4.5 handles; programs that parse device timestamps themselves need updating.
- New leader / follower time-shared exchange `start_exchange()`: host and gripper take turns on the link, so overlapping transmissions no longer drop frames. It needs firmware 1.2.7 / 1.2.17; on older leader firmware it falls back to ordinary streaming.
- The follower gripper can stream IMU.
- Device scanning releases the GIL and no longer stalls other threads in the same process.

**0.4.5 → 0.4.6** (no API changes)

- The byte-identical data frame that follower firmware 1.2.17 resends when transmissions overlap is now dropped, so it no longer steps the controller twice or reports a key press twice. The count is in `g.transport.stats.duplicate_data_dropped`; exchange mode is unaffected.

**0.4.6 → 0.5.0** (2026-11-23, existing APIs unchanged)

- The bundled firmware moves to leader / follower **1.3.1**; [upgrade the firmware](../follower/firmware.md#mcu-ota). The SDK adapts to the firmware's capabilities and still runs on 1.2.7 / 1.2.17.
- Wrist cameras can open at 1920×1080: `LeaderGripper` / `FollowerGripper` take `wrist_width`, `wrist_height` and `wrist_fps`; the default stays 640×480 at 30fps.
- Fisheye intrinsics are stored and selected per resolution, see [Wrist camera and fisheye undistortion](#camera). A gripper calibrated only at the other resolution raises on open; `fisheye_cal.py set-fisheye` requires `--width` / `--height`.
- `ForcePositionController.set_target(opening, grip=True)` marks the target as where contact is expected; a jaw stopped near the target is pressed with the grasp force. Without it, behavior is unchanged.
- Motion control supports configurable acceleration at startup and braking for smoother travel near endpoints. Use `grip=True` for thin-object grasping.
- Starting with leader firmware 1.2.7, IMU and encoder timestamps use a 1 MHz clock and wrap after about 71 minutes. The field format stays the same, but its semantics change. Use compatible SDK and host software.
- Firmware 1.3.1 raises the maximum IMU reporting rate from 100 Hz to 1125 Hz. The SDK can use high-rate IMU through timed exchange with `start_exchange()`. This is the firmware reporting limit. Recording and delivery rates depend on the collection workflow. RS00 motor status reporting was improved, and timed exchange can receive motor status and IMU while sending targets. Followers add accelerometer and gyroscope calibration and magnetometer capture, with improved initialization and homing.
- `close()` releases the wrist camera, so the same camera can be reopened right after.
- Firmware can be flashed with `ota_update.py slave left`, selecting a gripper by role plus side.
