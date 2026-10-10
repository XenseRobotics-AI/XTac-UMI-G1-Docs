# Host setup

A gripper being listed is not the same as it being openable. This page covers two one-off settings (serial permissions and ModemManager), how devices are assigned to left and right by serial number, and starting the XenseVR PC Service. Headset and tracker setup is in [Pico4 headset and trackers](../common/pico4.md).

## Serial permissions (dialout) {#31}

The gripper MCU enumerates as `/dev/ttyACM*`, owned by group `dialout`. Outside that group the SDK cannot open the port, so `scan_grippers()` reports `role=Unknown` with an empty `firmware_sn`:

```text
RuntimeError: No leader gripper discovered for the left side.
# underneath: IoError: SerialBus: open(/dev/serial/by-id/...): Permission denied
```

Join the group once:

```bash
sudo usermod -aG dialout "$USER"
```

!!! warning "Log back in after changing the group, or this step did nothing"
    The current terminal keeps the old permissions. Log out and back in (or run `newgrp dialout`), re-plug the gripper, then verify.

Verify: `role` is `Leader`/`Follower` and `firmware_sn` is non-empty:

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side.name, g.role.name, repr(g.firmware_sn))"
```

If `firmware_sn` stays empty after fixing permissions, the SN may not be burned in, the serial read may be failing, or firmware communication may be faulty; it does not tell you the firmware version. Save the full error, retest with another cable and port, and contact the device or firmware team if it persists.

## Stop ModemManager grabbing the port (udev) {#32}

With the [Docker image](install.md#docker), `install_customer.sh` has already installed this rule on the host.

The gripper MCU is a CH343 USB-serial device (`1a86:55d2`, CDC-ACM). On every hot-plug, ModemManager (the default cellular-modem service on Ubuntu/GNOME) probes the fresh port with AT commands and holds it for a few seconds, so connecting fails:

```text
IoError: SerialBus: open(/dev/serial/by-id/usb-1a86_USB_Dual_Serial_..-if02): Device or resource busy
```

- **Symptom**: the first launch works, but relaunching right after moving to another port gives busy. It is not a tactile, camera or bandwidth problem.
- **brltty**: the braille driver `brltty` grabs `1a86` too.
- **Stopgap**: wait about 3s after plugging in before launching.

Permanent fix (real modems are unaffected):

```bash
sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
# XTac-UMI G1 MCUs are CH343 USB-serial (1a86:55d2) — keep ModemManager off them
ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
```

Verify:

```bash
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # -> ID_MM_DEVICE_IGNORE=1
mmcli -L                                                               # gripper no longer listed
```

Delete the rule file and reload to revert; a dedicated host with no cellular module can also `sudo systemctl disable --now ModemManager`.

## Device auto-discovery and the odd-left/even-right rule {#33}

Every device is assigned to `left`/`right` by serial number + USB topology. No serials are hand-listed.

### Serial grammar

| Device | Grammar | Example |
|---|---|---|
| Gripper | `TCGU01<batch><line><seq><m\|s>` | `TCGU01A24Z0002m` |
| Tactile | `GSPS01<batch><line><seq>` | `GSPS01A25Z0011` |
| Camera | `XC<batch><line><seq><m\|s>` | `XCA24Z0007m` |

`<seq>` is 4 digits; `m` → leader gripper, `s` → follower gripper.

### Side rule

Last digit of `<seq>`: odd → left, even → right. This applies to grippers, wrist cameras, and the two fingertip tactile sensors on one gripper.

- **Tactile**: maps to `{side}_tactile_{left,right}`. The two GSPS sensors sharing a gripper's USB hub belong to that gripper, whose side comes from its firmware SN (the side in the `scan_grippers()` output), not the CH343 `mcu_serial`.
- **Tracker**: the Pico4 Ultra Enterprise tracker SN looks like `PC2310MLL3200496G`; the digit before the trailing `G` is odd-left / even-right, so this `6` is on the right. The headset does not show it, see [Reading a tracker SN](../common/pico4.md#pico-tracker-sn).
- **Errors**: a non-conforming serial, the wrong count on a side, two fingertip sensors on one side, two grippers claiming one tactile side, or a tactile hub with no gripper all fail outright, naming the hub/serial.
- **Order**: duplicates are reported before gaps; an empty side usually means its device landed on the other side, so re-check the side with two first.

### USB bandwidth budget {#usb-budget}

When a camera will not open, check bandwidth first. Every open UVC camera reserves its own share of isochronous bandwidth: a USB 2.0 bus has 480 Mbit/s, about 384 Mbit/s of it for isochronous transfers. A bimanual rig has six cameras (four tactile + two wrist cameras), plus the laptop's built-in webcam.

```bash
lsusb -t
```

- **Count cameras**: each `480M` `root_hub` line is one budget. Three per bus on two buses is comfortable; six on one bus must be measured, as sensor batches request different amounts.
- **USB 3 ports**: the tactile sensors and wrist cameras are USB 2.0 devices, so a blue USB 3 port still lands them on that controller's USB 2.0 bus. Splitting needs a second host controller (a Thunderbolt / USB4 dock brings its own, a plain hub does not).
- **Error**: `Not enough bandwidth for altsetting N` in the kernel log; the full diagnosis is in [Troubleshooting · Not enough USB bandwidth](troubleshooting.md#usb-bandwidth).

## Pico4 headset and trackers

The Pico4 Ultra Enterprise tracker on top of the gripper provides the 6-DoF pose; the headset runs XTac-UMI XR, and the pose reaches collection via the [XenseVR PC Service](#35) below. Unboxing, installing XTac-UMI XR, network, tracker binding, tracking mode and startup alignment are in [Pico4 headset and trackers](../common/pico4.md).

- **Factory-configured headset**: start at [Network connection](../common/pico4.md#pico-network).
- **Before every session**: plug in the USB, short-press the tracker's power button until the blue light comes on, [tap "Connect"](../common/pico4.md#pico-toolkit-ui) and do the [startup alignment](../common/pico4.md#pico-frame).

## Start the XenseVR PC Service {#35}

Collection reads poses from the XenseVR PC Service (RoboticsService) daemon. The [Docker image](install.md#docker) launches it on start; without the tracker, turn it off with `START_XENSEVR_SERVICE=0`.

```bash
/opt/apps/roboticsservice/runService.sh
```

- **Naming**: the headset app is **XTac-UMI XR**; the computer service is **XenseVR PC Service**. The package `XenseVR-PC-Service_<version>_amd64.deb` installs into `/opt/apps/roboticsservice/`, and the Python package is `xensevr_pc_service_sdk`.
- **Single instance**: starting a second one fails or conflicts.
- **Data**: the service supplies Head / controllers / hand tracking / full-body mocap / Tracker data; collection uses the Tracker pose (with an `sn` per tracker) and the head pose (paired with the [headset's stereo frames](recording.md#56)).
- **Headset frames**: they share one connection with the trackers, so with the service down neither works; this needs the service at v0.2.0 or later (see [Version baseline](versions.md#required)), while tracker-only use works with any version.
- **Demos**: the service directory ships `ConsoleDemo` / `RobotDemoQt` to confirm the headset was discovered and tracking data looks right (they need the same runtime environment as the service).

## Power-on sequence {#36}

Follow [Quickstart · Power on and connect](quickstart.md#power-on). On a bimanual rig, read the [USB bandwidth budget](#usb-budget) before plugging in the cables.

Next → [Calibration and self-check](calibration.md)
