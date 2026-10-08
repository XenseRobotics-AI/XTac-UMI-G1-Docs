# Troubleshooting

This page gives a cause and fix per symptom. The most common are not reaching the XTac-UMI Collector console (below, "the console"), recording being refused, and the export pre-check failing. First listen for the voice announcement, look at the gripper LEDs and the live monitor's status dots; LED meanings are in [Gripper buttons, LEDs and voice](gripper.md#buttons-leds).

!!! danger "Odour, smoke, obvious overheating, structural damage or damaged cable insulation"
    Cut the power and stop using the device immediately, note the serial number on the body and contact support.

## Power and connectors {#power}

??? failure "The headset loses power and shuts down part-way"
    **Cause:** the headset is underpowered, or the power bank cut its original port when a second device was plugged in.

    **Fix:** choose parts and wire as in [Power-bank power](unbox-connect.md#powerbank); do not add devices to the power bank mid-collection.

??? failure "Poor contact in the DC, PICO or USB port"
    **Cause:** the board has shifted under load (a hardware fault).

    **Fix:** do not force the connector; note the serial number on the body and contact support for repair.

??? failure "A gripper's LED is dark, or the system log repeatedly shows `mcu ... disconnected / reconnected`"
    **Cause:** poor contact in the gripper cable, or not plugged into UMI-L / UMI-R; when one gripper drops out, the other goes solid red (a system problem).

    **Fix:** seat both ends of the Type-C cable and tighten the locking screws; if it keeps disconnecting, report the SN and times to support. The LED patterns are in [LEDs](gripper.md#buttons-leds).

## Headset and trackers {#tracker}

??? failure "The status dot on the live monitor's pose card is yellow, with “tracker out of view” or “pose stale” beside it"
    **Cause:**

    - **Yellow dot**: headset connected, tracker pose invalid (out of view, tracking fault, or not powered on / not paired); poses recorded while tracking was lost cannot be trusted, so do not use them.
    - **"Pico offline"**: the headset is not connected to the backpack.

    **Fix:**

    - Bring the grippers back into the headset's view.
    - Confirm both trackers show blue, are [paired to the headset](../common/pico4.md#pico-tracker-bind) and in standalone tracking mode.
    - For "Pico offline", check that XTac-UMI XR is connected, see [The app interface](../common/pico4.md#pico-toolkit-ui).

??? failure "It says the pose is online, but the 3D model does not move"
    **Cause:** the tracker app in the headset never really started (first use of the day, tracker button not pressed); the badge can still show online.

    **Fix:** before collecting, move a gripper and the headset and check the 3D model follows; if not, hold the tracker's power button to reactivate it and restart the app in the headset.

??? failure "The left and right gripper poses are swapped"
    **Cause:** the trackers were fitted or paired the wrong way round. The SN rule is odd left, even right.

    **Fix:** check against [Tracker serial numbers](../common/pico4.md#pico-tracker-sn) and swap back; before recording, move one gripper alone to confirm.

## Connecting and reaching the console {#connect}

<span id="tablet-adb"></span>

??? failure "The tablet does not open the console when plugged into the backpack"
    **Cause**: the tablet was factory reset, USB debugging was turned off, or debugging authorisations were revoked (the bundled tablet is authorised before shipping).

    **Fix**: check the cable is in `HOST1` / `HOST2` and the tablet is unlocked; if it still fails, turn USB debugging back on and trust the backpack (the bundled REDMI Pad 2 SE shown here):

    === "1. Developer mode"

        Settings → My device, tap "OS version" about 7 times until it says developer mode is on.

        ![Tap OS version](../assets/backpack/tablet-adb-1-os-version.webp)

    === "2. Developer options"

        Settings → Additional settings → Developer options.

        ![Developer options under Additional settings](../assets/backpack/tablet-adb-2-developer-entry.webp)

    === "3. USB debugging"

        In the Debugging group, turn on "USB debugging" and confirm.

        ![Turn on USB debugging](../assets/backpack/tablet-adb-3-usb-debugging.webp)

    === "4. Trust the backpack"

        Plug into the backpack; when asked "Allow USB debugging?", tick "Always allow from this computer" and tap Allow.

    After authorisation the backpack turns off the tablet's debugging-authorisation timeout, so later plug-ins open the console with no confirmation.



??? failure "Joined the backpack hotspot, but the console will not open"
    **Cause:**

    - **Wrong backpack**: every hotspot starts with `xense-`.
    - **No `http://`**: iOS / Safari treats the device name as a search term, so it looks like "it will not open" but no request was made.
    - **`.local` not resolved**: some Android models cannot.

    **Fix:**

    - Check the hotspot name matches the WiFi line on the body label (the password is there too).
    - Type in full `http://192.168.44.1` (the hotspot gateway is fixed), or the `http://xense-xxxxxx.local` on the label's last line.
    - With a weak signal, move closer; power-cycle the backpack if it is occasionally unresponsive.
    - Ways in: [Network and console access](network.md#softap).

??? failure "The tablet or phone cannot find the backpack hotspot"
    **Cause:** the hotspot is 5 GHz only; 2.4 GHz-only devices cannot see it.

    **Fix:** use a 5 GHz-capable device, or put the backpack on the site network and reach it over the LAN, see [Joining site WiFi and wired](network.md#lan).

??? failure "A PC cannot open `xense-xxxxxx.local` but a phone can"
    **Cause:** Windows mDNS resolution is unreliable.

    **Fix:** use the IP, shown in the top-bar [network dropdown](network.md#status) (reachable with the tablet over USB); on the hotspot use `http://192.168.44.1`.

??? failure "The console drops mid-collection and the WiFi has hopped to another network"
    **Cause:** Windows and tablets switch automatically to a saved network with a "better signal".

    **Fix:** turn off "auto-connect" for, or forget, other saved networks; keep only the backpack hotspot.

??? failure "The backpack's network page cannot find the site WiFi"
    **Cause:** the backpack only joins and lists 5 GHz WiFi; a 2.4 GHz-only router is invisible.

    **Fix:** use wired, or the backpack hotspot.

??? failure "After long use the WiFi drops outright and the body is hot"
    **Cause:** overheating.

    **Fix:** restart the backpack; check the fan outlet is clear and the fan turns; report it if it recurs.

## Collection and recording {#record}

??? failure "The record button is greyed out, or the gripper button refuses to start (solid yellow LED)"
    **Cause:** a recording gate did not pass, and a dialog names which (order in [Recording gates](monitor-record.md#record-gates)):

    - no project / task selected;
    - "Pico not ready" or "Tracker not ready" with the specific reason (such as a connection timeout, missing pose or video from one eye, missing clock sync, a headset configuration change awaiting confirmation, or a Tracker out of view or still for more than 5 seconds without active tracking);
    - no gripper MCU online;
    - the task has reached its cumulative collection target;
    - the recording disk is 80 % used.

    **Fix:**

    - **No project / task**: pick a [project and task](monitor-record.md#project-task) at the bottom of the live monitor page.
    - **"Pico not ready"**: wait for the headset to connect and the pose dot to turn green.
    - **"Tracker not ready"**: bring the grippers back into the headset's view and move them a little.
    - **Target met / full disk**: see the next two entries.

??? failure "Recording refused: “Task '…' has reached its cumulative collection target (N/M)”"
    **Cause:** it counts **cumulatively**: "ready" and "uploaded" both count; archiving only deletes local files without changing the state, so **neither uploading nor archiving frees up room**.

    **Fix:**

    - raise that task's target count;
    - or delete those that should not count on the Projects page (misfired short takes, ones judged suspect);
    - or create a new task to count from zero.

    The basis is in [Picking a project and task](monitor-record.md#project-task).

??? failure "Recording refused: “Recording disk is N% used, at the 80% limit”"
    **Cause:** recording is refused at 80 %, leaving 20 % for transcode intermediates and exports and avoiding a truncated MCAP on a full disk.

    **Fix:**

    - **Archive**: export the data (download or upload), then [archive](projects-export.md#archive).
    - **Delete**: delete unneeded entries on the Projects page, with their MCAP and H264; this cannot be undone.
    - **Uploading frees nothing**: local files are kept by default; click "Archive" as well.

??? failure "The gripper LED turns solid yellow during recording"
    **Cause:** something fatal happened in this take (for example a camera or required channel dropped), so it is spoiled; the LED stays yellow until it finishes.

    **Fix:** after stopping, delete and re-record (the Projects page carries a quality annotation); check the cable of the feed that dropped on the live monitor page. The meanings are in [LEDs](gripper.md#buttons-leds).

??? failure "The headset disconnected during recording, and the take was interrupted and marked failed"
    **Cause:**

    - **Trigger**: the headset's USB link drops, its connection breaks, or its pose / images stop updating for about 3 seconds.
    - **What the device does**: marks the take failed and stops at once, announces "Pico connection failed" ("Tracker connection failed" for a Tracker) and shows "Pico issue: recording interrupted" (once per incident); the data is kept for diagnosis, not counted, and left out of normal export and upload.

    **Fix:**

    - Check the cable from the headset to the backpack's `PICO` port, the headset battery, and that XTac-UMI XR is running; for a Tracker dropout, check the Tracker.
    - It **does not resume automatically**; start a new recording once ready, see [Headset disconnects while recording](monitor-record.md#pico-disconnect).

??? failure "A recording shows as failed, with power loss or a system restart as the reason"
    **Cause:** the backpack lost power, or the system or capture service restarted, mid-recording, so the take was not finalised; after power returns the reason distinguishes power loss / system restart from a capture-service restart, and the data size reflects the files actually left.

    **Fix:** the file may be incomplete; confirm, delete and re-record; if power losses recur, check the power supply and cabling, see [Power and ports](#power).

??? failure "The gripper LED is solid red"
    **Cause:** the backpack reports a system problem (gripper or camera dropped out, or a required channel missing) until it clears. Red only means a fault, never recording.

    **Fix:**

    - Re-seat the cable of the feed offline on the live monitor page.
    - Check [Device info](system.md#device-info) for which camera is marked "(offline)" and whether both gripper MCUs are there.
    - Power-cycle the backpack if it does not recover.

??? failure "The gripper LED flashes red rapidly"
    **Cause:** the gripper's MCU self-check reports its own fault (for example a sensor); meanwhile it ignores the backpack's LED commands.

    **Fix:** replug that gripper's Type-C cable or power-cycle the backpack; if it recurs, note the gripper's SN and contact support.

??? failure "The buttons do nothing: a double-click is refused (fast yellow flash), a long press during recording has no effect"
    **Cause:** state machine design:

    - during recording a double-click and a long press on the right gripper are silently ignored (to guard against a shaky hand);
    - a double-click is refused when there is nothing to delete;
    - a double-click does nothing during the 3-second cooldown after a deletion.

    **Fix:** follow the gesture table in [Buttons](gripper.md#buttons); current bindings are at System → [Capture settings](system.md#capture-settings).

??? failure "The device is silent — no voice announcement when recording starts or stops"
    **Cause:** sound comes from the headset by default and from the backpack's onboard speaker only when the headset is unavailable; silent in both almost always means muted or volume at 0.

    **Fix:**

    - At System → [Capture settings › Voice announcements](system.md#voice), check whether the switch says "Muted" and the volume is 0.
    - Use "Preview" next to each line; it says where the sound came out and why.
    - With English selected and the headset app lacking English assets, that line plays through the onboard speaker.
    - Wording and timing are fixed; only the switch, volume and announcement language are adjustable.

??? failure "The fisheye view is blurred"
    **Cause:** the focus ring is easily knocked.

    **Fix:** check both fisheye views before collecting and turn the ring back if blurred; clean a dirty lens with a lint-free cloth, see [Maintenance](../common/maintenance.md).

??? failure "Switching project, gripper calibration, a firmware upgrade or a system update is refused with “Recording in progress”"
    **Cause:** all of these are refused outright while recording.

    **Fix:** stop recording first (live monitor page button or long-press the left gripper), then retry.

## Replay, export and data {#export}

??? failure "“Replay” is refused, saying the camera preview is holding it"
    **Cause:**

    - Replay needs the backpack's hardware encoder (shared with live preview) exclusively, so it is refused while the live monitor is open in another tab or device; a camera still counts as holding it for up to 15 seconds after disconnecting.
    - The reverse is fine: opening the monitor page after replay starts brings the preview up without taking replay away.

    **Fix:** close the monitor page in other tabs and devices, wait a few seconds and click replay again. See [Replay](playback.md).

??? failure "After archiving, those recordings cannot be replayed or exported in the other format"
    **Cause:** expected behaviour.

    - Archiving deletes the raw file that replay and export both read, keeping only the catalogue record; on the Projects page those entries' "Replay" is greyed out with "Archived, the local source has been deleted".
    - Uploaded in only one format: the other can never be exported; the archive confirmation lists those first.

    **Fix:**

    - Export every format you want before archiving; the remote repository copy is the one that counts.
    - A never-uploaded recording can be archived too, but the data then has no copy; the confirmation warns prominently.
    - Entry point and criteria: [Archive](projects-export.md#archive), and the state definitions are in [Entry states](monitor-record.md#episode-state).

??? failure "The upload finished but the recording disk has no more free space"
    **Cause:** expected behaviour; uploads **keep local files by default**.

    **Fix:**

    - **To free space**: tick "Archive automatically after uploading (delete the local source, keep only the metadata)" before uploading, or click "Archive" in the task's export dialog afterwards.
    - **What gets archived**: every recording uploaded in any format; if only one format was uploaded and you want both, export or upload the other first.

??? failure "An NFS / FTP upload fails, or “Check read/write” does not pass"
    **Cause:** usually the target fails one of the requirements below, or the path / port is wrong; go by the check's hints.

    **Fix:** open that entry at console → System → [Upload configuration](system.md#upload) and follow the hints:

    - **Target directory**: must already exist (likewise the NFS target subdirectory); the device will not create it.
    - **Permissions**: the NAS or FTP / FTPS service must let that account write, read back, rename and delete.
    - **NFS**: protocol version and UID / GID.
    - **FTPS**: whether the server address matches the certificate and whether a private CA is needed.
    - Save and click "Check read/write" again; if it still fails, contact support with the check's exact message, device SN, console version and backend kind.

??? failure "The LeRobot dataset is bigger than expected"
    **Cause:** several video feeds are recorded at once; 1.5 GB for a task of around 3 minutes is normal, and the hardware encoder limits how small it gets.

    **Fix:** budget transfer and storage at that scale.

## Upgrades {#update}

??? failure "The power went out mid-upgrade / the console will not connect after applying an update"
    **Cause:** the collection software restarts when an update is applied, and the page waits at most 90 seconds; the previous version is kept, so a failed start or power loss falls back to it automatically and cannot brick the device.

    **Fix:**

    1. Refresh the page.
    2. If it still will not connect, power-cycle the backpack.
    3. Open the System update page to see the current version and "Last operation / Last error"; if it rolled back, import the bundle again, see [Rollback](update.md#rollback).

??? failure "The upgrade bundle fails verification on upload"
    **Cause:** the file is corrupt or did not finish uploading, or its version jumps too far or is older than the current one.

    **Fix:** read "Last error"; download and re-upload, and for a version-skipping upgrade ask technical support for intermediate bundles. A refusal does not affect the version currently running.

??? failure "After flashing the gripper firmware the gripper works intermittently and frames go missing quietly"
    **Cause:** flashing ends in only a soft reset, so the gripper's USB-to-serial chip never lost power and sits in a degraded state.

    **Fix:** power-cycle the backpack (or replug that gripper's Type-C cable), then check the firmware version on Device info, see [Gripper firmware](update.md#gripper-firmware).

---

Still stuck? The block of readings at the top right of the top bar opens the "system log" (with a red badge and error count when there are errors). The panel exports no file, so **a screenshot is enough; there is no log file to look for on the device**.

Report it through the channels in [Support and feedback](../common/reference.md#support), with:

- A system-log screenshot and when the error appeared;
- The complete error text;
- The device SN and console version (System → [Device info](system.md#device-info));
- What you were doing when it happened;
- The project / task / episode number, if a recording was involved;
- The gripper LED state and a live monitor screenshot, if a gripper or the views are involved.
