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

[About XTac-UMI G1](product/g1.md){ .md-button .md-button--primary }
[Choose a kit](product/editions.md){ .md-button }

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
- **Open formats**: LeRobot / MCAP output, compatible with mainstream data ecosystems

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
    - Upload datasets to ModelScope in one click, as MCAP or LeRobotDataset v3

    Turnkey, closed-source collection software; for large-scale collection teams and data factories
    { .xu-card__fit }

    [Quick start](backpack/quickstart.md){ .md-button .md-button--primary }
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
![Where each of the eight streams sits on the hardware, and its dataset key](assets/dataset/sensor-key-map.webp)
<figcaption>Sensor positions and dataset keys</figcaption>
</figure>

<figure class="tc-shot" markdown>
![Rerun live preview: four visuotactile streams, headset stereo, both wrist cameras and action curves](assets/dataset/rerun-xtac-umi-g1.webp)
<figcaption>Live Rerun preview while recording (Developer Kit)</figcaption>
</figure>

<figure class="tc-shot" markdown>
![xense-lerobot-viewer 3D replay: gripper and headset tracks, wrist and headset views, four visuotactile streams](assets/dataset/viewer-3d-replay.webp)
<figcaption>3D replay in xense-lerobot-viewer</figcaption>
</figure>

</div>

## Open dataset: TacVerse {#tacverse}

<div class="tc-feature tc-feature--dataset" markdown>

![The three TacVerse scene families: office, home and workbench](assets/dataset/tacverse-scenes.webp)

<div class="tc-feature__text" markdown>

Visuotactile manipulation data collected with XTac-UMI G1 grippers, released as LeRobotDataset v3 under CC BY-SA 4.0 and ready to download and train on.

- **122 tasks** across office, home and workbench scenes
- **17,690 demonstrations**: 370 hours, about 40 million frames
- **Two-handed touch**: four tactile streams, two wrist views and gripper poses per frame

[Hugging Face](https://huggingface.co/TacVerse){ .md-button .md-button--primary }
[ModelScope](https://modelscope.cn/datasets/XenseRobotics/TacVerse-Opendata){ .md-button }

</div>

</div>

## Developer Kit open-source repositories

The Developer Kit's collection repo, gripper SDK, tracker service and viewer are open source under Apache-2.0, see [the list](pc/index.md#repos); the Backpack Kit's software is closed.
