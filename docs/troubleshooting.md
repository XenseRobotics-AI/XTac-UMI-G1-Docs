# 故障排查

按**症状**分类。每条:症状 → 原因 → 解决。多数问题集中在**串口权限**与 **ModemManager 抢占**——先看这两类。

!!! tip "定位思路"
    先跑[一页速通 §2](quickstart.md) 的自检命令,再对照下面的症状。

## 环境与安装

??? failure "`setup_env.sh --install` 一开始就报 `needs system packages that are not installed`"
    **原因**:硬件 SDK 要现编译,而机器上缺 `build-essential` / `cmake` / `pkg-config` /
    `git` / `curl` 里的某几个。脚本是**故意在开跑前就停**的——不然错误要等到 CMake 或链接阶段
    才冒出来,看着像 SDK 坏了。
    **解决**:照它打印的那一行敲即可,完整清单见
    [前置:系统依赖包](02-environment.md#apt)。

    另有一条只**告警**不阻断的:缺 `v4l-utils` / `usbutils`。**别跳过**——
    `v4l2-ctl` 和 `lsusb -t` 是相机打不开时唯一能用的工具。

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` 失败"
    **原因**:环境未装全,或未激活 `xense-taccap` 环境。
    **解决**:
    ```bash
    mamba activate xense-taccap
    ./setup_env.sh --install     # 重跑安装
    ```
    逐个验证见 [环境部署 §2.5](02-environment.md#25)。

??? failure "`torchcodec` 加载失败 / 视频编码报错"
    **原因**:`torchcodec` 与当前 PyTorch 的兼容版本不匹配,或 PyAV 不是要求的 `15.1.0`。
    **解决**:重跑 `setup_env.sh --install` 自动校正版本;需要带 `libsvtav1` 的系统 FFmpeg 时再单独安装。

## Docker 交付镜像 {#docker}

只在走 [Docker 那条路径](02-environment.md#docker)时会遇到。

??? failure "`could not select device driver ... gpu` / 容器里看不到显卡"
    **原因**:NVIDIA Container Toolkit 没装好,或装完没重启 Docker daemon。
    **解决**:`install_customer.sh` 会自动装,手工确认用——

    ```bash
    docker run --rm --gpus all ubuntu:22.04 nvidia-smi
    ```

    这条能看到显卡,容器才能用 GPU。看不到就重装 Toolkit 并
    `sudo systemctl restart docker`。宿主机驱动本身要 **≥ 570.144**。

    !!! note "这条过了不代表图形能力也在"
        `--gpus all` 只申请 compute + utility。CUDA 正常、Rerun 却起不来是另一回事,
        见下面 `Failed to create surface` 那条。

??? failure "`Unknown runtime specified nvidia`,`docker compose` 起不来"
    **原因**:NVIDIA runtime 没有注册进 Docker。`compose.yaml` 用的是 `runtime: nvidia`
    (为了拿到图形能力,理由见 [容器里的图形界面](02-environment.md#docker-gui)),
    没注册就直接失败。
    **解决**:

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # 输出里要能看到 nvidia
    ```

??? failure "Rerun 报 `Failed to create surface for any enabled backend`,但 `nvidia-smi` 正常"
    **原因**:容器拿到了 CUDA,却没拿到 NVIDIA 的 Vulkan ICD——典型是有人把
    `compose.yaml` 的 `runtime: nvidia` 改回了 `gpus: all`,后者只申请 compute + utility。
    容器里 `vulkaninfo` 会报 `INCOMPATIBLE_DRIVER` 或列不出 NVIDIA 设备。
    **解决**:

    ```bash
    docker info --format '{{json .Runtimes}}'     # 确认列出了 nvidia
    ```

    没有就按上一条注册 runtime;有的话把 `compose.yaml` 改回 `runtime: nvidia`,
    **不要**换成 `gpus: all`。

??? failure "`docker compose` 报 `pull access denied ... 'docker login'`"
    **原因**:通常不是权限问题——镜像包是**公开的**,拉取不需要登录。多半是镜像名被解析错了。
    **解决**:

    ```bash
    docker compose config --images
    ```

    看解析出来的镜像名对不对,再检查 `.env` 里有没有写错的 `LEROBOT_IMAGE`。
    默认就是 `ghcr.io/vertax42/xense-taccap-lerobot`,**正常情况下 `.env` 里只需要写 tag 一行**,
    见 [录数据前先把版本钉死](02-environment.md#docker-pin)。

??? failure "改了 `.env` 里的 `LEROBOT_IMAGE_TAG`,拉到的还是老镜像"
    **原因**:改完没重新拉,或者 `.env` 不在执行 `docker compose` 的那个目录里。
    **解决**:先确认解析结果,再拉:

    ```bash
    docker compose config --images
    docker compose pull
    ```

    见 [录数据前先把版本钉死](02-environment.md#docker-pin)。

??? failure "容器里 `mamba activate` 报 `Shell not initialized`"
    **原因**:不用 activate——**进容器时环境本来就是激活的**,`lerobot-info` 一类命令直接可用。
    **解决**:确实要手工切环境时,先初始化一次 shell hook:

    ```bash
    eval "$(mamba shell hook --shell bash)"
    ```

    `0.0.6` 起镜像已经内置了这个 hook,不会再出现这条提示。

??? failure "进容器时打印 `groups: cannot find name for group ID <n>`"
    **无害**,可以忽略。NVIDIA runtime 把宿主机的 `render` 组 GID 注入了进来,而容器里
    没有同名的组,仅此而已。不影响 GPU、相机或采集。

??? failure "容器里 `lerobot-record` 一开录就崩,报 `FileNotFoundError: 'spd-say'`"
    **原因**:每集开始会语音播报一句,而播报用的 `spd-say` **不在 `0.0.5` 及更早的镜像里**,
    偏偏 `--play_sounds` 默认是 `true`。第一集播报就抛异常,收尾时"Stop recording"那句又抛一次,
    于是变成 `terminate called without an active exception` 直接崩掉。
    **解决**:把播报关掉即可,**采集本身不受任何影响**:

    ```bash
    lerobot-record --play_sounds=false ... 
    ```

    **`0.0.6` 起已经修好**(播报失败只告警一次,不再中断录制),升级后就不用带这个参数了;
    仍然钉在 `0.0.5` 及更早的机器都要带。Mamba 路径上装了 `speech-dispatcher` 的主机不受影响。

    !!! note "修好之后容器里仍然听不到声音"
        `0.0.6` 的镜像装了 `speech-dispatcher`,但**没有装语音合成器模块**,所以播报只是被
        安全地跳过并告警一次。**这是刻意的**:容器里没有可用的音频输出,补上合成器之后
        `spd-say` 会从"立刻失败"变成"一直挂着",反而更糟。真要听到提示音,请在宿主机上跑录制。

??? failure "导出数据时每个 `.mp4` 都报 `Permission denied`,元数据却拷得动"
    **原因**:`0.0.5` 及更早的镜像录出来的视频是 `-rw------- root`(拼接用的临时文件是 `0600`,
    移动时保留了权限),而元数据是正常的 `0644`。所以非 root 拷贝时**只有视频失败**,
    看着像个别文件坏了——文件其实是好的。
    **解决**:按 [数据放在哪](02-environment.md#docker-data) 那条**以 root 拷、拷完再 `chown`**
    的写法导出,不要用 `--user`。**`0.0.6` 起录出来的视频就是 `0644`**,不会再有这个现象;
    但这取决于**当初录数据的那版镜像**,升级不会改写已经录好的文件,老数据仍按上面的写法导出。

??? failure "容器里看得到 `/dev/ttyACM*`,却报 busy"
    **原因**:ModemManager 抢占,这是**宿主机**的事——容器管不了宿主机的热插拔规则。
    **解决**:在宿主机装那条 udev 规则(见 [3.2](03-host-hardware.md#32)),
    再重新插拔夹爪。`install_customer.sh` 已经帮你装过一次,手工验证同 3.2。

??? failure "宿主机能看到触觉传感器,容器里找不到"
    **原因**:容器不是通过 Compose 启动的(`/dev`、`/run/udev` 没透传),或 USB 重新枚举后
    设备节点还没稳定。
    **解决**:用 `docker compose run --rm xense-taccap` 进容器;在容器里确认节点在——

    ```bash
    ls /dev/v4l/by-id/*GSPS*
    ```

    空的话回宿主机重新插拔 USB hub,再 `sudo udevadm settle --timeout=20`。

??? failure "容器里 Rerun 窗口出不来 / 报 Vulkan adapter 错误"
    **原因**:X11 没授权,或容器里看不到 NVIDIA GPU。
    **解决**:先在宿主机的图形桌面用户下执行 `xhost +si:localuser:root`,并确认
    `echo "$DISPLAY"` 非空、`/tmp/.X11-unix` 存在;再在容器里确认
    `nvidia-smi` 和 `vulkaninfo --summary` 都能识别到显卡。
    见 [容器里的图形界面](02-environment.md#docker-gui)。

    `nvidia-smi` 正常、只有 `vulkaninfo` 认不到显卡时,是图形能力没注入,
    见上面 `Failed to create surface` 那条。

??? failure "容器重启后传感器要重新读一遍、启动变慢"
    **原因**:`xensesdk-cache` 这个 volume 被删了,配置缓存没了。
    **解决**:让它留着就行——它按传感器序列号缓存配置,避免每次启动重读传感器 flash
    并触发 USB 重新枚举。各 volume 的用途见
    [数据放在哪](02-environment.md#docker-data)。

## 串口权限与设备发现

??? failure "`connect()` 报 `No leader gripper discovered for the <side> side.`"
    **原因**(最常见):用户不在 `dialout` 组,SDK 能*列出*夹爪但打不开串口读固件 SN,
    于是 `role=Unknown` / `firmware_sn` 为空。底层是
    `IoError: SerialBus: open(...): Permission denied`。
    **解决**:
    ```bash
    sudo usermod -aG dialout "$USER"
    ```
    **加完组必须注销重登**(或 `newgrp dialout`)**再重插夹爪**——不重登的话当前终端还是
    旧权限,报错一模一样,很容易误以为命令没生效。详见
    [3.1 串口权限](03-host-hardware.md#31)。

??? failure "`Device or resource busy`(热插拔后立即启动)"
    **原因**:**ModemManager** 每次热插拔都用 AT 指令探测 CH343 串口并占用几秒。典型:
    第一次启动正常,拔下→换口→立即重启就 busy。(装了 `brltty` 也会同样抢占。)
    **解决**:临时——插好等 ~3 秒;永久——udev 规则忽略 `1a86` 设备:
    ```bash
    sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
    ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
    EOF
    sudo udevadm control --reload-rules && sudo udevadm trigger
    ```
    详见 [3.2 关闭 ModemManager 抢占](03-host-hardware.md#32)。

??? failure "`firmware_sn` 修好权限后仍为空 / `role=Unknown`"
    **原因**:可能是设备 SN 未烧录、串口读取仍失败、固件通信异常或设备端配置问题;不能只根据空 SN 推断某个固件版本。
    **解决**:先保存完整底层报错并换线 / 换口复测;仍为空时联系设备或固件团队核对 SN 烧录与通信状态。

??? failure "报错指名某个 hub / 序列号"
    **原因**:发现阶段检测到硬件装配与"单左双右"规则不符——序列号不合规、每侧数量不对、
    两枚指尖触觉传感器映射到同一侧、触觉 hub 找不到对应夹爪。
    **解决**:按报错**指名的物理设备/hub**排查装配与接线。规则见 [3.3 设备发现](03-host-hardware.md#33)。

## Pico4 Ultra 企业版追踪器与位姿

??? failure "没有位姿 / 追踪器连不上 / 位姿不稳"
    **原因**:**电脑 WiFi 与 Pico4 Ultra 企业版有线共享网络冲突**(最常见);或 XenseVR PC Service 未启动、
    XTac-UMI XR 未启动、追踪器未配对/没电。
    **解决**:**先关闭数采电脑 WiFi**(只保留 Pico4 Ultra 企业版有线共享网络,见
    [3.4 网络连接](03-host-hardware.md#pico-network));再按 [上电顺序](03-host-hardware.md#36)
    逐项确认;启动服务 `/opt/apps/roboticsservice/runService.sh`;必要时用
    `python -m lerobot.robots.taccap_gripper.check_tracker` 自检。

??? failure "位姿参考系在集之间漂移"
    **原因**:分集途中**重启了 XTac-UMI XR**,世界原点被重设。
    **解决**:采集**全程不要重启** XTac-UMI XR。见 [3.4 Pico4 Ultra 企业版配置](03-host-hardware.md#34)。

??? failure "采集间隙位姿突然中断 / 头显自己灭屏"
    **原因**:头显未关闭灭屏与系统休眠,挂起后 XTac-UMI XR 被系统暂停或杀掉;
    重启 XTac-UMI XR 又会重新冻结世界系,叠加出上一条的参考系漂移。
    **解决**:企业设置 → 系统设置 → **电源策略**,**先**把「系统休眠」设为「永不」,
    **再**把「灭屏」设为「永不」(顺序反了灭屏会被休眠时间钳制回有限值)。
    见 [系统设置 · 电源策略](03-host-hardware.md#pico-system)。

??? failure "追踪模式里选不到追踪器 / PC Service 发现不了这个 SN"
    **原因**:追踪器**没有绑定到这台头显**(新机、换了追踪器、换了头显或恢复过出厂设置)。
    **解决**:打开「体感追踪器」App 完成绑定,两枚都要绑。
    见 [绑定运动追踪器到头显](03-host-hardware.md#pico-tracker-bind)。

??? failure "配对界面搜不到追踪器"
    **原因**:追踪器只是普通开机(**蓝灯常亮**),没进入蓝牙配对状态。
    **解决**:**长按电源键约 6 秒**,直到指示灯**蓝红交替闪烁**,再点「开始配对」。
    见 [绑定运动追踪器到头显](03-host-hardware.md#pico-tracker-bind)。

??? failure "XTac-UMI XR 一直显示「未连接」"
    **原因**:多半不在 APP,而是有线共享网络没接好,或数采电脑的 WiFi 没关。
    **解决**:先点「**重连**」;仍然不行就回
    [网络连接](03-host-hardware.md#pico-network) 重新接一遍,并确认电脑 WiFi 已关闭。
    见 [打开 App 后的界面](03-host-hardware.md#pico-toolkit-ui)。

??? failure "头显里显示「已连接」,PC 端却收不到任何位姿"
    **原因**:头显显示连上,只说明 APP 连到了服务;主机侧的服务没起来、或追踪器没开机
    没绑定,一样收不到位姿。
    **解决**:确认主机已启动 [XenseVR PC Service](03-host-hardware.md#35);再用
    `/opt/apps/roboticsservice/` 的 `ConsoleDemo` 或
    `python -m lerobot.robots.taccap_gripper.check_tracker` 看能否读到带 `sn` 的位姿。
    读不到就回 [绑定](03-host-hardware.md#pico-tracker-bind) 确认两枚追踪器都已开机并「已连接」。

??? failure "追踪器侧别匹配错 / PC 服务枚举不稳"
    **原因**:序列号不合规,或枚举抖动。
    **解决**:用 `--robot.tracker_serial=<SN>` 逐字钉住(不枚举、不校验);或确认序列号
    **末尾字母 `G` 前一个数字**:单左双右。

## 头显相机 {#head-camera}

??? failure "开了 `--robot.enable_head_camera=true`,一直卡在等待首帧"
    **原因**:相机画面由 PC Service 转发,这条路上任何一环没通都收不到帧:
    服务版本低于 v0.2.0(v0.1.0 不转发头显相机画面)、头显 APP 没在推流。
    **解决**:按这个顺序查——

    ```bash
    # 1) 服务 deb 版本:需要 ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) 是否带相机接口
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    再确认头显已连上 PC Service 且 APP 正在推流(相机与追踪器**共用同一条连接**)。
    见 [5.6 头显相机 · 前置条件](05-data-collection.md#56)。

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **原因**:环境里加载的是**旧版接口**(相机接口是随 v0.2.0 一起加的)。这个模块链接的 C SDK
    取自已安装的 `.deb`,所以**先看装的是哪一版 `.deb`**:

    ```bash
    dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'
    ```

    **解决**:拉最新主仓库后重跑 `./setup_env.sh --install`(它会把 `.deb` 一并升到基线版本);
    仍然为 `False` 时用 `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"`
    确认加载的是哪一份。`Status` 不是 `install ok installed`(例如用 `dpkg -r` 删过,残留为
    `deinstall ok config-files`)时,同样按上面重装一次。

??? failure "日志反复出现左右眼偏差(skew)告警"
    **原因**:两只眼是两条独立消息,帧序号不同且时间戳差超过
    `--robot.head_camera_pair_max_skew_ms`(默认 20 ms)。常见于主机负载过高、
    或头显与 PC 之间的链路抖动。
    **解决**:告警**不会中断录制**,但这几帧的左右眼可能不是同一次曝光。先降低主机负载
    (减少相机路数、用 `--robot.head_camera_eyes=left` 只录一只眼);链路问题按
    [3.4 网络连接](03-host-hardware.md#pico-network)排查。确认只是抖动时,再考虑适当放宽该阈值。

??? failure "`head_camera_width/_height` 报错说尺寸不支持"
    **原因**:头显相机**只接受 `1024x768` 和 `1280x960`**(都是 4:3,与传感器一致)。
    填别的会直接报错而不是悄悄降级——重采样会无声改掉记录下来的视场角。
    **解决**:改回两个受支持的尺寸之一。注意**改尺寸等于换了一组数据**,变更前后的 episode
    不能混用。见 [5.6 头显相机](05-data-collection.md#56)。

??? failure "尺寸填的是受支持的值,connect 时仍报首帧尺寸不符"
    **原因**:命令行的尺寸和**头显里的「分辨率」设置**对不上。出画面的是头显,
    参数只是声明预期收到什么。
    **解决**:两边取同一个值——头显选 `1024` 就用默认;选 `1280` 就加
    `--robot.head_camera_width=1280 --robot.head_camera_height=960`。
    头显那一项在 [打开 App 后的界面](03-host-hardware.md#pico-toolkit-ui)。

## 采集与录制

??? failure "命令刚敲下去就退出:`--robot.id is required`"
    **原因**:`--robot.id` 是**必填**的工位号,而且是在**解析命令行时**就检查的——所以什么设备
    都还没碰到就退出了,这是好事:不会有一台设备匿名录完一批数据。
    **解决**:补上工位号,**填数字即可**(`0` / `1`…,一套设备一个,双夹爪算一套;
    前缀按 `--robot.type` 自动补成 `taccap_0` / `bi_taccap_0`):

    ```bash
    lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...
    ```

    它标的是工位、不是硬件,换夹爪不用改;设备的身份记在数据集的 `meta/hardware.json` 里,
    见 [`--robot.id` 与硬件清单](05-data-collection.md#robot-id)。

??? failure "续录时告警:数据集里已有的 `meta/hardware.json` 和当前硬件对不上"
    **原因**:用 `--resume` 往一个数据集里续录,但**换了硬件**(换了夹爪或触觉传感器)。
    程序**保留原文件**并打告警——已经录好的那些集确实来自原来那批设备,覆盖掉就等于把它们记错了。
    **解决**:告警本身不阻断录制。确认是有意换硬件就继续,这条告警就是"这个数据集跨了两套硬件"
    的记录;不是有意的(比如插错了一只夹爪),先停下来把设备换回去。

??? failure "开了 `--display_data=true` 后日志频繁出现 `[slow_frame]`"
    **原因**:Rerun 显示本身占掉了帧预算。实测双夹爪 + 头显(四路触觉、两路腕相机、两只眼),
    JPEG 压缩后每帧 13.2 ms,不压缩 3.1 ms——30 fps 的预算只有 33.3 ms,压缩就占了 40%,
    这还没算相机读取和位姿计算。

    **先看 `[slow_frame]` 那行末尾的 `top_obs=`**:是某个传感器慢,还是显示贵,两者在超时
    数字上看着一样,解法却相反。

    **解决**:两个默认值本来就是快的那个(`--display_compressed_images=false`、
    `--display_image_every_n=1`),先确认没被改过。仍然超时再把 `--display_image_every_n`
    调大——相机画面刷新变稀,`tcp.*` 和 `gripper.pos` 等标量仍是全速。这是最后手段,
    因为它是唯一会改变操作员所见内容的选项。

??? failure "录制中途停下,提示 `Device lost mid-recording`"
    **原因**:某路相机或夹爪编码器**掉线**了(线松、hub 掉电、USB 口接触不良)。
    采集检测到之后会主动停止,**已经录到的部分会存盘**——这是有意为之,好过继续往数据集里
    写编造的值。
    **解决**:掉线那一集的最后一两秒是重复的旧值,**建议弃用这一集**。检查线缆与 USB 口
    (反复出现且换口无效时见 [USB 带宽不够](#usb-bandwidth)),然后用 `--resume`
    在同一数据集上续录。见 [5.2 录制](05-data-collection.md#52)。

??? failure "没有独显的机器上,录制一开始就报编码器打不开"
    **原因**:这台机器没有 NVIDIA 驱动,却在用 GPU 硬件编码器。
    **解决**:改用 CPU 编码器,并把流式编码关掉——

    ```bash
    lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false
    ```

    没有 GPU 的主机为什么要关流式编码,见
    [没有 NVIDIA GPU 的主机怎么录](05-data-collection.md#no-gpu)。

??? failure "编码器跟不上、日志出现丢帧告警"
    **原因**:实时编码队列满时会丢最旧帧(不阻塞采集循环)。
    **解决**:增大 `--dataset.encoder_threads`、用 `--dataset.vcodec=auto` 硬件编码、
    或调 `--dataset.encoder_queue_maxsize`。见 [5.4 录制选项](05-data-collection.md#54)。

??? failure "夹爪开度不对 / 闭合时不为 0"
    **原因**:编码器零点漂移或未标定。
    **解决**:重新标定零点:
    ```bash
    python third_party/taccap-gripper/python/examples/calibrate.py left    # 或 right
    ```
    该命令同时重标零点与行程上限,两者都会写入 MCU flash。见 [4.1 夹爪标定](04-calibration.md#41)。

??? failure "标定报 `encoder-max calibration needs command set >= V2.1`"
    **原因**:这台夹爪的固件命令集低于 V2.1(即 leader < 1.2.0),不支持行程标定。
    `calibrate.py` 会**原样退出,不改动任何东西**——不会留下"标了零点但没标行程"的半成品。
    **解决**:刷固件。SDK 自 0.1.7 起把已发布镜像放在
    `third_party/taccap-gripper/firmware/`,不再需要固件源码:
    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py \
        tc-gu-01-master.bin --side left
    ```
    **先升 SDK 再刷固件**(刷写要用 0.1.7 及以上的 SDK),镜像**按角色选**——
    看固件 SN 末位 `m`/`s`,不是看左右手。完整步骤与风险见
    [固件 OTA 升级](versions.md#ota)。刷完回来重跑 `calibrate.py`。

??? failure "刷固件时提示到某个目录下找 `.bin`,但该目录不存在"
    **原因**:镜像路径写法不对。镜像随 SDK 附带在
    `third_party/taccap-gripper/firmware/`,不需要自己拼目录。
    **解决**:**镜像名直接写文件名**——`tc-gu-01-master.bin` / `tc-gu-01-slave.bin`,
    脚本会自己去 SDK 的 `firmware/` 里找,在哪个目录运行都一样。见
    [固件 OTA 升级](versions.md#ota)。

??? failure "腕相机/视触觉打不开、`video ... busy`"
    **原因**:相机由外部相机服务占用,或用户不在 `video` 组。
    **解决**:确认相机服务状态;把用户加入 `video` 组
    (`sudo usermod -aG video "$USER"`,重登生效)。

### USB 带宽不够 {#usb-bandwidth}

!!! danger "双夹爪装机第一天就该量一次,别等到相机打不开"
    这是双夹爪现场**最常见**的一类故障,而且它在插线的那一刻就已经决定了——决定它的是
    **两只夹爪插在了哪几个物理口上**。量法见下面这条的「先确认是不是带宽」,
    装机时顺手跑一遍 `lsusb -t`,比出问题后从序列号、线缆、驱动一路找回来快得多。

??? failure "某一路相机打不开(`Cannot open camera N`),而且每次挂的不是同一路"
    **原因**:**USB 带宽不够**,不是硬件坏了。每个 UVC 相机在打开期间都要**独占预留**一份
    等时(isochronous)带宽,而这份预算是**按 USB 2.0 总线算的**:一条总线 480 Mbit/s,
    其中约 **384 Mbit/s** 能给等时传输。超出预算时,**最后打开的那一路失败**——而谁最后打开
    每次都可能不同,所以故障看着会"飘"。设备节点存在、`lerobot-find-cameras` 也列得出来,
    只是打不开。

    !!! warning "插蓝色 USB 3 口没有用"
        触觉与腕相机都是 **USB 2.0 设备**,插进 USB 3 口也还是落在那个控制器的 USB 2.0 总线上,
        用的是同一份预算。

    **先确认是不是带宽**——数一数每条总线上挂了几个相机:

    ```bash
    lsusb -t
    ```

    输出里**每一行 `480M` 的 `root_hub` 就是一份预算**。双夹爪一共 **六个**相机
    (四路触觉 + 两路腕相机),再加上笔记本自带的摄像头;六个挤在一条总线上**很可能超**
    (实测见下)。**两条 `480M` 总线各挂三个**则很宽裕。

    启动时在另一个终端盯着内核日志:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` **不能省**,否则 `grep` 会一直缓冲、看着像卡住。相机打不开的那一刻打出
    `Not enough bandwidth for altsetting N`,诊断到此结束——这一条不是软件能绕过去的。

    **也可以把两半拆开各跑一次**,把"某个相机坏了"变成算术:

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

    两半分别都正常、合起来就失败,就是带宽问题。
    **`enable_tactile=false` 只用于这一步判断,不要拿它录数据**——那样录出来的数据集没有触觉。

    **解决**:先确认腕相机没被从默认的 `MJPG` 改成 `YUYV`(`--robot.wrist_camera_fourcc`)
    ——`MJPG` 正是为让出带宽才设为默认的。仍然超的话,**唯一有效的办法是加一个 USB 主控制器**,
    不是加 hub:Thunderbolt / USB4 扩展坞自带 xHCI 控制器,普通 hub 不带。接上之后把一只夹爪
    插过去,再跑 `lsusb -t` 确认多出来的是**一行新的 `480M` root_hub**,而不是又一层嵌套 hub。

    在装上第二个控制器之前,可以先**关掉腕相机**录:触觉、位姿、夹爪开度都还在,但数据集里
    就没有 `{side}_wrist` 这个键了——**开录前就要定下来**,不要一半有一半没有,那是两套不兼容
    的观测结构。

??? failure "想知道到底超了多少"
    **六个相机能不能挤在一条总线上,没有一个放之四海的答案**——每个设备申请多少,不同批次
    可能不同,所以**以这台机器实测为准**,别照搬别处的结论。这也正是它容易被当成
    "硬件时好时坏"的原因。

    一台实测超预算的双夹爪主机(只有一条 `480M` 总线)量到的是:

    | 开哪些相机 | 预留 | 结果 |
    |---|---|---|
    | 只开四路触觉(两侧 `_enable_wrist_camera=false`) | 242 Mbit/s | 正常 |
    | 只开两路腕相机(`--robot.enable_tactile=false`) | 够用 | 正常 |
    | 六个全开(默认) | 6 × 60.4 = 362 Mbit/s | **失败** |

    `altsetting 6` 是每微帧 944 字节,即**每枚触觉 60.4 Mbit/s**;而 320x240 YUYV@30 的实际
    数据量只有约 37 Mbit/s——设备申请的比实际用的多,腕相机更多。362 对 ~384,**就差在边上**,
    所以每次挂的不是同一路、看着像偶发。

    自己读这些数字:

    ```bash
    # I:* 是当前生效的 altsetting;类名在这个文件里是小写的 (video)
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    每个 video 接口的 `Alt=` 与它 `E:` 行的 `MxPS=` 给出预留量(`MxPS × 8000 × 8` bit/s),
    **按总线求和**再和 ~384 Mbit/s 比。设备申请多少写在**固件的 UVC 描述符**里,
    采集程序改不了——所以结论只能是"这条总线放不下这几个相机",而不是某个参数没调对。

??? failure "以下三条看着像解法,实际没用"
    - **换一个物理 USB 口**。相机是 USB 2.0 设备,**同一个控制器上的所有口共用一条总线**。
      要换就得换到**另一个控制器**上(见上面那条)。
    - **调低 `--robot.tactile_fps`**。它只节流 Python 侧的读取循环;传感器 SDK 的取流接口
      不接受 fps 参数,**USB 上的流没有变**。
    - **`uvcvideo quirks=128`**(`UVC_QUIRK_FIX_BANDWIDTH`)。实测无效:它按
      `宽 × 高 × bpp` 重算预留量,而压缩格式没有有意义的 bpp——对超得最多的 MJPEG 腕相机
      无从下手。

## 数据与磁盘

??? failure "采集变慢 / 磁盘写满"
    **原因**:双夹爪多相机的原始视频数据吞吐可达约 280 MB/s;实时编码后的实际磁盘写入量取决于分辨率、画面内容、编码器与码率。目标盘空间不足、持续写入性能不足或编码线程跟不上都会导致异常。
    **解决**:先用少量 episode 实测编码后体积和丢帧情况,再规划批量采集;定期检查 `df -h` 与数据集目录大小。详见[数据管理与命名](data-management.md#storage-planning)。

---

仍未解决?请带上完整报错、自检输出(`scan_grippers` 的 side / role / firmware_sn)、版本信息和复现命令,按[版本与支持](versions.md#support)中的渠道反馈。
