---
title: DeepFlow
parent: Project Reports
color: red
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: critical
  - name: eBPF
    relation: runtime-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
---

# DeepFlow

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for DeepFlow<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="deepflow" %}

## 1. Project Overview

DeepFlow ([deepflowio/deepflow](https://github.com/deepflowio/deepflow), homepage [deepflow.io](https://deepflow.io/)) is an eBPF-based cloud-native observability and distributed-tracing platform. It consists of a Rust agent (packet capture, eBPF probes, a WASM plugin host), a Go control-plane/ingester server, and a Go CLI. It is licensed Apache 2.0.

Governance is single-vendor. Copyright is held by "YUNSHAN Networks," a Chinese networking/observability company that also operates deepflow.io and sells paid "DeepFlow Enterprise"/"DeepFlow Cloud" editions alongside the open-source Community edition. A `git shortlog` of the full history (12,735 commits) shows 7,076 commits from `@yunshan.net.cn` addresses and 5,288 from `@yunshan.net` addresses, combining to over 97% of all commits; every one of the top ~20 committers uses a yunshan.net(.cn) address. Commits from outside the company are negligible: 3 from tencent.com, 2 from xiaomi.com, 2 from apache.org, plus scattered individual gmail/qq/outlook contributors.

No `GOVERNANCE.md`, `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists anywhere in the repository; the only community-process document is a standard Contributor Covenant `CODE_OF_CONDUCT.md`. The project is not a CNCF project (sandbox, incubating, or graduated) despite the README stating it "enriches the CNCF Cloud Native Landscape" and appears in the "CNCF CNAI Landscape" - these are self-submitted inventory listings, not membership or incubation status. DeepFlow is also not a RISE (RISC-V Software Ecosystem) member, confirmed against the [RISE members page](https://riseproject.dev/), the [RISE blog](https://riseproject.dev/blog) (all 33 posts reviewed), the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) package list, and the [riseproject-dev GitHub org](https://github.com/riseproject-dev) (25 repos, none related to DeepFlow).

deepflow.io lists Xiaomi, Tencent, China Pacific Insurance, Bank of China, China Construction Bank, China Mobile, State Grid, Ant Group, Li Auto, and Lenovo as customers/adopters, not maintainers or sponsors - no company other than YUNSHAN Networks has committer or maintainer standing in the repository.

On community culture toward new architecture ports: no tier-policy document exists (no `PLATFORMS.md`/`SUPPORT.md`), and there is no recorded discussion of RISC-V in the project's history at all - not a single issue, PR, or commit has ever raised the topic. The absence indicates the topic has simply never been brought to the project, not that it was considered and declined.

## 2. Port History and Upstreaming Timeline

There is no riscv64 port, in progress or completed. Full-history search (`git log -S"riscv" -i --all`, 12,735 commits back to 2017) and GitHub commit-message search for "riscv"/"RISC-V"/"riscv64" (0 hits) surfaced only incidental noise.

| Date | Event | Source |
|---|---|---|
| 2023-06-25 | Commit `601b0973c`, "[eBPF] Add continuous profiling (#2949)," by Jiping Yin (`yinjiping`, `@yunshan.net.cn`), introduces the vendored VPP/clib header `agent/src/ebpf/user/types.h`, which incidentally includes a generic 64-bit-word `__riscv` typedef guard alongside alpha/mips64/x86_64/ppc64/aarch64. Not a deliberate riscv64 enablement effort. | [deepflowio/deepflow](https://github.com/deepflowio/deepflow) commit `601b0973c` |
| 2024-02-19 | Commit `9e865820`, "[Agent] Fixes windows build error," by "TomatoMr" (`huanchao@yunshan.net`), deletes and re-adds the same file verbatim, carrying the incidental riscv guard forward unchanged. | commit `9e865820` |
| 2026-09-11 | Research pass confirms zero riscv64 issues, PRs, or commits beyond the two entries above; zero riscv64 CI; zero riscv64 release artifacts; no RISE involvement. | This report's research pass, cross-checked via `mcp__github__search_issues`, `search_pull_requests`, `search_commits` (all 0 results) |

No riscv64 work is "in flight" to be upstreamed - there is nothing to track. Key contributors named above (Jiping Yin, TomatoMr/huanchao) are both YUNSHAN Networks employees whose commits merely carried incidental cross-architecture boilerplate, not RISC-V-specific engineering.

## 3. Upstream Support Tier

No formal tier policy exists. Tier status is inferred entirely from CI and release evidence.

All 17 GitHub Actions workflow files (`agent-build-rust-env.yml`, `agent-build.yml`, `agent-ignore.yml`, `agent-verify.yml`, `ai-devel.yaml`, `auto-test.yml`, `automation-test.yml`, `clear-branch.yml`, `cli-build.yml`, `cli-ignore.yml`, `cli-verify.yml`, `docker-compose-build.yml`, `server-build.yml`, `server-ignore.yml`, `server-verify.yml`, `update-changelog.yml`, `update-mirror.yml`) plus `.cirun.yml` were read directly. Build targets are exclusively `linux/amd64` and `linux/arm64` (Docker `platforms:`, Go `GOARCH=amd64`/`GOARCH=arm64`, Rust targets `x86_64-unknown-linux-musl`/`aarch64-unknown-linux-musl`), plus `darwin/amd64`/`darwin/arm64` for the CLI. Runners are self-hosted AWS-backed cirun instances (`cirun-aws-amd64-32c`, `cirun-aws-arm64-32c`). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

Recent GitHub Releases (v7.2.2, Sep 10 2026; v7.2.1, Aug 27; v7.2.0, Aug 13; v7.1, Mar 25; v7.1.8, Feb 10) ship only generic `vX.Y.Z.zip`/`vX.Y.Z.tar.gz` source archives - no architecture-specific binaries of any kind, confirmed by fetching the `expanded_assets` endpoint for v7.2.2 and v7.2.1.

| Architecture | CI build | CI test | Release artifact | Runner |
|---|---|---|---|---|
| amd64 | yes | yes | Docker image, agent/server binaries | cirun-aws-amd64-32c (self-hosted) |
| arm64 | yes | yes | Docker image, agent/server binaries | cirun-aws-arm64-32c (self-hosted) |
| riscv64 | no | no | no | none |

Source: [.github/workflows/ on deepflowio/deepflow](https://github.com/deepflowio/deepflow), [GitHub Releases](https://github.com/deepflowio/deepflow/releases).

## 4. Technical Architecture and RISC-V-Specific Subsystems

DeepFlow's core differentiator is its eBPF-based syscall/protocol tracing engine. The register-access layer every kprobe/uprobe/tracepoint program depends on lives in `agent/src/ebpf/kernel/include/bpf_base.h` (536 lines), which defines `struct pt_regs`, `PT_REGS_PARM1-5`, `PT_REGS_FP/SP/IP/RC`, and `PT_GO_REGS_PARM1-9`. Its architecture dispatch is:

```c
#if defined(__x86_64__)
   ... (x86_64 struct/macros, ~35 lines)
#elif defined(__aarch64__)
   struct pt_regs { ... };  // full ARM64 struct + PSR bits, ~35 lines
#else
_Pragma("GCC error \"Must specify a BPF target arch\"");
#endif
```

and, separately, for `PT_GO_REGS_PARM*`:

```c
#if defined(__x86_64__)
   ...
#elif defined(__aarch64__)
   ...
#else
_Pragma("GCC error \"PT_GO_REGS_PARM\"");
#endif
```

There is no riscv64 branch. Compiling this file targeting riscv64 fails at compile time with a deliberate compiler error - stronger than "unimplemented"; it is an explicit build-time refusal for any architecture other than x86_64/aarch64.

Additional arch-specific components that have aarch64 (but not riscv64) implementations:
- `agent/src/ebpf/kernel/perf_profiler.bpf.c`: an `#if defined(__aarch64__)` block captures the Link Register (X30) for stack unwinding; no riscv equivalent.
- `agent/src/ebpf/kernel/uprobe_base.bpf.c`: ARM64-specific Go-runtime >=1.17 register-parameter handling; no riscv branch.
- `agent/src/ebpf/user/mem.h`: `__NR_memfd_create` syscall number hardcoded per architecture (x86_64=319, aarch64=279); no riscv64 entry.
- `agent/src/ebpf/user/clib.h`: `CLIB_PAUSE()` spin-wait uses `pause` on x86_64, `yield` inline asm on aarch64/arm; falls through unguarded on riscv64.

File-count comparison of arch-specific source under `agent/src/ebpf/`: x86_64 has 14 files with real arch-specific code (register structs, syscall numbers, intrinsics, 128-bit int types); aarch64 has 12 files (full `pt_regs` struct, `yield` asm, syscall numbers, X30 unwind capture, Go-runtime-version-specific handling); riscv64 has 1 file, and that file (`agent/src/ebpf/user/types.h`) is not riscv-specific code at all - it is a vendored VPP/clib header (copyright 2001-2005 Eliot Dresselhaus) with a generic 64-bit-word typedef selector that happens to list `__riscv` alongside alpha/mips64/ppc64/aarch64/x86_64. It has no practical effect on riscv64 buildability because `bpf_base.h` aborts compilation before this typedef would matter.

`agent/.cargo/config.toml` configures linkers only for `x86_64-unknown-linux-{gnu,musl}`, `aarch64-unknown-linux-{gnu,musl}`, and `aarch64-linux-android`. No riscv64 target triple is configured anywhere.

DeepFlow itself is not a JIT/SIMD library, but it depends on two components that are: Wasmtime (Cranelift JIT, hosts DeepFlow's custom WASM plugin extensions) and BCC/libbcc (LLVM JIT, compiles DeepFlow's eBPF probe C code and resolves USDT/ELF symbols at runtime). See Section 9 for their riscv64 status.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| eBPF `pt_regs`/register macros (`bpf_base.h`) | full hand-written struct + macros | full hand-written struct + macros | absent; hard compile-time `#error` |
| Go-runtime register parsing (`uprobe_base.bpf.c`) | present | present (>=1.17 specific handling) | absent |
| Stack unwind link-register capture (`perf_profiler.bpf.c`) | n/a (frame-pointer based) | X30 capture | absent |
| Syscall number table (`mem.h`) | hardcoded (319) | hardcoded (279) | absent |
| Spin-wait primitive (`clib.h`) | `pause` | `yield` asm | unguarded fallthrough |
| Rust cross-compile target (`.cargo/config.toml`) | configured | configured | not configured |

Source: [agent/src/ebpf/kernel/include/bpf_base.h](https://github.com/deepflowio/deepflow/blob/991279fc62da342c13eb2bb9090ff4a33b01b1b6/agent/src/ebpf/kernel/include/bpf_base.h), [agent/src/ebpf/user/types.h](https://github.com/deepflowio/deepflow/blob/991279fc62da342c13eb2bb9090ff4a33b01b1b6/agent/src/ebpf/user/types.h).

## 5. Build System, Cross-Compilation, and Toolchain

DeepFlow has no CMake build system anywhere in the repository (zero `CMakeLists.txt` files). The agent is a Rust workspace (Cargo) with a C/eBPF subtree built via Makefiles; the server and CLI are Go modules built via `make`.

Dockerfiles present: `agent/docker/dockerfile`, `dockerfile-build`, `dockerfile-build-static-link`, `dockerfile-build-aarch64`, `dockerfile-build-aarch64-static-link`, `DockerfileToFix.build`, `DockerfileToFix-aarch64.build`, plus `server/Dockerfile` and `server/Dockerfile.builder`. No riscv64-named Dockerfile exists.

Documented toolchain requirements (`agent/build.md`, the only build-prerequisites doc in the repo): Clang/LLVM 11 or 12 (via `clang-11`/`llvm-objdump-11`/`llc-11`/`llvm-strip-11` symlinks), Rust 1.61+, and several statically-linked, source-built dependencies: bcc v0.25.0 (needs `cmake3`), bddisasm, zlib 1.2.12, libdwarf 0.4.1, elfutils 0.187, libGoReSym. No riscv-specific toolchain minimums are documented anywhere - there is nothing to document, since no riscv64 build path exists.

QEMU is used in CI exactly once, as `multiarch/qemu-user-static --reset` to emulate arm64 for the multi-platform `docker/build-push-action` image build - not for riscv64. No `Dockerfile.riscv64`, `cmake/riscv64.cmake`, or riscv64 toolchain file exists because the project is not CMake-based and has no riscv64 target.

**Known build failure:** attempting to compile `agent/src/ebpf/kernel/include/bpf_base.h` for riscv64 fails deterministically with the compile-time diagnostic `_Pragma("GCC error \"Must specify a BPF target arch\"")` (and a second, separate `_Pragma("GCC error \"PT_GO_REGS_PARM\"")` for the Go-register macros). This is not a hypothetical gap - it is source code that actively refuses to build outside x86_64/aarch64.

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists; `docs/` contains only CHANGELOG, FAQ, design, guides, and protocol documentation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The functional gap is total, not partial: DeepFlow's core eBPF tracing engine cannot be compiled for riscv64 at all (Section 4-5). This is a build-blocking gap, not a performance or feature-parity gap.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Agent builds | yes | yes | no (compile-time `#error`) |
| Server builds | yes | yes | untested by upstream CI (no riscv64 job); no riscv64 Go/Rust cross-compile target configured |
| eBPF probe tracing | yes | yes | no |
| Docker image | published | published | not published |
| Release binary | published | published | not published |

Downstream/dependency-level performance gaps that would apply even if the compile-time blocker were fixed: `bytedance/sonic` (server's JSON encoder) documents CPU support as "AMD64 / ARM64 (need go1.20+)" and explicitly falls back to `encoding/json` on unsupported architectures including riscv64, losing its JIT-compiled SIMD parser advantage. `zstd`, `LZ4`, and `xxHash` (compression/checksum dependencies) have RVV-accelerated code paths described in their own project reports as stalled, unmerged upstream PRs (2-7 months without maintainer response), so riscv64 would run correctly but without the same optimizations amd64/arm64 receive. These are documented in `project-reports/zstd.md`, `project-reports/lz4.md`, and `project-reports/xxhash.md` per the dependency research pass.

Security hardening gaps specific to riscv64: Data not available - not independently searched in this research pass.

NaN/floating-point semantics issues: Data not available. A targeted GitHub issue search for `riscv nan floating repo:deepflowio/deepflow` returned zero results, and DeepFlow is not itself a numerics-heavy project (no floating-point-intensive core algorithm was identified in the research).

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was verified twice independently: once via GitHub search APIs (`search_issues`, `search_pull_requests`, `search_commits` for "riscv"/"riscv64," all zero results) and once via a direct local clone at commit `991279fc62da342c13eb2bb9090ff4a33b01b1b6` with a repo-wide `grep -rniE "riscv"` restricted to `.github/workflows/` and `.cirun.yml`, which returned zero matches. The single "riscv" occurrence anywhere in the full working tree is the incidental typedef guard in `agent/src/ebpf/user/types.h` described in Section 4 - not CI configuration.

No RISE RISC-V Runners are referenced anywhere in the CI configuration (no mention of `riseproject-dev` or RISE runner labels), consistent with DeepFlow having no RISE affiliation (Section 1).

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | yes (cirun-aws-amd64-32c) | yes (cirun-aws-arm64-32c) | none |
| CI test execution | yes | yes | none |
| Release-blocking | yes | yes | n/a |
| Runner type | self-hosted AWS cirun | self-hosted AWS cirun | none |
| QEMU emulation | not needed (native) | used only for the multi-arch Docker image push step | none |

Source: [.github/workflows/agent-build.yml and 16 other workflow files, deepflowio/deepflow](https://github.com/deepflowio/deepflow).

## 8. Distribution and Release Status

No official riscv64 binaries exist. GitHub Releases (v7.2.2, v7.2.1, and earlier) ship only generic source `.zip`/`.tar.gz` archives - no architecture-specific asset of any kind was found by fetching the `expanded_assets` endpoint for the two most recent releases.

DeepFlow is not packaged in Ubuntu 26.04 "resolute" on any architecture: a live search at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=DeepFlow&suite=resolute&searchon=names&section=all) returned "Sorry, your search gave no results." It is also not listed on the [Arch Linux RISC-V port index](https://archriscv.felixc.at/?q=deepflow).

The `deepflow` package on [PyPI](https://pypi.org/pypi/deepflow/json) is an unrelated project (a PINN-based fluid-dynamics PDE solver that happens to share the name) - all its release files (0.0.1 through 0.1.2) are `py3-none-any` wheels and sdists, irrelevant to deepflowio/deepflow either way. The [RISE GitLab wheel-builder project](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/deepflow/) has no custom `deepflow` package registered (returns an HTTP 302 redirect to plain PyPI).

npm, Maven Central, and OCI registry riscv64 tag availability for DeepFlow's own artifacts: Data not available - not independently checked in this research pass beyond confirming the CI build matrix (Section 3, 7) contains no riscv64 Docker platform target.

**What a user must do today:** there is no path to a working riscv64 binary. A user would need to fork the project, add a riscv64 branch to `bpf_base.h` (register structs and macros) and the other arch-gated files identified in Section 4, add riscv64 target triples to `.cargo/config.toml` and the CI matrix, validate the BCC/LLVM JIT toolchain for eBPF probe compilation on riscv64 (see Section 9, `iovisor/bcc#5492` is open and unresolved), and build the agent and server from source. This is a from-scratch enablement effort, not an incremental port.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go | build-dependency, critical | Data not available: DeepFlow's own CI does not target `GOARCH=riscv64` for server/CLI builds; the Go toolchain's general riscv64 support was not independently researched in this pass | not exercised by DeepFlow CI | not exercised | No `GOARCH=riscv64` anywhere in any DeepFlow Makefile/workflow/script |
| Rust | build-dependency, critical | No - `.cargo/config.toml` and CI configure only `x86_64-unknown-linux-{gnu,musl}` and `aarch64-unknown-linux-{gnu,musl}`; no riscv64 target triple present | not exercised | not exercised | RISE has a funded project targeting Tier-1 riscv64 Linux support for Rust upstream, "[Project RP004: support for a 64-bit RISC-V Linux port of Rust to Tier 1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)" (2025-04-15) - relevant future context, not yet consumed by DeepFlow |
| musl | build-dependency, critical | No - DeepFlow's Rust agent statically links against `x86_64-unknown-linux-musl`/`aarch64-unknown-linux-musl` only; no riscv64-unknown-linux-musl target is configured | not exercised | not exercised | Downstream of the Rust target-triple gap above |
| eBPF | runtime-dependency, critical | No - the core register-access layer (`bpf_base.h`) hard-fails compilation via `_Pragma("GCC error ...")` for any non-x86_64/non-aarch64 target | no | no | This is DeepFlow's primary product differentiator; see Section 4 for full detail |
| Docker | build-dependency, optional | No riscv64 platform in any Dockerfile or CI `platforms:` list | not exercised | not published | QEMU is used in CI only to emulate arm64 for multi-arch image pushes, never riscv64 |
| Wasmtime / wasmtime-wasi (v12.0.1) | JIT/AOT WASM runtime hosting DeepFlow's WASM plugin extensions | Yes - Cranelift has a full riscv64 backend (~22,300 lines) since v2.0.0 (2022-10); official CI cross-compiles `riscv64gc-unknown-linux-gnu` | Yes, under QEMU (conditionally gated, not on every PR) | Upstream GitHub Releases ship a `riscv64gc-linux` tarball; no distro package | Tier 3 upstream (no committed maintainer, no fuzzing); 8+ open correctness bugs including an unaligned-atomic bus error and partial OOB writes; Winch baseline compiler has no riscv64 code. Existing report: `project-reports/wasmtime.md` (green) |
| ring (v0.17) | Crypto primitives for gRPC/TLS control-plane comms | Builds, but no confirmed hand-tuned riscv64 assembly path (falls back to portable/generic C) | No dedicated riscv64 CI found upstream | Published to crates.io; distro-packaged (`librust-ring-dev` lists riscv64 in Ubuntu) | History of point-release riscv64 build failures reported across multiple closed issues; a community fork exists (`OkitaSan/ring@rv64gc-support`); `rustls`'s move toward `aws-lc-rs` as default (zero riscv64 support today) is a forward-looking regression risk. Not in a dedicated project report |
| BCC / libbcc | Embeds LLVM to JIT-compile DeepFlow's eBPF probe C code and resolve ELF/USDT symbols | Builds (LLVM/Clang riscv64 backend is mature) | Weak - open issue [iovisor/bcc#5492](https://github.com/iovisor/bcc/issues/5492) "USDT Probe Test Failures on RISCV Architecture" (open since 2026-03); closed issues show recurring riscv-specific runtime bugs (missing `pt_regs.pc` member, missing `asm/types.h`, libbpf-tools build failures) | Distro-packaged (`libbpfcc`/`libbpfcc-dev` list riscv64 in Ubuntu 26.04) | Highest-risk dependency specific to DeepFlow's own code path: USDT probing (used by DeepFlow's uprobe-based tracing) has an open, unresolved riscv64 test-failure report. Not in a dedicated project report |
| zstd (v0.13.2 Rust binding) | Compression for agent-server data streams | Yes, pure C, builds on riscv64 | Yes, QEMU CI (PR-triggered only, not release-blocking) | v1.5.7 latest; riscv64 arch-detection fix merged but unreleased (pending v1.6.0) | RVV-accelerated paths (Huffman 4-way, `ZSTD_count`, unaligned-access, prefetch) are stalled, unmerged upstream PRs. Existing report: `project-reports/zstd.md` (blue) |
| DataDog/zstd (Go server, indirect via ClickHouse/Kafka client chain) | Compression codec for Go server components | Inherits zstd C library status | Inherits above | Inherits above | cgo wraps a vendored copy of the same zstd C sources; no zstd-specific riscv64 issues found |
| flate2 | Compression (gzip/deflate) | Yes - no riscv64-specific issues found in `rust-lang/flate2-rs` tracker | No riscv64-specific evidence found | Published to crates.io | None found |
| libpcap (via `pcap` crate v2.4) | Packet capture, core to DeepFlow's traffic mirroring | Yes - `libpcap-dev` 1.10.6-1ubuntu1 lists riscv64 in Ubuntu 26.04 | No riscv64-specific correctness issues found in tracker | Distro-packaged | Load-bearing for DeepFlow's core function; no dedicated report |
| bytedance/sonic (Go server, v1.15.0 direct) | JIT/SIMD-accelerated JSON encode/decode | Builds everywhere, but the JIT/SIMD path is documented as amd64/arm64-only; riscv64 falls back to `encoding/json` | Functionally correct fallback, not benchmarked | Published to Go module proxy | Intentional documented scope limitation, not a bug - silent performance regression on riscv64 |
| golang/snappy (indirect, Kafka codec) | Compression codec | Yes, pure Go, no arch-specific code | No riscv64-specific issues found | n/a | Architecture-agnostic by construction |
| pierrec/lz4/v4 (indirect, Kafka codec) | Compression codec | Yes, pure Go | No riscv64-specific evidence found | n/a | None found |
| LLVM (transitive, via BCC's JIT codegen and Wasmtime toolchain assumptions) | Underlies BCC's eBPF-C JIT compilation | Yes, complete backend | riscv64 is absent from LLVM's required pre-merge CI gate; only `libc/**`-scoped changes get QEMU execution | No upstream riscv64 release binaries; Ubuntu ships `llvm`/`llvm-17..22` for riscv64 | `llvm-exegesis` hardware-counter path is non-functional on riscv64 (libpfm4 has no riscv64 port). Existing report: `project-reports/llvm.md` (yellow) |
| LZ4 (C, facebook/lz4, transitive via zstd's optional build target) | Compression, indirect | Yes | Yes, QEMU CI | v1.10.0 (Jul 2024) first riscv64-aware release; Ubuntu ships `liblz4-1`/`liblz4-dev` for riscv64 | `LZ4_FAST_DEC_LOOP` fast path disabled on riscv64; 5 open RVV optimization PRs stalled 4-7 months. Existing report: `project-reports/lz4.md` (yellow) |
| xxHash (bundled inside zstd/lz4) | Checksums | Yes | Yes, full QEMU CI including RVV vlen=128/256/512 | RVV implementation merged but not yet in a tagged release; Ubuntu ships `libxxhash0`/`-dev` for riscv64 | Streaming-unaligned path has an unfiled ~300x performance regression on riscv64 (no correctness bug). Existing report: `project-reports/xxhash.md` (blue) |
| Memory allocator | - | n/a | n/a | n/a | No dependency found - the Rust agent and Go server both use their respective language's default system allocator; no jemalloc/tcmalloc/mimalloc reference anywhere in the manifests. Eliminates a common cross-arch risk category |

DeepFlow's manifests reviewed: `agent/Cargo.toml` (Rust agent), `agent/src/ebpf/Makefile` (C eBPF/uprobe component, links `libbcc-bpf.a`), `server/go.mod` (Go control-plane/ingester, go 1.26.2). No root `CMakeLists.txt` or `setup.py` exists.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A (untracked) | riscv64 build of DeepFlow's eBPF core fails at compile time via `_Pragma("GCC error ...")` in `bpf_base.h` | Not filed as an issue anywhere; confirmed directly in source | Critical (build-blocking) | No DeepFlow-native tracking issue exists at all; this is a structural fact discovered by code inspection, not a reported bug |
| [iovisor/bcc#5492](https://github.com/iovisor/bcc/issues/5492) | USDT Probe Test Failures on RISCV Architecture | Open (since 2026-03) | High (correctness, dependency) | Directly relevant to DeepFlow's uprobe-based tracing if the core blocker above were ever fixed |
| iovisor/bcc#4110 | `cachestat` fails - no member named `pc` in `struct pt_regs` on riscv | Closed | Medium (dependency, historical) | Referenced in dependency research; illustrates recurring riscv-specific runtime bugs in BCC |
| iovisor/bcc#4628 | libbpf-tools `memleak` build failure on riscv | Closed | Medium (dependency, historical) | ditto |
| iovisor/bcc#4081 | Missing `asm/types.h` on Ubuntu 22.04/riscv | Closed | Low (dependency, historical) | ditto |
| ring crate #2520, #2745, #2148 | riscv64 support/compile failures across point releases | Closed (recurring pattern) | Medium (dependency) | Repository path not independently reverified in this pass; a community fork `OkitaSan/ring@rv64gc-support` exists per dependency research [NEEDS VERIFICATION] |
| wasmtime #5882, #7237 | Unaligned-atomic bus error; partial OOB writes on riscv64 | Open | Medium (dependency, non-blocking for DeepFlow today) | Per `project-reports/wasmtime.md`; DeepFlow's own eBPF blocker (row 1) makes these moot until the core blocker is fixed |

No DeepFlow-native riscv64 correctness bug reports exist because no riscv64 build has ever succeeded to run and be tested.

## 12. Objections and Upstream Blockers

No stated objections were found - the topic has never been raised in the project's history (zero issues, PRs, or discussion threads), so there is no recorded upstream position, favorable or unfavorable, on RISC-V.

**Technical blockers:**
- Hard compile-time `#error` guard in `bpf_base.h` for any non-x86_64/non-aarch64 target (Section 4-5) - the single largest blocker, affecting the project's core product function.
- No riscv64 Rust/Go target configuration anywhere in the build system.
- `ring` crate (used directly by the agent for TLS) has a documented history of riscv64 build fragility across releases.
- BCC/libbcc, DeepFlow's eBPF-probe JIT/USDT dependency, has an open, unresolved riscv64 test-failure report ([iovisor/bcc#5492](https://github.com/iovisor/bcc/issues/5492)).

**Organizational blockers:**
- Single-vendor governance (YUNSHAN Networks, >97% of commits) with no `GOVERNANCE.md` or external contributor pathway evidenced.
- Not a CNCF project and not a RISE member - no foundation or external body with visibility or leverage to request riscv64 support.
- No tier policy or platform-support roadmap document exists to indicate whether new architecture ports are even considered.

**Acceptance probability:** Data not available on the vendor's specific roadmap intentions - no public statement was found either way. Given the complete absence of any historical community engagement on the topic (zero issues/PRs ever raised) and the single-vendor, closed governance structure, unprompted upstream investment in riscv64 support appears unlikely without either a direct request/contribution from a third party or a business driver for YUNSHAN Networks. This is an assessment based on the governance and activity data above, not a stated fact from any source.

## 13. Readiness Assessment

- **Color:** red (no color_case sub-type applies to red)
- **Release provider:** none
- **Justification:** DeepFlow's core eBPF subsystem (`agent/src/ebpf/kernel/include/bpf_base.h`) explicitly emits a compile-time GCC error (`_Pragma("GCC error \"Must specify a BPF target arch\"")` and a second `_Pragma("GCC error \"PT_GO_REGS_PARM\"")`) for any architecture other than x86_64/aarch64, meaning a riscv64 build of DeepFlow's core tracing engine fails deterministically at compile time - see [bpf_base.h](https://github.com/deepflowio/deepflow/blob/991279fc62da342c13eb2bb9090ff4a33b01b1b6/agent/src/ebpf/kernel/include/bpf_base.h). This is combined with zero riscv64 CI across all 17 reviewed GitHub Actions workflows, zero riscv64 release artifacts across the five most recent GitHub Releases, and no riscv64 packaging in Ubuntu 26.04 or Arch Linux RISC-V on any architecture. This constitutes confirmed, deterministic non-functional status rather than merely untested absence, which is why the project is graded red rather than orange (the "no CI, buildable but untested" grade). DeepFlow is not an optimization-purpose project (it is an observability/tracing platform, not a library whose sole value proposition is beating a reference implementation on speed), so the Step 2 optimization modifier does not apply; `optimization_gap: N/A`.
- **Pending work that could change the grade:** none found. There is no open PR, no open issue, no RISE engagement, and no evidence of any in-progress riscv64 effort anywhere in the project's history as of 2026-09-11. Any change to this grade would need to start from a new tracking issue and a code change to `bpf_base.h`'s architecture dispatch - there is no existing thread to build on.

## 14. Investment Analysis

RISE has not funded or performed any DeepFlow-specific work (Section 1, 2) - no prior investment exists to avoid duplicating. RISE's Rust Tier-1 riscv64 effort ("[Project RP004](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)") and its "[RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)" free native CI program are general ecosystem infrastructure DeepFlow could potentially draw on for the toolchain and CI legs below, but neither has been applied to DeepFlow to date.

### 14.1 Functional Enablement
- Add a riscv64 branch to `bpf_base.h`: `struct pt_regs`, `PT_REGS_PARM1-5`, `PT_REGS_FP/SP/IP/RC`, and `PT_GO_REGS_PARM1-9`, modeled on the existing aarch64 branch and the riscv64 Linux kernel ABI.
- Add riscv64 handling to `uprobe_base.bpf.c` (Go-runtime register parsing), `perf_profiler.bpf.c` (stack-unwind link-register capture, riscv64 `ra`/x1), `mem.h` (riscv64 `__NR_memfd_create` syscall number), and `clib.h` (`CLIB_PAUSE()` riscv64 spin-wait primitive).
- Add `riscv64gc-unknown-linux-{gnu,musl}` targets to `.cargo/config.toml` and the CI build matrix (`agent-build.yml`, `agent-build-rust-env.yml`).
- Validate BCC/LLVM JIT compilation of DeepFlow's eBPF probe C code on riscv64, including resolving the open [iovisor/bcc#5492](https://github.com/iovisor/bcc/issues/5492) USDT probe failure.
- Resolve or work around `ring` crate riscv64 build fragility for the agent's TLS dependency (patched fork or upstream fix).
- Add `GOARCH=riscv64` build targets for the Go server and CLI, and validate the full dependency chain (BCC, ring, libpcap, zstd, LLVM) builds cleanly.

### 14.2 Performance Optimization
- Not applicable to DeepFlow's own code until functional enablement (14.1) is complete - there is nothing to optimize on an architecture that does not build.
- Downstream optimization gaps DeepFlow would inherit, not need to fix directly: `zstd`/`LZ4`/`xxHash` RVV-accelerated paths are already stalled upstream (tracked in `project-reports/zstd.md`, `project-reports/lz4.md`, `project-reports/xxhash.md`); `bytedance/sonic`'s JIT JSON path is an accepted upstream scope limitation (falls back to `encoding/json`) that is not something DeepFlow can fix independently.

### 14.3 CI/CD Infrastructure
- Add a riscv64 job to `agent-build.yml`, `agent-build-rust-env.yml`, `server-build.yml`, and `cli-build.yml`, mirroring the existing amd64/arm64 job structure.
- Provision a riscv64 runner - the [RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) program offers free native RISC-V CI on GitHub and could be evaluated, though DeepFlow currently has zero engagement with RISE.
- Extend the release pipeline to publish riscv64 Docker images and binary artifacts once builds pass.

### 14.4 Ecosystem Enablement
Not applicable - DeepFlow does not have a significant dependent package ecosystem (npm/PyPI/Maven/Kubernetes-operator packages that separately require riscv64 enablement). Its own build and release artifacts are the only distribution surface (Section 8, 10 omitted per scope).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `bpf_base.h` (pt_regs, PT_REGS_PARM, PT_GO_REGS_PARM) | 2-4 | Agent/eBPF team | Critical |
| Functional | Add riscv64 handling to `uprobe_base.bpf.c`, `perf_profiler.bpf.c`, `mem.h`, `clib.h` | 2-3 | Agent/eBPF team | Critical |
| Functional | Add riscv64 Rust target triples to `.cargo/config.toml` and validate agent cross-compile | 1-2 | Build/toolchain team | Critical |
| Functional | Resolve BCC/LLVM JIT riscv64 gaps, including `iovisor/bcc#5492` | 3-6 (partly upstream-dependent, not fully controllable) | Agent/eBPF team, coordinating with iovisor/bcc upstream | Critical |
| Functional | Resolve `ring` crate riscv64 build fragility | 1-3 (upstream-dependent) | Agent team, coordinating with ring upstream | High |
| Functional | Add `GOARCH=riscv64` server/CLI build validation | 1-2 | Server/CLI team | High |
| CI/CD | Add riscv64 CI jobs across 4 workflow files; provision runner (possibly via RISE) | 2-3 | DevOps/CI team | High |
| CI/CD | Extend release pipeline for riscv64 artifacts | 1 | DevOps/CI team | Medium |
| Performance | Re-evaluate once functional build succeeds; largely inherited from dependencies (zstd/LZ4/xxHash/sonic) | not sizeable until 14.1 completes | Agent/server team | Low (blocked on functional work) |

Effort figures are order-of-magnitude estimates derived from the scope of code changes identified in Sections 4-9; they are not vendor quotes or measured engineering estimates.

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [deepflowio/deepflow (GitHub repository)](https://github.com/deepflowio/deepflow)
- [DeepFlow homepage](https://deepflow.io/)
- [agent/src/ebpf/kernel/include/bpf_base.h at commit 991279f](https://github.com/deepflowio/deepflow/blob/991279fc62da342c13eb2bb9090ff4a33b01b1b6/agent/src/ebpf/kernel/include/bpf_base.h)
- [agent/src/ebpf/user/types.h at commit 991279f](https://github.com/deepflowio/deepflow/blob/991279fc62da342c13eb2bb9090ff4a33b01b1b6/agent/src/ebpf/user/types.h)
- [deepflowio/deepflow GitHub Releases](https://github.com/deepflowio/deepflow/releases)
- [PyPI deepflow package JSON API](https://pypi.org/pypi/deepflow/json)
- [Ubuntu 26.04 "resolute" package search for DeepFlow](https://packages.ubuntu.com/search?keywords=DeepFlow&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index](https://archriscv.felixc.at/?q=deepflow)
- [RISE Project GitLab wheel builder, deepflow simple index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/deepflow/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE Project RP004: support for a 64-bit RISC-V Linux port of Rust to Tier 1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [iovisor/bcc issue #5492: USDT Probe Test Failures on RISCV Architecture](https://github.com/iovisor/bcc/issues/5492)
- `project-reports/wasmtime.md` (existing report, green)
- `project-reports/zstd.md` (existing report, blue)
- `project-reports/llvm.md` (existing report, yellow)
- `project-reports/lz4.md` (existing report, yellow)
- `project-reports/xxhash.md` (existing report, blue)