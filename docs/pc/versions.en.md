# Versions and upgrades

This page gives the version baseline you must reach before collecting, and how to check versions, update the repo and the SDK, and flash gripper firmware. The serial numbers and version numbers in this page are examples; go by what you read on your own devices. The full change history is in the repo [CHANGELOG](https://github.com/XenseRobotics-AI/xense-taccap-lerobot/blob/main/CHANGELOG.md); to report a problem see [Support and feedback](../common/reference.md#support).

## You must upgrade to the latest versions {#required}

!!! warning "Bring all four up to the versions in the table below before collecting; this is not optional"
    The whole chain is a matched set: the firmware needs [command set V2.1](#v21) for travel calibration, SDK 0.4.1 carries the images with the [three known defects](#ota-when) fixed and is also what you flash them with, and the normalisation of `gripper.pos` only holds once all three are in place. A leader gripper that is uncalibrated or on too-old firmware is refused a connection by the collection program; other mismatched combinations can still write to disk "normally", the data simply will not line up with anyone else's, and you cannot tell afterwards.

| Component | Minimum | How to check |
|---|---|---|
| `xense-taccap-lerobot` | `0.5.1+xtac.0.1.0` | `pip show lerobot`, or look at `pyproject.toml` |
| `xense.taccap` SDK | **0.4.1** | `python -c "import xense.taccap as t; print(t.__version__)"` |
| Gripper firmware | **command set V2.1**, i.e. leader ≥ 1.2.0 / follower ≥ 1.1.0; with a follower gripper (`--robot.role=follower`) the follower needs ≥ 1.2.5 (below 1.2.11 it warns you to upgrade) | Run [`calibrate.py`](calibration.md#41); if the version is too old it prints the current version and exits. Or [read it directly](#check-versions) |
| Encoder calibration on every leader | Zero + travel limit written to flash | [Gripper calibration](calibration.md#41) |

The upgrade order cannot be shuffled: first [pull the repo and submodules](#repo-update) and rebuild the SDK (otherwise `import xense.taccap` fails), then [flash the firmware](#ota), and finally [calibrate the grippers](calibration.md#41); the upgrade itself produces no calibration values.

```mermaid
flowchart LR
    A[Pull repo + submodules] --> B[Rebuild xense.taccap] --> C[Flash firmware OTA] --> D[Calibrate each leader]
```

Data you have already collected does not need re-recording. To mix it with post-upgrade data, first confirm that `gripper.pos` is on the same scale in both batches. After upgrading, re-run the environment verification, the device self-check and a short validation episode.

## Compatibility baseline

Commands and fields should be taken from your local checkout and from the device notes shipped with the SDK.

| Component | Supported range / constraint | Verified baseline |
|---|---|---|
| OS / architecture | Ubuntu 22.04 / 24.04, amd64 | 22.04.5 / 24.04.4, x86_64 |
| Linux kernel | Not a constraint | 6.8 / 6.14 / 7.0 |
| Collection host | Minimum 12th-gen i7, 8 GB, 512 GB SSD; recommended Core Ultra 9 275HX, 32 GB, 1 TB NVMe, see [Host specification](install.md#host-spec) | — |
| NVIDIA GPU / driver | Minimum RTX 3060 / 8 GB (RTX 5060 Laptop / 8 GB or better recommended), driver ≥ 570.144; a machine with no NVIDIA card can only [record on the degraded path](recording.md#no-gpu) | 570.144 / 580.126.09 / 595.71.05 |
| Python | ≥ 3.12 (`conda_environment.yaml` pins `python=3.12`) | 3.12.13 |
| PyTorch | `torch>=2.2.1,<2.11.0`; `torchvision>=0.21.0,<0.26.0` | 2.10.0 / 0.25.0 |
| `torchcodec` | `>=0.2.1,<0.11.0`, aligned automatically to the current torch by `setup_env.sh` | 0.10.0 |
| PyAV | `av>=15.0.0,<16.0.0`, the install script pins 15.1.0 | 15.1.0 |
| `rerun-sdk` | `>=0.24.0,<0.27.0` | 0.26.2 |
| `opencv-python` | `==4.12.0.88` | 4.12.0.88 |
| NumPy | `>=1.26.4` | 2.2.6 |
| `xense-taccap-lerobot` | Based on lerobot 0.5.1, version `0.5.1+xtac.0.1.0` | `v0.1.0` |
| `xense.taccap` SDK | Matched to the main repo's submodule `third_party/taccap-gripper` | 0.4.1 (tag `v0.4.1`, submodule `afff1b7`), bundling firmware leader 1.2.6 / follower 1.2.14 |
| Gripper firmware | Command set V2.1 (wire framing V1.8), leader ≥ 1.2.0 / follower ≥ 1.1.0 | leader 1.2.6 / follower 1.2.14, follows the SDK, with `firmware/manifest.json` as the authority, see [OTA](#ota); the SDK refuses a follower below 1.2.5 and warns below 1.2.11 |
| `xensesdk` | Provided by the install script | 2.1.2 |
| XenseVR PC Service (`.deb`) | ≥ v0.2.0; install v0.2.1 on a new machine | v0.2.1 |
| `xensevr_pc_service_sdk` | Bundled in the main repo; links the C SDK from the `.deb` | 0.2.1, the version comes from the `.deb` |

The `.deb` (`/opt/apps/roboticsservice/SDK`) is the only source of the Pico4 C SDK, and re-running `--install` does not rebuild it. The script skips packages whose version already matches, so a machine still on v0.2.0 builds the bindings against the old SDK; install v0.2.1 on a new machine. v0.2.0 does exactly one thing more than v0.1.0, relaying [head camera](recording.md#56) frames; if you do not use it, nothing changes.

## Three numbering schemes: V2.1 is a command set, not a firmware version {#v21}

| Number | Current value | What it is |
|---|---|---|
| Wire framing | `V1.8` | How bytes are packed into frames; changes very rarely |
| **Command set** | **`V2.1`** | Which commands the firmware implements. `EncoderMaxCal`, the command travel calibration uses, was introduced by V2.1 (V2.0 fisheye calibration, V1.9 the LED and the private motor parameters) |
| Firmware build | leader ≥ 1.2.0 / follower ≥ 1.1.0 | The specific image. This is a threshold, not an equality: a higher build (such as leader 1.2.2) supports V2.1 just as well, and there is no need to flash back down; the leader and follower numbers differ simply because they are two firmware images |

Everywhere this manual says "V2.1" it means the command set. New enough is not the same as defect-free; see [Do I need to flash](#ota-when).

## How to check versions {#check-versions}

The firmware version is not in the SN; ask the firmware with `GetVersion`. The following prints the SDK version and every gripper's firmware build in one go:

```bash
python - <<'EOF'
import xense.taccap as t
from xense.taccap import scan_grippers, LeaderGripper, Cmd
print("xense.taccap", t.__version__, "(needs >= 0.4.1)")
for ep in scan_grippers():
    g = LeaderGripper(mcu_device=ep.mcu_device)   # read-only version query, works for both roles
    ack = g.transport.send_cmd(Cmd.GetVersion, b"", 500)
    print(f"  {ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}")
EOF
```

One run from before flashing the firmware (so `fw` is still 1.2.1; after flashing it should read 1.2.2):

```text
xense.taccap 0.1.9 (needs >= 0.1.9)
  TCGU01A28Z0023m  Left   fw=1.2.1
  TCGU01A28Z0024m  Right  fw=1.2.1
```

Open every gripper with `LeaderGripper`: it only reads the version, while `FollowerGripper` refuses a follower whose firmware is older than 1.2.5. Only `mcu_device` is passed and `normalize_position` keeps its default `False`, so a gripper that has never had its travel calibrated still reports its version. Only the last character of the SN matters: `m` is a leader gripper, `s` a follower gripper, and that decides which image to flash. The fourth byte of the ACK, `build`, is always 0; compare versions by the three parts `MAJOR.MINOR.PATCH`.

The other components:

```bash
python - <<'EOF'
import importlib.metadata as M
for p in ("lerobot", "taccap-gripper", "xensesdk", "torch", "torchvision",
          "torchcodec", "av", "rerun-sdk", "opencv-python", "numpy"):
    try:
        print(f"{p:16} {M.version(p)}")
    except M.PackageNotFoundError:
        print(f"{p:16} not installed")
EOF
nvidia-smi --query-gpu=driver_version,name --format=csv,noheader      # must be >= 570.144
dpkg -s xensevr-pc-service 2>/dev/null | grep -E '^(Package|Version|Architecture):'
python -c "import xensevr_pc_service_sdk as xrt; print('pico camera API:', hasattr(xrt, 'has_pico_camera_frame'))"
```

`pip show xensevr-pc-service-sdk` shows the `.deb` version read from `dpkg` at build time; for the head camera interface check `has_pico_camera_frame`; for gripper SNs and roles use the self-check command in [Quickstart](quickstart.md#self-check).

## What's new in 0.1.0 {#whats-new}

- **Whether the headset is recorded is now set by `--robot.type`**: bimanual rigs gain `xtac_umi_g1` (headset stereo images and head pose), and `bi_taccap_gripper` no longer records the headset; a bimanual command that still passes `--robot.enable_head_camera` contradicting the type is rejected with an error. The three tiers are in [Record](recording.md#52).
- The gripper SDK moves to 0.4.1, bundling firmware leader 1.2.6 / follower 1.2.14; follower firmware below 1.2.5 is refused and below 1.2.11 triggers an upgrade prompt, see [Firmware OTA](#ota).
- `meta/runtimes/` is no longer written; `meta/info.json` gains `collection_stack`, naming the collection software that recorded the data, see [Dataset](dataset.md).
- `lerobot-check-dataset` now requires the video frame count to match exactly: missing frames are an error, extra frames a warning; editing a dataset re-encodes with the same encoder used for collection.
- The Docker image can speak voice prompts from inside the container.
- The repo, submodule and image paths moved to the `XenseRobotics-AI` organisation.
- After moving to v0.1.0 you **must re-run `./setup_env.sh --install`**.

## Repo and submodule update {#repo-update}

Update by release tag rather than pulling `main` (`main` may carry unreleased changes):

```bash
git fetch --tags
git checkout v0.1.0
git submodule update --init --recursive --progress
./setup_env.sh --install     # realign the dependencies and rebuild xense.taccap
git submodule status         # the submodule should show afff1b7… (v0.4.1)
```

!!! warning "`xense.taccap` must be rebuilt after pulling the submodule"
    `git submodule update` only updates files; without re-running `./setup_env.sh --install`, `import xense.taccap` fails outright. The submodule can carry C++ changes even when the SDK version number stays the same (0.4.1, say), so re-run it every time you pull the submodule.

<span id="submodule-ssh"></span>

!!! warning "The submodule URL is SSH: rewrite it once on machines without a GitHub SSH key"
    `third_party/taccap-gripper` is addressed as `git@github.com:`. On a machine with no GitHub SSH key the main repo clones but fetching the submodule fails. The submodule repo is public, so switch to HTTPS; run this once before cloning or updating:

    ```bash
    git config --global url."https://github.com/".insteadOf "git@github.com:"
    ```

    A machine that already clones and updates the submodule fine needs nothing, and **must not run `git submodule sync`**, which would switch it to the SSH URL. The [Docker path](install.md#docker) does not fetch the submodule and is unaffected.

## Firmware OTA upgrade {#ota}

### Do I need to flash {#ota-when}

Run [`calibrate.py`](calibration.md#41) once and it tells you: it verifies the firmware first, and if it is too old it exits without changing anything and prints the current version (sample error in [Gripper calibration](calibration.md#41)). Any one of these means you need to flash: `calibrate.py` reports `needs command set >= V2.1` and exits; the leader gripper will not connect and the error tells you to do an OTA first; the firmware is below command set V2.1. Firmware does not regress, and once flashed it does not need flashing again unless the board is replaced or the firmware erased.

But V2.1 is only the floor for working. Leader 1.2.2 / follower 1.1.6 fix three defects present in every older firmware (leader and follower share the code):

| Defect | How it shows up |
|---|---|
| Command-channel livelock | After sustained high-rate commands the gripper stops answering any command at all while the data stream looks entirely healthy; only a power cycle recovers it |
| Logging stalling realtime tasks | Emits about 35 KB/s of blocking logging even when idle, stalling whichever task produced it |
| Out-of-bounds write at boot | Every power-on writes one byte past the end of an array |

The first is nearly indistinguishable from working when it strikes; if you have seen a gripper hang for no clear reason, it is worth upgrading. These two images were built with a local toolchain (`build` in `manifest.json` is `local`) and have been validated on two physical units; if the version in `manifest.json` is higher than what `GetVersion` reads back, flash. The images bundled with the current SDK 0.4.1, leader `1.2.6` / follower `1.2.14`, add the motion safety envelope on top and fix the control serial link going deaf to commands after a single overrun.

The follower's `1.1.6` adds, on top of `1.1.5`, a **motion safety envelope** (error and torque clamps, a configurable temperature wall, zero-speed holding-torque derating) to catch cases like a gripper driven hard into full close browning out the whole machine; commands and protocol are unchanged.

### How to flash

!!! warning "Upgrade the SDK first, then flash the firmware"
    Flash and verify with the SDK 0.4.1 in the data-collection environment, and never flash with an SDK older than 0.1.7; a new SDK talks to old firmware unchanged, so upgrading the SDK first is always safe. Which image ships follows the SDK, so reaching 1.2.6 / 1.2.14 requires the submodule at SDK 0.4.1 first; otherwise flashing fixes nothing. But **the SDK version number alone does not pin the image version**: that same 0.1.9 has shipped follower `1.1.5` and, later, `1.1.6` (which builds on it). The only authority is the `version` field in `firmware/manifest.json`; do not infer it from the SDK version.

Since 0.1.7 the SDK ships the firmware images with the repo, under `third_party/taccap-gripper/firmware/`, which only keeps the current release. The file names carry the version and change with the SDK, so the commands below prefer letting the script pick the image by role, with no file name to remember. Image versions follow the SDK; the `manifest.json` in the same directory (each image's version, byte count and CRC32) is authoritative: `cat third_party/taccap-gripper/firmware/manifest.json`.

| Image | Role |
|---|---|
| `tc-gu-01-master-1.2.6.bin` | Leader gripper (SN ending in `m`) |
| `tc-gu-01-slave-1.2.14.bin` | Follower gripper (SN ending in `s`) |

Pick the image by role, not by which hand it is: `TCGU01A28Z0023m` ends in `m`, so use the leader image; on one rig, both grippers are frequently leader grippers.

```bash
# 1. Confirm each gripper's role
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.firmware_sn, '->', 'master' if g.firmware_sn.endswith('m') else 'slave')"

# 2. Flash: every plugged-in gripper gets the image for its role
python third_party/taccap-gripper/python/examples/ota_update.py --all

# 3. After unplug and replug, confirm the version actually flashed
python -c "
from xense.taccap import scan_grippers, LeaderGripper, Cmd
for ep in scan_grippers():
    g = LeaderGripper(mcu_device=ep.mcu_device)
    ack = g.transport.send_cmd(Cmd.GetVersion, b'', 500)
    print(f'{ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}')
"
```

Other forms:

- With only one leader (or one follower) plugged in, the role alone is enough: `ota_update.py master` / `ota_update.py slave`.
- To flash one of several grippers of the same role, pass the image file name plus a side or SN: `ota_update.py tc-gu-01-master-1.2.6.bin left` (use the name actually present in `firmware/`).
- Do not write `slave left` / `master left`: the first argument is then taken as an image file name and fails with `firmware file not found`.

The image name is resolved against the path you gave, the SDK root and the SDK's `firmware/`, in that order, so it works from any directory, and it is checked before connecting to the device. `--target-version` is normally unnecessary: it only tags the verification log and the partition metadata and does not affect what gets flashed; the script looks the version up in `manifest.json` by the image's CRC32 and fills it in, so you only need it for an image `manifest.json` does not know. The write takes about 1 second and the gripper reboots in about 1–3 seconds; the new firmware is written to the spare partition and does not overwrite the running one until it verifies, so a failed transfer cannot brick the gripper. What step 3 reads back must be not below leader 1.2.0 / follower 1.1.0; flashing the images bundled now reads back 1.2.6 / 1.2.14. Read the version with `LeaderGripper` for both roles; `FollowerGripper` refuses a follower older than 1.2.5.

!!! danger "Flashing the wrong role leaves a gripper that will not start and needs a factory repair"
    `ota_update.py` identifies the image by CRC32 against `manifest.json` and refuses outright on a role mismatch; `--force` is required to override. A hand-built image cannot be identified and is let through with a note. Do not cut power or unplug anything during the upgrade.

!!! danger "You must unplug and replug once after flashing"
    This is a step of the upgrade, not a troubleshooting move. The reboot after OTA is a soft reset: the USB-serial bridge never loses power, and the device stays in a degraded state, right version, stream running, error counters at 0, but quietly dropping status frames. Measured over 60-second runs: OTA alone loses 35 to 39 frames per run, after unplug and replug 0. The order is flash → unplug and replug → step-3 check → calibration; anything measured before the power cycle is untrustworthy. How to power-cycle: on a leader, unplug and replug the USB cable; on a follower, unplug the 24 V power cable, wait about 2 seconds and plug it back in, leaving USB connected (the follower's controller and motor both run on 24 V, so pulling only USB does not restart it). Cutting power during the upgrade corrupts the write; unplug and replug only after the gripper has finished rebooting.

Once at V2.1, go back to [Gripper calibration](calibration.md#41) and set the zero and travel limit; the leader gripper only connects once calibrated.
