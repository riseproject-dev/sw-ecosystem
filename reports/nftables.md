---
title: nftables
---

# nftables

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for nftables (google/nftables Go library)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/nftables](https://github.com/google/nftables) is a pure-Go library (v0.3.0, approximately 1,354 stars) that provides a programmatic API for managing Linux nftables firewall rules via the kernel's netlink interface. It does not wrap the C nftables userspace tool (`libnftables`); it communicates directly with the kernel's `nf_tables` subsystem through raw netlink sockets.

**Important scope clarification:** Two distinct projects share the "nftables" name and must not be conflated:

1. **google/nftables** - the Go library that is the subject of this report. Hosted at `https://github.com/google/nftables`. Carries the disclaimer "This is not an official Google product."
2. **nftables (C userspace tool)** - the official netfilter.org tool (`nft`, `libnftables`), maintained by the Netfilter Core Team under Pablo Neira Ayuso. Packaged in Debian/Ubuntu/Fedora. This project has a separate codebase and is not the scope here, though distribution package status for the C tool is cited where relevant.

**Governance:** google/nftables has no formal foundation membership or governance model. Contributions require signing Google's CLA (via cla.developers.google.com). No OWNERS, CODEOWNERS, or MAINTAINERS file exists. All submissions require GitHub PR review.

**Corporate maintainers by commit count:**
- stapelberg (Michael Stapelberg): 58 commits, original author, initial commit 2018-05-25
- sbezverk: 42 commits, affiliated with Cisco Systems
- turekt: 28 commits, no company listed
- nickgarlis (Nick Garlis): 20 commits, affiliated with Tise
- aojea (Antonio Ojea): 3 commits, most recent active maintainer (2026-04-30 fix)

**Community culture on new ports:** The CONTRIBUTING.md states only "Contributions are very welcome!" with no architecture-specific guidance. Because the library uses generic Linux netlink syscalls via `golang.org/x/sys/unix` with no architecture-gated code paths, RISC-V support is implicit wherever the Go toolchain and Linux kernel nftables subsystem operate. No explicit porting work is required or expected.

**RISE Project involvement:** None. No RISE blog posts, funded projects, runner usage, or affiliated repositories for nftables were found in any source.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2018-05-25 | Initial commit by stapelberg; pure-Go design means riscv64 is supported by language default from day one | [github.com/google/nftables](https://github.com/google/nftables/commits/main) |
| 2022-03-28 | Issue #148 ("Riscv64 support") opened and closed same day; misfiled report against the wrong project | [Issue #148](https://github.com/google/nftables/issues/148) |
| (no date) | No riscv64-specific commits, issues, or PRs have ever existed in this repository | Full commit scan, 279 commits |

**Key contributors:** No contributor has specifically worked on riscv64 enablement, because no such work was needed. The library's architecture portability derives entirely from Go's standard cross-compilation support.

**Fully upstream:** Yes, by construction. There is no downstream riscv64 patch set.

---

## 3. Upstream Support Tier

google/nftables has no documented tier or platform support policy. The `compat_policy.go` file covers xtables/nftables compatibility semantics only, not architecture tiers.

In practice, riscv64 is a first-class target through Go's toolchain: `GOARCH=riscv64` has been supported since Go 1.14, and the library's `go.mod` requires Go >= 1.23.0, which fully supports riscv64. No explicit statement of architecture support tiers exists in the repository.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Builds with `go build ./...` | Yes | Yes | Yes |
| CI tested upstream | Yes | No | No |
| Official binary release | No (library only) | No | No |
| Distro package (C nftables tool) | Yes | Yes | Yes (Debian, Ubuntu) |
| Architecture-specific code paths | None | None | None |

CI runs only on `ubuntu-latest` (x86_64). Neither arm64 nor riscv64 has any CI coverage.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

google/nftables is a pure-Go netlink library. It contains no JIT backend, no SIMD dispatch, no assembly files, no C extensions, and no architecture-specific optimizations of any kind.

The only component that touches platform-specific characteristics is `alignedbuff/alignedbuff.go`, which uses `unsafe.Alignof` and `unsafe.Sizeof` at compile time to derive platform-native alignment masks (`uint32AlignMask`, `uintSize`). The Go compiler resolves these to correct riscv64 values when building with `GOARCH=riscv64`. No TODOs, FIXMEs, stubs, or "not implemented" guards exist in the codebase.

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Core netlink API | Full | Full | Full | Pure Go, no arch code |
| alignedbuff alignment | Full | Full | Full | `unsafe.Alignof` is arch-correct by construction |
| JIT backend | N/A | N/A | N/A | Not applicable; this is a userspace library |
| SIMD / vector ops | N/A | N/A | N/A | Not applicable |
| Assembly optimizations | None | None | None | No `.S` files in repo |
| ISA extension use (RVV, Zba, etc.) | N/A | N/A | N/A | Not applicable |

**Kernel-side note (out of scope for this library, included for completeness):** The Linux kernel `arch/riscv/net/` directory contains a full 64-bit BPF JIT (`bpf_jit_comp64.c`, 2,183 lines). This JIT supports atomics, trampolines, CFI, and load-acquire/store-release. Known limitation: 1- and 2-byte read-modify-write atomics are unsupported on the RISC-V BPF JIT (logs `pr_err_once`). The kernel's `nf_tables_core.c` contains an x86-only retpoline optimization (`cpu_feature_enabled(X86_FEATURE_RETPOLINE)`) that does not exist for RISC-V, meaning riscv64 uses the generic indirect-call path. These kernel-side characteristics are relevant to packet processing throughput but are not attributable to google/nftables itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

google/nftables uses the standard Go module build system. There is no CMake, no autotools, no Makefile, no C compiler dependency, and no Dockerfile.

**Build commands for riscv64:**

```bash
GOOS=linux GOARCH=riscv64 go build ./...
GOOS=linux GOARCH=riscv64 go test -c ./...
```

No additional flags, toolchain files, or cross-compilation configuration are needed. The Go toolchain handles riscv64 natively.

**Minimum toolchain version:** Go 1.23.0 (from `go.mod`). Go has supported `GOARCH=riscv64` since Go 1.14; 1.23.0 is a stable and well-tested riscv64 release.

**QEMU usage:** No QEMU configuration exists in the repository. The test suite (`nftables_test.go`, `integration/nft_test.go`) uses a `-run_system_tests` flag and requires `sudo` plus a live Linux kernel with `CONFIG_NF_TABLES=y`. Running system tests on riscv64 requires either native riscv64 hardware or `qemu-system-riscv64` full-system emulation with an appropriate kernel. No automation for either exists in the repository.

**Known build failures on riscv64:** None. No build failures have been reported.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| nftables rule creation/deletion | Full | Full | Full | None |
| Set and map management | Full | Full | Full (with byte-order caveat) | See issue #123 / PR #355 below |
| Chain and table management | Full | Full | Full | None |
| Counter and quota objects | Full | Full | Full | None |
| Flowtable support | Full | Full | Full | None |
| Integration/system tests in CI | Yes | No | No | CI gap only |

**Functional gaps:** None architecture-specific. The byte-order bug in set key metadata (issue #123, PR #355) affects all little-endian architectures including amd64, arm64, and riscv64 equally. It is not a riscv64-specific regression.

**Performance gaps:** No RISC-V-specific benchmark data exists. A binary size anomaly in the Debian-packaged C nftables tool (not the Go library) shows the riscv64 binary at 181.0 kB vs. arm64 at 229.0 kB [NEEDS VERIFICATION of the cause]; this likely reflects the absence of architecture-specific optimization paths in the C tool rather than a functional gap, and is not attributable to the Go library.

**Security hardening gaps:** The kernel-side retpoline optimization for x86 is absent on riscv64 (as noted in Section 4). This is a kernel concern, not a library concern.

**Floating-point and NaN semantics:** Not applicable. google/nftables performs no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

The sole CI file in the repository is [.github/workflows/push.yml](https://github.com/google/nftables/blob/main/.github/workflows/push.yml). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

The workflow triggers on `push` and `pull_request` to `main`. It runs `gofmt`, `go vet`, and `go test` on a single `ubuntu-latest` (x86_64) runner with `go-version: ^1.20`. There is no matrix strategy, no QEMU setup, no `linux/riscv64` Docker platform, and no `GOARCH=riscv64` environment variable.

**RISE runners:** None. RISE Project involvement with this project is zero.

| CI criterion | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Unit tests run | Yes | No | No |
| System/integration tests run | No (requires sudo + kernel) | No | No |
| `go vet` / `gofmt` | Yes | No | No |
| QEMU emulation | No | No | No |
| Cross-compilation check | No | No | No |
| Hardware runner | GitHub hosted | None | None |

The riscv64 CI gap is a testing-coverage deficit, not an indication of functional failure. The pure-Go codebase has no architecture-conditional code to fail.

---

## 8. Distribution and Release Status

**github.com/google/nftables binary releases:** Zero. `gh api repos/google/nftables/releases` returns `[]`. The repository ships source only; consumers import the Go module directly.

**PyPI:** No `nftables` package exists on PyPI ([pypi.org/pypi/nftables/json](https://pypi.org/pypi/nftables/json) returns HTTP 404). This channel is not applicable.

**Distro packages (C nftables tool, not the Go library):**

| Distro | Version | riscv64 status | Source |
|--------|---------|----------------|--------|
| Debian sid | 1.1.6-1+b1 | Installed (builder: rv-osuosl-05) | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=nftables&suite=sid) |
| Debian trixie | 1.1.3-1 | Present | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=nftables) |
| Ubuntu 24.04 Noble | Available | riscv64 listed as supported arch | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=nftables&suite=noble) [NEEDS VERIFICATION - not re-fetched during research] |
| Arch Linux RISC-V | Unknown | Not confirmed from available sources | archriscv.felixc.at returned no package table |

**What a user must do to get a working binary (Go library):** Add `github.com/google/nftables` to `go.mod`, then cross-compile with `GOOS=linux GOARCH=riscv64 go build`. No additional steps required.

---

## 9. Dependencies

All dependencies of google/nftables are pure-Go libraries. None contain JIT backends, SIMD dispatch, assembly optimizations, or native-code crypto/compression components. All build cleanly with `GOARCH=riscv64`.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| [mdlayher/netlink](https://github.com/mdlayher/netlink) v1.11.2 | Netlink socket I/O | Builds cleanly | Not tested in CI | v1.11.2 tagged | None |
| [vishvananda/netlink](https://github.com/vishvananda/netlink) v1.3.1 | Higher-level Linux networking API | Builds cleanly | Not tested in CI | v1.3.1 tagged | None |
| [vishvananda/netns](https://github.com/vishvananda/netns) v0.0.5 | Linux network namespace management | Builds cleanly | Not tested in CI | v0.0.5 tagged | None |
| [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys) v0.35.0 | Low-level Linux syscall bindings | Full riscv64 support: `syscall_linux_riscv64.go`, `ztypes_linux_riscv64.go` present | Tested as part of Go toolchain CI | Continuous releases | None |
| [mdlayher/socket](https://github.com/mdlayher/socket) v0.6.1 | Generic socket primitives (indirect) | Pure Go, no arch-specific code | Not tested in CI | v0.6.1 tagged | None |
| [golang.org/x/net](https://pkg.go.dev/golang.org/x/net) v0.43.0 | Network protocol support (indirect) | Pure Go | Part of Go toolchain CI | Continuous releases | None |
| [golang.org/x/sync](https://pkg.go.dev/golang.org/x/sync) v0.6.0 | Concurrency primitives (indirect) | Pure Go | Part of Go toolchain CI | v0.6.0 released | None |
| [google/go-cmp](https://github.com/google/go-cmp) v0.7.0 | Test-only: deep equality | Pure Go | Not tested on riscv64 | v0.7.0 released | None |

`golang.org/x/sys` is the critical dependency. It provides riscv64 syscall tables (`zsyscall_linux_riscv64.go`, `ztypes_linux_riscv64.go`) and has been riscv64-complete since Go 1.14. No second- or third-level dependencies introduce native code or arch-specific concerns.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#123](https://github.com/google/nftables/issues/123) | Userdata in sets always set key to big endian | Open (since May 17, 2021) | Medium | Anonymous/constant/interval sets hardcode `NFTNL_UDATA_SET_KEYBYTEORDER=2` (big-endian) regardless of actual data type; affects display and round-trip correctness on all little-endian architectures including riscv64 |
| [#148](https://github.com/google/nftables/issues/148) | Riscv64 support | Closed (2022-03-28) | N/A | Misfiled: reporter confused this Go library with the C nftables project; maintainer redirected immediately |
| [#210](https://github.com/google/nftables/issues/210) | Test failures on s390x: endianness problems? | Open (since Dec 10, 2022) | Low (riscv64 not affected) | Byte-pair swapping in netlink attribute headers on s390x (big-endian); riscv64 is little-endian and is not directly affected |
| [#305](https://github.com/google/nftables/issues/305) | FlushSet is unreliable, occasionally elements remain in set | Open (since Mar 7, 2025) | Medium | Labels: bug, help wanted; platform-agnostic race/reliability issue; not architecture-specific |

**Open PRs relevant to riscv64:**

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| [#355](https://github.com/google/nftables/pull/355) | set: fix byte order metadata for host-endian types and map data | Open (opened Feb 11, 2026; approved by nickgarlis Feb 23, 2026; not merged) | Fixes two bugs: anonymous sets ignoring explicit `KeyByteOrder` and maps never emitting `DATABYTEORDER` TLV; display/round-trip bugs on little-endian systems including riscv64; referenced in issue #360 as a release blocker |
| [#218](https://github.com/google/nftables/pull/218) | Resolving test failures on BE systems (Draft) | Draft, stalled (opened Mar 13, 2023) | Targets s390x big-endian issue #210; single participant, no review activity; does not affect riscv64 |

**Correctness bugs specifically affecting riscv64 (little-endian):** Issue #123 and its fix PR #355 represent the only active correctness issue relevant to riscv64 usage. The bug causes incorrect display and round-trip behavior when reading set element values stored with little-endian byte order. PR #355 is approved but has stalled awaiting merge by maintainer stapelberg.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has stated objections to riscv64 support.

**Technical blockers:** None. The library requires no architecture-specific enablement work. It builds and runs on riscv64 Linux today with standard Go cross-compilation.

**Organizational blockers:** None identified. The project accepts contributions with Google CLA signing. No architecture-specific review barrier exists.

**Acceptance probability for riscv64-related contributions:** High. The project's CONTRIBUTING.md explicitly welcomes contributions. Because no architecture-specific code exists, a contribution adding riscv64 CI (e.g., a QEMU-backed GitHub Actions matrix entry) would be a low-risk, self-contained change.

**Pending merge blocker:** PR #355 (byte-order fix, approved Feb 23, 2026) remains unmerged. The maintainer (stapelberg) is the sole merge authority with no clear activity timeline. This is a correctness bug affecting all little-endian users, not a riscv64-specific blocker.

---

## 13. Investment Analysis

RISE Project has no prior involvement with this project. No work has been done or funded by RISE. The project requires no investment for functional enablement - it already works on riscv64 by design.

### 13.1 Functional Enablement

No functional enablement work is needed. google/nftables is a pure-Go library with no architecture-specific code. It builds and runs correctly on riscv64 Linux today.

The only correctness gap is the unmerged PR #355 (byte-order metadata in sets). This is a maintainer responsiveness issue, not a technical gap. A consumer requiring the fix today can vendor the patched code.

### 13.2 Performance Optimization

No performance optimization work is warranted for this library. google/nftables is a control-plane API library that manages firewall rule configuration; it is not in the packet-forwarding data path. Throughput is determined by the kernel's nftables subsystem and BPF JIT, not by this Go library.

Data not available: no RISC-V-specific nftables (C tool) benchmark data exists in any public source. Any performance characterization of nftables packet processing on riscv64 hardware would require original measurement.

### 13.3 CI/CD Infrastructure

The single actionable investment opportunity is adding riscv64 CI coverage. Currently, zero non-x86_64 architectures are tested. A QEMU-backed GitHub Actions matrix entry for riscv64 would provide ongoing correctness assurance.

Effort is low: the test suite already runs under `go test` with `sudo`. The primary challenge is that system tests require a live kernel with `CONFIG_NF_TABLES=y`, which requires full-system QEMU emulation rather than simple `GOARCH=riscv64` cross-compilation. The RISE Project's riscv64 build farm (Scaleway, OSU OSL) could potentially serve as a hardware test runner.

### 13.4 Ecosystem Enablement

Not applicable. This is a Go library with no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| CI/CD | Add riscv64 CI job (QEMU or hardware runner, `go test -run_system_tests`) | 1-2 | Upstream contributor + RISE infra | Low |
| Functional | Chase merge of PR #355 (byte-order fix, already approved) | 0.5 (follow-up only) | Contributor outreach | Medium |
| Performance | Baseline nftables throughput benchmarks on riscv64 hardware (kernel/C tool, not Go library) | 3-5 | Independent measurement | Low |

Total investment is minimal. This project does not represent a meaningful RISC-V investment opportunity because it already works. The only actionable items are CI coverage and one pending merge.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/nftables repository](https://github.com/google/nftables)
- [Issue #148 - Riscv64 support (misfiled, closed 2022-03-28)](https://github.com/google/nftables/issues/148)
- [Issue #123 - Userdata in sets always set key to big endian](https://github.com/google/nftables/issues/123)
- [Issue #210 - Test failures on s390x: endianness problems?](https://github.com/google/nftables/issues/210)
- [Issue #305 - FlushSet is unreliable, occasionally elements remain in set](https://github.com/google/nftables/issues/305)
- [PR #355 - set: fix byte order metadata for host-endian types and map data](https://github.com/google/nftables/pull/355)
- [PR #218 - Resolving test failures on BE systems (Draft)](https://github.com/google/nftables/pull/218)
- [CI workflow: .github/workflows/push.yml](https://github.com/google/nftables/blob/main/.github/workflows/push.yml)
- [Debian buildd tracker for nftables](https://buildd.debian.org/status/package.php?p=nftables&suite=sid)
- [Ubuntu packages: nftables (Noble)](https://packages.ubuntu.com/search?keywords=nftables&suite=noble)
- [golang.org/x/sys riscv64 syscall support](https://pkg.go.dev/golang.org/x/sys)
- [RISE Project member list](https://riseproject.dev)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)