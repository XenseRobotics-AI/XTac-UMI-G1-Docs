# Data collection

First confirm the devices work with `lerobot-teleoperate`, then record a `LeRobotDataset` with `lerobot-record`. Storage, checking and upload are in [Dataset](dataset.md).

## How collection works {#51}

- `taccap_gripper` recording is self-driven; there are no `--teleop.*` arguments.
- Shifted-frame pairing: the observation from step *t-1* is paired with the pose from step *t* as its action (EEF TCP pose + normalized `gripper.pos`, plus the headset pose with the [head camera](#56) on), so each episode is one frame shorter.
- `tcp.*` is the gripper tip, not the tracker, derived from the tracker pose through a built-in mount transform (one per side); the tip and tracker positions are defined in [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description).
- The world frame is gravity-aligned, X forward / Y left / Z up, frozen the instant XTac UMI XR starts; see [frame alignment](../common/pico4.md#pico-frame).
- `--display_data=true` opens Rerun's `/world` 3D view (`--show_trajectory=false` turns the trail off); see [Coordinate frames · The pose view during collection](../common/coordinates.md#world-view).

## Preview before recording {#preview}

`lerobot-teleoperate` only previews and writes nothing. It takes the same switches as recording; preview at the tier you will record at:

| Tier | Switches | Needs | Records |
|---|---|---|---|
| ① Grippers only | `--robot.type=bi_taccap_gripper --robot.enable_tracker=false` | No PC Service needed | Tactile, wrist cameras, `gripper.pos`; no `tcp.*` |
| ② With wrist pose (the usual one, this page's default) | `--robot.type=bi_taccap_gripper` | Tracker powered on and [bound](../common/pico4.md#pico-tracker-bind), Pico4U connected, [PC Service running](host-setup.md#35) | Adds `tcp.*` and the [`/world` view](../common/coordinates.md#world-view) |
| ③ Full setup | `--robot.type=xtac_umi_g1` | As for ②, plus PC Service ≥ v0.2.0 | Adds headset stereo frames and head pose, see [head camera](#56) |

```bash
lerobot-teleoperate \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --fps=30 \
    --display_data=true
```

- On a bimanual setup `--robot.type` decides whether the headset is included; a `--robot.enable_head_camera` that contradicts it fails and tells you which type to use.
- For a single gripper use `--robot.type=taccap_gripper`: with one connected it is picked automatically, with both connected add `--robot.side=left|right`.
- `--teleop_time_s=10` exits after ten seconds; `--debug_timing=true` prints sampling times and the camera count.

Check each item (pose rows only for ② and ③), then `Ctrl+C`:

| What | Expected |
|---|---|
| Both tactile streams | Showing; the texture changes clearly when pressed |
| Wrist camera | Showing, no cable or clutter in view |
| `gripper.pos` | 1.0 wide open, 0.0 closed; short of 1.0, see [calibration](calibration.md#413) |
| The EE marker and trail in `/world` | Smooth, no jumps or freezing; tracking is lost when the tracker leaves the headset's view or is blocked |
| Bimanual: the two trails | Independent and correctly matched |

## Recording {#52}

Devices are auto-discovered by serial number and each matched to left/right; tier switches and the single-gripper form are as in the preview.

```bash
lerobot-record \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.num_episodes=1 \
    --dataset.fps=30 \
    --dataset.push_to_hub=false \
    --dataset.episode_time_s=120 \
    --dataset.reset_time_s=60 \
    --dataset.single_task='Pick up the object'
```

- Rerun displays on its own thread and costs the collection loop nothing; a lagging viewer drops only on-screen frames and prints `Rerun display: N/M frames dropped …` at the end.
- If a camera or the gripper encoder is lost mid-recording (loose cable, hub brown-out), collection stops, saves what it has and prints `Device lost mid-recording`; no values are invented. Until a device is declared lost, its last good value is repeated (about 2s for a camera, 1s for the encoder), so the episode's last second or two may be stale; discard it. Check cabling and USB ports, then `--resume`.

### Episodes and resets {#55}

`--dataset.num_episodes=N` records several episodes per run; between episodes, reposition the scene within `--dataset.reset_time_s`. Keyboard controls while recording:

| Key | Effect |
|---|---|
| → | End the current episode early; during the reset phase, end the reset early |
| ← | Discard and re-record this episode; works during recording or the following reset, and the reset time is still given |
| Esc | Save the current episode, then stop recording |

The keyboard listener is global: arrow keys work in **any window**, including Rerun, which steps frames with left/right.

## Parameters {#params}

For the complete definitions see lerobot's official [recording guide](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset) (lerobot baseline 0.5.1).

### Dataset parameters `--dataset.*`

| Parameter | Default | Meaning |
|---|---|---|
| `repo_id` | required | `<org>/<name>`; naming convention in [Dataset](dataset.md#naming) |
| `single_task` | required | Task description, written to `meta/tasks`, e.g. `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | Local storage directory |
| `fps` | `30` | Sample-rate cap; the sensors themselves run at 120Hz ([specs](../product/specs.md#specs)) |
| `episode_time_s` | `120` | Length per episode (seconds) |
| `reset_time_s` | `60` | Reset time between episodes (seconds) |
| `num_episodes` | `50` | Number of episodes to record |
| `video` | `true` | Encode as mp4 video |
| `push_to_hub` | `false` | Upload to the Hub, see [Pushing to the Hugging Face Hub and backup](dataset.md#64) |
| `private` | `false` | Private Hub repo |
| `tags` | none | Hub tags |
| `streaming_encoding` | `true` | Live streaming encoding, see [streaming encoding](#54) |
| `vcodec` | `auto` | `h264`/`hevc`/`libsvtav1`/`auto`/a hardware encoder |
| `encoder_threads` | auto | Threads per encoder instance |
| `encoder_queue_maxsize` | `30` | Buffered frames per camera (~1s@30fps) |
| `video_encoding_batch_size` | `1` | Episodes accumulated before batch encoding (1=immediately) |

### Recording control (top-level parameters)

| Parameter | Default | Meaning |
|---|---|---|
| `robot.type` | required | `taccap_gripper` (single) / `bi_taccap_gripper` (bimanual) / `xtac_umi_g1` (bimanual + headset) |
| `robot.id` | required | Station number, see [`--robot.id`](#robot-id) |
| `fps` | `30` | Main-loop rate, separate from `--dataset.fps` (recording sample rate), usually the same |
| `display_data` | `false` | Show camera streams and the 3D view in Rerun |
| `show_trajectory` | `true` | Overlay the 3D pose + trajectory in Rerun (needs `display_data` and a `tcp.*`) |
| `display_compressed_images` | `false` | JPEG-compress before display, on the display thread; only pays off when the viewer is on another machine (`--display_ip`) |
| `display_image_every_n` | `1` | Refresh camera tiles every N frames (scalars at full rate); for choosing which display frames to drop yourself |
| `play_sounds` | `true` | Spoken announcements; always silent in the container (no speech synthesizer), audible on the host |
| `resume` | `false` | Continue an existing dataset; looks only locally and errors out if the dataset is not found; never downloads from the Hub; `--robot.id` must match the dataset |

### Device parameters `--robot.*` (RobotConfig) {#robotconfig}

| Option | Default | What it does |
|---|---|---|
| `robot.side` | auto | `left`/`right`; required in **single-gripper mode** when both are plugged in |
| `robot.role` | `leader` | `follower` binds the follower gripper; firmware must be ≥ 1.2.5 or it is refused, below 1.2.11 it warns to upgrade, see [Firmware OTA upgrade](versions.md#ota) |
| `robot.enable_tracker` | `true` | Off means no pose: tactile + gripper only |
| `robot.tracker_serial` | unset | Pin a tracker by SN, bypassing the side rule, unvalidated; a typo reports not found at connect. Use it when the serial does not conform or enumeration is flaky |
| `robot.enable_wrist_camera` | `true` | Turns the wrist camera off |
| `robot.wrist_camera_width/_height/_fps` | — | Wrist camera resolution / frame rate |
| `robot.wrist_camera_fourcc` | `MJPG` | MJPG saves USB bandwidth for the tactile sensors; `YUYV` is uncompressed, only when bandwidth allows |
| `robot.wrist_undistort` | `false` | Undistort the fisheye before recording, see [fisheye undistortion](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` keeps the calibrated focal length, `1` is widest with the most black border |
| `robot.enable_head_camera` | `false` | **Single gripper only**: records the headset first-person view + pose; bimanual uses `--robot.type=xtac_umi_g1`, see [head camera](#56) |
| `robot.head_camera_eyes` | `both` | `both` one key per eye; `left` / `right` records only that eye |
| `robot.head_camera_width/_height` | `640` / `480` | Size **per eye**; only `640x480` / `1024x768` / `1280x960`, must match the headset output |
| `robot.head_camera_fps` | `30` | Headset frame rate |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | Largest gap between the two eyes still treated as one exposure |
| `robot.head_camera_startup_timeout_s` | `5.0` | Seconds connect waits for the first frame |
| `robot.head_camera_stale_after_s` | `0.2` | A cached frame older than this warns as stale |
| `robot.enable_tactile` | `true` | Off means no tactile discovery and nothing written. **Diagnostic only**, see [the warning below](#53) |
| `robot.tactile_fps` | `30` | Tactile frame rate |
| `robot.tactile_output_types` | `["rectify"]` | The tactile stream **written to disk**; **exactly one**, more is an error |
| `robot.tactile_display_output_types` | `["rectify"]` | Rerun display stream, **same as recorded by default** (empty list likewise); `["difference"]` adds a display-only stream |
| `robot.tactile_diff_gain` | `1.0` | Linear gain on the `difference` image, **inert by default**; `None` uses the factory value |
| `robot.expected_tactiles_per_side` | `2` | Tactile sensors per side; a mismatch is an error |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | The gripper's own readings / the IMU channel |
| `robot.gripper_stream_hz` | `100` | Rate at which the leader firmware pushes encoder (and, when enabled, IMU) readings; `0` polls every frame; falls back to polling with a warning if the stream fails |
| `robot.gripper_open_rad` | `1.7` | **Follower only**; a leader uses the measured travel limit in its firmware and is refused if uncalibrated, see [Gripper calibration (zero + travel)](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | Override the tracker-to-gripper-tip translation; `None` = built-in value (matches [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description)) |
| `robot.tracker_to_ee_quat` | `None` | Override the tracker-to-gripper-tip rotation |
| `robot.tracker_wait_timeout` | `10.0` | Seconds to wait for tracker data |

!!! warning "On a bimanual setup, the per-unit flags take a `left_` / `right_` prefix"
    The table is written for a single gripper; the full field list is in the main repo's device notes. Under `bi_taccap_gripper` these exist once per side, and without the prefix the field does not exist:

    | Single | Bimanual |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | same, with the `left_` / `right_` prefix |
    | `--robot.gripper_open_rad`, `--robot.tracker_to_ee_pos/_quat` | same |

    Everything else is shared by both sides: `--robot.enable_tactile`, `--robot.enable_tracker`, `--robot.tactile_*`, `--robot.wrist_camera_width/_height/_fps/_fourcc`, `--robot.head_camera_*`, `--robot.gripper_stream_hz`.

### `--robot.id` and the hardware manifest {#robot-id}

`--robot.id` is required. It is the station number, one per setup (a bimanual setup is one setup), unchanged when a gripper is swapped. It is used in the log prefix, the calibration filename and the hardware manifest, not as a dataset column. Pass a bare number; the prefix is filled in from `--robot.type`:

| You type | `--robot.type` | Stored as |
|---|---|---|
| `--robot.id=0` | `taccap_gripper` (single) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper` (bimanual) | `bi_taccap_0` |
| `--robot.id=0` | `xtac_umi_g1` (bimanual + headset) | `xtac_umi_g1_0` |

Do not type the prefix by hand: non-numeric values are kept verbatim, so `--robot.id=taccap_0` still works, but on a bimanual setup it disagrees with the device type. A missing or blank id exits at command-line parse time:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

Device identity is recorded in the hardware manifest: `lerobot-record` writes `meta/hardware.json` right after `connect()`, with each gripper's firmware SN and the SNs of its two tactile sensors (each with its observation key).

```json
{
  "robot_type": "bi_taccap_gripper",
  "robot_id": "bi_taccap_0",
  "epochs": [
    {
      "from_episode": 0,
      "to_episode": null,
      "recorded_at": "2026-08-22T16:03:09+08:00",
      "robot_id": "bi_taccap_0",
      "role": "leader",
      "units": [
        {
          "side": "left",
          "gripper_sn": "TCGU01A24Z0001m",
          "tactile_sensors": [
            { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011" },
            { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012" }
          ],
          "wrist_undistort": { "applied": false }
        }
      ]
    }
  ]
}
```

- `side` is which gripper, `finger` is which tactile sensor on it, each decided by [odd-left / even-right](host-setup.md#33); `observation_key` maps a dataset column to a physical sensor.
- `gripper_sn` is the firmware SN, not the CH343 `mcu_serial` (which changes with the adapter).
- A single gripper has one entry in `units`; a side that is off records `"gripper_sn": null`; with `--robot.enable_tactile=false`, `tactile_sensors` is an empty list.
- It is a separate file, not in `meta/info.json`; trackers and wrist cameras are accessories and not listed.
- `wrist_undistort` records whether frames were undistorted and with which intrinsics; see [fisheye undistortion](#57).

`epochs` lets one dataset span several setups:

- Each epoch records `from_episode` / `to_episode` (half-open, matching `dataset_from_index` / `dataset_to_index`) and `recorded_at`; the open epoch has `to_episode` `null`.
- On `--resume` with the same setup no new epoch is recorded; after a gripper or sensor swap, the old epoch closes at the current episode count and a new one starts.
- A `--robot.type` mismatch is a different dataset, not a hardware swap: the original file is kept and a warning is logged. `bi_taccap_gripper` ↔ `xtac_umi_g1` (adding or dropping the headset) is also a different dataset, and a dataset recorded on an earlier version with the headset under `bi_taccap_gripper` cannot be resumed either; both need a new `--dataset.repo_id`.
- Older datasets (flat `units`) read back as one open epoch, which only says "nothing indicates the hardware changed".

**One dataset belongs to one station**: on `--resume`, a `--robot.id` that differs from the recorded one is refused before any device connects (the error contains `refusing to resume it`). Resume on the original station or use a new `--dataset.repo_id`; older datasets with no recorded station are exempt.

!!! note "The derived tactile channels can be rebuilt from the dataset alone"
    depth / force / difference are computed from the recorded `rectify` stream: the reference image is each episode's first `rectify` frame and everything else is fixed by the sensor model, so no physical unit is needed. A `meta/runtimes/` directory and per-sensor `runtime` key in older datasets are ignored.

## What each frame records {#53}

| Key | Source | Enabled by | Shape / type |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | Tracker → EEF TCP position | `--robot.enable_tracker` (default `true`) | float (m) |
| `tcp.r1`..`tcp.r6` | Same, orientation as a 6-D rotation | as above | float |
| `gripper.pos` | Gripper encoder | `--robot.enable_gripper` (default `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | Left and right visuotactile sensors | recorded by default; `--robot.enable_tactile=false` is diagnostic only, see the warning below | uint8, about `(400, 700, 3)`; size is derived automatically, do not hard-code it |
| `wrist_cam` | Wrist camera | `--robot.enable_wrist_camera` (default `true`) | uint8 `(H, W, 3)` |
| `head_left` / `head_right` | Headset stereo, one key per eye | `--robot.type=xtac_umi_g1` (single gripper: `--robot.enable_head_camera=true`) | uint8, `(480, 640, 3)` by default |
| `head.x/y/z` | Headset position (same world frame as `tcp.*`), also an action | as above | float (m) |
| `head.r1..r6` | Headset orientation as a 6-D rotation, also an action | as above | float |
| `imu.accel.{x,y,z}` | Gripper IMU acceleration | `--robot.enable_imu` (default `false`, reserved, not recorded) | float (m/s²) |
| `imu.gyro.{x,y,z}` | Gripper IMU angular rate | as above | float (rad/s) |
| `imu.mag.{x,y,z}` | Gripper IMU magnetometer | as above | float (µT) |

The 6-D rotation stores the first two columns (by column, not by row) of the rotation matrix R (world ← body), the same for `tcp.*` and `head.*`:

```text
R = ⎡ r1  r4  · ⎤     column 1 (r1,r2,r3) = direction of the body X axis in the world frame
    ⎢ r2  r5  · ⎥     column 2 (r4,r5,r6) = direction of the body Y axis in the world frame
    ⎣ r3  r6  · ⎦     column 3 = cross product of the first two; recompute it yourself
```

`observation.state` dimensions: 10 for a single gripper, 20 for bimanual; the headset adds 9 to each (19 / 29); `--robot.enable_imu=true` (on a bimanual setup it applies to both sides at once, with keys prefixed `left_` / `right_`) adds another 9 for a single gripper and 18 for bimanual (19 / 38 without the headset).

!!! warning "`--robot.enable_tactile=false` is a diagnostic switch, do not record with it"
    When it is off, the tactile sensors are not discovered, recorded or keyed. It exists only to bisect a USB bandwidth problem; see [a camera that will not open](troubleshooting.md#usb-bandwidth). To record one stream fewer, use `--robot.enable_wrist_camera=false` or `--robot.enable_tracker=false`.

!!! tip "By default, what you see in Rerun is what lands on disk"
    - On disk (`--robot.tactile_output_types`) and on screen (`--robot.tactile_display_output_types`) both default to `rectify` (the raw image with no baseline subtraction), so each sensor is read once per frame and screen and dataset show the same image.
    - Pointing display at another type adds a display-only, never-recorded output on the same read, keyed like `tactile_left_difference` and not in `observation_features`.

    `difference` is an enhanced difference image against the baseline captured at init. If you turn it on (`--robot.tactile_display_output_types='["difference"]'`):

    - It is destructive: force on the gel at connect time is subtracted from the whole session, so keep all four fingertips unloaded at connect.
    - Never switch `--robot.tactile_output_types` to `difference` just because it looks clearer.
    - `--robot.tactile_diff_gain` does nothing unless `difference` is requested; the factory value of 1.5 is noisy on this gel and clips.

## Streaming encoding {#54}

Video keys are encoded live (`--dataset.streaming_encoding=true`, on by default) rather than from PNGs at episode end, so there is almost no wait after an episode.

- One encoder thread per camera, fed through a bounded queue (`--dataset.encoder_queue_maxsize`, about one second of frames); when full it waits up to 0.1s, then drops the current frame and warns `Encoder queue full … dropped N frame(s)` without blocking collection.
- Saving is transactional: a failed save or a Ctrl+C rolls back to the last complete episode, never leaving half an episode, and `--resume` carries on.
- `--dataset.vcodec=auto` prefers hardware encoding, so an NVIDIA GPU's H.264 encoder takes load off the CPU; cap the threads per encoder with `--dataset.encoder_threads=2` if needed.
- Encoder warm-up is automatic: encoders are ready before each episode, so warm-up does not eat into the first frame's time budget.

### Recording on a collection PC with no NVIDIA GPU {#no-gpu}

!!! warning "This is a workaround for a machine below the minimum specification, not a recommendation"
    A CPU-only server, a VM or a laptop with no NVIDIA card (below the [collection PC minimum](install.md#host-spec)) can record as below, but saves are slow and frames drop sooner; use a compliant collection PC for real collection. Upgrade such machines to v0.1.0 first.

Turn streaming encoding off:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

- `--dataset.vcodec=auto` probes by actually opening an encode session and falls back to `libsvtav1` (AV1 on the CPU) with no NVIDIA driver; offline re-encoding chooses the same way (`h264_nvenc` with NVIDIA). Passing `--dataset.vcodec=libsvtav1` explicitly also works.
- With `libsvtav1` the CPU both encodes and captures within a 33.3ms budget at 30fps, so `[slow_frame] ... overrun=` appears. With streaming off, frames are batch-encoded at `save_episode()`: a slow save only means waiting, whereas a dropped frame cannot be recovered. Ignore the reminder to turn streaming encoding back on.

To keep streaming encoding on a many-core server, tune these:

| Parameter | Default | When to touch it |
|---|---|---|
| `--dataset.encoder_threads` | auto | On a big machine `libsvtav1` takes CPU cores that capture needs; `2` per encoder is a safe cap |
| `--dataset.encoder_queue_maxsize` | `30` | About 1s of buffer at 30fps; a back-pressure valve that stops memory growing when encoding falls behind |

## Collection standards {#practice}

Record 5–10 episodes first, verify with [`lerobot-check-dataset`](dataset.md#62) and replay a few, then scale up. One complete demonstration per episode, never several attempts; keep the pace similar across demonstrations of the same task.

| Dimension | Good | Bad-sample symptom | How to avoid it |
|---|---|---|---|
| Completeness | Approach → grasp → manipulate → finish | Interrupted | Finish naturally |
| Steadiness | Smooth, even motion | Abrupt stops and turns, noisy IMU/pose | Move evenly |
| Tactile signal | Real contact and deformation | Empty grasp, no signal in the tactile image (tactile is the core modality, so an empty grasp is worth very little) | Confirm contact in the Rerun tactile view |
| Camera visibility | Target within the wrist camera's view, stable lighting | Hand or cable blocking it, or overexposure/flicker | Clear obstructions, adjust the grip angle |
| Coordinate consistency | Same origin as other episodes | XTac UMI XR restarted mid-collection, pose jumps between episodes | Never restart XTac UMI XR during collection; if you must, treat everything after it as a new dataset ([why](../common/pico4.md#pico-frame)) |
| Gripper reading | `gripper.pos` ≈ 0 closed, sensible when open | Not calibrated, `gripper.pos` ≠ 0 when closed | Calibrate both sides of a bimanual setup, see [gripper calibration](calibration.md#41) |
| Dropped frames | No warnings | Dropped-frame warnings in the log | Raise `encoder_threads`, use `vcodec=auto`, see [streaming encoding](#54) |
| First frame | The motion starts normally | The key action lands in the dropped first frame | Hold still 0.5–1s after start |

- **Consistency and diversity**: keep the task definition (`--dataset.single_task`), the intent of the motion and the coordinate origin consistent; vary the object's initial pose and position, the grasp point and the lighting moderately. One task/variant per dataset, see [Naming](dataset.md#naming).
- **Episode length**: give `--dataset.episode_time_s` enough room but not too much, or many idle frames accumulate at the end.
- **Record**: keep one [collection record](dataset.md#ledger) row per dataset.

Check before every recording run:

- [ ] [Preview](#preview) done: `scan_grippers` output is sensible, the tracker is charged, has a pose and a sensible trajectory
- [ ] `gripper.pos` ≈ 0 when closed
- [ ] On the wired link, the collection PC's Wi-Fi is off (see [network](../common/pico4.md#pico-network))
- [ ] Tactile images carry signal when grasping, wrist camera view unobstructed
- [ ] `single_task` matches this dataset
- [ ] Enough free disk space (see [storage planning](dataset.md#storage-planning))
- [ ] XTac UMI XR not restarted during collection, no dropped-frame warnings

## Optional: head camera {#56}

Records the Pico4 Ultra Enterprise headset's stereo frames and pose (the operator's first-person view) as `head_left` / `head_right` and `head.*` (see [what each frame records](#53)); the latter also goes into the action. Bimanual uses `--robot.type=xtac_umi_g1`, the single-gripper `taccap_gripper` adds `--robot.enable_head_camera=true`; the parameters below apply to both.

```bash
lerobot-record \
    --robot.type=xtac_umi_g1 \
    --robot.id=0 \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.single_task='Pick up the object' \
    --dataset.fps=30 \
    --dataset.push_to_hub=false
```

- `left_` / `right_` means the headset's left / right eye, not the hands (only `{side}_wrist` and `{side}_tcp.*` are per hand); two single-gripper processes that both enable it get the same stream.
- Prerequisites: XenseVR PC Service ≥ v0.2.0 (older versions do not forward frames); the headset app is streaming and connected to the [PC Service](host-setup.md#35). Camera and tracker share one SDK connection; turning one off does not disconnect the other.

- `--robot.head_camera_eyes=left` (or `right`) records one eye: half the decoding and encoder load, one head video key.
- Changing the resolution or eye selection changes the data; episodes recorded before and after the change cannot be mixed.
- The eyes are two independent messages, so each frame compares both eyes' newest frames: identical sequence numbers mean the same exposure, otherwise timestamps must agree within `--robot.head_camera_pair_max_skew_ms` (default 20ms, against about 33ms per frame at 30fps); exceeding it only logs a rate-limited warning with the measured skew, and recording continues.
- `head.*` is mapped into the `tcp.*` world frame with the tracker's Pico→world transform.

!!! warning "The headset's resolution and `--robot.head_camera_width/_height` must agree"
    Only `640x480` (default), `1024x768` and `1280x960` are accepted. XTac UMI XR outputs 640x480 per eye by default, matching the collection unit, so there is nothing to pass; the flags only declare what you expect.

    - Any other value, or a first frame that disagrees with the config (at connect), is an error; nothing is silently resampled to change the field of view.
    - All three are 4:3, like the sensor (the PICO camera API's per-frame cap of 2328x1748 is also 4:3); 16:9 only gets a crop or a stretch.
    - For a higher resolution, contact [technical support](../common/reference.md#support) to change it on the headset, and change both flags to match.

If it will not connect, see [Troubleshooting · Head camera](troubleshooting.md#head-camera).

## Optional: wrist camera fisheye undistortion {#57}

The wrist camera is a 190° fisheye, recorded raw by default. `--robot.wrist_undistort=true` rectifies it to a rectilinear projection before writing, using the intrinsics in this gripper's flash; `--robot.wrist_undistort_balance` sets the field of view. Only 640×480 is supported (the firmware fisheye record holds only 8 floats, no image size), so a different `--robot.wrist_camera_width/_height` exits at command-line parse time.

!!! warning "On and off produce two kinds of data, and you cannot tell them apart"
    Rectified and raw `wrist_cam` have identical shape and dtype and mix silently, so recording writes which was used into every unit of [`meta/hardware.json`](#robot-id) (`{"applied": false}` if not undistorted):

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` is `"unit"` (this gripper's own calibration) or `"reference"` (the SDK's reference values); changing the setting mid-recording opens a new epoch. Use one setting per dataset.

### What happens when the fisheye calibration cannot be read {#fisheye-fallback}

In these cases undistortion does not fail but falls back to the SDK's built-in reference intrinsics, warns `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate` and records `"calibration": "reference"` in the manifest:

- The lens was never calibrated (`read_fisheye()` returns `None`).
- The firmware returns an all-zero record (1.1.1 and 1.2.2 both do): test with `is_usable_fisheye_cal()`, not `is None`, or the remap table from `fx = fy = 0` yields a pure black image without raising.
- The firmware predates command set V2.0.

In code, prefer `Calibration::resolve_fisheye()` (returns `(calibration, is_reference, reason)`) over `read_fisheye()`.

- **The reference values are only good enough for viewing**: the principal point drifts per unit (37.7px off on one unit). To measure in pixels on the rectified image (visual servoing, hand-eye calibration, size estimation), store this unit's own calibration first: `python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye right` (with two connected, pick `left` / `right` or a full SN; omit with one).
- **An off-center or slightly tilted rectified frame does not mean bad calibration**: undistortion centers on the principal point, not the frame center, and the sensor need not sit on the optical center (one unit: `cx = 359.1`, fingertip midpoint x = 360.1, about 1px apart). Do not change `cx`; forcing 320 makes it worse and adds tilt.
