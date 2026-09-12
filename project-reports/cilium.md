---
title: Cilium
parent: Project Reports
color: orange
dependencies:
  - name: Envoy
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: eBPF
    relation: runtime-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: cilium/ebpf
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: optional
  - name: distroless
    relation: runtime-dependency
    criticality: critical
---

# Cilium

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Cilium<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="cilium" %}

## 1. Project Overview

Cilium is an eBPF-based networking, observability, and security platform used primarily as a Kubernetes CNI (Container Network Interface). It is written in Go, with a C-based eBPF datapath compiled to BPF bytecode, and an optional Envoy-based L7 proxy sidecar-less path for HTTP/gRPC-aware policy enforcement.

**Foundation and governance:** Cilium is a Cloud Native Computing Foundation (CNCF) project, accepted as Incubating on Oct 13, 2021, and Graduated on Oct 11, 2023 (CNCF's second most-active project by commit count, after Kubernetes). Governance is committer-based and open: committers can merge to `main` and automatically receive CNCF maintainer status; decisions run on consensus, falling back to majority vote in `#committers` Slack. New committers require a majority-yes-and-zero-no vote. A "Company Block Vote Limit" caps any single company at 6 votes in a poll, an explicit anti-capture mechanism. There is no formal written policy on architecture/platform ports; new-architecture proposals run through the standard Cilium Feature Proposal (CFP) issue process.

**Corporate sponsors:** Isovalent is the originating company and dominant contributor (roughly 90% of commits in one CNCF-era snapshot; ~51 of ~61 listed committers), acquired by Cisco in 2024. Other companies with active committers include Google, Datadog, Microsoft, AMD, Ledger, Hedgehog, and Palantir. Cilium is consumed as the CNI in Google GKE/Anthos, AWS EKS-Anywhere, and Microsoft AKS; other cited adopters include Adobe, ByteDance, Capital One, Cloudflare, IKEA, SUSE, and Sky.

**Community culture on new ports:** Receptive in principle but gated hard on CI/release infrastructure and dependency maturity. Maintainer julianwiedmann's comment on [issue #37869](https://github.com/cilium/cilium/issues/37869) is the clearest statement of the bar: "maintaining builds for another architecture is non-trivial effort. I would suggest demonstrating that there is a need for such builds, and then stepping up to contribute the necessary changes." Every closed riscv64 proposal cites missing CI infrastructure, missing official Kubernetes riscv64 release artifacts, or blocked upstream dependencies as the reason for closure, not a rejection of RISC-V as a concept.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-03-17 | [Issue #24434](https://github.com/cilium/cilium/issues/24434) "CFP: Support linux/riscv64" opened by ernado, citing blockers: etcd riscv64 support, Google distroless riscv64 images, protobuf riscv64 compilation; links draft [PR #24436](https://github.com/cilium/cilium/pull/24436) | [Issue #24434](https://github.com/cilium/cilium/issues/24434) |
| 2023-03-17 to 2023-04-18 | [PR #24436](https://github.com/cilium/cilium/pull/24436) "feat: riscv64" (3 commits by ernado), reviewed by maintainer joestringer on `.github/workflows/build-images-base.yaml`, tagged `release-note/major`; auto-closed stale, unmerged | [PR #24436](https://github.com/cilium/cilium/pull/24436) |
| 2023-06-11 | Issue #24434 self-closed by author "until dependencies are ready" | [Issue #24434](https://github.com/cilium/cilium/issues/24434) |
| 2025-02-26 | [Issue #37869](https://github.com/cilium/cilium/issues/37869) "Please provide Cilium images for the riscv64 architecture" opened by liuyixian123, still open | [Issue #37869](https://github.com/cilium/cilium/issues/37869) |
| 2025-03-03 | Maintainer julianwiedmann responds to #37869: demonstrate need and contribute/maintain the build | [Issue #37869](https://github.com/cilium/cilium/issues/37869) |
| 2025-06-10 | [Issue #39977](https://github.com/cilium/cilium/issues/39977) "CFP: Adding RISC-V as a supported architecture in Cilium's build system" opened by z1006409356, claiming a working internal POC | [Issue #39977](https://github.com/cilium/cilium/issues/39977) |
| 2025-06-17 | [Issue #40076](https://github.com/cilium/cilium/issues/40076) opened by karry-yky, redirected by maintainer tklauser to #39977 same day, closed as duplicate/completed | [Issue #40076](https://github.com/cilium/cilium/issues/40076) |
| 2025-08-20 to 2025-09-04 | Issue #39977 marked stale by bot, then auto-closed for inactivity | [Issue #39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-09 | luhenry reopens discussion on #39977 by introducing RISE's RISC-V GitHub Actions runners (`riscv-runners.riseproject.dev`) as a potential CI-blocker fix | [Issue #39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-22 | xypron requests maintainer tklauser reopen #39977 | [Issue #39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-23 | [Issue #47451](https://github.com/cilium/cilium/issues/47451) "CFP/POC: linux/riscv64 support" opened and closed same day (`not_planned`) by rastaman, documenting a working cilium-agent, VXLAN overlay, and pod networking on an Orange Pi RV2 board | [Issue #47451](https://github.com/cilium/cilium/issues/47451) |
| 2026-08-18 | Maintainer tklauser reopens and pins #39977, citing RISE's runner offer | [Issue #39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-09-11 (as of report) | No riscv64 PR has ever merged into `cilium/cilium`; #39977 remains open and unresolved | [PR #24436 merge status](https://github.com/cilium/cilium/pull/24436) |

**Key contributors:** ernado (original 2023 CFP/PR author, no listed org affiliation found), joestringer (Cilium maintainer, reviewer on #24436), tklauser (Cilium maintainer, reopened/pinned #39977), julianwiedmann (Cilium maintainer, stated the acceptance bar on #37869), luhenry (introduced RISE runners as a potential solution), z1006409356 and rastaman (community POC contributors, no org affiliation found).

**Is it fully upstream?** No. There is no merged riscv64 support in `cilium/cilium` as of 2026-09-11. All three formal attempts (2023 CFP/PR, 2025/2026 CFP #39977, 2026 POC #47451) remain unmerged; the only genuinely riscv64-related PR in the project's history, #24436, was closed unmerged and never shipped in any release ([verified via PR search](https://github.com/cilium/cilium/pull/24436): `merged_at: null`).

## 3. Upstream Support Tier

Cilium documents no formal tiered-architecture-support policy. Officially supported/built architectures are AMD64 and AArch64 per `Documentation/operations/system_requirements.rst`; RISC-V is absent from all current documentation. This is enforced directly in the build system: `Makefile.docker` hardcodes `DOCKER_PLATFORMS := linux/arm64,linux/amd64`, and `Makefile.defs` states "Support CGO cross-compiling for amd64 and arm64 targets," with `CROSS_ARCH` branching only on those two values.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No (0 of 97 workflow files reference riscv) |
| CI tests | Yes | Yes | No |
| Official container image (`quay.io/cilium/cilium`) | Yes | Yes | No -- manifest for v1.20.1 and v1.21.0-pre.2 (2026-09-09) lists only `[amd64, arm64]` |
| GitHub release binaries (cilium-cli) | Yes | Yes | No -- only darwin/linux/windows amd64/arm64 assets |
| Distro packaging | Ubuntu, Debian, etc. | Ubuntu, Debian, etc. | None found (no `cilium` package on any architecture in Ubuntu 26.04/resolute) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Cilium has no per-CPU-architecture source trees for its own dataplane logic: the real datapath is eBPF bytecode compiled from C, which is architecture-neutral by construction (the eBPF virtual machine, not the host ISA, defines the instruction set). There is no `arch/riscv/` directory, no `.S` assembly files anywhere in the repository (for any architecture), and no JIT/codegen backend of Cilium's own.

The only 9 files in the entire non-vendor tree mentioning "riscv" are generic Go `//go:build` architecture-list constraints in bpf2go-generated eBPF loader stubs and one byte-order helper:

```go
//go:build 386 || amd64 || arm || arm64 || loong64 || mips64le || mipsle || ppc64le || riscv64 || wasm
```

These are: `pkg/byteorder/byteorder_littleendian.go`, `pkg/datapath/bpf/probes_bpfel.go`, `pkg/datapath/bpf/sockterm_bpfel.go`, `pkg/datapath/bpf/testprogs/pluginsbase_bpfel.go`, `pkg/datapath/bpf/testprogs/pluginshooks_bpfel.go`, and four files under `examples/datapath-plugin/`. In every case, riscv64 is one entry in a shared "any little-endian Go architecture" build tag also covering amd64, arm, arm64, ppc64le, mips64le, loong64, and wasm -- it is not riscv-specific logic, and it reflects Go toolchain support, not Cilium engineering effort.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| eBPF datapath (`bpf/` C code) | Full | Full | Missing (0 riscv references in `bpf/` tree or `images/` Dockerfiles) |
| Go byteorder/bpf2go loaders | Full | Full | "Scalar-by-accident" -- included only via generic little-endian build-tag sweep |
| SIMD/vector code | N/A (none used) | N/A (none used) | N/A |
| CI/test coverage | Full | Full | Missing |
| Container images (agent/operator/envoy/runtime) | Full | Full | Missing |

Vendored (third-party, not Cilium-authored) dependencies do carry real riscv64 code -- `vendor/golang.org/x/sys/cpu/cpu_riscv64.go` implements Go's runtime CPU-feature detector for RISC-V extensions (`c`, `v`/RVV, `zba`, `zbb`, `zbs`, `zbc`, and the Zv* crypto extensions) -- but Cilium's own code never calls into this feature-detection API (no `cpu.RISCV64.Has*` references found anywhere in the codebase).

## 5. Build System, Cross-Compilation, and Toolchain

Cilium builds with a plain Go `Makefile`/`Makefile.defs`/`Makefile.docker` system (not CMake/Autotools). No `CMakeLists.txt`, `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist anywhere in the repository. No `cmake/riscv64.cmake` or equivalent exists because there is no CMake build at all.

Key hard-coded exclusions:
- `Makefile.docker`: `DOCKER_PLATFORMS := linux/arm64,linux/amd64` -- riscv64 is not in the multi-arch build matrix.
- `Makefile.defs`: CGO cross-compilation supported only for amd64 and arm64.
- `images/cilium/Dockerfile`: objcopy architecture selection branches only on `if amd64 ... elif arm64 ...`, with no riscv64 branch -- a manual riscv64 build attempt would hit unhandled logic here.

A full-tree grep of every `Dockerfile*` for "riscv" returned zero hits; no `Dockerfile.riscv64` exists. There is consequently no documented exact build command, toolchain minimum version, `-DUSE_X=OFF` flag equivalent, or QEMU usage instruction for riscv64 -- none of this exists in the repository as of commit `70b033e7ee555921242d18430c7ae22adc5cf02b`.

The separate LLVM/Clang toolchain used to compile the BPF datapath (pinned `21.1.8` via `quay.io/cilium/cilium-llvm`) is critical to any riscv64 build attempt: `clang` compiles the entire BPF datapath and `llvm-objcopy`/`llvm-strip` are used by BPF Go tests. LLVM's riscv64 backend is a mature, official target and version 21.1.6-71 (matching Cilium's pin) is available in Ubuntu 26.04/resolute for riscv64, but riscv64 is not in LLVM's *required* pre-merge CI gate (only narrow QEMU-based `libc/**` jobs exercise it) [see project-reports/llvm.md, readiness: yellow].

The community POC in [issue #47451](https://github.com/cilium/cilium/issues/47451) is the only concrete data point on required host kernel configuration, run on an Orange Pi RV2 (SpacemiT Ky X1 SoC), Ubuntu 24.04, kernel 6.6.x vendor tree:
- `CONFIG_DEBUG_INFO_BTF=y` -- required for BPF CO-RE support
- `CONFIG_NETFILTER_XT_TARGET_CT=m` -- required for iptables connection tracking
- `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS=y` -- required to avoid `misaligned packet access` faults in the eBPF overlay datapath on SoCs without efficient unaligned access [NEEDS VERIFICATION -- single source, community POC only]

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| cilium-agent (L3/L4 networking) | Full | Full | Community POC only (#47451), unmerged, not officially supported |
| VXLAN overlay | Full | Full | Demonstrated working in community POC (#47451) [NEEDS VERIFICATION -- single source] |
| Network policy enforcement | Full | Full | Demonstrated working in community POC (#39977 body, #47451) [NEEDS VERIFICATION -- claims not independently reproduced] |
| L7/HTTP/gRPC policy (Envoy-backed) | Full | Full | Explicitly out of scope per #47451 -- no upstream `cilium-envoy` riscv64 image exists |
| Hubble L7 observability | Full | Full | Untested/unsupported (depends on Envoy) |
| WireGuard transparent encryption | Full | Full | Portable-C/Go crypto design; `wireguard-tools` ships for Ubuntu 26.04 riscv64 [project-reports/wireguard.md, readiness: blue], but untested within Cilium itself |
| Official Kubernetes riscv64 release artifacts | N/A | N/A | Does not exist, cited as a blocker in #47451 |
| CI/test signal | Full | Full | None |

**Functional gaps:** No riscv64 build target exists at all; L7/Envoy-backed features are explicitly excluded from any near-term riscv64 effort even in the community POC.

**Performance gaps:** No performance benchmark data exists for Cilium on riscv64 from any source (Cilium's own docs, official CNI Benchmark blog post, third-party comparisons are all amd64-only). The one hands-on data point (#47451) reports only qualitative results ("agent CPU settles to a normal steady state after startup"), not throughput or latency figures. Data not available: quantitative riscv64 vs arm64/amd64 performance comparison.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening documentation or seccomp/BPF-verifier behavior comparison was found. The OCI runtime-spec vendor dependency does define `ArchRISCV64 Arch = "SCMP_ARCH_RISCV64"` as a seccomp architecture constant, indicating the underlying container runtime ecosystem has riscv64 seccomp support, but this is not riscv64-specific work by Cilium.

**NaN/floating-point semantics:** No issue specific to NaN/floating-point behavior on RISC-V was found in the Cilium repository; a targeted search returned only the general RISC-V-support issues already covered above. Not applicable in practice -- Cilium's datapath is packet/policy logic, not floating-point-heavy code.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was confirmed by directly reading all 97 files in `.github/workflows/` (the repository's only CI system -- `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist anywhere in the repo), finding zero riscv references in any of them. This was independently corroborated via GitHub's own code-search index: `riscv repo:cilium/cilium path:.github/workflows` returns `total_count: 0`, while a control query confirms the search index does cover that path (a filename-based query for an existing workflow file returned a hit). The only 9 repo-wide matches for "riscv" are the generic Go build-constraint comments described in Section 4, present in zero workflow files.

RISE runners were raised in the community (by luhenry, on [issue #39977](https://github.com/cilium/cilium/issues/39977)) as a proposed future fix for this CI gap, prompting maintainer tklauser to reopen and pin the tracking issue on 2026-08-18. As of 2026-09-11 no RISE runner integration, or any other riscv64 CI job, has been added to any Cilium workflow file.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | No |
| Tests run | Yes | Yes | No |
| Release-blocking | Yes | Yes | N/A |
| Hardware/emulation | Native + QEMU (various) | Native + QEMU (various) | None in CI; community POC used physical Orange Pi RV2 hardware, not CI |
| RISE runners referenced | No | No | Discussed as a proposal (#39977), not implemented |

## 8. Distribution and Release Status

No official riscv64 binary, package, or image exists for Cilium through any channel checked:

- **Container images (primary distribution channel):** `quay.io/cilium/cilium` OCI manifest for both v1.20.1 (latest stable) and v1.21.0-pre.2 (latest pre-release, published 2026-09-09) lists exactly two platforms: `amd64` and `arm64`. Verified via direct registry API query, the most authoritative check performed. This directly corroborates open issue [#37869](https://github.com/cilium/cilium/issues/37869), which reports `docker pull` of `cilium-runtime` and other Cilium images failing on riscv64.
- **GitHub releases:** `cilium/cilium` release assets (checked v1.20.1 and v1.21.0-pre.2) are auto-generated source archives and checksums only -- no architecture-specific binaries at all as release assets (not even amd64/arm64), consistent with container images being the real distribution mechanism.
- **cilium-cli (companion CLI, separate release process):** checked v0.18.7 and latest v0.20.0 (2026-08-28) -- assets are `cilium-{darwin,linux,windows}-{amd64,arm64}.tar.gz/.zip` plus checksums and source archives. No riscv64 asset in either release.
- **PyPI:** `https://pypi.org/pypi/cilium/json` returns HTTP 404 -- no `cilium` package exists on PyPI at all (Cilium is not a Python-distributed project; this is not a riscv64-specific gap).
- **Ubuntu 26.04 (resolute):** no package named `cilium`, `python3-cilium`, or `libcilium` exists for any architecture. The only match is `golang-github-cilium-ebpf-dev`, an unrelated Go library build dependency.
- **Arch Linux / archriscv:** `cilium-cli` is packaged for x86_64 only in the `extra` repository; the RISC-V Arch port's build-status tracker (`archriscv.felixc.at`) shows no entry for `cilium` or `cilium-cli` -- it is not even queued for the port.

**What a user must do to get a working binary today:** Build from source manually, patching `Makefile.docker`'s `DOCKER_PLATFORMS` and the Dockerfile's architecture-selection branches to add riscv64, following the unofficial, unmerged approach demonstrated in community issue [#47451](https://github.com/cilium/cilium/issues/47451) -- there is no supported or documented path. No first-party or third-party (RISE, distro) riscv64 release exists to consume instead.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Envoy | Build-dependency, critical -- L7/HTTP/gRPC proxy (vendored as `github.com/cilium/proxy` fork) | No riscv64 image/sysroot in pinned `envoyproxy/envoy-build-ubuntu` Bazel container | No riscv64 CI | Not packaged for any distro on any architecture | Weakest link per findings; estimated 2-4 person-weeks just to build a riscv64 build image [project-reports/envoy.md, readiness: orange] |
| Linux kernel | Runtime-dependency, critical -- host OS, BPF verifier, required Kconfig | riscv64 is a mainline-supported Linux architecture | N/A | N/A | Community POC (#47451) required specific Kconfig: `CONFIG_DEBUG_INFO_BTF=y`, `CONFIG_NETFILTER_XT_TARGET_CT=m`, `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS=y` [NEEDS VERIFICATION -- single source] |
| eBPF | Runtime-dependency, critical -- the datapath execution model itself | Architecture-neutral bytecode; not host-ISA-dependent | N/A | N/A | No riscv-specific eBPF issues found; the eBPF VM abstracts away host architecture |
| Go | Build-dependency, critical -- language/toolchain (module declares `go 1.26.0`) | riscv64 is an official Go GOARCH | Data not available: no Cilium-specific Go/riscv64 CI found | N/A | Go toolchain riscv64 support is what allows the generic build-tag sweep described in Section 4 |
| cilium/ebpf | Build-dependency, critical -- Go library for loading/managing BPF objects (`v0.22.0`); its `bpf2go` tool shells out to `clang` | Pure Go, generic ELF/BPF parsing, no arch-specific asm -- works anywhere Go does | 2 closed arm64-related CI issues found; 0 for riscv64 | `golang-github-cilium-ebpf-dev` resolves on Ubuntu 26.04/resolute riscv64 (arch-independent Go source package) | None found |
| Protocol Buffers | Build-dependency, critical | Historically blocked riscv64 compilation per original 2023 CFP (`protocolbuffers/protobuf#12266`), cited as "largely resolved by 2026" | Data not available: no direct re-verification performed | Data not available | Originally one of three named blockers in [issue #24434](https://github.com/cilium/cilium/issues/24434) |
| etcd | Runtime-dependency, optional | Historically blocked per original 2023 CFP (`etcd-io/etcd#15490`), cited as "largely resolved by 2026" | Data not available: no direct re-verification performed | Data not available | Originally one of three named blockers in [issue #24434](https://github.com/cilium/cilium/issues/24434) |
| distroless | Build-dependency, critical -- base image for Cilium container images | Historically blocked per original 2023 CFP (`GoogleContainerTools/distroless#1269`), cited as "largely resolved by 2026" | Data not available: no direct re-verification performed | Data not available | Originally one of three named blockers in [issue #24434](https://github.com/cilium/cilium/issues/24434) |
| klauspost/compress (indirect, `v1.20.0`) | Compression across CLI/hubble/operator stack | Falls back to portable Go implementation on riscv64 (no SIMD kernels for riscv64, same as most non-amd64/arm64 archs) | 1 closed ARM64 test-timeout issue; 0 riscv64-specific issues | `golang-github-klauspost-compress-dev` resolves for resolute/riscv64 | None found |
| cloudflare/circl (indirect, `v1.6.3`) | Crypto primitives, pulled in transitively | Generic-Go fallback covers riscv64 | No riscv64-specific CI/tests found | `golang-github-cloudflare-circl-dev` resolves for resolute/riscv64 | 1 open issue re: missing generic P-384 impl, not riscv64-labeled |
| WireGuard (indirect, `golang.zx2c4.com/wireguard` + `wgctrl`) | Backs Cilium's WireGuard transparent-encryption datapath mode | Portable-C/Go crypto by design | Confirmed pass in QEMU harness per dependency report | `wireguard-tools` ships for Ubuntu 26.04/resolute riscv64; kernel module in standard riscv64 Ubuntu kernels | 0 open riscv64 issues [project-reports/wireguard.md, readiness: blue] |
| zstd (indirect, via klauspost/compress and/or Envoy toolchain) | Compression | RVV/SIMD acceleration stalled upstream (unmerged PRs); generic path works | Partial -- no native Linux riscv64 CI, QEMU pthread tests pass since PR #4502 | Packaged in Debian/Ubuntu for riscv64 | 2 open issues (RVV support for XXH3, unaligned access) -- perf gaps, not correctness blockers [project-reports/zstd.md, readiness: blue] |
| BoringSSL (indirect, via Envoy/cilium-proxy) | Crypto (TLS termination for Envoy-mediated L7 policy, mTLS) | LUCI riscv64 builders are cross-compile-only, `run_ssl_tests:false` | Not run natively on riscv64 | Found in Ubuntu 26.04 riscv64 only via the Android fork (`android-libboringssl`); no standalone upstream `boringssl` Debian/Ubuntu package | 0 open riscv64 issues [project-reports/boringssl.md, readiness: yellow] |
| LLVM/Clang (build-time, pinned `21.1.8`) | Compiles the BPF datapath via `clang`; `llvm-objcopy`/`llvm-strip` used by BPF Go tests | Mature official riscv64 LLVM target | Not in LLVM's required pre-merge CI gate; only narrow QEMU-based `libc/**` jobs | `llvm` 1:21.1.6-71 and `llvm-17` through `llvm-22` ship for Ubuntu 26.04 riscv64, version-matching Cilium's pin -- distro-built only, no upstream riscv64 release binaries | No open riscv64-specific blocking issues found [project-reports/llvm.md, readiness: yellow] |

The single hard blocker for Cilium on riscv64 is not its dependency stack -- it is Cilium's own build system, tracked by the still-open [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977). The three dependencies named as historical blockers in the original 2023 CFP (etcd, distroless, protobuf) are described in the research findings as "largely resolved by 2026," though this session did not independently re-verify each one against a primary source [NEEDS VERIFICATION for etcd/distroless/protobuf current riscv64 status specifically]. Envoy remains the weakest dependency link for any riscv64 port that wants L7/Hubble parity: no riscv64 build image/sysroot exists in its own Bazel/Docker toolchain, and it is unpackaged on any distro for any architecture.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#39977](https://github.com/cilium/cilium/issues/39977) | CFP: Adding RISC-V as a supported architecture in Cilium's build system | Open, pinned | Feature request (blocking) | Master tracking issue; reopened 2026-08-18 after auto-closing stale in 2025; claims a working internal POC; no merged PR as of 2026-09-11 |
| [#37869](https://github.com/cilium/cilium/issues/37869) | Please provide Cilium images for the riscv64 architecture | Open | Feature request (blocking) | riscv64 `docker pull` of `cilium-runtime` and other images fails -- no such images exist; maintainer response sets the bar at demonstrated need + contributor commitment |
| [#47451](https://github.com/cilium/cilium/issues/47451) | CFP/POC: linux/riscv64 support -- working proof-of-concept + kernel prerequisites | Closed (`not_planned`) | Feature request | Correctness finding worth flagging separately: eBPF datapath fails with "misaligned packet access" unless `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS=y` is set on the host kernel -- a real alignment-fault risk on unaligned-access-inefficient RISC-V SoCs [NEEDS VERIFICATION -- single source] |
| [#24434](https://github.com/cilium/cilium/issues/24434) | CFP: Support linux/riscv64 | Closed (`not_planned`) | Feature request | Original 2023 proposal; self-closed pending upstream dependency readiness (etcd/distroless/protobuf) |
| [PR #24436](https://github.com/cilium/cilium/pull/24436) | feat: riscv64 | Closed (stale, unmerged) | Implementation attempt | Only genuine riscv64 PR in project history; `merged_at: null`; abandoned on the same dependency blockers as #24434 |
| [#40076](https://github.com/cilium/cilium/issues/40076) | RISC-V support for cilium | Closed (`completed`, duplicate) | Inquiry | Redirected same-day by maintainer tklauser to #39977 |

**Correctness bugs (separate from feature/support requests):** No confirmed, shipped-and-broken correctness bug exists, because no riscv64 build ships at all. The one documented correctness-relevant finding is the misaligned-packet-access failure mode noted in #47451 above, which is a kernel-configuration prerequisite discovered during an unofficial community build, not a bug filed against a released Cilium artifact. No NaN/floating-point issue was found (searched; see Section 6).

## 12. Objections and Upstream Blockers

**Stated objections:** No maintainer has objected to RISC-V support as a concept. Maintainer joestringer reviewed the 2023 draft PR constructively (#24436) with no architectural objection. Maintainer julianwiedmann's position on #37869 is explicitly conditional, not a rejection: "maintaining builds for another architecture is non-trivial effort... demonstrat[e] that there is a need for such builds, and then step... up to contribute the necessary changes."

**Technical blockers:**
1. No riscv64 CI infrastructure in Cilium's own pipeline (0 of 97 workflow files) -- the primary blocker per the tracking issue's own reopening rationale.
2. No upstream `cilium-envoy`/`cilium/proxy` riscv64 image -- L7 policy and Hubble L7 metrics are out of scope for any near-term port (explicitly acknowledged in #47451).
3. Historically: etcd, distroless, and protobuf riscv64 support (named in the original 2023 CFP #24434), described in later research as largely resolved by 2026 but not independently re-verified in this report [NEEDS VERIFICATION].
4. No official Kubernetes riscv64 release artifacts (cited as a blocker in #47451).
5. Cilium's own build system hardcodes only amd64/arm64 (`Makefile.docker`, `Makefile.defs`) -- a structural, not just CI, blocker.

**Organizational blockers:** No dedicated contributor has committed to long-term maintenance of a merged riscv64 port; the closest is the unnamed submitter of #39977 who claims willingness to maintain it but has not landed code. Isovalent/Cisco (the dominant corporate sponsor) has not been observed sponsoring riscv64 work. RISE has not funded or adopted Cilium directly -- RISE involvement is limited to a community member (luhenry) citing RISE's CI runners as a possible solution, which prompted a maintainer to reopen the tracking issue, not a formal RISE-Cilium partnership.

**Acceptance probability:** Moderate but unproven. The pattern across three cycles (2023, 2025, 2026) is consistent: CFPs are entertained, reviewed, and kept open/pinned rather than flatly rejected, but each has stalled on the same infrastructure gap rather than converting into a merged, CI-backed port. The reopening of #39977 in August 2026 on the strength of a proposed CI-infrastructure fix (RISE runners) is the first concrete movement toward addressing the actual blocker rather than repeating the proposal; whether this converts to a merged PR is unresolved as of this report's data (2026-09-11).

## 13. Readiness Assessment

- **Color:** orange (no clean sub-type match in the color model's `color_case` enum -- this is the base "no upstream riscv64 CI, no distribution package of any kind" orange case, distinct from both `downstream-only` (no distro ships it at all) and `optimization-absent` (not an optimization-purpose project))
- **Release provider:** none
- **Optimization level:** not applicable -- Cilium is a CNI/networking control-plane and eBPF-orchestration project, not a performance-optimization library; its value proposition (correct connectivity and policy enforcement) does not depend on architecture-specific hot-path optimization, so the Step 2 optimization modifier does not apply and `optimization_gap` is N/A.
- **Justification:** Zero riscv64 references exist in any of Cilium's 97 GitHub Actions workflow files (confirmed independently via GitHub's code-search index returning 0 matches for "riscv" under `.github/workflows/`), and `Makefile.docker` hardcodes `DOCKER_PLATFORMS := linux/arm64,linux/amd64`, so there is no upstream riscv64 CI of any kind. The `quay.io/cilium/cilium` OCI manifest for both the latest stable (v1.20.1) and latest pre-release (v1.21.0-pre.2, published 2026-09-09) lists only `amd64` and `arm64` platforms, and no Linux distribution packages Cilium at all (Ubuntu 26.04/resolute and Arch/archriscv both checked), so the yellow/orange distribution floor cannot even be applied since there is no package to apply it to. See [issue #39977](https://github.com/cilium/cilium/issues/39977), [quay.io/cilium/cilium](https://quay.io/repository/cilium/cilium), and [Makefile.docker](https://github.com/cilium/cilium/blob/main/Makefile.docker).
- **Pending work that could change the grade:** [Issue #39977](https://github.com/cilium/cilium/issues/39977) is open and pinned as of 2026-08-18, reopened by maintainer tklauser after community member luhenry surfaced RISE's RISC-V GitHub Actions runners as a potential fix for the CI-infrastructure blocker; no PR has merged as of this report. [Issue #47451](https://github.com/cilium/cilium/issues/47451) demonstrated a working community proof-of-concept (pod-to-pod connectivity, VXLAN overlay) on real hardware but was closed `not_planned`. If #39977 produces merged CI plus a published riscv64 image, the grade would move to yellow (build-only CI) or blue (build+test CI, third-party or no upstream-published release) depending on what specifically merges; green requires both CI test execution and an upstream-published riscv64 image, neither of which currently exists.

## 14. Investment Analysis

RISE has not funded or directly engaged with Cilium. RISE's only connection is indirect: a community member cited RISE's general-purpose RISC-V GitHub Actions runners (`riscv-runners.riseproject.dev`) in issue #39977 as infrastructure Cilium's own CI could potentially use, which is not the same as RISE having built, tested, or committed to maintaining Cilium-specific riscv64 support. No RISE blog post, funded project (RP-series), or GitHub org repository references Cilium. All investment items below are therefore unaddressed by any existing RISE or third-party effort and would need to be resourced from scratch.

### 14.1 Functional Enablement

Add riscv64 to `Makefile.docker`'s `DOCKER_PLATFORMS` and `Makefile.defs`'s CGO cross-compile branches; add a riscv64 branch to `images/cilium/Dockerfile`'s objcopy architecture selection; produce and publish a `cilium-runtime`/`cilium-envoy`-equivalent riscv64 base image chain (the community POC in #47451 explicitly scoped Envoy/L7 out, so this is additional scope beyond what has been demonstrated). Validate against the kernel Kconfig prerequisites identified in #47451 (`CONFIG_DEBUG_INFO_BTF`, `CONFIG_NETFILTER_XT_TARGET_CT`, `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS`).

### 14.2 Performance Optimization

Not applicable as a primary investment category -- Cilium is not an optimization-purpose project and its datapath is architecture-neutral eBPF bytecode. The one architecture-sensitive correctness item (unaligned packet access on non-`CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS` SoCs) is a correctness/compatibility concern, not a performance-tuning gap, and belongs under Functional Enablement.

### 14.3 CI/CD Infrastructure

Stand up riscv64 build (and ideally test) jobs in `.github/workflows/` (build-images-*.yaml, integration-test.yaml, and related files). Evaluate whether RISE's RISC-V GitHub Actions runners (already offered in the #39977 thread) are usable for this without requiring net-new hardware procurement -- this is the fastest path to closing the CI gap, per the maintainer's own stated rationale for reopening the tracking issue.

### 14.4 Ecosystem Enablement

Not applicable -- see Section 10 omission rationale: Cilium has no dependent package ecosystem (no PyPI/npm/Maven consumer packages depend on a riscv64 Cilium build; Cilium is consumed as a Kubernetes CNI container image, not as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Extend `Makefile.docker`/`Makefile.defs`/Dockerfile architecture branches to riscv64 | Data not available: no effort estimate found in research findings | Unassigned | High |
| Functional | Build and publish riscv64 `cilium-agent`/`operator`/`hubble-relay`/`clustermesh-apiserver` container images | Data not available: no effort estimate found in research findings | Unassigned | Critical |
| Functional | Build riscv64 `cilium-envoy`/`cilium/proxy` image for L7/Hubble parity | Estimated 2-4 person-weeks per Envoy dependency report [project-reports/envoy.md] | Unassigned | High (blocks L7 feature parity, not base connectivity) |
| Functional | Verify/document required kernel Kconfig (`CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS` etc.) across common riscv64 SoCs | Data not available: no effort estimate found in research findings | Unassigned | Medium |
| CI/CD | Add riscv64 build+test jobs to `.github/workflows/`, evaluating RISE runners | Data not available: no effort estimate found in research findings | Unassigned | Critical (identified by upstream itself as the primary blocker) |
| Governance | Commit a named maintainer/contributor to long-term riscv64 support, per julianwiedmann's stated bar in #37869 | N/A (organizational, not engineering effort) | Unassigned | Critical (prerequisite maintainers have explicitly named) |

## 15. Updates

(No updates yet -- initial report dated 2026-09-11.)

## 16. References

- [Issue #39977 -- CFP: Adding RISC-V as a supported architecture in Cilium's build system](https://github.com/cilium/cilium/issues/39977)
- [Issue #37869 -- Please provide Cilium images for the riscv64 architecture](https://github.com/cilium/cilium/issues/37869)
- [Issue #47451 -- CFP/POC: linux/riscv64 support - working proof-of-concept + kernel prerequisites](https://github.com/cilium/cilium/issues/47451)
- [Issue #40076 -- RISC-V support for cilium](https://github.com/cilium/cilium/issues/40076)
- [Issue #24434 -- CFP: Support linux/riscv64](https://github.com/cilium/cilium/issues/24434)
- [PR #24436 -- feat: riscv64](https://github.com/cilium/cilium/pull/24436)
- [cilium/cilium GitHub repository](https://github.com/cilium/cilium)
- [Cilium homepage](https://cilium.io/)
- [Cilium official performance benchmark docs (amd64 only)](https://docs.cilium.io/en/stable/operations/performance/benchmark/)
- [Cilium CNI Benchmark blog post, 2021 (amd64 only)](https://cilium.io/blog/2021/05/11/cni-benchmark/)
- [quay.io/cilium/cilium container registry](https://quay.io/repository/cilium/cilium)
- [PyPI package lookup for "cilium" (404, package does not exist)](https://pypi.org/pypi/cilium/json)
- [Ubuntu packages.ubuntu.com search, suite resolute (26.04)](https://packages.ubuntu.com/search?keywords=Cilium&suite=resolute&searchon=names&section=all)
- [Arch Linux cilium-cli package page (x86_64 only)](https://archlinux.org/packages/extra/x86_64/cilium-cli/)
- [archriscv.felixc.at RISC-V Arch port build-status tracker](https://archriscv.felixc.at/.status/status.htm)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners "six weeks in" usage report](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [etcd-io/etcd#15490 -- riscv64 support (historical blocker)](https://github.com/etcd-io/etcd/issues/15490)
- [GoogleContainerTools/distroless#1269 -- riscv64 support (historical blocker)](https://github.com/GoogleContainerTools/distroless/issues/1269)
- [protocolbuffers/protobuf#12266 -- riscv64 support (historical blocker)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [project-reports/envoy.md -- Envoy riscv64 readiness (orange)]
- [project-reports/llvm.md -- LLVM riscv64 readiness (yellow)]
- [project-reports/boringssl.md -- BoringSSL riscv64 readiness (yellow)]
- [project-reports/wireguard.md -- WireGuard riscv64 readiness (blue)]
- [project-reports/zstd.md -- zstd riscv64 readiness (blue)]
- [Cilium CNCF project page and governance (GOVERNANCE.md, cilium/community repository)](https://github.com/cilium/community)