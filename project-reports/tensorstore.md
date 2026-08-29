---
title: tensorstore
parent: Project Reports
color: orange
---

# tensorstore

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for tensorstore<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

TensorStore is a C++17/Python library for reading and writing large multidimensional arrays to a variety of storage backends (local filesystem, Google Cloud Storage, Amazon S3, Zarr, N5, neuroglancer_precomputed, JPEG/PNG/AVIF/WebP image tiles, and others). Its primary use case is high-throughput, chunked I/O for computational neuroscience and ML training data pipelines.

The project is maintained exclusively by Google employees. The public repository at [google/tensorstore](https://github.com/google/tensorstore) is a read-only Copybara export of an internal Google monorepo. All commits are either attributed to `jbms@google.com` (Jeremy Maitin-Shepard, original architect, 725 commits), `lar@google.com` (Laramie Leavitt, dominant current maintainer, 870 commits), or synced from internal Google tooling via `Tensorstore Team <no-reply@google.com>`. There are no MAINTAINERS, CODEOWNERS, or OWNERS files. External contributors must sign a Google CLA, and their contributions must be merged internally first. The project has no foundation affiliation (CNCF, Apache, Linux Foundation).

Google LLC is a RISE Premier Member, but TensorStore itself is not listed as a RISE project and does not appear in RISE working group documentation or the RISE Python wheel builder.

The project has no documented platform tier policy and no PLATFORMS.md. Its community stance on new architecture ports is not documented. Given the Copybara-sync model, any RISC-V enablement would require Google employee sponsorship or a demonstrated internal Google need.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V issues, PRs, or commits have ever been filed | [GitHub issues search](https://github.com/google/tensorstore/issues?q=riscv) -- 0 results |
| - | No RISC-V code exists in the repository | GitHub code search for "riscv", "riscv64", "rvv", "__riscv" -- 0 results across 2,696 files |
| - | No RISC-V CI runner added | [build.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml) -- riscv64 absent |
| - | Not present in RISE Python wheel builder | [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) -- 78 packages listed, tensorstore absent |

There is no RISC-V port history. No contributor has initiated a port, and no tracking issue exists.

## 3. Upstream Support Tier

TensorStore has no formal tier policy. Support is inferred from CI coverage and published artifacts.

| Item | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|------|---------------|----------------|---------|
| CI builds | Yes (`ubuntu-latest`) | Yes (`arm-ubuntu-arm-22.04-8core`) | No |
| CI tests run | Yes | Yes | No |
| PyPI wheel published | Yes (`manylinux_2_27_x86_64`) | Yes (`manylinux_2_27_aarch64`) | No |
| macOS native binary | Yes | Yes | No |
| Windows binary | Yes | No | No |
| Debian package | Data not available: no Debian package for any architecture | No | No |
| Arch Linux RISC-V | N/A | N/A | No (absent from archriscv.felixc.at) |
| RISE wheels | N/A | N/A | No (absent from wheel builder) |

Sources: [build.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml), [PyPI tensorstore 0.1.85](https://pypi.org/project/tensorstore/#files)

## 4. Technical Architecture and RISC-V-Specific Subsystems

TensorStore has no SIMD dispatch layer, no JIT backend, no hand-written assembly, and no architecture-specific intrinsics in its first-party C++ code. All 2,696 files were scanned; zero files contain `__riscv`, `riscv64`, `rvv`, `vfloat32m1_t`, `__aarch64__`, or `__x86_64__` architecture guards. The project has no `arch/` directory and no `.S` or `.s` assembly files.

All architecture-specific material is confined to bundled third-party codecs in `third_party/`. The only component with riscv64 relevance is the bundled AOM AV1 codec.

| Component | Role | amd64 | arm64 | riscv64 |
|-----------|------|-------|-------|---------|
| TensorStore core (I/O, indexing, transactions) | Array read/write, chunk management | Scalar C++ | Scalar C++ | Scalar C++ (compiles; no SIMD) |
| libjpeg-turbo (bundled) | JPEG codec | NASM AVX2/SSE2 | NEON intrinsics | Scalar C (WITH_SIMD undefined) |
| blake3 (bundled) | Content-addressable hashing | AVX2/AVX512/SSE ASM | NEON intrinsics | Scalar C |
| libaom AV1 codec (bundled, `third_party/org_aomedia_aom`) | AV1 encode/decode | x86_64 + x86_64_avx2 generated configs | arm64 generated config | **Missing** -- riscv64 explicitly excluded via `_PATTERN_UNSUPPORTED = ["**/riscv/**", "**/*_rvv*"]`; falls back to `generic` config |
| dav1d (via dependency) | AV1 decode | SIMD optimized | SIMD optimized | Scalar fallback |
| libwebp (via dependency) | WebP codec | SIMD optimized | SIMD optimized | Scalar C |
| crc32c (via dependency) | Checksums | Hardware CRC32C (SSE4.2) | Hardware CRC32C (ARM) | Software fallback |

Sources: [libaom.BUILD.bazel](https://github.com/google/tensorstore/blob/master/third_party/org_aomedia_aom/libaom.BUILD.bazel), [blake3.BUILD.bazel](https://github.com/google/tensorstore/blob/master/third_party/blake3/blake3.BUILD.bazel), GitHub code search for riscv across repository

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build system:** Bazel (via bundled Bazelisk). CMake support is present but explicitly marked experimental ("This is still very much a work in progress; It is not yet expected to build") and is generated from Bazel rules via `tools/cmake/bazel_to_cmake/`.

**Compiler requirements (from `docs/installation.rst`):**
- GCC >= 12 or Clang >= 16 (Linux)
- C++17 mandatory (enforced via `--cxxopt=-std=c++17` in `.bazelrc`)
- Python >= 3.11
- CMake >= 3.24 (for CMake path)

**riscv64 build procedure (untested, inferred from build system analysis):**

Bazel path on a native riscv64 machine:
```
python3 -m pip install .
```
or
```
python3 bazelisk.py build //...
```
The `.bazelrc` `build:linux --config=gcc_or_clang` applies automatically. No arch-specific Bazel flags are needed because libjpeg-turbo and blake3 have `//conditions:default` C fallbacks.

CMake cross-compilation path:
```
mkdir build && cd build
cmake .. -GNinja \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DTENSORSTORE_USE_SYSTEM_JPEG=ON \
  -DTENSORSTORE_USE_SYSTEM_LIBAOM=ON \
  -DTENSORSTORE_USE_SYSTEM_DAV1D=ON
```
The `USE_SYSTEM_*=ON` flags avoid NASM dependencies. NASM is only used for x86_64 ASM targets and would not be needed on riscv64, but the CMake configure step may still require NASM in PATH unless system libs are used.

**Platform mapping gap:** `tools/bazel_platforms/platform_mappings` and `platforms.py` enumerate supported processors as: AMD64, X86, ARM64, aarch64, arm64, x86_64, i386, i686, wasm32, wasm64, ppc64, ppc64le, armv7l. `riscv64` is absent. A CMake/Bazel riscv64 platform entry would need to be added for cross-compilation configurations.

**QEMU:** No QEMU configuration exists in the repository. No Dockerfiles for riscv64 are present. cibuildwheel is configured for `CIBW_MANYLINUX_X86_64_IMAGE` and `CIBW_MANYLINUX_AARCH64_IMAGE` only; `CIBW_MANYLINUX_RISCV64_IMAGE` is not set.

**Known build failures on riscv64:** None documented, because no build has been attempted upstream. No ppc64le build CI exists either, though issue #146 (open) shows that ppc64le required Bazel patches -- this is the closest analogue to a non-x86/ARM port attempt, and it suggests riscv64 would similarly require minor build system changes [NEEDS VERIFICATION].

Sources: [build.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml), [docs/installation.rst](https://github.com/google/tensorstore/blob/master/docs/installation.rst), [platforms.py](https://github.com/google/tensorstore/blob/master/tools/cmake/bazel_to_cmake/platforms.py), [GitHub issue #146](https://github.com/google/tensorstore/issues/146)

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core array I/O (Zarr, N5, HDF5, neuroglancer) | Full | Full | Expected full (scalar C++, no arch guards) |
| JPEG encode/decode | SIMD-accelerated (AVX2/SSE2) | SIMD-accelerated (NEON) | Scalar C (functional, slower) |
| AV1 encode (libaom) | SIMD-accelerated | SIMD-accelerated | Generic config only (functional, slower) |
| AV1 decode (dav1d) | SIMD-accelerated | SIMD-accelerated | Scalar fallback |
| WebP codec | SIMD-accelerated | SIMD-accelerated | Scalar C |
| BLAKE3 hashing | AVX2/AVX512/SSE | NEON | Scalar C (functional, slower throughput) |
| CRC32C checksum | Hardware (SSE4.2) | Hardware (ARM CRC) | Software fallback |
| gRPC transport (GCS, S3) | Full | Full | Functional (gRPC builds on riscv64; no PyPI riscv64 wheel -- see Sec. 9) |
| Python wheel (pip install) | Yes (PyPI manylinux) | Yes (PyPI manylinux) | No (must build from source) |
| Free-threading (Python 3.13t) | Not yet (issue #218 open) | Not yet | Not yet |

**Functional gaps on riscv64:** None expected for the core library. The AV1 and image codecs will work via scalar/generic paths. The primary practical gap is the absence of a prebuilt wheel, requiring source compilation.

**Performance gaps:** JPEG decode, AV1 encode/decode, WebP, and BLAKE3 hashing will run at scalar-only throughput on riscv64. For workloads that are I/O-bound (the common case for a storage library), this may be acceptable. For image-heavy pipelines, the codec performance gap vs arm64 is material.

**Floating-point semantics:** Data not available: no riscv64-specific floating-point issues were found in the issue tracker.

## 7. CI/CD Infrastructure

| CI item | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| GitHub Actions runner | `ubuntu-latest` | `arm-ubuntu-arm-22.04-8core` (native) | None |
| Builds on CI | Yes | Yes | No |
| Tests run on CI | Yes | Yes | No |
| Wheel published from CI | Yes | Yes | No |
| RISE runners | No | No | No |
| QEMU emulation | No | No | No |

The sole CI configuration is `.github/workflows/build.yml` and `.github/workflows/docs.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist. Neither workflow file contains any occurrence of "riscv", "riscv64", or "qemu".

Sources: [build.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml), [docs.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/docs.yml)

## 8. Distribution and Release Status

**PyPI (tensorstore 0.1.85, 25 files):**
- `tensorstore-0.1.85-cp311-cp311-manylinux_2_27_x86_64.whl`
- `tensorstore-0.1.85-cp311-cp311-manylinux_2_27_aarch64.whl`
- macOS x86_64 and arm64 variants for cp311-cp313
- `win_amd64` variants
- Source tarball
- riscv64: no wheel published

**Debian:** Package does not exist in Debian for any architecture. `packages.debian.org` search returns no results; `tracker.debian.org/pkg/tensorstore` returns 404.

**Arch Linux RISC-V:** Absent from [archriscv.felixc.at](https://archriscv.felixc.at).

**RISE wheel builder:** Absent from the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (78 packages listed; tensorstore not among them).

**To obtain a working binary on riscv64:** A user must build from source on a native riscv64 machine or via QEMU chroot using `python3 -m pip install . --no-binary :all:` or `python3 bazelisk.py build //...`. No binary shortcut exists through any channel.

Sources: [PyPI tensorstore files](https://pypi.org/project/tensorstore/#files), [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)

## 9. Dependencies

The table below covers all bundled and linked dependencies with JIT, SIMD, cryptographic, compression, or numeric roles. riscv64 status is drawn from research findings.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Open issues |
|------------|------|--------------|-------------|----------------|-------------|
| abseil-cpp | Base containers, hash, CRC, sync | Builds (GCC 11 linker issue with shared libs: #1702) | 2 SEGFAULT failures on Debian unstable (#2002, open) | No prebuilt | #1702 (linker, open), #2002 (SEGFAULT, open) |
| BLAKE3 | Content-addressable hashing | Builds (scalar) | Passes | No prebuilt | #484 (RVV request, performance only) |
| BoringSSL | TLS/crypto for gRPC | Builds | Passes | Embedded build | No open riscv64 issues |
| brotli | Compression codec | Builds | Passes | No prebuilt riscv64 wheel | No open issues |
| bzip2 | Compression codec | Builds | Passes | Distro-packaged | No open issues |
| c-ares | Async DNS resolver (gRPC dep) | Builds | Passes | Distro-packaged | No open issues |
| c-blosc | Block compression (Zarr/N5) | Builds (scalar; AVX2/SSE4 N/A) | Passes | No riscv64 release | No open issues; no RVV path |
| crc32c | CRC32C checksum | Builds (software fallback) | Passes | No prebuilt | No open issues |
| curl/libcurl | HTTP(S) client (GCS, S3, HTTP KV) | Builds | Passes | Distro-packaged | No open issues |
| dav1d | AV1 decode | Builds (scalar fallback) | Passes | No prebuilt | No open issues |
| gRPC | RPC framework (GCS, gRPC KV) | Builds; RISE publishes manylinux riscv64 wheels (1.72-1.76 tested) | Passes (#37791 SIGILL closed) | No upstream PyPI riscv64 wheel (#41591 open) | #41591 (no PyPI wheel) |
| libaom | AV1 encode | Builds (generic config) | Passes | No prebuilt | No open riscv64 issues |
| libavif | AVIF codec | Builds | Passes | No prebuilt | No open issues |
| libjpeg-turbo | JPEG codec | Builds (scalar; riscv64 binaries added per #885) | Passes | riscv64 binaries available | No blocking issues |
| libpng | PNG codec | Builds | Passes | Distro-packaged | No open issues |
| libtiff | TIFF codec | Builds | Passes | Distro-packaged | No open issues |
| libwebp | WebP codec | Builds (scalar fallback) | Passes | No prebuilt | No open issues |
| libyuv | YUV conversion (SIMD) | Builds (scalar) | Passes | No prebuilt | No open issues; no RVV path |
| LZ4 | Fast compression | Builds | Passes | Distro-packaged | #1633 (RVV optimization, performance only) |
| nghttp2 | HTTP/2 (gRPC dep) | Builds | Passes | Distro-packaged | No open issues |
| nlohmann/json | JSON parsing | Builds (header-only) | Passes | N/A | No open issues |
| Protocol Buffers | Serialization | Builds (#12266 closed) | Passes | No prebuilt protoc binary (#17798 open) | #17798 (no protoc prebuilt) |
| re2 | Regex engine | Builds | Passes | No prebuilt | No open issues |
| riegeli | Streaming serialization | Builds | Passes | No prebuilt | No open issues |
| aws-s2n-tls | TLS (AWS SDK dep) | Builds | Passes | No prebuilt | No open issues |
| aws-c-{common,io,http,cal,auth} | AWS SDK C components (S3) | Builds | Passes | No prebuilt | No open issues |
| snappy | Fast compression | Builds | Passes | No prebuilt | No open issues |
| xz/liblzma | LZMA compression | Builds | Passes | Distro-packaged | No blocking issues (#146 closed) |
| zlib | Deflate compression | Builds | Passes | Distro-packaged | No open issues |
| zstd | Fast compression | Builds (#3134 closed) | Passes | No prebuilt | No blocking issues |
| pybind11 | Python/C++ bindings | Builds | Passes | No prebuilt | No open issues |

**Highest-priority open dependency issues:**

1. **abseil-cpp #2002 (open):** Two test SEGFAULTs (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`) on Debian unstable riscv64, release 20260107.0. TensorStore uses Abseil containers and Cord extensively; this is a correctness concern until resolved.

2. **abseil-cpp #1702 (open):** Cross-compilation linker error (`__atomic_exchange_1` undefined) when building shared libs with GCC 11 Buildroot. Workaround: use GCC >= 12 or static builds.

3. **gRPC #41591 (open):** No upstream PyPI riscv64 wheel. RISE provides tested wheels (1.72-1.76) but not on PyPI. Users of TensorStore's gRPC-based transports must build gRPC from source or use RISE wheels.

4. **Protocol Buffers #17798 (open):** No prebuilt `protoc` binary for riscv64, which blocks cross-compilation workflows relying on prebuilt protoc. Native builds work.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the tensorstore issue tracker. The following general open issues are reproduced for completeness.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #290 | Intermittent ALREADY_EXISTS failure on GCS with create|delete_existing | Open | Medium | Not architecture-specific |
| #282 | Issues creating neuroglancer dataset from schema | Open | Medium | Not architecture-specific |
| #241 | Zarr v3 struct support | Open | Low | Feature gap, not a bug |
| #231 | Performance drop on 1D Zarr file (1.8x slower than 2D reshape) | Open | Low | x86_64 benchmark data only; not architecture-specific |
| #218 | Python 3.13t free-threading wheels not shipped | Open | Low | Affects all platforms |
| #195 | Read speeds decrease 2x with fewer parallel processes | Open | Low | Multi-node GPU cluster; not architecture-specific |
| #150 | Transactional/ACID semantics feature gap | Open | Medium | Not architecture-specific |
| #146 | Building on ppc64le requires Bazel patches | Open | Medium | Closest analogue to riscv64 port attempt; no riscv64 equivalent started |
| #114 | S3 support umbrella | Open | Medium | Not architecture-specific |

**Correctness bugs:** None confirmed on riscv64. The abseil-cpp #2002 SEGFAULTs (in a dependency, not tensorstore itself) are the nearest correctness risk.

## 12. Objections and Upstream Blockers

**Organizational blocker:** TensorStore is a Copybara-synced mirror of a Google-internal repository. External contributions require a Google CLA and must be merged by Google engineers internally before appearing in the public mirror. This means a RISC-V port contributed externally would require a Google engineer to champion it internally. There is no evidence that Google has a current interest in riscv64 for TensorStore.

**No stated objections:** The project has no documented stance against new architecture ports. No issue has been filed to request RISC-V support, so there has been no opportunity for Google maintainers to state support or opposition.

**Acceptance probability:** Low without a Google-internal driver. Medium if a major Google customer or internal team requires riscv64 tensorstore (e.g., for RISC-V ML inference data pipelines).

**Technical blockers:** None identified that would prevent a build. The platform mapping (`platforms.py`) needs a `riscv64` entry. The libaom bundled codec needs a riscv64 generated config or must be excluded/replaced with a system library. These are minor engineering tasks (days, not weeks).

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, not distro-packaged on riscv64)
- **Release provider:** none

**Justification:** TensorStore has no riscv64 CI, no riscv64 prebuilt binary in any distribution channel (PyPI, Debian, Arch, RISE wheel builder), and zero RISC-V activity in its issue tracker or codebase. The project explicitly excludes riscv64 from the bundled AOM AV1 codec build targets. Confirmed via [build.yml](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml) and [PyPI release 0.1.85](https://pypi.org/project/tensorstore/#files).

**Pending work that could change the grade:** None underway. A RISE wheel builder addition (requiring a working native build + cibuildwheel riscv64 config) would move the grade to yellow or blue depending on whether tests pass. Resolving abseil-cpp #2002 would be a prerequisite for a clean blue grade.

## 14. Investment Analysis

RISE has no existing investment in tensorstore. No duplication risk with any RISE-funded work.

### 14.1 Functional Enablement

The primary functional gap is the absence of a riscv64 build path, platform mapping, and prebuilt wheel. The core library is expected to build cleanly on riscv64 once minor platform configuration is added. The libaom bundled codec requires either a riscv64 generated config (similar to the existing arm64 config) or a system-libaom override.

Work items:
- Add `riscv64` to `platforms.py` processor mapping (Bazel + CMake)
- Add `CIBW_MANYLINUX_RISCV64_IMAGE` to cibuildwheel configuration
- Generate or add libaom riscv64 config (or switch to `USE_SYSTEM_LIBAOM=ON` for initial enablement)
- Verify build completes on native riscv64 hardware (Debian Unstable or Ubuntu 24.04 riscv64)
- Resolve abseil-cpp #2002 (SEGFAULT in tests) -- external dependency, file upstream bug or apply workaround

### 14.2 Performance Optimization

TensorStore is a storage I/O library. Performance-critical operations are:
- JPEG/AV1/WebP codec throughput (currently scalar on riscv64)
- BLAKE3 hash throughput (currently scalar; RVV path tracked by BLAKE3 #484)
- CRC32C (software fallback on riscv64)

For storage I/O workloads, throughput is typically network/disk-bound rather than codec-bound. RVV optimization of these codecs is the responsibility of the respective upstream projects (libjpeg-turbo, dav1d/libaom, BLAKE3) and is not tensorstore's to implement.

No first-party SIMD or performance optimization work is required in tensorstore itself.

### 14.3 CI/CD Infrastructure

Add a riscv64 runner (QEMU or native) to `build.yml`. RISE provides GitHub Actions runners for riscv64 that could be used here if Google is receptive. This requires Google maintainer approval given the Copybara model.

### 14.4 Ecosystem Enablement

TensorStore does not have a plugin or extension ecosystem. Users of TensorStore on riscv64 may also need gRPC (covered by RISE wheel builder) and Protocol Buffers (protoc prebuilt blocked by #17798). These are dependency-level gaps, not tensorstore-level.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Add riscv64 to platforms.py and cibuildwheel config | 1 | Qualcomm or RISE contributor | High |
| Functional | Generate libaom riscv64 config or switch to system libaom | 1 | Qualcomm or RISE contributor | High |
| Functional | Verify build and test pass on native riscv64 | 1 | Qualcomm or RISE contributor | High |
| Functional | Resolve abseil-cpp #2002 SEGFAULTs (upstream dependency) | 2 | abseil-cpp maintainers | High |
| Functional | Add riscv64 wheel to PyPI release (coordinate with Google) | 1 | Google maintainer sign-off required | High |
| CI/CD | Add riscv64 CI runner to build.yml | 1 | Google maintainer + RISE runner | Medium |
| Performance | RVV BLAKE3 path (upstream blake3 #484) | 3 | BLAKE3 community / RISE | Low |
| Performance | RVV libjpeg-turbo, dav1d, libwebp paths | 4-8 (per codec) | Respective upstream projects | Low |

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/tensorstore repository](https://github.com/google/tensorstore)
- [TensorStore homepage](https://google.github.io/tensorstore/)
- [build.yml CI workflow](https://github.com/google/tensorstore/blob/master/.github/workflows/build.yml)
- [docs.yml CI workflow](https://github.com/google/tensorstore/blob/master/.github/workflows/docs.yml)
- [libaom.BUILD.bazel (riscv64 exclusion)](https://github.com/google/tensorstore/blob/master/third_party/org_aomedia_aom/libaom.BUILD.bazel)
- [blake3.BUILD.bazel](https://github.com/google/tensorstore/blob/master/third_party/blake3/blake3.BUILD.bazel)
- [platforms.py (Bazel/CMake processor mapping)](https://github.com/google/tensorstore/blob/master/tools/cmake/bazel_to_cmake/platforms.py)
- [PyPI tensorstore 0.1.85 release files](https://pypi.org/project/tensorstore/#files)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [abseil-cpp #2002 (SEGFAULT on riscv64)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp #1702 (linker error riscv64)](https://github.com/abseil/abseil-cpp/issues/1702)
- [gRPC #41591 (no PyPI riscv64 wheel)](https://github.com/grpc/grpc/issues/41591)
- [Protocol Buffers #17798 (no protoc prebuilt for riscv64)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [BLAKE3 #484 (RVV SIMD request)](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [LZ4 #1633 (RVV optimization proposal)](https://github.com/lz4/lz4/issues/1633)
- [tensorstore issue #146 (ppc64le build)](https://github.com/google/tensorstore/issues/146)
- [tensorstore issue #218 (Python 3.13t free-threading)](https://github.com/google/tensorstore/issues/218)
- [tensorstore issue #231 (1D Zarr performance)](https://github.com/google/tensorstore/issues/231)
- [tensorstore issue #290 (GCS ALREADY_EXISTS)](https://github.com/google/tensorstore/issues/290)
- [Arch Linux RISC-V package listing](https://archriscv.felixc.at)
- [RISE project homepage](https://riseproject.dev)
