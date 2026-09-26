# 固件与电机升级

从夹爪有两份固件:**夹爪固件**(随 SDK 附带)和**电机固件**(由技术支持提供)。
平时只需要关注夹爪固件;电机固件只在技术支持要求时升级。两份都要升级时,先刷夹爪固件,再刷电机固件。

## 查看版本 {#check-version}

运行 [自检](follower-setup.md#self-check),`[fw]` 一行就是夹爪固件版本。

| 夹爪固件版本 | 说明 |
|---|---|
| 1.2.9 | 随 SDK 0.3.2 附带,推荐 |
| 1.2.5 – 1.2.8 | 可以使用,建议升级 |
| 低于 1.2.5 | SDK 拒绝打开,必须先升级 |

## 升级夹爪固件 {#mcu-ota}

!!! danger "刷错固件会让夹爪无法启动"
    从夹爪只能刷 `slave` 固件,主夹爪只能刷 `master` 固件,刷错后只能返厂修复。
    **刷之前确认序列号最后一个字母是 `s`。**

```bash
# 1. 确认序列号以 s 结尾
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"

# 2. 刷写,按提示确认
python python/examples/ota_update.py slave left

# 3. 断电重启(见下)

# 4. 自检,确认版本
python python/examples/follower_status.py left
```

- 刷写约 1 秒,之后夹爪自动重启。
- 脚本发现固件与夹爪角色不符时会拒绝刷写,**不要加 `--force` 强制**。
- 刷写中断不会损坏夹爪,原固件继续运行,重新刷一次即可。

### 刷完必须断电重启 {#power-cycle}

**USB 线和 24V 电源线同时拔掉,两根都拔出后再插回。** 只拔一根不算。
不断电重启的话,夹爪看起来正常,但会悄悄丢数据。

## 升级电机固件 {#motor-ota}

只在技术支持要求时进行,需要夹爪固件 1.2.8 或以上。电机不用拆下来。

1. 把电机切换到升级模式:

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Private)"
    ```

2. 断电重启(USB 与 24V 同时拔)。
3. 刷写技术支持提供的固件文件:

    ```bash
    python python/examples/motor_ota_update.py el05-1.0.5.0.4.bin left --model EL05
    ```

    提示 `confirm the nameplate` 时,确认电机铭牌是 EL05 即可。

4. 断电重启。夹爪上电后能正常自己开合一次,说明升级成功。

- 如果脚本提示电机仍在升级模式,或断电重启后夹爪不自己开合,运行下面的命令切回,再断电重启;
  不切回的话从夹爪无法控制:

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Mit)"
    ```

- 脚本报 `no reply` 时,断电重启后重新刷写。
