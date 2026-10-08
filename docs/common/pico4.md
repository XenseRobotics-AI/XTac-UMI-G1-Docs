# Pico4 头显与追踪器配置 {#34}

- **组成**：Pico4 Ultra 企业版配套的独立运动追踪器装在夹爪顶部提供 6-DoF 位姿，头显上的 XTac-UMI XR（VR 客户端 APP）把位姿送到采集单元。
- **两种形态**：只差下表三处，分「背包版 / PC 版」标签页写。

| | 背包版 | PC 版 |
|---|---|---|
| 头显接到哪 | 数采背包的 `PICO` 口，**只能有线** | 数采主机的 Type-C 口（USB 有线共享网络），或与主机接同一 WiFi |
| 位姿服务在哪跑 | XenseVR 运行时内置在 XTac-UMI Collector，背包开机即在 | 数采主机上的 [XenseVR PC Service](../pc/host-setup.md#35)，每次采集前手动启动 |
| APP 里怎么连 | **不勾选**「USB网络」，「PC IP」留空 → 点「连接」（默认连 `192.168.100.1`） | 有线：**勾选**「USB网络」→ 点「连接」（默认连 `192.168.58.1`）；WiFi：不勾，在「PC IP」填数采主机 IP |

- **出厂已配置**：开发者模式、电源策略、APP、追踪器绑定、追踪模式断电不丢（恢复出厂或换头显才重做），从[网络连接](#pico-network)开始。
- **每次采集**：接线、短按追踪器电源键到蓝灯亮、在 APP 里[连上](#pico-toolkit-ui)、[启动对齐](#pico-frame)。

## 开箱与系统更新 {#pico-unbox}

1. 开箱：撕掉前面板保护贴、控制器胶条与镜片贴纸，长按电源键开机。

    ![前面板传感器条上的保护贴](../assets/pico4/unbox-film.webp){ width="440" }

2. 更新系统：出厂系统偏低，新机必须先升级，再配追踪器、装 APP。连有网的 WiFi，进 设置 → 系统升级，点「下载并安装」升到 Pico OS 5.15.5.U 或更高，安装包约 1.9 GB。

    ![系统升级到 5.15.5.U](../assets/pico4/system-update.webp){ width="560" }

## 系统设置：开发者模式与电源策略 {#pico-system}

1. 开启开发者模式：设置 → 关于本机 → 连续点击「软件版本号」数次（用手柄时对着它连扣食指扳机）→ 左侧出现「开发者选项」→ 打开 USB 调试。

    ![连续点击软件版本号](../assets/pico4/devmode-tap-version.webp){ width="480" }

    ![开发者选项 → 打开 USB 调试](../assets/pico4/devmode-usb-debug.webp){ width="480" }

2. 关闭休眠与灭屏：开发者选项 →「企业设置」→ 系统设置 → 电源策略（仅企业版有，消费版调不到「永不」）。出厂灭屏 30 秒、休眠 5 分钟、不显示电量图标，按顺序改：
    1. 系统休眠 = 永不；
    2. 灭屏（息屏）= 永不；
    3. 最下方电量及充电状态图标设为「常驻显示」，采集中可看电量。

    ![电源策略最终设置](../assets/pico4/power-step4-final.webp){ width="480" }

!!! warning "先休眠、后灭屏，顺序不能反"
    灭屏时间受系统休眠约束，休眠仍为默认值时，灭屏的「永不」会被钳回有限值，看似设好实际没生效。改完退出设置再进来，确认两项都是「永不」。

不关的话，采集间隙灭屏/休眠（摘下头显放置也会触发）会挂起或杀掉 XTac-UMI XR，而重启它会重设世界系（见[坐标系对齐](#pico-frame)）。

## 安装 XTac-UMI XR {#pico-app}

APK 文件名形如 `XTac-UMI-XR-<版本>.apk`，当前版本 0.3.2，用头显文件管理安装：

1. USB 线连头显与电脑，把 APK 拷到头显的 `Download/` 目录。

    ![把 apk 拷进 Pico 的 Download 目录](../assets/pico4/install-step1-copy.webp){ width="480" }

2. 戴上头显，任务栏点「文件管理」，进「Download」文件夹。

    ![文件管理 → Download](../assets/pico4/install-step2-filemanager.webp){ width="480" }

3. 点 APK，在「要安装此应用吗？」里选「安装」，装好后「资源库」里出现 XTac-UMI XR。

    ![确认安装](../assets/pico4/install-step3-confirm.webp){ width="480" }

电脑装了 adb（Android platform-tools）时，打开 USB 调试、「USB 连接」选「传输文件」后可一键安装：

```bash
adb devices                          # 应列出头显
adb install XTac-UMI-XR-0.3.2.apk    # 换成拿到的那份
```

## 网络连接 {#pico-network}

追踪数据送往采集单元的 XenseVR 位姿服务。背包版**只能走有线**；PC 版默认有线，WiFi 只作临时调试。Type-C 直连链路独占，延迟稳定。

!!! warning "PC 版的无线只用于临时调试，不要用来正式采集"
    WiFi 要和现场设备抢信道，位姿延迟到达，轻则卡顿、抖动，重则丢帧；录制中看不出，事后难与别的原因区分，整批只能重采。

两种形态都先在头显里设好 USB：

- **设置路径**：设置 → 开发者选项 → 打开「USB 调试」→「USB 连接」选「传输文件」。
- **拔插后复查**：拔插 USB 会掉回默认值；选不了就重启 Pico。

![USB 连接选择传输文件](../assets/pico4/usb-shared-network.webp){ width="520" }

=== "背包版"

    1. 头显连接线（Pico → Pack，双 Type-C）从头显侧面 Type-C 口接到背包 `PICO` 口；适配器与充电宝供电都这样接，见[开箱、接线与供电](../backpack/unbox-connect.md#order)。背包版不支持头显走 WiFi。
    2. 背包开机（位姿服务随之启动）。
    3. 打开 XTac-UMI XR，不勾选「USB网络」，「PC IP」留空（默认连背包 `192.168.100.1`），点「连接」。

=== "PC 版"

    1. 电脑端先启动服务 `runService.sh`（见[启动 XenseVR PC Service](../pc/host-setup.md#35)），否则 APP 连不上。
    2. Type-C 线直连头显与数采主机，头显给主机分配 IP。
    3. 打开 XTac-UMI XR，勾选「USB网络」，点「连接」，自动连数采主机（`192.168.58.1`），网络状态变为「连接成功」（见[打开 App 后的界面](#pico-toolkit-ui)）。

    走 WiFi：头显与数采主机接同一网络，不勾选「USB网络」，在「PC IP」填主机 IP，再点「连接」。

    !!! warning "走有线时，关掉数采主机的 WiFi"
        有线共享网络会与主机其他网络（尤其 WiFi）抢路由 / 网卡，致追踪器连不上或位姿不稳；只保留头显共享网络。

## 绑定运动追踪器到头显 {#pico-tracker-bind}

首次使用或更换追踪器后，须先把 PICO Motion Tracker 绑定到这台头显，否则追踪模式选不到它，XTac-UMI XR 与采集单元也发现不了其 SN。

配对前：

- 手机扫追踪器背面二维码得到完整 SN，按单左双右（见[序列号与左右识别](gripper.md#sn)）装夹爪。
- 红框里的六位数即配对后「我的追踪器」列表里的编号（如 `Tracker 150311`）。

| 扫这里 | 扫出来是这样 |
|---|---|
| ![追踪器背面的二维码](../assets/pico4/tracker-sn-qr.webp){ width="300" } | ![左追踪器的扫描结果](../assets/pico4/tracker-sn-left.webp){ width="320" }<br>`G` 前是 `1`，单数 → 装左夹爪 |

1. 从资源库打开「体感追踪器」App，点主界面右上角图标进入配对界面。

    ![右上角进入配对界面](../assets/pico4/tracker-pair-entry.webp){ width="440" }

2. 长按追踪器电源键约 6 秒，至指示灯蓝红交替闪烁（蓝牙配对状态）。
3. 点「开始配对」。成功时头显响一声，追踪器出现在「我的追踪器」列表，显示电量与编号（如 `Tracker 150399`）并标「已连接」。
4. 两只夹爪各绑一枚，列表顶部应显示「已配对 2 个」。

    ![体感追踪器 App：已配对 2 个](../assets/pico4/tracker-bind.webp){ width="440" }

!!! warning "开机是短按，配对才要长按"
    日常开机短按到蓝灯亮，这不是配对状态，App 扫不到；首次绑定要长按约 6 秒到蓝红交替闪烁。

绑定存在头显上，日常开关机、重启 APP 不用重绑；换追踪器、换头显、恢复出厂或配错后要重绑：先在列表项右侧 ⓘ 里解除配对，再绑新的。

!!! warning "独立追踪模式下，追踪器必须在头显视野内"
    被身体、桌沿或另一只手久挡会丢跟踪（位姿跳变或卡住）。

### 读取追踪器 SN {#pico-tracker-sn}

- **作用**：定左右（`G` 前一个数字单左双右），也是采集单元识别追踪器的依据。
- **从二维码取**：完整 SN（形如 `PC2310MLL3200496G`）取自追踪器背面二维码；「体感追踪器」App 只显示短编号（如 `Tracker 150399`），XTac-UMI XR 的 Network 面板的 SN（如 `PA9410MGL…`）是头显自己的。

=== "背包版"

    SN 只认二维码，没有命令行接口。连上后在控制台「实时监控」页的位姿视图里逐个摇晃夹爪，确认左右没装反。

=== "PC 版"

    用 PC Service 的 Python 接口读：

    ```python
    import xensevr_pc_service_sdk as xrt

    xrt.init()
    print(xrt.get_motion_tracker_serial_numbers())   # 例:['PC2310MLL3200496G', ...]
    ```

    - **前提**：追踪器已绑定开机 → XTac-UMI XR [「连接成功」](#pico-toolkit-ui) → 主机已启动 [PC Service](../pc/host-setup.md#35)，少一步返回空列表。
    - **钉住 SN**：可用 `--robot.tracker_serial=<SN>` 跳过[自动匹配](../pc/host-setup.md#33)；写配置前逐个摇晃夹爪确认 SN 对应哪只手。

## 追踪模式 {#pico-tracker}

绑定后在头显打开「体感追踪」→ 设置 →「追踪模式」，选「独立追踪」并点「确定」，该行应显示「独立追踪」。出厂默认「全身动捕」追人体，「独立追踪」追固定了追踪器的物体。

![选独立追踪并确定](../assets/pico4/tracker-mode2-pick.webp){ width="480" }

## 打开 App 后的界面 {#pico-toolkit-ui}

戴上头显，从资源库打开 XTac-UMI XR，进入「XENSE XR 控制台」，连接只用左侧这几项：

| 项目 | 说明 |
|---|---|
| 追踪模式 | 应为「独立追踪」，否则回[追踪模式](#pico-tracker)重设 |
| Pico硬件版本 | 应为「企业版」 |
| 网络状态 | 「连接成功」前采集单元读不到位姿 |
| USB网络 | PC 版有线勾选，APP 自动连数采主机（`192.168.58.1`）；**背包版不勾选** |
| PC IP | 背包版留空（默认连背包 `192.168.100.1`）；PC 版 WiFi 填数采主机 IP，有线不填 |
| 连接 / 断开 | 点「连接」，连上后按钮变为「断开」 |

=== "未连接"

    刚打开时网络状态为「未连接」，按上表设好后点「连接」。

    ![XTac-UMI XR 控制台：未连接](../assets/pico4/xr-console-idle.webp){ width="560" }

=== "连接成功"

    「连接成功」即可开始采集。

    ![XTac-UMI XR 控制台：连接成功](../assets/pico4/xr-console-connected.webp){ width="560" }

两种形态的差别：

=== "背包版"

    - **面板图标**：追踪器精度不准或与背包断开时出现。
    - **核对位姿**：控制台「实时监控」页位姿视图应有头显与左右爪位姿。
    - **录制按钮未就绪**：给出原因，两者可同时出现：
        - 「Pico 未就绪」：头显未连接或连接超时、位姿数据或时钟同步缺失或超时；
        - 「Tracker 未就绪」：追踪器不在视野内或静止超过 5 秒。
    - **录制中断开**：立即停止这条录制，见[录制中头显断联](../backpack/monitor-record.md#pico-disconnect)。

=== "PC 版"

    - **一直连不上**：多半是[网络](#pico-network)没接好或电脑 WiFi 没关。
    - **确认主机收到数据**：头显显示连上不等于主机收到，用 `/opt/apps/roboticsservice/` 的 `ConsoleDemo` 或 `python -m lerobot.robots.taccap_gripper.check_tracker` 确认读到带 `sn` 的位姿。

## 启动与坐标系对齐 {#pico-frame}

- **启动**：面朝机器人正前方启动 XTac-UMI XR，再在 APP 里[连上](#pico-toolkit-ui)；启动瞬间冻结世界系原点与方向。
- **世界系定义**：轴向、原点、冻结规则与示意图见[坐标系](coordinates.md)，所有位姿以它为参考。

!!! danger "启动时面朝机器人正前方；分集之间不要重启 XTac-UMI XR"
    - **面朝正前方**：世界系 X 轴才对齐机器人正前方，站位不影响。
    - **不要重启**：重启后原点/方向会变，同一数据集内位姿参考系不一致。
