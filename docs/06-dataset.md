# 6. 数据集与示例

本章讲采完之后:数据集长什么样、如何校验、回放、上传 Hub。

!!! abstract "第一次用 lerobot?先读官方文档"
    我们的数据落盘为标准 **LeRobotDataset v3.0** 格式。没接触过 lerobot 的用户,强烈建议先读官方文档,
    再回来看本章的 XTac-UMI G1 具体用法:

    - :material-book-open-variant: **LeRobotDataset v3.0 官方文档**:<https://huggingface.co/docs/lerobot/lerobot-dataset-v3>
      (格式设计、目录结构、录制、加载/流式、v2.1→v3.0 迁移)
    - :material-book-open-variant: lerobot 录制指南:<https://huggingface.co/docs/lerobot/il_robots#record-a-dataset>
    - :material-book-open-variant: lerobot 文档首页:<https://huggingface.co/docs/lerobot>

    **v3.0 要点**:基于文件存储(多集合并进大 Parquet/MP4 文件)、关系型元数据定位集边界、
    支持 Hub 原生流式;相比 v2 大幅减少小文件、初始化更快。

## 6.1 LeRobotDataset 格式速览 {#61}

采集产出标准 `LeRobotDataset`,默认落在 `~/.cache/huggingface/lerobot/<repo_id>/`。
它可以像普通 Hugging Face / PyTorch 数据集一样索引:

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("<your_org>/<your_dataset>")
sample = ds[0]          # 单帧:观测 + 动作,均为 torch tensor
```

序列化方式:

- `hf_dataset`:Hugging Face datasets → parquet
- 视频(触觉 + 腕相机):mp4(省空间)
- 元数据:纯 json / jsonl(`info` / `episodes` / `stats` / `tasks`)

!!! tip "时序查询 delta_timestamps"
    可按与索引帧的时间关系一次取多帧,如
    `delta_timestamps = {"observation.image": [-1, -0.5, -0.2, 0]}` 取当前帧及其前
    1s / 0.5s / 0.2s 三帧。

`info` 里的关键元数据:`fps`、`features`、`total_episodes`、`total_frames`、
`robot_type`、`data_path`、`video_path`。

!!! info "XTac-UMI G1 多出来的两样:`meta/hardware.json` 和 `meta/runtimes/`"
    标准 LeRobotDataset 只在 `info` 里记 `robot_type`,说不出这批数据是**哪套硬件**采的,
    更说不出采的时候那枚传感器的标定长什么样。所以录制时会额外写两样东西:

    **`meta/hardware.json` —— 谁采的。**工位号 `robot_id`、每只夹爪的**固件 SN**、
    以及它上面两枚触觉传感器的 SN(每枚带着自己对应的观测键)。它是一个 **`epochs` 数组**:
    数据集录到一半换了夹爪或传感器,旧段在当前集数处封口、新段接上,
    每一集都仍然指向真正采它的那套设备。

    **`meta/runtimes/` —— 采的时候标定长什么样。**每枚触觉传感器一份 runtime bundle
    (`<SN>-<时间>.bin`,约 841 KB),`epochs` 里的传感器各自指向自己那一份。
    从录下来的 `rectify` 流重建 depth / force / difference 要用它。

    两者都是**独立文件**,不动上游的 `info` 结构,所以不影响任何按标准格式读这份数据集的工具。
    字段含义、续录行为、以及重建时的注意事项 →
    [`--robot.id` 与硬件清单](05-data-collection.md#robot-id)。

## 6.2 数据校验 {#62}

用 `lerobot-check-dataset` 检查数据集完整性(帧数、视频、字段一致性等):

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

!!! note "这条命令环境里就有"
    `lerobot-check-dataset` 由采集程序一起装好,Mamba 和 Docker 两条路径下都能直接敲,
    不需要去仓库里找脚本。

## 6.3 回放与可视化

- **在线数据集可视化**:数据集上传到 Hugging Face Hub 后,可使用 [LeRobot Dataset Visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) 在线浏览各 episode 的视频与数据。
- **3D 轨迹**:[开录前预览](05-data-collection.md#preview)时加 `--display_data=true`,
  在 Rerun 里查看夹爪位姿与轨迹(见 [`/world` 3D 视图](05-data-collection.md#world-view))。
- **数据集浏览**:用 lerobot 官方的数据集可视化工具打开 parquet + mp4 逐帧检查
  (以你本地这一版 `lerobot` 提供的可视化脚本为准)。

## 6.4 上传 Hugging Face Hub {#64}

用已安装的 `lerobot-push-dataset-to-hub` 控制台入口推送到 Hub:

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

!!! tip "先登录 Hub"
    上传前确保已执行 `hf auth login`(旧版也可使用 `huggingface-cli login`),或设置 `HF_TOKEN`,否则会因鉴权失败。

下一步 → [7. 常见问题与参考](07-faq-reference.md)
