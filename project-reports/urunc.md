---
title: urunc
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: Unikraft
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: Hermit
    relation: runtime-dependency
    criticality: optional
---

# urunc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for urunc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="urunc" %}

## 1. Project Overview

urunc is a container-runtime shim, written in Go, that lets containerd (and OCI-compatible tooling) launch unikernels and lightweight VMs instead of standard Linux containers. Its primary artifact is `containerd-shim-urunc-v2`, a `runc`-alternative shim that plugs into containerd's shim API. urunc is a **CNCF (Cloud Native Computing Foundation) Sandbox project** ("a Series of LF Projects, LLC," per [urunc.io](https://urunc.io/) and `GOVERNANCE.md`), accepted into CNCF Sandbox on 2026-05-22.

**License:** Apache License 2.0, copyright held by Nubificus LTD (`NOTICE`: "Copyright 2023 Nubificus LTD. or its affiliates.").

**Governance:** A Maintainer Council governs by lazy consensus, with formal votes (simple majority; 2/3 for maintainer removal or charter changes) via `dev@urunc.io` / `dev-priv@urunc.io`. Becoming a Maintainer requires 6+ months of active participation, 3 non-trivial PRs reviewed, and 3 non-trivial PRs merged, followed by nomination and a majority vote. Explicit CNCF hooks exist for resource requests (`cncf-urunc-maintainers@lists.cncf.io`) and Code-of-Conduct escalation to the CNCF CoC Committee.

**Corporate sponsorship:** All three listed maintainers are employed by the same company, **Nubificus LTD** (nubificus.co.uk):

| Name | GitHub | Company |
|---|---|---|
| Charalampos Mainas | @cmainas | Nubificus LTD |
| Georgios Ntoutsos | @gntouts | Nubificus LTD |
| Anastassios Nanos | @ananos | Nubificus LTD |

Commit history (590 commits) confirms Nubificus dominance: `cmainas@nubificus.co.uk` (164), `ananos@nubificus.co.uk` (76), `gntouts@nubificus.co.uk` (56), plus a personal-email alias of the lead maintainer (`charalampos.mainas@gmail.com`, 84). No other company is represented among maintainers - Nubificus is effectively the sole corporate sponsor/steward, with CNCF as the neutral foundation home.

**Community stance on new ports/platforms:** Explicitly open in general, though nothing RISC-V-specific has been proposed or discussed. The README states: *"We plan to add support for more unikernel frameworks and other platforms too. Feel free to contact us for a specific unikernel framework or similar technologies that you would like to see in `urunc`."* The design docs describe the project as *"Un-opinionated and Extensible: Straightforward and easy integration of new unikernel frameworks and sandboxing mechanisms without any porting overhead."* The named next roadmap item is a new unikernel framework (OSv), not a new CPU architecture.

Note: the project was previously hosted at `nubificus/urunc`; that name no longer resolves and is fully redirected to `urunc-dev/urunc`, so no separate commit/issue history exists outside the current repository.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has been started | [urunc-dev/urunc README](https://github.com/urunc-dev/urunc) |

No milestone table can be constructed because there is no RISC-V work to date. `git log --all -i --grep="riscv"` across all 590 commits returns zero matches. GitHub code, issue, and pull-request search (`search_code`, `search_issues`, `search_pull_requests`) for "riscv" in `urunc-dev/urunc` returns zero genuine results. There is no first RISC-V commit, no tracking issue, and no contributor (individual or corporate) who has proposed or begun riscv64 work.

**Is it fully upstream?** Not applicable - there is nothing upstream to be "fully" merged, because no riscv64 port exists in any branch, fork, or open pull request that was found.

## 3. Upstream Support Tier

No file in the repository contains the word "tier" - there is **no formal tiered-support policy document**. Platform support is presented as a flat compatibility matrix (unikernel x VMM x architecture x storage), not a Tier 1/2/3 system.

**Evidence base:**
- `README.md` states explicitly: *"At the moment, `urunc` is available on GNU/Linux for x86_64 and arm64 architectures."*
- All 22-24 GitHub Actions CI workflows build and test only `amd64` and `arm64`.
- All 8 tagged releases (v0.1.0 through v0.8.0) ship only amd64/arm64 static binaries.
- No official riscv64 binaries exist on any channel checked (GitHub releases, PyPI, Ubuntu 26.04 resolute, Arch Linux RISC-V).

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as supported in README | Yes | Yes | No |
| CI build | Yes | Yes | No |
| CI test execution | Yes | Yes | No |
| Release binaries published | Yes (`urunc_static_amd64`, `containerd-shim-urunc-v2_static_amd64`) | Yes (`urunc_static_arm64`, `containerd-shim-urunc-v2_static_arm64`) | No |
| Buildable from source at all | Yes | Yes | No - `Makefile` hard-errors: `$(error Unsupported architecture: $(UNAME_ARCH))` |
| Distro packages | N/A (no distro packages found for any arch) | N/A | None (checked Ubuntu 26.04 resolute, Arch Linux RISC-V) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

urunc has no JIT, SIMD, or cryptographic hot-path code of its own - it is an OCI-runtime shim and hypervisor/unikernel launcher, not a compute library. Its only architecture-specific logic is selecting the correct QEMU machine type, network device, seccomp syscall allowlist, and console device string per host architecture.

**Architecture-dispatch inventory** (all handling is inline `runtime.GOARCH` string comparisons, not per-architecture files or CGO/C intrinsics):

| File | Purpose | amd64 handling | arm64 handling | riscv64 handling |
|---|---|---|---|---|
| `pkg/unikontainers/hypervisors/utils.go` (`cpuArch()`) | Maps Go GOARCH to QEMU arch string | `"amd64" -> "x86_64"` | `"arm64" -> "aarch64"` | None - falls through `default` case, returns `""` |
| `pkg/unikontainers/hypervisors/qemu.go` | QEMU machine-type/NIC-device selection | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/hypervisors/hvt.go` | Seccomp syscall allowlist tweaks | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/hypervisors/vmm.go` | VMM argument construction | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/unikernels/linux.go` | Linux-unikernel launch args | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/unikernels/unikraft.go` | Unikraft launch args | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/unikernels/hermit_rs.go` | Hermit launch args | Implicit (else branch) | `if runtime.GOARCH == "arm64"` | None |
| `pkg/unikontainers/hypervisors/qemu_test.go` | Test coverage of the above | Implicit | Yes | None |

There are no dedicated per-architecture Go files (no `arch_amd64.go` / `arch_arm64.go` with build tags), no `.S` assembly files anywhere in the repository (`find . -name "*.S" -o -name "*.s"` returns nothing), and no `arch/riscv/` or similarly named directory. A repo-wide case-insensitive grep for `riscv|rvv|vfloat|zba|zbb|zbc|zbs|xthead` returns zero real matches - the only hits are false positives inside base64-encoded Go module checksums in `go.sum` (e.g. `ZbCg` matching `zbc` case-insensitively).

**What would happen on a riscv64 host today:** `cpuArch()` would hit the `default` case and silently return an empty string, which would presumably break downstream QEMU/hvt argument construction rather than fail cleanly with an explicit "unsupported" error. This is a latent gap, not an intentional riscv64 code path of any kind (full, partial, or scalar fallback).

### Comparison table per component

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| QEMU machine-type selection | Hand-written (implicit/default branch) | Hand-written (`arm64` branch) | Missing - no branch |
| Seccomp syscall allowlist | Hand-written (implicit/default branch) | Hand-written (`arm64` branch) | Missing - no branch |
| Console/net device strings | Hand-written (implicit/default branch) | Hand-written (`arm64` branch) | Missing - no branch |
| CPU-arch string mapping (`cpuArch()`) | `"x86_64"` | `"aarch64"` | Empty string (silent fallthrough) |

## 5. Build System, Cross-Compilation, and Toolchain

urunc is a Go project (`go.mod`, Go 1.26.4) built via a top-level `Makefile`. There is no `CMakeLists.txt` anywhere in the repository.

**Architecture detection and hard rejection** (`Makefile` lines 30-39):

```make
ifeq ($(origin ARCH), undefined)
    UNAME_ARCH := $(shell uname -m)
    ifeq ($(UNAME_ARCH),x86_64)
        ARCH := amd64
    else ifeq ($(UNAME_ARCH),aarch64)
        ARCH := arm64
    else
        $(error Unsupported architecture: $(UNAME_ARCH))
    endif
endif
```

A riscv64 host (`uname -m` = `riscv64`) hits the `else` branch and the build aborts immediately with `Unsupported architecture: riscv64`. The `all` target (line 152) only builds `amd64` and `arm64` variants. riscv64 is not a stubbed-but-broken target - it cannot even be selected as a build target without first patching the `Makefile` to add an explicit `ARCH=riscv64` override, which is untested upstream.

`docs/installation.md` mirrors this: all download/build instructions key off `dpkg --print-architecture` / `uname -m` for amd64/x86_64 or arm64 binaries (runc, containerd, CNI plugins, nerdctl, monitors, Go toolchain, urunc/shim release tarballs) - no riscv64 branch in any of these.

**Dockerfiles:** only one exists in the whole repository, `deployment/urunc-deploy/Dockerfile` (a Kubernetes DaemonSet deployment image), unrelated to riscv64 cross-compilation. No `docker/`, `.ci/docker/`, or `Dockerfile.riscv64` paths exist. No cross-compilation toolchain files (`cmake/riscv64.cmake` or similar) exist, since there is no `cmake/` directory at all.

**QEMU usage:** QEMU is mentioned only as a supported VM monitor for x86/aarch64 unikernels (`docs/hypervisor-support.md`, README table), never in a riscv64 or cross-architecture build context. No QEMU riscv64 emulation step exists anywhere in CI.

**Known build failures:** The only documented failure mode is the immediate Makefile `$(error ...)` abort on any non-x86_64/aarch64 host - there is no partial build, no compile-time error deep in the Go toolchain, because the build never starts.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | Yes | Yes | No - Makefile hard-errors |
| Runs as containerd shim | Yes | Yes | No |
| QEMU-backed unikernel launch | Yes | Yes | No |
| hvt-backed unikernel launch | Yes | Yes | No |
| Seccomp profile enforcement | Yes (hand-tuned) | Yes (hand-tuned) | No |
| Official release binary | Yes | Yes | No |
| Listed in README supported platforms | Yes | Yes | No |

**Functional gaps:** urunc cannot be built, installed, or run on riscv64 at all today - this is a complete functional gap, not a partial/degraded one. There is no code path, however incomplete, to evaluate for correctness or performance on riscv64.

**Performance gaps:** Not applicable - there is no riscv64 build to benchmark. No SIMD/vectorization work is relevant since urunc contains no compute-intensive kernels of its own.

**Security hardening gaps:** The seccomp syscall allowlist logic (`hvt.go`) has an explicit `arm64` branch and an implicit amd64 default; a riscv64 host would take the amd64-shaped default path if the Makefile rejection were bypassed, which is unverified and untested - this is a latent correctness/security risk rather than a documented gap.

**NaN / floating-point semantics issues:** Not applicable - urunc performs no floating-point computation of its own.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for `urunc-dev/urunc`, in any form - no build, no test, no lint, on any trigger.** This was confirmed by direct inspection of all 22-24 workflow files in `.github/workflows/` at commit `41ccf6060dd6869eb752fd9c2ef13076ce5f8c2b` (2026-09-10), plus confirmation that no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repo root.

Files checked: `add-git-trailers.yml`, `build-latest.yml`, `build-trigger.yml`, `build.yml`, `ci.yml`, `ci_devel.yml`, `ci_main.yml`, `ci_nightly.yml`, `ci_on_push.yml`, `codeql.yml`, `dependency-review.yml`, `kind_test.yml`, `lint.yml`, `pr-merge.yml`, `pr-takeover.yml`, `publish_docs.yml`, `release-trigger.yaml`, `scorecard.yml`, `stale.yml`, `unit_test.yml`, `upload_s3.yml`, `urunc-deploy-test.yml`, `validate-files-and-commits.yml`, `vm_test.yml`.

**The `runner-archs` matrix drives runner selection across every build/test workflow, and never includes riscv64:**

| Workflow | `runner-archs` value |
|---|---|
| [`urunc-deploy-test.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/urunc-deploy-test.yml) | `["amd64", "arm64"]` |
| [`kind_test.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/kind_test.yml) | `["amd64", "arm64"]` |
| [`vm_test.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/vm_test.yml) | `["amd64"]` |
| [`build-latest.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/build-latest.yml) | `["amd64", "aarch64"]` |
| [`ci_nightly.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/ci_nightly.yml) | `["amd64", "arm64"]` |
| [`ci.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/ci.yml) | `["amd64", "arm64"]` |
| [`build-trigger.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/build-trigger.yml) | `["amd64", "arm64"]` |

No workflow, on any trigger (push, pull_request, workflow_dispatch, or nightly schedule), ever instantiates a job on a riscv64 runner - neither a dedicated self-hosted riscv64 runner nor QEMU emulation of riscv64. All runners for the two supported architectures are standard GitHub-hosted labels (`ubuntu-latest`, `ubuntu-22.04`). A repo-wide search for `rv64`, `rv64gc`, `linux/riscv64`, and `riscv-` also returns zero matches, so there is no disguised or partially-hidden riscv64 reference either.

**RISE runners:** No reference to `riseproject-dev` or RISE runner labels exists anywhere in the workflow set - urunc does not use RISE RISC-V CI infrastructure.

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (GitHub-hosted `ubuntu-latest`) | Yes (GitHub-hosted, cross/native) | No |
| Test CI | Yes | Yes | No |
| Release-blocking | Yes (part of `runner-archs` matrix on required workflows) | Yes | N/A - no job exists |
| Hardware/emulation | GitHub-hosted runner | GitHub-hosted runner | N/A |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for urunc on any channel checked.**

- **GitHub Releases** ([`urunc-dev/urunc/releases`](https://github.com/urunc-dev/urunc/releases)): 8 tags (v0.1.0 through v0.8.0). Every release ships only `containerd-shim-urunc-v2_static_amd64`, `containerd-shim-urunc-v2_static_arm64`, `urunc_static_amd64`, `urunc_static_arm64`, plus source zip/tar.gz. The latest, [v0.8.0](https://github.com/urunc-dev/urunc/releases/expanded_assets/v0.8.0), was fetched directly and confirmed to contain exactly these 6 assets - zero riscv64 entries.
- **PyPI**: `https://pypi.org/pypi/urunc/json` returns HTTP 404 - no such package exists. This is expected: urunc is a Go binary/OCI shim, not a Python package, so a PyPI presence was never applicable.
- **npm, Maven Central**: Not applicable - urunc has no JavaScript or JVM component.
- **OCI registry / container images**: The only Dockerfile in the repo (`deployment/urunc-deploy/Dockerfile`) is a Kubernetes DaemonSet deployment image; no riscv64 platform tag was found for it, and this was not exhaustively checked against a container registry API.
- **Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=urunc&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - no `urunc`, `python3-urunc`, or `liburunc` package exists in resolute at all, on any architecture.
- **Arch Linux RISC-V port** (`archriscv.felixc.at/?q=urunc`): no mention of "urunc" anywhere on the page - not packaged.
- **RISE wheel builder** (`gitlab.com/.../packages/pypi/simple/urunc/`): HTTP 302 redirect to the PyPI URL, which itself 404s. No RISE-built wheels exist (expected, since there is no PyPI package to build from).

**What a user must do to get a working binary today:** There is no path to a working riscv64 urunc binary. A user would need to (1) patch the `Makefile` to accept `ARCH=riscv64`, (2) manually cross-compile the Go binaries (plausible for the CGO-free `dynamic` build target, since Go itself supports `GOARCH=riscv64`, but untested upstream), (3) implement the missing `cpuArch()` and hypervisor-argument-construction branches for riscv64 described in Section 4, and (4) validate the result against no existing test coverage. This is a from-scratch porting effort, not a build/packaging gap.

**project-graph MCP server status:** The `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) across every research pass in this investigation. No SPARQL queries against the Ubuntu riscv64 package graph could be executed from that source; the live `packages.ubuntu.com` and `archriscv.felixc.at` checks above independently cover the same ground and are unanimous with each other. This should be retried once the server is available, as a cross-check rather than a source of new information.

## 9. Dependencies

**No dependency in urunc's tree has a hard riscv64 blocker.** containerd, runc, libseccomp(-golang), and CRIU/go-criu all have riscv64 support fully merged upstream, at versions urunc already pins - the common pattern across all of them is "works, but under-tested on real riscv64 CI/hardware," not "broken." The actual gap is urunc itself: the build system explicitly rejects riscv64 hosts and the project documents only amd64/arm64 support.

| Dependency | Role | Category | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|---|
| Go | Build-dependency (critical) - compiler/toolchain for the entire project | Toolchain | Full - Go itself supports `GOARCH=riscv64` as a standard target | N/A (part of the Go toolchain's own release testing) | Ships with every Go release | Not itself a blocker; urunc's own `Makefile` is what rejects riscv64 as a host, not the Go toolchain |
| containerd | Runtime-dependency (critical) - urunc's shim (`containerd-shim-urunc-v2`) plugs into containerd's shim API; core integration point | Core infra | Full - riscv64 syscall/seccomp/PIE support complete since 2021-22 | Nightly cross-compile CI passes (QEMU/cross-toolchain); no native riscv64 hardware CI - tracked in open issue [containerd#13020](https://github.com/containerd/containerd/issues/13020) | Release binaries shipped since v1.6.8 (2022) | None blocking; CI-coverage gap only |
| golang.org/x/sys | Build-dependency (critical) - low-level syscall bindings used throughout (netlink, mount, seccomp arch constants) | Foundational syscall/arch layer | Full riscv64 support (hand-written asm stubs, generated syscall tables) | N/A - exercised by consuming projects' own CI | Ships with every Go release | None found. Note: the only two GitHub search hits for "riscv64" in urunc-dev/urunc (PRs [#670](https://github.com/urunc-dev/urunc/pull/670) and [#766](https://github.com/urunc-dev/urunc/pull/766)) are Dependabot bumps of this dependency where "riscv64" appears solely inside a quoted upstream changelog line ("cpu: detect zbc extension on riscv64") - not a genuine urunc RISC-V change. Both PRs were closed unmerged (Dependabot's own comment: "these dependencies are updatable in another way") |
| QEMU | Runtime-dependency (critical) - VM monitor backing urunc's QEMU-based unikernel launch path | Hypervisor | Not independently re-verified in this pass; QEMU upstream has long-standing riscv64 host and guest support [NEEDS VERIFICATION - not directly re-checked against QEMU's own CI in this research pass] | Same caveat | Same caveat | urunc's own QEMU-argument-construction code (`qemu.go`) has no riscv64 branch (Section 4), so even if the QEMU binary itself supports riscv64, urunc cannot drive it on that architecture today |
| Unikraft | Runtime-dependency (critical) - one of the unikernel frameworks urunc launches | Unikernel framework | Not independently re-verified in this pass. External research references an active third-party riscv64 porting effort (`eduardvintila/unikraft_riscv64`), unaffiliated with urunc [NEEDS VERIFICATION - single-source mention, not cross-checked against Unikraft's own upstream repository in this research pass] | Not verified | Not verified | urunc's `unikraft.go` launch-argument code has no riscv64 branch regardless of Unikraft's own port status |
| Linux kernel | Runtime-dependency (critical) - the Linux unikernel target urunc can launch, and the host kernel urunc itself runs on | Kernel | Full - riscv64 is a mainline-supported Linux architecture with its own arch tree | [NEEDS VERIFICATION - general knowledge of mainline Linux riscv64 support was not cross-checked against a specific CI source in this research pass] | Distros ship riscv64 kernels | urunc's own `linux.go` launch-argument code has no riscv64 branch (Section 4) |
| Hermit | Runtime-dependency (optional) - one of the unikernel frameworks urunc can launch (Hermit-rs) | Unikernel framework | Not independently re-verified in this pass [NEEDS VERIFICATION - not cross-checked against Hermit's own upstream repository in this research pass] | Not verified | Not verified | urunc's `hermit_rs.go` launch-argument code has no riscv64 branch regardless of Hermit's own port status |

**Deep-dive - dependencies most relevant to correctness/security on riscv64:**

- **runc** (vendored packages, not a direct runtime dependency but its `libcontainer`/seccomp code is vendored into urunc's dependency tree): `AUDIT_ARCH_RISCV64`, seccomp BPF mapping, and nolibc dmz are all riscv64-aware at the source level. `runc.riscv64` release binaries have shipped since v1.2.0 (2022). However, runc's own integration test matrix includes riscv64 only since 2025 and is **not run in upstream CI** - tested only via community/real-hardware reports, and maintainers explicitly disclaim CI support ("this does not mean we support these architectures").
- **seccomp/libseccomp-golang** (CGo binding onto libseccomp C library) - riscv64 landed in libseccomp-golang v0.9.2 ([issue #52](https://github.com/seccomp/libseccomp-golang/issues/52)); the underlying C library has had full riscv64 parity with arm64 since v2.5.0 (2020), with 5,229/5,229 tests passing on real RISC-V hardware, though no upstream CI runs it (same posture as arm64 for this library).
- **checkpoint-restore/go-criu** (indirect, via runc) - pure Go, builds trivially on riscv64. The underlying `criu` binary has dedicated `criu/arch/riscv64/` and `compel/arch/riscv64/` trees, stable (non-experimental) since CRIU v4.1 (March 2025), tested on every push/PR and daily.
- **cilium/ebpf** (indirect, via containerd) - pure Go, syscall-mediated; no riscv64-specific gaps found. Actual eBPF execution depends on the riscv64 Linux kernel's own eBPF JIT (upstream since kernel 5.19), not this library.
- **klauspost/compress** (indirect, via containerd/grpc) - pure Go with amd64/arm64 assembly fast paths; runs correctly on riscv64 via the generic Go fallback, but without the SIMD-accelerated codec path (a performance gap, not a correctness blocker).
- **google.golang.org/grpc** - pure Go, no cgo/arch-specific code path; low risk.

None of urunc's dependencies present a hard riscv64 blocker. The gating factor for a riscv64 port is entirely urunc's own code and build system, not its dependency tree.

Note: urunc has no dependent package ecosystem (no PyPI/npm/Maven consumers depend on it as a library) - it is a standalone containerd shim binary, so Section 10 (Ecosystem Status) is omitted per scope rules.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issues exist | N/A | N/A | GitHub issue search (`riscv`, `riscv64`, `RISC-V`, scoped to `repo:urunc-dev/urunc`) returns 0 results across every query tried |

The only issue that superficially matched a "riscv64 bug" search was [#995](https://github.com/urunc-dev/urunc/issues/995), "bug: silent data loss when multiple functions append to the same initrd cpio archive" - this is an architecture-agnostic cpio/initrd correctness bug, closed as a duplicate on 2026-08-27, with no RISC-V connection; the match was purely textual/semantic noise from the search, not a genuine RISC-V issue.

**Correctness bugs:** None exist to highlight for riscv64, because there is no riscv64 code to have a correctness bug in.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or community member has objected to a riscv64 port; the absence of riscv64 support reflects that no one has proposed or attempted one, not that a request was declined.

**Technical blockers:**
1. The `Makefile` explicitly rejects any host architecture other than x86_64/aarch64 (`$(error Unsupported architecture: $(UNAME_ARCH))`), so riscv64 cannot even be selected as a build target without a code change.
2. Every architecture-dispatch site in the codebase (Section 4) is a binary `arm64`-vs-`else` switch with no riscv64 branch; a straightforward `ARCH=riscv64` override to the Makefile would not be sufficient on its own - the hypervisor/unikernel launch-argument logic would need new riscv64 branches for QEMU machine type, seccomp allowlists, and console/net device strings.
3. No riscv64 CI exists to validate any such port once written.

**Organizational blockers:** urunc has a single corporate sponsor (Nubificus LTD, three maintainers) with no RISC-V vendor (SiFive, Andes, etc.) currently represented among contributors or on the CNCF Sandbox project. Nubificus/urunc does not appear on the [RISE Project members list](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Canonical, Microchip, ZTE, and others), so there is no RISE funding or sponsorship backing a port. This means any riscv64 work would need to be initiated either by Nubificus itself or by an outside contributor with no existing relationship to the project.

**Acceptance probability:** The project's stated openness to new unikernel frameworks and platforms (Section 1) suggests a riscv64 port proposal would likely be welcomed procedurally (lazy-consensus governance, no gatekeeping precedent found), but this is inference from general project posture, not from any RISC-V-specific statement, since none exists. [NEEDS VERIFICATION - no direct maintainer statement on RISC-V was found in any channel searched.]

## 13. Readiness Assessment

- **Color:** orange (base case - no upstream riscv64 CI and no distro/third-party riscv64 package)
- **Release provider:** none
- **Justification:** All 22-24 GitHub Actions workflow files in `urunc-dev/urunc` were read directly; every `runner-archs` build/test matrix is `["amd64","arm64"]` only, confirmed via [`urunc-deploy-test.yml`](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/urunc-deploy-test.yml) and cross-checked against release asset lists for all 8 tags v0.1.0-v0.8.0, which ship amd64/arm64 static binaries only (e.g. [v0.8.0 release assets](https://github.com/urunc-dev/urunc/releases/expanded_assets/v0.8.0)). No Linux distribution ships an `urunc` package on any architecture (Ubuntu 26.04 resolute search returns no results; not listed on [Arch Linux RISC-V](https://archriscv.felixc.at/?q=urunc)), so the distribution floor does not apply and cannot lift the grade to yellow. Per the color model, "no upstream CI, no distro package" defaults to orange rather than red, since there is no positive evidence of breakage on riscv64 - the architecture is simply unimplemented, and the `Makefile` explicitly and cleanly rejects it at build time rather than failing partway through a broken build.
- **Optimization-purpose applicability:** Not applicable. urunc is a container/unikernel runtime shim, not a project whose primary value proposition is out-performing a reference implementation on a specific algorithm; the Step 2 optimization-coverage modifier of the color model does not apply, and `optimization_gap` is recorded as N/A.
- **Pending work that could change the grade:** None found. No open PR, issue, or RISE engagement addresses riscv64 for this project. The two GitHub search hits mentioning "riscv64" (PRs [#670](https://github.com/urunc-dev/urunc/pull/670) and [#766](https://github.com/urunc-dev/urunc/pull/766)) are unrelated Dependabot dependency bumps, both closed unmerged. urunc/Nubificus LTD is not a RISE member and has no RISE-funded work in flight. The only trace of RISC-V-readiness activity connected to urunc at all is an internal queue entry in this report repository's `project-reports/.queue.yml`, marking urunc as a project awaiting this very report - not upstream or RISE activity.

## 14. Investment Analysis

**RISE involvement check:** No RISE funding, sponsorship, CI runner usage, or blog coverage of urunc was found anywhere (RISE members list, RISE blog site search, RISE Python wheel builder list, `riseproject-dev` GitHub org). All investment below is therefore unclaimed work, not double-counted against any existing RISE effort.

### 14.1 Functional Enablement

The core functional work is: (1) remove or extend the Makefile's architecture allowlist to accept riscv64; (2) add a riscv64 branch to `cpuArch()` (`utils.go`) mapping `"riscv64" -> "riscv64"` (QEMU's own arch-naming convention); (3) add riscv64 branches to the QEMU machine-type/NIC-device selection (`qemu.go`), the hvt seccomp allowlist (`hvt.go`), and the per-unikernel launch-argument construction (`linux.go`, `unikraft.go`, `hermit_rs.go`); (4) validate against a real riscv64 QEMU guest running each supported unikernel target. Because urunc's dependencies (containerd, runc, libseccomp-golang, go-criu) already have riscv64 support at the versions urunc pins (Section 9), this is a bounded, well-scoped porting task rather than a multi-project effort.

### 14.2 Performance Optimization

Not applicable. urunc contains no compute-intensive kernels, SIMD code, or JIT of its own; it dispatches to QEMU/hvt and vendored dependencies for anything performance-sensitive. No riscv64-specific performance work is meaningful until functional enablement (14.1) exists.

### 14.3 CI/CD Infrastructure

Once a functional port exists, riscv64 needs to be added to the `runner-archs` arrays in `urunc-deploy-test.yml`, `kind_test.yml`, `vm_test.yml`, `build-latest.yml`, `ci_nightly.yml`, `ci.yml`, and `build-trigger.yml`, plus a riscv64 entry in `release-trigger.yaml`'s artifact matrix. Whether this runs on QEMU emulation or native riscv64 hardware runners (e.g., via RISE's RISC-V Runners program, which was found to support other CNCF-adjacent projects such as k0s/Kairos/k3s/Kubernetes/containerd per the RISE blog, but not urunc) is an open question depending on available hardware access.

### 14.4 Ecosystem Enablement

Not applicable - urunc has no dependent package ecosystem (no PyPI/npm/Maven consumers).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch `Makefile` to accept `ARCH=riscv64` as a valid build target | 0.5 | Nubificus / external contributor | Critical |
| Functional | Add riscv64 branch to `cpuArch()` and all hypervisor/unikernel launch-argument dispatch sites (7 files) | 1-2 | Nubificus / external contributor | Critical |
| Functional | Validate build + launch against real riscv64 QEMU guest for each supported unikernel (Linux, Unikraft, Hermit, etc.) | 2-3 | Nubificus / external contributor | Critical |
| CI/CD | Add riscv64 to `runner-archs` matrices across 7 workflow files and release artifact matrix | 0.5-1 | Nubificus | High |
| CI/CD | Source riscv64 CI runners (native hardware or RISE RISC-V Runners program) | 0.5 (coordination) | Nubificus / RISE liaison | High |
| Distribution | Publish riscv64 release binaries once CI passes | included above | Nubificus | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [urunc-dev/urunc GitHub repository](https://github.com/urunc-dev/urunc)
- [urunc.io homepage](https://urunc.io/)
- [urunc-dev/urunc README.md](https://github.com/urunc-dev/urunc/blob/main/README.md)
- [urunc-dev/urunc GOVERNANCE.md](https://github.com/urunc-dev/urunc/blob/main/GOVERNANCE.md)
- [urunc-dev/urunc MAINTAINERS.md](https://github.com/urunc-dev/urunc/blob/main/MAINTAINERS.md)
- [urunc-dev/urunc LICENSE / NOTICE](https://github.com/urunc-dev/urunc/blob/main/NOTICE)
- [urunc-dev/urunc .github/workflows/](https://github.com/urunc-dev/urunc/tree/main/.github/workflows)
- [urunc-dev/urunc urunc-deploy-test.yml](https://github.com/urunc-dev/urunc/blob/main/.github/workflows/urunc-deploy-test.yml)
- [urunc-dev/urunc Makefile](https://github.com/urunc-dev/urunc/blob/main/Makefile)
- [urunc-dev/urunc releases](https://github.com/urunc-dev/urunc/releases)
- [urunc-dev/urunc v0.8.0 release assets](https://github.com/urunc-dev/urunc/releases/expanded_assets/v0.8.0)
- [urunc-dev/urunc PR #670 (Dependabot bump, closed unmerged)](https://github.com/urunc-dev/urunc/pull/670)
- [urunc-dev/urunc PR #766 (Dependabot bump, closed unmerged)](https://github.com/urunc-dev/urunc/pull/766)
- [urunc-dev/urunc issue #995 (cpio/initrd bug, unrelated to RISC-V)](https://github.com/urunc-dev/urunc/issues/995)
- [PyPI JSON API for "urunc" (404 - no package exists)](https://pypi.org/pypi/urunc/json)
- [Ubuntu 26.04 (resolute) package search for "urunc" (no results)](https://packages.ubuntu.com/search?keywords=urunc&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search for "urunc" (not listed)](https://archriscv.felixc.at/?q=urunc)
- [RISE Project members list (urunc/Nubificus not present)](https://riseproject.dev/members/)
- [RISE RISC-V Runners: six weeks in (no urunc mention)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Announcing the RISE RISC-V Runners (no urunc mention)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [containerd issue #13020 (riscv64 native hardware CI gap)](https://github.com/containerd/containerd/issues/13020)
- [seccomp/libseccomp-golang issue #52 (riscv64 support landed in v0.9.2)](https://github.com/seccomp/libseccomp-golang/issues/52)