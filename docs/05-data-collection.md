# 5. 数据预览与采集

本章是核心:用 `lerobot-record` 采集并写出 `LeRobotDataset`。

## 5.1 采集原理 {#51}

`taccap_gripper` **不需要遥操作端**,录制是自驱动的。

数据采用**移位帧(shifted-frame)配对**:动作比观测**领先一步**——*t-1* 步的观测,配
*t* 步的位姿(EEF TCP 位姿 + 归一化 `gripper.pos`,开了[头显相机](#56)时还包括
**头显位姿**)作为动作。因此每集会少 1 帧
(它没有前一帧可配对)。集与集之间的复位阶段是被动等待:重新摆放设备即可,无需遥操。

!!! note "命令行上没有 --teleop.*"
    正因为自驱动,录制命令里**不出现任何 `--teleop.*` 参数**。

## 开录前:先用 `lerobot-teleoperate` 看一眼 {#preview}

`lerobot-teleoperate` **只读取并预览设备,不写任何数据**,跑一遍是零成本的;录制则是有成本的
——一条集录废了要重来。而多数问题(某路相机没上来、追踪器没位姿、`gripper.pos` 顶不到 1.0、
双夹爪左右接反)在预览里一眼就能看出来。

**你要录到哪一档,就预览到哪一档**——三档接的设备不同,能看到的东西也不同。

=== "① 只有夹爪"

    触觉两路、腕相机、`gripper.pos`。追踪器和头显都关着,**不需要启动 PC Service**。

    ```bash
    lerobot-teleoperate \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=false \
        --robot.enable_head_camera=false \
        --fps=30 \
        --display_data=true
    ```

=== "② 加上追踪器位姿"

    多出 [`/world` 3D 视图](#world-view):夹爪的 EE 标记和它走过的轨迹。
    需要追踪器已开机绑定、Pico4 已连上、[XenseVR PC Service](03-host-hardware.md#35) 已启动。

    ```bash
    lerobot-teleoperate \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=false \
        --fps=30 \
        --display_data=true \
        --show_trajectory=true
    ```

=== "③ 全开(含头显相机)"

    再多出头显双目画面与头部位姿,需要 **PC Service ≥ v0.2.0**(见 [§5.6](#56))。

    ```bash
    lerobot-teleoperate \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=true \
        --fps=30 \
        --display_data=true \
        --show_trajectory=true
    ```

**单夹爪**:换成 `--robot.type=taccap_gripper`,其余相同。只接了一只时会自动选中;
**两只都接着**时再加 `--robot.side=left|right` 指定用哪一只。

在 Rerun 里逐项确认(②③ 档才有位姿相关的两行):

| 看什么 | 期望 |
|---|---|
| 左右两路触觉 | 都有画面;按压时纹理明显变化 |
| 腕相机 | 有画面,视野里没有线缆或杂物遮挡 |
| `gripper.pos` | 张到底到 **1.0**、闭合到 **0.0**——顶不到 1.0 见 [4.1.3](04-calibration.md#413) |
| `/world` 里的 EE 标记与轨迹 | 随夹爪平滑移动,不跳变、不卡住——**追踪器要始终在头显视野内**,被遮挡就会丢跟踪 |
| 双夹爪:左右两条轨迹 | 各自独立且对应正确的手,没有接反 |

都正常再 `Ctrl+C` 退出,继续下面的录制。

!!! note "`--robot.enable_head_camera` 为什么显式写出来"
    它默认就是 `false`,写出来是为了让这个开关**在命令里可见**——改成 `true` 就会连同
    头显双目画面与头显位姿一起预览/录制(见 [5.6 头显相机](#56)),需要 **PC Service ≥ v0.2.0**。

!!! tip "想让它自己停,并打印每帧耗时"
    `--teleop_time_s=10` 跑满 10 秒自动退出,`--debug_timing=true` 打印采样耗时与相机路数。

### Rerun 里的 `/world` 3D 视图 {#world-view}

`--display_data=true` 会开出一个 `/world` 3D 视图:夹爪以带标签的椭球 + 坐标三轴画在它实时的
**EEF TCP 位姿**(`tcp.*`)处,并拖出一条走过的轨迹面包屑。

- 场景按 `FLU`(X 前 / Y 左 / Z 上)声明,所以查看器知道哪个轴是「前」,初始视角朝 +X。
  世界轴带 `+X forward / +Y left / +Z up` 标注,转动视角后仍读得出朝向。
- 轨迹面包屑保留最近 **90 个采样点(30 fps 下约 3 秒)**,并且**越旧越淡**。够看清刚做完的
  那一笔,又不至于两只夹爪的轨迹缠成一团。
- 开了[头显相机](#56)时,头显也会画进同一个 `/world`——一个更小的**琥珀色 `HEAD` 标记**,
  不带轨迹(头一直在动,再拖一条面包屑会把夹爪轨迹盖掉)。头显位姿与 `tcp.*` 用的是
  **同一个重力对齐世界系**,所以「人在看哪」和「手在做什么」可以直接放在一起读。
- `--show_trajectory` 默认开启;设为 `false` 可关闭。`--robot.enable_tracker=false`
  (无位姿可画)时会自动跳过。

!!! tip "一眼确认标记画对了"
    夹爪平放时,EE 标记应落在**两指中点**、三轴呈 **X 前 / Y 左 / Z 上**;对不上就是追踪器装错了。

!!! note "标量面板里的 `tracker pose`"
    `tcp pose` 旁边的 `tracker pose` 是追踪器原始位姿,**仅供查看、不会落盘**(落盘的是 `tcp.*`)。

## 5.2 录制 {#52}

设备**按序列号规则自动发现**——不列举夹爪/触觉/相机序列号。触觉、腕相机、追踪器都按同一套
规则各自匹配左右。

**和上面预览的那一档对应**——三档录出来的数据集内容不同:

=== "① 只有夹爪"

    落盘 `gripper.pos` + 左右触觉 + 腕相机,**没有位姿**(数据里不会有 `tcp.*`)。

    ```bash
    lerobot-record \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=false \
        --robot.enable_head_camera=false \
        --display_data=false \
        --dataset.repo_id=<your_org>/<your_dataset> \
        --dataset.num_episodes=1 \
        --dataset.fps=30 \
        --dataset.push_to_hub=false \
        --dataset.episode_time_s=120 \
        --dataset.reset_time_s=60 \
        --dataset.single_task='Pick up the object'
    ```

=== "② 加上追踪器位姿"

    再加 `tcp.*`(EEF TCP 位姿)。**这是最常用的一档**,本章后面的说明默认按它来。

    ```bash
    lerobot-record \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=false \
        --display_data=false \
        --dataset.repo_id=<your_org>/<your_dataset> \
        --dataset.num_episodes=1 \
        --dataset.fps=30 \
        --dataset.push_to_hub=false \
        --dataset.episode_time_s=120 \
        --dataset.reset_time_s=60 \
        --dataset.single_task='Pick up the object'
    ```

=== "③ 全开(含头显相机)"

    再加头显双目画面与头部位姿,需要 **PC Service ≥ v0.2.0**(见 [§5.6](#56))。

    ```bash
    lerobot-record \
        --robot.type=bi_taccap_gripper \
        --robot.id=0 \
        --robot.enable_tracker=true \
        --robot.enable_head_camera=true \
        --display_data=false \
        --dataset.repo_id=<your_org>/<your_dataset> \
        --dataset.num_episodes=1 \
        --dataset.fps=30 \
        --dataset.push_to_hub=false \
        --dataset.episode_time_s=120 \
        --dataset.reset_time_s=60 \
        --dataset.single_task='Pick up the object'
    ```

**单夹爪**:换成 `--robot.type=taccap_gripper`,其余相同。只接了一只时会自动选中;
**两只都接着、只录其中一只**时,用 `--robot.side=left|right` 指定录哪一只——这时它是必填的。

!!! tip "正式录制时关掉 `--display_data`"
    上面三条命令都写了 `--display_data=false`(这也是默认值)。Rerun 显示要在采集主循环上
    压缩并推送每一路画面,**开着会明显占用帧预算**;关掉能把这部分负载全部让给采集和编码,
    高分辨率或多相机时尤其明显。

    数据流该在[开录前的预览](#preview)里确认,那时开着 `--display_data=true`;
    确认完就关掉再开录。录制途中确实要盯画面的话,见
    [`--display_image_every_n`](#params)。

!!! note "录到一半设备掉了会怎样"
    某路相机或夹爪编码器**中途掉线**(线松了、hub 掉电)时,采集会**主动停下来,并把已经
    录到的部分存盘**,终端上打印一条 `Device lost mid-recording`。**不会**继续往数据集里
    写编造的值。

    短暂的读取失败不算掉线——会沿用上一帧的好值撑过去(相机约 2 秒、夹爪编码器约 1 秒),
    超过才判定为掉线。所以掉线那一集的**最后一两秒可能是重复的旧值**,这一集建议弃用。

    处理:检查线缆与 USB 口(见 [某一路相机打不开](troubleshooting.md#usb-bandwidth)),
    然后用 `--resume` 在同一数据集上续录。

### 参数详解 {#params}

`lerobot-record` 参数分三类:**数据集**(`--dataset.*`)、**录制控制**(顶层)、
**设备**(`--robot.*`)。完整定义参考 lerobot 官方
[录制指南](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset)(对应本项目定制的 lerobot 基线 0.5.1)。

#### 数据集参数 `--dataset.*`

| 参数 | 默认 | 含义 |
|---|---|---|
| `repo_id` | **必填** | 数据集标识,`{HF用户名}/{数据集名}`,如 `Xense/pick_demo` |
| `single_task` | **必填** | 任务的简短准确描述,写入 `meta/tasks`(如 `'Pick up the object'`) |
| `root` | `$HF_LEROBOT_HOME/repo_id` | 本地存储目录;不指定则用默认缓存路径 |
| `fps` | `30` | 采样(录制)帧率上限 |
| `episode_time_s` | `120` | 每集录制时长(秒) |
| `reset_time_s` | `60` | 每集之间的复位时长(秒),被动等待你重新摆放场景 |
| `num_episodes` | `50` | 录制集数 |
| `video` | `true` | 是否把帧编码为视频(mp4) |
| `push_to_hub` | `false` | 默认仅保存到本地;需要上传时显式设为 `true` |
| `private` | `false` | 上传为 Hub 私有仓库 |
| `tags` | 无 | 给 Hub 数据集打标签 |
| `streaming_encoding` | `true` | 实时流式编码(见 [§5.4](#54)) |
| `vcodec` | `auto` | 视频编码器(`h264`/`hevc`/`libsvtav1`/`auto`/硬件编码器) |
| `encoder_threads` | 自动 | 每个编码器实例的线程数 |
| `encoder_queue_maxsize` | `30` | 每相机缓冲帧数(~1s@30fps),编码跟不上时反压丢旧帧 |
| `video_encoding_batch_size` | `1` | 批量编码前累计的集数(1=即时编码) |

!!! note "显式写出关键参数"
    推荐命令始终显式指定 `fps=30`、`episode_time_s=120`、`reset_time_s=60` 和 `push_to_hub=false`,避免不同 checkout 的默认值变化影响采集。
    上面的示例把 `--robot.enable_head_camera=false` 也写了出来,同样是这个道理——它默认就是
    `false`,写出来是让这个开关在命令里可见。改成 `true` 即连同头显双目画面与头显位姿一起录
    (见 [§5.6](#56));需要 **PC Service ≥ v0.2.0**。

!!! note "`fps` 与传感器帧率"
    `fps` 是**录制采样率**,不是传感器上限。视触觉传感器本身 120 Hz([硬件参数](hardware.md#specs)),
    按需以更低 `fps` 录制是**使用选择**,不改变传感器规格。

#### 录制控制(顶层参数)

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.type` | **必填** | `taccap_gripper`(单夹爪)/ `bi_taccap_gripper`(双夹爪) |
| `robot.id` | **必填** | 这套设备的**工位号**,填数字即可(`0` / `1`…),前缀按 `robot.type` 自动补;漏填直接报错退出,见 [`--robot.id` 与硬件清单](#robot-id) |
| `fps` | `30` | **主循环**帧率(设备读取与预览)。与 `--dataset.fps`(落盘采样率)是两个参数,通常设成相同值 |
| `display_data` | `false` | 在 Rerun 中显示相机画面与 3D 视图 |
| `show_trajectory` | `true` | Rerun 中叠加 3D 位姿 + 轨迹(需 `display_data` 且有 `tcp.*`) |
| `display_compressed_images` | `false` | Rerun 里是否 JPEG 压缩后再显示。**默认关**——压缩发生在录制主循环上,开着会吃掉大量帧预算;只有 Rerun 查看器在另一台机器上(`--display_ip`)时才划算 |
| `display_image_every_n` | `1` | 每 N 帧才刷新一次相机画面(标量始终全速)。**最后手段**,只在仍然超时才动它——它是唯一会改变操作员所见内容的选项 |
| `play_sounds` | `true` | 语音播报录制事件 |
| `resume` | `false` | 在已有数据集上**续录** |

#### 设备参数 `--robot.*`(XTac-UMI G1 专属)

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.side` | 自动 | `left`/`right`,**单夹爪模式**下两只都接着时必填;只接一只则自动选中 |
| `robot.role` | `leader` | 填 `follower` 绑定从夹爪 |
| `robot.enable_tracker` | `true` | 关闭则只录触觉 + 夹爪(无位姿) |
| `robot.tracker_serial` | 未设 | 钉住追踪器 SN,绕过侧别自动匹配 |
| `robot.enable_wrist_camera` | `true` | 关闭腕相机 |
| `robot.wrist_camera_width/_height/_fps` | — | 腕相机分辨率 / 帧率 |
| `robot.wrist_camera_fourcc` | `MJPG` | 腕相机像素格式。默认 MJPG 是为了给同 hub 的两路触觉让出 USB 带宽;`YUYV` 为无压缩,只在带宽够时用 |
| `robot.enable_head_camera` | `false` | 录制 Pico4 Ultra 企业版**头显相机**,见 [§5.6](#56) |
| `robot.head_camera_eyes` | `both` | `both` 录左右两只眼(两个键),`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `1024` / `768` | **每只眼**的尺寸,只接受 `1024x768` 或 `1280x960` |
| `robot.head_camera_fps` | `30` | 头显相机录制帧率 |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | 左右眼帧序号不同时,判定为同一次曝光的最大时间差 |
| `robot.tactile_fps` | `30` | 触觉录制帧率 |
| `robot.tactile_output_types` | `["rectify"]` | **落盘**的触觉流,**只能填一个** |
| `robot.tactile_display_output_types` | `["difference"]` | **仅显示**、不落盘的额外触觉流 |
| `robot.tactile_diff_gain` | `1.0` | `difference` 图的增益(只影响显示) |
| `robot.enable_tactile` | `true` | 关闭则整条触觉链路都不接入(不发现、不落盘)。**排查用,不是录制模式** |
| `robot.expected_tactiles_per_side` | `2` | 每侧应有几枚触觉;数量对不上会直接报错,用于抓装配/烧录错误 |

!!! warning "双夹爪上,**按单元**的那几项要带 `left_` / `right_` 前缀"
    上表按单夹爪写。`bi_taccap_gripper` 有两个单元,所以下面这几项在它上面是**每侧一个**——
    写成不带前缀的形式会因为没有这个字段而报错:

    | 单夹爪 | 双夹爪 |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | 同样加 `left_` / `right_` 前缀 |
    | `--robot.gripper_open_rad`、`--robot.tracker_to_ee_pos/_quat` | 同上 |

    其余的都是**两侧共用**一个开关:`--robot.enable_tactile`、`--robot.enable_tracker`、
    `--robot.tactile_*`、`--robot.wrist_camera_width/_height/_fps/_fourcc`、
    `--robot.head_camera_*`。

Pico4 Ultra 企业版追踪器上电后,6-DoF 位姿**自动录制**——追踪器按序列号末尾字母 `G` 前一个数字(单左双右)
自动匹配本单元侧别。

!!! tip "只录触觉 + 夹爪"
    加 `--robot.enable_tracker=false` 关闭位姿录制。

!!! tip "追踪器序列号不合规 / PC 服务枚举不稳"
    用 `--robot.tracker_serial=<SN>` 直接钉住序列号——**逐字使用**,不枚举、不校验
    (打错会在 connect 时报设备找不到)。留空(默认)则走自动发现。

### `--robot.id` 与硬件清单 {#robot-id}

两件事,回答的是两个不同的问题。

**`--robot.id` 是工位号**,**一套设备一个**——双夹爪算一套,不是两个。它标的是**工位**、
不是工位上装的硬件,所以换了夹爪也不用改。它会出现在日志前缀、标定文件名和下面的硬件清单里,
但**不是数据集里的一列**。

**填数字就行**,前缀按 `--robot.type` 自动补:

| 命令里写 | `--robot.type` | 实际存成 |
|---|---|---|
| `--robot.id=0` | `taccap_gripper`(单夹爪) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper`(双夹爪) | `bi_taccap_0` |

前缀是 `--robot.type` 已经说过的事,再手敲一遍只会敲错——双夹爪上写成 `--robot.id=taccap_0`,
标签就和实际设备类型对不上了,而这在数据里看不出来。**不是纯数字的一律原样保留**,
所以老命令里的 `--robot.id=taccap_0` 照样能用,对应的标定文件名也不会变。

**它是必填的**:漏填或填空会在**解析命令行时**就退出,还没碰到任何设备:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

这样做是为了不让一台设备**匿名**录完一批数据。编号本身不校验——**真正的身份是下面的序列号**,
所以按房间号之类命名也允许。

**硬件清单才是身份。**`lerobot-record` 在 `connect()` 之后立刻把
`meta/hardware.json` 写进数据集:每只夹爪的**固件 SN**,加上它上面两枚触觉传感器的 SN,
每枚都带着自己对应的观测键。

```json
{
  "robot_type": "bi_taccap_gripper",
  "robot_id": "bi_taccap_0",
  "role": "leader",
  "units": [
    {
      "side": "left",
      "gripper_sn": "TCGU01A24Z0001m",
      "tactile_sensors": [
        { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011" },
        { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012" }
      ]
    }
  ]
}
```

- `side` 是**哪只夹爪**,`finger` 是**这只夹爪上的哪一枚触觉**——两者都叫左右,而且是**互相独立**的
  ([单左双右](03-host-hardware.md#33)对夹爪 SN 和触觉 SN 各判一次)。所以每枚触觉还带上
  `observation_key`,数据集里的一列能直接回溯到具体哪一枚传感器,不必再自己套一遍命名规则。
- `gripper_sn` 是**固件 SN**(连接时向固件问的),不是 CH343 的 `mcu_serial`——后者标的是
  USB 串口芯片,换根转接就变了。
- 单夹爪写的是**同样的结构**,只是 `units` 里只有一项;读数据集的程序只需要一套代码。
- 某一侧夹爪没开时该项记 `"gripper_sn": null`(不是省略);`--robot.enable_tactile=false` 时
  `tactile_sensors` 为空列表。
- 它是**独立的一个文件**,不是 `meta/info.json` 里的一个键——后者的结构属于上游 lerobot。
- 用 `--resume` 在**换了硬件**的情况下续录时,原文件会被保留并打一条告警。已经录好的那些集
  确实来自原来那批设备,覆盖掉就等于把它们记错了;这条告警就是"这个数据集跨了两套硬件"的信号。

!!! note "追踪器和腕相机不在清单里"
    它们是**装上去的配件**;夹爪 + 它的两枚触觉才是这份数据讲的那个单元。

## 5.3 每帧记录内容 {#53}

| Key | 来源 | 由什么开启 | 形状 / 类型 |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | 追踪器 → EEF TCP 位置 | `--robot.enable_tracker`(默认 `true`) | float(m) |
| `tcp.r1`..`tcp.r6` | 同上,姿态的 6-D 旋转 | 同上 | float |
| `gripper.pos` | 夹爪编码器 | `--robot.enable_gripper`(默认 `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | 左右视触觉传感器 | **始终采集**,无开关 | uint8,约 `(400, 700, 3)` |
| `wrist_cam` | 腕部相机 | `--robot.enable_wrist_camera`(默认 `true`) | uint8 `(H, W, 3)` |
| `left_head` / `right_head` | 头显双目,**一只眼一个键** | `--robot.enable_head_camera`(默认 `false`) | uint8,默认 `(768, 1024, 3)` |
| `head_camera.x/y/z` | 头显位置(同 `tcp.*` 世界系),**也是动作** | 同上 | float(m) |
| `head_camera.r1..r6` | 头显姿态的 6-D 旋转,**也是动作** | 同上 | float |
| `imu.accel.{x,y,z}` | 夹爪 IMU 加速度 | `--robot.enable_imu`(默认 `false`,**预留不录**) | float(m/s²) |
| `imu.gyro.{x,y,z}` | 夹爪 IMU 角速度 | 同上 | float(rad/s) |
| `imu.mag.{x,y,z}` | 夹爪 IMU 磁力 | 同上 | float(µT) |

!!! note "6-D 旋转约定"
    记的是旋转矩阵 **R** 的**前两列**——**按列取,不是按行**:

    ```text
    R = ⎡ r1  r4  · ⎤     第一列 (r1,r2,r3) = 本体 X 轴在世界系下的方向
        ⎢ r2  r5  · ⎥     第二列 (r4,r5,r6) = 本体 Y 轴在世界系下的方向
        ⎣ r3  r6  · ⎦     第三列 = 前两列的叉积,可自行算回
    ```

    **R 的方向是「世界 ← 本体」**:它把夹爪本体坐标变换到世界系,所以两列读出来就是夹爪
    **X 轴**和 **Y 轴**在世界系下的单位方向。第三列(Z 轴)等于前两列叉积,因此 6 个数
    足以还原完整旋转,不必再存第三列。

    世界系是重力对齐的 **X 前 / Y 左 / Z 上**(见
    [启动与坐标系对齐](03-host-hardware.md#pico-frame))。`tcp.*` 与 `head_camera.*`
    用的是同一套约定。

!!! info "`tcp.*` 记的是夹爪末端,不是追踪器"
    追踪器拧在夹爪手柄上,它自己的位姿离**两指中点**约 195 mm。落盘前会乘上一个内置的
    刚性安装变换(取自 CAD 装配实测,左右各一套),所以 `tcp.*` 是 **EEF TCP 位姿**。

    该变换是**机体固连**的——随夹爪一起转,任意姿态下都成立,采集时朝哪个方向起手都行。
    TCP 取两指中点,对称张合时该点不动,因此与 `gripper.pos` 无关。
    想直观确认,把夹爪平放,看 Rerun `/world` 里的 EE 标记是否落在两指中点
    → [`/world` 3D 视图](#world-view)。

!!! tip "IMU 是预留能力,当前采集流程不录"
    夹爪自带 IMU,采集程序也支持记录,但**标准采集流程默认不开**——上表列出 `imu.*`
    是为了说明数据格式,按本手册采出来的数据集里**不会有这 9 列**。

    确实需要惯性数据时加 `--robot.enable_imu=true` 开启
    (双夹爪同样是这个开关,两侧一起生效,键名带 `left_` / `right_` 前缀)。

    开启后 `observation.state` 维度相应增加:单夹爪 10 → 19,双夹爪 20 → 38。
    不需要惯性数据就保持关闭,可少写 9 列。

**观测键调节**:

- **触觉** → `tactile_left` / `tactile_right`;校正图为横向 `(400,700,3)`(宽高自动推导,
  **别写死**)。用 `--robot.tactile_fps` / `--robot.tactile_output_types` 调;
  `--robot.enable_tactile=false` 可把触觉整条拿掉(见下方提示)。

!!! warning "`--robot.enable_tactile=false` 是排查开关,不要用它录数据"
    关掉后触觉**不发现、不落盘**,连观测键都没有——而触觉正是这只夹爪存在的理由,
    这样录出来的数据集缺了最主要的一路。

    它的用途是**把 USB 带宽问题拆成两半**:一条 USB 总线的带宽是有限的,双夹爪的
    四路触觉 + 两路腕相机可能超出预算,表现为**某一路相机打不开**、且每次挂的还不是同一路。
    这时分别关掉触觉、关掉腕相机各跑一次,就知道是不是带宽不够,而不是硬件时好时坏——
    见 [故障排查 · 某一路相机打不开](troubleshooting.md#usb-bandwidth)。

    要**少录一路**用别的开关:`--robot.enable_wrist_camera=false` 关腕相机、
    `--robot.enable_tracker=false` 关位姿。

!!! danger "落盘的是 `rectify`,不是你在 Rerun 里看到的那张图"
    两路触觉流**故意不同**:

    - **落盘** = `--robot.tactile_output_types`,默认 `rectify` ——**未做基线相减**的原图,
      保留传感器看到的全部信息。**只能填一个类型**(每个传感器对应数据集里一个视频键),
      填多个会直接报错并提示改用显示流。
    - **显示** = `--robot.tactile_display_output_types`,默认 `difference` ——相对传感器
      **初始化时刻基线**的增强差分图。这张图接触更易读,所以 Rerun 里给操作员看的是它;
      键名形如 `tactile_left_difference`,**不在** `observation_features` 里,不会落盘。

    差分图是**破坏性**的:基线在传感器 init 时抓取,所以**连接时压在胶上的任何力都会被
    整段采集减掉**。这就是它只用于显示、不进数据集的原因——不要为了"看着清楚"把
    `--robot.tactile_output_types` 改成 `difference`。

    `--robot.tactile_diff_gain`(默认 `1.0`)只影响显示流的增益。传感器出厂值 1.5 在本胶体上
    噪声偏大且会削顶;它同时放大信号与噪声,**不改变信噪比**,只是留出余量。
- **腕相机** → `wrist_cam`;`--robot.enable_wrist_camera=false` 跳过;
  `--robot.wrist_camera_width/_height/_fps` 调。
- **头显相机** → `left_head` / `right_head` + `head_camera.*`;**默认关闭**,
  `--robot.enable_head_camera=true` 开启,详见 [§5.6](#56)。
- **角色** → `--robot.role=follower` 绑定从夹爪(默认 `leader`)。

## 5.4 录制选项:流式编码与编码器预热 {#54}

视频键(触觉 + 腕相机)**在采集时实时编码**,而非先存 PNG 再在集尾编码,因此
**每集结束时几乎不用等**。默认开启(`--dataset.streaming_encoding=true`):

```bash
lerobot-record \
    --robot.type=taccap_gripper --robot.id=0 --robot.side=right \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.num_episodes=20 \
    --dataset.fps=30 \
    --dataset.push_to_hub=false \
    --dataset.reset_time_s=60 \
    --dataset.episode_time_s=120 \
    --dataset.single_task='Pick up the object' \
    --dataset.streaming_encoding=true \
    --dataset.encoder_threads=2 \
    --dataset.vcodec=auto
```

- 每个相机一个 `_CameraEncoderThread`,通过有界队列喂原始帧
  (`--dataset.encoder_queue_maxsize`,约 1 秒帧量);编码器跟不上时**丢弃最旧帧并告警**,
  不阻塞采集循环。
- `--dataset.vcodec=auto` 会优先启用可用的硬件编码。推荐采集主机配 NVIDIA GPU,
  这样可使用 GPU H.264 硬件编码器,降低多路视频实时编码时的 CPU 压力。
  **没有 NVIDIA GPU 的主机照样能录**,但要改一个参数,见下。

!!! note "编码器预热"
    每集开录前会先把编码器准备好,不占用第一帧的时间预算。这是自动的,不需要设置。

### 没有 NVIDIA GPU 的主机怎么录 {#no-gpu}

上面两个默认值(`--dataset.vcodec=auto` + `--dataset.streaming_encoding=true`)是按**装了
NVIDIA 显卡**来配的。纯 CPU 的服务器、虚拟机、没有独显的笔记本上,**把流式编码关掉**:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

**编码器不用管。**`--dataset.vcodec=auto`(默认)是**真的去开一次编码会话**来探测的,
所以没有 NVIDIA 驱动的机器上它会报告"没有硬件编码器"并回落到 `libsvtav1`
(CPU 上的 AV1,也是离线数据工具的默认编码器)。想让命令自带说明的话,显式写
`--dataset.vcodec=libsvtav1` 也完全可以。

**为什么要关流式编码。**流式编码是把编码放在采集主循环上跑——显卡上有专门的编码芯片,
CPU 只负责喂帧,所以划算;换成 `libsvtav1` 之后,**编码器就是 CPU 本身**,和采集循环抢同样的
核心。双夹爪一帧要处理六到八张图,而 30 fps 的预算只有 33.3 ms,于是先看到的就是
`[slow_frame] ... overrun=`。

关掉之后,帧在采集期间先写出来,到 `save_episode()` 再批量编码:**存盘慢且看得见,
采集准时**。这个取舍是对的——**存盘慢只是多等一会儿,采集掉帧丢的是补不回来的数据**。

!!! tip "确实想在多核服务器上继续开流式编码"
    两个旋钮值得知道:

    | 参数 | 默认 | 什么时候动它 |
    |---|---|---|
    | `--dataset.encoder_threads` | 自动 | 默认让编码器自己挑,在大机器上意味着 `libsvtav1` 会拿走采集需要的核。**每个编码器给 `2`** 是个稳妥上限 |
    | `--dataset.encoder_queue_maxsize` | `30` | 30 fps 下约 1 秒缓冲。它是反压阀:编码跟不上时在这里挡住,而不是让内存一直涨 |

!!! note "终端提示「建议把流式编码开回来」时"
    `--dataset.streaming_encoding=false` 时 `lerobot-record` 会打印一条提示,建议在硬件跟得上
    的机器上开回来。**没有 GPU 的主机就是跟不上的那一种**,这条提示不适用——关着是有意为之。

## 5.5 分集与复位 {#55}

- 一次运行采多集:`--dataset.num_episodes=N`。
- 集与集之间是**被动复位**:重新摆放设备,无需遥操。
- 录制过程中可用 lerobot 的键盘控制(重录当前集、提前结束等,按 `lerobot-record` 的通用约定)。

!!! tip "想采到"好数据"?"
    会跑命令只是第一步。务必阅读 [采集规范与最佳实践](best-practices.md)——坐标原点纪律、
    触觉接触、演示一致性、增量验证等,直接决定落盘数据的质量。

## 5.6 可选:头显相机(第一视角) {#56}

**默认关闭。**打开后录制 Pico4 Ultra 企业版**头显自带的双目相机**,以及头显自身的位姿——
也就是操作员的第一视角画面和"人在往哪看"。单夹爪(`taccap_gripper`)和双夹爪
(`bi_taccap_gripper`)都支持,开关和参数完全一样。

```bash
lerobot-record \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --robot.enable_tracker=true \
    --robot.enable_head_camera=true \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.single_task='Pick up the object' \
    --dataset.fps=30 \
    --dataset.push_to_hub=false
```

产出三组键:

| Key | 含义 |
|---|---|
| `left_head` / `right_head` | 头显相机画面,**一只眼一个视频键**,默认各 `(768, 1024, 3)` |
| `head_camera.x/y/z` | 头显位置(m);**同时进 action** |
| `head_camera.r1..r6` | 头显姿态,6-D 旋转(约定同 `tcp.*`);**同时进 action** |

!!! warning "`left_` / `right_` 在这里指的是**眼睛**,不是左右手"
    双夹爪上 `{side}_wrist`、`{side}_tcp.*` 是按**手臂**分左右的;但头显只有一个,
    `left_head` / `right_head` 指的是**头显的左眼 / 右眼**。同理:两个单夹爪进程同时开头显相机,
    拿到的是**同一个头显的同一路画面**,不是两个独立视角。

### 前置条件

1. **XenseVR PC Service ≥ v0.2.0**。更低版本不转发相机画面,见 [2.4 一键安装](02-environment.md)。
2. **头显 APP 正在推流**。相机和追踪器**共用同一条 SDK 连接**,所以头显必须已连上 PC Service
   (见 [3.5 启动 XenseVR PC Service](03-host-hardware.md#35))。反过来,关掉相机不会断开追踪器的
   连接,关掉追踪器也不会断开相机。

### 分辨率与录制单眼

`--robot.head_camera_width/_height` **只接受 `1024x768`(默认)和 `1280x960`**,填别的直接报错,
不会悄悄降级;首帧尺寸与配置不一致时同样报错——重采样会**悄悄改掉记录下来的视场角**。
两个尺寸都是 4:3,与传感器一致(PICO 的相机访问接口单帧上限 2328x1748,也是 4:3;
按 16:9 要画面,得到的是裁剪或拉伸,而不是更大的视场)。

!!! warning "头显里的「分辨率」和这两个参数必须一致"
    出画面的是头显,尺寸由 XTac-UMI XR 界面上的「**分辨率**」决定(默认 `1024`);命令行这两个
    参数只是**声明你预期收到什么**。两边对不上,connect 时就会因首帧尺寸不符报错。

    **在头显里把分辨率改成 `1280` 后,命令行也要跟着改**:

    ```bash
    --robot.head_camera_width=1280 \
    --robot.head_camera_height=960
    ```

    改回 `1024` 同理。两处一起改,不要只改一边。

只要一只眼时用 `--robot.head_camera_eyes=left`(或 `right`):JPEG 解码量和编码器压力都减半,
数据集里也只有一个头部视频键。

!!! danger "改分辨率或改录制的眼睛 = 换了一组数据"
    **变更前后的 episode 不能混用**——要改就在开录前定下来。

### 左右眼配对

两只眼是**两条独立消息**分别到达的,而且分成两个视频键之后,一旦配错在数据里**看不出任何痕迹**。
所以每帧都会比对两只眼的最新帧:帧序号相同就是确定的同一次曝光;序号不同则要求时间戳相差不超过
`--robot.head_camera_pair_max_skew_ms`(默认 20 ms,对比 30 fps 下约 33 ms 的帧周期)。
超出不会中断录制,而是打一条**限流的告警并给出实测偏差**——让问题看得见,而不是默默写进数据集。

### 位姿与可视化

`head_camera.*` 是**头显位姿**,并且已经重映射到与 `tcp.*` **相同的重力对齐世界系**
(用的是追踪器那套 Pico→world 变换)。这意味着头和手第一次可以直接比较、画在同一个 3D 场景里:
开 `--display_data=true` 时,`/world` 视图里会多出一个琥珀色的 `HEAD` 标记
(见 [`/world` 3D 视图](#world-view))。

!!! note "维度变化"
    开启后 `observation.state` 增加 9 维(头显位姿)。单夹爪 10 → 19,双夹爪 20 → 29。
    再叠加 `--robot.enable_imu=true` 时按各自规则继续累加。

下一步 → [采集规范与最佳实践](best-practices.md) → [数据集与示例](06-dataset.md)
