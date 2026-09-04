# 版本与升级

本页给出采集前必须达到的版本基线,以及怎么查版本、更新仓库与 SDK、刷夹爪固件。文中的序列号和版本号都是示例,以你自己读到的为准。完整变更记录见仓库 [CHANGELOG](https://github.com/XenseRobotics-AI/xense-taccap-lerobot/blob/main/CHANGELOG.md),反馈问题见[支持与反馈](../common/reference.md#support)。

## 必须升级到最新版本 {#required}

!!! warning "采集前先把四项都升到下表版本,这不是可选项"
    整条链路是配套的:固件带[命令集 V2.1](#v21) 才支持行程标定,SDK ≥ 0.1.7 才能安全刷固件,0.1.9 才附带修好已知缺陷的镜像,`gripper.pos` 的归一化要三者齐了才成立。主夹爪缺标定或固件过低时采集程序会拒绝连接;其它不配套的组合仍可能"正常"落盘,只是数据和别人对不上,事后看不出来。

| 组件 | 最低要求 | 怎么查 |
|---|---|---|
| `xense-taccap-lerobot` | `0.5.1+xtac.0.0.6` | `pip show lerobot` 或看 `pyproject.toml` |
| `xense.taccap` SDK | **0.1.9** | `python -c "import xense.taccap as t; print(t.__version__)"` |
| 夹爪固件 | **命令集 V2.1**,即 leader ≥ 1.2.0 / follower ≥ 1.1.0 | 跑 [`calibrate.py`](calibration.md#41),版本不够会打印当前版本并退出;或[直接读](#check-versions) |
| 每台 leader 的编码器标定 | 零点 + 行程上限已写入 flash | [夹爪标定](calibration.md#41) |

升级顺序不能乱:先[拉仓库与子模块](#repo-update)并重编 SDK(否则 `import xense.taccap` 失败),再[刷固件](#ota),最后[夹爪标定](calibration.md#41),升级本身不产生标定值。

```mermaid
flowchart LR
    A[拉仓库 + 子模块] --> B[重新编译 xense.taccap] --> C[刷固件 OTA] --> D[每台 leader 标定]
```

已采过的数据不用重采;要和升级后的数据混用,先确认两批 `gripper.pos` 在同一刻度上。升级后重新做环境验证、设备自检和一条短 episode 校验。

## 版本兼容基线

命令与字段以本地 checkout 和 SDK 附带的设备说明为准。

| 组件 | 支持范围 / 约束 | 已验证基线 |
|---|---|---|
| 操作系统 / 架构 | Ubuntu 22.04 / 24.04,amd64 | 22.04.5 / 24.04.4,x86_64 |
| Linux 内核 | 不构成约束 | 6.8 / 6.14 / 7.0 |
| 采集主机 | 最低 12 代 i7、8 GB、512 GB SSD;推荐 13/14 代 i7/i9、32 GB、1 TB NVMe,见[主机配置](install.md#host-spec) | — |
| NVIDIA GPU / 驱动 | 最低 RTX 3060 / 8 GB(推荐 RTX 4070 / 12 GB 起),驱动 ≥ 570.144;无 NVIDIA 显卡只能[降级录制](recording.md#no-gpu) | 570.144 / 580.126.09 |
| Python | ≥ 3.12(`conda_environment.yaml` 固定 `python=3.12`) | 3.12.13 |
| PyTorch | `torch>=2.2.1,<2.11.0`;`torchvision>=0.21.0,<0.26.0` | 2.10.0 / 0.25.0 |
| `torchcodec` | `>=0.2.1,<0.11.0`,`setup_env.sh` 按当前 torch 自动对齐 | 0.10.0 |
| PyAV | `av>=15.0.0,<16.0.0`,安装脚本固定装 15.1.0 | 15.1.0 |
| `rerun-sdk` | `>=0.24.0,<0.27.0` | 0.26.2 |
| `opencv-python` | `==4.12.0.88` | 4.12.0.88 |
| NumPy | `>=1.26.4` | 2.2.6 |
| `xense-taccap-lerobot` | 基于 lerobot 0.5.1,版本号 `0.5.1+xtac.0.0.6` | `main@d1b9e79a` |
| `xense.taccap` SDK | 与主仓库子模块配套 | 0.1.9(子模块 `a3382db`) |
| 夹爪固件 | 命令集 V2.1(帧格式 V1.8),leader ≥ 1.2.0 / follower ≥ 1.1.0 | leader 1.2.2 / follower 1.1.5(分支 `hw_v1.1.0`),随 SDK 走,见 [OTA](#ota) |
| `xensesdk` | 由安装脚本提供 | 2.1.1 |
| XenseVR PC Service(`.deb`) | ≥ v0.2.0,装机直接用 v0.2.1 | v0.2.1 |
| `xensevr_pc_service_sdk` | 绑定在主仓库内,链接 `.deb` 里的 C SDK | 0.2.1,版本号取自 `.deb` |

`.deb`(`/opt/apps/roboticsservice/SDK`)是 Pico4 C SDK 的唯一来源,重跑 `--install` 不会重编它;脚本跳过版本一致的包,停在 v0.2.0 的机器会拿旧 SDK 编绑定,装机直接用 v0.2.1。v0.2.0 只比 v0.1.0 多了转发[头显相机](recording.md#56)帧,不用它就无行为变化。

## 三套编号:V2.1 是命令集,不是固件版本 {#v21}

| 编号 | 当前值 | 是什么 |
|---|---|---|
| 帧格式 | `V1.8` | 字节怎么打包成帧,极少变动 |
| **命令集** | **`V2.1`** | 固件实现了哪些命令。行程标定用的 `EncoderMaxCal` 由 V2.1 引入(V2.0 鱼眼标定,V1.9 LED 与私有电机参数) |
| 固件构建号 | leader ≥ 1.2.0 / follower ≥ 1.1.0 | 具体哪一版镜像。这是门槛不是等号:更高的号(如 leader 1.2.2)同样支持 V2.1,不必回刷;主从号不同只因是两份固件 |

本手册说的"V2.1"一律指命令集。够用不等于没缺陷,见[我需要刷吗](#ota-when)。

## 如何查版本 {#check-versions}

固件版本不在 SN 里,要用 `GetVersion` 问固件。下面一次打出 SDK 版本和每只夹爪的固件构建号:

```bash
python - <<'EOF'
import xense.taccap as t
from xense.taccap import scan_grippers, LeaderGripper, FollowerGripper, Cmd
print("xense.taccap", t.__version__, "(需要 >= 0.1.9)")
for ep in scan_grippers():
    cls = LeaderGripper if ep.firmware_sn.endswith("m") else FollowerGripper
    g = cls(mcu_device=ep.mcu_device)          # 只开 MCU
    ack = g.transport.send_cmd(Cmd.GetVersion, b"", 500)
    print(f"  {ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}")
EOF
```

刷固件前的一次输出(所以 `fw` 还是 1.2.1,刷完应读到 1.2.2):

```text
xense.taccap 0.1.9 (需要 >= 0.1.9)
  TCGU01A28Z0023m  Left   fw=1.2.1
  TCGU01A28Z0024m  Right  fw=1.2.1
```

只传 `mcu_device`、`normalize_position` 保持默认 `False`,没做行程标定的夹爪也能读到版本。SN 只看末位:`m` 主夹爪,`s` 从夹爪,决定刷哪个镜像。ACK 第 4 个字节 `build` 恒为 0,版本按 `MAJOR.MINOR.PATCH` 三段比较。

其余组件:

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

`pip show xensevr-pc-service-sdk` 显示的是构建时从 `dpkg` 读到的 `.deb` 版本;头显相机接口看 `has_pico_camera_frame`;夹爪 SN 与角色用[快速开始](index.md#self-check)的自检命令看。

## 仓库与子模块更新 {#repo-update}

```bash
git pull --recurse-submodules
git submodule update --init --recursive --progress
./setup_env.sh --install     # 对齐依赖并重编 xense.taccap
```

!!! warning "拉完子模块必须重新编译 `xense.taccap`"
    `git submodule update` 只更新文件;不重跑 `./setup_env.sh --install`,`import xense.taccap` 直接失败。

子模块 URL 已改为 `https://`,但老 clone 的 `.git/config` 还记着 `git@github.com:`;拉子模块仍要 SSH key 时同步一次:

```bash
git submodule sync --recursive
git submodule update --init --recursive --progress
```

## 固件 OTA 升级 {#ota}

### 我需要刷吗 {#ota-when}

跑一次 [`calibrate.py`](calibration.md#41) 就知道:它先验固件,不够就原样退出并打印当前版本(报错样例见[夹爪标定](calibration.md#41))。看到任意一条就要刷:`calibrate.py` 报 `needs command set >= V2.1` 退出;主夹爪连不上且报错提示先做 OTA;固件低于命令集 V2.1。固件不会退化,刷过一次后除非换主板或擦除固件,不用再刷。

但 V2.1 只是能用的底线,leader 1.2.2 / follower 1.1.5 修掉了三个更早固件(主从共用代码)都有的缺陷:

| 缺陷 | 表现 |
|---|---|
| 命令通道活锁 | 持续高速率下发命令后夹爪不再响应任何命令,数据流却一切正常,只能断电恢复 |
| 日志阻塞实时任务 | 空载时以约 35 KB/s 打阻塞日志,拖住发出它的任务 |
| 启动时越界写 | 每次上电在数组末尾之外写一个字节 |

第一条坏掉时和正常几乎无法区分,遇到过莫名卡住的值得升。这两版镜像由本地工具链编译(`manifest.json` 的 `build` 为 `local`),已在两台实机验证;`manifest.json` 里的版本比 `GetVersion` 读回的高就刷。

### 怎么刷

!!! warning "先升级 SDK,再刷固件"
    刷写与刷后校验请用 0.1.7 及以上的 SDK;新 SDK 与旧固件通信不变,先升 SDK 总是安全的。附带哪版镜像取决于 SDK,要刷到 1.2.2 / 1.1.5 得先升到 0.1.9,否则刷完等于没修。

SDK 自 0.1.7 起随仓库附带固件镜像,路径 `third_party/taccap-gripper/firmware/`,只保留当前发布版;镜像版本随 SDK 走,以同目录 `manifest.json`(各镜像的版本、字节数与 CRC32)为准:`cat third_party/taccap-gripper/firmware/manifest.json`。

| 镜像 | 适用角色 |
|---|---|
| `tc-gu-01-master.bin` | 主夹爪(SN 末位 `m`) |
| `tc-gu-01-slave.bin` | 从夹爪(SN 末位 `s`) |

按角色选镜像,不按左右手:`TCGU01A28Z0023m` 末位 `m`,用 `tc-gu-01-master.bin`;同一套设备的两只夹爪常常都是主夹爪。

```bash
# 1. 确认每只夹爪的角色
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.firmware_sn, '->', 'master' if g.firmware_sn.endswith('m') else 'slave')"

# 2. 刷写,镜像只写文件名
python third_party/taccap-gripper/python/examples/ota_update.py \
    tc-gu-01-master.bin --side left

# 3. 断电重插后确认实际刷上的版本
python -c "
from xense.taccap import scan_grippers, LeaderGripper, Cmd
for ep in scan_grippers():
    g = LeaderGripper(mcu_device=ep.mcu_device)
    ack = g.transport.send_cmd(Cmd.GetVersion, b'', 500)
    print(f'{ep.firmware_sn}  {ep.side.name:5}  fw={ack.data[0]}.{ack.data[1]}.{ack.data[2]}')
"
```

镜像名按给的路径、SDK 根目录、SDK `firmware/` 依次解析,在哪运行都行,连接设备前就检查。`--target-version 1.2.2` 可选,只给校验日志和分区元数据打标记,不影响刷的内容。约 1 秒写完,夹爪重启约 1–3 秒;新固件写在备用分区,校验通过前不覆盖运行中的那份,传输失败不会刷坏。第 3 步读回的号必须不低于 leader 1.2.0 / follower 1.1.0,刷 SDK 0.1.9 附带的镜像时读回 1.2.2 / 1.1.5;刷从夹爪时把 `LeaderGripper` 换成 `FollowerGripper`。

!!! danger "刷错角色会导致夹爪无法启动,需返厂恢复"
    `ota_update.py` 按 CRC32 与 `manifest.json` 比对识别镜像,角色不匹配时直接拒绝,`--force` 才能强制;手工编译的镜像识别不出来,带提示放行。升级期间([指示灯](../common/gripper.md#buttons-leds)蓝色闪烁)不要断电或拔线。

!!! danger "刷完必须断电重插一次"
    这是升级流程的一步,不是排障手段。OTA 后的重启是软复位,USB 转串口芯片没断过电,设备会停在降级状态:版本号正确、数据流在跑、错误计数为 0,只是悄悄丢状态帧。实测 60 秒一轮:只做 OTA 每轮丢 35~39 帧,断电重插后为 0。顺序是刷写 → 断电重插 → 第 3 步确认 → 标定,断电前测到的数据不可信。蓝灯闪烁时断电会写坏,夹爪重启完成后再断电重插。

升到 V2.1 后回到[夹爪标定](calibration.md#41)标零点和行程上限,标完主夹爪才连得上。
