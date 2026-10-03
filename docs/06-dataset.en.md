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
`robot_type`, `data_path`, `video_path`. `robot_type` is the `--robot.type` used for recording
(`taccap_gripper` / `bi_taccap_gripper` / `xtac_umi_g1`); right after it, `collection_stack` is
always `"xense-taccap-lerobot"`, marking the data as recorded directly by this collection program.

!!! note "Datasets recorded before 0.0.8: the image `std` statistic is 0"
    In datasets recorded before 0.0.8, the `std` of image and video features in `meta/stats.json`
    is always 0 (`mean`, `min`, `max` and the quantiles are unaffected). If training normalises
    images by `std`, recompute the statistics first.

!!! info "What the XTac-UMI G1 adds: `meta/hardware.json`"
    A standard LeRobotDataset records only `robot_type` in `info`, which cannot say **which
    physical rig** produced the data. So recording writes an extra hardware manifest:

    **`meta/hardware.json` — who recorded it.** The station number `robot_id`, each gripper's
    **firmware SN**, and the SNs of the two tactile sensors on it (each carrying the observation
    key it corresponds to). It is an **`epochs` array**: swap a gripper or a sensor part-way
    through a dataset and the open epoch is closed at the current episode count while a new one
    starts, so every episode still points at the devices that actually produced it.

    Each unit also carries `wrist_undistort` — whether that arm's wrist frames were
    **rectified**, and from whose intrinsics. A rectified `wrist_cam` has exactly the
    same shape as a raw fisheye one, so without this the two cannot be told apart; see
    [5.7 Wrist fisheye undistortion](05-data-collection.md#57).

    Rebuilding depth / force / difference from the recorded `rectify` stream needs only the sensor
    model and the first `rectify` frame of each episode, which the dataset already holds. A
    `meta/runtimes/` in a dataset recorded on an earlier version is ignored.

    It is a **separate file** and do not touch the upstream `info` structure, so no tool that
    reads this dataset as a standard one is affected. Field meanings, resume behaviour and what to
    watch out for when reconstructing →
    [`--robot.id` and the hardware manifest](05-data-collection.md#robot-id).

    New datasets produced by `lerobot-edit-dataset` (deleting episodes, splitting, removing
    features, the 8 → 6 camera conversion) carry `hardware.json` along. **Merging (`merge`) is refused**:
    no single manifest could match every merged episode to the sensors that recorded it.

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

The checks cover whether `meta/` is complete, whether episode counts agree, whether parquet row
counts and indices are contiguous, NaNs, whether each video exists with a frame count **exactly**
matching what is declared, and the **camera format**: a bimanual dataset is classified as 6-camera (four tactile +
two wrist) or 8-camera (plus the two headset eyes), which train with different input shapes. The
last line sums it up:

```text
Summary: 0 error(s), 0 warning(s) | Camera format: 6-camera (no headset)
```

A single-gripper dataset, or one recorded without the wrist cameras or with only one headset eye,
shows `not recognized` with a warning; the check targets the standard bimanual layouts and does not
affect the other checks.

A video frame-count mismatch is graded by direction:

| Case | Result | Meaning |
|---|---|---|
| **Fewer** than declared | error (`... frames but episodes declare ... (N missing ...)`) | Episodes reference frames the video does not have; decoding runs past the end of the stream |
| **More** than declared | warning (`... more than the ... episodes declare -- unreferenced leftover frames`) | Leftover frames no episode refers to (e.g. after deleting episodes); every declared frame is still there, so the data is usable |

### Bimanual 8 cameras → 6 cameras {#8to6}

A bimanual dataset recorded with the [headset camera](05-data-collection.md#56) on is in the
8-camera format. To reduce it to the 6-camera format (the same shape as one recorded with
`bi_taccap_gripper`, and the type recorded in the dataset becomes `bi_taccap_gripper` too), use `lerobot-edit-dataset`:

```bash
lerobot-edit-dataset \
    --repo_id <your_org>/<dataset_8cam> \
    --new_repo_id <your_org>/<dataset_6cam> \
    --operation.type convert_8_to_6_cameras
```

It drops the two headset image keys and the `head_camera.*` dimensions of `action` /
`observation.state`, **leaves the source dataset untouched**, and writes the result to
`--new_repo_id`. A source that is already 6-camera, or whose camera keys are not as expected, is
refused outright.

!!! warning "Double-check `--repo_id` first"
    If the dataset is not found locally, this conversion fetches it from the Hugging Face Hub;
    `--local_files_only` has no effect on it. Make sure `--repo_id` is spelled correctly, or point
    `--root` straight at the local dataset directory.

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

- Pushing also generates a dataset card (README) and first writes an `assets/` folder into the local
  dataset directory with the card's three images (about 12 MB in total), uploaded along with the
  data — even with `--no-videos`.
- `--dataset-path` reads locally only: a wrong path fails with
  `Cannot find dataset metadata in local directory` rather than downloading from the Hub.

!!! tip "Log in to the Hub first"
    Before uploading, make sure you have run `hf auth login` (older versions also accept
    `huggingface-cli login`) or set `HF_TOKEN` — otherwise the push fails on authentication.

Next → [7. FAQ & Reference](07-faq-reference.md)
