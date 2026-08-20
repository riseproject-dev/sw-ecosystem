---
title: clspv
---

# clspv

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for clspv<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

clspv is a compiler for OpenCL C targeting Vulkan compute shaders: it translates OpenCL C 1.2 source into SPIR-V binaries consumable by a Vulkan implementation. Repository: [google/clspv](https://github.com/google/clspv). Created 2017-07-12. License: Apache 2.0. 725 stars, 107 forks, 89 open issues.

**Governance:** No independent foundation. Hosted under the `google` GitHub org but the repo explicitly disclaims official status: "Clspv is not an official Google product." No MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, PLATFORMS.md, or SUPPORT.md file exists (all return 404). Governance is informal and Google-CLA-gated: CONTRIBUTING.md requires a Google Individual or Corporate CLA before merge, and states "we're sorting out policies and direction, but at the very least all contributions will be reviewed." The `AUTHORS` file lists only two copyright holders: Codeplay Software Ltd. and Google Inc.

**Corporate sponsors / contributors** (from commit authorship and GitHub profiles):

| Contributor | Company | Commits (all-time) |
|---|---|---|
| alan-baker (Alan Baker) | Google | 349 |
| rjodinchr (Romaric Jodin) | Google (top active committer, 37 of last 180 days) | 314 |
| dneto0 (David Neto) | Google | 183 |
| kpet (Kevin Petit) | ARM | 107 |
| jrprice (James Price) | Google | 30 |
| mantognini (Marco Antognini/Borgeaud) | ARM | 26 |
| sjw36 (Simon Waters) | Kernelize.ai | 10 |
| callumfare (Callum Fare) | Codeplay Software | 9 |
| omarahmed1111 (Omar Ahmed) | Codeplay | 8 |
| xueliang-zhong-arm | ARM | contributor |
| EwanC (Ewan Crawford) | Stream HPC | contributor |
| ben-clayton, dj2 | Google | contributor |
| dnovillo (Diego Novillo) | NVIDIA | contributor |
| antiagainst (Lei Zhang) | AMD AI Group | contributor |
| a.annestrand (Austin Annestrand) | Samsung | contributor |

Founding CONTRIBUTORS (canonical, from repo): Neil Henning, JinGu, Alistair Low (Codeplay), Kevin Petit, Alan Baker, David Neto, John Kessenich (Google). This reflects the project's origin as a Google + Codeplay Software collaboration, with ARM becoming a significant later contributor, plus smaller contributions from NVIDIA, AMD, Samsung, Stream HPC, and Kernelize.ai.

**Community stance on new ports:** No stated tier policy for platforms/architectures exists. CONTRIBUTING.md's only relevant guidance is generic: "Before you start working on a larger contribution, you should get in touch with us first through the issue tracker with your idea." A 2022 PR (#834, "Enable universal binaries on Apple platforms," adding macOS arm64+x86_64 fat-binary support) sat unresolved for roughly four years and was auto-closed 2026-08-11 for merge conflicts/staleness [NEEDS VERIFICATION - single source], suggesting host-architecture portability work is not an active maintainer priority even for mainstream arm64.

**Architectural note relevant to all subsequent sections:** clspv compiles OpenCL C to SPIR-V, a portable intermediate representation consumed by a downstream Vulkan driver. It is not a JIT and has no native code generator for any CPU ISA (`LLVM_TARGETS_TO_BUILD=Native` only; emitted target triples are `spirv32/64-unknown-vulkan`). This means RISC-V is not a "port" target in the traditional sense (unlike, e.g., a CPU-targeted runtime or LLVM backend) - clspv's only relationship to RISC-V is (a) whether clspv's own C++ builds and runs on a riscv64 host, and (b) whether a downstream Vulkan driver on a RISC-V system can consume clspv's SPIR-V output, which is entirely outside clspv's codebase.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-03-17 | User `dinyy` opens [issue #1320](https://github.com/google/clspv/issues/1320), "how can I cross compile clspv in x86 for risc-v," with a screenshot of a build failure | [Issue #1320](https://github.com/google/clspv/issues/1320) |
| 2024-03-17 (same day) | Google collaborator `rjodinchr` replies, hypothesizing an LLVM TableGen host/cross-compile ordering issue, pointing to ChromeOS's `clvk-9999.ebuild` `build_host_tools` step as a reference pattern | [Issue #1320](https://github.com/google/clspv/issues/1320) |
| 2024-03-17 to present | No further activity. Reporter never posted a build log; no maintainer or community follow-up; issue remains OPEN | [Issue #1320](https://github.com/google/clspv/issues/1320) |

**Key contributors:** rjodinchr (Google) is the only person who has engaged with RISC-V in any capacity on this project, and that engagement was a single unconfirmed diagnostic reply, not code.

**Is it fully upstream?** There is no RISC-V port to be "upstream" or not - zero commits, zero merged or open PRs, zero code changes exist anywhere in the repository's history that reference RISC-V. The entire body of RISC-V-related material in this project's history is the one open, unresolved issue above.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. clspv has no documented platform/architecture tier system (no PLATFORMS.md, no tiered CI matrix, no release-architecture policy of any kind).

**Evidence:**
- CI: Kokoro (`kokoro/` directory, Google-internal) covers Linux (amd64, clang/gcc, debug/release), macOS (clang, debug/release), and Windows (VS2022, amd64, debug/release) only. Zero arm64/aarch64 coverage and zero riscv64 coverage. Confirmed by reading all 42 files under `kokoro/` (`build.sh`/`build.bat`/`continuous.cfg`/`presubmit.cfg` for all 11 job directories) - grep for "riscv" returns 0 matches; grep for "arm"/"aarch64" also returns 0 matches.
- Release-blocking: Not applicable - clspv has zero GitHub Releases (confirmed via `gh api repos/google/clspv/releases` returning `[]`), so no architecture, including amd64, is "release-blocking" in any binary-release sense.
- Official binaries: None exist for any architecture. clspv is source-only.

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build/test | Yes (Kokoro, Linux/macOS/Windows, clang+gcc) | No (only implicit via macOS Apple Silicon Kokoro pool, unconfirmed arch split) | No |
| Official binary releases | None (0 GitHub Releases for any arch) | None | None |
| Distro packages | None (not in Debian, Ubuntu, Arch) | None | None |
| Documented cross-compile path | None (native builds only) | None documented | None documented; one unresolved user issue (#1320) |
| Tier classification | De facto primary (only tested arch) | Untested/unsupported | Untested/unsupported |

## 4. Technical Architecture and RISC-V-Specific Subsystems

clspv has **no host-CPU-architecture-specific subsystems of any kind** - not for RISC-V, not for x86, not for ARM. This was independently verified via adversarial re-check (see Verification section of research findings):

- **JIT / native codegen:** None. clspv only builds LLVM/Clang with `LLVM_TARGETS_TO_BUILD=Native` for its own host tooling (TableGen, Clang frontend); it never emits native machine code as a product. No JIT backend exists in clspv itself.
- **SIMD / hand-tuned intrinsics:** None. Code search for `immintrin.h` (x86), `arm_neon.h` (ARM NEON), and `riscv_vector.h` (RVV) all return 0 matches across the full repository.
- **`#ifdef` architecture guards:** None. Code search for `__riscv`, `__x86_64__`, `__aarch64__`, `__arm__` all return 0 matches.
- **Crypto / GC barriers:** Not applicable - clspv has no garbage collector and no cryptographic code paths.
- **The one "architecture" concept in clspv is unrelated to host CPU ISA:** `lib/Compiler.cpp` defines `enum class SPIRVArch { SPIRV32, SPIRV64 }` controlling the **output** SPIR-V pointer width (target triple `spirv32-unknown-vulkan` vs `spirv64-unknown-vulkan` for the generated Vulkan compute shader) - analogous to `-m32`/`-m64` in gcc, and orthogonal to whether clspv itself runs on an x86, ARM, or RISC-V host.
- The only "arm" string match in the repo, `test/ArmDot/*.cl`, refers to the Khronos `cl_arm_integer_dot_product` OpenCL extension name (an ISA-agnostic Vulkan/SPIR-V capability), not ARM host-CPU code.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native codegen backend | N/A (not a native codegen tool) | N/A | N/A |
| SIMD/intrinsics | None | None | None |
| Arch-conditional code (`#ifdef`) | None | None | None |
| Host-build support | Only tested host (via Kokoro amd64 Docker image) | Untested | Untested; one unresolved cross-compile attempt (#1320) |

**Conclusion:** RISC-V is not a case of a partial or neglected port - it is treated identically to every other architecture, none of which receive any special-cased host-arch code. The correct verdict is "architecture-specific code is an inapplicable category" for this project, rather than "RISC-V support is missing."

## 5. Build System, Cross-Compilation, and Toolchain

**Build commands** (from `README.md`, architecture-agnostic, no arch branching exists anywhere in the build scripts):

```bash
python3 utils/fetch_sources.py      # pulls LLVM/Clang/libclc/SPIRV-Tools/SPIRV-Headers pinned in deps.json
mkdir build && cd build
cmake -GNinja <clspv-dir>
ninja
ninja check-spirv check-spirv-64    # test suite
```

**Required toolchain versions and why:** clspv does not set its own compiler-version floor; it inherits LLVM's, since it builds LLVM/Clang from source as a pinned submodule (`deps.json`, commit `d34b0ab0`, 2026-08-08). That commit's `llvm/cmake/modules/CheckCompilerVersion.cmake` hard-enforces (`FATAL_ERROR`, not a warning):

```
GCC_MIN = 7.4
CLANG_MIN = 5.0
APPLECLANG_MIN = 10.0
MSVC_MIN = 19.28
LIBSTDCXX_MIN = 7
```

Cited reason (in-file, referencing [LLVM's toolchain support policy](https://llvm.org/docs/DeveloperPolicy.html#toolchain)): LLVM requires C++17, and compilers below these versions lack complete/reliable C++17 support. clspv's own `CMakeLists.txt` additionally requires `cmake_minimum_required(VERSION 3.22.1)` (higher than LLVM's own 3.20.0 floor) and sets `CMAKE_CXX_STANDARD 17`. A comment in clspv's `CMakeLists.txt` notes `option(LLVM_TEMPORARILY_ALLOW_OLD_TOOLCHAIN "" ON)` is forced on because "Kokoro bots have older toolchains" - this only downgrades LLVM's *soft-error* tier to a warning; the hard `GCC_MIN`/`CLANG_MIN` floor above is unaffected. In practice Google's own CI uses much newer toolchains: `cmake-3.31.2`, `gcc-15`, `ninja-1.10.0`, `python-3.12`, `clang-18`, inside a Docker image (`us-east4-docker.pkg.dev/shaderc-build/radial-docker/ubuntu-24.04-amd64/cpp-builder`) that is **amd64-only** - no arm64 or riscv64 variant exists across any of the 11 Kokoro job directories.

**QEMU usage:** None found anywhere - zero mentions of "qemu" in the clspv repo tree, in ~90 sampled GitHub forks, in the `kpet/clvk` repo, in the AUR `clspv-git` PKGBUILD, or in the conda-forge `clspv-feedstock` (which ships only `linux_64` and `osx_64` CI configs).

**Cross-compilation toolchain files:** None exist in-repo for any architecture. Paths checked and confirmed 404: `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, `cmake/toolchain.cmake`, `cmake/toolchains/riscv64.cmake`, `BUILDING.md`, `docs/cross-compilation.md`.

**Known build failures (RISC-V):** The single documented failure is from [issue #1320](https://github.com/google/clspv/issues/1320) - a user cross-compiling with a CMake toolchain file setting `CMAKE_SYSTEM_PROCESSOR RISC-V` and `riscv64-unknown-linux-gnu-{gcc,g++}` hit a build failure. No error log was ever posted. Google collaborator rjodinchr's hypothesis: the failure is an LLVM TableGen cross-compilation problem - TableGen is a code generator that must execute at build time and cannot run as a RISC-V binary on an x86 build machine, so `llvm-tblgen`/`clang-tblgen` must be built for the host first. He pointed to ChromeOS's `clvk-9999.ebuild` as a working reference pattern:
- `build_host_tools()` (~line 111): a non-cross CMake build using the host compiler (`CC=${CBUILD}-clang`), `-DLLVM_TARGETS_TO_BUILD=""`, `-DLLVM_BUILD_TOOLS=OFF`, `-DLLVM_ENABLE_PROJECTS="clang"`, building only the `utils/TableGen` and `tools/clang/utils/TableGen` targets.
- `src_configure()` (~line 196): the real cross build then passes `-DCMAKE_CROSSCOMPILING=ON -DLLVM_TABLEGEN=<host>/bin/llvm-tblgen -DCLANG_TABLEGEN=<host>/bin/clang-tblgen` to reuse the host-built TableGen binaries.

This pattern is generic to any LLVM cross-compilation (not RISC-V-specific) and has never been confirmed to fix the reporter's issue, scripted into clspv's own build system, or CI-verified. [NEEDS VERIFICATION - hypothesis was never confirmed by the reporter or any follow-up]

**CMake flags that exist** (none are riscv64-specific):
```
-DCLSPV_SHARED_LIB=OFF|ON
-DSKIP_CLSPV_INSTALL / -DSKIP_CLSPV_TOOLS_INSTALL
-DCLSPV_BUILD_SPIRV_DIS=ON
-DENABLE_CLSPV_OPT=ON
-DCLSPV_BUILD_TESTS=ON (auto-OFF on ANDROID)
-DEXTERNAL_LLVM=0|1   # use a pre-built external LLVM instead of the bundled submodule; this is the flag that would be relevant to supplying a natively cross-built LLVM for a riscv64 build, but is undocumented for that use case
```

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles/runs as a host tool | Yes (only tested host, via Kokoro) | Untested, no CI | Untested, no CI; one unresolved user cross-compile attempt |
| Emits SPIR-V (its actual function) | Yes, arch-independent output | Same | Same (output format is host-arch-independent by design) |
| Official binaries | None | None | None |
| Documented build path | Native build only | None documented | None documented |

**Functional gaps:** None specific to RISC-V as an output/product concern, because clspv's output (SPIR-V) is host-arch-independent. The only open question is whether clspv's own C++ builds on a riscv64 host - unresolved per issue #1320, but not architecturally blocked (LLVM's native riscv64 host-build path is otherwise mature; see Section 9).

**Performance gaps:** Not applicable. clspv has no host-CPU-specific code paths for any architecture (Section 4), so there is no SIMD-driven performance delta to characterize between amd64/arm64/riscv64 host builds. No performance benchmark data of any kind (any architecture) was found for clspv itself.

**Security hardening gaps:** Data not available: no RISC-V-specific security hardening discussion (e.g., pointer authentication analogues, stack-clash mitigation) found in issues, PRs, or documentation for clspv on any architecture.

**NaN / floating-point semantics issues:** Two open, generic (non-architecture-specific) floating-point issues exist - [#321](https://github.com/google/clspv/issues/321) ("Support double-precision floating point") and [#392](https://github.com/google/clspv/issues/392) ("clspv goes into infinite loop") - but neither mentions RISC-V or any architecture-specific NaN/float behavior. Data not available: no RISC-V-specific floating-point semantics issue exists.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Confirmed by direct file reads (not just search) of every CI-related file in the repository:

- `.github/workflows` does not exist: `gh api repos/google/clspv/contents/.github` returns 404; the full recursive repo tree (4,339 paths) contains zero paths matching `.github` and zero paths matching `\.ya?ml$`. GitHub Actions is not used at all.
- The only CI system is Google-internal **Kokoro** (`kokoro/` directory), consisting of 42 files across 11 job directories: `amber-linux-gcc-release`, `check-format`, `clvk-linux-clang-debug`, `linux-clang-{debug,release}`, `linux-gcc-{debug,release}`, `macos-clang-{debug,release}`, `windows-vs2022-amd64-{debug,release}`, plus shared scripts under `kokoro/scripts/{linux,macos,windows}/`.
- All 42 files were read in full and grepped case-insensitively for "riscv" - 0 matches. GitHub's code-search API independently confirms: `search/code?q=riscv+repo:google/clspv` returns `total_count: 0`.

**Representative CI job** (`kokoro/linux-clang-release/build.sh`, same pattern for all 5 Linux jobs):
```bash
docker run --rm -i \
  --volume "${ROOT_DIR}:${ROOT_DIR}" \
  --workdir "${ROOT_DIR}" \
  --env BUILD_TOOLCHAIN="clang" \
  --env BUILD_TYPE="RelWithDebInfo" \
  --entrypoint "${ROOT_DIR}/${SCRIPT_DIR}/../scripts/linux/build.sh" \
  us-east4-docker.pkg.dev/shaderc-build/radial-docker/ubuntu-24.04-amd64/cpp-builder
```
The Docker image tag hardcodes `ubuntu-24.04-amd64`; the same image is reused unchanged across every Linux job, with only `BUILD_TOOLCHAIN`/`BUILD_TYPE` env vars varying - no `--platform`, no QEMU, no second image tag anywhere. Windows jobs are literally named `windows-vs2022-amd64-{debug,release}` - amd64 is baked into the job name itself. `continuous.cfg`/`presubmit.cfg` files each contain a single `build_file:` line with no `on:`-style trigger keys (trigger wiring lives in Google's internal, non-public Kokoro config).

**RISE runners?** No. None of RISE's `riscv-runner-*` repos reference clspv, and clspv has no RISE-authored CI configuration of any kind.

**Hardware used:** Google-internal Kokoro pool (Linux/macOS/Windows), amd64 only, per the image tags above. Data not available beyond that: no further hardware detail is published.

**Comparison table:**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | Kokoro (Google-internal) | None | None |
| Build lanes | Linux (clang/gcc x debug/release), macOS (clang x debug/release), Windows (VS2022) | 0 | 0 |
| Test execution | `ninja check-spirv`, `ninja check-spirv-64` | N/A | N/A |
| QEMU emulation | N/A (native) | Not used | Not used |

## 8. Distribution and Release Status

**clspv ships zero pre-built binaries for any architecture.** This was independently re-verified via adversarial check across four channels:

| Channel | Result |
|---|---|
| GitHub Releases | `gh api repos/google/clspv/releases` returns `[]` (0 releases). 2 git tags exist (`transparent-pointers`, `clvk-khronos-submission-419`) but carry only auto-generated `zipball_url`/`tarball_url` source snapshots, no binary assets. |
| PyPI | `pypi.org/pypi/clspv/json` returns HTTP 404, `{"message": "Not Found"}`. `pypi.org/simple/clspv/` also 404. (Sanity-checked against numpy's same endpoint, which returns 200, confirming the API works and clspv genuinely is absent.) |
| Ubuntu (noble) | `packages.ubuntu.com` search returns "Sorry, your search gave no results." |
| Debian | `tracker.debian.org/pkg/clspv` returns 404; `sources.debian.org/src/clspv/` returns 404; Debian sources API and `packages.debian.org` search both confirm no match. |
| Arch Linux RISC-V | Full build-status page (`archriscv.felixc.at/.status/status.htm`, 17,259 lines) grepped case-insensitively for "clspv" - 0 matches. Not tracked in Arch's own source repos, so it never entered the riscv64 porting pipeline at all. |
| conda-forge | `clspv-feedstock` `.ci_support/` ships only `linux_64` and `osx_64` configs. |
| AUR | `clspv-git` PKGBUILD explicitly declares `arch=('x86_64')` only. |
| vcpkg | No port exists. |

**What must a user do to get a working binary?** Build from source: `python3 utils/fetch_sources.py && mkdir build && cd build && cmake -GNinja .. && ninja`. There is no packaged or pre-built path on any architecture, so the riscv64 gap is not a riscv64-specific gap - it is universal to clspv's source-only distribution model.

## 9. Dependencies

clspv is a source-to-SPIR-V translator (OpenCL C -> LLVM IR -> SPIR-V), not a JIT and not a codegen backend for any CPU ISA. Its `LLVM_TARGETS_TO_BUILD` is `Native` only, and its emitted target triples are `spirv32/64-unknown-vulkan` via libclc - never `riscv64`. clspv needs riscv64 only as a build host/native target for its own tooling (TableGen, Clang, its own C++), never as a compilation target.

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| [llvm/llvm-project](https://github.com/llvm/llvm-project) (pinned `d34b0ab0`, 2026-08-08) | Hard dependency: C++ compiler frontend, IR passes, libclc (OpenCL builtin bitcode) | LLVM's RISC-V codegen backend is mature (700+ open `backend:RISC-V` issues, active development) but irrelevant here - clspv only needs LLVM's native/host build to succeed on riscv64. Debian's `llvm-toolchain-19` is currently **Failed** on riscv64 in sid via [bug 1142869](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1142869), an abseil-ABI-transition FTBFS affecting **all architectures**, not RISC-V-specific. LLVM buildbot (checked 2026-08-20): most `clang-riscv-*` cross-target builders currently red, only `clang-riscv-gauntlet` passing | No riscv64-native LLVM CI job exercises clspv itself | No official LLVM binary releases for riscv64 host; distro packages (Debian) are the only path, currently broken by the abseil transition | Open, unanswered [clspv #1320](https://github.com/google/clspv/issues/1320) |
| [KhronosGroup/SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools) (pinned `fb747184`) | Hard dependency, vendored/built (`EXCLUDE_FROM_ALL`) for `spirv-dis` plus optimizer/validator libraries | **Installed** on Debian sid riscv64 (2026.3~rc1-1, built successfully ~15 days before the research date) | No autopkgtest data found; 0 riscv64-tagged issues/PRs | Debian sid riscv64 binary available | None found |
| [KhronosGroup/SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers) (pinned `b824a462`) | Hard dependency, header-only SPIR-V enum/opcode definitions | Arch-independent, header-only, no build step | N/A | Packaged `arch:all` in Debian | None |
| [google/amber](https://github.com/google/amber) (test-only) | Functional-correctness test harness (`test/amber/`); not required to build clspv, only to run its integration tests | Default build (tests + SPIRV-Tools + Shaderc/glslang + lodepng) clean on riscv64 per Amber's own status report - every default dependency "Installed" in Debian sid/riscv64 | One open, narrow flakiness bug inherited from googletest ([google/googletest#3756](https://github.com/google/googletest/issues/3756), `GetThreadCountTest` fails on riscv64); otherwise no CI | No official binaries for any arch (source-only) | See `reports/amber.md` |
| SwiftShader (test-only, via Amber's `AMBER_ENABLE_SWIFTSHADER=TRUE`) | CPU/software Vulkan implementation so Amber-driven tests run without a real GPU in CI | Partial: LLVM-JIT-backend path only; Subzero JIT explicitly unsupported on riscv64. Requires non-default `-DLLVM_VERSION=16.0` (default LLVM 10 path broken for riscv64 JIT after a 2026-06-08 revert, missing `InProcessMemoryManager::Create`) | No riscv64 CI, no riscv64 test coverage found | No official binaries for any architecture | See `reports/swiftshader.md` |
| [kpet/clvk](https://github.com/kpet/clvk) (test-only, via `build-clvk.sh`) | Downstream OpenCL-over-Vulkan runtime consuming clspv as its compiler; built in CI to validate clspv end-to-end | Pulls Vulkan-Headers (header-only, Debian `arch:all`) and Vulkan-Loader (Debian riscv64: **Installed**, 1.4.357.0-1) at pinned tag `v1.3.243`. clvk itself: 0 riscv64-tagged issues/PRs | No riscv64 CI found in clvk or clspv's kokoro jobs | Not packaged in Debian; no official binaries | None found |

**Key findings:**
1. The dependency chain's riscv64 health is bifurcated: the SPIR-V-only pipeline (SPIRV-Tools, SPIRV-Headers) is fully green on riscv64 via Debian. The LLVM/Clang host-toolchain piece is nominally fine upstream (mature riscv64 backend) but currently blocked in Debian sid by a transitional, non-RISC-V-specific FTBFS. The JIT-bearing test-only dependency (SwiftShader, pulled transitively through Amber) is the one link with a genuine riscv64-specific functional gap (Subzero JIT unsupported, default LLVM-JIT path broken).
2. Because clspv performs no riscv64 codegen itself, "does clspv support riscv64" reduces to "can clspv's own C++ be built/run on a riscv64 host" - unresolved/unautomated (issue #1320) but not architecturally blocked; LLVM's native riscv64 build path is mature enough that a manual cross-build (host-TableGen-first pattern) should work, it has simply never been scripted or CI-verified for clspv.
3. Two dependencies map to existing scope.yml reports: Amber -> `reports/amber.md`, SwiftShader -> `reports/swiftshader.md`. LLVM/Clang shares its repo with the LLDB scope.yml entry (`reports/lldb.md`), but that report is scoped to the LLDB debugger subproject, not general LLVM host-build/codegen health, and should not be read as authoritative for clspv's LLVM dependency.

Section 10 (Ecosystem Status) is omitted: clspv is a standalone compiler tool with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a runtime library) - it is consumed directly by a small number of specific downstream projects (clvk, ANGLE, ChromeOS) as a vendored build dependency, not as a broad package-ecosystem node.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1320](https://github.com/google/clspv/issues/1320) | how can I cross compile clspv in x86 for risc-v | OPEN | RISC-V build blocker (unconfirmed root cause) | Opened 2024-03-17; one reply from Google collaborator rjodinchr hypothesizing an LLVM TableGen host/cross-compile ordering issue; no log ever posted, no follow-up, no fix landed. Sole RISC-V-related item in the entire issue tracker. |
| [#321](https://github.com/google/clspv/issues/321) | Support double-precision floating point | OPEN | Generic (non-arch-specific) | Not RISC-V-related; listed for completeness on floating-point coverage. |
| [#392](https://github.com/google/clspv/issues/392) | clspv goes into infinite loop | OPEN | Generic correctness (non-arch-specific) | Not RISC-V-related. |

**Correctness bugs highlighted:** None of the above are RISC-V-specific correctness bugs. #1320 is a build/toolchain issue, not a runtime correctness issue. No RISC-V-specific correctness or performance bug exists anywhere in the tracker (89 open issues scanned).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has stated an objection to RISC-V support; the topic has simply never been engineering-prioritized.

**Technical blockers:**
1. Unconfirmed LLVM TableGen host/cross-compile ordering issue (per rjodinchr's hypothesis on #1320) - likely resolvable via the documented ChromeOS `build_host_tools` pattern, but never implemented or verified for clspv specifically.
2. No CI lane exists to catch regressions even if a fix were merged, since Kokoro is amd64-only across all 11 job directories.
3. Debian's LLVM 19 toolchain is currently broken on riscv64 (abseil ABI transition, [bug 1142869](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1142869)) - not RISC-V-specific, affects all architectures, but currently removes the one plausible pre-built LLVM host path on Debian riscv64.

**Organizational blockers:**
1. Google is the primary sponsor/committer base (alan-baker, rjodinchr, dneto0, jrprice = the four highest-commit contributors, all Google) and has not prioritized this.
2. No dedicated RISC-V tracking issue, milestone, or roadmap item exists - the single relevant issue has had zero engineering follow-through in roughly 2.5 years.
3. Even a low-risk, mainstream arm64 portability PR (#834, universal binaries on Apple platforms) reportedly sat unmerged for around four years before being auto-closed for staleness [NEEDS VERIFICATION - single source], suggesting host-portability work generally is not resourced regardless of target architecture.

**Acceptance probability:** Likely high if a well-tested PR were submitted with a working cross-compile recipe and no CI regression risk, given CONTRIBUTING.md's generally welcoming (if informal) stance and the precedent of ARM engineers (kpet, mantognini) becoming significant contributors. However, given the four-year fate of the arm64 universal-binary PR, there is meaningful risk that even a correct PR would stall without an engaged internal (Google) sponsor pushing it through review.

## 13. Investment Analysis

**RISE has not funded or performed any work on clspv.** Confirmed via exhaustive check of the RISE blog (33 posts, 2024-05-15 to 2026-08-18), the RISE Python wheel builder (~78 packages, no clspv.yaml), the `riseproject-dev` GitHub org (48 repos, none clspv-related; the only 2 code-search hits are this report repository's own generated Amber/ANGLE reports mentioning clspv as a third-party dependency, not RISE-authored clspv work), and RISE's public working-group issue trackers (`compilers-and-toolchains-wg`, `system-libraries-wg`, `ai-ml-wg` - zero clspv references). Google is a RISE Premier Member, but that membership has not translated into RISC-V work on clspv itself. No sizing below assumes any pre-existing RISE coverage.

### 13.1 Functional Enablement

- Reproduce and diagnose the #1320 build failure on a real riscv64 host or via QEMU; confirm or refute the TableGen host/cross-compile hypothesis. **0.5-1 person-week.**
- Implement and upstream a host-TableGen-first CMake cross-compile path (mirroring the ChromeOS `clvk-9999.ebuild` `build_host_tools`/`src_configure` pattern) directly in clspv's own `CMakeLists.txt`, plus a documented toolchain file. **1-2 person-weeks.**
- Validate native (non-cross) riscv64 build end-to-end once a riscv64 host with adequate RAM/build time is available, including `ninja check-spirv`/`check-spirv-64` test suite pass. **0.5 person-week.**

### 13.2 Performance Optimization

Not applicable in any meaningful sense: clspv has no host-CPU-specific code paths for any architecture (Section 4), so there is no SIMD/vectorization optimization opportunity analogous to what would exist in a native codegen or numerics library. **0 person-weeks.**

### 13.3 CI/CD Infrastructure

- Add a riscv64 Kokoro (or migrate-to-GitHub-Actions) build lane, reusing RISE's free native riscv64 GitHub runners (per RISE's 2026-03-24 "RISE RISC-V Runners" announcement) if a public CI migration is pursued; alternatively add a QEMU-based emulated lane if native hardware is unavailable to Google's internal Kokoro pool. **1-1.5 person-weeks** (higher if Kokoro's internal-only infrastructure cannot be extended and a GitHub Actions migration is required first).

### 13.4 Ecosystem Enablement

Not applicable (Section 10 omitted - no dependent package ecosystem to enable).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Diagnose #1320 TableGen cross-compile failure | 0.5-1 | Upstream (Google) or external contributor | High |
| Functional | Implement host-TableGen-first CMake cross-compile path + toolchain file | 1-2 | Upstream (Google) or external contributor | High |
| Functional | Validate native riscv64 build + test suite pass | 0.5 | External contributor with riscv64 hardware access | Medium |
| Performance | N/A - no host-arch-specific code exists | 0 | N/A | N/A |
| CI/CD | Add riscv64 CI lane (native or QEMU) | 1-1.5 | Upstream (Google), possibly with RISE runner donation | Medium |
| Ecosystem | N/A - Section 10 omitted | 0 | N/A | N/A |

**Total estimated effort: approximately 3-5 person-weeks** to close the functional and CI gaps. This is a small, well-scoped investment because clspv's architecture (portable SPIR-V output, no native codegen) means there is no deep porting work required - only a build-system fix and a CI lane addition.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/clspv repository](https://github.com/google/clspv)
- [Issue #1320: how can I cross compile clspv in x86 for risc-v](https://github.com/google/clspv/issues/1320)
- [Issue #321: Support double-precision floating point](https://github.com/google/clspv/issues/321)
- [Issue #392: clspv goes into infinite loop](https://github.com/google/clspv/issues/392)
- [PR #834: Enable universal binaries on Apple platforms](https://github.com/google/clspv/pull/834) [NEEDS VERIFICATION - closure details from single source]
- [ChromeOS clvk-9999.ebuild (build_host_tools reference pattern)](https://chromium.googlesource.com/chromiumos/overlays/chromiumos-overlay/+/main/media-libs/clvk/clvk-9999.ebuild)
- [kpet/clvk repository](https://github.com/kpet/clvk)
- [google/amber repository](https://github.com/google/amber)
- [llvm/llvm-project repository](https://github.com/llvm/llvm-project)
- [KhronosGroup/SPIRV-Tools repository](https://github.com/KhronosGroup/SPIRV-Tools)
- [KhronosGroup/SPIRV-Headers repository](https://github.com/KhronosGroup/SPIRV-Headers)
- [Debian bug 1142869: llvm-toolchain-19 FTBFS (abseil ABI transition, all architectures)](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1142869)
- [google/googletest#3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Debian package tracker: clspv (404, not packaged)](https://tracker.debian.org/pkg/clspv)
- [PyPI: clspv (404, not packaged)](https://pypi.org/pypi/clspv/json)
- [Ubuntu package search: clspv (no results)](https://packages.ubuntu.com/search?keywords=clspv&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V build status](https://archriscv.felixc.at/.status/status.htm)
- [LLVM toolchain support policy](https://llvm.org/docs/DeveloperPolicy.html#toolchain)
- [RISE Project members](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement, 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- `reports/amber.md` (this repository, Amber dependency status)
- `reports/swiftshader.md` (this repository, SwiftShader dependency status)
- `reports/lldb.md` (this repository, LLVM/Clang shared-repo entry point - scoped to LLDB, not authoritative for clspv's LLVM dependency)