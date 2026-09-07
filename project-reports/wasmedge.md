---
title: WasmEdge
parent: Project Reports
color: blue
---

# WasmEdge

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for WasmEdge<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WasmEdge is a WebAssembly (Wasm) runtime optimized for cloud-native, edge, and AI/inference workloads. It supports both an interpreter execution mode and an ahead-of-time (AOT) / JIT compilation mode backed by LLVM, and ships a large set of optional plugins (WASI-crypto, WASI-NN with multiple ML backends, image, ffmpeg, TensorFlow, zlib, wasm_bpf, etc.).

WasmEdge is hosted by the **Cloud Native Computing Foundation (CNCF)** at the **Sandbox** stage. It is licensed under **Apache License 2.0**.

Governance follows a three-tier structure (Maintainers, Committers, Reviewers) documented in `docs/GOVERNANCE.md`, adopting the CNCF governance template and CNCF Code of Conduct. Decision rules: simple majority for reviewer promotion/removal and general conflicts, two-thirds majority for new repos, governance-doc changes, and maintainer/committer promotion, with lazy consensus for routine business and a monthly public dev meeting.

The governance document is candid about a maintainer-concentration issue: "Currently, all maintainers are from Second State... Target: No single organization controls more than 50% of maintainer seats" - an explicit acknowledged goal, not a present reality. Per `docs/OWNER.md`: all four maintainers (Michael Yuan, Hung-Ying Tai/hydai, Yi-Ying He, Shen-Ta Hsieh) are from **Second State**, with one maintainer from National Tsing Hua University. Committers are mostly Second State plus SRA VJTI and National Tsing Hua University. Reviewers are academic-heavy (University of Science and Technology of China, Southeast University, Nanjing University, Purdue, Huazhong University of Science and Technology, National Taiwan University) plus one Bytedance reviewer. `.github/CODEOWNERS` shows the same Second State core (hydai, ibmibmibm, q82419) owning nearly the entire codebase.

Community stance on new architecture ports, observed across the RISC-V PR history, is pragmatic and CI-gated rather than exclusionary: contributions from outside the Second State core (O3Ol, Sujanian1304, Omswastik-11) were accepted once CI passed and DCO/commit-format standards were met, with hydai acting as the primary technical gatekeeper.

WasmEdge is **not** a RISE (RISC-V Software Ecosystem) member - checked [riseproject.dev/members](https://riseproject.dev/members/) (8 Premier, 12 General members, none WebAssembly-related), the RISE GitHub org (25 repos, none WasmEdge-related), and the full 34-post RISE blog index (none mention WasmEdge or WebAssembly).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-07-26 | [PR #1682](https://github.com/WasmEdge/WasmEdge/pull/1682) opened - first attempt to build WasmEdge on riscv64. Closed unmerged 2023-02-14, blocked by QEMU emulation failures and AOT/filesystem issues under emulation. | [PR #1682](https://github.com/WasmEdge/WasmEdge/pull/1682) |
| 2022-07-28 | [Issue #1694](https://github.com/WasmEdge/WasmEdge/issues/1694) opened - linker errors building AOT with a riscv64 cross toolchain; root cause identified by the reporter as `lib/aot/compiler.cpp` defining x86_64 and aarch64 architectures but not RISC-V. Closed 2022-07-29. | [Issue #1694](https://github.com/WasmEdge/WasmEdge/issues/1694) |
| 2022-08-01 | [Issue #1708](https://github.com/WasmEdge/WasmEdge/issues/1708) opened - AOT-compiled binaries crash with an LLVM `LoadInst` opaque/pointee-type assertion when run on riscv64. Stayed open 13 months, 24 comments. Closed 2023-09-08 once PR #2286 landed. | [Issue #1708](https://github.com/WasmEdge/WasmEdge/issues/1708) |
| 2023-02-14 | [PR #2286](https://github.com/WasmEdge/WasmEdge/pull/2286) opened by O3Ol - the foundational riscv64 port: adds a RISC-V case to the AOT architecture tag (`WriteByte(OS, UINT8_C(3))`), `generic-rv64` CPU selection, `#include <llvm/IR/IntrinsicsRISCV.h>`, 128-bit integer handling, mmap-based allocator support, a new `build_for_riscv.yml` CI workflow, and `riscv64.md` build docs. | [PR #2286](https://github.com/WasmEdge/WasmEdge/pull/2286) |
| 2023-03-02 | PR #2286 merged (hydai approved 2023-03-01, merged 2023-03-02: "Thanks for your contribution!"). First release containing the port: **0.12.0** (2023-04-25). | [PR #2286](https://github.com/WasmEdge/WasmEdge/pull/2286) |
| 2023-07-18 | [PR #2664](https://github.com/WasmEdge/WasmEdge/pull/2664) merged - "Fix testing issue on the RISCV CI workflow" (commit `4fd0e420`). First release: 0.13.2 (2023-07-21). | [PR #2664](https://github.com/WasmEdge/WasmEdge/pull/2664) |
| 2024-08-05 | [Issue #3625](https://github.com/WasmEdge/WasmEdge/issues/3625) opened by hydai - master CI tracking issue: full-QEMU-emulation builds took ~40 minutes; proposes cross-compiling on x64 runners and using QEMU only to run tests. | [Issue #3625](https://github.com/WasmEdge/WasmEdge/issues/3625) |
| 2024-09-02 | [PR #3711](https://github.com/WasmEdge/WasmEdge/pull/3711) merged - switches riscv64 CI base image from EOL `riscv64/ubuntu` (18.04) to `riscv64/ubuntu22.04` (commit `20cc930f`). | [PR #3711](https://github.com/WasmEdge/WasmEdge/pull/3711) |
| 2024-08-07 to 2024-09-13 | [PR #3631](https://github.com/WasmEdge/WasmEdge/pull/3631) (staru09) - first community attempt to resolve #3625. Closed unmerged. | [PR #3631](https://github.com/WasmEdge/WasmEdge/pull/3631) |
| 2025-08-10 to 2025-09-24 | [PR #4308](https://github.com/WasmEdge/WasmEdge/pull/4308) (Omswastik-11) - second attempt at #3625. Closed unmerged (superseded by #4542's approach). | [PR #4308](https://github.com/WasmEdge/WasmEdge/pull/4308) |
| 2026-01-21 to 2026-02-25 | [PR #4542](https://github.com/WasmEdge/WasmEdge/pull/4542) (Sujanian1304) - third attempt succeeds: "ci(riscv): enable RISC-V cross-compilation CI" (squash commit `43374f1b`), closes tracking issue #3625, cuts CI time ~40min to ~15min. Reviewer hydai initially blocked on DCO/commit-format issues; contributor posted a test-run breakdown of 288 tests in ~2.36s under QEMU before merge. First release: 0.17.0-alpha.1 (2026-03-26). | [PR #4542](https://github.com/WasmEdge/WasmEdge/pull/4542) |
| 2026-03-13 | [PR #4710](https://github.com/WasmEdge/WasmEdge/pull/4710) merged (q82419/YiYing He) - "fix(ci): fix riscv CI fail" (commit `ed1fa0c8`). | [PR #4710](https://github.com/WasmEdge/WasmEdge/pull/4710) |
| 2026-03-17 | [PR #4722](https://github.com/WasmEdge/WasmEdge/pull/4722) merged - "fix(ci): dependency installation on riscv" (commit `7f914428`). | [PR #4722](https://github.com/WasmEdge/WasmEdge/pull/4722) |
| 2026-07-03 | [PR #5114](https://github.com/WasmEdge/WasmEdge/pull/5114) merged (hydai) - "ci: fix RISC-V64 cross-compile libedit installation failure". Most recent riscv64-specific fix found. | [PR #5114](https://github.com/WasmEdge/WasmEdge/pull/5114) |

**Key contributors and organizations:** O3Ol (Contributor, original 2022-2023 port and bug reports; no organizational affiliation surfaced), Sujanian1304/Piyush Kumar (2026 CI rewrite), Omswastik-11 and staru09 (two abandoned CI-optimization attempts), hydai/q82419/ibmibmibm (Second State maintainers, primary reviewers/gatekeepers across nearly every riscv64 PR).

**Is it fully upstream?** Yes for the architecture port itself (merged in PR #2286, March 2023, present on `master`) and for CI (merged in PR #4542, February 2026). It is **not** fully upstream for distribution: no riscv64 binaries are published in any WasmEdge GitHub Release (see Section 8).

## 3. Upstream Support Tier

No formal tier policy document exists. Searched `docs/`, repository root, and full-text for "tier" / "platform support" - none found. `docs/technical-review.md` (the CNCF self-assessment) states informally: "WasmEdge can run on a wide range of architectures including x86_64, aarch64, RISC-V, and s390x" - RISC-V is acknowledged in the project's own self-description but with no committed SLA or tier, and no PLATFORMS.md/SUPPORT.md exists.

Evidence for the practical tier: riscv64 CI runs automatically on `push` (branches: master) and `pull_request` (branches: master, `proposal/**`) whenever core-engine paths change, gated behind a shared clang-format lint job - the same automatic trigger structure as the `Core` engine workflow ([`.github/workflows/README.md`](https://github.com/WasmEdge/WasmEdge/blob/master/.github/workflows/README.md)). The README explicitly contrasts this with `build_for_s390x.yml` and `build_for_openwrt.yml`, both of which are `workflow_dispatch`-only (manual). riscv64 is not release-blocking in the sense of gating an official binary (no official riscv64 binary exists to gate), but a failing riscv64 job would block a PR that touches core paths, since it is a required check in the automatic pipeline.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | Yes (cross-compiled on x86_64) |
| CI runs tests | Yes | Yes | Yes (curated "quick tests" subset under QEMU; HEAVY spec-test suites and FLAKY thread/WASI-socket tests explicitly excluded) |
| Official GitHub Release binaries | Yes (multiple: alpine, debian11, manylinux_2_28, ubuntu20.04, windows) | Yes (alpine, debian11, manylinux_2_28, android) | **None** |
| PyPI / OS packages | Ubuntu, Debian, etc. (amd64) | Ubuntu, Debian, etc. (arm64) | **None found** (Ubuntu 26.04, Arch RISC-V, PyPI all checked) |
| CI trigger type | automatic (push/PR) | automatic (push/PR) | automatic (push/PR) - not manual-only, unlike s390x/OpenWrt |

## 4. Technical Architecture and RISC-V-Specific Subsystems

A full-repository grep (`riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, `arch/riscv`, `.S`/`.s` assembly, `__riscv_v`, `zba`/`zbb`/`zicsr`, `LLVMInitializeRISCV`/`RISCVTarget`) found **no `arch/riscv/` directory, no `.S`/`.s` assembly files anywhere in the repository (riscv or otherwise), and no RVV vector-intrinsic code**. The single `rvv` substring match was a base64-encoded test key in `test/plugins/wasi_crypto/asymmetric.cpp`, unrelated to RISC-V Vector.

All architecture handling for riscv64 falls into two categories:

**(a) Generic portability `#ifdef` guards** (`defined(__riscv) && __riscv_xlen == 64`), treating riscv64 identically to x86_64/aarch64/s390x wherever the code needs to know "does this arch have a native 128-bit int / a stable large-address mmap layout":
- `include/common/int128.h`, `include/api/wasmedge/int128.h`: native `__int128`/`unsigned __int128` typedefs on riscv64 vs. a manual hi/lo struct fallback elsewhere.
- `include/ast/instruction.h`: `Instruction` constant storage uses native `uint128_t` on riscv64.
- `include/common/errinfo.h`: error-message formatting uses native 128-bit values on riscv64.
- `include/system/allocator.h` / `lib/system/allocator.cpp`: `WASMEDGE_ALLOCATOR_IS_STABLE=1` for riscv64 (with x86_64/aarch64/s390x), enabling the mmap-based reserve-and-commit linear-memory allocator (vs. a `malloc`/`realloc` fallback elsewhere).
- `lib/api/wasmedge.cpp`, `test/api/helper.cpp`, `test/api/APIUnitTest.cpp`: 128-bit conversion helpers and test round-trips take the same native-`__int128` fast path on riscv64.
- `lib/loader/ast/section.cpp`, `lib/llvm/codegen.cpp`: `HostArchType()` assigns riscv64 the numeric tag `3` (x86_64=1, aarch64=2, riscv64=3, arm32=4, s390x=5) for AOT section/binary-header metadata.

**(b) Two narrow LLVM AOT-compiler overrides** in `lib/llvm/compiler.cpp` (767 lines):
- CPU name is forced to `"generic-rv64"` instead of querying `LLVM::getHostCPUName()` (used on every other architecture).
- CPU features are passed as an empty string instead of `LLVM::getHostCPUFeatures()`, with an in-source comment explaining this avoids QEMU-reported vector-length feature strings (e.g. `zvl128b` without base `v`) that LLVM >= 20 would otherwise reject.

No riscv-specific target initialization exists in `lib/llvm/llvm.h` - target/asm-printer setup calls the generic `LLVMInitializeNativeTarget()`/`LLVMInitializeNativeAsmPrinter()`, relying entirely on however the linked LLVM build was configured, not a WasmEdge-authored RISC-V target registration.

`test/api/APIUnitTest.cpp`'s `APICoreTest.RunModes` test is compiled out entirely under `#ifndef __riscv` - it is untestable under QEMU because the emulated guest dynamic linker does not resolve `dlopen`'d absolute paths the same way as native execution (documented rationale in-source).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AOT/JIT codegen backend | LLVM, host-CPU-feature-detected | LLVM, host-CPU-feature-detected | LLVM, forced `generic-rv64`, empty feature string (no host-feature detection) |
| SIMD/vector dispatch (WASM SIMD lowering) | Generic LLVM IR lowering | Generic LLVM IR lowering | Generic LLVM IR lowering (identical - no riscv branch anywhere) |
| Hand-written assembly | None found | None found | None found |
| RVV / Zba / Zbb / Zicsr usage | N/A | N/A | None |
| 128-bit integer support | Native `__int128` | Native `__int128` | Native `__int128` (same treatment) |
| Memory allocator strategy | mmap-based (stable) | mmap-based (stable) | mmap-based (stable, same treatment) |

**Conclusion:** riscv64 support in WasmEdge is a thin, complete-for-its-scope integration (build/CI/portability shims), not a performance-tuned or vector-accelerated backend. All real machine-code generation for riscv64 is delegated to upstream LLVM's generic RISC-V backend.

## 5. Build System, Cross-Compilation, and Toolchain

No dedicated riscv64 Dockerfile and no `BUILDING.md`/`docs/cross-compilation.md` exist in the repository. All riscv64 build knowledge lives in three files: `cmake/riscv64-linux-gnu.cmake`, `.github/workflows/build_for_riscv.yml`, and `.github/scripts/run-riscv64-quick-tests.sh`.

**Exact cmake/configure command** (as used by CI):
```
cmake -Bbuild \
  -DCMAKE_TOOLCHAIN_FILE=$(pwd)/cmake/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DWASMEDGE_BUILD_TESTS=ON \
  -DWASMEDGE_BUILD_TOOLS=ON \
  -DWASMEDGE_BUILD_SHARED_LIB=ON \
  -DWASMEDGE_USE_LLVM=ON \
  -DLLVM_DIR=/usr/lib/riscv64-linux-gnu/cmake/llvm-20 .
cmake --build build -j $(nproc)
```

**Toolchain file** (`cmake/riscv64-linux-gnu.cmake`, full content, 15 lines): sets `CMAKE_SYSTEM_NAME Linux`, `CMAKE_SYSTEM_PROCESSOR riscv64`, compilers `riscv64-linux-gnu-gcc`/`riscv64-linux-gnu-g++`, and find-root paths under `/usr/riscv64-linux-gnu` and `/usr/lib/riscv64-linux-gnu`.

**Toolchain versions and why:** Project-wide minimum per `AGENTS.md` is CMake 3.18+ and GCC 11+/Clang 13+/MSVC 19.29+. CI specifically uses `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` and **LLVM/LLD 20** from Ubuntu 24.04 (`noble-ports`), required because `WASMEDGE_USE_LLVM=ON` needs `LLVM_DIR=/usr/lib/riscv64-linux-gnu/cmake/llvm-20`, and `noble-ports` (`ports.ubuntu.com`) is the only Ubuntu archive carrying riscv64 cross packages at that version. Native `__int128` support requires an RV64 target (`__riscv_xlen == 64`), an ABI capability check gated throughout `include/common/int128.h` and related files.

**Known build-workaround (not a failure, but notable complexity):** `noble-security` ships newer `Multi-Arch:same` amd64 package versions that conflict with older riscv64 versions on `noble-ports` for `libedit-dev`, `llvm-20-dev` transitive deps, and `python3-minimal:riscv64`'s postinst (which tries to execute a riscv64 binary on an amd64 host). CI works around this by `apt-get download`-ing `.deb` files and `dpkg-deb -x`-extracting them straight to `/` instead of using `apt-get install`. This workaround itself needed three follow-up fixes after the CI rewrite landed (PR #4710, #4722, #5114), indicating the cross-compile path required continued hardening even after being declared complete.

**QEMU usage:** `qemu-user-static` / `qemu-riscv64-static` runs the compiled test binaries and a CLI smoke test (`wasmedge -v` and a compiled `fibonacci.wasm` reactor) via `qemu-riscv64-static -L /usr/riscv64-linux-gnu ...`. This is user-mode emulation on an x86_64 GitHub-hosted runner, not native riscv64 hardware.

**Historical build failures (now resolved):** [Issue #1694](https://github.com/WasmEdge/WasmEdge/issues/1694) (2022, linker errors from a missing RISC-V case in `lib/aot/compiler.cpp`) and [Issue #1708](https://github.com/WasmEdge/WasmEdge/issues/1708) (2022-2023, LLVM `LoadInst` opaque/pointee-type assertion when AOT-compiling on riscv64), both closed once PR #2286 landed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Interpreter mode | Full | Full | Full |
| AOT compilation | Full, host-CPU-feature-tuned | Full, host-CPU-feature-tuned | Functional, but forced to `generic-rv64` with no CPU-feature detection (see Section 4) |
| Official release binaries | Multiple (alpine, debian11, manylinux, ubuntu20.04, windows) | Multiple (alpine, debian11, manylinux, android) | **None** |
| `RunModes` API test (`dlopen`-based) | Runs | Runs | Compiled out entirely (`#ifndef __riscv`) - untestable under QEMU's guest dynamic linker |
| Thread tests, WASI-socket tests | Run in CI | Run in CI | Explicitly excluded from CI as "FLAKY" under QEMU user-mode emulation |
| Heavy spec-test suites (ExecutorCore, LLVMCore, componentTests, etc.) | Run in CI | Run in CI | Explicitly excluded from CI as "HEAVY" (too slow under QEMU) |
| Optional plugins (wasi_crypto, wasi_nn, ffmpeg, image, TensorFlow) | Built and released | Built and released (subset) | Not exercised by riscv64 CI at all (workflow paths exclude `test/plugins/**`) |

**Functional gaps:** riscv64 CI does not build or test any optional plugin (wasi_crypto, wasi_nn, image, ffmpeg, TensorFlow, wasm_bpf, etc.) - the `build_for_riscv.yml` path filter explicitly excludes `test/plugins/**`. Whether these plugins function on riscv64 at all is untested by upstream CI. The `RunModes` API test and the full "HEAVY"/"FLAKY" spec-test categories are permanently skipped under QEMU, meaning a meaningful slice of the test matrix that validates x86_64/aarch64 correctness has never been exercised for riscv64.

**Performance gaps:** No RISC-V-specific SIMD/vector codegen tuning exists (Section 4); the AOT compiler explicitly disables host-CPU-feature detection on riscv64 and uses `generic-rv64` only, so AOT-compiled code cannot exploit vector extensions (RVV) even where hardware supports them. The only concrete WasmEdge-on-RISC-V performance figure found is from WasmEdge's own docs: fib(30) on a RISCV-Lab board runs AOT in `real 0m0.284s` vs. interpreter `real 0m1.814s` (~6.4x speedup from AOT) - [Build on RISC-V 64 | WasmEdge Developer Guides](https://wasmedge.org/docs/contribute/source/os/riscv64/). No riscv64-vs-x86_64/arm64 head-to-head benchmark exists anywhere searched, including RISE's own blog.

**Security hardening gaps:** [NEEDS VERIFICATION] No riscv64-specific hardening posture (e.g. CFI, stack protector defaults) was independently checked in this pass; this is a gap in scope, not a confirmed weakness.

**NaN / floating-point semantics:** [WebAssembly/design#646](https://github.com/WebAssembly/design/issues/646) documents that RISC-V hardware generates all-ones NaN by default (unlike x86/ARM/MIPS/Power), a WebAssembly-spec-level consideration (resolved via IEEE-754 exemptions for min/max/conversions) rather than a WasmEdge-specific bug. A related closed-as-won't-fix WasmEdge issue, [#4819](https://github.com/WasmEdge/WasmEdge/issues/4819) (`f64x2.add`/`mul` NaN payload differs from Wasmtime), was cited as spec-conformant and related to this architecture-dependent NaN propagation behavior, though it is not riscv64-specific in its reported reproduction.

## 7. CI/CD Infrastructure

CI is entirely GitHub Actions (`.github/workflows/`); no `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists in the repository. Of 32 workflow files, only `.github/workflows/build_for_riscv.yml` (240 lines), `.github/scripts/run-riscv64-quick-tests.sh` (121 lines), and `.github/workflows/README.md` reference riscv64.

**`build_for_riscv.yml`** ("Build and Test WasmEdge on riscv64 arch"):
- **Triggers:** `push` (branches: master) and `pull_request` (branches: master, `proposal/**`), both filtered to `include/**`, `lib/**`, `test/**` (excluding `test/plugins/**`), `thirdparty/**`, `tools/**`, `CMakeLists.txt`, `cmake/**`. Automatic, not `workflow_dispatch`-only.
- **`cross_compile` job:** `runs-on: ubuntu-latest`, `container: ubuntu:24.04` - an x86_64 runner, not riscv64 hardware. Cross-compiles with `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu`, LLVM 20, and LLD via manually extracted `.deb`s (to dodge Multi-Arch conflicts). Packages `build/tools`, `build/lib`, `build/test` as `riscv64-artifacts.tar.gz`, uploaded via `actions/upload-artifact` with **`retention-days: 1`** (ephemeral internal CI artifact, not a release asset).
- **`test_riscv64` job:** also `ubuntu-latest`/`ubuntu:24.04`, using `qemu-user-static`/`qemu-riscv64-static` - QEMU user-mode emulation, not real riscv64 hardware. Runs `.github/scripts/run-riscv64-quick-tests.sh` (a curated "quick" subset of 14 test binaries, per-test 300s timeout, skips missing binaries), then a CLI/fibonacci smoke test under `qemu-riscv64-static`.
- Both jobs use `step-security/harden-runner` and pinned-SHA actions. Permissions: `contents: read`.
- `run-riscv64-quick-tests.sh` explicitly documents and disables two groups: **HEAVY** (spec-test suites too slow under QEMU: `ExecutorCoreTests`, `APIVMCoreTests`, `APIStepsCoreTests`, `APIAOTCoreTests`, `APIAOTNestedVMTests`, `LLVMCoreTests`, `AOTCacheTests`, `MixcallTests`, `componentTests`) and **FLAKY** under QEMU (`ThreadTests`, `wasiTests`, `wasiSocketTests`).
- No RISE RISC-V runner references found anywhere in the workflow files - all riscv64 execution is QEMU emulation on standard GitHub-hosted amd64 runners.

**Release/publish pipelines** (`.github/workflows/release.yml`, `build.yml`): grepped for "riscv" (case-insensitive) - **zero matches in either file**. The riscv64 CI is structurally disconnected from the actual release-packaging pipeline.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | Native GitHub-hosted | Native GitHub-hosted / `run-on-arch-action` | x86_64 `ubuntu:24.04` container, cross-compile + QEMU emulation |
| CI trigger | Automatic (push/PR) | Automatic (push/PR) | Automatic (push/PR), not `workflow_dispatch`-only |
| Tests run | Full suite | Full suite | Curated "quick" subset only; HEAVY and FLAKY groups explicitly excluded |
| Release-blocking | Yes (feeds `release.yml`) | Yes (feeds `release.yml`) | No - `release.yml`/`build.yml` contain zero riscv references |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

**GitHub Releases:** Checked full asset listings for multiple tags (0.14.1, 0.14.1-rc.1, 0.17.1, 0.17.2-rc.1, 0.18.0-alpha.1). Assets cover alpine (aarch64/x86_64 static), android_aarch64, darwin (arm64/x86_64), debian11 (aarch64/x86_64 static), manylinux_2_28 (aarch64/x86_64), ubuntu20.04 (aarch64/x86_64), windows, source tarball, sbom, checksums, plus 50-70+ plugin files. **No asset filename in any checked release contains "riscv" or "riscv64."**

**PyPI:** `https://pypi.org/pypi/wasmedge/json` lists only `wasmedge-0.0.1.tar.gz`, described as "an empty package... we will publish new versions soon" - not the actual WasmEdge distribution channel, and no riscv64 reference regardless.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasmedge/` redirects (302) to `pypi.org/simple/wasmedge/`, indicating RISE has not built a separate wheel for this package.

**Ubuntu 26.04 (Resolute):** `wasmedge`, `libwasmedge0`, `libwasmedge-dev` (version 0.16.1+dfsg-1, universe section) are available for **amd64 and arm64 only**. No riscv64 build exists at all - not even an unpatched one, so the distribution floor (Section 1 of the color model) does not apply upward.

**Arch Linux RISC-V port:** Fetched `archriscv.felixc.at` directly - zero occurrences of "wasmedge" anywhere on the page. Package is entirely absent from this repository.

**What a user must do to get a working riscv64 binary today:** Build from source using the exact CMake invocation in Section 5, on a riscv64 cross-toolchain (or natively on riscv64 hardware) - there is no installable package or official binary from any channel checked.

## 9. Dependencies

WasmEdge builds LLVM-based AOT/JIT compilation on by default (`WASMEDGE_USE_LLVM=ON`).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| LLVM 20 + LLD | Core - JIT/AOT backend | Found in Ubuntu 26.04 riscv64 (`llvm-20-dev`, `liblld-20-dev`, ports/universe) | Green in WasmEdge's own CI (QEMU) | Ubuntu ports/universe only, no upstream LLVM.org riscv64 binary releases | Tracked in `projects.yml` but no `project-reports/llvm.md` report exists yet - recommend generating one given it is WasmEdge's most load-bearing riscv64 dependency |
| zstd (libzstd) | Core - compression, required for LLVM>=15 static linking | Found in Ubuntu 26.04 riscv64 (`libzstd-dev`) | See `project-reports/zstd.md` - QEMU/PR-only CI, not release-blocking | Debian sid + Ubuntu | Per `project-reports/zstd.md`: 7 open RVV/perf PRs stalled 2-6 months on maintainer non-response - performance, not build-blocking |
| zlib (libz) | Core - compression, required for static LLVM linking | Found in Ubuntu 26.04 riscv64 (`zlib1g-dev`) | See `project-reports/zlib.md` - riscv64 CI is OpenBSD-only via vmactions | Ubuntu/Debian/Arch RISC-V all ship it | Per `project-reports/zlib.md`: RVV Adler32 PR open since 2025-10-28, no maintainer response - performance gap only |
| OpenSSL (libssl/libcrypto) | Optional plugin dep (wasi_crypto) | Found in Ubuntu 26.04 riscv64 (`libssl-dev`) | See `project-reports/openssl.md` - QEMU-only CI, no native riscv64 runner | Debian sid, Ubuntu, Arch RISC-V all current | Per `project-reports/openssl.md`: **critical unresolved** - AES T-table fallback path is not constant-time on riscv64 hardware lacking Zkn/Zvkned, fix PRs #31080/#31082 open; relevant only if `wasi_crypto` plugin is enabled |
| simdjson | Core/plugin - SIMD JSON parsing | Found in Ubuntu 26.04 riscv64 (`libsimdjson-dev`); FetchContent-buildable from source regardless | Not independently verified | Packaged on Ubuntu riscv64 | Declares `SIMDJSON_IS_RISCV64` detection with a portable scalar fallback - functional, likely without SIMD acceleration [NEEDS VERIFICATION] |
| fmt | Core - formatting | Found in Ubuntu 26.04 riscv64 (`libfmt-dev`) | Not independently verified | Packaged on Ubuntu riscv64 | Pure portable C++, no architecture-specific code expected |
| spdlog | Core - logging | Found in Ubuntu 26.04 riscv64 (`libspdlog-dev`) | Not independently verified | Packaged on Ubuntu riscv64 | Pure portable C++ |
| blake3 (bundled, `thirdparty/blake3/`) | Core - content hashing | Not a distro package (vendored source); its own CMakeLists enables SIMD/ASM dispatch only for amd64/x86/ARMv8, excluding riscv64 by name | Compiled portable fallback (`blake3_portable.c`) | Ships with WasmEdge itself | Functional but unaccelerated on riscv64 - same pattern as any non-x86/ARM64 target, no known correctness issue |

**Optional, non-default plugin dependencies** (not on the default build path): PyTorch, OpenVINO/OpenVINOGenAI, TensorFlow/TensorFlow-Lite, gRPC/Protobuf, HIP/hipBLAS (ROCm), MLX, OpenCV - all `OFF` by default except the GGML llama-native default. These were out of scope for "critical" status but flagged for a dedicated riscv64 check if WASI-NN with those backends matters.

**Summary:** The dependency gating WasmEdge's flagship AOT/JIT feature (LLVM 20 + LLD) is available on Ubuntu 26.04 riscv64 and matches what WasmEdge's own CI already builds and tests against successfully. All other core deps (zlib, zstd, simdjson, fmt, spdlog) are present in Ubuntu 26.04 riscv64. The only dependency with a currently open, security-relevant riscv64 gap is OpenSSL (relevant only if `wasi_crypto` is enabled).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1694](https://github.com/WasmEdge/WasmEdge/issues/1694) | Build error with riscv-gnu-toolchain (AOT linker errors) | Closed (2022-07-29) | Was build-blocking | Root cause fixed by PR #2286 |
| [#1708](https://github.com/WasmEdge/WasmEdge/issues/1708) | AOT mode runtime error on RISC-V64 (LLVM LoadInst assertion) | Closed (2023-09-08) | Was runtime-crashing | Resolved once PR #2286's architecture support landed |
| [#3625](https://github.com/WasmEdge/WasmEdge/issues/3625) | Full-QEMU-emulation CI took ~40 minutes | Closed (2026-02-25) | Performance/CI-cost, not correctness | Resolved by PR #4542 |

**A targeted search for "riscv64 test failing" open issues returned zero results - no currently open, RISC-V-specific correctness bugs exist in the tracker.**

**Open general JIT/AOT correctness bugs (not RISC-V-restricted, but same interpreter/JIT code paths apply; most reported on x86_64 and not independently verified on riscv64):**

| ID | Title | Status | Notes |
|---|---|---|---|
| [#5303](https://github.com/WasmEdge/WasmEdge/issues/5303) | `memory.atomic.notify` incorrectly traps at final valid 4-byte address | Open | Correctness bug, architecture unspecified |
| [#4744](https://github.com/WasmEdge/WasmEdge/issues/4744) | JIT boundary-sensitive slowdown for `i32.store16`/`i64.store16` | Open | Performance, reported on x86_64 |
| [#4841](https://github.com/WasmEdge/WasmEdge/issues/4841) | JIT much slower for `v128.store->v128.load->lane extract` pattern | Open | Performance |
| [#4826](https://github.com/WasmEdge/WasmEdge/issues/4826) | JIT disproportionately slow on `i16x8.max_u` 0x8000-threshold case | Open | Performance |
| [#4815](https://github.com/WasmEdge/WasmEdge/issues/4815) | JIT disproportionately slow on `i8x16.min_s` scaffold | Open | Performance |
| [#4636](https://github.com/WasmEdge/WasmEdge/issues/4636) | SIGSEGV executing array operations under `--enable-jit` | Open | Correctness bug, architecture unspecified |
| [#3347](https://github.com/WasmEdge/WasmEdge/issues/3347) | AOT compiler drops memory side-effects inconsistently around traps at -O2+ | Open | Correctness bug, architecture unspecified |
| [#4819](https://github.com/WasmEdge/WasmEdge/issues/4819) | `f64x2.add`/`mul` NaN payload differs from Wasmtime | Closed, won't-fix | Spec-conformant; cited as related to architecture-dependent NaN propagation |

**Correctness bugs highlighted separately:** #5303, #4636, and #3347 are open correctness (not merely performance) bugs in the shared interpreter/JIT/AOT code paths that riscv64 also runs through; none have been specifically confirmed or denied on riscv64 hardware in this research pass. [NEEDS VERIFICATION]

## 12. Objections and Upstream Blockers

**Stated objections:** None found opposing riscv64 support in principle. The historical record shows the opposite - maintainer hydai actively solicited the CI-optimization work via the #3625 tracking issue (labeled `good first issue`, `help wanted`) and merged three separate outside contributors' work once each met CI/DCO standards.

**Technical blockers (resolved):** The two original blockers - missing AOT architecture case (#1694) and an LLVM opaque-pointer assertion under emulation (#1708) - were both resolved by PR #2286 in 2023.

**Technical blockers (current, non-blocking to CI but limiting scope):** QEMU user-mode emulation cannot run the `RunModes` dlopen-based API test or the "HEAVY"/"FLAKY" test groups, permanently narrowing what riscv64 CI actually validates versus amd64/arm64. The AOT compiler's forced `generic-rv64` CPU with empty feature string is a QEMU-CI robustness workaround, not a step toward RISC-V-specific codegen.

**Organizational blockers:** None found. The review pattern (hydai as gatekeeper, requiring DCO compliance, clean commit history, and passing CI) is applied uniformly and was successfully satisfied by three different outside contributors across the port and CI-rewrite history.

**Acceptance probability for further riscv64 work:** High, based on precedent - every substantive riscv64 contribution found in the historical record (PR #2286, #4542, plus fixups #4710/#4722/#5114) was eventually merged once it met the same CI/DCO bar applied to any other contribution. The primary remaining gap is not upstream resistance but the absence of any contributor having proposed publishing riscv64 release binaries or a riscv64 Ubuntu/Arch package.

## 13. Readiness Assessment

- **Color:** blue (no color_case - blue is not a sub-typed color in this model)
- **Release provider:** none - no riscv64 binary or package is published by upstream, RISE, any Linux distribution, or any third party
- **Justification:** Step 1 CI evidence, verified by direct inspection of the workflow file rather than search-index summaries: [`build_for_riscv.yml`](https://github.com/WasmEdge/WasmEdge/blob/master/.github/workflows/build_for_riscv.yml) runs automatically on push/PR (not `workflow_dispatch`-only), with a `cross_compile` job that cross-compiles for riscv64 and a `test_riscv64` job that executes a curated unit-test subset under `qemu-riscv64-static` - this satisfies "build: yes, test: yes." No riscv64 release artifact exists in any channel checked: GitHub Releases (multiple tags, zero riscv64 asset filenames), `release.yml`/`build.yml` (zero riscv references), PyPI, Ubuntu 26.04 (amd64/arm64 only), or Arch Linux RISC-V (package absent). Build=yes, test=yes, release=no maps directly to **blue** per the skill's Step 1 table.
- **Optimization-purpose modifier:** Not triggered. WasmEdge is a general-purpose WebAssembly runtime (interpreter plus optional AOT/JIT), analogous to the skill's excluded category of "general-purpose language runtimes," rather than a narrowly-scoped speed library (allocator, SIMD library, NN-kernel library, or hardware-accelerated crypto library) whose entire value proposition collapses without architecture-specific tuning. WasmEdge's interpreter mode is fully functional and tested on riscv64 independent of AOT tuning. `optimization_gap: N/A`.
- **Pending work that could change the grade:** No RISE involvement exists anywhere (blog, GitHub org, funded RFPs), and no open PR or issue toward publishing an official riscv64 release binary or package was found. The only open item touching related territory is [PR #5213](https://github.com/WasmEdge/WasmEdge/pull/5213) (LLVM linker replacement, not riscv64-labeled). Reaching green would require upstream (or a distro, or RISE) to begin publishing a consumable riscv64 artifact - CI is already in place to support that step.

## 14. Investment Analysis

RISE has not funded, run, or otherwise touched any part of WasmEdge's riscv64 effort (Section 1 governance/RISE findings) - none of the work below is already covered by RISE and should not be discounted on that basis.

### 14.1 Functional Enablement

The architecture port itself is complete and upstream (PR #2286, merged 2023). Remaining functional gaps are scope-of-testing gaps, not missing functionality: optional plugins (wasi_crypto, wasi_nn, image, ffmpeg, TensorFlow) are excluded from riscv64 CI entirely (`test/plugins/**` path exclusion) and their riscv64 functional status is unverified. Extending CI to cover at least one representative plugin (wasi_crypto is the most consequential given the identified OpenSSL AES constant-time gap) would close a real unknown.

### 14.2 Performance Optimization

No riscv64-specific codegen tuning exists; the AOT compiler explicitly disables host-CPU-feature detection on riscv64. Enabling RVV-aware feature detection in `lib/llvm/compiler.cpp` (replacing the blanket empty-feature-string workaround with a QEMU-vs-native-hardware distinction) would let AOT-compiled WASM exploit vector extensions on real riscv64 hardware. This requires coordinating with the same LLVM feature-string inconsistency issue noted in-source (`generic-rv64` was chosen specifically because QEMU-reported features are unreliable) - work should target native-hardware CI or a native-hardware test lane, not just the current QEMU path.

### 14.3 CI/CD Infrastructure

Core cross-compile+QEMU CI is complete and actively maintained (three follow-up fixes since PR #4542, most recently PR #5114 in July 2026). Two specific gaps: (1) the "HEAVY" and "FLAKY" test-group exclusions under QEMU represent permanently untested surface area - obtaining native riscv64 CI hardware (RISE runners are a candidate, though WasmEdge has none today) would let these run; (2) `test/plugins/**` is entirely excluded from the riscv64 path filter, so no plugin gets riscv64 CI coverage at all.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's own scoping rule: WasmEdge is a standalone runtime/tool without a significant dependent package ecosystem (npm/PyPI/Maven consumers) that itself needs separate riscv64 enablement; its own critical dependencies are covered in Section 9.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Distribution | Publish official riscv64 binaries in GitHub Releases (extend `release.yml`/`build.yml` to include the riscv64 build already validated by CI) | 1-2 | WasmEdge/Second State maintainers | High |
| Functional | Extend riscv64 CI to cover at least the `wasi_crypto` plugin (given identified OpenSSL AES constant-time gap on riscv64 without Zkn/Zvkned) | 2-3 | WasmEdge/Second State maintainers, or external contributor | High |
| Performance | Replace the blanket empty-CPU-feature-string workaround in `lib/llvm/compiler.cpp` with RVV-aware feature detection gated on native (non-QEMU) execution | 3-5 | WasmEdge/Second State maintainers, LLVM RISC-V expertise | Medium |
| CI/CD | Obtain native riscv64 CI hardware to re-enable the "HEAVY" and "FLAKY" test groups currently skipped under QEMU | 2-4 (mostly infrastructure/procurement, plus test-harness rework) | WasmEdge infra + potential RISE runner engagement | Medium |
| Distribution | Package `wasmedge`/`libwasmedge0`/`libwasmedge-dev` for Ubuntu/Debian riscv64 (currently amd64/arm64 only) | 1-2 | Ubuntu/Debian package maintainers, or WasmEdge-side liaison | Low-Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Issue #3625 - master CI tracking issue](https://github.com/WasmEdge/WasmEdge/issues/3625)
- [PR #1682 - first riscv64 port attempt (closed unmerged)](https://github.com/WasmEdge/WasmEdge/pull/1682)
- [PR #2286 - foundational riscv64 port (merged)](https://github.com/WasmEdge/WasmEdge/pull/2286)
- [Issue #1694 - AOT build linker errors](https://github.com/WasmEdge/WasmEdge/issues/1694)
- [Issue #1708 - AOT runtime crash on riscv64](https://github.com/WasmEdge/WasmEdge/issues/1708)
- [PR #2664 - CI testing fix](https://github.com/WasmEdge/WasmEdge/pull/2664)
- [PR #3711 - CI base image update](https://github.com/WasmEdge/WasmEdge/pull/3711)
- [PR #3631 - first CI-optimization attempt (closed unmerged)](https://github.com/WasmEdge/WasmEdge/pull/3631)
- [PR #4308 - second CI-optimization attempt (closed unmerged)](https://github.com/WasmEdge/WasmEdge/pull/4308)
- [PR #4542 - CI cross-compilation rewrite (merged, closed #3625)](https://github.com/WasmEdge/WasmEdge/pull/4542)
- [PR #4710 - riscv CI fix](https://github.com/WasmEdge/WasmEdge/pull/4710)
- [PR #4722 - riscv dependency installation fix](https://github.com/WasmEdge/WasmEdge/pull/4722)
- [PR #5114 - libedit installation fix](https://github.com/WasmEdge/WasmEdge/pull/5114)
- [PR #5213 - LLVM lld linker replacement (open, not riscv-labeled)](https://github.com/WasmEdge/WasmEdge/pull/5213)
- [build_for_riscv.yml - riscv64 CI workflow](https://github.com/WasmEdge/WasmEdge/blob/master/.github/workflows/build_for_riscv.yml)
- [.github/workflows/README.md - CI overview](https://github.com/WasmEdge/WasmEdge/blob/master/.github/workflows/README.md)
- [Build on RISC-V 64 - WasmEdge Developer Guides](https://wasmedge.org/docs/contribute/source/os/riscv64/)
- [Supported Platforms - WasmEdge Developer Guides](https://wasmedge.org/docs/category/supported-platforms/)
- [WasmEdge GitHub Releases](https://github.com/WasmEdge/WasmEdge/releases)
- [wasmedge PyPI package JSON](https://pypi.org/pypi/wasmedge/json)
- [Ubuntu packages.ubuntu.com search for wasmedge (resolute)](https://packages.ubuntu.com/search?keywords=WasmEdge&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package listing](https://archriscv.felixc.at/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog index](https://riseproject.dev/blog)
- [WebAssembly/design#646 - RISC-V default NaN discussion](https://github.com/WebAssembly/design/issues/646)
- [Issue #5303 - memory.atomic.notify bounds bug](https://github.com/WasmEdge/WasmEdge/issues/5303)
- [Issue #4636 - SIGSEGV under --enable-jit](https://github.com/WasmEdge/WasmEdge/issues/4636)
- [Issue #3347 - AOT compiler drops memory side-effects](https://github.com/WasmEdge/WasmEdge/issues/3347)
- [Issue #4819 - f64x2 NaN payload difference (closed, won't-fix)](https://github.com/WasmEdge/WasmEdge/issues/4819)
- [Frank Denis - Performance of WebAssembly runtimes in 2026](https://00f.net/2026/06/23/webassembly-runtimes-2026/)
- `project-reports/zstd.md` (referenced dependency deep-dive, internal)
- `project-reports/zlib.md` (referenced dependency deep-dive, internal)
- `project-reports/openssl.md` (referenced dependency deep-dive, internal)
