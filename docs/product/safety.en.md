# Safety and compliance

This page collects the safety requirements shared by both configurations, in four sections: the gripper, the backpack and its power, the headset and trackers, and data safety. Read it through before first use, and re-read the relevant section before connecting, powering up or dismantling anything. Liabilities and limitations, environmental requirements and compliance statements that the vendor has not yet supplied are marked "To be added"; this page does not invent content in their place.

!!! danger "Any odour, smoke, obvious overheating, structural damage or damaged cable insulation"
    Cut the power and stop using the device immediately, note the serial number on the body and contact [support](../common/reference.md#support).

## Liabilities and limitations

To be added.

## Environmental requirements

| Item | Requirement |
|---|---|
| Operating temperature | To be added |
| Relative humidity | To be added |
| Ingress protection rating | To be added |
| Magnetic field strength | To be added |

## Gripper {#gripper}

During collection the leader gripper does not drive its motor (the motor is never energised); the operator performs the motion mechanically by hand. The safety requirements are therefore concentrated on power, cabling and the sensor surfaces.

| Risk | Requirement | Consequence |
|---|---|---|
| Leader gripper power | Use only the supplied Type-C cable to the collection terminal (a USB port on the PC, or `UMI-L` / `UMI-R` on the backpack); bus-powered at DC 5 V / 500 mA | Out-of-spec power may damage the device |
| Follower gripper power | Power and communication are separate: a 24 V adapter supplies power and Type-C carries communication only; never use a mismatched or faulty supply | A miswired supply may damage the hardware |
| Plugging and unplugging cables | Stop collection before plugging or unplugging the Type-C connector with its locking screws; loosen the screws before pulling it out | Strain on the connector, interrupted data |
| Static electricity | Take anti-static precautions when powering up or down and when removing or refitting a sensor | Static affects the sensors and communication |
| Sensor surface | Do not touch, scratch or squeeze the visuotactile surface with anything sharp; do not peel at the bonded face; do not wipe with alcohol or solvents unless confirmed safe | Damage to the elastomer or the optics can only be fixed by replacing the sensor |

!!! danger "Never connect a 9 V / 12 V fast-charge adapter directly to the leader gripper"
    The leader gripper takes power only from the collection terminal's USB port; fast-charge voltages will destroy the control board.

Connection and disconnection order:

| | Leader gripper | Follower gripper |
|---|---|---|
| Connecting | Connect the gripper end first and tighten the locking screws, then the collection terminal | Connect the 24 V supply first, then Type-C, tightening the locking screws |
| Disconnecting | Stop collection first, unplug the collection-terminal end, then loosen the screws and unplug the gripper end | Unplug the collection-terminal end first, then cut the 24 V, and finally loosen the screws and unplug the gripper end |

The follower gripper mounts on a robot's end effector: before fitting it, stop the robot and put it in a safe pose; route the cable clear of the joints and of the gripper's range of motion with enough slack that nothing tugs, kinks or tangles during movement; run the first motion slowly and confirm there is no interference.

!!! danger "Gripper firmware: the wrong role means a factory return, and you must power-cycle after flashing"
    The leader and follower firmware images are not interchangeable. Flash the wrong role and the gripper will not start; only the factory can recover it. Do not cut the power or unplug anything while flashing (the LED blinks blue). After flashing you must power the gripper down and plug it back in once, otherwise it sits in a degraded state that reports the right version number while silently dropping frames. On the Developer Kit you flash with the SDK script, see [Firmware OTA](../pc/versions.md#ota); on the Backpack Kit you flash from System → Gripper, then wait for the gripper to restart and power the backpack off and on again, see [Gripper firmware](../backpack/update.md#gripper-firmware).

The gripper's buttons, LED patterns and serial-number rules are in [Gripper buttons, LEDs and serial numbers](../common/gripper.md); cleaning, storage and removal / refitting of the sensors are in [Maintenance](../common/maintenance.md).

## The backpack and its power {#backpack-power}

The backpack's `DC` port takes only the supplied 12 V 3 A (36 W) adapter, or the 12 V output of the supplied power bank. The power bank's Type-C port can output either 5 V 3 A or 12 V 3 A; the cable feeding the backpack must be on the 12 V output. The grippers plug into `UMI-L` / `UMI-R` and are powered by the backpack, with no separate supply.

The connection order is the same as on the Developer Kit: connect the gripper end first and tighten the locking screws, then the backpack's `UMI-L` / `UMI-R`. To disconnect, stop recording first (the console's "Stop recording", or a long press on the left gripper), then unplug the backpack end, and finally loosen the screws and unplug the gripper end. The full wiring for both power options is in [Adapter power](../backpack/unbox-connect.md#adapter) and [Power-bank power](../backpack/unbox-connect.md#powerbank).

If the headset is underpowered it will lose power and shut down, and collection stops with it. Power requirements, choosing a power bank and wiring the two-in-one cable are in [Power-bank power](../backpack/unbox-connect.md#powerbank); do not add devices to the power bank part-way through a collection run.

- Connectors: on individual units the `DC`, `PICO` or `USB` port may make poor contact, which is a hardware fault; do not force or lever the connector — note the serial number on the body and send it in for repair.
- Cooling: do not block the fan outlet. After long use, overheating can drop the WiFi, which a restart recovers; check that the fan is turning, and report it if it keeps happening.
- System updates: confirm no collection is in progress before applying one; the service restarts when it is applied.
- Device back end: the device back end is for technical support only. Do not log in or change the system configuration yourself; when back-end diagnosis is needed, contact technical support, see [Advanced diagnosis](../backpack/network.md#ssh).
- Battery, power draw and ingress protection rating: to be added.

## Headset and trackers {#headset}

!!! danger "Never restart XTac-UMI XR during a collection run"
    Restarting resets the origin and orientation of the world frame, so poses in earlier and later episodes of the same dataset no longer share a reference frame — and nothing in the data reveals the problem. Do not restart between episodes either; the headset's screen turning off or going to sleep suspends the app in the same way.

!!! warning "Set both the headset's system sleep and its screen timeout to \"Never\""
    Set the system sleep first and the screen timeout second; the other way round, the screen timeout's "Never" gets clamped back to a finite value. The steps are in [Pico4 headset and tracker setup](../common/pico4.md#pico-system).

- Trackers are assigned to a side by the last digit of the serial number: odd goes on the left gripper, even on the right. Fit them the wrong way round and the recorded poses will not match the grippers. Binding and verification are in [Tracker binding](../common/pico4.md#pico-tracker-bind).
- A short press of the tracker's power button until the blue light comes on turns it on; holding it for about 6 seconds puts it into pairing mode, alternating blue and red.
- The headset's power requirements are in [The backpack and its power](#backpack-power).
- Wearing, charging and visual health for the headset itself follow Pico's own *PICO 4 Ultra User Guide*; this site does not repeat them.

## Data safety {#data}

- The backpack console has no login gate: anyone on the backpack's network (its hotspot, wired, or site WiFi) can operate the device and download or delete data. The hotspot password is printed on the body label; keep this in mind when the device leaves your hands or joins an uncontrolled network.
- "Delete permanently" is a hard delete: it cascades through every recording under the task and removes the MCAP, H264 and LeRobot export files from disk. It cannot be undone, and the confirmation dialog asks you to type the name.
- After publishing to ModelScope, those episodes are marked as published and removed from the exportable set, and by default the local files are deleted as well. If you need a local copy, batch-download the MCAP files from the export dialog before publishing.
- The ModelScope access token is stored on the device's state disk and is not shown again after saving. Choose a "private" repository when creating an upload configuration — publishing publicly cannot be undone. After publishing to the wrong account, programmatic deletion is limited and you have to sort it out in the ModelScope web console, so check which configuration a project is bound to when you create it.
- When uploading to the Hugging Face Hub on the Developer Kit, add `--private` for a private repository, see [Uploading to the Hub and backups](../pc/dataset.md#64).
- Privacy protection: to be added.

## Compliance statement

To be added.
