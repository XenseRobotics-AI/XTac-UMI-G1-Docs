# Host setup

A gripper being listed is not the same as it being openable. This page covers the two one-off host-side settings (serial permissions and ModemManager), explains how devices are assigned to left and right by serial number, and starts the XTac-UMI XR PC Service; after that you can move on to calibration and collection. The headset and trackers are set up in [Pico4 headset and trackers](../common/pico4.md), shared by both editions.

## Serial permissions (dialout) {#31}

The gripper MCU enumerates as `/dev/ttyACM*`, owned by group `dialout`. A user outside that group can have the SDK list grippers but cannot open the port to read the firmware serial, so `scan_grippers()` reports `role=Unknown` with an empty `firmware_sn`:

```text
RuntimeError: No leader gripper discovered for the left side.
# underneath: IoError: SerialBus: open(/dev/serial/by-id/...): Permission denied
```

Join the group once:

```bash
sudo usermod -aG dialout "$USER"
```

!!! warning "Log back in after changing the group, or this step did nothing"
    Group membership only applies to newly created login sessions. The current terminal still holds the old permissions and keeps reporting `role=Unknown`. Log out and back in (or run `newgrp dialout`), re-plug the gripper, then verify.

Verify: `role` must be `Leader`/`Follower` (not `Unknown`) and `firmware_sn` non-empty:

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side.name, g.role.name, repr(g.firmware_sn))"
```

If `firmware_sn` stays empty after fixing permissions, the SN may not be burned in, the serial read may still be failing, or firmware communication may be faulty. An empty SN alone is not enough to infer a firmware version. Save the full error, retest with a different cable and port, and contact the device or firmware team if it persists.

## Stop ModemManager grabbing the port (udev) {#32}

With the [Docker image](install.md#docker), `install_customer.sh` has already installed this udev rule on the host (a container cannot manage the host's hot-plug rules), so you do not need to redo it.

The gripper MCU is a CH343 USB-serial device (`1a86:55d2`, CDC-ACM). On every hot-plug, ModemManager (the default cellular-modem service on Ubuntu/GNOME) probes the fresh port with AT commands and holds it for a few seconds, so connecting fails during that window:

```text
IoError: SerialBus: open(/dev/serial/by-id/usb-1a86_USB_Dual_Serial_..-if02): Device or resource busy
```

Typical symptom: the first launch works, but unplugging, moving to another port and relaunching immediately gives busy. This is not a tactile, camera or bandwidth problem. The braille driver `brltty` grabs `1a86` the same way. Stopgap: wait about 3 s after plugging in before launching.

Permanent fix: a udev rule telling ModemManager to ignore these devices (real modems are unaffected):

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

Delete the rule file and reload to revert. On a dedicated host with no cellular module you can also `sudo systemctl disable --now ModemManager`.

## Device auto-discovery and the odd-left/even-right rule {#33}

Every device is auto-discovered by serial number + USB topology and assigned to `left`/`right`. No serials are hand-listed.

### Serial grammar

| Device | Grammar | Example |
|---|---|---|
| Gripper | `TCGU01<batch><line><seq><m\|s>` | `TCGU01A24Z0002m` |
| Tactile | `GSPS01<batch><line><seq>` | `GSPS01A25Z0011` |
| Camera | `XC<batch><line><seq><m\|s>` | `XCA24Z0007m` |

`<seq>` is 4 digits; `m` → leader gripper, `s` → follower gripper.

### Side rule

The last digit of the 4-digit sequence: odd → left, even → right. This applies to grippers, wrist cameras, and which of a gripper's two fingertip tactile sensors is left or right.

Tactile sensors map to `{side}_tactile_{left,right}`: the two GSPS sensors sharing a gripper's USB hub are that gripper's pair, and the gripper's side is read from its firmware SN (the side in the `scan_grippers()` output), not from the CH343 `mcu_serial`, so hub → gripper → side. Which of the two is left/right comes from the last digit of the GSPS serial.

The Pico4 Ultra Enterprise tracker uses a different serial system, shaped like `PC2310MLL3200496G`. The side is the digit in front of the trailing `G`, odd-left / even-right: here it is `6`, so the tracker is on the right. This SN is not shown on the headset, see [Reading a tracker SN](../common/pico4.md#pico-tracker-sn).

A non-conforming serial, the wrong count on a side, two fingertip sensors mapping to the same side, two grippers claiming the same tactile side, or a tactile hub with no matching gripper all make discovery fail outright and name the offending hub/serial. Duplicates are reported before gaps: a side coming up empty usually means its device put itself on the other side, so re-check the side that has two first.

### USB bandwidth budget {#usb-budget}

Whether a camera can be opened at all is decided by bandwidth the moment you plug the cables in. When a camera will not open, measure this first.

Every UVC camera reserves its own share of isochronous bandwidth for as long as it is open, and the budget is per USB 2.0 bus: 480 Mbit/s per bus, of which about 384 Mbit/s goes to isochronous transfers. A bimanual rig puts six cameras on it (four tactile + two wrist cameras), plus the laptop's built-in webcam.

```bash
lsusb -t
```

Each `480M` `root_hub` line is one budget; count the cameras under each. Two buses with three cameras each is comfortable. Six on one bus has to be measured, because different sensor batches request different amounts. The tactile sensors and wrist cameras are USB 2.0 devices, so a blue USB 3 port still puts them on that controller's USB 2.0 bus. Splitting them means plugging into a second host controller (a Thunderbolt / USB4 dock brings its own, a plain hub does not).

`Not enough bandwidth for altsetting N` in the kernel log when collection starts is this problem. How to watch the log, the full diagnosis, the measured numbers and three fixes that look promising and are not: see [Troubleshooting · Not enough USB bandwidth](troubleshooting.md#usb-bandwidth).

## Pico4 headset and trackers

The standalone motion tracker that ships with the Pico4 Ultra Enterprise mounts on top of the gripper and provides the 6-DoF pose; XTac-UMI XR runs on the headset, and the pose reaches collection via the [XTac-UMI XR PC Service](#35) below. Unboxing and system settings, installing XTac-UMI XR, the network connection, tracker binding, tracking mode and startup alignment are shared by both editions and live in [Pico4 headset and trackers](../common/pico4.md). On a factory-configured headset start at [Network connection](../common/pico4.md#pico-network); before every session you only need to plug in the USB, short-press the tracker's power button until the blue light comes on, [tap "Reconnect"](../common/pico4.md#pico-toolkit-ui) and do the [startup alignment](../common/pico4.md#pico-frame).

## Start the XTac-UMI XR PC Service {#35}

The tracker talks to the host's XTac-UMI XR PC Service (RoboticsService) daemon, which handles device discovery, status monitoring and live tracking-data distribution. Collection reads poses from it. The [Docker image](install.md#docker) container launches it automatically on start; when you only work on data and do not need the tracker, turn it off with `START_XENSEVR_SERVICE=0`.

```bash
/opt/apps/roboticsservice/runService.sh
```

Only one instance can run at a time; starting a second one fails or conflicts.

The service can supply several kinds of data (Head / controllers / hand tracking / full-body mocap / standalone Tracker). Collection uses two of them: the standalone Tracker pose (the gripper pose, carrying an `sn` that distinguishes the trackers) and the head pose (the headset's own pose, used together with the [headset's stereo frames](recording.md#56)). The headset sends each eye's frames and its own pose to the PC Service, which forwards them to collection; they share one connection with the trackers, so with the service down neither works. This path needs a service at v0.2.0 or later (see [Version baseline](versions.md#required)); if you only use trackers, the version makes no difference.

The service directory `/opt/apps/roboticsservice/` ships the `ConsoleDemo` / `RobotDemoQt` demos for confirming that the headset was discovered and tracking data looks right (they need the same runtime environment as the service).

## Power-on sequence {#36}

The power-on and power-off sequence is described once, in [Quickstart · Power-on and power-off sequence](index.md#power-on); follow the 7 steps there. On a bimanual rig, read the [USB bandwidth budget](#usb-budget) before plugging in the cables.

Next → [Calibration and self-check](calibration.md)
