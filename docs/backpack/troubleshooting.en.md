# Troubleshooting

This page is organised by symptom, with a cause and a fix for each. The three most common on site are not being able to reach the XTac-UMI Collector console (below, "the console"), recording being refused, and the export pre-check failing. Before touching anything, listen for the device's voice announcement, look at the gripper LEDs and check the status dots on the live monitor page, then match the symptom. The full meaning of the LED patterns is in [Gripper buttons, LEDs and serial numbers](../common/gripper.md#buttons-leds).

!!! danger "Odour, smoke, obvious overheating, structural damage or damaged cable insulation"
    Cut the power and stop using the device immediately, note the serial number on the body and contact support.

## Connecting and reaching the console {#connect}

??? failure "Joined the backpack hotspot, but the console will not open"
    **Cause:** three common ones. You joined a different backpack (every hotspot on site starts with `xense-`); the address had no `http://`, and iOS / Safari hands a bare device name to a search engine, which looks like "it will not open" when in fact no request was made; or some Android models cannot resolve `.local` device names.

    **Fix:** check that the last 6 characters of the hotspot name match the last 6 of the serial on the body label, whose password is printed on it too. Type the address in full, `http://192.168.44.1` (the hotspot gateway is fixed and always works) or `http://xense-<last 6>.local`. If you are far from the backpack and the signal is weak, move closer; power-cycle the backpack if it becomes unresponsive. The ways in are listed in [Network and console access](network.md#softap).

??? failure "The tablet or phone cannot find the backpack hotspot"
    **Cause:** the hotspot is 5 GHz only, so a device that supports only 2.4 GHz cannot see it.

    **Fix:** use a tablet / phone / PC that supports 5 GHz WiFi, or put the backpack on the site network and reach it over the LAN, see [Joining site WiFi and wired](network.md#lan).

??? failure "A PC cannot open `xense-xxx.local` but a phone can"
    **Cause:** Windows has unreliable mDNS name resolution; this is a known environment difference.

    **Fix:** use `http://192.168.44.1` directly when joined to the backpack hotspot; on a LAN, find the IP with the [Windows device scanner](network.md#scanner) and use "Open in browser".

??? failure "The console drops mid-collection and the WiFi has hopped to another network"
    **Cause:** Windows and tablets switch automatically to a saved network with a "better signal".

    **Fix:** turn off "auto-connect" for the other saved networks, or forget them outright, and keep only the backpack hotspot.

??? failure "The backpack's network page cannot find the site WiFi"
    **Cause:** the backpack only joins 5 GHz WiFi and the scan list shows only 5 GHz networks; a 2.4 GHz-only router is neither visible nor connectable.

    **Fix:** use the wired connection instead, or stay on the backpack hotspot.

??? failure "After long use the WiFi drops outright and the body is hot"
    **Cause:** overheating.

    **Fix:** restarting the backpack recovers it; check whether the fan outlet is blocked and whether the fan is turning, and report it if it keeps happening.

## Power and connectors {#power}

??? failure "The headset loses power and shuts down part-way"
    **Cause:** the headset is underpowered, or the power bank shut down its original output port when a second device was plugged in.

    **Fix:** wire and choose the parts as described in [Power-bank power](unbox-connect.md#powerbank); do not add devices to the power bank part-way through a collection run.

??? failure "Poor contact in the DC, PICO or USB port"
    **Cause:** on individual units the board has shifted under load; this is a hardware fault.

    **Fix:** do not force or lever the connector; note the serial number on the body and contact support for repair.

??? failure "A gripper's LED is dark, or the system log repeatedly shows `mcu ... disconnected / reconnected`"
    **Cause:** poor contact in the gripper's cable, or it is not plugged into UMI-L / UMI-R. When one gripper drops out, the one still online goes solid red (a system problem).

    **Fix:** check that both ends of the Type-C cable are seated and the locking screws are tight; if it keeps disconnecting, note the SN and when it happened and report it to support. The LED patterns are in [LEDs](../common/gripper.md#buttons-leds).

## Headset and trackers {#tracker}

??? failure "The status dot on the live monitor's pose card is yellow, with \"tracker out of view\" or \"pose stale\" beside it"
    **Cause:** the headset is connected but the tracker pose is invalid: the tracker has left the headset's field of view, tracking has gone wrong, or the tracker is not powered on or not paired. "Pico offline" instead means the headset is not connected to the backpack. Poses recorded while tracking was lost cannot be trusted — do not use that stretch of data.

    **Fix:** bring the grippers back into the headset's field of view; confirm both trackers show a blue light, are [paired to the headset](../common/pico4.md#pico-tracker-bind) and are in standalone tracking mode. For "Pico offline", check whether XTac-UMI XR in the headset is connected, see [The app interface](../common/pico4.md#pico-toolkit-ui).

??? failure "It says the pose is online, but the 3D model does not move"
    **Cause:** the tracker app inside the headset never really started (first use of the day, the button on the tracker was not pressed), and the status badge can still show online.

    **Fix:** before collecting, move a gripper and the headset and confirm the 3D model on the live monitor page follows. If it does not, hold the tracker's power button to reactivate it and restart the app in the headset.

??? failure "The left and right gripper poses are swapped"
    **Cause:** the two trackers were fitted the wrong way round, or swapped during pairing. The tracker SN rule is odd on the left, even on the right.

    **Fix:** check them against [Tracker serial numbers](../common/pico4.md#pico-tracker-sn) and swap them back; before recording, move one gripper on its own on the live monitor page to confirm.

## Collection and recording {#record}

??? failure "The record button is greyed out, or the gripper button refuses to start (solid yellow LED)"
    **Cause:** a pre-recording gate did not pass, and the browser pops up the reason: no project / task selected; the Pico pose or clock is not ready; no gripper MCU online; the task has reached its cumulative collection target; the recording disk is 80 % used.

    **Fix:** deal with whichever one the dialog names: pick a [project and task](monitor-record.md#project-task) at the bottom of the live monitor page; wait for the headset to connect and the pose dot to turn green; a full disk is the next entry; a met target is the "cumulative collection target" entry below.

??? failure "Recording refused: \"Task '…' has reached its cumulative collection target (N/M)\""
    **Cause:** since 0.3.14 this gate counts **cumulative collection**: both "ready" and "uploaded" count towards it, and archiving only deletes local files without changing the state, so **neither uploading nor archiving frees up room any more**. It used to count only the ones not yet uploaded, so uploading a batch bought you a few more takes and it never matched the task's progress; that basis has been retired.

    **Fix:** raise that task's target count, or delete recordings on the Projects page that should not count towards it (misfired short takes, the ones already judged suspect); you can also create a new task and start counting again. Do not expect "upload a batch and keep recording" to work. The basis is in [Picking a project and task](monitor-record.md#project-task).

??? failure "Recording refused: \"Recording disk is N% used, at the 80% limit\""
    **Cause:** the capacity gate before recording refuses at 80 %, leaving 20 % for transcode intermediates and exports; better not to start this take than to record a truncated MCAP when the disk fills.

    **Fix:** export the data you have (download or upload) and then [archive](projects-export.md#archive) to free space, or delete recordings you do not need on the Projects page. Note that uploading by itself frees nothing — local files are kept by default after an upload, and you have to click "Archive" separately. Deleting removes the MCAP and the H264 with it and cannot be undone.

??? failure "The gripper LED turns solid yellow during recording"
    **Cause:** something fatal went wrong in this take (a camera or a required channel dropped, say) and the take is already spoiled; the LED stays yellow until this recording finishes.

    **Fix:** after stopping, look at that take's quality annotation on the Projects page, delete it and record again; check which feed dropped on the live monitor page and inspect that cable. The meanings are in [LEDs](../common/gripper.md#buttons-leds).

??? failure "The gripper LED is solid red"
    **Cause:** a system problem, lit by the backpack: a gripper dropped out, a camera dropped out, or a required channel is missing; it stays until the problem clears. Red only ever means a fault, not that recording is in progress.

    **Fix:** see which feed is offline on the live monitor page and re-seat that cable; check [Device info](system.md#device-info) for which camera is marked "(offline)" and whether both gripper MCUs are there; power-cycle the backpack if it does not recover.

??? failure "The gripper LED flashes red rapidly"
    **Cause:** a problem in the gripper itself, lit by its own MCU self-check (a sensor fault, say); while it lasts, the gripper ignores the backpack's LED commands.

    **Fix:** unplug and replug that gripper's Type-C cable, or power-cycle the backpack; if it keeps happening, note the gripper's SN and contact support.

??? failure "The buttons do nothing: a double-click is refused (fast yellow flash), a long press during recording has no effect"
    **Cause:** this is how the state machine is designed: during recording a double-click and a long press on the right gripper are silently ignored (to guard against a shaky hand); a double-click is refused when there is nothing to delete; and a double-click does nothing during the 3-second cooldown after a deletion.

    **Fix:** follow the gesture table in [Buttons](../common/gripper.md#buttons); the bindings currently in effect are shown at console → Settings → [Capture settings › Recording shortcut](system.md#keybinding).

??? failure "The device is silent — no voice announcement when recording starts or stops"
    **Cause:** two possibilities. When voice was first added in 0.3.12 there was a bug that sent the sound to HDMI instead of the onboard speaker, so the preview was silent too and nothing reported an error, which looked on site like a broken speaker — that was **fixed in 0.3.13**. If it is still silent after that, it is almost always the settings: voice is muted, or the volume is at 0.

    **Fix:** go to [Settings › Capture settings › Voice announcements](system.md#voice) and check whether the switch says "Muted" and whether the volume slider is at 0, then use "Preview" next to the switch to check each line. Go by the console version shown on System → Device info, and [upgrade](update.md) first if it is below 0.3.13. The wording and the timing of the announcements are fixed and cannot be changed on site; only the switch and the volume are adjustable.

??? failure "The fisheye view is blurred"
    **Cause:** the fisheye camera's focus ring is easy to knock out of place.

    **Fix:** check both fisheye views for sharpness before every collection run and turn the ring back if one is blurred; clean a dirty lens with a lint-free cloth, see [Maintenance](../common/maintenance.md).

??? failure "Switching the capture mode, gripper calibration, a firmware upgrade or a system update is refused with \"Recording in progress\""
    **Cause:** the device refuses all of these outright while a recording is in progress.

    **Fix:** stop the recording on the live monitor page first (or long-press the left gripper), then try again.

## Replay, export and data {#export}

??? failure "\"Replay\" is refused, saying the camera preview is holding it"
    **Cause:** replay and live preview share the backpack's hardware encoder and replay needs it exclusively, so it is refused while the live monitor is open in another tab or on another device. For up to 15 seconds after a camera disconnects it still counts as held. Opening the monitor page after replay has started is fine — the preview comes up and replay is not taken away.

    **Fix:** close the monitor page in other tabs and on other tablets / phones, wait a few seconds and click replay again. See [Replay](playback.md).

??? failure "The pre-check or export reports \"timestamps do not overlap\" or `timestamps are not monotonic`"
    **Cause:** the system clock jumped during recording (typically: the backpack sat unpowered for days, and on boot NTP moved the system time by hours in one step, so cameras that started before and after ended up on two timelines). Since 0.3.3 the time base is frozen during recording and the hardware has an RTC battery, so newly recorded data will not hit this.

    **Fix:** the affected historical data cannot be exported, which is expected — delete those episodes. If it recurs after upgrading, note the `episode_id` in the error and report it.

??? failure "The export reports \"the camera set does not match the first episode\""
    **Cause:** capture modes were mixed within one task (recorded at 6 feeds, then switched to 8 and carried on).

    **Fix:** keep one capture mode from start to finish within a task; for data that is already mixed, delete the entries whose channels differ from the first episode and export again, or split them into separate tasks.

??? failure "Data recorded in headset-only mode fails the pre-check with `capture_mode_unsupported`"
    **Cause:** the LeRobot export is organised around the bimanual layout (20-dimension state), and headset-only data cannot go into a bimanual dataset. This is expected, not corruption.

    **Fix:** for headset-only data, pick the `mcap` format in the [export dialog](projects-export.md#export) and download it to the device to keep; to get into a LeRobot dataset, record in a dual-gripper mode.

??? failure "After archiving, those recordings cannot be replayed or exported in the other format"
    **Cause:** expected behaviour, not a fault. Archiving deletes the local raw file and keeps only the catalogue record, and both replay and export need the raw file, so neither is possible; on the Projects page those entries' "Replay" buttons are greyed out and say "Archived, the local source has been deleted". If a take had been uploaded in only one format, the other format can never be exported after archiving — the archive confirmation lists those takes first.

    **Fix:** decide which formats you want before archiving and export them all; after that, the copy in the remote repository you uploaded to is the one that counts. A recording that was never uploaded can also be archived, but then the data has no copy at all, and the confirmation gives a more emphatic warning. The entry point and the criteria are in [Archive](projects-export.md#archive), and the state definitions are in [Entry states](monitor-record.md#episode-state).

??? failure "The upload finished but the recording disk has no more free space"
    **Cause:** expected behaviour (a change since 0.3.10). After a successful upload the local files are **no longer deleted automatically**; without ticking the box it only uploads and keeps every file. The old 0.3.5 default of clearing the disk on upload is out of date.

    **Fix:** to free space, tick "Archive automatically after uploading (delete the local source, keep only the metadata)" before uploading, or click "Archive" in the task's export dialog afterwards. The clean-up protects formats you have not used yet: it only clears takes where every format used has been uploaded, so a recording uploaded in just one format is kept, and the interface says how many were kept.

??? failure "An NFS / FTP upload fails, or \"Check read/write\" does not pass"
    **Cause:** usually the target does not meet the requirements — the target directory does not exist yet; the account or the device account lacks write, rename or delete permission; the NFS protocol version does not match the server; the FTPS server address does not match the certificate, or the private CA is missing or wrong; or the target path or port is wrong. Not every upload failure comes from these, and the hints shown by the check are what to go by.

    **Fix:** open that entry at console → System → [Upload configuration](system.md#upload) and work through the hints: whether the target directory (and the NFS target subdirectory) already exists, because the device will not create it for you; whether the NAS or the FTP / FTPS service allows that account to write, read back, rename and delete; for NFS, also the protocol version and UID / GID; for FTPS, also whether the server address matches the certificate and whether a private CA is needed. Save the changes and click "Check read/write" again. If it still fails, contact support with the exact text of the check's message, the device SN, the console version and that entry's backend kind.

??? failure "The LeRobot dataset is bigger than expected"
    **Cause:** several video feeds are recorded at once; 1.5 GB for a task of around 3 minutes is within the normal range, and the hardware encoder's capability means it will not be much smaller.

    **Fix:** budget transfer and storage at that scale.

## Upgrades {#update}

??? failure "The power went out mid-upgrade / the console will not connect after applying an update"
    **Cause:** the service restarts when an update is applied and the page waits at most 90 seconds; a new version has to pass its start-up self-check before it counts as committed, and one that does not come up falls back to the previous version automatically. There is a complete, runnable program on disk at every moment, so a power cut cannot brick it.

    **Fix:** refresh the page first; if it still will not connect, power-cycle the backpack, then open the System update page to see the current version and "Last operation / Last error". If it rolled back, import the bundle again, see [A/B slots and rollback](update.md#rollback).

??? failure "The upgrade bundle fails verification on upload"
    **Cause:** the bundle is corrupt or the transfer was incomplete (`sha256` mismatch), it is not a bundle for this device's architecture (the backpack is `aarch64`), or the current version is below the minimum starting version the bundle requires.

    **Fix:** read the line in "Last error"; download the bundle again and re-upload, and for an upgrade that skips versions, ask technical support for the intermediate bundles. A refusal does not affect the version currently running.

??? failure "The card at the bottom right says \"Update preparation failed\""
    **Cause:** the bundle pushed from the remote end failed to download or verify.

    **Fix:** there is no need to retry by hand — the device re-attempts on its next round. If it keeps failing, first confirm the backpack can reach the internet (by cable or site WiFi). See [Remote forced updates](update.md#remote).

??? failure "After flashing the gripper firmware the gripper works intermittently and frames go missing quietly"
    **Cause:** the restart after flashing is a soft reset, so the gripper's USB-to-serial chip never lost power and sits in a degraded state.

    **Fix:** power the backpack off and on again (or unplug and replug that gripper's Type-C cable), then check the firmware version on Device info, see [Gripper firmware](update.md#gripper-firmware).

---

Still stuck? First get the error out of the console: the block of readings at the top right of the top bar opens the "system log", and it carries a red badge with the error count when there are errors. That panel can only be viewed — it does not export a log file — so **a screenshot is enough and there is no log file to look for on the device**.

Report it through the channels in [Support and feedback](../common/reference.md#support), with:

- A screenshot of the system-log panel, and roughly when the error appeared;
- The complete error text as shown on screen;
- The device SN and the console version, both on the System → [Device info](system.md#device-info) page;
- What you were doing when it happened;
- The project / task / episode number, if a recording was involved;
- The gripper LED state and a screenshot of the live monitor page, if it involves a gripper or the views.
