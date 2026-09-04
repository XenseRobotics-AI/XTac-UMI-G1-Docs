# 故障排查

本页按症状分类,每条给出原因与解决办法。多数问题出在串口权限与 ModemManager 抢占,先看下文「串口权限与设备发现」;动手前先跑[快速开始](index.md)的自检,再对照症状。

## 环境与安装

??? failure "`setup_env.sh --install` 一开始就报 `needs system packages that are not installed`"
    **原因**:硬件 SDK 要现编译,缺 `build-essential` / `cmake` / `pkg-config` / `git` / `curl` 中的某几个,脚本故意在开跑前就停。

    **解决**:照它打印的那一行安装,清单见[系统依赖包](install.md#apt)。另有两条只告警不阻断,也别跳过:`libusb-0.1.so.4`(`libusb-dev` 提供)是相机的运行期依赖,缺了要到 `connect()` 才失败,相机连不上先查它;`v4l-utils` 提供排查相机用的 `v4l2-ctl`。

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` 失败"
    **原因**:环境未装全,或未激活 `xense-taccap` 环境。

    **解决**:`mamba activate xense-taccap` 后重跑 `./setup_env.sh --install`,逐个验证见[安装验证](install.md#25)。

??? failure "`torchcodec` 加载失败 / 视频编码报错"
    **原因**:`torchcodec` 与当前 PyTorch 版本不匹配,或 PyAV 不是要求的 `15.1.0`。

    **解决**:重跑 `setup_env.sh --install` 自动校正;需要带 `libsvtav1` 的系统 FFmpeg 时再单独安装。

## Docker 交付镜像 {#docker}

只在走 [Docker 交付镜像](install.md#docker)时会遇到;容器里串口 busy 见下文 `Device or resource busy`。

??? failure "`could not select device driver ... gpu` / 容器里看不到显卡"
    **原因**:NVIDIA Container Toolkit 没装好,或装完没重启 Docker daemon。

    **解决**:`install_customer.sh` 会自动装;手工确认用 `docker run --rm --gpus all ubuntu:22.04 nvidia-smi`,看不到显卡就重装 Toolkit 并 `sudo systemctl restart docker`,宿主机驱动要 ≥ 570.144。

??? failure "`Unknown runtime specified nvidia`,`docker compose` 起不来"
    **原因**:NVIDIA runtime 没注册进 Docker;`compose.yaml` 为拿到图形能力用的是 `runtime: nvidia`(见[容器里的图形界面](install.md#docker-gui))。

    **解决**:

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # 输出里要能看到 nvidia
    ```

??? failure "容器里 Rerun 起不来:`Failed to create surface for any enabled backend` / Vulkan adapter 错误,但 `nvidia-smi` 正常"
    **原因**:X11 没授权;或容器拿到了 CUDA 却没拿到 NVIDIA 的 Vulkan ICD,典型是把 `compose.yaml` 的 `runtime: nvidia` 改回了只申请 compute + utility 的 `gpus: all`,此时 `vulkaninfo` 报 `INCOMPATIBLE_DRIVER` 或列不出 NVIDIA 设备。

    **解决**:宿主机图形桌面用户下执行 `xhost +si:localuser:root`,确认 `echo "$DISPLAY"` 非空、`/tmp/.X11-unix` 存在;`docker info --format '{{json .Runtimes}}'` 没列出 nvidia 就按上一条注册,有就把 `compose.yaml` 改回 `runtime: nvidia`;再确认容器里 `vulkaninfo --summary` 认得显卡。

??? failure "`pull access denied ... 'docker login'`,或改了 `LEROBOT_IMAGE_TAG` 拉到的还是老镜像"
    **原因**:镜像是公开的,不需要登录;是镜像名解析错了,或 `.env` 改完没重新拉、不在执行 `docker compose` 的目录里。

    **解决**:`docker compose config --images` 看解析出的镜像名,检查 `.env` 里 `LEROBOT_IMAGE` 有没有写错(默认 `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`,正常只写 tag 一行),再 `docker compose pull`,见[钉死镜像版本](install.md#docker-pin)。

??? failure "进容器时打印 `groups: cannot find name for group ID <n>`"
    无害。NVIDIA runtime 注入了宿主机的 `render` 组 GID,容器里没有同名组;不影响 GPU、相机或采集。

??? failure "`0.0.5` 及更早的镜像:`mamba activate` 报 `Shell not initialized`;一开录就崩,报 `FileNotFoundError: 'spd-say'`;导出的 `.mp4` 都报 `Permission denied`,元数据却拷得动"
    **原因**:老镜像的三个已知问题,`0.0.6` 起已修。进容器时环境已经激活,不需要 activate;镜像没有语音播报用的 `spd-say`,而 `--play_sounds` 默认 `true`,播报抛异常后进程以 `terminate called without an active exception` 崩掉;录出的视频是 `-rw------- root`,元数据是 `0644`,非 root 拷贝时只有视频失败,文件本身是好的。

    **解决**:升级镜像(见[钉死镜像版本](install.md#docker-pin))。仍钉在老镜像时:手工切环境先 `eval "$(mamba shell hook --shell bash)"`;录制加 `--play_sounds=false`,采集不受影响(容器里刻意不装语音合成器,装了 `spd-say` 会一直挂着,要听提示音就在宿主机上录);老镜像录出的视频升级后权限也不会变,按[数据放在哪](install.md#docker-data)以 root 拷、拷完 `chown`,不要用 `--user`。

??? failure "宿主机能看到触觉传感器,容器里找不到"
    **原因**:容器不是通过 Compose 启动的(`/dev`、`/run/udev` 没透传),或 USB 重新枚举后节点还没稳定。

    **解决**:用 `docker compose run --rm xense-taccap` 进容器,`ls /dev/v4l/by-id/*GSPS*` 确认节点在;空的话回宿主机重插 USB hub,再 `sudo udevadm settle --timeout=20`。

??? failure "容器重启后传感器要重新读一遍、启动变慢"
    **原因**:`xensesdk-cache` volume 被删了;它按序列号缓存传感器配置,避免每次启动重读 flash 并触发 USB 重新枚举。

    **解决**:让它留着,各 volume 的用途见[数据放在哪](install.md#docker-data)。

## 硬件与指示灯 {#hardware}

先记下设备编号、连接方式、指示灯状态、软件报错和现场照片。目前只有**白色长亮 = 正常运行**是确定的灯语,其余灯态仍在开发测试中,以最终发布版本为准。上下电注意防静电。

!!! danger "异味、冒烟、明显发热、结构破损或线缆破皮"
    立即断电并停止使用。

??? failure "主夹爪指示灯不亮"
    **原因**:线缆未插紧、供电不足或接口损坏;主夹爪只能用配套 Type-C 线供电(DC 5V/500mA),不能接 9V/12V 快充适配器。

    **解决**:重插并旋紧锁紧螺钉,换终端接口;仍不亮则停用并联系支持。

??? failure "红灯闪烁 / 设备异常重启"
    **原因**:设备故障或通信异常。

    **解决**:停止录制并重新上电;反复出现则联系技术支持,附上灯态与日志。

??? failure "软件识别不到主夹爪 / `lsusb` 数量不对"
    **原因**:USB 异常、线缆故障或软件未刷新。

    **解决**:`lsusb` 应看到全部 UVC 设备,双夹爪 6 个(4 个 `Xense Robotics ... GSPS01…` 触觉 + 2 个 `Sunplus ... XCA…` 腕相机),单臂 3 个;序列号末位单左双右,见[序列号与左右识别](../common/gripper.md#sn)。数量不对就检查线缆锁紧与左右接法,重开采集软件,换 Type-C 接口或线缆;能列出但打不开见下一节。

??? failure "图像黑屏 / 无图像"
    **原因**:UVC 未识别、传感器连接异常或通道选错。

    **解决**:`lsusb` 确认识别到该设备,重启采集软件,重新上电。

??? failure "图像有污点 / 模糊"
    **原因**:传感器表面污渍、异物或损伤。

    **解决**:无尘布清洁,见[维护保养](../common/maintenance.md);有划伤、凹陷需更换传感器。

??? failure "从夹爪不上电 / 通信异常"
    **原因**:从夹爪供电走 24V 适配器、通信走 Type-C。不上电是 24V 未连或适配器异常;通信异常是 Type-C 未连、未识别,或线缆被机器人运动拉扯。

    **解决**:检查 24V 适配器、插座、电源接口与规格,先连 24V 再连 Type-C 并锁紧(见[上电顺序](index.md#power-on));重连 Type-C 并旋紧锁紧螺钉,走线避开关节与夹爪运动区,首次运行前低速测试。

??? failure "OTA 升级时蓝灯亮得过久"
    **原因**:升级未完成或流程异常。

    **解决**:升级期间不要断电;长时间无变化按[固件 OTA 升级](versions.md#ota)处理并联系支持。

## 串口权限与设备发现

??? failure "`connect()` 报 `No leader gripper discovered for the <side> side.`"
    **原因**(最常见):用户不在 `dialout` 组,SDK 能列出夹爪但打不开串口读固件 SN,于是 `role=Unknown` / `firmware_sn` 为空;底层是 `IoError: SerialBus: open(...): Permission denied`。

    **解决**:`sudo usermod -aG dialout "$USER"`,然后必须注销重登(或 `newgrp dialout`)再重插夹爪,不重登报错不变。详见[串口权限](host-setup.md#31)。

??? failure "`Device or resource busy`(热插拔后立即启动;容器里 `/dev/ttyACM*` 报 busy 也是它)"
    **原因**:ModemManager 每次热插拔都用 AT 指令探测 CH343 串口并占用几秒,典型是拔下、换口、立即重启就 busy;装了 `brltty` 也会同样抢占。容器里也一样,规则要装在宿主机。

    **解决**:临时办法是插好等约 3 秒;永久办法是加 udev 规则让 ModemManager 忽略 `1a86` 设备(Docker 路径的 `install_customer.sh` 已装过一次),规则与验证命令见[关闭 ModemManager 抢占](host-setup.md#32),装完重插夹爪。

??? failure "修好权限后 `firmware_sn` 仍为空 / `role=Unknown`"
    **原因**:SN 未烧录、串口读取仍失败、固件通信异常或设备端配置问题;不能只凭空 SN 推断固件版本。

    **解决**:保存完整底层报错,换线、换口复测;仍为空时联系设备或固件团队核对 SN 烧录与通信状态。

??? failure "报错指名某个 hub / 序列号"
    **原因**:装配与"单左双右"规则不符:序列号不合规、每侧数量不对、两枚指尖触觉传感器映射到同一侧、触觉 hub 找不到对应夹爪。

    **解决**:按报错指名的物理设备或 hub 排查装配与接线,规则见[设备发现](host-setup.md#33)。

??? failure "腕相机 / 视触觉打不开、`video ... busy`"
    **原因**:相机被外部相机服务占用,或用户不在 `video` 组。

    **解决**:确认相机服务状态;`sudo usermod -aG video "$USER"`,重登生效。每次挂的不是同一路时看下面的 USB 带宽。

### USB 带宽不够 {#usb-bandwidth}

!!! warning "双夹爪装机第一天就量一次,别等到相机打不开"
    这是双夹爪现场最常见的故障,插线那一刻就决定了,取决于两只夹爪插在哪几个物理口上。带宽预算怎么算、`lsusb -t` 怎么看,见 [USB 带宽预算](host-setup.md#usb-budget),本节只讲判定与处置。

??? failure "某一路相机打不开(`Cannot open camera N`),而且每次挂的不是同一路"
    **原因**:USB 带宽不够,不是硬件坏了。每个 UVC 相机打开时都独占预留一份等时带宽,超出总线预算(约 384 Mbit/s)时最后打开的那路失败,而谁最后打开每次不同,所以故障会"飘"。插蓝色 USB 3 口没用,触觉与腕相机仍落在同一控制器的 USB 2.0 总线上。

    **先确认是不是带宽**:`lsusb -t` 数一数每条 `480M` 总线上挂了几个相机,双夹爪六个挤一条很可能超;启动时另开终端盯内核日志:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` 不能省,否则 `grep` 一直缓冲像卡住。相机打不开那一刻打出 `Not enough bandwidth for altsetting N` 即可确诊。也可以拆成两半各跑一次:

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

    两半分别正常、合起来失败就是带宽问题;`enable_tactile=false` 只用于判断,不要拿它录数据。

    **解决**:先确认腕相机没被从默认 `MJPG` 改成 `YUYV`(`--robot.wrist_camera_fourcc`),`MJPG` 正是为省带宽才设为默认。仍超就只能加一个 USB 主控制器而不是 hub(Thunderbolt / USB4 扩展坞自带 xHCI 控制器,普通 hub 不带),把一只夹爪插过去后 `lsusb -t` 应多出一行新的 `480M` root_hub。装第二个控制器前可先关腕相机录,数据集将没有 `{side}_wrist` 键,开录前定下来,不要一半有一半没有。

??? question "到底超了多少?"
    以本机实测为准。一台只有一条 `480M` 总线的双夹爪主机量到:

    | 开哪些相机 | 预留 | 结果 |
    |---|---|---|
    | 只开四路触觉(两侧 `_enable_wrist_camera=false`) | 242 Mbit/s | 正常 |
    | 只开两路腕相机(`--robot.enable_tactile=false`) | 够用 | 正常 |
    | 六个全开(默认) | 6 × 60.4 = 362 Mbit/s | 失败 |

    `altsetting 6` 是每微帧 944 字节,即每枚触觉 60.4 Mbit/s,而 320x240 YUYV@30 实际只有约 37 Mbit/s,腕相机申请得更多;362 对约 384 就差在边上。自己读数:

    ```bash
    # I:* 是当前生效的 altsetting;类名在这个文件里是小写的 (video)
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    每个 video 接口的 `Alt=` 与其 `E:` 行的 `MxPS=` 给出预留量(`MxPS × 8000 × 8` bit/s),按总线求和再与约 384 Mbit/s 比;申请量由固件的 UVC 描述符决定,采集程序改不了。

??? question "换个 USB 口、调低 `tactile_fps`、`uvcvideo quirks=128` 有用吗?"
    都没用:换物理 USB 口,同一控制器的所有口共用一条 USB 2.0 总线,要换就换到另一个控制器;调低 `--robot.tactile_fps`,只节流 Python 侧读取,传感器 SDK 不接受 fps 参数,USB 上的流没变;`uvcvideo quirks=128`(`UVC_QUIRK_FIX_BANDWIDTH`)实测无效,它按 `宽 × 高 × bpp` 重算预留量,对超得最多的 MJPEG 腕相机无从下手。

## Pico4 追踪器与位姿

??? failure "没有位姿 / 追踪器连不上 / 位姿不稳"
    **原因**:电脑 WiFi 与 Pico4 Ultra 企业版有线共享网络冲突(最常见);或 XenseVR PC Service、XTac-UMI XR 未启动,追踪器未配对或没电。

    **解决**:先关闭数采电脑 WiFi,只保留有线共享网络(见[网络连接](../common/pico4.md#pico-network));再按[上电顺序](index.md#power-on)逐项确认;启动服务 `/opt/apps/roboticsservice/runService.sh`;必要时用 `python -m lerobot.robots.taccap_gripper.check_tracker` 自检。

??? failure "位姿参考系在集之间漂移"
    **原因**:分集途中重启了 XTac-UMI XR,世界原点被重设。

    **解决**:分集之间不重启 XTac-UMI XR,已重启的把之后的数据当新数据集处理,见[坐标系对齐](../common/pico4.md#pico-frame)。

??? failure "采集间隙位姿突然中断 / 头显自己灭屏"
    **原因**:头显未关闭灭屏与系统休眠,挂起后 XTac-UMI XR 被暂停或杀掉,重启它又会造成上一条的漂移。

    **解决**:企业设置 → 系统设置 → 电源策略,先把「系统休眠」设为「永不」,再把「灭屏」设为「永不」(顺序反了灭屏会被休眠时间钳制回有限值),见[系统设置](../common/pico4.md#pico-system)。

??? failure "追踪模式里选不到追踪器 / PC Service 发现不了这个 SN / 配对界面搜不到追踪器"
    **原因**:追踪器没有绑定到这台头显(新机、换了追踪器或头显、恢复过出厂设置);配对时搜不到是追踪器没进入蓝牙配对状态(蓝灯常亮)。

    **解决**:打开「体感追踪器」App 完成绑定,两枚都要绑;配对前长按电源键约 6 秒,直到指示灯蓝红交替闪烁,再点「开始配对」。见[绑定追踪器](../common/pico4.md#pico-tracker-bind)。

??? failure "XTac-UMI XR 一直显示「未连接」"
    **原因**:多半不在 App,而是有线共享网络没接好,或数采电脑的 WiFi 没关。

    **解决**:先点「重连」;仍不行就按[网络连接](../common/pico4.md#pico-network)重接一遍并确认电脑 WiFi 已关,界面见[打开 App 后的界面](../common/pico4.md#pico-toolkit-ui)。

??? failure "头显里显示「已连接」,PC 端却收不到任何位姿"
    **原因**:「已连接」只说明 App 连到了服务;主机侧服务没起来,或追踪器没开机、没绑定。

    **解决**:确认主机已启动 [XenseVR PC Service](host-setup.md#35);再用 `/opt/apps/roboticsservice/` 的 `ConsoleDemo` 或 `python -m lerobot.robots.taccap_gripper.check_tracker` 看能否读到带 `sn` 的位姿,读不到就回[绑定](../common/pico4.md#pico-tracker-bind)确认两枚追踪器都已开机并「已连接」。

??? failure "追踪器侧别匹配错 / PC 服务枚举不稳"
    **原因**:序列号不合规,或枚举抖动。

    **解决**:用 `--robot.tracker_serial=<SN>` 逐字钉住(不枚举、不校验);或核对序列号末尾字母 `G` 前一个数字,单左双右,见[追踪器序列号](../common/pico4.md#pico-tracker-sn)。

## 头显相机 {#head-camera}

??? failure "开了 `--robot.enable_head_camera=true`,一直卡在等待首帧"
    **原因**:画面由 PC Service 转发,任何一环没通都收不到帧:服务版本低于 v0.2.0(v0.1.0 不转发头显相机画面),或头显 App 没在推流。

    **解决**:按顺序查:

    ```bash
    # 1) 服务 deb 版本:需要 ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) 是否带相机接口
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    再确认头显已连上 PC Service 且 App 正在推流(相机与追踪器共用同一条连接)。前置条件见[头显相机](recording.md#56)。

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **原因**:加载的是旧版接口(相机接口随 v0.2.0 加入)。这个模块链接的 C SDK 取自已安装的 `.deb`,先看装的是哪一版:`dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`。

    **解决**:拉最新主仓库后重跑 `./setup_env.sh --install`,它会把 `.deb` 一并升到基线版本;仍为 `False` 时用 `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` 确认加载的是哪一份。`Status` 不是 `install ok installed`(例如 `dpkg -r` 删过,残留 `deinstall ok config-files`)时同样重装一次。

??? failure "日志反复出现左右眼偏差(skew)告警"
    **原因**:两只眼是两条独立消息,时间戳差超过 `--robot.head_camera_pair_max_skew_ms`(默认 20 ms);常见于主机负载过高,或头显与 PC 之间链路抖动。

    **解决**:告警不中断录制,但这几帧左右眼可能不同步。先降低主机负载(减少相机路数、用 `--robot.head_camera_eyes=left` 只录一只眼);链路问题按[网络连接](../common/pico4.md#pico-network)排查;确认只是抖动时再适当放宽该阈值。

??? failure "`head_camera_width/_height` 报尺寸不支持,或尺寸合法、connect 时仍报首帧尺寸不符"
    **原因**:头显相机只接受与头显 App「分辨率」三档一一对应的三种尺寸,填别的直接报错;尺寸合法仍报不符,是命令行与头显里的「分辨率」对不上,最常见是头显调到了 `1024` 或 `1280`,命令行还是默认。

    **解决**:两边取同一个值,头显停在默认 `640` 就不加参数,对应表见[头显相机](recording.md#56);改尺寸等于换了一组数据,变更前后的 episode 不能混用。头显那一项在[打开 App 后的界面](../common/pico4.md#pico-toolkit-ui)。

## 采集与录制

??? failure "命令刚敲下去就退出:`--robot.id is required`"
    **原因**:`--robot.id` 是必填的工位号,解析命令行时就检查。

    **解决**:补上工位号,填数字即可(`0` / `1`…,一套设备一个,双夹爪算一套;前缀按 `--robot.type` 自动补成 `taccap_0` / `bi_taccap_0`),例如 `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`。它标的是工位不是硬件,换夹爪不用改;设备身份记在数据集的 `meta/hardware.json` 里,见 [`--robot.id` 与硬件清单](recording.md#robot-id)。

??? failure "续录时告警:数据集里已有的 `meta/hardware.json` 和当前硬件对不上"
    **原因**:用 `--resume` 续录时换了夹爪或触觉传感器,程序保留原文件并告警。

    **解决**:告警不阻断录制。有意换硬件就继续,这条告警就是数据集跨了两套硬件的记录;不是有意的(比如插错了一只夹爪),先停下把设备换回去。

??? failure "开了 `--display_data=true` 后日志频繁出现 `[slow_frame]`"
    **原因**:Rerun 显示占掉了帧预算。双夹爪 + 头显(四路触觉、两路腕相机、两只眼)实测 JPEG 压缩每帧 13.2 ms、不压缩 3.1 ms,而 30 fps 的预算只有 33.3 ms。先看 `[slow_frame]` 行末的 `top_obs=`,分清是传感器慢还是显示贵,两者解法相反。

    **解决**:确认 `--display_compressed_images=false`、`--display_image_every_n=1` 这两个默认值没被改过;仍超时再调大 `--display_image_every_n`,相机画面刷新变稀,`tcp.*`、`gripper.pos` 等标量仍全速,这是最后手段。

??? failure "录制中途停下,提示 `Device lost mid-recording`"
    **原因**:某路相机或夹爪编码器掉线:线松、锁紧螺钉没拧紧、线缆受力、hub 掉电、供电不稳或 USB 口接触不良。采集主动停止,已录部分会存盘。

    **解决**:掉线那一集最后一两秒是重复的旧值,建议弃用。检查锁紧螺钉、走线与 USB 口(反复出现且换口无效见 [USB 带宽不够](#usb-bandwidth)),再用 `--resume` 在同一数据集上续录,见[录制](recording.md#52)。

??? failure "没有独显的机器上,录制一开始就报编码器打不开"
    **原因**:机器没有 NVIDIA 驱动,却在用 GPU 硬件编码器。

    **解决**:改用 CPU 编码器并关掉流式编码:`lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`,原因见[没有 NVIDIA GPU 的主机怎么录](recording.md#no-gpu)。

??? failure "编码器跟不上、日志出现丢帧告警"
    **原因**:实时编码队列满时会丢最旧帧(不阻塞采集循环)。

    **解决**:增大 `--dataset.encoder_threads`、用 `--dataset.vcodec=auto` 硬件编码,或调 `--dataset.encoder_queue_maxsize`,见[录制选项](recording.md#54)。

??? failure "夹爪开度不对 / 闭合时不为 0"
    **原因**:编码器零点漂移或未标定;没标过的主夹爪采集程序会拒绝连接并提示要跑的命令。

    **解决**:`python third_party/taccap-gripper/python/examples/calibrate.py left`(或 `right`)重新标定,同时重标零点与行程上限,都写入 MCU flash,每台标一次即可,见[夹爪标定](calibration.md#41)。

??? failure "标定报 `encoder-max calibration needs command set >= V2.1`"
    **原因**:固件命令集低于 V2.1(即 leader < 1.2.0),不支持行程标定;`calibrate.py` 原样退出、不改动任何东西。

    **解决**:刷固件,步骤(先升 SDK、按角色选镜像、镜像只写文件名)见[固件 OTA 升级](versions.md#ota),刷完重跑 `calibrate.py`。

## 数据与磁盘

??? failure "采集变慢 / 磁盘写满"
    **原因**:双夹爪多相机原始视频吞吐可达约 280 MB/s,编码后写入量取决于分辨率、画面内容、编码器与码率;盘空间不足、持续写入性能不足或编码线程跟不上都会出问题。

    **解决**:先用少量 episode 实测编码后体积和丢帧情况,再规划批量采集;定期检查 `df -h` 与数据集目录大小,见[存储规划](dataset.md#storage-planning)。

---

仍未解决?带上完整报错、自检输出(`scan_grippers` 的 side / role / firmware_sn)、版本信息和复现命令,按[支持与反馈](../common/reference.md#support)的渠道反馈。
