---
title: simdutf
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Spike
    relation: test-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: aklomp/base64
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="simdutf" %}

# simdutf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for simdutf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

simdutf is a C++ library for high-throughput Unicode transcoding (UTF-8, UTF-16, UTF-32, Latin-1) and Base64 encode/decode. It selects SIMD backends at runtime based on hardware capability detection and falls back to portable scalar code when no SIMD backend matches hardware capabilities. The library ships a single-header/single-source amalgamation (simdutf.cpp plus simdutf.h) as its primary distribution artifact. The core library has zero mandatory external dependencies; it is self-contained by design (no vendored third-party code under `src/` or `include/`, no `find_package` calls in the core build path). It is dual-licensed Apache License 2.0 and MIT, user's choice, per `LICENSE-APACHE`, `LICENSE-MIT`, and the README.

**Governance.** No foundation affiliation (not part of Apache, Linux Foundation, Eclipse, OpenSSF, etc.), no written governance charter, steering committee, or voting process. `SECURITY.md` names exactly two contacts, Daniel Lemire and Paul Dreik, who function as the de facto maintainers. `CONTRIBUTING.md` and `AI_USAGE_POLICY.md` cover contribution mechanics (benchmark-justified optimizations, pre-approval for new external dependencies, discouragement of low-effort unreviewed AI-generated PRs) but say nothing about decision-making authority. Governance is effectively BDFL-led by Lemire.

**Commit share** (from `git shortlog` over roughly 1,437 commits of fetched history): Daniel Lemire 842 commits (about 59 percent), Paul Dreik 238 (about 17 percent), Wojciech Mula 198 (about 14 percent), then a long tail: Shreesh Adiga 27, Nick Nuon 15, Yagiz Nizipli 9, Nicolas Boyer 8, Olaf Bernstein ("camel-cdr") 4.

**Key contributors and affiliations:**

| Contributor | Role | Affiliation |
|---|---|---|
| Daniel Lemire (lemire) | Lead maintainer | Professor, Universite du Quebec (TELUQ), Montreal (academic) |
| Paul Dreik (pauldreik) | Core maintainer, fuzzing/test infrastructure | Independent C++ consultant, Stockholm, Sweden |
| Wojciech Mula (WojciechMula) | Heaviest line-by-line RVV reviewer, independent bugfixes | Independent (0x80.pl, Poland) |
| Olaf Bernstein (camel-cdr) | RVV backend architect and original author | No affiliation listed |
| rajeshgangam | RVV base64 encode author (PR #996) | No affiliation listed |
| sleepingeight | RVV contributor, PR #890 author | No affiliation listed |
| Yagiz Nizipli (anonrig) | Minor contributor, Node.js-integration build fixes | Node.js TSC member; profile currently lists "Principal Engineer at SpaceXAI" but is not a simdutf maintainer and no company is credited as project sponsor |

**Corporate sponsors.** None found in any governance file or on the project website. The library is consumed by major companies and projects, Node.js, Bun, Apple WebKit/Safari, Google Chromium, Cloudflare workerd, Oracle GraalVM, Couchbase, StarRocks, Ladybird, fluent-bit, ghostty, but none of these appear as governing bodies, financial sponsors, or maintainers in the repo's own documentation; this is downstream adoption, not corporate co-governance.

**Community stance on new ports.** Generally receptive. Issue [#51](https://github.com/simdutf/simdutf/issues/51) "Port SIMD acceleration to POWER" was opened by Lemire himself (2021) and later completed. Issue [#212](https://github.com/simdutf/simdutf/issues/212) "Add support for WebAssembly SIMD128" from an outside contributor got a positive-reaction response and WASM/Emscripten CI now exists. The RVV port itself originated from an external contributor's PR ([#373](https://github.com/simdutf/simdutf/pull/373)) and was merged in under three weeks, then actively maintained by the two core maintainers. No formal platform-tiering policy exists anywhere in the repo (no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, or `docs/platforms/`).

**RISE Project involvement.** None confirmed. A full-text search of all 35 posts in the RISE Project blog (riseproject.dev, 2024-05-15 through 2026-09-28) for "simdutf" returned zero matches; a site search at [riseproject.dev/?s=simdutf](https://riseproject.dev/?s=simdutf) returns "Sorry, no results were found." None of the 26 public repositories in the `riseproject-dev` GitHub org is named or forked as simdutf, and a GitHub repository search for `simdutf org:riseproject-dev` returned 0 results. simdutf is absent from the RISE Python wheel builder's 85-package supported list ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)). A code search in `simdutf/simdutf` for "riseproject" and "riscv-runners.riseproject.dev" returned 0 matches, meaning simdutf's CI shows no use of RISE's RISC-V GitHub Actions runners. No funding, grant, or sponsorship post referencing simdutf was found. The one indirect connection: PR #373's review thread cites RISE's public RISC-V Optimization Guide, a contributor consulting a published resource, not RISE funding or directing the work.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-04-02 | [PR #223](https://github.com/simdutf/simdutf/pull/223) "Add riscv64 define" merged (author luyahan). Earliest riscv64-related change, predating the RVV SIMD backend. First release: v3.2.4. | GitHub |
| 2024-01-10 | [Issue #362](https://github.com/simdutf/simdutf/issues/362) opened by camel-cdr proposing an Icelake-style RVV backend, with benchmarks on real C908/C920 hardware (1.2x-10.5x range over scalar). Closed 2025-03-18 as completed via PR #373. | GitHub |
| 2024-02-29 | [PR #373](https://github.com/simdutf/simdutf/pull/373) opened by camel-cdr: full RVV vectorization of all UTF8/16/32/Latin1 validate and convert routines, requiring standard V extension (VLEN >= 128, SEW >= 64), optional Zvbb acceleration. Excludes GCC 13.2.0 due to a codegen bug. | GitHub |
| 2024-03-18 | PR #373 merged by lemire, resolving #362. First RVV release: v5.0.0. C908 benchmarks: average 3.34x-3.42x speedup over scalar. | GitHub |
| 2024-03-25 | [PR #381](https://github.com/simdutf/simdutf/pull/381) merged: fixed a UTF-8 validation tail-value bug flagged post-merge by OMaghiarIMG. v5.1.0. | GitHub |
| 2024-04-02 to 04-10 | [Issue #393](https://github.com/simdutf/simdutf/issues/393): x86-only CMake flags leaked into the riscv64-linux-gnu cross-build, breaking compilation. Quickly fixed. | GitHub |
| 2024-04-10 | [PR #395](https://github.com/simdutf/simdutf/pull/395) merged: added CMake toolchain for the Spike ISA simulator. v5.2.4. | GitHub |
| 2024-04-16 to 04-22 | [PR #410](https://github.com/simdutf/simdutf/pull/410) merged (WojciechMula): fixed UTF-16-to-UTF-32 conversion failures, wrong error-position reporting (placeholder idx=0), and a potential infinite loop on single-character surrogate pairs (vl=1 case), all found on Kendryte K230 hardware. v5.2.5. | GitHub |
| 2024-04-22 | [PR #413](https://github.com/simdutf/simdutf/pull/413) merged: re-enabled RVV CI (superseding the earlier closed-unmerged attempt [PR #405](https://github.com/simdutf/simdutf/pull/405)). v5.2.5. | GitHub |
| 2024-04-02 to 04-30 | [Issue #385](https://github.com/simdutf/simdutf/issues/385) "RISC-V RVV CI tests broken": the then-named `ubuntu-rvv.yml` workflow failed after the RVV backend landed; fixed as part of early CI stabilization. | GitHub |
| 2024-05-02 to 05-08 | [Issue #419](https://github.com/simdutf/simdutf/issues/419): `#include <unistd.h>` placed inside the `simdutf::internal` namespace broke `isatty`/`read`/`write`/etc. symbols for downstream consumers; discovered building Node.js on riscv64. Fixed via PR #422 by hoisting the include outside the namespace. | GitHub |
| 2024-08-09 | [PR #489](https://github.com/simdutf/simdutf/pull/489) merged (lemire): fixed a correctness bug in the RVV UTF-8-to-Latin1 conversion path. v5.3.4. | GitHub |
| 2024-08-18 | [Issue #531](https://github.com/simdutf/simdutf/issues/531) and [Issue #532](https://github.com/simdutf/simdutf/issues/532), fuzzer-found riscv-specific divergences in `validate_utf32_with_errors` and `convert_utf16le_to_utf32_with_errors`, plus regression tests in [PR #533](https://github.com/simdutf/simdutf/pull/533) (pauldreik): all opened and fixed same day. v5.3.9. | GitHub |
| 2024-11-19 | [PR #591](https://github.com/simdutf/simdutf/pull/591) merged (camel-cdr): updated RVV CI, noting GCC 14's target-region attribute support. v5.6.3. | GitHub |
| 2025-01-03 to 01-10 | [PR #629](https://github.com/simdutf/simdutf/pull/629), [PR #638](https://github.com/simdutf/simdutf/pull/638), [PR #641](https://github.com/simdutf/simdutf/pull/641), [PR #643](https://github.com/simdutf/simdutf/pull/643) merged (pauldreik, with camel-cdr): fuzzing script improvements, QEMU-based riscv64 fuzzing (about 50 CPU-hours, no new bugs found across VLEN 128/256/1024), a regression test and fix for a fuzzer-found bug only manifesting under QEMU's `rvv_vl_half_avl=on` flag (wrong byte count in UTF-8-to-UTF-16LE conversion), and additional CMake toolchain files. v6.0.0-v6.1.0. | GitHub |
| 2025-03-31 | [PR #730](https://github.com/simdutf/simdutf/pull/730) merged (lemire): fixed signed-char right-shift undefined behavior in `rvv_count_valid_utf8` (issue [#728](https://github.com/simdutf/simdutf/issues/728)); latent rather than triggered since RISC-V psABI mandates unsigned char, but a portability hazard. v6.4.1. | GitHub |
| 2025-04-10 to 05-13 | [PR #739](https://github.com/simdutf/simdutf/pull/739), [#745](https://github.com/simdutf/simdutf/pull/745), [#759](https://github.com/simdutf/simdutf/pull/759), [#777](https://github.com/simdutf/simdutf/pull/777), [#779](https://github.com/simdutf/simdutf/pull/779), [#788](https://github.com/simdutf/simdutf/pull/788) merged: RVV simplifications and performance improvements to UTF-32/UTF-8/UTF-16 conversion and validation paths. v6.5.0-v7.1.0. | GitHub |
| 2025-04-23 to 04-30 | [PR #757](https://github.com/simdutf/simdutf/pull/757) merged (tantei3): hybrid base64 decoding optimization across x86/ARM/PPC64/LSX/LASX lookup tables. Its PR body discusses only x86/ARM/PPC64/LoongArch, with no explicit RVV mention; its riscv64 relevance is unconfirmed beyond matching a text search [NEEDS VERIFICATION]. | GitHub |
| 2025-04-11 to 09-10 | [Issue #747](https://github.com/simdutf/simdutf/issues/747) "Implement to well formed for loongarch, RVV and PPC64" (WojciechMula), resolved via [PR #838](https://github.com/simdutf/simdutf/pull/838) "Implement to_well_formed_utf16 for rvv". v7.5.0. | GitHub |
| 2025-05-21 to 06-17 | [Issue #793](https://github.com/simdutf/simdutf/issues/793) "code a fast find character for the RISC-V kernel" (lemire), resolved via [PR #810](https://github.com/simdutf/simdutf/pull/810) "Implement rvv find function". v7.3.1. | GitHub |
| 2025-09-04 | [PR #836](https://github.com/simdutf/simdutf/pull/836) merged: `validate_utf16_as_ascii` for RVV. v7.5.0. | GitHub |
| 2025-10-11 | [PR #842](https://github.com/simdutf/simdutf/pull/842) merged: mask-shift improvement in `utf16fix_block_rvv`. v7.5.0. | GitHub |
| 2026-01-01 | [PR #890](https://github.com/simdutf/simdutf/pull/890) opened (sleepingeight): RVV implementation of `utf16_to_utf8_length_with_replacement`, related to issue [#853](https://github.com/simdutf/simdutf/issues/853). Still open, stalled, no activity since 2026-09-15. | GitHub |
| 2026-01-06 | [PR #897](https://github.com/simdutf/simdutf/pull/897) merged (lemire): new C API for Swift/Go interop; incidentally fixed two remaining riscv CI jobs. v8.0.0. | GitHub |
| 2026-02-05 | [PR #931](https://github.com/simdutf/simdutf/pull/931) merged: `override` annotations for RVV, LASX, and LSX classes. v8.1.0. | GitHub |
| 2025-10-13 to 2026-07-13 | [Issue #843](https://github.com/simdutf/simdutf/issues/843) "implement conversion of binary data to base64 with lines for RISC-V processors" (lemire, labels "good first issue"/"help wanted"), resolved via [PR #996](https://github.com/simdutf/simdutf/pull/996) (rajeshgangam): RVV-vectorized `binary_to_base64` and `binary_to_base64_with_lines` using strided loads/stores and indexed-gather (`vluxei8`) table lookup. v9.1.0. | GitHub |
| 2026-09-28 | [PR #974](https://github.com/simdutf/simdutf/pull/974) merged: ported `GetPointerToFirstInvalidByte` from SimdUnicode. Not yet shipped in any tagged release as of 2026-10-01; latest tag v9.2.1 (2026-09-23) predates the merge. | GitHub |

The RVV port is fully upstream; no patches are carried out-of-tree. The implementation lives in `src/rvv/` (11 files: `implementation.cpp`, `rvv_validate.inl.cpp`, `rvv_utf8_to.inl.cpp`, `rvv_utf16_to.inl.cpp`, `rvv_utf32_to.inl.cpp`, `rvv_length_from.inl.cpp`, `rvv_base64.cpp`, `rvv_utf16fix.cpp`, `rvv_latin1_to.inl.cpp`, `rvv_find.cpp`, `rvv_helpers.inl.cpp`) plus `src/simdutf/rvv.h` and `src/simdutf/rvv/` headers, all gated by the `SIMDUTF_IMPLEMENTATION_RVV` macro. Issue [#380](https://github.com/simdutf/simdutf/issues/380) "RVV port for Base64 procedures" (opened 2024-03-23 by WojciechMula) remains open with no implementing PR, tracking base64 decode specifically.

---

## 3. Upstream Support Tier

No formal tier policy document exists in the repository (no `SUPPORT.md`, no written platform ranking). Support breadth is implicit from CI workflow coverage and the README "Requirements" section, which lists supported compilers/architectures (x64, ARM, RISC-V with vector extensions, LoongArch, POWER) without ranking them.

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI workflows | Yes (multiple, e.g. icelake/haswell/AVX-512) | Yes (multiple, `aarch64.yml`, `armv7.yml`) | Yes, 3 workflows (`rvv-128-clang-17.yml`, `rvv-256-gcc-14.yml`, `rvv-1024-clang-18.yml`) |
| CI trigger | push and pull_request to master | push and pull_request to master | push and pull_request to master, identical in all three files |
| Native hardware runners | Yes (GitHub-hosted) | Partial (some GitHub-hosted arm64) | No, QEMU user-mode emulation only, on `ubuntu-24.04` x86_64 runners |
| SIMD backend merged upstream | Yes (multiple ISA levels, SSE4.2/AVX2/AVX-512) | Yes (NEON) | Yes (RVV 1.0 plus optional Zvbb) |
| Official prebuilt binaries | No, source-only releases | No, source-only releases | No, source-only releases |
| Debian package | Yes | Yes | Yes (`libsimdutf33`/`libsimdutf-dev`/`libsimdutf-tools`, sid and forky) |
| Ubuntu package | Yes | Yes | Yes (`libsimdutf-dev`, `libsimdutf-tools`, `libsimdutf31`, all 8.0.0-1 in Ubuntu 26.04 "resolute") |
| Fuzzing investment | Yes (multiple fuzzers, `cifuzz.yml`, `atomic_fuzz.yml`) | Yes | Yes, QEMU-based, documented in `fuzz/README.md` with specific riscv64 instructions |

The riscv64 tier differs from amd64 and arm64 on one primary axis: no native hardware CI runner exists anywhere (not from GitHub, not from RISE). On every other axis, dedicated CI, a merged SIMD backend, active bug-fixing through 2026, and Debian/Ubuntu packaging, riscv64 is treated as a fully supported architecture. The only shipped riscv64 binaries come from downstream distro packaging (Debian, Ubuntu), not from upstream simdutf releases, which is the determining fact for the release-provider grade (see Section 13). [NEEDS VERIFICATION: whether CI failures on riscv64 actually block PR merges in practice; no branch-protection-rules document was found in this research.]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

simdutf has no JIT, no garbage collector, no cryptographic primitives, and no hand-written assembly (`.S`) files anywhere in the repository. All architecture-specific work is C++ SIMD intrinsics, dispatched at runtime between statically compiled backends via function pointers and `detect_supported_architectures()`, not JIT code generation. A code search for `vfloat32m1_t` returned zero hits: simdutf's RVV kernels are purely integer- and mask-based (`vuint8m*`, `vint8m*`, `vbool*`), as expected for text processing, with no floating-point vector types used anywhere.

**Component coverage by architecture:**

| Component | amd64 (icelake/haswell) | arm64 (NEON) | riscv64 (RVV) |
|---|---|---|---|
| UTF-8 / ASCII / UTF-16 / UTF-32 validation | Intrinsics (AVX-512/AVX2) | Intrinsics | Intrinsics (RVV), with/without error reporting |
| UTF-8 to UTF-16/32/Latin1 | Intrinsics | Intrinsics | Intrinsics (RVV); largest, most complex kernel file (435 lines) |
| UTF-16 to UTF-8/32/Latin1 | Intrinsics | Intrinsics | Intrinsics (RVV), with byte-flip (endianness) support |
| UTF-32 to UTF-8/16/Latin1 | Intrinsics | Intrinsics | Intrinsics (RVV) |
| Latin1 to UTF-8/16/32 | Intrinsics | Intrinsics | Intrinsics (RVV) |
| Length calculations | Intrinsics | Intrinsics | Intrinsics (RVV) |
| to_well_formed_utf16 (surrogate repair) | Intrinsics | Intrinsics | Intrinsics (RVV), merged via PR #838, closing issue #747 |
| Endianness swap (UTF-16 byte-flip) | Intrinsics | Intrinsics | Zvbb `__riscv_vrev8_v_u16m*` when available, else plain-V shift and multiply-accumulate emulation |
| find (character search) | Intrinsics (icelake only) | Intrinsics | Intrinsics (RVV): `vmseq` plus `vfirst`, merged via PR #810, closing issue #793 |
| Base64 encode | Intrinsics (icelake, AVX2) | Intrinsics (NEON) | Intrinsics (RVV), merged via PR #996 (2026-07-13): strided loads/stores, indexed gather (`vluxei8`) for the 64-entry alphabet lookup |
| Base64 decode | Intrinsics (icelake, AVX2) | Intrinsics (NEON) | Scalar only, no RVV implementation exists; tracked by open issue #380 with no implementing PR |
| UTF-16/UTF-8 with_replacement (4 convenience variants) | Intrinsics | Intrinsics | Scalar only, delegate to scalar replacement path; RVV implementation stalled in open PR #890 |
| detect_encodings | Intrinsics | Intrinsics | Uses RVV validation internally but structured scalar-style; a one-pass RVV algorithm is noted as a TODO in source [NEEDS VERIFICATION: single-source claim from prior research pass, not independently re-confirmed in this round] |

**ISA extension usage in the RVV backend:**

| Extension | Role | Detection |
|---|---|---|
| RVV 1.0 (V extension) | Primary SIMD engine for every vectorized UTF and base64-encode operation | Linux `riscv_hwprobe` syscall (number 258) at runtime; compile-time `SIMDUTF_IS_RISCV64` plus `-march=rv64gcv` |
| Zvbb (vector bit-manipulation) | Byte-reversal (`vrev8`) for UTF-16 endianness swapping only | hwprobe bit 17 (`SIMDUTF_RISCV_HWPROBE_EXT_ZVBB = 1 << 17`); compile-time `SIMDUTF_HAS_ZVBB_INTRINSICS`; falls back to plain-V emulation when absent |
| Zba / Zbb / Zbc / Zbs (scalar bit-manipulation) | Not used anywhere in the codebase | n/a |

Minimum compiler: GCC 14 or Clang 17 for RVV 1.0 intrinsic headers; GCC 13.2.0 is explicitly excluded due to a codegen bug (noted in PR #373's description). Zvbb intrinsics require Clang 18 with `-march=rv64gcv_zvbb` in CI (the clang-17 CI job does not enable `_zvbb`).

---

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` exists. All riscv64 build documentation lives in `riscv/README.md`, `README-RVV.md`, the CMake toolchain files, and the CI workflow YAMLs. Current simdutf version in `CMakeLists.txt` at the researched commit (`cf8715f`) is 9.2.1 (SO version 36.0.0).

**Toolchain files:**

- `cmake/toolchains-ci/riscv64-linux-gnu.cmake`, used by all three CI workflows:
  ```
  set(CMAKE_SYSTEM_NAME Linux)
  set(CMAKE_SYSTEM_PROCESSOR riscv64)
  set(CMAKE_CROSSCOMPILING_EMULATOR "qemu-riscv64-static")
  ```
  This is minimal and relies on `CXX`/`CC`/`CFLAGS`/`CXXFLAGS` environment variables set before invoking cmake to pick the actual compiler and `-march`.

- `cmake/toolchains-dev/riscv64.cmake`, developer cross-compile target (used by `make riscv64` in `Makefile.crosscompile`): pins `riscv64-linux-gnu-gcc-14`/`g++-14`, adds `-march=rv64gcv`.

- `cmake/toolchains-dev/rvv-spike.cmake`, for the Spike ISA simulator: pins `riscv64-linux-gnu-gcc-13`/`g++-13` (inconsistent with the GCC 14 used elsewhere, not explained in the repo), requires `spike` and `pk` (RISC-V proxy kernel) on `PATH`, uses static linkage (`pk` expects it), and sets `-DRUN_IN_SPIKE_SIMULATOR`.

**Exact CI build/test commands** (all three workflows trigger identically on `push` and `pull_request` to `master`, no `workflow_dispatch` or `schedule`, runner is `ubuntu-24.04`, a standard x86_64 GitHub-hosted runner, not native riscv64 hardware):

VLEN=128, Clang 17:
```
sudo apt-get install -y cmake make g++-riscv64-linux-gnu qemu-user-static clang-17
CXX=clang++-17 CC=clang-17 \
CFLAGS="--target=riscv64-linux-gnu -march=rv64gcv" \
CXXFLAGS="--target=riscv64-linux-gnu -march=rv64gcv" \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
export QEMU_LD_PREFIX="/usr/riscv64-linux-gnu"
export QEMU_CPU="rv64,v=on,vlen=128,rvv_ta_all_1s=on,rvv_ma_all_1s=on"
ctest --timeout 1800 --output-on-failure --test-dir build -j $(nproc)
```

VLEN=256, GCC 14:
```
sudo apt-get install -y cmake make g++-14-riscv64-linux-gnu qemu-user-static
CXX=riscv64-linux-gnu-g++-14 CC=riscv64-linux-gnu-gcc-14 \
CXXFLAGS=-march=rv64gcv \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
export QEMU_LD_PREFIX="/usr/riscv64-linux-gnu"
export QEMU_CPU="rv64,v=on,zvbb=on,vlen=256,rvv_ta_all_1s=on,rvv_ma_all_1s=on"
ctest --timeout 1800 --output-on-failure --test-dir build -j $(nproc)
```

VLEN=1024, Clang 18, Zvbb:
```
sudo apt-get install -y cmake make g++-riscv64-linux-gnu qemu-user-static clang-18
CXX=clang++-18 CC=clang-18 \
CFLAGS="--target=riscv64-linux-gnu -march=rv64gcv_zvbb" \
CXXFLAGS="--target=riscv64-linux-gnu -march=rv64gcv_zvbb" \
cmake --toolchain=cmake/toolchains-ci/riscv64-linux-gnu.cmake -DCMAKE_BUILD_TYPE=Release -B build -DSIMDUTF_FAST_TESTS=On
cmake --build build/ -j$(nproc)
export QEMU_LD_PREFIX="/usr/riscv64-linux-gnu"
export QEMU_CPU="rv64,v=on,zvbb=on,vlen=1024,rvv_ta_all_1s=on,rvv_ma_all_1s=on"
ctest --timeout 1800 --output-on-failure --test-dir build -j $(nproc)
```

VLEN=512 is not tested in CI (only 128, 256, and 1024 are covered).

**Minimum toolchain versions and rationale.** `src/simdutf/rvv/intrinsics.h` gates codegen on `#if __riscv_v_intrinsic >= 1000000 || __GCC__ >= 14`, requiring either RVV intrinsics spec v1.0+ or GCC >= 14, because older/pre-1.0 intrinsics produce worse codegen on GCC. Separately, `include/simdutf/portability.h` uses a different threshold, `#if __riscv_v_intrinsic >= 11000` to define `SIMDUTF_HAS_RVV_INTRINSICS`, an inconsistency between the two header files that is not explained in the repo and does not appear to be release-blocking. The RVV codepath additionally requires `__riscv_vector`, `__riscv_v_min_vlen >= 128`, and `__riscv_v_elen >= 64` at compile time.

There is no riscv64-specific CMake cache option (nothing like `-DSIMDUTF_RVV=OFF`); the RVV backend is enabled/disabled purely through preprocessor detection (`SIMDUTF_IMPLEMENTATION_RVV`), not a CMake variable. The riscv64 CI jobs only override the general `SIMDUTF_FAST_TESTS` option (default off; shrinks test parameters for QEMU speed).

**QEMU usage.** User-mode emulation (`qemu-user-static`, invoked transparently via `CMAKE_CROSSCOMPILING_EMULATOR=qemu-riscv64-static`) is used for all CI test execution and the Docker dev flow. System-mode emulation (`qemu-system-riscv64`) is documented separately in `fuzz/README.md` for fuzzing on a full emulated riscv64 Debian VM (manual/dev use, not CI), with reported throughput of about 3,300 execs/sec/core on real hardware (Banana Pi BPI-F3) versus about two-thirds of that under 256-bit-SIMD emulation. With QEMU >= 9.2.0 the `rvv_vl_half_avl=on` flag can be appended to `-cpu` to exercise code differently; this exact flag previously exposed a real UTF-8-to-UTF-16LE conversion bug (fixed in PR #641).

**Dockerfile** (`riscv/Dockerfile`): based on `ubuntu:24.04`, installs `g++-riscv64-linux-gnu` (generic/default version, distinct from CI's pinned `g++-14-riscv64-linux-gnu`), `qemu-user-static`, `ninja-build`, `valgrind`, `clang++-18`, `cmake`, plus dev tooling. Run via `riscv/run-docker-station`.

**Known historical build failure:** [Issue #393](https://github.com/simdutf/simdutf/issues/393), x86-specific flags leaking into the riscv64-linux-gnu cross-build; fixed in April 2024. [NEEDS VERIFICATION: whether the fix is still intact in the current CMakeLists.txt was not re-confirmed in this research round.]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (operations with no SIMD on riscv64 as of 2026-10-01):**

1. **Base64 decode.** `base64_to_binary` delegates entirely to `scalar::base64` on riscv64. No vectorized implementation exists anywhere in the project and no PR implements one; tracked by open issue [#380](https://github.com/simdutf/simdutf/issues/380) (opened 2024-03-23) with no assignee. arm64 and both x86 tiers have full SIMD base64 decode. Base64 **encode**, by contrast, is now fully vectorized via PR #996 (merged 2026-07-13).

2. **UTF-16/UTF-8 with-replacement variants.** Four functions (`convert_utf16le_to_utf8_with_replacement`, `convert_utf16be_to_utf8_with_replacement`, `convert_utf8_to_utf16le_with_replacement`, `convert_utf8_to_utf16be_with_replacement`) delegate to scalar replacement paths. An RVV implementation is in progress in open, stalled PR [#890](https://github.com/simdutf/simdutf/pull/890) (opened 2026-01-01, no activity since 2026-09-15). The non-replacement equivalents are fully vectorized.

3. **detect_encodings.** Uses RVV validation internally but a one-pass RVV algorithm remains a TODO in source, per earlier research findings not independently re-confirmed this round [NEEDS VERIFICATION].

**Performance gaps and benchmark data:**

The most authoritative RVV-vs-scalar numbers come from issue #362 and PR #373 (both camel-cdr), on Xuantie C908 (in-order, 1.6 GHz, RVV 1.0, VLEN=128) and C920 (out-of-order dual-issue, 2 GHz, RVV 0.7.1, VLEN=128):

| Function | Scalar (cycles/byte) | RVV (cycles/byte) | Speedup |
|---|---|---|---|
| convert_utf8_to_utf16 | 19.34 | 5.36 | 3.60x |
| convert_utf8_to_utf32 | 19.75 | 5.56 | 3.55x |
| count_utf8 | 2.41 | 0.40 | 5.96x |
| validate_utf8 | 13.46 | 2.80 | 4.80x |
| convert_utf16_to_utf8 | 7.55 | 2.88 | 2.62x |
| validate_utf16 | 3.48 | 0.88 | 3.93x |
| convert_latin1_to_utf8 | 8.74 | 1.39 | 6.28x |
| convert_utf8_to_latin1 | 8.93 | 1.49 | 5.99x |

Average speedup across all operations on C908: about 3.42x. On C920: UTF-8-to-UTF-32 speedups ranged 1.99x-8.16x, UTF-8-to-UTF-16 1.34x-10.52x (Latin-script text highest, Emoji/Korean/Hindi-heavy text lowest in both datasets).

**RISC-V vs ARM64 vs x86, single external source.** Olaf Bernstein's (camel-cdr) blog article ["Vectorizing Unicode conversions on real RISC-V hardware"](https://camel-cdr.github.io/rvv-bench-results/articles/vector-utf.html), using Lemire's `unicode_lipsum` dataset, gives the only published cross-architecture comparison (bytes/cycle, UTF-8-to-UTF-16, higher is better) [NEEDS VERIFICATION, single source]:

| Language | RVV C908 | RVV C920 | RVV X60 | ARM A53 | ARM A55 | ARM A72 | ARM A78 | x86 1600X | x86 i7-9750H | Apple M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| Arabic | 0.239 | 0.309 | 0.338 | 0.231 | 0.250 | 0.328 | 0.623 | 0.688 | 1.047 | 0.779 |
| Chinese | 0.178 | 0.220 | 0.276 | 0.227 | 0.226 | 0.270 | 0.521 | 0.483 | 0.734 | 0.686 |
| Japanese | 0.343 | 0.502 | 0.453 | 0.356 | 0.341 | 0.418 | 0.928 | 0.980 | 1.724 | 1.484 |
| Latin (ASCII) | 1.038 | 2.235 | 1.426 | 1.401 | 1.384 | 1.403 | 5.247 | 6.213 | 10.692 | 9.184 |

The article's stated takeaway: current best RISC-V cores (X60, C920) roughly match or slightly beat older/low-power ARM cores (A53, A55) on non-ASCII text, but trail modern big ARM cores (A78) and x86 by 1.5x-5x, especially on ASCII where x86/Apple SIMD width dominates. This data comes from a single contributor's independent blog, not from an upstream simdutf README or benchmark page; simdutf itself has no dedicated RISC-V-vs-ARM64 benchmark section.

The permutation instructions `vcompress.vm`/`vrgather.vv`, central to the RVV conversion kernels, vary enormously in cost across RISC-V implementations: C906/C908 cost grows from 4 cycles (LMUL=1) to 136-139 cycles (LMUL=8); C920 scales much better (0.5 to 20-32 cycles); unoptimized designs (Tenstorrent "bobcat", SiFive X280 estimates) scale far worse (up to 513-516 cycles). This is flagged by the original backend author as the main source of cross-core performance variability.

PR #890's own QEMU benchmark data illustrates why emulated numbers are unreliable for hardware projection: `utf8_length_from_utf16le_with_replacement+rvv` measured 0.010 GB/s under QEMU versus 0.450 GB/s for the scalar path on the same QEMU run, against 12.472 GB/s on Apple M1 Pro hardware for the equivalent operation. The maintainer's own comment on the PR: "we can't really tell much about your benchmark results [from QEMU]."

**Security hardening gaps.** Data not available: no CFI, stack canary, or ASAN/UBSan riscv64-specific configuration was examined in this research.

**Floating-point/NaN semantics.** Not applicable; simdutf performs no floating-point operations (confirmed by the zero-hit `vfloat32m1_t` code search).

---

## 7. CI/CD Infrastructure

Three dedicated riscv64 workflow files exist in `.github/workflows/`: `rvv-128-clang-17.yml`, `rvv-256-gcc-14.yml`, `rvv-1024-clang-18.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated workflow files | Yes (multiple, e.g. icelake-, haswell-, AVX-512-specific) | Yes (`aarch64.yml`, `armv7.yml`) | Yes, 3 files |
| Trigger | push/PR to master | push/PR to master | push/PR to master, identical in all 3 files; no `workflow_dispatch` or `schedule` |
| Runner | `ubuntu-24.04` (native x86_64) | `ubuntu-24.04` plus arm64-hosted variants | `ubuntu-24.04`, a standard x86_64 GitHub-hosted runner, not riscv64 hardware |
| Execution method | Native | Native | QEMU user-mode emulation (`qemu-user-static`, `qemu-riscv64-static`) |
| SIMD ISA tested | SSE4.2, AVX2, AVX-512 | NEON | RVV 1.0, plus Zvbb at VLEN 256 and 1024 only |
| What the job does | Build and run tests | Build and run tests | Builds (cross-compile) AND runs the full `ctest` suite under QEMU, not build-only |
| Hardware runners | GitHub-hosted | GitHub-hosted/partial native | None, anywhere, for any provider |
| RISE runners | No | No | No, code search in the repo for "riseproject"/"riscv-runners.riseproject.dev" returned 0 matches |
| Fuzzing | Yes (multiple fuzzers) | Yes | Yes, QEMU-based (`fuzz/random_fuzz.sh`, documented riscv64-specific instructions) |

Test timeout per run is 1800 seconds (`ctest --timeout 1800`), raised in PR #591 to address QEMU-induced flakiness. The toolchain file all three jobs reference (`cmake/toolchains-ci/riscv64-linux-gnu.cmake`) is minimal and relies on environment variables set in each workflow step for the actual compiler selection, so the three jobs independently pin clang-17/gcc-14/clang-18 and their respective `-march` flags rather than sharing one hard-coded compiler choice.

RISE announced free native RISC-V hardware CI runners ("RISE RISC-V Runners") in 2026, but no evidence was found that simdutf uses them; this is the specific gap that keeps the readiness grade capped relative to what native hardware CI would demonstrate.

---

## 8. Distribution and Release Status

**GitHub Releases.** simdutf publishes source-only releases for every architecture. Recent tags observed: 9.2.1, 9.2.0, 9.1.2, 9.1.1, 9.1.0, 9.0.0, 8.2.0, 8.1.0, 8.0.0, 7.7.1. Release assets follow the amalgamation pattern (`simdutf.cpp`, `simdutf.h`, `simdutf_c.h`, `singleheader.zip`, source archives); no architecture-specific binary asset exists for any platform, consistent with simdutf's header-friendly distribution model. (The GitHub releases page's client-side asset-filename rendering failed during this research, so individual filenames could not be re-confirmed by direct inspection, but the project's established release pattern makes architecture-specific riscv64 binaries there unlikely.)

**PyPI.** No `simdutf` package exists. `https://pypi.org/pypi/simdutf/json` and `https://pypi.org/simple/simdutf/` both return HTTP 404 (confirmed via WebFetch and direct curl). simdutf is a C++ library with no upstream Python distribution. The RISE wheel builder (`gitlab.com/.../pypi/simple/simdutf/`) redirects to the same 404'ing PyPI path, meaning the RISE builder has no simdutf package registered; this reflects the absence of a PyPI package to begin with, not a riscv64-specific gap.

**Ubuntu.** `libsimdutf-dev`, `libsimdutf-tools`, and the SONAME package `libsimdutf31` are all published for Ubuntu 26.04 ("resolute") at version 8.0.0-1, with architectures amd64, arm64, armhf, ppc64el, **riscv64**, and s390x. (There is no package literally named `simdutf`; the Debian/Ubuntu binary names differ from the project name. `librust-simdutf8-dev` is an unrelated Rust crate.) Ubuntu 24.04 (noble) does not carry simdutf at all per the earlier research pass; only the unrelated `librust-simdutf8-dev` exists there [NEEDS VERIFICATION, not re-checked this round].

**Debian.** simdutf is packaged for sid and forky as `libsimdutf33`, `libsimdutf-dev`, and `libsimdutf-tools`, version 8.2.0-1, with an "Installed" status for riscv64 among all 18 Debian architectures per the earlier research pass [NEEDS VERIFICATION, not re-checked against Launchpad/buildd this round; the live research instead used the Ubuntu Launchpad API as a substitute for the unreachable project-graph tool].

**Arch Linux RISC-V.** Data not available: the archriscv.felixc.at portal returned 404 for all query paths during research.

**What a user must do to get a working riscv64 binary.** On Debian sid/forky or Ubuntu 26.04: `apt install libsimdutf-dev`, works out of the box with no build step. On any other distro: build from source using the GCC 14 or Clang 17/18 cross-toolchain with `-march=rv64gcv` (or `rv64gcv_zvbb` for Zvbb), either via `cmake/toolchains-dev/riscv64.cmake` cross-compiling or natively on riscv64 hardware with the same flags.

---

## 9. Dependencies

simdutf's core library requires zero external dependencies at link time; it is self-contained by design. The dependencies below are build-time toolchain requirements, test-time emulation/simulation tooling, and strictly optional runtime/benchmark dependencies.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| GCC | Build-dependency, critical. CI uses `g++-14-riscv64-linux-gnu` for the VLEN=256 job; dev toolchain (`cmake/toolchains-dev/riscv64.cmake`) and `Makefile.crosscompile`'s `make riscv64` target both pin GCC 14. | Works; GCC 14 is the tested/supported baseline. GCC 13.2.0 is explicitly excluded (codegen bug per PR #373). The Spike dev toolchain still pins GCC 13, an unexplained inconsistency with the rest of the repo. | Used to produce the binaries QEMU then runs in CI. | Ubuntu/Debian ship `g++-14-riscv64-linux-gnu` cross-packages. | GCC 13.2.0 excluded by design; no other open blocker found. |
| LLVM | Build-dependency, critical. CI uses Clang 17 (`clang-17`) and Clang 18 (`clang-18`) for the VLEN=128 and VLEN=1024 jobs respectively. | Clang 17+ required for `-march=rv64gcv`; Clang 18 required for `-march=rv64gcv_zvbb` (Zvbb support). Both install cleanly via apt in CI. | Used to produce binaries for two of the three CI jobs. | Available via apt.llvm.org per lemire's own CI-setup recommendation in the PR #373 review thread. | None found. |
| CMake | Build-dependency, critical. Drives all three CI jobs and all dev/toolchain workflows via `--toolchain=` and `-DCMAKE_TOOLCHAIN_FILE=`. | Works; riscv64 cross-compile support confirmed via all CI and dev toolchain files. No riscv64-specific CMake cache option exists; RVV is enabled purely by preprocessor detection. | n/a (build tool). | CMake itself is available on riscv64 Ubuntu/Debian. | None found. |
| GNU make | Build-dependency, critical. Installed via apt (`make` package) in all three CI jobs; backs `Makefile.crosscompile`'s `make riscv64` convenience target. | Trivially available on riscv64. | n/a (build tool). | Available on riscv64 Ubuntu/Debian. | None found. |
| QEMU | Test-dependency, critical. `qemu-user-static` provides `qemu-riscv64-static`, the sole mechanism by which any riscv64 test executes in CI (`CMAKE_CROSSCOMPILING_EMULATOR`); `qemu-system-riscv64` is used separately for manual/dev full-VM fuzzing. | n/a (test tool). | This is the only execution path for riscv64 tests anywhere in CI; without it, build=yes but test coverage would be zero. `QEMU_CPU` is tuned per job for VLEN 128/256/1024 and Zvbb. A QEMU-specific flag (`rvv_vl_half_avl=on`) previously exposed a real conversion bug (PR #641), demonstrating QEMU catches genuine correctness issues, but also that QEMU behavior can diverge from hardware in ways not otherwise exercised. | Available on riscv64 Ubuntu/Debian for running riscv64 guests elsewhere; not itself a release artifact. | No native hardware CI exists anywhere to cross-check QEMU results; VLEN=512 is untested. |
| Spike | Test-dependency, optional. RISC-V ISA simulator used via the alternate dev toolchain `cmake/toolchains-dev/rvv-spike.cmake`, an alternative to QEMU for local testing; requires `spike` and `pk` (RISC-V proxy kernel) pre-installed and found on `PATH`/`CMAKE_FIND_ROOT_PATH`. | Not used in CI (CI exclusively uses QEMU); available for developer local use only. | Local-only alternative test path; not part of automated CI. | n/a. | GCC 13 pin in this toolchain file is stale relative to the GCC 14 used elsewhere; `hwprobe` is not implemented under Spike's proxy kernel, so RVV support is unconditionally assumed rather than runtime-detected. |
| ICU | Runtime-dependency, optional. Used only as a benchmark reference baseline (`find_package(ICU COMPONENTS uc)` in `benchmarks/src/CMakeLists.txt`), built only when `SIMDUTF_BENCHMARKS=ON` (off by default); never linked into the core library. | `libicu-dev 78.2-2ubuntu1` is published for riscv64 in Ubuntu 26.04 "resolute" per Launchpad (used as a substitute for the unreachable project-graph SPARQL tool). | Built/tested as a regular Ubuntu archive package on riscv64. | Released in Ubuntu 26.04 main/universe, riscv64 included. | A GitHub code search for "riscv"/"riscv64" in `unicode-org/icu` returned 0 results; ICU issue tracking is primarily on Jira, which was not checked, so this is inconclusive rather than a confirmed clean bill of health [NEEDS VERIFICATION]. |
| aklomp/base64 | Runtime-dependency, optional, more precisely benchmark-only: fetched as source via CPM (`CPMAddPackage`) in `benchmarks/base64/CMakeLists.txt`, gated behind `SIMDUTF_BENCHMARKS=ON` and a C++20-capable compiler; not linked into the core simdutf library. | Not independently packaged in Ubuntu or Debian (no `libbase64-0`/`libbase64-1` binary package found); consumed as vendored/fetched source, the same pattern simdutf itself uses for distribution. | riscv64 status depends on an open, unmerged upstream PR (see next column), not on any Ubuntu package. | Not Ubuntu/Debian-packaged; source-only. | Open, unmerged [aklomp/base64 PR #156](https://github.com/aklomp/base64/pull/156) "Add RISC-V target detection", adds RISC-V architecture detection and forces the portable scalar codec path (disabling SSE/AVX/NEON dispatch) on riscv64; until merged, riscv64 builds of this benchmark-only dependency may not correctly disable x86/ARM SIMD codepaths. Does not affect simdutf's own build, test, or release since it is strictly a benchmark comparison target. |
| glibc | Runtime-dependency, optional. Provides `iconv`, used only by the `tools/` CLI (`stream` command, `SIMDUTF_ICONV=ON` by default) and by benchmarks for charset-conversion comparison; not linked into the core library's conversion paths. | `libc6-dev 2.43-2ubuntu2.4` is published for riscv64 in Ubuntu 26.04 "resolute" per Launchpad; iconv ships inside glibc on Linux, no separate package is needed. | riscv64 is a glibc Tier-1/primary port; works as a regular distro package. | Released as part of glibc in Ubuntu 26.04 main. | None found. |
| Python3 (additional, indirect) | Build-time only, used for singleheader amalgamation generation (`singleheader/CMakeLists.txt`) and test-driver scripts (`tests/CMakeLists.txt`). | Trivially available; Ubuntu/Debian ship `python3` on all architectures including riscv64. | n/a (interpreter, not a library under test). | Released on riscv64 main. | None found. |

**Summary.** simdutf's critical build chain (GCC, LLVM, CMake, GNU make) and its sole test-execution path (QEMU) are all solidly available and exercised on riscv64 through upstream CI. Of the optional runtime dependencies, ICU is cleanly available on riscv64 via Ubuntu packaging with no confirmed blocker; glibc's riscv64 port is mature and unblocked. The one weak link is aklomp/base64, a benchmark-only dependency with an unmerged RISC-V-detection PR, which has no effect on simdutf's own correctness, build, or release on riscv64.

---

## 11. Known Bugs and Active Issues

**Open issues and PRs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #890](https://github.com/simdutf/simdutf/pull/890) | Implement UTF16 to UTF8 length with replacement for rvv architecture | Open | Low-Medium | Opened 2026-01-01 by sleepingeight, related to issue #853; stalled, no activity since 2026-09-15. QEMU benchmarks on this PR show scalar outperforming RVV, an emulation artifact per the maintainer's own comment ("we can't really tell much about your benchmark results [from QEMU]"). |
| [Issue #380](https://github.com/simdutf/simdutf/issues/380) | RVV port for Base64 procedures (decode) | Open | Medium | Opened 2024-03-23 by WojciechMula; no assignee, no implementing PR exists anywhere in the project. |
| [Issue #853](https://github.com/simdutf/simdutf/issues/853) | Add RVV versions of UTF16 to UTF8 length with replacement | Open | Low | Labeled "help wanted"; tracked by PR #890. |

**Recently closed (resolved) RVV-specific issues/PRs:**

| ID | Title | Resolution | Notes |
|---|---|---|---|
| [Issue #843](https://github.com/simdutf/simdutf/issues/843) | implement conversion of binary data to base64 with lines for RISC-V processors | Closed via PR #996, merged 2026-07-13 | Base64 encode is now RVV-vectorized. |
| [Issue #747](https://github.com/simdutf/simdutf/issues/747) | Implement to_well_formed for loongarch, RVV and PPC64 | Closed via PR #838, merged 2025-09-10 | |
| [Issue #793](https://github.com/simdutf/simdutf/issues/793) | code a fast find character for the RISC-V kernel | Closed via PR #810, merged 2025-06-17 | |
| [Issue #362](https://github.com/simdutf/simdutf/issues/362) | icelake like backend for RVV (master tracking issue) | Closed 2025-03-18 as completed | Resolved by PR #373. |

**Closed correctness bugs (fixed, kept for context since they were RISC-V-specific implementation divergences):**

| ID | Title | Fixed | Impact |
|---|---|---|---|
| [Issue #728](https://github.com/simdutf/simdutf/issues/728) | RVV: possible wrong code (signed-char shift in `rvv_count_valid_utf8`) | PR #730, v6.4.1 (2025-03-31) | Correctness/portability; latent due to RISC-V psABI mandating unsigned char, but a real hazard on other platforms reusing the code pattern. |
| [Issue #532](https://github.com/simdutf/simdutf/issues/532) | `convert_utf16le_to_utf32_with_errors` wrong error position on RVV | Fixed 2024-08-18 (PR #533 added tests) | Correctness. |
| [Issue #531](https://github.com/simdutf/simdutf/issues/531) | `validate_utf32_with_errors` returns wrong error type on RVV | Fixed 2024-08-18 (PR #533 added tests) | Correctness. |
| [Issue #419](https://github.com/simdutf/simdutf/issues/419) | `#include` inside namespace breaks symbols on riscv64 | Fixed via PR #422 | Build/link; discovered during a Node.js riscv64 build. |
| [PR #410](https://github.com/simdutf/simdutf/pull/410) | Wrong error index and infinite loop in UTF-16-to-UTF-32 | Merged 2024-04-22 | Correctness; found on Kendryte K230 hardware. |
| [Issue #393](https://github.com/simdutf/simdutf/issues/393) | Crosscompilation for RVV failed | Fixed 2024-04-10 | Build; x86-only flags leaked into the riscv64 toolchain. |
| [Issue #385](https://github.com/simdutf/simdutf/issues/385) | RISC-V RVV CI tests broken | Fixed 2024-04-30 | CI stabilization. |

A targeted search for open RISC-V-tagged bugs beyond the above found none: every historical RVV-specific issue is closed as of 2026-10-01, with only the two functional-gap items (base64 decode, with-replacement variants) remaining open.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None. The maintainer has merged every RVV contribution offered (PR #373 through PR #996) and has repeatedly expressed willingness to merge more, including merging PR #996 with the explicit caveat "We currently have no good way to benchmark this, but I will merge nonetheless." No maintainer has stated an objection to riscv64 as a target architecture.

**Technical blockers.**
- Base64 decode: no RVV implementation exists anywhere, and no open PR addresses it (issue #380 has no assignee or linked PR).
- UTF-16/UTF-8 with-replacement variants: implementation exists in open PR #890 but has stalled since 2026-01-01 with no recent activity as of 2026-09-15.
- No native hardware CI: all riscv64 correctness and performance validation relies on QEMU user-mode emulation on x86_64 runners. VLEN=512 is entirely untested (only 128, 256, 1024 are covered). The QEMU-specific fuzzer finding under `rvv_vl_half_avl=on` (PR #641) demonstrates both that QEMU surfaces real bugs and that QEMU-specific semantics can diverge from what real hardware would exercise.

**Organizational blockers.** None. The project has no governance layer that could block a contribution beyond Lemire's personal review queue; there is no committee, foundation gate, or formal RFC process.

**Acceptance probability for new riscv64 contributions.** High, based on track record: more than 30 riscv64/RVV-related PRs merged since 2023, contributions from at least five distinct individuals (camel-cdr, WojciechMula, pauldreik, tantei3, rajeshgangam), and consistent maintainer "merge at will" / "let us merge and release" responses throughout the PR history.

---

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- Optimization level: partial

Upstream CI runs 3 dedicated riscv64 workflows ([rvv-128-clang-17.yml](https://github.com/simdutf/simdutf/blob/master/.github/workflows/rvv-128-clang-17.yml), rvv-256-gcc-14.yml, rvv-1024-clang-18.yml) on every push/PR to master, cross-compiling and then actually running the test suite under QEMU (`ctest --timeout 1800 --output-on-failure`), so build=yes and test=yes. But simdutf ships no architecture-specific binary of its own; GitHub Releases are source-only (simdutf.cpp/simdutf.h/singleheader.zip, identical for every platform). The only compiled riscv64 artifact is produced downstream by Debian/Ubuntu packaging (`libsimdutf-dev`/`libsimdutf-tools`/`libsimdutf33`/`libsimdutf31`, riscv64 included), so release_provider is the distro, not upstream, capping the primary grade at blue.

simdutf's whole value proposition is SIMD-accelerated transcoding speed, which its own README frames exactly that way, so it is optimization-purpose: the RVV backend ([PR #373](https://github.com/simdutf/simdutf/pull/373)) fully vectorizes all UTF-8/16/32/Latin1 validate and convert routines, length calculations, find, and to_well_formed, the operations that define the project's reason to exist, and RVV base64 encode merged recently ([PR #996](https://github.com/simdutf/simdutf/pull/996), merged 2026-07-13, closing issue #843), superseding an older stalled attempt. Secondary paths still fall back to scalar: base64 decode has no RVV implementation, tracked by still-open [issue #380](https://github.com/simdutf/simdutf/issues/380), and the four UTF-16/UTF-8 "with_replacement" convenience variants remain scalar, open and stalled in [PR #890](https://github.com/simdutf/simdutf/pull/890). Because the primary differentiating operations are covered and only secondary paths lack RVV, this is "partial", which caps at blue, matching the CI-derived primary color, so the final grade is blue either way.

**Pending work that could change the grade.** Open PR #890 (RVV `utf16_to_utf8_length_with_replacement`) has stalled since 2026-01-01 with no recent activity as of 2026-09-15; open issue #380 (RVV base64 decode) has no implementing PR; no native riscv64 hardware CI runner exists, all testing is QEMU emulation (VLEN=512 untested, only 128/256/1024 covered); no RISE involvement was found (no RISE blog post, no RISE repo, not in the RISE wheel builder, no RISE CI runner usage detected in the simdutf repo). Landing PR #996-equivalent effort for base64 decode, rebasing and merging PR #890, or adding native hardware CI (RISE-provided or self-hosted) would each move optimization level toward "full" and/or strengthen the CI evidence, but release_provider would still need upstream to ship a riscv64 binary artifact directly (which it currently does not for any architecture) to move the primary grade above blue.

---

## 14. Investment Analysis

RISE has no funded work on simdutf (Section 1). The upstream project is actively maintained and continues to receive RVV contributions from independent contributors as recently as PR #996 (merged 2026-07-13) and PR #890 (opened 2026-01-01). The RVV backend is substantially complete for all primary UTF operations and base64 encode; the remaining functional gaps are base64 decode and the with-replacement convenience variants, plus the structural absence of native hardware CI.

### 14.1 Functional Enablement

1. **Base64 decode SIMD (no open work).** No RVV base64 decode implementation exists anywhere, and issue #380 has no linked PR. Implementing RVV base64 decode is a 2-4 person-week effort for a SIMD engineer familiar with the table-driven 4-to-3 byte decode algorithm with validity checking, informed by the encode implementation pattern already merged in PR #996.

2. **UTF-16/UTF-8 with-replacement SIMD (PR #890 stalled).** PR #890 has maintainer buy-in in principle but no recent contributor activity since 2026-09-15. Rebasing or taking over the PR is roughly a 1 person-week effort for any competent contributor; the QEMU benchmark misleading-ness noted by the maintainer should be flagged and addressed with hardware validation, not QEMU numbers, before merge.

### 14.2 Performance Optimization

The only published RVV-vs-scalar numbers (C908/C920, from issue #362 and PR #373) show 1.2x-10.5x speedups depending on operation and text script; the only RISC-V-vs-ARM64-vs-x86 comparison is a single external contributor's personal blog [NEEDS VERIFICATION], not an upstream-published benchmark. Publishing a native riscv64 benchmark run against current-generation arm64 (A78-class) and x86 hardware, with a results table in the simdutf repository itself, would close this gap. Effort: 1 person-week (requires access to RISC-V hardware with RVV 1.0, e.g. a SpacemiT K1 or Xuantie C910-class board).

Additional identified opportunities: a one-pass RVV `detect_encodings` algorithm (1-2 person-weeks, single-source TODO claim, re-verify before committing effort) [NEEDS VERIFICATION].

### 14.3 CI/CD Infrastructure

No native riscv64 hardware runner exists for simdutf today, from RISE or any other provider. All riscv64 CI runs under QEMU user-mode emulation on x86_64 GitHub-hosted runners, and VLEN=512 is entirely untested. Adding native hardware CI requires either a RISE-provided riscv64 runner (RISE announced "RISE RISC-V Runners" free native CI in 2026, but no evidence of simdutf using them was found) or a self-hosted GitHub Actions runner on an RVV 1.0 SoC. The existing CI YAML structure is straightforward to adapt by removing the cross-compiler and QEMU-specific steps once a native runner is available. Effort: 1 person-week to integrate and validate, plus RISE coordination if using RISE's runner infrastructure.

### 14.4 Ecosystem Enablement

simdutf has no dependent package ecosystem of its own requiring separate riscv64 enablement; it is consumed by projects that vendor it (Node.js, Bun, Chromium) or link it as a system library, and distro packaging (Debian, Ubuntu) already covers riscv64. No work item is required here; see Section 9 for the one weak downstream link (aklomp/base64's unmerged RISC-V-detection PR, a benchmark-only dependency with no effect on simdutf correctness).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement RVV base64 decode (issue #380, no open PR) | 2-4 | RISC-V SIMD engineer | High |
| Functional | Rebase and land PR #890 (UTF-16-to-UTF-8 length with replacement) | 1 | Any contributor | Medium |
| Performance | Publish native riscv64 benchmark results vs arm64/amd64, replacing the single-source external blog comparison | 1 | Access to RISC-V hardware required | Medium |
| Performance | Optimize `detect_encodings` for one-pass RVV | 1-2 | RISC-V SIMD engineer | Low |
| CI/CD | Add native riscv64 hardware runner (RISE-provided or self-hosted) | 1 | Infrastructure plus RISE coordination | Medium |

---

## 15. References

- [simdutf GitHub repository](https://github.com/simdutf/simdutf)
- [Issue #362, RVV backend proposal with C908/C920 benchmarks](https://github.com/simdutf/simdutf/issues/362)
- [PR #223, Add riscv64 define](https://github.com/simdutf/simdutf/pull/223)
- [PR #373, Add RVV backend, resolves #362](https://github.com/simdutf/simdutf/pull/373)
- [PR #381, fix rvv utf8 validation bug](https://github.com/simdutf/simdutf/pull/381)
- [Issue #385, RISC-V RVV CI tests broken](https://github.com/simdutf/simdutf/issues/385)
- [Issue #393, Crosscompilation for RVV failed](https://github.com/simdutf/simdutf/issues/393)
- [PR #395, add RVV cmake toolchain for use with Spike](https://github.com/simdutf/simdutf/pull/395)
- [PR #405, fix: try reenabling RISC-V CI (closed, unmerged)](https://github.com/simdutf/simdutf/pull/405)
- [PR #410, Fix RVV implementation](https://github.com/simdutf/simdutf/pull/410)
- [PR #413, reenabling RVV ci](https://github.com/simdutf/simdutf/pull/413)
- [Issue #419, #include inside namespace breaks symbols on riscv64](https://github.com/simdutf/simdutf/issues/419)
- [PR #489, fix: correct utf8 to latin1 riscv code](https://github.com/simdutf/simdutf/pull/489)
- [Issue #531, implementation difference on validate_utf32_with_errors (riscv)](https://github.com/simdutf/simdutf/issues/531)
- [Issue #532, implementation difference in convert_utf16le_to_utf32_with_errors (riscv)](https://github.com/simdutf/simdutf/issues/532)
- [PR #533, add tests demonstrating problems with riscv](https://github.com/simdutf/simdutf/pull/533)
- [PR #591, update RVV CI](https://github.com/simdutf/simdutf/pull/591)
- [PR #629, fuzzing improvements](https://github.com/simdutf/simdutf/pull/629)
- [PR #638, Improve random fuzzer script](https://github.com/simdutf/simdutf/pull/638)
- [PR #641, Add test for fuzzer finding on riscv using rvv_vl_half_avl=on](https://github.com/simdutf/simdutf/pull/641)
- [PR #643, Add CMake toolchain files for various archs](https://github.com/simdutf/simdutf/pull/643)
- [Issue #728, RVV: possible wrong code](https://github.com/simdutf/simdutf/issues/728)
- [PR #730, RVV kernel code assumes char is unsigned](https://github.com/simdutf/simdutf/pull/730)
- [PR #739, rvv: simplify UTF-32 to UTF-{8,16}](https://github.com/simdutf/simdutf/pull/739)
- [PR #745, rvv: simplify UTF-8 validation](https://github.com/simdutf/simdutf/pull/745)
- [PR #747, Implement to well formed for loongarch, RVV and PPC64](https://github.com/simdutf/simdutf/issues/747)
- [PR #757, Support hybrid base64 decoding](https://github.com/simdutf/simdutf/pull/757)
- [PR #759, RVV: faster valid UTF-32 to UTF-8](https://github.com/simdutf/simdutf/pull/759)
- [PR #777, Simplify validate_utf16be for icelake and rvv](https://github.com/simdutf/simdutf/pull/777)
- [PR #779, rvv: a bit simpler UTF-8 validation](https://github.com/simdutf/simdutf/pull/779)
- [PR #788, rvv: faster UTF-32 to UTF-16](https://github.com/simdutf/simdutf/pull/788)
- [Issue #793, code a fast find character for the RISC-V kernel](https://github.com/simdutf/simdutf/issues/793)
- [PR #810, Implement rvv find function](https://github.com/simdutf/simdutf/pull/810)
- [PR #836, Implement rvv validate_utf16_as_ascii function](https://github.com/simdutf/simdutf/pull/836)
- [PR #838, Implement to_well_formed_utf16 for rvv](https://github.com/simdutf/simdutf/pull/838)
- [PR #842, utf16fix_block_rvv: improve mask shift](https://github.com/simdutf/simdutf/pull/842)
- [Issue #843, implement conversion of binary data to base64 with lines for RISC-V processors](https://github.com/simdutf/simdutf/issues/843)
- [Issue #853, Add RVV versions of UTF16 to UTF8 length with replacement](https://github.com/simdutf/simdutf/issues/853)
- [PR #890, Implement UTF16 to UTF8 length with replacement for rvv architecture](https://github.com/simdutf/simdutf/pull/890)
- [PR #897, Add a C API](https://github.com/simdutf/simdutf/pull/897)
- [PR #931, Add override annotations for RVV, lasx and lsx](https://github.com/simdutf/simdutf/pull/931)
- [PR #974, Port GetPointerToFirstInvalidByte from SimdUnicode](https://github.com/simdutf/simdutf/pull/974)
- [PR #994, fix: silence -Wunused-function warnings (closed, unmerged)](https://github.com/simdutf/simdutf/pull/994)
- [PR #996, Add RVV vectorized base64 encoding](https://github.com/simdutf/simdutf/pull/996)
- [Issue #380, RVV port for Base64 procedures](https://github.com/simdutf/simdutf/issues/380)
- [Issue #51, Port SIMD acceleration to POWER](https://github.com/simdutf/simdutf/issues/51)
- [Issue #212, Add support for WebAssembly SIMD128](https://github.com/simdutf/simdutf/issues/212)
- [camel-cdr blog, Vectorizing Unicode conversions on real RISC-V hardware](https://camel-cdr.github.io/rvv-bench-results/articles/vector-utf.html)
- [camel-cdr/rvv-bench, RVV Unicode benchmark source](https://github.com/camel-cdr/rvv-bench)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project site search for simdutf, zero results](https://riseproject.dev/?s=simdutf)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [aklomp/base64 PR #156, Add RISC-V target detection](https://github.com/aklomp/base64/pull/156)
- [Ubuntu packages search, simdutf](https://packages.ubuntu.com/search?keywords=simdutf&searchon=names&section=all)