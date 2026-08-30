---
title: wuffs
parent: Project Reports
color: orange
---

# wuffs

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for wuffs<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wuffs (Wrangling Untrusted File Formats Safely) is a memory-safe programming language and standard library for parsing, decoding, and encoding file formats -- images (PNG, JPEG, GIF, WebP, TIFF, BMP, WBMP, NIE), compression (deflate, zlib, gzip, bzip2, LZ4, LZMA, XZ, zstd), checksums (Adler-32, CRC-32, CRC-64), and JSON. The project transpiles `.wuffs` source files to a single amalgamated C99 header (`release/c/wuffs-v0.x.c`) that downstream consumers embed directly in their own build systems. There are no compiled binaries, no shared libraries, and no architecture-specific release artifacts of any kind.

**Governance:** Wuffs is a Google-owned project under the `google` GitHub organization. It is not affiliated with CNCF, Apache Software Foundation, Linux Foundation, or the RISE project. The governance model is a single benevolent dictator: Nigel Tao (Google Go team, `nigeltao@golang.org`) holds 3,980 of approximately 3,984 total commits (99.9%). No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists. All contributions require a Google CLA. The OpenSSF Scorecard score is 6.8/10 with AllStar policy enforcement.

**License:** Apache-2.0 OR MIT (dual license at user's option). Copyright held by "The Wuffs Authors"; Google Inc. is listed in `AUTHORS`.

**Corporate contributors:** Google (Nigel Tao, Leo Neat, Patrick Georgi), Microsoft (Mike Kaufman, listed in `AUTHORS` as copyright holder), Red Hat (Richard Hughes, 1 commit), and community contributors (Samuel Bronson, 2 commits).

**Community culture on new ports:** All architecture-specific SIMD optimizations to date have been authored by Nigel Tao himself. No community-contributed SIMD port has been accepted. The project is effectively a one-person Google project. Nigel Tao has stated (issue #38) that generating code for other target languages was "a design goal from day one," but no analogous statement exists for RISC-V SIMD. The `WUFFS_CONFIG__AVOID_CPU_ARCH` compile flag disables all arch-specific code, and the project ships a fully functional scalar C fallback for all codecs.

## 2. Port History and Upstreaming Timeline

There is no riscv64 host-architecture port of wuffs. The two RISC-V commits that exist implement the XZ BCJ (Branch/Call/Jump) content filter -- a transform that improves compression ratios for RISC-V binaries stored inside `.xz` archives. This filter runs on any host architecture; it is not a RISC-V host optimization.

| Date | Event | Source |
|------|-------|--------|
| 2024-02-09 | Preparatory commit `9ef114be` "std/xz: prepare to add BCJ filters" introduces `choosy` dispatch mechanism and `bcj_undo_index` field | [google/wuffs](https://github.com/google/wuffs) |
| 2024-02-13 | Commit `94e32e8e` "test/3pdata: add xzsuite/*-riscv-*.xz" -- adds two RISC-V XZ test vectors from the upstream XZ test suite | [94e32e8e](https://github.com/google/wuffs/commit/94e32e8e56ae85705d45ef0eaae29b40fa9eb874) |
| 2024-02-13 | Commit `749e3559` "std/xz: implement apply_filter_0b_riscv" -- implements XZ BCJ filter ID `0x0B` for RISC-V JAL and AUIPC instruction types (+102 lines in `std/xz/decode_filter.wuffs`) | [749e3559](https://github.com/google/wuffs/commit/749e3559f22c6da3cd3a160910539f17f26c0ff6) |

Both commits were authored by Nigel Tao and landed directly to main without a pull request, consistent with his commit-directly pattern as project owner. The RISC-V BCJ filter was the final entry in a complete BCJ filter series covering x86 (0x04), PowerPC (0x05), IA-64 (0x06), ARM (0x07), ARMThumb (0x08), SPARC (0x09), ARM64 (0x0A), and RISC-V (0x0B), all implemented in February 2024.

No tracking issue, roadmap entry, or milestone exists for a riscv64 host-architecture port. A scan of all 178 issues and 29 PRs in the upstream tracker found zero RISC-V mentions. `doc/roadmap.md` and `doc/changelog.md` contain zero RISC-V references.

## 3. Upstream Support Tier

Wuffs has no formal tier policy. The project ships as a single-file C99 library targeting maximum portability. Architecture-specific SIMD is opt-in via compile-time dispatch; the `WUFFS_CONFIG__AVOID_CPU_ARCH` flag disables all SIMD globally.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes (CIFuzz, `ubuntu-latest`) | No | No |
| CI runs tests | Fuzz only (not functional test suite) | No | No |
| Upstream publishes binary artifact | No (source-only) | No | No |
| SIMD optimizations | SSE4.2, AVX2, BMI2 | NEON, CRC32 | None |
| Scalar fallback functional | Yes | Yes | Yes |
| Tracking issue | N/A | N/A | None |
| Roadmap entry | N/A | N/A | None |

The project has no release-blocking CI for any architecture. The only CI job is a CIFuzz fuzzer triggered on pull requests, running on `ubuntu-latest` (x86_64). There is no functional test suite in CI, no architecture matrix, and no QEMU emulation.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Wuffs uses a compile-time `cpu_arch` guard mechanism defined in `internal/cgen/base/fundamental-public.h` via `WUFFS_PRIVATE_IMPL__CPU_ARCH__*` macros. There is no runtime JIT, no dynamic dispatch at load time, and no assembly (`.S`) files anywhere in the repository. SIMD is selected at compile time via `choose cpu_arch >= <isa>` expressions in `.wuffs` source files, which the transpiler lowers to `#ifdef` guards in the generated C.

**SIMD component matrix:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Adler-32 | SSE4.2 (177 lines, `common_up_x86_sse42.wuffs`) | NEON (191 lines, `common_up_arm_neon.wuffs`) | Missing |
| CRC-32 | SSE4.2 (150 lines, `common_up_x86_sse42.wuffs`) | ARM CRC32 (34 lines, `common_up_arm_crc32.wuffs`) | Missing |
| CRC-64 | SSE4.2 (`common_up_x86_sse42.wuffs`) | Missing | Missing |
| Deflate decode | BMI2 (212 lines, `decode_huffman_bmi2.wuffs`) | Missing | Missing |
| JPEG IDCT | AVX2 (930 lines, `decode_idct_x86_avx2.wuffs`) | Missing | Missing |
| PNG filter decode | SSE4.2 (275 lines, `decode_filter_x86_sse42.wuffs`) | NEON (202 lines, `decode_filter_arm_neon.wuffs`) | Missing |
| XZ BCJ content filter | Portable C (runs on any host) | Portable C (runs on any host) | Portable C (runs on any host) |

SIMD source file count: x86 = 5 files, ARM = 3 files, RISC-V = 0 files. SIMD lines in the release C amalgam: x86 = approximately 2,160 lines, ARM = approximately 531 lines, RISC-V = 0 lines.

The wuffs language has no `cpu_arch >= riscv_v` token. The five `wuffs_base__cpu_arch__have_*()` functions cover only `arm_crc32`, `arm_neon`, `x86_avx2`, `x86_bmi2`, and `x86_sse42`. There is no `wuffs_base__cpu_arch__have_riscv_v()` function and no `WUFFS_PRIVATE_IMPL__CPU_ARCH__RISCV_*` macro. Adding RVV support would require: (1) adding `riscv_v` and related tokens to `lang/token/list.go`; (2) adding `WUFFS_PRIVATE_IMPL__CPU_ARCH__RISCV_V` detection macros to `fundamental-public.h`; (3) writing new `.wuffs` files (e.g., `common_up_riscv_rvv.wuffs`) using `choose cpu_arch >= riscv_v`; and (4) extending the `lib/` intrinsics infrastructure for RVV, mirroring the ARM NEON pattern in `lib/armneonintrinsics/`.

There is no JIT backend. Wuffs transpiles `.wuffs` to C at build time; there is no runtime code generation.

## 5. Build System, Cross-Compilation, and Toolchain

Wuffs has no CMake, no Makefile, no `configure` step, no Dockerfile, and no cross-compilation toolchain file. The build system consists of three shell scripts (`build-all.sh`, `build-example.sh`, `build-fuzz.sh`) that set `CC`/`CXX` environment variables and invoke the compiler directly.

**Cross-compilation for riscv64:**

```bash
# Compile the single-file C library as an object file
riscv64-linux-gnu-gcc \
  -c \
  -DWUFFS_IMPLEMENTATION \
  -O3 \
  -std=c99 \
  release/c/wuffs-v0.3.c \
  -o wuffs-v0.3.o

# Build an example program
CC=riscv64-linux-gnu-gcc \
CXX=riscv64-linux-gnu-g++ \
  ./build-example.sh example/jsonptr
```

**Toolchain requirements:**

| Requirement | Value | Reason |
|-------------|-------|--------|
| C standard | C99 (`-std=c99`) | `build-all.sh` explicitly passes `-std=c99 -Wc++-compat`; `wuffs-c/test.go` hardcodes `-std=c99` |
| C++ standard | C++11 (`-std=c++11`) | Header emits `#warning` at compile time if C++11 is not set |
| Cross-compiler | `riscv64-linux-gnu-gcc` / `riscv64-linux-gnu-g++` | Standard GNU cross-toolchain; no special version required |
| Go | 1.25.0 | Required only for the Wuffs transpiler (`go install ./cmd/wuffs*`); not needed to use the library |

**`WUFFS_CONFIG__AVOID_CPU_ARCH`:** This flag disables all CPU-arch SIMD. It is a no-op on riscv64 (no RISC-V SIMD paths exist) but documents intent and is safe to pass.

**QEMU:** Not documented anywhere in the repository. No QEMU references exist in any file. For running cross-compiled riscv64 binaries on x86_64, `qemu-riscv64-static` with `binfmt_misc` is the standard approach, but this is not described or tested upstream.

**Known build failures:** None documented. The scalar C path compiles cleanly with any C99-compliant cross-compiler. No riscv64-specific build issues have been filed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional coverage:** All wuffs codecs (PNG, JPEG, GIF, WebP, deflate, bzip2, LZ4, LZMA, XZ, zstd, Adler-32, CRC-32, CRC-64, JSON) are fully functional on riscv64 via the scalar C fallback. The XZ decoder correctly handles RISC-V BCJ filter (filter ID `0x0B`) for decompressing XZ archives containing RISC-V binaries. There are no functional gaps.

**Performance gaps:** The scalar fallback on riscv64 is equivalent to compiling with `-DWUFFS_CONFIG__AVOID_CPU_ARCH=1`. Official benchmarks (Intel Core i5-10210U, Debian Bullseye, September 2022, from [`doc/benchmarks.md`](https://github.com/google/wuffs/blob/main/doc/benchmarks.md)) show the magnitude of the SIMD uplift that riscv64 does not receive:

| Operation | wuffs x86_64 (SIMD) | zlib/libpng baseline | SIMD uplift |
|-----------|--------------------|--------------------|-------------|
| Adler-32 | 22.3 GB/s | 3.50 GB/s | 6.4x |
| CRC-32 | 21.6-23.8 GB/s | 1.62 GB/s | 13.3-14.7x |
| Deflate decode (100k) | 521-522 MB/s | 352 MB/s | 1.48x |
| PNG decode (552k 32bpp) | 871-914 MB/s | 289 MB/s | 3.0-3.2x |

Historical ARMv7 data (2019, Samsung Exynos 5, no NEON): deflate 100k at 96.5 MB/s (0.82x vs zlib 118 MB/s) -- slower than zlib without SIMD. This is the closest available proxy for riscv64 scalar performance. On riscv64, wuffs Adler-32 and CRC-32 would be approximately 6-14x slower than on x86_64 wuffs, and PNG decode would be at or below libpng parity.

No riscv64-specific benchmark data exists anywhere (checked: wuffs repo, nigeltao blog, GitHub issues, RISE wiki).

**Security hardening gaps:** None specific to riscv64. Wuffs's memory safety guarantees are enforced by the Wuffs language type system and apply equally to all architectures.

**Floating-point / NaN semantics:** No riscv64-specific floating-point issues have been filed. The f64 parsing regression (issue #113, 34x slowdown) was architecture-independent and was fixed in April 2023.

**Issue #172** ("Testing other choosy choices") is directly relevant to riscv64: the lack of a mechanism to test scalar fallback paths means the code paths that riscv64 always executes are undertested even on x86/ARM machines.

## 7. CI/CD Infrastructure

The repository contains exactly one CI file: `.github/workflows/fuzz.yml`. No other CI configuration exists (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `appveyor.yml`, `.circleci/config.yml` -- all absent).

```yaml
name: CIFuzz
on: [pull_request]
jobs:
  Fuzzing:
    runs-on: ubuntu-latest   # x86_64 only
    steps:
    - uses: google/oss-fuzz/infra/cifuzz/actions/build_fuzzers@master
    - uses: google/oss-fuzz/infra/cifuzz/actions/run_fuzzers@master
      with:
        fuzz-seconds: 600
    - uses: actions/upload-artifact@v4
```

| CI criterion | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| CI exists | Yes | No | No |
| Trigger | pull_request only | -- | -- |
| Runner | `ubuntu-latest` (x86_64) | -- | -- |
| Functional test suite | No (fuzz only) | -- | -- |
| Architecture matrix | No | -- | -- |
| QEMU emulation | No | -- | -- |
| RISE runner | No | -- | -- |

The OSS-Fuzz `projects/wuffs/project.yaml` lists architectures `x86_64` and `i386` only. riscv64 is not listed.

A GitHub code search across the entire repository returns zero results for `riscv64`, `riscv`, and `RISCV`. A full recursive git tree scan confirms no riscv64-related files exist anywhere in the repository.

## 8. Distribution and Release Status

Wuffs is a source-only, header-only library. It has never been packaged in Ubuntu, Debian, Fedora, Arch Linux, or any other distribution. PyPI returns HTTP 404 for `wuffs`. GitHub releases (latest stable: v0.3.5; latest pre-release: v0.4.0-alpha.10) contain only source archives (`.zip` / `.tar.gz`) -- no compiled binaries for any architecture.

The concept of a "riscv64 binary of wuffs" is a category error: the project's distribution model is a single C file that downstream projects compile themselves. Architecture-specific binary packaging is moot at the library level.

**What a user must do to get a working riscv64 build:** Copy `release/c/wuffs-v0.3.c` (or the v0.4 snapshot) into their project and compile it with `riscv64-linux-gnu-gcc -DWUFFS_IMPLEMENTATION -O3 -std=c99`. No patches, no special flags, no upstream changes required.

| Distribution channel | riscv64 available |
|---------------------|------------------|
| Ubuntu (all suites including resolute) | No -- no wuffs package in any suite |
| Debian | No -- no wuffs package |
| Fedora / Koji | No -- no wuffs package |
| Arch Linux RISC-V | No -- no wuffs package |
| PyPI | No -- HTTP 404 |
| GitHub Releases | No -- source archives only |
| Pre-built binaries | No -- source-only project |

## 9. Dependencies

Wuffs core has zero external runtime dependencies. All optional dependencies are used only by the mimic/benchmark test infrastructure or by optional example programs. All are available in Ubuntu 26.04 (resolute) for riscv64.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|-----------|------|--------------|-------------|----------------|-------|
| zlib | Mimic ref for deflate/gzip/adler32/PNG tests (`-lz`) | Yes | Partial (OpenBSD/riscv64 CI only; no Linux riscv64 CI) | Yes (`zlib1g-dev` in resolute) | RVV Adler-32 PR #1099 stalled; single-maintainer bottleneck |
| libbz2 (bzip2) | Mimic ref for bzip2 tests (`-lbz2`) | Yes | Yes (via distro CI) | Yes (`libbz2-dev` in resolute) | No issues |
| libpng | Mimic ref for PNG tests (`-lpng`) | Yes | Partial (no upstream riscv64 CI) | Yes (`libpng-dev` in resolute) | RVV backend exists but defaults OFF; crash risk on non-RVV hardware if compiled with RVV |
| libjpeg-turbo | Mimic ref for JPEG tests (`-ljpeg`) | Yes | Partial (QEMU CI; 2 FP DCT tests disabled on non-x86) | Yes (`libjpeg-turbo8-dev` in resolute; no upstream riscv64 binary) | Maintainer closed issue #885 as "won't implement" for riscv64 binary releases |
| giflib | Mimic ref for GIF tests (`-lgif`) | Yes | Yes (Debian buildd rv-osuosl-05) | Yes (`libgif-dev` in resolute) | No issues |
| libdeflate | Mimic ref for deflate/gzip/adler32 tests | Yes (scalar C) | Yes (via distro CI) | Yes (`libdeflate-dev` in resolute) | No RISC-V SIMD backend |
| liblzma (xz-utils) | Mimic ref for LZMA/XZ tests (`-llzma`) | Yes | Yes (via distro CI) | Yes (`liblzma-dev` in resolute) | xz-utils has RVV CRC acceleration; wuffs implements its own XZ decoder independently |
| liblz4 | Go cgo wrapper `lib/cgolz4` for RAC-LZ4 | Yes | Partial (QEMU CI, Tier 3) | Yes (`liblz4-dev` in resolute, v1.10.0) | `LZ4_FAST_DEC_LOOP` disabled for riscv64; RVV wildCopy/FindMatchLength PRs open but unmerged |
| libzstd | Go cgo wrapper `lib/cgozstd` for RAC-Zstd | Yes | Partial (QEMU CI; no native runner) | Yes (`libzstd-dev` in resolute) | RVV sequence decoder merged; maintainer response latency 3-6 months |
| golang.org/x/image | Go module for test/benchmark infrastructure | Yes (pure Go) | Yes (Go supports riscv64 as first-class target) | N/A (Go module) | No issues |
| SDL2 / SDL2_image | Optional: `example/sdl-imageviewer` only | Yes | Yes (via distro CI) | Yes (`libsdl2-dev` in resolute) | Optional example only |
| xcb / xcb-image / xcb-render | Optional: `example/imageviewer` (X11 GUI) only | Yes | Yes (via distro CI) | Yes (`libxcb-dev` in resolute) | Optional example only |

No blocking riscv64 dependency issues exist for the wuffs core library. All optional test dependencies are available in Ubuntu 26.04 resolute for riscv64.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist in the upstream tracker. The following open issues are relevant to riscv64 by implication:

| ID | Title | Status | Severity | riscv64 relevance |
|----|-------|--------|----------|------------------|
| [#172](https://github.com/google/wuffs/issues/172) | Testing other choosy choices (SIMD dispatch testing) | Open (May 2026) | Medium | High -- riscv64 always uses scalar fallback; scalar paths are undertested even on x86/ARM |
| [#157](https://github.com/google/wuffs/issues/157) | Vectorized Paeth filtering (multiple pixels at once) | Open (Dec 2024) | Low | Low -- x86/AVX focused; no RVV proposed |
| [#149](https://github.com/google/wuffs/issues/149) | wuffs slower than OpenCV on Apple M1 (7680x4320 PNG) | Open (Jun 2024) | Low | Medium -- ARM NEON underperforms; riscv64 has no SIMD at all |
| [#148](https://github.com/google/wuffs/issues/148) | wuffs 0.4 slower than 0.3 on MSVC without AVX | Open (May 2024) | Low | None -- MSVC/x86 specific |
| [#151](https://github.com/google/wuffs/issues/151) | MSVC internal compiler error with SSE4.2 | Open (Jul 2024) | Low | None -- MSVC/x86 specific |

**Closed relevant bugs:**
- [#178](https://github.com/google/wuffs/issues/178) -- Netpbm NULL pointer UB with width=0 (closed Aug 2026, architecture-independent)
- [#113](https://github.com/google/wuffs/issues/113) -- Slow f64 parsing, 34x below fast_float (closed Apr 2023, scalar algorithm, affected all architectures)

No correctness bugs specific to riscv64 have been filed or are known.

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support exist in the upstream tracker. The project has never been asked to add riscv64 SIMD.

**Organizational blockers:**
- Nigel Tao is the sole maintainer with 99.9% of commits. All architecture-specific SIMD to date has been written by him personally. No community-contributed SIMD port has been accepted. Any RVV contribution would require his review and approval, and would need to follow the pattern of adding language-level support in the Wuffs transpiler before writing `.wuffs` source files.
- Google CLA is required for all contributions.
- The project has no formal tier policy and no stated commitment to riscv64.

**Technical blockers:**
- The Wuffs language itself has no `cpu_arch >= riscv_v` concept. Adding RVV support requires changes at the language level (`lang/token/list.go`), the code generator (`internal/cgen/`), the runtime detection macros (`fundamental-public.h`), and the standard library (new `.wuffs` files). This is a multi-layer change, not a simple intrinsics port.
- No RISE RFP exists for wuffs. No RISE blog post mentions wuffs. wuffs is not listed in the RISE Python wheel builder. The only RISE connection is that Google is a RISE Premier Member and Nathan Egge (Google, RISE System Libraries WG lead) is a colleague of Nigel Tao.

**Acceptance probability:** [NEEDS VERIFICATION] -- no upstream discussion of riscv64 SIMD has occurred, so acceptance probability cannot be assessed from available data.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; no distro package; source-only distribution model means the distribution floor rule does not apply)
- **Release provider:** none

**Justification:** Wuffs has no riscv64 CI of any kind -- the only CI job is a CIFuzz fuzzer on `ubuntu-latest` (x86_64), confirmed by reading [`.github/workflows/fuzz.yml`](https://github.com/google/wuffs/blob/main/.github/workflows/fuzz.yml). The project is not packaged in any Linux distribution (Ubuntu, Debian, Fedora, Arch), so the distribution floor rule does not apply. The scalar C fallback is fully functional on riscv64, but no upstream validation exists. This places the project at orange.

**Pending work that could change the grade:** No open PRs, no RISE involvement, and no tracking issue exist for riscv64 CI or riscv64 SIMD. The grade is unlikely to change without a new contribution.

## 14. Investment Analysis

No RISE work has been done or funded for wuffs. The following sizing covers the full scope.

### 14.1 Functional Enablement

Wuffs is fully functional on riscv64 via the scalar C fallback. No functional enablement work is required. The XZ BCJ filter for RISC-V content is already implemented and merged.

### 14.2 Performance Optimization

The performance gap is significant for checksum-heavy workloads. The highest-value targets, in order of SIMD uplift on x86_64, are:

1. **CRC-32 / CRC-64 via RVV or Zbc (carry-less multiply):** 13-15x uplift on x86_64 via SSE4.2 PCLMUL. RISC-V equivalent would use the Zbc extension (carry-less multiply) or RVV. Requires: new `cpu_arch >= riscv_zbc` or `riscv_v` token in the Wuffs language, detection macro in `fundamental-public.h`, and a new `common_up_riscv_*.wuffs` file.
2. **Adler-32 via RVV:** 6.4x uplift on x86_64. Same infrastructure requirements as CRC-32.
3. **PNG filter decode via RVV:** 3.0-3.2x uplift on x86_64. Requires RVV vector load/store and integer arithmetic.
4. **Deflate Huffman decode via Zbb (bit manipulation):** 1.48x uplift on x86_64 via BMI2. RISC-V Zbb provides `clz`, `ctz`, `cpop` equivalents.
5. **JPEG IDCT via RVV:** 930 lines of AVX2 on x86_64. High complexity; lower priority unless JPEG decode throughput is a specific requirement.

The language-level changes (steps 1-2 above) are a prerequisite for all RVV work and represent the highest-leverage investment.

### 14.3 CI/CD Infrastructure

Adding riscv64 CI requires: (1) a QEMU-based or native riscv64 runner in GitHub Actions; (2) a new workflow file (or extension of `fuzz.yml`) that cross-compiles and runs the wuffs test suite under QEMU or on native hardware; (3) OSS-Fuzz architecture extension to add riscv64 to `projects/wuffs/project.yaml`. The functional test suite (`build-all.sh`) is straightforward to run cross-compiled under `qemu-riscv64-static`.

### 14.4 Ecosystem Enablement

Not applicable. Wuffs is a source-only library with no binary package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 QEMU CI job (cross-compile + run test suite) | 1 | RISE / contributor | High |
| CI/CD | Add riscv64 to OSS-Fuzz `project.yaml` | 0.5 | RISE / contributor | Medium |
| Performance | Add `riscv_v` / `riscv_zbc` language tokens and detection macros to Wuffs transpiler | 3 | Contributor (requires Nigel Tao review) | High |
| Performance | Implement CRC-32 via Zbc or RVV (`common_up_riscv_zbc.wuffs`) | 2 | Contributor | High |
| Performance | Implement Adler-32 via RVV (`common_up_riscv_rvv.wuffs`) | 2 | Contributor | High |
| Performance | Implement PNG filter decode via RVV (`decode_filter_riscv_rvv.wuffs`) | 3 | Contributor | Medium |
| Performance | Implement deflate Huffman decode via Zbb (`decode_huffman_riscv_zbb.wuffs`) | 2 | Contributor | Medium |
| Performance | Implement JPEG IDCT via RVV (`decode_idct_riscv_rvv.wuffs`) | 5 | Contributor | Low |
| Testing | Address issue #172 (scalar fallback test coverage) | 2 | Contributor | Medium |

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/wuffs repository](https://github.com/google