# Dataset

Format, checking, replay, Hub upload, disk planning and cleanup.

## The LeRobotDataset format at a glance {#61}

Collection produces a standard **LeRobotDataset v3.0**: episodes merged into large Parquet/MP4 files, relational metadata locating episode boundaries, and native Hub streaming, with fewer small files and faster startup than v2. Official documentation:

- [LeRobotDataset v3.0 documentation](https://huggingface.co/docs/lerobot/lerobot-dataset-v3) (format design, directory layout, recording, loading/streaming, migrating v2.1→v3.0)
- [lerobot recording guide](https://huggingface.co/docs/lerobot/il_robots#record-a-dataset)
- [lerobot documentation home](https://huggingface.co/docs/lerobot)

It indexes like any Hugging Face / PyTorch dataset:

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # one frame: observation + action, all torch tensors
```

How it is serialised:

- `hf_dataset`: Hugging Face datasets → parquet
- Video (tactile + wrist camera): mp4
- Metadata: json / jsonl (`info` / `episodes` / `stats` / `tasks`); key fields in `info` are `fps`, `features`, `total_episodes`, `total_frames`, `robot_type`, `data_path`, `video_path`
- `robot_type` is the `--robot.type` used for recording (`taccap_gripper` / `bi_taccap_gripper` / `xtac_umi_g1`); right after it, `collection_stack` is always `"xense-taccap-lerobot"`, marking data recorded directly by this program
- Temporal queries: `delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` returns the current frame plus the ones 1 s, 0.5 s and 0.2 s before it in one call

For the per-frame observation and action keys, see [What each frame records](recording.md#53).

Recording also writes a separate hardware manifest, `meta/hardware.json` (upstream `info` is untouched): station number, gripper and tactile SNs, whether the wrist camera was undistorted, split into `epochs`. Fields and resume behaviour are in [`--robot.id` and the hardware manifest](recording.md#robot-id). Datasets derived with `lerobot-edit-dataset` (deleting or splitting episodes, removing features, 8 → 6 camera conversion) carry `hardware.json` along; **`merge` refuses outright**, because no single manifest could describe every episode's real sensors after a merge.

<span id="stats-std"></span>

!!! warning "Datasets recorded before 0.0.8: the image `std` statistic is 0"
    In datasets recorded before 0.0.8, the `std` of image and video features in `meta/stats.json` is always 0 (`mean`, `min`, `max` and quantiles are unaffected). If you normalise images by `std` during training, recompute the statistics first.

## Where it lands and naming convention

The default location is `~/.cache/huggingface/lerobot/<repo_id>/`; `--dataset.root <path>` moves it to a bigger or faster disk:

```text
<repo_id>/
├── data/     # parquet (observations, actions and other tabular data)
├── videos/   # mp4 (tactile + wrist camera)
└── meta/     # json/jsonl: info · episodes · stats · tasks · hardware
```

`repo_id` has the form `<org>/<name>`:

- Lower case with hyphens or underscores, no spaces or non-ASCII characters; as a team use `<org>/<task>_<variant>_<YYYYMMDD>`, e.g. `Xense/insert_plug_left_20260703`.
- One dataset per task/variant; different tasks or clearly different variants get different `repo_id`s (trade-offs in [Recording](recording.md)).
- Keep `--dataset.single_task` identical within a dataset (written into `meta/tasks`).

## Checking the data {#62}

`lerobot-check-dataset` is installed with the collection program and works on both the Mamba and the Docker path:

```bash
lerobot-check-dataset --repo-id <your_org>/<your_dataset> \
    --root ~/.cache/huggingface/lerobot

# only certain episodes
lerobot-check-dataset --repo-id <your_org>/<your_dataset> --episode-index 0 2 4
```

| Argument | Meaning |
|---|---|
| `repo-id` | Dataset repository id (`<org>/<name>`) |
| `root` | Local root directory (default `~/.cache/huggingface/lerobot`) |
| `episode-index` | Check only these episodes (accepts several, e.g. `0 2 4`) |

What it checks:

- `meta/` is complete and the episode count agrees.
- Parquet row counts and indices are contiguous, with no NaNs.
- Video files exist and their frame counts **exactly** match what is declared.
- **Camera format**: a bimanual dataset is classified as 6 cameras (four tactile streams plus two wrist cameras) or 8 (plus the headset's two eyes); the two have different training input dimensions.

The result is summarised on the last line:

```text
Summary: 0 error(s), 0 warning(s) | Camera format: 6-camera (no headset)
```

Single-gripper datasets, and those with the wrist camera off or only one eye recorded, show `not recognized` with a warning; the other checks are unaffected.

A video frame-count mismatch is graded by direction:

| Case | Result | Meaning |
|---|---|---|
| **Fewer** than declared | error (`... frames but episodes declare ... (N missing ...)`) | Episodes reference frames the video does not have; decoding runs past the end of the stream |
| **More** than declared | warning (`... more than the ... episodes declare -- unreferenced leftover frames`) | Leftover frames no episode refers to (e.g. after deleting episodes); every declared frame is still there, so the data is usable |

### Bimanual 8 cameras → 6 cameras {#8to6}

A bimanual dataset recorded with the [head camera](recording.md#56) on is in the 8-camera format. `lerobot-edit-dataset` reduces it to the 6-camera format, the same shape as a `bi_taccap_gripper` recording, and the recorded type becomes `bi_taccap_gripper`:

```bash
lerobot-edit-dataset \
    --repo_id <your_org>/<dataset_8cam> \
    --new_repo_id <your_org>/<dataset_6cam> \
    --operation.type convert_8_to_6_cameras
```

It drops the two headset eye image keys and the `head_camera.*` dimensions from `action` / `observation.state`; **the source dataset is left untouched** and the result goes to `--new_repo_id`. A source that is already 6-camera, or whose camera keys are unexpected, is refused with an error.

!!! warning "Double-check `--repo_id`"
    If the dataset is not found locally this conversion fetches it from the Hugging Face Hub, and `--local_files_only` has no effect on it. Make sure `--repo_id` is spelled correctly, or point `--root` straight at the local dataset folder.

## Replay and visualisation

- Online: once on the Hub, browse each episode's video and data with the [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset).
- 3D trajectory: add `--display_data=true` during the [pre-recording preview](recording.md#preview) to see the gripper pose and trajectory in Rerun (see [the `/world` 3D view](../common/coordinates.md#world-view)).
- Local, frame by frame: open the parquet + mp4 with the visualisation script your local `lerobot` provides.

## Pushing to the Hugging Face Hub and backup {#64}

An upload is off-site backup plus delivery. Run `lerobot-check-dataset` first; back up the whole `<repo_id>/` before deleting or moving an important dataset.

!!! warning "Log in to the Hub first"
    Before uploading, run `hf auth login` (older versions also accept `huggingface-cli login`) or set `HF_TOKEN`; otherwise the push fails on authentication.

Push with `lerobot-push-dataset-to-hub`:

```bash
# basic form (--repo-id and --dataset-path are both needed)
lerobot-push-dataset-to-hub \
    --repo-id <your_org>/<your_dataset> \
    --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
```

Common variants:

=== "Large dataset"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --upload-large-folder
    ```

=== "Private repository"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --private
    ```

=== "Without video"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --no-videos
    ```

On success it lives at `https://huggingface.co/datasets/<repo_id>`.

- The upload generates a dataset card (README) and writes `assets/` (three card images, about 12 MB in total) into the local dataset folder, uploading it too, even with `--no-videos`.
- `--dataset-path` reads local files only; a wrong path fails with `Cannot find dataset metadata in local directory` and nothing is downloaded from the Hub.

## Planning and estimating disk usage {#storage-planning}

- A bimanual multi-camera rig can produce around **280 MB/s** of raw video; that is not the encoded write rate, so do not estimate on-disk size from it.
- Per episode ≈ average bitrate of each encoded video stream × duration + Parquet and metadata; camera count, resolution, scene content, `fps`, encoder, bitrate and `episode_time_s` all affect it.
- Before a large run, record 2–3 representative episodes and run the integrity check, then extrapolate from the measured size to the planned episode count:

```bash
du -sh ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
df -h ~/.cache/huggingface/lerobot          # free space on the target disk
```

## Cleanup and maintenance

Before deleting, confirm the data passed `lerobot-check-dataset` and is backed up or uploaded. Move it into a quarantine directory first, and delete it through the file manager once you are sure:

```bash
mkdir -p /data/lerobot-trash
realpath ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
du -sh ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
mv -- ~/.cache/huggingface/lerobot/<your_org>/<old_dataset> /data/lerobot-trash/
```

!!! warning "Check the `realpath` output before moving"
    It must be the single dataset directory you meant; never run a recursive delete against the cache root.

Watch the target disk with `df -h` so a run does not fill it mid-session (see [Troubleshooting](troubleshooting.md)).

## Collection record

Keep one line of record per dataset. Gripper and tactile SNs are already in `meta/hardware.json`; copying them here is only for offline lookup, and the dataset wins if they disagree. The tracker SN has to be written down by hand.

| `repo_id` | Task description | Station number `--robot.id` | Gripper / tracker SN | Calibration date | Software version / commit | World-frame session | Integrity check | Episodes / episode length | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `Xense/pick_object_20260703` | `Pick up the object` | `0` (stored in the dataset as `bi_taccap_0`) | `TCGU01A24Z0001m` / `PC2310MLL...` | 2026-07-03 | The `xense-taccap-lerobot v0.1.0` and `xense.taccap <version>` in use at the time | When XTac-UMI XR was started / which way the operator faced | `lerobot-check-dataset` passed; list of anomalous episodes | 50 / 15s | Lighting / scene / anomalous episodes |
