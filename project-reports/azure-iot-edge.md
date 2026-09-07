---
title: Azure IoT Edge
parent: Project Reports
color: orange
---

# Azure IoT Edge

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Azure IoT Edge<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Azure IoT Edge is Microsoft's edge-computing runtime for deploying containerized workloads ("modules") to IoT devices and orchestrating them from Azure IoT Hub. The codebase is polyglot: `edgelet/` (the on-device security daemon and module/workload lifecycle manager) is written in Rust with a Cargo workspace, while `edge-agent` and `edge-hub` (deployment orchestration and message routing) are .NET/C# (`Microsoft.Azure.Devices.Edge.sln`).

**Governance:** Single-vendor, Microsoft-governed. There is no independent foundation (not CNCF, not Eclipse, not Linux Foundation). The repository follows the generic Microsoft Open Source Code of Conduct, which is Microsoft's standard boilerplate applied across its GitHub repos, not a project-specific charter. There is no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file; the closest artifact is an unannotated `owners.txt` listing roughly 19 GitHub usernames with no roles or company affiliations.

**License:** MIT, confirmed both in the repository `LICENSE` file and on the [product homepage](https://azure.microsoft.com/en-us/products/iot-edge).

**Corporate sponsors:** 100% Microsoft. Of ~1,574 commits examined (Aug 2020 - Aug 2026), 490 are from `@microsoft.com` addresses directly, and the remainder that use `users.noreply.github.com` belong to identifiable Microsoft/Azure IoT Edge team members (per overlap with `owners.txt`). No commits or maintainer presence from any non-Microsoft company (Arm, Intel, Canonical, Red Hat, etc.) were found. "IoT Edge Bot" (226 commits) and "GitHub Nightly Merge Action" (36 commits) are CI automation, not human contributors.

**Community culture on new ports:** There is no evidence of any community engagement on porting to a new architecture, ever, for any architecture. No issue, PR, or discussion thread raises RISC-V or any other new hardware target. Combined with the single-vendor governance model and absence of a documented contribution-tier policy for platforms, adding a new architecture reads as something that would have to originate as a Microsoft-internal roadmap/build-matrix decision rather than a community-contributable path.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been proposed, started, or discussed | Confirmed by repo-wide commit/issue/PR search, see Section 11 |

Zero commits mention "riscv" or "risc-v" in messages or file content across all 1,574 fetched commits (2020-08-14 to 2026-08-31). GitHub-wide commit search (`riscv repo:Azure/iotedge`) and issue/PR searches ("riscv", "riscv64", "RISC-V") each return 0 genuine results.

The actual, documented port history (inferred from build pipeline templates, since no `PLATFORMS.md` exists) is: `linux/amd64` -> `linux/arm/v7` (arm32v7) -> `linux/arm64` (arm64v8), plus a Windows/ARM attempt for some components. These are the only Linux container architectures Microsoft builds and publishes official images for.

**Is it fully upstream?** Not applicable - there is nothing to upstream. No RISC-V work exists in any branch, fork, or downstream patch set that was located.

**Key contributors:** None (no RISC-V-related contribution of any kind exists to attribute).

## 3. Upstream Support Tier

There is no formal, documented tier policy. Platform support is de facto defined by hard-coded architecture lists inside Azure Pipelines build templates (`builds/misc/templates/build-images.yaml`, `builds/misc/templates/build-packages.yaml`), which enumerate `amd64`, `arm32v7`, and `arm64v8` as the only supported build targets. There is no documented process or acceptance criteria for adding a new architecture.

| Architecture | CI builds | CI tests | Official binaries/images | Support status |
|---|---|---|---|---|
| amd64 | Yes (Azure Pipelines) | Yes | Yes (Docker images, Debian/RPM packages) | Tier 1 (de facto) |
| arm64 | Yes (Azure Pipelines) | Yes | Yes (Docker images) | Tier 1 (de facto) |
| arm32v7 | Yes (Azure Pipelines) | Yes | Yes (Docker images) | Tier 1 (de facto) |
| riscv64 | No | No | None | Not supported; absent from every build/CI/release artifact |

Source: [Azure/iotedge](https://github.com/Azure/iotedge), `builds/` directory (45 YAML files reviewed), and the official [IoT Edge supported platforms doc](https://learn.microsoft.com/en-us/azure/iot-edge/support) (updated 2026-07-16), which lists AMD64, ARM32v7, and ARM64 as the complete Tier 1/Tier 2 architecture set for IoT Edge 1.6 LTS. RISC-V does not appear anywhere in that table.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Azure IoT Edge is not a hand-tuned, per-architecture codebase. GitHub code search against `Azure/iotedge` for `riscv`, `vfloat32m1_t`, `rvv`, `riscv64`, `extension:S` (assembly files), and `path:arch` all return 0 results. There is no `arch/riscv/` directory, no JIT backend, no RVV/Zba/Zbb intrinsics, and no riscv64-specific dispatch of any kind. A search for `simd` returns exactly one hit, `simd-adler32`, a generic Rust crate name in `edgelet/Cargo.lock` (a zlib/compression dependency), unrelated to architecture-specific SIMD code.

The project's entire notion of "architecture support" consists of three things, none of which is per-architecture source code:
1. Cross-compilation targets (Rust triples, e.g. `armv7-unknown-linux-gnueabihf`, `aarch64-unknown-linux-gnu`) selected in Azure Pipelines YAML.
2. Docker multi-arch image tags (`linux/amd64`, `linux/arm/v7`, `linux/arm64`).
3. Trivial runtime string constants (e.g., an `ARCH` enum used for diagnostics/telemetry) - plain string literals, not `#ifdef`-guarded code paths.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT/codegen | N/A (no in-repo JIT; relies on .NET CoreCLR RyuJIT, external dependency) | N/A (same) | N/A - and CoreCLR RyuJIT has no GA riscv64 support (see Section 9) |
| SIMD/vectorization | None found in-repo | None found in-repo | None found in-repo (not applicable - no hand-tuned SIMD exists for any architecture in this codebase) |
| Crypto | Delegated to OpenSSL/`openssl-sys` crate and .NET's TLS stack | Same | Same in principle, but blocked transitively by .NET riscv64 gap |
| Assembly | None found | None found | None found |
| Build-target labels only | `x86_64-unknown-linux-gnu`, `linux/amd64` | `aarch64-unknown-linux-gnu`, `linux/arm64` | Absent from every build script and Dockerfile |

Conclusion: this is not a partial or stubbed riscv64 implementation - there is no riscv64 implementation at all, complete or otherwise, and the amd64/arm64 "implementations" are themselves just build-target labels rather than hand-tuned code, so the usual full/partial/minimal grading rubric for optimization-purpose projects does not apply to this project (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

Azure/iotedge does not use CMake. `find . -iname "CMakeLists.txt"` and `find . -iname "*.cmake"` both return zero results anywhere in the repository. There is no `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md`.

The build system is Cargo (for `edgelet/`) plus MSBuild/.NET SDK (for `edge-agent`/`edge-hub`), driven by Azure Pipelines YAML under `builds/` and by a cross-compilation helper script, `scripts/linux/cross-platform-rust-build.sh`. Its full `PACKAGE_ARCH` case statement supports exactly:

| `--arch` value | Rust target triple | Cross-toolchain packages used |
|---|---|---|
| `debian12` | native x86_64 (glibc) | host GCC |
| `debian12.musl` | `x86_64-unknown-linux-musl` | musl toolchain |
| `debian12.arm32v7` | `armv7-unknown-linux-gnueabihf` | `gcc-arm-linux-gnueabihf`, `g++-arm-linux-gnueabihf` |
| `debian12.aarch64` | `aarch64-unknown-linux-gnu` | `gcc-aarch64-linux-gnu`, `g++-aarch64-linux-gnu` |

There is no `riscv64gc-unknown-linux-gnu` (or any riscv) case in this script, and no riscv64 cross-toolchain package (e.g. `gcc-riscv64-linux-gnu`) is referenced anywhere. Dockerfiles exist only for `amd64`, `arm32v7`, and `arm64v8` under `edge-modules/*/docker/linux/`; no riscv64 Dockerfile exists to build one.

Cross builds run inside Docker containers per-architecture via `docker run --platform ...`, relying on binfmt/QEMU emulation set up by the CI host - but only for the three architectures listed above. There is no equivalent for riscv64.

**What would need to happen to build for riscv64:** add a `debian12.riscv64` case to `cross-platform-rust-build.sh` targeting `riscv64gc-unknown-linux-gnu`, install a riscv64 cross-GCC/Clang toolchain (Ubuntu 24.04+/Debian trixie+ carry `gcc-riscv64-linux-gnu` in their default repos), add a riscv64 Dockerfile per module under `edge-modules/*/docker/linux/`, and extend the Azure Pipelines `build-images.yaml`/`build-packages.yaml` agent-image matrix. None of this exists today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| edgelet daemon build | Yes | Yes | No - no target defined |
| edge-agent / edge-hub (.NET) build | Yes | Yes | No - blocked by .NET runtime (see Section 9) |
| Official Docker images | Yes | Yes | No |
| Official Debian/RPM packages | Yes | Yes | No |
| CI test execution | Yes | Yes | N/A - no CI job exists |
| Container runtime chain (runc/containerd/Docker Engine) available on target OS | Yes (Ubuntu 26.04 resolute) | Yes | Partially - containerd and runc ship riscv64 binaries; Docker Engine has no upstream riscv64 CI/official binary (community distro build only, see Section 9) |

**Functional gap:** The entire managed-code control plane (`edge-agent`, `edge-hub`) cannot run on riscv64 at all, because it requires the .NET runtime, which has no riscv64 package on any distribution channel checked (Section 9). This is a hard functional blocker, not a performance gap.

**Performance gap:** Not applicable in the SIMD/vectorization sense - no hand-tuned per-architecture code exists in this codebase for any target (Section 4), so there is no "missing SIMD" delta to characterize between arm64 and a hypothetical riscv64 port.

**Security hardening gaps:** Data not available - no riscv64 build exists to evaluate hardening flags, ASLR behavior, or mitigation coverage against.

**NaN / floating-point semantics issues:** Data not available for Azure IoT Edge itself (no riscv64 build exists). Note for context: the underlying .NET runtime tracks a general "RISC-V SIMD support" issue ([dotnet/runtime#131926](https://github.com/dotnet/runtime/issues/131926)) and has had reported RISC-V-specific NaN propagation bugs in its JIT ([dotnet/runtime#119897](https://github.com/dotnet/runtime/issues/119897)), which would be inherited by any future `edge-agent`/`edge-hub` riscv64 build, but this has not been tested against Azure IoT Edge specifically.

## 7. CI/CD Infrastructure

`.github/workflows/` contains exactly two files, neither a build/test pipeline:
- `issue-labeler.yml` - triggers on new issues, runs `github/issue-labeler` on `ubuntu-latest`. No build step, no architecture logic.
- `stale.yml` - daily cron, runs `actions/stale` on `ubuntu-latest`. No build step, no architecture logic.

The actual build/test CI is Azure Pipelines, defined in 45 YAML files under `builds/` (checkin, ci, e2e, misc, release, service). Grep for `riscv` (and `risc-v`, `risc_v`, `rv64`, `rv32`) across the entire repository tree: 0 matches, 0 files. Architecture tokens actually found in those pipeline files: `amd64` (106 hits), `arm64` (100 hits), `arm32v7` (28 hits).

Confirmed absent: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, and any `azure-pipelines*.yml` file (Azure Pipelines definitions live under `builds/*.yaml`, referenced from an Azure DevOps project configuration not stored in this repo).

No RISE RISC-V runners are referenced anywhere (no `riseproject-dev` string, no RISE runner labels).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (Azure Pipelines) | Yes (Azure Pipelines) | No |
| CI tests | Yes | Yes | N/A |
| Release-blocking | Yes (de facto, per hard-coded build matrix) | Yes | N/A |
| Hardware/QEMU | Native + emulation per pipeline agent config | Emulation (`agent-aziotedge-ubuntu-22.04-arm64` images referenced) | N/A |

Source: [Azure/iotedge builds/ directory](https://github.com/Azure/iotedge/tree/main/builds).

## 8. Distribution and Release Status

No official riscv64 binary, package, or build artifact exists for Azure IoT Edge in any channel checked:

- **GitHub releases:** Checked the three most recent releases (1.6.2, 1.6.1, 1.5.44). Each carries only auto-generated GitHub source archives (`<tag>.zip`, `<tag>.tar.gz`) - no platform binaries of any architecture, riscv64 included. This matches the product's real distribution model (Docker images and Debian/RPM packages via separate pipelines), not GitHub release binaries.
- **PyPI:** `https://pypi.org/pypi/azure-iot-edge/json` returns HTTP 404 - no such package exists. (Azure IoT Edge is not Python-distributed; not applicable as a PyPI-native product.)
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/azure-iot-edge/` redirects to the same 404 on PyPI. No entry.
- **Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search for "Azure IoT Edge" returns no matches for any architecture, including riscv64.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=azure%20iot%20edge)): no matching package.

**What a user would have to do to get a working binary today:** there is none to get. A riscv64 build would first require (a) a riscv64 target added to the edgelet cross-compile script and pipeline (Section 5), and (b) a working .NET riscv64 runtime to host `edge-agent`/`edge-hub` (Section 9) - neither exists upstream as of this report.

## 9. Dependencies

Azure IoT Edge has no single dependency manifest - it is polyglot: `edgelet/` (Rust, Cargo workspace) and `edge-agent`/`edge-hub` (.NET, `Microsoft.Azure.Devices.Edge.sln`). Distro-level dependency availability was checked against Ubuntu 26.04 (resolute).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| **.NET Runtime** | Hosts `edge-agent`/`edge-hub` (the entire managed-code control plane) | No official build; no Ubuntu package for riscv64 | N/A | None | [dotnet/runtime#36748](https://github.com/dotnet/runtime/issues/36748) (open master tracking issue), [dotnet/runtime#131926](https://github.com/dotnet/runtime/issues/131926) (RISC-V SIMD support, open). Additional churn: [#132730](https://github.com/dotnet/runtime/issues/132730) JIT build break, [#119897](https://github.com/dotnet/runtime/issues/119897) NaN propagation, [#131543](https://github.com/dotnet/runtime/issues/131543) RISC-V32 Zacas, [#112299](https://github.com/dotnet/runtime/issues/112299) TPL bug on RISC-V hardware. **This is the single largest blocker for Azure IoT Edge on riscv64.** |
| **OpenSSL** | TLS/crypto for edgelet's `openssl`/`openssl-sys` crates and .NET's TLS stack | Yes - first-class RV64I/Zbb/Zbc/Zvk asm targets since 2022 | Yes - dedicated `riscv-more-cross-compiles.yml` CI (13 configs) | Yes - vector-crypto optimizations ship in mainline (3.4-4.0) | Non-blocking flaky item: intermittent `test_lhash` failure on linux-riscv64 CI |
| **zlib** | DEFLATE compression, pulled transitively via `flate2`/`zlib-rs` and .NET's `System.IO.Compression` | Yes (pure C, correctness only) | No Linux riscv64 target in the cross-compile CI matrix | No riscv64-specific optimization has ever merged | Unmerged RVV Adler32 PR pending since 2025-10 [NEEDS VERIFICATION on exact PR number] |
| **glibc** | Base C library / dynamic linker under every native binary in the stack | Yes, official port since glibc 2.27 | No confirmed passing full-suite run; both riscv64 Buildbot builders reported offline as of 2026 | Yes, in every glibc release and in Ubuntu/Debian | CI builder outage is the practical blocker |
| **Docker Engine** (`moby/moby`) | Container engine edgelet drives to pull images and run modules | Yes at distro level (Ubuntu/Debian cross-build it); riscv64 is not in upstream's own `docker-bake.hcl` matrix | No upstream CI on riscv64 | No official upstream binary; Ubuntu/Debian ship a community-built package | [moby/moby#44319](https://github.com/moby/moby/issues/44319) "Adding support for RISC-V" - open, unresolved |
| **containerd** | OCI runtime supervisor beneath Docker Engine | Yes - nightly cross-compile CI, static binaries produced | No integration-test CI on riscv64 | Yes - riscv64 release binaries shipped since v1.6.8 (2022) | [containerd#13020](https://github.com/containerd/containerd/issues/13020) "Add linux/riscv64 to CI test matrix" - open |
| **runc** | Low-level OCI runtime that spawns edge-module processes | Cross-compiled only, no native CI runner | Integration test image exists but not executed in CI on riscv64 | Yes - signed riscv64 binary shipped since v1.2.0 (2022); static PIE unsupported (dynamic PIE only) | [opencontainers/runc#5166](https://github.com/opencontainers/runc/issues/5166) - closed/resolved |
| **tokio** (Rust crate) | Async I/O runtime underlying edgelet's HTTP/workload APIs | Yes, builds cleanly (riscv64 is a supported Rust std target) | Mostly fine; one historical segfault fixed | Yes, ordinary crates.io releases | None open |

**Key takeaway:** the container-runtime chain (runc, containerd, partially Docker Engine) and the Rust-side crypto/compression path (OpenSSL, zlib, glibc) largely build and package for Ubuntu 26.04 riscv64 today, with weaker CI coverage than amd64/arm64 across the board. The hard blocker is that `edge-agent`/`edge-hub` require the .NET runtime, which has no riscv64 package on any distribution checked and remains an open, actively-churning upstream port. Until .NET ships a GA riscv64 runtime, the managed-code half of Azure IoT Edge cannot run on riscv64 regardless of how ready the Rust/container half is.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue, PR, or commit exists in Azure/iotedge | N/A | N/A | Confirmed via `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` with queries "riscv", "riscv64", "RISC-V" against `repo:Azure/iotedge` - 0 genuine results each. The single semantic-search hit, [issue #1551](https://github.com/Azure/iotedge/issues/1551) ("IoT Edge Build on Dev Box AMD64 Deploy to ARM64v8"), is a false positive: it is entirely about ARM64v8/Nvidia Jetson TX2, closed 2019-08-14, and the string "riscv64" does not appear anywhere in its title, body, or 7 comments. |

**Correctness bugs:** None to report for Azure IoT Edge itself - there is no riscv64 build to have correctness bugs in. For context, the upstream .NET dependency has open riscv64 correctness tracking items (NaN propagation, Zacas support) listed in Section 9, but these have not been observed against Azure IoT Edge specifically since no such build exists.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, issue, or PR contains any explicit statement for or against RISC-V support - the topic has simply never been raised.

**Technical blockers:**
1. No .NET riscv64 GA runtime ([dotnet/runtime#36748](https://github.com/dotnet/runtime/issues/36748), open) - blocks `edge-agent`/`edge-hub` entirely.
2. No riscv64 target in the edgelet cross-compile script (`scripts/linux/cross-platform-rust-build.sh`) or in any Dockerfile.
3. Docker Engine itself lacks an upstream riscv64 release ([moby/moby#44319](https://github.com/moby/moby/issues/44319), open) - a community-only distro build stands in for it today.

**Organizational blockers:** Single-vendor (Microsoft) governance with no documented external contribution path for new hardware targets; platform support is defined only inside internal Azure Pipelines YAML with no public RFC/tiering process. Any new architecture would need to be a Microsoft product-roadmap decision, not a community PR.

**Acceptance probability:** Low in the near term absent a Microsoft-driven roadmap decision, and gated hard on the .NET runtime's own riscv64 GA timeline, which is itself still in active, unstable development per the linked dotnet/runtime issues.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none - no channel (upstream, RISE, any Linux distro, or any third party) publishes a riscv64 artifact of Azure IoT Edge, and no distro packages it at all (checked: Ubuntu 26.04 resolute, PyPI, RISE wheel builder, Arch RISC-V - all confirmed absent).
- Azure IoT Edge is not an optimization-purpose project (it is an application/orchestration runtime, not a library whose value proposition is architecture-specific speed), so the Step 2 optimization modifier does not apply and no Optimization level is reported in the header.
- **Justification:** There is no upstream riscv64 CI of any kind - confirmed by direct inspection of all 45 pipeline YAML files under [builds/](https://github.com/Azure/iotedge/tree/main/builds), which reference only `amd64`, `arm32v7`, and `arm64`, and of the two GitHub Actions workflows ([issue-labeler.yml](https://github.com/Azure/iotedge/blob/main/.github/workflows/issue-labeler.yml), [stale.yml](https://github.com/Azure/iotedge/blob/main/.github/workflows/stale.yml)), which are bot automation only. Because no Linux distribution ships an Azure IoT Edge riscv64 package either (Ubuntu 26.04 resolute search returns zero matches), the distribution floor that would otherwise upgrade a no-upstream-CI project to yellow does not trigger here - there is simply no build anywhere to floor on. This is not the "insufficient data" (grey/unknown) case: research was exhaustive (repo grep, CI file inspection, release-asset inspection, PyPI, Ubuntu, Arch RISC-V, RISE blog/org/wheel-builder) and consistently confirms zero riscv64 presence, without any evidence of a confirmed broken/non-functional state that would warrant red. Orange is the correct classification: no upstream CI, no distro floor, no confirmed breakage, extensive positive research confirming absence rather than unknown status.
- **Pending work that could change the grade:** None identified. No open PR, no RISE working-group involvement, and no Microsoft-side roadmap item referencing RISC-V was found anywhere ([RISE blog index](https://riseproject.dev/blog/), [riseproject-dev GitHub org](https://github.com/riseproject-dev), [RISE members page](https://riseproject.dev/members/) - Microsoft does not appear in either the Premier or General member tier). The grade is unlikely to change until either (a) Microsoft adds riscv64 to its build matrix, or (b) the .NET runtime ships GA riscv64 support, which is itself the precondition for a functioning `edge-agent`/`edge-hub`.

## 14. Investment Analysis

RISE has not funded or performed any work on Azure IoT Edge (Section 12/13) - none of the sizing below is already covered.

### 14.1 Functional Enablement

The largest and most consequential item is outside this repository's control: a GA riscv64 .NET runtime is a prerequisite for `edge-agent`/`edge-hub` and is tracked upstream at [dotnet/runtime#36748](https://github.com/dotnet/runtime/issues/36748) - this is multi-person-year upstream work already underway independently of any chip-company investment decision here, and should not be resourced by a single company acting on Azure IoT Edge alone. Within Azure/iotedge itself, the concrete enablement items are: add a `debian12.riscv64` case to `cross-platform-rust-build.sh` targeting `riscv64gc-unknown-linux-gnu`; add riscv64 Dockerfiles under `edge-modules/*/docker/linux/`; validate the edgelet Rust build and its Cargo dependency tree (OpenSSL, zlib, tokio - all riscv64-buildable per Section 9) on real or emulated riscv64 hardware.

### 14.2 Performance Optimization

Not applicable in the traditional SIMD/intrinsics sense - no architecture-specific hot-path code exists in this codebase for any architecture (Section 4). Once functionally enabled, standard container/runtime-level performance validation (module deploy latency, MQTT/AMQP throughput via edge-hub) would be needed, but no work here is blocked on ISA-specific kernels.

### 14.3 CI/CD Infrastructure

Add a riscv64 leg to the Azure Pipelines build templates (`builds/misc/templates/build-images.yaml`, `build-packages.yaml`) once a riscv64 build target exists; this is internal Microsoft CI infrastructure, not something an external company can add without Azure DevOps project access - an external contributor's practical path is limited to opening PRs against the public `builds/*.yaml` templates and depending on Microsoft to wire them into the actual pipeline.

### 14.4 Ecosystem Enablement

Not applicable - Azure IoT Edge has no dependent package ecosystem (no PyPI/npm/Maven package universe of third-party extensions that itself needs riscv64 enablement); Section 10 is omitted per the report's own scoping rule.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 target to `cross-platform-rust-build.sh` + riscv64 Dockerfiles for edgelet/edge-modules | 2-4 | Upstream (Microsoft) or external contributor via PR | High |
| Functional | GA riscv64 .NET runtime (external dependency, not resourceable by acting on this repo alone) | Not sizeable here - upstream multi-person-year effort, see [dotnet/runtime#36748](https://github.com/dotnet/runtime/issues/36748) | dotnet/runtime upstream | Critical (blocking) |
| Functional | Validate edgelet Rust build + full Cargo dependency tree on riscv64 hardware/QEMU | 2-3 | External contributor / RISE board farm | Medium |
| CI/CD | Add riscv64 leg to Azure Pipelines build/test templates | 1-2 (PR) + Microsoft-side wiring (unsizeable externally) | Microsoft (internal ADO access required) | Medium |
| Distribution | Docker Engine riscv64 official release (external blocker, [moby/moby#44319](https://github.com/moby/moby/issues/44319)) | Not sizeable here - upstream moby/moby effort | moby/moby upstream | High (blocking container path) |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Azure/iotedge repository](https://github.com/Azure/iotedge)
- [Azure IoT Edge product homepage](https://azure.microsoft.com/en-us/products/iot-edge)
- [Azure/iotedge builds/ directory (Azure Pipelines YAML)](https://github.com/Azure/iotedge/tree/main/builds)
- [Azure/iotedge .github/workflows/issue-labeler.yml](https://github.com/Azure/iotedge/blob/main/.github/workflows/issue-labeler.yml)
- [Azure/iotedge .github/workflows/stale.yml](https://github.com/Azure/iotedge/blob/main/.github/workflows/stale.yml)
- [IoT Edge supported platforms - Microsoft Learn](https://learn.microsoft.com/en-us/azure/iot-edge/support)
- [Azure/iotedge issue #1551 (false-positive semantic match, unrelated to RISC-V)](https://github.com/Azure/iotedge/issues/1551)
- [dotnet/runtime#36748 - RISC-V support (open tracking issue)](https://github.com/dotnet/runtime/issues/36748)
- [dotnet/runtime#131926 - RISC-V SIMD support (open)](https://github.com/dotnet/runtime/issues/131926)
- [dotnet/runtime#132730 - JIT build break on RISC-V](https://github.com/dotnet/runtime/issues/132730)
- [dotnet/runtime#119897 - NaN propagation issue on RISC-V](https://github.com/dotnet/runtime/issues/119897)
- [dotnet/runtime#131543 - RISC-V32 Zacas](https://github.com/dotnet/runtime/issues/131543)
- [dotnet/runtime#112299 - TPL bug on RISC-V hardware](https://github.com/dotnet/runtime/issues/112299)
- [moby/moby#44319 - Adding support for RISC-V (open)](https://github.com/moby/moby/issues/44319)
- [containerd#13020 - Add linux/riscv64 to CI test matrix (open)](https://github.com/containerd/containerd/issues/13020)
- [opencontainers/runc#5166 - Add linux/riscv64 to CI and release artifacts (closed/resolved)](https://github.com/opencontainers/runc/issues/5166)
- [PyPI azure-iot-edge package lookup (404 - does not exist)](https://pypi.org/pypi/azure-iot-edge/json)
- [Ubuntu packages.ubuntu.com search (resolute suite)](https://packages.ubuntu.com/search?keywords=Azure%20IoT%20Edge&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=azure%20iot%20edge)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Project members page](https://riseproject.dev/members/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [EdgeBench: Benchmarking Edge Computing Platforms (arXiv 1811.05948)](https://arxiv.org/abs/1811.05948)
