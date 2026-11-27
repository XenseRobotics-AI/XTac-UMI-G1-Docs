# Backpack Kit: the XTac UMI Backpack

The **XTac UMI Backpack** is the Backpack Kit's collection host: the grippers and headset plug straight in, the collection software, XTac UMI Collector, runs on the backpack, and a tablet, phone or computer just opens the console in a browser; no computer and no site network needed.

- **One-person operation**: the gripper buttons start and stop recording, and the LEDs and voice prompts report the state.
- **Raw recordings**: each demonstration is saved as one MCAP file, organized by project and task.
- **Delivery**: export per task as a LeRobot dataset or MCAP; download, or upload to ModelScope, S3, FTP, NFS and more.

![The console's Live monitoring page: every camera, the visuotactile images and the poses on one screen](../assets/backpack/monitor-live-en.webp)

[Quickstart](quickstart.md){ .md-button .md-button--primary }
[Compare the two editions](../product/editions.md){ .md-button }

## Where to start {#first-deploy}

Read [Safety and compliance](../product/safety.md) before operating. For a first deployment, work through the table below in order; after that, follow the [Quickstart](quickstart.md) every working day.

| Step | What to do | Details |
|---|---|---|
| 1. Headset setup | Update Pico OS, turn on developer mode, set screen-off and sleep to "Never", pair the two trackers (odd left, even right), install XTac UMI XR | [Pico4 headset and tracker setup](../common/pico4.md) |
| 2. Wiring and power | Grippers → headset → power the backpack on; adapter or power-bank power | [Unboxing, cabling and power](unbox-connect.md) |
| 3. Open the console | Plug the tablet into the backpack's `HOST1` / `HOST2` port and the console opens automatically; without a tablet, use the backpack hotspot | [Network and console access](network.md) |
| 4. Connect the headset to the backpack | In XTac UMI XR choose "XTac" as the connection and tap "Connect" | [Connecting the headset to the backpack](unbox-connect.md#pico-link) |
| 5. Gripper calibration | Calibrate each leader gripper's closed zero and maximum travel once | [Gripper configuration](system.md#gripper) |
| 6. Create a project and task | Choose the capture mode when you create the project; it cannot be changed afterwards | [Picking a project and task](monitor-record.md#project-task) |
| 7. Upload configuration (optional) | Save the remote account and bind it when you create a project | [Upload configurations](system.md#upload) |

## The console {#console}

Open the backpack's address in a browser to reach the console; the top bar has four pages:

| Page | What it does | Details |
|---|---|---|
| Live monitoring | Every view, pose and opening on one screen; pick a project and task, start / stop recording | [Live monitoring and recording](monitor-record.md) |
| Project | Manage recordings: playback, delete, export, upload, archive | [Projects, playback and export](projects-export.md) |
| Playback | Review recordings whose source files are still on the backpack | [Playback](projects-export.md#playback) |
| System | Device information, gripper calibration and firmware, capture settings, uploads, network, updates, interface language | [System settings](system.md) |

Recording is mainly driven by the gripper buttons: long-press right to start, long-press left to stop, with no browser needed; see [Gripper buttons, LEDs and voice](gripper.md).

## System composition {#system}

Every device plugs into the backpack, which stores the raw recordings; datasets are generated per task at export. Hover over (or tap) any block to see where its data comes from and where it goes; the buttons above switch between the three [capture modes](system.md#capture-mode).

<div class="tc-arch" data-layout="backpack"><script type="application/json">
{
  "defaultTier": 2,
  "title": "Backpack Kit collection architecture",
  "tiers": [
    "Dual gripper",
    "Dual gripper + stereo headset",
    "Dual gripper + headset right eye"
  ],
  "cols": {
    "dev": "Devices",
    "read": "Backpack · read",
    "core": "Backpack · process",
    "out": "Output",
    "up": "Retrieve and upload"
  },
  "group": "Leader grippers ×2 (left / right)",
  "hint": "Hover over (or tap) any block to see where its data comes from and where it goes.",
  "sep": ": ",
  "offNote": " (not used in the selected mode)",
  "legend": [
    "Data and poses",
    "Headset images"
  ],
  "edges": {
    "e-grip": "USB serial",
    "e-tact": "USB",
    "e-wrist": "USB",
    "e-track": "Wireless",
    "e-head": "Type-C cable"
  },
  "nodes": {
    "grip": {
      "title": "MCU · encoder",
      "sub": "Opening · IMU · buttons",
      "desc": "The leader gripper's MCU reports the finger angle, IMU and button gestures to the backpack over USB."
    },
    "tact": {
      "title": "Visuotactile ×2",
      "sub": "One per finger",
      "desc": "One visuotactile sensor per finger. Collector 0.5.0 XHE recordings store 640×480 tactile images at 60 fps."
    },
    "wrist": {
      "title": "Wrist camera",
      "sub": "Wrist-view fisheye",
      "desc": "Choose 640×480 or 1920×1080 wrist capture in the project. 1080p requires firmware 1.3.1 and matching calibration."
    },
    "tracker": {
      "title": "Tracker ×2",
      "sub": "Pico4U",
      "desc": "Mounted on top of each gripper; the headset tracks its 6-DoF pose. Every Backpack Kit capture mode needs it."
    },
    "headset": {
      "title": "Headset",
      "sub": "Pico4 Ultra Enterprise",
      "desc": "Runs XTac UMI XR and sends poses to the backpack over a Type-C cable (wired only); in modes that record the headset it also sends stereo or right-eye images at the project resolution."
    },
    "mcu": {
      "title": "Gripper data",
      "sub": "Opening · IMU · buttons",
      "desc": "Reads the opening and IMU; button gestures control recording."
    },
    "tcam": {
      "title": "Tactile capture",
      "sub": "XHE · 60 fps",
      "desc": "Captured and saved as raw frames; rectified at export with the sensor's own calibration, in the orientation chosen for the project (700 × 400 by default)."
    },
    "fcam": {
      "title": "Fisheye capture",
      "sub": "Raw frames · 30fps",
      "desc": "Saved as raw fisheye frames; the undistortion parameters are frozen at record start and applied at export."
    },
    "xvr": {
      "title": "Built-in pose service",
      "sub": "Starts with the backpack",
      "desc": "A pose service built into the backpack, up as soon as it boots with nothing to start; clocks are synced with the headset before recording, and headset frames carry capture timestamps."
    },
    "enc": {
      "title": "Hardware encoding",
      "sub": "H.264 · preview only",
      "desc": "The backpack hardware-encodes each view once and pushes it to every device with the console open for live preview; recordings use a separate path, with streaming encoding enabled by default for XHE."
    },
    "rec": {
      "title": "Recording",
      "sub": "Buttons or console",
      "desc": "Checks that every camera and the gripper data are ready before recording; while recording it saves raw frames, opening, IMU and poses, counts bad frames and tracking loss, and flags quality issues afterwards."
    },
    "console": {
      "title": "Browser console",
      "sub": "Tablet · phone · computer",
      "desc": "Open the backpack's console in a browser: Live monitoring, Project, Playback and System settings."
    },
    "mcap": {
      "title": "MCAP raw recording",
      "sub": "One file per episode · NVMe",
      "desc": "Each demonstration is one MCAP file on the backpack's NVMe data disk, holding every raw frame, sensor stream and calibration."
    },
    "export": {
      "title": "Export per task",
      "sub": [
        "XHE MCAP / V1",
        "Pre-checked first"
      ],
      "desc": "Process recordings by task. Download or upload original XHE MCAP files, or export LeRobotDataset v3 or Training MCAP from V1 projects."
    },
    "dl": {
      "title": "Download",
      "sub": "Packed archive",
      "desc": "Pack the export in the console and download it to a tablet or computer."
    },
    "upload": {
      "title": "Upload",
      "sub": [
        "ModelScope · S3",
        "FTP · NFS"
      ],
      "desc": "Upload to a backend configured beforehand: ModelScope, S3, FTP / FTPS or NFS; local files are kept by default, archive them when you need the space."
    }
  }
}
</script></div>

## What each frame records {#frame}

In an exported LeRobot dataset, each row is the **observation** from frame t-1 plus the **action** from frame t. Hover over (or tap) any data item to see where it comes from and where it is stored.

<div class="tc-arch" data-diagram="frame"><script type="application/json">
{
  "title": "What makes up one row of a LeRobot dataset exported from the backpack",
  "tiers": [
    "Dual gripper",
    "Dual gripper + stereo headset",
    "Dual gripper + headset right eye"
  ],
  "defaultTier": 2,
  "on": {
    "ltrk": [
      1,
      2,
      3
    ],
    "rtrk": [
      1,
      2,
      3
    ],
    "o_ltcp": [
      1,
      2,
      3
    ],
    "o_rtcp": [
      1,
      2,
      3
    ],
    "a_ltcp": [
      1,
      2,
      3
    ],
    "a_rtcp": [
      1,
      2,
      3
    ],
    "head": [
      2,
      3
    ],
    "o_head": [
      2,
      3
    ],
    "a_head": [
      2,
      3
    ],
    "L_h": [
      2
    ],
    "R_h": [
      2,
      3
    ]
  },
  "keyNames": {
    "L_h": "head_left",
    "R_h": "head_right",
    "o_head": "head.*",
    "a_head": "head.*"
  },
  "cols": {
    "src": "Source",
    "obs": "Observation · frame t-1",
    "act": "Action · frame t",
    "out": "Stored as"
  },
  "groups": {
    "img": "observation.images · {n} streams",
    "state": "observation.state · {n}-D",
    "act": "action · {n}-D"
  },
  "timeline": {
    "caption": "time →",
    "obs": "obs",
    "act": "action",
    "row": "one dataset row"
  },
  "hint": "Hover over (or tap) any data item, source or storage block to see where it comes from and where it is stored.",
  "sep": ": ",
  "offNote": " (not recorded in the selected mode)",
  "dims": " {n} dimensions in total.",
  "obsNote": " The observation holds the value from frame t-1.",
  "actNote": " The action holds the value from frame t, one step ahead of the observation.",
  "keys": {
    "tactile": "The visuotactile image from one finger of this gripper, rectified at export: 700 × 400 landscape by default (400 × 700 can be chosen per project), 30fps.",
    "wrist": "This gripper's wrist fisheye view at the project resolution; exported rectified when the project turns on wrist fisheye rectification.",
    "headimg": "One eye of the headset camera at the project resolution. Stereo mode records both eyes; right-eye mode records the right eye only.",
    "tcp": "The pose of this gripper's tip (midpoint between the fingers) in the world frame: position x, y, z (meters) plus the 6-D rotation r1–r6, derived from the tracker pose. Recorded in all three modes.",
    "grip": "This gripper's opening, closed = 0, open = 1.",
    "headpose": "The headset pose in the world frame, same format as tcp.*; written only in the modes that record headset images."
  },
  "nodes": {
    "lgrip": {
      "title": "Left gripper",
      "sub": "Tactile · wrist · encoder",
      "desc": "Provides two visuotactile images, the wrist fisheye view and the opening."
    },
    "ltrk": {
      "title": "Left tracker",
      "sub": "Via headset + backpack",
      "desc": "Its pose is transformed to the left gripper tip as left_tcp.*, stored once in the observation and once in the action. Recorded in all three modes."
    },
    "rgrip": {
      "title": "Right gripper",
      "sub": "Tactile · wrist · encoder",
      "desc": "Provides two visuotactile images, the wrist fisheye view and the opening."
    },
    "rtrk": {
      "title": "Right tracker",
      "sub": "Via headset + backpack",
      "desc": "Its pose is transformed to the right gripper tip as right_tcp.*, stored once in the observation and once in the action. Recorded in all three modes."
    },
    "head": {
      "title": "Headset",
      "sub": "Stereo camera · head pose",
      "desc": "Provides the headset images (stereo or right eye) and the head pose head.*, which is stored in both the observation and the action. Not recorded in Dual gripper mode."
    },
    "mp4": {
      "title": "MP4 video",
      "sub": "videos/ · one key each",
      "desc": "Each image stream is one video key, observation.images.<key>, encoded to MP4 at export and stored under videos/."
    },
    "pq": {
      "title": "Parquet table",
      "sub": [
        "data/ · one row per frame",
        "state + action + index"
      ],
      "desc": "One row per frame: the observation.state and action vectors, plus index columns such as timestamp, frame index and episode index, stored under data/."
    }
  }
}
</script></div>

- The action leads the observation by one step; the first frame of each episode has nothing to pair with, so each episode is one frame shorter.
- The poses `*_tcp.*` and `head.*` are 9-D each: position x, y, z plus a 6-D rotation; for the convention and the origin see [Export formats](projects-export.md#lerobot).
- Dimensions: Dual gripper, state and action 20-D each, 6 image streams; Dual gripper + stereo headset, 29-D each, 8 streams; Dual gripper + headset right eye, 29-D each, 7 streams (`head_right` only).

## Known limitations {#faq}

- Do not restart XTac UMI XR during collection: a restart resets the world origin, see [Startup and frame alignment](../common/pico4.md#pico-frame).
- In Collector 0.4.7, playback and live preview cannot run at the same time. See [Playback](projects-export.md#playback).
- The backpack only joins 5GHz Wi-Fi; with 2.4GHz only on site, use a cable or the backpack hotspot.
- Some phones and Windows cannot open the `.local` device name; use the IP address instead.
- While a recording is in progress, switching project / task, gripper calibration, firmware upgrades and system updates are all refused; stop recording first.

For problems see [Troubleshooting](troubleshooting.md); component versions are in [Versions and upgrades](versions.md).
