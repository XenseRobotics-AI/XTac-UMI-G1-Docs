# Unboxing, cabling and power

Turn what is in the box into a system you can power up: grippers to the backpack, headset to the backpack, and either the adapter or a power bank for power. By the end the backpack is powered up and the gripper LEDs are solid green; then turn to [Network and console access](network.md) to open the console.

## Unboxing checks {#unbox}

The box contents and quantities are in [Product line and configuration comparison](../product/editions.md). Before cabling, check only three things:

- The two XTac-UMI G1 grippers are one left and one right: an odd last digit of the serial number means left, an even one means right ([Serial numbers and side identification](../common/gripper.md#sn)). The Type-C cables' locking connectors are undamaged, and there is nothing lodged in the gripper connectors.
- The backpack's body label carries this device's SN, hotspot name and password, and device name. You need these to identify it and get on the network, so do not peel it off ([Identify the unit by its label](network.md#label)).
- The headset has been set up as described in [Pico4 headset and tracker setup](../common/pico4.md): developer mode on, screen timeout and system sleep set to "Never", both trackers paired, and XTac-UMI XR installed. Cabling does not depend on any of this, but without it the headset will not connect.

## The backpack's ports {#ports}

| Port | Location | What goes in it |
|---|---|---|
| UMI-L / UMI-R | Both sides | Left / right gripper, Type-C locking cable |
| PICO | Front panel | The headset, Type-C, over the USB Network |
| HOST1 / HOST2 | Front panel | USB host ports, for a tablet or other devices |
| DC IN | Rear panel | 12 V power input, from the adapter or the power bank |
| Ethernet | Rear panel | RJ45, to a router's LAN port |
| TF, HDMI, headphone | Rear panel | Not used in day-to-day collection |

The connector drawing is in [The Backpack](../product/backpack.md#ports).

## Connection and disconnection order {#order}

The order is fixed: grippers → headset → power up the backpack.

1. Connect the grippers: the end of the Type-C locking cable with the screws goes into the gripper body, and you tighten the locking screws; the other end goes into the side of the backpack, the left gripper to UMI-L and the right to UMI-R. The gripper is bus-powered over this cable and needs no separate supply.
2. Connect the headset: the headset cable (Pico → Pack) goes from the headset to the backpack's PICO port; this is the same for [Adapter power](#adapter) and [Power-bank power](#powerbank).
3. Power up the backpack: the DC port takes the adapter or a power bank. After boot, a solid green gripper LED means standby; then plug the tablet into the backpack's `HOST` port to open the console, see [The tablet over USB](network.md#tablet) (the LED patterns are in [Gripper buttons, LEDs and voice](gripper.md#buttons-leds)).

Disconnection is the reverse: stop recording first, then unplug the backpack end, and finally loosen the locking screws and unplug the gripper end. Take anti-static precautions when powering up or down and when plugging or unplugging cables.

!!! warning "Tighten the gripper end before connecting the backpack end"
    If the locking screws are not tight, the cable works loose during collection and the gripper drops out; the system log fills with `mcu ... disconnected / reconnected` and that recording is wasted.

## Adapter power {#adapter}

Use this at a fixed workstation with a mains socket: one cable from the headset to the backpack, and the adapter to the mains.

![Adapter wiring: left and right grippers to the sides of the backpack, the headset's Type-C to the PICO port, the adapter to the DC port](../assets/product/backpack-wiring-adapter.webp)

1. Connect the left / right grippers to UMI-L / UMI-R.
2. Connect the headset to the backpack's PICO port with the headset cable (Pico → Pack), carrying the USB network; whether that one cable can also power the headset depends on the notes shipped with your unit.
3. Connect the 12 V 3 A adapter to the backpack's DC port, then plug it into the mains.

## Power-bank power {#powerbank}

Use this for mobile collection away from a socket: the single power bank in the box (20000 mAh, 45 W) feeds the backpack over the 0.3 m 12 V PD power cable, and the headset still connects to the backpack's PICO port over the headset cable, exactly as with adapter power.

![Power-bank wiring: left and right grippers to the sides of the backpack, the headset to the PICO port, the power bank to the DC port over the 0.3 m 12 V PD power cable](../assets/product/backpack-wiring-powerbank.webp)

| Cable | How it connects |
|---|---|
| Gripper cable (1.5 m C-to-C) ×2 | Left / right gripper ↔ the backpack's UMI-L / UMI-R |
| Headset cable (Pico → Pack, 1.5 m C-to-C) | The headset's Type-C port ↔ the backpack's PICO port |
| 12 V PD power cable (0.3 m) | Power bank ↔ the backpack's DC port, using the power bank's 12 V output |

1. Connect the left / right grippers to UMI-L / UMI-R.
2. Connect the headset to the backpack's PICO port with the headset cable, carrying the USB network; whether that one cable can also power the headset depends on the notes shipped with your unit.
3. Connect the 12 V PD power cable from the power bank to the backpack's DC port.

If the headset is underpowered it will lose power and shut down, which interrupts collection; make sure the headset is well charged before you start and keep an eye on its battery icon during collection (set it to always show under [power policy](../common/pico4.md#pico-system)). The backpack's own battery, runtime and power figures are to be added.

!!! warning "Do not add devices to a power bank during collection"
    Some power banks shut down an existing output port when a second device is plugged in, and the backpack loses power on the spot. Connect every cable before you start recording.

## Connecting the headset to the backpack {#pico-link}

Put the headset on and open XTac-UMI XR. The headset and the backpack **connect by cable only**: the headset's Type-C port is already wired to the backpack's PICO port by the steps above. In XR, tick "USB Network" and tap "Connect"; the backpack brings the network up on the USB link automatically (address `192.168.58.1`) with nothing to type.

The fold button is at the top right of XR; when tracking accuracy degrades or a tracker disconnects from the backpack, both XR and the console's live monitor page show an icon. The interface is described in [The XTac-UMI XR interface](../common/pico4.md#pico-toolkit-ui).

Leave this cable alone while recording: pulling it or letting it work loose makes the device stop and fail the current recording at once, see [Headset disconnects while recording](monitor-record.md#pico-disconnect).

Stand at the work position facing the working direction before you open XR: where you are when XR first starts becomes the [world-frame origin](../common/pico4.md#pico-frame), and you must not restart XR during a collection run.

!!! warning "The headset's screen timeout and system sleep must be set to \"Never\""
    Once the headset's screen turns off it stops working, and the pose data stops with it. In the headset's Developer options → Enterprise settings → Power policy, set both the system sleep and the screen timeout to "Never"; the steps are in [Pico4 headset and tracker setup](../common/pico4.md#pico-system).

## Checks after powering up {#verify}

Once the console is open, look at three things; if any of them is wrong, go back and check the cabling:

- The "Cameras" counter at the top right shows online / total, which should be 6 / 6 in "Dual gripper" mode; one missing usually means a gripper cable is not tightened or not fully seated.
- The gripper LEDs are solid green. A rapid red flash means the gripper's own self-check found a problem; solid red means the backpack detected that the gripper dropped out.
- The current project's [capture mode](system.md#capture-mode) matches how the system is actually wired ("Dual gripper", "Dual gripper + stereo headset" or "Dual gripper + headset right eye"; the System page shows it); once the headset is connected, the pose view on the live monitor page should follow your hand, see [Camera and pose checks](monitor-record.md#checks).

If nothing happens when you power up, or the headset keeps dropping in and out, try a different cable and a different port first. Poor contact in the `DC`, `PICO` or `USB` port itself is a hardware fault: note the serial number on the body and contact support, and do not force or lever the connector — see [Troubleshooting](troubleshooting.md).
