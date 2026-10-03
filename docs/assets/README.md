# docs/assets/ — 发布用素材

放这里的图片会被 mkdocs 打包进站点、随文档一起发布。**只有 `docs/` 内的文件才会进站点**
(项目根的 `materials/` 是原始资料,不发布)。

> 本文件本身通过 `mkdocs.yml` 的 `exclude_docs` 排除,不会生成页面。

## 目录约定

| 子目录 | 用途 | 对应章节 |
|---|---|---|
| `brand/` | 站点 logo、favicon | 主题 |
| `pico4/` | Pico4 Ultra 企业版 APP 使用截图 | §3.4 |
| `bringup/` | 数采启动流程截图 | §3.6 |
| `hardware/` | 设备/串口/接线/发现规则示意 | §3 |
| `record/` | 录制终端/界面、Rerun 截图 | §4 / §5 |
| `dataset/` | 数据集结构、校验、可视化 | §6 |
| `product/` | 产品渲染图(主夹爪、从夹爪、整套合影) | 首页、硬件介绍、从夹爪 |

## 命名约定

- 全小写、连字符分隔、带章节前缀,便于定位:
  `pico4/3-4-pair-tracker.png`、`bringup/3-6-step2-unity-client.png`
- 优先 `.png`(截图)/`.svg`(矢量图示);大图控制在合理体积(建议 < 500 KB)。

## product/ 渲染图

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

## pico4/ 产品图

| 文件 | 内容 | 来源 |
|---|---|---|
| `pico4-ultra-enterprise.webp` | Pico4 Ultra 企业版头显与手柄,已去背景 | PICO 官方产品图,原图与抠图在 `materials/pico4-orig/` |
| `pico4-motion-trackers.webp` | Pico4 Ultra 运动追踪器(出厂腕带形态),已去背景 | 同上 |

这两张是第三方官方图片,不是我们自己拍摄或渲染的;替换或新增同类图片时注意来源与使用授权。

## dataset/ 数据示意图

| 文件 | 内容 | 来源 |
|---|---|---|
| `sensor-key-map.webp` | 八路画面与数据集键名的对应图 | TacVerse 数据集卡片的 `sensor_key_map.png`（公开于 Hugging Face `TacVerse/TacVerse`，CC BY-SA 4.0；数采仓库 v0.0.8 上传数据集时也附带同一张图） |
| `rerun-preview.webp` | Rerun 实时预览截图：四路视触觉、头显双目、左右腕部相机与动作 / 状态曲线 | 本公司实机截图 |

原图在 `materials/dataset-card-orig/`。

## 在文档里引用

Markdown 里用**相对 docs 根**的路径。例如在 `docs/03-host-hardware.md` 中:

```markdown
![Pico4 Ultra 企业版配对追踪器](assets/pico4/3-4-pair-tracker.png)
```

加说明/宽度(需要 `attr_list`,已启用):

```markdown
![启动 Unity 客户端](assets/bringup/3-6-step3-unity.png){ width="480" }
```

点击放大(`glightbox` 已启用,默认对内容区图片生效,无需额外语法)。

## 启用自定义 logo / favicon

把文件放到 `brand/` 后,取消 `mkdocs.yml` 里这两行的注释:

```yaml
theme:
  logo: assets/brand/logo.png
  favicon: assets/brand/favicon.png
```
