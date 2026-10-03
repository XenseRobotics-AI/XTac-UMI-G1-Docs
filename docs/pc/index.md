# PC 版：XTac-UMI G1 开发套件

PC 版把计算放在你自己的 x86 工作站上（推荐 NVIDIA GPU，Mamba 源码安装或 Docker 镜像二选一）：夹爪 USB 直连主机，Pico4 Ultra 企业版头显也用 Type-C 线直连主机走有线共享网络（默认有线，WiFi 仅供临时调试），位姿经主机上的 XenseVR PC Service 接入，整条链路走 LeRobot 框架。
需要的硬件是 XTac-UMI G1 主夹爪（单只或一对）、Pico4 Ultra 企业版加追踪器，以及这台工作站。
操作界面是终端命令加 Rerun 预览窗口，`lerobot-record` 直接落盘 LeRobotDataset v3，可推到 Hugging Face Hub。
基于 lerobot 开源生态，适合研究与算法团队、自建训练管线；完全开放二次开发，改 Python 代码或接自定义机器人都可以。
不需要 PC、由采集团队在现场用平板和夹爪按键操作的是[背包版](../backpack/index.md)；两种配置的对比见[产品线与配置对比](../product/editions.md)。

## 采集全流程 {#workflow}

<div class="tc-flow" markdown>

<div class="tc-flow__group" markdown>

### ① 准备工作

<p class="tc-flow__lead">每台电脑、每台设备做一次</p>

1. **[认识硬件](../common/gripper.md)**<br>
   部件、接线与上电顺序
2. **[安装环境](install.md)**<br>
   `setup_env.sh` 或 Docker 镜像
3. **[配置主机](host-setup.md#31)**<br>
   串口权限、关闭 ModemManager
4. **[配置 Pico4 Ultra 企业版](../common/pico4.md)**<br>
   开发者模式、XR 应用、追踪器
5. **[标定主夹爪](calibration.md#41)**<br>
   零点与行程上限，每只一次

</div>

<div class="tc-flow__group" markdown>

### ② 采集

<p class="tc-flow__lead">每次采集按这个顺序</p>

1. **[上电与连接](quickstart.md#power-on)**<br>
   插夹爪、开追踪器，关电脑 WiFi
2. **[启动服务与 XR 应用](host-setup.md#35)**<br>
   先启 PC Service，再开 XR 应用
3. **[预览检查](recording.md#preview)**<br>
   `lerobot-teleoperate` 确认数据流
4. **[正式录制](recording.md#52)**<br>
   `lerobot-record`，中途不重启 XR

</div>

<div class="tc-flow__group" markdown>

### ③ 数据

<p class="tc-flow__lead">录完之后</p>

1. **[检查完整性](dataset.md#62)**<br>
   `lerobot-check-dataset`
2. **[上传 Hub（可选）](dataset.md#64)**<br>
   `lerobot-push-dataset-to-hub`
3. **[了解数据格式](dataset.md#61)**<br>
   每帧记录了什么、怎么读取

</div>

</div>

<p class="tc-flow__more" markdown>把从夹爪装到机器人上、用程序控制开合与夹持，见[从夹爪](../follower/index.md)；直接调用夹爪 SDK，见[SDK 与二次开发](../sdk/index.md)。</p>

## 数采系统组成 {#system}

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

具体命令见 [数据采集](recording.md)。

## 每帧记录什么 {#frame}

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

字段明细见 [每帧记录内容](recording.md#53)，数据集格式见 [数据集](dataset.md)。

## PC 版开源仓库 {#repos}

PC 版用到的软件都开源，下表是各仓库及其用途。背包版的采集软件不开源，不在此列。

| 仓库 / 包 | 许可证 | 备注 |
|---|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | Apache-2.0 | 数采主仓库，基于 lerobot 0.5.1 定制 |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | Apache-2.0 | 夹爪 SDK，数采仓库以子模块引入；[开发文档](../sdk/index.md) |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Apache-2.0 | Pico4 Ultra 企业版 PC 服务，以 `.deb` 安装 |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | 未声明 | 视触觉传感器 SDK，由安装脚本安装；[开发文档](https://docs.xenserobotics.com/) |
| [`xense-lerobot-viewer`](https://github.com/XenseRobotics-AI/xense-lerobot-viewer) | Apache-2.0 | 开源的本地可视化工具，在浏览器里查看本地 LeRobot 数据集 |
