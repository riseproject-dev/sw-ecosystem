---
title: WebAssembly Language runtimes
parent: Project Reports
color: green
---

{% include dependency-graph.html slug="dependencies" subset="webassembly-language-runtimes" %}

# WebAssembly Language runtimes

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for WebAssembly Language runtimes<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

`vmware-labs/webassembly-language-runtimes` ("WLR") is a single-vendor VMware Labs project that cross-compiles PHP, Python, and Ruby, plus a set of C support libraries (zlib, bzip2, libjpeg-turbo, libpng, libxml2, oniguruma, SQLite, libuuid), into `wasm32-wasi`/`wasm32-wasip1` WebAssembly bytecode using the WASI SDK toolchain. The project does not compile to any native host CPU instruction set (x86_64, arm64, or riscv64); its build output is portable Wasm bytecode intended to run under a separate Wasm runtime (Wasmtime, WasmEdge, WAMR, etc.) on whatever host the operator chooses.

Governance is informal and single-vendor. All commit history is VMware-authored: Asen Alexandrov (185 commits, plus 57 under a variant email), Rafael Fernandez Lopez (70 commits, plus 3 under a personal email), Jesus Gonzalez (32 commits), the VMware GitHub Bot (6 commits), and two minor contributors, all carrying `@vmware.com` addresses. There is no MAINTAINERS, OWNERS, or CODEOWNERS file; contributions are gated only by a corporate CLA (`CONTRIBUTING_CLA.md`, cla.vmware.com) and the standard VMware Code of Conduct. The project is licensed Apache-2.0.

The repository's README now carries an archival banner: "This project will be archived soon. The development will continue as an independent community fork on: [webassemblylabs/webassembly-language-runtimes](https://github.com/webassemblylabs/webassembly-language-runtimes)." That fork currently discloses no public members and no distinct governance documents of its own.

On community culture: the project actively solicits contribution of new **library ports** to `wasm32-wasi` ("If you are into porting of C-based apps to wasm32-wasi you could play with the libs... Pick a library you want to see ported"), gated only by the CLA, with no formal RFC process. It has no concept of host-CPU-architecture ports at all (see Section 3), so there is no comparable solicitation for a "riscv64 port."

## 2. Port History and Upstreaming Timeline

No RISC-V port exists, and none has ever been attempted. A full, unshallowed scan of the commit history (`git log --all -i --grep=riscv`) in both `vmware-labs/webassembly-language-runtimes` and the community fork `webassemblylabs/webassembly-language-runtimes` returned zero matches. There is no milestone timeline to report because there is no riscv64-related activity of any kind - no tracking issue, no proposal PR, no discussion thread.

This is not an oversight relative to a maturity curve; it reflects the project's build target. WLR's compilation target is `wasm32-wasi`, a portable virtual ISA that abstracts away the host CPU architecture at the runtime layer. The project therefore has no notion of "porting to riscv64" as a category of work, in the same way it has no notion of porting to arm64 either (see Section 4 - zero arm64-specific code exists in this repository either).

"Is it fully upstream?" does not apply: there is nothing to be upstream or out-of-tree, because no riscv64-specific code path has ever existed to diverge.

## 3. Upstream Support Tier

No formal tier policy document exists. `PLATFORMS.md` and `SUPPORT.md` are absent from the repository. The closest documentation, `docs/developers.md`, organizes build work by **language-runtime version and build flavor** (e.g., `slim`, `wasmedge`), not by host CPU platform tier. There is no tier-of-support concept for underlying hardware architectures in this project at all.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated host-CPU code path in this repo | None found (only Docker `--platform linux/amd64` pins and `.deb` package suffixes - build-infra plumbing, not source-level arch branches) | None found (0 code-search hits) | None found (0 code-search hits) |
| CI runner architecture | All 29 workflow files run on `ubuntu-latest` (x86_64) | Not used as a CI runner architecture | Not used as a CI runner architecture |
| Release artifacts tagged by CPU arch | No - artifacts are portable `.wasm` bytecode / toolchain tarballs | No | No |

The project treats no host CPU architecture as a first-class "supported platform" in its own build/release scheme; its only supported "target" is the Wasm bytecode ISA itself, built on x86_64 GitHub-hosted runners as a build-infrastructure convenience, not a support-tier decision.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Exhaustive GitHub code search against `vmware-labs/webassembly-language-runtimes` for `riscv`, `vfloat32m1_t`, `rvv`, `riscv64`, `RISCV`, `__riscv`, `risc-v`, `path:riscv`, and `Zba` returned zero results for every query. No `arch/riscv/` directory, no `.S` assembly files for RISC-V, no JIT backend, and no SIMD dispatch code for riscv64 exists anywhere in the repository.

Critically, this is not a riscv64-specific gap relative to a mature amd64/arm64 pair: a control search for `arm64` in the same repository also returned **zero results**, and `amd64` returned only 3 hits, all Docker `--platform linux/amd64` pins or `wasi-sdk..._amd64.deb` package names in `Makefile.builders`, `Makefile.helpers`, and a PHP WASI patch - none of which is a runtime/codegen architecture branch. The project has no architecture-partitioned implementation for any host CPU, because it contains no JIT, no SIMD dispatch, no crypto, and no assembly of its own - it is a build-orchestration project that invokes an external toolchain (WASI SDK) to produce architecture-independent bytecode.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / codegen | Not present in this repo | Not present in this repo | Not present in this repo |
| SIMD dispatch | Not present in this repo | Not present in this repo | Not present in this repo |
| Crypto | Not present in this repo | Not present in this repo | Not present in this repo |
| Assembly / intrinsics | Not present in this repo | Not present in this repo | Not present in this repo |

## 5. Build System, Cross-Compilation, and Toolchain

Build orchestration is GNU Make plus bash: `make php/`, `make python/`, `make ruby/`, `make libs/<name>` invoke `wlr-make.sh`, which calls `scripts/wlr-setup-repo.sh` and `scripts/wlr-build.sh`.

Pinned toolchain versions:
- **WASI SDK 20.0** (LLVM/Clang-based cross-compiler; produces every `.wasm` artifact)
- **Binaryen 111** (`wasm-opt`; bundled into the `wasm-base` image as a prebuilt `x86_64-linux` binary)
- **WABT 1.0.32** (`wat2wasm`/`wasm2c`/`wasm-interp`)
- **wasi-vfs v0.4.0** (built via `rust:1.67.1-slim`, cross-compiled to `wasm32-unknown-unknown`)

Every Docker build/run invocation across `Makefile.helpers` and `Makefile.builders` - the `wasi-builder` toolchain container, the `wasm-base` image, and every lib/runtime build - is hardcoded to `--platform linux/amd64`. The `wasm-base` image is built from `ubuntu:22.04`, x86_64 only. `Dockerfile.wasi-builder` installs `autoconf automake build-essential cmake clang curl git jq libtool libtool-bin pkg-config tcl unzip`, downloads WASI SDK and WABT, and builds `wasi-vfs` via Cargo.

No QEMU usage was found: `grep -ni qemu` across the entire repository tree (both `vmware-labs/webassembly-language-runtimes` and the `webassemblylabs` fork) returned zero hits. There is no riscv64-specific build documentation (`BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, and any riscv64-named Dockerfile are all absent). No riscv64 build has ever been attempted, so there are no known riscv64 build failures to report.

Practical consequence: the build pipeline itself cannot currently run natively on a riscv64 host without x86_64 emulation (qemu-user/binfmt), because of the hardcoded `--platform linux/amd64` Docker pin - this is independent of whether the *output* of that pipeline (portable `.wasm` bytecode) runs on riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because neither arm64 nor riscv64 (nor, at the source-code level, even amd64) has a dedicated host-CPU code path in this repository (Section 4), there is no internal feature, performance, or security-hardening gap between architectures to report at this repo's own level - the concept does not apply, since the repo never branches on host CPU architecture.

Any functional or performance gap that would matter to an end user (e.g., can a given `.wasm` binary produced here execute correctly and performantly on a riscv64 host) is a property of the downstream Wasm runtime chosen to execute it (Wasmtime, WasmEdge, WAMR, V8, etc.), not of this repository. Data not available: no riscv64-vs-arm64/amd64 WebAssembly execution benchmark exists in a form that isolates a runtime-independent comparison; the closest data found is x86_64-only overhead figures from Frank Denis's "Performance of WebAssembly runtimes in 2026" (Wasmtime 2.41x native, Node/V8 7.95x native, wazero ~4.7-4.84x native, WAMR AOT 1.57x native), which contains no ARM64 or RISC-V64 data points at all - see [00f.net, June 2026](https://00f.net/2026/06/23/webassembly-runtimes-2026/). NaN/floating-point semantics: data not available - not researched at the repo level, and this is a Wasm-spec/runtime concern rather than something WLR itself defines.

## 7. CI/CD Infrastructure

All 29 CI workflow files in `.github/workflows/` were read directly, verified at commit `6e7674cf52edb8299bf34d4f7cb0a385c6ff728d`:
- `build-libs-*.yaml` (9 files: bundle_wlr, bzip2, libjpeg, libpng, libuuid, libxml2, oniguruma, sqlite, zlib)
- `build-{php,php-nightly,python,ruby}.yaml` (4 files)
- `release-libs-*.yaml` (9 files, mirroring the build-libs set) and `release-{php,python,ruby}.yaml` (3 files)
- `reusable-{build-lib,build-runtime-flavor,publish-assets,release-external-lib,release-internal-lib}.yaml` (5 files)

Every single job across all 29 files runs on `runs-on: ubuntu-latest` (standard x86_64 GitHub-hosted runner). No self-hosted riscv64 runner, no RISE runner reference, no QEMU-based cross-architecture emulation job, and no architecture-conditional matrix axis exists anywhere. A case-insensitive search for `riscv`, `risc-v`, `rv64`, and `rv32` across the entire repository tree (not just `.github/`) returned zero matches. Matrix axes that do exist vary only `version`/`flavor`/`name`/`suffix` (library or language version strings) - never architecture or platform. Trigger types observed: `push` (path-filtered on most build-*/release-* files), `schedule` + `workflow_dispatch` (build-php-nightly.yaml only), and `workflow_call` (the five reusable-*.yaml files).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (all 29 workflows run on ubuntu-latest x86_64) | No CI job of any kind | No CI job of any kind |
| CI test | Data not available: workflow file names indicate build/release purpose; whether test suites execute within them was not verified in this session's research | N/A - no CI job exists | N/A - no CI job exists |
| CI release | Yes (release-*.yaml workflows publish to GitHub Releases) | N/A | N/A |
| RISE runners referenced | No | No | No |

## 8. Distribution and Release Status

No riscv64 (or any host-CPU-architecture-specific) artifact exists in any channel checked:

- **PyPI** (`https://pypi.org/pypi/webassembly-language-runtimes/json`): HTTP 404 - no package exists under this name at all.
- **RISE Python wheel builder** (GitLab project 56254198 PyPI simple index): redirects to the same nonexistent PyPI entry, 404.
- **Ubuntu 26.04 "resolute"** (`https://packages.ubuntu.com/search?keywords=WebAssembly%20Language%20runtimes&suite=resolute`): "Sorry, your search gave no results" - the package is not present for any architecture.
- **Arch Linux RISC-V port** (`https://archriscv.felixc.at`): no matching package listing.
- **GitHub Releases** (checked `python/3.12.0+20231211-040d5a6` and `ruby/3.2.2+20230714-11be424` asset manifests): all assets are portable bytecode or toolchain tarballs - `libpython-3.12.0-wasi-sdk-20.0.tar.gz`, `python-3.12.0-wasi-sdk-20.0.tar.gz`, `python-3.12.0-wasmedge-wasi-sdk-20.0.tar.gz`, `python-3.12.0-wasmedge.wasm`, `python-3.12.0.wasm`, `ruby-3.2.2-slim.wasm`, `ruby-3.2.2.wasm`. No filename in either release contains "riscv" or any CPU-architecture tag.

**What a user must do to get a working artifact on a riscv64 host:** download the existing portable `.wasm` release asset from [GitHub Releases](https://github.com/vmware-labs/webassembly-language-runtimes/releases) (no build step required, since the artifact is architecture-independent), then execute it with a `wasm32-wasi`-compliant Wasm runtime installed on the riscv64 host (e.g. Wasmtime, WasmEdge, WAMR). Riscv64 host support for those runtimes is outside this project's scope and was only passingly noted during research (general-purpose Wasm runtimes were flagged as "supporting riscv64" in an unrelated search context) - this is [NEEDS VERIFICATION] as it was not independently confirmed in this session.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| wasi-sdk | Build-dependency, critical (compiler toolchain producing every `.wasm` artifact; pinned v20.0 in WLR) | Recently fixed upstream in current versions: [issue #607 "Add riscv64 host platform support"](https://github.com/WebAssembly/wasi-sdk/issues/607), closed completed - built natively on rv64gc hardware with zero source patches | Not CI-covered on riscv64 upstream | No riscv64 release binary; upstream ships only x86_64/arm64 Linux/macOS/Windows tarballs | WLR's pinned v20.0 predates riscv64 support entirely; even current upstream requires build-from-source (~8-10h) |
| GNU make | Build-dependency, critical (build orchestration) | Data not available: not independently researched for riscv64 in this session | Data not available | Data not available | Standard GNU toolchain component; not deep-dived here |
| Python | Build-dependency, critical (CPython source cross-compiled to wasm32-wasi) | Data not available: this session's research covered WLR's own build pipeline, not CPython's native riscv64 build status | Data not available | Data not available | Out of scope: WLR compiles CPython to portable bytecode, not to riscv64 native code |
| PHP | Build-dependency, critical (php-src cross-compiled to wasm32-wasi) | Data not available | Data not available | Data not available | Same as Python - cross-compiled to architecture-independent bytecode |
| Ruby | Build-dependency, critical (Ruby source cross-compiled to wasm32-wasi) | Data not available | Data not available | Data not available | Same as Python/PHP |
| WasmEdge | Runtime-dependency, optional (one of WLR's build "flavors" - `*-wasmedge.wasm` release assets exist) | [NEEDS VERIFICATION] - only a passing, single-source mention that general-purpose Wasm runtimes including WasmEdge "support riscv64" was found; not independently confirmed | Data not available | Data not available | Downstream execution concern, not WLR's own build concern |
| zlib | Build-dependency, optional (compression; used by libpng, libxml2, Python build) | Yes - pure portable C, zero riscv-specific code in mainline | Only an OpenBSD/QEMU CI lane exists (not Linux); no Linux riscv64 CI | No upstream binaries (source-only); distro packages available (Debian/Ubuntu/Arch/Alpine) | RVV Adler32 PR stalled 8+ months with no maintainer response per internal report; no riscv64 CRC32 hardware-instruction path (unlike arm64) - see `project-reports/zlib.md` |
| bzip2 | Build-dependency, optional | Yes - pure C89, works by construction, zero riscv-specific commits ever | No upstream CI for riscv64 (amd64/i386 only) | Source-only upstream; Debian/Ubuntu packages | No functional or technical blockers of any kind - see `project-reports/bzip2.md` |
| libjpeg-turbo | Build-dependency, optional (SIMD-heavy JPEG codec, actual upstream `libjpeg-turbo/libjpeg-turbo`, WLR pins tag 2.1.5.1) | RVV 1.0 SIMD merged February 2026, took 3.5 years from first request | No riscv64 CI upstream (7 CI jobs, all x86_64/macOS-arm64) | Maintainer explicitly declined riscv64 release binaries ([issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), "won't implement") | The Ubuntu 26.04 package version (2.1.5) predates the February-2026 RVV merge by ~3.5 years, so the shipped riscv64 binary has no SIMD acceleration despite it existing upstream - see `project-reports/libjpeg-turbo.md` |
| libpng | Build-dependency, optional (image codec, depends on zlib) | RVV 1.0 intrinsics merged May-December 2025, required 8 PRs plus 4 correctness-bug fix rounds (last: December 2025 wrong-pixel-value bug) | No automated riscv64 CI - the December-2025 correctness bug reached mainline undetected because of this gap | Source-only upstream; distro packages current (1.6.57 postdates the fixes) | RVV is off-by-default with no runtime CPU-feature detection (compile-time only) - see `project-reports/libpng.md` |
| UUID library (libuuid) | Build-dependency, optional | Not deep-dived (excluded from JIT/SIMD/crypto/compression/allocator filter in this session's research) | Not deep-dived | Not deep-dived | Minor dependency, out of scope for deep research this session |
| libxml2 | Build-dependency, optional (XML parser for PHP/Ruby bindings) | No riscv arch-specific code exists at all (pure scalar C on every arch); correct current binary package is `libxml2-16`, confirmed riscv64 in Ubuntu resolute (base `2.15.2+dfsg-0.1`) | No upstream CI for any non-amd64 arch | Source-only; distro packages, though the security-patched revision (`ubuntu0.1`) is amd64/arm64/i386-only - riscv64 lags | Open [GNOME work item #971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971): catalog code uses double-checked locking unsafe on riscv64's weak memory model - unpatched correctness bug - see `project-reports/libxml2.md` |
| oniguruma | Build-dependency, optional (Ruby's regex engine) | No riscv64-specific issues ever filed (only 1 unrelated issue hit on Windows ARM64) | Not independently assessed this session | Distro-packaged (`libonig5 6.9.10-1build1` in Ubuntu resolute); no upstream binary releases | Lowest-signal dependency in this set; no dedicated project report exists yet |
| SQLite | Build-dependency, optional (embedded DB for PHP/Python builds) | Functionally complete; the only fix ever needed was a `__uint128_t` riscv32 (not riscv64) guard bug, fixed same-day in April 2026 | No CI of any kind upstream (zero workflow files in the whole repo) | No upstream binaries; distro-only (`libsqlite3-0 3.46.1-9` in Ubuntu resolute) | Zero open riscv64 bugs - see `project-reports/sqlite.md` |
| ICU | Build-dependency, optional | Data not available: not researched in this session's findings | Data not available | Data not available | Not covered by this session's dependency deep-dive |
| Binaryen (indirect - `wasm-opt`, pinned v111 in `wasm-base` image) | Toolchain dependency (indirect via wasi-sdk/wasm-base) | Clean, unpatched build; riscv64 build-portability blocker fixed in [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) (2024), landed in `version_118` - after WLR's pinned v111 | No upstream riscv64 CI (matrix: ubuntu-22.04/latest, macos-14, windows-latest, windows-11-arm - zero riscv references) | No upstream release binary; distro-only (`binaryen 120-4build1`, riscv64, Ubuntu ports/universe) | See `project-reports/binaryen.md` - color yellow; capped because no upstream CI/release exists despite a clean distro build |
| WABT (indirect - WebAssembly Binary Toolkit, pinned v1.0.32) | Toolchain dependency (indirect via wasi-builder) | Only 2 one-line riscv preprocessor portability shims exist; compiles per compatibility table in a project PR | No riscv64 CI at all (all 4 workflow files greped, zero matches); one disabled s390x cross-arch job exists | No upstream binary; Debian/Ubuntu-only, patch status unverified | See `project-reports/wabt.md` - color orange (downstream-only, patch status unknown) |
| OpenSSL (indirect - `libssl-dev`, apt-installed in `python/Dockerfile` for CPython's `ssl` module) | Toolchain/build dependency (indirect) | Extensive: AES/SHA-2/GCM/ChaCha20/SM3/SM4 all have merged Zvk/Zkn vector-crypto paths since 2022 | A 13-row QEMU-emulated extension matrix exists, but no native riscv64 CI runner (a PR to add one was closed) | Source-only upstream; distro packages current (`libssl3t64 3.5.5-1ubuntu3`, riscv64) | Critical open security gap: the AES T-table fallback used on hardware lacking Zkn/Zvkned (most shipping riscv64 silicon today, including SG2042/TH1520/JH7110/SpacemiT K1) is not constant-time - open PRs referenced in `project-reports/openssl.md`; also an open musl hwprobe-detection bug and an SSL-test parallelism hang |

**Cross-cutting note:** the project's own hardcoded `--platform linux/amd64` Docker pin (Section 5) is the primary structural blocker for running WLR's build pipeline natively on a riscv64 host, ahead of any single dependency's own riscv64 maturity - and it is orthogonal to whether the *produced* `.wasm` artifacts themselves run on riscv64 (they do, via any compliant Wasm runtime, since they are architecture-independent bytecode).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issues, PRs, or commits exist in `vmware-labs/webassembly-language-runtimes` | N/A | N/A | Confirmed by `mcp__github__search_issues`, `search_pull_requests`, and `search_commits` for "riscv", "riscv64", and "RISC-V" (all combined with `repo:vmware-labs/webassembly-language-runtimes`) returning 0 results each, independently corroborated via GitHub's own web search UI |

No correctness bugs specific to riscv64 exist to highlight, because no riscv64-specific code or activity exists in this repository at all. This is distinct from a project with unresolved riscv64 bugs - there is simply nothing to report here at the repository level. (Contrast with several of the deep-dived dependencies in Section 9 - e.g. libxml2's open double-checked-locking correctness bug, and OpenSSL's non-constant-time AES fallback - both of which are genuine open riscv64 issues, but in dependencies, not in WLR itself.)

## 12. Objections and Upstream Blockers

No RISC-V-specific objections have ever been raised in this project, because no RISC-V-specific proposal has ever been made - there is no PR or issue to object to.

**Technical blockers:**
- The entire build pipeline is hardcoded to `--platform linux/amd64` in Docker invocations across `Makefile.helpers` and `Makefile.builders`, preventing the build infrastructure itself (not its output) from running natively on non-x86_64 CI hosts including riscv64.
- Pinned toolchain versions (WASI SDK 20.0, Binaryen 111) predate the riscv64-relevant fixes that later landed upstream in those exact tools (WASI SDK's riscv64 host-build support landed around v30; Binaryen's riscv64 build-portability fix landed in `version_118`) - see [WASI SDK issue #607](https://github.com/WebAssembly/wasi-sdk/issues/607) and [Binaryen PR #6410](https://github.com/WebAssembly/binaryen/pull/6410).

**Organizational blockers:**
- The project is a single-vendor (VMware) effort with an active archival notice; future substantial contributions would need to target the community fork `webassemblylabs/webassembly-language-runtimes`, which currently has no distinct governance or contribution policy of its own.
- No RISE Project involvement exists (checked RISE's full blog post index - all 33 posts - the RISE GitHub org, the RISE Confluence Language Runtimes WG page, and the RISE Python wheel builder; zero mentions of this project in any of them).

**Acceptance probability:** the framing of "would a riscv64 port PR be accepted" does not directly apply, because this project's architecture-independence (Section 13) means no such port is a meaningful unit of work in the first place. The closest analogous, genuinely useful contribution would be relaxing the hardcoded `--platform linux/amd64` Docker pin so the build pipeline itself could run on non-x86_64 CI hosts - this is an infrastructure improvement, not a riscv64 "port," and its acceptance likelihood was not assessed (no such PR exists to evaluate).

## 13. Readiness Assessment

- **Color:** green (arch-independent) - via project-color-coding skill
- **Release provider:** upstream
- **Optimization level:** not applicable (this is not an optimization-purpose project)

**Justification:** This project ships no compiled, host-CPU-architecture-specific code of its own - its build output is `wasm32-wasi` bytecode, architecture-independent by design and directly analogous to the Step 0 shortcut's reference examples (a platform-neutral JVM jar, a `noarch` package). Confirmed by: (1) zero code-search hits for `riscv`, `arm64`, or any RISC-V variant in the repository (see Section 4), meaning the project has no per-host-CPU code path for *any* architecture, not just riscv64; (2) GitHub Release assets for both Python and Ruby builds contain exclusively portable `.wasm` files and toolchain tarballs with no CPU-architecture tagging in any filename ([GitHub Releases](https://github.com/vmware-labs/webassembly-language-runtimes/releases)); and (3) the project's stated purpose - cross-compiling PHP/Python/Ruby/C-libraries to the WebAssembly virtual ISA - inherently means the CPU architecture of the eventual execution host is a property of the separately-maintained Wasm runtime chosen at deployment time, not of this build pipeline. This applies the Step 0 architecture-independent shortcut rather than Step 1's upstream-CI grading, since Step 1 would incorrectly penalize the project for lacking riscv64-specific CI/release infrastructure that its own design makes unnecessary.

**Pending work that could change the grade:** none identified. There is no open PR, tracking issue, or RISE-project engagement that bears on this project's classification. The one item that could meaningfully affect *practical* riscv64 usability - whether the operator's chosen Wasm runtime (Wasmtime, WasmEdge, WAMR, etc.) itself has mature riscv64 host support - is outside this project's scope and was only passingly, single-source noted in this session's research [NEEDS VERIFICATION]; it does not change this project's own color, since that runtime choice is external to WLR's build and release process. Separately, the project's `--platform linux/amd64` Docker pin and its archival/fork transition (Section 12) are real operational considerations for anyone wanting to build WLR itself on non-x86_64 infrastructure, but they do not affect the portability of its already-published artifacts.

## 14. Investment Analysis

RISE Project involvement was checked and found to be absent for this specific project (Section 12) - no prior RISE-funded work exists here to avoid duplicating.

### 14.1 Functional Enablement

None required for the project's core deliverable: the published `.wasm` artifacts are already portable to riscv64 hosts by construction, contingent only on the operator's chosen Wasm runtime. The only functional enablement gap is in the build pipeline's own portability - removing the hardcoded `--platform linux/amd64` Docker pin (Section 5) so the pipeline can run natively on non-x86_64 build hosts. This is a low-priority infrastructure nicety, not a blocker to riscv64 usability of existing releases.

### 14.2 Performance Optimization

Not applicable - this is not an optimization-purpose project per the color-coding model's Step 2 test (its value proposition is producing portable language runtimes, not outperforming a reference implementation on a specific host architecture).

### 14.3 CI/CD Infrastructure

No riscv64 CI exists and none is strictly necessary, since the project's output is architecture-independent. An optional, low-priority addition would be a smoke-test job that executes a produced `.wasm` artifact under a Wasm runtime on a native riscv64 CI runner (e.g. a RISE RISC-V runner, per [RISE's March 2026 announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) to positively confirm riscv64 execution rather than relying on the architecture-independence argument alone.

### 14.4 Ecosystem Enablement

Section 10 is omitted per the report's scope rules - this project is not published as a package with a dependent ecosystem (confirmed 404 on PyPI; not present in any Linux distribution's package index). The relevant "ecosystem" constraint for riscv64 usability is instead the maturity of Wasm runtimes on riscv64 hosts (Wasmtime, WasmEdge, WAMR), which is outside this project's scope and was not deep-verified in this session [NEEDS VERIFICATION].

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Remove hardcoded `--platform linux/amd64` Docker pin to allow the build pipeline itself to run on non-x86_64 CI hosts | 1-2 | Project maintainer / community fork | Low |
| CI/CD | Add an optional riscv64 execution smoke-test job (run produced `.wasm` under a Wasm runtime on a native riscv64 runner) | 1 | Project maintainer / community fork | Low |
| Dependencies | Author a dedicated `project-reports/oniguruma.md` and `project-reports/wasi-sdk.md` report, since these two direct/critical dependencies currently lack one | 1 | Independent research effort | Medium |
| Dependencies | Track and, where feasible, contribute upstream to close the OpenSSL non-constant-time AES fallback gap on riscv64 hardware lacking Zkn/Zvkned (a security concern affecting a dependency, not WLR itself) | Not sized in this session - see `project-reports/openssl.md` | Not this project's team | High (security, but owned by OpenSSL upstream) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [vmware-labs/webassembly-language-runtimes (repository)](https://github.com/vmware-labs/webassembly-language-runtimes)
- [webassemblylabs/webassembly-language-runtimes (community fork)](https://github.com/webassemblylabs/webassembly-language-runtimes)
- [vmware-labs/webassembly-language-runtimes GitHub Releases](https://github.com/vmware-labs/webassembly-language-runtimes/releases)
- [PyPI JSON API for "webassembly-language-runtimes" (404)](https://pypi.org/pypi/webassembly-language-runtimes/json)
- [Ubuntu 26.04 "resolute" package search (no results)](https://packages.ubuntu.com/search?keywords=WebAssembly%20Language%20runtimes&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index](https://archriscv.felixc.at/)
- [WASI SDK issue #607 - "Add riscv64 host platform support"](https://github.com/WebAssembly/wasi-sdk/issues/607)
- [Binaryen PR #6410 - riscv64 build-portability fix](https://github.com/WebAssembly/binaryen/pull/6410)
- [libjpeg-turbo issue #885 - riscv64 release binaries declined](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [libxml2 GNOME work item #971 - double-checked locking unsafe on riscv64 weak memory model](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE RISC-V Runners announcement, March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project members page](https://riseproject.dev/members/)
- [Frank Denis, "Performance of WebAssembly runtimes in 2026"](https://00f.net/2026/06/23/webassembly-runtimes-2026/)
- [wasmbounds/wasmbounds (2022 IISWC riscv64-vs-arm64-vs-x86_64 WebAssembly bounds-checking study)](https://github.com/wasmbounds/wasmbounds)
- Internal dependency deep-dive reports (repository-local, not public URLs): `project-reports/zlib.md`, `project-reports/binaryen.md`, `project-reports/openssl.md`, `project-reports/libjpeg-turbo.md`, `project-reports/libpng.md`, `project-reports/libxml2.md`, `project-reports/sqlite.md`, `project-reports/wabt.md`, `project-reports/bzip2.md`
