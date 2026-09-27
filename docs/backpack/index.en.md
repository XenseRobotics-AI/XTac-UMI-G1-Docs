# Backpack Kit: the XTac-UMI Backpack

This page is the Backpack Kit's entry point: work through the "First deployment checklist" the first time you get the equipment, and after that look only at the "Daily collection cheat sheet" each day. By the end you can carry out a complete collection run on your own, from powering up to exporting a dataset.

## What this kit is {#overview}

- The backpack is the host: the collection software, XTac-UMI Collector, runs on the backpack, and collection, replay and LeRobot export all happen in the backpack's own console. A tablet, phone or PC acts purely as a browser; no separate collection host is needed.
- In the box: one Pico4 Ultra Enterprise headset with controller, two XTac-UMI G1 grippers, two Type-C cables, one backpack, one 12 V 3 A 36 W adapter, and two power banks (Type-C output 5 V 3 A / 12 V 3 A). Check the contents against [Unboxing, cabling and power](unbox-connect.md#unbox).
- Output: one MCAP raw recording per take, capturing the left and right fisheye views, four visuotactile feeds, the headset and both trackers' 6-DoF poses and the gripper opening in sync. Export is done per task, with [`LeRobot dataset`](projects-export.md#lerobot) and [`mcap`](projects-export.md#mcap) as equal formats; you can download an archive or upload to an upload backend you configured beforehand.
- Operation: the gripper buttons start and stop recording, the LEDs report the state, and one person can carry out the whole run.
- Suits: high-volume collection operations and collection teams; the software is delivered closed-source with support for light customisation. For the other configuration — your own x86 workstation, running entirely on the LeRobot framework — see the [Developer Kit](../pc/index.md); the differences between the two are in [Product line and configuration comparison](../product/editions.md).

![Console monitor page: six cameras, both visuotactile sensors and headset pose on one screen](../assets/backpack/monitor-live.webp)

See it before you record: the console shows all six cameras, both visuotactile sensors and the headset pose on one screen, with the gripper opening normalised in real time; recording state, free disk space and tracker loss are all on the same screen, viewable from a tablet or a phone. What to check item by item before you start recording is in [Checks on the Live monitor page](monitor-record.md#checks).

The product positioning and an introduction to the console are in [The Backpack](../product/backpack.md); the [backpack's ports](unbox-connect.md#ports), the [adapter](unbox-connect.md#adapter) and [power-bank](unbox-connect.md#powerbank) wiring options, and the [body label](network.md#label) are each on their own page.

## First deployment checklist {#first-deploy}

Read [Safety and compliance](../product/safety.md) before you start. The detailed steps live on their own pages; this page only says what to do and where.

1. Headset setup: bring Pico OS to 5.15.5.U or above, then [enable developer mode and set the screen timeout and system sleep to "Never"](../common/pico4.md#pico-system); [pair both trackers to the headset](../common/pico4.md#pico-tracker-bind) following "odd is left, even is right" and switch them to standalone tracking mode; [install XTac-UMI XR](../common/pico4.md#pico-app).
2. Cabling and power: [the order is fixed](unbox-connect.md#order) — grippers → headset → power up the backpack, with the left and right grippers going to UMI-L / UMI-R. Pick one of the two power options: with [adapter power](unbox-connect.md#adapter), the headset connects to the backpack's PICO port with a Type-C cable; with [power-bank power](unbox-connect.md#powerbank), the headset takes the two-in-one Type-C cable first, its charging leg going to a power bank and its data leg to the backpack's PICO port, while the second power bank feeds the backpack. The grippers' connection and power requirements are in [Gripper buttons, LEDs and serial numbers](../common/gripper.md#power).
3. Connect to the backpack: join the [backpack hotspot](network.md#softap) `xense-<last 6 of the serial>` from a tablet or phone (for example `xense-e3d202`; the password is printed on the body label), and open `http://192.168.44.1` or the [device name](network.md#mdns) `http://xense-<last 6 of the serial>.local` in a browser to reach the console. On iOS you must type the full `http://` prefix; the hotspot is 5 GHz only, so the connecting device must support 5 GHz.
4. [Connect the headset to the backpack](unbox-connect.md#pico-link): put the headset on, open XTac-UMI XR, tick "USB network" and tap Connect. The backpack brings up the network on the USB link automatically (address `192.168.58.1`) with nothing to type. The interface and the connection states are in [Pico4 headset and tracker setup](../common/pico4.md#pico-toolkit-ui).
5. Pick the [capture mode](system.md#capture-mode): console → System → Capture settings, choosing dual gripper / dual gripper + headset / single gripper / single gripper + headset / headset only according to what is actually connected. For a single gripper the device works out the side from what is actually plugged in; it cannot be switched while recording.
6. Optional: console → System → [Upload configuration](system.md#upload), create an upload backend and fill in its credentials (how to obtain them is in the same section). You can bind it when you create a project, after which that project's "upload to remote" exports use it by default; the credentials are entered on this page once and never again in the export dialog.

## Daily collection cheat sheet {#daily}

1. Power up: [connect the grippers first, then power the backpack](unbox-connect.md#order); stand at the work position facing the working direction, and only then open XTac-UMI XR and connect — the [world-frame origin](../common/pico4.md#pico-frame) is set by where you are when XR first starts.
2. Open the console: join the [backpack hotspot](network.md#softap) and open `http://192.168.44.1` in a browser.
3. [Pick a project / task](monitor-record.md#project-task): the two drop-downs at the bottom of the Live monitor page, whose last entries "New project…" and "New task…" let you create one on the spot. A task's "task instruction / prompt" is required and should be a complete natural-language instruction (for example *open the lid of the container, take out the chips, place them into the box*); the target count and target duration may be left blank.
4. [Check on the Live monitor page](monitor-record.md#checks): all six camera feeds (left and right fisheye, two visuotactile feeds per gripper) and the headset's stereo pair have images, and the fisheye views are sharp — the focus ring is easy to knock out of place. The pose view follows your hand and the left and right trackers are not swapped. The gripper opening changes with your hand, reading about 0.02 rad closed, normalised to 0. When the record button is not ready it gives the reason (no project / task selected, Pico pose or clock not ready); the full set of [recording gates](monitor-record.md#record-gates) also covers disk usage and the task's target count.
5. [Record with the gripper buttons](monitor-record.md#record): long-press the right gripper to start (the LED turns to breathing green), long-press the left gripper to stop when the take is done (one white flash means it is saved), and double-click the left gripper to delete the previous take. The buttons are handled by a state machine on the backpack, so you can record with no browser online; the full gesture table is in [Buttons](../common/gripper.md#buttons) and the LED patterns are in [LEDs](../common/gripper.md#leds).

Never restart XTac-UMI XR during a collection run: restarting resets the world-frame origin, so poses within the same dataset no longer share a reference frame; see [Start-up and frame alignment](../common/pico4.md#pico-frame).

## After recording {#after}

- Replay and review: console → Projects, with the hierarchy project → task → recording, each entry showing duration, frame count, data size and quality annotations. Click "Replay" for [streamed replay](playback.md) in the browser, with a draggable progress bar; [delete](projects-export.md#delete) a bad entry on the spot, which also removes its MCAP and H264 transcode and cannot be undone.
- Export: select a task and click "Export" to open the [export dialog](projects-export.md#export). It first pre-checks data integrity — if that fails it lists each blocking item, and you re-run the pre-check after deleting or fixing them. Once it passes, pick the "export destination" first and then the "export format":
    - Destination, one of two: "Download to device" packs the data on the backpack first and then gives you a button to fetch the [archive](projects-export.md#export); "Upload to remote" takes an [upload backend](system.md#upload) you configured beforehand from a drop-down, following the project default, temporarily using another one, or creating one on the spot.
    - Format, one of two: [`LeRobot dataset`](projects-export.md#lerobot) and [`mcap`](projects-export.md#mcap) are equals — the same task can produce one now and the other later, and both outputs are kept. A project can have a default format, and a single export can override it.
    - After an upload completes the local files are **kept by default**; to free space, tick the clean-up before uploading, or [archive](projects-export.md#archive) at any point afterwards. Archiving keeps only the record and removes the raw files, and the clean-up protects any format that has not been used yet.

## Common questions {#faq}

- [Cannot reach the console](troubleshooting.md#connect): first confirm the tablet or phone supports 5 GHz, that you are on this backpack's hotspot (the last 6 characters match the body label), and that the address includes the `http://` prefix. Some Android devices cannot open `.local` names, so use `http://192.168.44.1` instead; power-cycle the backpack if it becomes unresponsive.
- [Tracker lost](troubleshooting.md#tracker): when tracking accuracy degrades or the headset disconnects, both XTac-UMI XR and the Live monitor page show an icon. Check whether the tracker's blue light is on and whether the [pairing](../common/pico4.md#pico-tracker-bind) is correct.
- [Recording refused](troubleshooting.md#record): once the recording disk reaches 80% used, starting a recording is refused with "Recording disk is N% used… recording refused". Upload or download the data you have already collected, then [archive](projects-export.md#archive) to free space, or delete the entries you do not need.
- [Replay and live preview cannot run at the same time](playback.md): when replay is refused, close the live monitor open in another tab or on another device.
- While a recording is in progress, switching the capture mode, gripper calibration, firmware upgrades, system updates and other [System settings](system.md) operations are all refused; stop recording first.

## Versions {#version}

This page is written against XTac-UMI Collector 0.3.16. Each component's [version baseline](versions.md#baseline) is whatever the console's System page shows, and upgrades are in [Upgrades and OTA](update.md); the serial numbers in the text are only examples.
