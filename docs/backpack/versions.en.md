# Versions

This page gives the version baseline for the Backpack Kit's components, and the customer-facing highlights of the XTac-UMI Collector version it is written against. Go by the version numbers you read on your own devices: the collection unit and the gripper firmware are on the console's System → [Device info](system.md#device-info), the headset is in the Pico settings, and the tablet is in its system settings.

## Version baseline {#baseline}

Matched to XTac-UMI Collector 0.4.1. The software and hardware versions across the set have to match each other, so come back to this table after upgrading any one of them.

| Component | Baseline | Where to check / how to upgrade |
|---|---|---|
| Tablet OS (Xiaomi tablet) | 3.0.303 or above recommended | Tablet Settings → My device; follows the system update |
| Backpack OS firmware | V1.2.0 | Pre-installed at the factory, upgraded by technical support |
| XTac-UMI Collector (collection unit) | 0.4.1 | The console's System → [Device info](system.md#device-info), "collector version"; upgrading is in [Upgrades and OTA](update.md) |
| Pico OS | 5.15.5.U or above recommended | Headset Settings → General → About; upgrading is in [Pico4 headset and tracker setup](../common/pico4.md#pico-system) |
| XTac-UMI XR (headset app) | 0.2.5 | The headset's app library; installing and upgrading are in [Pico4 headset and tracker setup](../common/pico4.md#pico-app) |
| Leader gripper firmware | V1.2.2 | The console's System → [Device info](system.md#device-info), "gripper MCU"; upgrading is at System → [Gripper](system.md#gripper) |

Upgrading the Backpack Kit's collection unit is done entirely in the console, with no PC needed. The Developer Kit has its own baseline, see [Developer Kit · Versions and upgrades](../pc/versions.md#required).

## Version highlights {#history}

This page lists only the highlights of the version it is matched to. **For earlier versions, go by what the device shows**: since 0.3.9, the first time you enter the console after an upgrade it displays that version's changes, so they are not repeated here version by version.

| Version | Date | Highlights |
|---|---|---|
| 0.4.1 | 2026-09-22 | After you select a project or the headset reconnects, the headset's mono / stereo setting, resolution and image source are read and synchronised automatically; they are checked once more before recording starts, and recording is refused if no confirmation arrives, the check times out, or a reconnection happens in the meantime. A new project can choose the headset's raw fisheye frame or its undistorted view, and older projects that never chose keep what they had. Device configuration is not changed automatically during recording, and the existing frame-size, tracking and clock checks run as before. This version ships as a console upgrade bundle and does not rewrite the device's system partitions |

!!! warning "Not every page on this site has been synced to 0.4.1 yet"
    The baseline has moved to 0.4.1, but the pages are being synced one at a time. **A page that has not been synced states the version it is written against in its footer**, and the steps on those pages may differ from what 0.4.1 actually shows — go by what you see on the device, and contact [support](../common/reference.md#support) if you are unsure.

The upgrade steps and rollback are in [Upgrades and OTA](update.md); if an upgrade goes wrong, contact [support](../common/reference.md#support).
