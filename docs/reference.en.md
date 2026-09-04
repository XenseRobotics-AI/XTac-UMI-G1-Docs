# Reference

A lookup appendix: `RobotConfig` options, the glossary, the SDK entry point, feedback channels and related repositories. The collection workflow is in [Data collection](recording.md); errors are in [Troubleshooting](troubleshooting.md).

## Common `RobotConfig` options {#robotconfig}

| Option | Default | What it does |
|---|---|---|
| `robot.id` | **required** | The station number for this rig; pass a bare number (`0` / `1` ...) and the prefix is filled in from `robot.type` to give `taccap_0` / `bi_taccap_0`. Leaving it out fails at command-line parse time → [`--robot.id` and the hardware manifest](recording.md#robot-id) |
| `robot.side` | auto | `left`/`right`; required in **single-gripper mode** when both grippers are plugged in, picked automatically when only one is |
| `robot.role` | `leader` | Set `follower` to bind the follower gripper |
| `robot.enable_tracker` | `true` | Off records tactile + gripper only |
| `robot.tracker_serial` | unset | Pin a tracker by SN, bypassing the side rule; used verbatim and not validated, so a typo reports not found at connect |
| `robot.enable_wrist_camera` | `true` | Turns the wrist camera off |
| `robot.wrist_camera_width/_height/_fps` | — | Wrist camera resolution / frame rate |
| `robot.wrist_camera_fourcc` | `MJPG` | Wrist camera pixel format; the MJPG default leaves USB bandwidth for the tactile sensors on the same hub, `YUYV` is uncompressed and only for when bandwidth allows |
| `robot.wrist_undistort` / `_balance` | `false` / `0.0` | Undistort the wrist camera fisheye before writing to disk, and its field-of-view setting, see [Fisheye undistortion](recording.md#57) |
| `robot.enable_head_camera` | `false` | Head camera (first-person view + headset pose), see [Head camera](recording.md#56) |
| `robot.head_camera_eyes` | `both` | `both` = one key per eye; `left` / `right` records only that eye |
| `robot.head_camera_width/_height` | `640` / `480` | Size **per eye**; only `640x480` / `1024x768` / `1280x960` are accepted, and it must match the "Resolution" set in the headset |
| `robot.head_camera_fps` | `30` | Head camera frame rate |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | When the two eyes carry different frame numbers, the largest time difference still treated as one exposure |
| `robot.head_camera_startup_timeout_s` | `5.0` | Seconds to wait for the first frame at connect |
| `robot.head_camera_stale_after_s` | `0.2` | A cached frame older than this counts as stale and warns |
| `robot.enable_tactile` | `true` | Off leaves the whole tactile chain unconnected (no discovery, nothing written). **A diagnostic, not a recording mode** |
| `robot.tactile_fps` | `30` | Tactile frame rate |
| `robot.tactile_output_types` | `["rectify"]` | The tactile stream **written to disk**; **exactly one**, more than one is an error |
| `robot.tactile_display_output_types` | `["difference"]` | Extra tactile streams **for Rerun display only**, never written to disk; an empty list turns them off |
| `robot.tactile_diff_gain` | `1.0` | Linear gain on the `difference` image (display stream only); `None` = the sensor's factory value |
| `robot.expected_tactiles_per_side` | `2` | How many tactile sensors each side should have; a mismatch is an error |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | The gripper's own readings / the IMU channel |
| `robot.gripper_open_rad` | `1.7` | **Follower only.** A leader always uses the measured travel limit in its own firmware, and this option does nothing for it: an uncalibrated leader is refused a connection rather than falling back to this constant. See [Gripper calibration](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | Override the tracker→EE translation; `None` = that side's **built-in measured value** |
| `robot.tracker_to_ee_quat` | `None` | Override the tracker→EE rotation (same idea; the two can be overridden independently) |
| `robot.tracker_wait_timeout` | `10.0` | Seconds to wait for tracker data while connecting devices |

The table above is the commonly used subset; the device notes shipped with the main repo are authoritative for the complete field list.

The table is written for a single gripper. On `bi_taccap_gripper`, `enable_wrist_camera`, `tracker_serial`, `enable_gripper`, `enable_imu`, `gripper_open_rad` and `tracker_to_ee_pos/_quat` are one per side and take a `left_` / `right_` prefix (for example `--robot.left_enable_wrist_camera`); the rest are shared by both sides, see [Parameters](recording.md#params).

## Glossary {#glossary}

| Term | Meaning |
|---|---|
| **TacCap** | The name inside the package `xense.taccap` and the robot type `taccap_gripper` (Tactile Capture); the product name is XTac-UMI G1 |
| **UMI** | Universal Manipulation Interface, the handheld leader-gripper data-collection paradigm |
| **Leader / Follower** | Leader gripper / follower gripper; the serial number's patch letter `m` = leader, `s` = follower |
| **V2.1** (firmware) | The firmware's **command set** version, i.e. which commands it implements. Not the build number (that is leader `≥ 1.2.0` / follower `≥ 1.1.0`, and higher builds support it too), and not the frame format (which is V1.8). The travel-calibration command arrived in V2.1 → [Three numbering schemes](versions.md#v21) |
| **Odd is left, even is right** | The last digit of the 4-digit serial number: odd → left, even → right |
| **GSPS** | Visuotactile sensor (one on each finger), serial number `GSPS01...` |
| **XC** | The wrist UVC camera, serial number `XC...` |
| **tcp** | Tool Center Point, the end-effector pose (`tcp.x/y/z` + the 6D rotation `r1..r6`) |
| **6D rotation** | The **first two columns** of the rotation matrix R (world ← body): `r1..r3` = first column = the body X axis expressed in the world frame, `r4..r6` = second column = the Y axis. The third column is their cross product and can be recovered → [the convention in detail](recording.md#53) |
| **shifted-frame** | Shifted-frame pairing: the observation at t-1 goes with the action at t |
| **self-driven** | The device itself produces both the observation and the demonstrated action; there is no separate teleoperation end |

## SDK and custom development

`xense.taccap` (the `taccap-gripper` SDK) is the C++17 / Python device access layer for the XTac-UMI G1. It talks to the gripper MCU over the serial protocol and provides the IMU, encoder, buttons, LEDs, sensor errors, calibration, OTA, and the motor control that only the follower gripper has; there is also an optional wrist UVC `Camera` class. It has two consumable surfaces: the `taccap_core` CMake target (`libtaccap_core.so`, for ROS2 / CMake projects to integrate with `add_subdirectory()`) and the `xense.taccap` Python extension, which the data-collection main repo consumes through the `third_party/taccap-gripper` submodule. Dataset recording, time alignment, episode splitting and the lerobot adaptation all live in the repo above it, not in the SDK. Build and install, examples, fisheye calibration and the API description are in the [TacCap-Gripper repo docs](https://github.com/XenseRobotics-AI/TacCap-Gripper/tree/main/docs).

## Support and feedback {#support}

If you hit a problem:

1. Check [Troubleshooting](troubleshooting.md) first (it includes the FAQ).
2. Problems with the documentation's content, links or examples go to the [docs repository Issues](https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs/issues).
3. Hardware, firmware, calibration materials or repair matters go through the device delivery / after-sales channel, with the device SN.

Please include:

- The complete error and the relevant logs, untruncated.
- The side / role / firmware_sn output from `scan_grippers`.
- The output of the command in [How to check versions](versions.md#check-versions).
- Steps to reproduce, the full command, single or bimanual, and whether the tracker was enabled.
- For anything involving cameras or hardware assembly, photos of the device connections and of what looks wrong.

## References

| Resource | URL | Notes |
|---|---|---|
| Data-collection main repo `xense-taccap-lerobot` | <https://github.com/XenseRobotics-AI/xense-taccap-lerobot> | Ships the device notes and the CHANGELOG |
| Gripper SDK `TacCap-Gripper` | <https://github.com/XenseRobotics-AI/TacCap-Gripper> | Submodule `third_party/taccap-gripper/`; SDK docs in `docs/` |
| Tracker PC service `XenseVR-PC-Service` | <https://github.com/XenseRobotics-AI/XenseVR-PC-Service> | Not a submodule; installed as a `.deb` into `/opt/apps/roboticsservice`, see [One-shot install](install.md#24) |
| Visuotactile sensor SDK `xensesdk` | <https://github.com/XenseRobotics/xensesdk> | [Docs site](https://xensedoc.readthedocs.io/en/latest/) |
| This manual's source | <https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs> | Issues: see the section above |

## What this manual covers

This manual only covers the path from the data-collection gripper hardware to data on disk as a `LeRobotDataset`. Model training, inference and deployment are out of scope; see the separate documentation of those projects.
