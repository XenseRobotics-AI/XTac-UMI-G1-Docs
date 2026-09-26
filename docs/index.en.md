---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

# Handheld tactile capture<br>from unboxing to dataset

<p class="tc-sub">Record vision, touch and pose in sync<br>straight into a training-ready <code>LeRobotDataset</code></p>

<p class="tc-note">XTac-UMI&nbsp;G1 grippers with Pico4&nbsp;Ultra&nbsp;Enterprise<br>headset and trackers, built on lerobot</p>

[Quickstart](quickstart.md){ .md-button .md-button--primary }
[About the device](01-overview.md){ .md-button }

</div>

<div class="tc-stage" markdown>

<figure class="tc-tile tc-tile--leader" markdown>
![Leader gripper](assets/product/leader-front-open-cutout.webp)
<figcaption markdown>[Leader: hand-held capture](hardware.md)</figcaption>
</figure>

<figure class="tc-tile tc-tile--follower" markdown>
![Follower gripper](assets/product/follower-rear-ports.webp)
<figcaption markdown>[Follower: isomorphic end effector](follower-overview.md)</figcaption>
</figure>

</div>

</div>

!!! info "English coverage"
    The Home and Overview pages are available in English. Other navigation entries currently fall back to the Chinese source pages; command examples remain directly usable.

## The collection workflow

<div class="tc-flow" markdown>

<div class="tc-flow__group" markdown>

### One-time setup

<p class="tc-flow__lead">Once per computer and per device</p>

1. **Install the environment**<br>
   Run `setup_env.sh` for the Mamba path, or use the Docker image. [Installation](02-environment.md)
2. **Configure the host**<br>
   Serial permissions, and keep ModemManager off the gripper ports. [3.1](03-host-hardware.md#31), [3.2](03-host-hardware.md#32)
3. **Set up the Pico4 Ultra Enterprise**<br>
   Developer mode, install XTac-UMI XR, bind the trackers; skip on a factory-configured headset. [3.4](03-host-hardware.md#34)
4. **Calibrate the leader grippers**<br>
   Zero and travel span, once per leader; an uncalibrated leader is refused. [4.1](04-calibration.md#41)

</div>

<div class="tc-flow__group" markdown>

### Every session

<p class="tc-flow__lead">In this order, each time you collect</p>

1. **Power on and connect**<br>
   Plug in the grippers, wire the headset network with the PC's WiFi off, short-press the trackers. [3.6](03-host-hardware.md#36)
2. **Start the service and the XR app**<br>
   Start the XenseVR PC Service first, then open XTac-UMI XR facing the robot and tap Reconnect. [3.5](03-host-hardware.md#35), [Alignment](03-host-hardware.md#pico-frame)
3. **Preview**<br>
   `lerobot-teleoperate` opens Rerun; check that touch, cameras and pose all update. [Preview](05-data-collection.md#preview)
4. **Record**<br>
   `lerobot-record` records episode by episode; do not restart the XR app meanwhile. [5.2](05-data-collection.md#52)
5. **Check and upload**<br>
   `lerobot-check-dataset` verifies the data; `lerobot-push-dataset-to-hub` uploads when needed. [6.2](06-dataset.md#62), [6.4](06-dataset.md#64)

</div>

</div>

## Three steps

This is the **xense-taccap-lerobot data-collection quickstart**. Three parts: **get ready → record → understand the data**.

<div class="grid cards" markdown>

-   :material-check-decagram-outline: __① Getting Ready (prerequisites)__

    ---

    Know your hardware → connect & power it on → set up the software environment and host/device config.

    [Hardware](hardware.md), [Environment Setup](02-environment.md)

-   :material-record-circle-outline: __② Software Usage__

    ---

    Calibration → preview the streams with `lerobot-teleoperate` → record with `lerobot-record`. The core data-collection workflow.

    [Calibration](04-calibration.md), [Data Collection](05-data-collection.md)

-   :material-database-outline: __③ Data__

    ---

    What a `LeRobotDataset` looks like, what's recorded per frame, checking & upload.

    [Dataset & Examples](06-dataset.md)

</div>

## Related repositories

| Repo / package | Role |
|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | Data-collection repo (lerobot 0.5.1 customized branch, providing the `taccap_gripper` robot type) |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | Gripper SDK (repo `TacCap-Gripper`, submodule `third_party/taccap-gripper`): IMU, encoder, keys, protocol, and follower-only motor control |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Pico4 Ultra tracker PC service (installed as a `.deb`, **not a submodule**); from v0.2.0 it also carries the [headset camera](05-data-collection.md#56) frames |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | Visuotactile sensor SDK, provided by the install script ([docs](https://xensedoc.readthedocs.io/en/latest/)) |

!!! note "Versions this manual is written against"
    `xense.taccap 0.1.9`, and `xense-taccap-lerobot` customized from **lerobot 0.5.1**.
    Go by the device notes shipped with your own checkout of the main repo for commands and
    field names.
