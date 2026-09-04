# RobotConfig & SDK

A lookup appendix: `RobotConfig` options and the SDK entry point. The collection workflow is in [Data collection](recording.md); errors are in [Troubleshooting](troubleshooting.md).

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

## SDK and custom development

`xense.taccap` (the `taccap-gripper` SDK) is the C++17 / Python device access layer for the XTac-UMI G1. It talks to the gripper MCU over the serial protocol and provides the IMU, encoder, buttons, LEDs, sensor errors, calibration, OTA, and the motor control that only the follower gripper has; there is also an optional wrist UVC `Camera` class. It has two consumable surfaces: the `taccap_core` CMake target (`libtaccap_core.so`, for ROS2 / CMake projects to integrate with `add_subdirectory()`) and the `xense.taccap` Python extension, which the data-collection main repo consumes through the `third_party/taccap-gripper` submodule. Dataset recording, time alignment, episode splitting and the lerobot adaptation all live in the repo above it, not in the SDK. Build and install, examples, fisheye calibration and the API description are in the [TacCap-Gripper repo docs](https://github.com/XenseRobotics-AI/TacCap-Gripper/tree/main/docs).

Terms are in the [Glossary](../common/reference.md#glossary); feedback channels and related repositories are in [Support and feedback](../common/reference.md#support).
