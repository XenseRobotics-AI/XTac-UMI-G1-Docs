# Gripper buttons, LEDs and voice {#buttons-leds}

On the Backpack Kit the gripper's two side buttons start, stop and delete recordings, the LED reports the current state, and the device gives voice announcements. The buttons and LED patterns are handled by XTac-UMI Collector on the backpack, so no browser needs to be online. How to connect the grippers and tell left from right by serial number is in [Gripper connection and serial numbers](../common/gripper.md).

![Leader gripper controls (port / buttons / LED)](../assets/hardware/master-controls.webp){ width="480" }

## Buttons {#buttons}

The button state machine runs on the backpack and **does not need the browser to be open**. While recording, a double-press or a right-gripper hold is silently ignored (against accidental presses); with nothing to delete, a double-press is refused (fast yellow blink).

| Gesture | Action |
|---|---|
| **Right gripper hold** | Start recording |
| **Left gripper hold** | Stop recording |
| **Left gripper double-press** | Enter delete confirmation (purple blink; exits by itself after 5 s without input) |
| **Double-press** again while confirming | Delete the previous episode (solid purple for 3 s; those 3 s are also the cool-down, during which double-presses are ignored) |
| **Left gripper hold** while confirming | Cancel the delete |
| **Right gripper hold** while confirming | Abandon the delete and start a new recording right away (the previous episode is kept) |
| **Right gripper single press** while recording | Place a subtask marker (a sub-step boundary) in this recording, with a tone |

Which gripper does what (right starts / left stops), the press timings and the LED patterns are fixed fleet-wide and cannot be changed on site, and the console offers no way to change them; the values in effect are shown on the console's System → Capture settings page (see [System settings](system.md)).

## LEDs {#leds}

| LED | Colour and pattern | Meaning |
|---|---|---|
| <span class="tc-lamp green solid"></span> | Green Solid | Standby: ready to record |
| <span class="tc-lamp green breathe"></span> | Green Breathing | Recording (one bright-dark cycle per second) |
| <span class="tc-lamp white flash"></span> | White One flash | Saved (on for 0.4 s) |
| <span class="tc-lamp amber solid"></span> | Yellow Solid | Recording failed to start (on for 2 s), or a fatal problem while recording (stays on) |
| <span class="tc-lamp amber pulse"></span> | Yellow Pulse | Suspect data: still recording, but that take is questionable (on 0.2 s, off 0.8 s, 3 times) |
| <span class="tc-lamp amber strobe"></span> | Yellow Fast blink | Action refused, e.g. start pressed while already recording (0.1 s on/off, 3 times) |
| <span class="tc-lamp purple blink"></span> | Purple Blink | Delete confirmation, waiting for your second double-click; 0.3 s on/off, cancels on timeout |
| <span class="tc-lamp purple solid"></span> | Purple Solid | The 3-second cool-down just after deleting; double-clicks are ignored |
| <span class="tc-lamp red solid"></span> | Red Solid | System problem (e.g. a gripper dropped out, lit by the backpack) |
| <span class="tc-lamp red burst"></span> | Red Burst | Gripper-side problem (lit by the gripper itself, not via the backpack) |

Recording is breathing green; red only ever means a fault. Fast blink and pulse are both yellow and differ only in rhythm: the fast blink is dense, the pulse sparse. The console's System → Capture settings page renders this table as an animated legend that plays each shape and rhythm, so the two are easy to tell apart (see [System settings](system.md)).

## Voice prompts {#voice-cues}

While collecting, both hands are on the grippers and your eyes on the scene, so the device **announces key moments through the Pico headset**, which you hear while wearing it, complementing the LEDs; no tablet is needed nearby and the browser plays no part. When the headset is not connected (for example the "Pico disconnected" announcement), the backpack's speaker plays it instead.

| When | What it says |
|---|---|
| Recording starts | "Recording started." |
| An episode finishes | "Recording complete. Please reset the scene." — reset the scene and get ready for the next one |
| A fatal problem while recording | "Recording failed." — that episode is a write-off |
| A gripper drops off while recording | "Gripper connection failed." |
| The headset drops off while recording | "Pico connection failed." |
| A tracker drops off while recording | "Tracker connection failed." — the headset may still be connected, so check the tracker on your hand first |
| Right gripper single press to mark a subtask | Subtask marker tone (no speech) |

The audio language can be Chinese or English. When the page loads or the console's interface language changes, the audio language follows the interface language; an audio language chosen separately in the settings lasts until the next page load or interface language change. For English playback through the headset, XTac-UMI XR on the headset must include the English audio; if it is missing, that prompt plays from the backpack's speaker instead, still in English.

The toggle, the audio language, the per-line preview and the 0–100 volume slider are all on the console's System → [Capture settings](system.md#voice) page; the preview also shows where the sound played and why. The toggle and volume survive a reboot. The wording and the timing are fixed values that cannot be changed on site, so every device in a fleet behaves the same.
