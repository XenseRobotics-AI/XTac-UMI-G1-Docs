# Upgrades and OTA

Before upgrading, identify the component to update. These three file types are not interchangeable:

| Component | File | Where to update |
|---|---|---|
| Collector application (collection software and console) | `.tar.zst` upgrade bundle | System → System update; see [Importing an upgrade bundle](#bundle) |
| Backpack system | `.img` system image | Contact technical support for guided flashing; see [System image](#system-image) |
| Gripper firmware | `.bin` firmware | System → Gripper configuration; see [Gripper firmware](#gripper-firmware) |

![System update page](../assets/backpack/update-en.webp)

## Upgrade order {#order}

A new Collector version may require newer gripper firmware. **Flash the gripper firmware first, then import the upgrade bundle**:

1. Look up the leader gripper firmware requirement in the [version baseline](versions.md#baseline) and check both grippers' firmware in [Device information](system.md#device-info).
2. If either is below it, flash it from the current console as in [Gripper firmware](#gripper-firmware); after both are done and the backpack has been power-cycled, check again.
3. Then [import the upgrade bundle](#bundle) as below.

For example, before moving to 0.4.7 both leader grippers must be on 1.2.7 or above. Flashing after upgrading the Collector also works, but recording is refused until the firmware is updated.

## Importing an upgrade bundle {#bundle}

An upgrade bundle is a `.tar.zst` file provided by technical support, with the version in its file name, such as `taccap-collector-v0.4.3-….tar.zst`. It updates the Collector application; it does not flash the backpack system image or contain gripper firmware or camera profiles. Application upgrades do not affect collected data.

1. Stop recording.
2. Click "Upload firmware package", select the `.tar.zst` file and click "Upload and verify".
3. Once verification passes, check the version number on the "Version pending application" card.
4. Click "Apply update and restart" and confirm. The service restarts in about one minute; the upgrade is complete when the page shows "Update applied". If it times out, refresh the page manually.
5. On [Device information](system.md#device-info), confirm that the version number and build time have been updated.

If verification fails, the device rejects the bundle, gives the reason under "Last error" and keeps running the current version. Common causes: a corrupt or incompletely transferred file, a version gap that is too large, or a version older than the current one.

## Backpack system image {#system-image}

The backpack system version paired with this release is **V1.2.3**, and its image includes **Collector 0.4.7**. The image is for full-device flashing of the XENSE-3588Q collection unit and includes boot and system partitions. When these system components need updating, importing a Collector upgrade bundle does not replace flashing the system image.

The system image is an `.img` file. Contact technical support for an image suitable for your device and flashing instructions. The console's "Upload firmware package" accepts only `.tar.zst`; **do not upload an `.img` there**. Collector and backpack system versions are managed separately; the Collector version alone does not confirm that the system has been updated.

Before flashing, download or upload the recordings and exported data you need to a location outside the device and verify those copies. Then confirm configuration backup and recovery arrangements with technical support. The application data-retention and automatic-fallback descriptions below do not apply to system image flashing.

## Rollback {#rollback}

Collector application upgrades retain the previous version and provide automatic fallback if the new version fails to start. This applies to application updates, not recovery of the backpack system image. If the console remains unreachable after an upgrade, follow [Upgrade troubleshooting](troubleshooting.md#update).

From 0.4.7 the upgrade bundle no longer offers manual rollback and the System update page has no "Rollback" card; to go back to an older version, contact [technical support](../common/reference.md#support). On 0.4.6 and earlier, the "Rollback" card can go back one version only, and a device never upgraded since leaving the factory has nothing to roll back to.

Collector application upgrades and application rollbacks do not affect recorded data, projects, upload configurations or network settings.

## Gripper firmware {#gripper-firmware}

Gripper firmware is not updated through upgrade bundles; flash it from "Gripper firmware update" at the bottom of System → [Gripper configuration](system.md#gripper), with no computer required. The firmware files and whether an upgrade is needed are covered in the Developer Kit's [firmware OTA upgrade](../pc/versions.md#ota).

1. Stop recording and make sure no gripper opening calibration is in progress.
2. Select the target gripper (left / right), select the `.bin` file, click "Upload and flash" and confirm.
3. When the page shows "Firmware flashed, the device is restarting", **power the backpack off and on again** (or replug that gripper's Type-C cable); otherwise the gripper may lose data.
4. Check the firmware version on [Device information](system.md#device-info); if the calibration card shows "Not calibrated", recalibrate on [Gripper configuration](system.md#gripper).

You can click "Abort" during flashing; if flashing fails, simply flash again. The gripper will not be damaged.

!!! danger "Select firmware by role, and do not cut power while flashing"
    The leader gripper (SN ending in `m`) uses `tc-gu-01-master-<version>.bin` (such as `tc-gu-01-master-1.2.7.bin`) and the follower (SN ending in `s`) uses `tc-gu-01-slave-<version>.bin`; the choice depends on role, not on left or right. Flashing the wrong firmware leaves the gripper unable to start and requires a factory repair; cutting power or unplugging during writing also corrupts the firmware.
