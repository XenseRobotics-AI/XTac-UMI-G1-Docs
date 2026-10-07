# Backpack Kit: the XTac-UMI Backpack

This page is the Backpack Kit's entry point: work through the "First deployment checklist" the first time you get the equipment, and after that look only at the "Daily collection cheat sheet" each day. By the end you can carry out a complete collection run on your own, from powering up to exporting a dataset.

## What this kit is {#overview}

- The backpack is the host: the collection software, XTac-UMI Collector, runs on the backpack, and collection, replay and LeRobot export all happen in the backpack's own console. A tablet, phone or PC acts purely as a browser; no separate collection host is needed.
- In the box: one Pico4 Ultra Enterprise headset (with controller and trackers), two XTac-UMI G1 grippers, two gripper cables, one headset cable (Pico → Pack), one backpack, one 12 V 3 A adapter, one power bank with a 0.3 m 12 V PD power cable, and one tablet. The full list is in [Box contents and wiring](../product/editions.md#kit); check the contents against [Unboxing, cabling and power](unbox-connect.md#unbox).
- Output: one MCAP raw recording per take, capturing the left and right fisheye views, four visuotactile feeds, the headset and both trackers' 6-DoF poses and the gripper opening in sync. Export is done per task, with [`LeRobot dataset`](projects-export.md#lerobot) and [`mcap`](projects-export.md#mcap) as equal formats; you can download an archive or upload to an upload backend you configured beforehand.
- Operation: the gripper buttons start and stop recording, the LEDs report the state, and one person can carry out the whole run.
- Suits: high-volume collection operations and collection teams; the software is delivered closed-source with support for light customisation. For the other configuration — your own x86 workstation, running entirely on the LeRobot framework — see the [Developer Kit](../pc/index.md); the differences between the two are in [Product line and configuration comparison](../product/editions.md).

![Console monitor page: six cameras, both visuotactile sensors and headset pose on one screen](../assets/backpack/monitor-live.webp)

See it before you record: the console shows all six cameras, both visuotactile sensors and the headset pose on one screen, with the gripper opening normalised in real time; recording state, free disk space and tracker loss are all on the same screen, viewable from a tablet or a phone. What to check item by item before you start recording is in [Checks on the Live monitor page](monitor-record.md#checks).

The product positioning and an introduction to the console are in [The Backpack](../product/backpack.md); the [backpack's ports](unbox-connect.md#ports), the [adapter](unbox-connect.md#adapter) and [power-bank](unbox-connect.md#powerbank) wiring options, and the [body label](network.md#label) are each on their own page.

## First deployment checklist {#first-deploy}

Read [Safety and compliance](../product/safety.md) before you start. The detailed steps live on their own pages; this page only says what to do and where.

1. Headset setup: bring Pico OS to 5.15.5.U or above, then [enable developer mode and set the screen timeout and system sleep to "Never"](../common/pico4.md#pico-system); [pair both trackers to the headset](../common/pico4.md#pico-tracker-bind) following "odd is left, even is right" and switch them to standalone tracking mode; [install XTac-UMI XR](../common/pico4.md#pico-app).
2. Cabling and power: [the order is fixed](unbox-connect.md#order) — grippers → headset → power up the backpack, with the left and right grippers going to UMI-L / UMI-R and the headset going to the backpack's PICO port over the headset cable (Pico → Pack). Pick one of the two power options: with [adapter power](unbox-connect.md#adapter), the adapter goes to the backpack's DC port; with [power-bank power](unbox-connect.md#powerbank), the power bank feeds the backpack's DC port over the 0.3 m 12 V PD power cable. The grippers' connection and power requirements are in [Gripper connection and serial numbers](../common/gripper.md#power).
3. Connect to the backpack: cable the tablet to the backpack's `HOST1` or `HOST2` port and the backpack opens the console on it, see [The tablet over USB](network.md#tablet). Without a tablet, use the [backpack hotspot](network.md#softap).
4. [Connect the headset to the backpack](unbox-connect.md#pico-link): put the headset on, open XTac-UMI XR, tick "USB Network" and tap Connect. The backpack brings up the network on the USB link automatically (address `192.168.58.1`) with nothing to type. The interface and the connection states are in [Pico4 headset and tracker setup](../common/pico4.md#pico-toolkit-ui).
5. Set the [capture mode](system.md#capture-mode): the capture mode belongs to the project. When you [create a project](monitor-record.md#project-task), pick "Dual gripper", "Dual gripper + headset stereo" or "Dual gripper + headset right eye" according to what is actually connected; it cannot be changed afterwards, and the System page only displays it. Every mode needs the headset and trackers for pose.
6. Optional: console → System → [Upload configuration](system.md#upload), create an upload backend and fill in its credentials (how to obtain them is in the same section). You can bind it when you create a project, after which that project's "upload to remote" exports use it by default; the credentials are entered on this page once and never again in the export dialog.

## Daily collection cheat sheet {#daily}

Every working day, follow the [Quickstart](quickstart.md): wire and power up → tablet over USB to open the console → connect the headset → pick a project and task → check before recording → record with the buttons → export.

Do not restart XTac-UMI XR during collection: a restart resets the world origin, so the pose reference within one dataset stops being consistent; see [Startup and frame alignment](../common/pico4.md#pico-frame).

## After recording {#after}

- Replay and review: console → Projects, with the hierarchy project → task → recording, each entry showing duration, frame count, data size and quality annotations. Click "Replay" for [streamed replay](playback.md) in the browser, with a draggable progress bar; [delete](projects-export.md#delete) a bad entry on the spot, which also removes its MCAP and H264 export files and cannot be undone.
- Export: select a task and click "Export" to open the [export dialog](projects-export.md#export). It first pre-checks data integrity — if that fails it lists each blocking item, and you re-run the pre-check after deleting or fixing them. Once it passes, pick the "export destination" first and then the "export format":
    - Destination, one of two: "Download to device" packs the data on the backpack first and then gives you a button to fetch the [archive](projects-export.md#export); "Upload to remote" takes an [upload backend](system.md#upload) you configured beforehand from a drop-down, following the project default, temporarily using another one, or creating one on the spot.
    - Format, one of two: [`LeRobot dataset`](projects-export.md#lerobot) and [`mcap`](projects-export.md#mcap) are equals — the same task can produce one now and the other later, and both outputs are kept. A project can have a default format, and a single export can override it.
    - After an upload completes the local files are **kept by default**; to free space, tick the clean-up before uploading, or [archive](projects-export.md#archive) at any point afterwards. Archiving keeps only the record and removes the raw files, and the clean-up protects any format that has not been used yet.

## Common questions {#faq}

- [Cannot reach the console](troubleshooting.md#connect): try the tablet over USB first; on the hotspot, confirm the device supports 5 GHz, that you are on this backpack's hotspot and that the address includes `http://`; power-cycle the backpack if it becomes unresponsive.
- [Tracker lost](troubleshooting.md#tracker): when tracking accuracy degrades or the headset disconnects, both XTac-UMI XR and the Live monitor page show an icon. Check whether the tracker's blue light is on and whether the [pairing](../common/pico4.md#pico-tracker-bind) is correct.
- [Recording refused](troubleshooting.md#record): once the recording disk reaches 80% used, starting a recording is refused with a message that the recording disk is N% used and has reached the 80% limit. Upload or download the data you have already collected, then [archive](projects-export.md#archive) to free space, or delete the entries you do not need.
- [Replay and live preview cannot run at the same time](playback.md): when replay is refused, close the live monitor open in another tab or on another device.
- While a recording is in progress, switching project / task, gripper calibration, firmware upgrades, system updates and similar operations are all refused; stop recording first. The capture mode is fixed with the project and can never be switched.
- Interface language: the console shows Chinese or English according to the browser language (any other language falls back to English). You can switch "Interface language" temporarily on the System page or in the mobile settings; reloading the page returns it to "Follow browser". The device's voice prompts follow the interface language, see [Voice prompts](gripper.md#voice-cues).

## Versions {#version}

This page is written against XTac-UMI Collector 0.4.3. Each component's [version baseline](versions.md#baseline) is whatever the console's System page shows, and upgrades are in [Upgrades and OTA](update.md); the serial numbers in the text are only examples.
