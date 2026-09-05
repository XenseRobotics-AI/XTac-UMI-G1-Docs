# 主机与 Pico4 配置

夹爪能被列出不等于能被打开。本页做完主机侧两项一次性配置(串口权限、ModemManager),讲清设备按序列号自动分左右,并把 Pico4 Ultra 企业版从开箱配到「已连接」,之后就能启动 XenseVR PC Service 进入标定与采集。

## 串口权限(dialout) {#31}

夹爪 MCU 枚举为 `/dev/ttyACM*`,属 `dialout` 组。用户不在该组时,SDK 能列出夹爪但打不开串口读固件序列号,`scan_grippers()` 报 `role=Unknown`、`firmware_sn` 为空:

```text
RuntimeError: No leader gripper discovered for the left side.
# 底层实为: IoError: SerialBus: open(/dev/serial/by-id/...): Permission denied
```

一次性加入组:

```bash
sudo usermod -aG dialout "$USER"
```

!!! warning "改完组必须重登,否则等于没做"
    组权限只对新建的登录会话生效,当前终端仍是旧权限,照样报 `role=Unknown`。注销重登(或执行 `newgrp dialout`),重新插拔夹爪,再验证。

验证:`role` 必须是 `Leader`/`Follower`(不是 `Unknown`),`firmware_sn` 非空:

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side.name, g.role.name, repr(g.firmware_sn))"
```

修好权限后 `firmware_sn` 仍为空,可能是 SN 未烧录、串口读取仍失败或固件通信异常,不能只凭空 SN 推断固件版本;保存完整报错,换线、换口复测,仍异常时联系设备或固件团队。

## 关闭 ModemManager 抢占(udev) {#32}

用 [Docker 交付镜像](install.md#docker)时,`install_customer.sh` 已把这条 udev 规则装到主机上(容器管不了主机的热插拔规则),不用重做。

夹爪 MCU 是 CH343 USB 串口(`1a86:55d2`,CDC-ACM)。每次热插拔,ModemManager(Ubuntu/GNOME 默认的蜂窝调制解调器服务)会用 AT 指令探测新端口并占用几秒,此时连接失败:

```text
IoError: SerialBus: open(/dev/serial/by-id/usb-1a86_USB_Dual_Serial_..-if02): Device or resource busy
```

典型症状:第一次启动正常,拔下换个口立即重启就 busy;不是触觉、相机或带宽问题。盲文驱动 `brltty` 也会抢占 `1a86`。临时办法:插好后等约 3 秒再启动。

永久修复,让 ModemManager 忽略这类设备(不影响真正的调制解调器):

```bash
sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
# XTac-UMI G1 MCUs are CH343 USB-serial (1a86:55d2) — keep ModemManager off them
ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
```

验证:

```bash
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # -> ID_MM_DEVICE_IGNORE=1
mmcli -L                                                               # 夹爪不再被列出
```

删除规则文件并重载即可还原;专用主机若无蜂窝模块,也可 `sudo systemctl disable --now ModemManager`。

## 设备自动发现与"单左双右" {#33}

所有设备按序列号 + USB 拓扑自动发现并分到 `left`/`right`,不手写序列号。

### 序列号语法

| 设备 | 语法 | 示例 |
|---|---|---|
| 夹爪 Gripper | `TCGU01<batch><line><seq><m\|s>` | `TCGU01A24Z0002m` |
| 触觉 Tactile | `GSPS01<batch><line><seq>` | `GSPS01A25Z0011` |
| 相机 Camera | `XC<batch><line><seq><m\|s>` | `XCA24Z0007m` |

`<seq>` 为 4 位;`m` → leader(主夹爪),`s` → follower(从夹爪)。

### 侧别规则

4 位序列号的最后一位:奇数 → 左,偶数 → 右。适用于夹爪、腕相机,以及同一只夹爪上两枚指尖触觉的左右。

触觉映射到 `{side}_tactile_{left,right}`:共享同一夹爪 USB hub 的两枚 GSPS 就是该夹爪的一对,夹爪侧别读自其固件 SN(`scan_grippers()` 输出里的 side),不是 CH343 的 `mcu_serial`,即 hub → 夹爪 → 侧别;两枚里哪枚是 left/right,看 GSPS 序列号最后一位。

Pico4 Ultra 企业版追踪器是另一套序列号,形如 `PC2310MLL3200496G`,按末尾字母 `G` 前那个数字判断单左双右:此例是 `6`,在右侧。这个 SN 头显上看不到,见[读取追踪器 SN](#pico-tracker-sn)。

不合规序列号、每侧数量不对、两枚指尖触觉映射到同一侧、两只夹爪抢同一触觉侧别、触觉 hub 找不到对应夹爪,设备发现都会直接报错并指明 hub/序列号。先报重复、再报缺失:某侧为空通常是它的设备把自己算到了另一侧,先复核挤了两个的那一侧。

### USB 带宽预算 {#usb-budget}

某一路相机能不能打开,在插线那一刻就由带宽决定了;相机打不开先量这一步。

每个 UVC 相机打开期间都独占预留一份等时带宽,按 USB 2.0 总线算:一条总线 480 Mbit/s,约 384 Mbit/s 给等时传输。双夹爪共六个相机(四路触觉 + 两路腕相机),再加笔记本自带摄像头。

```bash
lsusb -t
```

每一行 `480M` 的 `root_hub` 是一份预算,数每份上挂了几个相机:两条各挂三个是宽裕的;六个挤在一条上就得实测,各批次传感器申请量不同。触觉和腕相机都是 USB 2.0 设备,插蓝色 USB 3 口仍落在该控制器的 USB 2.0 总线上,要分开得插到另一个主控制器(Thunderbolt / USB4 扩展坞自带一个,普通 hub 不带)。

启动采集时内核日志出现 `Not enough bandwidth for altsetting N` 就是它。怎么盯日志、完整判定、实测数字与三条看着像解法其实没用的办法见[故障排查 · USB 带宽不够](troubleshooting.md#usb-bandwidth)。

## Pico4 Ultra 企业版配置 {#34}

Pico4 Ultra 企业版配套的独立运动追踪器装在夹爪顶部,提供 6-DoF 位姿;头显上运行 XTac-UMI XR(VR 客户端 APP),位姿经 [XenseVR PC Service](#35) 送到采集端。

出厂已配置的头显,开发者模式、电源策略、APP、追踪器绑定、追踪模式都已设好且断电不丢(恢复出厂或换头显才要重做),直接从[网络连接](#pico-network)开始;接 USB、短按追踪器电源键到蓝灯亮、[点「重连」](#pico-toolkit-ui)、[启动对齐](#pico-frame)每次采集都要做。

### 开箱与系统更新 {#pico-unbox}

1. 开箱:撕掉机身前面板保护贴、控制器胶条与镜片贴纸,长按电源键开机。

    ![前面板传感器条上的保护贴](assets/pico4/unbox-film.webp){ width="440" }

2. 更新系统,新机必做,出厂系统偏低,升级后才能正常使用,要在配追踪器、装 APP 之前做完:连有网的 WiFi,进 设置 → 系统升级,点「下载并安装」升到 5.15.5.U 或更高,安装包约 1.9 GB。

    ![系统升级到 5.15.5.U](assets/pico4/system-update.webp){ width="560" }

### 系统设置:开发者模式与电源策略 {#pico-system}

1. 开启开发者模式:设置 → 关于本机 → 连续点击「软件版本号」数次 → 左侧出现「开发者选项」→ 打开 USB 调试。

    ![连续点击软件版本号](assets/pico4/devmode-tap-version.webp){ width="480" }

    ![开发者选项 → 打开 USB 调试](assets/pico4/devmode-usb-debug.webp){ width="480" }

2. 关闭休眠与灭屏:开发者选项里点「企业设置」→ 系统设置 → 电源策略(只有企业版有这一项,消费版调不到「永不」)。出厂默认灭屏 30 秒、系统休眠 5 分钟、电量图标不显示,三项都改,按顺序:
    1. 先设 系统休眠 = 永不;
    2. 再设 灭屏(息屏)= 永不;
    3. 把最下方的电量及充电状态图标设为「常驻显示」,采集途中可看电量。

    ![电源策略最终设置](assets/pico4/power-step4-final.webp){ width="480" }

!!! warning "先休眠、后灭屏,顺序不能反"
    灭屏时间受系统休眠约束:先改灭屏,系统休眠还是默认值,灭屏的「永不」会被钳回有限值,看着已设置,实际没生效。改完退出设置再进来确认两项都是「永不」。

不关的后果:头显在采集间隙灭屏/休眠后 XTac-UMI XR 会被挂起或杀掉,追踪中断,重启它又会重设世界系(见[坐标系对齐](#pico-frame));摘下头显放置时同样会触发。

### 安装 XTac-UMI XR {#pico-app}

1. 电脑侧:USB 线连接头显与电脑,把 `XTac-UMI-XR-0.1.X.apk` 拷到头显的 `Download/` 目录(`0.1.X` 是版本号,以拿到的那份为准)。

    ![把 apk 拷进 Pico 的 Download 目录](assets/pico4/install-step1-copy.webp){ width="480" }

2. 戴上头显,任务栏点「文件管理」,进「Download」文件夹。

    ![文件管理 → Download](assets/pico4/install-step2-filemanager.webp){ width="480" }

3. 点 `XTac-UMI-XR-0.1.X.apk`,在「要安装此应用吗?」里选「安装」。装好后「资源库」里应出现 XTac-UMI XR。

    ![确认安装](assets/pico4/install-step3-confirm.webp){ width="480" }

### 网络连接 {#pico-network}

追踪数据要送到数采电脑上的 XenseVR PC Service,有线和无线都支持:

| 接法 | 说明 |
|---|---|
| USB 有线共享网络(推荐) | Type-C 线直连数采电脑,头显给电脑分配 IP |
| WiFi 无线 | 头显与数采电脑接入同一个网络 |

WiFi 环境复杂(信道拥挤、干扰多)时会位姿卡顿、抖动或掉数据,且不易和别的问题区分;正式采集用有线,无线只用于临时调试。

有线连接步骤:

1. 头显内 设置 → 开发者选项 → 打开「USB 调试」→「USB 连接」选「传输文件」。每次拔插 USB 后都要回来确认,它会掉回默认值;选不了就重启 Pico。
2. 电脑端先启动服务(见[启动 XenseVR PC Service](#35)):`runService.sh`。服务没起来,APP 只会停在「未连接」。
3. 打开 XTac-UMI XR,点「重连」,状态变成「已连接」(见[打开 App 后的界面](#pico-toolkit-ui))。

走 WiFi 时头显和数采电脑接同一网络,其余相同。

!!! warning "走有线时,关掉数采电脑的 WiFi"
    有线共享网络会与电脑上的其他网络(尤其 WiFi)冲突(路由 / 网卡抢占),导致追踪器连不上或位姿不稳。只保留头显的共享网络。

![USB 连接选择传输文件](assets/pico4/usb-shared-network.webp){ width="520" }

### 绑定运动追踪器到头显 {#pico-tracker-bind}

首次使用或更换追踪器后,必须先把 PICO Motion Tracker 绑定到这台头显,否则追踪模式里选不到它,XTac-UMI XR 与 PC Service 也发现不了它的 SN。

配对前先用手机扫追踪器背面的二维码拿到完整 SN,按单左双右(见[设备自动发现](#33))装夹爪。红框里的六位数就是配对后「我的追踪器」列表里的编号(如 `Tracker 150311`)。

| 扫这里 | 扫出来是这样 |
|---|---|
| ![追踪器背面的二维码](assets/pico4/tracker-sn-qr.webp){ width="300" } | ![左追踪器的扫描结果](assets/pico4/tracker-sn-left.webp){ width="320" }<br>`G` 前是 `1`,单数 → 装左夹爪 |

1. 从资源库打开「体感追踪器」App,点主界面右上角的图标进入配对界面。

    ![右上角进入配对界面](assets/pico4/tracker-pair-entry.webp){ width="440" }

2. 长按追踪器电源键约 6 秒,直到指示灯蓝红交替闪烁,这是蓝牙配对状态。
3. 点「开始配对」。配对成功时头显会响一声提示音,该追踪器出现在「我的追踪器」列表里,显示电量与编号(如 `Tracker 150399`)并标注「已连接」。
4. 两只夹爪各一枚,要绑两枚,列表顶部应显示「已配对 2 个」。

    ![体感追踪器 App:已配对 2 个](assets/pico4/tracker-bind.webp){ width="440" }

!!! warning "开机是短按,配对才要长按"
    只亮蓝灯是普通开机,不是配对状态,App 扫不到。日常开机短按到蓝灯亮;只有首次绑定才长按约 6 秒到蓝红交替闪烁。

绑定关系存在头显上,日常开关机、重启 APP 不用重绑;换追踪器、换头显或恢复出厂后要重绑,先在列表项右侧的 ⓘ 里解除配对,再绑新的。

!!! warning "独立追踪模式下,追踪器必须在头显视野内"
    被身体、桌沿或另一只手长时间遮挡会丢跟踪(位姿跳变或卡住),别让夹爪顶部的追踪器长时间脱离头显视野。

#### 读取追踪器 SN {#pico-tracker-sn}

SN 决定左右(`G` 前一个数字单左双右),也是 PC Service 识别追踪器的依据。头显里看不到它:「体感追踪器」App 只显示短编号(如 `Tracker 150399`),XTac-UMI XR 的 Network 面板显示的 SN(如 `PA9410MGL…`)是头显自己的。完整 SN(形如 `PC2310MLL3200496G`)用 PC Service 的 Python 接口读:

```python
import xensevr_pc_service_sdk as xrt

xrt.init()
print(xrt.get_motion_tracker_serial_numbers())   # 例:['PC2310MLL3200496G', ...]
```

它只返回服务当前收到数据的追踪器,所以要先:追踪器已绑定并开机 → XTac-UMI XR [「已连接」](#pico-toolkit-ui) → 主机已启动 [PC Service](#35),少一步就是空列表。拿到 SN 可用 `--robot.tracker_serial=<SN>` 直接钉住,跳过自动匹配;逐个摇晃夹爪确认哪个 SN 是哪只手,再写进配置。

### 追踪模式 {#pico-tracker}

绑定完成后,在头显里打开「体感追踪」,进设置找到「追踪模式」,选「独立追踪」并点「确定」,改完这一行应显示「独立追踪」。出厂默认「全身动捕」是把追踪器戴在身上追人体;「独立追踪」是把追踪器固定在物体上追物体位姿,夹爪就是这种用法。

![选独立追踪并确定](assets/pico4/tracker-mode2-pick.webp){ width="480" }

### 打开 App 后的界面 {#pico-toolkit-ui}

戴上头显,从资源库打开 XTac-UMI XR。界面只有状态、分辨率、重连三项(「折叠」收起面板)。「状态」显示「已连接」之前,PC 端读不到任何位姿。

不用填 PC 端 IP:[有线共享网络](#pico-network)接好后 APP 会自动识别主机上的 XenseVR PC Service,但要点一下「重连」才会连,打开 APP 不会自动连。首次打开会问「允许"XTac-UMI XR"使用相机权限吗?」,点「允许」,否则取不到[头显相机](recording.md#56)画面。

![状态未连接,点「重连」](assets/pico4/app-step2-disconnected.webp){ width="420" }

![允许 XTac-UMI XR 使用相机权限](assets/pico4/app-step3-camera.webp){ width="380" }

「分辨率」是[头显相机](recording.md#56)的取流分辨率,三档 `640` / `1024` / `1280`,默认 `640`,推荐就用它;不用头显相机时不起作用。在这里调高了,采集命令的 `--robot.head_camera_width/_height` 要跟着改成对应值,否则 connect 报首帧尺寸不符,对应表见[头显相机](recording.md#56)。

高精度追踪默认开启,没有开关。一直连不上,多半是[网络](#pico-network)没接好或电脑 WiFi 没关。显示「已连接」后,在主机上用 `/opt/apps/roboticsservice/` 的 `ConsoleDemo` 或 `python -m lerobot.robots.taccap_gripper.check_tracker` 确认能读到带 `sn` 的位姿:头显显示连上和主机真的收到数据是两件事。

### 启动与坐标系对齐 {#pico-frame}

佩戴头显启动 XTac-UMI XR 时面朝机器人正前方,再[点「重连」](#pico-toolkit-ui)连成「已连接」;启动瞬间冻结世界系的原点与方向。

录制位姿落在重力对齐的世界系:X 正 = 面朝前方,Y 正 = 左,Z 正 = 上。原点在启动那一刻头显所在的位置,下图红 = X(前)、绿 = Y(左)、蓝 = Z(上):

![启动瞬间冻结的世界坐标系](assets/pico4/world-frame-origin.webp){ width="420" }

坐标系只在启动瞬间跟着头显,冻结后就固定在空间里,转头、走动都不会带着它动;数据集里所有 `tcp.*` 位姿都以它为参考。

!!! danger "启动时面朝机器人正前方;分集之间不要重启 XTac-UMI XR"
    面朝正前方,世界系 X 轴才对齐机器人正前方;只需对齐方向,站在哪不影响。重启 XTac-UMI XR 后原点/方向会变,同一数据集内位姿参考系不一致。

## 启动 XenseVR PC Service {#35}

追踪器与主机的 XenseVR PC Service(RoboticsService)守护进程通信,它负责设备发现、状态监控与实时追踪数据分发,采集端从它读位姿。[Docker 交付镜像](install.md#docker)的容器启动时会自动拉起它;只处理数据、不用追踪器时可用 `START_XENSEVR_SERVICE=0` 关掉。

```bash
/opt/apps/roboticsservice/runService.sh
```

同一时间只能运行一个实例,重复启动会失败或冲突。

服务可提供 Head / 手柄 / 手势 / 全身动捕 / Tracker 独立追踪多类数据,数采用两类:Tracker 独立追踪位姿(夹爪位姿,带 `sn` 区分追踪器)和头部位姿(头显自己的位姿,和[头显双目画面](recording.md#56)配套)。头显把每只眼的画面和自己的位姿发给 PC Service 再转给采集端,和追踪器共用同一条连接,服务没起来两者都没有;走这一路服务要 ≥ v0.2.0(见[版本基线](versions.md#required)),只用追踪器则版本无所谓。

服务目录 `/opt/apps/roboticsservice/` 附带 `ConsoleDemo` / `RobotDemoQt` 演示程序,可确认头显已被发现、追踪数据正常(需与服务相同的运行环境)。

## 上电顺序 {#36}

上电与下电顺序只在[快速开始 · 上电与下电顺序](quickstart.md#power-on)讲一次,上电按那里的 7 步执行;双夹爪插线前先看[USB 带宽预算](#usb-budget)。

下一步 → [标定与自检](calibration.md)
