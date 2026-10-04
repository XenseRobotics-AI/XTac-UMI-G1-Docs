# 产品线与配置对比

XTac-UMI 提供两种配置，使用同一套 XTac-UMI G1 夹爪与 Pico4 Ultra 企业版头显，采集到的数据定义一致：

- **背包版**：数采背包完成全部采集，平板浏览器即控制台，开箱即用，适合规模化现场采集；采集软件不开源。
- **PC 版（开源）**：夹爪与头显直连您的工作站，基于开源 LeRobot 录制，适合科研与算法团队自由二次开发。

本页对比两者的差别，并列出各自的箱内清单与接线方式。

<div class="grid cards xu-cards" markdown>

-   ![背包版接线：左右夹爪、头显接数采背包](../assets/product/backpack-wiring-adapter.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">背包版</span>

    **XTac-UMI 数采背包**{ .xu-card__title }

    ---

    背包即主机、平板即控制台，夹爪按键录制，数据一键发布到 ModelScope。

    [快速开始](../backpack/index.md){ .md-button .md-button--primary }

-   ![PC 版采集中的 Rerun 实时预览](../assets/dataset/rerun-xtac-umi-g1.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">PC 版</span>

    **XTac-UMI G1 开发套件（开源）**{ .xu-card__title }

    ---

    直连您的工作站，基于开源 LeRobot 录制，采集软件与夹爪 SDK 均开源。

    [快速开始](../pc/quickstart.md){ .md-button .md-button--primary }

</div>

## 两种配置的差别

| | 背包版 · XTac-UMI 数采背包 | PC 版 · XTac-UMI G1 开发套件 |
|---|---|---|
| 计算节点 | 随机附带的 RK3588 数采背包，eMMC 系统盘 + NVMe 数据盘 | 用户自备 x86 工作站，Mamba 源码安装或 Docker 镜像；正式采集要求 NVIDIA GPU，Mamba 路径没有 GPU 也能装，只能降级录制 |
| 操作界面 | 浏览器控制台：实时监控 / 项目 / 回放 / 系统；平板、手机、PC 都只当浏览器 | 终端命令 + Rerun 预览窗口 |
| 接入方式 | 夹爪接 `UMI-L` / `UMI-R`；头显接 `PICO` 口走 USB网络（只能有线）；操作端连背包热点或局域网 | 夹爪 USB 直连主机；头显用 Type-C 线直连主机走有线共享网络（默认有线，WiFi 仅供临时调试）；主机侧跑 XenseVR PC Service |
| 录制控制 | 右爪长按开始、左爪长按停止、左爪双击删除上一条；灯语反馈；控制台也可操作 | `lerobot-record` 命令行参数，`--robot.id` 必填 |
| 采集模式 | 双爪 · 双爪 + 头显双目 · 双爪 + 头显右单目 · 单爪 · 单爪 + 头显双目 · 仅头显双目；每种模式都需要头显提供位姿，当前只有三种双爪类模式的数据能导出 | 单 / 双夹爪，可选头显相机 |
| 原始数据 | 设备上是每条 episode 一个 MCAP 原始记录，保存相机原始的 MJPEG 画面（H.264 硬件编码只用于实时预览）；对外的 `LeRobot 数据集` 与 `mcap` 都是离线导出的产物 | LeRobotDataset v3 直接落盘 |
| 导出与上传 | 任务级导出：先选去向（下载到设备 / 上传到远端），再选格式（`LeRobot 数据集` / `mcap`，两种并列）；下载得到一个压缩包，上传走事先配置好的上传后端（ModelScope、S3、FTP / FTPS、NFS 或 STS），上传后默认保留本地文件，腾空间用随时可用的「归档」 | Hugging Face Hub |
| 升级 | 系统页导入固件包（`.tar.zst`），保留上一版本可回滚；手动应用前先停录，远程下发的更新会等当前条录完再重启 | 拉仓库、跑安装脚本或换镜像 tag；夹爪固件 OTA 用 SDK 脚本 |
| 二次开发 | 不开源，轻量：采集软件以固件包整体交付，定制基于导出的 `LeRobot 数据集` / `mcap` 产物、上传配置与采集设置，不改采集软件本身 | 完全开放：采集软件与夹爪 SDK 以 Apache-2.0 开源，改 Python 代码、接自定义机器人都可以 |
| 适合谁 | 规模化数采工厂、数据采集团队、外部现场 | 研究与算法团队、自建训练管线 |

## 箱内清单与接线 {#kit}

=== "背包版"

    | 物品 | 数量 | 规格与说明 |
    |---|---|---|
    | XTac-UMI G1 主夹爪 | 2 | 左右各一，按序列号末位区分：单数左、双数右 |
    | 主夹爪连接线 | 2 | 双 Type-C，1.5 m，左右各一；夹爪端为锁紧接头，另一端接背包 `UMI-L` / `UMI-R` |
    | Pico4 Ultra 企业版头显 | 1 | 含手柄与运动追踪器，追踪器装在两只主夹爪顶部 |
    | 追踪器充电底座 | 1 | 一拖三 |
    | 头显连接线（Pico → Pack） | 1 | 双 Type-C，1.5 m，头显接背包 `PICO` 口 |
    | 数采背包 | 1 | 计算节点，常开 5 GHz 热点 |
    | 腰带组件 | 1 | 佩戴数采背包 |
    | 12 V 电源适配器 | 1 | 12 V 3 A，线长 1.5 m，接背包 `DC` 口 |
    | 充电宝 | 1 | 20000 mAh，45 W |
    | 12 V PD 电源线 | 1 | 0.3 m，充电宝接背包 `DC` 口 |
    | 平板电脑 | 1 | 6 GB + 128 GB，含保护套，作为控制台 |
    | Type-C 充电插头 | 1 | |

    固定工位用适配器供电，移动采集用充电宝供电：

    <div class="tc-pair tc-pair--wiring" markdown>

    <figure class="tc-shot" markdown>
    ![适配器供电接线：头显接 PICO 口，左右夹爪接 UMI-L / UMI-R，适配器接 DC](../assets/product/backpack-wiring-adapter.webp)
    <figcaption>适配器供电（固定工位）</figcaption>
    </figure>

    <figure class="tc-shot" markdown>
    ![充电宝供电接线：左右主夹爪与头显接数采背包，充电宝接背包 DC 口](../assets/product/backpack-wiring-powerbank.webp)
    <figcaption>充电宝供电（移动采集）</figcaption>
    </figure>

    </div>

    接线步骤见[适配器供电](../backpack/unbox-connect.md#adapter)与[充电宝供电](../backpack/unbox-connect.md#powerbank)；供电与拔线顺序的安全要求见[数采背包与供电](safety.md#backpack-power)；连上背包、打开控制台见[背包热点](../backpack/network.md#softap)。

=== "PC 版"

    | 物品 | 数量 | 规格与说明 |
    |---|---|---|
    | XTac-UMI G1 主夹爪 | 2 | 左右各一，按序列号末位区分：单数左、双数右 |
    | 主夹爪连接线 | 2 | Type-C 转 Type-A，USB 2.0，3 m；夹爪端为锁紧接头 |
    | Pico4 Ultra 企业版头显 | 1 | 含手柄与运动追踪器，追踪器装在两只主夹爪顶部 |
    | 追踪器充电底座 | 1 | 一拖三 |
    | 头显连接线 | 1 | 双 Type-C，1.5 m，头显接主机 |

    选配从夹爪时另附：

    | 物品 | 数量 | 规格与说明 |
    |---|---|---|
    | XTac-UMI G1 从夹爪 | 2 | 左右各一，装在机器人末端 |
    | 24 V 电源适配器 | 2 | 24 V 2.5 A，线长 4.5 m，带磁环，每只从夹爪一个 |
    | 束线带 | 1 | 3 m，沿机械臂整理线缆 |

    主机自备，配置要求见[采集主机配置要求](../pc/install.md#host-spec)。接线只有两处：

    - 两只夹爪各用一条主夹爪连接线接主机的 USB-A 口，双夹爪的六路相机要分挂两条 USB 总线，见 [USB 带宽预算](../pc/host-setup.md#usb-budget)。
    - 头显用头显连接线接主机走有线共享网络，或走 WiFi，见[网络连接](../common/pico4.md#pico-network)。

    上电顺序与第一次采集见 [PC 版一页速通](../pc/quickstart.md#power-on)。

## 常见问题

??? question "两种配置采的数据能混在一起训练吗"

    可以。背包版导出的 `LeRobot 数据集` 和 PC 版直接落盘的都是 LeRobotDataset v3，同一套 `lerobot` 工具都能加载。两边的相机键名与状态字段布局不完全相同，合并前先对照各自的 `meta/info.json`；PC 版的字段见[数据集](../pc/dataset.md#61)。

??? question "背包版能二次开发吗"

    能，但是轻量的。背包上的采集软件闭源，以固件包整体交付和升级；定制基于导出的 `LeRobot 数据集` / `mcap` 产物、上传配置与采集设置，不改采集软件本身。要改采集逻辑、接自定义机器人，选完全开放的 PC 版。

??? question "PC 版一定要 NVIDIA 显卡吗"

    正式采集要：最低 RTX 3060 / 8 GB 显存，推荐 RTX 5060 Laptop / 8 GB 及以上，驱动 ≥ 570.144，见[主机配置要求](../pc/install.md#host-spec)。没有显卡的机器可以关掉流式编码把数据录下来，但存盘慢、更容易掉帧，只是临时办法，见[没有 NVIDIA GPU 的主机怎么录](../pc/recording.md#no-gpu)。

??? question "头显是必需的吗"

    两种配置都需要。6DoF 位姿来自头显与装在夹爪顶部的两只追踪器，没有头显就没有位姿。背包版采集模式里的「+ 头显双目」「+ 头显右单目」指额外录头显画面，不是指要不要头显。

??? question "手机能当背包版的控制台吗"

    可以，平板、手机、PC 都只当浏览器。连上背包热点后打开 `http://192.168.44.1`，或用设备名 `http://xense-<序列后 6 位>.local`。iOS Safari 要敲全 `http://` 前缀，否则设备名会被当成搜索词；部分安卓机型打不开 `.local` 名，直接用 IP。

??? question "背包版需要联网吗"

    采集不需要。背包常开自己的 5 GHz 热点，网关固定 `192.168.44.1`，不依赖现场网络。只有导出时选「上传到远端」，背包才要能访问上传目标：传 ModelScope、S3 等云端一般要能上外网，传局域网里的 FTP / NFS 只要连上同一局域网即可；接网线，或在系统页把背包配上现场的 5 GHz WiFi。下载到设备不用联网。

## 联系与快速开始

选好了就去各自的入口页：[背包版快速开始](../backpack/index.md)、[PC 版一页速通](../pc/quickstart.md)。线缆、适配器、充电宝等以合同配置及随货清单为准，缺件联系项目负责人，勿自行替代；技术问题的反馈渠道与要附带的信息见[支持与反馈](../common/reference.md#support)。
