# 数据采集

先用 `lerobot-teleoperate` 确认设备正常,再用 `lerobot-record` 录出干净、一致的 `LeRobotDataset`。落盘位置、目录结构、校验与上传见[数据集](dataset.md)。

## 采集原理 {#51}

`taccap_gripper` 不需要遥操作端,录制是自驱动的,命令行里没有 `--teleop.*` 参数;集间复位是被动等待,重新摆放设备即可。

移位帧(shifted-frame)配对:*t-1* 步的观测配 *t* 步的位姿(EEF TCP 位姿 + 归一化 `gripper.pos`,开了[头显相机](#56)时还有头显位姿)作为动作,动作比观测领先一步,每集因此少 1 帧。

`tcp.*` 是夹爪末端而非追踪器:追踪器离两指中点约 195 mm,落盘前乘上内置的刚性安装变换(CAD 装配实测,左右各一套),机体固连、任意姿态成立、与 `gripper.pos` 无关。世界系是重力对齐的 X 前 / Y 左 / Z 上,在 XTac-UMI XR 启动瞬间冻结(见[坐标系对齐](../common/pico4.md#pico-frame))。

`--display_data=true` 会开出 Rerun 的 `/world` 3D 视图:夹爪以带标签的椭球 + 三轴画在实时 `tcp.*` 处并拖出轨迹面包屑,`--show_trajectory=false` 关闭。视图里各元素的含义、`FLU` 场景约定与「夹爪平放时三轴应呈 X 前 / Y 左 / Z 上」的装配检查见[坐标系 · `/world` 3D 视图](../common/coordinates.md#world-view)。

## 开录前预览 {#preview}

`lerobot-teleoperate` 只预览、不写数据;相机没上来、追踪器没位姿、`gripper.pos` 顶不到 1.0、双夹爪左右接反,预览里一眼就能看出。要录哪档就预览哪档,预览与录制用同一组开关:

| 档 | 开关 | 需要 | 多出 |
|---|---|---|---|
| ① 只有夹爪 | `--robot.enable_tracker=false --robot.enable_head_camera=false` | 不需要 PC Service | 触觉两路、腕相机、`gripper.pos`,没有 `tcp.*` |
| ② 加追踪器位姿(最常用,本页默认) | `--robot.enable_tracker=true --robot.enable_head_camera=false` | 追踪器已开机[绑定](../common/pico4.md#pico-tracker-bind)、Pico4 已连上、[PC Service 已启动](host-setup.md#35) | [`/world` 视图](../common/coordinates.md#world-view) / `tcp.*` |
| ③ 全开 | `--robot.enable_tracker=true --robot.enable_head_camera=true` | PC Service ≥ v0.2.0 | 头显双目与头部位姿,见[头显相机](#56) |

按 ② 档预览:

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

换档只改表里两个开关;`--robot.enable_head_camera` 默认就是 `false`,写出来是让开关在命令里可见。单夹爪换成 `--robot.type=taccap_gripper`:只接一只时自动选中,两只都接着时加 `--robot.side=left|right`(录制时只录一只则必填)。`--teleop_time_s=10` 跑满 10 秒自动退出,`--debug_timing=true` 打印采样耗时与相机路数。

逐项确认(②③ 档才有位姿两行),都正常再 `Ctrl+C` 退出:

| 看什么 | 期望 |
|---|---|
| 左右两路触觉 | 都有画面,按压时纹理明显变化 |
| 腕相机 | 有画面,视野里没有线缆或杂物遮挡 |
| `gripper.pos` | 张到底 1.0、闭合 0.0;顶不到 1.0 见[标定](calibration.md#413) |
| `/world` 里的 EE 标记与轨迹 | 平滑移动,不跳变、不卡住;追踪器要始终在头显视野内,被遮挡就丢跟踪 |
| 双夹爪:左右两条轨迹 | 各自独立且对应正确的手 |

## 录制 {#52}

设备按序列号规则自动发现,不列举序列号;触觉、腕相机、追踪器各自匹配左右。换档、单夹爪写法与预览相同。

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

- 正式录制保持 `--display_data=false`(默认值):Rerun 显示要在采集主循环上压缩并推送每一路画面,明显占用帧预算;录制中要盯画面用 [`--display_image_every_n`](#params)。
- 显式写出 `fps=30`、`episode_time_s=120`、`reset_time_s=60`、`push_to_hub=false`,避免不同 checkout 的默认值变化影响采集。
- 相机或夹爪编码器中途掉线(线松、hub 掉电)时,采集主动停下并把已录部分存盘,打印 `Device lost mid-recording`,不写编造的值。短暂读取失败会沿用上一帧好值(相机约 2 秒、编码器约 1 秒)才判掉线,所以那一集末尾一两秒可能是重复旧值,建议弃用。检查线缆与 USB 口(见[故障排查](troubleshooting.md)),再用 `--resume` 续录。

### 参数 {#params}

分三类:数据集(`--dataset.*`)、录制控制(顶层)、设备(`--robot.*`)。完整定义见 lerobot 官方[录制指南](https://huggingface.co/docs/lerobot/v0.5.1/en/il_robots#record-a-dataset)(本项目 lerobot 基线 0.5.1)。

**数据集参数 `--dataset.*`**

| 参数 | 默认 | 含义 |
|---|---|---|
| `repo_id` | 必填 | `<org>/<name>`,团队约定 `<org>/<任务>_<变体>_<YYYYMMDD>`,如 `Xense/insert_plug_left_20260703`,见[数据集](dataset.md) |
| `single_task` | 必填 | 任务描述,写入 `meta/tasks`,如 `'Pick up the object'` |
| `root` | `$HF_LEROBOT_HOME/repo_id` | 本地存储目录,见[数据集](dataset.md) |
| `fps` | `30` | 录制采样帧率上限;传感器本身 120 Hz([规格](../product/specs.md#specs)) |
| `episode_time_s` | `120` | 每集时长(秒) |
| `reset_time_s` | `60` | 集间复位时长(秒) |
| `num_episodes` | `50` | 录制集数 |
| `video` | `true` | 帧编码为视频(mp4) |
| `push_to_hub` | `false` | 上传 Hub,见[数据集](dataset.md#64) |
| `private` | `false` | Hub 私有仓库 |
| `tags` | 无 | Hub 标签 |
| `streaming_encoding` | `true` | 实时流式编码,见[流式编码](#54) |
| `vcodec` | `auto` | `h264`/`hevc`/`libsvtav1`/`auto`/硬件编码器 |
| `encoder_threads` | 自动 | 每个编码器实例的线程数 |
| `encoder_queue_maxsize` | `30` | 每相机缓冲帧数(~1s@30fps),编码跟不上时反压丢旧帧 |
| `video_encoding_batch_size` | `1` | 批量编码前累计的集数(1=即时编码) |

**录制控制(顶层参数)**

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.type` | 必填 | `taccap_gripper`(单夹爪)/ `bi_taccap_gripper`(双夹爪) |
| `robot.id` | 必填 | 工位号,填数字(`0` / `1`…),前缀自动补;漏填直接报错,见 [`--robot.id`](#robot-id) |
| `fps` | `30` | 主循环帧率,与 `--dataset.fps`(落盘采样率)是两个参数,通常相同 |
| `display_data` | `false` | Rerun 显示相机画面与 3D 视图 |
| `show_trajectory` | `true` | Rerun 叠加 3D 位姿 + 轨迹(需 `display_data` 且有 `tcp.*`) |
| `display_compressed_images` | `false` | Rerun 里 JPEG 压缩后显示,吃帧预算;只在查看器在另一台机器(`--display_ip`)时划算 |
| `display_image_every_n` | `1` | 每 N 帧刷新一次画面(标量始终全速);最后手段 |
| `play_sounds` | `true` | 语音播报;容器里没有语音合成器,一律静音,要听到就在宿主机上跑 |
| `resume` | `false` | 在已有数据集上续录 |

**设备参数 `--robot.*`(XTac-UMI G1 专属)**

只列本页命令与可选功能用到的项,完整配置项见 [`RobotConfig` 常用配置项](reference.md#robotconfig)。

| 参数 | 默认 | 含义 |
|---|---|---|
| `robot.side` | 自动 | `left`/`right`,单夹爪模式下两只都接着时必填 |
| `robot.enable_tracker` | `true` | 关闭则无位姿 |
| `robot.enable_head_camera` | `false` | 录头显相机,见[头显相机](#56) |
| `robot.head_camera_eyes` | `both` | `both` 两只眼(两个键),`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `640` / `480` | 每只眼尺寸,须与头显「分辨率」一致,对应表见[头显相机](#56) |
| `robot.wrist_undistort` | `false` | 落盘前矫正鱼眼,见[鱼眼矫正](#57) |
| `robot.wrist_undistort_balance` | `0.0` | `0` 保持标定焦距,`1` 视野最大但黑边更多 |

!!! warning "双夹爪上,按单元的那几项要带 `left_` / `right_` 前缀"
    本页参数都按单夹爪写。`bi_taccap_gripper` 下面这几项每侧一个,不带前缀会因为没有这个字段而报错:

    | 单夹爪 | 双夹爪 |
    |---|---|
    | `--robot.enable_wrist_camera` | `--robot.left_enable_wrist_camera` / `--robot.right_enable_wrist_camera` |
    | `--robot.tracker_serial` | `--robot.left_tracker_serial` / `--robot.right_tracker_serial` |
    | `--robot.enable_gripper` / `--robot.enable_imu` | 同样加 `left_` / `right_` 前缀 |
    | `--robot.gripper_open_rad`、`--robot.tracker_to_ee_pos/_quat` | 同上 |

    其余两侧共用:`--robot.enable_tactile`、`--robot.enable_tracker`、`--robot.tactile_*`、`--robot.wrist_camera_width/_height/_fps/_fourcc`、`--robot.head_camera_*`。

追踪器上电后 6-DoF 位姿自动录制,按序列号末尾字母 `G` 前一个数字([单左双右](host-setup.md#33))匹配侧别;序列号不合规或枚举不稳时用 `--robot.tracker_serial=<SN>` 钉住。

### `--robot.id` 与硬件清单 {#robot-id}

`--robot.id` 是工位号,一套设备一个(双夹爪算一套),标工位不标硬件,换了夹爪不用改;它出现在日志前缀、标定文件名和硬件清单里,不是数据集的一列。编号本身不校验,填数字即可,前缀按 `--robot.type` 自动补:

| 命令里写 | `--robot.type` | 实际存成 |
|---|---|---|
| `--robot.id=0` | `taccap_gripper`(单夹爪) | `taccap_0` |
| `--robot.id=0` | `bi_taccap_gripper`(双夹爪) | `bi_taccap_0` |

不要手敲前缀,双夹爪上写 `--robot.id=taccap_0` 标签就和设备类型对不上;非纯数字原样保留,老命令的 `--robot.id=taccap_0` 仍可用。漏填或填空在解析命令行时就退出:

```text
ValueError: --robot.id is required: the station label for this rig, e.g. --robot.id=0 …
```

硬件清单才是身份:`lerobot-record` 在 `connect()` 之后立刻把 `meta/hardware.json` 写进数据集,记每只夹爪的固件 SN 和它两枚触觉传感器的 SN,每枚带对应的观测键。

```json
{
  "robot_type": "bi_taccap_gripper",
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
            { "finger": "left",  "observation_key": "left_tactile_left",  "serial": "GSPS01A25Z0011",
              "runtime": "meta/runtimes/GSPS01A25Z0011-20260822T160309.bin" },
            { "finger": "right", "observation_key": "left_tactile_right", "serial": "GSPS01A25Z0012",
              "runtime": "meta/runtimes/GSPS01A25Z0012-20260822T160309.bin" }
          ],
          "wrist_undistort": { "applied": false }
        }
      ]
    }
  ]
}
```

- `side` 是哪只夹爪,`finger` 是这只上的哪一枚触觉,互相独立([单左双右](host-setup.md#33)各判一次);`observation_key` 让数据集的一列直接回溯到具体传感器。
- `gripper_sn` 是固件 SN,不是 CH343 的 `mcu_serial`(换根转接就变)。
- 单夹爪结构相同,`units` 只有一项;某侧没开记 `"gripper_sn": null`;`--robot.enable_tactile=false` 时 `tactile_sensors` 为空列表。
- 独立文件,不是 `meta/info.json` 的键;追踪器和腕相机是配件,不在清单里。
- `wrist_undistort` 记腕相机帧是否矫正过、用哪份内参,没矫正记 `{"applied": false}`,见[鱼眼矫正](#57)。

`epochs` 让一个数据集跨几套硬件:每段记 `from_episode` / `to_episode`(左闭右开,同 `dataset_from_index` / `dataset_to_index`)和 `recorded_at`,正在录的段 `to_episode` 为 `null`。`--resume` 续录时同一套设备什么都不记;换了夹爪或传感器,旧段在当前集数处封口、新段接上;`--robot.id` 变了也开新段(消费端认 `units`);`--robot.type` 对不上是换数据集不是换硬件,保留原文件并告警。老数据集(扁平 `units`)读成一个开口 epoch,只说明"没有证据换过硬件"。

!!! danger "`meta/runtimes/`:重建触觉的衍生通道必须用这一份 bundle"
    落盘的是 `rectify` 流,depth / force / difference 从它算出,要用那枚传感器上电时拍的参考图(runtime 配置)。每次采集会话把每枚的 bundle 写进 `meta/runtimes/<SN>-<时间>.bin`(每枚约 841 KB),epoch 各指向自己那份。拿错 bundle 不报错:用另一枚的、或重标后的 bundle,没被碰过的胶体照样解出看似合理的 depth 和 force;老数据集没有 `meta/runtimes/` 就跳过重建。同一枚拆下维护再装回,参考图变了,会单独开 epoch。文件名里的时间是北京时间、不带时区,只当标签;计算用 `recorded_at`。

## 每帧记录内容 {#53}

| Key | 来源 | 由什么开启 | 形状 / 类型 |
|---|---|---|---|
| `tcp.x`, `tcp.y`, `tcp.z` | 追踪器 → EEF TCP 位置 | `--robot.enable_tracker`(默认 `true`) | float(m) |
| `tcp.r1`..`tcp.r6` | 同上,姿态的 6-D 旋转 | 同上 | float |
| `gripper.pos` | 夹爪编码器 | `--robot.enable_gripper`(默认 `true`) | float ∈ [0, 1] |
| `tactile_left` / `tactile_right` | 左右视触觉传感器 | 默认采集;`--robot.enable_tactile=false` 只用于排查,见下方警告 | uint8,约 `(400, 700, 3)`,宽高自动推导,别写死 |
| `wrist_cam` | 腕部相机 | `--robot.enable_wrist_camera`(默认 `true`) | uint8 `(H, W, 3)` |
| `left_head` / `right_head` | 头显双目,一只眼一个键 | `--robot.enable_head_camera`(默认 `false`) | uint8,默认 `(480, 640, 3)` |
| `head_camera.x/y/z` | 头显位置(同 `tcp.*` 世界系),也是动作 | 同上 | float(m) |
| `head_camera.r1..r6` | 头显姿态的 6-D 旋转,也是动作 | 同上 | float |
| `imu.accel.{x,y,z}` | 夹爪 IMU 加速度 | `--robot.enable_imu`(默认 `false`,预留不录) | float(m/s²) |
| `imu.gyro.{x,y,z}` | 夹爪 IMU 角速度 | 同上 | float(rad/s) |
| `imu.mag.{x,y,z}` | 夹爪 IMU 磁力 | 同上 | float(µT) |

6-D 旋转记的是旋转矩阵 R(「世界 ← 本体」)的前两列,按列取、不是按行;第三列是前两列的叉积。`tcp.*` 与 `head_camera.*` 同一套约定:

```text
R = ⎡ r1  r4  · ⎤     第一列 (r1,r2,r3) = 本体 X 轴在世界系下的方向
    ⎢ r2  r5  · ⎥     第二列 (r4,r5,r6) = 本体 Y 轴在世界系下的方向
    ⎣ r3  r6  · ⎦     第三列 = 前两列的叉积,可自行算回
```

IMU 默认不录,按本页采出的数据集里没有这 9 列;需要时加 `--robot.enable_imu=true`(双夹爪两侧一起生效,键名带 `left_` / `right_` 前缀),`observation.state` 单夹爪 10 → 19,双夹爪 20 → 38。

!!! warning "`--robot.enable_tactile=false` 是排查开关,不要用它录数据"
    关掉后触觉不发现、不落盘、无观测键。它用来把 USB 带宽问题拆成两半:双夹爪四路触觉 + 两路腕相机可能超出一条总线的预算,表现为某一路相机打不开、且每次不是同一路;分别关触觉、关腕相机各跑一次即可判断,见[某一路相机打不开](troubleshooting.md#usb-bandwidth)。要少录一路用 `--robot.enable_wrist_camera=false` 或 `--robot.enable_tracker=false`。

!!! tip "默认情况下,Rerun 里看到的就是落盘的那张图"
    落盘 = `--robot.tactile_output_types`,默认 `rectify`(未做基线相减的原图),只能填一个,多填报错。显示 = `--robot.tactile_display_output_types`,默认同样是 `rectify`(填空列表 `'[]'` 等价),所以传感器每帧只读一次,屏幕上和数据集里是同一张图。改成别的类型,才会在同一次读取上多出一路只显示、不落盘的流,键名如 `tactile_left_difference`,不在 `observation_features` 里。

    值得知道的那个类型是 `difference`(相对初始化时刻基线的增强差分图)。它曾经是默认值:早期胶体上 `rectify` 几乎看不出形变,只能靠差分图判断接触;2026-08 换硅胶之后 `rectify` 上直接能看出接触,显示流就不必再拿一路不落盘的图挡在操作员眼前。真要开回去(`--robot.tactile_display_output_types='["difference"]'`),记住差分是破坏性的:基线在传感器 init 时抓取,连接时压在胶上的力会被整段减掉,所以四枚指尖连接时都要空载,也不要为了看着清楚把 `--robot.tactile_output_types` 改成 `difference`。`--robot.tactile_diff_gain`(默认 `1.0`)只是这张差分图的增益,不请求 `difference` 时什么都不做;出厂值 1.5 在本胶体上噪声偏大且会削顶。

## 录制选项:流式编码与编码器预热 {#54}

视频键(触觉 + 腕相机)在采集时实时编码,而非先存 PNG 再在集尾编码,每集结束几乎不用等。默认开启(`--dataset.streaming_encoding=true`):

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

- 每个相机一个 `_CameraEncoderThread`,经有界队列(`--dataset.encoder_queue_maxsize`,约 1 秒帧量)喂原始帧;跟不上时丢弃最旧帧并告警,不阻塞采集。
- `--dataset.vcodec=auto` 优先启用可用的硬件编码;推荐采集主机配 NVIDIA GPU,用 GPU H.264 编码器降低多路实时编码的 CPU 压力。
- 编码器预热是自动的:每集开录前先把编码器准备好,不占第一帧的时间预算。

### 没有 NVIDIA GPU 的主机怎么录 {#no-gpu}

!!! warning "这是给不达标机器的临时办法,不是推荐做法"
    [采集主机最低要求](install.md#host-spec)是 NVIDIA RTX 3060 / 8 GB 显存及以上。纯 CPU 服务器、虚拟机或无 NVIDIA 显卡的笔记本用下面这条能把数据录下来,但存盘慢、更容易掉帧;正式采集请换达标主机。

`--dataset.vcodec=auto` + `--dataset.streaming_encoding=true` 这两个默认值是按装了 NVIDIA 显卡配的。没有显卡时关掉流式编码:

```bash
lerobot-record \
    ... \
    --dataset.streaming_encoding=false
```

编码器不用管:`--dataset.vcodec=auto` 会真的开一次编码会话探测,没有 NVIDIA 驱动时回落到 `libsvtav1`(CPU 上的 AV1,也是离线数据工具的默认编码器);显式写 `--dataset.vcodec=libsvtav1` 也可以。

原因:`libsvtav1` 让 CPU 既编码又采集,双夹爪一帧六到八张图而 30 fps 预算只有 33.3 ms,先看到的就是 `[slow_frame] ... overrun=`;关掉后到 `save_episode()` 再批量编码,存盘慢只是多等,掉帧丢的是补不回来的数据。此时"建议把流式编码开回来"的提示忽略即可。多核服务器上仍想开流式编码,两个旋钮:

| 参数 | 默认 | 什么时候动它 |
|---|---|---|
| `--dataset.encoder_threads` | 自动 | 大机器上 `libsvtav1` 会拿走采集需要的核;每个编码器给 `2` 是稳妥上限 |
| `--dataset.encoder_queue_maxsize` | `30` | 30 fps 下约 1 秒缓冲,是反压阀,编码跟不上时在这里挡住而不是让内存一直涨 |

## 分集与复位 {#55}

- 一次运行采多集:`--dataset.num_episodes=N`。
- 集间是被动复位:在 `--dataset.reset_time_s` 内重新摆放物体/场景,无需遥操。
- 每条 episode 是一次完整演示,不要把多次尝试塞进一集。
- `--dataset.episode_time_s` 给够但别过长,过长会产生大量无效尾帧。
- 录制中可用 lerobot 的键盘控制(重录当前集、提前结束等)。

## 采集规范

一句话原则:每条 episode 都是一次完整、平稳、传感器有真实信号的演示,且全集同一坐标原点。

### 好 episode 与常见坏样本

| 维度 | 好 | 坏样本症状 | 规避 |
|---|---|---|---|
| 完整性 | 接近 → 抓取 → 操作 → 完成 | 中途中断、没完成 | 每条演示自然收尾 |
| 平稳性 | 手持带动平稳、匀速 | 急停急转,IMU/位姿噪声大 | 平稳匀速带动 |
| 触觉信号 | 抓取时传感器与物体真实接触、有形变 | 空抓,触觉图无信号 | 抓取时确保真实接触、看 Rerun 触觉 |
| 相机可见 | 目标在腕相机视野内 | 手/线缆遮挡,或过曝/频闪 | 清理遮挡、调整手持角度 |
| 坐标一致 | 与本数据集其它集同一原点 | 中途重启 XTac-UMI XR,位姿集间跳变 | 不重启 XTac-UMI XR |
| 夹爪读数 | `gripper.pos` 闭合≈0、张开合理 | 未标定,完全闭合时 `gripper.pos`≠0 | 确认完全闭合后按需重标零点,见[夹爪标定](calibration.md#41) |
| 丢帧 | 无告警 | 日志丢帧告警 | 增大 `encoder_threads`、`vcodec=auto`,见[流式编码](#54) |
| 首帧 | 动作起点正常 | 关键动作落在被丢的首帧 | 开录后稳定 0.5~1 秒再动作,并给足 `--dataset.episode_time_s` |

出现报错先查[故障排查](troubleshooting.md)。

### 采集前

采集全程不要重启 XTac-UMI XR,原因见[坐标系对齐](../common/pico4.md#pico-frame);不得不重启时,把之后的数据当作新数据集处理。

- 确认标定生效:预览时 `gripper.pos` 张到底 1.0、闭合 0.0。没标定的主夹爪连不上,能预览就说明标过了,这一步复核的是机械行程;每台主夹爪标一次(存 flash),双夹爪两侧都要标,见[夹爪标定](calibration.md#41)。
- 自检设备:`scan_grippers` 输出 side/role/firmware_sn 正常;追踪器有电、有位姿。
- 走有线时关闭数采电脑 WiFi,有线共享网络会与 WiFi 冲突,见[网络连接](../common/pico4.md#pico-network)。
- 准备场景:光照稳定、目标清晰可见,清理会遮挡腕相机的线缆/杂物。
- 预留磁盘:满负荷出流可达 ~280 MB/s(双夹爪),见[存储规划](dataset.md#storage-planning)。
- 开录前[预览](#preview)一遍,看轨迹、`gripper.pos` 与触觉图是否都有信号;确认完再以 `--display_data=false` 开录。

### 演示动作规范

同一任务的多条演示动作节奏尽量一致,便于模型学习;触觉是核心模态,空抓的演示价值很低;移位帧配对会丢掉每集首帧,关键动作不要压在第 0 帧。

### 多样性与一致性

任务语义一致、无关因素适度多样。保持一致:任务定义(`--dataset.single_task`)、动作意图、坐标原点;适度多样:物体初始位姿/位置、抓取点、光照的轻微变化。不要在同一份数据集里混入不同任务,明显不同的变体拆成不同数据集。

### 任务定义与数据集组织

`single_task` 用稳定清晰的英文短句(如 `'Pick up the object'`),同一数据集内保持一致,它会写进 `tasks`。一个数据集对应一个任务/变体,`repo_id` 命名与组织见[数据集](dataset.md)。记录设备台账(用哪只夹爪/追踪器、标定时间)便于回溯;序列号已由 [`meta/hardware.json`](#robot-id) 自动记录。

### 增量采集

不要一口气采几百条再回头发现系统性问题:先采 5~10 条;用 [`lerobot-check-dataset`](dataset.md#62) 校验;回放/可视化抽查几条;再规模化采集。

### 采集自查清单

- [ ] XTac-UMI XR 本次采集期间从未重启(原点一致)
- [ ] 编码器零点有效(闭合 `gripper.pos`≈0)
- [ ] 追踪器有位姿、Rerun 轨迹正常
- [ ] 已关闭数采电脑 WiFi(只留 Pico4 Ultra 企业版有线共享网络)
- [ ] 抓取时触觉图有信号(非空抓)
- [ ] 腕相机视野内目标不被遮挡
- [ ] 无丢帧告警
- [ ] `single_task` 描述与本数据集一致
- [ ] 磁盘空间充足

## 可选:头显相机 {#56}

默认关闭。打开后录制 Pico4 Ultra 企业版头显自带的双目相机与头显位姿——操作员第一视角和"人在往哪看";产出 `left_head` / `right_head` 与 `head_camera.*`(见[每帧记录内容](#53)),后者同时进 action。单夹爪和双夹爪开关与参数完全一样。

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

这里的 `left_` / `right_` 指头显的左眼 / 右眼,不是左右手(双夹爪的 `{side}_wrist`、`{side}_tcp.*` 才按手臂分);两个单夹爪进程同时开头显相机,拿到的是同一路画面。

前置条件:XenseVR PC Service ≥ v0.2.0,更低版本不转发相机画面(见[版本基线](versions.md#required));头显 APP 正在推流,相机和追踪器共用同一条 SDK 连接,头显必须已连上 [PC Service](host-setup.md#35),关掉一个不会断开另一个。

!!! warning "头显里的「分辨率」和 `--robot.head_camera_width/_height` 必须一致"
    只接受 `640x480`(默认)、`1024x768`、`1280x960` 三档,与头显 APP 的「分辨率」一一对应;尺寸由 XTac-UMI XR 界面决定(默认 `640`,也是推荐档位),命令行参数只是声明预期。填别的直接报错,首帧尺寸与配置不一致也在 connect 时报错,不会悄悄重采样(那会改掉记录下来的视场角)。三档都是 4:3,与传感器一致(PICO 相机接口单帧上限 2328x1748 也是 4:3),按 16:9 要画面只会得到裁剪或拉伸。默认对默认不用加参数;在头显里调高后命令行两处一起改:

    ```bash
    # 头显选 1024
    --robot.head_camera_width=1024 \
    --robot.head_camera_height=768

    # 头显选 1280
    --robot.head_camera_width=1280 \
    --robot.head_camera_height=960
    ```

只要一只眼时用 `--robot.head_camera_eyes=left`(或 `right`):JPEG 解码量和编码器压力减半,数据集里只有一个头部视频键。

改分辨率或改录制的眼睛都等于换了一组数据,变更前后的 episode 不能混用,要改就在开录前定下来。

左右眼配对:两只眼是两条独立消息,配错在数据里看不出痕迹,所以每帧比对两只眼的最新帧,帧序号相同即同一次曝光,不同则要求时间戳相差不超过 `--robot.head_camera_pair_max_skew_ms`(默认 20 ms,30 fps 帧周期约 33 ms);超出不中断录制,打一条限流告警并给出实测偏差。

`head_camera.*` 已重映射到与 `tcp.*` 相同的重力对齐世界系(用追踪器那套 Pico→world 变换)。开启后 `observation.state` 增加 9 维:单夹爪 10 → 19,双夹爪 20 → 29,再叠加 `--robot.enable_imu=true` 时继续累加。头显相机连不上见[故障排查](troubleshooting.md#head-camera)。

## 可选:腕相机鱼眼矫正 {#57}

腕相机是 190° 鱼眼,默认落盘原始鱼眼帧。加 `--robot.wrist_undistort=true` 会在写入数据集之前矫正成直线投影,内参取自这只夹爪 flash 里存的那份;`--robot.wrist_undistort_balance` 调视野档位。只支持 640×480:固件里的鱼眼记录只有 8 个浮点数、不带图像尺寸,配上别的 `--robot.wrist_camera_width/_height` 会在解析命令行时直接退出。

!!! warning "开与不开,录出来的是两种数据,而且看不出来"
    矫正过的与原始鱼眼的 `wrist_cam` 形状、dtype 完全一样,两批混在一起训练时没有任何提示。所以录制时把用了哪一种写进 [`meta/hardware.json`](#robot-id) 的每个 unit:

    ```json
    "wrist_undistort": { "applied": true, "calibration": "unit", "balance": 0.0 }
    ```

    `calibration` 是 `"unit"`(本机标定)或 `"reference"`(SDK 参考值);录到一半改了这个设置会自动另起一个 epoch。一个数据集从头到尾只用一种。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

从未标定(`read_fisheye()` 返回 `None`)、固件回了全零记录(固件 1.1.1 与 1.2.2 都会,判断要用 `is_usable_fisheye_cal()` 而不是 `is None`,否则 `fx = fy = 0` 建出的重映射表得到纯黑图且不抛异常)、或固件早于命令集 V2.0 时,矫正不会失败,而是回退到 SDK 内置参考内参(`Calibration::resolve_fisheye()` 返回 `(calibration, is_reference, reason)`,优先用它而不是 `read_fisheye()`),连接时告警 `Wrist undistortion is using the SDK's REFERENCE intrinsics ... Rectification will be approximate`,清单里记 `"calibration": "reference"`。

参考值够看画面,但主点逐台会漂(实测一台差 37.7 像素);要在矫正图上按像素测量(视觉伺服、手眼标定、尺寸估计)就先给这台存自己的标定:`python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye`。

矫正后画面偏心、略微倾斜不代表标定错了:去畸变绕主点而非画幅中心,传感器未必装在镜头光心上,原始鱼眼的桶形畸变把周边压缩才藏住了它(实测一台 `cx = 359.1`,爪尖中点在 x = 360.1,仅差约 1 像素);不要自己改 `cx`,改回 320 反而偏得更远并引入倾斜。
