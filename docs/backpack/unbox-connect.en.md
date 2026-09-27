# Unboxing, cabling and power

Turn what is in the box into a system you can power up: grippers to the backpack, headset to the backpack, and either the adapter or a power bank for power. By the end the backpack is powered up and the gripper LEDs are solid green; then turn to [Network and console access](network.md) to open the console.

## Unboxing checks {#unbox}

The box contents and quantities are in [Product line and configuration comparison](../product/editions.md). Before cabling, check only three things:

- The two XTac-UMI G1 grippers are one left and one right: an odd last digit of the serial number means left, an even one means right ([Serial numbers and side identification](../common/gripper.md#sn)). The Type-C cables' locking connectors are undamaged, and there is nothing lodged in the gripper connectors.
- The backpack's body label carries this device's SN, its hotspot name `xense-<last 6 of the serial>`, the hotspot password and the console address. You need these to get on the network, so do not peel it off ([Identify the unit by its label](network.md#label)).
- The headset has been set up as described in [Pico4 headset and tracker setup](../common/pico4.md): developer mode on, screen timeout and system sleep set to "Never", both trackers paired, and XTac-UMI XR installed. Cabling does not depend on any of this, but without it the headset will not connect.

## The backpack's ports {#ports}

| Port | Location | What goes in it |
|---|---|---|
| UMI-L / UMI-R | Both sides | Left / right gripper, Type-C locking cable |
| PICO | Front panel | The headset, Type-C; it carries the USB network, and whether it can also power the headset depends on the notes shipped with your unit |
| HEAD, USB | Front panel | Not used in this procedure |
| DC | Rear panel | 12 V power input, marked as Type-C on the wiring diagram but go by the physical unit; takes the adapter or a power bank |
| Ethernet | Rear panel | RJ45, to a router's LAN port |
| SD card slot, HDMI, headphone | Rear panel | Not used in day-to-day collection |

Photographs of the ports are in [The Backpack](../product/backpack.md).

## Connection and disconnection order {#order}

The order is fixed: grippers → headset → power up the backpack.

1. Connect the grippers: the end of the Type-C locking cable with the screws goes into the gripper body, and you tighten the locking screws; the other end goes into the side of the backpack, the left gripper to UMI-L and the right to UMI-R. The gripper is bus-powered over this cable and needs no separate supply.
2. Connect the headset: follow either [Adapter power](#adapter) or [Power-bank power](#powerbank).
3. Power up the backpack: the DC port takes the adapter or a power bank. The hotspot comes up automatically after boot, and a solid green gripper LED means standby (the LED patterns are in [Gripper buttons, LEDs and serial numbers](../common/gripper.md#buttons-leds)).

Disconnection is the reverse: stop recording first, then unplug the backpack end, and finally loosen the locking screws and unplug the gripper end. Take anti-static precautions when powering up or down and when plugging or unplugging cables.

!!! warning "Tighten the gripper end before connecting the backpack end"
    If the locking screws are not tight, the cable works loose during collection and the gripper drops out; the system log fills with `mcu ... disconnected / reconnected` and that recording is wasted.

## Adapter power {#adapter}

Use this at a fixed workstation with a mains socket: one cable from the headset to the backpack, and the adapter to the mains.

![Adapter wiring: left and right grippers to the sides of the backpack, the headset's Type-C to the PICO port, the adapter to the DC port](../assets/product/backpack-wiring-adapter.webp)

1. Connect the left / right grippers to UMI-L / UMI-R.
2. Connect the headset to the backpack's PICO port with a Type-C cable, carrying the USB network; whether that one cable can also power the headset depends on the notes shipped with your unit.
3. Connect the 12 V 3 A 36 W adapter to the backpack's DC port, then plug it into the mains.

## Power-bank power {#powerbank}

Use this for mobile collection away from a socket: the headset and the backpack each take one power-bank output, and the box contains two power banks (Type-C output 5 V 3 A / 12 V 3 A).

![Power-bank wiring: the headset takes the two-in-one cable, its charging leg to a power bank and its data leg to the PICO port; the other power bank feeds the DC port over a 0.5 m C-to-C cable](../assets/product/backpack-wiring-powerbank.webp)

Match the cable harness to the labels in the diagram:

| Harness label | Cable | How it connects |
|---|---|---|
| UMI-L / UMI-R | 1.5 m C-to-C | Left / right gripper ↔ the backpack's UMI-L / UMI-R |
| PICO-LINK / PICO-DATA / POWER-PICO | Two-in-one Type-C (data + charging) | PICO-LINK to the headset; PICO-DATA to the backpack's PICO port; POWER-PICO to a power bank |
| 12V DC-IN / POWER-COMPUTE | 0.5 m C-to-C | Power bank ↔ the backpack's DC port, using the power bank's 12 V 3 A output |

1. Connect the left / right grippers to UMI-L / UMI-R.
2. Connect the headset to the two-in-one Type-C cable first: the charging leg to a power bank, the data leg to the backpack's PICO port.
3. Run the second cable from the other power bank to the backpack's DC port.

If the headset is underpowered it will lose power and shut down (it draws roughly 6–7 W in operation, but needs a stable supply). The power banks in the box were chosen with this in mind; if you buy your own, pick one with a stable output above 20 W, and a magnetic power bank must output 5.4–8.4 V / 5 A max and come with a magnetic base. The backpack's own battery, runtime and power figures are to be added.

!!! warning "Do not add devices to a power bank during collection"
    Some power banks shut down an existing output port when a second device is plugged in, and the headset or the backpack loses power on the spot. Connect every cable before you start recording.

## Connecting the headset to the backpack {#pico-link}

Put the headset on and open XTac-UMI XR; there are two ways to connect:

- USB network (the default, and what real collection uses): the headset's Type-C port is already wired to the backpack's PICO port by the steps above. In XR, tick "USB network" and tap "Connect"; the backpack brings the network up on the USB link automatically (address `192.168.58.1`) with nothing to type.
- WiFi (for quick debugging only; the link fluctuates and poses arrive late): put the headset and the backpack on the same router (the headset on the router's WiFi, the backpack on Ethernet or site WiFi, see [Joining a site network](network.md#lan)), leave "USB network" unticked in XR, enter the backpack's IP and connect. You need to know the backpack's IP beforehand, and its service must already be running.

The fold button is at the top right of XR; when tracking accuracy degrades or a tracker disconnects from the backpack, both XR and the console's live monitor page show an icon. The interface is described in [The XTac-UMI XR interface](../common/pico4.md#pico-toolkit-ui).

Stand at the work position facing the working direction before you open XR: where you are when XR first starts becomes the [world-frame origin](../common/pico4.md#pico-frame), and you must not restart XR during a collection run.

!!! warning "The headset's screen timeout and system sleep must be set to \"Never\""
    Once the headset's screen turns off it stops working, and the pose data stops with it. In the headset's Developer options → Enterprise settings → Power policy, set both the system sleep and the screen timeout to "Never"; the steps are in [Pico4 headset and tracker setup](../common/pico4.md#pico-system).

## A fixed workstation layout {#desk}

In a lab the backpack, a PC and a router are often wired into one local network, with the PC opening the console in a browser:

![Wiring topology: router ↔ backpack ↔ PC, with the grippers on C-to-C cables](../assets/backpack/hardware-topology.webp)

- The backpack's Ethernet port and the PC's cable both go to the router's LAN ports; the backpack's wired port ships on DHCP and works as soon as you plug it in.
- The headset still goes over the PICO port's USB network, or joins the router's WiFi with the backpack's IP entered in XR.
- The PC's browser opens the backpack's IP or `http://xense-<last 6 of the serial>.local`. To find the IP, use the [Windows device scanner](network.md#scanner); on an Ubuntu PC remember to tick Wired in the system settings, see [Wired](network.md#wired).

![The desk setup in the flesh](../assets/backpack/desk-setup.webp)

## Checks after powering up {#verify}

Once the console is open, look at three things; if any of them is wrong, go back and check the cabling:

- The "cameras" counter at the top right shows online / total, which should be 6 / 6 in dual-gripper mode; one missing usually means a gripper cable is not tightened or not fully seated.
- The gripper LEDs are solid green. A rapid red flash means the gripper's own self-check found a problem; solid red means the backpack detected that the gripper dropped out.
- System → [Capture mode](system.md#capture-mode) matches how the system is actually wired (dual gripper / dual gripper + headset / single gripper / single gripper + headset / headset only); once the headset is connected, the pose view on the live monitor page should follow your hand, see [Camera and pose checks](monitor-record.md#checks).

If nothing happens when you power up, or the headset keeps dropping in and out, try a different cable and a different port first. Poor contact in the `DC`, `PICO` or `USB` port itself is a hardware fault: note the serial number on the body and contact support, and do not force or lever the connector — see [Troubleshooting](troubleshooting.md).
