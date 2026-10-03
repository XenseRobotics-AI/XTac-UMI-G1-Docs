# Follower gripper overview

The follower gripper mounts on the robot's end effector and opens and closes under motor drive. You hold the leader gripper to capture the motion; the follower gripper performs it on the robot.
This chapter shows how to control the follower gripper with the `xense.taccap` SDK.

![XTac-UMI G1 follower gripper](../assets/product/follower-scene-front.webp){ width="720" }

!!! note "This chapter uses SDK 0.4.1, which ships with the collection environment"
    This chapter is written against [TacCap-Gripper](https://github.com/XenseRobotics-AI/TacCap-Gripper) **v0.4.1**,
    the version bundled with the collection environment; see [Setup and self-check](setup.md#install).

## How it differs from the leader gripper {#vs-leader}

| | Leader gripper | Follower gripper |
|---|---|---|
| Purpose | Handheld capture | Mounted on the robot's end effector to open, close and grasp |
| Motor | None | RobStride EL05 |
| Power | USB Type-C | USB Type-C + **24V** |
| IMU / encoder / buttons | Yes | No |
| Travel calibration | Manual | Automatic at power-on |
| Last letter of the serial number | `m` | `s` |
| Firmware bundled with SDK 0.4.1 | 1.2.6 | 1.2.14 |

Leader and follower firmware are numbered separately, so it is normal for their version numbers to differ.

![Follower gripper, five views](../assets/product/follower-five-views.webp){ width="720" }

## Serial number {#sn}

Taking `TCGU01A24A0001s` as an example:

- The **last letter** is the role: `m` = leader gripper, `s` = follower gripper. Use it to pick the image when flashing firmware.
- Whether the **last digit of the running number**, just before the role letter (`1` here), is odd or even gives the side: odd = left, even = right. The follower gripper is mechanically not side-specific, but the software uses this to tell two follower grippers apart.

## Motor {#motor-model}

| Continuous stall rating | Rated torque | Torque range | Speed range |
|---|---|---|---|
| 1.1 N·m | 1.8 N·m | 6.0 N·m | 50 rad/s |

The **continuous stall rating** is the torque the jaws can hold indefinitely while pressing against an object; it is also the default grip force and its upper limit.

## Safety notes {#safety-model}

- The gripper firmware has a built-in **motion safety envelope** (torque limit, thermal derating) that no program can bypass.
  From gripper firmware 1.2.12 on, a follower gripper that has never had an envelope written runs a default one; **older firmware has no protection unless one is written**,
  and when the jaws press against something hard they can drag down the 24V supply, so **the gripper lets go and USB disconnects**. Whatever the version, before the first motion write the envelope once, following
  [Write the motion safety envelope](setup.md#envelope).
- When control stops, the program exits or USB disconnects, the gripper releases and whatever it is holding will drop.
- After power-on the gripper opens and closes once by itself to calibrate (about 10 seconds). During that time do not put anything in it and do not send commands.

## Next steps {#next}

1. Mounting and wiring: [Gripper connection and serial numbers → Follower gripper mounting and connection](../common/gripper.md#follower-install)
2. Install the SDK, run the self-check, write the envelope: [Setup and self-check](setup.md)
3. Make it move: [Motion control](control.md)
4. Upgrade the firmware: [Firmware and motor upgrades](firmware.md)
5. When something goes wrong: [Follower gripper troubleshooting](troubleshooting.md)
