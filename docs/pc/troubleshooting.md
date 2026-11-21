# 故障排查

多数连接问题由 `brltty` 未卸载、串口权限不足或 ModemManager 抢占串口引起，先确认已完成[主机配置 · 首次使用必做](host-setup.md#first-use)，并跑一次[自检](quickstart.md#self-check)。

## 反馈问题请附上完整日志 {#logs}

完整日志位于 `~/xenselogs/session_<时间戳>.log`，每次运行一份，反馈时附上整个文件。

- 包含采集程序、`xensesdk`、编码库的日志及键盘时间戳；`[session]` 行记录主机、编码与相机配置。
- 仅保留最近 15 份。目录用 `XENSE_LOG_DIR` 修改，屏幕日志级别用 `XENSE_LOG_LEVEL` 调整。

## 环境与安装

??? failure "`setup_env.sh --install` 启动即报 `needs system packages that are not installed`"
    **原因**：缺少 `build-essential` / `cmake` / `pkg-config` / `git` / `curl` 中的部分软件包。

    **解决**：按输出中的命令安装，清单见[系统依赖包](install.md#apt)。`libusb-0.1.so.4`（由 `libusb-dev` 提供）与 `v4l-utils` 缺失只告警，同样要装。

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` 失败"
    **原因**：环境未完整安装或未激活。

    **解决**：`mamba activate xense-taccap` 后重跑 `./setup_env.sh --install`，逐项验证见[安装验证](install.md#25)。

??? failure "`torchcodec` 加载失败 / 视频编码报错"
    **原因**：`torchcodec` 与 PyTorch 版本不匹配，或 PyAV 不是 `15.1.0`。

    **解决**：重跑 `setup_env.sh --install` 自动校正。带 `libsvtav1` 的系统 FFmpeg 需单独安装。

## 硬件异常 {#hardware}

请记录序列号、连接方式、报错信息与现场照片；上下电时注意防静电。

!!! danger "异味、冒烟、明显发热、结构破损或线缆破皮"
    立即断电并停止使用。

??? failure "软件无法识别主夹爪 / `lsusb` 设备数量不符"
    **原因**：线缆未锁紧、接触不良或线缆故障。主夹爪只能用配套 Type-C 线供电（DC 5V/500mA），不能接 9V/12V 快充。

    **解决**：`lsusb` 应列出双夹爪的 6 个 UVC 设备（4 个 `Xense Robotics ... GSPS01…` 触觉传感器 + 2 个 `Sunplus ... XCA…` 腕相机），单臂为 3 个，左右识别见[序列号与左右识别](../common/gripper.md#sn)。数量不符时检查线缆锁紧与左右接法，重启软件，更换 USB 口或线缆；已列出但打不开见下一节。

??? failure "图像黑屏 / 无图像"
    **原因**：UVC 设备未识别、传感器连接异常或通道选择错误。

    **解决**：用 `lsusb` 确认设备已识别，重启软件，然后重新上电。

??? failure "图像有污点 / 模糊"
    **原因**：传感器表面有污渍、异物或损伤。

    **解决**：用无尘布清洁，见[维护保养](../common/maintenance.md)。划伤或凹陷需更换传感器。

??? failure "从夹爪不上电 / 通信异常"
    **原因**：不上电是 24V 电源未连接或适配器异常；通信异常是 Type-C 未连接、未识别或受运动拉扯。

    **解决**：检查 24V 适配器、插座、接口与规格；先接 24V，再接 Type-C 并锁紧（见[供电与连接要求](../common/gripper.md#power)）；走线避开运动区域，首次运行前低速测试。

??? failure "绑定从夹爪时报 `从爪固件版本过低,必须升级后才能使用本 SDK` / `Follower firmware too old`"
    **原因**：从夹爪固件低于 1.2.5，`--robot.role=follower` 与 SDK 均拒绝连接（自 1.2.5 起，闭合零位才位于机械止点）。1.2.5–1.2.10 可以连接，但会提示升级。

    **解决**：刷写 SDK 附带的从夹爪镜像，然后**拔下 24V 电源线，等约 2 秒再插回**（无需拔 USB 线）。下面的命令仅适用于只接一只从夹爪，多只见下一条或[固件 OTA 升级](versions.md#ota)：

    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py slave
    ```

??? failure "刷写固件时报 `firmware file not found`"
    **原因**：第一个参数被当作镜像文件名但找不到：写了 `slave left` / `master left` / `slave <SN>`（角色后带其他参数），或用了不带版本号的 `tc-gu-01-master.bin` / `tc-gu-01-slave.bin`。

    **解决**：通常用 `ota_update.py --all`；该角色只接一只时用 `ota_update.py master` / `ota_update.py slave`；指定某一只时用报错中 `shipped images` 列出的文件名加左右或序列号，如 `ota_update.py tc-gu-01-slave-1.2.17.bin left`。见[固件 OTA 升级](versions.md#ota)。

## 串口权限与设备发现

??? failure "`connect()` 报 `No leader gripper discovered for the <side> side.`"
    **原因**（最常见）：当前用户不在 `dialout` 组，打不开串口读 SN，`role=Unknown` / `firmware_sn` 为空。底层报错为 `IoError: SerialBus: open(...): Permission denied`。

    **解决**：`sudo usermod -aG dialout "$USER"`，重新登录（或 `newgrp dialout`）后重新插拔夹爪，见[串口权限](host-setup.md#31)。

??? failure "`Device or resource busy`（热插拔后立即启动时出现；容器内 `/dev/ttyACM*` 报 busy 也属此类）"
    **原因**：ModemManager 在热插拔时探测 CH343 串口数秒，或 `brltty` 占用串口（用容器时规则要装在宿主机上）；也可能是上一次的采集、标定或示例脚本未退出，仍独占串口。

    **解决**：先关闭占用串口的程序；[卸载 brltty](host-setup.md#brltty)；ModemManager 临时等约 3 秒再启动，永久方案是装 udev 规则，见[关闭 ModemManager 抢占](host-setup.md#32)。装好后重新插拔夹爪。

??? failure "修复权限后 `firmware_sn` 仍为空 / `role=Unknown`"
    **原因**：SN 未烧录、串口读取仍然失败，或固件通信、设备配置异常。SN 为空时无法推断固件版本。

    **解决**：保存底层报错，换线缆和 USB 口复测；仍为空请联系设备或固件团队。

??? failure "报错指出某个 hub / 序列号"
    **原因**：装配不符合"单左双右"：序列号不合规、某侧数量不对、两枚触觉映射到同一侧，或 hub 找不到对应的夹爪。

    **解决**：按报错指出的设备或 hub 检查装配与接线，规则见[设备发现](host-setup.md#33)。

??? failure "腕相机 / 视触觉传感器无法打开、`video ... busy`"
    **原因**：相机被外部服务占用，或当前用户不在 `video` 组。

    **解决**：确认相机服务状态；`sudo usermod -aG video "$USER"` 并重新登录。每次失败的相机不同时见下方 USB 带宽一节。

### USB 带宽不足 {#usb-bandwidth}

!!! warning "双夹爪装机当天即应测量，不要等到相机无法打开时再查"
    这是双夹爪最常见的故障，取决于夹爪所接的物理端口。预算与 `lsusb -t` 的读法见 [USB 带宽预算](host-setup.md#usb-budget)。

??? failure "某一路相机无法打开（`Cannot open camera N`），且每次失败的不是同一路"
    **原因**：USB 带宽不足。超出总线预算（约 384 Mbit/s）时最后打开的一路失败，所以故障位置不固定。

    **确认**：用 `lsusb -t` 数每条 `480M` 总线上的相机，六个共用一条时很可能超出。启动时在另一个终端看内核日志（必须加 `--line-buffered`，否则 `grep` 缓冲输出），出现 `Not enough bandwidth for altsetting N` 即确诊：

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    也可分两组运行，各自正常、同时运行失败即为带宽问题（`enable_tactile=false` 仅用于诊断，不要用于录制）：

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

    **解决**：

    - 确认腕相机未从默认的 `MJPG` 改为 `YUYV`（`--robot.wrist_camera_fourcc`）；
    - 仍超出时增加 USB 主控制器而不是 hub（Thunderbolt / USB4 扩展坞自带 xHCI 控制器）。一只夹爪改接到新控制器后，`lsusb -t` 应多出一行 `480M` root_hub；
    - 新控制器到位前可关闭腕相机录制（数据中无 `{side}_wrist` 键）。开录前定好方案，同一数据集不要混用两种配置。

??? question "实际超出多少？"
    在一台只有一条 `480M` 总线的双夹爪主机上实测：

    | 开哪些相机 | 预留 | 结果 |
    |---|---|---|
    | 只开四路触觉（两侧 `_enable_wrist_camera=false`） | 242 Mbit/s | 正常 |
    | 只开两路腕相机（`--robot.enable_tactile=false`） | 够用 | 正常 |
    | 六个全开（默认） | 6 × 60.4 = 362 Mbit/s | 失败 |

    `altsetting 6` 每微帧 944 字节，即每枚触觉传感器预留 60.4 Mbit/s（320x240 YUYV@30 的实际数据仅约 37 Mbit/s），腕相机申请的更多。自行读取：

    ```bash
    # I:* 是当前生效的 altsetting;类名在这个文件里是小写的 (video)
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    每个 video 接口的 `Alt=` 及其 `E:` 行的 `MxPS=` 给出预留量（`MxPS × 8000 × 8` bit/s），按总线求和后与约 384 Mbit/s 比较。申请量由固件的 UVC 描述符决定，采集程序无法修改。

??? question "更换 USB 口、调低 `tactile_fps`、设置 `uvcvideo quirks=128` 是否有效？"
    均无效：

    - 更换物理 USB 口（含蓝色 USB 3 口）：同一控制器下的端口共用一条 USB 2.0 总线，要换的是控制器；
    - 调低 `--robot.tactile_fps`：仅限制 Python 侧的读取频率，USB 数据流不变；
    - `uvcvideo quirks=128`（`UVC_QUIRK_FIX_BANDWIDTH`）：按 `宽 × 高 × bpp` 重算带宽，覆盖不到占用最多的 MJPEG 腕相机，实测无效。

## Pico4 追踪器与位姿

??? failure "无位姿 / 追踪器无法连接 / 位姿不稳"
    **原因**：最常见是电脑 WiFi 与 Pico4 Ultra 企业版的有线共享网络冲突；其次是服务或 XTac UMI XR 未启动，或追踪器未配对、没电。

    **解决**：关闭电脑 WiFi（见[网络连接](../common/pico4.md#pico-network)）；按[上电顺序](quickstart.md#power-on)逐项确认；必要时跑 `python -m lerobot.robots.taccap_gripper.check_tracker` 自检。

??? failure "位姿参考系在 episode 之间漂移"
    **原因**：分段采集期间重启了 XTac UMI XR，世界原点被重置。

    **解决**：episode 之间不要重启 XTac UMI XR；重启后的数据作为新数据集，见[坐标系对齐](../common/pico4.md#pico-frame)。

??? failure "采集间隙位姿中断 / 头显自动灭屏"
    **原因**：头显未关闭灭屏与休眠，挂起后 XTac UMI XR 被暂停或终止。

    **解决**：企业设置 → 系统设置 → 电源策略，先将「系统休眠」、再将「灭屏」设为「永不」（顺序颠倒时灭屏会被限制回有限值），见[系统设置](../common/pico4.md#pico-system)。

??? failure "追踪模式中无法选择追踪器 / PC Service 无法发现该 SN / 配对界面无法搜索到追踪器"
    **原因**：追踪器未绑定到当前头显（新设备、换过设备或恢复出厂后）。配对界面搜不到，是因为追踪器未进入配对状态（蓝灯常亮）。

    **解决**：在「体感追踪器」App 中绑定两枚追踪器。配对前长按追踪器电源键约 6 秒至蓝红交替闪烁，再点「开始配对」，见[绑定追踪器](../common/pico4.md#pico-tracker-bind)。

??? failure "XTac UMI XR 始终无法连接（未连接或连接失败）"
    **原因**：通常是有线网络未正确连接，或电脑 WiFi 未关闭。

    **解决**：有线连接选「USB网络」；WiFi 连接选「WiFi网络」并在「PC IP」填主机 IP，再点「连接」。仍连不上按[网络连接](../common/pico4.md#pico-network)重连，界面说明见[打开 App 后的界面](../common/pico4.md#pico-toolkit-ui)。

??? failure "头显显示「连接成功」，PC 端却收不到任何位姿"
    **原因**：「连接成功」仅表示 App 已连到服务。主机服务可能未启动，或追踪器未开机、未绑定。

    **解决**：启动 [XenseVR PC Service](host-setup.md#35)；跑 `/opt/apps/roboticsservice/` 中的 `ConsoleDemo` 或 `python -m lerobot.robots.taccap_gripper.check_tracker`，看能否读到带 `sn` 的位姿。读不到时回[绑定](../common/pico4.md#pico-tracker-bind)确认两枚追踪器均为「已连接」。

??? failure "追踪器左右匹配错误 / PC 服务枚举不稳定"
    **原因**：序列号不合规或枚举结果抖动。

    **解决**：用 `--robot.tracker_serial=<SN>` 固定指定（不枚举、不校验）；或核对序列号末尾 `G` 前一位数字是否符合单左双右，见[追踪器序列号](../common/pico4.md#pico-tracker-sn)。

## 头显相机 {#head-camera}

??? failure "报 `... always records the headset ...` 或 `... does not record the headset ...`"
    **原因**：双夹爪命令中加了 `--robot.enable_head_camera`，与 `--robot.type` 冲突。

    **解决**：去掉该参数。录头显用 `--robot.type=xtac_umi_g1`，不录用 `--robot.type=bi_taccap_gripper`，见[头显相机](recording.md#56)。

??? failure "录制头显时一直停在等待首帧"
    **原因**：头显画面经 PC Service 转发。服务低于 v0.2.0（v0.1.0 不转发头显画面），或 App 未推流。

    **解决**：按顺序检查，再确认头显已连接 PC Service 且 App 正在推流（与追踪器共用同一连接）：

    ```bash
    # 1) 服务 deb 版本:需要 ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) 是否带相机接口
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **原因**：加载的是旧版接口（相机接口自 v0.2.0 起提供）。该模块链接 `.deb` 中的 C SDK，先看版本：`dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`。

    **解决**：

    - 更新到发布 tag（见[仓库与子模块更新](versions.md#repo-update)）后重跑 `./setup_env.sh --install`，`.deb` 同时升到基线版本；
    - 仍为 `False` 时，用 `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` 确认实际加载的模块；
    - `Status` 不是 `install ok installed` 时（如曾用 `dpkg -r` 删除，残留 `deinstall ok config-files`），同样重新安装。

??? failure "日志反复出现左右眼偏差（skew）告警"
    **原因**：左右眼时间戳差超过 `--robot.head_camera_pair_max_skew_ms`（默认 20ms），常见于主机负载过高或链路抖动。

    **解决**：告警不中断录制，但相关帧可能不同步。降低负载（减少相机数量，或 `--robot.head_camera_eyes=left` 只录一只眼）；链路问题见[网络连接](../common/pico4.md#pico-network)；确认仅为链路抖动后再放宽阈值。

??? failure "`head_camera_width/_height` 报尺寸不支持，或尺寸合法但 connect 时仍报首帧尺寸不符"
    **原因**：仅支持 `640x480`（默认）、`1024x768`、`1280x960`。尺寸合法但仍报不符，说明参数与头显实际输出不一致。

    **解决**：默认每眼 640x480，不加这两个参数即可。头显分辨率改过时，联系[技术支持](../common/reference.md#support)确认后把两个参数设为相同的值，见[头显相机](recording.md#56)。改尺寸前后的 episode 不能混用。

## 采集与录制

??? failure "命令运行后立即退出：`--robot.id is required`"
    **原因**：`--robot.id` 是必填的工位号。

    **解决**：补上工位号数字，如 `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`，见 [`--robot.id` 与硬件清单](recording.md#robot-id)。

??? failure "续录时硬件与数据集记录不一致"
    **原因**：`--resume` 时更换了夹爪或触觉传感器。这不是错误：硬件清单在当前集数处新建 epoch，日志输出 `... recorded as a new epoch in .../hardware.json`。仅当 `--robot.type` 不一致时才保留原文件并告警。

    **解决**：有意更换时继续录制即可；否则（如插错夹爪）停止录制并换回原设备。

??? failure "续录报 `refusing to resume it`"
    **原因**：`--robot.id` 与数据集记录的工位号不一致，程序在连接设备前即拒绝续录。

    **解决**：用原 `--robot.id` 续录，或换一个 `--dataset.repo_id` 新建数据集。

??? failure "录制中途异常退出，报 `ValueError: You must add one or several frames`"
    **原因**：两个 episode 之间约 2 秒不读键盘（存盘与编码器预热），此间按下的**方向右键**被保留，常见于上一集 reset 恰好超时结束时。下一集一帧未录即退出，存盘时抛错，整场采集中止。报错比按键晚两分钟以上。

    **解决**：升级到 `0.0.7` 及以上，间隙内的按键会被丢弃。键盘监听是全局的，在**任何窗口**（含 Rerun）按方向右键都会结束 episode，可用[会话日志](#logs)中的键盘时间戳排查。

??? failure "每集复位后打印 `[stale_frames]`，或出现相机采集卡顿告警"
    **原因**：某路相机的后台采集卡顿。采集循环**不会被阻塞**（取缓存的上一帧），帧率正常，但录入的是**重复的旧图像**。每集复位后打印重复帧数、段数与最长段；重录的 episode 带 ` (discarded take)` 标记：

    ```text
    [stale_frames] episode 3 [left_tactile_left] 45/1800 frames served stale (2.5%): 25 gap(s), longest 21 frame(s)
    ```

    **解决**：

    - **单帧**重复属预期：采集与录制各按标称帧率运行，相位漂移偶尔让同一帧被采到两次，无需处理。
    - **长连续段**才是真卡顿，多见于 8 路相机同时编码时 GPU 编码器占满，触觉线程停顿 0.3~0.9 秒。
    - 重复率在个位数百分比且均为短段时数据可用；有很长连续段的 episode 应弃用。
    - 持续出现时按 [USB 带宽不足](#usb-bandwidth) 排查，或减少相机路数。

    `[loop_summary]` 给出实际帧率，如 `= 29.0 fps (nominal 30; dataset timestamps assume nominal)`。数据集时间戳仍按标称帧率写入。

??? failure "日志出现 `[slow_frame] ... overrun=`"
    **原因**：某帧耗时超出帧预算（30fps 时为 33.3ms）。Rerun 显示在独立线程，**不是原因**。

    **解决**：看 ` | phases obs=… build=… add=… display=…`（各阶段耗时）和行末的 `top_obs=`（最慢的几路传感器）。每个 episode 的前 5 条 `[slow_frame]` 显示在屏幕上，其余写入[会话日志](#logs)，屏幕改为每 5 秒一条 `[slow_frame_summary]`。偶发不影响数据；持续指向同一路相机时按 [USB 带宽不足](#usb-bandwidth) 排查；没有 NVIDIA 显卡见[没有 NVIDIA GPU 的主机怎么录](recording.md#no-gpu)。

??? failure "录制中途停止，提示 `Device lost mid-recording`"
    **原因**：相机或夹爪编码器掉线：线缆松动或受力、螺钉未拧紧、hub 掉电、供电不稳或接触不良。已录制的部分已保存。

    **解决**：掉线 episode 末尾约 1~2 秒为旧值，建议弃用。检查螺钉、走线与 USB 口（反复出现且换口无效见 [USB 带宽不足](#usb-bandwidth)），再用 `--resume` 续录，见[录制](recording.md#52)。

??? failure "无独立显卡的主机上，录制开始即报编码器无法打开"
    **原因**：主机没有 NVIDIA 驱动，却使用了 GPU 硬件编码器。

    **解决**：`lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`，见[没有 NVIDIA GPU 的主机怎么录](recording.md#no-gpu)。

??? failure "编码器处理不及时，日志出现丢帧告警"
    **原因**：编码队列满时最多等 0.1 秒，仍满则丢帧并告警 `Encoder queue full … dropped N frame(s)`（不阻塞采集循环）。

    **解决**：加大 `--dataset.encoder_threads`、使用 `--dataset.vcodec=auto`，或调整 `--dataset.encoder_queue_maxsize`，见[流式编码](recording.md#54)。

??? failure "夹爪开度不正确 / 闭合时不为 0"
    **原因**：编码器零点漂移或未标定（未标定的主夹爪会被拒绝，并提示标定命令）。

    **解决**：跑 `python third_party/taccap-gripper/python/examples/calibrate.py left`（或 `right`）重新标定，每台只需一次，见[夹爪标定](calibration.md#41)。

??? failure "标定报 `encoder-max calibration needs command set >= V2.1`"
    **原因**：固件命令集低于 V2.1（即 leader < 1.2.0），不支持行程标定；`calibrate.py` 不做任何修改即退出。

    **解决**：按[固件 OTA 升级](versions.md#ota)刷固件（先升级 SDK），再重跑 `calibrate.py`。

## 数据与磁盘

??? failure "采集变慢 / 磁盘写满"
    **原因**：磁盘空间不足、写入速度慢或编码处理不及时（双夹爪原始视频吞吐可达约 280 MB/s）。

    **解决**：先录几条 episode 实测体积与丢帧；定期 `df -h` 检查磁盘空间，见[存储规划](dataset.md#storage-planning)。

## Docker 交付镜像 {#docker}

本节仅适用于 [Docker 交付镜像](install.md#docker)路径。容器内串口报 busy，见上文 `Device or resource busy`。

??? failure "`could not select device driver ... gpu` / 容器内看不到显卡"
    **原因**：NVIDIA Container Toolkit 未正确安装，或安装后未重启 Docker daemon。

    **解决**：`install_customer.sh` 会自动安装。手动确认：`docker run --rm --gpus all ubuntu:22.04 nvidia-smi`；看不到显卡时重装 Toolkit 并 `sudo systemctl restart docker`。宿主机驱动需 ≥ 570.144。

??? failure "`Unknown runtime specified nvidia`，`docker compose` 无法启动"
    **原因**：NVIDIA runtime 未注册到 Docker，而 `compose.yaml` 使用了 `runtime: nvidia`（见[容器里的图形界面](install.md#docker-gui)）。

    **解决**：

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # 输出里要能看到 nvidia
    ```

??? failure "容器内 Rerun 无法启动：`Failed to create surface for any enabled backend` / Vulkan adapter 错误，但 `nvidia-smi` 正常"
    **原因**：X11 未授权；或容器未获得 NVIDIA 的 Vulkan ICD，典型是把 `compose.yaml` 中的 `runtime: nvidia` 改成了 `gpus: all`，此时 `vulkaninfo` 报 `INCOMPATIBLE_DRIVER` 或列不出 NVIDIA 设备。

    **解决**：

    - 以宿主机桌面用户执行 `xhost +si:localuser:root`，确认 `echo "$DISPLAY"` 非空且 `/tmp/.X11-unix` 存在；
    - `docker info --format '{{json .Runtimes}}'` 未列出 nvidia 时按上一条注册；已列出时把 `compose.yaml` 改回 `runtime: nvidia`；
    - 确认容器内 `vulkaninfo --summary` 能识别显卡。

??? failure "`pull access denied ... 'docker login'`，或修改 `LEROBOT_IMAGE_TAG` 后拉取的仍是旧镜像"
    **原因**：镜像公开，无需登录。问题在于镜像名解析错误、改 `.env` 后未重新拉取，或当前不在 `docker compose` 所在目录。

    **解决**：`docker compose config --images` 查看镜像名，检查 `.env` 中的 `LEROBOT_IMAGE`（默认 `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`，通常只需填 tag），再 `docker compose pull`，见[钉死镜像版本](install.md#docker-pin)。

??? failure "进入容器时打印 `groups: cannot find name for group ID <n>`"
    该提示无害：NVIDIA runtime 注入了宿主机 `render` 组的 GID，而容器内没有同名组。

??? failure "`0.0.5` 及更早的镜像：`mamba activate` 报 `Shell not initialized`；开始录制即异常退出，报 `FileNotFoundError: 'spd-say'`；导出的 `.mp4` 均报 `Permission denied`，元数据却可以正常复制"
    **原因**：旧镜像的三个已知问题，自 `0.0.6` 起已修复：

    - 进入容器时环境已激活，无需执行 activate；
    - 镜像缺少语音播报所需的 `spd-say`，而 `--play_sounds` 默认为 `true`，进程以 `terminate called without an active exception` 退出；
    - 视频文件权限为 `-rw------- root`（元数据为 `0644`），非 root 用户无法复制，但文件本身完好。

    **解决**：升级镜像（见[钉死镜像版本](install.md#docker-pin)）。继续用旧镜像时：

    - 手动切换环境前先执行 `eval "$(mamba shell hook --shell bash)"`；
    - 录制时加 `--play_sounds=false`，不影响采集；
    - 旧镜像录的视频升级后权限不变，按[数据放在哪](install.md#docker-data)以 root 复制并 `chown`，不要用 `--user`。

??? failure "宿主机能看到触觉传感器，容器内找不到"
    **原因**：未通过 Compose 启动容器（`/dev`、`/run/udev` 未透传），或设备重新枚举后节点尚未稳定。

    **解决**：用 `docker compose run --rm xense-taccap` 进入容器，`ls /dev/v4l/by-id/*GSPS*` 检查节点。为空时在宿主机重新插拔 USB hub，再执行 `sudo udevadm settle --timeout=20`。

??? failure "容器重启后需重新读取传感器配置，启动变慢"
    **原因**：`xensesdk-cache` volume 被删除。该 volume 按序列号缓存传感器配置，避免每次启动都重读 flash 并重新枚举 USB。

    **解决**：保留该 volume，见[数据放在哪](install.md#docker-data)。

---

仍未解决时，准备完整报错、自检输出（`scan_grippers` 的 side / role / firmware_sn）、版本与复现命令，按[支持与反馈](../common/reference.md#support)反馈。
