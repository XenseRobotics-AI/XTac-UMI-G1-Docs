# The Backpack

The **XTac-UMI Backpack** is the Backpack Kit's collection host, worn by the operator: the grippers and headset plug straight in, a tablet browser is the console, and collection, playback and export all happen on the backpack.

![The XTac-UMI Backpack's front panel](../assets/product/backpack-ports-front.webp){ width="720" }

[Quickstart](../backpack/index.md){ .md-button .md-button--primary }
[Compare the two kits](editions.md){ .md-button }

## What it is

No computer and no site network needed; it is ready to collect once it boots.

<div class="grid cards tc-cards3" markdown>

-   :material-record-circle-outline: __Records__

    ---

    Visuotactile, wrist fisheye, opening and IMU from both grippers, headset and tracker poses, optional headset views

-   :material-harddisk: __Stores__

    ---

    One MCAP raw recording per demonstration, organised by project and task

-   :material-export-variant: __Delivers__

    ---

    Export as a LeRobot dataset or MCAP; download, or publish to ModelScope in one click

</div>

## Connectors {#ports}

![Backpack connector locations](../assets/product/backpack-ports-drawing.webp){ width="900" }

| No. | Connector | Location | What it is for |
|---|---|---|---|
| ① | `DC IN` | Rear panel | 12 V power input: the supplied 12 V 3 A adapter, or the power bank through its power cable |
| ② | Ethernet | Rear panel | Wired networking, DHCP from the factory, static IP settable on the System page |
| ③ | TF | Rear panel | TF card slot, not used for day-to-day collection |
| ④ | `HDMI` | Rear panel | Video out, not used for day-to-day collection |
| ⑤ | Headphone | Rear panel | 3.5 mm headphone jack |
| ⑥ | `UMI-L` | Left side | Left leader gripper, Type-C locking cable, which also powers the gripper |
| ⑦ | `UMI-R` | Right side | Right leader gripper, Type-C locking cable, which also powers the gripper |
| ⑧ | `PICO` | Front panel | Pico4 Ultra headset, Type-C. Tick "USB Network" in XR and tap Connect; no address to type |
| ⑨ ⑩ | `HOST1` / `HOST2` | Front panel | USB host ports, for a tablet or other devices |

Which cables to use and in what order is in [Unboxing, cabling and power](../backpack/unbox-connect.md#order).

### Waist belt {#belt}

The waist belt holds the backpack and the power bank and keeps the cables out of the operator's way.

![Waist belt structure](../assets/product/backpack-belt-drawing.webp){ width="720" }

- Before putting it on, check that the backpack, the power bank and the belt are secure.
- Leave slack in the cables so turning, bending or raising an arm does not pull on a connector.
- Do not cover the vents of the backpack or the power bank.

## The body label {#label}

![The body label: SN, hotspot name, password, IP, device name](../assets/product/backpack-label.webp){ width="420" }

| Field | What it is for |
|---|---|
| SN | The device serial number; quote it when asking for service |
| WiFi / password | The backpack hotspot's name and password |
| IP / device name | Open in a browser once connected to reach the console |

Identify a unit by its SN and hotspot name, not by IP. How to connect is in [Network and console access](../backpack/network.md).

## The console

Open the backpack's address in a browser to reach the console; it has four pages:

| Page | What it does |
|---|---|
| Live monitor | Every view, pose and opening on one screen; pick a project and task, start / stop recording |
| Projects | Manage recordings: replay, delete, export, archive |
| Playback | Replay any recording online |
| System | Device info, gripper calibration and firmware, capture settings, uploads, network, updates, interface language |

=== "Live monitor"

    ![The live monitor page](../assets/backpack/monitor-live.webp)

=== "Projects"

    ![The projects page](../assets/backpack/project-list-live.webp)

Recording is mainly driven by the gripper buttons: long-press right to start, long-press left to stop, with no browser needed, plus LED and voice feedback; see [Gripper buttons, LEDs and voice](../backpack/gripper.md).

## Capture modes

The capture mode is **chosen when you create a project** and cannot be changed afterwards; create a new project to switch. Every mode needs the headset for poses.

| Mode | Cameras |
|---|---|
| Two grippers | 6 |
| Two grippers + headset stereo | 8 |
| Two grippers + headset right eye | 7 |
| One gripper | 3 |
| One gripper + headset | 5 |
| Headset only | 2 |

Only the three two-gripper modes can be exported today.

## Data and export

- **Raw recordings**: one MCAP file per demonstration, on the backpack's NVMe data disk.
- **Export per task**: LeRobotDataset v3 or MCAP, or both; data integrity is checked before export.
- **Getting it out**: download an archive, or upload to ModelScope, S3, FTP / FTPS or NFS.
- **Size**: a task of about 3 minutes exports to roughly 1.5 GB.

Details are in [Projects, export and publishing](../backpack/projects-export.md).

## Upgrading

- **Collection software**: import an update package in System → Updates; you can roll back to the previous version, see [Upgrades and OTA](../backpack/update.md).
- **Gripper firmware**: flash it in System → Gripper, see [Gripper firmware](../backpack/update.md#gripper-firmware).

Current component versions are in [Backpack Kit · Versions](../backpack/versions.md).

## Known limitations

- Playback and live preview cannot run at the same time.
- The backpack only joins 5 GHz WiFi; with 2.4 GHz only on site, use a cable or the backpack hotspot.
- Some phones and Windows cannot open the `.local` device name; use the IP address instead.
