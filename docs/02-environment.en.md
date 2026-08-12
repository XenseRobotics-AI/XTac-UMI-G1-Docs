# 2. Environment Setup

This chapter targets **Ubuntu 22.04 / 24.04 LTS (amd64)** and gets `xense-taccap-lerobot` plus
every hardware SDK installed and verified.

!!! info "Verified environment for the XTac-UMI G1"
    XTac-UMI G1 hardware bring-up and collection were verified inside the `mamba` environment
    `xense-taccap`. The test host currently reads as:

    - OS: Ubuntu 22.04.5 LTS / Ubuntu 24.04.4 LTS
    - Linux kernel: **6.8, 6.14 and 7.0 series all verified** — the kernel version is not a
      constraint
    - Architecture: `x86_64`
    - Python: `3.12.13` (the main repository requires **≥ 3.12**)
    - Repo commit and per-package versions: see [Versions & Support](versions.md) (single source
      of truth, so nothing drifts between copies)

    Ubuntu 22.04 LTS is also covered by this chapter. Other distributions or architectures need
    verifying separately against their actual driver, UVC, serial-permission and `.deb` support.

    An NVIDIA GPU on the collection host is recommended: it lets `--dataset.vcodec=auto` pick the
    GPU H.264 hardware encoder, easing CPU load when several video streams are encoded live.
    **With an NVIDIA GPU the driver must be ≥ 570.144** (check with
    `nvidia-smi --query-gpu=driver_version --format=csv,noheader`).

## Choosing an install path {#choose}

There are two paths. They produce the same collection environment — pick one and follow it
through.

| | **Mamba install from source** | **Docker delivery image** |
|---|---|---|
| What you get | The source repo; you build the environment | A prebuilt image pulled from a public registry, and one script to run |
| Time | Longer — the gripper SDK and the Pico4 bindings are compiled here | Minutes to tens of minutes, depending on how fast you can pull ~21 GB |
| NVIDIA GPU | Optional ([collection works without one](05-data-collection.md#no-gpu)) | **Required**, driver ≥ 570.144 |
| Isolation | Installed into a Mamba env on the host | Lives in a container, host stays clean |
| Editing the code | Easy | Awkward |
| Steps | 2.1 – 2.5 below | [Docker delivery image](#docker) |

**Default to Mamba** — it works **with or without an NVIDIA GPU**, and it is the one to pick if
you will be editing the collection program. The commands in the rest of this manual are written
for this path.

Docker is there for a machine that already has the **NVIDIA driver**, when you would rather not
build an environment yourself.

!!! warning "Both paths need internet access"
    Installing pulls things down — conda fetches conda-forge and PyPI packages, clones the GitHub
    repo and its submodules, and downloads the XenseVR PC Service `.deb`; Docker installs Docker
    Engine and the NVIDIA Container Toolkit. **Neither path works on an offline machine.**

    On a restricted network, set the terminal's proxy up first (the Docker script accepts
    `XENSE_PROXY_URL` — see [One-shot install](#docker)).

Sections 2.1 – 2.5 below are the **Mamba install-from-source** path.

!!! info "On Docker? Skip 2.1 – 2.5 entirely"
    The image already has the Mamba environment, the collection program and all three hardware
    SDKs — nothing to clone, no environment to create, no `setup_env.sh` to run. Go straight to
    [Docker delivery image](#docker) below.

!!! info "Overview"
    Install the system packages → install Mamba → clone the repo (with submodules) → create the
    environment → `setup_env.sh --install` → verify.

## Prerequisite: system packages (apt) {#apt}

The hardware SDKs are **compiled** during `setup_env.sh --install`, and a fresh Ubuntu install does
not even have a compiler:

```bash
sudo apt install -y build-essential cmake pkg-config git curl
sudo apt install -y v4l-utils usbutils   # not needed to record, but this is how you debug a camera
```

`setup_env.sh` checks for these before it starts and **stops with the exact apt line** if any are
missing — otherwise the failure surfaces much later, inside CMake or the linker, where it reads
like a broken SDK and costs an afternoon.

The second line only **warns**, but install it anyway: `v4l2-ctl --list-formats-ext` and `lsusb -t`
are the only two instruments you have when [a camera will not open](03-host-hardware.md#usb-budget),
which happens to be the most common bring-up problem on this hardware. A host without them is a
host nobody can debug remotely.

!!! note "Neither `ffmpeg` nor `libudev-dev` / `libusb-1.0-0-dev` is needed"
    `torchcodec` loads the FFmpeg **shared libraries** the conda environment supplies, so the system
    `ffmpeg` binary is irrelevant. `libudev` and `libusb` are reached at **runtime** by prebuilt
    wheels, through the `libudev1` / `libusb-1.0-0` base packages that any Ubuntu already has —
    nothing here compiles against their headers.

## 2.1 Prerequisite: install Mamba / Miniforge

Mamba is strongly recommended: dependency solving is **~10× faster** than stock conda, and faster
on every channel.

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

## 2.2 Clone the repo and its submodules {#22}

Hardware SDKs live in `third_party/` submodules, so the clone **must** be recursive:

```bash
git clone \
  --recurse-submodules \
  https://github.com/Vertax42/xense-taccap-lerobot.git
cd xense-taccap-lerobot
```

Already cloned without submodules:

```bash
git submodule update --init --recursive --progress
```

Submodules and the packages they install — there is **only one**:

| Submodule | Package installed |
|---|---|
| [`third_party/taccap-gripper`](https://github.com/Vertax42/TacCap-Gripper) | `xense.taccap` (XTac-UMI G1 tactile gripper SDK) |

!!! note "xensesdk is not a submodule"
    `xensesdk` is the visuotactile sensor SDK. `setup_env.sh --install` installs it
    automatically — there is no submodule to pull.

!!! info "`xensevr_pc_service_sdk` (Pico4 tracker / headset camera) has no submodule either"
    Its Python bindings live in the main repo, and the C SDK they
    link against — `PXREARobotSDK.h` plus `libPXREARobotSDK.so` — is copied straight out of the
    [XenseVR PC Service `.deb`](#24) installed in the next step, which ships it already — so there
    is no longer a service-source checkout carried around just to rebuild that library.
    **A recursive clone drops from ~33 MiB to ~1.6 MiB**, and installing no longer runs cmake or
    links it.

    One consequence worth knowing: an update to that C SDK now reaches you through a new `.deb`
    release, not by re-running `--install`.

!!! danger "Rebuild `xense.taccap` after updating the submodule"
    The `taccap-gripper` Python package ships a **compiled build artefact**. `git submodule
    update` only updates the files, it does not rebuild — with updated files against a stale
    build, `import xense.taccap` fails outright, e.g.:

    ```text
    AttributeError: module 'xense.taccap._taccap_native' has no attribute 'GripperAutoCalConfig'
    ```

    After pulling any submodule update touching `cpp/` or `python/bindings/`, rebuild:

    ```bash
    cd ~/xense-taccap-lerobot
    LIBRARY_PATH="${CONDA_PREFIX}/lib" \
      uv pip install -e third_party/taccap-gripper --no-deps --no-build-isolation
    ```

    Or just run `bash setup_env.sh --install` (which handles the other SDKs too). **No sudo
    needed.** Verify afterwards:

    ```bash
    python -c "import xense.taccap as t; print(t.__version__)"
    ```

## 2.3 Create and activate the environment

```bash
./setup_env.sh --mamba
mamba activate xense-taccap
```

!!! tip "Environment name"
    `--mamba` creates `xense-taccap` by default; append a name after `--mamba` to use your own.

## 2.4 One-shot install {#24}

```bash
./setup_env.sh --install
```

This step will:

- update the mamba/conda environment from `conda_environment.yaml`
- install the main package from `pyproject.toml`
- install the `xensesdk` visuotactile sensor SDK
- install the **XenseVR PC Service daemon** (a ~110 MB `.deb`, into `/opt/apps/roboticsservice`)
- build the two hardware SDKs: `xensevr_pc_service_sdk` (Pico4, linked against the C SDK from that
  `.deb`) and `xense.taccap` (gripper, from the submodule)

!!! note "Where the XenseVR PC Service .deb comes from"
    `./setup_env.sh --install` downloads the `.deb` for your architecture straight from the
    [v0.2.1 release](https://github.com/Vertax42/XenseVR-PC-Service/releases/tag/v0.2.1)
    (override the URL with `$XENSEVR_DEB_URL`) and runs `sudo dpkg -i`.

    **When that same version is already installed it skips without downloading a byte**, so
    re-running `--install` no longer waits on 110 MB; a previous download, complete or partial, is
    reused rather than started over.

!!! danger "A failed download now stops the install"
    The C SDK the Pico4 bindings link against comes out of this package (see
    [2.2](#22)), so `--install` stops rather than build against a
    library that is not there. Point `$XENSEVR_DEB` at a local file for an offline or patched
    package.

!!! note "Why the baseline is v0.2.1 rather than v0.2.0"
    The script skips a package whose version already matches. v0.2.1 is the same daemon as v0.2.0;
    what differs is the **rebuilt C SDK** — a host left on v0.2.0 would keep the older SDK and build
    its Pico4 bindings against it. That is the reason to move, not a new daemon feature.

!!! warning "Headset stereo and head pose need PC Service >= v0.2.0"
    Only v0.2.0 and later forward the headset camera's frames, and both the
    [stereo view and the head pose](05-data-collection.md#56) come down that path. Tracking is
    unaffected — if you do not use the headset camera, the version makes no difference.

## 2.5 Verify the install {#25}

All three packages importing means success:

```bash
python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
```

One more if you use the [headset camera](05-data-collection.md#56) — it checks that what your
environment loads is the build that carries the camera API:

```bash
python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
```

`False` means an older version is being loaded; re-run `./setup_env.sh --install`.

Optional — confirm the video codec dependencies load (`torchcodec` is pinned by the PyTorch
compatibility matrix, PyAV is pinned to `15.1.0`; FFmpeg is not part of the conda solve):

```bash
python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
python -c 'import av; print("PyAV OK ->", av.__version__)'
```

!!! tip "Need a system ffmpeg?"
    If you need a system ffmpeg with `libsvtav1`, install it separately (apt, or an official
    static build); the default encoding path on this 0.5.1 fork does not depend on it.

---

## Docker delivery image {#docker}

The image already contains the full `xense-taccap` environment, the CUDA user-space libraries, the
collection program and all three hardware SDKs (XenseSDK, TacCap-Gripper, the Pico4 bindings). The
container also starts the XenseVR PC Service on launch.

!!! warning "The container runs privileged"
    So that tactile sensors, the wrist camera, the gripper serial port and the Pico4 can be
    hot-plugged mid-session, the container runs privileged and shares the host's network and IPC.
    **Only run it on a collection host you trust.**

### Host requirements

- Ubuntu 22.04 / 24.04, **amd64**
- **NVIDIA driver ≥ 570.144** — check with
  `nvidia-smi --query-gpu=driver_version --format=csv,noheader`

The installer **will not install or upgrade the GPU driver** for you (that depends on the card,
Secure Boot and a reboot); it stops and tells you if the driver is missing or too old. Docker
Engine, the Compose plugin and the NVIDIA Container Toolkit are installed automatically if absent.

### One-shot install {#ghcr}

The image is published to the GitHub Container Registry. **The package is public — pulling needs
no login:**

```text
ghcr.io/vertax42/xense-taccap-lerobot
```

Run it as a **normal user**, not root:

```bash
git clone https://github.com/Vertax42/xense-taccap-lerobot.git
cd xense-taccap-lerobot
./docker/install_customer.sh
```

The script, in order: checks the system and GPU driver → installs Docker and the NVIDIA Container
Toolkit as needed (and registers the NVIDIA runtime with Docker) → installs the gripper's serial
udev rule (the ModemManager rule from [3.2](03-host-hardware.md#32)) → pulls the image → runs a
CUDA and graphics smoke test.

Cloning the repo is only how you get `compose.yaml` and this script. **The collection program
itself is in the image** — no submodules to fetch, nothing to build on the host.

!!! tip "Behind a proxy"
    ```bash
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./docker/install_customer.sh
    ```

!!! note "Fully offline machines: the `.tar` bundle still works"
    Ask your delivery contact for the image tar, drop it in the repo root (or pass it as the first
    argument) and the script verifies and imports it instead of going to the network:

    ```bash
    ./docker/install_customer.sh xense-taccap-lerobot-0.0.5-linux-amd64.tar
    ```

    Pulling is the default because **upgrades are much cheaper that way**: the image is tens of GB,
    most of it dependency layers that rarely change, so an upgrade fetches only the layers that
    moved instead of moving a whole bundle again.

### Pin a version before you record {#docker-pin}

The default tag is `latest`, and `latest` **floats** — the next release repoints it, and your
collection environment changes without you asking. Before real collection, pin a version in the
repo root's `.env`:

```dotenv
LEROBOT_IMAGE_TAG=0.0.5
```

Confirm that is what resolves, then pull:

```bash
docker compose config --images
docker compose pull
```

!!! note "The tag line is all you need"
    `compose.yaml` already defaults to `ghcr.io/vertax42/xense-taccap-lerobot`, so **do not set
    `LEROBOT_IMAGE`** — it is only for running under a different image name, e.g. one you built
    yourself.

### Host setup after installing {#docker-host}

The installer already added you to the `docker` group, but **that does not take effect in your
current terminal**. Run these two on the **host** — neither is skippable:

```bash
newgrp docker                    # make docker group membership active in this terminal
xhost +si:localuser:root         # needed to show Rerun and other windows
```

!!! warning "Type them one at a time — do not paste the block"
    `newgrp` opens a **subshell**, so anything pasted after it gets swallowed by that subshell and
    looks like it silently did nothing. Wait for `newgrp` to return, then type the `xhost` line.

    Entering the container without `newgrp docker` gives you `permission denied`.
    **Logging out and back in is the cleaner option**: after `newgrp`, files you create in that
    terminal get group `docker`, which logging back in avoids.

Revoke the `xhost` grant when you are done:

```bash
xhost -si:localuser:root
```

!!! warning "`docker` group membership is close to root"
    Add only the users who need to collect — not every local account.

### Entering the container and verifying

```bash
docker compose run --rm xense-taccap
```

Inside the container, all four imports must pass and the GPU must be visible:

```bash
python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
```

Then check that the Pico4 bindings and the daemon they depend on are **the same version**:

```bash
python -c 'import importlib.metadata as M; print("pico4 ->", M.version("xensevr_pc_service_sdk"))'
dpkg-query -W -f='daemon -> ${Version}\n' xensevr-pc-service
```

```text
pico4 -> 0.2.1
daemon -> 0.2.1
```

!!! warning "These two must match — if they do not, do not record with this image"
    The C SDK the Pico4 bindings link against comes from that `.deb`. A mismatch means the image is
    a half-updated build and the tracker data may be wrong. Pull a different tag, or contact your
    delivery contact.

Then confirm the devices are discovered:

```bash
lerobot-find-cameras
lerobot-info
```

You can also run a single command without an interactive shell:

```bash
docker compose run --rm xense-taccap lerobot-info
```

### Where the data lives, and why `--rm` does not lose it {#docker-data}

Four paths inside the container are **Docker volumes**, so removing the temporary container leaves
them untouched:

| Path in container | Volume | What it holds |
|---|---|---|
| `/data` | `lerobot-data` | **Datasets** (`HF_LEROBOT_HOME=/data/lerobot`) |
| `/root/.xensesdk` | `xensesdk-cache` | Per-serial tactile sensor configuration cache |
| `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face cache |
| `/root/.cache/torch` | `torch-cache` | Torch cache |

On the host these volumes actually live at
`/var/lib/docker/volumes/xense-taccap-lerobot_<volume>/_data`, owned by root, so a plain `ls` needs
sudo. **Going through the container is easier:**

```bash
docker compose run --rm xense-taccap bash -lc 'ls -la /data/lerobot'
```

!!! danger "Never run `docker volume prune`"
    It removes volumes that **no container is currently using** — which is exactly the state your
    data volume sits in most of the time, because the containers are `--rm`. That command will take
    your recorded datasets with it, unrecoverably.

    Use `docker image prune` to reclaim image space and `docker builder prune` for build cache;
    neither touches volumes.

To export data to the host, **create the directory first and pass `--user`** — otherwise the
exported files are owned by root and you can neither delete nor edit them (the container runs as
root, and a mount point Docker creates for you is root-owned too):

```bash
mkdir -p export
docker compose run --rm --user "$(id -u):$(id -g)" -v "$PWD/export:/export" \
    xense-taccap bash -lc 'cp -r /data/lerobot /export/'
```

Already exported as root? Fix it from the container (`chown` on the host would need sudo):

```bash
docker compose run --rm -v "$PWD:/host" xense-taccap \
    bash -lc "chown -R $(id -u):$(id -g) /host/export"
```

!!! tip "Writing datasets straight to a host directory"
    Useful if you have a large disk mounted elsewhere. Edit `compose.yaml` and replace
    `lerobot-data:/data` with `/your/path:/data`.

!!! note "Keep the sensor-config cache"
    The second volume holds each sensor's configuration. Keeping it means a restart does not have
    to re-read sensor flash, which would also re-enumerate the USB devices — **faster to start and
    steadier with it than without.**

!!! note "Device discovery works the same inside the container"
    Compose passes the host's `/dev` and `/run/udev` through, so `/dev/v4l/by-id`,
    `/dev/v4l/by-path` and `/dev/serial/by-path` are all readable inside — which is what
    [the auto-discovery in 3.3](03-host-hardware.md#33) is built on.

!!! tip "Pushing to the Hub from inside the container"
    Put the token in the repo root's `.env` — the same file you pinned the tag in — and it reaches
    the container as `HF_TOKEN`:

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    Without it you have to `hf auth login` every time — the container is `--rm`, so a login does
    not persist.

### Graphics from inside the container {#docker-gui}

The image ships the XKB, Vulkan and XDG runtime libraries Rerun needs and sets
`WGPU_BACKEND=vulkan`; Compose passes `DISPLAY` and the X11 socket through. If no window appears,
do the [`xhost` authorisation](#docker-host) above, then confirm the GPU is visible inside the
container:

```bash
vulkaninfo --summary
```

!!! warning "Do not change `runtime: nvidia` in `compose.yaml` to `gpus: all`"
    They look equivalent and are not. `gpus: all` only requests **compute + utility**: CUDA runs,
    `nvidia-smi` works, but **the graphics libraries are never injected** — NVIDIA's Vulkan ICD is
    absent from the container and Rerun dies with

    ```text
    WGPU error: Failed to create surface for any enabled backend
    ```

    which is a confusing failure, because the GPU is plainly "visible" and only the window fails to
    come up. `runtime: nvidia` is the part that brings graphics in.

    The cost is that it requires the NVIDIA runtime to be registered with Docker (which
    `install_customer.sh` does). If it is not, Compose fails immediately with
    `Unknown runtime specified nvidia` — a far better failure than silently losing graphics. See
    [Troubleshooting](troubleshooting.md#docker).

!!! tip "Working on data only, with no Pico4 attached"
    The container starts the XenseVR PC Service by default. Turn it off when you do not need the
    tracker:

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```

    Its log is at `/tmp/xensevr-service.log` inside the container.

---

With the environment installed, **do the host and hardware configuration next** (serial
permissions, device discovery) — otherwise grippers get listed but cannot be opened.

Next → [3. Host & Device Setup](03-host-hardware.md)
