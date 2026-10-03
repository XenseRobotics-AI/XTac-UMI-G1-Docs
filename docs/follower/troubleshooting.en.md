# Follower gripper troubleshooting

Run the [self-check](setup.md#self-check) first; most problems are apparent from its output.
On this page, **power-cycle** means unplugging the 24V power cable, waiting about 2 seconds and plugging it back in; you do not need to unplug the USB cable.

## Device not found or will not open {#connect}

??? failure "The follower gripper is not found by a scan"
    **Fix**:

    - Make sure both USB and 24V are connected; `lsusb` should list `1a86:55d2`. If it does not, try another cable or USB port.
    - Make sure you have been added to the `dialout` group and have logged in again; see [Serial permissions](../pc/host-setup.md#31).
    - Close the collection program and any other program using the gripper, then scan again.
    - If it still shows `Role.Unknown` or an empty serial number, contact [technical support](../common/reference.md#support).

??? failure "The script reports `2 plugged-in grippers report side=Left`"
    **Cause**: a leader and a follower gripper are both connected on the same side.
    **Fix**: use the follower gripper's full serial number instead, e.g. `follower_status.py TCGU01A24A0001s`.

??? failure "It reports `从爪固件版本过低,必须升级后才能使用本 SDK` (follower firmware too old, must be upgraded to use this SDK)"
    **Fix**: upgrade following [Upgrade the gripper firmware](firmware.md#mcu-ota), then power-cycle.

??? failure "On opening it warns `从爪固件 ... 低于 1.2.11` (follower firmware below 1.2.11), or during control the gripper suddenly ignores commands and the grip force drops"
    **Cause**: gripper firmware before 1.2.11, after an occasional overflow on the control serial port, stops receiving commands for good while still reporting data as usual, so the grip force drops and the fingers loosen.
    **Fix**: upgrade to the version bundled with the SDK following [Upgrade the gripper firmware](firmware.md#mcu-ota), then power-cycle.

??? failure "`hello()` shows a version other than 0.4.1, or `import` fails"
    **Cause**: the SDK submodule was not updated, or was not rebuilt after updating.
    **Fix**: from the data-collection repository root, pull the submodules and rerun the install script:

    ```bash
    git submodule update --init --recursive
    ./setup_env.sh --install
    ```

    See [Clone the repo and its submodules](../pc/install.md#22).

## Self-check anomalies {#self-check}

??? failure "It reports `gripper config is not calibrated`"
    **Cause**: the automatic calibration at power-on did not complete, usually because the jaws were blocked or the 24V was not connected at power-on.
    **Fix**: clear the area around the jaws, connect the 24V, power-cycle, and wait for the jaws to open and close once by themselves before trying again.

??? failure "The data frame rate is well below 100 Hz, or `OK` is not shown"
    **Fix**: close other programs using the gripper, try another cable or USB port, power-cycle, and run the self-check again.

??? failure "`get_spec()` shows something other than EL05"
    **Fix**: stop using it and contact [technical support](../common/reference.md#support).

## Errors when starting control {#start-errors}

??? failure "It reports `ValueError: ... exceeds ...` or `RuntimeError: ... stored motor startup torque limit ...`"
    **Cause**: a torque in the controller config exceeds the motor's rating.
    **Fix**: generate the config with `for_spec(g.motor.get_spec())` and keep the grip force at or below 1.1 N·m. If it still fails, contact [technical support](../common/reference.md#support).

??? failure "It reports `SysBusy` right after power-on, or the motor does not respond"
    **Cause**: for about 10 seconds after power-on the gripper is calibrating automatically.
    **Fix**: wait for the jaws to open and close once by themselves and stop before you start.

## Problems during motion {#fault}

??? failure "The controller enters `FAULT`"
    Check `c.snapshot().fault_reason`:

    - `motor status stream stale`: the gripper's data stream was interrupted, usually because USB disconnected or the 24V dropped. Check the wiring, then power-cycle.
    - `motor status reports a fault`: the motor reported a fault; run `print(g.motor.fault_report())` for details.
    - Any other reason: note down the exact text.

    Once the cause is removed, call `g.motor.clear_fault()` and `c.reset()` to continue. If it keeps happening, contact [technical support](../common/reference.md#support) and include the output of `fault_report()`.

??? failure "While clamping something hard, the gripper suddenly lets go and USB disconnects"
    **Cause**: the motion safety envelope is not in effect, and excessive torque dragged down the 24V supply.
    **Fix**: power-cycle, then check and write the envelope following [Write the motion safety envelope](setup.md#envelope); make sure the 24V power adapter meets the specification.

??? failure "The grip force drops after holding for a long time"
    **Cause**: as the motor heats up, the firmware automatically reduces output. This is protection, not a fault.
    **Fix**: lower the grip force or shorten the holding time.

??? failure "Starting another script makes the gripper under control let go"
    **Cause**: the script scans for devices at startup, interrupting the running control program.
    **Fix**: while control is running, do not start any other gripper program or example script.
