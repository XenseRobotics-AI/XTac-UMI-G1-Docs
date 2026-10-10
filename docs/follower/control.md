# 运动控制

开始前确认已按 [准备与自检](setup.md) 做完四步，**尤其是第 4 步运动自检**。

!!! danger "会驱动真实电机"
    运行前清空爪子的运动范围，手指远离夹爪，确认可以随时断开 24V。机器人上的从夹爪先在机器人静止时测试。

## 用键盘控制 {#first-motion}

第一次运动建议用键盘控制台：

```bash
python python/examples/gripper_console.py left
```

| 按键 | 作用 |
|---|---|
| `j` / `k` | 张开 / 闭合一步 |
| `o` / `c` | 全开 / 全合 |
| `h` | 停在当前位置 |
| `d` / `e` | 松开电机 / 恢复控制 |
| `f` | 清除故障 |
| `q` 或 `Esc` | 退出 |

默认是阻抗控制；要以指定的力夹东西，加 `--mode force-position --grasp-torque 0.6`（夹持力，单位 N·m，不超过 1.1）。

## 两种控制方式 {#choose}

| | 阻抗控制（默认） | 力位控制 |
|---|---|---|
| 适合 | 跟随一个开度：遥操作、跟随主夹爪、执行策略 | 以设定的力夹住物体 |
| 被物体挡住时 | 以 1.1N·m 顶住 | 以设定的夹持力顶住，并报告已夹住 |

开度用 0 到 1 表示：**0 = 闭合，1 = 张开**。

## 在程序里控制 {#basic}

阻抗控制：

```python
import time
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)
cfg = t.ImpedanceConfig.for_spec(g.motor.get_spec())

g.motor.clear_fault()
with t.ImpedanceController(g, cfg) as c:   # 退出 with 时自动停止并松开电机
    g.motor.enable()
    c.set_target(0.0)                       # 闭合
    time.sleep(2)
    print("开度", c.snapshot().observation.position)
    c.set_target(1.0)                       # 张开
    time.sleep(2)
```

遥操作或执行策略时，在控制循环里每个周期调用一次 `c.set_target(开度)` 即可，不需要等待。

力位控制，换一个配置和控制器，其余相同：

```python
cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())
cfg.grasp_torque_nm = 0.6                   # 夹持力,不超过 1.1 N·m

g.motor.clear_fault()
with t.ForcePositionController(g, cfg) as c:
    g.motor.enable()
    c.set_target(0.0)                       # 闭合夹取
    time.sleep(2)
    print("夹住了" if c.snapshot().holding else "没有夹到东西")
    c.release()                             # 松开
    time.sleep(2)
```

使用要点：

- **配置一律用 `for_spec(g.motor.get_spec())` 生成**，只按需要改夹持力。
- **先启动控制器，再 `g.motor.enable()`**，上面的写法已经是这个顺序。
- **一只夹爪同时只运行一个控制器。**
- 控制过程中读开度、速度、力矩、温度，用 `c.snapshot().observation`，不要另外去读电机状态。
- 接口细节与示例脚本见 [API 与示例](api.md)。

!!! danger "停止控制或断链时夹爪会松开"
    控制器停止（退出 `with`、程序结束）、控制台按 `d` / `q`，或者 USB 断开，夹爪都会松开，**夹着的东西会掉**。
    机器人上夹持物体时，先把物体放到安全的位置再停止控制。

!!! warning "长时间夹持会降低夹持力"
    电机发热后，固件会自动降低输出。实测 1.1N·m 持续夹 10 分钟，电机升到约 70°C；0.6N·m 稳定在约 49°C。
    需要持续夹几十分钟时，把夹持力降到 0.6N·m 左右。

## 故障与恢复 {#fault}

控制器检测到异常会停下并卸力，`c.snapshot().state` 变为 `FAULT`，原因在 `c.snapshot().fault_reason`。
排除原因后依次调用 `g.motor.clear_fault()` 和 `c.reset()` 即可继续；不能恢复时断电重启夹爪。
常见原因见 [故障排查](troubleshooting.md#fault)。
