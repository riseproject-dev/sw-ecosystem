---
title: Pyodide
parent: Project Reports
color: green
dependencies:
  - name: emscripten
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: NumPy
    relation: build-dependency
    criticality: optional
  - name: SciPy
    relation: build-dependency
    criticality: optional
  - name: OpenBLAS
    relation: build-dependency
    criticality: optional
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
  - name: libffi
    relation: build-dependency
    criticality: critical
  - name: xz
    relation: build-dependency
    criticality: optional
  - name: zstd
    relation: build-dependency
    criticality: optional
  - name: zlib
    relation: build-dependency
    criticality: optional
  - name: bzip2
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="pyodide" %}

# Pyodide

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Pyodide<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Pyodide is a Python distribution for the browser and Node.js: it compiles CPython and a large set of the scientific Python stack (NumPy, SciPy, pandas, and others) to WebAssembly (wasm32) using Emscripten, letting Python run inside a JavaScript engine. It is described by the project itself as "an independent and community-driven open-source project" ([docs/project/about.md](https://github.com/pyodide/pyodide/blob/main/docs/project/about.md)) - it is not a NumFOCUS, PSF, or Linux Foundation project, and carries no formal foundation.

**Fiscal structure.** Donations are passed through Open Source Collective (via OpenCollective), used only as a fiscal host, not a governing body; GitHub Sponsors is the larger funding channel (roughly $17k of about $27k raised total). License is Mozilla Public License 2.0 (MPL-2.0), confirmed in the repository's `LICENSE` file and `about.md`.

**Governance.** A three-tier, consensus-seeking model modeled on CPython's triage process ([docs/project/governance.md](https://github.com/pyodide/pyodide/blob/main/docs/project/governance.md)): Contributors (anyone), Community members (triage/label/close rights, nominated by any core developer), and Core developers (merge rights and API-change votes, nominated and voted in by roughly two-thirds majority of existing core developers). There is no BDFL, no board, and no foundation oversight.

**Corporate affiliation of maintainers.** Per the Institutional and Financial Support table in `about.md`, cross-checked against commit volume: Hood Chatham (817 commits, the top contributor) and Gyeongjae Choi (452 commits) are both currently Cloudflare-employed; Agriya Khetarpal (107 commits) is at Quansight Labs with a CZI research grant. Historical affiliations include Mozilla Corporation (project creator Michael Droettboom, 2018-2020) and Symerio/Nexedi (Roman Yurchak). Cloudflare is the de facto largest corporate backer of current active development, though this carries no formal governance seat. Additional OpenCollective sponsors: Posit, Hugging Face, Suborbital Software Systems, PyCafe, Eduwalks, Mausbrand. Infrastructure donors: Mozilla/CircleCI (CI), jsDelivr (CDN), ReadTheDocs (docs).

**Community culture on new ports.** Pyodide's own use of the word "platform" (`docs/development/abi.md`) refers exclusively to its PyEmscripten/wasm32 ABI versioning scheme (`pyemscripten_${YEAR}_${PATCH}_wasm32`, per PEP 783) - i.e., which Emscripten/CPython ABI a wheel was built against - not CPU hardware targets. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists, and there is no documented tier system for CPU architectures. The only live "new platform" effort referenced in the docs is **wasm64** (a 64-bit WebAssembly address-space extension), a memory-model change, not a CPU-architecture port.

## 2. Port History and Upstreaming Timeline

No riscv64 "port" of Pyodide exists, has ever been proposed, or is meaningfully applicable, because Pyodide's only compilation target is `wasm32-emscripten` (see Section 4). The concept of a per-host-CPU port does not exist in this codebase.

| Date | Event | Source |
|---|---|---|
| 2023-04-12 | PR #3331, "Package OpenBLAS and use OpenBLAS in scipy," merged by Loic Esteve. Introduces the only "riscv" string ever added to the repository: a `sed` patch in `packages/libopenblas/meta.yaml` that disables OpenBLAS's `RISCV64_GENERIC` Makefile branch because its `-march`/`-mabi` flags are unsupported by Emscripten. | [commit 7193109](https://github.com/pyodide/pyodide/commit/7193109f4dcf42474161d052fddc09c6321554af) |
| 2026-01-21 | PR #6066, "Fix openblas and scipy build," by Gyeongjae Choi. Most recent touch of the same file. | [commit 24e8e97](https://github.com/pyodide/pyodide/commit/24e8e97148317636ef0df1547a56599035843b46) |
| - | No riscv64 tracking issue, correctness/CI PR, or commit has ever been opened in `pyodide/pyodide`. Confirmed via independent GitHub issue search, PR search, commit search, and code search passes, all returning zero genuine hits (two lexical false positives - PR #5360 "Emscripten 3.1.64" and PR #3331 - do not mention RISC-V). | [pyodide/pyodide issues](https://github.com/pyodide/pyodide/issues), [pyodide/pyodide pulls](https://github.com/pyodide/pyodide/pulls) |

**Key contributors with organizational affiliation:** not applicable - no port effort exists. **Fully upstream:** not applicable - there is nothing to upstream; see Section 4 for why the concept does not apply.

## 3. Upstream Support Tier

Pyodide has no formal tier policy for CPU architectures of any kind (Section 1). The project's build system recognizes exactly one platform triplet: `PLATFORM_TRIPLET=wasm32-emscripten`, hardcoded in [`Makefile.envs`](https://github.com/pyodide/pyodide/blob/main/Makefile.envs) line 24. Web search independently confirms Pyodide "currently ignores the architecture setting, as it always builds for wasm32."

Because the shipped artifact is WebAssembly bytecode rather than compiled machine code for a specific CPU ISA, the amd64/arm64/riscv64 distinction that applies to native software does not apply to Pyodide's own output:

| Architecture | Native per-CPU build target | CI | Release artifact |
|---|---|---|---|
| amd64 (host, CI) | No - CI runs on `ubuntu-latest` x86 runners only to produce the universal wasm32 output | Yes (build host only) | N/A - artifact is wasm32, not amd64-native |
| arm64 | No native arm64-specific build path found | Not observed as a distinct CI host | N/A - artifact is wasm32, not arm64-native |
| riscv64 | No native riscv64-specific build path found; zero riscv64 CI (Section 7) | None | N/A - artifact is wasm32, not riscv64-native |

The same `.wasm` binaries Pyodide publishes run unmodified on any host CPU (x86, ARM, or RISC-V) through any WASM-capable runtime (browser, Node.js, Deno, wasmtime, etc.), so all three architectures receive equivalent, full support by construction rather than through architecture-specific engineering.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct source inspection (local clone, HEAD `afddd77f156cc47b212a66799358d07d312d7dc2`) confirms Pyodide has no JIT backend, SIMD dispatch layer, crypto acceleration layer, or hand-written assembly of its own that varies by host CPU architecture:

- `mcp__github__search_code` for `"#ifdef __riscv" repo:pyodide/pyodide` returned 0 results.
- `mcp__github__search_code` for `"__x86_64__" OR "__aarch64__" repo:pyodide/pyodide` returned 0 results.
- A full-tree grep for `x86_64`/`aarch64` found only 4 files, none of them architecture-dispatch code: `src/py/pyodide/_package_loader.py` (a comment about stripping a CPython ABI tag string like `cpython-39-x86_64-linux-gnu` from a filename) and its corresponding test fixtures in `src/tests/test_package_loading.py`.
- No `arch/riscv/` directory, no `.S` assembly files, no RVV intrinsics (`vfloat32m1_t` search returned 0 hits), and no JIT or SIMD dispatch code for any host architecture exist anywhere in the repository.

The only two "riscv" string matches in the entire repository, both non-architecture-code:

1. [`packages/libopenblas/meta.yaml`](https://github.com/pyodide/pyodide/blob/main/packages/libopenblas/meta.yaml) - a build recipe that neutralizes (does not implement) OpenBLAS's `RISCV64_GENERIC` Makefile branch via `sed`, then feeds `TARGET=RISCV64_GENERIC` to OpenBLAS purely as an inert, SIMD-free generic-target label while the actual compilation happens through `emcc` to wasm32 (`BINARY=32`). This is dead-code suppression to prevent a build failure, not RISC-V-targeting logic.
2. [`src/js/package-lock.json`](https://github.com/pyodide/pyodide/blob/main/src/js/package-lock.json) - an autogenerated `@esbuild/linux-riscv64` npm optional-platform dependency entry for the JS dev-tooling build chain, unrelated to Pyodide's own output.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT/codegen backend | Missing (as a Pyodide-native-arch feature; Pyodide delegates all codegen to Emscripten/LLVM targeting wasm32) | Missing | Missing |
| SIMD dispatch | Missing (no NPYV/ISA-specific dispatch inside Pyodide itself; wasm32 SIMD, where used, is architecture-neutral) | Missing | Missing |
| Crypto/hardware acceleration | Missing | Missing | Missing |
| Hand-written assembly | Missing | Missing | Missing |

**File-count comparison: 0/0/0** across amd64, arm64, and riscv64. Pyodide has exactly one compilation target (wasm32 via Emscripten) and does not hand-tune per-host-CPU code paths for any architecture, so there is no gap specific to riscv64 - the "gap" (absence of native per-arch code) is identical and total across all three reference architectures, by design.

## 5. Build System, Cross-Compilation, and Toolchain

Pyodide's build orchestration is pure `make` (`Makefile`, `Makefile.envs`) driving `emmake`/`emconfigure`/`emcc` (Emscripten's compiler wrappers) - not CMake. Verified directly:

- **No `CMakeLists.txt` exists anywhere in the repository** (root or subdirectories).
- **No toolchain files** exist (no `cmake/riscv64.cmake` or equivalent paths).
- **No QEMU usage anywhere** in the repository (`grep -ril qemu .` returned zero hits).
- **No riscv64 Dockerfile.** `mcp__github__search_code` for `riscv64 repo:pyodide/pyodide filename:Dockerfile` returned 0 results. The repository's single [`Dockerfile`](https://github.com/pyodide/pyodide/blob/main/Dockerfile) is explicitly x86_64-only - it hardcodes a Docker CLI download from `https://download.docker.com/linux/static/stable/x86_64/`, and is documented in `docs/development/building-from-sources.md` as the "Debian-based x86_64 Docker image."

**Toolchain requirements:** Emscripten/emsdk (pinned `5.0.3`, targeting `wasm32-emscripten` exclusively), CPython `3.14.2` (both as the compiled interpreter and for running build scripts), and CMake (used only to build Emscripten itself, not Pyodide's own build, which has no CMakeLists.txt).

**Known build failures:** none are riscv64-specific, because no riscv64 build target exists to fail. The one adjacent note is the `libopenblas/meta.yaml` comment describing an Emscripten-version-related build failure (`-march`/`-mabi` flags unsupported by Emscripten >4.X) that the `sed` patch was written to avoid - an Emscripten/OpenBLAS interaction, not a riscv64-host build issue.

**Host-build gap (informational, not a color-deciding fact):** Emscripten's prebuilt SDK binaries are built only for x86_64 and arm64 hosts (debian/stretch and debian/bullseye sysroots); there is no riscv64 host binary in the prebuilt SDK, and no upstream issue tracks building Emscripten from source on a riscv64 development machine. This affects only developers who want to build Pyodide **from** a riscv64 host - it has no bearing on whether Pyodide's shipped wasm32 artifacts run on a riscv64 host, which they do by construction (Section 3).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** none identified. The wasm32 binary Pyodide produces and ships is bit-for-bit identical regardless of host CPU architecture; there is no feature matrix to construct because there is no per-architecture feature variance in the shipped artifact.

**Performance gaps:** no Pyodide-specific riscv64 benchmark data exists anywhere searched (GitHub, general web, riseproject.dev). Any performance differential a riscv64 host would show is a function of that host's WASM engine (e.g., V8, wasmtime) rather than of Pyodide, which contains no host-CPU-specific code (Section 4). The most relevant adjacent data point found is a RISE blog post, ["A Glimpse Into V8 Development for RISC-V"](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/) (2025-12-09), describing V8's own JetStream WASM benchmark work on RISC-V (RVV fixes for SIMD-heavy tests, `Zba` pointer-decompression optimization) - this concerns the WASM engine substrate Pyodide runs on, not Pyodide itself, and contains no quantitative RISC-V-vs-other-architecture numbers.

**Security hardening gaps:** none Pyodide-specific found. (Note: Pyodide's own dependency chain includes an OpenSSL version, `libopenssl 1.1.1w`, that predates most upstream RISC-V vector-crypto work - see Section 9 - but this is a general legacy-version characteristic of that pinned dependency, not a riscv64-specific regression introduced by Pyodide.)

**NaN/floating-point semantics issues:** none Pyodide-specific found in any search performed (GitHub issue search across all query variants, web search).

## 7. CI/CD Infrastructure

Direct inspection of every CI configuration file in the repository at HEAD `afddd77f156cc47b212a66799358d07d312d7dc2` confirms **zero riscv64 CI exists**:

- `.github/workflows/main.yml`, `docker_image.yml`, `deploy_release.yml`, `pages.yml`, `update_cross_build_releases.yml` - grepped case-insensitively for `riscv`/`riscv64`/`linux/riscv64`/`RISCV`: zero matches in any file.
- [`.circleci/config.yml`](https://github.com/pyodide/pyodide/blob/main/.circleci/config.yml) - present, checked, no riscv references.
- `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` - none exist in the repository.

All five GitHub Actions workflows and the CircleCI config run on standard `ubuntu-latest`/x86 GitHub-hosted runners to produce the single universal wasm32 output. No workflow defines a riscv64 runner, a QEMU cross-arch emulation step, or a `linux/riscv64` platform target. No use of RISE RISC-V runners (`riseproject-dev` references, RISE runner labels) was found anywhere in the CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build (host) | Yes - all 5 GH Actions workflows + CircleCI run on x86 hosted runners | No dedicated arm64 host CI job found | No |
| CI test | Yes (on x86 hosts, producing the wasm32 artifact under test) | No dedicated arm64 host CI job found | No |
| CI release (publish) | Yes - releases published from x86 CI runs | Not applicable as a separate release channel (single universal artifact) | No |
| RISE runner usage | No | No | No |

This is consistent with the project's single-target architecture: since the output artifact (wasm32) does not vary by host CPU, there is no engineering reason for Pyodide to maintain separate arm64 or riscv64 CI lanes, and it maintains none.

## 8. Distribution and Release Status

No riscv64-specific binary exists, and none is architecturally needed - the same wasm32 artifacts serve every host CPU architecture.

**GitHub Releases** ([pyodide/pyodide/releases](https://github.com/pyodide/pyodide/releases)): the `314.0.6` release (latest of ten recent tags checked: `314.0.6`, `314.0.5`, `315.0.0a2`, `314.0.4`, `315.0.0a1`, `314.0.3`, `314.0.2`, `314.0.1`, `314.0.0`, `314.0.0a2`) ships 9 assets - `pyodide-314.0.6.tar.bz2`, `pyodide-core-314.0.6.tar.bz2`, `static-libraries-314.0.6.tar.bz2`, `xbuildenv-314.0.6.tar.bz2`, `xbuildenv-314.0.6.tar.gz`, `xbuildenv-debug-314.0.6.tar.bz2`, `xbuildenv-debug-314.0.6.tar.gz`, and source archives (zip/tar.gz). None of these 9 assets, or any asset checked across the recent-tags list, contains "riscv64" or "riscv" in its filename - and none is architecture-specific in the amd64/arm64 sense either, confirming the single-universal-artifact model.

**PyPI** ([pypi.org/pypi/pyodide/json](https://pypi.org/pypi/pyodide/json)): the `pyodide` package on PyPI is an old placeholder release (`0.0.2`). The [PyPI simple index](https://pypi.org/simple/pyodide/) lists `pyodide-0.0.2.tar.gz`, `pyodide-0.19.0a1-py3-none-any.whl`, and `pyodide-0.19.0a1.tar.gz` - all `py3-none-any` (universal) or sdist, no compiled/architecture-specific wheels of any kind on any architecture.

**RISE wheel builder** ([GitLab package registry](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/pyodide/)): no `pyodide` package is registered in this project-specific registry; the endpoint 302-redirects to the PyPI simple index (GitLab's fallback behavior for a non-existent package), confirming no RISE involvement in building Pyodide.

**Ubuntu 26.04 (Resolute)** ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Pyodide&suite=resolute&searchon=names&section=all)): result is "Sorry, your search gave no results" - no `pyodide` package exists in Ubuntu 26.04 at all, on any architecture.

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): Pyodide is not listed [NEEDS VERIFICATION - page fetch is client-side filtered and may not reflect a live browser search identically].

**What a user must do to get a working artifact on riscv64:** install Pyodide via `pip` or download the same GitHub release tarballs/`xbuildenv` bundles used on any other host CPU, then run the resulting wasm32 bundle inside any WASM-capable runtime (browser, Node.js, Deno, wasmtime, etc.) present on that riscv64 host. No riscv64-specific package, patch, or build step is required.

## 9. Dependencies

Pyodide has no single manifest file; its build is orchestrated by `Makefile.envs`, `cpython/Makefile`, `emsdk/Makefile`, and per-package `packages/*/meta.yaml` recipes. Critically, none of these dependencies need to run **on** riscv64 as a compilation **target** for Pyodide's own output, since Pyodide always emits wasm32. Their riscv64 status matters only for (a) building Pyodide **from** a riscv64 development host, or (b) their own independent use outside Pyodide.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Emscripten/emsdk (pinned `5.0.3`) | Core LLVM/Clang+Binaryen toolchain, compiles CPython+packages to wasm32 | Undocumented on riscv64 hosts; no prebuilt SDK for riscv64 hosts (only x86_64, arm64) | Not tested by Pyodide CI on riscv64 hosts | No riscv64 emsdk release artifact | Not tracked as its own project report in this repository - flagged as a research gap given it is Pyodide's most load-bearing dependency |
| LLVM/Clang (bundled in emsdk) | Codegen backend inside Emscripten | See `project-reports/llvm.md` - riscv64 as an LLVM target is complete but not in LLVM's required pre-merge CI gate | Partial (QEMU, libc-scoped) | No upstream riscv64 release binaries; distro-packaged only | Irrelevant to Pyodide's wasm32 output except as a riscv64-host-build question |
| CPython (`3.14.2`) | Interpreter compiled to wasm32 | Builds/runs natively on riscv64 as its own project | See `project-reports/python.md` - stack-unwinding test failures in 3.15 betas (issues #150919, #151040); CPython riscv64 buildbot down 3+ months | riscv64 untiered in PEP 11 (Tier 0/unsupported); distro builds only | No copy-and-patch JIT on riscv64; mimalloc (default allocator since 3.13) has open SV39-MMU VA-detection issues on riscv64 |
| NumPy (`2.4.6`) | Numerics package compiled into the Pyodide distribution | See `project-reports/numpy.md` - Tier 3 in NEP 57; builds on RISE self-hosted `ubuntu-24.04-riscv` runners | QEMU CI non-blocking | No official PyPI riscv64 wheels yet (blocked on OpenBLAS correctness + `actions/setup-python` gap) | No RVV backend in NPYV SIMD layer for the standalone NumPy project (falls to scalar C) |
| SciPy (`1.18.0`) | Numerics package | No dedicated project report; tracks NumPy/OpenBLAS transitively | - | No dedicated riscv64 wheel-status data found | Inherits NumPy/OpenBLAS gaps |
| OpenBLAS (`libopenblas 0.3.28`) | Backs `numpy.linalg`/SciPy | See `project-reports/openblas.md` - 221 RVV-intrinsic kernel files, all riscv64 targets build (for the standalone OpenBLAS project) | QEMU only, LAPACK tests disabled in CI | Source-only | Critical, currently blocking NumPy PyPI wheels: DGEMM correctness regression on ZVL256B/RVV hardware (identifier: OpenMathLib/OpenBLAS #5811, fix merged but unreleased); TRSM has no RVV kernel for ZVL128B/ZVL256B |
| OpenSSL (`libopenssl 1.1.1w`) | Crypto | See `project-reports/openssl.md` - extensive Zvk/Zkn support for the standalone project | QEMU-only CI, 13 extension matrix configs | Source-only; distro packages carry newer versions | Pyodide pins the legacy 1.1.1w line, which predates most upstream RISC-V vector-crypto work; AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned in the general OpenSSL project |
| libffi (git-pinned) | CPython's `ctypes` FFI | See `project-reports/libffi.md` - full riscv64 port, in CI matrix | QEMU CI, full DejaGNU suite | v3.6.0 (2026-06-20) first correct-float release | Open bug: small-integer return values get garbage upper bits (issue #466); current distro riscv64 packages predate the 3.6.0 fix |
| xz/liblzma (`5.2.2`) | CPython build, `_lzma` module | See `project-reports/xz.md` - full BCJ filter for riscv64 | No upstream riscv64 CI at all | Distro packages | No functional gaps; no hardware CRC acceleration path (Zbc unimplemented) |
| zstd (`1.5.7`) | CPython `_zstd` module (3.14+) | See `project-reports/zstd.md` - RVV intrinsics partially merged | QEMU, PR-triggered only | Source-only upstream; distro packages current | 7 open riscv64 performance PRs stalled 2-6 months on maintainer non-response |
| zlib (Emscripten `USE_ZLIB` port) | Linked into CPython's wasm32 build | See `project-reports/zlib.md` - zero RISC-V source code merged, pure-C scalar only | OpenBSD/riscv64 only via QEMU | Distro packages, source-only upstream | RVV Adler32 PR #1099 unmerged 8+ months |
| bzip2 (Emscripten `USE_BZIP2` port) | Compression | See `project-reports/bzip2.md` - pure portable C89, no architecture-specific code on any platform | No upstream CI for any non-x86 arch | Distro packages only | None riscv64-specific |

**Bottom line for this section:** the wide variance among these dependencies (OpenBLAS/OpenSSL/NumPy have active RVV work with known correctness bugs; zlib/xz/bzip2 have little riscv64-specific engineering investment) is relevant only to a hypothetical riscv64-host build of Pyodide, not to whether Pyodide's own shipped wasm32 artifacts function on a riscv64 target - they do, unconditionally, because the output is not host-CPU-specific.

## 11. Known Bugs and Active Issues

No open or closed issue, pull request, or commit in `pyodide/pyodide` references RISC-V, riscv64, or RISC-V-specific correctness/performance behavior. This was confirmed across multiple independent search passes:

- `mcp__github__search_issues`: `riscv64 performance repo:pyodide/pyodide` (1 hit, unrelated - issue #639, an "Unknown CPU" build error on an x86 Xeon box from 2020), `riscv64 bug repo:pyodide/pyodide` (0), `riscv nan floating repo:pyodide/pyodide` (0), `risc-v repo:pyodide/pyodide` (0), `riscv repo:pyodide/pyodide` (0).
- `mcp__github__search_pull_requests`: `riscv repo:pyodide/pyodide` (0); `riscv64 repo:pyodide/pyodide` (2 hits, both lexical false positives unrelated to RISC-V: PR #5360 "Emscripten 3.1.64," PR #3331 "Package OpenBLAS and use OpenBLAS in scipy").
- `mcp__github__search_commits`: `riscv repo:pyodide/pyodide`, `repo:pyodide/pyodide riscv64` - no genuine riscv64-related commits.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | *No riscv64-specific issues or PRs exist in pyodide/pyodide* | N/A | N/A | Data not available: exhaustive search across issues, PRs, commits, and code returned zero genuine matches |

For context (not Pyodide's own issue tracker), adjacent dependency-level correctness issues that could indirectly affect a riscv64-host build of Pyodide are tracked in their own project reports: OpenBLAS DGEMM correctness regression (OpenMathLib/OpenBLAS issue #5811), OpenSSL AES non-constant-time fallback on hardware lacking Zkn/Zvkned, libffi small-integer return-value bug (issue #466), and CPython mimalloc SV39-MMU VA-detection issues - see `project-reports/openblas.md`, `project-reports/openssl.md`, `project-reports/libffi.md`, and `project-reports/mimalloc.md` respectively.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No riscv64 support request has ever been filed against `pyodide/pyodide` (Section 2, Section 11), so no objection to one exists either.

**Technical blockers:** none apply to Pyodide's shipped artifacts, since wasm32 output is host-CPU-agnostic by construction (Section 3). The only identified open technical question is host-build support - whether Pyodide's own build toolchain (Emscripten/emsdk) can be invoked from a riscv64 development machine - which is undocumented and unverified upstream (Section 5), not a blocker so much as an unexplored path.

**Organizational blockers:** none identified. Pyodide is not a RISE (RISC-V Software Ecosystem) member and has no funded RISE project (RPxxx series), working-group involvement, or RISE runner CI usage - confirmed by scanning all 34 RISE blog posts, the `riseproject-dev` GitHub organization (25 repos, no Pyodide-named repo, no substantive code-search hits), and the RISE wheel_builder package list (~65 packages, Pyodide not among them). See [riseproject.dev/members](https://riseproject.dev/members/) for the RISE membership roster, which does not include Pyodide.

**Acceptance probability:** not meaningfully applicable in the traditional "port acceptance" sense, since there is no native per-architecture port to accept or reject. If framed instead as "would Pyodide accept work verifying/documenting a riscv64-host build path for its own toolchain," no evidence exists either way - no such request has been made to the project.

## 13. Readiness Assessment

- **Color:** green (no sub-case; green carries no `color_case`)
- **Release provider:** upstream
- **Optimization gap:** N/A - Pyodide is not an optimization-purpose project (its value proposition is running Python in a browser/WASM engine, not outperforming a reference implementation via architecture-specific tuning); the Step 2 modifier does not apply.
- **Justification:** Pyodide compiles CPython and the scientific Python stack exclusively to wasm32 via Emscripten - the sole build target, hardcoded as `PLATFORM_TRIPLET=wasm32-emscripten` in [`Makefile.envs`](https://github.com/pyodide/pyodide/blob/main/Makefile.envs) - with no per-host-CPU compiled code path anywhere in the codebase (Section 4). WebAssembly bytecode is host-CPU-architecture-agnostic by design, analogous to a platform-neutral JVM jar: the same `.wasm` build artifacts Pyodide publishes on its own [GitHub releases](https://github.com/pyodide/pyodide/releases) (e.g., `314.0.6`) run unmodified on x86_64, arm64, or riscv64 hosts through any WASM-capable runtime, requiring zero riscv64-specific CI, patches, or binaries. This satisfies the Step 0 architecture-independent shortcut in the project-color-coding model (comparable to a pure-Python wheel or noarch package), and the release artifact is published directly by upstream, satisfying the `release_provider: upstream` requirement for green.
- **Pending work that could change the grade:** none identified. There is no open PR, no RISE involvement, and no documented host-build blocker. The one soft spot worth tracking is that Emscripten's own prebuilt SDK ships no riscv64 host binaries, so building Pyodide **from** a riscv64 development machine is unverified and undocumented upstream (Section 5) - this does not affect the color, since it concerns the build host, not the shipped artifact's compatibility, but a future upstream statement or issue confirming or denying riscv64-host buildability would be worth monitoring.

## 14. Investment Analysis

RISE has not funded or engaged with Pyodide in any capacity (Section 12). Because Pyodide is architecture-independent by construction, there is essentially no functional-enablement gap to close - the project already works on riscv64 targets today, with no engineering investment required.

### 14.1 Functional Enablement

No work required. Pyodide's wasm32 artifacts already run on riscv64 hosts through any WASM-capable runtime, with no riscv64-specific build, patch, or packaging step needed.

### 14.2 Performance Optimization

Not applicable to Pyodide itself: Pyodide contains no host-CPU-specific code path to optimize (Section 4). Any performance characteristic observed on a riscv64 host is a function of that host's WASM engine (V8, wasmtime, etc.), which is out of Pyodide's scope and would be a separate investment area under those projects' own reports, not this one.

### 14.3 CI/CD Infrastructure

Optional, low-priority: add a riscv64-host CI job (potentially using RISE RISC-V Runners) that invokes Pyodide's existing build toolchain from a riscv64 machine, to close the one identified unknown - whether Emscripten/emsdk builds and runs correctly from a riscv64 development host (Section 5). This would not change functional availability of Pyodide's output on riscv64 targets, which is already unconditional; it would only validate the developer-experience path of building Pyodide on riscv64 hardware.

### 14.4 Ecosystem Enablement

Not applicable - Pyodide's compiled-package ecosystem (the `packages/*/meta.yaml` recipes) targets wasm32 uniformly regardless of host architecture, so there is no separate riscv64 enablement task for that ecosystem (see the Section 10 omission rule for this report).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - riscv64 targets already fully supported via wasm32 artifacts | 0 | N/A | N/A |
| CI/CD | Add an optional riscv64-host CI job validating Emscripten/emsdk builds Pyodide correctly from a riscv64 development machine | 1-2 | Pyodide core developers / RISE (if engaged) | Low |
| Performance | Not Pyodide's scope; track via the WASM engine's own riscv64 optimization work (e.g., V8) | N/A | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [Pyodide repository](https://github.com/pyodide/pyodide)
- [Pyodide homepage](https://pyodide.org/)
- [Pyodide GitHub Releases](https://github.com/pyodide/pyodide/releases)
- [Pyodide issues](https://github.com/pyodide/pyodide/issues)
- [Pyodide pull requests](https://github.com/pyodide/pyodide/pulls)
- [Makefile.envs](https://github.com/pyodide/pyodide/blob/main/Makefile.envs)
- [packages/libopenblas/meta.yaml](https://github.com/pyodide/pyodide/blob/main/packages/libopenblas/meta.yaml)
- [src/js/package-lock.json](https://github.com/pyodide/pyodide/blob/main/src/js/package-lock.json)
- [Dockerfile](https://github.com/pyodide/pyodide/blob/main/Dockerfile)
- [.circleci/config.yml](https://github.com/pyodide/pyodide/blob/main/.circleci/config.yml)
- [docs/project/governance.md](https://github.com/pyodide/pyodide/blob/main/docs/project/governance.md)
- [docs/project/about.md](https://github.com/pyodide/pyodide/blob/main/docs/project/about.md)
- [commit 7193109 - "Package OpenBLAS and use OpenBLAS in scipy" (PR #3331)](https://github.com/pyodide/pyodide/commit/7193109f4dcf42474161d052fddc09c6321554af)
- [commit 24e8e97 - "Fix openblas and scipy build" (PR #6066)](https://github.com/pyodide/pyodide/commit/24e8e97148317636ef0df1547a56599035843b46)
- [PyPI JSON API: pyodide](https://pypi.org/pypi/pyodide/json)
- [PyPI simple index: pyodide](https://pypi.org/simple/pyodide/)
- [RISE Python wheel builder GitLab registry: pyodide](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/pyodide/)
- [Ubuntu 26.04 (Resolute) package search: Pyodide](https://packages.ubuntu.com/search?keywords=Pyodide&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE members](https://riseproject.dev/members/)
- ["Easy Installation of Binary Python Packages on riscv64 Devices," riseproject.dev, 2025-05-14](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- ["Python Now Officially Supports RISC-V," riseproject.dev, 2026-08-24](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v)
- ["A Glimpse Into V8 Development for RISC-V," riseproject.dev, 2025-12-09](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE wheel_builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
