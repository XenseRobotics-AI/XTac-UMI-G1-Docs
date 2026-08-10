# 2. 环境部署

本章面向 **Ubuntu 22.04 / 24.04 LTS(amd64)**,把 `xense-taccap-lerobot` 及全部硬件 SDK
装好并验证。

!!! info "XTac-UMI G1 已验证环境"
    XTac-UMI G1 硬件联调与采集流程在 `mamba` 环境 `xense-taccap` 下验证。当前可读取的测试主机环境:

    - OS: Ubuntu 22.04.5 LTS / Ubuntu 24.04.4 LTS
    - Linux kernel: **6.8 / 6.14 / 7.0 系列均已验证**,内核版本不构成约束
    - 机器架构: `x86_64`
    - Python: `3.12.13`(主仓库要求 **≥ 3.12**)
    - 仓库 commit 与各包版本: 见 [版本与支持](versions.md)(唯一出处,避免多处抄写走样)

    Ubuntu 22.04 LTS 也是本章覆盖的目标环境;其它发行版或架构需按实际驱动、UVC、串口权限和 `.deb` 包支持情况单独验证。

    建议采集主机配 NVIDIA GPU,这样 `--dataset.vcodec=auto` 可使用 GPU H.264 硬件编码器,降低多路视频实时编码时的 CPU 压力。
    **配了 NVIDIA GPU 的话,驱动需 ≥ 570.144**(`nvidia-smi --query-gpu=driver_version --format=csv,noheader` 可查)。

## 选择安装方式 {#choose}

有两条路径,装出来的采集环境是同一套,选一条走完即可。

| | **Mamba 源码安装** | **Docker 交付镜像** |
|---|---|---|
| 拿到的东西 | 源码仓库,自己建环境 | 一个打包好的交付目录,跑一个脚本 |
| 耗时 | 较长,夹爪 SDK 与 Pico4 绑定都要现编译 | 十几分钟(主要在导入镜像) |
| NVIDIA GPU | 可选([没有 GPU 也能采](05-data-collection.md#no-gpu)) | **必需**,驱动 ≥ 570.144 |
| 环境隔离 | 装在主机的 Mamba 环境里 | 装在容器里,不污染主机 |
| 改代码 | 方便 | 不方便 |
| 步骤 | 下面 2.1 – 2.5 | [Docker 交付镜像](#docker) |

**默认走 Mamba**——**没有 NVIDIA GPU 也能采**,要改采集程序也方便。本手册后续章节的命令
都按这条路径书写。

机器有 **NVIDIA 驱动**、又不想自己建环境时,可以选 Docker。

!!! warning "两条路径都需要能访问外网"
    安装过程要从网上取东西——conda 要拉 conda-forge 与 PyPI 包、克隆 GitHub 仓库与子模块、
    下载 XenseVR PC Service 的 `.deb`;Docker 要装 Docker Engine 与 NVIDIA Container Toolkit。
    **离线机器两条都走不通。**

    在受限网络里,给终端配好代理再开始(Docker 那条脚本支持 `XENSE_PROXY_URL`,见
    [一键安装](#docker))。

以下 2.1 – 2.5 是 **Mamba 源码安装**这条路径。

!!! info "走 Docker 的话,2.1 – 2.5 整段跳过"
    镜像里已经装好了 Mamba 环境、采集程序和三个硬件 SDK,不需要克隆仓库、建环境或跑
    `setup_env.sh`——直接看后面的 [Docker 交付镜像](#docker)。

!!! info "总览"
    装系统依赖包 → 装 Mamba → 克隆仓库(含子模块)→ 建环境 → `setup_env.sh --install` → 验证。

## 前置:系统依赖包(apt) {#apt}

硬件 SDK 是在 `setup_env.sh --install` 那一步**现编译**的,而刚装好的 Ubuntu 上连编译器都没有。
先装上:

```bash
sudo apt install -y build-essential cmake pkg-config git curl
sudo apt install -y v4l-utils usbutils   # 采集用不到,但排查相机全靠它俩
```

`setup_env.sh` 开跑前会先查这几个命令在不在,缺了**直接停下并打印该敲哪一行 apt**——
否则错误要等到 CMake 或链接阶段才冒出来,看着像 SDK 坏了,能耗掉一下午。

第二行只是**告警**,不阻断安装,但强烈建议装上:`v4l2-ctl --list-formats-ext` 和 `lsusb -t`
正是[相机打不开](03-host-hardware.md#usb-budget)时唯一能用的两把尺子——这也恰好是这套硬件上
最常见的装机问题。缺了它们的机器,**远程根本没法帮你查**。

!!! note "不需要 `ffmpeg`,也不需要 `libudev-dev` / `libusb-1.0-0-dev`"
    `torchcodec` 用的是 conda 环境里那份 FFmpeg **动态库**,系统装不装 `ffmpeg` 命令都不影响。
    `libudev` / `libusb` 则是**运行期**由预编译 wheel 加载的,用的是 Ubuntu 本来就有的
    `libudev1` / `libusb-1.0-0`,没有任何东西需要它们的 `-dev` 头文件。

## 2.1 前置:安装 Mamba / Miniforge

强烈推荐用 Mamba:依赖求解比原生 conda **快约 10×**,且在所有 channel 上都更快。

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

## 2.2 克隆仓库与子模块 {#22}

仓库用 `third_party/` 子模块管理硬件 SDK,**必须**递归克隆:

```bash
git clone \
  --recurse-submodules \
  https://github.com/Vertax42/xense-taccap-lerobot.git
cd xense-taccap-lerobot
```

若已经克隆但漏了子模块:

```bash
git submodule update --init --recursive --progress
```

子模块与对应安装包——**只有一个**:

| 子模块 | 安装后的包 |
|---|---|
| [`third_party/taccap-gripper`](https://github.com/Vertax42/TacCap-Gripper) | `xense.taccap`(XTac-UMI G1 触觉夹爪 SDK) |

!!! note "xensesdk 不是子模块"
    `xensesdk` 是视触觉传感器 SDK,由 `setup_env.sh --install` 自动安装,无需单独拉取子模块。

!!! info "`xensevr_pc_service_sdk`(Pico4 追踪器 / 头显相机)也不再是子模块"
    它的 Python 绑定就在主仓库里(`src/lerobot/teleoperators/pico4/`),绑定要链接的 C SDK
    (`PXREARobotSDK.h` + `libPXREARobotSDK.so`)**直接从下一步安装的
    [XenseVR PC Service `.deb`](#24) 里取**——那个包本来就带着它,不必再为了重新编译它而克隆
    一份服务源码。**递归克隆从约 33 MiB 降到约 1.6 MiB**,安装时也不再跑 cmake 链接。

    对使用者的影响只有一条:**这个 C SDK 的更新,今后是通过新版 `.deb` 到你手上的**,
    不是重跑一次 `--install`。

!!! danger "更新子模块后必须重新编译 `xense.taccap`"
    `taccap-gripper` 的 Python 包里带一份**编译产物**。`git submodule update` 只更新文件,
    不会重新编译——文件更新了而编译产物还是旧的时候,`import xense.taccap` 会直接失败,例如:

    ```text
    AttributeError: module 'xense.taccap._taccap_native' has no attribute 'GripperAutoCalConfig'
    ```

    拉取任何含 `cpp/` 或 `python/bindings/` 改动的子模块更新后,重新构建:

    ```bash
    cd ~/xense-taccap-lerobot
    LIBRARY_PATH="${CONDA_PREFIX}/lib" \
      uv pip install -e third_party/taccap-gripper --no-deps --no-build-isolation
    ```

    或直接 `bash setup_env.sh --install`(会一并处理其他 SDK)。**不需要 sudo。**
    完成后验证:

    ```bash
    python -c "import xense.taccap as t; print(t.__version__)"
    ```

## 2.3 创建并激活环境

```bash
./setup_env.sh --mamba
mamba activate xense-taccap
```

!!! tip "环境名"
    `--mamba` 默认创建 `xense-taccap` 环境;要自定义环境名,在 `--mamba` 后追加名称。

## 2.4 一键安装 {#24}

```bash
./setup_env.sh --install
```

这一步会:

- 用 `conda_environment.yaml` 更新 mamba/conda 环境
- 从 `pyproject.toml` 安装主包
- 安装 `xensesdk` 视触觉传感器 SDK
- 安装 **XenseVR PC Service 守护进程**(约 110 MB 的 `.deb`,装到 `/opt/apps/roboticsservice`)
- 编译两个硬件 SDK:`xensevr_pc_service_sdk`(Pico4,链接上一步 `.deb` 里的 C SDK)
  与 `xense.taccap`(夹爪,来自子模块)

!!! note "XenseVR PC Service 的 .deb 从哪来"
    `./setup_env.sh --install` 会直接从
    [v0.2.1 release](https://github.com/Vertax42/XenseVR-PC-Service/releases/tag/v0.2.1)
    下载当前机器架构对应的 `.deb` 包(可用 `$XENSEVR_DEB_URL` 覆盖下载地址),
    再执行 `sudo dpkg -i` 安装。

    **已经装了同一版本时会直接跳过,一个字节都不下**,所以重跑 `--install` 不会再等这 110 MB;
    上次下到一半或已下完的文件也会被复用,不会重来。

!!! danger "这个包下不下来,安装会直接停"
    Pico4 绑定要链接的 C SDK 现在就在这个包里(见 [2.2 克隆仓库与子模块](#22))。
    所以下载失败时 `--install` 会**直接停下**,而不是拿一个不存在的库去编译。
    离线或需要打补丁的包,用 `$XENSEVR_DEB` 指向本地文件。

!!! warning "头显双目与头部位姿需要 PC Service ≥ v0.2.0"
    只有 v0.2.0 及以上的服务才转发头显相机的画面,[头显双目与头部位姿](05-data-collection.md#56)
    都靠这条通路。追踪器不受影响——不用头显相机的话,装哪个版本没区别。

!!! note "为什么基线是 v0.2.1 而不是 v0.2.0"
    脚本会跳过"版本已经一致"的包。v0.2.1 和 v0.2.0 是同一个守护进程,区别在于**重新编译过的
    C SDK**——停在 v0.2.0 的机器会拿旧 SDK 去编 Pico4 绑定。所以这次要升一下,
    并不是守护进程本身有什么新功能。

## 2.5 验证安装 {#25}

三个包全部能 import 即成功:

```bash
python -c 'import xensevr_pc_service_sdk; print("xensevr_pc_service_sdk OK ->", xensevr_pc_service_sdk.__file__)'
python -c 'import xensesdk; print("xensesdk OK ->", xensesdk.__file__)'
python -c 'import xense.taccap; print("xense.taccap OK ->", xense.taccap.__file__)'
```

用[头显相机](05-data-collection.md#56)时再补一条——检查是不是带相机接口的新版本:

```bash
python -c 'import xensevr_pc_service_sdk as xrt; print("pico camera API:", hasattr(xrt, "has_pico_camera_frame"))'
```

返回 `False` 说明环境里加载的还是旧版本,重新执行 `./setup_env.sh --install` 即可。

可选:确认视频编解码依赖可加载(`torchcodec` 按 PyTorch 兼容矩阵固定,PyAV 固定为 `15.1.0`;FFmpeg 不参与 conda 求解):

```bash
python -c 'import torchcodec; print("torchcodec OK ->", torchcodec.__version__)'
python -c 'import av; print("PyAV OK ->", av.__version__)'
```

!!! tip "需要系统 ffmpeg?"
    需要带 `libsvtav1` 的系统 ffmpeg 请单独装(apt 或官方静态构建),默认编码路径不依赖它。

---

## Docker 交付镜像 {#docker}

镜像里已经包含完整的 `xense-taccap` 环境、CUDA 用户态库、采集程序和三个硬件 SDK
(XenseSDK、TacCap-Gripper、Pico4 绑定),容器启动时还会自动拉起 XenseVR PC Service。

!!! warning "容器以特权模式运行"
    为了支持采集过程中热插拔触觉传感器、腕相机、夹爪串口和 Pico4,容器使用特权模式,
    并共享主机的网络与 IPC。**只在你信任的采集主机上运行。**

### 主机要求

- Ubuntu 22.04 / 24.04,**amd64**
- **NVIDIA 驱动 ≥ 570.144** —— `nvidia-smi --query-gpu=driver_version --format=csv,noheader` 可查

安装脚本**不会替你装或升级显卡驱动**(涉及显卡型号、Secure Boot 和重启),驱动不满足
会直接停下来提示。Docker Engine、Compose 插件和 NVIDIA Container Toolkit 缺了则由脚本自动装。

### 一键安装

把交付目录整个拷到采集主机,用**普通用户**(不要用 root)执行:

```bash
cd xense-taccap-lerobot-0.0.4-linux-amd64     # 目录名里的版本以你拿到的交付包为准
./install_customer.sh
```

脚本依次完成:检查系统与显卡驱动 → 按需安装 Docker 与 NVIDIA Container Toolkit →
安装夹爪串口的 udev 规则(即 [3.2](03-host-hardware.md#32) 的 ModemManager 屏蔽规则)→
校验镜像 SHA256 并导入 → 跑一次 PyTorch CUDA 冒烟测试。

!!! tip "需要走代理时"
    ```bash
    XENSE_PROXY_URL=http://127.0.0.1:7897 ./install_customer.sh
    ```

### 从镜像仓库在线拉取(可选) {#ghcr}

镜像同时发布在 GitHub Container Registry,**公开、不需要登录**:

```text
ghcr.io/vertax42/xense-taccap-lerobot
```

在交付目录(或仓库根目录)的 `.env` 里指向它:

```dotenv
LEROBOT_IMAGE=ghcr.io/vertax42/xense-taccap-lerobot
LEROBOT_IMAGE_TAG=0.0.4
```

再拉取并照常进容器:

```bash
docker compose pull
docker compose run --rm xense-taccap
```

!!! warning "只改 `LEROBOT_IMAGE_TAG` 是不起作用的"
    `compose.yaml` 默认用的是**本机构建**的 `xense-taccap-lerobot`,**只有设置了
    `LEROBOT_IMAGE`** 才会转去 GHCR 拉取。两行要一起写。

**首次交付仍建议用上面的离线包**(完全离线的机器只能走这条)。在线拉取的价值在**后续升级**:
镜像二十多 GB,绝大部分是不常变的依赖层,升级时只需拉变动的几层,不用重新搬一整包。

### 安装后的主机设置

让当前用户立刻拿到 Docker 权限:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
newgrp docker        # 或者注销重登
docker images
```

!!! warning "`docker` 组成员权限接近 root"
    只把需要采集的用户加进去,不要图省事把所有本地用户都加上。

要在容器里显示 Rerun 窗口,还需由主机当前**图形桌面用户**授权一次:

```bash
xhost +si:localuser:root
# 采集结束后可撤销
xhost -si:localuser:root
```

### 进入容器与验证

```bash
docker compose run --rm xense-taccap
```

在容器里逐条确认——四个 import 全过、GPU 可见:

```bash
python -c 'import torch; print(torch.__version__, torch.cuda.is_available())'
python -c 'import xensesdk; print("xensesdk ->", xensesdk.__file__)'
python -c 'import xense.taccap; print("taccap ->", xense.taccap.__file__)'
python -c 'import xensevr_pc_service_sdk; print("pico4 ->", xensevr_pc_service_sdk.__file__)'
```

再确认设备能被发现:

```bash
lerobot-find-cameras
lerobot-info
```

不进交互 shell 也可以直接跑一条命令:

```bash
docker compose run --rm xense-taccap lerobot-info
```

### 数据放在哪、为什么删容器不丢 {#docker-data}

容器里的这四个目录都挂在 **Docker volume** 上,`--rm` 删掉临时容器不影响它们:

| 容器内路径 | volume | 放什么 |
|---|---|---|
| `/data` | `lerobot-data` | **数据集**(`HF_LEROBOT_HOME=/data/lerobot`) |
| `/root/.xensesdk` | `xensesdk-cache` | 视触觉传感器按序列号缓存的配置 |
| `/root/.cache/huggingface` | `huggingface-cache` | Hugging Face 缓存 |
| `/root/.cache/torch` | `torch-cache` | Torch 缓存 |

查看数据:

```bash
docker compose run --rm xense-taccap bash -lc 'ls -la /data'
```

!!! note "传感器配置缓存别删"
    第二个 volume 存的是每枚传感器的配置。留着它,容器重启时就不必重新读传感器 flash、
    也不会因此触发 USB 重新枚举——**启动更快,也更稳**。

!!! note "设备发现在容器里同样成立"
    Compose 会把宿主机的 `/dev` 和 `/run/udev` 透传进来,所以容器里也能读到
    `/dev/v4l/by-id`、`/dev/v4l/by-path` 和 `/dev/serial/by-path`——
    [3.3 的自动发现](03-host-hardware.md#33)靠的就是这些路径。

!!! tip "要在容器里[上传 Hub](06-dataset.md#64)"
    把 token 写进交付目录的 `.env`,它会作为 `HF_TOKEN` 带进容器:

    ```dotenv
    HF_TOKEN=hf_xxxxxxxxxxxxxxxx
    ```

    不写的话,每次进容器都得重新 `hf auth login`——容器是 `--rm` 的,登录状态不留存。

### 容器里的图形界面 {#docker-gui}

镜像已带齐 Rerun 需要的 XKB / Vulkan / XDG 运行库,并默认 `WGPU_BACKEND=vulkan`;
Compose 也透传了 `DISPLAY` 和 X11 socket。窗口出不来时,先做上面那次
[`xhost` 授权](#docker),再在容器里确认显卡可见:

```bash
vulkaninfo --summary
```

!!! tip "只处理数据、不接 Pico4 时"
    容器默认会启动 XenseVR PC Service。用不到追踪器时可以关掉:

    ```bash
    START_XENSEVR_SERVICE=0 docker compose run --rm xense-taccap
    ```

    服务日志在容器内 `/tmp/xensevr-service.log`。

---

环境装好后,**先做主机与硬件配置**(串口权限、设备发现),否则夹爪能被列出却打不开。

下一步 → [3. 主机与硬件配置](03-host-hardware.md)
