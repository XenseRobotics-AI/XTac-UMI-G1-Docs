# Data collection

First confirm the devices are working with `lerobot-teleoperate`, then record a clean, consistent `LeRobotDataset` with `lerobot-record`. For where data lands on disk, the directory layout, verification and upload, see [Dataset](dataset.md).

## How collection works {#51}

`taccap_gripper` needs no teleoperator: recording is self-driven, and the command line carries no `--teleop.*` arguments. The reset phase between episodes is a passive wait; just reposition the setup.

Shifted-frame pairing: the observation from step *t-1* is paired with the pose from step *t* (the EEF TCP pose plus the normalised `gripper.pos`, and the headset pose too when the [head camera](#56) is on) as its action. The action leads the observation by one step, so each episode is one frame shorter.

`tcp.*` is the gripper tip, not the tracker: the tracker sits about 195 mm from the two-finger midpoint, and before anything is written to disk it is multiplied by a built-in rigid mount transform (measured off the CAD assembly, one per side). The transform is body-fixed, holds in any orientation and is independent of `gripper.pos`. The world frame is gravity-aligned, X forward / Y left / Z up, and is frozen the instant XTac-UMI XR starts (see [frame alignment](../common/pico4.md#pico-frame)).

`--display_data=true` opens Rerun's `/world` 3D view: each gripper is drawn as a labelled ellipsoid plus an axis triad at its live `tcp.*`, trailing a breadcrumb; `--show_trajectory=false` turns the trail off. What each element means, the `FLU` scene convention and the mount check (laid flat, the triad should read X forward / Y left / Z up) are in [Coordinate frames · The `/world` 3D view](../common/coordinates.md#world-view).

## Preview before recording {#preview}

`lerobot-teleoperate` only previews and writes nothing. A camera stream that never came up, a tracker with no pose, `gripper.pos` not reaching 1.0, the two grippers swapped: all of it is obvious at a glance in the preview. Preview at the level you intend to record at; preview and recording use the same set of switches:

| Level | Switches | Needs | Adds |
|---|---|---|---|
| ① Gripper only | `--robot.enable_tracker=false --robot.enable_head_camera=false` | No PC Service needed | Both tactile streams, the wrist camera, `gripper.pos`; no `tcp.*` |
| ② Plus the tracker pose (the usual one, this page's default) | `--robot.enable_tracker=true --robot.enable_head_camera=false` | Tracker powered on and [bound](../common/pico4.md#pico-tracker-bind), Pico4 connected, [PC Service running](host-setup.md#35) | [`/world` view](../common/coordinates.md#world-view) / `tcp.*` |
| ③ Everything | `--robot.enable_tracker=true --robot.enable_head_camera=true` | PC Service ≥ v0.2.0 | Headset stereo frames and head pose, see [head camera](#56) |

Preview at level ②:

```bash
lerobot-teleoperate \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --robot.enable_tracker=true \
    --robot.enable_head_camera=false \
    --fps=30 \
    --display_data=true \
    --show_trajectory=true
```

To change level, change only the two switches from the table. `--robot.enable_head_camera` already defaults to `false`; writing it keeps the switch visible in the command. For a single gripper use `--robot.type=taccap_gripper`: with only one connected it is picked automatically, with both connected add `--robot.side=left|right` (required when recording only one of them). `--teleop_time_s=10` exits automatically after ten seconds, and `--debug_timing=true` prints sampling times and the camera count.

Check each item (the two pose rows only apply to ② and ③), then `Ctrl+C` once it all looks right:

| What | Expected |
|---|---|
| Both tactile streams | Both showing; the texture changes clearly when pressed |
| Wrist camera | Showing, with no cable or clutter in the view |
| `gripper.pos` | 1.0 wide open, 0.0 closed; short of 1.0, see [calibration](calibration.md#413) |
| The EE marker and trail in `/world` | Moves smoothly; no jumps, no freezing. Keep the tracker in the headset's view at all times, since anything blocking it loses tracking |
| Bimanual: the two trails | Independent, and each on the correct hand |

## Recording {#52}

Devices are auto-discovered by the serial-number rules; you never list serials. Tactile sensors, wrist cameras and trackers each match left/right on their own. Changing level and the single-gripper form are the same as in the preview.

```bash
lerobot-record \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --robot.enable_tracker=true \
    --robot.enable_head_camera=false \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.num_episodes=1 \
    --dataset.fps=30 \
    --dataset.push_to_hub=false \
    --dataset.episode_time_s=120 \
    --dataset.reset_time_s=60 \
    --dataset.single_task='Pick up the object'
```

- Keep `--display_data=false` (the default) for real recordings: Rerun's display compresses and pushes every stream on the collection loop and eats a visible share of the frame budget. If you must watch during a recording, use [`--display_image_every_n`](#params).
- Spell out `fps=30`, `episode_time_s=120`, `reset_time_s=60` and `push_to_hub=false` explicitly, so a different checkout's defaults cannot change what you collect.
- If a camera or the gripper encoder is lost mid-recording (a cable works loose, a hub browns out), collection stops on its own and saves what it already recorded, printing `Device lost mid-recording`; it does not write invented values. A brief read failure carries the last good value (about 2 s for a camera, about 1 s for the encoder) before loss is declared, so the last second or two of that episode may be repeated stale values; discard that episode. Check the cabling and the USB ports (see [Troubleshooting](troubleshooting.md)), then continue with `--resume`.

### Parameters {#params}

Three groups: dataset (`--dataset.*`), recording control (top level) and device (`--robot.*`). For the complete definitions see lerobot's official [recording guide](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset) (this project's lerobot baseline is 0.5.1).

**Dataset parameters `--dataset.*`**

| Parameter | Default | Meaning |
|---|---|---|
| `repo_id` | required | `<org>/<name>`; the team convention is `<org>/<task>_<variant>_<YYYYMMDD>`, e.g. `Xense/insert_plug_left_20260703`, see [Dataset](dataset.md) |
| `single_task` | required | Task description, written to `meta/tasks`, e.g. `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | Local storage directory, see [Dataset](dataset.md) |
| `fps` | `30` | Recording sample-rate cap; the sensors themselves run at 120 Hz ([specs](../product/specs.md#specs)) |
| `episode_time_s` | `120` | Length per episode (seconds) |
| `reset_time_s` | `60` | Reset time between episodes (seconds) |
| `num_episodes` | `50` | Number of episodes to record |
| `video` | `true` | Encode frames as video (mp4) |
| `push_to_hub` | `false` | Upload to the Hub, see [Dataset](dataset.md#64) |
| `private` | `false` | Private Hub repo |
| `tags` | none | Hub tags |
| `streaming_encoding` | `true` | Live streaming encoding, see [streaming encoding](#54) |
| `vcodec` | `auto` | `h264`/`hevc`/`libsvtav1`/`auto`/a hardware encoder |
| `encoder_threads` | auto | Threads per encoder instance |
| `encoder_queue_maxsize` | `30` | Buffered frames per camera (~1s@30fps); back-pressure drops the oldest when encoding falls behind |
| `video_encoding_batch_size` | `1` | Episodes accumulated before batch encoding (1=encode immediately) |

**Recording control (top-level parameters)**

| Parameter | Default | Meaning |
|---|---|---|
| `robot.type` | required | `taccap_gripper` (single) / `bi_taccap_gripper` (bimanual) |
| `robot.id` | required | Station number; pass a bare number (`0` / `1`…), the prefix is filled in automatically. Omitting it is an error, see [`--robot.id`](#robot-id) |
| `fps` | `30` | Main-loop rate; separate from `--dataset.fps` (the recording sample rate), two parameters usually set the same |
| `display_data` | `false` | Show camera streams and the 3D view in Rerun |
| `show_trajectory` | `true` | Overlay the 3D pose + trajectory in Rerun (needs `display_data` and a `tcp.*`) |
| `display_compressed_images` | `false` | JPEG-compress images before showing them in Rerun; eats frame budget, only pays off when the viewer is on another machine (`--display_ip`) |
| `display_image_every_n` | `1` | Refresh the camera tiles only every N frames (scalars always stay at full rate); a last resort |
| `play_sounds` | `true` | Spoken announcements; the container has no speech synthesiser, so they are always silent there. Record on the host to hear them |
| `resume` | `false` | Continue recording into an existing dataset |

**Device parameters `--robot.*` (XTac-UMI G1 specific)**

Only the items used by this page's commands and optional features are listed; for the full set see [Common `RobotConfig` options](reference.md#robotconfig).

| Parameter | Default | Meaning |
|---|---|---|
| `robot.side` | auto | `left`/`right`; required in single-gripper mode when both are connected |
| `robot.enable_tracker` | `true` | Off means no pose |
| `robot.enable_head_camera` | `false` | Record the head camera, see [head camera](#56) |
| `robot.head_camera_eyes` | `both` | `both` records both eyes (two keys), `left` / `right` records one |
| `robot.head_camera_width/_height` | `640` / `480` | Per-eye size; must match the headset's "Resolution", see the table under [head camera](#56) |
| `robot.wrist_undistort` | `false` | Undistort the fisheye before recording, see [fisheye undistortion](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` keeps the calibrated focal length, `1` is the widest view but with more black border |

!!! warning "On a bimanual rig, the per-unit flags take a `left_` / `right_` prefix"
    The parameters on this page are written for the single gripper. Under `bi_taccap_gripper` these exist once per side; without the prefix the field does not exist and the run fails:

    | Single | Bimanual |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | same, with the `left_` / `right_` prefix |
    | `--robot.gripper_open_rad`, `--robot.tracker_to_ee_pos/_quat` | same |

    Everything else is shared by both sides: `--robot.enable_tactile`, `--robot.enable_tracker`, `--robot.tactile_*`, `--robot.wrist_camera_width/_height/_fps/_fourcc`, `--robot.head_camera_*`.

Once the tracker is powered on, its 6-DoF pose is recorded automatically; the side is matched from the digit before the trailing `G` in its serial number ([odd-left / even-right](host-setup.md#33)). If the serial does not conform or enumeration is flaky, pin it with `--robot.tracker_serial=<SN>`.

### `--robot.id` and the hardware manifest {#robot-id}

`--robot.id` is the station number, one per rig (a bimanual rig is one rig). It names the station, not the hardware, so it stays put when a gripper is swapped. It reaches the log prefix, the calibration filename and the hardware manifest, but it is not a dataset column. The number itself is not validated; pass a bare number and the prefix is filled in from `--robot.type`:

| You type | `--robot.type` | Stored as |
|---|---|---|
| `--robot.id=0` | `taccap_gripper` (single) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper` (bimanual) | `bi_taccap_0` |

Do not type the prefix by hand: on a bimanual rig `--robot.id=taccap_0` gives a label that disagrees with the device type. Anything that is not all digits is kept verbatim, so an old command's `--robot.id=taccap_0` keeps working. A missing or blank id exits at command-line parse time:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

The hardware manifest is the identity: `lerobot-record` writes `meta/hardware.json` into the dataset right after `connect()`, recording each gripper's firmware SN and the SNs of its two visuotactile sensors, each carrying its observation key.

```json
{
  "robot_type": "bi_taccap_gripper",
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
            { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011",
              "runtime": "meta/runtimes/GSPS01A25Z0011-20260822T160309.bin" },
            { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012",
              "runtime": "meta/runtimes/GSPS01A25Z0012-20260822T160309.bin" }
          ],
          "wrist_undistort": { "applied": false }
        }
      ]
    }
  ]
}
```

- `side` is which gripper, `finger` is which tactile sensor on it; the two are independent ([odd-left / even-right](host-setup.md#33) is applied to each separately). `observation_key` lets a dataset column trace straight back to a physical sensor.
- `gripper_sn` is the firmware SN, not the CH343 `mcu_serial` (which changes with the adapter).
- The single gripper writes the same shape with one entry in `units`; a side that is off records `"gripper_sn": null`; with `--robot.enable_tactile=false`, `tactile_sensors` is an empty list.
- It is a file of its own, not a key in `meta/info.json`. Trackers and wrist cameras are accessories and are not in the manifest.
- `wrist_undistort` records whether the wrist frames were undistorted and from which intrinsics; not undistorted is recorded as `{"applied": false}`. See [fisheye undistortion](#57).

`epochs` lets one dataset span several rigs: each epoch records `from_episode` / `to_episode` (half-open, matching `dataset_from_index` / `dataset_to_index`) and `recorded_at`; the epoch being recorded has `to_episode` `null`. On `--resume` with the same rig nothing is recorded. If a gripper or sensor was swapped, the old epoch is closed at the current episode count and a new one starts. A changed `--robot.id` also opens a new epoch (consumers key on `units`). A `--robot.type` mismatch is a different dataset, not a hardware swap: the original file is kept and a warning is logged. Older datasets (flat `units`) read back as one open epoch, which only says "nothing indicates the hardware changed".

!!! danger "`meta/runtimes/`: rebuilding the derived tactile channels needs this bundle"
    What is recorded is the `rectify` stream; depth / force / difference are computed from it, and that needs the reference image captured when that sensor came up (the runtime config). Every capture session writes each sensor's bundle to `meta/runtimes/<SN>-<timestamp>.bin` (about 841 KB each), and each epoch points at its own. Using the wrong bundle does not fail: solve against another sensor's bundle, or one from after a recalibration, and an untouched gel still yields plausible-looking depth and force. An older dataset with no `meta/runtimes/` skips reconstruction. A sensor pulled for maintenance and refitted comes back with a new reference image and opens its own epoch. The timestamp in the filename is Beijing time with no offset; read it as a label and compute with `recorded_at`.

## What each frame records {#53}

| Key | Source | Enabled by | Shape / type |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | Tracker → EEF TCP position | `--robot.enable_tracker` (default `true`) | float (m) |
| `tcp.r1`..`tcp.r6` | Same, orientation as a 6-D rotation | as above | float |
| `gripper.pos` | Gripper encoder | `--robot.enable_gripper` (default `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | Left and right visuotactile sensors | recorded by default; `--robot.enable_tactile=false` is for diagnostics only, see the warning below | uint8, about `(400, 700, 3)`; width and height are derived automatically, do not hard-code them |
| `wrist_cam` | Wrist camera | `--robot.enable_wrist_camera` (default `true`) | uint8 `(H, W, 3)` |
| `left_head` / `right_head` | Headset stereo, one key per eye | `--robot.enable_head_camera` (default `false`) | uint8, `(480, 640, 3)` by default |
| `head_camera.x/y/z` | Headset position (same world frame as `tcp.*`), also an action | as above | float (m) |
| `head_camera.r1..r6` | Headset orientation as a 6-D rotation, also an action | as above | float |
| `imu.accel.{x,y,z}` | Gripper IMU acceleration | `--robot.enable_imu` (default `false`, reserved, not recorded) | float (m/s²) |
| `imu.gyro.{x,y,z}` | Gripper IMU angular rate | as above | float (rad/s) |
| `imu.mag.{x,y,z}` | Gripper IMU magnetometer | as above | float (µT) |

The 6-D rotation stores the first two columns of the rotation matrix R (world ← body), taken by column, not by row; the third column is the cross product of the first two. `tcp.*` and `head_camera.*` share the same convention:

```text
R = ⎡ r1  r4  · ⎤     column 1 (r1,r2,r3) = direction of the body X axis in the world frame
    ⎢ r2  r5  · ⎥     column 2 (r4,r5,r6) = direction of the body Y axis in the world frame
    ⎣ r3  r6  · ⎦     column 3 = cross product of the first two; recompute it yourself
```

The IMU is not recorded by default; a dataset collected by following this page does not contain those 9 columns. If you need it, add `--robot.enable_imu=true` (on a bimanual rig it applies to both sides at once, with keys prefixed `left_` / `right_`); `observation.state` goes 10 → 19 for a single gripper, 20 → 38 for bimanual.

!!! warning "`--robot.enable_tactile=false` is a diagnostic switch, do not record with it"
    Off, the tactile sensors are not discovered, nothing reaches the dataset and there are no observation keys. Its use is halving a USB bandwidth problem: a bimanual rig's four tactile streams plus two wrist cameras can exceed one bus's budget, and the symptom is one camera failing to open, not the same one every time. Run once with tactile off and once with the wrist cameras off to tell; see [a camera that will not open](troubleshooting.md#usb-bandwidth). To record one stream fewer, use `--robot.enable_wrist_camera=false` or `--robot.enable_tracker=false`.

!!! danger "What lands on disk is `rectify`, not the image you see in Rerun"
    On disk = `--robot.tactile_output_types`, default `rectify` (the raw image with no baseline subtraction); exactly one type, more than one is an error. Display = `--robot.tactile_display_output_types`, default `difference` (the difference image against the baseline captured at initialisation); the key is shaped `tactile_left_difference`, is not in `observation_features` and is never recorded. The difference image is destructive: any force pressing on the gel at connect time is subtracted out of the whole session, so do not switch `--robot.tactile_output_types` to `difference`. `--robot.tactile_diff_gain` (default `1.0`) only affects the display; the factory value of 1.5 is noisy on this gel and clips.

## Recording options: streaming encoding and encoder warm-up {#54}

Video keys (tactile + wrist camera) are encoded live during collection rather than stored as PNGs and encoded at the end of the episode, so there is almost no wait when an episode ends. On by default (`--dataset.streaming_encoding=true`):

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

- One `_CameraEncoderThread` per camera, fed raw frames through a bounded queue (`--dataset.encoder_queue_maxsize`, roughly one second of frames). When it falls behind it drops the oldest frame and warns rather than blocking collection.
- `--dataset.vcodec=auto` prefers hardware encoding where available. An NVIDIA GPU on the data-collection host is recommended so the GPU H.264 encoder can take the CPU load off encoding several live streams.
- Encoder warm-up is automatic: encoders are made ready before each episode starts, so the first frame does not pay for it.

### Recording on a host with no NVIDIA GPU {#no-gpu}

!!! warning "This is a workaround for an underspecified machine, not a recommendation"
    The [data-collection host minimum](install.md#host-spec) is an NVIDIA RTX 3060 / 8 GB VRAM or better. A CPU-only server, a VM or a laptop with no NVIDIA card can get data recorded with the command below, but saves are slow and frames drop sooner. For real collection, use a host that meets the minimum.

The two defaults `--dataset.vcodec=auto` + `--dataset.streaming_encoding=true` assume an NVIDIA card. Without one, turn streaming encoding off:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

The codec you can leave alone: `--dataset.vcodec=auto` probes by actually opening an encode session, and with no NVIDIA driver it falls back to `libsvtav1` (AV1 on the CPU, also the default encoder of the offline dataset tools). Passing `--dataset.vcodec=libsvtav1` explicitly is fine too.

The reason: with `libsvtav1` the CPU both encodes and captures. A bimanual rig has six to eight images per frame inside a 33.3 ms budget at 30 fps, so the first thing you see is `[slow_frame] ... overrun=`. With streaming off, frames are encoded in a batch at `save_episode()`: a slow save only costs you waiting, while a dropped frame is data you cannot re-record. Ignore the reminder suggesting you turn streaming encoding back on. If you still want streaming encoding on a many-core server, two knobs:

| Parameter | Default | When to touch it |
|---|---|---|
| `--dataset.encoder_threads` | auto | On a big machine `libsvtav1` takes cores the capture loop needs; `2` per encoder is a safe cap |
| `--dataset.encoder_queue_maxsize` | `30` | About 1 s of buffer at 30 fps; it is the back-pressure valve, so when encoding falls behind it blocks here instead of memory growing |

## Episodes and resets {#55}

- Record several episodes in one run with `--dataset.num_episodes=N`.
- Between episodes the reset is passive: reposition the object and scene within `--dataset.reset_time_s`, no teleoperation.
- Each episode is one complete demonstration; do not pack several attempts into one.
- Give `--dataset.episode_time_s` enough room but not too much; an over-long episode produces a lot of dead tail frames.
- lerobot's keyboard controls work while recording (re-record the current episode, end it early, and so on).

## Collection standards

The whole thing in one sentence: every episode is one complete, steady demonstration with real signal on the sensors, and the whole dataset shares one coordinate origin.

### Good episodes and common bad samples

| Dimension | Good | Bad-sample symptom | How to avoid it |
|---|---|---|---|
| Completeness | Approach → grasp → manipulate → finish | Interrupted, never finished | End each demonstration naturally |
| Steadiness | Smooth, even motion by hand | Abrupt stops and turns, noisy IMU/pose | Guide it smoothly and evenly |
| Tactile signal | The sensors genuinely contact the object and deform | Empty grasp, no signal in the tactile image | Ensure real contact when grasping; watch the tactile view in Rerun |
| Camera visibility | Target within the wrist camera's view | Hand or cable blocking it, or overexposure/flicker | Clear the obstruction, adjust how you hold the gripper |
| Coordinate consistency | Same origin as every other episode in this dataset | XTac-UMI XR restarted mid-collection, pose jumps between episodes | Never restart XTac-UMI XR |
| Gripper reading | `gripper.pos` ≈ 0 closed, sensible when open | Not calibrated, `gripper.pos` ≠ 0 when fully closed | Confirm the jaw is fully closed, then re-zero if needed, see [gripper calibration](calibration.md#41) |
| Dropped frames | No warnings | Dropped-frame warnings in the log | Raise `encoder_threads`, use `vcodec=auto`, see [streaming encoding](#54) |
| First frame | The motion starts normally | The key action lands in the dropped first frame | Hold still for 0.5–1 s after recording starts, and give `--dataset.episode_time_s` enough room |

If you hit an error, start with [Troubleshooting](troubleshooting.md).

### Before collecting

Never restart XTac-UMI XR during collection; see [frame alignment](../common/pico4.md#pico-frame) for why. If you have no choice but to restart, treat everything after it as a new dataset.

- Confirm the calibration took: in preview, `gripper.pos` reads 1.0 fully open and 0.0 closed. An uncalibrated leader gripper cannot connect at all, so being able to preview already proves it was calibrated; this step double-checks the mechanical travel. Each leader gripper is calibrated once (the values live in flash), and on a bimanual rig both sides need it. See [gripper calibration](calibration.md#41).
- Self-check the devices: `scan_grippers` reports sensible side/role/firmware_sn; the tracker has charge and is producing a pose.
- When using the wired link, turn the data-collection host's WiFi off; wired network sharing conflicts with WiFi. See [network](../common/pico4.md#pico-network).
- Prepare the scene: stable lighting, the target clearly visible; clear away cables and clutter that would block the wrist camera.
- Leave disk headroom: at full load the stream can reach ~280 MB/s (bimanual), see [storage planning](dataset.md#storage-planning).
- Run the [preview](#preview) once before recording and check that the trajectory, `gripper.pos` and the tactile images all carry signal; once confirmed, record with `--display_data=false`.

### How to perform the demonstration

Keep the pace of the motion similar across demonstrations of the same task, which makes it easier to learn from. Tactile is the core modality, and a demonstration with an empty grasp is worth very little. Shifted-frame pairing drops each episode's first frame, so do not put the key action in frame 0.

### Diversity and consistency

Consistent in task semantics, moderately diverse in everything irrelevant. Keep consistent: the task definition (`--dataset.single_task`), the intent of the motion, the coordinate origin. Vary moderately: the object's initial pose and position, the grasp point, small changes in lighting. Do not mix different tasks into one dataset; clearly different variants belong in different datasets.

### Task definition and dataset organisation

Use a stable, clear English sentence for `single_task` (e.g. `'Pick up the object'`) and keep it identical within a dataset; it is written into `tasks`. One dataset per task/variant; for `repo_id` naming and organisation see [Dataset](dataset.md). Keep a device record (which gripper and tracker, when they were calibrated) so you can trace back later; serial numbers are already recorded automatically by [`meta/hardware.json`](#robot-id).

### Incremental collection

Do not record several hundred episodes in one go and only then discover a systematic problem: record 5–10 first; verify with [`lerobot-check-dataset`](dataset.md#62); replay or visualise a few of them; then scale up.

### Pre-flight checklist

- [ ] XTac-UMI XR was never restarted during this collection session (consistent origin)
- [ ] Encoder zero is valid (`gripper.pos` ≈ 0 when closed)
- [ ] The tracker produces a pose and the Rerun trajectory looks right
- [ ] The data-collection host's WiFi is off (only the Pico4 Ultra Enterprise wired sharing)
- [ ] The tactile images carry signal when grasping (not an empty grasp)
- [ ] The target is unobstructed within the wrist camera's view
- [ ] No dropped-frame warnings
- [ ] The `single_task` description matches the rest of this dataset
- [ ] Enough free disk space

## Optional: head camera {#56}

Off by default. Turning it on records the Pico4 Ultra Enterprise headset's own stereo camera and the headset pose, the operator's first-person view and where they were looking. It produces `left_head` / `right_head` and `head_camera.*` (see [what each frame records](#53)); the latter also goes into the action. The switches and parameters are identical for single and bimanual grippers.

```bash
lerobot-record \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --robot.enable_tracker=true \
    --robot.enable_head_camera=true \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.single_task='Pick up the object' \
    --dataset.fps=30 \
    --dataset.push_to_hub=false
```

Here `left_` / `right_` means the headset's left / right eye, not the arms (on a bimanual rig only `{side}_wrist` and `{side}_tcp.*` are per arm). Two single-gripper processes that both enable the head camera get the same stream.

Prerequisites: XTac-UMI XR PC Service ≥ v0.2.0, older versions do not forward the camera frames (see [version baseline](versions.md#required)); the headset app is streaming. The camera and the tracker share one SDK connection, so the headset must be connected to the [PC Service](host-setup.md#35); turning one off does not disconnect the other.

!!! warning "The headset's \"Resolution\" and `--robot.head_camera_width/_height` must agree"
    Only `640x480` (default), `1024x768` and `1280x960` are accepted, one for each setting the headset app's "Resolution" offers. The size is decided by the XTac-UMI XR UI (default `640`, which is also the recommended setting); the command-line flags only declare what you expect. Anything else is an error, and a first frame whose size disagrees with the config also fails at connect; nothing is silently resampled (that would change the recorded field of view). All three are 4:3, matching the sensor (the PICO camera API's per-frame cap of 2328x1748 is also 4:3), so asking for 16:9 only gets you a crop or a stretch. Default meets default, so nothing to pass; raise the headset's setting and both flags have to follow:

    ```bash
    # headset set to 1024
    --robot.head_camera_width=1024 \
    --robot.head_camera_height=768

    # headset set to 1280
    --robot.head_camera_width=1280 \
    --robot.head_camera_height=960
    ```

To record one eye only, use `--robot.head_camera_eyes=left` (or `right`): half the JPEG decoding, half the encoder load, and one head video key in the dataset.

Changing the resolution or the eye selection changes the data: episodes either side of the change cannot be mixed, so decide before you start recording.

Pairing the two eyes: the eyes arrive as two independent messages, and a mismatched pair leaves no trace in the data, so each frame the two eyes' newest frames are compared. Identical sequence numbers mean the same exposure; otherwise the timestamps must agree within `--robot.head_camera_pair_max_skew_ms` (default 20 ms, against a frame period of about 33 ms at 30 fps). Exceeding it does not stop recording; a rate-limited warning is logged with the measured skew.

`head_camera.*` is remapped into the same gravity-aligned world frame as `tcp.*` (using the tracker's Pico→world transform). Enabling it adds 9 dimensions to `observation.state`: 10 → 19 for a single gripper, 20 → 29 for bimanual, and `--robot.enable_imu=true` adds on top of that. If the head camera will not connect, see [Troubleshooting](troubleshooting.md#head-camera).

## Optional: wrist camera fisheye undistortion {#57}

The wrist camera is a 190° fisheye, and the raw fisheye frame is recorded by default. Adding `--robot.wrist_undistort=true` rectifies it to a rectilinear projection before it is written to the dataset, using the intrinsics stored in this gripper's flash; `--robot.wrist_undistort_balance` sets the field of view. Only 640×480 is supported: the fisheye record in firmware holds only 8 floats and no image size, so combining it with a different `--robot.wrist_camera_width/_height` exits at command-line parse time.

!!! warning "On and off produce two kinds of data, and you cannot tell them apart"
    A rectified `wrist_cam` and a raw fisheye one have identical shape and dtype, and nothing warns you when the two are mixed for training. That is why recording writes which one was used into every unit of [`meta/hardware.json`](#robot-id):

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` is `"unit"` (this gripper's own calibration) or `"reference"` (the SDK's reference values). Changing the setting part-way through a recording opens a new epoch on its own. Use one setting for the whole dataset.

### What happens when the fisheye calibration cannot be read {#fisheye-fallback}

When the lens has never been calibrated (`read_fisheye()` returns `None`), the firmware returns an all-zero record (both firmware 1.1.1 and 1.2.2 do; test with `is_usable_fisheye_cal()` rather than `is None`, otherwise the remap table built from `fx = fy = 0` yields a pure black image without raising), or the firmware predates command set V2.0, undistortion does not fail. It falls back to the SDK's built-in reference intrinsics (`Calibration::resolve_fisheye()` returns `(calibration, is_reference, reason)`; prefer it over `read_fisheye()`), warns at connect with `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate`, and records `"calibration": "reference"` in the manifest.

The reference values are good enough to look at, but the principal point drifts from unit to unit (measured 37.7 px off on one unit). If you need to measure in pixels on the rectified image (visual servoing, hand-eye calibration, size estimation), store this unit's own calibration first: `python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye`.

A rectified frame that sits off-centre or looks slightly tilted does not mean the calibration is wrong: undistortion is built around the principal point, not the middle of the frame, the sensor is not always mounted at the lens's optical centre, and the raw fisheye's barrel distortion hides this by compressing the periphery (measured on one unit: `cx = 359.1`, with the fingertip midpoint at x = 360.1, only about 1 px apart). Do not change `cx` yourself; forcing it back to 320 pushes the picture further off and introduces a tilt.
