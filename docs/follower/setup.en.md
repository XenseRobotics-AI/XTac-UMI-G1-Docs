# Setup and self-check

Complete these four steps in order before putting the follower gripper to work. Step 1 installs the SDK from scratch and applies to both the Backpack Kit and the Developer Kit. Hardware mounting and wiring are in [Gripper connection and serial numbers → Follower gripper mounting and connection](../common/gripper.md#follower-install);
the follower gripper needs **both USB Type-C and 24V connected**.

## 1. Install the SDK and set up the host {#install}

Whether you have the Backpack Kit or the Developer Kit, any computer that runs the SDK to control a gripper needs the setup below (once per computer).
It requires Ubuntu 22.04 or 24.04 (x86_64). Copy and run the steps in order.

!!! tip "Computers that already have the Developer Kit collection environment"
    The collection environment already includes SDK 0.4.3 (`third_party/taccap-gripper` in the data-collection repository). Skip steps 1–5,
    go to that directory inside the collection environment and start from [step 6](#host).

### Step 1: install Miniforge (mamba) {#miniforge}

Check whether it is already installed:

```bash
mamba --version
```

If it prints a version, skip this step. Otherwise:

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

Press Enter through the prompts, type `yes` at the license and again when asked to initialize the shell. Then **close the terminal and open a new one**; `mamba --version` should print a version.

### Step 2: install system packages {#apt}

```bash
sudo apt update
sudo apt install -y git curl v4l-utils
```

`v4l-utils` provides `v4l2-ctl`, used to inspect the wrist camera.

### Step 3: download the SDK {#clone}

```bash
cd ~
git clone --branch v0.4.3 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
```

The example scripts live in this directory; **do not delete it** after installing.

### Step 4: create the mamba environment {#env}

```bash
mamba env create -f environment.yml
mamba activate taccap
```

This creates an environment named `taccap` with the compiler, CMake, OpenCV and Python 3.12; it takes a few minutes.
From then on, **run `mamba activate taccap` first in every new terminal**; it is active when the prompt starts with `(taccap)`.

### Step 5: build and install the SDK {#build}

From the `TacCap-Gripper` directory, inside the `taccap` environment:

```bash
uv pip install -e . --no-build-isolation
```

This takes a few minutes. Verify:

```bash
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.4.3`.

!!! warning "Build errors or the wrong version"
    - Run `mamba activate taccap` before installing, and keep `--no-build-isolation`.
    - Version is not 0.4.3: this terminal is loading an SDK from somewhere else. Close it, open a new one, run only `mamba activate taccap` and try again.

### Step 6: host setup (miss one and the gripper will not connect) {#host}

!!! danger "This is the step most often missed, and without it the gripper will not connect"
    In order: remove `brltty` (the braille driver shipped with Ubuntu, which grabs the gripper's serial port) → add the current user to the `dialout` (serial) and `video` (camera) groups → install a udev rule that stops ModemManager (the modem service) from holding the gripper's serial port on plug-in.

```bash
sudo apt purge -y brltty
sudo usermod -aG dialout,video "$USER"
sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
# XTac UMI G1 MCUs are CH343 USB-serial (1a86:55d2); keep ModemManager off them
ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
```

Then **log out and back in** (or reboot) so the group membership applies. After logging back in, connect the gripper and check each item:

```bash
dpkg -l brltty | grep ^ii                    # no output = brltty removed
groups | grep -o -E "dialout|video"          # should print both dialout and video
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # should be ID_MM_DEVICE_IGNORE=1
```

Why each one matters is in [Host setup · Required on first use](../pc/host-setup.md#first-use).

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

This script is read-only and does not move the motor. The lines to look at in normal output (with parts omitted):

```text
[fw] FirmwareVersion(1.2.16.0)
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
| `[fw]` | 1.2.16 | Below 1.2.11 prints an upgrade prompt; below 1.2.5 exits with an error. In either case [upgrade the firmware](firmware.md#mcu-ota) first |
| `[归一化]` (normalized) | Between 0 and 1 | Reports `not calibrated`: clear the area around the fingers and power-cycle |
| `[故障]` (fault) | All 0 | See [Troubleshooting](troubleshooting.md#fault) |
| `[开流读]` (stream read) | About 100Hz, shows `OK` | Power-cycle and try again; if still not normal, see [Troubleshooting](troubleshooting.md#self-check) |

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
| `Torq(+闭合)` | Near 0 when opening and closing empty; with a pen held between the fingers press `c`: it settles at 1.1N·m and does not keep rising |
| `Temp(C)` | Near room temperature; it rises slowly while gripping, and above 90°C the firmware lowers the torque automatically |
| `State` | `EN` while moving; for `FAULT` and the like see [Troubleshooting](troubleshooting.md#fault) |

Common keys: `o` / `c` fully open / close, `j` / `k` open / close one step, `d` release the motor, `q` quit. All keys are in [Motion control](control.md#first-motion).

If all of this checks out, the follower gripper is ready to use.

Next, see [Motion control](control.md).
