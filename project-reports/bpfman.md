---
title: bpfman
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="bpfman" %}

# bpfman

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for bpfman<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

bpfman is a system daemon (Rust, with an in-progress Go rewrite) and CLI/operator suite for loading, attaching, and managing eBPF programs on Linux, including a Kubernetes operator (bpfman-agent, bpfman-operator) for cluster-wide eBPF program lifecycle management. It is a CNCF Sandbox project operating under the Linux Foundation trademark framework, licensed Apache-2.0 (eBPF-specific code is dual GPLv2/BSD-2-Clause or GPLv2-only per standard in-kernel-eBPF licensing convention). Homepage: [bpfman.io](https://bpfman.io/).

Governance is a Maintainer Council operating by lazy consensus with formal-vote fallback (simple majority; 2/3 for maintainer removal or charter changes), per the project's GOVERNANCE.md. All four active maintainers (Dave Tucker, Andrew McDermott, Andre Fredette, Billy McFall) are Red Hat employees, and Red Hat employees dominate the top human commit-author list (427, 377 [Andrew Stoycos, emeritus], 236, 199, 85+22 commits respectively) with no other company appearing among top contributors. Red Hat is a RISE Premier member, but bpfman itself has no RISE membership or project-level RISE relationship (see Section 12). GOVERNANCE.md states "Community over Product or Company: Sustaining and growing our community takes priority over shipping code or sponsors' organizational goals," but in practice architecture support has historically been added via maintainer-driven, Red-Hat-staffed tracking efforts (issues #1063/#1088/#1090-#1093) rather than external community contribution, and no CONTRIBUTING.md/GOVERNANCE.md/REVIEWING.md text was found describing a fast-track process for new platform ports.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-06-30 | First incidental riscv64 mention: commit `675684bc` ("Fix bpfd go example," Andrew Stoycos/Red Hat) - an auto-generated Go build-constraint comment from cilium/ebpf's `bpf2go` tool, not deliberate riscv64 work | Local clone git log |
| 2024-04-09 | Issue [#1063 "Multi-Arch Support (Feature Tracking Issues)"](https://github.com/bpfman/bpfman/issues/1063) opened by dave-tucker, targeting arm64/powerpc/s390/amd64. RISC-V is not named anywhere in the body | [#1063](https://github.com/bpfman/bpfman/issues/1063) |
| 2024-04-16 | Sub-issue #1093 "Build eBPF bytecode images with multi-arch support" opened; on 2024-05-15 astoycos posts a `targetByGoArch` design table that includes `riscv64: {"bpfel", "riscv"}` alongside 12 other architectures | Issue #1093 comment (astoycos, 2024-05-15) |
| 2024-06-20 | Issue [#1163 "RISC-V Support"](https://github.com/bpfman/bpfman/issues/1163) opened by maintainer shaneutt, explicitly extending #1063; notes Aya "already supports RISCV64" [NEEDS VERIFICATION - single-source claim from an issue comment, no aya CI evidence found] | [#1163](https://github.com/bpfman/bpfman/issues/1163) |
| 2024-06-20 | Maintainer Billy99 comments on #1163 identifying a concrete blocker: bpfman's build container is `FROM rust:1`, and RISC-V is not listed as a supported architecture on that Docker Hub image | [#1163 comment](https://github.com/bpfman/bpfman/issues/1163) |
| 2024-07-17 | PR [#1141](https://github.com/bpfman/bpfman/pull/1141) ("Update image spec to support multiple images, add build tooling for bytecode images") merged, closing #1093. Despite astoycos's design table listing riscv64, the merged implementation only built for s390x, arm64, x86_64, and powerpcle - riscv64 was omitted with no PR discussion of the omission | [#1141](https://github.com/bpfman/bpfman/pull/1141) |
| 2024-09-24 | Issue #1063 closed "Feature Complete" (Billy99) | [#1063](https://github.com/bpfman/bpfman/issues/1063) |
| 2025-04-02 | Stale-bot (dosubot) notice posted on #1163; no maintainer or community follow-up on Billy99's `rust:1` blocker | [#1163](https://github.com/bpfman/bpfman/issues/1163) |
| 2025-04-09 | Issue #1163 auto-closed with `state_reason: not_planned` | [#1163](https://github.com/bpfman/bpfman/issues/1163) |
| 2026-07-07 | PR [#1673](https://github.com/bpfman/bpfman/pull/1673) ("Import the Go implementation of bpfman," Andrew McDermott/Red Hat, 8,662 files changed) merges a wholesale import of an external Go rewrite (`github.com/frobware/go-bpfman`). The imported `internal/imagebuild/imagebuild.go` contains a 13-architecture registry including `ArchRiscv64EL`. "riscv"/"riscv64" is not mentioned anywhere in the PR description or review discussion - riscv64 packaging support entered the repository as an unremarked side effect of this bulk import, not as a discussed feature | [#1673](https://github.com/bpfman/bpfman/pull/1673); `git blame internal/imagebuild/imagebuild.go` (single history entry, commit `537d4d5`) |

**Discrepancy note:** One search result in the underlying research characterizes #1163 as "open/unresolved" and #1093 as "open/unresolved," contradicting the more thoroughly sourced finding (issue body/comment text fetched directly) that both are closed (#1163 closed `not_planned` 2025-04-09; #1093 closed, "Addressed by #1141," 2024-09-24). The closed status is corroborated by two independent fetches of the issue pages and is treated as authoritative here; the "open" characterization appears to be a stale or erroneous search-index read.

**Is it fully upstream?** No. The only feature that exists in the mainline repository is a narrow bytecode-image packaging convenience (Section 4). The daemon/agent itself - the subject of #1163's actual request - has never been built, tested, or released for riscv64, and #1163 was closed without implementation.

## 3. Upstream Support Tier

No formal PLATFORMS.md/SUPPORT.md/tier document exists. Architecture support is defined de facto by two disjoint mechanisms:

1. **eBPF bytecode OCI images** (`bpfman image build`): a Go/Rust CLI feature accepting pre-compiled bytecode objects for 13 architectures including riscv64.
2. **bpfman/bpfman-agent/bpfman-operator daemon container images** (the actual runtime): built and pushed via `.github/workflows/image-build.yml` for **x86_64, arm64, ppc64le, s390x only** - confirmed by reading `PLATFORMS=linux/amd64,linux/arm64,linux/ppc64le,linux/s390x` at three separate points in that workflow file (lines 111, 337, 795), and by `docs/developer-guide/image-build.md`'s "Multiple Architecture Support" section, which lists the same four architectures.

| Architecture | Upstream CI build | Upstream CI test | Official binary release |
|---|---|---|---|
| amd64 | yes | yes | yes (GitHub Releases + OCI image) |
| arm64 | yes | yes (`verify-bpfman-image` job matrix tests amd64 and arm64 runners) | yes |
| ppc64le | yes | not confirmed via `verify-bpfman-image` matrix (build/push only) | yes |
| s390x | yes | not confirmed via `verify-bpfman-image` matrix (build/push only) | yes |
| riscv64 | no | no | no |

Source: [`.github/workflows/image-build.yml`](https://github.com/bpfman/bpfman/blob/main/.github/workflows/image-build.yml); GitHub Releases expanded-assets pages for v0.6.0, v0.5.6, v0.5.5, v0.5.4, v0.5.3 (all list only `bpfman-linux-arm64.tar.gz`, `bpfman-linux-ppc64le.tar.gz`, `bpfman-linux-s390x.tar.gz`, `bpfman-linux-x86_64.tar.gz`).

## 4. Technical Architecture and RISC-V-Specific Subsystems

bpfman does not JIT-compile eBPF itself; the Linux kernel's in-kernel BPF JIT performs that role, and bpfman is a userspace loader/attacher/manager. Consequently there is no per-architecture JIT backend, hand-written assembly, or SIMD/vector code in bpfman proper. A repo-wide search (`riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, `path:arch/riscv`, `extension:S riscv`, `Zbb`, `GOARCH riscv64`) returned exactly 5 matching files, none containing ISA-extension-specific code:

| File | RISC-V-relevant content | ISA extensions used | Status |
|---|---|---|---|
| `internal/imagebuild/imagebuild.go` | `ArchRiscv64EL = "riscv64-el"` row in a 13-entry architecture metadata table (platform string, build-arg name, ELF endianness, cilium-ebpf arch aliases) | none | Complete for its scope (declarative metadata, no logic gap vs. other architectures) |
| `bpfman/src/bin/cli/args.rs` | `GoArch::Riscv64` enum variant, `--bc-riscv64-el` CLI flag, filename-sniffing heuristic | none | Complete for its scope |
| `bpfman/src/bin/cli/image.rs` | Wires the `bc_riscv64_el` flag into the multi-arch build call | none | Complete for its scope |
| `Containerfile.bytecode.multi.arch` | `FROM scratch AS linuxriscv64` stage, `COPY $BC_RISCV64_EL /` | none (copies a pre-compiled object) | Complete for its scope. Note: an unrelated copy-paste bug exists in the adjacent `linuxppc64` stage (`COPY $BC_PPC64_EL /` referencing an undefined arg instead of the declared `BC_PPC64_EB`) - a real defect, but it affects ppc64, not riscv64 |
| `docs/getting-started/cli-guide.md` | Documents `--bc-riscv64-el` | none | Documentation only |

**Comparison table (amd64 / arm64 / riscv64), for the packaging-metadata subsystem only:** all three architectures receive symmetric, table-driven treatment in `imagebuild.go` and `Containerfile.bytecode.multi.arch` - there is no functional gap between them at this layer. The gap is entirely at the daemon-build/CI/release layer (Section 3), not in this metadata subsystem.

This subsystem packages an eBPF bytecode object that someone else already cross-compiled (e.g., via `cilium/ebpf`'s `bpf2go`, itself producing architecture-independent BPF bytecode) into an OCI image with the correct label. It is not evidence of the bpfman daemon running on riscv64 hardware.

## 5. Build System, Cross-Compilation, and Toolchain

bpfman uses no CMake (no `CMakeLists.txt`, no `cmake/` directory anywhere in the repo). Build tooling is `cargo`/`cross-rs` (via `Cross.toml` and `Makefile`) for the Rust implementation, plus Go tooling for the newer Go implementation and the bytecode-image subsystem, plus Docker/Podman `buildx` for container images.

- **`Cross.toml`**: `default-target = "x86_64-unknown-linux-gnu"`; a generic `pre-build` hook installs rustup, `bindgen-cli`, clang, `libbpf-dev`, `libssl-dev:$CROSS_DEB_ARCH`. **No `[target.riscv64gc-unknown-linux-gnu]` section exists.**
- **`Makefile`**: `BPFMAN_NS_ARCHES ?= amd64 arm64 ppc64le s390x` (line 405) - the cross-arch QEMU test matrix explicitly excludes riscv64. `HOST_ARCH` dispatch supports `x86_64|i686|aarch64|ppc64le|powerpc64le|s390x` only and errors "unsupported HOST_ARCH" for any other value, including riscv64. `build-image-{arch}` targets only exist for `amd64/arm64/ppc64le/s390x`.
- **`docs/getting-started/building-bpfman.md`** (native build instructions): Rust stable + `rustup toolchain install nightly -c rustfmt,clippy,rust-src`; LLVM >= 11 (`llvm-devel clang-devel elfutils-libelf-devel` on dnf, or `clang lldb lld libelf-dev gcc-multilib` on apt); `openssl-devel`/`libssl-dev`; `libbpf-dev`; `protobuf-compiler`; a local libbpf v0.8.0 checkout; `perl`. No riscv64-specific guidance exists because riscv64 is not a supported build target. The reason for the LLVM >= 11 / Rust nightly requirement is not documented beyond "required toolchain" in the same file - **data not available** for a deeper rationale.
- **QEMU**: used only for the `amd64/arm64/ppc64le/s390x` cross-compilation test matrix in the Makefile (`test-bpfman-ns-cross`). Not used for riscv64 anywhere in the repository.
- **`Cross.toml` comment** explicitly calls out `aws-lc-sys`, `openssl-sys`, and `libz-sys` as the C-toolchain-dependent crates needing cross-compile care - relevant if a future riscv64 cross-target is added (Section 9).
- **Known build failure specific to riscv64:** the concrete blocker raised by maintainer Billy99 on issue #1163 - the `bpfman-build` container stage is `FROM --platform=$BUILDPLATFORM rust:1`, and RISC-V is not among the architectures officially supported by the `rust:1` Docker Hub image (though it is available under Docker's broader "other architectures" support). This was never resolved.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Daemon (bpfman/bpfman-agent) builds in CI | yes | yes | no |
| Daemon test suite executes | yes | yes (verify job) | no (never built, so never tested) |
| Daemon official release binary | yes | yes | no |
| Daemon official OCI image | yes | yes | no |
| eBPF bytecode-image packaging (`--bc-<arch>-el/eb`) | yes | yes | yes (packaging convenience only, not daemon support) |
| Distro package (any channel checked) | data not available beyond release tarball | data not available beyond release tarball | none found (PyPI 404 - not applicable, project isn't PyPI-distributed; Ubuntu 26.04 resolute has no bpfman package at all; Arch RISC-V port has no mention) |

**Functional gap:** the bpfman daemon, agent, and Kubernetes operator cannot currently run on riscv64 through any supported, tested path - it has never been compiled for that target by upstream. A user would have to manually patch `Cross.toml`/`Makefile` and attempt a from-source build with no upstream validation that it succeeds.

**Performance gap:** not applicable - bpfman has no architecture-specific hot-path code (Section 4), so there is no SIMD/vectorization delta to assess.

**Security hardening gaps:** data not available - no riscv64-specific hardening documentation, CVE, or advisory was found in the research (the project has no riscv64 build to harden in the first place).

**NaN/floating-point semantics:** not applicable - bpfman contains no floating-point-sensitive numerical code; this class of issue was checked via targeted issue search (`riscv nan floating`) and returned zero results.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was verified twice independently: (1) a fresh local clone at commit `0d93841d15d0a8a8fd3498cd527213da9e652d96`, `git grep -inI riscv -- .github/` across the entire `.github/` tree (workflows, `mergify.yml`, `dependabot.yml`, PR template) returned zero matches; (2) GitHub's live code-search index at the same commit SHA returns exactly 5 riscv-matching files repo-wide, none under `.github/workflows/`.

Files checked: `build.yml`, `docs-build.yml`, `go-ci.yaml`, `go-test.yaml`, `image-build.yml`, `nested-vm-e2e.yml`, `scorecard.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository - GitHub Actions is the only CI system.

`image-build.yml`'s platform lists (the only place CI declares target architectures) are fixed at three separate lines: `PLATFORMS=linux/amd64,linux/arm64,linux/ppc64le,linux/s390x`. No riscv64 entry, no conditional/matrix branch, no QEMU riscv64 setup step exists anywhere.

No RISE RISC-V Runners are referenced anywhere in CI config (`riseproject-dev` string absent from all workflow files).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | no |
| CI runs tests | yes | yes (verify-bpfman-image matrix) | no |
| CI publishes release artifact | yes | yes | no |
| RISE runner usage | no (not needed - native GitHub-hosted) | no | no (RISE RISC-V Runners exist as an infrastructure offering but are not wired into bpfman's CI) |

Source: [`.github/workflows/image-build.yml`](https://github.com/bpfman/bpfman/blob/main/.github/workflows/image-build.yml) and the other six workflow files listed above (local clone, commit `0d93841d`).

## 8. Distribution and Release Status

**No official riscv64 binary exists through any channel checked:**

- **GitHub Releases**: `git ls-remote --tags origin` confirms real tags v0.5.0-rc1 through v0.6.0 (latest). `https://github.com/bpfman/bpfman/releases/expanded_assets/v0.6.0` lists exactly 6 assets: `bpfman-linux-arm64.tar.gz`, `bpfman-linux-ppc64le.tar.gz`, `bpfman-linux-s390x.tar.gz`, `bpfman-linux-x86_64.tar.gz`, plus source zip/tar.gz. No riscv64 asset. Same pattern confirmed for v0.5.6.
- **PyPI**: `https://pypi.org/pypi/bpfman/json` returns HTTP 404 - no PyPI package named `bpfman` exists at all (bpfman is a Rust/Go project; PyPI is not its native distribution channel, so this is a non-finding rather than a gap).
- **RISE wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/bpfman/`): redirects to the nonexistent PyPI page - no wheels.
- **Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=bpfman&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results." No `bpfman` package exists in this Ubuntu suite for any architecture, not just riscv64.
- **Arch Linux RISC-V port** (`https://archriscv.felixc.at/`): "bpfman" does not appear anywhere on the site.
- **Ubuntu 26.04 / Debian / Fedora via the project-graph SPARQL database**: not verified - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research. This is a tool-connectivity gap, not a confirmed absence, though the direct `packages.ubuntu.com` fetch above independently confirms no Ubuntu package exists.

**What a user must do today to get a working riscv64 bpfman binary:** there is no supported path. A user would need to manually add a `[target.riscv64gc-unknown-linux-gnu]` section to `Cross.toml`, patch the `Makefile`'s `HOST_ARCH` switch to accept riscv64, and attempt a from-source build with no upstream CI validation that the result builds or runs correctly - i.e., build from source at their own risk, with no upstream precedent that it succeeds.

## 9. Dependencies

**Method note:** the `project-graph` MCP server (source of Ubuntu 26.04 riscv64 package-graph data) failed to connect for the entire research session (`CONNECTION_CLOSED`, multiple retries). Every row's Ubuntu/distro-graph column is therefore based on direct web checks (Sections 8) or marked "data not available," not the graph database.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Rust | build-dependency, critical | Data not available for the rustc/cargo toolchain itself in these findings; RISE lists "Project RP004: Support for a 64-bit RISC-V Linux port of Rust to Tier-1" among its blog post titles, implying Rust-on-riscv64 was not yet Tier-1 as of that post | n/a | n/a | Concrete blocker specific to bpfman's own use of Rust: its build container is `FROM rust:1`, and RISC-V is not listed as a supported architecture for that Docker Hub image (issue #1163 comment, Billy99) |
| Go | build-dependency, critical | Go stdlib riscv64 support is implied by vendored `golang.org/x/sys` riscv64 syscall/CPU tables (see below); RISE lists "Advancing Go on RISC-V: Progress Through the RISE Project" among its blog post titles, indicating ongoing RISE-funded work on the Go/riscv64 toolchain | Data not available | Data not available | No bpfman-specific Go/riscv64 build evidence beyond the vendored stdlib files |
| aya (0.14.0) / aya-obj (0.3.0) | runtime-dependency, critical (core userspace eBPF loader bpfman is built on) | Community claim in bpfman#1163 that "Aya already supports RISCV64" [NEEDS VERIFICATION - single source, an issue comment, no aya CI evidence found] | Unknown - no aya riscv64 CI found | Unknown | History of riscv64 breakage in the related `aya-ebpf-bindings` crate (target-side codegen): [aya-rs/aya#1313](https://github.com/aya-rs/aya/issues/1313), v0.1.1 failed to build on riscv64 due to stale generated bindings, fixed on `main` via PR #1398 (closed) |
| cilium/ebpf | runtime-dependency, critical | `imagebuild.go` recognizes `riscv`/`riscv64` as valid cilium-ebpf architecture aliases (`ciliumArchs: []string{"riscv", "riscv64"}`), and the library is vendored in the repo (`vendor/github.com/cilium/ebpf/...`) | Data not available | Data not available | No direct evidence of cilium/ebpf's own upstream riscv64 CI/test/release status was found in this research |
| Linux kernel | runtime-dependency, critical | Web search results confirm the Linux kernel BPF subsystem has a JIT for RV64G, and a kernel mailing-list patch ("[PATCH bpf-next v6] bpf: Inline helpers in arm64 and riscv JITs," May 2024) shows active riscv64 BPF JIT development | n/a (kernel-side, not bpfman's to test) | n/a | This is the dependency bpfman relies on for actual eBPF code execution, since bpfman itself does not JIT; kernel-side riscv64 BPF JIT appears actively maintained per the cited patch |
| golang.org/x/sys | runtime-dependency, critical | Vendored in the repo with riscv64 syscall/CPU tables (`vendor/golang.org/x/sys/...`) - standard Go stdlib multi-arch support | Data not available | Data not available | Vendoring confirms the package builds for riscv64 as part of Go's standard cross-platform support |
| prometheus/procfs | runtime-dependency, optional | Vendored file `vendor/github.com/prometheus/procfs/cpuinfo_riscvx.go` explicitly implements riscv64 (`riscvx`) `/proc/cpuinfo` parsing | Data not available | Data not available | Direct, named-file evidence of riscv64-specific code in this dependency |
| object (crate, indirect via aya/aya-obj) | ELF parsing/relocation, indirect | Data not available; crates.io-only, no distro package | Data not available | Data not available | **Open bug**: [gimli-rs/object#833](https://github.com/gimli-rs/object/issues/833) "RISC-V PLT relocation is detected as Unknown" - a narrow correctness gap in PLT relocation classification for RISC-V ELF objects, not a full riscv64-support blocker |
| ring (indirect, via rustls/rustls-webpki, TLS for OCI/registry pulls) | crypto, indirect | Baseline riscv64gc support landed per closed issues [#2022](https://github.com/briansmith/ring/issues/2022), [#2468](https://github.com/briansmith/ring/issues/2468), [#2520](https://github.com/briansmith/ring/issues/2520) | Unknown | Unknown | Recent regression, closed: [#2745](https://github.com/briansmith/ring/issues/2745) "Doesn't compile for riscv64a23-unknown-linux-gnu" - shows fragility on newer RISC-V profile targets even though baseline riscv64gc is fine |
| aws-lc-rs / aws-lc-sys (indirect, via rustls and directly by sigstore/tough) | crypto, indirect | riscv64-gnu bindings pregenerated and shipped: [#714](https://github.com/aws/aws-lc-rs/issues/714), [#874](https://github.com/aws/aws-lc-rs/issues/874) (riscv64gc-musl), CMake/Clang toolchain dependency removed for riscv64 per [#735](https://github.com/aws/aws-lc-rs/issues/735) (all closed/shipped) | Unknown | riscv64-gnu and riscv64gc-musl supported | No open riscv64 issues found |
| sled (indirect, embedded state DB) | storage, indirect | No riscv64-matching issues found in `spacejam/sled` | Unknown | Unknown | Low apparent risk but unverified by CI evidence |
| sigstore (sigstore-rs, indirect) | crypto/attestation, indirect | No riscv64-matching issues found in `sigstore/sigstore-rs` | Unknown | Unknown | Risk inherited from its crypto backend (aws-lc-rs, ring) |
| openssl / openssl-sys (indirect, via native-tls) | crypto, indirect | Already tracked in this repo's project-reports: `project-reports/openssl.md` reports riscv64 well-covered (RVV/Zvkned/Zkne-accelerated AES/SHA, present in Ubuntu 24.04 noble) with narrow gaps (AES-192 GCM software fallback, no FIPS CI on riscv64) | See openssl report | Present, Ubuntu 24.04 confirmed | See `project-reports/openssl.md` |
| flate2 -> libz-sys -> zlib (indirect, pulled transitively via askalono/gix-features/async-compression) | compression, indirect | Already tracked: `project-reports/zlib.md` confirms `zlib1g`/`zlib1g-dev` present on Ubuntu 24.04 noble riscv64 and Debian sid riscv64 | See zlib report | Present, Ubuntu 24.04 confirmed | Only gap noted is FreeBSD/riscv64 CI exclusion (not Linux-relevant) |

**Summary:** the blocker is bpfman's own build/CI/release configuration (Sections 3, 5, 7, 8), not its dependency tree. The closest thing to a disqualifying dependency issue is the open, narrow `object`#833 PLT-relocation gap; everything else riscv64-related in the tree is either already resolved upstream (ring, aws-lc-rs, aya-ebpf-bindings) or has no reported riscv64 problems (sled, sigstore-rs, cilium/ebpf, golang.org/x/sys, prometheus/procfs).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [bpfman/bpfman#1163](https://github.com/bpfman/bpfman/issues/1163) | RISC-V Support | Closed, `not_planned` (2025-04-09) | N/A (feature request, not a bug) | Only substantive RISC-V tracking artifact for the daemon; stalled on an unresolved `rust:1` base-image blocker (Billy99 comment) and was auto-closed for inactivity, not rejected on merits |
| [bpfman/bpfman#1063](https://github.com/bpfman/bpfman/issues/1063) | Multi-Arch Support (Feature Tracking Issues) | Closed, "Feature Complete" (2024-09-24) | N/A | Umbrella issue #1163 "extends"; does not itself mention RISC-V |
| [gimli-rs/object#833](https://github.com/gimli-rs/object/issues/833) | RISC-V PLT relocation is detected as Unknown | Open | Low-Medium (correctness, indirect dependency) | Narrow PLT-relocation classification gap in an indirect dependency (via aya/aya-obj); not confirmed to block bpfman functionally |
| [aya-rs/aya#1313](https://github.com/aya-rs/aya/issues/1313) | v0.1.1 aya-ebpf-bindings fails to build on riscv64 (stale generated bindings) | Closed (fixed on `main`, merged via PR #1398) | Was correctness/build-breaking | Resolved upstream; flagged here as evidence of released-vs-main drift risk for riscv64 bindings in bpfman's core loader dependency |
| [briansmith/ring#2745](https://github.com/briansmith/ring/issues/2745) | Doesn't compile for riscv64a23-unknown-linux-gnu | Closed | Was build-breaking (narrow target) | Regression on a newer RISC-V profile target, not the baseline riscv64gc target; closed but indicates fragility |

**Correctness bugs highlighted separately:** [gimli-rs/object#833](https://github.com/gimli-rs/object/issues/833) is the only **open** correctness issue touching RISC-V anywhere in the dependency chain. No open correctness or performance bug was found filed against bpfman itself for RISC-V (targeted searches for NaN/floating-point, verifier, JIT, and trampoline issues in bpfman/bpfman all returned zero results) - expected, since bpfman has no riscv64 build to have discovered such bugs against.

**Dependabot false positives:** 20 dependency-bump PRs (#1626, #1623, #1622, #1619, #1615, #1692, #1684, #1671, #1634, #1633, #1632, #1629, #1628, #1532, #1492, #1490, #1488, #1197, #1203, #1193) surfaced in riscv/risc-v code searches solely because a bundled crate's changelog text (e.g., `object`, `target-lexicon`) mentions RISC-V for unrelated reasons. Of these, 4 were merged ([#1692](https://github.com/bpfman/bpfman/pull/1692), [#1532](https://github.com/bpfman/bpfman/pull/1532), [#1492](https://github.com/bpfman/bpfman/pull/1492), [#1203](https://github.com/bpfman/bpfman/pull/1203)) and 16 were closed unmerged (superseded by later Dependabot PRs). None implement or discuss RISC-V support in bpfman.

## 12. Objections and Upstream Blockers

- **Stated technical blocker (unresolved):** maintainer Billy99's comment on #1163 - the `bpfman-build` container image (`FROM rust:1`) does not list RISC-V among its officially supported architectures. No one revisited this after it was raised on 2024-06-20; the issue was closed as stale rather than resolved.
- **Build-system blocker:** `Cross.toml` has no riscv64 cross-compilation target section; `Makefile`'s `HOST_ARCH` dispatch explicitly errors on any architecture other than `x86_64|i686|aarch64|ppc64le|powerpc64le|s390x`.
- **CI blocker:** no riscv64 entry exists in any GitHub Actions workflow matrix (Section 7); adding riscv64 requires new CI infrastructure, not just a config toggle.
- **Organizational:** bpfman's maintainer council and top contributor list are entirely Red Hat employees (Section 1). No documented fast-track exists for external contributors proposing a new architecture port - a new port would go through standard PR review by this Red-Hat-dominated council, as #1141 (Red-Hat-authored) and #1673 (Red-Hat-authored) both did for the architectures they added.
- **No stated objection to RISC-V on merits.** Nothing in #1163, #1063, or #1093 argues against RISC-V support; the request was simply never implemented and the issue lapsed to a stale-bot close. shaneutt (the issue author, a project member) even offered to help with Fedora RISC-V packaging.
- **Acceptance probability:** given (a) the absence of any stated merits-based objection, (b) an existing offer of help from a project member, and (c) the fact that riscv64 was already added painlessly to the bytecode-packaging metadata layer as a side effect of unrelated work (#1673), a well-scoped riscv64 daemon-build contribution (fixing the `rust:1` base-image gap, adding a `Cross.toml` target, extending CI) appears technically low-risk to get accepted, but no such contribution has been attempted since #1163 closed in April 2025.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI" tier - no riscv64 CI, no upstream release artifact, and no distribution ships a bpfman package of any kind, so the distribution floor cannot apply either)
- **Release provider:** none - no channel checked (upstream GitHub Releases, PyPI, RISE wheel builder, Ubuntu, Arch RISC-V) publishes a riscv64 bpfman artifact, and none publishes bpfman for any architecture outside upstream's own GitHub Releases
- **Optimization gap:** N/A - bpfman is not an optimization-purpose project. It is a functional userspace eBPF program loader/manager; it would deliver its full value proposition on riscv64 using ordinary scalar code, since it contains no SIMD/vectorization/JIT code of its own (Section 4). Step 2 of the color model therefore does not apply.
- **Justification:** No riscv64 CI exists anywhere in bpfman/bpfman's GitHub Actions configuration - confirmed by grepping all 7 workflow files plus `mergify.yml`/`dependabot.yml` (zero matches) and by `image-build.yml`'s fixed `PLATFORMS=linux/amd64,linux/arm64,linux/ppc64le,linux/s390x` list at three separate lines ([source](https://github.com/bpfman/bpfman/blob/main/.github/workflows/image-build.yml)). No riscv64 release artifact has ever been published: GitHub Releases v0.5.3 through v0.6.0 ship only arm64/ppc64le/s390x/x86_64 tarballs. No Linux distribution ships a bpfman package at all (Ubuntu 26.04 resolute: no result; Arch RISC-V port: no mention), so the distribution floor that would otherwise lift the grade to yellow cannot be invoked. A direct community request for riscv64 daemon support, [issue #1163](https://github.com/bpfman/bpfman/issues/1163), was closed `not_planned`. The only riscv64-related code that exists is a narrow, fully-implemented packaging convenience (`--bc-riscv64-el` CLI flag) that lets a user manually bundle an already-cross-compiled riscv64 eBPF bytecode object into an OCI image - it never builds, tests, or runs the bpfman daemon itself on riscv64.
- **Pending work that could change the grade:** none identified in motion. No open PR addresses riscv64 daemon support. No RISE involvement exists for bpfman specifically - the RISE blog (34 posts, full archive), the RISE GitHub org (25 repos), and the RISE Python wheel builder were all checked and contain zero bpfman references; the only trace found anywhere in RISE-controlled resources is an unactioned candidate-project entry in this grading repository's own `project-reports/.queue.yml` (not RISE-sponsored work, not a report, not an RFP). Issue #1163 remains closed with its concrete blocker (the `rust:1` base-image gap) never revisited. RISE does operate general-purpose infrastructure (the [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/) CI service, per RISE blog post titles) that is not currently wired into bpfman's CI but represents an available, unused resource for closing this gap (Section 14.3).

## 14. Investment Analysis

RISE has not funded or performed any bpfman-specific work (Section 13); no existing effort needs to be excluded from the sizing below. RISE-operated general infrastructure (RISC-V Runners, per RISE blog titles) exists and is factored into the CI/CD sizing as available leverage, not as already-completed work.

### 14.1 Functional Enablement

Required to get the bpfman daemon building on riscv64 at all: add a `[target.riscv64gc-unknown-linux-gnu]` section to `Cross.toml`; resolve the `rust:1` base-container-image riscv64 gap flagged by maintainer Billy99 on [#1163](https://github.com/bpfman/bpfman/issues/1163) (likely requires switching to a Debian/Ubuntu-riscv64-based build image with rustup, since the official `rust:1` Docker Hub image does not list RISC-V); extend `Makefile`'s `HOST_ARCH` switch and `BPFMAN_NS_ARCHES` to include riscv64; validate that aya/aya-obj and cilium/ebpf correctly load and attach eBPF programs on real riscv64 hardware end-to-end (the only unresolved evidence gap here is aya's unverified single-source "already supports RISCV64" claim); and track the open [gimli-rs/object#833](https://github.com/gimli-rs/object/issues/833) PLT-relocation gap in case it affects bpfman's ELF-parsing path.

### 14.2 Performance Optimization

Not applicable. bpfman has no architecture-specific hot-path code to optimize (Section 4); once it builds and passes tests on riscv64, there is no further RISC-V-specific optimization work implied by this project's own codebase. Downstream crypto dependencies (openssl, ring, aws-lc-rs) already carry their own RISC-V optimization status, tracked separately in `project-reports/openssl.md`.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `image-build.yml`, `go-ci.yaml`, `go-test.yaml`, and `nested-vm-e2e.yml`, with actual test execution (not build-only, to avoid capping at yellow instead of reaching blue/green). The RISE RISC-V Runners service (free, native RISC-V CI on GitHub, per RISE's own blog post titles) is a plausible ready-made resource for this, though it has not been evaluated or contacted for bpfman specifically in this research - confirming its applicability is itself a small piece of the work.

### 14.4 Ecosystem Enablement

Not sized separately. No dependent package ecosystem (PyPI, npm, Maven, Kubernetes-operator-consumer packages) requiring riscv64-specific enablement was identified in this research beyond bpfman's own container images and its own limited dependency tree (Section 9); Section 10 is accordingly omitted from this report per the project's scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `Cross.toml` riscv64 target; resolve `rust:1` base-image gap (switch build-container base or pin an alternate riscv64-capable base) | 1-2 | bpfman maintainers (Red Hat) or external contributor | Critical |
| Functional | Extend `Makefile` `HOST_ARCH`/`BPFMAN_NS_ARCHES` to riscv64; validate cross-build end-to-end | 1 | bpfman maintainers | Critical |
| Functional | Validate aya/aya-obj + cilium/ebpf program load/attach correctness on real riscv64 hardware; resolve or work around `object`#833 if it surfaces | 1-2 | bpfman maintainers, upstream aya/object contributors | High |
| CI/CD | Add riscv64 build+test job to `image-build.yml`, `go-ci.yaml`, `go-test.yaml`; evaluate RISE RISC-V Runners as the execution backend | 2-3 | bpfman maintainers, potential RISE coordination | High |
| Release | Extend GitHub Releases and OCI image publishing to include a riscv64 asset/platform once CI is green | 0.5-1 | bpfman maintainers | Medium |
| Community | Re-open or supersede [#1163](https://github.com/bpfman/bpfman/issues/1163) with a concrete implementation plan, given no merits-based objection exists and a project member previously offered to help | 0.25 | bpfman maintainers | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [bpfman/bpfman repository](https://github.com/bpfman/bpfman)
- [bpfman.io homepage](https://bpfman.io/)
- [Issue #1163 "RISC-V Support"](https://github.com/bpfman/bpfman/issues/1163)
- [Issue #1063 "Multi-Arch Support (Feature Tracking Issues)"](https://github.com/bpfman/bpfman/issues/1063)
- [PR #1141 "Update image spec to support multiple images, add build tooling for bytecode images"](https://github.com/bpfman/bpfman/pull/1141)
- [PR #1673 "Import the Go implementation of bpfman"](https://github.com/bpfman/bpfman/pull/1673)
- [PR #1692 (merged dependency bump)](https://github.com/bpfman/bpfman/pull/1692)
- [PR #1532 (merged dependency bump)](https://github.com/bpfman/bpfman/pull/1532)
- [PR #1492 (merged dependency bump)](https://github.com/bpfman/bpfman/pull/1492)
- [PR #1203 (merged dependency bump)](https://github.com/bpfman/bpfman/pull/1203)
- [`.github/workflows/image-build.yml`](https://github.com/bpfman/bpfman/blob/main/.github/workflows/image-build.yml)
- [GitHub Releases expanded assets, v0.6.0](https://github.com/bpfman/bpfman/releases/expanded_assets/v0.6.0)
- [PyPI JSON API for "bpfman" (404 - no package)](https://pypi.org/pypi/bpfman/json)
- [Ubuntu package search for "bpfman" in resolute (no results)](https://packages.ubuntu.com/search?keywords=bpfman&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Python wheel builder PyPI mirror for "bpfman" (redirects to nonexistent PyPI page)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/bpfman/)
- [aya-rs/aya#1313 (riscv64 build fix)](https://github.com/aya-rs/aya/issues/1313)
- [gimli-rs/object#833 (open RISC-V PLT relocation gap)](https://github.com/gimli-rs/object/issues/833)
- [briansmith/ring#2022](https://github.com/briansmith/ring/issues/2022)
- [briansmith/ring#2468](https://github.com/briansmith/ring/issues/2468)
- [briansmith/ring#2520](https://github.com/briansmith/ring/issues/2520)
- [briansmith/ring#2745 (riscv64a23 compile regression)](https://github.com/briansmith/ring/issues/2745)
- [aws/aws-lc-rs#714](https://github.com/aws/aws-lc-rs/issues/714)
- [aws/aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)
- [aws/aws-lc-rs#735](https://github.com/aws/aws-lc-rs/issues/735)
- [bpfman.io CLI guide (main)](https://bpfman.io/main/getting-started/building-bpfman/)
- [bpfman.io CLI reference (v0.5.4)](https://bpfman.io/v0.5.4/getting-started/cli-guide/)
- Internal cross-reference: `project-reports/openssl.md` (this repository)
- Internal cross-reference: `project-reports/zlib.md` (this repository)
