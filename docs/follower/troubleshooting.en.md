# Follower gripper troubleshooting

Run the [self-check](setup.md#self-check) first; most problems can be identified from its output.
On this page, **power-cycle** means unplugging the 24V power cable, waiting about 2 seconds and plugging it back in; the USB cable can remain connected.

## Device cannot be found or opened {#connect}

??? failure "A scan does not find the follower gripper"
    **Fix**:

    - Confirm that both the USB cable and the 24V supply are connected; `lsusb` should list `1a86:55d2`. If it does not, try another cable or USB port.
    - Confirm [Host setup · Required on first use](../pc/host-setup.md#first-use) is done: `brltty` removed, the current user in the `dialout` group and logged in again, and the udev rule that keeps ModemManager off installed.
    - Close the collection program and any other program using the gripper, then scan again.
    - If it still shows `Role.Unknown` or an empty serial number, contact [technical support](../common/reference.md#support).

??? failure "The script reports `2 plugged-in grippers report side=Left`"
    **Cause**: a leader and a follower gripper are both connected on the same side.

    **Fix**: specify the follower gripper's full serial number instead, e.g. `follower_status.py TCGU01A24A0001s`.

??? failure "Error `从爪固件版本过低,必须升级后才能使用本 SDK` (follower firmware too old, must be upgraded to use this SDK)"
    **Cause**: the follower firmware is below 1.2.5, the minimum version the SDK requires, so the SDK refuses to open the device.

    **Fix**: upgrade as described in [Upgrade the gripper firmware](firmware.md#mcu-ota), then power-cycle.

??? failure "On opening, the warning `从爪固件 ... 低于 1.2.11` (follower firmware below 1.2.11) appears, or during control the gripper suddenly stops responding to commands and the grip force drops"
    **Cause**: in gripper firmware earlier than 1.2.11, an occasional overflow on the control serial port causes the gripper to stop receiving commands permanently while it continues to report data. The grip force then drops and the fingers loosen.

    **Fix**: upgrade to the version bundled with the SDK as described in [Upgrade the gripper firmware](firmware.md#mcu-ota), then power-cycle.

??? failure "`hello()` shows a version other than 0.4.3, or `import` fails"
    **Cause**: the wrong environment is active, the SDK was not rebuilt, or (Developer Kit collection environment) the submodule was not updated.

    **Fix**:

    - Standalone SDK: open a new terminal, run `mamba activate taccap` and rerun `uv pip install -e . --no-build-isolation` in the `TacCap-Gripper` directory; see [Install the SDK and set up the host](setup.md#build).
    - Developer Kit collection environment: from the data-collection repository root, update the submodules and rerun the install script:

    ```bash
    git submodule update --init --recursive
    ./setup_env.sh --install
    ```

    See [Clone the repo and its submodules](../pc/install.md#22).

## Self-check anomalies {#self-check}

??? failure "Error `gripper config is not calibrated`"
    **Cause**: automatic calibration at power-on did not complete, usually because the fingers were obstructed or the 24V supply was not connected at power-on.

    **Fix**: clear any obstructions around the fingers, connect the 24V supply and power-cycle. Wait for the fingers to open and close once automatically, then try again.

??? failure "The data frame rate is well below 100Hz, or `OK` is not shown"
    **Fix**: close other programs using the gripper, try another cable or USB port, power-cycle, and run the self-check again.

??? failure "`get_spec()` shows a motor other than EL05"
    **Fix**: stop using the gripper and contact [technical support](../common/reference.md#support).

## Errors when starting control {#start-errors}

??? failure "Error `ValueError: ... exceeds ...` or `RuntimeError: ... stored motor startup torque limit ...`"
    **Cause**: a torque value in the controller configuration exceeds the motor's rating.

    **Fix**: generate the configuration with `for_spec(g.motor.get_spec())` and keep the grip force at or below 1.1N·m. If the error persists, contact [technical support](../common/reference.md#support).

??? failure "Error `SysBusy` immediately after power-on, or the motor does not respond"
    **Cause**: for about 10 seconds after power-on, the gripper performs automatic calibration.

    **Fix**: wait for the fingers to open and close once and come to rest before starting control.

## Problems during motion {#fault}

??? failure "The controller enters `FAULT`"
    Check `c.snapshot().fault_reason`:

    - `motor status stream stale`: the gripper's data stream was interrupted, usually because USB disconnected or the 24V supply dropped. Check the wiring, then power-cycle.
    - `motor status reports a fault`: the motor reported a fault; run `print(g.motor.fault_report())` for details.
    - Any other reason: record the exact message.

    After resolving the cause, call `g.motor.clear_fault()` and `c.reset()` to continue. If the fault recurs, contact [technical support](../common/reference.md#support) and include the output of `fault_report()`.

??? failure "While gripping a hard object, the gripper suddenly releases and USB disconnects"
    **Cause**: the firmware is outdated, so the motion safety envelope is not in effect, and excessive torque caused the 24V supply voltage to drop.

    **Fix**: power-cycle, [upgrade the firmware](firmware.md#mcu-ota) to the version bundled with the SDK, then confirm `ENFORCED` in the [motion check](setup.md#motion-check). Also confirm that the 24V power adapter meets the specification.

??? failure "The grip force drops after gripping for a long time"
    **Cause**: as the motor heats up, the firmware automatically reduces output. This is a protection mechanism, not a fault.

    **Fix**: reduce the grip force or shorten the gripping time.

??? failure "Starting another script causes the gripper under control to release"
    **Cause**: the script scans for devices at startup, which interrupts the running control program.

    **Fix**: while control is running, do not start any other gripper program or example script.
