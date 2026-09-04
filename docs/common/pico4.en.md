# Pico4 headset and tracker setup {#34}

The standalone motion tracker that ships with the Pico4 Ultra Enterprise mounts on top of the gripper and provides the 6-DoF pose. XTac-UMI XR (the VR client app) runs on the headset and sends the pose to the collection side. Both editions use the same headset and the same trackers; only three things differ — where the headset plugs in, where the pose service runs, and how the app connects — and those steps are split into "Backpack Kit / Developer Kit" tabs. Every other step is identical.

| | Backpack Kit | Developer Kit |
|---|---|---|
| Where the headset plugs in | The backpack's `PICO` port (wired USB), or the same WiFi as the backpack | The collection PC's Type-C port (wired USB shared network), or the same WiFi as the PC |
| Where the pose service runs | The XTac-UMI XR runtime is built into XTac-UMI Collector; it is up as soon as the backpack boots, nothing to start | The [XTac-UMI XR PC Service](../pc/host-setup.md#35) on the collection PC, started by hand before every session |
| How the app connects | Tick "USB network" → tap "Connect"; over WiFi leave it unticked and enter the backpack IP | Tap "Reconnect"; no IP to enter |

On a factory-configured headset, developer mode, the power policy, the app, the tracker binding and the tracking mode are already set and survive power cycles (redo them only after a factory reset or a headset swap), so start at [Network connection](#pico-network). Plugging in, short-pressing the tracker's power button until the blue light comes on, [connecting in the app](#pico-toolkit-ui) and [startup alignment](#pico-frame) are needed before every session.

## Unboxing and the system update {#pico-unbox}

1. Unbox: peel the protective sticker off the front panel, the tape off the controllers and the sticker off the lenses, then hold the power button to switch it on.

    ![Protective sticker on the front sensor bar](../assets/pico4/unbox-film.webp){ width="440" }

2. Update the system. This is required on a new unit: it ships on an older build and only works properly once updated, and it has to be done before pairing the tracker or installing the app. Join a WiFi network with internet access, go to Settings → System update, and tap "Download and install" to reach Pico OS 5.15.5.U or later. The package is about 1.9 GB.

    ![System update to 5.15.5.U](../assets/pico4/system-update.webp){ width="560" }

## System settings: developer mode and power policy {#pico-system}

1. Enable developer mode: Settings → About → tap "Software version" several times (with the controller, pull the index-finger trigger repeatedly while pointing at it) → "Developer options" appears on the left → turn on USB debugging.

    ![Tap the software version repeatedly](../assets/pico4/devmode-tap-version.webp){ width="480" }

    ![Developer options → turn on USB debugging](../assets/pico4/devmode-usb-debug.webp){ width="480" }

2. Disable sleep and screen-off: in Developer options tap "Enterprise Settings" → System Settings → Power policy (only the Enterprise edition has this item; the consumer edition cannot set "Never"). It ships as screen-off 30 s, system sleep 5 min, battery icon hidden. Change all three, in this order:
    1. System sleep = Never first;
    2. Screen off = Never second;
    3. Set the battery and charging status icon at the bottom to "Always show", so you can check the charge mid-session.

    ![Final power policy settings](../assets/pico4/power-step4-final.webp){ width="480" }

!!! warning "Sleep first, screen-off second; the order cannot be reversed"
    The screen-off timeout is bounded by the system sleep timeout. Set screen-off first, while system sleep is still at its default, and its "Never" gets clamped back to a finite value: it looks set but is not in effect. When done, leave Settings and come back to confirm both read "Never".

If you skip this: once the headset screen-blanks or sleeps between episodes, XTac-UMI XR gets suspended or killed and tracking drops out, and restarting it resets the world frame (see [Frame alignment](#pico-frame)). Taking the headset off and setting it down triggers this too.

## Installing XTac-UMI XR {#pico-app}

The APK is named `XTac-UMI-XR-<version>.apk` (the Backpack Kit ships with 0.2.5; on the Developer Kit use whichever build you were given). Install it from the headset's file manager:

1. On the PC: connect the headset to the PC over USB and copy the APK into the headset's `Download/` directory.

    ![Copy the apk into the Pico's Download folder](../assets/pico4/install-step1-copy.webp){ width="480" }

2. Put the headset on, tap "File Manager" on the taskbar, and go into the "Download" folder.

    ![File Manager → Download](../assets/pico4/install-step2-filemanager.webp){ width="480" }

3. Tap the APK and choose "Install" in the "Install this app?" dialog. Once installed, XTac-UMI XR appears in the "Library".

    ![Confirming the install](../assets/pico4/install-step3-confirm.webp){ width="480" }

If the PC has adb (Android platform-tools), you can install in one command without going into the headset, once USB debugging is on and "USB connection" is set to "File transfer":

```bash
adb devices                          # the headset should be listed
adb install XTac-UMI-XR-0.2.5.apk    # substitute the build you were given
```

## Network connection {#pico-network}

Tracking data has to reach the XTac-UMI XR pose service on the collection unit. **Wired is the default**: a Type-C cable gives the link to itself, with stable, predictable latency.

!!! warning "Wireless is for quick debugging only, never for real collection"
    Over WiFi the headset and the collection unit compete for the channel with everything else on site. The link fluctuates and pose data arrives late: at best the pose stutters and jitters, at worst frames are dropped. None of this is visible while recording, and afterwards it is hard to tell apart from other causes, so the whole batch has to be recollected. Use the cable for real collection.

On both editions, set USB up on the headset first: Settings → Developer options → enable "USB debugging" → set "USB connection" to "File transfer". Re-check this after every USB re-plug, as it reverts to the default. If you cannot select it, reboot the Pico.

![USB connection set to file transfer](../assets/pico4/usb-shared-network.webp){ width="520" }

=== "Backpack Kit"

    Wired setup:

    1. Run a Type-C cable from the Type-C port on the side of the headset to the backpack's `PICO` port. When running from a power bank, the headset takes the two-in-one cable first: its charging plug goes to the power bank, its data plug to the backpack's `PICO` port; wiring in [Power bank wiring](../backpack/unbox-connect.md#powerbank).
    2. Power on the backpack. The XTac-UMI XR runtime is built into Collector and starts with it; there is no separate service to launch.
    3. Open XTac-UMI XR, tick "USB network" and tap "Connect": the backpack brings up its own network on the USB link (address `192.168.58.1`), nothing to enter by hand.

    Over WiFi, put the headset and the backpack on the same network (the same router, say; the backpack only joins 5 GHz WiFi), leave "USB network" unticked in the app, enter the backpack's IP and tap "Connect". The backpack's IP is in the network drop-down in the console's top bar.

=== "Developer Kit"

    Wired setup:

    1. Start the service on the PC first (see [Start the XTac-UMI XR PC Service](../pc/host-setup.md#35)): `runService.sh`. With the service down, the app just sits on "Not connected".
    2. Run a Type-C cable straight from the headset to the collection PC; the headset assigns the PC an IP.
    3. Open XTac-UMI XR, tap "Reconnect", and the status changes to "Connected" (see [The app's screen](#pico-toolkit-ui)).

    Over WiFi, put the headset and the collection PC on the same network; everything else is the same.

    !!! warning "On the wired link, turn the collection PC's WiFi off"
        The wired shared network conflicts with other networks on the PC (WiFi above all) through routing and interface contention, leaving the tracker unreachable or its pose unstable. Keep only the headset's shared network.

## Binding the motion tracker to the headset {#pico-tracker-bind}

On first use, or after swapping a tracker, the PICO Motion Tracker must be bound to this headset first. Until it is, it cannot be selected in tracking mode, and neither XTac-UMI XR nor the collection side will discover its SN.

Before pairing, scan the QR code on the back of the tracker with your phone to get its full SN, and mount it on the gripper by odd-left / even-right (see [Serial numbers and side identification](gripper.md#sn)). The six digits in the red box are the number shown in the "My trackers" list after pairing (e.g. `Tracker 150311`).

| Scan this | You get this |
|---|---|
| ![The QR code on the back of the tracker](../assets/pico4/tracker-sn-qr.webp){ width="300" } | ![Scan result, left tracker](../assets/pico4/tracker-sn-left.webp){ width="320" }<br>`1` before the `G`, odd → left gripper |

1. Open the "Motion Tracker" app from the Library and tap the icon in the top-right corner of the main screen to enter the pairing screen.

    ![The top-right icon opens the pairing screen](../assets/pico4/tracker-pair-entry.webp){ width="440" }

2. Hold the tracker's power button for about 6 seconds, until the indicator alternates blue and red. That is Bluetooth pairing mode.
3. Tap "Start pairing". The headset plays a tone when pairing succeeds, and the tracker appears in the "My trackers" list with its battery level and number (e.g. `Tracker 150399`), marked "Connected".
4. One tracker per gripper, so bind both. The top of the list should read "2 paired".

    ![Motion Tracker app: 2 paired](../assets/pico4/tracker-bind.webp){ width="440" }

!!! warning "Power-on is a short press; only pairing needs the hold"
    Solid blue is just powered on, not pairing mode, and the app will not find it. Everyday power-on is a short press until the blue light comes on; only first-time binding needs the ~6 s hold until it alternates blue and red.

The binding is stored on the headset; everyday power cycles and app restarts do not need a re-bind. Re-bind after swapping trackers, moving to another headset or a factory reset, and likewise after pairing the wrong tracker: unpair from the ⓘ on the right of the list entry first, then bind the new one.

!!! warning "In standalone tracking mode the tracker must stay in the headset's view"
    A tracker occluded for long by your body, the desk edge or the other hand loses tracking (pose jumps or a frozen pose). Do not let the tracker on top of the gripper leave the headset's view for long.

### Reading a tracker SN {#pico-tracker-sn}

The SN determines the side (the digit before the `G`, odd-left / even-right) and is also how the collection side identifies a tracker. It is not visible on the headset: the "Motion Tracker" app only shows a short number (e.g. `Tracker 150399`), and the SN on XTac-UMI XR's Network panel (e.g. `PA9410MGL…`) is the headset's own. The most direct source of the full SN (shaped like `PC2310MLL3200496G`) is the QR code on the back of the tracker.

=== "Backpack Kit"

    The Backpack Kit relies on the SN from the QR code; there is no command-line interface. Once connected, open the console's "Live monitor" page: the pose view shows the left and right gripper poses, and shaking one gripper at a time confirms the sides are not swapped.

=== "Developer Kit"

    Read it with the PC Service's Python interface:

    ```python
    import xensevr_pc_service_sdk as xrt

    xrt.init()
    print(xrt.get_motion_tracker_serial_numbers())   # e.g. ['PC2310MLL3200496G', ...]
    ```

    It only returns the trackers the service is currently receiving data from, so first: tracker bound and powered on → XTac-UMI XR ["Connected"](#pico-toolkit-ui) → [PC Service](../pc/host-setup.md#35) running on the host. Miss any one and you get an empty list. With the SN in hand you can pin it via `--robot.tracker_serial=<SN>` and skip [auto-matching](../pc/host-setup.md#33). Shake one gripper at a time to confirm which SN is which hand before writing it into your config.

## Tracking mode {#pico-tracker}

Once bound, open "Motion Tracking" on the headset, find "Tracking mode" in its settings, select "Standalone tracking" and tap "Confirm". The row should then read "Standalone tracking". The factory default "Full-body motion capture" wears trackers on the body to follow a human pose; "Standalone tracking" fixes a tracker to an object and follows that object's pose, which is how a gripper is used.

![Pick standalone tracking and confirm](../assets/pico4/tracker-mode2-pick.webp){ width="480" }

## The app's screen {#pico-toolkit-ui}

With the headset on, open XTac-UMI XR from the Library. On first launch it asks "Allow XTac-UMI XR to use the camera?". Tap "Allow", or you get no headset camera frames. Until "Status" reads "Connected", the collection side reads no pose at all; "Collapse" in the top-right corner folds the panel away.

![Allow XTac-UMI XR to use the camera](../assets/pico4/app-step3-camera.webp){ width="380" }

=== "Backpack Kit"

    In the panel, tick "USB network" → tap "Connect" (wired); over WiFi leave it unticked, enter the backpack IP and tap "Connect". When tracker accuracy degrades or the link to the backpack drops, an icon appears on the panel.

    Once connected, open the console's "Live monitor" page: the pose view should show the headset and both gripper poses. When the record button is not ready it states the reason; "Pico pose or clock not ready" means the headset is not connected yet.

=== "Developer Kit"

    The screen has only three items: Status, Resolution and Reconnect. There is no PC IP to enter: once the [wired shared network](#pico-network) is up, the app finds the XTac-UMI XR PC Service on the host by itself, but you have to tap "Reconnect" to connect. Opening the app does not connect it.

    ![Status not connected; tap "Reconnect"](../assets/pico4/app-step2-disconnected.webp){ width="420" }

    "Resolution" is the capture resolution of the [headset camera](../pc/recording.md#56). There are three settings, `640` / `1024` / `1280`, defaulting to `640`, which is the one to use. It does nothing if you are not using the headset camera. Raise it here and the collection command's `--robot.head_camera_width/_height` has to follow with the matching values, or connect fails on the first frame's size. The mapping table is in [Headset camera](../pc/recording.md#56).

    High-accuracy tracking is on by default; there is no toggle. If it never connects, the cause is usually the [network](#pico-network) not being up or the PC's WiFi still on. Once it reads "Connected", confirm on the host that a pose with an `sn` comes through, via `ConsoleDemo` in `/opt/apps/roboticsservice/` or `python -m lerobot.robots.taccap_gripper.check_tracker`. The headset saying it is connected and the host actually receiving data are two different things.

## Startup and frame alignment {#pico-frame}

Wear the headset and face straight towards the robot when you launch XTac-UMI XR, then [connect in the app](#pico-toolkit-ui). The moment it launches, the world frame's origin and orientation are frozen.

The world frame's definition (axes, origin, freeze rule) and its diagram are in [Coordinate frames](coordinates.md); every pose in the dataset is referenced to it.

!!! danger "Face straight towards the robot at launch; do not restart XTac-UMI XR between episodes"
    Facing straight ahead is what aligns world X with the robot's forward direction. Only the orientation matters; where you stand does not. After a restart of XTac-UMI XR the origin and orientation change, leaving poses inside one dataset referenced to different frames.
