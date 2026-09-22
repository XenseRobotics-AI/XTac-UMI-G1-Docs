---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<span class="tc-eyebrow">XTac-UMI · Handheld multimodal data collection system</span>

# Give robot datasets a sense of touch

<p class="tc-sub">Visuotactile sensing on both grippers, a wrist fisheye, the headset's first-person view and 6DoF pose, all recorded in sync. One handheld demonstration, one training-ready dataset.</p>

[Choose a kit](product/editions.md){ .md-button .md-button--primary }
[See what the data looks like](pc/dataset.md#61){ .md-button }

![XTac-UMI G1 product photo](assets/product/xtac-umi-g1-hero.webp){ .tc-hero-img }

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

    [Quick start](pc/index.md){ .md-button .md-button--primary }
    [Compare the two kits](product/editions.md){ .md-button }
    { .xu-card__actions }

</div>

## See it before you record

The console's live monitor is a Backpack Kit capability; the main text is in the [Backpack Kit entry point](backpack/index.md#overview).

## Related repositories

The Developer Kit builds on the open-source lerobot ecosystem; the full list of the data-collection repo, the gripper SDK and the tracker service is in [References](common/reference.md#references). The Backpack Kit is delivered as an integrated system with the collection software preinstalled, so you do not have to install any of those repositories yourself.
