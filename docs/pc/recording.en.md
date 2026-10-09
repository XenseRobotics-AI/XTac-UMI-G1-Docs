# Data collection

First confirm the devices work with `lerobot-teleoperate`, then record a `LeRobotDataset` with `lerobot-record`. Storage, layout, checking and upload are in [Dataset](dataset.md).

## How collection works {#51}

- `taccap_gripper` recording is self-driven; there are no `--teleop.*` arguments.
- Shifted-frame pairing: the observation from step *t-1* is paired with the pose from step *t* as its action (EEF TCP pose + normalised `gripper.pos`, plus the headset pose with the [head camera](#56) on), so each episode is one frame shorter.
- `tcp.*` is the gripper tip, not the tracker: the tracker sits about 195 mm from the two-finger midpoint, and a built-in rigid mount transform (measured off the CAD assembly, one per side) is applied before writing. It is body-fixed and independent of orientation and `gripper.pos`.
- The world frame is gravity-aligned, X forward / Y left / Z up, frozen the instant XTac-UMI XR starts; see [frame alignment](../common/pico4.md#pico-frame).
- `--display_data=true` opens Rerun's `/world` 3D view (`--show_trajectory=false` turns the trail off); what it shows and the mount check are in [Coordinate frames · The `/world` 3D view](../common/coordinates.md#world-view).

## Preview before recording {#preview}

`lerobot-teleoperate` only previews and writes nothing. It takes the same switches as recording; preview at the level you will record at:

| Level | Switches | Needs | Adds |
|---|---|---|---|
| ① Grippers only | `--robot.type=bi_taccap_gripper --robot.enable_tracker=false` | No PC Service needed | Both tactile streams, the wrist camera, `gripper.pos`; no `tcp.*` |
| ② With wrist pose (the usual one, this page's default) | `--robot.type=bi_taccap_gripper` (the tracker is on by default) | Tracker powered on and [bound](../common/pico4.md#pico-tracker-bind), Pico4 connected, [PC Service running](host-setup.md#35) | [`/world` view](../common/coordinates.md#world-view) / `tcp.*` |
| ③ Full rig | `--robot.type=xtac_umi_g1` | As for ②, plus PC Service ≥ v0.2.0 | Headset stereo frames and head pose, see [head camera](#56) |

Preview at level ②:

```bash
lerobot-teleoperate \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --fps=30 \
    --display_data=true
```

- On a bimanual rig `--robot.type` decides whether the headset is included; a `--robot.enable_head_camera` that contradicts it fails and tells you which type to use.
- For a single gripper use `--robot.type=taccap_gripper`: with one connected it is picked automatically, with both connected add `--robot.side=left|right` (required when recording only one).
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

Devices are auto-discovered by serial number and each matched to left/right; level switches and the single-gripper form are as in the preview.

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

- Rerun displays on its own thread, so leaving `--display_data` on costs the collection loop nothing; a lagging viewer drops only on-screen frames and prints `Rerun display: N/M frames dropped …` at the end.
- Spell out `fps=30`, `episode_time_s=120`, `reset_time_s=60` and `push_to_hub=false` rather than relying on defaults.
- If a camera or the gripper encoder is lost mid-recording (loose cable, hub brown-out), collection stops, saves what it has and prints `Device lost mid-recording`; no values are invented. The last good value is carried before loss is declared (about 2 s for a camera, 1 s for the encoder), so the episode's last second or two may be stale; discard it. Check cabling and USB ports (see [Troubleshooting](troubleshooting.md)), then `--resume`.

### Parameters {#params}

For the complete definitions see lerobot's official [recording guide](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset) (lerobot baseline 0.5.1).

**Dataset parameters `--dataset.*`**

| Parameter | Default | Meaning |
|---|---|---|
| `repo_id` | required | `<org>/<name>`; convention `<org>/<task>_<variant>_<YYYYMMDD>`, e.g. `Xense/insert_plug_left_20260703`, see [Dataset](dataset.md) |
| `single_task` | required | Task description, written to `meta/tasks`, e.g. `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | Local storage directory, see [Dataset](dataset.md) |
| `fps` | `30` | Sample-rate cap; the sensors themselves run at 120 Hz ([specs](../product/specs.md#specs)) |
| `episode_time_s` | `120` | Length per episode (seconds) |
| `reset_time_s` | `60` | Reset time between episodes (seconds) |
| `num_episodes` | `50` | Number of episodes to record |
| `video` | `true` | Encode as mp4 video |
| `push_to_hub` | `false` | Upload to the Hub, see [Dataset](dataset.md#64) |
| `private` | `false` | Private Hub repo |
| `tags` | none | Hub tags |
| `streaming_encoding` | `true` | Live streaming encoding, see [streaming encoding](#54) |
| `vcodec` | `auto` | `h264`/`hevc`/`libsvtav1`/`auto`/a hardware encoder |
| `encoder_threads` | auto | Threads per encoder instance |
| `encoder_queue_maxsize` | `30` | Buffered frames per camera (~1s@30fps) |
| `video_encoding_batch_size` | `1` | Episodes accumulated before batch encoding (1=immediately) |

**Recording control (top-level parameters)**

| Parameter | Default | Meaning |
|---|---|---|
| `robot.type` | required | `taccap_gripper` (single) / `bi_taccap_gripper` (bimanual) / `xtac_umi_g1` (bimanual + headset) |
| `robot.id` | required | Station number; pass a bare number (`0` / `1`…), prefix added automatically; omitting it is an error, see [`--robot.id`](#robot-id) |
| `fps` | `30` | Main-loop rate, separate from `--dataset.fps` (recording sample rate), usually the same |
| `display_data` | `false` | Show camera streams and the 3D view in Rerun |
| `show_trajectory` | `true` | Overlay the 3D pose + trajectory in Rerun (needs `display_data` and a `tcp.*`) |
| `display_compressed_images` | `false` | JPEG-compress before display, on the display thread; only pays off when the viewer is on another machine (`--display_ip`) |
| `display_image_every_n` | `1` | Refresh camera tiles every N frames (scalars at full rate); for choosing which display frames to drop yourself |
| `play_sounds` | `true` | Spoken announcements; always silent in the container (no speech synthesiser), audible on the host |
| `resume` | `false` | Continue an existing dataset; looks only locally, errors out, never downloads from the Hub; `--robot.id` must match the dataset, see [`--robot.id`](#robot-id) |

**Device parameters `--robot.*` (XTac-UMI G1 specific)**

Only items used on this page; for the full set see [Common `RobotConfig` options](reference.md#robotconfig).

| Parameter | Default | Meaning |
|---|---|---|
| `robot.side` | auto | `left`/`right`; required for a single gripper when both are connected |
| `robot.role` | `leader` | Set `follower` to bind the follower gripper; firmware must be ≥ 1.2.5 or it is refused, below 1.2.11 it warns to upgrade, see [Firmware OTA](versions.md#ota) |
| `robot.gripper_stream_hz` | `100` | Rate at which the leader firmware pushes encoder (and, when enabled, IMU) readings, `0` polls every frame; falls back to polling with a warning if the stream fails. Shared on a bimanual rig, no prefix |
| `robot.enable_tracker` | `true` | Off means no pose |
| `robot.enable_head_camera` | `false` | Single-gripper `taccap_gripper` only: record the headset; bimanual uses `--robot.type=xtac_umi_g1` instead, see [head camera](#56) |
| `robot.head_camera_eyes` | `both` | `both` eyes (two keys), or `left` / `right` only |
| `robot.head_camera_width/_height` | `640` / `480` | Per-eye size; must match the headset output (default 640x480), see [head camera](#56) |
| `robot.wrist_undistort` | `false` | Undistort the fisheye before recording, see [fisheye undistortion](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` keeps the calibrated focal length, `1` is widest with the most black border |

!!! warning "On a bimanual rig, the per-unit flags take a `left_` / `right_` prefix"
    This page writes parameters for the single gripper; under `bi_taccap_gripper` these exist once per side, and without the prefix the field does not exist:

    | Single | Bimanual |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | same, with the `left_` / `right_` prefix |
    | `--robot.gripper_open_rad`, `--robot.tracker_to_ee_pos/_quat` | same |

    Everything else is shared by both sides: `--robot.enable_tactile`, `--robot.enable_tracker`, `--robot.tactile_*`, `--robot.wrist_camera_width/_height/_fps/_fourcc`, `--robot.head_camera_*`.

A powered tracker's 6-DoF pose is recorded automatically; the side comes from the digit before the trailing `G` in its serial ([odd-left / even-right](host-setup.md#33)). If the serial does not conform or enumeration is flaky, pin it with `--robot.tracker_serial=<SN>`.

### `--robot.id` and the hardware manifest {#robot-id}

`--robot.id` is the station number, one per rig (a bimanual rig is one rig), unchanged when a gripper is swapped. It is used in the log prefix, the calibration filename and the hardware manifest, not as a dataset column. The prefix is filled in from `--robot.type`:

| You type | `--robot.type` | Stored as |
|---|---|---|
| `--robot.id=0` | `taccap_gripper` (single) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper` (bimanual) | `bi_taccap_0` |
| `--robot.id=0` | `xtac_umi_g1` (bimanual + headset) | `xtac_umi_g1_0` |

Do not type the prefix by hand: non-numeric values are kept verbatim, so `--robot.id=taccap_0` still works, but on a bimanual rig it disagrees with the device type. A missing or blank id exits at command-line parse time:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

Identity lives in the hardware manifest: `lerobot-record` writes `meta/hardware.json` right after `connect()`, with each gripper's firmware SN and the SNs of its two tactile sensors (each with its observation key).

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

- `side` is which gripper, `finger` is which tactile sensor on it, each decided by [odd-left / even-right](host-setup.md#33).
- `observation_key` maps a dataset column to a physical sensor.
- `gripper_sn` is the firmware SN, not the CH343 `mcu_serial` (which changes with the adapter).
- A single gripper has one entry in `units`; a side that is off records `"gripper_sn": null`; with `--robot.enable_tactile=false`, `tactile_sensors` is an empty list.
- It is a separate file, not in `meta/info.json`; trackers and wrist cameras are accessories and not listed.
- `wrist_undistort` records whether frames were undistorted and with which intrinsics, `{"applied": false}` if not; see [fisheye undistortion](#57).

`epochs` lets one dataset span several rigs:

- Each epoch records `from_episode` / `to_episode` (half-open, matching `dataset_from_index` / `dataset_to_index`) and `recorded_at`; the open epoch has `to_episode` `null`.
- On `--resume` with the same rig no new epoch is recorded; after a gripper or sensor swap, the old epoch closes at the current episode count and a new one starts.
- A `--robot.type` mismatch is a different dataset, not a hardware swap: the original file is kept and a warning is logged.
- `bi_taccap_gripper` ↔ `xtac_umi_g1` (adding or dropping the headset) is also a different dataset, and a dataset recorded on an earlier version with the headset under `bi_taccap_gripper` cannot be resumed either; both need a new `--dataset.repo_id`.
- Older datasets (flat `units`) read back as one open epoch, which only says "nothing indicates the hardware changed".

**One dataset belongs to one station**: on `--resume`, a `--robot.id` that differs from the recorded one is refused before any device connects (the error contains `refusing to resume it`). Resume on the original station or use a new `--dataset.repo_id`; older datasets with no recorded station are exempt.

!!! note "The derived tactile channels rebuild from the dataset alone"
    depth / force / difference are computed from the recorded `rectify` stream: the reference image is each episode's first `rectify` frame and everything else is fixed by the sensor model, so no physical unit is needed. A `meta/runtimes/` directory and per-sensor `runtime` key in older datasets are ignored.

## What each frame records {#53}

| Key | Source | Enabled by | Shape / type |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | Tracker → EEF TCP position | `--robot.enable_tracker` (default `true`) | float (m) |
| `tcp.r1`..`tcp.r6` | Same, orientation as a 6-D rotation | as above | float |
| `gripper.pos` | Gripper encoder | `--robot.enable_gripper` (default `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | Left and right visuotactile sensors | recorded by default; `--robot.enable_tactile=false` is diagnostic only, see the warning below | uint8, about `(400, 700, 3)`; size is derived automatically, do not hard-code it |
| `wrist_cam` | Wrist camera | `--robot.enable_wrist_camera` (default `true`) | uint8 `(H, W, 3)` |
| `left_head` / `right_head` | Headset stereo, one key per eye | `--robot.type=xtac_umi_g1` (single gripper: `--robot.enable_head_camera=true`) | uint8, `(480, 640, 3)` by default |
| `head_camera.x/y/z` | Headset position (same world frame as `tcp.*`), also an action | as above | float (m) |
| `head_camera.r1..r6` | Headset orientation as a 6-D rotation, also an action | as above | float |
| `imu.accel.{x,y,z}` | Gripper IMU acceleration | `--robot.enable_imu` (default `false`, reserved, not recorded) | float (m/s²) |
| `imu.gyro.{x,y,z}` | Gripper IMU angular rate | as above | float (rad/s) |
| `imu.mag.{x,y,z}` | Gripper IMU magnetometer | as above | float (µT) |

The 6-D rotation stores the first two columns (by column, not by row) of the rotation matrix R (world ← body), the same for `tcp.*` and `head_camera.*`:

```text
R = ⎡ r1  r4  · ⎤     column 1 (r1,r2,r3) = direction of the body X axis in the world frame
    ⎢ r2  r5  · ⎥     column 2 (r4,r5,r6) = direction of the body Y axis in the world frame
    ⎣ r3  r6  · ⎦     column 3 = cross product of the first two; recompute it yourself
```

The 9 IMU columns are not recorded by default; to add them use `--robot.enable_imu=true` (on a bimanual rig it applies to both sides at once, with keys prefixed `left_` / `right_`); `observation.state` goes 10 → 19 for a single gripper, 20 → 38 for bimanual.

!!! warning "`--robot.enable_tactile=false` is a diagnostic switch, do not record with it"
    Off, the tactile sensors are not discovered, recorded or keyed. It only exists to halve a USB bandwidth problem (one camera failing to open, a different one each time); see [a camera that will not open](troubleshooting.md#usb-bandwidth). To record one stream fewer, use `--robot.enable_wrist_camera=false` or `--robot.enable_tracker=false`.

!!! tip "By default, what you see in Rerun is what lands on disk"
    - On disk: `--robot.tactile_output_types`, default `rectify` (the raw image with no baseline subtraction); exactly one type, more than one is an error.
    - Display: `--robot.tactile_display_output_types`, also `rectify` by default (`'[]'` means the same), so each sensor is read once per frame and screen and dataset show the same image.
    - Pointing display at another type adds a display-only, never-recorded output on the same read, keyed like `tactile_left_difference` and not in `observation_features`.

    `difference` is an enhanced difference image against the baseline captured at init. If you turn it on (`--robot.tactile_display_output_types='["difference"]'`):

    - It is destructive: force on the gel at connect time is subtracted from the whole session, so keep all four fingertips unloaded at connect.
    - Never switch `--robot.tactile_output_types` to `difference` just because it looks clearer.
    - `--robot.tactile_diff_gain` (default `1.0`) is its gain and does nothing unless `difference` is requested; the factory value of 1.5 is noisy on this gel and clips.

## Recording options: streaming encoding and encoder warm-up {#54}

Video keys (tactile + wrist camera) are encoded live rather than from PNGs at episode end, so there is almost no wait after an episode. On by default (`--dataset.streaming_encoding=true`):

```bash
lerobot-record \
    --robot.type=taccap_gripper --robot.id=0 --robot.side=right \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.num_episodes=20 \
    --dataset.fps=30 \
    --dataset.push_to_hub=false \
    --dataset.reset_time_s=60 \
    --dataset.episode_time_s=120 \
    --dataset.single_task='Pick up the object' \
    --dataset.streaming_encoding=true \
    --dataset.encoder_threads=2 \
    --dataset.vcodec=auto
```

- One encoder thread per camera, fed through a bounded queue (`--dataset.encoder_queue_maxsize`, about one second of frames); when full it waits up to 0.1 s, then drops the current frame and warns `Encoder queue full … dropped N frame(s)` without blocking collection.
- Saving is transactional: a failed save or a Ctrl+C rolls back to the last complete episode, never leaving half an episode, and `--resume` carries on.
- `--dataset.vcodec=auto` prefers hardware encoding; an NVIDIA GPU is recommended so GPU H.264 encoding takes load off the CPU.
- Encoder warm-up is automatic: encoders are ready before each episode, so the first frame does not pay for it.

### Recording on a host with no NVIDIA GPU {#no-gpu}

!!! warning "This is a workaround for an underspecified machine, not a recommendation"
    The [data-collection host minimum](install.md#host-spec) is an NVIDIA RTX 3060 / 8 GB VRAM or better. A CPU-only server, a VM or a laptop with no NVIDIA card can record as below, but saves are slow and frames drop sooner; use a compliant host for real collection.

Upgrade such machines to v0.1.0 first.

The defaults `--dataset.vcodec=auto` + `--dataset.streaming_encoding=true` assume an NVIDIA card; without one, turn streaming encoding off:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

`--dataset.vcodec=auto` probes by actually opening an encode session and falls back to `libsvtav1` (AV1 on the CPU) with no NVIDIA driver; offline re-encoding chooses the same way (`h264_nvenc` with NVIDIA). Passing `--dataset.vcodec=libsvtav1` explicitly also works.

With `libsvtav1` the CPU both encodes and captures; a bimanual rig has six to eight images per frame in a 33.3 ms budget at 30 fps, so `[slow_frame] ... overrun=` appears. With streaming off, frames are batch-encoded at `save_episode()`: a slow save only means waiting, a dropped frame cannot be recovered. Ignore the reminder to turn streaming encoding back on. To keep streaming encoding on a many-core server, tune these:

| Parameter | Default | When to touch it |
|---|---|---|
| `--dataset.encoder_threads` | auto | On a big machine `libsvtav1` takes cores capture needs; `2` per encoder is a safe cap |
| `--dataset.encoder_queue_maxsize` | `30` | About 1 s of buffer at 30 fps; a back-pressure valve that stops memory growing when encoding falls behind |

## Episodes and resets {#55}

- `--dataset.num_episodes=N` records several episodes per run.
- Between episodes, reposition the object and scene within `--dataset.reset_time_s`.
- One complete demonstration per episode, never several attempts.
- Give `--dataset.episode_time_s` enough room but not too much, or you get many dead tail frames.
- Keyboard controls while recording:

    | Key | Effect |
    |---|---|
    | → | End the current episode early; during the reset phase, end the reset early |
    | ← | Discard and re-record this episode; works during recording or the following reset, and the reset time is still given |
    | Esc | Save the current episode, then stop recording |

    The keyboard listener is global: arrow keys work in **any window**, including Rerun, which steps frames with left/right.

## Collection standards

### Good episodes and common bad samples

| Dimension | Good | Bad-sample symptom | How to avoid it |
|---|---|---|---|
| Completeness | Approach → grasp → manipulate → finish | Interrupted | Finish naturally |
| Steadiness | Smooth, even motion | Abrupt stops and turns, noisy IMU/pose | Move evenly |
| Tactile signal | Real contact and deformation | Empty grasp, no signal in the tactile image | Confirm contact in the Rerun tactile view |
| Camera visibility | Target within the wrist camera's view | Hand or cable blocking it, or overexposure/flicker | Clear obstructions, adjust the grip angle |
| Coordinate consistency | Same origin as other episodes | XTac-UMI XR restarted mid-collection, pose jumps between episodes | Never restart XTac-UMI XR |
| Gripper reading | `gripper.pos` ≈ 0 closed, sensible when open | Not calibrated, `gripper.pos` ≠ 0 when closed | Confirm it is closed, then re-zero if needed, see [gripper calibration](calibration.md#41) |
| Dropped frames | No warnings | Dropped-frame warnings in the log | Raise `encoder_threads`, use `vcodec=auto`, see [streaming encoding](#54) |
| First frame | The motion starts normally | The key action lands in the dropped first frame | Hold still 0.5–1 s after start; give `--dataset.episode_time_s` enough room |

On errors, start with [Troubleshooting](troubleshooting.md).

### Before collecting

Never restart XTac-UMI XR during collection (see [frame alignment](../common/pico4.md#pico-frame)); if you must, treat everything after it as a new dataset.

- An uncalibrated leader gripper cannot connect, so the preview only double-checks the mechanical travel; each leader gripper is calibrated once (stored in flash), both sides on a bimanual rig, see [gripper calibration](calibration.md#41).
- `scan_grippers` reports sensible side/role/firmware_sn; the tracker is charged and producing a pose.
- On the wired link, turn the host's WiFi off (it conflicts with wired sharing), see [network](../common/pico4.md#pico-network).
- Stable lighting, a clearly visible target, no cables or clutter blocking the wrist camera.
- A bimanual rig at full load can stream ~280 MB/s, see [storage planning](dataset.md#storage-planning).
- Run the [preview](#preview) before recording.

### How to perform the demonstration

Keep the pace similar across demonstrations of the same task so it is easier to learn from; tactile is the core modality, so an empty grasp is worth very little.

### Diversity and consistency

- Keep consistent: the task definition (`--dataset.single_task`), the intent of the motion, the coordinate origin.
- Vary moderately: the object's initial pose and position, the grasp point, small changes in lighting.

### Task definition and dataset organisation

- Use a stable, clear English sentence for `single_task`, identical within a dataset; it is written into `tasks`.
- One task/variant per dataset; `repo_id` naming is in [Dataset](dataset.md).
- Keep a device record (gripper and tracker, calibration date); serial numbers are already in [`meta/hardware.json`](#robot-id).

### Incremental collection

Record 5–10 first, verify with [`lerobot-check-dataset`](dataset.md#62) and replay a few, then scale up.

### Pre-flight checklist

- [ ] XTac-UMI XR not restarted during collection
- [ ] `gripper.pos` ≈ 0 when closed
- [ ] Tracker has a pose, trajectory looks right
- [ ] Host WiFi off
- [ ] Tactile images carry signal when grasping
- [ ] Wrist camera view unobstructed
- [ ] No dropped-frame warnings
- [ ] `single_task` matches this dataset
- [ ] Enough free disk space

## Optional: head camera {#56}

Records the Pico4 Ultra Enterprise headset's stereo frames and pose (the operator's first-person view and where they were looking) as `left_head` / `right_head` and `head_camera.*` (see [what each frame records](#53)); the latter also goes into the action. Bimanual uses `--robot.type=xtac_umi_g1`, the single-gripper `taccap_gripper` adds `--robot.enable_head_camera=true`; the parameters below apply to both.

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
- Prerequisites: XenseVR PC Service ≥ v0.2.0 (older versions do not forward frames, see [version baseline](versions.md#required)); the headset app is streaming and connected to the [PC Service](host-setup.md#35). Camera and tracker share one SDK connection; turning one off does not disconnect the other.

!!! warning "The headset's resolution and `--robot.head_camera_width/_height` must agree"
    Only `640x480` (default), `1024x768` and `1280x960` are accepted. XTac-UMI XR outputs 640x480 per eye by default, matching the collection side, so there is nothing to pass; the flags only declare what you expect.

    - Any other value, or a first frame that disagrees with the config (at connect), is an error; nothing is silently resampled to change the field of view.
    - All three are 4:3, like the sensor (the PICO camera API's per-frame cap of 2328x1748 is also 4:3); 16:9 only gets a crop or a stretch.
    - For a higher resolution, contact [technical support](../common/reference.md#support) to change it on the headset, and change both flags to match.

- `--robot.head_camera_eyes=left` (or `right`) records one eye: half the decoding and encoder load, one head video key.
- Changing the resolution or eye selection changes the data; episodes either side cannot be mixed.
- The eyes are two independent messages and a mismatch leaves no trace, so each frame compares both eyes' newest frames: identical sequence numbers mean the same exposure, otherwise timestamps must agree within `--robot.head_camera_pair_max_skew_ms` (default 20 ms, against about 33 ms per frame at 30 fps); exceeding it only logs a rate-limited warning with the measured skew.

`head_camera.*` is mapped into the `tcp.*` world frame with the tracker's Pico→world transform. Enabling it adds 9 dimensions to `observation.state`: 10 → 19 single, 20 → 29 bimanual, and `--robot.enable_imu=true` adds on top. If it will not connect, see [Troubleshooting](troubleshooting.md#head-camera).

## Optional: wrist camera fisheye undistortion {#57}

The wrist camera is a 190° fisheye, recorded raw by default. `--robot.wrist_undistort=true` rectifies it to a rectilinear projection before writing, using the intrinsics in this gripper's flash; `--robot.wrist_undistort_balance` sets the field of view. Only 640×480 is supported (the firmware fisheye record holds only 8 floats, no image size), so a different `--robot.wrist_camera_width/_height` exits at command-line parse time.

!!! warning "On and off produce two kinds of data, and you cannot tell them apart"
    Rectified and raw `wrist_cam` have identical shape and dtype and mix silently, so recording writes which was used into every unit of [`meta/hardware.json`](#robot-id):

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` is `"unit"` (this gripper's own calibration) or `"reference"` (the SDK's reference values); changing the setting mid-recording opens a new epoch. Use one setting per dataset.

### What happens when the fisheye calibration cannot be read {#fisheye-fallback}

In these cases undistortion does not fail but falls back to the SDK's built-in reference intrinsics:

- The lens was never calibrated (`read_fisheye()` returns `None`).
- The firmware returns an all-zero record (1.1.1 and 1.2.2 both do): test with `is_usable_fisheye_cal()`, not `is None`, or the remap table from `fx = fy = 0` yields a pure black image without raising.
- The firmware predates command set V2.0.

The fallback warns `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate` and records `"calibration": "reference"` in the manifest. In code, prefer `Calibration::resolve_fisheye()` (returns `(calibration, is_reference, reason)`) over `read_fisheye()`.

The reference values are fine to look at, but the principal point drifts per unit (37.7 px off on one unit); to measure in pixels on the rectified image (visual servoing, hand-eye calibration, size estimation), store this unit's own calibration first: `python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye right` (with two connected, pick `left` / `right` or a full SN; omit with one).

An off-centre or slightly tilted rectified frame does not mean bad calibration: undistortion centres on the principal point, not the frame centre, the sensor need not sit on the optical centre, and fisheye barrel distortion hides this (one unit: `cx = 359.1`, fingertip midpoint x = 360.1, about 1 px apart). Do not change `cx`; forcing 320 makes it worse and adds tilt.
