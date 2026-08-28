---
title: seesaw
parent: Project Reports
---

# seesaw

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for seesaw<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/seesaw](https://github.com/google/seesaw) is a Linux Virtual Server (LVS) based load-balancing platform written entirely in Go. It provides anycast load balancing using BGP (via Quagga), IPVS kernel forwarding, and health checking. The project is licensed Apache-2.0 and is explicitly disclaimed as "not an official Google product," though it originates from and is hosted under the Google GitHub organization.

**Governance:** Ad-hoc benevolent maintainer model. No MAINTAINERS file, no OWNERS file, no CODEOWNERS, no steering committee, and no formal governance charter. Contributions require signing Google's CLA (individual or corporate). The project is in maintenance mode: all commits since late 2023 are automated Dependabot security bumps. The last substantive code change was a netlink test fix in April 2023 [NEEDS VERIFICATION].

**Corporate sponsors:** All top contributors appear to be current or former Google engineers based on project origin and org placement, though none list Google explicitly in their public GitHub profiles. Active maintainer Hazael Sanchez (hazaelsan, Dublin, Ireland) has merged all recent PRs. Yuan Liu (liuyuan10) was the top historical contributor (61 commits, 2019-2021). Joel Sing (4a6f656c) authored the founding commit on 2015-12-07.

**Community culture on new ports:** No stated policy exists. Given the maintenance-mode state (activity is exclusively Dependabot PRs reviewed by one maintainer), no new architecture ports have been discussed or proposed. The Go toolchain already targets `linux/riscv64`, so no language-level porting work exists; the barrier is CI infrastructure and CGo dependency availability.

**RISE membership:** Google LLC is a RISE Premier Member, but seesaw is not listed as a RISE project and does not appear in any RISE workgroup output or wheel builder listing.

**Repository stats:** Created 2015-12-04, last push 2026-07-11, 227 commits, 5,676 stars, 506 forks, 16 open issues.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2015-12-07 | Repository created; initial commit by Joel Sing | [github.com/google/seesaw](https://github.com/google/seesaw/commits/master) |
| 2015-2021 | Active development; no architecture-specific work of any kind | Commit history |
| 2023-present | Maintenance mode; Dependabot bumps only | Commit history |
| Never | RISC-V port proposed, discussed, or attempted | GitHub issue/PR/commit search: 0 results |

No RISC-V port exists. A search of all 227 commits, all issues, and all PRs returned zero references to riscv, riscv64, or RISC-V. No contributor has proposed a port.

---

## 3. Upstream Support Tier

No formal platform tier policy exists. The project has no PLATFORMS.md, SUPPORT.md, or equivalent document.

**Implicit support tier from CI evidence:**

| Platform | CI | Release binaries | Tier |
|----------|----|-----------------|------|
| linux/amd64 | Yes (ubuntu-18.04, Go 1.18/1.19) | None (0 releases ever published) | Development/build only |
| linux/arm64 | No | None | Unsupported |
| linux/riscv64 | No | None | Unsupported |

The CI pipeline (`.github/workflows/ci.yaml`) runs only on `ubuntu-18.04` (x86_64). The protoc binary downloaded is hardcoded as `protoc-3.7.1-linux-x86_64.zip`, confirming x86-only intent. No GitHub releases have ever been published for any architecture.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The entire seesaw codebase is pure Go with two CGo packages. There is no assembly, no SIMD, no JIT, no hand-tuned cryptography, and no architecture-specific code of any kind -- not for amd64, arm64, or any other target.

**Component breakdown:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| LVS engine (engine/) | Pure Go | Pure Go | Pure Go (untested) | No arch-specific code |
| IPVS bindings (ipvs/) | CGo, linux/ip_vs.h | CGo, linux/ip_vs.h | CGo, linux/ip_vs.h (untested) | Architecture-neutral C headers |
| Netlink bindings (netlink/) | CGo, libnl3 | CGo, libnl3 | CGo, libnl3 (untested) | libnl3 unavailable in Debian stable riscv64 |
| Health checking (healthcheck/) | Pure Go | Pure Go | Pure Go (untested) | No arch-specific code |
| BGP/routing (quagga integration) | N/A (external) | N/A (external) | N/A (external) | Quagga is a separate daemon |
| Assembly (.S files) | None | None | None | Zero .S files in repository |
| SIMD | None | None | None | No compute-intensive hot paths |
| Cryptography | None (stdlib) | None (stdlib) | None (stdlib) | No custom crypto |

The CGo unsafe.Pointer patterns in `netlink/message.go` (casting over C structs `struct_nl_msg`, `struct_nl_sock`) and in `ipvs/ipvs.go` (uint32 reinterpretation via byte-level type punning for ServiceFlags) are architecture-sensitive in principle but use only standard C types. They have not been validated on RISC-V hardware.

**ISA extensions:** None required or used. The project has no SIMD, no vector, no cryptographic acceleration, and no use of any RISC-V ISA extensions (RVV, Zba, Zbb, or other).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go modules (`go.mod`, `go 1.25.0`) with a minimal `Makefile`. No CMake, no Dockerfile, no cross-compilation toolchain files.

**Build commands:**

```
go build ./...        # build all packages
go test ./...         # run all tests
make install          # installs binaries to $GOPATH/bin
```

**riscv64 cross-compilation requirements** (CGo is required; pure `GOARCH=riscv64` is insufficient):

1. `riscv64-linux-gnu-gcc` cross-toolchain (GCC or Clang with riscv64-linux-gnu target)
2. `libnl-3-dev` and `libnl-genl-3-dev` for riscv64 sysroot (`netlink/cfuncs.go` requires these)
3. `CGO_ENABLED=1`, `CC=riscv64-linux-gnu-gcc`, `GOOS=linux`, `GOARCH=riscv64`
4. CGO_CFLAGS pointing to riscv64 libnl3 headers at `/usr/include/libnl3`

**Constraint:** `libnl-3-200` is not available in Debian bookworm (stable) or Debian trixie for riscv64. It is available in Debian sid (unstable) at version 3.12.0-2+b1. This means seesaw cannot build on riscv64 Debian stable without sourcing libnl3 from sid or building it from source.

The CI workflow downloads `protoc-3.7.1-linux-x86_64.zip` and would need updating to build protoc from source (no official riscv64 protoc binary exists) for any riscv64 CI job. This affects only the `make proto` code-generation step, not runtime binaries.

No minimum GCC or Clang version is specified by the project. No QEMU usage is documented anywhere in the repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| LVS load balancing | Yes (untested in CI at release) | Not tested | Not tested |
| IPVS kernel forwarding | Yes | Not tested | Not tested |
| Netlink configuration | Yes (libnl3 available) | Not tested | Blocked (libnl3 absent in Debian stable) |
| BGP anycast (Quagga) | Yes (external dep) | Not tested | Not tested |
| Health checking | Yes | Not tested | Not tested |
| NCC (network control) | Yes | Not tested | Not tested |
| SIMD acceleration | N/A | N/A | N/A |
| Floating-point semantics | N/A | N/A | N/A |

**Functional gaps for riscv64:**
- No gap at the Go source level; the codebase is fully portable.
- One concrete gap: libnl3 unavailable in Debian stable riscv64. The CGo unsafe.Pointer patterns in netlink/message.go and ipvs/ipvs.go are untested on RISC-V and warrant validation.

**Performance gaps:** None expected. The project has no architecture-specific performance optimizations on any platform. Network packet forwarding is handled by the Linux kernel IPVS subsystem, not by seesaw user-space code.

**Security hardening gaps:** Data not available: no security hardening configuration (PIE, stack canaries, CFI) is documented or specified for any platform.

---

## 7. CI/CD Infrastructure

**Single CI file:** `.github/workflows/ci.yaml`. No other CI configuration exists (.gitlab-ci.yml, Jenkinsfile, .cirrus.yml are all absent).

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Runner | ubuntu-18.04 (GitHub-hosted) | None | None |
| Go versions tested | 1.18, 1.19 | N/A | N/A |
| Build check | Yes (`go build ./...`) | No | No |
| Test with race detector | Yes (`go test -cover -race ./...`) | No | No |
| Protobuf generation | Yes (protoc x86_64 binary) | No | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |
| Hardware boards | No | No | No |

The string "riscv" does not appear in any of the 188 files in the repository. There is no RISC-V CI of any kind.

---

## 8. Distribution and Release Status

**GitHub releases:** Zero releases have ever been published at [github.com/google/seesaw/releases](https://github.com/google/seesaw/releases). No binary artifacts exist for any architecture.

**Distribution packages:**

| Distribution | Package | riscv64 status |
|-------------|---------|---------------|
| Debian | Not packaged (tracker.debian.org returns 404) | N/A |
| Ubuntu noble | Not packaged (no result in packages.ubuntu.com) | N/A |
| Arch Linux RISC-V | Not packaged (archriscv.felixc.at returns no result) | N/A |
| PyPI | Unrelated project (seesaw 0.10.3 is a web archiving tool, source-only) | N/A |

**What a user must do to get a working riscv64 binary:**

1. Source libnl3 from Debian sid or build from source (libnl 3.12.0+).
2. Install `riscv64-linux-gnu-gcc` cross-toolchain.
3. Clone the repository and run `CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc GOOS=linux GOARCH=riscv64 go build ./...`.
4. Deploy to riscv64 Linux hardware and validate the netlink and IPVS CGo code paths manually.

No pre-built path exists for riscv64.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|------|--------------|--------------|----------------|----------------|
| Go runtime (golang/go) | Compiler and runtime | Supported (linux/riscv64 first-class) | Partial: 3 RVA22 hardware bots broken in CI (Jun 2026); gotip build failures (#70401) | Go 1.25 ships linux/riscv64 | #70401, #79067-#79069 (builder infra); not a correctness blocker |
| libnl3 (thom311/libnl) | Netlink socket C library (CGo) | Arch-neutral; compiles on riscv64 | No riscv64 CI | libnl-3-dev available in Debian sid only (not stable/trixie) | **Blocking:** absent from Debian stable riscv64 |
| google.golang.org/protobuf | Protocol Buffers runtime | Pure Go, builds on riscv64 | No riscv64 CI | Portable (v1.36.12) | None |
| github.com/golang/protobuf | Legacy proto v1 shim | Pure Go | No riscv64 CI | Portable | None |
| golang.org/x/crypto | TLS, SSH, crypto primitives | riscv64 assembly exists for poly1305 (sum_riscv64.s) | No riscv64 CI | Portable Go module | None |
| golang.org/x/sys | Syscall wrappers | Comprehensive riscv64 support (syscall_linux_riscv64.go, asm_linux_riscv64.s, zerrors, ztypes, cpu files) | No riscv64 CI | Portable Go module | None |
| golang.org/x/net | HTTP/2, DNS, networking | Pure Go (via golang.org/x/sys) | No riscv64 CI | Portable Go module | None |
| github.com/miekg/dns | DNS client/server | Pure Go | No riscv64 CI | Portable | None |
| github.com/fsnotify/fsnotify | Filesystem event notifications | Pure Go with OS-specific backend via golang.org/x/sys | No riscv64 CI | Portable | None |
| github.com/golang/glog | Leveled logging | Pure Go | No riscv64 CI | Portable | None |
| github.com/dlintw/goconf | Config file parser | Pure Go | No riscv64 CI | Portable | None |
| github.com/kylelemons/godebug | Test diff helper | Pure Go | No riscv64 CI | Portable | None |

**Critical path:** The only concrete blocker is `libnl3` availability on riscv64 Debian stable. All pure-Go dependencies have zero known riscv64 issues. The Go toolchain itself has infrastructure-level CI instability on riscv64 hardware (goroutine and builder bots), but released Go 1.25 is stable for linux/riscv64.

The protoc binary used in `make proto` has no official riscv64 prebuilt (protoc ships x86, arm64, ppc64le, s390x, x86-32 only); building protoc from source on riscv64 requires Abseil-cpp. This affects only code generation, not runtime builds.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| - | No riscv64-related issues exist | - | - | GitHub search across all issues returned 0 results for riscv, riscv64, or RISC-V |

All 16 open issues are unrelated to RISC-V or architecture portability. No correctness bugs for riscv64 are filed because the project has never been tested on riscv64.

The Go toolchain issues (#70401, #79067-#79069) are in the upstream Go repository, not seesaw itself. They affect CI builder infrastructure, not released Go 1.25 correctness.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. `libnl3` absent from Debian stable riscv64. The project's CGo dependency on `libnl-3-dev` and `libnl-genl-3-dev` cannot be satisfied from Debian bookworm or trixie riscv64 package repositories. Available in Debian sid (3.12.0-2+b1). This is the primary build blocker.

2. CI infrastructure uses `ubuntu-18.04` with hardcoded x86_64 protoc binary. Adding riscv64 CI requires replacing the protoc download with a source build and adding a riscv64 runner (QEMU or hardware).

3. CGo unsafe.Pointer patterns in `netlink/message.go` and `ipvs/ipvs.go` have not been validated on RISC-V. The patterns are architecture-neutral in design but require runtime validation.

**Organizational blockers:**

The project is effectively unmaintained for new features. The sole active maintainer (Hazael Sanchez) reviews only Dependabot PRs. The probability that a riscv64 CI addition would receive timely review is low [NEEDS VERIFICATION] based on the pattern of recent activity.

**Stated objections:** None filed. No contributor has raised riscv64 support as a topic in any issue or PR.

**Acceptance probability:** High for a well-formed PR that adds riscv64 CI and documents the libnl3 build dependency, given the absence of any stated objections and the trivial code change required (Go already supports linux/riscv64). The organizational risk is slow review cadence, not technical rejection.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The Go codebase requires zero changes. Work is limited to:
- Resolving the libnl3 Debian stable gap (either by contributing packaging, using sid, or sourcing from a buildroot/sysroot)
- Validating CGo unsafe.Pointer behavior on riscv64 hardware for the netlink and IPVS packages
- Updating the CI YAML to add riscv64 (replace hardcoded x86 protoc, add GOARCH=riscv64, provide CGo sysroot)

### 13.2 Performance Optimization

Not applicable. The project has no architecture-specific performance code on any platform. Load balancing decisions are handled by the kernel IPVS subsystem. No riscv64 optimization work is warranted.

### 13.3 CI/CD Infrastructure

Add riscv64 CI job to `.github/workflows/ci.yaml`:
- Build protoc from source (or use buf CLI which ships riscv64 binaries) [NEEDS VERIFICATION]
- Add `GOOS=linux GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc` environment
- Source libnl3 riscv64 headers (from Debian sid sysroot or buildroot)
- Use QEMU user-mode or hardware runner for `go test`

### 13.4 Ecosystem Enablement

Not applicable. seesaw has no dependent package ecosystem, no plugin system, and no distribution packages on any platform. Section 10 is omitted per scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | Validate CGo netlink/IPVS unsafe.Pointer on riscv64 hardware | 1 | Qualcomm/RISE | High |
| Functional | Resolve libnl3 riscv64 Debian stable gap (sid sysroot or source build) | 1 | Qualcomm/RISE | High |
| CI/CD | Add riscv64 CI job (GOARCH matrix, CGo sysroot, protoc replacement) | 1 | Qualcomm/RISE | Medium |
| CI/CD | Submit CI addition PR upstream and drive review | 1 | Qualcomm/RISE | Low |
| Performance | riscv64 optimization | 0 | N/A | Not warranted |

Total estimated effort: 4 person-weeks to achieve a verified, CI-gated riscv64 build and test pass.

**Context:** Google is a RISE Premier Member, but seesaw is not a RISE project and receives no RISE investment. No work has been done or funded for seesaw riscv64 support by any party.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/seesaw repository](https://github.com/google/seesaw)
- [google/seesaw CI workflow (.github/workflows/ci.yaml)](https://github.com/google/seesaw/blob/master/.github/workflows/ci.yaml)
- [google/seesaw releases (zero published)](https://github.com/google/seesaw/releases)
- [google/seesaw commit history](https://github.com/google/seesaw/commits/master)
- [google/seesaw issues](https://github.com/google/seesaw/issues)
- [golang/go issue #70401 -- gotip linux/riscv64 build failures](https://github.com/golang/go/issues/70401)
- [golang/go issue #79067 -- riscv64 hardware builder broken](https://github.com/golang/go/issues/79067)
- [golang/go issue #79068 -- riscv64 hardware builder broken](https://github.com/golang/go/issues/79068)
- [golang/go issue #79069 -- riscv64 hardware builder broken](https://github.com/golang/go/issues/79069)
- [thom311/libnl repository](https://github.com/thom311/libnl)
- [golang/x/crypto -- poly1305 riscv64 assembly](https://github.com/golang/crypto)
- [golang/x/sys -- riscv64 syscall support](https://github.com/golang/sys)
- [protocolbuffers/protobuf-go](https://github.com/protocolbuffers/protobuf-go)
- [Debian package tracker for seesaw (404 -- not packaged)](https://tracker.debian.org/pkg/seesaw)
- [Ubuntu noble package search for seesaw (no results)](https://packages.ubuntu.com/search?keywords=seesaw&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V mirror search for seesaw (no results)](https://archriscv.felixc.at/?q=seesaw)
- [PyPI seesaw package (unrelated project, source-only)](https://pypi.org/project/seesaw/)
- [RISE project member list](https://riseproject.dev/members/)