# Installation

This page installs `xense-taccap-lerobot` and the three hardware SDKs on an **Ubuntu 22.04 / 24.04 LTS (amd64)** data-collection host and verifies them; once it is done you can run `lerobot-info`. Serial permissions and device discovery are on the next page, [Host setup](host-setup.md).

Verified environment: Ubuntu 22.04.5 / 24.04.4 LTS, kernel 6.8 / 6.14 / 7.0 series all fine, `x86_64`, Python `3.12.13` (≥ 3.12 required), mamba environment name `xense-taccap`; the repo commit and per-package versions are those in [Versions and upgrades](versions.md). Other distributions or architectures need verifying separately for driver, UVC, serial-permission and `.deb` support.

## Data-collection host requirements {#host-spec}

Collection is real time: on a bimanual rig six cameras are streamed and encoded at once, and a frame has only a 33.3 ms budget (30 fps). An underspecified machine shows up as dropped frames and slow recording, not as an error.

| | **Minimum** | **Recommended** |
|---|---|---|
| CPU | Intel **12th-gen i7** or better (or an AMD equivalent) | **13th / 14th-gen i7 / i9** or equivalent (≥ 8 performance cores) |
| Memory | **8 GB** | **32 GB** |
| GPU | NVIDIA **RTX 3060 / 8 GB VRAM** or better | NVIDIA **RTX 4070 / 12 GB VRAM** or better |
| GPU driver | **≥ 570.144** | Same |
| Disk | 512 GB SSD | **1 TB NVMe SSD** |
| USB | **One gripper** (3 cameras) can share a single USB 2.0 bus | **Bimanual** (6 cameras) split across **two USB 2.0 buses** (two independent host controllers) |
| OS | Ubuntu 22.04 / 24.04 LTS, **amd64** | Same |

Where each number comes from:

- **CPU**: the main loop, tactile decoding and feeding the encoder all run on the CPU, and a bimanual frame is six to eight images. A 12th-gen i7 is the lowest part measured to hold 30 fps.
- **GPU**: `--dataset.vcodec=auto` hands H.264 encoding to the card's encoder chip. Without an NVIDIA card the CPU has to encode instead: it records, but saving to disk is slower and `[slow_frame]` comes sooner, see [Recording with no NVIDIA GPU](recording.md#no-gpu). The Docker image requires an NVIDIA card; check the driver version with `nvidia-smi --query-gpu=driver_version,name --format=csv,noheader`.
- **Memory**: 8 GB covers collection itself; 32 GB is recommended once you watch the live data in Rerun with `--display_data` or process data while collecting.
- **Disk**: at full load raw video off the cameras is about 280 MB/s (bimanual); what lands on disk is in [Disk planning](dataset.md#storage-planning). Do not record straight onto a spinning disk or a USB external drive.
- **USB**: tactile sensors and wrist cameras are USB 2.0 devices, and a bimanual rig's 6 cameras must be split across two 480M buses, see [USB bandwidth budget](host-setup.md#usb-budget).

## Choosing an install path {#choose}

The two paths produce the same collection environment; pick one and follow it through.

| | **Mamba (from source)** | **Docker image** |
|---|---|---|
| What you get | The source repo; you build the environment | A prebuilt image to pull and one script to run |
| Time | Longer; the gripper SDK and the Pico4 bindings are compiled on the spot | Minutes to tens of minutes, depending on how fast you can pull the image (about 21 GB) |
| NVIDIA GPU | Not required; without one you are on the [degraded recording path](recording.md#no-gpu) | **Required**, driver ≥ 570.144 |
| Isolation | A Mamba environment on the host | In a container; the host stays clean |
| Editing the code | Easy | Awkward |

Default to Mamba: it puts no extra demand on the graphics driver, editing the collection program is easy, and the commands on the following pages are written for this path. Choose Docker when you already have the NVIDIA driver and would rather not build an environment yourself.

Both paths need internet access: Mamba fetches conda-forge and PyPI packages, clones the GitHub repo and its submodules and downloads the XenseVR PC Service `.deb`; Docker installs Docker Engine and the NVIDIA Container Toolkit and pulls the image. On an offline machine Mamba does not work at all, and Docker only works from a `.tar` delivery bundle. On a restricted network set up a proxy first; the Docker script accepts `XENSE_PROXY_URL`.

=== "Mamba (from source)"

    ### System packages {#apt}

    The hardware SDKs are compiled during `setup_env.sh --install`, and a fresh Ubuntu install does not even have a compiler, so install these first:

    ```bash
    sudo apt install -y build-essential cmake pkg-config git curl
    sudo apt install -y libusb-dev    # cameras do not connect with a stale libusb, see the box below
    sudo apt install -y v4l-utils     # not needed to record, but this is how you debug a camera
    ```

    `setup_env.sh` checks for these commands before it starts and stops with the exact apt line if any are missing; a missing `v4l-utils` only warns, but `v4l2-ctl --list-formats-ext` is the handiest instrument when [a camera will not open](troubleshooting.md#usb-bandwidth). You do not need a system `ffmpeg` (`torchcodec` uses the FFmpeg shared libraries in the conda environment) or `libudev-dev` (at runtime the `libudev1` that ships with Ubuntu is used).

    !!! warning "Install `libusb-dev`, and keep it current with the kernel"
        Recent Linux kernel updates require a matching libusb update. With a stale or missing libusb the cameras will not connect, and nothing in the error message points at libusb. `sudo apt install -y libusb-dev` also pulls in the `libusb-0.1-4` runtime (`libusb-0.1.so.4`), which is exactly what the prebuilt camera stack loads. After a kernel upgrade, upgrade it again and reboot:

        ```bash
        sudo apt update && sudo apt install -y --only-upgrade libusb-dev libusb-1.0-0
        ```

        `setup_env.sh` only warns about it and does not stop, because it is a runtime dependency: when it is missing the failure only comes at `connect()`.

    ### Install Miniforge

    Mamba's dependency solving is about 10× faster than stock conda:

    ```bash
    curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
    bash Miniforge3-$(uname)-$(uname -m).sh
    ```

    ### Clone the repo and its submodules {#22}

    The repo keeps the hardware SDKs in `third_party/` submodules, so the clone must be recursive:

    ```bash
    git clone \
      --recurse-submodules \
      https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ```

    Already cloned without the submodules:

    ```bash
    git submodule update --init --recursive --progress
    ```

    There is only one submodule, [`third_party/taccap-gripper`](https://github.com/XenseRobotics-AI/TacCap-Gripper), which installs the package `xense.taccap` (the tactile gripper SDK). `xensesdk` (the visuotactile sensor SDK) is installed automatically by `setup_env.sh --install`. The Python bindings of `xensevr_pc_service_sdk` (Pico4) live in the main repo, and the C SDK they link against (`PXREARobotSDK.h` + `libPXREARobotSDK.so`) comes out of the [XenseVR PC Service `.deb`](#24) installed in the next step; from now on that C SDK is updated through a new `.deb` release, not by re-running `--install`.

    !!! warning "Rebuild `xense.taccap` after updating the submodule"
        The `taccap-gripper` Python package ships a compiled build artefact. `git submodule update` only updates the files and does not rebuild, after which `import xense.taccap` fails with an error like `AttributeError: module 'xense.taccap._taccap_native' has no attribute 'GripperAutoCalConfig'`. After pulling an update that touches `cpp/` or `python/bindings/`, rebuild (no sudo needed), or just run `bash setup_env.sh --install`:

        ```bash
        cd ~/xense-taccap-lerobot
        LIBRARY_PATH="${CONDA_PREFIX}/lib" \
          uv pip install -e third_party/taccap-gripper --no-deps --no-build-isolation
        python -c "import xense.taccap as t; print(t.__version__)"
        ```

    ### Create and activate the environment

    `--mamba` creates the `xense-taccap` environment by default; to use your own name, append it after `--mamba`:

    ```bash
    ./setup_env.sh --mamba
    mamba activate xense-taccap
    ```

    ### One-shot install {#24}

    ```bash
    ./setup_env.sh --install
    ```

    This step updates the environment from `conda_environment.yaml`, installs the main package from `pyproject.toml`, installs `xensesdk` and the XenseVR PC Service daemon, then builds `xensevr_pc_service_sdk` (Pico4, linked against the C SDK from the `.deb`) and `xense.taccap` (gripper, from the submodule).

    XenseVR PC Service is a `.deb` of about 110 MB. The script downloads the package for the current architecture from the [v0.2.1 release](https://github.com/XenseRobotics-AI/XenseVR-PC-Service/releases/tag/v0.2.1) (`$XENSEVR_DEB_URL` overrides the download URL) and installs it with `sudo dpkg -i` into `/opt/apps/roboticsservice`; when the same version is already installed it skips, and a partial download is reused. The C SDK the Pico4 bindings link against comes from this package, so a failed download stops `--install`; for an offline or patched package, point `$XENSEVR_DEB` at a local file. The baseline is v0.2.1 because it rebuilt the C SDK; v0.2.0 would build the Pico4 bindings against the old SDK. The [headset stereo view and head pose](recording.md#56) need PC Service ≥ v0.2.0; the tracker is unaffected.

    ### Verify the install {#25}

    All three packages importing means success:

    ```bash
    python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
    python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
    ```

    Then confirm the collection program works and the devices are discovered:

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    One more if you use the [head camera](recording.md#56); `False` means an older version is still being loaded, so re-run `./setup_env.sh --install`:

    ```bash
    python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
    ```

    Optional: confirm the video codec dependencies load. `torchcodec` is pinned by the PyTorch compatibility matrix, PyAV is pinned to `15.1.0`, and FFmpeg is not part of the conda solve. If you need a system ffmpeg with `libsvtav1`, install it separately; the default encoding path does not depend on it:

    ```bash
    python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
    python -c 'import av; print("PyAV OK ->", av.__version__)'
    ```

=== "Docker image"

    ### Image contents and host requirements {#docker}

    The image already contains the full `xense-taccap` environment, the CUDA user-space libraries, the collection program and the three hardware SDKs (XenseSDK, TacCap-Gripper, the Pico4 bindings); the container starts XenseVR PC Service on launch, and no submodules or host environment are needed. So that tactile sensors, wrist cameras, the gripper serial port and the Pico4 can be hot-plugged mid-collection, the container runs in **privileged mode** and shares the host's network and IPC. Only run it on a data-collection host you trust.

    Host requirements: Ubuntu 22.04 / 24.04 **amd64**, **NVIDIA driver ≥ 570.144** (check with `nvidia-smi --query-gpu=driver_version --format=csv,noheader`). The script will not install or upgrade the GPU driver for you (that depends on the card, Secure Boot and a reboot) and stops if the requirement is not met; Docker Engine, the Compose plugin and the NVIDIA Container Toolkit are installed automatically if absent.

    ### One-shot install {#ghcr}

    The image is published to the GitHub Container Registry. It is public, so pulling needs no login:

    ```text
    ghcr.io/xenserobotics-ai/xense-taccap-lerobot
    ```

    Run as a normal user (not root):

    ```bash
    git clone https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ./docker/install_customer.sh
    ```

    The script, in order: checks the system and GPU driver → installs Docker and the NVIDIA Container Toolkit as needed (and registers the NVIDIA runtime with Docker) → installs the gripper serial udev rule (the ModemManager blocking rule from [Serial permissions](host-setup.md#32)) → pulls the image → runs a CUDA and graphics smoke test. Cloning the repo is only how you get `compose.yaml` and the script.

    Behind a proxy:

    ```bash
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./docker/install_customer.sh
    ```

    For a fully offline machine, ask your delivery channel for the image `.tar` bundle, drop it in the repo root or pass it as the first argument, and the script verifies and imports it instead:

    ```bash
    ./docker/install_customer.sh xense-taccap-lerobot-0.0.6-linux-amd64.tar
    ```

    Pulling online is still the default: most of the image's twenty-odd GB is dependency layers that rarely change, so an upgrade fetches only the few layers that moved.

    ### Pin a version before you record {#docker-pin}

    The default `latest` tag floats: the next release repoints it to a new image. Before real collection, pin a version in the repo root's `.env`. `compose.yaml` already defaults to `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`, so there is no need to set `LEROBOT_IMAGE` (only for a different image name):

    ```dotenv
    LEROBOT_IMAGE_TAG=0.0.6
    ```

    Confirm that this is the version that resolves, then pull:

    ```bash
    docker compose config --images
    docker compose pull
    ```

    Pinning `0.0.5` or earlier has two known issues (fixed in `0.0.6`; neither affects the recorded data): record with `--play_sounds=false` (the image has no `spd-say`, see [Troubleshooting](troubleshooting.md#docker)), and export by copying as root and then `chown`, see [Where the data lives](#docker-data).

    ### Host setup after installing {#docker-host}

    The script has already added you to the `docker` group, but that does not take effect in the current terminal. Type these two on the host:

    ```bash
    newgrp docker                    # make docker group membership active in this terminal
    xhost +si:localuser:root         # needed to show Rerun and other windows from the container
    ```

    !!! warning "Type them one at a time, do not paste the block"
        `newgrp` opens a subshell, and when the block is pasted the commands after it get swallowed by that subshell; `xhost` must be typed separately after `newgrp` returns. Entering the container without `newgrp docker` gives `permission denied`. Logging out and back in is cleaner: it avoids the side effect of `newgrp`, where files created afterwards get group `docker`.

    `docker` group membership is close to root; add only the users who need to collect. Revoke the `xhost` grant when you are done: `xhost -si:localuser:root`.

    ### Enter the container and verify

    ```bash
    docker compose run --rm xense-taccap
    ```

    Inside the container, confirm all four imports pass and the GPU is visible:

    ```bash
    python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
    python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
    python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
    ```

    Then confirm the Pico4 bindings and the daemon are the same version:

    ```bash
    python -c 'import importlib.metadata as M; print("pico4 ->", M.version("xensevr_pc_service_sdk"))'
    dpkg-query -W -f='daemon -> ${Version}\n' xensevr-pc-service
    ```

    ```text
    pico4 -> 0.2.1
    daemon -> 0.2.1
    ```

    !!! warning "These two lines must match; if they do not, do not record with this image"
        The C SDK the Pico4 bindings link against comes from that `.deb`; a mismatch means the image is a half-updated build and the tracker data may be wrong. Switch to another tag and `docker compose pull` again, or contact your delivery channel.

    Finally, confirm the devices are discovered:

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    You can also run a command directly without an interactive shell:

    ```bash
    docker compose run --rm xense-taccap lerobot-info
    ```

    ### Where the data lives, and why removing the container does not lose it {#docker-data}

    Four directories inside the container are mounted on Docker volumes; removing the temporary container with `--rm` does not touch them:

    | Path in container | Volume | What it holds |
    |---|---|---|
    | `/data` | `lerobot-data` | Datasets (`HF_LEROBOT_HOME=/data/lerobot`) |
    | `/root/.xensesdk` | `xensesdk-cache` | Per-serial sensor configuration cache. Do not delete it: with it a container restart does not have to re-read sensor flash and does not re-enumerate USB |
    | `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face cache |
    | `/root/.cache/torch` | `torch-cache` | Torch cache |

    On the host the volumes live at `/var/lib/docker/volumes/xense-taccap-lerobot_<volume>/_data`, owned by root, so a plain `ls` needs sudo; going through the container is easier:

    ```bash
    docker compose run --rm xense-taccap bash -lc 'ls -la /data/lerobot'
    ```

    !!! danger "Do not run `docker volume prune`"
        It removes volumes that "no container is currently using", which is exactly the state the data volume is normally in (the containers are `--rm`), so recorded data is deleted and cannot be recovered. Use `docker image prune` to clean up images and `docker builder prune` for build cache; neither touches volumes.

    Exporting to the host: read as root, and hand ownership back in the same command once copied:

    ```bash
    mkdir -p export
    docker compose run --rm --no-deps \
        --entrypoint /bin/bash \
        -v "$PWD/export:/export" \
        xense-taccap \
        -lc "cp -a /data/lerobot /export/ && chown -R $(id -u):$(id -g) /export"
    ```

    None of the three parts can be dropped: `--entrypoint /bin/bash` skips the default startup script (which does `chmod 0700` on the runtime directory); `chown` is in the same command, otherwise the exported files are owned by root and cannot be changed on the host; `mkdir -p export` comes first, because a mount point Docker creates itself is root-owned and a non-root write into it fails. `cp -a` carries the permissions across, so data recorded by `0.0.5` and earlier is still `0600` after export; to let other users read it too, append this to the end of the command above:

    ```bash
        && chmod -R u+rwX,go+rX /export
    ```

    !!! warning "Do not switch to `--user` to copy as yourself"
        `docker compose run --user ...` still runs the startup script, and a non-root user cannot change the runtime directory's permissions, so it fails with `chmod: changing permissions of '/tmp/xdg-runtime': Operation not permitted`. Videos recorded by the `0.0.5` and earlier images are `-rw------- root`, so a non-root copy reports `Permission denied` on every `.mp4` (the `0644` metadata copies fine, which looks like a few damaged files). From `0.0.6` on, videos land as `0644`, but upgrading does not rewrite files already recorded.

    ### Writing data straight to a host directory {#docker-data-dir}

    If you look at or delete data often, or have a large disk mounted elsewhere, this is easier than copying out every time. Set it in `.env`; do not edit `compose.yaml` (it is tracked by the repo, and an absolute path written into it conflicts on the next `git pull`; `.env` is never committed):

    ```dotenv
    LEROBOT_DATA_DIR=/home/<user>/.cache/huggingface/docker_data
    ```

    A value containing `/` is treated as a bind mount, one without as a named volume, and unset means the default `lerobot-data`. After changing it, confirm with `docker compose config` before recording; the data appears under `<that directory>/lerobot/`.

    !!! warning "A bind mount fixes the location, not the ownership"
        Recording still runs as root, so the files are still root-owned. Hand them back to yourself when you are done, or on the host run `sudo chown -R "$(id -u):$(id -g)" ~/.cache/huggingface/docker_data`; `ls -ln` prints numeric uid/gid, so it shows whether the chown took:

        ```bash
        docker compose run --rm --no-deps --entrypoint /bin/bash --user 0:0 \
            xense-taccap -lc "chown -R $(id -u):$(id -g) /data"
        ls -ln ~/.cache/huggingface/docker_data/lerobot
        ```

    Compose passes the host's `/dev` and `/run/udev` through, so `/dev/v4l/by-id`, `/dev/v4l/by-path` and `/dev/serial/by-path` are readable inside the container too; [device auto-discovery](host-setup.md#33) is built on them.

    To [push to the Hub](dataset.md#64) from inside the container, put the token in the same `.env`; it reaches the container as `HF_TOKEN`. Otherwise, because the container is `--rm`, you have to `hf auth login` again every time:

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    ### Graphics inside the container {#docker-gui}

    The image ships the XKB / Vulkan / XDG runtime libraries Rerun needs, defaults to `WGPU_BACKEND=vulkan`, and Compose passes `DISPLAY` and the X11 socket through. If no window appears, do the [`xhost` authorisation](#docker-host) first, then confirm the GPU is visible inside the container:

    ```bash
    vulkaninfo --summary
    ```

    !!! warning "Do not change `runtime: nvidia` in `compose.yaml` to `gpus: all`"
        `gpus: all` only requests compute + utility: the container runs CUDA and `nvidia-smi` works, but NVIDIA's Vulkan ICD is not injected and Rerun fails with `WGPU error: Failed to create surface for any enabled backend`. `runtime: nvidia` requires the NVIDIA runtime to be registered with Docker (`install_customer.sh` does this); if it is not, Compose fails with `Unknown runtime specified nvidia`, see [Troubleshooting](troubleshooting.md#docker).

    When you only process data and no Pico4 is attached, you can skip starting XenseVR PC Service; its log is at `/tmp/xensevr-service.log` inside the container:

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```

With the environment installed, do the [Host setup](host-setup.md) next (serial permissions, device discovery); otherwise grippers get listed but cannot be opened.
