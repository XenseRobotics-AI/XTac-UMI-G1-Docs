# Glossary and support

Terms, feedback channels, related repositories and the version matching table shared by both editions. The Developer Kit's `RobotConfig` options are in [RobotConfig options](../pc/recording.md#robotconfig).

## Glossary {#glossary}

| Term | Meaning |
|---|---|
| **XTac UMI G1** | The wearable UMI data-collection gripper, the sensor carrier shared by both editions; see [XTac UMI G1](../product/g1.md) |
| **Backpack** | The Backpack Kit's collection unit (formally the XTac UMI Backpack): an RK3588 compute node that the grippers and the headset plug into and that runs XTac UMI Collector; see [The XTac UMI Backpack](../backpack/index.md) |
| **XTac UMI Collector** | The collection software on the backpack: it takes in the cameras, the gripper MCUs and the headset pose, and handles recording, replay, export and device management; current release 0.5.0, the device's System page is authoritative |
| **Console** | Collector's browser UI (live monitor, projects, system pages), opened from a tablet, phone or PC connected to the backpack |
| **Project / task / episode** | How the Backpack Kit organizes data: tasks under a project, each task carrying a LeRobot language instruction, and each start-to-stop recording being one episode |
| **MCAP** | The raw recording format for each Backpack Kit episode. It stores camera data, encoder data, gripper IMU readings, poses, and events by topic. LeRobot exports are converted from it |
| **OTA bundle** | The Backpack Kit's Collector upgrade package (`.tar.zst`), uploaded, verified, applied and rebooted into on the console's System → System update page, falling back to the previous version automatically if the upgrade fails. Gripper firmware OTA on the Developer Kit is in [Firmware OTA upgrade](../pc/versions.md#ota) |
| **SoftAP** | The backpack's own always-on Wi-Fi hotspot, SSID `xense-<last 6 of the serial>`, 5GHz only, gateway fixed at `192.168.44.1`; the fallback entry point that does not depend on any site network |
| **TacCap** | The name inside the package `xense.taccap`, the robot type `taccap_gripper` and the backpack's body label (Tactile Capture); the product name is XTac UMI G1 |
| **UMI** | Universal Manipulation Interface, the handheld leader-gripper data-collection paradigm |
| **Leader / Follower** | Leader gripper / follower gripper; the serial number's patch letter `m` = leader, `s` = follower |
| **V2.1** (firmware) | The firmware's **command set** version, i.e. which commands it implements. Not the build number (that is leader `≥ 1.2.0` / follower `≥ 1.1.0`, and higher builds support it too), and not the frame format (which is V1.8). The travel-calibration command arrived in V2.1 → [Three numbering schemes: V2.1 is a command set, not a firmware version](../pc/versions.md#v21) |
| **Odd is left, even is right** | The last digit of the 4-digit serial number: odd → left, even → right; grippers, sensors and trackers all follow it, see [Serial numbers and side identification](gripper.md#sn) |
| **GSPS** | Visuotactile sensor (one on each finger), serial number `GSPS01...` |
| **XC** | The wrist UVC camera, serial number `XC...` |
| **XTac UMI XR** | The VR client app on the Pico4U headset (formerly XenseVR-Toolkit); it sends the headset and tracker poses to the collection unit and establishes the world frame at launch; see [Pico4 headset and tracker setup](pico4.md) |
| **XenseVR PC Service / runtime** | The service on the collection unit that receives the headset pose, XTac UMI XR's counterpart (the service name did not change with the app): on the Developer Kit a daemon on the collection PC that you start by hand; on the Backpack Kit built into Collector |
| **tcp** | Tool Center Point, the end-effector pose (`tcp.x/y/z` + the 6D rotation `r1..r6`); the frame is in [Coordinate frames](coordinates.md) |
| **6D rotation** | The **first two columns** of the rotation matrix R (world ← body): `r1..r3` = first column = the body X axis expressed in the world frame, `r4..r6` = second column = the Y axis. The third column is their cross product and can be recovered → [the convention in detail](../pc/recording.md#53) |
| **shifted-frame** | Shifted-frame pairing: the observation at t-1 goes with the action at t |
| **self-driven** | The device itself produces both the observation and the demonstrated action; there is no separate teleoperation end |

## Support and feedback {#support}

- Check troubleshooting first: [Developer Kit](../pc/troubleshooting.md) (it includes the FAQ), [Backpack Kit](../backpack/troubleshooting.md).
- Problems with the documentation's content, links or examples: file them in the [docs repository Issues](https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs/issues).
- Hardware, firmware, missing items or repairs: contact our after-sales team with the device SN.

Please include:

- The complete error text, plus the matching log:
    - Developer Kit: attach the complete log file for that run, `~/xenselogs/session_<timestamp>.log` (the whole file, not just the last few lines on screen); see [Troubleshooting](../pc/troubleshooting.md#logs).
    - Backpack Kit: open System → [Device information](../backpack/system.md#device-info), click "Export diagnostics" and attach the completed encrypted ZIP download, along with the approximate time of the error. If the console is unreachable or the download fails, send error screenshots first and explain the situation. Screenshots of the top-bar "System logs" panel can supplement the package.
- Device identity: on the Backpack Kit, copy the device SN, the Collector version and each gripper's SN / firmware version from the console's System → Device info page; on the Developer Kit, the side / role / firmware_sn output from `scan_grippers` and the output of the command in [How to check versions](../pc/versions.md#check-versions).
- For backpack system upgrade or startup issues, include the backpack OS version or the name of the last image flashed, if known. State if it is unknown; the Collector version does not identify the OS version.
- Steps to reproduce, the full command or console actions, single or bimanual, and whether the tracker was enabled.
- For recording issues, include the project / task / episode number. If technical support requests the raw data, provide the corresponding file using [Downloading raw recordings](../backpack/projects-export.md#raw-mcap).
- For anything involving cameras or hardware assembly, photos of the device connections and of what looks wrong.

## References {#references}

The repositories below belong to the Developer Kit (apart from the gripper models) and are all open source except `xensesdk`, whose license is not stated; the Backpack Kit's collection software is not open source and is not listed.

| Resource | URL | Notes |
|---|---|---|
| Data-collection main repo `xense-taccap-lerobot` | <https://github.com/XenseRobotics-AI/xense-taccap-lerobot> | The Developer Kit's collection software; ships the device notes and the CHANGELOG |
| Gripper SDK `TacCap-Gripper` | <https://github.com/XenseRobotics-AI/TacCap-Gripper> | Submodule `third_party/taccap-gripper/`; SDK docs in `docs/` |
| Tracker PC service `XenseVR-PC-Service` | <https://github.com/XenseRobotics-AI/XenseVR-PC-Service> | Not a submodule; installed as a `.deb` into `/opt/apps/roboticsservice`, see [One-shot install](../pc/install.md#24) |
| Visuotactile sensor SDK `xensesdk` | <https://github.com/XenseRobotics/xensesdk> | [Docs site](https://docs.xenserobotics.com/) |
| Gripper models `XTac-UMI-Description` | <https://github.com/XenseRobotics-AI/XTac-UMI-Description> | URDF, Xacro, MJCF and USD models of the leader (left / right) and follower grippers, including the follower flange adapter; for ROS 2 and plain Python |
| Local viewer `xense-lerobot-viewer` | <https://github.com/XenseRobotics-AI/xense-lerobot-viewer> | Open source; browse a local LeRobot dataset in the browser |

## Documentation version and matching software {#doc-version}

The page footer shows the documentation version, which is independent of software and firmware versions. The table records the component versions at each documentation release. This update covers Collector 0.5.0, XTac UMI XR 0.4.6, TacCap SDK 0.5.0, leader and follower firmware 1.3.1, `xense-taccap-lerobot` 0.1.6, and `lerobot-xense` 0.5.1. Before upgrading, check the [Backpack Kit compatibility requirements](../backpack/versions.md#baseline) or [Developer Kit requirements](../pc/versions.md#required).

| Docs version | xense-taccap-lerobot (Developer Kit collection) | XTac UMI XR (headset app) | XTac UMI Collector (Backpack Kit collection unit) | TacCap-Gripper SDK (gripper SDK) |
|---|---|---|---|---|
| v0.1.4 | v0.1.6 | 0.4.6 | 0.5.0 | 0.5.0 |
| v0.1.3 | v0.1.6 | 0.3.9 | 0.4.7 | 0.4.6 |
| v0.1.2 | v0.1.5 | 0.3.6 | 0.4.6 | 0.4.5 |
| v0.1.1 | v0.1.1 | 0.3.3 | 0.4.3 | 0.4.3 |
| v0.1.0 | v0.1.0 | 0.3.2 | 0.4.3 | 0.4.1 |

The gripper firmware ships with the SDK (SDK 0.5.0 ships leader and follower 1.3.1) and is not listed separately. How to upgrade each component is in [Developer Kit · Versions and upgrades](../pc/versions.md) and [Backpack Kit · Versions](../backpack/versions.md).

## What this manual covers {#scope}

This manual covers the path from the data-collection gripper hardware to data on disk: XHE MCAP recordings and V1 Training MCAP or LeRobot exports on the Backpack Kit, a `LeRobotDataset` on the Developer Kit. Model training, inference and deployment are out of scope; see the separate documentation of those projects.
