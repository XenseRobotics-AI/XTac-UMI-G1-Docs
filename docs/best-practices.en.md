# Collection Standards & Best Practices

Getting `lerobot-record` to run is only the first step; what decides the downstream value is
**collecting *good* data**. This chapter is about keeping the recorded `LeRobotDataset` clean,
consistent and usable. Read it through before you start collecting, and check yourself against it
while you do.

!!! tip "The whole thing in one sentence"
    Every episode is one **complete, steady demonstration with real signal on the sensors**, and
    the whole dataset shares **one coordinate origin**.

## What makes an episode good

| Dimension | Good ✅ | Bad ❌ |
|---|---|---|
| Completeness | Approach → grasp → manipulate → finish; the task closes | Interrupted by a shaky hand, never finished |
| Steadiness | Smooth, even motion by hand | Abrupt stops and turns, violent IMU/pose jitter |
| Tactile signal | The sensors **genuinely contact** the object and deform | Empty grasp, no contact, no signal in the tactile image |
| Camera visibility | Target within the wrist camera's view and unobstructed | Hand or cable blocking it, or overexposure/flicker |
| Coordinate consistency | **Same origin** as every other episode in this dataset | XTac-UMI XR restarted mid-collection, origin drifted |
| Gripper reading | `gripper.pos` ≈ 0 closed, sensible when open | Not calibrated, closed does not read 0 |

## Before collecting

- **Align and freeze the coordinate frame**: **face straight at the robot when you start
  XTac-UMI XR while wearing the Pico4 Ultra Enterprise Edition** — this freezes the world-frame
  orientation (X forward / Y left / Z up). The origin and orientation are frozen at that instant,
  and **the client must never be restarted for the lifetime of the dataset** — a restart changes
  the reference frame. If you have no choice but to restart, treat everything after it as a
  **new dataset**.
- **Confirm the calibration took**: in preview, fully open should read `gripper.pos` = **1.0** and
  fully closed **0.0**. An uncalibrated leader cannot connect at all, so being able to preview
  already proves it was calibrated; this step is about double-checking the mechanical travel
  itself. Each leader is calibrated once (the values live in flash), and on a bimanual rig
  **both sides** need it. See [4.1 Gripper calibration](04-calibration.md#41).
- **Self-check the devices**: `scan_grippers` reports sensible side/role/firmware_sn; the tracker
  has charge and is producing a pose.
- **Turn WiFi off** (when using the wired link): wired network sharing conflicts with the
  computer's WiFi, so **turn the collection machine's WiFi off while collecting** (see
  [3.4 Network](03-host-hardware.md#pico-network)).
- **Prepare the scene**: stable lighting, the target clearly visible; clear away cables and clutter
  that would block the wrist camera.
- **Leave disk headroom**: at full load the stream can reach ~280 MB/s (bimanual), so make sure
  both free space and write bandwidth are sufficient.

!!! note "Make it a habit: check yourself in Rerun before every recording"
    **Before** each recording run the [preview](05-data-collection.md#preview) once
    (`--display_data=true`) and look at the gripper trajectory, `gripper.pos` and the tactile
    images to confirm all of them carry signal. That is how you catch an empty grasp, drift or
    dropped frames immediately. Then close it — **record with `--display_data=false`** and leave
    the frame budget to collection and encoding.

## How to perform the demonstration

- **Complete**: each demonstration covers the whole task and ends naturally. Do not abandon one
  halfway.
- **Smooth and even**: guide the gripper steadily; avoid abrupt stops, sharp turns and swinging —
  all of them leave noise in the IMU and the pose.
- **Real contact**: during the grasp, make sure the visuotactile sensors touch the object and
  produce a deformation signal. Tactile is this device's core modality, and a demonstration with
  an empty grasp is worth very little.
- **Consistent rhythm**: keep the pace of the motion similar across demonstrations of the same
  task, which makes it easier to learn from.

!!! warning "Do not put the key action in frame 0"
    Recording uses shifted-frame pairing, so **each episode loses its first frame** (it has no
    predecessor to pair with). Stay still for 0.5–1 s after recording starts before moving into
    the key action, and give `--dataset.episode_time_s` enough room, so that nothing important
    lands in the frame that gets dropped.

## Episodes and resets

- Between episodes the reset is **passive**: reposition the object and the scene, no teleoperation
  needed.
- Each episode is **one complete demonstration**; do not pack several attempts into one.
- Give `--dataset.episode_time_s` enough room but not too much — an over-long episode produces a
  lot of dead tail frames that slow down and dilute the dataset.

## Diversity vs consistency

A good dataset is **consistent in task semantics and moderately diverse in everything irrelevant**:

- **Keep consistent**: the task definition (the `--dataset.single_task` description), the intent
  of the motion, and the coordinate origin.
- **Vary moderately**: the object's initial pose and position, the grasp point, small changes in
  lighting — these help downstream generalisation.
- Do not mix **different tasks** into one dataset. Different tasks, or clearly different variants,
  belong in **different datasets**.

## Task definition and dataset organisation

- **Use a stable, clear English sentence for `single_task`** (e.g. `'Pick up the object'`) and keep
  it identical within a dataset — it is written into the dataset's `tasks`.
- **One dataset per task/variant**; naming `repo_id` as `<org>/<task>_<date>` makes datasets easier
  to find and manage.
- Keep a **device record** for the session (which gripper and tracker, when they were calibrated)
  so you can trace back later.

## Incremental collection: small batch, verify, then scale

Do not record several hundred episodes in one go and only then discover a systematic problem. The
recommended rhythm:

1. Record **5–10 episodes**.
2. Verify with `lerobot-check-dataset --repo-id <...>` (see [Dataset & Examples](06-dataset.md#62)).
3. Review/visualise a few of them and confirm the motion, tactile and pose all look right.
4. Only once there is no systematic problem, **scale up**.

## Common bad samples and how to avoid them

| Bad sample | Symptom | How to avoid it |
|---|---|---|
| Coordinate drift | Pose jumps between episodes | Never restart XTac-UMI XR during collection |
| Empty grasp | No signal in the tactile image | Ensure real contact when grasping; watch the tactile view in Rerun |
| Occlusion | Wrist camera cannot see the target | Clear the obstruction, adjust how you hold the gripper |
| Jitter | Noisy IMU/pose | Guide it smoothly and evenly |
| Dropped frames | Dropped-frame warnings in the log | Raise `encoder_threads`, use `vcodec=auto` ([5.4](05-data-collection.md#54)) |
| Zero drift | `gripper.pos` ≠ 0 when fully closed | Confirm the jaw is fully closed, then re-zero if needed ([4.1](04-calibration.md#41)) |
| Key action lost in frame 0 | The start of the motion looks wrong | Hold still for 0.5–1 s after recording starts |

If you hit an error, start with [Troubleshooting](troubleshooting.md).

## Pre-flight checklist

- [ ] XTac-UMI XR was **never restarted** during this collection session (consistent origin)
- [ ] Encoder zero is valid (`gripper.pos` ≈ 0 when closed)
- [ ] The tracker produces a pose and the Rerun trajectory looks right
- [ ] The collection machine's WiFi is off (only the Pico4 Ultra Enterprise Edition wired sharing)
- [ ] The tactile images carry signal when grasping (not an empty grasp)
- [ ] The target is unobstructed within the wrist camera's view
- [ ] No dropped-frame warnings
- [ ] The `single_task` description matches the rest of this dataset
- [ ] Enough free disk space
