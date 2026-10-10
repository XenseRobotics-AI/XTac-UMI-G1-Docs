# 数据采集

先用 `lerobot-teleoperate` 确认设备正常，再用 `lerobot-record` 录出 `LeRobotDataset`。落盘、目录结构、校验与上传见[数据集](dataset.md)。

## 采集原理 {#51}

- `taccap_gripper` 录制自驱动，没有 `--teleop.*` 参数。
- 移位帧（shifted-frame）配对：*t-1* 步的观测配 *t* 步的位姿作动作（EEF TCP 位姿 + 归一化 `gripper.pos`，开[头显相机](#56)时加头显位姿），每集因此少 1 帧。
- `tcp.*` 是夹爪末端而非追踪器：追踪器离两指中点约 195mm，落盘前乘上内置刚性安装变换（CAD 装配实测，左右各一套），机体固连，与姿态和 `gripper.pos` 无关。
- 世界系重力对齐，X 前 / Y 左 / Z 上，在 XTac-UMI XR 启动瞬间冻结，见[坐标系对齐](../common/pico4.md#pico-frame)。
- `--display_data=true` 开出 Rerun 的 `/world` 3D 视图（`--show_trajectory=false` 关轨迹），元素含义与装配检查见[坐标系 · `/world` 3D 视图](../common/coordinates.md#world-view)。

## 开录前预览 {#preview}

`lerobot-teleoperate` 只预览不写数据，开关与录制相同，录哪档就预览哪档：

| 档 | 开关 | 需要 | 多出 |
|---|---|---|---|
| ① 只有夹爪 | `--robot.type=bi_taccap_gripper --robot.enable_tracker=false` | 不需要 PC Service | 触觉两路、腕相机、`gripper.pos`，没有 `tcp.*` |
| ② 带腕部位姿（最常用，本页默认） | `--robot.type=bi_taccap_gripper`（追踪器默认开启） | 追踪器已开机[绑定](../common/pico4.md#pico-tracker-bind)、Pico4 已连上、[PC Service 已启动](host-setup.md#35) | [`/world` 视图](../common/coordinates.md#world-view) / `tcp.*` |
| ③ 完全体 | `--robot.type=xtac_umi_g1` | 同 ②，PC Service ≥ v0.2.0 | 头显双目与头部位姿，见[头显相机](#56) |

按 ② 档预览：

```bash
lerobot-teleoperate \
    --robot.type=bi_taccap_gripper \
    --robot.id=0 \
    --fps=30 \
    --display_data=true
```

- 双夹爪带不带头显由 `--robot.type` 决定；写了与之矛盾的 `--robot.enable_head_camera` 会报错并提示该用的类型。
- 单夹爪用 `--robot.type=taccap_gripper`，只接一只时自动选中，两只都接时加 `--robot.side=left|right`（只录一只则必填）。
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

- Rerun 在独立线程显示，开着 `--display_data` 不占采集帧预算，跟不上只丢屏幕帧，结束时打印 `Rerun display: N/M frames dropped …`。
- 显式写出 `fps=30`、`episode_time_s=120`、`reset_time_s=60`、`push_to_hub=false`，不依赖默认值。
- 相机或夹爪编码器中途掉线（线松、hub 掉电）时，停止采集并存盘已录部分，打印 `Device lost mid-recording`，不写编造值。判掉线前沿用上一帧好值（相机约 2 秒、编码器约 1 秒），该集末尾一两秒可能是旧值，建议弃用；查线缆与 USB 口（见[故障排查](troubleshooting.md)）后 `--resume` 续录。

### 参数 {#params}

完整定义见 lerobot 官方[录制指南](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset)（lerobot 基线 0.5.1）。

**数据集参数 `--dataset.*`**

| 参数 | 默认 | 含义 |
|---|---|---|
| `repo_id` | 必填 | `<org>/<name>`，约定 `<org>/<任务>_<变体>_<YYYYMMDD>`，如 `Xense/insert_plug_left_20260703`，见[数据集](dataset.md) |
| `single_task` | 必填 | 任务描述，写入 `meta/tasks`，如 `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | 本地存储目录，见[数据集](dataset.md) |
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

**录制控制（顶层参数）**

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.type` | 必填 | `taccap_gripper`（单夹爪）/ `bi_taccap_gripper`（双夹爪）/ `xtac_umi_g1`（双夹爪 + 头显） |
| `robot.id` | 必填 | 工位号，填数字（`0` / `1`…），前缀自动补；漏填报错，见 [`--robot.id`](#robot-id) |
| `fps` | `30` | 主循环帧率，与 `--dataset.fps`（落盘采样率）分开，通常相同 |
| `display_data` | `false` | Rerun 显示相机画面与 3D 视图 |
| `show_trajectory` | `true` | Rerun 叠加 3D 位姿 + 轨迹（需 `display_data` 且有 `tcp.*`） |
| `display_compressed_images` | `false` | JPEG 压缩后显示，在显示线程上做；仅查看器在另一台机器（`--display_ip`）时划算 |
| `display_image_every_n` | `1` | 每 N 帧刷新相机画面（标量全速）；想自己决定丢哪些显示帧时用 |
| `play_sounds` | `true` | 语音播报；容器内无语音合成器总是静音，宿主机上跑才有声 |
| `resume` | `false` | 续录已有数据集；只在本地找，找不到报错，不从 Hub 下载；`--robot.id` 须与数据集一致，见 [`--robot.id`](#robot-id) |

**设备参数 `--robot.*`（XTac-UMI G1 专属）**

只列本页用到的项，完整配置项见 [`RobotConfig` 常用配置项](reference.md#robotconfig)。

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.side` | 自动 | `left`/`right`，单夹爪两只都接着时必填 |
| `robot.role` | `leader` | 填 `follower` 绑定从夹爪；固件须 ≥ 1.2.5 否则拒连，低于 1.2.11 提示升级，见[固件 OTA](versions.md#ota) |
| `robot.gripper_stream_hz` | `100` | 主夹爪固件推送编码器（开启时含 IMU）读数的频率，`0` 为每帧轮询；推流失败回退轮询并告警；双夹爪共用，不带前缀 |
| `robot.enable_tracker` | `true` | 关则无位姿 |
| `robot.enable_head_camera` | `false` | 仅单夹爪 `taccap_gripper`：录头显；双夹爪改用 `--robot.type=xtac_umi_g1`，见[头显相机](#56) |
| `robot.head_camera_eyes` | `both` | `both` 两眼（两个键），`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `640` / `480` | 每眼尺寸，须与头显输出一致（默认 640x480），见[头显相机](#56) |
| `robot.wrist_undistort` | `false` | 落盘前矫正鱼眼，见[鱼眼矫正](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` 保持标定焦距，`1` 视野最大、黑边最多 |

!!! warning "双夹爪上，按单元的那几项要带 `left_` / `right_` 前缀"
    本页参数按单夹爪写；`bi_taccap_gripper` 下这几项每侧一个，不带前缀报字段不存在：

    | 单夹爪 | 双夹爪 |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | 同样加 `left_` / `right_` 前缀 |
    | `--robot.gripper_open_rad`、`--robot.tracker_to_ee_pos/_quat` | 同上 |

    其余两侧共用：`--robot.enable_tactile`、`--robot.enable_tracker`、`--robot.tactile_*`、`--robot.wrist_camera_width/_height/_fps/_fourcc`、`--robot.head_camera_*`。

追踪器上电即录 6-DoF 位姿，按序列号末尾 `G` 前一位数字（[单左双右](host-setup.md#33)）匹配侧别；序列号不合规或枚举不稳时用 `--robot.tracker_serial=<SN>` 钉住。

### `--robot.id` 与硬件清单 {#robot-id}

`--robot.id` 是工位号，一套设备（双夹爪算一套）一个，换夹爪不用改；用于日志前缀、标定文件名和硬件清单，不是数据集的列。前缀按 `--robot.type` 自动补：

| 命令里写 | `--robot.type` | 实际存成 |
|---|---|---|
| `--robot.id=0` | `taccap_gripper`（单夹爪） | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper`（双夹爪） | `bi_taccap_0` |
| `--robot.id=0` | `xtac_umi_g1`（双夹爪 + 头显） | `xtac_umi_g1_0` |

不要手敲前缀：非纯数字原样保留，`--robot.id=taccap_0` 仍可用，但在双夹爪上会与设备类型对不上。漏填或填空在解析命令行时退出：

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

身份靠硬件清单：`lerobot-record` 在 `connect()` 后立即写入 `meta/hardware.json`，记每只夹爪的固件 SN 及其两枚触觉的 SN（各带观测键）。

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

- `side` 是哪只夹爪，`finger` 是其上哪枚触觉，各按[单左双右](host-setup.md#33)判定。
- `observation_key` 把数据集的一列对应到具体传感器。
- `gripper_sn` 是固件 SN，不是 CH343 的 `mcu_serial`（换根转接就变）。
- 单夹爪 `units` 只有一项；某侧没开记 `"gripper_sn": null`；`--robot.enable_tactile=false` 时 `tactile_sensors` 为空列表。
- 独立文件，不在 `meta/info.json` 里；追踪器和腕相机是配件，不入清单。
- `wrist_undistort` 记是否矫正、用哪份内参，没矫正记 `{"applied": false}`，见[鱼眼矫正](#57)。

`epochs` 让一个数据集跨几套硬件：

- 每段记 `from_episode` / `to_episode`（左闭右开，同 `dataset_from_index` / `dataset_to_index`）和 `recorded_at`，在录段 `to_episode` 为 `null`。
- `--resume` 时同一套设备不记新段；换了夹爪或传感器，旧段在当前集数处封口并接新段。
- `--robot.type` 对不上是换数据集而非换硬件，保留原文件并告警。
- `bi_taccap_gripper` ↔ `xtac_umi_g1`（加或去头显）同样算换数据集，更早版本在 `bi_taccap_gripper` 下开头显录的也续不上，都要换一个 `--dataset.repo_id`。
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
| `left_head` / `right_head` | 头显双目，一只眼一个键 | `--robot.type=xtac_umi_g1`（单夹爪为 `--robot.enable_head_camera=true`） | uint8，默认 `(480, 640, 3)` |
| `head_camera.x/y/z` | 头显位置（同 `tcp.*` 世界系），也是动作 | 同上 | float(m) |
| `head_camera.r1..r6` | 头显姿态的 6-D 旋转，也是动作 | 同上 | float |
| `imu.accel.{x,y,z}` | 夹爪 IMU 加速度 | `--robot.enable_imu`（默认 `false`，预留不录） | float(m/s²) |
| `imu.gyro.{x,y,z}` | 夹爪 IMU 角速度 | 同上 | float(rad/s) |
| `imu.mag.{x,y,z}` | 夹爪 IMU 磁力 | 同上 | float(µT) |

6-D 旋转按列（不是按行）取旋转矩阵 R（「世界 ← 本体」）的前两列，`tcp.*` 与 `head_camera.*` 相同：

```text
R = ⎡ r1  r4  · ⎤     第一列 (r1,r2,r3) = 本体 X 轴在世界系下的方向
    ⎢ r2  r5  · ⎥     第二列 (r4,r5,r6) = 本体 Y 轴在世界系下的方向
    ⎣ r3  r6  · ⎦     第三列 = 前两列的叉积,可自行算回
```

IMU 这 9 列默认不录，需要时加 `--robot.enable_imu=true`（双夹爪两侧一起生效，键名带 `left_` / `right_` 前缀），`observation.state` 单夹爪 10 → 19，双夹爪 20 → 38。

!!! warning "`--robot.enable_tactile=false` 是排查开关，不要用它录数据"
    关掉后触觉不发现、不落盘、无观测键，只用于对半排查 USB 带宽（某路相机打不开且每次不同），见[某一路相机打不开](troubleshooting.md#usb-bandwidth)。要少录一路用 `--robot.enable_wrist_camera=false` 或 `--robot.enable_tracker=false`。

!!! tip "默认情况下，Rerun 里看到的就是落盘的那张图"
    - 落盘：`--robot.tactile_output_types`，默认 `rectify`（未做基线相减的原图），只能填一个，多填报错。
    - 显示：`--robot.tactile_display_output_types`，默认同为 `rectify`（`'[]'` 等价），每帧只读一次，屏幕与数据集同一张图。
    - 显示改成别的类型，同一次读取会多出一路只显示不落盘的流，键名如 `tactile_left_difference`，不在 `observation_features` 里。

    `difference` 是相对 init 时基线的增强差分图。要开启（`--robot.tactile_display_output_types='["difference"]'`）注意：

    - 差分是破坏性的：连接时压在胶上的力会被整段减掉，四枚指尖连接时须空载。
    - 不要为了看着清楚把 `--robot.tactile_output_types` 改成 `difference`。
    - `--robot.tactile_diff_gain`（默认 `1.0`）是差分图增益，不请求 `difference` 时无效；出厂值 1.5 在本胶体上噪声大且削顶。

## 录制选项：流式编码与编码器预热 {#54}

视频键（触觉 + 腕相机）采集时实时编码，不在集尾从 PNG 编码，每集结束几乎不用等，默认开启（`--dataset.streaming_encoding=true`）：

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

- 每相机一个编码线程，经有界队列（`--dataset.encoder_queue_maxsize`，约 1 秒帧量）喂原始帧；队列满时最多等 0.1 秒，仍满则丢当前帧并告警 `Encoder queue full … dropped N frame(s)`，不阻塞采集。
- 存盘是事务式的：失败或中途 Ctrl+C 都回滚到上一集，不留半条 episode，可直接 `--resume`。
- `--dataset.vcodec=auto` 优先用硬件编码；推荐配 NVIDIA GPU，由 GPU H.264 编码分担 CPU 压力。
- 编码器预热自动完成：每集开录前就绪，不占第一帧的时间预算。

### 没有 NVIDIA GPU 的主机怎么录 {#no-gpu}

!!! warning "这是给不达标机器的临时办法，不是推荐做法"
    [采集主机最低要求](install.md#host-spec)是 NVIDIA RTX 3060 / 8GB 显存及以上。纯 CPU 服务器、虚拟机或无 NVIDIA 显卡的笔记本按下面做能录，但存盘慢、易掉帧，正式采集请换达标主机。

这类机器须先升级到 v0.1.0。

`--dataset.vcodec=auto` + `--dataset.streaming_encoding=true` 两个默认值是给 NVIDIA 显卡的，没有显卡时关掉流式编码：

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

`--dataset.vcodec=auto` 会实际开一次编码会话探测，无 NVIDIA 驱动时回落到 `libsvtav1`（CPU 上的 AV1）；离线编辑重新编码同理（有 NVIDIA 用 `h264_nvenc`）。也可显式写 `--dataset.vcodec=libsvtav1`。

`libsvtav1` 让 CPU 既编码又采集，双夹爪一帧六到八张图，30fps 预算仅 33.3ms，会出现 `[slow_frame] ... overrun=`。关掉后在 `save_episode()` 批量编码，存盘慢只是多等，掉帧则补不回来；忽略"建议把流式编码开回来"的提示。多核服务器仍想开流式编码，调这两项：

| 参数 | 默认 | 什么时候动它 |
|---|---|---|
| `--dataset.encoder_threads` | 自动 | 大机器上 `libsvtav1` 会抢走采集要用的核，每个编码器给 `2` 是稳妥上限 |
| `--dataset.encoder_queue_maxsize` | `30` | 约 1 秒缓冲（30fps）的反压阀，编码跟不上时在此挡住，内存不再上涨 |

## 分集与复位 {#55}

- `--dataset.num_episodes=N` 一次采多集。
- 集间在 `--dataset.reset_time_s` 内重新摆放物体/场景。
- 一集一次完整演示，不要塞多次尝试。
- `--dataset.episode_time_s` 给够但别过长，否则产生大量无效尾帧。
- 录制中的键盘控制：

    | 按键 | 作用 |
    |---|---|
    | → | 提前结束当前集；复位阶段按则提前结束复位 |
    | ← | 放弃本集并重录；录制中或随后的复位阶段均可，之后照常给复位时间 |
    | Esc | 当前集照常存盘后停止录制 |

    键盘监听是全局的，在**任何窗口**（包括用左右键翻帧的 Rerun）按方向键都生效。

## 采集规范

### 好 episode 与常见坏样本

| 维度 | 好 | 坏样本症状 | 规避 |
|---|---|---|---|
| 完整性 | 接近 → 抓取 → 操作 → 完成 | 中途中断 | 自然收尾 |
| 平稳性 | 手持平稳匀速 | 急停急转，IMU/位姿噪声大 | 匀速带动 |
| 触觉信号 | 抓取时真实接触、有形变 | 空抓，触觉图无信号 | 看 Rerun 触觉确认接触 |
| 相机可见 | 目标在腕相机视野内 | 手/线缆遮挡，或过曝/频闪 | 清理遮挡、调手持角度 |
| 坐标一致 | 与其它集同一原点 | 中途重启 XTac-UMI XR，位姿集间跳变 | 不重启 XTac-UMI XR |
| 夹爪读数 | `gripper.pos` 闭合≈0、张开合理 | 未标定，闭合时 `gripper.pos`≠0 | 确认闭合后按需重标零点，见[夹爪标定](calibration.md#41) |
| 丢帧 | 无告警 | 日志丢帧告警 | 增大 `encoder_threads`、`vcodec=auto`，见[流式编码](#54) |
| 首帧 | 动作起点正常 | 关键动作落在被丢的首帧 | 开录后稳 0.5~1 秒再动，给足 `--dataset.episode_time_s` |

报错先查[故障排查](troubleshooting.md)。

### 采集前

全程不要重启 XTac-UMI XR（原因见[坐标系对齐](../common/pico4.md#pico-frame)）；不得不重启时，之后的数据当作新数据集。

- 没标定的主夹爪连不上，预览时复核机械行程即可；每台主夹爪标一次（存 flash），双夹爪两侧都要标，见[夹爪标定](calibration.md#41)。
- `scan_grippers` 输出 side/role/firmware_sn 正常；追踪器有电、有位姿。
- 走有线时关数采电脑 WiFi（与有线共享网络冲突），见[网络连接](../common/pico4.md#pico-network)。
- 场景光照稳定、目标清晰，清理遮挡腕相机的线缆/杂物。
- 双夹爪满负荷出流可达 ~280 MB/s，见[存储规划](dataset.md#storage-planning)。
- 开录前先[预览](#preview)。

### 演示动作规范

同一任务的演示节奏尽量一致，便于模型学习；触觉是核心模态，空抓价值很低。

### 多样性与一致性

- 保持一致：任务定义（`--dataset.single_task`）、动作意图、坐标原点。
- 适度多样：物体初始位姿/位置、抓取点、光照的轻微变化。

### 任务定义与数据集组织

- `single_task` 用稳定清晰的英文短句，同一数据集内一致，写进 `tasks`。
- 一个数据集只放一个任务/变体，`repo_id` 命名见[数据集](dataset.md)。
- 记设备台账（夹爪/追踪器、标定时间）；序列号已自动写进 [`meta/hardware.json`](#robot-id)。

### 增量采集

先采 5~10 条，用 [`lerobot-check-dataset`](dataset.md#62) 校验并回放抽查，再规模化采集。

### 采集自查清单

- [ ] 采集期间未重启 XTac-UMI XR
- [ ] 闭合时 `gripper.pos`≈0
- [ ] 追踪器有位姿、轨迹正常
- [ ] 数采电脑 WiFi 已关
- [ ] 抓取时触觉图有信号
- [ ] 腕相机视野无遮挡
- [ ] 无丢帧告警
- [ ] `single_task` 与本数据集一致
- [ ] 磁盘空间充足

## 可选：头显相机 {#56}

录 Pico4 Ultra 企业版头显的双目画面与位姿（操作员第一视角和"人在往哪看"），产出 `left_head` / `right_head` 与 `head_camera.*`（见[每帧记录内容](#53)），后者同时进 action。双夹爪用 `--robot.type=xtac_umi_g1`，单夹爪 `taccap_gripper` 加 `--robot.enable_head_camera=true`，下列参数两者通用。

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
- 前置条件：XenseVR PC Service ≥ v0.2.0（更低版本不转发画面，见[版本基线](versions.md#required)）；头显 APP 正在推流并已连上 [PC Service](host-setup.md#35)。相机和追踪器共用一条 SDK 连接，关掉一个不断开另一个。

!!! warning "头显的分辨率和 `--robot.head_camera_width/_height` 必须一致"
    只接受 `640x480`（默认）、`1024x768`、`1280x960` 三档。XTac-UMI XR 默认每眼输出 640x480，与采集端默认一致，不用加参数；命令行参数只声明预期。

    - 填别的或首帧尺寸与配置不符都会报错（后者在 connect 时），不会悄悄重采样改掉视场角。
    - 三档都是 4:3，同传感器（PICO 相机接口单帧上限 2328x1748 也是 4:3），16:9 只会裁剪或拉伸。
    - 要更高分辨率请联系[技术支持](../common/reference.md#support)在头显上调整，并同步改这两个参数。

- `--robot.head_camera_eyes=left`（或 `right`）只录一只眼，解码与编码压力减半，只有一个头部视频键。
- 改分辨率或录制的眼睛等于换一组数据，前后 episode 不能混用。
- 左右眼是两条独立消息，配错在数据里看不出，所以每帧比对两眼最新帧：帧序号相同即同一曝光，否则时间戳差须不超过 `--robot.head_camera_pair_max_skew_ms`（默认 20ms，30fps 帧周期约 33ms）；超出只打限流告警（含实测偏差），不中断录制。

`head_camera.*` 用追踪器的 Pico→world 变换映射到 `tcp.*` 的世界系。开启后 `observation.state` 增 9 维：单夹爪 10 → 19，双夹爪 20 → 29，再开 `--robot.enable_imu=true` 继续累加。连不上见[故障排查](troubleshooting.md#head-camera)。

## 可选：腕相机鱼眼矫正 {#57}

腕相机是 190° 鱼眼，默认落盘原始帧。`--robot.wrist_undistort=true` 用本夹爪 flash 里的内参在写入前矫正成直线投影，`--robot.wrist_undistort_balance` 调视野。只支持 640×480（固件鱼眼记录只有 8 个浮点数、不含图像尺寸），配别的 `--robot.wrist_camera_width/_height` 会在解析命令行时退出。

!!! warning "开与不开，录出来的是两种数据，而且看不出来"
    矫正与原始的 `wrist_cam` 形状、dtype 相同，混用无提示，所以录制时记入 [`meta/hardware.json`](#robot-id) 的每个 unit：

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` 是 `"unit"`（本机标定）或 `"reference"`（SDK 参考值）；中途改设置会另起 epoch。一个数据集只用一种。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

以下情况不会失败，而是回退到 SDK 内置参考内参：

- 从未标定（`read_fisheye()` 返回 `None`）。
- 固件回了全零记录（1.1.1 与 1.2.2 都会）：须用 `is_usable_fisheye_cal()` 判断而非 `is None`，否则 `fx = fy = 0` 的重映射表输出纯黑图且不报错。
- 固件早于命令集 V2.0。

回退时告警 `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate`，清单里记 `"calibration": "reference"`。代码里优先用 `Calibration::resolve_fisheye()`（返回 `(calibration, is_reference, reason)`）而不是 `read_fisheye()`。

参考值够看画面，但主点逐台漂移（实测一台差 37.7 像素）；要在矫正图上按像素测量（视觉伺服、手眼标定、尺寸估计），先存本机标定：`python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye right`（接两只时用 `left` / `right` 或完整 SN 指定，只接一只可省略）。

矫正后画面偏心、略倾斜不代表标定错：去畸变绕主点而非画幅中心，传感器未必在光心上，鱼眼桶形畸变藏住了它（实测一台 `cx = 359.1`，爪尖中点 x = 360.1，差约 1 像素）。别改 `cx`，改回 320 更偏且引入倾斜。
