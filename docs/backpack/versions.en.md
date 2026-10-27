# Versions

This page gives the version baseline for the Backpack Kit's components, and the customer-facing highlights of the XTac UMI Collector version it is written against. Go by the version numbers you read on your own devices: the collection unit and the gripper firmware are on the console's System → [Device information](system.md#device-info), the headset is in the Pico settings, and the tablet is in its system settings.

## Version baseline {#baseline}

Matched to XTac UMI Collector 0.4.6. The software and hardware versions across the set have to match each other, so come back to this table after upgrading any one of them.

| Component | Baseline | Where to check / how to upgrade |
|---|---|---|
| Tablet OS (REDMI Pad 2 SE) | 3.0.303 or above recommended | Tablet Settings → My device; follows the system update |
| Backpack OS firmware | V1.2.0 | Pre-installed at the factory, upgraded by technical support |
| XTac UMI Collector (collection unit) | 0.4.3 | The console's System → [Device information](system.md#device-info), "Collector version"; upgrading is in [Upgrades and OTA](update.md) |
| Pico OS | 5.15.5.U or above recommended | Headset Settings → General → About; upgrading is in [Pico4 headset and tracker setup](../common/pico4.md#pico-system) |
| XTac UMI XR (headset app) | 0.3.6 | The headset's app library; installing and upgrading are in [Pico4 headset and tracker setup](../common/pico4.md#pico-app) |
| Leader gripper firmware | ≥ 1.2.5 | The console's System → [Device information](system.md#device-info), "Gripper MCU"; upgrading is at System → [Gripper configuration](system.md#gripper) |

Upgrading the Backpack Kit's collection unit is done entirely in the console, with no PC needed. The Developer Kit has its own baseline, see [Developer Kit · Versions and upgrades](../pc/versions.md#required).

## Version highlights {#history}

Only recent versions are listed here. For earlier versions, the device shows each version's changes the first time you enter the console after upgrading.

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

### 0.4.3 (2026-09-29) {#v043}

1. The console is available in Chinese and English, following the browser language by default and switchable on the System page; the voice announcement language follows the interface and can also be chosen separately.
2. Recordings are guaranteed to reach the disk when they finish; a recording that fails because of a power loss or restart states the specific cause.
3. The reason a recording failed is shown directly on desktop and phone.
4. Quality statistics distinguish "No issues detected", "Collecting statistics", "Incomplete statistics" and "No statistics"; missing statistics are no longer treated as zero.
5. Project and task storage no longer counts archived recordings, whose size is shown separately.
6. The top-bar disk reading is now a measured percentage, with used, total and free space on hover.

### 0.4.2 (2026-09-28) {#v042}

1. If the headset disconnects, or its pose / images stop updating for about 3 seconds while recording, the episode is marked failed and stops; the data so far is kept for diagnosis, does not count as a successful episode and is left out of export and upload. After the headset recovers, start a new recording.
2. Voice announcements can be in Chinese or English, and tell a tracker dropout apart from a headset dropout.
3. The Live monitoring page shows "Pico not ready" and "Tracker not ready" separately, with the reason.
4. Replay no longer draws a difference overlay on the tactile images; existing recordings and exports are unaffected.
5. Pages respond more smoothly when a task holds many recordings.
6. Data formats (MCAP, LeRobot) are unchanged.

### 0.4.1 (2026-09-22) {#v041}

1. After you select a project or the headset reconnects, the headset's mono / stereo setting, resolution and image source sync automatically; they are checked again before recording, and recording does not start without confirmation.
2. A new project can choose the headset's raw fisheye frame or its undistorted view.

The upgrade steps and rollback are in [Upgrades and OTA](update.md); if an upgrade goes wrong, contact [support](../common/reference.md#support).
