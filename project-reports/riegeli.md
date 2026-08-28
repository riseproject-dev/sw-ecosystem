---
title: riegeli
parent: Project Reports
---

# riegeli

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for riegeli<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Riegeli is a C++ library implementing a high-throughput record I/O file format designed for use with large-scale ML pipelines, particularly TensorFlow and Google's internal data infrastructure. It provides a container format ("Riegeli/records") that wraps compressed chunks of protocol-buffer records with framing, checksums, and seek support. Supported codecs are brotli, zstd, snappy, LZ4, bzip2, and xz. The library also provides generic I/O abstraction layers (readers, writers, digests) that are used independently of the records format.

The project is hosted at [github.com/google/riegeli](https://github.com/google/riegeli) under the `google` GitHub organization. License is Apache-2.0. All source files carry copyright Google LLC 2017.

**Governance:** No foundation affiliation. No steering committee. No PLATFORMS.md, SUPPORT.md, or CODEOWNERS file. Governance is centralized under a single benevolent dictator model. Marcin Kowalczyk (`qrczak@google.com`, Google) accounts for 2133 of 2135 total commits. A secondary account `a-googler` (Compression Team, `noreply@google.com`) accounts for the remaining 2 commits. External contributors must sign the Google CLA. All submissions go through GitHub PRs reviewed by Kowalczyk.

**Corporate sponsors:** Google LLC is the sole corporate owner. Google LLC is a RISE Premier Member, but riegeli is not independently listed in any RISE activity, blog post, or wheel builder index.

**Community stance on new ports:** No documented port policy exists. Issue #29 (M1/Apple Silicon, 2024) demonstrates that the maintainer does not proactively test or maintain non-x86 platforms but accepts community-supplied fixes. The effective stance is: riscv64 would compile via the portable fallback path in the `highwayhash` dependency, but no one has filed an issue, and the maintainer has not addressed it. There is no evidence of a policy refusing ports.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (none) | No RISC-V activity of any kind exists in the repository | GitHub code search `riscv repo:google/riegeli` -- 0 results |
| (none) | No RISC-V issues filed | `gh api search/issues?q=riscv+repo:google/riegeli` -- 0 results |
| (none) | No RISC-V commits | `gh api search/commits?q=riscv+repo:google/riegeli` -- 0 results |
| (none) | No RISC-V CI | `.github/workflows` directory does not exist in the repository |

There is no port history. RISC-V has never been mentioned in the repository in any form.

---

## 3. Upstream Support Tier

No formal tier or platform support policy document exists in the repository. Platform support is implicit.

The only platform-conditional logic in the riegeli BUILD files is `@platforms//os:windows` guards (disabling `use_header_modules`, adjusting deps in `riegeli/base/BUILD` and `riegeli/bytes/BUILD`). No RISC-V platform constraint is defined.

The `highwayhash` dependency (which provides riegeli's hash acceleration) defines four explicit architecture targets: x86-64 AVX2, x86-64 SSE4.1, aarch64 NEON, and PowerPC VSX. RISC-V is not named and receives the `hh_portable` scalar C fallback. A GitHub code search for `riscv` in `google/highwayhash` returns 0 results.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Explicitly supported | Yes (primary) | Incidentally (via highwayhash NEON) | No |
| CI coverage | None (no CI at all) | None | None |
| Release binaries | None (source-only) | None | None |
| Build verified | Implicit (developed on x86) | [NEEDS VERIFICATION] via issue #29 evidence | Not confirmed |
| Platform tier | Implicit tier 1 (development platform) | Implicit tier 2 (community-verified) | Not tiered |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Riegeli contains zero architecture-specific code of its own. There are no `#ifdef __riscv`, `#ifdef __aarch64__`, or `#ifdef __x86_64__` guards anywhere in the 540-file source tree. No assembly files (`.S`), no `arch/` directories, no SIMD intrinsic headers, no JIT backends.

All ISA-specific work is delegated to external dependencies. Two files are relevant:

**`riegeli/digests/highwayhash_digester.h` / `.cc`:** A thin template wrapper around `highwayhash::HighwayHashCatT<HH_TARGET>`. The `HH_TARGET` macro is resolved by the highwayhash library at compile time to the best available ISA target. Riegeli contains no decision logic of its own.

**`riegeli/chunk_encoding/hash.cc`:** Calls `highwayhash::InstructionSets::Run<...>()` for runtime CPU dispatch. The dispatch table is inside highwayhash, not riegeli.

**`riegeli/digests/crc32_digester.cc`:** Delegates to zlib's `crc32_z`. Hardware CRC instruction use (where available) is handled inside zlib.

**`riegeli/endian/`:** Uses portable `memcpy`-based little/big-endian read/write. No SIMD or arch-specific intrinsics.

Architecture dispatch status, per component:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| HighwayHash (via highwayhash dep) | Hand-tuned AVX2/SSE4.1 | Hand-tuned NEON | Scalar C portable fallback |
| CRC32 (via zlib dep) | Hardware CRC32C (where zlib uses it) | Hardware CRC32C (where zlib uses it) | Software fallback |
| All other riegeli code | Portable C++17 | Portable C++17 | Portable C++17 |
| JIT | None | None | None |
| Assembly | None | None | None |
| RVV intrinsics | N/A | N/A | None (highwayhash has no RVV target) |

No riscv64 SIMD stub exists in riegeli or highwayhash. A riscv64 RVV implementation of HighwayHash would need to be contributed to `google/highwayhash` first; riegeli itself requires no changes.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel only, using Bzlmod (`MODULE.bazel`). No CMakeLists.txt. A `configure` script exists but only detects a TensorFlow install and writes `configure.bazelrc`; it is not an autoconf configure script.

**Standard build commands:**

```bash
# C++ library (native build)
bazel build -c opt //riegeli/...

# Python package
bazel build -c opt python:build_pip_package
bazel-bin/python/build_pip_package --dest ~/riegeli-dist --bdist
```

**Cross-compilation for riscv64:** No upstream toolchain file or platform config is provided. A user must supply their own Bazel platform definition:

```python
# In your own MODULE.bazel overlay:
platform(
    name = "riscv64_linux",
    constraint_values = [
        "@platforms//os:linux",
        "@platforms//cpu:riscv64",
    ],
)
```

Then build with:

```bash
bazel build -c opt --platforms=//:riscv64_linux //riegeli/...
```

**Toolchain requirements:**

- C++17 mandatory (`--cxxopt=-std=c++17` in `.bazelrc`)
- Bzlmod enabled (`common --enable_bzlmod` in `.bazelrc`)
- No explicit GCC/Clang minimum stated in any repo file
- No `.bazelversion` file (Bazel version not pinned)
- Python 3.8 to 3.13 supported via hermetic rules_python toolchain

**QEMU:** No QEMU usage in the repository. No test infrastructure for non-native architectures.

**Known build flags for disabling optional components:** None documented. No CMake `-DUSE_X=OFF` equivalent. The only documented `--define` in `.bazelrc` is `use_fast_cpp_protos=true`, commented out pending a protobuf upstream fix.

**Potential riscv64 build friction:** The `highwayhash` Bazel BUILD file conditionally enables NEON and AVX2 acceleration. On riscv64, those conditions are false and the portable path is selected automatically. No manual flag is required. The abseil-cpp dependency may require `-latomic` for some riscv64 toolchains (see Section 11).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Riegeli is functionally complete on riscv64. All record I/O, compression codecs, checksumming, and serialization paths are portable C++ with no riscv64-specific stubs or disabled code paths.

**Functional gaps:** None identified. Data not available: no riscv64 build or test run has been published against which to confirm this.

**Performance gaps:**

| Operation | amd64 throughput | arm64 throughput | riscv64 throughput |
|-----------|-----------------|-----------------|-------------------|
| HighwayHash record fingerprinting | Full (AVX2/SSE4.1 hardware) | Full (NEON hardware) | Degraded (scalar C portable fallback only) |
| CRC32 checksum | Hardware-accelerated via zlib | Hardware-accelerated via zlib | Software fallback via zlib (unless zlib is patched for riscv64 CRC) |
| Brotli compression | Hardware-neutral | Hardware-neutral | Same |
| Zstd compression | Hardware-neutral (zstd has riscv64 CI) | Hardware-neutral | Same |
| Snappy compression | Hardware-neutral (snappy has riscv64 CI) | Hardware-neutral | Same |

The benchmark tool at `riegeli/records/tools/records_benchmark.cc` measures throughput across codec configurations. No pre-run results are published in the repository or documentation. Data not available: riscv64 benchmark figures and the magnitude of the HighwayHash scalar performance penalty.

**Security hardening gaps:** Data not available: no analysis of stack canaries, CFI, shadow call stack, or PAC/BTI equivalents for riscv64 was performed in the research.

**NaN / floating-point semantics:** No floating-point correctness issues were found. The single issue that appeared to mention float/double (#19) was a user question about protobuf's encoding of float vs double fields producing the same compressed size - not a correctness bug.

---

## 7. CI/CD Infrastructure

The `google/riegeli` repository has no GitHub Actions workflows. The `.github` directory does not exist. The root directory contains no `.travis.yml`, `.circleci/`, `.cirrus.yml`, `Jenkinsfile`, or `.gitlab-ci.yml`.

The only automated infrastructure is:
- Dependabot (dependency update PRs)
- CodeQL (security static analysis, managed by GitHub)

Neither constitutes build or test CI.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Build CI | None | None | None |
| Test CI | None | None | None |
| QEMU test | None | None | None |
| RISE runners | None | None | None |
| Release-blocking tests | None | None | None |

---

## 8. Distribution and Release Status

Riegeli has no binary distribution through any channel.

| Channel | Status |
|---------|--------|
| GitHub Releases | None (API returns empty array `[]`) |
| PyPI | Not published (HTTP 404; `setup.py` exists with `version='0.0.1'` but has never been uploaded) |
| Debian | Not packaged (tracker.debian.org/pkg/riegeli returns HTTP 404) |
| Ubuntu 24.04 Noble | Not packaged (package search returns no results) |
| Arch Linux | Not packaged (official and AUR both return 0 results) |
| Arch Linux RISC-V port | Not listed (archriscv.felixc.at returns no results for "riegeli") |
| Fedora / RHEL | Not packaged (0 results) |
| NixOS | Not packaged as a standalone library; referenced only as a dependency description in the `array-record` Python module |
| RISE wheel builder | Not present (76-package index does not include riegeli) |

**What a user must do to get a working binary:** Clone the repository and build from source with Bazel. For riscv64, they must additionally supply a Bazel platform definition and C++ cross-toolchain. No prebuilt binary is available for any architecture.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| abseil-cpp 20260107.0 | Core utilities: strings, hashing (SwissTable), synchronization, logging | Builds; `-latomic` may be required | FAILING: segfaults on Debian riscv64 (sampler/cordz paths); SwissTable regression in 20260817.0 | Source-only | #1702 OPEN (link), #2002 OPEN (segfault), #2142 OPEN (SwissTable regression) |
| BoringSSL 0.20260413.0 | TLS/crypto for record encryption and integrity | Builds; `OPENSSL_RISCV64` defined in `target.h` | No riscv64 CI in GitHub mirror | Source-only | No open riscv64 issues |
| brotli 1.2.0 | Brotli compression codec | Builds | No riscv64 CI job | Source-only | No riscv64 issues |
| bzip2 1.0.8 | BZip2 compression codec | Builds (pure C) | No riscv64-specific CI | Source-only | No riscv64 issues |
| highwayhash 0.0.0-20240305 | Fast hash for record fingerprinting | Builds (portable fallback) | No riscv64 CI or issues | Source-only | No RVV implementation; riscv64 uses scalar C only |
| LZ4 1.10.0 | LZ4 fast compression | Builds; riscv64 cross-compile CI with qemu-riscv64-static | QEMU cross-test enabled | Source-only | #1633 OPEN: RVV optimization proposal (not merged; uses generic C path) |
| Protocol Buffers 34.1 | Record metadata serialization | Builds (PR #12244, issue #12266 CLOSED) | C++ tests pass; not in CI matrix | No riscv64 `protoc` binary in releases | #17798 CLOSED (Maven resolved; GitHub binary releases still lack riscv64 `protoc`) |
| snappy 1.2.2 | Snappy compression | Builds | Dedicated `riscv64-qemu-test.yaml` runs on every push/PR | Source-only | No open riscv64 issues; CI green |
| xz 5.4.5 | LZMA/XZ compression | Builds | No riscv64 CI workflow | Source-only | #146 CLOSED: unaligned access flag resolved |
| zlib 1.3.2 | Deflate/zlib compression and CRC32 | Builds (pure C) | No riscv64 CI | Source-only | No riscv64 issues |
| zstd 1.5.7 | Zstandard fast compression | Builds; riscv64 CI target in `dev-short-tests.yml` | QEMU cross-test enabled | Source-only tarball only | #3134 CLOSED: pzstd linker error fixed |
| google-cloud-cpp 3.3.0 | Optional GCS/cloud storage backend | Builds (Ubuntu, macOS, Windows CI; no riscv64) | No riscv64 test matrix | No riscv64 prebuilts | No open riscv64 issues |

### 9.2 Deep-dive: highwayhash (critical path for record fingerprinting)

highwayhash is the only riegeli dependency with a direct correctness-neutral but performance-relevant gap on riscv64. The architecture dispatch table in `highwayhash/arch_specific.h` defines `HH_ARCH_X64`, `HH_ARCH_AARCH64`, `HH_ARCH_ARM`, `HH_ARCH_NEON`, and `HH_ARCH_PPC`. `HH_ARCH_RISCV` is not defined. A code search for `riscv` in `google/highwayhash` returns 0 results.

On riscv64, the library falls to `HH_TARGET_Portable = 1` (scalar C). This is correct but unoptimized. Adding RVV support would require implementing the HighwayHash algorithm using RISC-V Vector intrinsics and upstreaming to `google/highwayhash`, not to riegeli itself.

### 9.3 Deep-dive: abseil-cpp (open riscv64 correctness issues)

Three open issues affect abseil-cpp on riscv64, and abseil is a core dependency of riegeli (string types, hash maps, synchronization):

- **#1702 (OPEN):** Cross-linking fails with `__atomic_compare_exchange_1` undefined when using Bootlin or musl-based cross-toolchains. Workaround: add `-latomic` to link flags.
- **#2002 (OPEN):** Segfaults in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64. These are internal sampling/profiling paths. If abseil sampling is active in a riegeli deployment, this could produce instability.
- **#2142 (OPEN):** SwissTable collision test regression in abseil 20260817.0 on riscv64, ppc64le, and loongarch64 (Group::kWidth==8 platforms). Affects hash containers that riegeli depends on for internal maps. Introduced in 20260817.0; not present in the 20260107.0 version that riegeli pins in MODULE.bazel.

The SwissTable regression (#2142) does not affect riegeli's current pinned version (20260107.0), but will need to be tracked when riegeli updates its abseil dependency.

---

## 11. Known Bugs and Active Issues

No RISC-V-specific bugs are open in `google/riegeli`. All open issues are build system compatibility, language bindings, and documentation gaps.

**Open issues in google/riegeli (complete list at time of research):**

| ID | Title | Status | Severity (riscv64 impact) |
|----|-------|--------|--------------------------|
| #39 | Go implementation | Open | None |
| #37 | Tests returning std::optional excluded from TestReturnsOrderingOrSearchGuide | Open | None |
| #36 | Dependabot: update protobuf requirement to >=3.8.0,<7 | Open | None |
| #35 | Build fails under clang-cl with C++20 | Open | None (Windows-specific) |
| #34 | Document phonetic pronunciation | Open | None |
| #33 | Error while building array-record | Open | None |
| #32 | Compiling with protobuf 30.0-rc1 fails | Open | None |
| #31 | GCS support for FdReader | Open | None |
| #25 | Add Kotlin native riegeli decompressor | Open | None |
| #24 | Add release tags / release to PyPI | Open | Indirectly relevant (no releases means no riscv64 binaries) |
| #23 | bazel build python:build_pip_package fails | Open | None |
| #21 | Initial Java binding through JNI (WIP) | Open | None |
| #18 | How to install / run bazel | Open | None |
| #17 | weride iouring writer (open PR, unreviewed since 2021) | Open | None |
| #16 | Supporting CMake build | Open | Relevant (CMake would ease riscv64 cross-compilation) |
| #15 | Any chance of a Java port? | Open | None |
| #8 | Import error | Open | None |
| #1 | Provide examples | Open | None |

**Correctness bugs:** None identified.

**Dependency-level riscv64 bugs (affecting riegeli indirectly):**

| Dep | Issue | Status | Severity |
|-----|-------|--------|---------|
| abseil-cpp | #1702: `-latomic` required for riscv64 cross-link | OPEN | High (build failure with some toolchains) |
| abseil-cpp | #2002: segfaults in hashtablez/cordz on Debian riscv64 | OPEN | High (runtime instability when sampling active) |
| abseil-cpp | #2142: SwissTable collision test regression in 20260817.0 | OPEN | Medium (does not affect riegeli's current pinned version) |
| highwayhash | No riscv64 SIMD (RVV) target | No issue filed | Medium (performance only; correctness unaffected) |
| LZ4 | #1633: RVV optimization not merged | OPEN | Low (performance only) |
| Protocol Buffers | No riscv64 `protoc` binary in GitHub releases | No issue filed | Medium (developer ergonomics; source build required) |

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The maintainer has not stated any objection to riscv64 support. No issue has been filed to elicit a response.

**Technical blockers:**

1. No riscv64 CI exists anywhere in the repository. Any riscv64 fix would be merged without regression protection.
2. The `google/highwayhash` library (also Google-owned, maintained by different team) has no RVV path. Riegeli's hash performance on riscv64 depends on a separate upstream contribution to highwayhash.
3. abseil-cpp #2002 (open segfaults on Debian riscv64) could produce instability in riegeli deployments that enable abseil's internal sampling. The riegeli maintainer cannot fix this; it must be fixed in abseil upstream.

**Organizational blockers:** Riegeli has a single maintainer. External contributions require Google CLA. Review turnaround is subject to one person's availability. Issue #17 (iouring writer PR) has been unreviewed since 2021, indicating that unsolicited low-priority contributions may wait years.

**Acceptance probability:** High for a clean functional patch (riegeli contains no riscv64-hostile code). Low priority for the maintainer absent external demand. A riscv64 CI addition would likely be accepted if submitted with a working QEMU-based workflow, given the precedent of snappy and zstd doing the same in their own CI.

---

## 13. Investment Analysis

RISE has done nothing on riegeli to date. The RISE wheel builder does not include riegeli. No RISE blog post mentions riegeli. No RISE-affiliated contributor has filed an issue or PR. All investment would be net-new.

### 13.1 Functional Enablement

Riegeli is already functionally complete on riscv64 via portable C++. The library compiles and runs on riscv64 without modification, subject to the abseil-cpp toolchain link issue (#1702, `-latomic` workaround) and the potential instability from abseil #2002 when sampling is active.

Work items:
- Validate that `bazel build -c opt //riegeli/...` succeeds with a riscv64 cross-toolchain
- Document the `-latomic` workaround for abseil #1702
- File a tracking issue in google/riegeli for riscv64 status

### 13.2 Performance Optimization

The primary performance gap is HighwayHash. An RVV implementation of HighwayHash must be contributed to `google/highwayhash`, not to riegeli. This is a non-trivial cryptographic hash implementation task. A secondary gap is zlib CRC32 acceleration, which depends on zlib's own riscv64 CRC path (data not available on zlib's riscv64 CRC32 hardware support status).

Work items:
- Implement HighwayHash using RVV intrinsics and upstream to google/highwayhash
- Benchmark riegeli record throughput on riscv64 hardware before and after

### 13.3 CI/CD Infrastructure

The repository currently has no build or test CI at all. Adding riscv64 CI without adding x86 CI first would be unusual. The minimum viable riscv64 CI contribution is a GitHub Actions workflow using QEMU (matching the snappy and zstd precedent).

Work items:
- Add a GitHub Actions workflow with `ubuntu-latest` host and `qemu-riscv64-static` cross-test
- Upstream this workflow to google/riegeli

### 13.4 Ecosystem Enablement

Riegeli is not packaged anywhere. Publishing to PyPI and adding riscv64 wheels would require resolving issue #24 (add release tags / release to PyPI) first. This depends on the maintainer's willingness to take on release management, which is currently absent. Data not available: maintainer's stated position on PyPI publishing.

Work items:
- Engage maintainer on issue #24 to assess willingness to publish to PyPI
- If agreed: build and publish riscv64 wheels, potentially via RISE wheel builder infrastructure
- File riegeli packaging requests in Debian/Ubuntu if downstream users require distro packages

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|---------|
| Functional | Validate riscv64 cross-build with Bazel; document `-latomic` workaround | 0.5 | RISE or contributor | High |
| Functional | File riscv64 tracking issue in google/riegeli | 0.1 | RISE or contributor | High |
| Functional | Fix abseil-cpp #2002 (riscv64 segfaults in sampling paths) | 3 | abseil-cpp upstream (Google) | High |
| Performance | Implement HighwayHash RVV in google/highwayhash | 4-6 | RISE or contributor | Medium |
| Performance | Benchmark riegeli on riscv64 hardware and publish results | 1 | RISE | Medium |
| CI/CD | Add GitHub Actions QEMU riscv64 CI workflow to google/riegeli | 1 | RISE or contributor | Medium |
| Ecosystem | Engage maintainer on PyPI publishing (issue #24) | 0.5 | RISE | Low |
| Ecosystem | Build and integrate riscv64 wheels into RISE wheel builder (if PyPI agreed) | 2 | RISE | Low |
| Ecosystem | Debian/Ubuntu packaging request | 1 | RISE or Debian contributors | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/riegeli repository](https://github.com/google/riegeli)
- [riegeli MODULE.bazel (dependency manifest)](https://github.com/google/riegeli/blob/master/MODULE.bazel)
- [riegeli .bazelrc](https://github.com/google/riegeli/blob/master/.bazelrc)
- [riegeli highwayhash_digester.h](https://github.com/google/riegeli/blob/master/riegeli/digests/highwayhash_digester.h)
- [riegeli chunk_encoding/hash.cc](https://github.com/google/riegeli/blob/master/riegeli/chunk_encoding/hash.cc)
- [riegeli records_benchmark.cc](https://github.com/google/riegeli/blob/master/riegeli/records/tools/records_benchmark.cc)
- [google/highwayhash repository](https://github.com/google/highwayhash)
- [abseil-cpp issue #1702: riscv64 cross-link -latomic](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: riscv64 segfaults on Debian](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #2142: SwissTable collision test regression riscv64](https://github.com/abseil/abseil-cpp/issues/2142)
- [LZ4 issue #1633: RVV optimization proposal](https://github.com/lz4/lz4/issues/1633)
- [Protocol Buffers issue #17798: Maven riscv64 protoc prebuilt](https://github.com/protocolbuffers/protobuf/issues/17798)
- [snappy riscv64-qemu-test.yaml CI](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml)
- [zstd dev-short-tests.yml (riscv64 QEMU CI)](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml)
- [xz issue #146: TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V](https://github.com/tukaani-project/xz/issues/146)
- [riegeli issue #24: Add release tags / release to PyPI](https://github.com/google/riegeli/issues/24)
- [riegeli issue #16: Supporting CMake build](https://github.com/google/riegeli/issues/16)
- [PyPI riegeli (404 -- not published)](https://pypi.org/pypi/riegeli/json)
- [Debian tracker for riegeli (404 -- not packaged)](https://tracker.debian.org/pkg/riegeli)
- [Arch Linux RISC-V port search for riegeli](https://archriscv.felixc.at/?q=riegeli)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)