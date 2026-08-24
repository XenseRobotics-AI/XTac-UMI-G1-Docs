# 6. Dataset & Examples

This chapter is about what happens after recording: what the dataset looks like, how to check it,
how to review it, and how to push it to the Hub.

!!! abstract "New to lerobot? Read the official docs first"
    Our data lands in the standard **LeRobotDataset v3.0** format. If you have not worked with
    lerobot before, read the official documentation first and then come back here for what is
    specific to the XTac-UMI G1:

    - :material-book-open-variant: **LeRobotDataset v3.0 documentation**: <https://huggingface.co/docs/lerobot/lerobot-dataset-v3>
      (format design, directory layout, recording, loading/streaming, migrating v2.1→v3.0)
    - :material-book-open-variant: lerobot recording guide: <https://huggingface.co/docs/lerobot/il_robots#record-a-dataset>
    - :material-book-open-variant: lerobot documentation home: <https://huggingface.co/docs/lerobot>

    **The v3.0 essentials**: file-based storage (many episodes merged into large Parquet/MP4
    files), relational metadata to locate episode boundaries, and native streaming from the Hub.
    Compared with v2 it means far fewer small files and a faster startup.

## 6.1 The LeRobotDataset format at a glance {#61}

Collection produces a standard `LeRobotDataset`, by default under
`~/.cache/huggingface/lerobot/<repo_id>/`. It indexes like any Hugging Face / PyTorch dataset:

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # one frame: observation + action, all torch tensors
```

How it is serialised:

- `hf_dataset`: Hugging Face datasets → parquet
- Video (tactile + wrist camera): mp4, to save space
- Metadata: plain json / jsonl (`info` / `episodes` / `stats` / `tasks`)

!!! tip "Temporal queries with delta_timestamps"
    You can fetch several frames at once, positioned in time relative to the indexed one — e.g.
    `delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` returns the current frame plus
    the ones 1 s, 0.5 s and 0.2 s before it.

The metadata that matters in `info`: `fps`, `features`, `total_episodes`, `total_frames`,
`robot_type`, `data_path`, `video_path`.

!!! info "Two things the XTac-UMI G1 adds: `meta/hardware.json` and `meta/runtimes/`"
    A standard LeRobotDataset records only `robot_type` in `info`, which cannot say **which
    physical rig** produced the data — let alone what that sensor's calibration was at the time.
    So recording writes two extra things:

    **`meta/hardware.json` — who recorded it.** The station number `robot_id`, each gripper's
    **firmware SN**, and the SNs of the two tactile sensors on it (each carrying the observation
    key it corresponds to). It is an **`epochs` array**: swap a gripper or a sensor part-way
    through a dataset and the open epoch is closed at the current episode count while a new one
    starts, so every episode still points at the devices that actually produced it.

    Each unit also carries `wrist_undistort` — whether that arm's wrist frames were
    **rectified**, and from whose intrinsics. A rectified `wrist_cam` has exactly the
    same shape as a raw fisheye one, so without this the two cannot be told apart; see
    [5.7 Wrist fisheye undistortion](05-data-collection.md#57).

    **`meta/runtimes/` — what the calibration was at the time.** One runtime bundle per tactile
    sensor (`<SN>-<timestamp>.bin`, ~841 KB), with each sensor in `epochs` pointing at its own.
    Rebuilding depth / force / difference from the recorded `rectify` stream needs it.

    Both are **separate files** and do not touch the upstream `info` structure, so no tool that
    reads this dataset as a standard one is affected. Field meanings, resume behaviour and what to
    watch out for when reconstructing →
    [`--robot.id` and the hardware manifest](05-data-collection.md#robot-id).

## 6.2 Checking the data {#62}

Use `lerobot-check-dataset` to verify dataset integrity (frame counts, video, field consistency
and so on):

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

!!! note "The command is already in your environment"
    `lerobot-check-dataset` is installed along with the collection program and can be typed
    directly on both the Mamba and the Docker path — there is no script to go find in the repo.

## 6.3 Review and visualisation

- **Online dataset viewer**: once the dataset is on the Hugging Face Hub, the
  [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) browses
  each episode's video and data in the browser.
- **3D trajectory**: add `--display_data=true` during the
  [pre-recording preview](05-data-collection.md#preview) to see the gripper pose and its
  trajectory in Rerun (see [the `/world` 3D view](05-data-collection.md#world-view)).
- **Browsing the dataset**: open the parquet + mp4 frame by frame with lerobot's own dataset
  visualisation tooling (use whatever visualisation script your local `lerobot` provides).

## 6.4 Pushing to the Hugging Face Hub {#64}

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

!!! tip "Log in to the Hub first"
    Before uploading, make sure you have run `hf auth login` (older versions also accept
    `huggingface-cli login`) or set `HF_TOKEN` — otherwise the push fails on authentication.

Next → [7. FAQ & Reference](07-faq-reference.md)
