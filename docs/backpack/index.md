# 背包版：XTac UMI 数采背包

**XTac UMI 数采背包**是背包版的采集主机：夹爪与头显直接接上，采集软件 XTac UMI Collector 运行在背包里，平板、手机或电脑用浏览器打开控制台即可，不需要电脑，也不依赖现场网络。

- **单人作业**：夹爪按键开始、停止录制，指示灯与语音反馈状态。
- **原始记录**：每条人类示范存为一个 MCAP 文件，按项目与任务管理。
- **交付**：按任务导出 LeRobot 数据集或 MCAP，下载或上传到 ModelScope、S3、FTP、NFS 等。

![控制台实时监控页：各路相机、视触觉与位姿同屏](../assets/backpack/monitor-live.webp)

[一页速通](quickstart.md){ .md-button .md-button--primary }
[对比两种配置](../product/editions.md){ .md-button }

## 从哪开始 {#first-deploy}

操作前先读[安全与合规](../product/safety.md)。首次部署按下表顺序做一遍；之后每天开工照[一页速通](quickstart.md)走。

| 步骤 | 做什么 | 详见 |
|---|---|---|
| 1. 头显配置 | 升级 Pico OS，开启开发者模式、灭屏与休眠设为「永不」，配对两只追踪器（左奇右偶），安装 XTac UMI XR | [Pico4 头显与追踪器](../common/pico4.md) |
| 2. 接线与供电 | 夹爪 → 头显 → 背包上电；适配器或充电宝供电 | [开箱、接线与供电](unbox-connect.md) |
| 3. 打开控制台 | 平板插背包 `HOST1` / `HOST2` 口自动打开；没有平板用背包热点 | [网络与控制台入口](network.md) |
| 4. 头显连背包 | XTac UMI XR 里连接方式选「XTac」，点「连接」 | [头显接背包](unbox-connect.md#pico-link) |
| 5. 夹爪标定 | 每只主夹爪标一次闭合零点与最大行程 | [夹爪配置](system.md#gripper) |
| 6. 建项目与任务 | 新建项目时选定采集模式，建完不能改 | [选项目与任务](monitor-record.md#project-task) |
| 7. 上传配置（可选） | 保存远端账号，新建项目时绑定 | [上传配置](system.md#upload) |

## 控制台 {#console}

浏览器打开背包地址即进入控制台，顶栏四个页面：

| 页面 | 做什么 | 详见 |
|---|---|---|
| 实时监控 | 各路画面、位姿与开合度同屏；选项目与任务，开始 / 结束录制 | [实时监控与录制](monitor-record.md) |
| 项目 | 管理录制：回放、删除、导出、上传、归档 | [项目、回放与导出](projects-export.md) |
| 回放 | 在线回放任意一条录制 | [回放](projects-export.md#playback) |
| 系统 | 设备信息、夹爪标定与固件、采集设置、上传配置、网络、系统更新、界面语言 | [系统设置](system.md) |

录制主要用夹爪按键：右爪长按开始、左爪长按停止，浏览器不在线也能录，见[夹爪按键、指示灯与语音](gripper.md)。

## 数采系统组成 {#system}

各路设备接到背包，背包保存原始记录，导出时再按任务生成数据集。把鼠标移到（手机上点按）任一模块，可以看到它的数据从哪来、到哪去；上方按钮切换三种[采集模式](system.md#capture-mode)。

<div class="tc-arch" data-layout="backpack"><script type="application/json">
{
  "defaultTier": 2,
  "title": "数采背包版数采系统架构",
  "tiers": [
    "双爪",
    "双爪 + 头显双目",
    "双爪 + 头显右单目"
  ],
  "cols": {
    "dev": "设备",
    "read": "数采背包 · 读取",
    "core": "数采背包 · 处理",
    "out": "输出",
    "up": "取回与上传"
  },
  "group": "主夹爪 ×2（左 / 右）",
  "hint": "把鼠标移到（或点按）任一模块，查看它的数据从哪来、到哪去。",
  "sep": "：",
  "offNote": "（当前模式不使用）",
  "legend": [
    "数据与位姿",
    "头显画面"
  ],
  "edges": {
    "e-grip": "USB 串口",
    "e-tact": "USB",
    "e-wrist": "USB",
    "e-track": "无线",
    "e-head": "Type-C 有线"
  },
  "nodes": {
    "grip": {
      "title": "主控板 · 编码器",
      "sub": "开合 · IMU · 按键",
      "desc": "主夹爪主控板把开合角度与 IMU（各 100Hz）以及按键手势经 USB 上报给背包。"
    },
    "tact": {
      "title": "视触觉传感器 ×2",
      "sub": "左右指各一",
      "desc": "每指一个视触觉传感器，以 640 × 480、120fps 采集。"
    },
    "wrist": {
      "title": "腕部相机",
      "sub": "手腕视角鱼眼",
      "desc": "手腕视角的鱼眼画面，640 × 480、30fps。"
    },
    "tracker": {
      "title": "运动追踪器 ×2",
      "sub": "Pico4 Ultra",
      "desc": "装在每只夹爪顶部，由头显跟踪 6-DoF 位姿。背包版的所有采集模式都需要它。"
    },
    "headset": {
      "title": "头显",
      "sub": "Pico4 Ultra 企业版",
      "desc": "运行 XTac UMI XR，经 Type-C 线把位姿送到背包，只能有线连接；录头显画面的模式下还送来双目或右单目画面（每眼 640 × 480 或 1024 × 768）。"
    },
    "mcu": {
      "title": "夹爪数据",
      "sub": "开合 · IMU · 按键",
      "desc": "读取开合与 IMU；按键手势控制录制。"
    },
    "tcam": {
      "title": "触觉采集",
      "sub": "原始画面 · 120fps",
      "desc": "按原始画面采集与保存；导出时再用传感器自带的矫正参数，按项目所选方向矫正（默认 700 × 400）。"
    },
    "fcam": {
      "title": "鱼眼采集",
      "sub": "原始画面 · 30fps",
      "desc": "按原始鱼眼画面保存；去畸变参数在开录时记下，导出时再矫正。"
    },
    "xvr": {
      "title": "内置位姿服务",
      "sub": "随背包启动",
      "desc": "背包内置位姿服务，开机即在，不用单独启动；开录前与头显对时，头显画面带采集时间戳。"
    },
    "enc": {
      "title": "硬件编码",
      "sub": "H.264 · 仅用于预览",
      "desc": "背包硬件把画面编码一次，同时推给所有打开控制台的设备做实时预览；录制保存的是原始画面，不经过这一步。"
    },
    "rec": {
      "title": "录制",
      "sub": "按键或控制台触发",
      "desc": "开录前确认每路相机与夹爪数据都已就绪；录制中保存各路原始画面、开合、IMU 与位姿，并统计坏帧与追踪丢失，录完给出质量提示。"
    },
    "console": {
      "title": "浏览器控制台",
      "sub": "平板 · 手机 · 电脑",
      "desc": "用浏览器打开背包的控制台：实时监控、项目、回放与系统设置。"
    },
    "mcap": {
      "title": "MCAP 原始记录",
      "sub": "每条一个文件 · NVMe",
      "desc": "每条人类示范存为一个 MCAP 文件，放在背包的 NVMe 数据盘，包含全部原始画面、传感器数据与标定信息。"
    },
    "export": {
      "title": "按任务导出",
      "sub": [
        "LeRobot v3 / MCAP",
        "导出前自动预检"
      ],
      "desc": "按任务导出 LeRobotDataset v3 或 MCAP，导出前自动检查录制是否完整，再选择下载到本地或上传到远端。"
    },
    "dl": {
      "title": "下载到本地",
      "sub": "打包取回",
      "desc": "在控制台把导出结果打包，下载到平板或电脑。"
    },
    "upload": {
      "title": "上传到远端",
      "sub": [
        "ModelScope · S3",
        "FTP · NFS"
      ],
      "desc": "上传到事先配置好的后端：ModelScope、S3、FTP / FTPS 或 NFS；上传后默认保留本地文件，需要腾空间时再归档。"
    }
  }
}
</script></div>

## 每帧记录什么 {#frame}

导出的 LeRobot 数据集里，每一行由第 t-1 帧的**观测**和第 t 帧的**动作**组成。把鼠标移到（手机上点按）任一数据项，可以看到它从哪来、存到哪。

<div class="tc-arch" data-diagram="frame"><script type="application/json">
{
  "title": "数采背包导出的 LeRobot 数据集每一行的组成",
  "tiers": [
    "双爪",
    "双爪 + 头显双目",
    "双爪 + 头显右单目"
  ],
  "defaultTier": 2,
  "on": {
    "ltrk": [
      1,
      2,
      3
    ],
    "rtrk": [
      1,
      2,
      3
    ],
    "o_ltcp": [
      1,
      2,
      3
    ],
    "o_rtcp": [
      1,
      2,
      3
    ],
    "a_ltcp": [
      1,
      2,
      3
    ],
    "a_rtcp": [
      1,
      2,
      3
    ],
    "head": [
      2,
      3
    ],
    "o_head": [
      2,
      3
    ],
    "a_head": [
      2,
      3
    ],
    "L_h": [
      2
    ],
    "R_h": [
      2,
      3
    ]
  },
  "keyNames": {
    "L_h": "head_left",
    "R_h": "head_right",
    "o_head": "head.*",
    "a_head": "head.*"
  },
  "cols": {
    "src": "来源",
    "obs": "观测 · 第 t-1 帧",
    "act": "动作 · 第 t 帧",
    "out": "落盘"
  },
  "groups": {
    "img": "observation.images · {n} 路",
    "state": "observation.state · {n} 维",
    "act": "action · {n} 维"
  },
  "timeline": {
    "caption": "时间 →",
    "obs": "观测",
    "act": "动作",
    "row": "数据集的一行"
  },
  "hint": "把鼠标移到（或点按）任一数据项、来源或落盘位置，查看它从哪来、存到哪。",
  "sep": "：",
  "offNote": "（当前模式不录）",
  "dims": "共 {n} 维。",
  "obsNote": "观测里记的是第 t-1 帧的值。",
  "actNote": "动作里记的是第 t 帧的值，比观测领先一步。",
  "keys": {
    "tactile": "这只夹爪一根手指上的视触觉图像，导出时矫正，默认 700 × 400 横图（可在项目里选 400 × 700），30fps。",
    "wrist": "这只夹爪的腕部鱼眼画面，640 × 480；项目开启腕部鱼眼矫正时导出为矫正后的画面。",
    "headimg": "头显一只眼的画面，每眼 640 × 480 或 1024 × 768（按项目设置）。双目模式录左右两眼，右单目模式只录右眼。",
    "tcp": "这只夹爪末端（两指中点）在世界系下的位姿：位置 x、y、z（米）加 6-D 旋转 r1–r6，由追踪器位姿换算得到。三种模式都录。",
    "grip": "这只夹爪的开合度，闭合 = 0、张开 = 1。",
    "headpose": "头显在世界系下的位姿，格式与 tcp.* 相同，只在录头显画面的模式里写入。"
  },
  "nodes": {
    "lgrip": {
      "title": "左夹爪",
      "sub": "触觉 · 腕相机 · 编码器",
      "desc": "提供两路视触觉图像、腕部鱼眼画面和开合度。"
    },
    "ltrk": {
      "title": "左追踪器",
      "sub": "经头显与背包",
      "desc": "位姿换算到左夹爪末端，得到 left_tcp.*，观测和动作里各有一份。三种模式都录。"
    },
    "rgrip": {
      "title": "右夹爪",
      "sub": "触觉 · 腕相机 · 编码器",
      "desc": "提供两路视触觉图像、腕部鱼眼画面和开合度。"
    },
    "rtrk": {
      "title": "右追踪器",
      "sub": "经头显与背包",
      "desc": "位姿换算到右夹爪末端，得到 right_tcp.*，观测和动作里各有一份。三种模式都录。"
    },
    "head": {
      "title": "头显",
      "sub": "双目相机 · 头部位姿",
      "desc": "提供头显画面（双目或右单目）和头部位姿 head.*，头部位姿在观测和动作里各有一份。「双爪」模式不录。"
    },
    "mp4": {
      "title": "MP4 视频",
      "sub": "videos/ · 每路一个键",
      "desc": "每路画面是一个视频键 observation.images.<键名>，导出时编码成 MP4，存在 videos/ 下。"
    },
    "pq": {
      "title": "Parquet 表",
      "sub": [
        "data/ · 每帧一行",
        "state + action + 索引"
      ],
      "desc": "每帧一行：observation.state 与 action 两个向量，另有时间戳、帧序号、集序号等索引列，存在 data/ 下。"
    }
  }
}
</script></div>

- 动作领先观测一步；每集第一帧没有上一帧可配对，因此少 1 帧。
- 位姿 `*_tcp.*` 与 `head.*` 都是 9 维：位置 x、y、z 加 6-D 旋转，约定与原点见[导出格式](projects-export.md#lerobot)。
- 维数：「双爪」观测状态与动作各 20 维、6 路画面；「双爪 + 头显双目」各 29 维、8 路画面；「双爪 + 头显右单目」各 29 维、7 路画面（只有 `head_right`）。

## 已知限制 {#faq}

- 采集全程不要重启 XTac UMI XR：重启会重设世界坐标系原点，见[启动与坐标系对齐](../common/pico4.md#pico-frame)。
- 回放与实时预览不能同时进行，见[回放](projects-export.md#playback)。
- 背包只连 5GHz WiFi；现场只有 2.4GHz 时用网线或背包热点。
- 部分手机与 Windows 打不开设备名（`.local`），改用 IP 地址访问。
- 录制进行中，切换项目 / 任务、夹爪标定、固件升级、系统更新都会被拒绝，先停止录制。

遇到问题见[故障排查](troubleshooting.md)；各组件版本见[版本与升级](versions.md)。
