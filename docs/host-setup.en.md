# Host and Pico4 setup

A gripper being listed is not the same as it being openable. This page covers the two one-off host-side settings (serial permissions and ModemManager), explains how devices are assigned to left and right by serial number, and takes the Pico4 Ultra Enterprise from unboxing to "Connected". After that you can start the XenseVR PC Service and move on to calibration and collection.

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

The Pico4 Ultra Enterprise tracker uses a different serial system, shaped like `PC2310MLL3200496G`. The side is the digit in front of the trailing `G`, odd-left / even-right: here it is `6`, so the tracker is on the right. This SN is not shown on the headset, see [Reading a tracker SN](#pico-tracker-sn).

A non-conforming serial, the wrong count on a side, two fingertip sensors mapping to the same side, two grippers claiming the same tactile side, or a tactile hub with no matching gripper all make discovery fail outright and name the offending hub/serial. Duplicates are reported before gaps: a side coming up empty usually means its device put itself on the other side, so re-check the side that has two first.

### USB bandwidth budget {#usb-budget}

Whether a camera can be opened at all is decided by bandwidth the moment you plug the cables in. When a camera will not open, measure this first.

Every UVC camera reserves its own share of isochronous bandwidth for as long as it is open, and the budget is per USB 2.0 bus: 480 Mbit/s per bus, of which about 384 Mbit/s goes to isochronous transfers. A bimanual rig puts six cameras on it (four tactile + two wrist cameras), plus the laptop's built-in webcam.

```bash
lsusb -t
```

Each `480M` `root_hub` line is one budget; count the cameras under each. Two buses with three cameras each is comfortable. Six on one bus has to be measured, because different sensor batches request different amounts. The tactile sensors and wrist cameras are USB 2.0 devices, so a blue USB 3 port still puts them on that controller's USB 2.0 bus. Splitting them means plugging into a second host controller (a Thunderbolt / USB4 dock brings its own, a plain hub does not).

`Not enough bandwidth for altsetting N` in the kernel log when collection starts is this problem. How to watch the log, the full diagnosis, the measured numbers and three fixes that look promising and are not: see [Troubleshooting · Not enough USB bandwidth](troubleshooting.md#usb-bandwidth).

## Pico4 Ultra Enterprise setup {#34}

The standalone motion tracker that ships with the Pico4 Ultra Enterprise mounts on top of the gripper and provides the 6-DoF pose. XTac-UMI XR (the VR client app) runs on the headset, and the pose reaches collection via the [XenseVR PC Service](#35).

On a factory-configured headset, developer mode, the power policy, the app, the tracker binding and the tracking mode are already set and survive power cycles (redo them only after a factory reset or a headset swap), so start at [Network connection](#pico-network). Plugging in the USB, short-pressing the tracker's power button until the blue light comes on, [tapping "Reconnect"](#pico-toolkit-ui) and [startup alignment](#pico-frame) are needed before every session.

### Unboxing and the system update {#pico-unbox}

1. Unbox: peel the protective sticker off the front panel, the tape off the controllers and the sticker off the lenses, then hold the power button to switch it on.

    ![Protective sticker on the front sensor bar](assets/pico4/unbox-film.webp){ width="440" }

2. Update the system. This is required on a new unit: it ships on an older build and only works properly once updated, and it has to be done before pairing the tracker or installing the app. Join a WiFi network with internet access, go to Settings → System update, and tap "Download and install" to reach 5.15.5.U or later. The package is about 1.9 GB.

    ![System update to 5.15.5.U](assets/pico4/system-update.webp){ width="560" }

### System settings: developer mode and power policy {#pico-system}

1. Enable developer mode: Settings → About → tap "Software version" several times → "Developer options" appears on the left → turn on USB debugging.

    ![Tap the software version repeatedly](assets/pico4/devmode-tap-version.webp){ width="480" }

    ![Developer options → turn on USB debugging](assets/pico4/devmode-usb-debug.webp){ width="480" }

2. Disable sleep and screen-off: in Developer options tap "Enterprise Settings" → System Settings → Power policy (only the Enterprise edition has this item; the consumer edition cannot set "Never"). It ships as screen-off 30 s, system sleep 5 min, battery icon hidden. Change all three, in this order:
    1. System sleep = Never first;
    2. Screen off = Never second;
    3. Set the battery and charging status icon at the bottom to "Always show", so you can check the charge mid-session.

    ![Final power policy settings](assets/pico4/power-step4-final.webp){ width="480" }

!!! warning "Sleep first, screen-off second; the order cannot be reversed"
    The screen-off timeout is bounded by the system sleep timeout. Set screen-off first, while system sleep is still at its default, and its "Never" gets clamped back to a finite value: it looks set but is not in effect. When done, leave Settings and come back to confirm both read "Never".

If you skip this: once the headset screen-blanks or sleeps between episodes, XTac-UMI XR gets suspended or killed and tracking drops out, and restarting it resets the world frame (see [Frame alignment](#pico-frame)). Taking the headset off and setting it down triggers this too.

### Installing XTac-UMI XR {#pico-app}

1. On the PC: connect the headset to the PC over USB and copy `XTac-UMI-XR-0.1.X.apk` into the headset's `Download/` directory (`0.1.X` is the version; use whichever build you were given).

    ![Copy the apk into the Pico's Download folder](assets/pico4/install-step1-copy.webp){ width="480" }

2. Put the headset on, tap "File Manager" on the taskbar, and go into the "Download" folder.

    ![File Manager → Download](assets/pico4/install-step2-filemanager.webp){ width="480" }

3. Tap `XTac-UMI-XR-0.1.X.apk` and choose "Install" in the "Install this app?" dialog. Once installed, XTac-UMI XR appears in the "Library".

    ![Confirming the install](assets/pico4/install-step3-confirm.webp){ width="480" }

### Network connection {#pico-network}

Tracking data has to reach the XenseVR PC Service on the collection PC. Both wired and wireless work:

| Link | How |
|---|---|
| Wired USB shared network (recommended) | Type-C cable straight to the collection PC; the headset assigns the PC an IP |
| WiFi | Headset and collection PC on the same network |

In a busy WiFi environment (congested channels, heavy interference) the pose stutters, jitters or drops data, and this is not easy to tell apart from other faults. Use the wired link for real collection; wireless is only for quick debugging.

Wired setup:

1. On the headset: Settings → Developer options → enable "USB debugging" → set "USB connection" to "File transfer". Re-check this after every USB re-plug, as it reverts to the default. If you cannot select it, reboot the Pico.
2. Start the service on the PC first (see [Start the XenseVR PC Service](#35)): `runService.sh`. With the service down, the app just sits on "Not connected".
3. Open XTac-UMI XR, tap "Reconnect", and the status changes to "Connected" (see [The app's screen](#pico-toolkit-ui)).

Over WiFi, put the headset and the collection PC on the same network; everything else is the same.

!!! warning "On the wired link, turn the collection PC's WiFi off"
    The wired shared network conflicts with other networks on the PC (WiFi above all) through routing and interface contention, leaving the tracker unreachable or its pose unstable. Keep only the headset's shared network.

![USB connection set to file transfer](assets/pico4/usb-shared-network.webp){ width="520" }

### Binding the motion tracker to the headset {#pico-tracker-bind}

On first use, or after swapping a tracker, the PICO Motion Tracker must be bound to this headset first. Until it is, it cannot be selected in tracking mode, and neither XTac-UMI XR nor the PC Service will discover its SN.

Before pairing, scan the QR code on the back of the tracker with your phone to get its full SN, and mount it on the gripper by odd-left / even-right (see [Device auto-discovery](#33)). The six digits in the red box are the number shown in the "My trackers" list after pairing (e.g. `Tracker 150311`).

| Scan this | You get this |
|---|---|
| ![The QR code on the back of the tracker](assets/pico4/tracker-sn-qr.webp){ width="300" } | ![Scan result, left tracker](assets/pico4/tracker-sn-left.webp){ width="320" }<br>`1` before the `G`, odd → left gripper |

1. Open the "Motion Tracker" app from the Library and tap the icon in the top-right corner of the main screen to enter the pairing screen.

    ![The top-right icon opens the pairing screen](assets/pico4/tracker-pair-entry.webp){ width="440" }

2. Hold the tracker's power button for about 6 seconds, until the indicator alternates blue and red. That is Bluetooth pairing mode.
3. Tap "Start pairing". The headset plays a tone when pairing succeeds, and the tracker appears in the "My trackers" list with its battery level and number (e.g. `Tracker 150399`), marked "Connected".
4. One tracker per gripper, so bind both. The top of the list should read "2 paired".

    ![Motion Tracker app: 2 paired](assets/pico4/tracker-bind.webp){ width="440" }

!!! warning "Power-on is a short press; only pairing needs the hold"
    Solid blue is just powered on, not pairing mode, and the app will not find it. Everyday power-on is a short press until the blue light comes on; only first-time binding needs the ~6 s hold until it alternates blue and red.

The binding is stored on the headset; everyday power cycles and app restarts do not need a re-bind. Re-bind after swapping trackers, moving to another headset or a factory reset: unpair from the ⓘ on the right of the list entry first, then bind the new one.

!!! warning "In standalone tracking mode the tracker must stay in the headset's view"
    A tracker occluded for long by your body, the desk edge or the other hand loses tracking (pose jumps or a frozen pose). Do not let the tracker on top of the gripper leave the headset's view for long.

#### Reading a tracker SN {#pico-tracker-sn}

The SN determines the side (the digit before the `G`, odd-left / even-right) and is also how the PC Service identifies a tracker. It is not visible on the headset: the "Motion Tracker" app only shows a short number (e.g. `Tracker 150399`), and the SN on XTac-UMI XR's Network panel (e.g. `PA9410MGL…`) is the headset's own. Read the full SN (shaped like `PC2310MLL3200496G`) with the PC Service's Python interface:

```python
import xensevr_pc_service_sdk as xrt

xrt.init()
print(xrt.get_motion_tracker_serial_numbers())   # e.g. ['PC2310MLL3200496G', ...]
```

It only returns the trackers the service is currently receiving data from, so first: tracker bound and powered on → XTac-UMI XR ["Connected"](#pico-toolkit-ui) → [PC Service](#35) running on the host. Miss any one and you get an empty list. With the SN in hand you can pin it via `--robot.tracker_serial=<SN>` and skip auto-matching. Shake one gripper at a time to confirm which SN is which hand before writing it into your config.

### Tracking mode {#pico-tracker}

Once bound, open "Motion Tracking" on the headset, find "Tracking mode" in its settings, select "Standalone tracking" and tap "Confirm". The row should then read "Standalone tracking". The factory default "Full-body motion capture" wears trackers on the body to follow a human pose; "Standalone tracking" fixes a tracker to an object and follows that object's pose, which is how a gripper is used.

![Pick standalone tracking and confirm](assets/pico4/tracker-mode2-pick.webp){ width="480" }

### The app's screen {#pico-toolkit-ui}

With the headset on, open XTac-UMI XR from the Library. The screen has only three items: Status, Resolution and Reconnect ("Collapse" folds the panel away). Until "Status" reads "Connected", the PC reads no pose at all.

There is no PC IP to enter: once the [wired shared network](#pico-network) is up, the app finds the XenseVR PC Service on the host by itself, but you have to tap "Reconnect" to connect. Opening the app does not connect it. On first launch it asks "Allow XTac-UMI XR to use the camera?". Tap "Allow", or you get no [headset camera](recording.md#56) frames.

![Status not connected; tap "Reconnect"](assets/pico4/app-step2-disconnected.webp){ width="420" }

![Allow XTac-UMI XR to use the camera](assets/pico4/app-step3-camera.webp){ width="380" }

"Resolution" is the capture resolution of the [headset camera](recording.md#56). There are three settings, `640` / `1024` / `1280`, defaulting to `640`, which is the one to use. It does nothing if you are not using the headset camera. Raise it here and the collection command's `--robot.head_camera_width/_height` has to follow with the matching values, or connect fails on the first frame's size. The mapping table is in [Headset camera](recording.md#56).

High-accuracy tracking is on by default; there is no toggle. If it never connects, the cause is usually the [network](#pico-network) not being up or the PC's WiFi still on. Once it reads "Connected", confirm on the host that a pose with an `sn` comes through, via `ConsoleDemo` in `/opt/apps/roboticsservice/` or `python -m lerobot.robots.taccap_gripper.check_tracker`. The headset saying it is connected and the host actually receiving data are two different things.

### Startup and frame alignment {#pico-frame}

Wear the headset and face straight towards the robot when you launch XTac-UMI XR, then [tap "Reconnect"](#pico-toolkit-ui) to get to "Connected". The moment it launches, the world frame's origin and orientation are frozen.

Recorded poses land in a gravity-aligned world frame: +X = straight ahead, +Y = left, +Z = up. The origin sits where the headset was at the moment of launch. In the picture below, red = X (forward), green = Y (left), blue = Z (up):

![The world frame frozen at launch](assets/pico4/world-frame-origin.webp){ width="420" }

The frame follows the headset only for that one instant at launch. Once frozen it stays put in space, and turning your head or walking around does not carry it with you. Every `tcp.*` pose in the dataset is referenced to it.

!!! danger "Face straight towards the robot at launch; do not restart XTac-UMI XR between episodes"
    Facing straight ahead is what aligns world X with the robot's forward direction. Only the orientation matters; where you stand does not. After a restart of XTac-UMI XR the origin and orientation change, leaving poses inside one dataset referenced to different frames.

## Start the XenseVR PC Service {#35}

The tracker talks to the host's XenseVR PC Service (RoboticsService) daemon, which handles device discovery, status monitoring and live tracking-data distribution. Collection reads poses from it. The [Docker image](install.md#docker) container launches it automatically on start; when you only work on data and do not need the tracker, turn it off with `START_XENSEVR_SERVICE=0`.

```bash
/opt/apps/roboticsservice/runService.sh
```

Only one instance can run at a time; starting a second one fails or conflicts.

The service can supply several kinds of data (Head / controllers / hand tracking / full-body mocap / standalone Tracker). Collection uses two of them: the standalone Tracker pose (the gripper pose, carrying an `sn` that distinguishes the trackers) and the head pose (the headset's own pose, used together with the [headset's stereo frames](recording.md#56)). The headset sends each eye's frames and its own pose to the PC Service, which forwards them to collection; they share one connection with the trackers, so with the service down neither works. This path needs a service at v0.2.0 or later (see [Version baseline](versions.md#required)); if you only use trackers, the version makes no difference.

The service directory `/opt/apps/roboticsservice/` ships the `ConsoleDemo` / `RobotDemoQt` demos for confirming that the headset was discovered and tracking data looks right (they need the same runtime environment as the service).

## Power-on sequence {#36}

The power-on and power-off sequence is described once, in [Quickstart · Power-on and power-off sequence](quickstart.md#power-on); follow the 7 steps there. On a bimanual rig, read the [USB bandwidth budget](#usb-budget) before plugging in the cables.

Next → [Calibration and self-check](calibration.md)
