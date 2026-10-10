# Versions and upgrades

Serial and version numbers here are examples; go by what you read on your own devices. Full change history: [CHANGELOG](https://github.com/XenseRobotics-AI/xense-taccap-lerobot/blob/main/CHANGELOG.md); feedback: [Support and feedback](../common/reference.md#support).

## You must upgrade to the latest versions {#required}

!!! warning "Bring every item up to the versions in the table below before collecting; this is not optional"
    - The firmware needs [command set V2.1](#v21) for travel calibration.
    - The images bundled with SDK 0.4.1 fix the [known defects](#ota-when).
    - `gripper.pos` normalisation only holds once all three are in place.
    - An uncalibrated leader or one on too-old firmware is refused a connection; other mismatches still write to disk "normally", but the data will not line up.

| Component | Minimum | How to check |
|---|---|---|
| `xense-taccap-lerobot` | `0.5.1+xtac.0.1.0` | `pip show lerobot`, or look at `pyproject.toml` |
| `xense.taccap` SDK | **0.4.1** | `python -c "import xense.taccap as t; print(t.__version__)"` |
| Gripper firmware | **command set V2.1**, i.e. leader ≥ 1.2.0 / follower ≥ 1.1.0; with a follower gripper (`--robot.role=follower`) the follower needs ≥ 1.2.5 (below 1.2.11 it warns to upgrade) | Run [`calibrate.py`](calibration.md#41) or [read it directly](#check-versions) |
| Encoder calibration on every leader | Zero + travel limit written to flash | [Gripper calibration](calibration.md#41) |
| XenseVR PC Service | ≥ v0.2.0; install v0.2.1 on a new machine | `Version` from `dpkg -s xensevr-pc-service` |

Order: [pull the repo and submodules](#repo-update) and rebuild the SDK (otherwise `import xense.taccap` fails), then [flash the firmware](#ota), then [calibrate the grippers](calibration.md#41) (upgrading produces no calibration values).

```mermaid
flowchart LR
    A[Pull repo + submodules] --> B[Rebuild xense.taccap] --> C[Flash firmware OTA] --> D[Calibrate each leader]
```

- Existing data need not be re-recorded; before mixing it with new data, confirm both batches have `gripper.pos` on the same scale.
- After upgrading, redo the environment verification, the device self-check and a short validation episode.

## Compatibility baseline

Commands and fields should be taken from your local checkout and from the device notes shipped with the SDK.

| Component | Supported range / constraint | Verified baseline |
|---|---|---|
| OS / architecture | Ubuntu 22.04 / 24.04, amd64 | 22.04.5 / 24.04.4, x86_64 |
| Linux kernel | Not a constraint | 6.8 / 6.14 / 7.0 |
| Collection host | Minimum 12th-gen i7, 8GB, 512GB SSD; recommended Core Ultra 9 275HX, 32GB, 1TB NVMe, see [Host specification](install.md#host-spec) | — |
| NVIDIA GPU / driver | Minimum RTX 3060 / 8GB (RTX 5060 Laptop / 8GB or better recommended), driver ≥ 570.144; with no NVIDIA card, only [degraded recording](recording.md#no-gpu) | 570.144 / 580.126.09 / 595.71.05 |
| Python | ≥ 3.12 (`conda_environment.yaml` pins `python=3.12`) | 3.12.13 |
| PyTorch | `torch>=2.2.1,<2.11.0`; `torchvision>=0.21.0,<0.26.0` | 2.10.0 / 0.25.0 |
| `torchcodec` | `>=0.2.1,<0.11.0`, `setup_env.sh` aligns it to the current torch | 0.10.0 |
| PyAV | `av>=15.0.0,<16.0.0`, the install script pins 15.1.0 | 15.1.0 |
| `rerun-sdk` | `>=0.24.0,<0.27.0` | 0.26.2 |
| `opencv-python` | `==4.12.0.88` | 4.12.0.88 |
| NumPy | `>=1.26.4` | 2.2.6 |
| `xense-taccap-lerobot` | Based on lerobot 0.5.1, version `0.5.1+xtac.0.1.0` | `v0.1.0` |
| `xense.taccap` SDK | Matched to the main repo's submodule `third_party/taccap-gripper` | 0.4.1 (tag `v0.4.1`), bundling firmware leader 1.2.6 / follower 1.2.14 |
| Gripper firmware | Command set V2.1 (wire framing V1.8), leader ≥ 1.2.0 / follower ≥ 1.1.0 | leader 1.2.6 / follower 1.2.14, follows the SDK, with `firmware/manifest.json` as the authority, see [OTA](#ota) |
| `xensesdk` | Provided by the install script | 2.1.2 |
| XenseVR PC Service (`.deb`) | ≥ v0.2.0 | v0.2.1 |
| `xensevr_pc_service_sdk` | In the main repo; links the `.deb`'s C SDK | 0.2.1, the version comes from the `.deb` |

The `.deb` (`/opt/apps/roboticsservice/SDK`) is the only source of the Pico4 C SDK and `--install` does not rebuild it, so a machine still on v0.2.0 builds the bindings against the old SDK. v0.2.0 onward relays [head camera](recording.md#56) frames.

## Three numbering schemes: V2.1 is a command set, not a firmware version {#v21}

| Number | Current value | What it is |
|---|---|---|
| Wire framing | `V1.8` | How bytes are packed into frames; changes very rarely |
| **Command set** | **`V2.1`** | The commands the firmware implements. `EncoderMaxCal`, used by travel calibration, came with V2.1 (V2.0 fisheye calibration, V1.9 the LED and the private motor parameters) |
| Firmware build | leader ≥ 1.2.0 / follower ≥ 1.1.0 | The specific image; a threshold, not an equality: a higher build (such as leader 1.2.2) supports V2.1 just as well |

New enough is not defect-free; see [Do I need to flash](#ota-when).

## How to check versions {#check-versions}

The firmware version is not in the SN; read it with `GetVersion`. This also prints the SDK version:

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

Output before flashing (two leaders on the old `fw` 1.2.5; after flashing it should read 1.2.6):

```text
xense.taccap 0.4.1 (needs >= 0.4.1)
  TCGU01A28Z0023m  Left   fw=1.2.5
  TCGU01A28Z0024m  Right  fw=1.2.5
```

- Open both roles with `LeaderGripper`; `FollowerGripper` refuses a follower with firmware older than 1.2.5.
- Only `mcu_device` is passed and `normalize_position` keeps its default `False`, so an uncalibrated gripper still reports.
- The ACK's fourth byte `build` is always 0; compare by `MAJOR.MINOR.PATCH`.

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

`pip show xensevr-pc-service-sdk` shows the `.deb` version read from `dpkg` at build time; for the head camera interface check `has_pico_camera_frame`; for gripper SNs and roles see [Quickstart](quickstart.md#self-check).

## What's new in 0.1.0 {#whats-new}

- **`--robot.type` decides whether the headset is recorded**: bimanual rigs gain `xtac_umi_g1` (headset stereo and head pose), `bi_taccap_gripper` does not record the headset; `--robot.enable_head_camera` contradicting the type is an error, see [Record](recording.md#52).
- The gripper SDK moves to 0.4.1, bundling firmware leader 1.2.6 / follower 1.2.14, see [Firmware OTA](#ota).
- `meta/runtimes/` is no longer written; `meta/info.json` gains `collection_stack`, naming the recording software, see [Dataset](dataset.md).
- `lerobot-check-dataset` requires exact video frame counts: missing frames error, extra frames warn; editing a dataset re-encodes with the collection encoder.
- The Docker image can speak voice prompts from inside the container.
- The repo, submodule and image paths moved to the `XenseRobotics-AI` organisation.
- After moving to v0.1.0 you **must re-run `./setup_env.sh --install`**.

## Repo and submodule update {#repo-update}

Update by release tag, not `main` (it may carry unreleased changes):

```bash
git fetch --tags
git checkout v0.1.0
git submodule update --init --recursive --progress
./setup_env.sh --install     # realign the dependencies and rebuild xense.taccap
git submodule status         # the submodule should match v0.4.1
```

!!! warning "`xense.taccap` must be rebuilt after pulling the submodule"
    `git submodule update` only updates files; without re-running `./setup_env.sh --install`, `import xense.taccap` fails. Even with an unchanged SDK version (0.4.1, say) there can be C++ changes, so re-run it every time.

<span id="submodule-ssh"></span>

!!! warning "The submodule URL is SSH: rewrite it once on machines without a GitHub SSH key"
    `third_party/taccap-gripper` is addressed as `git@github.com:`, so without an SSH key fetching the submodule fails. The repo is public; run this once before cloning or updating to switch to HTTPS:

    ```bash
    git config --global url."https://github.com/".insteadOf "git@github.com:"
    ```

    A machine that already updates fine needs nothing and **must not run `git submodule sync`**, which switches back to SSH. The [Docker path](install.md#docker) is unaffected.

## Firmware OTA upgrade {#ota}

### Do I need to flash {#ota-when}

Run [`calibrate.py`](calibration.md#41) once: if the firmware is too old it exits and prints the current version (sample in [Gripper calibration](calibration.md#41)). Flash if any of these holds:

- `calibrate.py` reports `needs command set >= V2.1` and exits;
- the leader will not connect and the error says to do an OTA first;
- the firmware is below command set V2.1.

V2.1 is only the floor and older firmware has known defects: flash the leader 1.2.6 / follower 1.2.14 bundled with SDK 0.4.1 (see the [follower firmware version table](../follower/firmware.md#check-version)). Unless the board is replaced or the firmware erased, once is enough.

### How to flash

!!! warning "Upgrade the SDK first, then flash the firmware"
    - Images follow the SDK: bring the submodule to SDK 0.4.1 and flash and verify with it to reach 1.2.6 / 1.2.14; never flash with an SDK older than 0.1.7.
    - A new SDK talks to old firmware unchanged, so upgrading the SDK first is always safe.
    - The `version` field in `firmware/manifest.json` is the authority on the image version; do not infer it from the SDK version.

The images live in `third_party/taccap-gripper/firmware/`, current release only; file names carry the version, so let the script pick by role. Each image's file name and version is in the `manifest.json` there:

```bash
python -c "import json;m=json.load(open('third_party/taccap-gripper/firmware/manifest.json'));[print(i['file'],i['version']) for i in m['images'].values()]"
```

| Image | Role |
|---|---|
| `tc-gu-01-master-1.2.6.bin` | Leader gripper (SN ending in `m`) |
| `tc-gu-01-slave-1.2.14.bin` | Follower gripper (SN ending in `s`) |

Pick by role, not hand: `TCGU01A28Z0023m` ends in `m`, so use the leader image; both grippers on a rig are often leaders.

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

- The image name is resolved against the path you gave, the SDK root and the SDK's `firmware/`, in that order, so any directory works; it is checked before connecting.
- `--target-version` is normally unnecessary: it only tags the verification log and partition metadata; the script looks the version up in `manifest.json` by CRC32, so you need it only for an image `manifest.json` does not know.
- The write takes about 1 second and the reboot about 1–3 seconds; the new firmware goes to the spare partition and replaces the running one only after it verifies, so a failed transfer cannot brick the gripper.
- Step 3 must read back at least leader 1.2.0 / follower 1.1.0; the images bundled now read back 1.2.6 / 1.2.14.

Other forms:

- With one leader (or follower) plugged in, the role alone is enough: `ota_update.py master` / `ota_update.py slave`.
- For one of several of the same role, pass the image file name plus a side or SN: `ota_update.py tc-gu-01-master-1.2.6.bin left` (use the actual name in `firmware/`).
- Not `slave left` / `master left`: the first argument is taken as a file name and fails with `firmware file not found`.

!!! danger "Flashing the wrong role leaves a gripper that will not start and needs a factory repair"
    `ota_update.py` identifies the image by CRC32 against `manifest.json` and refuses a role mismatch unless `--force`; a hand-built image is let through with a note. Do not cut power or unplug anything during the upgrade.

!!! danger "You must unplug and replug once after flashing"
    This is a step of the upgrade, not a troubleshooting move.

    - The reboot after OTA is a soft reset: the USB-serial bridge never loses power and the device stays degraded, right version, stream running, error counters at 0, but quietly dropping status frames. Over 60-second runs, OTA alone loses 35 to 39 frames, after unplug and replug 0.
    - Order: flash → unplug and replug → step-3 check → calibration; data before the power cycle is untrustworthy.
    - Leader: unplug and replug USB. Follower: unplug the 24V power cable, wait about 2 seconds and plug it back in, leaving USB connected (controller and motor both run on 24V).
    - Unplug and replug only after the gripper has finished rebooting.

Once at V2.1, go back to [Gripper calibration](calibration.md#41) and set the zero and travel limit.
