# 5. Data preview and collection

This is the core chapter: collecting with `lerobot-record` and writing out a `LeRobotDataset`.

## 5.1 How collection works {#51}

`taccap_gripper` **needs no teleoperator** — recording is self-driven.

The data uses **shifted-frame pairing**: the action **leads the observation by one step** — the
observation from step *t-1* is paired with the pose from step *t* (the EEF TCP pose plus the
normalised `gripper.pos`, and the **headset pose** too when the [headset camera](#56) is on) as
its action. Each episode is therefore one frame shorter (the first
has no predecessor). The reset phase between episodes is a passive wait: just reposition the
setup, no teleoperation involved.

!!! note "No --teleop.* on the command line"
    Because it is self-driven, recording commands carry **no `--teleop.*` arguments at all**.

## Before recording: preview once with `lerobot-teleoperate` {#preview}

`lerobot-teleoperate` **only reads and previews the devices — it writes nothing**, so running it
costs you nothing. Recording does cost something: a ruined episode has to be redone. And most of
what goes wrong (a camera stream that never came up, a tracker with no pose, `gripper.pos` not
reaching 1.0, the two arms swapped) is obvious at a glance in the preview.

**Preview at the level you intend to record at** — the three levels bring up different devices,
so they show different things.

=== "① Gripper only"

    Both tactile streams, the wrist camera, `gripper.pos`. Tracker and headset are off, so **the
    PC Service does not need to be running**.

    ```bash
    lerobot-teleoperate \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=false \
        --robot.enable_head_camera=false \
        --fps=30 \
        --display_data=true
    ```

=== "② Plus the tracker pose"

    Adds the [`/world` 3D view](#world-view): the gripper's EE marker and the trail behind it.
    Needs the tracker powered on and bound, the headset connected, and the
    [XenseVR PC Service](03-host-hardware.md#35) running.

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

=== "③ Everything (with the headset camera)"

    Adds the headset's stereo frames and head pose. Needs **PC Service ≥ v0.2.0** (see
    [§5.6](#56)).

    ```bash
    lerobot-teleoperate \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=true \
        --fps=30 \
        --display_data=true \
        --show_trajectory=true
    ```

**Single gripper**: use `--robot.type=taccap_gripper`; everything else is the same. With only one
connected it is picked automatically; **with both connected**, add `--robot.side=left|right` to say
which one to use.

Check each of these in Rerun (the two pose rows only apply to ② and ③):

| What | Expected |
|---|---|
| Both tactile streams | Both showing; the texture changes clearly when pressed |
| Wrist camera | Showing, with no cable or clutter in the view |
| `gripper.pos` | **1.0** wide open, **0.0** closed — short of 1.0, see [4.1.3](04-calibration.md#413) |
| The EE marker and trail in `/world` | Moves smoothly with the gripper; no jumps, no freezing — **keep the tracker in the headset's view**, since anything blocking it loses tracking |
| Bimanual: the two trails | Independent, and each on the correct hand — not swapped |

`Ctrl+C` once it all looks right, then record below.

!!! note "Why `--robot.enable_head_camera` is spelled out"
    It already defaults to `false`; writing it keeps the switch **visible in the command** — set
    it to `true` and the headset's stereo frames and head pose come along for the preview and the
    recording (see [5.6 Headset camera](#56)). Needs **PC Service ≥ v0.2.0**.

!!! tip "Let it stop on its own, and print per-frame timing"
    Add `--teleop_time_s=10` to exit automatically after ten seconds, and `--debug_timing=true`
    to print sampling times and the camera count — handy when you would rather not sit on
    `Ctrl+C`.

### The `/world` 3D view in Rerun {#world-view}

`--display_data=true` opens a `/world` 3D view: each gripper is drawn as a labelled ellipsoid
plus an axis triad at its live **EEF TCP pose** (`tcp.*`), trailing a breadcrumb of where it has
been.

- The scene is declared `FLU` (X forward / Y left / Z up), so the viewer knows which axis is
  "forward" and opens looking down +X. The world axes are labelled `+X forward / +Y left /
  +Z up`, so the orientation stays readable after you rotate the view.
- The breadcrumb keeps the last **90 samples (about 3 s at 30 fps)** and **fades with age** —
  enough to see the stroke you just made without two grippers' trails tangling.
- With the [headset camera](#56) on, the headset is drawn into the same `/world` as a smaller
  **amber `HEAD` marker**, without a trail (the head moves constantly; a second breadcrumb would
  bury the grippers'). Head pose and `tcp.*` share **one gravity-aligned world frame**, so where
  the operator looked and what the hands did can be read together.
- `--show_trajectory` is on by default; set it to `false` to turn it off. It is skipped
  automatically when `--robot.enable_tracker=false`, since there is no pose to draw.

!!! tip "A glance that confirms the marker is right"
    Laid flat, the EE marker belongs at the **two-finger midpoint**, **X forward / Y left / Z up**.

!!! note "The `tracker pose` tab in the scalar panel"
    `tracker pose` beside `tcp pose` is the tracker's raw pose — **view only, never recorded**.

## 5.2 Recording {#52}

Devices are **auto-discovered by the serial rules** — you never list gripper, tactile or camera
serials. Tactile sensors, wrist cameras and trackers each match left/right by the same rules.

**Match the level you previewed at** — the three record different things:

=== "① Gripper only"

    Writes `gripper.pos` plus both tactile streams and the wrist camera, and **no pose** (there
    will be no `tcp.*` in the data).

    ```bash
    lerobot-record \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=false \
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

=== "② Plus the tracker pose"

    Adds `tcp.*` (the EEF TCP pose). **This is the usual one**, and what the rest of this chapter
    assumes.

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

=== "③ Everything (with the headset camera)"

    Adds the headset's stereo frames and head pose. Needs **PC Service ≥ v0.2.0** (see
    [§5.6](#56)).

    ```bash
    lerobot-record \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=true \
        --display_data=false \
        --dataset.repo_id=<your_org>/<your_dataset> \
        --dataset.num_episodes=1 \
        --dataset.fps=30 \
        --dataset.push_to_hub=false \
        --dataset.episode_time_s=120 \
        --dataset.reset_time_s=60 \
        --dataset.single_task='Pick up the object'
    ```

**Single gripper**: use `--robot.type=taccap_gripper`; everything else is the same. With only one
connected it is picked automatically. **With both connected and only one being recorded**,
`--robot.side=left|right` says which — and is required.

!!! tip "Turn `--display_data` off for real recordings"
    All three commands above pass `--display_data=false`, which is also the default. Rerun's
    display compresses and pushes every stream **on the collection loop**, so leaving it on eats
    a visible share of the frame budget — the more so at higher resolutions or with more cameras.
    Off, that budget goes to capture and encoding instead.

    The streams are what the [pre-recording preview](#preview) is for, with `--display_data=true`;
    turn it off once you have checked. If you really must watch during a recording, see
    [`--display_image_every_n`](#params).

!!! note "What happens if a device drops mid-recording"
    If a camera or a jaw encoder **is lost mid-episode** (a cable works loose, a hub browns out),
    collection **stops on its own and saves what it already recorded**, printing
    `Device lost mid-recording`. It does **not** keep writing invented values into the dataset.

    A brief read failure is not a loss — the last good value carries it (about 2 s for a camera,
    about 1 s for the jaw encoder) before loss is declared. So the **last second or two of that
    episode may be repeated stale values**; discard that episode.

    Then check the cabling and the USB ports (see
    [a camera that will not open](troubleshooting.md#usb-bandwidth)) and continue into the same
    dataset with `--resume`.

### Parameter reference {#params}

`lerobot-record` parameters fall into three groups: **dataset** (`--dataset.*`), **recording
control** (top level), and **device** (`--robot.*`). For the complete definitions see lerobot's
official [recording guide](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset)
(matching the lerobot 0.5.1 baseline this project customises).

#### Dataset parameters `--dataset.*`

| Parameter | Default | Meaning |
|---|---|---|
| `repo_id` | **required** | Dataset identifier, `{HF username}/{dataset name}`, e.g. `Xense/pick_demo` |
| `single_task` | **required** | Short, accurate task description, written to `meta/tasks` (e.g. `'Pick up the object'`) |
| `root` | `$HF_LEROBOT_HOME/repo_id` | Local storage directory; defaults to the cache path |
| `fps` | `30` | Sampling (recording) frame-rate cap |
| `episode_time_s` | `120` | Recording length per episode (seconds) |
| `reset_time_s` | `60` | Reset time between episodes (seconds), a passive wait while you reset the scene |
| `num_episodes` | `50` | Number of episodes to record |
| `video` | `true` | Encode frames as video (mp4) |
| `push_to_hub` | `false` | Local-only by default; set `true` explicitly to upload |
| `private` | `false` | Upload as a private Hub repo |
| `tags` | none | Tags for the Hub dataset |
| `streaming_encoding` | `true` | Live streaming encode (see [§5.4](#54)) |
| `vcodec` | `auto` | Video encoder (`h264`/`hevc`/`libsvtav1`/`auto`/a hardware encoder) |
| `encoder_threads` | auto | Threads per encoder instance |
| `encoder_queue_maxsize` | `30` | Buffered frames per camera (~1 s @ 30 fps); back-pressure drops the oldest when encoding falls behind |
| `video_encoding_batch_size` | `1` | Episodes accumulated before batch encoding (1 = encode immediately) |

!!! note "Spell out the parameters that matter"
    Always set `fps=30`, `episode_time_s=120`, `reset_time_s=60` and `push_to_hub=false`
    explicitly in your commands, so a different checkout's defaults cannot change what you
    collect. The examples above spell out `--robot.enable_head_camera=false` for the same reason:
    `false` is the default, and writing it keeps the switch visible. Set it to `true` to record
    the headset's stereo view and pose as well (see [§5.6](#56)); that needs **PC Service >=
    v0.2.0**.

!!! note "`fps` vs. sensor frame rate"
    `fps` is the **recording sample rate**, not a sensor ceiling. The visuotactile sensors
    themselves run at 120 Hz ([hardware specs](hardware.md#specs)); recording at a lower `fps` is
    a **usage choice** and does not change the sensor's specification.

#### Recording control (top-level parameters)

| Parameter | Default | Meaning |
|---|---|---|
| `robot.type` | **required** | `taccap_gripper` (single) / `bi_taccap_gripper` (bimanual) |
| `robot.id` | **required** | The **station number** for this rig — pass a bare number (`0`, `1`, …); the prefix is filled in from `robot.type`. Omitting it fails at CLI-parse time. See [`--robot.id` and the hardware manifest](#robot-id) |
| `fps` | `30` | **Main loop** rate (device reads and preview). Separate from `--dataset.fps` (the recording sample rate) — two parameters, usually set the same |
| `display_data` | `false` | Show camera streams and the 3D view in Rerun |
| `show_trajectory` | `true` | Overlay the 3D pose + trajectory in Rerun (needs `display_data` and a `tcp.*`) |
| `display_compressed_images` | `false` | Whether to JPEG-compress images before showing them in Rerun. **Off by default** — the encoding happens on the record loop and eats a large share of the frame budget; it only pays off when the Rerun viewer is on another machine (`--display_ip`) |
| `display_image_every_n` | `1` | Refresh the camera tiles only every N frames (scalars always stay at full rate). **A last resort**, for a loop that still overruns — it is the only option here that changes what the operator sees |
| `play_sounds` | `true` | Spoken announcements of recording events |
| `resume` | `false` | **Continue recording** into an existing dataset |

#### Device parameters `--robot.*` (XTac-UMI G1 specific)

| Parameter | Default | Meaning |
|---|---|---|
| `robot.side` | auto | `left`/`right`, required **in single-gripper mode** when both are connected; a lone unit auto-resolves |
| `robot.role` | `leader` | `follower` binds the slave gripper |
| `robot.enable_tracker` | `true` | Off records tactile + gripper only (no pose) |
| `robot.tracker_serial` | unset | Pin the tracker SN, bypassing automatic side matching |
| `robot.enable_wrist_camera` | `true` | Turn the wrist camera off |
| `robot.wrist_camera_width/_height/_fps` | — | Wrist camera resolution / frame rate |
| `robot.wrist_camera_fourcc` | `MJPG` | Wrist pixel format. MJPG by default so the two tactile sensors on the same hub get the USB bandwidth; `YUYV` is uncompressed and only fits when there is room |
| `robot.enable_head_camera` | `false` | Record the Pico4 Ultra Enterprise **headset camera** — see [§5.6](#56) |
| `robot.head_camera_eyes` | `both` | `both` records each eye as its own key; `left` / `right` records one |
| `robot.head_camera_width/_height` | `1024` / `768` | **Per-eye** size; only `1024x768` or `1280x960` are accepted |
| `robot.head_camera_fps` | `30` | Head camera recording frame rate |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | Max timestamp gap still counted as one stereo capture when the eyes' sequence numbers differ |
| `robot.tactile_fps` | `30` | Tactile recording frame rate |
| `robot.tactile_output_types` | `["rectify"]` | Tactile stream **written to disk**, **exactly one** |
| `robot.tactile_display_output_types` | `["difference"]` | Extra tactile streams that are **display-only**, never recorded |
| `robot.tactile_diff_gain` | `1.0` | Gain of the `difference` image (display only) |
| `robot.enable_tactile` | `true` | Off takes the tactile sensors out of the run entirely — no discovery, no keys. **A diagnostic, not a way to record** |
| `robot.expected_tactiles_per_side` | `2` | How many sensors each side carries; a different count is an error, which is how a mis-installed sensor is caught |

!!! warning "On a bimanual rig, the **per-unit** flags take a `left_` / `right_` prefix"
    The table above is written for the single gripper. `bi_taccap_gripper` drives two units, so
    these exist once per side — spelled without the prefix, the field does not exist and the run
    fails:

    | Single | Bimanual |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | same, with the `left_` / `right_` prefix |
    | `--robot.gripper_open_rad`, `--robot.tracker_to_ee_pos/_quat` | same |

    Everything else is one switch for both sides: `--robot.enable_tactile`,
    `--robot.enable_tracker`, `--robot.tactile_*`,
    `--robot.wrist_camera_width/_height/_fps/_fourcc`, `--robot.head_camera_*`.

Once the Pico4 Ultra Enterprise tracker is powered on, the 6-DoF pose is **recorded
automatically** — the tracker matches this unit's side from the digit before its serial's trailing `G`
(odd-left / even-right).

!!! tip "Tactile + gripper only"
    Add `--robot.enable_tracker=false` to turn off pose recording.

!!! tip "Non-conforming tracker serial / flaky PC-service enumeration"
    Pin the serial directly with `--robot.tracker_serial=<SN>` — it is used **verbatim**, with no
    enumeration and no validation (a typo surfaces as a device-not-found error at connect time).
    Leave it unset (the default) for auto-discovery.

### `--robot.id` and the hardware manifest {#robot-id}

Two different things, answering two different questions.

**`--robot.id` is the station number** — **one per rig**, and a bimanual rig is one rig, not two. It
names the *seat*, not the hardware in it, so it stays put when a gripper is swapped. It reaches the
log prefix, the calibration filename and the manifest below, but it is **not a dataset column**.

**Pass a bare number.** The prefix is filled in from `--robot.type`:

| You type | `--robot.type` | Stored as |
|---|---|---|
| `--robot.id=0` | `taccap_gripper` (single) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper` (bimanual) | `bi_taccap_0` |

The prefix only repeats what `--robot.type` already said, and typing it by hand is how it goes
wrong: `--robot.type=bi_taccap_gripper --robot.id=taccap_0` gives a label that disagrees with the
rig it names, and nothing in the data shows it. **Anything that is not all digits is taken
verbatim**, so an existing `--robot.id=taccap_0` keeps working — and so does the calibration file
named after it.

**It is required.** A missing or blank id fails at **CLI-parse time**, before any device is touched:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

That is so a rig cannot spin up and record a batch **anonymously**. The number itself is not
policed — **identity lives in the serials below**, so a rig named after a room is allowed too.

**The hardware manifest is the identity.** `lerobot-record` writes `meta/hardware.json` into the
dataset right after `connect()`: each gripper's **firmware SN** plus the two tactile serials on that
gripper, each carrying the observation key it feeds.

```json
{
  "robot_type": "bi_taccap_gripper",
  "robot_id": "bi_taccap_0",
  "role": "leader",
  "units": [
    {
      "side": "left",
      "gripper_sn": "TCGU01A24Z0001m",
      "tactile_sensors": [
        { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011" },
        { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012" }
      ]
    }
  ]
}
```

- `side` is **which gripper**, `finger` is **which sensor on it** — both are called left/right and
  they are **independent** ([odd-left / even-right](03-host-hardware.md#33) is applied once to the
  gripper's serial and again to each tactile's). Each sensor therefore also carries its
  `observation_key`, so a dataset column traces back to a physical sensor without re-deriving the
  naming rule.
- `gripper_sn` is the **firmware** SN, read over the wire at connect — never the CH343
  `mcu_serial`, which identifies the USB-serial adapter and changes when the adapter does.
- The single-arm robot writes the **same shape** with one entry in `units`, so anything reading
  these datasets needs one code path, not two.
- A side whose gripper is off records `"gripper_sn": null` rather than being omitted;
  `--robot.enable_tactile=false` leaves `tactile_sensors` empty.
- It is a **file of its own**, not a key in `meta/info.json` — that schema belongs to upstream.
- Resuming a dataset on *different* hardware keeps the original file and warns. The episodes already
  recorded came from the devices named there, so overwriting would misattribute every one of them;
  the warning is the signal that this dataset now spans two rigs.

!!! note "Trackers and wrist cameras are deliberately left out"
    They are mounted accessories; the gripper plus its two tactile sensors is the unit the data is
    about.

## 5.3 What each frame records {#53}

| Key | Source | Enabled by | Shape / type |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | Tracker → EEF TCP position | `--robot.enable_tracker` (default `true`) | float (m) |
| `tcp.r1`..`tcp.r6` | Same, as a 6-D rotation | as above | float |
| `gripper.pos` | Jaw encoder | `--robot.enable_gripper` (default `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | The two visuotactile sensors | **always recorded**, no switch | uint8, about `(400, 700, 3)` |
| `wrist_cam` | Wrist camera | `--robot.enable_wrist_camera` (default `true`) | uint8 `(H, W, 3)` |
| `left_head` / `right_head` | Headset stereo, **one key per eye** | `--robot.enable_head_camera` (default `false`) | uint8, `(768, 1024, 3)` by default |
| `head_camera.x/y/z` | Headset position (same frame as `tcp.*`), **also an action** | as above | float (m) |
| `head_camera.r1..r6` | Headset orientation as a 6-D rotation, **also an action** | as above | float |
| `imu.accel.{x,y,z}` | Gripper IMU acceleration | `--robot.enable_imu` (default `false`, **reserved, not recorded**) | float (m/s²) |
| `imu.gyro.{x,y,z}` | Gripper IMU angular rate | as above | float (rad/s) |
| `imu.mag.{x,y,z}` | Gripper IMU magnetometer | as above | float (µT) |

!!! note "6-D rotation convention"
    What is stored is the **first two columns** of the rotation matrix **R** — **columns, not
    rows**:

    ```text
    R = ⎡ r1  r4  · ⎤     column 1 (r1,r2,r3) = the body X axis, in world coordinates
        ⎢ r2  r5  · ⎥     column 2 (r4,r5,r6) = the body Y axis, in world coordinates
        ⎣ r3  r6  · ⎦     column 3 = the cross product of the first two
    ```

    **R maps body → world**: it takes gripper-body coordinates into the world frame, so the two
    columns read directly as the gripper's **X** and **Y** axes as unit vectors in world
    coordinates. The third column (the Z axis) is the cross product of the first two, which is why
    six numbers reconstruct the full rotation and the third column is not stored.

    The world frame is gravity-aligned, **X forward / Y left / Z up** (see
    [startup and frame alignment](03-host-hardware.md#pico-frame)). `tcp.*` and `head_camera.*`
    follow the same convention.

!!! info "`tcp.*` records the gripper tip, not the tracker"
    The tracker is bolted to the gripper's handle, about 195 mm from the **two-finger midpoint**.
    Before anything is written to disk it is multiplied by a built-in rigid mount transform
    (measured off the CAD assembly, one per side), so `tcp.*` is the **EEF TCP pose**.

    That transform is **body-fixed** — it turns with the gripper and holds in any orientation, so
    it does not matter which way you start out. The TCP is the two-finger midpoint, which does not
    move when the jaw opens and closes symmetrically, so it is independent of `gripper.pos`. To
    see it for yourself, lay the gripper flat and check that the EE marker in Rerun's `/world`
    sits at the two-finger midpoint → [the `/world` 3D view](#world-view).

!!! tip "The IMU is a reserved capability — the standard flow does not record it"
    The gripper has an IMU and the collection program supports recording it, but the **standard
    flow leaves it off**. The `imu.*` rows above document the format; a dataset collected by
    following this manual **will not contain those 9 columns**.

    If you do need inertial data, add `--robot.enable_imu=true` (the same switch on bimanual rigs
    applies to both sides at once, with keys prefixed `left_` / `right_`).

    Turning them on raises the `observation.state` dimension accordingly: 10 → 19 for a single
    gripper, 20 → 38 for bimanual. Leave it off if you do not need inertial data and save 9
    columns.

**Tuning the observation keys**:

- **Tactile** → `tactile_left` / `tactile_right`; the rectified image is landscape `(400,700,3)`
  (width and height are derived automatically — **do not hard-code them**). Tune with
  `--robot.tactile_fps` / `--robot.tactile_output_types`; `--robot.enable_tactile=false` takes
  the tactile path out of the run entirely (see below).

!!! warning "`--robot.enable_tactile=false` is for diagnosis — do not record with it"
    Off, the sensors are not discovered and nothing reaches the dataset, not even the keys. Tactile
    data is the reason this gripper exists, so a recording made this way is missing its main
    stream.

    Its use is **halving a USB bandwidth problem**: one bus only has so much to give, and a
    bimanual rig's four tactile streams plus two wrist cameras can exceed it. The symptom is **one
    camera failing to open** — and not the same one every time. Running each half on its own tells
    you whether the budget is the problem rather than flaky hardware; see
    [Troubleshooting · a camera that will not open](troubleshooting.md#usb-bandwidth).

    To record **one stream fewer**, use the switch meant for it:
    `--robot.enable_wrist_camera=false` for the wrist, `--robot.enable_tracker=false` for the pose.

!!! danger "What lands on disk is `rectify`, not the image you see in Rerun"
    The two tactile streams are **deliberately different**:

    - **On disk** = `--robot.tactile_output_types`, default `rectify` — the raw image with **no
      baseline subtraction**, keeping everything the sensor saw. **Exactly one type** (each sensor
      maps to one video key in the dataset); more than one is an error pointing you at the display
      stream.
    - **Display** = `--robot.tactile_display_output_types`, default `difference` — an enhanced
      difference image against the **baseline captured at sensor init**. Contact is far easier to
      read there, which is why that is what Rerun shows the operator; the key is shaped
      `tactile_left_difference` and is **not** in `observation_features`, so it never reaches
      disk.

    The difference image is **destructive**: the baseline is grabbed when the sensor initialises,
    so **any force pressing on the gel at connect time is subtracted out of the whole session**.
    That is why it is display-only — do not switch `--robot.tactile_output_types` to `difference`
    just because it looks clearer.

    `--robot.tactile_diff_gain` (default `1.0`) only affects the display stream's gain. The
    factory value of 1.5 is noisy on this gel and clips; it scales signal and noise alike, so it
    **does not change the signal-to-noise ratio** — it only leaves headroom.
- **Wrist camera** → `wrist_cam`; skip it with `--robot.enable_wrist_camera=false`, tune with
  `--robot.wrist_camera_width/_height/_fps`.
- **Headset camera** → `left_head` / `right_head` plus `head_camera.*`; **off by default**, turn
  it on with `--robot.enable_head_camera=true` — see [§5.6](#56).
- **Role** → `--robot.role=follower` binds the slave unit (default `leader`).

## 5.4 Recording options: streaming encoding and encoder warm-up {#54}

Video keys (tactile + wrist camera) are **encoded live during collection** rather than stored as
PNGs and encoded at the end of an episode, so **there is almost no wait when an episode
ends**. On by default (`--dataset.streaming_encoding=true`):

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

- One `_CameraEncoderThread` per camera, fed raw frames through a bounded queue
  (`--dataset.encoder_queue_maxsize`, roughly one second of frames). When an encoder falls behind
  it **drops the oldest frame and warns** rather than blocking the collection loop.
- `--dataset.vcodec=auto` prefers hardware encoding where available. An NVIDIA GPU on the
  collection host is recommended so the GPU H.264 encoder can take the CPU load off encoding
  several live video streams. **A host without an NVIDIA GPU records fine too**, with one flag
  changed — see below.

!!! note "Encoder warm-up"
    Encoders are made ready before each episode starts, so the first frame does not pay for it.
    This is automatic — nothing to set.

### Recording on a machine with no NVIDIA GPU {#no-gpu}

!!! warning "This is the workaround for an **underspecified machine**, not a recommendation"
    The [collection host minimum](02-environment.md#host-spec) is an NVIDIA **RTX 3060 / 8 GB
    VRAM** or better. If all you have is a CPU-only server, a VM or a laptop with no NVIDIA card,
    what follows will get data recorded — but **noticeably less efficiently than on a machine that
    meets the spec**: slow saves, frames dropped sooner. **For real collection, use a host that
    meets the minimum.**

The two defaults above (`--dataset.vcodec=auto` + `--dataset.streaming_encoding=true`) assume an
NVIDIA card. On a CPU-only server, a VM, or a laptop with no discrete GPU, **turn streaming encoding
off**:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

**The codec you can leave alone.** `--dataset.vcodec=auto` (the default) probes by **actually
opening an encode session**, so on a host with no NVIDIA driver it reports no hardware encoder and
falls back to `libsvtav1` — AV1 on the CPU, which is what the offline dataset tools already default
to. Passing `--dataset.vcodec=libsvtav1` explicitly is fine too, and worth doing if you want the
command to be self-documenting about where it can run.

**Why streaming encoding goes off.** Streaming encoding runs the encoder inline with capture, which
pays off when the encoder is a dedicated chip on the GPU and the CPU only feeds it frames. With
`libsvtav1` the encoder **is** the CPU, competing with the capture loop for the same cores — on a
bimanual rig that is six to eight images per frame inside a 33.3 ms budget at 30 fps, so the first
thing you see is `[slow_frame] ... overrun=`.

With it off, frames are written out during capture and encoded in a batch at `save_episode()`:
**episode saves become slow and visible, capture stays on time.** That is the right trade — a late
save costs you patience, a starved capture loop costs you data you cannot re-record.

!!! tip "If you want to keep streaming encoding on anyway, e.g. on a many-core server"
    | Flag | Default | Why you would touch it |
    |---|---|---|
    | `--dataset.encoder_threads` | auto | The default lets the codec pick, which on a big machine means `libsvtav1` helping itself to cores the capture loop needs. **`2` per encoder** is a sane cap |
    | `--dataset.encoder_queue_maxsize` | `30` | ~1 s of buffer at 30 fps. It is the backpressure valve: when the encoder falls behind, capture blocks here instead of memory growing |

!!! note "About the reminder to turn streaming encoding back on"
    With `--dataset.streaming_encoding=false`, `lerobot-record` prints a reminder suggesting you
    re-enable it if the hardware is capable. **A GPU-less host is not**, so the suggestion does not
    apply — leaving it off is deliberate.

## 5.5 Episodes and resets {#55}

- Record several episodes in one run with `--dataset.num_episodes=N`.
- Between episodes the reset is **passive**: reposition the setup, no teleoperation.
- lerobot's keyboard controls work while recording (re-record the current episode, end it early,
  and so on, following the usual `lerobot-record` conventions).

!!! tip "Want to collect *good* data?"
    Running the command is only the first step. Do read
    [Best Practices](best-practices.md) — origin discipline, tactile contact, demonstration
    consistency and incremental verification are what actually decide the quality of what lands on
    disk.

## 5.6 Optional: the headset camera (first-person view) {#56}

**Off by default.** Turning it on records the Pico4 Ultra Enterprise headset's **own stereo
camera** plus the headset's pose — the operator's first-person view and where they were looking.
Both `taccap_gripper` (single) and `bi_taccap_gripper` support it, with the same flags.

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

It produces three groups of keys:

| Key | Meaning |
|---|---|
| `left_head` / `right_head` | Headset camera, **one video key per eye**, `(768, 1024, 3)` each by default |
| `head_camera.x/y/z` | Headset position (m); **also in the action** |
| `head_camera.r1..r6` | Headset orientation, 6-D rotation (same convention as `tcp.*`); **also in the action** |

!!! warning "`left_` / `right_` here means the **eyes**, not the arms"
    On a bimanual rig `{side}_wrist` and `{side}_tcp.*` are per-**arm**, but there is only one
    headset: `left_head` / `right_head` are the headset's **left and right eye**. By the same
    token, enabling the head camera on two single-gripper processes gives you **the same stream
    from the same headset twice**, not two independent views.

### Prerequisites

1. **XenseVR PC Service ≥ v0.2.0**. Older versions do not forward the camera frames — see
   [2.4 One-shot install](02-environment.md).
2. **The headset app must be streaming.** The camera and the trackers **share one SDK
   connection**, so the headset has to be connected to the PC Service (see
   [3.5 Start the XenseVR PC Service](03-host-hardware.md#35)). Conversely, turning the camera off
   does not drop the trackers' connection, and vice versa.

### Resolution and recording a single eye

`--robot.head_camera_width/_height` accept **only `1024x768` (default) and `1280x960`**. Anything
else is an error rather than a silent downgrade, and so is a first frame whose size disagrees with
the config — rescaling would quietly change the recorded field of view. Both modes are 4:3,
matching the sensor (PICO's camera-access API caps a frame at 2328x1748, which is also 4:3, so a
16:9 request would be a crop or a stretch rather than more field of view).

!!! warning "The headset's \"Resolution\" and these two must agree"
    The headset produces the frames, and their size comes from the **Resolution** setting in
    XTac-UMI XR (default `1024`); these two flags only **declare what you expect to receive**. If
    the two disagree, connect fails on the first frame's size.

    **After setting the headset to `1280`, change the command too**:

    ```bash
    --robot.head_camera_width=1280 \
    --robot.head_camera_height=960
    ```

    And back again for `1024`. Change both, never just one.

`--robot.head_camera_eyes=left` (or `right`) records one eye: half the JPEG decoding, half the
encoder load, and one head video key in the dataset instead of two.

!!! danger "Changing the size or the eye selection changes the data"
    **Episodes either side of the change are not comparable** — decide before you start.

### Pairing the two eyes

The eyes arrive as **two independent messages**, and once they are separate video keys a
mismatched pair leaves **no trace in the data**. So each frame the two eyes' newest frames are
compared: identical sequence numbers are a definitive match; otherwise their timestamps must agree
within `--robot.head_camera_pair_max_skew_ms` (default 20 ms, against a ~33 ms frame period at
30 fps). Exceeding it does not stop recording — it raises a **rate-limited warning naming the
measured skew**, so the condition is visible rather than silently recorded.

### Pose and visualisation

`head_camera.*` is the **headset pose**, remapped into the **same gravity-aligned world frame as
`tcp.*`** (the same Pico→world transform the tracker uses). Head and hands are therefore directly
comparable and can be drawn in one 3D scene: with `--display_data=true`, the `/world` view gains
an amber `HEAD` marker (see [the `/world` 3D view](#world-view)).

!!! note "Dimension change"
    Enabling it adds 9 dimensions (the headset pose) to `observation.state`: 10 → 19 for a single
    gripper, 20 → 29 for bimanual. `--robot.enable_imu=true` adds on top of that as usual.

Next → [Best Practices](best-practices.md) → [Dataset & Examples](06-dataset.md)
