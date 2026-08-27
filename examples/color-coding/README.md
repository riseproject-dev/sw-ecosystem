# Color-Coding Grading (reusable example)

Tooling to assign a RISC-V readiness color (green / blue / yellow / orange / red / grey) to each
project in an arbitrary list. The output is a compact classification table -- one row per
project -- suitable for slides, dashboards, or feeding upstream analysis.

**How it differs from the vertical-report.** The vertical-report classifies a full layered
stack for a specific product workload. This prompt classifies a flat list of projects --
no stack structure, no layers, no pipeline chains -- with one additional modifier: projects
whose primary purpose is performance optimization are graded on whether RISC-V-specific
optimizations exist and cover the key hot paths, not just whether the project builds and tests
on riscv64.

## What is in this directory

| File | Purpose |
|------|---------|
| `color-coding.md` | The prompt. Self-contained; run it for any project list. |
| `README.md` | This file. |

## The color model in brief

Each project gets exactly one color. Colors form a spectrum from full upstream readiness down
to confirmed breakage.

**green** -- upstream builds, tests, and publishes the riscv64 artifact itself; everything
is in place and optimized (for optimization-purpose projects, the key hot paths have
RISC-V-specific implementations comparable to arm64/amd64).

**blue** -- upstream CI builds and tests pass on riscv64; no upstream riscv64 release (a third
party such as RISE or a distro ships the binary, which is flagged). For optimization-purpose
projects, RISC-V-specific optimizations cover the primary differentiating operations, even if
some secondary paths fall back to scalar C.

**yellow** -- upstream CI includes a riscv64 build step, or a distribution ships the package
built from unpatched upstream source; but there is no upstream test gate and no upstream
release. For optimization-purpose projects, some RISC-V-specific code exists but does not yet
cover the primary hot paths that define the project's value.

**orange** -- no upstream CI, no upstream release; the project is available only through a
distribution that may have applied riscv64-specific patches to make it build, or the project
is optimization-purpose and has no RISC-V-specific code at all (scalar fallback only).

**red** -- confirmed broken or explicitly non-functional on riscv64: a build-blocking
dependency with no riscv64 port, a documented ABI incompatibility, or an unresolved known
crash. Not a default for missing CI -- use orange or yellow for untested-but-buildable.

**grey** -- unknown (insufficient data) or N/A (proprietary / vendor-locked; RISC-V readiness
is not assessable).

**Optimization-purpose modifier.** For projects whose sole value proposition is speed (SIMD
libraries, high-performance allocators, inference kernel libraries, etc.), the color reflects
both CI posture and optimization coverage. The modifier can only cap the CI-based primary
grade downward, never raise it. Full optimization coverage: no change. Partial coverage (key
paths optimized): caps at blue. Minimal coverage (some RISC-V code, key paths still scalar):
caps at yellow. Absent (no RISC-V-specific code): caps at orange. The guiding question: if the
project ran on RISC-V using only generic scalar C, would it still justify using it over a
simpler alternative? If not, the optimization gap matters.

Full rules -- including CI evidence rules, distribution floor logic, optimization level
definitions, and all non-negotiable rules -- are in `color-coding.md`, The color model section.

## How to use

Open `color-coding.md` in a Claude Code session and pass the list of projects inline.
The prompt is entirely self-contained: no workflow script is required for a handful of
projects. For a large batch, follow the same operational rules as the other research
prompts in this repo (see `CLAUDE.md` at the root): one session at a time, resume on
rate-limit stalls.

Example invocation:

> Using the prompt in `examples/color-coding/color-coding.md`, grade these projects:
> google/tcmalloc, google/highway, google/googletest, google/boringssl

The prompt will research each project, apply the two-axis grading (CI posture plus
optimization coverage), and produce a summary table plus per-project justifications.
