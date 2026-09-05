# Calibration and self-check

This page covers two one-off jobs: calibrating the leader gripper's zero and travel, and confirming the Pico4 Ultra tracker chain is live. Confirm the whole chain is present with the [preview](recording.md#preview) before recording.

## Gripper calibration (zero + travel) {#41}

### When you need it

`gripper.pos` in the dataset is a normalised opening: `0.0` is fully closed, from the encoder zero latched in calibration step 1; `1.0` is fully open, from the travel maximum written in step 2 (command set ≥ V2.1). Both values live in MCU flash and survive power cycles and host changes, so once per unit is enough. Only two situations call for calibration:

| Situation | How it shows | Who catches it |
|---|---|---|
| Never calibrated | The collection program **refuses to connect** to the leader gripper, with the calibration command in the error | The program; you cannot miss it |
| Calibrated, but the stored value no longer matches the real travel (the encoder was refitted, a mechanical limit moved, or the firmware was erased) | It connects, but `gripper.pos` does not reach `1.0` at the mechanical limit (it stops at `0.8`, say) | Only you, in the preview; see [Confirm it took effect](#413) |

The program does not raise for the second case: it knows a value was stored, not whether it is still right. The first case's error is below; finish "How to calibrate" below, then come back:

```text
This leader gripper has no encoder-max calibration, so its jaw travel is unknown
and gripper.pos cannot be computed (...).

Calibrate it once, then re-run:

    python third_party/taccap-gripper/python/examples/calibrate.py <left|right>
```

!!! danger "Calibrating one side of a dual-gripper rig is worse than calibrating neither"
    With neither calibrated the two scales at least agree. Calibrating one side leaves `left_gripper.pos` and `right_gripper.pos` on different scales: the same grip reads differently on each side, and nothing in the data shows it. If you calibrate, calibrate both sides.

### How to calibrate

Pick by side and run once per unit (the path is relative to the xense-taccap-lerobot workspace; in the SDK repository it is `python/examples/calibrate.py`):

```bash
python third_party/taccap-gripper/python/examples/calibrate.py left
python third_party/taccap-gripper/python/examples/calibrate.py right
```

Side is read from the firmware-burned SN (read back with `Cmd::GetSn`, not the CH343 chip serial), the same rule collection applies to `left_gripper.pos`, so `calibrate.py left` always calibrates the `left` unit. The script prints the resolved firmware SN and every gripper the scan saw, so you can confirm the pick before anything reaches flash. Two units on the same side raise an error listing both SNs; it does not guess for you. To pin a unit, pass its firmware SN directly (`calibrate.py TCGU01A28Z0024m`; that SN is an example).

The script checks the firmware version first; if too old, it exits and changes nothing:

```text
✗ encoder-max calibration needs command set >= V2.1 (leader >= 1.2.0); this gripper reports 1.1.0.
  Nothing was changed. Flash it first: ...
```

If you see this, flash first per [Firmware OTA upgrade](versions.md#ota), then come back: the image is chosen by role, and update the SDK before the firmware.

Once the version check passes, one command does both steps. The script first prints the current reading (raw and clamped); then follow the prompts:

1. Hold the gripper fully closed → Enter. It sends `SetEncoderZero` to latch the zero, then re-reads to verify the residual (tolerance ±0.01 rad).
2. Open fully (against the mechanical limit) → Enter. It samples the angle and writes it to `EncoderMaxCal`, straight to MCU flash with no second confirmation, then shows a 10 Hz live readout for a visual check.

!!! warning "Get the jaw in position first, then press Enter"
    The firmware latches the raw count at the instant it receives the command. The jaw must already be at the target position before you press Enter; moving it afterwards wastes the calibration.

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

A unit that was calibrated before also gets an `existing span: … — will be overwritten` line in the header.

The zero lives in firmware; there is no `gripper_closed_rad` config, and closed is always 0: negative drift is clamped to 0 (the raw value stays in `raw_position_rad`), and raw negative drift beyond -0.1 rad triggers a rate-limited warning. `position_rad` is still the raw radians; normalisation only adds a `position` field.

### Confirm it took effect {#413}

First, the startup log. With calibration in effect, the collection program prints this when connecting each side:

```text
[left]  Jaw normalised by the firmware's encoder-max calibration
```

If that line is missing, stop looking: an uncalibrated leader does not connect at all; the program exits with the calibration command in the error.

Second, the curve in Rerun. Run with `--display_data=true` and find `gripper.pos` in the scalar panel:

| Action | Expected |
| --- | --- |
| Fully open | reaches **1.0** |
| Fully closed | drops to **0.0** |

Connecting at all means the travel maximum is in effect; this step checks whether the value is still accurate.

!!! warning "Clearly short of 1.0 wide open → recalibrate that unit"
    If a fully open jaw only reaches around `0.8`, the travel maximum in flash no longer matches the real travel, and the program does not raise for this. Just run the calibration again; the command is identical to the first time.

### Scope

- Manual calibration is leader-only. The follower gripper rejects the command: since V1.9 it uses the firmware's power-on auto-calibration (close to stall for the zero, open to stall for the travel maximum), and during collection its `gripper.pos` is still normalised by `gripper_open_rad`. The leader has no auto-calibration, and collection uses the leader, so manual calibration cannot be skipped.
- Needs firmware command set ≥ V2.1 (that is leader ≥ 1.2.0 / follower ≥ 1.1.0, [the difference](versions.md#v21)); on older firmware the leader also errors out at collection time and tells you to do the OTA first. Flashing is in [Firmware OTA upgrade](versions.md#ota).

## Pico4 Ultra tracker self-check

The tracker needs no calibration: the mount transform is built in, and the side is matched from the SN automatically. Binding the tracker to the gripper is done in [Host and Pico4 setup](host-setup.md#pico-tracker-bind). The command on this page only reads, never writes: it prints the pose to confirm the chain is live and the assembly is correct.

```bash
python -m lerobot.robots.taccap_gripper.check_tracker
# Pin a specific tracker SN (like PC2310MLL3200496G):
python -m lerobot.robots.taccap_gripper.check_tracker <tracker SN>
# Apply that side's built-in tracker→TCP mount transform:
python -m lerobot.robots.taccap_gripper.check_tracker --side right
```

Prints `raw` (the tracker's own pose) and `ee` (the TCP after the rigid mount transform) at 10 Hz. Wave the gripper: `raw xyz` should change smoothly and the SN should match what you expect ([Reading a tracker SN](host-setup.md#pico-tracker-sn)).

You do not measure the mount transform: the rigid offset from tracker to TCP is built into `ee_transform.tracker_to_tcp` (measured off the CAD assembly), with each side measured separately; the two are close to mirror images but not identical (0.03° apart in rotation, 1.27 mm in translation). `--side` picks which side's value to apply; without `--side` the transform is identity and `ee` simply follows `raw`. Override it only after something like re-machining the mount, via `--robot.tracker_to_ee_pos` / `--robot.tracker_to_ee_quat`; the two are independent, so you can pin just the translation and keep the built-in rotation.

The pivot check needs no extra hardware: rest the midpoint of the two fingers on a fixed point and, holding the handle, sweep through as many orientations as you can. `ee xyz` should barely move while `raw xyz` swings widely; the drift you see is the transform's error. Test both sides; a left value mirrored the wrong way shows up as `ee` swinging about twice as far as it should.

To see both grippers' IMU/encoder and the trackers' 6-DoF pose in a single Rerun view, use the SDK example `rerun_dual_with_tracker.py` (needs `xensevr_pc_service_sdk` and a running XenseVR PC Service). It skips LeRobot's automatic SN matching, so you must pass the SNs explicitly. SNs belong to a specific unit: on another unit, use the ones it reports, and shake each gripper in turn to verify left and right:

```bash
python third_party/taccap-gripper/python/examples/rerun_dual_with_tracker.py \
    --left-tracker-sn  <left tracker SN> \
    --right-tracker-sn <right tracker SN>
```

Quaternion hemisphere flips (sign jumps) are already handled by a continuity fix inside the pose reader; if you still see jumps, file a bug.

Next → [Data collection](recording.md).
