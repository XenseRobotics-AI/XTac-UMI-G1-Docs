# Quickstart (TL;DR)

From power-on to your first exported dataset. Before you start, make sure these two are done:

- The headset is updated, XTac-UMI XR is installed and both trackers are paired → [Pico4 headset and trackers](../common/pico4.md)
- The leader grippers are calibrated → console System → [Gripper](system.md#gripper)

## 1. Wiring and power {#power-on}

1. Plug the two leader grippers into the backpack's `UMI-L` / `UMI-R`.
2. Connect the headset to the backpack's `PICO` port with the Pico → Pack cable.
3. Power the backpack: the adapter at a fixed station, the power bank for mobile collection.

![Power-bank wiring: both leader grippers and the headset to the backpack, the power bank to the backpack's DC port](../assets/product/backpack-wiring-powerbank-diagram-en.webp)

## 2. Open the console {#console}

Cable the tablet to the backpack's `HOST1` or `HOST2` port and the backpack opens the console on it. If it does not, see [Troubleshooting](troubleshooting.md#tablet-adb).

## 3. Connect the headset {#headset}

**Facing the work area**, put on the headset, open XTac-UMI XR, leave "USB Network" unticked and "PC IP" empty (it connects to the backpack at `192.168.100.1` by default), then tap "Connect"; Status turns to Connected.

![XTac-UMI XR console: Connected](../assets/pico4/xr-console-connected-en.webp){ width="560" }

!!! warning "Do not restart the XR app during collection"
    Restarting resets the world origin, so poses within one dataset stop lining up.

## 4. Pick a project and task {#project}

At the bottom of the console's Live monitor page, pick a project and a task, or choose "New project…" / "New task…". Choose the [capture mode](monitor-record.md#project-task) when creating the project (for example "Dual gripper + headset stereo"); a task needs a natural-language instruction.

## 5. Check before recording {#checks}

![The live monitor page](../assets/backpack/monitor-live.webp)

- Every camera view shows an image and the fisheye views are sharp.
- The pose view follows your hands, with left and right not swapped.
- The opening follows the grippers as they open and close.

If the record button is unavailable, the page states why; see [Recording gates](monitor-record.md#record-gates).

## 6. Record with the gripper buttons {#record}

| Action | Button | Feedback |
|---|---|---|
| Start recording | Long-press right | LED breathes green |
| Stop recording | Long-press left | One white flash: saved |
| Delete the last take | Double-click left, then double-click again to confirm | Purple LED |

All gestures, LED patterns and voice prompts are in [Gripper buttons, LEDs and voice](gripper.md).

## 7. Export and upload {#export}

On the console's Projects page, select a task and click Export:

1. Data integrity is checked first; fix anything it reports.
2. Pick where it goes: download an archive, or upload to a backend configured beforehand (ModelScope, S3, FTP, NFS).
3. Pick the format: LeRobotDataset v3 or MCAP.

Details are in [Projects, export and upload](projects-export.md).
