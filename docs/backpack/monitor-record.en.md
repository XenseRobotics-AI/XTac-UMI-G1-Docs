---
description: Before recording, confirm the views, poses, gripper opening and disk space in the console, pick a project and task, then record, stop and delete the previous take with the gripper buttons
---

# Live monitor and recording


This page covers the "Live monitor" page of the XTac-UMI Collector console (below, "the console"). Gripper button gestures, LED patterns and voice announcement wording are in [Gripper buttons and LEDs](gripper.md#buttons-leds); this page only links to them.

![The live monitor page](../assets/backpack/monitor-live.webp)

- **Top bar**: device status (bandwidth, CPU, memory, disk, cameras, live time, recording time, system).
- **Middle**: the side columns each hold one gripper's fisheye view plus its left-finger / right-finger visuotactile feeds; the centre column holds the headset's stereo pair, the "arms / head pose" 3D view and, below it, the left and right gripper opening-angle cards.
- **Bottom**: from the left, the "current task count" card, the project / task selectors with the record button, and the live-monitor connection card ("Stop streaming", "Refresh devices").

## Confirm in the console before recording {#checks}

Check each item before recording, and do not start if any is wrong:

| What to look at | What you want | When it is wrong |
|---|---|---|
| Every view | The top bar's "Cameras" count matches the capture mode (6 / 6 for "Dual gripper", 8 / 8 for "Dual gripper + headset stereo", 7 / 7 for "Dual gripper + headset right eye") and every tile has an image; fisheye views are sharp; the visuotactile feed is the geometrically rectified image with no difference overlay, and the contact area changes as you press | A blurred fisheye usually means the focus ring was knocked; turn it back to sharp before recording. If the count is wrong, check [System → Capture mode](system.md#capture-mode); only if one feed stays black for long, click "Refresh devices" |
| Headset pose and tracker state | Move a gripper and the headset and the 3D model follows; the indicator at the top right of the pose card is green | "Pose online" but the model does not move: the tracker app in the Pico usually never really started; hold the tracker's power button to reactivate it and restart the app on the Pico. Light turns yellow with a prompt: a tracker has left the headset's view (orientation only, no position); bring it back into view. Check left / right by serial number, odd left and even right, see [Pico4 tracker serial numbers](../common/pico4.md#pico-tracker-sn) |
| Both grippers' opening | The two cards below the pose view show radians, degrees and a normalised percentage: about 100% fully open, about 0% closed (about 0.02rad; a little more force reaches 0) | If fully open will not reach 100% or closing will not return to 0, recalibrate at [System → Gripper](system.md#gripper) |
| Free disk space | The top bar's "Disk" usage is below 80% (recording disk, measured on the device); hovering shows the mount point, used, total and available space | At 80% recording is refused; [export and archive](projects-export.md#archive) the data you have, or delete recordings you do not need |
| Recording state | The status line at the top right of the project / task card reads "Standby", followed by the capture-mode badge (for example "Dual gripper + headset stereo"); "Start recording" is clickable | When the badge says "Pico not ready" and the button is grey, the reason is below the status line: "Pico not ready" and "Tracker not ready" are separate and can appear together, each followed by the specific cause (for example disconnected or timed out, pose data missing or timed out, left-eye / right-eye video missing or timed out, clock synchronization missing or timed out, or the tracker out of view or stationary for over 5 seconds); a missing project / task is stated too. Deal with the reason first |

- The preview is encoded once by the backpack's hardware encoder and sent to every device with the console open; headset and visuotactile previews are half resolution, so looking coarser than the recording is normal. Recording bypasses the preview path: the MCAP holds the cameras' raw MJPEG frames at full resolution.
- On a weak tablet network, only the dropped feed shows "Network jitter, waiting to recover" and reconnects automatically; the others are unaffected and there is no need to refresh.

## Picking a project and task {#project-task}

Recordings sit under a "project → task" hierarchy. The two drop-downs at the bottom of the live monitor page pick the project and task; their last entries, "New project…" and "New task…", create one on the spot. You can also create them on the [Projects page](projects-export.md) and set a task as the current target there.

A new project fixes its **capture config** at creation. **Once created it is frozen**; for different settings, create a new project. The System page only displays it; what each item means is in [Current project capture config](system.md#capture-mode).

- **Capture mode**: one of "Dual gripper", "Dual gripper + headset stereo", "Dual gripper + headset right eye".
- **PICO resolution per eye**: 640 × 480 or 1024 × 768, only for modes that record headset video.
- **PICO image source**: fisheye or undistorted images.
- **Tactile rectified image export orientation**: 700 × 400 landscape by default, or a further 90° counterclockwise for 400 × 700.
- **Wrist fisheye**: whether to rectify its distortion on export.
- **Upload backend**: you can bind one configured at [System → Upload configuration](system.md#upload) as the project's default for uploads; without a binding you pick one at upload time.

![Creating a project](../assets/backpack/new-project.webp){ width="360" }

The fields for a new task:

| Field | What to enter |
|---|---|
| Task name | A short label using lowercase letters, digits and hyphens only, for example `pick-chips` |
| Task instruction / prompt (required) | The LeRobot language instruction, written as complete natural language, for example *open the lid of the container on the table, take out the chips, place them into the box, and close the lid* |
| Target count | How many takes this task should collect; may be left blank |
| Target duration (minutes) | How long this task should collect for; may be left blank |

![Creating a task](../assets/backpack/new-task-live.webp)

- With targets blank, only the count collected so far is shown, with no progress bar.
- **The target count is a hard gate**: once met, recording is refused, from both the console button and the gripper buttons.
- **Counted cumulatively**: "ready" and "uploaded" entries both count; archiving only deletes local files without changing the state, so **neither uploading nor archiving frees up room**, and progress never goes backwards. Deleted entries do not count; "Delete the previous take and re-record" leaves the net count unchanged.
- **To keep collecting once met**: raise the target count, or delete recordings that should not count.
- **The "current task count" card**: bottom left, showing the count, duration and progress against the target on the same basis; starting or stopping from the gripper buttons or another tablet updates it and the Projects page list immediately.

Camera parameters and rectification:

- **Wrist cameras and tactile sensors**: fixed at 640×480 @ 30fps and 640×480 @ 120fps respectively, not adjustable.
- **All rectification happens at export**: tactile is rectified geometrically in the chosen orientation; wrist fisheye rectification, if on, uses the calibration parameters frozen into the recording when it started.
- **LeRobot export**: fixed at 30fps.

## Recording {#record}

- **Gripper buttons (day to day)**: long-press the right gripper to start and the left to stop, handled by a state machine on the device with no browser needed; which gripper does what and the timings are fixed fleet-wide and cannot be changed on site. Gestures, LEDs and how to confirm a deletion are in [Gripper buttons and LEDs](gripper.md#buttons).
- **Console buttons**: "Start recording / Stop recording" do the same, for someone not holding a gripper; to bind browser shortcuts see System → [Capture settings › Recording shortcut](system.md#keybinding).

### On-site feedback: LEDs and voice {#feedback}

With both hands on the grippers and eyes on the scene, you rely on two complementary forms of feedback:

- **LEDs**: the gripper indicator distinguishes states by solid / breathing / blinking / pulsing / fast-blinking, and needs a glance up; meanings are in [LEDs](gripper.md#leds).
- **Voice announcements**: the sentences are in [Voice announcements](gripper.md#voice-cues).
    - Plays through the headset by default, falling back to the backpack's speaker when the headset is disconnected or unsupported; no tablet needed, independent of the browser.
    - Six prompts: recording starts, an episode finishes (prompting you to reset the scene and prepare the next one), a serious problem during recording, and a gripper / the headset / a tracker dropping out (three prompts, each needing a different check).
    - Plus a subtask marker tone.

- **Fixed and adjustable**: wording and timing are fixed and cannot be changed on site, keeping a batch of devices identical; you can adjust the switch, the volume (a 0–100 slider) and the audio language (Chinese / English), with a per-line preview next to the switch that shows where the sound played and why. See System → [Capture settings](system.md#voice).
- **Audio language**: follows the [interface language](index.md#faq) when the page loads or the interface language changes; a separately chosen one lasts until then.

### Recording gates {#record-gates}

Whether started from a gripper button or the console, the device checks these in order and stops at the first failure:

1. Disk usage below 80%;
2. A project and task are selected, and the task's cumulative count has not reached its target;
3. The gripper MCUs are online;
4. Pico ready: the headset is connected with pose and clock sync working; in modes that record headset video, the selected eye's video must be working too;
5. Tracker ready: the trackers are connected and "tracking normally within the field of view"; recording is refused if a tracker has been still for more than 5 seconds or has left the field of view (brief stillness mid-recording does not interrupt and is not counted against quality; the position stays accurate while still);
6. The headset's video parameters match the project: after you select a project or the headset reconnects, the device re-reads mono / stereo, resolution and image source automatically, then checks again just before recording. **If no confirmation arrives, the check times out, or the headset disconnected or its parameters changed meanwhile, recording is refused**, and the message says which;
7. The headset's video clock is sane: if one eye's video time runs more than 1 second ahead of the time it was received, you get "headset … eye video time sync abnormal" and recording is refused. The problem is the headset app's camera clock versus its sync clock, not the backpack.

- **When refused**: an "Unable to start recording" dialog states the reason (the same for a gripper-button start); away from the tablet, listen for the announcement and watch the LEDs.
- **Message when the target is met**: "Task '…' has reached its cumulative collection target (N/M); recording refused. To keep collecting, raise the task's target count or delete recordings that should not count towards the target."

### While recording {#record-live}

- **Status line**: changes to "Recording" with a running timer, and the capture-mode badge stays; the top bar's "recording time" runs in step.
- **Red counters**: the recording card accumulates "bad frames N" (delivered but incomplete), "dropouts N" (a device-level disconnection; frames never arrived) and "tracker out of view X s" (with ×N when more than once). With every camera green, out-of-view is the only clue; when you see it, consider stopping and re-recording.
- You cannot delete entries or change the task while recording; the capture mode can never be switched.

### Headset disconnects while recording {#pico-disconnect}

- **Trigger**: the cable in the PICO port is pulled or loose, the headset disconnects, or the pose or required headset video has not updated for about 3 seconds.
- **What the device does**: stops recording at once, finalises safely and marks it failed.
- **Console notice**: "Pico issue: recording interrupted", stating the kind of disconnect (for example "Pico disconnected", "Pico tracker disconnected", "Pico pose data has not updated for 3 seconds"). One incident shows it once, and refreshing or reopening the page does not repeat it; the mobile view shows the failure reason too.
- **Voice and LED**: "Pico connection failed." or "Tracker connection failed.", and the gripper LED turns yellow as for a failed recording.
- **The failed recording**: kept for diagnosis, not counted towards the cumulative count, and left out of normal export and upload.
- **No automatic resume after recovery**: when the data is back and finalising is done, the yellow LED clears with "Pico has recovered. You can start a new recording when the device is ready."; start a new recording yourself.

### After stopping {#record-stop}

Long-press the left gripper or click "Stop recording": the entry is saved into the current task, and the LED flashes white once and returns to standby. Numbering is in the [Projects page](projects-export.md#projects).

On stopping, an automatic quality check marks the entry "data suspect" if any of these hits (the gripper pulses yellow and the "Quality" column on the Projects page carries a mark; the entry is saved either way):

- The recording is shorter than 1s (almost always a misfire);
- Any camera channel recorded not one frame, or the whole take received no video frames at all;
- Tracking was lost for more than 20% of the take's duration (suspected to have left the field of view);
- The tactile rectification recipe is missing (this take's LeRobot export is certain to fail).

For a suspect entry, best [delete the previous take](#record-delete) on the spot and re-record.

### Entry states {#episode-state}

Projects page rows and mobile cards show four states:

| State | What it means | What you can still do |
|---|---|---|
| Ready | Just recorded; the raw file is on the device and has never been uploaded | Replay, export (either format), upload, archive, delete |
| Uploaded | Uploaded in at least one format, with the raw file still on the device | The same; plus exporting in the other format |
| Archived | Only the catalogue record is left; the raw file was cleared at archive time | Only the record and deletion; the replay entry point is greyed out and no format can be exported |
| Discarded | The recording failed part-way (for example a [headset disconnect](#pico-disconnect), a gripper dropout, or a power loss / system restart during recording); the entry row states the failure reason; the data size reflects the files actually left, kept for diagnosis | Delete |

- "Uploaded" says whether a remote copy exists and "archived" whether the local file is still there, in two separate columns.
- **Local files**: an upload **keeps them by default**; to delete, tick auto-archive before uploading, or [archive](projects-export.md#archive) by hand later.

### Deleting the previous take {#record-delete}

- **Buttons**: double-click the left gripper to enter delete confirmation (purple flashing, 5-second timeout), then double-click again to delete; gestures are in [Gripper buttons and LEDs](gripper.md#buttons).
- **Console**: "Delete previous and re-record" deletes the current task's most recent entry and immediately starts recording, with no second confirmation; unavailable while recording.
- **Earlier entries**: click "Delete" on its row in the [Projects page](projects-export.md). The confirmation lists the number, duration and size, and deletes its MCAP and H264 export files with it. This cannot be undone.

![Selecting an entry to delete on the Projects page](../assets/backpack/delete-select.webp)

![The delete confirmation](../assets/backpack/delete-confirm.webp)
