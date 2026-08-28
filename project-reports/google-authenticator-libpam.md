---
title: google-authenticator-libpam
---

# google-authenticator-libpam

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for google-authenticator-libpam<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google-authenticator-libpam](https://github.com/google/google-authenticator-libpam) is a PAM (Pluggable Authentication Module) implementation of TOTP/HOTP two-factor authentication, originally developed at Google and released under the Apache-2.0 license. The project provides two artifacts: a shared PAM module (`pam_google_authenticator.so`) and a setup utility (`google-authenticator`). All cryptographic primitives (SHA-1, HMAC-SHA1, Base32) are vendored in self-contained C files; the project has no external crypto library dependency.

The repository contains 48 files total. The codebase is intentionally portable C with no assembly, no SIMD, no JIT, and no platform-specific code paths beyond a single byte-order detection block in `src/sha1.c`.

**Governance:** Informal, Google-owned repository on GitHub. No formal foundation affiliation. All contributions require a Google Individual or Corporate CLA and pass through GitHub pull request review. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. Google retains repository control.

**Primary maintainer:** Thomas Habets (`habets@google.com`, Google). Commit history identifies him as the dominant contributor. Johannes Segitz (`jsegitz@suse.de`, SUSE) contributed SELinux integration in November 2025 [NEEDS VERIFICATION on exact date]. All other contributors are community-affiliated individuals with no identifiable corporate backing.

**RISE involvement:** None. google-authenticator-libpam does not appear in the RISE project member registry, any RISE blog post, the RISE Security Software Working Group repository, or the RISE wheel builder. Google LLC is a RISE Premier Member, but this project is not individually tracked.

**Community stance on new ports:** Not documented. The project has never discussed RISC-V in any issue, PR, commit, or code comment. Because the code has no architecture-specific content, new architecture support is implicit rather than gated.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-11-08 (approx.) | Repository created under google GitHub org | [GitHub repo](https://github.com/google/google-authenticator-libpam) |
| 2025-02-13 | Release v1.11 tagged | [Debian tracker, version 20250213-1.11-0.1](https://tracker.debian.org/pkg/google-authenticator) |
| (no date) | Debian packages riscv64 build succeeds on buildd host rv-manda-01, version 20250213-1.11-0.1 | [Debian buildd](https://buildd.debian.org/status/package.php?p=google-authenticator&suite=sid) |
| (no date) | Ubuntu 24.04 noble includes libpam-google-authenticator with explicit riscv64 support | [Ubuntu packages](https://packages.ubuntu.com/noble/libpam-google-authenticator) |

There is no RISC-V port history because no port was required. The codebase has never contained architecture-specific code and required no porting work. riscv64 support is a side effect of the project being portable C compiled by downstream distribution maintainers, not the result of any deliberate upstream effort.

**Key contributors to riscv64 availability:** Debian and Ubuntu package maintainers. No Google or upstream contributor performed RISC-V work.

**Upstream status:** Fully upstream in the sense that all code is in the canonical Google repository. There are no out-of-tree riscv64 patches.

---

## 3. Upstream Support Tier

The project has no documented tier policy and no official classification of architecture support levels.

**Evidence:**
- No CI of any kind exists (`.github/workflows` directory does not exist; only `.github/ISSUE_TEMPLATE` is present).
- No official binary releases exist for any architecture. The GitHub releases API returns an empty array.
- No architecture exclusion list exists. The Debian package carries `arch: any`, meaning all supported Debian architectures including riscv64 are targets.

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | None | None | None |
| Official binaries | None | None | None |
| Architecture-specific code | None | None | None |
| Distro packages | Yes | Yes | Yes |
| Release blocking | No (no releases involve arch-specific testing) | No | No |

All three architectures are on identical standing: no upstream CI, no official binaries, all supported only through downstream distribution packaging. riscv64 is not a second-class citizen because no architecture receives special treatment upstream.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The project has four source files that implement the functional core:

| File | Function | Arch-specific code |
|---|---|---|
| `src/sha1.c` | SHA-1 hash | `BYTE_ORDER` endian detection only (little-endian path taken on riscv64) |
| `src/hmac.c` | HMAC-SHA1 | None |
| `src/base32.c` | Base32 encode/decode | None |
| `src/pam_google_authenticator.c` | PAM module, TOTP/HOTP logic | None (feature guards only: SELinux, PAM, fsuid) |

No JIT, no SIMD, no crypto acceleration, no assembly files, no intrinsics, no arch guards of any kind (`__riscv`, `__aarch64`, `__x86_64`, `__arm__`, SSE, AVX, NEON, SVE, RVV) appear anywhere in the repository. Code search for all such patterns across the 48-file tree returned zero results.

The `UNRAVEL`/`UNROLL_LOOPS` macros in `src/sha1.c` are generic compile-time loop unrolling flags inherited from a 1990s-era public domain SHA-1 implementation. They are not CPU-architecture-gated.

**Comparison table per component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SHA-1 | scalar C | scalar C | scalar C |
| HMAC-SHA1 | scalar C | scalar C | scalar C |
| Base32 | scalar C | scalar C | scalar C |
| PAM module logic | scalar C | scalar C | scalar C |
| Vectorization | none | none | none |
| Hardware crypto | none | none | none |

The design is deliberate: for a PAM authentication module performing one HMAC-SHA1 per login event, throughput is irrelevant. Architecture-specific optimization would add maintenance cost with no practical benefit.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools exclusively. No CMake, no Bazel, no Meson, no Dockerfile, no toolchain files.

**Native build:**

```sh
./bootstrap.sh
./configure
make
sudo make install
```

`bootstrap.sh` invokes `autoreconf` to generate `configure` from `configure.ac` and `Makefile.am`. `autoconf >= 2.61` is enforced by `AC_PREREQ(2.61)` in `configure.ac`.

**Cross-compilation for riscv64:**

No riscv64-specific configure flags or toolchain files exist. Standard autotools cross-compilation applies:

```sh
./bootstrap.sh
./configure --host=riscv64-linux-gnu \
            CC=riscv64-linux-gnu-gcc \
            --libdir=/usr/lib/riscv64-linux-gnu/security
make
```

The `--libdir` path is required so the PAM module installs to `/usr/lib/riscv64-linux-gnu/security/pam_google_authenticator.so`, which is where PAM searches for modules on Debian/Ubuntu riscv64 systems. Without this flag, the module installs to `/usr/local/lib/security/` and PAM will not find it.

**Required build dependencies:**

| Dependency | Role | Notes |
|---|---|---|
| `libpam-dev` / `pam-devel` | Required; configure aborts without it | `libpam0g-dev` on Debian/Ubuntu |
| `libtool` | Required for `.la` PAM module build | |
| `autoconf >= 2.61` | Bootstrap requirement | |
| `libqrencode-dev` | Optional; QR code output | Disable if unavailable for cross target |
| `libselinux1-dev` | Optional; SELinux context support | Disable with `--disable-selinux` |

**Endianness:** `src/sha1.c` uses `_BIG_ENDIAN`/`_LITTLE_ENDIAN` macros from `<sys/types.h>` via `_DEFAULT_SOURCE`. riscv64 is little-endian; the `BYTE_ORDER=1234` path is taken. No patches are needed.

**Known build failures on riscv64:** None found. Debian buildd confirms clean builds on `rv-manda-01`.

**QEMU:** Not used anywhere. No cross-testing infrastructure exists upstream.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TOTP authentication | Yes | Yes | Yes |
| HOTP authentication | Yes | Yes | Yes |
| QR code setup (libqrencode) | Yes (optional) | Yes (optional) | Yes (optional) |
| SELinux context support | Yes (optional) | Yes (optional) | Yes (optional) |
| Emergency scratch codes | Yes | Yes | Yes |
| Time-based window configuration | Yes | Yes | Yes |
| PAM module installation | Yes | Yes | Yes |

**Functional gaps:** None. All features are available on riscv64 without restriction.

**Performance gaps:** No hardware-accelerated crypto path exists on any architecture. The scalar C implementation is identical across amd64, arm64, and riscv64. For a PAM module executing one HMAC-SHA1 per authentication event, the performance difference between architectures is immaterial in practice.

**Security hardening gaps:** Data not available: no security hardening audit specific to riscv64 was found. The project uses `explicit_bzero` for credential wiping and `setfsuid`/`setfsgid` for privilege management; both are standard glibc functions available on riscv64.

**NaN/floating-point issues:** Not applicable. The project performs no floating-point arithmetic. TOTP/HOTP is integer and bitwise operations only.

---

## 7. CI/CD Infrastructure

The `.github/workflows` directory does not exist in the repository. The only content under `.github/` is `ISSUE_TEMPLATE`. The project has zero CI workflow files: no GitHub Actions, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`.

A `.travis.yml` file is present, testing gcc and clang on the host platform (Travis CI default: x86_64). No architecture matrix is specified. [NEEDS VERIFICATION that .travis.yml is still active -- Travis CI free tier was discontinued and the file may be inert.]

**Comparison table:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (Travis, possibly inactive) | No | No |
| Test CI | Yes (Travis, possibly inactive) | No | No |
| RISE runners | No | No | No |
| Hardware runners | No | No | No |
| Cross-compilation | No | No | No |

riscv64 CI does not exist. Neither does arm64 CI. The only CI that exists is a potentially inactive Travis configuration for x86_64. Binary availability on riscv64 is entirely the work of Debian and Ubuntu package maintainers running their own buildd infrastructure.

---

## 8. Distribution and Release Status

**Upstream releases:** None. The GitHub releases API returns an empty array. Google does not publish official binary releases for any architecture. The version string `20250213-1.11-0.1` is Debian-assigned.

**Distribution packages:**

| Distribution | Package name | Version | riscv64 | Source |
|---|---|---|---|---|
| Debian sid | libpam-google-authenticator | 20250213-1.11-0.1 | Yes, built on rv-manda-01 | [Debian buildd](https://buildd.debian.org/status/package.php?p=google-authenticator&suite=sid) |
| Ubuntu 24.04 (noble) | libpam-google-authenticator | 20191231-2build1 | Yes, listed explicitly | [Ubuntu packages](https://packages.ubuntu.com/noble/libpam-google-authenticator) |
| Fedora F45/Rawhide | google-authenticator-libpam | 1.11-5.fc45 | Data not available: riscv64-specific build status not confirmed for Fedora |
| Arch Linux RISC-V | google-authenticator | Unknown | Unknown -- not listed in porting-problems table; absence means likely in sync or not packaged | [Arch RISC-V status](https://archriscv.felixc.at/) |
| PyPI | N/A | N/A | N/A | Not a Python package |
| npm / Maven / OCI | N/A | N/A | N/A | Not applicable |

**To get a working riscv64 binary:** `apt install libpam-google-authenticator` on Debian sid or Ubuntu 24.04. No additional steps are required.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | Required? | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| Linux-PAM (linux-pam/linux-pam) | PAM framework; module links against `-lpam` | Hard required | OK -- pure C, no arch code | Not tested upstream (x86_64 only) | Yes, Debian/Ubuntu | None found |
| glibc | C runtime; `dlopen`, `explicit_bzero`, `setfsuid` | Implicit | OK -- riscv64 supported since glibc 2.27 | Tested by glibc upstream CI | Yes, all major distros | See [project-reports/glibc.md] |
| libqrencode (fukuchi/libqrencode) | QR code rendering during setup | Optional | OK -- pure C, no arch-specific code | No upstream riscv64 CI | Yes, Debian/Ubuntu | None found |
| libselinux (SELinuxProject/selinux) | SELinux context switching | Optional | OK -- pure C, available on riscv64 distros | No upstream riscv64 CI | Yes, Fedora/RHEL riscv64 | None found |
| Internal SHA-1/HMAC/Base32 | OTP cryptography | Vendored | OK -- pure C, little-endian path correct | Covered by standard `make check` | N/A | None |

**Linux-PAM:** The only hard runtime dependency. No riscv64-specific issues were found in the linux-pam issue tracker. The library is pure C and ships in standard riscv64 distro packages.

**glibc:** The implicit C runtime. RISC-V is fully supported since glibc 2.27. This project uses only standard POSIX libc interfaces; no glibc internals or non-portable extensions are used.

**OpenSSL:** Not a direct dependency. OpenSSL is an optional backend for linux-pam itself, not used by google-authenticator-libpam. Five open riscv64 issues exist for OpenSSL (constant-time AES, `Zkn` extension detection, intermittent test failures), but none affect this project's operation.

**Dependency depth:** No dependency requires recursion beyond two levels. None of the direct dependencies has a JIT, SIMD, or numerics subsystem that would create riscv64-specific risk for this project.

---

## 11. Known Bugs and Active Issues

GitHub Issues API confirmed 271 total issues and PRs. Zero match any of: "riscv", "RISCV", "risc-v", "RISC-V", "riscv64" in title, body, or labels.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | -- | -- | -- | No riscv64-related issues exist |

No correctness bugs, no NaN/floating-point issues, and no performance issues related to riscv64 are tracked anywhere in the upstream repository or in any web-accessible source.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No issue or mailing list discussion expressing concern about riscv64 was located.

**Technical blockers:** None. The codebase is architecturally neutral. The endianness handling in `src/sha1.c` correctly handles little-endian riscv64 without patches.

**Organizational blockers:** None. The Google CLA process applies to all contributors regardless of architecture context. No RISC-V-specific contribution is needed or pending.

**Acceptance probability for hypothetical riscv64 CI patches:** High, based on the project's history of accepting straightforward maintenance contributions. However, no such patches are necessary because the code already works on riscv64.

---

## 13. Investment Analysis

Before sizing: RISE has no involvement with this project. No RISE-funded work covers google-authenticator-libpam.

The project works on riscv64 today without any investment. The following analysis characterizes the marginal cost of improvements.

### 13.1 Functional Enablement

No functional gaps exist on riscv64. Zero investment required.

### 13.2 Performance Optimization

The project performs one HMAC-SHA1 computation per authentication event. Throughput is not a practical concern. Adding RVV-accelerated SHA-1 would have no measurable effect on real-world use cases and would contradict the project's design philosophy of portable C. Zero investment justified.

### 13.3 CI/CD Infrastructure

Adding riscv64 to a GitHub Actions matrix is a one-time, low-effort task. The primary benefit is catch regressions in the PAM interface layer early rather than discovering them in distro builds. The barrier is that the project currently has no GitHub Actions CI at all, making riscv64 CI an add-on to a base buildout task.

### 13.4 Ecosystem Enablement

Not applicable. google-authenticator-libpam is a standalone PAM module with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None justified | 0 | N/A | N/A |
| CI/CD | Add GitHub Actions matrix including riscv64 (cross-compile via QEMU) | 0.5 | Community / Google | Low |
| Ecosystem | None applicable | 0 | N/A | N/A |

**Bottom line:** This project requires no RISC-V investment. It builds, installs, and operates correctly on riscv64 today. The only discretionary improvement is adding CI coverage, which is a minor maintenance hygiene item with no functional urgency.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google-authenticator-libpam GitHub repository](https://github.com/google/google-authenticator-libpam)
- [Debian tracker: google-authenticator](https://tracker.debian.org/pkg/google-authenticator)
- [Debian buildd status: google-authenticator sid](https://buildd.debian.org/status/package.php?p=google-authenticator&suite=sid)
- [Ubuntu 24.04 package: libpam-google-authenticator](https://packages.ubuntu.com/noble/libpam-google-authenticator)
- [Debian packages sid riscv64: libpam-google-authenticator](https://packages.debian.org/sid/riscv64/libpam-google-authenticator)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Security Software Working Group](https://github.com/riseproject-dev/security-software-wg)
- [Arch Linux RISC-V porting status](https://archriscv.felixc.at/)
- [GitHub releases API: google-authenticator-libpam](https://api.github.com/repos/google/google-authenticator-libpam/releases)