# Firmware and motor upgrades

The follower gripper has two pieces of firmware: the **gripper firmware** (bundled with the SDK) and the **motor firmware** (provided by technical support; upgrade it only when they ask you to). If both need upgrading, flash the gripper firmware first, then the motor firmware.

## Check the version {#check-version}

The `[fw]` line of the [self-check](index.md#self-check) output is the gripper firmware version; for the motor firmware see [Motor firmware version](#motor-version).

| Gripper firmware version | Notes |
|---|---|
| 1.2.17 | Bundled with SDK 0.4.5 / 0.4.6, recommended; device timestamps move to a 1 MHz timebase, so the host needs SDK 0.4.5 or newer |
| 1.2.16 | Bundled with SDK 0.4.3 / 0.4.4, fine to use |
| 1.2.11 – 1.2.15 | Usable, upgrade recommended |
| 1.2.5 – 1.2.10 | Opens, but the SDK prompts you to upgrade: after an occasional overflow on the control serial port, the gripper stops receiving commands and the grip force drops. **Upgrade required** |
| Below 1.2.5 | The SDK refuses to open it; upgrade first |

## Upgrade the gripper firmware {#mcu-ota}

!!! danger "Flashing the wrong firmware leaves a gripper that will not start"
    A follower gripper can only take the `slave` firmware and a leader gripper only the `master` firmware; a wrong flash can only be fixed by a factory repair.
    **Before flashing, confirm that the last letter of the serial number is `s`.**

```bash
# 1. Confirm the serial number ends in s
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"

# 2. Flash and confirm when prompted (with only one follower gripper connected)
python python/examples/ota_update.py slave

# 3. Power-cycle (see below)

# 4. Run the self-check to confirm the version
python python/examples/follower_status.py left
```

- With several follower grippers connected, to flash just one of them, give the image file name plus the side or serial number:
  `python python/examples/ota_update.py tc-gu-01-slave-1.2.17.bin left`.
  Do not write `slave left`; that reports `firmware file not found`.
- Flashing takes about 1 second, after which the gripper restarts automatically.
- If the script finds that the firmware does not match the gripper's role it refuses to flash. **Do not force it with `--force`.**
- An interrupted flash does not damage the gripper; the original firmware keeps running, and you can simply flash again.

### You must power-cycle after flashing {#power-cycle}

**Unplug the 24V power cable, wait about 2 seconds and plug it back in; you do not need to unplug the USB cable.** The main board and motor are both powered from 24V, so unplugging only the USB cable does not restart it.
Without a power-cycle the gripper appears to work normally but silently loses data.

## Upgrade the motor firmware {#motor-ota}

This requires gripper firmware 1.2.8 or later. The motor does not need to be removed.

1. Switch the motor into upgrade mode:

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Private)"
    ```

2. Power-cycle (unplug and replug the 24V).
3. Flash the firmware file provided by technical support:

    ```bash
    python python/examples/motor_ota_update.py el05-1.0.5.0.4.bin left --model EL05
    ```

    Type `yes` when prompted to start flashing; when it prompts `confirm the nameplate`, just confirm that the motor's nameplate reads EL05.

4. Power-cycle. If the gripper opens and closes once by itself after power-on, the upgrade succeeded.
   With gripper firmware 1.2.14 or later, the script records the new motor firmware version in the gripper after flashing, so you can [check it](#motor-version) at any time afterwards.

- If the script reports that the motor is still in upgrade mode, or the gripper does not open and close by itself after a power-cycle, run the command below to switch back, then power-cycle again;
  if you do not switch back, the follower gripper cannot be controlled:

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Mit)"
    ```

- If the script reports `no reply`, power-cycle and flash again.

## Motor firmware version {#motor-version}

The motor firmware must be **1.0.5.0.4 or later**. Below that, the velocity feedback is wrong and motion judders; contact [technical support](../common/reference.md#support) for the upgrade file.

Check the version (do not run this while control is running; the read may stop the motor; requires gripper firmware 1.2.14 or later):

```bash
python -c "import xense.taccap as t
g = t.FollowerGripper(t.find_follower().mcu_device)
print(g.motor.motor_version())"
```

Output of the form `MotorVersion(1.0.5.0.4, flash: ...)` gives the version; the word `flash` means it is the record stored in the gripper. If it shows `invalid`, this gripper has no record yet; contact technical support.
