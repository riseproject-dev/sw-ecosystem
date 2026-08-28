---
title: jsonnet
parent: Project Reports
---

# jsonnet

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for jsonnet<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Jsonnet is a data templating language and its reference implementation. This report covers the C++ implementation at [google/jsonnet](https://github.com/google/jsonnet). A separate report covers the Go implementation ([go-jsonnet](https://github.com/google/go-jsonnet)).

The C++ implementation is a pure interpreter: no JIT, no SIMD hot paths, no architecture-specific assembly. The codebase is C++17 with bundled vendored dependencies (rapidyaml, nlohmann/json, md5).

**Governance:** No formal foundation affiliation. The project originated as a Google "20% project." The [jsonnet.org homepage](https://jsonnet.org/) explicitly states it is "not an official Google product (experimental or otherwise), it is just code that happens to be owned by Google." There is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository.

**License:** Apache 2.0.

**Corporate sponsors:** Google is the nominal owner. Active maintainer johnbartholomew (John Bartholomew) does not list a current employer publicly. Original author sparkprime (Dave Cunningham) is a Google employee. No other corporate sponsors are identified in the research findings.

**RISE involvement:** None. A search of riseproject.dev (33 blog posts, May 2024 through Aug 2026, member list, project tracking pages) returned zero mentions of jsonnet. jsonnet does not appear in the RISE wheel builder package list.

**Community stance on new ports:** Constructive but indirect. The sole riscv64 issue ([#1007](https://github.com/google/jsonnet/issues/1007)) was handled by updating a vendored dependency rather than adding any jsonnet-native code. The maintainer closed it promptly once the upstream dependency fix was confirmed included.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-02-12 | c4core PR #69 merged upstream: "[impl] add riscv cpu support" by Xeonacid | [biojppm/c4core#69](https://github.com/biojppm/c4core/pull/69) |
| 2022-07-08 | Issue #1007 "Add support for riscv64" opened by yuzibo (Bo YU), referencing Debian bug #1014598 | [google/jsonnet#1007](https://github.com/google/jsonnet/issues/1007) |
| 2022-07-31 | Debian packaged jsonnet with riscv64 patch (version 0.18.0+ds-3), working around rapidyaml in the distro build | Debian bug #1014598 (referenced in issue #1007) |
| 2026-01-09 | PR #1265 "Update Rapid YAML to 0.10.0" merged by johnbartholomew; vendored copy updated to v0.10.0, which includes the c4core riscv fix | [google/jsonnet#1265](https://github.com/google/jsonnet/pull/1265) |
| 2026-02-27 | Issue #1007 closed by johnbartholomew confirming riscv64 support is resolved via the RapidYAML v0.10.0 update | [google/jsonnet#1007](https://github.com/google/jsonnet/issues/1007) |
| 2026-03-09 | PR #1305 "feat: permit use of system rapidyaml" merged, enabling distro packages to link against distro-provided rapidyaml (which carries the riscv64 fix natively) | [google/jsonnet#1305](https://github.com/google/jsonnet/pull/1305) |
| 2026-03-28 | Issue #1312 "Incompatible with rapidyaml 0.11.0+" opened; compile failure on all architectures when using system rapidyaml >= 0.11 | [google/jsonnet#1312](https://github.com/google/jsonnet/issues/1312) |
| 2026-03-30 | Issue #1315 "Incorrect handling of left shift overflow on non-x86_64" opened; correctness bug on aarch64 and ppc64le confirmed, riscv64 implied | [google/jsonnet#1315](https://github.com/google/jsonnet/issues/1315) |

**Key contributors to riscv64 enablement:**
- Xeonacid: authored c4core PR #69 (the actual fix, in the upstream dependency)
- yuzibo (Bo YU): filed Debian bug #1014598 and jsonnet issue #1007
- johnbartholomew (John Bartholomew, org unknown): updated vendored rapidyaml to v0.10.0 and closed the tracking issue

**Is it fully upstream?** The C++ core is fully upstream as of v0.22.0. No jsonnet-native riscv64 code was ever needed -- the only fix was in the vendored rapidyaml dependency. Two open issues remain (rapidyaml 0.11 API break, left-shift overflow on non-x86_64); these are not riscv64-specific but affect riscv64 along with all non-x86_64 targets.

---

## 3. Upstream Support Tier

No formal tier policy document (no PLATFORMS.md or equivalent) exists in the repository.

**Evidence-based tier assignment:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runners | ubuntu-22.04 (native) | None | None |
| Release binaries | Source tarball only | Source tarball only | Source tarball only |
| PyPI wheels | manylinux + musllinux x86_64 | macOS arm64 only | None |
| Debian package | Yes (v0.20.0+ds-3.3+b1) | Yes | Yes (v0.20.0+ds-3.3+b1, buildd: Installed on rv-osuosl-01) |
| Ubuntu 24.04 package | Yes | Yes | Yes (v0.20.0+ds-1build2) [NEEDS VERIFICATION - not re-confirmed in adversarial pass] |
| Official binary | Source only | Source only | Source only |

The project distributes only source tarballs for all architectures. There is no meaningful upstream tier differentiation: the CI gap between arm64 and riscv64 is zero (neither is tested upstream). riscv64 support is functionally equivalent to arm64 as a distro-packaged, source-only target.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Jsonnet's C++ VM is an interpreter with no JIT, no SIMD dispatch, and no architecture-specific assembly. The design is intentionally portable C++17.

**Component inventory:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Core VM (interpreter, lexer, parser, desugarer) | scalar C++17 | scalar C++17 | scalar C++17 | Zero arch guards anywhere in core source |
| rapidyaml v0.10.0 (vendored, amalgamated header) | scalar via c4core cpu.hpp | scalar via c4core cpu.hpp | scalar via c4core cpu.hpp | c4core defines C4_CPU_X86_64, C4_CPU_ARM64, C4_CPU_RISCV64 for word-size and endian detection only; no SIMD for any arch |
| fast_float (inside c4core amalgam) | FASTFLOAT_64BIT path | FASTFLOAT_64BIT path | FASTFLOAT_64BIT path | riscv64 is explicitly listed in the 64-bit path in c4core; behavior is identical to amd64 and arm64 |
| nlohmann/json (vendored, header-only) | portable | portable | portable | Pure C++ header; no arch-specific code |
| md5 (vendored, hand-rolled C++) | portable | portable | portable | No SIMD; pure C++ |

**Architecture-specific file count in google/jsonnet: zero.** No `#ifdef __riscv`, `#ifdef __x86_64__`, or `#ifdef __aarch64__` guards exist in any jsonnet-owned source file. The string "riscv" does not appear in any source file (only in the Bazel lock file referencing Go SDK URLs, which is unrelated to the C++ implementation).

**SIMD, JIT, crypto, GC barriers:** None present in any component for any architecture. The implementation quality is scalar-equivalent across amd64, arm64, and riscv64 by design.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Supported build systems:** Makefile (default), CMake, Bazel. Python wheel via cibuildwheel.

**Compiler requirement:** C++17 (flag `-std=c++17`). No explicit minimum GCC or Clang version is stated in the repository. C++17 support requires GCC >= 7 or Clang >= 5.

**CMake build (standard, no riscv64-specific overrides):**
```
cmake . -Bbuild
cmake --build build --target run_tests
```

**CMake options relevant to dependency configuration:**
- `-DUSE_SYSTEM_RAPIDYAML=OFF` (default: use vendored v0.10.0; set ON to use distro-provided libryml)
- `-DUSE_SYSTEM_GTEST=OFF` (default: use bundled gtest)
- `-DUSE_SYSTEM_JSON=OFF` (default: use vendored nlohmann/json)

**Makefile cross-compile for riscv64 (inferred from Makefile variable structure, no explicit riscv64 target exists):**
```
make CC=riscv64-linux-gnu-gcc CXX=riscv64-linux-gnu-g++
```

**Known build failure:** Issue [#1312](https://github.com/google/jsonnet/issues/1312) documents a compile error when building against system rapidyaml 0.11.0+. The `c4::yml::Callbacks` constructor signature changed between v0.10 and v0.11 (error callback type changed from `pfn_error` with `Location` to `pfn_error_basic` with `ErrorDataBasic`). This affects all architectures including riscv64 when using `-DUSE_SYSTEM_RAPIDYAML=ON` with a distro that has rapidyaml >= 0.11. The vendored v0.10.0 copy is unaffected.

**Dockerfile:** The repository contains a single Alpine-based `Dockerfile` that builds with `make` using native GCC (`build-base`). No riscv64 variant, no multi-arch support, no QEMU usage.

**QEMU usage:** None in any CI or build configuration.

**No riscv64 toolchain file** (e.g., `cmake/toolchain-riscv64.cmake`) exists in the repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---------|-------|-------|---------|-------|
| Core interpreter correctness | Yes | Yes | Yes (by analysis; no CI verification) | Pure C++17, no arch-dependent behavior intended |
| YAML input parsing | Yes | Yes | Yes | rapidyaml v0.10.0 includes c4core riscv64 support |
| JSON output | Yes | Yes | Yes | nlohmann/json is fully portable |
| Python bindings (PyPI wheel) | Yes | macOS arm64 only | No | No riscv64 wheel built or distributed |
| `jsonnet` CLI binary | Distro package | Distro package | Distro package (Debian/Ubuntu) | No upstream binary for any arch |
| Left-shift overflow detection | Correct (returns error) | Incorrect (returns wrapped value) | Incorrect (implied) | Issue #1315: aarch64 and ppc64le confirmed wrong; riscv64 implied by same unsigned shift semantics in GCC/Clang |

**Correctness gap on riscv64:** Issue [#1315](https://github.com/google/jsonnet/issues/1315) confirms that `(1 << 63)` in Jsonnet produces `-9223372036854775808` with exit code 0 on non-x86_64 targets instead of a runtime error. This is a behavioral difference from x86_64 caused by C++ undefined behavior in signed left shift resolving differently under GCC/Clang on non-x86_64 targets. aarch64 and ppc64le are explicitly confirmed in the issue; riscv64 is implied by the same code path but has not been independently verified in the issue text. PR [#1316](https://github.com/google/jsonnet/pull/1316) "core: Fix shift behavior on non-x86_64" is open.

**Performance gap:** No SIMD-based performance gap exists because neither the jsonnet core nor any of its dependencies uses SIMD on any architecture. Data not available: no riscv64-vs-amd64 benchmark measurements exist in any accessible source.

**Security hardening:** Data not available: no investigation of stack canaries, CFI, or other hardening flags on riscv64 was performed and no data exists in the research findings.

**Floating-point semantics:** rapidyaml uses fast_float for number parsing; riscv64 takes the same `FASTFLOAT_64BIT` path as amd64 and arm64. Floating-point correctness bugs exist in go-jsonnet (issues #449, #886-#890) but those are specific to the Go implementation's IEEE 754 handling, not the C++ implementation.

---

## 7. CI/CD Infrastructure

**Upstream CI (google/jsonnet):** Five GitHub Actions workflow files exist. All jobs run exclusively on `ubuntu-22.04` (x86_64). The string "riscv" does not appear in any CI configuration file.

| CI job | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Makefile build + test | ubuntu-22.04 | None | None |
| CMake build + test | ubuntu-22.04 | None | None |
| Bazel build + test | ubuntu-22.04 | None | None |
| Python wheel (cibuildwheel) | ubuntu-22.04, windows-latest, macos-14, macos-latest | macos-14 (arm64 host) | None |
| Source tarball / release | ubuntu-22.04 | None | None |
| Docs | ubuntu-24.04 | None | None |

The `publish-python.yml` workflow uses cibuildwheel but does not configure QEMU emulation and does not add riscv64 to the build matrix. The code formatting job is explicitly disabled with `if: false` in the CI YAML because "the code currently doesn't pass formatting."

**RISE runners:** None. RISE has no involvement with jsonnet.

**Downstream CI (Debian buildd):** Debian's riscv64 buildd (`rv-osuosl-01`) has successfully built and installed jsonnet v0.20.0+ds-3.3+b1 on riscv64. This is the only confirmed riscv64 build test, and it is external to the upstream project.

---

## 8. Distribution and Release Status

**Upstream releases:** The latest release is v0.22.0 (2026-03-24). It contains one artifact: `jsonnet-v0.22.0.tar.gz` (source tarball). No prebuilt binaries are distributed by upstream for any architecture.

**PyPI (package: `jsonnet`):** Latest version 0.22.0. Wheels exist for:
- manylinux x86_64 and musllinux x86_64
- macOS arm64
- Windows amd64

No riscv64 wheel exists. All nine v0.22.0 filenames were confirmed from the PyPI JSON API; none contains "riscv64."

**RISE wheel builder:** jsonnet is not in the RISE wheel builder package list. The RISE GitLab package index for jsonnet redirects to PyPI with no additional wheels.

**Debian sid:** version 0.20.0+ds-3.3+b1, status "Installed" on riscv64, built on `rv-osuosl-01`. Confirmed directly from the [Debian buildd status page](https://buildd.debian.org/status/package.php?p=jsonnet&suite=sid).

**Debian trixie (stable):** version 0.20.0+ds-3.1, riscv64 package size 584.9 kB, installed size 2,368.0 kB. Requires libgcc-s1 >= 3.4 on riscv64 (vs >= 3.0 on most other architectures). Packages available: `jsonnet`, `libjsonnet-dev`, `libjsonnet0`, `python3-jsonnet`.

**Ubuntu 24.04 (Noble):** version 0.20.0+ds-1build2, riscv64 listed as supported architecture for all four packages [NEEDS VERIFICATION - not confirmed in adversarial pass; confirmed in initial search pass only].

**Arch Linux RISC-V:** Unknown. The archriscv.felixc.at site returned a connection error during verification; no data available.

**What a user must do to get a working binary on riscv64:**
- On Debian sid or trixie: `apt install jsonnet` installs the distro-packaged binary directly.
- On Ubuntu 24.04: same [NEEDS VERIFICATION].
- On other distributions: build from source using `make CXX=g++` or `cmake . -Bbuild && cmake --build build`. The vendored v0.10.0 rapidyaml is sufficient; no external riscv64 toolchain patches are required.
- Note: distro packages are at v0.20.0, while upstream is at v0.22.0 (gap of two minor versions).

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|--------------|-------------|----------------|-----------------|
| rapidyaml v0.10.0 (vendored) | YAML input parsing | OK - c4core PR#69 merged 2022-02-12, included in v0.10.0 | No upstream CI coverage | N/A (vendored) | Issue #1312: compile failure with system rapidyaml 0.11+; does not affect vendored v0.10.0 |
| nlohmann/json (vendored, header-only) | JSON serialization | OK - pure C++, fully portable | No riscv64 CI | N/A (vendored) | None |
| md5 (vendored, hand-rolled C++) | Import path hashing | OK - pure C++, no SIMD | No riscv64 CI | N/A (vendored) | None |
| googletest (optional, system or bundled) | Test framework | OK - gtest supports riscv64 | OK (used in CI, but only on x86_64) | N/A | None |
| CMake >= 3.15 | Build system | OK | N/A | N/A | None |

**Deep dive: rapidyaml / c4core (the historically critical dependency)**

The c4core library (used internally by rapidyaml) contains the only architecture-detection code that affected riscv64 enablement. The relevant file is `c4/cpu.hpp` in the amalgamated header, which detects `C4_CPU_RISCV64` for word-size and endian selection. This detection was absent before c4core PR #69 (merged 2022-02-12), causing build failures on riscv64.

The fix is in the vendored `third_party/rapidyaml/rapidyaml-0.10.0.hpp` amalgamated header as of PR #1265 (merged 2026-01-09). No further action is needed for the vendored path.

The system rapidyaml path (enabled via `-DUSE_SYSTEM_RAPIDYAML=ON`, introduced in PR #1305) is blocked on any distro shipping rapidyaml >= 0.11 due to the API break documented in issue #1312. Two PRs attempting fixes are open but unmerged as of the research date: PR #1313 and PR #1314. The system path is not the default; the default vendored path is unaffected.

**fast_float (inside c4core amalgam):** Used for floating-point number parsing in YAML. riscv64 is explicitly listed in the `FASTFLOAT_64BIT` code path, receiving identical behavior to x86_64 and arm64. No SIMD is involved.

---

## 11. Known Bugs and Active Issues

**riscv64-relevant correctness bugs:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1315](https://github.com/google/jsonnet/issues/1315) | Incorrect handling of left shift overflow on non-x86_64 | Open | High | `(1 << 63)` returns `-9223372036854775808` instead of a runtime error on aarch64/ppc64le; riscv64 implied by same C++ UB path; fix in open PR #1316 |
| [#1312](https://github.com/google/jsonnet/issues/1312) | Incompatible with rapidyaml 0.11.0+ | Open | Medium | Compile failure with system rapidyaml >= 0.11; affects all architectures including riscv64 when using `-DUSE_SYSTEM_RAPIDYAML=ON`; vendored v0.10.0 unaffected |

**Open fix PRs:**

| PR | Title | Status | Addresses |
|----|-------|--------|-----------|
| [#1316](https://github.com/google/jsonnet/pull/1316) | core: Fix shift behavior on non-x86_64 | Open | Issue #1315 |
| [#1314](https://github.com/google/jsonnet/pull/1314) | core: Permit use of rapidyaml-0.11.0+ | Open | Issue #1312 (Fedora RHEL tested) |
| [#1313](https://github.com/google/jsonnet/pull/1313) | Fix: Adapt to rapidyaml 0.11 callback changes | Open | Issue #1312 (competing approach) |

Note: PR #1314 explicitly states it does NOT address issue #1315 (the shift behavior bug).

**Resolved riscv64 issues:**

| ID | Title | Resolution |
|----|-------|-----------|
| [#1007](https://github.com/google/jsonnet/issues/1007) | Add support for riscv64 | Closed 2026-02-27; resolved via RapidYAML v0.10.0 vendor update (PR #1265) |

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The single riscv64 issue was handled constructively and closed. The maintainer expressed no resistance to riscv64 support and merged the dependency update promptly.

**Technical blockers:**

1. Issue #1315 (left-shift overflow on non-x86_64): This is the only remaining correctness blocker. It affects riscv64 along with aarch64 and ppc64le. PR #1316 exists but is not yet merged. The fix requires a targeted code change in `core/vm.cpp` to use unsigned arithmetic for shift operations. Risk: low complexity, high correctness impact.

2. Issue #1312 (rapidyaml 0.11 API break): Blocks the system rapidyaml path only. The vendored path is unaffected. Two competing PRs are open. Relevant for distro packagers who want to use the system library rather than the bundled copy. This is a cross-architecture issue, not specific to riscv64.

**Organizational blockers:** None identified. The project is lightly maintained (PR review turnaround is slow -- PR #1316 and #1313/#1314 have been open since March 2026 with no merge), but there are no stated objections to accepting fixes.

**CI gap:** No upstream riscv64 CI exists and none has been requested. Getting a RISC-V hardware runner or QEMU-based CI job into the upstream project would require a PR against the workflow files, which the maintainer would need to review and approve.

---

## 13. Investment Analysis

RISE has no prior involvement with jsonnet. No funded work has been performed.

### 13.1 Functional Enablement

The core is already functional. One correctness bug (issue #1315, left-shift overflow on non-x86_64) needs resolution. PR #1316 is written but unmerged. The work is landing the fix upstream, not writing new code.

### 13.2 Performance Optimization

Not applicable. The C++ jsonnet interpreter has no architecture-specific performance code on any platform. There is no SIMD to add. Performance improvements would require interpreter-level work (JIT, threaded dispatch, object allocation optimization) that is architecture-neutral and out of scope for riscv64 enablement.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI job upstream requires either a QEMU-emulated GitHub Actions job or a native RISC-V runner. The cibuildwheel path for Python wheels could be extended to riscv64 with QEMU. Both are straightforward additions to existing workflow YAML files.

### 13.4 Ecosystem Enablement

The Python `jsonnet` package on PyPI has no riscv64 wheel. Adding one requires either a QEMU-emulated cibuildwheel run or a native RISC-V builder in the upstream publish workflow. This is the highest-value distribution gap: users who install via `pip install jsonnet` on riscv64 currently get no wheel and must compile from source.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Land PR #1316 (left-shift overflow fix on non-x86_64) upstream | 0.5 | Upstream maintainer (review) + contributor | High |
| Functional | Resolve rapidyaml 0.11 API break (land PR #1313 or #1314) | 0.5 | Upstream maintainer (review) + contributor | Medium |
| CI/CD | Add QEMU-emulated riscv64 job to build_and_test.yml | 1 | Contributor + upstream review | Medium |
| CI/CD | Add riscv64 cibuildwheel target to publish-python.yml with QEMU | 1 | Contributor + upstream review | High |
| Distribution | Publish riscv64 PyPI wheel for `jsonnet` | 0.5 (after CI work above) | Upstream maintainer | High |
| Distribution | Advance Debian/Ubuntu packaging to v0.22.0 on riscv64 | 1 | Debian maintainer (Fukui Daichi) | Low |

Total estimated effort: 4.5 person-weeks. The functional work (1 person-week) is the only item touching correctness; the remainder is CI and distribution infrastructure.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/jsonnet repository](https://github.com/google/jsonnet)
- [jsonnet.org homepage](https://jsonnet.org/)
- [Issue #1007: Add support for riscv64](https://github.com/google/jsonnet/issues/1007)
- [PR #1265: Update Rapid YAML to 0.10.0](https://github.com/google/jsonnet/pull/1265)
- [PR #1305: feat: permit use of system rapidyaml](https://github.com/google/jsonnet/pull/1305)
- [Issue #1312: Incompatible with rapidyaml 0.11.0+](https://github.com/google/jsonnet/issues/1312)
- [Issue #1315: Incorrect handling of left shift overflow on non-x86_64](https://github.com/google/jsonnet/issues/1315)
- [PR #1316: core: Fix shift behavior on non-x86_64](https://github.com/google/jsonnet/pull/1316)
- [PR #1313: Fix: Adapt to rapidyaml 0.11 callback changes](https://github.com/google/jsonnet/pull/1313)
- [PR #1314: core: Permit use of rapidyaml-0.11.0+](https://github.com/google/jsonnet/pull/1314)
- [biojppm/c4core PR #69: [impl] add riscv cpu support](https://github.com/biojppm/c4core/pull/69)
- [PyPI jsonnet 0.22.0 release metadata](https://pypi.org/pypi/jsonnet/json)
- [Debian buildd status for jsonnet (sid)](https://buildd.debian.org/status/package.php?p=jsonnet&suite=sid)
- [Debian tracker for jsonnet](https://tracker.debian.org/pkg/jsonnet)
- [Ubuntu 24.04 packages: jsonnet](https://packages.ubuntu.com/search?keywords=jsonnet&suite=noble&searchon=names&section=all)
- [google/go-jsonnet PR #284: Update x/sys to support Risc-V architecture](https://github.com/google/go-jsonnet/pull/284)
- [riseproject.dev member list](https://riseproject.dev/members/)