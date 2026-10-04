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
| Visuotactile sensors | 2 (one per finger), tri-colour imaging, 0–25 N range, 640 × 480 @ 120 fps |
| Wrist fisheye camera | 190° field of view, 640 × 480 @ 30 fps |
| IMU | 9-axis, 100 Hz |
| Opening encoder | 100 Hz |
| Connector and power | USB Type-C (locking), DC 5 V / 500 mA bus power, no internal battery |

The frame rate used during collection can be set as needed (the Developer Kit records tactile at 30 fps by default) without changing the sensors' own specification.

## Follower gripper {#follower}

| Parameter | Specification |
|---|---|
| Structure | Two-finger gripper, mounted on the robot's end effector |
| Motor | RobStride EL05 |
| Continuous grip torque | 1.1 N·m (default grip-force limit) |
| Rated / peak torque | 1.8 N·m / 6.0 N·m |
| Maximum speed | 50 rad/s |
| Control | Impedance control (default), force-position control |
| Connector and power | USB Type-C for communication + 24 V power adapter (24 V 2.5 A) |

How to use it is in [Follower gripper](../follower/index.md).

## Tracking and synchronisation

| Parameter | Specification |
|---|---|
| Pose source | Pico4 Ultra Enterprise headset + motion trackers, 6-DoF |
| Positioning accuracy | < 3 mm |
| Multi-device time sync | 5 ms |
| Coordinate frame | X forward, Y left, Z up, see [Coordinate frames](../common/coordinates.md) |

## The backpack

The Backpack Kit's collection unit: the grippers and headset plug into it and the console opens in a browser. See [The Backpack](backpack.md).

| Parameter | Specification |
|---|---|
| Processor | RK3588 |
| Storage | eMMC system disk + NVMe data disk; recordings and exports live on the data disk |
| Power | 12 V 3 A power adapter, or a 20000 mAh power bank through a 12 V PD power cable |
| Network | Ethernet; WiFi (5 GHz); built-in 5 GHz hotspot |
| Ports | `UMI-L` / `UMI-R` for the leader grippers, `PICO` for the headset, `DC` for power, plus Ethernet, SD slot, `HDMI` and headphone jack, see [Ports](backpack.md#ports) |

The serial number, hotspot name and password on the body label are explained in [Identify the unit by its label](../backpack/network.md#label).
