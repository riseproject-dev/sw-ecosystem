---
title: LZ4
parent: Project Reports
color: yellow
dependencies:
  - name: xxHash
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="lz4" %}

# LZ4

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Optimization level:** minimal<br/>
**Scope:** RISC-V (riscv64/linux) support status for LZ4<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LZ4 is a lossless, byte-oriented compression algorithm implemented as a C library. Its stated value proposition is maximum compression and decompression speed at a modest compression ratio (roughly 2:1 on typical data), which makes speed, not ratio, the differentiator that matters for a RISC-V readiness assessment. The library consists of `lib/lz4.c` (core block codec), `lib/lz4hc.c` (high-compression mode), `lib/lz4frame.c` (streaming frame format), and a bundled copy of xxHash (`lib/xxhash.c`) used for content-integrity checksums in the frame format. There is no JIT backend, no garbage collector, and no floating-point code path anywhere in the codebase; the performance-critical code is pure integer arithmetic guarded by a small number of architecture `#ifdef` blocks.

**Governance.** LZ4 is a sole-maintainer project. Yann Collet (GitHub: Cyan4973) holds all merge rights and makes all final decisions; the project has no MAINTAINERS file, no TSC, no documented succession plan, and no foundation affiliation. License is BSD 2-Clause. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists, so there is no formal, documented platform-tiering policy; whatever tiering exists is inferred from the CI matrix (Section 3).

**Corporate affiliation.** Yann Collet's GitHub profile lists `@facebook` (Meta), and he is also the creator of Zstandard (zstd), Meta's primary production compression library. LZ4 predates his Meta tenure and is maintained by him personally rather than as an official Meta project [NEEDS VERIFICATION that Meta formally sponsors LZ4]. Co-credited maintainer Takayuki Matsuoka (t-mat) has no corporate affiliation disclosed in available sources. There is no sponsor-tier program and no foundation dues.

**Community culture on new ports.** The maintainer accepts correctness/portability fixes with low friction: PR [#1298](https://github.com/lz4/lz4/pull/1298) (basic riscv64 detection) was approved and merged within days, with Cyan4973 noting it "doesn't harm" and "there might be scenarios where it might help." For optimization PRs the bar is materially higher: he explicitly told the author of PR [#1678](https://github.com/lz4/lz4/pull/1678) that "the explanation provided sounds hollow, like an LLM generated text," and pushed for a single, isolated, reproducible change rather than a bundle of speculative ones. The author subsequently retracted the majority of the original claims (see Section 6) after self-review. The merged Zicclsm fix, PR [#1648](https://github.com/lz4/lz4/pull/1648), shows the pattern that succeeds with this maintainer: one focused change, a clear and verifiable hardware precondition (`__riscv_zicclsm`), and a fast approval cycle (opened Aug 28, 2025, merged Sept 11, 2025).

**RISE involvement.** LZ4 (lz4/lz4) itself is not a RISE member project, is not listed on riseproject.dev, and no RISE blog post discusses LZ4 or compression. RISE does, however, track a related but distinct project: Confluence/GitHub work item **LR_00_011 "Port org.lz4:lz4-java"** (migrated to `riseproject-dev/language-runtimes-wg` issue #51, status Closed/Done), driven by RISE-affiliated engineer Ludovic Henry (luhenry, Rivos/Qualcomm), covering the separate `lz4-java` JNI-bindings project, not the canonical C library covered by this report. Separately, the RISE Python wheel-builder repository (`riseproject-dev/python-wheels`) packages the Python `lz4` binding (version 4.4.5, `docs/packages/lz4.yaml`, `patched: true`) and publishes riscv64 manylinux wheels for it via the RISE GitLab wheel index, though that packaging targets the Python binding's own C extension build, not upstream RISC-V code-path optimization of `lz4/lz4` itself; oddly, `lz4` does not appear in the `riseproject.gitlab.io/python/wheel_builder` documentation page despite the underlying repo evidence, a discrepancy left unresolved.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Oct 17-23, 2023 | PR [#1298](https://github.com/lz4/lz4/pull/1298) "Enable basic support for riscv64" opened and merged by Hamlin-Li. Cyan4973 initially questioned whether the patch changed anything (riscv64-linux-gnu-gcc built and passed tests "out of the box"); merged after t-mat noted some RV64 cross-compilers don't predefine width macros, justifying explicit `__riscv_xlen` detection in `programs/platform.h`. | [PR #1298](https://github.com/lz4/lz4/pull/1298) |
| Oct 19, 2023 | PR [#1299](https://github.com/lz4/lz4/pull/1299) "added new qemu targets for CI (MIPS, M68K, RISC-V)" merged, adding riscv64 to the QEMU-based CI matrix. | [PR #1299](https://github.com/lz4/lz4/pull/1299) |
| Jul 21, 2024 | v1.10.0 released, the first (and, as of this report, only) tagged release containing riscv64 code (#1298/#1299). Release assets are Windows zips and a source tarball only; no Linux prebuilt binary for any architecture. | [v1.10.0](https://github.com/lz4/lz4/releases/tag/v1.10.0) |
| Jul 24 - Sep 10, 2025 | Issue [#1635](https://github.com/lz4/lz4/issues/1635) "[Proposal] RISC-V Architecture Optimizations" opened by Polaris-911, asking whether the maintainer would welcome RISC-V-specific vector/assembly paths and what process to follow. Closed Sept 10, 2025 as completed (assigned Cyan4973); functioned as a green light rather than a formal design doc. | [Issue #1635](https://github.com/lz4/lz4/issues/1635) |
| Jul 15, 2025 (opened, still open) | Issue [#1633](https://github.com/lz4/lz4/issues/1633) "Proposal for RVV Optimization of the LZ4 Algorithm" - RFC citing preliminary, unquantified RVV results. Remains open with no maintainer response and no concrete patch attached. | [Issue #1633](https://github.com/lz4/lz4/issues/1633) |
| Aug 7-27, 2025 | PR [#1639](https://github.com/lz4/lz4/pull/1639) "Makefile: support UNALIGNED_ACCESS_SUPPORTED for RISC-V" opened by Polaris-911, reporting ~30% compression improvement via lzbench; closed unmerged, superseded by #1648. | [PR #1639](https://github.com/lz4/lz4/pull/1639) |
| Aug 28 - Sep 11, 2025 | PR [#1648](https://github.com/lz4/lz4/pull/1648) "Configure LZ4_FORCE_MEMORY_ACCESS=2 for RISC-V with Zicclsm extension" opened by Polaris-911, merged by Cyan4973. Auto-detects GCC's `Zicclsm` macro (mandatory under RVA20U64) instead of requiring a manual flag; +34.38% compression speed on SG2044 (160 to 215 MB/s, averaged over 3 runs). This remains the **only** RISC-V code that has ever been merged into `lz4/lz4` beyond the 2023 portability patches. | [PR #1648](https://github.com/lz4/lz4/pull/1648) |
| Dec 1, 2025 (opened, still open) | PR [#1678](https://github.com/lz4/lz4/pull/1678) "[RISC-V] Add 64-bit optimizations achieving 4.7-4.8x decompression speedup" opened by Dayuxiaoshui. Original claims (1215 to 5841 MB/s, 4.81x) were challenged by Cyan4973 as "hollow, like an LLM generated text"; author retracted the RVV `LZ4_wildCopy8` portion (self-measured as a -5% regression on Level 9) and the `FASTLOOP_SAFE_DISTANCE`/threshold changes, converging on a simplified `LZ4_FAST_DEC_LOOP`-only patch reporting +15% decompression (1231 to 1411 MB/s) on realistic data. Still open, not yet resubmitted/merged. | [PR #1678](https://github.com/lz4/lz4/pull/1678) |
| Dec 11, 2025 (opened, still open) | PR [#1686](https://github.com/lz4/lz4/pull/1686) "enable LZ4_FAST_DEC_LOOP on RISC-V with RVV-accelerated LZ4_wildCopy32" opened by yunfeizhou2025. Later folded into #1778 as a prerequisite. | [PR #1686](https://github.com/lz4/lz4/pull/1686) |
| Apr 11, 2026 (opened, still open) | PR [#1734](https://github.com/lz4/lz4/pull/1734) "[RISC-V] Add RVV vectorization for xxHash (XXH64: 3.04x speedup)" opened by cgyygc, an ISCAS (Institute of Software, Chinese Academy of Sciences)-affiliated contributor. No maintainer review. | [PR #1734](https://github.com/lz4/lz4/pull/1734) |
| Apr 27, 2026 (opened, still open) | PR [#1738](https://github.com/lz4/lz4/pull/1738) "[RISC-V] Add RVV vectorization for LZ4_count function" opened by cgyygc (ISCAS), reporting 13-26% compression speedups on riscv64. No maintainer review. | [PR #1738](https://github.com/lz4/lz4/pull/1738) |
| Apr 30, 2026 (opened, still open) | PR [#1739](https://github.com/lz4/lz4/pull/1739) "Enable LZ4_FAST_DEC_LOOP for RISC-V" opened by Polaris-911: a narrower, independent enablement of the fast-decode loop, tested on a SpacemiT K1-X board (GCC 13.2.0, lzbench 2.1, silesia.tar): +0.5% compression, +1.0% decompression, no ratio regression. | [PR #1739](https://github.com/lz4/lz4/pull/1739) |
| Jun 9, 2026 | PR [#1759](https://github.com/lz4/lz4/pull/1759), a duplicate of #1739 by the same author, opened and closed the same day, not merged. | [PR #1759](https://github.com/lz4/lz4/pull/1759) |
| Jul 29, 2026 (opened, still open) | PR [#1778](https://github.com/lz4/lz4/pull/1778) "[RISC-V] optimizations" opened by VinogradovDmitri (branch `riscv-boost`), explicitly consolidating #1686, #1734, #1738, and #1739. Adds hash-table prefetch, a widened 32-byte fast-match copy, and an experimental RVV `wildCopy32` (disabled by default after benchmarking showed no gain); reverses course on alignment strategy by setting `RISCV_STRICT_ALIGN=1` by default and dropping the scalar-only riscv64 fast-decode path, keeping fast-decode only for riscv64+vector builds. Reports roughly 31% faster compression of a 418 MB archive on SpacemiT X60 (5.161s to 3.564s) vs. dev baseline. No formal review or assignee yet; open as of this report date. This is currently the most likely path to landing broader RVV coverage. | [PR #1778](https://github.com/lz4/lz4/pull/1778) |

**Key contributors:**
- Polaris-911: PR #1648 (merged), #1639 (closed unmerged), #1739 (open), issue #1635 (closed). No employer affiliation disclosed.
- Dayuxiaoshui: PR #1678 (open). No employer affiliation disclosed.
- yunfeizhou2025: PR #1686 (open, folded into #1778). No employer affiliation disclosed.
- cgyygc: PRs #1734, #1738 (both open), ISCAS-affiliated.
- VinogradovDmitri: PR #1778 (open, consolidation), branch `riscv-boost`; credits yunfeizhou2025, cgyygc, Felix-Gong, and Polaris-911 as prior-work contributors.

**Fully upstream?** Baseline riscv64 build/detection (#1298/#1299) is upstream and shipped in v1.10.0 (Jul 2024). The Zicclsm memory-access optimization (#1648) is merged into `dev` but **has not shipped in any tagged release** - v1.10.0 (Jul 2024) predates it, and no release has been cut since. All RVV/FAST_DEC_LOOP performance work (#1678, #1686, #1734, #1738, #1739, #1778) remains open and unmerged.

---

## 3. Upstream Support Tier

LZ4 publishes no formal platform-tier policy (no `PLATFORMS.md`/`SUPPORT.md`/`docs/platforms/`). Tiering must be inferred from `.github/workflows/cross-platform.yml`, the only CI file that mentions RISC-V anywhere in the repository (verified by a case-insensitive grep across all ten workflow files plus `.circleci/config.yml`; `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in this repo).

**Inferred tiers from the CI matrix:**
- Tier 1 (native x86_64 runner): amd64 - exercised across multiple compiler versions in separate workflows (`compilers.yml`, `core-tests.yml`, etc.).
- Tier 2 (QEMU cross, unconditional step): ARM, ARM64, PPC, PPC64LE, S390X.
- Tier 3 (QEMU cross, conditional step, `contains(fromJSON('["MIPS","M68K","RISC-V","SPARC"]'), matrix.arch)`): MIPS, M68K, RISC-V, SPARC.

RISC-V sits in Tier 3 by this implicit classification - grouped with the least-tested architectures in the matrix, sharing a single generic test step rather than architecture-specific steps like PPC64LE (`CFLAGS=-m64`) or M68K (`HAVE_MULTITHREAD=0`).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Native runner (`ubuntu-latest`) | QEMU cross-compile on `ubuntu-latest` | QEMU cross-compile on `ubuntu-latest` |
| CI grouping | Primary, multiple dedicated workflows | Primary cross-platform step | Secondary step, grouped with MIPS/M68K/SPARC |
| Release-blocking | Implied (primary target) | Likely [NEEDS VERIFICATION] | No documented requirement |
| Prebuilt binaries (GitHub Releases) | None (source + Windows zips only) | None | None |
| Fast-path code (`LZ4_FAST_DEC_LOOP`) | Enabled | Enabled | Disabled (not in the arch allow-list) |
| Dedicated wildcopy routine | Absent | `LZ4_wildCopy64` | Absent |
| Native GitHub Actions runner | Yes | No | No (RISE now offers free native `ubuntu-24.04-riscv` runners generally, but `lz4/lz4`'s own CI does not use them) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

A direct source audit (`lib/lz4.c`, `lib/lz4hc.c`, `lib/lz4frame.c`, `lib/xxhash.c`, `lib/xxhash.h`, `programs/platform.h`) confirms the riscv64 footprint in the **merged/shipped** codebase is exactly two preprocessor lines, both feature-detection guards with zero function-body specialization:

```
lib/lz4.c:81            || (defined(__riscv) && defined(__riscv_zicclsm)) )
                         -> selects LZ4_FORCE_MEMORY_ACCESS=2 (direct unaligned pointer access)
programs/platform.h:52  || (defined __riscv && defined __riscv_xlen && (__riscv_xlen == 64))
                         -> generic 64-bit-target detection (LZ4_ARCH64)
```

No `#ifdef __riscv` wraps an actual function, loop, or intrinsic anywhere in `lz4.c`, `lz4hc.c`, `lz4frame.c`, or the bundled `xxhash.c`. Zero hits were found in the repository for `riscv_vector.h`, `rvv`, `vfloat32m1_t`, `zba`, `zbb`, `.S` assembly files, or an `arch/riscv/` directory - there is no dedicated RISC-V backend of any kind, only the one Zicclsm memory-access switch.

**Critically, riscv64 is excluded from the `LZ4_FAST_DEC_LOOP` architecture allow-list** (`lib/lz4.c:479-486`, which enables it only for x86/x86_64 and aarch64), so decompression on riscv64 silently falls back to the slow/safe generic decode loop - the same code path any unaccelerated, unoptimized platform would run.

| Component | amd64/x86_64 | arm64/aarch64 | riscv64 (merged) | riscv64 (open PRs) |
|---|---|---|---|---|
| Memory-access mode selector | Generic macro bucket (scalar) | Generic macro bucket (scalar) | Zicclsm-aware selector (merged, PR #1648, unreleased) | - |
| `LZ4_FAST_DEC_LOOP` | Enabled | Enabled | **Disabled** (falls to generic else) | #1678, #1686, #1739, #1778 (all open) |
| Wildcopy / literal-copy width | Generic 32-byte scalar | Dedicated `LZ4_wildCopy64` (scalar, ~15 lines) | **Absent** (generic 8/32-byte path) | RVV `wildCopy32` proposed in #1686/#1778 (disabled by default in #1778 after showing no gain) |
| `LZ4_count` (match-length scan) | Scalar, compiler bit-scan builtins | Scalar, same builtins | **Missing RVV version** | RVV proposed in #1738 (open) |
| xxHash (bundled checksum) | Scalar C | Scalar C | **Missing RVV version** | RVV proposed in #1734 (open) |
| Hand-written SIMD/assembly (any arch) | None in tree | None in tree | None in tree | None proposed with assembly (RVV intrinsics only) |

**Bottom line:** on any axis that defines LZ4's own stated value proposition (compression/decompression throughput), riscv64 today runs identical, unaccelerated scalar C to a generic/unoptimized target. arm64 and amd64 at least get the fast-decode loop enabled; arm64 additionally gets a dedicated 64-byte wildcopy routine. No architecture in the shipped tree has hand-tuned assembly or SIMD intrinsics - the gap for riscv64 is that it lacks even the generic scalar fast-path enablement that amd64/arm64 already have, and every PR that would close that gap remains open.

No JIT backend, cryptographic acceleration, GC write barriers, or floating-point code paths exist anywhere in LZ4 for any architecture, so those categories present no riscv64-specific gap.

---

## 5. Build System, Cross-Compilation, and Toolchain

LZ4 provides three build systems: a root `Makefile` (primary), `build/cmake/CMakeLists.txt` (optional; `cmake_minimum_required(VERSION 3.5...4.0.2)`), and Meson support. None reference RISC-V, `find_package`, or any per-architecture toolchain file. No `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, or Dockerfile exists anywhere in the repository (all checked directly on the `dev` branch, all absent). CMake options are generic (`-DLZ4_BUILD_CLI`, `-DBUILD_SHARED_LIBS`, `-DBUILD_STATIC_LIBS`, `-DLZ4_POSITION_INDEPENDENT_LIB`, `-DLZ4_DEBUG_LEVEL`) with no `-DUSE_X=OFF`-style architecture switches.

**Cross-compilation recipe (derived directly from `.github/workflows/cross-platform.yml`):**

```
sudo apt-get update
sudo apt-get install gcc-multilib qemu-utils qemu-user-static
sudo apt-get install qemu-system-riscv64 gcc-riscv64-linux-gnu

git clone https://github.com/lz4/lz4
cd lz4
make platformTest V=1 CC=riscv64-linux-gnu-gcc QEMU_SYS=qemu-riscv64-static
```

`platformTest` expands to:
```
CFLAGS="$(CFLAGS) -O3 -Werror"         make -C lib all
CFLAGS="$(CFLAGS) -O3 -Werror -static" make -C programs all
CFLAGS="$(CFLAGS) -O3 -Werror -static" make -C tests all
make -C tests test-platform
```

`test-platform` (in `tests/Makefile`) is where QEMU actually runs the statically-linked binaries:
```makefile
test-platform:
	$(QEMU_SYS) $(DATAGEN) -g16KB  | $(QEMU_SYS) $(LZ4) -9     | $(QEMU_SYS) $(LZ4) -t
	$(QEMU_SYS) $(DATAGEN)         | $(QEMU_SYS) $(LZ4)        | $(QEMU_SYS) $(LZ4) -t
	$(QEMU_SYS) $(DATAGEN) -g256MB | $(QEMU_SYS) $(LZ4) -vqB4D | $(QEMU_SYS) $(LZ4) -qt
ifneq ($(QEMU_SYS),qemu-arm-static)
	$(QEMU_SYS) $(DATAGEN) -g3GB   | $(QEMU_SYS) $(LZ4) -vqB5D | $(QEMU_SYS) $(LZ4) -qt
endif
```

`QEMU_SYS` is prefixed directly onto every binary invocation (`datagen`, `lz4`) rather than used as a chroot/sysroot wrapper - no `-L <sysroot>` flag is needed because Ubuntu's `qemu-riscv64-static` plus statically-linked test binaries avoid that requirement. The 3 GB pipeline is **not** skipped for RISC-V (it is skipped only for `qemu-arm-static`), so riscv64 gets the same test depth as MIPS, M68K, and SPARC.

**No special `CFLAGS` are set for RISC-V** (`makevar` is empty; compare PPC64LE's `CFLAGS=-m64` or M68K's `HAVE_MULTITHREAD=0`), and no `-march=` vector-extension flag is passed anywhere in CI.

**Minimum toolchain versions:** none documented anywhere in the repository for RISC-V or any architecture. `__riscv_zicclsm` is defined automatically only by GCC 14.1+; on older compilers the optimization from PR #1648 is silently skipped (no build error, just the slower memcpy-based fallback). PR #1738's RVV `LZ4_count` reportedly does not build correctly with GCC 15.1.0 [NEEDS VERIFICATION, single-sourced to the existing internal report; not independently confirmed in this pass].

**QEMU:** `qemu-riscv64-static` (user-mode static emulation) is what actually executes the tests; `qemu-system-riscv64` is installed as an apt dependency in the CI step but is not the emulator used for test execution.

**Known build issues:** none documented in mainline; no open riscv64 build-failure issues were found in the tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

LZ4 is **functionally complete** on riscv64: it builds, passes the full correctness test suite under QEMU (all four data-size pipelines, including the 3 GB one), and ships via major Linux distributions (Section 8). There are no functional gaps - every feature available on amd64/arm64 is available on riscv64. The gaps are entirely performance gaps from missing architecture-tuned code paths, and because LZ4's value proposition is speed rather than ratio, these gaps are the crux of the readiness question.

**Performance gaps, as reported by the PR authors themselves (not independently re-benchmarked by the maintainer or by this report):**

| Missing feature | Reported effect | Source | Status |
|---|---|---|---|
| `LZ4_FAST_DEC_LOOP` (SG2044, after retraction of overclaimed RVV portions) | +15% decompression on realistic data (1231 to 1411 MB/s) | [PR #1678](https://github.com/lz4/lz4/pull/1678) | Open, no review |
| `LZ4_FAST_DEC_LOOP` (SpacemiT K1-X, silesia.tar/lzbench) | +0.5% compression, +1.0% decompression | [PR #1739](https://github.com/lz4/lz4/pull/1739) | Open, no review |
| `LZ4_FAST_DEC_LOOP` + RVV `wildCopy32` | Unquantified in live-verified sources; existing internal notes cite in-order/out-of-order core deltas on XuanTie C908/C920 [NEEDS VERIFICATION - single-sourced, not independently confirmed this pass] | [PR #1686](https://github.com/lz4/lz4/pull/1686) | Open, folded into #1778 |
| RVV `LZ4_count` | 13-26% compression speedup | [PR #1738](https://github.com/lz4/lz4/pull/1738) | Open, no review |
| RVV xxHash XXH64 | 3.04x speedup | [PR #1734](https://github.com/lz4/lz4/pull/1734) | Open, no review; absolute MB/s figures cited in the existing internal report (1,431 to 4,352 MB/s) are [NEEDS VERIFICATION], and the PR body/commit message reportedly disagree on absolute figures |
| Consolidated rollup (hash-table prefetch, wider fast-match copy, experimental RVV wildCopy32 disabled by default) | ~31% faster compression of a 418 MB archive on SpacemiT X60 vs. dev baseline | [PR #1778](https://github.com/lz4/lz4/pull/1778) | Open, no review |
| Zicclsm unaligned-access mode (merged, unreleased) | +34.38% compression speed on SG2044 (160 to 215 MB/s) | [PR #1648](https://github.com/lz4/lz4/pull/1648) | Merged into `dev`, not yet in a tagged release |

**Important scope distinction:** the only *hard, independently reproducible* RVV-accelerated LZ4 throughput numbers found anywhere come from a **third-party Go reimplementation**, `go-compressions/lz4` (not the canonical C `lz4/lz4` library): on a SpacemiT X60 (RVV 1.0, in-order core), RVV-accelerated encode measured 110 MB/s vs. a 76 MB/s scalar baseline on the same hardware (~1.45x), and beat the pure-Go `pierrec/lz4` (83 MB/s) by ~1.32x. The canonical C library has **no merged RVV path**, so this number characterizes what RVV *could* do for an LZ4-class codec on this hardware class, not what `lz4/lz4` itself delivers today.

**Contradictory/retracted data point:** PR #1678 originally claimed a 4.7-4.8x decompression speedup (1,215 to 5,841 MB/s on SG2044, GCC 12.3, `-march=rv64gcv -O3`) on highly compressible synthetic data (~254:1 ratio). The maintainer challenged the methodology and the LLM-like write-up; the author retracted the RVV `wildCopy8` change (self-measured as a **-5% regression** at Level 9: 674.5 to 641.1 MB/s) and the threshold/safe-distance tuning, leaving only the +15% `FAST_DEC_LOOP`-only figure on realistic data as the credible, surviving claim.

**Security hardening:** no security-hardening features (stack canaries, CFI, ASLR hooks) exist in LZ4 for any architecture; no riscv64-specific gap.

**NaN/floating-point semantics:** not applicable - LZ4 is a pure integer-arithmetic codec with no floating-point code path on any architecture.

---

## 7. CI/CD Infrastructure

RISC-V CI exists, in exactly one place: `.github/workflows/cross-platform.yml`. This is the only workflow file (of ten) or CI system (no GitLab CI, Jenkinsfile, or Cirrus config exists in the repo) that mentions RISC-V at all.

**Exact configuration, read directly from the file (line ~28 of the matrix):**
```yaml
- { arch: RISC-V, pkgs: 'qemu-system-riscv64 gcc-riscv64-linux-gnu', xcc: riscv64-linux-gnu-gcc, xemu: qemu-riscv64-static, makevar: "" }
```
- **Trigger:** unconditional `on: push` and `on: pull_request`, no branch/path filters, no `workflow_dispatch`, no `schedule`.
- **Runner:** `ubuntu-latest` - standard x86_64 GitHub-hosted, **not** a native riscv64 machine.
- **Execution model:** cross-compile with `riscv64-linux-gnu-gcc`, then run the built, statically-linked binaries under `qemu-riscv64-static` user-mode emulation via `make platformTest V=1 CC=$XCC QEMU_SYS=$XEMU`.
- No RVV/vector extension flags are set anywhere in CI (`makevar` is empty for RISC-V).
- None of the six open RVV/FAST_DEC_LOOP PRs (#1678, #1686, #1734, #1738, #1739, #1778) have modified any CI workflow file on `dev` - the riscv64 CI surface today is exactly this one matrix row, unchanged since #1299 (2023).

**What this CI does and does not test:** it verifies correctness of compression/decompression across four data sizes (16 KB, default, 256 MB, 3 GB) under QEMU. It does **not** test performance, does not exercise any RVV code path, and does not verify that the Zicclsm optimization (#1648) actually activates (that requires GCC 14.1+ and Zicclsm-capable QEMU/hardware, neither of which is pinned or confirmed in this workflow) [NEEDS VERIFICATION on the CI toolchain's actual GCC/QEMU version].

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes (QEMU) | Yes (QEMU) |
| Runner type | Native (`ubuntu-latest`) | Cross-compile + QEMU | Cross-compile + QEMU |
| CI grouping | Primary, multiple workflows | Primary cross-platform step | Secondary step (MIPS/M68K/RISC-V/SPARC) |
| Trigger | push + PR | push + PR | push + PR |
| RISE native runners used | No | No | No (available generally since RISE's Mar 2026 "RISE RISC-V Runners" announcement, but not adopted in this repo's CI) |
| Hardware-in-the-loop | No | No | No |
| Vector-extension testing | N/A | N/A | No |
| Compiler version pinned | No | No | No |

---

## 8. Distribution and Release Status

**Latest upstream release:** [v1.10.0](https://github.com/lz4/lz4/releases/tag/v1.10.0), July 21, 2024. Release assets are Windows zips (`lz4_win32_v1_10_0.zip`, `lz4_win64_v1_10_0.zip`) and a source tarball; **no Linux prebuilt binary for any architecture**, so the absence of a riscv64-named asset does not reflect discrimination against RISC-V - upstream ships no compiled binaries for any platform via GitHub Releases. This is the basis for the "release: no" finding under the readiness grade (Section 13); it is a general upstream policy, not RISC-V-specific.

**The Zicclsm optimization (PR #1648, merged Sept 2025) has not shipped in any release** - no tag has been cut since v1.10.0 (July 2024), so users of a tagged LZ4 release get no benefit from it regardless of architecture; only `dev`-branch builds include it.

**Linux distribution packages (this is where riscv64 binaries actually come from - `release_provider: distro`):**

| Distribution | Package | riscv64 available | Version | Verification |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `lz4`, `liblz4-1`, `liblz4-dev`, `python3-lz4` | **Yes** | 1.10.0-8 | Direct HTTP fetch of `packages.ubuntu.com/resolute/riscv64/lz4` and a `HEAD` request on the actual `.deb` (`lz4_1.10.0-8_riscv64.deb`, 55,692 bytes) returned HTTP 200; continuous riscv64 build lineage confirmed back to 1.9.4 (2024-04-08) |
| Ubuntu 24.04 "noble" | `lz4`, `liblz4-1`, `liblz4-dev` | Yes | 1.9.4-1build1 | Package listing |
| Debian sid | `liblz4-1`, `liblz4-dev`, `lz4` | Yes | 1.10.0-10 | Package listing |
| Arch Linux RISC-V port (archriscv.felixc.at) | `lz4` | Unverified | Unknown | Site's search/API endpoints returned 404 for every URL tried; this is a tooling access limitation, not evidence of absence |

**Python (PyPI):** upstream `lz4` package (v4.4.5) publishes 57 wheel artifacts - manylinux (x86_64/aarch64/i686), macOS, and Windows across CPython 3.9-3.14 - and **zero contain "riscv" or "riscv64"** in the filename (verified by enumerating the raw PyPI JSON `urls[]` array). A riscv64 pip user must build from the sdist, requiring a local C compiler and lz4 headers.

**RISE community wheel builder (GitLab, distinct from PyPI):** publishes 4 riscv64 wheels for the same `lz4` 4.4.5 package (`manylinux_2_31_riscv64`/`manylinux_2_39_riscv64` for CPython 3.12, 3.13, 3.14, and 3.14t free-threaded), via `riseproject-dev/python-wheels`. This channel exists but is separate from, and not surfaced on, upstream PyPI.

**What a user must do to get a working riscv64 binary today:**
- Via `apt` on Ubuntu/Debian: `apt install liblz4-1` (or `lz4`) - works immediately, no source build.
- Via `pip install lz4` from PyPI: triggers a source build requiring gcc + headers, unless the RISE GitLab wheel index is used explicitly instead of PyPI.
- Embedding the C library directly: build from source at v1.10.0 or `dev`; both build and pass tests on riscv64 under the recipe in Section 5.

---

## 9. Dependencies

LZ4's core C library has no external runtime dependency beyond the C standard library; its build tooling is a small set of build/test-time tools. The table below lists every direct dependency together with its riscv64 status.

| Dependency | Role | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| **xxHash** | Vendored checksum algorithm (`lib/xxhash.c`/`.h`), used for content integrity in the frame format and CLI | Optional (runtime) | Builds as portable generic C on riscv64; no dedicated riscv64 CI test lane found in xxHash's own workflows (distinct from LZ4's own `cross-platform.yml`, which does test riscv64) | The bundled copy predates the standalone xxHash project's separately merged RVV acceleration work; xxHash upstream has its own open/closed RISC-V optimization discussion (Cyan4973/xxHash#1018, closed as completed) not yet reflected in LZ4's vendored snapshot. LZ4 PR #1734 proposes adding RVV to the vendored copy but is unreviewed. See the companion report `project-reports/xxhash.md`. |
| **GCC** | Primary cross-compiler for riscv64 builds (`riscv64-linux-gnu-gcc`) | Critical (build) | Mature riscv64 target; GCC 14.1+ required for the Zicclsm auto-detection macro (`__riscv_zicclsm`) used by PR #1648 to take effect - older GCC silently falls back to the slower memcpy-based path | No minimum GCC version is documented anywhere in LZ4's own README/INSTALL for any architecture |
| **GNU make** | Drives the entire build (`Makefile`, `platformTest`, `test-platform` targets) | Critical (build) | No riscv64-specific behavior; architecture handling lives entirely in `CC`/`QEMU_SYS`/`CFLAGS` variables passed to make | - |
| **CMake** | Alternative build system (`build/cmake/CMakeLists.txt`) | Optional (build) | No riscv64-specific CMake logic exists; generic options only (`LZ4_BUILD_CLI`, `BUILD_SHARED_LIBS`, etc.); riscv64 cross-build via CMake is not exercised in CI | - |
| **Meson** | Alternative build system | Optional (build) | No riscv64-specific logic found; not exercised for riscv64 in CI | - |
| **QEMU** (`qemu-riscv64-static`, user-mode) | Executes the cross-compiled, statically-linked test binaries in CI | Critical (test) | This is precisely the mechanism that gives LZ4 "test: yes" in the readiness grade - correctness is proven via emulation, not on real silicon or native CI | `qemu-system-riscv64` is also installed in CI but is not the emulator actually invoked by `test-platform` |
| **glibc** | C standard library LZ4 links against (`memcpy`, `memmove`, etc.) | Critical (runtime) | Mature, universally available riscv64 support in every distro tested (Section 8) | No blocking issues found |

No dependency in this list carries a JIT backend, cryptographic implementation, or non-trivial numerics beyond xxHash's checksum arithmetic, so no further multi-level recursion is warranted; xxHash is the only one with its own separate riscv64 optimization story, covered in the companion `project-reports/xxhash.md`.

---

## 11. Known Bugs and Active Issues

No riscv64-specific **correctness** bug was found in the `lz4/lz4` tracker. One architecture-agnostic memory-safety bug is open and worth flagging because it affects riscv64 builds equally to every other platform.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1783](https://github.com/lz4/lz4/issues/1783) | Input-side heap OOB read in `LZ4_decompress_fast` family (deprecated unsafe API) - CWE-125 | Open | Correctness/security | Filed 2026-08-09. Reproduced via ASan/AFL++ fuzzing on v1.10.0 HEAD, 30+ distinct crashing inputs. Not RISC-V-specific; affects any platform using the deprecated `LZ4_decompress_unsafe_generic`/`LZ4_decompress_fast*` APIs, riscv64 included |
| [#1633](https://github.com/lz4/lz4/issues/1633) | Proposal for RVV Optimization of the LZ4 Algorithm | Open | Enhancement | RFC only, no concrete patch attached, no maintainer response, no numeric data |
| [#1678](https://github.com/lz4/lz4/pull/1678) | Enable `LZ4_FAST_DEC_LOOP` for riscv64 | Open PR | Performance | Simplified to a single change after the maintainer's LLM-text accusation; surviving claim is +15% decompression; awaiting resubmission/review |
| [#1686](https://github.com/lz4/lz4/pull/1686) | `LZ4_FAST_DEC_LOOP` + RVV `LZ4_wildCopy32` | Open PR | Performance | Folded into #1778 as a prerequisite; no independent review |
| [#1734](https://github.com/lz4/lz4/pull/1734) | RVV vectorization for xxHash (XXH64: 3.04x) | Open PR | Performance | Existing internal notes flag inconsistent absolute-throughput numbers between the PR body and its commit message [NEEDS VERIFICATION]; no review |
| [#1738](https://github.com/lz4/lz4/pull/1738) | RVV vectorization for `LZ4_count` | Open PR | Performance | Reports 13-26% compression speedup; a GCC 15.1.0 build-failure note in the existing internal report is [NEEDS VERIFICATION]; no review |
| [#1739](https://github.com/lz4/lz4/pull/1739) | Enable `LZ4_FAST_DEC_LOOP` for riscv64 (independent, narrower) | Open PR | Performance | Third independent attempt at the same change; no review |
| [#1778](https://github.com/lz4/lz4/pull/1778) | [RISC-V] optimizations (consolidation rollup) | Open PR | Performance | Consolidates #1686/#1734/#1738/#1739; no formal review or assignee yet |

**No correctness bugs specific to riscv64** were found; #1783 is the only open correctness issue and it is architecture-agnostic.

---

## 12. Objections and Upstream Blockers

**Single-maintainer bottleneck.** Cyan4973 is the sole reviewer and merger for the entire project. Six RISC-V performance PRs (#1678, #1686, #1734, #1738, #1739, #1778) have been open between roughly 2 and 10 months with no recorded maintainer review pass. This constraint applies to all contributions, not only RISC-V ones, but RISC-V work has no alternative reviewer path.

**LLM-quality suspicion.** Cyan4973 explicitly flagged PR #1678's explanation as sounding "like an LLM generated text," and the subsequent self-retraction of most of that PR's claims (including an admitted -5% regression the author had originally omitted) partly validated the concern. This creates a reputational headwind for the wave of ISCAS-affiliated PRs that followed (#1734, #1738) even where the underlying technical work may be sound - contributors need clean, single-change PRs with reproducible, independently-checkable benchmark methodology to clear this bar.

**Overlapping, uncoordinated PRs.** Three independent PRs (#1678, #1686, #1739) each separately proposed enabling `LZ4_FAST_DEC_LOOP` for riscv64 before #1778 attempted to consolidate the RVV-adjacent subset (#1686/#1734/#1738/#1739). This forces the maintainer to arbitrate between overlapping submissions rather than review one clean patch, adding a coordination cost purely from the contributor side of the process.

**No stated objection to RISC-V as a platform.** Cyan4973 merged the basic riscv64 detection PR (#1298) same-day-as-approved, calling it "harmless and potentially useful," and merged the Zicclsm fix (#1648) within roughly two weeks of a clean submission. The blocker is maintainer bandwidth and evidentiary bar, not hostility to the architecture.

**Acceptance probability for pending work, by pattern:**
- Single-focused, hardware-gated correctness/portability fix (the #1648 pattern): high, based on direct precedent.
- Multi-component but well-motivated consolidation with real in-order/out-of-order data (the #1778/#1686 pattern): moderate, contingent on presenting one clean, well-justified change and following up.
- RVV intrinsic PRs with unverified or internally inconsistent benchmark numbers (#1734 as currently reported, #1738's disputed GCC compatibility): low without a stronger, independently reproducible benchmark write-up.

---

## 13. Readiness Assessment

- **Color:** yellow (optimization-minimal-cap: Step 2 "Minimal" optimization level caps a CI-based "blue" grade down to yellow)
- **Release provider:** distro
- **Optimization level:** minimal - primary hot paths (decompression `LZ4_FAST_DEC_LOOP`, `wildCopy` bulk-copy routines, and the `LZ4_count` match-length function used in compression) still run generic scalar C on riscv64, identical to what runs on any unoptimized platform. The only RISC-V-specific code that exists is a narrow compile-time memory-access-mode switch (the `__riscv_zicclsm` macro in `lib/lz4.c`, merged via [PR #1648](https://github.com/lz4/lz4/pull/1648) but not yet in any tagged release) plus a portability/64-bit-detection macro in `programs/platform.h`. No RVV vectorization has been merged anywhere in `lz4/lz4`; six RVV/FAST_DEC_LOOP optimization PRs ([#1678](https://github.com/lz4/lz4/pull/1678), [#1686](https://github.com/lz4/lz4/pull/1686), [#1734](https://github.com/lz4/lz4/pull/1734), [#1738](https://github.com/lz4/lz4/pull/1738), [#1739](https://github.com/lz4/lz4/pull/1739), [#1778](https://github.com/lz4/lz4/pull/1778)) remain open/unmerged.

**Justification.** Per the skill's Step 1, upstream CI (`.github/workflows/cross-platform.yml`) both cross-compiles for riscv64 (`gcc-riscv64-linux-gnu`) and executes the real test suite under QEMU (`qemu-riscv64-static`, via `make platformTest` -> `test-platform`, which actually runs `datagen`/`lz4`/`lz4 -t` pipelines), and upstream publishes no riscv64 binary artifact (the only release assets in [v1.10.0](https://github.com/lz4/lz4/releases/tag/v1.10.0) are Windows zips and a source tarball) - build=yes, test=yes, release=no, which is the definition of "blue." Consumable riscv64 binaries instead come from Ubuntu/Debian packaging (`release_provider: distro`), not upstream (Section 8). Because LZ4 is an optimization-purpose project - speed, not ratio, is its explicitly stated differentiator - Step 2 applies: RISC-V-specific code is limited to one narrow, unreleased memory-access macro ([PR #1648](https://github.com/lz4/lz4/pull/1648)), while the critical speed-defining hot paths (`FAST_DEC_LOOP`, `wildCopy`, `LZ4_count`) remain unaccelerated scalar C on RISC-V, unlike arm64/amd64, which have `FAST_DEC_LOOP` and `wildCopy64` enabled (Section 4). This is assessed as "Minimal," which caps the primary "blue" CI grade down to "yellow."

**Pending work that could change the grade.** Six open/unmerged RISC-V optimization PRs against `lz4/lz4` could close the gap if merged: #1678 (FAST_DEC_LOOP, retracted overclaims, simplified to +15% decompression), #1686 (FAST_DEC_LOOP + RVV wildCopy32), #1734 (RVV xxHash XXH64), #1738 (RVV LZ4_count), #1739 (narrow FAST_DEC_LOOP enable), and #1778 (open rollup consolidating #1686/#1734/#1738/#1739, currently the most likely path to landing broader RVV coverage). None have maintainer review yet; sole maintainer Cyan4973 has been slow but not hostile (he previously flagged #1678 for unsubstantiated/LLM-sounding claims). Also pending: a new tagged release to actually ship the already-merged Zicclsm optimization (#1648), which would immediately improve real-world riscv64 users even without new optimizations. LZ4 itself is not a RISE member project and has no RISE blog coverage; the only RISE-tracked RISC-V work found concerns the separate `lz4-java` project, not `lz4/lz4`.

---

## 14. Investment Analysis

RISE has no documented funding or tracked work item against `lz4/lz4` itself (its only related, funded work targets the separate `lz4-java` project - Section 1). All work sized below is currently unsponsored.

### 14.1 Functional Enablement

No functional gaps exist. LZ4 builds and passes its full test suite on riscv64 today via upstream CI, and riscv64 binaries are available through Ubuntu/Debian packaging. No investment is required for functional enablement.

### 14.2 Performance Optimization

This is where all readiness-relevant investment belongs, since the color grade is capped specifically because the speed-defining hot paths are unaccelerated. The highest-value, lowest-risk path is landing `LZ4_FAST_DEC_LOOP` for riscv64 with appropriate in-order/out-of-order gating - the approach PR #1686/#1778 already outline - since this is the single change with the most credible, reproducible reported gain (+15% decompression, per #1678's retracted-and-corrected figure) and does not require RVV hardware to benefit non-vector riscv64 cores. RVV `LZ4_count` (#1738, 13-26% compression) is the next highest-value item for compression-heavy workloads, once its reported GCC 15.1.0 build issue is resolved and reproduced independently. RVV xxHash (#1734) should not be pursued in isolation until its benchmark-number discrepancy is resolved and the vendored xxHash snapshot is reconciled with the standalone xxHash project's own RVV work.

Work items:
1. Consolidate the `LZ4_FAST_DEC_LOOP` effort behind a single clean submission (building on #1778's rollup), with reproducible benchmarks across at least one in-order and one out-of-order RISC-V core.
2. Independently verify and fix the reported GCC 15.1.0 incompatibility in #1738, and resolve #1734's internally inconsistent benchmark numbers, before pushing either for merge.
3. Engage Cyan4973 one focused PR at a time, following the #1648 pattern that succeeded: single change, explicit hardware precondition, benchmark methodology stated up front, polite timely follow-up.
4. Update the vendored xxHash snapshot in `lib/xxhash.c` to track the standalone xxHash project's already-merged RVV work, as a prerequisite to landing #1734 cleanly rather than carrying LZ4-specific divergence.

### 14.3 CI/CD Infrastructure

Current QEMU-based CI is sufficient for correctness but proves nothing about performance and cannot exercise RVV code paths. Adding a native riscv64 runner - RISE's own free `ubuntu-24.04-riscv` GitHub Actions runners are a direct, already-available fit - would let contributors and the maintainer validate the open optimization PRs on real hardware rather than relying on author-supplied numbers.

### 14.4 Ecosystem Enablement

The canonical C library has no dependent package ecosystem of its own requiring separate enablement (Section 10 is omitted for this reason). The adjacent Python `lz4` binding already has riscv64 coverage through the RISE GitLab wheel index even though upstream PyPI has none; closing that gap on PyPI itself (publishing an official manylinux riscv64 wheel) is a packaging task independent of any C-level optimization work and would remove the source-build requirement for `pip install lz4` on riscv64.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Consolidate and land riscv64 `LZ4_FAST_DEC_LOOP` (building on #1778/#1686/#1739) with multi-core, in-order/out-of-order benchmarks | 1 | Contributor / RISE | High |
| Performance | Independently verify and fix GCC 15.1.0 build issue in #1738 (RVV `LZ4_count`); reproduce benchmark methodology; drive to merge | 1 | Contributor / RISE | High |
| Performance | Resolve inconsistent benchmark numbers in #1734 (RVV xxHash); reconcile vendored xxHash with upstream standalone RVV work; drive to merge | 2 | Contributor / RISE | Medium |
| CI/CD | Add a native riscv64 runner (RISE's `ubuntu-24.04-riscv` GitHub Actions runners) with RVV-capable QEMU or hardware to `cross-platform.yml` | 1 | RISE | Medium |
| Packaging | Publish an official manylinux riscv64 wheel for `lz4` on PyPI (RISE wheel index already builds one; upstream PyPI does not) | 1 | Packager / RISE | Low |
| Release | Prompt upstream to cut a v1.10.1/v1.11.0 release so the already-merged Zicclsm optimization (#1648) reaches real users | 0.5 | Upstream (Cyan4973) | Low |

---

## 15. References

- [lz4/lz4 repository](https://github.com/lz4/lz4)
- [LZ4 homepage](https://lz4.github.io/lz4/)
- [PR #1298: Enable basic support for riscv64](https://github.com/lz4/lz4/pull/1298)
- [PR #1299: added new qemu targets for CI (MIPS, M68K, RISC-V)](https://github.com/lz4/lz4/pull/1299)
- [Issue #1635: [Proposal] RISC-V Architecture Optimizations](https://github.com/lz4/lz4/issues/1635)
- [Issue #1633: Proposal for RVV Optimization of the LZ4 Algorithm](https://github.com/lz4/lz4/issues/1633)
- [PR #1639: Makefile UNALIGNED_ACCESS_SUPPORTED for RISC-V (closed, not merged)](https://github.com/lz4/lz4/pull/1639)
- [PR #1648: Configure LZ4_FORCE_MEMORY_ACCESS=2 for RISC-V with Zicclsm extension (merged)](https://github.com/lz4/lz4/pull/1648)
- [PR #1678: [RISC-V] 64-bit optimizations achieving 4.7-4.8x decompression speedup (open)](https://github.com/lz4/lz4/pull/1678)
- [PR #1686: enable LZ4_FAST_DEC_LOOP on RISC-V with RVV-accelerated LZ4_wildCopy32 (open)](https://github.com/lz4/lz4/pull/1686)
- [PR #1734: [RISC-V] RVV vectorization for xxHash XXH64 (open)](https://github.com/lz4/lz4/pull/1734)
- [PR #1738: [RISC-V] RVV vectorization for LZ4_count (open)](https://github.com/lz4/lz4/pull/1738)
- [PR #1739: Enable LZ4_FAST_DEC_LOOP for RISC-V (open)](https://github.com/lz4/lz4/pull/1739)
- [PR #1759: Enable LZ4_FAST_DEC_LOOP for RISC-V (duplicate, closed)](https://github.com/lz4/lz4/pull/1759)
- [PR #1778: [RISC-V] optimizations (open rollup)](https://github.com/lz4/lz4/pull/1778)
- [Issue #1783: Input-side heap OOB read in LZ4_decompress_fast family - CWE-125](https://github.com/lz4/lz4/issues/1783)
- [GitHub releases: lz4 v1.10.0](https://github.com/lz4/lz4/releases/tag/v1.10.0)
- [PyPI lz4 4.4.5](https://pypi.org/project/lz4/4.4.5/)
- [Ubuntu 26.04 resolute: lz4 package (riscv64)](https://packages.ubuntu.com/search?keywords=LZ4&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 Noble: lz4 package](https://packages.ubuntu.com/noble/lz4)
- [Debian tracker: lz4](https://tracker.debian.org/pkg/lz4)
- [RISE Project member list](https://riseproject.dev/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE wheel builder (GitLab)](https://riseproject.gitlab.io/python/wheel_builder/)
- [go-compressions/lz4 (third-party Go RVV implementation, benchmark source)](https://github.com/go-compressions/lz4)
- [Cyan4973/xxHash issue #1018: Proposal for RISC-V optimization of XXH_mult32to64_add64](https://github.com/Cyan4973/xxHash/issues/1018)