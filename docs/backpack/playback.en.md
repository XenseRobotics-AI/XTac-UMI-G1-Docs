---
description: Replay a single recording online in the console and check its views, poses and quality flags
---

# Playback

You do not need to download a recording to review it: replay it in the console and decide whether to keep it.

Find the recording on the [Projects page](projects-export.md#projects) and click Playback at the end of its row. The phone layout has no playback page; use a tablet or computer.

![The playback page](../assets/backpack/playback-live.webp)

## Playing {#controls}

- Click "Play online": views, poses and opening play in sync; drag the progress bar to seek.
- "Recording info" shows the recording's duration, channels and other details.
- "Back to project" returns to the Projects page.

!!! warning "Playback and live preview cannot run at the same time"
    While any device is watching the live preview or an export is transcoding, playback is refused with the reason. Click "Stop stream" on the live monitor page first, then come back.

Archived recordings have had their raw files cleared and cannot be replayed; fetch that data from where it was uploaded.

## Quality flags {#quality}

Each recording on the Projects page has a Quality column:

| Shows | Meaning |
|---|---|
| No issues found | The take is clean |
| Lag N / Drop N / Bad N | Dropped frames, device dropouts or bad frames |
| Collecting stats | Still recording |
| Stats incomplete / No stats | A failed or older recording without complete statistics |

Replay flagged takes first and delete the ones you cannot use on the Projects page; recordings with missing streams or zero frames are also blocked at export.
