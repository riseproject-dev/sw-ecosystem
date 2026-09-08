---
title: Akri
parent: Project Reports
color: orange
---

# Akri

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Akri<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Akri is a CNCF Sandbox project that provides a Kubernetes Resource Interface for discovering and exposing "leaf devices" (cameras, USB devices, IP-based devices such as ONVIF cameras and OPC UA servers) as native Kubernetes resources at the edge. It is implemented in Rust and distributed as a set of container images (Agent, Controller, discovery handlers) deployed via a Helm chart. License is Apache 2.0 ([LICENSE](https://github.com/project-akri/akri/blob/main/LICENSE)).

Governance is defined in [GOVERNANCE.md](https://github.com/project-akri/akri/blob/main/GOVERNANCE.md): a three-tier model (Community member -> Maintainer -> Admin), with Maintainers named in `.github/CODEOWNERS` as a single flat "Global Owners" group. There is no fixed release cadence. Current active maintainers and their employers, per GitHub profile:

| Maintainer | Company |
|---|---|
| yujinkim-msft | Microsoft (PM, Azure Edge + Platform) |
| bindsi (Marcel Bindseil) | Microsoft (ISE) |
| gauravgahlot | IONOS Cloud |
| lilustga (Lior Lustgarten) | Microsoft |

Emeritus maintainers: bfjelds (Microsoft), jiria, romoh, adithyaj, johnsonshih (Microsoft), kate-goldenring (now Akamai, previously Fermyon/Microsoft), diconico07 (independent). Net assessment: governance and maintainership are heavily Microsoft-dominated, consistent with Akri's origin as an Azure IoT Edge team project, with IONOS Cloud as the sole active non-Microsoft corporate maintainer.

Community culture on new ports: no discussion thread, RFC, or proposal for riscv64 exists anywhere in the project's history beyond a single closed bug report (see Section 2). The project's stated architecture list is capped at amd64/arm64/armv7 with no formal tiering document beyond the `Makefile` build-target list. A new port would need to go through the standard PR/proposal process described in `GOVERNANCE.md` (proposals route through the `akri-docs` proposals folder); there is no evidence this has ever been attempted for RISC-V.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-09-15 | User opens issue reporting build failure on a riscv64 board (amd64-only intermediate Docker image causes `exec format error`) | [Issue #512](https://github.com/project-akri/akri/issues/512) |
| 2022-09-30 | Second user comment reporting similar error, in a WSL2 context | [Issue #512](https://github.com/project-akri/akri/issues/512) |
| 2022-10-02 | Maintainer (kate-goldenring) suggests using pre-built release images or building only a subset of containers, sidestepping rather than fixing the gap | [Issue #512](https://github.com/project-akri/akri/issues/512) |
| 2022-11-01 | Maintainer asks whether to keep the issue open for riscv64/WSL2 tracking or close it | [Issue #512](https://github.com/project-akri/akri/issues/512) |
| 2023-01-31 | Stale-bot automated comment after 90 days of inactivity | [Issue #512](https://github.com/project-akri/akri/issues/512) |
| 2023-05-01 | Issue auto-closed as `not_planned` (stale-bot pattern) | [Issue #512](https://github.com/project-akri/akri/issues/512) |

No further riscv64 activity exists after this. Key contributors: only two individuals appear in the riscv64 thread at all -- the original reporter (`advancedwebdeveloper`) and a maintainer (`kate-goldenring`, Microsoft/Fermyon at the time, now Akamai) who offered a workaround rather than a fix. **It is not fully upstream** -- there is no upstream port at all: no commit, no PR, no CI entry, no Makefile target, and the codebase at HEAD (`a2ee68343e83e6917ce5f648d3820a699b819fde`) contains zero references to "riscv" anywhere in code, Dockerfiles, CI configs, or docs.

## 3. Upstream Support Tier

There is no formal tiering document (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all return 404). The de-facto platform-support policy lives entirely in the top-level `Makefile`:

```
PLATFORMS ?= amd64 arm64 arm/v7
```

and is mirrored in the container build workflow `platforms:` field. This is release-blocking in the sense that it is the exhaustive list of what `make akri ... PUSH=1` and the `release: types: [published]`-triggered workflow can ever produce.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes (via QEMU) | No |
| CI tests | Yes (native) | No (build-only via QEMU; native tests only run on x86_64) | No |
| Official container image | Yes | Yes | No |
| Makefile `PLATFORMS` entry | Yes | Yes | No |
| Tracking issue | N/A (default) | N/A | None -- only a closed, not-planned bug report |

Source: [`Makefile`](https://github.com/project-akri/akri/blob/main/Makefile) line 13; [`build-rust-containers.yml`](https://github.com/project-akri/akri/blob/main/.github/workflows/build-rust-containers.yml) lines 96 and 176.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Akri has **zero architecture-conditional source code anywhere in the codebase, for any platform**. A full-tree search confirms:
- `grep -rn "cfg(target_arch" --include="*.rs" .` -> 0 matches in the entire codebase.
- No `#[cfg(target_arch = ...)]`, no SIMD/intrinsics, no per-arch module, no `arch/riscv`-style directory.
- `Cross.toml` contains no `[target.*]` sections -- only a global `[build.env]` passthrough block.

"Architecture support" in this project means exactly one thing: whether a platform triple is present in the `PLATFORMS`/`platforms:` build list consumed by Cargo cross-compilation and Docker Buildx/QEMU multi-arch image builds. Akri's own Rust code is fully portable, generic Rust with no JIT, no hand-written SIMD, and no assembly. There is therefore no per-architecture *implementation quality* to grade at the source level -- amd64, arm64, and arm/v7 all run the identical generic code path, differentiated only by the cross-compilation toolchain.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core Agent/Controller logic | Generic Rust, no arch-specific code | Generic Rust, no arch-specific code | Generic Rust, no arch-specific code -- but no build target exists |
| JIT / SIMD / hand-written assembly | None present | None present | None present |
| Crypto (via `ring`, `openssl`) | Hardware-accelerated (AES-NI etc., via dependency) | Hardware-accelerated (via dependency) | See Section 9 -- dependency-level, not Akri-level |

Given the total absence of any optimization-purpose code, Akri does not trigger the Step 2 optimization-purpose modifier of the readiness color model (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

Akri is a Rust/Cargo project -- there is no CMake, no `configure` script. Build docs: [`akri-docs/docs/development/building.md`](https://github.com/project-akri/akri-docs) and [`akri/docs/developer-guide.md`](https://github.com/project-akri/akri/blob/main/docs/developer-guide.md).

**Toolchain:** rustc 1.88.0 exactly, pinned via `rust:1.88-slim-bookworm` base image in `build/containers/Dockerfile.rust`. Cross-compilation uses `tonistiigi/xx` (the `xx-cargo`/`xx-clang` wrapper) with `clang` and `lld` as the linker/toolchain, installed via `apt-get install -y clang lld protobuf-compiler pkg-config mmdebstrap wget`. No GCC/Clang minimum version is separately pinned beyond whatever Debian bookworm ships.

**Supported architectures (exhaustive, from `Makefile` line 13 and `build/akri-containers.mk`):** `amd64`, `arm64`, `arm/v7`. No fourth architecture and no riscv64 buildx platform target is defined anywhere.

**Exact build commands (verbatim from the repo):**
```bash
# Multi-arch (all 3 platforms), build+push:
make akri PREFIX="ghcr.io/project-akri" LABEL_PREFIX="v$(cat version.txt)-dev" PUSH=1

# Single arch, load into local docker (LOAD mode pins PLATFORMS to uname -m automatically):
make akri-agent LOAD=1 PREFIX=akri LABEL_PREFIX=dev

# Explicit arch selection (no riscv64 option exists):
make akri PLATFORMS=arm64
```

**QEMU usage:** confirmed present for the three supported architectures only (`docker/setup-qemu-action@v3` + `docker/setup-buildx-action@v3` in `build-rust-containers.yml` lines 58/60 and 138/140), emulating `amd64/arm64/arm-v7`. No riscv64 QEMU target is registered anywhere; no `qemu-user-static`/`multiarch/qemu-user-static` riscv64 step exists in either repo.

**Known build failure on riscv64:** Issue #512 documents a real, reproduced failure -- attempting `make` on a physical riscv64 board fails at `build/containers/intermediate/Dockerfile.opencvsharp-build`, which pulls `mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim` (an amd64-only Microsoft base image with no riscv64 or even arm64 variant). Docker's QEMU emulation ran far enough to execute `RUN whoami`, which then failed with `exec format error`. This is a hard blocker specific to the OpenCV/OpenCVSharp intermediate build path (used for one OpenCV-based discovery/ML capability), not necessarily the main Agent/Controller build path, which uses the generic `Dockerfile.rust` + `xx` toolchain and has no such amd64-only dependency. Neither path is currently exercised or validated for riscv64, so this remains an open, undemonstrated question for the main build path and a confirmed blocker for the OpenCV intermediate path.

Full `build/containers/Dockerfile.rust` content is reproduced in the underlying research; it targets `$TARGETPLATFORM` via Docker buildx standard platform tags only, drawn from the same three-entry `PLATFORMS` set.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Agent container image | Available | Available | Not available |
| Controller container image | Available | Available | Not available |
| udev discovery handler | Available | Available | Untested -- no riscv64 build exists to validate |
| ONVIF discovery handler | Available | Available | Untested |
| OPC UA discovery handler | Available | Available | Untested (depends on `openssl`, itself riscv64-mature -- see Section 9) |
| debug-echo discovery handler | Available | Available | Untested |
| OpenCV-based intermediate build | Available | Available (per `PLATFORMS`) | Confirmed broken (Issue #512) due to amd64-only Microsoft base image |
| Helm chart deployment | Available | Available | Would deploy but no matching container image exists to pull |

**Functional gaps:** a riscv64 user cannot deploy Akri at all today -- no container image is published for any component. **Performance gaps:** not assessable; no benchmark data exists (see Section 11). **Security hardening gaps:** not assessable at the Akri level (no arch-specific hardening code exists in Akri itself); see Section 9 for dependency-level crypto acceleration gaps (`ring` lacks RVV/Zvk paths on riscv64). **NaN/floating-point semantics issues:** none found or applicable -- Akri contains no numerics-heavy code of its own.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was independently re-verified twice: (1) a full-repo grep of all 11 workflow files, and (2) a live re-fetch of `build-rust-containers.yml` directly from `raw.githubusercontent.com`, both showing zero occurrences of "riscv" in any workflow.

**Direct evidence, `build-rust-containers.yml` lines 96 and 176 (verbatim, live-fetched):**
```
platforms: linux/amd64,linux/arm64,linux/arm/v7
```
This is the complete platform list for both jobs (`build-others`, `build-agents`) in the only multi-arch build workflow in the repository.

All 11 workflow files (`auto-update-dependencies.yml`, `build-rust-containers.yml`, `run-test-cases.yml`, `check-versioning.yml`, `run-helm.yml`, `security-audit.yml`, `build-opencv-base-container.yml`, `run-tarpaulin.yml`, `update-versions.yml`, `cancel-previous-pr-workflows.yml`, `check-rust.yml`) declare `runs-on: ubuntu-latest` -- standard x86_64 GitHub-hosted runners. No riscv64 runner label, no RISE runner reference (`riseproject-dev` or similar), and no self-hosted runner appears anywhere. `run-test-cases.yml` and `run-tarpaulin.yml` run natively on `ubuntu-latest` with no QEMU/buildx step at all -- i.e., the entire test suite runs on x86_64 only, even the amd64 build is the only one that gets tests, and arm64/armv7 are build-only via QEMU (never test-executed).

Corroborating: `mcp__github__search_code` for `riscv repo:project-akri/akri` -> `{"total_count":0}`.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native) | Yes (QEMU) | No |
| CI test execution | Yes (native, `run-test-cases.yml`/`run-tarpaulin.yml`) | No (build-only) | No |
| Runner hardware | `ubuntu-latest` (x86) | `ubuntu-latest` + QEMU emulation | None |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

No riscv64 binary or package exists for Akri in any channel checked:

- **GitHub releases:** the build matrix that produces every container/release asset (`Makefile` `PLATFORMS`, `build-rust-containers.yml` `platforms:`) never includes riscv64, so no release asset with "riscv64" in its filename can exist. Direct API/asset-list access was blocked in this research session (repo not attachable with push credentials, `api.github.com` proxy-blocked), but the build-system source of truth rules this out definitively rather than by incomplete sampling.
- **PyPI:** `https://pypi.org/pypi/akri/json` -> HTTP 404. No package named `akri` exists (Akri is not a Python project and has never published to PyPI).
- **Ubuntu 26.04 "resolute":** `https://packages.ubuntu.com/search?keywords=akri&suite=resolute&searchon=names&section=all` -> "Sorry, your search gave no results." No `akri`, `python3-akri`, or `libakri` package for any architecture.
- **Arch Linux RISC-V port:** `https://archriscv.felixc.at/?q=akri` -> no `akri` package listed.
- **npm, Maven, OCI (non-GitHub registries):** not applicable -- Akri publishes only via GitHub Container Registry / its own container pipeline, covered above.

**What a user must do to get a working binary on riscv64 today:** there is none available through any official or third-party channel. A user would have to build from source, and the OpenCV intermediate build path is confirmed broken (Issue #512); the main Agent/Controller path via `Dockerfile.rust` + `xx` has never been attempted or validated for riscv64 and would require first adding `riscv64` to `Makefile` `PLATFORMS`, confirming `xx`/Debian bookworm riscv64 support, and validating the `xx-clang`/`xx-cargo` toolchain path for `riscv64-unknown-linux-gnu`.

## 9. Dependencies

| Dependency | Role in Akri | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `openssl`/`openssl-sys` 0.10.81/0.9.117 | TLS/crypto backend (`akri-opcua`, `webhook-configuration`, `tokio-openssl`) | Yes -- `libssl-dev` present in Ubuntu 26.04 riscv64; mature upstream riscv64 port active since 2022 with Zvk vector-crypto support | Yes -- active upstream riscv64 CI | Yes -- source releases include riscv64 asm targets upstream | Mature; see `project-reports/openssl.md` |
| `ring` 0.17.14 | Crypto provider for `rustls` (via `kube-client`, securing Agent/Controller <-> Kubernetes API TLS) | Yes -- `riscv64gc-unknown-linux-gnu` is in ring's own CI matrix | Yes -- ring's `ci.yml` explicitly runs the coverage/test job for `riscv64gc-unknown-linux-gnu` under QEMU on `ubuntu-24.04` | Yes, but no hand-written assembly acceleration on riscv64 -- falls back to the portable Rust/C constant-time implementation (unlike x86_64/aarch64) | History: [briansmith/ring#1182](https://github.com/briansmith/ring/issues/1182), [#1419](https://github.com/briansmith/ring/issues/1419), [#1430](https://github.com/briansmith/ring/issues/1430), landed via [PR #1506](https://github.com/briansmith/ring/pull/1506); functionally correct, no RVV/Zk-crypto acceleration -- a performance gap vs. OpenSSL's path |
| `zstd`/`zstd-sys` 0.13.3/2.0.16+zstd.1.5.7 | Compression codec for `actix-http` (webhook middleware) | Yes -- `libzstd-dev` present in Ubuntu 26.04 riscv64; base riscv64 build/correctness stable since a 2018 fix | Base correctness yes; RVV vectorization PRs (#4557, #4596, #4622, #4629, #4643, #4668) stalled since late 2025 awaiting maintainer review | Yes, fully upstream | Single-maintainer review bottleneck, not correctness; see `project-reports/zstd.md` |
| `flate2` 1.1.9 (+ `miniz_oxide` 0.8.9, `crc32fast` 1.5.0) | gzip/deflate for `actix-http` middleware | Yes -- pure-Rust `miniz_oxide` backend, no C dependency in this build | N/A -- portable, Tier-2 `riscv64gc` rustc target covers it | Yes, trivially | `crc32fast` SIMD fast paths are x86/aarch64 only; falls back to scalar on riscv64 (correctness unaffected) |
| `brotli`/`brotli-decompressor` 8.0.4 | Brotli compression for `actix-http` middleware | Yes -- pure-Rust reimplementation, not a binding to Google's C `libbrotli` | N/A -- portable, no arch-specific path | Yes, trivially | None known for this crate (note: `project-reports/brotli.md` covers the unrelated Google C library) |
| `udev`/`libudev-sys` 0.5.0/0.1.4 | FFI binding to system `libudev` -- core to `akri-udev`, Akri's primary hardware-discovery mechanism | `libudev-dev` present in Ubuntu 26.04 riscv64 (259.5-0ubuntu3); straightforward pkg-config FFI binding, no known riscv64-specific issue found | No dedicated CI signal found for this small/unmaintained crate | Should build wherever `libudev-dev` + a riscv64 C toolchain exist | [NEEDS VERIFICATION] -- not independently vetted on real riscv64 hardware; functionally the single most critical native dependency for Akri's core purpose |
| `blake2` 0.9.2, `sha1` 0.6.1/0.10.7/0.11.0 | Pure-Rust hashing (`agent` instance-ID hashing; `akri-onvif` WS-Discovery digest auth) | Yes -- pure Rust, no SIMD/assembly | N/A | Yes, trivially | None |

**Key risk assessment:** `udev`/`libudev-sys` is the dependency most worth independently validating on real riscv64 hardware -- it directly implements Akri's USB/device discovery function and has no confirmed upstream riscv64 track record, unlike `openssl`/`zstd`. `ring` works correctly but silently loses hardware-crypto acceleration on riscv64 -- a performance, not correctness, concern for the control-plane TLS channel. The larger gap remains Akri's own CI/release pipeline (Section 7-8), which is independent of dependency readiness and is the actual blocker.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#512](https://github.com/project-akri/akri/issues/512) | "The requested image's platform (linux/amd64) does not match the detected host platform (linux/riscv64) and no specific platform was requested" | Closed, `not_planned`, 2023-05-01 | Build-blocking (for the OpenCV intermediate path only) | Not a correctness or performance bug -- a Docker cross-arch build failure caused by an amd64-only Microsoft base image (`mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim`). No fix attempted; maintainer suggested a workaround (use pre-built images) rather than resolving the underlying gap. |

No open riscv64 bugs exist (`is:open riscv repo:project-akri/akri` -> 0 results). No performance benchmark data of any kind exists for Akri on RISC-V from any source searched (GitHub issues, WebSearch, RISE blog). No correctness (NaN/floating-point) bugs were found or are applicable -- Akri contains no numerics-heavy code. An unrelated closed advisory, RUSTSEC-2021-0131 (a Brotli buffer-overflow issue, [#439](https://github.com/project-akri/akri/issues/439)), is unrelated to RISC-V and closed since 2023.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has stated technical or policy opposition to riscv64 support; the topic has simply never been substantively raised beyond the single 2022 bug report, which was closed via stale-bot auto-close after the reporter did not respond to a maintainer's clarifying question, not via an active decision against the platform.

**Technical blockers:**
1. `Makefile` `PLATFORMS` and the `build-rust-containers.yml` `platforms:` field would need a `riscv64` entry added.
2. The `xx`/Debian bookworm riscv64 cross-compilation path (`xx-clang`/`xx-cargo` toolchain, used for the main Agent/Controller build) has never been validated for `riscv64-unknown-linux-gnu`.
3. The OpenCV intermediate build (`Dockerfile.opencvsharp-build`) is confirmed broken on riscv64 because its base image (`mcr.microsoft.com/dotnet/core/aspnet`) has no riscv64 variant -- this is a Microsoft-side blocker outside Akri's control unless the intermediate build is redesigned or an alternative base image is adopted.
4. No riscv64 CI runner (RISE or otherwise) is configured anywhere in the project's 11 workflow files.

**Organizational blockers:** a small, Microsoft/IONOS-led maintainer base (4 active maintainers) with no dedicated capacity signaled for new-architecture work; no RISE Project engagement of any kind has been found (see Section 14).

**Acceptance probability:** [NEEDS VERIFICATION] -- no maintainer statement exists either way. Given Apache 2.0 licensing, a standard CNCF Sandbox governance process (`GOVERNANCE.md` proposal path), and the absence of any stated objection, a well-formed PR adding riscv64 to the build matrix plus CI would plausibly be reviewable through normal process, but this is inference, not a sourced maintainer commitment.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** Akri has no upstream riscv64 CI of any kind -- all 11 GitHub Actions workflow files run exclusively on `ubuntu-latest`, and the only multi-arch build workflow's `platforms:` field is fixed to `linux/amd64,linux/arm64,linux/arm/v7` with riscv64 absent ([`build-rust-containers.yml`](https://github.com/project-akri/akri/blob/main/.github/workflows/build-rust-containers.yml) lines 96, 176). No Linux distribution (Ubuntu 26.04, Arch RISC-V) ships an `akri` package for any architecture, so the distribution floor does not apply -- there is no distro package to floor on. This is not a confirmed-broken (red) state for the project as a whole: the one documented build failure ([Issue #512](https://github.com/project-akri/akri/issues/512)) is scoped to a specific amd64-only intermediate OpenCV container, not the main Rust build path, and no evidence shows the main Agent/Controller build actually fails on riscv64 -- it has simply never been attempted. This is the textbook "no upstream CI, untested, unreleased" case that the color model assigns orange.
- **Optimization gap:** N/A. Akri is not an optimization-purpose project -- it is a device-plugin orchestration framework with zero architecture-conditional source code of its own (no JIT, SIMD, or hand-written assembly anywhere in the codebase, confirmed by a full-tree `cfg(target_arch` search returning 0 matches). The Step 2 modifier of the color model does not apply.
- **Pending work that could change the grade:** none identified. No open PR, no reopened tracking issue, and no RISE Project involvement exists for Akri -- confirmed by checking the full RISE blog archive (24 posts, 2024-05-15 through 2026-08-24), the `riseproject-dev` GitHub org (25 repos), and the RISE Python wheel builder (79 packages), none of which mention or include Akri. The sole trace of Akri in RISE-adjacent infrastructure is an unevaluated candidate entry in this repository's own intake queue (`project-reports/.queue.yml`), which is not evidence of funded or in-progress work.

## 14. Investment Analysis

RISE has performed no work on Akri to date (Section 13) -- there is nothing to net out of the sizing below; every item is unstarted.

### 14.1 Functional Enablement

Add `riscv64` to `Makefile` `PLATFORMS` and `build-rust-containers.yml` `platforms:`; validate the `tonistiigi/xx` cross-compilation toolchain path for `riscv64-unknown-linux-gnu` against Debian bookworm (the base of `Dockerfile.rust`); confirm `libssl-dev`, `libudev-dev`, `libv4l-dev` resolve correctly under `xx-apt-get` for riscv64 (all three are confirmed present in Ubuntu 26.04 riscv64, per Section 9, but not yet verified under the `xx`/bookworm cross-toolchain specifically); build and smoke-test the Agent, Controller, and each discovery handler (udev, ONVIF, OPC UA, debug-echo) container image on real or QEMU-emulated riscv64 hardware. The OpenCV intermediate build path (Section 5) is a separate, harder problem requiring either an alternative to the amd64-only Microsoft base image or exclusion of that discovery capability from the riscv64 target set.

### 14.2 Performance Optimization

Not applicable at the Akri level -- no architecture-specific code exists to optimize (Section 4). At the dependency level, `ring`'s lack of RVV/Zvk-crypto acceleration on riscv64 (Section 9) is a genuine but likely low-priority performance gap for the Agent-to-API-server TLS channel; closing it is upstream `ring` work, not Akri-specific work.

### 14.3 CI/CD Infrastructure

Add a riscv64 entry to `build-rust-containers.yml`'s QEMU/buildx matrix (following the existing arm64/armv7 pattern) for build coverage; a native riscv64 test job (paralleling `run-test-cases.yml`/`run-tarpaulin.yml`, which today run amd64-only) would be needed to reach test-execution parity and unlock blue/green. No RISE RISC-V Runners integration exists to leverage today (Section 13) -- this would need to be requested/onboarded separately if desired.

### 14.4 Ecosystem Enablement

Not applicable -- Akri has no dependent package ecosystem of its own (it is a Kubernetes device-plugin framework consumed via Helm chart and container image, not a library with a package-manager-based dependent ecosystem). Section 10 is omitted per report scope rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `Makefile`/`build-rust-containers.yml`; validate `xx`/bookworm cross-toolchain for `riscv64-unknown-linux-gnu` | 2-3 | Akri maintainers or contributor PR | High |
| Functional | Build/smoke-test Agent, Controller, udev/ONVIF/OPC UA/debug-echo handler images on riscv64 (QEMU or real hardware) | 2-3 | Akri maintainers or contributor PR | High |
| Functional | Resolve or scope out the OpenCV intermediate build (`Dockerfile.opencvsharp-build`) amd64-only base image blocker | 1-2 (investigation) + unknown (fix) | Akri maintainers | Medium |
| Dependencies | Independently validate `libudev-sys`/`udev` crate on real riscv64 hardware (no confirmed upstream riscv64 CI track record) | 1 | Contributor | Medium |
| CI/CD | Add riscv64 to the QEMU/buildx build matrix; add a native/QEMU riscv64 test-execution job | 1-2 | Akri maintainers | Medium |
| Performance | Track upstream `ring` RVV/Zvk-crypto support (no Akri-side work required) | 0 (monitor only) | N/A (upstream `ring`) | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [project-akri/akri repository](https://github.com/project-akri/akri)
- [Akri documentation homepage](https://docs.akri.sh/)
- [Issue #512 -- riscv64 build failure](https://github.com/project-akri/akri/issues/512)
- [GOVERNANCE.md](https://github.com/project-akri/akri/blob/main/GOVERNANCE.md)
- [LICENSE](https://github.com/project-akri/akri/blob/main/LICENSE)
- [Makefile](https://github.com/project-akri/akri/blob/main/Makefile)
- [.github/workflows/build-rust-containers.yml](https://github.com/project-akri/akri/blob/main/.github/workflows/build-rust-containers.yml)
- [.github/workflows/run-test-cases.yml](https://github.com/project-akri/akri/blob/main/.github/workflows/run-test-cases.yml)
- [.github/workflows/run-tarpaulin.yml](https://github.com/project-akri/akri/blob/main/.github/workflows/run-tarpaulin.yml)
- [build/containers/Dockerfile.rust](https://github.com/project-akri/akri/blob/main/build/containers/Dockerfile.rust)
- [build/containers/intermediate/Dockerfile.opencvsharp-build](https://github.com/project-akri/akri/blob/main/build/containers/intermediate/Dockerfile.opencvsharp-build)
- [Cross.toml](https://github.com/project-akri/akri/blob/main/Cross.toml)
- [akri-docs repository](https://github.com/project-akri/akri-docs)
- [PyPI JSON API check for "akri"](https://pypi.org/pypi/akri/json) (404, confirms no PyPI package)
- [Ubuntu 26.04 "resolute" package search for "akri"](https://packages.ubuntu.com/search?keywords=akri&suite=resolute&searchon=names&section=all) (no results)
- [Arch Linux RISC-V port package search for "akri"](https://archriscv.felixc.at/?q=akri) (no results)
- [briansmith/ring CI workflow](https://github.com/briansmith/ring/blob/main/.github/workflows/ci.yml) (riscv64gc-unknown-linux-gnu build+test job)
- [briansmith/ring issue #1182](https://github.com/briansmith/ring/issues/1182)
- [briansmith/ring issue #1419](https://github.com/briansmith/ring/issues/1419)
- [briansmith/ring issue #1430](https://github.com/briansmith/ring/issues/1430)
- [briansmith/ring PR #1506](https://github.com/briansmith/ring/pull/1506)
- [briansmith/ring issue #2022](https://github.com/briansmith/ring/issues/2022)
- [RISE Project blog archive](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub org](https://github.com/riseproject-dev)
- [project-reports/openssl.md (internal report)](https://github.com/project-akri/akri) (referenced for OpenSSL riscv64 maturity)
- [project-reports/zstd.md (internal report)](https://github.com/project-akri/akri) (referenced for zstd RVV PR status)
- [project-reports/brotli.md (internal report)](https://github.com/project-akri/akri) (referenced for context on the unrelated Google C brotli library)
- [project-reports/.queue.yml (internal intake queue)](https://github.com/project-akri/akri) (Akri's unevaluated candidate entry)
