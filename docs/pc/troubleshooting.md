# 故障排查

多数问题出在串口权限与 ModemManager 抢占，先看「串口权限与设备发现」；动手前先跑[快速开始](index.md)的自检。

## 反馈问题请附上完整日志 {#logs}

完整日志在 `~/xenselogs/session_<时间戳>.log`，每次运行一份；反馈时附上整个文件。

- 含采集程序、`xensesdk`、编码库日志及键盘时间戳；`[session]` 行记主机、编码与相机配置。
- 只保留最近 15 份；目录用 `XENSE_LOG_DIR` 改，屏幕日志级别用 `XENSE_LOG_LEVEL` 调。

## 环境与安装

??? failure "`setup_env.sh --install` 一开始就报 `needs system packages that are not installed`"
    **原因**：硬件 SDK 现编译，缺 `build-essential` / `cmake` / `pkg-config` / `git` / `curl` 中的某几个。

    **解决**：照打印的那行安装，清单见[系统依赖包](install.md#apt)。另两项只告警，也要装：

    - `libusb-0.1.so.4`（`libusb-dev` 提供）：相机运行期依赖，缺了到 `connect()` 才失败；
    - `v4l-utils`：提供排查相机的 `v4l2-ctl`。

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` 失败"
    **原因**：环境未装全或未激活。

    **解决**：`mamba activate xense-taccap` 后重跑 `./setup_env.sh --install`，逐个验证见[安装验证](install.md#25)。

??? failure "`torchcodec` 加载失败 / 视频编码报错"
    **原因**：`torchcodec` 与 PyTorch 版本不匹配，或 PyAV 不是 `15.1.0`。

    **解决**：重跑 `setup_env.sh --install` 自动校正；带 `libsvtav1` 的系统 FFmpeg 需单独装。

## 硬件异常 {#hardware}

记下序列号、连接方式、报错和现场照片；上下电防静电。

!!! danger "异味、冒烟、明显发热、结构破损或线缆破皮"
    立即断电并停止使用。

??? failure "软件识别不到主夹爪 / `lsusb` 数量不对"
    **原因**：线缆未锁紧、接触不良或线缆故障；主夹爪只能用配套 Type-C 线供电（DC 5V/500mA），不能接 9V/12V 快充。

    **解决**：

    - `lsusb` 应看到双夹爪 6 个 UVC 设备（4 个 `Xense Robotics ... GSPS01…` 触觉 + 2 个 `Sunplus ... XCA…` 腕相机），单臂 3 个；左右见[序列号与左右识别](../common/gripper.md#sn)。
    - 数量不对就查锁紧与左右接法，重开软件，换口换线；能列出打不开见下一节。

??? failure "图像黑屏 / 无图像"
    **原因**：UVC 未识别、传感器连接异常或通道选错。

    **解决**：`lsusb` 确认识别，重启软件，重新上电。

??? failure "图像有污点 / 模糊"
    **原因**：传感器表面污渍、异物或损伤。

    **解决**：无尘布清洁，见[维护保养](../common/maintenance.md)；划伤、凹陷需换传感器。

??? failure "从夹爪不上电 / 通信异常"
    **原因**：不上电是 24V 未连或适配器异常；通信异常是 Type-C 未连、未识别或被运动拉扯。

    **解决**：

    - 查 24V 适配器、插座、接口与规格；
    - 先连 24V 再连 Type-C 并锁紧（见[供电与连接要求](../common/gripper.md#power)）；
    - 走线避开运动区，首次运行前低速测试。

??? failure "绑定从夹爪时报 `从爪固件版本过低,必须升级后才能使用本 SDK` / `Follower firmware too old`"
    **原因**：从夹爪固件低于 1.2.5，`--robot.role=follower` 和 SDK 都拒绝（1.2.5 起闭合零位才在机械止点）；1.2.5–1.2.10 能连但提示升级。

    **解决**：刷 SDK 附带的从夹爪镜像，再**拔下 24V 电源线，等约 2 秒再插回**（USB 线不用拔）：

    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py slave
    ```

    仅限插着一只从夹爪；多只时见下一条，或[固件 OTA 升级](versions.md#ota)。

??? failure "刷固件时报 `firmware file not found`"
    **原因**：第一个参数被当成镜像文件名但找不到：

    - `slave left` / `master left` / `slave <SN>`：角色后跟参数时角色被当成文件名；
    - 不带版本号的 `tc-gu-01-master.bin` / `tc-gu-01-slave.bin`。

    **解决**：

    - 一般用 `ota_update.py --all`，按角色刷每只；
    - 该角色只插一只时用 `ota_update.py master` / `ota_update.py slave`；
    - 指定一只：写报错中 `shipped images` 列出的文件名加左右或序列号，如 `ota_update.py tc-gu-01-slave-1.2.14.bin left`（以 `firmware/` 里实际文件名为准）。

    见[固件 OTA 升级](versions.md#ota)。

## 串口权限与设备发现

??? failure "`connect()` 报 `No leader gripper discovered for the <side> side.`"
    **原因**（最常见）：用户不在 `dialout` 组，打不开串口读 SN，于是 `role=Unknown` / `firmware_sn` 为空；底层是 `IoError: SerialBus: open(...): Permission denied`。

    **解决**：`sudo usermod -aG dialout "$USER"`，重登（或 `newgrp dialout`）后重插夹爪，见[串口权限](host-setup.md#31)。

??? failure "`Device or resource busy`（热插拔后立即启动；容器里 `/dev/ttyACM*` 报 busy 也是它）"
    **原因**：

    - ModemManager 热插拔时用 AT 指令探测 CH343 串口几秒；`brltty` 同样会抢。容器的规则装在宿主机。
    - 夹爪串口被另一个程序独占，如上一次采集、标定或示例脚本没退出。

    **解决**：先关占用的程序。ModemManager：临时插好等约 3 秒；永久加 udev 规则忽略 `1a86` 设备（Docker 路径的 `install_customer.sh` 已装），规则与验证见[关闭 ModemManager 抢占](host-setup.md#32)，装完重插夹爪。

??? failure "修好权限后 `firmware_sn` 仍为空 / `role=Unknown`"
    **原因**：SN 未烧录、串口读取仍失败、固件通信或设备配置异常；空 SN 不能推断固件版本。

    **解决**：保存底层报错，换线、换口复测；仍为空联系设备或固件团队。

??? failure "报错指名某个 hub / 序列号"
    **原因**：装配不符合"单左双右"：序列号不合规、每侧数量不对、两枚触觉映到同侧、hub 找不到对应夹爪。

    **解决**：按报错指名的设备或 hub 查装配接线，规则见[设备发现](host-setup.md#33)。

??? failure "腕相机 / 视触觉打不开、`video ... busy`"
    **原因**：相机被外部服务占用，或用户不在 `video` 组。

    **解决**：确认相机服务状态；`sudo usermod -aG video "$USER"`，重登生效。每次挂的不同见下面 USB 带宽。

### USB 带宽不够 {#usb-bandwidth}

!!! warning "双夹爪装机第一天就量一次，别等到相机打不开"
    双夹爪最常见故障，取决于插在哪几个物理口。预算与 `lsusb -t` 读法见 [USB 带宽预算](host-setup.md#usb-budget)。

??? failure "某一路相机打不开（`Cannot open camera N`），而且每次挂的不是同一路"
    **原因**：USB 带宽不够。每个 UVC 相机打开时独占一份等时带宽，超出总线预算（约 384 Mbit/s）时最后打开的那路失败，所以故障会"飘"。

    **确认**：`lsusb -t` 数每条 `480M` 总线上的相机，六个挤一条很可能超；启动时另开终端看内核日志：

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` 不能省，否则 `grep` 缓冲、像卡住。打出 `Not enough bandwidth for altsetting N` 即确诊。也可拆两半各跑一次：

    ```bash
    # 只开触觉(关掉腕相机)
    lerobot-teleoperate --robot.type=bi_taccap_gripper --robot.id=0 \
        --robot.left_enable_wrist_camera=false --robot.right_enable_wrist_camera=false \
        --robot.enable_tracker=false --fps=30 --display_data=true

    # 只开腕相机(关掉触觉)
    lerobot-teleoperate --robot.type=bi_taccap_gripper --robot.id=0 \
        --robot.enable_tactile=false \
        --robot.enable_tracker=false --fps=30 --display_data=true
    ```

    两半各自正常、合起来失败就是带宽；`enable_tactile=false` 只用于判断，不要录数据。

    **解决**：

    - 确认腕相机没从省带宽的默认 `MJPG` 改成 `YUYV`（`--robot.wrist_camera_fourcc`）；
    - 仍超只能加 USB 主控制器而非 hub（Thunderbolt / USB4 扩展坞自带 xHCI 控制器），插过去一只后 `lsusb -t` 应多一行 `480M` root_hub；
    - 装好前可关腕相机录（无 `{side}_wrist` 键），开录前定下来，别一半有一半没有。

??? question "到底超了多少？"
    一台只有一条 `480M` 总线的双夹爪主机实测：

    | 开哪些相机 | 预留 | 结果 |
    |---|---|---|
    | 只开四路触觉（两侧 `_enable_wrist_camera=false`） | 242 Mbit/s | 正常 |
    | 只开两路腕相机（`--robot.enable_tactile=false`） | 够用 | 正常 |
    | 六个全开（默认） | 6 × 60.4 = 362 Mbit/s | 失败 |

    `altsetting 6` 每微帧 944 字节，即每枚触觉 60.4 Mbit/s（320x240 YUYV@30 实际只约 37 Mbit/s），腕相机申请更多。自己读数：

    ```bash
    # I:* 是当前生效的 altsetting;类名在这个文件里是小写的 (video)
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    每个 video 接口的 `Alt=` 与其 `E:` 行的 `MxPS=` 给出预留量（`MxPS × 8000 × 8` bit/s），按总线求和与约 384 Mbit/s 比；申请量由固件 UVC 描述符决定，采集程序改不了。

??? question "换个 USB 口、调低 `tactile_fps`、`uvcvideo quirks=128` 有用吗？"
    都没用：

    - 换物理 USB 口（含蓝色 USB 3 口）：同一控制器的口共用一条 USB 2.0 总线，要换就换控制器；
    - 调低 `--robot.tactile_fps`：只节流 Python 侧读取，USB 流不变；
    - `uvcvideo quirks=128`（`UVC_QUIRK_FIX_BANDWIDTH`）：实测无效，它按 `宽 × 高 × bpp` 重算，管不到超得最多的 MJPEG 腕相机。

## Pico4 追踪器与位姿

??? failure "没有位姿 / 追踪器连不上 / 位姿不稳"
    **原因**：最常见是电脑 WiFi 与 Pico4 Ultra 企业版有线共享网络冲突；或服务、XTac-UMI XR 未启动，追踪器未配对或没电。

    **解决**：关电脑 WiFi（见[网络连接](../common/pico4.md#pico-network)）；按[上电顺序](quickstart.md#power-on)逐项确认；启动服务 `/opt/apps/roboticsservice/runService.sh`；必要时用 `python -m lerobot.robots.taccap_gripper.check_tracker` 自检。

??? failure "位姿参考系在集之间漂移"
    **原因**：分集途中重启 XTac-UMI XR，世界原点被重设。

    **解决**：分集间不重启；重启后的数据当新数据集，见[坐标系对齐](../common/pico4.md#pico-frame)。

??? failure "采集间隙位姿突然中断 / 头显自己灭屏"
    **原因**：头显未关灭屏与休眠，挂起后 XTac-UMI XR 被暂停或杀掉。

    **解决**：企业设置 → 系统设置 → 电源策略，先把「系统休眠」、再把「灭屏」设为「永不」（顺序反了灭屏会被钳回有限值），见[系统设置](../common/pico4.md#pico-system)。

??? failure "追踪模式里选不到追踪器 / PC Service 发现不了这个 SN / 配对界面搜不到追踪器"
    **原因**：追踪器没绑定这台头显（新机、换过设备、恢复出厂）；配对搜不到是没进配对状态（蓝灯常亮）。

    **解决**：在「体感追踪器」App 绑定两枚追踪器；配对前长按电源键约 6 秒至蓝红交替闪烁，再点「开始配对」。见[绑定追踪器](../common/pico4.md#pico-tracker-bind)。

??? failure "XTac-UMI XR 一直连不上（未连接或连接失败）"
    **原因**：多半是有线网络没接好，或电脑 WiFi 没关。

    **解决**：有线勾选「USB网络」，WiFi 在「PC IP」填主机 IP，再点「连接」；仍不行按[网络连接](../common/pico4.md#pico-network)重接，界面见[打开 App 后的界面](../common/pico4.md#pico-toolkit-ui)。

??? failure "头显里显示「连接成功」，PC 端却收不到任何位姿"
    **原因**：「连接成功」只表示 App 连上服务；主机服务可能没起，或追踪器未开机、未绑定。

    **解决**：启动 [XenseVR PC Service](host-setup.md#35)；用 `/opt/apps/roboticsservice/` 的 `ConsoleDemo` 或 `python -m lerobot.robots.taccap_gripper.check_tracker` 看能否读到带 `sn` 的位姿，否则回[绑定](../common/pico4.md#pico-tracker-bind)确认两枚都「已连接」。

??? failure "追踪器侧别匹配错 / PC 服务枚举不稳"
    **原因**：序列号不合规或枚举抖动。

    **解决**：用 `--robot.tracker_serial=<SN>` 钉住（不枚举、不校验）；或核对序列号末尾 `G` 前一位数字，单左双右，见[追踪器序列号](../common/pico4.md#pico-tracker-sn)。

## 头显相机 {#head-camera}

??? failure "报 `... always records the headset ...` 或 `... does not record the headset ...`"
    **原因**：双夹爪命令写了 `--robot.enable_head_camera`，与 `--robot.type` 矛盾；带不带头显由类型决定。

    **解决**：去掉 `--robot.enable_head_camera`；录头显用 `--robot.type=xtac_umi_g1`，不录用 `--robot.type=bi_taccap_gripper`，见[头显相机](recording.md#56)。

??? failure "录头显时一直卡在等待首帧"
    **原因**：画面经 PC Service 转发：服务低于 v0.2.0（v0.1.0 不转发头显画面），或 App 没推流。

    **解决**：按顺序查：

    ```bash
    # 1) 服务 deb 版本:需要 ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) 是否带相机接口
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    再确认头显连上 PC Service 且 App 在推流（与追踪器共用一条连接）。前置条件见[头显相机](recording.md#56)。

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **原因**：加载的是旧版接口（相机接口随 v0.2.0 加入）；模块链接 `.deb` 的 C SDK，先看版本：`dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`。

    **解决**：

    - 更新到发布 tag（见[仓库与子模块更新](versions.md#repo-update)）后重跑 `./setup_env.sh --install`，`.deb` 一并升到基线版本；
    - 仍为 `False` 时用 `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` 确认加载的哪一份；
    - `Status` 不是 `install ok installed`（如 `dpkg -r` 删过，残留 `deinstall ok config-files`）时同样重装。

??? failure "日志反复出现左右眼偏差（skew）告警"
    **原因**：两眼两条独立消息的时间戳差超过 `--robot.head_camera_pair_max_skew_ms`（默认 20 ms）；常见于主机负载高或链路抖动。

    **解决**：告警不中断录制，但这几帧可能不同步。

    - 降负载（减相机、用 `--robot.head_camera_eyes=left` 只录一只眼）；
    - 链路问题见[网络连接](../common/pico4.md#pico-network)；
    - 确认只是抖动再放宽阈值。

??? failure "`head_camera_width/_height` 报尺寸不支持，或尺寸合法、connect 时仍报首帧尺寸不符"
    **原因**：只接受 `640x480`（默认）、`1024x768`、`1280x960`（都是 4:3）；合法仍报不符，是与头显实际输出不一致。

    **解决**：默认每眼 640x480，不加这两个参数即可；头显改过分辨率时联系[技术支持](../common/reference.md#support)确认后把参数改成同一值，见[头显相机](recording.md#56)。改尺寸前后的 episode 不能混用。

## 采集与录制

??? failure "命令刚敲下去就退出：`--robot.id is required`"
    **原因**：`--robot.id` 是必填的工位号。

    **解决**：补上工位号（`0` / `1`…；前缀按 `--robot.type` 补成 `taccap_0` / `bi_taccap_0` / `xtac_umi_g1_0`），如 `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`。它标工位不标硬件，换夹爪不用改；设备身份记在 `meta/hardware.json`，见 [`--robot.id` 与硬件清单](recording.md#robot-id)。

??? failure "续录时硬件和数据集里记的对不上"
    **原因**：`--resume` 时换了夹爪或触觉传感器。这不是错误：清单在当前集数另起 epoch，日志打 `... recorded as a new epoch in .../hardware.json`；只有 `--robot.type` 对不上才保留原文件并告警。

    **解决**：有意换就继续；否则（如插错夹爪）停下把设备换回。

??? failure "续录报 `refusing to resume it`"
    **原因**：`--robot.id` 与数据集记的工位号不一致，连设备前就拒绝。

    **解决**：用原 `--robot.id` 续录，或换 `--dataset.repo_id` 新建。

??? failure "录到一半突然崩掉，报 `ValueError: You must add one or several frames`"
    **原因**：两集之间约 2 秒不读键盘（存盘 + 编码器预热），空档里按的**方向右键**会挂着，常见于上一集 reset 恰好超时结束时。下一集一帧未录就退出，存盘时抛错，整场采集中止；发作比按键晚两分多钟。

    **解决**：升级到 `0.0.7` 及以上，空档按键会被丢弃。键盘监听是全局的，**任何窗口**（含 Rerun）的方向右键都会结束 episode；排查看[会话日志](#logs)的键盘时间戳。

??? failure "每集复位后打印 `[stale_frames]`，或出现相机采集卡顿告警"
    **原因**：某路相机后台采集卡顿。采集回路**不被阻塞**（取缓存的上一帧），帧率正常，但录进去的是**重复的旧图**。每集复位后打印重复帧数、段数与最长段，重录的那集带 ` (discarded take)`：

    ```text
    [stale_frames] episode 3 [left_tactile_left] 45/1800 frames served stale (2.5%): 25 gap(s), longest 21 frame(s)
    ```

    **解决**：

    - **单帧**重复是预期的：采集与录制各按标称帧率跑，相位漂移偶尔采到两次，不用管。
    - **长连续段**才是真卡顿，多见于 8 路相机同时编码时 GPU 编码器饿住触觉线程 0.3~0.9 秒。
    - 个位数百分比的短段照常用；有很长连续段的那集弃用。
    - 持续出现按 [USB 带宽不够](#usb-bandwidth) 排查，或减少相机路数。

    `[loop_summary]` 给出实际帧率，如 `= 29.0 fps (nominal 30; dataset timestamps assume nominal)`：数据集时间戳仍按标称帧率写。

??? failure "日志出现 `[slow_frame] ... overrun=`"
    **原因**：某帧超出帧预算（30 fps 为 33.3 ms）；Rerun 显示在独立线程，**不是原因**。

    **解决**：看两段信息：

    - ` | phases obs=… build=… add=… display=…`：各阶段耗时；
    - 行末 `top_obs=`：最慢的几路传感器。

    每集前 5 条 `[slow_frame]` 上屏，其余进[会话日志](#logs)，屏幕改为每 5 秒一条 `[slow_frame_summary]`。偶发不影响数据；持续指向同一路相机时按 [USB 带宽不够](#usb-bandwidth) 排查。没有 NVIDIA 显卡见[没有 NVIDIA GPU 的主机怎么录](recording.md#no-gpu)。

??? failure "录制中途停下，提示 `Device lost mid-recording`"
    **原因**：相机或夹爪编码器掉线：线松、螺钉未紧、线缆受力、hub 掉电、供电不稳或接触不良；已录部分已存盘。

    **解决**：掉线那集末尾一两秒是旧值，建议弃用。查螺钉、走线与 USB 口（反复出现且换口无效见 [USB 带宽不够](#usb-bandwidth)），再用 `--resume` 在同一数据集续录，见[录制](recording.md#52)。

??? failure "没有独显的机器上，录制一开始就报编码器打不开"
    **原因**：没有 NVIDIA 驱动却用 GPU 硬件编码器。

    **解决**：改用 CPU 编码器并关流式编码：`lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`，原因见[没有 NVIDIA GPU 的主机怎么录](recording.md#no-gpu)。

??? failure "编码器跟不上、日志出现丢帧告警"
    **原因**：编码队列满时最多等 0.1 秒，仍满就丢帧并告警 `Encoder queue full … dropped N frame(s)`（不阻塞采集循环）。

    **解决**：加大 `--dataset.encoder_threads`、用 `--dataset.vcodec=auto` 或调 `--dataset.encoder_queue_maxsize`，见[录制选项](recording.md#54)。

??? failure "夹爪开度不对 / 闭合时不为 0"
    **原因**：编码器零点漂移或未标定（未标定的主夹爪会被拒绝并提示命令）。

    **解决**：`python third_party/taccap-gripper/python/examples/calibrate.py left`（或 `right`）重标零点与行程上限，写入 MCU flash，每台一次，见[夹爪标定](calibration.md#41)。

??? failure "标定报 `encoder-max calibration needs command set >= V2.1`"
    **原因**：固件命令集低于 V2.1（即 leader < 1.2.0），不支持行程标定；`calibrate.py` 不做改动直接退出。

    **解决**：刷固件（先升 SDK、按角色选镜像、只写文件名），见[固件 OTA 升级](versions.md#ota)，刷完重跑 `calibrate.py`。

## 数据与磁盘

??? failure "采集变慢 / 磁盘写满"
    **原因**：双夹爪原始视频吞吐可达约 280 MB/s；空间不足、写入慢或编码跟不上都会出问题。

    **解决**：先录几条 episode 实测体积和丢帧；定期查 `df -h` 与数据集目录大小，见[存储规划](dataset.md#storage-planning)。

## Docker 交付镜像 {#docker}

仅限 [Docker 交付镜像](install.md#docker)路径；容器串口 busy 见上文 `Device or resource busy`。

??? failure "`could not select device driver ... gpu` / 容器里看不到显卡"
    **原因**：NVIDIA Container Toolkit 没装好，或装完没重启 Docker daemon。

    **解决**：`install_customer.sh` 自动装；手工确认用 `docker run --rm --gpus all ubuntu:22.04 nvidia-smi`，看不到就重装 Toolkit 并 `sudo systemctl restart docker`，宿主机驱动要 ≥ 570.144。

??? failure "`Unknown runtime specified nvidia`，`docker compose` 起不来"
    **原因**：NVIDIA runtime 没注册进 Docker，而 `compose.yaml` 用 `runtime: nvidia`（见[容器里的图形界面](install.md#docker-gui)）。

    **解决**：

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # 输出里要能看到 nvidia
    ```

??? failure "容器里 Rerun 起不来：`Failed to create surface for any enabled backend` / Vulkan adapter 错误，但 `nvidia-smi` 正常"
    **原因**：X11 没授权；或容器没拿到 NVIDIA 的 Vulkan ICD，典型是把 `compose.yaml` 的 `runtime: nvidia` 改成了只申请 compute + utility 的 `gpus: all`，此时 `vulkaninfo` 报 `INCOMPATIBLE_DRIVER` 或列不出 NVIDIA 设备。

    **解决**：

    - 宿主机桌面用户执行 `xhost +si:localuser:root`，确认 `echo "$DISPLAY"` 非空、`/tmp/.X11-unix` 存在；
    - `docker info --format '{{json .Runtimes}}'` 没列出 nvidia 就按上一条注册，有就把 `compose.yaml` 改回 `runtime: nvidia`；
    - 确认容器内 `vulkaninfo --summary` 认出显卡。

??? failure "`pull access denied ... 'docker login'`，或改了 `LEROBOT_IMAGE_TAG` 拉到的还是老镜像"
    **原因**：镜像公开无需登录；是镜像名解析错，或 `.env` 改后没重拉、不在 `docker compose` 目录。

    **解决**：`docker compose config --images` 看镜像名，查 `.env` 的 `LEROBOT_IMAGE`（默认 `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`，一般只写 tag），再 `docker compose pull`，见[钉死镜像版本](install.md#docker-pin)。

??? failure "进容器时打印 `groups: cannot find name for group ID <n>`"
    无害：NVIDIA runtime 注入了宿主机 `render` 组的 GID，容器里没有同名组。

??? failure "`0.0.5` 及更早的镜像：`mamba activate` 报 `Shell not initialized`；一开录就崩，报 `FileNotFoundError: 'spd-say'`；导出的 `.mp4` 都报 `Permission denied`，元数据却拷得动"
    **原因**：老镜像的三个已知问题，`0.0.6` 起已修：

    - 进容器时环境已激活，无需 activate；
    - 镜像没有语音播报用的 `spd-say`，而 `--play_sounds` 默认 `true`，播报抛异常后进程以 `terminate called without an active exception` 崩掉；
    - 视频是 `-rw------- root`、元数据是 `0644`，非 root 拷不动视频，文件本身是好的。

    **解决**：升级镜像（见[钉死镜像版本](install.md#docker-pin)）。仍用老镜像时：

    - 手工切环境先 `eval "$(mamba shell hook --shell bash)"`；
    - 录制加 `--play_sounds=false`，采集不受影响；
    - 老镜像视频升级后权限不变，按[数据放在哪](install.md#docker-data)以 root 拷、拷完 `chown`，不要用 `--user`。

??? failure "宿主机能看到触觉传感器，容器里找不到"
    **原因**：没用 Compose 启动（`/dev`、`/run/udev` 未透传），或重新枚举后节点未稳定。

    **解决**：用 `docker compose run --rm xense-taccap` 进容器，`ls /dev/v4l/by-id/*GSPS*` 查节点；为空就在宿主机重插 USB hub，再 `sudo udevadm settle --timeout=20`。

??? failure "容器重启后传感器要重新读一遍、启动变慢"
    **原因**：`xensesdk-cache` volume 被删；它按序列号缓存传感器配置，免得每次重读 flash 并重新枚举 USB。

    **解决**：保留它，各 volume 的用途见[数据放在哪](install.md#docker-data)。

---

仍未解决？带上完整报错、自检输出（`scan_grippers` 的 side / role / firmware_sn）、版本信息和复现命令，按[支持与反馈](../common/reference.md#support)的渠道反馈。
