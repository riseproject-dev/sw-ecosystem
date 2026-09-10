---
title: Wazero
parent: Project Reports
color: blue
---

# Wazero

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wazero<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wazero ([tetratelabs/wazero](https://github.com/tetratelabs/wazero), [wazero.io](https://wazero.io/)) is a zero-dependency WebAssembly runtime written in Go. It ships two execution engines: a portable bytecode **Interpreter** with no architecture-specific code, and **wazevo**, an optimizing ahead-of-time/JIT-style native code generator with hand-written backends per CPU architecture. The project deliberately carries no CGO dependency; `go.mod` requires exactly one external module, `golang.org/x/sys`.

**Governance:** wazero has no independent foundation and is not a CNCF, Linux Foundation, or Bytecode Alliance project. Per the official site, "a team of full-time staff at Tetrate steward the wazero" project - single-vendor corporate stewardship, not a multi-stakeholder model. Access control runs through a single GitHub team (`.github/CODEOWNERS`: `* @wazero/maintainers`). License is Apache 2.0. Started as a hobby project by Takeshi Yoneda in mid-2020; "sponsored by Tetrate as a top-level project" in late 2021, per the project's own community history page.

**Corporate contributors:** the two most prolific historical committers, Takeshi Yoneda (mathetake, 579+377 commits under a `@tetrate.io` address) and Adrian Cole (507 commits, also originally `@tetrate.io`), now list **Netflix** as their employer on their current GitHub profiles [NEEDS VERIFICATION - inferred from GitHub profile "company" field, not an official transition announcement]. Other contributors include Edoardo Vacchi (Red Hat) and independents (Nuno Cruces, Achille Roussel). This means the two engineers who authored most of wazero's core, including its riscv64 CI work, are no longer at the nominal steward (Tetrate), even though Tetrate continues to hold the trademark and describe itself as the steward.

**Community culture on new ports:** `RATIONALE.md` states an explicit "no external forks/plugins, everything upstream" philosophy, citing the difficulty of maintaining quality control over partial or external architecture contributions - "implementing a compiler correctly requires expertise in Wasm, Golang and assembly," and external contributions "introduce variables which are constants in the central one." This directly explains why riscv64 landed easily via the Interpreter (zero platform-specific code, trivially testable) while no riscv64 wazevo backend has ever been proposed (it would require dedicated RISC-V assembly-emission code held to the project's full-backend bar).

Sources: [wazero.io community page](https://wazero.io/community/), local clone `RATIONALE.md` and `site/content/community/history.md`, `.github/CODEOWNERS`.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-02-04 | [PR #200](https://github.com/tetratelabs/wazero/pull/200) merged (commit `fb79f272`) - generalizes the existing arm64 QEMU CI job into a matrix covering arm64 and riscv64. Founding commit of riscv64 support. Author (Takeshi Yoneda): "whew all tests pass on RISCV!" | [PR #200](https://github.com/tetratelabs/wazero/pull/200) |
| 2022-02-15 | [Issue #249](https://github.com/tetratelabs/wazero/issues/249) opened - interpreter `copysign` for f32 not spec-compatible on riscv64, found via the newly-added CI job (credited to contributor @r8d8) | [Issue #249](https://github.com/tetratelabs/wazero/issues/249) |
| 2022-02-16 | [PR #248](https://github.com/tetratelabs/wazero/pull/248) merged - temporarily comments out the riscv64 CI matrix entry pending the #249 fix (stopgap, hours-long outage) | [PR #248](https://github.com/tetratelabs/wazero/pull/248) |
| 2022-02-16 | [PR #250](https://github.com/tetratelabs/wazero/pull/250) merged (commit `8f27439a`) - fixes the copysign bug by replacing a float64 round-trip through Go's `math.Copysign` with a direct bitwise sign-bit swap, and re-enables riscv64 CI in the same PR | [PR #250](https://github.com/tetratelabs/wazero/pull/250) |
| 2025-07-30 | [PR #2410](https://github.com/tetratelabs/wazero/pull/2410) opened, then **closed without merging** the same day; its fix (interpreter engine cache not cleared on `Close()`, surfaced by riscv64 testing) was folded into #2414 instead | [PR #2410](https://github.com/tetratelabs/wazero/pull/2410) (verified via `git log --grep`: no commit references #2410; PR page shows closed, not merged) |
| 2025-07-30 | [PR #2414](https://github.com/tetratelabs/wazero/pull/2414) merged (commit `b5f2bd0f`) - discovers and fixes a test-binary-discovery bug that had silently skipped top-level tests on riscv64/BSD/Solaris in CI for an extended period; also fixes the interpreter-engine cache bug and skips the compiler-engine subtest on architectures without a compiler backend | [PR #2414](https://github.com/tetratelabs/wazero/pull/2414) |
| 2025-11-08 | [PR #2441](https://github.com/tetratelabs/wazero/pull/2441) merged (commit `866305b2`, tagged `v1.10.0`) - moves the riscv64 CI runner image from `ubuntu-22.04` to `ubuntu-24.04` (still QEMU-emulated at this point) | [PR #2441](https://github.com/tetratelabs/wazero/pull/2441) |
| 2026-04-09/10 | [PR #2487](https://github.com/tetratelabs/wazero/pull/2487) "debug: riscv failure" opened and closed unmerged - scratch debugging branch chasing a riscv64 test failure under Go 1.26 with QEMU | [PR #2487](https://github.com/tetratelabs/wazero/pull/2487) |
| 2026-04-11 | [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) merged (commit `077fe36f`) - after the QEMU+Go-1.26 failure proved to be an emulation bug (author: "this passes on actual hardware"), migrates the riscv64 CI job off QEMU entirely onto the `ubuntu-24.04-riscv` native RISE RISC-V Runners label; also bumps `golang.org/x/sys` and the Go floor to 1.25/1.26 | [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) |

**Key contributors:** Takeshi Yoneda (mathetake, then Tetrate, now Netflix) authored the founding riscv64 CI commit and the copysign fix. QuLogic (no employer data found) authored the 2025 CI-coverage fix. ncruces (independent) authored the 2026 QEMU-to-hardware migration.

**Fully upstream:** yes. All riscv64-enabling changes are ordinary merges to `main` in the single upstream repository; there is no fork or out-of-tree patch set required (git history cross-checked with a full non-shallow clone; only PR #2410 among the six examined items did not land as its own commit, and even that fix shipped anyway inside #2414).

## 3. Upstream Support Tier

There is no formally named "Tier 1/2/3" system. The Support Policy section of `README.md` (added by PR #384, March 2022) establishes a de facto policy of "what we test is what we support": OS/architecture combinations actually exercised in CI are the supported set.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Interpreter engine | Full support, tested | Full support, tested | Full support, tested (Linux only) |
| Compiler (wazevo/JIT) engine | Full support, tested | Full support, tested | **Not supported** - no backend exists |
| Full unit-test job (`-race`, coverage) | Yes (Linux, Windows) | Yes (macOS) | **No** |
| `test_scratch` job (compiled binaries run in scratch container) | Yes | Yes | Yes |
| GitHub release binaries | Yes (darwin/linux/windows) | Yes (darwin/linux) | **No** |

Source: `README.md` Support Policy / Platform section (local clone, lines 54-115) and `.github/workflows/commit.yaml`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| wazevo native codegen backend (`internal/engine/wazevo/backend/isa/<arch>/`) | 28 files, full hand-written codegen | 33 files, full hand-written codegen (including atomics support) | **0 files - directory does not exist** |
| wazevo entrypoint/unwind (`isa_<arch>.go`, `entrypoint_<arch>.go`) | Present, real implementation | Present, real implementation | Falls to `isa_other.go` / `entrypoint_other.go`, which `panic("unsupported architecture")` / `panic(runtime.GOARCH)` if ever invoked |
| Interpreter engine | Same portable Go code, no arch-specific paths, shared across all architectures | | |
| Engine auto-selection (`internal/platform/platform.go`, `compilerPlatformSupports()`) | Routes to Compiler | Routes to Compiler | Routes to Interpreter automatically; the panic path is reachable only if a caller explicitly forces `NewRuntimeConfigCompiler()` on riscv64 |

A full-repository grep for `riscv`/`riscv64` across all `.go` files returns zero matches (confirmed both via local `grep` on a fresh clone at HEAD `451613ca` and independently via GitHub's `search_code` API, `total_count: 0`). This is architecturally consistent: riscv64 has no arch-specific code anywhere in the tree because its only execution path (the Interpreter) is deliberately architecture-independent.

**Quality characterization:** the JIT/AOT backend gap is a deliberate, transparent, and cleanly-guarded architectural boundary, not a silent or accidental stub - riscv64 users are automatically routed to a complete, spec-compliant, continuously-CI-tested execution path (the Interpreter) rather than hitting the panic stub.

Files referenced: `internal/platform/platform.go`, `runtime.go` (lines 152-178), `internal/engine/wazevo/isa_other.go`, `internal/engine/wazevo/entrypoint_other.go`, `internal/engine/wazevo/isa_amd64.go`, `isa_arm64.go`.

## 5. Build System, Cross-Compilation, and Toolchain

Wazero has no CMake, no `BUILDING.md`/`INSTALL`, and no committed Dockerfile of any kind (confirmed by direct repository search). It is pure Go with `CGO_ENABLED=0` throughout, so "building for riscv64" is an ordinary Go cross-compile:

```bash
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go install github.com/tetratelabs/wazero/cmd/wazero@latest
```

**Toolchain requirement:** the project supports "current Go minus 1." Current CI matrix tests Go **1.26** (current) and **1.25** (floor, matching the `go 1.25.0` directive in `go.mod`). No C/C++ toolchain version applies since CGO is never used, and there are no CMake `-DUSE_X=OFF`-style build flags; the only runtime-level choice is Interpreter vs. Compiler engine selection at the API level, not a build-time flag.

**QEMU usage:** riscv64 CI used QEMU-based emulation (`docker/setup-qemu-action`, `qemu: true` matrix flag, runner `ubuntu-24.04`) from the port's inception (2022) through PR #2441 (Nov 2025). [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) (merged 2026-04-11) removed QEMU entirely for riscv64 after a persistent Go-1.26 test failure under QEMU emulation was confirmed to be an emulation-specific bug that did not reproduce on real hardware; the job now runs on the native `ubuntu-24.04-riscv` runner label. QEMU still appears elsewhere in the repo (`internal-images.yml`, an unrelated generic multi-arch image job) but not in the riscv64 test path.

**Known build failures:** the only documented riscv64-specific bug found in this research was the runtime `copysign` spec-compliance issue ([#249](https://github.com/tetratelabs/wazero/issues/249)/[#250](https://github.com/tetratelabs/wazero/pull/250)), a correctness bug not a build failure, resolved same-day in 2022. No riscv64 build failure was found in issue history.

**Cross-compile smoke checks:** the `Makefile`'s manual cross-compile targets (plan9/amd64, js/wasm, wasip1/wasm, aix/ppc64, linux/s390x, linux/ppc64le, linux/arm, linux/386, freebsd/amd64) do **not** include riscv64 - riscv64 verification happens only via the dedicated CI workflow job, not via `make`.

Source: local clone (no `CMakeLists.txt`/`Dockerfile`/`BUILDING.md` present), `.github/workflows/commit.yaml`, [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) diff, `Makefile` lines 283-304.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| WASM spec-compliant execution (Interpreter) | Yes | Yes | Yes |
| JIT/AOT native codegen (Compiler/wazevo) | Yes | Yes | **No** |
| `-race` / coverage in main test suite | Yes | Yes | **No** (riscv64 only runs the reduced-scope `test_scratch` job) |
| `no_prot_exec` (W^X-restricted mmap/mprotect) variant tested | Yes (one of two amd64 entries) | No | **No** |
| GitHub release binary | Yes | Yes | **No** |

**Functional gap:** riscv64 cannot use the Compiler engine at all - any explicit attempt to force it panics (`isa_other.go`). This is a hard functional limitation, not a degraded mode.

**Performance gap:** wazero's own documentation states "Compiler is faster than Interpreter, often by order of magnitude (10x) or more." Since riscv64 is Interpreter-only, this ~10x+ gap versus amd64/arm64 (which get the Compiler) applies directly, though no wazero-specific or RISE-published quantitative riscv64-vs-arm64 benchmark exists to confirm the exact magnitude - this is architectural inference from the documented interpreter/compiler delta, not a measured riscv64 number. [NEEDS VERIFICATION - no direct riscv64-vs-arm64 benchmark found in any source searched]

**Security hardening gap:** the `no_prot_exec` seccomp-restricted CI variant, which simulates W^X-restricted environments, is applied only to one amd64 matrix entry - it is not tested on riscv64 or arm64. Given riscv64 never generates executable code at runtime (Interpreter-only, no JIT), this variant is arguably not applicable to riscv64 in the same way it is to a JIT-capable architecture, but the CI does not explicitly document this reasoning.

**NaN/floating-point semantics:** one confirmed historical issue - the interpreter's f32 `copysign` implementation round-tripped through Go's `math.Copysign` via float64, which corrupted the raw NaN sign-bit payload specifically under riscv64's FPU NaN-canonicalization behavior, violating WASM spec requirements. Fixed same-day in 2022 ([#249](https://github.com/tetratelabs/wazero/issues/249)/[#250](https://github.com/tetratelabs/wazero/pull/250)) via direct bitwise sign-bit manipulation instead of floating-point math. No other NaN/float semantics issues found in history.

## 7. CI/CD Infrastructure

riscv64 CI exists in exactly one file, `.github/workflows/commit.yaml`, in the `test_scratch` job's matrix (verified by direct file read on a local clone, cross-checked against a live fetch of the GitHub Actions page showing actual completed job entries named "riscv64, Linux (scratch), Go-1.26" / "Go-1.25"):

```yaml
platform:
  - os: ubuntu-24.04
    arch: amd64
  - os: ubuntu-24.04
    arch: amd64
    no_prot_exec: true
  - os: ubuntu-24.04-arm
    arch: arm64
  - os: ubuntu-24.04-riscv
    arch: riscv64
```

Trigger: every `pull_request` and `push` against `main` (no `workflow_dispatch`/schedule gate). The job cross-compiles Go test binaries with `GOARCH=riscv64 CGO_ENABLED=0`, builds a `FROM scratch` Docker image via `docker buildx build --platform linux/riscv64`, and **runs** the compiled test binaries inside that container (`docker run --platform linux/riscv64 ... -test.v`) - this is real test execution, not build-only.

Runner: `ubuntu-24.04-riscv` is a native RISC-V runner label, backed by the RISE RISC-V Runners service (confirmed by [PR #2486](https://github.com/tetratelabs/wazero/pull/2486)'s commit message and discussion: "the failing test was apparently due to a QEMU + Go 1.26 RISC-V bug. We're now using the RISE RISC-V Runners"). No QEMU setup step remains for riscv64 as of this commit.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job type | Full `test` job (Linux/Windows, `-race`, coverage) + `test_scratch` | Full `test` job (macOS) + `test_scratch` | **`test_scratch` only** |
| Test execution (not build-only) | Yes | Yes | Yes |
| Native hardware (no emulation) | N/A (native x86 runner) | N/A (native ARM runner) | Yes, since [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) (2026-04-11); QEMU-emulated before that |
| Blocking on PR merge | Yes | Yes | Yes (part of the same required workflow, no exclusion found in YAML) |

**Unverified limits of this check:** recent pass/fail track record for riscv64 CI runs could not be confirmed via GitHub's API (session access to `tetratelabs/wazero` repo API calls was blocked); job *names* were confirmed live but not authenticated run-status JSON. Whether fork PRs from external contributors actually trigger the self-hosted-style riscv64 runner (vs. requiring maintainer approval) could not be verified - GitHub's default fork-PR protections for non-standard runner labels are governed by repo settings not visible in this research.

Source: local clone `.github/workflows/commit.yaml`; live fetch of [GitHub Actions runs](https://github.com/tetratelabs/wazero/actions/workflows/commit.yaml); [PR #2486](https://github.com/tetratelabs/wazero/pull/2486).

## 8. Distribution and Release Status

**Upstream GitHub Releases:** latest release checked was v1.12.0. Assets: `wazero_1.12.0_checksums.txt`, `darwin_amd64.tar.gz`, `darwin_arm64.tar.gz`, `linux_amd64.tar.gz`, `linux_arm64.tar.gz`, `windows_amd64.zip`, plus architecture-independent source archives. **No riscv64 binary asset is published.**

**PyPI:** not applicable - wazero is a Go project and has no PyPI package (`https://pypi.org/pypi/wazero/json` returns 404).

**Ubuntu 26.04 (resolute):** ships a compiled `wazero` CLI binary package, version **1.11.0-5**, universe section, with an explicit riscv64 download entry (package size 1,362.0 kB), source package `golang-github-tetratelabs-wazero`. Cross-corroborated across [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Wazero&suite=resolute&searchon=names&section=all), Launchpad, and the Debian package tracker (matching version strings, dates, and sizes across independently-fetched pages). **Caveat:** this session's project-graph database (the task's prescribed authoritative check for this class of claim) was unreachable (`CONNECTION_CLOSED`) for the entire research effort, so this finding rests on web-page scraping only, not the graph-verified source of record. Treat as plausible but [NEEDS VERIFICATION] against the project graph once it reconnects.

**Debian:** package `golang-github-tetratelabs-wazero` exists in testing/unstable at version 1.12.0-1, producing two binaries (`wazero`, `golang-github-tetratelabs-wazero-dev`), architecture `any` (which includes riscv64 as an official Debian release architecture) - the likely upstream source Ubuntu syncs from.

**Arch Linux RISC-V** (archriscv.felixc.at): `wazero` was not found in the fetched index; this is a soft negative (page did not expose an exhaustive listing), not a confirmed absence.

**What a riscv64 user must do to get a working binary today:**
1. `apt install wazero` on Ubuntu 26.04+ (resolute) or Debian testing/unstable, **or**
2. `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go install github.com/tetratelabs/wazero/cmd/wazero@latest` (build from source; works because the entire codebase is portable Go), **or**
3. Consume it as a Go library dependency directly (`go get github.com/tetratelabs/wazero`) - no prebuilt binary needed for library use.

There is no path to a riscv64 binary published by upstream itself.

## 9. Dependencies

Wazero is architecturally unusual: it has **zero third-party runtime dependencies** beyond the Go toolchain. `go.mod`:

```
module github.com/tetratelabs/wazero
go 1.25.0
require golang.org/x/sys v0.44.0
```

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| `golang.org/x/sys` (only external module) | Low-level OS syscall wrappers (mmap, poll, etc.) used by wazero's `sysfs`/`platform` layers | Builds on riscv64 per the project's own Go dependency report [NEEDS VERIFICATION - project-graph query could not be executed this session to cross-confirm] | Passes per Go's own x/sys riscv64 CI | Ships as part of the Go module ecosystem, not apt-packaged | Two abandoned 2019 upstream PRs (epoll_event padding, endian tag) of unclear resolution status [NEEDS VERIFICATION] |
| Go toolchain (`go 1.25.0` floor) | Compiles wazero; wazero is 100% Go source, no CGO | `linux/riscv64` official builds available since Go 1.21 (go.dev/dl) | Extensive upstream Go CI on riscv64 | Official riscv64 tarballs on go.dev/dl | BoringCrypto `.syso` is not built for riscv64 upstream, but this does not affect wazero since wazero never uses CGO/BoringCrypto |
| wazero's own wazevo native-code backend (internal subsystem, not a third-party dependency) | JIT/AOT codegen engine | No riscv64 backend exists (see Section 4) | N/A - not targeted on riscv64 | N/A | This is wazero's actual riscv64 exposure - not a supply-chain dependency risk but an internal architectural gap |

No `project-reports/reports/<slug>.md` entry exists for wazero itself in the local report repository at the time of this research; the Go toolchain's own tracked report (`project-reports/go.md`) was the source for the Go-toolchain row above.

**Bottom line:** wazero carries essentially no third-party riscv64 supply-chain risk. Its one dependency (`golang.org/x/sys`) is riscv64-clean. The real riscv64 gap is internal and architectural (Section 4), not a dependency problem.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #249](https://github.com/tetratelabs/wazero/issues/249) / [PR #250](https://github.com/tetratelabs/wazero/pull/250) | Interpreter `copysign` for f32 not spec-compatible on RISC-V 64 | **Closed/fixed** (2022-02-16) | Correctness bug (WASM spec violation) | Root cause: float64 round-trip through Go's `math.Copysign` corrupted NaN sign-bit payload under riscv64 FPU behavior. Fixed via direct bitwise sign-bit manipulation. Forced riscv64 CI to be disabled for a few hours until fixed. |
| [PR #2410](https://github.com/tetratelabs/wazero/pull/2410) | Ensure interpreter.Engine is empty after closing | **Closed, not merged** (fix folded into #2414) | Correctness bug (compilation-cache leak), specific to the interpreter engine that riscv64 always uses | Discovered via riscv64 testing since riscv64 has no compiler backend to mask the bug |
| [PR #2414](https://github.com/tetratelabs/wazero/pull/2414) | ci: Ensure top-level tests are run on alternate architectures | **Merged** (2025-07-30) | CI-coverage gap (top-level tests silently skipped on riscv64/BSD/Solaris) | Fixed a test-binary-discovery bug; also fixed the #2410 cache bug and a panic in `TestHostFunctionWithCustomContext` when no compiler is available |
| [PR #2487](https://github.com/tetratelabs/wazero/pull/2487) | debug: riscv failure | **Closed, not merged** (abandoned scratch branch, 2026-04-10) | N/A - diagnostic branch | Superseded by the real fix in [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) (QEMU emulation bug, not a wazero bug) |
| - | Open riscv64-tagged issues | **None found** | - | As of this research, the entire open-issues list contains only 3 items, none riscv-related: component model support (#2200), WASI Preview 2 (#2289), WASM 3.0 compliance (#2426) |

**Correctness bugs highlighted separately:** only one true riscv64-specific correctness bug has ever been found in wazero's history (#249, the copysign NaN sign-bit issue), and it was fixed within hours of discovery in 2022. The 2025 CI-coverage bug (#2410/#2414) was a testing-infrastructure gap, not a runtime correctness bug in shipped behavior, though it did mask a real interpreter-engine bug for an unknown period.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer comment, issue, or `RATIONALE.md` passage objects to riscv64 support existing.

**Technical blockers:** implementing a riscv64 wazevo (JIT/AOT) backend would require net-new RISC-V machine-code emission, register allocation, and unwinding/entrypoint code comparable in scope to the existing arm64 backend (33 files, including atomics support) - a substantial, ground-up engineering effort. `RATIONALE.md`'s stated bar ("implementing a compiler correctly requires expertise in Wasm, Golang and assembly") applies directly and is likely why no such backend has been attempted.

**Organizational blockers:** wazero is single-vendor stewarded (Tetrate), and the two most prolific historical maintainers now list Netflix as their employer [NEEDS VERIFICATION], which may reduce Tetrate's direct engineering bandwidth for large net-new subsystems like a riscv64 JIT backend. No RISE-funded project (RP-numbered) currently targets wazero, and wazero/Tetrate are not RISE members - wazero's only RISE touchpoint is as an unfunded consumer of RISE's free CI runner service.

**Acceptance probability for a hypothetical riscv64 JIT contribution:** no direct evidence either way (no such PR has been proposed to evaluate maintainer reaction to). Given the project's "no external forks/plugins, everything upstream, full first-party quality bar" philosophy, a well-tested, fully-featured contribution meeting the same standard as the arm64 backend would plausibly be accepted, but a partial/best-effort contribution would likely face the same skepticism `RATIONALE.md` expresses toward external contributions generally. This is inference from stated project philosophy, not a tested precedent.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** Debian (riscv64 binaries are provided by Debian's `golang-github-tetratelabs-wazero` package, synced into Ubuntu 26.04/resolute; not published by upstream)
- **Optimization gap:** N/A - wazero is not classified as an optimization-purpose project. Its core value proposition (a spec-compliant, embeddable WebAssembly runtime) is fully delivered by the portable Interpreter engine alone; the wazevo JIT/AOT backend is a performance accelerator layered on top of a functionally-complete baseline, analogous to a general-purpose language runtime rather than a project whose entire reason for existing is beating a reference implementation on speed (the category that triggers the Step 2 modifier: allocators, SIMD libraries, inference kernel libraries, etc.).
- **Justification:** Upstream CI in [`.github/workflows/commit.yaml`](https://github.com/tetratelabs/wazero/blob/main/.github/workflows/commit.yaml) builds riscv64 and actually **executes** the compiled test suite on native RISE RISC-V hardware (`ubuntu-24.04-riscv`, no QEMU since [PR #2486](https://github.com/tetratelabs/wazero/pull/2486), merged 2026-04-11), which satisfies the "build + test" bar for blue. Upstream does not publish a riscv64 release artifact on [GitHub Releases](https://github.com/tetratelabs/wazero/releases) (only amd64/arm64 darwin/linux/windows tarballs), which blocks green under the release-provider rule (`release_provider: upstream` is a prerequisite for green). The distribution floor is not the deciding mechanism here since upstream CI already exists and sets the primary grade.
- **Pending work that could change the grade:** none identified that would raise the color. No open PR or issue proposes a riscv64 wazevo/JIT backend (which is irrelevant to the CI-based color in any case, since wazero is not optimization-purpose). No open PR proposes publishing riscv64 GitHub release assets. RISE's only involvement is as an unfunded CI-runner consumer relationship (wazero listed among "other active workloads" in the [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) post, no dedicated funded project). A trivial CI change adding a riscv64 upload step to the release workflow would be sufficient to move the release axis to `upstream` and unlock green, since build and test are already satisfied.

## 14. Investment Analysis

RISE has already funded the infrastructure layer that made riscv64 CI viable: the native `ubuntu-24.04-riscv` GitHub Actions runner service that wazero's [PR #2486](https://github.com/tetratelabs/wazero/pull/2486) migrated onto, eliminating the QEMU-emulation flakiness that had previously produced spurious riscv64 CI failures. No further RISE runner investment is needed for wazero specifically. RISE has not funded any wazero-specific engineering work (no RP-numbered project, no dedicated blog post, wazero/Tetrate not RISE members) - so functional, coverage-parity, and release-publishing work below is entirely unaddressed by existing RISE investment.

### 14.1 Functional Enablement

Functionally, wazero already works on riscv64 via the Interpreter engine, spec-compliant and CI-verified on real hardware. No functional-enablement work is required for correctness. The only functional gap is the absent wazevo JIT/AOT backend (Section 4/12) - a large, optional performance feature, not a correctness blocker.

### 14.2 Performance Optimization

Building a riscv64 wazevo backend (native codegen, register allocation, unwinding, entrypoints) comparable in scope to the existing arm64 backend (33 files, including atomics) is the single largest possible investment here. No quantitative riscv64 performance benchmark exists to size the expected uplift precisely, but wazero's own documentation states the Compiler is "often by an order of magnitude (10x) or more" faster than the Interpreter on architectures where it exists - this is the ceiling of expected benefit for riscv64 users of CPU-bound Wasm workloads.

### 14.3 CI/CD Infrastructure

Already strong: native hardware, real test execution, runs on every PR/push. The one remaining infrastructure gap is coverage parity - riscv64 gets only the reduced-scope `test_scratch` job (no `-race`, no coverage), while amd64/arm64 get the full `test` job. Extending `-race` and coverage collection to riscv64 is a small, low-risk CI configuration change (contingent on the Go race detector being supported on riscv64, which was not directly verified in this research [NEEDS VERIFICATION]).

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale (wazero is a standalone Go runtime/library with no dependent package ecosystem requiring separate riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Distribution | Add a riscv64 build/upload step to the GitHub release workflow (upstream currently publishes no riscv64 release asset despite building/testing it in CI) | 0.5-1 | Upstream (wazero maintainers) | High - closes the single gap between blue and green |
| CI/CD | Extend `-race` and coverage collection to the riscv64 CI job to match amd64/arm64 coverage parity | 1-2 | Upstream (wazero maintainers), or RISE-funded contribution | Medium |
| Performance | Design and implement a riscv64 wazevo JIT/AOT backend (codegen, register allocation, unwinding, entrypoints) at parity with the arm64 backend | 20-40 (multi-month effort, comparable in scope to standing up a new arm64-class backend from scratch) | Upstream, likely requiring a dedicated funded contributor given current single-vendor bandwidth constraints [NEEDS VERIFICATION on Tetrate's current staffing] | Medium - closes the ~10x interpreter/compiler performance gap but is not a correctness blocker |
| Functional | None required - interpreter path is complete and CI-verified | 0 | N/A | N/A |
| Ecosystem | Not applicable | N/A | N/A | N/A |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [tetratelabs/wazero repository](https://github.com/tetratelabs/wazero)
- [wazero.io homepage](https://wazero.io/)
- [wazero.io community page](https://wazero.io/community/)
- [Issue #249 - copysign spec-compliance bug](https://github.com/tetratelabs/wazero/issues/249)
- [PR #200 - founding riscv64 CI commit](https://github.com/tetratelabs/wazero/pull/200)
- [PR #248 - riscv64 CI temporarily disabled](https://github.com/tetratelabs/wazero/pull/248)
- [PR #250 - copysign fix, riscv64 CI re-enabled](https://github.com/tetratelabs/wazero/pull/250)
- [PR #2410 - closed, not merged, folded into #2414](https://github.com/tetratelabs/wazero/pull/2410)
- [PR #2414 - CI test-coverage fix for alternate architectures](https://github.com/tetratelabs/wazero/pull/2414)
- [PR #2441 - runner image update](https://github.com/tetratelabs/wazero/pull/2441)
- [PR #2486 - riscv64 CI migrated off QEMU onto native RISE hardware](https://github.com/tetratelabs/wazero/pull/2486)
- [PR #2487 - abandoned riscv debug branch](https://github.com/tetratelabs/wazero/pull/2487)
- [tetratelabs/wazero .github/workflows/commit.yaml](https://github.com/tetratelabs/wazero/blob/main/.github/workflows/commit.yaml)
- [tetratelabs/wazero GitHub Actions runs](https://github.com/tetratelabs/wazero/actions/workflows/commit.yaml)
- [tetratelabs/wazero README.md](https://github.com/tetratelabs/wazero/blob/main/README.md)
- [tetratelabs/wazero RATIONALE.md](https://github.com/tetratelabs/wazero/blob/main/RATIONALE.md)
- [tetratelabs/wazero latest release (v1.12.0)](https://github.com/tetratelabs/wazero/releases)
- [Ubuntu 26.04 (resolute) wazero package search](https://packages.ubuntu.com/search?keywords=Wazero&suite=resolute&searchon=names&section=all)
- [Debian package tracker - golang-github-tetratelabs-wazero](https://tracker.debian.org/pkg/golang-github-tetratelabs-wazero)
- [Launchpad - golang-github-tetratelabs-wazero](https://launchpad.net/ubuntu/+source/golang-github-tetratelabs-wazero)
- [PyPI wazero lookup (404, package does not exist)](https://pypi.org/pypi/wazero/json)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members page](https://riseproject.dev/members/)
- Local clone `/home/user/tetratelabs/wazero` (HEAD `451613caac44f790e7718ab088ee5e50751b0985`), full and shallow, used for `git log`/`git show`/`grep` cross-validation throughout this report