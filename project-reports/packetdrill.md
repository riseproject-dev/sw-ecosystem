---
title: packetdrill
parent: Project Reports
---

# packetdrill

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for packetdrill<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

packetdrill is a network stack correctness testing tool developed at Google. It executes script-driven test cases that define expected sequences of TCP/IP packets, injects and captures packets via Linux TUN devices or libpcap, and passes or fails each test based on whether the kernel's network stack behavior matches the script. It is not a benchmarking tool and produces no throughput or latency metrics.

The project is hosted at [github.com/google/packetdrill](https://github.com/google/packetdrill). It is licensed under GPL-2.0-or-later. There is no foundation affiliation, no steering committee, no TSC, and no CLA beyond a Signed-off-by requirement. The supported operating systems are Linux, FreeBSD, OpenBSD, and NetBSD, each with a dedicated Makefile. There is no CPU-architecture-level support documentation.

**Governance and corporate maintainers:**

Neal Cardwell (Google, NYC) is the sole effective gatekeeper. Every commit in the 196-commit history is either authored or reviewed by nealcardwell. He has committed every external contribution since the initial commit on 2013-06-26. wdebruij (GitHub handle; consistent with Google employment based on fork activity against google/psp and google/syzkaller) is the second most active contributor and authored the May 2026 PSP support series. Matthieu Baerts (previously Tessares, Belgium) contributed run_all.py improvements and test fixes. Eric Dumazet (Google) authored TCP_TX_DELAY fixes. Other occasional contributors include tuexen (FreeBSD), rscheff (AccECN), and Ilpo Jarvinen (Linux kernel).

**Community stance on new ports:** Issue [#85](https://github.com/google/packetdrill/issues/85) (opened July 2024, still open August 2026) documents that external PR [#76](https://github.com/google/packetdrill/pulls/76) from a Red Hat engineer went unacknowledged for over a year despite mailing-list follow-up. Of 19 open pull requests, the oldest dates to March 2018 (PR #7). Neal Cardwell does land external patches selectively but with significant delays. A RISC-V port contribution would face this same queue with no clear acceptance timeline.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2013-06-26 | Initial commit; Linux, BSD support from day one | [github.com/google/packetdrill](https://github.com/google/packetdrill) |
| -- | No RISC-V commit, issue, or PR has ever been filed | GitHub code/commit/issue search (0 results) |

There is no RISC-V port history. GitHub code search for `riscv`, `riscv64`, `rvv`, and `__riscv` across the entire google/packetdrill repository returned zero results. No commit, issue, or pull request mentioning RISC-V exists in the repository's history.

---

## 3. Upstream Support Tier

packetdrill has no formal tier policy document. The project defines supported platforms implicitly by the presence of per-OS Makefiles: `Makefile.Linux`, `Makefile.FreeBSD`, `Makefile.OpenBSD`, `Makefile.NetBSD`. CPU architecture is not part of the support matrix in any documented form.

There is no CI of any kind. The repository has no `.github/workflows/` directory, no `.travis.yml`, no `.circleci/` configuration, and no Jenkinsfile. The only automation present is a CodeQL security scanning workflow [NEEDS VERIFICATION - inferred from RISE verification output; primary CI absence is confirmed]. No release artifacts exist; the GitHub Releases API returns an empty array.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official support tier | Supported (de facto) | Not documented | Not documented |
| CI jobs | None | None | None |
| Release binaries | None (source-only) | None | None |
| Packaged in Debian | No | No | No |
| Packaged in Ubuntu | No | No | No |

The absence of CI is uniform across all architectures; riscv64 is not uniquely disadvantaged relative to amd64 or arm64 in terms of CI coverage. All three have none.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

packetdrill is a pure C userspace tool. It has no JIT compiler, no SIMD dispatch, no crypto acceleration, and no compute-intensive inner loop. The full 334-file repository contains zero architecture-specific source files, zero assembly (.S) files, and zero `#ifdef __riscv`, `#ifdef __aarch64__`, or `#ifdef __x86_64__` guards anywhere in the codebase.

The platform abstraction layer (`platforms.h`) branches only on OS identity (linux, FreeBSD, OpenBSD, NetBSD), not CPU identity.

**Architecture-relevant code:**

`checksum.c` contains the following loop in `ip_checksum_partial()`:
```c
const u32 *p32 = (const u32 *)(p);
for (; len >= sizeof(*p32); len -= sizeof(*p32))
    sum += *p32++;
```
The comment at that location reads: "We take advantage of intel's ability to do unaligned memory accesses with minimal additional cost. Other architectures probably want to be more careful here." This is a prose comment with no corresponding `#ifdef` branch. On riscv64, the Linux kernel handles unaligned accesses in software via trap emulation (or hardware, on implementations that support it), so this does not cause a crash but may produce a trap penalty on hardware that does not handle unaligned 32-bit loads natively. No issue has been filed for this.

`unaligned.h` uses portable byte-by-byte big-endian helpers (`get_unaligned_be32`/`put_unaligned_be32`) via explicit byte shifts. This is fully portable.

`ip.h` uses `#if __BYTE_ORDER == __LITTLE_ENDIAN` for IPv4 header bitfield ordering. riscv64 is little-endian; this path is taken correctly.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core C (packet parsing, scripting) | scalar C | scalar C | scalar C (no port required) |
| Assembly / SIMD | missing | missing | missing |
| Crypto acceleration | n/a | n/a | n/a |
| JIT backend | n/a | n/a | n/a |
| Endianness handling | correct (LE) | correct (LE) | correct (LE) |
| Unaligned access in checksum.c | hardware-native | hardware-native | trap or emulation (latent risk) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build method (Makefile):**
```
cd gtests/net/packetdrill
./configure
make
```
The `configure` script is a one-liner that symlinks `Makefile` to `Makefile.$(uname)`. On Linux this selects `Makefile.Linux`.

`Makefile.Linux` links against `-lpthread -lrt -ldl`. With `ENABLE_PSP=1` it additionally requires `libssl-dev` and the `ynl-c` git submodule, adding `-lcrypto`.

**Alternative build method (CMake):**
```
cd gtests/net/packetdrill
mkdir build && cd build
cmake ..
make
```
CMake minimum version: 3.5.1. Links against `pthread`, `pcap`, and `dl`.

**Required toolchain:** gcc, make, bison, flex. No minimum GCC version is documented anywhere in the repository.

**Optional PSP build:**
```
make ENABLE_PSP=1
```
Requires: `sudo apt install libssl-dev` and `git submodule update --init --recursive` to pull `linux-netdev/ynl-c`.

**Cross-compilation:** No cross-compilation infrastructure exists. There are no cmake toolchain files, no Dockerfiles, and no `-march=rv*` flags anywhere in the build system.

**QEMU:** Not referenced anywhere in the repository. For riscv64 testing, a QEMU system emulation guest with `CONFIG_TUN=y` would be the natural approach, but this is not documented or scripted upstream.

**Known build failures on riscv64:** None filed. Issue [#38](https://github.com/google/packetdrill/issues/38) documents a build failure on i386, which is the closest analog to an architecture-specific build issue. No equivalent issue exists for riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

packetdrill's feature set is determined entirely by the OS-level capabilities it exercises (TUN, socket options, packet injection). No feature is gated on CPU architecture. The `platforms.h` feature flags (HAVE_OPEN_MEMSTREAM, HAVE_FMEMOPEN, HAVE_TCP_INFO, etc.) are all available on riscv64 Linux.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TCP/UDP/ICMP scripting | yes | yes | expected yes (no validation) |
| PSP encryption (ENABLE_PSP=1) | yes | yes | expected yes; OpenSSL AES-GCM issues apply (see section 9) |
| TUN device injection | yes | yes | expected yes (CONFIG_TUN arch-independent) |
| libpcap capture | yes | yes | expected yes (libpcap available) |
| Multi-OS (FreeBSD/OpenBSD/NetBSD) | yes | yes | not applicable (no BSDs ship riscv64) |

**Functional gaps:** None identified by design analysis. No feature requires architecture-specific code.

**Performance gaps:** The checksum loop in `checksum.c` does not use any SIMD acceleration on any architecture. There is no vectorized path to be missing on riscv64. Performance parity with amd64 and arm64 is expected.

**Security hardening gaps:** Data not available: no upstream security hardening documentation was found for any architecture.

**Floating-point / NaN semantics:** Not applicable. packetdrill is a network packet scripting tool with no floating-point computation.

---

## 7. CI/CD Infrastructure

The google/packetdrill repository has no CI configuration of any kind. The `.github/` directory does not exist (GitHub Contents API returns HTTP 404). No `.travis.yml`, `.circleci/`, `.cirrus.yml`, `.gitlab-ci.yml`, or Jenkinsfile is present.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI jobs exist | no | no | no |
| QEMU emulation | no | no | no |
| RISE-provided runners | no | no | no |
| Hardware-in-the-loop | no | no | no |
| Release-blocking tests | no | no | no |

RISE Project involvement: None. RISE blog and project search for "packetdrill" returned zero results. Google LLC is a RISE Premier Member, but packetdrill is not individually represented in any RISE working group or project.

---

## 8. Distribution and Release Status

packetdrill has no published release artifacts of any kind. The GitHub Releases API returns an empty array. The project is source-only.

| Channel | riscv64 availability |
|---|---|
| GitHub Releases | No releases published for any architecture |
| PyPI | Package does not exist (HTTP 404) |
| Debian (any suite) | Not packaged; packages.debian.org returns no results |
| Ubuntu 24.04 (noble) | Not packaged; packages.ubuntu.com returns no results |
| Arch Linux / AUR | Not found in available search results |

To obtain a working binary on riscv64 a user must build from source using the Makefile method described in section 5.

---

## 9. Dependencies

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| libpcap | Packet capture back-end | PASS (Debian sid 1.10.6-2 installed on rv-osuosl-01 buildd) | No riscv64-specific CI visible | v1.10.6 available on Debian riscv64 | None |
| OpenSSL libcrypto | PSP AES-128-GCM (optional: ENABLE_PSP=1 only) | Builds; Debian sid 3.6.4-1 shows Needs-Build (queue, not failure) | Intermittent: #30880 flaky lhash test on riscv64 CI | 3.x packaged for riscv64 | #20980 (AES non-constant-time without Zkn); #30330 (logic bug in rv64i_zkne_set_encrypt_key); #25334 (Zknd+Zkne must both be set in OPENSSL_riscvcap); #30880 (flaky test) |
| bison | Build-time parser generator | PASS (Debian sid 3.8.2 installed on riscv64) | n/a (build tool) | Available | None |
| flex | Build-time lexer generator | PASS (Debian sid 2.6.4 installed on riscv64) | n/a (build tool) | Available | None |
| ynl-c (linux-netdev/ynl-c) | Netlink/YNL for PSP kernel config (optional: ENABLE_PSP=1 only) | Expected PASS (pure-C generated code, no arch-specific paths) | No riscv64 issues found | No releases; git submodule pinned to kernel net-next | None |
| glibc (pthreads, libdl, librt) | Threading, dynamic linking, realtime clocks | PASS (glibc riscv64 is mature) | Covered by glibc test suite | Available | None |
| Linux kernel TUN/tap | Virtual network device for packet injection | PASS (CONFIG_TUN is arch-independent) | Exercised by packetdrill test suite at runtime | n/a | None |
| GCC / C toolchain | Build-time compiler | PASS (riscv64 GCC toolchain is production-grade) | n/a | Available | None |
| Python 3 | run_all.py test runner (optional) | PASS | n/a | Available | None |

**OpenSSL deep-dive (PSP path only):**

Four open riscv64-specific issues in openssl/openssl affect the optional PSP encryption path:

- [#20980](https://github.com/openssl/openssl/issues/20980): AES falls back to non-constant-time T-table implementation on hardware without Zkn extensions. Security issue for production use of PSP on boards without Zkn (most current RISC-V hardware). Does not block compilation or functional testing.
- [#30330](https://github.com/openssl/openssl/issues/30330): Logic bug in `rv64i_zkne_set_encrypt_key` - null-key check inverted. Affects AES-GCM correctness when using Zkne hardware acceleration.
- [#25334](https://github.com/openssl/openssl/issues/25334): Both `_zknd` and `_zkne` must be set simultaneously in `OPENSSL_riscvcap`; setting only one causes silent fallback to software path.
- [#30880](https://github.com/openssl/openssl/issues/30880): Intermittent `test_lhash` failure on riscv64 CI (likely memory ordering or timing flake).

For packetdrill base usage (network stack testing without PSP), there are no blocking riscv64 dependency issues. For PSP-enabled builds, OpenSSL issues #30330 and #20980 should be resolved before relying on AES-GCM on riscv64 hardware.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#92](https://github.com/google/packetdrill/issues/92) | Several tests failed with 6.13 kernel | Open | Medium | Kernel version regression; architecture-agnostic |
| [#85](https://github.com/google/packetdrill/issues/85) | External PR unacknowledged for 1+ year | Open | Organizational | Documents maintainer inactivity; affects any port contribution |
| [#84](https://github.com/google/packetdrill/issues/84) | Coredump issue | Open | High | Crash/stability bug; architecture-agnostic |
| [#38](https://github.com/google/packetdrill/issues/38) | Compilation failure on i386 | Open | Medium | Architecture-specific build failure; closest analog for riscv64 |
| [#23](https://github.com/google/packetdrill/issues/23) | Some tests are unstable | Open | Medium | Non-deterministic test outcomes; architecture-agnostic |
| -- | Unaligned access in ip_checksum_partial (checksum.c) | No issue filed | Low | Cast of unaligned void* to u32* with comment noting x86 assumption. No bug filed, no fix merged. On riscv64 hardware without native unaligned support this may trigger trap emulation. |

No RISC-V-specific bugs or correctness issues are filed in the google/packetdrill tracker. The unaligned access in `checksum.c` is the sole latent risk identified by code analysis.

---

## 12. Objections and Upstream Blockers

**Organizational blocker - maintainer bottleneck:** Neal Cardwell is the sole gatekeeper. Issue #85 documents over 12 months of no response to an external PR from a Red Hat engineer. PR #7 has been open since March 2018. Any RISC-V contribution faces this queue with no committed review SLA.

**No stated objections to RISC-V:** No upstream issue, PR, or mailing-list thread has documented any objection to RISC-V support. The absence is not hostility; it is inattention.

**No technical blockers:** The codebase is portable C with no architecture-specific dependencies. The only remediation needed is the unaligned-access comment in `checksum.c`, which is low-risk on mainstream riscv64 Linux (kernel handles unaligned traps). There is no JIT to port, no SIMD to implement, and no ABI incompatibility.

**Acceptance probability:** The probability that a clean, tested, minimal patch (adding a `#pragma` or explicit alignment annotation in `checksum.c`, plus a riscv64 note in the README) would be accepted is high if Neal Cardwell is engaged directly. The probability that it will be reviewed within 6 months without direct engagement is low based on the observed PR queue.

---

## 13. Investment Analysis

RISE has done no prior work on packetdrill. No RISE blog post, wheel builder entry, or working group covers this project.

### 13.1 Functional Enablement

packetdrill is already functionally portable to riscv64 by design. No architecture-specific code is needed. The one item worth fixing is the unaligned-access path in `ip_checksum_partial` in `checksum.c`: adding an explicit alignment assertion or byte-wise fallback for non-aligned inputs would eliminate the latent trap risk on strict-alignment hardware. Estimated effort: 1-2 days including testing.

### 13.2 Performance Optimization

Not applicable. packetdrill has no compute-intensive path. It operates at socket/TUN device speed; its performance is dominated by kernel round-trips, not userspace CPU cycles. No SIMD or ISA-specific optimization is relevant.

### 13.3 CI/CD Infrastructure

No CI exists for any architecture. Adding riscv64 CI requires first adding CI at all. A minimal GitHub Actions matrix running the test suite on amd64 and riscv64 (via QEMU) would be the complete deliverable. Estimated effort: 1 week including upstreaming negotiation.

### 13.4 Ecosystem Enablement

Not applicable. packetdrill has no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix unaligned-access in checksum.c; add riscv64 note to README | 0.5 | Qualcomm or community contributor | Low |
| CI/CD | Add GitHub Actions matrix (amd64 + riscv64 via QEMU) | 1 | Qualcomm or RISE contributor | Medium |
| Functional | Validate full test suite on riscv64 hardware or QEMU | 0.5 | Internal | Medium |

**Total estimated investment: ~2 person-weeks.** This is low-cost work. packetdrill is a tool used to validate TCP/IP stack correctness; having it run verified on riscv64 is valuable for any RISC-V Linux kernel networking work. The primary risk is not technical but organizational: maintainer review latency.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/packetdrill repository](https://github.com/google/packetdrill)
- [google/packetdrill Issues](https://github.com/google/packetdrill/issues)
- [google/packetdrill Pull Requests](https://github.com/google/packetdrill/pulls)
- [Issue #85 - external PR unacknowledged](https://github.com/google/packetdrill/issues/85)
- [Issue #84 - coredump issue](https://github.com/google/packetdrill/issues/84)
- [Issue #92 - tests failed with 6.13 kernel](https://github.com/google/packetdrill/issues/92)
- [Issue #38 - compilation failure on i386](https://github.com/google/packetdrill/issues/38)
- [Issue #23 - unstable tests](https://github.com/google/packetdrill/issues/23)
- [OpenSSL issue #20980 - AES non-constant-time without Zkn](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #30330 - rv64i_zkne_set_encrypt_key logic bug](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #25334 - Zknd+Zkne must both be set](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #30880 - flaky lhash test on riscv64](https://github.com/openssl/openssl/issues/30880)
- [RISE Project members](https://riseproject.dev/members/)
- [Debian tracker - packetdrill (no results)](https://tracker.debian.org/pkg/packetdrill)
- [Ubuntu packages - packetdrill (no results)](https://packages.ubuntu.com/search?keywords=packetdrill)
- [PyPI - packetdrill (404)](https://pypi.org/pypi/packetdrill/json)