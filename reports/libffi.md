---
title: libffi
categories:
  - libraries
---

# libffi

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libffi
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libffi is a portable C library that provides a programmatic interface for calling compiled functions whose argument types and counts are not known at compile time. It implements the calling conventions (ABI) for each supported platform in hand-written assembly, and exposes closures -- machine-code trampolines that allow C code to be called from foreign-function interfaces as if it were a native function pointer. It is a foundational dependency for CPython's `ctypes` module, Ruby's `fiddle`, GHC's foreign function interface, LuaJIT bindings, and Node.js's native FFI addon.

**Governance:** libffi uses a BDFL model with no formal foundation, governing board, or MAINTAINERS file. Anthony Green (Red Hat) created the project and holds 1,091 commits -- more than ten times the second-highest contributor (Richard Henderson, Linaro, 95 commits). There is no CODEOWNERS file and no documented tier policy. Contributions are accepted via GitHub pull requests; Anthony Green merges them directly, often without a formal review comment trail (both PR #933 and PR #972 were merged directly by atgreen with no recorded code review).

**License:** MIT variant. The GitHub license API returns "Other / NOASSERTION" because the text is not a standard SPDX-identified form.

**RISE involvement:** None. A full scan of all 27 blog posts on [riseproject.dev](https://riseproject.dev/blog) from May 2024 through June 2026 found zero references to libffi. No RISE RFP or funded project targets libffi. Anthony Green's employer (Red Hat) is a RISE Premier Member, but that affiliation has not produced any RISE-tracked libffi work.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| ~2015 | Initial RISC-V port written by Michael Knyszek and Andrew Waterman at UC Berkeley | [PR #281 commit header](https://github.com/libffi/libffi/pull/281) |
| 2016-09-09 | PR #281 submitted to upstream by Stef O'Rear (sorear), a cleaned rebase of the Berkeley work | [PR #281](https://github.com/libffi/libffi/pull/281) |
| 2018-03-11 | PR #281 merged by Anthony Green; commit SHA 3840d49a; tested rv32imac/ilp32, rv32g/ilp32d, rv64imac/lp64, rv64g/lp64d under QEMU | [commit 3840d49](https://github.com/libffi/libffi/commit/3840d49a) |
| 2018-08-09 | Go closure support added for RISC-V (commit 4cb776b, andreas-schwab) | [commit 4cb776b](https://github.com/libffi/libffi/commit/4cb776b) |
| 2019-11-23 | libffi 3.3 released; first release containing RISC-V support | GitHub releases |
| 2022-02-13 | Sign/zero-extension of small integer return types added (commit aa3fce0, andreas-schwab); resolves part of issue #466 | [commit aa3fce0](https://github.com/libffi/libffi/commit/aa3fce0) |
| 2022-05-24 | FreeBSD riscv fix: `__clear_cache` was calling abort() under Clang/compiler-rt on non-x86 FreeBSD (PR #708, kev009) | [PR #708](https://github.com/libffi/libffi/pull/708) |
| 2022-10-10 | Caller-side struct copy for large structs on riscv64 (PR #738, andreas-schwab); merged into v3.4.4 | [PR #738](https://github.com/libffi/libffi/pull/738) |
| 2025-08-07 | Static trampoline support for riscv32 and riscv64 Linux ABIs (PR #933, peter-bergner, IBM) | [PR #933](https://github.com/libffi/libffi/pull/933) |
| 2026-06-18 | Float marshal bug fixed for ABI_FLEN >= 64: floats were double-widened instead of NaN-boxed (PR #972, kxxt) | [PR #972](https://github.com/libffi/libffi/pull/972) |
| 2026-06-20 | libffi v3.6.0 released; first release containing both PR #933 and PR #972 | GitHub releases |

The port is fully upstream. The review-to-merge cycle for the original port was 19 months (Sep 2016 to Mar 2018). Subsequent RISC-V fixes have merged within days to weeks. There is no external fork or vendor tree carrying riscv64-specific patches beyond upstream.

Key contributors to the riscv64 port:

| Contributor | Affiliation | Role |
|-------------|-------------|------|
| Michael Knyszek | UC Berkeley | Original port author (2015) |
| Andrew Waterman | UC Berkeley | Original port co-author |
| Stef O'Rear (sorear) | -- | Upstream submission (2016-2018) |
| Andreas Schwab | -- | Integer widening, struct copy, FreeBSD fixes |
| Peter Bergner | IBM | Static trampoline support |
| Levi Zim (kxxt) | -- | Float marshal NaN-boxing fix |

---

## 3. Upstream Support Tier

libffi has no documented formal tier policy. The README states that listed platforms are "basic configurations that have been tested at the time of release." Both "RISC-V 32-bit/Linux/GCC" and "RISC-V 64-bit/Linux/GCC" appear in the supported platforms table in README.md as tested configurations for v3.6.0.

The functional indicator of tier status is CI inclusion. riscv64 was added to the `build-qemu` CI matrix alongside aarch64, ppc64le, s390x, and armv7 -- it is a first-class CI target. The CI runs the full DejaGNU testsuite (`make check`) on every push and pull request to master.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| In README supported platforms | Yes | Yes | Yes |
| CI on push/PR | Yes (native) | Yes (QEMU) | Yes (QEMU) |
| Native CI runner | Yes | No | No |
| Release blocking | Yes | Yes | Yes (same matrix) |
| Official binary in releases | Windows MSVC only | No | No |
| Static trampoline support | Yes | Yes | Yes (since v3.6.0) |
| Known open ABI bugs | 0 | 1 (#694 shared) | 3 (#466, #694, #777) |

No native riscv64 hardware runner is used in CI. All riscv64 testing is QEMU user-mode emulation under `ubuntu-latest` (x86_64 host). This is not a formal downgrade in tier by the project's own criteria, but it means hardware-specific timing bugs and instruction-level errata go undetected.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libffi's architecture-specific work is limited to: (1) argument marshaling C code implementing the platform ABI, and (2) hand-written assembly stubs for call dispatch and closure trampolines. There is no JIT compiler, no SIMD, no crypto, and no GC barrier code in libffi.

The riscv64 implementation lives in `src/riscv/` and consists of four files:

- `src/riscv/ffi.c` (571 lines): ABI marshaling, call, closure, Go closure, static trampoline logic
- `src/riscv/sysv.S` (317 lines): `ffi_call_asm`, `ffi_closure_asm`, `ffi_go_closure_asm`, `trampoline_code_table`
- `src/riscv/ffitarget.h` (header): ABI enum, type definitions, capability flags
- `src/riscv/internal.h` (header): static trampoline constants

`configure.host` maps `riscv*-*` to `TARGET=RISCV; TARGETDIR=riscv; SOURCES="ffi.c sysv.S"`. The same source files cover both RV32 and RV64, gated by `__SIZEOF_POINTER__ == 8`.

**ISA extensions used:** None. The implementation uses base RV32I/RV64I plus F (single-precision) and D (double-precision) floating-point ABI variants. No RVV (vector), no Zba/Zbb/Zbc/Zbs (bit-manipulation), no Zfh (half-precision float), no Zicsr, no compressed (the `trampoline_code_table` in sysv.S uses `.option norvc` to force 32-bit encoding for alignment). The sysv.S assembly uses only `a0-a7`, `fa0-fa7`, `t1`, `t2`, `s0`, `ra` -- all base ISA registers.

**Float ABI handling:** `ffi.c` selects the float register type at compile time via `__riscv_float_abi_double` (LP64D) or `__riscv_float_abi_single` (LP64F). NaN-boxing of 32-bit floats in 64-bit FP registers is implemented via a `float_reg` union (added in PR #972). Prior to PR #972 (merged 2026-06-18), the float marshaling path double-widened floats instead of NaN-boxing them, producing incorrect results for any code calling `float`-argument functions through libffi on riscv64. This bug affected Node.js (`add_f32(1.25, 2.75)` returned wrong result) and was present in all released versions prior to v3.6.0.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Integer call ABI | Full, hand-tuned asm | Full | Full |
| Float/FP ABI (correct NaN-boxing) | N/A (x87/SSE) | Full | Full (since v3.6.0 only) |
| Large struct pass-by-ref copy | Full | Partial (issue #694 open) | Partial (issue #694 open) |
| Closures | Full | Full | Full |
| Go closures | Full | Full | Full |
| Static trampolines (W^X) | Full | Full | Full (since v3.6.0) |
| Variadic function support | Full | Full | Full |
| Small integer return widening | Full | Full | Partial (issue #466 open) |
| FreeBSD support | Full | Full | Full (PR #708, 2022) |
| musl cross-compilation | Full | Full | Broken (issue #777 open) |
| RVV / SIMD | N/A | N/A (NEON not used) | N/A (not applicable) |

---

## 5. Build System, Cross-Compilation, and Toolchain

libffi uses autotools exclusively. There is no CMakeLists.txt.

**Native build on riscv64:**

```
./autogen.sh   # only needed from git, not release tarball
./configure
make
make check
sudo make install
```

**Cross-compile from x86_64 (Debian/Ubuntu):**

```
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu qemu-user-static
./autogen.sh
./configure --host=riscv64-linux-gnu \
            CC=riscv64-linux-gnu-gcc \
            CXX=riscv64-linux-gnu-g++
make
export QEMU_LD_PREFIX=/usr/riscv64-linux-gnu
make check
```

**Reproduce CI QEMU container build:**

```
docker build --platform linux/riscv64 \
  -f .ci/Containerfile.debian \
  -t libffi-ci-riscv64 .ci

docker run --rm -t \
  --platform linux/riscv64 \
  -v $(pwd):/opt \
  -e HOST=riscv64-unknown-linux-gnu \
  libffi-ci-riscv64 \
  bash -c /opt/.ci/build-in-container.sh
```

**Toolchain requirements:**

- GCC targeting riscv64-linux-gnu (any version capable of the LP64D ABI). The CI uses Debian trixie's compiler, which is GCC 14 [NEEDS VERIFICATION -- Debian trixie GCC version not confirmed in findings].
- Clang: Not tested for riscv64 by CI. The CI matrix uses `CC=clang` only for x86_64 and aarch64 variants. PR #933 was tested with clang on riscv64 by the contributor, but it is not part of the CI matrix.
- The `configure.ac` requires only C99 compatibility. No minimum GCC version is stated in the project.

**Known build failure:** Issue [#777](https://github.com/libffi/libffi/issues/777) (open since 2023-04-21): cross-compiling for `riscv64-unknown-linux-musl` with GCC 12.0.1 fails with `relocation truncated to fit: R_RISCV_HI20 against '.L4'` in `marshal_atom` in `ffi.o`. Root cause: likely `-mcmodel=medlow` or PIC mismatch in the cross-compilation flags. No fix has been committed. This affects embedded/RTOS targets (the reporter was targeting rt-thread smart). It does not affect standard Debian/Ubuntu glibc-based riscv64 builds.

**Configure flags relevant to riscv64:**

| Flag | Effect |
|------|--------|
| `--disable-exec-static-tramp` | Disables static trampolines; riscv64-linux has them enabled by default in v3.6.0 |
| `--disable-shared` | Static library only; used in CI cross builds |
| `--host=riscv64-linux-gnu` | Sets cross-compilation target |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

1. **Small integer return widening (issue [#466](https://github.com/libffi/libffi/issues/466), open since 2019):** When a function returns `int`, `char`, or any type narrower than 64 bits, libffi's documented contract requires widening to `ffi_arg` size. On riscv64, the upper 32 bits of the return buffer contain garbage (exact observed: `ffffffff0000002a` for return value 42). Commit aa3fce0 (2022-02-13) was supposed to fix this but the issue was never closed and no commenter confirmed resolution. This is a correctness violation of the libffi API contract. Downstream impact confirmed: Lua/lgi bindings fail on Debian riscv64.

2. **Large struct pass-by-reference semantics (issue [#694](https://github.com/libffi/libffi/issues/694), open since 2022):** The `struct_by_value_big` test case fails on riscv64 (and aarch64). Both architectures require the caller to copy large structs before passing by reference. PR #738 (merged 2022-10-10) added a caller-side copy for riscv64 and closed the test failures on ArchLinux riscv64 at -O0 and -O2. However, issue #694 remains open on GitHub, suggesting incomplete resolution or residual aarch64 + edge-case riscv64 failures. CPython's `ctypes` carries an independent workaround (`CTYPES_PASS_BY_REF_HACK` with `IS_PASS_BY_REF` macro), indicating the fix is not considered complete by downstream consumers.

3. **musl cross-compilation (issue [#777](https://github.com/libffi/libffi/issues/777), open since 2023):** Build fails with relocation error when using GCC 12 cross-toolchain targeting musl libc. No fix posted. Affects embedded and RTOS targets.

**Float semantics gap (resolved in v3.6.0 only):**

Prior to PR #972 (merged 2026-06-18, released in v3.6.0 on 2026-06-20), `float` arguments were double-widened instead of NaN-boxed per the RISC-V psABI. All Debian-packaged versions (sid: 3.5.2-4, trixie: 3.4.8-2) carry this bug. Any riscv64 application calling `float`-argument functions through libffi on a pre-v3.6.0 installation produces wrong results.

**Security hardening:** Static trampoline support (PR #933, merged 2025-08-07) enables libffi closures to function under W^X (write-xor-execute) security policies. This is present in v3.6.0. Prior versions on riscv64 required writable+executable pages simultaneously, which is blocked by default on hardened kernels and some container runtimes.

**Performance gaps:** Data not available: no published benchmarks comparing libffi call dispatch overhead on riscv64 vs arm64 or amd64. No GitHub issues, RISE blog posts, or academic sources contain riscv64-specific libffi benchmark numbers.

---

## 7. CI/CD Infrastructure

**CI configuration source:** `.github/workflows/build.yml`

**riscv64 CI job:** `build-qemu`

- Triggers: `push` to master and version tags, `pull_request` targeting master, `workflow_dispatch`
- Runner: `ubuntu-latest` (x86_64 host)
- Mechanism: QEMU binfmt via `docker/setup-qemu-action@v3`, then `docker build --platform linux/riscv64 -f .ci/Containerfile.debian`
- Base image: `debian:trixie`
- Test execution: full DejaGNU testsuite (`make check`) runs inside the riscv64 container; failures are evaluated by `rlgl` (red-light-green-light policy)
- `make check` uses `|| true` so CI jobs complete even with test failures; results are published to [libffi.github.io](https://libffi.github.io/libffi/reports/)

**RISE runners:** None. No RISE-provided native riscv64 hardware runners are used.

**Comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | Yes | Yes |
| Trigger | push/PR | push/PR | push/PR |
| Runner type | Native (ubuntu-latest) | QEMU | QEMU |
| Testsuite runs | Yes (full DejaGNU) | Yes | Yes |
| Native hardware CI | Yes | No | No |
| Clang variant in matrix | Yes | Yes | No |
| Test result enforcement | rlgl | rlgl | rlgl |

The absence of a Clang/riscv64 CI variant is a gap: PR #933 was contributor-tested with clang on riscv64 but that configuration is not maintained by CI. Float ABI bugs like PR #972 were discovered externally (Node.js testing), not by libffi CI, suggesting the CI testsuite may not exercise all float argument patterns.

---

## 8. Distribution and Release Status

**Upstream releases:** libffi publishes source tarballs and Windows/MSVC x86 prebuilt binaries only. No riscv64 binary is distributed via [GitHub releases](https://github.com/libffi/libffi/releases). The v3.6.0 release notes mention "Add RISC-V static trampoline support" as a feature but ship no riscv64 binary artifact.

**Distro packages:**

| Distro | Package | Version | riscv64 status | Notes |
|--------|---------|---------|----------------|-------|
| Ubuntu 24.04 (Noble) | `libffi8`, `libffi-dev` | 3.4.6-1build1 | Available | Both runtime and dev headers |
| Debian sid | `libffi8` | 3.5.2-4 | Built and installed (host: rv-osuosl-03) | Missing PR #972 float fix |
| Debian trixie | `libffi8` | 3.4.8-2 | Available | Missing PR #972 and PR #933 fixes |
| Arch Linux RISC-V | `libffi` | Unverified | Likely available | archriscv.felixc.at not parseable; no data |

**Critical note:** All Debian and Ubuntu packages predate v3.6.0 (released 2026-06-20). The float marshal bug fixed in PR #972 is present in every currently-distributed riscv64 binary package. Any application using `float`-argument FFI calls through the system libffi on riscv64 Debian/Ubuntu will get wrong results until distros update to 3.6.0.

**To get a correct riscv64 binary:** Build from the v3.6.0 source tarball, or wait for distro packages to update to 3.6.0. There is no upstream-provided binary.

---

## 9. Dependencies

libffi has no external runtime dependencies beyond the OS ABI layer. It bundles `dlmalloc` (updated to 2.8.6 in v3.6.0) for platforms without `mmap`. The build-time test harness requires DejaGnu/expect/tcl.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|--------------|--------------|-----------------|-----------------|
| glibc | `mmap`, `memfd_create`, `pthread_mutex_t` for trampoline and closure subsystems | Supported since glibc 2.27 (2018) | Passes in Debian/Ubuntu | Shipped in all major distros | None |
| Linux kernel | `memfd_create` + `mmap` for static trampoline mapping; fallback to RW+RX mmap pair | riscv64 support since Linux 4.15 | Exercised in QEMU CI via Debian trixie container | N/A (system dep) | None |
| GCC or Clang | Compiles `sysv.S` and `ffi.c` | Full riscv64 support in both | CI uses GCC for riscv64; Clang tested by contributors but not in CI matrix | N/A | Issue #777: GCC 12 cross to musl fails |
| libpthread | `pthread_mutex_t` in `tramp.c` | Provided by glibc on riscv64 | Covered by CI trampoline tests | N/A | None |
| dlmalloc (bundled) | Closure allocation on platforms without `mmap` | No riscv64-specific code; updated to 2.8.6 in v3.6.0 | PR #981 fixed `__builtin_clz/ctz` on all GNU compilers | Bundled | None |
| DejaGnu / expect / tcl | Test harness for `make check` | Available on riscv64 in Debian | Used in CI QEMU container | N/A (test only) | None |
| CPython (consumer, not dep) | Uses libffi via `ctypes` | See `reports/python.md` | CPython carries `CTYPES_PASS_BY_REF_HACK` workaround for issue #694 | N/A | Issue #694 (libffi upstream bug) |

libffi has no JIT backend, no SIMD intrinsic dependencies, no crypto dependencies, and no compression dependencies. The dependency graph terminates at glibc and the compiler. No second- or third-level recursive dependency analysis is warranted.

---

## 11. Known Bugs and Active Issues

**Open correctness bugs:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#466](https://github.com/libffi/libffi/issues/466) | RISC-V 64bit: "Small" integers are not turned into ffi_arg | Open since 2019-01-29 | High (API contract violation) | Commit aa3fce0 (Feb 2022) was supposed to fix; issue never closed; no confirmation of full resolution; causes lua-lgi test failures on Debian riscv64 |
| [#694](https://github.com/libffi/libffi/issues/694) | struct_by_value_big fails on aarch64 and riscv64 | Open since 2022-03-01 | Medium (struct ABI) | PR #738 partially fixed for riscv64; issue remains open; CPython carries workaround |
| [#777](https://github.com/libffi/libffi/issues/777) | Linking libffi.a on riscv64 with musl cross-toolchain fails | Open since 2023-04-21 | Medium (build failure on musl) | R_RISCV_HI20 relocation truncation with GCC 12 cross targeting musl; no fix, no assignee, zero activity for 2+ years |

**Recently resolved:**

| ID | Title | Merged | First Release | Notes |
|----|-------|--------|--------------|-------|
| [PR #972](https://github.com/libffi/libffi/pull/972) | riscv64: fix float marshal for ABI_FLEN >= 64 | 2026-06-18 | v3.6.0 (2026-06-20) | Floats were double-widened instead of NaN-boxed; affected Node.js, any float-argument FFI; kxxt also patched vendored copy in nodejs/node#63976 |
| [PR #933](https://github.com/libffi/libffi/pull/933) | riscv: Add static trampoline support | 2025-08-07 | v3.6.0 (2026-06-20) | Enables closures under W^X; tested on QEMU and native BananaPi riscv64 hardware |
| [PR #738](https://github.com/libffi/libffi/pull/738) | riscv: make copies of structs passed by reference | 2022-10-10 | v3.4.4 (2022-10-24) | Fixed struct_by_value_big on ArchLinux riscv64 |
| [PR #708](https://github.com/libffi/libffi/pull/708) | Upstream FreeBSD riscv patch | 2022-05-24 | v3.4.4 (2022-10-24) | `__clear_cache` calling abort() under Clang/compiler-rt on FreeBSD riscv |

Issue #466 is the most significant open bug. It has been open for 7 years. The partial fix (commit aa3fce0) did not result in closure of the issue, and the reporter's original symptom (garbage upper 32 bits in return buffer for `int` return values) has not been confirmed as fixed by any commenter. Any language binding that relies on libffi's API contract for small integer return values is at risk on riscv64.

---

## 12. Objections and Upstream Blockers

**No stated architecture-level objections:** The maintainer (Anthony Green) has merged every riscv64 patch submitted in the past three years without objection. The project's culture accepts architecture ports as long as they follow the existing code patterns.

**Organizational blockers:** None. The single-maintainer BDFL model means no committee approval is needed. Anthony Green has demonstrated willingness to merge riscv64 fixes within days of submission (PR #972: submitted and merged 2026-06-18; PR #933: submitted 2025-08-06, merged 2025-08-07).

**Technical blockers:**

1. Issue #466 has no assignee and has been open 7 years with zero recent activity. There is no sign the maintainer considers it urgent. A contributor must identify the root cause (whether aa3fce0 left edge cases or was backed out) and submit a fix.
2. Issue #777 (musl) requires a contributor who can reproduce the musl/GCC 12 cross-compilation environment. No maintainer response has been posted.
3. Issue #694 (struct semantics) is shared with aarch64, which may increase motivation for a fix, but it has also been open 4 years with no PR.

**Clang CI gap:** Clang is not tested for riscv64 in CI. A contributor wanting to add `CC=clang` to the riscv64 matrix entry would need to verify no clang-specific assembly issues exist (PR #932, the abandoned first attempt at static trampolines, was abandoned precisely because of a clang assembler issue with `%hi()` / `auipc`).

**Acceptance probability:** High for correctness fixes. The project has accepted all submitted riscv64 patches. The barrier is identifying and fixing the bugs, not upstream acceptance.

---

## 13. Investment Analysis

RISE has not funded any libffi work. All riscv64 investment to date came from individual contributors (Andreas Schwab, Peter Bergner/IBM, Levi Zim/kxxt). The three open bugs are discrete, well-defined correctness issues -- none require architectural redesign.

### 13.1 Functional Enablement

Three open correctness bugs affect riscv64 users:

- Issue #466: Small integer return widening. Requires reproducing the original failure, determining whether commit aa3fce0 fully resolves it or leaves edge cases, and either confirming the fix or submitting a patch. Estimated 1-2 weeks for investigation and fix.
- Issue #694: Struct-by-value semantics. The fix in PR #738 partially addressed riscv64; the remaining gap may be aarch64-only or may affect riscv64 edge cases (non-power-of-two struct sizes). Estimated 2-3 weeks to fully characterize and fix for both riscv64 and aarch64.
- Issue #777: musl cross-compilation relocation error. Requires a musl cross-compilation environment. Fix likely involves adding `-mcmodel=medany` or adjusting PIC flags in `configure.host` for musl targets. Estimated 1-2 weeks.

### 13.2 Performance Optimization

Data not available: no baseline benchmark exists for libffi call overhead on riscv64. Before sizing optimization work, a benchmark suite comparing dispatch overhead on riscv64 vs arm64 (native or QEMU) should be run. Expected optimization vectors: none identified from the research -- libffi's assembly is compact and the hot path is already hand-written. RVV is not applicable (libffi does not vectorize).

### 13.3 CI/CD Infrastructure

Current CI gap: riscv64 uses QEMU emulation only; no native hardware runner. A native runner would catch hardware-specific instruction behavior (e.g., the NaN-boxing bug in PR #972 was discovered via Node.js on real hardware, not CI). The RISE project operates a CI infrastructure; contributing a native riscv64 runner to libffi CI would benefit the entire ecosystem (CPython, Ruby, GHC, Node.js all depend on libffi). Estimated 1 week to configure and register a runner; ongoing infrastructure cost.

Clang CI gap: adding `CC=clang` to the riscv64 matrix entry in `.github/workflows/build.yml` and verifying zero regressions. Estimated 1 week.

### 13.4 Ecosystem Enablement

libffi is a C library with no dependent package ecosystem that needs independent enablement. The downstream impact is through consumers (CPython ctypes, Ruby fiddle, GHC FFI, Node.js). Fixing libffi bugs directly unblocks those consumers without separate ecosystem work.

The most immediate downstream impact: fixing issue #466 (integer widening) unblocks Lua/lgi on Debian riscv64. The float fix in PR #972 is already in v3.6.0 but distro packages have not yet updated -- no action needed beyond waiting for distro updates.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Fix issue #466: small integer return widening (riscv64) | 2 | libffi contributor | High |
| Functional | Fix issue #694: struct_by_value_big (riscv64 + aarch64) | 3 | libffi contributor | High |
| Functional | Fix issue #777: musl cross-compilation relocation error | 2 | libffi contributor | Medium |
| CI/CD | Add native riscv64 hardware runner to `build-qemu` CI job | 1 (+ infra) | RISE / Qualcomm infra | Medium |
| CI/CD | Add Clang variant for riscv64 to CI matrix | 1 | libffi contributor | Low |
| Performance | Baseline benchmark: riscv64 vs arm64 call dispatch overhead | 1 | libffi contributor | Low |

Total estimated new work: 10 person-weeks for functional fixes + CI. No work already covered by RISE needs to be excluded -- RISE has zero existing investment in libffi.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libffi GitHub repository](https://github.com/libffi/libffi)
- [libffi homepage (sourceware.org)](https://sourceware.org/libffi/)
- [Issue #466: RISC-V 64bit: "Small" integers are not turned into ffi_arg](https://github.com/libffi/libffi/issues/466)
- [Issue #694: struct_by_value_big fails on aarch64 and riscv64](https://github.com/libffi/libffi/issues/694)
- [Issue #777: Linking libffi.a on riscv64 machine failed](https://github.com/libffi/libffi/issues/777)
- [Issue #714: Tests fail on riscv64-linux (visionfive hardware)](https://github.com/libffi/libffi/issues/714)
- [Issue #931: risc-v: Add static trampoline support](https://github.com/libffi/libffi/issues/931)
- [PR #281: New RISC-V port](https://github.com/libffi/libffi/pull/281)
- [PR #708: Upstream FreeBSD riscv patch](https://github.com/libffi/libffi/pull/708)
- [PR #738: riscv: make copies of structs passed by reference](https://github.com/libffi/libffi/pull/738)
- [PR #933: riscv: Add static trampoline support](https://github.com/libffi/libffi/pull/933)
- [PR #972: riscv64: fix float marshal for ABI_FLEN >= 64](https://github.com/libffi/libffi/pull/972)
- [commit aa3fce0: riscv: extend return types smaller than ffi_arg](https://github.com/libffi/libffi/commit/aa3fce0)
- [commit 3840d49: New RISC-V port (original merge)](https://github.com/libffi/libffi/commit/3840d49a)
- [commit 4cb776b: RISC-V go closures](https://github.com/libffi/libffi/commit/4cb776b)
- [libffi risc-v label (all open/closed riscv issues)](https://github.com/libffi/libffi/labels/risc-v)
- [Debian buildd status for libffi (sid)](https://buildd.debian.org/status/package.php?p=libffi&suite=sid)
- [Ubuntu packages: libffi8 in Noble](https://packages.ubuntu.com/search?keywords=libffi&suite=noble)
- [RISE Project blog](https://riseproject.dev/blog)