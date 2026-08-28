---
title: FlatBuffers
categories:
  - libraries
---

# FlatBuffers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for FlatBuffers
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

FlatBuffers is a zero-copy binary serialization library created at Google in 2014. It provides a schema compiler (`flatc`) and language runtime bindings for C++, Rust, Python, Go, Java, JavaScript/TypeScript, Dart, Swift, and others. The wire format is little-endian and designed for in-place reads without parsing or memory allocation.

**Governance:** No foundation affiliation. The project is Google-controlled open source under the Apache License 2.0, hosted at [google/flatbuffers](https://github.com/google/flatbuffers). All contributions go through GitHub pull requests. Contributors must sign Google's Individual CLA before merge. No formal platform support tier policy exists.

**Corporate maintainers:**
- Derek Bailey (@dbaileychess) -- Google Software Engineer; current release manager and primary maintainer
- Wouter van Oortmerssen (@aardappel) -- original creator; formerly Google, now at VoxRay Games (independent)
- @alphalex-google -- Google (inferred from handle)
- @cosmith-nvidia -- NVIDIA (inferred from handle; C++ Object API contributor)
- @mpawlowski-eyeo -- eyeo (inferred from handle; string_view fix)

**RISE membership:** Google is a Premier Member of the RISE project. FlatBuffers is not listed as a RISE-funded or RISE-tracked project. No RISE blog post (across all 27 posts through 2026-06) mentions FlatBuffers. FlatBuffers does not appear in the [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (75 packages checked).

**Community stance on new ports:** No PLATFORMS.md, SUPPORT.md, or written policy exists. The library is architecture-agnostic by design: no SIMD, no JIT, no assembly. The practical barrier to a RISC-V contribution is operational (adding QEMU CI), not governance.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Feb 2022 | Issue [#7090](https://github.com/google/flatbuffers/issues/7090) filed: CMake POST_BUILD step runs cross-compiled `flatc` on host, fails for arm64-on-x86_64 | github.com/google/flatbuffers |
| Feb 2022 | Issue #7090 closed: POST_BUILD invocation of `generate_code.py` removed from CMakeLists.txt | github.com/google/flatbuffers |
| May 2022 | Issue [#7297](https://github.com/google/flatbuffers/issues/7297) filed: same bug reproduced cross-compiling for RISC-V on amd64 (v2.0.5/v2.0.6); reporter: ouonline | github.com/google/flatbuffers |
| May 2022 | Issue #7297 closed: fix inherited from #7090; current CMakeLists.txt has no POST_BUILD `flatc` invocation | github.com/google/flatbuffers |
| ~52 days before 2026-06-17 | Debian sid builds `flatbuffers 23.5.26+dfsg-4+b2` for riscv64 on builder `rv-osuosl-02`, status: Installed | [Debian buildd](https://buildd.debian.org/status/package.php?p=flatbuffers&suite=sid) |
| 2026-04-02 | Arch Linux RISC-V repo publishes `flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` | [archriscv.felixc.at](https://archriscv.felixc.at/repo/extra/) |

There is no dedicated RISC-V port effort. No RISC-V-specific commits have ever been made to the repository (GitHub commit search for "riscv" returns zero results). No tracking issue for riscv64 exists. All riscv64 support is implicit: the library compiles via standard C++ cross-compilation with no code changes.

**Key contributors for RISC-V work:** None. All riscv64 packaging was done by Debian and Arch Linux RISC-V maintainers, not by Google or FlatBuffers contributors.

---

## 3. Upstream Support Tier

No formal support tier policy exists in the FlatBuffers repository. The de facto tier is determined by what the upstream CI tests and what binaries the project ships.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner in upstream `.github/workflows/` | Yes (`ubuntu-latest`, `windows-latest`, `macos-latest`) | Partial (macOS arm64 only) | No |
| Pre-built binary in GitHub releases | Yes (`Linux.flatc.binary.g++-13.zip`, `Linux.flatc.binary.clang++-18.zip`, `Windows.flatc.binary.zip`, `Mac.flatc.binary.zip`, `MacIntel.flatc.binary.zip`) | Yes (macOS arm64 via `Mac.flatc.binary.zip`) | No |
| Release-blocking test coverage | Yes | No | No |
| Distro package available | Yes | Yes | Yes (Debian sid v23.5.26, Arch RISC-V v25.12.19) |

The upstream project treats riscv64 as an unsupported, untested architecture. It is supported only through downstream distro packaging.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FlatBuffers is a pure serialization library: no JIT, no SIMD dispatch, no cryptography, no garbage collector. The schema compiler (`flatc`) is a standard C++ binary. The runtime library is header-only C++ templates for most use cases.

**Architecture-specific code inventory:**

| Component | What it does | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Endianness detection (`base.h`) | Selects byte-swap path | scalar via `__BYTE_ORDER__` macro | scalar via `__BYTE_ORDER__` macro | scalar via `__BYTE_ORDER__` macro (little-endian default, correct for standard Linux riscv64) |
| Unaligned scalar read (`ReadScalar` in `base.h`) | Reads typed value from byte buffer | UBSan-suppressed reinterpret cast | UBSan-suppressed reinterpret cast | UBSan-suppressed reinterpret cast (see Section 6) |
| Bulk copy in FlatBufferBuilder | Copies aligned data | scalar byte copy | scalar byte copy | scalar byte copy |
| FlexBuffers fast-copy (`flexbuffers.h`) | Bulk memory move | One MSVC-only `__movsb` intrinsic on x64; all other paths scalar | scalar | scalar |
| Rust crate endianness (`endian_scalar.rs`) | `to_le()`/`from_le()` | portable Rust | portable Rust | portable Rust |
| `flatc` schema compiler | Code generation binary | pre-built in releases | pre-built for macOS arm64 | not pre-built; build from source |
| CI coverage | Regression detection | full upstream CI | macOS only | none |

No hand-tuned paths, SIMD intrinsics, RVV code, or `.S` assembly files exist for any architecture. The codebase is uniformly scalar. riscv64 is neither uniquely deficient nor uniquely supported relative to any other non-x86 platform.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (primary), minimum version 3.8. Bazel is also supported (`BUILD.bazel`, `MODULE.bazel`). Language standard: C++11 minimum; configurable to C++17/20/23 via `-DFLATBUFFERS_CPP_STD=17`.

**Native build on riscv64:**

```sh
cmake -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release \
  -DFLATBUFFERS_STRICT_MODE=ON \
  -DFLATBUFFERS_BUILD_TESTS=ON
make -j$(nproc)
./flattests
```

**Cross-compilation for riscv64 from x86_64 host:**

No upstream toolchain file exists. Standard CMake cross-compilation variables apply:

```sh
# Step 1: build host-native flatc (runs at build time)
cmake -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release \
  -DFLATBUFFERS_BUILD_TESTS=OFF \
  -DFLATBUFFERS_BUILD_FLATLIB=OFF -B build-host
cmake --build build-host --target flatc

# Step 2: build riscv64 target library
cmake -G "Unix Makefiles" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DFLATBUFFERS_BUILD_TESTS=OFF \
  -DFLATBUFFERS_BUILD_FLATC=OFF \
  -DFLATBUFFERS_BUILD_FLATLIB=ON \
  -B build-riscv64
cmake --build build-riscv64
```

`flatc` must be built separately for the host (step 1) because it runs during the target build. This is standard cross-compilation practice, not a RISC-V-specific issue. The closed issue [#7297](https://github.com/google/flatbuffers/issues/7297) (2022) was caused by the build system violating this rule in versions 2.0.5/2.0.6; it is fixed in current master.

**Tested compiler versions (from upstream CI):** GCC 13 (`g++-13`) and Clang 18 (`clang++-18`) on Ubuntu 24.04. Minimum C++11-compatible GCC or Clang is sufficient for the library itself.

**QEMU:** No upstream QEMU scripts or CI jobs. To run tests under user-mode emulation:

```sh
apt install qemu-user
qemu-riscv64 -L /usr/riscv64-linux-gnu ./flattests
```

**Endianness:** `include/flatbuffers/base.h` auto-detects endianness via `__BYTE_ORDER__`/`__BIG_ENDIAN__` compiler macros. Standard Linux riscv64 is little-endian; `FLATBUFFERS_LITTLEENDIAN=1` is set automatically. No manual override is needed.

**Known build failures on riscv64:** None currently open. Issue #7297 (cross-compilation exec error) is closed and fixed.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| C++ serialization/deserialization | Yes | Yes | Yes | Portable C++ |
| FlexBuffers (dynamic typing) | Yes | Yes | Yes | Portable C++ |
| Zero-copy buffer access | Yes | Yes | Yes | Portable |
| `flatc` schema compiler | Yes (pre-built binary) | Yes (macOS pre-built) | Build from source | No riscv64 release binary |
| Rust crate | Yes | Yes | Yes | Pure Rust, architecture-agnostic |
| Python binding | Yes | Yes | Yes | Pure Python, no native extension |
| SIMD-accelerated serialization | No | No | No | No SIMD exists for any arch |
| RVV intrinsics | N/A | N/A | No | Not applicable to this library |
| Upstream CI coverage | Yes | Partial | No | - |

**Functional gaps:** None. riscv64 is functionally complete relative to amd64 and arm64. The library serializes and deserializes correctly on riscv64 (confirmed by Debian buildd passing).

**Performance gaps from missing SIMD:** None. FlatBuffers implements no SIMD for any architecture. There is no performance gap specific to riscv64.

**Unaligned access risk:** `ReadScalar` in `include/flatbuffers/base.h` uses a UBSan-suppressed reinterpret cast rather than a `memcpy`-based safe read. On RISC-V hardware that traps unaligned loads, this could fault. In practice, the Linux riscv64 kernel emulates unaligned access transparently for most standard RISC-V cores. On RISC-V cores with `RISCV_ISA_EXTENSION_UNALIGNED_SCALAR_FAST`, this is also a non-issue. On embedded RISC-V without alignment emulation, this would be a correctness bug. [NEEDS VERIFICATION: no filed issue or test failure has been identified for this on Linux riscv64 in the research data.]

**Dart binding alignment bugs (open):** Issues [#9099](https://github.com/google/flatbuffers/issues/9099) and [#9119](https://github.com/google/flatbuffers/issues/9119) document struct builder misalignment in the Dart binding. PR #9119 adds `prepStruct(alignment, size)` to fix it (open as of 2026-06-02). These bugs affect any strict-alignment architecture including riscv64, though the reported failures were in Dart, not C++ or Rust.

**NaN / floating-point:** No NaN or floating-point correctness issues specific to riscv64 were found in any source searched.

**Security hardening:** No riscv64-specific hardening gaps were identified. The library has no cryptographic code.

---

## 7. CI/CD Infrastructure

All six files under `.github/workflows/` in `google/flatbuffers` were read directly via the GitHub API. Results:

| Workflow file | Purpose | Runners used | riscv64 present |
|---|---|---|---|
| `build.yml` | Main build and test matrix: Linux gcc/clang, Windows, macOS, Android, 12+ language bindings | `ubuntu-latest` (x86_64), `windows-latest`, `macos-latest` | No |
| `release.yml` | Publish to npm, PyPI, NuGet, Maven, crates.io | `ubuntu-latest`, `windows-latest`, `macos-latest` | No |
| `main.yml` | OSS-Fuzz integration | `ubuntu-latest` | No |
| `stale.yml` | Stale issue/PR bot | github-hosted (no build) | No |
| `label.yml` | PR labeler | github-hosted (no build) | No |
| `docs.yml` | MkDocs deployment | `ubuntu-latest` | No |

No QEMU emulation steps, no cross-compilation to riscv64, no riscv64-specific runners, no RISE-provided RISC-V hardware runners exist in any workflow file.

**Comparison:**

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI runner | Yes | macOS only | No |
| Release-blocking test suite | Yes | No | No |
| QEMU test job | N/A | No | No |
| RISE CI runner | No | No | No |
| Downstream distro CI (Debian buildd) | Yes | Yes | Yes |

All riscv64 test coverage is provided exclusively by Debian's `rv-osuosl-02` buildd node, not by the upstream project.

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** The five most recent releases (v25.12.19, v25.9.23, v25.2.10, v25.1.24, v25.12.19-2026-02-06-03fffb2) each ship the same five binary assets: `Linux.flatc.binary.clang++-18.zip`, `Linux.flatc.binary.g++-13.zip`, `Mac.flatc.binary.zip`, `MacIntel.flatc.binary.zip`, `Windows.flatc.binary.zip`. Zero assets contain "riscv64". Verified directly via [GitHub releases API](https://github.com/google/flatbuffers/releases).

**PyPI (`flatbuffers` package):** Pure Python wheel (`flatbuffers-25.12.19-py2.py3-none-any.whl`). Installs on riscv64 without a platform-specific build. No native C extension exists for any platform. Not a riscv64 gap.

**Debian sid:** `flatbuffers-compiler 23.5.26+dfsg-4+b2`, `libflatbuffers-dev 23.5.26+dfsg-4+b2`, `libflatbuffers23.5.26 23.5.26+dfsg-4+b2` -- all built for riscv64, status: Installed, builder: `rv-osuosl-02`. Confirmed via [Debian buildd](https://buildd.debian.org/status/package.php?p=flatbuffers&suite=sid). The packaged version (23.5.26) is behind upstream (25.12.19).

**Arch Linux RISC-V:** `flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` (1,334,079 bytes) and `python-flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` (65,384 bytes), both dated 2026-04-02. Version matches upstream 25.12.19. Confirmed via [archriscv.felixc.at repo](https://archriscv.felixc.at/repo/extra/).

**Ubuntu 24.04 Noble:** `flatbuffers-compiler`, `libflatbuffers-dev`, `libflatbuffers2`, `python3-flatbuffers` at version 2.0.8+dfsg1-6build1 in the `universe` section. Ubuntu lists riscv64 as a supported architecture and inherits Debian multiarch. Direct buildd confirmation for Ubuntu was not obtained in this research. [NEEDS VERIFICATION: Ubuntu riscv64 build success not confirmed by direct buildd API fetch.]

**RISE wheel builder:** FlatBuffers is not in the RISE wheel builder package list (75 packages checked). The Python binding is pure Python and requires no riscv64-specific wheel.

**What a user must do to get a working binary on riscv64:**
- C++ library: `apt install libflatbuffers-dev` on Debian/Ubuntu, or `pacman -S flatbuffers` on Arch RISC-V; both include riscv64 packages.
- `flatc` compiler: `apt install flatbuffers-compiler` on Debian (v23.5.26); or build from source at upstream version.
- Rust crate: `cargo add flatbuffers`; compiles natively via `riscv64gc-unknown-linux-gnu` Rust target (Tier 2 without host tools).
- Python: `pip install flatbuffers`; pure Python, works on any platform.

---

## 9. Dependencies

**Dependency surface:** The C++ core has no required external runtime dependencies. `flatc` is self-contained. Optional and language-specific dependencies are listed below.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release binary | Open riscv64 issues |
|---|---|---|---|---|---|
| gRPC (grpc/grpc) | Optional: `FLATBUFFERS_BUILD_GRPCTEST` test target only; not needed for production use | Yes (Debian `libgrpc-dev` v1.51.1-9 for riscv64) | Functional (SIGILL bug [#37791](https://github.com/grpc/grpc/issues/37791) closed Oct 2024; atomic symbol bug [#35839](https://github.com/grpc/grpc/issues/35839) closed Feb 2024) | No official `grpcio` PyPI wheels for riscv64 (issue [#41591](https://github.com/grpc/grpc/issues/41591), open, P2); RISE distributes unofficial wheels v1.72-1.76 | [#41591](https://github.com/grpc/grpc/issues/41591) (open, PyPI wheel missing) -- C++ library not blocked |
| Abseil-cpp (abseil/abseil-cpp) | Optional: transitive via gRPC test target only | Yes (Debian `libabsl-dev` v20260107.0-5, built on `rv-osuosl-02`) | Two test failures on Debian sid riscv64 with GCC 15.2: `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` segfault (Debian bug [#1126886](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886), abseil issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002), open Feb 2026; does not reproduce on Ubuntu riscv64) | Debian package only | [#1702](https://github.com/abseil/abseil-cpp/issues/1702): undefined `__atomic_compare_exchange_1` with Bootlin cross-toolchain (workaround: `-latomic`); [#2002](https://github.com/abseil/abseil-cpp/issues/2002): test segfaults (Debian-specific); PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986): RISC-V CRC32C HW acceleration (open, not merged) |
| Protocol Buffers (protocolbuffers/protobuf) | Optional: transitive via gRPC test target only | Yes (Debian `libprotobuf-dev` v3.21.12-16 for riscv64; issue [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) closed Mar 2024) | Tests pass (no open riscv64 test failures found) | Maven riscv64 `protoc` prebuilt added (issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), closed Sep 2024); Python `protoc` wheel lacks riscv64 (PRs [#23205](https://github.com/protocolbuffers/protobuf/pull/23205), [#23206](https://github.com/protocolbuffers/protobuf/pull/23206) abandoned Aug 2025) | No critical blockers for C++ use |
| bitflags (bitflags/bitflags) | Required: Rust binding runtime; flag/enum bitfield types | Yes (pure Rust, architecture-agnostic) | Yes (no riscv64 issues found) | crates.io; `riscv64gc-unknown-linux-gnu` is Rust Tier 2 | None identified |
| serde (serde-rs/serde) | Optional: Rust binding, feature-gated; serialization framework | Yes (pure Rust proc-macro) | Yes (no riscv64 issues found) | crates.io | None identified |

**Summary:** No FlatBuffers core dependency is a riscv64 blocker. The optional gRPC test dependency chain has two open riscv64 issues (Abseil test segfaults and grpcio missing PyPI wheel), neither of which affects production FlatBuffers use.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|---|---|---|---|---|
| [#7297](https://github.com/google/flatbuffers/issues/7297) | `Exec format error` when cross compiling to RISC-V (v2.0.5/v2.0.6) | Closed (May 2022) | Fixed | Direct: cross-compilation to riscv64 was broken in those versions; fixed in current master |
| [#7090](https://github.com/google/flatbuffers/issues/7090) | CMake: do not run generate_code.py if flatc is cross-compiled | Closed (Feb 2022) | Fixed | Indirect: same root cause as #7297, arm64 instance |
| [#9050](https://github.com/google/flatbuffers/issues/9050) | Bus error on armhf | Open (Apr 2026) | High | Indirect: SIGBUS from unaligned access on 32-bit ARM; identical hazard exists on riscv32/riscv64 if kernel alignment emulation is absent |
| [#9099](https://github.com/google/flatbuffers/issues/9099) | Dart struct builders do not prepare full inline struct alignment/size | Open (May 2026) | Medium | Indirect: Dart binding alignment bug; affects any strict-alignment architecture including riscv64 |
| [#9119](https://github.com/google/flatbuffers/issues/9119) | Dart: Fix struct builder alignment | Open PR (Jun 2026) | Medium | Fix for #9099; adds `prepStruct(alignment, size)`; unmerged |

**Correctness risk (not a filed bug):** The `ReadScalar` function in `include/flatbuffers/base.h` suppresses UBSan via `FLATBUFFERS_SUPPRESS_UBSAN("alignment")` rather than using a safe `memcpy`-based read. On RISC-V hardware without kernel-level unaligned access emulation, this could produce a fault. No filed issue exists for this on riscv64.

No open riscv64-specific correctness or performance issues exist in the `google/flatbuffers` repository.

---

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support exist in any issue, PR, or project document. The project has no policy that limits CI or binaries to specific architectures.

**Technical blockers:** None. The library requires no riscv64-specific code changes and builds with standard C++11 toolchains.

**Organizational blockers:** None identified. Google is a Premier RISE member. The primary maintainer (Derek Bailey, Google) has not stated any position on riscv64 CI.

**Acceptance probability for a riscv64 CI PR:** High [NEEDS VERIFICATION]. The project accepts CI matrix additions routinely; no policy barriers exist. Adding a QEMU-based riscv64 CI job is a straightforward GitHub Actions change with no code-level dependencies.

---

## 13. Investment Analysis

RISE has no funded work on FlatBuffers. The library requires no code changes for riscv64 correctness. The gap is entirely in CI coverage and upstream binary distribution.

### 13.1 Functional Enablement

The library is fully functional on riscv64 today via standard C++ compilation. No functional enablement work is required. The one latent risk (UBSan-suppressed unaligned cast in `ReadScalar`) warrants a defensive fix: replace the reinterpret cast with `memcpy`-based scalar read, which compilers optimize to a single load on little-endian architectures with fast unaligned access. This is a correctness hardening item, not a blocker.

### 13.2 Performance Optimization

FlatBuffers implements no SIMD for any architecture. Adding RVV-accelerated paths (e.g., bulk serialization loops) would be novel work relative to all existing platforms, not a gap-fill. Given the zero-copy design (no decode loop to vectorize), the performance upside is narrow. This is low priority.

### 13.3 CI/CD Infrastructure

The primary actionable gap is adding riscv64 CI to the upstream repository. This requires: a QEMU user-mode emulation step in `build.yml`, or access to a RISE-provided native riscv64 runner. The Debian buildd already validates the library on riscv64 but is not surfaced in upstream CI, so regressions would not be caught before release.

### 13.4 Ecosystem Enablement

The Python binding is pure Python and already works on riscv64. No wheel builder work is needed. The Rust crate builds via standard Rust cross-compilation. `flatc` pre-built binaries for riscv64 in upstream GitHub releases would reduce friction for schema-first development workflows on riscv64 hardware.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Replace UBSan-suppressed `ReadScalar` cast with `memcpy`-based read in `base.h`; add riscv64 alignment test | 1 | Google/community | Medium |
| CI/CD | Add QEMU riscv64 job to `build.yml`; run `flattests` under `qemu-riscv64` | 1 | Google/RISE | High |
| CI/CD | Add Dart binding riscv64 test coverage (pending fix for #9099/#9119) | 1 | Google/Dart team | Medium |
| Functional | Upstream pre-built `flatc` riscv64 binary in GitHub releases (cross-build in `release.yml`) | 1 | Google | Low |
| Performance | RVV-accelerated bulk serialization (speculative; requires profiling to justify) | 4-8 | Qualcomm/RISE | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/flatbuffers repository](https://github.com/google/flatbuffers)
- [FlatBuffers homepage](https://flatbuffers.dev/)
- [FlatBuffers benchmarks (x86_64 only)](https://flatbuffers.dev/benchmarks/)
- [Issue #7297: Exec format error when cross compiling for RISC-V](https://github.com/google/flatbuffers/issues/7297)
- [Issue #7090: CMake: do not run generate_code.py if flatc is cross-compiled](https://github.com/google/flatbuffers/issues/7090)
- [Issue #9050: Bus error on armhf](https://github.com/google/flatbuffers/issues/9050)
- [Issue #9099: Dart struct builders do not prepare full inline struct alignment/size](https://github.com/google/flatbuffers/issues/9099)
- [PR #9119: Dart: Fix struct builder alignment](https://github.com/google/flatbuffers/issues/9119)
- [Debian buildd status: flatbuffers (sid)](https://buildd.debian.org/status/package.php?p=flatbuffers&suite=sid)
- [Arch Linux RISC-V extra repo](https://archriscv.felixc.at/repo/extra/)
- [PyPI: flatbuffers](https://pypi.org/project/flatbuffers/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog](https://riseproject.dev/blog)
- [google/flatbuffers .github/workflows/build.yml](https://github.com/google/flatbuffers/blob/master/.github/workflows/build.yml)
- [google/flatbuffers include/flatbuffers/base.h](https://github.com/google/flatbuffers/blob/master/include/flatbuffers/base.h)
- [google/flatbuffers CMakeLists.txt](https://github.com/google/flatbuffers/blob/master/CMakeLists.txt)
- [grpc/grpc issue #41591: riscv64 grpcio PyPI wheels missing](https://github.com/grpc/grpc/issues/41591)
- [abseil/abseil-cpp issue #1702: riscv64 linker undefined atomic symbol](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp issue #2002: riscv64 test segfaults on Debian sid](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil/abseil-cpp PR #1986: RISC-V CRC32C hardware acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [Debian buildd status: abseil (sid)](https://buildd.debian.org/status/package.php?p=abseil&suite=sid)
- [protocolbuffers/protobuf issue #12266: riscv64 support](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protocolbuffers/protobuf issue #17798: Maven riscv64 protoc prebuilt](https://github.com/protocolbuffers/protobuf/issues/17798)
- [Debian packages: flatbuffers-compiler (noble)](https://packages.ubuntu.com/noble/flatbuffers-compiler)