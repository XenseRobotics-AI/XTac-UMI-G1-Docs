---
description: Replay a single recording in the console: views, poses and gripper opening play back in sync, with quality marks, per-take statistics and the MCAP channel list
---

# Replay

You do not have to download a finished take to look at it: the XTac-UMI Collector console (below, "the console") replays them one at a time, with the views, the poses and the gripper opening playing back at the pace they were recorded. Use it to review whether a take is worth keeping before deciding to delete it.

Find the recording on the [Projects page](projects-export.md) and click "Replay" at the end of its row to open the replay page. The "Replay" tab in the top bar only has content once you have picked a take; the address bar carries the entry id, so refreshing does not lose it. The mobile layout has no replay page — open the console on a tablet or a PC.

Whether a take can be replayed depends only on **whether the raw file is still on the device**, and not on whether it has been uploaded: both [ready and uploaded](monitor-record.md#episode-state) entries replay normally (fixed in 0.3.11; before that, a take that had been uploaded once reported "not ready" even with the file intact). An [archived](monitor-record.md#episode-state) entry had its raw file cleared at archive time, so its "Replay" button on the Projects page is greyed out and hovering says "Archived, the local source has been deleted"; it can neither be opened nor exported. To see that data, fetch it from the remote repository it was uploaded to.

![The replay page](../assets/backpack/playback-live.webp)

The layout matches the [Live monitor](monitor-record.md): the left and right columns hold each gripper's fisheye view and its two visuotactile feeds, and the centre column holds the headset's stereo pair and the "arms pose" 3D view (the top row is HEAD's coordinates in the world frame, and the two cards below the view are the left and right gripper opening angles). The bottom of each tile is labelled with its source channel (`fisheye` / `tactile_1` / `tactile_2` / `left` / `right`) and "recorded / replaying / empty". The page header and the bottom left hold this take's details: project › task, recording time, path on disk, duration, frame count and data size; the bottom right is the playback control card.

!!! warning "Replay and live preview cannot run at the same time"
    Replay takes exclusive use of the backpack's hardware encoder (MPP). As long as any tablet or browser is still watching the live preview, or an export is transcoding, clicking "Play online" is refused and the status line shows "Resource busy: MPP is in use, cannot start replay right now (…)" naming what is holding it. Go to the live monitor page and click "Stop streaming" (on every connected device), wait for the export transcode to finish, then come back and play. Once replay has started, someone else opening the preview will not interrupt it.

## Playback controls {#controls}

- **Play online**: streamed replay, without downloading the whole file. Once it starts the button becomes "Play / Pause" and the status line shows "Playing online · N feeds"; the progress bar can be dragged to seek, and the views and the poses share one clock, so they stop and seek together. At the end it shows "Playback finished", and dragging the progress bar back replays it. Replay is capped at 30 fps (the tactile archive in the MCAP is 120 fps), and the tactile view is the rectified difference image, the same as in live monitoring; the bitrate adapts on a weak network, with nothing to adjust by hand.
- **Pose card**: during replay the poses and opening angles follow the video. The top right of the card states the actual status: static (not started) / waiting to start / following the video / no pose recorded in this take; older entries with no pose keep a static model and say so.
- **Recording info**: pops up this MCAP's metadata — size, message count, channel count, chunk count, duration, whether there is a Summary, and the complete list of data channels.
- **Back to projects**: returns to the Projects page and ends the replay session.

There is no download button on the replay page: both single-take download entry points (the replay page's "Download H264" and ticking individual takes in the export dialog) were removed in 0.3.10, and fetching files now goes through the task-level export — pick the destination "Download to device" and a format in the [export dialog](projects-export.md#export), and collect the archive once the device has packed it.

## Quality marks and per-take statistics {#quality}

The duration, frame count and data size in the replay page header are the same data as the statistics on the Projects page row. Each row on the Projects page also has a "Quality" column: normal shows "—", otherwise several items are joined with `·`: `lag N` is the number of frames dropped to lag on the collection side, `断 N` is the number of device dropouts, `坏 N` is the bad-frame count (checked once on the collection side and once on the transcode side, taking the larger), followed by whatever the stop-recording quality check wrote down — for example "Pico tracker missing", a camera channel with no frames, the share of the take in which tracking was lost, or a missing tactile rectification recipe. The take that was judged "data suspect" at stop time, with the gripper pulsing yellow, is the one with a mark in this column; the criteria are in [After stopping](monitor-record.md#record-stop).

Replay a marked entry before doing anything else: where a tracker left the field of view, the pose card visibly stops following the video; an entry with missing feeds or zero frames will be blocked by the LeRobot export pre-check anyway, so keeping it gains nothing — delete it on the Projects page. Tracking confidence is written frame by frame into the LeRobot dataset's `observation.tracker_confidence`, leaving it to the training side to drop or mask those samples, see [Export](projects-export.md#lerobot).
