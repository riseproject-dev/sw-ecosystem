---
title: brotli
parent: Project Reports
color: yellow
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: setuptools
    relation: build-dependency
    criticality: optional
  - name: pkg-config
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="brotli" %}

# brotli

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for brotli<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Brotli is a general-purpose lossless compression algorithm and library developed by Google, standardized as [IETF RFC 7932](https://tools.ietf.org/html/rfc7932). It is widely deployed as the content-encoding for HTTP responses (replacing or complementing gzip/deflate) and is embedded in browsers, web servers, CDNs, and package managers. Its stated value proposition is compression ratio, not raw processing speed. The library exposes a C API with language bindings for Python, Java, Go, and JavaScript.

**Governance:** No foundation. Brotli is a Google-owned open-source project under the [google GitHub organization](https://github.com/google/brotli), homepage [brotli.org](https://brotli.org/), licensed MIT. There is no MAINTAINERS/OWNERS/CODEOWNERS file and no formal tier policy. All merges flow through a single principal maintainer, Eugene Kliuchnikov (`eustas`, Google), who approves and merges every substantive PR. New contributors must sign the Google CLA.

**Corporate sponsors:** Google is the primary sponsor and employs the principal maintainer. Microsoft maintains the vcpkg port per the upstream README. No other corporate sponsorship is documented.

**Community stance on new ports:** Not hostile. The original riscv64 base port ([PR #669](https://github.com/google/brotli/pull/669)) was merged without technical objection in 2018. The subsequent RVV optimization PRs have stalled from maintainer inattention (single-maintainer bandwidth, CLA process) rather than rejection on technical grounds.

**RISE Project involvement:** Google is a Premier Member of the RISE Project. Brotli has no RISE blog coverage (`riseproject.dev/?s=brotli` returns zero results, and none of the recent blog RSS entries mention it) and is absent from the RISE GitLab wheel-builder index ([riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/), 88 packages listed, brotli not among them). However, a separate, distinct RISE initiative on GitHub, `riseproject-dev/python-wheels`, does actively build and publish riscv64 Python wheels for `brotli` and `brotlicffi` using RISE's own native riscv64 CI runners (see Section 8). This is downstream packaging automation for the Python bindings, not RISE investment in the upstream C library or its RVV performance work; no RISE role was found in the RVV optimization PRs (PR #1410 / PR #1489, both authored by ISCAS, a RISE General Member, as community contribution rather than a coordinated RISE program).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-05-16 to 2018-05-22 | PR #669 opened and merged: "Add RISC-V 64-bit (riscv64) platform configuration." Adds `BROTLI_TARGET_RISCV64` macro to `c/common/platform.h`, enabling the 64-bit word-size path and fast-unaligned-read path for riscv64. | [PR #669](https://github.com/google/brotli/pull/669) |
| 2025-05-27 to 2025-05-29 | Issue #1267 opened and closed: downstream riscv-edk2/UEFI build-integration error (symbol visibility, not a brotli bug); resolved via `-DBROTLI_INTERNAL=` / `#define BROTLI_INTERNAL` guidance from eustas. | [Issue #1267](https://github.com/google/brotli/issues/1267) |
| 2025-12-26 | PR #1410 opened: "Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions." Inline-assembly RVV path for the encoder hot path. Still open as of this report. | [PR #1410](https://github.com/google/brotli/pull/1410) |
| 2026-05-31 | PR #1489 opened: "riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV." Explicitly states it supersedes #1410; uses RVV 1.0 intrinsics and covers both encoder and decoder hot paths. | [PR #1489](https://github.com/google/brotli/pull/1489) |
| 2026-06-05 | PR #1489 closed after the author deleted the head repository/fork. Abandoned, not rejected on technical merits; no maintainer review is recorded on the PR. | [PR #1489](https://github.com/google/brotli/pull/1489) |

**PR #669 discussion (full thread):** eustas initially pushed back on QEMU-only validation, noting "qemu does not bother checking unaligned memory access" - i.e., QEMU can silently pass code that would fault on real hardware. The author (davidlt) then ran the full test suite on a SiFive HiFive Unleashed board (4 harts), reporting "100% tests passed, 0 tests failed out of 70," runtime 139.10s, before the PR was merged.

**Discrepancy in merge commit identification:** two independent passes of this research disagree on the exact commit hash for PR #669's merge: one pass reports the merge commit as `a0353fc` (authored by David Abdurachmanov); a separate pass, cross-checked against a cloned repository's `git tag --contains`, reports `f9b8c02` (merged by eustas) and states this commit first appears in tag v1.0.5 (2018-06-27), not present in v1.0.4. Both agree on the merge date (2018-05-22) and outcome. This is flagged as an open discrepancy rather than resolved in favor of either hash. [NEEDS VERIFICATION]

**Key contributors:**
- David Abdurachmanov (`davidlt`, CERN / Fedora RISC-V community): authored the original 2018 riscv64 base port.
- Dayuxiaoshui, co-author gong-flying (`gongxiaofei24@iscas.ac.cn`, Institute of Software, Chinese Academy of Sciences): authored PR #1410.
- Felix-Gong (ISCAS): authored PR #1489, the technically superior but abandoned implementation.

**Upstreaming status:** The base port is fully upstream and compiles/links on riscv64 since 2018 (`git log --all --grep="riscv" -i` on the full repository history shows only the single #669-derived commit; no RVV commit exists on any branch). No RVV optimization code has been merged. There is no master/tracking issue for a riscv64 port; the only issue matching "riscv" in the tracker is the unrelated build-support question (#1267).

---

## 3. Upstream Support Tier

Brotli has no published tier policy. Support level is inferred from CI coverage, release artifacts, and maintainer behavior.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (multiple, primary) | Partial (no dedicated riscv-equivalent job; only a QEMU ARMv7/NEON job exists, not arm64-native) | None |
| CI test execution | Yes | No | No |
| QEMU CI test job | No | No (ARMv7/NEON is the only QEMU job in the matrix) | None |
| Upstream binary releases (GitHub Releases) | Yes (Windows x64) | Yes (Windows arm64) | No |
| PyPI pre-built wheels (official) | Yes (manylinux/musllinux x86_64, i686) | Yes (manylinux/musllinux aarch64) | No |
| Distro packages | Yes | Yes | Yes (Debian sid, Alpine edge, Chimera Linux; Ubuntu 26.04 status is contradictory, see Section 8) |
| Architecture-specific SIMD | SSE2 tag-matching | NEON `memmove16` | None merged (PRs #1410/#1489 unmerged) |
| Maintainer engagement on arch PRs | N/A | N/A | None (PR #1410 stalled 6+ months on CLA, zero review; PR #1489 zero comments before closure) |

**Assessment:** riscv64 is an untested, unofficially-supported architecture at the upstream level. The library compiles and produces correct scalar-path output on riscv64, and multiple independent Linux distributions ship it built from unmodified upstream source, but upstream CI provides zero build or test coverage for riscv64 and upstream ships no riscv64 binaries through any official channel (GitHub Releases or PyPI).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Brotli has no JIT, no crypto code, and no GC. Architecture-specific code is confined to `#ifdef`-guarded branches inside four shared files; there is no `arch/` subdirectory and no `.S` assembly files exist anywhere in the repository for any architecture. A repository-wide search for `defined(BROTLI_TARGET_`, `arm_neon.h`, `immintrin.h`, and `riscv_vector`/`__riscv_v` found exactly four files containing any CPU-feature-gated branch.

### `c/common/platform.h` - target detection (complete riscv64 content)
```c
#if defined(__riscv) && defined(__riscv_xlen) && __riscv_xlen == 64
#define BROTLI_TARGET_RISCV64
#endif
```
This macro feeds two downstream conditionals: `BROTLI_TARGET_64_BITS` (alongside x64, ARMv8-64, PPC64, LoongArch64, MIPS64) and `BROTLI_UNALIGNED_READ_FAST` (alongside x86/x64/ARMv7/ARMv8/LoongArch64). No RVV-specific macro, no `#include <riscv_vector.h>`, and no TODO/stub comment exists in this file for riscv64 outside PR #1489's unmerged `BROTLI_RVV_1` proposal.

### Per-component status

| Component | File | amd64/x86 | arm64 | riscv64 |
|---|---|---|---|---|
| `GetMatchingTagMask` (encoder tag-mask hashing) | `matching_tag_mask.h` | Full: hand-written SSE2 intrinsics (`_mm_set1_epi8`, `_mm_loadu_si128`, `_mm_cmpeq_epi8`, `_mm_movemask_epi8`), gated on `__SSE2__`/`_M_AMD64`/`_M_IX86_FP` | Scalar SWAR fallback (no NEON path exists for this function on any ARM target) | Scalar SWAR fallback (identical code path to arm64) |
| `memmove16` (decoder copy) | `decode.c` | Scalar: `memcpy(buffer, src, 16); memcpy(dst, buffer, 16)` (no x86 SIMD path exists either) | Full: NEON intrinsics (`vld1q_u8`/`vst1q_u8`), gated on `BROTLI_TARGET_NEON` | Scalar fallback, identical to x86 (PR #1489's RVV replacement unmerged) |
| `FindMatchLengthWithLimit` (encoder match-length scan) | `find_match_length.h` | "Fast" branch via generic `__builtin_ctzll` (TZCNT64), gated only on `BROTLI_TZCNT64 && BROTLI_64_BITS && BROTLI_LITTLE_ENDIAN` - no `#ifdef __riscv` anywhere | Same generic builtin/fast branch | Same generic builtin/fast branch - this is a compiler-intrinsic win shared by every 64-bit little-endian target, not RISC-V-specific engineering (PRs #1410/#1489 unmerged) |
| ARMv7/ARMv8-32 Huffman alignment-attribute load trick | `huffman.h` | N/A | N/A (32-bit ARM only; does not apply to arm64) | N/A |
| `BrotliRBit` inline-asm bit-reverse | `platform.h` | N/A | Full (ARM-only inline asm) | Missing (falls to an unreferenced/unusable stub) |
| RVV vector acceleration | - | N/A | N/A | Missing - zero occurrences of RVV intrinsics/asm in any merged file |

**Bottom line:** riscv64 is not a build/correctness stub - the platform macros are correct and complete, and every algorithm compiles to the same portable, correctness-verified scalar C used by PPC64, MIPS64, LoongArch64, and s390x. It is production-functional but is architecturally the only 64-bit little-endian target that receives zero hand-tuned acceleration anywhere in the codebase, while x86 gets one hand-tuned function (SSE2 tag-mask) and ARM gets two (NEON `memmove16`, ARMv7 Huffman alignment trick).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Native build on riscv64 (standard):**
```
mkdir out && cd out
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=./installed ..
cmake --build . --config Release --target install
```

`cmake_minimum_required(VERSION 3.15)` (the root `CMakeLists.txt` notes Ubuntu 20.04 ships 3.16.3; Solaris 11.4 SRU 15 ships 3.15). No explicit minimum GCC/Clang version is declared anywhere in the repository or CI; upstream CI simply uses whatever `gcc`/`clang` ships on the GitHub-hosted runner image. The PR #1489 benchmark used GCC 15.1.0; the PR #1410 benchmark used GCC 12.3.1 - both with `-march=rv64gcv` for RVV 1.0 support, but neither flag nor toolchain requirement is upstream-documented since neither PR is merged.

**Cross-compilation QEMU auto-wrap (riscv64 not covered):** `CMakeLists.txt` matches the compiler binary name to auto-configure a QEMU test wrapper for exactly two architecture families:
```cmake
if ("${CMAKE_C_COMPILER}" MATCHES "^.*/arm-linux-gnueabihf-.*$")
  set(BROTLI_WRAPPER "qemu-arm")
  set(BROTLI_WRAPPER_LD_PREFIX "/usr/arm-linux-gnueabihf")
elseif ("${CMAKE_C_COMPILER}" MATCHES "^.*/aarch64-linux-gnu-.*$")
  set(BROTLI_WRAPPER "qemu-aarch64")
  ...
```
There is no `riscv64-linux-gnu-*` branch. A manual cross-compile requires:
```
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  ..
```
Required Debian/Ubuntu packages: `gcc-riscv64-linux-gnu libc6-dev-riscv64-cross qemu-user`. To run tests under QEMU after cross-compiling, the wrapper must be set manually (not auto-detected):
```
cmake -DBROTLI_WRAPPER=qemu-riscv64 -DBROTLI_WRAPPER_LD_PREFIX=/usr/riscv64-linux-gnu ...
```
With no automatic wrapper, `BROTLI_DISABLE_TESTS=ON` is effectively required for a straightforward cross-compile unless a user patches the CMake logic.

**No Dockerfile exists in the repository for any architecture** (`filename:Dockerfile repo:google/brotli` returns zero results). No `cmake/` subdirectory and no toolchain files ship in-tree for any target, riscv64 included.

**Known build failures:** None documented for riscv64. Debian sid successfully built brotli 1.2.0-3 for riscv64 from unmodified upstream source; Alpine edge (1.2.0-r1) and Chimera Linux (1.2.0-r0) likewise build it without riscv64-specific packaging patches, consistent with the base port (PR #669, merged 2018) requiring no further build-system changes.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

None. Brotli compiles, links, and produces correct scalar-path output on riscv64; it is packaged and shipped by multiple independent Linux distributions built from unmodified upstream source. The 28 roundtrip and 22 compatibility tests reported passing on riscv64 in PR #1489's description are author-reported only, not confirmed by upstream CI (upstream has zero riscv64 CI). [NEEDS VERIFICATION]

### Performance gaps

| Operation | amd64 advantage over riscv64 | arm64 advantage over riscv64 | Source |
|---|---|---|---|
| `FindMatchLengthWithLimit` (encoder hot path) | None - equivalent generic TZCNT64 scalar path | None - equivalent generic path | [find_match_length.h](https://github.com/google/brotli/blob/master/c/enc/find_match_length.h) |
| SIMD tag matching (encoder) | SSE2 path exists | No SIMD path (same as riscv64) | [matching_tag_mask.h](https://github.com/google/brotli/blob/master/c/enc/matching_tag_mask.h) |
| `memmove16` (decoder hot path) | None - equivalent generic scalar fallback | NEON: `vld1q_u8`/`vst1q_u8` | [decode.c](https://github.com/google/brotli/blob/master/c/dec/decode.c) |
| RVV-optimized `FindMatchLengthWithLimit` + `memmove16` | N/A | N/A | +14 to +25% compression speedup, ~+5% decompression, claimed and unmerged (PR #1489) |

**Quantified RVV gap, PR #1489** (RISC-V 64-bit server, GCC 15.1.0, `-O2 -march=rv64gcv`, Q11, brotli's own official test data, best-of-3 runs): lcet10.txt +25.1%, alice29.txt +25.0%, bb.binast +14.4% compression throughput vs. scalar baseline; approximately +5% decompression on large files via the `memmove16` path.

**Quantified RVV gap, PR #1410** (GCC 12.3.1, `-O3 -march=rv64gcv`, 100 iterations): compression +2.16% average, +7.56% peak (1MB file); decompression +2.66% average.

The two PRs' figures disagree by roughly an order of magnitude (+2-8% vs +14-25%) because of different GCC versions (12.3.1 vs 15.1.0), different optimization levels (`-O3` vs `-O2`), different test corpora, and different scope (#1489 covers both the encoder hot path and the decoder `memmove16`; #1410 covers only the encoder path). Neither PR reports absolute MB/s throughput - both report percentage deltas only. Neither figure is verified by upstream CI.

### Security hardening gaps

None identified specific to riscv64. No architecture-specific hardening code (stack canaries, CFI, shadow stacks) exists in brotli's C source for any target.

### Floating-point / NaN issues

No floating-point correctness bugs involving riscv64 are documented. Brotli uses `log2()` from libm for internal entropy calculations only; no NaN or rounding-mode issues have been reported for riscv64 in the tracker (a dedicated search for `riscv nan floating repo:google/brotli` returned zero results).

---

## 7. CI/CD Infrastructure

All 8 workflow files under `.github/workflows/` were read directly at HEAD (`raw.githubusercontent.com`) and independently cross-checked with a code-search index query (`riscv repo:google/brotli path:.github`, `total_count: 0`). No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` exists in the repository.

| Workflow file | riscv64 coverage | "riscv" occurrences |
|---|---|---|
| [build_test.yml](https://github.com/google/brotli/blob/master/.github/workflows/build_test.yml) | None. Main CI: CMake/Bazel across ubuntu-latest/macOS/Windows runners; the only cross-arch QEMU job is `cmake:qemu-arm-neon-gcc` (ARMv7/NEON via `qemu-user` + `gcc-arm-linux-gnueabihf`) | 0 |
| build_test_wasm.yml | None | 0 |
| codeql.yml | None | 0 |
| fuzz.yml (OSS-Fuzz) | None | 0 |
| lint.yml | None | 0 |
| publish_to_bcr.yaml | None | 0 |
| release.yaml (uses vcpkg triplets; no riscv64 triplet referenced) | None | 0 |
| scorecard.yml | None | 0 |

**Summary comparison:**

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (multiple jobs) | Partial (no native arm64 job; only 32-bit ARMv7/NEON via QEMU) | None |
| Test execution in CI | Yes | No | No |
| QEMU-based test job | No | No (only ARMv7/NEON) | None |
| RISE-provided runners in upstream CI | No | No | No |

The only "riscv" hits anywhere in the repository outside `platform.h` are two Bazel module lock files (`java/MODULE.bazel.lock`, `go/MODULE.bazel.lock`) listing `freebsd_riscv64` entries in the hermetic Go-toolchain download table - a standard `rules_go` toolchain registry entry, unrelated to brotli's own CI execution. riscv64 has zero CI coverage of any kind upstream, on any trigger, on any runner.

---

## 8. Distribution and Release Status

**Upstream binary releases (GitHub):** [v1.2.0](https://github.com/google/brotli/releases/tag/v1.2.0) ships `brotli-arm64-windows-{dynamic,static}.zip`, `brotli-x64-windows-{dynamic,static}.zip`, `brotli-x86-windows-{dynamic,static}.zip`, `testdata.txz`, and source archives - Windows-only binaries plus source, verified by enumerating every asset. v1.1.0 shows the identical pattern minus the arm64 assets. No riscv64 asset exists in any release.

**PyPI (official, pypi.org):** The full `urls` array for `brotli` 1.2.0 (100 files enumerated) and 1.1.0 covers macOS (Intel and universal2), manylinux/musllinux (x86_64, i686, aarch64, ppc64le), and Windows (win32/win_amd64), plus the source sdist. No riscv64 wheel exists for any published version; a riscv64 user installing via `pip install brotli` gets the sdist and must compile from source.

**RISE riscv64 wheel builder (GitHub, `riseproject-dev/python-wheels`):** a distinct project from the RISE GitLab wheel_builder index. It packages `brotli` (v1.2.0) and `brotlicffi` for riscv64, including an original licensing-compliance patch (`patches/brotlicffi/1.2.0.2/0001-ship-libbrotli-s-licence-alongside-brotlicffi-s-own.patch`). Its `build-brotli.yml` workflow runs on `ubuntu-24.04-riscv` - a native RISE riscv64 hardware runner - using `cibuildwheel` v4.2.0 against the `quay.io/pypa/manylinux_2_39_riscv64` container, building wheels for CPython 3.12/3.13/3.14/3.14t. The published wheel index at [gitlab.com/api/v4/projects/56254198/packages/pypi/simple/brotli/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/brotli/) confirms 4 live riscv64 wheels: `brotli-1.2.0-cp312-cp312-manylinux_2_31_riscv64.manylinux_2_39_riscv64.whl`, and equivalents for cp313, cp314, cp314t. The separate [RISE GitLab wheel_builder index](https://riseproject.gitlab.io/python/wheel_builder/) (88 packages) does not list brotli - the two are independent RISE packaging efforts, and only the GitHub project currently ships brotli.

**Distro packages:**

| Distribution | riscv64 status | Version | Notes |
|---|---|---|---|
| Debian sid | Builds | 1.2.0-3 | From unmodified upstream source; no riscv64-specific packaging patches needed given the base port has been upstream since 2018. |
| Alpine edge | Builds | 1.2.0-r1 | Confirmed via [pkgs.alpinelinux.org](https://pkgs.alpinelinux.org/package/edge/main/riscv64/brotli). |
| Chimera Linux | Builds (`python-brotli`) | 1.2.0-r0 | Confirmed via [pkgs.chimera-linux.org](https://pkgs.chimera-linux.org/package/current/main/riscv64/python-brotli), built 2026-09-26. |
| Ubuntu 26.04 "resolute" | **Contradictory evidence** | 1.2.0-3build1 (if present) | See below. |
| Arch Linux RISC-V (archriscv.felixc.at) | Unverified | - | Site homepage is a static landing page; `/riscv64/`, `/riscv64/extra/`, and `/status/` endpoints all returned 404 and `pkgs.org` returned 403 - no package-listing endpoint was reachable. Not counted as evidence either way. |

**Ubuntu 26.04 discrepancy:** one pass of this research fetched `packages.ubuntu.com` search results (via direct `curl` after repeated HTTP 503 via WebFetch) and reported `brotli`, `python3-brotli`, `libbrotli1`, `libbrotli-dev`, `python3-brotlicffi`, and `brotli-rs`, all version 1.2.0-3build1 (brotli-rs 8.0.2-2), listed with riscv64 among their built architectures in resolute/universe. A later, independent adversarial-verification pass queried Debian's `madison.php` cross-distro archive tool (used because `packages.ubuntu.com` was again unreachable) for the same source package and returned, for both resolute and the later "stonking" series, only `amd64, arm64, i386` - riscv64 absent. Both findings are reported here; they cannot both be correct for the same archive state, and this report does not resolve which is stale or in error. This discrepancy does not change the riscv64 readiness color, because Debian sid, Alpine edge, and Chimera Linux independently satisfy the "clean distro build" floor regardless of Ubuntu's status. [NEEDS VERIFICATION - Ubuntu 26.04 riscv64 availability specifically]

**What a user must do to get a working binary today:**
- On Debian sid, Alpine edge, or Chimera Linux (riscv64): install via the system package manager - works out of the box.
- On Ubuntu 26.04: status unresolved per the discrepancy above; verify against the live archive before relying on it.
- On any other riscv64 system: build from source using the procedure in Section 5. No known build failures.
- For the Python binding: `pip install brotli --no-binary brotli` (no official PyPI wheel), or use the RISE `python-wheels` GitLab package index directly for a prebuilt riscv64 wheel (cp312-cp314).

---

## 9. Dependencies

Brotli's external dependency footprint is minimal: `CMakeLists.txt` contains zero `find_package()`/`find_library()`/`find_dependency()` calls, `python/setup.py` has no `install_requires`/`setup_requires`, and the Go modules (`go 1.21`) have no `require` block (stdlib only). There is no JIT engine, no crypto library, no third-party compression library, and no custom allocator - brotli implements its own compression algorithm entirely in self-contained C.

| Dependency | Role | Dependency type | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| CMake | Primary build-system driver for the C library | Build-dependency, critical | Builds cleanly on riscv64; CMake >=3.15 available in all major riscv64 distros | N/A | Available on riscv64 | None |
| GCC | Compiles the C library and CLI tools; also the toolchain used for the (unmerged) RVV benchmarks (`-march=rv64gcv`) | Build-dependency, critical | `gcc-riscv64-linux-gnu` available on Debian/Ubuntu; used by Debian sid, Alpine, and Chimera for their riscv64 builds | N/A | Available on riscv64 | None |
| glibc | Provides `libm`'s `log2()` for internal entropy calculation, detected via `CHECK_LIBRARY_EXISTS(m log2)` | Runtime-dependency, critical | Builds/links cleanly on riscv64 (base system library on every riscv64 glibc distro) | No riscv64-specific test failures on record for brotli's use of libm | Ships in all glibc-based riscv64 distros | None - see the dedicated glibc status report |
| QEMU | Used by `CMakeLists.txt` to wrap cross-compiled test execution for ARM targets only | Test-dependency, optional | N/A | No riscv64-linux-gnu-* branch exists in the CMake cross-compile auto-detection, so QEMU-wrapped test execution on riscv64 cross-builds requires manual `BROTLI_WRAPPER=qemu-riscv64` configuration; no upstream CI job exercises this path for riscv64 at all | N/A | CMakeLists.txt gap: riscv64 is not auto-detected the way arm/aarch64 are |
| setuptools | Drives `python/setup.py` to build the CPython extension from bundled C sources | Build-dependency, optional | Pure Python, architecture-independent; works on riscv64 via pip/apt | N/A | Available on riscv64 | None |
| pkg-config | Used only when `USE_SYSTEM_BROTLI=1` to locate system brotli headers/libs | Build-dependency, optional | Works on riscv64 | N/A | Available in all major riscv64 distros | None |
| yargs (npm) | CLI argument parsing for the pure-JS `js/` implementation's `cli.js` (the sole entry in `js/package.json`) | Indirect/recursed dependency, JS CLI wrapper only | Architecture-independent pure JavaScript; not applicable to native riscv64 build status | N/A | Published on npm, architecture-independent | None |

**Depth analysis:** `libm`/glibc is brotli's only non-trivial runtime dependency and has full riscv64 support across every glibc-based distro checked. No dependency here is a JIT backend, SIMD backend, numerics library, crypto library, compression library, or custom memory allocator requiring deeper recursion; consequently no further 2-3 level recursion was warranted beyond glibc itself.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:** None. The only issue in the tracker matching "riscv"/"riscv64" is [#1267](https://github.com/google/brotli/issues/1267) (closed, state_reason: completed), a downstream riscv-edk2/UEFI build-integration question, not a brotli riscv64-port correctness or performance bug. No open riscv64-specific issues exist. A dedicated NaN/floating-point search on riscv64 returned zero results.

**Architecture-agnostic issues potentially relevant to riscv64 deployments** (carried from prior reporting; not re-verified against the live tracker this pass, so flagged as single-source):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1485](https://github.com/google/brotli/issues/1485) | quality=11 output is larger than quality=1 output for the same input | Open | Medium | Correctness/optimization regression; not architecture-specific. [NEEDS VERIFICATION] |
| [#1389](https://github.com/google/brotli/issues/1389) | C: Compressing large input data triggers an assert (with BROTLI_DEBUG=1) | Open | Low | Debug-build only; not production-affecting. [NEEDS VERIFICATION] |
| [#1411](https://github.com/google/brotli/issues/1411) | CVE-2025-6176 backport request | Open | Medium | Fix present in 1.2.0; downstream distros still shipping 1.0.9 remain exposed; not riscv64-specific. [NEEDS VERIFICATION] |

**RISC-V optimization PRs (unmerged):**

| ID | Title | Status | Blocker |
|---|---|---|---|
| [#1410](https://github.com/google/brotli/pull/1410) | Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions | Open, 1 comment (CLA bot only), no maintainer review | Google CLA not signed by contributor; no maintainer engagement in 6+ months |
| [#1489](https://github.com/google/brotli/pull/1489) | riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV | Closed 2026-06-05 (abandoned) | Author deleted head repository; technically superior to #1410; not rejected on technical grounds - no visible reviewer comments recorded |

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**
- Google CLA is required for all contributions. PR #1410 is stalled because the contributor (ISCAS) has not completed the CLA process - a procedural blocker, not a technical one. An organization with an existing Google Corporate CLA could submit equivalent code without this barrier.
- Single-maintainer bottleneck: all merges require Eugene Kliuchnikov (eustas, Google), who has not commented on PR #1410's code in 6+ months and left PR #1489 without any review before its closure.

**Technical objections:** None documented. The maintainer merged the original riscv64 base port (PR #669) in 2018 after requiring real-hardware validation (not objecting to the architecture, but to QEMU-only testing methodology). PR #1489 received zero technical review, not a rejection; it uses standard RVV 1.0 intrinsics, defines `BROTLI_RVV_1` correctly in `platform.h`, and handles variable-length inputs via `vsetvl` (no hardcoded 16-byte minimum).

**Technical gaps in the unmerged PRs:**
- PR #1410 uses inline assembly instead of intrinsics, references a guard macro (`BROTLI_TARGET_RISCV_RVV`) that is never defined anywhere upstream, and does not touch `memmove16`.
- PR #1489 is technically sound (intrinsics-based, correct macro gating, broader scope) but abandoned when its source branch was deleted; it is suitable for re-submission with minimal modification.

**Acceptance probability:** The maintainer has precedent for accepting architecture ports (PR #669, 2018) and has raised no documented objection to RVV. A re-submission that resolves the CLA, uses PR #1489's intrinsics-based approach, and adds riscv64 CI coverage (which does not exist today in any form) would address every identified blocker.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** No upstream CI for riscv64 exists in google/brotli: all 8 GitHub Actions workflow files (build_test.yml, build_test_wasm.yml, codeql.yml, fuzz.yml, lint.yml, publish_to_bcr.yaml, release.yaml, scorecard.yml) were read directly and contain zero "riscv" references, and upstream publishes no riscv64 release artifact (GitHub Releases ship Windows-only binaries plus source; PyPI has no riscv64 wheel) - see [build_test.yml](https://github.com/google/brotli/blob/master/.github/workflows/build_test.yml) and the [v1.2.0 release assets](https://github.com/google/brotli/releases/tag/v1.2.0). Multiple Linux distributions build brotli for riscv64 from unmodified upstream source (the base riscv64 port has been upstream since [PR #669](https://github.com/google/brotli/pull/669), merged 2018, so no riscv64-specific packaging patches are needed) - Debian sid 1.2.0-3, Alpine edge 1.2.0-r1, and Chimera Linux 1.2.0-r0 - which applies the "clean-distro-build" floor to yellow. Ubuntu 26.04 "resolute" itself was checked both ways in the research (see Section 8): an early claim of riscv64 availability was refuted by a later `madison.php` check showing amd64/arm64/i386 only; this discrepancy does not change the color since Debian, Alpine, and Chimera independently satisfy the floor. Brotli's stated value proposition is compression ratio (an IETF RFC 7932-standardized, higher-ratio replacement for gzip/deflate), not raw processing speed, so it does not trip the optimization-purpose modifier even though two unmerged RVV speed-optimization PRs exist for it.
- **Pending work that could change the grade:** PR #1410 (RVV-accelerated `FindMatchLengthWithLimit`) remains open but has been stalled 6+ months on an unsigned Google CLA with zero maintainer review ([PR #1410](https://github.com/google/brotli/pull/1410)). PR #1489 (broader RVV optimization covering both `FindMatchLengthWithLimit` and `memmove16`, technically superior, claims +14-25% compression speed on Q11) was closed 2026-06-05 after the author deleted the head repository - abandoned, not rejected on merits ([PR #1489](https://github.com/google/brotli/pull/1489)). A re-submission that resolves the CLA and adds riscv64 CI could plausibly merge, given the maintainer's precedent of accepting the original riscv64 port (PR #669, 2018). No riscv64 CI job exists in any current workflow, and no RISE investment exists in the core C library; the only related RISE activity (`riseproject-dev/python-wheels` building riscv64 Python wheels for the `brotli`/`brotlicffi` bindings on native RISE runners) is downstream packaging automation, not upstream CI or a release channel for brotli itself.

---

## 14. Investment Analysis

RISE has not funded or contributed to brotli's upstream RISC-V support. The 2018 base port was an independent community contribution (CERN/Fedora RISC-V community); the RVV optimization work was done by ISCAS researchers (a RISE General Member) without documented RISE program coordination. The one confirmed RISE-funded activity touching brotli - riscv64 Python wheel packaging in `riseproject-dev/python-wheels` - is downstream of the C library and does not touch the gaps below.

### 14.1 Functional Enablement

No functional gaps exist. The library compiles and runs correctly on riscv64 via the scalar C path, and it is packaged by multiple distros from unmodified upstream source. No investment is required for functional enablement.

### 14.2 Performance Optimization

PR #1489 contains a ready-to-recover RVV 1.0 implementation covering both the encoder (`FindMatchLengthWithLimit`) and decoder (`memmove16`) hot paths, with measured gains of 14-25% compression throughput on Q11 and approximately 5% decompression on large files. The work required is: re-fork the deleted PR #1489 code (the diff is recoverable from the PR's description and comparison against PR #1410, since the branch itself was deleted), resolve the contributing organization's Google CLA, and engage the maintainer. A secondary, lower-value opportunity exists in `matching_tag_mask.h`, which has an SSE2 path for amd64 and no SIMD path for either arm64 or riscv64 - riscv64 is not at a relative disadvantage here versus arm64, so this is not a riscv64-specific gap.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists upstream in any of the 8 workflow files, and the CMake cross-compilation logic has no riscv64 branch (unlike its ARM handling), so even a locally cross-compiled riscv64 build does not get automatic QEMU test wrapping today. Adding a riscv64 QEMU (or native-runner) build-and-test job to `build_test.yml`, plus a `riscv64-linux-gnu-*` branch to the CMake cross-compile detection, would close this gap and is the most likely prerequisite for the maintainer to review and merge a RISC-V optimization PR, given the precedent set by PR #669's real-hardware validation requirement.

### 14.4 Ecosystem Enablement

Official PyPI has no riscv64 wheel for `brotli`. This gap is already substantially addressed outside RISE's GitLab wheel_builder index by the RISE GitHub `python-wheels` project, which builds and publishes riscv64 wheels for `brotli` 1.2.0 (cp312-cp314) and `brotlicffi` on native riscv64 hardware runners. Remaining work is limited to either mirroring these wheels onto official PyPI (requires upstream/maintainer coordination, since brotli's own release process does not build wheels for any architecture beyond what's on PyPI today) or listing brotli in the separate RISE GitLab wheel_builder index for parity with that index's other 88 packages.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Re-fork and re-submit PR #1489 (RVV `FindMatchLengthWithLimit` + `memmove16`): resolve CLA, engage maintainer | 1 | Qualcomm or ISCAS with RISE coordination | High |
| CI/CD | Add riscv64 build+test job to `build_test.yml` and a `riscv64-linux-gnu-*` branch to the CMake cross-compile/QEMU-wrapper detection (prerequisite for performance PR acceptance, per the PR #669 precedent) | 0.5-1 | Same submitter as performance PR | High |
| Ecosystem | Formalize/upstream the existing `riseproject-dev/python-wheels` riscv64 brotli wheel output (e.g., toward official PyPI coverage) | 0.5 | RISE python-wheels team | Medium |
| Performance | RVV SIMD tag matching in `matching_tag_mask.h` (currently SSE2-only; riscv64 is at parity with arm64, not behind it) | 1-2 | Qualcomm or ISCAS | Low |

---

## 15. References

- [google/brotli repository](https://github.com/google/brotli)
- [brotli homepage](https://brotli.org/)
- [IETF RFC 7932 (Brotli Compressed Data Format)](https://tools.ietf.org/html/rfc7932)
- [PR #669 - Add RISC-V 64-bit (riscv64) platform configuration (merged 2018-05-22)](https://github.com/google/brotli/pull/669)
- [PR #1410 - Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions (open)](https://github.com/google/brotli/pull/1410)
- [PR #1489 - riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV (closed)](https://github.com/google/brotli/pull/1489)
- [Issue #1267 - riscv-edk2-master build failure (closed, downstream issue)](https://github.com/google/brotli/issues/1267)
- [Issue #1485 - quality=11 output larger than quality=1 (open)](https://github.com/google/brotli/issues/1485)
- [Issue #1389 - Assert on large input with BROTLI_DEBUG=1 (open)](https://github.com/google/brotli/issues/1389)
- [Issue #1411 - CVE-2025-6176 backport request (open)](https://github.com/google/brotli/issues/1411)
- [c/common/platform.h (master)](https://github.com/google/brotli/blob/master/c/common/platform.h)
- [c/enc/find_match_length.h (master)](https://github.com/google/brotli/blob/master/c/enc/find_match_length.h)
- [c/dec/decode.c (master)](https://github.com/google/brotli/blob/master/c/dec/decode.c)
- [c/enc/matching_tag_mask.h (master)](https://github.com/google/brotli/blob/master/c/enc/matching_tag_mask.h)
- [.github/workflows/build_test.yml (master)](https://github.com/google/brotli/blob/master/.github/workflows/build_test.yml)
- [google/brotli v1.2.0 release assets](https://github.com/google/brotli/releases/tag/v1.2.0)
- [Ubuntu 26.04 "resolute" package search: brotli](https://packages.ubuntu.com/search?keywords=brotli&suite=resolute&searchon=names&section=all)
- [Debian madison.php cross-distro archive tool](https://qa.debian.org/madison.php)
- [Alpine Linux edge package: brotli (riscv64)](https://pkgs.alpinelinux.org/package/edge/main/riscv64/brotli)
- [Chimera Linux package: python-brotli (riscv64)](https://pkgs.chimera-linux.org/package/current/main/riscv64/python-brotli)
- [Arch RISC-V port](https://archriscv.felixc.at/)
- [PyPI brotli JSON metadata](https://pypi.org/pypi/brotli/json)
- [RISE GitLab wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE python-wheels riscv64 PyPI index (GitLab package registry)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/brotli/)
- [riseproject-dev/python-wheels GitHub project](https://github.com/riseproject-dev/python-wheels)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog site search for "brotli" (zero results)](https://riseproject.dev/?s=brotli)
- [RISE Working Groups move their project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)