---
title: go-tpm-tools
---

# go-tpm-tools

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-tpm-tools<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

go-tpm-tools is a Go library and CLI tool (`gotpm`) that provides high-level TPM 2.0 operations on top of the low-level [google/go-tpm](https://github.com/google/go-tpm) driver. Its primary function is attestation infrastructure: event log parsing, endorsement key certificate verification, remote attestation quote generation and verification, and a bundled Microsoft TPM 2.0 reference simulator for unit testing. The project is explicitly focused on Google Cloud Confidential Computing use cases (Confidential Space, GKE node attestation, AMD SEV-SNP, Intel TDX, NVIDIA GPU attestation).

**Governance:** Informal Google-led model. No OWNERS, CODEOWNERS, or MAINTAINERS file. All contributions require signing Google's CLA. There is no tiered maintainership, no governance charter, and no foundation membership for this project directly. The project is not an official Google product (disclaimed explicitly in the README).

**Corporate sponsors:** The active maintainer core is Google-staffed: josephlr (Joe Richey, Google), jessieqliu (Google), brongan (Google), alexmwu (Google Cloud affiliation [NEEDS VERIFICATION]). deeglaze (Apple) appears as a contributor but not a primary maintainer.

**Foundation:** None. The project is not a CNCF, Linux Foundation, or OpenSSF member project. Google LLC is a Premier Member of RISE, but go-tpm-tools is not in the RISE project scope (confirmed: not in the riseproject-dev GitHub org, not in the RISE wheel builder, no RISE blog post mentions this project).

**Community culture on new ports:** No recorded community discussion on RISC-V or new architecture ports beyond PR #407. The project's hardware targets are implicitly restricted to cloud VM architectures (AMD SEV, Intel TDX) -- none of which currently run on RISC-V hardware. There is no stated policy on new architecture support.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-12-21 | PR [#403](https://github.com/google/go-tpm-tools/pull/403) opened by aimixsaka -- adds riscv32/64 preprocessor guard to vendored MS TPM simulator. Closed 2023-12-28 by author (CLA not signed). | GitHub PR #403 |
| 2023-12-28 | PR [#407](https://github.com/google/go-tpm-tools/pull/407) opened -- replacement of #403 from new branch with CLA signed. | GitHub PR #407 |
| 2024-01-05 | PR #407 merged (commit `3548706`) by alexmwu. Only file changed: `simulator/ms-tpm-20-ref/TPMCmd/tpm/include/LibSupport.h` (+4/-2 lines). Tested by author on Arch Linux / Sophgo Mango (rv64imafdc). | GitHub PR #407, merge commit |
| 2024-02-22 | Change ships in release v0.4.3. Release notes confirm: "Add RISC V support #407". | GitHub release v0.4.3 |
| 2025-02-03 | Issue [#536](https://github.com/google/go-tpm-tools/issues/536) opened: update vendored TPM simulator to TCG-maintained upstream (which has comprehensive multi-arch RADIX_BITS coverage including riscv). No maintainer response; no PR opened. | GitHub issue #536 |
| 2026-03-10 | Issue [#703](https://github.com/google/go-tpm-tools/issues/703) opened by Debian maintainer Simon Josefsson: same `#error Unable to determine RADIX_BITS` build failure on ppc64el and s390x -- identical root cause to what PR #407 fixed for riscv64. Open as of 2026-08. | GitHub issue #703 |
| 2026-08-01 | Issue [#916](https://github.com/google/go-tpm-tools/issues/916) opened: SIGSEGV in TPM simulator on s390x at runtime. Related to #703 root cause. | GitHub issue #916 |

**Key contributors:** aimixsaka (AMX, community contributor, Arch Linux RISC-V packaging project) authored both PRs. The motivation was enabling the `age-plugin-tpm` package on RISC-V via the archriscv-packages project. alexmwu reviewed and merged.

**Upstreaming status:** The riscv64 fix is fully upstream (v0.4.3+). However, the underlying root cause -- a stale vendored copy of the MS TPM2 simulator -- persists. The TCG-maintained upstream at [github.com/TrustedComputingGroup/TPM](https://github.com/TrustedComputingGroup/TPM) has a comprehensive `tpm_radix.h` covering riscv, ppc64, s390x, and others, but go-tpm-tools has not synced (issue #536, open since 2025-02-03, no response from maintainers).

---

## 3. Upstream Support Tier

No formal platform tier policy document exists (no PLATFORMS.md, SUPPORT.md, or equivalent). Architecture support is implicitly defined by what appears in the CI matrix and the goreleaser release configuration.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (ubuntu-latest) | Yes (macOS arm64 only) | No |
| CI test job | Yes | Partial (macOS only) | No |
| Release binary published | Yes | Yes | No |
| goreleaser target | Yes | Yes | No |
| keymanager CGo component | Full (Rust FFI) | Stub (runtime error) | Stub (runtime error) |
| Simulator compiles | Yes | Yes | Yes (since v0.4.3) |
| Officially documented | Yes | Yes | No |

riscv64 has no official support tier. It compiles (core packages and simulator since v0.4.3) but is not tested, not released, and not documented as supported. The keymanager Rust FFI component is explicitly gated to `linux && amd64` with stubs returning "not supported on this architecture" for all other platforms.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-tpm-tools consists of four distinct components with very different architecture profiles:

**4.1 TPM client library and gotpm CLI (pure Go)**

All packages under `client/`, `server/`, `verifier/`, and the `gotpm` CLI are pure Go with no assembly, no CGo, and no architecture-specific code. Go's cross-compilation handles riscv64 natively. These components are architecturally neutral.

**4.2 Microsoft TPM 2.0 Simulator (CGo, vendored C)**

The `simulator/` package embeds the ms-tpm-20-ref C library, compiled via CGo with OpenSSL (`-lcrypto`). The only RISC-V-specific content in the entire repository is in `simulator/ms-tpm-20-ref/TPMCmd/tpm/include/LibSupport.h`:

```c
#if ... || defined(__aarch64__) \
    || (defined(__riscv) && __riscv_xlen == 64)
#   define RADIX_BITS  64
#elif ... || (defined(__riscv) && __riscv_xlen == 32)
#   define RADIX_BITS  32
#else
#   error Unable to determine RADIX_BITS from compiler environment
#endif
```

This is a scalar fallback enablement -- it allows riscv64 to use the same generic OpenSSL/C math path as other 64-bit architectures. There are no RISC-V ISA extensions used (no RVV, no Zba/Zbb/Zbc, no Zvkn/Zvksed/Zvksh, no assembly). The change is 4 lines added to existing boilerplate.

**4.3 keymanager (CGo + Rust FFI, amd64-only)**

The `keymanager/` subdirectory is a Rust library providing Key Encapsulation Mechanism (KEM) operations and key custody functions, accessed via CGo. The build tag is explicit: `//go:build cgo && linux && amd64`. On riscv64, the file `keymanager/key_protection_service/key_custody_core/kps_key_custody_core_cgo.go` and its counterpart in `workload_service/` are excluded from the build; stub files return a runtime error for all keymanager operations. CI skips keymanager for non-x64 architectures (`if: runner.os == 'Linux' && matrix.architecture == 'x64'`).

**Component quality summary:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TPM client (pure Go) | Full | Full | Full |
| gotpm CLI (pure Go) | Full | Full | Full |
| TPM simulator (C+OpenSSL) | Scalar | Scalar | Scalar (since v0.4.3) |
| keymanager Rust FFI | Full | Missing (stub) | Missing (stub) |
| ISA extension acceleration | None | None | None |
| Crypto assembly (OpenSSL) | x86 AES-NI, SHA-NI | ARMv8 crypto | Generic C only |

No component in go-tpm-tools uses RISC-V ISA extensions. The OpenSSL dependency provides the only hardware crypto acceleration, and its riscv64 path is the generic C fallback (no Zvkn, no Zvksed/Zvksh assembly in the version bundled here).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum Go version:** go 1.24.0 (go.mod `go 1.24.0`, toolchain `go1.24.13`). The README documents Go 1.20 as minimum, which is outdated.

**Building core packages for riscv64 (no CGo required):**

```bash
GOOS=linux GOARCH=riscv64 go build ./... ./cmd/... ./verifier/...
```

No additional flags or toolchain components are needed. CGO_ENABLED=0 is used by goreleaser for the `gotpm` binary and is appropriate for cross-compilation of the pure-Go components.

**Building the simulator package for riscv64 (CGo required):**

```bash
CC=riscv64-linux-gnu-gcc \
CGO_ENABLED=1 \
GOOS=linux \
GOARCH=riscv64 \
CGO_CFLAGS="-Werror" \
go build ./simulator/...
```

Required system packages (Ubuntu/Debian):

```bash
sudo apt install libssl-dev cmake clang pkg-config gcc-riscv64-linux-gnu
# For riscv64 cross-compilation: libssl-dev:riscv64 (requires multiarch setup)
```

The CGo flags from `simulator/internal/internal_cgo.go` include `-std=gnu11 -Wall -fPIC -fstack-protector-all -DVTPM=NO -DSIMULATION=NO -DUSE_DA_USED=NO -lcrypto`. No `-D` flags to disable riscv64-specific features exist; RADIX_BITS is auto-detected correctly via LibSupport.h.

**Building keymanager for riscv64:** Not possible without removing the `amd64` build tag. No riscv64 Rust target is configured in any `Cargo.toml` or CI workflow.

**Known build failures:** No open riscv64 build failures. Issues #703 and #916 affect ppc64el and s390x -- architectures that remain undefined in the vendored LibSupport.h, unlike riscv64 which was fixed in v0.4.3.

**QEMU:** No QEMU usage anywhere in the CI or build system. No QEMU cross-compilation job exists.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TPM 2.0 client operations | Full | Full | Full |
| Remote attestation (quote/verify) | Full | Full | Full |
| Event log parsing | Full | Full | Full |
| TPM simulator (unit test use) | Full | Full | Full (compile only, no CI) |
| keymanager KEM key operations | Full | Missing (stub) | Missing (stub) |
| keymanager key custody | Full | Missing (stub) | Missing (stub) |
| Release binary | Yes | Yes | No -- source build only |
| FIPS crypto mode (BoringSSL) | Yes (keymanager) | No | No |
| Hardware TPM access (kernel driver) | Yes | Yes | Yes (pure Go, arch-neutral) |

**Functional gaps on riscv64:**

1. keymanager KEM/key-custody operations return a runtime error on riscv64. This blocks any use case requiring the keymanager service. However, keymanager is a specialized Google Cloud Confidential Space component -- most users of go-tpm-tools do not use it.

2. No pre-built binary is available. Users must build from source with a Go 1.24+ toolchain.

**Performance gaps:** No benchmark data exists for go-tpm-tools on riscv64. Data not available: no riscv64 performance measurements were found in any public source (GitHub, RISE blog, web). The TPM simulator uses the generic OpenSSL C path on riscv64, which lacks hardware crypto acceleration (no Zvkn, Zvksed, Zvksh). For unit testing purposes this is unlikely to be a practical bottleneck.

**Security hardening gaps:** No riscv64-specific hardening analysis was found. The BoringSSL FIPS module does not support riscv64 [NEEDS VERIFICATION -- sourced from BoringSSL findings, not directly confirmed from go-tpm-tools code].

**NaN / floating-point semantics:** Not applicable. go-tpm-tools performs no floating-point computation.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists. This is confirmed by reading the full contents of both workflow files.

**.github/workflows/ci.yml** build matrix:
- `os: ubuntu-latest`, `architecture: [x32, x64]`
- Include: `os: macos-latest, architecture: arm64`
- Include: `os: macos-14-large, architecture: x64`
- The string "riscv" does not appear anywhere in the file.
- No QEMU step, no `GOARCH=riscv64` env var, no RISC-V runner.
- keymanager is skipped for non-x64: `if: runner.os == 'Linux' && matrix.architecture == 'x64'`

**.github/workflows/releaser.yaml**: `os: ubuntu-latest` only. Uses goreleaser for Darwin and Windows cross-compilation. No riscv64 target. "riscv" does not appear in the file.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes | Yes (macOS) | No |
| Test job | Yes | Yes (macOS) | No |
| Release pipeline | Yes | Yes | No |
| RISE RISC-V runners | N/A | N/A | No (not adopted) |
| Hardware runner | GitHub-hosted | GitHub-hosted | None |
| QEMU cross-build | No | No | No |

The [RISE RISC-V Runners program](https://riseproject.dev/) (announced 2026-03-24) is not adopted by this project.

---

## 8. Distribution and Release Status

**Official GitHub Releases (v0.4.5 through v0.4.9, current as of 2026-06-05):**

Every release ships exactly these assets:
- `go-tpm-tools_Darwin_arm64.tar.gz`
- `go-tpm-tools_Darwin_x86_64.tar.gz`
- `go-tpm-tools_Linux_arm64.tar.gz`
- `go-tpm-tools_Linux_x86_64.tar.gz`
- `go-tpm-tools_Windows_arm64.zip`
- `go-tpm-tools_Windows_x86_64.zip`
- `checksums.txt`

riscv64: absent from every release in the v0.4.x series.

**Linux distribution packages:**

| Distribution | Package present | riscv64 build |
|---|---|---|
| Ubuntu 24.04 (noble) | No | N/A |
| Debian (unstable) | Yes (v0.4.8-5) | arch=all (Go source package, all arches) [NEEDS VERIFICATION -- Debian tracker returned 404; this data is from the research findings citing Debian Go Packaging Team] |
| Arch Linux RISC-V (archriscv.felixc.at) | Not found | Not found |

**PyPI:** Not applicable (Go project, no Python packaging).

**What a riscv64 user must do:** Build from source using Go 1.24+. For the core packages and CLI (`gotpm`), this is a single cross-compilation command with no CGo. For the simulator (needed only for testing), a riscv64 cross-compiler and OpenSSL riscv64 development headers are also required. keymanager functionality is unavailable on riscv64 regardless of build method.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| [google/go-tpm](https://github.com/google/go-tpm) v0.9.6 | Core TPM 2.0/1.2 low-level driver | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [microsoft/ms-tpm-20-ref](https://github.com/microsoft/ms-tpm-20-ref) (submodule) | TPM2 simulator C library (test only) | Yes (since PR #407, v0.4.3) | Manual only (Sophgo Mango, no CI) | Bundled | Vendored copy stale vs TCG upstream (issue #536) |
| [google/go-attestation](https://github.com/google/go-attestation) v0.5.1 | Remote attestation cert chain building | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [google/go-sev-guest](https://github.com/google/go-sev-guest) v0.14.0 | AMD SEV-SNP quote parsing | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [google/go-tdx-guest](https://github.com/google/go-tdx-guest) v0.3.2 | Intel TDX quote parsing | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [google/go-configfs-tsm](https://github.com/google/go-configfs-tsm) v0.3.3 | ConfigFS TSM sysfs interface | Yes (pure Go) | No CI | No binary | No riscv64 blockers |
| [google/go-eventlog](https://github.com/google/go-eventlog) v0.0.3 | TCG firmware event log parsing | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [google/certificate-transparency-go](https://github.com/google/certificate-transparency-go) v1.1.2 | CT log/proof verification | Yes (pure Go) | No riscv64 CI | No binary | No riscv64 blockers |
| [golang.org/x/crypto](https://pkg.go.dev/golang.org/x/crypto) v0.45.0 | Supplemental crypto (AES-GCM, SHA, X.509) | Yes (riscv64 stubs present) | Part of Go toolchain CI | Library only | No open riscv64 issues |
| [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys) v0.38.0 | Linux syscall wrappers | Yes | Part of Go toolchain CI | Library only | Historical riscv64 fixes (#38, #40) merged 2019; no open issues |
| [google.golang.org/protobuf](https://pkg.go.dev/google.golang.org/protobuf) v1.36.11 | Protocol Buffers runtime | Yes (pure Go) | Part of upstream CI | Library only | No riscv64 issues |
| BoringSSL (bundled in keymanager/) | Crypto backend for keymanager Rust crate | Partial (C generic path only) | Compile-only (Android NDK) | Bundled | No FIPS on riscv64 [NEEDS VERIFICATION]; no Zvkn/Zvksed/Zvksh; keymanager CI skips non-x64 entirely |
| GoogleCloudPlatform/confidential-space (private) | Confidential Space attestation API | Unknown (private repo) | Unknown | N/A | Architecturally bound to GCP CVMs (AMD SEV/Intel TDX); no riscv64 GCP hardware |

### Critical dependency deep-dives

**golang.org/x/sys:** Two historical riscv64 bugs -- endian tag (issue #38, 2019) and `epoll_event` struct padding (issue #40, 2019) -- were both fixed before v0.38.0. No open riscv64 issues.

**BoringSSL (keymanager):** Compiles on riscv64 via the generic C path. No RISC-V vector crypto assembly (no Zvkn, Zvksed, Zvksh). FIPS mode rejects riscv64 [NEEDS VERIFICATION]. The go-tpm-tools CI explicitly skips `keymanager` for all non-x64 architectures, so no maintainer has validated whether the Rust FFI compiles or links correctly for riscv64.

**ms-tpm-20-ref (vendored submodule):** The vendored copy's `LibSupport.h` now covers riscv64 (PR #407) but lacks ppc64el and s390x (issue #703). The TCG-maintained upstream at [TrustedComputingGroup/TPM](https://github.com/TrustedComputingGroup/TPM) replaced `LibSupport.h` with a comprehensive `tpm_radix.h` covering all major architectures, but go-tpm-tools has not synced (issue #536, no maintainer response since 2025-02-03).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#536](https://github.com/google/go-tpm-tools/issues/536) | Update vendored TPM simulator code to use TCG | Open | Medium | Root cause of all arch-specific RADIX_BITS failures. TCG upstream has comprehensive multi-arch tpm_radix.h. No maintainer response since 2025-02-03. riscv64 is currently OK (PR #407 patched manually) but future arch additions require either repeated manual patches or this sync. |
| [#703](https://github.com/google/go-tpm-tools/issues/703) | Build failure of v0.4.7 on ppc64el and s390x | Open | High (for Debian packaging) | Same root cause as the pre-#407 riscv64 failure. Filed by Debian maintainer Simon Josefsson. jkl73 acknowledged the cause; no PR opened; josephlr has not responded. |
| [#916](https://github.com/google/go-tpm-tools/issues/916) | Runtime error in TPMSimulator on s390x | Open | High (for s390x) | SIGSEGV at `_plat__Reset` in the vendored C simulator on s390x. Not riscv64. Sibling problem -- indicates the vendored simulator has runtime issues on big-endian architectures beyond just build failures. |
| [#839](https://github.com/google/go-tpm-tools/issues/839) | Add LoongArch 64-bit support | Open | Low | RADIX_BITS undefined for loong64. Same class of fix as PR #407. |
| [#473](https://github.com/google/go-tpm-tools/issues/473) | Define RADIX_BITS for LoongArch64 | Open | Low | Duplicate tracking of #839 root cause. |

No open correctness or performance bugs for riscv64 specifically. The riscv64 build path is stable since v0.4.3.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None recorded. No maintainer has commented on riscv64 beyond approving PR #407 in January 2024. The project's strategic focus is Google Cloud Confidential Computing, which has no RISC-V hardware targets.

**Technical blockers:**

1. keymanager is hard-gated to `linux && amd64`. Removing the gate would require porting the `bssl-crypto` Rust crate to riscv64, validating BoringSSL's C generic path, and resolving FIPS mode constraints. This is non-trivial but not architecturally infeasible.

2. The vendored ms-tpm-20-ref submodule is stale (issue #536). Maintainers have not committed to syncing with the TCG upstream. If they do sync, the riscv64 LibSupport.h patch would be superseded by the comprehensive TCG tpm_radix.h, which is preferable.

3. No riscv64 hardware is available for CI. The RISE RISC-V Runners program provides this infrastructure but has not been adopted.

**Organizational blockers:**

- The project is narrowly focused on GCP infrastructure. No RISC-V cloud hardware from Google means no internal motivation to invest in riscv64 support.
- josephlr (the primary maintainer) has not responded to issue #703 (open since 2026-03-10) or issue #536 (open since 2025-02-03). Maintainer responsiveness for non-GCP-target architectures is low.

**Acceptance probability for upstream contributions:**

- CI additions (QEMU-based riscv64 job): Medium. Low-risk change; precedent set by RISE runners adoption in other Go projects.
- goreleaser riscv64 release target (pure Go packages): Medium-high. Purely additive; no CGo dependency for the gotpm binary.
- keymanager riscv64 port: Low in the near term. No Google-internal demand; requires Rust cross-compilation infrastructure.
- Syncing to TCG upstream (issue #536): Medium. The TCG tpm_radix.h is strictly superior and resolves multiple open issues; maintainer bandwidth is the limiting factor.

---

## 13. Investment Analysis

RISE has no existing investment in go-tpm-tools. The project is not in scope for the RISE AI/ML working groups, the Python wheel builder, or any documented RISE initiative. All work below is net-new.

**Context for sizing:** go-tpm-tools is not a critical-path dependency for AI/ML workloads on RISC-V. Its relevance is to secure boot, remote attestation, and confidential computing use cases. These use cases are nascent on RISC-V hardware (no production RISC-V platform with a standards-compliant TPM 2.0 as of 2026-06). Investment priority depends on whether a hardware partner has a specific confidential computing RISC-V platform roadmap.

### 13.1 Functional Enablement

The core library and CLI already compile and function on riscv64. The one functional gap is keymanager, which is relevant only for Google Cloud Confidential Space -- a GCP-specific use case with no riscv64 hardware target. No functional enablement investment is warranted absent a hardware partner requiring keymanager on riscv64.

Syncing the vendored ms-tpm-20-ref to the TCG upstream (issue #536) is a moderate-effort maintenance contribution that would benefit all non-x86/arm architectures (riscv64, ppc64, s390x, loong64) and improve the project's long-term maintainability. This is a reasonable contribution to offer.

### 13.2 Performance Optimization

No performance data exists for riscv64. The TPM simulator is used only in testing; the production code path (hardware TPM access via kernel driver) is pure Go and architecture-neutral. No SIMD or crypto acceleration is applicable to the core library's workload. Performance investment is not warranted.

### 13.3 CI/CD Infrastructure

Adding a QEMU-based riscv64 build+test job to ci.yml would provide ongoing regression coverage for the simulator fix in PR #407 and validate any future changes. This is low-effort and directly addresses the single largest gap: a merged fix with zero CI verification. The RISE RISC-V runners would be preferable to QEMU for native execution.

Adding `linux/riscv64` as a goreleaser target for the `gotpm` CLI binary is trivial (one line in `.goreleaser.yaml`) since the CLI is pure Go with CGO_ENABLED=0.

### 13.4 Ecosystem Enablement

Not applicable. go-tpm-tools has no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Sync vendored ms-tpm-20-ref to TCG upstream (issue #536) -- resolves open build failures on ppc64, s390x, loong64 and makes the vendored copy maintainable | 1 | Community contributor + Google review | Medium |
| CI/CD | Add QEMU riscv64 build+test job to ci.yml for simulator package | 0.5 | Community contributor | Medium |
| CI/CD | Add linux/riscv64 to goreleaser release targets (gotpm CLI binary, pure Go) | 0.1 | Community contributor | Low |
| Functional | Port keymanager bssl-crypto Rust crate to riscv64 | 4-8 | Requires Google engagement | Low (no hardware demand) |

Total estimated effort for practical riscv64 completeness (excluding keymanager): 1.6 person-weeks. The keymanager port is a separate effort sized at 4-8 person-weeks and is not recommended without a concrete hardware partner requiring it.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PR #403 -- Add RISC V support (closed, not merged)](https://github.com/google/go-tpm-tools/pull/403)
- [PR #407 -- Add RISC V support (merged 2024-01-05)](https://github.com/google/go-tpm-tools/pull/407)
- [Issue #536 -- Update vendored TPM simulator code to use TCG](https://github.com/google/go-tpm-tools/issues/536)
- [Issue #703 -- Build failure of 0.4.7 on ppc64el and s390x](https://github.com/google/go-tpm-tools/issues/703)
- [Issue #839 -- Add LoongArch 64-bit support](https://github.com/google/go-tpm-tools/issues/839)
- [Issue #916 -- Runtime error in TPMSimulator on s390x](https://github.com/google/go-tpm-tools/issues/916)
- [go-tpm-tools GitHub releases (v0.4.9 current)](https://github.com/google/go-tpm-tools/releases)
- [go-tpm-tools repository root](https://github.com/google/go-tpm-tools)
- [TCG-maintained TPM reference implementation (TrustedComputingGroup/TPM)](https://github.com/TrustedComputingGroup/TPM)
- [google/go-tpm upstream repository](https://github.com/google/go-tpm)
- [RISE project organization on GitHub (riseproject-dev)](https://github.com/riseproject-dev)
- [archriscv Arch Linux RISC-V package status](https://archriscv.felixc.at/)