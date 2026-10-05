# Upgrades and OTA

This page covers upgrading the XTac-UMI Collector console (below, "the console") itself: importing an upgrade bundle on the System page and getting back to the previous version when an upgrade fails. By the end you can carry out an upgrade on your own and verify the result. Flashing gripper firmware has its own section at the end of the page.

Console upgrades are all done on the console's System → System update page, and that page is authoritative for the version (this page is written against 0.4.3). From top to bottom the page has a metrics card (current version, git, build time, architecture, and status: idle / ready / applying / error) and cards such as "Upload firmware package", "Version pending application" and "Rollback".

![System update page](../assets/backpack/update.webp)

## Importing an upgrade bundle {#bundle}

An upgrade bundle is a `.tar.zst` file supplied by technical support, named like `taccap-collector-v0.4.3-<12-character hash>-aarch64.tar.zst`: the version number comes first, then 12 characters of git hash, then the architecture. The bundle holds only the console program (front end and back end in a single binary) plus a `manifest.json` — no gripper firmware, no camera profiles and no collected data. Fixes that need the device's system components updated therefore do not ship with this console bundle, see [Updates a console bundle does not cover](#system-patch).

A version's identity is its **version number plus the 12-character git hash**: a higher version number upgrades; the same version number with a different hash also upgrades (a revision build of the same version); if both match, nothing happens. Check both when you verify a version.

1. Stop recording. The service restarts when an update is applied, and a recording in progress is refused outright.
2. "Upload firmware package" → pick the `.tar.zst` → "Upload and verify", with an upload progress bar. Once it passes you get "Uploaded and verified: &lt;version&gt;" and the status becomes "ready".
3. On the "Version pending application" card, check the version number, the git hash and the `sha256`.
4. "Apply update and restart" → confirm. The page shows "Service restarting, waiting to reconnect…", and once the new version is up you get "Update applied, service restarted". The front end waits at most 90 seconds; on timeout it says "Service restart timed out, refresh manually to confirm the status", and a refresh usually brings it back.
5. Go to [Device info](system.md#device-info) and check that the collector version / git / build time really did change.

The device runs three checks and refuses the bundle if any of them fails, writing the reason into "Last error": the `sha256` must reconcile with the bundle's `manifest.json` (a corrupt or incomplete transfer); the architecture must match the device (the backpack is `aarch64`); and the current version must not be below the minimum starting version the bundle declares (no jumping major versions and no downgrades). Uploading by itself changes nothing, and after a refusal the current version keeps running.

### Updates a console bundle does not cover {#system-patch}

A console upgrade bundle updates the console program itself. A few fixes change the device's system components instead; the System update page has no entry point for those, and only technical support can carry them out on the device.

The 0.4.x networking changes are partly of this kind: after upgrading, the new networking behaviour is only complete once the device's system components have been updated too. On a device that lacks them the upgrade still completes normally and **the network settings are left as they are** — the connection you are using will not be changed out from under you.

!!! warning "Not every update can be done from the System update page"
    A console upgrade bundle does not cover the device's system components. The fix in 0.3.19 for "the backpack's internet route is taken over by the Pico when it is plugged in" is one of these: after you upgrade the console program to 0.3.19 or later, that fix does not necessarily take effect at the same time, and earlier units may not have the corresponding system fix.

    One more thing to watch when upgrading to 0.4.x: the network settings migration runs **after the upgrade has passed its self-check**, so what you see right after the restart may still be the old settings and change a little later. If you cannot connect after an upgrade, work through [Network and console access](network.md) to find the address again.

    Whether a given device needs anything extra **is for technical support to tell you**. When technical support says it does, they handle it; there is nothing to do on site, and no way to do it there. The version shown in the console still refers only to the console program.

    Do **not** upload any other file technical support gives you into "Upload firmware package" — it accepts only `.tar.zst` console upgrade bundles, and anything else is refused by the verification step.

## A/B slots and rollback {#rollback}

When an update is applied, the device keeps the running program as the previous version, then atomically swaps in the new one and restarts. The new version has to actually listen, stay alive for 30 seconds and pass the local health check before the upgrade counts as committed. After a commit the previous version is still kept for a manual rollback; the next upgrade overwrites it, so you can only go back one step.

Automatic rollback happens in these cases, with no intervention:

- The new program does not come up, crashes early in start-up or fails its health check: after 3 consecutive failures it switches back to the previous version and restarts.
- At start-up the swapped-in file does not match the record (corrupt or the wrong bundle): it switches back immediately.
- Power loss mid-upgrade: the order is keep the old version first, then swap atomically, so at every moment there is a complete, runnable program on disk. After power returns, either the new version passes its self-check and commits, or it falls back under the rules above. It cannot be bricked. After power returns, open the System update page to see the current version and "Last operation / Last error", and re-import the bundle if you need to.

Manual rollback: when the "Rollback" card shows "Rollback available", click "Roll back to previous version" → confirm, and the service restarts on the old version. "Unavailable" means this device has never successfully applied an update (first install from the factory), so there is no previous version to fall back to. Rollback likewise requires that no recording is in progress.

Rollback and upgrade only swap the console program; recorded data, projects / tasks, upload configurations and the network configuration are stored elsewhere and are unaffected.

## Gripper firmware {#gripper-firmware}

The gripper's (XTac-UMI G1) MCU firmware does not go through the upgrade bundle above. On the Backpack Kit you flash it from the console directly: the "Gripper firmware upgrade" panel on the console's System → [Gripper](system.md#gripper) page, with no PC or SDK script needed. The firmware images, the rule for picking an image by role, the current released version (leader 1.2.2) and how to judge "do I need to flash?" are in [the Developer Kit's firmware OTA upgrade](../pc/versions.md#ota); both configurations flash the same image.

1. Stop recording, and make sure no travel calibration is running. Firmware upgrades take exclusive use of the serial port, and either one in progress will be refused.
2. "Gripper firmware upgrade" → pick the target gripper (left / right; the panel shows that gripper's SN, and the firmware only ever goes to the one you select — its role, leader or follower, is on the calibration card on the same page) → pick the `.bin` → "Upload and flash" → confirm.
3. Watch the upload progress and the flashing stages (starting → writing → verifying → applying → done); when it finishes you get "Firmware flashed, the device is restarting". You can "Abort" part-way: the new firmware is written to the spare partition and does not overwrite the running copy until it verifies, so aborting or a failed transfer cannot brick it — just start again.
4. Once the gripper has restarted, power the backpack off and on again (or unplug and replug that gripper's Type-C cable). The restart after flashing is a soft reset, so the gripper's USB-to-serial chip never loses power and it sits in a degraded state quietly dropping status frames; the reason is in [the Developer Kit's notes](../pc/versions.md#ota).
5. Check the firmware version under "Gripper MCU" on [Device info](system.md#device-info); after a leader gripper goes above 1.2.0, go back to [Gripper](system.md#gripper) and redo the zero and travel calibration.

!!! danger "Pick the image by role, and never cut power or unplug while flashing"
    The leader gripper (SN ending in `m`) takes `tc-gu-01-master.bin` and the follower (SN ending in `s`) takes `tc-gu-01-slave.bin` — by role, not by left or right. The console does not check that the image matches the role; flash the wrong role and the gripper will not start, and only the factory can recover it. Cutting power or unplugging during the writing and applying stages will corrupt the firmware.
