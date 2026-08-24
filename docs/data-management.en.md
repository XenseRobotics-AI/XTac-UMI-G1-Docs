# Data Management & Naming

How to organise, name, size, back up and clean up data once it is on disk. For the **format
details** of the dataset see [Dataset & Examples](06-dataset.md); this page is about **operations
and conventions**.

## Where it lands

Collection writes by default to:

```
~/.cache/huggingface/lerobot/<repo_id>/
```

`--dataset.root <path>` puts it somewhere else (a bigger or faster disk). The layout is roughly:

```
<repo_id>/
├── data/     # parquet (observations, actions and other tabular data)
├── videos/   # mp4 (tactile + wrist camera)
└── meta/     # json/jsonl: info · episodes · stats · tasks · hardware
```

Fields and format are covered in
[6.1 The LeRobotDataset format at a glance](06-dataset.md#61).
`meta/hardware.json` is the extra hardware manifest the XTac-UMI G1 writes (station label plus the
gripper and tactile serials, split into `epochs` so a hardware swap part-way through a dataset is
recorded too), and `meta/runtimes/` alongside it holds each tactile sensor's runtime bundle as it
was at the time. Both are covered in
[`--robot.id` and the hardware manifest](05-data-collection.md#robot-id).

## Naming convention (`repo_id`)

`repo_id` has the form `<org>/<name>`. Recommended:

- **Lower case with hyphens or underscores**, no spaces and no non-ASCII characters.
- **Include the task and the date** so datasets are easy to find and to tell apart:
  `Xense/pick_object_20260703`.
- **One dataset per task/variant**; different tasks, or clearly different variants, get different
  `repo_id`s (see [Best practices → Diversity vs consistency](best-practices.md)).
- Keep the `--dataset.single_task` description identical within a dataset (it is written into
  `meta/tasks`).

!!! tip "A convention worth agreeing on as a team"
    `<org>/<task>_<variant>_<YYYYMMDD>`, e.g. `Xense/insert_plug_left_20260703`.

## Planning and estimating disk usage {#storage-planning}

- A bimanual rig with several cameras can produce around **280 MB/s** of raw video throughput.
  That is not the rate at which bytes hit the disk — the encoded size depends on resolution, scene
  content, `fps`, the encoder and the bitrate.
- A rough estimate per episode is: the average bitrate of each encoded video stream × the duration,
  plus the Parquet and metadata. Camera count, resolution, `fps` and `episode_time_s` all scale it
  up.
- Before a large collection run, record 2–3 representative episodes, run the integrity check, then
  measure the real size with `du -sh` and extrapolate to the number of episodes you plan. Do not
  extrapolate from the raw 280 MB/s figure.

```bash
du -sh ~/.cache/huggingface/lerobot/<your_org>/<dataset_name>
df -h ~/.cache/huggingface/lerobot          # free space on the target disk
```

## Backup and upload

- **Local backup**: back up the whole `<repo_id>/` directory before deleting or moving an important
  dataset.
- **Push to the Hub**: use `lerobot-push-dataset-to-hub` (see
  [6.4 Pushing to the Hugging Face Hub](06-dataset.md#64)); add `--upload-large-folder` for a large
  dataset and `--private` for a private one.
- An upload counts as **off-site backup + delivery**; verify with `lerobot-check-dataset` first.

## Cleanup and maintenance

- When disk gets tight, first confirm the data passed `lerobot-check-dataset` and has been backed
  up or uploaded. To keep a way back, move the dataset into a separate quarantine directory first
  and only delete it through the file manager once you are sure:

```bash
mkdir -p /data/lerobot-trash
realpath ~/.cache/huggingface/lerobot/<your_org>/<old_dataset_name>
du -sh ~/.cache/huggingface/lerobot/<your_org>/<old_dataset_name>
mv -- ~/.cache/huggingface/lerobot/<your_org>/<old_dataset_name> /data/lerobot-trash/
```

Check that the `realpath` output really is the single dataset directory you meant before moving
anything, and never run a recursive delete against the cache root.

- Keep an eye on the target disk with `df -h` so a collection run does not fill it mid-session (see
  [Troubleshooting → Data and disk](troubleshooting.md)).

## A collection record (recommended)

For traceability, keep the following for each dataset:

!!! tip "You do not have to copy the gripper and tactile serials by hand"
    Recording already writes both into `meta/hardware.json` (see
    [`--robot.id` and the hardware manifest](05-data-collection.md#robot-id)); copying them into
    your record is only so they can be looked up offline. **If the two disagree, the one in the
    dataset wins.** The tracker SN is *not* in the manifest, so that one does have to be written
    down.

| Field | Example |
|---|---|
| `repo_id` | `Xense/pick_object_20260703` |
| Task description | `Pick up the object` |
| Station number `--robot.id` | `0` (stored in the dataset as `bi_taccap_0`) |
| Gripper / tracker SN used | `TCGU01A24Z0001m` / `PC2310MLL...` |
| Calibration date | 2026-07-03 |
| Software version / commit | The `xense-taccap-lerobot main@<SHA>` and `xense.taccap <version>` in use at the time |
| World-frame session | When XTac-UMI XR was started / which way the operator faced |
| Integrity check | `lerobot-check-dataset` passed; list of anomalous episodes |
| Episodes / episode length | 50 / 15 s |
| Notes | Lighting, scene, anomalous episodes |
