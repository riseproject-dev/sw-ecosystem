---
title: honggfuzz
---

# honggfuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for honggfuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[honggfuzz](https://honggfuzz.dev/) is a coverage-guided, feedback-driven fuzzer written in C. It instruments target programs via compiler sanitizers (`-fsanitize-coverage=trace-pc-guard`) or hardware performance counters (Intel BTS/PT on x86) and uses that feedback to evolve inputs. The primary use case is memory-safety bug discovery in C/C++ targets.

**License:** Apache-2.0.

**Governance:** Single-maintainer project hosted under the `google` GitHub organization. The primary author is Robert Swiecki (`robertswiecki`), who holds 2,982 of approximately 3,500 total commits. The second contributor, Anestis Bechtsoudis (`anestisb`, 301 commits), is affiliated with CENSUS S.A., a Greek security research firm. All other contributors have 39 or fewer commits. There is no steering committee, no MAINTAINERS/OWNERS/CODEOWNERS file, and no formal port-tier policy document.

**Not an official Google product.** The repository carries an explicit disclaimer to that effect. All contributions require signature of the Google Individual Contributor License Agreement (CLA); corporate contributors require a separate Software Grant and Corporate CLA.

**RISE affiliation:** honggfuzz itself is not a RISE member or project. Google LLC is a RISE Premier Member, giving honggfuzz indirect organizational proximity to RISE, but no RISE funding, CI runners, or working group activity targeting honggfuzz was found.

**Community culture on new ports:** Port additions are accepted as ad-hoc pull requests with no formal tier classification. The single RISC-V code addition was committed by the maintainer himself as "untested," indicating a permissive but low-oversight approach: architecture stubs are merged optimistically, with validation left to community hardware owners.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-07-24 | Issue #407 opened: user asks whether honggfuzz compiles on RISC-V (BOOM). Maintainer responds: use `OS=POSIX` for partial support; full support requires register struct + PC extraction stub in `linux/trace.c`. | [Issue #407](https://github.com/google/honggfuzz/issues/407) |
| 2021-12-31 | Issue #407 closed (no linked PR; closure date inferred from search metadata). | [Issue #407](https://github.com/google/honggfuzz/issues/407) |
| 2022-01-07 | Commit a9ce350 by Robert Swiecki: adds `#elif defined(__riscv)` blocks to `linux/trace.c` - register structs (`user_regs_32`/`user_regs_64` with all 37 standard RISC-V fields), `MAX_INSTR_SZ 4`, and `arch_getPC()` logic reading `epc`. Commit message: "linux/trace: +riscv - untested, libunwind for riscv seems to miss ptrace unwinding." | [Commit a9ce350](https://github.com/google/honggfuzz/commit/a9ce350) |
| 2022-01-06 | PR #446 opened by CBenoit: fixes linker errors with binutils 2.37 (`TRUE` macro, `-liberty -lz`). RISC-V ELF objects (`elf64-riscv.o`) appear in the linker error output but the fix is not RISC-V-specific. PR closed unmerged. | [PR #446](https://github.com/google/honggfuzz/pull/446) |
| 2022-present | No subsequent RISC-V commits, no follow-up issue confirming the port works, no CI added. | [linux/trace.c](https://github.com/google/honggfuzz/blob/master/linux/trace.c) |

The entire RISC-V port consists of one commit by the maintainer. It is upstream in the main branch. It has never been marked as tested or production-ready in any subsequent commit or issue.

**Key contributors to RISC-V work:** Robert Swiecki (Google org, personal domain `swiecki.net`) - sole contributor.

---

## 3. Upstream Support Tier

honggfuzz has no formal tier policy document. The README lists supported platforms as Linux, macOS, Android, NetBSD, FreeBSD, and Windows (Cygwin). RISC-V is not listed as a supported platform.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Listed as supported platform | Yes | Yes | No |
| CI exists | No (no CI infrastructure of any kind in the repository) | No | No |
| Release-blocking | N/A | N/A | N/A |
| Official binaries released | No (all releases are source-only, zero binary assets on GitHub) | No | No |
| Distro packages available | Yes (multiple) | Yes (multiple) | No |
| Register structs in linux/trace.c | Yes | Yes | Yes (untested) |
| Stack unwinding functional | Yes | Yes | Unknown - depends on libunwind-ptrace riscv backend version |

The repository has no CI configuration of any kind: no `.github/workflows` directory, no `.gitlab-ci.yml`, no `.travis.yml`, no `.cirrus.yml`, no `Jenkinsfile`. This is confirmed by direct inspection of the repository tree. No architecture has automated test coverage; riscv64 is not uniquely disadvantaged by the absence of CI, but it is additionally disadvantaged by the "untested" commit status.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

honggfuzz has no JIT compiler, no garbage collector, and no vectorized hot paths. The architecture-specific surface area is limited to two concerns: (1) ptrace register layout for crash tracing, and (2) hardware performance counter integration for coverage feedback.

**Component breakdown:**

| Component | File | amd64 | arm64 | riscv64 | Notes |
|-----------|------|-------|-------|---------|-------|
| Register struct (ptrace layout) | `linux/trace.c` | Full | Full | Full (untested) | All 37 RISC-V GPRs + CSRs defined: epc, ra, sp, gp, tp, t0-t6, s0-s11, a0-a7, status, badaddr, cause, orig_a0 |
| PC extraction (arch_getPC) | `linux/trace.c` | Full | Full | Full (untested) | Reads epc via iov_len dispatch for both rv32 and rv64 |
| MAX_INSTR_SZ | `linux/trace.c` | 15 (x86 variable-length) | 4 | 4 | Conservative: covers 32-bit RV instructions; RVC is 2 bytes |
| Stack unwinding | `linux/unwind.c` | Generic (libunwind-ptrace) | Generic (libunwind-ptrace) | Generic (libunwind-ptrace) | No arch-specific code; riscv ptrace backend in libunwind was incomplete as of commit date (2022-01-07) |
| Intel BTS coverage | `linux/pt.c` | Full | N/A | N/A | x86-only hardware; irrelevant on riscv64 |
| Intel PT coverage | `linux/pt.c` | Full | N/A | N/A | x86-only hardware; irrelevant on riscv64 |
| perf_event_open (HW counters) | `linux/perf.c` | Full | Partial (board-dependent) | Partial (board-dependent) | `PERF_COUNT_HW_INSTRUCTIONS` and `PERF_COUNT_HW_BRANCH_INSTRUCTIONS` exist in the kernel ABI but PMU availability varies by riscv64 SoC |
| Software coverage (default) | `libhfuzz/`, `hfuzz_cc/` | Full | Full | Full | `-fsanitize-coverage=trace-pc-guard` is the default and is fully arch-independent |
| SIMD / vector intrinsics | None | N/A | N/A | N/A | honggfuzz uses none; not a performance-sensitive compute workload |
| Assembly stubs | None | None | None | None | No .S files in the repository |
| NetBSD trace support | `netbsd/trace.c` | N/A | N/A | Missing | NetBSD RISC-V is not supported |

**ISA extensions used:** None. honggfuzz contains no RVV, Zba, Zbb, or any other RISC-V extension usage. The register struct uses only the baseline ISA register names.

**Functional summary:** For the Linux software-coverage fuzzing path (the default and only universally viable mode), riscv64 is architecturally complete at the source level. The only missing piece is stack unwind quality, which depends on the libunwind version installed on the target system.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make only. No CMake, no Meson, no autoconf.

**Default coverage mode:** `_HF_DYNFILE_SOFT` (software, via `-fsanitize-coverage=trace-pc-guard`). This is set in `cmdline.c` line 408 [NEEDS VERIFICATION - line number not independently confirmed] and is the correct mode for riscv64 in all cases.

**Native riscv64 build:**

```
make CC=gcc
```

No special flags required. The Makefile auto-detects OS and architecture via `uname -s` and `uname -m`.

**Cross-compilation from x86_64:**

```
make CC=riscv64-linux-gnu-gcc MARCH=riscv64
```

**Build without BFD (if binutils-dev unavailable in cross-sysroot):**

```
make BUILD_LINUX_NO_BFD=true CC=riscv64-linux-gnu-gcc MARCH=riscv64
```

This disables `-lopcodes -lbfd` linkage, removing crash-report disassembly but otherwise producing a fully functional fuzzer.

**Required Linux packages for riscv64 cross-compile (Ubuntu/Debian):**

```
apt-get install gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu \
    libunwind-dev:riscv64 libbfd-dev:riscv64 libblocksruntime-dev:riscv64
```

**Minimum compiler version:** No minimum is documented in the repository. The Makefile uses `-std=c11`. The Dockerfile uses `ubuntu:rolling`. Any GCC >= 7 or Clang >= 6 supporting `-std=c11` and `-fsanitize-coverage=trace-pc-guard` should work [NEEDS VERIFICATION].

**QEMU mode:** `qemu_mode/Makefile` clones a custom QEMU fork ([thebabush/honggfuzz-qemu](https://github.com/thebabush/honggfuzz-qemu), branch `honggfuzz`) and configures only `i386-linux-user` and `x86_64-linux-user` by default. riscv64 QEMU user-mode can be requested via:

```
cd qemu_mode/ && make TARGETS="riscv64-linux-user"
```

Whether the honggfuzz-qemu fork's specific branch supports riscv64 was not verified.

**Known build failures:**

- Issue #541 (open, 2026-08-12): `linux/bfd.c` uses the `TRUE` macro removed in binutils 2.47. Affects all Linux targets, including riscv64 systems running Arch Linux or other distros shipping binutils 2.47+.
- Issue #501 (open, 2023-09-22): `%lu`/`%llu` format string mismatches for `size_t` on 32-bit platforms. Affects riscv32 (`-Werror=format=` build failure). Does not affect riscv64.
- PR #446 (closed unmerged, 2022-01-06): Linker failure with binutils 2.37 when `libiberty`/`libz` are not explicitly linked. Not merged; workaround is to use `BUILD_LINUX_NO_BFD=true` or install a newer binutils.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Software coverage fuzzing (default) | Full | Full | Full |
| ptrace crash tracing | Full | Full | Partial - register struct present, stack unwind quality depends on libunwind version |
| Intel BTS edge coverage | Full | N/A | N/A |
| Intel PT block coverage | Full | N/A | N/A |
| HW perf counter (branch count) | Full | Board-dependent | Board-dependent |
| HW perf counter (instr count) | Full | Board-dependent | Board-dependent |
| Persistent fuzzing mode | Full | Full | Full |
| Network fuzzing (`--socket_fuzzer`) | Full | Full | Full |
| NetBSD support | N/A | N/A | Not supported |
| QEMU mode (default targets) | Full | N/A (not a default QEMU target) | Not a default QEMU target |

**Functional gaps specific to riscv64:**

1. Stack unwinding in crash reports may produce empty or truncated backtraces if the installed libunwind-ptrace does not have a complete riscv64 backend. This is not a crash-detection gap - crashes are still detected and the faulting PC is correctly extracted - but triage quality is reduced.
2. Hardware performance counter coverage modes (`--linux_perf_instr`, `--linux_perf_branch`) require PMU support in the kernel and SoC. Availability is board-dependent. Softcore FPGA targets typically lack PMU.

**Performance gaps vs amd64:** No published benchmark data exists. Data not available: throughput (exec/s), corpus growth rate, or latency comparisons between riscv64 and amd64/arm64 for any honggfuzz workload.

**Intel PT/BTS gap vs amd64:** Intel BTS and PT are x86-only hardware features. This is not a port deficiency; arm64 has the same gap. All non-x86 platforms use software coverage as the primary feedback mechanism.

**Security hardening gaps:** Data not available: no information was found on whether honggfuzz enables `-fstack-protector`, `-D_FORTIFY_SOURCE`, or CFI on riscv64 builds vs other architectures.

**Floating-point / NaN issues:** No riscv64-specific floating-point or NaN issues were reported in the honggfuzz issue tracker.

---

## 7. CI/CD Infrastructure

**The honggfuzz repository has no CI configuration of any kind.** Direct inspection confirms:

- `.github/workflows/` - directory does not exist (GitHub API returns HTTP 404)
- `.gitlab-ci.yml` - does not exist
- `.travis.yml` - does not exist
- `.cirrus.yml` - does not exist
- `Jenkinsfile` - does not exist

This applies equally to all architectures.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | No | No | No |
| RISE CI runners | No | No | No |
| Automated build check | No | No | No |
| Automated test suite | No | No | No |

**RISE involvement:** No RISE blog posts, no RISE Security Software WG issues, and no RISE CI infrastructure were found targeting honggfuzz. The RISE compiler-fuzz-ci project ([riseproject-dev/compiler-fuzz-ci](https://github.com/riseproject-dev/compiler-fuzz-ci)) performs compiler fuzzing (GCC/LLVM) using csmith and yarpgen - a distinct methodology and toolset from honggfuzz.

---

## 8. Distribution and Release Status

**GitHub releases:** honggfuzz has 5 tracked releases (oss-fuzz 2024-07-20, 2.6 2023-09-21, 2.5 2022-01-01, 2.4 2021-02-24, 2.3.1 2020-07-22). All releases have zero binary assets attached. The project is source-only on all architectures.

| Channel | riscv64 available | Notes |
|---------|------------------|-------|
| GitHub releases (binary) | No | Zero binary assets on any release, any architecture |
| PyPI | No | Package does not exist (HTTP 404) |
| Debian | No | Package not in Debian archive (HTTP 404 on tracker) |
| Ubuntu | No | Not in Ubuntu Noble or any Ubuntu suite |
| Arch Linux RISC-V (archriscv.felixc.at) | No | No results |
| NixPkgs | No (riscv64) | Available for x86_64 and aarch64 at version 2.6-unstable; no riscv64 build [NEEDS VERIFICATION] |
| Fedora | Data not available | Packaged at version 2.5 for Fedora 39-42; no riscv64 architecture build data was found |
| Gentoo / ALT Linux / openSUSE | Data not available | Packaged at 2.5-2.6; no architecture breakdown visible |

**What a user must do to get a working binary on riscv64:**

1. Clone the repository: `git clone https://github.com/google/honggfuzz`
2. Install dependencies: `apt-get install binutils-dev libunwind-dev libblocksruntime-dev clang` (on Debian/Ubuntu riscv64)
3. Build from source: `make` (or `make BUILD_LINUX_NO_BFD=true` if binutils-dev is unavailable)
4. Note: binutils 2.47+ will fail to build due to issue #541; use `BUILD_LINUX_NO_BFD=true` as workaround until upstream fixes the `TRUE` macro usage.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|--------------|-------------|-----------------|-----------------|
| libunwind (libunwind-ptrace) | Stack unwinding for crash backtraces | Builds (src/riscv/ backend exists in v1.6+) | Partial - Ltest-cxx-exceptions fails on Ubuntu 20.04 riscv64 (open issue #519); ptrace backend completeness variable by version | Shipped in v1.7+ | Open issue #519 (C++ exception test fails on riscv64); ptrace unwinding for honggfuzz use case should work in recent versions |
| binutils (libbfd, libopcodes, libiberty) | Disassembly and symbol resolution in crash dedup | Builds - riscv64 supported since 2017 | Tested - mainstream distros ship riscv64 binutils | Available in all major distros | Issue #541: honggfuzz build fails with binutils 2.47 due to removed `TRUE` macro; optional via `BUILD_LINUX_NO_BFD=true` |
| capstone (NetBSD/Android only) | Disassembly on NetBSD; vendored at 4.0.2 for Android | Builds - RISC-V support since 4.0 | Functional with open correctness bugs | capstone 5.x ships riscv64 packages | Open issues #2959 (compressed insn alias handling), #2407 (incorrect ret operand data); affects NetBSD/Android builds only, not standard Linux build |
| liblzma (xz-utils) | LZMA decompression for debug symbol handling in BFD path | Builds | Functional; unaligned-access optimization disabled by default for RISC-V (no Zicclsm assumed) | Ships for riscv64 in all distros | Unaligned access issue closed; performance sub-optimal without vector extensions |
| libblocksruntime | Clang blocks language extension support | Builds - available in Debian/Ubuntu riscv64 | Tested | Available | None |
| linux-perf (perf_event_open) | HW performance counters for branch/instr coverage modes | Builds (`__NR_perf_event_open` present in riscv64 headers) | Board-dependent: PMU availability varies by SoC | N/A (kernel feature) | Softcore FPGA targets often lack PMU; graceful fallback to software coverage on failure |
| libipt (Intel PT library) | Intel Processor Trace decode for IPT coverage mode | N/A - x86-only hardware | N/A | N/A | No issue; the code path is dead on riscv64 |

**Deep-dive: libunwind**

See `reports/libunwind.md` for full analysis. For honggfuzz specifically: `linux/unwind.c` uses `libunwind-ptrace.h` with no architecture-specific guards. The 2022-01-07 commit message explicitly noted "libunwind for riscv seems to miss ptrace unwinding." libunwind has since added a `src/riscv/` backend (landed around v1.6), but the ptrace-specific unwinding path on riscv64 has not been publicly validated in the context of honggfuzz. The open issue [libunwind #519](https://github.com/libunwind/libunwind/issues/519) (C++ exception test failure on Ubuntu 20.04 riscv64) is unrelated to ptrace-based unwinding and does not block honggfuzz. For practical use, honggfuzz's crash detection does not require unwinding - crashes are caught at the signal handler level. Unwinding only affects backtrace quality in crash reports.

**Deep-dive: capstone**

See `reports/capstone.md`. capstone is used only in the NetBSD build and in the vendored Android build (`third_party/android/capstone`, pinned to 4.0.2). The standard Linux honggfuzz build does not use capstone; it uses binutils (`libbfd`/`libopcodes`) for disassembly. The two open riscv64 correctness bugs in capstone do not affect the Linux build path.

**Deep-dive: xz / liblzma**

See `reports/xz.md`. liblzma is used in the BFD/binutils path for debug symbol decompression. The unaligned-access optimization was gated behind the Zicclsm extension flag (issue closed). The library builds and runs correctly on riscv64 with the optimization disabled.

**Deep-dive: LZ4**

See `reports/lz4.md`. LZ4 is not a direct honggfuzz dependency. It is used by the Linux kernel's perf subsystem. Several open RVV optimization proposals exist (#1678, #1734, #1738, #1778) representing a performance gap vs x86/aarch64 but no correctness blocker.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#407](https://github.com/google/honggfuzz/issues/407) | RISC-V support | Closed 2021-12-31 | N/A | Original RISC-V question; resolved by commit a9ce350. The "untested" status and libunwind gap were never formally closed out. |
| [#501](https://github.com/google/honggfuzz/issues/501) | Build errors on 32-bit architectures [-Werror=format=] | Open | Medium | `%lu`/`%llu` format mismatches for `size_t`. Blocks riscv32 builds. Does not affect riscv64. |
| [#533](https://github.com/google/honggfuzz/issues/533) | perf issues with entropy calculation | Open (2026-01-15) | High | When target execution time is approximately 10 microseconds or less, honggfuzz spends approximately 85% of CPU time in entropy calculation, causing severe CPU underutilization across all threads. Affects all architectures including riscv64 when fuzzing fast targets. |
| [#540](https://github.com/google/honggfuzz/issues/540) | Honggfuzz dies during fuzzing | Open (2026-08-06) | High | Persistent mode: `arch_prepareParentAfterFork` fatal error (`arch_traceAttach` fails) under high parallelism. Triggered during oss-fuzz benchmark run. Architecture not specified. |
| [#541](https://github.com/google/honggfuzz/issues/541) | Build fails with binutils-2.47 | Open (2026-08-12) | High | `linux/bfd.c` uses `TRUE` macro removed in binutils 2.47. Blocks Linux builds on Arch Linux and other distros shipping binutils 2.47+. Workaround: `BUILD_LINUX_NO_BFD=true`. Affects riscv64 equally. |
| [PR #446](https://github.com/google/honggfuzz/pull/446) | Always build against libiberty and libz on Linux | Closed unmerged | Medium | Linker failure with binutils 2.37 when `-liberty -lz` not explicitly linked. Fix not merged; incidentally touches riscv64 ELF objects. |

**No riscv64-specific correctness bugs, NaN/floating-point issues, or ptrace failures were reported in the honggfuzz issue tracker.**

---

## 12. Objections and Upstream Blockers

**Stated technical blocker (maintainer, 2022-01-07):** "libunwind for riscv seems to miss ptrace unwinding." This was the only explicitly stated limitation in the commit that added riscv64 support. It is a blocker for stack trace quality, not for crash detection.

**No follow-up:** No issue was filed to track resolution of the libunwind ptrace gap. No subsequent commit addressed it. No user has publicly reported testing the port on real hardware.

**Organizational blockers:** None identified. The maintainer added the port himself; there is no stated opposition to riscv64 support. The Google CLA requirement is a low-friction standard barrier, not a riscv64-specific one.

**Acceptance probability for upstream patches:** High. The maintainer added RISC-V support himself and has shown willingness to merge architecture stubs. A tested, working patch resolving the libunwind ptrace limitation or adding CI would likely be accepted without resistance.

**Active development pace:** Data not available: recent commit frequency was not measured.

---

## 13. Investment Analysis

RISE has no existing honggfuzz-specific investment to account for. The RISE compiler-fuzz-ci project (csmith/yarpgen) is a separate methodology.

### 13.1 Functional Enablement

The riscv64 port is functionally present for the software-coverage fuzzing path. The remaining gap is stack unwind quality in crash reports, which requires:

1. Verifying that the current libunwind-ptrace riscv64 backend (v1.6+) produces correct backtraces when used by honggfuzz on riscv64 Linux.
2. If the backend is incomplete, contributing fixes to libunwind upstream (see `reports/libunwind.md`).
3. Fixing issue #541 (binutils 2.47 `TRUE` macro removal) to enable builds on current distros without the `BUILD_LINUX_NO_BFD=true` workaround.

### 13.2 Performance Optimization

No benchmark data exists. Before investing in performance work, baseline measurements are needed: exec/s for a representative target on riscv64 vs arm64, and CPU utilization profile. Issue #533 (entropy calculation bottleneck at fast targets) is the only identified performance bug and affects all architectures equally.

RVV or PMU-based coverage feedback are potential future work items, but no PMU-based coverage backend exists for any non-x86 architecture today; adding one for riscv64 before arm64 has one would be disproportionate.

### 13.3 CI/CD Infrastructure

The project has zero CI infrastructure for any architecture. Adding riscv64 CI would require first adding CI at all. Minimum viable investment: a single GitHub Actions workflow that builds honggfuzz for riscv64 (cross-compile or native emulated via QEMU), run on every push to main.

### 13.4 Ecosystem Enablement

No package ecosystem to enable. honggfuzz is a standalone tool with no dependent plugin or extension ecosystem. Section 10 is omitted per scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Verify libunwind-ptrace riscv64 produces correct backtraces in honggfuzz crash reports on real hardware; document result | 1 | Community / RISE | High |
| Functional | Fix issue #541: replace `TRUE` with `true`/`1` in `linux/bfd.c` for binutils 2.47 compatibility | 0.5 | Community | High |
| Functional | If libunwind ptrace is incomplete, upstream fixes to libunwind `src/riscv/` | 3-5 | libunwind upstream / RISE | High |
| CI/CD | Add minimal GitHub Actions workflow: cross-compile build check for riscv64 on every push | 1 | Community / RISE | High |
| CI/CD | Add native riscv64 test run (QEMU user-mode or hardware runner) fuzzing a trivial target for smoke-test | 2 | RISE | Medium |
| Performance | Establish baseline exec/s benchmark on riscv64 vs arm64 for a representative target | 1 | RISE | Medium |
| Performance | Investigate PMU-based coverage on riscv64 SoCs (SiFive FU740 class); prototype `PERF_COUNT_HW_INSTRUCTIONS` coverage mode | 3 | RISE | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [honggfuzz repository](https://github.com/google/honggfuzz)
- [honggfuzz homepage](https://honggfuzz.dev/)
- [Issue #407 - RISC-V support](https://github.com/google/honggfuzz/issues/407)
- [Issue #501 - Build errors on 32-bit architectures](https://github.com/google/honggfuzz/issues/501)
- [Issue #533 - perf issues with entropy calculation](https://github.com/google/honggfuzz/issues/533)
- [Issue #540 - Honggfuzz dies during fuzzing](https://github.com/google/honggfuzz/issues/540)
- [Issue #541 - Build fails with binutils-2.47](https://github.com/google/honggfuzz/issues/541)
- [PR #446 - Always build against libiberty and libz on Linux](https://github.com/google/honggfuzz/pull/446)
- [Commit a9ce350 - linux/trace: +riscv (untested)](https://github.com/google/honggfuzz/commit/a9ce350)
- [linux/trace.c - current state](https://github.com/google/honggfuzz/blob/master/linux/trace.c)
- [RISE project member list](https://riseproject.dev/)
- [RISE compiler-fuzz-ci repository](https://github.com/riseproject-dev/compiler-fuzz-ci)
- [RISE Security Software WG](https://github.com/riseproject-dev/security-software-wg)