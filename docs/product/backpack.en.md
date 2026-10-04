# The Backpack

The **XTac-UMI Backpack** is the Backpack Kit's compute node: the grippers and the headset plug straight into it, the collection software XTac-UMI Collector runs on it, and what you open in a browser from a phone or tablet is its console. Collection, replay and the LeRobot export all happen on the device, with no PC needed. This page covers its connectors, label, console, capture modes, data and upgrade path, so that by the end you can judge whether it suits your collection scenario.

![The XTac-UMI Backpack's front panel](../assets/product/backpack-ports-front.webp){ width="720" }

[Quickstart](../backpack/index.md){ .md-button .md-button--primary }
[Compare the two configurations](editions.md){ .md-button }

## What it is

The backpack is an RK3588 compute node that ships with the kit (eMMC system disk + NVMe data disk). It receives, buffers and writes the collected data from the XTac-UMI G1 and the Pico system in one place, organised by project and task. It has the XenseVR runtime built in — the one that runs on a workstation in the Developer Kit — so the headset connects directly to it.

During collection it records all of this at once: each leader gripper's wrist fisheye, its two visuotactile feeds, the encoder's opening angle and the IMU; the 6-DoF pose of the headset and both trackers; and, optionally, the headset's views (stereo or right eye only). Camera frames are written as raw MJPEG, and every channel goes into the same MCAP recording, filed by project / task / time; the backpack's hardware H.264 encoding is used only for the live preview.

It is worn on the back: it moves with the operator and depends on neither the site network nor a PC, which suits continuous demonstration and multi-scene collection. Data is written locally and managed per task, replayed, deleted and exported in the console, and handed over as a LeRobot dataset for imitation learning and VLA training.

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

The label on the backpack's top cover carries every way into this device — identifying it, getting on its network and reporting it for repair all start here:

| Field | Meaning |
|---|---|
| `SN` | The device serial number, shown identically on System → Device info; copy it when reporting a repair |
| `WiFi` | The name of the backpack's always-on hotspot, `xense-<last 6 of the serial>` (taken from the hardware serial, which Device info shows), and also this device's name |
| Password | The hotspot's WPA2 password |
| `IP` | The hotspot gateway `192.168.44.1`; open it in a browser once joined to the hotspot and you are in the console |
| `http://xense-….local` | The mDNS device name, usable directly when you are on the same subnet as the backpack |

Identify a unit by its SN and hotspot name, not by an IP: the wired port's IP comes from DHCP, so it changes and differs from unit to unit. The serial number and password in the picture are only examples.

![The body label: SN, WiFi name, password, IP, mDNS device name](../assets/product/backpack-label.webp){ width="480" }

## The console

The console runs on the backpack, and any browser opening `http://192.168.44.1` (over the hotspot) or `http://xense-<last 6 of the serial>.local` reaches it, with no port number needed. Four tabs in the top bar:

- **Live monitor**: the two fisheye views, the headset stereo pair, the arms / head pose and the left and right opening angles, and the four visuotactile feeds all on one screen; pick the project / task at the bottom and start or stop recording.
- **Projects**: manage recorded data by project → task → recording — replay, delete, export (destination first, then format: download an archive or upload to a remote end) and archive.
- **Replay**: stream any recording online, with the same layout as the live monitor and a draggable progress bar.
- **System**: device info, gripper configuration (travel calibration and MCU firmware), capture settings (a read-only view of the current project's capture config, plus the recording shortcut, voice announcements, and the LED and device-button reference), upload configuration, network, camera profiles, system update; the fleet management page is reserved for multi-device management and needs no configuration at present. The System page can also switch the "Interface language" temporarily: the console follows the browser language by default, showing Chinese or English, and reloading the page returns it to following the browser.

![The live monitor page: fisheye, headset stereo, pose and opening angles, and tactile feeds on one screen](../assets/backpack/monitor-live.webp)

![The Projects page: project → task → recording](../assets/backpack/project-list-live.webp)

The right of the top bar permanently shows video bandwidth, camera count, CPU, memory, disk, monitoring / recording time and system status, and opens the system log. The gripper's physical buttons are handled by the device, so you can record with no browser online: long-press the right gripper to start and the left to stop, with the LED patterns in [Gripper buttons, LEDs and voice](../backpack/gripper.md#buttons-leds); the device also gives a [voice announcement](../backpack/gripper.md#voice-cues) when recording starts, when a take finishes and when something drops out — through the headset by default, with the backpack's speaker as fallback, in the interface language.

## Capture modes

The capture mode is a **property of the project**, chosen when the project is created and unchangeable afterwards, and it determines the live layout, what is recorded and what is exported. System → Capture settings only displays it, read-only. Six presets:

| Mode | Grippers | Headset | Camera feeds |
|---|---|---|---|
| Dual gripper | Left + right | — | 6 |
| Dual gripper + stereo headset | Left + right | Stereo | 8 |
| Dual gripper + headset right eye | Left + right | Right eye | 7 |
| Single gripper | One, with the side decided automatically by which gripper is connected | — | 3 |
| Single gripper + headset | One | Stereo | 5 |
| Headset only | — | Stereo | 2 |

"+ headset" only decides whether the headset's views are recorded; the 6-DoF pose always comes from the headset and the trackers, so every mode needs the headset connected. Because the mode follows the project, one task naturally keeps the same mode from start to finish; to use a different set of parameters, create a new project. Headset-only data cannot go into a bimanual LeRobot dataset.

## Data

The backpack uses MCAP as its raw recording: one `.mcap` file per episode, with camera frames and the encoder, IMU, pose and device events each on their own topic, in a layout aligned with Foxglove so it can be replayed directly in Foxglove Studio. The raw recordings stay on the device and are not downloaded individually.

Everything you hand out is an **offline export**, not produced during recording, and it is **per task**: click "Export" on a task on the Projects page and the device pre-checks first (complete channels, consistent capture mode), then transcodes and builds in the format you chose. The two formats are equals and not mutually exclusive: `LeRobot dataset` is LeRobotDataset v3, whose root is `meta/`, `data/` and `videos/`, with all video resampled to 30 fps and `meta/` carrying per-episode `taccap_extrinsics.json` and `xumi_collection_devices.json`; `mcap` comes from the same source with the same 30 Hz state / action, six video feeds and sensor data, only packaged one file per episode so it opens directly in a general-purpose visualiser. The same task can produce one now and the other later, and both outputs are kept.

The destination is one of two as well: "Download to device" packs it on the backpack and gives you a button to collect an archive — both formats are collected the same way and the filename says which it is; "Upload to remote" takes a pre-configured upload backend from a drop-down (ModelScope, S3 object storage, FTP / FTPS, NFS network storage, or STS, which accepts the mcap format only), with credentials entered once per entry at System → Upload configuration and bound as the default when a project is created. Local files are kept by default after an upload; to free space, tick the clean-up before uploading, or use "Archive" by hand at any point afterwards — archiving keeps only the record and removes the raw files, and the clean-up protects any format that has not been used yet.

Data lands on the NVMe data disk. Recording several video feeds at once is not small: a task of around 3 minutes exports to about 1.5 GB, so budget transfer and storage at that scale.

## Upgrading

The collection unit is upgraded as a whole firmware bundle (`.tar.zst`): upload and verify it at System → System update, check the version number and `sha256`, then "Apply update and restart"; the steps are in [Importing an upgrade bundle](../backpack/update.md#bundle). The device keeps the previous version, so "Roll back to previous version" is available if an update goes wrong (a device that has never successfully applied an update has nothing to roll back to), see [A/B slots and rollback](../backpack/update.md#rollback). Stop recording before applying one by hand; since 0.3.9 an update [pushed remotely](../backpack/update.md#remote) waits for the current take to finish before restarting, and the first time you open the console afterwards it shows that version's changes. The gripper MCU firmware is flashed separately at System → Gripper; do not cut the power or unplug anything while flashing, and once the gripper has restarted, power the backpack off and on again, see [Gripper firmware](../backpack/update.md#gripper-firmware).

## How it relates to the Developer Kit

Both configurations use the same XTac-UMI G1 leader grippers and Pico4 Ultra headset, so the gripper's buttons, LED patterns and serial-number rules and the headset's setup steps are common to both. The difference is the layer in between: the Developer Kit connects the grippers to a workstation over USB and `lerobot-record` writes a LeRobotDataset straight to disk; the Backpack Kit connects them to the backpack, uses MCAP as the raw recording, and LeRobot is only an export. The LeRobot datasets exported by both are v3 and the same tooling reads them, but the operating procedures are not interchangeable — do not read them as one. Which side to choose is in [Product line and configuration comparison](editions.md).

## Known limitations

- Replay and live preview share the backpack's hardware encoder, so the unit can only do one at a time; replay does not take over a preview already running, and when it is refused it says what is holding it.
- The backpack only joins 5 GHz WiFi: the System page's scan lists only 5 GHz networks, and a 2.4 GHz router is neither visible nor connectable; if the site has only 2.4 GHz, use a cable or stay on the backpack hotspot.
- On iOS Safari the device name needs the full `http://` prefix (`http://xense-xxxxxx.local`), or the name is treated as a search term; some Android models cannot open `.local` names, so use `http://192.168.44.1`. Windows mDNS resolution is unreliable, and the hotspot IP is likewise the fallback when the device name will not open.
- The System page's "Fleet management" is reserved for multi-device management and needs no configuration at present.

## Versions

| Part | Version |
|---|---|
| Collector (collection unit) | 0.4.3 |
| Backpack OS firmware | V1.2.0 |
| Leader gripper firmware | V1.2.2 |
| XTac-UMI XR (headset APK) | 0.3.2 |
| Pico OS | ≥ 5.15.5.U |
| Tablet OS (Xiaomi tablet) | ≥ 3.0.303 recommended |

This table is the baseline at the time of writing and the version numbers are only examples; what System → Device info shows is authoritative, and after an upgrade check there first that the collection unit's version really changed.
