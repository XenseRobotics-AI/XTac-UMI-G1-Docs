# 常见问题

客户最常问的五类问题：坐标系怎么定义、内外参从哪来、数据精度怎么验证、数据怎么导出上传、录好的数据怎么回放。每条给出结论和出处，细节在链接的页面里。

两种配置（[背包版](../backpack/index.md) / [PC 版](../pc/index.md)）用同一套夹爪与头显，传感器一侧的定义相同；下面凡是两版不一样的地方都分开写。

## 坐标系 {#frames}

??? question "世界坐标系怎么定义的？原点在哪？"
    右手系、重力对齐，由头显上的 XTac UMI XR 在**启动那一刻**建立并冻结：

    | 轴 | 方向 |
    |---|---|
    | 原点 | 启动 XTac UMI XR 时头显所在的位置 |
    | X | 前，沿头显前部相机安装面法线 |
    | Y | 左 |
    | Z | 上 |

    冻结后转头、走动都不会带走它；**重启 XR 会重新建系**，原点和方向都变。所以同一数据集采集期间不要重启 XR。详见[世界坐标系](../common/coordinates.md#world)。

??? question "为什么两条录制的位姿数值对不上？"
    两版原因不同：

    - **背包版**：0.4.6 起，导出的状态与动作以**每条录制第 0 帧的头显位置**为原点、第 0 帧头显的水平朝向为 X 轴，去掉平移和偏航（俯仰、侧倾保留）。这是有意为之——Pico 复位坐标系时只归零朝向和高度，水平位置会残留几厘米到几十厘米；每条各自归零后，同一数据集内起点才一致。「双爪」模式不录头显位姿，不做这个变换。见[导出数据的原点](../common/coordinates.md#episode-origin)。
    - **PC 版**：直接用上面的世界系，**没有**逐集归零。开录前重启过 XR，前后两集的位姿就会整体错开，只能当作新数据集处理。

??? question "位姿的 6D 旋转 `r1..r6` 是什么？"
    旋转矩阵 R（世界 ← 本体）的**前两列**，按列取：

    - `r1..r3` = 第一列 = 本体 X 轴在世界系下的方向；
    - `r4..r6` = 第二列 = 本体 Y 轴；
    - 第三列是前两列的叉积，可自行算回。

    背包版导出的左手 TCP 在 `mirrored-v1` 约定下绕自身 X 轴转了 180°，所以相比同轴约定 **`r4..r6` 反号、`r1..r3` 不变**。`tcp.*` 与 `head.*` 同一取法。见[每帧记录内容](../pc/recording.md#53)与[导出格式](../backpack/projects-export.md#lerobot)。

??? question "`tcp.*` 指的是哪个点？和追踪器位姿是什么关系？"
    `tcp.*` 是**夹爪末端**（两指中点）在世界系下的位姿，由追踪器位姿经内置的追踪器→末端变换换算得到。PC 版数据集里不落追踪器原始位姿（Rerun 面板里的 `tracker pose` 仅供查看）；背包版的原始 MCAP 记录头显与追踪器的位姿，导出数据集里才是换算后的 `tcp.*`。夹爪本体坐标系、末端定义与追踪器安装位置以 [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description) 的 URDF / MJCF 为准；要改换算关系见 [RobotConfig](../pc/recording.md#robotconfig)。

??? question "`head.*` 在哪个坐标系？和 `tcp.*` 是同一个世界系吗？"
    是。头显的 Pico 位姿经追踪器同一套 Pico→world 变换映射进 `tcp.*` 所在的世界系，位置与 6D 旋转布局也相同。因此 `head.*` 同时是观测和动作——策略可以像命令夹爪一样命令头部朝向。

## 内外参 {#calibration}

??? question "腕部鱼眼相机的内参在哪？没标定过能用吗？"
    内参存在**每只夹爪自己的 flash** 里。没标定过的夹爪，SDK 自动改用一组内置的参考内参并打印告警，矫正不会失败，但只适合看画面——在矫正图上按像素测量请先给这台夹爪写入标定。

    - 读内参：SDK 里 `g.calibration.resolve_fisheye()` 返回 `(cal, is_reference, reason)`；脚本 `read_intrinsics.py` 只读导出。
    - 写内参：`fisheye_cal.py set-fisheye right --from-npz cam.npz`（从夹爪加 `--follower`）。
    - PC 版录制时 `--robot.wrist_undistort=true` 会用本夹爪 flash 里的内参在写入前矫正；回退到参考内参时会告警，并记进 `meta/hardware.json`。见[鱼眼矫正](../pc/recording.md#57)。

??? question "触觉的内参 / 矫正参数从哪来？"
    由传感器型号决定，随数据集一起可用，不需要现场标定：参考图是每个 episode 的第一帧 `rectify` 流，导出时按项目所选方向做几何矫正（默认 700 × 400，可逆时针 90° 得 400 × 700）。录制始终保存原始画面，矫正只在导出时做。见[腕部鱼眼矫正](../backpack/system.md#undistort)与[导出格式](../backpack/projects-export.md#lerobot)。

??? question "追踪器到夹爪末端的外参要自己标吗？"
    不用。左右各一套内置变换，采样时直接换算到末端。可以自检：

    ```bash
    python -m lerobot.robots.taccap_gripper.check_tracker --side right
    ```

    以 10 Hz 打印 `raw`（追踪器自身位姿）与 `ee`（末端位姿）。**支点检查**：两指中点抵住一个固定点转动握柄，`ee xyz` 应基本不动、`raw xyz` 大幅变化；否则追踪器装错了。见[追踪器自检](../pc/calibration.md)。

??? question "导出数据里带了哪些外参？"
    背包版导出的 LeRobot 数据集附带 `meta/taccap_extrinsics.json`，**逐集**记录：

    - `tracker_bindings`：哪只追踪器绑在哪一侧；
    - `tracker_to_ee`：当集实际使用的追踪器→末端变换（左右各一套，含版本号）；
    - `gripper_open_rad`：开录时读取的每只夹爪满开行程，用于把编码器读数归一化；
    - 若该集数据来自更早的导出规则，另有 `legacy_extrinsics` / `legacy_world_pose` 标记与告警。

    另有 `meta/xumi_collection_devices.json` 记录每条数据由哪套设备、哪个版本导出。见[导出格式](../backpack/projects-export.md#lerobot)。

??? question "头显双目相机的内参和外参怎么拿？"
    XTac UMI XR 随相机参数一起下发，参考系是**头显本体（head pose）**，不是 SDK 的标定参考系：

    - 外参：SDK 原生外参先左乘固定的 `T_H_I` 再发给采集端，主字段 `cameraExtrinsics` 已是 head pose 外参（`cameraExtrinsicsReferenceFrame=native_pico_head_pose`），**接收端不要再乘一次 `T_H_I`**；SDK 原值放在 `cameraExtrinsicsSdk`。
    - 内参：每次重开捕获时按本次请求的单眼宽高与 FOV 计算。
    - 支持的分辨率只有 `640x480`（默认）、`1024x768`、`1280x960` 三档，都是 4:3；填别的或首帧尺寸不符会直接报错，不会悄悄重采样。

    PC 版参数见[可选：头显相机](../pc/recording.md#56)。

## 精度与验证 {#accuracy}

??? question "标称精度是多少？"
    | 指标 | 标称 |
    |---|---|
    | 空间定位 | < 3mm |
    | 多设备时间同步 | 5ms |
    | 视触觉合力精度 / 变形场精度 | 0.2N / 0.1mm |
    | 位姿刷新 | PC 版约 90Hz；背包版按头显上报逐条记录 |
    | 触觉 / 腕部鱼眼 / IMU 与编码器 | 0–120Hz / 30fps / 100Hz |

    出处：[技术参数](specs.md#tracking)。这些是系统规格，不是逐台出厂报告；实际精度受追踪器视野、安装和现场光照影响，下面几条是能自己跑的验证。

??? question "怎么验证位姿链路是准的？"
    三个层次，从便宜到彻底：

    1. **静止看漂移**：夹爪放在桌上不动，监控页或 Rerun 里的位姿应在毫米级波动，不持续游走。
    2. **支点检查**：两指中点抵住固定点转动，`ee xyz` 基本不动（见[追踪器自检](../pc/calibration.md)）。这一条能同时抓到装错、绑定反了和变换用错。
    3. **轨迹复核**：Rerun 里开 `--display_data=true`，夹爪以三轴画在 `tcp.*` 处并拖尾；平放时三轴应是 X 前 / Y 左 / Z 上。见[采集时的位姿视图](../common/coordinates.md#world-view)。

??? question "怎么验证数据集本身是完整的？"
    - **PC 版**：`lerobot-check-dataset --repo-id <org>/<name>` 检查 `meta/` 是否齐全、集数是否一致、parquet 行数与索引是否连续、有没有 NaN；视频帧数严格相等，少帧报错。上传共用之前先跑一遍。见[数据校验](../pc/dataset.md#62)。
    - **PC 版可视化**：用 [`xense-lerobot-viewer`](https://github.com/XenseRobotics-AI/xense-lerobot-viewer) 本地打开，它的 Doctor 面板对每份数据集做 13 项只读检查（元数据、时序、动作、视频等），并可 3D URDF 回放对照。
    - **背包版**：停录时自动质检，命中任一项标「数据可疑」（时长过短、某路相机零帧、追踪失效超过 20%、触觉矫正配方缺失、帧率偏低超过 5%），见[停止后](../backpack/monitor-record.md#record-stop)；导出前还有一道[预检](../backpack/projects-export.md#export)。

??? question "夹爪开度读数对不对怎么查？"
    闭合时 `gripper.pos` 应约为 0，张开时到 1.0。张到底明显够不到 1.0 就是这台没标好，重新标定；PC 版没标过的夹爪采集程序直接拒绝连接。见[确认标定生效](../pc/calibration.md#413)。

    这里说的是**开合行程标定**，和上面鱼眼内参是两件事：鱼眼没标定会回退到参考内参、照常采集，开合没标定则开度读数不可信（背包版）或直接拒绝连接（PC 版）。

??? question "触觉数据在训练里有多大价值？空抓会不会影响？"
    触觉是这套采集系统的核心模态。空抓时触觉图没有接触形变，这一帧基本不提供信息，价值很低；采集时看预览里的触觉图确认抓取有真实接触，见[采集规范](../pc/recording.md#practice)。触觉原始分辨率 640 × 480、最高 120Hz，导出时按项目设置矫正。

## 导出与上传 {#export}

??? question "背包版能导出什么格式？"
    按任务导出，两种平级、可以都导：**LeRobotDataset v3.0**（`meta/` + `data/` + `videos/`，30fps）或 **训练 MCAP**（`.train.mcap`，按 30Hz 对齐）。导出前自动预检。见[导出格式](../backpack/projects-export.md#formats)。

??? question "能传到哪些地方？"
    下载压缩包到平板 / 电脑，或上传到：ModelScope、S3、腾讯云 COS、FTP / FTPS、NFS；STS 仅支持 MCAP。上传前列出文件清单，确认后才开始。见[上传到远端](../backpack/projects-export.md#upload)。

??? question "上传完为什么磁盘没释放？"
    默认保留本地文件。要释放空间得另外**归档**（上传时勾「上传完成后自动归档」，或事后手动归档）。归档会删掉原始文件，之后不能回放、不能重新导出、不能下载原始 MCAP。见[归档](../backpack/projects-export.md#archive)。

??? question "升级后为什么提示重新导出？"
    导出规则变了，旧导出自动标为过期：0.4.6 改了位姿原点与左手约定，0.4.7 改成各路相机各取最近帧、位姿与开合度按帧时刻插值。原始录制不受影响，对仍有原始文件的录制重新导出即可；新旧导出不要合进同一数据集。见[导出版本说明](../backpack/troubleshooting.md#export)。

??? question "背包版和 PC 版的数据能合并训练吗？"
    可以，两边都是 LeRobotDataset v3，同一套工具都能读。但相机键名与字段布局不同，合并前对照各自的 `meta/info.json`；背包版还要用 `tcp_frame_convention`（当前 `mirrored-v1`）区分左右手约定。见[两种配置的差别](editions.md)。

??? question "一份数据集有多大？"
    背包版导出的 LeRobot 数据集约 **0.5 GB / 小时**，主要由项目的「导出质量」决定（高质量 / 标准 / 紧凑，建项目时选定、之后不能改）。见[LeRobot 数据集体积](../backpack/troubleshooting.md#export)。PC 版另有[存储规划](../pc/dataset.md#storage-planning)。

??? question "PC 版怎么交付数据？"
    本地录在 `$HF_LEROBOT_HOME` 下，上传即异地备份加交付：

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
    ```

    可选 `--private`、`--upload-large-folder`、`--no-videos`；上传前先 `hf auth login`，并跑一遍 `lerobot-check-dataset`。见[上传与备份](../pc/dataset.md#64)。

??? question "原始录制和导出的 MCAP 有什么区别？"
    原始记录是各路按设备原生频率存的（触觉 120fps、腕部 30fps、开合与 IMU 100Hz），图像未矫正；导出的 `.train.mcap` 统一对齐到 30Hz，图像按项目设置矫正。原始文件只能在工程模式下按单条下载，供排查和分析，不能直接当训练数据。见[MCAP](../backpack/projects-export.md#mcap)。

## 回放 {#replay}

??? question "录完不下载，能直接在控制台看吗？"
    能。背包版项目页条目行点「回放」，画面、位姿与开合度同步播放，进度条可拖动。回放和实时预览共用硬件编码器，**不能同时进行**（有其他标签页或设备开着监控页时会被拒绝）；已归档的条目不能回放。见[回放](../backpack/projects-export.md#playback)。

??? question "PC 版录的时候怎么看？录完怎么回看？"
    - **录的时候**：`--display_data=true` 开 Rerun，实时看各路画面、标量面板和 `/world` 3D 视图（夹爪轨迹拖尾约 3 秒）。
    - **录完**：`xense-lerobot-viewer` 本地打开，视频与遥测时间轴同步；3D URDF 回放支持 TacCap 数采夹爪，默认把录下的位姿当作末端 TCP。
    - **在线**：上传 Hub 后用 LeRobot Dataset Visualizer 逐集看。
    - 见[回放与可视化](../pc/dataset.md#replay)。

??? question "能用 `lerobot-replay` 把录的动作重新播放到真机上吗？"
    **对 XTac UMI 的夹爪类型不行**。`lerobot-replay` 会逐步调用机器人的 `send_action()`，而 `taccap_gripper` / `bi_taccap_gripper` / `xtac_umi_g1` 的 `send_action()` 是空实现——数采夹爪是被动的示范设备，电机不由程序命令，夹爪开合靠人手机械带动。所以回放这些数据集不会驱动夹爪，也不会报错。

    要在真机上执行录下的动作，需要在**你自己的机器人**上实现 `send_action()` 适配（或从夹爪加自建控制映射），再让 `lerobot-replay` 指向该机器人类型。

??? question "回放的 3D 轨迹和视频对不上？"
    先确认用的是同一集的视频与数据（viewer 里按集切换）；再确认数据集没有被编辑过（`lerobot-edit-dataset` 会重新编码视频）。位姿跳变多半是采集时重启过 XR 或追踪器丢失，见[监控页位姿异常](../backpack/troubleshooting.md#tracker)。
