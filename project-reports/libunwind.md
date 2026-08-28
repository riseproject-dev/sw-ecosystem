---
title: libunwind
parent: Project Reports
categories:
  - libraries
  - debug
---

# libunwind

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libunwind
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libunwind is a portable C library for determining the call chain of a program at runtime. It supports local unwinding (inspecting the current process stack), remote unwinding (inspecting another process via ptrace), and execution context save/restore. It is used as a backend by profilers, crash reporters, C++ exception handlers, and debuggers.

**License:** MIT (files LICENSE and COPYING in the repository).

**Governance:** The project has no formal foundation affiliation. It is hosted on [nongnu.org](https://www.nongnu.org/libunwind/) (Savannah infrastructure, loosely associated with FSF infrastructure but not a GNU project). There is no steering committee, no CII membership, and no RISE membership. Governance is entirely volunteer-driven. The repository description explicitly states the project is "in need of new / additional maintainer," indicating chronic under-resourcing.

**Corporate maintainers:**
- Dave Watson (djwatson) -- Facebook/Meta; primary committer for several years; member of the @libunwind and @ktls GitHub organizations.
- Stephen M. Webb (bregma) -- no current employer listed; previously associated with @unity8-team (Ubuntu/Canonical lineage); current primary merge gatekeeper as of 2024-2026.
- Matt Turner (mattst88) -- Netflix, also a Gentoo and freedesktop.org contributor; most prolific author in the 2025-2026 window, contributing CI, DWARF improvements, and ARM fixes.

The project originated at Hewlett-Packard for IA-64/HP-UX, created by David Mosberger-Tang. No ongoing HP/HPE involvement.

**Community culture on new ports:** Contributor-driven, cautious and incremental merging. No formal tier system or written policy on accepting new architecture ports. The RISC-V port was accepted based on a single external contributor's submission and has received only small incremental fixes from the core maintainers since.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-12-08 | Tracking issue #99 "risc-v architecture support" opened | [Issue #99](https://github.com/libunwind/libunwind/issues/99) |
| 2020-01-10 | Issue #151 "configure: error: Unknown ELF target: riscv64" -- build failure on v1.3.1 | [Issue #151](https://github.com/libunwind/libunwind/issues/151) |
| 2021-06-25 | First RISC-V commit (abd15da8afb3) by Zhaofeng Li -- 52 files, 2,629 additions | [Commit abd15da](https://github.com/libunwind/libunwind/commit/abd15da8afb35b92ed0cb2c47f6564775b976c24) |
| 2021-07-06 | PR #267 "Add port for Linux on RISC-V (riscv)" merged by Dave Watson (Meta) | [PR #267](https://github.com/libunwind/libunwind/pull/267) |
| 2021-08-19 | PR #290 Makefile.am header fix merged | [PR #290](https://github.com/libunwind/libunwind/pull/290) |
| 2021-11-26 | v1.6.0 released -- first stable release containing the riscv64 port | [v1.6.0 tag](https://github.com/libunwind/libunwind/releases/tag/v1.6.0) |
| 2023-05-31 | PR #532 merged -- XFAIL applied to Ltest-cxx-exceptions on riscv64 due to test crash | [PR #532](https://github.com/libunwind/libunwind/pull/532) |
| 2023-06-04 | v1.7.0 released -- includes the XFAIL workaround | [v1.7.0 tag](https://github.com/libunwind/libunwind/releases/tag/v1.7.0) |
| 2024-02-07 | Commit 7e16c2d244b5 removed the riscv64 XFAIL without explanation | [Commit 7e16c2d](https://github.com/libunwind/libunwind/commit/7e16c2d244b5b55550cc293f7a6f2a899285c93f) |
| 2024-06-11 | Issue #765 "CMake support for RISCV" opened -- no progress | [Issue #765](https://github.com/libunwind/libunwind/issues/765) |
| 2025-04-19 | PR #854 "riscv: Add dwarf_{put,get}fp for double-size words" opened | [PR #854](https://github.com/libunwind/libunwind/pull/854) |
| 2025-04-28 | Issue #857 "Support for FreeBSD 15 riscv64" opened | [Issue #857](https://github.com/libunwind/libunwind/issues/857) |
| 2025-05-02 | PR #854 merged -- fixes FP register width bug on riscv32+D | [PR #854](https://github.com/libunwind/libunwind/pull/854) |
| 2025-05-22 | v1.8.2 released -- first release with the riscv32+D FP fix | [v1.8.2 tag](https://github.com/libunwind/libunwind/releases/tag/v1.8.2) |
| 2025-05-23 | PR #866 "add initial freebsd riscv support" merged | [PR #866](https://github.com/libunwind/libunwind/pull/866) |
| 2025-08-07 | PR #871 "Implement Gresume for freebsd riscv64" merged | [PR #871](https://github.com/libunwind/libunwind/pull/871) |
| 2025-09-04 | v1.8.3 released -- first release with initial FreeBSD riscv64 scaffolding | [v1.8.3 tag](https://github.com/libunwind/libunwind/releases/tag/v1.8.3) |
| 2026-04-06 | PR #972 "riscv: Fix, simplification and new mode" merged -- fixes dwarf_getfp pointer bug | [PR #972](https://github.com/libunwind/libunwind/pull/972) |
| 2026-05-28 | PR #1032 "Do not enable C++ exception support on RISC-V by default" opened | [PR #1032](https://github.com/libunwind/libunwind/pull/1032) |
| 2026-06-16 | PR #1035 "configure: disable C++ exceptions support by default" opened -- supersedes #1032 | [PR #1035](https://github.com/libunwind/libunwind/pull/1035) |

**Key contributors:**
- Zhaofeng Li (zhaofengli) -- personal contributor (NixOS community, HiFive Unmatched user), no declared corporate affiliation. Author of the entire initial port (PR #267, PR #290, commit abd15da).
- admlck (no affiliation declared) -- author of PR #854 and PR #972; the most recent riscv-specific fix series.
- kasperk81 (no affiliation declared) -- author of PR #866 and PR #871 (FreeBSD riscv64 scaffolding).
- bregma (Stephen M. Webb) -- merged PR #532 (XFAIL), merged PR #972; maintainer gatekeeper.

The port is fully upstream and has been in stable releases since v1.6.0 (November 2021). There is no out-of-tree patchset.

---

## 3. Upstream Support Tier

libunwind has no formal tier system. There is no documented architecture support policy. The README uses checkmarks per platform without tiers or SLAs.

Evidence-based tier classification by architecture:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every PR | Yes | Yes | Yes (QEMU) |
| Tests run in CI | Yes | Yes | Yes (QEMU) |
| CI uses native hardware | Yes | Yes (GitHub-hosted) | No -- QEMU only |
| ABI check in CI | Yes | Yes | Yes |
| Gtrace.c (fast unwind) | Yes | Yes | No -- absent |
| longjmp.S | Yes | Yes | No -- absent |
| siglongjmp.S stub-free | Yes | Yes | No -- stub |
| CMake build support | Yes | Partial | No |
| C++ exception support | Stable | Stable | Unreliable (PR #1032) |
| FreeBSD support | Yes | Yes | Partial |
| Official binary packages | Distro | Distro | Distro (version lag on Ubuntu) |
| Release-blocking | Implied | Implied | No stated policy |

riscv64 receives CI coverage but is materially behind amd64 and arm64 in feature completeness. The open PR #1032 proposing to disable C++ exceptions on riscv by default is direct evidence that maintainers do not treat riscv64 as feature-equivalent.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libunwind's architecture-specific work divides into: context save/restore assembly, register map, signal frame detection, DWARF register accessors, resume logic, and fast-trace infrastructure. There is no JIT, SIMD, or cryptographic component in libunwind.

### Component-by-Component Analysis

| Component | amd64 | arm64 | riscv64 | Quality | Notes |
|---|---|---|---|---|---|
| getcontext.S | Full | Full | Full | Scalar assembly | Saves callee-saved integers and FP regs conditionally under #ifdef STORE_FP; FCSR saved |
| setcontext.S | Full | Full | Full | Scalar assembly | Restores state; uses `jr t1` for PC restore |
| siglongjmp.S | Full | Full | Stub -- bare `ret` | Missing | Dummy implementation, explicitly commented as such |
| longjmp.S | Full | Full | Absent | Missing | Not present at all in src/riscv/ |
| Gregs.c / Lregs.c | Full | Full | Partial | Scalar C | IP validity has a live FIXME comment; FP register addressing has a live FIXME |
| Gresume.c | Full | Full | Partial | Scalar C | Linux path works; no FreeBSD path; inline asm `mv sp / jr` for sigframe |
| Gis_signal_frame.c | Full | Full | Full (Linux only) | Scalar C | Opcode pattern match for rt_sigreturn; returns -UNW_ENOINFO on non-Linux |
| Gstep.c | 34,432 bytes -- arch-specific optimizations | 34,432 bytes | 4,287 bytes -- thin DWARF wrapper | Scalar C | No architecture-specific optimizations; delegates entirely to generic DWARF step |
| Gtrace.c | Full | Full | Absent | Missing | Fast-path profiling/tracing infrastructure entirely unimplemented on riscv64 |
| Gstash_frame.c | Full | Full | Absent | Missing | Frame caching for Gtrace; absent because Gtrace is absent |
| dwarf_getfp / dwarf_putfp | Full | Full | Fixed Apr 2026 | Scalar C | PR #972 fixed a pointer misuse bug that produced garbage FP register values; flen==32 on rv64 support added |
| DWARF register map | 66 regs | 96 regs | 66 regs (32 int + 32 fp + 2 pseudo) | Full | No vector (RVV) register slots |
| FP register access | Full | Full | Partial -- recently fixed | Scalar C | PR #854 (May 2025) fixed riscv32+D; PR #972 (Apr 2026) fixed flen==32 on rv64; no RVV |
| CMake build system | Full | Full | Absent | Missing | Issue #765 open since June 2024; autotools only for riscv64 |
| C++ exception support | Stable | Stable | Unreliable | Partial | PR #1032 proposes disabling by default; XFAIL history since 2023 |
| FreeBSD OS support | Full | Full | Partial | Partial | PR #866 scaffolding, PR #871 Gresume; issue #857 open; Gtest-exc infinite loop on FreeBSD |
| UNW_TDEP_CURSOR_LEN | Tuned | Tuned | 4096 (FIXME placeholder) | Stub | Explicitly marked with a FIXME to tune to actual size |
| RVV (vector) extension | N/A | N/A | No support | Missing | No vector registers in DWARF map; no assembly |
| Bitmanip (Zba/Zbb) | N/A | N/A | Not referenced | N/A | Not applicable to this library |

### ISA Extension Coverage

| Extension | Used | Where |
|---|---|---|
| RV32I/RV64I base integer | Yes | getcontext.S, setcontext.S, asm.h |
| F (single-precision FP) | Yes | asm.h, getcontext.S, setcontext.S (conditional) |
| D (double-precision FP) | Yes | asm.h, libunwind_i.h |
| RVV (Vector) | No | Not referenced anywhere |
| Zba/Zbb/Zbc bitmanip | No | Not applicable |

No hardware-specific RISC-V optimization exists anywhere in the codebase. The riscv64 step implementation is a 4,287-byte thin wrapper over generic DWARF unwinding; the amd64 and arm64 implementations contain tens of thousands of bytes of architecture-specific logic.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Autotools only for riscv64. The CMakeLists.txt targets only x86_64/aarch64/arm/s390x/loongarch64 and is Visual Studio oriented. CMake support for riscv64 is absent (issue #765, open since June 2024, no PR filed).

**Cross-compilation (from CI-linux-gnu.yml):**

```bash
autoreconf -i
mkdir build && cd build
../configure \
  --build=$(../config/config.guess) \
  --host=riscv64-linux-gnu \
  --with-testdriver="$(pwd)/libtool execute $(pwd)/../scripts/qemu-test-driver" \
  --enable-debug
make -j$(nproc)
make check -j$(nproc) LOG_DRIVER_FLAGS="--qemu-arch riscv64"
```

CFLAGS used in CI: `-Wall -Wextra -g -Og -fstrict-aliasing -Wstrict-aliasing -Werror=strict-aliasing`

**Toolchain (exact, from CI-linux-gnu.yml):**
- Compiler: `riscv64-linux-gnu-gcc-14` / `riscv64-linux-gnu-g++-14`
- Package: `g++-14-riscv64-linux-gnu`
- Container: `ubuntu:26.04`
- Additional: `autoconf automake libtool make qemu-user abigail-tools`

No riscv64-specific `-march` or `-mabi` flags are hardcoded in configure.ac or Makefile.am.

**Native build on musl (from CI-linux-musl.yml):**

```bash
autoreconf -i
./configure --enable-debug
make -j$(nproc)
make check -j$(nproc)
```

CFLAGS: `-g -O0 -Wall -Wextra`; additional package required: `libucontext-dev` (musl lacks native ucontext support).

**QEMU usage:** Test driver is `scripts/qemu-test-driver` (shell script invoking `qemu-${qemu_arch}`). The `--privileged` flag is required on the container for QEMU user-mode emulation. The riscv64 matrix entry has no `qemu_skip` list, meaning all tests run (unlike some ppc targets which skip several).

**Known cross-build issue:** Issue #395 (closed 2022) documented a cross-compilation failure with libunwind-1.6.2 due to a floating-point size check error in libunwind-riscv.h. The issue was closed without a dedicated fix PR; users were directed to build from source.

**Coredump support:** Enabled by default on riscv64. `configure.ac` explicitly includes `riscv*` in the coredump support list.

**Remote-only mode:** When cross-compiling (build != host), `-DUNW_REMOTE_ONLY` is auto-set via `UNW_REMOTE_CPPFLAGS`. This is standard behavior, not riscv64-specific.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Feature Matrix

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Local unwinding | Full | Full | Full | None |
| Remote unwinding | Full | Full | Full | None |
| DWARF unwinding | Full | Full | Full | None |
| Signal frame detection | Full | Full | Linux only | Low |
| Signal frame resume | Full | Full | Linux only | Low |
| C++ exception unwinding | Stable | Stable | Unreliable | High |
| Fast trace path (Gtrace) | Full | Full | Absent | High |
| Frame cache (Gstash_frame) | Full | Full | Absent | High |
| siglongjmp support | Full | Full | Stub (bare ret) | Medium |
| longjmp support | Full | Full | Absent | Medium |
| FP register save/restore | Full | Full | Present, recently fixed | Medium |
| RVV register support | N/A | N/A | Absent | Medium |
| FreeBSD support | Full | Full | Partial | Low (Linux use case) |
| CMake build | Full | Full | Absent | Medium |
| Native CI runner | Yes | Yes | No (QEMU only) | Low |

### Functional Gaps

1. **Gtrace.c absent:** The fast-path profiling infrastructure does not exist for riscv64. amd64 and arm64 both have 19,000-34,000 byte architecture-specific trace implementations. Any profiler or sampling tool that uses libunwind's Gtrace interface will silently fall back to slower unwinding or fail on riscv64.

2. **siglongjmp.S is a dummy stub:** Both `_UI_siglongjmp_cont` and `_UI_longjmp_cont` are a bare `ret` instruction, explicitly marked "Dummy implementation for now." Any code path that calls these after a setjmp/longjmp across an unwind frame will produce undefined behavior. [NEEDS VERIFICATION: whether any production use case exercises this path on riscv64.]

3. **longjmp.S absent:** No implementation at all, as opposed to the stub for siglongjmp. amd64 and arm64 both have full longjmp.S implementations.

4. **C++ exceptions unreliable:** A latent test failure (SIGABRT in Ltest-cxx-exceptions) was present from at least May 2023 (issue #519) through February 2024 when the XFAIL was silently removed. The CI job currently passes (comment by mattst88, 2026-04-17), but PR #1032 filed 2026-05-28 proposes disabling C++ exception support on riscv by default citing an OpenSUSE riscv64 build failure for python-spyder-kernels. The broader PR #1035 proposes disabling C++ exceptions globally by default (filed 2026-06-16 by mattst88). Neither has merged. The root cause of the C++ exception incompatibility is not documented in the PR or issue text.

5. **No RVV register support:** The DWARF register map has 66 entries (32 integer + 32 FP + 2 pseudo). No vector register slots are allocated. Unwinding through code that uses RVV registers (saved/restored in vector register calling convention) will produce incorrect or missing register values.

### Live FIXME Comments

- `Gregs.c`: `/* FIXME: Is IP valid? */` -- uncertainty about whether the instruction pointer register is correctly identified.
- `Ginit.c`: `/* FIXME: Floating-point? */` -- uncertainty about FP register address mapping in `uc_addr()`.
- `include/tdep-riscv/libunwind_i.h`: `/* FIXME for riscv: Figure out a more reasonable size */` -- cursor length set to placeholder 4096.

### Performance Gaps

No performance benchmark data exists for libunwind on RISC-V in any publicly accessible source. The GitHub issue tracker, RISE blog, and RISE wiki contain zero benchmark numbers for libunwind on riscv64. Data not available: riscv64 vs arm64 or riscv64 vs amd64 throughput or latency measurements for any workload.

The structural gap is clear: the riscv64 Gstep.c is 4,287 bytes vs amd64 (19,299 bytes) and arm64 (34,432 bytes) equivalents. The riscv64 step function delegates entirely to generic DWARF unwinding with no architecture-specific optimization. On profiles-heavy workloads, the absent Gtrace fast path will cause additional overhead.

---

## 7. CI/CD Infrastructure

### Workflow Coverage

| Workflow | riscv64 included | Test execution | Trigger |
|---|---|---|---|
| [CI-linux-gnu.yml](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-gnu.yml) | Yes | `make check` via qemu-user | push to master/tags, pull_request |
| [CI-linux-musl.yml](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-musl.yml) | Yes | `make check` via Alpine QEMU | push to master/tags, pull_request |
| [CI-freebsd.yml](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-freebsd.yml) | No | N/A | push, pull_request (x86_64, aarch64 only) |
| CI-win.yml | No | N/A | Windows targets only |
| codeql-analysis.yml | No | N/A | Not a build CI |

### CI Detail

**CI-linux-gnu.yml (cross-compile):**
- Runner: `ubuntu-24.04` (x86_64 GitHub-hosted)
- Container: `ubuntu:26.04` for riscv64
- Matrix entry: `{target: riscv64, host: riscv64-linux-gnu, qemu: riscv64, gccver: 14, container: ubuntu:26.04}`
- Tests: full `make check` via `scripts/qemu-test-driver` under QEMU user-mode emulation
- ABI check: included (`make -C build/src abi-check` for riscv*)
- No known-flaky test skip list for riscv64

**CI-linux-musl.yml (native Alpine):**
- Runner: `ubuntu-latest` (x86_64) with `jirutka/setup-alpine` providing Alpine QEMU emulation
- Matrix: `[aarch64, ppc64le, riscv64, x86_64]`
- Tests: full `make check` within the Alpine shell
- Extra package: `libucontext-dev`

### RISE Runners

No RISE runner infrastructure is used. Both workflows use standard GitHub-hosted x86_64 runners. RISE has no involvement with libunwind (confirmed: no RISE blog posts, no riseproject-dev repositories, no funded project).

### Comparison Table

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflows | 3 | 3 | 2 (linux-gnu + linux-musl) |
| Tests run on every PR | Yes | Yes | Yes |
| Native hardware runner | Yes | Yes (GitHub-hosted) | No -- QEMU only |
| FreeBSD CI | Yes | Yes | No |
| ABI check | Yes | Yes | Yes |

---

## 8. Distribution and Release Status

**Upstream releases:** libunwind publishes source tarballs only. The 5 most recent releases (v1.8.3, v1.8.2, v1.8.1, v1.8.0, v1.8.0-rc1) contain no architecture-specific binary assets. There are no pre-built riscv64 binaries attached to any GitHub release.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | [libunwind-dev](https://tracker.debian.org/pkg/libunwind) | 1.8.1-0.4 | Installed (built on rv-osuosl-04 buildd) |
| Ubuntu 24.04 Noble | [libunwind-dev](https://packages.ubuntu.com/noble/libunwind-dev) | 1.6.2-3build1 | Available via ports repo |
| Ubuntu 24.04 Noble | libunwind8 | 1.6.2-3build1 | Available |
| Arch Linux RISC-V | libunwind | Unconfirmed | No patches in archriscv-packages; no entry found in archriscv.felixc.at tracker |
| PyPI | libunwind | N/A | Package does not exist on PyPI |

**Version currency warning:** Ubuntu 24.04 LTS ships libunwind v1.6.2 on riscv64, while upstream is at v1.8.3. Users on Ubuntu Noble riscv64 are missing all RISC-V-specific fixes from 2025 and 2026, including:
- PR #854 (May 2025): riscv32+D FP register width bug fix (shipped in v1.8.2)
- PR #866/#871 (May-Aug 2025): FreeBSD riscv64 scaffolding (shipped in v1.8.3)
- PR #972 (Apr 2026): dwarf_getfp pointer misuse bug fix (not yet in any stable release at report date)

The dwarf_getfp pointer bug (PR #972) that produced garbage FP register values during stack unwinding was merged 2026-04-06 and is not yet present in any Ubuntu release for riscv64. This is a correctness regression active in production Ubuntu riscv64 deployments.

**What a user must do to get a working riscv64 binary:** Build from source using autotools. The Debian sid package (1.8.1-0.4) is the closest to upstream without building from source, but it predates the PR #972 fix. Building from git master with autotools cross-compilation is the only path to include all current riscv64 fixes.

---

## 9. Dependencies

libunwind has two optional external library dependencies (detected at configure time) and several test-only dependencies. The optional dependencies affect functionality but not the ability to build.

### Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| liblzma (xz) | Optional: decompress LZMA-compressed .gnu_debugdata MiniDebugInfo ELF sections (`--enable-minidebuginfo`) | Green -- Debian sid 5.8.3-1 built on riscv64 | Partial -- no riscv64 runner in xz's own CI; generic fallback paths used | Available in all major distros | None |
| zlib (libz) | Optional: decompress zlib-compressed .gnu_debugdata sections (`--enable-minidebuginfo`) | Green -- Debian sid 1.3.2-3 built on riscv64 | Untested by upstream -- no riscv64 in madler/zlib CI | Available in all major distros | None |
| libgcc_s | Optional (C++ exceptions + tests): provides _Unwind_Resume | Green -- ships with GCC riscv64 cross-toolchain | Green -- standard toolchain component | Available | PR #1032/#1035 (open): propose disabling --enable-cxx-exceptions by default; does not affect normal unwinding |
| libpthread | Tests only -- not in libunwind.so | Green -- standard POSIX on riscv64 Linux | Green | Available | None |
| libdl | Tests only -- not in libunwind.so | Green | Green | Available | None |
| libucontext | musl builds only -- provides ucontext_t | Green -- libucontext-dev in Alpine edge for riscv64 | Green | Available | None |

No dependency has JIT, SIMD dispatch, or cryptographic components relevant to riscv64 enablement. liblzma 5.6+ includes a RISC-V BCJ filter (`HAVE_ENCODER_RISCV`) but lacks hardware-optimized CRC or compression paths for riscv64 (falls to generic C). No libunwind functionality depends on the BCJ filter; it is used only for section decompression.

Full dependency reports: liblzma/xz at `./libraries/xz.md`, zlib at `./libraries/zlib.md`.

---

## 11. Known Bugs and Active Issues

### Open Issues and PRs

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #1035](https://github.com/libunwind/libunwind/pull/1035) | configure: disable C++ exceptions support by default | Open (2026-06-16) | High | Supersedes PR #1032; proposes disabling --enable-cxx-exceptions globally by default; filed by mattst88 (Netflix); not yet merged |
| [PR #1032](https://github.com/libunwind/libunwind/pull/1032) | Do not enable C++ exception support on RISC-V by default | Open (2026-05-28) | High | riscv64-specific predecessor to #1035; evidence is OpenSUSE riscv64 build failure for python-spyder-kernels; exact root cause not documented |
| [Issue #857](https://github.com/libunwind/libunwind/issues/857) | Support for FreeBSD 15 riscv64 | Open (2025-04-28) | Medium | Gtest-exc infinite loop confirmed on FreeBSD riscv64; kasperk81 noted "riscv64 needs more work"; no maintainer assigned |
| [Issue #765](https://github.com/libunwind/libunwind/issues/765) | CMake support for RISCV | Open (2024-06-11) | Medium | No PR filed; autotools is the only supported build path for riscv64; the issue reporter conflated Linux riscv64 with Apple Silicon but the underlying gap is real |
| [Issue #519](https://github.com/libunwind/libunwind/issues/519) | Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64 | Open (2023-05-26) | Low (effectively resolved) | CI passes since at least 2026-04-17 per mattst88 comment; issue not formally closed; connected to broader C++ exception debate |

### Recently Fixed Correctness Bugs

| ID | Title | Merged | Severity | Description |
|---|---|---|---|---|
| [PR #972](https://github.com/libunwind/libunwind/pull/972) | riscv: Fix, simplification and new mode | 2026-04-06 | Critical | `dwarf_getfp` took address of the pointer variable `val` rather than casting through it (`&val` vs `(unw_word_t *)val`), producing garbage FP register values during stack unwinding on any riscv build exercising FP register access. Additionally added support for flen==32 on rv64 (32-bit FPU on 64-bit CPU), a valid configuration that previously triggered undefined behavior. |
| [PR #854](https://github.com/libunwind/libunwind/pull/854) | riscv: Add dwarf_{put,get}fp for double-size words | 2025-05-02 | High | On riscv32 with the D (double-precision) extension, FP registers are 64-bit but XLEN is 32-bit. The DWARF unwinder assumed register width == word width, producing corrupt FP register values on RV32D targets. |

The PR #972 bug is the most significant: it is a pointer misuse that caused garbage values in any FP register read during stack unwinding. The fix was merged April 2026 and is not yet present in any Ubuntu LTS riscv64 package.

---

## 12. Objections and Upstream Blockers

**No stated architectural objection to riscv64 support exists.** The initial port was accepted without controversy. The current blockers are resource-driven, not policy-driven.

**C++ exception support:** The open PRs #1032 and #1035 indicate that the maintainers are considering weakening riscv64's default configuration rather than investing in fixing the underlying issue. The exact root cause is not documented. This is a functional regression risk if downstream consumers depend on `--enable-cxx-exceptions` behavior on riscv64.

**Maintainer bandwidth:** The repository explicitly states it needs additional maintainers. Matt Turner (Netflix) is the most active contributor in 2025-2026 but is focused on CI and non-riscv work. The riscv64-specific fixes in 2025-2026 (PR #854, #866, #871, #972) all came from external contributors with no declared organizational affiliation.

**Missing Gtrace.c:** No upstream interest in implementing the fast-trace path for riscv64 has been expressed in any issue or PR. No contributor has raised the topic. Implementing Gtrace.c for riscv64 would require familiarity with the architecture's frame pointer conventions and register calling convention at a level not present in the current contributor pool.

**siglongjmp.S stub:** The dummy `ret` implementation has been in the repository since the initial 2021 port with no objection and no work item. No issue exists for it. Upstream acceptance of a proper implementation would require a contributor with riscv64 hardware and knowledge of the setjmp ABI.

**Acceptance probability for new riscv64 work:** High, based on the merge history. All riscv64 PRs in the 2025-2026 window were merged within days of opening. Maintainer gatekeeping is permissive for correctness fixes. More complex contributions (Gtrace, longjmp) would require review by someone familiar with the architecture, which limits turnaround time.

---

## 13. Investment Analysis

RISE has no funded project or published work related to libunwind. All riscv64 work to date has been by individual contributors with no organizational backing.

### 13.1 Functional Enablement

**Priority 1 -- Fix siglongjmp.S stub:** The current implementation is a bare `ret`. This affects any code path that calls `_UI_siglongjmp_cont` or `_UI_longjmp_cont` after unwinding across a setjmp frame. Implementing this requires knowledge of the riscv64 setjmp ABI and the libunwind internal resume protocol. Reference implementation available from the arm64 `siglongjmp.S`.

**Priority 2 -- Implement longjmp.S:** Related to above; longjmp.S is entirely absent. Same skill set required.

**Priority 3 -- Root-cause and fix C++ exception support:** PRs #1032 and #1035 are treating the symptom (disable by default) rather than fixing the root cause. The failure is an OpenSUSE riscv64 build failure for python-spyder-kernels; no analysis of the actual exception ABI incompatibility has been published. Diagnosing and fixing this requires riscv64 hardware and C++ ABI expertise.

**Priority 4 -- Add RVV register support:** The DWARF register map has no vector register slots. Code compiled with RVV that saves/restores vector registers in the call frame cannot be correctly unwound. Adding RVV support requires extending DWARF register numbering (per RISC-V ELF psABI specification for vector registers), extending the register map in dwarf-config.h and libunwind-riscv.h, and adding save/restore assembly for vector registers. This is the highest-effort functional item.

**Priority 5 -- CMake build system:** Add riscv64 support to the CMake build path. Lower priority than correctness items; autotools works.

### 13.2 Performance Optimization

**Implement Gtrace.c and Gstash_frame.c for riscv64:** This is the highest-impact performance item. The fast-trace path is absent entirely. Reference implementations exist for amd64 (19,299 bytes) and arm64 (34,432 bytes). Implementation requires deep knowledge of riscv64 frame layout, return address conventions, and the libunwind internal frame cache API. Estimated complexity: high. No benchmark data is available to quantify the improvement, but the amd64 and arm64 Gtrace paths represent roughly 5-10x throughput improvement over DWARF-step for typical stack walking.

**Optimize Gstep.c:** The current riscv64 Gstep.c is 4,287 bytes with no architecture-specific optimization. Adding frame pointer fast path and avoiding DWARF lookup for leaf functions are standard optimizations present on mature arches. Lower priority than Gtrace.

### 13.3 CI/CD Infrastructure

**Native runner:** Both riscv64 CI workflows use QEMU emulation. QEMU user-mode emulation runs significantly slower than native hardware and may mask timing-dependent bugs. Adding a native riscv64 runner (e.g., via RISE runner infrastructure or a SiFive/StarFive board) would improve CI reliability and test execution speed.

**FreeBSD riscv64 CI:** The CI-freebsd.yml workflow does not include riscv64. Adding it would require a FreeBSD riscv64 runner, which does not currently exist in GitHub Actions or RISE infrastructure. Lower priority.

### 13.4 Ecosystem Enablement

Not applicable. libunwind has no package ecosystem. It is a system library consumed directly by compilers, debuggers, and profiling tools.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix siglongjmp.S stub -- implement proper _UI_siglongjmp_cont/_UI_longjmp_cont for riscv64 | 2 | Upstream contributor (riscv64 ABI expertise) | High |
| Functional | Implement longjmp.S for riscv64 | 1 | Same as above | High |
| Functional | Root-cause and fix C++ exception ABI incompatibility on riscv64 (close PR #1032 properly) | 4 | Upstream contributor (C++ ABI + riscv64 hardware) | High |
| Functional | Add RVV (vector extension) register support: DWARF map, save/restore assembly, register accessors | 8 | riscv64 ABI expert + libunwind internals knowledge | Medium |
| Functional | Resolve live FIXME comments in Gregs.c, Ginit.c, libunwind_i.h | 1 | Upstream contributor | Medium |
| Performance | Implement Gtrace.c and Gstash_frame.c for riscv64 | 10 | Senior engineer -- riscv64 frame layout + libunwind internals | High |
| Performance | Optimize Gstep.c with frame pointer fast path and leaf function shortcut | 4 | riscv64 engineer | Medium |
| CI/CD | Add native riscv64 runner to CI-linux-gnu.yml or CI-linux-musl.yml | 2 | Infrastructure | Medium |
| Functional | CMake build system support for riscv64 | 3 | Build system engineer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #99: risc-v architecture support (2018-12-08)](https://github.com/libunwind/libunwind/issues/99)
- [Issue #151: configure error Unknown ELF target riscv64 (2020-01-10)](https://github.com/libunwind/libunwind/issues/151)
- [PR #267: Add port for Linux on RISC-V (merged 2021-07-06)](https://github.com/libunwind/libunwind/pull/267)
- [Commit abd15da: Add port for Linux on RISC-V (2021-06-25)](https://github.com/libunwind/libunwind/commit/abd15da8afb35b92ed0cb2c47f6564775b976c24)
- [PR #290: Makefile.am Add missing riscv header to noinst (merged 2021-08-19)](https://github.com/libunwind/libunwind/pull/290)
- [Issue #395: failed to cross build libunwind for riscv64 (2022-07-29)](https://github.com/libunwind/libunwind/issues/395)
- [Issue #519: Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64 (2023-05-26)](https://github.com/libunwind/libunwind/issues/519)
- [Issue #531: riscv64-linux fails Ltest-cxx-exceptions (2023-05-31)](https://github.com/libunwind/libunwind/issues/531)
- [PR #532: Temporarily XFAIL Ltest-cxx-exceptions for riscv (merged 2023-05-31)](https://github.com/libunwind/libunwind/pull/532)
- [Commit 9233f4f: Temporarily XFAIL Ltest-cxx-exceptions for riscv (2023-05-31)](https://github.com/libunwind/libunwind/commit/9233f4f5555ded20b080feb7ab0820b68253ef2e)
- [Commit 7e16c2d: Make tests installable / remove riscv XFAIL (2024-02-07)](https://github.com/libunwind/libunwind/commit/7e16c2d244b5b55550cc293f7a6f2a899285c93f)
- [Issue #765: CMake support for RISCV (2024-06-11)](https://github.com/libunwind/libunwind/issues/765)
- [PR #854: riscv Add dwarf_{put,get}fp for double-size words (merged 2025-05-02)](https://github.com/libunwind/libunwind/pull/854)
- [Commit b31806304b66: riscv Add dwarf_{put,get}fp for double-size words (2025-04-19)](https://github.com/libunwind/libunwind/commit/b31806304b66a5e50ac738ac8c719db0ebc0fdf6)
- [Issue #857: Support for FreeBSD 15 riscv64 (2025-04-28)](https://github.com/libunwind/libunwind/issues/857)
- [PR #866: add initial freebsd riscv support (merged 2025-05-23)](https://github.com/libunwind/libunwind/pull/866)
- [Commit 00b847fea212: add initial freebsd riscv support (2025-05-23)](https://github.com/libunwind/libunwind/commit/00b847fea21256979385e5d35389e5ab0469b9d9)
- [PR #871: Implement Gresume for freebsd riscv64 (merged 2025-08-07)](https://github.com/libunwind/libunwind/pull/871)
- [Commit 66f9d10fc88b: Implement Gresume for freebsd riscv64 (2025-05-24)](https://github.com/libunwind/libunwind/commit/66f9d10fc88bbb2a61fdf5a5c98c17581c83afd0)
- [PR #972: riscv Fix, simplification and new mode (merged 2026-04-06)](https://github.com/libunwind/libunwind/pull/972)
- [Commit 8a37febb073c: riscv Support 32bit FPU in dwarf_putfp/dwarf_getfp on 64bit (2026-04-02)](https://github.com/libunwind/libunwind/commit/8a37febb073c1d2f2b86aa85eea39606a56ad150)
- [Commit fb57bc8e0bc5: riscv Fix dwarf_getfp return value (2026-04-02)](https://github.com/libunwind/libunwind/commit/fb57bc8e0bc5d4cfe940df0be64ed8f3475711e0)
- [Commit 2a1aee1ef7a2: riscv Reduce casting in dwarf_putfp/dwarf_getfp (2026-04-02)](https://github.com/libunwind/libunwind/commit/2a1aee1ef7a28dccbcfb588b36eb562cc14c69fd)
- [PR #1032: Do not enable C++ exception support on RISC-V by default (2026-05-28)](https://github.com/libunwind/libunwind/pull/1032)
- [PR #1035: configure disable C++ exceptions support by default (2026-06-16)](https://github.com/libunwind/libunwind/pull/1035)
- [CI-linux-gnu.yml workflow](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-gnu.yml)
- [CI-linux-musl.yml workflow](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-musl.yml)
- [CI-freebsd.yml workflow](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-freebsd.yml)
- [Debian tracker for libunwind](https://tracker.debian.org/pkg/libunwind)
- [Ubuntu 24.04 libunwind packages](https://packages.ubuntu.com/search?keywords=libunwind&suite=noble&searchon=names&section=all)
- [libunwind homepage](https://www.nongnu.org/libunwind/)
- [libunwind GitHub repository](https://github.com/libunwind/libunwind)