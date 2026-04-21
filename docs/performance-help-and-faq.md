---
layout: default
title: Performance Help & FAQ
---

[← Kaps Community home](index.html)

# Performance Help & FAQ

This document mirrors the in-app **Performance Help & FAQ** popup (Export tab). It is formatted for easy reading on GitHub or GitHub Pages.

---

## Table of contents

1. [GPU setup](#gpu-setup)
2. [Issues (FAQ)](#issues-faq)
3. [Export tips](#export-tips)

---

## GPU setup

### Windows — force Chrome onto NVIDIA

1. **Windows Settings** → System → Display → Graphics → find or add `chrome.exe` → Options → `High performance` → Save
2. **NVIDIA Control Panel** → Manage 3D Settings → Program Settings → Add `chrome.exe` → set Preferred graphics processor to `High-performance NVIDIA` → Apply
3. Task Manager → end every `chrome.exe` process → relaunch Chrome fresh

> **Tip:** NVIDIA Control Panel is more persistent than Windows Display Settings. Windows updates regularly reset the Display Settings preference — NVIDIA Control Panel survives reboots and Chrome updates. Set both for maximum reliability.

### Enable Chrome hardware flags

4. Go to `chrome://flags` → search `encode` → set **Hardware-accelerated video encode** → Enabled
5. In `chrome://flags` → search `blocklist` → set **Override software rendering list** → Enabled → Relaunch Chrome

### Verify it is working

6. Go to `chrome://gpu` — find **GL_RENDERER**. It should say something like `ANGLE (NVIDIA GeForce RTX ...)`, not Intel UHD
7. Both **Video Encode Acceleration** and **Video Decode Acceleration** should say **Hardware accelerated**

### macOS

1. System Settings → Battery → turn off Low Power Mode while rendering
2. Chrome → `chrome://settings/system` → enable **Use hardware acceleration** → Relaunch

> **Tip:** Apple Silicon Macs (M1/M2/M3) use a unified GPU — hardware acceleration is always active.

---

## Issues (FAQ)

### Render is very slow — 3–5 fps

Chrome is using software encoding. Almost always caused by Chrome running on the integrated GPU (Intel UHD) instead of your discrete NVIDIA/AMD GPU.

**Fix:** See [GPU setup](#gpu-setup) above for step-by-step instructions.

---

### Preview was 90 fps, now it is 20 fps

Chrome switched back to the Intel iGPU. This happens after Chrome background updates or long uptime sessions.

**Fix:** Task Manager → end all `chrome.exe` → relaunch. Set NVIDIA Control Panel → Program Settings to make this stick permanently.

---

### GPU card shows NVIDIA but encoding is still slow

Chrome's WebGL renderer and its media encoder can run on different GPU paths. NVIDIA showing in WebGL does not guarantee NVENC is active.

**Fix:** Full PC restart resets the GPU arbiter. Then set NVIDIA Control Panel immediately after.

---

### Render started slow then sped up — is that normal?

Yes, completely normal. The source video decoder cold-starts with expensive seeks. As the buffer fills up over the first ~200 frames, decode time drops from ~200 ms to ~10 ms and the render accelerates.

The estimated time shown is based on the cold-start frame — usually 3–5× too pessimistic. Your actual render will finish much sooner.

---

### Worked perfectly yesterday, slow today — nothing changed

Chrome silently auto-updates in the background. A new process can spawn without inheriting the previous GPU assignment.

**Fix:** Restart PC, then set NVIDIA Control Panel → Program Settings for `chrome.exe`. This binding persists across Chrome updates.

---

### AV1 not working even after GPU fix

Some Chrome + driver combos block AV1 NVENC internally. The app automatically tries fallback codec configs and picks the fastest available.

**To force it:** `chrome://flags` → **Override software rendering list** → Enabled → restart Chrome. Or use Dev Panel → Codec → H264.

---

## Export tips

### Recommended bitrate

| Resolution | Bitrate   | Use case           |
| ---------- | --------- | ------------------ |
| 540p       | 2–4 Mbps  | Social / preview   |
| 720p       | 4–6 Mbps  | Standard           |
| 1080p      | 6–10 Mbps | High quality       |
| 4K         | 20–40 Mbps | Master / archival |

> **Tip:** For social media (TikTok, Instagram, YouTube Shorts) the platform re-encodes your video anyway — 8 Mbps at 1080p is plenty. Going higher wastes upload time with no visible benefit.

### Codecs

| Codec | Notes |
| ----- | ----- |
| **AV1** | Best quality per MB. Uses RTX 4xxx NVENC for fast export. Falls back to fast software if NVENC unavailable. |
| **H264** | Most compatible. Hardware on any GPU, or fast software fallback. Use this if AV1 causes issues. |
| **VP9** | Good hardware support on Intel iGPU and NVIDIA. Alternative when AV1 NVENC is blocked. |

### Antialiasing

Leave **ON** for all text and caption content. Turn **OFF** only for a deliberate pixel-art look or to squeeze a few extra fps from the renderer.
