---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

<span class="tc-eyebrow">XTac-UMI · Handheld multimodal data collection</span>

# Give robot datasets<br>a sense of touch

<p class="tc-sub">Two-handed touch, vision and pose in sync<br>One demonstration, a training-ready dataset</p>

<p class="tc-note">XTac-UMI&nbsp;G1 grippers with the Pico4&nbsp;Ultra&nbsp;Enterprise headset<br>in a Backpack Kit or a Developer Kit</p>

[Choose a kit](product/editions.md){ .md-button .md-button--primary }
[Watch the video](#highlights){ .md-button }

</div>

<div class="tc-stage" markdown>

<figure class="tc-tile tc-tile--leader" markdown>
![Leader gripper](assets/product/leader-front-open-cutout.webp)
<figcaption markdown>[Leader: hand-held capture](common/gripper.md)</figcaption>
</figure>

<figure class="tc-tile tc-tile--follower" markdown>
![Follower gripper](assets/product/follower-rear-ports.webp)
<figcaption markdown>[Follower: isomorphic end effector](follower/index.md)</figcaption>
</figure>

</div>

</div>

<div class="xu-stats" markdown>

**8 image streams** 4 tactile + 2 wrist + 2 headset

**3 × 6DoF poses** both grippers + head

**5 ms sync** positioning < 3 mm

**MCAP · LeRobot v3** raw and training formats

</div>

## Highlights {#highlights}

<div class="tc-feature" markdown>

<figure class="tc-video">
<video controls preload="none" playsinline poster="../assets/highlights/video-poster.webp">
<source src="../assets/video/xtac-umi-g1-market.mp4" type="video/mp4">
</video>
</figure>

<div class="tc-feature__text" markdown>

- **Visuotactile fusion**: tri-colour fingertip sensors capture contact location, grasp stability and slip
- **Close to the hand**: the wearable leader handles grasping, insertion and thin-part picking
- **Precise sync**: 5 ms multi-device time sync, < 3 mm positioning
- **Ready to train**: native LeRobot and MCAP output

[More highlights](product/highlights.md){ .md-button .md-button--primary }

</div>

</div>

## Two kits for different settings

Both kits use the same grippers and headset and produce the same data. The Backpack Kit is a turnkey unit whose collection software is not open source; the Developer Kit's collection software and gripper SDK are open source and free to customize.

<div class="grid cards xu-cards" markdown>

-   ![Front ports of the XTac-UMI data collection backpack](assets/product/backpack-ports-front.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">Backpack Kit</span>

    **XTac-UMI Data Collection Backpack**{ .xu-card__title }

    ---

    - The backpack runs all collection; no computer needed
    - A tablet browser is the console; gripper buttons start and stop recording
    - One person wears it, suited to field work and long sessions
    - Publish datasets to ModelScope in one click, as MCAP or LeRobotDataset v3

    Turnkey, closed-source collection software; for large-scale collection teams and data factories
    { .xu-card__fit }

    [Quick start](backpack/index.md){ .md-button .md-button--primary }
    [About the backpack](product/backpack.md){ .md-button }
    { .xu-card__actions }

-   ![XTac-UMI G1 visuotactile gripper](assets/product/g1-render-hero.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">Developer Kit</span>

    **XTac-UMI G1 Developer Kit (open source)**{ .xu-card__title }

    ---

    - Grippers and headset connect straight to your workstation
    - Built on open-source LeRobot; recording produces a LeRobotDataset
    - Open-source collection software and gripper SDK, free to customize
    - Supports the follower gripper for executing and replaying motions on a robot

    For research and algorithm teams with their own training pipelines
    { .xu-card__fit }

    [Quick start](pc/quickstart.md){ .md-button .md-button--primary }
    [Compare the two kits](product/editions.md){ .md-button }
    { .xu-card__actions }

</div>

## The data you get

<div class="tc-data" markdown>

<figure class="tc-shot" markdown>
![XTac-UMI XR console: Connected](assets/pico4/xr-console-connected-en.webp)
<figcaption>Headset connected</figcaption>
</figure>

<figure class="tc-shot" markdown>
![The eight streams and their dataset keys](assets/dataset/sensor-key-map.webp)
<figcaption>Eight streams in sync</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun live preview: four visuotactile streams, headset stereo, both wrist cameras and action curves](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>Live preview in Rerun</figcaption>
</figure>

</div>

## See it before you record

The console's live monitor is a Backpack Kit capability; the main text is in the [Backpack Kit entry point](backpack/index.md#overview).

## Developer Kit open-source repositories

The Developer Kit is fully open source: the data-collection repo, gripper SDK, tracker service and viewer are all public on GitHub; see [Developer Kit open-source repositories](pc/index.md#repos). The Backpack Kit's collection software is not open source and comes preinstalled on the backpack, so none of these repositories need installing.
