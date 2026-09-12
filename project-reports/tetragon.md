---
title: Tetragon
parent: Project Reports
color: red
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: libbpf
    relation: runtime-dependency
    criticality: critical
  - name: cilium/ebpf
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: optional
  - name: opencontainers/runtime-spec
    relation: runtime-dependency
    criticality: optional
  - name: Helm
    relation: build-dependency
    criticality: optional
  - name: prometheus/procfs
    relation: runtime-dependency
    criticality: optional
  - name: Buildx
    relation: build-dependency
    criticality: optional
---

# Tetragon

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Tetragon<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="tetragon" %}

## 1. Project Overview

Tetragon ([cilium/tetragon](https://github.com/cilium/tetragon), [tetragon.io](https://tetragon.io/)) is an eBPF-based runtime security observability and enforcement tool. It runs a userspace Go daemon (`tetragon`) plus a set of eBPF C programs (`bpf/`) that attach to kernel tracepoints/kprobes/uprobes to observe process execution, syscalls, and security-relevant events, and can enforce policy (block/kill) in real time. The Go daemon loads and manages the eBPF programs at runtime using the pure-Go `cilium/ebpf` library.

**Governance:** Tetragon is a **CNCF project**, operated as a sub-project of Cilium (a CNCF graduated project). It follows Cilium's shared governance model; `MAINTAINERS.md` points to [`cilium/community/roles/Maintainers.md`](https://github.com/cilium/community/blob/main/roles/Maintainers.md) rather than defining a standalone charter.

**License:** Apache License 2.0 (confirmed from the repository `LICENSE` file).

**Maintainers and corporate sponsorship:** Five listed maintainers (Jiri Olsa, John Fastabend, Kornilios Kourtis, Mahe Tardy, William Findlay), all long-standing eBPF/Cilium engineers at **Isovalent**, the creator and primary corporate sponsor of both Cilium and Tetragon. Isovalent was acquired by **Cisco** in December 2023. William Findlay's GitHub handle (`will-isovalent`) makes the affiliation explicit; the other four maintainers' current employer could not be independently confirmed via GitHub profile metadata [NEEDS VERIFICATION]. Code review is routed through Isovalent-heavy CODEOWNERS teams (`@cilium/tetragon-reviewers`, `@cilium/tetragon-bpf`, `@cilium/tetragon-docs`, `@cilium/tetragon-windows`).

**Community culture on new ports:** Tetragon has precedent for adding an entirely new platform, Windows, complete with a dedicated CODEOWNERS team (`@cilium/tetragon-windows`), its own CI workflow (`windows-build-smoke-test.yml`), native code (`bpf/windows/process_monitor.c`, `install/windows/`), and shipped `tetra-windows-amd64`/`tetra-windows-arm64` release binaries. This indicates maintainers are willing to support new OS/architecture ports **once a dedicated owning group forms around the effort** - a pattern with no RISC-V counterpart today. No written tier/support policy document (`PLATFORMS.md`, `SUPPORT.md`) exists; platform support is implicit in the Makefile/CI build matrix and CODEOWNERS structure.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been started | [GitHub commit search: 0 results](https://github.com/cilium/tetragon) |
| N/A | No tracking issue for a riscv64 port exists (contrast with the closed ARM64 tracking issue #487, closed 2023-04-27) | GitHub issue search, `repo:cilium/tetragon` |
| N/A | No riscv64-related pull request, open or closed, has ever been filed | GitHub pull request search, `repo:cilium/tetragon` |

There is no RISC-V port history to report. Zero commits, zero issues, and zero pull requests mention riscv64 in a genuine, Tetragon-specific way; all apparent search hits were confirmed false positives (ARM64 issues misfired by semantic search, or Renovate/dependabot dependency-bump PR bodies quoting third-party changelogs from Helm, runc, cilium/ebpf, and opencontainers/runtime-spec that happen to mention `riscv64` release artifacts in those upstream projects, not in Tetragon). **The project is not upstream, partially upstream, or in progress - it does not exist.**

## 3. Upstream Support Tier

No formal tier policy document exists. Support tiers are observable only through the CI build matrix and release asset lists, both of which are hardcoded to two architectures.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No |
| CI test execution | Yes | Yes | No |
| Official release binaries | Yes (`tetra-linux-amd64`, `tetragon-vX.Y.Z-amd64.tar.gz`) | Yes (`tetra-linux-arm64`, `tetragon-vX.Y.Z-arm64.tar.gz`) | No |
| Official container images | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |
| Release-blocking | Yes | Yes | N/A - not built |

Evidence: all four multi-arch build/release workflows (`build-images-ci.yml`, `build-images-releases.yml`, `build-clang-image.yaml`, `build-rthooks-images-releases.yml`) set `platforms: linux/amd64,linux/arm64` and nothing else. The [v1.7.1 release asset list](https://github.com/cilium/tetragon/releases/expanded_assets/v1.7.1) (18 files, independently verified in full) contains only `darwin/linux/windows x amd64/arm64` binaries.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Tetragon's architecture-specific surface is concentrated in per-architecture register/ABI handling for its kprobe/uprobe pipeline, not in SIMD/crypto/JIT code. A direct build test (`GOARCH=riscv64 GOOS=linux go build`) confirms these components are **absent**, not merely untested:

```
$ GOARCH=riscv64 GOOS=linux go build ./pkg/selectors/...
pkg/selectors/kernel.go:1279:11: undefined: parseOverrideRegs
pkg/selectors/kernel.go:1338:11: undefined: parseSetRegs

$ GOARCH=riscv64 GOOS=linux go build ./pkg/asm/...
pkg/asm/assignment_linux.go:85:22: undefined: RegOffsetSize   (and 3 more occurrences)

$ GOARCH=riscv64 GOOS=linux go build ./pkg/elf/...
pkg/elf/usdtargs_linux.go:39:25: undefined: parsers
pkg/elf/usdtargs_linux.go:93:35: undefined: closingRune
```

| Component | Purpose | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| `pkg/selectors/kernel_regs_*.go` | Register ABI for kprobe override/set-regs enforcement actions | `kernel_regs_amd64.go` (92 lines, System V AMD64 ABI, `ArgsInRegisters = 6`) - full | `kernel_regs_arm64.go` (77 lines, AArch64 ABI, `ArgsInRegisters = 8`) - full | Missing - no file exists |
| `pkg/asm/regoffset_linux_*.go` | Register-offset tables for the mini in-kernel assembler | Full | Full | Missing - no file exists |
| `pkg/elf/usdtargs_linux_*.go` | USDT argument-string parsers per calling convention | Full | Full | Missing - no file exists |
| `pkg/syscallinfo/{x64,arm64}/ids.go` | Syscall ID tables | Full (`x64`) | Full (`arm64`) | Missing - no `riscv64` directory |
| `bpf/include/vmlinux_generated_{x86,arm64}.h` | Generated CO-RE kernel type header consumed by every BPF C program | Full | Full | Missing - no generated header |
| `bpf/include/vmlinux.h` arch dispatch | Preprocessor branch selecting the above header | `#if defined(__TARGET_ARCH_x86)` | `#elif defined(__TARGET_ARCH_arm64)` | No branch; falls through to nothing |
| `bpf/Makefile.defs` arch detection | Maps `uname -m` to `BPF_TARGET_ARCH` | `x86_64` -> `x86` | `aarch64` -> `arm64` | No case; silently defaults to `x86`, which would generate a mis-targeted BPF build rather than fail loudly |

None of this is a scalar-fallback or partially-tuned implementation gap of the kind Section 6 of the color-coding model addresses for optimization-purpose libraries - Tetragon is not an optimization-purpose project. It is a functional gap: the Go compiler cannot resolve symbols referenced by architecture-agnostic call sites, so `cmd/tetragon` does not link for riscv64 at all.

## 5. Build System, Cross-Compilation, and Toolchain

Tetragon does not use CMake. It is built with GNU Make plus Docker/Buildx; no `CMakeLists.txt` or cross-compilation toolchain file exists anywhere in the repository.

**Build commands (from `Makefile`):**
```
make                              # full build - amd64/arm64 only
make tetragon tetragon-bpf tetra  # minimal build
make image                        # docker image build via Dockerfile
TARGET_ARCH=arm64 make image      # the only other supported value
```

**Toolchain versions and why:**
- Go `1.27.0` (pinned in `go.mod`; builder image `golang:1.27.1` in `Dockerfile`)
- Clang/LLVM 22 (`llvm-toolchain-noble-22`, pinned in `Dockerfile.clang`), used to compile Tetragon's C BPF programs with `-target bpf -mcpu=v2`
- GNU Make, Docker/Podman with Buildx, `libelf-dev`, `libcap-dev` per [`docs/content/en/docs/contribution-guide/development-setup.md`](https://github.com/cilium/tetragon/blob/main/docs/content/en/docs/contribution-guide/development-setup.md)
- No documented minimum GCC version; gcc is used only for the `bpftool` static-link cross-build step via distro packages

**Arch handling is hardcoded to two architectures** (`Makefile`, lines ~30-55):
```make
UNAME_M := $(shell uname -m)
ifeq ($(UNAME_M),x86_64)
    TARGET_ARCH ?= amd64
endif
ifeq ($(UNAME_M),aarch64)
    TARGET_ARCH ?= arm64
endif
TARGET_ARCH ?= amd64
ifeq ($(TARGET_ARCH),amd64)
    BPF_TARGET_ARCH ?= x86
endif
ifeq ($(TARGET_ARCH),arm64)
    BPF_TARGET_ARCH ?= arm64
endif
BPF_TARGET_ARCH ?= x86   # silent fallback for any other TARGET_ARCH, including riscv64
```
Setting `TARGET_ARCH=riscv64` today would **not** produce riscv64 code - it silently falls back to `BPF_TARGET_ARCH=x86`, defining `__TARGET_ARCH_x86` and producing a broken/mistargeted CO-RE build rather than an explicit error.

**Dockerfile cross-compilation** is explicitly scoped to amd64/arm64 in its own header comment: "This Dockerfile can be used to compile natively on amd64 and cross-compile on amd64 for arm64." The `bpftool-builder` stage hardcodes `aarch64-linux-gnu-gcc`/`aarch64-linux-gnu-strip`; there is no `riscv64-linux-gnu-gcc` reference anywhere in the file.

**QEMU usage:** no riscv64-specific QEMU documentation or scripts exist. The standard `docker/setup-qemu-action` used generically across CI workflows only backs the existing amd64/arm64 Buildx matrix.

**Known build failures:** confirmed empirically this session - see Section 4's direct `GOARCH=riscv64 go build` output. This is a genuine compile-time failure (undefined symbols), not a test failure or runtime crash.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Process execution tracing (exec/exit events) | Yes | Yes | No - binary does not build |
| kprobe/uprobe argument capture | Yes | Yes | No - depends on missing register ABI files |
| Override actions (`parseOverrideRegs`) | Yes | Yes | No - undefined symbol at compile time |
| Set-regs enforcement actions (`parseSetRegs`) | Yes | Yes | No - undefined symbol at compile time |
| USDT probe argument parsing | Yes | Yes | No - undefined symbols at compile time |
| Syscall-name-to-ID resolution | Yes (`x64` table) | Yes (`arm64` table) | No - no `riscv64` syscall table |
| Windows support (comparison point) | N/A | N/A | Full native port exists with dedicated CODEOWNERS team and CI |

**Functional gaps:** total. There is no partial or degraded riscv64 mode - the daemon does not compile, so no feature set of any kind is available.

**Performance gaps:** not applicable in the SIMD/vectorization sense - Tetragon's architecture-specific code is register-ABI plumbing, not numerically hot-path code, so there is no "missing SIMD" delta to characterize. The performance question that does exist is qualitative: architecture-unspecified commentary from a [FOSDEM 2026 talk abstract](https://archive.fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/) and a [thenewstack.io article](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/) (quoting Grafana Labs' Nikola Grcevski and Cisco/Isovalent's Bill Mulligan) describes the RISC-V eBPF JIT generally as less mature than x86/ARM64 - "more verbose instruction sequences," possible "slightly higher CPU usage per probe execution" - with testing largely happening on QEMU rather than physical silicon. Neither source names Tetragon or gives exact figures; both are marked [NEEDS VERIFICATION] as general eBPF-ecosystem commentary, not Tetragon-specific data.

**Security hardening gaps:** total, by necessity - the entire enforcement pipeline (override/kill/set-regs actions) is unavailable because the binary does not link.

**NaN / floating-point semantics:** not applicable. Tetragon's codebase (Go control plane, C eBPF programs) has no floating-point-heavy code path; no NaN/FP correctness issue was found or is expected to be relevant.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** All 27 files in `.github/workflows/` were read directly; a case-insensitive grep for `riscv`/`riscv64`/`RISCV` returns zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists for Tetragon itself (the only `.cirrus.yml` in the tree belongs to a vendored third-party dependency, `contrib/tetragon-rthooks/vendor/github.com/godbus/dbus/v5/.cirrus.yml`, and is unrelated to Tetragon's own pipeline).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner type | GitHub-hosted `ubuntu-latest`/`ubuntu-24.04` or self-hosted amd64 | Cross-built via Buildx/QEMU from amd64 runners, or native where configured | None - no runner label, no QEMU riscv64 setup |
| Build job present | Yes | Yes | No |
| Test execution | Yes (`gotests.yml`, `bpf-unit-tests.yml`, `integration-test.yaml`, `run-e2e-tests.yaml`, `vmtests.yml`, `vmpolicytests.yaml`) | Yes | No |
| RISE runners in use | No | No | No - no `riseproject-dev` or RISE runner label reference found anywhere in the workflow files |
| Container image publish | `linux/amd64` | `linux/arm64` | Not in `platforms:` list of any of the four multi-arch workflows |

No RISE Project involvement was found: Tetragon does not appear in any of the 34 posts on the [RISE Project blog](https://riseproject.dev/blog/), in any of the 25 repositories under the `riseproject-dev` GitHub organization, or in the [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (the latter is not directly applicable since Tetragon is not a Python package).

## 8. Distribution and Release Status

| Channel | riscv64 availability |
|---|---|
| GitHub Releases (`tetra`, `tetragon` tarballs) | No. Complete verified asset list for v1.7.1 (18 files) contains only `darwin/linux/windows x amd64/arm64`. |
| Official container images | No. Multi-arch builds are `linux/amd64,linux/arm64` only. |
| PyPI | Not applicable - Tetragon is a Go project, not distributed via PyPI (`pypi.org/pypi/tetragon/json` returns HTTP 404). |
| npm, Maven | Not applicable - no such distribution channel is used by this project. |
| Ubuntu 26.04 (Resolute) | No `tetragon` package exists in the archive at all, for any architecture (`packages.ubuntu.com` search returns no results). |
| Arch Linux RISC-V port | No `tetragon` package found (`archriscv.felixc.at`). |
| RISE wheel builder | Not applicable (no PyPI package); redirects to the PyPI 404. |

**What a user must do to get a working riscv64 binary today:** there is no path. Building from source fails outright (Section 4/5). A working riscv64 build would require, at minimum: adding `pkg/selectors/kernel_regs_riscv64.go`, `pkg/asm/regoffset_linux_riscv64.go`, and `pkg/elf/usdtargs_linux_riscv64.go`; generating `bpf/include/vmlinux_generated_riscv64.h` from a riscv64 kernel; adding a `riscv64` syscall ID table under `pkg/syscallinfo/`; extending `Makefile`/`bpf/Makefile.defs` arch detection; adding a riscv64 cross-compile stage to `Dockerfile`; and adding `linux/riscv64` to the CI build matrix. None of this exists in any branch, fork, or open pull request found during this research.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Go | Build-dependency, critical - compiles the `tetragon`/`tetra` binaries (`go 1.27` per `go.mod`) | Yes - `GOARCH=riscv64` has been an official Go port since Go 1.15 | Yes, well-exercised by upstream Go CI | Ubuntu 26.04 riscv64 ships `golang-go` 2:1.26~1; upstream golang.org also ships riscv64 tarballs directly | No riscv64 issues found for the Go toolchain itself |
| LLVM | Build-dependency, critical - Clang (pinned clang-22, `Dockerfile.clang`) compiles Tetragon's C BPF programs to BPF bytecode | Ubuntu 26.04 riscv64 ships `clang` (clang-21 1:21.1.6-71, `[ports][universe]`); RISC-V is an active upstream LLVM CI target | No riscv64-specific build blocker found for the BPF backend specifically, but upstream `llvm/llvm-project` has 903 open riscv64-tagged issues including genuine miscompile/codegen-correctness reports (e.g. `-O1/-O2/-O3` miscompiles) - none confirmed to affect the BPF target, but unscreened | Ubuntu ports archive only (best-effort, not release-critical tier) | See [project-reports/llvm.md](https://github.com/cilium/tetragon) reference in the dependency scan; worth a closer correctness review before relying on it for riscv64 BPF codegen |
| libbpf | Build-dependency, critical - C library for loading/relocating BPF objects, used internally by `bpftool` | Ubuntu 26.04 riscv64 ships `libbpf1` 1:1.6.3-1ubuntu1, `[ports]` | No riscv64 issues found in `libbpf/libbpf` GitHub search | Ubuntu ports archive | The only Tetragon-repo riscv64 code match anywhere is a vendored `bpf/libbpf/bpf_tracing.h` header (lines 301-329) with generic `#elif defined(__TARGET_ARCH_riscv)` register-mapping macros - upstream libbpf boilerplate present for every consumer, not Tetragon-authored logic, and not wired into Tetragon's own `bpf/process/regs.h` (which is x86/arm64-only) |
| cilium/ebpf | Build-dependency, critical - the actual BPF loader used by the Tetragon Go binary at runtime (pure Go, no cgo), Go module `github.com/cilium/ebpf` v0.22.0 | Yes - pure Go, builds wherever `go build` targets riscv64 | No riscv64-specific runtime testing found in `cilium/ebpf` CI; closest GitHub search matches were unrelated arm64 CI issues | Distributed as vendored Go source, tracks Go toolchain riscv64 support (solid) | No riscv64 issues found |
| golang.org/x/sys | Build-dependency, critical - vendored Go stdlib syscall/CPU-feature bindings | Yes - riscv64 syscall stub files (`*_riscv64.go`) are auto-generated for every GOARCH the Go toolchain supports, present in the vendored tree | Covered by upstream Go's own riscv64 test matrix, not Tetragon-specific | Vendored source, not an OS package | No issues found; this is the source of most of the ~115 "riscv" string hits in the repo-wide grep, all incidental |
| Linux kernel | Runtime-dependency, critical - executes compiled BPF bytecode; Tetragon needs kprobe/tracepoint/BTF support on the running kernel | N/A - kernel component, not a packaged build dependency | riscv64 eBPF JIT (`arch/riscv/net/bpf_jit_comp64.c`) merged upstream since Linux 5.7 (2020) and is generally considered mature; some advanced Tetragon features (multi-attach kprobe/uprobe, ring buffer perf) depend on kernel-version parity with what riscv64 distros ship | Governed by whichever kernel the target riscv64 OS ships | GitHub mirror `torvalds/linux` has issues disabled; riscv64 BPF JIT issue tracking lives on kernel.org/the bpf mailing list, not independently checked this pass [NEEDS VERIFICATION] |
| runc | Runtime-dependency, optional - container runtime referenced in Tetragon's container-runtime-hooks integration | Renovate PR bodies quote runc's own changelog mentioning `riscv64` release artifacts in runc itself - not evidence of Tetragon-side riscv64 work | Not checked directly against runc's own CI this pass | runc publishes its own riscv64 release assets per changelog text seen in Renovate PRs [NEEDS VERIFICATION - not independently confirmed against runc's release page] | No Tetragon-riscv64-specific interaction found |
| opencontainers/runtime-spec | Build-dependency, optional - OCI runtime spec types consumed for container runtime hook integration | Architecture-independent spec/interface definitions; not a compiled artifact | N/A | N/A - spec repository, no binary releases | No riscv64-relevant issues found |
| Helm | Build-dependency, optional - used for `install/kubernetes` chart packaging/linting (`lint-helm.yaml`) | Helm's own changelog (quoted in Renovate PR bodies) references riscv64 release artifacts for the Helm CLI itself, not for anything Tetragon builds | N/A - Helm charts are architecture-independent YAML/templates | Helm publishes its own riscv64 CLI binaries per its release process [NEEDS VERIFICATION - not independently confirmed against Helm's release page this pass] | No riscv64 blocker for Tetragon's use of Helm (charts are not compiled) |
| prometheus/procfs | Runtime-dependency, optional - reads `/proc` for process/CPU metadata | Vendored file `vendor/github.com/prometheus/procfs/cpuinfo_riscvx.go` exists in the tree, meaning upstream `prometheus/procfs` already has generic riscv64 CPU-info parsing support | Not independently tested against a live riscv64 host this pass | Vendored Go source | No riscv64 issues found; this dependency is not a blocker |
| Buildx | Build-dependency, optional - Docker Buildx drives the multi-arch container image builds | Buildx itself supports `linux/riscv64` as a generic Buildx/QEMU target, but Tetragon's own workflow files never pass `linux/riscv64` in their `platforms:` argument | N/A | N/A - Tetragon does not invoke Buildx with a riscv64 platform target anywhere in `.github/workflows/` | The gap here is entirely on Tetragon's side (platform list), not in Buildx's own riscv64 capability |

**Additional indirect dependencies identified during research** (not in the direct list, surfaced via the BPF/container toolchain): `bpftool` (`libbpf/bpftool`, bundled in the Tetragon container image for BPF program/map inspection; found in Ubuntu 26.04 riscv64 `[ports]` at 7.7.0+7.0.0-14.14, but Tetragon's own `Dockerfile` only cross-compiles it for amd64->arm64 today - a Tetragon-side gap, not an upstream bpftool issue); `zlib`/`zlib1g`, `libzstd`/`libzstd1`, and `libcap`/`libcap2` (static-link dependencies of the `bpftool-builder` Dockerfile stage, all present in Ubuntu 26.04 riscv64 `[ports]` with no correctness blockers found, though `libzstd` has two open performance-only riscv64 optimization requests, #4471 and #4546, not build blockers); and `google.golang.org/grpc`/`google.golang.org/protobuf` (pure-Go gRPC transport and wire serialization for Tetragon's API, no cgo, no riscv64-specific concern found).

**Summary:** every native/system-level dependency in the BPF toolchain (LLVM/Clang, libbpf, bpftool, zlib, libzstd, libcap, the Go toolchain) is present in Ubuntu 26.04 riscv64's `[ports]` archive - riscv64 is best-effort there, not release-critical, which is a soft risk even with no open correctness bugs found. None of this changes the bottom line: **Tetragon's own code, not its dependencies, is what fails to build on riscv64.**

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1232](https://github.com/cilium/tetragon/issues/1232) | Segfault in process cache (nil pointer dereference in `pkg/process.(*Cache).get`) | Open since 2023-07-14, last updated 2025-07-16 | Correctness bug | Architecture-agnostic Go panic, not RISC-V related |
| [#4992](https://github.com/cilium/tetragon/issues/4992) | v1.7.0 BPF ringbuf map creation fails on 64KB-page-size ARM64 kernels (GH200/NVIDIA) | Closed 2026-06-26 | Correctness bug (ARM64) | Not RISC-V, but the same bug class (BPF ringbuf map page-size assumptions) would plausibly affect riscv64 once/if a port exists, since RISC-V Linux can also run non-4K page sizes |
| [#5026](https://github.com/cilium/tetragon/issues/5026) | Same ringbuf root cause on ARM64 16K-page kernels (Raspberry Pi 5) | Closed 2026-05-25 | Correctness bug (ARM64) | Fix merged (`tg_rb_events` placeholder bumped to 65536); relevant precedent for a future riscv64 port |
| [#1632](https://github.com/cilium/tetragon/issues/1632) | "Add repeatable benchmarks" | Open, status not further checked | Enhancement | General request to formalize Tetragon's own release-time benchmarks; not riscv64-specific |

**No riscv64-specific bug reports exist** because there is no riscv64 build for anyone to report bugs against.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. There is no tracking issue, no maintainer comment, and no design-doc discussion of RISC-V support, positive or negative, anywhere in the searched issue/PR/commit history.

**Technical blockers** (all confirmed empirically this session, Sections 4-5):
- Missing `pkg/selectors/kernel_regs_riscv64.go` (register ABI for override/set-regs actions)
- Missing `pkg/asm/regoffset_linux_riscv64.go` (register-offset tables)
- Missing `pkg/elf/usdtargs_linux_riscv64.go` (USDT argument parsing)
- Missing `pkg/syscallinfo/riscv64/ids.go` (syscall ID table)
- Missing generated `bpf/include/vmlinux_generated_riscv64.h` (BPF CO-RE header)
- `Makefile`/`bpf/Makefile.defs` arch detection has no riscv64 case (silently misroutes to x86 target flags)
- `Dockerfile`'s `bpftool-builder` stage has no riscv64 cross-toolchain wiring
- No riscv64 entry in any CI workflow's `platforms:` matrix

**Organizational blockers:** no dedicated owning team or sub-maintainer group has formed around RISC-V, unlike the precedent set for Windows support (`@cilium/tetragon-windows` CODEOWNERS team). Per the maintainers' demonstrated pattern, a real port effort would likely need such a group to form before it gains traction.

**Acceptance probability:** [NEEDS VERIFICATION] - no direct maintainer statement exists to assess receptiveness specifically to RISC-V. The Windows precedent suggests structural openness to new ports given a committed external contributor group, but this is inference from analogy, not a stated position on RISC-V.

## 13. Readiness Assessment

- **Color:** red (`color_case`: none - red carries no sub-type)
- **Release provider:** none
- **Justification:** Tetragon has no upstream riscv64 CI (zero riscv64 references across all 27 `.github/workflows/` files; multi-arch build matrices are hardcoded to `linux/amd64,linux/arm64`, verified via [`build-images-releases.yml`](https://github.com/cilium/tetragon/blob/main/.github/workflows/build-images-releases.yml)), no riscv64 release artifact (complete verified 18-asset list for [v1.7.1](https://github.com/cilium/tetragon/releases/expanded_assets/v1.7.1)), and no riscv64 distribution package (Ubuntu 26.04 Resolute and Arch Linux RISC-V both confirmed absent). This alone would place the project at orange under the color model's CI table. It is graded **red** instead because riscv64 support was directly tested and confirmed broken, not merely untested: `GOARCH=riscv64 GOOS=linux go build` fails to compile with undefined-symbol errors across `pkg/selectors`, `pkg/asm`, `pkg/elf`, and transitively `cmd/tetragon`, because the architecture-specific files these packages require (register ABI, register-offset tables, USDT parsers) simply do not exist for riscv64 and there is no default/fallback build tag. This is a build-blocking implementation gap confirmed by direct empirical test, satisfying the color model's red criterion ("riscv64 support confirmed broken or non-functional"), not the "simply untested but buildable" case that would leave it at orange.
- **Optimization level:** not applicable - Tetragon is not an optimization-purpose project (Section 2 of the color model's decision steps is skipped); it is a security-observability tool whose value proposition does not depend on RISC-V-specific numerical/SIMD tuning.
- **Pending work that could change the grade:** none found. No open pull request, no RISE Project engagement (confirmed absent across 34 RISE blog posts, 25 `riseproject-dev` GitHub repositories, and the RISE wheel builder package list), and no community-filed tracking issue exists. The only positive signal is structural precedent (the Windows port), not any RISC-V-specific activity.

## 14. Investment Analysis

RISE has done no work on Tetragon (confirmed absence across RISE blog, GitHub org, and wheel builder - Section 7/12) - none of the estimates below can be reduced by reusing RISE output.

### 14.1 Functional Enablement

Minimum viable riscv64 build requires, in dependency order: (1) a riscv64 register ABI file for kprobe override/set-regs support, informed by the RISC-V Linux calling convention (the vendored `bpf/libbpf/bpf_tracing.h` already documents the register mapping and can serve as a reference, Section 9); (2) a riscv64 register-offset table for the mini assembler; (3) riscv64 USDT argument parsing; (4) a riscv64 syscall ID table (largely mechanical, RISC-V Linux uses the generic syscall numbering); (5) a generated `vmlinux_generated_riscv64.h` CO-RE header from a real riscv64 kernel; (6) `Makefile`/`bpf/Makefile.defs` arch-detection additions; (7) a riscv64 cross-compile stage in `Dockerfile` for both the main binary and the bundled `bpftool`; (8) end-to-end functional validation (kprobe/uprobe attach, override/enforcement actions, ring buffer event delivery) on real riscv64 hardware or a high-fidelity emulator, given the general eBPF-on-RISC-V immaturity noted qualitatively in Section 6.

### 14.2 Performance Optimization

Not applicable as a distinct work stream - Tetragon has no optimization-purpose code path requiring RVV/Zb*-class tuning. The only performance-relevant risk is inherited from the toolchain, not owned by Tetragon: the general immaturity of the RISC-V eBPF JIT and LLVM/BPF codegen described qualitatively in Section 6, which would need monitoring rather than direct Tetragon engineering investment.

### 14.3 CI/CD Infrastructure

Add a `linux/riscv64` leg to the four multi-arch workflows (`build-images-ci.yml`, `build-images-releases.yml`, `build-clang-image.yaml`, `build-rthooks-images-releases.yml`), provision a riscv64 runner (RISE RISC-V CI runners are a plausible source, though no RISE engagement currently exists for this project, Section 7), and add riscv64 to the existing Go/BPF unit-test and e2e-test workflows so the architecture is actually tested, not just built.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because Tetragon has no dependent package ecosystem (it is a standalone daemon/CLI, not a library consumed by a PyPI/npm/Maven/Kubernetes-operator ecosystem).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Register ABI file (`kernel_regs_riscv64.go`) | 1-2 | Tetragon/Isovalent or external contributor with RISC-V ABI expertise | Critical |
| Functional | Register-offset table (`regoffset_linux_riscv64.go`) | 1 | Same | Critical |
| Functional | USDT argument parsing (`usdtargs_linux_riscv64.go`) | 1 | Same | Critical |
| Functional | Syscall ID table (`pkg/syscallinfo/riscv64/`) | 1 | Same | Critical |
| Functional | Generated CO-RE header (`vmlinux_generated_riscv64.h`) + `Makefile`/`bpf/Makefile.defs` arch detection | 1-2 | Same | Critical |
| Functional | `Dockerfile` riscv64 cross-compile stage (main binary + bundled `bpftool`) | 1 | Same | High |
| Functional | End-to-end functional validation on riscv64 hardware/emulator (kprobe/uprobe, enforcement actions, ring buffer) | 2-4 | Same, ideally with real riscv64 hardware access | Critical |
| CI/CD | Add `linux/riscv64` to the four multi-arch build/release workflows | 1 | Same | High |
| CI/CD | Provision riscv64 CI runner (RISE runners or equivalent) and wire into unit/e2e test workflows | 2-3 | Same, coordinating with RISE if engaged | High |
| Organizational | Form a dedicated riscv64 owning group/CODEOWNERS team, mirroring the Windows precedent | ongoing, not a fixed effort estimate | Tetragon maintainers + external sponsor | Critical (precondition per Section 1's observed acceptance pattern) |

Total estimated functional-plus-CI engineering effort: approximately **10-14 person-weeks**, before accounting for the organizational precondition of a dedicated owning group forming, which the Windows precedent (Section 1) suggests is a practical prerequisite for the work being accepted upstream.

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [cilium/tetragon repository](https://github.com/cilium/tetragon)
- [Tetragon homepage](https://tetragon.io/)
- [v1.7.1 release asset list (complete, verified)](https://github.com/cilium/tetragon/releases/expanded_assets/v1.7.1)
- [cilium/tetragon .github/workflows directory](https://github.com/cilium/tetragon/tree/main/.github/workflows)
- [build-images-releases.yml](https://github.com/cilium/tetragon/blob/main/.github/workflows/build-images-releases.yml)
- [cilium/community Maintainers.md](https://github.com/cilium/community/blob/main/roles/Maintainers.md)
- [cilium/tetragon development-setup.md](https://github.com/cilium/tetragon/blob/main/docs/content/en/docs/contribution-guide/development-setup.md)
- [Issue #1232 - segfault in process cache](https://github.com/cilium/tetragon/issues/1232)
- [Issue #4992 - ARM64 64KB page ringbuf failure](https://github.com/cilium/tetragon/issues/4992)
- [Issue #5026 - ARM64 16K page ringbuf failure](https://github.com/cilium/tetragon/issues/5026)
- [Issue #1632 - add repeatable benchmarks](https://github.com/cilium/tetragon/issues/1632)
- [Issue #487 - closed ARM64 support tracking issue (contrast case, no RISC-V equivalent exists)](https://github.com/cilium/tetragon/issues/487)
- [PyPI tetragon package lookup (404, not applicable)](https://pypi.org/pypi/tetragon/json)
- [Ubuntu packages.ubuntu.com search - Tetragon (Resolute, no results)](https://packages.ubuntu.com/search?keywords=Tetragon&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=tetragon)
- [RISE Project blog index (34 posts checked, none mention Tetragon)](https://riseproject.dev/blog/)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [FOSDEM 2026 talk - eBPF Observability on RISC](https://archive.fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/)
- [thenewstack.io - The RISC architecture frontier: Is eBPF ready for ARM64 and RISC-V?](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/)