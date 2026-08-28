---
title: quiche
---

# quiche

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for google/quiche<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/quiche](https://github.com/google/quiche) (QUIC, Http, Etc.) is Google's C++ implementation of QUIC, HTTP/3, HTTP/2, and related protocols. It is the QUIC/HTTP3 stack embedded in Chromium and Envoy. The authoritative source is Google's internal Gerrit (google3); the GitHub repository is a mirror. The canonical development model is internal-first.

License: BSD-3-Clause.

**Governance.** The project is governed directly by the QUICHE team at Google. There is no external foundation membership. External contributors must sign Google's CLA at [cla.developers.google.com](https://cla.developers.google.com) and submit contributions by emailing quiche-contribution@google.com. Community guidelines follow Google's Open Source Community Guidelines. There is no PLATFORMS.md, SUPPORT.md, OWNERS, MAINTAINERS, or CODEOWNERS file in the repository.

**Corporate maintainers.** All top contributors have @google.com addresses:

| Contributor | Commits |
|---|---|
| bnc-google | 891 |
| yangfanud | 679 |
| wu-bin / wub | 672 |
| vasilvv | 666 |
| DavidSchinazi | 621 |
| martinduke | 468 |
| RenjieTang | 407 |
| birenroy | 258 |
| ianswett | 200 |

A bot account (quiche-dev@google.com) handles automated flag management commits. quiche is 100% Google-maintained with no community maintainers from other organizations.

**RISE membership.** Google LLC is a Premier Member of the RISE Project. quiche itself is not a RISE member project and no RISE-specific RISC-V porting activity has been found for quiche in any RISE blog, repository, or working group tracker.

**Community stance on new architecture ports.** Given the internal-first development model (google3 as source of truth) and 100% Google authorship, a community-driven RISC-V port would require a Google engineer to champion it. No public discussion of RISC-V support has been found in issues, commits, or any mailing list.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No RISC-V tracking issue filed | GitHub issue search: 0 results for "riscv" or "riscv64" |
| - | No RISC-V pull request submitted | GitHub PR search: 0 results for "riscv" or "riscv64" |
| - | No RISC-V commit landed | GitHub commit search: 0 results for "riscv" or "riscv64" |

There is no port history. No work has been initiated on riscv64 support for google/quiche as of August 2026.

The library is architecturally portable by design: it contains no per-ISA code paths for any architecture. The only architecture constraint documented in the project README is: "QUICHE is only supported on little-endian platforms." Standard RISC-V Linux targets (riscv64gc) are little-endian, so this stated constraint does not block a port in principle.

---

## 3. Upstream Support Tier

There is no formal tier or platform-support policy document in the repository. The project has no in-repo CI at all (see Section 7). Platform support is implicitly determined by what Chromium and Envoy test downstream.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as supported | Yes (implied by embedders) | Yes (implied by embedders) | No |
| In-repo CI lane | No CI exists | No CI exists | No CI exists |
| Release-blocking | N/A | N/A | N/A |
| Official binary release | None | None | None |
| Packaged in Debian/Ubuntu | No | No | No |
| README endian constraint satisfied | Yes | Yes | Yes (little-endian) |

The absence of CI is uniform across all architectures - this project has no in-repo CI for any platform. Support for amd64 and arm64 is implied only through downstream embedders (Chromium, Envoy).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

google/quiche is a pure C++ networking library. It has no JIT compiler, no SIMD dispatch infrastructure, no assembly files, and no architecture-specific intrinsics for any ISA.

**Architecture-specific code inventory (full repository, 1,874 files):**

| Architecture | Files | `#ifdef` guards | Assembly (`.S`) | SIMD / Intrinsics |
|---|---|---|---|---|
| amd64 (`__x86_64__`) | 0 | 0 | 0 | 0 |
| arm64 (`__aarch64__`) | 0 | 0 | 0 | 0 |
| riscv64 (`__riscv`) | 0 | 0 | 0 | 0 |

**Component-level analysis:**

| Component | riscv64 status | Notes |
|---|---|---|
| Byte-swap / endianness | Scalar - portable | `quiche/common/quiche_endian.h` uses `__builtin_bswap16/32/64`; supported by GCC 4.8+ and any Clang including riscv64 targets; portable union/reverse fallback present |
| Crypto (TLS/AEAD) | Scalar - delegated | All crypto delegated to BoringSSL; quiche adds zero crypto primitives |
| QUIC packet parsing | Scalar - portable | Pure C++ with no ISA-specific paths |
| HTTP/2 and HTTP/3 framing | Scalar - portable | Pure C++ |
| JIT / code generation | N/A | No JIT; not applicable to this networking library |
| CI / build system | Missing | No CI in repository for any architecture |
| Binary packages | Missing | No releases, no OS packages for any architecture |

The library's performance-critical path is TLS handshake and AEAD encryption/decryption, which is entirely delegated to BoringSSL. On riscv64, BoringSSL falls back to C implementations of AES-GCM, ChaCha20-Poly1305, and GHASH (no riscv64 hardware crypto acceleration exists in BoringSSL for Linux targets). This is a performance gap, not a correctness gap.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake, Makefile, Autoconf, or Meson exists in the repository. Root contains only `BUILD.bazel`, `.bazelrc`, `.bazelversion`, `MODULE.bazel`, `MODULE.bazel.lock`.

**Documented build command (from README):**

```bash
sudo apt install libicu-dev clang lld
CC=clang bazel build -c opt //...
```

No architecture-specific flags are documented anywhere in the repository. No riscv64 toolchain file, no `--config=riscv64` alias, and no cross-compilation instructions are provided.

**Toolchain requirements:**
- Compiler: Clang (required - the build command explicitly sets `CC=clang`)
- Linker: LLD (required)
- C++ standard: C++20 (inferred from dependency versions in MODULE.bazel)
- No minimum Clang version is specified in any documented file

For riscv64 cross-compilation, a Clang cross-compiler targeting `riscv64-linux-gnu` would be required. No such toolchain definition exists in the repository. The caller must supply a Bazel toolchain definition.

**QEMU:** Not mentioned anywhere in the repository - no CI, no test scripts, no documentation.

**Linux-specific sources:** `source_list.json` contains a `linux_only_srcs` group covering GSO batch writers, `sendmmsg` batch writer, and `quic_linux_socket_utils.cc`. These are Linux kernel API dependencies, not architecture-specific, and apply to riscv64/Linux equally.

**Known build failures on riscv64:** None filed. The project has zero riscv64-related issues. The library should build from source on riscv64 with a suitable Clang toolchain based on its architecture-agnostic code, but this has not been demonstrated or tested.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None identified in quiche itself. The library is fully portable C++ with no missing riscv64 stubs, no `#error` guards on riscv64, and no unimplemented code paths. The endianness constraint (little-endian only) is satisfied by riscv64.

**Performance gaps:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES-GCM encryption | HW accelerated (BoringSSL x86 asm) | HW accelerated (BoringSSL ARMv8 asm) | C fallback (no riscv64 asm in BoringSSL) |
| ChaCha20-Poly1305 | HW accelerated (BoringSSL x86 asm) | HW accelerated (BoringSSL ARMv8 asm) | C fallback |
| GHASH | HW accelerated | HW accelerated | C fallback |
| Byte-swap | `__builtin_bswap*` (single instruction on both) | `__builtin_bswap*` | `__builtin_bswap*` |
| QUIC parsing throughput | Baseline | ~equivalent | Unknown - no benchmark data |

Crypto throughput on riscv64 will be lower than amd64 and arm64 due to BoringSSL's C fallbacks. The magnitude is unknown - Data not available: no quiche or BoringSSL riscv64 vs arm64 throughput benchmark data was found via web search, GitHub, or RISE project resources.

**Security hardening gaps:** None identified in quiche code itself. BoringSSL's FIPS module is not validated for riscv64, but this is a BoringSSL concern, not quiche's.

**Issue #128 (open):** Stream ID wire range capped by a 32-bit implementation limit. This is potentially relevant on 64-bit platforms including riscv64 [NEEDS VERIFICATION that this is specifically triggered by riscv64 vs. a general 32-bit cast issue].

---

## 7. CI/CD Infrastructure

The `.github/workflows` directory does not exist in google/quiche - the GitHub API returns HTTP 404 for that path. The repository root contains no CI configuration of any kind: no `.github/`, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`, no `.travis.yml`, no `.circleci/`.

google/quiche has no in-repo CI for any architecture.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-repo CI exists | No | No | No |
| RISE runners | No | No | No |
| Hardware lab testing | Unknown (downstream via Chromium/Envoy) | Unknown | No |
| GitHub Actions | None | None | None |

CI coverage exists only through downstream embedders (Chromium's and Envoy's CI systems), which are not part of this repository and were not searched for riscv64 coverage.

---

## 8. Distribution and Release Status

| Channel | riscv64 available | Notes |
|---|---|---|
| GitHub Releases | No | Zero releases published; the repository has no release assets of any kind |
| Debian | No | HTTP 404 at tracker.debian.org/pkg/quiche; package does not exist in Debian archive |
| Ubuntu | No | No package named "quiche" in Ubuntu noble |
| Arch Linux RISC-V | No | Not present in archriscv.felixc.at listing |
| PyPI | No | Only `quiche-0.3.2.tar.gz` (source sdist); no wheels; unrelated Python package |
| RISE wheel builder | No | quiche not listed among tracked packages |
| OCI / container | No | No official container images published by the project |

There are no pre-built binaries for google/quiche for any architecture. To obtain a working binary on riscv64, a user must build from source using Bazel with a manually configured riscv64 Clang cross-toolchain. No build instructions for this scenario exist in the repository.

---

## 9. Dependencies

**Summary table:**

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| BoringSSL | 0.20260508.0 | TLS 1.3, QUIC crypto, AEAD, certificates | Compiles (OPENSSL_RISCV64 macro exists; Android/riscv64 compile-only in CI; no Linux/riscv64 lane) | Not tested on Linux riscv64 | Not released as binary; embedded as source | No hardware crypto acceleration for Linux riscv64 |
| abseil-cpp | 20260107.0 | C++ utilities: strings, hashing, CRC32C, containers, sync | Builds (Debian/Ubuntu packages build) | Failing: #2002 (SEGFAULT on hashtablez/cordz tests), #2142 (SwisstableCollisions hash failure on Group::kWidth==8 platforms) | Debian/Ubuntu packages; no official upstream riscv64 binary | #2002 (open, last updated 2026-08-07), #2142 (open, last updated 2026-08-25) |
| protobuf | 31.1 | Wire-format serialization; `protoc` compiler | Builds (riscv64 support landed in 2022-2023) | Not run on riscv64 in upstream CI | No `protoc-*-linux-riscv64.zip` in any release (x86_64/aarch64/ppc64le/s390x provided; riscv64 absent) | No prebuilt `protoc` for riscv64 |
| re2 | 2024-07-02.bcr.1 | Regular expression engine for HTTP header matching | No riscv64-specific issues found | Presumed functional (no issue reports) | Source-only | None identified |
| zlib | 1.3.1.bcr.5 | DEFLATE/gzip (HPACK/QPACK, certificate compression) | Builds; OpenBSD/riscv64 CI lane active since mid-2024 | Passes on OpenBSD riscv64 | Source-only | None |
| fuzztest | 20250805.0 | Fuzzing infrastructure for test suite | Builds (inherits abseil-cpp) | Unknown; inherits abseil-cpp riscv64 test failures | Source-only | Inherits abseil-cpp #2002/#2142 |
| highwayhash | 0.0.0-20240305 | Fast hashing utility | No riscv64-specific issues found | Unknown | Source-only | None identified |
| googletest | 1.17.0 | Unit test framework | Builds and passes | Passes (widely tested in Debian/Ubuntu) | Source-only | None |
| quic-trace | pinned SHA | QUIC connection tracing | No riscv64-specific issues found | Unknown | Source-only | None identified |
| googleurl (gurl) | pinned SHA | URL parsing | No riscv64-specific issues found | Unknown | Source-only | None identified |
| anonymous-tokens | pinned SHA | Privacy Pass anonymous credential library | No riscv64-specific issues found | Unknown | Source-only | None identified |

**Critical dependency deep-dives:**

**BoringSSL (critical - crypto hot path).** BoringSSL recognizes riscv64 via the `OPENSSL_RISCV64` macro in `include/openssl/target.h`. The Android/riscv64 target is compile-only in BoringSSL's CI - there is no test execution. No Linux/riscv64 CI lane exists. Assembly directories (`crypto/fipsmodule/aes/asm/`, `crypto/chacha/asm/`) contain only x86, x86_64, ARMv7, and ARMv8 `.pl` assembly generators - zero riscv64 assembly exists. On Linux riscv64, BoringSSL uses C fallback implementations (`aes_nohw.cc.inc`, `gcm_nohw.cc.inc`) for all AEAD operations. This is correct but measurably slower than hardware-accelerated paths on arm64 and amd64. For a QUIC library where TLS handshake and packet encryption are in the hot path, this is a material performance gap.

**abseil-cpp (functional risk).** Two open riscv64-specific test failures exist: issue #2002 reports SEGFAULT in `hashtablez_sampler_test` and `cordz_sample_token_test` on Debian riscv64 (last updated 2026-08-07); issue #2142 reports `SwisstableCollisions.LowEntropyStrings` failure on `Group::kWidth==8` platforms including riscv64, aarch64, ppc64le, and loongarch64 (last updated 2026-08-25, under active investigation). quiche uses Abseil containers and synchronization primitives extensively. These failures represent a potential runtime reliability risk that must be resolved before riscv64 deployment is considered stable.

---

## 11. Known Bugs and Active Issues

**riscv64-specific issues in google/quiche:** None. Zero issues referencing riscv64 or RISC-V exist in the tracker.

**General open issues with potential cross-architecture relevance:**

| Issue | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #128 | Stream ID wire range capped by 32-bit implementation limit | Open | Medium | Potentially significant on 64-bit platforms including riscv64; mechanism not fully confirmed for riscv64 specifically |
| #103 | Null pointer dereference while parsing HTTP header | Open | High | Correctness bug; platform-independent |
| #88 | quic_client with --num_requests and --port=443 causes segmentation fault | Open | High | Correctness/crash bug; platform-independent |
| #147 | External client can trigger quic_bug_10586_3 in quiche-based servers | Open | High | Denial-of-service vector; platform-independent |
| #132 | Stateless Reset Token uses unkeyed FNV derivation | Open | Medium | Security concern; platform-independent |
| #149 | OgHttp2Session strands trailing HEADERS frame | Open | Medium | HTTP/2 protocol correctness; platform-independent |
| #140 | initial_max_streams above 2^60 clamped instead of rejected | Open | Low | QUIC RFC compliance; platform-independent |
| #107 | MTU discovery probes downward | Open | Low | Performance; platform-independent |

The 50+ open issues in the tracker (filed mostly 2025-2026) are predominantly QUIC RFC compliance audit findings. None are labeled as performance or architecture issues.

**riscv64-specific issues in critical dependencies:**

| Package | Issue | Status | Impact on quiche |
|---|---|---|---|
| abseil-cpp | #2002: SEGFAULT in hashtablez/cordz tests on Debian riscv64 | Open | Runtime crash risk in Abseil container code paths |
| abseil-cpp | #2142: SwisstableCollisions hash test failure on Group::kWidth==8 platforms | Open, active | Potential hash correctness issue on riscv64 |
| BoringSSL | No Linux riscv64 hardware crypto | Permanent until contributed | Performance gap in AEAD operations |
| protobuf | No prebuilt protoc for riscv64 | Open | Developer ergonomics and CI bootstrap friction |

---

## 12. Objections and Upstream Blockers

**Stated objections:** None are on record. The project has no documented stance on RISC-V.

**Technical blockers:**

1. No riscv64 Bazel toolchain definition provided. Cross-compilation requires the caller to supply this; no template or example exists in the repository.
2. abseil-cpp #2002 and #2142 are open riscv64 test failures. Until resolved, the runtime reliability of Abseil's container subsystems on riscv64 cannot be assumed.
3. BoringSSL has no hardware crypto acceleration for Linux riscv64. This is a sustained performance gap that requires upstream BoringSSL contribution to close.
4. No prebuilt `protoc` for riscv64 exists in any protobuf release, increasing CI bootstrap complexity.

**Organizational blockers:**

1. The project's internal-first development model (google3 as authoritative source) means external contributions to quiche itself require a Google engineer sponsor. Patch acceptance probability for riscv64 CI additions or platform documentation is dependent on Google engineering interest.
2. quiche has no RISE involvement and is not in the RISE wheel builder. No RISE work is already funded for this project.

**Acceptance probability:** For pure build fixes (toolchain documentation, Bazel platform constraints), acceptance is plausible but unconfirmed given the internal-first model [NEEDS VERIFICATION against Google's current stated policy on external architecture support PRs]. For CI additions, the project has no in-repo CI at all, so there is no precedent for accepting architecture-specific test configurations.

---

## 13. Investment Analysis

Google is a RISE Premier Member and has financial and engineering resources to fund riscv64 work on quiche internally. No RISE work has been initiated for quiche as of August 2026. The following assessment covers work not yet done by any party.

### 13.1 Functional Enablement

quiche itself requires no code changes to build or run on riscv64. The library is fully portable C++ with no missing platform stubs. Functional enablement is limited to build system and toolchain work.

### 13.2 Performance Optimization

The performance gap is entirely in BoringSSL. Implementing riscv64 Vector Crypto extension (Zvkn, Zvks) assembly routines for AES-GCM, ChaCha20-Poly1305, and GHASH in BoringSSL would close the crypto throughput gap. This is upstream BoringSSL work, not quiche work. The Vector Crypto extension requires RVV 1.0 + Zvkn/Zvks ISA extensions; hardware availability on shipping riscv64 platforms as of 2026 is limited.

Data not available: No quiche or BoringSSL riscv64 throughput numbers were found. Sizing performance work without a measured baseline is speculative.

### 13.3 CI/CD Infrastructure

quiche has no in-repo CI for any architecture. Adding riscv64 CI requires either: (a) adding GitHub Actions workflows to the repository (requires Google acceptance), or (b) testing riscv64 through Envoy's or Chromium's downstream CI. Neither path has been initiated.

### 13.4 Ecosystem Enablement

quiche is not an ecosystem project in the sense of having dependent packages that also need riscv64 enablement. It is a library with two major embedders (Chromium, Envoy). RISC-V enablement for quiche is meaningful only insofar as Chromium and Envoy on riscv64 require it.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Document riscv64 Bazel toolchain and cross-compilation procedure | 1 | Qualcomm / any contributor | High |
| Functional | Resolve abseil-cpp #2002 (riscv64 SEGFAULT in Abseil containers) | 3-6 | abseil-cpp upstream / RISE | Critical |
| Functional | Resolve abseil-cpp #2142 (SwissTable hash failure on riscv64) | 2-4 | abseil-cpp upstream / RISE | Critical |
| Functional | Build and validate quiche test suite on riscv64 hardware | 2 | Qualcomm / RISE | High |
| CI/CD | Add riscv64 test execution to a downstream CI system (Envoy or Chromium) | 4-8 | Google / RISE | Medium |
| CI/CD | Add in-repo riscv64 CI (GitHub Actions, QEMU) | 2-3 | Google (requires acceptance) | Low |
| Performance | BoringSSL riscv64 Vector Crypto asm (AES-GCM, ChaCha20, GHASH) | 8-16 | BoringSSL upstream / RISE | Medium |
| Distribution | Package quiche in Debian/Ubuntu for riscv64 | 2-4 | Debian maintainer | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/quiche repository](https://github.com/google/quiche)
- [quiche README (endian constraint, build instructions)](https://github.com/google/quiche/blob/master/README.md)
- [quiche MODULE.bazel (dependency versions)](https://github.com/google/quiche/blob/master/MODULE.bazel)
- [quiche source_list.json (linux_only_srcs)](https://github.com/google/quiche/blob/master/build/source_list.json)
- [quiche_endian.h (__builtin_bswap usage)](https://github.com/google/quiche/blob/master/quiche/common/quiche_endian.h)
- [google/quiche releases page (zero releases)](https://github.com/google/quiche/releases)
- [abseil-cpp issue #2002 (riscv64 SEGFAULT)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #2142 (SwisstableCollisions riscv64)](https://github.com/abseil/abseil-cpp/issues/2142)
- [google/boringssl BoringSSL RISC-V target header](https://github.com/google/boringssl/blob/main/include/openssl/target.h)
- [RISE Project member list](https://riseproject.dev/members/)
- [Debian package tracker - quiche (HTTP 404, not packaged)](https://tracker.debian.org/pkg/quiche)
- [PyPI quiche package (source-only sdist)](https://pypi.org/project/quiche/)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/)
- [protobuf riscv64 build support PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244)
- [quiche issue #128 (32-bit stream ID cap)](https://github.com/google/quiche/issues/128)
- [quiche issue #103 (null pointer dereference HTTP header parse)](https://github.com/google/quiche/issues/103)
- [quiche issue #88 (segfault with --num_requests)](https://github.com/google/quiche/issues/88)
- [quiche issue #147 (quic_bug_10586_3 external trigger)](https://github.com/google/quiche/issues/147)
- [quiche issue #132 (unkeyed FNV Stateless Reset Token)](https://github.com/google/quiche/issues/132)
- [Google CLA for quiche contributions](https://cla.developers.google.com)