# Unboxing, cabling and power

This page walks you through turning the parts in the box into a system that powers up and runs: connect the grippers, the headset and the backpack in turn, then connect power (the power adapter or the power bank).

**Expected result**: the backpack is powered up and the leader grippers' LEDs are solid green. Then go to [Network and console access](network.md) to open the console.

## Unboxing checks {#unbox}

The box contents and quantities are in [Product line and configuration comparison](../product/editions.md). Before cabling, check these three:

1. **Leader grippers (XTac-UMI G1)**
    - One left and one right: an odd last digit of the serial number means left, an even one means right; see [Serial numbers and side identification](../common/gripper.md#sn).
    - The Type-C cables' locking connectors are undamaged, and nothing is lodged in the gripper connectors.
2. **Backpack body label**
    - It carries this device's SN, hotspot name and password, and device name, which you need to identify it and get it online, so do not peel it off; see [Identify the unit by its label](network.md#label).
3. **Headset setup**
    - Done as described in [Pico4 headset and tracker setup](../common/pico4.md): developer mode on, screen timeout and sleep set to "Never", both trackers paired, XTac-UMI XR installed.

!!! note
    Cabling does not depend on this software setup, but without it the headset cannot connect.

## The backpack's ports {#ports}

| Port | Location | What goes in it |
|---|---|---|
| UMI-L / UMI-R | Both sides | Left / right gripper, Type-C locking cable |
| PICO | Front panel | The headset, wired over Type-C |
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

## Choosing the power source {#power}

The grippers and headset are wired the same way either way; only the backpack's power source differs:

| | Adapter power | Power-bank power |
|---|---|---|
| Where | A fixed station with a socket | Mobile collection away from a socket |
| Source | 12 V 3 A power adapter on mains | The power bank in the box (20000 mAh, 45 W) |
| Cable into the backpack's DC port | The adapter's own lead | 0.3 m 12 V PD power cable, using the power bank's 12 V output |

!!! note "The headset battery drains slowly"
    The headset needs only one cable and the backpack powers it through that cable, but not enough to cover its draw, so the battery still drains at a net of about 1–2 W; when it runs out the headset shuts down and collection stops. Charge the headset fully before you start and, on long sessions, keep an eye on its battery icon (set it to always show under [power policy](../common/pico4.md#pico-system)).

### Adapter power {#adapter}

![Adapter wiring: left and right grippers to the sides of the backpack, the headset's Type-C to the PICO port, the adapter to the DC port](../assets/product/backpack-wiring-adapter.webp)

1. Connect the left and right leader grippers to the backpack's `UMI-L` and `UMI-R` ports.
2. Connect the headset to the backpack's `PICO` port with the headset cable (Pico → Pack).
3. Plug the 12 V 3 A adapter into the backpack's `DC` port, then into the mains.

### Power-bank power {#powerbank}

![Power-bank wiring: left and right grippers to the sides of the backpack, the headset to the PICO port, the power bank to the DC port over the 0.3 m 12 V PD power cable](../assets/product/backpack-wiring-powerbank.webp)

1. Take out the power bank in the box (20000 mAh, 45 W).
2. Connect the grippers and headset as for [adapter power](#adapter).
3. Connect the power bank to the backpack's `DC` port with the 0.3 m 12 V PD power cable.

| Cable | How it connects |
|---|---|
| Gripper cable (1.5 m C-to-C) ×2 | Left / right gripper ↔ the backpack's UMI-L / UMI-R |
| Headset cable (Pico → Pack, 1.5 m C-to-C) | The headset's Type-C port ↔ the backpack's PICO port |
| 12 V PD power cable (0.3 m) | Power bank ↔ the backpack's DC port |

The backpack draws about 20 W and runs about 3.5–4 hours on the power bank; see [Specifications](../product/specs.md#backpack).

!!! warning "Do not add devices to a power bank during collection"
    Some power banks shut down an existing output port when a second device is plugged in, and the backpack loses power on the spot. Connect every cable before you start recording.

## Connecting the headset to the backpack {#pico-link}

1. **Start and connect**: the headset and the backpack connect by cable only, so make sure the headset's Type-C port is wired to the backpack's `PICO` port as above. Put on the headset, open XTac-UMI XR, **leave "USB Network" unticked** and "PC IP" empty (it connects to `192.168.100.1` by default), then tap "Connect".
2. **Status icons**: the fold button is at the top right of XR. When tracking accuracy degrades or the link to the backpack drops, both XR and the console's live monitor page show an icon; the interface is described in [The XTac-UMI XR interface](../common/pico4.md#pico-toolkit-ui).
3. **Get in position**: stand at the work position facing the working direction before you open XR; where XR first starts becomes the [world-frame origin](../common/pico4.md#pico-frame). **Do not restart XR during collection.**

!!! warning "The headset's screen timeout and sleep must be set to \"Never\""
    Once the headset's screen turns off it stops working, and the pose data stops with it. In the headset's Developer options → Enterprise settings → Power policy, set both the system sleep and the screen timeout to "Never"; the steps are in [Pico4 headset and tracker setup](../common/pico4.md#pico-system).

!!! danger "Leave the headset cable alone while recording"
    Pulling it or letting it work loose makes the device stop and fail the current recording at once; see [Headset disconnects while recording](monitor-record.md#pico-disconnect).

## Checks after powering up {#verify}

Once the console is open, check these three; if any is wrong, go back and check the cabling:

1. **Camera count**: the "Cameras" counter at the top right shows online / total, which should be 6 / 6 in "Dual gripper" mode. One missing usually means a gripper cable is not tightened or not fully seated.
2. **Gripper LEDs**: normally solid green. A rapid red flash means the gripper's own self-check found a problem; solid red means the backpack detected that the gripper dropped out.
3. **Capture mode**: the current project's [capture mode](system.md#capture-mode) matches how the system is wired ("Dual gripper", "Dual gripper + headset stereo" or "Dual gripper + headset right eye"; the System page shows it). Once the headset is connected, the pose view on the live monitor page should follow your hand; see [Camera and pose checks](monitor-record.md#checks).

**If something is wrong**: if nothing happens at power-up or the headset keeps dropping in and out, try a different cable and port first. Poor contact in the `DC`, `PICO` or `USB` port itself is a hardware fault: note the serial number on the body, contact technical support, and do not force or lever the connector; see [Troubleshooting](troubleshooting.md).
