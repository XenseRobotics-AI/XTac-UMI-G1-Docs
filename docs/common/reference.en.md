# Glossary and support

A lookup appendix shared by both editions: terms, feedback channels and related repositories. The Developer Kit's `RobotConfig` options and SDK entry point are in [RobotConfig and SDK](../pc/reference.md); for errors see the Developer Kit's [Troubleshooting](../pc/troubleshooting.md) or the Backpack Kit's [Troubleshooting](../backpack/troubleshooting.md).

## Glossary {#glossary}

| Term | Meaning |
|---|---|
| **XTac-UMI G1** | The handheld UMI data-collection gripper, the sensor carrier shared by both editions; see [XTac-UMI G1](../product/g1.md) |
| **Backpack** | The Backpack Kit's collection end: an RK3588 compute node that the grippers and the headset plug into and that runs XTac-UMI Collector; formally the XTac-UMI Backpack, see [The Backpack](../product/backpack.md) |
| **XTac-UMI Collector** | The collection software on the backpack: it takes in the cameras, the gripper MCUs and the headset pose, and handles recording, replay, export and device management; version baseline 0.3.9, the device's System page is authoritative |
| **Console** | Collector's browser UI, opened from a tablet, phone or PC connected to the backpack; the live monitor, projects and system pages all live there |
| **Project / task / episode** | How the Backpack Kit organises data: tasks under a project, each task carrying a LeRobot language instruction, and each start-to-stop recording being one episode |
| **MCAP** | The raw recording format of each Backpack Kit episode, storing cameras, encoders, IMU, poses and events by topic; the LeRobot export is converted from it |
| **OTA bundle** | The Backpack Kit's Collector upgrade package (`.tar.zst`), uploaded, verified, applied and rebooted into on the console's System → System update page, with rollback to the previous version. Gripper firmware OTA on the Developer Kit is in [Firmware upgrade](../pc/versions.md#ota) |
| **SoftAP** | The backpack's own always-on WiFi hotspot, SSID `xense-<last 6 of the serial>`, 5 GHz only, gateway fixed at `192.168.44.1`; the fallback entry point that does not depend on any site network |
| **TacCap** | The name inside the package `xense.taccap`, the robot type `taccap_gripper` and the backpack's body label (Tactile Capture); the product name is XTac-UMI G1 |
| **UMI** | Universal Manipulation Interface, the handheld leader-gripper data-collection paradigm |
| **Leader / Follower** | Leader gripper / follower gripper; the serial number's patch letter `m` = leader, `s` = follower |
| **V2.1** (firmware) | The firmware's **command set** version, i.e. which commands it implements. Not the build number (that is leader `≥ 1.2.0` / follower `≥ 1.1.0`, and higher builds support it too), and not the frame format (which is V1.8). The travel-calibration command arrived in V2.1 → [Three numbering schemes](../pc/versions.md#v21) |
| **Odd is left, even is right** | The last digit of the 4-digit serial number: odd → left, even → right; grippers, sensors and trackers all follow it, see [Serial numbers and side identification](gripper.md#sn) |
| **GSPS** | Visuotactile sensor (one on each finger), serial number `GSPS01...` |
| **XC** | The wrist UVC camera, serial number `XC...` |
| **XTac-UMI XR** | The VR client app on the Pico4 headset (formerly XenseVR-Toolkit); it sends the headset and tracker poses to the collection side and establishes the world frame at launch; see [Pico4 headset and tracker setup](pico4.md) |
| **XenseVR PC Service / runtime** | The service that receives the headset pose, the collection-unit end of XTac-UMI XR (the service name did not change with the app): on the Developer Kit a daemon on the collection PC that you start by hand; on the Backpack Kit built into Collector |
| **tcp** | Tool Center Point, the end-effector pose (`tcp.x/y/z` + the 6D rotation `r1..r6`); the frame is in [Coordinate frames](coordinates.md) |
| **6D rotation** | The **first two columns** of the rotation matrix R (world ← body): `r1..r3` = first column = the body X axis expressed in the world frame, `r4..r6` = second column = the Y axis. The third column is their cross product and can be recovered → [the convention in detail](../pc/recording.md#53) |
| **shifted-frame** | Shifted-frame pairing: the observation at t-1 goes with the action at t |
| **self-driven** | The device itself produces both the observation and the demonstrated action; there is no separate teleoperation end |

## Support and feedback {#support}

If you hit a problem:

1. Check troubleshooting first: the Developer Kit's [Troubleshooting](../pc/troubleshooting.md) (it includes the FAQ), or the Backpack Kit's [Troubleshooting](../backpack/troubleshooting.md).
2. Problems with the documentation's content, links or examples go to the [docs repository Issues](https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs/issues).
3. Hardware, firmware, calibration materials or repair matters go through the device delivery / after-sales channel, with the device SN.

Please include:

- The complete error and the relevant logs, untruncated.
- Device identity: on the Backpack Kit, copy the device SN, the collector version and each gripper's SN / firmware version from the console's System → Device info page; on the Developer Kit, the side / role / firmware_sn output from `scan_grippers` and the output of the command in [How to check versions](../pc/versions.md#check-versions).
- Steps to reproduce, the full command or console actions, single or bimanual, and whether the tracker was enabled.
- For anything involving cameras or hardware assembly, photos of the device connections and of what looks wrong.

## References

| Resource | URL | Notes |
|---|---|---|
| Data-collection main repo `xense-taccap-lerobot` | <https://github.com/XenseRobotics-AI/xense-taccap-lerobot> | The Developer Kit's collection software; ships the device notes and the CHANGELOG |
| Gripper SDK `TacCap-Gripper` | <https://github.com/XenseRobotics-AI/TacCap-Gripper> | Submodule `third_party/taccap-gripper/`; SDK docs in `docs/` |
| Tracker PC service `XenseVR-PC-Service` | <https://github.com/XenseRobotics-AI/XenseVR-PC-Service> | Not a submodule; installed as a `.deb` into `/opt/apps/roboticsservice`, see [One-shot install](../pc/install.md#24) |
| Visuotactile sensor SDK `xensesdk` | <https://github.com/XenseRobotics/xensesdk> | [Docs site](https://xensedoc.readthedocs.io/en/latest/) |
| This manual's source | <https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs> | Issues: see the section above |

## What this manual covers

This manual covers the path from the data-collection gripper hardware to data on disk: MCAP recordings and the LeRobot export on the Backpack Kit, a `LeRobotDataset` on the Developer Kit. Model training, inference and deployment are out of scope; see the separate documentation of those projects.
