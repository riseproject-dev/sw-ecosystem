---
title: atheris
parent: Project Reports
---

# atheris

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for atheris<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

**Methodology note:** WebSearch returned empty result sets for all queries in part of this research session (confirmed non-functional via unrelated sanity-check queries), so findings rely on direct GitHub API/CLI calls (`gh api`, code/issue/PR/commit search), direct WebFetch of primary sources (PyPI JSON API, Debian tracker, Arch package database, RISE project pages), and full-repository grep of a local clone. Every negative result below (zero riscv64 hits) was independently re-run at least twice across the search, fetch, and verify phases with consistent results.

## 1. Project Overview

Atheris is Google's Python fuzzing engine: a pybind11-based C++ extension that wraps LLVM's libFuzzer to provide coverage-guided fuzzing of Python code (and, via `native_extension_fuzzing.md`, native/C-extension code). The native core is small: 10 files, 3,865 lines under `src/native/`, building six pybind11 extension modules (`atheris.native`, `atheris.core_with_libfuzzer`, `atheris.core_without_libfuzzer`, `atheris.mock_libfuzzer`, `atheris.custom_crossover`, `atheris.custom_mutator`). License is Apache-2.0.

**Governance.** Atheris is governed as a standard Google-maintained GitHub repo, not an independent foundation project. There is no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, or SECURITY.md file (all confirmed 404). Contributions require a signed Google CLA (enforced by `google-cla[bot]` on every PR). Google runs internal CI via Kokoro (`.kokoro/continuous.cfg`, `.kokoro/presubmit.cfg` exist) mirrored to a public GitHub Actions workflow; the content/architecture coverage of the internal Kokoro jobs was not independently verified beyond confirming the config file names exist [NEEDS VERIFICATION].

**Corporate maintainers.** `TheShiftedBit` ("Bitshift", `setup.py` lists `author="Bitshift"`, `author_email="atheris@google.com"`) is the de facto lead maintainer with 176 commits, by far the top contributor, Google. `Ian Eldred Pudney` (`IPudney`, 32 commits), anonymized internal accounts "Googler" (20 commits) and `Evan Seeyave` (15 commits, matching a Piper-to-GitHub backport-bot commit-message pattern), and `Aiden Hall` (14 commits) are also Google. External, non-Google contributors drive most platform-support work: `pd-fkie` (Patrick D., Fraunhofer FKIE - a German research institute; `setup.cfg`/`setup.py` carry a `Copyright 2021 Fraunhofer FKIE` line), `Andrew Murray` (`radarhere`, independent, Pillow maintainer), and `fanquake` (Bitcoin Core maintainer, drive-by fix).

**Corporate sponsor and RISE.** Google LLC is a RISE **Premier Member** (alongside Alibaba, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent). No evidence connects this membership to any RISC-V work on the atheris repo specifically - RISE's own blog, GitHub org, and wheel-builder infrastructure contain zero mentions of atheris (detailed in Section 12/13).

**Community culture on new ports:** reactive, not proactive. Maintainers respond to installation-help issues (e.g., closed issue [#44](https://github.com/google/atheris/issues/44)) but there is no roadmap or stated intent to add new architectures. The one Google maintainer comment on cross-architecture linking issues is explicit about the limits of in-house expertise: *"I'm not very familiar with ARM, so I don't know what would be needed"* (TheShiftedBit, issue #44). All non-x86_64 platform-support code to date has been contributed externally (silabs.com, Fraunhofer FKIE, RMC Infosec), not initiated by Google.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-09-26 | Issue #44 opened: "Help with installation on ARM" (Raspberry Pi 4, armv7l) | [issue #44](https://github.com/google/atheris/issues/44) |
| 2022-12-03 | Issue #52 opened: "Generate wheels for all platforms via cibuildwheel" | [issue #52](https://github.com/google/atheris/issues/52) |
| 2023-01-09 | Issue #44 closed, unresolved - TLS relocation and libatomic problems never fixed by a maintainer | [issue #44](https://github.com/google/atheris/issues/44) |
| 2023-08-17 | PR #68 opened: "Added support for ARM64 linux" (author: `ryroe`) | [PR #68](https://github.com/google/atheris/pull/68) |
| 2023-08-18 | PR #68 merged same-day, no formal review recorded - added an `aarch64` branch to `find_libfuzzer.sh` | [PR #68](https://github.com/google/atheris/pull/68) |
| 2023-10-11 | Issue #74 opened: broad installability failures (Ubuntu, Alpine, ArchLinux, Windows) | [issue #74](https://github.com/google/atheris/issues/74) |
| 2026-01-09 | PR #99 opened: "Add cross-platform wheel builds (macOS ARM64, Linux x86_64/aarch64)" | [PR #99](https://github.com/google/atheris/pull/99) |
| 2026-06-11 | PR #99 last updated - still open, one approving review, `mergeable_state: "blocked"` | [PR #99](https://github.com/google/atheris/pull/99) |

**No riscv64 milestone exists in this project's history.** Zero issues, PRs, or commits reference RISC-V at any point across the full commit history (645 commits) or the full issue/PR corpus (68 issues, 43 PRs, all states, title+body+comments scanned). The table above documents the aarch64/ARM precedent because it is the only analog available - every "new architecture" event in this repo's history is an ARM event, never a RISC-V one.

**Contradiction in the source data:** one contributor-analysis finding attributes "added original ARM64 Linux support in 2023" to `Julien Voisin` (`jvoisin`, external, non-Google, 30 GitHub contributions), while the directly-verified PR #68 record (full diff, timestamps, comments) shows the author field as `ryroe` (Ryan Roe, silabs.com email) with no co-author or review credit to Voisin. This is a direct discrepancy between two findings in the same research pass. The PR #68 metadata is the stronger primary source; the Julien Voisin attribution is flagged **[NEEDS VERIFICATION]** and may reflect a conflation with Voisin's other (unspecified) contributions.

**Is it fully upstream?** Not applicable to riscv64 (no port exists). Even the aarch64 precedent is only partially upstream: the one-line dev-support patch (PR #68) merged in 2023, but no aarch64 Linux **wheel** has ever been published - the PR that would add one (#99) has been open since 2026-01-09 and remains unmerged as of its last update (2026-06-11) despite an approving review from `potiuk`.

## 3. Upstream Support Tier

Atheris has **no formal platform-tier policy document** (no PEP-11 equivalent, no tier-1/tier-2/best-effort classification). The README states supported platforms in plain prose - "Linux (32- and 64-bit) and Mac OS X, Python versions 3.11-3.14" - with no RISC-V mention anywhere.

Evidence for the tier a platform actually occupies (CI, release-blocking, official binaries):

| Aspect | amd64/x86_64 | arm64/aarch64 | riscv64 |
|---|---|---|---|
| Dev-support branch in `find_libfuzzer.sh` | Yes (default) | Yes (PR #68, merged 2023-08-18) | No - falls to the `else`/error branch |
| GitHub Actions CI | Yes (`ubuntu-latest`, both jobs) | No | No |
| Linux wheel on PyPI | Yes (`manylinux2014_x86_64`/`manylinux_2_17_x86_64`, cp312/cp313/cp314) | No (never published, despite PR #68 landing in 2023) | No |
| macOS wheel on PyPI | Yes (Intel variants) | Yes (`macosx_13_0_arm64`, Apple Silicon) | N/A |
| Docker build image | Yes (`deployment/Dockerfile`, merged) | Only in unmerged PR #99 (`deployment/Dockerfile.aarch64`) | No |
| conda-forge (`atheris-feedstock`) | Yes (`linux_64`) | No (not even `linux_aarch64`, despite the 2023 dev-support merge) | No |
| Debian/Ubuntu package | No (atheris is not packaged at all, any architecture) | No | No |
| Arch Linux (official or AUR) | AUR only (`python-atheris`, `arch=('x86_64')` explicit) | No | No (archriscv.felixc.at: 0 hits across all 5 repos) |
| GitHub Release binary assets | None exist (releases list is empty; `/releases/latest` returns 404) | None | None |
| RISE wheel builder | N/A | N/A | No dedicated entry; request 302-redirects straight to plain upstream PyPI |

**Conclusion:** amd64 is the only platform with CI-verified, release-published binaries. aarch64 has source-level dev support only (no CI, no wheel, no Docker image on `master`). riscv64 has nothing at any layer.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Atheris's own C++ core has **zero architecture-specific code of any kind** - not for riscv64, not for x86_64, not even for aarch64. This was confirmed by reading every file under `src/native/` in full (`macros.h`, `atheris.cc`, `core.cc`, `tracer.cc`, `counters.cc`, `codetable_gen.cc`, `util.cc`, `timeout.cc`, `debug.cc`, `fuzzed_data_provider.cc` - 10 files, 3,865 lines total) and by GitHub code search for every plausible architecture guard (`__riscv`, `__x86_64__`, `__aarch64__`, `immintrin`, SIMD/NEON intrinsics, `__builtin`, `__asm__`): all returned 0 hits. There is no JIT, no hand-written SIMD, no crypto, no GC barriers, and no inline assembly anywhere in this codebase - it is pure pybind11/CPython-C-API glue plus POSIX-generic signal/mmap code, gated only by `PY_MINOR_VERSION` (Python version, not CPU architecture).

The only two files that reference a CPU architecture string at all are build tooling, not fuzzer logic:

1. `setup_utils/find_libfuzzer.sh` - a shell `uname -m` branch that guesses the filename of the prebuilt Clang `libclang_rt.fuzzer_no_main` static archive to link: branches exist for `x86_64`, `i386`/`i686`, and `aarch64`; anything else (including `riscv64`) falls to an `else` branch that prints `"Failed to identify platform machine"` and requires the user to set `$LIBFUZZER_LIB` manually.
2. `deployment/Dockerfile` - hardcoded `FROM quay.io/pypa/manylinux2014_x86_64`, x86_64-only by construction.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native C++ core (10 files, 3,865 lines) | Portable, no arch guards | Portable, no arch guards (identical to amd64) | Portable, no arch guards (identical to amd64/arm64) |
| libFuzzer static-archive linkage path | `libclang_rt.fuzzer_no_main-x86_64.a` (resolved by `find_libfuzzer.sh`) | `libclang_rt.fuzzer_no_main-aarch64.a` (resolved by `find_libfuzzer.sh`, added PR #68) | No path defined in atheris; LLVM compiler-rt's `AllSupportedArchDefs.cmake` lists `RISCV64` as supported upstream for the fuzzer archive, but atheris has no branch to find it |
| ASan/UBSan runtime bundling into wheel | Bundled (`asan_with_fuzzer.so` etc., x86_64) | Not bundled (no aarch64 wheel ever shipped) | Not bundled; upstream LLVM also has an open, unresolved riscv64 ASan/RVV SEGV bug ([llvm/llvm-project#164803](https://github.com/llvm/llvm-project/issues/164803)) |
| Shared-object TLS/atomics linking model for libFuzzer | Works | Broken for ARM32 specifically (`R_ARM_TLS_LE32` relocation error, missing `__atomic_load_8`, issue #44); aarch64-specific status of this exact linking mode not separately confirmed [NEEDS VERIFICATION] | Never attempted; risk class is unvalidated |

The real architecture-dependent complexity in this project lives entirely outside atheris's own code, in the externally-maintained LLVM libFuzzer/compiler-rt runtime it statically links against (see Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

Atheris has **no CMakeLists.txt anywhere in the repo** - it builds via Python `setuptools`/`setup.py` using `pybind11.Extension` for its six native modules. There is no `cmake/riscv64.cmake`, no `Dockerfile.riscv64`, no `BUILDING.md`/`INSTALL.md`, and no cross-compilation documentation of any kind.

**Toolchain requirement:** Clang is mandatory, not GCC (GCC does not ship libFuzzer). No exact minimum Clang version is pinned; instead `setup_utils/check_libfuzzer_version.sh` inspects the `.a` archive at build time via `objdump -t`, requiring the `LLVMFuzzerRunDriver` symbol (falling back to an in-place patch via `upgrade_libfuzzer.sh` if only `__sanitizer_cov_8bit_counters_init` is present, or failing outright otherwise). C++ standard is auto-negotiated in `setup.py`'s `cpp_flag()`: tries `-std=c++23`, then `-std=c++20`, then `-std=c++17`. Relevant env vars: `CLANG_BIN`, `LIBFUZZER_LIB`, `LIBFUZZER_VERSION`, `FORCE_MIN_VERSION`, `FORCE_VERSION`.

**README fallback** when the system Clang lacks a matching libFuzzer archive - build LLVM from source:
```bash
git clone https://github.com/llvm/llvm-project.git
cd llvm-project && mkdir build && cd build
cmake -DLLVM_ENABLE_PROJECTS='clang;compiler-rt' -G "Unix Makefiles" ../llvm
make -j 10
```
This is the only `cmake` invocation in the project's docs, and it builds LLVM itself, not atheris; it carries no architecture flags.

**`deployment/Dockerfile`** (merged, on `master`, x86_64 only): `FROM quay.io/pypa/manylinux2014_x86_64`; clones `llvm-project` and checks out pinned commit `0982db188b661d6744b06244fda64d43dd80206e`; builds `compiler-rt` via `cmake -DLLVM_ENABLE_PROJECTS="clang;compiler-rt"`; builds wheels for cp312/cp313/cp314; repairs with `auditwheel repair --plat manylinux2014_x86_64`.

**`deployment/Dockerfile.aarch64`** exists **only in the unmerged PR #99**, not on `master`: same LLVM commit pin, `FROM quay.io/pypa/manylinux2014_aarch64`, `auditwheel repair --plat manylinux2014_aarch64`. There is no `Dockerfile.riscv64` anywhere, merged or proposed.

**QEMU usage:** the only QEMU step in the project's history is in PR #99's (unmerged) `.github/workflows/linux-wheels.yaml` - `docker/setup-qemu-action@v3` with `platforms: arm64`, then `docker buildx build --platform linux/arm64`, with a 180-minute timeout because LLVM/compiler-rt must be built from source under emulation. No riscv64 equivalent exists even in this unmerged, forward-looking PR.

**Known build failures (the ARM32 precedent, issue #44, closed unresolved):**
1. Initial narrowing-conversion compile error in `src/native/timeout.cc:122` (`long long` to `__time_t`/`long`).
2. After building LLVM 16 from source: `undefined symbol: __atomic_load_8` at import time, worked around with `LD_PRELOAD=/usr/lib/arm-linux-gnueabihf/libatomic.so.1`.
3. A linker failure previously hit on the same architecture: `R_ARM_TLS_LE32 relocation not permitted in shared object` - root cause is that libFuzzer's TLS-based stack-tracking code uses local-exec TLS relocations, which are illegal once linked into a `.so` rather than a static executable. The maintainer's own diagnosis: *"those errors are being caused by libFuzzer being linked as a shared library in Atheris... I don't know what would be needed [for ARM]."*
4. Even after workarounds, a Pi Zero (armv6) hit `Illegal instruction` at runtime with no resolution offered. The issue was closed without a maintainer-authored fix.

Issue [#74](https://github.com/google/atheris/issues/74) (open since 2023-10-11) shows install failures persist even on nominally-supported platforms (Ubuntu, Alpine, Arch, Windows) - `find_libfuzzer.sh` missing-file errors and Windows `WinError 193` - unresolved after 8+ months, with the thread drifting entirely to Windows-support requests. A referenced open issue, #108, notes the maintainers have not even generalized `find_libfuzzer.sh` to use `clang -dumpmachine`/`-print-target-triple` instead of hardcoded `uname -m` branches - a prerequisite refactor for cleanly adding any new architecture, riscv64 included.

**riscv64-specific gap:** no build docs, no Dockerfile, no CI job. `pypa/manylinux#1743` (merged July 2025) added `manylinux_2_39_riscv64`/`musllinux_1_2_riscv64` images, resolving the industry-wide manylinux/riscv64 infrastructure blocker - but these images are labeled **ALPHA** by the manylinux project, and atheris has never attempted to use either.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native extension build from source | Works | Dev support merged (PR #68); ARM32 (different ISA) has unresolved TLS/atomic bugs (issue #44) | Untested/unknown - no `find_libfuzzer.sh` branch; would require manual `$LIBFUZZER_LIB` and risks the same class of linking failure that stalled ARM32 |
| Prebuilt PyPI wheel | Yes (cp312/cp313/cp314, `manylinux2014_x86_64`) | No (never published despite dev support since 2023) | No |
| Prebuilt macOS wheel | Yes (Intel) | Yes (`macosx_13_0_arm64`, Apple Silicon) | N/A |
| CI test coverage | Yes (`ubuntu-latest`, 3 Python versions) | No | No |
| Docker-based wheel build | Yes, merged | Only in unmerged PR #99 | No |
| Sanitizer stack (ASan/UBSan/MSan) bundled | Full | Not bundled (no aarch64 wheel exists) | Compiler-rt lists riscv64 as a supported target for fuzzer/ASan/UBSan, but MSan riscv64 support is itself an unmerged LLVM PR; atheris has never bundled or tested any of it on riscv64 |

**Functional gaps:** a riscv64 user cannot `pip install atheris` today - there is no wheel and no documented source-build path. They would need to manually build an LLVM/Clang/compiler-rt toolchain targeting riscv64 (not confirmed as reliably available prebuilt - [NEEDS VERIFICATION]), set `$LIBFUZZER_LIB` themselves, and patch `find_libfuzzer.sh` on their own initiative.

**Performance gaps:** Data not available - no riscv64-vs-amd64/arm64 fuzzing-throughput benchmark exists anywhere for atheris; confirmed via GitHub search (issues/PRs/code, all 0 hits for riscv64+performance queries) and WebSearch (no results). Sanity-check queries on the same repo for `arm64` (4 hits) and `performance` (4 hits) confirm the search methodology itself is functioning; only riscv64 queries return zero, which is a genuine absence of data rather than a tooling failure.

**Security hardening gaps:** directly relevant, since atheris's README explicitly recommends pairing with "Address Sanitizer or Undefined Behavior Sanitizer." Upstream LLVM has an open, unresolved issue ([llvm/llvm-project#164803](https://github.com/llvm/llvm-project/issues/164803)) reporting an ASan `CHECK failed`/SEGV on riscv64 when combined with RVV vector intrinsics. This means the sanitizer stack atheris depends on for its primary use case (finding memory-safety bugs) has a known, unresolved correctness issue upstream on riscv64 - independent of whether atheris itself is ever ported.

**NaN/floating-point semantics:** Data not available - no findings address floating-point/NaN handling for atheris on any architecture. Atheris's `fuzzed_data_provider.cc` operates on raw byte buffers rather than floating-point semantics directly, and no RISC-V floating-point issue surfaced in any dependency research either.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified independently in both the search and verify phases by reading the complete, only workflow file, `.github/workflows/builds.yaml`, in full:

```yaml
name: Builds
on: [push, pull_request]
jobs:
  ruff:
    runs-on: ubuntu-latest
    # single Python 3.12 lint/typecheck job (ruff + pytype)
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12", "3.13", "3.14"]
    needs: [ruff]
    # builds atheris and runs ./run_tests.sh
```

Both jobs run exclusively on `ubuntu-latest` (x86_64). The only matrix dimension is Python version, not architecture. There is no QEMU setup step, no cross-compilation flag, no self-hosted-runner reference, and no riscv/riscv64/RISC-V string anywhere in the file (confirmed via `grep -in "riscv"` against the full raw file content - exit code 1, zero matches).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes (`ruff`, `build` jobs, `ubuntu-latest`) | No | No |
| Test matrix dimension | Python version only (3.12/3.13/3.14) | N/A | N/A |
| QEMU/emulation step | N/A (native runner) | Only in unmerged PR #99's `linux-wheels.yaml` (`platforms: arm64`, 180-min timeout) | None, anywhere, merged or proposed |
| Self-hosted/RISE runner | No | No | No |
| Internal Google CI (Kokoro) | Config files exist (`.kokoro/continuous.cfg`, `presubmit.cfg`); architecture coverage not independently verifiable from outside Google [NEEDS VERIFICATION] | Not confirmed | Not confirmed |

No RISE-hosted runner, RISE CI integration, or RISE-funded build infrastructure of any kind touches this repository. The `riseproject-dev` GitHub org (27 repos, including `riscv-runner`, `riscv-runner-images`, `pytorch-ci`) has zero repos, issues, or code referencing atheris (confirmed via `search/repositories`, `search/code`, and `search/issues` scoped to `org:riseproject-dev`, all 0 results).

## 8. Distribution and Release Status

**No riscv64 binary exists in any channel checked.** Verified across the following, each independently re-checked in the verify phase:

- **GitHub Releases:** `gh api repos/google/atheris/releases` returns `[]` (empty); `/releases/latest` returns 404. The project has git tags only (3.0.0, 2.3.0, 2.2.2, 2.1.1, 2.0.12, and earlier) with zero attached release assets - there has never been a GitHub Release object with binaries to inspect for any architecture.
- **PyPI** (latest: 3.1.0): exactly 3 wheel files, all `manylinux2014_x86_64.manylinux_2_17_x86_64`, for cp312/cp313/cp314. Scanning all 181 file entries across every historical release (0.0.0 through 3.1.0) programmatically: the only platform tags ever published are `manylinux2014_x86_64`, `manylinux_2_17_x86_64`, `macosx_10_9_x86_64`, `macosx_11_0_x86_64`, `macosx_12_0_x86_64`, and `macosx_13_0_arm64` (Apple Silicon). No aarch64-Linux wheel and no riscv64 wheel has ever been published, at any point in the project's history.
- **RISE GitLab wheel builder** (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/atheris/`): returns a 302 redirect straight to `https://pypi.org/simple/atheris/` - meaning RISE's registry has no dedicated atheris entry and falls through to proxying plain upstream PyPI (which itself has no riscv64 wheel).
- **RISE riscv64 wheel index** (`pypi.riseproject.dev`, 81 packages) and the RISE `wheel_builder` GitLab Pages listing (74 packages): atheris is absent from both. Also absent from the actively-built package list (`ci_scripts/packages.txt`, 39 packages) and the deprecated/upstream-covered list (`ci_scripts/deprecated.txt`, 33 packages) in the `riseproject-dev/python-wheels` repo.
- **Ubuntu 24.04 "noble":** `packages.ubuntu.com` search for "atheris" returns "Sorry, your search gave no results" - not packaged for any architecture.
- **Debian:** `tracker.debian.org/pkg/atheris` returns HTTP 404 ("The requested resource was not found on this server"), confirmed via direct `curl`. No source package exists in any suite, any architecture.
- **Arch Linux (official):** `archlinux.org/packages/?q=atheris` returns "No matching packages found," any architecture, including x86_64.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): full directory listing of all 5 binary repos (`core`, `extra`, `community`, `unsupported`, `multilib`) grepped case-insensitively for "atheris" - zero matches across 4.3+ MB of combined listing data.
- **AUR (community-maintained, unofficial):** `python-atheris` declares `arch=('x86_64')` explicitly - no riscv64. `python-atheris-git` declares `arch=(any)` - this is an unrestricted source PKGBUILD (build-from-source only), not a working, tested, or prebuilt riscv64 binary; its existence is not evidence of a functioning riscv64 build.
- **conda-forge** (`atheris-feedstock`): CI matrix (`.ci_support/*.yaml`) covers `linux_64`, `osx_64`, `osx_arm64` only - notably not even `linux_aarch64`, despite the aarch64 dev-support patch merging in 2023. riscv64 is absent.

**What a riscv64 user must do today to get a working binary:** there is no official or community path. The only theoretical route is `pip3 install --no-binary atheris atheris`, which requires the user to independently obtain or build a riscv64 Clang/LLVM toolchain with a `libclang_rt.fuzzer_no_main-riscv64.a` compiler-rt archive, manually set `$LIBFUZZER_LIB` (since `find_libfuzzer.sh` has no riscv64 branch and will otherwise print `"Failed to identify platform machine"`), and accept the risk of hitting the same class of TLS-relocation/libatomic linking failures that stalled the ARM32 port (issue #44) - a risk that has never been evaluated for riscv64 by anyone.

## 9. Dependencies

Atheris has no `CMakeLists.txt`, `go.mod`, `Cargo.toml`, or `package.json` - it is a pure Python/C++ `setuptools` extension. Its dependency surface is narrow and toolchain-centric rather than numerics/crypto-centric.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/Blocking issues |
|---|---|---|---|---|---|
| pybind11 | C++/Python binding layer for all 6 native modules | Header-only; no arch-gated code found (GitHub code search for "riscv"/"RISCV" in `pybind/pybind11`: 0 hits). Should compile as-is with any riscv64 C++17 toolchain. | No dedicated riscv64 CI found; no riscv64-specific test issues found. | PyPI ships `pybind11-3.1.0-py3-none-any.whl` + sdist - a pure-Python/header package, architecture-irrelevant, always "available." | None found. |
| LLVM libFuzzer / compiler-rt (+ ASan/UBSan/MSan) | Core fuzzing engine, statically linked into `atheris.core_with_libfuzzer`; ASan/UBSan runtimes bundled into the wheel | compiler-rt's `AllSupportedArchDefs.cmake` lists `RISCV64` in `ALL_FUZZER_SUPPORTED_ARCH`, `ALL_ASAN_SUPPORTED_ARCH`, `ALL_UBSAN_SUPPORTED_ARCH` for Linux/Android/Fuchsia - riscv64 is a first-class upstream target. Debian sid's `libclang-rt-19-dev` for riscv64 confirms compiled artifacts exist (`libclang_rt.fuzzer_no_main-riscv64.a`, `libclang_rt.fuzzer-riscv64.a`, matching ASan `.a` files). | Fragile: open, unmerged [llvm/llvm-project#156912](https://github.com/llvm/llvm-project/pull/156912) (opened Sep 2025) marks 5 libFuzzer regression tests `UNSUPPORTED` on riscv64 after undiagnosed failures on a Milk-V Pioneer (LLVM 20.1.5) - maintainer asked for root-cause detail, author provided none, PR remains open. Separately, open [llvm/llvm-project#164803](https://github.com/llvm/llvm-project/issues/164803) (Oct 2025) reports an unresolved ASan `CHECK failed`/SEGV on riscv64 combined with RVV intrinsics. MSan riscv64 support is itself an open, unmerged PR ([#206674](https://github.com/llvm/llvm-project/pull/206674), opened ~Jun 2026). | Debian sid packages the riscv64 Clang/compiler-rt toolchain with the libFuzzer archive and ASan runtime. No official prebuilt LLVM release binary for riscv64 was independently verified [NEEDS VERIFICATION]. Atheris itself has never consumed this toolchain on riscv64 in any wheel or CI job. | [#156912](https://github.com/llvm/llvm-project/pull/156912) (stale, undiagnosed libFuzzer test failures), [#164803](https://github.com/llvm/llvm-project/issues/164803) (open ASan/RVV SEGV), [#206674](https://github.com/llvm/llvm-project/pull/206674) (MSan riscv64 unmerged) |
| Protocol Buffers *(contrib/libprotobuf_mutator add-on only, not a dependency of the core PyPI package)* | Serialization for the optional `atheris_libprotobuf_mutator` structure-aware fuzzing helper | Builds from source on riscv64 with a `-latomic` workaround. | No official riscv64 CI. | No riscv64 prebuilt `protoc` or PyPI native wheel; pure-Python fallback wheel only. | Maintainer quote: "riscv64 is not a platform supported by the protobuf project... RISC-V isn't on our roadmap." See `project-reports/protocol-buffers.md`. |
| Abseil-cpp *(transitive, via the same optional contrib add-on)* | C++ foundation library (strings/containers/atomics) underlying protobuf | Builds on riscv64 but requires `-latomic` on GCC 11-12 due to a sub-word atomics linking bug. | Two tests (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`) SEGFAULT on Debian riscv64 (open, no upstream response). | Source-only releases; Ubuntu/Debian riscv64 packages lag upstream by months. | [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) (atomics linker failure), [abseil/abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT). See `project-reports/abseil-cpp.md`. |
| CPython (host runtime, not a linked dependency but the platform atheris extends) | atheris ships as a CPython 3.11-3.14 C extension module | Builds and runs on riscv64. | Some 3.15-beta stack-unwinding test regressions on riscv64, unrelated to atheris. | No official riscv64 tier in PEP 11; Debian/Ubuntu provide riscv64 CPython builds. | See `project-reports/python.md`; nothing here specifically blocks atheris. |

**Key takeaway:** atheris's own riscv64 fate is gated almost entirely by dependencies, not its own code (Section 4 confirms zero arch-specific lines in atheris's C++ core). The critical risk is not "does it compile" - compiler-rt officially targets riscv64 for the fuzzer/ASan/UBSan runtimes, and pybind11 is architecture-agnostic - but "does it work correctly": the open, undiagnosed libFuzzer test failures ([#156912](https://github.com/llvm/llvm-project/pull/156912)) and the open ASan/RVV SEGV ([#164803](https://github.com/llvm/llvm-project/issues/164803)) mean the sanitizer/coverage-instrumentation stack atheris depends on has known, unresolved fragility on riscv64 upstream in LLVM itself - independent of any work atheris's own maintainers would do.

## 10. Ecosystem Status

Omitted. Atheris is a standalone fuzzing tool consumed directly by its users (and by OSS-Fuzz, which explicitly states it "supports fuzzing x86_64 and i386 builds" only, with no RISC-V) - it does not have its own dependent package/plugin/extension ecosystem that would separately need riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#44](https://github.com/google/atheris/issues/44) | Help with installation on ARM | Closed, unresolved | High (correctness/build) | ARM32-specific TLS relocation (`R_ARM_TLS_LE32`) and missing `__atomic_load_8` symbol; closed without a maintainer-authored fix. Most instructive precedent for riscv64 porting risk. |
| [#52](https://github.com/google/atheris/issues/52) | Generate wheels for all platforms via cibuildwheel | Open (since 2022-12-03) | Medium (distribution) | No RISC-V mention anywhere in body or 3 comments across ~4 years. |
| [#68](https://github.com/google/atheris/pull/68) | Added support for ARM64 linux | Merged (2023-08-18) | N/A | Trivial 2-line `find_libfuzzer.sh` patch; the mechanical template a riscv64 patch would follow. |
| [#74](https://github.com/google/atheris/issues/74) | Cannot Install Atheris using PIP on Ubuntu, Alpine, ArchLinux and Windows | Open (since 2023-10-11) | High (installability) | Unresolved 8+ months; drifted to Windows-support requests; demonstrates fragile installability even on nominally-supported platforms. |
| [#99](https://github.com/google/atheris/pull/99) | Add cross-platform wheel builds (macOS ARM64, Linux x86_64/aarch64) | Open (`mergeable_state: "blocked"`) since 2026-01-09 | High (distribution) | One approving review (`potiuk`); stalled 7+ months despite approval; riscv64 not in scope anywhere in the diff. |
| [#100](https://github.com/google/atheris/pull/100), [#107](https://github.com/google/atheris/pull/107) | macOS build fixes (follow-ups to #99) | Open | Low-Medium | Referenced in a comment on #99; not independently deep-read; scope is macOS only. |
| [#108](https://github.com/google/atheris/issues/108) (referenced) | Generalize `find_libfuzzer.sh` architecture detection | Open | Medium (prerequisite refactor) | Would replace hardcoded `uname -m` branches with `clang -dumpmachine`/`-print-target-triple`; a prerequisite for cleanly adding riscv64. Not independently deep-read in full; existence and topic referenced in synthesis findings only [NEEDS VERIFICATION]. |
| llvm/llvm-project [#156912](https://github.com/llvm/llvm-project/pull/156912) | 5 libFuzzer regression tests marked UNSUPPORTED on riscv64 | Open (since Sep 2025) | High (upstream dependency correctness) | Root cause never diagnosed; author did not respond to maintainer's request for detail. Not an atheris bug, but directly blocks atheris's core dependency on riscv64. |
| llvm/llvm-project [#164803](https://github.com/llvm/llvm-project/issues/164803) | ASan CHECK-failed/SEGV on riscv64 with RVV intrinsics | Open (since Oct 2025) | Critical (correctness, upstream dependency) | Directly relevant since atheris's primary use case is sanitizer-instrumented fuzzing. |

**Correctness bugs highlighted separately:** none exist within atheris's own codebase for any architecture (Section 4: zero arch-conditional code). The correctness risks that matter for riscv64 are entirely upstream, in LLVM's libFuzzer/ASan runtime (#156912, #164803) - these are pre-existing conditions a riscv64 port would inherit, not bugs atheris would introduce.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer or contributor has ever stated an objection to riscv64 support, because no one has ever proposed it. There is no rejected PR, no "won't fix," no closed-as-declined issue referencing RISC-V.

**Technical blockers:**
1. `setup_utils/find_libfuzzer.sh` has no riscv64 branch - a one-line, mechanically trivial gap by itself.
2. The real blocker is external: availability and correctness of `libclang_rt.fuzzer_no_main-riscv64.a` from upstream LLVM compiler-rt. Debian sid packages it, but two open upstream LLVM issues ([#156912](https://github.com/llvm/llvm-project/pull/156912), [#164803](https://github.com/llvm/llvm-project/issues/164803)) show the riscv64 libFuzzer/ASan runtime itself has unresolved correctness problems, independent of atheris.
3. Atheris's shared-object linking model for libFuzzer previously broke on ARM32 (TLS relocations, libatomic) in a way no maintainer had the expertise to fix (issue #44). Whether this specific failure mode recurs on riscv64 is unvalidated - riscv64 uses a different relocation/TLS model than ARM32, so the ARM32 failure does not directly predict a riscv64 outcome, but it establishes that atheris's maintainers have no track record of successfully debugging this class of issue themselves.
4. No CMake/Docker/CI scaffolding exists for any non-x86_64 Linux wheel today (aarch64 has source support since 2023 but zero published wheel and zero CI) - riscv64 would need this scaffolding built from scratch, not merely extended.

**Organizational blockers:**
1. Low maintainer bandwidth for platform expansion: PR #99 (multi-arch wheels, approved review) has sat unmerged for 7+ months; issue #52 (all-platforms wheels) has been open for approximately 4 years; issue #74 (basic installability) has been open 8+ months with no resolution.
2. No Google-initiated architecture port has occurred, ever - the only precedent (aarch64, PR #68) was authored externally (silabs.com) and merged same-day with no recorded review, suggesting low internal scrutiny/investment rather than a deliberate architecture strategy.
3. Google's RISE Premier membership has not translated into any RISC-V activity on this specific repo, confirmed by zero mentions of atheris across the RISE blog (31-32 posts, full sitemap checked), RISE members page, RISE GitHub org (27 repos, including the dedicated `python-wheels` and `pytorch-ci` build infrastructure), and RISE wheel indices (`pypi.riseproject.dev`, `wheel_builder` GitLab Pages).

**Acceptance probability:** the mechanical patch itself (a `find_libfuzzer.sh` branch) would very likely be accepted if submitted, following the same low-friction pattern as PR #68 (opened and merged within 24 hours, no formal review). However, getting a **published, tested riscv64 wheel** merged and released would face the same stall pattern as PR #99 (aarch64/macOS-ARM64 wheels, approved but unmerged for 7+ months) - i.e., moderate-to-low near-term probability without external (non-Google) ownership of the full CI/Docker/release pipeline, exactly as aarch64 dev support has for the past 3 years.

## 13. Investment Analysis

**RISE prior investment check:** RISE has not funded, mentioned, or built any atheris-related work. The RISE wheel-builder registry has no atheris entry (redirects straight to plain upstream PyPI); the RISE blog, GitHub org, and members page show zero atheris references. There is nothing already covered by RISE to exclude from sizing below - this would be greenfield work if undertaken.

### 13.1 Functional Enablement

- Add a `riscv64` branch to `setup_utils/find_libfuzzer.sh` (mechanical, ~1 line, following the PR #68 pattern exactly).
- Validate that a riscv64 `libclang_rt.fuzzer_no_main-riscv64.a` can be obtained (Debian sid ships one; no official upstream LLVM release binary was independently confirmed [NEEDS VERIFICATION]) and links correctly against atheris's shared-object extension modules, given the ARM32 precedent of TLS-relocation/libatomic failures in this exact linking mode (issue #44).
- Build and run atheris's existing test suite (`./run_tests.sh`) natively on riscv64 hardware to confirm no other runtime failures.
- Estimated effort: 2-4 person-weeks, assuming no repeat of the ARM32-class linking failure; add 2-4 more weeks of contingency if the shared-object TLS/atomics issue recurs and requires investigation, since no current maintainer has demonstrated the expertise to debug it (per the maintainer's own statement on issue #44).

### 13.2 Performance Optimization

Not applicable at this stage - atheris has no SIMD/vectorized code of its own to optimize (Section 4), and no riscv64 build exists yet to benchmark. Any performance work is scoped to the upstream LLVM libFuzzer/ASan runtime (outside this repo's control), specifically resolving the open riscv64 test failures ([#156912](https://github.com/llvm/llvm-project/pull/156912)) and the ASan/RVV SEGV ([#164803](https://github.com/llvm/llvm-project/issues/164803)) - both are upstream LLVM investment items, not atheris-repo items.

### 13.3 CI/CD Infrastructure

- Add a riscv64 job to `.github/workflows/builds.yaml` or a new workflow, requiring either riscv64-capable GitHub-hosted runners (not currently offered by GitHub as of this research) or QEMU-based emulation (following the PR #99 aarch64 pattern: `docker/setup-qemu-action`, `platforms: riscv64`, expect a similarly long build time given LLVM/compiler-rt must be built from source under emulation).
- Add a `deployment/Dockerfile.riscv64` analogous to the unmerged `Dockerfile.aarch64` in PR #99.
- Estimated effort: 2-3 person-weeks, contingent on PR #99 (the aarch64/x86_64 multi-arch wheel workflow) merging first, since riscv64 CI would most naturally extend that same `linux-wheels.yaml` structure rather than being built independently.

### 13.4 Ecosystem Enablement

- Get atheris onto the RISE wheel builder (`pypi.riseproject.dev`) once a working riscv64 build exists, so downstream consumers (e.g., projects using atheris for fuzzing-in-CI on riscv64) do not need to build from source.
- Coordinate with conda-forge's `atheris-feedstock` to add a `linux_riscv64` (or at minimum close the pre-existing `linux_aarch64` gap first, since that has been missing since 2023 despite merged dev support - a useful bellwether for how long conda-forge parity typically lags).
- Estimated effort: 1-2 person-weeks, mostly coordination/PR submission to third-party repos (RISE, conda-forge), contingent on 13.1/13.3 landing first.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | `find_libfuzzer.sh` riscv64 branch + libFuzzer archive validation + native test run | 2-4 (+2-4 contingency for linking issues) | External contributor (community pattern, per PR #68) or RISE-funded engineer | High |
| Performance | Resolve upstream LLVM riscv64 libFuzzer test failures and ASan/RVV SEGV | Not sizeable here - upstream LLVM scope, tracked at [#156912](https://github.com/llvm/llvm-project/pull/156912) and [#164803](https://github.com/llvm/llvm-project/issues/164803) | Upstream LLVM contributors (RISE-adjacent, not atheris-repo) | Critical (blocks correctness of any riscv64 atheris build) |
| CI/CD | riscv64 job in GitHub Actions (QEMU or native runner) + `Dockerfile.riscv64` | 2-3 (contingent on PR #99 merging first) | Community/RISE-funded engineer | Medium |
| Ecosystem | RISE wheel builder entry + conda-forge `linux_riscv64` coordination | 1-2 | Community/RISE-funded engineer | Low-Medium |

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/atheris repository](https://github.com/google/atheris)
- [google/atheris - .github/workflows/builds.yaml](https://github.com/google/atheris/blob/master/.github/workflows/builds.yaml)
- [google/atheris - setup_utils/find_libfuzzer.sh](https://github.com/google/atheris/blob/master/setup_utils/find_libfuzzer.sh)
- [google/atheris - deployment/Dockerfile](https://github.com/google/atheris/blob/master/deployment/Dockerfile)
- [Issue #44 - Help with installation on ARM](https://github.com/google/atheris/issues/44)
- [Issue #52 - Generate wheels for all platforms via cibuildwheel](https://github.com/google/atheris/issues/52)
- [Issue #74 - Cannot Install Atheris using PIP on Ubuntu, Alpine, ArchLinux and Windows](https://github.com/google/atheris/issues/74)
- [PR #68 - Added support for ARM64 linux](https://github.com/google/atheris/pull/68)
- [PR #99 - Add cross-platform wheel builds (macOS ARM64, Linux x86_64/aarch64)](https://github.com/google/atheris/pull/99)
- [PR #100](https://github.com/google/atheris/pull/100)
- [PR #107](https://github.com/google/atheris/pull/107)
- [PyPI - atheris project page](https://pypi.org/project/atheris/)
- [PyPI JSON API - atheris](https://pypi.org/pypi/atheris/json)
- [Debian package tracker - atheris (404, no package)](https://tracker.debian.org/pkg/atheris)
- [Ubuntu package search - atheris](https://packages.ubuntu.com/search?keywords=atheris&suite=noble&searchon=names&section=all)
- [Arch Linux package database](https://archlinux.org/packages/?q=atheris)
- [Arch Linux RISC-V port mirror](https://archriscv.felixc.at/)
- [conda-forge atheris-feedstock](https://github.com/conda-forge/atheris-feedstock)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project - Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE Project - Stack-Clash Security Checker for RISC-V](https://riseproject.dev/2024/07/17/stack-clash-security-checker-for-risc-v/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python Wheels (pypi.riseproject.dev)](https://pypi.riseproject.dev/)
- [RISE wheel_builder GitLab Pages](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [OSS-Fuzz documentation](https://google.github.io/oss-fuzz/)
- [llvm/llvm-project PR #156912 - libFuzzer tests UNSUPPORTED on riscv64](https://github.com/llvm/llvm-project/pull/156912)
- [llvm/llvm-project Issue #164803 - ASan CHECK-failed/SEGV on riscv64 with RVV](https://github.com/llvm/llvm-project/issues/164803)
- [llvm/llvm-project PR #206674 - MSan riscv64 support](https://github.com/llvm/llvm-project/pull/206674)
- [pypa/manylinux PR #1743 - manylinux_2_39_riscv64/musllinux_1_2_riscv64](https://github.com/pypa/manylinux/pull/1743)
- [abseil/abseil-cpp Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002)