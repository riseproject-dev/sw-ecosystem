---
title: Inspektor Gadget
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="inspektor-gadget" %}

# Inspektor Gadget

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Inspektor Gadget<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Inspektor Gadget is a Kubernetes and container observability toolset built on eBPF: it provides "gadgets" (containerized eBPF programs) for tracing syscalls, network activity, file access, and other kernel-level events across Kubernetes nodes and standalone Linux hosts. It ships a CLI (`ig`), a `kubectl` plugin (`kubectl-gadget`), and a Kubernetes-native daemonset/operator deployment path. The project is a **CNCF Sandbox project**, accepted March 7, 2023, and has not progressed to Incubating or Graduated tier.

Governance is informal and maintainer-led: no `GOVERNANCE.md` exists in the repository; decisions rest with the list in `MAINTAINERS.md` (project lead plus two "project managers" and regular maintainers), enforced via `CODEOWNERS`-gated PRs. Copyright is held by "The Inspektor Gadget Contributors" under CNCF/Linux Foundation trademark policy. License is dual: Apache License 2.0 for user-space components, GPLv2 with Linux-syscall-note for the eBPF code templates.

The project is **de facto Microsoft-backed**, though this is not stated on the project website. `git log` author-email analysis across roughly 9,774 commits shows essentially all current top maintainers (project lead Qasim Sarfraz, Mauricio Vasquez with 1,698 commits, Francis Laniel, Jose Blanquicet, Alban Crequy, Michael Friese, Burak Ok, Claudia Marcu) carry `@microsoft.com` or `@linux.microsoft.com` addresses, tracing back to Kinvolk (the project's original creator), which Microsoft acquired in 2021. `ADOPTERS.md` lists Microsoft Defender for Containers and Retina (both Microsoft) as production users, alongside Causely, Headlamp, Kubescape/ARMO, and Protect AI. No other large corporate co-maintainer (Google, Isovalent/Cisco, Red Hat) appears in the maintainer or codeowner lists.

No documented architecture-tier or support-tier policy exists (no `PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/`). No community discussion (issue, PR, design doc, or ADR) proposing a RISC-V port was found anywhere in project history. This indicates RISC-V is simply an unaddressed, unrequested platform rather than one the community has explicitly declined.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists and none has ever been attempted.

| Date | Event | Source |
|---|---|---|
| N/A | No commit, issue, PR, or design discussion referencing RISC-V/riscv64 exists in project history | `git log --all --grep=riscv` (case-insensitive, full history) returns zero commits; [repository](https://github.com/inspektor-gadget/inspektor-gadget) issue/PR search for "riscv" and "RISC-V" returns only false-positive Dependabot bumps and unrelated s390x/PPC64LE issues |

Key contributors to a hypothetical port: none identified, since no work has begun. No organization (Microsoft, CNCF, RISE, or otherwise) has stated an intent to fund or perform a riscv64 port.

**Fully upstream: N/A.** There is nothing to be "upstream" of, since no port exists in any form (branch, fork, patch series, or third-party build) that was found during this research.

## 3. Upstream Support Tier

No formal architecture-tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repository). The de facto tier policy is expressed entirely through the CI matrix and build system: `.github/workflows/inspektor-gadget.yml` hardcodes `arch: [amd64, arm64]` / `platform: [amd64, arm64]` across 13 separate matrix definitions in the file, with an explicit inline comment at line 450: `# For the moment, we only support these two platforms.` This is the clearest first-party statement of support tier available.

CI is release-blocking for the two supported architectures (build and test jobs gate merges via the main `inspektor-gadget.yml` workflow). Official binaries are published only for these platforms, confirmed by full enumeration of GitHub release assets.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | no |
| CI tests | yes | yes | no |
| Release-blocking | yes | yes | N/A (not in matrix) |
| Official binaries | yes | yes | no |
| Per-arch eBPF CO-RE headers (`include/gadget/<arch>/vmlinux.h`) | yes | yes | no (directory does not exist) |
| Native bpf2go-generated object files (`*_bpfel.{go,o}`) | yes | yes | no |
| Syscall table (`pkg/utils/syscalls/syscalls_<arch>.go`) | yes, 787 lines | yes, 673 lines | no |
| BTF generation loader (`pkg/btfgen/btfgen_<arch>.go`) | yes | yes | no |
| Kernel-arch mapping (`goArchToKernelArch` in `cmd/common/image/build-step.go`) | yes (`x86_64`) | yes (`aarch64`) | no entry; build hard-errors with `"no kernel architecture corresponding to %q"` |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Inspektor Gadget has no JIT, no hand-written SIMD, and no cryptography of its own that would be architecture-sensitive in the traditional optimization sense; its architecture-specific surface is entirely in the eBPF CO-RE (Compile Once, Run Everywhere) toolchain path and its generated artifacts. Each of the following is fully implemented for amd64 and arm64, and entirely absent for riscv64:

| Component | Role | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| `pkg/container-hook/execruntime_*_bpfel.{go,o}` | eBPF container-lifecycle hooks | present | present | absent |
| `pkg/kfilefields/filefields_*_bpfel.{go,o}` | file-metadata tracing eBPF program | present | present | absent |
| `pkg/socketenricher/socketenricher_*_bpfel.{go,o}` and `socketsiter_*_bpfel.{go,o}` | network socket enrichment | present | present | absent |
| `pkg/utils/processmap/bpf_*_bpfel.{go,o}` | process-map eBPF program | present | present | absent |
| `pkg/gpu-ebpf-bridge/maps/gputypes_*_bpfel.{go,o}` | GPU telemetry bridge eBPF maps | present | present | absent |
| `pkg/btfgen/btfgen_<arch>.go` | BTF (BPF Type Format) loader, arch-tagged | 23 lines | 23 lines | absent |
| `pkg/utils/syscalls/syscalls_<arch>.go` | libseccomp-generated syscall number table | 787 lines | 673 lines | absent |
| `include/gadget/<arch>/vmlinux.h` | vendored kernel BTF headers for CO-RE compilation | present | present | absent |

The only two occurrences of the string "riscv" anywhere in the source tree are (1) an auto-generated bpf2go Go build-tag comment in `pkg/tchandler/dispatcher_bpfel.go` and `pkg/networktracer/dispatcher_bpfel.go` (`//go:build 386 || amd64 || arm || arm64 || loong64 || mips64le || mipsle || ppc64le || riscv64 || wasm`), which mechanically lists every Go-supported little-endian `GOARCH` value with no riscv-specific logic behind it, and (2) a handful of RISC-V-named kernel enum constants (e.g. `CPUHP_AP_IRQ_RISCV_IMSIC_STARTING`) inherited from upstream Linux kernel headers and embedded only inside the **amd64** and **arm64** `vmlinux.h` files, not a riscv64 one (none exists). A GitHub code search for `"#ifdef __riscv" repo:inspektor-gadget/inspektor-gadget` returned zero results. No `arch/riscv/` directory, `.S` assembly file, RVV intrinsic, or RISC-V-specific dispatch/JIT logic exists anywhere in the repository.

Inspektor Gadget is **not** an optimization-purpose project under the color-coding model's Step 2 test: its value proposition is kernel observability via eBPF, not out-performing a reference implementation through architecture-specific tuning. A riscv64 port would therefore need to add the missing files above (functional enablement) rather than close a performance gap.

## 5. Build System, Cross-Compilation, and Toolchain

Build system is **Go + GNU Make + Docker**, not CMake; no `CMakeLists.txt`, `*.cmake` file, or `cmake/` directory exists anywhere in the repository.

- Top-level `Makefile`: `PLATFORMS ?= "linux/amd64,linux/arm64"` (no riscv64 entry). The `ARCH` autodetect logic maps `x86_64 -> x86`, `aarch64 -> arm64`, `ppc64le -> powerpc`, `mips* -> mips`; `riscv64` falls through unmapped.
- Toolchain, per `Dockerfiles/gadget-builder.Dockerfile`: Go 1.26.6 (`go.mod` requires `go 1.26.0`), Clang/LLVM 18, libbpf `v1.3.0` headers, bpftool `v7.3.0`, Rust 1.87.0 (target `wasm32-wasip1`, for Wasm-based gadget hooks). This toolchain is arch-agnostic in principle but has never been exercised for riscv64 output.
- `Dockerfiles/` contains six Dockerfiles (`ig.Dockerfile`, `gadget-builder.Dockerfile`, `kubectl-gadget.Dockerfile`, `gadget.Dockerfile`, `gpu-ebpf-bridge.Dockerfile`, `ig-tests.Dockerfile`, `linter.Dockerfile`); none reference riscv64. A code search for `filename:Dockerfile riscv64 repo:inspektor-gadget/inspektor-gadget` returned zero results.
- QEMU is used in CI, but only for two purposes unrelated to riscv64: `docker/setup-qemu-action` / `qemu-user-static` enable multi-arch Docker buildx emulation for the two *supported* architectures (amd64/arm64), and `qemu-system-x86` / `qemu-utils` boot x86 VMs in `.github/workflows/gadget-kernel-compatibility.yml` for kernel-compatibility testing. No riscv64 QEMU target exists in any workflow.
- **Known build failure mode:** a gadget build invoked with `GOARCH=riscv64` fails immediately in `cmd/common/image/build-step.go`, which maps only `amd64 -> x86_64` and `arm64 -> aarch64` in `goArchToKernelArch`; any other value returns `fmt.Errorf("no kernel architecture corresponding to %q", runtime.GOARCH)`. There is no fallback path; the failure is a hard error, not a degraded build.
- There is no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`. The only building documentation, `docs/gadget-devel/building.md`, covers `ig image build` (building individual gadget OCI images) and contains no architecture flags or riscv mention.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CLI (`ig`) binary | yes | yes | no |
| `kubectl-gadget` plugin | yes | yes | no |
| Any eBPF gadget (tracing, network, file, process) | yes, full set | yes, full set | none can build (missing CO-RE headers, missing bpf2go objects) |
| GPU-tracing gadget (`gpu-ebpf-bridge`) | yes (subject to NVIDIA driver availability) | yes (subject to NVIDIA driver availability) | no (NVIDIA does not ship `libnvidia-ml`/driver support for riscv64; hardware/vendor-level blocker independent of Inspektor Gadget) |
| WASM-based custom gadget logic (`wasmapi`, via `tetratelabs/wazero`) | yes, JIT ("wazevo") | yes, JIT ("wazevo") | would run via wazero's portable interpreter only (no wazevo JIT backend for riscv64) if the rest of the build succeeded |
| Container runtime integration (`containerd`) | yes | yes | containerd itself builds on riscv64 per community report but has no official CI test matrix or release binaries (see Section 9) |

**Functional gap:** the entire feature set is unavailable on riscv64 today, since the build fails before any gadget can be compiled -- this is not a partial or degraded feature set, it is a complete absence.

**Performance gap:** not evaluable; there is no working riscv64 build to benchmark. No performance data exists for this project on riscv64 from any source searched, including the RISE project blog (34 posts enumerated, none mention Inspektor Gadget) and the project's own blog (10 most recent posts checked, none mention RISC-V or RISE). One prior Inspektor Gadget blog post, ["Porting an eBPF-based application to arm64: our experience with Inspektor Gadget"](https://inspektor-gadget.io/blog/2022/09/porting-an-ebpf-based-application-to-arm64-our-experience-with-inspektor-gadget/) (September 2022), documents the arm64 port experience but contains no riscv64 content.

**Security hardening gaps:** not evaluable for the same reason -- no build exists to assess.

**NaN / floating-point semantics issues:** not applicable; this project performs no floating-point-sensitive numerical work relevant to architecture semantics.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was verified by direct, first-hand inspection of every workflow file in the repository (local clone, HEAD `48483c626be7321844ada7c2fb0e15440bd716`):

`.github/workflows/check-artifacthub-tags.yml`, `check-links.yml`, `cloud-cleanup.yml`, `dockerhub-mirror.yml`, `gadget-kernel-compatibility.yml`, `inspektor-gadget.yml`, `release.yml`, `scorecard-analysis.yml`, `zizmor.yml`, `mlc_config.json`, and the full `.github/actions/` tree (`prepare-and-publish-test-reports`, `run-integration-tests`, `set-container-repo-and-determine-image-tag`, `setup-minikube`, `sign-oci-artifact`), plus `.github/dependabot.yml` and `.github/release.yml`. A case-insensitive `grep "riscv"` returns zero matches in every one of these files. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in this repository.

- **Runner type:** every `runs-on:` line across all workflows (58 occurrences) is `ubuntu-latest`, a standard x86_64 GitHub-hosted runner. No riscv64 self-hosted runner, no QEMU riscv64 emulation step, and no `linux/riscv64` platform string appears anywhere.
- **Architecture matrices** (all in `.github/workflows/inspektor-gadget.yml`, the main CI/release workflow triggered on push/pull_request/workflow_dispatch): 13 separate matrix definitions at lines 204, 274, 315, 376, 451, 611, 761, 812, 937, 1024, 1117, 2275, and 2430, every one restricted to `[amd64, arm64]` or a subset thereof. Line 450 carries the explicit comment `# For the moment, we only support these two platforms.`
- **RISE runners:** no reference to `riseproject-dev` or any RISE RISC-V runner label was found anywhere in the CI configuration; RISE has not contributed CI infrastructure to this project.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| Release-blocking | yes | yes | N/A |
| Runner type | `ubuntu-latest` (x86, native) | `ubuntu-latest` + QEMU/buildx cross-build | none |
| RISE runner usage | no | no | no |

## 8. Distribution and Release Status

**No official riscv64 binaries exist through any channel checked.**

- **GitHub Releases:** full asset enumeration of the two most recent releases at the time of research, v0.56.0 (41 assets) and v0.55.1 (41 assets), via the unauthenticated `releases/expanded_assets/<tag>` endpoint, shows zero filenames containing "riscv" or "riscv64". Assets cover linux-amd64, linux-arm64, darwin-amd64, darwin-arm64, and Windows, across tarball, `.deb`, `.rpm`, `.apk`, and `.pkg.tar.zst` formats. See the [releases page](https://github.com/inspektor-gadget/inspektor-gadget/releases).
- **PyPI:** `https://pypi.org/pypi/inspektor-gadget/json` returns HTTP 404 -- no such PyPI project exists at all (this is a Go/eBPF project, not distributed via PyPI, so this is expected rather than a gap).
- **RISE Python wheel builder:** [gitlab.com/api/v4/projects/56254198/packages/pypi/simple/inspektor-gadget/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/inspektor-gadget/) 302-redirects to `pypi.org`, which also 404s. No RISE wheel exists (consistent with this not being a Python package).
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Inspektor%20Gadget&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." -- no package by this name exists for **any** architecture, not just riscv64.
- **Arch Linux RISC-V:** [archriscv.felixc.at](https://archriscv.felixc.at/) -- not listed; no "inspektor-gadget" entry found.
- **OCI/container images:** official container images are published only for the amd64/arm64 platforms per the CI matrix findings above; no `linux/riscv64` platform tag was found.
- **Data not available:** the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research, so an authoritative Ubuntu 26.04 (resolute) package-graph query could not be executed as a cross-check; the direct `packages.ubuntu.com` web search above is corroborating but independent evidence, and this should be re-run once that server is reachable.

**What a user would need to do to get a working binary:** there is currently no path to a working riscv64 binary. A user would need to (1) add a riscv64 entry to `PLATFORMS` and the CI matrices, (2) generate `include/gadget/riscv64/vmlinux.h`, (3) add a riscv64 entry to `goArchToKernelArch` in `cmd/common/image/build-step.go`, (4) regenerate all `*_bpfel.{go,o}` files for riscv64 via bpf2go, and (5) generate a riscv64 syscall table and BTF loader -- i.e., perform the full functional port described in Section 4, since no distribution, third party, or unofficial build channel currently fills this gap.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go | build-dependency, critical | yes, riscv64 is a native Go GOARCH target | yes, part of upstream Go's own riscv64 CI | yes, official Go toolchain ships riscv64 | Not itself a blocker; IG's own `go.mod` requires Go 1.26.0, toolchain at 1.26.6 |
| cilium/ebpf (v0.22.0) | build-dependency, critical -- core eBPF program/map loader | pure-Go module; `GOARCH=riscv64` is a native Go target and builds | no dedicated riscv64 CI lane found (only closed arm64-only CI issues `#1460`, `#266`); no riscv64-titled issues at all | N/A, Go library, no binary release | Untested-on-riscv64 gap, not a known break |
| libbpf | build-dependency, critical -- loads/relocates BPF CO-RE objects at gadget build time (`LIBBPF_VERSION=v1.3.0` in `gadget-builder.Dockerfile`) | GitHub issue search `"riscv64" repo:libbpf/libbpf` returned zero results (no known riscv64 problem reports) | not independently verified in this pass | not independently verified in this pass | Data not available beyond the zero-issues search; recommend a status report for libbpf itself |
| Linux kernel | runtime-dependency, critical -- eBPF programs execute inside the target kernel | riscv64 kernel support exists upstream (general Linux riscv64 port) | N/A to this report's scope | N/A to this report's scope | Not itself the blocker; Inspektor Gadget's own build tooling is the blocker (Section 4-5) |
| Docker | build-dependency, critical -- used for container image builds and buildx multi-arch pipeline | riscv64 Docker builds are supported by Docker/buildx generally | N/A | N/A | Not the blocker; IG's own Dockerfiles are never invoked with a riscv64 target |
| Buildx | build-dependency, critical -- multi-arch image assembly, invoked with QEMU emulation in CI | supports riscv64 as a `docker/setup-qemu-action` target in general, but IG's CI never enables it (Section 7) | N/A | N/A | IG's own workflow restricts the buildx platform list to amd64/arm64 |
| Kubernetes | runtime-dependency, critical -- deployment target for the daemonset/operator | Kubernetes itself has riscv64 community support in various distributions | N/A to this report's scope | N/A to this report's scope | Not the blocker; no Inspektor Gadget riscv64 container image exists to deploy regardless of cluster architecture |
| QEMU | test-dependency, optional -- used in CI for kernel-compatibility VM tests (x86 only) and for buildx cross-arch emulation (amd64/arm64 only) | N/A, riscv64 QEMU emulation is not configured anywhere in IG's CI | N/A | N/A | No riscv64 QEMU step exists in any workflow (Section 7) |
| minikube | test-dependency, optional -- used in integration test CI (`.github/actions/setup-minikube`) | not independently verified for riscv64 in this pass | not independently verified | N/A | Data not available: not directly researched for this report; likely moot until IG itself supports riscv64 |
| containerd/containerd (v1.7.33, transitive via container runtime integration) | runtime-dependency -- CRI, image pulls, container lifecycle hooks | reported to build cleanly on native riscv64 hardware per issue reporter (unverified second source) | no official riscv64 CI test matrix | no official riscv64 release binaries from containerd itself; a third party (`gounthar/docker-for-riscv64`) ships unofficial riscv64 builds across 117+ releases | Open: [containerd/containerd#13020](https://github.com/containerd/containerd/issues/13020) "Add linux/riscv64 to CI test matrix" (opened 2026-03-12, still open) |
| seccomp/libseccomp-golang (v0.11.0, indirect) | Go bindings for syscall filtering in container/sandbox isolation | riscv64 support merged and shipped since v0.9.2 (2021) | shipped as part of normal release testing since v0.9.2 | released | Closed: `#52` "RFE: add support for RISCV64" (2021), `#76` (2021) -- no open blockers |
| seccomp/libseccomp (native C library, transitive) | underlying seccomp-BPF filter generator | riscv64 support added and merged ahead of v2.5.0 | included in normal CI since | released (v2.5.0+) | Closed: `#110` "RFE: add RISC-V support" (2018-2020) |
| klauspost/compress (v1.18.4, indirect) | compression codecs (zstd/s2/flate) for image layer and OTel data handling | amd64-asm SIMD paths fall back to portable Go on riscv64; generic path compiles and runs | only one arm64-adjacent test-timeout issue found (`#532`, closed 2022), not riscv64 | released as a Go module, no arch-specific binaries | No riscv64 blockers found |
| klauspost/cpuid/v2 (v2.2.10, indirect and direct) | CPU-feature detection gating SIMD code paths | riscv64 support request `#158` "Support RISC-V" closed 2026-06-16, very recently landed upstream | not verified whether IG's pinned v2.2.10 predates this fix | needs a version-pin check/bump | **[NEEDS VERIFICATION]** whether `v2.2.10` in `go.mod` already contains the fix from `#158` or requires a bump |
| minio/sha256-simd (v1.0.1, indirect, notation/sigstore signing chain) | SIMD-accelerated SHA-256 for artifact/image signature verification | amd64/arm64 assembly with generic `crypto/sha256`-style fallback elsewhere; riscv64 uses the fallback | no riscv64 issues found (only an unrelated closed ARM64 SIGILL bug `#6`) | N/A, Go module | No blockers found |
| zeebo/xxh3 (v1.1.0, indirect, OTel/pdata hashing fast-path) | fast non-cryptographic hashing | generic Go fallback path confirmed via source inspection (`accum_stubs_other.go`, built under `!amd64 && !arm64`) | zero riscv64 issues found | N/A, Go module | No blockers found |
| NVIDIA/go-nvml (v0.13.3-0, direct, GPU gadget bridge) | GPU telemetry bindings (`libnvidia-ml.so`) for GPU-tracing gadgets | N/A, cgo binding to a proprietary NVIDIA driver library | N/A | NVIDIA does not currently ship `libnvidia-ml`/driver support for riscv64 hosts | Hardware/vendor blocker outside IG's or go-nvml's control |

**Recursion note:** among direct/build-critical dependencies, the eBPF/WASM/seccomp stack (libseccomp, libseccomp-golang, cilium/ebpf, klauspost/compress, sha256-simd, xxh3) is either already riscv64-clean or degrades gracefully to a scalar/generic path; none is a hard blocker to a riscv64 port. The one concrete, currently tracked upstream gap in the dependency chain is [containerd/containerd#13020](https://github.com/containerd/containerd/issues/13020) (no official riscv64 CI or release). The dominant blocker by far, however, is Inspektor Gadget's own build system and CI matrix (Sections 4, 5, 7), which excludes riscv64 entirely regardless of dependency readiness.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3968](https://github.com/inspektor-gadget/inspektor-gadget/issues/3968) | [RFE] PPC64LE support | open | N/A (feature request, not RISC-V) | Filed 2025-01-31 by a Fedora packager; does not mention RISC-V |
| [#3969](https://github.com/inspektor-gadget/inspektor-gadget/issues/3969) | [RFE] s390x support | open | N/A (feature request, not RISC-V) | Filed 2025-01-31, same author; does not mention RISC-V |
| [#3992](https://github.com/inspektor-gadget/inspektor-gadget/issues/3992) | [Research] profiling wasm performances | open | Performance (general, not arch-specific) | Notes DNS gadget spending over 90% CPU time in WASM execution in some scenarios; unrelated to RISC-V |
| N/A | No riscv64-specific issue, PR, or commit exists | N/A | N/A | Confirmed by exhaustive search: no `arch/riscv64` label exists (compare to the existing `arch/arm64` label used on closed issue [#645](https://github.com/inspektor-gadget/inspektor-gadget/issues/645)) |

**Correctness bugs on RISC-V:** none exist to report, because no riscv64 build has ever been produced against which correctness could be evaluated. This is a coverage gap, not a confirmed-working-but-buggy state.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer or issue thread expresses opposition to a RISC-V port; the absence of support reflects lack of demand and resourcing, not a stated technical or policy objection.

**Technical blockers:**
- The build system hard-fails for `GOARCH=riscv64` via the two-entry-only `goArchToKernelArch` map in `cmd/common/image/build-step.go`.
- No `include/gadget/riscv64/vmlinux.h` exists; generating one requires riscv64 kernel BTF data and toolchain support.
- All per-arch eBPF objects (`*_bpfel.{go,o}`) would need to be regenerated via bpf2go for riscv64, and the syscall table (`pkg/utils/syscalls/syscalls_riscv64.go`) would need to be generated from libseccomp, which itself already has riscv64 support upstream (closed `#110`).
- None of these are reported as fundamentally infeasible; they are simply unattempted engineering work of the same shape as the existing amd64/arm64 support.

**Organizational blockers:**
- No RISE (riseproject.dev) membership, funding, blog coverage, or CI runner usage exists for this project; RISE tracks it only as an unstarted candidate in an internal report-queue backlog file, not as active or funded work.
- No CNCF-level architecture mandate requiring riscv64 support for Sandbox-tier projects was found.
- The project's Microsoft/Kinvolk-descended maintainer base has not publicly signaled riscv64 as a roadmap priority; the two open architecture RFEs on file (s390x, PPC64LE) suggest maintainer bandwidth is already allocated to other architecture requests from external parties (a Fedora packager), with no equivalent riscv64 requester having appeared.

**Acceptance probability:** given the absence of any objection and the existence of working precedent in the same codebase (the arm64 port, documented in the project's own [2022 porting blog post](https://inspektor-gadget.io/blog/2022/09/porting-an-ebpf-based-application-to-arm64-our-experience-with-inspektor-gadget/)), a well-executed riscv64 PR that adds the missing build-matrix entries, headers, and generated artifacts has a reasonable path to acceptance. The primary barrier is that no such PR has been proposed, not that one would be rejected.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI at all, and no distribution ships an unpatched or patched riscv64 package to invoke the distribution floor -- Inspektor Gadget is not packaged by any distro checked, for any architecture)
- **Release provider:** none (no upstream, RISE, distro, or third-party channel publishes a riscv64 artifact for this project)
- **Optimization level:** not applicable -- Inspektor Gadget is not an optimization-purpose project under the color model's Step 2 test (its value is kernel-observability functionality via eBPF, not out-performing a reference implementation through architecture-specific tuning), so no optimization-gap cap applies.
- **Justification:** every job in every GitHub Actions workflow runs on `ubuntu-latest` with architecture matrices explicitly hardcoded to `[amd64, arm64]` and an inline comment stating "For the moment, we only support these two platforms" ([`.github/workflows/inspektor-gadget.yml`](https://github.com/inspektor-gadget/inspektor-gadget/blob/main/.github/workflows/inspektor-gadget.yml), lines 204-2430). No upstream riscv64 CI exists, no distribution packages the project at all (confirmed against [Ubuntu 26.04 resolute](https://packages.ubuntu.com/search?keywords=Inspektor%20Gadget&suite=resolute&searchon=names&section=all): "Sorry, your search gave no results"), and full enumeration of the two most recent [GitHub releases](https://github.com/inspektor-gadget/inspektor-gadget/releases) shows zero riscv64 assets among 41 assets per release. This is the base orange case (no upstream CI, no distribution floor applicable) rather than a patched-downstream-only or optimization-absent sub-case, since no distribution ships this project at all.
- **Pending work that could change the grade:** none identified. No open PR proposes riscv64 support, no RISE involvement exists beyond an unstarted backlog-queue entry, and no community discussion is underway. The grade would improve to yellow or blue only if (a) a maintainer or contributor opens a build-only riscv64 CI job (yellow), or (b) upstream CI is extended to build, test, and (for blue) or additionally release (for green with upstream as release provider) riscv64 artifacts. Given the readiness of most of the dependency stack (Section 9) and the precedent of the documented arm64 port, this is characterized as unstarted-but-tractable engineering work rather than a fundamentally blocked port.

## 14. Investment Analysis

RISE has not funded, run CI for, or otherwise invested in riscv64 support for Inspektor Gadget; the project appears only as an unstarted candidate in an internal report-queue backlog file (`project-reports/.queue.yml`), alongside roughly 38 other candidate observability/database/runtime projects. No work described below is already covered by RISE or any other party.

### 14.1 Functional Enablement

Required to reach a working riscv64 build:
- Add `linux/riscv64` to `PLATFORMS` in the top-level `Makefile` and to the `ARCH` autodetect logic.
- Add a `riscv64 -> riscv64` (or appropriate kernel-arch name) entry to `goArchToKernelArch` in `cmd/common/image/build-step.go`.
- Generate `include/gadget/riscv64/vmlinux.h` from a riscv64 kernel BTF source.
- Regenerate all bpf2go-produced eBPF objects (`pkg/container-hook`, `pkg/kfilefields`, `pkg/socketenricher`, `pkg/utils/processmap`, `pkg/gpu-ebpf-bridge/maps`, `pkg/tchandler`, `pkg/networktracer`) for riscv64.
- Generate `pkg/btfgen/btfgen_riscv64.go` and `pkg/utils/syscalls/syscalls_riscv64.go` (the latter can lean on libseccomp's existing riscv64 support, closed upstream in `#110`).
- Verify or bump `klauspost/cpuid/v2` past its 2026-06-16 riscv64 fix (`#158`) -- currently [NEEDS VERIFICATION] whether the pinned `v2.2.10` already contains it.

### 14.2 Performance Optimization

Not a current priority. No RISC-V-specific hot paths exist to optimize because no functional build exists yet; this project's value proposition (kernel observability) is not itself an optimization-purpose target under the color model, so no dedicated ISA-extension work (RVV, Zba/Zbb, etc.) is indicated as a first step. The GPU-tracing gadget path is blocked at the vendor level (NVIDIA riscv64 driver availability) and is out of scope for any Inspektor Gadget-side investment.

### 14.3 CI/CD Infrastructure

Required to reach yellow (build-only) or blue (build+test) tier:
- Add a `riscv64` entry to the `arch`/`platform` matrices in `.github/workflows/inspektor-gadget.yml` (13 matrix definitions to update).
- Add riscv64 QEMU emulation to the buildx pipeline for cross-arch image builds (the project's existing `docker/setup-qemu-action` usage would need a riscv64 platform added).
- If RISE riscv64 runners (referenced in RISE's own ["RISC-V Runners" announcement](https://riseproject.dev/blog) infrastructure, per the RISE-involvement research pass) are available and offered to this project, native-hardware test execution would be the fastest path to blue tier without emulation overhead; this would require outreach to RISE, since no such relationship currently exists.

### 14.4 Ecosystem Enablement

Not applicable. Inspektor Gadget has no dependent package ecosystem (no PyPI, npm, or Maven consumers depend on it as a library) that Section 10 would otherwise cover; it is distributed as standalone binaries and container images.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to Makefile PLATFORMS, ARCH map, and goArchToKernelArch | 1 | Upstream maintainer or external contributor | Critical |
| Functional | Generate include/gadget/riscv64/vmlinux.h and validate CO-RE compilation | 1-2 | Upstream maintainer or external contributor | Critical |
| Functional | Regenerate all bpf2go eBPF objects for riscv64 across 7 packages | 1-2 | Upstream maintainer or external contributor | Critical |
| Functional | Generate riscv64 syscall table and btfgen loader | 0.5-1 | Upstream maintainer or external contributor | High |
| Functional | Verify/bump klauspost/cpuid/v2 for riscv64 CPU-feature detection | 0.25 | Upstream maintainer or external contributor | Medium |
| CI/CD | Add riscv64 to inspektor-gadget.yml matrices (build-only, yellow tier) | 1 | Upstream maintainer, ideally with RISE runner support | High |
| CI/CD | Extend to full test execution on riscv64 (blue tier) | 1-2 | Upstream maintainer | Medium |
| Dependency | Track containerd/containerd#13020 (riscv64 CI) resolution upstream | 0 (monitoring only) | N/A, external project | Low |
| Distribution | Publish riscv64 release binaries and container images (green tier, upstream as release provider) | 0.5 | Upstream maintainer, after CI lands | Medium |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [Inspektor Gadget GitHub repository](https://github.com/inspektor-gadget/inspektor-gadget)
- [Inspektor Gadget homepage](https://www.inspektor-gadget.io/)
- [.github/workflows/inspektor-gadget.yml (main CI workflow)](https://github.com/inspektor-gadget/inspektor-gadget/blob/main/.github/workflows/inspektor-gadget.yml)
- [Inspektor Gadget GitHub releases page](https://github.com/inspektor-gadget/inspektor-gadget/releases)
- [Ubuntu 26.04 (resolute) package search for Inspektor Gadget](https://packages.ubuntu.com/search?keywords=Inspektor%20Gadget&suite=resolute&searchon=names&section=all)
- [PyPI JSON API for inspektor-gadget (404, no package exists)](https://pypi.org/pypi/inspektor-gadget/json)
- [RISE Python wheel builder index (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/inspektor-gadget/)
- [Arch Linux RISC-V port package listing](https://archriscv.felixc.at/)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Inspektor Gadget blog: Porting an eBPF-based application to arm64 (2022)](https://inspektor-gadget.io/blog/2022/09/porting-an-ebpf-based-application-to-arm64-our-experience-with-inspektor-gadget/)
- [Inspektor Gadget issue #3968: RFE PPC64LE support](https://github.com/inspektor-gadget/inspektor-gadget/issues/3968)
- [Inspektor Gadget issue #3969: RFE s390x support](https://github.com/inspektor-gadget/inspektor-gadget/issues/3969)
- [Inspektor Gadget issue #3992: profiling wasm performances](https://github.com/inspektor-gadget/inspektor-gadget/issues/3992)
- [Inspektor Gadget issue #645: opensnoop CO-RE tracer ARM64 bug (closed)](https://github.com/inspektor-gadget/inspektor-gadget/issues/645)
- [containerd/containerd issue #13020: Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [seccomp/libseccomp-golang issue #52: RFE add support for RISCV64 (closed)](https://github.com/seccomp/libseccomp-golang/issues/52)
- [seccomp/libseccomp issue #110: RFE add RISC-V support (closed)](https://github.com/seccomp/libseccomp/issues/110)
- [klauspost/cpuid issue #158: Support RISC-V (closed 2026-06-16)](https://github.com/klauspost/cpuid/issues/158)
- [CNCF: Inspektor Gadget Sandbox project acceptance](https://www.cncf.io/)
