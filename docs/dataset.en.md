# Dataset

What the data looks like after recording, how to check it, replay it and upload it to the Hub, how to plan disk space, and how to clear out old data. After reading this you can take a dataset from the local cache, check it and deliver it to the Hub.

## The LeRobotDataset format at a glance {#61}

Collection produces a standard **LeRobotDataset v3.0**: many episodes merged into large Parquet/MP4 files, relational metadata to locate episode boundaries, and native streaming from the Hub. Compared with v2 it means far fewer small files and a faster startup. If you have not worked with lerobot before, read the official documentation first and then come back here for what is specific to the XTac-UMI G1:

- [LeRobotDataset v3.0 documentation](https://huggingface.co/docs/lerobot/lerobot-dataset-v3) (format design, directory layout, recording, loading/streaming, migrating v2.1→v3.0)
- [lerobot recording guide](https://huggingface.co/docs/lerobot/il_robots#record-a-dataset)
- [lerobot documentation home](https://huggingface.co/docs/lerobot)

The dataset indexes like any Hugging Face / PyTorch dataset:

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # one frame: observation + action, all torch tensors
```

How it is serialised:

- `hf_dataset`: Hugging Face datasets → parquet
- Video (tactile + wrist camera): mp4, to save space
- Metadata: plain json / jsonl (`info` / `episodes` / `stats` / `tasks`); the fields that matter in `info` are `fps`, `features`, `total_episodes`, `total_frames`, `robot_type`, `data_path`, `video_path`
- Temporal queries: `delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` returns the current frame plus the ones 1 s, 0.5 s and 0.2 s before it in one call

For the observation and action keys recorded in each frame, see [What each frame records](recording.md#53).

A standard LeRobotDataset records only `robot_type` in `info`, so recording writes two extra, separate files (neither touches the upstream `info` structure): `meta/hardware.json` records which rig produced the data (station number, gripper and tactile SNs, whether the wrist camera was undistorted; split into `epochs`, and a hardware swap part-way through starts a new epoch), and `meta/runtimes/` records each tactile sensor's runtime bundle at the time of collection, which rebuilding depth / force / difference from the `rectify` stream needs. Field meanings, resume behaviour and what to watch out for when reconstructing are in [`--robot.id` and the hardware manifest](recording.md#robot-id).

## Where it lands and naming convention

Collection writes by default to `~/.cache/huggingface/lerobot/<repo_id>/`; `--dataset.root <path>` puts it somewhere else (a bigger or faster disk). The layout is roughly:

```text
<repo_id>/
├── data/     # parquet (observations, actions and other tabular data)
├── videos/   # mp4 (tactile + wrist camera)
└── meta/     # json/jsonl: info · episodes · stats · tasks · hardware
```

`repo_id` has the form `<org>/<name>`. Recommended:

- Lower case with hyphens or underscores, no spaces or non-ASCII characters; include the task and the date so datasets are easy to find and to deduplicate. Agree on `<org>/<task>_<variant>_<YYYYMMDD>` as a team, e.g. `Xense/insert_plug_left_20260703`.
- One dataset per task/variant; different tasks, or clearly different variants, get different `repo_id`s (for the trade-off between diversity and consistency see [Recording](recording.md)).
- Keep the `--dataset.single_task` description identical within a dataset (it is written into `meta/tasks`).

## Checking the data {#62}

`lerobot-check-dataset` is installed along with the collection program and can be typed directly on both the Mamba and the Docker path. It checks frame counts, video, field consistency and so on:

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

## Replay and visualisation

- Online: once the dataset is on the Hub, the [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) browses each episode's video and data.
- 3D trajectory: add `--display_data=true` during the [pre-recording preview](recording.md#preview) to see the gripper pose and trajectory in Rerun (see [the `/world` 3D view](recording.md#world-view)).
- Local, frame by frame: open the parquet + mp4 with the dataset visualisation script your local `lerobot` provides and check it frame by frame.

## Pushing to the Hugging Face Hub and backup {#64}

An upload counts as off-site backup plus delivery: run `lerobot-check-dataset` before uploading, and back up the whole `<repo_id>/` directory before deleting or moving an important dataset.

!!! warning "Log in to the Hub first"
    Before uploading, run `hf auth login` (older versions also accept `huggingface-cli login`) or set `HF_TOKEN`; otherwise the push fails on authentication.

Push with the installed `lerobot-push-dataset-to-hub` console entry point:

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

On success the dataset lives at `https://huggingface.co/datasets/<repo_id>`.

## Planning and estimating disk usage {#storage-planning}

- A bimanual rig with several cameras can produce around **280 MB/s** of raw video throughput. That is not the encoded write rate to disk, so do not extrapolate the on-disk size from it. The size after real-time encoding depends on resolution, scene content, `fps`, the encoder and the bitrate.
- A rough estimate per episode is the average bitrate of each encoded video stream × the duration, plus the Parquet and metadata. Camera count, resolution, `fps` and `episode_time_s` all scale it up.
- Before a large collection run, record 2–3 representative episodes, run the integrity check, then measure the real size and extrapolate to the number of episodes you plan:

```bash
du -sh ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
df -h ~/.cache/huggingface/lerobot          # free space on the target disk
```

## Cleanup and maintenance

When disk gets tight, first confirm the data passed `lerobot-check-dataset` and has been backed up or uploaded. To keep a way back, move the dataset into a separate quarantine directory first and only delete it through the file manager once you are sure:

```bash
mkdir -p /data/lerobot-trash
realpath ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
du -sh ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
mv -- ~/.cache/huggingface/lerobot/<your_org>/<old_dataset> /data/lerobot-trash/
```

!!! warning "Check the `realpath` output before moving"
    It must be the single dataset directory you meant; never run a recursive delete against the cache root.

Keep an eye on the target disk with `df -h` so a collection run does not fill it mid-session (see [Troubleshooting](troubleshooting.md)).

## Collection record

For traceability, keep one line of record per dataset. The gripper and tactile serial numbers are already written into `meta/hardware.json` at recording time; copying them into the record is only so they can be looked up offline, and if the two disagree, the one in the dataset wins. The tracker SN is not in the manifest, so that one has to be written down by hand.

| `repo_id` | Task description | Station number `--robot.id` | Gripper / tracker SN | Calibration date | Software version / commit | World-frame session | Integrity check | Episodes / episode length | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `Xense/pick_object_20260703` | `Pick up the object` | `0` (stored in the dataset as `bi_taccap_0`) | `TCGU01A24Z0001m` / `PC2310MLL...` | 2026-07-03 | The `xense-taccap-lerobot main@<SHA>` and `xense.taccap <version>` in use at the time | When XTac-UMI XR was started / which way the operator faced | `lerobot-check-dataset` passed; list of anomalous episodes | 50 / 15s | Lighting / scene / anomalous episodes |
