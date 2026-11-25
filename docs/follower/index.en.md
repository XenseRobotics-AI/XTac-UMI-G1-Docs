# Follower gripper: overview, install and self-check

The follower gripper mounts on the robot's end effector, opens and closes under motor drive, and performs the motion captured with the leader gripper. This chapter shows how to control it with the `xense.taccap` SDK. It is written against [TacCap-Gripper](https://github.com/XenseRobotics-AI/TacCap-Gripper) **v0.5.0** and applies to both the Backpack Kit and the Developer Kit; features marked “0.4.4 and later” need 0.4.4 or newer.

![XTac UMI G1 follower gripper](../assets/product/follower-scene-front.webp){ width="720" }

## How it differs from the leader gripper {#vs-leader}

| | Leader gripper | Follower gripper |
|---|---|---|
| Purpose | Handheld capture | Mounted on the robot's end effector to open, close and grasp |
| Motor | None | RobStride EL05 |
| Power | USB Type-C | USB Type-C + **24V** |
| IMU / encoder / buttons | Yes | No |
| Travel calibration | Manual | Automatic at power-on |
| Last letter of the serial number | `m` | `s` |
| Firmware bundled with SDK 0.5.0 | 1.3.1 | 1.3.1 |

- Leader and follower firmware are numbered separately; both happen to be 1.3.1 now, and different numbers on the two are also normal.
- Motor: continuous stall rating **1.1N·m** (the torque the fingers can hold indefinitely while pressing against an object; also the default grip force and its upper limit), max. speed 50rad/s.
- Add it to your robot model: [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description) (URDF, Xacro, MJCF, USD; ROS 2 supported).

![Follower gripper, five views](../assets/product/follower-five-views.webp){ width="720" }

## Serial number {#sn}

Taking `TCGU01A24A0001s` as an example:

- The **last letter** is the role: `m` = leader gripper, `s` = follower gripper. Use it to pick the image when flashing firmware.
- The **last digit of the running number**, just before the role letter (`1` here), gives the side: odd = left, even = right. The follower gripper is mechanically not side-specific; the software uses this to tell two follower grippers apart.

## Safety notes {#safety-model}

- The gripper firmware has a built-in **motion safety envelope** (torque limit, thermal derating) that no program can bypass; it is active automatically from firmware 1.2.12. **Older firmware lacks this protection**: pressing against something hard can pull the 24V supply voltage down and make the gripper let go, so [upgrade](firmware.md#mcu-ota) to the firmware bundled with the SDK before use.
- When control stops, the program exits or USB disconnects, the gripper releases and whatever it is holding will drop.
- After power-on the gripper opens and closes once by itself to calibrate (about 10 seconds). During that time do not put anything in it and do not send commands.

Complete the four steps below in order before putting the gripper to work. Mounting and wiring are in [Follower gripper mounting and connection](../common/gripper.md#follower-install); **both USB Type-C and 24V must be connected**.

## 1. Install the SDK and set up the host {#install}

Do this once on every computer that runs the SDK; it is the same for the Backpack Kit and the Developer Kit. It requires Ubuntu 22.04 or 24.04 (x86_64).

!!! tip "Computers that already have the Developer Kit collection environment"
    The collection environment (v0.1.6) already includes SDK 0.5.0 (`third_party/taccap-gripper` in the data-collection repository). Skip steps 1–5,
    go to that directory inside the collection environment and start from [step 6](#host).

### Step 1: install Miniforge (mamba) {#miniforge}

If `mamba --version` prints a version, skip this step. Otherwise:

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

Press Enter through the prompts, and type `yes` at the license and again when asked to initialize the shell. Then **close the terminal and open a new one**.

### Step 2: install system packages {#apt}

```bash
sudo apt update
sudo apt install -y git curl v4l-utils
```

`v4l-utils` provides `v4l2-ctl`, used to inspect the wrist camera.

### Step 3: download the SDK {#clone}

```bash
cd ~
git clone --branch v0.5.0 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
```

The example scripts live in this directory; **do not delete it** after installing.

### Step 4: create the mamba environment {#env}

```bash
mamba env create -f environment.yml
mamba activate taccap
```

This creates an environment named `taccap` (compiler, CMake, OpenCV, Python 3.12, the visuotactile SDK `xensesdk` and the viewer `rerun-sdk`); it takes a few minutes.
From then on, **run `mamba activate taccap` first in every new terminal**; it is active when the prompt starts with `(taccap)`.

### Step 5: build and install the SDK {#build}

From the `TacCap-Gripper` directory, inside the `taccap` environment (takes a few minutes):

```bash
uv pip install -e . --no-build-isolation
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.5.0`.

!!! warning "Build errors or the wrong version"
    - Run `mamba activate taccap` before installing, and keep `--no-build-isolation`.
    - Version is not 0.5.0: this terminal is loading an SDK from somewhere else. Close it, open a new one, run only `mamba activate taccap` and try again.

### Step 6: host setup (miss one and the gripper will not connect) {#host}

Run the three commands in [Host setup · Required on first use](../pc/host-setup.md#first-use) (they apply to Backpack Kit users too): remove `brltty`, add the current user to the `dialout` (serial) and `video` (camera) groups, and install the udev rule that keeps ModemManager off the gripper's serial port. Then **log out and back in** (or reboot), connect the gripper and check each item:

```bash
dpkg -l brltty | grep ^ii                    # no output = brltty removed
groups | grep -o -E "dialout|video"          # should print both dialout and video
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # should be ID_MM_DEVICE_IGNORE=1
```

All later commands run from the `TacCap-Gripper` directory (`third_party/taccap-gripper` in the Developer Kit collection environment), inside the activated environment.

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
    Scanning for devices (which every example script does at startup) interrupts any other program that is running, and a follower gripper that is holding something releases its torque. Stop the other programs first.

## 3. Self-check {#self-check}

```bash
python python/examples/follower_status.py left
```

The script is read-only and does not move the motor. The lines to look at in normal output (with parts omitted):

```text
[fw] FirmwareVersion(1.3.1.0)
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
| `[fw]` | 1.3.1 | Below 1.2.11 prints an upgrade prompt; below 1.2.5 exits with an error. In either case [upgrade the firmware](firmware.md#mcu-ota) first |
| `[归一化]` (normalized) | Between 0 and 1 | Reports `not calibrated`: clear the area around the fingers and power-cycle |
| `[故障]` (fault) | All 0 | See [Troubleshooting](troubleshooting.md#fault) |
| `[开流读]` (stream read) | About 100Hz, shows `OK` | Power-cycle and try again; if still not normal, see [Troubleshooting](troubleshooting.md#self-check) |

## 4. Motion check {#motion-check}

Use the keyboard console to move the follower gripper once:

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
| `Torq(+闭合)` | Near 0 when opening and closing empty; with a pen held between the fingers press `c`: it settles at 1.1N·m and does not keep rising |
| `Temp(C)` | Near room temperature; it rises slowly while gripping, and above 90°C the firmware lowers the torque automatically |
| `State` | `EN` while moving; for `FAULT` and the like see [Troubleshooting](troubleshooting.md#fault) |

`q` quits; all keys are in [Keyboard control](api.md#first-motion). If all of this checks out, the follower gripper is ready to use.
