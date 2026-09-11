---
title: Apache bRPC
parent: Project Reports
color: orange
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: build-dependency
    criticality: critical
---

# Apache bRPC

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache bRPC<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="apache-brpc" %}

## 1. Project Overview

Apache bRPC is a C++ industrial-grade RPC framework originally built at Baidu ("all sorts of protocols used in Baidu: baidu_std, streaming_rpc, hulu_pbrpc...", per the project README) and later donated to the Apache Software Foundation, where it is now a full Apache Top-Level Project, not an incubating podling (`NOTICE` reads "Copyright 2018-2026 The Apache Software Foundation," and there is no `DISCLAIMER-WIP` file). It is licensed under Apache License 2.0.

Governance follows the standard ASF meritocratic model: issues and PRs on GitHub, decisions discussed on the public `dev@brpc.apache.org` mailing list, and a weekly rotating on-call/triage engineer drawn from a fixed roster (`community/oncall.md`). There is no formal platform-tier policy document: no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, or `SUPPORT.md` file exists in the repository.

Reported production adopters (`community/cases.md`, adopters not necessarily maintainers) include Baidu, vivo, iQIYI, 4Paradigm, Xiaohongshu (RED), Zuoyebang, JOYY, Didi, NetEase (Curve), Sogou, Bilibili, Tencent, and Alibaba, plus embedding in Apache Doris, StarRocks, and BaikalDB. Top contributors by commit volume include Ge Jun (`gejun@baidu.com`, later `gejun@bilibili.com`, original/lead author), Zhu Jiashun / zyearn (`zhujiashun@baidu.com`, Baidu), and Wang Weibing / wwbmmm (`wangweibing@baidu.com`, Baidu).

Community stance toward new architecture ports is welcoming but informal: new-architecture code is merged behind compile-time `#ifdef` guards based on contributor-supplied local hardware testing rather than project-run CI. On the foundational RISC-V PR, reviewer wasphin explicitly asked "Is there any RISC-V CI resource?" and, after being told none existed, replied "Thanks for your contribution, and it's a better to have, maybe in the future, for a more stable maintenance" - i.e. CI was flagged as a desired follow-up that was never delivered. Source: [PR #3125 discussion](https://github.com/apache/brpc/pull/3125).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-10-23 | PR #3125 ("feat: Add full RISC-V 64-bit architecture support") opened by Dayuxiaoshui (co-authored with gong-flying) | [PR #3125](https://github.com/apache/brpc/pull/3125) |
| 2025-12-08 | PR #3125 merged (approved by Baidu maintainer wwbmmm: "Very useful feature, thank you for your contribution!") | [PR #3125](https://github.com/apache/brpc/pull/3125) |
| ~2026-01-18 | PR #3125 first ships in a tagged release, 1.16.0, per direct merge-commit-to-tag ancestry verification | Merge-commit verification against release tags (session research) |
| 2026-05-28 | PR #3312 opened, Zbc carry-less-multiplication CRC32C acceleration, author Felix-Gong (ISCAS) | [PR #3312](https://github.com/apache/brpc/pull/3312) |
| 2026-05-31 | PR #3312 merged, approved by zyearn | [PR #3312](https://github.com/apache/brpc/pull/3312) |
| 2026-06-05 to 2026-07-22 | Six further Felix-Gong RISC-V optimization PRs merged: #3332 (Zvbc CRC32C), #3355 (lock-free AtomicInteger128), #3374 (cpu_relax fix), #3375 (RVV memcpy), #3388 (RVV base64), #3390 (RVV memcmp), #3396 (RVV memchr/find) | [PR list, apache/brpc](https://github.com/apache/brpc/pulls?q=is%3Apr+riscv) |
| 2026-07-16 | PR #3376 merged, char-signedness out-of-bounds-read fix (affects riscv64 and aarch64, unsigned-char platforms) | [PR #3376](https://github.com/apache/brpc/pull/3376) |

**Fully upstream:** Partially. The foundational port (#3125) is merged to `master` and shipped in tagged release 1.16.0. All seven follow-on Felix-Gong optimization PRs are merged to `master` but, per direct merge-commit-to-tag ancestry verification, postdate the latest tag (1.17.0) and have **not yet appeared in any tagged release**; they will first ship whenever the next version is cut.

**Data discrepancy [NEEDS VERIFICATION]:** Two research passes returned conflicting dates for the same release tags. One pass (direct merge-commit-to-tag verification) dates 1.16.0 to 2026-01-18 and the latest tag 1.17.0 to 2026-05-17. A separate WebFetch of the GitHub Releases page in an adversarial-verification pass instead reported "1.17.0, dated 2024-05-28" and a summary elsewhere claimed "v1.16.0 (2024-01-25) introduced Add RISC-V architecture support" - two years earlier than the PR's own opened/merged dates (2025-10-23 / 2025-12-08). This is an unresolved contradiction between sources gathered in the same investigation and is flagged here rather than silently resolved either way. It does not change the CI/distribution findings below.

**Key contributors and organizations:**
- Dayuxiaoshui and gong-flying - foundational port (#3125), organizational affiliation not stated in findings [NEEDS VERIFICATION]
- Xiaofei Gong / Felix-Gong (`gongxiaofei24@iscas.ac.cn`) - all seven follow-on optimization PRs, Institute of Software, Chinese Academy of Sciences (ISCAS)
- wwbmmm, zyearn, chenBright - Baidu-affiliated maintainers who reviewed/approved/merged the RISC-V PRs
- No dedicated RISC-V tracking issue exists; all work was driven through standalone PRs with "Issue Number: N/A" in #3125's template.

## 3. Upstream Support Tier

No formal platform-tier policy exists (no `MAINTAINERS`/`OWNERS`/`PLATFORMS.md`/`SUPPORT.md`). CI is the only concrete signal of tiering, and per direct reading of `.github/workflows/ci-linux.yml` and `.github/workflows/ci-macos.yml`, "CI runs only on `ubuntu-22.04` x86_64 and macOS GitHub-hosted runners - no ARM64, LoongArch, or RISC-V runners exist in official CI." This means amd64 is the only architecture with project-run CI; arm64 support is real (referenced throughout the codebase and by open bug reports) but is, like riscv64, not covered by any CI job.

| Architecture | Upstream CI build | Upstream CI test | Official release binaries | Notes |
|---|---|---|---|---|
| amd64 | Yes (`ubuntu-22.04` runners, `ci-linux.yml`) | Yes | No (GitHub releases are source-only, see Section 8) | Only architecture with project-run CI |
| arm64 | No dedicated CI job found | No | No | Community-tested; open bugs #2957 (memory leaks, valgrind) and #3231 (double free/corruption on echo_test exit) remain unresolved [Data not available: whether arm64 support predates riscv64 or how it was originally verified] |
| riscv64 | No (confirmed by reading all 4 workflow files; zero "riscv" matches via `grep -ri riscv .github/`) | No | No | Functionally verified once, manually, by the PR #3125 author on Sophgo SG2044 hardware and in QEMU; never re-verified by CI |

Comparable prior port: LoongArch64 support was added by a Loongson contributor (`zhaixiaojuan@loongson.cn`) in PR #2364, merged 2023-10-25 - roughly two years before RISC-V, and following the same informal, CI-less, single-contributor-verified pattern. Source: [PR merge/timeline research, session findings].

## 4. Technical Architecture and RISC-V-Specific Subsystems

RISC-V code exists as inline `#if defined(__riscv)` blocks inside existing portable source files, plus one dedicated RVV intrinsics file, one dedicated Zbc/Zvbc CRC32 block, and one build-time-generated base64 file. There is no `arch/riscv/` directory and no standalone `.S` assembly files - hand-written assembly appears as inline `__asm` strings inside `.cpp`/`.h` files. No TODO/FIXME/"not implemented" markers exist anywhere in the RISC-V-touched files.

| Component | File(s) | riscv64 implementation | Quality | amd64/arm64 comparison |
|---|---|---|---|---|
| bthread context switch (`jump_fcontext`/`make_fcontext`) | `src/bthread/context.cpp` | Hand-written RV64 assembly saving s0-s11, ra, fp, fs0-fs5 | Full (hand-tuned asm) | "On par with the x86/arm blocks in the same file" |
| `cpu_relax()` | `src/bthread/processor.h` | Zihintpause `pause` hint, raw encoding `.word 0x0100000f` | Full | Matches Linux kernel spin-wait behavior; originally implemented as heavyweight `fence.i` and corrected in [PR #3374](https://github.com/apache/brpc/pull/3374) |
| 32/64-bit atomics (CAS/exchange/load/store) | `src/butil/atomicops_internals_riscv_gcc.h` (192 lines) | CAS-retry loop on GCC `__sync_bool_compare_and_swap` builtins | Partial - not hand-tuned | Real gap versus x86 (`lock cmpxchg` inline asm) and arm64 (`ldxr`/`stxr` inline asm loop), both hand-written in the same header family. Note: PR #3125's own description claims "lr/sc instructions" but the merged code uses compiler intrinsics, not hand-written `lr.w`/`sc.w` asm - a documentation/implementation mismatch [NEEDS VERIFICATION against the merged diff directly] |
| 128-bit atomic load/store (`AtomicInteger128`) | `src/bthread/task_group.cpp` | Hand-written seqlock using inline `ld`/`sd`/`fence` asm | Full (hand-tuned asm) | Valid alternate strategy versus x86/ARM's native 128-bit SIMD load/store, since RV64 has no native 128-bit atomic. ~25% throughput improvement measured on SG2044 for `adding_func` (541ns vs 722ns mutex-based), per [PR #3355](https://github.com/apache/brpc/pull/3355) |
| CRC32C acceleration | `src/butil/crc32c.cc` (RISC-V portion ~450 lines) | Zbc scalar (`clmul`/`clmulh` inline asm) and Zvbc vector (RVV intrinsics) paths, 128-bit folding + Barrett reduction, runtime `/proc/cpuinfo` dispatch | Full for the accelerated paths (opt-in, off by default) | 3-4x speedup vs. software path per [PR #3312](https://github.com/apache/brpc/pull/3312) benchmark table (64B: 2.2x, 4KB: 3.9x, 1MB: 3.2x) |
| IOBuf `cp()` memcpy | `src/butil/iobuf.cpp` | RVV `vle8`/`vse8` VL-agnostic loop, falls back to `memcpy` under 64 bytes | Full for covered path | [PR #3375](https://github.com/apache/brpc/pull/3375) |
| Base64 encode/decode | `src/butil/third_party/modp_b64/modp_b64_rvv.{h,cc}` (315 lines) | RVV `vrgather`-based encode, vectorized-classify decode | Full for covered path | 1.14-1.35x speedup on SG2044 per [PR #3388](https://github.com/apache/brpc/pull/3388) |
| StringPiece `memcmp`/`find(char)` | `src/butil/string_compare_rvv.cc` (75 lines) | RVV `vmsne`/`vfirst.m` early-out | Full for covered path | Up to 3.6x (memcmp) and 2.9x-5.8x (find/memchr) speedup vs. glibc scalar per [PR #3390](https://github.com/apache/brpc/pull/3390) / [PR #3396](https://github.com/apache/brpc/pull/3396) |
| Cycle counter | `src/butil/time.h` | Inline asm `rdcycle %0` | Full | No riscv64-specific bug reported; analogous x86 TSC-frequency-mismatch bug (issue #2409) closed 2025-06-26 flags this as a risk area to watch |

No Zba/Zbb (bit-manipulation) usage was found despite being searched for. ISA extensions actually used: base RV64GC (atomics, context switch, cpu_relax, cycle counter), RVV (string compare/search, base64, iobuf memcpy), Zbc (scalar CRC32C), Zvbc (vector CRC32C), Zihintpause (spin-wait hint, via raw encoding rather than the `pause` mnemonic, for assembler-compatibility reasons).

## 5. Build System, Cross-Compilation, and Toolchain

There is no dedicated riscv64 documentation page (no `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, riscv64-specific `Dockerfile`, riscv64 CI job, or QEMU usage anywhere in the tree - `grep -ri qemu` across the whole repo returns zero hits). riscv64 support is implemented directly in three build systems: CMake (primary/recommended), GNU Make, and the `config_brpc.sh` configure script. Bazel (`BUILD.bazel`/`WORKSPACE`/`MODULE.bazel`/`.bazelrc`) has zero riscv64-specific logic.

**CMake** (`CMakeLists.txt:211-222`, GCC-only branch):
```
cmake -B build -DCMAKE_BUILD_TYPE=Release                          # default: -march=rv64gc
cmake -B build -DCMAKE_BUILD_TYPE=Release -DWITH_RISCV_ZBC=ON      # -march=rv64gc_zbc
cmake -B build -DCMAKE_BUILD_TYPE=Release -DWITH_RISCV_ZVBC=ON     # -march=rv64gcv_zbc_zvbc
```
`WITH_RISCV_ZBC` and `WITH_RISCV_ZVBC` default OFF and are mutually exclusive in effect (Zvbc wins if both are set).

**GNU Make + config_brpc.sh:** the plain `Makefile` only adds bare `-march=rv64gc` (`Makefile:47-50`); the Zbc/Zvbc flags are reachable only via `config_brpc.sh --with-riscv-zbc` / `--with-riscv-zvbc`, which generate a `config.mk` consumed by `Makefile`.

**Toolchain minimums (documented, not riscv-specific):** GCC >= 5.0 or Clang >= 3.5, enforced by `CMakeLists.txt:51-59` because `BRPC_CXX_STANDARD` is set to 14. These generic minimums apply on every architecture; the riscv `-march=` branch is nested inside the GCC-only compiler-ID check, so Clang builds do not get the riscv64 `-march` flag appended at all in CMake.

**Undocumented gap [NEEDS VERIFICATION]:** the repo states no explicit minimum GCC/Clang version for the Zvbc vector-crypto intrinsics used in `src/butil/crc32c.cc` (`__riscv_vclmul_vv_u64m1`, etc., from `<riscv_vector.h>`). These RVV vector-crypto builtins are understood to have stabilized around mainline GCC 14 / Clang 17-18 (RVV 1.0 + Zvbc intrinsic support), meaning `-DWITH_RISCV_ZVBC=ON` on an older riscv64 toolchain would likely fail to compile - but this specific version requirement is inferred from the intrinsics used, not stated anywhere in the bRPC repository.

**Hidden interaction:** the RVV string/base64/iobuf fast paths (Section 4) are guarded only by `#if defined(__riscv) && defined(__riscv_vector)`, not by `WITH_RISCV_ZBC`/`WITH_RISCV_ZVBC` directly. Since the default `-march=rv64gc` has no `v` extension, these paths compile out unless `WITH_RISCV_ZVBC` is turned on - at which point they activate incidentally, even though the option's name and CMake description mention only CRC32C.

**QEMU:** none found anywhere in the repository (`grep -rn -i qemu .` returns nothing). No emulation-based CI, no `binfmt`, no `qemu-user-static` setup exists for riscv64 testing.

**Known build failures on riscv64:** Data not available - no riscv64-specific build-failure issue was found in the research (the only build-failure issue found, #2721, is an x86_64 protobuf-version error and unrelated).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI-tested build | Yes | No dedicated CI | No dedicated CI |
| Atomics implementation | Hand-written asm (`lock cmpxchg`) | Hand-written asm (`ldxr`/`stxr`) | Compiler intrinsics (CAS-retry loop), not hand-tuned |
| 128-bit atomic | Native SIMD load/store | Native SIMD (NEON) load/store | Seqlock-based software emulation (no native instruction) |
| Hardware CRC32C | Yes (SSE4.2) | Yes (implied, not detailed in findings) | Yes, opt-in (Zbc/Zvbc), off by default |
| Vectorized string ops | Yes | Yes (implied) | Yes (RVV), opt-in via `WITH_RISCV_ZVBC` |
| Official CI-verified test pass | Yes | Data not available | No - only manual, single-run verification on Sophgo SG2044 + QEMU |

**Functional gaps:** None of the riscv64 code paths are described as stubs; every component in Section 4 is functionally complete for what it implements. The one clear implementation gap is that the atomics backend uses compiler intrinsics rather than the hand-written `lr`/`sc` assembly that PR #3125's own description claims, unlike the hand-tuned x86/arm64 backends in the same header family.

**Performance gaps:** No quantified riscv64-vs-amd64 or riscv64-vs-arm64 comparative benchmark exists anywhere in the findings. bRPC's official benchmark page ([brpc.apache.org/docs/benchmark](https://brpc.apache.org/docs/benchmark/)) contains only x86 figures (Intel E5-2620/2420/2420v3: single-connection >800MB/s, multi-connection peak ~2.3GB/s). PR-level speedup figures exist only as riscv64-internal before/after comparisons (accelerated vs. software fallback on the same SG2044 board), not cross-architecture comparisons.

**Security hardening gaps:** A real memory-safety bug - unbounded array read via untrusted network input in two 256-entry lookup tables biased for signed `char` - was latent in the codebase and surfaced specifically because riscv64 (like aarch64) defaults to unsigned `char`. It was fixed in [PR #3376](https://github.com/apache/brpc/pull/3376), confirmed via ASan builds with `-funsigned-char` before/after. This is resolved, not an open gap, but illustrates that riscv64's ABI characteristics (unsigned char) surface latent bugs invisible on x86_64.

**NaN / floating-point semantics:** No RISC-V-specific NaN or floating-point issue was found. A targeted search (`riscv nan floating`) on apache/brpc returned zero results.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in apache/brpc**, confirmed independently by two separate direct reads of the repository's complete CI configuration (commit `d638a0c`, 2026-09-09). The repository has exactly 4 workflow files:

- `.github/workflows/ci-linux.yml` (10 jobs: make, cmake, bazel, unittest, asan variants) - all `runs-on: ubuntu-22.04`
- `.github/workflows/ci-macos.yml` (3 jobs) - all `runs-on: macos-latest`
- `.github/workflows/cifuzz.yml` (OSS-Fuzz, weekly cron) - `runs-on: ubuntu-latest`
- `.github/workflows/license-eyes.yml` - `runs-on: ubuntu-latest`

`grep -rniE "riscv|risc-v" .github/` returns zero matches. No `arm` runner, no `riscv64` runner, no `self-hosted` labels, no QEMU setup step, no cross-compilation toolchain install, and no `workflow_dispatch`-gated riscv job exist anywhere. The single Dockerfile in the repository builds a generic Ubuntu 20.04/amd64 image with no riscv content. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

| Architecture | CI build | CI test | CI release-blocking | Runner type |
|---|---|---|---|---|
| amd64 (Linux) | Yes | Yes | Yes (PRs trigger `ci-linux.yml`) | `ubuntu-22.04` GitHub-hosted |
| macOS (arch unspecified in findings) | Yes | Yes | Yes | `macos-latest` GitHub-hosted |
| arm64 (Linux) | No | No | No | None |
| riscv64 | No | No | No | None; only manual, one-time author verification on physical Sophgo SG2044 hardware and in QEMU, outside CI |

No RISE RISC-V runner usage was found - `riseproject-dev` or RISE runner labels do not appear anywhere in the workflow files. Maintainer wasphin explicitly requested RISC-V CI resources during review of [PR #3312](https://github.com/apache/brpc/pull/3312); that request remains unresolved as of the latest PRs surveyed (through #3396, merged 2026-07-22).

## 8. Distribution and Release Status

**No riscv64 binary or package exists through any channel checked.** Findings, refuted-claim-checked:

- **GitHub Releases:** the latest tag is 1.17.0. Every release, including 1.17.0, carries only "Source code (zip)" and "Source code (tar.gz)" - GitHub's auto-generated source archives - across all 10 most recent releases (1.10.0 through 1.17.0). No asset filename contains "riscv" or "riscv64" in any release. **bRPC ships no prebuilt binaries for any architecture**, not just riscv64.
- **PyPI:** `https://pypi.org/pypi/apache-brpc/json` and `https://pypi.org/simple/apache-brpc/` both return HTTP 404 - no such PyPI project exists at all (bRPC is a C++ library with no Python wheel distribution).
- **RISE wheel builder:** the RISE GitLab PyPI proxy redirects straight through to the (404-ing) PyPI page - no RISE-built wheels exist, consistent with there being no PyPI project.
- **Ubuntu (26.04 "resolute" and all suites checked):** no package named `brpc`, `apache-brpc`, `libapache-brpc`, or similar exists in Ubuntu at all, in any suite, for any architecture. The only "brpc"-adjacent match found was the unrelated Perl package `librpc-xml-perl`.
- **Debian:** no `brpc`/`apache-brpc` package in any suite; same false-positive match as Ubuntu.
- **Arch Linux RISC-V port** (archriscv.felixc.at): no `brpc`/`apache-brpc` package listed.

**What a user must do to get a working riscv64 binary today:** build from source (CMake or `config_brpc.sh`/Make, per Section 5), on a compatible riscv64 toolchain, using the `WITH_RISCV_ZBC`/`WITH_RISCV_ZVBC` flags if hardware CRC32C/RVV acceleration is wanted. There is no packaged shortcut on any distribution or language-package registry checked.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| CMake | Build system (primary/recommended path) | Critical (build-dependency) | Data not available: no dedicated riscv64 CI/release research was performed on CMake itself in this investigation [NEEDS VERIFICATION] | Data not available | Data not available | bRPC's own `CMakeLists.txt` contains the `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv64"` branch (Section 5); no evidence found on CMake's own riscv64 support posture |
| GCC | Compiler toolchain | Critical (build-dependency) | Data not available: no dedicated riscv64 CI/release research was performed on GCC itself in this investigation [NEEDS VERIFICATION] | Data not available | Data not available | bRPC requires GCC >= 5.0 (or Clang >= 3.5) generically; Zvbc intrinsics likely require GCC >= 14 based on when RVV 1.0/Zvbc intrinsics stabilized, but this specific requirement is inferred, not documented by bRPC or verified against GCC's own release notes in this research |
| Protocol Buffers | RPC IDL / serialization core | Critical (build-dependency, `find_package(Protobuf REQUIRED)`) | Unofficial - closed PR #12244 (2023, abandoned), new protoc-build PRs #23205/#23206 (Aug 2025) still pending | No official CI | No official riscv64 `protoc` binaries (Maven Central gap tracked in issue #17798); Python wheel path unblocked since `manylinux_riscv64` images merged Jul 2025 | Maintainer stance explicitly negative: "riscv64 is not a platform supported by the protobuf project... not staffed to add support" (issue #17798, Aug 2024). Graded **yellow** in the dependency-level research |
| Abseil | Required transitively (once `Protobuf_VERSION > 4.21`, effectively always today); hashing/containers/sync used throughout the `absl_*` targets bRPC links | Required in practice | Builds, but open issue #1702 "Can't link using riscv64 toolchain" (undefined `__atomic_*` refs) | Open issue #2002 (Feb 2026): test segfaults on Debian riscv64 (not Ubuntu riscv64) | No separate binary releases (source lib) | Governance bottleneck: community PRs merge only if a Google engineer champions/exports internally; HW-accel CRC32C PR #1986 blocked on Google finding riscv64 hardware. Graded **orange** |
| OpenSSL | Default TLS/crypto backend (`find_package(OpenSSL REQUIRED)` unless `WITH_BORINGSSL`) | Required (default) | Strong - dedicated `linux64-riscv64` asm target, AES, GCM/GHASH via Zbc/Zbb, open PR #31715 adds Zbb SHA1 | Dedicated CI workflow `riscv-more-cross-compiles.yml`, 13 extension-specific configs | Ships in mainline OpenSSL 3.x releases | Open correctness gaps on non-Zkn hardware (AES/GHASH fallbacks not constant-time, #31080/#31082/#20980) are security-hardening issues, not availability blockers. Graded **blue** |
| BoringSSL | Optional alternate crypto backend (`WITH_BORINGSSL`, off by default) | Optional | Good - riscv64 port since 2021 (StarFive contributor, 2022 primary port commit) | CI runs only under QEMU user-mode emulation ("no native RISC-V hardware available") | No traditional numbered releases (rolling) | Graded **yellow** |
| zlib | Wire compression (`find_package(ZLIB REQUIRED)`) | Required | Works out of the box (pure portable C, zero riscv64-specific source) | OpenBSD/riscv64 CI leg only recently added (PR #1139, merged 2026-01-28); no Linux riscv64 CI | v1.3.2 (Feb 2026) ships, no riscv64 source changes | RVV-accelerated Adler32 PR #1099 (7% gain, Oct 2025) still unmerged. Graded **blue** (correct, unoptimized) |
| snappy | Optional compression codec (`WITH_SNAPPY`, off by default); bRPC also vendors its own internal copy always compiled in | Optional (external dep); vendored copy always present | Good and active - 5 merged RISC-V PRs since Jul 2025 (ZTE/Sanechips, Alibaba contributors) | Dedicated `riscv64-qemu-test.yaml` CI, runs on every push/PR | Ships in normal source releases | PR #220 sat unreviewed 5 months; project "mostly in maintenance mode" per maintainer. Graded **blue** |
| leveldb | Embedded KV store backing RPC span/tracing (`src/brpc/span.cpp`) | Required (`FATAL_ERROR` if missing) | Compiles unmodified - zero arch-specific code in the 169-file repo | Debian riscv64 packaging SIGILL traced to a missing `-latomic` link, fixed at the distro level (2022, issue #1058) | No upstream binary release model (source-only); Ubuntu 24.04/Debian sid/Arch all ship riscv64 packages of 1.23 unmodified | README states changes are "generally only accepted for platforms compiled and tested [by Google internally]" - a policy barrier, not a technical one |
| gperftools / tcmalloc | Memory allocator; Bazel `dev_dependency` (test-only) - bRPC's CMake build sets `NO_TCMALLOC` and does not link it in production | Non-critical (test-only; not in bRPC's default production build) | Unsupported - riscv64 port PR #1222 closed without merge; issue #1359 "Broken on riscv64" reports stack-trace capture failure on FreeBSD/riscv64 | None | No riscv64 release artifacts | Abandoned porting effort; not a practical concern for bRPC since it is not linked by default |
| libunwind | Only pulled for the optional `WITH_BTHREAD_TRACER` feature, which `CMakeLists.txt` gates to Linux x86_64 only (`FATAL_ERROR` otherwise) - never required on riscv64 builds of bRPC | Not applicable on riscv64 | (Upstream) good - native riscv64 port merged 2021 (Meta), shipped since v1.6.0 | Some flakiness: cxx-exceptions test XFAILed for riscv64 in 2023 (PR #532), XFAIL silently removed 2024; CMake support for RISC-V still open (issue #765 since Jun 2024) | Ships in official releases since v1.6.0 (Nov 2021) | Chronically under-resourced project ("in need of new/additional maintainer"). Graded **blue** upstream, but irrelevant to riscv64 bRPC builds since the feature is x86_64-gated |
| google/crc32c | Not directly used by bRPC production code - appears only in `bazel/third_party/leveldb/leveldb.BUILD` glue for leveldb's optional Bazel dependency; bRPC ships its own native riscv64-accelerated CRC32C instead (Section 4) | Transitive/optional, Bazel-path only | No riscv64 acceleration exists upstream - falls through to `ExtendPortable()`; open PR #75 adds baseline riscv64 target detection only, no HW accel | None riscv64-specific | Ships in normal releases (portable path works, unaccelerated) | PR #75 reportedly blocked on a missing Google CLA signature |
| gflags | Command-line flag parsing | Required (`find_package(GFLAGS REQUIRED)`) | Data not available: excluded from the deep-dive dependency research as architecture-agnostic pure C++ with no SIMD/JIT/crypto/numerics surface | Data not available | Data not available | Not expected to carry riscv64-specific risk given its scope, but not independently verified in this research [NEEDS VERIFICATION] |
| glog | Logging | Optional (`WITH_GLOG`, off by default) | Data not available: same exclusion rationale as gflags | Data not available | Data not available | [NEEDS VERIFICATION] |

**Summary judgment (from the dependency-level research):** bRPC's own riscv64 posture is comparatively mature - it has already done first-party riscv64 enablement (context-switch asm, RVV string ops, Zbc/Zvbc CRC32C flags) - but this is capped by two hard dependencies: **Protocol Buffers**, where upstream has explicitly declined riscv64 support (graded yellow, and the most consequential dependency since it is unconditional), and **Abseil**, which inherits Google's internal-export governance bottleneck and has an open riscv64 test-flake issue (graded orange). Since bRPC's own riscv64 posture (Step 1 of the color model) is already capped at orange by the absence of any upstream CI, these dependency grades (yellow, orange) do not further downgrade bRPC's own color, but they do constrain how far bRPC could realistically improve without those projects also improving.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3125](https://github.com/apache/brpc/pull/3125) discussion | Missing RISC-V CI resource | Open (unresolved as of latest PRs surveyed) | Process gap, not a code bug | Raised by reviewer wasphin; never actioned |
| [PR #3312](https://github.com/apache/brpc/pull/3312) commit `ceb9a77` | CRC32C final-XOR (`^ 0xFFFFFFFF`) omission in `rv_crc32c_clmul` | Fixed pre-merge | Correctness (would have produced silently wrong checksums) | Caught during PR review, not a live issue |
| [PR #3355](https://github.com/apache/brpc/pull/3355) | Inline-asm load/store operand-direction bug in `AtomicInteger128` for RISC-V | Fixed pre-merge | Correctness | Caught by Copilot AI review and the author before merge |
| [#3376](https://github.com/apache/brpc/pull/3376) | Char-signedness out-of-bounds read in URL/header lookup tables (affects riscv64 and aarch64, unsigned `char` platforms) | Fixed, merged 2026-07-16 | Security (unbounded read from untrusted network input) | Latent since before the RISC-V port; surfaced by riscv64/aarch64's unsigned-char ABI |
| [#2957](https://github.com/apache/brpc/issues/2957) | arm64 memory leaks detected via valgrind (bthread_id_create, IOBuf tls block, TaskGroup init) in brpc 1.10.0 | Open | Not riscv64-specific, but foreshadows non-x86 threading risk | |
| [#3231](https://github.com/apache/brpc/issues/3231) | aarch64/CentOS AltArch double free/corruption on echo_test exit, brpc 1.5.0 | Open | Not riscv64-specific | |
| [#3252](https://github.com/apache/brpc/issues/3252) | Occasional crash in `butil::IOBuf::clear()` under RDMA (architecture unspecified) | Open | Not confirmed riscv64-specific | |
| [#2409](https://github.com/apache/brpc/issues/2409) | `cpuwide_time_ns()` TSC/frequency mismatch (x86) | Closed 2025-06-26 | Not riscv64, but analogous risk area since bRPC's riscv64 port also implements a cycle-counter path via `rdcycle` | |
| [#3106](https://github.com/apache/brpc/issues/3106) | "Support mips64" | Open, filed 2025-09-24 | Unrelated (MIPS64/Loongson feature request, not RISC-V) | |

**Zero open GitHub issues on apache/brpc specifically reference RISC-V**, confirmed via three separate queries (`riscv64 performance`, `riscv nan floating`, `riscv is:open in:title,body`), all returning 0 results. No NaN/floating-point issue on RISC-V was found. No open correctness or performance bug is filed against the RISC-V port specifically.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. Reviewer/maintainer comments across the RISC-V PRs show a welcoming, low-friction stance - contributions were merged quickly once compile-guarded and locally verified by the contributor, with no requirement for project-hosted CI on the new architecture.

**Technical blockers:**
- No riscv64 CI exists, and the explicit request for it (wasphin, reviewing #3312) has gone unaddressed through at least eight subsequent merged RISC-V PRs.
- Protocol Buffers, a hard unconditional dependency, has upstream maintainers on record stating riscv64 "is not a platform supported by the protobuf project... not staffed to add support" (issue #17798) - this is an external blocker bRPC cannot resolve unilaterally.
- Abseil's governance model requires a Google engineer to internally champion/export community PRs, which has stalled at least one riscv64-relevant hardware-acceleration PR pending Google obtaining riscv64 hardware.

**Organizational blockers:**
- The follow-on optimization work (7 of 8 post-foundational PRs) is sustained by a single outside contributor, Felix-Gong, from a single institution, ISCAS. There is no indication of a second independent contributor or of bRPC-project-funded riscv64 infrastructure.
- Apache bRPC itself has no direct institutional tie to the RISE Project (not a RISE member, no RISE blog coverage found after checking the full blog sitemap). ISCAS, Felix-Gong's employer, is a RISE General Member, but no evidence was found that Felix-Gong's bRPC work is RISE-funded specifically, as opposed to independently ISCAS-funded.

**Acceptance probability for further RISC-V contributions:** High, based on the demonstrated pattern - all 8 RISC-V-related PRs surveyed were merged, generally within days to a few weeks of opening, with maintainers (wwbmmm, chenBright, zyearn) approving quickly. The bottleneck is not upstream willingness but the absence of project-run CI and the single-contributor sustainment model.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI at all - confirmed by direct reads of all 4 workflow files, zero "riscv" matches - and no distribution channel of any kind ships a bRPC package for riscv64 or, in fact, for any architecture, so no distribution floor applies to raise the grade)
- **Release provider:** none (upstream publishes no prebuilt binaries for any architecture - GitHub Releases contain only auto-generated source archives; no PyPI, RISE wheel, Ubuntu, Debian, or Arch RISC-V package exists)
- **Optimization level:** not applicable - bRPC is a general-purpose RPC framework, not a project whose primary stated purpose is to make a specific algorithm faster than a reference implementation (the Step 2 test from the color model: if it ran on RISC-V with only generic scalar C and no architecture-specific optimizations, it would still deliver its core value as an RPC framework). The Step 2 optimization-purpose modifier therefore does not apply and does not cap the grade, despite bRPC containing genuine RISC-V-specific hardware acceleration (Zbc/Zvbc CRC32C, RVV memcpy/memcmp/base64/find) that would itself qualify as "full" coverage of the hot paths it targets, per Section 4.
- **Justification:** apache/brpc has confirmed zero riscv64 CI - all jobs in its four GitHub Actions workflows run exclusively on `ubuntu-22.04` (x86_64) or `macos-latest` runners, with no riscv64 matrix dimension, QEMU step, or self-hosted riscv64 runner anywhere ([`.github/workflows/ci-linux.yml`](https://github.com/apache/brpc/blob/master/.github/workflows/ci-linux.yml)). Source-level riscv64 support is real and substantial (foundational [PR #3125](https://github.com/apache/brpc/pull/3125), merged 2025-12-08 and shipped in release 1.16.0, plus seven follow-on hardware-acceleration PRs merged through 2026-07-22), but was verified only once, manually, by the PR author on physical Sophgo SG2044 hardware and in QEMU - never by CI, and never re-verified since. No release channel (GitHub Releases, PyPI, Ubuntu, Debian, Arch RISC-V) ships any bRPC binary at all, for any architecture.
- **Pending work that could change the grade:** the unresolved ask for dedicated riscv64 CI resources (raised in review of [PR #3312](https://github.com/apache/brpc/pull/3312), never actioned) is the single highest-leverage change - adding even a build-only riscv64 CI job would move the grade to yellow, and adding test execution to blue. The seven merged-but-unreleased optimization PRs (#3312 through #3396) will surface in the project's next tagged release, which would strengthen the RISC-V-specific optimization story further once shipped, though it would not by itself change the color absent CI. No RISE Project involvement in bRPC specifically was found, despite ISCAS (the optimization contributor's employer) being a RISE General Member - this represents a plausible but currently unrealized channel for CI or hardware support.

## 14. Investment Analysis

RISE has not funded or provided any identifiable infrastructure specifically for Apache bRPC (Section 12): no RISE blog post, no RISE membership, no RISE runner usage in CI (there is no CI to use them in). All sizing below is therefore full incremental work, not a discount against RISE-covered ground.

### 14.1 Functional Enablement

The foundational port is done and merged (PR #3125). The primary functional gap is that the atomics backend (`atomicops_internals_riscv_gcc.h`) uses compiler intrinsics rather than the hand-written `lr`/`sc` assembly the original PR description claims, unlike the hand-tuned x86/arm64 equivalents in the same header family (Section 4) - closing this gap would bring riscv64 atomics to parity with the other two architectures' implementation style, though it is not a known correctness problem today.

### 14.2 Performance Optimization

Substantial RISC-V-specific optimization work already exists and is merged to `master` (Zbc/Zvbc CRC32C, RVV memcpy/memcmp/memchr/base64, lock-free 128-bit atomics) - Section 14.2 investment should focus on (a) getting this work into a tagged release, and (b) producing the cross-architecture performance benchmarks that currently do not exist anywhere (Section 6): no riscv64-vs-amd64 or riscv64-vs-arm64 comparative numbers were found in any source checked, including bRPC's own official benchmark page.

### 14.3 CI/CD Infrastructure

This is the single highest-priority, highest-leverage gap. No riscv64 CI exists at all (Section 7), and the request for it has stood unaddressed since October 2025. Standing up even a build-only GitHub Actions job (self-hosted riscv64 runner or QEMU-based cross-compile) would move the project's primary color from orange to yellow; adding test execution would move it to blue.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because bRPC is a standalone C++ library/framework with no dependent package ecosystem (no PyPI, npm, Maven, or similar downstream package graph was found to exist for bRPC itself, per Section 8).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Stand up a build-only riscv64 CI job (self-hosted runner or QEMU cross-compile) in `ci-linux.yml` | Data not available: no effort estimate found in research; [NEEDS VERIFICATION] | Data not available | Critical |
| CI/CD | Extend riscv64 CI to run the test suite (requires native riscv64 hardware or a validated QEMU test path, given the project has no QEMU usage today) | Data not available | Data not available | High |
| Functional | Replace intrinsic-based CAS-retry atomics with hand-written `lr`/`sc` assembly to match x86/arm64 implementation style | Data not available | Data not available | Medium |
| Performance | Produce riscv64-vs-amd64/arm64 comparative benchmarks (none exist today, including on the official benchmark page) | Data not available | Data not available | Medium |
| Release | Cut a tagged release including the 7 merged-but-unreleased RISC-V optimization PRs (#3312-#3396) | Data not available | Data not available | Medium |
| Dependency | Track and, where possible, contribute to Protocol Buffers' and Abseil's riscv64 gaps, since bRPC's own grade cannot exceed what these hard dependencies support | Data not available | Data not available | Low (external dependency, not directly actionable by bRPC maintainers) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Apache bRPC GitHub repository](https://github.com/apache/brpc)
- [Apache bRPC homepage](https://brpc.apache.org/)
- [Apache bRPC benchmark page](https://brpc.apache.org/docs/benchmark/)
- [PR #3125 - Add full RISC-V 64-bit architecture support](https://github.com/apache/brpc/pull/3125)
- [PR #3312 - optimize crc32c for riscv64 with Zbc carry-less multiplication](https://github.com/apache/brpc/pull/3312)
- [PR #3332 - Add RISC-V Zvbc vector CRC32C acceleration](https://github.com/apache/brpc/pull/3332)
- [PR #3355 - bthread: implement lock-free AtomicInteger128 for RISC-V](https://github.com/apache/brpc/pull/3355)
- [PR #3374 - fix: replace RISC-V cpu_relax fence.i with pause hint for spin-wait](https://github.com/apache/brpc/pull/3374)
- [PR #3375 - iobuf: add RISC-V Vector (RVV) optimized memcpy for cp()](https://github.com/apache/brpc/pull/3375)
- [PR #3376 - fix char-signedness out-of-bounds read in url and header lookup tables](https://github.com/apache/brpc/pull/3376)
- [PR #3388 - optimize base64 for riscv64 with RVV vrgather and vectorized decode](https://github.com/apache/brpc/pull/3388)
- [PR #3390 - optimize StringPiece memcmp for RISC-V with RVV](https://github.com/apache/brpc/pull/3390)
- [PR #3396 - optimize StringPiece::find(char) for RISC-V with RVV](https://github.com/apache/brpc/pull/3396)
- [Issue #3106 - Support mips64](https://github.com/apache/brpc/issues/3106)
- [Issue #2697 - Support brpc for PPC64 by HX](https://github.com/apache/brpc/issues/2697)
- [Issue #2957 - arm64 valgrind memory leaks](https://github.com/apache/brpc/issues/2957)
- [Issue #3231 - aarch64 double free/corruption](https://github.com/apache/brpc/issues/3231)
- [Issue #3252 - RDMA IOBuf crash](https://github.com/apache/brpc/issues/3252)
- [Issue #2409 - TSC frequency mismatch](https://github.com/apache/brpc/issues/2409)
- [Mail-archive: PR announcement, dev@brpc.apache.org](http://www.mail-archive.com/dev@brpc.apache.org/msg16165.html)
- [Mail-archive: branch master updated, dev@brpc.apache.org](http://www.mail-archive.com/dev@brpc.apache.org/msg16477.html)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [PyPI apache-brpc project page (404)](https://pypi.org/pypi/apache-brpc/json)
- [Ubuntu package search, resolute suite](https://packages.ubuntu.com/search?keywords=Apache%20bRPC&suite=resolute&searchon=names&section=all)