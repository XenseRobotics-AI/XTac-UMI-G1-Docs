# Technical specifications

Specifications for the XTac-UMI G1 grippers, the tracking system and the backpack. Wiring is in [Gripper connection and serial numbers](../common/gripper.md); choosing between the kits is in [Editions](editions.md).

## Leader gripper {#specs}

| Parameter | Specification |
|---|---|
| Structure | Two-finger gripper, one left and one right |
| Dimensions | 145 × 186 × 170 mm |
| Weight | About 370 g |
| Payload | 2.5 kg maximum |
| Opening travel | 0–150 mm (each unit's calibrated value applies) |
| Visuotactile sensors | 2 (one per finger), see [Visuotactile sensor](#sensor) below |
| Wrist fisheye camera | 190° field of view, 640 × 480 @ 30 fps |
| IMU | 9-axis, 100 Hz |
| Opening encoder | 100 Hz |
| Connector and power | USB Type-C (locking), DC 5 V / 500 mA bus power, no internal battery |
| Operating temperature | 0–50 °C |

### Visuotactile sensor {#sensor}

The fingertip sensor is Xense's GS-PS visuotactile sensor; see the [product page](https://www.xenserobotics.com/product/367/detail/23).

| Parameter | Specification |
|---|---|
| Imaging | Tri-colour illumination |
| Sensing area | 623 mm² |
| Elastomer thickness | 2–5 mm |
| Image resolution | 640 × 480 |
| Sampling rate | 120 fps (the sensor supports 30–150 Hz) |
| Range | 0–25 N |
| Force accuracy | 0.2 N |
| Deformation accuracy | 0.1 mm |
| Modalities | 3D shape, 6-axis force, 3D force distribution, slip detection |

The frame rate used during collection can be set as needed (the Developer Kit records tactile at 30 fps by default) without changing the sensors' own specification.

## Follower gripper {#follower}

| Parameter | Specification |
|---|---|
| Structure | Two-finger gripper, mounted on the robot's end effector |
| Motor | RobStride EL05 or RS00 |
| Maximum output torque | 1.1 N·m (EL05) / 3.6 N·m (RS00) |
| Opening angle | 0–70° |
| Control | Impedance control (default), force-position control |
| Connector and power | USB Type-C for communication + 24 V power adapter (24 V 2.5 A) |
| Operating temperature | 0–50 °C |

How to use it is in [Follower gripper](../follower/index.md).

## Tracking and synchronisation

| Parameter | Specification |
|---|---|
| Pose source | Pico4 Ultra Enterprise headset + motion trackers, 6-DoF |
| Pose rate | About 90 Hz on the Developer Kit; every pose the headset reports is recorded on the Backpack Kit |
| Positioning accuracy | < 3 mm |
| Multi-device time sync | 5 ms |
| Coordinate frame | X forward, Y left, Z up, see [Coordinate frames](../common/coordinates.md) |

## The backpack

The Backpack Kit's collection unit: the grippers and headset plug into it and the console opens in a browser. See [The Backpack](backpack.md).

| Parameter | Specification |
|---|---|
| Processor | RK3588 |
| Storage | eMMC system disk + 1 TB NVMe data disk; recordings and exports live on the data disk |
| Recording capacity | About 200 GB per 400 hours of data; the data disk counts as full at 80% and recording stops |
| Power | 12 V 3 A power adapter, or a 20000 mAh power bank through a 12 V PD power cable |
| Power draw | Up to 36 W (12 V 3 A) |
| Power-bank runtime | About 3.5–4 hours |
| Network | Ethernet; WiFi (5 GHz); built-in 5 GHz hotspot |
| Ports | `UMI-L` / `UMI-R` for the leader grippers, `PICO` for the headset, `DC` for power, plus Ethernet, SD slot, `HDMI` and headphone jack, see [Ports](backpack.md#ports) |
| Operating temperature | 0–40 °C |
| Environment | Indoor use; not waterproof, keep away from rain, splashes and heavy dust |

The serial number, hotspot name and password on the body label are explained in [Identify the unit by its label](../backpack/network.md#label).
