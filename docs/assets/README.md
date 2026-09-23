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
| `bringup/` `record/` `dataset/` | PC 版启动、录制、数据集截图 | pc/ |

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

其余截图暂按原样保留 —— 它们与 0.4.1 的差异还没有核实到「结构性改变」的程度,
拿真图换掉一张能看的旧图,不如先留着。重截时可一并核对。

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
