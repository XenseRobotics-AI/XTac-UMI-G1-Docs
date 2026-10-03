# 1. 概述

!!! abstract "本手册范围"
    覆盖从**手持采集**到**数据落盘为 [LeRobotDataset v3.0](06-dataset.md)** 的完整链路：
    硬件 → 环境安装 → 主机配置 → 标定 → 采集 → 数据集。**模型训练、推理、部署不在范围内。**

## 1.1 XTac-UMI G1 是什么

**XTac-UMI G1** 是 XenseRobotics 面向机器人操作学习的**手持式视触觉多模态数据采集夹爪**，
更多产品价值见 [产品亮点](highlights.md)。每只主夹爪集成：

| 部件 | 说明 | 采样率 |
|---|---|---|
| 编码器 | 夹爪开合；[标定](04-calibration.md#41) 后归一化为闭合 = 0、张开 = 1 | 100 Hz |
| 双视触觉传感器（左右指各一） | 视触觉图像，校正后约 `(400, 700, 3)` | 约 30 Hz |
| 腕部相机 | 手腕视角 RGB | 约 30 Hz |
| IMU | 加速度、角速度、磁力；预留，默认不录 | 100 Hz |

!!! note "手持演示，没有遥操作端"
    操作员手持夹爪完成演示动作，录制时命令行**不需要任何 `--teleop.*` 参数**。

## 1.2 平台要求 {#platform}

采集是实时的（30 fps，每帧约 33 ms），主机配置不够时表现为丢帧、录制变慢，而不是报错。
推荐配置即我们实际采集用机的配置，各项的原因见 [采集主机配置要求](02-environment.md#host-spec)。

| 项目 | 最低要求 | 推荐配置 |
|---|---|---|
| 系统 | Ubuntu 22.04 / 24.04 LTS，amd64 | Ubuntu 24.04 LTS |
| CPU | Intel 12 代 i7（或同级 AMD） | Intel Core Ultra 9 275HX（24 核）或同级 |
| 内存 | 8 GB | 32 GB |
| 显卡 | NVIDIA RTX 3060，8 GB 显存 | NVIDIA RTX 5060 Laptop，8 GB 显存及以上 |
| 显卡驱动 | ≥ 570.144 | 同左 |
| 硬盘 | 512 GB SSD | 1 TB NVMe SSD |
| USB | 单夹爪接一条 USB 2.0 总线即可 | 双夹爪分接两条独立的 USB 2.0 总线 |

- **不支持 macOS、Windows**；Python 需 3.12 及以上，按 [环境安装](02-environment.md) 装好即可。
- **不要直接录到机械硬盘或 USB 移动硬盘**，写盘速度跟不上。
- **双夹爪务必分接两条 USB 总线**：6 路相机挤在一条总线上会有相机打不开，这与 CPU、显卡多快无关，见 [USB 带宽预算](03-host-hardware.md#usb-budget)。
- **没有 NVIDIA 显卡**也能录，但效率明显下降，见 [没有 NVIDIA GPU 的主机怎么录](05-data-collection.md#no-gpu)；Docker 交付镜像则必须有 NVIDIA 显卡与驱动。
- **账户权限**：用户需加入 `dialout`、`video` 组，并关闭 ModemManager 对夹爪串口的抢占，见 [3.1 串口权限](03-host-hardware.md#31)、[3.2](03-host-hardware.md#32)。
- 仓库、SDK 与固件的具体版本见 [版本与支持](versions.md)。

## 1.3 数采系统组成

整套采集在数采电脑上的一个 `lerobot-record` 进程里完成：各路设备各自独立读取，每一帧取各路的最新值合成一帧，配对后写成数据集。
把鼠标移到（手机上点按）任一模块，可以看到它的数据从哪来、到哪去；上方按钮切换三档。

<div class="tc-arch"><script type="application/json">
{
  "title": "XTac-UMI G1 数采系统架构",
  "tiers": ["① 只有夹爪", "② 带腕部位姿", "③ 完全体"],
  "cols": {"dev": "设备", "read": "数采电脑 · 读取", "core": "数采电脑 · 处理", "out": "输出"},
  "group": "主夹爪 ×2（左 / 右）",
  "hint": "把鼠标移到（或点按）任一模块，查看它的数据从哪来、到哪去。",
  "sep": "：",
  "offNote": "（当前档位不使用）",
  "legend": ["数据与位姿", "头显双目画面（③ 档）"],
  "edges": {
    "e-grip": "USB 串口", "e-tact": "USB", "e-wrist": "USB",
    "e-track": "无线", "e-head": "有线 / WiFi"
  },
  "nodes": {
    "grip": {"title": "主控板 · 编码器", "sub": "开合角度", "desc": "主夹爪主控板读取编码器得到开合角度，经 USB 串口主动推送给数采电脑。主控板上还有 IMU，预留，默认不录。"},
    "tact": {"title": "视触觉传感器 ×2", "sub": "左右指各一", "desc": "左右指各一个视触觉传感器，拍摄指面与物体接触处的视触觉图像。"},
    "wrist": {"title": "腕部相机", "sub": "手腕视角 RGB", "desc": "装在夹爪上的鱼眼相机，提供手腕视角画面。"},
    "tracker": {"title": "运动追踪器 ×2", "sub": "Pico4 Ultra", "desc": "装在每只夹爪顶部，由头显跟踪它的 6-DoF 位姿。① 档不需要。"},
    "headset": {"title": "头显", "sub": "Pico4 Ultra 企业版", "desc": "运行 XTac-UMI XR，跟踪两个追踪器，经有线（推荐）或 WiFi 把位姿发给数采电脑；③ 档还用自带双目相机拍第一视角画面并提供头部位姿。世界坐标原点是 XR 应用启动时头显所在的位置。"},
    "sdk": {"title": "xense.taccap", "sub": "串口 · 100 Hz 推送", "desc": "夹爪 SDK 接收主控板推送的读数（默认 100 Hz），按标定结果把开合角度归一化为 gripper.pos（闭合 = 0、张开 = 1）。"},
    "xsdk": {"title": "xensesdk", "sub": "校正图 · 30 fps", "desc": "视触觉传感器 SDK，每个传感器独立读取，默认输出校正后的视触觉图像（约 400 × 700），30 fps。"},
    "cam": {"title": "相机采集", "sub": "640 × 480 · 30 fps", "desc": "按序列号找到对应夹爪的腕部相机，每台独立读取，默认 640 × 480、30 fps。鱼眼矫正可选，默认关闭。"},
    "pcs": {"title": "XenseVR PC Service", "sub": "位姿 · 约 90 Hz", "desc": "数采电脑上的服务，接收头显发来的追踪器位姿（约 90 Hz 刷新），由采集程序换算到夹爪末端（TCP），得到 tcp.*。③ 档同时转发头显双目画面（左右眼按帧序配对）与头部位姿。"},
    "obs": {"title": "帧组装", "sub": "取各路最新值", "desc": "每一帧（默认 30 fps）取各路的最新值合成一帧观测：开合度、夹爪位姿、视触觉图像、腕部画面；③ 档再加头显双目画面与头部位姿。"},
    "pair": {"title": "错帧配对", "sub": "观测 t-1 + 动作 t", "desc": "把上一帧的观测与这一帧的夹爪位姿、开合度（③ 档再加头部位姿）配成一行，动作领先观测一步。每集第一帧没有可配对的上一帧，因此少 1 帧。"},
    "rerun": {"title": "Rerun 实时预览", "sub": "--display_data=true", "desc": "预览或录制时加 --display_data=true，实时显示各路画面、数值曲线和夹爪轨迹的 3D 视图。只用于查看，不写进数据集。"},
    "ds": {"title": "LeRobotDataset v3.0", "sub": ["Parquet + MP4", "+ meta/hardware.json"], "desc": "状态与动作写入 Parquet；每路相机边录边编码成 MP4，有 NVIDIA GPU 时自动用硬件编码。这套设备的序列号等硬件清单另存在 meta/hardware.json。"}
  }
}
</script></div>

- **主夹爪**经 USB 接数采电脑：开合度由 `xense.taccap` 读取（100 Hz 推送），视触觉图像由 `xensesdk` 读取，腕部相机按序列号与所在夹爪对应。
- **运动追踪器**装在夹爪顶部，由**头显**跟踪；头显经有线（推荐）或 WiFi 把位姿交给 **XenseVR PC Service**，再由采集程序换算到夹爪末端（TCP）。③ 档还送来头显双目画面与头部位姿。
- **`lerobot-record`** 每帧取各路最新值，把上一帧的观测与这一帧的位姿和开合度配成一行，写成 **LeRobotDataset v3.0**；相机画面边录边编码，有 NVIDIA GPU 时用硬件编码。

按接入的设备，采集分三档，用 `--robot.type` 选择：

| 档位 | 需要的设备 | 录到的数据 |
|---|---|---|
| ① 只有夹爪 | 主夹爪 | 触觉、腕部相机、开合度 |
| ② 带腕部位姿 | 主夹爪 + 追踪器 + 头显 | 再加夹爪位姿 |
| ③ 完全体 | 同上 | 再加头显双目画面与头部位姿 |

具体命令见 [5. 数据预览与采集](05-data-collection.md)。

## 1.4 每帧记录什么

以双夹爪为例，数据集的每一行由第 t-1 帧的**观测**和第 t 帧的**动作**组成。把鼠标移到（手机上点按）任一数据项、来源或落盘位置，可以看到它从哪来、存到哪；按钮切换三档。

<div class="tc-arch" data-diagram="frame"><script type="application/json">
{
  "title": "XTac-UMI G1 数据集每一行的组成",
  "tiers": ["① 只有夹爪", "② 带腕部位姿", "③ 完全体"],
  "cols": {"src": "来源", "obs": "观测 · 第 t-1 帧", "act": "动作 · 第 t 帧", "out": "落盘"},
  "groups": {"img": "observation.images · {n} 路", "state": "observation.state · {n} 维", "act": "action · {n} 维"},
  "timeline": {"caption": "时间 →", "obs": "观测", "act": "动作", "row": "数据集的一行"},
  "hint": "把鼠标移到（或点按）任一数据项、来源或落盘位置，查看它从哪来、存到哪。",
  "sep": "：",
  "offNote": "（当前档位不录）",
  "dims": "共 {n} 维。",
  "obsNote": "观测里记的是第 t-1 帧的值。",
  "actNote": "动作里记的是第 t 帧的值，比观测领先一步。",
  "keys": {
    "tactile": "这只夹爪一根手指上的视触觉图像，校正图约 400 × 700，30 fps。",
    "wrist": "这只夹爪的腕部相机画面，默认 640 × 480。",
    "headimg": "头显一只眼的画面，默认 640 × 480，只有 ③ 档录。",
    "tcp": "这只夹爪末端（两指中点）在世界系下的位姿：位置 x、y、z（米）加 6-D 旋转 r1–r6，由追踪器位姿换算得到。",
    "grip": "这只夹爪的开合度，闭合 = 0、张开 = 1。",
    "headpose": "头显在世界系下的位姿，格式与 tcp.* 相同，只有 ③ 档录。"
  },
  "nodes": {
    "lgrip": {"title": "左夹爪", "sub": "触觉 · 腕相机 · 编码器", "desc": "提供两路视触觉图像、腕部相机画面和开合度。"},
    "ltrk": {"title": "左追踪器", "sub": "经头显与 PC Service", "desc": "位姿换算到左夹爪末端，得到 left_tcp.*，观测和动作里各有一份。① 档不录。"},
    "rgrip": {"title": "右夹爪", "sub": "触觉 · 腕相机 · 编码器", "desc": "提供两路视触觉图像、腕部相机画面和开合度。"},
    "rtrk": {"title": "右追踪器", "sub": "经头显与 PC Service", "desc": "位姿换算到右夹爪末端，得到 right_tcp.*，观测和动作里各有一份。① 档不录。"},
    "head": {"title": "头显", "sub": "双目相机 · 头部位姿", "desc": "提供左右眼画面和头部位姿 head_camera.*，头部位姿在观测和动作里各有一份。只有 ③ 档录。"},
    "mp4": {"title": "MP4 视频", "sub": "videos/ · 每路一个键", "desc": "每路画面是一个视频键 observation.images.<键名>，边录边编码成 MP4，存在 videos/ 下。"},
    "pq": {"title": "Parquet 表", "sub": ["data/ · 每帧一行", "state + action + 索引"], "desc": "每帧一行：observation.state 与 action 两个向量，另有时间戳、帧序号、集序号等索引列，存在 data/ 下。"}
  }
}
</script></div>

- 观测取第 t-1 帧、动作取第 t 帧，动作领先观测一步；每集第一帧没有上一帧可配对，因此少 1 帧。
- 位姿 `*_tcp.*` 与 `head_camera.*` 都是 9 维：位置 x、y、z 加 6-D 旋转，世界系为 X 前 / Y 左 / Z 上。
- 三档的维数：① 观测状态与动作各 2 维、6 路画面；② 各 20 维、6 路画面；③ 各 29 维、8 路画面。
- 单夹爪（`--robot.type=taccap_gripper`）的键名不带 `left_` / `right_` 前缀，腕部相机叫 `wrist_cam`。

字段明细见 [5.3 每帧记录内容](05-data-collection.md#53)，数据集格式见 [6. 数据集与示例](06-dataset.md)。

下一步 → [2. 环境部署](02-environment.md)
