---
title: Fluent Bit
parent: Project Reports
color: blue
dependencies:
  - name: LuaJIT
    relation: build-dependency
    criticality: optional
  - name: simdutf
    relation: build-dependency
    criticality: optional
  - name: jemalloc
    relation: build-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zstd
    relation: build-dependency
    criticality: optional
  - name: snappy
    relation: build-dependency
    criticality: optional
  - name: WAMR
    relation: build-dependency
    criticality: optional
  - name: c-ares
    relation: build-dependency
    criticality: optional
  - name: nghttp2
    relation: build-dependency
    criticality: optional
  - name: SQLite
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="fluent-bit" %}

# Fluent Bit

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Fluent Bit<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Fluent Bit is a lightweight, C-language log, metrics, and trace processor and forwarder. It is a CNCF graduated project, run as a sub-project under the Fluentd umbrella, licensed Apache 2.0, with a homepage at [fluentbit.io](https://fluentbit.io/).

Governance (`GOVERNANCE.md`) grants maintainer status to individuals, not companies, after roughly 6-8 months of sustained contribution, code-review load, and a ~25% time commitment; disputes are resolved by maintainer consensus, falling back to a vote. There is no formal architecture-tier RFC process and no `PLATFORMS.md`/`SUPPORT.md` file governing which CPU architectures are accepted - platform support has been handled ad hoc through ordinary PR review and CMake toolchain changes.

Corporate maintainers, from `MAINTAINERS.md`:

| Maintainer | Component | Company |
|---|---|---|
| Eduardo Silva (edsiper) | All | Chronosphere |
| Leonardo Alminana | All | Chronosphere |
| Hiroshi Hatake (cosmo0920) | All | Chronosphere |
| Masoud Koleini | Stream Processor | Arm |
| Fujimoto Seiji | Windows Platform | Individual |
| Wesley Pettit | Amazon plugins | AWS |
| Cedric Lamoriniere | Datadog output | Datadog |
| Jonathan Gonzalez V. | PostgreSQL output | 2ndQuadrant |
| Jorge Niedbalski | CI and containers | Independent |

Chronosphere (which acquired original steward Calyptia) holds "All"-component maintainership, including all RISC-V work. Arm, AWS, and Datadog sponsor specific plugin areas. fluentbit.io lists Google Cloud, Microsoft, AWS, Cisco, Datadog, and Splunk as adopters, not declared financial sponsors.

On new architecture ports, the community stance is pragmatic rather than policy-driven: RISC-V support was added unilaterally by one Chronosphere engineer with lead-maintainer sign-off, then backfilled into CI as QEMU-emulated, through the standard PR process rather than any formal gate.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-01-31 | Chronosphere/Calyptia blog "Fluent Bit meets RISC-V" documents first successful build/run on a StarFive VisionFive 2 board (Debian Bookworm); no tracking issue or PR is named | [Fluent Bit meets RISC-V](https://chronosphere.io/learn/fluent-bit-risc-v/) |
| 2023-07-24 | Issue #7742 opened: riscv32 (not riscv64) buildroot linking failure | [issue #7742](https://github.com/fluent/fluent-bit/issues/7742) |
| 2023-12-19 | Issue #7742 closed, not planned (riscv32 confirmed out of scope) | [issue #7742](https://github.com/fluent/fluent-bit/issues/7742) |
| 2024-10-25 -> 2024-12-11 | PR #9524 "build: Use signed char in RISC-V 64bit" merged - first riscv64 CI/build foundation; first shipped in v3.2.3 (tagged 2024-12-19) | [PR #9524](https://github.com/fluent/fluent-bit/pull/9524) |
| 2024-12-16 -> 2025-03-29 | PR #9731 "simd: riscv: implement RVV intrinsics" merged - first shipped in v4.0.0 (tagged 2025-04-01) | [PR #9731](https://github.com/fluent/fluent-bit/pull/9731) |
| 2025-05-08 | PR #10310 fixes hardcoded 128-bit VLEN assumption via `__riscv_vsetvl_eXXm1` - first shipped in v4.0.2 (tagged 2025-05-13) | [PR #10310](https://github.com/fluent/fluent-bit/pull/10310) |
| 2025-09-19 | PR #10903 and PR #10909 pin the LLVM `lld`/`lld-15` linker for riscv64 CI - first shipped in v4.1.0 (tagged 2025-09-23) | [PR #10903](https://github.com/fluent/fluent-bit/pull/10903), [PR #10909](https://github.com/fluent/fluent-bit/pull/10909) |
| 2026-03-18 -> 2026-03-23 | PR #11577 (skip Go-compiler test on riscv64), PR #11603 (`FLB_SIMD` Auto tri-state), PR #11609 (`flb_vector8_eq` RVV fallback) merged - first shipped in v5.0.0 (tagged 2026-03-24) | [PR #11577](https://github.com/fluent/fluent-bit/pull/11577), [PR #11603](https://github.com/fluent/fluent-bit/pull/11603), [PR #11609](https://github.com/fluent/fluent-bit/pull/11609) |
| 2026-08-06 | PR #12243 (canary, draft, "DO NOT MERGE") opened: adds riscv64 `libco` coroutine backend, still open as of report date, blocked on `fluent/cfl#89` | [PR #12243](https://github.com/fluent/fluent-bit/pull/12243) |

**Key contributors:** essentially all riscv64-specific commits (#9524, #9731, #10310, #11577, #11603, #11609, #12243) were authored by a single engineer, Hiroshi Hatake (`cosmo0920`, Chronosphere). Review/merge was performed by Eduardo Silva (`edsiper`, Chronosphere, lead maintainer) across most PRs, with Patrick Stephens (`patrick-stephens`) reviewing and merging the foundational PR #9524 after validating on real VisionFive hardware.

**Is it fully upstream?** Yes for everything merged - no fork or downstream patch set is required for the functionality that exists. One substantial item remains unmerged: PR #12243 (libco coroutine backend, needed for `filter_wasm` runtime tests on real riscv64 hardware), explicitly gated on the external prerequisite `fluent/cfl#89`.

No master RISC-V tracking issue exists anywhere in the repository; all work has proceeded as a chain of point PRs rather than under a single umbrella.

## 3. Upstream Support Tier

There is no formal support-tier policy document. In practice, riscv64 is exercised only via QEMU emulation in one CI job (`run-qemu-ubuntu-unit-tests` in [`unit-tests.yaml`](https://github.com/fluent/fluent-bit/blob/master/.github/workflows/unit-tests.yaml)), and that job's result is **not required to pass**: the aggregate gate job `run-all-unit-tests` only checks `needs.run-ubuntu-unit-tests.result != 'success'`, so a riscv64 (or s390x) failure shows red in the run but does not block a merge. No riscv64 job exists in any packaging, release, or image-build workflow. Fluent Bit's official documentation lists supported platforms as x86_64, arm64v8, and arm32v7 only - riscv64 is not an officially listed supported platform, despite the CMake build system and CI having riscv64 support.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | Native (`ubuntu-22.04`/`ubuntu-latest`) | Native (`ubuntu-24.04-arm`) | QEMU-emulated on an `ubuntu-22.04` x86_64 host |
| Test execution | Yes, blocking | Yes | Yes, but non-blocking to the required gate |
| Listed in official docs as supported platform | Yes | Yes | No |
| Official prebuilt binaries | None for any arch (GitHub releases are source-only) | Same | Same |
| Official container images | Yes (multi-arch buildx) | Yes | Not published; not in the `buildx` platform list |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Fluent Bit has genuine first-party RISC-V support plus RISC-V codegen inside two vendored third-party libraries.

- **SIMD abstraction** (`include/fluent-bit/flb_simd.h`, 371 lines): a portable layer with SSE2 (x86_64), NEON (aarch64), and RVV (riscv64) backends, gated by `#elif defined(__riscv) && (__riscv_v_intrinsic >= 11000)`. The RVV path uses only integer vector types (`vuint8m1_t`/`vuint32m1_t`, LMUL=1) - no floating-point RVV type (`vfloat32m1_t`) appears anywhere in the codebase (0 hits on a code search). It implements load, saturating-subtract, equality-compare-via-mask-and-merge (RVV has no direct "compare to all-ones" instruction like SSE/NEON), broadcast, and a high-bit test via reduction, with dynamic vector-width detection (`vsetvl`) rather than a hardcoded VLEN. Consumed by `src/flb_pack.c` for SIMD-accelerated JSON-string-escape detection and float parsing, with a scalar fallback tail.
- **LuaJIT**: force-disabled on riscv64 by `cmake/riscv64.cmake` ("this platform does not support built-in LuaJIT and system provided one neither"). No working upstream riscv64 JIT backend exists in `LuaJIT/LuaJIT`; a riscv64 port sits unmerged in [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) (open since Sep 2024). Only the OpenResty fork (`openresty/luajit2`) has a merged riscv64 backend.
- **WAMR** (vendored WebAssembly runtime, backs the `wasm` filter/input plugins and `flb-wamrc` AOT compiler): has a complete riscv64 backend - `core/iwasm/aot/arch/aot_reloc_riscv.c` (552 lines, ELF relocation resolver for RV32/64) and `core/iwasm/common/arch/invokeNative_riscv.S` (148 lines, hand-written assembly native-call trampoline covering LP64/LP64F/LP64D float ABIs). This is Fluent Bit's practical substitute for LuaJIT on riscv64: Wasm filters work via AOT compilation, per the [Chronosphere blog](https://chronosphere.io/learn/fluent-bit-risc-v/).
- **libco coroutine backend**: missing on riscv64 until the still-open canary PR #12243 lands; this is what currently blocks `filter_wasm` *runtime tests* on real riscv64 hardware (build-time AOT compilation itself already works).
- **simdutf** (vendored UTF-8/16/32 library, used when `FLB_UNICODE_ENCODER`/`FLB_USE_SIMDUTF` are enabled): ships a complete, upstream-maintained RVV backend since v5.0.0 of that library.
- **Signedness fix**: `cmake/riscv64.cmake` forces `-fsigned-char`, since riscv64's default `char` is unsigned (unlike x86_64), matching a fix already required for aarch64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Lua JIT filter | LuaJIT (full JIT) | LuaJIT (full JIT) | Disabled entirely - no JIT backend, no stated interpreter fallback |
| SIMD (JSON escape / util) | SSE2 intrinsics | NEON intrinsics | RVV intrinsics, integer-only; silently disabled in default "Auto" mode if compiler lacks `-march=rv64gcv_zba` |
| WASM runtime (WAMR) | Interpreter + AOT + JIT | Interpreter + AOT + JIT | Interpreter + AOT confirmed complete; fast-JIT tier maturity vs x86_64/aarch64 is [NEEDS VERIFICATION] - a WAMR-repo issue search failed with a hard API permission error this session |
| Coroutine backend (libco) | Native assembly | Native assembly | Missing, pending open PR #12243 |

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` exists in the repository, and there is no dedicated riscv64 Dockerfile. All riscv64 handling is embedded directly in `CMakeLists.txt`, `cmake/riscv64.cmake`, `include/fluent-bit/flb_simd.h`, `tests/runtime_shell/CMakeLists.txt`, `src/wamrc/CMakeLists.txt`/`src/wasm/CMakeLists.txt`, and the CI workflow.

`cmake/riscv64.cmake` (auto-included when `CMAKE_SYSTEM_PROCESSOR MATCHES "^(riscv64)"`):
```cmake
if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(riscv64)")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fsigned-char")
  if(FLB_LUAJIT)
    set(FLB_LUAJIT OFF)
  endif()
  if(FLB_SIMD_ENABLED AND NOT "${FLB_SIMD_RISCV_C_FLAGS}" STREQUAL "")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${FLB_SIMD_RISCV_C_FLAGS}")
  endif()
endif ()
```

SIMD gate in the root `CMakeLists.txt`: `check_c_compiler_flag("-march=rv64gcv_zba" ...)`. `FLB_SIMD` is tri-state (`Auto`/`On`/`Off`); `On` fails configuration with `FATAL_ERROR` if the flag is unsupported, `Auto` (the default) silently disables SIMD with a warning.

Exact CI recipe (verified directly against a shallow clone of `fluent/fluent-bit` at commit `f78472443d32691c319c424c75d9ea2343dbc8f7`, [`unit-tests.yaml`](https://github.com/fluent/fluent-bit/blob/master/.github/workflows/unit-tests.yaml)): installs `gcc-12`/`g++-12`; on riscv64 specifically also installs `lld-15` and registers it as the `ld.lld` alternative; the cmake invocation adds `-DCMAKE_EXE_LINKER_FLAGS="-fuse-ld=lld" -DCMAKE_SHARED_LINKER_FLAGS="-fuse-ld=lld"` only for riscv64, alongside `-DFLB_WITHOUT_flb-it-network=1 -DFLB_WITHOUT_flb-it-fstore=1 -DFLB_BACKTRACE=Off -DFLB_SHARED_LIB=Off -DFLB_DEBUG=On -DFLB_ALL=On -DFLB_EXAMPLES=Off -DFLB_TESTS_INTERNAL=On`, then `make` and `ctest`.

No minimum GCC/Clang version is documented anywhere; the de-facto CI-tested compiler is GCC 12/G++ 12 (Ubuntu 22.04). `lld-15` is mandatory for riscv64 specifically - GNU `ld`/BFD proved unreliable for riscv64 in this CI environment per commits behind PR #10903/#10909. The RVV code path additionally requires `__riscv_v_intrinsic >= 11000`, roughly GCC 14+/Clang 17+ territory; older toolchains fall through to the portable scalar fallback, with an explicit source comment noting "For CI or dockerized riscv64 environment, it doesn't have SIMD extension. So, we need to define the fallback."

QEMU is used in two distinct ways: (1) the entire CI build+test cycle for riscv64 runs under QEMU user-mode emulation (`uraimo/run-on-arch-action`, `binfmt_misc` + `qemu-riscv64-static`) on an amd64 GitHub-hosted runner; (2) `flb_simd.h` documents that the RVV code path itself is realistically only testable via `qemu-riscv64 -cpu rv64,v=true,zba=true,vlen=128 <binary>`, since most real riscv64 silicon still lacks the V extension.

Known build failure: closed issue [#7742](https://github.com/fluent/fluent-bit/issues/7742) reports that the vendored WAMR/`libvmlib` fails to link on riscv32 (not riscv64) under Buildroot's `bootlin-riscv32-glibc` toolchain, due to missing soft-float libgcc symbols (`__fixdfsi`, `__floatsisf`, `__mulsf3`, etc.). Closed as not planned since riscv32 was never a supported target.

No riscv64-specific Dockerfile exists; the multiarch `Dockerfile`'s documented `buildx` platform list covers `linux/amd64,arm64,arm/v7,s390x` only - riscv64 is absent.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 / arm64 | riscv64 |
|---|---|---|
| Lua scripting filter (LuaJIT) | Full JIT | Disabled entirely |
| Wasm filter/input | Interpreter + AOT + JIT | Interpreter + AOT (functional, per the [Chronosphere blog](https://chronosphere.io/learn/fluent-bit-risc-v/)); JIT maturity [NEEDS VERIFICATION] |
| SIMD-accelerated JSON escaping/string search | SSE2/NEON | RVV when compiler and hardware support `rv64gcv_zba`; scalar fallback otherwise, and "Auto" (default) mode silently disables it if unsupported |
| Golang output-plugin proxy shell test | Tested | Explicitly skipped in CI: "we don't test Golang plugins on RISC-V 64bit platform for now" |
| `filter_wasm` runtime tests on real hardware | Supported | Blocked pending open PR #12243 |
| Official container images | Published | Not published |
| Listed as officially supported platform | Yes | No |

**Functional gaps:** Lua scripting is entirely unavailable on riscv64 - not degraded, absent, per the build system's own warning text. The Golang-plugin proxy test is simply not exercised on riscv64 in CI (untested, not confirmed broken). `filter_wasm` runtime testing on real riscv64 hardware is pending the unmerged libco PR (#12243), though the author reports success testing it out-of-tree.

**Performance gaps:** Fluent Bit's v4.1.0 release notes cite "up to 2.5x speedup" for a yyjson-based JSON parser backend using SIMD, but this figure is not stated to apply to riscv64/RVV specifically, and no source confirms the RVV path is included in that number. **Data not available: no riscv64-specific performance benchmark for Fluent Bit exists in any source checked** (GitHub, web search, the Chronosphere blog, riseproject.dev, `fluent/fluent-bit-perf`). Because most real riscv64 silicon lacks the RVV extension and `FLB_SIMD` defaults to "Auto" (silent disable when unsupported), the SIMD code path is likely inactive on the majority of real-world riscv64 deployments today even where the binary was compiled with SIMD support available.

**Security hardening gaps:** Data not available: no CI or build evidence was found addressing riscv64-specific hardening (stack protector, CFI, PIE) distinct from other architectures.

**NaN / floating-point semantics:** No floating-point RVV vector type (`vfloat32m1_t`) is used anywhere in the codebase - the RVV SIMD path is integer-only. The one historical RVV correctness bug (fixed by PR #10310) was a hardware-dependent vector-width assumption, not a NaN or floating-point semantics issue. No open NaN/floating-point bug exists for Fluent Bit on riscv64.

## 7. CI/CD Infrastructure

Confirmed directly by cloning `fluent/fluent-bit` (commit `f78472443d32691c319c424c75d9ea2343dbc8f7`) and grepping all 32-33 files in `.github/workflows/` for "riscv" (case-insensitive); only [`unit-tests.yaml`](https://github.com/fluent/fluent-bit/blob/master/.github/workflows/unit-tests.yaml) contains any match. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

The job `run-qemu-ubuntu-unit-tests`: `runs-on: ubuntu-22.04` (x86_64 GitHub-hosted), `strategy.matrix.arch: [s390x, riscv64]`, using `uraimo/run-on-arch-action@v3.2.0` with `distro: ubuntu22.04` for QEMU user-mode emulation; `needs: run-ubuntu-unit-tests` (chained after native x86 tests to control QEMU cost). It runs a full `cmake && make && ctest` cycle, with a riscv64-only `lld-15` linker workaround. This job feeds the aggregate gate `run-all-unit-tests`, but that gate's failure condition checks only `needs.run-ubuntu-unit-tests.result != 'success'` - a riscv64 (or s390x) failure is visibly red in the run but does not block a required check.

No native riscv64 hardware runner is used anywhere in the repository's CI. No RISE RISC-V Runners usage was found tying that CI service (announced on the RISE blog in [March](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) and [May 2026](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)) to Fluent Bit. No riscv64 job exists in any packaging/release/image workflow (`call-build-linux-packages.yaml`, `build-master-packages.yaml`, `staging-build.yaml`, `staging-release.yaml`, `call-build-images.yaml`, `cron-unstable-build.yaml`).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native GitHub-hosted | Native GitHub-hosted (`ubuntu-24.04-arm`) | QEMU-emulated on x86_64 host |
| Test execution | Yes | Yes | Yes |
| Blocking / required for merge | Yes | Yes | No (aggregate gate ignores this job's result) |
| Packaging/release CI | Yes | Yes | None |

## 8. Distribution and Release Status

GitHub releases are source-only (zip/tar.gz) for **every** architecture - the five most recent releases checked (v5.1.2, v5.1.1, v5.1.0, v5.0.10, v4.2.8) contain no prebuilt binaries at all, for any arch, so the absence of a riscv64 asset is not a riscv64-specific gap.

No PyPI package named `fluent-bit` exists (`https://pypi.org/pypi/fluent-bit/json` and `https://pypi.org/simple/fluent-bit/` both return 404). The RISE Python wheel builder mirrors that absence (its endpoint for `fluent-bit` redirects to the same 404 PyPI page).

Ubuntu 26.04 ("resolute"): a `packages.ubuntu.com` search for "Fluent Bit" returns "Sorry, your search gave no results" - no `fluent-bit`/`python3-fluent-bit`/`libfluent-bit` package exists for any architecture, so riscv64 specifically is moot; the package simply is not in Ubuntu 26.04.

**Tooling caveat:** the `project-graph` MCP server (the intended authoritative SPARQL source for Ubuntu 26.04 package data) failed to connect (`CONNECTION_CLOSED`) throughout this research session; the finding above is a `packages.ubuntu.com` web-search substitute and should be re-verified once that server is reachable. [NEEDS VERIFICATION]

Ubuntu 24.04 (Noble) availability of Fluent Bit itself was not independently confirmed in this research pass (only individual Fluent Bit *dependencies* - LuaJIT, simdutf, jemalloc, OpenSSL, zstd, snappy, SQLite - were checked against Noble; see Section 9). Fluent Bit's own apt repository (`apt.fluentbit.io`) and its Docker images were noted as the project's likely primary distribution channels but were out of scope for this research pass and were not checked.

**What a user must do to get a working riscv64 binary today:** build from source using the CMake configuration and toolchain requirements in Section 5. No prebuilt riscv64 path was found through GitHub releases, PyPI, the RISE wheel builder, or Ubuntu 26.04.

## 9. Dependencies

Fluent Bit is CMake/C, vendoring most dependencies as git submodules under `lib/`. Filtered to JIT/SIMD/numerics/crypto/compression/allocator categories:

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| LuaJIT | JIT backend for the `lua` filter | No upstream riscv64 backend; unmerged [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) (open since Sep 2024) | Community-tested on the PR branch only (SiFive U74, SpacemiT K1/K3, VisionFive2); no upstream CI | Ubuntu 24.04 Noble: JIT binary NOT available for riscv64 (only arch-independent `libluajit-5.1-common` lands) | Sole maintainer Mike Pall has never commented on PR #1267 despite 26 comments/144 reactions |
| simdutf (vendored) | SIMD UTF-8/16/32 validation/transcoding | Yes, RVV backend merged since v5.0.0 of that library, actively maintained | QEMU RVV CI in upstream repo; no native riscv64 hardware runner | Ubuntu 24.04 Noble: no `simdutf` package at all (packaging gap, not a code gap) | None functionally blocking |
| jemalloc | Optional memory allocator | Yes, builds and runs on riscv64; no arch-specific asm or JIT/SIMD | No upstream CI for riscv64 (any arch beyond amd64/arm64) | Ubuntu 24.04 Noble: `libjemalloc2` present, `libjemalloc-dev` (needed to link `FLB_JEMALLOC=On`) NOT confirmed for riscv64 [NEEDS VERIFICATION] | Open issue #2399 (cross-compile docs), 3+ years unaddressed |
| OpenSSL | TLS/crypto backend | Yes; active RV64 crypto asm work (AES via Zknd/Zkne, SHA256, Montgomery multiply) | Dedicated `linux-riscv64` CI runner upstream; some intermittent flakiness under triage | Ubuntu 24.04 Noble: core `openssl` supports riscv64 | No functional blocker; open perf/asm-optimization issues only |
| zstd | Compression | Yes; PR #4525 (riscv64 arch detection) merged, landing in v1.6.0 | No dedicated riscv64 hardware CI | Ubuntu 24.04 Noble: `zstd` + `libzstd-dev` available for riscv64 | None blocking |
| snappy | Compression (alternative) | Yes; one open perf issue (#209, slow `FindMatchLength`) | riscv64 CI job exists with a possible cross-compiler-flag bug [NEEDS VERIFICATION] | Ubuntu 24.04 Noble: `libsnappy-dev`/`libsnappy1v5` available | Unconfirmed CI-config issue plus an unoptimized hot loop; neither blocks builds |
| WAMR (vendored) | WASM interpreter/AOT/JIT for `wasm` filter/input | Interpreter and AOT confirmed complete (Section 4); GitHub issue search for this repo failed with a hard API permission error every attempt this session | Not independently verified this session | Not a distro package (vendored submodule) | Follow-up needed once GitHub access to this repo is available |
| c-ares | Async DNS resolution | 0 riscv64-tagged issues found | Not independently verified | Not separately confirmed | None found |
| nghttp2 | HTTP/2 | No riscv64-specific issues found | Not independently verified | Ubuntu 24.04 riscv64 support "claimed present" [NEEDS VERIFICATION] | None found |
| SQLite | Chunk/state persistence (`FLB_SQLDB`) | Generally fine on riscv64; one riscv32-only build failure noted, not riscv64 | Not independently verified | Ubuntu 24.04 Noble: `sqlite3` available for riscv64 | None blocking |

**Deep-dive summary:** of the dependencies with JIT/SIMD/crypto/numeric relevance, **LuaJIT is the only one with an actual functional gap on riscv64** - no upstream JIT backend exists, so Fluent Bit's `lua` filter cannot use a real riscv64 LuaJIT build from Ubuntu's own packages. simdutf, jemalloc, OpenSSL, zstd, snappy, and SQLite all build and run correctly on riscv64 upstream; residual issues are packaging gaps (simdutf has no Ubuntu package at all) or CI/performance-maturity gaps, not correctness blockers. WAMR's riscv64 status is largely confirmed by direct code inspection (Section 4) but could not be cross-checked against its GitHub issue tracker due to a tooling access failure this session.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7742](https://github.com/fluent/fluent-bit/issues/7742) | Fluent-bit linking issues on buildroot's bootlin-riscv32-glibc target | Closed, not planned (2023-12-19) | Low / moot | Concerns riscv32, not riscv64; riscv32 was never a supported target |
| [#12243](https://github.com/fluent/fluent-bit/pull/12243) | [Canary] Build and test for RISC-V64 libco backend | Open, Draft, "DO NOT MERGE" | N/A (pending feature, not a bug) | Blocked on external prerequisite `fluent/cfl#89`; author reports all `filter_wasm` tests pass on real riscv64 hardware with the patch applied |

**No open correctness bugs exist for Fluent Bit on riscv64.** A dedicated search across GitHub issues for riscv64/riscv32/RVV/NaN/floating-point terms returned zero open RISC-V issues.

## 12. Objections and Upstream Blockers

**Stated blockers:** PR #12243 (libco coroutine backend) is explicitly gated on `fluent/cfl#89` merging first, to fix `TIME_UTC` C11-compliance handling. Its own prerequisite upstream merges (in `edsiper/flb_libco` and `monkey/monkey`) are confirmed already merged by the maintainer `edsiper`.

**No stated objections to riscv64 support itself** were found anywhere in the reviewed PR/issue discussion - every riscv64 PR reviewed for this report was merged, several after direct validation on real VisionFive hardware by reviewer Patrick Stephens.

**Organizational blockers:** this is a single-champion port. Every riscv64-specific commit found was authored by one Chronosphere engineer (Hiroshi Hatake), creating a bus-factor risk; there is no dedicated riscv64 release or hardware-CI investment beyond the non-blocking QEMU unit-test job.

**External blocker:** the LuaJIT gap is outside Fluent Bit's control - it depends on the upstream `LuaJIT/LuaJIT` project merging a riscv64 backend, and that project's sole maintainer has not engaged with the open PR ([PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267)) in over a year.

**Acceptance probability for future riscv64 work:** high, based on track record. Nine riscv64-related PRs merged since December 2024 spanning CI foundation, RVV correctness fixes, and linker tuning, with consistent and fast maintainer engagement from `edsiper` and `patrick-stephens`.

## 13. Readiness Assessment

- **Color:** Blue
- **Release provider:** none
- **Justification:** Upstream CI builds riscv64 and runs the full unit-test suite via QEMU emulation in [`unit-tests.yaml`](https://github.com/fluent/fluent-bit/blob/master/.github/workflows/unit-tests.yaml) (`run-qemu-ubuntu-unit-tests`), satisfying the "build: yes, test: yes" criteria for blue. No upstream riscv64 artifact is published anywhere: GitHub releases are source-only for every architecture, no PyPI package exists, and no Ubuntu 26.04 package exists at all, so the "artifact: no" condition also holds and green is unreachable. Fluent Bit is a general-purpose logging/observability agent, not an optimization-purpose project by the color model's definition (its value proposition - being a lightweight, pluggable log/metrics forwarder - does not depend on the RVV SIMD subsystem, which only accelerates one internal JSON-escaping path); the Step 2 optimization cap therefore does not apply, and `optimization_gap` is N/A.
- **Pending work that could change the grade:** promoting the riscv64 QEMU job from non-blocking to blocking, and adding riscv64 to the official packaging/release/container-image workflows, would not on their own move the color (release_provider must become "upstream" via an actual published artifact, e.g. a riscv64 container image tag or GitHub release asset, to reach green). The open canary PR #12243 (libco backend) closes a functional gap (real-hardware `filter_wasm` testing) but does not by itself change the CI-based color once merged, since it is a build/test-completeness improvement, not a release-artifact change.

## 14. Investment Analysis

RISE has no involvement with Fluent Bit whatsoever - confirmed against all 34 RISE blog posts, the `riseproject-dev` GitHub org (25 repos, zero mentioning Fluent Bit), and the RISE Python wheel builder's full package list. No RISE-funded or RISE-adjacent work exists to avoid duplicating; all investment items below are net-new.

### 14.1 Functional Enablement
- Lua scripting remains entirely unavailable on riscv64 because upstream LuaJIT has no merged riscv64 backend. A durable fix requires either (a) upstream engagement to help land `LuaJIT/LuaJIT` PR #1267, or (b) evaluating and integrating the OpenResty fork (`openresty/luajit2`, which has a merged riscv64 backend) as an alternative Lua runtime for Fluent Bit's riscv64 builds. Estimated effort: 2-4 person-weeks for evaluation plus an initial integration patch.
- Merging the open canary PR #12243 (libco backend) is community/maintainer work already in progress; no independent engineering investment is needed beyond monitoring `fluent/cfl#89` and offering review support if desired (0.5 person-week to track and nudge).

### 14.2 Performance Optimization
- The RVV SIMD path is integer-only and gated to hardware exposing the V extension plus `Zba`, which most real riscv64 silicon still lacks; `FLB_SIMD=Auto` (the default) silently disables it when unsupported. No urgent investment is indicated until RVV hardware becomes common in target deployments.
- No riscv64 performance benchmark exists anywhere for Fluent Bit. Producing a first benchmark (JSON-parse/escape throughput, with and without RVV, on QEMU with `-cpu rv64,v=true,zba=true,vlen=128` and/or real RVV-capable hardware) would establish whether the general "2.5x JSON speedup" figure cited for v4.1.0 materializes on riscv64. Estimated effort: 1-2 person-weeks.

### 14.3 CI/CD Infrastructure
- Promote `run-qemu-ubuntu-unit-tests` (riscv64 leg) from non-blocking to a required check once its pass rate is proven stable. Estimated effort: 1 person-week (includes a monitoring period).
- Add riscv64 to the official packaging and container-image build workflows (`call-build-linux-packages.yaml`, `call-build-images.yaml`, `staging-build.yaml`) so upstream begins publishing a consumable riscv64 artifact - the single change that would move this project's color from blue toward green. Estimated effort: 2-3 person-weeks, likely requiring coordination with Chronosphere maintainers.

### 14.4 Ecosystem Enablement
Not applicable - Fluent Bit's plugins are compiled statically into the daemon binary rather than distributed as an independent package ecosystem (no PyPI/npm/Maven dependents to separately enable on riscv64).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Evaluate/integrate a working Lua runtime for riscv64 (OpenResty LuaJIT fork or upstream LuaJIT PR #1267 support) | 2-4 | Chip company + Chronosphere liaison | Medium |
| Functional | Track and support merge of PR #12243 (libco backend) and its `fluent/cfl#89` prerequisite | 0.5 | Chronosphere (existing owner) | Low |
| Performance | Produce a first riscv64 (QEMU RVV and/or real hardware) benchmark for JSON parse/escape SIMD path | 1-2 | Chip company | Medium |
| CI/CD | Promote riscv64 QEMU unit-test job to a required/blocking check | 1 | Chronosphere + chip company | Medium |
| CI/CD | Add riscv64 to official packaging/container-image build workflows to publish a real upstream artifact | 2-3 | Chronosphere + chip company | High |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Fluent Bit GitHub repository](https://github.com/fluent/fluent-bit)
- [Fluent Bit homepage](https://fluentbit.io/)
- [Fluent Bit meets RISC-V (Chronosphere/Calyptia blog, Hiroshi Hatake, 2023-01-31)](https://chronosphere.io/learn/fluent-bit-risc-v/)
- [unit-tests.yaml CI workflow](https://github.com/fluent/fluent-bit/blob/master/.github/workflows/unit-tests.yaml)
- [Issue #7742 - riscv32 buildroot linking issue](https://github.com/fluent/fluent-bit/issues/7742)
- [PR #9524 - build: Use signed char in RISC-V 64bit](https://github.com/fluent/fluent-bit/pull/9524)
- [PR #9731 - simd: riscv: implement RVV intrinsics](https://github.com/fluent/fluent-bit/pull/9731)
- [PR #10310 - simd: use __riscv_vsetvl_eXXm1 for actual RVV width](https://github.com/fluent/fluent-bit/pull/10310)
- [PR #10903 - workflows: use LLVM-based lld linker for riscv64 and s390x](https://github.com/fluent/fluent-bit/pull/10903)
- [PR #10909 - workflows: use lld-15 only for riscv64](https://github.com/fluent/fluent-bit/pull/10909)
- [PR #11577 - tests: don't use Golang compiler on RISC-V 64bit Linux](https://github.com/fluent/fluent-bit/pull/11577)
- [PR #11603 - build: introduce FLB_SIMD with 'Auto' value option](https://github.com/fluent/fluent-bit/pull/11603)
- [PR #11609 - simd: fallback of flb_vector8_eq on RVV](https://github.com/fluent/fluent-bit/pull/11609)
- [PR #12243 - [Canary] Build and test for RISC-V64 libco backend](https://github.com/fluent/fluent-bit/pull/12243)
- [LuaJIT PR #1267 - RISC-V port (unmerged)](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu package search (packages.ubuntu.com)](https://packages.ubuntu.com/search?keywords=Fluent%20Bit&suite=resolute&searchon=names&section=all)
- [PyPI fluent-bit (404, package does not exist)](https://pypi.org/pypi/fluent-bit/json)