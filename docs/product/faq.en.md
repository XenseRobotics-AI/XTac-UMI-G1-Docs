# Frequently asked questions

The five kinds of questions customers ask most: how the coordinate frames are defined, where the intrinsics and extrinsics come from, how to verify data accuracy, how to export and upload data, and how to replay recorded data. Each entry gives the answer and where it comes from; the details are in the linked pages.

Both configurations ([Backpack Kit](../backpack/index.md) / [Developer Kit](../pc/index.md)) use the same grippers and headset, and the sensor-side definitions are identical; wherever the two differ below, they are written up separately.

## Coordinate frames {#frames}

??? question "How is the world frame defined, and where is its origin?"
    Right-handed and gravity-aligned, established and frozen by XTac UMI XR on the headset at **the moment it starts**:

    | Axis | Direction |
    |---|---|
    | Origin | Where the headset was when XTac UMI XR started |
    | X | Forward, along the normal of the headset's front camera mounting face |
    | Y | Left |
    | Z | Up |

    Once frozen, turning your head or walking around does not carry it along; **restarting XR establishes a new frame**, changing both the origin and the orientation. So do not restart XR while collecting one dataset. See [The world frame](../common/coordinates.md#world).

??? question "Why do the pose values of two recordings not line up?"
    The reason differs between the two:

    - **Backpack Kit**: from 0.4.6, exported state and action take **the headset position at frame 0 of each recording** as the origin and the headset's horizontal heading at frame 0 as the X axis, with translation and yaw removed (pitch and roll kept). This is deliberate: when Pico resets its frame it only zeroes heading and height, and the horizontal position can still be off by a few centimetres to tens of centimetres; zeroing each episode makes the starting point consistent within a dataset. "Dual gripper" mode records no headset pose and skips this transform. See [Origin of exported data](../common/coordinates.md#episode-origin).
    - **Developer Kit**: it uses the world frame above directly, with **no** per-episode zeroing. If XR was restarted before recording, two episodes' poses are offset as a whole, and they can only be treated as separate datasets.

??? question "What is the 6-D rotation `r1..r6` in a pose?"
    The **first two columns** of the rotation matrix R (world ← body), taken by column:

    - `r1..r3` = the first column = the direction of the body X axis in the world frame;
    - `r4..r6` = the second column = the body Y axis;
    - the third column is the cross product of the first two; recompute it yourself.

    The Backpack Kit's exported left-hand TCP is turned 180° about its own X axis under the `mirrored-v1` convention, so compared with the same-axes convention **`r4..r6` flip sign and `r1..r3` stay the same**. `tcp.*` and `head.*` are taken the same way. See [What each frame records](../pc/recording.md#53) and [Export formats](../backpack/projects-export.md#lerobot).

??? question "Which point does `tcp.*` refer to, and how does it relate to the tracker pose?"
    `tcp.*` is the **gripper tip** (the midpoint of the two fingers) in the world frame, converted from the tracker pose through the built-in tracker-to-tip transform. On the Developer Kit the raw tracker pose is not written to the dataset (the `tracker pose` in the Rerun panel is for inspection only); the Backpack Kit's raw MCAP does record headset and tracker poses, and the exported dataset carries the converted `tcp.*`. The gripper's own frame, the tip definition and the tracker mounting position are set by the URDF / MJCF in [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description); to change the transform, see [RobotConfig](../pc/recording.md#robotconfig).

??? question "Which frame is `head.*` in? Is it the same world frame as `tcp.*`?"
    Yes. The headset's Pico pose is mapped into the world frame that `tcp.*` lives in through the same Pico→world transform as the trackers, with the same position and 6-D rotation layout. So `head.*` is both an observation and an action: a policy can command the head's orientation just as it commands a gripper.

## Intrinsics and extrinsics {#calibration}

??? question "Where are the wrist fisheye camera's intrinsics, and can an uncalibrated gripper be used?"
    The intrinsics live in **each gripper's own flash**. For a gripper that was never calibrated, the SDK automatically falls back to a set of built-in reference intrinsics and prints a warning: rectification does not fail, but it is only good enough for viewing — to measure in pixels on the rectified image, write this gripper's calibration first.

    - Read: `g.calibration.resolve_fisheye()` in the SDK returns `(cal, is_reference, reason)`; the `read_intrinsics.py` script exports them read-only.
    - Write: `fisheye_cal.py set-fisheye right --from-npz cam.npz` (add `--follower` for a follower gripper).
    - When recording on the Developer Kit, `--robot.wrist_undistort=true` rectifies with this gripper's flash intrinsics before writing; falling back to the reference intrinsics warns and is recorded in `meta/hardware.json`. See [Wrist camera fisheye undistortion](../pc/recording.md#57).

??? question "Where do the tactile intrinsics / rectification parameters come from?"
    They are fixed by the sensor model and available with the dataset; nothing is calibrated on site. The reference image is each episode's first frame of the `rectify` stream, and at export it is geometrically rectified in the orientation chosen for the project (700 × 400 by default, or 400 × 700 with a further 90° counterclockwise). Recording always keeps the raw image; rectification happens only at export. See [Wrist fisheye rectification](../backpack/system.md#undistort) and [Export formats](../backpack/projects-export.md#lerobot).

??? question "Do I need to calibrate the tracker-to-gripper-tip extrinsics myself?"
    No. There is one built-in transform per side, applied straight to the tip while sampling. You can check it yourself:

    ```bash
    python -m lerobot.robots.taccap_gripper.check_tracker --side right
    ```

    It prints `raw` (the tracker's own pose) and `ee` (the tip pose) at 10Hz. **Pivot check**: rest the midpoint of the two fingers on a fixed point and turn the handle; `ee xyz` should barely move while `raw xyz` changes widely — if not, the tracker is mounted wrong. See [Pico4U tracker self-check](../pc/calibration.md).

??? question "Which extrinsics come with the exported data?"
    The Backpack Kit's exported LeRobot dataset carries `meta/taccap_extrinsics.json`, recorded **per episode**:

    - `tracker_bindings`: which tracker is bound to which side;
    - `tracker_to_ee`: the tracker-to-tip transform actually used for the episode (one per side, with a version number);
    - `gripper_open_rad`: each gripper's full opening travel read at the start of recording, used to normalize the encoder readings;
    - if the episode's data comes from an earlier export rule, there are also `legacy_extrinsics` / `legacy_world_pose` flags and a warning.

    `meta/xumi_collection_devices.json` additionally records which device set and which version exported each recording. See [Export formats](../backpack/projects-export.md#lerobot).

??? question "How do I get the headset stereo cameras' intrinsics and extrinsics?"
    XTac UMI XR delivers them along with the camera parameters, referenced to **the headset body (head pose)**, not to the SDK's calibration reference frame:

    - Extrinsics: the SDK's native extrinsics are left-multiplied by a fixed `T_H_I` before being sent to the collection side; the main field `cameraExtrinsics` is already the head pose extrinsics (`cameraExtrinsicsReferenceFrame=native_pico_head_pose`), so **the receiving side must not multiply by `T_H_I` again**; the SDK's original values are in `cameraExtrinsicsSdk`.
    - Intrinsics: computed for each reopened capture from the per-eye width and height and the FOV requested at that time.
    - Only `640x480` (default), `1024x768` and `1280x960` are supported, all 4:3; any other value, or a first frame whose size disagrees, is an error, with no silent resampling.

    Developer Kit parameters are in [Optional: head camera](../pc/recording.md#56).

## Accuracy and verification {#accuracy}

??? question "What is the nominal accuracy?"
    | Metric | Nominal |
    |---|---|
    | Positioning | < 3mm |
    | Multi-device time sync | 5ms |
    | Visuotactile force accuracy / deformation accuracy | 0.2N / 0.1mm |
    | Headset pose streaming | [XTac UMI XR](../common/pico4.md#pico-app) sends the headset pose to the collection unit |
    | Tactile video and gripper IMU | XHE tactile video: 60 fps. Gripper firmware 1.3.1 IMU reporting limit: 1125 Hz |

    Source: [Technical specifications](specs.md#tracking). These are system specifications, not a per-unit factory report; real accuracy depends on tracker field of view, mounting and site lighting. The checks below are ones you can run yourself.

??? question "How do I verify that the pose chain is accurate?"
    Three levels, from cheapest to most thorough:

    1. **Stillness for drift**: leave the gripper on the table without moving it; the pose on the monitor page or in Rerun should fluctuate at the millimetre level, not wander steadily.
    2. **Pivot check**: rest the midpoint of the two fingers on a fixed point and turn; `ee xyz` should barely move (see [Pico4U tracker self-check](../pc/calibration.md)). This one catches wrong mounting, reversed bindings and a wrong transform at once.
    3. **Trajectory review**: in Rerun, `--display_data=true` draws the gripper as a triad at `tcp.*` with a trail; lying flat, the triad should read X forward / Y left / Z up. See [The pose view during collection](../common/coordinates.md#world-view).

??? question "How do I verify that a dataset itself is complete?"
    - **Developer Kit**: `lerobot-check-dataset --repo-id <org>/<name>` checks that `meta/` is complete, the episode count agrees, parquet row counts and indices are contiguous, and there are no NaNs; video frame counts must match exactly, and missing frames raise an error. Run it before uploading or sharing. See [Checking the data](../pc/dataset.md#62).
    - **Developer Kit visualization**: open it locally with [`xense-lerobot-viewer`](https://github.com/XenseRobotics-AI/xense-lerobot-viewer); its Doctor panel runs 13 read-only checks on each dataset (metadata, timing, actions, video and more) and can replay against the 3D URDF for comparison.
    - **Backpack Kit**: a quality check runs automatically on stopping and marks the episode "data suspect" if any of these hits (too short, a camera channel with zero frames, tracking lost for more than 20%, a missing tactile rectification recipe, a frame rate below nominal for more than 5%), see [After stopping](../backpack/monitor-record.md#record-stop); there is also a [precheck](../backpack/projects-export.md#export) before export.

??? question "How do I check that the gripper opening reading is correct?"
    Closed, `gripper.pos` should read about 0; fully open, it reaches 1.0. If fully open clearly falls short of 1.0, that unit is badly calibrated and needs recalibrating; on the Developer Kit, the collection program refuses to connect to a gripper that was never calibrated. See [Confirm it took effect](../pc/calibration.md#413).

    This is **travel (opening) calibration**, a different thing from the fisheye intrinsics above: an uncalibrated fisheye falls back to reference intrinsics and recording still works, while an uncalibrated opening makes `gripper.pos` untrustworthy on the Backpack Kit and blocks recording entirely on the Developer Kit.

??? question "How valuable is tactile data for training? Does a grasp that touches nothing hurt?"
    Tactile is the core modality of this collection system. In a grasp that touches nothing the tactile image shows no contact deformation, so the frame carries almost no information and is of little value; while collecting, watch the tactile image in the preview to confirm the grasp makes real contact, see [Collection standards](../pc/recording.md#practice). Raw tactile resolution is 640 × 480 at up to 120Hz, and it is rectified according to the project settings at export.

## Export and upload {#export}

??? question "What formats can the Backpack Kit export?"
    XHE projects can download a ZIP or upload original `.xhe.mcap` files by task. V1 projects can export **LeRobotDataset v3.0** (`meta/` + `data/` + `videos/`, 30 fps) and **Training MCAP** (`.train.mcap`, aligned to 30 Hz). New projects default to XHE. Choose V1 when creating a project that feeds a Training MCAP or LeRobot workflow. See [Export formats](../backpack/projects-export.md#formats).

??? question "Where can data be uploaded to?"
    Download an archive to a tablet / computer, or upload to ModelScope, S3, Tencent Cloud COS, FTP / FTPS or NFS; STS supports MCAP only. Before uploading, the file list is shown, and the transfer starts only after you confirm. See [Upload to remote](../backpack/projects-export.md#upload).

??? question "Why is disk space not freed after uploading?"
    Local files are kept by default. To free space you have to **archive** separately (tick "Automatically archive after upload" when uploading, or archive by hand later). Archiving deletes the raw files, after which the recording cannot be replayed, re-exported or downloaded as raw MCAP. See [Archive](../backpack/projects-export.md#archive).

??? question "Why does it ask for a re-export after an upgrade?"
    The first export after upgrading to Collector 0.5.0 rebuilds the old export cache. In earlier releases, 0.4.6 changed the pose origin and left-hand convention, and 0.4.7 changed to selecting each camera's nearest frame independently and interpolating pose and opening at the frame time. Re-export recordings whose source files are still available. See [Export version notes](../backpack/troubleshooting.md#export).

??? question "Can Backpack Kit and Developer Kit data be merged for training?"
    Yes. Both are LeRobotDataset v3, and the same tools read either. But camera key names and field layout differ, so compare each side's `meta/info.json` before merging; for the Backpack Kit also use `tcp_frame_convention` (currently `mirrored-v1`) to tell the left- and right-hand conventions apart. See [How the two differ](editions.md).

??? question "How large is one dataset?"
    An exported Backpack Kit LeRobot dataset is about **0.5 GB per hour**, set mainly by the project's "Export quality" (High quality / Standard / Compact, chosen when the project is created and not changeable afterwards). See [LeRobot dataset size](../backpack/troubleshooting.md#export). The Developer Kit has separate [storage planning](../pc/dataset.md#storage-planning).

??? question "How is data delivered on the Developer Kit?"
    Recordings live locally under `$HF_LEROBOT_HOME`; uploading is both an off-site backup and the delivery:

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
    ```

    Optional `--private`, `--upload-large-folder` and `--no-videos`; run `hf auth login` before uploading, and run `lerobot-check-dataset` once. See [Pushing to the Hugging Face Hub and backup](../pc/dataset.md#64).

??? question "How does a raw recording differ from an exported MCAP?"
    XHE writes `.xhe.mcap` directly, retains native stream rates and sensor readings, and opens in Foxglove. V1 exports `.train.mcap` aligned to 30 Hz, with images corrected according to project settings. Legacy V1 engineering mode also supports downloading individual source recordings for analysis. See [MCAP](../backpack/projects-export.md#mcap).

## Replay {#replay}

??? question "Can I watch a recording on the console without downloading it?"
    Yes. In Collector 0.5.0, once an XHE recording is finalized, click Playback on its row on the backpack console's Project page. Archived recordings cannot be played in the console. For Collector 0.4.7 playback controls and live preview restrictions, see [Playback](../backpack/projects-export.md#playback).

??? question "On the Developer Kit, how do I watch while recording, and review afterwards?"
    - **While recording**: `--display_data=true` opens Rerun for the live views, the scalar panel and the `/world` 3D view (the gripper's trail covers about 3 seconds).
    - **After recording**: open it locally with `xense-lerobot-viewer`; the video and telemetry timelines are synced, and 3D URDF replay supports TacCap collection grippers, treating the recorded pose as the end-effector TCP by default.
    - **Online**: once uploaded to the Hub, browse episode by episode with the LeRobot Dataset Visualizer.
    - See [Replay and visualization](../pc/dataset.md#replay).

??? question "Can `lerobot-replay` play recorded actions back onto real hardware?"
    **Not with XTac UMI's gripper types.** `lerobot-replay` calls the robot's `send_action()` step by step, and `send_action()` on `taccap_gripper` / `bi_taccap_gripper` / `xtac_umi_g1` is a no-op: the collection grippers are passive demonstration devices whose motors are not commanded by the program, and the opening is moved mechanically by hand. Replaying these datasets therefore neither drives the gripper nor raises an error.

    To execute recorded actions on real hardware, implement a `send_action()` adapter on **your own robot** (or a follower gripper with your own control mapping), then point `lerobot-replay` at that robot type.

??? question "The 3D trajectory does not match the video on replay?"
    First confirm that the video and the data are from the same episode (switch episodes in the viewer), then that the dataset has not been edited (`lerobot-edit-dataset` re-encodes the video). Pose jumps usually mean XR was restarted, or a tracker was lost, during recording; see [Pose anomalies on the monitor page](../backpack/troubleshooting.md#tracker).
