# Safety and compliance

Safety requirements shared by both configurations: read them through before first use, and re-read the relevant section before connecting, powering up or dismantling anything.

!!! danger "Any odour, smoke, obvious overheating, structural damage or damaged cable insulation"
    Cut the power and stop using the device immediately, note the serial number on the body and contact [support](../common/reference.md#support).

## Liabilities and limitations

- Install, use and maintain the product as described in this manual; damage or loss from not following the instructions, dismantling or modifying the product, non-matching accessories or use outside the specified environment is not covered by the warranty.
- This product collects human demonstration data for research and development; users assess the real-world safety of the data and of any model trained on it.
- Software and documentation are updated continuously; the latest version applies.

## Environmental requirements

| Item | Requirement |
|---|---|
| Operating temperature | Grippers 0–50 °C, backpack 0–40 °C; see [Specifications](specs.md) |
| Environment | Dry indoor use; keep away from rain, splashes and condensation |
| Interference | Keep away from strong magnetic fields and heat sources; headset tracking needs good lighting without direct strong light |

## Gripper {#gripper}

During collection the leader gripper's motor is never energised; the operator moves it by hand. Safety therefore centres on power, cabling and the sensor surfaces.

| Risk | Requirement | Consequence |
|---|---|---|
| Leader gripper power | Use only the supplied Type-C cable to the collection terminal (a USB port on the PC, or `UMI-L` / `UMI-R` on the backpack); bus-powered at DC 5 V / 500 mA | Out-of-spec power may damage the device |
| Follower gripper power | A 24 V adapter supplies power, Type-C carries communication only; never use a mismatched or faulty supply | A miswired supply may damage the hardware |
| Plugging and unplugging cables | Stop collection before plugging or unplugging the locking Type-C; loosen the screws before pulling it out | Strain on the connector, interrupted data |
| Static electricity | Anti-static precautions when powering up or down and when removing or refitting a sensor | Affects the sensors and communication |
| Sensor surface | Do not touch, scratch or squeeze the visuotactile surface with anything sharp; do not peel at the bonded face; do not wipe with alcohol or solvents unless confirmed safe | Elastomer or optical damage means replacing the sensor |

!!! danger "Never connect a 9 V / 12 V fast-charge adapter directly to the leader gripper"
    Fast-charge voltages will destroy the leader gripper's control board.

| | Leader gripper | Follower gripper |
|---|---|---|
| Connecting | Connect the gripper end first and tighten the locking screws, then the collection terminal | Connect the 24 V supply first, then Type-C, tightening the locking screws |
| Disconnecting | Stop collection first, unplug the collection-terminal end, then loosen the screws and unplug the gripper end | Unplug the collection-terminal end first, then cut the 24 V, and finally loosen the screws and unplug the gripper end |

Before fitting the follower gripper, stop the robot in a safe pose; route the cable clear of the joints and the gripper's range of motion with enough slack that nothing tugs, kinks or tangles; run the first motion slowly to confirm there is no interference.

!!! danger "Gripper firmware: the wrong role means a factory return, and you must power-cycle after flashing"
    - Leader and follower images are not interchangeable: flash the wrong role and the gripper will not start. Do not cut power or unplug while flashing.
    - Without a power-cycle after flashing, the gripper sits in a degraded state that reports the right version while silently dropping frames.
    - Developer Kit: flash with the SDK script, see [Firmware OTA](../pc/versions.md#ota). Backpack Kit: flash from System → Gripper, wait for the gripper to restart, then power the backpack off and on, see [Gripper firmware](../backpack/update.md#gripper-firmware).

See also [Gripper connection and serial numbers](../common/gripper.md), the Backpack Kit's [Gripper buttons, LEDs and voice](../backpack/gripper.md), and sensor care in [Maintenance](../common/maintenance.md).

## The backpack and its power {#backpack-power}

- The `DC` port takes only the supplied 12 V 3 A (36 W) adapter, or the supplied power bank over the supplied 0.3 m 12 V PD power cable; do not substitute another source or cable. Wiring: [Adapter power](../backpack/unbox-connect.md#adapter) and [Power-bank power](../backpack/unbox-connect.md#powerbank).
- Grippers plug into `UMI-L` / `UMI-R` and are powered by the backpack; connect and disconnect as in the [Gripper](#gripper) table, stopping recording first (the console's "Stop recording", or a long press on the left gripper).
- An underpowered headset shuts down and collection stops with it; do not add devices to the power bank mid-run.
- On individual units the `DC`, `PICO` or `USB` port may make poor contact, a hardware fault; do not force the connector — note the serial number on the body and send it in for repair.
- Do not block the fan outlet. After long use, overheating can drop the WiFi, which a restart recovers; check the fan is turning, and report it if it keeps happening.
- Applying a system update restarts the service; confirm no collection is in progress first.
- The device back end is for technical support only; do not log in or change the configuration yourself, and contact technical support when diagnosis is needed, see [Advanced diagnosis](../backpack/network.md#ssh).
- Power draw and power-bank runtime: [Specifications](specs.md).

## Headset and trackers {#headset}

!!! danger "Never restart XTac-UMI XR during a collection run"
    A restart resets the world frame's origin and orientation, so earlier and later episodes of one dataset no longer share a reference frame — and nothing in the data reveals it. Do not restart between episodes either; screen-off or sleep suspends the app the same way.

!!! warning "Set both the headset's system sleep and its screen timeout to \"Never\""
    System sleep first, screen timeout second; the other way round, the screen timeout's "Never" is clamped back to a finite value. Steps: [Pico4 headset and tracker setup](../common/pico4.md#pico-system).

- Trackers go by the serial number's last digit: odd on the left gripper, even on the right; swapped, the recorded poses will not match the grippers. Binding and verification: [Tracker binding](../common/pico4.md#pico-tracker-bind).
- A short press of the tracker's power button until the blue light comes on turns it on; a ~6 s hold enters pairing mode, alternating blue and red.
- Headset power: see [The backpack and its power](#backpack-power).
- Headset wearing, charging and visual health follow Pico's *PICO 4 Ultra User Guide*.

## Data safety {#data}

- **No console login gate**: anyone on the backpack's network (hotspot, wired or site WiFi) can operate the device and download or delete data. The hotspot password is printed on the body label; mind this when the device leaves your hands or joins an uncontrolled network.
- **"Delete permanently" is a hard delete**: it cascades through every recording under the task and removes the MCAP, H264 and LeRobot export files from disk, irreversibly; the confirmation dialog asks you to type the name.
- After upload, entries are marked "Uploaded" and local files are kept by default; they are removed only if you tick clean-up before uploading or [archive](../backpack/projects-export.md#archive) afterwards, after which the take can no longer be replayed or exported in any format.
- For a local copy, pick the "Download to device" destination in the export dialog and collect the archive before cleaning up or archiving.
- Upload credentials (ModelScope token, S3 keys, FTP password and so on) are stored on the device and not shown again after saving.
- Choose a "private" repository when creating an upload configuration — publishing publicly cannot be undone. After uploading to the wrong account, programmatic deletion is limited and you must use the ModelScope web console; check which configuration a project is bound to when you create it.
- Developer Kit uploads to the Hugging Face Hub need `--private` for a private repository, see [Uploading to the Hub and backups](../pc/dataset.md#64).
- Collected data is stored only on your local device and upload destinations you configure. Recordings may capture faces, screens or other personal information; inform the people involved and obtain consent beforehand, and handle and store data under local law.

## Compliance statement

- Comply with the laws and regulations where the product is used, including those on radio, data protection and privacy.
- Certification information is given by the markings on the product label and packaging.
- Headset and tracker compliance information is in PICO's official documentation.
