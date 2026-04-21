---
layout: default
---

# GPU rendering optimization

This page collects **guidance and FAQs** for getting the best GPU performance when using **Kaps**. The main app repo is private; for bugs and requests use [Issues](https://github.com/webtonicAI/Kaps-Community/issues).

---

## Overview

GPU rendering uses your graphics card to speed up workloads that would otherwise run on the CPU. Performance depends on **GPU model**, **driver version**, **available VRAM**, **power limits**, and **what the app is doing** (resolution, model size, batching, etc.).

*Add a short paragraph here describing how Kaps uses the GPU in your own words (e.g. which tasks are GPU-accelerated).*

---

## Before you tune

1. **Update GPU drivers** — Install the latest stable driver from NVIDIA / AMD / Intel for your card.
2. **Close other heavy GPU apps** — Browsers with many tabs, games, and other ML or video apps can steal VRAM and compute.
3. **Check thermals and power** — Throttling from heat or laptop power limits will cap performance; monitor with your vendor’s tool or a generic monitor.
4. **Know your VRAM** — If work exceeds available VRAM, the system may spill to slower memory or fail; reducing batch size, resolution, or model footprint usually helps.

---

## Optimization tips

Use this list as a checklist. **Replace or extend** with Kaps-specific settings names and recommended values once you document them.

| Topic | What to try |
|--------|-------------|
| **VRAM pressure** | Lower resolution, reduce concurrent jobs, or use a smaller model variant if the app offers one. |
| **Stability** | If you see crashes or TDR resets, reduce load (lighter preset, smaller batches) and retry after a clean driver install. |
| **CPU vs GPU** | Some steps may stay on the CPU by design; uneven GPU usage is not always a bug. |
| **Multi-GPU** | If Kaps supports multiple GPUs, document selection and expected behavior here. |

*Add Kaps-specific bullets: menu paths, toggles, config keys, and “recommended starting points” for typical hardware.*

---

## FAQ

**Does Kaps require a discrete GPU?**  
*Answer based on your product: integrated-only support, minimum cards, etc.*

**Why is GPU usage low while a job runs?**  
Often normal—decode, I/O, or CPU-side steps can bound the pipeline. High GPU usage is not always the goal.

**I’m out of memory / “CUDA out of memory” / similar**  
Reduce how much you load at once (batch size, resolution, model size), close other GPU apps, and ensure nothing else is reserving large VRAM chunks.

**Should I use the latest beta driver?**  
Usually prefer **stable** drivers for production; try beta only if you need a specific fix.

**Where do I report a performance bug?**  
[Open an issue](https://github.com/webtonicAI/Kaps-Community/issues) with hardware model, driver version, OS, and steps to reproduce.

---

*This page is maintained in the [Kaps-Community](https://github.com/webtonicAI/Kaps-Community) repo. Replace italic placeholders and table notes with accurate Kaps details when you have them.*
