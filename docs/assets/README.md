# docs/assets/ — 发布用素材

放这里的图片会被 mkdocs 打包进站点、随文档一起发布。**只有 `docs/` 内的文件才会进站点**
(项目根的 `materials/` 是原始资料,不发布)。

> 本文件本身通过 `mkdocs.yml` 的 `exclude_docs` 排除,不会生成页面。

## 目录约定

| 子目录 | 用途 | 对应页面 |
|---|---|---|
| `brand/` | 站点 logo(`logo.svg` 深色版、`logo-light.svg` 白色版给黑色页眉)、favicon | 主题 |
| `product/` | 产品渲染图、背包接口与标签照片、接线图 | 首页、product/ |
| `backpack/` | XTac-UMI Collector 控制台截图(多数仍是 0.3.16 拍的;界面已变的四张换成了占位图,见下方[占位图待补](#placeholder);文件名沿用 Taccap-User-Doc;首页与 product/ 的控制台展示图也从这里取) | 首页、product/、backpack/ |
| `pico4/` | Pico4 Ultra 企业版系统与 APP 截图 | common/pico4 |
| `hardware/` | 夹爪接口、锁紧、指示灯示意 | common/gripper、product/g1 |
| `bringup/` `record/` `dataset/` | PC 版启动、录制、数据集截图与示意图 | 首页、pc/ |
| `highlights/` | 产品视频的封面与截帧 | product/highlights |
| `video/` | 产品宣传视频 | product/highlights |
| `javascripts/` | PC 版总览的交互式架构图(`arch.js`) | pc/index |

## 占位图待补 {#placeholder}

文档已同步到 Collector 0.4.1,下面四张的界面在 0.4.1 结构性改过(不只是细节差异),
原图会误导读者,所以**先用占位图顶替**。拿到 0.4.1 真机后按「应当拍什么」重截,
**覆盖同名文件即可**,文档里的引用路径不用动;原图在 git 历史里可取回。

| 文件 | 应当拍什么 | 为什么原图失效 |
|---|---|---|
| `capture-mode.webp` | 系统 → 采集设置页首的「当前项目采集配置」只读块 | 原图是设备级、可点击切换的模式卡片;0.4.1 改成项目级、建项目时冻结,这一页只读展示 |
| `new-project.webp` | 新建项目对话框(含采集模式、PICO 分辨率、触觉导出方向、图像源、鱼眼矫正) | 原图只有项目名与上传后端;0.4.1 把采集配置挪进了建项目这一步 |
| `upload.webp` | 系统 → 上传配置,展开后端种类下拉 | 原图是三档后端;0.4.1 是五档(多了 FTP / FTPS 与 NFS) |
| `wifi.webp` | 系统 → 网络 / 配网,含热点开关与「域名」字段 | 原图的热点块是只读展示;0.4.1 可开关热点、可改 mDNS 域名 |

占位图是**双语**的(中文 + English):这四张在中英两套页面里共用同一个文件,
一份双语图两边都读得懂,省掉一套英文专用图和两边的引用改动。真机截图拍的是
控制台界面,界面本身是中文,与站内其余截图一致,不需要再出英文版。

其余截图暂按原样保留 —— 它们与 0.4.1 的差异还没有核实到「结构性改变」的程度,
拿真图换掉一张能看的旧图,不如先留着。重截时可一并核对。

## 从 docs/follower-gripper 带入的素材来源

### product/ 渲染图

原图(高分辨率 PNG)在 `materials/product-renders-orig/`,同名不同后缀;这里是发布用的 webp,
最长边 1400 px(五视图 2000 px),保留透明背景。

| 文件 | 内容 |
|---|---|
| `g1-family-scene.webp` | 整套产品合影:两只主夹爪、一只从夹爪、数采背包,白色台阶场景 |
| `leader-five-views.webp` | 主夹爪五视图 |
| `leader-front-open.webp` | 主夹爪前斜视,手指张开,可见腕部相机 |
| `leader-front-open-cutout.webp` | 同上,去掉柔光阴影并裁到主体,首页首屏用 |
| `leader-side-camera.webp` | 主夹爪侧视,腕部相机一侧,手指闭合 |
| `leader-side-port.webp` | 主夹爪侧视,Type-C 接口与手部绑带一侧 |
| `leader-rear-tracker.webp` | 主夹爪后斜视,追踪器与手柄 |
| `follower-five-views.webp` | 从夹爪五视图 |
| `follower-rear-ports.webp` | 从夹爪后斜视,Type-C 与 24V 电源口、法兰电机 |
| `follower-scene-front.webp` | 从夹爪场景图,前斜视,手指张开 |
| `follower-scene-side.webp` | 从夹爪场景图,侧视,可见接口(4:3) |
| `follower-scene-pedestal.webp` | 从夹爪场景图,置于台面,侧视(16:9) |

### pico4/ 产品图

| 文件 | 内容 | 来源 |
|---|---|---|
| `pico4-ultra-enterprise.webp` | Pico4 Ultra 企业版头显与手柄,已去背景 | PICO 官方产品图,原图与抠图在 `materials/pico4-orig/` |
| `pico4-motion-trackers.webp` | Pico4 Ultra 运动追踪器(出厂腕带形态),已去背景 | 同上 |
| `xr-console-idle.webp` / `xr-console-connected.webp`（及 `-en`） | XTac-UMI XR 0.3.2 控制台主界面，企业版、独立追踪，未连接 / 连接成功 | 用浏览器渲染安装包内的界面网页（`assets/html/index.html`）得到，原图在 `materials/pico4-orig/` |

这两张是第三方官方图片,不是我们自己拍摄或渲染的;替换或新增同类图片时注意来源与使用授权。

### highlights/ 与 video/ 产品视频

`video/xtac-umi-g1-market.mp4` 是产品宣传视频正式版（原文件 `XTac-UMI-High.qt`，1280×720、1 分 46 秒、带背景音乐与烧录的中文字幕），
只把封装从 `.qt` 换成带 faststart 的 `.mp4`，未重新编码；原文件备份在 `materials/market-video/`。
`highlights/` 下的图都从这段视频截帧，裁成 16:9 后存为 webp，场景图去掉了底部字幕：

| 文件 | 内容 | 视频时间 |
|---|---|---|
| `video-poster.webp` | 视频封面，主夹爪腕部相机特写 | 0:04 |
| `visuotactile.webp` | 指尖特写，配「集成视触觉传感能力」字样 | 0:06 |
| `handheld.webp` | 单手握持主夹爪 | 0:28 |
| `fingertip.webp` | 指尖夹取包链 | 0:54 |
| `system-sync.webp` | 双手持主夹爪，叠加位姿坐标轴，配「高精度位姿数据」字样 | 1:00 |
| `scene-office.webp` / `scene-workshop.webp` / `scene-retail.webp` | 办公桌面、工具工位、货架取物三个场景 | 1:06 / 1:11 / 1:20 |
| `backpack.webp` | 背负采集背包、手持主夹爪的背影 | 1:16 |
| `toolchain.webp` | 「打通主流生态 数据即刻可用」：主爪 → 背包 → 工具链 → 云端 | 1:38 |

### dataset/ 数据示意图

| 文件 | 内容 | 来源 |
|---|---|---|
| `sensor-key-map.webp` | 八路画面与数据集键名的对应图 | TacVerse 数据集卡片的 `sensor_key_map.png`（公开于 Hugging Face `TacVerse/TacVerse`，CC BY-SA 4.0；数采仓库 v0.0.8 上传数据集时也附带同一张图） |
| `rerun-xtac-umi-g1.webp` | Rerun 实时预览，`xtac_umi_g1`（双夹爪 + 头显）：四路视触觉、头显双目、左右腕部相机与动作 / 状态曲线 | 本公司实机截图 |
| `rerun-bi-taccap-gripper.webp` | Rerun 实时预览，`bi_taccap_gripper`（双夹爪，不带头显）：四路视触觉、左右腕部相机与状态 / 动作曲线 | 本公司实机截图 |

原图在 `materials/dataset-card-orig/`。


## 命名约定

- 全小写、连字符分隔、带章节前缀,便于定位:
  `pico4/3-4-pair-tracker.webp`、`bringup/3-6-step2-unity-client.webp`
- 截图与照片统一转成 `.webp`(最长边 ≤ 1400 px,质量 80 左右,单张一般 < 100 KB);矢量图示用 `.svg`。

## 在文档里引用

Markdown 里用**相对 docs 根**的路径。例如在 `docs/03-host-hardware.md` 中:

```markdown
![Pico4 Ultra 企业版配对追踪器](assets/pico4/3-4-pair-tracker.webp)
```

加说明/宽度(需要 `attr_list`,已启用):

```markdown
![启动 Unity 客户端](assets/bringup/3-6-step3-unity.webp){ width="480" }
```

点击放大(`glightbox` 已启用,默认对内容区图片生效,无需额外语法)。

## 启用自定义 logo / favicon

把文件放到 `brand/` 后,取消 `mkdocs.yml` 里这两行的注释:

```yaml
theme:
  logo: assets/brand/logo.png
  favicon: assets/brand/favicon.png
```
