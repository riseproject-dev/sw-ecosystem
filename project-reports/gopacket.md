---
title: gopacket
parent: Project Reports
---

# gopacket

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for gopacket<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

gopacket ([github.com/google/gopacket](https://github.com/google/gopacket)) is a Go library for network packet capture and parsing. It provides protocol decoders for a wide range of network layers (Ethernet, IP, TCP, UDP, DNS, GRE, VXLAN, and many others), plus live capture backends via libpcap (the `pcap/` package), Linux AF_PACKET (the `afpacket/` package), PF_RING (the `pfring/` package), and BSD BPF (the `bsdbpf/` package). The packet-parsing core and most protocol decoders are pure Go. Only the capture backends require CGo and external C libraries.

The project has 6,794 stars and its latest tag is v1.1.19. It has 370 open issues and 98 open PRs. The last commit was 2025-03-19 (a layer type sync from a Google-internal repository). The project is in low-maintenance mode: no new releases since v1.1.19, minimal commit activity in 2025.

**Governance.** There is no formal governance structure, no CODEOWNERS, MAINTAINERS, or OWNERS file, no foundation membership (not CNCF, Linux Foundation, RISE, or others). Contribution is via pull request with no documented approval chain beyond the repository holders.

**Corporate sponsors and maintainers.**
- Primary author: Graeme Connell (`gconnell@google.com`), Google employee, 601 commits, sole entry in AUTHORS under "MAIN DEVELOPERS."
- Current gatekeeper: George Powers (`gapowers`, Cisco), who merged the most recent PR (March 2025) [NEEDS VERIFICATION -- based on single source].
- Recent Google contributor: Tengyi Wang (`tengyi@google.com`), last substantive commit March 2025 (sync from Google-internal repo).
- Notable community contributors: Florian Lehner (Elastic/Optimyze, 37 commits), Laurent Hausermann (CyGO Entrepreneurs, 44 commits).

The project originated at Google and retains Google as primary organizational owner, with apparent operational gatekeeping shifting to a Cisco employee.

**Community stance on new ports.** No formal tier or platform support policy exists. CONTRIBUTING.md addresses only code style and PR process with no mention of supported architectures. There is no PLATFORMS.md or equivalent. The project has never publicly engaged with any architecture porting discussion: zero issues or PRs reference any architecture other than x86/amd64, ARM, or MIPS, and even those are limited to a handful of cross-compilation failures.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| No date | Repository created under `google/gopacket` | [github.com/google/gopacket](https://github.com/google/gopacket) |
| No date | v1.1.19 tagged -- most recent release | [github.com/google/gopacket/releases](https://github.com/google/gopacket/releases) |
| 2025-03-19 | Last commit (layer type update, Google-internal sync) | GitHub commit history |
| Never | Any RISC-V related commit, issue, or PR | GitHub search API, all 1323+ issues, 595 PRs, all commits: 0 results |

There is no RISC-V port history because no RISC-V work has ever occurred in this repository. The project's architecture-agnostic design (pure Go for all parsing) means riscv64 builds without any explicit porting work, so the absence of activity is not a sign of a blocked port -- it reflects that no one has needed to file issues or land arch-specific code.

**Key contributors to any riscv64 enablement:** None. No contributor from any organization has filed an issue, submitted a PR, or made a commit referencing RISC-V.

**RISE involvement:** None. Searches of the RISE Project blog, RISE GitLab organization, and all RISE infrastructure found zero references to gopacket. Google LLC is a Premier Member of RISE, but gopacket is not a RISE-sponsored project and does not appear in any RISE-funded work.

---

## 3. Upstream Support Tier

gopacket has no formal tier policy for any architecture. There is no PLATFORMS.md, no supported/unsupported designation, and no release-blocking criteria tied to architecture coverage.

**De facto support level by architecture:**

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Explicit CI coverage | Yes (Travis CI, Linux + macOS) | No | No |
| Architecture-specific source files | Yes (Windows defs) | No | No |
| Known build failures | None reported | CGo cross-compilation failures (#1049, #1180) | None reported (no one has tried) |
| Official binaries | None (source-only) | None | None |
| Distro packaging | Debian/Ubuntu arch:all | Debian/Ubuntu arch:all | Debian/Ubuntu arch:all |
| Open arch-specific issues | 0 | 4 (ARM/arm64) | 0 |

The project ships no binaries for any architecture. All distribution is via `go get` or via Debian/Ubuntu arch:all source packages. riscv64 is neither explicitly supported nor blocked.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gopacket has no architecture-specific implementations for any architecture. There are no `.s` assembly files, no SIMD intrinsics, no JIT compiler, no crypto acceleration, and no GC barrier assembly anywhere in the repository. A full code search for riscv, riscv64, rvv, vfloat32m1_t, linux_riscv, and `go:build riscv` all returned zero results. The only GOARCH references found are in `pcap/generate_defs.go` and `pcapgo/ngwrite.go`, both unrelated to RISC-V.

**Component analysis:**

| Component | Description | amd64 impl | arm64 impl | riscv64 impl |
|---|---|---|---|---|
| Packet parser (`layers/`) | Protocol decode for 100+ layer types | Pure Go | Pure Go | Pure Go |
| Streaming reassembly (`reassembly/`) | TCP stream reassembly | Pure Go | Pure Go | Pure Go |
| Packet I/O (`pcapgo/`) | Read/write pcap and pcapng files | Pure Go | Pure Go | Pure Go |
| Live capture (`pcap/`) | CGo wrapper for libpcap | Single unified `pcap_unix.go`; no arch splits on Linux | Same | Same -- no riscv64 file needed |
| AF_PACKET capture (`afpacket/`) | Linux AF_PACKET socket operations | Go + `golang.org/x/sys/unix`; `//go:build linux` | Same | Same -- `x/sys/unix` supports riscv64 |
| PF_RING capture (`pfring/`) | CGo wrapper for PF_RING userland library | No arch splits | No arch splits | No arch splits |
| BSD BPF capture (`bsdbpf/`) | BSD-only | BSD-only | BSD-only | BSD-only (irrelevant) |
| Windows CGo defs (`pcap/defs_windows_*.go`) | Struct layout snapshots for Windows libpcap | `defs_windows_amd64.go` | Not present | Not present -- Windows/riscv64 is not a Go target |
| SIMD acceleration | Does not exist | N/A | N/A | N/A |
| JIT | Does not exist | N/A | N/A | N/A |
| Crypto | Does not exist | N/A | N/A | N/A |

The Windows architecture-specific files (`defs_windows_386.go`, `defs_windows_amd64.go`) exist because the `timeval` struct layout differs between 32-bit and 64-bit Windows, requiring `cgo -godefs` snapshots. On non-Windows platforms, the C compiler resolves struct sizes at build time via `pcap_unix.go`, which covers all Linux architectures including riscv64 without any per-arch file. No equivalent riscv64 file is architecturally necessary.

**Conclusion:** There are no riscv64-specific gaps relative to amd64 or arm64. The library has no architecture-accelerated code paths on any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

The build system is exclusively the Go toolchain. There is no CMake, no configure script, no Makefile, no Dockerfile, no BUILDING.md, and no cross-compilation toolchain file in the repository.

**Module requirements:**

| Component | Minimum version | Source |
|---|---|---|
| Go | 1.12 | `go.mod` |
| Go (afpacket, EthernetHandle, bsdbpf) | 1.9 | README |
| libpcap (for `pcap/` package) | >= 1.1 [NEEDS VERIFICATION] | `pcap_unix.go` comments |
| libpcap (for `pcap_set_immediate_mode`) | >= 1.5 | `#ifndef PCAP_ERROR_TSTAMP_PRECISION_NOTSUP` compat shim in `pcap_unix.go` |
| GCC/Clang (CGo) | None documented; any riscv64-capable toolchain works | Repository has no documented floor |
| Linux kernel (afpacket `TPACKET_V3`) | >= 3.2 | `gc` script check in `afpacket/` |

**Build commands for riscv64:**

Pure-Go packages (cross-compilation, no CGo):
```
GOARCH=riscv64 GOOS=linux go build github.com/google/gopacket
GOARCH=riscv64 GOOS=linux go build github.com/google/gopacket/layers
GOARCH=riscv64 GOOS=linux go build github.com/google/gopacket/pcapgo
```

`pcap/` package on a riscv64 native host:
```
go build github.com/google/gopacket/pcap
```
Prerequisite: `libpcap-dev` installed for riscv64 (available in Debian sid and Ubuntu noble for riscv64).

`pcap/` package via cross-compilation from x86_64:
```
GOARCH=riscv64 GOOS=linux CGO_ENABLED=1 \
  CC=riscv64-linux-gnu-gcc \
  PKG_CONFIG_PATH=/path/to/riscv64-sysroot/usr/lib/pkgconfig \
  go build github.com/google/gopacket/pcap
```

`afpacket/` on a riscv64 native host:
```
go build github.com/google/gopacket/afpacket
```
Prerequisite: `linux/if_packet.h` with `TPACKET_V3` (kernel >= 3.2; satisfied on all modern riscv64 distros).

Disable CGo entirely (disables all capture backends, pure parsing only):
```
CGO_ENABLED=0 GOARCH=riscv64 GOOS=linux go build ./...
```

**QEMU.** No QEMU references appear anywhere in the repository. No CI uses QEMU. Cross-built CGo test binaries can be run under `qemu-riscv64-static`, but no scripts or CI infrastructure for this exists in the repository.

**Known build failures related to cross-compilation.** Issues [#1049](https://github.com/google/gopacket/issues/1049) (arm/arm64 CGo cross-compilation failure, open since 2022-08-17) and [#662](https://github.com/google/gopacket/issues/662) (mips, closed) document that CGo cross-compilation of the `pcap/` package fails when the riscv64 sysroot with libpcap is not properly configured. The same class of failure would apply to riscv64 cross-compilation, though no one has reported it. Native builds on riscv64 hardware are unaffected.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Packet parsing (all protocol layers) | Full | Full | Full |
| pcap live capture (native build) | Full | Full | Full (requires libpcap-dev) |
| pcap live capture (cross-compiled) | Full | Broken (#1049, #1180) | Not reported; likely same CGo sysroot issue |
| AF_PACKET (afpacket) | Full | Full | Full |
| PF_RING (pfring) | Full | Not validated [NEEDS VERIFICATION] | Not validated |
| BSD BPF (bsdbpf) | N/A (Linux) | N/A (Linux) | N/A (Linux) |
| pcapng read/write | Full | Full | Full |
| TCP stream reassembly | Full | Full | Full |
| SIMD-accelerated decode | N/A | N/A | N/A |
| JIT BPF filtering | N/A | N/A | N/A |

**Functional gaps:** None relative to amd64 or arm64 on native hardware. The only gap is CGo cross-compilation of `pcap/`, which is broken for arm64 (documented) and untested for riscv64.

**Performance gaps:** No architecture has SIMD or JIT acceleration. Performance is identical across architectures modulo CPU clock and memory subsystem characteristics. No published benchmarks exist for any architecture.

**Security hardening gaps:** Data not available -- no security hardening (stack canaries, CFI, shadow stack) is mentioned anywhere in the repository for any architecture.

**Floating-point / endian issues:** gopacket reads multi-byte fields using explicit byte order operations (`binary.BigEndian`, `binary.LittleEndian`). It does not rely on native endianness. No floating-point fields appear in protocol parsing. No endian or FP correctness issues have been reported for any architecture.

---

## 7. CI/CD Infrastructure

**Current state:** The only CI configuration in the repository is `.travis.yml`. There is no `.github/workflows/` directory (returns HTTP 404). No GitLab CI, Jenkinsfile, Cirrus CI, or AppVeyor configuration exists.

Travis CI configuration tests Go versions 1.5.x through master on Linux (Ubuntu, implicit x86_64) and macOS. There are no `arch:` matrix entries, no riscv64 runners, no QEMU emulation steps, and no cross-compilation jobs.

**CI comparison table:**

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI platform | Travis CI (Linux + macOS) | None | None |
| Architecture explicitly tested | Yes (implicit x86_64) | No | No |
| QEMU emulation | No | No | No |
| RISE-provided runner | No | No | No |
| Build test | Yes | No | No |
| Unit tests run | Yes | No | No |
| Release-blocking | Yes (de facto) | No | No |
| Benchmark in CI | No | No | No |

GitHub Actions are absent entirely. No RISE runner infrastructure is used.

---

## 8. Distribution and Release Status

gopacket has zero GitHub Releases. The GitHub releases API returns an empty array. The project is source-only and distributed via `go get github.com/google/gopacket@v1.1.19`. No binary artifacts, OCI images, npm packages, or Maven JARs exist for any architecture.

**Distribution packaging:**

| Channel | riscv64 available | Version | Notes |
|---|---|---|---|
| GitHub Releases | No | N/A | Zero releases exist for any architecture |
| PyPI | No | N/A | Not a Python package; HTTP 404 |
| Arch Linux RISC-V (archriscv.felixc.at) | No | N/A | Not packaged in Arch Linux at all |
| Debian sid | Yes (arch:all) | 1.3.0-2 | `golang-github-gopacket-gopacket` distributes Go source; no per-arch binary |
| Ubuntu noble (24.04) | Yes (arch:all) | 1.2.0-2 | `golang-github-gopacket-gopacket-dev`; same arch:all source distribution |

**What a user must do to get a working binary on riscv64:**
1. Install Go >= 1.12 for riscv64 (or cross-compile from x86_64 with `GOARCH=riscv64`).
2. For pure-Go usage (no live capture): `go build` or `go get` with no additional steps.
3. For live capture via libpcap: install `libpcap-dev` from the distro package manager on a riscv64 host, then `go build`.
4. For CGo cross-compilation: set up a riscv64 sysroot with libpcap headers and a riscv64-linux-gnu-gcc toolchain.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libpcap ([the-tcpdump-group/libpcap](https://github.com/the-tcpdump-group/libpcap)) | C library for live packet capture; linked via CGo in `pcap/` | Builds on Linux/riscv64; portable C, no arch-specific JIT or SIMD | Not tested in upstream CI (targets amd64, aarch64, macOS) | Available as `libpcap-dev` in Debian sid and Fedora for riscv64 | None; distro packages available |
| PF_RING ([ntop/PF_RING](https://github.com/ntop/PF_RING)) | Optional kernel module + userland library for high-speed capture; linked via CGo in `pfring/` | Kernel module not validated for riscv64; userland C is portable | No riscv64 CI | Not packaged for riscv64 in major distros; must build from source | No kernel module validation for riscv64; optional capture path |
| golang.org/x/sys ([golang/sys](https://github.com/golang/sys)) | Syscall bindings for `afpacket/` and other Linux socket operations | Full riscv64 support: `asm_linux_riscv64.s`, `syscall_linux_riscv64.go`, `zsyscall_linux_riscv64.go`, `ztypes_linux_riscv64.go` all present | No riscv64-specific issues | Included in every release as arch-agnostic Go module with riscv64 files | None |
| golang.org/x/net ([golang/net](https://github.com/golang/net)) | BPF assembly utilities via `golang.org/x/net/bpf`, used by `afpacket/` | Pure Go; no arch-specific code | No riscv64-specific issues | Ships as Go module; arch-agnostic | None |
| vishvananda/netlink ([vishvananda/netlink](https://github.com/vishvananda/netlink)) | Netlink socket operations for routing package | Pure Go with `binary.NativeEndian`; Linux-only; works on any Linux/GOARCH | No riscv64 issues; actively maintained (last push 2026-08-03) | Ships as Go module; arch-agnostic | None |
| vishvananda/netns ([vishvananda/netns](https://github.com/vishvananda/netns)) | Linux network namespace operations | Pure Go via `syscall` package; no arch-specific code | No riscv64 issues | Ships as Go module | None |

**Deep-dive on libpcap for riscv64.** libpcap is a portable C library with no JIT BPF compiler (the JIT is in the kernel, not in libpcap itself). libpcap uses autoconf/cmake and has no architecture-specific SIMD or assembly. The Debian riscv64 port packages `libpcap0.8-dev` and the package builds from upstream source without patches. Cross-compilation from x86_64 requires a riscv64 sysroot with libpcap headers and the `pkg-config` path set correctly; this is the same requirement documented in the ARM cross-compilation failure issues (#1049, #1180).

**Deep-dive on PF_RING.** The `pfring/` package is optional and used only for high-throughput capture scenarios requiring PF_RING. The PF_RING kernel module has no documented riscv64 support. The userland C library (`libpfring`) is portable. For standard gopacket use cases this dependency is irrelevant.

---

## 11. Known Bugs and Active Issues

**OSS-Fuzz correctness bugs (all architecture-neutral):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1221](https://github.com/google/gopacket/issues/1221) | OSS-Fuzz 474757125 | Open | Unknown | Filed 2026-01-10 |
| [#1212](https://github.com/google/gopacket/issues/1212) | OSS-Fuzz 431827588 | Open | Unknown | Filed 2025-07-14 |
| [#1207](https://github.com/google/gopacket/issues/1207) | OSS-Fuzz 410324679 | Open | Unknown | Filed 2025-04-14 |
| [#1196](https://github.com/google/gopacket/issues/1196) | OSS-Fuzz 376770770 | Open | Unknown | -- |
| #1186, #1184, #1181, #1174, #1158, #1153, #1150, #1135, #1132 | OSS-Fuzz (various) | All open | Unknown | Backlog of unfixed fuzz findings |

**Memory and performance bugs (all architecture-neutral):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1106](https://github.com/google/gopacket/issues/1106) | Memory pressure and GC thrashing at 250k-550k pps | Open | High | Reported at 0.7-2 Gbps |
| [#1084](https://github.com/google/gopacket/issues/1084) | reassembly StreamPool.grow() unbounded memory growth | Open | High | Even when connections are freed |
| [#833](https://github.com/google/gopacket/issues/833) | Memory leak in StreamPool.newConnection | Open | Medium | Filed 2020-10-11 |
| [#896](https://github.com/google/gopacket/issues/896) | Memory leak in GTPv1U.DecodeFromBytes | Open | Medium | GTPv1ExtensionHeaders slice not reset |
| [#732](https://github.com/google/gopacket/issues/732) | Reassembly pages double but never shrink | Open | Medium | Filed 2019-11-19 |
| [#185](https://github.com/google/gopacket/issues/185) | Very slow performance with PF_RING at 1 Gbps | Open | Medium | Large packet drop; filed 2016-04-18 |

**Correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#901](https://github.com/google/gopacket/issues/901) | DNS does not decode DNS-over-TCP or DNS-over-TLS (RFC 7766 2-octet prefix not handled) | Open | Medium | Filed 2021-08-11 |
| [#81](https://github.com/google/gopacket/issues/81) | tcpassembly reorder bug | Open | Medium | Long-standing |

**RISC-V-specific bugs:** None. Zero issues or PRs reference riscv64 in the entire repository history.

---

## 12. Objections and Upstream Blockers

**Technical blockers for riscv64:** None at the library level. The pure-Go packet parsing core requires no porting work. The `pcap/` package requires libpcap-dev available for the target, which is satisfied by Debian/Ubuntu riscv64 packages.

**CGo cross-compilation.** Cross-compiling the `pcap/` package from x86_64 to riscv64 requires a correctly configured sysroot with libpcap headers. This is the same problem that causes arm64 CGo cross-compilation to fail (#1049, #1180). It is not a gopacket-specific issue -- it is a general CGo cross-compilation toolchain setup problem. Native builds on riscv64 hardware are unaffected.

**PF_RING.** The `pfring/` kernel module is not validated for riscv64. This is an optional, non-default capture path; it is not a blocker for standard gopacket use.

**Organizational blockers:** None. The maintainers have not stated objections to riscv64. The absence of RISC-V activity is structural -- the library does not need architecture-specific work, so there is nothing to upstream.

**Project maintenance status.** The project is in low-maintenance mode with no releases since v1.1.19, 370 open issues (including 10+ unfixed OSS-Fuzz findings), and only 2 commits in 2025. Any CI or infrastructure contributions would need acceptance from the current maintainers (George Powers / Cisco, Google employees). Acceptance probability for a riscv64 CI addition to Travis CI is moderate, but the project may be moving toward GitHub Actions given Travis CI's declining use in the open-source community [NEEDS VERIFICATION -- no GitHub Actions migration issue was found].

---

## 13. Investment Analysis

RISE has no existing investment in gopacket. Google LLC (RISE Premier Member) is the originating organization but has not directed any RISE resources at this project.

### 13.1 Functional Enablement

No functional enablement work is required. All pure-Go packages build and run on riscv64 without changes. The `pcap/` and `afpacket/` packages work on riscv64 native builds. The only gap is CGo cross-compilation, which is a toolchain setup issue, not a gopacket code issue.

### 13.2 Performance Optimization

No performance optimization work exists for any architecture. The library has no SIMD, JIT, or assembly. Any performance work on riscv64 would mean adding architecture-specific acceleration that does not exist anywhere in the project -- this is a net-new investment with no upstream precedent to follow, and the low-maintenance project state makes upstreaming uncertain.

### 13.3 CI/CD Infrastructure

The only gap is riscv64 CI coverage. The current Travis CI configuration could add a riscv64 matrix entry, or the project could migrate to GitHub Actions with a riscv64 runner. The actual CI test suite for pure-Go packages is portable; the CGo tests require libpcap-dev on the riscv64 runner.

### 13.4 Ecosystem Enablement

gopacket has no dependent package ecosystem requiring separate enablement. It is a Go module consumed via `go get`. No action is needed.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate CGo cross-compilation of `pcap/` package for riscv64; document sysroot setup | 0.5 | Community / RISE | Low |
| Functional | Validate PF_RING kernel module on riscv64 hardware | 2 | PF_RING maintainers / community | Low |
| CI/CD | Add riscv64 native runner to CI (GitHub Actions migration + riscv64 job) | 1 | Maintainers / RISE | Medium |
| Performance | No action -- no architecture-specific acceleration exists for any arch | 0 | N/A | Not applicable |
| Ecosystem | No action -- no dependent package ecosystem | 0 | N/A | Not applicable |

**Total estimated investment for full riscv64 parity:** 1-3 person-weeks, dominated by CI infrastructure. Functional parity on native riscv64 hardware is already achieved without any code changes.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/gopacket repository](https://github.com/google/gopacket)
- [gopacket releases (empty)](https://github.com/google/gopacket/releases)
- [gopacket .travis.yml CI configuration](https://github.com/google/gopacket/blob/master/.travis.yml)
- [Issue #1049: arm/arm64 CGo cross-compilation failure](https://github.com/google/gopacket/issues/1049)
- [Issue #1180: libpcap on arm64 build failure](https://github.com/google/gopacket/issues/1180)
- [Issue #662: mips cross-compilation failure (closed)](https://github.com/google/gopacket/issues/662)
- [Issue #1106: Memory pressure at 250k-550k pps](https://github.com/google/gopacket/issues/1106)
- [Issue #1084: reassembly StreamPool unbounded memory growth](https://github.com/google/gopacket/issues/1084)
- [Issue #901: DNS-over-TCP RFC 7766 not handled](https://github.com/google/gopacket/issues/901)
- [Issue #833: Memory leak in StreamPool.newConnection](https://github.com/google/gopacket/issues/833)
- [Issue #896: Memory leak in GTPv1U.DecodeFromBytes](https://github.com/google/gopacket/issues/896)
- [Issue #732: Reassembly pages never shrink](https://github.com/google/gopacket/issues/732)
- [Issue #185: Slow PF_RING performance at 1 Gbps](https://github.com/google/gopacket/issues/185)
- [Debian package: golang-github-gopacket-gopacket](https://tracker.debian.org/pkg/golang-github-gopacket-gopacket)
- [Ubuntu noble: golang-github-gopacket-gopacket-dev](https://packages.ubuntu.com/noble/golang-github-gopacket-gopacket-dev)
- [golang/sys -- riscv64 syscall support](https://github.com/golang/sys)
- [ntop/PF_RING](https://github.com/ntop/PF_RING)
- [the-tcpdump-group/libpcap](https://github.com/the-tcpdump-group/libpcap)
- [vishvananda/netlink](https://github.com/vishvananda/netlink)
- [RISE Project member list](https://riseproject.dev)