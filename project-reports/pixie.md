---
title: Pixie
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="pixie" %}

# Pixie

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Pixie<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Pixie is an eBPF-based observability platform for Kubernetes, providing auto-instrumented application and infrastructure telemetry (service maps, resource metrics, application traces, log data) without requiring code changes. It is built primarily in C++ (the "Stirling" eBPF data-collection subsystem and the "Carnot" query engine) and Go (control-plane services), with a TypeScript/React UI (`src/ui`), and is built with Bazel 7.7.1.

**Governance:** Pixie was contributed by New Relic, Inc. to the Cloud Native Computing Foundation (CNCF) as a Sandbox project in June 2021, per the project's own [README](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/README.md). Governance is structured as a Governance Board (2 project members, 2 community members, 2 end-user community members) deciding by lazy consensus, with day-to-day maintenance handled by a smaller Maintainers group requiring sponsorship from two existing maintainers, per [GOVERNANCE.md](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/GOVERNANCE.md). License is Apache 2.0.

**Corporate sponsors / current maintainers** (per [MAINTAINERS](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/MAINTAINERS)): Zain Asgar (Stanford University), Michelle Nguyen, Vihang Mehta, James Bartlett (all Gimlet Labs), Dom Delnano (Cosmic). Three of five active maintainers are affiliated with Gimlet Labs, a post-New Relic spinout; the founder remains Stanford-affiliated. The project's origin traces through Pixie Labs (startup) to New Relic (acquisition) to CNCF donation (2021).

**Community culture on new ports:** GOVERNANCE.md's "Other Projects" clause governs acceptance of new sub-projects (Apache 2.0 license, in-scope, sponsoring maintainer required) but does not address CPU-architecture ports specifically. The observed pattern, based on the ARM64 port (see Section 2), is informal: a port is undertaken once enough user-filed GitHub feature requests accumulate reaction counts, and a maintainer picks it up and drives it through incremental sub-issues. There is no fast-track process or pre-committed roadmap for new architectures.

## 2. Port History and Upstreaming Timeline

**No RISC-V port has ever been proposed, attempted, or discussed.** GitHub issue, PR, and commit searches for "riscv" / "riscv64" / "RISC-V" scoped to `pixie-io/pixie` return zero results across every search performed (issue search, PR search, commit search, code search - the only code-search hit is the incidental Bazel patch described in Section 4). There is no tracking issue, no design discussion, no abandoned branch.

| Date | Event | Source |
|---|---|---|
| 2020-10-08 | Issue #147 "Support ARM CPUs" opened (Pixie fails to deploy on Raspberry Pi 4 / ARM microk8s) | [issue #147](https://github.com/pixie-io/pixie/issues/147) |
| 2021-05-06 | Issue #248 "cli arm64 support" opened (px CLI install script arch detection) | [issue #248](https://github.com/pixie-io/pixie/issues/248) |
| 2021-06 | Pixie contributed to CNCF as a Sandbox project | [README](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/README.md) |
| 2023-02 | Sub-issues #891 (Java symbolization on ARM), #892 (Operator/OLM on ARM) opened, assigned to maintainers vihangm/zasgar/jamesmbartlett | issue #891, #892 (cited in prior research; not independently re-fetched) |
| 2023-03-01 | Issue #147 closed as completed | [issue #147](https://github.com/pixie-io/pixie/issues/147) |
| 2023-10 | Issue #1752 "[ARM] support" closed, marking ARM64 support complete | issue #1752 (cited in prior research) |
| - | **No equivalent RISC-V milestone exists at any point in the project's history.** | n/a |

**Is it fully upstream?** There is nothing to be upstream. Pixie has zero lines of RISC-V-specific code, zero riscv64 CI, and zero riscv64 release artifacts (see Sections 4, 7, 8). The only architecture ever added beyond the original x86_64 target is ARM64, completed over roughly three years (2020-2023) via the pattern described above.

## 3. Upstream Support Tier

Pixie does not publish a formal Tier-1/Tier-2 architecture support matrix (unlike, for example, Kubernetes or Go). Its own installation requirements documentation lists supported node architectures simply as "Supported" or not, per [docs.px.dev/installing-pixie/requirements](https://docs.px.dev/installing-pixie/requirements/).

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Listed in install requirements as "Supported" | Yes | Yes | Not mentioned |
| Dedicated Bazel toolchain/sysroot | Yes (`clang-15.0-x86_64*`) | Yes (`clang-15.0-aarch64-glibc2.36-sysroot`) | None exists |
| CI builds and tests | Yes (self-hosted `oracle-*-x86-64` runners) | Data not available: no arm64-labeled CI runner was identified in the workflow files reviewed; arm64 support is validated via cross-compile + QEMU per `src/experimental/multi_arch/README.md`, not native CI hardware | No CI of any kind |
| Official release artifacts | Yes (container images, `px` CLI) | Multi-arch Docker builds referenced (`linux/amd64,linux/arm64`) [NEEDS VERIFICATION - not independently confirmed against a release manifest in this research pass] | None |
| Architecture-dispatch macro in `src/common/base/arch.h` | `X86_64` | `AARCH64` | No macro defined |

Source: [`bazel/cc_toolchains/toolchains.bzl`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/toolchains.bzl), [`src/common/base/arch.h`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/common/base/arch.h), [docs.px.dev/installing-pixie/requirements](https://docs.px.dev/installing-pixie/requirements/).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Pixie's architecture-specific surface is concentrated in Stirling, the eBPF data-collection subsystem, which must resolve kernel `task_struct` offsets, parse ELF binaries, and decode CPU register state per architecture to attach and interpret BPF probes.

`src/common/base/arch.h` (the project's central architecture-detection header) defines exactly two macros:
```c
#if defined(__x86_64__) || defined(_M_X64)
#define X86_64 1
...
#if defined(__aarch64__) || defined(_M_ARM64)
#define AARCH64 1
```
There is no third branch and no catch-all fallback macro. Source: [`src/common/base/arch.h`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/common/base/arch.h).

This dichotomy is consumed by every architecture-sensitive subsystem:

| Component | Purpose | x86_64 | arm64 | riscv64 |
|---|---|---|---|---|
| `src/stirling/bpf_tools/task_struct_resolver.cc` | Resolves kernel `task_struct` field offsets for eBPF instrumentation | Implemented | `#if AARCH64`-guarded dedicated logic (lines 141, 189) | Missing - no branch exists |
| `src/stirling/obj_tools/elf_reader.cc` | ELF parsing (`Arch` enum: `ArchX86_64`, `ArchAarch64`) | Implemented | Implemented | No `ArchRiscv64` case, including in the `e_machine` switch |
| `src/stirling/utils/linux_headers.cc` | Kernel-header detection/matching for BPF compilation | Implemented | Implemented | Missing |
| `src/stirling/source_connectors/socket_tracer/bcc_bpf/go_trace_common.h` | Go goroutine register-decoding macros (`TARGET_ARCH_X86_64`, `TARGET_ARCH_AARCH64`) | Implemented | Implemented | Missing |
| `src/experimental/multi_arch/hello.cc` | Cross-arch build/QEMU-execution smoke test | Implemented | Implemented | Missing |

No RVV intrinsics, no RISC-V assembly (`.S` files targeting riscv64), no `arch/riscv/`-style directory, and no JIT/SIMD dispatch path for riscv64 exist anywhere in the repository. This was independently confirmed via GitHub code search (`#ifdef __riscv repo:pixie-io/pixie`, `vfloat32m1_t`, `rvv`, `Zba`, `__riscv`, `RISCV` - all 0 hits except the one incidental Bazel-patch hit below) and a full local-clone grep at commit `830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef`.

The only three repo-wide occurrences of the string "riscv" are all incidental and not part of Pixie's own architecture-dispatch code:

1. [`bazel/external/rules_docker_arch.patch`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/external/rules_docker_arch.patch) - a vendored patch to upstream Bazel `rules_docker` adding `riscv64`/`riscv32` to a generic CPU-constraint-to-OCI-arch-string mapping table. It is not invoked by any Pixie build target.
2. [`src/ui/yarn.lock`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/ui/yarn.lock) - transitive npm lockfile entries for esbuild's optional `@esbuild/linux-riscv64` prebuilt-binary package.
3. `src/stirling/obj_tools/testdata/go/test_buildinfo_with_mods` - a compiled Go test-fixture binary whose embedded `debug/elf` symbol table (a Go stdlib artifact, `applyRelocationsRISCV64`) enumerates all ELF relocation types the Go toolchain supports; unrelated to Pixie's own code.

Pixie is not an optimization-purpose project under the color-grading model (it is an eBPF observability platform, not a SIMD/JIT/allocator library whose value proposition is architecture-specific speed), so the Step 2 optimization modifier does not apply to Pixie itself. It does, however, depend on optimization-purpose libraries (TensorFlow, cpuinfo, simdutf, Abseil) whose own riscv64 maturity varies - see Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

Pixie uses **Bazel 7.7.1** exclusively (pinned in `.bazelversion`). There is no CMake anywhere in the repository (`CMakeLists.txt` does not exist), so CMake-style `-DUSE_X=OFF` flags do not apply to this project.

Standard build/test commands, per [`DEVELOPMENT.md`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/DEVELOPMENT.md):
```bash
./scripts/run_docker.sh
bazel test //src/<path> --test_output=errors -j $(nproc)
bazel run //src/pixie_cli:px -- deploy
```

**Registered toolchains**, per [`bazel/cc_toolchains/toolchains.bzl`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/toolchains.bzl):
```python
clang_register_toolchain(name="clang-15.0-x86_64", clang_version="15.0.6", libc_version="glibc_host")
clang_register_toolchain(name="clang-15.0-x86_64-glibc2.36-sysroot", clang_version="15.0.6", libc_version="glibc2_36")
clang_register_toolchain(name="clang-15.0-aarch64-glibc2.36-sysroot", clang_version="15.0.6", libc_version="glibc2_36")
clang_register_toolchain(name="clang-15.0-exec", clang_version="15.0.6", libc_version="glibc_host", use_for_host_tools=True)
native.register_toolchains("//bazel/cc_toolchains:cc-toolchain-gcc-x86_64-gnu")
```
Only Clang 15.0.6 (x86_64, aarch64) and one GCC x86_64 toolchain are registered. [`bazel/cc_toolchains/sysroots/sysroots.bzl`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/sysroots/sysroots.bzl) sets `_sysroot_architectures = ["aarch64", "x86_64"]`. **No riscv64 toolchain, sysroot, or clang target is defined anywhere in the build system.** Data not available on the specific version rationale (why Clang 15.0.6 / glibc 2.36 were chosen) beyond what the toolchain file itself states.

**Cross-compilation precedent (arm64 only):** [`src/experimental/multi_arch/README.md`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/experimental/multi_arch/README.md) documents Pixie's only cross-architecture workflow:
```bash
sudo apt install binutils-aarch64-linux-gnu g++-12-aarch64-linux-gnu gcc-12-aarch64-linux-gnu
sudo apt install qemu-user qemu-user-static
aarch64-linux-gnu-g++-12 -static -o aarch64_hello hello.cc
qemu-aarch64 ./aarch64_hello
docker buildx build --platform linux/amd64,linux/arm64 .
```
`docker buildx --platform` is capped at `linux/amd64,linux/arm64`; riscv64 is never listed as a target. Separately, `bazel/test_runners/qemu_with_kernel/` uses QEMU to boot different Linux kernel versions for eBPF integration tests, not for cross-architecture execution - this is unrelated to riscv64 enablement.

**Known build failures for riscv64:** none can be reported, because no riscv64 build has ever been attempted (there is no code path to fail).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles at all | Yes | Yes | No - no toolchain exists |
| eBPF probe attachment (Stirling) | Yes | Yes | No - `task_struct_resolver.cc` has no riscv64 branch |
| ELF/binary introspection | Yes | Yes | No - `ArchRiscv64` absent from the `Arch` enum |
| Go application tracing (goroutine register decode) | Yes | Yes | No - `TARGET_ARCH_RISCV64` macro absent |
| Container image / Operator deployment | Yes | Yes (per `src/experimental/multi_arch/README.md` buildx target) | No - not a buildx target |
| ML functions (Carnot, via TensorFlow) | Yes | Data not available (not confirmed for this research pass) | No - blocked upstream by both the missing Pixie toolchain and open TensorFlow riscv64 compile failures (Section 9) |

**Functional gap:** total. There is no partial riscv64 functionality to compare - the project does not build for the architecture at all, so every feature is unavailable, not degraded.

**Performance gap:** not applicable - there is nothing running to benchmark. No performance data exists (Section 12 covers the adjacent eBPF-on-RISC-V literature that does not name Pixie).

**Security hardening gaps / NaN and floating-point semantics issues:** Data not available: searched for riscv64-specific correctness or hardening issues in pixie-io/pixie directly (zero results, consistent with zero riscv64 code existing to have such issues). At the dependency level, Abseil has an open floating-point-semantics report on riscv64 (`abseil/abseil-cpp` [#1684](https://github.com/abseil/abseil-cpp/issues/1684), closed, NegativeNaN test failure) - relevant only if and when Pixie is ever ported, since Abseil is a pervasive dependency (Section 9).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by directly reading all 26 files in `.github/workflows/` at commit `830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef`: `build_and_test.yaml`, `cacher.yaml`, `cli_release.yaml`, `cloud_release.yaml`, `codeql.yaml`, `copybara_px_api.yaml`, `filename_linter.yaml`, `fossa.yaml`, `get_image.yaml`, `mirror_demos.yaml`, `mirror_deps.yaml`, `mirror_releases.yaml`, `operator_release.yaml`, `oss_scorecard.yaml`, `perf.yaml`, `perf_common.yaml`, `pr_3p_deps.yaml`, `pr_description_linter.yaml`, `pr_genfiles.yml`, `pr_linter.yml`, `release_update_docs_px_dev.yaml`, `release_update_readme.yaml`, `trivy_fs.yaml`, `trivy_images.yaml`, `update_script_bundle.yaml`, `vizier_release.yaml`. `grep -rniE "riscv"` against this directory returns zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci` config, or `azure-pipelines*.yml` exists anywhere in the repository.

**Runners used anywhere in the repo** (exhaustive `runs-on:` grep): `macos-latest`, `oracle-16cpu-64gb-x86-64`, `oracle-8cpu-32gb-x86-64`, `oracle-vm-16cpu-64gb-x86-64`, `ubuntu-latest`. Every runner is explicitly x86-64 (self-hosted Oracle VMs, named accordingly) or a standard GitHub-hosted `ubuntu-latest`/`macos-latest` runner - never a RISC-V runner label. No reference to `riseproject-dev` or RISE RISC-V runner infrastructure exists in the workflow files.

The build/test matrix (`build_and_test.yaml`, generated by `./ci/github/matrix.sh`) varies build configurations (asan/tsan/etc.), not CPU architecture; `grep -niE "riscv|arch"` against `ci/github/matrix.sh` returns zero matches. QEMU usage in CI is limited to booting different Linux kernel versions for eBPF integration tests (`bazel/test_runners/qemu_with_kernel/`), not cross-architecture execution.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (self-hosted Oracle x86-64 VMs) | Data not available: no dedicated arm64 CI job identified; arm64 validation appears limited to the manual QEMU workflow documented in `src/experimental/multi_arch/README.md`, not automated CI | No |
| CI tests | Yes | Data not available | No |
| CI publishes riscv64 image/artifact | N/A (native) | `docker buildx build --platform linux/amd64,linux/arm64` referenced in `multi_arch/README.md` [NEEDS VERIFICATION - not confirmed this is wired into an actual release workflow rather than a developer how-to] | No |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**No riscv64 binaries exist for Pixie through any channel checked.**

- **GitHub Releases:** the most recent releases (`Vizier v0.14.16-pre-...`, `release/cloud/v0.1.10-pre-...`) are internal/dev pre-release builds. Assets are `vizier_template_yamls.tar(.asc/.sha256)`, `vizier_yamls.tar(.asc/.sha256)`, and source zip/tar.gz - no riscv64/riscv filenames of any kind. Source: [pixie-io/pixie releases](https://github.com/pixie-io/pixie/releases).
- **PyPI:** [`https://pypi.org/pypi/pixie/json`](https://pypi.org/pypi/pixie/json) has an empty `urls` array and an empty `releases` file list under the only listed version, `0.1`. The package ("Pixie Framework Routing Module") is an unrelated, effectively squatted placeholder, not pixie-io/pixie. Confirmed via [`https://pypi.org/simple/pixie/`](https://pypi.org/simple/pixie/), which lists zero files of any architecture.
- **RISE GitLab wheel builder:** [`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/pixie/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/pixie/) returns HTTP 302, redirecting to the empty PyPI page above - no "pixie" package is registered in RISE's index.
- **Ubuntu 26.04 (resolute):** [package search for "Pixie"](https://packages.ubuntu.com/search?keywords=Pixie&suite=resolute&searchon=names&section=all) returns only two unrelated matches: `libpixie-java` (arch: `all`, a Java Vector Format Viewer library) and `pixiewps` (arch: amd64, arm64, armhf, ppc64el, riscv64, s390x - an unrelated WPS pixie-dust attack tool). No package named `pixie`, `python3-pixie`, or `libpixie` matching the pixie-io/pixie project exists for any architecture.
- **Arch Linux RISC-V port:** [`https://archriscv.felixc.at/?q=pixie`](https://archriscv.felixc.at/?q=pixie) returns zero results.

**What a user would have to do to get a working riscv64 Pixie binary today:** build it from source after first adding a riscv64 Bazel toolchain/sysroot (none exists upstream), adding riscv64 branches to `arch.h` and every downstream architecture-dispatch site listed in Section 4, and resolving the open riscv64 gaps in the TensorFlow and cpuinfo dependencies (Section 9). This is new-port-level engineering work, not a packaging or release-channel gap.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Bazel | build-dependency, critical | Yes (Bazel itself supports riscv64 as a host/target platform) | N/A to Pixie's own use | N/A | Pixie pins Bazel 7.7.1; Bazel's own riscv64 support is not the blocker - Pixie's *use* of Bazel (its cc_toolchains/sysroots) defines only x86_64/aarch64 targets, per [`toolchains.bzl`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/toolchains.bzl) |
| eBPF | runtime-dependency, critical | Kernel-side: Yes (Linux BPF has had an RV64 JIT for years) | Data not available: Pixie's own Stirling eBPF collector has no riscv64 build to test against the kernel feature | N/A | Upstream kernel eBPF/RV64 JIT existing does not help until Pixie's own `task_struct_resolver.cc` and ELF/BPF-loading code gain a riscv64 branch (Section 4) |
| Linux kernel | runtime-dependency, critical | Yes (riscv64 is a first-class upstream Linux port) | Yes (upstream kernel CI covers riscv64 broadly) | Yes (distros ship riscv64 kernels) | Not a blocker in itself; Pixie's own code, not the kernel, is the gap |
| Kubernetes | runtime-dependency, critical | Data not available: riscv64 kubelet/K8s support exists in some distributions per general industry knowledge referenced in research, but this was not independently re-verified in this research pass | Data not available | Data not available | Grading Kubernetes' own riscv64 status is out of scope for this report; noted only as a dependency, not assessed independently here |
| esbuild | build-dependency, optional | Yes - `@esbuild/linux-riscv64` optional platform binaries (versions 0.17.19, 0.25.0) are listed in [`src/ui/yarn.lock`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/ui/yarn.lock) | Data not available | Yes (published to npm by esbuild upstream) | This is the one dependency in the table with a confirmed, published riscv64 artifact - it only bundles Pixie's UI JS assets and does not affect the core Stirling/Carnot riscv64 blocker |
| LLVM/Clang 15 | JIT/codegen backend for BCC/bpftrace; also Pixie's own vendored prebuilt clang toolchain (x86_64/aarch64 only) | Data not available (connection failure blocked project-graph verification) | Data not available | Data not available | RISC-V is an actively developed first-class upstream LLVM target, but Pixie does not consume distro LLVM - it downloads its own prebuilt clang 15 tarball, and no riscv64 build of that tarball exists in pixie-io/dev-artifacts |
| libbpf | Core eBPF program loading/linking, used throughout Stirling | Data not available | Data not available | Data not available | No open riscv64 issues found in libbpf/libbpf - low riscv-specific engagement, but no known blockers either |
| BCC | eBPF tracing toolkit (pixie-io fork of iovisor/bcc) providing BPF compile/attach infra | Data not available | Data not available | Data not available | [iovisor/bcc #5492](https://github.com/iovisor/bcc/issues/5492) (open): "USDT Probe Test Failures on RISCV Architecture." Several older riscv issues closed (#4628, #4110, #4081) - functional but less CI-covered than x86_64/arm64 |
| bpftrace | Higher-level eBPF DSL/runtime (pixie-io fork) used by Pixie's dynamic tracing | Data not available | Data not available | Data not available | No riscv64-specific open issues found; absence of issues likely reflects low riscv64 usage/testing rather than confirmed support |
| BoringSSL | TLS/crypto for gRPC control-plane and data-plane connections | Data not available | Data not available | Data not available | Google's mirror has no public issue tracker; upstream BoringSSL has merged riscv64 assembly/codegen support but Google discourages third-party packaging |
| gRPC | RPC framework for Vizier<->Cloud and internal control plane | Data not available | Data not available | Data not available | [grpc/grpc #37791](https://github.com/grpc/grpc/issues/37791) (closed, "SIGILL on riscv64"), [#35839](https://github.com/grpc/grpc/issues/35839) (closed, `__atomic_compare_exchange_1` undefined symbol - classic riscv64 libatomic linking issue), [#41591](https://github.com/grpc/grpc/issues/41591) (closed, riscv64 wheel request) - all resolved, suggesting riscv64 works but needed explicit fixes |
| gperftools / tcmalloc | Process-wide memory allocator | Data not available | Data not available | Data not available | [gperftools/gperftools #1359](https://github.com/gperftools/gperftools/issues/1359) (closed): riscv64 stack-unwinding was broken and had to be added; now fixed upstream |
| Abseil | Pervasive C++ base library (containers, strings, sync), used codebase-wide | Data not available | Data not available | Data not available | [abseil/abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) (open, 2024: "Can't link using riscv64 toolchain"); [#1561](https://github.com/abseil/abseil-cpp/issues/1561) (closed: Protobuf riscv build fails due to Abseil); [#1684](https://github.com/abseil/abseil-cpp/issues/1684) (closed: NegativeNaN test fails on riscv64). Mixed - working with known rough edges, including one currently-open linking bug |
| oneTBB | Threading/parallelism primitive, used transitively (incl. by TensorFlow) | Data not available | Data not available | Data not available | [uxlfoundation/oneTBB #1051](https://github.com/uxlfoundation/oneTBB/issues/1051) (closed): "Support RISC-V" - support added and tracking issue closed |
| simdutf | SIMD-accelerated UTF validation/transcoding | Data not available | Data not available | Data not available | Active RVV work: #362 "icelake like backend for RVV" (closed/implemented), #793 "fast find character for RISC-V" (closed), #843 "base64 with lines for RISC-V" (closed) - maintained RVV SIMD backend, fixed when broken |
| Apache Arrow | Columnar in-memory format used by Carnot (Pixie's query engine); pixie-io fork | Data not available | Data not available | Data not available | [apache/arrow #50862](https://github.com/apache/arrow/issues/50862) (closed, Aug 2026: Gandiva runtime failure on riscv64); [#49555](https://github.com/apache/arrow/issues/49555) (open: riscv64 Python wheel builds not yet in the release pipeline); core C++ build issue (#32706) closed/fixed historically |
| TensorFlow | ML inference used in Carnot's ML functions (`src/carnot/exec/ml`) | Data not available | Data not available | Data not available | [tensorflow/tensorflow #102159](https://github.com/tensorflow/tensorflow/issues/102159) (open, 2025: "Can't compile tensorflow 2.19.1 on riscv"), [#100940](https://github.com/tensorflow/tensorflow/issues/100940) (open, 2025: "Compile Tensorflow on riscv64 platform") - the weakest dependency found, unresolved as of the most recent issues |
| libarchive | Archive/compression handling | Data not available | Data not available | Data not available | Only 3 issues total, none riscv-specific - no evidence of problems, but minimal riscv-specific testing signal either |
| RE2 | Regex engine used pervasively in Carnot/query parsing | Data not available | Data not available | Data not available | Zero riscv-related issues found - no evidence of problems |
| cpuinfo | Runtime CPU feature detection for SIMD dispatch (direct dependency and via TensorFlow) | Data not available | Data not available | Data not available | [pytorch/cpuinfo #124](https://github.com/pytorch/cpuinfo/issues/124) (open since 2022): "Add: RISC-V support" - riscv64 is not yet supported by cpuinfo upstream at all, a real and currently-open gap |
| xxHash | Fast non-cryptographic hashing | Data not available | Data not available | Data not available | Only an open feature request ([#1018](https://github.com/Cyan4973/xxHash/issues/1018)) for RISC-V-specific inline-asm optimization - implies xxHash already works portably on riscv64, just without hand-tuned assembly |

**Note on `project-graph` verification:** every column marked "Data not available" above reflects a persistent `project-graph` MCP server connection failure (`CONNECTION_CLOSED`) encountered repeatedly across this research, not a confirmed absence of riscv64 build/test/release status for that dependency. This should be retried once the server is reachable.

**Headline finding independent of any single dependency:** Pixie's own Bazel toolchain defines sysroots only for `aarch64` and `x86_64` (Section 5). Pixie cannot be built for riscv64 at all regardless of individual dependency status - this is a prerequisite blocker above the dependency chain, not merely one item within it.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist in pixie-io/pixie, because no riscv64 code path exists to contain one. Confirmed by GitHub issue search (`riscv`/`riscv64`/`RISC-V` scoped to `pixie-io/pixie`: 0 genuine results across every query run; the only semantic-search hits were false positives on unrelated ARM issues [#147](https://github.com/pixie-io/pixie/issues/147) and [#248](https://github.com/pixie-io/pixie/issues/248)).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | N/A | N/A | No riscv64 issue has ever been filed against pixie-io/pixie |

For contrast, correctness bugs affecting a *future* riscv64 port exist at the dependency level and are highlighted separately: [abseil/abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) (open riscv64 linking failure), [tensorflow/tensorflow #102159](https://github.com/tensorflow/tensorflow/issues/102159) and [#100940](https://github.com/tensorflow/tensorflow/issues/100940) (open riscv64 compile failures), and [pytorch/cpuinfo #124](https://github.com/pytorch/cpuinfo/issues/124) (riscv64 support entirely unimplemented upstream). None of these are Pixie bugs; they are pre-existing blockers Pixie would inherit the moment a port was attempted.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist. RISC-V has never been discussed in any Pixie issue, PR, commit, or governance document found in this research. There is no recorded maintainer sentiment, positive or negative.

**Technical blockers:**
1. No riscv64 Bazel toolchain/sysroot (Section 5) - a prerequisite before anything else can be attempted.
2. No riscv64 branch in `arch.h` or any of the five downstream architecture-dispatch sites in Stirling (Section 4).
3. Open, unresolved riscv64 compile failures in TensorFlow ([#102159](https://github.com/tensorflow/tensorflow/issues/102159), [#100940](https://github.com/tensorflow/tensorflow/issues/100940), both open as of 2025), which feeds Carnot's ML functions.
4. cpuinfo, used for SIMD dispatch, has no riscv64 support upstream at all ([pytorch/cpuinfo #124](https://github.com/pytorch/cpuinfo/issues/124), open since 2022).
5. An open Abseil riscv64 linking bug ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) in a pervasively-used base library.

**Organizational blockers:**
- Pixie is not a RISE Project member or workstream (RISE membership is company-based - 8 Premier and 12 General members, none of which is Pixie or its sponsoring organizations in a project capacity); no RISE blog post, RFP, or funded work references Pixie.
- The maintainer group is small (5 people, 3 from one company, Gimlet Labs) and the observed new-architecture-port process is informal and demand-driven (see ARM64 precedent, Section 2) rather than roadmap-driven - a RISC-V port would need to be actively championed and resourced, not simply requested.
- CNCF Sandbox status (rather than Incubating/Graduated) implies a smaller, less formalized governance and contribution process generally.

**Acceptance probability:** Data not available in the form of a quantified estimate; qualitatively, the ARM64 precedent shows new-architecture ports do get accepted here when a maintainer sponsors the work, but only after sustained user demand (multi-year, multiple issues, reaction counts) - and zero such demand signal exists for RISC-V today.

## 13. Readiness Assessment

- **Color:** orange - from skill output. This is the base "no upstream CI" outcome under Step 1 of the color model: no riscv64 build, test, or release exists at any level, and unlike the distribution-floor scenario, no distro package exists at all to apply a floor from (the only same-named Ubuntu packages, `libpixie-java` and `pixiewps`, are unrelated projects). Because the absence of support here is thoroughly researched and confirmed - not an unknown-unknown - orange applies rather than grey.
- **Release provider:** none - no channel (GitHub Releases, PyPI, RISE wheel builder, Ubuntu, Arch RISC-V) publishes a riscv64 artifact for pixie-io/pixie.
- Pixie is not an optimization-purpose project (it is an observability platform, not a SIMD/JIT/allocator library whose value proposition is CPU-specific speed), so no Optimization level applies and Step 2 of the color model is not triggered for Pixie itself.
- **Justification:** All 26 GitHub Actions workflow files were read directly and contain zero riscv64 references; the Bazel `cc_toolchains`/`sysroots` configuration defines only x86_64 and aarch64 targets ([`toolchains.bzl`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/toolchains.bzl)); the central architecture-dispatch header `arch.h` defines only `X86_64`/`AARCH64` macros ([`arch.h`](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/common/base/arch.h)); and no riscv64 release artifact exists on GitHub Releases, PyPI, the RISE wheel builder, Ubuntu 26.04, or Arch Linux RISC-V (Section 8).
- **Pending work that could change the grade:** none identified. There are no open PRs, no open issues, and no RISE involvement of any kind touching Pixie or RISC-V. Any change in grade would require a new port effort to be initiated from scratch, starting with the toolchain prerequisite in Section 5.

## 14. Investment Analysis

RISE has not funded, touched, or otherwise engaged with Pixie in any capacity (Section 12) - there is no prior work to net out of the estimates below; all of the following is unstarted.

### 14.1 Functional Enablement

Establishing a minimally working riscv64 build requires, in order: (1) adding a riscv64 Bazel cc_toolchain/sysroot alongside the existing x86_64/aarch64 ones; (2) adding a `RISCV64` macro to `arch.h` and wiring riscv64 branches into `task_struct_resolver.cc`, `elf_reader.cc`'s `Arch` enum, `linux_headers.cc`, and `go_trace_common.h`; (3) resolving the upstream TensorFlow riscv64 compile failures ([#102159](https://github.com/tensorflow/tensorflow/issues/102159), [#100940](https://github.com/tensorflow/tensorflow/issues/100940)) or gating Carnot's ML functions out of an initial riscv64 build; (4) resolving or working around cpuinfo's total absence of riscv64 support ([#124](https://github.com/pytorch/cpuinfo/issues/124)); (5) validating the eBPF/Stirling stack (libbpf, BCC, bpftrace) against a real riscv64 kernel, given BCC's open USDT probe test failure ([iovisor/bcc #5492](https://github.com/iovisor/bcc/issues/5492)).

### 14.2 Performance Optimization

Not applicable at this stage - there is no functioning riscv64 build to optimize. Once functional enablement lands, SIMD-dependent paths reached via cpuinfo/TensorFlow/Abseil would need dedicated riscv64 (RVV) attention, but this is downstream of Section 14.1.

### 14.3 CI/CD Infrastructure

A riscv64 job would need to be added to `build_and_test.yaml` (or a parallel workflow), including a riscv64-capable runner (RISE runners are a plausible source, given RISE hosts CI runner infrastructure for other CNCF projects per its own materials - though Pixie has never used them) and a test-execution step, not just a build-only step, to reach yellow/blue rather than remaining build-only.

### 14.4 Ecosystem Enablement

Not applicable - Pixie has no significant dependent package ecosystem requiring separate riscv64 enablement (Section 10 omitted per report scope rules).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 Bazel toolchain/sysroot | 2-4 | Build/infra engineer | Critical |
| Functional | Add `RISCV64` macro + wire into `task_struct_resolver.cc`, `elf_reader.cc`, `linux_headers.cc`, `go_trace_common.h` | 4-8 | Stirling/eBPF engineer | Critical |
| Functional | Resolve/track TensorFlow riscv64 compile failures upstream, or gate Carnot ML functions on riscv64 | 2-6 (excludes upstream TensorFlow fix time, which is outside Pixie's control) | Carnot/ML engineer | High |
| Functional | Resolve/track cpuinfo riscv64 support upstream, or provide a fallback dispatch path | 1-3 (excludes upstream cpuinfo fix time) | Build/infra engineer | High |
| Functional | Validate/fix BCC USDT probe support on riscv64 (tracks upstream [iovisor/bcc #5492](https://github.com/iovisor/bcc/issues/5492)) | 2-4 | eBPF engineer | Medium |
| CI/CD | Add riscv64 build+test job to `build_and_test.yaml`, secure a riscv64 runner (RISE or self-hosted) | 2-4 | CI/infra engineer | High |
| Distribution | Add riscv64 to container image buildx targets and release pipeline once functional build exists | 1-2 | Release engineer | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [pixie-io/pixie repository](https://github.com/pixie-io/pixie)
- [Pixie homepage (px.dev)](https://px.dev/)
- [pixie-io/pixie releases](https://github.com/pixie-io/pixie/releases)
- [README.md (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/README.md)
- [GOVERNANCE.md (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/GOVERNANCE.md)
- [MAINTAINERS (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/MAINTAINERS)
- [DEVELOPMENT.md (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/DEVELOPMENT.md)
- [src/common/base/arch.h (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/common/base/arch.h)
- [bazel/cc_toolchains/toolchains.bzl (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/cc_toolchains/toolchains.bzl)
- [bazel/external/rules_docker_arch.patch (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/bazel/external/rules_docker_arch.patch)
- [src/ui/yarn.lock (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/ui/yarn.lock)
- [src/experimental/multi_arch/README.md (commit 830ff2a)](https://github.com/pixie-io/pixie/blob/830ff2ad3d5b6d4ff5a975ac5b21d43d42ce4bef/src/experimental/multi_arch/README.md)
- [pixie-io/pixie issue #147 "Support ARM CPUs"](https://github.com/pixie-io/pixie/issues/147)
- [pixie-io/pixie issue #248 "cli arm64 support"](https://github.com/pixie-io/pixie/issues/248)
- [docs.px.dev installing-pixie requirements](https://docs.px.dev/installing-pixie/requirements/)
- [PyPI pixie package JSON](https://pypi.org/pypi/pixie/json)
- [PyPI pixie simple index](https://pypi.org/simple/pixie/)
- [RISE GitLab PyPI wheel index for pixie](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/pixie/)
- [Ubuntu 26.04 package search: Pixie](https://packages.ubuntu.com/search?keywords=Pixie&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search: pixie](https://archriscv.felixc.at/?q=pixie)
- [iovisor/bcc issue #5492](https://github.com/iovisor/bcc/issues/5492)
- [grpc/grpc issue #37791](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc issue #35839](https://github.com/grpc/grpc/issues/35839)
- [grpc/grpc issue #41591](https://github.com/grpc/grpc/issues/41591)
- [gperftools/gperftools issue #1359](https://github.com/gperftools/gperftools/issues/1359)
- [abseil/abseil-cpp issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp issue #1561](https://github.com/abseil/abseil-cpp/issues/1561)
- [abseil/abseil-cpp issue #1684](https://github.com/abseil/abseil-cpp/issues/1684)
- [uxlfoundation/oneTBB issue #1051](https://github.com/uxlfoundation/oneTBB/issues/1051)
- [simdutf/simdutf issue #362](https://github.com/simdutf/simdutf/issues/362)
- [simdutf/simdutf issue #793](https://github.com/simdutf/simdutf/issues/793)
- [simdutf/simdutf issue #843](https://github.com/simdutf/simdutf/issues/843)
- [apache/arrow issue #50862](https://github.com/apache/arrow/issues/50862)
- [apache/arrow issue #49555](https://github.com/apache/arrow/issues/49555)
- [tensorflow/tensorflow issue #102159](https://github.com/tensorflow/tensorflow/issues/102159)
- [tensorflow/tensorflow issue #100940](https://github.com/tensorflow/tensorflow/issues/100940)
- [pytorch/cpuinfo issue #124](https://github.com/pytorch/cpuinfo/issues/124)
- [Cyan4973/xxHash issue #1018](https://github.com/Cyan4973/xxHash/issues/1018)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE blog: RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [FOSDEM 2026: eBPF Observability on RISC](https://fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/)
- [The New Stack: Is eBPF ready for ARM64 and RISC-V?](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/)
