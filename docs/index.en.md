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

### ① Getting ready

<p class="tc-flow__lead">Once per computer and per device</p>

1. **[Know the hardware](hardware.md)**<br>
   Parts, wiring and power-on order
2. **[Install the environment](02-environment.md)**<br>
   `setup_env.sh` or the Docker image
3. **[Configure the host](03-host-hardware.md#31)**<br>
   Serial access, ModemManager off
4. **[Set up the Pico4 Ultra Enterprise](03-host-hardware.md#34)**<br>
   Developer mode, XR app, trackers
5. **[Calibrate the leaders](04-calibration.md#41)**<br>
   Zero and travel span, once each

</div>

<div class="tc-flow__group" markdown>

### ② Collecting

<p class="tc-flow__lead">In this order, every session</p>

1. **[Power on and connect](03-host-hardware.md#36)**<br>
   Grippers in, trackers on, PC WiFi off
2. **[Start the service and XR app](03-host-hardware.md#35)**<br>
   PC Service, then the XR app
3. **[Preview check](05-data-collection.md#preview)**<br>
   `lerobot-teleoperate` in Rerun
4. **[Full recording](05-data-collection.md#52)**<br>
   `lerobot-record`, keep XR running

</div>

<div class="tc-flow__group" markdown>

### ③ The data

<p class="tc-flow__lead">After recording</p>

1. **[Check completeness](06-dataset.md#62)**<br>
   `lerobot-check-dataset`
2. **[Upload to the Hub (optional)](06-dataset.md#64)**<br>
   `lerobot-push-dataset-to-hub`
3. **[Understand the format](06-dataset.md#61)**<br>
   What each frame records

</div>

</div>

<p class="tc-flow__more" markdown>To mount the follower gripper on a robot and drive it from code, see [Follower gripper](follower-overview.md); to call the gripper SDK directly, see [Appendix: SDK](sdk-overview.md).</p>

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
