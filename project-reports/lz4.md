---
title: LZ4
parent: Project Reports
categories:
  - libraries
---

# LZ4

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for LZ4<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LZ4 is a lossless, byte-oriented compression algorithm implemented as a C library. It targets maximum compression and decompression speed at modest compression ratio (roughly 2:1 on typical data), making it a standard component in storage systems, databases, networking stacks, and container runtimes. The library consists of `lib/lz4.c` (core block codec), `lib/lz4hc.c` (high-compression mode), `lib/lz4frame.c` (framing for streaming), and a bundled snapshot of xxHash (`lib/xxhash.c`) used for content integrity in frames. There are no JIT backends, no garbage collector, and no floating-point paths. The performance-critical code is pure integer operations with a handful of architecture-guarded `#ifdef` blocks.

**Governance:** LZ4 is a sole-maintainer project. Yann Collet (GitHub: Cyan4973) holds all merge rights and makes all final decisions. The SECURITY.md explicitly states the project is "maintained by a single maintainer on a reasonable-effort basis." There is no foundation affiliation, no TSC, no MAINTAINERS file, and no documented succession plan. License: BSD 2-Clause.

**Corporate affiliation:** Yann Collet lists `@facebook` on his GitHub profile and works from Menlo Park, CA. He is also the author of Zstandard (`zstd`), Meta's primary production compression library. LZ4 predates his Meta tenure and is maintained by him personally, not as an official Meta project. The repo's CircleCI configuration references a Docker image named `fbopensource/lz4-circleci-primary`, indicating some Meta/FB infrastructure support [NEEDS VERIFICATION that Meta formally sponsors the project]. There is no sponsor tier program and no foundation dues.

**Community culture on new ports:** The maintainer has accepted correctness and portability fixes with minimal friction (PR [#1298](https://github.com/lz4/lz4/pull/1298) merged same day it was approved). For optimization PRs, he demands single-change commits with reproducible benchmarks. He explicitly flagged PR [#1678](https://github.com/lz4/lz4/pull/1678) as containing explanations "like an LLM generated text" and requested the author break changes apart and justify each individually. The author subsequently retracted three of four proposed changes after self-review. The merged Zicclsm fix (PR [#1648](https://github.com/lz4/lz4/pull/1648)) shows the formula that works: one focused change, a clear and verifiable hardware precondition, a polite follow-up ping, and a fast approval cycle.

LZ4 is not a RISE project member. No RISE blog posts or RISE wheel builder entries reference LZ4.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Oct 19, 2023 | PR [#1299](https://github.com/lz4/lz4/pull/1299) merged: RISC-V added to QEMU CI matrix (`qemu-riscv64-static`). First RISC-V entry in the repository. | PR #1299, commit `8de247b` by Cyan4973 |
| Oct 23, 2023 | PR [#1298](https://github.com/lz4/lz4/pull/1298) merged: `__riscv`/`__riscv_xlen` preprocessor detection added to `programs/platform.h` for `__64BIT__` and related flags. Author: Hamlin-Li (no affiliation listed). | PR #1298 |
| Jul 22, 2024 | v1.10.0 released. PRs #1298 and #1299 included. First released version with any riscv64 code. | [GitHub releases](https://github.com/lz4/lz4/releases) |
| Aug 27, 2025 | PR [#1639](https://github.com/lz4/lz4/pull/1639) opened: Makefile flag for `UNALIGNED_ACCESS_SUPPORTED` on RISC-V, reporting ~30% compression improvement on Sophgo Mango hardware. Maintainer requested revisions; author closed it and resubmitted. | PR #1639 |
| Aug 28, 2025 | PR [#1648](https://github.com/lz4/lz4/pull/1648) opened: `LZ4_FORCE_MEMORY_ACCESS=2` when `__riscv && __riscv_zicclsm` is present. Author: Polaris-911. | PR #1648 |
| Sep 11, 2025 | PR [#1648](https://github.com/lz4/lz4/pull/1648) merged by Cyan4973 (commit `7d33531`). +34% compression on Sophgo SG2044 (160 MB/s to 215 MB/s). Only RISC-V performance path in mainline as of this report. | PR #1648 |
| Dec 1, 2025 | PR [#1678](https://github.com/lz4/lz4/pull/1678) opened: Enable `LZ4_FAST_DEC_LOOP` for riscv64 (plus originally three other changes, all later retracted). Author: Dayuxiaoshui / co-author gong-flying (ISCAS). | PR #1678 |
| Dec 11, 2025 | PR [#1686](https://github.com/lz4/lz4/pull/1686) opened: `LZ4_FAST_DEC_LOOP` + RVV `LZ4_wildCopy32`. Author: yunfeizhou2025. | PR #1686 |
| Apr 11, 2026 | PR [#1734](https://github.com/lz4/lz4/pull/1734) opened: RVV vectorization of xxHash XXH64 (3.04x speedup). Author: cgyygc / gong-flying (ISCAS). | PR #1734 |
| Apr 27, 2026 | PR [#1738](https://github.com/lz4/lz4/pull/1738) opened: RVV vectorization of `LZ4_count` (+26% compression). Author: cgyygc (ISCAS). | PR #1738 |
| Apr 30, 2026 | PR [#1739](https://github.com/lz4/lz4/pull/1739) opened: Enable `LZ4_FAST_DEC_LOOP` for riscv64 (independent resubmission of the same intent as #1678 and #1686). Author: Polaris-911. A downstream Linux distribution (openRuyi) has already adopted this patch independently. | PR #1739 |
| Jun 9, 2026 | PR [#1759](https://github.com/lz4/lz4/pull/1759) opened and closed same day by the same author as #1739 (Polaris-911). Duplicate/retry, abandoned without review. | PR #1759 |

**Key contributors to RISC-V work:**
- Polaris-911: PRs #1648 (merged), #1639 (closed), #1739 (open). No employer affiliation listed.
- Dayuxiaoshui: Issue #1633 (open proposal), PR #1678 (open). Co-author gong-flying affiliated with ISCAS (Institute of Software, Chinese Academy of Sciences).
- cgyygc: PRs #1734, #1738 (both open). Affiliated with ISCAS.
- yunfeizhou2025: PR #1686 (open). No employer affiliation listed.

**Fully upstream?** The baseline build and CI are fully upstream and shipped in v1.10.0. The Zicclsm unaligned-access fix (PR #1648) is merged but unreleased (no release after v1.10.0 as of this report date). All performance optimizations remain open and unmerged.

---

## 3. Upstream Support Tier

LZ4 has no published platform tier policy. The CI structure implies an implicit tier ordering.

**Inferred tiers from `.github/workflows/cross-platform.yml`:**

- Tier 1 (native runner, Linux x86_64): amd64 -- compilers workflow runs GCC 11, GCC 14, Clang 14, Clang 18 on native host.
- Tier 2 (QEMU cross, same `qemu-platforms` job but distinct step): ARM32, ARM64, PPC, S390X -- grouped together in the primary cross-platform step without additional conditions.
- Tier 3 (QEMU cross, conditional step): MIPS, M68K, RISC-V, SPARC -- grouped together under `contains(fromJSON('["MIPS", "M68K", "RISC-V", "SPARC"]'), matrix.arch)`.

RISC-V is in Tier 3 by this implicit classification.

**Evidence:**
- riscv64 is in the CI matrix: confirmed from raw file content of `.github/workflows/cross-platform.yml`.
- No release-blocking status documented for RISC-V.
- No official prebuilt riscv64 binary: upstream ships only Windows binaries (win32, win64) and source tarballs.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Native runner | QEMU (ubuntu-latest) | QEMU (ubuntu-latest) |
| CI grouping | Primary | Primary cross-platform | Secondary (MIPS/M68K/RISC-V/SPARC group) |
| Release blocking | Yes (implied) | Likely [NEEDS VERIFICATION] | No documented requirement |
| Prebuilt binaries | Windows only (no Linux prebuilt for any arch) | None | None |
| Fast-path code | `LZ4_FAST_DEC_LOOP` enabled, `wildCopy64` | `LZ4_FAST_DEC_LOOP` enabled, `wildCopy64` | Neither |
| Unaligned access | Method 1 (packed struct, always) | Method 1 | Method 2 (direct cast, Zicclsm only) or packed struct |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LZ4 has four performance-critical internal components where architecture matters:

**`LZ4_FAST_DEC_LOOP`**
The main decompression fast path. Enabled via `#if defined(__i386__) || defined(_M_IX86) || defined(__x86_64__) || defined(_M_X64) || defined(__aarch64__)`. RISC-V is excluded. The loop uses overlapping memory copies and assumes the out-of-order execution of x86 and AArch64 to hide latency. Three independent PRs (#1678, #1686, #1739) propose enabling it for riscv64. PR #1686 shows that on in-order RISC-V cores (XuanTie C908), the loop alone causes a -2.9% regression; RVV acceleration is required to make it net-positive. On out-of-order RISC-V cores (C920), the loop gives +2.8% alone.

**`LZ4_wildCopy8` / `LZ4_wildCopy32` / `LZ4_wildCopy64`**
Bulk unaligned copy routines used in decompression. `wildCopy64` is `#ifdef __aarch64__` only (64-byte copy loop). RISC-V uses the generic `wildCopy8` path (8-byte-at-a-time). PR #1686 proposes an RVV `wildCopy32` using `vle8`/`vse8` intrinsics, which shows +12.7% decompression on C920 and converts the C908 regression into a +10.5% gain when combined with `FAST_DEC_LOOP`.

**`LZ4_count`**
Match-length counter used in the compression hot path. Scalar 8-byte-at-a-time on RISC-V. PR #1738 proposes replacing this with RVV intrinsics (`vle8`, `vmsne`, `vfirst`), reporting +26.3% compression throughput and -13.2% frametest runtime. GCC 15.1.0 is noted as non-working with the build [NEEDS VERIFICATION on GCC version constraint].

**xxHash (bundled copy, v0.6.5)**
Used in `lz4frame` for content verification. The bundled version is an old snapshot that predates the standalone xxHash project's merged RVV support (RVV PRs #1043, #1069, #1070 merged June-September 2025 in the standalone repo). PR #1734 proposes RVV vectorization for the bundled LZ4 copy, reporting XXH64 at 3.04x speedup (1,431 MB/s to 4,352 MB/s on SG2044). No maintainer review.

**`LZ4_FORCE_MEMORY_ACCESS`**
Unaligned read strategy selector. Three methods: 0 (portable union), 1 (packed struct/GCC hint), 2 (direct pointer cast). Method 2 requires hardware that tolerates misaligned loads without a trap. PR #1648 (merged Sep 2025) auto-selects Method 2 when `__riscv && __riscv_zicclsm` is detected at compile time. Zicclsm is mandatory in the RVA20U64 profile, so all conformant server-class RISC-V chips benefit automatically when compiled with GCC 14.1+. Non-Zicclsm cores fall back to Method 1 (correct, but slower by ~34% on SG2044).

| Component | amd64 | arm64 | riscv64 (merged) | riscv64 (open PRs) |
|---|---|---|---|---|
| `LZ4_FAST_DEC_LOOP` | Enabled | Enabled | Disabled | #1678, #1686, #1739 (all open) |
| `LZ4_wildCopy64` | Absent | Hand-coded | Absent | Not proposed |
| `LZ4_wildCopy32` (RVV) | Absent | Absent | Absent | #1686 (open) |
| `LZ4_count` (RVV) | Absent | Absent | Absent | #1738 (open) |
| xxHash RVV | Absent | Absent | Absent | #1734 (open) |
| Unaligned access | Method 1 | Method 1 | Method 1 or 2 (Zicclsm) | -- |
| SIMD intrinsics in tree | None | None | None | None merged |
| Assembly files | None | None | None | None proposed |
| ISA extensions used | None explicit | None explicit | Zicclsm (scalar opt) | Zicclsm, RVV 1.0 |

No JIT backend, no crypto acceleration, no GC barriers, no floating-point paths exist anywhere in lz4.

---

## 5. Build System, Cross-Compilation, and Toolchain

LZ4 provides three build systems: a root `Makefile` (primary), `build/cmake/CMakeLists.txt` (optional), and Meson support. The CMake file has zero RISC-V references and no architecture conditionals. No Dockerfiles exist anywhere in the repository. No cmake toolchain files for any architecture are provided.

**Cross-compilation recipe (derived from CI):**

```
sudo apt-get install gcc-multilib qemu-utils qemu-user-static \
    qemu-system-riscv64 gcc-riscv64-linux-gnu

git clone https://github.com/lz4/lz4
cd lz4
make platformTest V=1 CC=riscv64-linux-gnu-gcc QEMU_SYS=qemu-riscv64-static
```

The `platformTest` target:
1. Builds `lib/` with `-O3 -Werror`
2. Builds `programs/` with `-O3 -Werror -static`
3. Builds `tests/` with `-O3 -Werror -static`
4. Runs `make test-platform` which executes four data pipelines under `qemu-riscv64-static`: 16 KB at `-9`, default size, 256 MB with `-vqB4D`, 3 GB with `-vqB5D`

The 3 GB test is NOT skipped for RISC-V (it is skipped only for `qemu-arm-static`). This is the same test suite that covers MIPS, M68K, and SPARC.

**No special `CFLAGS` are set for RISC-V in CI.** `makevar` is empty for RISC-V (compare: PPC64LE requires `CFLAGS=-m64`, M68K requires `HAVE_MULTITHREAD=0`).

**Minimum toolchain versions:** No explicit minimum is documented anywhere in the repository for RISC-V or any architecture. The Zicclsm preprocessor macro (`__riscv_zicclsm`) requires GCC 14.1+ to be defined automatically. On older compilers, the Zicclsm optimization is silently skipped (no error). The RVV intrinsic PRs reference GCC >=13 or Clang >=16 for typed RVV intrinsics; GCC 15.1.0 is noted as non-working with the `LZ4_count` RVV patch (#1738) [NEEDS VERIFICATION].

**QEMU:** `qemu-riscv64-static` (user-mode static) is sufficient. The `qemu-system-riscv64` package is listed in the CI apt dependencies but is not used for test execution.

**Known build issues:** None documented in mainline. No open issues on riscv64 build failures found in the research.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

LZ4 is functionally complete on riscv64: it builds, passes the full test suite under QEMU, and is available via major Linux distributions. There are no functional gaps -- every feature available on amd64 and arm64 is available on riscv64.

The gaps are entirely performance gaps caused by missing architecture-tuned code paths.

**Performance gaps (quantified from open PRs):**

| Missing feature | Expected gain | Evidence | Status |
|---|---|---|---|
| `LZ4_FAST_DEC_LOOP` (out-of-order cores) | +15% decompression, +6% compression | PR #1678 (SG2044, GCC 12.3) | Open, no review |
| `LZ4_FAST_DEC_LOOP` (SpacemiT K1-X) | +1% decompression | PR #1739 (GCC 13.2, silesia.tar) | Open, no review |
| `LZ4_FAST_DEC_LOOP` (XuanTie C920, OoO) | +2.8% decompression | PR #1686 (A210 board) | Open, no review |
| `LZ4_FAST_DEC_LOOP` + RVV wildCopy32 (C920, OoO) | +12.7% decompression | PR #1686 | Open, no review |
| `LZ4_FAST_DEC_LOOP` + RVV wildCopy32 (C908, in-order) | +10.5% decompression | PR #1686 | Open, no review |
| RVV `LZ4_count` | +26.3% compression | PR #1738 (openEuler, Clang 17) | Open, no review |
| RVV xxHash XXH64 | 3.04x speedup (1,431 to 4,352 MB/s) | PR #1734 (SG2044, Clang 17) | Open, no review |
| Zicclsm unaligned access (unreleased) | +34% compression | PR #1648 (SG2044, merged Sep 2025) | Merged, unreleased |

Note on the `FAST_DEC_LOOP` speedup variability: the 15% figure (PR #1678) was measured on SG2044 with realistic lz4 benchmark data after the original 4.7-4.8x claim (measured on ~254:1 compressible synthetic data) was retracted following maintainer challenge. The 1% figure (PR #1739) was measured on SpacemiT K1-X using silesia.tar via lzbench. Both are credible; the difference reflects different hardware and datasets.

**Contradictory data point:** PR #1678 originally claimed 4.81x decompression speedup (1,215 MB/s to 5,841 MB/s) on SG2044 with GCC 12.3 `-march=rv64gcv -O3`. The maintainer challenged this as unrealistic. The author subsequently retracted the RVV portions and reported +15% with the `FAST_DEC_LOOP` change alone. The original headline numbers were measured on highly compressible synthetic test data (~254:1 ratio) and are not representative of typical workloads. The revised +15% figure is on realistic data and is consistent with the expected benefit of the loop.

**Security hardening:** No security hardening features exist in lz4 for any architecture (no stack canaries, no CFI, no ASLR hooks). No gap on riscv64.

**NaN/floating-point semantics:** Not applicable. LZ4 is an integer-only algorithm.

---

## 7. CI/CD Infrastructure

RISC-V CI exists in the repository via `.github/workflows/cross-platform.yml`. This is the only CI system in the repository (no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` found).

**Exact configuration:**
- Trigger: `on: push` and `on: pull_request` (all branches, no filter)
- Runner: `ubuntu-latest` (GitHub-hosted x86_64)
- Cross-compiler: `riscv64-linux-gnu-gcc` (installed via apt)
- Emulator: `qemu-riscv64-static` (user-mode static QEMU)
- Test target: `make platformTest V=1 CC=riscv64-linux-gnu-gcc QEMU_SYS=qemu-riscv64-static`
- No RVV extension flags (`makevar` is empty)
- No native riscv64 runner
- No RISE CI infrastructure

**What the CI does and does not test:**
- Tests: correctness of compression/decompression at multiple data sizes (16 KB, default, 256 MB, 3 GB)
- Does not test: performance, RVV code paths, Zicclsm behavior (the merged #1648 optimization requires GCC 14.1+ and hardware with Zicclsm; the CI cross-compiler version and QEMU version are unspecified and may not satisfy either condition [NEEDS VERIFICATION])

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes (QEMU) | Yes (QEMU) |
| Runner type | Native (ubuntu-latest) | Cross-compile + QEMU | Cross-compile + QEMU |
| CI grouping | Primary | Primary cross-platform | Secondary (MIPS/M68K/RISC-V/SPARC) |
| Trigger | push + PR | push + PR | push + PR |
| RISE runners | No | No | No |
| Hardware-in-loop | No | No | No |
| Vector extension testing | N/A | N/A | No |
| Compiler version pinned | No | No | No |

---

## 8. Distribution and Release Status

**Latest upstream release:** v1.10.0 (July 22, 2024). Assets: `lz4-1.10.0.tar.gz` (source), `lz4-1.10.0.tar.gz.sha256`, `lz4_win32_v1_10_0.zip`, `lz4_win64_v1_10_0.zip`. No Linux prebuilt binaries for any architecture. No riscv64 binary asset.

**PR #1648 (Zicclsm optimization, merged Sep 2025) is not yet released.** No release has been made since v1.10.0.

**Linux distribution packages:**

| Distribution | Package | riscv64 available | Version |
|---|---|---|---|
| Debian sid | `liblz4-1`, `liblz4-dev`, `lz4` | Yes | 1.10.0-10 |
| Ubuntu 24.04 Noble | `lz4`, `liblz4-1`, `liblz4-dev` | Yes | 1.9.4-1build1 |
| Arch Linux RISC-V (community port) | `lz4` | Unconfirmed (site not scraped) | Unknown |

**Python (PyPI):** The `lz4` Python package (version 4.4.5) provides manylinux wheels for amd64, aarch64, and i686, plus macOS and Windows. No riscv64 wheel is published. Users on riscv64 must install from the source distribution (`lz4-4.4.5.tar.gz`), which requires a local C compiler and lz4 headers. The RISE wheel builder does not host a separate lz4 wheel and redirects to PyPI.

**What a user must do to get a working riscv64 binary:**
- Via apt on Debian/Ubuntu: `apt install liblz4-1` -- works out of the box, no source build required.
- Via pip: `pip install lz4` triggers a source build; requires `gcc` and development headers installed.
- Native application embedding lz4: build from source at v1.10.0 or the `dev` branch.

---

## 9. Dependencies

LZ4 has no external runtime dependencies beyond the C standard library. The build system optionally uses CMake or Meson but both are build-time only. There is one vendored dependency.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| xxHash (vendored, v0.6.5 snapshot) | Content checksum in lz4frame | Builds (generic C) | Covered by QEMU CI | Not applicable (bundled) | Bundled copy predates standalone xxHash's merged RVV support (Jun-Sep 2025); PR #1734 proposes RVV for bundled copy, unreviewed |
| glibc (runtime) | `memcpy`, `memmove`, standard C | Yes | Tested via QEMU CI | Ships in all major distros | No blocking issues; mature riscv64 support |
| CMake (build, optional) | Alternative build system | Works | Cross-build not tested in CI for riscv64 | Build-time only | No riscv64-specific CMake flags needed |

**xxHash lag detail:** The standalone xxHash project merged RVV acceleration for XXH64 in 2025 (PRs #1043, #1069, #1070 in the standalone repo). LZ4's vendored copy is v0.6.5 and has not been updated to incorporate those changes. LZ4 PR #1734 proposes adding RVV to the vendored copy independently, but it has received no maintainer review since April 2026.

No dependencies with JIT backends, cryptographic implementations, or non-trivial numerics exist in the lz4 dependency tree.

---

## 11. Known Bugs and Active Issues

No open correctness bugs or riscv64-specific failure reports were found in the lz4/lz4 issue tracker.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1633](https://github.com/lz4/lz4/issues/1633) | Proposal for RVV Optimization of the LZ4 Algorithm | Open | Enhancement | RFC/proposal; no concrete patch, no maintainer response, no numeric data |
| [#1678](https://github.com/lz4/lz4/pull/1678) | Enable `LZ4_FAST_DEC_LOOP` for RISC-V 64-bit | Open PR | Performance | Simplified to single change after maintainer's LLM accusation; +15% decompression; awaiting review |
| [#1686](https://github.com/lz4/lz4/pull/1686) | `LZ4_FAST_DEC_LOOP` + RVV `LZ4_wildCopy32` | Open PR | Performance | Most technically rigorous of three FAST_DEC_LOOP PRs; shows in-order regression without RVV; no review |
| [#1734](https://github.com/lz4/lz4/pull/1734) | RVV vectorization for xxHash (XXH64: 3.04x) | Open PR | Performance | Inconsistent benchmark numbers between PR body and commit message; no review |
| [#1738](https://github.com/lz4/lz4/pull/1738) | RVV vectorization for `LZ4_count` | Open PR | Performance | GCC 15.1.0 noted as non-working with the build; no review |
| [#1739](https://github.com/lz4/lz4/pull/1739) | Enable `LZ4_FAST_DEC_LOOP` for RISC-V (independent resubmission) | Open PR | Performance | Third independent PR for the same change; downstream openRuyi has already adopted it; no review |

**No correctness bugs** affecting riscv64 were found.

**Data quality issue in PR #1734:** Benchmark numbers are inconsistent between the PR description (XXH64: 1,431 to 4,352 MB/s on 10 MB data) and the commit message (scalar ~3,500 MB/s to RVV ~10,600 MB/s on 64 KB data). Both claims are from the same author. The discrepancy is unexplained and unresolved.

---

## 12. Objections and Upstream Blockers

**Single-maintainer bottleneck.** Cyan4973 is the sole reviewer and merger. Five RISC-V optimization PRs (#1678, #1686, #1734, #1738, #1739) have been open for 4 to 7 months with no maintainer response after initial or absence of review. This is not unique to RISC-V -- the project moves slowly on all contributions -- but RISC-V contributions have no alternative reviewer path.

**LLM-quality suspicion.** Cyan4973 explicitly accused PR #1678 of containing LLM-generated explanations. That PR's original claims were largely retracted by the author on self-review, which partly validates the concern. The subsequent wave of optimization PRs from ISCAS-affiliated contributors (#1734, #1738) may face similar skepticism even if technically sound, because the pattern of overclaiming followed by correction has already occurred once. This is a reputational problem that contributors must address proactively with clean, single-change PRs and verifiable methodology.

**Overlapping PRs.** Three independent PRs (#1678, #1686, #1739) all enable `LZ4_FAST_DEC_LOOP` for riscv64 without consolidating. The maintainer would need to choose one or request consolidation, adding another coordination step. PR #1686 is technically the strongest (it provides the in-order regression data that justifies gating the loop on `__riscv_vector`), but it also adds the most code.

**No stated objection to RISC-V as a platform.** Cyan4973 merged the basic riscv64 detection PR (#1298) same day it was approved, commented it was "harmless and potentially useful," and merged the Zicclsm fix (#1648) within two weeks of it being ready. The blocker is bandwidth and quality bar, not hostility to the architecture.

**Acceptance probability for pending PRs:**
- PR #1648-style (single focused correctness/portability fix with clear hardware precondition): high, based on precedent.
- PR #1686 (FAST_DEC_LOOP + RVV, multi-component but well-motivated): moderate, if presented cleanly and pinged appropriately.
- PRs #1734, #1738 (RVV intrinsics with inconsistent or uncertain benchmark data): low without stronger benchmark methodology and a second pass by the author.

---

## 13. Investment Analysis

RISE has no documented involvement in LZ4. All work described below is unsponsored as of this report date.

### 13.1 Functional Enablement

No functional gaps exist. lz4 builds and passes all tests on riscv64 today. No investment required for functional enablement.

### 13.2 Performance Optimization

Four optimization PRs are open and unreviewed. The highest-value path is landing `LZ4_FAST_DEC_LOOP` with appropriate RVV gating (PR #1686 approach), which provides +10 to +15% decompression on realistic data across both in-order and out-of-order cores. The RVV `LZ4_count` optimization (PR #1738) provides +26% compression throughput and is high-value for compression-heavy workloads.

Work items:
1. Consolidate the three `LZ4_FAST_DEC_LOOP` PRs into one clean submission based on #1686's in-order analysis, with silesia.tar benchmarks on multiple cores.
2. Fix the GCC 15.1.0 incompatibility in PR #1738 and resolve benchmark inconsistency in PR #1734.
3. Engage Cyan4973 with one PR at a time, following the #1648 engagement pattern (one change, clear precondition, polite follow-up after two weeks).

The RVV xxHash optimization (PR #1734) also requires updating the vendored xxHash snapshot to bring it in line with the standalone xxHash RVV work already merged upstream -- this is a prerequisite to avoid carrying lz4-specific divergence indefinitely.

### 13.3 CI/CD Infrastructure

Current QEMU CI is adequate for correctness testing. Gaps are: no RVV extension testing, no hardware-in-loop, no native runner. Adding RISE CI runners (if available) would enable native performance regression tracking and RVV correctness testing, which would help the upstream maintainer validate the open PRs.

### 13.4 Ecosystem Enablement

The Python `lz4` wheel on PyPI has no riscv64 wheel. Users must build from source, which requires gcc and development headers. Publishing a manylinux riscv64 wheel would eliminate the source-build requirement for Python users on riscv64. This is a packaging task independent of upstream C code changes.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Consolidate `LZ4_FAST_DEC_LOOP` PRs (#1678, #1686, #1739) into one clean submission with multi-core benchmarks; drive to merge | 1 | Contributor / RISE | High |
| Performance | Fix GCC 15.1.0 build failure in PR #1738 (RVV `LZ4_count`); add reproducible benchmark methodology; drive to merge | 1 | Contributor / RISE | High |
| Performance | Resolve inconsistent benchmark numbers in PR #1734 (RVV xxHash); update vendored xxHash to include upstream RVV changes; drive to merge | 2 | Contributor / RISE | Medium |
| CI/CD | Add native riscv64 runner (RISE infrastructure) with RVV-capable QEMU or hardware; add RVV extension flags to CI matrix | 1 | RISE | Medium |
| Packaging | Publish manylinux riscv64 wheel for python-lz4 on PyPI | 1 | Packager / RISE | Low |
| Release | Trigger upstream v1.10.1 or v1.11.0 release to ship the merged Zicclsm optimization (PR #1648) | 0.5 | Upstream (Cyan4973) | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [lz4/lz4 repository](https://github.com/lz4/lz4)
- [LZ4 homepage](https://lz4.github.io/lz4/)
- [PR #1298: Enable basic support for riscv64](https://github.com/lz4/lz4/pull/1298)
- [PR #1299: Add QEMU CI targets (MIPS, M68K, RISC-V)](https://github.com/lz4/lz4/pull/1299)
- [PR #1639: Makefile UNALIGNED_ACCESS_SUPPORTED for RISC-V (closed)](https://github.com/lz4/lz4/pull/1639)
- [PR #1648: Enable LZ4_FORCE_MEMORY_ACCESS=2 for RISC-V Zicclsm (merged Sep 2025)](https://github.com/lz4/lz4/pull/1648)
- [PR #1678: 64-bit RISC-V optimizations (LZ4_FAST_DEC_LOOP, open)](https://github.com/lz4/lz4/pull/1678)
- [PR #1686: LZ4_FAST_DEC_LOOP + RVV LZ4_wildCopy32 (open)](https://github.com/lz4/lz4/pull/1686)
- [PR #1734: RVV vectorization for xxHash XXH64 (open)](https://github.com/lz4/lz4/pull/1734)
- [PR #1738: RVV vectorization for LZ4_count (open)](https://github.com/lz4/lz4/pull/1738)
- [PR #1739: Enable LZ4_FAST_DEC_LOOP for RISC-V (open)](https://github.com/lz4/lz4/pull/1739)
- [PR #1759: Enable LZ4_FAST_DEC_LOOP for RISC-V (duplicate, closed)](https://github.com/lz4/lz4/pull/1759)
- [Issue #1633: Proposal for RVV Optimization of the LZ4 Algorithm](https://github.com/lz4/lz4/issues/1633)
- [GitHub releases: lz4 v1.10.0](https://github.com/lz4/lz4/releases/tag/v1.10.0)
- [PyPI lz4 4.4.5](https://pypi.org/project/lz4/4.4.5/)
- [Debian tracker: lz4](https://tracker.debian.org/pkg/lz4)
- [Ubuntu 24.04 Noble: lz4 package](https://packages.ubuntu.com/noble/lz4)
- [RISE Project member list](https://riseproject.dev/)
- [RISE wheel builder (redirects to PyPI for lz4)](https://riseproject.gitlab.io/python/wheel_builder/)