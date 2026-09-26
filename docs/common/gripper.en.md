# Gripper buttons, LEDs and serial numbers

This page covers how to connect the XTac-UMI G1 leader and follower grippers, how to verify they are detected, what the two buttons, the indicator LED and the voice prompts mean, and how the serial number tells left from right. The gripper itself is identical in both editions; only where the cable goes, how detection is checked, and the button, LED and field-feedback semantics differ, and those parts are split into "Backpack Kit / Developer Kit" tabs. Product positioning and the system components are in [XTac-UMI G1](../product/g1.md); specifications in [Specifications](../product/specs.md#specs).

## Leader gripper connection and use {#install}

=== "Left leader gripper"

    ![Left leader gripper diagram](../assets/hardware/master-left.webp){ width="360" }

=== "Right leader gripper"

    ![Right leader gripper diagram](../assets/hardware/master-right.webp){ width="360" }

The leader gripper takes both power and communication over USB Type-C. The buttons are for recording control; the indicator LED shows the running state.

![Leader gripper controls (port / buttons / LED)](../assets/hardware/master-controls.webp){ width="480" }

### Before connecting

- Have ready the left and right leader grippers, two USB locking cables (a Type-C locking connector on the gripper end, Type-C or Type-A on the other end to match the terminal's port) and the collection terminal (the backpack on the Backpack Kit; the collection PC on the Developer Kit, requirements in [Collection host requirements](../pc/install.md#host-spec)).
- Make sure no 9V/12V fast-charging adapter is connected directly to the leader gripper.
- The Type-C locking end is intact and there is nothing foreign inside the gripper's port.
- The visuotactile sensor surfaces are free of dirt, scratches, looseness and foreign objects.

### Connection steps

![Leader gripper connection diagram](../assets/hardware/master-connection.webp){ width="560" }

1. Take out the USB Type-C communication cable.
2. Plug it into the Type-C port on the leader gripper body and **tighten the locking screws**.
3. Plug the other end into the collection terminal: on the Backpack Kit the left gripper goes to the backpack's `UMI-L` port and the right one to `UMI-R`; on the Developer Kit either a Type-C or a Type-A port on the PC works.

![Leader gripper connected](../assets/hardware/master-connect.webp){ width="480" }

### Power-on and detection

=== "Backpack Kit"

    Once connected, the LED should be solid green (standby). Open the console: in the system metrics area at the top right, the "cameras" counter should show online equal to total, the gripper side accounting for 6 (2 wrist cameras + 4 visuotactile); the "Live monitor" page should show both fisheye views and all four tactile views. If one is missing, the camera list on the System → Device info page marks it "(offline)".

=== "Developer Kit"

    Once connected, the LED should be solid white. Then check the UVC device count with `lsusb`: a dual-gripper setup should show 6 (2 wrist cameras + 4 visuotactile sensors), a single arm 3.

    ```bash
    lsusb
    ```

    ![lsusb output with both grippers connected](../assets/hardware/lsusb.webp){ width="720" }

    Each of the two red boxes is one leader gripper; inside it are that gripper's 3 UVC devices:

    | Text in the box | What it is | Per leader gripper |
    |---|---|---|
    | `Xense Robotics ... GSPS01…` | Visuotactile sensor | 2 |
    | `Sunplus ... XCA…` | Wrist fisheye camera | 1 |

    The last digit of the serial number tells the side (odd = left, even = right, see [Serial numbers and side identification](#sn)): in the picture `…0069`/`…0071` are left and `…0070`/`…0072` are right. If the count is wrong, check the cable locking and the USB port contact; if it is still wrong, see [Hardware faults](../pc/troubleshooting.md#hardware).

A leader gripper needs its travel calibrated before it yields a normalised opening: on the Backpack Kit this is done on the console's System → Gripper page (write the zero closed → write the maximum travel fully open); on the Developer Kit see [Gripper calibration](../pc/calibration.md#41), where an uncalibrated leader is refused at connect, and with two grippers both sides must be calibrated. Firmware, SDK and repository versions must match; see [You must upgrade to the latest versions](../pc/versions.md#required).

## Buttons, LEDs and voice {#buttons-leds}

The two side buttons control recording and the LED reports the current state; on the Backpack Kit the device speaker also gives [voice prompts](#voice-cues). On the Backpack Kit the Collector on the backpack owns the buttons and the LED patterns, and this is the recommended way to drive recording in the field; on the Developer Kit recording is controlled from the command line for now and the button mapping is still being finalised.

### Buttons {#buttons}

=== "Backpack Kit"

    The button state machine runs on the backpack and **does not need the browser to be open**. While recording, a double-press or a right-gripper hold is silently ignored (against accidental presses); with nothing to delete, a double-press is refused (fast yellow blink).

    | Gesture | Action |
    |---|---|
    | **Right gripper hold** | Start recording |
    | **Left gripper hold** | Stop recording |
    | **Left gripper double-press** | Enter delete confirmation (purple blink; exits by itself after 5 s without input) |
    | **Double-press** again while confirming | Delete the previous episode (solid purple for 3 s; those 3 s are also the cool-down, during which double-presses are ignored) |
    | **Left gripper hold** while confirming | Cancel the delete |
    | **Right gripper hold** while confirming | Abandon the delete and start a new recording right away (the previous episode is kept) |

    Which gripper does what (right starts / left stops), the press timings and the LED patterns are fixed fleet-wide and cannot be changed on site, and the console offers no way to change them; the values in effect are shown on the console's System → Capture settings page (see [System settings](../backpack/system.md)).

=== "Developer Kit"

    The single-press / double-press / long-press mapping is still being developed. For now, control recording from the command line; see [Data collection](../pc/recording.md).

### LEDs {#leds}

=== "Backpack Kit"

    | LED | Meaning |
    |---|---|
    | Solid green | Standby: ready to record |
    | Breathing green | Recording (one bright-dim cycle per second) |
    | White blink | Saved normally (0.4 s on, once) |
    | Solid yellow | Failed to start recording (2 s), or a fatal problem while recording (stays lit) |
    | Pulsing yellow | Data suspect: still recording, but that episode's quality is questionable (0.2 s on, 0.8 s off, 3 times) |
    | Fast yellow blink | Action refused, e.g. pressing start while already recording (0.1 s on/off, 3 times) |
    | Purple blink | Delete confirmation pending, waiting for your second double-press; 0.3 s on/off, cancels itself on timeout |
    | Solid purple | The 3 s cool-down right after a delete; double-presses do nothing during it |
    | Solid red | System problem (e.g. a gripper dropped off; lit by the backpack side) |
    | Red strobe | Gripper-side problem (lit by the gripper MCU itself, not routed through the backpack) |

    Recording is breathing green; red only ever means a fault. Fast blink and pulse are both yellow and differ only in rhythm: the fast blink is dense, the pulse sparse. The console's System → Capture settings page renders this table as an animated legend that plays each shape and rhythm, so the two are easy to tell apart (see [System settings](../backpack/system.md)).

=== "Developer Kit"

    | LED | Meaning | What you do |
    |---|---|---|
    | Solid white | Normal operation | Powered on; you can start collecting |
    | Blinking blue | Firmware OTA in progress | Do not cut power or unplug anything; see [Firmware upgrade](../pc/versions.md#ota) |

    The LED patterns for recording, faults and so on are still in development and testing and are subject to the final release. For anything other than these two, follow [Hardware faults](../pc/troubleshooting.md#hardware).

### Voice prompts {#voice-cues}

Backpack Kit only: while collecting, both hands are on the grippers and your eyes are on the scene, so reading the LED means looking up at the gripper. The backpack therefore speaks up at four moments through its own speaker, complementing the LED patterns. The audio comes out of the backpack speaker, so no tablet needs to be nearby and the browser is not involved.

| When | What it says |
|---|---|
| Recording starts | "Recording started" |
| An episode finishes | "Recording finished, please reset the environment" — reset the scene and get ready for the next one |
| A fatal problem while recording | "Recording failed" — that episode is a write-off |
| A gripper or the headset drops off while recording | "Gripper connection failed" or "Pico connection failed" |

The toggle, the per-line preview and the 0-100 volume slider are all on the console's System → [Capture settings](../backpack/system.md#voice) page (the volume slider since 0.3.16); the settings survive a reboot. The wording and the timing are fixed values that cannot be changed on site, so every device in a fleet behaves the same.

## Follower gripper mounting and connection

![Follower gripper diagram](../assets/hardware/follower-gripper.webp){ width="360" }

The follower gripper mounts on the robot's end effector and is not side-specific. When mounting, mind the flange orientation, the cable routing and the robot's workspace.

### Before mounting

- The robot is stopped and in a safe pose.
- The end-effector flange size, screw specification, mounting orientation and end-effector payload meet the project requirements.
- The 24V adapter, the Type-C communication cable and the locking parts are intact.
- Plan the cable routing so it does not interfere with the joints, the gripper's range of motion or obstacles.

### Flange mounting

It mounts on the robot's end effector through a flange; dimensions and hole positions are in the figures below.

=== "Flange mounting"

    ![Follower gripper flange mounting](../assets/hardware/follower-flange-1.webp){ width="420" }

=== "Flange dimensions"

    ![Follower gripper flange mounting dimensions](../assets/hardware/follower-flange-2.webp){ width="420" }

### Power and communication connection

The follower gripper has separate communication and power: communication over Type-C, power from the 24V adapter.

![Follower gripper connection diagram](../assets/hardware/follower-connection.webp){ width="560" }

1. Take out the USB Type-C communication cable and the 24V power adapter.
2. Connect the 24V power adapter to the follower gripper body.
3. Plug the screw end of the Type-C locking cable into the follower gripper body and **tighten the locking screws**.
4. Plug the other end into the collection terminal and confirm in the software that the follower gripper is communicating.

![Follower gripper connected](../assets/hardware/follower-connect.webp){ width="480" }

!!! warning "Cable and mounting check"
    Make sure the follower gripper is firmly fixed, the 24V connection is secure, the Type-C is locked with enough slack, and the cables cannot be pulled, bent or tangled while the robot moves. Before the first run, test at low speed to confirm nothing interferes.

## Power and connection requirements {#power}

| Item | Leader gripper | Follower gripper |
|---|---|---|
| Power | USB Type-C bus power, DC 5V/500mA, no separate supply needed | 24V power adapter (do not use a supply with the wrong rating or a faulty one); Type-C is communication only |
| Cables | Supplied locking cable: Type-C on the gripper end, Type-C or Type-A on the other | Type-C communication cable + 24V power cable |
| Connect and lock order | Connect the gripper end and tighten the locking screws first, then the collection terminal | Connect 24V power first, then Type-C, and tighten the locking screws |
| Disconnect order | Unplug the collection terminal end first, then loosen the screws and unplug the gripper end | Unplug the collection terminal end first, then cut 24V, and finally loosen the screws and unplug the gripper-end Type-C |
| Static | Take anti-static precautions when powering on/off and when removing or fitting sensors | Same as leader |

Stop collection, recording, robot motion and replay before unplugging anything. The power-on and power-off order for the whole system is in the Backpack Kit's [Connection and disconnection order](../backpack/unbox-connect.md#order) or, for the Developer Kit, [Power-on and power-off order](../pc/index.md#power-on). On an unexpected reboot, a device that is not detected, or a blinking red LED, stop immediately and follow [Hardware faults](../pc/troubleshooting.md#hardware).

## Serial numbers and side identification {#sn}

The side is given by whether the last digit of the serial number's running number is odd or even: **odd = left, even = right**. Grippers, visuotactile sensors, wrist cameras and Pico trackers all follow this rule. On the Developer Kit the collection software assigns sides automatically from it (see [Device discovery rules](../pc/host-setup.md#33)), so you normally do not need to tell them apart by hand; to check manually, run `lsusb` and look at the last digit. On the Backpack Kit the console's System → Device info page shows each gripper's left / right badge and SN.

## Safety notes {#safety}

Power ratings, the ban on direct fast charging, plugging and unplugging, static and sensor-surface requirements are collected in [Safety and compliance](../product/safety.md).

Cleaning, storage and removal/refitting of the visuotactile sensors are in [Maintenance](maintenance.md). Once everything is connected and detected, run your first collection with the [Backpack Kit quickstart](../backpack/index.md) or the [Developer Kit quickstart](../pc/index.md).
