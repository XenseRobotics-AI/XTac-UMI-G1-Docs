---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

# 手持触觉数采<br>从开箱到数据集

<p class="tc-sub">同步录下视觉、触觉、手部与头部位姿<br>直接生成可训练的 <code>LeRobotDataset</code></p>

<p class="tc-note">XTac-UMI&nbsp;G1 夹爪配合 Pico4&nbsp;Ultra&nbsp;企业版头显与追踪器<br>基于 lerobot 采集</p>

[一页速通](quickstart.md){ .md-button .md-button--primary }
[了解设备](01-overview.md){ .md-button }

</div>

<div class="tc-stage" markdown>

<figure class="tc-tile tc-tile--leader" markdown>
![主夹爪](assets/product/leader-front-open-cutout.webp)
<figcaption markdown>[主夹爪：手持采集](hardware.md)</figcaption>
</figure>

<figure class="tc-tile tc-tile--follower" markdown>
![从夹爪](assets/product/follower-rear-ports.webp)
<figcaption markdown>[从夹爪：同构末端执行器](follower-overview.md)</figcaption>
</figure>

</div>

</div>

## 采集全流程

<div class="tc-flow" markdown>

<div class="tc-flow__group" markdown>

### ① 准备工作

<p class="tc-flow__lead">每台电脑、每台设备做一次</p>

1. **[认识硬件](hardware.md)**<br>
   部件、接线与上电顺序
2. **[安装环境](02-environment.md)**<br>
   `setup_env.sh` 或 Docker 镜像
3. **[配置主机](03-host-hardware.md#31)**<br>
   串口权限、关闭 ModemManager
4. **[配置 Pico4 Ultra 企业版](03-host-hardware.md#34)**<br>
   开发者模式、XR 应用、追踪器
5. **[标定主夹爪](04-calibration.md#41)**<br>
   零点与行程上限，每只一次

</div>

<div class="tc-flow__group" markdown>

### ② 采集

<p class="tc-flow__lead">每次采集按这个顺序</p>

1. **[上电与连接](03-host-hardware.md#36)**<br>
   插夹爪、开追踪器，关电脑 WiFi
2. **[启动服务与 XR 应用](03-host-hardware.md#35)**<br>
   先启 PC Service，再开 XR 应用
3. **[预览检查](05-data-collection.md#preview)**<br>
   `lerobot-teleoperate` 确认数据流
4. **[正式录制](05-data-collection.md#52)**<br>
   `lerobot-record`，中途不重启 XR

</div>

<div class="tc-flow__group" markdown>

### ③ 数据

<p class="tc-flow__lead">录完之后</p>

1. **[检查完整性](06-dataset.md#62)**<br>
   `lerobot-check-dataset`
2. **[上传 Hub（可选）](06-dataset.md#64)**<br>
   `lerobot-push-dataset-to-hub`
3. **[了解数据格式](06-dataset.md#61)**<br>
   每帧记录了什么、怎么读取

</div>

</div>

<p class="tc-flow__more" markdown>把从夹爪装到机器人上、用程序控制开合与夹持，见[从夹爪](follower-overview.md)；直接调用夹爪 SDK，见[附录：SDK 与二次开发](sdk-overview.md)。</p>

## 采集到的数据

<div class="tc-data" markdown>

<figure class="tc-shot" markdown>
![XTac-UMI XR 控制台：连接成功](assets/pico4/xr-console-connected.webp)
<figcaption>XTac-UMI XR：头显连上数采电脑后显示「连接成功」</figcaption>
</figure>

<figure class="tc-shot" markdown>
![八路画面与数据键的对应](assets/dataset/sensor-key-map.webp)
<figcaption>每一帧同步记录八路画面，图中标注了各自在数据集里的键名</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun 实时预览：四路视触觉、头显双目、左右腕部相机与动作曲线](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>预览检查：在 Rerun 里实时查看各路画面与位姿</figcaption>
</figure>

</div>

## 相关开源仓库

| 仓库 / 包 | 备注 |
|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | 数采主仓库，基于 lerobot 0.5.1 定制 |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | 夹爪 SDK，数采仓库以子模块引入；[开发文档](sdk-overview.md) |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Pico4 Ultra 企业版 PC 服务，以 `.deb` 安装 |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | 视触觉传感器 SDK，由安装脚本安装；[开发文档](https://docs.xenserobotics.com/) |
| [`xense-lerobot-viewer`](https://github.com/XenseRobotics-AI/xense-lerobot-viewer) | 开源的本地可视化工具，在浏览器里查看本地 LeRobot 数据集 |

!!! note "适用版本"
    数采部分使用 `xense-taccap-lerobot` 自带的 SDK（0.1.9 系列）；从夹爪章节与 SDK 附录使用单独安装的
    `xense.taccap` 0.4.1。各组件的版本基线见[版本与支持](versions.md)。
