# Motion control

Before you start, make sure you have completed the four steps in [Setup and self-check](setup.md), **especially the step 4 motion check**.

!!! danger "This drives a real motor"
    Before running, clear the jaws' range of motion, keep your fingers away from the gripper, and make sure you can cut the 24V at any moment. For a follower gripper on a robot, test first with the robot stationary.

## Keyboard control {#first-motion}

For the first motion, the keyboard console is recommended:

```bash
python python/examples/gripper_console.py left
```

| Key | Action |
|---|---|
| `j` / `k` | Open / close one step |
| `o` / `c` | Fully open / fully close |
| `h` | Hold at the current position |
| `d` / `e` | Release the motor / resume control |
| `f` | Clear fault |
| `q` or `Esc` | Quit |

The default is impedance control. To grasp with a set force, add `--mode force-position --grasp-torque 0.6` (grip force in N·m, no more than 1.1).

## Two control modes {#choose}

| | Impedance control (default) | Force-position control |
|---|---|---|
| Suited to | Following an opening: teleoperation, following the leader gripper, running a policy | Grasping an object with a set force |
| When blocked by an object | Presses with 1.1 N·m | Presses with the set grip force and reports that it is holding |

The opening is expressed from 0 to 1: **0 = closed, 1 = open**.

## Control from a program {#basic}

Impedance control:

```python
import time
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)
cfg = t.ImpedanceConfig.for_spec(g.motor.get_spec())

g.motor.clear_fault()
with t.ImpedanceController(g, cfg) as c:   # stops and releases the motor automatically on leaving the with block
    g.motor.enable()
    c.set_target(0.0)                       # close
    time.sleep(2)
    print("opening", c.snapshot().observation.position)
    c.set_target(1.0)                       # open
    time.sleep(2)
```

For teleoperation or running a policy, just call `c.set_target(opening)` once per cycle in your control loop; there is no need to wait.

Force-position control uses a different config and controller; everything else is the same:

```python
cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())
cfg.grasp_torque_nm = 0.6                   # grip force, no more than 1.1 N·m

g.motor.clear_fault()
with t.ForcePositionController(g, cfg) as c:
    g.motor.enable()
    c.set_target(0.0)                       # close to grasp
    time.sleep(2)
    print("holding" if c.snapshot().holding else "nothing gripped")
    c.release()                             # release
    time.sleep(2)
```

Key points:

- **Always generate the config with `for_spec(g.motor.get_spec())`**, and change only the grip force as needed.
- **Start the controller first, then `g.motor.enable()`**; the code above already follows this order.
- **Run only one controller per gripper at a time.**
- While controlling, read opening, velocity, torque and temperature from `c.snapshot().observation`; do not read the motor state separately.
- Interface details and example scripts are in [API and examples](api.md).

!!! danger "The gripper releases when control stops or the link drops"
    When the controller stops (leaving the `with` block, program exit), when you press `d` / `q` in the console, or when USB disconnects, the gripper releases, and **whatever it is holding will drop**.
    When the robot is holding an object, put the object somewhere safe before stopping control.

!!! warning "Holding for a long time reduces the grip force"
    As the motor heats up, the firmware automatically reduces output. In testing, holding at 1.1 N·m for 10 minutes brought the motor to about 70 °C; at 0.6 N·m it settled at about 49 °C.
    If you need to hold continuously for tens of minutes, lower the grip force to around 0.6 N·m.

## Faults and recovery {#fault}

When the controller detects an anomaly it stops and goes limp; `c.snapshot().state` becomes `FAULT`, and the reason is in `c.snapshot().fault_reason`.
Once the cause is removed, call `g.motor.clear_fault()` and then `c.reset()` to continue; if it cannot recover, power-cycle the gripper.
For common causes, see [Troubleshooting](troubleshooting.md#fault).
