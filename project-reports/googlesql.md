---
title: googlesql
parent: Project Reports
---

# googlesql

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for googlesql<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GoogleSQL (formerly ZetaSQL) is a SQL dialect and analyzer framework originally developed at Google for BigQuery and Spanner. It provides SQL parsing, name resolution, type-checking, and query analysis as a reusable C++ and Java library. It does not execute queries -- it produces a resolved AST that the calling engine (BigQuery, Spanner) executes. There is no query runtime, no JIT compiler, no I/O subsystem, and no SIMD-accelerated data path in the library itself.

**License:** Apache License 2.0.

**Governance:** Google is the sole corporate sponsor and the only contributor. All public commits are attributed to "ZetaSQL Team" / "GoogleSQL Team" via the GitHub login `a-googler`, a Google-internal automation bot that exports commits from an internal repository. No individual maintainer names are publicly disclosed. The project is governed entirely by Google under the `google` GitHub organization.

**Contribution policy:** Fully closed to external contribution. The README states: "We do not provide any guarantees of API stability and cannot accept contributions." `CONTRIBUTING.md` confirms: "We are not currently accepting external code contributions." The only external participation channel is filing GitHub Issues. This policy is not a soft preference -- it is the stated and enforced position of the project. No mechanism exists for a RISC-V port to be submitted by the community.

**Rename history:** The repository was created on 2019-04-16 as `google/zetasql`. It was renamed to `google/googlesql` with release 2026.01.1, published 2026-01-31. A migration guide (`zetasql_to_googlesql_migration.md`) was provided.

**Community culture on new ports:** Hostile by policy. [Issue #112](https://github.com/google/googlesql/issues/112), filed 2022-06-22, requests AArch64 support. It remains open with no response from maintainers as of the research date -- over four years without acknowledgment. AArch64 is a higher-priority architecture than RISC-V and has received no traction. This is the clearest available signal for what RISC-V would encounter.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2019-04-16 | Repository created as google/zetasql | [GitHub](https://github.com/google/googlesql) |
| 2022-06-22 | Issue #112 filed: "Can't build on linux/aarch64" | [Issue #112](https://github.com/google/googlesql/issues/112) |
| 2026-01-31 | Repository renamed to google/googlesql (release 2026.01.1) | [Release 2026.01.1](https://github.com/google/googlesql/releases/tag/2026.01.1) |
| 2026-08-14 | No riscv64 commit, issue, PR, or code found | This report |

No RISC-V port has been attempted. No contributors from any organization have filed issues, submitted patches, or documented work toward a riscv64 port. The project has no port history for any architecture other than x86-64 (reference) and macOS x86-64/aarch64 (experimental).

---

## 3. Upstream Support Tier

The README explicitly lists supported platforms as:

- Linux x86-64 (Ubuntu 22.04): reference platform, fully supported
- macOS (x86-64 and aarch64): experimental

No formal tier matrix exists beyond these two entries. No riscv64 tier is defined or implied.

**Evidence for platform support levels:**

| Evidence type | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI configured | No CI at all | No CI at all | No CI at all |
| Release binary provided | Yes (`execute_query_linux`) | No | No |
| Docker image | Yes (`googlesql_docker.tar.gz`) | No | No |
| README lists platform | Yes (reference) | Yes (experimental, macOS only) | No |
| Open build issue exists | None | Yes (#112, open 4+ years) | None filed |
| Bazel toolchain declared | Yes | macOS only | No |

The repository has no `.github/` directory and no CI configuration of any kind -- not for any platform. The stated reference platform (Ubuntu 22.04, x86-64) has no automated CI. All release artifacts are produced manually via `docker_build.sh`.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GoogleSQL is a pure SQL analyzer with no runtime, no JIT, and no SIMD data processing pipeline. Architecture-specific code is confined to a small set of utility headers used for performance in the analyzer's internal arithmetic and bit operations.

**Files with architecture guards (complete list):**

| File | Architectures with hand-tuned paths | riscv64 path |
|------|-------------------------------------|--------------|
| `googlesql/base/mathutil.h` | x86 (SSE2, AVX), aarch64 (NEON), ppc64 | Scalar C fallback |
| `googlesql/base/bits.h` | x86 (POPCNT, LZCNT, BMI2), aarch64, ppc64 | Generic `__builtin_clz` / arithmetic fallback |
| `googlesql/base/endian.h` | x86-64 | Generic `__builtin_bswap` fallback |
| `googlesql/common/multiprecision_int_impl.h` | x86-64 (`__mulq` inline asm, `__uint128_t`) | C++ generic fallback |

A full-text search for `#ifdef __riscv` across all 2,871 files in the repository returns zero results.

**Per-component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Fast float-to-int rounding (`mathutil.h`) | Hand-tuned (AVX/SSE2 inline asm) | Hand-tuned (NEON inline asm) | Scalar (C++ `Round<>` fallback) |
| Popcount (`bits.h`) | Hardware (`__POPCNT__`) | Hardware (`__builtin_popcount`) | Scalar (arithmetic fallback) |
| Count-leading-zeros (`bits.h`) | Hardware (BSR/LZCNT inline asm) | Hardware (CLZ inline asm) | Generic (`__builtin_clz` portably) |
| Bit reverse (`bits.h`) | Hardware (gbswap + shift) | Hardware (RBIT inline asm) | Scalar (shift arithmetic) |
| Wide integer multiply (`multiprecision_int_impl.h`) | Hand-tuned (`__mulq` inline asm) | Scalar | Scalar |
| Endian swap (`endian.h`) | Hardware (`__builtin_bswap` with x86 guard) | Scalar | Scalar |

All scalar fallbacks are functionally correct portable C++. None are stubs or contain TODO markers. The missing riscv64 paths are performance optimizations, not correctness gaps. RISC-V B-extension (bit manipulation, Zbb) would cover CLZ, popcount, and byte-swap; RVV would cover float rounding. Neither is implemented or planned.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake, no configure, no Makefile. The pinned version is 7.6.1 (`.bazelversion`). No official riscv64 Bazel binary exists -- [Bazel issue #26986](https://github.com/bazelbuild/bazel/issues/26986) tracks official riscv64 Linux support (open); [Bazel issue #23051](https://github.com/bazelbuild/bazel/issues/23051) documents a SIGILL on riscv64 (open). Building googlesql on riscv64 therefore requires building Bazel itself from source first.

**Compiler:** Clang (LLVM 21.1.0 on Linux). GCC is not supported -- `.bazelrc` sets `--config=clang` globally. C++20 is required (`--cxxopt=-std=c++20`).

**LLVM toolchain declaration in `MODULE.bazel`:**

```python
llvm.toolchain(
    name = "llvm_toolchain",
    llvm_versions = {
        "": "21.1.0",            # linux-x86_64
        "darwin-x86_64": "19.1.7",
        "darwin-aarch64": "19.1.7",
    },
)
```

No `linux-riscv64` entry. Adding riscv64 requires adding this entry and a matching `platform(...)` Bazel target.

**System dependencies (Ubuntu 22.04 reference):** `default-jre`, `default-jdk`, `curl`, `tar`, `build-essential`, `wget`, `python3`, `zip`, `unzip`, `tzdata`, `libgnutls30`.

**Standard build commands:**

```bash
# Build everything
bazel build ...

# Build execute_query binary (release, static)
bazel build -c opt --dynamic_mode=off //googlesql/tools/execute_query:execute_query

# Docker image (x86-64 only)
sudo docker build . -t my-googlesql-image -f Dockerfile
```

**QEMU:** Not used anywhere in the repository.

**Known build failures on riscv64:** No riscv64 build has been attempted publicly. The closest signal is [Issue #118](https://github.com/google/googlesql/issues/118) (big-endian build failure in `multiprecision_int_impl.h`) which demonstrates that non-x86 portability has not been validated. riscv64 is little-endian so this specific bug does not apply, but it confirms the project has not been exercised on any non-reference platform.

**Steps required to attempt an riscv64 build:**
1. Build Bazel 7.6.1 from source for riscv64 (no official binary).
2. Add `"linux-riscv64": "<llvm-version>"` to `llvm.toolchain()` in `MODULE.bazel`.
3. Add a `platform(...)` Bazel target for riscv64.
4. Resolve any Bazel-level riscv64 incompatibilities (issues #26986, #23051).
5. Validate all C++20 dependencies (abseil-cpp, protobuf, gRPC, RE2, BoringSSL, ICU) build under the LLVM cross-toolchain.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. GoogleSQL is a pure C++ analyzer library with no platform-specific feature gates. All SQL analysis functionality (parsing, type resolution, query rewriting) is implemented in portable C++ and will be available on riscv64 through the scalar fallback paths.

**Performance gaps:** The following operations will be slower on riscv64 relative to amd64 and arm64 due to missing hardware-optimized paths:

| Operation | amd64 penalty | arm64 penalty | riscv64 penalty | Relevant ISA extension |
|---|---|---|---|---|
| Fast float-to-int rounding | 0% (hardware) | 0% (hardware) | Unknown (scalar) | RVV |
| Popcount (hash/analysis) | 0% (POPCNT) | 0% (hardware) | Unknown (scalar) | Zbb (`cpop`) |
| Count-leading-zeros | 0% (LZCNT) | 0% (CLZ) | Low (gcc builtin likely maps to `clz`) | Zbb (`clz`) |
| 128-bit multiply | 0% (mulq) | Some (no asm) | Some (generic) | None standard |

Actual performance deltas are not quantifiable -- no riscv64 benchmark data exists for any platform.

**Security hardening gaps:** Data not available: no riscv64 hardening documentation was found in the repository, and the project has no security-specific build options documented.

**Floating-point semantics:** The `mathutil.h` fast rounding paths use architecture-specific tricks that avoid full IEEE 754 compliance for speed. The riscv64 scalar fallback uses standard C++ `round()` semantics. No NaN-handling differences were identified.

---

## 7. CI/CD Infrastructure

The repository has no `.github/` directory and no CI configuration of any kind. This was confirmed by a full recursive enumeration of all 2,871 files in the repository via the GitHub contents API.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system configured | No | No | No |
| Build tested in CI | No | No | No |
| Tests run in CI | No | No | No |
| Release artifacts built by CI | No (manual Docker) | No | No |
| RISE runners available | N/A | N/A | No |

The absence of CI for any platform is a project-level policy reflecting Google's closed governance model. All validation is internal and not visible to the public.

---

## 8. Distribution and Release Status

**GitHub release assets (5 most recent: 2026.7.2, 2026.01.1, 2025.12.1, 2025.11.2, 2025.11.1):**

| Asset | Architecture |
|---|---|
| `execute_query_linux` | x86-64 (no architecture suffix; single binary) |
| `execute_query_macos` | macOS (unspecified arch) |
| `googlesql_docker.tar.gz` | x86-64 (Dockerfile targets amd64) |

No riscv64 binary in any release.

**PyPI ([googlesql 0.1.0](https://pypi.org/project/googlesql/)):** One pure-Python wheel: `googlesql-0.1.0-py3-none-any.whl`. The tag `py3-none-any` means no compiled extension -- the wheel installs on riscv64 but provides only Python-level bindings backed by a pre-built native library, which is x86-64 only.

**Debian:** Not packaged. [tracker.debian.org/pkg/googlesql](https://tracker.debian.org/pkg/googlesql) returns 404.

**Ubuntu 24.04 (noble):** Not packaged.

**Arch Linux RISC-V port:** Not present.

**RISE wheel builder:** Not listed. The RISE PyPI index for googlesql redirects to the upstream PyPI page; no RISE-specific riscv64 wheel exists.

**To get a working riscv64 binary today:** Build from source using a self-compiled Bazel 7.6.1 for riscv64, LLVM 21+ cross-toolchain, with all C++ dependencies resolved manually. No pre-built path exists.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Key issues |
|---|---|---|---|---|---|
| abseil-cpp | Core utilities, atomics, hashing, containers | Builds | Flaky (2 SEGFAULTs with GCC 15.2 on Debian unstable) | No official CI/binaries | [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT); [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (linker error, older toolchain) |
| protobuf | Serialization throughout | Builds ([#12244](https://github.com/protocolbuffers/protobuf/pull/12244) merged) | Passes (#12266, #14549 closed) | No riscv64 Python wheels | No active C++ blocker |
| gRPC | RPC framework (server targets) | Builds from source | Past SIGILL (#37791, closed) | No riscv64 wheels (closed: not in Google OSS Support Policy) | [#41591](https://github.com/grpc/grpc/issues/41591) (wheel support refused) |
| RE2 | SQL regex operators | Builds (pure C++, no SIMD) | No riscv64 issues | Source-only | None |
| BoringSSL | TLS/crypto, hash functions | Builds (generic C fallbacks) | Unknown | No riscv64 prebuilts | None tracked |
| ICU | Unicode/locale (SQL string functions) | Builds (static data linkage via custom Bazel rule) | No riscv64 issues | No riscv64 prebuilts | None |
| Riegeli | Record I/O / compression streaming | Builds (pure C++) | No riscv64 issues | Source-only | None |
| FarmHash | Non-cryptographic hashing | Builds (portable fallback, no riscv64 arch files) | No riscv64 issues | Source-only | None |
| google/differential-privacy | Privacy math library | Builds (pure C++) | No riscv64 issues | Source-only | None |
| nlohmann/json | JSON parsing (tooling) | Builds (header-only) | No riscv64 issues | Header-only | None |
| google/googletest | Unit tests (dev only) | Builds | [#3756](https://github.com/google/googletest/issues/3756) open: `GetThreadCountTest` reads 0 threads on riscv64 | Source-only | Minor test failure, no production impact |
| google/benchmark | Microbenchmarking (dev only) | Builds | No riscv64 issues | No prebuilt binaries | None |
| Bazel (build system) | Required to build googlesql | Partial -- no official riscv64 binary | Untested | No official riscv64 release | [#26986](https://github.com/bazelbuild/bazel/issues/26986) (open); [#23051](https://github.com/bazelbuild/bazel/issues/23051) (SIGILL) |
| snappy | Compression (via riegeli) | Builds (no riscv64 SIMD, generic path) | No issues | Source-only | None |

**Blockers requiring attention before any riscv64 build:**

1. **Bazel has no official riscv64 binary** ([#26986](https://github.com/bazelbuild/bazel/issues/26986), [#23051](https://github.com/bazelbuild/bazel/issues/23051), both open). This is a build-system-level blocker for the entire project. Every other step depends on resolving this first.

2. **abseil-cpp has two open riscv64 test failures** ([#2002](https://github.com/abseil/abseil-cpp/issues/2002), [#1702](https://github.com/abseil/abseil-cpp/issues/1702)). Issue #1702 (linker error with `__atomic_exchange_1`) affects older cross-toolchains and must be verified against the specific LLVM 21 toolchain version googlesql requires. Issue #2002 (SEGFAULT in sampler tests under Debian/GCC 15) is environment-specific but unresolved upstream.

3. **gRPC has no official riscv64 Python wheels** and explicitly closed the request citing Google's CPU support policy. The C++ core builds are functional and do not block googlesql's C++ library targets.

Dependencies with pure portable C++ implementations (RE2, Riegeli, nlohmann/json, FarmHash, differential-privacy, snappy) present no riscv64 issues.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#112](https://github.com/google/googlesql/issues/112) | Can't build on linux/aarch64 | Open since 2022-06-22 | High | No maintainer response in 4+ years. Signal for how non-x86 port requests are treated. |
| [#118](https://github.com/google/googlesql/issues/118) | Build error on Big Endian | Open since 2022-09-09 | Medium | Template argument deduction failure in `multiprecision_int_impl.h`. Patch provided in issue, not merged. riscv64 is little-endian -- not directly applicable, but signals portability gaps. |
| [#30](https://github.com/google/googlesql/issues/30) | Float formatting in SQLBuilder is locale specific | Open since 2020-02-28 | Low | `SQLBuilder` uses C `printf` for floats; produces locale-specific decimal separators. Platform-neutral. |
| [#149](https://github.com/google/googlesql/issues/149) | Create simple catalog takes a long time | Open since 2023-08-26 | Low | `SimpleCatalog.addZetaSQLFunctions()` takes 9-10 seconds on first call. Java bindings only. No maintainer response. |

**Correctness bugs specific to riscv64:** None. No riscv64-specific issue has ever been filed.

---

## 12. Objections and Upstream Blockers

**Stated objection:** Google explicitly does not accept external contributions. `CONTRIBUTING.md`: "We are not currently accepting external code contributions." This is not a temporary policy -- it has been in place for the entire history of the repository.

**Organizational blocker:** Any riscv64 support must be implemented and merged by Google internally. There is no escalation path, no maintainer contact, and no governance body outside Google. Filing issues is the only external channel, and [#112](https://github.com/google/googlesql/issues/112) demonstrates that even high-priority portability issues receive no response.

**Technical blockers (for internal or downstream use):**

1. No official riscv64 Bazel binary (upstream Bazel issue, not googlesql-specific but required to build).
2. LLVM toolchain `MODULE.bazel` entry missing for `linux-riscv64`.
3. No riscv64 `platform(...)` Bazel target defined.
4. abseil-cpp test failures on riscv64 (sampler SEGFAULT, atomic linker error).

**Probability of upstream acceptance:** Zero. The project does not accept contributions. Any work done externally can only be carried as a downstream fork or patch set.

**Probability of Google adding riscv64 support internally:** Data not available. There are no public signals of Google planning riscv64 support for googlesql. The 4-year-old AArch64 build issue with zero response is the best available proxy.

---

## 13. Investment Analysis

RISE has not funded or undertaken any work on googlesql riscv64 support. No RISE blog posts, wheel builder entries, or GitLab projects reference googlesql.

### 13.1 Functional Enablement

The library is pure C++ with correct scalar fallbacks for all architecture-specific paths. It will compile and produce correct output on riscv64 once the build system issues (Bazel, LLVM toolchain declaration) are resolved. No functional gaps exist -- the effort is entirely build-system enablement and dependency unblocking.

### 13.2 Performance Optimization

The performance-sensitive paths in googlesql (float rounding, popcount, CLZ, wide integer multiply) are all in the SQL analyzer's internal arithmetic, not in a query execution hot path. Because googlesql does not execute queries, these paths run once per query at parse/analysis time. Performance optimization of riscv64 paths is low priority relative to the enabling work.

Adding RISC-V B-extension (Zbb) paths for CLZ, popcount, and byte-swap in `bits.h` and `endian.h` would be straightforward (10-20 lines of inline asm each) but would require Google's acceptance, which is unavailable.

### 13.3 CI/CD Infrastructure

The project has no CI for any platform. Building riscv64 CI would require Google's participation. An independent validation harness for downstream use could be constructed, but it cannot be upstreamed.

### 13.4 Ecosystem Enablement

Not applicable. The PyPI package is pure Python and installs on riscv64 without modification. The native library it wraps is x86-64 only, but that is the same situation for all non-x86 platforms.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Build Bazel 7.6.1 for riscv64 and validate (upstream: Bazel #26986) | 3-6 | Bazel community / RISC-V vendor | Critical (blocks all else) |
| Functional | Add `linux-riscv64` LLVM toolchain entry to `MODULE.bazel` and riscv64 Bazel platform target | 1 | Downstream fork (cannot upstream) | Critical |
| Functional | Resolve abseil-cpp riscv64 test failures (#2002, #1702) | 2-4 | abseil-cpp community | High |
| Functional | Validate full build and test suite on riscv64 hardware or QEMU | 2-4 | Downstream integrator | High |
| Performance | Add Zbb paths for CLZ, popcount, byte-swap in `bits.h` / `endian.h` | 1-2 | Requires Google merge -- not feasible | Low |
| CI/CD | riscv64 build validation in downstream CI (cannot upstream) | 2-3 | Downstream integrator | Medium |

**Overall assessment:** googlesql is low-complexity to enable on riscv64 from a software standpoint -- the library has no JIT, no SIMD data plane, and correct scalar fallbacks. The primary barriers are the Bazel build system (no official riscv64 binary) and the project's closed contribution policy. A downstream patch set to enable riscv64 builds is achievable in under 10 person-weeks once Bazel riscv64 support is in place. Upstreaming that work is not possible under current project policy. Any investment should be scoped as downstream enablement only.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/googlesql repository](https://github.com/google/googlesql)
- [googlesql README](https://github.com/google/googlesql/blob/master/README.md)
- [googlesql CONTRIBUTING.md](https://github.com/google/googlesql/blob/master/CONTRIBUTING.md)
- [googlesql MODULE.bazel](https://github.com/google/googlesql/blob/master/MODULE.bazel)
- [googlesql Dockerfile](https://github.com/google/googlesql/blob/master/Dockerfile)
- [googlesql .bazelrc](https://github.com/google/googlesql/blob/master/.bazelrc)
- [googlesql Issue #112: Can't build on linux/aarch64](https://github.com/google/googlesql/issues/112)
- [googlesql Issue #118: Build error on Big Endian](https://github.com/google/googlesql/issues/118)
- [googlesql Issue #30: Float formatting in SQLBuilder is locale specific](https://github.com/google/googlesql/issues/30)
- [googlesql Issue #149: Create simple catalog takes a long time](https://github.com/google/googlesql/issues/149)
- [googlesql releases](https://github.com/google/googlesql/releases)
- [googlesql on PyPI](https://pypi.org/project/googlesql/)
- [abseil-cpp Issue #2002: SEGFAULT in sampler tests on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp Issue #1702: Linker error with __atomic_exchange_1 on riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [protobuf PR #12244: riscv64 support](https://github.com/protocolbuffers/protobuf/pull/12244)
- [gRPC Issue #41591: riscv64 wheel support refused](https://github.com/grpc/grpc/issues/41591)
- [googletest Issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Bazel Issue #26986: Official riscv64 Linux support](https://github.com/bazelbuild/bazel/issues/26986)
- [Bazel Issue #23051: SIGILL on riscv64](https://github.com/bazelbuild/bazel/issues/23051)
- [RISE Project member list](https://riseproject.dev/members/)