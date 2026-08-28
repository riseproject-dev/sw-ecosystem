---
title: go-sev-guest
---

# go-sev-guest

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-sev-guest<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[go-sev-guest](https://github.com/google/go-sev-guest) is a Go library providing a client and verification stack for AMD SEV-SNP (Secure Encrypted Virtualization - Secure Nested Paging) guest attestation. It wraps the Linux `/dev/sev-guest` character device, exposes the SNP attestation report ABI (AMD SEV-SNP ABI Rev 1.58), and provides verification and validation logic for attestation certificates (VCEK/VLEK) and endorsement keys. The library is used in confidential computing deployments on AMD EPYC (Milan, Genoa, Turin) platforms.

The project is hosted under the `google` GitHub organization and is licensed Apache 2.0. It explicitly disclaims official Google product status. Governance is informal: no OWNERS or MAINTAINERS file exists; contributions require the Google CLA and pass through GitHub PR review.

**Contributor concentration is extreme.** Dionna Amalie Glaze (`deeglaze`) holds approximately 78% of all commits and originated the project [NEEDS VERIFICATION - commit percentage computed from top-contributor ranking, not a full audit]. Other contributors include Shawn Chen (16 commits), Paul Meyer of Amutable Systems (10), Fabian Kammel of control-plane.io (7), Moritz Sanft of Edgeless Systems (4), and Tom Dohrmann of AMD (2). The primary author is now at Apple; the project's day-to-day maintenance cadence reflects that reduced bandwidth.

Google LLC is a RISE Premier Member. go-sev-guest is not listed as a RISE project and has no RISE funding or working group affiliation. The RISE Security Software working group exists but no blog posts or announcements naming go-sev-guest were found.

**Community stance on new architecture ports:** Not documented anywhere in the repository. Given the project's tight coupling to AMD hardware, no port requests have been opened and none are expected from upstream maintainers.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022 | Project created under google/ org, amd64-only from inception | [github.com/google/go-sev-guest](https://github.com/google/go-sev-guest) |
| (ongoing) | `abi/cpuid.go` stub (`//go:build !amd64 || gccgo`) returns all-zero CPUID on non-amd64 -- allows compilation but disables attestation | [abi/cpuid.go](https://github.com/google/go-sev-guest/blob/main/abi/cpuid.go) |
| 2026-07-14 | PR #189 adds FreeBSD support -- x86 FreeBSD only, no riscv64 | [PR #189](https://github.com/google/go-sev-guest/pull/189) |
| Never | No riscv64 issue, PR, commit, or discussion has ever existed in the repository | GitHub issue/PR/commit search: 0 results |

There is no RISC-V port. No milestones exist. No contributors have initiated any RISC-V work.

---

## 3. Upstream Support Tier

No formal tier policy document exists. The implicit tier structure is inferred from CI, release artifacts, and build tag coverage.

| Tier criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI testing | Yes (ubuntu-latest, macos-latest) | No | No |
| Release binary | Yes (`go-sev-guest_Linux_x86_64.tar.gz`) | No | No |
| Assembly implementation | Yes (`cpuid_amd64.s`) | No | No |
| Compile (stub path) | Yes | Yes (zero-return stub) | Yes (zero-return stub) |
| Runtime functionality | Yes (requires AMD SEV-SNP HW) | No (device absent) | No (device absent) |
| Distro binary package | Debian/Ubuntu arch:all (source only) | Debian/Ubuntu arch:all (source only) | Debian/Ubuntu arch:all (source only) |

Effective tier: amd64 is Tier 1. arm64 and riscv64 are not supported tiers -- they compile but provide no attestation functionality.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The library has one arch-specific subsystem: the CPUID wrapper. Everything else (attestation report parsing, certificate verification, protobuf serialization) is pure Go.

**CPUID / attestation interface**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPUID query | Hand-written Plan 9 assembly (`abi/cpuid_amd64.s`, 27 lines, invokes x86 `CPUID` instruction) | Zero-return stub | Zero-return stub |
| `/dev/sev-guest` ioctl | Full (`client/client_linux.go`) | Compiles, fails at runtime with `ENOENT` | Compiles, fails at runtime with `ENOENT` |
| Attestation report ABI | Full (AMD SEV-SNP ABI Rev 1.58 structures) | Compiles, not functional | Compiles, not functional |
| Certificate verification (VCEK/VLEK) | Full (pure Go, `golang.org/x/crypto`, ECDSA P-384) | Functionally complete (pure Go) | Functionally complete (pure Go) |
| Attestation validation | Full (pure Go, protobuf) | Functionally complete | Functionally complete |

The ioctl bit-layout constants in `client/linuxabi/linux_abi.go` (`iocSizebits = 14`, `iocDirbits = 2`) match Linux `asm-generic/ioctl.h`, which is also used on riscv64. The ioctl constants are numerically compatible across architectures; the device they address does not exist on riscv64.

No SIMD, JIT, GC barriers, or floating-point subsystems are present. The library performs no compute-intensive work that would benefit from RVV or other RISC-V ISA extensions.

---

## 5. Build System, Cross-Compilation, and Toolchain

The project uses the standard Go toolchain with no CMake, Makefile, Bazel, or C build system. There are no Dockerfiles, no QEMU configurations, and no cross-compilation scripts.

**Cross-compilation command (compile-only, no runtime functionality):**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
```

This succeeds. The `abi/cpuid.go` stub satisfies the build for `GOARCH=riscv64`. `CGO_ENABLED=0` is required because the project has no CGo; it uses `golang.org/x/sys/unix` for syscalls.

**Minimum Go version:** `go 1.19` as declared in `go.mod`. Go 1.17 introduced linux/riscv64 as a supported target; `go 1.19` is sufficient.

**Known build failures on riscv64:** None. The compile-only path is clean.

**Runtime failures on riscv64:** `unix.Open("/dev/sev-guest", ...)` returns `ENOENT` because the device does not exist. All client-package operations fail at this point.

**GoReleaser configuration** (`.goreleaser.yaml`): releases target `goarch: amd64` only. No riscv64 entry. The release workflow (`release.yml`) runs on `ubuntu-latest` (x86-64) only.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Guest attestation report acquisition | Yes | No | No | Functional - hardware absent |
| CPUID-based product version probing | Yes | No (returns 0) | No (returns 0) | Functional - ISA absent |
| Offline attestation report verification | Yes | Yes | Yes | No gap |
| Offline certificate chain validation | Yes | Yes | Yes | No gap |
| configfs-TSM report interface | Yes | No | No | Functional - hardware absent |
| FreeBSD guest support | Yes (PR #189, Jul 2026) | No | No | Functional - hardware absent |

The only features achievable on riscv64 are the offline verification and validation paths (`verify/` and `validate/` packages). These are pure Go and depend only on `golang.org/x/crypto` and `google.golang.org/protobuf`. They can verify AMD SEV-SNP attestation reports generated on amd64 hardware -- useful for a verifier running on a different platform, including riscv64.

No floating-point semantics issues. No NaN edge cases. No security hardening gaps specific to the architecture (no CFI, shadow stack, or pointer authentication in this codebase).

---

## 7. CI/CD Infrastructure

**CI workflow** (`.github/workflows/ci.yml`, commit `73cf42d`):
- Trigger: push to `main` or tags `v*`, pull requests to `main`
- Runner matrix: `os: [macos-latest, ubuntu-latest]` -- both are x86-64 hosted runners
- Jobs: `build` (build + test), `lint` (staticcheck/golangci-lint), `lintc` (CGO build warnings)
- Go versions: 1.24.x and 1.25.x
- No QEMU, no `GOARCH=riscv64` env var, no cross-compilation step

**Release workflow** (`.github/workflows/release.yml`, commit `86dd167`):
- Trigger: push to tags `v*`
- Runner: `ubuntu-latest` only
- Produces `go-sev-guest_Linux_x86_64.tar.gz` via GoReleaser; no riscv64 binary

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes | No | No |
| QEMU-emulated runner | No | No | No |
| Build-only job | N/A | No | No |
| Test job | Yes | No | No |
| Release binary produced | Yes | No | No |
| RISE runner | No | No | No |

The word "riscv" does not appear anywhere in either workflow file.

---

## 8. Distribution and Release Status

**GitHub releases:** Three most recent releases (`v0.15.0`, `v0.14.1`, `v0.15.0`) ship exactly one binary asset: `go-sev-guest_Linux_x86_64.tar.gz`. No riscv64 asset exists in any release. `v0.14.0` and `v0.13.0` have no binary assets (source-only releases).

**Debian/Ubuntu:** Package `golang-github-google-go-sev-guest-dev` is available as `arch: all` in:
- Ubuntu questing (25.10): 0.13.0-1
- Ubuntu resolute (26.04 LTS): 0.14.1-1
- Ubuntu stonking: 0.15.0-1
- Debian trixie: 0.13.0-1
- Debian forky / sid: 0.15.0-1

`arch: all` means this is a Go source package. It installs the `.go` source files and can be compiled locally on riscv64 with `go build`. No riscv64-compiled binary is produced or tested by the Debian/Ubuntu build infrastructure for this package.

**Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at)): No entry found for go-sev-guest.

**PyPI:** No package named `go-sev-guest` exists (HTTP 404).

**To obtain a working riscv64 build:** Clone the repository and run `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...`. No pre-built binary is available from any upstream channel. Runtime functionality is limited to the offline verification/validation packages.

---

## 9. Dependencies

All direct runtime dependencies build cleanly on riscv64. None are blocking.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go stdlib (1.19+) | Runtime, crypto/ecdsa, encoding/binary | Yes - linux/riscv64 Tier 1 since Go 1.17 | Yes | Yes | See project-reports/go.md |
| golang.org/x/crypto v0.17.0 | ECDSA P-384 cert verification, ASN.1 parsing | Yes - chacha20 falls back to generic Go; poly1305 has riscv64 assembly (`sum_riscv64.s`) | No dedicated riscv64 CI runner | N/A (source distribution) | Pin is outdated vs current 0.31.0+; Dependabot PR #147 open and unmerged [NEEDS VERIFICATION - PR number from search summary] |
| golang.org/x/sys v0.15.0 | Linux ioctl constants, syscall wrappers | Yes - `unix/syscall_linux_riscv64.go`, `unix/zerrors_linux_riscv64.go`, `cpu/cpu_riscv64.go` all present | Via Go standard builders | N/A (source distribution) | Pin outdated; `cpu` package is riscv64-aware (`HasV`, `Zvk*` detection) |
| google.golang.org/protobuf v1.33.0 | Proto serialization of attestation reports | Yes - pure Go | Yes | Yes | See project-reports/protocol-buffers.md |
| github.com/golang/protobuf v1.5.0 | Legacy proto shim (transitive) | Yes - pure Go | Yes | Yes | Purely wraps google.golang.org/protobuf |
| github.com/google/go-configfs-tsm v0.2.2 | configfs-TSM interface (`/sys/kernel/config/tsm`) | Yes - pure Go, compiles on riscv64 | No arch-specific CI | Yes | Requires kernel 6.7+ configfs-TSM driver; AMD SEV-SNP and Intel TDX are the only existing hardware; no riscv64 TEE hardware uses this interface |
| github.com/google/uuid v1.6.0 | Certificate GUIDs | Yes - pure Go | Yes | Yes | No issues |
| github.com/google/logger v1.1.1 | Logging wrapper | Yes - pure Go | Yes | Yes | Open issue #188 proposes migration to log/slog |
| github.com/google/go-cmp v0.5.7 | Test-only deep equality | Yes - pure Go | Yes | Yes | Test dependency only |
| go.uber.org/multierr v1.11.0 | Error aggregation | Yes - pure Go | Yes | Yes | No issues |
| golang.org/x/xerrors | Error wrapping compat shim (indirect) | Yes - pure Go | Yes | Yes | Effectively a no-op on Go 1.13+ |

No dependency has a JIT, SIMD-critical path, or numerics concern relevant to riscv64. `golang.org/x/crypto` uses a generic scalar path for chacha20 on riscv64 and has a new poly1305 assembly path added in 2026-04. Neither is on the hot path for go-sev-guest's certificate verification workload.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #188 | Migrate from google/logger to log/slog | Open | Low | Housekeeping; no RISC-V relevance |
| - | Dependabot PR for golang.org/x/crypto 0.17.0 -> current | Open (PR #147 [NEEDS VERIFICATION]) | Low | Outdated dep pin; no riscv64-specific failure |

No open correctness bugs. No open issues mention RISC-V, riscv64, arm64, or cross-architecture portability. All 26 open issues are exclusively AMD x86 SEV-SNP concerns.

No benchmark data of any kind exists for riscv64. No comparison with arm64 has been published.

---

## 12. Objections and Upstream Blockers

**Technical blocker - fundamental and permanent:** AMD SEV-SNP is an AMD x86-64 hardware feature. The Linux `/dev/sev-guest` device does not exist on RISC-V hardware. There is no QEMU emulation of this device for riscv64. The `client` package has a hard runtime dependency on `/dev/sev-guest` opening successfully; this is not an implementation gap but an architectural impossibility on riscv64.

**Partial path - offline verification:** The `verify/` and `validate/` packages are pure Go, have no architecture dependency, and function correctly on riscv64. A verifier application running on riscv64 could verify AMD SEV-SNP attestation reports generated on amd64 hardware. This is a legitimate use case (e.g., a RISC-V-based attestation verification service in a heterogeneous confidential computing deployment) but requires no code changes -- it already works.

**Upstream maintainer engagement:** No issue or discussion has ever been opened on this topic. Given the contributor concentration (one dominant maintainer now at Apple) and the architectural specificity of the project, upstream response to a RISC-V CI addition PR is unpredictable.

**Organizational blockers:** None stated. Google LLC is a RISE Premier Member, which could facilitate engagement, but go-sev-guest is not in scope for RISE's current working groups.

**Acceptance probability for riscv64 CI addition (build-only + verify/validate test):** Moderate. The change would be low-risk (no new code, QEMU-based, tests only the pure-Go verification path). The barrier is maintainer bandwidth, not technical objection.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The `client` package cannot be functionally enabled on riscv64. AMD SEV-SNP does not exist on RISC-V hardware. Any work to enable confidential computing attestation on RISC-V would require a different hardware TEE (e.g., RISC-V IOPMP, Keystone, CoVE) and a different library -- not a port of go-sev-guest.

The `verify` and `validate` packages already function on riscv64 with zero code changes. No functional enablement work is required or possible beyond what already exists.

### 13.2 Performance Optimization

Data not available: no riscv64 benchmarks exist for go-sev-guest. The library performs cryptographic certificate chain verification (ECDSA P-384) as its most compute-intensive operation on the verification path. Performance on riscv64 is bounded by `golang.org/x/crypto` scalar ECDSA, which has no riscv64 assembly acceleration. This is a `golang.org/x/crypto` concern, not a go-sev-guest concern.

No RVV or other RISC-V ISA extension work is applicable to this library directly.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI would cover only the pure-Go `verify` and `validate` packages. The `client` package tests require AMD SEV-SNP hardware and cannot run on QEMU. A QEMU-based riscv64 CI job running `go test ./verify/... ./validate/...` is technically feasible and low-effort.

### 13.4 Ecosystem Enablement

No dependent package ecosystem applies to this library. It is a point library for a single hardware technology. No Section 10 analysis applies.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Enable riscv64 in CI (build-only + verify/validate tests via QEMU) | 0.5 | Contributor / RISE infra | Low |
| Functional | Port `client` package to RISC-V confidential computing hardware | Not applicable - requires different TEE hardware | N/A | Not applicable |
| Performance | ECDSA P-384 acceleration on riscv64 | 0 (golang.org/x/crypto concern, not this library) | golang.org/x/crypto | N/A |
| Distribution | Add riscv64 to GoReleaser release matrix | 0.25 | Contributor | Low |
| Ecosystem | Upstream dep pin updates (x/crypto, x/sys) | 0.25 | Contributor | Low |

**Total addressable investment: approximately 1 person-week.** The ROI is low. go-sev-guest provides no functionality on RISC-V beyond what already works (offline attestation verification). It is not a blocker for any RISC-V workload. Investment is only warranted if a specific use case requires riscv64 CI or release binaries for the offline verification path.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [go-sev-guest repository](https://github.com/google/go-sev-guest)
- [go-sev-guest releases](https://github.com/google/go-sev-guest/releases)
- [abi/cpuid.go - non-amd64 stub](https://github.com/google/go-sev-guest/blob/main/abi/cpuid.go)
- [abi/cpuid_amd64.s - x86 CPUID assembly](https://github.com/google/go-sev-guest/blob/main/abi/cpuid_amd64.s)
- [.github/workflows/ci.yml](https://github.com/google/go-sev-guest/blob/main/.github/workflows/ci.yml)
- [.github/workflows/release.yml](https://github.com/google/go-sev-guest/blob/main/.github/workflows/release.yml)
- [.goreleaser.yaml](https://github.com/google/go-sev-guest/blob/main/.goreleaser.yaml)
- [Ubuntu package: golang-github-google-go-sev-guest-dev (resolute 26.04)](https://packages.ubuntu.com/resolute/golang-github-google-go-sev-guest-dev)
- [Debian tracker: golang-github-google-go-sev-guest](https://tracker.debian.org/pkg/golang-github-google-go-sev-guest)
- [Arch RISC-V port tracker](https://archriscv.felixc.at)
- [RISE project member list](https://riseproject.dev)
- [google/go-configfs-tsm dependency](https://github.com/google/go-configfs-tsm)
- [golang.org/x/crypto riscv64 poly1305 assembly](https://cs.opensource.google/go/x/crypto)
- [golang.org/x/sys linux/riscv64 syscall bindings](https://cs.opensource.google/go/x/sys)