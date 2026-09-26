# 运动控制

开始之前,确认已经按 [准备与自检](follower-setup.md) 做完四步,**尤其是写入运动安全包络**。

!!! danger "会驱动真实电机"
    本页的脚本和代码都会让从夹爪开合、施加夹持力。运行前清空爪子的运动范围,手指远离夹爪,
    确认可以随时断开 24V 电源。机器人上的从夹爪先在机器人静止时测试。

## 先用示例脚本动起来 {#first-motion}

第一次运动建议用键盘控制台,一步一步来:

```bash
python python/examples/gripper_console.py left
```

| 按键 | 作用 |
|---|---|
| `j` / `k` | 目标开度加 / 减一步(默认 0.05) |
| `o` | 全开 |
| `c` | 全合 |
| `h` | 停在当前位置 |
| `d` / `e` | 失能电机(夹着的东西会掉)/ 恢复控制 |
| `f` | 清除故障 |
| `q` 或 `Esc` | 退出(先卸力再失能,夹着的东西会掉) |

默认是位置跟随模式;加 `--mode force-position` 切到力位控制,`--grasp-torque 0.8` 设夹持力(N·m)。

确认开合正常后,可以用两个验收脚本各跑一遍,它们会自动走一组开度并检查结果,失败时退出码非零:

```bash
python python/examples/force_position_control.py left          # 夹持
python python/examples/impedance_control.py left               # 位置跟随
```

## 两种控制器怎么选 {#choose}

所有运动都通过控制器下发。两种控制器接口相同,都只有两个非阻塞调用:`set_target(开度)` 与 `snapshot()`。

| | `ForcePositionController`(力位控制) | `ImpedanceController`(位置跟随) |
|---|---|---|
| 适合 | **夹东西**:闭合到物体上,以设定的力保持 | **跟随一个开度**:遥操作、跟随主夹爪、轨迹 |
| 要调的参数 | 夹持力 `grasp_torque_nm`、闭合速度 `close_speed_radps` | 一般不用调 |
| 被物体挡住时 | 以设定的夹持力保持,报告 `holding` | 命令力矩停在持续堵转额定,状态仍是 `TRACKING`,不算故障 |
| 松开 | `release()`,以受控速度张开 | `set_target(1.0)` |

## 开度与方向 {#convention}

- 开度是归一化的 `[0, 1]`:**0 = 闭合,1 = 张开**。0 就是机械闭合止点。
- 观测里的速度和力矩按夹爪方向给出,**正值 = 往闭合方向**,所以夹住物体时力矩是正数。
  注意速度的符号因此与开度的变化方向相反(闭合时开度减小,速度为正)。
- 行程由上电自动标定得到,存在夹爪里,每只夹爪各自不同,不需要你配置。
  上电自动标定结束时爪子会从全开位置略微回退,停在不到 1 的地方是正常的。

## 基本写法 {#basic}

以力位控制为例,完整流程是:建配置 → 清故障 → 启动控制器 → 使能电机 → 下发目标 → 停止。

```python
import time
import xense.taccap as t

ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)

cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())   # 按这只夹爪的电机型号生成配置
c = t.ForcePositionController(g, cfg)


def move_to(target, timeout_s=8.0):
    """下发目标,等它被接下,再等到夹住、到位或故障。返回最后一次 snapshot。"""
    c.set_target(target)
    t0 = time.monotonic()
    # set_target() 是排队的,下一帧电机状态到来时才生效;在那之前读到的还是上一个目标的结果
    while abs(c.snapshot().target_position - target) > 1e-4:
        if time.monotonic() - t0 > 1.0:
            raise RuntimeError("控制器没有接下目标")
        time.sleep(0.005)
    while time.monotonic() - t0 < timeout_s:
        s = c.snapshot()
        if s.state == t.ForcePositionState.FAULT or s.holding or s.arrived:
            return s
        time.sleep(0.01)
    return c.snapshot()


g.motor.clear_fault()
c.start()              # 先启动控制器:它会先检查配置与电机上限是否匹配
g.motor.enable()       # 再使能电机
try:
    s = move_to(0.0)   # 闭合
    print(s.state, s.observation.position, s.holding, s.arrived, s.fault_reason)
    # s.holding:夹住了东西;s.arrived:到位了,中间没有东西
finally:
    c.stop()           # 卸力并失能电机:夹着的东西会掉
```

四条规则:

1. **配置一律用 `for_spec(g.motor.get_spec())` 生成。** 直接写 `ForcePositionConfig()` 得到的是 EL05 的数值:
   在 RS00 上夹持力会被限在 1.1 N·m,而且 `start()` 可能直接报错。
2. **先 `start()`,再 `enable()`。** `start()` 会检查配置是否超过电机的额定与上限,不合格就报错,此时电机还没使能。
   控制器以夹爪当前位置作为初始目标,启动时爪子不会跳动。
3. **结束一定调 `stop()`。** 它先下发零力矩,再让电机失能。上面的 `try/finally` 保证出错时也会执行;
   也可以写成 `with t.ForcePositionController(g, cfg) as c:`,进入时自动 `start()`,退出时自动 `stop()`,
   `enable()` 仍要在 `with` 里面自己调。关闭 `FollowerGripper` 本身**不会**让电机失能。
   **判断移动结果前,先等控制器接下新目标**(`snapshot().target_position` 等于刚下发的值),
   否则会读到上一个目标的 `arrived`,以为已经到位。控制器刚 `start()` 时 `arrived` 就是真。
4. **一只夹爪同时只能有一个控制器。** 两个控制器(或控制器加上直接的电机命令)会在同一条串口上互相覆盖。

!!! danger "停止控制或断链时夹爪会松手"
    `stop()`、控制台的 `d` / `q` / `Esc` 都会让电机失能,**夹着的东西会掉**。程序崩溃或 USB 断开时,
    固件在 300 ms 后只保留约 0.35 N·m 的零速保持力,30 s 后失能。机器人上夹持物体时,
    要保证在这些情况下物体掉落不会造成损失,或者先把物体放到支撑面上再停止控制。

## 力位控制:夹持 {#force-position}

只有两个参数需要按任务调整,其余参数是按这款硬件实测定下的,不对外开放:

| 参数 | `for_spec()` 给的值 | 含义 |
|---|---|---|
| `grasp_torque_nm` | 电机的持续堵转额定:EL05 **1.1**,RS00 **3.6** N·m | 夹持力。空行程不用它;爪子被挡住时就停在这个力上 |
| `close_speed_radps` | 1.1 rad/s | 行进速度 |

```python
cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())
cfg.grasp_torque_nm = 0.4          # 夹软的东西,力小一些
c = t.ForcePositionController(g, cfg)
```

夹持力**不能超过**持续堵转额定,超过时 `start()` 报 `ValueError`。单次移动也可以临时换一个力:
`c.set_target(0.0, grasp_torque_nm=0.6)`。

!!! warning "单次覆盖的夹持力不受持续堵转额定检查"
    `set_target()` 里临时给的夹持力只检查不超过额定力矩(EL05 1.8 N·m,RS00 5.0 N·m),
    **不检查持续堵转额定**。超过持续堵转额定长时间夹持会让电机过热降额,严重时把 24V 拉垮。
    临时给的力同样不要超过 EL05 1.1 N·m / RS00 3.6 N·m。

其他调用:

| 调用 | 作用 |
|---|---|
| `c.release()` | 以 `close_speed_radps` 张开到 1.0,并把夹持力恢复为配置里的值。松手时用它 |
| `c.hold_position()` | 停止行进,保持在当前测得的位置 |
| `c.reset()` | 退出故障状态;先调 `g.motor.clear_fault()` |

`snapshot()` 里判断结果的两个字段:

- `holding`:爪子被挡住、力已经用到设定值,也就是**夹住了**。
- `arrived`:到达了目标开度(误差 0.010 rad 以内),中间没有东西。

状态 `state` 依次可能是 `IDLE`、`HOLDING_POSITION`、`CLOSING`、`HOLDING_FORCE`、`OPENING`、`FAULT`。

!!! warning "夹持力会随温度降低"
    `grasp_torque_nm` 是你要求的力。电机发热后,固件的降额与温度墙会把实际输出降下来,所以长时间夹持时力不是恒定的。
    EL05 在 24V 下实测:1.1 N·m 持续夹 600 秒,电机从 36 °C 升到 70 °C 并趋于平稳;0.6 N·m 稳定在 49 °C。
    夹几秒到几分钟没有问题;要持续夹几十分钟,或者机柜内温度高,把夹持力降下来。

## 位置跟随 {#impedance}

```python
cfg = t.ImpedanceConfig.for_spec(g.motor.get_spec())
c = t.ImpedanceController(g, cfg)
g.motor.clear_fault()
c.start()
g.motor.enable()
try:
    while running:
        s = c.snapshot()
        if s.state == t.ImpedanceState.FAULT:
            break                        # s.fault_reason 给出原因
        c.set_target(policy(s.observation))   # 你的目标开度,0..1
finally:
    c.stop()
```

- 爪子被挡住时,命令力矩停在持续堵转额定(EL05 1.1 N·m,RS00 3.6 N·m)并保持,状态仍是 `TRACKING`,**不算故障**。
- 目标开度超出 `[0, 1]` 会被截到范围内。
- 运行中可以用 `c.set_gains(kp, kd)` 修改刚度和阻尼。它只做基本的范围检查:
  **`kd` 调低会提高接近速度**,实测过快时会把物体撞飞,不要低于 `for_spec()` 给的值。一般不需要调。
- 状态 `state` 可能是 `IDLE`、`TRACKING`、`TORQUE_CAPPED`、`FAULT`。`TORQUE_CAPPED` 是实测力矩超过额定力矩时的兜底保护,
  正常运行(包括被挡住)不会进入。

## 控制时怎么读状态 {#read-while-control}

**控制期间只读 `snapshot()`**,不要调用 `g.motor.read_status()`:后者的应答会和控制帧在串口上冲突,
两边都可能丢帧。位置、速度、力矩、状态位、温度都在 `snapshot().observation` 里,读它不产生串口通信。

| `observation` 字段 | 含义 |
|---|---|
| `position` | 开度,0..1 |
| `velocity` | 速度,rad/s,正 = 往闭合方向 |
| `torque` | 力矩反馈,N·m,正 = 往闭合方向 |
| `motor_temp_c` | 电机温度 |
| `status` | 电机状态位,见[故障排查](follower-troubleshooting.md#status-bits) |
| `age_ms` | 这帧数据距现在多久 |
| `valid` | 数据是否有效 |

`set_target()` 下发后,在下一帧电机状态到来时生效(10 ms 以内)。刚调完就读 `snapshot()`,
看到的可能还是上一个目标的结果。完整示例见 `python/examples/control_and_read.py`。

## 故障与恢复 {#fault}

控制器检测到以下情况会进入 `FAULT` 并卸力,原因写在 `snapshot().fault_reason`:

| `fault_reason` | 含义 |
|---|---|
| `motor status reports a fault` | 电机上报故障,看状态位 |
| `measured torque exceeded ...` | 测得力矩超出允许范围 |
| `motor status stream stale` | 电机状态停止更新,通常是 USB 断开或 24V 掉电 |
| `non-finite motor status` | 状态数据异常 |
| `submit failed: ...` | 命令发送失败 |

恢复:排除原因后,先 `g.motor.clear_fault()`,再 `c.reset()`。控制器以当前位置重新作为目标,不会跳动。
仍然无法恢复时,调用 `c.stop()`,断电重启夹爪(见[故障排查](follower-troubleshooting.md))。

## 不要这样做 {#dont}

- **不要用 `g.motor.submit_*` 直接下发电机命令。** 这些是底层原语,不经过控制器的任何保护,
  只剩固件包络一层;而且不按节奏发送会和状态帧冲突丢帧。需要时见 [SDK 附录 → API 要点](sdk-api.md#motor-primitives)。
- **不要手写配置数值或用裸配置。** 一律从 `for_spec()` 出发,只改夹持力和速度。
- **不要在包络未生效时运动。** 见 [写入运动安全包络](follower-setup.md#envelope)。
- **不要在上电自动标定期间发命令。** 上电后约 10 秒内电机拒绝使能,等爪子停下来再开始。
