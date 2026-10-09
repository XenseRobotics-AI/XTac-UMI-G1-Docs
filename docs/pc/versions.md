# 版本与升级

序列号和版本号都是示例，以实际读到的为准。完整变更见 [CHANGELOG](https://github.com/XenseRobotics-AI/xense-taccap-lerobot/blob/main/CHANGELOG.md)，反馈见[支持与反馈](../common/reference.md#support)。

## 必须升级到最新版本 {#required}

!!! warning "采集前先把各项都升到下表版本，这不是可选项"
    - 固件带[命令集 V2.1](#v21) 才支持行程标定。
    - SDK 0.4.1 附带的镜像修掉了[已知缺陷](#ota-when)。
    - 三者齐了 `gripper.pos` 归一化才成立。
    - 主夹爪缺标定或固件过低会被拒绝连接；其它不配套组合照常落盘，但数据对不上。

| 组件 | 最低要求 | 怎么查 |
|---|---|---|
| `xense-taccap-lerobot` | `0.5.1+xtac.0.1.0` | `pip show lerobot` 或看 `pyproject.toml` |
| `xense.taccap` SDK | **0.4.1** | `python -c "import xense.taccap as t; print(t.__version__)"` |
| 夹爪固件 | **命令集 V2.1**，即 leader ≥ 1.2.0 / follower ≥ 1.1.0；用从夹爪（`--robot.role=follower`）时 follower 须 ≥ 1.2.5（低于 1.2.11 提示升级） | 跑 [`calibrate.py`](calibration.md#41) 或[直接读](#check-versions) |
| 每台 leader 的编码器标定 | 零点 + 行程上限已写入 flash | [夹爪标定](calibration.md#41) |
| XenseVR PC Service | ≥ v0.2.0，装机直接用 v0.2.1 | `dpkg -s xensevr-pc-service` 的 `Version` |

顺序：先[拉仓库与子模块](#repo-update)并重编 SDK（否则 `import xense.taccap` 失败），再[刷固件](#ota)，最后[夹爪标定](calibration.md#41)（升级不产生标定值）。

```mermaid
flowchart LR
    A[拉仓库 + 子模块] --> B[重新编译 xense.taccap] --> C[刷固件 OTA] --> D[每台 leader 标定]
```

- 已采数据不用重采；与新数据混用前确认两批 `gripper.pos` 刻度一致。
- 升级后重做环境验证、设备自检和一条短 episode 校验。

## 版本兼容基线

命令与字段以本地 checkout 和 SDK 附带的设备说明为准。

| 组件 | 支持范围 / 约束 | 已验证基线 |
|---|---|---|
| 操作系统 / 架构 | Ubuntu 22.04 / 24.04，amd64 | 22.04.5 / 24.04.4，x86_64 |
| Linux 内核 | 不构成约束 | 6.8 / 6.14 / 7.0 |
| 采集主机 | 最低 12 代 i7、8 GB、512 GB SSD；推荐 Core Ultra 9 275HX、32 GB、1 TB NVMe，见[主机配置](install.md#host-spec) | — |
| NVIDIA GPU / 驱动 | 最低 RTX 3060 / 8 GB（推荐 RTX 5060 Laptop / 8 GB 起），驱动 ≥ 570.144；无 NVIDIA 显卡只能[降级录制](recording.md#no-gpu) | 570.144 / 580.126.09 / 595.71.05 |
| Python | ≥ 3.12（`conda_environment.yaml` 固定 `python=3.12`） | 3.12.13 |
| PyTorch | `torch>=2.2.1,<2.11.0`;`torchvision>=0.21.0,<0.26.0` | 2.10.0 / 0.25.0 |
| `torchcodec` | `>=0.2.1,<0.11.0`，`setup_env.sh` 按当前 torch 自动对齐 | 0.10.0 |
| PyAV | `av>=15.0.0,<16.0.0`，安装脚本固定 15.1.0 | 15.1.0 |
| `rerun-sdk` | `>=0.24.0,<0.27.0` | 0.26.2 |
| `opencv-python` | `==4.12.0.88` | 4.12.0.88 |
| NumPy | `>=1.26.4` | 2.2.6 |
| `xense-taccap-lerobot` | 基于 lerobot 0.5.1，版本号 `0.5.1+xtac.0.1.0` | `v0.1.0` |
| `xense.taccap` SDK | 与主仓库子模块 `third_party/taccap-gripper` 配套 | 0.4.1（tag `v0.4.1`），附带固件 leader 1.2.6 / follower 1.2.14 |
| 夹爪固件 | 命令集 V2.1（帧格式 V1.8），leader ≥ 1.2.0 / follower ≥ 1.1.0 | leader 1.2.6 / follower 1.2.14，随 SDK 走，以 `firmware/manifest.json` 为准，见 [OTA](#ota) |
| `xensesdk` | 由安装脚本提供 | 2.1.2 |
| XenseVR PC Service(`.deb`) | ≥ v0.2.0 | v0.2.1 |
| `xensevr_pc_service_sdk` | 在主仓库内，链接 `.deb` 的 C SDK | 0.2.1，版本号取自 `.deb` |

`.deb`（`/opt/apps/roboticsservice/SDK`）是 Pico4 C SDK 唯一来源，`--install` 不重编它，停在 v0.2.0 会拿旧 SDK 编绑定。v0.2.0 起转发[头显相机](recording.md#56)帧。

## 三套编号：V2.1 是命令集，不是固件版本 {#v21}

| 编号 | 当前值 | 是什么 |
|---|---|---|
| 帧格式 | `V1.8` | 字节怎么打包成帧，极少变动 |
| **命令集** | **`V2.1`** | 固件实现的命令。行程标定的 `EncoderMaxCal` 由 V2.1 引入（V2.0 鱼眼标定，V1.9 LED 与私有电机参数） |
| 固件构建号 | leader ≥ 1.2.0 / follower ≥ 1.1.0 | 具体镜像，是门槛不是等号：更高的号（如 leader 1.2.2）同样支持 V2.1 |

够用不等于没缺陷，见[我需要刷吗](#ota-when)。

## 如何查版本 {#check-versions}

固件版本不在 SN 里，需 `GetVersion` 读取；下面同时打出 SDK 版本：

```bash
python - <<'EOF'
import xense.taccap as t
from xense.taccap import scan_grippers, LeaderGripper, Cmd
print("xense.taccap", t.__version__, "(需要 >= 0.4.1)")
for ep in scan_grippers():
    g = LeaderGripper(mcu_device=ep.mcu_device)   # 只读版本,主从夹爪通用
    ack = g.transport.send_cmd(Cmd.GetVersion, b"", 500)
    print(f"  {ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}")
EOF
```

刷固件前的输出（两只主夹爪，旧版 `fw` 1.2.5，刷完应为 1.2.6）：

```text
xense.taccap 0.4.1 (需要 >= 0.4.1)
  TCGU01A28Z0023m  Left   fw=1.2.5
  TCGU01A28Z0024m  Right  fw=1.2.5
```

- 主从夹爪都用 `LeaderGripper` 打开；`FollowerGripper` 会拒绝固件低于 1.2.5 的从夹爪。
- 只传 `mcu_device`、`normalize_position` 保持默认 `False`，未标定也能读。
- ACK 第 4 字节 `build` 恒为 0，按 `MAJOR.MINOR.PATCH` 三段比较。

其余组件：

```bash
python - <<'EOF'
import importlib.metadata as M
for p in ("lerobot", "taccap-gripper", "xensesdk", "torch", "torchvision",
          "torchcodec", "av", "rerun-sdk", "opencv-python", "numpy"):
    try:
        print(f"{p:16} {M.version(p)}")
    except M.PackageNotFoundError:
        print(f"{p:16} 未安装")
EOF
nvidia-smi --query-gpu=driver_version,name --format=csv,noheader      # 需 >= 570.144
dpkg -s xensevr-pc-service 2>/dev/null | grep -E '^(Package|Version|Architecture):'
python -c "import xensevr_pc_service_sdk as xrt; print('pico camera API:', hasattr(xrt, 'has_pico_camera_frame'))"
```

`pip show xensevr-pc-service-sdk` 显示构建时从 `dpkg` 读到的 `.deb` 版本；头显相机接口看 `has_pico_camera_frame`；夹爪 SN 与角色见[快速开始](quickstart.md#self-check)。

## 0.1.0 更新要点 {#whats-new}

- **带不带头显由 `--robot.type` 决定**：双夹爪新增 `xtac_umi_g1`（录头显双目与头部位姿），`bi_taccap_gripper` 不录头显；`--robot.enable_head_camera` 与类型矛盾时报错，见[录制](recording.md#52)。
- 夹爪 SDK 升到 0.4.1，附带固件主夹爪 1.2.6 / 从夹爪 1.2.14，见[固件 OTA](#ota)。
- 不再落盘 `meta/runtimes/`；`meta/info.json` 新增 `collection_stack`，标明录制软件，见[数据集](dataset.md)。
- `lerobot-check-dataset` 视频帧数严格相等：少帧报错、多帧告警；编辑数据集重新编码沿用采集时的编码器。
- Docker 镜像支持在容器内语音播报。
- 仓库、子模块与镜像地址迁到 `XenseRobotics-AI` 组织。
- 拉到 v0.1.0 后**必须重跑 `./setup_env.sh --install`**。

## 仓库与子模块更新 {#repo-update}

按发布 tag 更新，不要直接拉 `main`（可能含未发布改动）：

```bash
git fetch --tags
git checkout v0.1.0
git submodule update --init --recursive --progress
./setup_env.sh --install     # 对齐依赖并重编 xense.taccap
git submodule status         # 子模块应对应 v0.4.1
```

!!! warning "拉完子模块必须重新编译 `xense.taccap`"
    `git submodule update` 只更新文件，不重跑 `./setup_env.sh --install` 则 `import xense.taccap` 失败。SDK 版本号不变（如 0.4.1）也可能含 C++ 改动，每次都要重跑。

<span id="submodule-ssh"></span>

!!! warning "子模块地址是 SSH 形式：没有 GitHub SSH key 的机器先改写一次地址"
    `third_party/taccap-gripper` 的地址是 `git@github.com:` 形式，没配 SSH key 时拉子模块会失败。子模块仓库公开，克隆或更新前执行一次改走 HTTPS：

    ```bash
    git config --global url."https://github.com/".insteadOf "git@github.com:"
    ```

    能正常更新的机器不必处理，**也不要执行 `git submodule sync`**，否则会切回 SSH。[Docker 路径](install.md#docker)不受影响。

## 固件 OTA 升级 {#ota}

### 我需要刷吗 {#ota-when}

跑一次 [`calibrate.py`](calibration.md#41)，固件不够会退出并打印当前版本（样例见[夹爪标定](calibration.md#41)）。任一条成立就刷：

- `calibrate.py` 报 `needs command set >= V2.1` 退出；
- 主夹爪连不上，报错提示先做 OTA；
- 固件低于命令集 V2.1。

V2.1 只是底线，旧固件有已知缺陷，请刷到 SDK 0.4.1 附带的 leader 1.2.6 / follower 1.2.14（见[从夹爪固件版本表](../follower/firmware.md#check-version)）。不换主板、不擦固件，刷一次即可。

### 怎么刷

!!! warning "先升级 SDK，再刷固件"
    - 镜像随 SDK 走：先把子模块升到 SDK 0.4.1，用它刷写与校验，才能刷到 1.2.6 / 1.2.14；绝不要用低于 0.1.7 的 SDK 刷。
    - 新 SDK 与旧固件通信不变，先升 SDK 总是安全的。
    - 镜像版本以 `firmware/manifest.json` 里的 `version` 为准，不要从 SDK 版本号推。

镜像在 `third_party/taccap-gripper/firmware/`，只留当前发布版；文件名带版本号，优先按角色让脚本挑。各镜像文件名与版本见同目录 `manifest.json`：

```bash
python -c "import json;m=json.load(open('third_party/taccap-gripper/firmware/manifest.json'));[print(i['file'],i['version']) for i in m['images'].values()]"
```

| 镜像 | 适用角色 |
|---|---|
| `tc-gu-01-master-1.2.6.bin` | 主夹爪（SN 末位 `m`） |
| `tc-gu-01-slave-1.2.14.bin` | 从夹爪（SN 末位 `s`） |

按角色选，不按左右手：`TCGU01A28Z0023m` 末位 `m`，用主夹爪镜像；一套设备两只常都是主夹爪。

```bash
# 1. 确认每只夹爪的角色
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.firmware_sn, '->', 'master' if g.firmware_sn.endswith('m') else 'slave')"

# 2. 刷写:插着的每只夹爪各刷自己角色的镜像
python third_party/taccap-gripper/python/examples/ota_update.py --all

# 3. 断电重插后确认实际刷上的版本
python -c "
from xense.taccap import scan_grippers, LeaderGripper, Cmd
for ep in scan_grippers():
    g = LeaderGripper(mcu_device=ep.mcu_device)
    ack = g.transport.send_cmd(Cmd.GetVersion, b'', 500)
    print(f'{ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}')
"
```

- 镜像名按给的路径、SDK 根目录、SDK `firmware/` 依次解析，任意目录可运行，连设备前就检查。
- `--target-version` 通常不用写：只给校验日志和分区元数据打标记，脚本按 CRC32 在 `manifest.json` 里查出版本号，它不认识的镜像才需指定。
- 约 1 秒写完，重启约 1–3 秒；新固件先写备用分区，校验通过才替换，传输失败不会刷坏。
- 第 3 步读回须不低于 leader 1.2.0 / follower 1.1.0，刷当前附带镜像应为 1.2.6 / 1.2.14。

其它写法：

- 只插一只主夹爪（或从夹爪）时只写角色：`ota_update.py master` / `ota_update.py slave`。
- 同角色多只里刷一只，写镜像文件名 + 左右或 SN：`ota_update.py tc-gu-01-master-1.2.6.bin left`（以 `firmware/` 里实际文件名为准）。
- 不要写 `slave left` / `master left`：第一个参数会被当成文件名，报 `firmware file not found`。

!!! danger "刷错角色会导致夹爪无法启动，需返厂恢复"
    `ota_update.py` 按 CRC32 比对 `manifest.json` 识别镜像，角色不符直接拒绝，`--force` 才能强制；手工编译的镜像带提示放行。升级期间不要断电或拔线。

!!! danger "刷完必须断电重插一次"
    这是升级流程的一步，不是排障手段。

    - OTA 后是软复位，USB 转串口芯片没断电，设备停在降级状态：版本正确、数据流正常、错误计数为 0，却悄悄丢状态帧。实测 60 秒一轮，只做 OTA 丢 35~39 帧，断电重插后为 0。
    - 顺序：刷写 → 断电重插 → 第 3 步确认 → 标定，断电前的数据不可信。
    - 主夹爪拔插 USB 线；从夹爪拔下 24V 电源线，等约 2 秒插回，USB 线不用拔（主控板和电机都由 24V 供电）。
    - 等夹爪重启完成再断电重插。

升到 V2.1 后回[夹爪标定](calibration.md#41)标零点和行程上限。
