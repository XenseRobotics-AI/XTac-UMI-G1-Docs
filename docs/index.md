---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

<span class="tc-eyebrow">XTac-UMI · 手持式多模态数据采集系统</span>

# 让机器人数据集<br>拥有触觉

<p class="tc-sub">双手触觉、视觉与位姿同步记录<br>一次手持示教，直接得到可训练的数据集</p>

<p class="tc-note">XTac-UMI&nbsp;G1 双夹爪配合 Pico4&nbsp;Ultra&nbsp;企业版头显<br>背包版、PC 版两种配置可选</p>

[选择配置](product/editions.md){ .md-button .md-button--primary }
[观看产品视频](#highlights){ .md-button }

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
- **即采即用**：原生输出 LeRobot、MCAP，录完就能训练

[了解产品亮点](product/highlights.md){ .md-button .md-button--primary }

</div>

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
<figcaption>头显连接成功</figcaption>
</figure>

<figure class="tc-shot" markdown>
![八路画面与数据键的对应](assets/dataset/sensor-key-map.webp)
<figcaption>八路画面同步记录</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun 实时预览：四路视触觉、头显双目、左右腕部相机与动作曲线](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>Rerun 实时预览</figcaption>
</figure>

</div>

## 录之前先看见

控制台的实时监控属于背包版的能力，正文见[背包版入口](backpack/index.md#overview)。

## 相关仓库

PC 版基于 lerobot 开源生态，数采主仓库、夹爪 SDK 与追踪器服务的完整清单见[参考资料](common/reference.md#references)。背包版是整机交付，采集软件预装在背包里，不需要自行安装这些仓库。
