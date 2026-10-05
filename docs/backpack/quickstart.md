# 一页速通（TL;DR）

从开机到导出第一份数据集，照着做即可。开始前确认这三项都已完成：

- 头显已升级系统、装好 XTac-UMI XR，两只追踪器已配对 → [Pico4 头显与追踪器](../common/pico4.md)
- 平板已打开 USB 调试并信任背包（只需一次） → [平板插 USB](network.md#tablet)
- 主夹爪已标定 → 控制台 系统 → [夹爪配置](system.md#gripper)

## 1. 接线与上电 {#power-on}

1. 两只主夹爪分别接背包 `UMI-L` / `UMI-R`。
2. 头显用 Pico → Pack 线接背包 `PICO` 口。
3. 给背包供电：固定工位接适配器，移动采集接充电宝。

![充电宝供电接线：左右主夹爪与头显接数采背包，充电宝接背包 DC 口](../assets/product/backpack-wiring-powerbank-diagram.webp)

## 2. 打开控制台 {#console}

平板用数据线接背包 `HOST1` 或 `HOST2` 口，背包会自动在平板上打开控制台。

## 3. 连接头显 {#headset}

**面朝作业方向**戴上头显，打开 XTac-UMI XR，勾选「USB网络」，点「连接」，网络状态变为「连接成功」。

![XTac-UMI XR 控制台：连接成功](../assets/pico4/xr-console-connected.webp){ width="560" }

!!! warning "采集期间不要重启 XR 应用"
    重启会重设世界坐标系原点，同一数据集里的位姿就对不上了。

## 4. 选项目与任务 {#project}

在控制台「实时监控」页底部选项目和任务；没有就选「新建项目…」「新建任务…」。新建项目时选定[采集模式](monitor-record.md#project-task)（如「双爪 + 头显双目」），任务要填写自然语言指令。

## 5. 开录前检查 {#checks}

![实时监控页](../assets/backpack/monitor-live.webp)

- 各路相机画面都有图像，鱼眼清晰。
- 位姿视图随手移动，左右没有接反。
- 开合度随夹爪开合变化。

录制按钮不可用时，页面会写明原因，见[开录门槛](monitor-record.md#record-gates)。

## 6. 用夹爪按键录制 {#record}

| 操作 | 按键 | 反馈 |
|---|---|---|
| 开始录制 | 右爪长按 | 灯转绿色呼吸 |
| 停止录制 | 左爪长按 | 白灯闪一次，已保存 |
| 删除上一条 | 左爪双击，再双击确认 | 紫灯 |

完整手势、灯语与语音见[夹爪按键、指示灯与语音](gripper.md)。

## 7. 导出与上传 {#export}

控制台「项目」页选中任务，点「导出」：

1. 自动预检数据完整性，未通过时按提示处理。
2. 选去向：下载压缩包，或上传到事先配置好的后端（ModelScope、S3、FTP、NFS）。
3. 选格式：LeRobotDataset v3 或 MCAP。

详见[项目、导出与发布](projects-export.md)。
