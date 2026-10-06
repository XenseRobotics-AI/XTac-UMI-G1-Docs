# Projects, export and publishing

Manage recorded data on the console's Projects page: export a task as a LeRobot dataset or MCAP, download it or upload it to a remote (for example publish to ModelScope), then free up space with Archive.

## The Projects page {#projects}

The hierarchy is **project → task → recording**. Each recording shows frames, data size and [quality](playback.md#quality), with Playback and Delete at the end of the row.

![The Projects page](../assets/backpack/project-list-live.webp)

| Where | Actions |
|---|---|
| Page header | New project, search, filter by status |
| Project row | Capture configuration, New task, Edit (rename / upload backend / delete permanently) |
| Task row | Set as target (recordings go into this task), Export, Edit (edit task / delete task permanently) |
| Recording | Playback, Delete |

### New projects and tasks {#new}

- **New project**: enter a name and pick a capture mode (one of three); modes with the headset also pick headset resolution and image type; optionally set tactile export orientation, wrist fisheye correction, upload backend and default export format. **It cannot be changed afterwards**; if it is wrong, delete the empty project and create it again.
- **New task**: task name (lowercase letters, digits and hyphens, e.g. `pick-cube`) and task instruction (required; it is the LeRobot language instruction); target count and target duration are optional.

## Export {#export}

Click Export on a task row to open "Export task data":

![The export dialog](../assets/backpack/export-precheck-live.webp)

1. **Precheck**: the task's recordings are checked automatically; on success it says the export can go ahead, otherwise it lists the blockers to fix before clicking "Export again".
2. **Pick recordings**: nothing ticked means all; ticking only narrows the scope.
3. **Pick where it goes**: "Download to device" or "Upload to remote".
4. **Pick the format**: follow the project setting, LeRobot dataset or MCAP.
5. **Start**: click "Download …" or "Upload …". Progress runs precheck → transcode → build → pack / upload → done; closing the dialog leaves it running in the background.

### Download to device {#download}

When it is done, click "Download dataset" or "Download mcap" and the browser saves an archive.

### Upload to remote {#upload}

Pick an [upload backend](system.md#upload) (or create one on the spot); optionally tick "Archive automatically after upload".

| Backend | Formats |
|---|---|
| ModelScope | LeRobot dataset, MCAP; creates the repo automatically, private or public |
| S3 object storage | LeRobot dataset, MCAP |
| FTP / FTPS, NFS network storage | LeRobot dataset, MCAP |
| STS | MCAP only |

**Publishing to ModelScope** is simply uploading with the ModelScope backend; there is no separate Publish button. A public release cannot be withdrawn.

## Export formats {#formats}

You can export both formats; they do not affect each other.

### LeRobot dataset {#lerobot}

A standard LeRobotDataset v3.0 at 30 fps, with `meta/`, `data/` and `videos/`.

![LeRobot dataset layout](../assets/backpack/lerobot-tree.webp)

| Capture mode | `robot_type` | Video streams | State / action dims |
|---|---|---|---|
| Two grippers | `bi_taccap_gripper` | 6 | 20 |
| Two grippers + headset stereo | `xtac_umi_g1` | 8 | 29 |
| Two grippers + headset right eye | `xtac_umi_g1` | 7 | 29 |

It also includes `meta/taccap_extrinsics.json` (tracker extrinsics) and `meta/xumi_collection_devices.json` (which devices recorded each episode). The format and how to load it are in [LeRobotDataset at a glance](../pc/dataset.md#61).

### MCAP {#mcap}

One `.train.mcap` file per recording, with 30 Hz state and action, every video stream and the sensor data; open it directly in Foxglove and similar tools.

## Archive {#archive}

Archiving **deletes the raw files on the device and keeps only the record**, to free space; archived recordings can no longer be replayed or exported.

Tick recordings in the export dialog and click Archive, or tick "Archive automatically after upload" when uploading. The confirmation separates recordings by whether they were uploaded or downloaded, and recordings never uploaded or downloaded need a final extra confirmation.

## Delete {#delete}

- **One recording**: click Delete on its row; the files go with it and cannot be recovered.
- **Several**: tick them in the export dialog and click "Delete permanently". Unlike archiving, the record goes too; copies already uploaded to a remote are unaffected.
- **A whole project or task**: "Delete permanently" in its Edit menu; you must type the name to confirm.
