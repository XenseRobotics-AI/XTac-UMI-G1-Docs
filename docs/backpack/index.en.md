# Backpack Kit: the XTac-UMI Backpack

Welcome to the XTac-UMI Backpack. This page is the getting-started guide for the Backpack Kit:

- **First deployment**: when you first receive the kit, work through the [first deployment checklist](#first-deploy) on this page.
- **Daily collection**: before each collection session, check the [daily collection cheat sheet](#daily).
- **Goal**: by the end of this page you will be able to complete one full collection on your own, from powering on to exporting a dataset.

## What this kit is {#overview}

- **The backpack is the host**: the collection software, XTac-UMI Collector, runs on the backpack, and collection, replay and export all happen in its console. A tablet, phone or computer just opens the console in a browser; no separate collection host is needed.
- **One-person operation**: the gripper buttons start and stop recording, and the LEDs and voice prompts report the state, so one person can run the whole collection.
- **What is recorded**: each take is saved as one raw MCAP recording, capturing the left and right wrist fisheye views, four visuotactile feeds, the headset images, the 6-DoF poses of the headset and both trackers, and the gripper opening in sync.
- **Export**: export per task as a [LeRobot dataset](projects-export.md#lerobot) or [MCAP](projects-export.md#mcap), then download an archive or upload to ModelScope, S3, FTP or NFS.
- **Suits**: high-volume collection operations and collection teams. The software is delivered closed-source, with support for light customisation.

The box contents are in [Box contents and wiring](../product/editions.md#kit); check them against [Unboxing, cabling and power](unbox-connect.md#unbox). To use your own x86 workstation and build entirely on LeRobot, see the [Developer Kit](../pc/index.md); the differences are in [Product line and configuration comparison](../product/editions.md).

![The console's live monitor page: every camera, the visuotactile images and the poses on one screen](../assets/backpack/monitor-live.webp)

The console shows every camera, the visuotactile images and the poses on one screen, with the gripper opening updated in real time; recording state, free disk space and tracker-loss alerts are on the same screen, viewable from a tablet or phone. What to check before recording is in [Checks on the Live monitor page](monitor-record.md#checks), and the product introduction is in [The Backpack](../product/backpack.md).

## System composition {#system}

The whole capture happens in the backpack: every device plugs into it, it stores the raw recordings, and datasets are generated per task at export. Hover over (or tap) any block to see where its data comes from and where it goes; the buttons above switch between the three capture modes.

<div class="tc-arch" data-layout="backpack"><script type="application/json">
{
  "defaultTier": 2,
  "title": "Backpack Kit collection architecture",
  "tiers": [
    "Dual gripper",
    "Dual gripper + headset stereo",
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
      "desc": "The leader gripper's MCU reports the jaw angle and IMU (100 Hz each) and button gestures to the backpack over USB."
    },
    "tact": {
      "title": "Visuotactile ×2",
      "sub": "One per finger",
      "desc": "One visuotactile sensor per finger, captured at 640 × 480, 120 fps."
    },
    "wrist": {
      "title": "Wrist camera",
      "sub": "Wrist-view fisheye",
      "desc": "The wrist-view fisheye image, 640 × 480 at 30 fps."
    },
    "tracker": {
      "title": "Motion tracker ×2",
      "sub": "Pico4 Ultra",
      "desc": "Mounted on top of each gripper; the headset tracks its 6-DoF pose. Every Backpack Kit capture mode needs it."
    },
    "headset": {
      "title": "Headset",
      "sub": "Pico4 Ultra Enterprise",
      "desc": "Runs XTac-UMI XR and sends poses to the backpack over a Type-C cable (wired only); in modes that record the headset it also sends stereo or right-eye images (640 × 480 or 1024 × 768 per eye)."
    },
    "mcu": {
      "title": "Gripper data",
      "sub": "Opening · IMU · buttons",
      "desc": "Reads the opening and IMU; button gestures control recording."
    },
    "tcam": {
      "title": "Tactile capture",
      "sub": "Raw frames · 120 fps",
      "desc": "Captured and saved as raw frames; rectified at export with the sensor's own calibration, in the orientation chosen for the project (700 × 400 by default)."
    },
    "fcam": {
      "title": "Fisheye capture",
      "sub": "Raw frames · 30 fps",
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
      "desc": "The backpack hardware-encodes each view once and pushes it to every device with the console open for live preview; recordings keep the raw frames and skip this step."
    },
    "rec": {
      "title": "Recording",
      "sub": "Buttons or console",
      "desc": "Checks that every camera and the gripper data are ready before recording; while recording it saves raw frames, opening, IMU and poses, counts bad frames and tracking loss, and flags quality issues afterwards."
    },
    "console": {
      "title": "Browser console",
      "sub": "Tablet · phone · computer",
      "desc": "Open the backpack's console in a browser: live monitor, projects, playback and system settings."
    },
    "mcap": {
      "title": "MCAP raw recording",
      "sub": "One file per take · NVMe",
      "desc": "Each demonstration is one MCAP file on the backpack's NVMe data disk, holding every raw frame, sensor stream and calibration."
    },
    "export": {
      "title": "Export per task",
      "sub": [
        "LeRobot v3 / MCAP",
        "Pre-checked first"
      ],
      "desc": "Export a task as LeRobotDataset v3 or MCAP; recordings are checked for completeness first, then you download them or upload to a remote backend."
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

- The **leader grippers** plug into the backpack's `UMI-L` / `UMI-R`: opening, IMU and button presses are reported over USB, and the visuotactile and wrist fisheye images are stored as raw frames.
- The **trackers** sit on top of the grippers and are tracked by the **headset**; the headset connects to the backpack over a single Type-C cable and sends the poses, plus stereo or right-eye images in the modes that record them.
- The **backpack** stores each recording as one raw MCAP file; export per task to LeRobotDataset v3 or MCAP, then download it or upload it to a remote backend. The console opens in the browser of a tablet, phone or computer.

## What each frame records {#frame}

In an exported LeRobot dataset, each row is the **observation** from frame t-1 plus the **action** from frame t. Hover over (or tap) any data item, source or storage block to see where it comes from and where it is stored; the buttons switch between the three capture modes.

<div class="tc-arch" data-diagram="frame"><script type="application/json">
{
  "title": "What makes up one row of a LeRobot dataset exported from the backpack",
  "tiers": [
    "Dual gripper",
    "Dual gripper + headset stereo",
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
    "tactile": "The visuotactile image from one finger of this gripper, rectified at export: 700 × 400 landscape by default (400 × 700 can be chosen per project), 30 fps.",
    "wrist": "This gripper's wrist fisheye view, 640 × 480; exported rectified when the project turns on wrist fisheye rectification.",
    "headimg": "One eye of the headset camera, 640 × 480 or 1024 × 768 per eye (set per project). Stereo mode records both eyes; right-eye mode records the right eye only.",
    "tcp": "The pose of this gripper's tip (midpoint between the fingers) in the world frame: position x, y, z (metres) plus the 6-D rotation r1–r6, derived from the tracker pose. Recorded in all three modes.",
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

- The observation comes from frame t-1 and the action from frame t, so the action leads by one step; the first frame of each episode has nothing to pair with, so each episode is one frame shorter.
- The poses `*_tcp.*` and `head.*` are 9-D each: position x, y, z plus a 6-D rotation, in a world frame of X forward / Y left / Z up.
- Dimensions per mode: Dual gripper, state and action 20-D each, 6 image streams; Dual gripper + headset stereo, 29-D each, 8 streams; Dual gripper + headset right eye, 29-D each, 7 streams (`head_right` only).

Export formats and the extra files are in [LeRobot dataset](projects-export.md#lerobot).

## First deployment checklist {#first-deploy}

!!! note "Before you start"
    Read [Safety and compliance](../product/safety.md) first. This page is an overview of the deployment: it says only what to do and where to do it; each step's detailed walkthrough is on its own page.

### 1. Headset setup {#deploy-headset}

- **System update**: update Pico OS to 5.15.5.U or later.
- **System settings**: [turn on developer mode and set screen-off and sleep to "Never"](../common/pico4.md#pico-system).
- **Trackers**: [pair the two trackers with the headset](../common/pico4.md#pico-tracker-bind) by the "odd left, even right" rule and switch them to independent tracking mode.
- **Software**: [install XTac-UMI XR](../common/pico4.md#pico-app) on the headset.

### 2. Wiring and power {#deploy-wiring}

Connect in the [fixed order](unbox-connect.md#order): grippers → headset → power the backpack on.

**Cables**

- Plug the left and right grippers into the backpack's `UMI-L` and `UMI-R` ports.
- Connect the headset to the backpack's `PICO` port with the headset cable (Pico → Pack).

**Power (choose one)**

- **Option A**: [adapter power](unbox-connect.md#adapter), with the power adapter plugged into the backpack's `DC` port.
- **Option B**: [power-bank power](unbox-connect.md#powerbank), with the power bank connected to the backpack's `DC` port through the 0.3 m 12 V PD power cable.

The grippers' connection and power requirements are in [Gripper connection and serial numbers](../common/gripper.md#power).

### 3. Open the console {#deploy-console}

- **Tablet**: cable the tablet to the backpack's `HOST1` or `HOST2` port and the backpack opens the console on it; see [Tablet over USB](network.md#tablet).
- **No tablet**: connect to the [backpack hotspot](network.md#softap) instead.

### 4. Connect the headset to the backpack {#deploy-headset-link}

1. Put on the headset and open XTac-UMI XR.
2. **Leave "USB Network" unticked** and "PC IP" empty (it connects to the backpack at `192.168.100.1` by default).
3. Tap "Connect".

The interface and connection states are in [Pico4 headset and trackers](../common/pico4.md#pico-toolkit-ui); detailed steps are in [Connecting the headset to the backpack](unbox-connect.md#pico-link).

### 5. Choose the capture mode {#deploy-mode}

The [capture mode](system.md#capture-mode) is a fixed property of a project. When you [create a project](monitor-record.md#project-task), choose one of these three modes to match what is connected:

- "Dual gripper"
- "Dual gripper + headset stereo"
- "Dual gripper + headset right eye"

!!! warning "The capture mode cannot be changed after the project is created"
    The System page only displays it. Whichever mode you choose, the headset and trackers must provide poses.

### 6. Upload configuration (optional) {#deploy-upload}

- **Where**: console → System → [Upload configuration](system.md#upload).
- **What to do**: create an upload backend and fill in its credentials (how to get them is in the same section).
- **Binding**: bind it when you create a project; that project's exports with "Upload to remote" then use it by default, with no credentials to enter in the export dialog.

## Daily collection cheat sheet {#daily}

Every working day, follow the [Quickstart](quickstart.md): wire and power up → tablet over USB to open the console → connect the headset → pick a project and task → check before recording → record with the buttons → export.

Do not restart XTac-UMI XR during collection: a restart resets the world origin, so the pose reference within one dataset stops being consistent; see [Startup and frame alignment](../common/pico4.md#pico-frame).

## After recording: replay, review and export {#after}

Once recording is done, you can replay, review, delete and export recordings from the console.

### 1. Replay and review {#after-review}

- **Hierarchy**: console → Projects, organised as project → task → recording.
- **Overview**: each recording shows its duration, frame count, data size and quality flags.
- **Streaming replay**: click "Replay" to [stream it in the browser](playback.md), with a draggable progress bar.
- **Clean-up**: delete a problem recording on the spot with ["Delete"](projects-export.md#delete).

!!! danger "Deletion cannot be undone"
    Deleting a recording also deletes its MCAP and H264 export files.

### 2. Export {#after-export}

Select the task to export and click "Export" to open the [export dialog](projects-export.md#export).

**Precheck**: data integrity is checked automatically first.

- **Failed**: the blocking items are listed one by one; delete or fix them as prompted, then run the precheck again.
- **Passed**: choose the "Export destination" and then the "Export format".

**Destination (choose one)**

- **Download to device**: the backpack packages the result, then a button lets you fetch the [archive](projects-export.md#download).
- **Upload to remote**: pick a pre-configured [upload backend](system.md#upload) from the drop-down: follow the project default, switch to another configuration for this export, or create one on the spot.

**Format (choose one)**

- **Equal formats**: [LeRobot dataset](projects-export.md#lerobot) and [MCAP](projects-export.md#mcap) have equal standing.
- **Export both**: one task can be exported in one format and later in the other; both outputs are kept.
- **Default and override**: a project can set a default format, which you can override for a single export.

### 3. Storage and clean-up {#after-storage}

After uploading, **local files are kept by default**. To free space:

- **Archive on upload**: tick "Archive automatically after upload" before uploading.
- **Archive any time**: [archive](projects-export.md#archive) manually later.

Archiving keeps only the record and clears the raw files; clean-up protects formats that have not been exported yet.

## Common questions {#faq}

- [Cannot reach the console](troubleshooting.md#connect): try the tablet over USB first; on the hotspot, confirm the device supports 5 GHz, that you are on this backpack's hotspot and that the address includes `http://`; power-cycle the backpack if it becomes unresponsive.
- [Tracker lost](troubleshooting.md#tracker): when tracking accuracy degrades or the headset disconnects, both XTac-UMI XR and the Live monitor page show an icon. Check whether the tracker's blue light is on and whether the [pairing](../common/pico4.md#pico-tracker-bind) is correct.
- [Recording refused](troubleshooting.md#record): once the recording disk reaches 80% used, starting a recording is refused with a message that the recording disk is N% used and has reached the 80% limit. Upload or download the data you have already collected, then [archive](projects-export.md#archive) to free space, or delete the entries you do not need.
- [Replay and live preview cannot run at the same time](playback.md): when replay is refused, close the live monitor open in another tab or on another device.
- While a recording is in progress, switching project / task, gripper calibration, firmware upgrades, system updates and similar operations are all refused; stop recording first. The capture mode is fixed with the project and can never be switched.
- Interface language: the console shows Chinese or English according to the browser language (any other language falls back to English). You can switch "Interface language" temporarily on the System page or in the mobile settings; reloading the page returns it to "Follow browser". The device's voice prompts follow the interface language, see [Voice prompts](gripper.md#voice-cues).

## Versions {#version}

This page is written against XTac-UMI Collector 0.4.3. Each component's [version baseline](versions.md#baseline) is whatever the console's System page shows, and upgrades are in [Upgrades and OTA](update.md); the serial numbers in the text are only examples.
