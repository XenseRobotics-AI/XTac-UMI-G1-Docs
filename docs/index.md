---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<span class="tc-eyebrow">XTac-UMI · 手持式多模态数据采集系统</span>

# 让机器人数据集拥有触觉

<p class="tc-sub">双夹爪视触觉、腕部鱼眼、头显第一视角与 6DoF 位姿同步记录。一次手持示教，直接得到可训练的数据集。</p>

[选择配置](product/editions.md){ .md-button .md-button--primary }
[看看数据长什么样](pc/dataset.md#61){ .md-button }

![XTac-UMI G1 产品外观](assets/product/xtac-umi-g1-hero.webp){ .tc-hero-img }

</div>

<div class="xu-stats" markdown>

**3 路 / 爪** 1 鱼眼 + 2 视触觉

**6DoF** 头显与双追踪器位姿

**30 Hz** 多源同步记录

**MCAP · LeRobot v3** 原始与训练格式

</div>

## 两种配置，一套夹爪

选一个开始。两边的硬件、标定和数据定义相同，差别只在计算放在哪、你用什么操作。

<div class="grid cards xu-cards" markdown>

-   ![XTac-UMI 数采背包正面接口](assets/product/backpack-ports-front.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">背包版</span>

    **XTac-UMI 数采背包**{ .xu-card__title }

    ---

    - 背包即主机，平板即控制台，不需要 PC
    - 夹爪按键开录，灯语反馈，单人可操作
    - MCAP 原始记录，一键发布 LeRobot 到 ModelScope

    适合：规模化数采工厂与采集团队；软件闭源交付，支持轻量二次开发
    { .xu-card__fit }

    [快速开始](backpack/index.md){ .md-button .md-button--primary }
    [了解背包](product/backpack.md){ .md-button }
    { .xu-card__actions }

-   ![XTac-UMI G1 视触觉夹爪](assets/product/g1-render-hero.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">PC 版</span>

    **XTac-UMI G1 开发套件**{ .xu-card__title }

    ---

    - 接入你自己的 x86 工作站，完全走 LeRobot 框架
    - `lerobot-record` 直接产出 LeRobotDataset
    - 基于 lerobot 开源生态，完全开放二次开发

    适合：研究与算法团队、自建训练管线
    { .xu-card__fit }

    [快速开始](pc/quickstart.md){ .md-button .md-button--primary }
    [对比两种配置](product/editions.md){ .md-button }
    { .xu-card__actions }

</div>

## 采集到的数据

<div class="tc-data" markdown>

<figure class="tc-shot" markdown>
![XTac-UMI XR 控制台：连接成功](assets/pico4/xr-console-connected.webp)
<figcaption>XTac-UMI XR：头显连上采集单元后显示「连接成功」</figcaption>
</figure>

<figure class="tc-shot" markdown>
![八路画面与数据键的对应](assets/dataset/sensor-key-map.webp)
<figcaption>每一帧同步记录八路画面，图中标注了各自在数据集里的键名</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun 实时预览：四路视触觉、头显双目、左右腕部相机与动作曲线](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>PC 版预览检查：在 Rerun 里实时查看各路画面与位姿</figcaption>
</figure>

</div>

## 录之前先看见

控制台的实时监控属于背包版的能力，正文见[背包版入口](backpack/index.md#overview)。

## 相关仓库

PC 版基于 lerobot 开源生态，数采主仓库、夹爪 SDK 与追踪器服务的完整清单见[参考资料](common/reference.md#references)。背包版是整机交付，采集软件预装在背包里，不需要自行安装这些仓库。
