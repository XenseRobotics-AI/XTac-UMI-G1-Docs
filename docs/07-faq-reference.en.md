# 7. FAQ & Reference

## 7.1 Frequently asked questions

Error messages and things that go wrong on the bench have their own chapter,
**[Troubleshooting](troubleshooting.md)** (organised as symptom → cause → fix).
This page keeps the configuration options, the glossary and the appendix.

## 7.2 Common `RobotConfig` options

| Option | Default | What it does |
|---|---|---|
| `robot.id` | **required** | The station number for this rig — pass a bare number (`0`, `1`, …) and the prefix is filled in from `robot.type`, giving `taccap_0` / `bi_taccap_0`. Leaving it out fails at CLI-parse time → [`--robot.id` and the hardware manifest](05-data-collection.md#robot-id) |
| `robot.side` | auto | `left` / `right`. Required in **single-gripper mode** when both grippers are plugged in; a lone unit is picked automatically |
| `robot.role` | `leader` | Set `follower` to bind the follower gripper |
| `robot.enable_tracker` | `true` | Off records tactile + gripper only |
| `robot.tracker_serial` | unset | Pin a tracker by SN, bypassing the side rule |
| `robot.enable_wrist_camera` | `true` | Turns the wrist camera off |
| `robot.wrist_camera_width/_height/_fps` | — | Wrist camera resolution / frame rate |
| `robot.wrist_camera_fourcc` | `MJPG` | Wrist pixel format. MJPG by default so the tactile sensors on the same hub get the USB bandwidth |
| `robot.enable_head_camera` | `false` | Headset camera (first-person view + headset pose), see [5.6](05-data-collection.md#56) |
| `robot.head_camera_eyes` | `both` | `both` = one key per eye; `left` / `right` records only that one |
| `robot.head_camera_width/_height` | `640` / `480` | Size **per eye**; only `640x480`, `1024x768` and `1280x960` are accepted, and it must match the headset's "Resolution" |
| `robot.head_camera_fps` | `30` | Headset camera frame rate |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | When the two eyes carry different frame numbers, the largest time difference still treated as one exposure |
| `robot.head_camera_startup_timeout_s` | `5.0` | Seconds to wait for the first frame at connect |
| `robot.head_camera_stale_after_s` | `0.2` | A cached frame older than this counts as stale and warns |
| `robot.enable_tactile` | `true` | Off disconnects the whole tactile chain. **A diagnostic, not a recording mode** |
| `robot.tactile_fps` | `30` | Tactile frame rate |
| `robot.tactile_output_types` | `["rectify"]` | The tactile stream that **reaches the dataset**; **exactly one** — more than one is an error |
| `robot.tactile_display_output_types` | `["difference"]` | Extra tactile streams **for Rerun only**, never recorded; an empty list turns them off |
| `robot.tactile_diff_gain` | `1.0` | Linear gain on the `difference` image (display stream only); `None` = the sensor's factory value |
| `robot.expected_tactiles_per_side` | `2` | How many tactile sensors each side should have; a mismatch is an error |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | Gripper's own readings / the IMU channel |
| `robot.gripper_open_rad` | `1.7` | **Follower only.** A leader always uses the measured travel limit in its own firmware, and this option does nothing for it — an uncalibrated leader is refused a connection rather than falling back to this constant. See [4.1](04-calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | Override the tracker→EE translation; `None` = that side's **built-in measured value** |
| `robot.tracker_to_ee_quat` | `None` | Override the tracker→EE rotation (same idea; the two can be overridden independently) |
| `robot.tracker_wait_timeout` | `10.0` | Seconds to wait for tracker data while connecting devices |

!!! note "The full field list"
    The table above is the commonly used subset; the device notes shipped with the main repo are
    authoritative for the complete set.

!!! warning "Bimanual: the per-unit options take a `left_` / `right_` prefix"
    The table is written for a single gripper. On `bi_taccap_gripper`, `enable_wrist_camera`,
    `tracker_serial`, `enable_gripper`, `enable_imu`, `gripper_open_rad` and
    `tracker_to_ee_pos/_quat` are **one per side** (`--robot.left_enable_wrist_camera` and so on).
    Tactile, the tracker master switch, the wrist camera resolution and the headset camera are
    shared by both sides. See [5.2 Parameters in detail](05-data-collection.md#params).

## 7.3 Glossary

| Term | Meaning |
|---|---|
| **TacCap** | The name inside the package `xense.taccap` and the robot type `taccap_gripper` (Tactile Capture); the product name is XTac-UMI G1 |
| **UMI** | Universal Manipulation Interface — the handheld leader-gripper collection paradigm |
| **Leader / Follower** | Leader gripper / follower gripper; the serial's patch letter says which — `m` = leader, `s` = follower |
| **V2.1** (firmware) | The firmware's **command set** version — which commands it implements. Not the build number (that is leader `≥ 1.2.0` / follower `≥ 1.1.0`, and higher builds support it too), and not the wire framing (which is V1.8). The travel-calibration command arrived in V2.1 → [Three numbering schemes](versions.md#v21) |
| **Odd is left, even is right** | The last digit of the 4-digit serial: odd → left, even → right |
| **GSPS** | Visuotactile sensor (one per finger), serial `GSPS01...` |
| **XC** | The wrist UVC camera, serial `XC...` |
| **tcp** | Tool Center Point — the end-effector pose (`tcp.x/y/z` plus the 6D rotation `r1..r6`) |
| **6D rotation** | The **first two columns** of the rotation matrix R (world ← body): `r1..r3` = first column = the body X axis expressed in the world frame, `r4..r6` = second column = the Y axis. The third column is their cross product, so it can be recovered → [the convention in detail](05-data-collection.md#53) |
| **shifted-frame** | Shifted-frame pairing: the observation at t-1 goes with the action at t |
| **self-driven** | The device produces both the observation and the demonstrated action itself; there is no separate teleoperator |

## 7.4 What this manual covers

!!! note "Scope"
    This manual covers the whole path **from the collection gripper hardware to data on disk as a
    `LeRobotDataset`** (overview/hardware → environment setup → collecting with the software →
    the recorded data and what is in it).
    **Model training, inference and deployment are out of scope** — see the documentation for
    those projects.

---

## References

- The device notes shipped with the collection repo [`xense-taccap-lerobot`](https://github.com/Vertax42/xense-taccap-lerobot)
- The gripper SDK [`TacCap-Gripper`](https://github.com/Vertax42/TacCap-Gripper) (submodule `third_party/taccap-gripper/`)
- The tracker's PC service [`XenseVR-PC-Service`](https://github.com/Vertax42/XenseVR-PC-Service) (**not a submodule** — installed as a `.deb` into `/opt/apps/roboticsservice`, see [2.4 One-shot install](02-environment.md#24))
- The visuotactile sensor SDK [`xensesdk`](https://github.com/XenseRobotics/xensesdk) · [docs site](https://xensedoc.readthedocs.io/en/latest/)
