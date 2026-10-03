# 1. Overview

!!! abstract "Scope of this manual"
    Covers the full path from **handheld collection** to **data on disk as a [LeRobotDataset v3.0](06-dataset.md)**:
    hardware → installation → host setup → calibration → collection → dataset. **Model training, inference and deployment are out of scope.**

## 1.1 What is the XTac-UMI G1

The **XTac-UMI G1** is XenseRobotics' **handheld visuotactile multimodal data-collection gripper** for robot
manipulation learning; see [Highlights](highlights.md) for more. Each leader gripper integrates:

| Part | Notes | Rate |
|---|---|---|
| Encoder | Jaw opening; [calibration](04-calibration.md#41) normalises it to closed = 0, open = 1 | 100 Hz |
| Two visuotactile sensors (one per finger) | Visuotactile image, about `(400, 700, 3)` after rectification | ~30 Hz |
| Wrist camera | Wrist-view RGB | ~30 Hz |
| IMU | Accel, gyro, magnetometer; reserved, not recorded by default | 100 Hz |

!!! note "Handheld demonstration, no teleoperator"
    The operator performs the demonstration with the gripper in hand, so the recording command needs **no `--teleop.*` flags**.

## 1.2 System components

Collection runs inside one `lerobot-record` process on the collection PC: each device is read independently, every frame takes the latest value from each stream, and the paired frames are written to the dataset.
Hover over (or tap) any block to see where its data comes from and where it goes; the buttons above switch between the three tiers.

<div class="tc-arch"><script type="application/json">
{
  "title": "XTac-UMI G1 collection system architecture",
  "tiers": ["① Grippers only", "② With wrist pose", "③ Full rig"],
  "cols": {"dev": "Devices", "read": "Collection PC · read", "core": "Collection PC · process", "out": "Output"},
  "group": "Leader grippers ×2 (left / right)",
  "hint": "Hover over (or tap) any block to see where its data comes from and where it goes.",
  "sep": ": ",
  "offNote": " (not used in the selected tier)",
  "legend": ["Data and poses", "Headset stereo images (tier ③)"],
  "edges": {
    "e-grip": "USB serial", "e-tact": "USB", "e-wrist": "USB",
    "e-track": "Wireless", "e-head": "Wired / WiFi"
  },
  "nodes": {
    "grip": {"title": "MCU · encoder", "sub": "Jaw angle", "desc": "The leader gripper's MCU reads the encoder for the jaw angle and pushes it to the PC over USB serial. The MCU also carries an IMU, reserved and not recorded by default."},
    "tact": {"title": "Visuotactile ×2", "sub": "One per finger", "desc": "One visuotactile sensor on each finger, imaging the contact between the finger surface and the object."},
    "wrist": {"title": "Wrist camera", "sub": "Wrist-view RGB", "desc": "A fisheye camera on the gripper giving the wrist view."},
    "tracker": {"title": "Motion tracker ×2", "sub": "Pico4 Ultra", "desc": "Mounted on top of each gripper; the headset tracks its 6-DoF pose. Not needed in tier ①."},
    "headset": {"title": "Headset", "sub": "Pico4 Ultra Enterprise", "desc": "Runs XTac-UMI XR, tracks both trackers and sends the poses to the PC over a cable (recommended) or WiFi; in tier ③ it also streams its own stereo cameras as a first-person view, plus the head pose. The world origin is where the headset was when the XR app started."},
    "sdk": {"title": "xense.taccap", "sub": "Serial · 100 Hz push", "desc": "The gripper SDK receives the readings the MCU pushes (100 Hz by default) and normalises the jaw angle with the calibration into gripper.pos (closed = 0, open = 1)."},
    "xsdk": {"title": "xensesdk", "sub": "Rectified · 30 fps", "desc": "The visuotactile sensor SDK reads each sensor independently and outputs the rectified visuotactile image (about 400 × 700) at 30 fps by default."},
    "cam": {"title": "Camera capture", "sub": "640 × 480 · 30 fps", "desc": "Finds each gripper's wrist camera by serial number and reads each one independently, 640 × 480 at 30 fps by default. Fisheye undistortion is optional and off by default."},
    "pcs": {"title": "XenseVR PC Service", "sub": "Pose · ~90 Hz", "desc": "A service on the PC that receives the tracker poses from the headset (refreshed at about 90 Hz); the collection program transforms them to the gripper tip (TCP) to get tcp.*. In tier ③ it also relays the headset stereo images (left and right paired by frame number) and the head pose."},
    "obs": {"title": "Frame assembly", "sub": "Latest of each stream", "desc": "Each frame (30 fps by default) takes the latest value of every stream as one observation: opening, gripper pose, visuotactile images and wrist view; tier ③ adds the headset stereo images and head pose."},
    "pair": {"title": "Shifted pairing", "sub": "Obs t-1 + action t", "desc": "Pairs the previous frame's observation with this frame's gripper pose and opening (plus the head pose in tier ③), so the action leads the observation by one step. The first frame of each episode has nothing to pair with, so each episode is one frame shorter."},
    "rerun": {"title": "Rerun live preview", "sub": "--display_data=true", "desc": "Add --display_data=true when previewing or recording to see every image stream, value curves and a 3D view of the gripper trajectories live. Display only; nothing here goes into the dataset."},
    "ds": {"title": "LeRobotDataset v3.0", "sub": ["Parquet + MP4", "+ meta/hardware.json"], "desc": "State and action go to Parquet; every camera is encoded to MP4 while recording, using hardware encoding automatically when an NVIDIA GPU is present. The hardware manifest, such as the serial numbers of this kit, is stored separately in meta/hardware.json."}
  }
}
</script></div>

- The **leader grippers** connect over USB: the opening is read by `xense.taccap` (100 Hz push), the visuotactile images by `xensesdk`, and each wrist camera is matched to its gripper by serial number.
- The **motion trackers** sit on top of the grippers and are tracked by the **headset**, which hands the poses to the **XenseVR PC Service** over a cable (recommended) or WiFi; the collection program then transforms them to the gripper tip (TCP). Tier ③ also brings the headset stereo images and head pose.
- **`lerobot-record`** takes the latest value of every stream each frame, pairs the previous frame's observation with this frame's pose and opening, and writes a **LeRobotDataset v3.0**; camera streams are encoded while recording, with hardware encoding on an NVIDIA GPU.

Collection comes in three tiers depending on the connected devices, chosen with `--robot.type`:

| Tier | Devices needed | Data recorded |
|---|---|---|
| ① Grippers only | Leader grippers | Tactile, wrist cameras, opening |
| ② With wrist pose | Grippers + trackers + headset | Adds the gripper pose |
| ③ Full rig | Same as ② | Adds headset stereo images and head pose |

Commands are in [5. Data preview and collection](05-data-collection.md).

## 1.3 What each frame records

Taking two grippers as the example, each dataset row is the **observation** from frame t-1 plus the **action** from frame t. Hover over (or tap) any data item, source or storage block to see where it comes from and where it is stored; the buttons switch between the three tiers.

<div class="tc-arch" data-diagram="frame"><script type="application/json">
{
  "title": "What makes up one XTac-UMI G1 dataset row",
  "tiers": ["① Grippers only", "② With wrist pose", "③ Full rig"],
  "cols": {"src": "Source", "obs": "Observation · frame t-1", "act": "Action · frame t", "out": "Stored as"},
  "groups": {"img": "observation.images · {n} streams", "state": "observation.state · {n}-D", "act": "action · {n}-D"},
  "timeline": {"caption": "time →", "obs": "obs", "act": "action", "row": "one dataset row"},
  "hint": "Hover over (or tap) any data item, source or storage block to see where it comes from and where it is stored.",
  "sep": ": ",
  "offNote": " (not recorded in the selected tier)",
  "dims": " {n} dimensions in total.",
  "obsNote": " The observation holds the value from frame t-1.",
  "actNote": " The action holds the value from frame t, one step ahead of the observation.",
  "keys": {
    "tactile": "The visuotactile image from one finger of this gripper, rectified to about 400 × 700, 30 fps.",
    "wrist": "This gripper's wrist camera view, 640 × 480 by default.",
    "headimg": "One eye of the headset camera, 640 × 480 by default; recorded in tier ③ only.",
    "tcp": "The pose of this gripper's tip (midpoint between the fingers) in the world frame: position x, y, z (metres) plus the 6-D rotation r1–r6, derived from the tracker pose.",
    "grip": "This gripper's opening, closed = 0, open = 1.",
    "headpose": "The headset pose in the world frame, same format as tcp.*; recorded in tier ③ only."
  },
  "nodes": {
    "lgrip": {"title": "Left gripper", "sub": "Tactile · wrist · encoder", "desc": "Provides two visuotactile images, the wrist camera view and the opening."},
    "ltrk": {"title": "Left tracker", "sub": "Via headset + PC Service", "desc": "Its pose is transformed to the left gripper tip as left_tcp.*, stored once in the observation and once in the action. Not recorded in tier ①."},
    "rgrip": {"title": "Right gripper", "sub": "Tactile · wrist · encoder", "desc": "Provides two visuotactile images, the wrist camera view and the opening."},
    "rtrk": {"title": "Right tracker", "sub": "Via headset + PC Service", "desc": "Its pose is transformed to the right gripper tip as right_tcp.*, stored once in the observation and once in the action. Not recorded in tier ①."},
    "head": {"title": "Headset", "sub": "Stereo camera · head pose", "desc": "Provides the left and right eye images and the head pose head_camera.*, which is stored in both the observation and the action. Recorded in tier ③ only."},
    "mp4": {"title": "MP4 video", "sub": "videos/ · one key each", "desc": "Each image stream is one video key, observation.images.<key>, encoded to MP4 while recording and stored under videos/."},
    "pq": {"title": "Parquet table", "sub": ["data/ · one row per frame", "state + action + index"], "desc": "One row per frame: the observation.state and action vectors, plus index columns such as timestamp, frame index and episode index, stored under data/."}
  }
}
</script></div>

- The observation comes from frame t-1 and the action from frame t, so the action leads by one step; the first frame of each episode has nothing to pair with, so each episode is one frame shorter.
- The poses `*_tcp.*` and `head_camera.*` are 9-D each: position x, y, z plus a 6-D rotation, in a world frame of X forward / Y left / Z up.
- Dimensions per tier: ① state and action 2-D each, 6 image streams; ② 20-D each, 6 streams; ③ 29-D each, 8 streams.
- With a single gripper (`--robot.type=taccap_gripper`) the keys have no `left_` / `right_` prefix and the wrist camera is `wrist_cam`.

Field details are in [5.3 What each frame records](05-data-collection.md#53), the dataset format in [6. Dataset & Examples](06-dataset.md).

## 1.4 Platform requirements

Exact versions are in [Versions & support](versions.md). Whether it installs comes down to:

- **Linux amd64 only**, tested on Ubuntu 22.04 / 24.04; macOS and Windows are not supported.
- **Python 3.12 or newer**, set up by following [Environment Setup](02-environment.md).
- **Minimum collection host**: 12th-gen i7, 8 GB RAM, NVIDIA RTX 3060 with 8 GB VRAM, driver ≥ 570.144;
  both tiers are in [Collection host requirements](02-environment.md#host-spec).
  Below that it installs and records, but noticeably less efficiently; see [Recording on a machine with no NVIDIA GPU](05-data-collection.md#no-gpu).
- Your user must be in the `dialout` and `video` groups, see [3.1 Serial permissions](03-host-hardware.md#31); and keep ModemManager off the gripper serial port, see [3.2](03-host-hardware.md#32).

Next → [2. Environment Setup](02-environment.md)
