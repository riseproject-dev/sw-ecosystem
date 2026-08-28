---
title: simdutf
parent: Project Reports
categories:
  - libraries
---

# simdutf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for simdutf
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

simdutf is a C++ library for high-throughput Unicode transcoding (UTF-8, UTF-16, UTF-32, Latin-1) and Base64 encode/decode. It selects SIMD backends at runtime based on hardware capability detection and falls back to portable scalar code when no SIMD backend matches. The library is header-friendly; it ships a single-file amalgamation (simdutf.cpp + simdutf.h) as its primary distribution artifact. There are no mandatory external dependencies. Dual-licensed Apache 2.0 / MIT.

**Governance.** No foundation membership, no steering committee, no formal governance document. Decision authority rests entirely with lead maintainer Daniel Lemire (professor, Universite du Quebec TELUQ). There is no documented process for accepting ports; the RVV port was reviewed and merged at maintainer discretion.

**Corporate sponsors.** None listed in any governance file or on the project website. Major consumers (Node.js, Bun, Chromium, WebKit, Cloudflare, Oracle GraalJS) are downstream users, not sponsors.

**Key contributors and affiliations:**

| Contributor | Role | Affiliation |
|---|---|---|
| Daniel Lemire (lemire) | Lead maintainer | Universite du Quebec TELUQ (academic) |
| Wojciech Mula (WojciechMula) | Core collaborator, RVV optimization | Independent (0x80.pl, Poland) |
| Olaf Bernstein (camel-cdr) | RVV backend author, CI | Independent (no listed affiliation) |
| Paul Dreik (pauldreik) | Fuzzing, test infrastructure | Independent (Stockholm, Sweden) |
| tantei3 | RVV contributor (2025) | No affiliation listed |
| sleepingeight | RVV contributor (2026) | No affiliation listed |

**Community stance on new ports.** Receptive. The RVV port went from initial issue to merge in 67 days. Lemire personally merged it and later contributed bug fixes. No stated policy on minimum hardware or performance requirements for accepting new ports. Maintainer has stated "the whole RVV thing is experimental as far as performance goes" (comment on [PR #890](https://github.com/simdutf/simdutf/pull/890), 2026-02-05), which sets expectations but does not indicate hostility.

**RISE Project involvement.** None. A review of all 26 RISE Project blog posts and all 31 riseproject-dev GitHub repositories found zero mentions of simdutf. simdutf is not listed in the RISE wheel builder (87 packages reviewed). No RISE funding or contribution activity found.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-04-02 | [PR #223](https://github.com/simdutf/simdutf/pull/223) merged: initial `riscv64` architecture detection macro (`#define SIMDUTF_IS_RISCV64`), enabling riscv64 in `isadetection.h`. Author: luyahan. | GitHub |
| 2024-01-10 | [Issue #362](https://github.com/simdutf/simdutf/issues/362) opened by camel-cdr proposing a complete RVV backend with benchmarks on C908 and C920 hardware (1.2x-10.5x range over scalar). | GitHub |
| 2024-02-29 | [PR #373](https://github.com/simdutf/simdutf/pull/373) opened by camel-cdr: complete vectorization of all UTF conversion functions using RVV 1.0. Requires Clang 17+ or GCC 14+ (GCC 13.2.0 excluded due to codegen bug). Targets VLEN >= 128. | GitHub |
| 2024-03-18 | PR #373 merged by lemire. First RVV release: v5.0.0. Average speedup on C908: 3.34x-3.42x over scalar. | GitHub |
| 2024-04-01 | v5.1.0: fixed RVV UTF-8 validation bug found post-merge. | GitHub |
| 2024-04-22 | [PR #410](https://github.com/simdutf/simdutf/pull/410) merged: fixed wrong error index in UTF-16-to-UTF-32 (placeholder idx=0) and infinite loop when vl=1 caused vl=0 in next iteration, both found on Kendryte k230 hardware. Author: WojciechMula. | GitHub |
| 2024-08-09 | [PR #489](https://github.com/simdutf/simdutf/pull/489) merged: five-commit fix for bugs in RVV UTF-8-to-Latin1 conversion (type cast errors). Author: lemire. | GitHub |
| 2024-08-18 | [PR #533](https://github.com/simdutf/simdutf/pull/533) merged: tests for RVV correctness bugs in `validate_utf32_with_errors` and `convert_utf16le_to_utf32_with_errors`, discovered via fuzzing. Author: pauldreik. | GitHub |
| 2024-11-19 | [PR #591](https://github.com/simdutf/simdutf/pull/591) merged: updated RVV CI configuration; limits RVV intrinsics to target region only; increases QEMU test timeout to fix flakiness. Author: camel-cdr. | GitHub |
| 2025-01-09 | [PR #641](https://github.com/simdutf/simdutf/pull/641) merged: regression test for QEMU fuzzer finding (rvv_vl_half_avl=on caused wrong byte count in UTF-8 to UTF-16LE conversion). Author: pauldreik. | GitHub |
| 2025-03-31 | [PR #730](https://github.com/simdutf/simdutf/pull/730) merged: fixed signed-char right-shift UB in `rvv_count_valid_utf8` (fixes issue #728). Author: lemire. | GitHub |
| 2025-04-10 to 2025-05-13 | PRs #739, #745, #759, #777, #779, #788: RVV simplifications and performance improvements to UTF-32/UTF-8/UTF-16 paths. Authors: WojciechMula, lemire. | GitHub |
| 2025-06-17 | [PR #810](https://github.com/simdutf/simdutf/pull/810) merged: RVV `find` function for char and char16_t. Author: tantei3. Released in v7.3.1. | GitHub |
| 2025-09-04 to 2025-10-11 | PRs #836, #838, #842: `validate_utf16_as_ascii`, `to_well_formed_utf16`, mask-shift improvement for `utf16fix_block_rvv`. Authors: tantei3, camel-cdr. Released in v7.5.0. | GitHub |
| 2026-02-05 | [PR #931](https://github.com/simdutf/simdutf/pull/931) merged: `override` annotations for RVV, LASX, LSX classes. Released in v8.1.0 (2026-03-07). | GitHub |
| 2026-01-01 | [PR #890](https://github.com/simdutf/simdutf/pull/890) opened: RVV `utf8_length_from_utf16le/be_with_replacement`. Pending merge as of research snapshot. | GitHub |
| 2026-06-25 | [PR #996](https://github.com/simdutf/simdutf/pull/996) opened: RVV vectorized `binary_to_base64` (strided loads/stores, indexed gather); no reviewer assigned. | GitHub |

The RVV port is fully upstream. No patches are carried out-of-tree. The implementation lives in `src/rvv/` (10 files) and is gated by `SIMDUTF_IMPLEMENTATION_RVV` in `src/implementation.cpp`.

---

## 3. Upstream Support Tier

No formal tier policy document exists in the simdutf repository. Support tier is inferred from observable evidence.

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI workflows | Yes (multiple) | Yes (multiple) | Yes (3 workflows) |
| CI on every push/PR to master | Yes | Yes | Yes |
| Native hardware runners | Yes (GitHub hosted) | Yes (GitHub hosted) | No -- QEMU only |
| Release-blocking failures | Yes | Yes | Not documented, but CI is required to pass |
| Official prebuilt binaries | No (source only for all) | No (source only for all) | No (source only for all) |
| Debian package | Yes | Yes | Yes (v8.2.0-1, installed) |
| Fuzzing investment | Yes | Yes | Yes (QEMU-based) |
| SIMD backend | Yes (multiple ISA levels) | Yes (NEON + SVE partial) | Yes (RVV + Zvbb) |

The riscv64 tier is below amd64 and arm64 on one axis only: no native hardware CI runner. On all other axes -- dedicated CI, merged SIMD backend, active bug-fixing, Debian packaging -- riscv64 is treated as a supported architecture. [NEEDS VERIFICATION: whether CI failures on riscv64 actually block merges in practice; no branch protection rules document was found.]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

simdutf has no JIT, no GC, no cryptographic primitives, and no assembly (.S) files. The architecture-specific work is entirely SIMD intrinsics in C++.

**Component coverage by architecture:**

| Component | amd64 (icelake/haswell) | arm64 (NEON) | riscv64 (RVV) |
|---|---|---|---|
| UTF-8 validation | Intrinsics (AVX-512 / AVX2) | Intrinsics (NEON) | Intrinsics (RVV) |
| UTF-16 validation | Intrinsics | Intrinsics | Intrinsics (RVV + Zvbb dispatch) |
| UTF-32 validation | Intrinsics | Intrinsics | Intrinsics (RVV) |
| ASCII validation | Intrinsics | Intrinsics | Intrinsics (RVV) |
| UTF-8 to UTF-16/32/Latin-1 | Intrinsics | Intrinsics | Intrinsics (RVV) |
| UTF-16 to UTF-8/32/Latin-1 | Intrinsics | Intrinsics | Intrinsics (RVV); 4-byte supplementary plane scalar tail |
| UTF-32 to UTF-8/16/Latin-1 | Intrinsics | Intrinsics | Intrinsics (RVV); scalar fallback for supplementary plane codepoints in UTF-32-to-UTF-8 only |
| Latin-1 to UTF-8/16/32 | Intrinsics | Intrinsics | Intrinsics (RVV) |
| Length calculations (all 10) | Intrinsics | Intrinsics | Intrinsics (RVV) -- no scalar fallbacks |
| UTF-16 fix / to_well_formed | Intrinsics | Intrinsics | Intrinsics (RVV + Zvbb) |
| Endianness swap (UTF-16) | Intrinsics | Intrinsics | Intrinsics (Zvbb `vrev8` or V fallback) |
| find (char, char16_t) | Intrinsics (icelake only) | Intrinsics (arm64) | Intrinsics (RVV: `vmseq` + `vfirst_m`) |
| Base64 encode | Intrinsics (icelake, AVX2) | Intrinsics (NEON) | Scalar only -- PR #996 open, unreviewed |
| Base64 decode | Intrinsics (icelake, AVX2) | Intrinsics (NEON) | Scalar only -- no open PR for decode |
| UTF-16/UTF-8 with-replacement | Intrinsics | Intrinsics | Scalar (4 functions delegate to scalar replacement path) |
| detect_encodings | Intrinsics | Intrinsics | Partial -- uses RVV validation internally; TODO comment: "reimplement as a one-pass algorithm" |

**ISA extension usage in the RVV backend:**

| Extension | Role | Detection |
|---|---|---|
| RVV 1.0 (V extension) | Primary SIMD engine for all UTF operations | Linux hwprobe syscall 258; compile-time `SIMDUTF_IS_RISCV64` + `-march=rv64gcv` |
| Zvbb | Byte-reversal (`vrev8`) for all UTF-16 BE and UTF-32 BE paths | hwprobe bit 17 (`SIMDUTF_RISCV_HWPROBE_EXT_ZVBB = 1 << 17`); runtime `supports_zvbb()` check |
| Zba/Zbb | Not used | -- |

Minimum compiler: GCC 14 or Clang 17 (required for RVV 1.0 intrinsic headers). GCC 13.2.0 is explicitly excluded in the RVV backend due to codegen bugs. Zvbb intrinsics require Clang 18 for the `-march=rv64gcv_zvbb` flag.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain files shipped in the repository:**

- `cmake/toolchains-ci/riscv64-linux-gnu.cmake` -- used by all three CI workflows:
  ```
  CMAKE_SYSTEM_NAME=Linux
  CMAKE_SYSTEM_PROCESSOR=riscv64
  CMAKE_CROSSCOMPILING_EMULATOR=qemu-riscv64-static
  ```

- `cmake/toolchains-dev/riscv64.cmake` -- developer cross-compile; pins GCC 14; adds `-march=rv64gcv`.

- `cmake/toolchains-dev/rvv-spike.cmake` -- Spike ISA simulator; pins GCC 13; requires `spike` and `pk` on PATH; uses static linkage (`-static`); emulator invocation: `spike --isa=rv64gcv pk`.

**Exact CI build commands:**

VLEN=128, Clang 17:
```
CXX=clang++-17 CC=clang-17 \
CFLAGS="--target=riscv64-linux-gnu -march=rv64gcv" \
CXXFLAGS="--target=riscv64-linux-gnu -march=rv64gcv" \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
```

VLEN=256, GCC 14:
```
CXX=riscv64-linux-gnu-g++-14 CC=riscv64-linux-gnu-gcc-14 \
CXXFLAGS=-march=rv64gcv \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
```

VLEN=1024, Clang 18 + Zvbb:
```
CXX=clang++-18 CC=clang-18 \
CFLAGS="--target=riscv64-linux-gnu -march=rv64gcv_zvbb" \
CXXFLAGS="--target=riscv64-linux-gnu -march=rv64gcv_zvbb" \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
```

**QEMU test invocations:**

| VLEN | QEMU_CPU string | zvbb |
|---|---|---|
| 128 | `rv64,v=on,vlen=128,rvv_ta_all_1s=on,rvv_ma_all_1s=on` | no |
| 256 | `rv64,v=on,zvbb=on,vlen=256,rvv_ta_all_1s=on,rvv_ma_all_1s=on` | yes |
| 1024 | `rv64,v=on,zvbb=on,vlen=1024,rvv_ta_all_1s=on,rvv_ma_all_1s=on` | yes |

VLEN=512 is not tested in CI. Whether CI covers VLEN=512 corner cases is unknown.

**Minimum toolchain versions and rationale:**

| Tool | Minimum | Reason |
|---|---|---|
| GCC (cross) | 14 | First upstream release with full RVV 1.0 intrinsic support (`-march=rv64gcv`) |
| Clang | 17 | Required for `-march=rv64gcv` cross-compilation target |
| Clang | 18 | Required for `-march=rv64gcv_zvbb` (Zvbb bit-manipulation extension) |
| CMake | 3.18 | Project minimum; 3.18 added riscv64 cross-compile support |
| qemu-user-static | Any recent | Invoked via `CMAKE_CROSSCOMPILING_EMULATOR` |

**Known historical build failure:** [Issue #393](https://github.com/simdutf/simdutf/issues/393) -- CMake passed x86-specific flags (`-mno-avx256-split-unaligned-load/store`) to riscv64-linux-gnu-g++-13 without architecture guarding. Fixed. [NEEDS VERIFICATION: whether the fix is still in the current CMakeLists.txt; no explicit confirmation in research findings.]

**Native riscv64 quick build (from README):**
```
CXXFLAGS=-march=rv64gcv cmake -B build
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (operations with no SIMD on riscv64):**

1. **Base64 encode and decode.** Both `binary_to_base64` and `base64_to_binary` delegate entirely to `scalar::base64` on riscv64. PR #996 (opened 2026-06-25) adds vectorized `binary_to_base64` using strided loads/stores and indexed gather (`vluxei8`). No open PR exists for vectorized base64 decode. arm64 and both x86 tiers have full SIMD base64.

2. **UTF-16/UTF-8 with-replacement variants.** Four functions (`convert_utf16le_to_utf8_with_replacement`, `convert_utf16be_to_utf8_with_replacement`, `convert_utf8_to_utf16le_with_replacement`, `convert_utf8_to_utf16be_with_replacement`) delegate to scalar replacement paths. The non-replacement equivalents are fully vectorized. [NEEDS VERIFICATION: whether arm64 vectorizes these four functions or also uses scalar for the replacement-insertion path.]

3. **UTF-32 to UTF-8 for supplementary plane codepoints.** The BMP path (U+0000 to U+FFFF) is fully vectorized. Codepoints above U+FFFF fall through to a scalar tail loop.

4. **`detect_encodings`.** Contains a TODO for a future one-pass RVV algorithm. Current implementation uses RVV validation internally but is not optimally structured for the one-pass case.

**Performance gaps:**

From [PR #373](https://github.com/simdutf/simdutf/pull/373) benchmarks on Xuantie C908 (in-order, 1.6 GHz, VLEN=128), the RVV backend achieves 3.34x-3.42x average speedup over the scalar fallback across all vectorized functions. Base64 operations receive no speedup (scalar only). No published head-to-head benchmark comparing riscv64 RVV throughput against arm64 NEON or x86 AVX2 was found in any upstream source.

PR #890 QEMU benchmark data (not reliable for hardware projection, included for completeness):
- `utf8_length_from_utf16le+rvv` on QEMU: 0.043 GB/s
- `utf8_length_from_utf16le_with_replacement+rvv` on QEMU: 0.010 GB/s (scalar on same QEMU: 0.450 GB/s)
- ARM64 (Apple M1 Pro): 16.573 GB/s base, 12.472 GB/s with-replacement
- Maintainer comment: "we can't really tell much about your benchmark results [from QEMU]"

**Security hardening gaps.** Data not available: no CFI, stack canary, or ASAN/UBSan configuration was examined in the research findings.

**Floating-point / NaN semantics.** Not applicable -- simdutf performs no floating-point operations.

---

## 7. CI/CD Infrastructure

**CI comparison:**

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated workflow files | Yes (multiple, e.g., icelake, haswell, AVX-512) | Yes (multiple) | Yes (3: rvv-128-clang-17.yml, rvv-256-gcc-14.yml, rvv-1024-clang-18.yml) |
| Trigger | push/PR to master | push/PR to master | push/PR to master |
| Runner | ubuntu-24.04 (native x86_64) | ubuntu-24.04 (native x86_64) + arm64 hosted | ubuntu-24.04 (x86_64 only) |
| Execution method | Native | Native | QEMU user-mode (`qemu-user-static`) |
| SIMD ISA tested | SSE4.2, AVX2, AVX-512 | NEON | RVV 1.0, Zvbb (VLEN=128/256/1024) |
| Hardware runners | GitHub-hosted | GitHub-hosted | None -- emulation only |
| RISE runners | No | No | No |
| Fuzzing | Yes (multiple fuzzers) | Yes | Yes (QEMU-based, pauldreik) |

All three riscv64 CI workflows use `runs-on: ubuntu-24.04` (x86_64 GitHub-hosted runner). There are no native riscv64 hardware runners from RISE or any other provider. Execution is cross-compiled and emulated throughout.

Timeout per test run is 1800 seconds (`ctest --timeout 1800`). PR #591 increased this timeout to address flaky QEMU results.

No GitLab CI, Jenkinsfile, or Cirrus CI configuration was found in the repository.

---

## 8. Distribution and Release Status

**GitHub Releases.** simdutf publishes source-only releases for all architectures. Assets in every release are architecture-agnostic: `simdutf.cpp`, `simdutf.h`, `simdutf_c.h`, `singleheader.zip`, and source archives. No prebuilt binary for any architecture is distributed via GitHub Releases.

**PyPI.** No `simdutf` package exists on PyPI. HTTP 404 returned for both `/simple/simdutf/` and `/pypi/simdutf/json`. The project does not advertise a Python package.

**Debian (sid/forky).** simdutf is packaged in Debian:

| Package | Version | riscv64 Status | Builder |
|---|---|---|---|
| libsimdutf33 | 8.2.0-1 | Installed | rv-manda-03 |
| libsimdutf-dev | 8.2.0-1 | Installed | rv-manda-03 |
| libsimdutf-tools | 8.2.0-1 | Installed | rv-manda-03 |

Available in both sid and forky. All 18 Debian architectures show "Installed" status for 8.2.0-1.

**Ubuntu 24.04 (noble).** No `simdutf` package. Only `librust-simdutf8-dev` (v0.1.4-4, universe) exists, which is the unrelated Rust crate `simdutf8`.

**Arch Linux RISC-V.** Data not available: the archriscv.felixc.at portal returned 404 for all query paths during research.

**What a user must do to get a working riscv64 binary:**
- Debian sid/forky: `apt install libsimdutf-dev` -- works out of the box.
- Other distros: build from source using `cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains-dev/riscv64.cmake` with GCC 14 cross-compiler, or natively with `-march=rv64gcv` and GCC 14+/Clang 17+.

---

## 9. Dependencies

simdutf has zero mandatory external dependencies for the core library. Optional dependencies are used only for benchmarking or the `sutf` CLI tool.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| RVV (hardware) | Core SIMD backend | CI: cross-compile + QEMU | Full test suite via 3 CI workflows | Shipped since v5.0.0 | Base64 SIMD missing; PR #996 open |
| Scalar fallback | Architecture-neutral C++ | Unconditional | All test runs | All releases | None |
| glibc iconv (optional) | `sutf` CLI and stream benchmark (`-DSIMDUTF_ICONV=ON`) | riscv64 in glibc since 2.27 (2018) | Debian/distro CI | Debian sid 2.40+ | None |
| ICU (optional) | Benchmark reference baseline (`find_package(ICU)`) | ICU 78.3-2 builds on Debian sid riscv64 | No ICU upstream riscv64 CI; Debian packaging provides coverage | ICU 78.3-2 in Debian sid riscv64 | One historical UB bug (NaN/INT64_MAX, fixed ICU 71); no current blocker |
| aklomp/base64 v0.5.2 (vendored via CPM) | `benchmark_base64` comparison target only | No RVV codecs; CMake riscv64 detection missing until [PR #156](https://github.com/aklomp/base64/pull/156) (open 2026-06-10) is merged | Simulated cross-build tested in PR #156; no QEMU run | v0.5.2 (2024-01-10) | Benchmark-only dependency; not a correctness blocker |
| CMake >= 3.18 | Build system | riscv64 cross-compile supported | -- | -- | None |
| C++17 stdlib | Required by simdutf core | libstdc++ ships with GCC riscv64 toolchain | Covered by all CI | All distros | None |

**aklomp/base64 detail.** This is a benchmark-only dependency (vendored for `benchmark_base64` target). It has no RVV codecs and will deliver scalar-only results on riscv64. CMake riscv64 architecture detection is the subject of open [PR #156](https://github.com/aklomp/base64/pull/156) (opened 2026-06-10, no reviewer assigned). This does not affect simdutf build or correctness.

---

## 11. Known Bugs and Active Issues

**Open issues and PRs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#996](https://github.com/simdutf/simdutf/pull/996) | Add RVV vectorized base64 encoding | Open PR | Medium | Vectorizes `binary_to_base64` and `binary_to_base64_with_lines` using `vlse8`/`vsse8`/`vluxei8`; no reviewer assigned as of 2026-06-25; closes #843 |
| [#890](https://github.com/simdutf/simdutf/pull/890) | Implement UTF16 to UTF8 length with replacement for rvv | Open PR | Low | Lemire indicated willingness to merge; QEMU benchmarks show scalar outperforming RVV (emulation artifact); PR open since 2026-01-01 with no recent activity |
| [#853](https://github.com/simdutf/simdutf/issues/853) | Add RVV versions of UTF16 to UTF8 length with replacement | Open issue | Low | "help wanted"; tracked by PR #890 |
| [#843](https://github.com/simdutf/simdutf/issues/843) | Implement binary_to_base64 with lines for RISC-V processors | Open issue | Medium | "good first issue"; tracked by PR #996 |
| [#380](https://github.com/simdutf/simdutf/issues/380) | RVV port for Base64 procedures | Open issue | Medium | Opened 2024-03-23 by WojciechMula; development in external repo `WojciechMula/base64simd`; no assignee; no PR for base64 decode |

**Closed correctness bugs (fixed, for reference):**

| ID | Title | Fixed | Impact |
|---|---|---|---|
| [#728](https://github.com/simdutf/simdutf/issues/728) | RVV: possible wrong code (signed-char shift in `rvv_count_valid_utf8`) | PR #730, v6.4.1 (2025-03-31) | Correctness -- right shift of signed char could never match `0b10`; RISC-V psABI mandates unsigned char so latent rather than triggered, but was a portability hazard |
| [#532](https://github.com/simdutf/simdutf/issues/532) | `convert_utf16le_to_utf32_with_errors` wrong error position on RVV (count 138 vs expected 137) | PR #535, 2024-08-18 | Correctness |
| [#531](https://github.com/simdutf/simdutf/issues/531) | `validate_utf32_with_errors` returns wrong error type on RVV (`TOO_LARGE` instead of `SURROGATE`) and wrong position | PR #534, 2024-08-18 | Correctness |
| [#419](https://github.com/simdutf/simdutf/issues/419) | `#include` inside namespace breaks symbols on riscv64 (`isadetection.h` placed POSIX symbols in wrong namespace) | PR #422 | Build/link -- discovered during Node.js 22.1.0 riscv64 build |
| [#410](https://github.com/simdutf/simdutf/pull/410) | Wrong error index in UTF-16-to-UTF-32 (idx=0 placeholder); infinite loop when vl=1 | Merged 2024-04-22 | Correctness -- found on Kendryte k230 hardware |

---

## 12. Objections and Upstream Blockers

**Stated objections.** None. The maintainer has merged all RVV contributions offered and stated willingness to merge more. The characterization of RVV as "experimental as far as performance goes" (PR #890 comment) reflects emulator-only testing, not a rejection posture.

**Technical blockers.**
- Base64 SIMD: no RVV vectorized decode exists anywhere in the project or in any open PR. PR #996 covers encode only and has no reviewer.
- VLEN=512 is untested. VLEN=128/256/1024 are covered.
- No native hardware CI. All riscv64 correctness validation relies on QEMU emulation. The fuzzer-discovered QEMU bug (PR #641, wrong byte count under `rvv_vl_half_avl=on`) demonstrates that QEMU can expose real bugs, but also that QEMU-specific behavior can diverge from hardware.

**Organizational blockers.** None. The project has no governance layer that could block a contribution. Acceptance depends entirely on lemire's review queue.

**Acceptance probability for new contributions.** High, based on the track record: 9 RVV PRs merged since 2024, multi-contributor involvement, explicit "game to merge" statements from the maintainer.

---

## 13. Investment Analysis

RISE has no funded work on simdutf. The upstream project is actively maintained and receiving RVV contributions from independent contributors. The RVV backend is substantially complete for all UTF operations. The remaining gaps are base64 SIMD and the absence of native hardware CI.

### 13.1 Functional Enablement

The two functional gaps on riscv64 are:

1. **Base64 encode SIMD (PR #996 in progress, no reviewer).** PR #996 adds vectorized encode. The PR was opened by an external contributor 2026-06-25 with no reviewer assigned. The effort to review, iterate, and merge this PR is 1-2 person-weeks for a RISC-V SIMD-competent engineer.

2. **Base64 decode SIMD (no open work).** No RVV base64 decode implementation exists anywhere. arm64 and x86 have full SIMD decode. Implementing RVV base64 decode is a 2-4 person-week effort for a SIMD engineer familiar with the base64 decode algorithm (table-driven 4-to-3 byte conversion with validity checking).

3. **UTF-16/UTF-8 with-replacement SIMD (PR #890 stalled).** PR #890 has been open since 2026-01-01 with maintainer buy-in but no recent activity. Merging it requires rebasing or nudging the contributor (1 person-week to take over and land).

### 13.2 Performance Optimization

From C908 benchmarks in PR #373, the current RVV backend averages 3.34x-3.42x over scalar. No comparison against arm64 NEON or x86 AVX2 throughput in bytes-per-second has been published. To assess whether the RVV implementation is competitive with arm64 on a cycle-for-cycle basis, a benchmarking run on native RISC-V hardware with a published results table is needed. Effort: 1 person-week (setup + run + publish).

Specific optimization opportunities identified in research:
- `detect_encodings`: TODO in source for one-pass RVV algorithm. Effort: 1-2 person-weeks.
- UTF-32 to UTF-8 supplementary plane scalar tail: the BMP path is vectorized; the tail falls to scalar. Vectorizing the supplementary plane path requires careful surrogate handling. Effort: 1 person-week.

### 13.3 CI/CD Infrastructure

No native riscv64 hardware runner exists for simdutf. All riscv64 CI runs under QEMU. Adding native hardware CI requires either:
- A RISE-provided riscv64 runner (external dependency on RISE CI infrastructure), or
- A self-hosted GitHub Actions runner on an SoC with RVV 1.0 (e.g., SpacemiT K1, Xuantie C910-based board).

The CI YAML structure is straightforward to adapt to a native runner by removing the cross-compiler and QEMU settings. Effort: 1 person-week to integrate and validate a native runner.

### 13.4 Ecosystem Enablement

simdutf has no dependent package ecosystem requiring separate enablement. The library is consumed by projects that vendor it (Node.js, Bun, Chromium) or link it as a system library. The Debian sid riscv64 package (v8.2.0-1) is current and installed. No work is required here.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and merge RVV base64 encode (PR #996) | 1-2 | RISC-V SIMD engineer | High |
| Functional | Implement RVV base64 decode | 2-4 | RISC-V SIMD engineer | High |
| Functional | Rebase and land PR #890 (UTF-16-to-UTF-8 length with replacement) | 1 | Any contributor | Medium |
| Performance | Publish native riscv64 benchmark results (all conversion functions vs arm64/amd64) | 1 | Access to RISC-V hardware required | Medium |
| Performance | Optimize `detect_encodings` for one-pass RVV | 1-2 | RISC-V SIMD engineer | Low |
| Performance | Vectorize UTF-32-to-UTF-8 supplementary plane path | 1 | RISC-V SIMD engineer | Low |
| CI/CD | Add native riscv64 hardware runner | 1 | Infrastructure + RISE coordination | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [simdutf GitHub repository](https://github.com/simdutf/simdutf)
- [simdutf project homepage](https://simdutf.github.io/simdutf/)
- [PR #223 -- Add riscv64 define](https://github.com/simdutf/simdutf/pull/223)
- [Issue #362 -- RVV backend proposal with C908/C920 benchmarks](https://github.com/simdutf/simdutf/issues/362)
- [PR #373 -- Add RVV backend (initial merge, v5.0.0)](https://github.com/simdutf/simdutf/pull/373)
- [PR #410 -- Fix RVV implementation (k230 hardware bugs)](https://github.com/simdutf/simdutf/pull/410)
- [Issue #419 -- #include inside namespace breaks symbols on riscv64](https://github.com/simdutf/simdutf/issues/419)
- [Issue #380 -- RVV port for Base64 procedures](https://github.com/simdutf/simdutf/issues/380)
- [PR #489 -- fix: correct utf8 to latin1 riscv code](https://github.com/simdutf/simdutf/pull/489)
- [PR #533 -- add tests demonstrating problems with riscv](https://github.com/simdutf/simdutf/pull/533)
- [Issue #531 -- validate_utf32_with_errors implementation difference on riscv](https://github.com/simdutf/simdutf/issues/531)
- [Issue #532 -- convert_utf16le_to_utf32_with_errors implementation difference on riscv](https://github.com/simdutf/simdutf/issues/532)
- [PR #591 -- update RVV CI](https://github.com/simdutf/simdutf/pull/591)
- [PR #641 -- Add test for fuzzer finding on riscv using rvv_vl_half_avl=on](https://github.com/simdutf/simdutf/pull/641)
- [PR #730 -- Fix signed-char shift bug in RVV kernel](https://github.com/simdutf/simdutf/pull/730)
- [Issue #728 -- RVV: possible wrong code](https://github.com/simdutf/simdutf/issues/728)
- [PR #739 -- rvv: simplify UTF-32 to UTF-{8,16}](https://github.com/simdutf/simdutf/pull/739)
- [PR #745 -- rvv: simplify UTF-8 validation](https://github.com/simdutf/simdutf/pull/745)
- [PR #759 -- RVV: faster valid UTF-32 to UTF-8](https://github.com/simdutf/simdutf/pull/759)
- [PR #777 -- Simplify validate_utf16be for icelake and rvv](https://github.com/simdutf/simdutf/pull/777)
- [PR #779 -- rvv: a bit simpler UTF-8 validation](https://github.com/simdutf/simdutf/pull/779)
- [PR #788 -- rvv: faster UTF-32 to UTF-16](https://github.com/simdutf/simdutf/pull/788)
- [PR #810 -- Implement rvv find function](https://github.com/simdutf/simdutf/pull/810)
- [PR #836 -- Implement rvv validate_utf16_as_ascii function](https://github.com/simdutf/simdutf/pull/836)
- [PR #838 -- Implement to_well_formed_utf16 for rvv](https://github.com/simdutf/simdutf/pull/838)
- [PR #842 -- utf16fix_block_rvv: improve mask shift](https://github.com/simdutf/simdutf/pull/842)
- [Issue #843 -- Implement binary_to_base64 with lines for RISC-V processors](https://github.com/simdutf/simdutf/issues/843)
- [Issue #853 -- Add RVV versions of UTF16 to UTF8 length with replacement](https://github.com/simdutf/simdutf/issues/853)
- [PR #890 -- Implement UTF16 to UTF8 length with replacement for rvv architecture](https://github.com/simdutf/simdutf/pull/890)
- [PR #931 -- override annotations for RVV, lasx and lsx](https://github.com/simdutf/simdutf/pull/931)
- [PR #996 -- Add RVV vectorized base64 encoding](https://github.com/simdutf/simdutf/pull/996)
- [Debian buildd -- simdutf riscv64 status](https://buildd.debian.org/status/package.php?p=simdutf&suite=sid)
- [aklomp/base64 PR #156 -- Add RISC-V target detection](https://github.com/aklomp/base64/pull/156)
- [RISE Project blog -- reviewed 26 posts, no simdutf mention](https://riseproject.dev/blog)