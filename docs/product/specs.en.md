# Technical specifications

This page is the specification table for the XTac-UMI G1 gripper and the backpack — look here when choosing a configuration, writing a proposal or checking a connector. The wiring steps are in [Gripper buttons, LEDs and serial numbers](../common/gripper.md#install), and the trade-off between the Backpack Kit and the Developer Kit is in [Product line and configuration comparison](editions.md).

## XTac-UMI G1 {#specs}

The electrical and connector requirements are in [Power and connection requirements](../common/gripper.md#install). The table below is the sensor and whole-unit specification; the actual rates during collection can be configured as needed (the Developer Kit, for example, records tactile data at a lower frame rate) without changing the sensor specification.

| Item | Specification |
|---|---|
| Gripper type / dimensions | Two-finger design; 145 × 186 × 170 mm |
| Weight (leader) / payload | About 370 g; 2.5 kg maximum |
| Opening travel / angle | 0–150 mm; the angular travel differs from unit to unit, and the measured value written to the firmware by calibration is authoritative (on the Backpack Kit you calibrate on the console's System → Gripper page; on the Developer Kit see [Gripper calibration](../pc/calibration.md#41)) |
| Power | The leader gripper has no internal battery and is bus-powered over USB Type-C (DC 5 V / 500 mA); the follower gripper is powered by a 24 V adapter |
| Multi-device time sync / positioning | 5 ms; < 3 mm |
| Visuotactile | 2 × tri-colour illumination, 0–25 N range, 120 FPS (640×480 MJPG) |
| IMU | 9-axis, 100 Hz |
| Wrist fisheye camera | 190° FOV; 640×480 @ 30 FPS MJPG |
| Pose | Pico4 Ultra motion tracker, 6-DoF; the frame definition is in [Coordinate frames](../common/coordinates.md) |
| Output data | RGB, multimodal tactile, gripper opening angle, IMU, spatial trajectory |

Internal communication: the external interface is USB Type-C; the internal MCU serial port is bridged by a CH343 (`1a86:55d2`) and enumerates as `/dev/ttyACM*`, USART3 @ 3 Mbps; the visuotactile sensors and the wrist camera are UVC (`/dev/video*`); the follower gripper passes through to a Lingzu motor over FDCAN1 @ 1 Mbps.

## The backpack

The backpack is the Backpack Kit's collection unit: the grippers and the headset plug into it, XTac-UMI Collector runs on it, and the console is opened in a browser. The product positioning and how it is used are in [The Backpack](backpack.md).

| Item | Specification |
|---|---|
| Compute node | RK3588 (Xense-3588Q) |
| Storage | eMMC system disk + NVMe data disk; episode records and exports both land on the data disk |
| Power input | The `DC` port, with the supplied 12 V 3 A 36 W adapter, or a power bank whose Type-C output is 12 V 3 A |
| Networking | Wired Ethernet (DHCP, can be set static); WiFi client, 5 GHz only; its own SoftAP hotspot `xense-<last 6 of the serial>`, likewise 5 GHz only, with the gateway fixed at `192.168.44.1` |
| Battery / runtime | To be added |
| Whole-unit power draw | To be added |
| Ingress protection rating | To be added |

### Connectors

What goes into `PICO` / `HEAD` / `USB` on the front panel, `UMI-L` / `UMI-R` on the sides, and `DC`, Ethernet, the SD card slot, `HDMI` and the headphone jack on the rear panel, together with photographs of the connectors, is in [The Backpack](backpack.md#ports).

### The body label

What the SN, hotspot name, password, hotspot IP and mDNS device name on the label are, and why you identify a unit by its label rather than remembering an IP, are in [Identify the unit by its label](../backpack/network.md#label); the serial numbers in this manual are only examples.
