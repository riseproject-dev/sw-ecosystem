---
title: kafel
---

# kafel

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for kafel<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Kafel is a C library and domain-specific language for expressing Linux seccomp-BPF syscall filter policies. It compiles human-readable policy text into BPF bytecode suitable for use with `prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, ...)`. The primary known consumer is [nsjail](https://github.com/google/nsjail), a lightweight Linux process isolation tool.

The project is hosted under the `google` GitHub organization at [github.com/google/kafel](https://github.com/google/kafel) and licensed under Apache-2.0. The README explicitly states: "This is NOT an official Google product." There is no foundation affiliation, no OWNERS or CODEOWNERS file, and no formal governance document.

**Maintainers:**

- Wiktor Garbacz (wiktorg@google.com, GitHub: happyCoder92) - Google engineer, 73 of 112 total commits (~65%), historical primary driver.
- Robert Swiecki (robert@swiecki.net, GitHub: robertswiecki) - independent security researcher and nsjail author, 18 commits, most recent activity including 2025-2026 riscv64 work.

Google LLC is a Premier Member of the RISE Project. Kafel itself is not listed as a RISE project and no RISE blog posts, wheel builder entries, or GitHub repositories reference kafel.

Community stance on new ports is informal and open. The riscv64 port was accepted from an external contributor with no documented review policy. Patches are accepted via GitHub pull request.

---

## 2. Port History and Upstreaming Timeline

All riscv64 work is fully merged to the main branch. There is no tracking issue and no pending work.

| Date | Event | Source |
|---|---|---|
| 2021-10-11 | [PR #31](https://github.com/google/kafel/pull/31) merged: "add riscv64 platform" - adds `KAFEL_TARGET_ARCH_RISCV64` enum, arch detection in `common.h`, `AUDIT_ARCH_RISCV64` registration in `syscall.c`, and `riscv64_syscalls.c` syscall table. Triggered by a user building nsjail on RISC-V hardware hitting `#error "Unsupported architecture"`. | [commit 21b96af0](https://github.com/google/kafel/commit/21b96af0fde8df6d4636d854de690c3ac48da655) |
| 2021-10-11 | [commit 862f8f33](https://github.com/google/kafel/commit/862f8f33b7c9f6a7a1a8ecec7be17e3fd57716ef): "Fix RISCV syscall table" - syscall table correction landed same day as PR #31. | [commit 862f8f33](https://github.com/google/kafel/commit/862f8f33b7c9f6a7a1a8ecec7be17e3fd57716ef) |
| 2021-10-27 | [PR #32](https://github.com/google/kafel/pull/32) merged: "Fix riscv64 judgment" - tightens arch detection from `#ifdef __riscv` (matches any RISC-V variant) to `defined(__riscv) && __riscv_xlen == 64`. | [commit 362ac7b6](https://github.com/google/kafel/commit/362ac7b675d789aeec6321b8d771e7c9d9655832) |
| 2021-10-27 | [PR #33](https://github.com/google/kafel/pull/33) merged: "Modify riscv_len to riscv_xlen" - renames a constant to use standard RISC-V terminology (XLEN = integer register width). | [commit fdc1d644](https://github.com/google/kafel/commit/fdc1d644241e4fdad53b16b3c39e0e4ca49abf9d) |
| 2023-10-04 | Release `20231004` published - the first release containing all three riscv64 PRs. Release `20200831` predates all riscv64 work. | [GitHub Releases](https://github.com/google/kafel/releases) |
| 2025-09-22 | [commit c13ce1fc](https://github.com/google/kafel/commit/c13ce1fce6206150b1b846f27653c889e7cd5921): "riscv64: vibecoded missing syscalls" - direct push by Robert Swiecki adding 390 lines to `riscv64_syscalls.c`, covering Linux 5.x-6.x additions (io_uring 425-427, landlock 444-446, futex_wake/wait/requeue 454-456, lsm_* 459-461, file_getattr/setattr 468-469, and others up to syscall 469). Commit message indicates AI-assisted generation. | [commit c13ce1fc](https://github.com/google/kafel/commit/c13ce1fce6206150b1b846f27653c889e7cd5921) |

**Key contributors to riscv64 work:**

- IEAST (w1031791815@gmail.com) - external community contributor, no identified corporate affiliation. Authored PRs #31, #32, #33.
- happyCoder92 (Wiktor Garbacz, Google) - merged all three PRs and landed the same-day syscall table fix.
- robertswiecki (Robert Swiecki) - September 2025 syscall update.

The port is fully upstream. No downstream patches, no forks carrying riscv64-specific changes, no pending PRs.

---

## 3. Upstream Support Tier

Kafel has no formal tier policy and no PLATFORMS.md or equivalent document. riscv64 is listed alongside x86_64, x86, arm, aarch64, mips64, and m68k in [README.md](https://github.com/google/kafel) as a supported target architecture, with no distinction in support level.

Support is maintained on an ad-hoc basis. There is no release-blocking CI for any architecture, no official riscv64 binaries, and no documented test coverage policy.

**Architecture comparison (support tier evidence):**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in README as supported | Yes | Yes | Yes |
| Syscall table exists | Yes | Yes | Yes |
| Syscall entry count | 382 | 321 | 320 |
| Arch detection macro | Yes | Yes | Yes |
| Public API enum value | Yes | Yes | Yes |
| CI coverage | None | None | None |
| Official prebuilt binaries | None | None | None |
| Packaged in Debian/Ubuntu | No | No | No |

All architectures are on equal informal footing - there is no tiered support model. riscv64 is effectively at parity with arm64 by every available metric.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kafel is a seccomp-BPF policy compiler. Its output is BPF bytecode; it does not generate native machine code. This means there is no JIT backend, no SIMD dispatch, no crypto implementation, no native assembly, and no GC to instrument. RISC-V support requires only two things: an architecture detection macro and a syscall descriptor table.

**RISC-V-specific components:**

| Component | File | Lines / Size | ISA Extensions | Quality | Status |
|---|---|---|---|---|---|
| Arch detection macro | `src/common.h` | ~5 lines | None | Scalar C preprocessor | Complete |
| Syscall descriptor table | `src/syscalls/riscv64_syscalls.c` | 2,236 lines / 46,731 bytes | None | Statically defined C struct array | Complete |
| Runtime registration | `src/syscall.c` | ~8 lines | None | Guarded by `#ifdef AUDIT_ARCH_RISCV64` | Complete |
| Public API enum | `include/kafel.h` | 1 line | None | `KAFEL_TARGET_ARCH_RISCV64 = 1 << 7` | Complete |

No ISA extensions (RVV, Zba, Zbb, Zbc, Zbs, or any SIMD) are used or needed. There are no hand-tuned assembly paths for any architecture. The library is pure portable C throughout.

**Architecture comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch detection macro | Yes | Yes | Yes |
| Syscall table | 382 entries / 53,192 bytes | 321 entries / 46,885 bytes | 320 entries / 46,731 bytes |
| Runtime registration | Yes | Yes | Yes |
| Public API enum | Yes | Yes | Yes |
| SIMD / ISA-extension code | None | None | None |
| JIT backend | None | None | None |
| Assembly (`.S` files) | None | None | None |

riscv64's 320 entries vs arm64's 321 reflects the leaner riscv64 Linux ABI, which has no legacy syscalls and no 32-bit compatibility layer. This is expected and not a gap.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make only. There is no CMake, no autoconf, no configure script, and no `CMakeLists.txt` in the repository.

**Native riscv64 build (on a riscv64 host):**

```
make
```

The arch detection in `src/common.h` uses `defined(__riscv) && __riscv_xlen == 64` which triggers automatically when compiled by a riscv64 compiler.

**Cross-compile from x86_64:**

```
make CC=riscv64-linux-gnu-gcc \
     LD=riscv64-linux-gnu-ld \
     AR=riscv64-linux-gnu-ar \
     OBJCOPY=riscv64-linux-gnu-objcopy \
     OBJDUMP=riscv64-linux-gnu-objdump
```

To force the default target arch when cross-compiling without a riscv64 compiler that sets `__riscv`:

```
make CFLAGS="-DKAFEL_DEFAULT_TARGET_ARCH=KAFEL_TARGET_ARCH_RISCV64"
```

**Required tools:**

- `flex` - generates `lexer.c`/`lexer.h` from `lexer.l`. Pure host tool; cross-compilation is unaffected.
- `bison` >= 3.7.5 (a 3.7.5 regression was fixed in the kafel build in 2021; 3.8+ works). Pure host tool.
- `objcopy`, `objdump`, `ar` - from binutils, used for static library symbol localization.
- C compiler supporting `-std=gnu11` (GCC 4.8+ or Clang 3.3+). [NEEDS VERIFICATION] - no minimum version is documented upstream.

**Build outputs:** `libkafel.so` (dynamic) and `libkafel.a` (static) in the repo root.

**Build flags:**

```
CFLAGS += -std=gnu11 -I${PROJECT_ROOT}include -Wall -Wextra -Werror
```

`make DEBUG=1` adds `-g -ggdb -gdwarf-4`. `make ASAN=1` enables AddressSanitizer. No feature-toggle flags exist.

**Testing under QEMU:** The test binary (`test/tests`) invokes real `seccomp` syscalls via `prctl(PR_SET_SECCOMP, ...)`. Cross-built binaries require QEMU user-mode emulation:

```
qemu-riscv64 -L /usr/riscv64-linux-gnu ./test/tests
```

No Dockerfile, no `.ci/` directory, and no `.github/workflows/` directory exist in the repository. There are no documented known build failures on riscv64.

**Kernel header requirement:** `AUDIT_ARCH_RISCV64` must be present in `<linux/audit.h>`. This requires Linux 4.19+ kernel headers. The syscall table compiles unconditionally; only runtime registration is guarded by `#ifdef AUDIT_ARCH_RISCV64`. On headers older than 4.19, the riscv64 table compiles but is never registered.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Compile and link | Yes | Yes | Yes | None |
| Syscall table coverage | 382 entries | 321 entries | 320 entries | 1 entry vs arm64; reflects ABI, not a bug |
| Arch name lookup ("riscv64", "rv64") | N/A | N/A | Yes | None |
| `kafel_set_target_archs(KAFEL_TARGET_ARCH_RISCV64)` | Yes | Yes | Yes | None |
| BPF policy generation for riscv64 target | Yes | Yes | Yes | None |
| `ON riscv64` arch guard in policy language | N/A | N/A | Yes (added 2025-11-22) [NEEDS VERIFICATION] | None |
| Test suite coverage (arch guard tests) | Yes | Yes | No | Tests in `test/basic.c` cover x86_64 and ARM arch guards; no riscv64-specific test cases |
| SIMD / hardware acceleration | None | None | None | Not applicable |
| Security hardening beyond libc | None | None | None | Not applicable |

**Functional gaps:** The test suite has no riscv64-specific test cases for arch guard policies. This is a test coverage gap, not a functional one - the policy compiler itself is architecture-agnostic in its BPF generation logic.

**Performance gaps:** Data not available: no benchmark suite exists for kafel on any architecture, and the project is a policy compiler whose runtime cost is the kernel BPF JIT, not kafel itself.

**Floating-point semantics:** Not applicable. kafel does not process floating-point data.

---

## 7. CI/CD Infrastructure

The repository has no CI configuration of any kind. There is no `.github/workflows/` directory (GitHub API returns 404 for the path), no `.gitlab-ci.yml`, no `Jenkinsfile`, and no `.cirrus.yml`. This was confirmed by direct API queries.

**CI comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| Build tested in CI | No | No | No |
| Test suite run in CI | No | No | No |
| RISE runner available | No | No | No |
| Hardware tested | Unknown | Unknown | Unknown |

The absence of CI is a project-wide policy gap, not an riscv64-specific deficiency. No architecture has automated testing.

---

## 8. Distribution and Release Status

**Official releases:** Two GitHub releases exist - `20231004` (2023-10-04) and `20200831` (2020-08-31). Both carry zero binary assets. The GitHub Releases API confirms `[0, 0]` asset counts. There are no prebuilt binaries for any architecture on any platform.

**Package availability:**

| Channel | riscv64 Status | Notes |
|---|---|---|
| GitHub Releases | No binaries | Zero assets on all releases |
| PyPI | Not published (HTTP 404) | kafel is not a Python package |
| Debian | Not packaged (HTTP 404 on tracker) | No riscv64 build record |
| Ubuntu 24.04 Noble | Not packaged | Search returns no results |
| Arch Linux RISC-V | Not present | archriscv.felixc.at returns no results |
| RISE wheel builder | Not listed | kafel is not in RISE's 80+ package index |

**What a user must do to get a working riscv64 binary:**

1. Clone the repository: `git clone https://github.com/google/kafel.git`
2. Install build dependencies: `flex`, `bison`, a riscv64 C compiler
3. Run `make` on a riscv64 host or cross-compile with explicit toolchain overrides
4. Link `libkafel.so` or `libkafel.a` into the consumer application

This is the only path for all architectures, not just riscv64.

---

## 9. Dependencies

Kafel is a pure C library with no third-party runtime dependencies. Its dependency surface is minimal.

**Dependency summary:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| flex | Build-time: generates `lexer.c`/`lexer.h` from `lexer.l` | Yes | N/A (host tool) | Packaged in Debian/Ubuntu/Fedora riscv64 | Pure host tool; cross-compilation unaffected |
| bison | Build-time: generates `parser.c`/`parser.h` from `parser.y` | Yes | N/A (host tool) | Packaged in Debian/Ubuntu/Fedora riscv64 | Pure host tool; bison >=3.7.5 required |
| Linux kernel headers (`linux/audit.h`, `linux/seccomp.h`, `linux/filter.h`) | Compile-time: provides `AUDIT_ARCH_RISCV64`, `struct sock_filter`, `SECCOMP_RET_*` constants | Yes (Linux 4.19+ required for `AUDIT_ARCH_RISCV64`) | N/A (headers only) | Included in linux-headers packages for riscv64 | `#ifdef` guard means graceful degradation on old headers |
| libc / POSIX (`sys/queue.h`, stdlib.h, string.h) | Runtime: TAILQ/SLIST macros, memory allocation, string ops | Yes (glibc, musl) | Standard | Standard | No riscv64-specific issues |

There are no JIT backends, SIMD libraries, crypto dependencies, numerics libraries, or compression libraries in kafel's dependency tree. Recursive analysis is not warranted.

**Note on libseccomp:** libseccomp is a separate library in the same problem domain, not a kafel dependency. It is often co-deployed by consumers. libseccomp has had full riscv64 support since v2.5.0 (2020-07-20) and v2.6.1 was released 2026-07-01 with riscv64 included. See `reports/libseccomp.md` for its full status.

---

## 11. Known Bugs and Active Issues

**Closed riscv64-specific issues/PRs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #31](https://github.com/google/kafel/pull/31) | add riscv64 platform | Merged 2021-10-11 | N/A | Initial port |
| [PR #32](https://github.com/google/kafel/pull/32) | Fix riscv64 judgment | Merged 2021-10-27 | Correctness | `__riscv` matched any RISC-V variant; fixed to `__riscv_xlen == 64` |
| [PR #33](https://github.com/google/kafel/pull/33) | Modify riscv_len to riscv_xlen | Merged 2021-10-27 | Minor | Naming correction |

**Open issues (not riscv64-specific):**

| ID | Title | Status | Severity | riscv64 Impact |
|---|---|---|---|---|
| [#19](https://github.com/google/kafel/issues/19) | __X32_SYSCALL_BIT not checked | Open since 2019 | Low | None - x32 ABI gap only |
| [#20](https://github.com/google/kafel/issues/20) | Reduce libkafel.so size | Open since 2019 | Low | None - unrelated to correctness |
| [#41](https://github.com/google/kafel/issues/41) | More open-source examples in Kafei | Open 2025-10-08 | Low | None - documentation request |
| [#43](https://github.com/google/kafel/issues/43) | Release a new version | Open 2026-03-05 | Low | None - release logistics |

**Closed correctness bug of note:**

[Issue #39](https://github.com/google/kafel/issues/39) (closed 2025-09-24): "Assertion failure in `kafel_set_target_archs` caused by incorrect `KAFEL_TARGET_ARCHS_ALL` mask." `KAFEL_TARGET_ARCHS_ALL` was defined as `(1<<8)-1` instead of `(1<<9)-1`, causing an assertion failure when `KAFEL_TARGET_ARCH_M68K` (value `1<<8` = 256) was passed. Found via automated fuzzing. Fixed by [PR #40](https://github.com/google/kafel/pull/40) same day (2025-09-24). This is not riscv64-specific, but the same class of off-by-one in the arch bitmask was in principle a risk for any architecture near a boundary. The fix is confirmed merged. `KAFEL_TARGET_ARCH_RISCV64 = 1 << 7` is within the corrected mask.

**Zero open riscv64-specific issues or bugs exist** as of the research date.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. The riscv64 port is complete, fully merged, and at parity with arm64 by every available metric.

**Organizational blockers:** None. The project is informally maintained with an open acceptance policy for architecture ports. The riscv64 port was merged same-day from an external contributor.

**Stated objections:** None found in issue tracker or PR comments.

**Acceptance probability for future riscv64 patches:** High. The precedent of accepting a 1,770-line riscv64 addition from an unaffiliated external contributor with no review comments establishes that the project will accept well-formed riscv64 work.

**Ongoing maintenance risk:** The project has no CI. Any regression in riscv64 support would go undetected unless a user reported it. The September 2025 "vibecoded" syscall update - AI-assisted generation of 390 lines of syscall entries with no CI validation - carries a non-zero correctness risk for syscall argument descriptors. However, incorrect argument descriptors produce incorrect BPF policies, not compiler crashes, so the failure mode is detectable by end-to-end testing of consumer policies.

---

## 13. Investment Analysis

RISE has no involvement with kafel. The riscv64 port is already complete. No functional enablement work is needed.

### 13.1 Functional Enablement

No work required. riscv64 support is complete: arch detection, full 320-entry syscall table, runtime registration, public API enum, all merged upstream.

The one functional gap is the test suite: `test/basic.c` has arch-guard tests for x86_64 and ARM but none for riscv64. Adding riscv64 arch-guard test cases would verify the policy compiler correctly generates riscv64-targeted BPF. Estimated effort: 1-2 person-days.

### 13.2 Performance Optimization

Data not available: no benchmark suite exists for kafel on any architecture. Performance optimization is not applicable - kafel is a policy compiler whose output is BPF bytecode; it has no SIMD, no JIT, and no hot path that benefits from RISC-V ISA extensions.

### 13.3 CI/CD Infrastructure

The project has no CI on any architecture. Adding riscv64 CI would require adding the project's first-ever CI configuration. The simplest path is a GitHub Actions workflow using QEMU user-mode emulation for riscv64, building and running `test/tests`. This is a low-complexity addition that would benefit all architectures simultaneously.

Estimated effort: 1-2 person-days.

### 13.4 Ecosystem Enablement

Kafel is a C library distributed source-only. It has no Python, npm, Maven, or OCI package ecosystem. No ecosystem enablement work applies.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 arch-guard test cases to `test/basic.c` | 0.25 | External contributor / community | Low |
| CI/CD | Add GitHub Actions workflow for build + test on riscv64 via QEMU | 0.25 | External contributor / community | Medium |
| Performance | No work applicable | - | - | - |
| Ecosystem | No work applicable | - | - | - |

Total investment required for production-ready riscv64 status: approximately 0.5 person-weeks, covering test coverage and CI only. The core port is complete and no investment is needed for functional correctness.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [kafel repository (google/kafel)](https://github.com/google/kafel)
- [PR #31: add riscv64 platform](https://github.com/google/kafel/pull/31)
- [PR #32: Fix riscv64 judgment](https://github.com/google/kafel/pull/32)
- [PR #33: Modify riscv_len to riscv_xlen](https://github.com/google/kafel/pull/33)
- [commit 21b96af0: add riscv64 platform (merge)](https://github.com/google/kafel/commit/21b96af0fde8df6d4636d854de690c3ac48da655)
- [commit 862f8f33: Fix RISCV syscall table](https://github.com/google/kafel/commit/862f8f33b7c9f6a7a1a8ecec7be17e3fd57716ef)
- [commit 362ac7b6: Fix riscv64 judgment (merge)](https://github.com/google/kafel/commit/362ac7b675d789aeec6321b8d771e7c9d9655832)
- [commit fdc1d644: Modify riscv_len to riscv_xlen (merge)](https://github.com/google/kafel/commit/fdc1d644241e4fdad53b16b3c39e0e4ca49abf9d)
- [commit c13ce1fc: riscv64: vibecoded missing syscalls](https://github.com/google/kafel/commit/c13ce1fce6206150b1b846f27653c889e7cd5921)
- [Issue #19: __X32_SYSCALL_BIT not checked](https://github.com/google/kafel/issues/19)
- [Issue #20: Reduce libkafel.so size](https://github.com/google/kafel/issues/20)
- [Issue #39: Assertion failure in kafel_set_target_archs (closed)](https://github.com/google/kafel/issues/39)
- [Issue #41: More open-source examples in Kafei](https://github.com/google/kafel/issues/41)
- [Issue #43: Release a new version](https://github.com/google/kafel/issues/43)
- [kafel GitHub Releases](https://github.com/google/kafel/releases)
- [RISE Project member list](https://riseproject.dev)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)