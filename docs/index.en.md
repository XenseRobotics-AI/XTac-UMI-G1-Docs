---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

<span class="tc-eyebrow">XTac-UMI · Handheld multimodal data collection</span>

# Give robot datasets<br>a sense of touch

<p class="tc-sub">Touch, vision and pose recorded in sync<br>One demonstration, a training-ready dataset</p>

<p class="tc-note">Both kits share the XTac-UMI&nbsp;G1 grippers<br>and the Pico4&nbsp;Ultra&nbsp;Enterprise headset</p>

[Choose a kit](product/editions.md){ .md-button .md-button--primary }
[See the data](pc/dataset.md#61){ .md-button }

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

**3 streams / gripper** 1 fisheye + 2 visuotactile

**6DoF** headset and dual-tracker pose

**30 Hz** synchronized multi-source recording

**MCAP · LeRobot v3** raw and training formats

</div>

## Two kits, one gripper

Pick one to start. Hardware, calibration and data definitions are the same on both sides; the only differences are where the compute lives and what you operate it with.

<div class="grid cards xu-cards" markdown>

-   ![Front ports of the XTac-UMI data collection backpack](assets/product/backpack-ports-front.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">Backpack Kit</span>

    **XTac-UMI Data Collection Backpack**{ .xu-card__title }

    ---

    - The backpack is the host and a tablet is the console; no PC needed
    - Start recording from the gripper button with LED feedback; one person can run it
    - Raw MCAP recording, one-click LeRobot publishing to ModelScope

    For: data-collection factories and collection teams; closed-source software with light customization
    { .xu-card__fit }

    [Quick start](backpack/index.md){ .md-button .md-button--primary }
    [About the backpack](product/backpack.md){ .md-button }
    { .xu-card__actions }

-   ![XTac-UMI G1 visuotactile gripper](assets/product/g1-render-hero.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">Developer Kit</span>

    **XTac-UMI G1 Developer Kit**{ .xu-card__title }

    ---

    - Plugs into your own x86 workstation and runs entirely on the LeRobot framework
    - `lerobot-record` writes a LeRobotDataset directly
    - Built on the open-source lerobot ecosystem, fully open to customization

    For: research and algorithm teams, self-hosted training pipelines
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

## Related repositories

The Developer Kit builds on the open-source lerobot ecosystem; the full list of the data-collection repo, the gripper SDK and the tracker service is in [References](common/reference.md#references). The Backpack Kit is delivered as an integrated system with the collection software preinstalled, so you do not have to install any of those repositories yourself.
