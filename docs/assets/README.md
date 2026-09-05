# docs/assets/ — 发布用素材

放这里的图片会被 mkdocs 打包进站点、随文档一起发布。**只有 `docs/` 内的文件才会进站点**
(项目根的 `materials/` 是原始资料,不发布)。

> 本文件本身通过 `mkdocs.yml` 的 `exclude_docs` 排除,不会生成页面。

## 目录约定

| 子目录 | 用途 | 对应页面 |
|---|---|---|
| `brand/` | 站点 logo(`logo.svg` 深色版、`logo-light.svg` 白色版给黑色页眉)、favicon | 主题 |
| `product/` | 产品渲染图、背包接口与标签照片、接线图 | 首页、product/ |
| `backpack/` | XTac-UMI Collector 控制台截图(按 0.3.16 核对,其中导出、设置、系统更新几页的旧图待重截;文件名沿用 Taccap-User-Doc;首页与 product/ 的控制台展示图也从这里取) | 首页、product/、backpack/ |
| `pico4/` | Pico4 Ultra 企业版系统与 APP 截图 | common/pico4 |
| `hardware/` | 夹爪接口、锁紧、指示灯示意 | common/gripper、product/g1 |
| `bringup/` `record/` `dataset/` | PC 版启动、录制、数据集截图 | pc/ |

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
