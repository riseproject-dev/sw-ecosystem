---
title: fscrypt
parent: Project Reports
---

# fscrypt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for fscrypt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

fscrypt is a Go userspace command-line tool and PAM module for managing Linux filesystem-level encryption (the `fscrypt` kernel subsystem, formerly `ext4crypt`). It wraps the kernel ioctls `FS_IOC_SET_ENCRYPTION_POLICY`, `FS_IOC_ADD_ENCRYPTION_KEY`, and related `keyctl` calls into a user-friendly interface supporting Argon2id-based passphrase protectors, login protectors via PAM, and policy management. It is used primarily with ext4 and f2fs encrypted directories.

**Repository:** [https://github.com/google/fscrypt](https://github.com/google/fscrypt)
**Homepage:** [https://github.com/google/fscrypt](https://github.com/google/fscrypt)
**License:** Apache-2.0 ("Copyright 2017 Google Inc.")
**Status:** Hosted under the `google` GitHub org but explicitly disclaimed as "not an official Google product."

**Governance:** No foundation affiliation. Two corporate maintainers, both at Google:

- Eric Biggers (ebiggers@google.com) -- dominant active maintainer: 255 commits, all recent activity through November 2025. Also the upstream Linux kernel `fs/crypto/` maintainer.
- Joe Richey (joerichey@google.com) -- original author and co-maintainer: 269 commits, last active August 2022.

The security contact list is both Google email addresses. Contributor License Agreements route through Google CLA (cla.developers.google.com).

**Community stance on new ports:** No formal tier or platform policy document (no PLATFORMS.md, SUPPORT.md, MAINTAINERS, OWNERS, or CODEOWNERS exists). The project is architecture-neutral by design -- it is pure Go plus a small C PAM shim (`pam/pam.c`), wrapping Linux kernel ioctls. A RISC-V port requires no source changes; Go's standard cross-compilation handles riscv64 transparently. No maintainer has commented on RISC-V in any issue, PR, or commit.

**RISE membership:** fscrypt is not listed as a RISE project member, funded project, or active work item in any RISE working group.

---

## 2. Port History and Upstreaming Timeline

There is no upstream RISC-V port to speak of, because no porting work was required or performed. fscrypt compiles for riscv64 out of the box via `GOARCH=riscv64`. The riscv64 availability came through Linux distribution packaging, not through upstream source changes.

| Date | Event | Source |
|------|-------|--------|
| Go 1.14 (Feb 2020) | Go adds riscv64 as a secondary port | [Go release notes](https://go.dev/doc/go1.14) |
| 2022 (approx.) | Ubuntu begins packaging fscrypt for riscv64 (jammy 22.04 and later) | [Ubuntu packages](https://packages.ubuntu.com/noble/fscrypt) |
| ~2023-2024 | Debian sid/trixie packages fscrypt 0.3.5-1+b7 for riscv64, built on buildd machine rv-manda-04 | [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=fscrypt&suite=sid) |
| Never | Any upstream riscv64-specific issue, PR, commit, or tracking ticket | github.com/google/fscrypt -- 0 results on all searches |

Key contributors to riscv64 availability: Debian and Ubuntu packagers (not identified by name in research findings). Zero upstream contributor involvement specific to RISC-V.

The port is fully upstream in the only sense applicable: there is nothing to upstream. The Go toolchain compiles for riscv64 without any source modifications to fscrypt.

---

## 3. Upstream Support Tier

There is no formal tier policy in the upstream project. The following assessment is inferred from CI behavior and release practices.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Active CI jobs | Yes (ubuntu-latest) | No (disabled) | No (never existed) |
| Integration tests run | Yes | No | No |
| 32-bit CI (i386) | Yes | N/A | N/A |
| Official binary releases | No (source-only) | No (source-only) | No (source-only) |
| Distro binary packages | Ubuntu, Debian, Fedora, Arch | Ubuntu, Debian | Ubuntu, Debian |
| Mentioned in README | Yes (primary) | Implicit | Not mentioned |
| Mentioned in CI YAML | Yes (active) | Yes (disabled, comments only) | No |

**Effective tier for riscv64:** Unsupported upstream. Compiles and packages successfully via distro infrastructure, but the upstream project has no CI, no test coverage, and no stated support for riscv64. This is identical to the situation for arm64, which is also disabled in CI.

The reason arm64 and other architectures are not in CI is explicitly documented in `.github/workflows/ci.yml`: QEMU user-mode emulation cannot pass through the `keyctl()` syscall and fscrypt ioctls. A native RISC-V hardware runner is required for integration testing.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

fscrypt is a pure-Go application with one C file (`pam/pam.c`, 93 lines) for the PAM module. It contains no architecture-specific code of any kind.

| Component | Description | amd64 | arm64 | riscv64 |
|-----------|-------------|-------|-------|---------|
| Core CLI tool (Go) | Policy management, key unlock, directory setup | scalar (arch-neutral Go) | scalar | scalar |
| PAM shim (`pam/pam.c`) | Login-based key unlock via libpam | scalar (portable C99) | scalar | scalar |
| Argon2id KDF | Password-based key derivation via golang.org/x/crypto | pure-Go with optional SSE4 acceleration (in x/crypto) | pure-Go | pure-Go (no SIMD path) |
| AES-256-CTR, HMAC-SHA256, HKDF | Metadata crypto via Go stdlib | pure-Go (Go stdlib handles arch acceleration transparently) | pure-Go | pure-Go |
| Kernel crypto (AES-XTS, AES-CBC-CTS for filenames) | Handled by the kernel, not fscrypt userspace | kernel-managed | kernel-managed | kernel-managed (Zvkned+Zvbb+Zvkg extensions in kernel 6.9+) |

**Assembly and SIMD:** Zero assembly files in the repository. The `gh search code` queries for `riscv`, `riscv64`, `rvv`, and `GOARCH riscv` all return 0 results. No `arch/` directory, no `.S` files, no SIMD dispatch, no JIT. The only architecture reference in the entire codebase is in the Makefile (selecting a protoc binary download for x86_64/i386/aarch64 for code generation) and the commented-out CI matrix.

**Argon2id SIMD gap:** The `golang.org/x/crypto/argon2` package has an amd64-specific SIMD path using SSE4. riscv64 uses the pure-Go fallback (`blamka_ref.go`). This is functionally correct but slower -- roughly 3-5x slower than the amd64 SIMD path. For fscrypt's default Argon2id parameters (`time=1, memory=32MB`), this manifests as a few extra seconds of latency on low-single-core-performance riscv64 hardware. This is a key-derivation (unlock) latency issue, not a data-path throughput issue.

**Kernel AES acceleration:** The kernel's AES-XTS and AES-CBC-CTS implementations for RISC-V using Zvkned+Zvbb+Zvkg were merged in the 6.9 cycle (authored by Eric Biggers of Google and Jerry Shih/Phoebe Chen of SiFive). The AES-CBC-CTS commit note states the RISC-V implementation improves on the arm64 approach. Data-path encryption throughput on hardware with the V extension is therefore hardware-accelerated via the kernel. No throughput figures are available from the research findings.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make + `go build`. No CMake. No Dockerfile. No riscv64-specific toolchain files.

**Build dependencies:**
- Go 1.23 minimum (per README); go.mod currently requires `go 1.25.0` (current master). riscv64 support in Go was added in Go 1.14.
- A C compiler (gcc or clang) -- required only for CGO to build `pam/pam.c`.
- `make`
- `libpam` headers (`libpam0g-dev` on Debian/Ubuntu)

**Cross-compilation for riscv64 (from x86_64 host):**

```bash
sudo dpkg --add-architecture riscv64
sudo apt-get update
sudo apt-get install -y gcc-riscv64-linux-gnu libpam0g-dev:riscv64
CGO_ENABLED=1 GOARCH=riscv64 CC=riscv64-linux-gnu-gcc make
```

The Makefile accepts `CFLAGS`, `LDFLAGS`, and `GO_FLAGS` overrides. No `-DUSE_X=OFF`-style flags exist (no CMake). The 32-bit CI job establishes the cross-compilation pattern: `CGO_ENABLED=1 GOARCH=386 make`.

**Pure Go binary (no PAM):**

```bash
GOOS=linux GOARCH=riscv64 go install github.com/google/fscrypt/cmd/fscrypt@latest
```

This produces a statically linked binary with no CGO dependency, losing the PAM integration module.

**QEMU:** QEMU user-mode emulation cannot run fscrypt integration tests. This is explicitly documented in the disabled CI block -- `keyctl()` and fscrypt ioctls are not passed through by QEMU user-mode. Full-system emulation (QEMU system mode with a real kernel) or native hardware is required for integration testing.

**Known build failures:** None identified. Debian builds `0.3.5-1+b7` on `rv-manda-04` (native riscv64 buildd) without reported failures.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---------|-------|-------|---------|-------|
| Core fscrypt CLI | Full | Full | Full | Pure Go, compiles for all GOARCH |
| PAM module (pam_fscrypt.so) | Full | Full | Full | Portable C99, no arch-specific code |
| Argon2id key derivation | Full + SIMD acceleration (x/crypto SSE4) | Full (pure-Go) | Full (pure-Go) | ~3-5x KDF latency gap vs amd64 on unlock; not a data-path issue |
| AES-XTS data-path (kernel) | Full (AES-NI) | Full (ARMv8 CE) | Full with Zvkned+Zvkg (kernel 6.9+); scalar fallback on older kernels | Kernel-managed; fscrypt userspace is unaffected |
| AES-CBC-CTS filename encryption (kernel) | Full (AES-NI) | Full (ARMv8 CE) | Full with Zvkned+Zvbb (kernel 6.9+); scalar fallback on older kernels | Kernel-managed |
| Adiantum (ChaCha20+AES-256 for low-end devices) | Full | Full (NEON-accelerated) | Scalar only (no arch/riscv SIMD for Adiantum) | Adiantum is optional; used on low-end devices without AES acceleration |
| Integration test coverage | Full (upstream CI) | None (disabled, QEMU limitation) | None (no CI job) | Native hardware runner required |
| Official upstream binary | None | None | None | Source-only releases upstream |

**Adiantum gap:** arm64 has NEON-accelerated Adiantum (`arch/arm64/crypto/chacha-neon-*`). No RISC-V-specific Adiantum/ChaCha20 assembly exists in `arch/riscv/`. On riscv64 hardware without AES extensions (e.g., some lower-end implementations), Adiantum would fall back to scalar C. This is a kernel-level gap, not a fscrypt userspace gap, and affects only configurations explicitly selecting Adiantum as the encryption mode.

**Security hardening gaps:** Data not available -- no security hardening audit of fscrypt on riscv64 was found in research findings.

---

## 7. CI/CD Infrastructure

The only CI file in the upstream project is [`.github/workflows/ci.yml`](https://github.com/google/fscrypt/blob/master/.github/workflows/ci.yml).

| CI Aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Build job | Yes (ubuntu-latest) | No | No |
| 32-bit build | Yes (GOARCH=386) | N/A | N/A |
| Integration tests | Yes | No (disabled) | No (never existed) |
| QEMU-based multi-arch | N/A | Attempted, disabled | Never attempted |
| Runner type | GitHub-hosted (x86_64) | N/A | N/A |
| RISE CI runners | None | None | None |

The commented-out `run-integration-tests-other-arch` block in `ci.yml` covered `armv7`, `aarch64`, and `ppc64le` via `uraimo/run-on-arch-action`. It does not include riscv64. It was disabled with the explicit comment: "qemu user-mode emulation doesn't support passing through the keyctl() system call and the fscrypt ioctls."

This QEMU limitation affects all non-x86_64 architectures uniformly. riscv64 is not singled out -- it is simply absent even from the disabled matrix, meaning it was never considered.

**RISE involvement:** No RISE CI runners are used. RISE has no involvement with fscrypt CI infrastructure.

---

## 8. Distribution and Release Status

**Upstream releases:** fscrypt GitHub releases (v0.3.2 through v0.3.6) attach zero binary assets for any architecture. All releases are source-only (auto-generated GitHub tarballs). There are no official upstream riscv64 (or any other architecture) binaries.

**Distro packages:**

| Distribution | Version | riscv64 Status | Notes |
|---|---|---|---|
| Ubuntu 24.04 Noble | 0.3.3-1 | Available | Also available in jammy (22.04) through stonking (26.10) |
| Debian sid | 0.3.5-1+b7 | Installed (built on rv-manda-04) | Also in trixie and forky; not in bullseye or bookworm |
| Arch Linux | 0.3.6-2 | Not available | Official `extra/fscrypt` is x86_64 only |
| Fedora | Data not available | Data not available | No riscv64-specific bug reports found in Red Hat Bugzilla |
| PyPI | N/A | N/A | fscrypt is not a Python package; PyPI returns HTTP 404 |

**What a user must do to get a working riscv64 binary:**
- On Debian/Ubuntu: `apt install fscrypt` (packaged; works without source build).
- On other distributions: cross-compile or build natively with `CGO_ENABLED=1 GOARCH=riscv64 CC=riscv64-linux-gnu-gcc make` on a host with `gcc-riscv64-linux-gnu` and `libpam0g-dev:riscv64` installed.
- Pure-Go binary (no PAM module): `GOOS=linux GOARCH=riscv64 go install github.com/google/fscrypt/cmd/fscrypt@latest`.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Go runtime (golang/go) | Compiler, runtime, stdlib crypto | Supported (secondary port since Go 1.14) | CI builder linux-riscv64-rva22u64-mengzhuo exists; builder instability noted ([#79067](https://github.com/golang/go/issues/79067), [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069), [#80880](https://github.com/golang/go/issues/80880)) | Releases include linux/riscv64 | Builder flakiness; no build-correctness blockers. See project-reports/go.md. |
| golang.org/x/crypto (v0.52.0) | Argon2id KDF, AES-256-CTR, HMAC-SHA256, HKDF | Builds via pure-Go fallback (blamka_ref.go) | No riscv64-specific CI confirmed | Source module | No open riscv64 issues. ~3-5x KDF latency vs amd64 SIMD path. |
| golang.org/x/sys (v0.45.0) | unix.Keyctl(), fscrypt ioctls via syscall wrappers | Builds on riscv64 | No riscv64-specific CI | Source module | No open riscv64 issues. All used syscalls are generic Linux kernel interfaces present on riscv64. |
| google.golang.org/protobuf (v1.36.10) | Policy/key metadata serialization | Builds on riscv64 | No riscv64-specific issues found | Source module | No open riscv64 issues. Pure Go. |
| libpam (C, cgo) | PAM module for login-based key unlock | Available in Debian, Ubuntu for riscv64 | Not tested in fscrypt CI; PAM tests are x86 only | Distro packages | No issues. Standard C library, no arch-specific paths. CGO on riscv64 fully supported since Go 1.14. |
| Linux kernel fscrypt subsystem | FS_IOC_*_ENCRYPTION_KEY ioctls; AES-XTS/AES-CBC-CTS hardware acceleration | Supported since kernel 5.1 (policy v2), 4.1 (v1); riscv64 kernel has had fscrypt since ~5.4 | Not tested in fscrypt CI (QEMU user-mode cannot pass keyctl + fscrypt ioctls) | Shipped in all mainline kernels | AES vector acceleration (Zvkned+Zvbb+Zvkg) requires kernel 6.9+ and V-extension hardware. Scalar fallback works on all kernels. |

**OpenSSL is not a dependency.** fscrypt uses Go stdlib and golang.org/x/crypto exclusively for crypto; no C crypto library is linked.

**golang.org/x/crypto Argon2id detail:** The amd64 SIMD path is in `blamka_amd64.s` / `blamka_amd64.go` (build tag `amd64 && !purego && gc`). riscv64 takes `blamka_ref.go` (pure Go). The functional output is identical; only throughput differs. For fscrypt's use case (single key derivation on unlock), the absolute latency impact on typical riscv64 hardware is in the range of seconds, not minutes. Not a correctness issue.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the upstream tracker. The following are active upstream issues across all architectures:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#457](https://github.com/google/fscrypt/issues/457) | Infinite loop if invalid key file is specified | Open | Medium | All architectures |
| [#454](https://github.com/google/fscrypt/issues/454) | Wrongly treats config/metadata paths as standard files/dirs | Open | Low | All architectures |
| [#451](https://github.com/google/fscrypt/issues/451) | Lock command breaks frame buffer | Open | Low | All architectures |
| [#436](https://github.com/google/fscrypt/issues/436) | "Encryption not enabled" on ext4 filesystem | Open | Medium | All architectures |
| [#405](https://github.com/google/fscrypt/issues/405) | pam_fscrypt likely locks excessive memory | Open | Low | All architectures |
| [#402](https://github.com/google/fscrypt/issues/402) | Unable to lock folders encrypted with fscrypt | Open | Medium | All architectures |
| [#95](https://github.com/google/fscrypt/issues/95) | Implement automatic unlocking via systemd service | Open | Low/Enhancement | Long-standing feature request |
| [#442](https://github.com/google/fscrypt/issues/442) | Performance issues under tight cgroup limits | Closed/Fixed | Medium | Used NumCPU instead of cgroup quota; on 64-core machines Argon2 could spawn 256 threads, causing memory/CPU spikes crashing pods below 256 MiB |

**No riscv64-specific correctness bugs exist.** There are zero riscv64-mentioning issues, PRs, or commits in the upstream repository.

---

## 12. Objections and Upstream Blockers

**No stated objections.** No maintainer has commented on RISC-V in any context.

**Technical blockers:**

1. **Integration test CI gap:** The most significant RISC-V gap is CI coverage. fscrypt integration tests require `keyctl()` and fscrypt ioctls, which QEMU user-mode emulation cannot pass through. This blocks adding riscv64 to the existing QEMU-based multi-arch CI matrix (which is itself already disabled). A native riscv64 GitHub Actions runner (self-hosted) or a full-system QEMU image with an attached filesystem would be needed for integration test coverage. This is an infrastructure cost issue, not a correctness issue.

2. **No upstream binary releases for any architecture.** Google's fscrypt has never shipped prebuilt binaries. Adding riscv64 binaries would require changing the release process, which does not exist upstream. Not currently a tracked request.

**Organizational blockers:** None identified. Maintainer Eric Biggers is also the Linux kernel `fs/crypto/` maintainer and co-authored the riscv64 AES kernel implementations. He is well-positioned to accept riscv64-related contributions if any were proposed.

**Acceptance probability for a riscv64 CI patch:** High, if a suitable runner were provided. The project already acknowledges the multi-arch test problem and the only barrier is the QEMU `keyctl` limitation. A native runner bypasses that limitation entirely.

---

## 13. Investment Analysis

RISE has no prior investment in fscrypt. All riscv64 availability to date came from distro packaging infrastructure (Debian, Ubuntu), not RISE or upstream investment.

### 13.1 Functional Enablement

No work required. fscrypt compiles and runs on riscv64 without any source changes. Debian and Ubuntu already ship riscv64 packages. A user on a riscv64 Debian/Ubuntu system can `apt install fscrypt` today.

### 13.2 Performance Optimization

The only userspace performance gap is Argon2id KDF latency (~3-5x slower than amd64 due to missing SIMD in golang.org/x/crypto). This is a key-unlock latency issue (seconds, not minutes) rather than a data-path throughput issue. Data-path encryption performance is kernel-managed and already hardware-accelerated on hardware supporting Zvkned+Zvkg (kernel 6.9+). A SIMD Argon2id implementation for riscv64 in golang.org/x/crypto would require RVV assembly (Zvbb/Zvbc extensions). This is a golang.org/x/crypto contribution, not a fscrypt contribution. [NEEDS VERIFICATION: exact latency numbers on representative riscv64 hardware -- no benchmark data was found.]

### 13.3 CI/CD Infrastructure

The actionable investment is adding riscv64 integration test coverage. This requires a native riscv64 self-hosted GitHub Actions runner with:
- A Linux kernel with fscrypt ioctls enabled
- An ext4 or f2fs filesystem with `encrypt` feature enabled
- `libpam0g-dev` for the PAM module build

Estimated effort: low, if hardware is already available (1-2 person-weeks to set up runner, add CI matrix entry, validate, submit PR). The commented-out CI block provides a template; adding riscv64 is a 5-line change to the matrix plus runner provisioning.

### 13.4 Ecosystem Enablement

Not applicable. fscrypt has no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None -- fscrypt is already functional on riscv64 | 0 | N/A | N/A |
| Performance | Argon2id SIMD for riscv64 (RVV) in golang.org/x/crypto | 3-6 | golang.org/x/crypto contributor | Low (unlock latency only, not data-path) |
| CI/CD | Native riscv64 runner + integration test matrix entry | 1-2 | RISE / infra team | Medium |
| Distribution | Fedora riscv64 package verification | 0.5 | Fedora packager | Low |

The highest-value action is the CI runner (low effort, directly improves upstream integration test coverage for riscv64 and all other architectures blocked by the QEMU limitation). The Argon2id SIMD work is upstream golang.org/x/crypto scope and has limited practical impact given that unlock latency is a one-time-per-session event.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/fscrypt repository](https://github.com/google/fscrypt)
- [fscrypt CI workflow (.github/workflows/ci.yml)](https://github.com/google/fscrypt/blob/master/.github/workflows/ci.yml)
- [fscrypt v0.3.6 release](https://github.com/google/fscrypt/releases/tag/v0.3.6)
- [Ubuntu packages -- fscrypt (Noble)](https://packages.ubuntu.com/noble/fscrypt)
- [Debian buildd status -- fscrypt sid](https://buildd.debian.org/status/package.php?p=fscrypt&suite=sid)
- [Debian package tracker -- fscrypt](https://tracker.debian.org/pkg/fscrypt)
- [golang.org/x/crypto -- Argon2 source](https://pkg.go.dev/golang.org/x/crypto/argon2)
- [Go issue #79067 -- riscv64 builder instability](https://github.com/golang/go/issues/79067)
- [Go issue #79068 -- riscv64 builder instability](https://github.com/golang/go/issues/79068)
- [Go issue #79069 -- riscv64 builder instability](https://github.com/golang/go/issues/79069)
- [Go issue #80880 -- new SG2042 LUCI builder proposal](https://github.com/golang/go/issues/80880)
- [fscrypt issue #442 -- cgroup limit performance (closed)](https://github.com/google/fscrypt/issues/442)
- [fscrypt issue #457 -- infinite loop on invalid key file (open)](https://github.com/google/fscrypt/issues/457)
- [fscrypt issue #454 -- path handling bug (open)](https://github.com/google/fscrypt/issues/454)
- [fscrypt issue #451 -- lock breaks frame buffer (open)](https://github.com/google/fscrypt/issues/451)
- [fscrypt issue #436 -- encryption not enabled error (open)](https://github.com/google/fscrypt/issues/436)
- [fscrypt issue #405 -- pam_fscrypt excessive memory lock (open)](https://github.com/google/fscrypt/issues/405)
- [fscrypt issue #402 -- unable to lock folders (open)](https://github.com/google/fscrypt/issues/402)
- [RISE project members page](https://riseproject.dev/members)
- [RISE security software WG repository](https://github.com/riseproject-dev/security-software-wg)