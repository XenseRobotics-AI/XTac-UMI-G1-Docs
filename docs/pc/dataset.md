# 数据集

采完之后数据长什么样、怎么校验、回放、上传 Hub,磁盘怎么规划、旧数据怎么清。读完你能把一份数据集从本地缓存校验后交付到 Hub。

## LeRobotDataset 格式速览 {#61}

采集产出标准 **LeRobotDataset v3.0**:多集合并进大 Parquet/MP4 文件、关系型元数据定位集边界、支持 Hub 原生流式,相比 v2 大幅减少小文件、初始化更快。没接触过 lerobot 的用户先读官方文档,再回来看 XTac-UMI G1 的具体用法:

- [LeRobotDataset v3.0 官方文档](https://huggingface.co/docs/lerobot/lerobot-dataset-v3)(格式设计、目录结构、录制、加载/流式、v2.1→v3.0 迁移)
- [lerobot 录制指南](https://huggingface.co/docs/lerobot/il_robots#record-a-dataset)
- [lerobot 文档首页](https://huggingface.co/docs/lerobot)

数据集可以像普通 Hugging Face / PyTorch 数据集一样索引:

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # 单帧:观测 + 动作,均为 torch tensor
```

序列化方式:

- `hf_dataset`:Hugging Face datasets → parquet
- 视频(触觉 + 腕相机):mp4(省空间)
- 元数据:纯 json / jsonl(`info` / `episodes` / `stats` / `tasks`);`info` 里的关键字段有 `fps`、`features`、`total_episodes`、`total_frames`、`robot_type`、`data_path`、`video_path`
- 时序查询:`delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` 一次取当前帧及其前 1s / 0.5s / 0.2s 三帧

每帧记录了哪些观测与动作键,见 [每帧记录内容](recording.md#53)。

标准 LeRobotDataset 只在 `info` 里记 `robot_type`,所以录制时额外写两样独立文件(都不动上游的 `info` 结构):`meta/hardware.json` 记这批数据是哪套硬件采的(工位号、夹爪与触觉 SN、腕相机是否去畸变,按 `epochs` 分段,中途换硬件会另起一段);`meta/runtimes/` 记每枚触觉传感器采集时的 runtime bundle,从 `rectify` 流重建 depth / force / difference 要用它。字段含义、续录行为与重建注意事项见 [`--robot.id` 与硬件清单](recording.md#robot-id)。

## 落盘位置与命名规范

采集默认写到 `~/.cache/huggingface/lerobot/<repo_id>/`,用 `--dataset.root <path>` 可指定其它位置(磁盘更大/更快的盘)。目录结构大致:

```text
<repo_id>/
├── data/     # parquet(观测/动作等表格数据)
├── videos/   # mp4(触觉 + 腕相机)
└── meta/     # json/jsonl:info · episodes · stats · tasks · hardware
```

`repo_id` 形如 `<org>/<name>`,建议:

- 小写 + 连字符/下划线,不含空格与中文;含任务与日期,便于检索与去重。团队内统一约定 `<org>/<任务>_<变体>_<YYYYMMDD>`,例:`Xense/insert_plug_left_20260703`。
- 一个数据集对应一个任务/变体;不同任务或明显不同的变体拆成不同 `repo_id`(多样性与一致性的取舍见 [数据采集](recording.md))。
- `--dataset.single_task` 的任务描述在同一数据集内保持一致(会写入 `meta/tasks`)。

## 数据校验 {#62}

`lerobot-check-dataset` 由采集程序一起装好,Mamba 和 Docker 两条路径下都能直接敲,检查帧数、视频、字段一致性等:

```bash
lerobot-check-dataset --repo-id <your_org>/<your_dataset> \
    --root ~/.cache/huggingface/lerobot

# 只查某几集
lerobot-check-dataset --repo-id <your_org>/<your_dataset> --episode-index 0 2 4
```

| 参数 | 含义 |
|---|---|
| `repo-id` | 数据集仓库 id(`<org>/<name>`) |
| `root` | 本地根目录(默认 `~/.cache/huggingface/lerobot`) |
| `episode-index` | 只检查指定集(可多值,如 `0 2 4`) |

检查项包括 `meta/` 是否齐全、集数是否对得上、parquet 的行数与索引是否连续、有没有 NaN、视频文件是否存在且帧数与 parquet 对齐,以及**相机格式**——双臂数据集会被判为 6 相机(四路触觉 + 两路腕相机)还是 8 相机(再加头显两只眼),两种格式训练时的输入维度不同。

### 双臂 8 相机 → 6 相机 {#8to6}

开了[头显相机](recording.md#56)录的双臂数据集是 8 相机格式。要把它降成 6 相机格式(与 `--robot.enable_head_camera=false` 录出来的同构),用 `lerobot-edit-dataset`:

```bash
lerobot-edit-dataset \
    --repo_id <your_org>/<dataset_8cam> \
    --new_repo_id <your_org>/<dataset_6cam> \
    --operation.type convert_8_to_6_cameras \
    --local_files_only
```

它丢掉头显两只眼的图像键,以及 `action` / `observation.state` 里的 `head_camera.*` 维度,**原数据集不动**,结果写到 `--new_repo_id`。源数据集本来就是 6 相机、或者相机键对不上预期时,命令直接报错拒绝转换,而不是转出一个说不清格式的数据集。

!!! tip "本地数据集加 `--local_files_only`"
    `lerobot-edit-dataset` 的各项操作默认允许在本地找不到时去 Hugging Face Hub 取;带上 `--local_files_only` 就只读本地,避免手滑打错 `repo_id` 时静悄悄从网上拉一份下来。

## 回放与可视化

- 在线浏览:数据集上传到 Hub 后,用 [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) 逐集查看视频与数据。
- 3D 轨迹:[开录前预览](recording.md#preview)时加 `--display_data=true`,在 Rerun 里查看夹爪位姿与轨迹(见 [`/world` 3D 视图](../common/coordinates.md#world-view))。
- 本地逐帧:用你本地这一版 `lerobot` 提供的数据集可视化脚本打开 parquet + mp4 逐帧检查。

## 上传 Hugging Face Hub 与备份 {#64}

上传即视为一次异地备份加交付:上传前先跑 `lerobot-check-dataset` 校验;重要数据集在删除或迁移前先备份整个 `<repo_id>/` 目录。

!!! warning "先登录 Hub"
    上传前执行 `hf auth login`(旧版也可使用 `huggingface-cli login`),或设置 `HF_TOKEN`,否则会因鉴权失败。

用已安装的 `lerobot-push-dataset-to-hub` 控制台入口推送:

```bash
# 基本用法(需要 --repo-id 与 --dataset-path)
lerobot-push-dataset-to-hub \
    --repo-id <your_org>/<your_dataset> \
    --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
```

常用变体:

=== "大数据集"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --upload-large-folder
    ```

=== "私有仓库"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --private
    ```

=== "不传视频"

    ```bash
    lerobot-push-dataset-to-hub \
        --repo-id <your_org>/<your_dataset> \
        --dataset-path ~/.cache/huggingface/lerobot/<your_org>/<your_dataset> \
        --no-videos
    ```

成功后数据集地址为 `https://huggingface.co/datasets/<repo_id>`。

## 磁盘规划与估算 {#storage-planning}

- 双夹爪多相机的原始视频数据吞吐可达约 **280 MB/s**;这不是编码后的磁盘写入速度,不要直接用它推算落盘量。实时编码后的体积取决于分辨率、画面内容、`fps`、编码器和码率。
- 粗估单条 episode 体积 ≈ 各编码视频流平均码率 × 时长 + Parquet 与元数据。相机数、分辨率、`fps`、`episode_time_s` 都会放大体积。
- 大批量采集前先录制 2–3 条代表性 episode,运行完整性检查,再测量实际体积并按计划集数估算:

```bash
du -sh ~/.cache/huggingface/lerobot/<your_org>/<your_dataset>
df -h ~/.cache/huggingface/lerobot          # 看目标盘剩余空间
```

## 清理与维护

磁盘紧张时,先确认数据已通过 `lerobot-check-dataset` 校验并完成备份或上传。为保留恢复机会,先把目标数据集移动到单独的隔离目录,观察无误后再通过文件管理器删除:

```bash
mkdir -p /data/lerobot-trash
realpath ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
du -sh ~/.cache/huggingface/lerobot/<your_org>/<old_dataset>
mv -- ~/.cache/huggingface/lerobot/<your_org>/<old_dataset> /data/lerobot-trash/
```

!!! warning "移动前核对 `realpath` 输出"
    必须是预期的单个数据集目录;不要对缓存根目录执行递归删除。

定期用 `df -h` 盯住目标盘,避免采集中途写满(见 [故障排查](troubleshooting.md))。

## 采集台账

为可追溯,建议每份数据集记一行台账。夹爪与触觉的序列号录制时已自动写进 `meta/hardware.json`,台账里照抄一份只是为了离线可查,两边不一致时以数据集里的那份为准;追踪器 SN 不在清单里,要记就得手写。

| `repo_id` | 任务描述 | 工位号 `--robot.id` | 夹爪 / 追踪器 SN | 标定时间 | 软件版本 / commit | 世界系会话 | 完整性检查 | 集数 / 单集时长 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| `Xense/pick_object_20260703` | `Pick up the object` | `0`(数据集里记为 `bi_taccap_0`) | `TCGU01A24Z0001m` / `PC2310MLL...` | 2026-07-03 | 采集当时的 `xense-taccap-lerobot main@<SHA>` 与 `xense.taccap <版本>` | XTac-UMI XR 启动时间 / 操作者朝向 | `lerobot-check-dataset` 通过;异常 episode 列表 | 50 / 15s | 光照/场景/异常集 |
