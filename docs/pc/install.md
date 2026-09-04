# 安装

本页把 `xense-taccap-lerobot` 与三个硬件 SDK 装到 **Ubuntu 22.04 / 24.04 LTS(amd64)** 采集主机上并验证,装完就能跑 `lerobot-info`;串口权限与设备发现见下一页[主机配置](host-setup.md)。

已验证环境:Ubuntu 22.04.5 / 24.04.4 LTS,内核 6.8 / 6.14 / 7.0 系列均可,`x86_64`,Python `3.12.13`(要求 ≥ 3.12),mamba 环境名 `xense-taccap`;仓库 commit 与各包版本以[版本与升级](versions.md)为准。其它发行版或架构需另行验证驱动、UVC、串口权限和 `.deb` 支持。

## 采集主机配置要求 {#host-spec}

采集是实时的:双夹爪六路相机边取流边编码,一帧只有 33.3 ms 预算(30 fps)。配低了的表现是丢帧和效率低而不是报错。

| | **最低要求** | **推荐配置** |
|---|---|---|
| CPU | Intel **12 代 i7** 及以上(或同级 AMD) | **13 / 14 代 i7 / i9** 或同级(≥ 8 性能核) |
| 内存 | **8 GB** | **32 GB** |
| GPU | NVIDIA **RTX 3060 / 8 GB 显存**及以上 | NVIDIA **RTX 4070 / 12 GB 显存**及以上 |
| 显卡驱动 | **≥ 570.144** | 同左 |
| 硬盘 | 512 GB SSD | **1 TB NVMe SSD** |
| USB | **单夹爪**(3 路相机)同一条 USB 2.0 总线即可 | **双夹爪**(6 路相机)分挂**两条 USB 2.0 总线**(两个独立主控制器) |
| 系统 | Ubuntu 22.04 / 24.04 LTS,**amd64** | 同左 |

各项的依据:

- **CPU**:主循环、触觉解码、喂帧都在 CPU 上,双夹爪一帧要处理六到八张图,12 代 i7 是实测稳住 30 fps 的下限。
- **GPU**:`--dataset.vcodec=auto` 把 H.264 编码交给显卡的编码芯片;没有 NVIDIA 显卡只能改用 CPU 编码,能录但存盘变慢、更容易 `[slow_frame]`,见[没有 NVIDIA GPU 怎么录](recording.md#no-gpu)。Docker 镜像则必须有 NVIDIA 显卡,驱动版本用 `nvidia-smi --query-gpu=driver_version,name --format=csv,noheader` 查。
- **内存**:8 GB 只够跑采集;开 `--display_data` 看 Rerun 实时数据或边采边处理时推荐 32 GB。
- **硬盘**:满负荷时原始视频出流约 280 MB/s(双夹爪),落盘量见[磁盘规划](dataset.md#storage-planning);机械硬盘和 USB 移动硬盘不要直接录。
- **USB**:触觉与腕相机都是 USB 2.0 设备,双夹爪 6 路相机要分挂两条 480M 总线,见 [USB 带宽预算](host-setup.md#usb-budget)。

## 选择安装方式 {#choose}

两条路径装出来的采集环境相同,选一条走完即可。

| | **Mamba 源码安装** | **Docker 交付镜像** |
|---|---|---|
| 拿到的东西 | 源码仓库,自己建环境 | 拉一个现成镜像,跑一个脚本 |
| 耗时 | 较长,夹爪 SDK 与 Pico4 绑定要现编译 | 几分钟到几十分钟,看拉镜像(约 21 GB)的网速 |
| NVIDIA GPU | 非必需,没有时只能[降级录制](recording.md#no-gpu) | **必需**,驱动 ≥ 570.144 |
| 环境隔离 | 主机的 Mamba 环境 | 容器里,不污染主机 |
| 改代码 | 方便 | 不方便 |

默认走 Mamba:对显卡驱动没有额外要求,改采集程序也方便,后续各页命令都按这条路径书写;有 NVIDIA 驱动又不想自己建环境时选 Docker。

两条路径都要能访问外网:Mamba 要拉 conda-forge 与 PyPI 包、克隆 GitHub 仓库与子模块、下载 XenseVR PC Service 的 `.deb`;Docker 要装 Docker Engine 与 NVIDIA Container Toolkit 并拉镜像。离线机器 Mamba 走不通,Docker 只能靠 `.tar` 交付包。受限网络先配好代理,Docker 脚本支持 `XENSE_PROXY_URL`。

=== "Mamba 源码安装"

    ### 系统依赖包 {#apt}

    硬件 SDK 在 `setup_env.sh --install` 时现编译,新装的 Ubuntu 连编译器都没有,先装上:

    ```bash
    sudo apt install -y build-essential cmake pkg-config git curl
    sudo apt install -y libusb-dev    # libusb 不够新,相机就是连不上 —— 见下面这条
    sudo apt install -y v4l-utils     # 采集用不到,但排查相机全靠它
    ```

    `setup_env.sh` 开跑前会检查这几个命令,缺了直接停下并打印该敲哪行 apt;`v4l-utils` 缺了只告警,但 `v4l2-ctl --list-formats-ext` 是[相机打不开](troubleshooting.md#usb-bandwidth)时最趁手的尺子。不需要系统 `ffmpeg`(`torchcodec` 用 conda 环境里的 FFmpeg 动态库),也不需要 `libudev-dev`(运行期用 Ubuntu 自带的 `libudev1`)。

    !!! warning "`libusb-dev` 要装,而且要跟着内核一起更新"
        近期 Linux 内核更新要求配套更新 libusb;libusb 落后或缺失时相机连不上,且报错里不会提到 libusb。`sudo apt install -y libusb-dev` 会连带装上 `libusb-0.1-4` 运行库(`libusb-0.1.so.4`),预编译的相机栈加载的正是它。内核升级后再升一次并重启:

        ```bash
        sudo apt update && sudo apt install -y --only-upgrade libusb-dev libusb-1.0-0
        ```

        `setup_env.sh` 只对它告警不中断,因为它是运行期依赖,缺了要到 `connect()` 才失败。

    ### 安装 Miniforge

    Mamba 依赖求解比原生 conda 快约 10×:

    ```bash
    curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
    bash Miniforge3-$(uname)-$(uname -m).sh
    ```

    ### 克隆仓库与子模块 {#22}

    仓库用 `third_party/` 子模块管理硬件 SDK,必须递归克隆:

    ```bash
    git clone \
      --recurse-submodules \
      https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ```

    已克隆但漏了子模块:

    ```bash
    git submodule update --init --recursive --progress
    ```

    子模块只有一个:[`third_party/taccap-gripper`](https://github.com/XenseRobotics-AI/TacCap-Gripper),装出来的包是 `xense.taccap`(触觉夹爪 SDK)。`xensesdk`(视触觉传感器 SDK)由 `setup_env.sh --install` 自动安装;`xensevr_pc_service_sdk`(Pico4)的 Python 绑定在主仓库里,要链接的 C SDK(`PXREARobotSDK.h` + `libPXREARobotSDK.so`)取自下一步安装的 [XenseVR PC Service `.deb`](#24),这个 C SDK 今后随新版 `.deb` 更新,不是重跑 `--install`。

    !!! warning "更新子模块后必须重新编译 `xense.taccap`"
        `taccap-gripper` 的 Python 包带一份编译产物,`git submodule update` 只更新文件不重新编译,之后 `import xense.taccap` 会报 `AttributeError: module 'xense.taccap._taccap_native' has no attribute 'GripperAutoCalConfig'` 一类错误。拉取含 `cpp/` 或 `python/bindings/` 改动的更新后重新构建(不需要 sudo),或直接 `bash setup_env.sh --install`:

        ```bash
        cd ~/xense-taccap-lerobot
        LIBRARY_PATH="${CONDA_PREFIX}/lib" \
          uv pip install -e third_party/taccap-gripper --no-deps --no-build-isolation
        python -c "import xense.taccap as t; print(t.__version__)"
        ```

    ### 创建并激活环境

    `--mamba` 默认创建 `xense-taccap` 环境,要自定义环境名就在 `--mamba` 后追加:

    ```bash
    ./setup_env.sh --mamba
    mamba activate xense-taccap
    ```

    ### 一键安装 {#24}

    ```bash
    ./setup_env.sh --install
    ```

    这一步用 `conda_environment.yaml` 更新环境,从 `pyproject.toml` 装主包,装 `xensesdk` 与 XenseVR PC Service 守护进程,再编译 `xensevr_pc_service_sdk`(Pico4,链接 `.deb` 里的 C SDK)与 `xense.taccap`(夹爪,来自子模块)。

    XenseVR PC Service 是约 110 MB 的 `.deb`,脚本从 [v0.2.1 release](https://github.com/XenseRobotics-AI/XenseVR-PC-Service/releases/tag/v0.2.1) 下载当前架构的包(`$XENSEVR_DEB_URL` 可覆盖下载地址),再 `sudo dpkg -i` 装到 `/opt/apps/roboticsservice`;已装同一版本时跳过,下了一半的文件也复用。Pico4 绑定要链接的 C SDK 就在这个包里,下载失败时 `--install` 会直接停下,离线或打过补丁的包用 `$XENSEVR_DEB` 指向本地文件。基线定在 v0.2.1 是因为它重新编译过 C SDK,v0.2.0 会拿旧 SDK 编 Pico4 绑定;[头显双目与头部位姿](recording.md#56)需要 PC Service ≥ v0.2.0,追踪器不受影响。

    ### 验证安装 {#25}

    三个包全部能 import 即成功:

    ```bash
    python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
    python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
    ```

    再确认采集程序可用、设备能被发现:

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    用[头显相机](recording.md#56)时再补一条,返回 `False` 说明加载的还是旧版本,重跑 `./setup_env.sh --install`:

    ```bash
    python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
    ```

    可选:确认视频编解码依赖可加载。`torchcodec` 按 PyTorch 兼容矩阵固定,PyAV 固定为 `15.1.0`,FFmpeg 不参与 conda 求解;需要带 `libsvtav1` 的系统 ffmpeg 请单独装,默认编码路径不依赖它:

    ```bash
    python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
    python -c 'import av; print("PyAV OK ->", av.__version__)'
    ```

=== "Docker 交付镜像"

    ### 镜像内容与主机要求 {#docker}

    镜像已包含完整的 `xense-taccap` 环境、CUDA 用户态库、采集程序和三个硬件 SDK(XenseSDK、TacCap-Gripper、Pico4 绑定),容器启动时自动拉起 XenseVR PC Service,不需要子模块或主机环境。为支持采集中热插拔触觉传感器、腕相机、夹爪串口和 Pico4,容器以**特权模式**运行并共享主机网络与 IPC,只在信任的采集主机上运行。

    主机要求:Ubuntu 22.04 / 24.04 **amd64**,**NVIDIA 驱动 ≥ 570.144**(`nvidia-smi --query-gpu=driver_version --format=csv,noheader` 可查)。脚本不会替你装或升级显卡驱动(涉及显卡型号、Secure Boot 和重启),不满足会直接停下;Docker Engine、Compose 插件和 NVIDIA Container Toolkit 缺了则自动装。

    ### 一键安装 {#ghcr}

    镜像发布在 GitHub Container Registry,公开,拉取不需要登录:

    ```text
    ghcr.io/xenserobotics-ai/xense-taccap-lerobot
    ```

    用普通用户(不要用 root)执行:

    ```bash
    git clone https://github.com/XenseRobotics-AI/xense-taccap-lerobot.git
    cd xense-taccap-lerobot
    ./docker/install_customer.sh
    ```

    脚本依次:检查系统与显卡驱动 → 按需安装 Docker 与 NVIDIA Container Toolkit(并把 NVIDIA runtime 注册进 Docker)→ 安装夹爪串口 udev 规则(即[串口权限](host-setup.md#32)的 ModemManager 屏蔽规则)→ 拉取镜像 → CUDA 与图形能力冒烟测试。克隆仓库只为拿 `compose.yaml` 和脚本。

    需要走代理时:

    ```bash
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./docker/install_customer.sh
    ```

    完全离线的机器向交付渠道要镜像 `.tar` 包,放进仓库根目录或作为第一个参数传给脚本,脚本会改为校验并导入:

    ```bash
    ./docker/install_customer.sh xense-taccap-lerobot-0.0.6-linux-amd64.tar
    ```

    在线拉取仍是默认:镜像二十多 GB 大部分是不常变的依赖层,升级只拉变动的几层。

    ### 录数据前先把版本钉死 {#docker-pin}

    默认拉的 `latest` 是浮动的,下次发布会指向新镜像。正式采集前在仓库根目录的 `.env` 里钉死版本;`compose.yaml` 默认镜像已是 `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`,不需要再写 `LEROBOT_IMAGE`(只在换镜像名时用):

    ```dotenv
    LEROBOT_IMAGE_TAG=0.0.6
    ```

    改完确认解析到的是这一版,再拉:

    ```bash
    docker compose config --images
    docker compose pull
    ```

    钉在 `0.0.5` 及更早时有两条已知问题(`0.0.6` 已修,不影响录到的数据):录制要加 `--play_sounds=false`(镜像里没有 `spd-say`,见[故障排查](troubleshooting.md#docker));导出要以 root 拷再 `chown`,见[数据放在哪](#docker-data)。

    ### 安装后的主机设置 {#docker-host}

    脚本已把你加进 `docker` 组,但当前终端不会自动生效。这两条在宿主机上敲:

    ```bash
    newgrp docker                    # 让 docker 组权限在当前终端生效
    xhost +si:localuser:root         # 要在容器里显示 Rerun 等窗口
    ```

    !!! warning "逐条敲,不要整块粘贴"
        `newgrp` 会开一个子 shell,整块粘贴时后面的命令会被它吃掉,`xhost` 必须等 `newgrp` 之后再单独敲;不执行 `newgrp docker` 就进容器会得到 `permission denied`。注销重登更干净,没有 `newgrp` 后新建文件属组变 `docker` 的副作用。

    `docker` 组权限接近 root,只把需要采集的用户加进去。`xhost` 授权用完可撤销:`xhost -si:localuser:root`。

    ### 进入容器与验证

    ```bash
    docker compose run --rm xense-taccap
    ```

    容器里确认四个 import 全过、GPU 可见:

    ```bash
    python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
    python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
    python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
    python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
    ```

    再确认 Pico4 绑定和守护进程是同一个版本:

    ```bash
    python -c 'import importlib.metadata as M; print("pico4 ->", M.version("xensevr_pc_service_sdk"))'
    dpkg-query -W -f='daemon -> ${Version}\n' xensevr-pc-service
    ```

    ```text
    pico4 -> 0.2.1
    daemon -> 0.2.1
    ```

    !!! warning "这两行必须一致,不一致就别拿这个镜像录数据"
        Pico4 绑定链接的 C SDK 取自那个 `.deb`,对不上说明镜像是半新不旧的构建,追踪器数据可能不对。换一个 tag 重新 `docker compose pull`,或联系交付渠道。

    最后确认设备能被发现:

    ```bash
    lerobot-find-cameras
    lerobot-info
    ```

    不进交互 shell 也可以直接跑:

    ```bash
    docker compose run --rm xense-taccap lerobot-info
    ```

    ### 数据放在哪、为什么删容器不丢 {#docker-data}

    容器里的四个目录都挂在 Docker volume 上,`--rm` 删掉临时容器不影响它们:

    | 容器内路径 | volume | 放什么 |
    |---|---|---|
    | `/data` | `lerobot-data` | 数据集(`HF_LEROBOT_HOME=/data/lerobot`) |
    | `/root/.xensesdk` | `xensesdk-cache` | 传感器按序列号缓存的配置,别删:留着它容器重启不必重读 flash、不触发 USB 重新枚举 |
    | `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face 缓存 |
    | `/root/.cache/torch` | `torch-cache` | Torch 缓存 |

    卷在宿主机上位于 `/var/lib/docker/volumes/xense-taccap-lerobot_<卷名>/_data`,属 root,直接 `ls` 要 sudo;走容器看更省事:

    ```bash
    docker compose run --rm xense-taccap bash -lc 'ls -la /data/lerobot'
    ```

    !!! danger "不要用 `docker volume prune`"
        它删"当前没有容器在用"的卷,而数据卷平时正是这个状态(容器是 `--rm` 的),录好的数据会被删且不可恢复。清理镜像用 `docker image prune`,清理构建缓存用 `docker builder prune`,都不碰卷。

    导出到宿主机:以 root 读、拷完在同一条命令里交还属主:

    ```bash
    mkdir -p export
    docker compose run --rm --no-deps \
        --entrypoint /bin/bash \
        -v "$PWD/export:/export" \
        xense-taccap \
        -lc "cp -a /data/lerobot /export/ && chown -R $(id -u):$(id -g) /export"
    ```

    三处都不能省:`--entrypoint /bin/bash` 跳过默认启动脚本(它会 `chmod 0700` 运行目录);`chown` 在同一条命令里,否则导出文件属主是 root,宿主机上改不了;先 `mkdir -p export`,Docker 自动创建的挂载点归 root,非 root 写不进去。`cp -a` 会带上权限,`0.0.5` 及更早录的数据导出后仍是 `0600`,要让其他用户也能读,在上面那条末尾再接:

    ```bash
        && chmod -R u+rwX,go+rX /export
    ```

    !!! warning "不要改成用 `--user` 以自己的身份拷"
        `docker compose run --user ...` 仍会跑启动脚本,非 root 改不动运行目录权限,报 `chmod: changing permissions of '/tmp/xdg-runtime': Operation not permitted`;`0.0.5` 及更早的镜像录出的视频是 `-rw------- root`,非 root 拷贝会在每个 `.mp4` 上报 `Permission denied`(元数据 `0644` 拷得动,像个别文件损坏)。`0.0.6` 起视频落盘即为 `0644`,但升级不改写已录文件。

    ### 让数据直接落在宿主机目录 {#docker-data-dir}

    频繁看、删数据或另挂了大盘时,这比每次拷出来省事。在 `.env` 里指定,不要改 `compose.yaml`(仓库跟踪的文件,写进绝对路径下次 `git pull` 会冲突;`.env` 不会被提交):

    ```dotenv
    LEROBOT_DATA_DIR=/home/<user>/.cache/huggingface/docker_data
    ```

    带 `/` 的值按 bind mount 处理,不带的当具名卷,不设就是默认的 `lerobot-data`。改完用 `docker compose config` 确认再录,数据出现在 `<那个目录>/lerobot/`。

    !!! warning "bind mount 解决了位置,但不解决属主"
        录制仍以 root 运行,文件属主还是 root。录完交还给自己,或在宿主机 `sudo chown -R "$(id -u):$(id -g)" ~/.cache/huggingface/docker_data`;`ls -ln` 显示数字 uid/gid,能看出 chown 是否生效:

        ```bash
        docker compose run --rm --no-deps --entrypoint /bin/bash --user 0:0 \
            xense-taccap -lc "chown -R $(id -u):$(id -g) /data"
        ls -ln ~/.cache/huggingface/docker_data/lerobot
        ```

    Compose 透传了宿主机的 `/dev` 和 `/run/udev`,容器里同样能读到 `/dev/v4l/by-id`、`/dev/v4l/by-path` 和 `/dev/serial/by-path`,[设备自动发现](host-setup.md#33)靠的就是它们。

    要在容器里[上传 Hub](dataset.md#64),把 token 写进同一个 `.env`,它会作为 `HF_TOKEN` 带进容器;否则容器是 `--rm` 的,每次都得重新 `hf auth login`:

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    ### 容器里的图形界面 {#docker-gui}

    镜像已带 Rerun 需要的 XKB / Vulkan / XDG 运行库,默认 `WGPU_BACKEND=vulkan`,Compose 也透传了 `DISPLAY` 和 X11 socket。窗口出不来时,先做 [`xhost` 授权](#docker-host),再在容器里确认显卡可见:

    ```bash
    vulkaninfo --summary
    ```

    !!! warning "别把 `compose.yaml` 里的 `runtime: nvidia` 改成 `gpus: all`"
        `gpus: all` 只申请到 compute + utility,容器能跑 CUDA、`nvidia-smi` 也正常,但 NVIDIA 的 Vulkan ICD 不会注入,Rerun 报 `WGPU error: Failed to create surface for any enabled backend`。`runtime: nvidia` 要求 NVIDIA runtime 已注册进 Docker(`install_customer.sh` 会做),没注册时 Compose 报 `Unknown runtime specified nvidia`,见[故障排查](troubleshooting.md#docker)。

    只处理数据、不接 Pico4 时可以不启动 XenseVR PC Service,服务日志在容器内 `/tmp/xensevr-service.log`:

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```

环境装好后,先做[主机配置](host-setup.md)(串口权限、设备发现),否则夹爪能被列出却打不开。
