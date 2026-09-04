---
title: Sample
parent: Whole-Stack Reports
---

# Sample

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-28<br/>
**Scope:** RISC-V readiness of the Sample software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified
against the per-project reports under reports/. Items not verifiable against a second source are
marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="sample" %}

**Scoping assumptions:**

- CPU-only per operator directive: no GPU / CUDA / ROCm paths.
- Target profile RVA23U64: RVV 1.0, vector crypto (Zvkned), Zba/Zbb/Zbc, and FP16 are treated as
  mandatory baseline, so missing SIMD/crypto acceleration is a gap against baseline.

---

## Artifact 1: Layered Stack Outline

### Layer 1.a -- GCC: Toolchains

- **GCC** -- yellow (critical)
  - The GNU Compiler Collection; provides the C/C++ compiler targeting riscv64-linux-gnu.
  - License: GPLv3+. Governance: GNU / Free Software Foundation.
  - Release provided by Debian, not upstream.
  - Gap: No riscv64 builders on the upstream sourceware.org Buildbot; CI posture is unknown
    upstream; classification relies on clean distribution builds (Debian, Ubuntu Noble, Arch Linux).

### Layer 1.b -- LLVM: Toolchains

- **LLVM** -- blue (critical)
  - LLVM compiler infrastructure: clang, LLD, and the RISC-V backend; used as both compiler and
    linker in many toolchains.
  - License: Apache 2.0 with LLVM exceptions. Governance: LLVM Foundation.
  - Release provided by Debian, not upstream.
  - Gap: No riscv64 binary in upstream GitHub releases (x86_64 and ARM64 only); distributions
    provide riscv64 packages.

*Pipeline chains and alternate paths for Layer 1 (Toolchains):*

- LLVM -> glibc
- GCC -> glibc

### Layer 2 -- System Libraries

- **glibc** -- yellow (critical)
  - The GNU C Library; provides the C runtime, libm, pthreads, and sub-word atomics (libatomic)
    required by every binary on a Linux riscv64 system.
  - License: LGPLv2.1+. Governance: GNU / Free Software Foundation (copyright), Red Hat
    (sourceware.org infrastructure).
  - Release provided by Debian, not upstream.
  - Gap: Both official upstream riscv64 Buildbot builders offline since mid-2025; 18-routine RVV
    string/memory suite (memcpy, memmove, strcmp, strlen, etc.) not yet merged (v5 under review);
    open SIGILL correctness bug in the merged RVV memset IFUNC when RVV is disabled via prctl;
    libmvec (vectorized math) at RFC stage only; CFI (Zicfilp/Zicfiss) not merged.

*Pipeline chains and alternate paths for Layer 2 (System Libraries):*

- LLVM -> glibc
- GCC -> glibc

---

## Artifact 2: Status Tables

### Full Status Table

| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
|------|-------|-------------|-------|-----------------|---------------|---------------|-------|-----------------|
| GCC | Toolchains | critical | yellow | Debian | No riscv64 builders on upstream sourceware.org Buildbot; clean distro builds from Debian/Ubuntu Noble/Arch Linux with unpatched GCC 14+. | [sourceware.org Buildbot API](https://builder.sourceware.org/buildbot/api/v2/builders?limit=300) | 2026-08-28 | n/a (no prior report) |
| LLVM | Toolchains | critical | blue | Debian | RISE-sponsored riscv64 workers in upstream LLVM Buildbot (workerids 18, 72, 108, 116); rise-riscv-build.sh runs check-all + llvm-test-suite via QEMU; recent builds passing. No riscv64 binary in upstream releases. | [rise-riscv-build.sh](https://raw.githubusercontent.com/llvm/llvm-zorg/main/zorg/buildbot/builders/annotated/rise-riscv-build.sh) | 2026-08-28 | n/a (no prior report) |
| glibc | System Libraries | critical | yellow | Debian | Both upstream riscv64 Buildbot builders (#293, #336) confirmed offline since mid-2025. Clean distro builds from Debian sid (2.43-4), Ubuntu Noble (2.39), Arch Linux (2.44+), Fedora (2.44). RISE pre-commit CI claimed but unverified [NEEDS VERIFICATION]. | [sourceware.org Buildbot #293](https://builder.sourceware.org/buildbot/api/v2/builders/293) | 2026-08-27 | none |

### Slide-Ready Summary Table

| Node | Color | Criticality | Release provider |
|------|-------|-------------|-----------------|
| GCC | yellow | critical | Debian |
| LLVM | blue | critical | Debian |
| glibc | yellow | critical | Debian |

---

## Artifact 3: Narrative and Next Steps

### Scorecard

Of 3 critical-path nodes: 0 green, 1 blue, 2 yellow, 0 orange, 0 red, 0 grey.

### The Story

This is a minimal C hello-world stack intended as a tooling test rather than a production
investment recommendation. Despite its simplicity, the stack reveals a consistent pattern: all
three nodes have their consumable riscv64 releases provided by Debian (not by their respective
upstreams), and only one (LLVM) has active upstream riscv64 CI with test execution.

**LLVM (blue)** is the strongest: four RISE-sponsored workers run a full two-stage build plus
`check-all` and the llvm-test-suite via QEMU on every commit, and recent results are passing.
The only reason LLVM is not green is that upstream GitHub releases omit riscv64 binaries --
only x86_64 and ARM64 binaries are published. This is a distribution gap, not a build or test
gap. End-users depend on Debian or Ubuntu packages.

**GCC (yellow)** and **glibc (yellow)** have no confirmed upstream riscv64 CI producing passing
results. GCC has no riscv64 Buildbot entries at all on sourceware.org; its riscv64 quality
signal comes entirely from downstream distributions building cleanly from unpatched source.
glibc's official Buildbot builders have been offline since mid-2025; RISE is reported to run
pre-commit CI but the dashboard is not public [NEEDS VERIFICATION].

No node is red or orange: all three build correctly on riscv64 and are available as distribution
packages. The two yellows represent a CI coverage gap, not a functional gap.

**Third-party release risk.** All three nodes have `release_provider: Debian`. An organization
that wants to deploy these from upstream source (e.g., in a custom Linux distribution or
embedded image) must carry the distribution packaging work themselves or wait for distro
updates. For production use, this is a known dependency on Debian/Ubuntu packaging cadence.

**RISE involvement.** RISE's most visible contribution in this stack is the four riscv64 workers
in the LLVM Buildbot. For glibc, RISE is listed as covering pre-commit CI in the Dec 2024
end-of-year update, but no public dashboard confirms this; before investing in new glibc CI
infrastructure, verifying the current RISE glibc CI scope is recommended to avoid duplication.

### Actionable Next Steps

1. **[glibc] Verify and restore upstream riscv64 Buildbot builders.** Both `glibc-ubuntu-riscv`
   (#293) and `glibc-fedora-riscv` (#336) have been offline since mid-2025. Contact Red Hat /
   sourceware.org infrastructure team to restore the machines. Estimated effort: 1-2 weeks.
   Before new investment, check the current scope of the RISE pre-commit glibc CI to understand
   what coverage already exists.

2. **[glibc] Drive the 18-routine RVV string/memory suite (v5) to merge.** The patch series
   (`[PATCH v5 00/18] riscv: Add RVV str*/mem* routines`, Feb 2026) is in active review.
   Assigning a reviewer with glibc expertise to drive the libc-alpha cycle to completion is
   the highest-leverage performance improvement available. Estimated effort: 2-4 person-weeks.
   RISE's compilers-WG issue #47 tracks this.

3. **[glibc] Fix the open prctl/RVV SIGILL bug in memset IFUNC.** A process that disables RVV
   via `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)` then calls `memset()` receives SIGILL (merged Dec
   2025, no fix submitted as of Feb 2026). This is a correctness regression that blocks safe
   extension of the IFUNC pattern to the 18 additional routines. Estimated effort: 1-2
   person-weeks.

4. **[LLVM] Push for upstream riscv64 release binaries.** LLVM CI passes for riscv64 via RISE
   workers. The release-binaries.yml workflow does not include riscv64. Adding a riscv64 release
   asset to upstream LLVM releases would move LLVM from blue to green. This is primarily a
   project governance and release-engineering effort, not a technical one. RISE or a hardware
   partner providing release build infrastructure would be the natural driver.

5. **[GCC] Establish upstream riscv64 Buildbot coverage.** GCC has zero riscv64 builders on
   sourceware.org. The GCC Compile Farm has riscv64 machines (cfarm91-95, cfarm410-411) that
   could be wired into GCC's CI. This would move GCC from yellow to at least blue. RISE's
   gcc-postcommit-ci fork already runs post-commit tests; formalizing this as upstream
   sourceware.org Buildbot coverage would close the gap.

---

## References

- [sourceware.org Buildbot builders API (no gcc-riscv builders)](https://builder.sourceware.org/buildbot/api/v2/builders?limit=300)
- [sourceware.org Buildbot: glibc-ubuntu-riscv #293 (offline)](https://builder.sourceware.org/buildbot/api/v2/builders/293)
- [LLVM Buildbot workers: RISE riscv workers confirmed](https://lab.llvm.org/buildbot/api/v2/workers?limit=500)
- [rise-riscv-build.sh: LLVM two-stage build + check-all + test-suite via QEMU](https://raw.githubusercontent.com/llvm/llvm-zorg/main/zorg/buildbot/builders/annotated/rise-riscv-build.sh)
- [LLVM 23.1.0 releases: x86_64 and ARM64 only, no riscv64](https://api.github.com/repos/llvm/llvm-project/releases/latest)
- [Debian tracker: gcc-14 riscv64](https://tracker.debian.org/pkg/gcc-14)
- [Debian tracker: llvm-toolchain-19 riscv64](https://tracker.debian.org/pkg/llvm-toolchain-19)
- [Ubuntu Noble: gcc riscv64 packages](https://packages.ubuntu.com/search?keywords=gcc&searchon=names&suite=noble&section=all)
- [Ubuntu Noble: clang/llvm riscv64 packages](https://packages.ubuntu.com/search?keywords=clang&searchon=names&suite=noble&section=all)
- [GCC Compile Farm riscv64 machines](https://portal.cfarm.net/machines/list/)
- [GCC testing infrastructure page](https://gcc.gnu.org/testing/)
- [reports/glibc.md -- per-project glibc RISC-V report (date: 2026-08-27)](../../../reports/glibc.md)
- [RISE Dec 2024 end-of-year update (glibc CI claim)](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE compilers-WG issue #47: glibc mem*/str* RVV routines](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/47)
- [riseproject-dev/gcc-postcommit-ci](https://github.com/riseproject-dev/gcc-postcommit-ci)
