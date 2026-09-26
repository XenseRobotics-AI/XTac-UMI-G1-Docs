---
description: Before recording, confirm the views, poses, gripper opening and disk space in the console, pick a project and task, then record, stop and delete the previous take with the gripper buttons
---

# Live monitor and recording

This page covers the "Live monitor" page of the XTac-UMI Collector console (below, "the console"): what to confirm on that one screen before recording, how to pick a project and task, how recording starts and stops, and how to delete a bad take on the spot. The gripper button gestures, the LED patterns and the voice announcements are all documented in one place, [Gripper buttons and LEDs](../common/gripper.md#buttons-leds); this page only links to them.

![The live monitor page](../assets/backpack/monitor-live.webp)

The page has three layers from top to bottom. The top bar is device status (video bandwidth, cameras, monitoring time, recording time, CPU, memory, disk, system). The middle has a left and a right column, each holding one gripper's fisheye view plus its left-finger / right-finger visuotactile feeds, with a centre column holding the headset's stereo pair and the "arms / head pose" 3D view, and two cards below that view showing the left and right gripper opening angles. The bottom holds, from the left, the "current task count" card, the project / task selectors with the record button, and the live-monitor connection card ("Stop streaming", "Refresh devices").

## Confirm in the console before recording {#checks}

Run through these five items before every recording, and do not start if any of them is wrong:

| What to look at | What you want | When it is wrong |
|---|---|---|
| The six views | The top bar's "cameras" count matches the capture mode (6 / 6 for dual gripper, 8 / 8 with the headset) and every tile has an image. Both fisheye views are sharp, not blurred; the visuotactile feed is a difference rendering, so pressing shows the contact area as a coloured deformation field, and a faint texture at the edge of the finger pad is normal | A blurred fisheye usually means the focus ring was knocked and the focus has shifted — turn it back to sharp before recording. If the count is wrong, check it against [System → Capture mode](system.md#capture-mode); if one feed stays black, click "Refresh devices" |
| Headset pose and tracker state | Move a gripper and the headset and the 3D model follows; the indicator at the top right of the pose card is green | "Pose online" but the model does not move usually means the tracker app inside the Pico never really started — hold the tracker's power button to reactivate it and restart the app on the Pico. The light turning from green to yellow with a prompt means a tracker has left the headset's field of view (the device is reporting orientation only, with no position), so bring it back into view. Check the left and right trackers' assignment by serial number, odd left and even right, see [Pico4 tracker serial numbers](../common/pico4.md#pico-tracker-sn) |
| Both grippers' opening | The two cards below the pose view each show radians, degrees and a normalised percentage: about 100 % fully open, about 0 % closed (about 0.02 rad closed, and a little more force reaches 0) | If fully open will not reach 100 % or closing will not return to 0, recalibrate at [System → Gripper](system.md#gripper) |
| Free disk space | The top bar's "disk" usage is below 80 % | At 80 % recording is refused outright; first [export and archive](projects-export.md#archive) the data you have, or delete recordings you do not need |
| Recording state | The status line at the top right of the project / task card reads "Standby", followed by a badge showing the current capture mode (for example "dual gripper + headset"), and the "Start recording" button is clickable | When the badge says "Pico not ready" and the button is greyed out, the reason is written below the status line (no project / task selected, Pico pose / stereo / clock sync not ready, and so on) — deal with the reason first |

The headset and visuotactile previews are streamed at half resolution, so they look coarser than the recording; that is normal, and what goes into the MCAP is still full resolution. On a weak network on a tablet, a single feed dropping shows "Network jitter, waiting to recover" on that feed alone and reconnects automatically, leaving the others unaffected with no need to refresh the page; only click "Refresh devices" when one feed stays black for a long time.

## Picking a project and task {#project-task}

Recordings land under a two-level "project → task" hierarchy. The two drop-downs at the bottom of the live monitor page pick the project and the task, and their last entries, "New project…" and "New task…", let you create one on the spot; you can also create them on the [Projects page](projects-export.md) and set a task as the current target there. **The capture mode is a property of the project, frozen once the project is created**; it cannot be switched part-way, and the System page only displays it, see [Current project capture config](system.md#capture-mode).

Besides the name, a new project also fixes this project's **capture config** in one go: the capture mode (one of six), the PICO resolution (only for modes with the headset), the tactile export orientation, the PICO image source (raw fisheye or undistorted) and wrist fisheye rectification. **Once created they are frozen and cannot be changed** — to use a different set, create a new project; what each one means is in [Current project capture config](system.md#capture-mode). If you have already configured an upload backend at [System → Upload configuration](system.md#upload), you can also bind one to the project here and that project will use it by default when publishing; without a binding you pick one at publish time.

![Creating a project](../assets/backpack/new-project.webp)

The fields for a new task:

| Field | What to enter |
|---|---|
| Task name | A short label, for example "desk grasp – chips" |
| Task instruction / prompt (required) | The LeRobot language instruction, written as complete natural language, for example *open the lid of the container on the table, take out the chips, place them into the box, and close the lid* |
| Target count | How many takes this task should collect; may be left blank |
| Target duration (minutes) | How long this task should collect for; may be left blank |

![Creating a task](../assets/backpack/new-task-live.webp)

With the targets left blank the live monitor page shows only the count collected so far and draws no progress. Setting a target count makes it a hard gate: once it is met, recording is refused and both the console button and the gripper buttons are blocked.

That gate counts **cumulative collection** (since 0.3.14): both "ready" and "uploaded" entries count towards it, and archiving only deletes local files without changing the state, so **neither uploading nor archiving frees up room**. Once the target is met there are only two ways to keep collecting — raise the task's target count, or delete recordings that should not count towards it. "Delete the previous take and re-record" leaves the net count unchanged and is unaffected.

The "current task count" card at the bottom left shows the current task's count, duration and progress against the target, on the same basis as that gate. Deleted entries are not counted, and neither uploading nor archiving makes the progress go backwards; starting or stopping a recording with the gripper buttons or from another tablet updates this card and the Projects page list immediately.

The wrist cameras are fixed at 640×480 @ 30 fps and the tactile sensors at 640×480 @ 120 fps, neither adjustable; the LeRobot export is fixed at 30 fps and copies the collected resolution without scaling.

## Recording {#record}

Day to day the gripper buttons are the main control: long-press the right gripper to start and the left gripper to stop, handled by a state machine on the device with no browser needed. The gesture table, the LED table and how to confirm a deletion are in [Gripper buttons and LEDs](../common/gripper.md#buttons); which gripper does what and the timings are fixed fleet-wide and cannot be changed on site. The "Start recording / Stop recording" buttons at the bottom of the console do the same thing, for someone who is not holding a gripper; to bind a browser shortcut to those two buttons, go to [Settings › Capture settings › Recording shortcut](system.md#keybinding).

### On-site feedback: LEDs and voice {#feedback}

During collection both hands are on the grippers and your eyes are on the scene, so you may well not see the tablet. The device therefore gives two forms of feedback that work without looking at a screen, and they complement each other:

- **LEDs**: the indicator on the gripper, distinguishing states by solid / breathing / blinking / pulsing / fast-blinking — you have to glance up at the gripper. The meanings are in [LEDs](../common/gripper.md#leds).
- **Voice announcements**: the device speaker speaks out loud, with no tablet needed nearby and independent of the browser. Four moments: recording starts, an episode finishes (prompting you to reset the scene and prepare the next one), a serious problem occurs during recording, and a gripper or the headset drops out during recording. The sentences are in [Voice announcements](../common/gripper.md#voice-cues).

The wording and the timing of the announcements are fixed values that cannot be changed on site, which keeps a batch of devices behaving identically; only the switch and the volume (a 0–100 slider) are adjustable, with a per-line preview next to the switch for confirming the speaker works. The settings survive a reboot and live in [Settings › Capture settings](system.md#voice).

### Recording gates {#record-gates}

Whether you start from a button on the gripper or in the console, the device checks these in order and stops at the first failure:

1. Disk usage below 80 %;
2. A project and task are selected, and that task's cumulative count has not reached the target count;
3. The gripper MCUs are online;
4. In a mode with the headset: the Pico pose, the video and clock sync are ready;
5. The trackers are "tracking normally within the field of view": recording is refused if a tracker has been still for more than 5 seconds or has left the field of view (being briefly still mid-recording does not interrupt anything and is not counted against quality, since the position stays accurate while still);
6. The headset's video parameters match the project: after you select a project or the headset reconnects, the device re-reads the headset's mono / stereo setting, resolution and image source automatically, then checks them once more just before recording starts. **If no confirmation arrives, the check times out, or the headset disconnected or its parameters changed in the meantime, recording is refused** — the message says which of those it was.
7. The headset's video clock is sane: if one eye's video time runs more than 1 second ahead of the time it was received, you get "headset … eye video time sync abnormal" and recording is refused — that is the headset app's camera clock disagreeing with its sync clock, not a problem with the backpack.

When it is refused, the console opens a "Cannot start recording" dialog stating the reason, and a refusal from the gripper buttons opens the same dialog; if you are not near the tablet, listen for the announcement and look at the LEDs. When the target is met the exact wording is "Task '…' has reached its cumulative collection target (N/M); recording refused. To keep collecting, raise the task's target count or delete recordings that should not count towards the target."

### While recording {#record-live}

The status line changes to "Recording" with a running timer, and the capture-mode badge stays; the top bar's "recording time" runs in step. The recording card accumulates three figures live, in red: "bad frames N" (delivered but incomplete), "dropouts N" (a device-level disconnection, where the frames never arrived at all) and "tracker out of view X s" (with ×N when it happened more than once). When every camera is green, going out of view is the only clue there is, so when you see it you should consider stopping and re-recording. While recording you cannot delete entries or change the task; the capture mode belongs to the project and can never be switched.

### After stopping {#record-stop}

Long-press the left gripper or click "Stop recording", and the entry is saved into the current task; the LED flashes white once and returns to standby. How entries are numbered is in the [Projects page](projects-export.md#projects).

The moment you stop, the device runs a quality check, and any one of the following marks the entry "data suspect": the gripper pulses yellow and the "Quality" column of that row on the Projects page carries a mark. The entry is saved either way.

- The recording is shorter than 1 s (almost always a misfire);
- Any camera channel recorded not one frame, or the whole take received no video frames at all;
- Tracking was lost for more than 20 % of the take's duration (suspected to have left the field of view);
- The tactile rectification recipe is missing (this take's LeRobot export is certain to fail).

For an entry marked suspect, [deleting the previous take](#record-delete) on the spot and re-recording is easier than hunting for it on the Projects page afterwards.

### Entry states {#episode-state}

Once saved, an entry has one of four states, shown the same way on the Projects page rows and on the mobile cards:

| State | What it means | What you can still do |
|---|---|---|
| Ready | Just recorded; the raw file is on the device and has never been uploaded | Replay, export (either format), upload, archive, delete |
| Uploaded | Uploaded in at least one format, with the raw file still on the device | The same; plus exporting in the other format |
| Archived | Only the catalogue record is left; the raw file was cleared at archive time | Only the record and deletion; the replay entry point is greyed out and no format can be exported |
| Discarded | The recording failed part-way and produced no usable data | Delete |

"Uploaded" says whether a copy exists remotely and "archived" says whether the local file is still there; they are two separate things in two separate columns. After an upload completes the local file is **kept by default** (a behaviour change since 0.3.10); to delete it, tick auto-archive before uploading, and if you do not, you can [archive](projects-export.md#archive) by hand at any point afterwards. The cumulative collection count covers the "ready" and "uploaded" states, and archiving does not change the state so it still counts; only "discarded" and deleted entries do not.

### Deleting the previous take {#record-delete}

With the buttons: double-click the left gripper to enter delete confirmation (purple flashing, with a 5-second timeout), then double-click again in that state to delete; the gestures are in [Gripper buttons and LEDs](../common/gripper.md#buttons). In the console: click "Delete previous and re-record", which deletes the current task's most recent entry and immediately starts a new recording, with no second confirmation; it is unavailable while recording.

To delete an earlier entry, find its row on the [Projects page](projects-export.md) and click "Delete". The confirmation dialog states the entry's number, duration and size, and deletes its MCAP and H264 files along with it. This cannot be undone.

![Selecting an entry to delete on the Projects page](../assets/backpack/delete-select.webp)

![The delete confirmation](../assets/backpack/delete-confirm.webp)
