---
title: libphonenumber
---

# libphonenumber

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libphonenumber<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libphonenumber is a phone number parsing, formatting, and validation library originally developed and maintained by Google. It implements the ITU-T E.164 standard and country-specific number formats through regex-based string matching. The canonical implementations are Java, C++, JavaScript, and Objective-C; a Go port is also maintained in-tree. No SIMD, no JIT, no assembly, and no architecture dispatch exist in any implementation.

**License:** Apache-2.0, with an additional `LICENSE.Chromium` file.

**Governance:** Closed "core libphonenumber team" composed entirely of Google employees. Active release maintainers as of July-August 2026: Kavitha Keshava (kkeshava), Rohini Nidhi (rohininidhi), and Mandli L (mandlil). The team uses a private mailing list. Bugs are filed on Google Issue Tracker, not GitHub Issues. Pull requests require a Google CLA. Metadata files (phone number data XML, geocoding/carrier mappings) are auto-generated and not accepted via PR.

**Copyright holders listed in AUTHORS:** Google Inc., Vonage Holdings Corp., Ian Galpin, Ben Gertzfield.

**Community ports:** Dozens of third-party language ports exist (Go, Rust, Python, C#, Ruby, Swift, Dart, Erlang, Elixir, PHP). Google explicitly disclaims these ports: it does not evaluate their quality or maintain them. No architecture-specific ports exist for any ISA.

**Windows build status:** The upstream team explicitly acknowledges Windows builds lack active maintenance. Community PRs are accepted only if a tester/reviewer volunteers.

**Stance on new ports:** Because the library has no ISA-specific code paths, RISC-V enablement requires no upstream code changes. Distribution packaging (Debian, Ubuntu) handles riscv64 transparently.

**RISE membership:** Google LLC is a RISE Premier Member. There is no indication that libphonenumber specifically participates in or benefits from that membership for RISC-V enablement. RISE project blog (31 posts, 2024-05 through 2026-08) contains zero mentions of libphonenumber. The RISE wheel builder (79 packages) does not list libphonenumber. RISE system-libraries-wg tracks 18 issues (FFmpeg, OpenBLAS, libjpeg-turbo, XNNPack, SLEEF, Eigen, dav1d, xsimd, x265, libopus, libflac); libphonenumber is not among them.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (ongoing) | Debian riscv64 binary `libphonenumber` built and installed via standard distro packaging; no upstream involvement | [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=libphonenumber) |
| (ongoing) | Ubuntu Noble lists riscv64 as a supported architecture for `libphonenumber8` and `libphonenumber-dev` | [Ubuntu packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libphonenumber&suite=noble&searchon=names&section=all) |

No RISC-V-specific commits, issues, or pull requests exist in the upstream repository. Exhaustive search across 10 vectors (GitHub issue search, PR search, commit search, code search, web search) returned zero results for "riscv" or "riscv64" in the [google/libphonenumber](https://github.com/google/libphonenumber) repository.

The absence of upstream RISC-V activity is expected: the library is architecturally portable C++11 and Java with no ISA-specific code to port. Distro packaging compiles it on riscv64 without modification.

**Key contributors to riscv64 availability:** Debian maintainers (anonymous, via standard packaging); no named upstream contributors.

---

## 3. Upstream Support Tier

**Formal tier policy:** None documented. The contributing guidelines state the team "works with a limited number of build systems and may not be able to support every setup."

**riscv64 in upstream CI:** Not present. All CI jobs run on `runs-on: ubuntu-latest` (x86_64). No architecture matrix, no QEMU, no cross-compilation. See Section 7 for detail.

**riscv64 in upstream releases:** Not present. Upstream GitHub releases are source-only (one asset per release: a GPG signature file for the source tarball). No binary artifacts for any architecture are shipped by upstream.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (ubuntu-latest) | No | No |
| Release-blocking | Yes | No | No |
| Official upstream binaries | Source only | Source only | Source only |
| Distro binary packages | Yes | Yes | Yes (Debian, Ubuntu Noble) |
| RISE CI runners | No | No | No |

**Assessment:** riscv64 is not a recognized tier in upstream's support model. The library compiles cleanly on riscv64 via standard toolchains, and distro packaging delivers functional binaries, but upstream neither tests nor ships riscv64 artifacts.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libphonenumber performs regex-based string matching against a compiled phone number metadata database. There are no compute-intensive numerical operations, no floating-point paths, no cryptographic primitives, and no memory-layout-sensitive data structures that require ISA-specific handling.

**Architecture-specific subsystem survey:**

- Assembly files: zero. Full repo tree scan (4,286 files) for `.S`, `.s`, `.asm` extensions returned zero results.
- SIMD intrinsics: zero. Searches for `#ifdef __riscv`, `#ifdef __x86_64`, `#ifdef __aarch64`, `endian`, `__builtin` all returned zero results.
- JIT compiler: none. The library is a pure parse/format library with no code generation.
- Architecture dispatch: none. No `arch/`, `simd/`, `jit/`, `neon/`, or `avx/` path segments exist anywhere in the repo.
- The only architecture string in the entire codebase is `set(CPACK_RPM_PACKAGE_ARCHITECTURE x86_64)` in `cpp/CMakeLists.txt`, which is a CPack RPM packaging metadata default, not a code path.

**Component quality table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Regex engine (ICU default) | scalar | scalar | scalar |
| Phone number parser (C++) | scalar | scalar | scalar |
| Phone number parser (Java) | scalar (JVM) | scalar (JVM) | scalar (JVM) |
| Geocoder | scalar | scalar | scalar |
| Python bindings (`phonenumbers` PyPI) | pure-Python | pure-Python | pure-Python |
| JavaScript port | scalar | scalar | scalar |

"Scalar" is the complete and correct implementation for all platforms, not a fallback. There is no higher-performance variant for any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

**C++ build (native, any architecture including riscv64 native):**

```sh
cd libphonenumber/cpp
mkdir build && cd build
cmake ..
make
./libphonenumber_test
```

CMake minimum: 3.11. C++ standard: C++11 (C++14 is safe and recommended). GCC 10+ or Clang 10+ is sufficient; both ship standard in Debian Bullseye and later for riscv64.

**Cross-compilation to riscv64 (from x86_64 host):**

No upstream-provided toolchain file or Dockerfile exists. The repo contains no `Dockerfile`, no `cmake/riscv64.cmake`, and no `.ci/docker/` directory. The following flags are required or recommended:

| CMake flag | Default | riscv64 note |
|---|---|---|
| `USE_BOOST=OFF` | ON | Avoids cross-compiling Boost; pthreads are auto-detected on Linux |
| `USE_STDMUTEX=ON` | OFF | Enables C++11 `std::mutex`; safe on any modern GCC/Clang targeting riscv64 |
| `REGENERATE_METADATA=OFF` | ON | Must be OFF for cross-compilation; requires host Java to regenerate, but pre-generated metadata is in-tree |
| `BUILD_GEOCODER=OFF` | ON | Recommended; requires a host-arch `generate_geocoding_data` binary |
| `BUILD_TESTING=OFF` | ON | Required unless gtest is also cross-compiled |
| `USE_ICU_REGEXP=ON` | ON | Default; requires cross-built `libicuuc` and `libicui18n` in sysroot |
| `USE_LITE_METADATA=ON` | OFF | Optional; reduces binary size; useful for embedded riscv64 targets |

Minimum viable cross-compile invocation:

```sh
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-linux-gnu.cmake \
  -DPROTOC_BIN=/usr/bin/protoc \
  -DPROTOBUF_INCLUDE_DIR=/sysroot/usr/include \
  -DPROTOBUF_LIB=/sysroot/usr/lib/riscv64-linux-gnu/libprotobuf.so \
  -DICU_UC_INCLUDE_DIR=/sysroot/usr/include \
  -DICU_UC_LIB=/sysroot/usr/lib/riscv64-linux-gnu/libicuuc.so \
  -DICU_I18N_INCLUDE_DIR=/sysroot/usr/include \
  -DICU_I18N_LIB=/sysroot/usr/lib/riscv64-linux-gnu/libicui18n.so \
  -DUSE_BOOST=OFF \
  -DUSE_STDMUTEX=ON \
  -DREGENERATE_METADATA=OFF \
  -DBUILD_GEOCODER=OFF \
  -DBUILD_TESTING=OFF
```

Note: `protoc` (the protobuf code generator) must be the host-architecture binary, version-matched to the target `libprotobuf`. Cross-compile scenarios require either a distro sysroot or manual cross-build of protobuf and ICU.

**QEMU:** Not referenced anywhere in the repo. If running the test binary on a cross-build host is needed, standard `qemu-riscv64-static` can be used. Not set up by upstream.

**Known cross-compilation issue (open):** Issue [#2604](https://github.com/google/libphonenumber/issues/2604) (open) addresses the pattern where the geocoding tool must be compiled for the host architecture when cross-compiling. No riscv64-specific mention, but directly relevant to riscv64 cross-compile scenarios.

**Debian packaging approach:** `debian/control` marks `Architecture: any` for C++ packages. The Debian `rules` file uses standard `cmake -DCMAKE_INSTALL_PREFIX=/usr` with no arch-specific flags, relying on `DEB_HOST_MULTIARCH` for multiarch library directory placement. No riscv64-specific patches exist in `debian/patches/`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Phone number parsing (C++) | Yes | Yes | Yes | None |
| Phone number parsing (Java) | Yes | Yes | Yes | None |
| Phone number formatting | Yes | Yes | Yes | None |
| Geocoding | Yes | Yes | Yes | None |
| Carrier lookup | Yes | Yes | Yes | None |
| Short number info | Yes | Yes | Yes | None |
| Python `phonenumbers` (PyPI) | Yes | Yes | Yes | None |
| ICU regexp backend | Yes | Yes | Yes | None |
| RE2 regexp backend (optional) | Yes | Yes | Yes [NEEDS VERIFICATION] | None expected |
| Cross-compilation | Yes | Yes | Partial (no upstream toolchain file) | Toolchain file must be user-provided |

**Functional gaps:** None. Every feature available on amd64 and arm64 is available on riscv64.

**Performance gaps:** No architecture-specific optimizations exist for any platform. No SIMD, no hand-tuned paths. Performance on riscv64 is expected to be equivalent to arm64 and amd64 at the same clock frequency and pipeline depth, modulo compiler code generation quality. No measured data is available.

**Security hardening gaps:** Data not available: no security hardening audit for riscv64 specifically was found in the research findings. The C++ library has open security-relevant correctness bugs (see Section 11) that affect all platforms equally.

**Floating-point:** Not applicable. The library performs no floating-point operations.

---

## 7. CI/CD Infrastructure

All 6 workflow files in `.github/workflows/` were read in full. The string "riscv" does not appear in any of them.

| Workflow file | Trigger | Runner | riscv64 | Notes |
|---|---|---|---|---|
| `cpp-unit-test.yml` | pull_request | ubuntu-latest (x86_64) | No | Builds C++ with CMake and runs `libphonenumber_test` |
| `java-unit-test.yml` | pull_request | ubuntu-latest (x86_64) | No | Runs Maven + Ant tests |
| `codeql.yml` | push/PR to master, weekly | ubuntu-latest (x86_64) | No | Language matrix: java, javascript only |
| `dependency-review.yml` | pull_request | ubuntu-latest (x86_64) | No | Security scan only, no build |
| `osv-scanner-unified.yml` | PR/push to master, weekly | (delegates to reusable workflow) | No | Supply chain scan only |
| `scorecards.yml` | push to master, weekly | ubuntu-latest (x86_64) | No | Supply chain security only |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` is present in the repository.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build tested in CI | Yes | No | No |
| Tests run in CI | Yes | No | No |
| RISE-provided runner | No | No | No |
| QEMU emulation in CI | No | No | No |
| Release-blocking CI | Yes | No | No |

**Summary:** riscv64 CI does not exist upstream. Distro build farms (Debian buildd `rv-manda-02`, Ubuntu) provide the only automated riscv64 build verification.

---

## 8. Distribution and Release Status

**Upstream releases ([github.com/google/libphonenumber/releases](https://github.com/google/libphonenumber/releases)):**
Releases v9.0.33 through v9.0.37 (latest as of research date) each contain exactly one asset: a GPG signature file for the source tarball (e.g., `libphonenumber-9.0.37.tar.gz.asc`). No compiled binaries for any architecture.

**PyPI:**
The Python binding is published as [`phonenumbers`](https://pypi.org/project/phonenumbers/) (not `libphonenumber`; that name returns HTTP 404 on PyPI). Latest version: 9.0.37. All releases provide a pure-Python wheel (`py2.py3-none-any`) plus a source tarball. No compiled C extension. Works on riscv64 without any architecture-specific build.

**Debian (sid):**
[`libphonenumber` on Debian buildd](https://buildd.debian.org/status/package.php?p=libphonenumber) shows riscv64 status: **Installed**, version **8.13.51+ds-6+b3**, built on buildd `rv-manda-02`. All major architectures show Installed.

**Ubuntu 24.04 Noble:**
[packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libphonenumber&suite=noble&searchon=names&section=all) lists `libphonenumber8` and `libphonenumber-dev` at version 8.12.57+ds-4.2build3 with riscv64 explicitly listed among supported architectures alongside amd64, arm64, armhf, ppc64el, and s390x.

**Fedora/RPM:** Data not available: Fedora riscv64 package status was not searched.

**Arch Linux RISC-V:** Not confirmed. The [archriscv.felixc.at](https://archriscv.felixc.at/?q=libphonenumber) search page returned no package listings (results truncated or absent).

**What a user must do to get a working binary on riscv64:**
- On Debian or Ubuntu: `apt install libphonenumber-dev` -- binary package available with no additional steps.
- Python users: `pip install phonenumbers` -- pure-Python wheel, works on riscv64 out of the box.
- From source: standard CMake build as described in Section 5, with standard riscv64 toolchain and sysroot packages for protobuf and ICU.

---

## 9. Dependencies

**C++ library dependencies** (from `cpp/CMakeLists.txt`). The Java library is pure-Java with zero native dependencies.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Open Issues |
|---|---|---|---|---|---|
| Abseil-cpp | Core hash maps (`absl::node_hash_set`), string utilities, synchronization. Always required; auto-fetched at commit `273292d` if not system-installed. | Builds | Partial failures | Packaged in distros | 2 open riscv64 test SEGFAULTs (#2002, Debian-specific); 1 open cross-toolchain linker failure (#1702); 1 open PR for hardware CRC32C for Zbc/Zbkc ISA extension (#1986). See `reports/abseil-cpp.md`. |
| Protocol Buffers (protobuf) | Serialization of all phone number metadata. `libprotobuf` or `libprotobuf-lite` linked at build time; `protoc` required on host at build time. | Builds | Passes | Official riscv64 `protoc` prebuilt merged 2025-08 | All riscv64 issues closed: #12266 (linux/riscv64 support, closed 2024-03), #23206 (protoc prebuilts for riscv64, closed 2025-08), #17798 (Maven central protoc riscv64, closed 2024-09). No open issues. See `reports/protocol-buffers.md`. |
| ICU (libicuuc + libicui18n) | Unicode string handling; default regexp engine (`USE_ICU_REGEXP=ON`). Required. | Builds | Passes | Packaged | No riscv64-specific open issues. See `reports/icu.md`. |
| RE2 | Optional alternative regexp engine. Not used by default (`USE_RE2=OFF`). | Builds | Passes | N/A (optional) | Zero riscv64 issues found. Not in the critical path. |
| Boost (date_time, system, thread) | Threading/synchronization backend. Default ON in CMakeLists; replaceable by `-DUSE_STDMUTEX=ON` or `-DUSE_POSIX_THREAD=ON`. | Builds | N/A | Packaged | Zero riscv64 issues found. Not a hard blocker; can be disabled for cross-compilation. |
| GoogleTest | Test-only dependency. Not linked into the shipped library. | Builds | Partial | N/A (test only) | Issue #3756 (open, 2022, stale): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64. Does not block library functionality. See `reports/googletest.md`. |

**Critical dependency assessment:**

Abseil-cpp is the only dependency with active unresolved riscv64 issues affecting released packages. The two open test SEGFAULTs (#2002, filed 2026-02) are Debian-specific and may reflect a toolchain or kernel difference rather than an Abseil defect, but they are unresolved. The cross-toolchain linker failure (#1702) is a cross-compilation edge case with the bootlin toolchain. Neither blocks `libphonenumber` functionality when building with the Debian/Ubuntu system Abseil package.

Protocol Buffers riscv64 support is fully resolved as of 2025; `protoc` prebuilt binaries for riscv64 are available.

ICU and RE2 have no known riscv64 issues.

---

## 11. Known Bugs and Active Issues

No riscv64-specific issues exist in the upstream tracker. The following open issues affect riscv64 equally with all other platforms:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3987](https://github.com/google/libphonenumber/issues/3987) | ReDoS in RFC3966 domain validation; integer underflow in `AllNumberGroupsAreExactlyPresent()` | Open | High | C++ only. `rfc3966_domainlabel_`/`rfc3966_toplabel_` regex patterns have O(N^2) backtracking via ICU NFA engine on adversarial inputs. `candidate_groups.size() - 1` on empty vector underflows `size_t`, producing undefined behavior. Affects riscv64 equally. |
| [#3991](https://github.com/google/libphonenumber/issues/3991) | Incomplete bounds check in `UnicodeString::tempSubString()` (`cpp/src/phonenumbers/unicodestring.cc:91`) | Open | High | Reported under Google OSS VRP as a potential information leak. Affects riscv64 equally. |
| [#3974](https://github.com/google/libphonenumber/issues/3974) | C++ `ParseHelper()` missing `MAX_INPUT_STRING_LENGTH` (250 char) check present in Java and JS | Open | Medium | Unbounded input reaches ICU regex, can cause excessive CPU. C++ only. |
| [#3903](https://github.com/google/libphonenumber/issues/3903) | Build failure with Boost 1.89.0 (removed Boost.System stub library) | Open | Medium | Affects CMake builds on all platforms including riscv64 when Boost is not disabled. Workaround: `-DUSE_BOOST=OFF -DUSE_STDMUTEX=ON`. |
| [#3134](https://github.com/google/libphonenumber/issues/3134) | RE2 2023-07-01 compatibility break | Open | Low | RE2 is the non-default regexp backend. Debian riscv64 uses ICU by default; affects only custom builds with `-DUSE_RE2=ON`. |
| [#2604](https://github.com/google/libphonenumber/issues/2604) | Cross-compilation support: geocoding tool must be compiled for host architecture | Open | Low | Directly relevant to riscv64 cross-compile scenarios. No explicit riscv64 mention in the issue. |
| [#3213](https://github.com/google/libphonenumber/issues/3213) | CMake dependency config improvements (`find_package(absl CONFIG)`, `find_package(Protobuf CONFIG)`) | Open | Low | Required for proper out-of-tree builds on any architecture. |

**Correctness bugs requiring attention:** #3987 (ReDoS + integer underflow) and #3991 (bounds check / information leak) are the highest-severity open issues and affect C++ deployments on all architectures including riscv64.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**
- The core team is closed (Google employees only) with a private mailing list. External contributors cannot influence priorities.
- Issues are tracked on Google Issue Tracker, not GitHub, which limits external visibility.
- Metadata PRs are not accepted via GitHub; metadata is auto-generated internally.

**Technical blockers for riscv64:**
None. The library has no ISA-specific code. No upstream work is required to support riscv64.

**Objections to riscv64 CI:**
No stated objections found. The team has not discussed riscv64 CI in any tracked forum (GitHub issues, PRs, or public mailing list). Given that the project currently has no arm64 CI either, adding riscv64 CI would require adding architecture-specific runners or QEMU emulation to the existing ubuntu-latest-only workflow.

**Acceptance probability for a riscv64 CI PR:** Unknown. No precedent exists for architecture-expansion PRs in this repository. The team's stated policy is to work with a limited set of build systems and may not commit to maintaining additional CI runners.

---

## 13. Investment Analysis

RISE has no current involvement with libphonenumber (confirmed: zero RISE blog posts, zero RISE wheel builder entries, zero RISE WG issues). No work has already been funded or completed.

### 13.1 Functional Enablement

No functional enablement work is required. The library compiles cleanly on riscv64 via standard toolchains. Debian and Ubuntu already ship riscv64 binary packages. The Python `phonenumbers` package is pure-Python and requires no architecture-specific work.

The only actionable item is the open cross-compilation support issue (#2604), which affects riscv64 cross-build scenarios but does not block native riscv64 builds.

### 13.2 Performance Optimization

No performance optimization work is warranted. The library contains no SIMD, no JIT, and no architecture-specific fast paths for any platform. There is no measured performance gap between architectures, and no architectural optimization opportunity is visible in the codebase.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI requires:
1. A QEMU or native riscv64 runner in GitHub Actions.
2. A workflow matrix addition to `cpp-unit-test.yml` and `java-unit-test.yml`.
3. Upstream acceptance of the PR (probability unknown; no precedent in this repo).

This is a low-complexity code change. Upstream adoption is the constraint.

### 13.4 Ecosystem Enablement

The Python `phonenumbers` package requires no riscv64-specific work (pure-Python wheel). No other package ecosystem requires architecture-specific enablement for this project.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream toolchain file for riscv64 cross-compilation (addresses #2604) | 0.5 | Distro / community | Low |
| CI/CD | Add riscv64 QEMU runner to `cpp-unit-test.yml` and `java-unit-test.yml`; upstream PR | 1 | RISE / community | Low |
| Security | Fix open correctness bugs #3987 (ReDoS + integer underflow) and #3991 (bounds check) -- architecture-neutral | 2-3 | Google core team (must accept PR) | Medium (all platforms) |
| Functional | No work required; library is architecture-agnostic and already packaged in Debian/Ubuntu | 0 | N/A | N/A |

**Total riscv64-specific investment: 1-2 person-weeks.** The library is already functional on riscv64. The only incremental value of investment is upstream CI coverage, which requires a low-complexity PR and upstream acceptance.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/libphonenumber GitHub repository](https://github.com/google/libphonenumber)
- [libphonenumber GitHub releases (v9.0.33-v9.0.37)](https://github.com/google/libphonenumber/releases)
- [phonenumbers on PyPI (Python binding)](https://pypi.org/project/phonenumbers/)
- [libphonenumber on Debian buildd tracker](https://buildd.debian.org/status/package.php?p=libphonenumber)
- [libphonenumber on Ubuntu Noble (packages.ubuntu.com)](https://packages.ubuntu.com/search?keywords=libphonenumber&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V package search (archriscv.felixc.at)](https://archriscv.felixc.at/?q=libphonenumber)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE project blog archive](https://riseproject.dev/category/blog/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [cpp/CMakeLists.txt (C++ build system)](https://github.com/google/libphonenumber/blob/master/cpp/CMakeLists.txt)
- [.github/workflows/cpp-unit-test.yml](https://github.com/google/libphonenumber/blob/master/.github/workflows/cpp-unit-test.yml)
- [.github/workflows/java-unit-test.yml](https://github.com/google/libphonenumber/blob/master/.github/workflows/java-unit-test.yml)
- [.github/workflows/codeql.yml](https://github.com/google/libphonenumber/blob/master/.github/workflows/codeql.yml)
- [Issue #3987 - ReDoS and integer underflow in C++ library](https://github.com/google/libphonenumber/issues/3987)
- [Issue #3991 - Bounds check in UnicodeString::tempSubString()](https://github.com/google/libphonenumber/issues/3991)
- [Issue #3974 - Missing MAX_INPUT_STRING_LENGTH check in C++ ParseHelper()](https://github.com/google/libphonenumber/issues/3974)
- [Issue #3903 - Build failure with Boost 1.89.0](https://github.com/google/libphonenumber/issues/3903)
- [Issue #2604 - Cross-compilation support (geocoding tool host/target split)](https://github.com/google/libphonenumber/issues/2604)
- [Issue #3134 - RE2 2023-07-01 compatibility break](https://github.com/google/libphonenumber/issues/3134)
- [Issue #3213 - CMake dependency config improvements](https://github.com/google/libphonenumber/issues/3213)
- [Abseil-cpp riscv64 status (internal cross-reference)](../reports/abseil-cpp.md)
- [Protocol Buffers riscv64 status (internal cross-reference)](../reports/protocol-buffers.md)
- [ICU riscv64 status (internal cross-reference)](../reports/icu.md)
- [GoogleTest riscv64 status (internal cross-reference)](../reports/googletest.md)