# Coordinate frames

This page defines the frame the pose data lives in: where the world frame is, which way it points, and how to tell during collection whether the poses are right. Both configurations take their poses from the same Pico4 headset and trackers, so the frame definition is identical; only the interface for looking at poses differs, and that part is split into "Backpack Kit" / "Developer Kit" tabs.

## The world frame

The world frame is established and frozen by XTac-UMI XR on the headset at the moment it starts. It is right-handed and gravity-aligned:

| Axis | Direction |
|---|---|
| Origin | Where the headset was at the moment XTac-UMI XR first started |
| X axis (red) | The device's forward direction, along the normal of the headset's front camera mounting face |
| Y axis (green) | The device's left, orthogonal to X, fixed by the right-handed convention |
| Z axis (blue) | The device's up, orthogonal to both X and Y, determined uniquely by the right-hand rule |

![The world frame frozen at start-up](../assets/pico4/world-frame-origin.webp){ width="420" }

The frame follows the headset only at the instant it starts; once frozen it is fixed in space, and turning your head or walking around does not carry it along. Restarting XTac-UMI XR establishes a new frame, changing both the origin and the orientation. So face the robot squarely when you start it, so that the X axis lines up with the robot's forward direction, and do not restart it while collecting one dataset; the steps are in [Start-up and frame alignment](pico4.md#pico-frame).

Every pose in a dataset is referenced to this world frame: the Developer Kit writes the end-effector TCP pose `tcp.x/y/z` plus the 6-D rotation `r1..r6` (the first two columns of the rotation matrix, with the convention in [What each frame holds](../pc/recording.md#53)); the Backpack Kit records the headset's and the trackers' poses in the MCAP.

## The pose view during collection {#world-view}

=== "Backpack Kit"

    The pose view on the console's "Live monitor" page shows the left and right grippers' and the headset's poses live, with the left and right gripper opening angles below it (rad / deg / percentage open). A closed gripper reads about 0.02 rad, and a little more force brings it to zero. Before recording, shake each gripper in turn and confirm that the left and right poses each follow it; if one does not move or jumps around, check the [tracker binding](pico4.md#pico-tracker-bind) and whether the view is obstructed.

=== "Developer Kit"

    `--display_data=true` opens a `/world` 3D view in Rerun: each gripper is drawn as a labelled ellipsoid with a triad at its live `tcp.*`, trailing a breadcrumb trajectory.

    - The scene is declared `FLU`, the initial viewpoint faces +X, and the world axes are labelled `+X forward / +Y left / +Z up`.
    - The breadcrumb keeps the most recent 90 samples (about 3 seconds at 30 fps), fading with age.
    - With the headset camera on, the headset is drawn into the same `/world` as a smaller amber `HEAD` marker, without a trajectory.
    - `--show_trajectory` is on by default and `false` turns it off; it is skipped automatically when `--robot.enable_tracker=false`.
    - With the gripper lying flat, the EE marker should sit at the midpoint between the fingers with the triad reading X forward / Y left / Z up; if not, the tracker is fitted wrong.
    - The `tracker pose` in the scalar panel is the tracker's raw pose, for inspection only; what is written to disk is `tcp.*`.

## Local frames

The three axes of the headset's own body frame follow the same convention as the world frame: X forward (along the normal of the front camera mounting face), Y left, Z up, right-handed; the origin definition is to be added.

The gripper's local frame definition is to be added. What is known so far is that the `tcp.*` the Developer Kit writes is derived from the tracker pose through the measured tracker→EE transform built in for each side, which can be overridden with `robot.tracker_to_ee_pos` / `robot.tracker_to_ee_quat`, see [RobotConfig options](../pc/reference.md#robotconfig).
