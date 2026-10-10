# RobotConfig options

Workflow: [Data collection](recording.md); errors: [Troubleshooting](troubleshooting.md).

## Common `RobotConfig` options {#robotconfig}

| Option | Default | What it does |
|---|---|---|
| `robot.id` | **required** | Station number (`0` / `1` ...); leaving it out fails when the command line is parsed; the prefix from `robot.type` gives `taccap_0` / `bi_taccap_0` / `xtac_umi_g1_0` → [`--robot.id` and the hardware manifest](recording.md#robot-id) |
| `robot.side` | auto | `left`/`right`; required in **single-gripper mode** when both are plugged in |
| `robot.role` | `leader` | `follower` binds the follower gripper; firmware must be ≥ 1.2.5 (below 1.2.11 it warns to upgrade), see [Firmware OTA](versions.md#ota) |
| `robot.enable_tracker` | `true` | Off records tactile + gripper only |
| `robot.tracker_serial` | unset | Pin a tracker by SN, bypassing the side rule, unvalidated; a typo reports not found at connect |
| `robot.enable_wrist_camera` | `true` | Turns the wrist camera off |
| `robot.wrist_camera_width/_height/_fps` | — | Wrist camera resolution / frame rate |
| `robot.wrist_camera_fourcc` | `MJPG` | MJPG saves USB bandwidth for the tactile sensors; `YUYV` is uncompressed, only when bandwidth allows |
| `robot.wrist_undistort` / `_balance` | `false` / `0.0` | Wrist camera fisheye undistortion and its field-of-view setting, see [Fisheye undistortion](recording.md#57) |
| `robot.enable_head_camera` | `false` | **Single gripper only**: records the headset first-person view + pose; bimanual uses `--robot.type=xtac_umi_g1`, see [Head camera](recording.md#56) |
| `robot.head_camera_eyes` | `both` | `both` one key per eye; `left` / `right` records only that eye |
| `robot.head_camera_width/_height` | `640` / `480` | Size **per eye**; only `640x480` / `1024x768` / `1280x960`, must match the headset output |
| `robot.head_camera_fps` | `30` | Headset frame rate |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | Largest gap between the two eyes still treated as one exposure |
| `robot.head_camera_startup_timeout_s` | `5.0` | Seconds connect waits for the first frame |
| `robot.head_camera_stale_after_s` | `0.2` | A cached frame older than this warns as stale |
| `robot.enable_tactile` | `true` | Off means no tactile discovery and nothing written. **Diagnostic only** |
| `robot.tactile_fps` | `30` | Tactile frame rate |
| `robot.tactile_output_types` | `["rectify"]` | The tactile stream **written to disk**; **exactly one**, more is an error |
| `robot.tactile_display_output_types` | `["rectify"]` | Rerun display stream, **same as recorded by default** (empty list likewise); `["difference"]` adds a display-only stream |
| `robot.tactile_diff_gain` | `1.0` | Linear gain on the `difference` image, **inert by default**; `None` uses the factory value |
| `robot.expected_tactiles_per_side` | `2` | Tactile sensors per side; a mismatch is an error |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | The gripper's own readings / the IMU channel |
| `robot.gripper_stream_hz` | `100` | Leader encoder (incl. IMU) push rate; `0` polls every frame; on stream failure it falls back and warns |
| `robot.gripper_open_rad` | `1.7` | **Follower only**; a leader uses the measured travel limit in its firmware and is refused if uncalibrated, see [Gripper calibration](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | Override the tracker→EE translation; `None` = **built-in measured value** |
| `robot.tracker_to_ee_quat` | `None` | Override the tracker→EE rotation |
| `robot.tracker_wait_timeout` | `10.0` | Seconds to wait for tracker data |

The table is written for a single gripper; the full field list is in the main repo's device notes. On `bi_taccap_gripper`, `enable_wrist_camera`, `tracker_serial`, `enable_gripper`, `enable_imu`, `gripper_open_rad` and `tracker_to_ee_pos/_quat` are per side with a `left_` / `right_` prefix (for example `--robot.left_enable_wrist_camera`); the rest are shared by both sides, see [Parameters](recording.md#params).

Terms are in the [Glossary](../common/reference.md#glossary); feedback in [Support and feedback](../common/reference.md#support).
