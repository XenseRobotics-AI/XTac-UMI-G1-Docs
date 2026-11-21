# Versions and upgrades

Go by the version numbers you read on the device: the collection unit and the gripper firmware are on the console's System → [Device information](system.md#device-info), the headset is in the Pico settings, and the tablet is in its system settings.

## Version baseline {#baseline}

Matched to XTac UMI Collector 0.4.7. Come back to this table after upgrading any component.

| Component | Baseline | Where to check / how to upgrade |
|---|---|---|
| Tablet OS (REDMI Pad 2 SE) | 3.0.303 or above recommended | Tablet Settings → My device; follows the system update |
| Backpack OS firmware | V1.2.3 (paired with this release) | Pre-installed at the factory; contact technical support to confirm or upgrade it, see [System image](#system-image) |
| XTac UMI Collector (collection unit) | 0.4.7 | The console's System → [Device information](system.md#device-info), "Collector version"; upgrading is in [Importing an upgrade bundle](#bundle) |
| Pico OS | 5.15.5.U or above recommended | Headset Settings → General → About; upgrading is in [Pico4 headset and tracker setup](../common/pico4.md#pico-system) |
| XTac UMI XR (headset app) | 0.3.9 | The headset's app library; installing and upgrading are in [Pico4 headset and tracker setup](../common/pico4.md#pico-app) |
| Leader gripper firmware | ≥ 1.2.7 (recording is refused below this) | The console's System → [Device information](system.md#device-info), "Gripper MCU"; upgrading is at System → [Gripper configuration](system.md#gripper) |

Collector and backpack OS versions are managed separately; Collector showing 0.4.7 does not mean the backpack OS is on V1.2.3. The Developer Kit has its own baseline, see [Developer Kit · Versions and upgrades](../pc/versions.md#required).

## Upgrades {#upgrade}

These three file types are not interchangeable:

| Component | File | Where to update |
|---|---|---|
| Collector application (collection software and console) | `.tar.zst` upgrade bundle | System → System update; see [Importing an upgrade bundle](#bundle) |
| Backpack system | `.img` system image | Contact technical support for guided flashing; see [System image](#system-image) |
| Gripper firmware | `.bin` firmware | System → Gripper configuration; see [Gripper firmware](#gripper-firmware) |

![System update page](../assets/backpack/update-en.webp)

### Upgrade order {#order}

A new Collector version may require newer gripper firmware. **Flash the gripper firmware first, then import the upgrade bundle**:

1. Against the [version baseline](#baseline), check both grippers' firmware in [Device information](system.md#device-info).
2. If either is below it, flash it first as in [Gripper firmware](#gripper-firmware); after both are done and the backpack has been power-cycled, check again.
3. Then [import the upgrade bundle](#bundle).

For example, before moving to 0.4.7 both leader grippers must be on 1.2.7 or above. Flashing after upgrading the Collector also works, but recording is refused until the firmware is updated.

### Importing an upgrade bundle {#bundle}

An upgrade bundle is a `.tar.zst` file provided by technical support, with the version in its file name, such as `taccap-collector-v0.4.3-….tar.zst`. It updates only the Collector application; it contains no backpack system image, gripper firmware or camera parameter packages, and does not affect collected data, projects, upload configurations or network settings.

1. Stop recording.
2. Click "Upload firmware package", select the `.tar.zst` file and click "Upload and verify".
3. Once verification passes, check the version number on the "Version pending application" card.
4. Click "Apply update and restart" and confirm. The service restarts in about one minute; the upgrade is complete when the page shows "Update applied". If it times out, refresh the page manually.
5. On [Device information](system.md#device-info), confirm that the version number and build time have been updated.

If verification fails, the device rejects the bundle, gives the reason under "Last error" and keeps running the current version. Common causes: a corrupt or incompletely transferred file, a version gap that is too large, or a version older than the current one.

### Rollback {#rollback}

- Application upgrades retain the previous version and fall back automatically if the new version fails to start; if the console remains unreachable after an upgrade, see [Upgrade troubleshooting](troubleshooting.md#update).
- From 0.4.7 manual rollback is no longer offered and the System update page has no "Rollback" card; to go back to an older version, contact [technical support](../common/reference.md#support). On 0.4.6 and earlier, the "Rollback" card can go back one version only, and a device never upgraded since leaving the factory has nothing to roll back to.
- Automatic fallback applies to application updates only, not to recovery of the backpack system image.

### Backpack system image {#system-image}

The backpack system version paired with this release is **V1.2.3**, and its image includes **Collector 0.4.7**; it is for full-device flashing of the XENSE-3588Q collection unit (boot and system partitions included).

- The image is an `.img` file; get it from technical support and flash it under their guidance. The console's "Upload firmware package" accepts only `.tar.zst`; **do not upload an `.img` there**.
- Before flashing, download or upload the recordings and exported data you need to a location outside the device, verify those copies, and confirm configuration backup and recovery arrangements with technical support; the data retention and automatic fallback of application upgrades do not apply to system image flashing.

### Gripper firmware {#gripper-firmware}

Flash it from "Gripper firmware update" at the bottom of System → [Gripper configuration](system.md#gripper), with no computer required. The firmware files and whether an upgrade is needed are covered in the Developer Kit's [firmware OTA upgrade](../pc/versions.md#ota).

1. Stop recording and make sure no gripper opening calibration is in progress.
2. Select the target gripper (left / right), select the `.bin` file, click "Upload and flash" and confirm.
3. When the page shows "Firmware flashed, the device is restarting", **power the backpack off and on again** (or replug that gripper's Type-C cable); otherwise the gripper may lose data.
4. Check the firmware version on [Device information](system.md#device-info); if the calibration card shows "Not calibrated", recalibrate on [Gripper configuration](system.md#gripper).

You can click "Abort" during flashing; if flashing fails, simply flash again. The gripper will not be damaged.

!!! danger "Select firmware by role, and do not cut power while flashing"
    The leader gripper (SN ending in `m`) uses `tc-gu-01-master-<version>.bin` (such as `tc-gu-01-master-1.2.7.bin`) and the follower (SN ending in `s`) uses `tc-gu-01-slave-<version>.bin`; the choice depends on role, not on left or right. Flashing the wrong firmware leaves the gripper unable to start and requires a factory repair; cutting power or unplugging during writing also corrupts the firmware.

## Version highlights {#history}

Only recent versions are listed here; for earlier versions, the device shows each version's changes the first time you enter the console after upgrading.

### 0.4.7 (2026-11-05) {#v047}

Changes since 0.4.6:

1. **Upgrade the gripper firmware to 1.2.7 first**: 0.4.7 requires leader gripper firmware ≥ 1.2.7 and refuses to record below it. The upgrade bundle contains no gripper firmware, so **flash the firmware while still on 0.4.6, then import the 0.4.7 bundle**; see [Upgrade order](#order).
2. **A USB device dropping out stops the recording**: if a gripper, or a wrist fisheye or tactile camera used by the episode, disconnects, recording stops and is marked failed; start a new recording once the device is back. See [USB device disconnects while recording](monitor-record.md#usb-disconnect).
3. **Low camera frame rate warning**: the recording card shows "Low FPS" live; on stopping, an episode where any camera ran low for more than 5% of its duration is marked "data suspect". See [After stopping](monitor-record.md#record-stop).
4. **Voice prompts**: choose where they play (Pico / backpack); four new prompts: "Grippers swapped left and right", "Left gripper disconnected", "Right gripper disconnected" and "Gripper start position outside the valid range". See [Voice prompts](gripper.md#voice-cues).
5. **Starting position**: the pose view can show the range the hands must be in (the start box); out-of-range messages say which hand is off, in which direction and by how many centimetres. See [Starting pose check](monitor-record.md#initial-pose).
6. **Tracker battery**: the pose view shows the left and right tracker battery levels.
7. **Leftover data cleanup**: System → Device information can scan for and clean up leftover files on the device; see [Device information](system.md#device-info).
8. **Projects and tasks**: search by project or task name with highlighted matches; a project, or a task within a project, can no longer be created with a duplicate name. With the live preview off, camera cards show the frame rate as a large number.
9. **Export time alignment**: training data exports pick each camera's nearest frame independently and interpolate pose and gripper opening at the frame time. **After upgrading, existing exports show as needing re-export**; the raw recording format is unchanged.
10. **Manual rollback removed**: the upgrade bundle no longer offers "Roll back to previous version"; automatic fallback to the previous version when an upgrade fails is kept. See [Rollback](#rollback).
11. **Matching headset app**: XTac UMI XR moves to 0.3.9 (tracker battery is reported by the headset app).
12. **Raw MCAP download**: engineering mode provides a per-recording download of the raw MCAP retained on the device for technical support and data analysis, on both desktop and mobile. See [Downloading raw recordings](projects-export.md#raw-mcap).

### 0.4.6 (2026-10-27) {#v046}

Changes since 0.4.3:

1. **Starting-pose check**: in modes that record headset video, the device checks before every recording that both hands are in the starting range in front of and below the body, and refuses to record otherwise; the range follows the project's headset mount, see [Starting-pose check](monitor-record.md#initial-pose).
2. **Coordinate reset before every recording**: before each recording the device has the headset reset its world frame, and checks that the left and right trackers are not swapped.
3. **Two new project settings**: "Headset mount" (On head / Around neck, only for modes that record headset video) and "Export quality" (High quality / Standard / Compact), both fixed after creation, see [Picking a project and task](monitor-record.md#project-task).
4. **Exported poses are relative to the headset at the start of each episode**: the headset position at frame 0 of each recording is the origin and its heading is the X axis, with Z still up, see [Coordinate frames · Origin of exported data](../common/coordinates.md#episode-origin). Poses are now interpolated to each frame time and camera frame times are more accurate; the left-hand TCP uses the mirrored convention (`tcp_frame_convention = mirrored-v1`).
5. **Re-export after upgrading**: pose values change throughout, so datasets exported or uploaded before the upgrade show as needing re-export; do not mix old and new exports in one dataset. Raw recordings are unaffected.
6. **Export and upload**: download, upload, archive and delete all require ticking recordings first; before an upload starts, the device lists the files and waits for you to confirm; uploads show the speed and the estimated time left for the current group; Tencent Cloud COS is a new upload backend. Deleting a recording also cleans up its exported artifacts.
7. **Diagnostics package**: System → Device info downloads an encrypted diagnostics package (application logs, kernel log and version information) in one click; hand it to technical support with a fault report.
8. **Other**: the interface language selector moved to the System sidebar; the pose view shows a trail of about 1.5 seconds behind each end effector.
9. **Matching headset app**: XTac UMI XR moves to 0.3.6, which the coordinate reset before recording relies on; headset video streams at a steadier cadence.

### 0.4.1 – 0.4.3 (2026-09) {#v043}

- **0.4.3**: the console is available in Chinese and English; recordings are guaranteed to reach the disk when they finish, and a failure caused by a power loss or restart states the cause and is shown directly in the interface; quality statistics distinguish "No issues detected", "Collecting statistics", "Incomplete statistics" and "No statistics"; the size of archived recordings is shown separately; the top-bar disk reading is now a measured percentage.
- **0.4.2**: if the headset disconnects, or its pose / images stop updating for about 3 seconds while recording, the episode is marked failed and stops; voice announcements can be in Chinese or English, and tell a tracker dropout apart from a headset dropout; the Live monitoring page shows "Pico not ready" and "Tracker not ready" separately, with the reason; replay no longer draws a difference overlay on the tactile images.
- **0.4.1**: after you select a project or the headset reconnects, the headset's mono / stereo setting, resolution and image source sync automatically and are checked again before recording; a new project can choose the headset's raw fisheye frame or its undistorted view.
