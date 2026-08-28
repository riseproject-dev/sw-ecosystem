---
title: VIXL
parent: Project Reports
categories:
  - libraries
  - android
---

# VIXL

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for VIXL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

VIXL is a runtime code generation library providing an assembler, disassembler, and AArch64 simulator for the ARM ISA family. It supports three ISAs: AArch64 (A64), AArch32 (A32), and Thumb-32 (T32). The README explicitly states these as the full scope; RISC-V is not mentioned.

The project originated at Arm Ltd. and was open-sourced in collaboration with Linaro. For many years the canonical upstream was [github.com/Linaro/vixl](https://github.com/Linaro/vixl). In April 2026, the Linaro GitHub repository was frozen and the project migrated to [gitlab.arm.com/runtimes/vixl](https://gitlab.arm.com/runtimes/vixl), created 2025-09-20. The GitHub mirror README states: "VIXL is now maintained in the repository at the Arm GitLab site. This repository is no longer updated." The GitLab repo has 1,135 commits and 13 tags as of the research date.

**License:** BSD 3-Clause, copyright Arm Limited.

**Corporate maintainers (from Linaro GitHub commit history):**
- mmc28a -- most active committer on recent releases including 8.0.0 [NEEDS VERIFICATION: employer not confirmed from public profile]
- chris-jones-arm (Chris Jones) -- Arm Ltd., Cambridge
- MatthewARM (Matthew Bentham) -- @ARM-software
- jacobbramley -- frequent committer, CHERI-related repos consistent with Arm Cambridge [NEEDS VERIFICATION]

The bug-report contact address is `vixl@arm.com`, confirming Arm Ltd. as the effective corporate owner.

**Android AOSP maintainers** (from OWNERS file in the AOSP mirror): ngeoffray@google.com, rpl@google.com, skvadrik@google.com -- Google employees maintaining the AOSP copy.

**Community culture on new ports:** No public discussion, issue, or mailing-list post proposing a RISC-V port was found anywhere -- not on GitLab, the frozen GitHub mirror, or any web source. The project has no formal tier policy and no documented process for adding a new ISA backend. The move to gitlab.arm.com reinforces that VIXL is now a pure Arm Ltd. internal project. There is no indication that Arm intends to add RISC-V support.

VIXL has no involvement with the RISE Project. All 27 RISE blog posts (May 2024 through June 2026) were checked; zero mention VIXL. VIXL does not appear in any RISE-funded project list or working group.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Never | No RISC-V commit exists at any point in the project history | 1,135-commit log scan, [Linaro/vixl](https://github.com/Linaro/vixl) and GitLab |
| Never | No RISC-V issue filed in GitLab tracker (1 total issue, ARM-only topic) | [gitlab.arm.com/runtimes/vixl issues](https://gitlab.arm.com/runtimes/vixl/-/issues) |
| Never | No RISC-V merge request in GitLab (34 total MRs, all ARM-specific) | [gitlab.arm.com/runtimes/vixl MRs](https://gitlab.arm.com/runtimes/vixl/-/merge_requests) |
| Never | No RISC-V source file in any GitHub mirror (bwasti/vixl, BillBai/vixl) | GitHub code search |

There is no port. There are no key contributors for a RISC-V effort. Nothing is upstream because no work has started.

---

## 3. Upstream Support Tier

VIXL has no published tier policy. The evidence from CI and release artifacts defines the de-facto tiers:

| Platform | CI | Official binary | Simulator | Status |
|----------|----|-----------------|-----------|--------|
| amd64 | Yes -- GitLab runner | Source tarball only | AArch64 sim runs on amd64 | Fully supported |
| arm64 | Yes -- GitLab runner | Source tarball only | AArch64 sim runs natively | Fully supported |
| riscv64 | None | None upstream | Not applicable | Not a supported platform |

The `.gitlab-ci.yml` (read directly from [gitlab.arm.com/runtimes/vixl/-/raw/main/.gitlab-ci.yml](https://gitlab.arm.com/runtimes/vixl/-/raw/main/.gitlab-ci.yml)) defines a single `test` stage with one job (`run-vixl-tests`) running on a parallel matrix of three configurations using runner tags `amd64` and `arm64`. The string "riscv" does not appear in the file.

Debian and Ubuntu ship `libvixl5` and `libvixl-dev` for riscv64 (see Section 8), but this is distro packaging policy, not upstream tier assignment.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

VIXL is organized by target ISA. The `src/` directory contains only `aarch64/` (31 files) and `aarch32/` (14 files). There is no `src/riscv/` directory. All architecture-specific components are missing for RISC-V.

| Component | amd64 (host) | arm64 (host+target) | riscv64 |
|-----------|-------------|---------------------|---------|
| Assembler (A64) | Generates ARM code | Generates ARM code | Missing -- no backend |
| Assembler (A32/T32) | Generates ARM code | Generates ARM code | Missing -- no backend |
| Disassembler | Full | Full | Missing |
| AArch64 Simulator | Full (runs ARM binaries on x86) | Not needed (native) | Missing |
| CPU feature detection | ARM features only | ARM features only | Missing |
| SVE/SVE2/SME support | Generates ARM code | Generates ARM code | Missing |
| Pointer authentication | Generates ARM code | Generates ARM code | Missing |

The `src/cpu-features.h` header lists only ARM CPU feature flags (NEON, SVE, SVE2, SME, PAuth, LSE, etc.); no RISC-V extension flags (RVV, Zba, Zbb, Zbc, etc.) appear.

VIXL is not a general-purpose JIT framework. Its API surface is Arm-specific: registers, instruction encodings, and operand types are all defined in terms of AArch64/AArch32 concepts. Adding RISC-V would require a complete new backend with no code reuse from the existing ISA implementations.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** SCons. There are no `CMakeLists.txt`, toolchain files, or Dockerfiles. No `BUILDING.md`, `docs/cross-compilation.md`, or equivalent cross-compilation guide exists. Build documentation is in `README.md` and `doc/aarch64/getting-started-aarch64.md`.

Build command:
```
scons [target=aarch64|a64|aarch32|a32|t32] [mode=debug|release] [simulator=aarch64|none] [compiler=g++|clang++] [std=c++17]
```

**Host architecture detection** (from `tools/util.py`, read via AOSP mirror):
```python
if "__x86_64__" in directives: return "x86_64"
elif "__i386__"  in directives: return "i386"
elif "__arm__"   in directives: return "aarch32"
elif "__aarch64__" in directives: return "aarch64"
else: raise Exception("Unsupported architecture")
```

Running SCons with a riscv64 cross-compiler (`CXX=riscv64-linux-gnu-g++`) will raise `Exception("Unsupported architecture")` immediately and abort. Cross-compilation to riscv64 is not functional without a source patch to `GetHostArch()`.

**Compiler minimum versions (from README.md):**
- GCC 4.8+ (GCC 4.8 has a known bug requiring `-Wno-maybe-uninitialized` in release mode, patched automatically in SConstruct)
- Clang 4.0+
- Python 3.5+, SCons 2.0+
- clang-format 11+, clang-tidy 11+ (linting only, not required for build)

The build respects `CC`, `CXX`, `AR`, `RANLIB`, `LD`, `CCFLAGS`, `CXXFLAGS`, `LINKFLAGS` from the environment. After patching `GetHostArch` to recognize `__riscv`, a cross-compile command would be:
```bash
CC=riscv64-linux-gnu-gcc \
CXX=riscv64-linux-gnu-g++ \
AR=riscv64-linux-gnu-ar \
RANLIB=riscv64-linux-gnu-ranlib \
scons target=a64,a32,t32 simulator=none mode=release
```
`simulator=none` is required because the AArch64 simulator is written to run on AArch64 hosts.

On riscv64 Linux, `code_buffer_allocator` would default to `mmap` (because `__linux__` is defined). Use `code_buffer_allocator=malloc` to avoid `mprotect`.

**QEMU:** No QEMU usage is documented or present in CI for any architecture.

**Known build failures on riscv64:** The `GetHostArch()` crash is the only known hard blocker. No riscv64-specific build bug reports exist in the issue tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| A64 assembler | Full | Full | Missing |
| A32 assembler | Full | Full | Missing |
| T32 assembler | Full | Full | Missing |
| A64 disassembler | Full | Full | Missing |
| A32/T32 disassembler | Full | Full | Missing |
| AArch64 simulator | Full | Full (native exec) | Missing |
| SVE/SVE2/SME codegen | Full | Full | Missing |
| Pointer auth codegen | Full | Full | Missing |
| CPU feature probing | ARM features | ARM features | Missing |
| Floating-point (FPCR.NEP) | Partial (open bug #78) | Partial (open bug #78) | Not applicable |
| Build toolchain support | Full | Full | Broken (GetHostArch crash) |
| CI coverage | Full | Full | None |

**Functional gaps:** VIXL cannot generate RISC-V code. This is a design boundary, not an oversight. The library has no concept of RISC-V registers, instruction encodings, or extension negotiation.

**Performance gaps:** Not applicable -- RISC-V is not a target architecture.

**Floating-point correctness:** Open issue #96 (undefined behavior negating INT64_MIN in C++) affects the AArch64 simulator on any host including riscv64. Open issue #78 (FPCR.NEP support) is an AArch64 feature gap, not a riscv64 host issue. Neither is RISC-V-specific.

---

## 7. CI/CD Infrastructure

The only CI configuration file is `.gitlab-ci.yml` at [gitlab.arm.com/runtimes/vixl](https://gitlab.arm.com/runtimes/vixl). Content confirmed by direct read.

| Aspect | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| CI exists | Yes | Yes | No |
| Runner tag | `amd64` | `arm64` | None |
| QEMU emulation | No | No | No |
| Test job | `run-vixl-tests` | `run-vixl-tests` | None |
| Build-only job | No | Yes (`--notest --nobench`) | None |
| GitHub Actions | None (directory does not exist) | None | None |

No RISE CI runners are used. No riscv64 runner tag appears anywhere in the CI configuration. No Jenkinsfile, `.travis.yml`, or `.cirrus.yml` was found in any VIXL repository.

---

## 8. Distribution and Release Status

**Upstream releases:** Source-only tags (`.tar.gz`/`.zip`). No prebuilt binaries are attached to any release on GitLab or GitHub. The `google/vixl` GitHub repository returns 404.

**PyPI:** No `vixl` package exists. `https://pypi.org/pypi/vixl/json` returns HTTP 404.

**Arch Linux:** VIXL is not packaged in Arch Linux official repositories. The Arch RISC-V community port (`archriscv.felixc.at`) returns no results for "vixl".

**Debian:** `libvixl5` and `libvixl-dev` at version 5.1.0-6 are present in Debian sid/unstable for riscv64, status "Installed", built by `rv-osuosl-01` buildd. Source: [buildd.debian.org/status/package.php?p=vixl](https://buildd.debian.org/status/package.php?p=vixl&suite=sid). Full arch list includes amd64, arm64, armhf, i386, loong64, ppc64el, riscv64, s390x, and additional ports.

**Ubuntu:** `libvixl5` and `libvixl-dev` at version 5.1.0-3 are available for riscv64 in Ubuntu 24.04 (noble), in the "universe" section. Source: [packages.ubuntu.com/noble/libvixl-dev](https://packages.ubuntu.com/noble/libvixl-dev).

**Debian experimental:** `libvixl8` version 8.0.0-1 builds on riscv64 in Debian experimental [NEEDS VERIFICATION: status confirmed as "Installed" on riscv64 experimental buildd, but not independently verified against a second tracker].

**Critical distinction:** The Debian/Ubuntu riscv64 packages are produced by distro packagers applying standard multi-arch build policies to a C++ library that compiles cleanly on riscv64 hosts. Installing `libvixl5` on a riscv64 machine provides a library that generates ARM machine code. The library does not generate RISC-V code regardless of the host. These packages exist because Android cross-compilation toolchains on riscv64 hosts may depend on VIXL as a build-time library for ARM target code.

To get a working binary on riscv64: `apt install libvixl-dev` on Ubuntu 24.04 or Debian trixie/sid.

---

## 9. Dependencies

VIXL has no runtime library dependencies beyond the standard C++ runtime (libc6, libstdc++6, libgcc-s1). All other dependencies are build-time or test-time only.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| SCons 2.0+ | Primary build system (upstream) | Available (arch: all, Python-based) | N/A | Released | None |
| Meson 0.49+ | Debian packaging build system | Available (arch: all, Python-based) | N/A | Released | None |
| GCC 4.8+ or Clang 4.0+ | C++17 compiler | gcc-14, clang-18 in Ubuntu 24.04+ for riscv64 | Full | Released | None |
| cpplint | Style linter (test stage only) | Available (arch: all) | N/A | Released | None |
| clang-format 11+ | Formatting check (test stage only) | Available for riscv64 in Ubuntu 22.04+ | Full | Released | None |
| clang-tidy 11+ | Static analysis (test stage only) | Available for riscv64 in Ubuntu 22.04+ | Full | Released | None |
| libvixl5 (5.1.0-6) | The VIXL library itself | Built on riscv64 by Debian/Ubuntu packaging | Packages published | 5.1.0-6 in Debian sid; 5.1.0-3 in Ubuntu 24.04 | None |
| pthread | Optional (AArch64 simulator only) | Provided by glibc, full riscv64 support | Full | Released | None |

No dependency has a riscv64 blocking issue. The build-time blocker for riscv64 native builds is the `GetHostArch()` crash in VIXL's own SCons script (see Section 5), not any dependency.

---

## 11. Known Bugs and Active Issues

All issues are tracked at [github.com/Linaro/vixl/issues](https://github.com/Linaro/vixl/issues) (mirror of GitLab). Zero RISC-V-related issues exist. The two open correctness/completeness issues:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #78 | Simulator AFP support: FPCR.NEP support | Open | Medium | AArch64 feature gap -- simulator does not implement FPCR.NEP (Armv8.9-A/AFP). Affects AArch64 simulator on any host. Not riscv64-specific. |
| #96 | Undefined behavior negating minimum int64_t value | Open | High | C++ UB in the AArch64 simulator. Negating INT64_MIN is undefined in C++. Affects correctness of the AArch64 simulator. Not riscv64-specific. |

No open NaN-propagation bugs, no open performance regressions, and no riscv64-specific issues exist.

**Note on GitLab vs GitHub issue counts:** The GitLab tracker shows 1 total issue (an unrelated operator"" warning); the GitHub mirror shows more open issues. The discrepancy likely reflects issues filed before the GitLab migration. [NEEDS VERIFICATION: whether GitLab tracker is the canonical destination for new bugs post-migration.]

---

## 12. Objections and Upstream Blockers

**Organizational:** VIXL is an Arm Ltd. project. Its purpose is to generate Arm machine code. Arm has no business incentive to add a RISC-V backend to a library that directly competes with RISC-V hardware. The project's migration from Linaro GitHub to gitlab.arm.com in late 2025 signals tighter Arm control, not openness to new architecture targets.

**Technical:** Adding RISC-V support would require a complete new backend. VIXL's API is Arm-specific at every level: register names, instruction classes, operand types, and CPU feature flags. No existing code is reusable. Estimated scope is comparable to writing a new assembler library from scratch for RISC-V.

**Community:** Zero community discussion of RISC-V support exists. No issue, MR, or mailing-list post has ever requested it. There is no community constituency for this work.

**Acceptance probability:** Near zero. A third-party RISC-V backend submitted as a merge request would require Arm's approval, maintenance commitment, and CI infrastructure investment. Given the project's scope and ownership structure, acceptance is not plausible without a formal agreement with Arm Ltd.

**Alternative:** Android ART's riscv64 port uses native `assembler_riscv64.cc` and `jni_macro_assembler_riscv64.cc` files directly, bypassing VIXL entirely for RISC-V code generation. This is the correct architectural separation and confirms that the Android ecosystem has already solved the problem without VIXL.

---

## 13. Investment Analysis

RISE has not funded any VIXL work. Debian and Ubuntu packaging for riscv64 is already complete and working (libvixl5, libvixl-dev). There is no gap in the "VIXL compiles on riscv64 host" axis.

### 13.1 Functional Enablement

The missing functionality is a RISC-V code generation backend. This is not a gap that needs filling for riscv64 ecosystem health. VIXL generates ARM code; RISC-V JIT code generation for use cases like V8 or ART is handled by separate RISC-V-native assembler libraries in those projects. There is no user-facing scenario where "VIXL generating RISC-V code" is required.

The one actionable item is the `GetHostArch()` crash when cross-compiling with a riscv64 toolchain on a riscv64 host. This blocks native riscv64 builds from source using SCons, though the distro packages work around it via Meson/packaging tooling.

### 13.2 Performance Optimization

Not applicable. VIXL has no RISC-V code generation path to optimize.

### 13.3 CI/CD Infrastructure

Adding a riscv64 build-only CI job to confirm the library compiles on riscv64 hosts would improve confidence that distro packages stay buildable. This requires a riscv64 GitLab runner, which Arm does not currently provide. This work can only be done by Arm or by a contributed runner.

### 13.4 Ecosystem Enablement

Not applicable. VIXL has no plugin/package ecosystem dependent on riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Patch `GetHostArch()` in `tools/util.py` to recognize `__riscv` and enable native riscv64 SCons builds | 0.5 | Contributor (submit MR to gitlab.arm.com) | Low |
| CI/CD | Add riscv64 build-only CI job to `.gitlab-ci.yml` (requires Arm to provision a riscv64 GitLab runner) | 1 (if runner exists) | Arm Ltd. | Low |
| Functional | Full RISC-V code generation backend | Not recommended -- out of scope for Arm project; riscv64 JIT needs are served by project-native assemblers | N/A | Do not pursue |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [gitlab.arm.com/runtimes/vixl -- canonical upstream](https://gitlab.arm.com/runtimes/vixl)
- [gitlab.arm.com/runtimes/vixl .gitlab-ci.yml](https://gitlab.arm.com/runtimes/vixl/-/raw/main/.gitlab-ci.yml)
- [gitlab.arm.com/runtimes/vixl issues](https://gitlab.arm.com/runtimes/vixl/-/issues)
- [gitlab.arm.com/runtimes/vixl merge requests](https://gitlab.arm.com/runtimes/vixl/-/merge_requests)
- [github.com/Linaro/vixl -- frozen mirror](https://github.com/Linaro/vixl)
- [github.com/Linaro/vixl issue #78 -- FPCR.NEP support](https://github.com/Linaro/vixl/issues/78)
- [github.com/Linaro/vixl issue #96 -- UB negating INT64_MIN](https://github.com/Linaro/vixl/issues/96)
- [android.googlesource.com/platform/external/vixl -- AOSP mirror used for file enumeration](https://android.googlesource.com/platform/external/vixl/+/refs/heads/main)
- [buildd.debian.org -- vixl package status](https://buildd.debian.org/status/package.php?p=vixl)
- [packages.ubuntu.com/noble/libvixl-dev](https://packages.ubuntu.com/noble/libvixl-dev)
- [riseproject.dev/blog](https://riseproject.dev/blog)
- [riseproject.dev -- V8 RISC-V blog post (no VIXL mention)](https://riseproject.dev/blog/a-glimpse-into-v8-development-for-risc-v/)