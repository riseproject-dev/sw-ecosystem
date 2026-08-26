---
title: sanitizers
---

# sanitizers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for LLVM compiler-rt sanitizer runtimes<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

The name "sanitizers" refers to a family of compiler-assisted runtime checkers: AddressSanitizer (ASan), ThreadSanitizer (TSan), MemorySanitizer (MSan), HardwareAssistedAddressSanitizer (HWASan), LeakSanitizer (LSan), UndefinedBehaviorSanitizer (UBSan), DataFlowSanitizer (DFSan), XRay, libFuzzer, Scudo, and GWP-ASan.

The [google/sanitizers](https://github.com/google/sanitizers) repository is **archived**. Its own README states: "The core code for these sanitizers resides within the LLVM repository." The repo serves only as a bug tracker and wiki. All runtime source code lives in [llvm/llvm-project](https://github.com/llvm/llvm-project) under `compiler-rt/`. All analysis below references compiler-rt unless stated otherwise.

**Governance:** The LLVM Foundation, a 501(c)(3) nonprofit (Los Altos, CA, est. 2014), governs the LLVM project. New architecture ports follow LLVM's tiered support policy: an RFC to the dev mailing list, multi-member community consensus, and a stabilization period on buildbot before landing in a supported tier.

**LLVM Foundation Board (2024-2026):** Kristof Beyls (Arm), Chris Bieneman / Reid Kleckner (Microsoft / NVIDIA), Anshu Dasgupta (NVIDIA), Anton Korobeynikov (Saint Petersburg State University), Chris Lattner (Modular), Tanya Lattner (LLVM Foundation President), Wei Wu (PLCT Lab / HelloLLVM).

**LLVM Foundation Corporate Sponsors:** Diamond: AMD, Apple, Google, Qualcomm. Platinum: Arm, Fastly, Huawei, Meta, Nvidia. Gold: Access Softek, AWS, BayLibre, Fujitsu, MathWorks, Microsoft, Sony Interactive. Corporate Supporter: Tesla.

**google/sanitizers Primary Committers (archived repo):** vitalybuka (Vitaly Buka, Google), thurstond, ramosian-glider (Kostya Serebryany, Google), fmayer (Florian Mayer, Google - HWASan).

**Community culture on new ports:** The core maintainer team is primarily Google employees. They review and accept RISC-V contributions but have not driven the port themselves. The SV48 allocator bug (google/sanitizers [#1707](https://github.com/google/sanitizers/issues/1707)) has been open since November 2023 with no response from maintainers, indicating low active prioritization of the RISC-V port within the upstream sanitizer team. The community is not hostile to RISC-V contributions.

**RISE Project involvement:** No RISE blog posts (30 posts, May 2024-August 2026) mention sanitizers, ASan, MSan, TSan, UBSan, or compiler-rt sanitizers. No `sanitizers` entry appears in the RISE wheel builder. `gh search repos --owner riseproject-dev "sanitizers"` returned zero results. RISE is not funding or coordinating sanitizer riscv64 work as of this report.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2020-07-15 | google/sanitizers issue [#1283](https://github.com/google/sanitizers/issues/1283) opened: developer asks about porting ASan to RISC-V in LLVM after having done it in GCC. Zero replies. | github.com/google/sanitizers/issues/1283 |
| 2020-09-22 | LLVM Phabricator D87573 lands: `internal_clone` assembly for riscv64 in ASan. First substantive RISC-V ASan code upstream. | [LLVM D87573](https://reviews.llvm.org/D87573) |
| 2021-03-08 | luismarques fixes riscv64 `internal_clone` assembly (commit c5a6ad8). | [LLVM git c5a6ad8](https://github.com/llvm/llvm-project/commit/c5a6ad8) |
| 2023-09-19 | llvm/llvm-project PR [#66743](https://github.com/llvm/llvm-project/pull/66743) opened: ASan dynamic shadow offset + SV48/SV57 allocator support. | github.com/llvm/llvm-project/pull/66743 |
| 2023-09-28 | PiJoules (Google) tunes 64-bit ASan allocator arena for Fuchsia+RISC-V. | [NEEDS VERIFICATION] per research findings |
| 2023-10-12 | llvm/llvm-project PR [#68735](https://github.com/llvm/llvm-project/pull/68735) merged: TSan support for riscv64, SV39 and SV48 VMA layouts. | github.com/llvm/llvm-project/pull/68735 |
| 2023-10-23 | PiJoules (Google) adds LSan support for Fuchsia+RISC-V. | [NEEDS VERIFICATION] per research findings |
| 2023-11-17 | google/sanitizers issue [#1707](https://github.com/google/sanitizers/issues/1707) opened: ASan CHECK failure on riscv64 SV48 systems. | github.com/google/sanitizers/issues/1707 |
| 2024-07-18 | PR [#66743](https://github.com/llvm/llvm-project/pull/66743) merged: ASan now uses `ASAN_SHADOW_OFFSET_DYNAMIC` and 64-bit allocator path on Linux riscv64. | github.com/llvm/llvm-project/pull/66743 |
| 2024-07-25 | Post-merge: luismarques identifies `quarantine_size_mb` regression on sv39 from PR #66743. No follow-up PR found. | github.com/llvm/llvm-project/pull/66743 |
| 2024-08-14 | SiFive's Samuel Holland opens llvm/llvm-project PR [#103727](https://github.com/llvm/llvm-project/pull/103727) (HWASan sign-extension optimization) and PR [#103729](https://github.com/llvm/llvm-project/pull/103729) (HWASan allow disabling short granules for kernel use). | github.com/llvm/llvm-project/pull/103727, /103729 |
| 2024-12-10 | vitalybuka gives LGTM on PR #103727. Still not merged as of August 2026. | github.com/llvm/llvm-project/pull/103727 |
| 2026-04-16 | llvm/llvm-project PR [#191170](https://github.com/llvm/llvm-project/pull/191170) merged: TSan `kHiAppMemEnd` off-by-one boundary bug fix for riscv64 (ASLR-disabled systems). | github.com/llvm/llvm-project/pull/191170 |
| 2026-06-30 | llvm/llvm-project PR [#206674](https://github.com/llvm/llvm-project/pull/206674) opened: MSan support for riscv64 Linux (SV39 layout). Changes requested 2026-07-18. Not merged. | github.com/llvm/llvm-project/pull/206674 |
| 2026-08-16 | llvm/llvm-project issue [#216580](https://github.com/llvm/llvm-project/issues/216580) opened: LSan false leak regression on glibc riscv64, caused by PR #120036 misplacing riscv64 TLS size adjustment inside a `SANITIZER_FREEBSD` guard. | github.com/llvm/llvm-project/issues/216580 |

The ASan port originated with an unaffiliated contributor (GitHub user EccoTheDolphin). TSan was ported by alexfanqi / Alex Fan, landed by hiraditya. HWASan riscv64 assembly was contributed by SiFive (Samuel Holland). Subsequent fixes came from luismarques and cyyself. The Google sanitizer team (vitalybuka, eugenis) reviewed and accepted contributions but did not author the riscv64 work.

All riscv64 sanitizer work is fully upstream in llvm/llvm-project. There is no downstream fork or staging branch.

---

## 3. Upstream Support Tier

LLVM does not publish a formal sanitizer-specific tier document analogous to the LLVM target tier policy. Support is implied by inclusion in `compiler-rt/cmake/Modules/AllSupportedArchDefs.cmake` and by buildbot coverage.

**CI evidence:** The google/sanitizers repository has zero CI configuration files. The `.github/` directory contains only issue templates. All CI for sanitizer runtimes runs in the llvm/llvm-project CI infrastructure.

**Release-blocking status:** riscv64 sanitizer failures are not release-blocking in LLVM. The `quarantine_size_mb` regression from PR #66743 was noted post-merge with no remediation timeline. The LSan glibc false-leak regression (issue [#216580](https://github.com/llvm/llvm-project/issues/216580)) was filed in August 2026 and affects Fedora 45 riscv64 package builds.

**Comparison table:**

| Property | amd64 | arm64 | riscv64 |
|----------|-------|-------|---------|
| ASan | Yes, fast-path .S stubs | Yes | Yes, C fallback only (no fast-path .S) |
| TSan | Yes | Yes | Yes (Linux only) |
| LSan | Yes | Yes | Yes (Linux only; false-leak regression open) |
| HWASan | Yes | Yes | Yes (one of only 3 supported arches) |
| UBSan | Yes | Yes | Yes |
| MSan | Yes | Yes | No (PR #206674 in review) |
| DFSan | Yes | Yes | No |
| GWP-ASan | Yes | Yes | No |
| CFI | Yes | Yes | No |
| RTSan | Yes | Yes | No |
| XRay | Yes | Yes | Yes (Linux only) |
| Scudo | Yes | Yes | Yes |
| libFuzzer | Yes | Yes | Yes (Linux/Android/Fuchsia) |
| Release-blocking CI | Yes | Yes | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Sanitizers are runtime libraries. Their architecture-specific components are: shadow memory layout constants and probing code, syscall wrappers, setjmp/longjmp interceptors, stack unwinding hooks, assembly fast paths for check stubs, and VMA layout parameters.

**sanitizer_common infrastructure:**

| Component | File | riscv64 status | Notes |
|-----------|------|----------------|-------|
| Syscall wrappers | `sanitizer_syscall_linux_riscv64.inc` | Full | 155 lines; 0-7 arg ecall wrappers using named register variables (a0-a7); no TODO/FIXME |
| vfork interceptor | `sanitizer_common_interceptors_vfork_riscv64.inc.S` | Full | 56 lines native assembly; no TODO/FIXME |
| PC adjustment | `sanitizer_stacktrace.h` | Full | `GetPreviousInstructionPc()` returns pc-2; comment documents compressed-extension approximation as deliberate |
| Platform macros | `sanitizer_platform.h` | Full | `SANITIZER_RISCV64` defined; `SANITIZER_MMAP_RANGE_SIZE` set to `1ULL << 56` on Linux to cover SV57 |

**Per-sanitizer component breakdown:**

| Sanitizer | riscv64 arch files | Quality | Gaps |
|-----------|-------------------|---------|------|
| ASan | None dedicated (uses generic path + dynamic shadow probing) | Partial | No inline fast-path .S (x86_64 has `asan_rtl_x86_64.S` with hand-tuned `__asan_check_*` stubs); shadow probing works but is slower than fixed-offset |
| TSan | `tsan_rtl_riscv64.S` (204 lines) | Full on Linux | Full assembly setjmp/sigsetjmp/longjmp interceptors with CFI directives; no FreeBSD/macOS |
| HWASan | `hwasan_setjmp_riscv64.S` (93 lines), `hwasan_tag_mismatch_riscv64.S` (133 lines) | Full | Hand-tuned; one of only 3 supported arches (x86_64, arm64, riscv64); Zjpm spec mismatch open (issue [#150102](https://github.com/llvm/llvm-project/issues/150102)) |
| LSan | None needed | Full | Generic C++ path; all hooks present; false-leak regression open |
| UBSan | None needed | Full | Generic C++ path |
| XRay | `xray_riscv.cpp` (267 lines), `xray_trampoline_riscv64.S` (90 lines), `xray_trampoline_riscv32.S`, `xray_trampoline_riscv_common.S` | Full | Complete instruction-patcher and trampolines; uses F-extension `fsd`/`fld`; open FP-register guard issue [#214390](https://github.com/llvm/llvm-project/issues/214390) |
| Scudo | None needed | Full | Generic allocator; `SCUDO_RISCV64` defined in `platform.h` |
| libFuzzer | None needed | Full | Generic; Linux/Android/Fuchsia |
| MSan | None | Missing | Not in `ALL_MSAN_SUPPORTED_ARCH`; PR [#206674](https://github.com/llvm/llvm-project/pull/206674) in review |
| DFSan | None | Missing | Not in `ALL_DFSAN_SUPPORTED_ARCH` |
| GWP-ASan | None | Missing | Not in `ALL_GWP_ASAN_SUPPORTED_ARCH` |
| CFI | None | Missing | Not in `ALL_CFI_SUPPORTED_ARCH` |
| RTSan | None | Missing | Not in `ALL_RTSAN_SUPPORTED_ARCH` |

**RVV (RISC-V Vector) instrumentation:** ASan cannot instrument RVV memory intrinsics. Issues [#100930](https://github.com/llvm/llvm-project/issues/100930), [#100931](https://github.com/llvm/llvm-project/issues/100931), and [#135198](https://github.com/llvm/llvm-project/issues/135198) document that indexed and segment vector load/store instructions are not instrumented by ASan. The fix requires a TTI hook enhancement; changes have been requested on PR [#135198](https://github.com/llvm/llvm-project/issues/135198) and it is not merged as of August 2026.

**ISA extension usage:** XRay trampolines use `fsd`/`fld` (F extension). HWASan tag-mismatch handler uses standard RV64GC. TSan assembly uses standard RV64GC. No RVV is used internally by any sanitizer runtime.

**Comparison table (per component, amd64 vs arm64 vs riscv64):**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| ASan fast-path stubs | Hand-tuned .S | Hand-tuned .S | C fallback (no .S) |
| ASan shadow offset | Fixed constant | Fixed constant | Dynamic runtime probe |
| ASan SV48/SV57 support | N/A | N/A | Supported (post PR #66743) |
| TSan VMA layouts | 1 | 2 | 2 (SV39 + SV48) |
| HWASan | Full | Full | Full (3-arch club) |
| MSan | Full | Full | Missing |
| Vector instrumentation | Full (AVX2) | Full (SVE) | Missing (RVV) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Source of build documentation:** `llvm/docs/HowToCrossCompileLLVM.md` and `clang/cmake/caches/BaremetalRISCV.cmake` in llvm/llvm-project. The google/sanitizers repo has zero build system files.

**Cross-compilation for riscv64 Linux (Ubuntu/Debian host):**

Step 1 - create a Debian riscv64 sysroot. The documentation specifies `unstable`, not `stable`, because riscv64 was only in Debian `unstable` when the guide was written:

```bash
sudo debootstrap --arch=riscv64 --variant=minbase \
  --include=build-essential,symlinks \
  unstable sysroot-deb-riscv64-unstable

sudo chroot sysroot-deb-riscv64-unstable symlinks -cr .
```

Step 2 - create a CMake toolchain file targeting `riscv64-linux-gnu`:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSROOT "/path/to/sysroot-deb-riscv64-unstable")
set(CMAKE_C_COMPILER_TARGET riscv64-linux-gnu)
set(CMAKE_CXX_COMPILER_TARGET riscv64-linux-gnu)
set(CMAKE_C_FLAGS_INIT "-march=rva20u64")
set(CMAKE_CXX_FLAGS_INIT "-march=rva20u64")
set(CMAKE_LINKER_TYPE LLD)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
```

Step 3 - configure and build compiler-rt only:

```bash
cmake -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLVM_ENABLE_PROJECTS="lld;clang" \
  -DLLVM_ENABLE_RUNTIMES="compiler-rt" \
  -DCMAKE_TOOLCHAIN_FILE=$(pwd)/riscv64-linux-gnu-clang.cmake \
  -DLLVM_HOST_TRIPLE=riscv64-linux-gnu \
  -S llvm -B build/riscv64-linux-gnu
cmake --build build/riscv64-linux-gnu
```

**Disabling unsupported sanitizers** to avoid build failures on riscv64:

```
-DCOMPILER_RT_BUILD_MEMPROF=OFF
-DCOMPILER_RT_BUILD_MSAN=OFF
-DCOMPILER_RT_BUILD_DFSAN=OFF
-DCOMPILER_RT_BUILD_CFI=OFF
-DCOMPILER_RT_BUILD_GWP_ASAN=OFF
-DCOMPILER_RT_BUILD_SAFESTACK=OFF
```

These flags correspond to components absent from `AllSupportedArchDefs.cmake` for riscv64.

**Baremetal riscv64 (no OS):**

```bash
cmake -G Ninja \
  -DCMAKE_BUILD_TYPE=Debug \
  -DLLVM_ENABLE_PROJECTS=clang \
  -DLLVM_ENABLE_RUNTIMES=compiler-rt \
  -C ../clang/cmake/caches/BaremetalRISCV.cmake \
  ../llvm
ninja runtimes-riscv64-unknown-elf runtimes-riscv32-unknown-elf
```

The cache sets `COMPILER_RT_BAREMETAL_BUILD=ON` and `CMAKE_SYSTEM_NAME=Generic`. The documentation notes: "Tested on Linux host; does not work on macOS host."

**Cross-compilation detection:** `compiler-rt/cmake/config-ix.cmake` treats riscv64 identically to arm/aarch64 - always as a cross-compilation target. Tests use `COMPILER_RT_TEST_COMPILER` and `COMPILER_RT_TEST_COMPILER_CFLAGS`. No extra cflags are injected for riscv64 (unlike aarch32 which gets `-march=armv8-a`).

**QEMU usage for testing:**

```bash
# Option 1: explicit invocation
qemu-riscv64-static -L /path/to/sysroot ./test-binary

# Option 2: binfmt_misc (requires qemu-user-static + binfmt-support)
export QEMU_LD_PREFIX=/path/to/sysroot
./test-binary
```

The `binfmt_misc` approach is also required for the `debootstrap` sysroot build on an x86_64 host. No official Docker images or CI scripts with riscv64 QEMU configuration exist in either google/sanitizers or llvm/llvm-project.

**Toolchain version requirements:** No explicit minimum Clang or GCC version is specified in the CMake files. The riscv64 assembly files require standard RV64GC (base integer + float). The XRay trampoline requires the F extension (`fsd`/`fld`). No minimum version gate is present in CMake. One version-adjacent constraint: the Debian sysroot requires `unstable` rather than `stable`, implying newer library versions than Debian stable provides.

**Known build issue:** The `quarantine_size_mb` ASan test regressed on sv39 after PR [#66743](https://github.com/llvm/llvm-project/pull/66743) was merged in July 2024. No follow-up fix has been committed as of August 2026.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps - sanitizers entirely absent on riscv64:**

| Sanitizer | amd64 | arm64 | riscv64 | Impact |
|-----------|-------|-------|---------|--------|
| MSan | Yes | Yes | No | Cannot detect uninitialized memory reads; required by oss-fuzz MSan builds |
| DFSan | Yes | Yes | No | Cannot do data-flow / taint tracking |
| GWP-ASan | Yes | Yes | No | Cannot do sampling-based heap safety in production |
| CFI | Yes | Yes | No | Cannot enforce control-flow integrity at runtime |
| RTSan | Yes | Yes | No | Cannot enforce realtime-safety constraints |
| TySan | Yes | Yes | No | Cannot detect type-confusion violations |
| NSan | Yes | No | No | Numerical sanitizer; x86_64 only |
| MemProf | Yes | No | No | Memory profiler; x86_64 only |

**Functional gaps - sanitizers present but with correctness issues on riscv64:**

| Sanitizer | Issue | Severity |
|-----------|-------|---------|
| ASan | No fast-path inline check stubs (.S) | Performance only |
| ASan | SV48 startup crash (google/sanitizers [#1707](https://github.com/google/sanitizers/issues/1707)) | Correctness: crashes on SV48 kernels |
| ASan | RVV indexed/segment load/store not instrumented ([#100930](https://github.com/llvm/llvm-project/issues/100930), [#100931](https://github.com/llvm/llvm-project/issues/100931), [#135198](https://github.com/llvm/llvm-project/issues/135198)) | Correctness: memory errors in RVV code silently missed |
| ASan + libFuzzer | Combination marked UNSUPPORTED in test suite ([#156912](https://github.com/llvm/llvm-project/issues/156912)) | Functional gap |
| LSan | False leaks on glibc riscv64 (GetTls() regression, [#216580](https://github.com/llvm/llvm-project/issues/216580)) | Correctness: false positives break CI on Fedora 45 riscv64 |
| HWASan | Tags do not match ratified Zjpm pointer-masking spec ([#150102](https://github.com/llvm/llvm-project/issues/150102)) | Correctness: behavior non-conformant to ratified ISA spec |
| HWASan | Tagged globals use GOT in non-PIC mode ([#142412](https://github.com/llvm/llvm-project/issues/142412)) | Correctness regression |
| HWASan | Cannot disable short granules (kernel HWASan use case) ([#103729](https://github.com/llvm/llvm-project/pull/103729)) | Functional gap: kernel HWASan blocked |
| TSan | jmp_buf pointer mangling broken with glibc 2.44 ([#216558](https://github.com/llvm/llvm-project/issues/216558)) | Correctness |
| TSan | Original support request still OPEN ([#68372](https://github.com/llvm/llvm-project/issues/68372)) | Tracking artifact |
| XRay | FP register save not guarded behind float ABI ([#214390](https://github.com/llvm/llvm-project/issues/214390)) | Correctness in softfloat configurations |

**Performance gaps:**

No published benchmark data with riscv64-specific sanitizer overhead numbers exists. No RISE blog posts, academic papers, or vendor reports contain riscv64 sanitizer performance measurements. The standard ASan overhead baseline (2x runtime slowdown, 1.5-3.4x memory) is documented for x86/ARM but has not been replicated in riscv64-specific publications.

Data not available: riscv64 vs arm64 vs amd64 sanitizer overhead comparison.

The absence of an ASan inline fast-path .S file on riscv64 (present on both x86_64 and arm64) means all ASan memory checks go through the C++ slow path. The magnitude of this overhead difference has not been measured and published.

**Security hardening gaps:**

CFI (control-flow integrity) is absent on riscv64. This is a meaningful gap for security-focused use cases. No open issue or work-in-progress has been identified for riscv64 CFI support.

**Floating-point / NaN semantics:** No riscv64-specific UBSan issues relating to floating-point semantics were found in the research data.

---

## 7. CI/CD Infrastructure

**google/sanitizers:** The repository has zero CI configuration files of any kind. The `.github/` directory contains only `.github/ISSUE_TEMPLATE/bug_report.md`. No GitHub Actions workflows, no GitLab CI, no Jenkinsfile, no Cirrus CI. A complete recursive tree scan of the 125-file repository confirmed zero CI infrastructure.

**llvm/llvm-project CI for riscv64 sanitizers:** No riscv64-specific sanitizer CI configuration was found in the research data. The llvm/llvm-project CI infrastructure was not directly inventoried; the absence of riscv64 sanitizer CI is inferred from the fact that correctness regressions (LSan false leaks, TSan jmp_buf breakage, `quarantine_size_mb` ASan regression) have remained open for extended periods without automated detection.

Data not available: Whether llvm/llvm-project runs any riscv64 sanitizer tests in its pre-merge CI (e.g., via QEMU or hardware runners). The research did not retrieve the llvm/llvm-project CI YAML files.

**RISE runners:** No evidence found that RISE provides riscv64 runners for sanitizer testing.

**Comparison table:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Pre-merge sanitizer tests | Yes | Yes | Unknown (not confirmed) |
| Release-blocking test failures | Yes | Yes | No |
| Dedicated hardware runners | Yes | Yes | Unknown |
| QEMU-based tests | N/A | Partial | Unknown |
| Buildbot coverage | Yes | Yes | Unknown |

---

## 8. Distribution and Release Status

The google/sanitizers repository is archived and has no releases. The sanitizer runtimes are distributed as part of LLVM/Clang packages and GCC runtime packages.

**Ubuntu 24.04 LTS (Noble) - riscv64:**

| Package | riscv64 present? | Notes |
|---------|-----------------|-------|
| `libasan8` | Yes | `libasan8_14-20240412-0ubuntu1_riscv64.deb` confirmed |
| `libasan6` | Yes | Confirmed in noble riscv64 archive |
| `libtsan2` | Yes | Confirmed in noble riscv64 archive |
| `libubsan1` | Yes | Confirmed in noble riscv64 archive |
| `libmsan` | No | MSan not available on any architecture via GCC |

**Critical caveat on libasan8:** The package exists but is known to crash at startup on any system where the kernel uses SV48 virtual address space (google/sanitizers [#1707](https://github.com/google/sanitizers/issues/1707)). The fix for this was merged in LLVM PR [#66743](https://github.com/llvm/llvm-project/pull/66743) in July 2024, but the Ubuntu 24.04 package was built with an earlier LLVM version. Users on systems with SV48-default kernels require either (a) a post-July-2024 LLVM build, (b) forcing SV39 in QEMU, or (c) a kernel with SV39 mmap default. [NEEDS VERIFICATION: whether Ubuntu 24.04's libasan8 incorporates the PR #66743 fix.]

**PyPI:** No package named `sanitizers` exists. HTTP 404.

**Debian tracker:** No package named `sanitizers` exists. HTTP 404. The buildd database shows no entry for any architecture.

**Arch Linux RISC-V tracker:** No `sanitizers` package listed.

**Fedora 45 riscv64:** LSan false-leak regression (issue [#216580](https://github.com/llvm/llvm-project/issues/216580)) is actively breaking Fedora 45 riscv64 package builds (libcupsfilters 2.2.1 cited in the bug report).

**What a user must do to get a working riscv64 sanitizer binary:**

1. Build LLVM from source (post-July-2024 commit, i.e., LLVM 19 or later) using the cross-compilation procedure in Section 5.
2. Disable MSan, DFSan, CFI, GWP-ASan, SafeStack, RTSan in the CMake configuration.
3. Test on an SV39 kernel or verify the target kernel version is new enough to include the dynamic shadow offset fix.
4. For LSan: apply the proposed fix from issue [#216580](https://github.com/llvm/llvm-project/issues/216580) if using glibc 2.44 or newer.

---

## 9. Dependencies

**Summary table:**

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------|------|--------------|--------------|-----------------|-----------------|
| LLVM/compiler-rt | Sanitizer runtime implementation | Yes | Partial | Yes (LLVM 19+) | See Section 6 |
| libunwind (LLVM) | Stack unwinding for all sanitizers | Yes | Functional | Yes | [#67860](https://github.com/llvm/llvm-project/issues/67860) minor |
| glibc | TLS layout for LSan GetTls(); stack/heap boundaries | Yes | Broken (LSan, glibc 2.44) | Yes but regressed | [#216580](https://github.com/llvm/llvm-project/issues/216580) |
| libffi | FFI interceptors for atheris Python fuzzer | Partial | Broken (3 open ABI bugs) | Yes with gaps | [libffi #777](https://github.com/libffi/libffi/issues/777), [#694](https://github.com/libffi/libffi/issues/694), [#466](https://github.com/libffi/libffi/issues/466) |

**libunwind (LLVM):** `_LIBUNWIND_TARGET_RISCV` is defined. Full register set in `Registers.hpp` (120 RISC-V entries) with unwind restore assembly. Functional. Issue [#67860](https://github.com/llvm/llvm-project/issues/67860) covers an MSan+libunwind test interaction but is minor.

**glibc:** The LSan regression introduced by LLVM PR #120036 is a glibc-specific issue. The refactoring moved riscv64 TLS size adjustments (`TlsPreTcbSize()`) inside a `SANITIZER_FREEBSD` preprocessor guard, where they no longer execute on Linux. The bug affects LLVM (current main), GCC 15.2, and GCC 16. GCC 15.1 is unaffected. A simple preprocessor guard fix is proposed in issue [#216580](https://github.com/llvm/llvm-project/issues/216580) but not yet merged.

**libffi:** Used by the atheris Python fuzzing harness and some sanitizer interceptor harnesses. Three open riscv64 bugs: struct-by-value large argument passing ([#694](https://github.com/libffi/libffi/issues/694)), small integer return value truncation ([#466](https://github.com/libffi/libffi/issues/466)), and link failure ([#777](https://github.com/libffi/libffi/issues/777)). See `reports/libffi.md` for full detail.

**Related projects in scope.yml:**

- `reports/glibc.md` - LSan TLS regression is glibc-specific
- `reports/libffi.md` - atheris/interceptor harness dependency
- `reports/gwpsan.md` - Google's GWP-ASan successor; riscv64 not yet in its supported arch list
- `reports/honggfuzz.md` - fuzzing engine; uses sanitizer runtimes
- `reports/fuzztest.md` - structured fuzzing; depends on ASan/UBSan
- `reports/atheris.md` - Python fuzzer; depends on libffi and ASan
- `reports/clusterfuzz.md` - fuzzing infrastructure; orchestrates sanitizer builds
- `reports/oss-fuzz.md` - continuous fuzzing; ASan/MSan/UBSan required for harnesses
- `reports/lldb.md` - debugger; uses libunwind, shares compiler-rt
- `reports/valgrind.md` - independent memory checker; parallel tool, not a dependency

---

## 11. Known Bugs and Active Issues

**Correctness bugs:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| google/sanitizers [#1707](https://github.com/google/sanitizers/issues/1707) | CHECK failed: sanitizer_allocator_primary32.h:292 on riscv64 SV48 | OPEN | Critical | ASan crashes at startup on SV48 VA kernels; workaround: QEMU SV39 or newer LLVM (post PR #66743); tracking issue was not closed after fix landed |
| llvm/llvm-project [#216580](https://github.com/llvm/llvm-project/issues/216580) | LSan false leaks on glibc riscv64 since PR #120036 | OPEN | High | GetTls() TlsPreTcbSize() call moved inside SANITIZER_FREEBSD guard; affects LLVM main, GCC 15.2, GCC 16; Fedora 45 riscv64 builds broken |
| llvm/llvm-project [#216558](https://github.com/llvm/llvm-project/issues/216558) | TSan jmp_buf pointer mangling broken with glibc 2.44 on riscv64 | OPEN | High | glibc 2.44 changed jmp_buf pointer mangling; TSan intercept broken |
| llvm/llvm-project [#150102](https://github.com/llvm/llvm-project/issues/150102) | HWASan Zjpm spec mismatch on riscv64 | OPEN | High | HWASan tags do not match ratified RISC-V Zjpm pointer-masking extension |
| llvm/llvm-project [#142412](https://github.com/llvm/llvm-project/issues/142412) | HWASan tagged globals use GOT in non-PIC mode on riscv64 | OPEN | High | Code-generation regression |
| llvm/llvm-project [#164803](https://github.com/llvm/llvm-project/issues/164803) | ASan global variable CHECK failure with RVV builtins on qemu-riscv64 | OPEN | High | CHECK(AddrIsInMem(g->beg)) fails; globals shadow mapping conflict with RVV code |
| llvm/llvm-project [#100930](https://github.com/llvm/llvm-project/issues/100930) | ASan does not instrument RVV indexed loads | OPEN | High | Memory errors in RVV indexed load code are silently missed |
| llvm/llvm-project [#100931](https://github.com/llvm/llvm-project/issues/100931) | ASan does not instrument RVV segment loads | OPEN | High | Memory errors in RVV segment load code are silently missed |
| llvm/llvm-project [#156912](https://github.com/llvm/llvm-project/issues/156912) | libFuzzer + ASan combination UNSUPPORTED on RISC-V | OPEN | Medium | Fuzzer+ASan test combination explicitly disabled |
| llvm/llvm-project [#214390](https://github.com/llvm/llvm-project/issues/214390) | XRay trampoline FP register save not guarded behind float ABI on riscv64 | OPEN | Medium | Affects softfloat configurations |

**In-review / post-merge issues:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| llvm/llvm-project PR [#206674](https://github.com/llvm/llvm-project/pull/206674) | Add MSan support for riscv64 Linux | OPEN, changes requested 2026-07-18 | SV39 layout; reviewer notes instrumentation and compiler-rt aliasing regression in latest revision |
| llvm/llvm-project PR [#103727](https://github.com/llvm/llvm-project/pull/103727) | HWASan sign extension optimization for riscv64 | OPEN, LGTM Dec 2024, not merged | SiFive (Samuel Holland); stalled awaiting merge action |
| llvm/llvm-project PR [#103729](https://github.com/llvm/llvm-project/pull/103729) | HWASan allow disabling short granules (needed for kernel HWASan) | OPEN, rebased Oct 2024, awaiting re-review | SiFive (Samuel Holland); no reviewer activity since Oct 2024 |
| llvm/llvm-project PR [#135198](https://github.com/llvm/llvm-project/issues/135198) | ASan instrumentation for RVV intrinsics | OPEN, changes requested | TTI hook enhancement required |
| llvm/llvm-project PR [#66743](https://github.com/llvm/llvm-project/pull/66743) post-merge | `quarantine_size_mb` ASan regression on sv39 | Unresolved | Noted by luismarques 2024-07-25; no follow-up PR found |
| google/sanitizers [#1283](https://github.com/google/sanitizers/issues/1283) | Porting to RISCV | OPEN, stale since 2020-07-15 | Zero replies in 6 years; actual work happened in LLVM without engagement here |

---

## 12. Objections and Upstream Blockers

**Organizational:** The core sanitizer maintainer team (primarily Google employees: vitalybuka, thurstond, eugenis, fmayer) has not driven the RISC-V port and has not responded to google/sanitizers issue [#1707](https://github.com/google/sanitizers/issues/1707) since it was filed in November 2023. Two SiFive PRs ([#103727](https://github.com/llvm/llvm-project/pull/103727), [#103729](https://github.com/llvm/llvm-project/pull/103729)) have been stalled with no maintainer merge action despite having LGTM from vitalybuka since December 2024. The pattern is: contributions are accepted in review, then stall before merge.

**Technical blockers:**

1. MSan riscv64 (PR [#206674](https://github.com/llvm/llvm-project/pull/206674)): The reviewer (thurstond) identified aliasing and instrumentation regressions in the latest revision. The PR author (Meng Zhuo) must address these before merge. This is a review iteration blocker, not a fundamental architectural objection.

2. HWASan Zjpm spec mismatch (issue [#150102](https://github.com/llvm/llvm-project/issues/150102)): The ratified RISC-V Zjpm pointer-masking extension defines how pointer tags interact with hardware. The current HWASan implementation is non-conformant. Fixing this requires coordinating with the RISC-V ISA community and potentially the LLVM RISC-V backend team. No work is in progress.

3. RVV ASan instrumentation (issues [#100930](https://github.com/llvm/llvm-project/issues/100930), [#100931](https://github.com/llvm/llvm-project/issues/100931), [#135198](https://github.com/llvm/llvm-project/issues/135198)): Requires enhancing LLVM's Target Transform Info (TTI) to expose RVV indexed/segment load/store memory access information to the sanitizer instrumentation pass. This is a non-trivial LLVM IR pass change. Changes have been requested on the open PR but no active maintainer is driving it.

4. LSan glibc regression (issue [#216580](https://github.com/llvm/llvm-project/issues/216580)): The proposed fix is a one-line preprocessor guard change. No technical objection has been raised. The blocker is review bandwidth.

**Acceptance probability:** The LLVM community has accepted all RISC-V sanitizer contributions that have been technically sound and reviewed. The blockers are: (a) stalled PRs awaiting maintainer merge action, (b) open correctness issues with no active author, and (c) missing sanitizers (MSan, DFSan, CFI) with no author. There is no stated opposition to riscv64 sanitizer support.

---

## 13. Investment Analysis

RISE has not funded or coordinated any sanitizer riscv64 work as of August 2026. No coverage exists to avoid duplicating.

### 13.1 Functional Enablement

**MSan:** PR [#206674](https://github.com/llvm/llvm-project/pull/206674) exists but has open review issues (aliasing and instrumentation regressions). Needs: fix review issues, rebase, get merge. Significant effort is already done; the remaining work is fix-and-iterate.

**LSan false-leak regression:** Simple preprocessor guard fix proposed in issue [#216580](https://github.com/llvm/llvm-project/issues/216580). Trivial to fix; review and merge is the bottleneck.

**HWASan short granule disable (kernel use):** PR [#103729](https://github.com/llvm/llvm-project/pull/103729) needs re-review after October 2024 rebase. Implementation done; review is the bottleneck.

**HWASan sign-extension optimization:** PR [#103727](https://github.com/llvm/llvm-project/pull/103727) has LGTM from vitalybuka but has not been merged. Author (SiFive) needs to rebase or request merge.

**HWASan Zjpm spec compliance:** Requires new engineering work. Current implementation is non-conformant to the ratified Zjpm extension. No existing PR.

**RVV ASan instrumentation:** Requires TTI enhancement in LLVM IR. Significant new engineering. Three open issues with no active author.

**DFSan/CFI/GWP-ASan:** No work in progress for any of these on riscv64.

### 13.2 Performance Optimization

**ASan fast-path stubs:** x86_64 has `asan_rtl_x86_64.S` with hand-tuned `__asan_check_*` stubs. riscv64 uses the C++ slow path. Writing riscv64 fast-path stubs would reduce ASan overhead but the magnitude is unknown (no benchmark data available).

### 13.3 CI/CD Infrastructure

No riscv64 sanitizer CI exists in google/sanitizers (the repo has no CI at all). CI in llvm/llvm-project for riscv64 sanitizers is unconfirmed. Establishing QEMU-based pre-merge riscv64 sanitizer testing in llvm/llvm-project would prevent recurrence of the `quarantine_size_mb` regression and the glibc LSan regression.

### 13.4 Ecosystem Enablement

Section 10 is omitted per the formatting rules: sanitizers are a system-level runtime with no dependent package ecosystem that must be separately enabled on riscv64.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix LSan false-leak regression ([#216580](https://github.com/llvm/llvm-project/issues/216580)): one-line preprocessor guard fix, get review/merge | 1 | LLVM compiler-rt | Critical |
| Functional | Unblock MSan PR [#206674](https://github.com/llvm/llvm-project/pull/206674): fix aliasing/instrumentation regressions, rebase, drive to merge | 4 | LLVM compiler-rt | High |
| Functional | Drive HWASan PR [#103729](https://github.com/llvm/llvm-project/pull/103729) to merge (short granule disable for kernel HWASan) | 1 | LLVM compiler-rt | High |
| Functional | Drive HWASan PR [#103727](https://github.com/llvm/llvm-project/pull/103727) to merge (sign-extension optimization, has LGTM) | 1 | LLVM compiler-rt | Medium |
| Functional | Fix TSan jmp_buf breakage with glibc 2.44 ([#216558](https://github.com/llvm/llvm-project/issues/216558)) | 2 | LLVM compiler-rt | High |
| Functional | Fix HWASan Zjpm spec mismatch ([#150102](https://github.com/llvm/llvm-project/issues/150102)) | 6 | LLVM compiler-rt + RISC-V ISA community | High |
| Functional | Implement RVV ASan instrumentation ([#100930](https://github.com/llvm/llvm-project/issues/100930), [#100931](https://github.com/llvm/llvm-project/issues/100931), [#135198](https://github.com/llvm/llvm-project/issues/135198)) | 8 | LLVM compiler-rt + RISC-V backend | High |
| Functional | Fix HWASan tagged globals GOT regression in non-PIC mode ([#142412](https://github.com/llvm/llvm-project/issues/142412)) | 2 | LLVM compiler-rt | Medium |
| Functional | Fix ASan+libFuzzer unsupported combination on riscv64 ([#156912](https://github.com/llvm/llvm-project/issues/156912)) | 3 | LLVM compiler-rt | Medium |
| Functional | Implement DFSan for riscv64 | 8 | LLVM compiler-rt | Low |
| Functional | Implement CFI for riscv64 | 12 | LLVM compiler-rt + RISC-V backend | Low |
| Functional | Implement GWP-ASan for riscv64 | 6 | LLVM compiler-rt | Low |
| Performance | Write ASan riscv64 fast-path check stubs (.S) to replace C++ slow path | 4 | LLVM compiler-rt | Medium |
| CI | Establish QEMU-based riscv64 sanitizer pre-merge CI in llvm/llvm-project | 6 | LLVM infrastructure | High |

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/sanitizers repository (archived)](https://github.com/google/sanitizers)
- [google/sanitizers issue #1283 - Porting to RISCV](https://github.com/google/sanitizers/issues/1283)
- [google/sanitizers issue #1707 - CHECK failed on riscv64 SV48](https://github.com/google/sanitizers/issues/1707)
- [llvm/llvm-project PR #66743 - ASan dynamic shadow for SV39/SV48/SV57](https://github.com/llvm/llvm-project/pull/66743)
- [llvm/llvm-project PR #68735 - TSan riscv64 SV39+SV48](https://github.com/llvm/llvm-project/pull/68735)
- [llvm/llvm-project PR #103727 - HWASan sign extension optimization for riscv64](https://github.com/llvm/llvm-project/pull/103727)
- [llvm/llvm-project PR #103729 - HWASan allow disabling short granules on riscv64](https://github.com/llvm/llvm-project/pull/103729)
- [llvm/llvm-project PR #135198 - ASan RVV intrinsic instrumentation](https://github.com/llvm/llvm-project/issues/135198)
- [llvm/llvm-project PR #191170 - TSan kHiAppMemEnd boundary fix for riscv64](https://github.com/llvm/llvm-project/pull/191170)
- [llvm/llvm-project PR #206674 - MSan support for riscv64 Linux](https://github.com/llvm/llvm-project/pull/206674)
- [llvm/llvm-project issue #100930 - ASan RVV indexed load not instrumented](https://github.com/llvm/llvm-project/issues/100930)
- [llvm/llvm-project issue #100931 - ASan RVV segment load not instrumented](https://github.com/llvm/llvm-project/issues/100931)
- [llvm/llvm-project issue #142412 - HWASan tagged globals GOT in non-PIC](https://github.com/llvm/llvm-project/issues/142412)
- [llvm/llvm-project issue #150102 - HWASan Zjpm spec mismatch on riscv64](https://github.com/llvm/llvm-project/issues/150102)
- [llvm/llvm-project issue #156912 - libFuzzer+ASan UNSUPPORTED on riscv64](https://github.com/llvm/llvm-project/issues/156912)
- [llvm/llvm-project issue #164803 - ASan global CHECK failure with RVV builtins](https://github.com/llvm/llvm-project/issues/164803)
- [llvm/llvm-project issue #214390 - XRay FP register save not guarded on riscv64](https://github.com/llvm/llvm-project/issues/214390)
- [llvm/llvm-project issue #216558 - TSan jmp_buf breakage with glibc 2.44 on riscv64](https://github.com/llvm/llvm-project/issues/216558)
- [llvm/llvm-project issue #216580 - LSan false leaks on glibc riscv64](https://github.com/llvm/llvm-project/issues/216580)
- [llvm/llvm-project issue #67860 - MSan+libunwind test interaction](https://github.com/llvm/llvm-project/issues/67860)
- [llvm/llvm-project issue #68372 - TSan original riscv64 support request](https://github.com/llvm/llvm-project/issues/68372)
- [compiler-rt/cmake/Modules/AllSupportedArchDefs.cmake - canonical per-sanitizer arch support](https://github.com/llvm/llvm-project/blob/main/compiler-rt/cmake/Modules/AllSupportedArchDefs.cmake)
- [compiler-rt/lib/tsan/rtl/tsan_platform.h - TSan VMA layouts for riscv64](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/tsan/rtl/tsan_platform.h)
- [compiler-rt/lib/asan/asan_mapping.h - ASan shadow offset constants](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/asan/asan_mapping.h)
- [compiler-rt/lib/hwasan/hwasan_setjmp_riscv64.S](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/hwasan/hwasan_setjmp_riscv64.S)
- [compiler-rt/lib/hwasan/hwasan_tag_mismatch_riscv64.S](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/hwasan/hwasan_tag_mismatch_riscv64.S)
- [compiler-rt/lib/tsan/rtl/tsan_rtl_riscv64.S](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/tsan/rtl/tsan_rtl_riscv64.S)
- [compiler-rt/lib/xray/xray_trampoline_riscv64.S](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/xray/xray_trampoline_riscv64.S)
- [compiler-rt/lib/sanitizer_common/sanitizer_syscall_linux_riscv64.inc](https://github.com/llvm/llvm-project/blob/main/compiler-rt/lib/sanitizer_common/sanitizer_syscall_linux_riscv64.inc)
- [clang/cmake/caches/BaremetalRISCV.cmake - baremetal build cache](https://github.com/llvm/llvm-project/blob/main/clang/cmake/caches/BaremetalRISCV.cmake)
- [llvm/docs/HowToCrossCompileLLVM.md - cross-compilation guide](https://github.com/llvm/llvm-project/blob/main/llvm/docs/HowToCrossCompileLLVM.md)
- [Ubuntu packages noble - libasan8 riscv64](https://packages.ubuntu.com/noble/riscv64/libasan8)
- [libffi issue #777 - riscv64 link failure](https://github.com/libffi/libffi/issues/777)
- [libffi issue #694 - riscv64 struct-by-value large argument](https://github.com/libffi/libffi/issues/694)
- [libffi issue #466 - riscv64 small integer truncation](https://github.com/libffi/libffi/issues/466)
- [RISE Project members](https://riseproject.dev/members/)
- [LLVM Foundation](https://foundation.llvm.org/)