# Host setup

A gripper that shows up in the device list cannot necessarily be opened. This page covers three one-off settings, how devices are assigned to left and right by serial number, and starting the XenseVR PC Service.

## Required on first use {#first-use}

!!! danger "Skip any of these three host settings and the gripper may fail to connect"
    Before a new collection PC talks to a gripper for the first time (leader, follower or SDK-only use alike), run all three in one go:

    ```bash
    sudo apt purge -y brltty                     # 1. remove brltty
    sudo usermod -aG dialout,video "$USER"       # 2. join the dialout / video groups
    sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
    # XTac UMI G1 MCUs are CH343 USB-serial (1a86:55d2); keep ModemManager off them
    ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
    EOF
    sudo udevadm control --reload-rules && sudo udevadm trigger   # 3. keep ModemManager off
    ```

    Then **log out and back in** (dialout membership only applies to a new session), re-plug the gripper and verify each item as described in the sections below.

## Remove brltty {#brltty}

`brltty` is the braille display driver installed by default on Ubuntu. It claims `1a86` USB serial devices as braille displays, so the gripper's serial port cannot be opened; the udev rule does not stop it, so it has to be removed.

Verify: `dpkg -l brltty | grep ^ii` prints nothing. Re-plug the gripper afterwards.

## Serial permissions (dialout) {#31}

The gripper MCU enumerates as `/dev/ttyACM*`, owned by group `dialout`. Outside that group the SDK can list the gripper but cannot open the port, so `scan_grippers()` reports `role=Unknown` with an empty `firmware_sn`:

```text
RuntimeError: No leader gripper discovered for the left side.
# underneath: IoError: SerialBus: open(/dev/serial/by-id/...): Permission denied
```

!!! warning "Log out and back in after changing groups, or the change has no effect"
    The current terminal keeps the old permissions. Log out and back in (or run `newgrp dialout`), re-plug the gripper, then verify.

Verify: run the [self-check command](quickstart.md#self-check); `role` is `Leader`/`Follower` and `firmware_sn` is non-empty. If `firmware_sn` stays empty after fixing permissions, it does not tell you the firmware version; see [Troubleshooting](troubleshooting.md).

## Stop ModemManager grabbing the port (udev) {#32}

The gripper MCU is a CH343 USB-serial device (`1a86:55d2`, CDC-ACM). On every hot-plug, ModemManager (the default cellular-modem service on Ubuntu/GNOME) probes the fresh port with AT commands and holds it for a few seconds, so connecting fails:

```text
IoError: SerialBus: open(/dev/serial/by-id/usb-1a86_USB_Dual_Serial_..-if02): Device or resource busy
```

- **Symptom**: the first launch works, but relaunching right after moving to another port fails with `Device or resource busy`. It is not a tactile, camera or bandwidth problem.
- **Stopgap**: wait about 3s after plugging in before launching.
- **Permanent fix**: the udev rule [above](#first-use); real modems are unaffected. With the [Docker image](install.md#docker), `install_customer.sh` has already installed this rule on the host.
- **Revert**: delete the rule file and reload; a dedicated collection PC with no cellular module can also `sudo systemctl disable --now ModemManager`.

Verify:

```bash
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # -> ID_MM_DEVICE_IGNORE=1
mmcli -L                                                               # gripper no longer listed
```

## Device auto-discovery and the odd-left/even-right rule {#33}

Every device is assigned to `left`/`right` by serial number + USB topology. No serials are hand-listed.

| Device | Grammar | Example |
|---|---|---|
| Gripper | `TCGU01<batch><line><seq><m\|s>` | `TCGU01A24Z0002m` |
| Tactile | `GSPS01<batch><line><seq>` | `GSPS01A25Z0011` |
| Camera | `XC<batch><line><seq><m\|s>` | `XCA24Z0007m` |

`<seq>` is 4 digits; its last digit decides the side: odd → left, even → right. This applies to grippers, wrist cameras, and the two fingertip tactile sensors on one gripper. `m` → leader gripper, `s` → follower gripper.

- **Tactile**: maps to `{side}_tactile_{left,right}`. The two GSPS sensors sharing a gripper's USB hub belong to that gripper, whose side comes from its firmware SN (the side in the `scan_grippers()` output), not the CH343 `mcu_serial`.
- **Tracker**: the Pico4U tracker SN looks like `PC2310MLL3200496G`; the digit before the trailing `G` is odd-left / even-right, so this `6` is on the right. The headset does not show it, see [Reading a tracker SN](../common/pico4.md#pico-tracker-sn).
- **Errors**: a non-conforming serial, the wrong count on a side, two fingertip sensors on one side, two grippers claiming one tactile side, or a tactile hub with no gripper all fail outright, naming the hub/serial. Duplicates are reported before gaps; an empty side usually means its device landed on the other side, so first check the side that has two devices.

### USB bandwidth budget {#usb-budget}

When a camera will not open, check bandwidth first. Every open UVC camera reserves its own share of isochronous bandwidth: a USB 2.0 bus has 480 Mbit/s, about 384 Mbit/s of it for isochronous transfers. A bimanual setup has six cameras (four tactile + two wrist cameras), plus the laptop's built-in webcam.

```bash
lsusb -t
```

- **Count cameras**: each `480M` `root_hub` line is one budget. Three per bus on two buses is comfortable; six on one bus must be measured, as sensor batches request different amounts.
- **USB 3 ports**: the tactile sensors and wrist cameras are USB 2.0 devices, so a blue USB 3 port still lands them on that controller's USB 2.0 bus. Splitting needs a second host controller (a Thunderbolt / USB4 dock brings its own, a plain hub does not).
- **Error**: `Not enough bandwidth for altsetting N` in the kernel log; the full diagnosis is in [Troubleshooting · Not enough USB bandwidth](troubleshooting.md#usb-bandwidth).

## Start the XenseVR PC Service {#35}

Collection reads tracker poses from the XenseVR PC Service (RoboticsService) daemon. Headset and tracker setup, binding and startup alignment are in [Pico4 headset and tracker setup](../common/pico4.md).

```bash
/opt/apps/roboticsservice/runService.sh
```

- **Docker**: the [Docker image](install.md#docker) launches the service on start; without the tracker, turn it off with `START_XENSEVR_SERVICE=0`.
- **Naming**: the headset app is **XTac UMI XR**; the service on the collection PC is **XenseVR PC Service**. The package `XenseVR-PC-Service_<version>_amd64.deb` installs into `/opt/apps/roboticsservice/`, and the Python package is `xensevr_pc_service_sdk`.
- **Single instance**: starting a second one fails or conflicts.
- **Data**: the service supplies Head / controllers / hand tracking / full-body mocap / tracker data; collection uses the tracker pose (with an `sn` per tracker) and the head pose (paired with the [headset's stereo frames](recording.md#56)).
- **Headset frames**: they share one connection with the trackers, so with the service down neither works; this needs the service at v0.2.0 or later (see [You must upgrade to the latest versions](versions.md#required)), while tracker-only use works with any version.
- **Demos**: the service directory ships `ConsoleDemo` / `RobotDemoQt` to confirm the headset was discovered and tracking data looks right (they need the same runtime environment as the service).

## Power-on sequence {#36}

Follow [Quickstart · Power on and connect](quickstart.md#power-on). On a bimanual setup, read the [USB bandwidth budget](#usb-budget) before plugging in the cables.
