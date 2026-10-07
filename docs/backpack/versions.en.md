# Versions

This page gives the version baseline for the Backpack Kit's components, and the customer-facing highlights of the XTac-UMI Collector version it is written against. Go by the version numbers you read on your own devices: the collection unit and the gripper firmware are on the console's System → [Device info](system.md#device-info), the headset is in the Pico settings, and the tablet is in its system settings.

## Version baseline {#baseline}

Matched to XTac-UMI Collector 0.4.3. The software and hardware versions across the set have to match each other, so come back to this table after upgrading any one of them.

| Component | Baseline | Where to check / how to upgrade |
|---|---|---|
| Tablet OS (REDMI Pad 2 SE) | 3.0.303 or above recommended | Tablet Settings → My device; follows the system update |
| Backpack OS firmware | V1.2.0 | Pre-installed at the factory, upgraded by technical support |
| XTac-UMI Collector (collection unit) | 0.4.3 | The console's System → [Device info](system.md#device-info), "collector version"; upgrading is in [Upgrades and OTA](update.md) |
| Pico OS | 5.15.5.U or above recommended | Headset Settings → General → About; upgrading is in [Pico4 headset and tracker setup](../common/pico4.md#pico-system) |
| XTac-UMI XR (headset app) | 0.3.2 | The headset's app library; installing and upgrading are in [Pico4 headset and tracker setup](../common/pico4.md#pico-app) |
| Leader gripper firmware | ≥ 1.2.5 | The console's System → [Device info](system.md#device-info), "gripper MCU"; upgrading is at System → [Gripper](system.md#gripper) |

Upgrading the Backpack Kit's collection unit is done entirely in the console, with no PC needed. The Developer Kit has its own baseline, see [Developer Kit · Versions and upgrades](../pc/versions.md#required).

## Version highlights {#history}

Only recent versions are listed here. For earlier versions, the device shows each version's changes the first time you enter the console after upgrading.

### 0.4.3 (2026-09-29) {#v043}

1. The console is available in Chinese and English, following the browser language by default and switchable on the System page; the voice announcement language follows the interface and can also be chosen separately.
2. Recordings are guaranteed to reach the disk when they finish; a recording that fails because of a power loss or restart states the specific cause.
3. The reason a recording failed is shown directly on desktop and phone.
4. Quality statistics distinguish "No issues detected", "Collecting statistics", "Incomplete statistics" and "No statistics"; missing statistics are no longer treated as zero.
5. Project and task storage no longer counts archived recordings, whose size is shown separately.
6. The top-bar disk reading is now a measured percentage, with used, total and free space on hover.

### 0.4.2 (2026-09-28) {#v042}

1. If the headset disconnects, or its pose / images stop updating for about 3 seconds while recording, the take is marked failed and stops; the data so far is kept for diagnosis, does not count as a successful take and is left out of export and upload. After the headset recovers, start a new recording.
2. Voice announcements can be in Chinese or English, and tell a Tracker dropout apart from a headset dropout.
3. The live monitor shows "Pico not ready" and "Tracker not ready" separately, with the reason.
4. Replay no longer draws a difference overlay on the tactile images; existing recordings and exports are unaffected.
5. Pages respond more smoothly when a task holds many recordings.
6. Data formats (MCAP, LeRobot) are unchanged.

### 0.4.1 (2026-09-22) {#v041}

1. After you select a project or the headset reconnects, the headset's mono / stereo setting, resolution and image source sync automatically; they are checked again before recording, and recording does not start without confirmation.
2. A new project can choose the headset's raw fisheye frame or its undistorted view.

The upgrade steps and rollback are in [Upgrades and OTA](update.md); if an upgrade goes wrong, contact [support](../common/reference.md#support).
