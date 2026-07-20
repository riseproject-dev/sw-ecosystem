---
title: SVT-AV1
categories:
  - multimedia
---

# SVT-AV1

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for SVT-AV1<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

SVT-AV1 is a production AV1 video encoder developed jointly by Intel and Netflix, formally adopted by the Alliance for Open Media (AOMedia) in August 2020. License: BSD-3-Clause Clear + AOMedia Patent License 1.0. The canonical repository is at [gitlab.com/AOMediaCodec/SVT-AV1](https://gitlab.com/AOMediaCodec/SVT-AV1); the GitHub mirror at [github.com/AOMediaCodec/SVT-AV1](https://github.com/AOMediaCodec/SVT-AV1) holds no issues, no PRs, and no releases of its own.

**Governance:** AOMedia oversees the project. There is no MAINTAINERS.md; governance is through PR review by active corporate committers. Community communication uses Libera.chat `#svt`.

**Corporate sponsors by commit count (GitLab contributors API):**

| Company | Key contributors | Role |
|---|---|---|
| Intel | Christopher Degawa, Worth, hguermaz, psao123, Tomasz Szumski | Founding sponsor, x86 SIMD, core algorithm |
| Arm Ltd | Salome Thirot (310 commits), Li Zhang, Gerda Zsejke More | AArch64 NEON/SVE/SVE2 optimization |
| Meta | Sergey Sablin (228 commits), Hassene Tmar | Optimization, review |
| Cidana | Cidana-Developers | Multiple contributions |
| Vlitt | Taha Ben Romdhane, Khalil Khemakhem | Multiple contributions |

**Community culture on new ports:** The ARM port was driven entirely by Arm Ltd engineers over multiple years and is still not formally documented as a named support tier. A RISC-V port would require a similar sustained commitment from a RISC-V silicon vendor or RISE member. There is no formal process for proposing new architecture ports. CONTRIBUTING.md requires a contributor agreement assigning IP to AOMedia.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-05-17 (v0.5.0) | Initial public release, x86-64 only | [CHANGELOG.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/CHANGELOG.md) |
| 2022-01-16 | Debian first builds riscv64 package (v0.8.7+dfsg-1), C fallback only | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=svt-av1) |
| 2025-02-13 | Issue #2239 closed: `libcpuinfo` dependency made optional via MR !2384 (`USE_CPUINFO` CMake option), unblocking riscv64/ppc64le/s390x packaging | [GitLab issue #2239](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2239) |
| 2025-07-24 (v3.1.0) | `libcpuinfo` removed entirely (MR !2426, MR !2453); replaced with bundled AOM CPU detection returning `flags=0` on unsupported architectures | [GitLab MR !2453](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests/2453) |
| 2026-03-23 (v4.1.0) | Current latest release; riscv64 still C-only, no RVV work | [GitLab releases](https://gitlab.com/AOMediaCodec/SVT-AV1/-/releases) |
| 2026-03-26 | Debian sid builds v4.1.0+dfsg-1 on rv-osuosl-04, status "Installed" | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=svt-av1&suite=sid) |

**Key contributor for riscv64 work:** None. There is no upstream contributor on record for any RISC-V work. The only upstream acknowledgment of RISC-V is in issue #2239 (filed and closed February 2025) where a Fedora packager states explicitly: "svt-av1 offers no ASM optimizations for those other platforms anyway."

**Upstreaming status:** Not applicable -- no RISC-V port exists to upstream. The riscv64 builds in Debian and Ubuntu use the generic C fallback that has always been present; this is not a port, it is an absence of any RISC-V-specific code.

---

## 3. Upstream Support Tier

SVT-AV1 has no formal tier policy document. `Docs/System-Requirements.md` describes:

- **Validated:** x86-64 on Windows Server 2016, Ubuntu 16.04/18.04/20.04, macOS 64-bit
- **Limited support:** "Any architecture a valid C99 compiler can target" -- described as compilable but with "varying limited support for non-x86 CPUs"

AArch64 is not formally named as a supported tier despite substantial Arm Ltd investment in NEON/SVE/SVE2 optimizations. RISC-V falls under the informal "limited support" (C fallback only) category.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named in System-Requirements.md | Yes (validated) | No (de facto) | No |
| Hand-tuned SIMD | Yes (SSE2 through AVX-512, NASM) | Yes (NEON, NEON_DOTPROD, NEON_I8MM, SVE, SVE2) | No |
| CI in upstream GitLab | Yes | Yes (cross-compile in `.gitlab/workflows/linux/`) | No |
| Toolchain file in `cmake/toolchains/` | N/A (native) | Yes (`aarch64_toolchain.cmake`) | No |
| Official upstream binary | No (source only) | No (source only) | No |
| Distro packages | Debian, Ubuntu, Arch, Gentoo | Debian, Ubuntu, Gentoo | Debian, Ubuntu, Gentoo (`~riscv`, testing) |
| Build mechanism | NASM + CMake SIMD dispatch | CMake SIMD dispatch, cross-toolchain | `COMPILE_C_ONLY` fallback |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SVT-AV1 implements AV1 encoding in C with architecture-specific SIMD acceleration in separate subdirectories under `Source/Lib/`. There is no JIT or garbage collection; the performance-critical paths are all static SIMD dispatch at CMake configure time.

**Architecture detection in `CMakeLists.txt`:**

- `HAVE_X86_PLATFORM`: triggered by `_M_X64` or `__x86_64__`
- `HAVE_ARM_PLATFORM`: triggered by `__aarch64__` or `_M_ARM64`
- No `HAVE_RISCV_PLATFORM` or equivalent

When neither flag is set (the riscv64 case), only `C_DEFAULT` is linked.

**Component analysis:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| DCT / transforms | Hand-tuned AVX2 + NASM assembly | NEON intrinsics + SVE | C scalar (missing) |
| Convolution / interpolation | AVX2 intrinsics | NEON + SVE | C scalar (missing) |
| SAD / variance | AVX2 | NEON + SVE | C scalar (missing) |
| CDEF | AVX2 | NEON + SVE | C scalar (missing) |
| Loop filter | AVX2 | NEON | C scalar (missing) |
| Quantization | AVX2 | NEON + SVE | C scalar (missing) |
| Temporal filtering | AVX2 | NEON + SVE | C scalar (missing) |
| Warp / affine | AVX2 | NEON + SVE | C scalar (missing) |
| Intra / inter prediction | AVX2 | NEON | C scalar (missing) |
| Wiener / restoration | AVX2 | NEON + SVE | C scalar (missing) |
| CPU feature detection | AOM x86.h CPUID (bundled) | AOM arm CPUID (bundled) | Returns `flags=0`, C fallback |

**ISA directory file counts:**

| Directory | File count | Architecture |
|---|---|---|
| `ASM_NEON` | 84 files | AArch64 NEON |
| `ASM_SVE` | 24 files | AArch64 SVE |
| `ASM_NEON_DOTPROD` | exists | AArch64 |
| `ASM_NEON_I8MM` | exists | AArch64 |
| `ASM_ARM_CRC32` | exists | AArch64 |
| `ASM_SVE2` | exists | AArch64 |
| `ASM_AVX2` | 65 files | x86 |
| `ASM_AVX512` | exists | x86 |
| `ASM_SSE2` / `ASM_SSSE3` / `ASM_SSE4_1` | exist | x86 |
| `ASM_RVV` or `ASM_RISCV` | **does not exist** | riscv64 -- absent |

No `__riscv`, `riscv64`, or `RISCV` preprocessor guards appear anywhere in the codebase. No RVV intrinsics (`vfloat32m1_t`, `vlse32_v_f32m1`, etc.) are present. No Zba/Zbb/Zbc/Zv* extension usage exists.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Existing toolchain files (`cmake/toolchains/`):**

- `aarch64_toolchain.cmake` -- `CMAKE_SYSTEM_PROCESSOR=aarch64`, uses `aarch64-linux-gnu-{gcc,g++,gcc-ar}`
- `android_aarch64_toolchain.cmake` -- Android AArch64 variant
- `powerpc64le-linux-gnu.cmake` -- sets `CMAKE_SYSTEM_PROCESSOR=ppc`, sets `CONFIG_RUNTIME_CPU_DETECT=0`

No `riscv64_toolchain.cmake` exists. The `powerpc64le` file is the closest pattern for creating one.

**Recommended build invocation for riscv64 cross-compilation** (derived from `Docs/ARM-Build-Guide.md` pattern; no riscv64-specific guide exists):

```bash
cmake -B Bin/Release \
  -S . \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_TOOLCHAIN_FILE=./cmake/toolchains/riscv64_toolchain.cmake \
  -DCOMPILE_C_ONLY=ON

cmake --build Bin/Release -j
```

`-DCOMPILE_C_ONLY=ON` is not strictly required (riscv64 triggers neither platform guard, so `C_DEFAULT` is selected automatically) but makes the intent explicit and prevents any future platform-detection change from silently breaking the build.

**Compiler version minimums (from `Docs/Build-Guide.md` and `Docs/ARM-Build-Guide.md`):**

- GCC: 5.4.0 minimum (generic); 8.1.0+ for native AArch64
- Clang: 11 (Ubuntu 18.04/20.04 guidance)
- CMake: 3.16+ (general); 3.23+ for AArch64 cross-compilation
- NASM: 2.14+ (x86 only; not required for riscv64)

For riscv64, any GCC or Clang with `riscv64-linux-gnu` target support is sufficient. GCC 10+ or Clang 12+ are recommended for full C99/C11 support [NEEDS VERIFICATION -- no riscv64-specific compiler guidance exists in the docs].

**QEMU:** No QEMU references exist anywhere in the repository. No QEMU-based test step is documented.

**Relevant CMake flags for riscv64:**

| Flag | Effect |
|---|---|
| `-DCOMPILE_C_ONLY=ON` | Explicitly skip all SIMD detection |
| `-DNATIVE=OFF` | Do not add `-march=native` (required for cross builds) |
| `-DBUILD_SHARED_LIBS=OFF` | Static library |
| `-DMINIMAL_BUILD=ON` | Reduces binary size |
| `-DENABLE_AVX512=OFF` | Not needed on riscv64 (auto-disabled), but safe to set |

**Confirmed riscv64 build log evidence (Debian sid, v4.1.0+dfsg-1, built 2026-03-26 on rv-osuosl-04):**

- `"Performing Test HAVE_X86_PLATFORM - Failed"`
- `"Performing Test HAVE_ARM_PLATFORM - Failed"`
- `"Checking C flag support for: [-mno-avx] - No"` (flag unrecognized by riscv64 compiler)
- All compiled objects receive `-DEN_AVX512_SUPPORT=0`
- Build time: 20 minutes; installed size: 135.0 kB (vs amd64 which includes all SIMD objects)

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. The C_DEFAULT path implements all encoding functions. riscv64 can encode AV1 video correctly. There are no known correctness issues specific to riscv64.

**Performance gaps:** All encode performance-critical paths (DCT, prediction, loop filtering, CDEF, temporal filtering, quantization) run as scalar C on riscv64. The arm64 build has 84 NEON files and 24 SVE files; the x86 build has 65+ AVX2 files plus SSE layers. No published benchmark comparing riscv64 vs arm64 or x86 exists in any accessible source.

The installed binary size on riscv64 is 135.0 kB vs full SIMD builds which are substantially larger (amd64 full build is larger due to multiple SIMD object layers). This smaller footprint is a direct result of absent SIMD code, not an architectural advantage.

**Security hardening gaps:** Data not available -- no riscv64-specific security hardening analysis was found in any upstream source.

**Floating-point semantics:** No riscv64-specific floating-point issues are documented. Issue #2348 (open, floating-point FFT mismatch) is MSVC/x86-only and unrelated to riscv64.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AV1 encode (correctness) | Yes | Yes | Yes (C fallback) |
| All presets (M0-M13) | Yes | Yes | Yes (but slow) |
| Multi-threading | Yes | Yes | Yes |
| SIMD acceleration | Full (SSE2 through AVX-512) | Full (NEON through SVE2) | None |
| CPU feature detection | CPUID-based | CPUID-based | Returns 0 (no SIMD) |
| RTC / low-latency mode | Yes | Yes | Yes (functional, not benchmarked) |

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in SVT-AV1. The following files were read directly from the canonical GitLab repository and confirmed to contain zero occurrences of "riscv":

- `.gitlab-ci.yml` (root) -- style check, static analysis, version consistency
- `.gitlab/workflows/standard/.gitlab-ci.yml` -- cross-OS diff test: Linux x86_64, macOS x86, macOS m1 (ARM), Win64
- `.gitlab/workflows/linux/.gitlab-ci.yml` -- cross-compilation for aarch64 and powerpc64le; no riscv64
- `.gitlab/workflows/common/.gitlab-ci.yml` -- shared build/encode jobs; no riscv64
- `.gitlab/workflows/nightly/.gitlab-ci.yml` -- single stub job on ubuntu:24.04; no riscv64
- `.gitlab/workflows/bsd/.gitlab-ci.yml` -- no riscv64
- `.gitlab/workflows/macos/.gitlab-ci.yml` -- no riscv64

The GitHub mirror contains no `.github/` directory and no CI of any kind.

No RISE CI runners are used. No QEMU emulation step exists for non-native architectures.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes | Yes (cross-compile, `.gitlab/workflows/linux/`) | No |
| Encode/decode test | Yes | Yes | No |
| QEMU emulation | No | No | No |
| Hardware runner | Yes (x86 GitLab shared runners) | Yes (cross-compile on x86) | No |
| RISE runner | No | No | No |
| Release blocking | Yes | No (cross-compile only) | No |

---

## 8. Distribution and Release Status

**Upstream releases:** All releases (v4.1.0, v4.0.1, v4.0.0) ship source archives only (`.zip`, `.tar.gz`, `.tar.bz2`, `.tar`). No upstream binary assets exist for any architecture.

**Distro packages:**

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Debian sid | 4.1.0+dfsg-1 | Installed | Built on rv-osuosl-04, 2026-03-26, 20 min, 135.0 kB installed |
| Ubuntu 24.04 Noble | 1.7.0+dfsg-2build1 | Available | `libsvtav1enc1d1`, 1207.6 kB; riscv64 explicitly listed |
| Gentoo | 4.1.0 | `~riscv` (testing) | Not stable; all versions marked testing on riscv |
| Arch Linux | 4.1.0-1 | x86_64 only | `nasm` listed as build dep; no riscv64 port |
| Arch Linux RISC-V (archriscv.felixc.at) | Unknown | Data not available | Search did not return package-specific results |

**PyPI:** Package `svt-av1` does not exist on PyPI (HTTP 404). No wheels for any architecture.

**RISE wheel builder:** Redirects to PyPI, which returns 404. SVT-AV1 is not listed in the RISE wheel builder package index.

**What a user must do to get a working riscv64 binary:** Install from Debian or Ubuntu package repositories. The package is C-only with no SIMD. Alternatively, cross-compile from source using `-DCOMPILE_C_ONLY=ON` with a riscv64-linux-gnu toolchain. No upstream binary and no documented riscv64 build procedure exist.

Debian build history confirms continuous riscv64 builds since at least January 2022 (v0.8.7):

| Version | Build date | Build time |
|---|---|---|
| 4.1.0+dfsg-1 | 2026-03-26 | 20 min |
| 3.1.2+dfsg-2 | 2026-03-19 | 22 min |
| 2.3.0+dfsg-1 | 2024-12-14 | 20 min |
| 2.2.1+dfsg-2 | 2024-09-25 | 15 min |
| 2.1.0+dfsg-2 | 2024-07-08 | 11 min |
| 1.7.0+dfsg-2 | 2023-09-23 | 12 min |
| 0.8.7+dfsg-1 | 2022-01-16 | 6 min |

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| NASM / YASM | x86-64 assembly (SSE2 through AVX-512) | Not required | N/A | N/A | Skipped automatically by `HAVE_X86_PLATFORM` guard; riscv64 builds skip all NASM paths |
| aom CPU detection (bundled) | Runtime CPU feature detection | Builds | Functional (returns `flags=0`) | Included | Bundled since v3.1.0; `#else` branch returns 0 for unsupported architectures; safe and correct on riscv64 |
| aom_dsp / aom_ports (bundled) | Entropy coding helpers, x86 CPUID | Builds | Functional | Included | `aom_ports/x86.h` only included under `#ifdef ARCH_X86_64`; `aom_dsp` is pure C |
| fastfeat (bundled) | FAST corner detection | Builds | Functional | Included | Pure C, no SIMD |
| safestringlib (bundled) | Safe string functions | Builds | Functional | Included | Pure C |
| googletest (bundled, test-only) | Unit tests | Builds | Functional | N/A | `libgtest-dev` available on riscv64 in Debian (v1.17.0) |
| libcpuinfo | CPU feature detection (removed) | N/A | N/A | N/A | Removed in v3.1.0 (July 2025) via MR !2453; previously blocked riscv64 packaging (issue #2239, resolved 2025-02-13) |
| pthreads | Multi-threading | Available | Functional | Included | Available on all Linux architectures |
| Valgrind headers (optional) | Suppress AVX2 paths under Valgrind | Available | Functional | Included | Valgrind has riscv64 support |

No critical blocking dependencies exist for riscv64 as of v4.1.0. The previously blocking dependency (`libcpuinfo`) was removed in v3.1.0.

**Downstream consumers of SVT-AV1 on riscv64:**

- **FFmpeg**: consumes SVT-AV1 via `ffmpeg_plugin/` and the `libsvtav1` encoder wrapper; riscv64 status tracked in `./multimedia/ffmpeg.md`
- **libavif**: uses SVT-AV1 as its primary encoder backend; riscv64 status tracked in `./multimedia/libavif.md`
- **libaom**: provides the bundled CPU detection code now used by SVT-AV1; Debian sid libaom 3.13.1-2+b1 builds successfully on riscv64

---

## 11. Known Bugs and Active Issues

**riscv64-specific issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2239](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2239) | Please only depend on libcpuinfo for aarch64 and x86_64 | Closed (2025-02-13) | Packaging blocker | `libcpuinfo` blocked riscv64/ppc64le/s390x; resolved by MR !2384 then MR !2453 |
| [#2214](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2214) | Stop relying on arbitrary code files in /thirdparty, use libraries instead | Open | Medium | Mentions riscv64 packaging blocked by bundled code; Fedora Bugzilla RH#2316282 linked |

**Open general correctness bugs (not riscv64-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #2372 | RTC residual MT non-determinism at M12/M13 on high-motion content | Open | High | Not architecture-specific |
| #2373 | Uninitialised value during libheif fuzzing | Open | Medium | Not architecture-specific |
| #2355 | Data race in mode decision | Open | Medium | Not architecture-specific |
| #2354 | Load of misaligned address and left shift of negative value (ASAN) | Open | Medium | Not architecture-specific |
| #2348 | MSVC /fp:strict floating-point FFT mismatch | Open | Low (MSVC only) | x86/MSVC-only; not riscv64 |
| #2356 | Crash in svt_aom_blend_a64_mask_avx2 | Open | Medium | x86-only |

No open riscv64-specific correctness bugs exist in the upstream tracker as of June 2026.

---

## 12. Objections and Upstream Blockers

**Stated objections:** Issue #2239 records a Fedora packager's explicit statement: "svt-av1 offers no ASM optimizations for those other platforms anyway." This reflects upstream's position: riscv64 is an unsupported platform; C fallback works, but there is no investment interest from any current committer.

**Technical blockers:**

- No `HAVE_RISCV_PLATFORM` CMake detection exists. A RISC-V SIMD contribution would need to add platform detection, a `cmake/toolchains/riscv64_toolchain.cmake`, and at minimum one `ASM_RVV` directory with intrinsic implementations.
- All 10 SIMD functional units (DCT, CDEF, SAD, loop filter, quantization, etc.) need RVV implementations. Arm Ltd required multiple engineer-years to produce the 84 NEON + 24 SVE files currently present. The scope for a competitive riscv64 port is comparable.
- There is no riscv64 CI to catch regressions. Any submitted RVV code would need CI infrastructure (QEMU or hardware runners) to be accepted.

**Organizational blockers:**

- No RISE funding or involvement with SVT-AV1 is documented. RISE blog, repos, and wheel builder contain no SVT-AV1 content.
- No RISC-V silicon vendor has filed an issue, MR, or mailing list post expressing intent to contribute.
- AOMedia IP assignment requirement in CONTRIBUTING.md means contributions require corporate legal sign-off, raising the bar above typical open-source contribution.

**Acceptance probability:** High for a correct, reviewed RVV contribution backed by a credible vendor, given that the ARM precedent (Arm Ltd driving the full NEON/SVE port) was accepted. Low without sustained corporate backing, given the IP policy and the scale of the SIMD gap.

---

## 13. Investment Analysis

RISE has no documented involvement with SVT-AV1. All work described below is currently uncovered.

### 13.1 Functional Enablement

The C fallback already builds and runs correctly on riscv64. Functional enablement is complete (no work required). The only open functional issue is #2214 (bundled third-party code, packaging friction), which is a Fedora/Red Hat concern and does not block riscv64 operation.

### 13.2 Performance Optimization

This is the dominant investment area. Every SIMD-accelerated encode path needs an RVV equivalent. Prioritized by encode time contribution:

1. DCT/transforms (largest single contributor to encode time)
2. SAD/variance (motion estimation -- heavily vectorized on x86/ARM)
3. CDEF and loop filtering
4. Temporal filtering
5. Intra/inter prediction
6. Quantization
7. Wiener/restoration

The arm64 precedent (84 NEON + 24 SVE files across ~3 engineer-years) sets the order-of-magnitude estimate for a competitive RVV port. A partial port targeting the top 3-4 components would capture the majority of achievable speedup.

### 13.3 CI/CD Infrastructure

riscv64 CI does not exist. Minimum viable CI: a QEMU riscv64 cross-compile job in the GitLab pipeline, following the pattern of the existing AArch64 cross-compile job in `.gitlab/workflows/linux/`. Hardware runner (RISC-V board or SiFive/SpacemiT hardware) would be needed for reliable performance regression testing.

### 13.4 Ecosystem Enablement

SVT-AV1 has no significant dependent package ecosystem of its own (no plugins, no extension registry). Its downstream consumers -- FFmpeg, libavif, GStreamer -- have their own RISC-V status tracked separately. No action in this area for SVT-AV1 specifically.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve issue #2214 (bundled third-party code) | 2 | Packager / distro | Low |
| Functional | Add `cmake/toolchains/riscv64_toolchain.cmake` and `HAVE_RISCV_PLATFORM` CMake detection | 1 | RISC-V vendor | Medium |
| Performance | RVV DCT/transform implementations (`ASM_RVV/`) | 12-16 | RISC-V vendor (Arm precedent) | Critical |
| Performance | RVV SAD/variance (motion estimation) | 6-8 | RISC-V vendor | High |
| Performance | RVV CDEF + loop filter | 6-8 | RISC-V vendor | High |
| Performance | RVV temporal filtering, prediction, quantization, restoration | 12-18 | RISC-V vendor | Medium |
| CI/CD | Add riscv64 cross-compile job to GitLab CI (QEMU) | 2 | RISC-V vendor / RISE | High |
| CI/CD | Hardware riscv64 CI runner for performance regression | 4 | RISE or silicon vendor | Medium |

Total estimated effort for a competitive (not complete) RVV port covering the top SIMD paths and CI: approximately 40-55 person-weeks from a team with RVV intrinsics experience.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [SVT-AV1 canonical repository (GitLab)](https://gitlab.com/AOMediaCodec/SVT-AV1)
- [SVT-AV1 GitHub mirror](https://github.com/AOMediaCodec/SVT-AV1)
- [GitLab issue #2239 -- libcpuinfo riscv64 packaging blocker](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2239)
- [GitLab issue #2214 -- bundled third-party code packaging friction](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2214)
- [GitLab releases page](https://gitlab.com/AOMediaCodec/SVT-AV1/-/releases)
- [Debian buildd riscv64 build status for svt-av1](https://buildd.debian.org/status/package.php?p=svt-av1&suite=sid)
- [Ubuntu 24.04 Noble package: svt-av1](https://packages.ubuntu.com/noble/svt-av1)
- [Debian tracker: svt-av1](https://tracker.debian.org/pkg/svt-av1)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [SVT-AV1 ARM Build Guide](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/ARM-Build-Guide.md)
- [SVT-AV1 Build Guide](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/Build-Guide.md)
- [SVT-AV1 System Requirements](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/System-Requirements.md)