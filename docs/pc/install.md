# 安装

本页把 `xense-taccap-lerobot` 与三个硬件 SDK 装到 **Ubuntu 22.04 / 24.04 LTS（amd64）** 采集主机并验证到能跑 `lerobot-info`；串口权限与设备发现见[主机配置](host-setup.md)。

- **已验证**：Ubuntu 22.04.5 / 24.04.4 LTS，内核 6.8 / 6.14 / 7.0 系列，`x86_64`，Python `3.12.13`（要求 ≥ 3.12），mamba 环境名 `xense-taccap`。
- 仓库 commit 与各包版本以[版本与升级](versions.md)为准。
- **其它发行版或架构**：驱动、UVC、串口权限和 `.deb` 支持需自行验证。

## 采集主机配置要求 {#host-spec}

双夹爪六路相机边取流边编码，一帧只有 33.3 ms（30 fps）。配置不够时表现为丢帧，不报错。

| | **最低要求** | **推荐配置** |
|---|---|---|
| CPU | Intel **12 代 i7** 及以上（或同级 AMD） | Intel **Core Ultra 9 275HX**（24 核）或同级 |
| 内存 | **8 GB** | **32 GB** |
| GPU | NVIDIA **RTX 3060 / 8 GB 显存**及以上 | NVIDIA **RTX 5060 Laptop / 8 GB 显存**及以上 |
| 显卡驱动 | **≥ 570.144** | 同左 |
| 硬盘 | 512 GB SSD | **1 TB NVMe SSD** |
| USB | **单夹爪**（3 路相机）同一条 USB 2.0 总线即可 | **双夹爪**（6 路相机）分挂**两条 USB 2.0 总线**（两个独立主控制器） |
| 系统 | Ubuntu 22.04 / 24.04 LTS，**amd64** | Ubuntu 24.04 LTS |

- **CPU**：主循环、触觉解码、喂帧都在 CPU 上，双夹爪一帧六到八张图；12 代 i7 是实测稳住 30 fps 的下限。
- **GPU**：`--dataset.vcodec=auto` 用显卡编码 H.264；没有 NVIDIA 显卡时改用 CPU 编码，存盘慢、易 `[slow_frame]`，见[没有 NVIDIA GPU 怎么录](recording.md#no-gpu)。查驱动：`nvidia-smi --query-gpu=driver_version,name --format=csv,noheader`。
- **内存**：开 `--display_data` 看 Rerun 或边采边处理时用 32 GB。
- **硬盘**：双夹爪原始视频出流约 280 MB/s，落盘量见[磁盘规划](dataset.md#storage-planning)；不要直接录到机械硬盘或 USB 移动硬盘。
- **USB**：双夹爪 6 路相机分挂两条 480M 总线，见 [USB 带宽预算](host-setup.md#usb-budget)。

## 选择安装方式 {#choose}

两条路径装出的环境相同，选一条即可。

| | **Mamba 源码安装** | **Docker 交付镜像** |
|---|---|---|
| 拿到的东西 | 源码仓库，自己建环境 | 拉一个现成镜像，跑一个脚本 |
| 耗时 | 较长，夹爪 SDK 与 Pico4 绑定要现编译 | 几分钟到几十分钟，看拉镜像（约 21 GB）的网速 |
| NVIDIA GPU | 非必需，没有时只能[降级录制](recording.md#no-gpu) | **必需**，驱动 ≥ 570.144 |
| 环境隔离 | 主机的 Mamba 环境 | 容器里，不污染主机 |
| 改代码 | 方便 | 不方便 |

- **默认 Mamba**：后续各页命令按这条路径书写；有 NVIDIA 驱动又不想自己建环境时选 Docker。
- **外网**：两条路径都要；离线机器只能用 Docker 的 `.tar` 交付包。
- **代理**：Docker 脚本支持 `XENSE_PROXY_URL`。

=== "Mamba 源码安装"

    ### 系统依赖包 {#apt}

    硬件 SDK 在 `setup_env.sh --install` 时现编译，先装编译工具：

    ```bash
    sudo apt install -y build-essential cmake pkg-config git curl
    sudo apt install -y libusb-dev    # libusb 不够新,相机就是连不上 —— 见下面这条
    sudo apt install -y v4l-utils     # 采集用不到,但排查相机全靠它
    ```

    - `setup_env.sh` 开跑前检查这些命令，缺了就停下并打印对应的 apt 命令；`v4l-utils` 缺了只告警。
    - `v4l2-ctl --list-formats-ext` 用于排查[相机打不开](troubleshooting.md#usb-bandwidth)。
    - 不需要系统 `ffmpeg`（`torchcodec` 用 conda 环境里的 FFmpeg 动态库），也不需要 `libudev-dev`（运行期用自带的 `libudev1`）。

    !!! warning "`libusb-dev` 要装，而且要跟着内核一起更新"
        libusb 落后或缺失时相机连不上，报错里不提 libusb。`sudo apt install -y libusb-dev` 会带上相机栈加载的 `libusb-0.1-4` 运行库（`libusb-0.1.so.4`）。内核升级后再升一次并重启：

        ```bash
        sudo apt update && sudo apt install -y --only-upgrade libusb-dev libusb-1.0-0
        ```

        `setup_env.sh` 对它只告警；缺了要到 `connect()` 才失败。

    ### 安装 Miniforge

    Mamba 求解依赖比 conda 快约 10×：

    ```bash
    curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
    bash Miniforge3-$(uname)-$(uname -m).sh
    ```

    ### 克隆仓库与子模块 {#22}

    硬件 SDK 在 `third_party/` 子模块里，须递归克隆并指定 tag：

    !!! warning "没有 GitHub SSH key 的机器，克隆前先执行一次"
        子模块地址是 `git@github.com:` 形式，没有 SSH key 会拉取失败。改走 HTTPS，原因见[子模块地址是 SSH 形式](versions.md#submodule-ssh)：

        ```bash
        git config --global url."https://github.com/".insteadOf "git@github.com:"
        ```

    ```bash
    git clone \
      --branch v0.1.0 \
      --recurse-submodules \
      https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ```

    已克隆但漏了子模块：

    ```bash
    git submodule update --init --recursive --progress
    ```

    | 包 | 来源 |
    |---|---|
    | `xense.taccap`（触觉夹爪 SDK） | 唯一的子模块 [`third_party/taccap-gripper`](https://github.com/XenseRobotics-AI/TacCap-Gripper) |
    | `xensesdk`（视触觉传感器 SDK） | `setup_env.sh --install` 自动安装 |
    | `xensevr_pc_service_sdk`（Pico4） | Python 绑定在主仓库；C SDK（`PXREARobotSDK.h` + `libPXREARobotSDK.so`）取自 [XenseVR PC Service `.deb`](#24)，随新版 `.deb` 更新，不靠重跑 `--install` |

    !!! warning "更新子模块后必须重新编译 `xense.taccap`"
        `git submodule update` 不重新编译，之后 `import xense.taccap` 会报 `AttributeError: module 'xense.taccap._taccap_native' has no attribute 'GripperAutoCalConfig'` 一类错误。版本号不变也可能出现，每次拉子模块后都重建（不需 sudo），或直接 `bash setup_env.sh --install`：

        ```bash
        cd ~/xense-taccap-lerobot
        LIBRARY_PATH="${CONDA_PREFIX}/lib" \
          uv pip install -e third_party/taccap-gripper --no-deps --no-build-isolation
        python -c "import xense.taccap as t; print(t.__version__)"
        ```

    ### 创建并激活环境

    `--mamba` 默认创建 `xense-taccap` 环境，自定义名追加在 `--mamba` 后：

    ```bash
    ./setup_env.sh --mamba
    mamba activate xense-taccap
    ```

    ### 一键安装 {#24}

    ```bash
    ./setup_env.sh --install
    ```

    按 `conda_environment.yaml` 更新环境，从 `pyproject.toml` 装主包，装 `xensesdk` 与 XenseVR PC Service 守护进程，再编译 `xensevr_pc_service_sdk` 与 `xense.taccap`。

    - **下载**：从 [v0.2.1 release](https://github.com/XenseRobotics-AI/XenseVR-PC-Service/releases/tag/v0.2.1) 取当前架构的 `.deb`（约 110 MB），`$XENSEVR_DEB_URL` 可覆盖地址。
    - **安装**：`sudo dpkg -i` 装到 `/opt/apps/roboticsservice`；同版本已装则跳过，下了一半的文件会复用。
    - **下载失败**：`--install` 停下；离线或打过补丁的包用 `$XENSEVR_DEB` 指向本地文件。
    - **版本**：v0.2.1 重新编译过 C SDK，v0.2.0 会拿旧 SDK 编 Pico4 绑定；[头显双目与头部位姿](recording.md#56)需要 PC Service ≥ v0.2.0，追踪器不受影响。

    ### 验证安装 {#25}

    三个包都能 import 即成功：

    ```bash
    python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
    python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
    ```

    再确认设备能被发现：

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    用[头显相机](recording.md#56)时再查一条，`False` 表示加载的是旧版本，重跑 `./setup_env.sh --install`：

    ```bash
    python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
    ```

    可选：确认编解码依赖可加载。`torchcodec` 按 PyTorch 兼容矩阵固定，PyAV 固定为 `15.1.0`；默认编码路径不依赖带 `libsvtav1` 的系统 ffmpeg，要用请单独装：

    ```bash
    python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
    python -c 'import av; print("PyAV OK ->", av.__version__)'
    ```

=== "Docker 交付镜像"

    ### 镜像内容与主机要求 {#docker}

    - **内容**：完整的 `xense-taccap` 环境、CUDA 用户态库、采集程序和三个硬件 SDK（XenseSDK、TacCap-Gripper、Pico4 绑定）；启动时自动拉起 XenseVR PC Service。
    - 为热插拔触觉传感器、腕相机、夹爪串口和 Pico4，容器以**特权模式**运行并共享主机网络与 IPC，只在信任的主机上用。
    - **主机**：Ubuntu 22.04 / 24.04 **amd64**，**NVIDIA 驱动 ≥ 570.144**（`nvidia-smi --query-gpu=driver_version --format=csv,noheader` 可查）。
    - **驱动**：脚本不装、不升级显卡驱动（涉及型号、Secure Boot 和重启），不满足就停下。

    ### 一键安装 {#ghcr}

    镜像在 GitHub Container Registry 公开发布，拉取免登录：

    ```text
    ghcr.io/xenserobotics-ai/xense-taccap-lerobot
    ```

    用普通用户（非 root）执行：

    ```bash
    git clone --branch v0.1.0 https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ./docker/install_customer.sh
    ```

    脚本依次：检查系统与显卡驱动 → 按需装 Docker 与 NVIDIA Container Toolkit（并注册 NVIDIA runtime）→ 装[串口权限](host-setup.md#32)的 ModemManager 屏蔽规则 → 拉取镜像 → CUDA 与图形冒烟测试。克隆仓库只为拿 `compose.yaml` 和脚本。

    走代理：

    ```bash
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./docker/install_customer.sh
    ```

    离线机器向交付渠道要镜像 `.tar` 包，放进仓库根目录或作为第一个参数传入，脚本改为校验并导入：

    ```bash
    ./docker/install_customer.sh xense-taccap-lerobot-0.1.0-linux-amd64.tar
    ```

    默认仍在线拉取：升级只拉变动的层。

    ### 录数据前先把版本钉死 {#docker-pin}

    默认的 `latest` 会随发布浮动。正式采集前在仓库根目录 `.env` 钉版本；`compose.yaml` 已指向官方镜像，只写 tag 一行，`LEROBOT_IMAGE` 仅换镜像名时用：

    ```dotenv
    LEROBOT_IMAGE_TAG=0.1.0
    ```

    确认解析到这一版再拉；`docker compose config --images` 显示的仓库名可能与上文不同，按 tag 核对即可：

    ```bash
    docker compose config --images
    docker compose pull
    ```

    钉在 `0.0.5` 及更早（`0.0.6` 起无此问题）时：录制要加 `--play_sounds=false`（镜像里没有 `spd-say`，见[故障排查](troubleshooting.md#docker)）；导出要以 root 拷再 `chown`，见[数据放在哪](#docker-data)。

    ### 安装后的主机设置 {#docker-host}

    脚本已把你加进 `docker` 组，当前终端尚未生效。在宿主机上敲：

    ```bash
    newgrp docker                    # 让 docker 组权限在当前终端生效
    xhost +si:localuser:root         # 要在容器里显示 Rerun 等窗口
    ```

    !!! warning "逐条敲，不要整块粘贴"
        `newgrp` 开子 shell，会吞掉后面粘贴的命令；没执行 `newgrp docker` 就进容器会报 `permission denied`。注销重登更干净，没有新建文件属组变 `docker` 的副作用。

    `docker` 组权限接近 root，只加需要采集的用户。用完撤销授权：`xhost -si:localuser:root`。

    ### 进入容器与验证

    ```bash
    docker compose run --rm xense-taccap
    ```

    容器里四个 import 全过、GPU 可见：

    ```bash
    python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
    python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
    python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
    ```

    Pico4 绑定和守护进程须同版本：

    ```bash
    python -c 'import importlib.metadata as M; print("pico4 ->", M.version("xensevr_pc_service_sdk"))'
    dpkg-query -W -f='daemon -> ${Version}\n' xensevr-pc-service
    ```

    ```text
    pico4 -> 0.2.1
    daemon -> 0.2.1
    ```

    !!! warning "这两行必须一致，不一致就别拿这个镜像录数据"
        不一致说明镜像构建不完整，追踪器数据可能不对。换一个 tag 重新 `docker compose pull`，或联系交付渠道。

    确认设备能被发现：

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    也可不进交互 shell 直接跑：

    ```bash
    docker compose run --rm xense-taccap lerobot-info
    ```

    ### 数据放在哪、为什么删容器不丢 {#docker-data}

    四个目录挂在 Docker volume 上，`--rm` 删容器不影响：

    | 容器内路径 | volume | 放什么 |
    |---|---|---|
    | `/data` | `lerobot-data` | 数据集（`HF_LEROBOT_HOME=/data/lerobot`） |
    | `/root/.xensesdk` | `xensesdk-cache` | 传感器按序列号缓存的配置，别删：容器重启不必重读 flash、不触发 USB 重新枚举 |
    | `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face 缓存 |
    | `/root/.cache/torch` | `torch-cache` | Torch 缓存 |

    宿主机路径 `/var/lib/docker/volumes/xense-taccap-lerobot_<卷名>/_data` 属 root，`ls` 要 sudo；走容器看更省事：

    ```bash
    docker compose run --rm xense-taccap bash -lc 'ls -la /data/lerobot'
    ```

    !!! danger "不要用 `docker volume prune`"
        它删"当前没有容器在用"的卷，容器是 `--rm` 的，数据卷平时正是这个状态，数据会被删且不可恢复。清理镜像用 `docker image prune`，构建缓存用 `docker builder prune`，都不碰卷。

    导出到宿主机，以 root 读，同一条命令里交还属主：

    ```bash
    mkdir -p export
    docker compose run --rm --no-deps \
        --entrypoint /bin/bash \
        -v "$PWD/export:/export" \
        xense-taccap \
        -lc "cp -a /data/lerobot /export/ && chown -R $(id -u):$(id -g) /export"
    ```

    三处都不能省：

    - `--entrypoint /bin/bash` 跳过默认启动脚本（它会 `chmod 0700` 运行目录）。
    - `chown` 在同一条命令里，否则导出文件属 root，宿主机上改不了。
    - 先 `mkdir -p export`，Docker 自动创建的挂载点归 root，非 root 写不进去。

    `0.0.5` 及更早录的数据经 `cp -a` 导出后仍是 `0600`，要让其他用户可读，在末尾再接：

    ```bash
        && chmod -R u+rwX,go+rX /export
    ```

    !!! warning "不要改成用 `--user` 以自己的身份拷"
        - `docker compose run --user ...` 仍跑启动脚本，报 `chmod: changing permissions of '/tmp/xdg-runtime': Operation not permitted`。
        - `0.0.5` 及更早录的视频是 `-rw------- root`，非 root 拷贝在每个 `.mp4` 上报 `Permission denied`（元数据 `0644` 拷得动，像个别文件损坏）；`0.0.6` 起落盘即 `0644`，升级不改写已录文件。

    ### 让数据直接落在宿主机目录 {#docker-data-dir}

    常看、删数据或另挂大盘时，在 `.env` 里指定；改 `compose.yaml` 会在 `git pull` 时冲突，`.env` 不提交：

    ```dotenv
    LEROBOT_DATA_DIR=/home/<user>/.cache/huggingface/docker_data
    ```

    带 `/` 按 bind mount，不带当具名卷，不设即默认 `lerobot-data`。用 `docker compose config` 确认再录，数据在 `<那个目录>/lerobot/`。

    !!! warning "bind mount 解决了位置，但不解决属主"
        录制以 root 运行，文件仍属 root。录完用下面命令交还，或在宿主机 `sudo chown -R "$(id -u):$(id -g)" ~/.cache/huggingface/docker_data`；`ls -ln` 显示数字 uid/gid，可核对：

        ```bash
        docker compose run --rm --no-deps --entrypoint /bin/bash --user 0:0 \
            xense-taccap -lc "chown -R $(id -u):$(id -g) /data"
        ls -ln ~/.cache/huggingface/docker_data/lerobot
        ```

    Compose 透传宿主机的 `/dev` 和 `/run/udev`，容器里可读 `/dev/v4l/by-id`、`/dev/v4l/by-path` 和 `/dev/serial/by-path`，供[设备自动发现](host-setup.md#33)使用。

    在容器里[上传 Hub](dataset.md#64)时把 token 写进同一个 `.env`，作为 `HF_TOKEN` 带进容器，免得每次 `hf auth login`：

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    ### 容器里的图形界面 {#docker-gui}

    镜像带 Rerun 所需的 XKB / Vulkan / XDG 运行库，默认 `WGPU_BACKEND=vulkan`，Compose 透传 `DISPLAY` 和 X11 socket。窗口出不来时，先做 [`xhost` 授权](#docker-host)，再在容器里确认显卡可见：

    ```bash
    vulkaninfo --summary
    ```

    !!! warning "别把 `compose.yaml` 里的 `runtime: nvidia` 改成 `gpus: all`"
        - `gpus: all` 只申请 compute + utility，CUDA 和 `nvidia-smi` 正常，但不注入 Vulkan ICD，Rerun 报 `WGPU error: Failed to create surface for any enabled backend`。
        - `runtime: nvidia` 要求 NVIDIA runtime 已注册（`install_customer.sh` 会做），否则 Compose 报 `Unknown runtime specified nvidia`，见[故障排查](troubleshooting.md#docker)。

    不接 Pico4 时可不启动 XenseVR PC Service（日志在容器内 `/tmp/xensevr-service.log`）：

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```

装好后先做[主机配置](host-setup.md)，否则夹爪能被列出却打不开。
