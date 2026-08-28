---
title: jpegli
parent: Project Reports
---

# jpegli

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for jpegli<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

jpegli is a JPEG encoding and decoding library developed by Google, published as open source in April 2024. It was originally part of [libjxl](https://github.com/libjxl/libjxl) and was spun out into the standalone [google/jpegli](https://github.com/google/jpegli) repository in early-to-mid 2024. The library reimplements JPEG encoding and decoding with improvements targeting compression efficiency and perceptual quality; the April 2024 Google announcement claims 35% compression improvement at high quality settings and a bitrate advantage of roughly 32% over libjpeg-turbo at equivalent perceptual quality (ELO study on the Cloudinary Image Dataset '22). Encoding and decoding speed is described as "comparable to traditional approaches" with no specific throughput figures published.

**Governance:** jpegli has no independent foundation. It is hosted under the `google` GitHub organization and governed exclusively by Google. The CONTRIBUTING.md states that contributors must sign a Google CLA, with Google named as the legal entity receiving CLAs and relicensing software. There is no MAINTAINERS, OWNERS, or CODEOWNERS file. The project carries a BSD-3-Clause license with an additional patent grant covering JPEG XL-related patents owned by Google (PATENTS file).

**Corporate sponsors:** Two entities are named as initial contributors: Google LLC and Cloudinary Ltd. Named Google employees from the AUTHORS file include Evgenii Kliuchnikov (eustas@google.com, top active committer), Iulia Comsa, Jan Wassenberg, Jyrki Alakuijala, Lode Vandevenne, Luca Versari, Marcin Kowalczyk, Martin Bruse, Moritz Firsching, Sami Boukortt, Sebastian Gomez, Thomas Fischbacher, and Zoltan Szabadka. Cloudinary's contributor is Jon Sneyers (jon@cloudinary.com).

**Community stance on new ports:** The single riscv64-related build fix in the repository's history was contributed by an external Yocto/OpenEmbedded maintainer (Khem Raj) rather than by a Google team member. The fix was accepted promptly after a minor process correction (author attribution in the wrong file) and was reviewed and approved within 48 hours. The 11-month gap between approval and merge in the upstream libjxl repo has no documented explanation in the PR thread. The Google jpegli team does not actively test, promote, or maintain riscv64 support.

**RISE Project membership:** jpegli is not a member project. No RISE blog posts, RFPs, or announcements mention jpegli. jpegli is absent from the RISE wheel builder project list (79 projects listed, none is jpegli).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-02-22 | Add missing `<atomic>` header for GCC compilation on riscv64 (libjxl PR #2211, co-authored by community contributor "Eastdong" from Wuhan with Google's Moritz Firsching). This was a build fix, not a new port. | [libjxl#2211](https://github.com/libjxl/libjxl/pull/2211) |
| 2022-06 | StarFive Technology contributor (Rebecca Chang Swee Fun) opened libjxl PR #1429 to add a `JXL_ARCH_RISCV64` preprocessor macro. The macro had no use site. PR was closed by the author when their original Chromium build issue was resolved independently. | [libjxl#1429](https://github.com/libjxl/libjxl/pull/1429) |
| 2024-09-14 | libjxl PR #3826 opened by Khem Raj (Yocto/OpenEmbedded maintainer, external): "cmake: Do not use -mrelax-all with clang on RISCV64." Fixes a clang 19+ crash caused by double branch relaxation exhausting the range of unconditional jumps on riscv64. Approved within 48 hours by sboukortt (Google). | [libjxl#3826](https://github.com/libjxl/libjxl/pull/3826) |
| 2025-08-08 | libjxl PR #3826 merged (11 months after approval; no documented reason for the delay). | [libjxl#3826 merge](https://github.com/libjxl/libjxl/pull/3826) |
| 2026-03-06 | The `-mrelax-all` fix cherry-picked directly into google/jpegli as commit `5a25e1ef` by eustas@google.com. No PR opened in the standalone repo. | [jpegli commit 5a25e1e](https://github.com/google/jpegli/commit/5a25e1ef3e1d53f4103262ab8992f553c2e041fa) |

**Key contributors:** Khem Raj (Yocto/OpenEmbedded, external) authored the critical clang build fix. "Eastdong" (individual contributor, Wuhan, no company affiliation) contributed the atomic header fix in 2023. Neither contributor is affiliated with Google. No Google engineer has authored a riscv64-specific improvement.

**Is the port fully upstream?** The two build fixes are merged. There is no riscv64 CI, no RVV enablement by default, and no tracking issue. The port is build-functional when cross-compiled but is not validated upstream.

---

## 3. Upstream Support Tier

jpegli has no documented tier policy for architecture support.

**Evidence by dimension:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI in `.github/workflows/` | Yes - native and cross (x64 with AVX-512 via SDE) | Partial - armhf cross only (32-bit ARM, not arm64) | No |
| Release binaries | No (google/jpegli has zero releases or tags) | No | No |
| Release-blocking tests | N/A (no releases) | N/A | N/A |
| Official packaging (Debian) | Bundled in libjxl | Bundled in libjxl | Bundled in libjxl (build reported successful, riscv64 arch listed) |
| SIMD default-enabled | Yes (SSE2, AVX variants) | Yes (NEON/SVE via Highway) | No (RVV is in `JPEGLI_HWY_TARGETS_OFF_BY_DEFAULT`) |

The google/jpegli repo has no releases at all - not for any architecture. The SIMD story for riscv64 is structurally present through Highway but disabled at the default cmake configuration.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

jpegli uses Google Highway (`third_party/highway`, bundled submodule) as its sole SIMD abstraction layer. All hot paths in the library (IDCT, render pipeline, upsample, color transform, SIMD dispatch) use Highway's portable API (`HWY_DYNAMIC_DISPATCH`, `foreach_target.h`). There are zero architecture-specific hand-written source files, zero `.S` assembly files, and zero intrinsic-level files in jpegli proper for any architecture, including x86 and arm64.

**SIMD implementation model:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| IDCT | Via Highway (SSE2, AVX2, AVX-512) | Via Highway (NEON, SVE) | Via Highway (RVV, opt-in only) |
| Render pipeline | Via Highway | Via Highway | Via Highway (opt-in only) |
| SIMD dispatch (`simd.cc`) | Via Highway | Via Highway | Via Highway (opt-in only) |
| Hand-written `.S` assembly | None | None | None |
| Arch-specific intrinsic files | None | None | None |
| Cost tables (pre-measured, for ARM) | N/A | `test_cost-arm64.zip`, `test_cost-armhf.zip` exist | None |
| JIT compilation | Not present in jpegli | Not present | Not present |

**RVV via Highway:**

`CMakeLists.txt` line 119 lists `RVV` as a recognized Highway target. Line 120 places `RVV` in `JPEGLI_HWY_TARGETS_OFF_BY_DEFAULT` alongside AVX3 variants and SVE. This means RVV is compiled out of the runtime dispatch table unless the build explicitly passes `-DJPEGLI_ENABLE_HWY_RVV=ON`. Without that flag, the Highway runtime dispatcher will not select the RVV codepath even on hardware that supports it; scalar `EMU128` runs instead.

The actual RVV implementation is in the bundled Highway submodule at `third_party/highway` (pinned to SHA `271a9a0`, Highway version 1.2.0, January 2026 [NEEDS VERIFICATION on exact month]). `hwy/ops/rvv-inl.h` in that submodule is 6,595 lines and implements the full Highway API using `<riscv_vector.h>` intrinsics (LMUL-based typed vectors: `vfloat32m1_t`, `vuint8m1_t`, etc.). ISA extensions used: base RVV (`__riscv_v`), optional `Zvfhmin` for float16 (`HWY_RVV_HAVE_F16C`). Required compiler: GCC >= 13 or Clang >= 16 (older compilers set `HWY_BROKEN_RVV`). RVV intrinsics version >= 0.11 required (`__riscv_v_intrinsic >= 11000`).

**Note on Highway version pinning:** libjxl bundles Highway v1.2.0. RVV runtime dispatch was re-enabled in Highway v1.4.0 (April 2026). An upgrade PR exists in libjxl (bot PR #2269) but is not yet merged as of the research date. Until that upgrades, jpegli on riscv64 uses EMU128 scalar fallback even when built with `-DJPEGLI_ENABLE_HWY_RVV=ON`, because the pinned submodule version does not support RVV runtime dispatch.

**Fast lossless encoding (`enc_fast_lossless.cc`):** The `FJXL_GENERIC_SIMD` macros activate for x86 (SSE4, AVX2, AVX-512) and ARM (NEON) but not riscv64. No `__riscv` guard or RVV backend exists in this file. No open issue or PR for an RVV backend in this component has been found. The scalar fallback is functional but operates at a lower chunk size (`kLogChunkSize=3`) compared to AVX-512 (`kLogChunkSize=5`).

**Atomics:** `cmake/FindAtomics.cmake` contains an explicit riscv64 note: GCC has a known bug where it does not convert sub-word (1-byte, 2-byte) atomics via masking/shifting as LLVM does. The cmake module auto-detects this and links `-latomic` when needed. No manual flag is required from the user.

---

## 5. Build System, Cross-Compilation, and Toolchain

**CMake minimum version:** 3.16 (`cmake_minimum_required(VERSION 3.16...3.27)`).

**Toolchain requirements for riscv64:**
- Clang: the `-Xclang -mrelax-all` flag is explicitly skipped when `CMAKE_SYSTEM_PROCESSOR` matches `riscv` (CMakeLists.txt line 342). This is required because clang 19+ crashes on riscv64 when `-mrelax-all` is applied (double branch relaxation exhausts the range of unconditional jumps, causing link failure).
- No explicit GCC/Clang minimum version is enforced in CMakeLists.txt for general builds.
- For RVV SIMD (`-DJPEGLI_ENABLE_HWY_RVV=ON`): GCC >= 13 or Clang >= 16 required (from Highway's `HWY_BROKEN_RVV` guards). Also requires RVV in the `-march` string (e.g., `-march=rv64gcv`).
- GCC on riscv64 requires `-latomic` for 1-byte/2-byte atomics; cmake/FindAtomics.cmake handles this automatically.

**Cross-compilation commands:**

Using `ci.sh`:
```bash
BUILD_TARGET=riscv64-linux-gnu \
CMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64 -L /usr/riscv64-linux-gnu" \
./ci.sh release \
  -DJPEGLI_ENABLE_JNI=OFF \
  -DJPEGLI_ENABLE_BENCHMARK=OFF \
  -DJPEGLI_ENABLE_OPENEXR=OFF
```

Direct cmake invocation:
```bash
mkdir build-riscv && cd build-riscv
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER_TARGET=riscv64-linux-gnu \
  -DCMAKE_CXX_COMPILER_TARGET=riscv64-linux-gnu \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_CROSSCOMPILING=1 \
  -DHAVE_STD_REGEX=0 \
  -DHAVE_POSIX_REGEX=0 \
  -DHAVE_GNU_POSIX_REGEX=0 \
  -DHAVE_STEADY_CLOCK=0 \
  -DHAVE_THREAD_SAFETY_ATTRIBUTES=0 \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu \
  -DCMAKE_PREFIX_PATH=/usr/riscv64-linux-gnu \
  -DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64 -L /usr/riscv64-linux-gnu" \
  -DJPEGLI_ENABLE_JNI=OFF
cmake --build . -- -j$(nproc)
```

**Required cmake flags for riscv64 cross-compilation:**

| Flag | Value | Reason |
|---|---|---|
| `-DJPEGLI_ENABLE_HWY_RVV=OFF` | Default | RVV disabled by default; enable only with a toolchain that supports RVV intrinsics and Highway >= 1.4.0 |
| `-DJPEGLI_ENABLE_JNI=OFF` | Recommended | JNI requires Java on target; not available in cross-compilation |
| `-DCMAKE_CROSSCOMPILING=1` | Required | Forces googletest cross-compile compatibility variables |
| `-DHAVE_STD_REGEX=0` etc. | Required | Disables cmake test-execution probes that fail under QEMU |

**Debian/Ubuntu cross toolchain setup (from `tools/scripts/install_deps.sh`):**
```bash
sudo ARCH=riscv64 BUILD_TARGET=riscv64-linux-gnu \
  ./tools/scripts/install_deps.sh --cross build extras
sudo apt install qemu-user qemu-user-static
```

**No riscv64-specific Dockerfiles or toolchain cmake files exist in the repo.** CI runs on `ubuntu-latest` GitHub runners with apt-installed cross toolchains.

**Known build failures fixed:** The clang 19+ crash from `-mrelax-all` on riscv64 is fixed as of commit `5a25e1ef` (2026-03-06). No other known build failures are documented.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JPEG encode/decode (correctness) | Yes | Yes | Yes |
| Highway SIMD acceleration | Yes, default-on (SSE2, AVX2, AVX-512) | Yes, default-on (NEON/SVE) | No, default-off (RVV opt-in; and Highway v1.2.0 pin blocks runtime dispatch even when opted in) |
| Fast lossless path (`enc_fast_lossless.cc`) | Yes (SSE4/AVX2/AVX-512 backends) | Yes (NEON backend) | No (scalar fallback only; no RVV backend) |
| JNI bindings | Yes | Yes | Build flag must be set OFF for cross-compilation |
| Atomics | Natively supported | Natively supported | Auto-detected; `-latomic` linked by cmake for sub-word atomics (GCC bug workaround) |
| CI-validated correctness | Yes | Partial (armhf/32-bit ARM cross; not arm64 native) | No |
| Pre-measured cost tables | N/A | Yes (arm64, armhf) | No |

**Performance gaps:**

The primary performance gap is the Highway SIMD stack:
1. RVV is disabled by default. At default config, all Highway-accelerated kernels (DCT, transforms, convolution, ANS coding) run on EMU128 scalar fallback.
2. Even with `-DJPEGLI_ENABLE_HWY_RVV=ON`, the bundled Highway v1.2.0 pin disables RVV runtime dispatch. Upgrading to Highway >= 1.4.0 is required before RVV acceleration is functional. The libjxl upgrade PR (#2269) has not merged.
3. `enc_fast_lossless.cc` has no RVV backend. Lossless encoding is scalar at a lower chunk size than x86 and ARM paths.
4. No published riscv64 benchmark numbers exist for jpegli. All published figures (35% compression improvement, bitrate comparisons) are architecture-agnostic x86 measurements.

**Functional gaps:** None. jpegli produces correct JPEG output on riscv64 at default (scalar) configuration. No correctness gap has been reported.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening analysis was found in the research.

**Floating-point semantics:** Data not available: no riscv64-specific floating-point behavior issues were found in the research.

---

## 7. CI/CD Infrastructure

**riscv64 CI status: none.** All 12 workflow files in `.github/workflows/` were read. Zero contain the string "riscv". The cross-compilation workflow (`build_test_cross.yml`) covers only `armhf`, `i386`, and `x64` (with AVX-512 emulation via Intel SDE). No `riscv64` matrix entry, no QEMU riscv64 step, and no riscv64 runner exist in any workflow.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes | No | No |
| Cross-compilation job | Yes (i386, x64) | Yes (armhf/32-bit ARM) | No |
| QEMU emulation | No | No | No |
| SIMD-extended tests (e.g., Intel SDE for AVX-512) | Yes | No | No |
| Fuzz testing (`fuzz.yml`) | Data not available | Data not available | No |
| RISE CI runners | No | No | No |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo (all returned 404 during research).

**CI implication:** Highway RVV bugs (see Section 11) are not caught by jpegli's own test suite. riscv64 regressions would only be detected by downstream distributors.

---

## 8. Distribution and Release Status

**google/jpegli standalone repo:** Zero releases, zero tags. The GitHub API `releases` endpoint returns `[]`. No riscv64 binary exists from this repo for any architecture.

**libjxl-bundled distribution (jpegli as a library inside libjxl):**

| Distribution | Package | riscv64 status |
|---|---|---|
| Debian sid | libjxl 0.11.2-5 (includes libjpegli-dev, libjpegli0) | Successful riscv64 build listed as official supported architecture |
| Ubuntu 24.04 Noble | libjxl 0.7.0-10.2ubuntu6 | riscv64 listed under "ports" architectures |
| NixOS stable 26.05 | jpegli package | x86_64-linux, aarch64-linux, x86_64-darwin, aarch64-darwin only; riscv64 absent |
| NixOS unstable | jpegli package | x86_64-linux, aarch64-linux, aarch64-darwin only; riscv64 absent |
| Arch Linux RISC-V (archriscv.felixc.at) | jpegli-git (AUR) | Not ported; no entry in archriscv-packages patch repo |
| PyPI | jpegli | HTTP 404; does not exist on PyPI |

**What a user must do to get a working riscv64 binary:**
- On Debian/Ubuntu: install `libjxl-dev` or `libjpegli-dev` from the distro package manager. This installs the library (headers + shared object) but not a standalone `jpegli` command-line tool.
- For a command-line tool: cross-compile from source using the commands in Section 5.
- No pre-built standalone riscv64 binary exists from any source found in the research.

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 build | riscv64 test (CI) | riscv64 release binaries | Blocking issues |
|---|---|---|---|---|---|
| Highway (google/highway) | All SIMD acceleration (DCT, transforms, convolution) | Builds; RVV backend in `hwy/ops/rvv-inl.h` (6,595 lines). GCC >= 13 or Clang >= 16. | riscv64 added to multiarch CI 2026-06-25 (GCC 16, QEMU, `continue-on-error: true`) | No binary releases (header+source) | Pinned at v1.2.0 in libjxl -- RVV runtime dispatch disabled. Upgrade PR #2269 in libjxl not merged. Open correctness bug #3305 (RearrangeToOddPlusEven). Open perf regression #3281 (10-30% slower ReorderWidenMulAccumulate on BPI-F3). |
| libjpeg-turbo | JPEG decompression input for jpegli's transcode mode | Builds; RVV 1.0 SIMD implemented (PR #837, merged) | No riscv64 CI | No riscv64 release binaries (issue #885 closed without commitment) | No build blockers; distros ship riscv64 packages |
| brotli (google/brotli) | JXL container metadata compression | Builds; `BROTLI_TARGET_RISCV64` macro present (PR #669, 2018); pure scalar | No riscv64 CI | No riscv64 binaries | Two unmerged RVV optimization PRs (#1410, #1489); not a correctness blocker |
| libpng | PNG input/output for tools and tests | Builds; RVV 1.0 support merged (PR #666, May 2025); off by default (`--enable-riscv-vector` required) | No riscv64 CI | No riscv64 binaries | No open riscv64 correctness bugs as of Aug 2026 |
| zlib | Gzip-wrapped JXL streams; libpng deflate back-end | Builds; pure C scalar; OpenBSD/riscv64 CI target merged (PR #1139, Jan 2026) | No Linux riscv64 cross-compilation CI | No riscv64 binaries | Unmerged RVV Adler-32 PR (#1099); not a correctness blocker |
| skcms (bundled from google/skia) | ICC color profile parsing (default for little-endian including riscv64) | Builds; pure portable C, no riscv64 SIMD | No dedicated CI | No standalone releases | None; scalar only |
| lcms2 (bundled) | ICC color profile fallback (big-endian or when skcms disabled) | Builds; pure portable C | No riscv64 CI | Source-only upstream releases | None |
| tcmalloc | High-performance allocator | Not used on riscv64 -- CMakeLists.txt gates it to `x86_64` only | N/A | N/A | None for jpegli |
| gperftools | Alternative allocator | Not used on riscv64 -- same `x86_64`-only cmake gate | N/A | N/A | None for jpegli |
| sjpeg (webmproject, bundled) | Fast JPEG encoder in libjxl's JPEG-from-pixels path | Builds; ARM NEON and SSE2 only; scalar fallback on riscv64 | No riscv64 CI | No standalone releases | None; scalar only |

### Critical dependency deep-dive: Highway

Highway is the sole source of SIMD in jpegli. Its riscv64 status directly determines jpegli's SIMD status.

- jpegli's bundled submodule is pinned to Highway v1.2.0 (SHA `271a9a0`). This version ships an RVV backend in `hwy/ops/rvv-inl.h` but RVV runtime dispatch was disabled in pre-v1.4.0 releases.
- Highway v1.4.0 (April 2026) re-enabled RVV runtime dispatch. The gap between v1.2.0 and v1.4.0 spans approximately 6 months.
- libjxl has an open bot PR (#2269) to upgrade its bundled Highway. Until that merges and jpegli's submodule is updated, building with `-DJPEGLI_ENABLE_HWY_RVV=ON` will compile the RVV target but the Highway dispatcher will not select it at runtime.
- Highway's riscv64 CI was added on 2026-06-25 (GCC 16, QEMU with `qemu-riscv64 -cpu max,v=true,vlen=256`), but tests are marked `continue-on-error: true`, meaning failures do not block merges.
- Open correctness bug in Highway: [#3305](https://github.com/google/highway/issues/3305) - `RearrangeToOddPlusEven` in `rvv-inl.h` produces output dependent on tail state of `sum0` register from previous operations. This is a correctness bug that can produce wrong pixel values for code paths using this function on RVV hardware.
- Open performance regression in Highway: [#3281](https://github.com/google/highway/issues/3281) - `ReorderWidenMulAccumulate` on Banana Pi BPI-F3 (SpacemiT X60 SoC) is 10-30% slower than the generic `WidenMulAccumulate` fallback. Root cause: RVV implementation uses vslideup/vslidedown + vwmaccu; generic uses vzext + vmacc with better codegen.

Further dependency reports: [Highway](project-reports/highway.md), [libjxl](project-reports/libjxl.md), [brotli](project-reports/brotli.md), [libpng](project-reports/libpng.md), [zlib](project-reports/zlib.md), [tcmalloc](project-reports/tcmalloc.md).

---

## 11. Known Bugs and Active Issues

**riscv64 correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [highway#3305](https://github.com/google/highway/issues/3305) | RVV: Bug: RearrangeToOddPlusEven | Open (2026-08-21) | Critical | Output depends on tail state of sum0 register from prior operations. Can produce wrong pixel values on RVV hardware. Not covered by existing tests. Upstream in Highway, not jpegli directly. |

**riscv64 performance bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [highway#3281](https://github.com/google/highway/issues/3281) | RVV: ReorderWidenMulAccumulate slower than generic WidenMulAccumulate | Open (2026-08-14) | High | 10-30% throughput regression measured on BPI-F3/SpacemiT X60. Proposed fix: copy WidenMulAccumulate implementation into the RVV variant. |
| [highway#2542](https://github.com/google/highway/issues/2542) | Should FMA optimizations be implemented for SCALAR/EMU128 on PPC/RISC-V/GPU? | Open (2025-03-21) | Medium | Optimization gap: FMA operations not fully implemented for RISC-V fallback paths. |

**riscv64 build bugs (resolved):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [libjxl#3826](https://github.com/libjxl/libjxl/pull/3826) / jpegli commit 5a25e1e | cmake: Do not use -mrelax-all with clang on RISCV64 | Merged (libjxl: 2025-08-08; jpegli: 2026-03-06) | Was Critical | Clang 19+ crash on riscv64 from double branch relaxation. Fixed. |
| [highway#3251](https://github.com/google/highway/issues/3251) | Issues building highway on riscv64 | Closed (2026-08-21) | Was High | Clang 22 / OpenBSD riscv64 type mismatch in `rvv-inl.h` StoreN macro. Fixed. |

**Other open Highway riscv64 issues (lower severity):**

| ID | Title | Status | Notes |
|---|---|---|---|
| [highway#2854](https://github.com/google/highway/issues/2854) | Problems with mold-linker on riscv64 | Open (2026-01-25) | Linker compatibility issue; workaround is to use lld or ld.bfd. |
| [highway#2345](https://github.com/google/highway/issues/2345) | Adding wrappers for __riscv_vget* and __riscv_vset* for non-tuple types | Open (2024-10-07) | API completeness gap; does not affect jpegli directly. |

**jpegli-specific riscv64 issues:** None. No open or closed issues in `google/jpegli` mention riscv, riscv64, or RISC-V.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. Highway v1.2.0 pin: The bundled Highway in libjxl/jpegli does not support RVV runtime dispatch. The upgrade PR (#2269 in libjxl) is not merged. RVV acceleration is unavailable end-to-end until this merges. This is the single highest-impact blocker.
2. Highway correctness bug #3305: `RearrangeToOddPlusEven` on RVV can produce wrong results. This must be resolved before enabling RVV in any production deployment.
3. `enc_fast_lossless.cc` has no RVV backend: the fast lossless encoding path has no RISC-V SIMD implementation and no open issue or PR for one. This is a code absence, not a toolchain limitation.
4. No riscv64 CI: regressions are not caught upstream. Any fix submitted requires the reviewer to trust cross-compilation without automated validation.

**Organizational blockers:**

1. Google controls all merge authority. Patches require Google CLA and approval from a Google team member (sboukortt, mo271, eustas, or equivalent). The 11-month gap between approval and merge for PR #3826 is unexplained and suggests low-priority queueing of third-party patches.
2. No Google engineer has authored a riscv64-specific improvement for jpegli. All riscv64 work to date came from external contributors (Yocto maintainer, community individual). Upstream investment in riscv64 is passive.

**Acceptance probability:** External contributions that follow the CLA process and address reviewer process corrections (e.g., correct attribution files) are accepted, as demonstrated by PR #3826. However, queue time can be months. Contributions requiring active validation (e.g., CI infrastructure changes) have no demonstrated precedent.

---

## 13. Investment Analysis

RISE has no existing investment in jpegli. All work listed below is unsponsored as of the research date.

### 13.1 Functional Enablement

The primary blocker is the Highway version pin. Upgrading the bundled Highway submodule in libjxl from v1.2.0 to >= v1.4.0 and enabling RVV in the default cmake configuration would unlock vectorized SIMD for all jpegli kernels. This requires upstream cooperation from the libjxl/jpegli team.

### 13.2 Performance Optimization

Three gaps with quantified or estimable impact:
1. Highway #3281 (`ReorderWidenMulAccumulate` 10-30% regression on SpacemiT X60): the proposed fix is straightforward (copy the generic implementation). One person-week to fix, test on hardware, and submit upstream.
2. `enc_fast_lossless.cc` RVV backend: no existing work. This is the fast lossless encoding critical path. The x86 and ARM backends use manual SIMD at higher chunk sizes; an RVV equivalent would require engineering effort comparable to the ARM NEON backend.
3. brotli, libpng, zlib: unmerged RVV PRs in all three; these block full-stack performance but are tracked in separate reports.

### 13.3 CI/CD Infrastructure

Adding riscv64 to jpegli's CI requires:
- Adding a `riscv64` matrix entry to `build_test_cross.yml` using QEMU (`qemu-riscv64 -cpu max,v=true,vlen=256`).
- Installing the riscv64 cross toolchain in the CI runner (pattern already established for armhf).
- Optionally adding a RISC-V native runner (RISE infrastructure) for non-emulated validation.
- Submitting the CI change as a PR to `google/jpegli` and obtaining Google team approval.

Highway has already added this exact CI pattern (2026-06-25); the jpegli CI change would be a near-direct copy.

### 13.4 Ecosystem Enablement

jpegli has no significant dependent package ecosystem (no PyPI packages, no npm packages, no Maven artifacts). Section 10 is omitted per report rules. Ecosystem work is limited to distro packaging, which Debian and Ubuntu already handle for the libjxl-bundled path.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream Highway submodule upgrade in libjxl (libjxl PR #2269 follow-up) | 1 | libjxl/jpegli maintainers (Google) + RISE advocate | Critical |
| Functional | Fix Highway #3305 (RearrangeToOddPlusEven correctness bug on RVV) | 2 | Highway maintainers + RISE contributor | Critical |
| Functional | Enable `JPEGLI_ENABLE_HWY_RVV=ON` as default once Highway >= 1.4.0 is pinned | 1 | RISE contributor | High |
| Performance | Fix Highway #3281 (ReorderWidenMulAccumulate 10-30% regression on SpacemiT X60) | 1 | RISE contributor | High |
| Performance | Implement RVV backend in `enc_fast_lossless.cc` | 8-12 | RISE contributor | Medium |
| CI/CD | Add riscv64 matrix entry to `build_test_cross.yml` (QEMU-based) | 1 | RISE contributor | High |
| CI/CD | Add RISC-V native runner to jpegli CI for non-emulated validation | 2 | RISE infrastructure team | Medium |
| Validation | Publish riscv64 benchmark data (encode/decode MP/s on representative RISC-V SoC) | 2 | RISE contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/jpegli repository](https://github.com/google/jpegli)
- [google/jpegli commit 5a25e1ef -- cmake: Do not use -mrelax-all with clang on RISCV64](https://github.com/google/jpegli/commit/5a25e1ef3e1d53f4103262ab8992f553c2e041fa)
- [libjxl/libjxl PR #3826 -- cmake: Do not use -mrelax-all with clang on RISCV64](https://github.com/libjxl/libjxl/pull/3826)
- [libjxl/libjxl PR #2211 -- Add missing atomic header for GCC on riscv64](https://github.com/libjxl/libjxl/pull/2211)
- [libjxl/libjxl PR #1429 -- JXL_ARCH_RISCV64 macro (abandoned)](https://github.com/libjxl/libjxl/pull/1429)
- [google/highway repository](https://github.com/google/highway)
- [google/highway issue #3305 -- RVV: Bug: RearrangeToOddPlusEven](https://github.com/google/highway/issues/3305)
- [google/highway issue #3281 -- RVV: ReorderWidenMulAccumulate slower than generic WidenMulAccumulate](https://github.com/google/highway/issues/3281)
- [google/highway issue #2854 -- Problems with mold-linker on riscv64](https://github.com/google/highway/issues/2854)
- [google/highway issue #2542 -- FMA optimizations for SCALAR/EMU128 on RISC-V](https://github.com/google/highway/issues/2542)
- [google/highway issue #2345 -- Adding wrappers for __riscv_vget* and __riscv_vset*](https://github.com/google/highway/issues/2345)
- [google/highway issue #3251 -- Issues building highway on riscv64 (closed)](https://github.com/google/highway/issues/3251)
- [Google Open Source Blog -- Introducing jpegli (April 2024)](https://opensource.googleblog.com/2024/04/introducing-jpegli-new-jpeg-coding-library.html)
- [RISE Project member list](https://riseproject.dev/members/)
- [Repology -- jpegli](https://repology.org/project/jpegli/versions)
- [NixOS packages -- jpegli](https://search.nixos.org/packages?query=jpegli)
- [Debian tracker -- libjxl](https://tracker.debian.org/pkg/libjxl)
- [Ubuntu Packages -- libjxl](https://packages.ubuntu.com/search?keywords=libjxl)