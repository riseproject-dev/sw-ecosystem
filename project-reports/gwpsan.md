---
title: gwpsan
parent: Project Reports
---

# gwpsan

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for gwpsan<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GWPSan is a sampling-based sanitizer framework for Linux, developed and maintained by Google LLC. It implements a signal-handler-based runtime that uses hardware watchpoints (`PERF_TYPE_BREAKPOINT` perf events with `SIGTRAP` delivery) to sample memory accesses and detect bugs such as data races (TSan), use-after-return (UAR), and leak-like conditions (LMSan). The hot-path cost is a single thread-local decrement and conditional branch; full instrumentation fires only on sampled events.

**Governance:** Informal. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. Contributions go through GitHub pull requests with code review required. Contributors must sign Google's CLA. The README carries an explicit disclaimer: "This is not an officially supported Google product." License: Apache-2.0.

**Corporate sponsors:** Google LLC is the sole sponsor and organizational owner. All contributors listed in AUTHORS and CONTRIBUTORS are Google employees. Named maintainers include Dmitry Vyukov and Marco Elver, both well-known kernel/sanitizer engineers at Google. No external corporate contributors have been identified.

**RISE membership:** Google LLC is a RISE Premier Member. gwpsan itself is not a registered RISE project and does not appear in any RISE blog post or the RISE wheel builder package list.

**Community culture on new ports:** The project has 332 stars, 12 forks, and 9 watchers as of the research date - a small, Google-internal-focused codebase. The "not an officially supported Google product" disclaimer signals low external maintenance commitment. No public discussion of adding RISC-V or any other architecture exists in issues, PRs, or mailing lists.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port has been started. The complete milestone history for riscv64 is empty.

| Date | Event | Source |
|------|-------|--------|
| (none) | No RISC-V work of any kind | [google/gwpsan issues](https://github.com/google/gwpsan/issues), [google/gwpsan PRs](https://github.com/google/gwpsan/pulls), full code search |

A search of all 65 PRs, all 3 open issues, all commits, and all 196 source files in the repository returns zero RISC-V references. No tracking issue for a riscv64 port exists.

**Key contributors:** Dmitry Vyukov and Marco Elver (Google). No external contributors to architecture backends have been identified.

**Upstream status:** Not applicable - no port exists to upstream.

---

## 3. Upstream Support Tier

gwpsan has no formal tier policy document. `docs/dependencies.md` states: "Other platforms that do not meet the below requirements are unsupported." The stated requirements are Clang 18+ and Linux kernel 6.4+. Architecture is an implicit additional requirement gated by the presence of arch-specific source files.

| Criterion | amd64 (x86-64) | arm64 | riscv64 |
|-----------|----------------|-------|---------|
| Documented as supported | Yes (README) | Yes (README) | No |
| Arch detection macro | `GWPSAN_X64` | `GWPSAN_ARM64` | Missing |
| Architecture source files | Yes | Yes | Missing |
| Build system target | `@platforms//cpu:x86_64` select | `@platforms//cpu:aarch64` select | No select entry |
| CI runner | `ubuntu-latest` (x86_64) | Absent | Absent |
| Official binaries | N/A (header/library, no releases) | N/A | N/A |
| Release blocking | Implicit (only tested arch) | Not tested in CI | Not applicable |

The README explicitly limits support to "the x86-64 and arm64 architectures." riscv64 receives no support tier designation because it has not been considered.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GWPSan's architecture-specific requirements are more demanding than typical cross-platform libraries. The framework operates in signal handlers and must: decode the faulting instruction from raw bytes, map CPU registers from the signal context (`ucontext_t`) to its internal representation, and correctly handle syscall ABIs. Each of these requires a dedicated per-ISA implementation.

**Architecture-specific component inventory (line counts from source tree):**

| File | Lines | Architecture |
|------|-------|-------------|
| `gwpsan/core/decoder_x86.cpp` | 1830 | x86-64 |
| `gwpsan/core/context_x86.cpp` | 511 | x86-64 |
| `gwpsan/core/decoder_x86.h` | 36 | x86-64 |
| `gwpsan/base/syscall_x86.h` | 118 | x86-64 |
| x86-64 subtotal | 2495 | |
| `gwpsan/core/decoder_arm64.cpp` | 434 | arm64 |
| `gwpsan/core/context_arm64.cpp` | 239 | arm64 |
| `gwpsan/core/decoder_arm64.h` | 40 | arm64 |
| `gwpsan/base/syscall_arm64.h` | 139 | arm64 |
| arm64 subtotal | 852 | |
| riscv64 | 0 files, 0 lines | Missing |

**Per-component status:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Instruction decoder | Full (1830-line ISA decode via DynamoRIO drdecode) | Full (434-line A64 decode) | Missing | Requires decoding every instruction that could be a memory access |
| CPU context mapper | Full (511 lines, x87/SSE/AVX registers) | Full (239 lines) | Missing | Maps `ucontext_t` signal frame to internal register model |
| Syscall ABI header | Full (118 lines) | Full (139 lines) | Missing | Encodes Linux syscall numbers and argument conventions |
| Arch detection macro | `GWPSAN_X64` in `config.h` | `GWPSAN_ARM64` in `config.h` | Missing | No `GWPSAN_RISCV64` macro exists |
| Build system select | `@platforms//cpu:x86_64` | `@platforms//cpu:aarch64` | Missing | `gwpsan/core/BUILD` has no riscv64 branch |
| `arch.h` register enum | `#if GWPSAN_X64` branch | `#elif GWPSAN_ARM64` branch | Missing | No `#elif GWPSAN_RISCV64` branch |

No SIMD, crypto, or JIT components exist in gwpsan - the framework is not a numerics library. The performance-critical path is the watchpoint hit handler, which is gated entirely on the instruction decoder and CPU context mapper listed above.

**Kernel dependency - hardware breakpoints:** GWPSan's core mechanism requires `PERF_TYPE_BREAKPOINT` perf events gated on the Linux kernel `HAVE_HW_BREAKPOINT` Kconfig option. `arch/riscv/Kconfig` does not select `HAVE_HW_BREAKPOINT`; no `arch/riscv/kernel/hw_breakpoint.c` exists in the kernel tree. x86, arm64, arm, and powerpc all have this support. This is a fatal blocker independent of the gwpsan source-level gaps.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake, no Autotools, no Meson, no Makefile. No Dockerfiles of any kind in the repository.

**Hard compiler requirements:**
- Clang 18 or later (mandatory; `.bazelrc` opens with "GWPSan depends on Clang. Currently no GCC support is planned"). CI runs Clang 20 (`CC=clang-20`, `CXX=clang++-20`).
- `-fexperimental-sanitize-metadata=atomics,uar` requires LLVM 18 minimum; earlier builds are rejected at runtime by a metadata version check.
- LLVM lld required as the linker (`--linkopt=-fuse-ld=lld` in `.bazelrc`).
- Linux kernel 6.4+ required for the full suite of perf/SIGTRAP/hw-breakpoint patches documented in `docs/dependencies.md`.

**Standard build commands (x86-64; no riscv64 equivalent exists):**

```bash
CC=clang-20 CXX=clang++-20
bazel build --action_env=CC="$CC" --action_env=CXX="$CXX" -c opt \
    --config=x86_64 \
    //gwpsan/unified:libgwpsan.so //gwpsan/unified:gwpsan_archive

bazel test --action_env=CC="$CC" --action_env=CXX="$CXX" \
    --config=dev --config=libc++ --config=x86_64 \
    //gwpsan/...
```

The `--config=x86_64` flag adds `-mcx16` and `-mcrc32`. arm64 gets no equivalent config. riscv64 has no config entry in `.bazelrc`.

**Known .bazelrc configs:**

| Config | Purpose |
|--------|---------|
| `--config=clang` | Force Clang toolchain (always applied) |
| `--config=libc++` | Use LLVM libc++ |
| `--config=x86_64` | x86-64-specific opts: `-mcx16 -mcrc32` |
| `--config=dev` | `-Wall -Werror` |
| `--config=asan` | AddressSanitizer |
| `--config=msan` | MemorySanitizer |

**QEMU:** Not used anywhere in the repository. No cross-compilation toolchain file exists.

**riscv64 build status:** A Bazel build targeting riscv64 would fail immediately with an unmatched `select()` error in `gwpsan/core/BUILD` before any compiler is invoked.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| ThreadSanitizer (TSan) mode | Yes | Yes | Not functional |
| Use-After-Return (UAR) mode | Yes | Yes | Not functional |
| Leak-like detection (LMSan) mode | Yes | Yes | Not functional |
| Instruction decoding in signal handler | Yes | Yes | Missing |
| Hardware watchpoint (PERF_TYPE_BREAKPOINT) | Yes | Yes | Blocked by kernel |
| CPU register context extraction from ucontext_t | Yes | Yes | Missing |
| Syscall argument tracking | Yes | Yes | Missing |
| Store buffer forwarding (emulation) | Yes | Yes | Not applicable until decoder exists |

**Functional gaps:** riscv64 cannot run any gwpsan mode at all. The tool is completely non-functional on riscv64 due to missing arch backend and a missing kernel primitive (`HAVE_HW_BREAKPOINT`).

**Performance gaps:** Not applicable - the tool does not function on riscv64. No SIMD or vectorized paths exist in gwpsan; performance is dominated by signal delivery latency and instruction decode time, both of which are x86-64 and arm64 specific.

**Security hardening gaps:** Not applicable.

**Floating-point / NaN semantics:** Not applicable. gwpsan does not perform floating-point computation.

---

## 7. CI/CD Infrastructure

The repository contains exactly one CI workflow file: [`.github/workflows/tests.yml`](https://github.com/google/gwpsan/blob/main/.github/workflows/tests.yml). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

The workflow runs on `ubuntu-latest` (x86_64 only). Trigger events: push to `main`, `pull_request`, nightly `schedule`, and `workflow_dispatch`. The test matrix covers `fastbuild` and `opt` compilation modes with Bazel + Clang 20. The architecture handling logic is:

```bash
case "$(uname -m)" in
  x86_64) extra_args=(--config=x86_64) ;;
  *) extra_args=() ;;
esac
```

The only named case is `x86_64`. No `riscv64)` case. No QEMU emulation. No cross-compilation.

| CI criterion | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| CI runner exists | Yes (`ubuntu-latest`) | No | No |
| Build tested | Yes | No | No |
| Tests executed | Yes | No | No |
| QEMU cross-build | No | No | No |
| RISE runner | No | No | No |
| Nightly schedule | Yes | No | No |

The word "riscv" does not appear in any CI configuration file in the repository.

---

## 8. Distribution and Release Status

gwpsan has zero GitHub releases and zero tags. No release assets of any kind exist.

| Distribution channel | riscv64 availability |
|---------------------|---------------------|
| GitHub Releases (google/gwpsan) | Zero releases total; confirmed via API returning `[]` |
| PyPI | HTTP 404; gwpsan is not published on PyPI |
| Ubuntu (noble) | "No such package" |
| Debian | HTTP 404 on tracker; zero search results |
| Arch Linux RISC-V (archriscv.felixc.at) | Not found |
| RISE wheel builder | Not listed |

gwpsan is a C++ library/framework, not a language-level package. It is not distributed through any package manager. To use gwpsan, a user builds from source using Bazel + Clang 18+. On riscv64 this build would fail immediately (unmatched `select()` in BUILD). There is no path to a working riscv64 binary through any distribution channel.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking |
|-----------|------|--------------|--------------|-----------------|---------|
| Linux kernel `HAVE_HW_BREAKPOINT` | Core watchpoint mechanism | Not supported | Not applicable | Not applicable | Fatal |
| DynamoRIO (drdecode) | Instruction decode library | In-progress port, build failures | Partial (non-deterministic failures, FP decoding bugs) | Cronbuild only, no stable release | Blocking |
| LLVM/Clang 18+ | Required compiler; `-fexperimental-sanitize-metadata` | Builds on riscv64; metadata pass is arch-agnostic | No riscv64-specific failures for this flag | Available in LLVM 18+ | Non-blocking |
| Abseil-cpp | Test dependency (`absl/time`) | Builds; cross-compile linker issue with `__atomic_compare_exchange_1` on older GCC ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) | Two test SEGFAULTs on Debian riscv64 with GCC 15.2 ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) | Ships in Abseil 20260107+ | Non-blocking (tests only) |
| googletest | Test framework | Builds | `GetThreadCountTest.ReturnsCorrectValue` fails ([#3756](https://github.com/google/googletest/issues/3756)) | Ships in 1.15+ | Non-blocking (tests only) |
| google/benchmark | Benchmark dependency | Builds; `cycleclock` fix merged ([#1802](https://github.com/google/benchmark/pull/1802)) | No open failures | Ships in v1.8+ | Non-blocking |
| RE2 | Bazel dependency | Builds; no riscv64 issues found | No known failures | Ships in current releases | Non-blocking |

**Critical dependency deep-dives:**

**Linux kernel `HAVE_HW_BREAKPOINT` (fatal blocker):** GWPSan's entire runtime model depends on `PERF_TYPE_BREAKPOINT` perf events with `SIGTRAP` delivery for watchpoints. This kernel primitive is gated on `HAVE_HW_BREAKPOINT`. `arch/riscv/Kconfig` does not select `HAVE_HW_BREAKPOINT`. No `arch/riscv/kernel/hw_breakpoint.c` exists. No open kernel patch series adding this has been identified. x86, arm64, arm, and powerpc have this support. This blocker is upstream in the Linux kernel, not in gwpsan itself, and requires significant kernel work before any gwpsan port can function.

**DynamoRIO drdecode (blocking):** GWPSan uses `gwpsan/core/decoder_dynamorio.cpp` as a wrapper around the drdecode library for in-signal-handler instruction decoding. DynamoRIO has an in-progress riscv64 port (OpSys-RISCV label exists; PRs such as [#7438](https://github.com/DynamoRIO/dynamorio/pull/7438) have been merged). However, non-deterministic build failures ([#6140](https://github.com/DynamoRIO/dynamorio/issues/6140)) and FP vector operand decoding bugs ([#8057](https://github.com/DynamoRIO/dynamorio/issues/8057)) remain open. No stable riscv64 release exists. Even when the DynamoRIO port stabilizes, gwpsan would still require its own `decoder_riscv64.cpp` wrapper file - currently absent.

---

## 11. Known Bugs and Active Issues

**Correctness bugs:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [PR #65](https://github.com/google/gwpsan/pull/65) | `core: Fix forwarding of stores starting before the load address` | Open (2026-08-20) | High (correctness) | Unsigned arithmetic wrap in `StoreBuffer::Forward`: `off = store.addr - addr` wraps to a large value when a store starts before the load address, causing the store to be skipped and an incorrect emulated value to be returned. Affects any code that writes a wider value then reads a narrower overlapping field at a higher offset. Fix uses `max`/`min` range overlap. Affects `gwpsan/core/store_buffer.cpp`. Architecture-neutral. |

**Other open issues:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#40](https://github.com/google/gwpsan/issues/40) | (No public description) | Open (2025-07-26) | Internal/confidential Google issue; content not accessible |
| [#9](https://github.com/google/gwpsan/issues/9) | (Not detailed in findings) | Open | No RISC-V relevance confirmed |
| [#29](https://github.com/google/gwpsan/issues/29) | (Not detailed in findings) | Open | No RISC-V relevance confirmed |
| [#41](https://github.com/google/gwpsan/issues/41) | (Not detailed in findings) | Open | No RISC-V relevance confirmed |

No riscv64-specific bugs exist because no riscv64 support exists to generate them.

---

## 12. Objections and Upstream Blockers

**Stated objections:** No public objections to a RISC-V port have been recorded because no such port has been proposed. The "not an officially supported Google product" disclaimer indicates that Google is unlikely to staff the port internally.

**Technical blockers, ranked by severity:**

1. **Linux kernel `HAVE_HW_BREAKPOINT` missing on riscv64 (fatal).** GWPSan's watchpoint mechanism is architecturally dependent on this kernel primitive. Without it, the tool cannot sample memory accesses, which is its entire purpose. This blocker requires kernel development work to implement RISC-V hardware breakpoint support - a multi-month kernel engineering effort - before gwpsan can be ported at all.

2. **No riscv64 arch backend in gwpsan (fatal).** The instruction decoder, CPU context mapper, and syscall header for riscv64 are completely absent. The x86-64 decoder alone is 1830 lines of ISA-specific decode logic. The arm64 decoder is 434 lines. A riscv64 decoder covering the base ISA plus compressed instructions (RVC) represents a substantial engineering investment. The `select()` in `gwpsan/core/BUILD` would need a new riscv64 branch.

3. **DynamoRIO riscv64 port is incomplete (blocking).** gwpsan depends on drdecode for instruction decoding. The DynamoRIO riscv64 port has open non-deterministic build failures and FP decoding bugs. Stabilizing this is a prerequisite, though it is being worked on independently of gwpsan.

4. **No CI infrastructure for riscv64 (blocking).** No QEMU-based or hardware-based riscv64 CI exists. Adding CI is required before any port can be validated or maintained.

**Organizational blockers:** Google has not indicated intent to port gwpsan to RISC-V. The project is not a RISE member project. No external organization has opened a tracking issue or expressed public intent to fund the work.

**Acceptance probability:** Given that the entire arch backend must be written from scratch and the kernel `HAVE_HW_BREAKPOINT` prerequisite is missing, the effort is substantial. If a high-quality patch series were submitted addressing all technical blockers, acceptance probability is moderate - the codebase is well-structured and the existing arm64 port provides a template. However, Google would need to agree to maintain the new architecture, which is not guaranteed given the disclaimer on the project.

---

## 13. Investment Analysis

RISE has no existing involvement with gwpsan. No RISE blog posts, no RISE wheel builder entries, no registered RISE project status, and no RISE-affiliated contributors have been identified.

### 13.1 Functional Enablement

Three sequential workstreams are required before gwpsan can function on riscv64. They cannot be parallelized due to hard dependencies.

**Workstream A - Linux kernel `HAVE_HW_BREAKPOINT`:** Implement hardware breakpoint support for the RISC-V architecture in the Linux kernel. This requires: implementing `arch/riscv/kernel/hw_breakpoint.c` using the RISC-V trigger/debug CSRs, selecting `HAVE_HW_BREAKPOINT` in `arch/riscv/Kconfig`, passing the kernel self-tests, and getting the series accepted through the RISC-V kernel maintainers. This is a kernel engineering task independent of gwpsan.

**Workstream B - DynamoRIO riscv64 stabilization:** Resolve [#6140](https://github.com/DynamoRIO/dynamorio/issues/6140) (non-deterministic build failures) and [#8057](https://github.com/DynamoRIO/dynamorio/issues/8057) (FP vector decoding). This may be partially in progress by the DynamoRIO community.

**Workstream C - gwpsan riscv64 arch backend:** Implement `gwpsan/core/decoder_riscv64.cpp`, `gwpsan/core/context_riscv64.cpp`, `gwpsan/base/syscall_riscv64.h`, `GWPSAN_RISCV64` macro in `config.h`, register enum branch in `arch.h`, and `select()` entry in `gwpsan/core/BUILD`.

### 13.2 Performance Optimization

Not applicable until functional enablement is complete. No SIMD or vectorized paths exist in gwpsan.

### 13.3 CI/CD Infrastructure

Add a riscv64 runner (QEMU or hardware) to `.github/workflows/tests.yml` with the same `fastbuild`/`opt` matrix as the existing x86-64 job.

### 13.4 Ecosystem Enablement

Not applicable. gwpsan has no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Linux kernel `HAVE_HW_BREAKPOINT` for RISC-V | 20-30 | Kernel engineer with RISC-V arch knowledge | Critical (prerequisite for all other work) |
| Functional | DynamoRIO riscv64 build and decode stabilization | 4-8 | DynamoRIO contributor | Critical (prerequisite for gwpsan decoder) |
| Functional | gwpsan riscv64 instruction decoder (`decoder_riscv64.cpp`) | 8-16 | Systems engineer familiar with RISC-V ISA and DynamoRIO | Critical |
| Functional | gwpsan riscv64 CPU context mapper (`context_riscv64.cpp`) | 3-5 | Same engineer | Critical |
| Functional | gwpsan riscv64 syscall header and build wiring | 1-2 | Same engineer | Critical |
| CI/CD | Add riscv64 CI runner (QEMU or hardware) | 1-2 | DevOps | High |
| Functional | End-to-end validation on real riscv64 hardware | 2-4 | QA engineer | High |

Total estimated effort: 39-67 person-weeks, with the Linux kernel workstream being the longest and most uncertain. None of this work is currently funded by RISE or any other organization.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/gwpsan repository](https://github.com/google/gwpsan)
- [gwpsan README](https://github.com/google/gwpsan/blob/main/README.md)
- [gwpsan docs/dependencies.md](https://github.com/google/gwpsan/blob/main/docs/dependencies.md)
- [gwpsan .github/workflows/tests.yml](https://github.com/google/gwpsan/blob/main/.github/workflows/tests.yml)
- [gwpsan .bazelrc](https://github.com/google/gwpsan/blob/main/.bazelrc)
- [gwpsan/base/config.h](https://github.com/google/gwpsan/blob/main/gwpsan/base/config.h)
- [gwpsan/core/arch.h](https://github.com/google/gwpsan/blob/main/gwpsan/core/arch.h)
- [gwpsan/core/BUILD](https://github.com/google/gwpsan/blob/main/gwpsan/core/BUILD)
- [gwpsan PR #65 - Fix store forwarding before load address](https://github.com/google/gwpsan/pull/65)
- [gwpsan issue #40](https://github.com/google/gwpsan/issues/40)
- [DynamoRIO issue #6140 - non-deterministic riscv64 build failures](https://github.com/DynamoRIO/dynamorio/issues/6140)
- [DynamoRIO issue #8057 - FP vector operand decoding bug riscv64](https://github.com/DynamoRIO/dynamorio/issues/8057)
- [DynamoRIO PR #7438 - client.flush riscv64](https://github.com/DynamoRIO/dynamorio/pull/7438)
- [Abseil-cpp issue #1702 - cross-compile linker atomic issue riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002 - test SEGFAULTs on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [googletest issue #3756 - GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [google/benchmark PR #1802 - cycleclock type conversion fix riscv64](https://github.com/google/benchmark/pull/1802)
- [RISE Project member list](https://riseproject.dev)
- [GWP-ASan paper (arxiv)](https://arxiv.org/abs/2311.09394)