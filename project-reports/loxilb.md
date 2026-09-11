---
title: LoxiLB
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="loxilb" %}

# LoxiLB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for LoxiLB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LoxiLB ([loxilb-io/loxilb](https://github.com/loxilb-io/loxilb), homepage [loxilb.io](https://www.loxilb.io/)) is a Go-based control-plane load balancer / service proxy paired with an eBPF/XDP C data plane (`loxilb-ebpf`, a git submodule tracking `libbpf/libbpf`). It is a CNCF **Sandbox** project, accepted 2024-08-30, listed under the "Service Proxy" category on [cncf.io/sandbox-projects](https://www.cncf.io/sandbox-projects/). License is Apache-2.0.

Governance (`GOVERNANCE.md`) is a single-tier "Maintainer Council" operating by lazy consensus; new maintainers are nominated and approved by simple majority vote of existing maintainers, removed by 2/3 vote. There is no multi-tier reviewer/approver structure and no CODEOWNERS file.

Despite the CNCF Sandbox label, governance is effectively single-vendor. All four listed maintainers in `MAINTAINERS.md` (Trekkie, SeokHwan Kong, Baekgyun Jung, Inho Gog) work for **Netlox**, and `git shortlog -sne` across the full 3,767-commit history shows the top ~15 committers by volume are all `@netlox.io` identities (825, 355, 308, 297, 279, 258, 191, 177, 148, 138, 138, 131, 98, 91, 65 commits respectively). The only non-Netlox contributor of note is Cybwan (`baili@flomesh.io`, Flomesh Technology, 25 commits) who is not a listed maintainer.

`GOVERNANCE.md` states "Community over Product or Company" as a value and cautions against contributors "pretending [pushing] features... for their sole benefit without contributing to the effort" - i.e. a new architecture port is expected to arrive as a contributed PR under the standard review process, not as a demand. There is no written policy on new-architecture ports, positive or negative, in `CONTRIBUTING.md` or `GOVERNANCE.md`.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No riscv64 port has ever been started | Full-history search, see below |

No commit has ever added a riscv64-related file: `git log --all --diff-filter=A --name-only \| grep -i riscv` returns zero results. `git log --all -i --grep="riscv"` across the full 3,767-commit history returns zero results. GitHub code, issue, PR, and commit search (`repo:loxilb-io/loxilb`) for `riscv`, `riscv64`, and `risc-v` each return zero results across all three search types, confirmed independently via the GitHub MCP (`search_pull_requests`, `search_commits`).

There is no upstreaming timeline to report because no riscv64 work - proposed or merged - exists. There are no contributors, RISE-affiliated or otherwise, associated with a riscv64 port. The project is not fully upstream on riscv64; it simply has no riscv64 code at all (Section 4).

## 3. Upstream Support Tier

LoxiLB has no formal, written architecture-tier policy document (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` do not exist in the repository). Architecture support is defined entirely by what `.github/workflows/docker-multiarch.yml` builds and by what `.github/workflows/package.yaml` releases.

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | yes ([docker-multiarch.yml](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/docker-multiarch.yml), `ubuntu-latest`) | yes ([docker-multiarch.yml](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/docker-multiarch.yml), `ubuntu-24.04-arm`) | no |
| CI test execution | yes (`build-check-amd64`) | yes (`build-check-arm64`) | no |
| Release-blocking | push to `main` (path-filtered) | push to `main` (path-filtered) | N/A |
| Container image published | yes (multi-arch manifest) | yes (multi-arch manifest) | no |
| .deb / .qcow2 release asset | yes (`package.yaml`, hardcoded `amd64` arg) | no (not built by `package.yaml`) | no |

Only two architectures are handled anywhere in the build/CI/release system: amd64 and arm64. riscv64 does not have build-only, test-only, or release-only status - it has no status at all in any workflow, Dockerfile, or Makefile. This places LoxiLB in the "no upstream CI" row of the color model's Step 1 table.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct source inspection of the local clone (`loxilb-io/loxilb`, commit `23a429b4698528aae9393dd57ba0f3928cca35e7`, plus the `loxilb-ebpf` submodule at commit `89ddc6a`) found **no architecture-specific implementation of any kind for any architecture**, not just riscv64:

- No `#ifdef __riscv`, `__aarch64__`, or `__x86_64__` guards anywhere in `.go` or `.c` source (GitHub code search for all three: 0 hits; repo-wide `grep -rl` across main repo and submodule: 0 matches).
- No arch-named source files (`find -iname "*x86*" -o -iname "*amd64*" -o -iname "*arm64*" -o -iname "*riscv*"`: 0 results in either repo).
- No assembly files (`extension:s` search: 0 results) and no SIMD intrinsics (`SIMD` search: 1 irrelevant hit, an unrelated AWS IMDS client function name).
- The only "architecture" logic anywhere is a generic eBPF CO-RE (Compile Once - Run Everywhere) macro in `loxilb-ebpf/common/common.mk` that maps `uname -m` to `x86` or `arm64` for selecting the `PT_REGS`/syscall-register layout used by kprobes - standard libbpf/BCC boilerplate, not a hand-written per-architecture implementation. It handles exactly two cases; riscv64 would fall through unhandled, literally passing `-D__TARGET_ARCH_riscv64`, which does not match libbpf's own arch-macro naming convention and has never been exercised.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-specific `#ifdef`/source files | none found | none found | none found |
| eBPF CO-RE arch macro (`common.mk`) | `x86` (handled) | `arm64` (handled) | unhandled fallthrough |
| SIMD / hand-tuned hot paths | none found | none found | none found |
| Dedicated CI build job | yes | yes | none |

There is no JIT, no crypto assembly, no GC-barrier or SIMD code in LoxiLB's own source - the project's architecture "support" for amd64/arm64 is purely a build-and-packaging distinction (cross-compiling the same portable Go + generic-C/eBPF source), not divergent per-architecture algorithmic code. This project is not optimization-purpose (Section 13); it is a functional networking tool whose value does not depend on architecture-specific hot-path code, so the Step 2 optimization-coverage modifier does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

LoxiLB is **not a CMake project**. It is a Go project (`main.go`, `go.mod`, requiring Go 1.25.0 per `go.mod`; the Dockerfile pins **Go 1.24.0**) with a `Makefile` driving `go build`, plus the `loxilb-ebpf` submodule (C/eBPF data plane) built via its own plain `Makefile` invoking `clang`/`gcc`. No `CMakeLists.txt` exists anywhere in either repository.

Toolchain versions pinned in the [Dockerfile](https://github.com/loxilb-io/loxilb/blob/main/Dockerfile):
- Go 1.24.0
- clang-14 / llvm
- OpenSSL 3.4.1 (built from source with `enable-ktls`)
- bpftool v7.2.0 (built from source)
- gobgp v3.29.0 (downloaded as a prebuilt binary tarball)

Architecture detection in both `Dockerfile` and `Makefile` is: `arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/)`, branching only on `arm64` vs. the implicit else (x86/amd64) case - e.g. installing `gcc-arm-linux-gnueabihf` for arm64, `gcc-multilib` otherwise; downloading Go via `go1.24.0.linux-${arch}.tar.gz` and gobgp via `gobgp_3.29.0_linux_${arch}.tar.gz`. On riscv64, `arch` would resolve to the literal string `riscv64`, which matches neither branch: the script would fall into the x86/amd64 else-branch and then fail, because no `go1.24.0.linux-riscv64.tar.gz`-equivalent substitution exists for that fallthrough path, and `gobgp` does not publish a riscv64 release asset for v3.29.0 (confirmed via GitHub search `repo:osrg/gobgp riscv64`: 0 issues/PRs, and no riscv64 asset found in its releases).

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in the repository. The docs site ([docs.loxilb.io/main/run/](https://docs.loxilb.io/)) references only Go 1.22+ with `go1.22.0.linux-amd64.tar.gz` / `go1.22.0.linux-arm64.tar.gz`, `clang`/`llvm`, `gcc-multilib`, `build-essential`/`bison`/`flex`, and OpenSSL 3 built from source - no architecture beyond amd64/arm64 is documented, and there is no QEMU-for-build or cross-compilation section for any architecture.

The `loxilb-ebpf/Makefile` submodule build (the actual eBPF data-plane compilation) is a simple recursive `make -C kernel*` with no `ARCH`/`uname -m` gating at all - it is architecture-generic in the sense that it does not explicitly block riscv64, but this also means it has never been exercised or validated on riscv64.

**No known build failure reports exist for riscv64** because no one has attempted the build and filed a result - this is an untested, not a confirmed-broken, state (see Section 12 on red vs. orange distinction).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native binary build | yes | yes | untested / would require build-system changes |
| Container image | yes | yes | none |
| .deb package | yes | no | none |
| .qcow2 VM image | yes | no | none |
| CI test execution | yes | yes | none |
| BGP integration (gobgp) | yes (prebuilt binary) | yes (prebuilt binary) | no prebuilt binary; would require building gobgp from source |
| eBPF/XDP data plane functionality | yes | yes | unknown - never built or tested |

Because no riscv64 build has ever been produced, there is no basis to assess functional parity, correctness, or performance delta against amd64/arm64 for LoxiLB itself. Data not available: riscv64-specific functional gaps, since the software has never run on the architecture. No NaN/floating-point semantics issues were found or reported for LoxiLB on any architecture (it is a networking control/data-plane tool, not a numerics library).

The one documented non-x86/arm64 architecture experience on record is **not RISC-V**: [issue #972](https://github.com/loxilb-io/loxilb/issues/972) documents a kernel lockup on **LoongArch64** (BPFire OS), traced to LoxiLB requiring libbpf >=1.2.3 while depending on 0.8.1, closed March 2025. This is the closest analog to a "new architecture" bug report and illustrates the kind of libbpf-version-sensitivity risk a riscv64 port could plausibly hit, but it is not evidence about riscv64 itself.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Direct inspection of all 81 files in `.github/workflows/` (commit `23a429b4698528aae9393dd57ba0f3928cca35e7`) confirms zero riscv64 references of any kind - no runner label, no matrix entry, no QEMU platform string, no trigger condition. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repository root.

```
$ grep -rniE "riscv" .github/workflows/
(no output, exit code 1)
$ grep -rniE "riscv" . 2>/dev/null | grep -v '^\./\.git/'
(no output, exit code 1)
```

Key workflows read in full:
- [`docker-multiarch.yml`](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/docker-multiarch.yml): four jobs - `build-check-amd64` (`ubuntu-latest`), `build-check-arm64` (`ubuntu-24.04-arm`), `build-amd64` (`platforms: linux/amd64`), `build-arm64` (`platforms: linux/arm64`), plus `merge-manifest`. Triggers: `push` to `main` (path-filtered) and `workflow_dispatch`. No third architecture.
- [`build-check.yml`](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/build-check.yml): single `build` job, `ubuntu-latest`, builds an x86 Docker image only. Triggers: `pull_request` to `main`, `workflow_dispatch`.
- [`package.yaml`](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/package.yaml): builds `.deb`/`.qcow2` artifacts, `runs-on: ubuntu-22.04`, invokes `build-release-qcow2.sh "$release_tag" "$deb_pkg" build-tools/pkg amd64` with `amd64` hardcoded as the final argument. Triggers: nightly `schedule` (`0 22 * * *`) and `workflow_dispatch`. It uses `qemu-utils qemu-system-x86 cloud-image-utils libguestfs-tools` to boot a qcow2 **x86** VM for sanity testing - this is QEMU for testing an amd64 VM image, not for riscv64 cross-compilation or emulation.

None of the remaining 78 workflow files (sanity/k3s/k8s/scale/perf/liveness/tcp/udp/sctp/ipsec test suites, all on `ubuntu-latest`/`ubuntu-22.04`/`ubuntu-24.04`/`rh9` runners) reference riscv64 in any form.

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| RISE runner usage | no | no | no |
| Native/QEMU hardware | GitHub-hosted (native) | GitHub-hosted (native, `ubuntu-24.04-arm`) | N/A |

No RISE RISC-V CI runners (per RISE's [March 2026 announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) are referenced anywhere in LoxiLB's workflow set - confirmed by the same full-file grep above.

## 8. Distribution and Release Status

**No riscv64 binary or package exists for LoxiLB through any channel checked:**

- **GitHub Releases** (`loxilb-io/loxilb`): checked tags v0.9.8.8, v0.9.8.7, v0.9.8.6, and `vlatest` via [github.com/loxilb-io/loxilb/releases](https://github.com/loxilb-io/loxilb/releases). All published assets are amd64-only: `loxilb-v0.9.8.8-ubuntu-22.04-amd64.qcow2` (+ `.sha256`), `loxilb_0.9.8.8-amd64.deb`, plus source zip/tar.gz. No arm64 binary asset exists either (arm64 support is container-image-only, via `docker-multiarch.yml`). No riscv64 asset on any checked tag.
- **PyPI**: [pypi.org/pypi/loxilb/json](https://pypi.org/pypi/loxilb/json) returns HTTP 404 - **no "loxilb" package exists on PyPI at all** (expected; LoxiLB is a Go/C project, not distributed as a Python package).
- **RISE wheel builder**: [gitlab.com/.../packages/pypi/simple/loxilb/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/loxilb/) redirects to the PyPI 404 above - no wheel exists (not applicable, since there is no upstream Python package to wheel).
- **Ubuntu 26.04 "resolute"**: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=loxilb&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - **no `loxilb`, `python3-loxilb`, or `libloxilb` package exists for any architecture**, riscv64 included.
- **Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): check was inconclusive (the site's search is JS-driven and did not resolve via automated fetch); no positive evidence of a package found, but this channel was not conclusively queried. [NEEDS VERIFICATION]
- **Ubuntu 26.04 riscv64 via project-graph DB**: unverified - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) on repeated attempts across this research session. This is a tooling failure, not a confirmed negative, and should be retried when the server is reachable.

Because there is no upstream CI and no distribution ships even an unmodified-source riscv64 build, the color model's distribution floor (Step 1) does not apply here - there is no distro package to floor from in the first place, not even for amd64 outside the project's own releases.

**What a user must do to get a working riscv64 binary today:** there is none available anywhere. A user would need to build from source, and per Section 5, the build system's own architecture-detection logic would misroute riscv64 into the amd64 branch and fail at the Go/gobgp download step - the project would need build-system changes before a manual riscv64 build could even be attempted.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go | build-dependency, critical - compiler/runtime for the entire control plane | yes, upstream ships `linux-riscv64` tarballs since Go 1.21 | riscv64 is a secondary (non-release-blocking) port; CI runs on fragile community-donated hardware | yes, official upstream binaries (e.g. `go1.26.4.linux-riscv64.tar.gz`) | Open bugs: runtime memory-corruption/inlining miscompile (#78161, help-wanted), FIPS140+PIE broken on riscv64 (#74683), ~20-40% perf gap vs arm64 (#77541). None known to block a plain `CGO_ENABLED=0` build. See project-reports/go.md |
| LLVM | build-dependency, critical - compiles eBPF C programs to BPF bytecode | yes, full riscv64 codegen backend, built by default | no required pre-merge riscv64 CI gate | no upstream binaries; Ubuntu 26.04 ships from source | Several open correctness bugs (#200030, #171978, #138130); none known to affect BPF codegen specifically. See project-reports/llvm.md |
| libbpf | runtime-dependency, critical - loads/verifies/attaches compiled BPF programs, BTF/CO-RE, map creation | yes, Ubuntu 26.04 riscv64 packages exist (`libbpf1`, `libbpf-dev`) | no upstream CI on riscv64 (build matrix and vmtest both exclude it) | source-only; no upstream binary releases | Gaps are in the kernel BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`), not libbpf itself: unsupported sub-word atomics, unsupported BPF exceptions, bpf2bpf+tailcall mixing on kernel DENYLIST.riscv64, missing `fence.i` barrier (patch pending). See project-reports/libbpf.md |
| OpenSSL | runtime-dependency, critical - `-lssl -lcrypto` linked into the userspace TLS/HTTP helper | yes, unconditional QEMU cross-compile CI on every PR/push | no FIPS testing on riscv64 in any config; no native riscv64 hardware runners | Ubuntu 26.04 ships current version | Critical open gap: AES T-table fallback (used on hardware lacking Zkn/Zvkned, i.e. most deployed riscv64 silicon) is not constant-time, a cache-timing key-leak risk (fix PRs #31080/#31082 open, unmerged). Relevant since LoxiLB may terminate/inspect TLS. See project-reports/openssl.md |
| elfutils | build-dependency, critical - ELF parsing of compiled BPF object files via libbpf | yes, Ubuntu 26.04 riscv64 package (0.194-4) | active upstream Buildbot CI on real StarFive riscv64 hardware, passing | Debian sid current; Ubuntu LTS ships an older 0.190 | Gaps are in debugger-adjacent features (eu-stacktrace, FPU live-register read), none affect libelf's use by libbpf. See project-reports/elfutils.md |
| zlib | runtime-dependency, optional - `-lz`, compressed-BTF handling | yes, Ubuntu 26.04 riscv64 packages | no riscv64 in Linux cross-compile CI matrix | distro packages current (Debian/Ubuntu/Arch RISC-V/Alpine) | Functionally complete, performance-only gap: no CRC-32/Adler-32 RVV acceleration merged (PR #1099 open 8+ months, unaddressed). Not a correctness blocker. See project-reports/zlib.md |
| libpcap | runtime-dependency, optional - packet-capture tooling/debug utilities | yes, Ubuntu 26.04 riscv64 packages (`libpcap-dev`, v1.10.6-1ubuntu1) | not independently verified in this research | Ubuntu riscv64 package current | Zero riscv64-related issues/PRs found upstream; no known blockers, no dedicated riscv64 work found either. |
| dwarves | build-dependency, optional - BTF generation from DWARF (CO-RE toolchain, `pahole`) | yes, Ubuntu 26.04 riscv64 packages | not independently verified in this research | Debian sid riscv64 current (1.31-2) | Zero riscv64-related issues/PRs found upstream. |
| bpftool (indirect) | build/runtime-dependency - BPF introspection/loading, built from source v7.2.0 in the Dockerfile | yes, Ubuntu 26.04 riscv64 package (7.7.0+7.0.0-14.14, ports) | not independently verified | Ubuntu ports current | Zero riscv64-related issues/PRs found upstream. |
| golang.org/x/crypto (indirect) | direct go.mod dependency - TLS/crypto primitives for the Go control plane | yes, builds via pure-Go fallback | no riscv64 assembly paths | ships with Go modules (source) | Performance-only gap: ChaCha20/Poly1305/Curve25519 lack SIMD paths present on arm64/ppc64x/s390x. Not a correctness issue. |
| gobgp (indirect) | functional dependency - BGP daemon, downloaded as prebuilt binary in LoxiLB's own Dockerfile | pure Go project; `go build` should work given Go's own riscv64 support | not independently verified | **no riscv64 release asset published by `osrg/gobgp` for v3.29.0** | This is a LoxiLB-specific packaging gap (Dockerfile hardcodes amd64/arm64 download URLs), not an upstream gobgp defect. Building from source is the workaround. |

The two dependencies most load-bearing for LoxiLB's core function - **libbpf** and the **LLVM/Clang BPF codegen backend** - are both fully present and functionally solid on riscv64 at the library/compiler level. Residual technical risk sits one layer down, in the **Linux kernel's riscv64 BPF JIT**, not in libbpf itself. All C/system dependencies checked are available in Ubuntu 26.04 riscv64. None of this changes LoxiLB's own color grade, however: the project's own build, CI, and release pipeline has zero riscv64 support regardless of dependency availability.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issues exist | N/A | N/A | GitHub issue search (`repo:loxilb-io/loxilb`) for "riscv", "riscv64", "risc-v" returns zero results; semantic search for "riscv64 performance"/"riscv64 bug" surfaced only an unrelated closed issue ([#661](https://github.com/loxilb-io/loxilb/issues/661), BPFireOS cpumap error, no riscv mention) |
| [#972](https://github.com/loxilb-io/loxilb/issues/972) | LoongArch64 kernel lockup (libbpf version mismatch) | closed (March 2025) | related-architecture, not riscv64 | Closest analog to a "new architecture" bug: LoxiLB required libbpf >=1.2.3 while depending on 0.8.1, causing a kernel lockup on LoongArch64. Illustrative of a risk class (libbpf version sensitivity) a riscv64 port could also encounter, but not RISC-V evidence itself |
| [#1059](https://github.com/loxilb-io/loxilb/issues/1059) | ARM64 docker image support | closed | N/A | Resolved; ghcr.io image supports arm64 as of v0.9.5. Cited only to show the precedent process by which a new-architecture request was actually resolved for arm64 |

No correctness bugs specific to riscv64 exist because no riscv64 build has ever been produced or tested. Data not available: riscv64-specific bug reports, since none have ever been filed.

## 12. Objections and Upstream Blockers

No stated objection to a riscv64 port exists - there is no issue, PR, discussion thread, or governance document expressing opposition. Equally, there is no expressed interest: zero riscv64 issues or PRs have ever been filed (Section 2), and there is no RISE membership or funded-work relationship (Section 13 sources).

**Technical blockers**, all inferred from direct source/build inspection rather than from any stated position:
1. Build-system architecture detection (`arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/)` in `Dockerfile`/`Makefile`) has no riscv64 branch and would misroute riscv64 into the amd64 else-branch, then fail at the Go/gobgp binary-download step.
2. `gobgp` v3.29.0 (the BGP daemon LoxiLB's own Dockerfile downloads as a prebuilt binary) publishes no riscv64 release asset - this would need to be built from source instead.
3. The eBPF CO-RE arch macro in `loxilb-ebpf/common/common.mk` handles only `x86`/`arm64`; a riscv64 build would pass through an unhandled, untested `-D__TARGET_ARCH_riscv64` value.

**Organizational blockers:** governance is effectively single-vendor (Netlox, Section 1). A CNCF Sandbox project with lazy-consensus governance and no written port policy does not represent an active blocker, but the near-total concentration of commit authorship in one company means a riscv64 port depends on either that company prioritizing it or an external contributor successfully landing and maintaining a PR under the standard maintainer-approval process.

**Acceptance probability:** Data not available to estimate directly - there is no track record of the project accepting or rejecting a new-architecture PR to calibrate against, since the only new-architecture precedent (arm64, resolved via [#1059](https://github.com/loxilb-io/loxilb/issues/1059)) predates any riscv64 request and there is no comparable riscv64 request to measure the response to. The project's general "community over company" contribution culture (Section 1) and its history of accepting the arm64 port suggest a well-formed PR would likely be reviewable, but this is inference, not evidence, and is flagged as such.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI" case - see color model Step 1 table)
- **Release provider:** none
- **Optimization gap:** N/A - LoxiLB is not an optimization-purpose project. Its value proposition (L4-L7 load balancing/service proxying via eBPF/XDP) does not depend on architecture-specific hot-path code; the project runs the same generic Go and C/eBPF source on every architecture it supports, with no SIMD, hand-tuned assembly, or per-architecture algorithm variants anywhere in its own codebase (Section 4). The Step 2 optimization-coverage modifier of the color model therefore does not apply.
- **Justification:** LoxiLB has no upstream riscv64 CI (zero riscv64 references across all 81 workflow files in [`.github/workflows/`](https://github.com/loxilb-io/loxilb/tree/main/.github/workflows), confirmed by direct file inspection at commit `23a429b4698528aae9393dd57ba0f3928cca35e7`), no riscv64 release artifact (checked v0.9.8.8, v0.9.8.7, v0.9.8.6, `vlatest` on [GitHub Releases](https://github.com/loxilb-io/loxilb/releases)), and no riscv64 distribution package of any kind (Ubuntu 26.04 has no `loxilb` package for any architecture, per [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=loxilb&suite=resolute&searchon=names&section=all)). Because there is no upstream CI and no distro package to apply the distribution floor to, the project sits at the base "no upstream CI" row of the color model's Step 1 table: orange. This is not red, because there is no documented, confirmed instance of riscv64 breakage - the state is untested absence, not confirmed failure. It is not grey (unknown), because extensive positive evidence of absence was gathered (full CI file inspection, full release history, full git history, full distro checks) rather than a genuine data gap.
- **Pending work that could change the grade:** none identified. No open PR, issue, or RISE-affiliated initiative touches riscv64 for LoxiLB (Section 2; RISE member list, blog, and `riseproject-dev` org all checked with zero LoxiLB references - see Section 16). A grade change would require either a community-contributed riscv64 CI job and build-system fix landing upstream, or a distribution independently packaging LoxiLB for riscv64 from source.

## 14. Investment Analysis

RISE has done no work on LoxiLB: it is not a RISE member-associated project, no RISE blog post references it, no `riseproject-dev` GitHub org repository exists for it, and it does not appear in the RISE Python wheel builder listing (not applicable, since LoxiLB is not a Python package). All of the following work is therefore unclaimed.

### 14.1 Functional Enablement

- Add a riscv64 branch to the architecture-detection logic in `Dockerfile`/`Makefile` (currently only handles `arm64` vs. an amd64-assumed else-branch).
- Resolve the `gobgp` riscv64 binary gap: either build `gobgp` from source for riscv64 in the Dockerfile, or work with `osrg/gobgp` upstream to publish a riscv64 release asset for the pinned version (v3.29.0).
- Validate/extend the eBPF CO-RE arch macro in `loxilb-ebpf/common/common.mk` to correctly handle `riscv64` (currently falls through unhandled).
- Perform and document a first successful riscv64 build and boot/smoke test of both the control plane (Go) and data plane (eBPF/XDP), given that no such attempt has ever been recorded.

### 14.2 Performance Optimization

Not applicable to LoxiLB's own codebase - there is no architecture-specific hot-path code on any platform to optimize (Section 4). Any RISC-V performance work relevant here belongs to dependencies (e.g. OpenSSL's AES T-table constant-time gap on hardware lacking Zkn/Zvkned, Section 9), not to LoxiLB itself.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `.github/workflows/docker-multiarch.yml` mirroring the existing `build-check-arm64`/`build-arm64` pattern, contingent on a working GitHub-hosted or RISE-provided riscv64 runner.
- Extend `.github/workflows/package.yaml` to build riscv64 `.deb`/`.qcow2` release assets once a working build exists.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report criteria: LoxiLB is a standalone networking tool/system service with no dependent package ecosystem (no PyPI, npm, or Maven consumers depend on it as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix build-system arch detection (Dockerfile/Makefile) for riscv64 | 1-2 | Upstream (Netlox) or external contributor | Critical |
| Functional | Resolve gobgp riscv64 binary gap (build-from-source or upstream release) | 0.5-1 | Upstream (Netlox) or external contributor | Critical |
| Functional | Validate/fix eBPF CO-RE arch macro for riscv64 | 0.5-1 | Upstream (Netlox) or external contributor | High |
| Functional | First successful riscv64 build + smoke test (control plane + data plane) | 2-4 | Upstream (Netlox) or external contributor | Critical |
| CI/CD | Add riscv64 job to docker-multiarch.yml | 1-2 | Upstream (Netlox) | High |
| CI/CD | Extend package.yaml for riscv64 .deb/.qcow2 release assets | 1-2 | Upstream (Netlox) | Medium |
| Distribution | Engage a Linux distro (Debian/Ubuntu/Arch RISC-V) to package LoxiLB for riscv64 | 1-2 (advocacy/packaging support) | Third party / distro maintainers | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [loxilb-io/loxilb GitHub repository](https://github.com/loxilb-io/loxilb)
- [LoxiLB homepage](https://www.loxilb.io/)
- [LoxiLB documentation](https://docs.loxilb.io/)
- [docker-multiarch.yml workflow](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/docker-multiarch.yml)
- [build-check.yml workflow](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/build-check.yml)
- [package.yaml workflow](https://github.com/loxilb-io/loxilb/blob/main/.github/workflows/package.yaml)
- [LoxiLB Dockerfile](https://github.com/loxilb-io/loxilb/blob/main/Dockerfile)
- [LoxiLB GitHub Releases](https://github.com/loxilb-io/loxilb/releases)
- [LoxiLB GOVERNANCE.md](https://github.com/loxilb-io/loxilb/blob/main/GOVERNANCE.md)
- [LoxiLB MAINTAINERS.md](https://github.com/loxilb-io/loxilb/blob/main/MAINTAINERS.md)
- [CNCF Sandbox Projects list](https://www.cncf.io/sandbox-projects/)
- [Issue #972 - LoongArch64 kernel lockup](https://github.com/loxilb-io/loxilb/issues/972)
- [Issue #1059 - ARM64 docker image support](https://github.com/loxilb-io/loxilb/issues/1059)
- [Issue #661 - BPFireOS cpumap libbpf error](https://github.com/loxilb-io/loxilb/issues/661)
- [PyPI loxilb package lookup (404)](https://pypi.org/pypi/loxilb/json)
- [Ubuntu 26.04 resolute package search for loxilb](https://packages.ubuntu.com/search?keywords=loxilb&suite=resolute&searchon=names&section=all)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [osrg/gobgp GitHub repository](https://github.com/osrg/gobgp)
- Dependency status reports (workspace-local): project-reports/llvm.md, project-reports/libbpf.md, project-reports/openssl.md, project-reports/zlib.md, project-reports/elfutils.md, project-reports/go.md
- Local repository clone used for source inspection: `/home/user/loxilb-io/loxilb` (commit `23a429b4698528aae9393dd57ba0f3928cca35e7`), submodule `loxilb-ebpf` (commit `89ddc6a`)
