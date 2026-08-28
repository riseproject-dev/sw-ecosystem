---
title: go-tdx-guest
parent: Project Reports
---

# go-tdx-guest

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-tdx-guest<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[go-tdx-guest](https://github.com/google/go-tdx-guest) is a Go library for Intel TDX (Trust Domain Extensions) attestation on Linux. It wraps the `/dev/tdx_guest` kernel device and the `TDX_CMD_GET_REPORT0` / `TDX_CMD_GET_QUOTE` ioctls to generate and verify TDX attestation quotes, validate Intel PCK certificate chains against the Intel PCS API, and parse TDX event logs (CCEL/RTMR). The library also exposes a configfs-TSM path (`/sys/kernel/config/tsm/report`) for architecture-agnostic kernel quote generation on supported platforms.

Intel TDX is a confidential computing technology that is physically and architecturally specific to x86-64 Intel CPUs. The `/dev/tdx_guest` device and its ioctls are defined in the Linux kernel only for `arch/x86`. There is no RISC-V equivalent of TDX. This fact shapes the entire RISC-V status assessment: riscv64 is architecturally out of scope for the core attestation path, not merely unsupported through neglect.

**Governance:** No formal governance. The project is hosted under the `github.com/google` org and follows Google's open-source model: GitHub PRs, Google CLA required for all contributions. The repository carries an explicit disclaimer: "This is not an officially supported Google product." No steering committee, no foundation affiliation, no tiered-port policy is documented.

**License:** Apache-2.0.

**Repository stats:** 203 commits, 98 stars, 45 forks. Created 2023-06-23. Last commit: 2026-08-18.

**Key contributors and affiliations:**

| Contributor | Commits | Affiliation |
|---|---|---|
| jrjatin (Jatin Rawat) | 68 | No company listed |
| ballesterosa (Antonio Ballesteros) | 16 | No company listed |
| qinkunbao (Qinkun Bao) | 9 | Apache Foundation (qinkun@apache.org) |
| deeglaze (Dionna Amalie Glaze) | 8 | Apple |
| jessieqliu (Jessie Liu) | 6 | Google |
| kongoshuu (Chong Cai) | 2 | Google |
| yagehu (Yage Hu) | 1 | No company listed (added FreeBSD support, July 2026) |

**RISE Project:** Google LLC is a Premier Member of the RISE Project. go-tdx-guest itself is not listed as a RISE member project and does not appear in the RISE wheel builder or blog posts.

**Community stance on new ports:** Not applicable in the conventional sense. The project has received no issues, PRs, commits, or discussions mentioning RISC-V across its full history (110 issues/PRs scanned via GitHub API). No maintainer has commented on or declined a RISC-V port. The absence of discussion reflects the hardware constraint, not a governance decision.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-06-23 | Repository created | [GitHub repo](https://github.com/google/go-tdx-guest) |
| 2026-07 | FreeBSD support added (PR #101) | [GitHub contributor log](https://github.com/google/go-tdx-guest) [NEEDS VERIFICATION - PR number] |
| Never | riscv64 port initiated | Full scan of all 110 issues/PRs via GitHub API |

No RISC-V-related commit, issue, PR, or discussion has ever existed in this repository. Confirmed by:
- `gh search issues --repo google/go-tdx-guest "riscv"` -- 0 results
- `gh search prs --repo google/go-tdx-guest "riscv"` -- 0 results
- `gh search commits --repo google/go-tdx-guest "riscv"` -- 0 results
- Full API scan of all 110 issues and PRs -- no title, body, or label contains "riscv", "riscv64", "risc-v", or "rv64"

There is no port history because no port has been attempted.

## 3. Upstream Support Tier

No formal tier policy is documented. Platform support is implicit from the hardware constraint and CI configuration.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build | Full | Compiles (pure-Go packages only) | Compiles (pure-Go packages only) |
| Hardware attestation | Full (TDX hardware required) | Not applicable | Not applicable |
| CI coverage | ubuntu-latest + macos-latest | None | None |
| Release binaries | `go-tdx-guest_Linux_x86_64.tar.gz` | None | None |
| Goreleaser target | `goarch: amd64` (explicit) | Not listed | Not listed |
| Official support claim | Implicit | None | None |

The `.goreleaser.yml` hard-codes `goarch: amd64` as the only Linux target. arm64 and riscv64 are absent. The CI matrix (`ubuntu-latest`, `macos-latest`, Go 1.21.x) covers only x86-64. No cross-compilation step, no QEMU, no `GOARCH` env var is set anywhere in either CI file.

**Effective tier for riscv64:** Not supported. Architecturally out of scope.

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-tdx-guest is a pure-Go library (53 files total) with one CGO-gated path used only for lint checks (`lintc` CI job, `CGO_ENABLED=1`). There is no JIT, no native SIMD, no hand-written assembly, and no GC barrier code in this project.

**Architecture-specific components:**

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| `client/client_linux.go` | `/dev/tdx_guest` ioctl wrapper | Full (hardware required) | Missing | Missing |
| `client/client_freebsd.go` | FreeBSD TDX ioctl (added July 2026) | N/A | Missing | Missing |
| `client/client_macos.go` | macOS stub (returns error) | Full | Full | Full |
| `client/client_windows.go` | Windows stub (returns error) | Full | Full | Full |
| `abi/` (TDX ABI structs) | TDX report / quote struct definitions | Full | Compiles | Compiles |
| `verify/` (certificate chain) | Intel PCK cert chain validation | Full | Full (pure Go) | Full (pure Go) |
| `validate/` (quote validation) | TDX quote field validation | Full | Full (pure Go) | Full (pure Go) |
| `pcs/` (Intel PCS client) | HTTP client for Intel PCS API | Full | Full (pure Go) | Full (pure Go) |
| `proto/` (protobuf defs) | TDX attestation proto types | Full | Full (pure Go) | Full (pure Go) |
| Release binary (`tools/`) | `attest`, `check` CLI tools | `linux/amd64` only | Missing | Missing |

The OS-gated files (`client_linux.go`, etc.) use `//go:build` OS tags only -- no architecture build constraints block riscv64 compilation. However, `client_linux.go` calls into the `tdx_guest` driver via Linux ioctls that exist only for `arch/x86` in the kernel. Compilation succeeds on riscv64; runtime execution of the attestation path fails with "could not open Intel TDX guest device" on any RISC-V machine.

No ISA extensions (RVV, scalar crypto, Zba/Zbb) are relevant. The project has no performance-sensitive inner loops. Cryptographic operations are delegated entirely to `golang.org/x/crypto` (see Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

go-tdx-guest uses the standard Go module build system. There is no CMake, Autotools, Makefile, Dockerfile, or other build system. No `docs/`, `BUILDING.md`, or `INSTALL` file exists in the repository.

**Standard build:**

```
CGO_ENABLED=0 go build ./...
CGO_ENABLED=0 go test ./...
```

**Cross-compilation for riscv64 (library packages only):**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./verify/... ./validate/... ./pcs/... ./proto/...
```

The `client` package will compile but is non-functional on riscv64. No QEMU step is needed or documented for library compilation. There are no known build failures on riscv64 for the pure-Go packages.

**Goreleaser configuration:** `.goreleaser.yml` specifies `goarch: amd64` as the sole Linux release target. No arm64 or riscv64 entry is present.

**Toolchain requirements:** Go 1.20+ (from `go.mod`). CI uses Go 1.21.x. No GCC or Clang version requirement for normal builds; the `lintc` CI job uses system GCC and Clang on `ubuntu-latest` with `CGO_ENABLED=1` for CGO warning checks only.

**Known build failures on riscv64:** None for pure-Go packages. The `client` package compiles but cannot function without TDX hardware.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| TDX attestation quote generation | Full (hardware) | N/A | N/A | Architectural - no TDX on non-x86 |
| TDX quote verification (software) | Full | Full | Full | None |
| Intel PCK certificate chain validation | Full | Full | Full | None |
| Intel PCS API client | Full | Full | Full | None |
| Proto serialization / deserialization | Full | Full | Full | None |
| ConfigFS-TSM quote provider | Full (TDX kernel driver) | Missing (no TSM provider) | Missing (no TSM provider) | Architectural |
| Release binary | Full | Missing | Missing | No goreleaser target |
| CI test coverage | Full | None | None | No CI matrix |

**Summary of gaps for riscv64:**

1. **Attestation path (architectural):** `/dev/tdx_guest` and the configfs-TSM TDX provider do not exist on RISC-V. This is not a software gap -- TDX is Intel silicon. There is no RISC-V confidential computing extension that provides an equivalent interface.

2. **Release binary (missing):** No `go-tdx-guest_Linux_riscv64.tar.gz` is built or published. Adding a goreleaser target would be trivial for the pure-Go tools but meaningless without TDX hardware.

3. **CI (missing):** No riscv64 runner, QEMU, or cross-compilation step in CI.

No floating-point, NaN semantics, SIMD, or security hardening gaps exist -- the project has none of these components.

## 7. CI/CD Infrastructure

**CI files:** `.github/workflows/CI.yml` and `.github/workflows/release.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

| Job | Runner | Go version | riscv64 coverage |
|---|---|---|---|
| `build` | `ubuntu-latest`, `macos-latest` | 1.21.x | None |
| `lint` | `ubuntu-latest` | 1.21.x | None |
| `lintc` (CGO lint) | `ubuntu-latest` | 1.21.x | None |
| Release (`release.yml`) | `ubuntu-latest` | 1.20.x | None |

Neither CI file contains the strings "riscv", "riscv64", "RISCV", "GOARCH", "QEMU", or any cross-compilation directive. All runners are x86-64 GitHub-hosted machines. No RISE-provided runners are used or referenced.

**riscv64 CI:** Does not exist. Not planned (no open issue requesting it).

## 8. Distribution and Release Status

**GitHub releases (5 most recent):** v0.3.1, v0.2.2, v0.2.1, v0.2.0, v0.3.0. Every release that ships a binary asset ships exactly: `checksums.txt` and `go-tdx-guest_Linux_x86_64.tar.gz`. No asset filename contains "riscv64". v0.3.0 ships no assets.

**PyPI:** HTTP 404. go-tdx-guest does not exist on PyPI. Not applicable.

**Ubuntu noble:** Not packaged. Search on [packages.ubuntu.com](https://packages.ubuntu.com) returns no results.

**Debian (unstable/sid):** Package `golang-github-google-go-tdx-guest` exists at version 0.3.1-3, arch: all. Built once on `x86-grnet-02`. riscv64 buildd database entry: "No entry in riscv64 database, check Packages-arch-specific." The arch:all designation means a single build artifact is distributed to all architectures -- no riscv64-specific build log exists or is needed for an arch:all package. The pure-Go library code is present in the Debian package and is usable on riscv64 for the non-attestation packages.

**Arch Linux:** Not packaged.

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at)): Not listed.

**RISE wheel builder:** Not listed. PyPI non-existence makes this moot.

**To get a working binary on riscv64:** Use `GOOS=linux GOARCH=riscv64 go build` from source. The Debian arch:all package installs Go source on riscv64. The attestation functionality will not work without TDX hardware.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 tests | riscv64 release | Notes |
|---|---|---|---|---|---|
| golang.org/x/sys v0.19.0 | Linux syscalls, ioctl | Supported | x86-64 CI only | Tagged releases | Has `unix/syscall_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `asm_linux_riscv64.s` |
| golang.org/x/crypto v0.17.0 | TLS, AES-GCM, SHA-256/384, EC | Supported | x86-64 CI only | Tagged releases | Has `internal/poly1305/sum_riscv64.s` (native asm); AES-GCM uses pure-Go fallback |
| google.golang.org/protobuf v1.34.2 | TDX quote proto serialization | Full | x86-64 CI only | Tagged releases | Pure Go, no arch-specific code |
| github.com/google/go-sev-guest v0.8.0 | Shared attestation utilities | Compiles | x86-64 CI only | Tagged releases | `abi/cpuid_amd64.go` has a `!amd64` fallback that returns zeros; AMD SEV-SNP is x86-only (same constraint as TDX) |
| github.com/google/go-configfs-tsm v0.3.2 | ConfigFS TSM interface | Compiles | x86-64 CI only | Tagged releases | Functionally depends on TSM kernel support; no RISC-V TEE has a TSM driver |
| github.com/google/go-eventlog v0.0.2 | TPM event log / RTMR parsing | Compiles | Not verified | Tagged releases | RTMR path is TDX-specific (Intel CCEL ACPI table) |
| github.com/google/go-tpm v0.9.0 (indirect) | TPM 2.0 device access | Compiles | ubuntu + windows only | Tagged releases | `open_other.go` uses `!windows` build tag; compiles on riscv64 |
| github.com/google/go-cmp v0.6.0 | Test equality (test-only) | Full | x86-64 CI only | Tagged releases | Pure Go |
| github.com/google/logger v1.1.1 | Structured logging | Full | x86-64 CI only | Tagged releases | Pure Go |
| go.uber.org/multierr v1.11.0 | Multi-error aggregation | Full | x86-64 CI only | Tagged releases | Pure Go |

**Dependency-level riscv64 blockers:** None. All dependencies compile on riscv64. `golang.org/x/sys` has a complete riscv64 syscall layer. `golang.org/x/crypto` has native poly1305 assembly for riscv64 and pure-Go AES-GCM fallback. `go-sev-guest`'s cpuid gracefully stubs to zero on non-x86. No dependency has a hard riscv64 build failure.

**Functional limitation:** `go-configfs-tsm` and `go-sev-guest` share the same architectural constraint as go-tdx-guest itself -- they require TEE hardware that does not exist on RISC-V.

## 11. Known Bugs and Active Issues

| Category | Finding |
|---|---|
| riscv64 correctness bugs | None. Zero issues or PRs reference riscv64, risc-v, or rv64. |
| riscv64 build failures | None found. |
| riscv64 tracking issue | Does not exist. |
| Open issues (total) | 20 open issues at time of search, all x86-64 TDX-specific (TCB status levels, quote parsing, PCCS configuration, CCEL event log). |

Data not available: Closed issue count breakdown by category (GitHub API was queried for riscv64 keywords only, not full closed-issue taxonomy).

## 12. Objections and Upstream Blockers

**Fundamental architectural blocker:** Intel TDX is defined by Intel as an x86-64 ISA extension. The Linux kernel's `tdx_guest` driver (`drivers/virt/coco/tdx-guest/`) is under `arch/x86`. The ioctls `TDX_CMD_GET_REPORT0` and `TDX_CMD_GET_QUOTE` are defined in `arch/x86/include/uapi/asm/tdx.h`. No RISC-V equivalent of this hardware interface exists in the Linux kernel or in any public RISC-V hardware roadmap.

**No stated objection required:** No maintainer has rejected a riscv64 port because none has been proposed. The absence of any issue, PR, or discussion on the topic across the repository's full history (110 issues/PRs) reflects the hardware constraint, not a governance or policy decision.

**RISC-V confidential computing alternatives:** The RISC-V CoVE (Confidential VM Extension) and AP-TEE specifications are in development as potential analogues to TDX and AMD SEV-SNP on RISC-V. If those specifications mature and receive Linux kernel driver support, a parallel library (go-cove-guest or equivalent) would be the appropriate vehicle -- not a port of go-tdx-guest. This project's identity is specifically Intel TDX; broadening it to cover a different ISA's TEE would require architectural redesign, not a port.

**Acceptance probability for a riscv64 hardware attestation PR:** Near zero, not because of maintainer resistance, but because RISC-V confidential computing hardware with a Linux kernel driver does not yet exist to validate such a contribution.

## 13. Investment Analysis

go-tdx-guest is an Intel TDX-specific attestation library. Investment in riscv64 enablement for this project is not meaningful unless and until:

1. A RISC-V confidential computing hardware extension (CoVE/AP-TEE) reaches silicon and has a Linux kernel driver merged.
2. A Go library for that RISC-V TEE is needed.

If those conditions are met, the correct investment is a new library modeled on go-tdx-guest, not a port of go-tdx-guest itself.

### 13.1 Functional Enablement

No functional enablement is possible or appropriate for riscv64. The attestation path requires Intel TDX hardware. The pure-Go verification and validation packages (verify/, validate/, pcs/, proto/) already compile and run on riscv64 with no modifications -- they require no investment.

### 13.2 Performance Optimization

Not applicable. The project has no performance-sensitive inner loops. All cryptographic operations are delegated to golang.org/x/crypto, which already has riscv64 optimizations.

### 13.3 CI/CD Infrastructure

Adding riscv64 to CI would confirm that the pure-Go packages (verify/, validate/, pcs/, proto/) compile and pass unit tests on riscv64. This has marginal value given the architectural limitation.

### 13.4 Ecosystem Enablement

Not applicable. go-tdx-guest has no dependent package ecosystem on riscv64. The Debian arch:all package already distributes the Go source to all architectures. No further packaging work is needed or useful.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | No actionable work -- TDX is x86-only hardware | 0 | N/A | Not applicable |
| Performance | No actionable work -- no riscv64 performance path | 0 | N/A | Not applicable |
| CI/CD | Add `GOARCH=riscv64` cross-compilation check for pure-Go packages | 0.25 | Upstream maintainers | Low |
| Ecosystem | No actionable work -- Debian arch:all package covers distribution | 0 | N/A | Not applicable |
| Future | Monitor RISC-V CoVE/AP-TEE Linux kernel driver progress; create go-cove-guest when hardware is available | TBD | N/A | Deferred |

**Overall recommendation:** Do not invest in go-tdx-guest for riscv64. The project is architecturally specific to Intel silicon. A CI fix (0.25 person-weeks) to verify that pure-Go packages cross-compile is the only conceivable contribution, and its value is negligible. Monitor the RISC-V confidential computing standards track (CoVE, AP-TEE) for the point at which a new library becomes warranted.

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [go-tdx-guest repository](https://github.com/google/go-tdx-guest)
- [go-tdx-guest releases](https://github.com/google/go-tdx-guest/releases)
- [go-tdx-guest CI workflow](https://github.com/google/go-tdx-guest/blob/main/.github/workflows/CI.yml)
- [go-tdx-guest release workflow](https://github.com/google/go-tdx-guest/blob/main/.github/workflows/release.yml)
- [Debian package tracker: golang-github-google-go-tdx-guest](https://tracker.debian.org/pkg/golang-github-google-go-tdx-guest)
- [golang.org/x/sys -- riscv64 syscall support](https://cs.opensource.google/go/x/sys)
- [golang.org/x/crypto -- riscv64 poly1305 assembly](https://cs.opensource.google/go/x/crypto)
- [github.com/google/go-sev-guest](https://github.com/google/go-sev-guest)
- [github.com/google/go-configfs-tsm](https://github.com/google/go-configfs-tsm)
- [RISE Project member list](https://riseproject.dev/members/)
- [Linux kernel tdx-guest driver (arch/x86)](https://elixir.bootlin.com/linux/latest/source/drivers/virt/coco/tdx-guest)
- [RISC-V CoVE specification (RISC-V International)](https://github.com/riscv-non-isa/riscv-ap-tee)