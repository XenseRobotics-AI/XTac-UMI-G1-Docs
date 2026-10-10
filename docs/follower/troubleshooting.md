# 从夹爪故障排查

排查前先运行[自检](setup.md#self-check)，多数问题可从其输出中判断。
本页所述**断电重启**，指拔下 24V 电源线，等待约 2 秒后重新插回，无需拔下 USB 线。

## 无法找到或打开设备 {#connect}

??? failure "无法扫描到从夹爪"
    **解决**：

    - 确认 USB 线与 24V 电源均已接好，`lsusb` 输出中应有 `1a86:55d2`。如没有，更换线缆或 USB 口。
    - 确认当前用户已加入 `dialout` 组并已重新登录，见[串口权限](../pc/host-setup.md#31)。
    - 关闭数采程序及其他占用夹爪的程序，然后重新扫描。
    - 仍显示 `Role.Unknown` 或序列号为空时，联系[技术支持](../common/reference.md#support)。

??? failure "脚本报错 `2 plugged-in grippers report side=Left`"
    **原因**：同一侧同时连接了主夹爪和从夹爪。

    **解决**：改用从夹爪的完整序列号，例如 `follower_status.py TCGU01A24A0001s`。

??? failure "报错 `从爪固件版本过低,必须升级后才能使用本 SDK`"
    **原因**：从夹爪固件低于 SDK 要求的最低版本 1.2.5，SDK 拒绝打开设备。

    **解决**：按[升级夹爪固件](firmware.md#mcu-ota)完成升级，然后断电重启。

??? failure "打开时提示 `从爪固件 ... 低于 1.2.11`，或控制中夹爪突然不响应命令、夹持力下降"
    **原因**：1.2.11 之前的夹爪固件在控制串口偶发溢出后，将持续无法接收命令，但数据仍正常上报。此时夹持力下降，手指松开。

    **解决**：按[升级夹爪固件](firmware.md#mcu-ota)升级到 SDK 附带的版本，然后断电重启。

??? failure "`hello()` 显示的版本不是 0.4.1，或 `import` 报错"
    **原因**：SDK 子模块未更新，或更新后未重新编译。

    **解决**：在数采仓库根目录更新子模块，并重新运行安装脚本：

    ```bash
    git submodule update --init --recursive
    ./setup_env.sh --install
    ```

    见[克隆仓库与子模块](../pc/install.md#22)。

## 自检异常 {#self-check}

??? failure "报错 `gripper config is not calibrated`"
    **原因**：上电自动标定未完成，常见于上电时爪子被遮挡或 24V 电源未接。

    **解决**：清除爪子周围障碍物，接好 24V 电源后断电重启。待爪子自动开合一次后重试。

??? failure "数据帧率明显低于 100Hz，或未显示 `OK`"
    **解决**：关闭其他占用夹爪的程序，更换线缆或 USB 口，断电重启后重新自检。

??? failure "`get_spec()` 显示的不是 EL05"
    **解决**：停止使用，并联系[技术支持](../common/reference.md#support)。

## 启动控制时报错 {#start-errors}

??? failure "报错 `ValueError: ... exceeds ...` 或 `RuntimeError: ... stored motor startup torque limit ...`"
    **原因**：控制器配置中的力矩超出电机额定值。

    **解决**：使用 `for_spec(g.motor.get_spec())` 生成配置，夹持力不超过 1.1N·m。仍报错时联系[技术支持](../common/reference.md#support)。

??? failure "刚上电时报错 `SysBusy`，或电机无响应"
    **原因**：上电后约 10 秒内，夹爪正在自动标定。

    **解决**：等待爪子自动开合一次并停止后，再开始控制。

## 运动中出现故障 {#fault}

??? failure "控制器进入 `FAULT`"
    查看 `c.snapshot().fault_reason`：

    - `motor status stream stale`：夹爪数据中断，通常由 USB 断开或 24V 掉电引起。检查接线后断电重启。
    - `motor status reports a fault`：电机报告故障，运行 `print(g.motor.fault_report())` 查看详情。
    - 其他原因：记录报错原文。

    排除问题后，调用 `g.motor.clear_fault()` 和 `c.reset()` 继续运行。反复出现时联系[技术支持](../common/reference.md#support)，并附上 `fault_report()` 的输出。

??? failure "夹持硬物时夹爪突然松开，USB 断开"
    **原因**：固件版本过旧，运动安全包络未生效，力矩过大导致 24V 电源电压跌落。

    **解决**：断电重启，[升级固件](firmware.md#mcu-ota)至 SDK 附带的版本，再按[运动自检](setup.md#motion-check)确认显示 `ENFORCED`。同时确认 24V 电源适配器符合规格。

??? failure "长时间夹持后夹持力下降"
    **原因**：电机发热后，固件会自动降低输出。这是保护机制，不是故障。

    **解决**：降低夹持力，或缩短夹持时间。

??? failure "启动其他脚本后，正在控制的夹爪松开"
    **原因**：脚本启动时会扫描设备，从而中断正在运行的控制程序。

    **解决**：控制运行期间，不要启动其他夹爪程序或示例脚本。
