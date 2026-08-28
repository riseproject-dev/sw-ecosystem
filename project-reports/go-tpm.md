---
title: go-tpm
parent: Project Reports
---

# go-tpm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-tpm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[go-tpm](https://github.com/google/go-tpm) is a pure Go library for communicating with hardware Trusted Platform Module (TPM) devices. It supports TPM 1.2 (via the `/tpm/` subpackage) and TPM 2.0 (via the `/tpm2/` subpackage). On Linux it interfaces with `/dev/tpm0` or `/dev/tpmrm0`; on Windows it uses the TBS (TPM Base Services) API. The library contains no assembly, no CGo, and no C FFI in its core logic. It has 183 source files, all Go.

**License:** Apache-2.0.

**Governance:** Hosted under the `google` GitHub organization and explicitly labeled "not an official Google product." There is no foundation affiliation (no CNCF, Linux Foundation, OpenSSF, or equivalent). CODEOWNERS assigns global ownership to the `@google/go-tpm-admin` GitHub team with per-directory named maintainers:

- `@alexmwu` and `@jkl73` own the TPM 2.0 (`/tpm2/`) code (Google-affiliated).
- `@zaolin` (Binarly Inc.), `@flanfly` (Binarly Inc.), and `@ChriMarMe` (independent, u-root/system-transparency community) own the TPM 1.2 (`/tpm/`) code.

The TPM 1.2 component is in maintenance mode: no new features, no active Google maintainer. The TPM 2.0 `tpmDirect` API is actively developed. Issue creation is restricted (not open to all users). The most recent notable PR (PR #444, August 2026) adds a Google-internal MTD transport, reflecting primarily Google-internal engineering activity rather than broad community contributions.

**RISE membership:** Google is a Premier Member of the RISE project (RISC-V International Software Ecosystem). go-tpm itself has no direct RISE membership, working group participation, or RISE-funded work.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port of go-tpm has ever been required. The library is architecturally neutral by design: pure Go, no assembly, no C FFI, no GOARCH build tags. It compiles and runs on any Go-supported GOARCH without modification.

| Date | Event | Source |
|------|-------|--------|
| N/A | No riscv64-specific commits, issues, or PRs exist | [GitHub code/issue/PR search, 14 vectors, all returned 0 results](https://github.com/google/go-tpm) |
| 2024-01-05 | go-tpm-tools PR #407 "Add RISC V support" merged, enabling the Microsoft TPM2 Simulator to compile on riscv64 (simulator C headers only, not go-tpm core) | [google/go-tpm-tools PR #407](https://github.com/google/go-tpm-tools/pull/407) |
| 2024-02-22 | go-tpm-tools v0.4.3 released, explicitly listing "Add RISC V support #407" | [go-tpm-tools releases](https://github.com/google/go-tpm-tools/releases) |

**Key contributor for the simulator fix:** @aimixsaka, tested on Arch Linux on a Sophgo Mango board (rv64imafdc). This work is in the companion `go-tpm-tools` repository, not in `go-tpm` itself.

There is no upstreaming timeline for go-tpm because the library has always been implicitly portable to riscv64. No porting work was done because none was needed.

---

## 3. Upstream Support Tier

go-tpm has no formal platform support tier policy. There is no documented support matrix.

Evidence of actual support level from CI and release configuration:

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI testing (native runner) | Yes (ubuntu-latest, windows-latest) | No | No |
| CI testing (QEMU/emulation) | No | No | No |
| Release-blocking CI | Yes (x86-64 only) | No | No |
| Official binary releases | None (source-only library) | None | None |
| Arch-specific source code | None | None | None |
| Build tag exclusions | None | None | None |

**Conclusion:** riscv64 is implicitly supported at the same level as all non-x86 architectures: the code compiles and runs, but no CI validates this, and no binary releases are published for any architecture. The absence of riscv64 CI is not a deliberate exclusion; it reflects the project's minimal CI scope (two runners only).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-tpm contains no architecture-specific components. The full 183-file repository was scanned and confirmed to have:

- Zero assembly (`.s`) files
- Zero CGo
- Zero `GOARCH` build constraints
- Zero arch-named source files (`_amd64.go`, `_arm64.go`, `_riscv64.go`, etc.)
- Zero SIMD dispatch code
- Zero JIT backends
- Zero RVV intrinsics or Zba/Zbb/Zbc extension usage

The only platform-specific splits in the codebase are OS-level, not architecture-level:

| File | Split type | Scope |
|------|------------|-------|
| `tpm2/transport/linuxtpm/linuxtpm.go` | `!windows` build tag | Linux/macOS vs Windows TPM device access |
| `open_other.go` / `open_windows.go` | OS | Same |
| `poll_unix.go` | `unix` | Uses `golang.org/x/sys/unix.Poll` with `int32` file descriptor |

The `poll_unix.go` 32-bit sensitivity was the subject of the only architecture-adjacent bug in the repository: Issue #252 / PR #253, a 32-bit integer casting issue in `tpmutil` filed by Fedora packager Davide Cavalca for i686/armv7hl. That fix is merged and closed. It is not riscv64-specific and riscv64 is unaffected (64-bit).

**Component table (all architectures identical):**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Assembly | None | None | None |
| SIMD | None | None | None |
| CGo | None | None | None |
| TPM device transport (Linux) | Pure Go syscalls | Same | Same |
| TPM device transport (Windows) | Pure Go TBS API | N/A | N/A |
| Protobuf serialization | Pure Go | Same | Same |
| Crypto primitives | Delegated to golang.org/x/crypto | Same | Same |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go modules only. No CMake, no Makefile, no configure scripts.

**Minimum Go version:** go 1.24 (root `go.mod`), go 1.24.0 (`googleipmi` submodule `go.mod`).

**Standard build command:**
```
go build ./...
go test ./...
```

**riscv64 cross-compilation (inferred from codebase structure, not documented upstream):**

For CGo-disabled builds (all production uses):
```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
```

For CGo-enabled builds (simulator tests in go-tpm-tools, not go-tpm itself): a riscv64 cross-toolchain and `libssl-dev:riscv64` are required. No documented minimum GCC or Clang version exists in any upstream source.

**Dockerfile:** The repository's `Dockerfile` is amd64-only. It pulls `golang:1.24`, installs `libssl-dev`, and downloads `golangci-lint` with a hardcoded `linux-amd64` tarball URL. No multi-arch or riscv64 variant exists.

**QEMU:** No QEMU usage in any CI or build configuration.

**Known build failures on riscv64:** None. No issues or PRs report build failures on riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

go-tpm has no feature gaps between riscv64 and any other architecture. The feature set is entirely determined by what the TPM hardware device exposes, not by CPU architecture.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| TPM 2.0 command encoding/decoding | Full | Full | Full |
| TPM 1.2 command encoding/decoding | Full (maintenance mode) | Full | Full |
| Linux `/dev/tpm0` transport | Full | Full | Full |
| Windows TBS transport | Full | N/A | N/A |
| IPMI transport (Google-internal, PR #444) | Full | Unknown [NEEDS VERIFICATION] | Unknown [NEEDS VERIFICATION] |
| TPM2 attestation primitives | Full | Full | Full |
| 32-bit casting bug (tpmutil) | Fixed (PR #253) | Fixed | Fixed |
| SIMD-accelerated crypto | N/A (no crypto in core lib) | N/A | N/A |
| Floating-point / NaN semantics issues | None | None | None |

**Performance gaps:** None intrinsic to go-tpm. The bottleneck in all TPM operations is the TPM hardware device itself, not CPU-side computation. The existing benchmark data (PR #48) confirms RSA-2048 signing takes 565-1249 ms per operation on x86-64 hardware, dominated by TPM firmware latency, not software.

**Security hardening gaps:** Data not available: no upstream documentation of security hardening flags (stack canaries, CFI) for any architecture. The library is pure Go, which provides memory safety by default.

---

## 7. CI/CD Infrastructure

**CI file:** `.github/workflows/ci.yml` (single file, confirmed by directory listing).

**Triggers:** `push` (tags matching `v*` or `*/v*`, branches `master`/`main`) and `pull_request`. Standard always-on triggers, not gated on labels or `workflow_dispatch`.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | ubuntu-latest, windows-latest | None | None |
| QEMU emulation | None | None | None |
| `go build ./...` | Yes | No | No |
| `go test ./...` | Yes | No | No |
| Lint job | Yes (ubuntu-latest) | No | No |
| RISE-provided runner | No | No | No |
| Hardware runner | No (GitHub-hosted only) | No | No |

The string "riscv" does not appear anywhere in `ci.yml`. This was confirmed by reading the full decoded file content. There is exactly one CI configuration file in the repository.

There is no riscv64 CI of any kind for go-tpm.

---

## 8. Distribution and Release Status

**GitHub Releases:** go-tpm publishes releases (v0.9.4 through v0.9.8 checked). All releases have zero attached binary assets. The project is a source-only library distributed via `go get` / Go modules.

**PyPI:** HTTP 404. go-tpm is not a Python package and has no PyPI presence.

**Arch Linux RISC-V:** Not packaged. Zero results on [archriscv.felixc.at](https://archriscv.felixc.at/?q=go-tpm).

**Debian/Ubuntu:**

| Distro | Package name | Version | Architecture |
|--------|-------------|---------|-------------|
| Ubuntu 24.04 Noble | `golang-github-google-go-tpm-dev` | 0.9.0-2 | `all` |
| Debian unstable (sid) | `golang-github-google-go-tpm-dev` | 0.9.8-4 | `all` |

Architecture `all` means the package contains architecture-independent Go source files (`.go` files), not a compiled riscv64 binary. It installs on riscv64 without a separate build step. The Debian buildd database shows no per-arch build entries (amd64, arm64, riscv64 all show "No entry in database"), which is the expected behavior for arch:all packages.

**What a riscv64 user must do:** Install `golang-github-google-go-tpm-dev` on Debian/Ubuntu (or `go get github.com/google/go-tpm`), then `go build` their own application. The go-tpm library code requires no modification.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| `golang.org/x/sys` | OS syscalls, ioctl, TPM device access | Full: `syscall_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `asm_linux_riscv64.s` present | Tested as part of Go toolchain CI | All releases | None |
| `golang.org/x/crypto` | Crypto primitives (ChaCha20, poly1305) | Builds via generic fallback (`chacha_noasm.go`); no riscv64 SIMD path | Not tested standalone on riscv64 | No riscv64-specific artifacts | No SIMD acceleration for riscv64 (arm64, ppc64x, s390x have assembly); performance impact only, not a correctness blocker |
| `google.golang.org/protobuf` | Protobuf serialization | Pure Go; all GOARCH | No riscv64-specific issues | All releases | None |
| `github.com/google/go-cmp` (test-only) | Test comparison | Pure Go | No riscv64 issues | All releases | None |
| `github.com/google/go-tpm-tools` (dependent library) | Attestation tools, key management, TEE launcher | Core TPM client: pure Go, compiles; CGo simulator: riscv64-capable since v0.4.3 (PR #407); launcher/keymanager: x86-64 Linux only by hardware design (SEV-SNP, TDX) | CI matrix: ubuntu x32/x64, macOS arm64/x64 only, no riscv64 | No riscv64 release artifacts | CGo keymanager and launcher are structurally x86-64-only; not a go-tpm core blocker |
| `github.com/google/go-attestation` | Remote attestation over TPM | Pure Go; builds on any GOARCH | CI: ubuntu-latest only (x64), no riscv64 | No riscv64-specific release | None |
| `github.com/google/go-sev-guest` | AMD SEV-SNP attestation | Builds on riscv64 with zero-stub fallback (`!amd64` path in `cpuid.go`) | Not tested on riscv64 | No riscv64 artifacts | SEV-SNP is AMD x86-only by hardware; riscv64 is a functional no-op stub |
| `github.com/google/go-tdx-guest` | Intel TDX attestation | Compiles on riscv64 (no build constraints on riscv64) | Not tested on riscv64 | No riscv64 artifacts | TDX is Intel x86 hardware; riscv64 support is a structural no-op |
| `github.com/google/go-configfs-tsm` (indirect) | Confidential compute sysfs interface | Linux only; pure Go | Not tested on riscv64 | No riscv64 artifacts | None |
| `github.com/google/certificate-transparency-go` (indirect) | CT log verification | Pure Go | Not tested on riscv64 | No riscv64 artifacts | None |

**Critical dependency note:** `golang.org/x/crypto` provides no SIMD acceleration for riscv64. All arm64 and amd64 callers benefit from handwritten assembly for ChaCha20, poly1305, and related primitives. riscv64 uses the scalar Go fallback. Since go-tpm itself does not invoke crypto hot paths directly, this is not a practical bottleneck for TPM usage (TPM hardware dominates latency), but it is a gap for any application that also uses `golang.org/x/crypto` for high-throughput cryptographic workloads on the same riscv64 host.

The `go-tpm-tools` simulator fix (PR #407, v0.4.3) is the only riscv64-specific work in the entire dependency tree. It enables the Microsoft TPM2 reference simulator to compile on riscv64 via a C preprocessor guard in `LibSupport.h`. This was tested on real riscv64 hardware (Sophgo Mango board).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| Issue #252 / PR #253 | `TestUnpackMalformedBytes fails on 32 bit architectures` | Closed/Merged | Low | 32-bit integer casting bug in `tpmutil`; filed for i686/armv7hl by Fedora packager; not riscv64-specific; merged and released |

No riscv64-specific bugs exist. GitHub issue search for "riscv" in `google/go-tpm` returns 0 results (confirmed: total_count = 0 from GitHub API).

No correctness bugs affecting riscv64 are open.

---

## 12. Objections and Upstream Blockers

There are no upstream objections or technical blockers to riscv64 support because the library already supports riscv64 without modification.

The only gap is the absence of riscv64 CI coverage. This is a gap affecting all non-x86 architectures equally, not a deliberate riscv64 exclusion.

**Organizational observation:** Issue creation is restricted (not open to all users). The project is primarily driven by Google-internal engineering (PR #444, MTD transport). Contribution velocity from outside Google is low. Adding riscv64 CI would require either a PR from a RISC-V hardware provider or an internal Google decision to expand the CI matrix.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

No work required. go-tpm is fully functional on riscv64 today. The library is pure Go with no architecture-specific code. Any riscv64 Linux system with a TPM device (`/dev/tpm0` or `/dev/tpmrm0`) can use go-tpm without modification.

### 13.2 Performance Optimization

No performance optimization work applies to go-tpm itself. TPM operations are hardware-latency-bound (hundreds of milliseconds per operation). CPU-side computation is negligible regardless of architecture.

The `golang.org/x/crypto` SIMD gap (no riscv64 assembly) is a dependency-level issue, not a go-tpm issue, and does not affect TPM operation latency.

### 13.3 CI/CD Infrastructure

The only investable work is adding riscv64 CI coverage. This is a quality assurance gap, not a functional gap.

**Option A:** Add `GOARCH=riscv64 CGO_ENABLED=0 go build ./...` to the existing `ci.yml` matrix. This is a pure cross-compilation check requiring no riscv64 runner. Effort: low.

**Option B:** Add a QEMU-based `go test` job for riscv64. Requires a QEMU riscv64 step in CI. Tests would be functional but not connected to real TPM hardware, so most tests (which require `/dev/tpm0`) would be skipped. Effort: low-medium.

**Option C:** Add a native riscv64 hardware runner with a physical TPM. Enables full test coverage including TPM device tests. Effort: high (hardware provisioning).

### 13.4 Ecosystem Enablement

Not applicable. go-tpm is a library with no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None required | 0 | N/A | N/A |
| CI/CD | Add `GOARCH=riscv64 CGO_ENABLED=0 go build ./...` cross-compilation step to `ci.yml` | 0.25 | Contributor / Google TPM team | Low |
| CI/CD | Add QEMU-based riscv64 `go test` job | 1 | Contributor / Google TPM team | Low |
| CI/CD | Native riscv64 hardware runner with physical TPM for full integration tests | 4-8 | Hardware provider / Google infra | Low |
| Ecosystem | None required | 0 | N/A | N/A |

**Investment recommendation:** go-tpm requires no investment for functional riscv64 enablement. If riscv64 CI coverage is desired for supply-chain assurance, the cross-compilation step (0.25 person-weeks) is the minimal viable action. Full hardware-based test coverage is low priority given that the library logic is trivially portable.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/go-tpm repository](https://github.com/google/go-tpm)
- [go-tpm CI workflow (.github/workflows/ci.yml)](https://github.com/google/go-tpm/blob/master/.github/workflows/ci.yml)
- [go-tpm Issue #252: TestUnpackMalformedBytes fails on 32 bit architectures](https://github.com/google/go-tpm/issues/252)
- [go-tpm PR #253: Fix 32-bit integer casting in tpmutil](https://github.com/google/go-tpm/pull/253)
- [go-tpm-tools PR #407: Add RISC V support](https://github.com/google/go-tpm-tools/pull/407)
- [go-tpm-tools v0.4.3 release notes](https://github.com/google/go-tpm-tools/releases/tag/v0.4.3)
- [archriscv-packages PR #3390: age-plugin-tpm riscv64 patch](https://github.com/felixonmars/archriscv-packages/pull/3390)
- [Arch Linux RISC-V package search for go-tpm](https://archriscv.felixc.at/?q=go-tpm)
- [Ubuntu Noble package: golang-github-google-go-tpm-dev](https://packages.ubuntu.com/search?keywords=go-tpm&suite=noble)
- [Debian tracker: golang-github-google-go-tpm](https://tracker.debian.org/pkg/golang-github-google-go-tpm)
- [RISE project members page](https://riseproject.dev/members/)
- [RISE blog: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE security-software working group](https://github.com/riseproject-dev/security-software-wg)
- [golang.org/x/sys riscv64 support (syscall_linux_riscv64.go)](https://cs.opensource.google/go/x/sys)
- [golang.org/x/crypto chacha_noasm.go (riscv64 scalar fallback)](https://cs.opensource.google/go/x/crypto)