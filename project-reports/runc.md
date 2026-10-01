---
title: runc
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp-golang
    relation: runtime-dependency
    criticality: critical
  - name: opencontainers/runtime-spec
    relation: runtime-dependency
    criticality: critical
  - name: opencontainers/cgroups
    relation: runtime-dependency
    criticality: critical
  - name: opencontainers/selinux
    relation: runtime-dependency
    criticality: optional
  - name: libpathrs
    relation: runtime-dependency
    criticality: optional
  - name: CRIU
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: vishvananda/netlink
    relation: runtime-dependency
    criticality: optional
  - name: vishvananda/netns
    relation: runtime-dependency
    criticality: optional
  - name: moby/sys
    relation: runtime-dependency
    criticality: optional
  - name: coreos/go-systemd
    relation: runtime-dependency
    criticality: optional
  - name: busybox
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="runc" %}

# runc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for runc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

runc is the OCI reference implementation of the container Runtime Specification. It is the low-level container runtime underlying Docker, containerd, Podman, and Kubernetes (via CRI). It is written primarily in Go, with CGo bindings to libseccomp (syscall filtering) and, optionally, libpathrs (a Rust library for safe path resolution via `openat2`). It has no JIT, no SIMD, and no cryptography or numeric-compute code of its own.

**Governance:** The [Open Container Initiative (OCI)](https://opencontainers.org/), under The Linux Foundation. A Technical Oversight Board (TOB) governs cross-project decisions under a formal charter. Member organizations listed on opencontainers.org include AWS, Google, Microsoft, Alibaba Cloud, Huawei, Docker, Red Hat, IBM, Cisco, OpenStack, Chainguard, Sysdig, and Weaveworks. **License:** Apache License 2.0 (confirmed from the repo's `LICENSE` file).

**Maintainers (from the `MAINTAINERS` file), with affiliation signal inferred from commit-email domain:**

| Maintainer | GitHub | Affiliation signal |
|---|---|---|
| Mrunal Patel | @mrunalp | Red Hat (`mpatel@redhat.com`) |
| Aleksa Sarai | @cyphar | SUSE historically (`asarai@suse.de` commits) [NEEDS VERIFICATION - current employer not independently confirmed] |
| Akihiro Suda | @AkihiroSuda | NTT (`@hco.ntt.co.jp`) |
| Kir Kolyshkin | @kolyshkin | gmail.com domain only; by far the top all-time committer, no corporate domain evident |
| Sebastiaan van Stijn | @thaJeztah | Docker Inc. (publicly known; email obscured in git history) |
| Li Fu Bang | @lifubang | independent/unclear |
| Rodrigo Campos | @rata | unclear from commit email |

**Top historical contributors** (`git shortlog -sn --all`): Kir Kolyshkin (1824 commits), Michael Crosby/Docker (~950 combined), Mrunal Patel/Red Hat (~850 combined), Aleksa Sarai/SUSE (~680 combined), Akihiro Suda/NTT (465), Qiang Huang/Huawei (302), Victor Marmol/Google (140).

**Culture on new ports:** Informal and contribution-driven, not roadmap-gated. There is no formal architecture-tier policy document anywhere in the repo - `README.md`, `CONTRIBUTING.md`, `MAINTAINERS_GUIDE.md`, `RELEASES.md`, and `PRINCIPLES.md` were all checked and none mention platform tiers, and no `PLATFORMS.md` or `SUPPORT.md` exists (confirmed 404 and absent in a fresh clone). riscv64 support entered through an outside contributor's PR in 2019 and was incrementally hardened by maintainers over several years until the changelog called it "supported" in v1.1.8 (2023). New-port acceptance follows ordinary PR review (maintainer approval), with no dedicated port-acceptance governance process.

**RISE membership:** opencontainers/runc is not listed as a RISE Project member (checked [riseproject.dev/members](https://riseproject.dev/members/)). RISE's Premier Members include Google, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent, among others - notably Red Hat (Mrunal Patel's employer) and Google (past contributor Victor Marmol's employer) are RISE members, but this gives runc itself no direct RISE affiliation. RISE's RISC-V GitHub Actions runners (Scaleway EM-RV1 bare-metal nodes) advertise "full Docker support" with Docker-in-Docker, but no public documentation confirms runc specifically as the container engine behind that support - this is not confirmed either way.

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main `opencontainers/runc` repository. There is no single master/umbrella tracking issue for the riscv64 port; support shipped as a sequence of independent, focused PRs.

| Date | Event | Source |
|---|---|---|
| 2019-08-26/2019-09-04 | First riscv64-related commit (Carlos de Paula, independent contributor): bumped `golang.org/x/sys` and updated syscall usage so downstream Go projects (Kubernetes, K3s) could compile against runc on riscv64. Explicitly noted runc itself still could not build due to CGo, citing `golang/go#27532` as the real blocker. Merged by Mrunal Patel. | [PR #2123](https://github.com/opencontainers/runc/pull/2123) |
| 2022-03-31 | Makefile fix adding riscv64 to the dynamic-PIE-buildmode-supported GOARCH list (Go 1.16+). | commit `ab5c60d`, part of [PR #3446](https://github.com/opencontainers/runc/pull/3446) |
| 2022-04-28/2022-04-30 | Prototype PR bumping libseccomp-golang for `SCMP_ARCH_RISCV64` and producing a `runc.riscv64` binary, tested live on QEMU riscv64 with a real container run and seccomp filter. Closed without merging, content folded into #3446. | [PR #3463](https://github.com/opencontainers/runc/pull/3463) |
| 2022-05-19 | Foundational enablement merged by Kir Kolyshkin (Red Hat), reviewed by AkihiroSuda (NTT), crazy-max, and thaJeztah: Dockerfile/Makefile fixes, static PIE for arm64/amd64, riscv64 release binary enabled, `AUDIT_ARCH_RISCV64` seccomp constant added (with a CentOS 7 compile-break workaround). This merge commit (`8093c54d`) did not actually ship in a tagged release until v1.2.0-rc.1 (2024-04-03), since runc's 1.1.x line is maintained via separate cherry-picks rather than merges from main. | [PR #3446](https://github.com/opencontainers/runc/pull/3446) |
| 2023-06-16/2023-06-28 | Backport of the #3446 riscv64/PIE infrastructure to the older, widely-pinned 1.1.x branch (merge commit `1cdfa95f`), explicitly to unblock K3s on RISC-V hardware. The PR itself states: "RISC-V64 support does not necessarily indicate full architectural support; rather, it reflects the capability to use the `-buildmode=pie` compiler flag." First shipped in v1.1.8 (2023-07-19). | [PR #3905](https://github.com/opencontainers/runc/pull/3905) |
| 2023-09-25/2023-09-26 | `runc-dmz` helper binary rewritten to use Linux kernel `nolibc` headers instead of full libc (636K to 8K on x86_64), with riscv64 explicitly confirmed covered by nolibc's `arch-riscv.h`. This subsystem has since been deleted and replaced (see Section 4). | [PR #4024](https://github.com/opencontainers/runc/pull/4024) |
| 2025-08-07/2025-09-27 | Busybox integration-test image updated to `1.37.0`, adding a riscv64 image entry in `tests/integration/get-images.sh` (dropping mips64le). This updates the test fixture, not the CI execution matrix (see Sections 7 and 9). First shipped v1.5.0-rc.1 (2026-03-13). | [PR #4842](https://github.com/opencontainers/runc/pull/4842) |
| 2026-03-12 | Issue asking runc to add `linux/riscv64` to its CI matrix and release artifacts, citing 117+ releases of working riscv64 builds from the `docker-for-riscv64` project on real hardware. Opened and closed the same day: the author discovered and confirmed that runc already ships a `runc.riscv64` release binary (since v1.1.8, still present in 1.4.0 at the time), and closed the issue as moot. **The CI-testing request itself was not addressed** - no riscv64 CI job was added. | [Issue #5166](https://github.com/opencontainers/runc/issues/5166) |
| 2026-05-22/2026-05-27 | Busybox image bumped again to `1.38.0` (merge commit `3cb21b92`). Merged to `main` but not yet included in any tagged release as of the current HEAD/latest tag v1.5.2 (2026-09-25) - the 1.5.x maintenance line is cherry-pick based and did not pick this commit up. | [PR #5295](https://github.com/opencontainers/runc/pull/5295) |
| 2026-09-25 | v1.5.2 (latest tagged release) ships `runc.riscv64` as a distinct, verifiable 8.4MB binary asset (confirmed via direct HTTP headers: `Content-Length: 8478016`, `Content-Disposition: filename=runc.riscv64`). | [v1.5.2 release](https://github.com/opencontainers/runc/releases/tag/v1.5.2) |

**Key contributors to RISC-V work:**

| Contributor | Affiliation | Contribution |
|---|---|---|
| carlosedp (Carlos de Paula) | Independent | First syscall stubs, 2019 (PR #2123) |
| kolyshkin (Kir Kolyshkin) | Red Hat | Foundational riscv64 release enablement, 2022 (PR #3446) |
| AkihiroSuda | NTT | Co-review/merge of #3446; seccomp wiring; backport review |
| crazy-max | Independent | Confirmed riscv64 dynamic-PIE support matched Go's arch matrix |
| chazapis | Independent | 1.1.x backport for K3s, 2023 (PR #3905) |
| rata (Rodrigo Campos) | Unclear | `runc-dmz` nolibc rewrite preserving riscv64 buildability, 2023 (PR #4024; subsystem since replaced) |
| gounthar | Independent (docker-for-riscv64 maintainer) | Raised and closed Issue #5166, 2026 |

## 3. Upstream Support Tier

No formal platform-tier policy document exists for runc (confirmed absent). Tier status is inferred entirely from CI configuration and release-artifact evidence, verified by directly reading the four workflow files in `.github/workflows/` (`test.yml`, `scheduled.yml`, `validate.yml`, `actionlint.yml`) against commit `97f76a9b` (HEAD, 2026-09-28).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI test runner | Yes (`ubuntu-24.04`/`ubuntu-26.04`) | Yes (`ubuntu-24.04-arm`/`ubuntu-26.04-arm`) | No |
| QEMU CI emulation | No | No | No (not used for any architecture) |
| Riscv64 appears in CI at all | n/a | n/a | Yes, only as `-a riscv64` in a `make releaseall` cross-build step in `validate.yml`'s `release` job |
| Unit/integration test execution | Yes | Yes | No |
| Release binary produced | Yes (`runc.amd64`) | Yes (`runc.arm64`) | Yes (`runc.riscv64`), cross-compiled on an x86_64 runner |
| Release binary executed/tested before shipping | Yes | Yes | No |
| Static PIE build mode | Yes | Yes | No (dynamic PIE only; libc toolchain gap) |
| Ubuntu package | Yes | Yes | Yes - confirmed, `runc` 1.4.0-0ubuntu1 in Ubuntu 26.04 "resolute," architectures `amd64 arm64 armhf ppc64el riscv64 s390x` |

**Summary:** riscv64 is a genuine release target with an official, upstream-published binary artifact, produced every release via runc's own cross-compilation pipeline. It has zero CI test execution: the riscv64 binary is built (never run) on an x86_64 runner inside the same `make releaseall` job that builds every other architecture's binary. This is the "build step exists, no test execution" pattern underlying the yellow/build-only-ci grade (Section 13).

## 4. Technical Architecture and RISC-V-Specific Subsystems

runc contains no JIT, no SIMD, no cryptography, and no numeric compute code for any architecture. Architecture-specific code is limited to seccomp BPF constants, PIE build-mode gating, and (historically) a now-removed `runc-dmz` helper.

**Seccomp architecture mapping** (full support, riscv64 treated identically to every other architecture):
- `libcontainer/seccomp/config.go`: `archs` map includes `"SCMP_ARCH_RISCV64": "riscv64"`, listed alongside amd64/arm64/ppc64le/s390x/mips*/loong64, no special-casing.
- `libcontainer/seccomp/patchbpf/enosys_linux.go` (759 lines): defines `AUDIT_ARCH_RISCV64` (`EM_RISCV = 243`) with a `#ifndef` fallback guard for older kernel headers, structurally identical to the adjacent `AUDIT_ARCH_LOONGARCH64` fallback; a `scmpArchToAuditArch` switch case maps `libseccomp.ArchRISCV64` to `C.C_AUDIT_ARCH_RISCV64`. A repo-wide grep for "riscv" combined with "todo|fixme|stub|not implement|unsupported" returns zero matches.

**Self-exe sealing - correction to the historical record:** The `libct/dmz` subsystem (the nolibc-based "runc-dmz" helper binary discussed in PR #4024, which the earlier record of this report treated as an ongoing riscv64 risk area) has since been **deleted and replaced**:
```
f07d92db drop runc-dmz solution according to overlay solution
559bd4eb libct/system: rename dmz -> exeseal
e67725c0 contrib: remove deprecated memfd-bind binary
```
The replacement, `libcontainer/exeseal/` (`cloned_binary_linux.go`, `overlayfs_linux.go`), is pure Go using an overlayfs trick and has zero architecture-specific code - a grep for "arch|riscv|amd64|arm64" in that package returns nothing. The nolibc/riscv64-header-compatibility concern from PR #4024 is therefore obsolete; the current implementation needs no per-architecture handling at all.

**PIE build mode:** riscv64 is in the dynamic-PIE allowlist in the Makefile (`386 amd64 arm arm64 loong64 ppc64le riscv64 s390x`). Static PIE (`-linkmode external -extldflags -static-pie`) is gated to only `arm64`/`amd64` (`ifneq (,$(filter $(GOARCH),arm64 amd64))`); riscv64 cross builds fall back to non-static-PIE linking. This is a toolchain/libc limitation (`rcrt1.o` availability), not a runc code gap.

**nsexec.c C shim:** Standard POSIX/Linux syscalls (`clone`, `setns`, `unshare`, `fork`), architecture-agnostic by design, no `#ifdef __riscv` guards anywhere.

**Vendored dependency layer (not stubbed):** `vendor/github.com/seccomp/libseccomp-golang` has `ArchRISCV64` fully wired into `StringToArch`/`ArchToString`/the cgo `C_ARCH_RISCV64` mapping. `vendor/golang.org/x/sys/unix` ships the complete riscv64 Linux syscall table set (`syscall_linux_riscv64.go`, `zerrors_linux_riscv64.go`, `zsyscall_linux_riscv64.go`, `zsysnum_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `asm_linux_riscv64.s`). A line-count comparison of Linux-only files shows riscv64 (2821 lines) within about 3 percent of amd64 (2906) and larger than arm64 (2751) - no sign of a thin or partial port.

**Component table:**

| Component | amd64 | arm64 | riscv64 | ISA extensions involved |
|---|---|---|---|---|
| Seccomp architecture mapping | Full | Full | Full | None (audit-arch constant only) |
| `exeseal` self-exe sealing | Full (n/a per-arch) | Full (n/a per-arch) | Full (n/a per-arch) | None - pure Go/overlayfs |
| Dynamic PIE build | Full | Full | Full | None |
| Static PIE build | Full | Full | Missing (libc toolchain gap) | None |
| `nsexec.c` C shim | Full | Full | Full | None |
| Release binary (cross-compiled) | Full | Full | Full | None |
| CI test execution | Full | Full | Missing | N/A |

There is no JIT, SIMD, cryptography, GC barrier, or hand-written assembly in runc for any architecture, so there is no "partial (C intrinsics)" or "scalar fallback" tier applicable here.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go + GNU Make. No CMake, Meson, or autoconf anywhere in the repo.

**Minimum Go version:** `go.mod` at current HEAD (`97f76a9b`, VERSION `1.5.0-rc.1+dev`) requires **Go 1.26.0**.

**CGo requirement:** `CGO_ENABLED=1` is enforced for the `runc`, `static`, and `localunittest` Makefile targets, required for the `seccomp` build tag (libseccomp) and `libpathrs` build tag. Default build tags are `seccomp libpathrs`.

**Build tags (the Make-based equivalent of CMake `-DUSE_X=OFF`):**

| Build Tag | Feature | Default | Dependency |
|---|---|---|---|
| `seccomp` | syscall filtering | on | libseccomp |
| `libpathrs` | path-safety via Rust lib | on | libpathrs >=0.2.5 |
| `runc_nocriu` | disables checkpoint/restore | off (CRIU support included by default) | CRIU |

**Cross-compilation toolchain for riscv64** (from `Dockerfile` and `script/lib.sh::set_cross_vars()`):
```
C compiler:    gcc-riscv64-linux-gnu  (Debian/Ubuntu cross package)
Host triple:   riscv64-linux-gnu  (HOST=riscv64-${PLATFORM})
CC:            riscv64-linux-gnu-gcc
STRIP:         riscv64-linux-gnu-strip
Rust target:   riscv64gc-unknown-linux-gnu
Rust linker:   riscv64-linux-gnu-gcc
Rust stdlib:   libstd-rust-dev:riscv64
```
No minimum GCC/Clang version is pinned specifically for riscv64; it uses whatever `gcc-riscv64-linux-gnu` ships in the Dockerfile's base image, `golang:1.26-trixie` (Debian 13).

**Dockerfile (root, the only Docker build file, used for dev/CI/release across all 8 release architectures):** adds `riscv64` via `dpkg --add-architecture riscv64`, installs `gcc-riscv64-linux-gnu libc-dev-riscv64-cross libstd-rust-dev:riscv64`, and cross-builds `libseccomp` (pinned 2.6.1) and `libpathrs` (pinned 0.2.6) for riscv64 among `RELEASE_ARCHES="386 amd64 arm64 armel armhf ppc64le riscv64 s390x"` via `script/build-seccomp.sh` / `script/build-libpathrs.sh`.

**Release build commands:**
```bash
make releaseall   # RELEASE_ARGS = "-a 386 -a amd64 -a arm64 -a armel -a armhf -a ppc64le -a riscv64 -a s390x"
# per-arch: script/release_build.sh -a riscv64
#   -> set_cross_vars riscv64
#   -> make PKG_CONFIG_PATH=... CC=riscv64-linux-gnu-gcc static
```
Native (on-device) build:
```bash
apt update && apt install -y make gcc linux-libc-dev libseccomp-dev pkg-config git
make
sudo make install
```

**QEMU usage:** None anywhere in the build system or CI (`grep -i qemu .github/workflows/` returns zero matches). The release pipeline is cross-compile only, with no execution step.

**Known build issues:**
- Static PIE is unavailable for riscv64 due to the `GO_BUILDMODE_STATIC` Makefile gate (`arm64`/`amd64` only) - riscv64 uses non-static-PIE linking for `make static`.
- [Issue #3950](https://github.com/opencontainers/runc/issues/3950): `make static` does not produce a statically linked binary on musl hosts since v1.1.8; a 2023-09-26 comment names the riscv64 1.1.x backport (PR #3905) as a probable contributing factor via an `LDFLAGS_STATIC` flag typo (`--static-pie` vs `-static-pie`); fixed on main (PR #3746) but not folded back into the 1.1.x backport at merge time. Does not affect official release binaries, which are built in a controlled glibc environment. Still open as of its last recorded update.
- Commit `6b757b6` (2026-02-03): "dockerfile: switch to Debian 13 (needed for riscv64 repo access to build libpathrs)" - a concrete, riscv64-specific build fix confirming the toolchain required active maintenance to keep riscv64 cross-building libpathrs successfully.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

runc is a narrow-purpose binary (spawn/manage Linux containers per the OCI Runtime Spec), so the gap analysis is short.

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Container run/exec/kill | Full | Full | Full | Core Go path, arch-agnostic |
| Seccomp filtering | Full | Full | Full | `SCMP_ARCH_RISCV64` + `AUDIT_ARCH_RISCV64` fully wired |
| cgroup v1/v2 | Full | Full | Full | Pure Go + kernel syscalls |
| Namespace creation | Full | Full | Full | `nsexec.c` is arch-agnostic |
| SELinux labeling | Full | Full | Full | `opencontainers/selinux` cross-builds for riscv64 |
| Checkpoint/restore (CRIU) | Full | Full | Blocked (optional feature) | CRIU C library riscv64 port merged Oct 2024 (v4.2), but CRIU's own riscv64 CI is blocked on a missing `libnftables-dev` package ([criu#2714](https://github.com/checkpoint-restore/criu/issues/2714), open) |
| Static PIE binary | Full | Full | Missing | libc toolchain gap (`rcrt1.o`), not a runc code gap; dynamic PIE is available |
| CI-validated release | Yes | Yes | No | riscv64 binary cross-compiled, never executed/tested in CI before release |
| Integration test execution | Yes | Yes | No | riscv64 busybox test image exists in the test fixture but no CI job runs it |

**Performance gaps:** No SIMD, JIT, or cryptographic code exists in runc, so no performance gap from missing ISA extensions is possible by construction.

**Security hardening:** Dynamic PIE is available on riscv64; static PIE is not. For deployments specifically requiring a fully static, position-independent binary, riscv64 is weaker than amd64/arm64 - a libc/toolchain limitation, not a runc-code limitation.

**Floating-point/NaN semantics:** Not applicable - runc has no numeric compute code.

## 7. CI/CD Infrastructure

All four GitHub Actions workflow files were read in full against commit `97f76a9b` (2026-09-28): `test.yml`, `scheduled.yml`, `validate.yml`, `actionlint.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

```
$ grep -rni "riscv" .github/workflows/*.yml
(zero matches in all four files)
```

**What does exist:** `validate.yml`'s `release` job (triggered on `push` to `main`/`release-*`/tags, `pull_request`, `merge_group`, and `workflow_dispatch` - essentially every PR and push) runs `make releaseall`, which passes `-a riscv64` (among seven other architectures) to `script/release_build.sh` inside a Docker container on an `ubuntu-24.04` (x86_64) runner, cross-compiling a static `runc.riscv64` binary that is uploaded as a build artifact. **This step contains no `run`/`exec`/test invocation of the binaries it produces** - riscv64 enters CI only as one flag in a Makefile variable, never as a runner, a QEMU job, or a test-matrix entry.

- **`test.yml`** (the actual unit/integration test workflow): `os` matrix is `[ubuntu-24.04, ubuntu-24.04-arm, ubuntu-26.04, ubuntu-26.04-arm]`. The only non-native cross-arch job is `cross-i386` (native multilib gcc, not QEMU; a comment in the file states "we do not have 32-bit ARM CI"). There is no riscv64 job and no `busybox` string anywhere in this file - the riscv64 busybox integration-test image added by PR #4842/#5295 lives only in `tests/integration/get-images.sh`, a fixture that is not invoked by any riscv64-executing CI job.
- **`scheduled.yml`:** cron dispatcher for `validate.yml`/`test.yml` on `main` and release branches; zero riscv references.
- **`actionlint.yml`:** lints the workflow YAML itself; zero riscv references.

**RISE runners:** RISE provides RISC-V GitHub Actions runners (Scaleway EM-RV1 bare-metal nodes, Kubernetes-orchestrated, Docker-in-Docker support, announced March 2026, ~13,000 jobs/197 repos/87 orgs by its "six weeks in" report in May 2026). runc's CI does not use them, and no public detail confirms RISE runner infrastructure uses runc specifically as its container engine. No RISE blog post mentions runc by name.

**Contextual note:** Issue #5166 (opened/closed 2026-03-12) asked specifically for a riscv64 CI job. It was closed the same day once the reporter confirmed release binaries already existed - the closure resolved the (mistaken) concern about missing binaries, but the stated CI-testing request itself was never implemented and remains open in substance.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | `ubuntu-24.04`/`-26.04` | `ubuntu-24.04-arm`/`-26.04-arm` | None |
| QEMU emulation in CI | No | No | No |
| Cross-compile-only CI presence | n/a | n/a | Yes, inside `make releaseall` |
| Integration/unit tests executed | Yes | Yes | No |
| Release binary CI-built | Yes | Yes | Yes (never tested) |
| Scheduled CI run | Yes | Yes | No |

## 8. Distribution and Release Status

**Official upstream GitHub release binaries:** riscv64 is a first-class target in the `Makefile`'s `releaseall` target (`-a riscv64` among 8 architectures). Recent tags: v1.5.2 (latest, 2026-09-25), v1.5.1, v1.5.0, 1.5.0-rc.3, 1.4.3, 1.3.6, v1.5.0-rc.2, v1.4.2, v1.3.5, v1.5.0-rc.1. **Directly verified via HTTP** at v1.5.2: `https://github.com/opencontainers/runc/releases/download/v1.5.2/runc.riscv64` returns a 302 redirect to a signed Azure blob, then `200 OK`, `Content-Length: 8478016` (8.4MB), `Content-Disposition: attachment; filename=runc.riscv64`, `Last-Modified` consistent with the release date; a negative-control request for a nonexistent asset name at the same tag cleanly returned `404`, confirming the check is not a false positive. This has been continuously true release after release since v1.2.0/v1.1.8 (2022-2023).

**Linux distribution packages:**

| Distro | Suite | Version | riscv64 available |
|---|---|---|---|
| Ubuntu | resolute (26.04 LTS) | 1.4.0-0ubuntu1 | Yes - confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/resolute/runc), architecture list `amd64 arm64 armhf ppc64el riscv64 s390x`; a `runc-stable` variant also exists |
| Debian | trixie / sid | 1.1.15+ds1-2+b4 / 1.3.5+ds1-1 | Yes [NEEDS VERIFICATION - not reconfirmed this research cycle] |
| Ubuntu | jammy-updates / noble-updates | 1.3.4-0ubuntu1 variants | Yes [NEEDS VERIFICATION - not reconfirmed this research cycle] |
| Alpine | edge | 1.4.2-r2 | Yes [NEEDS VERIFICATION - not reconfirmed this research cycle] |
| Arch Linux RISC-V mirror | - | - | Inconclusive - the mirror's homepage appears to be a static page with no live package-search endpoint found; neither confirmed nor refuted |

**PyPI / RISE GitLab PyPI proxy:** No PyPI package named `runc` exists at all (`https://pypi.org/pypi/runc/json` and `https://pypi.org/simple/runc/` both return `404`). This is expected - runc is a Go binary, not a Python package - and the riscv64 question does not apply to this channel. The RISE GitLab wheel-builder proxy simply redirects to the same (empty) upstream PyPI result, and `runc` is not among the 86 packages listed at the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/).

**What a user must do to get a working riscv64 binary:** Download `runc.riscv64` from the [GitHub releases page](https://github.com/opencontainers/runc/releases), `chmod +x`, and place it in `$PATH` - no compilation required. Alternatively, install via `apt` on Ubuntu 26.04 "resolute" (confirmed) or Debian trixie+/Alpine edge [NEEDS VERIFICATION].

## 9. Dependencies

runc is pure Go apart from CGo bindings to libseccomp and (optionally) libpathrs. Its dependency tree has no JIT, SIMD, or numeric-compute components - the dependency-risk surface is almost entirely about whether each dependency's own toolchain and CI cross-compile cleanly for riscv64.

| Dependency | Relation / criticality | Role | riscv64 status |
|---|---|---|---|
| Go | build-dependency, critical | Entire build toolchain; `go.mod` currently requires Go 1.26.0 | Full - `GOARCH=riscv64` supported since Go 1.16; foundational to every riscv64 enablement step since 2019 |
| GNU make | build-dependency, critical | Orchestrates all build/release targets (`make`, `make static`, `make releaseall`) | Full - arch-agnostic, no riscv64-specific issue |
| GCC | build-dependency, critical | CGo C compiler; riscv64 cross builds use the `gcc-riscv64-linux-gnu` Debian/Ubuntu cross package | Full - confirmed present and used in the official `Dockerfile` |
| Rust | build-dependency, optional | Only needed to build `libpathrs` (on by default via the `libpathrs` build tag); Rust 1.63+ required | Full - riscv64 target `riscv64gc-unknown-linux-gnu` via `libstd-rust-dev:riscv64`, confirmed in `Dockerfile` and `script/build-libpathrs.sh` |
| libseccomp | runtime-dependency, critical | C library for syscall filtering, linked via CGo | Full since v2.5.0 (2021); CI Dockerfile cross-builds libseccomp 2.6.1 for riscv64 via `script/build-seccomp.sh`. riscv64 testing only partial upstream (libseccomp issue #290 notes some skipped tests); issue #327 is riscv32-only, not riscv64 |
| libseccomp-golang | runtime-dependency, critical | Go/CGo bindings to libseccomp | Full - `ArchRISCV64` fully wired into `StringToArch`/`ArchToString`/`C_ARCH_RISCV64` in the vendored source, same shape as every other architecture constant; riscv64-related upstream issues closed |
| opencontainers/runtime-spec | runtime-dependency, critical | OCI runtime spec definitions, including the seccomp architecture table | Full - vendored; `docs/spec-conformance.md` lists `riscv64` to `SCMP_ARCH_RISCV64` |
| opencontainers/cgroups | runtime-dependency, critical | cgroup v1/v2 management | Full (pure Go, arch-agnostic); no known riscv64 issues |
| opencontainers/selinux | runtime-dependency, optional | SELinux label management | Full (pure Go cross-build); no riscv64-specific issues. Unrelated open bug [#5048](https://github.com/opencontainers/runc/issues/5048) ("runc selinux library use 100% cpu," opened 2025-11-27, references [opencontainers/selinux#247](https://github.com/opencontainers/selinux/issues/247)) affects all architectures, not riscv64 specifically |
| libpathrs | runtime-dependency, optional | Rust library providing safe path resolution via `openat2` (Linux 5.6+) | Full - cross-built with cargo targeting `riscv64gc-unknown-linux-gnu`; pinned at v0.2.6 in the current Dockerfile; zero riscv64 issues found |
| CRIU | runtime-dependency, optional | Checkpoint/restore support (Go bindings `checkpoint-restore/go-criu`, feature on by default unless `runc_nocriu` build tag is set) | Blocked for CI only: CRIU's C library riscv64 port merged October 2024 (v4.2), but CRIU's own riscv64 CI Dockerfile is missing `libnftables-dev` ([criu#2714](https://github.com/checkpoint-restore/criu/issues/2714), open), and CRIU tracking issue #1702 ("Support for RISC-V") remains open. This affects only the optional checkpoint/restore feature, not core run/exec/kill |
| golang.org/x/sys | runtime-dependency, critical | Linux syscall wrapper layer | Full - complete riscv64 syscall table (`syscall_linux_riscv64.go`, `zerrors`, `zsyscall`, `zsysnum`, `ztypes`, `asm_linux_riscv64.s`), line count on par with tier-1 architectures (2821 lines vs. amd64's 2906); foundational since the 2019 PR |
| vishvananda/netlink | runtime-dependency, optional | Network interface/route management | Full (pure Go); no known riscv64 issues |
| vishvananda/netns | runtime-dependency, optional | Network namespace handling | Full (pure Go); no known riscv64 issues |
| moby/sys | runtime-dependency, optional | Capability/mount/userns helper packages | Full (pure Go); no known riscv64 issues |
| coreos/go-systemd | runtime-dependency, optional | systemd D-Bus integration | Full (pure Go); no known riscv64 issues |
| busybox | test-dependency, critical | Integration-test rootfs image | Image updated for riscv64 in `tests/integration/get-images.sh` by PR #4842 (merged 2025-09-27, shipped v1.5.0-rc.1) and PR #5295 (merged 2026-05-27, not yet in a tagged release as of v1.5.2). Exists as a test fixture only - not exercised by any CI job, since no riscv64 runner or QEMU step runs integration tests for that architecture |

**Additional indirect dependency found via research (not in the direct-dependency list but surfaced in `go.mod` and cgroups' dependency chain):** `cilium/ebpf` - eBPF program loading; riscv64 support issue (#1110) closed in 2023; no material open riscv64 issues.

**Note on verification path:** the project's graph database (`project-graph` MCP) could not be queried in this research cycle due to a persistent connection failure (`CONNECTION_CLOSED`); the Ubuntu 26.04/PyPI checks above were instead performed via direct live HTTP fetches as a fallback. This should be retried against the graph database once that server is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3950](https://github.com/opencontainers/runc/issues/3950) | Build does not produce statically linked binary on musl hosts | Open | Medium | Affects `make static` since v1.1.8; a 2023-09-26 comment names the riscv64 1.1.x backport (PR #3905) as a probable contributing cause via an `LDFLAGS_STATIC` flag typo. Does not affect official release binaries (built in a controlled glibc environment) |
| [Issue #5166](https://github.com/opencontainers/runc/issues/5166) | Add linux/riscv64 to CI and release artifacts | Closed, CI gap unaddressed | Medium | Opened and closed same day, 2026-03-12. Closed once the reporter confirmed release binaries already exist; the CI-testing request itself was never implemented |
| [CRIU Issue #2714](https://github.com/checkpoint-restore/criu/issues/2714) | riscv64 CI Dockerfile missing `libnftables-dev` | Open (upstream CRIU, not runc) | Low | Affects runc only for the optional checkpoint/restore feature |

**Generic (non-riscv-specific) open issues surfaced by targeted riscv64-bug searches, included for completeness since they affect every architecture including riscv64:**

| Issue | Title | State | Opened | Detail |
|---|---|---|---|---|
| [#3181](https://github.com/opencontainers/runc/issues/3181) | runc exec is 5x slower than crun exec | Open | 2021-08-25 | 1000x `runc exec` loop: real 20.726s (user 11.635s, sys 14.094s) vs. 1000x `crun exec`: real 4.802s (user 2.634s, sys 2.283s) |
| [#1430](https://github.com/opencontainers/runc/issues/1430) | Extremely slow `runc exec` performance and hanging | Open | 2017-05-02 | Zombie processes, hangs under concurrent `runc exec` |
| [#5048](https://github.com/opencontainers/runc/issues/5048) | runc selinux library use 100% cpu | Open | 2025-11-27 | References [opencontainers/selinux#247](https://github.com/opencontainers/selinux/issues/247) |

Targeted searches specifically for open riscv64 bugs (`riscv64 repo:opencontainers/runc is:open`, `riscv nan floating repo:opencontainers/runc`) both returned **zero results**. There is no open riscv64-specific correctness or performance bug in the tracker.

## 12. Objections and Upstream Blockers

**No stated technical objections** to riscv64 support exist anywhere in the upstream issue tracker or PR review history. Maintainers merged riscv64 enablement work (PR #3446, PR #3905) without pushback; the only review friction found in any riscv64-adjacent PR was a licensing objection on PR #4024 (fuweid flagged importing GPL-2.0-licensed kernel `nolibc` header code into the Apache-2.0 project; resolved by dropping the GPL-2.0 Makefile component and keeping MIT-licensed headers verbatim) - and that entire subsystem (`runc-dmz`) has since been deleted and replaced by the architecture-agnostic `exeseal` package (Section 4), so even that friction point no longer exists in the current codebase.

**Organizational gap - CI:** Issue #5166 was closed same-day in March 2026 once its stated concern (missing release binaries) turned out to be false; the CI-testing request it also contained was never acted on. This is an absence of prioritization, not an active objection.

**Acceptance probability for a dedicated riscv64 CI PR:** Likely high. The codebase is already architecture-agnostic enough that riscv64 required fewer than a dozen lines of architecture-specific code; maintainers have repeatedly and readily merged outside contributors' architecture-enabling patches (carlosedp in 2019, chazapis in 2023); and the #5166 exchange was friendly and fast. The practical obstacle is availability of an actual riscv64 execution environment in CI - either a riscv64 GitHub Actions runner (RISE has offered these publicly since March 2026, though no evidence runc maintainers have evaluated them) or an acceptably fast QEMU path, which the project has never used for any architecture.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** All four upstream GitHub Actions workflow files ([test.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/test.yml), [scheduled.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/scheduled.yml), [validate.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/validate.yml), actionlint.yml) were confirmed to contain zero riscv/riscv64 references - no native runner, no QEMU step, no riscv64 build/test job - so there is no CI build or test execution for riscv64. However, upstream itself (not a distro or RISE) ships a `runc.riscv64` release binary with every release via its own Dockerfile/Makefile cross-compilation pipeline (`releaseall` target), confirmed continuously present since v1.2.0/v1.1.8 through the current v1.5.2, and reaffirmed when [Issue #5166](https://github.com/opencontainers/runc/issues/5166) (asking for riscv64 CI/release artifacts) was closed as moot because the binaries already ship. This is a "build step exists (upstream's own release pipeline), no test execution" pattern: yellow, not orange, because the artifact is upstream-published and reliably produced release after release, not merely a downstream/distro repackaging.
- **Pending work that could change the grade:** Issue #5166 (opened 2026-03-12, closed same day) asked for a dedicated riscv64 CI job; it was closed as moot (release artifacts already exist) without adding CI test coverage, so the CI gap remains open and unaddressed. No RISE involvement with runc was found (not a RISE member, no RISE blog posts, no RISE-funded work). The optional CRIU checkpoint/restore feature on riscv64 is blocked by an open upstream CRIU CI issue (missing `libnftables-dev`, [criu#2714](https://github.com/checkpoint-restore/criu/issues/2714)), which affects only that optional feature, not core run/exec/kill.

## 14. Investment Analysis

RISE has not funded any runc work (confirmed: not a RISE member, no RISE blog content mentions runc, no `riseproject-dev` GitHub org repo relates to runc, `runc` is absent from the RISE Python wheel-builder's 86-package list - not directly relevant to a Go project in any case). All riscv64 work to date was contributed by individual developers (carlosedp, chazapis, gounthar) and by Red Hat/NTT maintainers during ordinary project maintenance.

### 14.1 Functional Enablement

The core runc runtime (run/exec/kill/pause/resume) is fully functional on riscv64 with no identified functional gaps for standard container workloads. The only functional gap is CRIU checkpoint/restore, blocked by CRIU's own CI issue (missing `libnftables-dev`) - that work item belongs to the CRIU project, not runc.

### 14.2 Performance Optimization

runc has no architecture-specific performance code - no JIT, SIMD, or cryptographic primitive, and no hot numeric path. Container startup latency is dominated by kernel namespace/cgroup operations, which are architecture-agnostic. No performance investment is possible or warranted within runc itself. One academic data point exists - Lumpp et al., "On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing" (ESAAM 2023), using a SiFive U740-based cluster vs. a power-matched ARM64 Jetson Xavier - which found riscv64 containerization overhead comparable to or smaller than ARM64 on CPU/memory/application benchmarks, but a notably larger relative overhead on OS/syscall-heavy operations (context-switching overhead measured at 21.4% on riscv64 vs. 0.26-0.3% on ARM64, root-caused via `perf` to syscalls taking up to 40% longer under containerization). This is attributed to immature riscv64 syscall/context-switch performance generally, not to any specific runc code gap, and is a single academic source [NEEDS VERIFICATION] rather than a vendor- or RISE-produced benchmark.

### 14.3 CI/CD Infrastructure

This is the only material gap and the only area where investment changes the readiness grade. The work is well-scoped: add a riscv64 execution job to `.github/workflows/test.yml` using either a RISE RISC-V runner or QEMU-based emulation, and formally close the gap Issue #5166 identified but did not resolve. The riscv64 busybox integration-test fixture already exists in `tests/integration/get-images.sh` (PR #4842/#5295); the delta is a CI YAML job plus a runner/emulation choice.

### 14.4 Ecosystem Enablement

Not applicable. runc has no dependent package ecosystem (no PyPI, npm, or Maven consumers of "runc" itself) that would require separate riscv64 enablement; confirmed no PyPI package named `runc` exists at all.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 execution job to `test.yml` (RISE runner or QEMU binfmt) | 1 | runc maintainers or RISE | High |
| CI/CD | Reopen or re-file a PR against Issue #5166's unaddressed CI request | 0.5 | Any contributor | High |
| Functional | CRIU riscv64 CI fix (missing `libnftables-dev`, criu#2714) | 0.5 | CRIU project, not runc | Medium |
| Build | Static PIE for riscv64 (requires `rcrt1.o` in the riscv64 libc toolchain) | 2-4 (toolchain work, not runc) | glibc/musl upstream | Low |

## 15. References

- [PR #2123 - Bump x/sys and update syscall for initial Risc-V support (merged 2019-09-04)](https://github.com/opencontainers/runc/pull/2123)
- [PR #3446 - release: build riscv64 binary, build static PIE if supported (merged 2022-05-19)](https://github.com/opencontainers/runc/pull/3446)
- [PR #3463 - Build runc.riscv64 (closed 2022-04-30, superseded by #3446)](https://github.com/opencontainers/runc/pull/3463)
- [PR #3905 - [1.1] Backport riscv64 support into 1.1.x (merged 2023-06-28)](https://github.com/opencontainers/runc/pull/3905)
- [PR #4024 - libct/dmz: Reduce the binary size using nolibc (merged 2023-09-26)](https://github.com/opencontainers/runc/pull/4024)
- [PR #4026 - libct/dmz: Reduce the binary size by removing libc dependency (closed, unmerged)](https://github.com/opencontainers/runc/pull/4026)
- [PR #4063 - Bump golang.org/x/sys from 0.12.0 to 0.13.0 (merged 2023-10-06)](https://github.com/opencontainers/runc/pull/4063)
- [PR #4842 - Update busybox:glibc integration tests to latest builds (merged 2025-09-27)](https://github.com/opencontainers/runc/pull/4842)
- [PR #5295 - Update busybox:glibc integration tests to latest (1.38.0) builds (merged 2026-05-27)](https://github.com/opencontainers/runc/pull/5295)
- [Issue #3950 - Build does not produce statically linked binary on musl hosts](https://github.com/opencontainers/runc/issues/3950)
- [Issue #4037 - Support compiling on MIPS](https://github.com/opencontainers/runc/issues/4037)
- [Issue #5166 - Add linux/riscv64 to CI and release artifacts (2026-03-12)](https://github.com/opencontainers/runc/issues/5166)
- [Issue #3181 - runc exec is 5x slower than crun exec](https://github.com/opencontainers/runc/issues/3181)
- [Issue #1430 - Extremely slow runc exec performance and hanging](https://github.com/opencontainers/runc/issues/1430)
- [Issue #5048 - runc selinux library use 100% cpu](https://github.com/opencontainers/runc/issues/5048)
- [runc v1.5.2 release](https://github.com/opencontainers/runc/releases/tag/v1.5.2)
- [opencontainers/runc Makefile](https://raw.githubusercontent.com/opencontainers/runc/main/Makefile)
- [opencontainers/runc Dockerfile](https://raw.githubusercontent.com/opencontainers/runc/main/Dockerfile)
- [opencontainers/runc script/lib.sh](https://raw.githubusercontent.com/opencontainers/runc/main/script/lib.sh)
- [opencontainers/runc script/build-libpathrs.sh](https://raw.githubusercontent.com/opencontainers/runc/main/script/build-libpathrs.sh)
- [opencontainers/runc .github/workflows/test.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/test.yml)
- [opencontainers/runc .github/workflows/validate.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/validate.yml)
- [opencontainers/runc .github/workflows/scheduled.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/scheduled.yml)
- [Ubuntu resolute runc package](https://packages.ubuntu.com/resolute/runc)
- [CRIU Issue #2714 - riscv64 CI Dockerfile missing libnftables-dev](https://github.com/checkpoint-restore/criu/issues/2714)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE RISC-V Runners: six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing (ESAAM 2023)](https://cris.unibo.it/retrieve/976f8d03-98e3-4565-b2c4-a921e6561322/3624486.3624490.pdf)
- [Open Container Initiative](https://opencontainers.org/)