# 从夹爪故障排查

先跑一遍 [自检](follower-setup.md#self-check)，多数问题从它的输出就能看出来。
本页说的**断电重启**，是指 USB 线和 24V 电源线同时拔掉，两根都拔出后再插回。

## 找不到设备、打不开 {#connect}

??? failure "扫描不到从夹爪"
    **解决**：

    - 确认 USB 和 24V 都接好，`lsusb` 里应有 `1a86:55d2`；没有就换线或换 USB 口。
    - 确认已执行串口权限命令并重新登录，见 [安装 SDK](follower-setup.md#install)。
    - 关掉数采程序和其他用到夹爪的程序，再扫描。
    - 仍显示 `Role.Unknown` 或序列号为空，联系[技术支持](versions.md#support)。

??? failure "脚本报 `2 plugged-in grippers report side=Left`"
    **原因**：同一侧同时接着主夹爪和从夹爪。
    **解决**：改用从夹爪的完整序列号，例如 `follower_status.py TCGU01A24A0001s`。

??? failure "报 `从爪固件版本过低,必须升级后才能使用本 SDK`"
    **解决**：按 [升级夹爪固件](follower-firmware.md#mcu-ota) 升级，然后断电重启。

??? failure "`hello()` 显示的版本不是 0.3.2，或 `import` 报错"
    **原因**：用的是数采环境里的旧版 SDK。
    **解决**：`mamba activate taccap` 后再运行。

## 自检异常 {#self-check}

??? failure "报 `gripper config is not calibrated`"
    **原因**：上电自动标定没有完成，常见于上电时爪子被挡住或 24V 没接。
    **解决**：清空爪子周围，接好 24V，断电重启，等爪子自己开合一次后再试。

??? failure "数据帧率明显低于 100 Hz，或没有显示 `OK`"
    **解决**：关掉其他用到夹爪的程序，换线或换 USB 口，断电重启后再自检。

??? failure "`get_spec()` 显示的不是 EL05"
    **解决**：停止使用，联系[技术支持](versions.md#support)。

## 启动控制时报错 {#start-errors}

??? failure "报 `ValueError: ... exceeds ...` 或 `RuntimeError: ... stored motor startup torque limit ...`"
    **原因**：控制器配置里的力矩超出了电机的额定值。
    **解决**：配置用 `for_spec(g.motor.get_spec())` 生成，夹持力不超过 1.1 N·m。仍然报错时联系[技术支持](versions.md#support)。

??? failure "刚上电时报 `SysBusy`，或电机没反应"
    **原因**：上电后约 10 秒夹爪在自动标定。
    **解决**：等爪子自己开合一次停下来再开始。

## 运动中出问题 {#fault}

??? failure "控制器进入 `FAULT`"
    看 `c.snapshot().fault_reason`：

    - `motor status stream stale`：夹爪数据中断，多为 USB 断开或 24V 掉电，检查接线后断电重启。
    - `motor status reports a fault`：电机报故障，运行 `print(g.motor.fault_report())` 查看详情。
    - 其他原因：记下原文。

    排除后调用 `g.motor.clear_fault()` 和 `c.reset()` 继续；反复出现时联系[技术支持](versions.md#support)，附上 `fault_report()` 的输出。

??? failure "夹紧硬物时夹爪突然松开，USB 断开"
    **原因**：运动安全包络没有生效，力矩过大把 24V 拉垮。
    **解决**：断电重启，按 [写入运动安全包络](follower-setup.md#envelope) 检查并写入；确认 24V 电源适配器符合规格。

??? failure "长时间夹持后夹持力变小"
    **原因**：电机发热后固件自动降低输出，这是保护，不是故障。
    **解决**：降低夹持力或缩短夹持时间。

??? failure "启动另一个脚本后，正在控制的夹爪松开"
    **原因**：脚本启动时扫描设备，中断了正在运行的控制程序。
    **解决**：控制运行期间不要启动其他夹爪程序或示例脚本。
