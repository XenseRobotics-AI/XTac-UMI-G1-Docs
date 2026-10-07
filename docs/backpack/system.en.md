# System settings

Open "System" from the console's top bar; the items are listed down the left. A first deployment needs gripper calibration, upload configuration and the network; the rest can be left alone day to day.

| Item | Purpose | When you need it |
|---|---|---|
| [Device info](#device-info) | Versions, serial numbers, headset, gripper and camera status | Repairs, checking after an upgrade |
| [Gripper](#gripper) | Gripper travel calibration, firmware upgrade | First deployment, after changing a gripper |
| [Capture settings](#capture-settings) | Project capture config, recording shortcut, voice announcements | Checking the config, adjusting voice |
| [Upload configuration](#upload) | Remote upload accounts | Before uploading data |
| [Network](#wifi) | Hotspot switch, site WiFi, wired IP | Changing venue, giving several people access |
| [Camera profiles](#camera-profiles) | Import or restore camera parameters | Technical support has sent a new pack |
| [System update](#update) | Upgrade and rollback | When there is a new version |

The interface language is also switched here; by default it follows the browser.

!!! warning "Stop recording first"
    While recording, switching project, gripper calibration, gripper firmware upgrades, camera profile imports and system updates are all refused with "Recording in progress". Stop the recording on the Live monitor page first.

## Device info {#device-info}

![Device info page](../assets/backpack/device-info.webp)

A read-only page; "Refresh" at the top right reloads it.

- **Collector**: software version, build time, device SN (matches the body label).
- **Headset**: online status, headset serial number, XUMI software version, resolution and camera parameters.
- **Grippers**: SN and firmware version of each gripper.
- **Cameras**: the camera list, with offline ones marked "(offline)".

When to look here:

- Repairs, identifying a unit: note the device SN and headset serial number, not the IP (it changes).
- After an upgrade: check that the version and build time changed.
- Wrong camera count on the monitor page: see which feed is "(offline)".
- Before calibrating: confirm the leader gripper firmware is ≥ 1.2.0.

## Gripper {#gripper}

![Gripper page](../assets/backpack/gripper.webp)

Travel calibration normalises the gripper opening to 0–1: write the zero when closed and the maximum travel when fully open. The values are stored in the gripper, survive power loss and moving to another backpack, so each gripper needs calibrating once; the console and the Developer Kit calibration script write the same values. When recalibration is needed is covered in the Developer Kit's [Gripper calibration](../pc/calibration.md#41).

One gripper at a time, without skipping steps:

1. Confirm the gripper is online; if it shows "unsupported", check it is a leader gripper with firmware ≥ 1.2.0.
2. Close the gripper fully and hold it, click "Confirm fully closed" to write the zero.
3. Open the gripper to its mechanical limit and hold it, click "Confirm fully open" to write the maximum travel.
4. When "Travel calibration complete" appears, repeat for the other gripper.

!!! danger "Writing overwrites, and both grippers must be finished"
    Written values cannot be undone. A zero without a travel leaves the opening unusable; calibrating only one gripper puts left and right on different scales, with nothing in the data to show it.

"Gripper firmware upgrade" is further down the same page; see [Gripper firmware](update.md#gripper-firmware).

## Capture settings {#capture-settings}

### Current project capture config {#capture-mode}

![Current project capture config](../assets/backpack/capture-mode.webp)

Shows the current project's capture config, read-only. These are chosen when you [create the project](monitor-record.md#project-task) and cannot be changed afterwards.

| Mode | Grippers | Headset | Camera feeds |
|---|---|---|---|
| Dual gripper | 2 grippers | No headset | 6 |
| Dual gripper + stereo headset | 2 grippers | PICO stereo pair | 8 |
| Dual gripper + right mono headset | 2 grippers | PICO right eye | 7 |

The other four:

- **PICO resolution**: `640x480` or `1024x768` per eye, headset modes only.
- **PICO image source**: raw fisheye or undistorted.
- **Wrist fisheye rectification**: see [below](#undistort).
- **Tactile rectified-image export orientation**: "current orientation · 700 × 400 (landscape)" or "rotated 90° counter-clockwise · 400 × 700 (aligned with the SDK)".

When a project is selected, the headset syncs to its settings automatically.

!!! warning "Picked wrong? Create a new project"
    The config freezes at creation. An empty project with nothing recorded can simply be deleted and recreated.

### Wrist fisheye rectification {#undistort}

With it on, the wrist view in the exported dataset is rectified to a straight-line perspective. Recordings always keep the raw fisheye image; rectification happens only at export.

Each gripper shows its rectification status. "Not calibrated · rectified with default intrinsics" means the lens model's generic parameters are used: capture and export work normally, slightly less precisely than per-unit calibration.

### Recording shortcut {#keybinding}

With a keyboard on the tablet, you can bind a key to start / stop recording: click "Bind shortcut" and press the key; "Clear" removes it.

- The shortcut is stored in the current browser; a different tablet needs binding again.
- It works only while the console page is open, and typing in an input box does not trigger it.

On site, recording with the [gripper buttons](gripper.md#buttons) is preferred, as it does not depend on the browser.

### Voice announcements {#voice}

Prompts play from the headset, or from the backpack's speaker when the headset is not connected. What is announced and when is in [Voice prompts](gripper.md#voice-cues).

Three things can be adjusted here:

- **Switch**: mute with one click.
- **Volume**: 0–100.
- **Language**: Chinese or English, following the interface language by default.

Each line has a "Preview" button that tells you where the sound came out.

## Upload configuration {#upload}

![Upload configuration page](../assets/backpack/upload.webp)

Save remote upload accounts here; you can keep several, each with its own name. Bind one when creating a project and uploads no longer ask for the account.

| Kind | Formats | Fields |
|---|---|---|
| ModelScope | LeRobot, MCAP | Owner, Token, visibility for new repositories |
| S3 object storage | LeRobot, MCAP | Bucket, Endpoint, Region, Access Key, Secret Key |
| FTP / FTPS | LeRobot, MCAP | Server, port, username, password, target directory |
| NFS network storage | LeRobot, MCAP | Server, export path, protocol version |
| STS | MCAP only | Server, Account, Project, Project Type |

Uploads go to **`<root>/ project name / mode prefix-task name-date /`**; the device adds the prefix and date (except for STS).

- **ModelScope**: create a token at [ModelScope](https://www.modelscope.cn/my/overview) under avatar → Account settings → Access tokens; private repositories are recommended.
- **S3**: create the bucket beforehand.
- **FTP / FTPS**: FTPS is recommended; create the target directory beforehand and write it starting with `/`.
- **NFS**: create the target directory beforehand; the protocol version defaults to "Auto".

To set one up:

1. "New configuration": fill in the name, choose the kind, fill in the fields and save.
2. Click "Verify" or "Check read/write" to confirm the account and directory work.
3. Select it under "Upload backend" when creating a project; for an existing project, bind it on the project's row.

Credentials are not shown again after saving; leaving a field blank when editing keeps the stored value. Uploading is covered in [Export and upload](projects-export.md#export).

!!! warning "Binding the wrong account cannot be undone"
    Data uploaded to someone else's account is hard to take back, and public publishing is irreversible. Check which configuration a project is bound to when you create it.

## Network {#wifi}

![Network page](../assets/backpack/wifi.webp)

The ways to open the console are in [Network and console access](network.md); this section only covers changing settings.

| Block | Contents |
|---|---|
| Local hotspot | Hotspot switch, name and password |
| Wireless address | Device name (`.local`); give each backpack a different name |
| Current WiFi | Joined network, IP, "Disconnect and forget" |
| Nearby WiFi | Scan for and join a site network |
| Wired connection | Automatic (DHCP) or static IP |

### Joining site WiFi {#wifi-site}

Set this up when the site has 5 GHz WiFi and several computers or tablets need to reach the backpack.

1. Open the console from the tablet (USB) or the [backpack hotspot](network.md#softap) and go to System → Network.
2. "Rescan", click the target network, enter the password and connect.
3. The backpack remembers the network and reconnects after a reboot.

Only 5 GHz networks are listed (2.4 GHz would disrupt the backpack hotspot). If the site has only 2.4 GHz, use wired or the hotspot.

### Wired IP {#wifi-wired}

Defaults to automatic (DHCP) and works as soon as it is plugged into a router. Change it only for a direct cable to a computer, or when IT requires a fixed address:

1. Set the mode to "Static IP".
2. Enter the IP with its prefix, e.g. `192.168.1.10/24`; leave gateway and DNS blank for a direct cable.
3. "Apply wired configuration".

!!! warning "Changing the wired IP can drop the current page"
    If you are connected over wired, reopen the console at the new address after applying. If it goes wrong, get in via the tablet or the hotspot and switch back to "Automatic (DHCP)".

## Camera profiles {#camera-profiles}

![Camera profiles page](../assets/backpack/camera-profiles.webp)

A camera profile pack (`.xpack`) is built in at the factory; import one only when technical support provides a new pack.

1. Pick the `.xpack` file, click "Upload and apply" and confirm.
2. "Applied" means done; offline cameras pick it up when they come online.
3. If the image looks wrong or you want the factory set back: "Restore defaults".

If an import fails, the device keeps its previous parameters.

## System update {#update}

Upgrade and rollback are covered in [Upgrades and OTA](update.md).
