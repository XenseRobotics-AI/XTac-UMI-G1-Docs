# Calibration and self-check

This page covers two one-off jobs: calibrating the leader gripper's zero and travel, and confirming the Pico4 Ultra tracker chain is live. Check the whole chain with the [preview](recording.md#preview) before recording.

## Gripper calibration (zero + travel) {#41}

### When you need it

`gripper.pos` is a normalised opening: `0.0` is fully closed, from the encoder zero latched in calibration step 1; `1.0` is fully open, from the travel maximum written in step 2 (command set ≥ V2.1). Both values live in MCU flash and survive power cycles and host changes. Two situations call for calibration:

| Situation | How it shows | Who catches it |
|---|---|---|
| Never calibrated | The collection program **refuses to connect** to the leader gripper, with the calibration command in the error | The program; you cannot miss it |
| Calibrated, but the stored value no longer matches the real travel (the encoder was refitted, a mechanical limit moved, or the firmware was erased) | It connects, but `gripper.pos` does not reach `1.0` at the mechanical limit | Only you, in the preview; see [Confirm it took effect](#413) |

The first case's error:

```text
This leader gripper has no encoder-max calibration, so its jaw travel is unknown
and gripper.pos cannot be computed (...).

Calibrate it once, then re-run:

    python third_party/taccap-gripper/python/examples/calibrate.py <left|right>
```

!!! danger "Calibrating one side of a dual-gripper rig is worse than calibrating neither"
    Calibrating one side leaves `left_gripper.pos` and `right_gripper.pos` on different scales: the same grip reads differently on each side, and the data does not show it. If you calibrate, calibrate both sides.

### How to calibrate

Run once per unit (the path is relative to the xense-taccap-lerobot workspace; in the SDK repository it is `python/examples/calibrate.py`):

```bash
python third_party/taccap-gripper/python/examples/calibrate.py left
python third_party/taccap-gripper/python/examples/calibrate.py right
```

- **Side**: read from the firmware SN (via `Cmd::GetSn`, not the CH343 chip serial), the same rule collection uses, so `calibrate.py left` always calibrates the `left` unit.
- **Check**: the script prints the resolved firmware SN and every gripper the scan saw; two units on the same side raise an error listing both SNs.
- **Pin a unit**: pass its firmware SN directly (`calibrate.py TCGU01A28Z0024m`; that SN is an example).

On firmware that is too old, the script exits and changes nothing:

```text
✗ encoder-max calibration needs command set >= V2.1 (leader >= 1.2.0); this gripper reports 1.1.0.
  Nothing was changed. Flash it first: ...
```

Flash first per [Firmware OTA upgrade](versions.md#ota): the image is chosen by role, and update the SDK before the firmware.

Once the version passes, the script prints the current reading (raw and clamped); follow the two prompts:

1. Fully closed → Enter. It sends `SetEncoderZero` to latch the zero, then re-reads to verify the residual (tolerance ±0.01 rad).
2. Fully open to the mechanical limit → Enter. The angle goes straight into `EncoderMaxCal` in MCU flash, with no second confirmation; a 10 Hz live readout follows for checking.

!!! warning "Get the jaw in position first, then press Enter"
    The firmware latches the raw count the instant it receives the command; moving the jaw afterwards wastes the calibration.

Output looks like:

```text
================================================================
  TacCap leader-gripper encoder calibration
================================================================
  requested    : left  (resolved by side)
  firmware SN  : TCGU01A28Z0031m
  side         : Left
  mcu serial   : 5C96089694
  mcu device   : /dev/serial/by-id/usb-1a86_USB_Dual_Serial_5C96089694-if02
  visible      : TCGU01A28Z0032m (Right), TCGU01A28Z0031m (Left)

Step 1/2: hold the gripper FULLY CLOSED.
  → press [Enter] when held closed:
  post-latch reading: raw=+0.0058 rad (+0.33°)   cooked=+0.0058
  ✓ zero latched OK (|raw post-zero| ≤ 0.010 rad)

Step 2/2: open the gripper to its MECHANICAL LIMIT.
  → press [Enter] when fully open:
  fully-open reading: +1.1486 rad  (+65.81°)
  ✓ stored: max_rad = 1.1486 rad (65.81°)
```

A previously calibrated unit gets an extra `existing span: … — will be overwritten` header line.

- **Closed is always 0**: there is no `gripper_closed_rad` config; negative drift is clamped to 0 (the raw value stays in `raw_position_rad`), and beyond -0.1 rad it triggers a rate-limited warning.
- **Fields**: `position_rad` is still raw radians; normalisation only adds a `position` field.

### Confirm it took effect {#413}

First, the startup log prints this as each side connects:

```text
[left]  Jaw normalised by the firmware's encoder-max calibration
```

If that line is missing, stop looking: an uncalibrated leader does not connect, and the program exits with the calibration command in the error.

Second, the curve in Rerun. Run with `--display_data=true` and find `gripper.pos` in the scalar panel:

| Action | Expected |
| --- | --- |
| Fully open | reaches **1.0** |
| Fully closed | drops to **0.0** |

!!! warning "Clearly short of 1.0 wide open → recalibrate that unit"
    If a fully open jaw only reaches around `0.8`, the travel maximum in flash no longer matches the real travel, and the program does not raise. Recalibrate with the same command.

### Scope

- **Leader only**: the leader has no auto-calibration, so this cannot be skipped. The follower rejects the command; since V1.9 it auto-calibrates at power-on (close to stall for the zero, open to stall for the travel maximum), and its `gripper.pos` is normalised by `gripper_open_rad`.
- **Firmware**: command set ≥ V2.1 (that is leader ≥ 1.2.0 / follower ≥ 1.1.0, [the difference](versions.md#v21)); on older firmware the leader errors out at collection time and asks for the OTA, see [Firmware OTA upgrade](versions.md#ota).

## Pico4 Ultra tracker self-check

The tracker needs no calibration, and its side is matched from the SN; binding is in [Pico4 headset and trackers](../common/pico4.md#pico-tracker-bind). The command below only reads: it prints the pose to confirm the chain and the assembly.

```bash
python -m lerobot.robots.taccap_gripper.check_tracker
# Pin a specific tracker SN (like PC2310MLL3200496G):
python -m lerobot.robots.taccap_gripper.check_tracker <tracker SN>
# Apply that side's built-in tracker→TCP mount transform:
python -m lerobot.robots.taccap_gripper.check_tracker --side right
```

Prints `raw` (the tracker's own pose) and `ee` (the TCP after the mount transform) at 10 Hz. Wave the gripper: `raw xyz` should change smoothly and the SN should match ([Reading a tracker SN](../common/pico4.md#pico-tracker-sn)).

- **Mount transform**: the rigid tracker-to-TCP offset is built in (measured off the CAD assembly), each side separately; the two are close to mirror images but not identical (0.03° apart in rotation, 1.27 mm in translation).
- **`--side`**: picks which side to apply; without it the transform is identity and `ee` follows `raw`.
- **Override**: after re-machining the mount, set `--robot.tracker_to_ee_pos` / `--robot.tracker_to_ee_quat`; the two are independent, so you can pin just the translation.
- **Pivot check**: rest the midpoint of the two fingers on a fixed point and sweep the handle through many orientations; `ee xyz` should barely move while `raw xyz` swings widely, and the drift is the transform's error. Test both sides; a left value mirrored the wrong way makes `ee` swing about twice as far as it should.
- **Rerun**: add `--display_data=true` when you [preview before recording](recording.md#preview) to see gripper data and tracker poses together.
- **Quaternion jumps**: hemisphere flips are handled by a continuity fix; if you still see jumps, file a bug.

Next → [Data collection](recording.md).
