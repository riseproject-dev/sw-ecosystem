---
title: libpfm4
parent: Project Reports
color: red
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: SWIG
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libpfm4" %}

# libpfm4

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for libpfm4<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libpfm4 is a C library providing a hardware-independent API for encoding and discovering hardware performance monitoring unit (PMU) events on Linux via the `perf_event_open(2)` syscall. It is the event-naming backend used by PAPI, oprofile, and other tools that translate human-readable counter names (e.g. "INST_RETIRED:ANY") into the kernel's numeric event encoding. libpfm4 does not perform measurement itself; it only encodes events for the caller to pass to the kernel.

The project originated at Hewlett-Packard (2002-2006) and is licensed under a permissive MIT-style license (COPYING), copyright Hewlett-Packard Development Company, L.P., with later contributions copyrighted by Google, Inc. (2009, via Stephane Eranian). It is canonically hosted on SourceForge ([perfmon2.sourceforge.net](https://perfmon2.sourceforge.net/)), with [wcohen/libpfm4](https://github.com/wcohen/libpfm4) on GitHub explicitly describing itself as a mirror of the SourceForge repository, maintained by William Cohen with local patch-staging branches (`wcohen/a64fx`, `wcohen/fedora`, `wcohen/gcc14`, `wcohen/python_cflags`, `wcohen/spec`, `wcohen/trunc`). The GitHub mirror carries essentially no issue/PR traffic (8 issues, 1 PR total across its history), so substantive upstream discussion, if any exists, would be on SourceForge or the perfmon2-devel mailing list, both outside the reach of GitHub-based tooling.

**Governance:** No formal foundation, no governance charter, no sponsorship tiers, and no MAINTAINERS/OWNERS/CODEOWNERS/PLATFORMS.md/SUPPORT.md file anywhere in the repository. The project is effectively single-maintainer. Commit-count analysis of the full history (1,256 commits) shows Stephane Eranian (Google, originally HP Labs) with 1,046+14 commits (~83%) as the de facto sole upstream maintainer, followed by William Cohen (Red Hat, mirror/packaging maintainer, 18 commits), Vince Weaver (University of Maine, academic, 15+7), Corey Ashford (IBM, 14), Thomas Richter (IBM, 11), Hendrik Brueckner (IBM, 8), Steve Kaufmann (Cray, 7), Arun Sharma (Google/Facebook, 7+6), Andreas Beckmann (Forschungszentrum Julich, 7), Will Schmidt (IBM, 6), Masahiko Yamada (Fujitsu, 5), and Robert Richter (AMD, 4). Google and IBM dominate corporate involvement; Red Hat's role (via Cohen) is curating the GitHub mirror and downstream packaging rather than core development. [NEEDS VERIFICATION]: earlier project documentation also names Ian Rogers (ARM detection fixes), Swarup Sahoo (AMD Zen5 L3 PMU), Sachin Monga (IBM Power10), and Lau Mercadal Melia (HiSilicon Kunpeng) as recent contributors; these names are consistent with the corporate affiliations above (Google, IBM) but were not independently re-derived from the commit-count table in this round of research.

**Architecture policy for new ports:** Informal and entirely vendor-driven. Every non-x86 architecture (ARM/AArch64, SPARC, IBM Power/z, MIPS) was contributed by the hardware vendor or an ecosystem partner. There is no written acceptance policy; a new port requires a patch series to the perfmon2-devel mailing list adding a `pfmlib_<arch>.c` PMU backend plus event header files, reviewed and merged by Eranian. Historically, any vendor or contributor submitting well-formed PMU event tables has been merged, so the bar for a first submission appears low, but no RISC-V submission of any kind has ever been made.

**RISE Project involvement:** None found. RISE's full published member list is 20 organizations across two tiers: Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent) and General Members (Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip Technology, NextSilicon, Quintauris, SpacemiT, ZTE). RISE's working groups cover Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulator/Emulators, System Firmware, Security Software, and AI/ML. All 35 posts on the RISE blog (2024-05-15 through 2026-09-28) were enumerated by date and title; none mention libpfm4, perfmon2, or William Cohen. libpfm4 does not appear in the RISE wheel builder package list, the riseproject-dev GitHub org's visible repositories, or any RISE-funded RFP.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2002-2006 | Project created at HP; x86/IA-64 support | [perfmon2.sourceforge.net](https://perfmon2.sourceforge.net/) |
| (historical) | ARM, AArch64, SPARC, MIPS, IBM Power/z added by respective hardware vendors and partners | [wcohen/libpfm4 lib/](https://github.com/wcohen/libpfm4/tree/master/lib) |
| (ongoing) | AMD Zen-series, Intel GraniteRapids/SapphireRapids, ARM Neoverse updates | [wcohen/libpfm4 commit history](https://github.com/wcohen/libpfm4/commits/master) |
| 2024-10-04 | Most recent commit on `master` per fresh clone verification: `91970fe6eb4e80b63f77fb54a9592e28a207050c`, "Add ARM Neoverse N3 core PMU support" (Stephane Eranian) | Independently reconfirmed multiple times this round via `git rev-parse HEAD` / `git ls-remote` against [wcohen/libpfm4](https://github.com/wcohen/libpfm4) |
| all time | RISC-V: zero commits, zero issues, zero PRs, zero source files at any point in project history | `git log --all --grep=riscv`, `git grep -il riscv HEAD`, GitHub commit/issue/PR search, all returning 0 hits |

**Discrepancy note:** An earlier version of this report's activity tracking cited the most recent commit as 2026-06-13 ("Update Intel GraniteRapids core events to 1.19"). Repeated independent verification this round, via fresh clones and `git rev-parse HEAD` cross-checked against `git ls-remote`, consistently returns HEAD `91970fe6eb4e80b63f77fb54a9592e28a207050c` dated 2024-10-04. This report treats the directly reproduced git-object evidence (fresh clone, commit hash matched across five separate research passes) as authoritative; the 2026-06-13 figure could not be reproduced and should be treated as stale or erroneous pending re-verification. [NEEDS VERIFICATION resolved in favor of the 2024-10-04 / `91970fe` figure.]

No RISC-V work has ever been submitted or merged into libpfm4, on GitHub or (as far as is visible from GitHub-based tooling) on the SourceForge mainline. There is no tracking issue, no roadmap entry, and no known contributor working on a RISC-V port. The library is not fully upstream for RISC-V in any sense; it is simply absent.

---

## 3. Upstream Support Tier

There is no formal tier policy (no PLATFORMS.md/SUPPORT.md/docs/platforms/ file exists). The de facto tier of an architecture is determined by the presence of PMU source files, event tables, and build-system arch-detection branches.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Architecture in `config.mk` | Yes (`CONFIG_PFMLIB_ARCH_X86_64`) | Yes (`CONFIG_PFMLIB_ARCH_ARM64`) | No branch exists; `uname -m` of `riscv64` falls through unmatched |
| PMU C source files in `lib/` | ~114 files (97 Intel-family + 17 AMD-family) | 13 files (per direct file-count verification; an earlier estimate said 18) | 0 files |
| Event tables in `lib/events/` | ~106 headers | present, count not independently re-verified this round | 0 headers |
| Architecture guard in `pfmlib_common.c` / `lib/Makefile` dispatch | Yes | Yes | No `RISCV`/`RISCV64` branch exists |
| CI | None (project has no CI for any architecture) | None | None |
| Release-blocking | n/a (no upstream releases exist for any arch) | n/a | n/a |
| Official upstream binary | No GitHub releases exist | No GitHub releases exist | No GitHub releases exist |
| Distro binary package | Yes (Debian, Ubuntu) | Yes (Debian, Ubuntu) | Yes (Ubuntu 26.04 "resolute": `libpfm4`/`libpfm4-dev` 4.13.0+git106-g3e4031b-1, architectures incl. riscv64) -- confirmed non-functional for PMU event lookup |

The project has zero GitHub releases for any architecture; distribution is entirely via downstream distro packaging and raw git tags/tarballs. The riscv64 Ubuntu package compiles and installs but, per the code-level analysis in Section 4, exposes no RISC-V PMU events at runtime.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libpfm4's architecture-specific work consists entirely of PMU event-table definitions and `perf_event_open` encoding logic. There is no JIT backend, no SIMD dispatch, no cryptographic assembly, and no GC barrier code anywhere in the project. The architecture-specific components are:

1. **Architecture detection** (`config.mk`): maps `uname -m` to a normalized `ARCH` value and sets a `CONFIG_PFMLIB_ARCH_*` build flag. The detection block matches i386/i686/i86pc, x86_64/amd64, ppc, sparc, arm/armv*/aarch64, mips/mipsel, and a cell case; there is no `riscv64` case, so `ARCH` is left as whatever `uname -m` reports and no `CONFIG_PFMLIB_ARCH_*` flag is ever set on riscv64.
2. **PMU C source files** (`lib/pfmlib_<arch>*.c`): event encoding, attribute parsing, CPU family detection per PMU family.
3. **Event table headers** (`lib/events/<arch>_*_events.h`): named event descriptors per CPU microarchitecture.
4. **Architecture guard / dispatch** (`pfmlib_common.c`, `lib/Makefile`): the `ifeq ($(CONFIG_PFMLIB_ARCH_...),y)` branches in `lib/Makefile` cover IA64, X86, I386, X86_64, POWERPC, S390X, SPARC, ARM, ARM64, MIPS, and CELL -- no RISCV branch exists, so there is no source-file list to even select from.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Architecture detection in `config.mk` | Full | Full | Missing (no case for `riscv64`) |
| PMU source files in `lib/` | ~114 files (K7 through Zen5, P6 through GraniteRapids) | 13 files (ARMv6 through ARMv9/Neoverse, A64FX, Kunpeng) | 0 files |
| Event table headers in `lib/events/` | ~106 headers | present (count not re-verified this round) | 0 headers |
| Architecture guard in `pfmlib_common.c` / `lib/Makefile` | Yes | Yes | No |
| `#ifdef __riscv` or any RISC-V guard anywhere in tree | n/a | n/a | Zero occurrences repo-wide |
| Linux `perf_event_open` encoding | Full | Full | Missing |

This is total absence, not a stub: full-tree `git grep -il riscv` against HEAD `91970fe6eb4e80b63f77fb54a9592e28a207050c` returns zero matches, including comments, TODOs, and stub references. There is no RVV (RISC-V Vector), Zba, Zbb, Zbs, Zicsr, or Sscofpmf reference anywhere in the codebase.

The gap is entirely in libpfm4's userspace event-table layer, not in the kernel: `drivers/perf/riscv_pmu_sbi.c` and `riscv_pmu_legacy.c` are already merged in the Linux kernel for the SBI PMU extension (v0.3+), so the kernel-side counterpart libpfm4 would communicate with via `perf_event_open` is in place and waiting.

**Out-of-tree academic patches (unmerged):** two peer-reviewed papers document hand-patching RISC-V native PMU event tables into libpfm4 to run their own benchmarks, confirming that no such support exists upstream:
- Banchelli, Bros Esqueu, Rocha, Roma, Tomas, Neves, Mantovani, "RISC-V in HPC: a look into tools for performance monitoring" (ISC High Performance 2025 workshop, Springer, DOI 10.1007/978-3-032-07612-0_43; [full PDF](http://web.tecnico.ulisboa.pt/~ist14359/wordpress/nfvr_pubs/iscw25b.pdf)) manually added native events to libpfm4 for the SOPHON SG2042 and SpacemiT K1 chips by hand-transcribing vendor documentation, special-casing `mvendorid=0x5b7` for the SOPHON platform since there is no standardized `/proc/cpuinfo` auto-detection format for RISC-V vendors. Preset events such as `PAPI_L1_DCA` and `PAPI_FP_INS` were added; more complex preset events were left as future work. This patch work is described as unmerged ("available upon request"), not submitted to perfmon2-devel.
- Domingos, Rocha, Neves, Roma, Tomas, Sousa, "Supporting RISC-V Performance Counters Through Linux Performance Analysis Tools" (ASAP'23, [PDF](https://hpcas.inesc-id.pt/~unify/papers/conf_asap23.pdf)), extending Domingos, Tomas, Sousa, "Supporting RISC-V Performance Counters through Performance analysis tools for Linux (Perf)" (CARRV 2021, [arXiv:2112.11767](https://arxiv.org/abs/2112.11767)), built and released companion code at [hpc-ulisboa/RISC-V-Perf-Events-Unmatched](https://github.com/hpc-ulisboa/RISC-V-Perf-Events-Unmatched) and [hpc-ulisboa/RISC-V-PAPI](https://github.com/hpc-ulisboa/RISC-V-PAPI), again without submitting upstream to libpfm4.

Neither patch set has been submitted to the perfmon2-devel mailing list or merged into `wcohen/libpfm4` as far as this research could determine.

---

## 5. Build System, Cross-Compilation, and Toolchain

libpfm4 uses a pure GNU Make build system: `config.mk` (architecture detection and global flags), `Makefile` (top-level targets), `rules.mk` (suffix rules). There is no CMake, no Autoconf, no Meson, no Dockerfile, and no CI configuration of any kind for any architecture. Confirmed directly by cloning HEAD `91970fe6eb4e80b63f77fb54a9592e28a207050c`: no `CMakeLists.txt` at any level, no `cmake/` directory, no `BUILDING.md`, no standalone `INSTALL` file (install instructions live inside the plain-text `README` under "INSTALLATION"), no `docs/building.md`, no `docs/cross-compilation.md`, and no `.ci/`, `docker/`, `Dockerfile*`, `toolchain*`, or `*cross*` path anywhere in the tree (not a RISC-V-specific gap -- the project has none of these for any architecture).

**Native build:**

```
make
make PREFIX=/usr install
make CONFIG_PFMLIB_SHARED=n           # static library only
make CONFIG_PFMLIB_NOPYTHON=y         # skip Python SWIG bindings
```

**What happens when building on riscv64:** `uname -m` returns `riscv64`. The `config.mk` architecture normalization matches no known pattern, so `ARCH` stays `riscv64` with no `CONFIG_PFMLIB_ARCH_*` flag set. The generic C code compiles without error (portable C89/C99, no architecture-specific intrinsics in the generic path). The resulting library installs successfully, but `pfm_initialize()` and `pfm_find_event()` return no PMU entries at all, since no PMU backend was compiled in for the architecture.

**Cross-compilation:** No `CROSS_COMPILE` variable and no documented cross-compilation procedure anywhere in the repository. A user must manually override, e.g. `make CC=riscv64-linux-gnu-gcc ARCH=riscv64`, which produces the same non-functional result: a compilable library with zero RISC-V PMU event tables.

**Required toolchain:** No documented minimum. Any GCC or Clang supporting the Linux 2.6.31+ `perf_event` ABI is sufficient for compilation; no architecture-specific compiler feature is required because no RISC-V-specific code path exists to require one.

**Known build flags:** `CONFIG_PFMLIB_SHARED=y/n` (shared+static vs static-only), `CONFIG_PFMLIB_DEBUG=y/n`, `CONFIG_PFMLIB_NOPYTHON=y/n` (default `y`, i.e. Python bindings disabled by default), `CONFIG_PFMLIB_NOTRACEPOINT=y/n`. None are architecture-specific.

**QEMU usage:** Not documented anywhere in the repository.

**Debian buildd riscv64 build status:** previously documented as "Maybe-Successful" (not clean "Successful") for riscv64 builds since at least 2018, consistent with a test suite that requires hardware PMU counters unavailable in the build environment rather than a compilation failure. [NEEDS VERIFICATION -- not re-checked against buildd.debian.org this round.]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| PMU event enumeration (`pfm_find_event`) | Full (Intel P6-GraniteRapids, AMD K7-Zen5) | Full (ARMv6-ARMv9, Neoverse, A64FX, Kunpeng, ThunderX2) | Not supported |
| CPU family auto-detection | Yes | Yes | No |
| `perf_event_open` attribute encoding | Full | Full | Not supported |
| Uncore PMU events | Yes (Intel) | Partial | Not supported |
| Linux tracepoint events | Architecture-independent, available | Architecture-independent, available | Architecture-independent, available |
| Software events | Architecture-independent, available | Architecture-independent, available | Architecture-independent, available |
| Python bindings | Yes (if SWIG present; disabled by default) | Yes | Builds, but no HW event support |
| PAPI integration | Full | Full | Builds, no HW counter support upstream; two academic groups hand-patched partial support (Section 4), unmerged |

**Functional gaps:** the entire PMU-specific feature set is absent on riscv64. A user on riscv64 can call `pfm_initialize()` without error and use software/tracepoint event types (these bypass libpfm4's encoding layer). A user on riscv64 cannot look up any RISC-V hardware PMU event by name, enumerate supported PMU families for the running CPU, or encode RISC-V hardware counter attributes for `perf_event_open`. Any tool depending on libpfm4 for hardware counter access (PAPI's hardware component, oprofile, VTune wrappers) falls back to generic `perf_event_open` encoding without the named-event abstraction.

**Performance/overhead data (from the Banchelli et al. ISC HPC 2025 paper, measuring the perf/CSR/PAPI-via-libpfm4 stack on real RISC-V silicon):** on a fixed assembly-loop instrumentation benchmark, `perf`-based instruction-count overhead on RISC-V platforms (SiFive Unmatched, SOPHON Pioneer, SpacemiT Banana Pi, EPI EPAC) is "more than two orders of magnitude" higher than on x86 (Intel Sapphire Rapids) at equivalent expected-instruction counts (e.g. at 1.8x10^9 expected instructions: Delta-i of 1.22-2.72 million on RISC-V platforms vs 546 on x86). The root cause is stated by the paper's authors as "not completely understood so far and is under study." PAPI (the libpfm4-backed measurement path) showed the highest overhead of the three measurement methods tested (perf, raw CSR reads, PAPI) on every RISC-V platform tested, including an unexplained degradation on the SpacemiT Banana Pi despite that platform supporting mode-based event filtering (Sscofpmf). A companion paper (Domingos et al., ASAP'23) measured PAPI/libpfm4-backed call overhead at 83,360 microseconds total (dominated by 81,200 microseconds of initialization cost) versus 100.24 microseconds total for raw `perf_event` calls on a SiFive HiFive Unmatched board -- roughly 800x higher, with syscall counts of 7,716 (PAPI) vs 43 (raw perf events), attributed to libpfm4's event-name-to-code translation and extra memory-structure allocation. These figures characterize libpfm4's contribution to the PAPI stack's overhead on RISC-V but were measured using the vendors' own hand-patched, unmerged event tables (Section 4), since stock upstream libpfm4 exposes no RISC-V events to measure against at all.

**Security hardening gaps:** not applicable; libpfm4 contains no cryptographic operations.

**Floating-point/NaN semantics:** not applicable.

---

## 7. CI/CD Infrastructure

The repository has no CI configuration of any kind, for any architecture. Confirmed by multiple independent fresh clones of HEAD `91970fe6eb4e80b63f77fb54a9592e28a207050c`: `git ls-tree -r HEAD --name-only` contains no `.github` path at all (so `.github/workflows` cannot exist), and a full-tree search finds no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines` file anywhere. The repository root listing is exactly `.gitignore COPYING Makefile README config.mk debian docs examples include lib libpfm.spec perf_examples python rules.mk tests` -- no CI-related entries. The GitHub Actions tab shows only the onboarding/promotional page, with zero workflow runs and zero workflow files configured.

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | No | No | No |
| Automated test runs | No | No | No |
| RISE-funded CI runner | No | No | No |
| Release gating | No | No | No |

The absence of CI is uniform across all architectures; this is not a riscv64-specific deficiency. There are no RISE CI runners for libpfm4. The Debian buildd system is the only automated cross-architecture build check, and it is controlled by Debian, not by the upstream project.

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** none. Direct fetch of [wcohen/libpfm4/releases](https://github.com/wcohen/libpfm4/releases) returns "There aren't any releases here." Zero releases means zero release assets, so no riscv64-named artifact can exist there. libpfm4 upstream ships via git tags/tarballs, not GitHub Releases.

**PyPI:** no package exists. `https://pypi.org/pypi/libpfm4/json` returns HTTP 404 (`{"message": "Not Found"}`). This is expected: libpfm4 is a C library, not a Python package, so the RISE PyPI wheel-builder mechanism does not apply to it at all.

**RISE wheel builder:** confirmed not present. The GitLab-hosted wheel index for libpfm4 redirects to `pypi.org/simple/libpfm4/`, which itself 404s. The RISE wheel_builder status page ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) lists roughly 70 packages built for riscv64 (numpy, scipy, pandas, cmake, maturin, etc.); libpfm4 is not among them.

**Ubuntu 26.04 "resolute":** confirmed available, independently re-fetched via direct HTTP request in this round (`packages.ubuntu.com/search?keywords=libpfm4&suite=resolute`): `libpfm4` (universe/libs) and `libpfm4-dev` (universe/libdevel), both version `4.13.0+git106-g3e4031b-1`, architectures `amd64 arm64 armhf i386 ppc64el riscv64 s390x`. riscv64 is explicitly listed. This is the strongest, most recently re-verified distro data point available.

**Debian sid:** previously documented as available -- package `libpfm4` version 4.13.0+git106-g3e4031b-1+b2, status Installed on buildd host rv-manda-02, plus `libpfm4-dev`, with riscv64 treated as a first-class Debian architecture (no "unofficial port" designation). [NEEDS VERIFICATION -- not re-checked against buildd.debian.org this round; the package version string coincides closely with the Ubuntu resolute figure above, suggesting shared packaging lineage.]

**Ubuntu 24.04 LTS (Noble):** previously documented as available -- packages `libpfm4` and `libpfm4-dev`, version 4.13.0+git32-g0d4ed0e-1, in universe, with riscv64 among 7 listed architectures. [NEEDS VERIFICATION -- not re-checked this round.]

**openSUSE Tumbleweed:** a general web search surfaced a riscv64 RPM, `libpfm4-4.13.0-2.1.riscv64.rpm`, as packaged for this distro. [NEEDS VERIFICATION -- single web-search source, not independently confirmed via a direct package-repository fetch.]

**Arch Linux RISC-V port (archriscv.felixc.at):** the earlier claim that libpfm4 is "not found" on this index should be treated as void rather than as negative evidence. Direct inspection this round shows the page is a static informational/status page (mirror list, hardware support, porting-goal text) with no functional package search; a `?q=libpfm4` query string is inert. No conclusion about Arch RISC-V packaging status can be drawn from this source.

**Caveat on all distro packages:** the riscv64 Debian/Ubuntu/openSUSE packages compile and install correctly but, per the code-level analysis in Section 4 (zero RISC-V branches in the build-system arch dispatch), provide zero RISC-V PMU event support at runtime. A user installing `libpfm4` on a riscv64 system gets a working binary that silently exposes no hardware PMU entries.

**To get a working binary for riscv64:** install `libpfm4` from Ubuntu 26.04 universe (or Debian sid / Ubuntu 24.04 universe per the unverified prior data). The library will be present but non-functional for hardware PMU access until upstream adds RISC-V event tables.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|---------------|--------------|-----------------|-------|
| glibc | runtime-dependency, critical | Yes -- riscv64 is a first-class Debian/Ubuntu architecture; glibc riscv64 ports are mature | Functional | Released | `LIBS=` in `config.mk` is otherwise empty; the core library (`libpfm.a`/`libpfm.so`) links against no third-party libraries at all, only glibc (and, via individual example programs rather than the library itself, libm/librt/libpthread) |
| SWIG | build-dependency, optional | Yes -- `swig` is a universal-arch package present on Debian/Ubuntu riscv64 ports; 0 riscv64 issues found in [swig/swig](https://github.com/swig/swig) issue search | Not separately tested for riscv64 [NEEDS VERIFICATION] | Released | Used only to generate codegen glue for the optional Python bindings in `python/`; note `CONFIG_PFMLIB_NOPYTHON?=y` in `config.mk`, so Python bindings (and therefore SWIG) are disabled by default and not exercised in a default build |
| Python | runtime-dependency, optional | Yes -- riscv64 is a full Debian/Ubuntu Python 3 release architecture | Functional | Released | Provides the optional `python/` bindings; bindings build on riscv64 but inherit the underlying library's zero RISC-V PMU event coverage, so they expose no hardware events either |
| ncurses | runtime-dependency, optional | Yes -- base/core package on every Debian/Ubuntu port | Functional | Released | Linked only by the `rtop` demo program in `perf_examples/` (`-lncurses -ltinfo`), not by the library or its public headers |
| Linux `perf_event` kernel subsystem | runtime-dependency, critical | Yes -- `riscv_pmu_sbi.c` and `riscv_pmu_legacy.c` are merged in the Linux kernel for SBI PMU extension v0.3+ | Functional on SBI v0.3+ boards | Present in all major riscv64 distro kernels | Not a libpfm4-distributed dependency but the runtime interface libpfm4 encodes events for; the kernel-side counterpart is ready and waiting, the gap is entirely in libpfm4's own event-table layer |
| pthreads (NPTL) | runtime-dependency, optional | Yes -- part of glibc on riscv64 | Functional | Released | Used only by the `rtop` demo program in `perf_examples/`, same as ncurses |
| libgnurx (MinGW regex shim) | build-dependency, optional | n/a -- Windows/MinGW cross-build only (`examples/Makefile`, `LIBS += -lgnurx` under `WINDOWS`) | n/a | n/a | Irrelevant to Linux riscv64 builds |

**Critical dependency finding:** all build-time and optional runtime dependencies (glibc, SWIG, Python, ncurses, pthreads) are available in official Debian/Ubuntu riscv64 packages; there are no dependency-availability blockers for building libpfm4 on riscv64. The single blocker is architectural and internal to libpfm4 itself: zero RISC-V PMU event tables and zero build-system arch-detection branches for riscv64 (Section 4). No dependency in libpfm4 involves JIT compilation, SIMD dispatch, cryptographic operations, or numerics requiring separate RISC-V analysis; the core library links against no third-party code at all.

---

## 11. Known Bugs and Active Issues

The repository has 4 open issues and 4 closed issues as of this research round, reconfirmed independently via direct GitHub search this round (`search_issues`, `search_pull_requests`, `search_commits`, each scoped to `wcohen/libpfm4`, all returning 0 hits for riscv/riscv64/RISC-V terms). None of the 8 issues or the repository's single PR relate to RISC-V.

| # | Title | Status | Severity | Notes |
|---|-------|--------|----------|-------|
| [#9](https://github.com/wcohen/libpfm4/issues/9) | Intel GraniteRapids Uncore event | Open | Medium | Intel correctness; filed July 2025 |
| [#8](https://github.com/wcohen/libpfm4/issues/8) | UNC_CHA_TOR_INSERTS events all zero | Open | Medium | Intel correctness; filed March 2025 |
| [#7](https://github.com/wcohen/libpfm4/issues/7) | 'sys/ioctl.h: No such file or directory' | Open | Low | Build/environment issue; filed July 2024 |
| [#6](https://github.com/wcohen/libpfm4/issues/6) | Invalid event attribute for cpu_clk_unhalted.thread | Open | Medium | Intel correctness; filed May 2023 |
| [#5](https://github.com/wcohen/libpfm4/issues/5) | fork clarification | Closed | -- | -- |
| [#4](https://github.com/wcohen/libpfm4/issues/4) | Python bindings question | Closed | -- | -- |
| [#2](https://github.com/wcohen/libpfm4/issues/2) | uncore events visibility | Closed | -- | -- |
| [#1](https://github.com/wcohen/libpfm4/issues/1) | macOS install | Closed | -- | -- |

The repository has exactly 1 PR total: [#3](https://github.com/wcohen/libpfm4/pull/3) "Update libpfm.3" (an unrelated man-page typo fix, closed September 2020).

**RISC-V issues:** zero. GitHub issue, PR, and commit search for "riscv"/"riscv64"/"RISC-V" against `wcohen/libpfm4` returns `total_count: 0` in every query attempted across multiple independent research passes. No correctness bug, no build failure, no feature request, and no tracking issue for a RISC-V port exists in the issue tracker.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

- Single-maintainer project. Stephane Eranian (Google) controls ~83% of commits and all architectural decisions. A RISC-V port requires his review and merge, presumably via the perfmon2-devel mailing list (SourceForge), since the GitHub mirror's PR workflow shows essentially no activity. There is no known objection to RISC-V from Eranian, but also no stated interest or engagement. The project operates on a vendor-contribution model: historically, every non-x86 architecture was contributed by the relevant hardware vendor or ecosystem partner (IBM, Cavium/Marvell, Fujitsu, Huawei). Until a RISC-V hardware vendor (SiFive, Alibaba DAMO, Ventana, SpacemiT) or their ecosystem partners submit a patch series, no RISC-V work is likely to be merged.
- No tracking issue exists anywhere (GitHub or otherwise visible). There is no upstream acknowledgment that RISC-V support is needed, and no prior community discussion for a new contributor to build on.
- No RISE Project involvement with libpfm4 was found in any channel checked (blog, member list, wheel builder, riseproject-dev GitHub org). There is no pre-existing RISE-funded work to build on or avoid duplicating.

**Technical blockers:**

- A complete RISC-V port requires: (1) a `riscv64` branch and `CONFIG_PFMLIB_ARCH_RISCV` flag in `config.mk`; (2) a `pfmlib_riscv.c` PMU backend implementing CPU family detection and `perf_event_open` attribute encoding for RISC-V SBI PMU events; (3) event table headers in `lib/events/` per supported RISC-V CPU microarchitecture (SiFive, SOPHON/T-Head, Alibaba, SpacemiT, Ventana, etc.); and (4) integration into `pfmlib_common.c` and `lib/Makefile`'s arch dispatch.
- RISC-V PMU event numbering is vendor-specific, only partially standardized via the RISC-V SBI PMU extension (v0.3+, Sscofpmf extension). Each vendor defines custom events beyond the standard architectural counters, and there is no standardized `/proc/cpuinfo` format for RISC-V vendor auto-detection (the Banchelli et al. paper had to hand-code a vendor-ID special case for the SOPHON SG2042). Event tables must be sourced from each vendor's hardware manual; data availability for non-public pre-production hardware is a constraint. As of Linux kernel 6.8, the kernel's own `perf` subsystem recognized only 4 PMUs (SiFive FU740-C000, StarFive Dubhe-80, Andes AX45, T-Head C900), per the Banchelli et al. paper, indicating the standardization surface itself is still narrow.
- Partial, unmerged prior art exists: two academic groups (Banchelli et al., ISC HPC 2025; Domingos et al., CARRV 2021 / ASAP'23) independently hand-patched native RISC-V PMU event support into libpfm4 for SOPHON SG2042, SpacemiT K1, and CVA6/SiFive Unmatched platforms to run their own benchmarks (Section 4), and released companion code at [hpc-ulisboa/RISC-V-Perf-Events-Unmatched](https://github.com/hpc-ulisboa/RISC-V-Perf-Events-Unmatched) and [hpc-ulisboa/RISC-V-PAPI](https://github.com/hpc-ulisboa/RISC-V-PAPI). Neither patch set was submitted upstream; this represents unmerged starting-point work rather than a blocker, but it also means no single authoritative, vendor-endorsed patch series currently exists to adopt wholesale.
- No stated objection to RISC-V from any maintainer. The project has historically accepted well-formed vendor patches for every other architecture; acceptance probability for a complete, tested RISC-V patch series appears high based on that track record, though untested since no submission has ever been attempted.

---

## 13. Readiness Assessment

- **Color:** red (confirmed-nonfunctional)
- **Release provider:** distro
- **Justification:** Step 0 of the color-coding methodology (architecture-independent shortcut) does not apply, since libpfm4 ships compiled, architecture-dispatched C code. Step 1 (CI-based primary grade) starts from "no upstream CI" (confirmed: no `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` anywhere in the tree, for any architecture), which would normally float to orange/yellow via the distribution floor since Ubuntu/Debian do build and ship riscv64 binary packages ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libpfm4&suite=resolute)). However, the red criterion overrides this default: RISC-V non-functionality here is directly confirmed by code inspection, not merely untested. A full-tree `git grep -il riscv` against HEAD `91970fe6eb4e80b63f77fb54a9592e28a207050c` ([wcohen/libpfm4](https://github.com/wcohen/libpfm4)) returns zero matches, `config.mk`'s architecture detection has no riscv64 branch (so no `CONFIG_PFMLIB_ARCH_*` flag is ever set on riscv64), and `lib/Makefile`'s PMU backend dispatch has zero RISC-V branches versus roughly 114 files for the x86 family and 13 for arm64. The consequence is that the Ubuntu/Debian riscv64 package installs successfully but `pfm_initialize()`/`pfm_find_event()` return no PMU entries at all: the library's entire purpose (naming and encoding hardware PMU events) is a confirmed no-op on riscv64. libpfm4 is not treated as an optimization-purpose (Step 2) project; it is a hardware-event completeness/naming library, closer to the observability-tooling category that the color-coding methodology's Step 2 modifier explicitly excludes, rather than a speed-optimization library such as an allocator, SIMD kernel, or crypto library. The red color therefore comes directly from Step 1's confirmed-nonfunctional criterion, not from an optimization gap.
- **Pending work that could change the grade:** none identified with a clear path to landing. No open GitHub issue, PR, or commit in `wcohen/libpfm4` references RISC-V; the repository's only PR (#3) is an unrelated man-page fix, and none of its 8 issues mention RISC-V. No RISE Project involvement with libpfm4 (blog, member list, wheel builder, riseproject-dev GitHub org) was found. Two academic papers (Banchelli et al., ISC HPC 2025; Domingos et al., ASAP'23) hand-patched vendor-specific RISC-V PMU event tables into libpfm4 to run their own benchmarks, confirming no such support exists upstream, but this patched work has not been submitted or merged. If a RISC-V hardware vendor (SiFive, Alibaba DAMO, SpacemiT, Ventana) or the researchers behind those papers submitted a patch series to the perfmon2-devel mailing list, that could move the grade; no such submission is currently known to exist.

---

## 14. Investment Analysis

### 14.1 Functional Enablement

The core work is a new RISC-V architecture port. The technical scope is well-defined: a new `pfmlib_riscv.c` source file, one or more `lib/events/riscv_*_events.h` event table headers per supported CPU, `config.mk` architecture-detection additions, and `pfmlib_common.c`/`lib/Makefile` guard additions. The Linux kernel PMU driver (`riscv_pmu_sbi.c`) is already merged, providing the kernel-side specification of what events are exposed via the SBI PMU extension.

Unmerged prior art exists and would reduce the effort for a first submission: the Banchelli et al. (ISC HPC 2025) and Domingos et al. (CARRV 2021 / ASAP'23) hand-patched event tables for SOPHON SG2042, SpacemiT K1, and CVA6/SiFive Unmatched, with released companion code ([hpc-ulisboa/RISC-V-Perf-Events-Unmatched](https://github.com/hpc-ulisboa/RISC-V-Perf-Events-Unmatched), [hpc-ulisboa/RISC-V-PAPI](https://github.com/hpc-ulisboa/RISC-V-PAPI)), could serve as a starting point rather than a from-scratch implementation, subject to license and code-quality review before upstream submission.

The effort scales with the number of CPU microarchitectures to cover. A minimal port covering only the standardized SBI architectural counters (cycle, instret, and the Sscofpmf-exposed hardware counters) is a bounded effort. Expanding to vendor-specific PMU event tables for production silicon (SiFive, SOPHON/T-Head, Alibaba, SpacemiT, Ventana) requires access to each vendor's hardware documentation and a target system for validation.

### 14.2 Performance Optimization

Not applicable. libpfm4 contains no SIMD, JIT, or numerics code. There is no performance-optimization work beyond the functional port itself. Note, however, that the Banchelli et al. measurements show the libpfm4/PAPI event-lookup path itself imposes substantial measurement overhead on RISC-V (two or more orders of magnitude versus x86 in their perf-based test, and roughly 800x versus raw `perf_event` calls in the Domingos et al. ASAP'23 call-overhead breakdown), a root cause the paper's authors describe as unexplained and under study; this is a property of the measurement stack's interaction with RISC-V kernel/hardware behavior, not something a libpfm4 port would fix as a side effect.

### 14.3 CI/CD Infrastructure

The upstream project has no CI of any kind for any architecture. Adding riscv64 CI is not meaningful in isolation without also establishing baseline CI for the project as a whole. A pragmatic approach is to rely on the Debian buildd system (already building riscv64 packages) for compilation verification, and to add a GitHub Actions workflow with QEMU-based test execution. However, the test suite requires hardware PMU counters, so QEMU-based testing would validate only software and tracepoint event types unless QEMU's RISC-V PMU emulation covers the SBI PMU extension. Data not available: QEMU RISC-V PMU emulation coverage was not searched in this research round.

### 14.4 Ecosystem Enablement

libpfm4 has no dependent package ecosystem of plugins or extensions (Section 10 is omitted per the project's nature as a standalone system library). The downstream impact of a RISC-V port is PAPI's hardware component, which depends on libpfm4 for hardware counter access; enabling libpfm4 on RISC-V would unblock PAPI hardware profiling on the architecture, which in turn is a prerequisite for the measurement methodology used in both academic papers cited in Sections 4 and 6.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | RISC-V architecture detection in `config.mk` + `pfmlib_common.c`/`lib/Makefile` guard | 0.5 | libpfm4 contributor | Critical |
| Functional | `pfmlib_riscv.c`: CPU family detection + SBI PMU standard event encoding (can draw on unmerged academic prior art) | 2-3 | libpfm4 contributor | Critical |
| Functional | `lib/events/riscv_sbi_events.h`: standard SBI architectural counters (cycle, instret, Sscofpmf) | 1 | libpfm4 contributor | Critical |
| Functional | `lib/events/riscv_<vendor>_events.h` per production CPU (SiFive, SOPHON/T-Head, Alibaba, SpacemiT, Ventana) | 1.5-3 per CPU (reduced from 2-3 if adopting hand-patched academic tables as a base) | Respective hardware vendor | High |
| Functional | Upstream submission to perfmon2-devel mailing list, iteration with Eranian | 2 | libpfm4 contributor | Critical |
| CI/CD | GitHub Actions workflow with QEMU RISC-V for compile + software-event test suite | 1 | libpfm4 contributor | Medium |
| CI/CD | Hardware-in-the-loop test job on physical RISC-V board (e.g. SiFive HiFive Unmatched, used in both cited academic studies) | 2 | RISE or contributor infra | Medium |

Total for a minimal functional port (standard SBI counters, upstream submission): approximately 6.5-7 person-weeks. Total for full production coverage across 4-5 CPU vendors plus CI: approximately 15-20 person-weeks.

---

## 15. References

- [wcohen/libpfm4 GitHub mirror](https://github.com/wcohen/libpfm4)
- [libpfm4 / perfmon2 homepage (SourceForge, canonical upstream)](https://perfmon2.sourceforge.net/)
- [perfmon2 SourceForge project page](https://sourceforge.net/p/perfmon2/libpfm4/)
- [wcohen/libpfm4 commit history](https://github.com/wcohen/libpfm4/commits/master)
- [wcohen/libpfm4 lib/ directory](https://github.com/wcohen/libpfm4/tree/master/lib)
- [wcohen/libpfm4 lib/events/ directory](https://github.com/wcohen/libpfm4/tree/master/lib/events)
- [wcohen/libpfm4 issues tracker](https://github.com/wcohen/libpfm4/issues)
- [wcohen/libpfm4 PR #3](https://github.com/wcohen/libpfm4/pull/3)
- [wcohen/libpfm4 GitHub Actions tab](https://github.com/wcohen/libpfm4/actions)
- [wcohen/libpfm4 releases](https://github.com/wcohen/libpfm4/releases)
- [Ubuntu 26.04 "resolute": libpfm4 package search](https://packages.ubuntu.com/search?keywords=libpfm4&suite=resolute&searchon=names&section=all)
- [Ubuntu Noble: libpfm4](https://packages.ubuntu.com/noble/libpfm4)
- [Debian buildd status: libpfm4 sid](https://buildd.debian.org/status/package.php?p=libpfm4&suite=sid)
- [PyPI JSON API: libpfm4 (404, no package)](https://pypi.org/pypi/libpfm4/json)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project Python wheel builder status](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub org](https://github.com/riseproject-dev)
- [swig/swig GitHub repository](https://github.com/swig/swig)
- [Banchelli, Bros Esqueu, Rocha, Roma, Tomas, Neves, Mantovani, "RISC-V in HPC: a look into tools for performance monitoring" (ISC HPC 2025)](http://web.tecnico.ulisboa.pt/~ist14359/wordpress/nfvr_pubs/iscw25b.pdf)
- [Domingos, Tomas, Sousa, "Supporting RISC-V Performance Counters through Performance analysis tools for Linux (Perf)" (CARRV 2021, arXiv:2112.11767)](https://arxiv.org/abs/2112.11767)
- [Domingos, Rocha, Neves, Roma, Tomas, Sousa, "Supporting RISC-V Performance Counters Through Linux Performance Analysis Tools" (ASAP'23)](https://hpcas.inesc-id.pt/~unify/papers/conf_asap23.pdf)
- [hpc-ulisboa/RISC-V-Perf-Events-Unmatched (companion code)](https://github.com/hpc-ulisboa/RISC-V-Perf-Events-Unmatched)
- [hpc-ulisboa/RISC-V-PAPI (companion code)](https://github.com/hpc-ulisboa/RISC-V-PAPI)
- [Linux kernel driver: drivers/perf/riscv_pmu_sbi.c (kernel-side RISC-V PMU support, referenced context)](https://github.com/torvalds/linux/blob/master/drivers/perf/riscv_pmu_sbi.c)