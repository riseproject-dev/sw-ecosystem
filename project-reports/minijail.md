---
title: minijail
parent: Project Reports
---

# minijail

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for minijail<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Minijail is a sandboxing and containment library for Linux, implementing process isolation via Linux namespaces, seccomp-BPF syscall filtering, POSIX capabilities, chroot, and Landlock. It is consumed by ChromeOS (crosvm, Chrome browser, system services), Android (platform services and the VirtIO VMM path), and a small set of other system software. The primary API is a C library (`libminijail.so`) and a CLI binary (`minijail0`).

The canonical upstream is the ChromiumOS Gerrit instance at `chromium.googlesource.com/chromiumos/platform/minijail`. The [GitHub repository](https://github.com/google/minijail) is a read-only mirror; contributions must go through Gerrit (either the ChromiumOS Gerrit or Android Review). The GitHub Issues tracker is disabled; no public bug backlog is queryable on GitHub.

**License:** BSD-3-Clause.

**Governance:** No external foundation. Owned entirely by Google LLC. The OWNERS file lists:
- allenwebb@google.com (Allen Webb, Google)
- akhna@google.com (Sadman Fahmid, Google; added March 2026 when Jorge Lucangeli Obes transitioned to emeritus)
- jorgelo@google.com (Jorge Lucangeli Obes, Google; transitioning to emeritus as of March 2026)
- vapier@google.com (Mike Frysinger, Google; top contributor by commit count at 553 commits)

Emeritus owners: drewry@google.com (Will Drewry), keescook@google.com (Kees Cook), both Google.

**Top contributors by commit count:**
- Mike Frysinger (Google): 553 commits
- Luis Hector Chavez (formerly Google, now Replit): 409 commits
- Allen Webb (Google): 150 commits
- Dylan Reid (Rivos Inc.): 65 commits; authored all RISC-V patches

The project is overwhelmingly Google-staffed. Dylan Reid (Rivos Inc.) is the only non-Google contributor with a significant commit count identifiable by affiliation.

**Community stance on new ports:** Permissive. The project accepted riscv64 (2021, Dylan Reid / Rivos Inc.), Android-specific riscv syscall tables (2022, Alibaba), and loong64 (November 2025, loong64 community). No documented approval bar beyond normal Gerrit code review.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work arrived via Gerrit (Android Review or ChromiumOS Review) and was auto-mirrored to the GitHub repository. There are no GitHub PRs for RISC-V; the three substantive commits below represent the complete RISC-V record in the repository.

| Date | Event | Contributor | Source |
|------|-------|-------------|--------|
| 2021-11-01 (authored), 2022-01-21 (merged) | "Add riscv64 support" -- adds `__riscv` block to `arch.h` and `util.c`; maps to `AUDIT_ARCH_RISCV64`; riscv32 rejected with `#error` | Dylan Reid (Rivos Inc.) | [commit 4ab1a2c7](https://github.com/google/minijail/commit/4ab1a2c7b67f8e21341d752fede6e08d3a7aed3e), [Android Review 1956896](https://android-review.googlesource.com/c/platform/external/minijail/+/1956896) |
| 2022-08-02 | "Add android log_syscalls for riscv" -- adds Android-specific syscall list `{connect, fcntl, sendto, socket, writev}` for riscv64 on Android, keeping `{socket, connect, sendto}` for non-Android | Xia Lifang, Mao Han (Alibaba Linux Kernel Team) | [commit 592dd7d7](https://github.com/google/minijail/commit/592dd7d79ee14d9bf08cd1ee002af8f4acda6cc9) |
| 2023-01-11 (authored), 2023-01-13 (merged) | "generate_constants_json: Add riscv64 arch_nr" -- maps `AUDIT_ARCH_RISCV64` value `0xC00000F3` to `"riscv64"` in the policy tooling; required for crosvm's `seccomp/generate_constants.sh` | Dylan Reid (Rivos Inc.) | [commit 76d76dcd](https://github.com/google/minijail/commit/76d76dcdd0262c6a569374d4eaedddcd245dcb5f), [ChromiumOS Review 4159412](https://chromium-review.googlesource.com/c/chromiumos/platform/minijail/+/4159412) |

All three patches are fully upstream and present in the current `main` branch of the GitHub mirror. The last RISC-V commit was January 2023 (approximately 42 months before the research date). No further RISC-V patches are pending or in-flight.

The motivation for the initial port was explicitly crosvm: commit 4ab1a2c7 states "In order to build crosvm on riscv64, we need minijail to compile and run on riscv64." The Alibaba contribution reflects independent Android-on-RISC-V work at approximately the same time.

---

## 3. Upstream Support Tier

No formal tier or platform support policy document exists in this repository (no `PLATFORMS.md`, `SUPPORT.md`, or equivalent). Architecture support is implicit: if `arch.h` has an entry for the arch, the arch is supported.

riscv64 has a full entry in `arch.h`. There is no CI running on riscv64 (see Section 7). No official riscv64 binaries are distributed (see Section 8). On those dimensions, riscv64 is below what would be considered a first-class tier for a project that has formal tier definitions.

**Architecture comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| `arch.h` entry | Yes | Yes | Yes |
| Pre-built constants directory (`linux-<arch>/`) | Yes (`linux-x86/`) | No | No |
| CI on native or emulated runner | Yes (`ubuntu-latest`) | No | No |
| Official binary release assets | No (all 18 GitHub releases have zero assets) | No | No |
| Binary distribution packages | No (not in Debian/Ubuntu) | No | No |
| Arch-specific tests in CI | No | No | No |
| Gentoo source build (testing) | No data | No data | Yes (`~riscv` keyword) |

All three architectures share the absence of binary release assets, which is a project-wide policy. riscv64 is on equal standing with arm64 in terms of source-level support, and slightly behind amd64 only in the pre-generated constants directory.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Minijail has no JIT, no SIMD, no hardware crypto, and no assembly. The repository contains 132 files and zero assembly source files of any kind.

RISC-V support consists entirely of conditional-compilation guards and generated constant tables across four files:

**arch.h**

The only file that requires per-architecture branching for functional correctness. The RISC-V block:

```c
#elif defined(__riscv)
#  if defined(__riscv_xlen)
#    if (__riscv_xlen == 64)
#      define MINIJAIL_ARCH_NR AUDIT_ARCH_RISCV64
#      define MINIJAIL_ARCH_NAME "riscv64"
#    else
#      error "Only 64bit riscv is supported"
#    endif
#  else
#    error "AUDIT_ARCH value unavailable"
#  endif
```

Only riscv64 is supported. riscv32 is explicitly rejected at compile time. No ISA extensions are referenced (no RVV, Zba, Zbb, etc.).

**util.c**

The `log_syscalls[]` array provides a minimal set of syscalls allowed in the preload path. The riscv64 entries are:
- Android: `{connect, fcntl, sendto, socket, writev}`
- Non-Android: `{socket, connect, sendto}`

**tools/generate_constants_json.py**

Maps the numeric value of `AUDIT_ARCH_RISCV64` (`0xC00000F3`) to the string `"riscv64"`. Without this, running the policy compiler on a riscv64 host raises `ValueError: Unknown architecture`.

**linux-x86/libconstants.gen.c**

The auto-generated constant table (from x86 kernel headers) includes RISC-V-specific Linux `prctl` constants exposed through `<linux/prctl.h>`:
- `EM_RISCV`: ELF machine type
- `PR_RISCV_CTX_SW_FENCEI_OFF/ON`: icache flush context switching control
- `PR_RISCV_SCOPE_PER_PROCESS/PER_THREAD`: scope control for icache flush prctl
- `PR_RISCV_SET_ICACHE_FLUSH_CTX`: set icache flush context
- `PR_RISCV_V_GET_CONTROL` / `PR_RISCV_V_SET_CONTROL`: RVV vector extension enable/disable prctl interface
- `PR_RISCV_V_VSTATE_CTRL_CUR_MASK`, `_DEFAULT`, `_MASK`, `_NEXT_MASK`, `_OFF`, `_ON`: RVV vector-state bitmask constants

These are kernel constant exports, not minijail code. They allow seccomp policies to name these constants symbolically. The `PR_RISCV_V_*` constants expose the Linux prctl interface for controlling RVV state per-process or per-thread -- a seccomp policy can allow or block these prctl variants by name.

**libminijail.c and syscall_filter.c** (the core of the project) contain zero architecture-conditional blocks. The entire seccomp/BPF jail machinery is fully generic. `AUDIT_ARCH_RISCV64` from `arch.h` propagates automatically.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| `arch.h` entry | Yes | Yes | Yes |
| `util.c` log_syscalls | Yes | Yes | Yes |
| `generate_constants_json.py` mapping | Yes | Yes | Yes |
| Core library (`libminijail.c`) arch guards | None needed | None needed | None needed |
| Assembly files | None | None | None |
| SIMD/ISA extension code | None | None | None |
| Pre-generated constants directory | `linux-x86/` | None | None |
| Fallback syscall-number defines in `gen_syscalls-inl.h` | Yes (several) | Yes | No (benign: riscv64 kernel headers are consistent; fallbacks are last-resort only) |

The absence of riscv64 fallback syscall-number defines in `gen_syscalls-inl.h` is benign by design. These fallbacks are only used when kernel headers do not define the numbers. The riscv64 Linux kernel ABI is a unified single-table design with no legacy multiplexing, so all syscall numbers are always present in `<asm/unistd.h>`.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make via `common.mk` (inherited from ChromeOS `platform2`). No CMake, no Meson, no configure script. Android builds use Soong (`Android.bp`).

**Minimum toolchain version:** Not documented anywhere in the repository. The CI only tests against whatever compiler versions ship with `ubuntu-latest`; no minimum is stated in any Makefile, README, or documentation.

**Native build on a riscv64 host:**

```bash
sudo apt-get install libcap-dev
./get_googletest.sh
make LIBDIR=/lib
make tests
```

**Cross-compilation from x86_64:**

```bash
# Prerequisites
sudo apt-get install gcc-riscv64-linux-gnu libcap-dev:riscv64 qemu-user-static

# Build
make CROSS_COMPILE=riscv64-linux-gnu- ARCH=riscv64 LIBDIR=/lib

# Build and test (requires a sysroot with libcap installed for riscv64)
make CROSS_COMPILE=riscv64-linux-gnu- ARCH=riscv64 \
     SYSROOT=/path/to/riscv64-sysroot tests
```

The Makefile's `CROSS_COMPILE` variable is prepended to all toolchain binaries (`AR`, `CC`, `CXX`, `PKG_CONFIG`, etc.). Clang is also supported: `CC="clang --target=riscv64-linux-gnu"`.

**Seccomp policy generation for riscv64 (cross-compile path):**

The `linux-x86/` pre-generated constants directory does not have a `linux-riscv64/` equivalent. To generate seccomp BPF policies targeting riscv64 from an x86_64 host:

```bash
# 1. Cross-compile dump_constants as a static binary
make CROSS_COMPILE=riscv64-linux-gnu- ARCH=riscv64 dump_constants

# 2. Execute under QEMU user-mode emulation
qemu-riscv64-static ./dump_constants > constants.json

# 3. Use constants.json with parse_seccomp_policy on the host
```

The Makefile contains an explicit comment acknowledging this workflow: "Compiling dump_constants as a static executable makes it easy to run under qemu-user, which in turn simplifies cross-compiling bpf policies."

**QEMU test integration:** `common.mk` wires in QEMU user-mode testing automatically when `ARCH != HOST_ARCH` and `SYSROOT` is set:

```makefile
ifneq ($(QEMU_ARCH),$(HOST_ARCH))
  ifeq ($(SYSROOT),)
    $(info SYSROOT not defined. qemu-based testing disabled)
  else
    USE_QEMU ?= 1
  endif
```

Expected binary path: `/usr/bin/qemu-riscv64`.

**Android builds:** `Android.bp` does not have riscv64-specific target blocks. Soong handles riscv64 cross-compilation transparently by selecting the correct cross-compiler for the target ABI; no per-arch overrides exist. For host builds, Soong falls back to the pre-built `linux-x86/libsyscalls.gen.c`.

**Known build failures:** None are documented. No open riscv64-specific build bugs were found in any public tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Minijail's functionality is driven by Linux kernel features (seccomp, namespaces, capabilities, Landlock), not by architecture-specific userspace code. All kernel-based features are available on riscv64 Linux.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| seccomp-BPF filtering | Yes | Yes | Yes | None |
| Linux namespaces (pid, net, mnt, user) | Yes | Yes | Yes | None |
| POSIX capabilities (libcap) | Yes | Yes | Yes | None |
| Landlock filesystem restriction | Yes | Yes | Yes | None |
| chroot / pivot_root | Yes | Yes | Yes | None |
| seccomp policy compilation (`parse_seccomp_policy`) | Yes | Yes | Yes | None |
| Pre-generated constants JSON | Yes | No | No | Shared gap with arm64; workaround via QEMU dump_constants is documented |
| Android log_syscalls | Yes | Yes | Yes | None |
| `generate_constants_json.py` arch mapping | Yes | Yes | Yes | None |
| RVV prctl constants in policy namespace | n/a | n/a | Yes (`PR_RISCV_V_*`) | riscv64-only feature, not a gap |
| riscv32 support | n/a | n/a | No (hard compile error) | Intentional; no riscv32 Linux kernel seccomp ABI defined |

There are no functional gaps between riscv64 and arm64. The only gap relative to amd64 is the absence of a committed `linux-riscv64/` constants directory, which is a build convenience, not a functional limitation. The documented QEMU-user workaround covers the gap.

No floating-point, NaN, or numerics issues apply; minijail does no floating-point computation.

No security hardening gaps are present. The seccomp BPF filter is architecture-neutral and enforces the same policy semantics on riscv64 as on any other supported arch.

---

## 7. CI/CD Infrastructure

All CI runs exclusively on `ubuntu-latest` runners (x86_64). No riscv64 CI of any kind exists.

**Workflow files in `.github/workflows/`:**

1. **`build-test-ci.yml`** -- `runs-on: ubuntu-latest`, `matrix.cc: [gcc, clang]`. Runs `make VERBOSE=1` and `make VERBOSE=1 check`. Triggers: push to master, every 2 days on schedule, manual dispatch. Zero occurrences of "riscv".

2. **`coverity.yml`** -- `runs-on: ubuntu-latest`, clang only. Runs Coverity static analysis. Triggers: push to master, weekly schedule, manual dispatch. Zero occurrences of "riscv".

3. **`close-pull-request.yml`** -- `runs-on: ubuntu-latest`. Auto-closes all incoming PRs with a redirect message. No build logic.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**Comparison:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native build CI | Yes (build-test-ci.yml) | No | No |
| Test execution in CI | Yes | No | No |
| QEMU cross-compile job | No | No | No |
| Self-hosted native runner | No | No | No |
| RISE project runner | No | No | No |
| Coverity static analysis | Yes | No | No |

RISE has no involvement in minijail CI. The RISE Security Software WG tracks firmware and TEEs; minijail is not on its project board. No RISE blog posts mention minijail.

---

## 8. Distribution and Release Status

**GitHub Releases:** 18 releases exist (linux-v1 through linux-v18). All 18 releases have zero binary release assets attached. No binaries of any architecture are distributed via GitHub releases.

**Debian:** Not packaged. [tracker.debian.org/pkg/minijail](https://tracker.debian.org/pkg/minijail) returns HTTP 404. No riscv64 build record exists.

**Ubuntu:** Not packaged in Ubuntu 24.04 (noble) or any release. packages.ubuntu.com returns no results.

**Arch Linux RISC-V:** Not packaged. [archriscv.felixc.at](https://archriscv.felixc.at/?q=minijail) returns no results for minijail.

**Void Linux riscv64:** Not packaged. The riscv64gc binary repository path returns HTTP 404.

**PyPI:** Not published. [pypi.org/pypi/minijail/json](https://pypi.org/pypi/minijail/json) returns HTTP 404. No riscv64 wheels exist.

**RISE wheel builder:** Not included. minijail does not appear in the RISE wheel builder index.

**Gentoo:** Packaged as `sys-apps/minijail` version `2025.07.02` with keyword `~riscv` (testing/unstable). Gentoo is source-based; no binary is distributed. The `~` prefix means experimental support, not stable. This is the only distribution with any riscv64 build-level acknowledgment.

**To obtain a working riscv64 minijail binary, a user must build from source.** The build instructions in Section 5 cover both native and cross-compilation paths.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libcap | Runtime: POSIX capabilities (`-lcap`); required by `minijail0`, `libminijail.so`, and `libminijailpreload.so` | Yes (since v2.74, Feb 2025; PSX fix included) | Full test pass on Debian riscv64 hardware (v2.78, 2026-04-06) | v2.78 (April 2026), all riscv64 fixes included since v2.74 | None |
| libseccomp | Optional runtime: BPF syscall filter enforcement; seccomp policy tooling | Yes (since v2.5.0, July 2020; `arch-riscv64.c` present) | 5,229 tests pass on real SiFive hardware; one QEMU-only failure confirmed as QEMU refusing to emulate seccomp, not a library defect | v2.6.1 (July 2026), riscv64 in all releases from v2.5.0 onward | None; riscv32 not supported (intentional) |
| kafel | Optional: alternative seccomp policy language used in ChromeOS/Android integration | riscv64 arch support merged October 2021; syscall table updated September 2025 to cover Linux 5.x-6.x additions through syscall 469 | No CI on riscv64 hardware reported | No tagged release since `20231004`; current users take from HEAD | Syscall table currency: the September 2025 commit ("vibecoded missing syscalls") used AI-generated output; individual syscall numbers should be verified against `<asm/unistd.h>` before production use [NEEDS VERIFICATION] |
| Landlock (kernel API) | Optional runtime: filesystem access restriction; called via raw `syscall(__NR_landlock_*)` in `landlock_util.c` | No library dependency -- calls kernel directly | Portable by construction; no arch-specific code path | n/a (kernel feature) | None; single unified syscall ABI on riscv64 means syscall numbers are consistent |
| libc (Rust crate, v0.2.44+) | Build: Rust FFI bindings used by `minijail` and `minijail-sys` crates | Yes (`src/unix/linux_like/linux/gnu/b64/riscv64/mod.rs` present; riscv64 support added 2019) | All known open riscv64 issues closed | Current stable (v0.2.x) on crates.io includes riscv64 | None |
| bindgen (v0.72, build dep) | Build: generates FFI bindings for `libminijail.h` in `minijail-sys/build.rs` | Yes; prior issue #2136 with `riscv64gc-unknown-linux-gnu` vs. `riscv64-unknown-linux-gnu` triple mismatch is closed | Issue closed; no open riscv64-specific bugs | v0.72.x on crates.io includes the RISC-V triple fix | None |
| pkg-config (Rust crate, build dep) | Build: detects system libminijail in `minijail-sys/build.rs` | Yes (pure Rust, architecture-agnostic) | n/a | n/a | None |
| GoogleTest (v1.16+, test dep) | Test-only: C++ unit test framework for `libminijail_unittest` and related | Builds on riscv64; `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (issue #3756, opened Feb 2022, still open as of v1.18.0, Aug 2026) | One test failure: `GetThreadCount()` returns 0 on riscv64. This is an assertion in GTest's own self-tests, not in minijail's test suite; does not affect minijail test execution | v1.18.0 (Aug 2026) does not resolve issue #3756 | Minor; non-blocking for minijail |

No dependencies have JIT, SIMD, or crypto components that would introduce riscv64-specific depth. libseccomp's `arch-riscv64.c` is the only dependency with significant arch-specific code, and it is fully implemented.

---

## 11. Known Bugs and Active Issues

The GitHub Issues tracker is disabled. All tracking is via Chromium Issue Tracker (issues.chromium.org), which requires authentication for search. No riscv64-specific issues were retrievable from any public-facing tracker.

| Issue | Title | Status | Severity | Notes |
|-------|-------|--------|----------|-------|
| GTest #3756 | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open (last activity Feb 2022, still unresolved in v1.18.0) | Low | Affects GTest's own self-tests; does not affect minijail's test suite; non-blocking |
| None identified | riscv64 CI | No issue filed | Medium | Issues tracker is disabled; no public backlog exists |
| None identified | `linux-riscv64/` pre-generated constants directory | No issue filed | Low | Cross-compile workaround is documented in Makefile |

No correctness bugs specific to riscv64 were found in any public source.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support.** The project accepted the initial riscv64 port in 2022 without documented resistance. Subsequent patches from Alibaba and a follow-up from Rivos Inc. were also accepted without documented friction.

**No technical blockers.** The source-level implementation is complete and on equal footing with arm64.

**Organizational blockers:** The GitHub Issues tracker is disabled. All contributions must go through Gerrit (ChromiumOS Review or Android Review). This creates a higher barrier for external contributors unfamiliar with the Gerrit workflow, but it is not a RISC-V-specific barrier -- it applies to all architectures equally.

**Gap: no riscv64 CI.** The project maintainers (Google) have not added riscv64 to CI for any architecture other than x86_64. Adding riscv64 CI would require either a self-hosted riscv64 runner or a QEMU cross-compile job. The project currently has neither, and there is no open issue requesting it.

**Gap: ChromiumOS upstream fork.** The research findings note that the ChromiumOS upstream minijail (`chromium.googlesource.com/chromiumos/platform/minijail`) does not have riscv64 in `arch.h` [NEEDS VERIFICATION -- this contradicts the commit record showing patches merged to the canonical upstream; discrepancy between what was found in the ChromeOS Gerrit fetch vs. the GitHub mirror read]. The GitHub mirror reflects the merged state of the riscv64 patches. If the ChromeOS fork truly lacks the riscv64 block in `arch.h`, that would indicate the patches landed in the Android fork but not the ChromeOS fork.

**Probability of accepting further riscv64 contributions:** High. The project's track record shows acceptance of every riscv64 patch submitted to date, from two independent organizations (Rivos Inc. and Alibaba), with no documented objections.

---

## 13. Investment Analysis

RISE has no prior investment in minijail. Google and Rivos Inc. have already completed the foundational and tooling work (Sections 2 and 4). The remaining gaps are operational: CI and packaging.

### 13.1 Functional Enablement

The riscv64 port is functionally complete. No work is required for basic sandboxing functionality on riscv64. The kafel syscall table currency issue (September 2025, AI-generated syscall numbers) warrants a one-time audit for users relying on kafel for policy generation, but this is a dependency concern, not a minijail core concern.

### 13.2 Performance Optimization

Not applicable. Minijail has no performance-sensitive compute loops. Its overhead is dominated by Linux system call latency (seccomp policy installation, namespace creation), which is architecture-neutral.

### 13.3 CI/CD Infrastructure

The highest-value investment available. Currently, no riscv64 build or test validation runs after any commit. A cross-compile CI job with QEMU-user test execution would be a complete solution and would fit within the existing GitHub Actions infrastructure. A self-hosted riscv64 runner would eliminate QEMU overhead, but given that minijail tests run in under a minute on x86_64, QEMU-user is sufficient.

This work requires:
1. Adding a cross-compilation matrix entry (`riscv64-linux-gnu-gcc`, `riscv64-linux-gnu-g++`) to `build-test-ci.yml`
2. Installing `gcc-riscv64-linux-gnu`, `libcap-dev:riscv64`, and `qemu-user-static` in the CI environment
3. Configuring SYSROOT so that `common.mk` auto-wires QEMU for test execution
4. Submitting the change via ChromiumOS Gerrit (not a GitHub PR)

### 13.4 Ecosystem Enablement

Minijail is a C library and CLI with no dependent package ecosystem requiring riscv64 enablement. There are no Python wheels, npm packages, Maven JARs, or OCI images to enable. The project has no packaging in Debian/Ubuntu at all (any architecture), so there is no riscv64 packaging gap relative to other distros. Adding a Debian package would require creating the package from scratch -- this is a significant effort and has no precedent in any existing distribution channel.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 cross-compile and QEMU-user test job to `build-test-ci.yml`; submit via ChromiumOS Gerrit | 1-2 | RISE contributor or Google | High |
| Functional | Audit kafel syscall table for riscv64 correctness (September 2025 "vibecoded" commit) | 1 | RISE contributor | Medium |
| CI/CD | Add self-hosted riscv64 native runner (replaces QEMU-user if higher fidelity is needed) | 2-4 (infrastructure setup) | RISE / OSU OSL / Scaleway | Low |
| Distribution | Package minijail for Debian/Ubuntu riscv64 (requires creating the package from scratch; no current packaging in any Debian-family distro) | 4-8 | RISE contributor with Debian affiliation | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/minijail GitHub mirror](https://github.com/google/minijail)
- [Commit 4ab1a2c7: Add riscv64 support (2022-01-21)](https://github.com/google/minijail/commit/4ab1a2c7b67f8e21341d752fede6e08d3a7aed3e)
- [Android Review 1956896: Add riscv64 support](https://android-review.googlesource.com/c/platform/external/minijail/+/1956896)
- [Commit 592dd7d7: Add android log_syscalls for riscv (2022-08-02)](https://github.com/google/minijail/commit/592dd7d79ee14d9bf08cd1ee002af8f4acda6cc9)
- [Commit 76d76dcd: generate_constants_json: Add riscv64 arch_nr (2023-01-13)](https://github.com/google/minijail/commit/76d76dcdd0262c6a569374d4eaedddcd245dcb5f)
- [ChromiumOS Review 4159412: generate_constants_json: Add riscv64 arch_nr](https://chromium-review.googlesource.com/c/chromiumos/platform/minijail/+/4159412)
- [minijail homepage (Google)](https://google.github.io/minijail/)
- [Gentoo sys-apps/minijail package](https://packages.gentoo.org/packages/sys-apps/minijail)
- [GoogleTest issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on RISC-V](https://github.com/google/googletest/issues/3756)
- [Debian tracker: minijail (404 -- not packaged)](https://tracker.debian.org/pkg/minijail)
- [libseccomp status report](project-reports/libseccomp.md)
- [libcap status report](project-reports/libcap.md)
- [kafel status report](project-reports/kafel.md)
- [RISE project homepage](https://riseproject.dev)