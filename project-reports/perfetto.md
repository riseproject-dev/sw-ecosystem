---
title: perfetto
parent: Project Reports
---

# perfetto

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for perfetto<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Perfetto is a production-grade system tracing and application profiling framework. It provides:

- `traced`: a daemon that collects trace events from multiple producers via a shared memory ring buffer
- `traced_perf`: a daemon that drives Linux `perf_event` sampling for CPU profiling and callstack collection
- `heapprofd`: a heap profiler that intercepts `malloc`/`free` calls via `LD_PRELOAD` and collects annotated allocation callstacks
- `trace_processor`: a SQL-based analysis engine for post-mortem trace analysis, usable as a C++ library or via the `trace_processor_shell` REPL
- A web UI and Python SDK for interactive analysis

The project is hosted at [https://github.com/google/perfetto](https://github.com/google/perfetto) under the Apache 2.0 license. It originated inside Google and is deployed in Android, Chrome, and Google-internal infrastructure.

**Governance:** Perfetto is wholly Google-governed. All entries in the OWNERS file carry `@google.com` email addresses. The top contributor by commit count is Lalit Maganti (lalitm@google.com, 13,235 commits). Founding author is Primiano Tucci (primiano@google.com). No independent foundation affiliation exists. External contributions are accepted via GitHub PR but all approval authority is Google-internal.

**Corporate sponsors:** Google only. Perfetto is not a RISE Project member. SiFive contributed the initial riscv64 build system support (see Section 2).

**Community culture on new ports:** The project is receptive to external platform contributions when they do not require ongoing Google engineering. However, the project's top reviewer stated explicitly in [issue #936](https://github.com/google/perfetto/issues/936): "Any RISC-V code in Perfetto is basically totally untested... we also don't have any capacity to support it given we have no CI running tests there." New ports are accepted as best-effort contributions with no CI, no release binary, and no maintainer commitment.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-05-18 (committed 2023-06-22) | First RISC-V commit: commit `62a3147` "Support standalone riscv64 linux builds" adds `target_cpu == "riscv64"` -> `riscv64-linux-gnu` toolchain triplet in `gn/standalone/toolchain/BUILD.gn`, plus `-latomic` workaround for GCC bug [#104338](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=104338). Tested on HiFive Unmatched board. | [google/perfetto commit 62a3147](https://github.com/google/perfetto) |
| 2023-2024 (multiple commits) | Profiling subsystem additions: `ARCH_RISCV64` cases added to `regs_parsing.cc`, `unwinding.cc`, `frame_pointer_unwinder.cc`, `wire_protocol.h`, `client.cc`. libunwindstack vendored copy extended with `RegsRiscv64.cpp`. | [google/perfetto source](https://github.com/google/perfetto) |
| 2024-11-15 | [Issue #936](https://github.com/google/perfetto/issues/936) opened by shkim-rc: heapprofd stack unwinding fails on riscv64 because `__builtin_frame_address(0)` returns the caller's stack pointer value on riscv64 (GCC-14 convention: `add s0, sp, 544`), not the current frame base as on AArch64. | [issue #936](https://github.com/google/perfetto/issues/936) |
| 2024-11-27 | Fix committed by Sung-hun Kim (shkim-rc) via Android Gerrit [CL 3351219](https://android-review.googlesource.com/c/platform/external/perfetto/+/3351219): use `GetStackAddress()` with raw SP register instead of `__builtin_frame_address(0)` for riscv64. | [issue #936](https://github.com/google/perfetto/issues/936) |
| 2024-11-28 | Issue #936 closed. Fix landed in Android tree. | [issue #936](https://github.com/google/perfetto/issues/936) |
| 2026-08-06 | [PR #7015](https://github.com/google/perfetto/pull/7015) filed by safayat-google (Google member): extends the SP-capture mechanism from RISC-V to x86_64, citing riscv64 as the reference implementation. | [PR #7015](https://github.com/google/perfetto/pull/7015) |
| 2026-08-07 | PR #7015 merged. First release containing this change: v58.2 (published 2026-08-24). | [PR #7015](https://github.com/google/perfetto/pull/7015) |

**Key contributors:**

| Contributor | Organization | Contribution |
|---|---|---|
| Samuel Holland (SiFiveHolland) | SiFive | Initial riscv64 cross-compilation build support |
| Sung-hun Kim (shkim-rc) | External (affiliation not stated in findings) | heapprofd stack unwind fix (issue #936), Android CL 3351219 |
| safayat-google | Google | PR #7015, generalizing the RISC-V SP fix to x86_64 |

All riscv64 work is fully upstreamed. There is no out-of-tree fork or patch queue. The Android Gerrit fix (CL 3351219) was the upstream merge path; google/perfetto on GitHub is the canonical source that mirrors into AOSP.

---

## 3. Upstream Support Tier

Perfetto has no formal platform tier policy document (`PLATFORMS.md`, `SUPPORT.md`, or equivalent not found in repository).

**De facto tier classification:**

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build system target | Yes | Yes | Yes |
| Bundled sysroot in `tools/install-build-deps` | Yes | Yes | No |
| CI job in `linux-tests.yml` | Yes | No | No |
| CI job in `android-tests.yml` | No | Yes | No |
| Release-blocking on test failures | Yes | Yes | No |
| Pre-built release binary | Yes | Yes | No |
| Distro package (Debian/Ubuntu) | Yes | Yes | No |
| Maintainer commitment | Yes | Yes | No ("no capacity") |

riscv64 is a community-supported, source-only, untested architecture. The project's own maintainer confirmed this categorization in writing.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Perfetto is not a compute-intensive library. It has no JIT compiler, no cryptographic acceleration paths, no SIMD-optimized compute kernels, and no architecture-specific assembly (`.S` files). Architecture-specific code is limited to the profiling stack: register layout definitions, stack unwinding, and frame pointer convention handling.

**Component inventory:**

| Component | Description | amd64 | arm64 | riscv64 | ISA extensions used |
|---|---|---|---|---|---|
| CPU arch detection macro (`build_config.h`) | `PERFETTO_ARCH_CPU_*` flag via compiler predefine | Full (`__x86_64__`) | Full (`__aarch64__`) | Partial - uses `__riscv` (not `__riscv_xlen==64`), no rv32/rv64 distinction | None |
| GN cross-compilation toolchain | `gn/standalone/toolchain/BUILD.gn` | Full | Full | Full - triplet `riscv64-linux-gnu` | None |
| GCC atomics workaround | `-latomic` for GCC builds | Not needed | Not needed | Present (GCC bug #104338) | None |
| perf register mask (`regs_parsing.cc`) | Maps Linux `perf_event` registers to libunwindstack format | Full | Full | Full - all 32 GP registers via `PERF_REG_RISCV_MAX` | Base integer |
| heapprofd stack capture (`client.cc`) | `RecordMalloc` stack copy in the intercepted process | Full (SP-path since PR #7015) | Full (`__builtin_frame_address(0)`) | Full (SP-path, fix from issue #936) | Base integer |
| heapprofd unwinding daemon (`unwinding.cc`) | Creates `RegsRiscv64` for offline stack unwinding | Full | Full | Full | Base integer |
| Frame pointer unwinder: DecodeFrame/IsFrameValid (`frame_pointer_unwinder.cc`) | Uses `RISCV64_REG_S0` as frame pointer, alignment mask `0x7` | Full | Full | Code present and correct | Base integer |
| Frame pointer unwinder: `IsArchSupported()` (`frame_pointer_unwinder.h`) | Guards whether the unwinder activates | Returns true | Returns true | **Returns false** - riscv64 explicitly excluded despite having implementation code | N/A |
| libunwindstack (vendored, `buildtools/BUILD.gn`) | Stack unwinding library used by traced_perf and heapprofd | Full | Full | Full - `RegsRiscv64.cpp` included, `NT_RISCV_VECTOR=0x901` defined | Base integer; `NT_RISCV_VECTOR` covers RVV ELF notes in coredumps |
| ABI string for Android handshake (`client.cc`, `heapprofd_test_helper.cc`) | `ABI_STRING` used in heapprofd client-daemon handshake | `"x86_64"` | `"arm64"` | Full - `"riscv64"` via `#elif defined(__riscv)` | None |

**Frame pointer unwinder dead-code bug:** `frame_pointer_unwinder.cc` contains a complete and apparently correct riscv64 implementation (correct frame register `RISCV64_REG_S0`, correct 8-byte alignment mask). However, `IsArchSupported()` in the corresponding header hard-codes a return of `true` only for `ARCH_ARM64` and `ARCH_X86_64`. Calling `FramePointerUnwinder::Unwind()` on riscv64 returns `ERROR_UNSUPPORTED` immediately. This is a latent bug: the guard was never updated when the implementation code was added. [NEEDS VERIFICATION: no bug report or acknowledgment of this discrepancy was found in the issue tracker.]

**RVV (RISC-V Vector Extension):** Not used anywhere in Perfetto. No `vfloat32m1_t`, no `.S` vector files, no SIMD dispatch. Perfetto does not have SIMD-optimized paths on any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

Perfetto uses GN + Ninja exclusively. No `CMakeLists.txt` exists. No Meson riscv64 references exist.

**GN args for riscv64 cross-compilation:**

```
target_os = "linux"
target_cpu = "riscv64"
is_clang = true
target_sysroot = "/path/to/riscv64-linux-gnu-sysroot"
```

Or with a system cross-compiler:

```
target_os = "linux"
target_cpu = "riscv64"
is_system_compiler = true
target_ar = "riscv64-linux-gnu-ar"
target_cc = "riscv64-linux-gnu-gcc"
target_cxx = "riscv64-linux-gnu-g++"
```

**Full build steps:**

```bash
git clone https://github.com/google/perfetto
cd perfetto
tools/install-build-deps   # downloads hermetic clang; does NOT include riscv64 sysroot
tools/gn gen out/riscv64 --args='target_os="linux" target_cpu="riscv64" is_clang=true target_sysroot="/path/to/riscv64-sysroot"'
tools/ninja -C out/riscv64
```

**Sysroot:** The `tools/install-build-deps` script provides bundled Debian sysroots for arm and arm64 only. For riscv64, the caller must supply a sysroot manually. The script's `--build-arch` option does not accept `riscv64`.

**Compiler flag specifics for riscv64:**

- GCC only: `-latomic` is linked automatically by the build system to work around [GCC bug #104338](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=104338) (128-bit atomics on riscv64 require libatomic in older GCC).
- Clang: No extra flags required; `-latomic` is not needed.
- No `-march` flag is set for riscv64 in the build system (unlike ARM which sets `-march=armv7-a`). The toolchain default applies.
- No `-fno-omit-frame-pointer` is set for riscv64.

**QEMU usage:** Not documented anywhere in the repository. No `Dockerfile.riscv64`, no QEMU invocation in any CI or build script.

**Known build issues:**

- No riscv64 sysroot is bundled; build fails without an externally provided sysroot or system cross-compiler.
- GCC builds require libatomic (handled automatically by GN).
- No `protoc` riscv64 binary is published by the protobuf project (see Section 9); build systems that regenerate `.pb.cc` files from `.proto` sources must cross-compile or use QEMU to run `protoc`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| `traced` (tracing daemon) | Yes | Yes | Build-only, untested | CI gap |
| `traced_perf` (perf-event CPU profiler) | Yes | Yes | Build-only, untested | CI gap |
| heapprofd (heap profiler) | Yes | Yes | Builds; fix landed (issue #936); no CI | CI gap |
| Frame pointer unwinder | Enabled | Enabled | **Disabled** (`IsArchSupported()` returns false) | Functional gap |
| `trace_processor_shell` (SQL REPL) | Yes | Yes | Build-only, untested | CI gap |
| Wattson power estimation (SoC detection via devicetree) | N/A | Partial | No (PR #3026 not merged) | Functional gap |
| Pre-built `tracebox` binary | Yes | Yes | No | Distribution gap |
| `trace_processor` Python SDK native binary | Yes | Yes | No | Distribution gap |
| 32-bit riscv userspace profiling | N/A | N/A | Unknown (TODO comment in source) | Unknown |

**Functional gaps:**

1. Frame pointer unwinder is disabled for riscv64 (`IsArchSupported()` returns `false`). `traced_perf` cannot use frame-pointer-based unwinding on riscv64, falling back to libunwindstack DWARF unwinding only.
2. Wattson (SoC power estimation) cannot identify riscv64 SoCs from the Linux devicetree; PR #3026 was closed unmerged.
3. 32-bit riscv userspace on a 64-bit kernel is unhandled (noted as TODO in `regs_parsing.cc`).

**Performance gaps:** No benchmark data available for riscv64 (see Section 11). No SIMD paths exist for any architecture in Perfetto, so there is no riscv64-specific SIMD gap. Downstream dependencies (particularly PCRE2 and zstd) impose performance penalties on riscv64 for trace processing workloads (see Section 9).

**Security hardening gaps:** Data not available: no audit of CFI, stack canaries, or hardening flags specific to riscv64 was performed in the research.

---

## 7. CI/CD Infrastructure

**Perfetto CI:** Runs on GCE `c2d-standard-32` VMs (x86_64) in us-west1 via GitHub Actions (`self-hosted` runners). The CI configuration at `.github/workflows/linux-tests.yml` defines exactly six matrix configurations, all x86 variants:

- `clang-x86_64-debug`
- `clang-x86_64-tsan`
- `clang-x86_64-msan`
- `clang-x86_64-asan_lsan`
- `clang-x86-release`
- `gcc9-x86_64-release`

19 workflow files were inspected in full. Zero occurrences of "riscv" or "riscv64" appear in any workflow file.

**Android CI** (`android-tests.yml`): Tests arm only. No riscv64 Android target.

**RISE runners:** No RISE CI infrastructure is used. Perfetto is not a RISE member project.

| CI property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | Yes | No (Android CI, arm32) | No |
| Unit test job exists | Yes | No | No |
| ASAN/TSAN/MSAN coverage | Yes | No | No |
| Hardware runner | x86_64 GCE | arm Android device | None |
| QEMU emulation | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases (v58.2, current):** 14 release assets. Linux binaries: `linux-amd64.zip`, `linux-arm.zip`, `linux-arm64.zip`. No `linux-riscv64.zip`. Confirmed via direct GitHub Releases API enumeration.

**PyPI (`perfetto` package, v0.58.2):** Published as `perfetto-0.58.2-py3-none-any.whl` (pure Python). Installs on riscv64 without error. However, the wheel bundles a pre-built `trace_processor` native binary used for SQL trace analysis; this binary has no riscv64 build. On riscv64, the native trace_processor component will not function unless built from source separately.

**RISE wheel builder:** Redirects to PyPI. No RISE-maintained riscv64 wheel for perfetto exists.

**Debian (`tracker.debian.org`):** Package version 56.0-1 in testing/sid. Architectures listed: amd64, arm64, armhf, i386. riscv64 is absent.

**Ubuntu Noble (24.04):** perfetto package does not exist.

**Arch Linux RISC-V (`archriscv.felixc.at`):** perfetto is not packaged.

**What a user must do to get a working riscv64 binary:**

1. Clone the repository.
2. Obtain a riscv64-linux-gnu sysroot (not provided by `tools/install-build-deps`).
3. Install a cross-compiler (`riscv64-linux-gnu-gcc` or clang with `--target=riscv64-linux-gnu`).
4. If proto files need regenerating: either cross-compile protoc or use QEMU to run the x86_64 protoc binary.
5. Run `tools/gn gen` with explicit `target_cpu`, `target_os`, and `target_sysroot`.
6. Run `tools/ninja`.

No pre-built binary path exists.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role in Perfetto | riscv64 Build | riscv64 Test | riscv64 Release Artifacts | Notable riscv64 Issues |
|---|---|---|---|---|---|
| Abseil-cpp | Base library (strings, containers, CRC32C, logging) | Builds (older toolchain linker issues) | Partial - Swisstable test failure (absl#2142, open) | Source only | #1986 (open): CRC32C hardware acceleration not implemented for riscv64 Zbc/Zbkc; #2142 (open): hashtable test failures; #1702 (open): linker failure with older toolchains |
| Protocol Buffers | Wire format for all trace data; `protoc` required at build time | Builds (riscv64 support merged 2024) | Unknown - no riscv64 CI lane visible | No riscv64 `protoc` binary in v36.0 releases | No prebuilt `protoc` forces cross-compile or QEMU for build |
| RE2 | Regex engine for trace processor | Builds | Assumed OK - no failures reported | Source only | None known |
| zstd | Trace compression/decompression | Builds | Builds/runs | Source only | 5 open PRs for riscv64 perf: #4622 (huf_decompress), #4668 (prefetch), #4643, #4584, #4596; decompression throughput measurably lower than x86/arm64 |
| zlib (Chromium fork) | Trace compression fallback | Builds - generic C path | Assumed OK | Source only | No SIMD acceleration for riscv64; software fallback |
| SQLite | Trace processor query engine | Builds | OK | Source (amalgamation) | None known |
| gRPC | Bigtrace distributed analysis service (optional) | Builds | Partial | No riscv64 Python wheels on PyPI | Python `grpcio` wheel not published for riscv64; affects Bigtrace Python tooling |
| libexpat | XML trace import | Builds | Unknown | Source only | #1337 (open): no riscv64 CI lane |
| PCRE2 | Regex fallback in trace processor | Builds - generic C | Builds/runs | Source only | JIT backend not merged for riscv64 (#921, open); falls back to interpreter - significant regex performance penalty |
| libunwind (vendored as libunwindstack) | Stack unwinding for heap/CPU profiling | Builds | Partial | Source only | CMake build unsupported (#765, open); C++ exception unwind unreliable on riscv64 (#519, open); directly impacts heap and CPU profiler correctness |
| google/benchmark | Microbenchmarks in build | Builds | OK | Source only | None |
| googletest | Test harness | Builds | Partial | Source only | #3756 (open): thread count test failure on riscv64 |

**Hard blockers (functionality missing or broken):**

- `libunwindstack` (vendored): C++ exception unwinding unreliable on riscv64 (open issue #519); heap/CPU profiler stacks may be incorrect in programs that use C++ exceptions.
- `PCRE2`: No JIT backend; regex-heavy SQL queries over traces will be significantly slower on riscv64.
- `Protocol Buffers`: No prebuilt `protoc` for riscv64 in any official release; build systems that regenerate proto outputs must use QEMU or cross-compile protoc separately.

**Soft blockers (performance or test failures):**

- `Abseil-cpp`: Swisstable test failures (#2142), missing CRC32C hardware acceleration (#1986).
- `zstd`: Five open performance PRs; trace decompression throughput suboptimal.
- `gRPC`: Python wheel unavailable for riscv64, blocking Bigtrace Python tooling.
- `googletest`: One open test failure (#3756).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#936](https://github.com/google/perfetto/issues/936) | Failed to unwind stack on RISCV-64 | Closed (2024-11-28) | High - heap profiler produced incorrect stack traces | Root cause: `__builtin_frame_address(0)` returns caller SP on riscv64 (GCC-14 convention); fix: use raw SP register via `GetStackAddress()`. Fixed via Android CL 3351219; extended to x86_64 in PR #7015. |
| (no issue) | Frame pointer unwinder disabled for riscv64 | No issue filed | Medium - `traced_perf` frame pointer unwinding silently falls back to DWARF-only on riscv64 | `IsArchSupported()` returns false for `ARCH_RISCV64` despite complete implementation code in `frame_pointer_unwinder.cc`. This is a latent correctness gap, not a crash. [NEEDS VERIFICATION] |

**No open riscv64-specific bugs exist in google/perfetto as of the research date.** The only riscv64 issue (#936) is closed.

**No published performance benchmarks for riscv64 exist.** Data not available: no benchmark numbers for riscv64 versus arm64 or x86_64 were found in the GitHub tracker, the project website, the RISE blog, or any external source.

---

## 12. Objections and Upstream Blockers

**Stated objections:**

The maintainer Lalit Maganti stated directly in issue #936: "Any RISC-V code in Perfetto is basically totally untested... we also don't have any capacity to support it given we have no CI running tests there." This is not a technical objection but a resource objection. Google has no RISC-V hardware in its CI fleet for this project.

**Technical blockers:**

1. No riscv64 CI runner: all CI is on Google-owned x86_64 GCE instances. Adding riscv64 CI requires either QEMU cross-testing (tolerable latency for build-only) or RISC-V hardware runners (higher cost, requires Google infra decision).
2. No bundled sysroot: `tools/install-build-deps` does not fetch a riscv64 Debian sysroot, making out-of-box cross-compilation more friction-heavy than arm64.
3. Frame pointer unwinder disabled: a one-line fix to `IsArchSupported()` would enable the already-written code, but without CI it risks regressing silently.

**Organizational blockers:**

- Google controls all merge authority. External contributors can submit PRs, but CI is required for merge in practice. A PR that adds riscv64 CI jobs would need Google to provision runners or approve QEMU-based testing.
- RISE is not involved. There is no funded upstream work on this project for riscv64.

**Acceptance probability for targeted contributions:** High for correctness fixes that follow the existing pattern (like issue #936). Low for CI infrastructure additions, which require Google to provision runners. The frame pointer unwinder `IsArchSupported()` fix has a high probability of acceptance as a one-line correctness patch.

---

## 13. Investment Analysis

RISE has no prior investment in Perfetto riscv64 enablement. All existing riscv64 source code was contributed by SiFive (build system) and an external contributor (heap profiler stack fix). No RISE-funded work needs to be excluded from sizing.

### 13.1 Functional Enablement

- Fix `IsArchSupported()` in `frame_pointer_unwinder.h` to include `ARCH_RISCV64`. One-line change, low risk, high value: enables frame pointer-based unwinding for `traced_perf` on riscv64.
- Clarify or implement rv32-vs-rv64 disambiguation in `build_config.h` (`__riscv_xlen == 64` check). Low risk.
- Investigate and fix `libunwindstack` C++ exception unwinding reliability on riscv64 (upstream issue #519). Medium effort; affects heapprofd correctness on exception-using targets.

### 13.2 Performance Optimization

Perfetto itself has no SIMD paths to optimize. Performance gaps are entirely in dependencies:

- PCRE2: Contribute or advocate for merging the riscv64 JIT backend (issue #921). This affects trace processor query performance on regex-heavy workloads. Medium effort.
- zstd: Address the five open riscv64 performance PRs (#4622, #4668, #4643, #4584, #4596). This affects trace file load latency. Low-to-medium effort per PR.

### 13.3 CI/CD Infrastructure

- Add a riscv64 cross-compilation build job to `linux-tests.yml` using QEMU user-mode emulation or a cross-compiler. This does not require RISC-V hardware. Medium effort for initial setup; requires Google approval to merge.
- Add riscv64 sysroot to `tools/install-build-deps`. Low effort once sysroot is available.

### 13.4 Ecosystem Enablement

- Publish a `linux-riscv64.zip` release asset. Blocked on CI (cannot release untested binaries). Follows from 13.3.
- Enable riscv64 in the Debian package build. Downstream from fixing libunwindstack issues (13.1).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `IsArchSupported()` for riscv64 frame pointer unwinder | 0.5 | External contributor / RISE | Critical |
| Functional | Fix libunwindstack C++ exception unwinding on riscv64 (upstream issue #519) | 3 | External contributor | High |
| Functional | rv64/rv32 disambiguation in `build_config.h` | 0.5 | External contributor | Low |
| Performance | PCRE2 riscv64 JIT backend (issue #921) | 4 | External contributor | High |
| Performance | zstd riscv64 performance PRs (5 open PRs) | 3 | External contributor | Medium |
| CI/CD | Add riscv64 cross-compile build job to `linux-tests.yml` (QEMU) | 3 | External contributor + Google approval | High |
| CI/CD | Add riscv64 sysroot to `tools/install-build-deps` | 1 | External contributor | Medium |
| Distribution | Publish `linux-riscv64.zip` release asset | 1 (blocked on CI) | Google (release infra) | Medium |
| Distribution | Enable riscv64 in Debian package | 1 (blocked on libunwindstack) | Debian maintainer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/perfetto GitHub repository](https://github.com/google/perfetto)
- [perfetto homepage](https://perfetto.dev/)
- [Issue #936: Failed to unwind stack on RISCV-64](https://github.com/google/perfetto/issues/936)
- [PR #7015: profiling:x86_64: use stack pointer instead of frame address for heapprofd](https://github.com/google/perfetto/pull/7015)
- [PR #3026: On Linux, extract SoC model from the devicetree base compatible](https://github.com/google/perfetto/pull/3026)
- [Android Gerrit CL 3351219: perfetto heapprofd riscv64 stack unwind fix](https://android-review.googlesource.com/c/platform/external/perfetto/+/3351219)
- [Issue #4801: heap profiling not working with absl time lib (Linux)](https://github.com/google/perfetto/issues/4801)
- [perfetto v58.2 release assets](https://github.com/google/perfetto/releases/tag/v58.2)
- [PyPI perfetto package](https://pypi.org/project/perfetto/)
- [Debian tracker: perfetto](https://tracker.debian.org/pkg/perfetto)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [GCC bug #104338: riscv64 libatomic required for atomic operations](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=104338)
- [Abseil-cpp issue #2142: Swisstable test failure on riscv64](https://github.com/abseil/abseil-cpp/issues/2142)
- [Abseil-cpp issue #1986: CRC32C hardware acceleration not implemented for riscv64](https://github.com/abseil/abseil-cpp/issues/1986)
- [Abseil-cpp issue #1702: riscv64 linker failure with older toolchains](https://github.com/abseil/abseil-cpp/issues/1702)
- [PCRE2 issue #921: riscv64 JIT backend](https://github.com/PCRE2Project/pcre2/issues/921)
- [libunwindstack issue #519: C++ exception unwind on riscv64](https://github.com/libunwind/libunwind/issues/519)
- [googletest issue #3756: thread count test failure on riscv64](https://github.com/google/googletest/issues/3756)
- [libexpat issue #1337: no riscv64 CI lane](https://github.com/libexpat/libexpat/issues/1337)
- [RISE Project member list](https://riseproject.dev/)
- [perfetto linux-tests.yml CI workflow](https://github.com/google/perfetto/blob/main/.github/workflows/linux-tests.yml)