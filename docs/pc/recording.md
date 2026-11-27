# 数据采集

先用 `lerobot-teleoperate` 验证设备，再用 `lerobot-record` 录制 `LeRobotDataset`。落盘、校验与上传见[数据集](dataset.md)。

## 采集原理 {#51}

- `taccap_gripper` 录制自驱动，没有 `--teleop.*` 参数。
- 移位帧（shifted-frame）配对：*t-1* 步的观测配 *t* 步的位姿作动作（EEF TCP 位姿 + 归一化 `gripper.pos`，开[头显相机](#56)时加头显位姿），每集因此少 1 帧。
- `tcp.*` 是夹爪末端而非追踪器，由追踪器位姿经内置安装变换（左右各一套）得到；末端与追踪器位置的定义见 [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description)。
- 世界系重力对齐，X 前 / Y 左 / Z 上，在 XTac UMI XR 启动瞬间冻结，见[坐标系对齐](../common/pico4.md#pico-frame)。
- `--display_data=true` 开出 Rerun 的 `/world` 3D 视图（`--show_trajectory=false` 关轨迹），见[坐标系 · `/world` 3D 视图](../common/coordinates.md#world-view)。

## 开录前预览 {#preview}

`lerobot-teleoperate` 只预览不写数据，开关与录制相同，录哪档就预览哪档：

| 档 | 开关 | 需要 | 录到 |
|---|---|---|---|
| ① 只有夹爪 | `--robot.type=bi_taccap_gripper --robot.enable_tracker=false` | 不需要 PC Service | 触觉、腕相机、`gripper.pos`，没有 `tcp.*` |
| ② 带腕部位姿（最常用，本页默认） | `--robot.type=bi_taccap_gripper` | 追踪器已开机[绑定](../common/pico4.md#pico-tracker-bind)、Pico4 已连上、[PC Service 已启动](host-setup.md#35) | 再加 `tcp.*` 与 [`/world` 视图](../common/coordinates.md#world-view) |
| ③ 完全体 | `--robot.type=xtac_umi_g1` | 同 ②，PC Service ≥ v0.2.0 | 再加头显双目与位姿，见[头显相机](#56) |

```bash
lerobot-teleoperate \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --fps=30 \
    --display_data=true
```

- 双夹爪带不带头显由 `--robot.type` 决定；写了与之矛盾的 `--robot.enable_head_camera` 会报错并提示该用的类型。
- 单夹爪用 `--robot.type=taccap_gripper`，只接一只时自动选中，两只都接时须加 `--robot.side=left|right`。
- `--teleop_time_s=10` 跑满 10 秒自动退出；`--debug_timing=true` 打印采样耗时与相机路数。

逐项确认（位姿两行仅 ②③ 档）后 `Ctrl+C` 退出：

| 看什么 | 期望 |
|---|---|
| 左右两路触觉 | 有画面，按压时纹理明显变化 |
| 腕相机 | 有画面，无线缆或杂物遮挡 |
| `gripper.pos` | 张到底 1.0、闭合 0.0；顶不到 1.0 见[标定](calibration.md#413) |
| `/world` 里的 EE 标记与轨迹 | 平滑，不跳变不卡住；追踪器出头显视野或被遮挡即丢跟踪 |
| 双夹爪：左右两条轨迹 | 各自独立且对应正确 |

## 录制 {#52}

设备按序列号自动发现并各自匹配左右；换档、单夹爪写法同预览。

```bash
lerobot-record \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.num_episodes=1 \
    --dataset.fps=30 \
    --dataset.push_to_hub=false \
    --dataset.episode_time_s=120 \
    --dataset.reset_time_s=60 \
    --dataset.single_task='Pick up the object'
```

- Rerun 在独立线程显示，不占采集帧预算，跟不上只丢屏幕帧，结束时打印 `Rerun display: N/M frames dropped …`。
- 相机或夹爪编码器中途掉线（线松、hub 掉电）时，停止采集并存盘已录部分，打印 `Device lost mid-recording`，不写编造值。判掉线前沿用上一帧好值（相机约 2 秒、编码器约 1 秒），该集末尾一两秒可能是旧值，建议弃用；查线缆与 USB 口后 `--resume` 续录。

### 分集与复位 {#55}

`--dataset.num_episodes=N` 一次采多集，集间在 `--dataset.reset_time_s` 内重新摆放场景。录制中的键盘控制：

| 按键 | 作用 |
|---|---|
| → | 提前结束当前集；复位阶段按则提前结束复位 |
| ← | 放弃本集并重录；录制中或随后的复位阶段均可，之后照常给复位时间 |
| Esc | 当前集照常存盘后停止录制 |

键盘监听是全局的，在**任何窗口**（包括用左右键翻帧的 Rerun）按方向键都生效。

## 参数 {#params}

完整定义见 lerobot 官方[录制指南](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset)（lerobot 基线 0.5.1）。

### 数据集参数 `--dataset.*`

| 参数 | 默认 | 含义 |
|---|---|---|
| `repo_id` | 必填 | `<org>/<name>`，命名约定见[数据集](dataset.md#naming) |
| `single_task` | 必填 | 任务描述，写入 `meta/tasks`，如 `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | 本地存储目录 |
| `fps` | `30` | 采样帧率上限；传感器本身 120Hz（[规格](../product/specs.md#specs)） |
| `episode_time_s` | `120` | 每集时长（秒） |
| `reset_time_s` | `60` | 集间复位时长（秒） |
| `num_episodes` | `50` | 录制集数 |
| `video` | `true` | 编码为 mp4 视频 |
| `push_to_hub` | `false` | 上传 Hub，见[数据集](dataset.md#64) |
| `private` | `false` | Hub 私有仓库 |
| `tags` | 无 | Hub 标签 |
| `streaming_encoding` | `true` | 实时流式编码，见[流式编码](#54) |
| `vcodec` | `auto` | `h264`/`hevc`/`libsvtav1`/`auto`/硬件编码器 |
| `encoder_threads` | 自动 | 每个编码器实例的线程数 |
| `encoder_queue_maxsize` | `30` | 每相机缓冲帧数（~1s@30fps） |
| `video_encoding_batch_size` | `1` | 批量编码前累计集数（1=即时编码） |

### 录制控制（顶层参数）

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.type` | 必填 | `taccap_gripper`（单夹爪）/ `bi_taccap_gripper`（双夹爪）/ `xtac_umi_g1`（双夹爪 + 头显） |
| `robot.id` | 必填 | 工位号，见 [`--robot.id`](#robot-id) |
| `fps` | `30` | 主循环帧率，与 `--dataset.fps`（落盘采样率）分开，通常相同 |
| `display_data` | `false` | Rerun 显示相机画面与 3D 视图 |
| `show_trajectory` | `true` | Rerun 叠加 3D 位姿 + 轨迹（需 `display_data` 且有 `tcp.*`） |
| `display_compressed_images` | `false` | JPEG 压缩后显示，在显示线程上做；仅查看器在另一台机器（`--display_ip`）时划算 |
| `display_image_every_n` | `1` | 每 N 帧刷新相机画面（标量全速）；想自己决定丢哪些显示帧时用 |
| `play_sounds` | `true` | 语音播报；容器内无语音合成器总是静音，宿主机上跑才有声 |
| `resume` | `false` | 续录已有数据集；只在本地找，找不到报错，不从 Hub 下载；`--robot.id` 须与数据集一致 |

### 设备参数 `--robot.*`（RobotConfig） {#robotconfig}

| 配置项 | 默认 | 作用 |
|---|---|---|
| `robot.side` | 自动 | `left`/`right`；**单夹爪模式**两只都接着时必填 |
| `robot.role` | `leader` | `follower` 绑定从夹爪；固件须 ≥ 1.2.5 否则拒连，低于 1.2.11 提示升级，见[固件 OTA](versions.md#ota) |
| `robot.enable_tracker` | `true` | 关闭则无位姿，只录触觉 + 夹爪 |
| `robot.tracker_serial` | 未设 | 钉住追踪器 SN，绕过侧别规则、不校验，打错 connect 报找不到；序列号不合规或枚举不稳时用 |
| `robot.enable_wrist_camera` | `true` | 关闭腕相机 |
| `robot.wrist_camera_width/_height/_fps` | — | 腕相机分辨率/帧率 |
| `robot.wrist_camera_fourcc` | `MJPG` | MJPG 给触觉省 USB 带宽；`YUYV` 无压缩，带宽够才用 |
| `robot.wrist_undistort` | `false` | 落盘前矫正鱼眼，见[鱼眼矫正](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` 保持标定焦距，`1` 视野最大、黑边最多 |
| `robot.enable_head_camera` | `false` | **仅单夹爪**：录头显第一视角 + 位姿；双夹爪用 `--robot.type=xtac_umi_g1`，见[头显相机](#56) |
| `robot.head_camera_eyes` | `both` | `both` 每眼一键；`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `640` / `480` | **每只眼**尺寸，只接受 `640x480` / `1024x768` / `1280x960`，须与头显输出一致 |
| `robot.head_camera_fps` | `30` | 头显帧率 |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | 左右眼算同一次曝光的最大时差 |
| `robot.head_camera_startup_timeout_s` | `5.0` | connect 等首帧的秒数 |
| `robot.head_camera_stale_after_s` | `0.2` | 缓存帧超时即告警 |
| `robot.enable_tactile` | `true` | 关闭则不发现、不落盘触觉，**仅排查用**，见[下方警告](#53) |
| `robot.tactile_fps` | `30` | 触觉帧率 |
| `robot.tactile_output_types` | `["rectify"]` | **落盘**的触觉流，**只能填一个**，多填报错 |
| `robot.tactile_display_output_types` | `["rectify"]` | Rerun 显示流，**默认同落盘**（空列表等价）；`["difference"]` 加一路仅显示流 |
| `robot.tactile_diff_gain` | `1.0` | `difference` 图线性增益，**默认不起作用**；`None` 用出厂值 |
| `robot.expected_tactiles_per_side` | `2` | 每侧触觉枚数，不符即报错 |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | 夹爪本体读数 / IMU 通道 |
| `robot.gripper_stream_hz` | `100` | 主夹爪固件推送编码器（开启时含 IMU）读数的频率；`0` 为每帧轮询；推流失败回退轮询并告警 |
| `robot.gripper_open_rad` | `1.7` | **仅从夹爪用**；主夹爪用固件实测行程上限，未标定拒绝连接，见[夹爪标定](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | 覆盖追踪器到夹爪末端的平移；`None` = 内置值（与 [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description) 一致） |
| `robot.tracker_to_ee_quat` | `None` | 覆盖追踪器到夹爪末端的旋转 |
| `robot.tracker_wait_timeout` | `10.0` | 等待追踪器数据的秒数 |

!!! warning "双夹爪上，按单元的那几项要带 `left_` / `right_` 前缀"
    上表按单夹爪写，完整字段见主仓库设备说明。`bi_taccap_gripper` 下这几项每侧一个，不带前缀报字段不存在：

    | 单夹爪 | 双夹爪 |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | 同样加 `left_` / `right_` 前缀 |
    | `--robot.gripper_open_rad`、`--robot.tracker_to_ee_pos/_quat` | 同上 |

    其余两侧共用：`--robot.enable_tactile`、`--robot.enable_tracker`、`--robot.tactile_*`、`--robot.wrist_camera_width/_height/_fps/_fourcc`、`--robot.head_camera_*`、`--robot.gripper_stream_hz`。

### `--robot.id` 与硬件清单 {#robot-id}

`--robot.id` 必填，是工位号，一套设备（双夹爪算一套）一个，换夹爪不用改；用于日志前缀、标定文件名和硬件清单，不是数据集的列。填数字，前缀按 `--robot.type` 自动补：

| 命令里写 | `--robot.type` | 实际存成 |
|---|---|---|
| `--robot.id=0` | `taccap_gripper`（单夹爪） | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper`（双夹爪） | `bi_taccap_0` |
| `--robot.id=0` | `xtac_umi_g1`（双夹爪 + 头显） | `xtac_umi_g1_0` |

勿手敲前缀：非纯数字原样保留，`--robot.id=taccap_0` 仍可用，但双夹爪上与设备类型不符。漏填或留空时解析命令行即退出：

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

设备身份靠硬件清单：`lerobot-record` 在 `connect()` 后立即写入 `meta/hardware.json`，记每只夹爪的固件 SN 及其两枚触觉的 SN（各带观测键）。

```json
{
  "robot_type": "bi_taccap_gripper",
  "robot_id": "bi_taccap_0",
  "epochs": [
    {
      "from_episode": 0,
      "to_episode": null,
      "recorded_at": "2026-08-22T16:03:09+08:00",
      "robot_id": "bi_taccap_0",
      "role": "leader",
      "units": [
        {
          "side": "left",
          "gripper_sn": "TCGU01A24Z0001m",
          "tactile_sensors": [
            { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011" },
            { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012" }
          ],
          "wrist_undistort": { "applied": false }
        }
      ]
    }
  ]
}
```

- `side` 是哪只夹爪，`finger` 是其上哪枚触觉，各按[单左双右](host-setup.md#33)判定；`observation_key` 把数据集的一列对应到具体传感器。
- `gripper_sn` 是固件 SN，不是 CH343 的 `mcu_serial`（换根转接就变）。
- 单夹爪 `units` 仅一项；未启用侧记 `"gripper_sn": null`；`--robot.enable_tactile=false` 时 `tactile_sensors` 为空列表。
- 独立文件，不在 `meta/info.json` 里；追踪器和腕相机是配件，不入清单。
- `wrist_undistort` 记是否矫正、用哪份内参，见[鱼眼矫正](#57)。

`epochs` 让一个数据集跨几套硬件：

- 每段记 `from_episode` / `to_episode`（左闭右开，同 `dataset_from_index` / `dataset_to_index`）和 `recorded_at`，在录段 `to_episode` 为 `null`。
- `--resume` 时同一套设备不记新段；换了夹爪或传感器，旧段在当前集数处封口并接新段。
- `--robot.type` 对不上是换数据集而非换硬件，保留原文件并告警。`bi_taccap_gripper` ↔ `xtac_umi_g1`（加或去头显）同样算换数据集，更早版本在 `bi_taccap_gripper` 下开头显录的也续不上，都要换一个 `--dataset.repo_id`。
- 老数据集（扁平 `units`）读成一个开口 epoch，仅表示"没有证据换过硬件"。

**一个数据集只属于一个工位**：`--resume` 时 `--robot.id` 与记录不符，会在连接设备前拒绝续录（报错带 `refusing to resume it`）。回原工位续录或换个 `--dataset.repo_id`；没记工位号的老数据集不受限。

!!! note "触觉的衍生通道只靠数据集本身就能重建"
    depth / force / difference 由落盘的 `rectify` 流算出：参考图是每个 episode 的第一帧 `rectify`，其余参数由传感器型号决定，不用找实物。旧数据集里的 `meta/runtimes/` 和传感器条目的 `runtime` 字段会被忽略。

## 每帧记录内容 {#53}

| Key | 来源 | 由什么开启 | 形状 / 类型 |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | 追踪器 → EEF TCP 位置 | `--robot.enable_tracker`（默认 `true`） | float(m) |
| `tcp.r1`..`tcp.r6` | 同上，姿态的 6-D 旋转 | 同上 | float |
| `gripper.pos` | 夹爪编码器 | `--robot.enable_gripper`（默认 `true`） | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | 左右视触觉传感器 | 默认采集；`--robot.enable_tactile=false` 仅排查用，见下方警告 | uint8，约 `(400, 700, 3)`，宽高自动推导勿写死 |
| `wrist_cam` | 腕部相机 | `--robot.enable_wrist_camera`（默认 `true`） | uint8 `(H, W, 3)` |
| `head_left` / `head_right` | 头显双目，一只眼一个键 | `--robot.type=xtac_umi_g1`（单夹爪为 `--robot.enable_head_camera=true`） | uint8，默认 `(480, 640, 3)` |
| `head.x/y/z` | 头显位置（同 `tcp.*` 世界系），也是动作 | 同上 | float(m) |
| `head.r1..r6` | 头显姿态 6-D 旋转，也是动作 | 同上 | float |
| `imu.accel.{x,y,z}` | 夹爪 IMU 加速度 | `--robot.enable_imu`（默认 `false`，预留不录） | float(m/s²) |
| `imu.gyro.{x,y,z}` | 夹爪 IMU 角速度 | 同上 | float(rad/s) |
| `imu.mag.{x,y,z}` | 夹爪 IMU 磁力 | 同上 | float(µT) |

6-D 旋转按列（不是按行）取旋转矩阵 R（「世界 ← 本体」）的前两列，`tcp.*` 与 `head.*` 相同：

```text
R = ⎡ r1  r4  · ⎤     第一列 (r1,r2,r3) = 本体 X 轴在世界系下的方向
    ⎢ r2  r5  · ⎥     第二列 (r4,r5,r6) = 本体 Y 轴在世界系下的方向
    ⎣ r3  r6  · ⎦     第三列 = 前两列的叉积,可自行算回
```

`observation.state` 维数：单夹爪 10、双夹爪 20；开头显各加 9（19 / 29）；加 `--robot.enable_imu=true`（双夹爪两侧一起生效，键名带 `left_` / `right_` 前缀）单夹爪再加 9、双夹爪再加 18（不开头显时为 19 / 38）。

!!! warning "`--robot.enable_tactile=false` 是排查开关，不要用它录数据"
    关掉后触觉不发现、不落盘、无观测键，只用于对半排查 USB 带宽，见[某一路相机打不开](troubleshooting.md#usb-bandwidth)。要少录一路用 `--robot.enable_wrist_camera=false` 或 `--robot.enable_tracker=false`。

!!! tip "默认情况下，Rerun 里看到的就是落盘的那张图"
    - 落盘 `--robot.tactile_output_types` 与显示 `--robot.tactile_display_output_types` 默认都是 `rectify`（未做基线相减的原图），每帧只读一次，屏幕与数据集同一张图。
    - 显示改成别的类型，同一次读取会多出一路只显示不落盘的流，键名如 `tactile_left_difference`，不在 `observation_features` 里。

    `difference` 是相对 init 时基线的增强差分图。要开启（`--robot.tactile_display_output_types='["difference"]'`）注意：

    - 差分是破坏性的：连接时压在胶上的力会被整段减掉，四枚指尖连接时须空载。
    - 不要为了看着清楚把 `--robot.tactile_output_types` 改成 `difference`。
    - `--robot.tactile_diff_gain` 不请求 `difference` 时无效；出厂值 1.5 在本胶体上噪声大且削顶。

## 流式编码 {#54}

视频键采集时实时编码（`--dataset.streaming_encoding=true`，默认开启），不在集尾从 PNG 编码，每集结束几乎不用等。

- 每相机一个编码线程，经有界队列（`--dataset.encoder_queue_maxsize`，约 1 秒帧量）喂原始帧；队列满时最多等 0.1 秒，仍满则丢当前帧并告警 `Encoder queue full … dropped N frame(s)`，不阻塞采集。
- 存盘是事务式的：失败或中途 Ctrl+C 都回滚到上一集，不留半条 episode，可直接 `--resume`。
- `--dataset.vcodec=auto` 优先用硬件编码，由 NVIDIA GPU 的 H.264 编码分担 CPU 压力；需要时用 `--dataset.encoder_threads=2` 限制每个编码器的线程数。
- 编码器预热自动完成：每集开录前就绪，不占第一帧的时间预算。

### 没有 NVIDIA GPU 的主机怎么录 {#no-gpu}

!!! warning "这是给不达标机器的临时办法，不是推荐做法"
    纯 CPU 服务器、虚拟机或无 NVIDIA 显卡的笔记本（低于[采集主机最低要求](install.md#host-spec)）按下面操作可以录制，但存盘慢、易掉帧，正式采集请换用达标主机。须先升级到 v0.1.0。

关掉流式编码：

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

- `--dataset.vcodec=auto` 会实际开一次编码会话探测，无 NVIDIA 驱动时回落到 `libsvtav1`（CPU 上的 AV1）；离线编辑重新编码同理（有 NVIDIA 用 `h264_nvenc`）。也可显式写 `--dataset.vcodec=libsvtav1`。
- `libsvtav1` 让 CPU 既编码又采集，30fps 预算仅 33.3ms，会出现 `[slow_frame] ... overrun=`。关掉流式编码后在 `save_episode()` 批量编码，存盘慢只是多等，掉帧则补不回来；忽略"建议把流式编码开回来"的提示。

多核服务器仍想开流式编码，调这两项：

| 参数 | 默认 | 什么时候动它 |
|---|---|---|
| `--dataset.encoder_threads` | 自动 | 大机器上 `libsvtav1` 会抢走采集要用的核，每个编码器给 `2` 是稳妥上限 |
| `--dataset.encoder_queue_maxsize` | `30` | 约 1 秒缓冲（30fps）的反压阀，编码跟不上时在此挡住，内存不再上涨 |

## 采集规范 {#practice}

先采 5~10 条，用 [`lerobot-check-dataset`](dataset.md#62) 校验并回放抽查，再规模化采集。一集一次完整演示，不要塞多次尝试；同一任务的演示节奏尽量一致。

| 维度 | 好 | 坏样本症状 | 规避 |
|---|---|---|---|
| 完整性 | 接近 → 抓取 → 操作 → 完成 | 中途中断 | 自然收尾 |
| 平稳性 | 手持平稳匀速 | 急停急转，IMU/位姿噪声大 | 匀速带动 |
| 触觉信号 | 抓取时真实接触、有形变 | 空抓，触觉图无信号（触觉是核心模态，空抓价值很低） | 看 Rerun 触觉确认接触 |
| 相机可见 | 目标在腕相机视野内，光照稳定 | 手/线缆遮挡，或过曝/频闪 | 清理遮挡、调手持角度 |
| 坐标一致 | 与其它集同一原点 | 中途重启 XTac UMI XR，位姿集间跳变 | 全程不重启 XTac UMI XR；不得不重启时，之后的数据当作新数据集（[原因](../common/pico4.md#pico-frame)） |
| 夹爪读数 | `gripper.pos` 闭合≈0、张开合理 | 未标定，闭合时 `gripper.pos`≠0 | 双夹爪两侧都标，见[夹爪标定](calibration.md#41) |
| 丢帧 | 无告警 | 日志丢帧告警 | 增大 `encoder_threads`、`vcodec=auto`，见[流式编码](#54) |
| 首帧 | 动作起点正常 | 关键动作落在被丢的首帧 | 开录后稳 0.5~1 秒再动 |

- **一致与多样**：任务定义（`--dataset.single_task`）、动作意图、坐标原点保持一致；物体初始位姿/位置、抓取点、光照适度变化。一个数据集只放一个任务/变体，见[命名规范](dataset.md#naming)。
- **集时长**：`--dataset.episode_time_s` 给够但别过长，否则产生大量无效尾帧。
- **台账**：每份数据集记一行[采集台账](dataset.md#ledger)。

每次开录前自查：

- [ ] 已[预览](#preview)：`scan_grippers` 输出正常，追踪器有电、有位姿、轨迹正常
- [ ] 闭合时 `gripper.pos`≈0
- [ ] 走有线时数采电脑 WiFi 已关（见[网络连接](../common/pico4.md#pico-network)）
- [ ] 抓取时触觉图有信号，腕相机视野无遮挡
- [ ] `single_task` 与本数据集一致
- [ ] 磁盘空间充足（见[存储规划](dataset.md#storage-planning)）
- [ ] 采集期间未重启 XTac UMI XR，无丢帧告警

## 可选：头显相机 {#56}

录 Pico4 Ultra 企业版头显的双目画面与位姿（操作员第一视角），产出 `head_left` / `head_right` 与 `head.*`（见[每帧记录内容](#53)），后者同时进 action。双夹爪用 `--robot.type=xtac_umi_g1`，单夹爪 `taccap_gripper` 加 `--robot.enable_head_camera=true`，下列参数两者通用。

```bash
lerobot-record \
    --robot.type=xtac_umi_g1 \
    --robot.id=0 \
    --display_data=false \
    --dataset.repo_id=<your_org>/<your_dataset> \
    --dataset.single_task='Pick up the object' \
    --dataset.fps=30 \
    --dataset.push_to_hub=false
```

- `left_` / `right_` 指头显左右眼，不是左右手（`{side}_wrist`、`{side}_tcp.*` 才按手分）；两个单夹爪进程同开头显相机，拿到同一路画面。
- 前置条件：XenseVR PC Service ≥ v0.2.0（更低版本不转发画面）；头显 APP 正在推流并已连上 [PC Service](host-setup.md#35)。相机和追踪器共用一条 SDK 连接，关掉一个不断开另一个。
- `--robot.head_camera_eyes=left`（或 `right`）只录一只眼，解码与编码压力减半，只有一个头部视频键。
- 改分辨率或录制的眼睛等于换一组数据，前后 episode 不能混用。
- 左右眼是两条独立消息，每帧比对两眼最新帧：帧序号相同即同一曝光，否则时间戳差须不超过 `--robot.head_camera_pair_max_skew_ms`（默认 20ms，30fps 帧周期约 33ms）；超出只限流告警（含实测偏差），录制继续。
- `head.*` 用追踪器的 Pico→world 变换映射到 `tcp.*` 的世界系。

!!! warning "头显的分辨率和 `--robot.head_camera_width/_height` 必须一致"
    只接受 `640x480`（默认）、`1024x768`、`1280x960` 三档。XTac UMI XR 默认每眼输出 640x480，与采集端默认一致，不用加参数；命令行参数只声明预期。

    - 填别的或首帧尺寸与配置不符都会报错（后者在 connect 时），不会悄悄重采样改掉视场角。
    - 三档都是 4:3，同传感器（PICO 相机接口单帧上限 2328x1748 也是 4:3），16:9 只会裁剪或拉伸。
    - 要更高分辨率请联系[技术支持](../common/reference.md#support)在头显上调整，并同步改这两个参数。

连不上见[故障排查](troubleshooting.md#head-camera)。

## 可选：腕相机鱼眼矫正 {#57}

腕相机是 190° 鱼眼，默认记录原始帧。`--robot.wrist_undistort=true` 在写入前使用本夹爪内参矫正，`--robot.wrist_undistort_balance` 调整视野。旧版仅支持 640×480。SDK 0.5.0 与夹爪固件 1.3.1 支持 640×480 和 1920×1080 的独立标定，首次使用 1080p 前须完成对应分辨率的标定。

!!! warning "开与不开，录出来的是两种数据，而且看不出来"
    矫正与原始的 `wrist_cam` 形状、dtype 相同，混用无提示，所以录制时记入 [`meta/hardware.json`](#robot-id) 的每个 unit（没矫正记 `{"applied": false}`）：

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` 是 `"unit"`（本机标定）或 `"reference"`（SDK 参考值）；中途改设置会另起 epoch。一个数据集只用一种。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

以下情况不会失败，而是回退到 SDK 内置参考内参，告警 `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate`，清单里记 `"calibration": "reference"`：

- 从未标定（`read_fisheye()` 返回 `None`）。
- 固件回了全零记录（1.1.1 与 1.2.2 都会）：须用 `is_usable_fisheye_cal()` 判断而非 `is None`，否则 `fx = fy = 0` 的重映射表输出纯黑图且不报错。
- 固件早于命令集 V2.0。

代码里优先用 `Calibration::resolve_fisheye_for(宽, 高)`（返回 `(calibration, is_reference, reason)`）而不是 `read_fisheye()`。SDK 0.5.0 + 固件 1.3.1 起，640×480 与 1920×1080 的内参各存一份、按相机分辨率选用；夹爪只有另一种分辨率的标定时报错，不回退到参考内参，见 [SDK · 腕部相机与鱼眼矫正](../sdk/index.md#camera)。

- **参考值只用于预览**：不能替代设备实际标定。要在矫正图上做测量或视觉标定，请使用设备在当前分辨率下的实际内参。按 [SDK 鱼眼标定说明](../sdk/index.md#camera)写入并核对对应分辨率的标定。
- **矫正后画面偏心、略倾斜不代表标定错**：去畸变绕主点而非画幅中心，传感器未必在光心上（实测一台 `cx = 359.1`，爪尖中点 x = 360.1，差约 1 像素）。别改 `cx`，改回 320 更偏且引入倾斜。
