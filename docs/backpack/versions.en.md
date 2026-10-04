# Versions

This page gives the version baseline for the Backpack Kit's components, and the customer-facing highlights of the XTac-UMI Collector version it is written against. Go by the version numbers you read on your own devices: the collection unit and the gripper firmware are on the console's System → [Device info](system.md#device-info), the headset is in the Pico settings, and the tablet is in its system settings.

## Version baseline {#baseline}

Matched to XTac-UMI Collector 0.4.3. The software and hardware versions across the set have to match each other, so come back to this table after upgrading any one of them.

| Component | Baseline | Where to check / how to upgrade |
|---|---|---|
| Tablet OS (Xiaomi tablet) | 3.0.303 or above recommended | Tablet Settings → My device; follows the system update |
| Backpack OS firmware | V1.2.0 | Pre-installed at the factory, upgraded by technical support |
| XTac-UMI Collector (collection unit) | 0.4.3 | The console's System → [Device info](system.md#device-info), "collector version"; upgrading is in [Upgrades and OTA](update.md) |
| Pico OS | 5.15.5.U or above recommended | Headset Settings → General → About; upgrading is in [Pico4 headset and tracker setup](../common/pico4.md#pico-system) |
| XTac-UMI XR (headset app) | 0.3.2 | The headset's app library; installing and upgrading are in [Pico4 headset and tracker setup](../common/pico4.md#pico-app) |
| Leader gripper firmware | V1.2.2 | The console's System → [Device info](system.md#device-info), "gripper MCU"; upgrading is at System → [Gripper](system.md#gripper) |

Upgrading the Backpack Kit's collection unit is done entirely in the console, with no PC needed. The Developer Kit has its own baseline, see [Developer Kit · Versions and upgrades](../pc/versions.md#required).

## Version highlights {#history}

This page lists only the highlights of recent versions. **For earlier versions, go by what the device shows**: since 0.3.9, the first time you enter the console after an upgrade it displays that version's changes, so they are not repeated here version by version.

| Version | Date | Highlights |
|---|---|---|
| 0.4.3 | 2026-09-29 | The console is available in Chinese and English: it follows the browser language by default, can be switched temporarily on the System page, and shows English for any other language; the voice announcement language follows the interface language and can also be chosen separately. Recordings are made sure to be written to disk when they are finalised; after a power loss or system restart mid-recording, the failure reason distinguishes a power loss / system restart from a restart of the capture service, and a failed recording's data size reflects the files actually left on the device. The reason a recording failed is shown directly on both the desktop and phone interfaces; quality statistics now distinguish "No issues detected", "Collecting statistics", "Incomplete statistics" and "No statistics", and missing statistics are no longer treated as zero. Project and task storage no longer counts archived recordings, whose data size is shown separately; the disk reading in the top bar is now the percentage measured on the device, with used, total and free space on hover. This version ships as a console upgrade bundle and does not update the device's system components or the headset app |
| 0.4.2 | 2026-09-28 | Headset disconnect protection during recording: when the headset's USB link drops, its connection breaks, or its pose / images stop updating for about 3 seconds, the take is immediately marked failed and capture stops; the data so far is finalised safely and kept for diagnosis, does not count as a successful take, and is left out of normal export and upload. Recording does not resume automatically after the headset recovers — start a new recording; one incident raises only one notice. Voice announcements can be switched between Chinese and English (existing settings default to Chinese) and tell a Tracker dropout apart from a headset dropout; if the headset lacks the chosen language's audio, the onboard speaker plays it. The live monitor shows "Pico not ready" and "Tracker not ready" separately, with the specific reason. Replay no longer draws an extra difference overlay on the tactile images; existing recordings and exports are unchanged. Pages respond more smoothly on desktop and tablet when a task holds many recordings. This version ships as a console upgrade bundle and does not change the MCAP or LeRobot data formats |
| 0.4.1 | 2026-09-22 | After you select a project or the headset reconnects, the headset's mono / stereo setting, resolution and image source are read and synchronised automatically; they are checked once more before recording starts, and recording is refused if no confirmation arrives, the check times out, or a reconnection happens in the meantime. A new project can choose the headset's raw fisheye frame or its undistorted view, and older projects that never chose keep what they had. Device configuration is not changed automatically during recording, and the existing frame-size, tracking and clock checks run as before. This version ships as a console upgrade bundle and does not rewrite the device's system partitions |

!!! warning "Not every page on this site has been synced to 0.4.3 yet"
    The baseline has moved to 0.4.3, but the pages are being synced one at a time. **A page that has not been synced states the version it is written against in its footer**, and the steps on those pages may differ from what 0.4.3 actually shows — go by what you see on the device, and contact [support](../common/reference.md#support) if you are unsure.

The upgrade steps and rollback are in [Upgrades and OTA](update.md); if an upgrade goes wrong, contact [support](../common/reference.md#support).
