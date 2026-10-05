# Setup and self-check

Complete these four steps in order before putting the follower gripper to work. Hardware mounting and wiring are in [Gripper connection and serial numbers → Follower gripper mounting and connection](../common/gripper.md#follower-install);
the follower gripper needs **both USB Type-C and 24V connected**.

## 1. Install the SDK {#install}

Once the collection environment is installed ([Installation](../pc/install.md)), SDK 0.4.1 is already included; there is nothing extra to install. The example scripts are in the data-collection repository under
`third_party/taccap-gripper/python/examples/`. For serial port permissions, see [Serial permissions](../pc/host-setup.md#31).

Verify (from the data-collection repository root, inside the collection environment):

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.4.1`. A different version means the SDK submodule was not updated or not rebuilt; see
[Follower gripper troubleshooting](troubleshooting.md#connect).

All subsequent commands are run from the `third_party/taccap-gripper` directory, inside the collection environment. To install the SDK on its own without the data-collection repository, see
[SDK appendix → Install and build](../sdk/install.md).

## 2. Find the device {#discover}

After power-on, wait for the gripper to open and close once by itself and come to rest (about 10 seconds), then run:

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

One line per gripper. A follower gripper should show `Role.Follower` and a serial number ending in `s`, for example:

```text
Side.Left Role.Follower TCGU01A24A0001s
```

The example scripts all select a gripper by `left`, `right` or the full serial number; with only one connected you can omit it.

!!! warning "When leader and follower grippers are on the same PC, use the full serial number"
    `left` / `right` only look at the side, not the role. If a leader and a follower gripper are both connected on the same side, the script reports an error;
    if only the leader gripper is connected, the control scripts will open it as if it were the follower. With this kind of wiring, always use the follower gripper's full serial number.

!!! danger "Do not scan while a collection or control program is running"
    Scanning for devices (which every example script does at startup) interrupts any other program that is running, and a follower gripper that is holding something goes limp. Stop the other programs first.

## 3. Self-check {#self-check}

```bash
python python/examples/follower_status.py left
```

This script is read-only and does not move the motor. The lines to look at in normal output (with parts omitted):

```text
[fw] FirmwareVersion(1.2.14.0)
...
[归一化] g.position() = 0.9183
...
[故障] 电机 0x00000000  锁存 0x00000000  固件 0x00000000
...
  299 帧 / 3.01 s = 99.5 Hz
  固件状态时间戳推进 3005 ms,墙钟 3006 ms  OK
```

| Where to look | Normal | If not normal |
|---|---|---|
| `[fw]` | 1.2.14 | Below 1.2.11 prints an upgrade prompt; below 1.2.5 exits with an error. In either case [upgrade the firmware](firmware.md#mcu-ota) first |
| `[归一化]` (normalized) | Between 0 and 1 | Reports `not calibrated`: clear the area around the jaws and power-cycle |
| `[故障]` (fault) | All 0 | See [Troubleshooting](troubleshooting.md#fault) |
| `[开流读]` (stream read) | About 100 Hz, shows `OK` | Power-cycle and try again; if still not normal, see [Troubleshooting](troubleshooting.md#self-check) |

## 4. Motion check {#motion-check}

Use the keyboard console to move the follower gripper once and confirm the safety protection is active and opening, torque and temperature are all normal:

```bash
python python/examples/gripper_console.py left
```

!!! danger "This drives the real motor"
    Clear the space around the fingers, keep your hands away, and be ready to pull the 24V.

The top line of the console shows the gripper and its motion safety envelope; the line below is live data:

| Where to look | Normal |
|---|---|
| Top `envelope:` | Ends with `ENFORCED`: the firmware's torque and overheating protection is active; if it says `未生效` (not in effect), the firmware is too old, so [upgrade it](firmware.md#mcu-ota) first |
| `Act[0-1]` | Near 1 after `o`, near 0 after `c`; `N/A` means not calibrated, so power-cycle |
| `Torq(+闭合)` | Near 0 when opening and closing empty; with a pen held between the fingers press `c`: it settles at 1.1 N·m and does not keep rising |
| `Temp(C)` | Near room temperature; it rises slowly while gripping, and above 90 °C the firmware lowers the torque automatically |
| `State` | `EN` while moving; for `FAULT` and the like see [Troubleshooting](troubleshooting.md#fault) |

Common keys: `o` / `c` fully open / close, `j` / `k` open / close one step, `d` release the motor, `q` quit. All keys are in [Motion control](control.md#first-motion).

If all of this checks out, the follower gripper is ready to use.

Next, see [Motion control](control.md).
