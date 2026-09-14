# 术语表与支持

查表用的附录:两种形态共用的术语、反馈渠道与相关仓库。PC 版的 `RobotConfig` 配置项与 SDK 入口在 [RobotConfig 与 SDK](../pc/reference.md);报错见 PC 版的[故障排查](../pc/troubleshooting.md)或[背包版的故障排查](../backpack/troubleshooting.md)。

## 术语表 {#glossary}

| 术语 | 含义 |
|---|---|
| **XTac-UMI G1** | 手持式 UMI 数采夹爪,两种形态共用的传感器载体;见[认识 XTac-UMI G1](../product/g1.md) |
| **数采背包** | 背包版的采集单元:RK3588 计算节点,夹爪与头显都接到它上面,XTac-UMI Collector 在它上面运行;正式名 XTac-UMI 数采背包,见[认识数采背包](../product/backpack.md) |
| **XTac-UMI Collector** | 跑在数采背包上的采集软件,接入相机、夹爪 MCU 与头显位姿,负责录制、回放、导出与设备管理;版本基线 0.3.16,以设备系统页显示为准 |
| **控制台** | Collector 的浏览器界面,平板、手机、电脑连上背包后打开;实时监控、项目、系统等页面都在里面 |
| **项目 / 任务 / episode** | 背包版的数据组织层级:项目下建任务,任务带 LeRobot 语言指令,每次开录到停录是一条 episode |
| **MCAP** | 背包版每条 episode 的原始记录格式,按 topic 存相机、编码器、IMU、位姿与事件;导出 LeRobot 时从它转换 |
| **OTA bundle** | 背包版 Collector 的升级包(`.tar.zst`),在控制台 系统 → 系统更新 页上传、校验、应用并重启,可回滚到上一版本;PC 版夹爪固件的 OTA 见[固件升级](../pc/versions.md#ota) |
| **SoftAP** | 数采背包自建的常驻 WiFi 热点,SSID `xense-<序列号后 6 位>`,只有 5 GHz,网关固定 `192.168.44.1`;不依赖现场网络的兜底入口 |
| **TacCap** | 包名 `xense.taccap`、设备类型 `taccap_gripper` 与背包机身标签里的名字(Tactile Capture);产品名为 XTac-UMI G1 |
| **UMI** | Universal Manipulation Interface,手持式主夹爪数采范式 |
| **Leader / Follower** | 主夹爪 / 从夹爪;序列号 patch `m` = leader,`s` = follower |
| **V2.1**(固件) | 固件的**命令集**版本——实现了哪些命令,不是构建号(构建号是 leader `≥ 1.2.0` / follower `≥ 1.1.0`,更高版本同样支持),也不是帧格式(帧格式为 V1.8)。行程标定命令由 V2.1 引入 → [三套编号](../pc/versions.md#v21) |
| **单左双右** | 4 位序列号最后一位:奇→左,偶→右;夹爪、传感器与追踪器都按这条规则,见[序列号与左右识别](gripper.md#sn) |
| **GSPS** | 视触觉传感器(左右指各一),序列号 `GSPS01...` |
| **XC** | 腕部 UVC 相机,序列号 `XC...` |
| **XTac-UMI XR** | 装在 Pico4 头显上的 VR 客户端 APP(原名 XenseVR-Toolkit),把头显与追踪器位姿送到采集单元,启动瞬间建立世界坐标系;见 [Pico4 头显与追踪器配置](pico4.md) |
| **XenseVR PC Service / 运行时** | 接收头显位姿的服务,是 XTac-UMI XR 在采集单元这一端的对端(服务名没跟着 APP 一起改):PC 版是数采主机上的守护进程,要手动启动;背包版内置在 Collector 里 |
| **tcp** | Tool Center Point,末端执行器位姿(`tcp.x/y/z` + 6D 旋转 `r1..r6`),坐标系见[坐标系](coordinates.md) |
| **6D rotation** | 旋转矩阵 R(世界 ← 本体)的**前两列**:`r1..r3` = 第一列 = 本体 X 轴在世界系下的方向,`r4..r6` = 第二列 = Y 轴;第三列为叉积,可算回 → [约定详解](../pc/recording.md#53) |
| **shifted-frame** | 移位帧配对:t-1 观测配 t 动作 |
| **self-driven** | 自驱动:设备自身产出观测与演示动作,无独立遥操端 |

## 支持与反馈 {#support}

遇到问题:

1. 先查故障排查:PC 版见[故障排查](../pc/troubleshooting.md)(含常见问题),背包版见[背包版故障排查](../backpack/troubleshooting.md)。
2. 文档内容、链接或示例问题提交到[文档仓库 Issues](https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs/issues)。
3. 硬件、固件、标定材料或返修问题走设备交付 / 售后渠道,并提供设备 SN。

反馈时请附带:

- 完整报错与相关日志,不要截断。
- 设备身份:背包版抄控制台 系统 → 设备信息 页的设备 SN、采集单元版本与每只夹爪的 SN / 固件版本;PC 版给 `scan_grippers` 的 side / role / firmware_sn 输出和[如何查版本](../pc/versions.md#check-versions)里那条命令的输出。
- 复现步骤、完整命令或控制台操作、单夹爪 / 双夹爪、是否启用追踪器。
- 涉及相机或硬件装配时,附设备连接和异常画面照片。

## 参考资料

| 资源 | 地址 | 说明 |
|---|---|---|
| 数采主仓库 `xense-taccap-lerobot` | <https://github.com/XenseRobotics-AI/xense-taccap-lerobot> | PC 版采集软件,附带设备说明与 CHANGELOG |
| 夹爪 SDK `TacCap-Gripper` | <https://github.com/XenseRobotics-AI/TacCap-Gripper> | 子模块 `third_party/taccap-gripper/`;SDK 文档在 `docs/` |
| 追踪器 PC 服务 `XenseVR-PC-Service` | <https://github.com/XenseRobotics-AI/XenseVR-PC-Service> | 不是子模块,以 `.deb` 安装到 `/opt/apps/roboticsservice`,见[一键安装](../pc/install.md#24) |
| 视触觉传感器 SDK `xensesdk` | <https://github.com/XenseRobotics/xensesdk> | [文档站](https://xensedoc.readthedocs.io/en/latest/) |
| 本手册源码 | <https://github.com/XenseRobotics-AI/XTac-UMI-G1-Docs> | Issues 见上节 |

## 本手册范围

本手册覆盖从数采夹爪硬件到数据落盘的链路:背包版到 MCAP 记录与 LeRobot 导出,PC 版到 `LeRobotDataset`;模型训练、推理、部署不在范围内,见对应工程的独立文档。
