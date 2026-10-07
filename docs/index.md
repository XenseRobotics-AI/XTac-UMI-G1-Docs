---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

<span class="tc-eyebrow">XTac-UMI · 手持式多模态数据采集系统</span>

# 让机器人数据集<br>拥有触觉

<p class="tc-sub">双手触觉、视觉与位姿同步记录<br>一次人类示范，直接得到可训练的数据集</p>

<p class="tc-note">XTac-UMI&nbsp;G1 双夹爪配合 Pico4&nbsp;Ultra&nbsp;企业版头显<br>背包版、PC 版两种配置可选</p>

[认识 XTac-UMI G1](product/g1.md){ .md-button .md-button--primary }
[选择配置](product/editions.md){ .md-button }

</div>

<div class="tc-stage" markdown>

<figure class="tc-tile tc-tile--leader" markdown>
![主夹爪](assets/product/leader-front-open-cutout.webp)
<figcaption markdown>[主夹爪：手持采集](common/gripper.md)</figcaption>
</figure>

<figure class="tc-tile tc-tile--follower" markdown>
![从夹爪](assets/product/follower-rear-ports.webp)
<figcaption markdown>[从夹爪：同构末端执行器](follower/index.md)</figcaption>
</figure>

</div>

</div>

<p class="tc-slogan">触觉点亮物理智能</p>

<div class="xu-stats" markdown>

**8 路画面** 4 视触觉 + 2 腕部鱼眼 + 2 头显

**3 组 6DoF 位姿** 左右夹爪 + 头部

**5 ms 同步** 定位精度 < 3 mm

**MCAP · LeRobot v3** 原始与训练格式

</div>

## 产品亮点 {#highlights}

<div class="tc-feature" markdown>

<figure class="tc-video">
<video controls preload="none" playsinline poster="assets/highlights/video-poster.webp">
<source src="assets/video/xtac-umi-g1-market.mp4" type="video/mp4">
</video>
</figure>

<div class="tc-feature__text" markdown>

- **视触融合**：指尖三色光视触觉，记录接触位置、夹取稳定性与滑移趋势
- **贴近人手**：穿戴式主夹爪，抓取、插拔、薄片夹取都能完成
- **精确同步**：多设备时间同步 5 ms，空间定位 < 3 mm
- **开放格式**：输出 LeRobot / MCAP 格式，兼容主流数据生态

[了解产品亮点](product/highlights.md){ .md-button .md-button--primary }

</div>

</div>

## 两种配置，按场景选择

两种配置使用同一套夹爪与头显，录出的数据定义一致。背包版是整机交付、开箱即用，采集软件不开源；PC 版的采集软件与夹爪 SDK 开源，可以自由二次开发。

<div class="grid cards xu-cards" markdown>

-   ![XTac-UMI 数采背包正面接口](assets/product/backpack-ports-front.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">背包版</span>

    **XTac-UMI 数采背包**{ .xu-card__title }

    ---

    - 背包完成全部采集计算，无需电脑
    - 平板浏览器即控制台，夹爪按键开始、停止录制
    - 单人背负即可作业，适合现场与长时间采集
    - 一键将数据集上传到 ModelScope，支持 MCAP 与 LeRobotDataset v3 两种格式

    整机交付、开箱即用，采集软件不开源；适用于规模化数据采集团队与数采工厂
    { .xu-card__fit }

    [快速开始](backpack/quickstart.md){ .md-button .md-button--primary }
    [了解背包](product/backpack.md){ .md-button }
    { .xu-card__actions }

-   ![XTac-UMI G1 视触觉夹爪](assets/product/g1-render-hero.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">PC 版</span>

    **XTac-UMI G1 开发套件（开源）**{ .xu-card__title }

    ---

    - 夹爪与头显直接连接您的工作站
    - 基于开源 LeRobot，录制即得到 LeRobotDataset
    - 采集软件与夹爪 SDK 开源，可自由二次开发
    - 支持从夹爪，可在机器人上执行与回放动作

    适用于科研与算法团队、自建训练流程
    { .xu-card__fit }

    [快速开始](pc/quickstart.md){ .md-button .md-button--primary }
    [对比两种配置](product/editions.md){ .md-button }
    { .xu-card__actions }

</div>

## 采集到的数据

<div class="tc-data" markdown>

<figure class="tc-shot" markdown>
![八路画面对应的传感器位置及其在数据集里的键名](assets/dataset/sensor-key-map.webp)
<figcaption>传感器位置与数据键名</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun 实时预览：四路视触觉、头显双目、左右腕部相机与动作曲线](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>采集中 Rerun 实时预览（PC 版）</figcaption>
</figure>

<figure class="tc-shot" markdown>
![xense-lerobot-viewer 3D 回放：夹爪与头显轨迹、腕部与头显画面、四路视触觉](assets/dataset/viewer-3d-replay.webp)
<figcaption>录完用 xense-lerobot-viewer 3D 回放</figcaption>
</figure>

</div>

## 公开数据集 TacVerse {#tacverse}

<div class="tc-feature tc-feature--dataset" markdown>

![TacVerse 覆盖的三类场景：办公、家庭、工作台](assets/dataset/tacverse-scenes.webp)

<div class="tc-feature__text" markdown>

用 XTac-UMI G1 双夹爪采集的视触觉操作数据，以 LeRobotDataset v3 格式按 CC BY-SA 4.0 协议开放，可直接下载训练。

- **122 个任务**：覆盖办公、家庭、工作台三类场景
- **17,690 条人类示范**：共 370 小时、约 4,000 万帧
- **双手视触觉**：每帧四路触觉、两路腕部画面与夹爪位姿

[Hugging Face](https://huggingface.co/TacVerse){ .md-button .md-button--primary }
[ModelScope](https://modelscope.cn/datasets/XenseRobotics/TacVerse-Opendata){ .md-button }

</div>

</div>

## PC 版开源仓库

PC 版的数采主仓库、夹爪 SDK、追踪器服务与可视化工具均以 Apache-2.0 许可开源，清单见 [PC 版开源仓库](pc/index.md#repos)；背包版采集软件不开源。
