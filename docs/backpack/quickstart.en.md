# Quickstart

This page takes you from powering on to your first exported dataset; follow the steps in order.

!!! note "Before you start"
    - **Headset and trackers**: the Pico system is updated, XTac-UMI XR is installed and both trackers are paired; see [Pico4 headset and trackers](../common/pico4.md).
    - **Gripper calibration**: the leader grippers are calibrated; see console → System → [Gripper](system.md#gripper).

## 1. Wiring and power {#power-on}

1. **Connect the leader grippers**: plug the two leader grippers into the backpack's `UMI-L` and `UMI-R` ports.
2. **Connect the headset**: connect the headset to the backpack's `PICO` port with the Pico → Pack cable.
3. **Power the backpack**:
    - Fixed station: use the power adapter.
    - Mobile collection: use the power bank.

![Power-bank wiring: both leader grippers and the headset to the backpack, the power bank to the backpack's DC port](../assets/product/backpack-wiring-powerbank-diagram-en.webp)

## 2. Open the console {#console}

1. **Connect the tablet**: cable the tablet to the backpack's `HOST1` or `HOST2` port.
2. **Wait for it to open**: once connected, the console opens on the tablet automatically.

If the console does not open, see [Troubleshooting](troubleshooting.md#tablet-adb).

## 3. Connect the headset {#headset}

1. **Put on the headset**, facing the work area.
2. **Start the app**: open XTac-UMI XR.
3. **Network settings**: **leave "USB Network" unticked** and "PC IP" empty (it connects to the backpack at `192.168.100.1` by default).
4. **Connect**: tap "Connect"; you are done when Status shows "Connected".

![XTac-UMI XR console: Connected](../assets/pico4/xr-console-connected-en.webp){ width="560" }

!!! warning "Do not restart the XR app during collection"
    Restarting resets the world origin, so poses within one dataset stop lining up.

## 4. Pick a project and task {#project}

1. **Pick or create**: at the bottom of the console's Live monitor page, pick a project and a task; if there are none yet, choose "New project…" or "New task…".
2. **Fill in the settings**:
    - **Capture mode**: chosen when creating the project, for example "Dual gripper + headset stereo"; see [capture mode](monitor-record.md#project-task).
    - **Task instruction**: give the new task a clear natural-language instruction.

## 5. Check before recording {#checks}

Before you hit record, confirm these three:

- **Camera views**: every camera shows an image and the fisheye views are sharp.
- **Pose view**: follows your hands in real time, with left and right not swapped.
- **Gripper opening**: follows the grippers as they open and close.

![The live monitor page](../assets/backpack/monitor-live.webp)

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

1. **Precheck**: data integrity is checked automatically; fix anything it reports.
2. **Destination**:
    - Download an archive to save locally.
    - Upload to a backend configured beforehand (ModelScope, S3, FTP, NFS).
3. **Format**: choose LeRobotDataset v3 or MCAP to suit your training pipeline.

Details are in [Projects, export and upload](projects-export.md).
