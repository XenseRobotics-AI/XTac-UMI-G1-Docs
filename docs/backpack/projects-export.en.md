# Projects, export and publishing

This page covers the "Projects" page of the XTac-UMI Collector console (below, "the console"): managing recorded data, exporting a task as a LeRobot dataset or as mcap, downloading to the device or uploading to a remote end, and using "Archive" to free up recording space. By the end you can take one task through the whole process on your own, from review to export to archive.

## The Projects page {#projects}

The hierarchy is project → task → recording. A project row shows the description, the task count and the disk usage; a task row shows the task instruction and how many takes it has; a recording row shows duration, frame count, data size and quality annotations, with "Replay" and "Delete" at the end.

![The Projects page, expanded to the recordings](../assets/backpack/project-list-live.webp)

- Projects and tasks are created on the live monitor page, see [Picking a project and task](monitor-record.md#project-task).
- "Set as target" on a task row makes that task the current target, so recordings from the live monitor page and from the gripper buttons land in it; the current target is highlighted green, and clicking it again just reconfirms.
- Recording numbers increase permanently within a task, starting at `ep0`; deleting one in the middle does not recycle its number, and numbering continues after a power cycle.
- A task's "target count" is a hard gate counted on **cumulative collection**: once the count is met, both the browser and the gripper buttons refuse to start recording. Neither uploading nor archiving frees up room, and neither makes the task's progress go backwards. To keep collecting, raise the target count under "Edit task", or delete recordings that should not count towards it.

### Recording states {#status}

There are two separate things to know about a recording: whether it has been uploaded, and whether the raw file is still on the device. The state in the list combines them into four:

| State | What it means | What you can still do |
|---|---|---|
| Ready | Recorded and written to disk, never uploaded | Replay, export either format, upload, archive |
| Uploaded | At least one format has reached a remote end, with the raw file still on the device | Replay, export the other format as well, upload again, archive |
| Archived | Only the catalogue record is left; the raw file was cleared at archive time | Only the record remains; the replay entry point is greyed out and nothing can be exported or uploaded |
| Discarded | The recording did not end normally, or has been deleted | No longer appears in the export scope |

An uploaded recording replays normally; for an archived one, replay and download state plainly that the raw file was cleared at archive time rather than reporting a generic failure.

## Editing projects and tasks {#edit}

"Edit" on a project row opens Rename / Upload backend / Delete permanently; "Edit" on a task row opens Edit task / Delete task permanently. "Upload backend" rebinds the project to an [upload configuration](#modelscope-backend) — if the credentials were not ready when you created the project, bind them here afterwards.

![The task edit menu](../assets/backpack/edit-task-live.webp)

A project's **default export format** is chosen only when the project is created ("LeRobot dataset" or "mcap") and is not in the edit menu afterwards; it is only a default, and every export can override it.

!!! danger "Deleting permanently cannot be undone"
    Deleting permanently is a hard delete: it cascades through every recording under the project or task and removes the MCAP, the H264 transcodes and the export outputs from disk. The confirmation dialog lists how many tasks, how many recordings and how much space will go, and requires you to type the project's or task's name before it proceeds.

## Deleting a recording {#delete}

Click "Delete" on a recording row and the confirmation dialog shows that take's number, duration and data size; confirming removes it along with its MCAP and H264 transcode, and it cannot be undone. The take you have just finished can also be deleted with the gripper buttons, see [Gripper buttons](../common/gripper.md#buttons).

Deleting and [archiving](#archive) are different things: archiving only removes the local raw file and keeps the catalogue record, while deleting takes the record with it and the recording disappears from the task.

## The export dialog {#export}

Click "Export" on a task row to open the "Export task data" dialog. Every way of getting data out converges on this one entry point, and the flow is: automatic pre-check → (optionally) tick to narrow the scope → pick the **export destination** → pick the **export format** → fill in the one setting that destination needs → start.

1. **Pre-check**: opening the dialog automatically pre-checks every exportable recording under the task, and the top line gives the verdict (N ready recordings · N blocking items · N notices). Blocking items come at task level and per take; common ones are a missing camera route, mixed capture modes within one task (channels not matching the first episode), an empty task instruction, a recording timeline that does not overlap or is not monotonic, and no valid headset pose at all in a mode that includes the headset. While the pre-check fails, both download and upload are unavailable; delete or fix the problem takes (split mixed modes into separate tasks) and click "Export again" to re-run it.
2. **Ticking**: the body of the dialog is the recording list, each row showing duration, data size and state side by side, with "N blocking items" and the details listed for any row that has them. **Ticking nothing = everything**; ticking is only for narrowing this run's scope, and all four actions — download, upload, archive and delete permanently — honour it. Archived rows have no local source, so their tickbox is disabled.
3. **Export destination**: "Download to device" or "Upload to remote". The destination comes first and everything else follows — [downloading](#download) needs no remote configuration, and the upload backend section only appears for [uploading](#modelscope).
4. **Export format**: one of "Follow project setting", "LeRobot dataset" and "mcap", see [The two export formats](#formats).

![Pre-check failed, with the blocking items listed per take](../assets/backpack/export-precheck-live.webp)

The screenshot shows an older version of the interface; the current export dialog asks for the destination before the format.

There are two more actions at the bottom of the dialog: "Archive" is always available, see [Archive](#archive); "Delete permanently (N)" only appears once you have ticked something and removes the ticked takes along with their records. "Close (continues in the background)" does not interrupt an export or upload in progress — reopen the dialog to carry on watching it.

!!! warning "The single-take download entry point is gone"
    Ticking individual takes to download MCAP in the export dialog, and the "Download H264" button on a single recording's replay page, have both been removed. Getting data out now goes through the task-level export: pick the destination → pick the format → collect it once.

## The two export formats {#formats}

`LeRobot dataset` and `mcap` are two equal outputs and are **not mutually exclusive**: the same task can produce one now and the other later, both outputs are kept, and both can be uploaded. Each project picks a default format when it is created, "Follow project setting" uses it, and a single export can still override it.

### LeRobot dataset {#lerobot}

A standard LeRobotDataset v3.0 (`codebase_version` v3.0, `robot_type` `bi_taccap_gripper`), whose root is directly `meta/`, `data/` and `videos/`. An introduction to the format itself and how to load it is in [The LeRobotDataset format at a glance](../pc/dataset.md#61).

![The LeRobot dataset directory tree](../assets/backpack/lerobot-tree.webp)

- The frame rate is fixed at 30 fps: every video is nearest-neighbour resampled onto the same 30 Hz grid by source timestamp, and the resolution is copied from the collection without scaling.
- Video: the left and right fisheye views plus two visuotactile feeds per gripper, six in all, with the headset's two stereo feeds added in modes that include the headset; all are H264 MP4. Whether the wrist view is undistorted is decided by the project's [capture config](system.md#capture-mode), and the rectification happens only at export.
- `observation.state` has 20 dimensions: 10 per side, namely `left_tcp.*` / `right_tcp.*` end-effector position (3) plus the 6-D rotation (6), plus the gripper opening (1, normalised); `action` is the state shifted one frame later. The 6-D rotation takes its columns the same way as on the Developer Kit, see [What each frame holds](../pc/recording.md#53).
- Headset pose: in modes that include the headset, 9 dimensions are appended to state and action (headset position 3 plus 6-D rotation 6), making 29; a dataset without the headset stays at 20. Episodes with and without the headset cannot be mixed within one task, and the pre-check rejects them individually; samples where tracking was lost are dropped and filled by nearest neighbour.
- `observation.tracker_confidence`: shape [2], recording each tracker's confidence frame by frame (0 still within view, 1 tracking normally, 2 outside the view with orientation but no position, 3 / 4 judged abnormal by the device, -1 not reported by older firmware). When a tracker leaves the field of view its position reading cannot be trusted; the export does not rewrite the trajectory, leaving it to the training side to drop or mask those samples.
- `meta/taccap_extrinsics.json`: per episode, the source recording ID, the left and right tracker binding, and the tracker→EE extrinsics.
- `meta/xumi_collection_devices.json` (since 0.3.16): per episode, **which set of equipment actually collected this data**, see [Tracing the collection equipment](#devices).
- `meta/info.json` emits its top-level fields and each feature in a fixed order (fixed in 0.3.16) so the Dataset Card page lays them out as expected; the meaning of the fields and the existing data are unchanged.

### Tracing the collection equipment {#devices}

Since 0.3.16, each time recording starts the device freezes the SNs and software versions of the backpack, headset, left and right grippers, left and right trackers and six cameras actually in use into the recording file; changing a camera, a gripper or the headset afterwards never rewrites a historical recording. When a LeRobot dataset is exported, that snapshot lands per episode in `meta/xumi_collection_devices.json`, so whoever receives the dataset can trace the collection equipment episode by episode.

- Only the fields that are actually useful are kept: the backpack keeps its SN and software version, and a camera keeps its side, role and SN.
- An SN that cannot be read at the time is marked unknown with a note; it does not block collection and does not count as a quality problem.
- Data recorded before 0.3.16 has no such snapshot, and the export writes `legacy: true` as a placeholder, restoring only the tracker binding that can be established reliably. It does not infer history from whatever equipment happens to be online at export time, and there is nothing to re-record.

### mcap {#mcap}

A 30 Hz output from the same source as the dataset: the same state / action, the same six video feeds and sensor data, with one self-contained `<episode_id>.train.mcap` file per episode, convenient for opening directly in a general-purpose visualiser such as Foxglove.

The action and state data are identical between the two formats, and the choice only affects the packaging. Downloading mcap gives you an archive that unpacks into a flat pile of `.train.mcap` files; those are also what gets uploaded to [STS](#sts).

## Downloading to the device {#download}

Once you pick "Download to device", all that is left below is one line of explanation and a button: the output is packed on the device first and collected afterwards.

- The stages are pre-check → transcode → build → pack → done, with progress shown in place in the dialog, and "Cancel export" available at any point.
- When packing finishes, a "Download dataset" or "Download mcap" button appears at the bottom and pulls the archive to the current browser. Both formats are collected exactly the same way, and the archive's filename states the task and the format.
- A LeRobot archive unpacks with `meta/`, `data/` and `videos/` directly at the root; an mcap archive unpacks into a flat pile of `.train.mcap` files.
- Do not close the tab before the download finishes; "Close (continues in the background)" only closes the dialog, and the packing itself carries on.

!!! warning "An archived recording cannot be fetched back"
    Archiving deletes the local raw file, after which those episodes can neither be replayed nor exported in any format. If you need a local copy, download it first, or do not tick auto-archive when uploading.

## Uploading to a remote end {#modelscope}

Once you pick "Upload to remote", the output goes straight to the remote repository with no archive left on the device. The stages are pre-check → transcode → build → upload → done; the metadata is committed last, so a failure part-way leaves the remote end in the complete state of the previous batch, and you just upload again once it is fixed.

Uploads are incremental: each format has its own publish cursor and only sends the episodes in this batch that have not been uploaded yet; on success they drop out of that format's pending set, and the next batch of recordings continues into the same repository. So one episode is uploaded only once per format, though switching format sends it again.

![An upload in progress, at the transcode stage](../assets/backpack/export-transcoding.webp)

The screenshot shows an older version of the interface; the current export dialog asks for the destination before the format.

### Upload backends {#modelscope-backend}

**Credentials are not entered in the export dialog.** Repository addresses and access credentials are only set up as named "upload backends" at console → System → [Upload configuration](system.md#upload), and at export time you just pick one from the drop-down. The drop-down is always there, and all three cases are entries in it:

- "Follow project setting": uses the entry the project is bound to, with the actual one named in brackets (with no binding it uses the global credentials already on the device; if the bound entry has been deleted it says so, and the upload will fail in that case).
- A specific entry: shows name · kind · destination, with the project's default marked "(project default)".
- "＋ New upload backend…": jumps to the upload configuration page to create one, and it is in the drop-down when you come back.

There are five kinds of backend: **ModelScope**, **S3** (the bucket must already exist), **FTP / FTPS**, **NFS network storage** and **[STS (exported MCAP)](#sts)**. The first four take both `LeRobot dataset` and `mcap`, and name their directories by the same rule automatically, with nothing to fill in: **`<root>/ project name / mode prefix-task name-date /`** (the "root" is the Owner, the bucket or the target root directory depending on the kind). A task that has already uploaded keeps its original directory.

Which fields to fill in and how to check the permissions are all on the console → System → [Upload configuration](system.md#upload) page and are not repeated here. Which kinds this device offers depends on the backend options on its own System → Upload configuration page.

Uploads are **batched by recording date**: takes recorded on the same day are appended to the same directory, and different days upload separately. The export dialog previews which directory this run will write into, so you can check before sending.

Staying on the current backend continues writing to the original repository; switching to another upload backend writes only the data that has not been uploaded yet into the new repository, numbering from 0, and switching back later still continues the original repository's progress. Each remote repository has its own publish cursor, one recording is uploaded only once per format, and changing the destination does not re-send an old batch.

!!! warning "Check which entry you are on before uploading"
    Once data has gone into the wrong account, ModelScope's programmatic deletion is limited and withdrawing it means doing it by hand in the ModelScope web console; publishing publicly is equally irreversible.

### Starting the upload {#modelscope-publish}

The upload settings area holds only two things: the upload backend drop-down above, and one tickbox.

- "Archive automatically after uploading (delete the local source, keep only the metadata)": **not ticked by default**. Leave it unticked and it only uploads, keeping every local file so you can [archive](#archive) by hand at any point afterwards; tick it and the local source is deleted to free space as soon as the upload succeeds.
- The button text follows the tickbox: "Upload LeRobot dataset" or "Upload LeRobot dataset (archive afterwards)", and likewise for mcap.
- The completion message states the outcome: unticked it is "Uploaded to &lt;repository&gt;, N episodes. The local source has been kept", and ticked it adds how much space this run freed.

!!! warning "Since 0.3.10 the disk is no longer cleared by default"
    The old default was to delete the local recording as soon as the upload succeeded. Now it is only cleaned up if you tick the box before uploading — the older documentation's "cleared by default after publishing, tick to keep" has been reversed.

## Archive {#archive}

"Archive" is what used to be called "clear the disk": it deletes the recording's local raw file and keeps only the catalogue record. Since 0.3.11 it is **always available** — the button sits at the bottom of the export dialog rather than appearing only after an upload completes, so you can use it right after downloading a batch and wanting the space back. Ticking nothing archives the whole task; ticking archives only the takes you ticked.

Archiving cannot be undone, and the confirmation comes in two levels according to the consequence:

- **Uploaded takes**: a copy still exists remotely, so archiving only frees local space. The confirmation names the remote repository and states that replay and exporting the other format will no longer be possible.
- **Never-uploaded takes**: there is no copy anywhere, so after archiving the data itself is gone. That case gets a more emphatic confirmation that spells out the count and the consequence separately.

A recording uploaded in only one format **is still archived**, but at a higher price: once the source file is gone, the other format can never be exported. The completion message lists them in two groups — which takes were never uploaded, and which were uploaded in only one format — along with the space this run freed. To keep both formats, export or upload the other one before archiving.

!!! danger "Archiving deletes the raw file, not the record"
    An archived recording still counts towards the task's collected count and progress, but its replay entry point is greyed out and no format can be exported any more. To remove the record as well, use [Deleting a recording](#delete) or the task-level delete permanently.

## STS training MCAP upload {#sts}

0.3.16 added the `STS (exported MCAP)` upload backend, an equal of ModelScope and S3. It **accepts only offline-exported training MCAP** (`*.train.mcap`); it does not accept a LeRobot directory and does not upload the recording's source MCAP.

- How to use it: create an STS backend at [Upload configuration](system.md#upload), filling in Server, Account / OpenID, Project, Project Type and Task ID (which may be left blank). At export time **switch the export format to `mcap`**, pick "Upload to remote" as the destination, and select that entry in the backend drop-down. With the format set to LeRobot the dialog tells you to switch to mcap first and the upload button is unavailable.
- Uploads go episode by episode: it requests one upload from the Server by recording start time, streams the file with the short-lived credentials the server issues, then registers it in a callback. A file that already exists on the server is reused rather than re-sent.
- The device identity cannot be forged: the upload always reads this backpack's own SN, and it cannot be overridden in the configuration.

### Operator tags in the training MCAP {#sts-tags}

During recording, **a single click of the right gripper button** writes an operator tag to `/events/operator_tag`, and the same valid click also writes a state node to `/events/subtask_state`. Node names increase in order from `Subtask 1` within each recording, and a new recording starts from 1 again. Both topics are preserved as they are in the exported training MCAP.

Add a **State Transitions** panel in Foxglove with the Series Expression `/events/subtask_state.subtask_name`, and you can see these nodes along the timeline and click to jump to the matching frames — useful for locating the segments you tagged on site.

Errors during export or upload are covered in [Troubleshooting](troubleshooting.md). This page is written against XTac-UMI Collector 0.4.1; the device's actual version is whatever console → System → [Device info](system.md#device-info) shows, and the changes between versions are in [Versions](versions.md#baseline).
