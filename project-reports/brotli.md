---
title: brotli
parent: Project Reports
categories:
  - libraries
---

# brotli
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for brotli
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Brotli is a general-purpose lossless compression algorithm and library developed by Google, standardized as [IETF RFC 7932](https://tools.ietf.org/html/rfc7932). It is widely deployed as the content-encoding for HTTP responses (replacing or complementing gzip/deflate) and is embedded in browsers, web servers, CDNs, and package managers. The library exposes a C API with language bindings for Python, Java, Go, JavaScript, and others.

**Governance:** No foundation. Brotli is a Google-owned open-source project under the [google GitHub organization](https://github.com/google/brotli), licensed MIT. There is no steering committee, no MAINTAINERS file, and no formal tier policy. All merges flow through a single principal maintainer.

**Principal maintainer:** Eugene Kliuchnikov (`eustas`, Google). All substantive PRs require his review and merge approval. Community contributors submit PRs via the standard GitHub flow. New architecture ports require signing the Google Individual or Corporate CLA.

**Corporate sponsors:** Google (primary, funds and employs the principal maintainer). Microsoft maintains the vcpkg port (stated in upstream README). No other corporate sponsorship is documented.

**Community stance on new ports:** The RISC-V base port (PR #669, 2018) was merged by eustas promptly after submission. However, the more recent RVV optimization PRs have received zero maintainer engagement over months. The bottleneck is CLA compliance and single-maintainer review bandwidth, not philosophical opposition to new architectures.

**RISE membership:** Google is a Premier Member of the RISE Project. Brotli is not listed in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) package index and no RISE blog post mentions brotli. RISE has made no investment in brotli's RISC-V support.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-05-22 | PR #669 merged: "Add RISC-V 64-bit (riscv64) platform configuration." Adds `BROTLI_TARGET_RISCV64` macro to `c/common/platform.h`, enabling 64-bit word-size path and fast-unaligned-read path for riscv64. Tested on SiFive HiFive Unleashed board. | [PR #669](https://github.com/google/brotli/pull/669) |
| 2025-12-26 | PR #1410 opened: "Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions." RVV inline-asm path for the compression hot-path. CLA not signed; no maintainer review as of June 2026. | [PR #1410](https://github.com/google/brotli/pull/1410) |
| 2026-05-31 | PR #1489 opened: "riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV." Supersedes #1410 with intrinsics, correct platform detection, and broader decoder coverage. No maintainer review. | [PR #1489](https://github.com/google/brotli/pull/1489) |
| 2026-06-05 | PR #1489 closed: author (Felix-Gong, ISCAS) deleted the head repository. Not rejected on technical grounds. | [PR #1489](https://github.com/google/brotli/pull/1489) |

**Key contributors:**

- David Abdurachmanov (`davidlt`, CERN / Fedora RISC-V community): authored and submitted the original riscv64 base port in 2018. Affiliation at time of contribution: CERN/Fedora RISC-V community.
- Dayuxiaoshui / gong-flying (`gongxiaofei24@iscas.ac.cn`, Institute of Software, Chinese Academy of Sciences): authored PR #1410.
- Felix-Gong (ISCAS): authored the technically superior PR #1489, which was abandoned due to branch deletion, not rejection.

**Upstreaming status:** The base port is fully upstream (compiles and links on riscv64 since 2018). No RVV optimization code has been merged. There is no outstanding tracking issue for a riscv64 port; riscv64 build support is considered complete by upstream.

---

## 3. Upstream Support Tier

Brotli has no published tier policy. Support level is inferred from CI coverage, release artifacts, and maintainer behavior.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (multiple, primary) | Partial (iOS cross-compile, no test execution) | None |
| CI test execution | Yes | No | No |
| QEMU CI test job | No | No (not in matrix) | No |
| Upstream binary releases | Yes (Windows x64) | Yes (Windows arm64) | No |
| PyPI pre-built wheels | Yes (manylinux, musllinux) | Yes (aarch64 manylinux, musllinux) | No |
| Distro packages (Debian/Ubuntu) | Yes | Yes | Yes |
| Architecture-specific SIMD | SSE2 tag matching | NEON memmove16 | None (unmerged PRs) |
| Maintainer engagement on arch PRs | N/A | N/A | None (PR #1410 CLA-blocked 6+ months, PR #1489 zero comments) |

**Assessment:** riscv64 is an untested, unofficially-supported architecture at the upstream level. The library compiles and produces correct output on riscv64, and distros ship it, but upstream CI provides no build or test coverage, and upstream ships no riscv64 binaries. There is no stated tier definition, but behavior is consistent with "best-effort community port."

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Brotli's architecture-specific code is concentrated in three locations: `c/common/platform.h` (macro detection and feature flags), `c/enc/find_match_length.h` (hot-path vectorization of byte-comparison in the encoder), and `c/dec/decode.c` (memmove16 in the decoder). There is no JIT, no crypto code, and no GC. All arch-specific code uses `#ifdef` guards in shared files; there is no `arch/` subdirectory.

### Component-level status

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Target detection macro | `platform.h` | `BROTLI_TARGET_X64` | `BROTLI_TARGET_ARMV8_64` | `BROTLI_TARGET_RISCV64` (detection only) |
| 64-bit word-size path | `platform.h` | Enabled | Enabled | Enabled (via `BROTLI_TARGET_64_BITS`) |
| Fast unaligned read | `platform.h` | Enabled | Enabled | Enabled (listed in `BROTLI_UNALIGNED_READ_FAST` group) |
| `FindMatchLengthWithLimit` vectorized | `find_match_length.h` | No dedicated SIMD path (uses 8-byte TZCNT64 scalar) | No dedicated path | No dedicated path (PRs #1410, #1489 unmerged) |
| `memmove16` fast path (decoder) | `decode.c` | Generic `memcpy` | NEON: `vld1q_u8`/`vst1q_u8` | Generic `memcpy` (PR #1489 unmerged) |
| SIMD tag matching | `matching_tag_mask.h` | SSE2 intrinsics (`__SSE2__`/`_M_AMD64`) | Scalar fallback | Scalar fallback |
| Prefetch | `platform.h` | `_mm_prefetch` (MSVC) | `prfm` inline asm (aarch64) | `__builtin_prefetch` (generic) |
| `BROTLI_MAX_SIMD_QUALITY` | `platform.h` | 7 (_M_X64) | 6 (if TZCNT64) | 6 (generic TZCNT64 path) |
| RVV intrinsics path | -- | N/A | N/A | Missing (unmerged) |
| Inline assembly | -- | Minimal | One block (prefetch) | None |

**Detail on unmerged RISC-V work:**

PR #1489 is the technically authoritative implementation. It defines `BROTLI_RVV_1` in `platform.h` as:

```c
#if defined(BROTLI_TARGET_RISCV64) && defined(__riscv_v) && __riscv_v >= 1000000
#define BROTLI_RVV_1
#endif
```

It replaces the `memmove16` body in `decode.c` with:

```c
size_t vl = __riscv_vsetvl_e8m1(16);
vuint8m1_t v = __riscv_vle8_v_u8m1(src, vl);
__riscv_vse8_v_u8m1(dst, v, vl);
```

And replaces `FindMatchLengthWithLimit` in `find_match_length.h` with a loop using `__riscv_vsetvl_e8m1(limit)`, `__riscv_vle8_v_u8m1`, `__riscv_vmsne_vv_u8m1_b8`, and `__riscv_vfirst_m_b8`, which handles variable-length inputs without a hardcoded 16-byte minimum. This is a correct, portable RVV 1.0 implementation.

PR #1410 uses inline assembly instead of intrinsics and does not define the guard macro in `platform.h`, which creates a risk of dead code (the guard `BROTLI_TARGET_RISCV_RVV` is referenced but never defined in any upstream file). PR #1489 corrects all these issues.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Native build on riscv64 (standard):**

```
mkdir out && cd out
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=./installed ..
cmake --build . --config Release --target install
```

CMake minimum required: 3.15 (the README notes Ubuntu 20.04 ships 3.16.3). No explicit GCC/Clang minimum is stated. GCC 7+ supports the riscv64 target triplet; Debian and Ubuntu ship GCC 12+ in `gcc-riscv64-linux-gnu`.

**Cross-compilation (manual, not in upstream CI):**

The `CMakeLists.txt` auto-configures a QEMU wrapper for `arm-linux-gnueabihf-*`, `arm-linux-gnueabi-*`, and `aarch64-linux-gnu-*` compiler prefixes only. There is no `riscv64-linux-gnu-*` pattern. Manual cross-compilation requires:

```
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  ..
```

Required APT packages on Ubuntu/Debian:

```
gcc-riscv64-linux-gnu libc6-dev-riscv64-cross qemu-user
```

To run tests under QEMU after cross-compilation, set manually (not auto-detected):

```
cmake -DBROTLI_WRAPPER=qemu-riscv64 \
      -DBROTLI_WRAPPER_LD_PREFIX=/usr/riscv64-linux-gnu \
      ...
```

**Relevant CMake flags for riscv64:**

| Flag | Effect |
|---|---|
| `-DBROTLI_BUILD_64_BIT=ON` | Force 64-bit optimization path (auto-detected via `BROTLI_TARGET_RISCV64`) |
| `-DBROTLI_BUILD_NO_UNALIGNED_READ_FAST=ON` | Disable fast unaligned reads if needed |
| `-DBROTLI_BUILD_ENDIAN_NEUTRAL=ON` | Disable endian-aware optimizations |
| `-DBUILD_SHARED_LIBS=OFF` | Static-only build |
| `-DBROTLI_BUILD_TOOLS=OFF` | Skip CLI tool build |

**Known build failures:** None documented. Debian sid successfully built brotli 1.2.0-3 for riscv64 on builder `rv-manda-02` (approximately 136 days before the research date). No riscv64 build failures are recorded in open issues.

**Toolchain version note:** GCC 15.1.0 was used for the PR #1489 benchmark. GCC 12+ is sufficient for RVV 1.0 intrinsics via `-march=rv64gcv`. There is no Dockerfile for riscv64 in the repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

No functional gaps. Brotli compiles, links, and produces correct output on riscv64. All 28 roundtrip and 22 compatibility tests pass on riscv64 per the PR #1489 benchmark report [NEEDS VERIFICATION -- this test result was reported by the PR author, not confirmed by upstream CI].

### Performance gaps

| Operation | amd64 advantage over riscv64 | arm64 advantage over riscv64 | Source |
|---|---|---|---|
| `FindMatchLengthWithLimit` (encoder hot-path) | Equivalent: both use 8-byte TZCNT64 scalar path | Equivalent: same scalar path | [platform.h](https://github.com/google/brotli/blob/master/c/common/platform.h), [find_match_length.h](https://github.com/google/brotli/blob/master/c/enc/find_match_length.h) |
| SIMD tag matching (encoder) | SSE2 path exists | No SIMD path | [matching_tag_mask.h](https://github.com/google/brotli/blob/master/c/enc/matching_tag_mask.h) |
| `memmove16` (decoder hot-path) | Generic memcpy | NEON: `vld1q_u8`/`vst1q_u8` | [decode.c](https://github.com/google/brotli/blob/master/c/dec/decode.c) |
| RVV-optimized `FindMatchLengthWithLimit` | N/A | N/A | +14-25% compression speedup achievable (PR #1489 data) |

**Quantified RVV gap:** Based on PR #1489 measurements (RISC-V 64-bit server, GCC 15.1.0, `-O2 -march=rv64gcv`, Q11):

- lcet10.txt: +25.1% compression throughput with RVV vs. scalar baseline
- alice29.txt: +25.0% compression throughput
- bb.binast: +14.4% compression throughput
- Decompression: approximately +5% on large files (memmove16 path)

Based on PR #1410 measurements (GCC 12.3.1, `-O3 -march=rv64gcv`, 100 iterations):

- Compression: +2.16% average, +7.56% peak (1 MB file)
- Decompression: +2.66% average

The discrepancy between PR #1410 (+2-8%) and PR #1489 (+14-25%) reflects different test environments (GCC 12 vs. GCC 15, `-O3` vs. `-O2`), different datasets, and broader scope in PR #1489 (covers both encoder and `memmove16` decoder path). No absolute MB/s figures are available from either source.

### Security hardening gaps

None identified specific to riscv64. No architecture-specific hardening code (stack canaries, CFI, shadow stacks) exists in brotli's C source.

### Floating-point / NaN issues

No floating-point correctness bugs involving riscv64 are documented. Brotli uses `log2()` from libm (for internal entropy calculations); no NaN or rounding-mode issues have been reported. The only historical floating-point-adjacent issue (closed issue #693, Intel Compiler 18 regression) was unrelated to RISC-V.

---

## 7. CI/CD Infrastructure

All 8 workflow files under `.github/workflows/` were read directly. No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` exists in the repository.

| Workflow file | riscv64 coverage |
|---|---|
| `build_test.yml` | None. Matrix: ubuntu-latest (x86), ubuntu-22.04 (x86), macOS, Windows, one QEMU ARMv7/NEON entry |
| `build_test_wasm.yml` | None |
| `codeql.yml` | None |
| `fuzz.yml` | None |
| `lint.yml` | None |
| `publish_to_bcr.yaml` | None |
| `release.yaml` | None |
| `scorecard.yml` | None |

**Summary comparison:**

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (multiple jobs) | Partial (iOS cross-compile only, tests skipped) | None |
| Test execution in CI | Yes | No | No |
| QEMU-based test job | No | No | No |
| RISE-provided runners | No | No | No |
| Hardware runner | x86 GitHub-hosted | None | None |

The only non-x86 CI that exists is a single QEMU entry for 32-bit ARMv7 with NEON. riscv64 has zero CI coverage of any kind in upstream.

---

## 8. Distribution and Release Status

**Upstream binary releases:** The [v1.2.0 release](https://github.com/google/brotli/releases/tag/v1.2.0) provides Windows-only binaries (arm64, x64, x86). No Linux binaries are shipped for any architecture. No riscv64 binary is present in any upstream release.

**PyPI wheels:** Verified via the [PyPI JSON API](https://pypi.org/pypi/brotli/1.1.0/json). Wheel matrix covers: x86_64, i686, aarch64, ppc64le (manylinux and musllinux), macOS (x86_64, universal2), Windows (win32, win_amd64). No riscv64 wheel exists for any published version. Python users on riscv64 must build from source.

**RISE wheel builder:** [riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/) lists 76 packages. Brotli is not among them. Querying the RISE PyPI index for brotli redirects to the standard PyPI index.

**Distro packages:**

| Distribution | riscv64 status | Version | Notes |
|---|---|---|---|
| Debian sid | Installed | 1.2.0-3 | Built on builder `rv-manda-02`, approximately 136 days before research date. Source: [Debian buildd](https://buildd.debian.org/status/package.php?p=brotli&suite=sid). |
| Ubuntu 24.04 (noble) | Available | Tracks Debian | Packages: `brotli`, `libbrotli1`, `libbrotli-dev`, `python3-brotli`, nginx modules. Source: [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=brotli&suite=noble&searchon=names&section=all). |
| Arch Linux RISC-V | Unknown | Unknown | [archriscv.felixc.at](https://archriscv.felixc.at/) returned no queryable data during research. |

**What a user must do to get a working binary:**

- On Debian or Ubuntu riscv64: `apt install libbrotli1 libbrotli-dev brotli` - works out of the box.
- On any other riscv64 system: build from source using the cmake procedure in Section 5. No known build failures.
- For the Python binding on riscv64: build from source via `pip install brotli --no-binary brotli`. No pre-built wheel is available from PyPI or RISE.

---

## 9. Dependencies

Brotli's external dependency footprint is minimal. The `CMakeLists.txt` contains zero `find_package()` calls. There is no JIT engine, no crypto library, and no third-party allocator.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libm (glibc) | `log2()` for internal entropy; detected via `CHECK_LIBRARY_EXISTS(m log2)` | Passes: Debian brotli 1.2.0-3 builds cleanly on rv-manda-02 | No riscv64-specific failures on record | Ships in all glibc-based riscv64 distros | None |
| setuptools (Python binding build only) | Drives `python/setup.py`; bundles brotli C sources into the CPython extension | Works (pure Python) | N/A | Available on riscv64 via pip | None |
| pkg-config (Python binding, optional) | Used when `USE_SYSTEM_BROTLI=1` to locate system brotli headers/libs | Works on riscv64 | N/A | Available in all major riscv64 distros | None |
| RVV path (unmerged) | Architecture-optimized `FindMatchLengthWithLimit` and `memmove16` via RISC-V Vector Extension | Not present in upstream | N/A | N/A | PR #1410 CLA-blocked; PR #1489 abandoned |
| PyPI riscv64 wheel | Pre-built CPython wheel | Not released | N/A | Not released | Not in manylinux/musllinux build matrix |

**Depth analysis:** libm is brotli's only non-trivial runtime dependency. glibc/libm has full riscv64 support in Debian/Ubuntu. No further recursion is needed.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:**

None. No open issues in [google/brotli](https://github.com/google/brotli) address riscv64 correctness or performance bugs.

**Architecture-agnostic issues relevant to riscv64 deployments:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1485](https://github.com/google/brotli/issues/1485) | quality=11 output is larger than quality=1 output for the same input | Open | Medium | Correctness/optimization regression; not architecture-specific |
| [#1389](https://github.com/google/brotli/issues/1389) | C: Compressing large input data triggers an assert (with BROTLI_DEBUG=1) | Open | Low | Debug-build only; not production-affecting |
| [#1411](https://github.com/google/brotli/issues/1411) | CVE-2025-6176 backport request | Open | Medium | Fix present in 1.2.0; downstream distros still shipping 1.0.9 remain exposed; not riscv64-specific |

**RISC-V optimization PRs (unmerged):**

| ID | Title | Status | Blocker |
|---|---|---|---|
| [#1410](https://github.com/google/brotli/pull/1410) | Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions | Open, no review | Google CLA not signed by contributor; no maintainer engagement in 6+ months |
| [#1489](https://github.com/google/brotli/pull/1489) | riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV | Closed (abandoned) | Author deleted head repository; technically superior implementation to #1410; not rejected on technical grounds |

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

- Google CLA required for all contributions. PR #1410 is stalled because the contributor (ISCAS) has not completed the CLA process. This is a procedural blocker, not a technical one. Qualcomm or another RISE member with an existing Google Corporate CLA could submit equivalent code without this barrier.
- Single-maintainer bottleneck: all merges require Eugene Kliuchnikov (eustas, Google). He has not commented on PR #1410 in over 6 months. Engagement probability increases if the submitting organization has an existing relationship with Google or if the work is submitted by a known contributor.

**Technical objections:**

None documented. The maintainer merged the original riscv64 base port (PR #669) in 2018 without objection. PR #1489 received zero technical review, not a rejection. The implementation in PR #1489 is correct: it uses standard RVV 1.0 intrinsics, proper `BROTLI_RVV_1` macro definition in `platform.h`, and handles variable-length inputs via `vsetvl` (no hardcoded 16-byte minimum, unlike PR #1410).

**Technical gaps in existing PRs:**

- PR #1410: uses inline assembly instead of intrinsics; references undefined guard macro `BROTLI_TARGET_RISCV_RVV` (not defined in any upstream file); does not patch `memmove16`. Needs rework.
- PR #1489: technically sound but abandoned. The implementation is suitable for re-submission with minimal modification.

**Acceptance probability:**

High for a well-prepared submission that: (a) resolves CLA, (b) adds riscv64 QEMU CI coverage, (c) uses PR #1489's intrinsics-based approach. The maintainer has precedent of accepting architecture ports and has no documented objection to RVV.

---

## 13. Investment Analysis

RISE has not funded or contributed to brotli's RISC-V support. The existing base port (2018) was community-contributed. The RVV optimization work was done by ISCAS researchers without RISE coordination.

### 13.1 Functional Enablement

No functional gaps exist. The library compiles and runs correctly on riscv64. No investment required for functional enablement.

### 13.2 Performance Optimization

PR #1489 contains a ready-to-submit RVV 1.0 optimization covering both the encoder (`FindMatchLengthWithLimit`) and decoder (`memmove16`). The implementation is technically correct. The work required is: (a) re-fork the PR #1489 code, (b) resolve CLA, (c) engage the maintainer. Measured gains: 14-25% compression throughput on Q11, approximately 5% decompression on large files.

A broader optimization opportunity exists for SIMD tag matching in `matching_tag_mask.h`, which today has an SSE2 path for amd64 and no SIMD path for arm64 or riscv64. The benefit is smaller (not a hot path for most workloads) and is lower priority.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists upstream. Adding a QEMU-based riscv64 test job to `build_test.yml` would close this gap and is the most likely prerequisite for the maintainer to merge a RISC-V optimization PR.

### 13.4 Ecosystem Enablement

PyPI has no riscv64 wheel for brotli. Adding brotli to the RISE wheel builder would address this and reduce friction for Python users on riscv64. The Python binding builds cleanly from source; the primary gap is automation of the wheel matrix.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Re-submit PR #1489 (RVV `FindMatchLengthWithLimit` + `memmove16`): resolve CLA, add QEMU CI, engage maintainer | 1 | Qualcomm or ISCAS with RISE coordination | High |
| CI/CD | Add riscv64 QEMU build+test job to `build_test.yml` (prerequisite for perf PR acceptance) | 0.5 | Same submitter as performance PR | High |
| Ecosystem | Add brotli to RISE wheel builder for riscv64 PyPI wheels | 0.5 | RISE wheel builder team | Medium |
| Performance | RVV SIMD tag matching in `matching_tag_mask.h` (currently SSE2 only) | 1-2 | Qualcomm or ISCAS | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/brotli repository](https://github.com/google/brotli)
- [brotli homepage](https://brotli.org/)
- [IETF RFC 7932 (Brotli Compressed Data Format)](https://tools.ietf.org/html/rfc7932)
- [PR #669 -- Add RISC-V 64-bit (riscv64) platform configuration (merged 2018-05-22)](https://github.com/google/brotli/pull/669)
- [PR #1410 -- Optimize FindMatchLengthWithLimit with RISC-V RVV vector instructions (open)](https://github.com/google/brotli/pull/1410)
- [PR #1489 -- riscv: optimize FindMatchLengthWithLimit and memmove16 with RVV (closed)](https://github.com/google/brotli/pull/1489)
- [Issue #1267 -- riscv-edk2-master build failure (closed, downstream issue)](https://github.com/google/brotli/issues/1267)
- [Issue #1485 -- quality=11 output larger than quality=1 (open)](https://github.com/google/brotli/issues/1485)
- [Issue #1389 -- Assert on large input with BROTLI_DEBUG=1 (open)](https://github.com/google/brotli/issues/1389)
- [Issue #1411 -- CVE-2025-6176 backport request (open)](https://github.com/google/brotli/issues/1411)
- [c/common/platform.h (master)](https://github.com/google/brotli/blob/master/c/common/platform.h)
- [c/enc/find_match_length.h (master)](https://github.com/google/brotli/blob/master/c/enc/find_match_length.h)
- [c/dec/decode.c (master)](https://github.com/google/brotli/blob/master/c/dec/decode.c)
- [c/enc/matching_tag_mask.h (master)](https://github.com/google/brotli/blob/master/c/enc/matching_tag_mask.h)
- [.github/workflows/build_test.yml (master)](https://github.com/google/brotli/blob/master/.github/workflows/build_test.yml)
- [Debian buildd status for brotli (sid)](https://buildd.debian.org/status/package.php?p=brotli&suite=sid)
- [Ubuntu 24.04 noble package search: brotli](https://packages.ubuntu.com/search?keywords=brotli&suite=noble&searchon=names&section=all)
- [PyPI brotli 1.1.0 JSON metadata](https://pypi.org/pypi/brotli/1.1.0/json)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog](https://riseproject.dev/blog)
- [google/brotli v1.2.0 release assets](https://github.com/google/brotli/releases/tag/v1.2.0)