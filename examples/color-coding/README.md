# Color-Coding Grading (reusable example)

Tooling to assign a RISC-V readiness color (green / blue / orange / red / grey) to each
project in an arbitrary list. The output is a compact classification table -- one row per
project -- suitable for slides, dashboards, or feeding upstream analysis.

**How it differs from the vertical-report.** The vertical-report classifies a full layered
stack for a specific product workload. This prompt classifies a flat list of projects --
no stack structure, no layers, no pipeline chains -- with one additional modifier: projects
whose primary purpose is performance optimization are graded on whether RISC-V-specific
optimizations actually exist, not just whether the project builds and tests on riscv64.

## What is in this directory

| File | Purpose |
|------|---------|
| `color-coding.md` | The prompt. Self-contained; run it for any project list. |
| `README.md` | This file. |

## The color model in brief

Each project gets one color. **grey** = N/A (proprietary/unknowable) or unknown.
**green** = upstream builds, tests, passes, and publishes the riscv64 artifact.
**blue** = upstream builds and tests pass, but no upstream riscv64 release.
**orange** = builds on riscv64 but no upstream test gate (build-only CI, or only a
downstream distro ships it). **red** = no working riscv64 support obtainable without
building from source yourself.

**Optimization-purpose modifier:** for projects whose sole value proposition is speed
(SIMD libraries, high-performance allocators, inference kernel libraries, etc.), the
color is capped or downgraded if RISC-V-specific optimizations (RVV intrinsics,
architecture-specific assembly) are absent or only partial, even if upstream CI is green.
The guiding question: if the project ran on RISC-V using only generic scalar C, would it
still justify using it over a simpler alternative? If not, the optimization gap matters.

Full rules in `color-coding.md`, The color model section.

## How to use

Open `color-coding.md` in a Claude Code session and pass the list of projects inline.
The prompt is entirely self-contained: no workflow script is required for a handful of
projects. For a large batch, follow the same operational rules as the other research
prompts in this repo (see `CLAUDE.md` at the root): one session at a time, resume on
rate-limit stalls.

Example invocation:

> Using the prompt in `examples/color-coding/color-coding.md`, grade these projects:
> google/tcmalloc, google/highway, google/googletest, google/boringssl

The prompt will research each project, apply the two-axis grading (CI posture +
optimization gap), and produce a summary table plus per-project justifications.
