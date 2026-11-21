# Installation

This page installs `xense-taccap-lerobot` and the three hardware SDKs on the collection PC and verifies them up to `lerobot-info`. Afterwards, do the [Host setup](host-setup.md); otherwise grippers get listed but cannot be opened.

- **Verified**: Ubuntu 22.04.5 / 24.04.4 LTS (amd64), kernel 6.8 / 6.14 / 7.0 series, Python `3.12.13` (≥ 3.12 required), mamba environment name `xense-taccap`. On other distributions or architectures, verify driver, UVC, serial-permission and `.deb` support yourself.
- The repo commit and per-package versions are those in [Versions and upgrades](versions.md).

## Collection PC requirements {#host-spec}

On a bimanual setup six cameras are streamed and encoded at once, with only 33.3ms per frame (30fps). A machine below the minimum specification drops frames without raising an error.

| | **Minimum** | **Recommended** |
|---|---|---|
| CPU | Intel **12th-gen i7** or better (or an AMD equivalent) | Intel **Core Ultra 9 275HX** (24 cores) or equivalent |
| Memory | **8GB** | **32GB** |
| GPU | NVIDIA **RTX 3060 / 8GB VRAM** or better | NVIDIA **RTX 5060 Laptop / 8GB VRAM** or better |
| GPU driver | **≥ 570.144** | Same |
| Disk | 512GB SSD | **1TB NVMe SSD** |
| USB | **One gripper** (3 cameras) can share a single USB 2.0 bus | **Bimanual** (6 cameras) split across **two USB 2.0 buses** (two independent host controllers) |
| OS | Ubuntu 22.04 / 24.04 LTS, **amd64** | Ubuntu 24.04 LTS |

- **CPU**: the main loop, tactile decoding and feeding the encoder all run on the CPU; a 12th-gen i7 is the lowest CPU verified to sustain 30fps.
- **GPU**: `--dataset.vcodec=auto` encodes H.264 on the card; without an NVIDIA card, see [Recording on a collection PC with no NVIDIA GPU](recording.md#no-gpu). Check the driver: `nvidia-smi --query-gpu=driver_version,name --format=csv,noheader`.
- **Memory**: use 32GB when you watch Rerun with `--display_data` or process data while collecting.
- **Disk**: do not record straight onto a spinning disk or a USB external drive; for capacity, see [Planning and estimating disk usage](dataset.md#storage-planning).
- **USB**: see [USB bandwidth budget](host-setup.md#usb-budget).

## Choosing an install path {#choose}

Both paths produce the same collection environment, and both need internet access. The commands on the following pages are written for Mamba.

| | **Mamba (from source)** (default) | **Docker image** |
|---|---|---|
| What you get | The source repo; you build the environment | A prebuilt image to pull and one script to run |
| Time | Longer; the gripper SDK and the Pico4 bindings are compiled on the spot | Minutes to tens of minutes, depending on how fast you can pull the image (about 21GB) |
| NVIDIA GPU | Not required; without one you are on the [degraded recording path](recording.md#no-gpu) | **Required**, driver ≥ 570.144 |
| Isolation | A Mamba environment on the host | In a container; the host stays clean |
| Editing the code | Easy | Awkward |
| Offline / proxy | — | Offline via the `.tar` delivery bundle; proxy via `XENSE_PROXY_URL` |

=== "Mamba (from source)"

    ### System packages {#apt}

    The hardware SDKs are compiled during `setup_env.sh --install`; install the build tools first:

    ```bash
    sudo apt install -y build-essential cmake pkg-config git curl
    sudo apt install -y libusb-dev    # cameras do not connect with a stale libusb, see the box below
    sudo apt install -y v4l-utils     # not needed to record, but this is how you debug a camera
    ```

    - `setup_env.sh` checks these commands first and stops with the matching apt line if any are missing; a missing `libusb-dev` or `v4l-utils` only warns.
    - `v4l2-ctl --list-formats-ext` is for debugging [a camera that will not open](troubleshooting.md#usb-bandwidth).
    - No system `ffmpeg` needed (`torchcodec` uses the FFmpeg shared libraries in the conda environment), nor `libudev-dev`.

    !!! warning "Install `libusb-dev`, and keep it current with the kernel"
        With a stale or missing libusb the cameras will not connect; the failure only comes at `connect()` and the error does not mention libusb. `libusb-dev` also brings the `libusb-0.1-4` runtime (`libusb-0.1.so.4`) the camera stack loads. After a kernel upgrade, upgrade it again and reboot:

        ```bash
        sudo apt update && sudo apt install -y --only-upgrade libusb-dev libusb-1.0-0
        ```

    ### Install Miniforge

    ```bash
    curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
    bash Miniforge3-$(uname)-$(uname -m).sh
    ```

    ### Clone the repo and its submodules {#22}

    !!! warning "On a machine without a GitHub SSH key, run this once before cloning"
        The submodule is addressed as `git@github.com:`, and without an SSH key fetching it fails. The submodule repository is public, so switch to HTTPS:

        ```bash
        git config --global url."https://github.com/".insteadOf "git@github.com:"
        ```

    The hardware SDKs are `third_party/` submodules; clone recursively at the tag:

    ```bash
    git clone \
      --branch v0.1.6 \
      --recurse-submodules \
      https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ```

    Already cloned without the submodules: `git submodule update --init --recursive --progress`. After every later submodule update, rebuild `xense.taccap`, see [Updating the repo and submodules](versions.md#repo-update).

    | Package | Source |
    |---|---|
    | `xense.taccap` (tactile gripper SDK) | The only submodule, [`third_party/taccap-gripper`](https://github.com/XenseRobotics-AI/TacCap-Gripper) |
    | `xensesdk` (visuotactile sensor SDK) | Installed automatically by `setup_env.sh --install` |
    | `xensevr_pc_service_sdk` (Pico4U) | Python bindings in the main repo; the C SDK (`PXREARobotSDK.h` + `libPXREARobotSDK.so`) comes from the [XenseVR PC Service `.deb`](#24) and is updated by a new `.deb`, not by re-running `--install` |

    ### Create and activate the environment

    `--mamba` creates the `xense-taccap` environment by default; append a custom name after `--mamba`:

    ```bash
    ./setup_env.sh --mamba
    mamba activate xense-taccap
    ```

    ### One-shot install {#24}

    ```bash
    ./setup_env.sh --install
    ```

    It updates the environment from `conda_environment.yaml`, installs the main package from `pyproject.toml`, installs `xensesdk` and the XenseVR PC Service daemon, then builds `xensevr_pc_service_sdk` and `xense.taccap`. About the PC Service `.deb`:

    - **Download**: the package for the current architecture (about 110MB) comes from the [v0.2.1 release](https://github.com/XenseRobotics-AI/XenseVR-PC-Service/releases/tag/v0.2.1); `$XENSEVR_DEB_URL` overrides the URL. If the download fails, `--install` stops; for an offline or patched package, point `$XENSEVR_DEB` at a local file.
    - **Install**: `sudo dpkg -i` into `/opt/apps/roboticsservice`; skipped if the same version is installed, and a partial download is reused.
    - **Version**: v0.2.1 rebuilt the C SDK, while v0.2.0 would build the Pico4 bindings against the old SDK. The [headset stereo view and head pose](recording.md#56) need PC Service ≥ v0.2.0; the tracker is unaffected.

    ### Verify the install {#25}

    All three packages import:

    ```bash
    python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
    python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
    ```

    Then confirm the devices are discovered:

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    If you use the [head camera](recording.md#56), run one more check; `False` means an older version is loaded, so re-run `./setup_env.sh --install`:

    ```bash
    python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
    ```

    Optional: confirm the codec dependencies load. `torchcodec` is pinned by the PyTorch compatibility matrix and PyAV to `15.1.0`. The default encoding path does not need a system ffmpeg with `libsvtav1`; install it separately if you want one:

    ```bash
    python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
    python -c 'import av; print("PyAV OK ->", av.__version__)'
    ```

=== "Docker image"

    ### Image contents and host requirements {#docker}

    - **Contents**: the full `xense-taccap` environment, the CUDA user-space libraries, the collection program and the three hardware SDKs (XenseSDK, TacCap-Gripper, the Pico4 bindings). XenseVR PC Service starts on launch.
    - **Privileges**: to hot-plug devices, the container runs in **privileged mode** and shares the host's network and IPC. Use it only on a host you trust.
    - **Host**: Ubuntu 22.04 / 24.04 **amd64**, **NVIDIA driver ≥ 570.144** (check with `nvidia-smi --query-gpu=driver_version --format=csv,noheader`). The script neither installs nor upgrades the GPU driver and stops if it falls short.

    ### One-shot image install {#ghcr}

    The image is public on the GitHub Container Registry; pulling needs no login:

    ```text
    ghcr.io/xenserobotics-ai/xense-taccap-lerobot
    ```

    Run as a normal user (not root); cloning the repo is only how you get `compose.yaml` and the script:

    ```bash
    git clone --branch v0.1.6 https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ./docker/install_customer.sh
    ```

    The script, in order: checks the system and GPU driver → installs Docker and the NVIDIA Container Toolkit as needed (and registers the NVIDIA runtime) → installs the [ModemManager blocking rule](host-setup.md#32) → pulls the image → runs a CUDA and graphics smoke test. The script **does not remove `brltty`**; you still have to [remove it](host-setup.md#brltty) yourself.

    ```bash
    # Behind a proxy
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./docker/install_customer.sh

    # Offline: ask your Xense contact or distributor for the image .tar bundle, drop it in the repo root
    # or pass it as the first argument; the script then verifies and imports it
    ./docker/install_customer.sh xense-taccap-lerobot-0.1.6-linux-amd64.tar
    ```

    Pulling online stays the default: an upgrade fetches only the layers that changed.

    ### Pin a version before you record {#docker-pin}

    The default `latest` floats with each release. Before real collection, pin a version in the repo root's `.env`; `compose.yaml` already points at the official image, so write only the tag line. `LEROBOT_IMAGE` is only for a different image name:

    ```dotenv
    LEROBOT_IMAGE_TAG=0.1.6
    ```

    Confirm this version resolves, then pull; the repository name shown by `docker compose config --images` may differ from the one above, so check the tag:

    ```bash
    docker compose config --images
    docker compose pull
    ```

    For the limitations of an image pinned at `0.0.5` or earlier, see [Troubleshooting · Docker image](troubleshooting.md#docker).

    ### Host setup after installing {#docker-host}

    The script added you to the `docker` group, not yet active in this terminal. On the host, **type these one at a time** (`newgrp` opens a subshell that swallows any commands pasted after it):

    ```bash
    newgrp docker                    # make docker group membership active in this terminal
    xhost +si:localuser:root         # needed to show Rerun and other windows from the container
    ```

    - Entering the container without `newgrp docker` gives `permission denied`. Logging out and back in is cleaner: it avoids newly created files belonging to the `docker` group.
    - `docker` group membership is close to root; add only users who collect. Revoke the grant when done: `xhost -si:localuser:root`.

    ### Enter the container and verify

    ```bash
    docker compose run --rm xense-taccap
    ```

    Inside the container, all four imports pass and the GPU is visible:

    ```bash
    python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
    python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
    python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
    ```

    The Pico4 bindings and the daemon must be the same version:

    ```bash
    python -c 'import importlib.metadata as M; print("pico4 ->", M.version("xensevr_pc_service_sdk"))'
    dpkg-query -W -f='daemon -> ${Version}\n' xensevr-pc-service
    ```

    ```text
    pico4 -> 0.2.1
    daemon -> 0.2.1
    ```

    !!! warning "These two lines must match; if they do not, do not record with this image"
        A mismatch means an incomplete image build, and the tracker data may be wrong. Switch to another tag and `docker compose pull` again, or contact Xense or your distributor.

    Confirm the devices are discovered (or without an interactive shell: `docker compose run --rm xense-taccap lerobot-info`):

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    ### Where the data lives, and why removing the container does not lose it {#docker-data}

    Four directories sit on Docker volumes, so `--rm` removing the container does not touch them:

    | Path in container | Volume | What it holds |
    |---|---|---|
    | `/data` | `lerobot-data` | Datasets (`HF_LEROBOT_HOME=/data/lerobot`) |
    | `/root/.xensesdk` | `xensesdk-cache` | Per-serial sensor configuration cache. Do not delete it: with this cache, a container restart skips re-reading flash and re-enumerating USB |
    | `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face cache |
    | `/root/.cache/torch` | `torch-cache` | Torch cache |

    The host path `/var/lib/docker/volumes/xense-taccap-lerobot_<volume>/_data` is root-owned, so `ls` needs sudo; going through the container is easier:

    ```bash
    docker compose run --rm xense-taccap bash -lc 'ls -la /data/lerobot'
    ```

    !!! danger "Do not run `docker volume prune`"
        It removes volumes that "no container is currently using"; with `--rm` containers that is the data volume's normal state, so the data is deleted for good. Use `docker image prune` for images and `docker builder prune` for build cache; neither touches volumes.

    Export to the host as root, handing ownership back in the same command:

    ```bash
    mkdir -p export
    docker compose run --rm --no-deps \
        --entrypoint /bin/bash \
        -v "$PWD/export:/export" \
        xense-taccap \
        -lc "cp -a /data/lerobot /export/ && chown -R $(id -u):$(id -g) /export"
    ```

    None of the three parts can be dropped:

    - `--entrypoint /bin/bash` skips the default startup script (which does `chmod 0700` on the runtime directory).
    - `chown` is in the same command, otherwise the exported files are root-owned and cannot be changed on the host.
    - `mkdir -p export` comes first: a mount point Docker creates is root-owned, and a non-root write into it fails.

    Data recorded by `0.0.5` and earlier is still `0600` after `cp -a`; to make it readable for other users, append:

    ```bash
        && chmod -R u+rwX,go+rX /export
    ```

    !!! warning "Do not switch to `--user` to copy as yourself"
        - `docker compose run --user ...` still runs the startup script and fails with `chmod: changing permissions of '/tmp/xdg-runtime': Operation not permitted`.
        - Videos recorded by `0.0.5` and earlier are `-rw------- root`, so a non-root copy reports `Permission denied` on every `.mp4` (the `0644` metadata copies fine, which looks like a few damaged files). From `0.0.6` on, videos land as `0644`; upgrading does not rewrite recorded files.

    ### Writing data straight to a host directory {#docker-data-dir}

    If you often look at or delete data, or have a large disk mounted elsewhere, set it in `.env` (never committed, whereas editing `compose.yaml` conflicts on `git pull`):

    ```dotenv
    LEROBOT_DATA_DIR=/home/<user>/.cache/huggingface/docker_data
    ```

    A value containing `/` is used as a bind mount, otherwise as a named volume; if unset, the default `lerobot-data` volume is used. Confirm with `docker compose config` before recording; data appears under `<that directory>/lerobot/`.

    !!! warning "A bind mount fixes the location, not the ownership"
        Recording runs as root, so the files are root-owned. Hand them back with the command below, or on the host run `sudo chown -R "$(id -u):$(id -g)" ~/.cache/huggingface/docker_data`; `ls -ln` prints numeric uid/gid to check:

        ```bash
        docker compose run --rm --no-deps --entrypoint /bin/bash --user 0:0 \
            xense-taccap -lc "chown -R $(id -u):$(id -g) /data"
        ls -ln ~/.cache/huggingface/docker_data/lerobot
        ```

    Compose passes the host's `/dev` and `/run/udev` through, so `/dev/v4l/by-id`, `/dev/v4l/by-path` and `/dev/serial/by-path` are readable in the container for [device auto-discovery](host-setup.md#33).

    To [push to the Hub](dataset.md#64) from the container, put the token in the same `.env`; it arrives as `HF_TOKEN`, sparing you `hf auth login` every time:

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    ### Graphics inside the container {#docker-gui}

    The image ships the XKB / Vulkan / XDG runtime libraries Rerun needs and defaults to `WGPU_BACKEND=vulkan`; Compose passes `DISPLAY` and the X11 socket through. If no window appears, do the [`xhost` authorization](#docker-host) first, then confirm the GPU is visible in the container with `vulkaninfo --summary`.

    !!! warning "Do not change `runtime: nvidia` in `compose.yaml` to `gpus: all`"
        `gpus: all` only requests compute + utility: CUDA and `nvidia-smi` work, but the Vulkan ICD is not injected and Rerun fails with `WGPU error: Failed to create surface for any enabled backend`. `runtime: nvidia` needs the NVIDIA runtime registered (`install_customer.sh` does this); otherwise see [Troubleshooting · Docker image](troubleshooting.md#docker).

    Without a Pico4U you can skip starting XenseVR PC Service (its log is at `/tmp/xensevr-service.log` in the container):

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```
