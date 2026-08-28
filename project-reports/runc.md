---
title: runc
parent: Project Reports
categories:
  - containers
---

# runc
**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for runc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

runc is the OCI reference implementation of the container Runtime Specification. It is the low-level container runtime that underlies Docker, containerd, Podman, and Kubernetes (via the Container Runtime Interface). It is written primarily in Go with a thin C shim (`nsexec.c`) for namespace setup and CGo for seccomp (libseccomp) and safe path resolution (libpathrs).

**Governance:** The [Open Container Initiative (OCI)](https://opencontainers.org/) under The Linux Foundation. A Technical Oversight Board of 8 members on staggered 2-year terms governs cross-project decisions (2/3 supermajority required). runc is the reference implementation of the OCI Runtime Spec.

**Corporate sponsors:** Alibaba Cloud, AWS, Google, Microsoft, IBM, Cisco, Huawei, Red Hat, Docker, Chainguard, Sysdig, Goldman Sachs, EasyStack. TOB Chair is Samuel Karp (Google).

**Maintainers (from MAINTAINERS file):**

| Maintainer | GitHub | Company |
|---|---|---|
| Mrunal Patel | @mrunalp | Red Hat |
| Aleksa Sarai | @cyphar | Amutable Systems |
| Akihiro Suda | @AkihiroSuda | NTT |
| Kir Kolyshkin | @kolyshkin | Red Hat |
| Sebastiaan van Stijn | @thaJeztah | Docker |
| Li Fu Bang | @lifubang | ACMCoder |
| Rodrigo Campos | @rata | Amutable Systems |

**Culture on new ports:** The project accepts architecture-enabling patches passively. The initial RISC-V syscall stub (2019) was accompanied by an explicit disclaimer that riscv64 was not a supported build target. The April 2022 Makefile fix carried a similar disclaimer. No dedicated RISC-V tracking issue was ever opened by maintainers; the riscv64 features landed via three separate focused PRs from three separate contributors over four years. No formal platform tier policy document exists.

**RISE membership:** runc and OCI are not listed as RISE Project members. RISE uses runc as a standard Ubuntu apt dependency in its RISC-V GitHub Actions runner Dockerfile but has no funded work, blog posts, or contribution activity targeting runc itself.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main `opencontainers/runc` repository on GitHub.

| Date | Event | Source |
|---|---|---|
| 2019-09-04 | First riscv64 commit: bumped `golang.org/x/sys`, added syscall stubs enabling downstream Go builds (Kubernetes, K3s). Author noted runc itself "still can't be built" on riscv64 due to CGo. | [PR #2123](https://github.com/opencontainers/runc/pull/2123) |
| 2022-04-01 | Makefile: added `linux/riscv64` to the `-buildmode=pie` supported-platform allowlist (Go 1.16+). Commit message note: "this does not mean we support these architectures." | [PR #3446](https://github.com/opencontainers/runc/pull/3446) commit ab5c60d |
| 2022-04-30 | Prototype PR to build `runc.riscv64` and bump libseccomp-golang for `SCMP_ARCH_RISCV64`. Tested on QEMU and HiFive Unmatched real hardware. Closed as superseded. | [PR #3463](https://github.com/opencontainers/runc/pull/3463) |
| 2022-05-19 | Foundational enablement merged (milestone 1.2.0): riscv64 added to release binaries, seccomp `AUDIT_ARCH_RISCV64` constant added, `-buildmode=pie` allowlist confirmed. Co-authored by kolyshkin and AkihiroSuda. | [PR #3446](https://github.com/opencontainers/runc/pull/3446) |
| 2023-06-28 | riscv64 support backported to `release-1.1` (milestone v1.1.8) via cherry-pick. Verified by author on QEMU riscv64 running K3s with Pod creation confirmed. | [PR #3905](https://github.com/opencontainers/runc/pull/3905) |
| 2023-09-26 | `libct/dmz` binary replaced libc with kernel nolibc headers (shrinks runc-dmz from 636K to 8K). riscv64 listed as a supported arch for Linux 6.6 nolibc. | [PR #4024](https://github.com/opencontainers/runc/pull/4024) |
| 2025-09-27 | Integration test image (busybox:glibc 1.37.0) updated; riscv64 added to test image matrix, mips64le dropped. | [PR #4842](https://github.com/opencontainers/runc/pull/4842) |
| 2026-03-12 | Issue requesting riscv64 added to CI and release artifacts, citing 117+ community releases. Closed without a linked PR and without maintainer engagement. | [Issue #5166](https://github.com/opencontainers/runc/issues/5166) |
| 2026-05-27 | Test image updated to BusyBox 1.38.0; riscv64 remains in matrix. | [PR #5295](https://github.com/opencontainers/runc/pull/5295) |
| 2026-06-19 | runc v1.5.0 released with `runc.riscv64` and `runc.riscv64.asc` in official release assets. | [v1.5.0 release](https://github.com/opencontainers/runc/releases/tag/v1.5.0) |

**Key contributors to RISC-V work:**

| Contributor | Affiliation | Contribution |
|---|---|---|
| carlosedp (Carlos de Paula) | Independent | First syscall stubs (PR #2123, 2019) |
| kolyshkin (Kir Kolyshkin) | Red Hat | Foundational riscv64 release enablement (PR #3446, 2022) |
| AkihiroSuda | NTT | Co-author and merger of PR #3446; merger of backport |
| crazy-max | Independent | Confirmed `-buildmode=pie` valid on riscv64; real-hardware seccomp test on HiFive Unmatched |
| chazapis | Independent | 1.1.x backport motivated by K3s on RISC-V (PR #3905, 2023) |
| rata (Rodrigo Campos) | Amutable Systems/Microsoft | nolibc dmz optimization supporting riscv64 (PR #4024, 2023) |
| tianon | Independent | Test image riscv64 matrix addition (PR #4842, 2025) |

---

## 3. Upstream Support Tier

No formal platform tier policy document (e.g., PLATFORMS.md) exists for runc. The following table is derived from CI configuration and release artifact evidence.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes (`ubuntu-24.04`) | Yes (`ubuntu-24.04-arm`) | No |
| QEMU CI emulation | No | No | No |
| Cross-compile CI | Yes (i386 only as proxy) | N/A (native) | No |
| Release binary | Yes (`runc.amd64`) | Yes (`runc.arm64`) | Yes (`runc.riscv64`) since v1.2.0 (2022) |
| Release binary signed | Yes | Yes | Yes |
| Static PIE supported | Yes | Yes | No (only dynamic PIE) |
| Integration test image | Yes | Yes | Yes (busybox image exists; never executed in CI) |
| Debian package | Yes | Yes | Yes (sid/trixie) |
| Ubuntu package | Yes | Yes | Yes (ports) |

**Summary:** riscv64 is a release target with first-class binary artifacts but a second-class CI posture. Release binaries are cross-compiled and shipped but never tested in the upstream CI pipeline before release.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

runc contains no JIT, no SIMD, no cryptography, and no numeric compute code. It is pure Go with a thin C shim. Architecture-specific work is limited to three areas: seccomp BPF filter constants, PIE build mode, and the `nsexec.c` C shim.

**Seccomp BPF filter constants**

`libcontainer/seccomp/patchbpf/enosys_linux.go` maps libseccomp architecture enums to Linux audit architecture constants used in BPF bytecode generation. riscv64 is handled identically to all other supported architectures:

- `#define AUDIT_ARCH_RISCV64 (EM_RISCV|__AUDIT_ARCH_64BIT|__AUDIT_ARCH_LE)` with `EM_RISCV = 243`, with a `#ifndef` guard for older kernel headers.
- CGo export: `const uint32_t C_AUDIT_ARCH_RISCV64 = AUDIT_ARCH_RISCV64;`
- Go case: `case libseccomp.ArchRISCV64: return linuxAuditArch(C.C_AUDIT_ARCH_RISCV64), nil`

`libcontainer/seccomp/config.go` maps the OCI spec string `SCMP_ARCH_RISCV64` to the Go arch string `riscv64`. No special-case logic beyond the standard map entry.

**PIE build mode**

riscv64 is in the dynamic PIE allowlist in the `Makefile`:
```makefile
ifneq (,$(filter $(GOARCH),386 amd64 arm arm64 loong64 ppc64le riscv64 s390x))
  GO_BUILDMODE := "-buildmode=pie"
```

Static PIE (`-buildmode=pie -static-pie`) is supported only for amd64 and arm64 due to `rcrt1.o` availability in libc. riscv64 uses non-PIE static linkage (`-extldflags -static`) for static builds. This is a libc gap, not a runc gap.

**nsexec.c C shim**

`libcontainer/nsenter/nsexec.c` uses standard POSIX and Linux syscalls (`clone`, `setns`, `unshare`, `fork`). It contains zero `#ifdef __riscv` guards. It is architecture-agnostic by design.

**Component table:**

| Component | amd64 | arm64 | riscv64 | ISA extensions |
|---|---|---|---|---|
| Seccomp arch mapping | Full | Full | Full | None |
| Seccomp ENOSYS BPF stub | Full | Full | Full | None |
| Dynamic PIE build | Full | Full | Full | None |
| Static PIE build | Full | Full | Missing (libc gap) | None |
| nsexec.c C shim | Full | Full | Full | None |
| Release binary | Full | Full | Full | None |
| CI test coverage | Full | Full | Missing | N/A |

There is no JIT, SIMD, crypto, GC barrier, or assembly code in runc for any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go + GNU Make. No CMake, no Meson, no autoconf.

**Minimum Go version:** 1.25.0 (specified in `go.mod`).

**CGo requirement:** `CGO_ENABLED=1` is enforced for the `runc`, `static`, and `localunittest` Makefile targets. CGo is required for libseccomp integration (with the `seccomp` build tag) and for libpathrs integration (with the `libpathrs` build tag).

**Cross-compilation toolchain for riscv64 (from `Dockerfile` and `script/lib.sh`):**

```
C compiler:    gcc-riscv64-linux-gnu (Debian/Ubuntu)
Host triple:   riscv64-linux-gnu
Rust target:   riscv64gc-unknown-linux-gnu
Rust stdlib:   libstd-rust-dev:riscv64
```

**Required Debian/Ubuntu packages for riscv64 cross-build:**
```
gcc-riscv64-linux-gnu
libc-dev-riscv64-cross
libstd-rust-dev:riscv64
```

**Dependencies that must be cross-compiled from source:**

- **libseccomp** (v2.6.0, LGPL requires source inclusion): cross-built with `./configure --host riscv64-linux-gnu` via `script/build-seccomp.sh`.
- **libpathrs** (v0.2.5, Rust): cross-built with `cargo` targeting `riscv64gc-unknown-linux-gnu`, linker set to `riscv64-linux-gnu-gcc`.

**Cross-compile static release binary (from x86_64 host):**
```bash
export GOARCH=riscv64
export CC=riscv64-linux-gnu-gcc
export CGO_ENABLED=1
make static
```

**QEMU:** Not used anywhere in the build system or CI. The release pipeline is cross-compile only.

**Known build issue:** PR #3905 introduced a typo in `LDFLAGS_STATIC` (`--static-pie` with double-dash instead of `-static-pie` with single-dash). This caused broken static linking on musl hosts. Fixed in PR #3746 on main but the fix was not included in the 1.1.x backport at merge time. Fixed separately. See also Issue #3950 (Section 11).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

runc is a narrow-purpose binary: spawn and manage Linux containers. Its feature set is defined by the OCI Runtime Spec, not by architecture-specific optimizations. The gap analysis is therefore short.

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Container run/exec/kill | Full | Full | Full | Core Go path, arch-agnostic |
| Seccomp filtering | Full | Full | Full | SCMP_ARCH_RISCV64 + AUDIT_ARCH_RISCV64 present |
| cgroup v1/v2 | Full | Full | Full | Pure Go + kernel syscalls |
| Namespace creation | Full | Full | Full | nsexec.c is arch-agnostic |
| SELinux labeling | Full | Full | Full | opencontainers/selinux cross-builds riscv64 |
| Checkpoint/restore (CRIU) | Full | Full | Partial | CRIU C library riscv64 port merged Oct 2024 (v4.2); CI Dockerfile missing `libnftables-dev` (Issue #2714 open); tracking issue #1702 open |
| Static PIE binary | Full | Full | Missing | rcrt1.o unavailable on riscv64 libc; dynamic PIE available |
| CI-gated release | Full | Full | Missing | riscv64 binary cross-compiled, not CI-tested before release |
| Integration test execution | Full | Full | Missing | busybox test image exists for riscv64 but no CI runner to execute it |

**Performance gaps:** No SIMD, JIT, or cryptographic code exists in runc. No performance gap is possible from missing ISA extensions.

**Security hardening:** Static PIE is unavailable for riscv64 (dynamic PIE is available). For deployments requiring a fully position-independent static binary, riscv64 is weaker than amd64/arm64. This is a libc toolchain limitation, not a runc limitation.

---

## 7. CI/CD Infrastructure

All three GitHub Actions workflow files in `.github/workflows/` were read directly. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists (all return 404).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | `ubuntu-24.04` | `ubuntu-24.04-arm` | None |
| QEMU emulation in CI | No | No | No |
| Cross-compile test in CI | i386 (GOARCH=386) | N/A | No |
| Integration tests in CI | Yes | Yes | No |
| Unit tests in CI | Yes | Yes | No |
| Release binary CI-gated | Yes | Yes | No |
| Scheduled CI run | Yes | Yes | No |

**`test.yml`:** Runs on `ubuntu-24.04` and `ubuntu-24.04-arm`. Cross-compilation target: i386 only (`GOARCH=386`). Zero occurrences of "riscv" in the file.

**`validate.yml`:** Runs on `ubuntu-24.04` only. Zero occurrences of "riscv".

**`scheduled.yml`:** Cron-triggered dispatcher for `test.yml` and `validate.yml` on main and `release-1.3`. Zero occurrences of "riscv".

**RISE runners:** RISE provides RISC-V GitHub Actions runners (announced March 2026, "Six Weeks In" report May 2026). runc's CI does not use them. No RISE blog post mentions runc specifically. RISE uses runc as a dependency in its own runner infrastructure (installed via apt) but has no contributions to runc's CI.

**Contextual note:** Issue #5166 (opened March 12, 2026, closed without resolution) explicitly requested adding riscv64 to CI. The issue was closed with no linked PR and no maintainer engagement visible on the page. The closure is unexplained. The busybox riscv64 test image added by PR #4842 (September 2025) has no effect without a riscv64 CI runner.

---

## 8. Distribution and Release Status

**Official upstream release binaries:**

riscv64 is a first-class target in the `Makefile` `releaseall` target (`-a riscv64` alongside 386, amd64, arm64, armel, armhf, ppc64le, s390x). Release assets for v1.5.0 (2026-06-19, latest) include `runc.riscv64` and `runc.riscv64.asc` (GPG signature). Binary confirmed downloadable at approximately 9.1 MB (ELF). This has been true since v1.2.0 (May 2022) and through v1.3.x (June 2023, after backport) and every subsequent release.

v1.1.0 did NOT include riscv64. Support was added to the 1.1.x branch via PR #3905, first appearing in v1.1.8 (July 2023).

**Linux distribution packages:**

| Distro | Suite | Version | riscv64 available |
|---|---|---|---|
| Debian | bookworm (stable) | 1.1.5+ds1-1+deb12u1 | No |
| Debian | trixie (testing) | 1.1.15+ds1-2+b4 | Yes |
| Debian | sid (unstable) | 1.3.5+ds1-1 | Yes -- built on `rv-manda-04`, status Installed |
| Ubuntu | jammy-updates | 1.3.4-0ubuntu1~22.04.1 | Yes |
| Ubuntu | noble-updates | 1.3.4-0ubuntu1~24.04.1 | Yes |
| Ubuntu | noble (ports) | 1.1.12-0ubuntu3 | Yes (older version than amd64 security stream) |
| Alpine | edge | 1.4.2-r2 | Yes (built 2026-05-13) |
| Arch Linux | extra | 1.5.0-1 | Not confirmed (page not fetchable via automated check) |

**What a user must do to get a working riscv64 binary:**

The simplest path is to download `runc.riscv64` from the [GitHub releases page](https://github.com/opencontainers/runc/releases), set execute permission, and place it in `$PATH`. No compilation required. Alternatively, install via the distribution package manager on Debian trixie/sid, Ubuntu 22.04+, or Alpine edge.

---

## 9. Dependencies

runc is pure Go except for CGo bindings to libseccomp and libpathrs. Its dependency tree has no JIT, SIMD, or numeric-compute components.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go runtime | Entire build toolchain | Yes, since Go 1.16 | CI covers amd64/arm64 only | Yes (GOARCH=riscv64) | None -- see `project-reports/go.md` |
| libseccomp (v2.6.0, C) | Syscall filtering via CGo | Yes, since v2.5.0 (2021) | Partial (issue #290 notes skipped tests) | v2.6.0 (2025-01-24) | #327 is riscv32 only; riscv64 fully supported |
| libseccomp-golang (v0.11.1) | Go bindings for libseccomp | Yes, since v0.9.2 | Yes | v0.11.1 (2025-08-05) | None; all riscv64 issues closed |
| opencontainers/runtime-spec (v1.3.0) | OCI runtime spec; seccomp arch table | Yes | Yes | v1.3.0 (2025-11-04) | None; SCMP_ARCH_RISCV64 added, issues #1059 and #1217 closed |
| opencontainers/cgroups (v0.0.6) | cgroup v1/v2 management | Yes (pure Go) | Unknown (no riscv64 CI found) | Yes | 0 open riscv64 issues |
| opencontainers/selinux (v1.15.1) | SELinux label management | Yes | Unknown | Yes (issue #201 closed) | None |
| checkpoint-restore/go-criu (v8.3.0) | Checkpoint/restore (optional) | Yes (Go bindings) | Blocked by CRIU C library | v8.3.0 (2026-06-15) | CRIU C library riscv64 port merged Oct 2024 (PR #2234, v4.2); CI Dockerfile missing `libnftables-dev` (issue #2714 open); tracking issue #1702 open |
| cilium/ebpf (v0.17.3, indirect) | eBPF program loading | Yes (issue #1110 closed 2023-08) | Unknown riscv64 CI | Yes | Minor: no riscv64 hardware CI runner |
| golang.org/x/sys (v0.46.0) | Linux syscall wrappers | Yes (issues #38, #40 closed) | Yes | Yes | None |
| vishvananda/netlink (v1.3.1) | Network interface/route | Yes (pure Go) | Unknown | Yes | 0 riscv64 issues |
| vishvananda/netns (v0.0.5) | Network namespaces | Yes (pure Go) | Unknown | Yes | 0 riscv64 issues |
| cyphar.com/go-pathrs (v0.2.5, Rust) | Safe path resolution via `openat2` | Yes | Unknown | Yes | 0 riscv64 issues; `openat2` available in Linux 5.6+ |
| moby/sys (multiple) | Capability/mount/user NS helpers | Yes (pure Go) | Unknown | Yes | 0 riscv64 issues |
| coreos/go-systemd (v22.7.0) | systemd D-Bus integration | Yes (pure Go) | Unknown | Yes | 0 riscv64 issues |

**CRIU deep-dive (only dependency with a material open issue):**

The CRIU C library riscv64 port was merged upstream in October 2024 (PR #2234) and tagged as v4.2. However, the riscv64 CI Dockerfile is missing the `libnftables-dev` package (issue #2714, open as of research date), preventing the riscv64 CI environment from building. Tracking issue #1702 ("Support for RISC-V") remains formally open. This affects only the optional `--checkpoint` feature of runc. Normal container run/exec/kill are unaffected.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3950](https://github.com/opencontainers/runc/issues/3950) | Build does not produce statically linked binary on musl hosts | Open | Medium | Affects `make static` since v1.1.8. A comment (2023-09-26) names PR #3905 (riscv64 1.1.x backport) as a probable contributing cause via the nsexec C code CGo linking change. No fix merged as of last update 2025-07-04. Does not affect official release binaries (built in a controlled glibc environment). |
| [Issue #5166](https://github.com/opencontainers/runc/issues/5166) | Add linux/riscv64 to CI and release artifacts | Closed, unresolved | Medium | Opened March 12, 2026. Requested riscv64 in CI and release pipeline. Release pipeline was already complete (releases since v1.2.0). CI gap was not addressed. Closed with no linked PR and no maintainer engagement. |
| CRIU [Issue #2714](https://github.com/criu/criu/issues/2714) | riscv64 CI Dockerfile missing libnftables-dev | Open (upstream CRIU) | Low | Affects runc only for the optional checkpoint/restore feature. CRIU v4.2 has riscv64 support; CI infrastructure is incomplete. |

No correctness bugs specific to riscv64 container execution (run/exec/kill) are open. The static-linking regression (#3950) is a build-system issue, not a runtime correctness issue.

---

## 12. Objections and Upstream Blockers

**No stated technical objections** to riscv64 support exist in the upstream issue tracker or PR review history. The maintainers merged riscv64 enablement work (PR #3446, PR #3905) without objection. The codebase is sufficiently architecture-agnostic (pure Go + thin C shim) that riscv64 required fewer than 10 lines of architecture-specific code.

**Organizational gap -- CI:** Issue #5166 was closed without resolution in March 2026. The maintainer response was silence. This is not an active objection but an absence of prioritization. The project's CI is limited to amd64 and arm64 with native GitHub-hosted runners. Adding riscv64 requires either: (a) a riscv64 GitHub Actions runner (RISE now provides these), or (b) QEMU emulation. Neither requires maintainer objection to be unblocked -- it requires a PR with a passing test run.

**Acceptance probability for a CI PR:** High. The work is well-defined (add a riscv64 job to `test.yml` using a RISE runner or QEMU), the code already compiles cleanly, and maintainers have demonstrated willingness to accept riscv64 patches. The primary risk is QEMU performance making test jobs too slow for maintainer tolerance.

---

## 13. Investment Analysis

RISE has not funded any runc work. All riscv64 work to date was contributed by individual developers (carlosedp, chazapis) and Red Hat/NTT maintainers during normal project maintenance.

### 13.1 Functional Enablement

The core runc runtime (run/exec/kill/pause/resume) is fully functional on riscv64. No functional gaps exist for standard container workloads. The only functional gap is CRIU checkpoint/restore, which is blocked on a missing `libnftables-dev` in the CRIU riscv64 CI Dockerfile (upstream CRIU issue #2714) -- that work belongs to the CRIU project, not runc.

### 13.2 Performance Optimization

runc has no architecture-specific performance code. There is no JIT, no SIMD, no cryptographic primitive, and no hot numeric path. Container startup latency is dominated by kernel namespace and cgroup operations, which are architecture-agnostic. No performance investment is warranted or possible within runc itself.

### 13.3 CI/CD Infrastructure

This is the only material gap. The work is well-scoped: add a riscv64 job to `.github/workflows/test.yml` using either a RISE RISC-V runner or QEMU via `docker buildx`/`binfmt_misc`. The busybox test image for riscv64 already exists (added PR #4842, September 2025). The integration test harness already supports riscv64 images. The delta is one CI YAML change and a runner.

### 13.4 Ecosystem Enablement

Not applicable. runc has no dependent package ecosystem that requires separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 job to test.yml (RISE runner or QEMU binfmt) | 1 | runc maintainers or RISE | High |
| CI/CD | Resolve Issue #5166 (reopen or submit PR directly) | 0.5 | Any contributor | High |
| Functional | CRIU riscv64 CI fix (missing libnftables-dev, CRIU issue #2714) | 0.5 | CRIU project | Medium |
| Build | Static PIE for riscv64 (requires rcrt1.o in riscv64 libc toolchain) | 2-4 (toolchain work, not runc) | glibc/musl upstream | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PR #2123 -- Bump x/sys: initial Risc-V support (2019-09-04)](https://github.com/opencontainers/runc/pull/2123)
- [PR #3446 -- release: build riscv64 binary, build static PIE if supported (2022-05-19)](https://github.com/opencontainers/runc/pull/3446)
- [PR #3463 -- Build runc.riscv64 (closed 2022-04-30, superseded by #3446)](https://github.com/opencontainers/runc/pull/3463)
- [PR #3905 -- [1.1] Backport riscv64 support into 1.1.x (2023-06-28)](https://github.com/opencontainers/runc/pull/3905)
- [PR #4024 -- libct/dmz: Reduce the binary size using nolibc (2023-09-26)](https://github.com/opencontainers/runc/pull/4024)
- [PR #4063 -- Bump golang.org/x/sys from 0.12.0 to 0.13.0 (2023-10-06)](https://github.com/opencontainers/runc/pull/4063)
- [PR #4842 -- Update busybox:glibc integration tests to 1.37.0 (2025-09-27)](https://github.com/opencontainers/runc/pull/4842)
- [PR #5295 -- Update busybox:glibc integration tests to 1.38.0 (2026-05-27)](https://github.com/opencontainers/runc/pull/5295)
- [Issue #3950 -- Build does not produce statically linked binary on musl hosts](https://github.com/opencontainers/runc/issues/3950)
- [Issue #5166 -- Add linux/riscv64 to CI and release artifacts (2026-03-12)](https://github.com/opencontainers/runc/issues/5166)
- [runc v1.5.0 release assets](https://github.com/opencontainers/runc/releases/tag/v1.5.0)
- [opencontainers/runc Makefile](https://raw.githubusercontent.com/opencontainers/runc/main/Makefile)
- [opencontainers/runc Dockerfile](https://raw.githubusercontent.com/opencontainers/runc/main/Dockerfile)
- [opencontainers/runc script/lib.sh](https://raw.githubusercontent.com/opencontainers/runc/main/script/lib.sh)
- [opencontainers/runc .github/workflows/test.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/test.yml)
- [opencontainers/runc .github/workflows/validate.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/validate.yml)
- [opencontainers/runc .github/workflows/scheduled.yml](https://raw.githubusercontent.com/opencontainers/runc/main/.github/workflows/scheduled.yml)
- [Debian sid runc buildd status](https://buildd.debian.org/status/package.php?p=runc&suite=sid)
- [Ubuntu noble runc package](https://packages.ubuntu.com/search?keywords=runc&suite=noble)
- [CRIU issue #2714 -- riscv64 CI Dockerfile missing libnftables-dev](https://github.com/checkpoint-restore/criu/issues/2714)
- [CRIU PR #2234 -- riscv64 C library port merged Oct 2024](https://github.com/checkpoint-restore/criu/pull/2234)
- [RISE Project blog](https://riseproject.dev/blog/)
- [Open Container Initiative](https://opencontainers.org/)