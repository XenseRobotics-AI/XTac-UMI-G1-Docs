# 背包版:XTac-UMI 数采背包

这一页是背包版的入口:第一次拿到设备照「首次部署清单」走一遍,之后每天开工只看「日常采集速查」。读完能独立完成从开机到导出数据集的一次采集。

## 这一版是什么 {#overview}

- 背包即主机:采集软件 XTac-UMI Collector 跑在背包里,采集、回放与 LeRobot 导出全部在背包自己的控制台里完成;平板、手机或 PC 只当浏览器用,不需要单独的数采主机。
- 箱内:Pico4 Ultra 企业版头显 + 手柄 ×1、XTac-UMI G1 ×2、Type-C 线 ×2、数采背包 ×1、12V3A 36W 适配器 ×1、充电宝 ×2(Type-C 输出 5V3A / 12V3A);开箱核对见[开箱、接线与供电](unbox-connect.md#unbox)。
- 产出:每条录制一个 MCAP 原始记录,同步记录左右鱼眼、四路视触觉、头显与双追踪器 6DoF 位姿、夹爪开合度;导出按任务做,[`LeRobot 数据集`](projects-export.md#lerobot) 与 [`mcap`](projects-export.md#mcap) 两种格式并列,可下载成压缩包,也可上传到事先配置好的上传后端。
- 操作:夹爪按键开录、停录,指示灯反馈状态,单人可完成整套采集。
- 适合:规模化数采工厂与采集团队;软件闭源交付,支持轻量二次开发。需要接自己的 x86 工作站、完全走 LeRobot 框架的另一种形态见 [PC 版](../pc/index.md);两种配置的差异见[产品线与配置对比](../product/editions.md)。

产品定位与控制台介绍见[认识数采背包](../product/backpack.md);[背包接口](unbox-connect.md#ports)、[适配器](unbox-connect.md#adapter)与[充电宝](unbox-connect.md#powerbank)两种接线方式、[机身标签](network.md#label)在各自的操作页里。

## 首次部署清单 {#first-deploy}

开始前读一遍[安全与合规](../product/safety.md)。下面每一步的详细操作在各自的页面里,本页只说做什么、在哪做。

1. 头显配置:把 Pico OS 升到 5.15.5.U 以上并[开启开发者模式、把灭屏与休眠设为永不](../common/pico4.md#pico-system);两只追踪器按「左奇右偶」[配对到头显](../common/pico4.md#pico-tracker-bind)并切到独立追踪模式;[安装 XTac-UMI XR](../common/pico4.md#pico-app)。
2. 接线与供电:[顺序固定](unbox-connect.md#order)夹爪 → 头显 → 背包上电,左右夹爪分别接 UMI-L / UMI-R。供电二选一:[适配器供电](unbox-connect.md#adapter)时头显用 Type-C 线接背包 PICO 口;[充电宝供电](unbox-connect.md#powerbank)时头显先接二合一 Type-C 线,充电口接充电宝、数据口接背包 PICO 口,另一只充电宝给背包供电。夹爪的连接与供电要求见[夹爪按键、指示灯与序列号](../common/gripper.md#power)。
3. 连上背包:平板或手机连[背包热点](network.md#softap) `xense-<序列号后 6 位>`(如 `xense-e3d202`,密码印在机身标签),浏览器打开 `http://192.168.44.1` 或[设备名](network.md#mdns) `http://xense-<序列号后 6 位>.local` 进入控制台。iOS 必须敲全 `http://` 前缀;热点只有 5 GHz 频段,连接的设备要支持 5 GHz。
4. [头显连背包](unbox-connect.md#pico-link):戴上头显打开 XTac-UMI XR,勾选 USB 网络点连接,背包会自动在 USB 链路上建网(地址 `192.168.58.1`),不用手填。界面与连接状态见 [Pico4 头显与追踪器](../common/pico4.md#pico-toolkit-ui)。
5. 选[采集模式](system.md#capture-mode):控制台 → 系统 → 采集模式,按实际接了什么选 双爪 / 双爪 + 头显 / 单爪 / 单爪 + 头显 / 仅头显。单爪的左右侧由设备按实际连接自动判定;录制中不能切换。
6. 可选:控制台 → 系统 → [上传配置](system.md#upload),新建一档上传后端并填好凭据(获取步骤在同一节)。新建项目时可以绑定它,之后该项目导出选「上传到远端」默认走这档配置;凭据只在这一页填一次,导出窗口里不再重复填。

## 日常采集速查 {#daily}

1. 开机:[先接夹爪、再给背包上电](unbox-connect.md#order);站到作业位、面朝作业方向,再打开 XTac-UMI XR 并连接——[世界坐标系原点](../common/pico4.md#pico-frame)以首次启动 XR 时的位置为准。
2. 打开控制台:连[背包热点](network.md#softap),浏览器打开 `http://192.168.44.1`。
3. [选项目 / 任务](monitor-record.md#project-task):监控页底部两个下拉,末项「新建项目…」「新建任务…」可就地新建。任务的「任务指令 / prompt」必填,写完整的自然语言指令(如 *open the lid of the container, take out the chips, place them into the box*);目标条数与目标时长可留空。
4. [实时监控里确认](monitor-record.md#checks):六路相机画面(左右鱼眼、左右爪各两路视触觉)与头显双目都有图像,鱼眼画面清晰——旋钮容易被误碰跑焦;位姿视图跟手动,左右追踪器没有接错;夹爪开合度随手部动作变化,闭合时约 0.02 rad、归一化为 0。录制按钮未就绪时会给出原因(未选项目 / 任务、Pico 位姿或时钟未就绪),完整的[开录门槛](monitor-record.md#record-gates)还包括磁盘占用与任务目标条数。
5. [用夹爪按键录制](monitor-record.md#record):右爪长按开始(灯转绿呼吸),做完一条左爪长按停止(白闪一次表示已保存),左爪双击删上一条。按键由背包端状态机接管,浏览器不在线也能录;完整手势表见[按键](../common/gripper.md#buttons),灯语见[指示灯](../common/gripper.md#leds)。

采集全程不要重启 XTac-UMI XR:重启会重设世界坐标系原点,同一数据集内的位姿参考系就不一致了,见[启动与坐标系对齐](../common/pico4.md#pico-frame)。

## 录完之后 {#after}

- 回放与检查:控制台 → 项目,层级为 项目 → 任务 → 录制条目,每条显示时长、帧数、数据量与质量标注。点「回放」在网页里[流式回放](playback.md),可拖进度条;有问题的条目就地[删除](projects-export.md#delete),会连同其 MCAP 与 H264 转码文件一起删,不可恢复。
- 导出:选定任务点「导出」打开[导出对话框](projects-export.md#export),先自动预检数据完整性——未通过时逐条列出阻塞项,删掉或修好后重新预检;通过后先选「导出去向」,再选「导出格式」:
    - 去向二选一:「下载到设备」先在背包上打包,完成后用按钮把[压缩包](projects-export.md#export)取回;「上传到远端」从下拉里选事先配置好的[上传后端](system.md#upload),跟随项目默认、临时改用另一档或就地新建。
    - 格式二选一:[`LeRobot 数据集`](projects-export.md#lerobot) 与 [`mcap`](projects-export.md#mcap) 是平级的,同一个任务可以先出一种、之后再出另一种,两份产物同时保留;项目可设默认格式,单次导出能临时改。
    - 上传完成后**默认保留本地文件**,要腾空间就在上传前勾选清理,或之后随时[归档](projects-export.md#archive);归档只留记录、清掉原始文件,清理时会保护还没用过的格式。

## 常见问题 {#faq}

- [连不上控制台](troubleshooting.md#connect):先确认平板或手机支持 5 GHz,连的是这台背包的热点(后 6 位与机身标签一致),地址带了 `http://` 前缀;部分安卓机打不开 `.local` 名,改用 `http://192.168.44.1`;偶发无响应时给背包重新上电。
- [追踪器丢失](troubleshooting.md#tracker):追踪精度不准或头显断开时,XTac-UMI XR 与监控页都会有图标提示;先看追踪器是否亮蓝灯、[配对](../common/pico4.md#pico-tracker-bind)是否正确。
- [开录被拒](troubleshooting.md#record):录制盘已用达到 80% 时拒绝开始录制,提示「录制盘已用 N%……已拒绝开录」;先把已采数据上传或下载走,再[归档](projects-export.md#archive)腾空间,或删掉不要的条目。
- [回放与实时预览不能同时进行](playback.md):回放被拒时,先关掉其他标签页或其他设备上打开的实时监控。
- 录制进行中,切换采集模式、夹爪标定、固件升级、系统更新等[系统设置](system.md)操作都会被拒绝,先停止录制。

## 版本 {#version}

本页按 XTac-UMI Collector 0.3.16 编写,各组件的[版本基线](versions.md#baseline)以控制台系统页显示为准,升级见[升级与 OTA](update.md);文中的序列号只是示例。
