---
title: libcap
categories:
  - libraries
---

# libcap

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libcap
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libcap is the reference C library for Linux POSIX capabilities (`capget`/`capset`/`prctl`). It also provides libpsx (POSIX Semantics for Linux threads, implementing capability syscalls atomically across all threads), pam\_cap (a PAM module), and Go packages `cap` and `psx` under `kernel.org/pub/linux/libs/security/libcap`. The canonical source is at [git.kernel.org/pub/scm/libs/libcap/libcap.git](https://git.kernel.org/pub/scm/libs/libcap/libcap.git) (currently blocked by Anubis bot protection; research was conducted via the [AndrewGMorgan/libcap\_mirror](https://github.com/AndrewGMorgan/libcap_mirror) GitHub mirror).

**Governance:** No formal foundation. Hosted under kernel.org infrastructure. Single-maintainer model: Andrew G. Morgan (`morgan@kernel.org`), who holds a personal kernel.org alias; no corporate employer is identified in any source, commit metadata, or project documentation.

**License:** BSD-3-Clause OR GPL-2.0-only for libcap, libpsx, and the Go packages. `pam_cap.so` carries a separate license.

**RISE Project:** libcap is not a RISE Project member or focus area. No RISE blog post, no RISE-funded work, and no entry in the RISE runner subscriber list mentions libcap. Confirmed by full scan of [riseproject.dev/blog](https://riseproject.dev/blog) (all 27 posts) and the RISE wheel builder package list (82 packages).

**Community stance on new ports:** Permissive and incremental. The established pattern is: (1) add the architecture to the supported-architectures preprocessor guard, then (2) add the SA\_RESTORER trampoline in a follow-on commit as needed. New architecture contributions are welcomed; the maintainer has actively expanded support to m68k, sparc, ARC, Microblaze, OpenRISC, and Xtensa in the 2025 cycle.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2025-02 | riscv64 not present in `psx/psx_calls.c` architecture guard; `__riscv` macro never defined by GCC so RISC-V silently fell through to `#error` | [commit dfb0fc2 context](https://github.com/AndrewGMorgan/libcap_mirror/commit/dfb0fc2) |
| ~2025-02-22 | Commit dfb0fc2: "Add riscv support for the psx mechanism." -- adds `|| defined(__riscv)` to the architecture support gate in `psx/psx_calls.c`. Motivated by kernel bugzilla #219687 (not accessible; Anubis-blocked). | [AndrewGMorgan/libcap\_mirror commit dfb0fc2](https://github.com/AndrewGMorgan/libcap_mirror/commit/dfb0fc2) |
| 2025-03-02 | libcap 2.74 released; release notes explicitly list riscv among the architectures fixed in the multi-arch PSX mechanism fix. | [sites.google.com/site/fullycapable/release-notes-for-libcap](https://sites.google.com/site/fullycapable/release-notes-for-libcap) |
| 2025-03-23 | Commit bbd8832: extends SA\_RESTORER support to m68k and sparc; removes the `linux/riscv64` TODO comment from the SA\_RESTORER block, confirming riscv64 was considered complete. | [AndrewGMorgan/libcap\_mirror commit bbd8832](https://github.com/AndrewGMorgan/libcap_mirror/commit/bbd8832) |
| 2025-04-13 | libcap 2.76 released; bbd8832 included. riscv64 TODO removal shipped. | [release notes](https://sites.google.com/site/fullycapable/release-notes-for-libcap) |
| 2026-04-06 | libcap 2.78 released (current stable). Debian sid builds libcap2 1:2.78-1 on riscv64 hardware (rv-osuosl-05) with all tests passing. | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=libcap2&suite=unstable) |

**Key contributor:** Andrew G. Morgan (`morgan@kernel.org`) authored all RISC-V-related commits. No external corporate contributor drove the port.

**Upstreaming status:** Complete. All RISC-V support is in the upstream master branch and in all releases from 2.74 onward. No out-of-tree patches are required.

**Technical note on the port:** The root cause of the original omission was a macro inconsistency: GCC defines the RISC-V architecture as `__riscv` (no trailing double underscores), diverging from the convention used by most other arch macros. The fix was a 3-line preprocessor change.

---

## 3. Upstream Support Tier

libcap has no formal tier policy. Architecture support is implicit: any architecture where the Linux `capget`/`capset` syscalls work is supported for the core libcap library. The libpsx signal-propagation mechanism requires additional per-arch handling (presence or absence of SA\_RESTORER), which is added incrementally.

On Linux/riscv64 the kernel handles signal frame restoration natively; no userspace SA\_RESTORER trampoline is needed. The absence of a restorer trampoline for riscv64 is architecturally correct, not a gap.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core libcap (`capget`/`capset`) | Yes | Yes | Yes |
| libpsx PSX mechanism | Yes | Yes | Yes (since 2.74) |
| SA\_RESTORER trampoline | Yes | Not needed (kernel handles) | Not needed (kernel handles) |
| `pam_cap` module | Yes | Yes | Yes |
| Go `cap`/`psx` packages | Yes | Yes | Yes |
| Builds in upstream source | Yes | Yes | Yes |
| Release-blocking CI | No | No | No |
| Upstream distributes binary | No | No | No |

There is no upstream tier distinction between architectures. All architectures are treated as community-supported because the project has no CI whatsoever.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libcap contains no architecture-specific subsystems. The library is implemented entirely in portable C using standard Linux syscalls. There is no JIT, no SIMD, no crypto implementation, no GC, and no hand-written assembly in the shipping library code.

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Core capability syscalls | Generic `syscall(SYS_capget, ...)` / `syscall(SYS_capset, ...)` in portable C | Scalar C | Scalar C | Scalar C |
| PSX signal propagation (`psx/psx_calls.c`) | Preprocessor-gated C; no assembly | Scalar C | Scalar C | Scalar C (since 2.74) |
| SA\_RESTORER trampoline | Hand-coded assembly stubs for platforms that need userspace restorer | x86\_64/i386 stubs | Not needed | Not needed |
| `cap` and `psx` Go packages | Pure Go; uses `syscall.AllThreadsSyscall()` on go1.16+ | Go | Go | Go |
| `pam_cap` | Portable C | C | C | C |

The `contrib/bug216610/go/fibber/` directory contains architecture-specific Go assembly stubs for `linux_amd64` and `linux_arm` only; no `linux_riscv64` stub is present. This directory is a non-shipping example, not part of the library or any installed package.

**ISA extensions:** None required or used. No floating-point, no vector, no crypto extensions are used anywhere in libcap.

**v2.73 note:** libcap 2.73 switched from `getdents()` to `getdents64()`. On riscv64, `getdents()` (the 32-bit variant) is absent from the kernel ABI; `getdents64()` is correct. This change was required for riscv64 correctness and is present in all versions from 2.73 onward.

---

## 5. Build System, Cross-Compilation, and Toolchain

libcap uses a pure GNU Make build system (no CMake, no autoconf/configure). The `Make.Rules` file (readable at [sources.debian.org](https://sources.debian.org/src/libcap2/1%3A2.78-1/Make.Rules/)) defines all toolchain variables.

**Cross-compilation for riscv64 (minimal, no PAM, no Go, static):**

```
make CROSS_COMPILE=riscv64-linux-gnu- \
     BUILD_CC=gcc \
     PAM_CAP=no \
     GOLANG=no \
     SHARED=no \
     DYNAMIC=no \
     all
```

The `CROSS_COMPILE` prefix sets `CC`, `AR`, `RANLIB`, and `OBJCOPY`. `BUILD_CC` and `BUILD_CFLAGS` set the host-side compiler separately, which is required when the build host differs from the target. This split was established in v2.44.

**Required toolchain versions:**

- **GCC:** No hard minimum documented. Any GCC supporting C89 and standard Linux headers is sufficient. GCC 10+ (as in Debian Bullseye and Ubuntu 20.04) is used in Debian packaging.
- **Go:** Hard minimum is **go1.16**. This is because `syscall.AllThreadsSyscall()` and `syscall.AllThreadsSyscall6()`, introduced in go1.16, are required for libpsx to execute syscalls on all OS threads simultaneously. Before go1.16, CGo was mandatory and the pre-1.16 path is documented as "fragile and may hang" (kernel.org bugzilla #219478 [NEEDS VERIFICATION -- bugzilla blocked by Anubis]). v2.72 explicitly dropped pre-go1.16 support. On riscv64 with go1.16+, `CGO_ENABLED=0` pure-Go builds work correctly.
- **gperf >= 3.1:** Build-time only; generates the capability name lookup hash table. Falls back to a linear scan if absent.
- **mips32 caveat:** v2.74 release notes state mips32 requires a newer Go compiler than Debian's default. No equivalent caveat exists for riscv64.

**QEMU:** No QEMU usage is documented or configured in libcap's own build system or CI. The upstream CI (see Section 7) runs only on x86\_64. For riscv64 testing, native hardware or OS-level binfmt\_misc emulation is the expected path, not a Makefile-integrated QEMU step.

**Known build failures on riscv64:** None. Debian sid libcap2 1:2.78-1 builds and installs cleanly on riscv64 (build host rv-osuosl-05). The only active FTBFS bug ([Debian #1100408](https://bugs.debian.org/1100408)) references mips64el and powerpc; riscv64 is not mentioned.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| `capget` / `capset` syscall interface | Full | Full | Full | None |
| libpsx POSIX thread semantics | Full | Full | Full (since 2.74) | None |
| `pam_cap` PAM module | Full | Full | Full | None |
| Go `cap` package | Full | Full | Full | None |
| Go `psx` package | Full | Full | Full | None |
| `setcap` / `getcap` / `capsh` utilities | Full | Full | Full | None |
| `contrib/bug216610` example | Has riscv64 stub? | Data not available: no linux\_arm64 stub noted in research | No linux\_riscv64.s stub | Example only; not shipped |
| Security hardening flags | `-fPIC -Wall` etc. (arch-neutral) | Same | Same | None |

**Functional gaps:** None in the shipping library or tools.

**Performance gaps:** Not applicable. libcap is a thin syscall wrapper with no compute-intensive paths. No benchmark data exists for any architecture.

**Floating-point / NaN semantics:** Not applicable. libcap performs no floating-point arithmetic.

**Security hardening:** No arch-specific hardening is applied; all flags in `Make.Rules` are architecture-neutral.

---

## 7. CI/CD Infrastructure

**Upstream CI:** None for any architecture. A recursive tree scan of all 346 files in the AndrewGMorgan/libcap\_mirror repository found zero CI configuration files: no `.github/workflows/`, no `.travis.yml`, no `.circleci/`, no `azure-pipelines.yml`, no `gitlab-ci.yml`. The repository has no CI infrastructure whatsoever.

The [AndrewGMorgan/libcap-testing](https://github.com/AndrewGMorgan/libcap-testing) repository runs `make FAKEROOT=... clean all test sudotest install` on an Ubuntu x86\_64 GitHub Actions runner (`ubuntu-latest`) only. No architecture matrix, no riscv64, no QEMU. [NEEDS VERIFICATION -- libcap-testing contents not fully read in this research session.]

**RISE runners:** Not used. libcap is not among the 197 repositories using RISE runners (confirmed by [RISE blog post from 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)).

**Debian buildd (riscv64):** Debian's packaging infrastructure builds libcap2 on riscv64 hardware (builder rv-osuosl-05, part of the OSUOSL RISC-V builders). This is not upstream CI but is the only automated riscv64 build record in existence.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | No | No | No |
| Distribution CI | Debian buildd | Debian buildd | Debian buildd (rv-osuosl-05) |
| CI runs test suite | No (upstream) | No (upstream) | No (upstream) |
| RISE runners | No | No | No |
| Hardware available | Yes (buildd) | Yes (buildd) | Yes (buildd) |

---

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only. No pre-built binaries for any architecture. Latest release: libcap 2.78, dated 2026-04-06, available at [mirrors.edge.kernel.org](https://mirrors.edge.kernel.org/pub/linux/libs/security/linux-privs/libcap2/).

**To get a working riscv64 binary:** Install from a Linux distribution package. No additional steps are required; libcap builds from source with any standard riscv64 cross-toolchain.

| Distribution | Package | Version | riscv64 Status | Channel | Notes |
|---|---|---|---|---|---|
| Debian sid | libcap2, libcap2-bin, libcap-dev, libpam-cap | 1:2.78-1 | Installed (pass) | main | Built on rv-osuosl-05 |
| Debian 13 (stable) | libcap2 | 1:2.75-10+deb13u1 | Available | main | |
| Ubuntu 24.04 (Noble) | libcap2, libcap2-bin, libcap-dev | 1:2.66-5ubuntu2 | Available | ports | Older than amd64 security patch level (1:2.66-5ubuntu2.4) |
| Ubuntu 24.04 | libcap-ng0, libcap-ng-dev, libcap-ng-utils | 0.8.4-2build2 | Available | main | Fully current on riscv64 |
| Arch Linux RISC-V | libcap | 2.78-1 | Available | core | [libcap-2.78-1-riscv64.pkg.tar.zst](https://archriscv.felixc.at/repo/core/) (821 KB, 2026-04-16) |
| AlmaLinux Kitten 10 | libcap | 2.69-7.el10.riscv64 | Available | BaseOS | [NEEDS VERIFICATION -- single source] |
| PyPI | N/A | N/A | N/A | N/A | libcap is a C library; no PyPI package exists |

**Ubuntu version gap:** Ubuntu 24.04 riscv64 ships libcap2 1:2.66-5ubuntu2 (ports channel) while amd64/i386 have security patch 1:2.66-5ubuntu2.4. The difference is 4 security patch revisions. Whether CVE-2025-1390 (fixed in 2.74) or CVE-2026-4878 (fixed in 2.78) are backported to the Ubuntu 24.04 riscv64 package is not determinable from the research findings.

---

## 9. Dependencies

All dependencies of libcap build and test cleanly on riscv64. No blocking issues exist in the dependency tree.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Linux kernel headers (`linux/capability.h`) | Required -- defines capability constants and kernel ABI types | Pass | N/A | Available (all kernels >= 4.1) | None |
| glibc (`libc6 >= 2.38`) | Required runtime -- syscall wrappers, pthread, dynamic linker | Pass | Pass | 2.41 in Debian sid | See `./project-reports/glibc.md` |
| pthreads (part of glibc) | Required build-time -- libpsx uses `pthread_create`; disabling drops Go/psx support | Pass | Pass | Released | Part of glibc |
| PAM (`libpam0g`) | Optional -- enables `pam_cap` module; auto-detected at build time | Pass | Pass | 1.6.1-4 in Debian sid | Can be disabled with `PAM_CAP=no` |
| gperf >= 3.1 | Build-time only -- generates capability name lookup hash table | Pass | N/A | 3.1-4 in Debian sid | Falls back to linear scan if absent |
| Go toolchain (>= 1.16) | Build-time optional -- builds `cap` and `psx` Go modules | Pass | Pass | Go 1.23 in Debian sid | `GOLANG=no` skips this entirely; see `./project-reports/go.md` |
| `kernel.org/pub/linux/libs/security/libcap/psx` (Go module) | Go runtime dep of `cap` package | Pass | Pass | v1.2.78 | Pure Go; architecture-independent |

**Dependency notes:**

- The `golang-kernel-pub-linux-libs-security-libcap-dev` Go package is architecture-independent (`all`) and ships with version parity to the C library.
- `pam_cap` subpackage (`libpam-cap`) is built and available on riscv64 in Debian sid at 1:2.78-1.
- `RAISE_SETFCAP` is explicitly set to `no` upstream as of 2.78 (deliberate security-policy change; earlier versions set it `yes`).
- No dependency in the tree uses JIT, SIMD, crypto primitives, or architecture-specific numerics that would require separate riscv64 enablement.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64 Impact |
|---|---|---|---|---|
| [Issue #12](https://github.com/AndrewGMorgan/libcap_mirror/issues/12) | `libcap_psx_test: exit(0) in thread_fork_exit causing hangs` | Open (no response, no patch) | Low -- test harness only | Hang reproduces on riscv64 QEMU (Yocto-built images); proposed fix is replacing `exit(0)` with `_exit(0)` |
| [Issue #5](https://github.com/AndrewGMorgan/libcap_mirror/issues/5) | Support non-mainstream Linux architectures | Open | Low -- does not affect riscv64 | RISC-V not mentioned; resolved before issue was filed |
| [Debian #1100408](https://bugs.debian.org/1100408) | FTBFS: test suite failure on mips64el, powerpc | Open | Affects mips64el/powerpc only | riscv64 not mentioned; riscv64 status is Installed |

**Correctness bugs specific to riscv64:** None found.

**Issue #12 detail:** `thread_fork_exit` in the psx test calls `exit(0)` in a forked child, which flushes stdio buffers and runs atexit handlers, causing a deadlock in `futex_wait`. This hang reproduces on arm64 and riscv64 QEMU targets under Yocto-built embedded Linux images. It does not affect the library itself, only the test. No upstream response as of 2026-06-12.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. The maintainer (Andrew G. Morgan) explicitly added riscv64 support in February 2025 and removed the riscv64 TODO in March 2025. No objection to riscv64 support has been stated in any accessible source.

**Technical blockers:** None. The library is portable C; riscv64 requires no architecture-specific code beyond what already exists.

**Organizational blockers:** None. The project is a single-maintainer open-source library under kernel.org. There is no governance body, no TSC, and no corporate sponsor with veto power over architecture support.

**Kernel bugzilla #219687** (the original motivation for the riscv64 PSX fix) is not accessible due to Anubis bot protection on bugzilla.kernel.org. The bug is referenced in commit dfb0fc2 but its content, reporter, and resolution details cannot be confirmed.

**Acceptance probability for future riscv64 patches:** High. The maintainer has been actively expanding multi-arch support throughout 2025 and has accepted patches for alpha, hppa, m68k, sh4, sparc64, ARC, Microblaze, OpenRISC, and Xtensa in addition to riscv64.

---

## 13. Investment Analysis

libcap riscv64 support is complete, correct, and shipping in distributions. No functional enablement work remains. RISE has no involvement. The only open items are a test harness bug and the absence of upstream CI.

### 13.1 Functional Enablement

No work required. The library builds correctly, passes its test suite, and is available in Debian, Ubuntu, and Arch Linux RISC-V. All riscv64-specific enablement was completed upstream by Andrew G. Morgan in February 2025.

The only outstanding functional item is Issue #12 (psx\_test hang using `exit(0)` instead of `_exit(0)`). This is a one-line fix in the test harness and does not affect the library. Estimated effort: 0.1 person-weeks to prepare and submit the patch.

### 13.2 Performance Optimization

Not applicable. libcap is a thin syscall wrapper with no compute-intensive paths. No benchmark data exists for any architecture and none is needed. Performance is bounded by kernel syscall latency, which is an architecture-level concern outside libcap's scope.

### 13.3 CI/CD Infrastructure

libcap has no upstream CI for any architecture. Adding riscv64 CI would require first establishing upstream CI (which does not exist). The upstream project appears intentionally lightweight; the maintainer has not added CI despite the project being active.

If riscv64 CI coverage is a priority, the practical path is contributing to Debian's automated testing infrastructure (autopkgtest), which already builds and tests on riscv64 hardware. Upstream CI investment would likely be resisted or ignored given the project's maintenance model.

Estimated effort to add riscv64 to a hypothetical upstream CI: 0.5 person-weeks. Probability of upstream acceptance: Low given the project has chosen to have no CI.

### 13.4 Ecosystem Enablement

Not applicable. libcap is a system C library with no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Issue #12: replace `exit(0)` with `_exit(0)` in psx\_test `thread_fork_exit` | 0.1 | Community contribution | Low |
| CI/CD | Add riscv64 to upstream CI (contingent on upstream CI existing at all) | 0.5 | Upstream | Low |
| Performance | No work required | 0 | N/A | N/A |
| Ecosystem | No work required | 0 | N/A | N/A |

**Assessment:** libcap requires no investment for riscv64. The port is complete, upstreamed, and shipping. The test harness bug (Issue #12) is a trivial fix that any contributor can submit. This project should be marked "done" for riscv64 enablement purposes.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [AndrewGMorgan/libcap\_mirror commit dfb0fc2 -- "Add riscv support for the psx mechanism."](https://github.com/AndrewGMorgan/libcap_mirror/commit/dfb0fc2)
- [AndrewGMorgan/libcap\_mirror commit bbd8832 -- "Extend support further to \_\_m68k\_\_ and possibly \_\_sparc\_\_."](https://github.com/AndrewGMorgan/libcap_mirror/commit/bbd8832)
- [AndrewGMorgan/libcap\_mirror Issue #5 -- "Support non-mainstream Linux architectures"](https://github.com/AndrewGMorgan/libcap_mirror/issues/5)
- [AndrewGMorgan/libcap\_mirror Issue #12 -- "libcap\_psx\_test: exit(0) in thread\_fork\_exit causing hangs"](https://github.com/AndrewGMorgan/libcap_mirror/issues/12)
- [libcap release notes](https://sites.google.com/site/fullycapable/release-notes-for-libcap)
- [libcap upstream release tarballs](https://mirrors.edge.kernel.org/pub/linux/libs/security/linux-privs/libcap2/)
- [Debian buildd status -- libcap2](https://buildd.debian.org/status/package.php?p=libcap2&suite=unstable)
- [Debian build log -- libcap2 1:2.78-1 riscv64](https://buildd.debian.org/status/logs.php?pkg=libcap2&ver=1%3A2.78-1&arch=riscv64)
- [Debian bug #1100408 -- FTBFS on mips64el/powerpc](https://bugs.debian.org/1100408)
- [sources.debian.org -- Make.Rules](https://sources.debian.org/src/libcap2/1%3A2.78-1/Make.Rules/)
- [sources.debian.org -- debian/control](https://sources.debian.org/src/libcap2/1%3A2.78-1/debian/control/)
- [Arch Linux RISC-V core repository](https://archriscv.felixc.at/repo/core/)
- [Ubuntu packages -- libcap2 (Noble)](https://packages.ubuntu.com/search?keywords=libcap&suite=noble&searchon=names&section=all)
- [Go package -- kernel.org/pub/linux/libs/security/libcap/cap](https://pkg.go.dev/kernel.org/pub/linux/libs/security/libcap/cap)
- [Go package -- kernel.org/pub/linux/libs/security/libcap/psx](https://pkg.go.dev/kernel.org/pub/linux/libs/security/libcap/psx)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V runners -- six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [libcap homepage](https://sites.google.com/site/fullycapable/)