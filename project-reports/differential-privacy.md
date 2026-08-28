---
title: differential-privacy
parent: Project Reports
---

# differential-privacy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for differential-privacy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/differential-privacy](https://github.com/google/differential-privacy) is a multi-language library implementing differential privacy primitives: Laplace and Gaussian noise mechanisms, privacy accounting (RDP, PLD, advanced composition), and aggregation pipelines. Languages supported: C++, Go, Java, Kotlin, Scala, and Python. The Python component (`dp_accounting`) is the most widely used externally and is published to PyPI.

The project is hosted under the `google` GitHub org with Apache 2.0 license. The README explicitly states: "This is not an officially supported Google product." It is not under any foundation (not Apache, CNCF, or Linux Foundation). It is not a RISE project member or participant.

Governance is informal and Google-internal. The CONTRIBUTING.md states that Googlers are expected to submit internal CLs which are then mirrored to GitHub; external contributors may submit PRs via Google CLA. No OWNERS, MAINTAINERS, or CODEOWNERS file exists. There is no tiered committer structure. Google commits to 3 months advance notice before stopping maintenance.

All active committers in the last 30 commits (as of August 2026) carry `@google.com` email addresses. Key contributors: `dvadym` (C++ noise mechanisms), `tasquatch` (dp_accounting, Gaussian), `arung54` (Python docs, ReadTheDocs), `miracvbasaran` (Go, Privacy-on-Beam), `RamSaw` (PipelineDP4j), `mckennar` (RDP accountant). No external corporate co-maintainers are present in recent history.

Community stance on new platform ports: no explicit policy exists. The contribution guidelines emphasize "simplicity over completeness" and require new features' usefulness to be weighed against technical complexity. Because the library has no arch-specific code paths, RISC-V support for JVM and Go components would be implicit. The C++ layer's primary arch-sensitive concern is floating-point behavior: the README explicitly warns that floating-point attacks on privacy budgets are a known vulnerability surface, and correctness of the Laplace/Gaussian mechanisms depends on IEEE 754 binary64 semantics.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2019-09-04 | Repository created | [GitHub repo](https://github.com/google/differential-privacy) |
| (none) | First RISC-V commit | Not applicable - no RISC-V work exists |
| (none) | First RISC-V issue filed | Not applicable |
| (none) | First RISC-V PR merged | Not applicable |

Zero commits matching "riscv", "risc-v", or "riscv64" exist in repository history. All 318 issues and all 231 PRs were scanned via title regex `riscv|riscv64|risc-v|RISC-V` with zero matches. GitHub code search for `riscv`, `riscv64`, `rvv`, `risc` in the repo returned zero results.

There is no RISC-V port. There are no contributors associated with any RISC-V effort. The question of upstreaming does not apply.

---

## 3. Upstream Support Tier

No formal tier policy exists. There is no PLATFORMS.md, SUPPORT.md, or docs/platforms/ directory.

**Platform support evidence:**

| Platform | CI | Release binaries | Officially documented |
|----------|-----|------------------|-----------------------|
| amd64 (x86_64) | Yes, all 3 CI workflows on `ubuntu-latest` | No binaries (source only) | Implied by CI |
| arm64 | No | No | No |
| riscv64 | No | No | No |

The project has no official binary releases for any architecture. It distributes source code only via git tags. The only published binary artifact is the PyPI package `differential-privacy-0.1.0`, which is a source tarball with no wheels for any architecture.

riscv64 is untested, undocumented, and unsupported by any upstream policy or practice.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The library is intentionally architecture-agnostic. The C++ core (`cc/algorithms/`) implements differential privacy mechanisms as portable C++17 with no SIMD dispatch, no JIT backend, no assembly, and no platform-specific intrinsics.

Architecture-specific code survey (all architectures):

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| SIMD / vector | None | None | None |
| JIT / code generation | None | None | None |
| Assembly (.S files) | None | None | None |
| Crypto intrinsics | None | None | None |
| ISA extension guards (#ifdef) | None | None | None |
| Architecture-specific directories | None | None | None |

Searches for `__riscv`, `#ifdef __arm`, `__x86_64__`, AVX, SSE, NEON, RVV intrinsics all returned zero results. There are no `.S` or `.s` files in the repository.

The C++ algorithms rely on:
- IEEE 754 binary64 double representation (static_asserted via `std::numeric_limits<double>::is_iec559`)
- `RAND_bytes` from OpenSSL/BoringSSL for cryptographically secure randomness
- `absl::countl_zero` for bit operations

All three requirements are satisfied by riscv64 with a standard toolchain and system OpenSSL. No hand-tuned optimizations exist for any architecture, so riscv64 has no performance gap relative to arm64 on this axis - both use the same scalar C++ paths.

The only arch-sensitive risk is floating-point behavior: the README warns that floating-point attacks on privacy budgets are a known vulnerability. IEEE 754 compliance on riscv64 is not in question, but the interaction with OpenSSL's constant-time AES (see Section 11) is a security-relevant concern on riscv64 hardware without Zkn extensions.

---

## 5. Build System, Cross-Compilation, and Toolchain

Two build systems are provided for the C++ library:

**Bazel (primary)**

Bazel version: 7.5.0 (root workspace per `.bazelversion`); 8.x for `cc/` workspace.

Standard build and test:
```shell
cd cc/
bazelisk build ...
bazelisk test --test_output=errors --test_timeout_filters=-long,-eternal ...
```

The `.bazelrc` defines only three platform configs: `linux`, `macos`, `windows`. No riscv64 platform, no cross-compilation platform, no QEMU step. Key Bzlmod dependencies pinned in `cc/MODULE.bazel`: `abseil-cpp 20260107.0`, `boringssl 0.20251124.0`, `boost.math 1.87.0`, `protobuf 33.4`, `googletest 1.17.0`.

**CMake (experimental)**

Explicitly marked experimental in `cc/README.md`. Tested only on Ubuntu 22.04. Requires CMake >= 3.16 and C++17.

Prerequisites: `sudo apt install -y cmake protobuf-compiler libssl-dev`

Build:
```shell
mkdir build && cd build
cmake ..
make -j
```

Tests: `cd cc && ctest`

CMake fetches dependencies via FetchContent: protobuf v3.21.12, abseil-cpp 20260107.0, googletest v1.17.0. OpenSSL is located via `find_package(OpenSSL REQUIRED)` (system-provided).

No toolchain files for riscv64 exist. No `cmake/riscv64.cmake`, no `cmake/toolchain-riscv64.cmake`, no cross-compilation documentation.

**Native riscv64 build assessment:** For a native build on a riscv64 host, the standard CMake or Bazel invocations should work without modification, given a C++17-capable compiler (GCC >= 10 or Clang >= 11, as required by abseil-cpp 20260107.0) and system OpenSSL. No QEMU usage is documented or required. No known build failures are documented because no one has attempted or reported a riscv64 build.

**Go and Java/Kotlin/Scala:** Pure Go modules use standard `go build`; no arch-specific flags needed. Java/Kotlin/Scala modules build via Maven or Bazel; JVM portability is inherent.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| C++ Laplace/Gaussian mechanisms | Yes | Expected (untested) | Expected (untested) |
| C++ privacy accounting | Yes | Expected (untested) | Expected (untested) |
| C++ PostgreSQL extension | Yes | Unknown | Unknown |
| Go DP library | Yes | Expected (untested) | Expected (untested) |
| Privacy-on-Beam (Go) | Yes | Expected (untested) | Expected (untested) |
| Java DP library | Yes | Expected (untested) | Expected (untested) |
| PipelineDP4j (Java/Kotlin) | Yes | Expected (untested) | Expected (untested) |
| Python dp_accounting | Yes | Expected (untested) | Expected (untested) |

**Functional gaps:** None expected from first principles - the library has no arch-specific code. However, all riscv64 entries are "Expected (untested)" because no CI or reported testing exists.

**Performance gaps:** None expected from missing SIMD - no SIMD is used for any architecture. Performance is entirely scalar and determined by compiler quality.

**Security hardening gaps:** One security-relevant gap exists. The library uses `RAND_bytes` via OpenSSL for noise generation. On riscv64 hardware without Zkn (scalar cryptography) ISA extensions, OpenSSL's AES is not constant-time (see OpenSSL issue #20980 in Section 11). This is a DP correctness and security risk: an attacker timing AES operations could infer information about the noise seed, potentially degrading the privacy guarantee. This gap does not affect amd64 or arm64 which have dedicated crypto instructions.

**Floating-point semantics:** The C++ library static-asserts IEEE 754 binary64 compliance. riscv64 is IEEE 754 compliant. No gap is expected, but this is untested.

---

## 7. CI/CD Infrastructure

All three CI workflow files (`bazel.yml`, `go.yml`, `maven.yml`) run exclusively on `ubuntu-latest` (x86_64 GitHub-hosted runners). No architecture matrix, no QEMU step, no self-hosted riscv64 runners, no ARM runners.

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | No | No |
| Platform | ubuntu-latest (x86_64) | - | - |
| Runner type | GitHub-hosted | - | - |
| RISE runners | No | No | No |
| Hardware CI | No | No | No |
| Triggers | push, pull_request, workflow_dispatch | - | - |

Workflow coverage:
- `bazel.yml`: 6 jobs covering C++ (cc-tests), Java (java-tests, pipelinedp4j-tests, zetasql-build), and Python (python-tests). All `runs-on: ubuntu-latest`.
- `go.yml`: 1 job (go-tests). `runs-on: ubuntu-latest`.
- `maven.yml`: 1 job (pipelinedp4j-tests). `runs-on: ubuntu-latest`.

The word "riscv" does not appear in any of the three workflow files.

RISE project does not operate CI for this project. No RISE blog posts mention differential-privacy. The RISE wheel builder (riseproject.gitlab.io) does not list differential-privacy in its 80+ package catalog.

---

## 8. Distribution and Release Status

| Channel | riscv64 availability | Notes |
|---------|----------------------|-------|
| GitHub Releases | None | All 5 releases (v2.0.0 through v4.1.0) have zero attached binary assets |
| PyPI (differential-privacy 0.1.0) | None | Single file: source tarball only, no wheels for any architecture |
| Ubuntu Noble | Not packaged | Not in the Ubuntu noble archive |
| Debian | Not packaged | tracker.debian.org returns HTTP 404 for this package name |
| Arch Linux | Not packaged | Not in Arch Linux or Arch RISC-V port |
| RISE wheel builder | Not built | Not listed in the 80+ package catalog |

To obtain a working installation on riscv64, a user must:
1. Clone the repository from source
2. For C++: install CMake >= 3.16, GCC >= 10 or Clang >= 11, OpenSSL dev headers, then run `cmake .. && make -j` (experimental build system, Ubuntu 22.04 tested only)
3. For Go: `go build ./...` in the relevant module directory (standard Go toolchain)
4. For Java/Kotlin/Scala: Maven or Bazel with JDK; requires building protoc from source since no riscv64 Maven Central prebuilt exists
5. For Python dp_accounting: `pip install -e .` from source; NumPy must be built from source (no riscv64 manylinux wheel available)

No official binary packaging exists for riscv64 at any layer.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|------------|------|---------------|--------------|-----------------|-------|
| abseil-cpp 20260107.0 | C++ base utilities, containers, random | Builds | Flaky (2 test suites fail) | No binary artifacts | OPEN #2002: hashtablez and cordz sampler tests fail |
| protobuf v3.21.12 / v29.5 | Wire format for DP summaries and protos | Builds | Pass | No riscv64 protoc on Maven Central | CLOSED #17798: Maven prebuilts deferred |
| OpenSSL (system) | CSPRNG (`RAND_bytes`), constant-time arithmetic | Builds | 3 open failures | System library (Debian/Ubuntu) | OPEN #20980: AES not constant-time without Zkn (security) |
| BoringSSL 0.20251124.0 | Alternative to OpenSSL in Bazel builds | Unknown riscv64 status | Unknown | No prebuilts | [NEEDS VERIFICATION] |
| GoogleTest 1.17.0 | C++ unit test framework | Builds | Flaky on riscv64 | Not applicable (test-only) | OPEN #3756: GetThreadCountTest fails on riscv64 |
| gonum v0.16.0 | Go numerical distributions and linear algebra | Builds (pure Go) | No riscv64 issues found | Arch-independent | Low risk |
| Apache Beam SDK v2.70.0 | Distributed pipeline for privacy-on-beam | Unknown | Unknown | No riscv64 releases | Untested on riscv64; Go runner layer is pure Go |
| NumPy >=1.21,<3.0 | Python dp_accounting numerics | Builds from source | No riscv64-specific failures | No riscv64 manylinux wheel | OPEN #30216: wheel distribution gap |
| SciPy ~1.7 | Special functions (erfinv, ndtri) for accountant math | Builds from source | No riscv64-specific failures found | No riscv64 wheels | No CI coverage; depends on OpenBLAS (riscv64 supported) |
| mpmath ~1.2 | Arbitrary-precision arithmetic | Pure Python | No issues | Arch-independent wheel | No risk |
| absl-py >=1.0,<3 | Python Abseil utilities | Pure Python | No issues | Arch-independent wheel | No risk |
| google.golang.org/grpc v1.78.0 | RPC transport for Beam workers | Pure Go | No riscv64 issues | Arch-independent | No risk |
| golang.org/x/crypto v0.46.0 | Go TLS crypto primitives | Pure Go + some assembly; riscv64 assembly present | No open riscv64 issues | Arch-independent module | Low risk |

**Critical dependency deep-dives:**

**OpenSSL** is the most significant dependency for riscv64. OPEN issue #20980: AES without Zkn ISA extensions is not constant-time on riscv64. This is security-relevant because `RAND_bytes` is the source of cryptographic randomness for DP noise generation. If timing of AES is observable, the noise seed could be partially inferred. Most current riscv64 boards (StarFive VisionFive 2, Milk-V Pioneer, etc.) do not implement Zkn. Mitigation requires either hardware with Zkn or explicit use of a constant-time AES fallback in OpenSSL 3.x. Additional open issues: #22166 (SSL test failures with high parallelism on riscv64), #25334 (Zknd/Zkne capability flags logic bug), #30880 (test_lhash flaky on riscv64).

**abseil-cpp 20260107.0** has OPEN issue #2002: `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` fail on riscv64-linux-gnu as of August 2026. These exercise memory-sampler internals (absl::cord, absl::hashtablez). No runtime crash from production use has been reported, but the failures indicate untested code paths in the version pinned by differential-privacy.

**NumPy** OPEN issue #30216 (November 2025, updated May 2026): no manylinux riscv64 wheels are distributed. Python dp_accounting users on riscv64 must build NumPy from source, requiring a Fortran compiler and BLAS/LAPACK headers in addition to the standard Python toolchain.

**Protocol Buffers:** No prebuilt `protoc` binary for riscv64 exists on Maven Central (closed #17798 as deferred). Java, Kotlin, and Scala users of differential-privacy on riscv64 must build protoc from source.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific correctness bugs in differential-privacy:**

None. The repository contains zero riscv64-specific issues.

**RISC-V-specific issues in direct dependencies (security-relevant first):**

| ID | Project | Title | Status | Severity | Notes |
|----|---------|-------|--------|----------|-------|
| #20980 | OpenSSL | AES not constant-time without Zkn extensions on riscv64 | Open | Critical (security) | Affects `RAND_bytes` used for DP noise; most riscv64 boards lack Zkn |
| #25334 | OpenSSL | Zknd/Zkne capability flags logic bug | Open | High | Incorrect detection of hardware crypto extensions |
| #2002 | abseil-cpp | hashtablez_sampler_test and cordz_sample_token_test fail on riscv64-linux-gnu | Open | Medium | Test-layer failures; no confirmed runtime crash |
| #22166 | OpenSSL | SSL tests fail with high HARNESS_JOBS on riscv64 | Open | Medium | Parallelism race in test infrastructure |
| #30880 | OpenSSL | test_lhash flaky on riscv64 | Open | Low | Test flake, not a runtime correctness bug |
| #3756 | GoogleTest | GetThreadCountTest fails on riscv64 | Open (since 2022) | Low | Test infrastructure only; non-blocking for library users |
| #30216 | NumPy | No manylinux riscv64 wheel distribution | Open | Medium | Packaging gap; source builds work |

**Open issues in differential-privacy with potential arch relevance:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| #62 | Add CMake support to C++ library | Open (2021) | CMake is experimental; a prerequisite for structured cross-platform portability testing |
| #12 | Support for RDRAND | Open (2021) | x86-specific RNG instruction; riscv64 has no RDRAND equivalent; noise generation uses `RAND_bytes` via OpenSSL, so this gap is inherited from OpenSSL riscv64 CSPRNG quality |
| #378 | Sensitivity off by a factor of 2 with replace_one neighbouring relation | Open | Correctness bug, not platform-specific |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **OpenSSL constant-time AES (#20980, open):** On riscv64 hardware without Zkn extensions, the CSPRNG path used for DP noise generation is not constant-time. This is not a build blocker but is a security blocker for deployment in adversarial contexts. Upstream fix requires either OpenSSL to provide a verified constant-time scalar AES fallback or hardware Zkn deployment.

2. **No riscv64 CI:** The library has never been tested on riscv64. Any test failures or build issues would be discovered only by the user. Adding riscv64 CI requires either self-hosted runners (hardware or QEMU) or GitHub-hosted riscv64 runners (not currently available on GitHub Actions as of the research date).

3. **Abseil-cpp test failures (#2002, open):** Two test suites fail on riscv64 in the pinned version. These do not block a build but indicate that `absl::cord` and `absl::hashtablez` sampling paths are not validated on riscv64.

4. **No protoc prebuilt for riscv64:** Java/Kotlin users must build protoc from source.

5. **No NumPy wheels for riscv64:** Python users must build NumPy from source.

**Organizational blockers:**

The project is developed internally at Google and mirrored to GitHub. All contributors are Google employees. There is no external community of maintainers who would champion a RISC-V port. A contribution adding riscv64 CI or riscv64 validation would need to align with Google's internal development priorities and pass Google CLA review. The "simplicity over completeness" contribution guideline creates a moderate bar for CI infrastructure additions that only benefit a niche architecture.

Google is a RISE Premier Member, but there is no evidence that RISE membership has influenced this project toward riscv64 support. RISE has not engaged with google/differential-privacy.

**Acceptance probability for a community riscv64 CI contribution:** Moderate, if the contribution is low-friction (QEMU-based, no new runner infrastructure required from Google). A PR adding riscv64 validation to existing CI would be a net positive with minimal maintenance burden given the architecture-agnostic codebase.

---

## 13. Investment Analysis

RISE has not funded or engaged with this project. All work described below is unaddressed.

### 13.1 Functional Enablement

The library's architecture-agnostic design means functional enablement on riscv64 is largely implicit. The primary functional concern is validating that the C++ build succeeds with a standard riscv64 toolchain and that the noise mechanisms produce correct output under IEEE 754 riscv64 semantics.

The OpenSSL constant-time AES gap (#20980) is a security correctness concern. For deployments on riscv64 hardware with Zkn, this is moot. For deployments without Zkn, a workaround must be identified at the OpenSSL layer, not in differential-privacy itself.

### 13.2 Performance Optimization

Not applicable. The library uses no SIMD for any architecture. There are no performance-optimized paths to add for riscv64. If RVV-accelerated floating-point proves beneficial for inner loops of the Gaussian mechanism, that would be a novel contribution, but no evidence exists that this is a bottleneck or has been studied.

### 13.3 CI/CD Infrastructure

The highest-value investment is adding riscv64 CI. Given the architecture-agnostic codebase, this is primarily a runner provisioning and workflow editing task. QEMU-based riscv64 runners on `ubuntu-latest` via `docker/setup-qemu-action` would be sufficient for correctness testing. Performance benchmarks on emulated QEMU are not meaningful; hardware runners would be needed for performance regression testing.

### 13.4 Ecosystem Enablement

The primary packaging gap is the Python dp_accounting wheel for riscv64. RISE's wheel builder does not currently include this package. Adding it would eliminate the source-build requirement for Python users. This depends on NumPy riscv64 wheel availability (OPEN #30216) as a prerequisite.

For Java users, the protoc prebuilt gap affects PipelineDP4j. This is an upstream Protocol Buffers issue, not a differential-privacy issue.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Validate native riscv64 C++ build (CMake + Bazel) and run test suite | 1 | Community / RISE | High |
| Functional | Validate Go, Java, Python dp_accounting builds on riscv64 | 1 | Community / RISE | High |
| Functional | Document and test OpenSSL Zkn workaround for constant-time AES on riscv64 without Zkn | 2 | Community (OpenSSL upstream) | Critical |
| CI/CD | Add QEMU riscv64 job to bazel.yml and go.yml | 1 | Community / RISE | High |
| CI/CD | Add hardware riscv64 runner to CI for performance-regression-free testing | 3 | RISE (runner infrastructure) | Medium |
| Ecosystem | Add differential-privacy to RISE Python wheel builder | 1 | RISE | Medium |
| Ecosystem | Coordinate NumPy riscv64 manylinux wheel (prerequisite for above) | 0 (tracked externally) | NumPy upstream / RISE | High (prerequisite) |
| Ecosystem | Build protoc for riscv64 and publish to Maven Central (for Java/Kotlin users) | 0 (tracked externally) | Protocol Buffers upstream | Medium |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/differential-privacy repository](https://github.com/google/differential-privacy)
- [differential-privacy PyPI package](https://pypi.org/project/differential-privacy/)
- [differential-privacy CI: bazel.yml](https://github.com/google/differential-privacy/blob/main/.github/workflows/bazel.yml)
- [differential-privacy CI: go.yml](https://github.com/google/differential-privacy/blob/main/.github/workflows/go.yml)
- [differential-privacy CI: maven.yml](https://github.com/google/differential-privacy/blob/main/.github/workflows/maven.yml)
- [differential-privacy CONTRIBUTING.md](https://github.com/google/differential-privacy/blob/main/CONTRIBUTING.md)
- [differential-privacy releases](https://github.com/google/differential-privacy/releases)
- [differential-privacy open issue #62: Add CMake support](https://github.com/google/differential-privacy/issues/62)
- [differential-privacy open issue #12: Support for RDRAND](https://github.com/google/differential-privacy/issues/12)
- [differential-privacy open issue #378: Sensitivity off by factor of 2](https://github.com/google/differential-privacy/issues/378)
- [abseil-cpp OPEN issue #2002: riscv64 test failures](https://github.com/abseil/abseil-cpp/issues/2002)
- [OpenSSL OPEN issue #20980: AES not constant-time without Zkn on riscv64](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL OPEN issue #22166: SSL test failures with high HARNESS_JOBS on riscv64](https://github.com/openssl/openssl/issues/22166)
- [OpenSSL OPEN issue #25334: Zknd/Zkne capability flags logic bug](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL OPEN issue #30880: test_lhash flaky on riscv64](https://github.com/openssl/openssl/issues/30880)
- [GoogleTest OPEN issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [NumPy OPEN issue #30216: manylinux riscv64 wheel distribution](https://github.com/numpy/numpy/issues/30216)
- [Protocol Buffers closed issue #17798: Maven riscv64 prebuilt deferred](https://github.com/protocolbuffers/protobuf/issues/17798)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE Python wheel builder package catalog](https://riseproject.gitlab.io/python/wheel_builder/)
- [Arch RISC-V port](https://archriscv.felixc.at)
- [Debian package tracker](https://tracker.debian.org)