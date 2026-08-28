---
title: libseccomp
parent: Project Reports
categories:
  - libraries
  - containers
---

# libseccomp
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libseccomp
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libseccomp is a C library providing a portable, architecture-abstracted API over the Linux kernel's seccomp-BPF syscall filter mechanism. Applications use libseccomp to build and load BPF programs that restrict which syscalls a process (or its children) may execute. It is a critical dependency for container runtimes (Docker, containerd, Podman), sandboxed browsers, and hardened service deployments.

**License:** LGPL-2.1.

**Governance:** Maintainer-driven with no foundation affiliation (not Linux Foundation, Apache, or CNCF). Releases are milestone-gated. Two authorized maintainers/release signers:
- Paul Moore (pcmoore, primary maintainer; historically associated with Red Hat/IBM kernel work but no current employer disclosed in public project materials)
- Tom Hromatka (drakenclimber, Oracle)

**Corporate contributor base** (per CREDITS file): Red Hat, IBM, Canonical/Ubuntu, Google, SUSE, Oracle, Intel, Sony, Loongson, Docker, NVIDIA, Imagination Technologies, Freescale, Gentoo.

**Community stance on new ports:** The project accepts architecture additions from external contributors -- riscv64 was contributed by Andreas Schwab (SUSE), not by the core maintainers. The acceptance criterion is explicit: the Linux kernel must have merged `HAVE_ARCH_SECCOMP_FILTER` for the target architecture before any libseccomp PR is considered. This policy blocked riscv64 support for over three years (2016-2019) and currently blocks riscv32.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-10-18 | [PR #50](https://github.com/seccomp/libseccomp/pull/50) opened by rwmjones -- first riscv64 attempt. Blocked: kernel lacked RISC-V audit support. | GitHub PR #50 |
| 2018-02-20 | [Issue #110](https://github.com/seccomp/libseccomp/issues/110) opened by pcmoore as master tracking issue for riscv64 support. | GitHub Issue #110 |
| 2018-04-05 | [PR #108](https://github.com/seccomp/libseccomp/pull/108) opened by Icenowy -- second attempt. Labeled low priority; kernel support still absent. | GitHub PR #108 |
| 2018-12-06 | [PR #134](https://github.com/seccomp/libseccomp/pull/134) opened by davidlt (David Abdurachmanov) -- substantial riscv64 implementation with full syscall table. Tests passed on Fedora/RISCV (kernel 4.19) and SiFive Unleashed (kernel 5.2). | GitHub PR #134 |
| 2019-11-11 | PR #134 closed by pcmoore -- Travis CI failures and kernel patch still not in Linus' tree. | GitHub PR #134 |
| 2019-11-27 | seccomp support merged into Linus' tree ([kernel commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe08030988bdda46dd86cd5d5fb7517)), targeting kernel 5.5. | GitHub Issue #110, comment by aurel32 |
| 2020-01-07 | [PR #197](https://github.com/seccomp/libseccomp/pull/197) opened by Andreas Schwab (SUSE). | GitHub PR #197 |
| 2020-02-23 | PR #197 merged by pcmoore, commit [5432e15](https://github.com/seccomp/libseccomp/commit/5432e15521d5ce5a7d3f26bf78674cbaa9d73d1f). 22 files changed, 677 additions. | GitHub PR #197 |
| 2020-02-24 | carlosedp ran full test suite on real RISC-V hardware: 5,229 tests, 0 failures, 0 errors. | GitHub PR #197, comment by carlosedp |
| 2020-02-24 | OBS build failure reported (Test 52-basic-load rc=22). Confirmed by Andreas Schwab to be QEMU refusing to emulate seccomp, not a libseccomp bug. | GitHub PR #197, comments by pcmoore and andreas-schwab |
| 2020-07-20 | libseccomp v2.5.0 released, shipping riscv64 support. | GitHub releases |
| 2020-08-20 | [PR #290](https://github.com/seccomp/libseccomp/pull/290) merged -- fixed test failures on riscv64 caused by legacy `open`/`stat` syscalls not present on riscv64; replaced with `openat`/`fstat`. | GitHub PR #290 |
| 2021-06-09 | [PR #327](https://github.com/seccomp/libseccomp/pull/327) opened by kraj (Khem Raj) for riscv32 support. | GitHub PR #327 |
| 2022-10-14 | PR #327 stalls. Last substantive comment from kraj. No activity since. | GitHub PR #327 |
| 2025-01-23 | libseccomp v2.6.0 released (adds SuperH, LoongArch, m68k; no further riscv64 changes). | GitHub releases |

**Status:** riscv64 support is fully upstream as of v2.5.0 (July 2020). riscv32 support does not exist.

**Key contributor organizations:**
- SUSE: Andreas Schwab (author of the merged PR #197)
- Community (no org): carlosedp (hardware validation)
- Oracle: Tom Hromatka (code review and testing)

---

## 3. Upstream Support Tier

**Formal tier policy:** None. The project has no documented tier or stability classification for architectures. All supported architectures appear equally in the CHANGELOG and README with no tier distinctions.

**De facto evidence of support quality by architecture:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Source support | Yes (since project inception) | Yes | Yes (v2.5.0, 2020) |
| CI coverage | Yes (all 6 jobs on ubuntu-24.04) | No | No |
| Live hardware testing in CI | No (CI uses native runner) | No | No |
| Release-blocking tests | Yes (amd64 only) | No | No |
| Official upstream binaries | No (source-only releases) | No | No |
| Debian binary package | Yes | Yes | Yes (v2.6.0-2) |
| Ubuntu binary package | Yes | Yes | Yes (v2.5.5) |
| Arch Linux binary package | Yes | Yes | Yes (v2.6.0-1) |
| Kernel dependency met | Yes | Yes | Yes (kernel 5.5+) |

**Assessment:** riscv64 has source-level parity with arm64. Neither arm64 nor riscv64 receives CI coverage in the upstream project; both depend entirely on downstream distribution packagers for build verification.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libseccomp generates BPF bytecode in pure C. It has no JIT, no SIMD, no assembly, no cryptographic routines, and no floating-point. The only architecture-specific work is a syscall number lookup table and an architecture descriptor struct.

**RISC-V-specific source files:**

- `src/arch-riscv64.h`: ~20 lines. Invokes `ARCH_DECL(riscv64)` macro. No ISA extension references. Complete.
- `src/arch-riscv64.c`: ~35 lines. Defines `arch_def_riscv64` with token `SCMP_ARCH_RISCV64`, BPF token `AUDIT_ARCH_RISCV64` (ELF machine EM_RISCV = 243), size 64-bit, endian little-endian. `syscall_rewrite = NULL` and `rule_add = NULL` are correct (not missing) -- these fields are NULL for all 64-bit architectures that use direct syscall numbering without remapping. Complete.
- `src/arch-riscv64-syscalls.c`: Generated by the `arch-syscall-validate` tool from `syscalls.csv`. Confirmed by reviewer drakenclimber during PR #197 review.
- `src/syscalls.csv`: Contains `riscv64` and `riscv64_kver` columns. All `riscv64_kver` entries are `SCMP_KV_UNDEF`. Some syscalls are PNR (not present) on riscv64 including `clone3` (not present), `listns` (470), `memfd_secret` (447). riscv64-specific syscalls in the table: `riscv_flush_icache`, `riscv_hwprobe`.
- `src/arch.c`: Contains riscv64 detection (`#elif __riscv && __riscv_xlen == 64`), switch case for `SCMP_ARCH_RISCV64` in `arch_def_lookup()`, and string match `"riscv64"` in `arch_def_lookup_name()`.

**Component matrix:**

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Arch descriptor (.c/.h) | Yes | Yes | Yes | Identical structure across all architectures |
| Syscall table | Yes | Yes | Yes | Generated by tooling |
| BPF filter emission | Yes (shared) | Yes (shared) | Yes (shared) | Architecture-agnostic C code |
| JIT backend | None in project | None | None | libseccomp does not JIT |
| SIMD / vector | N/A | N/A | N/A | Not applicable |
| Assembly | None | None | None | Pure C |
| ISA extensions used | None | None | None | No RVV, Zba, Zbb, or any extension |

**No architecture-specific performance gaps exist at the code level.** The library's performance depends on BPF filter complexity (number of rules), not on any architecture-specific code path.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** autotools (configure.ac + Makefile.am). No CMake, no Dockerfile, no Meson.

**Standard build:**
```
./autogen.sh
./configure
make
make install
```

For source tarballs, `autogen.sh` is not needed.

**Cross-compilation for riscv64** (no riscv64-specific docs in repo; standard autotools pattern applies):
```
./autogen.sh
CC=riscv64-linux-gnu-gcc ./configure --host=riscv64-linux-gnu
make
```

**Available configure options relevant to riscv64:**
- `--enable-python` / `--disable-python`: build Python bindings (requires Cython >= 0.29). Disable for cross builds where Cython may not target correctly.
- `--enable-code-coverage`: enable lcov. Architecture-agnostic.

**No riscv64-specific configure flags exist.**

**Required build tools:**
- `gperf`: mandatory -- build fails without it. Available in Debian sid riscv64 as v3.3-1.
- `autoconf`/`automake`: for source builds.
- `gcc` or `clang`: no minimum version documented in the repo.
- For Python bindings: Cython >= 0.29, Python 3, python3-setuptools.

**No QEMU usage in the build or test infrastructure.** Tests are run natively. The upstream CI does not use QEMU for any architecture.

**Known build issues:**
- NixOS: libseccomp-2.5.5 test suite fails when building for riscv64 under QEMU emulation on NixOS ([nixpkgs #301385](https://github.com/NixOS/nixpkgs/issues/301385), 2024, status stale/unresolved). Workaround is to disable tests during build. Root cause is likely QEMU seccomp emulation gaps or kernel interface differences, not a libseccomp bug. No upstream fix has been filed.
- OBS (openSUSE Build Service) live test failure post-merge of PR #197: Test 52-basic-load rc=22. Confirmed by Andreas Schwab to be QEMU refusing to emulate seccomp, not a libseccomp bug. Not actionable.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| BPF filter generation | Yes | Yes | Yes | Full parity |
| Syscall allow/deny by name | Yes | Yes | Yes | Full parity |
| Syscall argument filtering | Yes | Yes | Yes | Full parity |
| Notification API (seccomp_notify) | Yes | Yes | Yes | Architecture-agnostic |
| `SCMP_ACT_*` actions | All | All | All | Full parity |
| `seccomp_precompute()` API (v2.6.0) | Yes | Yes | Yes | Added Jan 2025, architecture-agnostic |
| Legacy syscall support | Full | Partial (no open, stat, etc.) | Partial (same gaps as arm64) | riscv64 does not have fork, open, creat, pipe, chmod, mkdir, poll, stat, etc. -- all PNR |
| riscv_flush_icache | N/A | N/A | Yes | RISC-V-specific syscall present in table |
| riscv_hwprobe | N/A | N/A | Yes | RISC-V-specific syscall present in table |
| riscv32 support | N/A | N/A | No | PR #327 stalled since Oct 2022 |

**Legacy syscall gap:** riscv64 (like arm64) does not support old-style POSIX syscalls. Applications relying on seccomp rules that allow `open`, `fork`, `stat`, or similar must use `openat`, `clone`, `fstatat`, etc. on riscv64. libseccomp marks these as PNR in the syscall table; filter rules referencing PNR syscalls will either be silently skipped or cause filter load failures depending on how the application handles errors. This is a kernel-level ABI property, not a libseccomp deficiency.

**No performance gaps** exist between architectures at the libseccomp level. The library generates BPF bytecode; filter execution performance is a kernel BPF interpreter/JIT concern, not a libseccomp concern.

**No security hardening gaps** between architectures. ASLR, stack protection, and similar mitigations are controlled by compiler flags and are not architecture-specific in libseccomp's build system.

---

## 7. CI/CD Infrastructure

**Upstream CI files present in the repository:**
- `.github/workflows/continuous-integration.yml` (3703 bytes)
- `.github/workflows/codeql-analysis.yml` (854 bytes)

**Files confirmed absent:** `.gitlab-ci.yml`, `.cirrus.yml`, `Jenkinsfile`.

**CI matrix:**

| Job | Runner | riscv64? | QEMU? | Notes |
|---|---|---|---|---|
| tests | ubuntu-24.04 (amd64) | No | No | Build + test suite |
| livetests | ubuntu-24.04 (amd64) | No | No | Live kernel tests |
| scanbuild | ubuntu-24.04 (amd64) | No | No | clang scan-build |
| codecoverage | ubuntu-24.04 (amd64) | No | No | lcov, Coveralls (flag: "amd64") |
| codespell | ubuntu-24.04 (amd64) | No | No | Spell check |
| clang | ubuntu-24.04 (amd64) | No | No | Clang build |
| CodeQL | ubuntu-24.04 (amd64) | No | No | C++ and Python |

The string "riscv" does not appear in either workflow file. There is no architecture matrix, no QEMU cross-build, and no riscv64 runner.

**Architecture CI comparison:**

| Architecture | CI build | CI test | Live kernel test | Hardware runner |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | ubuntu-24.04 |
| arm64 | No | No | No | None |
| riscv64 | No | No | No | None |

**RISE CI runners:** RISE has no involvement with libseccomp. No RISE-provided riscv64 CI runners are used.

**Consequence:** The only riscv64 build and test validation is performed by downstream distribution packagers (Debian, Ubuntu, Arch Linux). A regression in riscv64 support could ship in a libseccomp release without detection by upstream CI.

---

## 8. Distribution and Release Status

**Upstream releases:** Source-only. Each release ships exactly four assets: `.tar.gz`, `.tar.gz.asc`, `.tar.gz.SHA256SUM`, `.tar.gz.SHA256SUM.asc`. No binary packages are published by the upstream project. This is by design for a C library.

**Latest release:** v2.6.0, released January 23, 2025.

**Distribution binary packages for riscv64:**

| Distribution | Package | Version | riscv64 available | Source |
|---|---|---|---|---|
| Debian Trixie | libseccomp2 | 2.6.0-2 | Yes (51.9 kB, 185.0 kB installed) | [buildd.debian.org](https://buildd.debian.org), status "Installed" |
| Debian Trixie | python-libseccomp | 2.6.0-2 | [NEEDS VERIFICATION] | Not independently confirmed |
| Ubuntu 24.04 Noble | libseccomp2 | 2.5.5-1ubuntu3 | Yes (51.7 kB, 139.0 kB installed) | packages.ubuntu.com |
| Ubuntu 24.04 Noble | libseccomp-dev | 2.5.5-1ubuntu3 | Yes | packages.ubuntu.com |
| Arch Linux RISC-V | libseccomp | 2.6.0-1 | Yes (confirmed file: libseccomp-2.6.0-1-riscv64.pkg.tar.zst, signed) | [riscv.mirror.pkgbuild.com](https://riscv.mirror.pkgbuild.com/repo/core/), dated 2026-01-24 |
| Arch Linux RISC-V | python-libseccomp | 2.6.0-1 | Yes (162,787 bytes, signed) | riscv.mirror.pkgbuild.com, dated 2026-01-24 |

**PyPI:** No `libseccomp` package exists on PyPI (404). The C library is not distributed as a Python wheel.

**RISE wheel builder:** libseccomp is not in the RISE Python wheel builder list. Not applicable -- libseccomp is a C library, not a Python package.

**What a user must do to get a working riscv64 binary:** Install the distribution package (`apt install libseccomp2 libseccomp-dev` on Debian/Ubuntu, or the equivalent on Arch Linux RISC-V). No additional steps are required. All major distributions ship current riscv64 binaries.

---

## 9. Dependencies

libseccomp has no shared-library runtime dependencies. It links only against the Linux kernel ABI (syscall interface + seccomp-BPF). All dependencies are build-time or test-time.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Linux kernel (seccomp-BPF, `HAVE_ARCH_SECCOMP_FILTER`) | Runtime: filter execution engine | Supported (kernel 5.5+) | Live tests pass (5,229 passed, PR #197) | Kernel 5.5 merged Nov 2019 | None for rv64. rv32 (`AUDIT_ARCH_RISCV32`) not yet in kernel -- libseccomp PR #327 deferred to v2.7.0 |
| gperf | Build: perfect hash generator for syscall table (mandatory) | Available (Debian sid riscv64: v3.3-1) | Architecture-independent output | Packaged | None |
| gcc / build-essential | Build: C compiler | Available (Debian sid riscv64: gcc >= 14.2) | N/A | Packaged | None |
| Cython (>= 0.29) | Build: compiles Python bindings (--enable-python only) | Available (Debian sid riscv64: cython3 3.1.6+dfsg-2+b1) | Architecture-specific C extension; works on riscv64 | Packaged | None |
| Python 3 | Build/test: Python bindings + test harness | Available (Debian sid riscv64: python3 3.13.9-3+b1) | No riscv64-specific issues known | Packaged | None |
| python3-setuptools | Build: Python packaging | Architecture-independent ("all" package) | N/A | Packaged | None |
| Valgrind | Test: memory error detection | Supported (Debian sid: 1:3.25.1-3 for riscv64; riscv64 is an officially supported Valgrind target as of v3.19+) | riscv64 installed size: ~127 MB vs ~88 MB for amd64 (unexplained; cosmetic) | Packaged | None critical |
| lcov | Test: code coverage | Architecture-independent ("all" package) | N/A | Packaged | None |
| clang-tools (scan-build) | Test: static analysis | Available (Debian sid riscv64: 1:21.1.6-71+b1) | No riscv64-specific issues | Packaged | None |
| astyle | Test: code style checker | Available (Debian sid riscv64: 3.6.12-1+b1) | No riscv64-specific issues | Packaged | None |
| libseccomp-golang (seccomp/libseccomp-golang) | Optional: Go bindings (separate repo) | Uses CGo against libseccomp which supports riscv64; no riscv64-specific issues in 6 open issues | Not tested on riscv64 in CI [NEEDS VERIFICATION] | No riscv64-specific release artifacts; consumed as Go module | None |

No dependency has JIT, SIMD, cryptographic, or numerics components that affect riscv64 support of libseccomp. The dependency graph is shallow and fully resolved for riscv64.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #290](https://github.com/seccomp/libseccomp/pull/290) | BUG: skip stat and open syscalls on riscv64 in tests 04 and 06 | Merged 2020-08-20 (resolved) | Medium | riscv64 and arm64 lack legacy open/stat; test suite used openat/fstat as fix |
| [PR #327](https://github.com/seccomp/libseccomp/pull/327) | RFE: add RISC-V 32-bit arch support | Open, stalled (last activity Oct 2022) | Low (does not affect rv64) | 118 test errors in socket/IPC/binary tree tests; root cause unresolved; author shifted focus; milestone v2.7.0 |
| [nixpkgs #301385](https://github.com/NixOS/nixpkgs/issues/301385) | libseccomp-2.5.5 test suite fails on riscv64 under QEMU on NixOS | Open/stale (2024) | Low | QEMU seccomp emulation gap; workaround is to disable tests at build time; no upstream fix filed |

**No open correctness bugs for riscv64 exist in the upstream seccomp/libseccomp issue tracker.** The two open issues in the upstream tracker (#480, #444) are architecture-agnostic.

**Syscall coverage gaps (not bugs):** Several newer syscalls are marked PNR on riscv64 in syscalls.csv: `listns` (470), `memfd_secret` (447). These reflect kernel ABI, not libseccomp deficiencies.

---

## 12. Objections and Upstream Blockers

**Historical objections (resolved):**

The sole stated objection to riscv64 support was the kernel requirement: `HAVE_ARCH_SECCOMP_FILTER` must be merged in Linus' tree before any libseccomp PR is considered. This was explicitly stated by pcmoore on 2019-06-07 and 2019-07-31. The kernel commit landed November 27, 2019 (for kernel 5.5). PR #197 was merged February 23, 2020 -- 87 days after the kernel prerequisite was met.

**Current blockers for riscv32:**

1. Incomplete syscall table: `arch_syscall_resolve_num()` returns NULL for some riscv32 syscalls due to missing entries in syscalls.csv. Drakenclimber identified this specifically in August 2021.
2. Wrong function pointer assignments in arch-riscv32.c: should use `syscall_resolve_name_raw`/`syscall_resolve_num_raw` instead of the non-raw variants.
3. 118 test errors in socket, IPC, and binary tree tests on riscv32 QEMU: probable cause is IPC/socket syscall multiplexing on riscv32 (may use `socketcall`/`ipc` multiplexed syscalls rather than direct calls). Root cause confirmed as unresolved by drakenclimber as of January 2022.
4. No maintainer ownership: kraj (author) stated in October 2022 that focus had shifted. No maintainer has volunteered to complete the work.
5. Kernel riscv32 audit support (`AUDIT_ARCH_RISCV32`) not yet confirmed as merged in Linus' tree -- the research findings note this explicitly as still absent.

**riscv64 has no current blockers.** All historical objections are resolved.

---

## 13. Investment Analysis

RISE has no current or prior involvement with libseccomp. No funded RFP, no blog post, no working group activity covers this project.

### 13.1 Functional Enablement

**riscv64:** No work needed. Implementation is complete, upstream, and shipping in Debian, Ubuntu, and Arch Linux since 2020. The 5,229-test pass on real hardware in February 2020 validates the implementation.

**riscv32:** PR #327 requires completing the syscall table in syscalls.csv, fixing two function pointer assignments in arch-riscv32.c, and debugging 118 test errors in socket/IPC/binary tree categories. The root cause of the socket/IPC failures (likely `socketcall`/`ipc` multiplexing) must be determined and either the test harness or the syscall table corrected. Estimated effort: 4-8 person-weeks for an engineer familiar with RISC-V 32-bit ABI and the libseccomp codebase. This requires a riscv32 QEMU image or hardware (kraj provided a QEMU image at uclibc.org/~kraj/qemuriscv32/ in August 2021; availability unverified as of 2026). Kernel prerequisite (AUDIT_ARCH_RISCV32 merged into Linus' tree) must be confirmed before a PR can be merged per project policy.

### 13.2 Performance Optimization

Data not available: no riscv64 vs arm64 vs amd64 benchmark comparisons for libseccomp exist in any published source. However, libseccomp's performance is determined by BPF filter construction (CPU-bound C code) and BPF filter execution (kernel BPF interpreter/JIT). libseccomp itself has no architecture-specific hot paths. Performance optimization is not a viable investment area here.

### 13.3 CI/CD Infrastructure

The upstream CI covers only amd64. Adding a riscv64 CI job would require either a RISC-V hardware runner in GitHub Actions (not available as of the research date) or a QEMU cross-build step. A QEMU-based riscv64 job in `continuous-integration.yml` would add build verification; a live kernel test (`livetests`) on riscv64 would require hardware or a QEMU VM with a full kernel. Estimated effort: 2-4 person-weeks to implement and validate a QEMU-based riscv64 build-and-test job. An additional 2-4 person-weeks if a live kernel test job is desired (requires a suitable kernel image and QEMU configuration). Maintainer buy-in is needed to merge CI additions.

### 13.4 Ecosystem Enablement

Not applicable. libseccomp is a C library with no dependent package ecosystem requiring separate riscv64 enablement. Distribution packages are already available.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete riscv64 support (done upstream) | 0 | N/A | N/A -- complete |
| Functional | Complete riscv32 support (PR #327): fix syscall table, fix function pointers, debug socket/IPC test failures, require kernel AUDIT_ARCH_RISCV32 upstream | 4-8 | Contributor (kraj disengaged; needs new owner) | Low (riscv32 is not a commercial RISC-V server target; Yocto dropped out-of-tree patches in Dec 2021) |
| CI/CD | Add QEMU-based riscv64 build + test job to continuous-integration.yml | 2-4 | Contributor + maintainer review | Medium (prevents undetected riscv64 regressions) |
| CI/CD | Add QEMU-based riscv64 live kernel test job | 2-4 | Contributor + maintainer review | Low (QEMU seccomp emulation rejection is a known issue; live tests may need special QEMU config) |
| Performance | Benchmark libseccomp filter construction and loading on riscv64 vs amd64/arm64 | 1-2 | Contributor | Low (no architecture-specific hot paths exist) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #110: RFE: add RISC-V support (tracking issue)](https://github.com/seccomp/libseccomp/issues/110)
- [Issue #262: Q: when will master branch with RISCV support be added to a release?](https://github.com/seccomp/libseccomp/issues/262)
- [PR #50: RFE: add RISC-V 64 bit support (first attempt, 2016, not merged)](https://github.com/seccomp/libseccomp/pull/50)
- [PR #108: RFE: add RISC-V support (second attempt, 2018, not merged)](https://github.com/seccomp/libseccomp/pull/108)
- [PR #134: Add support for RISC-V RV64 (third attempt, 2018-2019, not merged)](https://github.com/seccomp/libseccomp/pull/134)
- [PR #197: RFE: add RISC-V 64-bit support (merged 2020-02-23, v2.5.0)](https://github.com/seccomp/libseccomp/pull/197)
- [PR #211: BUG: fix test failures on aarch64 and other architectures (not merged)](https://github.com/seccomp/libseccomp/pull/211)
- [PR #290: BUG: skip stat and open syscalls on riscv64 in tests (merged 2020-08-20)](https://github.com/seccomp/libseccomp/pull/290)
- [PR #327: RFE: add RISC-V 32-bit arch support (open, stalled Oct 2022)](https://github.com/seccomp/libseccomp/pull/327)
- [Commit 5432e15: arch: Add RISC-V 64-bit support](https://github.com/seccomp/libseccomp/commit/5432e15521d5ce5a7d3f26bf78674cbaa9d73d1f)
- [Linux kernel commit: RISC-V seccomp support merged (5340627e)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe08030988bdda46dd86cd5d5fb7517)
- [GitHub Actions: continuous-integration.yml](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/continuous-integration.yml)
- [GitHub Actions: codeql-analysis.yml](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/codeql-analysis.yml)
- [Debian Trixie: libseccomp2 2.6.0-2 riscv64](https://packages.debian.org/trixie/libseccomp2)
- [Ubuntu Noble: libseccomp2 2.5.5-1ubuntu3 riscv64](https://packages.ubuntu.com/noble/libseccomp2)
- [Arch Linux RISC-V mirror: libseccomp-2.6.0-1-riscv64.pkg.tar.zst](https://riscv.mirror.pkgbuild.com/repo/core/)
- [nixpkgs issue #301385: libseccomp-2.5.5 test suite fails on riscv64 under QEMU](https://github.com/NixOS/nixpkgs/issues/301385)
- [RISE RFP list (lf-rise.atlassian.net)](https://lf-rise.atlassian.net)
- [RISE blog (riseproject.dev/blog)](https://riseproject.dev/blog)
- [seccomp/libseccomp repository](https://github.com/seccomp/libseccomp)
- [libseccomp v2.6.0 release](https://github.com/seccomp/libseccomp/releases/tag/v2.6.0)
- [libseccomp v2.5.0 release](https://github.com/seccomp/libseccomp/releases/tag/v2.5.0)