---
title: containerd
parent: Project Reports
color: yellow
dependencies:
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: CRIU
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/compress
    relation: runtime-dependency
    criticality: optional
  - name: containerd/cgroups
    relation: runtime-dependency
    criticality: critical
  - name: CNI plugins
    relation: runtime-dependency
    criticality: optional
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: critical
  - name: bbolt
    relation: runtime-dependency
    criticality: critical
  - name: OpenTelemetry
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: erofs/go-erofs
    relation: runtime-dependency
    criticality: optional
  - name: Kubernetes
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: opencontainers/runtime-spec
    relation: runtime-dependency
    criticality: critical
  - name: containerd/btrfs
    relation: runtime-dependency
    criticality: optional
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Buildx
    relation: build-dependency
    criticality: optional
  - name: xx
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="containerd" %}

# containerd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for containerd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is sourced from the research findings compiled for this report. Items confirmed by only one source are marked [NEEDS VERIFICATION]. Items that could not be confirmed at all are marked "Data not available."

## 1. Project Overview

containerd is an industry-standard container runtime that manages the complete container lifecycle: image pull/push, snapshotting, container execution, and CRI (Container Runtime Interface) integration with Kubernetes. It sits between higher-level orchestrators (Kubernetes, Docker) and lower-level OCI runtimes (runc, crun).

**Governance:** containerd is a Cloud Native Computing Foundation (CNCF) graduated project, accepted at incubating level in 2017-11 and graduated 2019-02-28. CNCF operates under the Linux Foundation. License: Apache 2.0 for code, CC-BY-4.0 for docs. Governance itself is documented in a separate repository, `containerd/project` (GOVERNANCE.md and MAINTAINERS; no MAINTAINERS/OWNERS/CODEOWNERS file exists in `containerd/containerd` itself). The governance model is merit-based with three tiers: reviewer, committer ("Maintainer" in CNCF terms), and security advisor. Promotion to reviewer requires approval from 1/3 of current committers; promotion to committer requires 2/3 approval, after a minimum 3-month track record. Technical disputes can be forced to a committer vote (2/3 majority). containerd is not a listed RISE Project member (confirmed by direct fetch of [riseproject.dev](https://riseproject.dev) - no project-member listing, no blog mention).

**Corporate maintainers (committers, per the `containerd/project` MAINTAINERS file, cross-checked against live GitHub profiles):**

| Handle | Name | Company (current) |
|---|---|---|
| AkihiroSuda | Akihiro Suda | NTT |
| dmcgowan | Derek McGowan | Docker |
| estesp | Phil Estes | AWS |
| mikebrow | Mike Brown | Nvidia (profile; MAINTAINERS email still `@us.ibm.com` - stale [NEEDS VERIFICATION]) |
| fuweid | Fu Wei | Microsoft |
| mxpv | Maksym Pavlenko | Netflix |
| dims | Davanum Srinivas | Microsoft |
| kzys | Kazuyoshi Kato | Baseten |
| samuelkarp | Samuel Karp | Google (previously AWS, per commit-email evidence from the 2022 merge era) |
| kiashok | Kirtana Ashok | Microsoft |

Active non-committer reviewers include cpuguy83/Brian Goff, vvoland/Pawel Gronowski (Docker), corhere/Cory Snider (Mirantis), klihub/Krisztian Litkey (Intel), jterry75/Justin Terry (Amazon), thajeztah/Sebastiaan van Stijn (Docker), and hsiangkao/Gao Xiang (kernel.org, upstream EROFS maintainer). Corporate concentration among committers: Microsoft (3), Docker (2), then NTT, AWS, Nvidia, Netflix, Baseten, and Google (1 each). Google, IBM, and Canonical are also active non-committer contributors historically, including Canonical's Lucas Kanashiro who authored an early riscv64 fix.

**Community stance on new ports:** Historically accepting once the Go toolchain and runc support an architecture. riscv64 was merged with active NTT-maintainer sponsorship (AkihiroSuda) once Go added native riscv64 PIE support (Go 1.16) and real SiFive hardware was available for testing. No rejected riscv64 PRs or stated objections were found; contributions from community authors (carlosedp, Lucas Kanashiro/Canonical, zhsj/Debian, kolyshkin) were accepted directly without gating behind feature flags.

## 2. Port History and Upstreaming Timeline

All milestones are fully upstream in [containerd/containerd](https://github.com/containerd/containerd); no out-of-tree patches are required for riscv64.

| Date | Event | Source | Author | Org |
|---|---|---|---|---|
| 2019-06-10 | First riscv64-related merge: bumped `golang.org/x/sys`, `golang.org/x/net`, `go.etcd.io/bbolt` to versions with riscv64 support | [PR #3328](https://github.com/containerd/containerd/pull/3328) | carlosedp | Community (merged by Michael Crosby, containerd founder, then Docker) |
| 2019-07-03 to 2019-08-12 | `EpollEvent` struct-padding bug on riscv64 (100% CPU on container deletion) root-caused and fixed via an `x/sys` bump | [Issue #3389](https://github.com/containerd/containerd/issues/3389), [PR #3526](https://github.com/containerd/containerd/pull/3526) | carlosedp | Community |
| 2020-05-20 | Excluded riscv64 from `-buildmode=pie` (Go's riscv64 port did not yet support PIE) | [PR #4277](https://github.com/containerd/containerd/pull/4277) | lucaskanashiro | Canonical |
| 2021-01-22 | btrfs snapshotter (cgo-dependent) automatically skipped on riscv64 rather than requiring a manual flag | [PR #4964](https://github.com/containerd/containerd/pull/4964) | zhsj | Debian |
| 2021-09-03 | Re-enabled `-buildmode=pie` for riscv64 after Go 1.16 added support | [PR #5937](https://github.com/containerd/containerd/pull/5937) | kolyshkin | Community |
| 2022-05-01/02 | Primary riscv64 enablement: seccomp support, Ubuntu 22.04 release Dockerfile, CI cross-build job; first release with riscv64 binaries (v1.6.8) | [PR #6882](https://github.com/containerd/containerd/pull/6882) | AkihiroSuda | NTT |
| 2022-08-05/06 | Release build environment kept on Ubuntu 22.04 specifically for riscv64 (which Ubuntu 18.04 cannot build) while other arches rolled back to 18.04 for a GLIBC fix | [PR #7258](https://github.com/containerd/containerd/pull/7258) / [#7260](https://github.com/containerd/containerd/pull/7260) | AkihiroSuda / samuelkarp | NTT / (then AWS) |
| 2025-05-23 | Added `riscv_flush_icache` and `riscv_hwprobe` syscalls to the default seccomp allowlist (kernel v6.12, libseccomp v2.6.0) | [PR #11839](https://github.com/containerd/containerd/pull/11839) | vvoland | Docker |
| 2026-03-12 | Tracking issue opened for riscv64 CI coverage, reopened, still open as of 2026-08-14 (8 comments) | [Issue #13020](https://github.com/containerd/containerd/issues/13020) | gounthar | Community |
| 2026-03-25 | PR opened to add `ubuntu-24.04-riscv` (RISE Project runners) to the `integration-linux` CI matrix | [PR #13124](https://github.com/containerd/containerd/pull/13124) | gounthar | Community |
| 2026-08-01 | Latest fork CI run with a local workaround applied: 1993 tests, 83 skipped, 1 failure | PR #13124 status comment | gounthar | Community |
| 2026-08-08 | PR #13124 status update: "not mergeable yet," `needs-rebase`, blocked on two issues unrelated to riscv64-specific code | PR #13124 | gounthar | Community |
| 2026-09-24 | v2.4.1 release ships `containerd-2.4.1-linux-riscv64.tar.gz` alongside amd64/arm64/ppc64le/s390x | [GitHub Releases](https://github.com/containerd/containerd/releases) | - | - |
| 2026-09-29 | Draft PR reworking the default seccomp profile (touches `riscv_hwprobe` allow-listing behavior), opened, WIP/needs-discussion | [PR #14259](https://github.com/containerd/containerd/pull/14259) | vvoland | Docker |

The port itself is complete and requires no further functional work. The only open item is CI test-gating (PR #13124), not functional enablement.

## 3. Upstream Support Tier

containerd has no dedicated, separately-maintained platform-support policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory exists anywhere in the repository - confirmed by a full-tree search over a local clone). Platform support is de facto, driven by CI-matrix membership and release-artifact inclusion. One nuance: `RELEASES.md` itself (a changelog-adjacent doc, not a dedicated policy file) contains a support-tier table that lists `linux/riscv64` as "Tier 2" (build: yes, test: yes per its own table, e2e: no), found via code search. This self-reported "test: yes" in `RELEASES.md` is contradicted by the actual CI configuration verified in Section 7 (no riscv64 job exists in `ci.yml`), so `RELEASES.md`'s tier table should be treated as aspirational/stale documentation rather than a ground-truth signal - the CI YAML, verified directly, is authoritative.

**Evidence-based tier assessment for riscv64:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Release binaries | Yes | Yes | Yes - since v1.6.8 (2022), current through v2.4.1 |
| Nightly cross-compile build | Yes | Yes | Yes (x86_64 host, `crossbuild-essential-riscv64`) |
| Integration tests in `ci.yml` (merged/gating) | Yes (ubuntu-22.04, ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No - zero riscv64 references confirmed in `ci.yml` on `main`; PR #13124 pending, unmerged |
| Seccomp profile support | Yes | Yes | Yes, including riscv64-specific syscalls |
| Static binary available | Yes | Yes | Yes |

**Assessment:** riscv64 is a release-class architecture (binaries ship on every tagged release, build-verified nightly) but not a CI-tested architecture in the merged/gating pipeline. Regressions specific to riscv64 can merge to `main` undetected because no automated test execution occurs against real or emulated riscv64 behavior in `ci.yml`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

containerd is written in Go with minimal C code (CGO is used for the btrfs/zfs snapshotter plugins and, transitively, seccomp libraries). There is no JIT, no GC-barrier assembly, and no SIMD in containerd's own core.

**containerd core - verified via repeated code search (`riscv`, `riscv64`, `__riscv`, `_riscv64.go`, `_arm64.go`, `_amd64.go`, `extension:S`, `vfloat32m1_t`, `rvv`):** no dedicated riscv64 source files exist anywhere in containerd's own tree. There are no `*_riscv64.go` files (and, notably, no `*_arm64.go` or `*_amd64.go` files either - containerd's own source carries no per-architecture Go files of that convention for any arch), no `arch/riscv/` directory, no `.S` assembly files, no `#ifdef __riscv` guards, and no ISA-extension dispatch code (RVV, Zba, Zbb, Zicsr, etc.). riscv64 support flows entirely through Go's `GOARCH=riscv64` mechanism plus vendored dependencies.

**Architecture-specific logic lives in vendored dependencies and the one seccomp file containerd owns directly:**

| Component | File | riscv64 status | Notes |
|---|---|---|---|
| Syscall assembly | `vendor/golang.org/x/sys/unix/asm_linux_riscv64.s` | Full - hand-written | ECALL-based syscall stubs using RISC-V register conventions |
| Syscall Go bindings | `vendor/golang.org/x/sys/unix/syscall_linux_riscv64.go` | Full | Complete Linux syscall set; `RISCVHWProbe` wrapper |
| Generated types/syscall numbers | `vendor/golang.org/x/sys/unix/ztypes_linux_riscv64.go`, `zsysnum_linux_riscv64.go` | Full - auto-generated | `SYS_RISCV_HWPROBE = 258`, `SYS_RISCV_FLUSH_ICACHE = 259` |
| Seccomp default profile | `contrib/seccomp/seccomp_default.go` | Full | `arches()` returns `[]specs.Arch{specs.ArchRISCV64}` (with a comment noting `ArchRISCV32` does not exist in libseccomp); a syscall-allowlist case appends `riscv_flush_icache` and `riscv_hwprobe` (kernel v6.12, libseccomp v2.6.0) |
| OCI runtime-spec seccomp constant | vendored `opencontainers/runtime-spec` `specs-go/config.go` | Full | `ArchRISCV64 = "SCMP_ARCH_RISCV64"` defined |
| Platform database | vendored `containerd/platforms` `database.go` | Full | riscv64 recognized in `isKnownArch()`; no alias normalization required |

Fetched verbatim current content of the seccomp file:
```go
case "riscv64":
    return []specs.Arch{specs.ArchRISCV64}
...
case "riscv64":
    s.Syscalls = append(s.Syscalls, specs.LinuxSyscall{
        Names: []string{
            "riscv_flush_icache",
            "riscv_hwprobe", // kernel v6.12, libseccomp v2.6.0
        },
        Action: specs.ActAllow,
        Args:   []specs.LinuxSeccompArg{},
    })
```
No TODO/FIXME/"not implemented" markers exist. riscv64's allowlist (2 syscalls) is the same size class as amd64's (2 syscalls: `arch_prctl`, `modify_ldt`); arm/arm64 carry 6. This reflects each architecture's actual kernel-specific syscall surface, not incompleteness - `riscv_hwprobe` was added in the same 2025 review cycle as other kernel/arch syscall bumps (PR #11839), indicating active maintenance.

**Indirect dependency with a real JIT/SIMD gap:** `tetratelabs/wazero`, an embedded WASM runtime pulled in transitively for WASM OCI-artifact execution, has a native-codegen ("Compiler"/JIT) backend for amd64 and arm64 but none for riscv64 (confirmed: 0 riscv64-tagged files vs. dedicated amd64/arm64 assembly backends). riscv64 falls back to wazero's portable Interpreter engine, which upstream states is tested for Linux riscv64. This is a wazero-project gap, not a containerd gap; see Section 9 and `project-reports/wazero.md`.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Assembly syscall stubs (x/sys) | Yes (hand-tuned) | Yes (hand-tuned) | Yes (hand-tuned ECALL) |
| Seccomp arch constant | Yes | Yes | Yes |
| Arch-specific syscalls in seccomp | Yes (`arch_prctl`, `modify_ldt`) | Yes (6 ARM cache/TLS syscalls) | Yes (`riscv_flush_icache`, `riscv_hwprobe`) |
| SIMD in compression (klauspost/compress) | Yes (amd64 asm) | Yes (arm64 asm) | No - generic Go path only |
| WASM JIT backend (wazero, indirect) | Yes | Yes | No - interpreter fallback only |
| Race detector support | Yes | No | No |

No stubs or partial implementations exist in any riscv64 code path that containerd itself owns.

## 5. Build System, Cross-Compilation, and Toolchain

containerd uses GNU Make. There is no CMake anywhere in the tree (verified: `find . -iname CMakeLists.txt` returns nothing outside vendor). Cross-compilation is done via two paths, both confirmed against the current `main` branch.

**Path A - native cross-compile (used in `nightly.yml`, build-only, no test execution):**
```yaml
sudo apt-get install -y crossbuild-essential-riscv64
# GOOS: linux
# GOARCH: riscv64
# CGO_ENABLED: 1
# CC: riscv64-linux-gnu-gcc
run: make binaries
```
Runs on `ubuntu-latest` (x86_64), triggered daily via cron plus on changes to the workflow file itself. Produces `bin_riscv64`, uploaded as artifact `linux_riscv64`. No test target is invoked.

**Path B - Docker Buildx (used in `release.yml` to produce shipped riscv64 binaries):**
```bash
docker buildx build \
  --cache-from=type=gha,scope=containerd-release --cache-to=type=gha,scope=containerd-release \
  --build-arg RELEASE_VER --build-arg UBUNTU_VERSION=22.04 \
  -f .github/workflows/release/Dockerfile \
  --platform=linux/riscv64 \
  -o releases/ .
```
Runner: `ubuntu-latest`. The release Dockerfile (`.github/workflows/release/Dockerfile`, fetched in full) uses [tonistiigi/xx](https://github.com/tonistiigi/xx) `1.6.1`, pinned by SHA256 digest, to resolve `TARGETPLATFORM=linux/riscv64` to `riscv64-linux-gnu`; `CC=$(xx-info)-gcc` then resolves to `riscv64-linux-gnu-gcc`, and `xx-go --wrap` wraps the Go toolchain for the cross-target. `gcc` is installed via `xx-apt-get install -y gcc` specifically because `github.com/containerd/btrfs/v2` requires cgo. No `Dockerfile.riscv64` or riscv64-dedicated Dockerfile exists.

**Toolchain versions (current `main`, as of 2026-09-30):**
- Go: CI default `1.26.8` (`.github/actions/install-go/action.yml`); `go.mod` declares `go 1.26.6`; release Dockerfile pins `GO_VERSION=1.27.1`. BUILDING.md policy supports at least one of the two most recent major Go versions.
- GCC cross-compiler: `riscv64-linux-gnu-gcc`, resolved via `crossbuild-essential-riscv64` (native path, Ubuntu) or via `xx-apt-get install gcc` + the `tonistiigi/xx` wrapper (Docker path). No minimum GCC version is pinned; it is whatever the Ubuntu base resolves. No Clang toolchain is used for riscv64.
- `tonistiigi/xx`: `1.6.1`, pinned by digest `sha256:923441d7c25f1e2eb5789f82d987693c47b8ed987c4ab3b075d6ed2b5d6779a3`.
- `-buildmode=pie`: enabled for riscv64 via `Makefile.linux` (`GO_GCFLAGS += -buildmode=pie` for every `GOARCH` except `mips mipsle mips64 mips64le ppc64 loong64`, when not `STATIC`).

**Build tags (the closest equivalent to a `-DUSE_X=OFF` CMake flag in this Go project):** `BUILDTAGS=no_btrfs` (and `no_devmapper`, `no_zfs`, `no_systemd`, `no_cri`), set via `BUILDTAGS=` before the `binaries` Make target. No riscv64-specific build tag exists.

**QEMU:** No explicit QEMU configuration exists anywhere in the repository (`grep -rli qemu .` outside vendor/.git returns only `test/init-buildx.sh`, unrelated to riscv64). Both build paths compile natively on x86_64 GitHub-hosted runners using cross-compilers (`riscv64-linux-gnu-gcc` / `xx-go --wrap`); QEMU/binfmt is not required for compilation. Buildx's `-o releases/` output step may depend implicitly on runner-provided QEMU/binfmt registration, but nothing in-repo configures or invokes it directly.

**Known build failures:** None identified for the riscv64 cross-compile or release-image build path itself. The build-side risk that exists is upstream of containerd: CRIU and EROFS support are explicitly skipped in the (unmerged) riscv64 integration-test job because of external limitations, not build failures.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Container start/stop/exec | Yes | Yes | Yes | Core runtime builds and, per the most recent fork CI run, passes 1993 of 1994 integration tests (83 skipped) |
| Kubernetes CRI integration | Yes | Yes | Yes | Pure Go; no arch-specific code |
| OCI image pull/push | Yes | Yes | Yes | |
| Snapshotting (overlayfs) | Yes | Yes | Yes | |
| Snapshotting (btrfs) | Yes | Yes | Yes (cgo, riscv64 dev libraries confirmed present in Ubuntu resolute) | Auto-skipped via cgo tag when unavailable, not manual |
| Snapshotting (zfs) | Yes | Yes | Uncertain | `zfsutils-linux` ships riscv64 in Ubuntu resolute but the `libzfs` dev packages were not found under expected names - availability unresolved |
| Seccomp filtering | Yes | Yes | Yes - including `riscv_flush_icache`, `riscv_hwprobe` | |
| WASM OCI artifact execution (via wazero) | Yes - JIT | Yes - JIT | Interpreter only - no JIT backend | Slower, but functional |
| Checkpoint/Restore (CRIU) | Yes | Yes | No | [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since Dec 2021; explicitly skipped in PR #13124 |
| EROFS filesystem mount | Yes | Yes | Kernel module gap fixed on RISE CI runner image; production-hardware correctness otherwise unverified | Module gap tracked at riseproject-dev/riscv-runner#24, resolved for CI purposes |
| Static binary | Yes | Yes | Yes | `containerd-static-*-linux-riscv64.tar.gz` ships in every release |
| Race detector | Yes | No | No | Go race detector does not support riscv64 |
| Image layer compression (zstd/S2) | Yes - SIMD | Yes - SIMD | Yes - generic Go path only | klauspost/compress has no riscv64 asm kernel |

**Functional gaps:**

1. Checkpoint/Restore is not available on riscv64. containerd's own integration-test proposal (PR #13124) explicitly skips CRIU and checkpoint/restore on riscv64, citing [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since December 2021. This is an upstream CRIU gap, not a containerd gap, but it removes live-migration and checkpoint functionality from riscv64 deployments.
2. WASM OCI artifacts (via the transitively-pulled `wazero` runtime) execute via interpreter only on riscv64, with no JIT/native-codegen path. Functionally correct, substantially slower than amd64/arm64 for WASM-heavy workloads.
3. The zfs snapshotter's riscv64 buildability is unresolved pending confirmation of `libzfs` dev-package availability on riscv64 (Data not available: definitive libzfs riscv64 dev-package name/version for Ubuntu resolute).

**Performance gaps:** klauspost/compress (used for OCI layer zstd/S2/gzip) has no riscv64 assembly; amd64 and arm64 receive SIMD acceleration, riscv64 uses the generic Go path. This creates a throughput gap for image pull/push operations specifically in layer decompression/compression. The magnitude is unquantified in any available source (Data not available: no riscv64-vs-amd64/arm64 compression benchmark for containerd or klauspost/compress).

**Security hardening gaps:** None identified. Seccomp, namespaces, and cgroups all function correctly on riscv64 per the fork CI's near-total pass rate.

**NaN/floating-point semantics:** No riscv64 NaN/floating-point-specific bug has ever been filed against containerd/containerd (explicitly searched; only the tracking issue #13020 and closed issue #3389 matched riscv-related queries, and #3389 was an epoll struct-padding bug, not a floating-point issue).

## 7. CI/CD Infrastructure

**Verification method:** Direct clone of `containerd/containerd` `main` and `grep -inR riscv .github/workflows/` across all 17 workflow files plus the `release/` subdirectory (GitHub API/MCP tools were restricted for this repository in this session, so this was primary-source verification, not search-result fragments).

**Full result - exactly two files reference riscv64, both build-only:**
```
.github/workflows/release.yml:83:            dockerfile-platform: linux/riscv64
.github/workflows/nightly.yml:49:            crossbuild-essential-riscv64 \
.github/workflows/nightly.yml:89:      - name: Build riscv64
.github/workflows/nightly.yml:92:          GOARCH: riscv64
.github/workflows/nightly.yml:94:          CC: riscv64-linux-gnu-gcc
.github/workflows/nightly.yml:97:          mv bin bin_riscv64
.github/workflows/nightly.yml:127:      - name: Upload artifacts (linux_riscv64)
.github/workflows/nightly.yml:130:          name: linux_riscv64
.github/workflows/nightly.yml:131:          path: src/github.com/containerd/containerd/bin_riscv64
```
`ci.yml` - the actual PR-gating integration-test workflow, triggered on `pull_request` and `merge_group` - has **zero** matches for "riscv" anywhere in its 28,889 bytes. A riscv64 crossbuild case existed in `ci.yml` as of PR #6882 (2022) but is no longer present on `main` today; it was removed/consolidated and nothing has put riscv64 back into the gating workflow since.

| Workflow file | Trigger | riscv64 coverage | Runner | Nature |
|---|---|---|---|---|
| `ci.yml` | `pull_request`, `merge_group` | None | - | Integration tests run on amd64/arm64 runners only |
| `nightly.yml` | Daily cron + changes to the workflow file | Cross-compile + artifact upload | `ubuntu-latest` (x86_64) | `GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc make binaries`; no test execution |
| `release.yml` | Push/tag to main or release branches | Release Docker image build | `ubuntu-latest` (x86_64) via Docker Buildx | `docker buildx build --platform=linux/riscv64`; no test execution |

**PR #13124 - proposed CI addition:** [PR #13124](https://github.com/containerd/containerd/pull/13124) (opened 2026-03-25 by gounthar) proposes adding `ubuntu-24.04-riscv` (free [RISE Project](https://riseproject.dev) runners) to the `integration-linux` OS matrix, skipping CRIU/checkpoint-restore and EROFS (both unavailable/unsupported on the riscv64 runner image), and switching the `dm_verity` check from `lsmod` to `/proc/modules`.

**Current status (as of the PR's own 2026-08-08 status comment):** "Not mergeable yet," labeled `needs-rebase`. Two blockers, both authored/self-identified by gounthar:
1. **Unrelated to riscv64:** PR #13562 added a `sudo udevadm control` line to the Tests step; the RISE runner image runs no udevd, so the step exits 1 under `bash -e` and aborts `make test` before it starts. A `|| true` guard fixes it; gounthar intends to send that as its own PR.
2. **Runner-side, outside containerd's control:** `TestSetPositiveOomScoreAdjustment` fails because the RISE runner pod's baseline `oom_score_adj` is 1000 (Kubernetes BestEffort QoS default) versus 0 on GitHub-hosted VMs, so lowering it needs `CAP_SYS_RESOURCE` outside a user namespace. Tracked at [riseproject-dev/riscv-runner#19](https://github.com/riseproject-dev/riscv-runner/issues/19).

**Latest fork test results (2026-08-01, with a local udevd-guard workaround applied):** 1993 tests, 83 skipped, 1 failure (blocker 2 above) on both the cgroupfs and systemd cgroup drivers. Without the guard, the job runs zero tests. Earlier runner-image gaps (missing erofs kernel module, missing `lsmod`) are fixed and now tracked in the renamed/transferred `riseproject-dev/riscv-runner` repository rather than the archived `riscv-runner-images` repo referenced by earlier tracking.

No containerd core maintainer has engaged on either Issue #13020 (8 comments) or PR #13124 (4 comments) per the fetched issue/PR bodies; comment-thread text itself could not be retrieved in this research pass due to a repository access restriction, so maintainer sentiment beyond the bodies is [NEEDS VERIFICATION].

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Integration tests in `ci.yml` (gating) | Yes | Yes | No - PR #13124 unmerged, `needs-rebase` |
| Nightly cross-compile build | Yes | Yes | Yes |
| Release binary/image CI | Yes | Yes | Yes |
| Native runner available for use | Yes | Yes | Yes (RISE, not yet merged into gating CI) |
| Race detector tests | Yes | No | No |

## 8. Distribution and Release Status

**Official GitHub release binaries:** riscv64 binaries ship in every release from v1.6.8 onward. Latest verified release: **v2.4.1**, published 2026-09-24, with assets `containerd-2.4.1-linux-amd64.tar.gz`, `-arm64`, `-ppc64le`, `-riscv64`, and `-s390x` - riscv64 sits alongside the other standard architectures, not as an outlier. Build provenance attestation is generated for release artifacts.

Earlier releases (per prior verification, not re-checked this pass but not contradicted by current findings):

| Release | riscv64 assets |
|---|---|
| v2.3.2 | `containerd-2.3.2-linux-riscv64.tar.gz`, `containerd-static-2.3.2-linux-riscv64.tar.gz` |
| v2.2.5 | `containerd-2.2.5-linux-riscv64.tar.gz`, `containerd-static-2.2.5-linux-riscv64.tar.gz` |
| v2.1.9 | `containerd-2.1.9-linux-riscv64.tar.gz`, `containerd-static-2.1.9-linux-riscv64.tar.gz` |
| v2.0.10 | `containerd-2.0.10-linux-riscv64.tar.gz`, `containerd-static-2.0.10-linux-riscv64.tar.gz` |
| v1.7.33 | `containerd-1.7.33-linux-riscv64.tar.gz`, `containerd-static-1.7.33-linux-riscv64.tar.gz`, plus `cri-containerd` variants |

**Linux distribution packages:**

| Distribution | riscv64 available | Version | Source |
|---|---|---|---|
| Ubuntu (jammy, jammy-updates, noble, noble-updates, questing, questing-updates, resolute, resolute-updates) | Yes - via the "ports" pocket | `2.2.2-0ubuntu1` (transitional package `containerd` provides `containerd-stable`) | [packages.ubuntu.com/resolute/riscv64/containerd](https://packages.ubuntu.com/resolute/riscv64/containerd) |
| Debian (current) | Yes - installed | `2.1.9+ds1-1`, built on `rv-manda-01` [not re-verified this pass] | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=containerd) |
| Arch Linux RISC-V (archriscv) | Yes | `containerd-2.2.1-1-riscv64.pkg.tar.zst` (plus an older `containerd-0.9.4-2`) | [mirrors.felixc.at/archriscv/repo/extra/](https://mirrors.felixc.at/archriscv/repo/extra/) |

Note: the PyPI package named `containerd` ([pypi.org/pypi/containerd](https://pypi.org/pypi/containerd/json), latest 1.5.3, 2021, by Siemens) is an unrelated third-party gRPC client library, not the containerd daemon itself. It is pure-Python (`py3-none-any`), so architecture-specific wheels are not applicable - its absence of riscv64-tagged files says nothing about daemon binary availability.

**Community distribution:** [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) rebuilds and republishes containerd riscv64 binaries within days of each upstream release (v2.3.5, v2.4.0, v2.4.1 tracked as of September 2026), on a weekly cadence (Sundays 02:00 UTC), tested on native BananaPi F3 and SpacemiT K1 hardware running Debian Trixie. Per [this dev.to post](https://dev.to/gounthar/docker-v29-lands-on-risc-v64-in-under-a-week-the-future-is-here-4g2i), Docker v29 builds landed on riscv64 within under a week of upstream release.

**To get a working riscv64 binary:** download `containerd-2.4.1-linux-riscv64.tar.gz` from the [GitHub Releases page](https://github.com/containerd/containerd/releases). No patches or custom builds are required. A static variant (`containerd-static-2.4.1-linux-riscv64.tar.gz`) is also published for environments where libc linking is problematic.

## 9. Dependencies

**Summary table (direct dependencies as designated, plus indirect dependencies surfaced by dependency-tree research):**

| Dependency | Relation / criticality | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| runc | runtime-dependency, critical | OCI container runtime (exec, namespaces, cgroups) | Yes | Not confirmed via official CI | Yes - `runc.riscv64` ships | opencontainers/runc#5166 (sibling riscv64 CI ask, linked from containerd Issue #13020) status not independently re-verified this pass |
| CRIU | runtime-dependency, optional | Checkpoint/Restore in Userspace | Partial | No | Unknown | [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since Dec 2021; explicitly skipped in PR #13124. The Go binding `checkpoint-restore/go-criu` has its own issue tracker that was not completed this pass (rate-limited) |
| klauspost/compress | runtime-dependency, optional | zstd/S2/gzip compression for OCI layers | Yes - pure Go fallback | Yes | N/A (library) | No riscv64 SIMD asm kernel; only riscv64-relevant code is a generic little-endian fallback path (`internal/le/unsafe_enabled.go`), not SIMD. No blocking issues found |
| containerd/cgroups | runtime-dependency, critical | cgroups v1/v2 management | Yes | Not independently confirmed | N/A (library) | Pure Go + x/sys syscalls; no riscv64 issues filed |
| CNI plugins | runtime-dependency, optional | Container network interface plugins | Yes | Not independently confirmed | Yes | No open riscv64 issues found |
| gRPC-Go | runtime-dependency, critical | gRPC transport for CRI, NRI, ttrpc | Yes - pure Go | Yes | N/A (library) | No arch-specific code |
| bbolt | runtime-dependency, critical | Embedded mmap-based KV store for containerd's metadata DB | Yes - since 2019 (PR #3328) | Yes | N/A (library) | No riscv64-specific issues found |
| OpenTelemetry | runtime-dependency, optional | Distributed tracing | Yes - pure Go | Yes | N/A (library) | No riscv64-specific issues found |
| golang.org/x/sys | runtime-dependency, critical | Linux syscall bindings | Yes - full riscv64 syscall tables and hand-written asm | Yes | N/A (library) | Actively maintained; historical riscv64 epoll padding bug (fixed 2019) is the only known regression, long resolved |
| erofs/go-erofs | runtime-dependency, optional | EROFS read-only filesystem support | Not fully verified | Blocked in CI - kernel module gap on RISE runner fixed at image level (riscv-runner#24); library-level test coverage unverified | N/A (library) | Skipped in PR #13124's proposed CI |
| Kubernetes | runtime-dependency, optional | CRI integration surface (cri-api, cri-client) | Yes - pure Go protobuf | Yes | N/A (library) | No riscv64-specific issues found |
| Protocol Buffers | runtime-dependency, critical | Wire format for CRI/gRPC/ttrpc | Yes - pure Go | Yes | N/A (library) | No riscv64 issues found |
| opencontainers/runtime-spec | runtime-dependency, critical | OCI runtime configuration schema | Yes | Yes | N/A (library) | `ArchRISCV64 = "SCMP_ARCH_RISCV64"` defined and used by containerd's seccomp default profile (Section 4) |
| containerd/btrfs | runtime-dependency, optional | btrfs snapshotter backend (cgo -> libbtrfs) | Yes | Not verified - GitHub issue search for this repo hit a rate limit and did not complete | Package present | `libbtrfs-dev` and `btrfs-progs` both ship riscv64 in Ubuntu resolute (manually verified) |
| Go | build-dependency, critical | Compiler toolchain | Yes - native riscv64 support since Go 1.16 (PIE) | N/A | N/A | CI uses 1.26.8; go.mod declares 1.26.6; release Dockerfile pins 1.27.1 |
| GCC | build-dependency, critical | C cross-compiler for cgo-dependent code (btrfs, seccomp) | Yes - `riscv64-linux-gnu-gcc` | N/A | N/A | Sourced via `crossbuild-essential-riscv64` (Ubuntu) or `xx-apt-get`/`tonistiigi/xx` (Docker path) |
| GNU make | build-dependency, critical | Build orchestration (`make binaries`, `make release`, `make test`) | Yes | N/A | N/A | No riscv64-specific issues; `Makefile.linux` conditionally sets `-buildmode=pie` per `GOARCH` |
| Buildx | build-dependency, optional | Multi-arch release image build (`docker buildx --platform=linux/riscv64`) | Yes | N/A | Yes - used to build shipped riscv64 release images | No riscv64-specific issues found |
| xx | build-dependency, optional | Cross-compilation helper in the release Dockerfile (`tonistiigi/xx`) | Yes | N/A | N/A | Pinned `1.6.1` by digest; resolves `TARGETPLATFORM=linux/riscv64` to `riscv64-linux-gnu` |
| wazero (`tetratelabs/wazero`, indirect) | runtime-dependency, indirect | Embedded WASM runtime (JIT-style "Compiler" backend + interpreter) for WASM OCI artifacts | Yes - interpreter engine | Interpreter engine tested by upstream on Linux riscv64; no JIT backend exists | N/A (library) | No riscv64 JIT backend (0 riscv64-tagged asm files vs. dedicated amd64/arm64 backends). No tracked upstream issue requesting one. See `project-reports/wazero.md` |
| golang.org/x/crypto (indirect) | runtime-dependency, indirect | Crypto primitives (SSH, chacha20poly1305, argon2, etc.) | Yes - generic constant-time Go fallback | Yes | N/A (library) | No riscv64 vector-crypto (Zvkb/Zkne) acceleration yet; no containerd-specific issues found |
| cloudflare/circl (indirect) | runtime-dependency, indirect | ECC / post-quantum crypto (transitively, image signing/verification chain) | Not confirmed [NEEDS VERIFICATION] | Not verified | Not verified | 0 riscv64-specific files found via code search; circl#120 (generic ecc/p384 implementation) is generic-arch related but not riscv64-specific. Flagged for follow-up build verification |
| containerd/zfs + OpenZFS (indirect) | runtime-dependency, indirect | ZFS snapshotter backend (cgo -> libzfs) | Uncertain | Uncertain | Uncertain | `zfsutils-linux` ships riscv64 in Ubuntu resolute, but `libzfs6`/`libzfs4-dev` dev packages were not found under those names - naming/availability unresolved. [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) (open, Aug 2026) is an active current regression: "ZFS 2.4.4 (and master) not working on Riscv64 with Linux 7.1.10" |
| cilium/ebpf (indirect) | runtime-dependency, indirect | Pure-Go eBPF loader (NRI/CRI net/resource paths) | Yes - pure Go | No riscv64-specific issues found (2 hits, both arm64-only) | N/A (library) | Underlying riscv64 BPF syscall support is a kernel matter, not a userspace package concern |

**Deep-dive on the two real, currently-open upstream blockers outside containerd's own code:**

**CRIU:** the tracking issue [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), "Support for RISC-V," has been open since December 2021 and remains open. containerd's proposed riscv64 integration-test job explicitly skips CRIU and checkpoint/restore on riscv64 citing this issue. Live migration and container checkpointing are unavailable on riscv64 deployments as a direct result, independent of anything in containerd's own code.

**OpenZFS:** [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) (open, filed August 2026) documents ZFS 2.4.4/master not working on riscv64 with Linux 7.1.10 - an active regression, not a historical gap. Combined with the unresolved `libzfs` dev-package availability question on Ubuntu resolute, the zfs snapshotter's riscv64 status should be treated as unverified-to-broken pending a follow-up check, not as a confirmed-working feature.

**klauspost/compress:** provides zstd and S2 compression used for OCI image layer operations. It has hand-written assembly for amd64 (AVX2/SSE4) and arm64 (NEON). riscv64 falls through to the pure-Go implementation. No riscv64 SIMD path exists and no open issue requests one; the resulting performance delta is unquantified in any available source.

## 11. Known Bugs and Active Issues

**Correctness bugs (all resolved, no open correctness bugs remain):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3389](https://github.com/containerd/containerd/issues/3389) | CPU at 100% on container deletion with crun+Docker (riscv64) | Closed / completed | Critical (was) | Root cause: `EpollEvent` struct-padding bug in `golang.org/x/sys` for riscv64. Fixed 2019-08-12 via [PR #3526](https://github.com/containerd/containerd/pull/3526). Not present in any supported release |
| [Issue #8184](https://github.com/containerd/containerd/issues/8184) | containerd-shim error when running in riscv64 | Closed / not planned (wontfix) | Low | Legacy v1 shim (`io.containerd.runtime.v1.linux`) segfaults (`unhandled signal 11`) on riscv64 with containerd v1.6.18 + runc 1.1.3. Works fine under `io.containerd.runc.v2`. Closed same-day since the v1 shim is deprecated |

**Infrastructure / CI gaps (open):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #13020](https://github.com/containerd/containerd/issues/13020) | Add linux/riscv64 to CI test matrix | Open, reopened | Medium | Tracking issue, 8 comments, last updated 2026-08-14. No visible core-maintainer engagement in the fetched body/comment count |
| [PR #13124](https://github.com/containerd/containerd/pull/13124) | ci: add riscv64 to Linux integration test matrix | Open, labeled `needs-rebase`, "not mergeable yet" | Medium | Latest fork run (2026-08-01): 1993 tests, 83 skipped, 1 failure. Blocked on an unrelated PR's udevadm step and on riseproject-dev/riscv-runner#19 |
| [PR #14259](https://github.com/containerd/containerd/pull/14259) | contrib/seccomp: Use the default profile from moby/profiles | Open, draft, `status/needs-discussion`, `do-not-merge/work-in-progress` | Low (not CI-decisive) | Opened 2026-09-29 by vvoland (Docker). Rewrites the default seccomp profile to reuse `moby/profiles/seccomp`; explicitly notes `riscv_hwprobe` would be allowed on all architectures though only riscv64 has it - a minor behavioral broadening of the riscv64 seccomp surface. Blocked on a maintainer (Samuel Karp) objection about breaking-change timing (switching the default from `ENOSYS` to `EPERM`), which per containerd policy should wait for the next post-LTS release window (~2.7, roughly a year out) |

No NaN/floating-point-specific bug has been filed for riscv64 in this repository.

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **CRIU on riscv64 remains unresolved.** [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) has been open since December 2021. Checkpoint/restore and live migration are unavailable on riscv64 as a direct consequence, and this is explicitly why PR #13124 skips CRIU testing. This is entirely an upstream CRIU gap, not a containerd gap.
2. **OpenZFS riscv64 regression is active.** [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) (open, August 2026) plus unresolved `libzfs` dev-package naming on Ubuntu means the zfs snapshotter's riscv64 status should not be assumed working without a direct build/test check.
3. **No SIMD for compression (klauspost/compress) or JIT (wazero) on riscv64.** Both are upstream library gaps affecting image-pull throughput and WASM-artifact execution speed respectively, not correctness.

**Organizational blockers:**

1. **PR #13124 is self-blocked by its own author on two items**, neither of which is a containerd-maintainer objection: (a) a `|| true` guard for an unrelated PR's (#13562) `udevadm` line, which gounthar intends to send as a separate small PR but had not yet confirmed as sent as of the 2026-08-08 status update; and (b) [riseproject-dev/riscv-runner#19](https://github.com/riseproject-dev/riscv-runner/issues/19), the RISE runner pod's `oom_score_adj` baseline mismatch versus GitHub-hosted VMs - entirely outside containerd maintainers' control, owned by RISE's runner-infrastructure team.
2. **No containerd core maintainer has visibly engaged** on Issue #13020 or PR #13124 in the fetched bodies (comment-thread text itself was not retrievable this pass due to a repository access restriction in this research session, so the absence of engagement is based on body/summary content and comment counts, not a full read of every comment - [NEEDS VERIFICATION] for the full thread).
3. **PR #14259 is blocked on an explicit maintainer objection**: Samuel Karp has flagged the `ENOSYS`-to-`EPERM` seccomp-default change as a breaking change that should wait for containerd's next post-LTS release window (~2.7, roughly a year out per the PR's current trajectory). The author (vvoland) is open to making the new behavior configurable but is awaiting further community/maintainer interest. This item is not CI-decisive for the yellow-to-blue transition but is worth tracking since it touches `riscv_hwprobe` allow-listing behavior.

**Acceptance probability:** The technical implementation work for riscv64 CI is essentially complete - 1993 of 1994 tests pass in the fork's latest run, with the single failure attributable to RISE-runner-side infrastructure, not containerd code. The path to merging PR #13124 depends on two small, well-scoped fixes (one CI YAML guard, one runner-infrastructure change to `oom_score_adj` baseline) plus a first round of containerd-maintainer review, which has not yet occurred. None of the blockers reflect technical opposition to riscv64 itself - the original enablement PR (#6882) was merged with direct maintainer sponsorship (AkihiroSuda, NTT) in 2022, and no riscv64-specific objection has been raised anywhere in the research for this report.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream

**Justification:** Per the project-color-coding skill's evidence table, upstream CI builds riscv64 (`nightly.yml` cross-compiles via `crossbuild-essential-riscv64`; `release.yml` cross-builds release binaries via Docker Buildx for `linux/riscv64`) and upstream does publish riscv64 release artifacts (confirmed `containerd-2.4.1-linux-riscv64.tar.gz` on the [GitHub Releases page](https://github.com/containerd/containerd/releases)), but the main `ci.yml` integration-test matrix has zero riscv64 coverage - no native or QEMU-based riscv64 test job exists in merged CI. The only attempt to add riscv64 test execution, [PR #13124](https://github.com/containerd/containerd/pull/13124), remains open/unmerged and as of its 2026-08-08 status update is "not mergeable yet," blocked on an unrelated `udevadm` step breaking the RISE runner image and on [riscv-runner#19](https://github.com/riseproject-dev/riscv-runner/issues/19) (runner pod `oom_score_adj` baseline). This is the "build yes / test no / artifact either" case, which maps to yellow regardless of the artifact column, since the CI evidence rule caps it there when the riscv64 job is build-only in merged CI.

**Pending work that could change the grade:** Open [Issue #13020](https://github.com/containerd/containerd/issues/13020) (tracking issue) and open [PR #13124](https://github.com/containerd/containerd/pull/13124) (adds riscv64 to the `ci.yml` integration-linux matrix via RISE `ubuntu-24.04-riscv` runners) - both authored by external contributor gounthar, unmerged. PR #13124 is self-blocked by its author pending two fixes: a `|| true` guard for an unrelated PR's `udevadm` line, and [riseproject-dev/riscv-runner#19](https://github.com/riseproject-dev/riscv-runner/issues/19) (the RISE runner pod's `oom_score_adj` baseline, outside containerd maintainers' control). No containerd core maintainer has engaged on either item per the fetched bodies. Separately, draft [PR #14259](https://github.com/containerd/containerd/pull/14259) (seccomp profile refactor, touches `riscv_hwprobe` behavior) is WIP/needs-discussion, blocked on a maintainer (Samuel Karp) objection about breaking-change timing - not CI-decisive but worth tracking, since if PR #13124 merges with tests passing, the color would move to blue (or green if artifact provenance stays upstream).

## 14. Investment Analysis

RISE Project involvement with containerd remains infrastructure-level, not a funded code deliverable. The May 2026 blog post "[RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)" states RISE is "engaged with k3s, Kubernetes itself, and containerd to bring native RISC-V CI to those projects too" - the same tier of engagement as k3s and Kubernetes, with no dedicated containerd repo, working group, or standalone blog post. RISE's GitHub org (`riseproject-dev`) has no dedicated containerd repository; the closest concrete artifact is [riscv-runner PR #119](https://github.com/riseproject-dev/riscv-runner/pull/119) ("images: Build multi-arch Kubernetes images," merged 2026-09-29), which builds kube-proxy/pause images for amd64/arm64/riscv64 and explicitly notes using them "when provisioning clusters and configuring containerd" - i.e., containerd is a consumer of RISE's infrastructure work, not a funded target of it. No RISE RFP or dedicated engineering allocation for containerd code changes was found.

### 14.1 Functional Enablement

No functional enablement work is needed for containerd core - the runtime compiles, runs, and passes 1993/1994 integration tests on riscv64 in the unmerged fork CI. CRIU checkpoint/restore and the OpenZFS regression both require upstream work outside containerd's repository; if either is a product requirement, track [criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) and [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) directly rather than filing containerd-side work.

### 14.2 Performance Optimization

Two library-level gaps drive the performance delta on riscv64, both outside containerd's own repository:
1. klauspost/compress has no riscv64 SIMD kernel for zstd/S2/gzip, affecting image pull/push throughput. Effort estimate for adding RVV assembly: Data not available (depends on RVV proficiency and benchmark validation; the amd64/arm64 paths are each several thousand lines of assembly).
2. wazero has no riscv64 JIT ("Compiler") backend for WASM OCI artifacts, only the interpreter. Relevant only if WASM-artifact workloads are a priority; effort estimate: Data not available - see `project-reports/wazero.md`.

Neither gap has a quantified benchmark delta available in current research.

### 14.3 CI/CD Infrastructure

The highest-leverage action is unblocking PR #13124, which now decomposes into three discrete, mostly small items rather than a single "install a GitHub App" step:
1. Land the `|| true` guard for the `udevadm` step that PR #13562 introduced (small, likely sub-day fix; not yet confirmed sent by the author).
2. Resolve [riseproject-dev/riscv-runner#19](https://github.com/riseproject-dev/riscv-runner/issues/19) - fix the RISE runner pod's `oom_score_adj` baseline to match GitHub-hosted VMs. This is RISE runner-infrastructure work, not containerd work; if Qualcomm/RISE liaison capacity is available, this is the most direct lever available.
3. Solicit containerd-maintainer review and approval once 1 and 2 clear and gounthar rebases - no maintainer has engaged on the PR to date, so first-touch review is itself a gating step.

Once merged, every PR to containerd/containerd would run the integration suite on native RISC-V hardware at no infrastructure cost (RISE runners are free for open source).

### 14.4 Ecosystem Enablement

Data not available applicable: containerd is a container runtime daemon with no dependent package ecosystem of its own requiring riscv64 enablement (no Python wheels, npm packages, or Maven JARs consume containerd as a library in a way that needs separate riscv64 builds). The relevant downstream ecosystem concerns - runc, the broader Docker/Kubernetes stack, CRIU, and OpenZFS - are tracked as separate dependencies/projects, not as a containerd-owned ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Land `\|\| true` udevadm guard against PR #13562's step | 0.1 | gounthar / any containerd contributor | Critical |
| CI/CD | Fix RISE runner pod `oom_score_adj` baseline (riscv-runner#19) | 0.5 | RISE runner-infrastructure team (Qualcomm/RISE liaison) | Critical |
| CI/CD | First-round maintainer review and approval of PR #13124, then merge | 0.5 | containerd maintainer | Critical |
| Functional | Track CRIU riscv64 completion (criu#1702) | Unknown - upstream CRIU work | CRIU community | High (if live migration is a product requirement) |
| Functional | Investigate/resolve OpenZFS riscv64 regression (openzfs/zfs#18989) and confirm libzfs dev-package availability | 0.5 (investigation only) | OpenZFS community / Ubuntu packaging | Medium (if zfs snapshotter is required) |
| Performance | RVV assembly for klauspost/compress (zstd, S2, gzip) | 4-12 (estimate only, no benchmark data to confirm ROI) | Community/RISE | Low until quantified |
| Performance | wazero riscv64 JIT ("Compiler") backend | Unknown - see project-reports/wazero.md | Community/RISE | Low unless WASM OCI artifacts are a priority workload |

## 15. References

- [containerd/containerd repository](https://github.com/containerd/containerd)
- [containerd.io homepage](https://containerd.io)
- [PR #3328 - Update x/sys, x/net and bbolt modules for riscv64](https://github.com/containerd/containerd/pull/3328)
- [PR #3526 - bump x/sys to fix riscv64 epoll](https://github.com/containerd/containerd/pull/3526)
- [PR #4277 - riscv64 arch does not support -buildmode=pie](https://github.com/containerd/containerd/pull/4277)
- [PR #4964 - Add cgo tag to btrfs plugin](https://github.com/containerd/containerd/pull/4964)
- [PR #5937 - Makefile.linux: build on RISC-V with PIE](https://github.com/containerd/containerd/pull/5937)
- [PR #6882 - Support RISC-V 64](https://github.com/containerd/containerd/pull/6882)
- [PR #7258 - release: rollback Ubuntu to 18.04 (except for riscv64)](https://github.com/containerd/containerd/pull/7258)
- [PR #7260 - release/1.6 backport of PR #7258](https://github.com/containerd/containerd/pull/7260)
- [PR #11839 - seccomp: kernel v6.13 (libseccomp v2.6.0)](https://github.com/containerd/containerd/pull/11839)
- [PR #13124 - ci: add riscv64 to Linux integration test matrix](https://github.com/containerd/containerd/pull/13124)
- [PR #14259 - contrib/seccomp: Use the default profile from moby/profiles](https://github.com/containerd/containerd/pull/14259)
- [Issue #3389 - CPU at 100% on container deletion with crun+Docker (riscv64)](https://github.com/containerd/containerd/issues/3389)
- [Issue #8184 - containerd-shim error when running in riscv64](https://github.com/containerd/containerd/issues/8184)
- [Issue #13020 - Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [CRIU riscv64 tracking issue #1702](https://github.com/checkpoint-restore/criu/issues/1702)
- [openzfs/zfs#18989 - ZFS 2.4.4 (and master) not working on Riscv64 with Linux 7.1.10](https://github.com/openzfs/zfs/issues/18989)
- [riseproject-dev/riscv-runner#19 - oom_score_adj baseline](https://github.com/riseproject-dev/riscv-runner/issues/19)
- [riseproject-dev/riscv-runner PR #119 - multi-arch Kubernetes images](https://github.com/riseproject-dev/riscv-runner/pull/119)
- [RISE Project - Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project - RISE RISC-V Runners: Six Weeks In (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE GitHub App (riscv-runner-app)](https://github.com/apps/rise-risc-v-runners)
- [containerd v2.4.1 GitHub Releases page](https://github.com/containerd/containerd/releases)
- [Ubuntu resolute package page for containerd (riscv64)](https://packages.ubuntu.com/resolute/riscv64/containerd)
- [Debian buildd status for containerd](https://buildd.debian.org/status/package.php?p=containerd)
- [Arch Linux RISC-V (archriscv) mirror - extra repo](https://mirrors.felixc.at/archriscv/repo/extra/)
- [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64)
- [Docker v29 lands on RISC-V64 in under a week (dev.to)](https://dev.to/gounthar/docker-v29-lands-on-risc-v64-in-under-a-week-the-future-is-here-4g2i)
- [tonistiigi/xx cross-compilation helper](https://github.com/tonistiigi/xx)
- ["On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing" (ACM, Lumpp & Acquaviva, ESAAM 2023)](https://dl.acm.org/doi/fullHtml/10.1145/3624486.3624490)