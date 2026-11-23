# 数据集

## LeRobotDataset 格式速览 {#61}

采集产出标准 **LeRobotDataset v3.0**：多集合并进大 Parquet/MP4 文件，靠关系型元数据定位集边界，支持 Hub 原生流式。官方文档：[LeRobotDataset v3.0](https://huggingface.co/docs/lerobot/lerobot-dataset-v3)（格式、加载/流式、v2.1→v3.0 迁移）、[录制指南](https://huggingface.co/docs/lerobot/il_robots#record-a-dataset)、[lerobot 文档首页](https://huggingface.co/docs/lerobot)。

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # 单帧:观测 + 动作,均为 torch tensor
```

默认写到 `~/.cache/huggingface/lerobot/<repo_id>/`，`--dataset.root <path>` 可改到更大或更快的盘：

```text
<repo_id>/
├── data/     # parquet(观测/动作等表格数据)
├── videos/   # mp4(触觉 + 腕相机)
└── meta/     # json/jsonl:info · episodes · stats · tasks · hardware
```

- `meta/info` 的关键字段：`fps`、`features`、`total_episodes`、`total_frames`、`robot_type`、`data_path`、`video_path`。`robot_type` 是录制时的 `--robot.type`；紧跟其后的 `collection_stack` 固定为 `"xense-taccap-lerobot"`，标明由本程序直接录制。
- 时序查询：`delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` 一次取当前帧及其前 1s / 0.5s / 0.2s 三帧。
- 每帧的观测与动作键见[每帧记录内容](recording.md#53)。
- `meta/hardware.json` 是本程序另写的硬件清单（不动上游 `info`），见 [`--robot.id` 与硬件清单](recording.md#robot-id)。`lerobot-edit-dataset` 删集、拆分、去特征、8 → 6 相机转换得到的新数据集会带上它；**合并（`merge`）直接报错拒绝**，因为合并后没有一份清单能对应每集的真实传感器。

<span id="stats-std"></span>

!!! warning "0.0.8 之前录的数据集：图像的 `std` 统计量是 0"
    `meta/stats.json` 里图像和视频特征的 `std` 恒为 0（`mean`、`min`、`max` 和分位数不受影响）。训练时如果按 `std` 对图像做归一化，需要先重新计算统计量。

## 命名规范 {#naming}

- `repo_id` 形如 `<org>/<name>`：小写 + 连字符/下划线，无空格与中文；团队统一用 `<org>/<任务>_<变体>_<YYYYMMDD>`，例：`Xense/insert_plug_left_20260703`。
- 一个数据集一个任务/变体，不同任务或明显不同的变体拆成不同 `repo_id`。
- `--dataset.single_task` 用稳定清晰的英文短句，同一数据集内保持一致（写入 `meta/tasks`）。

## 数据校验 {#62}

`lerobot-check-dataset` 随采集程序装好，Mamba 和 Docker 下都能用：

```bash
lerobot-check-dataset --repo-id <your_org>/<your_dataset> \
    --root ~/.cache/huggingface/lerobot

# 只查某几集
lerobot-check-dataset --repo-id <your_org>/<your_dataset> --episode-index 0 2 4
```

| 参数 | 含义 |
|---|---|
| `repo-id` | 数据集仓库 id(`<org>/<name>`) |
| `root` | 本地根目录（默认 `~/.cache/huggingface/lerobot`） |
| `episode-index` | 只检查指定集（可多值，如 `0 2 4`） |

检查项：

- `meta/` 是否齐全、集数是否一致。
- parquet 行数与索引是否连续、有没有 NaN。
- 视频文件是否存在，帧数与声明是否**完全相等**。
- **相机格式**：双臂数据集判为 6 相机（四路触觉 + 两路腕相机）或 8 相机（再加头显两只眼），两者训练输入维度不同。单夹爪、关了腕相机或只录一只眼的数据集显示 `not recognized` 并告警，不影响其余检查。

结果汇总在最后一行：

```text
Summary: 0 error(s), 0 warning(s) | Camera format: 6-camera (no headset)
```

视频帧数不符时按方向区分：

| 情况 | 结果 | 含义 |
|---|---|---|
| 比声明**少** | error（`... frames but episodes declare ... (N missing ...)`） | episode 引用了视频里不存在的帧，解码会越过流末尾 |
| 比声明**多** | warning（`... more than the ... episodes declare -- unreferenced leftover frames`） | 多出来的帧没有 episode 引用（例如删过集），不影响使用 |

### 双臂 8 相机 → 6 相机 {#8to6}

开了[头显相机](recording.md#56)的双臂数据集是 8 相机格式，可降成与 `bi_taccap_gripper` 同构的 6 相机格式，记录类型也改为 `bi_taccap_gripper`：

```bash
lerobot-edit-dataset \
    --repo_id <your_org>/<dataset_8cam> \
    --new_repo_id <your_org>/<dataset_6cam> \
    --operation.type convert_8_to_6_cameras
```

丢掉头显两只眼的图像键，以及 `action` / `observation.state` 里的 `head.*` 维度；**原数据集不动**，结果写到 `--new_repo_id`。源数据集已是 6 相机或相机键不符预期时直接报错。

!!! warning "先确认 `--repo_id` 拼对了"
    这项转换在本地找不到数据集时会去 Hugging Face Hub 取，`--local_files_only` 对它不起作用。确认拼写，或用 `--root` 直接指向本地数据集目录。

## 回放与可视化 {#replay}

- 在线浏览：上传 Hub 后用 [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) 逐集查看视频与数据。
- 3D 轨迹：[开录前预览](recording.md#preview)时加 `--display_data=true`，在 Rerun 里看夹爪位姿与轨迹。
- 本地逐帧：用本地 `lerobot` 自带的可视化脚本打开 parquet + mp4。

## 上传 Hugging Face Hub 与备份 {#64}

上传即异地备份加交付，上传前先跑 `lerobot-check-dataset`；重要数据集删除或迁移前先备份整个 `<repo_id>/`。

!!! warning "先登录 Hub"
    上传前执行 `hf auth login`（旧版也可使用 `huggingface-cli login`），或设置 `HF_TOKEN`，否则会因鉴权失败。

```bash
lerobot-push-dataset-to-hub \
    --repo-id <your_org>/<your_dataset> \
    --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
```

| 追加参数 | 用途 |
|---|---|
| `--upload-large-folder` | 大数据集 |
| `--private` | 私有仓库 |
| `--no-videos` | 不传视频 |

- 成功后地址为 `https://huggingface.co/datasets/<repo_id>`。
- 上传时自动生成数据集卡片（README），在数据集目录写 `assets/`（三张卡片图约 12MB）一并上传，`--no-videos` 亦然。
- `--repo-id` 与 `--dataset-path` 都必填；`--dataset-path` 只读本地，路径不对报 `Cannot find dataset metadata in local directory`，不会从 Hub 下载。

## 磁盘规划与估算 {#storage-planning}

- 双夹爪多相机的原始视频吞吐可达约 **280 MB/s**，不是编码后的写盘速度，不能据此推算落盘量。
- 单条 episode 体积 ≈ 各编码视频流平均码率 × 时长 + Parquet 与元数据；相机数、分辨率、画面内容、`fps`、编码器、码率、`episode_time_s` 都影响体积。
- 大批量采集前先录 2–3 条代表性 episode 并跑完整性检查，按实测体积和计划集数估算；采集期间定期用 `df -h` 盯住目标盘，免得中途写满：

```bash
du -sh ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
df -h ~/.cache/huggingface/lerobot          # 看目标盘剩余空间
```

## 清理与维护

删除前确认已通过 `lerobot-check-dataset` 并已备份或上传；先移到隔离目录，确认无误再用文件管理器删除：

```bash
mkdir -p /data/lerobot-trash
realpath ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
du -sh ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
mv -- ~/.cache/huggingface/lerobot/<your_org>/<old_dataset> /data/lerobot-trash/
```

!!! warning "移动前核对 `realpath` 输出"
    必须是预期的单个数据集目录；不要对缓存根目录执行递归删除。

## 采集台账 {#ledger}

每份数据集记一行台账。夹爪与触觉 SN 已自动写进 `meta/hardware.json`，照抄只为离线可查，不一致时以数据集为准；追踪器 SN 需手工填写。

| `repo_id` | 任务描述 | 工位号 `--robot.id` | 夹爪 / 追踪器 SN | 标定时间 | 软件版本 / commit | 世界系会话 | 完整性检查 | 集数 / 单集时长 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| `Xense/pick_object_20260703` | `Pick up the object` | `0`（数据集里记为 `bi_taccap_0`） | `TCGU01A24Z0001m` / `PC2310MLL...` | 2026-07-03 | 采集当时的 `xense-taccap-lerobot v0.1.0` 与 `xense.taccap <版本>` | XTac UMI XR 启动时间 / 操作者朝向 | `lerobot-check-dataset` 通过；异常 episode 列表 | 50 / 15s | 光照/场景/异常集 |
