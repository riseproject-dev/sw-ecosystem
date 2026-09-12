---
title: StarRocks
parent: Project Reports
color: orange
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: glog
    relation: runtime-dependency
    criticality: critical
  - name: gperftools
    relation: runtime-dependency
    criticality: critical
  - name: Boost
    relation: runtime-dependency
    criticality: critical
  - name: Apache Arrow
    relation: runtime-dependency
    criticality: critical
  - name: jemalloc
    relation: runtime-dependency
    criticality: critical
  - name: RocksDB
    relation: runtime-dependency
    criticality: critical
  - name: brpc
    relation: runtime-dependency
    criticality: critical
  - name: Kerberos
    relation: runtime-dependency
    criticality: optional
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: optional
  - name: MariaDB Connector/C
    relation: runtime-dependency
    criticality: optional
  - name: hyperscan
    relation: runtime-dependency
    criticality: optional
  - name: croaringbitmap
    relation: runtime-dependency
    criticality: optional
  - name: bitshuffle
    relation: runtime-dependency
    criticality: optional
  - name: libserdes
    relation: runtime-dependency
    criticality: optional
  - name: pprof
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="starrocks" %}

# StarRocks

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for StarRocks<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

StarRocks is a C++ MPP (massively parallel processing) OLAP database engine used for real-time analytics, built from a Frontend (FE, Java, handles SQL parsing/planning/metadata) and a Backend (BE, C++, handles storage and vectorized query execution). It is developed under the **StarRocks Project, a Series of LF Projects, LLC** (Linux Foundation umbrella, not the Apache Software Foundation), with a Technical Charter adopted 2023-02-14 (`community/Technical_Charter.md` in the repository). License is Apache 2.0 with mandatory DCO sign-off; documentation is CC-BY-4.0.

Governance runs through a Technical Steering Committee (TSC). Voting TSC members are **Maintainers**: chaoyli, Dshadowzh, imay, kangkaisen, trueeyu. **Committers** (non-voting TSC members, roughly 24 individuals) sit below that. Promotion (Contributor -> Active Contributor -> Committer -> Maintainer) requires 2+ TSC votes (`community/membership.md`, `community/TSC_members.md`). GitHub handles are listed with no employer field, so individual maintainer-to-company mapping is not verifiable from the repo.

**CelerData** is the clear primary commercial sponsor - the README's case studies and demo video are hosted on CelerData's channels, and CelerData is the company founded by StarRocks' original creators, offering the commercial/cloud distribution. Named enterprise adopters (Microsoft, Tencent, Pinterest, Shopee, Trip.com, SHEIN, MiHoYo, Fanatics, DiDi, per starrocks.io) are users/case studies, not governance participants.

**No formal platform-tier policy exists.** There is no `PLATFORMS.md`/`SUPPORT.md` and no "Tier 1/2/3" language anywhere in the repo. Supported platforms are established de facto by what the build system gates on. `CONTRIBUTING.md`'s "Important contacts" and "Best practices" sections are literally marked "TBC" (to be completed), underscoring how informal the contribution/review process still is. New-architecture work (including the riscv64 port) is evaluated purely through the standard 2-approving-vote code review process, with no charter language specific to porting.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-04-24 | [Issue #58359](https://github.com/StarRocks/starrocks/issues/58359) opened: "Compilation Failure on RISC-V RV64 Architecture with Custom Dependencies" - `build.sh` fails on riscv64, no thirdparty rv64 support | [Issue #58359](https://github.com/StarRocks/starrocks/issues/58359) |
| 2025-04-25 | Issue #58359 closed ("completed") with no linked PR and no comment thread recoverable; almost certainly closed as stale, since no riscv64 support existed in-repo for another 16+ months | [Issue #58359](https://github.com/StarRocks/starrocks/issues/58359) |
| 2026-08-27 | [Issue #78252](https://github.com/StarRocks/starrocks/issues/78252) opened by jiaoxiaoqiang2: "Support for RISC-V architecture" - master tracking/feature-request issue, citing thirdparty build incompatibility, GCC 15/C23 issues, no prebuilt starcache/tenann binaries | [Issue #78252](https://github.com/StarRocks/starrocks/issues/78252) |
| 2026-09-03 | [PR #78634](https://github.com/StarRocks/starrocks/pull/78634) opened by jiaoxiaoqiang2, branch `zte-riscv:riscv-support`, "Fixes #78252" - 29 files, +2001/-23 | [PR #78634](https://github.com/StarRocks/starrocks/pull/78634) |
| 2026-09-10 | PR #78634 last updated; author has addressed all automated Copilot/Codex review findings (int128 overflow detection, signal-handler signature UB, unpinned hyperscan/vectorscan dependency) | [PR #78634](https://github.com/StarRocks/starrocks/pull/78634) |
| 2026-09-11 (today) | PR #78634 confirmed still **open, unmerged**, awaiting 2 required approvals from reviewers alvin-phoenix-ai and kevincai; live `refs/pull/78634/merge` ref confirms open/unmerged status | [PR #78634](https://github.com/StarRocks/starrocks/pull/78634) |

**Key contributors and organizations:** The sole author of both the tracking issue and the implementation PR is **jiaoxiaoqiang2**. The PR's source branch namespace, `zte-riscv:riscv-support`, indicates the work is contributed via/for **ZTE Corporation**, a RISE Project General Member. The reporter of the original 2026-08-27 issue described testing on a **SpacemiT K3** dev board and RISC-V QEMU; SpacemiT is also a RISE Project General Member. No maintainer (per the TSC roster in Section 1) has authored or co-authored any riscv64 commit or comment found in this research.

**Is it fully upstream?** No. Zero riscv64 code exists on the `main` branch or any release branch today. The entire riscv64 effort is a single open, unmerged pull request.

## 3. Upstream Support Tier

No formal tier policy document exists (see Section 1). Supported architectures are defined entirely by build-system gating and documentation. The official build docs state explicitly: "StarRocks supports compilation on both x86_64 and AArch64 architectures" (`docs/en/developers/build-starrocks/build_starrocks_on_ubuntu.md`) - RISC-V is not mentioned as a target anywhere in project documentation.

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI tests | Yes | Yes | No |
| Upstream binary release | Distributed via StarRocks' own CDN / Docker Hub (not GitHub Releases) [NEEDS VERIFICATION - exact channel not directly fetched, but GitHub Releases confirmed to carry only auto-generated source archives] | Same as amd64 | None |
| Official documentation | Supported | Supported | Not mentioned |
| Thirdparty vendor build | `thirdparty/vars-x86_64.sh` (+ ubuntu22 variant) | `thirdparty/vars-aarch64.sh` (+ ubuntu22 variant) | Does not exist upstream; `thirdparty/vars.sh` hard-exits with "vars-riscv64.sh is missing." if invoked on riscv64 |
| Toolchain container | `docker/dockerfiles/toolchains/toolchains-centos7.Dockerfile` (self-built GCC 10.3.0 -> 14.3.0) | Same toolchain container, arm64-gated | No riscv64 toolchain container exists |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Findings below are drawn from the actual diff of the unmerged [PR #78634](https://github.com/StarRocks/starrocks/pull/78634) (fetched via `git fetch origin pull/78634/head`, since the branch is not indexed by GitHub code search while open). Architecture-guard file counts in `be/src` post-PR: `__x86_64__` appears in 40 files, `__aarch64__` in 41 files, `__riscv` in only **4 files**.

| Component | amd64 | arm64 | riscv64 (per unmerged PR #78634) |
|---|---|---|---|
| Hash-join/agg CRC32C (`crc_hash_32/64`) | SSE4.2 `__crc32c*` intrinsic | Hardware CRC32 intrinsic (assumed, not independently verified this session) | **Full for this op**: new hand-written slice-by-8 software CRC32C in `be/src/base/hash/hash.h`, verified bit-identical to the Castagnoli-polynomial hardware version; ~80 new lines, no stub markers |
| `crc_hash_uint64/128` | Hardware intrinsic | Hardware intrinsic (assumed) | Wired to the same software CRC32C fallback (`be/src/column/column_hash.h`); complete for this op |
| 128-bit decimal arithmetic | Hand-written x86 inline asm (`int128_arithmetics_x86_64.h`) | Falls back to portable path (pre-existing) | New portable C++ implementation, `be/src/types/int128_arithmetics_common.h` (304 lines); author reports verification against the x86 asm reference across 3M random test cases in PR review |
| Cycle counter | RDTSC-based | Platform counter (assumed) | Hand-tuned inline `rdtime` assembly, `be/src/gutil/cycleclock-inl.h` - full |
| Cache line size constant | 64 | 64 (assumed) | `#define CACHELINE_SIZE 64` - trivial, fine |
| SIMD bit-packing, popcount, filter/expand/gather | AVX2-tuned | NEON-tuned | **No riscv64 branch added.** Falls through a pre-existing generic/"neither AVX2 nor NEON" scalar fallback never validated by this PR for riscv64 |
| Storage checksums (`crc32c.cpp`), bitshuffle, persistent index, primary key encoder, phmap | Arch-tuned | Arch-tuned | Same as above - inherited scalar fallback, unauthored/unverified for riscv64 by this PR |
| CPU feature detection (`gutil/cpu.h`) | `ARCH_CPU_X86_FAMILY` defined | `ARCH_CPU_ARM_FAMILY` defined | **Missing** - no `ARCH_CPU_RISCV*` branch; informational gap, not a build blocker |
| LLVM JIT (expression compilation, `STARROCKS_JIT_ENABLE`) | Enabled | Enabled | Gated on in `be/CMakeLists.txt`/`FindLLVM.cmake` per the PR, but not independently confirmed functionally exercised on riscv64 [NEEDS VERIFICATION] |
| starcache (data cache library) | Enabled, prebuilt binary | Enabled, prebuilt binary | **Explicitly disabled** - no riscv64 prebuilt exists upstream |
| tenann (vector index) | Enabled | Enabled | **Explicitly disabled** in the PR |
| pprof (Go diagnostic tool) | Enabled | Enabled | **Explicitly disabled** - nothing to link |

**Overall assessment of the PR's architecture coverage:** genuine, non-trivial engineering for the operations it does cover (CRC32C, int128, cycleclock) - not placeholder code - but narrow: 4 of ~41 arch-guarded files touched, versus 40-41 for each of the two established architectures, with roughly 37 SIMD/arch-specific files relying on incidental generic fallbacks that predate and were not validated by this port effort.

## 5. Build System, Cross-Compilation, and Toolchain

**Build entry points:** `build.sh` (native) and `build-in-docker.sh`/`docker-dev.sh` (containerized, via `docker/dockerfiles/dev-env/dev-env.Dockerfile`). Both branch only on `x86_64`/`aarch64` today; the unmerged PR adds riscv64 host detection to `build.sh` and disables starcache/tenann/pprof on that path, plus `JAVA_LIBRARY_PATH` fixes.

**Required toolchain and why:** StarRocks builds its own GCC (bootstrapped GCC 10.3.0 -> 14.3.0) in `docker/dockerfiles/toolchains/toolchains-centos7.Dockerfile` for x86_64/aarch64 builds. No equivalent riscv64 toolchain container exists upstream. The original riscv64 feature request ([Issue #78252](https://github.com/StarRocks/starrocks/issues/78252)) specifically cites **GCC 15 / C23 compatibility issues** as a build blocker on the reporter's environment.

**Thirdparty vendor build:** `thirdparty/vars.sh` selects `vars-${MACHINE_TYPE}.sh` and **hard-exits** with "vars-riscv64.sh is missing." if that file does not exist (confirmed by reading `thirdparty/vars.sh:70-76`). Only `vars-x86_64.sh`, `vars-aarch64.sh`, `vars-ubuntu22-x86_64.sh`, `vars-ubuntu22-aarch64.sh`, and `vars-darwin-aarch64.sh` exist upstream. PR #78634 adds a new `thirdparty/vars-riscv64.sh` plus a `RISCV64_UNSUPPORTED_PACKAGES` exclusion list, and patches to `thirdparty/download-thirdparty.sh` and `thirdparty/build-thirdparty.sh` for riscv64 conditionals.

**QEMU usage:** No mentions of QEMU-based riscv64 building found anywhere in the repository's current build system. The original bug reporter ([Issue #78252](https://github.com/StarRocks/starrocks/issues/78252)) used RISC-V QEMU as one of their two test environments (alongside a physical SpacemiT K3 board), but this was the reporter's own ad hoc setup, not an upstream-provided path.

**Known build failures:**
- [Issue #58359](https://github.com/StarRocks/starrocks/issues/58359) (2025, closed stale): `build.sh` fails outright on riscv64 - no thirdparty RV64 support, no dependency prebuilts (jemalloc, brpc cited specifically), and x86/ARM SIMD intrinsics (SSE/AVX/NEON) require translation to RVV v1.0 equivalents. Proposed but never landed: `-march=rv64gcv -mabi=lp64d` CMake flags.
- [Issue #78252](https://github.com/StarRocks/starrocks/issues/78252) (2026, open): third-party dependency build incompatibility, GCC 15/C23 compatibility problems, no prebuilt riscv64 binaries for starcache/tenann.
- Within [PR #78634](https://github.com/StarRocks/starrocks/pull/78634)'s review, automated Copilot/Codex review flagged and the author fixed: an int128 overflow-detection bug in the portable arithmetic fallback (carry-only check missed a sign-flag-equivalent case caught by the x86 asm version), signed-overflow undefined behavior in `asm_sub_overflow` (fixed by computing in the unsigned domain first), a signal-handler declaration mismatch in a saslauthd patch (K&R-style `void()` vs. the required `void(int)` signature, which GCC 14 turns into a hard `-Wincompatible-pointer-types` build error), and an unpinned hyperscan/vectorscan dependency (fixed by pinning to commit `a77354b0`).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core BE compile/run | Yes | Yes | Not upstream; unmerged PR claims basic compilation/runtime for a subset |
| starcache (data cache) | Yes | Yes | No - explicitly disabled in the PR, no prebuilt binary exists |
| tenann (vector index) | Yes | Yes | No - explicitly disabled in the PR |
| pprof (profiling) | Yes | Yes | No - explicitly disabled in the PR |
| Hardware CRC32C | Yes (SSE4.2 intrinsic) | Yes (assumed hardware intrinsic) | No - software slice-by-8 fallback only (functionally correct, performance unmeasured) |
| SIMD bit-packing/popcount/filter hot paths | Hand-tuned (AVX2) | Hand-tuned (NEON) | Generic scalar fallback (inherited, unvalidated for riscv64) |
| LLVM JIT for expressions | Yes | Yes | Gated on in build files per the PR; functional status unconfirmed [NEEDS VERIFICATION] |
| Official binary distribution | Yes | Yes | No |
| Docker images | Yes | Yes | No riscv64 platform tag found |

**Functional gaps:** starcache, tenann (vector search/indexing), and pprof profiling are categorically unavailable on riscv64, even in the best-case unmerged state.

**Performance gaps:** Every SIMD-accelerated hot path outside the 4 files touched by PR #78634 (hash/CRC32C, int128 math, cycleclock) runs through generic scalar fallback code that was written for portability, not performance, and has not been benchmarked on riscv64. No performance data exists to quantify the delta (see below).

**Security hardening gaps:** Not assessed in available research; no riscv64-specific security posture data was found.

**NaN / floating-point semantics issues:** None found. A targeted search for riscv-specific NaN/floating-point correctness bugs against this repository returned only the general port-request issue (#78252), with no dedicated floating-point bug report.

**Performance benchmarks:** None exist. No published benchmark data comparing StarRocks on riscv64 to amd64 or arm64 was found in GitHub, StarRocks' own blog/docs, general web search, or the RISE project blog. StarRocks' 2025 roadmap references ARM (AArch64) performance tuning as a focus area, not RISC-V. This is consistent with the project not yet compiling cleanly on riscv64 outside the unmerged PR - there is no running system to benchmark.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by directly reading the contents of all workflow files in `.github/workflows/` (41 files enumerated via directory listing; earlier internal prose in this research miscounted as "36" but the file list itself is consistent across two independent checks) plus a full-repository case-insensitive grep for "riscv"/"risc-v". No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository. Verified independently via `mcp__github__search_code` (global GitHub index, not repo-scoped) for `riscv repo:StarRocks/starrocks`, `riscv org:StarRocks`, `riscv64 extension:yml`, and `riscv64 extension:yaml` - all returned `total_count: 0`.

Direct content checks of the architecture-relevant workflows:
- [`ci-pipeline.yml`](https://github.com/StarRocks/starrocks/blob/main/.github/workflows/ci-pipeline.yml) (main CI): no "riscv" string; runners are `self-hosted, normal` and `ubuntu-latest`.
- [`nix-flake.yml`](https://github.com/StarRocks/starrocks/blob/main/.github/workflows/nix-flake.yml): matrix systems are `x86_64-linux`, `aarch64-linux`, `aarch64-darwin` only.
- [`release-docker-image.yml.example`](https://github.com/StarRocks/starrocks/blob/main/.github/workflows/release-docker-image.yml.example): no platform declarations at all (defaults to `linux/amd64`).
- [`image-rebuild-three-digit.yml`](https://github.com/StarRocks/starrocks/blob/main/.github/workflows/image-rebuild-three-digit.yml): only arch reference is `darwin-aarch64`.

The single repo-wide "riscv" hit anywhere is `thirdparty/patches/breakpad-2024.02.16.patch:12` (`#define EM_RISCV 243 /* RISC-V */`) - an ELF machine-type constant in a vendored third-party crash-handler patch, unrelated to StarRocks' own CI or build gating.

[PR #78634](https://github.com/StarRocks/starrocks/pull/78634) touches 29-30 files (build scripts, BE source, thirdparty patches) and adds **zero files under `.github/workflows/`** - it adds riscv64 build capability to shell scripts and CMake but wires up no GitHub Actions job, runner, or trigger.

No RISE runners are referenced anywhere in the workflow files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ci-pipeline.yml`, self-hosted + ubuntu-latest runners) | Yes (`ubuntu-24.04-arm` per nix-flake matrix) | No |
| CI tests run | Yes | Yes | No |
| Release-blocking | Yes (standard merge-gate CI) | Yes | N/A - no job exists |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**No riscv64 binary exists through any channel checked:**

- **GitHub Releases:** Recent releases (3.5.21, 4.0.14, and prior) carry only "Assets 2" per release - consistent with GitHub's auto-generated "Source code (zip)" and "Source code (tar.gz)", not platform-specific compiled binaries. Direct asset filename enumeration was blocked (GitHub API access not enabled for this session's repo attachment), so this is not a 100%-certain negative on additional hidden binary assets, but nothing in any source suggests StarRocks attaches OS/arch binaries to GitHub Releases at all (it is understood to distribute via its own CDN/Docker Hub for amd64/arm64 rather than GitHub Releases) [NEEDS VERIFICATION - exact non-GitHub release channel not independently fetched this session].
- **PyPI** (`https://pypi.org/pypi/starrocks/json`): The only package under this name is an unrelated, pure-Python SQLAlchemy dialect connector (latest 1.3.4), shipping only `py3-none-any` wheels and sdists across all 23 published files (versions 1.0.3-1.3.4). No riscv64 string appears anywhere; this package is architecture-independent and irrelevant to the database engine's own riscv64 status either way.
- **RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/starrocks/`): 302-redirects to upstream PyPI - RISE has not built or mirrored a custom wheel; it is simply proxying the unrelated connector package.
- **Ubuntu** (`packages.ubuntu.com`, suite resolute/26.04): Search for `starrocks`, `python3-starrocks`, `libstarrocks` returned no results for any architecture - the package is not in the Ubuntu archive at all. (A later verification attempt against `packages.ubuntu.com` failed with repeated 503/connection-reset errors, so this specific check is unconfirmed by a second live source, but no other channel contradicts "not packaged.")
- **Arch Linux RISC-V** (`archriscv.felixc.at`): `?q=starrocks` returns zero occurrences; `/packages/starrocks/` returns HTTP 404.
- **Official download page** (`www.starrocks.io/download/community`): static content does not mention riscv64 anywhere.

**What a user must do today to get a working riscv64 build:** There is no path. The only known-working (author-claimed, unmerged, unreviewed-by-maintainers) route is to check out [PR #78634](https://github.com/StarRocks/starrocks/pull/78634)'s branch and build from source using its added `thirdparty/vars-riscv64.sh` and patches - with starcache, tenann, and pprof unavailable, and the rest of the system's SIMD hot paths running unvalidated scalar fallback code.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| OpenSSL | Build-dependency, critical (TLS/crypto for auth, RPC, SASL chain) | riscv64 is a supported upstream OpenSSL target; broadly packaged | linux-riscv64 CI exists upstream; one flaky test open ([#30880](https://github.com/openssl/openssl/issues/30880) `test_lhash`) | Full upstream releases | No blocking issues; open perf/enhancement asks only. Graded blue in `project-reports/openssl.md` per prior research |
| LLVM | Build-dependency, critical (StarRocks expression JIT via `STARROCKS_JIT_ENABLE`) | riscv64/RV32+RV64 is an official upstream LLVM backend; builds fine | Upstream riscv64 buildbots exist; active RVV correctness/perf bug backlog (~800 open riscv issues, e.g. [#221163](https://github.com/llvm/llvm-project/issues/221163) loop-carried WAR hazard) | Official source releases; distro riscv64 clang/llvm packages exist | Graded yellow in `project-reports/llvm.md` per prior research |
| GCC | Build-dependency, critical (StarRocks bootstraps its own GCC toolchain) | riscv64 is a mainline GCC target | N/A (toolchain, not tested as StarRocks dependency directly) | Distro-packaged broadly | Issue #78252 explicitly cites GCC 15/C23 compatibility problems as a riscv64 build blocker for StarRocks specifically |
| CMake | Build-dependency, critical | Packaged/works on riscv64 broadly [NEEDS VERIFICATION - not independently deep-dived this session] | - | Distro-packaged | No riscv64-specific issues surfaced in this research |
| glog | Build-dependency, critical | Patched by PR #78634 (`thirdparty/patches/*`) for riscv64 build | Not confirmed by dedicated CI | Distro-packaged generally | Requires a StarRocks-authored patch per the PR diff, indicating non-trivial riscv64 build friction |
| gperftools | Build-dependency, critical (legacy allocator/profiler) | Backtrace/stacktrace was broken on riscv64 ([#1359](https://github.com/gperftools/gperftools/issues/1359), closed/fixed) | No dedicated riscv64 CI found | Distro-packaged (`libgoogle-perftools-dev`) generally | Patched by PR #78634 for riscv64 |
| Boost | Build-dependency, critical | Patched by PR #78634 for riscv64 | Not confirmed by dedicated CI | Broadly distro-packaged | No dedicated riscv64 GitHub-issue research performed this session beyond the patch's existence |
| Apache Arrow | Build-dependency, critical (columnar format/compute kernels; bundles its own LLVM JIT, Gandiva) | Core C++ builds on riscv64; Gandiva (its own LLVM JIT) had a riscv64 runtime failure, [#50862](https://github.com/apache/arrow/issues/50862) (closed/fixed) - version-alignment with the 24.0.0 tag StarRocks pins not independently verified | No confirmed dedicated riscv64 CI lane | [#49555](https://github.com/apache/arrow/issues/49555) "Add riscv64 Python wheel builds to release pipeline" still **open** - official riscv64 binary packaging incomplete | Direct StarRocks thirdparty dependency at version 24.0.0 per `thirdparty/vars.sh` |
| jemalloc | Build-dependency, critical (primary memory allocator; "required by arrow" per BE CMakeLists comment) | Builds/links/runs on riscv64 per own project report; Debian/Ubuntu `libjemalloc-dev` builds unpatched | Passes per own project report | Distro-packaged | [#2399](https://github.com/jemalloc/jemalloc/issues/2399) "Does jemalloc support cross build for RISCV64?" still open; [#2323](https://github.com/jemalloc/jemalloc/issues/2323) riscv64gc support merged. Graded yellow in `project-reports/jemalloc.md` |
| RocksDB | Build-dependency, critical (embedded KV store for metadata/persistent index) | Was broken ([#10500](https://github.com/facebook/rocksdb/issues/10500) `-march=` error, [#7051](https://github.com/facebook/rocksdb/issues/7051) build fails on riscv64) - both closed via [#11994](https://github.com/facebook/rocksdb/pull/11994) "Better -march set for RISC-V" | No dedicated riscv64 CI lane confirmed | Not confirmed | Patched by PR #78634 for riscv64. Graded orange in `project-reports/rocksdb.md` |
| brpc | Build-dependency, critical (RPC framework) | Patched by PR #78634 for riscv64 build | Not confirmed by dedicated CI | Not confirmed | Explicitly cited as needing custom rv64-compatible builds in the earlier (2025) closed Issue #58359 |
| Kerberos | Build-dependency, optional | Patched by PR #78634 (krb5) for riscv64 | Not confirmed | Distro-packaged generally | No dedicated deep-dive this session |
| Cyrus SASL | Build-dependency, optional | Patched by PR #78634 (sasl) for riscv64; also required a saslauthd signal-handler signature fix (K&R `void()` vs `void(int)`, GCC 14 hard error) | Not confirmed | Distro-packaged generally | Review-flagged and fixed within PR #78634 |
| MariaDB Connector/C | Build-dependency, optional | Patched by PR #78634 (mariadb) for riscv64 | Not confirmed | Not confirmed | No dedicated deep-dive this session |
| hyperscan | Build-dependency, optional | Patched by PR #78634; unpinned vectorscan/hyperscan dependency was flagged as a reproducibility risk and fixed by pinning to commit `a77354b0` | Not confirmed | Not confirmed | Review-flagged and fixed within PR #78634 |
| croaringbitmap (CRoaring) | Build-dependency, optional (roaring bitmap ops, SIMD-accelerated) | Patched by PR #78634 (croaringbitmap) for riscv64; zero riscv64-tagged upstream issues found (absence of signal, not confirmed support) | Unconfirmed | Unconfirmed | [NEEDS VERIFICATION] - recommend explicit riscv64 CI run |
| bitshuffle | Build-dependency, optional | Patched by PR #78634 (bitshuffle) for riscv64 | Not confirmed | Not confirmed | No dedicated deep-dive this session |
| libserdes | Build-dependency, optional | Patched by PR #78634 (libserdes) for riscv64 | Not confirmed | Not confirmed | No dedicated deep-dive this session |
| pprof | Runtime-dependency, optional | Explicitly excluded/disabled on riscv64 by PR #78634 (Go diagnostic tool, nothing to link) | N/A | N/A | Confirmed unsupported-by-design on riscv64 |
| QEMU | Test-dependency, optional | N/A (test/emulation tool, not compiled into StarRocks) | Used ad hoc by the original Issue #78252 reporter as one of two test environments; no upstream-provided QEMU-based CI path exists | N/A | Not part of StarRocks' own CI (see Section 7) |

**Deep-dive: transitive dependencies of Apache Arrow and gRPC (2-3 levels), surfaced during dependency research (not in the direct-dependency list above but relevant to riscv64 risk):**

- **Abseil-cpp** (hard dependency of gRPC, new tcmalloc, and indirectly Arrow): **open blocking bug** - [#1702](https://github.com/abseil/abseil-cpp/issues/1702) "Can't link using riscv64 toolchain," unresolved. This is a real linking risk for a transitive hard dependency.
- **gRPC**: historically broken on riscv64 ([#37791](https://github.com/grpc/grpc/issues/37791) SIGILL, [#35839](https://github.com/grpc/grpc/issues/35839) undefined `__atomic_compare_exchange_1`), both closed/fixed; no dedicated riscv64 CI lane confirmed; inherits Abseil's open #1702 transitively.
- **xsimd** (SIMD abstraction used in Arrow compute kernels): two open build-breaking issues - [#1275](https://github.com/xtensor-stack/xsimd/issues/1275) "Failing to build riscV/rvv" and [#954](https://github.com/xtensor-stack/xsimd/issues/954) "riscv64, s390x: aligned_mode does not name a type" - the clearest concrete riscv64 blocker found among numerics/SIMD transitive dependencies.
- **zlib-ng**: pinned version 2.3.3 hit a build error referencing `crc32_riscv64_zbc undeclared` ([#2148](https://github.com/zlib-ng/zlib-ng/issues/2148), closed) - whether the fix landed in the exact StarRocks-pinned build configuration is unverified [NEEDS VERIFICATION].
- **simdjson** and **simdutf** (used for JSON parsing and UTF-8/16 validation respectively): both have merged RVV backends with no open riscv64 issues - positive signal among the transitive dependency set.

**Tooling caveat:** The `project-graph` MCP server (which would provide authoritative Ubuntu 26.04/resolute riscv64 packaging status for every dependency) failed to connect (`CONNECTION_CLOSED`) on every attempt across this research (including this final synthesis session, per the standing system notice). No dependency row above should be read as "confirmed not packaged in Ubuntu 26.04" - it should be read as "not verified via the graph tool," with distro-level evidence instead drawn from direct `packages.ubuntu.com`/`archriscv.felixc.at` checks where performed.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#78252](https://github.com/StarRocks/starrocks/issues/78252) | Support for RISC-V architecture | Open (feature-request) | High (master tracking issue) | Cites third-party dependency build incompatibility, GCC 15/C23 compatibility issues, no prebuilt starcache/tenann binaries. Closed by PR #78634 when/if merged. |
| [#78634](https://github.com/StarRocks/starrocks/pull/78634) | [Feature] Add riscv64 architecture support | Open, unmerged (PR, not a bug, listed for completeness) | N/A | Awaiting 2 required approvals (alvin-phoenix-ai, kevincai) as of 2026-09-10/11 |
| [#58359](https://github.com/StarRocks/starrocks/issues/58359) | Compilation Failure on RISC-V RV64 Architecture with Custom Dependencies | Closed (2025-04-25, likely stale rather than resolved) | Medium (predecessor/superseded) | No riscv64 support existed at time of closure; no lineage/comment thread connects it to #78252/#78634 |

**Correctness bugs:** None found specific to riscv64. Targeted search for a riscv NaN/floating-point comparison correctness bug against this repository returned only #78252 (the general port request), with no dedicated floating-point bug report. This is consistent with the project not yet running on riscv64 in any released or CI-verified form - there is no live system on which a correctness bug could have been observed and filed.

**False-positive note:** [PR #60005](https://github.com/StarRocks/starrocks/pull/60005) ("bump up breakpad to 2024.02.16 to fix crash in dump_syms," merged 2025-06-21, shipped in release 3.5.1 via backport PR #60150) matched the "riscv" keyword search incidentally (breakpad's `.relr.dyn` relocation-section handling) but is unrelated to riscv64 porting.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has posted a rejection, concern, or counter-proposal on either #78252 or #78634. The blocking factor visible in the record is review bandwidth, not disagreement: all substantive back-and-forth on PR #78634 is with automated Copilot/Codex review bots, all of which the author addressed via follow-up commits; two human maintainer approvals (alvin-phoenix-ai, kevincai) remain outstanding.

**Technical blockers:**
- GCC 15/C23 compatibility issues cited in the original feature request (#78252).
- No upstream riscv64 CI exists to validate the PR's claims on merge or going forward (Section 7).
- starcache and tenann (vector index) have no riscv64 path at all and are simply disabled, representing a permanent functional gap absent further, separate engineering investment.
- Transitive dependency risk: Abseil-cpp's open riscv64 linking bug ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) and xsimd's two open riscv64 build-breaking issues ([#1275](https://github.com/xtensor-stack/xsimd/issues/1275), [#954](https://github.com/xtensor-stack/xsimd/issues/954)) sit underneath Arrow/gRPC and could resurface as build blockers even after PR #78634 merges.

**Organizational blockers:** No formal platform-tier acceptance policy exists (Section 1) - new-architecture work follows the generic 2-approval contribution process with no dedicated porting charter, which is itself a mild structural blocker (no fast-track, no dedicated reviewer assignment visible).

**Acceptance probability:** The PR is a single unmerged, unreviewed-by-maintainers-yet change with no stated objection and all bot-flagged issues already fixed by the author. Absent visible pushback, merge appears procedurally plausible but is not confirmed, and even upon merge, no CI would exist to keep riscv64 working (Section 7) - meaning a merge alone would not, by itself, raise this project past yellow under the color model in Section 13 without a follow-on CI investment.

## 13. Readiness Assessment

- **Color:** orange (baseline "no upstream CI, no distribution floor available" - this project's situation fits neither of the two predefined orange sub-types, since no distro ships it at all and it is not an optimization-purpose project)
- **Release provider:** none
- **Justification:** StarRocks has zero riscv64 CI coverage anywhere upstream (confirmed by reading every file in `.github/workflows/` plus a full-repository grep) and no riscv64 package or binary release exists through any distribution or release channel checked (GitHub Releases, official download page, PyPI, Ubuntu, Arch Linux RISC-V). The only riscv64 enablement work is [PR #78634](https://github.com/StarRocks/starrocks/pull/78634), open and unmerged as of 2026-09-11, against tracking issue [#78252](https://github.com/StarRocks/starrocks/issues/78252). Because this is not confirmed-broken (the open PR demonstrates a working build path exists), the color is orange rather than red; because extensive, positive research was conducted rather than returning no signal, it is orange rather than grey.
- **Pending work that could change the grade:** Merging PR #78634 would not, by itself, move the color past orange/yellow, since it adds no CI infrastructure - a subsequent riscv64 CI job (even build-only) would be required to reach yellow, and a tested, upstream-published riscv64 artifact would be required to reach blue or green. No confirmed RISE funding, runner usage, or blog coverage of StarRocks was found; the only RISE-adjacent signal is the PR author's branch namespace (`zte-riscv`) and the SpacemiT hardware target named in the original issue, both RISE General Members, [NEEDS VERIFICATION] as an actual organizational commitment rather than an individual contributor's affiliation.

## 14. Investment Analysis

RISE has not funded or performed any confirmed work on StarRocks specifically (Section 1/13) - StarRocks appears only as a queued candidate in an internal RISE evaluation list (`project-reports/.queue.yml` in the `riseproject-dev/sw-ecosystem` repository), with no report, funding, or runner usage recorded against it. All sizing below is therefore full-scope; nothing is deducted for prior RISE investment.

### 14.1 Functional Enablement

Core work is already substantially drafted (unmerged) in PR #78634: thirdparty riscv64 vendor build gating, ~13 per-package patches (openssl, llvm, glog, gperftools, boost, krb5, sasl, arrow, bitshuffle, croaringbitmap, hyperscan, mariadb, jemalloc, brpc, rocksdb, libserdes, saslauthd), software CRC32C, portable int128 arithmetic, and riscv cycleclock/cacheline definitions. Remaining functional work: get the PR reviewed/merged, resolve the transitive Abseil-cpp/xsimd riscv64 build risks (Section 9/12) that sit beneath Arrow and gRPC and are not addressed by PR #78634, and decide the long-term posture on starcache/tenann/pprof (permanently unsupported vs. future native port).

### 14.2 Performance Optimization

Roughly 37 of ~41 arch-guarded BE source files (SIMD bit-packing, popcount, filter/expand/gather, storage checksums, bitshuffle, persistent index, primary key encoder) currently rely on generic scalar fallback paths that predate and were not validated by the riscv64 port for RVV-specific tuning. No RVV intrinics work exists in the codebase or the open PR. Closing this gap would require a follow-on RVV optimization pass, but StarRocks is a general-purpose database (not an optimization-purpose library per Section 13's Step-2 test), so this is scoped as an optional performance-maturity investment rather than a readiness-blocking one.

### 14.3 CI/CD Infrastructure

Zero riscv64 CI exists (Section 7). Standing up even a build-only riscv64 job (to reach yellow under the color model) requires a riscv64 runner (RISE board farm or QEMU-based CI, given no evidence of RISE-hosted native riscv64 hardware confirmed for this project specifically) and wiring it into the existing `ci-pipeline.yml`/`nix-flake.yml` workflow structure. Reaching blue/green requires the test suite to run and pass on that runner, and an upstream-published riscv64 artifact.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below. StarRocks itself is a standalone database engine/runtime; it has no dependent package ecosystem (no plugins/extensions layer analogous to Python/npm/Maven packages that must each be separately riscv64-enabled). The one PyPI package sharing its name is an unrelated, architecture-independent client connector library and requires no riscv64 work of its own.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and merge PR #78634 (currently blocked only on maintainer review bandwidth, not technical objection) | 1-2 (review/iteration cycles, not new engineering) | StarRocks TSC/Maintainers | Critical |
| Functional | Resolve transitive Abseil-cpp ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) and xsimd ([#1275](https://github.com/xtensor-stack/xsimd/issues/1275), [#954](https://github.com/xtensor-stack/xsimd/issues/954)) riscv64 build blockers beneath Arrow/gRPC | 2-4 (upstream contribution to those projects, or StarRocks-side patching) | Contributor + upstream Abseil/xsimd maintainers | High |
| Functional | Decide/implement long-term posture for starcache, tenann, pprof on riscv64 (native port vs. permanent exclusion) | 4-8+ (if native port pursued; near-zero if permanently excluded) | StarRocks Maintainers + contributor | Medium |
| CI/CD | Stand up build-only riscv64 CI job (reach yellow) | 2-3 (runner provisioning + workflow integration) | StarRocks Maintainers, possibly with RISE runner support | High |
| CI/CD | Extend to test-execution CI + upstream-published riscv64 artifact (reach blue/green) | 3-5 (beyond the build-only job) | StarRocks Maintainers | Medium |
| Performance | RVV-specific optimization pass for the ~37 files currently on generic scalar fallback | 6-10+ (broad surface area, no existing RVV code to build on) | Contributor with RVV expertise | Low (optional, post-readiness) |
| Distribution | Establish a riscv64 release channel (GitHub Releases asset, Docker image platform tag, or distro packaging) once CI is stable | 2-3 | StarRocks Maintainers | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [Issue #78252 - Support for RISC-V architecture](https://github.com/StarRocks/starrocks/issues/78252)
- [PR #78634 - [Feature] Add riscv64 architecture support](https://github.com/StarRocks/starrocks/pull/78634)
- [Issue #58359 - Compilation Failure on RISC-V RV64 Architecture with Custom Dependencies](https://github.com/StarRocks/starrocks/issues/58359)
- [PR #60005 - bump up breakpad to 2024.02.16 to fix crash in dump_syms](https://github.com/StarRocks/starrocks/pull/60005) (false-positive keyword match, not riscv-related)
- [PR #60150 - backport of PR #60005 to branch-3.5](https://github.com/StarRocks/starrocks/pull/60150)
- [StarRocks GitHub Actions workflows directory](https://github.com/StarRocks/starrocks/tree/main/.github/workflows)
- [StarRocks build docs - Ubuntu](https://github.com/StarRocks/starrocks/blob/main/docs/en/developers/build-starrocks/build_starrocks_on_ubuntu.md)
- [StarRocks Technical Charter](https://github.com/StarRocks/starrocks/blob/main/community/Technical_Charter.md)
- [StarRocks TSC members](https://github.com/StarRocks/starrocks/blob/main/community/TSC_members.md)
- [StarRocks membership/promotion policy](https://github.com/StarRocks/starrocks/blob/main/community/membership.md)
- [StarRocks CONTRIBUTING.md](https://github.com/StarRocks/starrocks/blob/main/CONTRIBUTING.md)
- [StarRocks homepage](https://www.starrocks.io/)
- [StarRocks community download page](https://www.starrocks.io/download/community)
- [StarRocks releases page](https://github.com/StarRocks/starrocks/releases)
- [PyPI - starrocks package JSON API](https://pypi.org/pypi/starrocks/json)
- [RISE GitLab Python wheel builder - starrocks index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/starrocks/)
- [Ubuntu package search - starrocks](https://packages.ubuntu.com/search?keywords=StarRocks&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search - starrocks](https://archriscv.felixc.at/?q=starrocks)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder supported-package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Issue #78721 - [Enhancement] ARM64 ingestion performance improvement opportunities](https://github.com/StarRocks/starrocks/issues/78721) (ARM64, not riscv64 - flagged as adjacent/out of scope)
- [Abseil-cpp Issue #1702 - Can't link using riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [gRPC Issue #37791](https://github.com/grpc/grpc/issues/37791), [Issue #35839](https://github.com/grpc/grpc/issues/35839)
- [xsimd Issue #1275 - Failing to build riscV/rvv](https://github.com/xtensor-stack/xsimd/issues/1275), [Issue #954](https://github.com/xtensor-stack/xsimd/issues/954)
- [zlib-ng Issue #2148 - crc32_riscv64_zbc undeclared](https://github.com/zlib-ng/zlib-ng/issues/2148)
- [jemalloc Issue #2399 - Does jemalloc support cross build for RISCV64?](https://github.com/jemalloc/jemalloc/issues/2399), [Issue #2323](https://github.com/jemalloc/jemalloc/issues/2323)
- [RocksDB Issue #10500](https://github.com/facebook/rocksdb/issues/10500), [Issue #7051](https://github.com/facebook/rocksdb/issues/7051), [PR #11994 - Better -march set for RISC-V](https://github.com/facebook/rocksdb/pull/11994)
- [Apache Arrow Issue #50862 - Gandiva riscv64 runtime failure](https://github.com/apache/arrow/issues/50862), [Issue #49555 - Add riscv64 Python wheel builds to release pipeline](https://github.com/apache/arrow/issues/49555)
- [gperftools Issue #1359](https://github.com/gperftools/gperftools/issues/1359)
- Local shallow clone of `StarRocks/starrocks` at commit `de0ef8ecbbd60f1a86496b7bd94e050ffccb5be5` (used for direct source-tree grep and CMake/build-script inspection)
