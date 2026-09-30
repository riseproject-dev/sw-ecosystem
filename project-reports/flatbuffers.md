---
title: FlatBuffers
parent: Project Reports
color: yellow
dependencies:
  - name: gRPC
    relation: test-dependency
    criticality: optional
  - name: Abseil
    relation: test-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: test-dependency
    criticality: optional
  - name: bitflags
    relation: runtime-dependency
    criticality: critical
  - name: serde
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="flatbuffers" %}

# FlatBuffers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for FlatBuffers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

FlatBuffers is a zero-copy binary serialization library created at Google in 2014. It provides a schema compiler (`flatc`) and language runtime bindings for C++, Rust, Python, Go, Java, JavaScript/TypeScript, Dart, Swift, and others. The wire format is little-endian and designed for in-place reads without parsing or memory allocation.

**Governance:** No foundation affiliation. FlatBuffers is not under the Linux Foundation, CNCF, Apache Foundation, or any other foundation body. It is Google-controlled open source under the Apache License 2.0, hosted at [google/flatbuffers](https://github.com/google/flatbuffers). Governance is informal: a single `.github/CODEOWNERS` file names one default owner for the entire repository, Derek Bailey (`@dbaileychess`, derekbailey@google.com). No `MAINTAINERS` or `OWNERS` file exists. Contribution requires a Google Individual CLA (or the Software Grant and Corporate CLA for corporate contributions); `CONTRIBUTING.md` asks contributors to coordinate via the issue tracker before starting larger work. No formal platform/architecture support tier policy exists.

**Corporate maintainers (from `git shortlog -sne --all` on the current checkout):**
- Wouter van Oortmerssen (wvo@google.com / aardappel@gmail.com), ~489+324 commits, Google, original creator.
- Derek Bailey (derekbailey@google.com / dbaileychess@gmail.com), ~341+55 commits, Google, current sole CODEOWNER and primary maintainer.
- Stewart Miles (smiles@google.com), Google.
- Marcel (maleo@google.com), Google.
- Other frequent contributors (Vladimir Glavnyy, Casper Neo, mustiikhalil, Paulo Pinheiro, Bjorn Harrtell, Ivan Dlugos, Kamil Rojewski, and others) commit from personal/gmail/noreply addresses with no other identifiable company affiliation. Effectively all clearly-corporate committers are Google employees; no other sponsoring company appears among top committers.

**RISE membership:** Google is a Premier Member of the RISE project (RISE Premier Members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent). FlatBuffers itself is not a RISE member project and has no RISE-funded work. All 33 RISE blog posts (2024-05-15 through 2026-09-28) were checked by title/summary; none mention FlatBuffers. A direct site search of riseproject.dev for "FlatBuffers" returns no results. FlatBuffers does not appear in the [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (75 packages checked). The RISE GitLab PyPI package registry has no dedicated `flatbuffers` index either: a query against `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/flatbuffers/` returns an HTTP 302 redirect straight to the public PyPI index, meaning RISE has not built or published a custom riscv64 wheel for it. Search of the `riseproject-dev` GitHub org (repo search and code search) found FlatBuffers only as a bundled/vendored third-party dependency inside unrelated projects' license-notice CI steps (e.g. `riseproject-dev/python-wheels`), never as its own RISE repository or RISE-funded project (RFP).

**Community stance on new ports:** No `PLATFORMS.md`, `docs/platforms/` directory, or written CPU-architecture tier policy exists. The repository's only support-matrix document, `docs/source/support.md`, tracks language/feature coverage (C++, Java, C#, Go, Python, JS, TS, C, PHP, Dart, Lobster, Rust, Swift x features), not CPU architectures. It states new language bindings "typically depend on community contributions" rather than being officially resourced by Google. Because FlatBuffers has no architecture-specific code for any CPU (see Section 4), a "new CPU port" is not a recognized contribution category the way a new language binding is; nothing in the repository addresses it. The practical barrier to RISC-V CI is operational (adding a QEMU or native runner step), not governance or code.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Feb 2022 | Issue [#7090](https://github.com/google/flatbuffers/issues/7090) filed: CMake POST_BUILD step runs cross-compiled `flatc` on the host, fails for arm64-on-x86_64 | [google/flatbuffers](https://github.com/google/flatbuffers) |
| Feb 2022 | Issue #7090 closed: POST_BUILD invocation of `generate_code.py` removed from CMakeLists.txt | [google/flatbuffers](https://github.com/google/flatbuffers) |
| May 2022 | Issue [#7297](https://github.com/google/flatbuffers/issues/7297) filed: "Exec format error" cross-compiling FlatBuffers v2.0.5/v2.0.6 for RISC-V on an amd64 host running Ubuntu 18.04, GCC 7.5.0; root cause is `scripts/generate_code.py` executing the just-built, cross-compiled `flatc` during the build | [Issue #7297](https://github.com/google/flatbuffers/issues/7297) |
| May 2022 | Issue #7297 closed. No comments are visible on the issue and no linked PR/fix could be confirmed by direct inspection; the current `CMakeLists.txt` has no POST_BUILD `flatc` invocation, consistent with the fix being inherited from #7090 | [Issue #7297](https://github.com/google/flatbuffers/issues/7297) |
| ~2026-06 | Debian sid builds `flatbuffers 23.5.26+dfsg-4+b2` for riscv64 on builder `rv-osuosl-02`, status Installed | [Debian buildd](https://buildd.debian.org/status/package.php?p=flatbuffers&suite=sid) |
| 2026-04-02 | Arch Linux RISC-V repo publishes `flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` and `python-flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` | [archriscv.felixc.at](https://archriscv.felixc.at/repo/extra/) |
| 2026-09-30 (confirmed live) | Ubuntu 26.04 "resolute" (devel suite) carries `flatbuffers-compiler`, `flatbuffers-compiler-dev`, `libflatbuffers-dev`, `libflatbuffers23.5.26` built for riscv64 from unmodified upstream source | [Ubuntu packages: flatbuffers, resolute](https://packages.ubuntu.com/search?keywords=flatbuffers&suite=resolute&searchon=names&section=all) |

There is no dedicated RISC-V port effort and no riscv64 tracking issue. Repeated, independently re-run searches this session (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`, each with `riscv`/`riscv64`/`"risc-v"` queries scoped to `repo:google/flatbuffers`) all return zero results. A sanity-check query for "test" against the same repo/owner correctly returns real results, confirming the search tooling itself works and the riscv queries are genuinely empty, not a tool failure. Issue #7297 is the only issue anywhere in the repository's history that mentions RISC-V at all, and it is a generic host/target cross-compilation bug, not RISC-V-specific engineering (the same failure mode would occur cross-compiling for ARM, MIPS, or any other target). No RISC-V-specific commits have ever been made to the repository.

**Key contributors for RISC-V work:** None. All riscv64 packaging was done by Debian and Arch Linux RISC-V distro maintainers, and now also by Ubuntu, independent of Google or any FlatBuffers contributor.

## 3. Upstream Support Tier

No formal support tier policy exists in the FlatBuffers repository. The de facto tier is determined by what upstream CI tests and what binaries the project ships.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner in upstream `.github/workflows/` | Yes (`ubuntu-24.04`, `ubuntu-latest`, `windows-2022`, `windows-latest`) | Partial (`macos-15-intel`, `macos-latest`, `macos-15` cover Apple Silicon) | No |
| Pre-built binary in GitHub releases | Yes (`Linux.flatc.binary.g++-13.zip`, `Linux.flatc.binary.clang++-18.zip`, `Windows.flatc.binary.zip`) | Yes (`Mac.flatc.binary.zip` covers Apple Silicon) | No |
| Release-blocking test coverage | Yes | No | No |
| Distro package available | Yes | Yes | Yes (Debian sid 23.5.26+dfsg-4+b2; Arch Linux RISC-V 25.12.19-4; Ubuntu 26.04 resolute, devel suite, 23.5.26+dfsg-4build1) |

The upstream project treats riscv64 as an unsupported, untested architecture from a CI and release-engineering standpoint. It is supported solely through downstream distro packaging built from unmodified upstream source.

## 4. Technical Architecture and RISC-V-Specific Subsystems

FlatBuffers is a pure serialization library: no JIT, no SIMD dispatch engine, no cryptography, no garbage collector. The schema compiler (`flatc`) is a standard C++ binary; the runtime library is header-only C++ templates for most use cases.

A full-repository scan (`grep -rniI "riscv"` across all source, headers, and CMake files) finds zero matches anywhere except one unrelated `pnpm-lock.yaml` entry (`@esbuild/linux-riscv64`, an optional npm platform variant for the JS-tooling `esbuild` dev dependency, not FlatBuffers code). The entire codebase contains exactly two CPU-architecture conditionals, for any architecture:

1. `include/flatbuffers/flexbuffers.h:168`: `#if defined(_MSC_VER) && defined(_M_X64) && !defined(_M_ARM64EC)`, a Windows/MSVC-only fast path using the `__movsb` intrinsic for one hot read function. Irrelevant to GCC/clang builds on any Unix target (amd64, arm64, or riscv64 alike).
2. `include/flatbuffers/base.h:120`: `#if defined(__s390x__)`, hard-codes `FLATBUFFERS_LITTLEENDIAN=0` as an endianness override for IBM s390x.

Every other architecture, including riscv64, resolves endianness via `FLATBUFFERS_LITTLEENDIAN`, itself derived from the portable `__BYTE_ORDER__`/`__BIG_ENDIAN__` compiler macros (GCC/clang), one generic branch shared identically by amd64, arm64, and riscv64. No `arch/`, `riscv64/`, `x86/`, or `arm64/` directories or file-naming convention exist anywhere in `src/`, `include/`, or `tests/`.

| Component | What it does | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Endianness detection (`base.h`) | Selects byte-swap path | scalar via `__BYTE_ORDER__` macro | scalar via `__BYTE_ORDER__` macro | scalar via `__BYTE_ORDER__` macro (little-endian default, correct for standard Linux riscv64) |
| Unaligned scalar read (`ReadScalar` in `base.h`) | Reads typed value from byte buffer | UBSan-suppressed reinterpret cast | UBSan-suppressed reinterpret cast | UBSan-suppressed reinterpret cast (see Section 11) |
| Bulk copy in FlatBufferBuilder | Copies aligned data | scalar byte copy | scalar byte copy | scalar byte copy |
| FlexBuffers fast-copy (`flexbuffers.h`) | Bulk memory move | one MSVC-only `__movsb` intrinsic on x64; all other paths scalar | scalar | scalar |
| Rust crate endianness (`endian_scalar.rs`) | `to_le()`/`from_le()` | portable Rust | portable Rust | portable Rust |
| `flatc` schema compiler | Code generation binary | pre-built in GitHub releases | not pre-built for Linux arm64 (macOS arm64 covered via universal Mac binary) | not pre-built; build from source |
| CI coverage | Regression detection | full upstream CI | macOS only | none |

No hand-tuned paths, SIMD intrinsics, RVV code, or `.S` assembly files exist for any architecture. riscv64 is not a tiered or partial implementation relative to amd64/arm64: it receives the exact same complete, generic scalar C++ implementation every other supported architecture (amd64, arm64, s390x, ppc64el, armhf) receives, which is why Debian, Arch Linux RISC-V, and Ubuntu can all build it unmodified for riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (primary), minimum version 3.8. Bazel is also supported (`BUILD.bazel`, `MODULE.bazel`). Language standard: C++11 minimum, configurable up to C++17/20/23 via `-DFLATBUFFERS_CPP_STD=17`.

**Native build on riscv64:**

```sh
cmake -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release \
  -DFLATBUFFERS_STRICT_MODE=ON \
  -DFLATBUFFERS_BUILD_TESTS=ON
make -j$(nproc)
./flattests
```

**Cross-compilation for riscv64 from an x86_64 host:**

No upstream toolchain file exists. Standard CMake cross-compilation variables apply. `flatc` must be built for the host separately, because the build invokes it during code generation; cross-compiling `flatc` itself for the target and trying to run it on the host is exactly the bug that produced the closed issue #7297 (Section 2):

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

This is standard cross-compilation practice, not a RISC-V-specific concern; the current `CMakeLists.txt` (HEAD `b8431fb`, 2026-09-14) has no POST_BUILD `flatc` invocation, so #7297's failure mode does not reproduce on current master.

**Tested compiler versions (from upstream CI, current workflows):** GCC 13 (`g++-13`) and Clang 18 (`clang++-18`) on `ubuntu-24.04`. Any C++11-compatible GCC or Clang is sufficient for the library itself; the CMake build does not require a specific riscv64 toolchain version, only a functioning `riscv64-linux-gnu-gcc`/`g++` pair, which every mainstream distro ships.

**QEMU:** No upstream QEMU scripts or CI jobs exist. To run tests under user-mode emulation:

```sh
apt install qemu-user
qemu-riscv64 -L /usr/riscv64-linux-gnu ./flattests
```

**Endianness:** `include/flatbuffers/base.h` auto-detects endianness via `__BYTE_ORDER__`/`__BIG_ENDIAN__` compiler macros. Standard Linux riscv64 is little-endian; `FLATBUFFERS_LITTLEENDIAN=1` is set automatically, no manual override needed.

**Known build failures on riscv64:** None currently open. Issue #7297 (cross-compilation exec error) is closed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| C++ serialization/deserialization | Yes | Yes | Yes | Portable C++ |
| FlexBuffers (dynamic typing) | Yes | Yes | Yes | Portable C++ |
| Zero-copy buffer access | Yes | Yes | Yes | Portable |
| `flatc` schema compiler | Yes (pre-built binary) | Yes (macOS pre-built) | Build from source | No riscv64 GitHub release binary |
| Rust crate | Yes | Yes | Yes | Pure Rust, architecture-agnostic |
| Python binding | Yes | Yes | Yes | Pure Python, no native extension |
| SIMD-accelerated serialization | No | No | No | No SIMD exists for any architecture |
| RVV intrinsics | N/A | N/A | No | Not applicable; library is scalar by design |
| Upstream CI coverage | Yes | Partial (macOS arm64 only) | No | See Section 7 |

**Functional gaps:** None. riscv64 is functionally complete relative to amd64 and arm64, confirmed by Debian, Arch Linux RISC-V, and Ubuntu all building and shipping it from unmodified upstream source.

**Performance gaps from missing SIMD:** None specific to riscv64. FlatBuffers implements no SIMD for any architecture.

**Unaligned access risk:** `ReadScalar` in `include/flatbuffers/base.h` uses a UBSan-suppressed reinterpret cast rather than a `memcpy`-based safe read. On RISC-V cores that trap unaligned loads without kernel emulation, this could fault; see Section 11 for detail. No filed issue exists for this specifically on Linux riscv64. [NEEDS VERIFICATION]

**NaN / floating-point:** No NaN or floating-point correctness issues specific to riscv64 were found in any source searched (GitHub issues, code search, or the RISE project status report).

**Security hardening:** No riscv64-specific hardening gaps were identified. The library has no cryptographic code.

## 7. CI/CD Infrastructure

All six workflow files under `.github/workflows/` in `google/flatbuffers` (`build.yml`, `docs.yml`, `label.yml`, `main.yml`, `release.yml`, `stale.yml`) were read directly from a local clone synced to `origin/master` HEAD `b8431fbcd7a5c71817f314e18b332c0648554efa` (dated 2026-09-14). Full-content search for "riscv", "riscv64", "linux/riscv64", "RISCV", "qemu", and cross-compile/emulation markers (`docker/setup-qemu-action`, etc.) returns zero matches across all six files.

| Workflow file | Purpose | Runners used | riscv64 present |
|---|---|---|---|
| `build.yml` | Main build/test matrix across Linux gcc/clang, Windows, macOS, Android, 12+ language bindings | `ubuntu-24.04`, `ubuntu-latest`, `windows-2022`, `windows-latest`, `macos-15-intel`, `macos-latest`, `macos-15` | No |
| `release.yml` | Publish to npm, PyPI, NuGet, Maven, crates.io | `ubuntu-latest`, `windows-latest`, `macos-latest` | No |
| `main.yml` | OSS-Fuzz integration | `ubuntu-latest` | No |
| `stale.yml` | Stale issue/PR bot | github-hosted (no build) | No |
| `label.yml` | PR labeler | github-hosted (no build) | No |
| `docs.yml` | MkDocs deployment | `ubuntu-latest` | No |

`.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` are all confirmed absent from the repository root. The only "riscv" string in the entire repository outside these findings is `pnpm-lock.yaml`'s `@esbuild/linux-riscv64` optional npm platform entry, which has no `on:` trigger, no `runs-on:`, and executes nothing.

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI runner | Yes | macOS only | No |
| Release-blocking test suite | Yes | No | No |
| QEMU test job | N/A | No | No |
| RISE CI runner | No | No | No |
| Downstream distro CI (Debian buildd, Ubuntu buildd) | Yes | Yes | Yes |

All riscv64 test coverage is provided exclusively by distro build infrastructure (Debian's `rv-osuosl-02` buildd node, Ubuntu's buildd network), not by the upstream project. No RISE-provided RISC-V hardware runner or RISE CI job exists for FlatBuffers.

## 8. Distribution and Release Status

**Upstream GitHub releases:** Recent releases (e.g. v25.9.23, v25.2.10) each ship the same asset set: `Linux.flatc.binary.clang++-18.zip`, `Linux.flatc.binary.g++-13.zip`, `Mac.flatc.binary.zip`, `MacIntel.flatc.binary.zip`, `Windows.flatc.binary.zip`, plus source archives. No asset filename on any recent release contains "riscv" or "riscv64"; the Linux binaries are generic x86_64-glibc builds only. This was confirmed via the public release-assets page (`github.com/google/flatbuffers/releases/expanded_assets/<tag>`); GitHub's REST API and the standard releases web UI were blocked at the proxy layer for this unattached repository during part of this research, so the release-asset enumeration rests on the public fragment-page fetch rather than the API.

**PyPI (`flatbuffers` package):** Latest version 25.12.19, shipping only `flatbuffers-25.12.19-py2.py3-none-any.whl`, a pure-Python universal wheel. All 31 releases back to version 1.9 follow the same pattern (`py2.py3-none-any.whl` or `.tar.gz` sdist only). No riscv64-specific filename exists or is needed: the package is pure Python and architecture-independent, installing on riscv64 without a dedicated build.

**RISE wheel builder / RISE PyPI registry:** FlatBuffers is absent from the [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (75 packages checked, includes numpy, pandas, grpcio, onnx, tokenizers, but not flatbuffers). The RISE GitLab PyPI project index for `flatbuffers` redirects (HTTP 302) straight to the public PyPI index rather than serving a distinct package, confirming RISE has not built a custom riscv64 wheel for it. Neither is needed since the package is already pure Python.

**Debian sid:** `flatbuffers-compiler`, `libflatbuffers-dev`, `libflatbuffers23.5.26` at `23.5.26+dfsg-4+b2`, built for riscv64, status Installed, builder `rv-osuosl-02`. The packaged version (23.5.26) trails upstream (25.12.19).

**Arch Linux RISC-V:** `flatbuffers-25.12.19-4-riscv64.pkg.tar.zst` and `python-flatbuffers-25.12.19-4-riscv64.pkg.tar.zst`, both dated 2026-04-02, version matching upstream 25.12.19.

**Ubuntu 26.04 "resolute":** Confirmed live via direct fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=flatbuffers&suite=resolute&searchon=names&section=all): `flatbuffers-compiler`, `flatbuffers-compiler-dev`, `libflatbuffers-dev`, `libflatbuffers23.5.26` (all at 23.5.26+dfsg-4build1, `universe` section) build for `amd64 arm64 armhf ppc64el riscv64 s390x`; `python3-flatbuffers` and `golang-github-google-flatbuffers-dev` are architecture-independent (`all`). This is a real, buildd-compiled riscv64 binary for the C++ compiler and shared library, not a source-only or aspirational listing, and it refutes any claim that no riscv64 FlatBuffers binary exists anywhere. Caveat: "resolute" (Ubuntu 26.04) is the in-development suite as of this writing, not yet a finalized stable release, so this is a pre-release archive binary rather than a released-LTS one. [NEEDS VERIFICATION: riscv64 build success on a finalized Ubuntu LTS release was not independently confirmed by direct buildd API fetch in this research round.]

**archriscv.felixc.at search page:** Attempted as an additional cross-check; the page's `?q=` search parameter is not wired to any server-side search (static informational page only), so it could not be used to confirm or refute package presence beyond the repo listing already cited above.

**What a user must do to get a working binary on riscv64:**
- C++ library: `apt install libflatbuffers-dev` on Debian/Ubuntu, or `pacman -S flatbuffers` on Arch Linux RISC-V; both include riscv64 packages.
- `flatc` compiler: `apt install flatbuffers-compiler` on Debian/Ubuntu (packaged version trails upstream), or build from source for the latest upstream version.
- Rust crate: `cargo add flatbuffers`; compiles natively via the `riscv64gc-unknown-linux-gnu` Rust target (Tier 2).
- Python: `pip install flatbuffers`; pure Python, works on any platform including riscv64 with no special handling.

## 9. Dependencies

**Dependency surface:** The C++ core has no required external runtime dependencies; `flatc` is self-contained. `FLATBUFFERS_BUILD_GRPCTEST` (default `OFF`) is the only CMake option that pulls in gRPC, Abseil, and Protocol Buffers, and it gates an optional C++ test target only, not production use. `rust/flatbuffers/Cargo.toml` declares `bitflags = "2.8.0"` as a required runtime dependency and `serde` as optional, feature-gated (`serialize = ["serde"]`). `python/setup.py` confirms the Python binding has zero dependencies.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Open riscv64 issues |
|---|---|---|---|---|---|
| gRPC (grpc/grpc), test-dependency, optional | `FLATBUFFERS_BUILD_GRPCTEST` C++ test target only, not needed for production use | Yes: `libgrpc-dev`, `libgrpc++-dev` present in Ubuntu 26.04 resolute riscv64; Debian `libgrpc-dev` v1.51.1-9 | Functional; SIGILL bug [#37791](https://github.com/grpc/grpc/issues/37791) closed Oct 2024, undefined-atomic-symbol bug [#35839](https://github.com/grpc/grpc/issues/35839) closed Feb 2024 | PyPI `grpcio` riscv64 wheel issue [#41591](https://github.com/grpc/grpc/issues/41591) is now closed (confirmed 2026-09-30; was open as of 2026-07-20) | None open that block FlatBuffers use |
| Abseil, test-dependency, optional | Transitive via gRPC test target only (`find_package(absl CONFIG REQUIRED)`) | Yes: `libabsl-dev` present in Ubuntu 26.04 resolute riscv64; Debian `libabsl-dev` v20260107.0-5 | Two Debian sid riscv64 test failures reported historically (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`; Debian bug #1126886, abseil issue #2002); not independently reproduced in this research round | Debian/Ubuntu package only | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) open as of 2026-09-30 (undefined `__atomic_compare_exchange_1` with a Bootlin cross-toolchain; workaround `-latomic`); PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) (RISC-V CRC32C hardware acceleration) still open/unmerged |
| Protocol Buffers, test-dependency, optional | Transitive via gRPC test target only (`find_package(protobuf CONFIG REQUIRED)`) | Yes: `libprotobuf-dev`, `protobuf-compiler` present in Ubuntu 26.04 resolute riscv64; Debian `libprotobuf-dev` v3.21.12-16 | Passing; [#14549](https://github.com/protocolbuffers/protobuf/issues/14549) and [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) both closed | Maven riscv64 `protoc` prebuilt added ([#17798](https://github.com/protocolbuffers/protobuf/issues/17798), closed Sep 2024); Python `protoc` wheel still lacks riscv64 (abandoned PRs #23205/#23206) | None open blocking C++ use |
| bitflags, runtime-dependency, critical | Rust binding runtime; flag/enum bitfield types | Yes: pure Rust crate, architecture-agnostic; `librust-bitflags-dev` present in Ubuntu 26.04 resolute riscv64; `riscv64gc-unknown-linux-gnu` is Rust Tier 2 | Yes; a fresh search for riscv64 issues against `bitflags/bitflags` returns zero results | crates.io (architecture-agnostic) plus Debian/Ubuntu `librust-bitflags-dev` for riscv64 | None identified |
| serde, runtime-dependency, optional | Rust binding, feature-gated serialization framework | Yes: pure Rust proc-macro crate; `librust-serde-dev` present in Ubuntu 26.04 resolute riscv64 | Yes; only one unrelated closed issue found ([#1351](https://github.com/serde-rs/serde/issues/1351), 2018, generic build-illegal-instruction, not confirmed riscv64-specific) | crates.io plus Debian/Ubuntu `librust-serde-dev` for riscv64 | None identified |

**Summary:** No FlatBuffers dependency is a riscv64 blocker for production use. The only open issue of note, Abseil's #1702 (a linker symbol problem with a specific cross-toolchain, with a known `-latomic` workaround), affects only the optional gRPC test target, not core FlatBuffers functionality. The gRPC PyPI wheel gap that was open as of the prior report (2026-07-20) is now closed (confirmed 2026-09-30), an improvement in the dependency surface since that report.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|---|---|---|---|---|
| [#7297](https://github.com/google/flatbuffers/issues/7297) | "Exec format error" when cross compiling to RISC-V (v2.0.5/v2.0.6) | Closed (May 2022) | Fixed | Direct: cross-compilation to riscv64 was broken in those versions; current CMakeLists.txt no longer runs the built `flatc` as a POST_BUILD step, so the failure mode does not reproduce |
| [#7090](https://github.com/google/flatbuffers/issues/7090) | CMake: do not run generate_code.py if flatc is cross-compiled | Closed (Feb 2022) | Fixed | Indirect: same root cause as #7297, originally reported for arm64 |
| [#9050](https://github.com/google/flatbuffers/issues/9050) | Bus error on armhf | Open (Apr 2026) | High | Indirect: SIGBUS from unaligned access on 32-bit ARM; the identical hazard class exists for riscv64 if kernel alignment-trap emulation is absent [NEEDS VERIFICATION: not independently re-confirmed this research round] |
| [#9099](https://github.com/google/flatbuffers/issues/9099) | Dart struct builders do not prepare full inline struct alignment/size | Open (May 2026) | Medium | Indirect: affects any strict-alignment architecture including riscv64, though reported in the Dart binding, not C++ or Rust [NEEDS VERIFICATION: not independently re-confirmed this research round] |
| [#9119](https://github.com/google/flatbuffers/issues/9119) | Dart: Fix struct builder alignment | Open PR (Jun 2026) | Medium | Fix for #9099; adds `prepStruct(alignment, size)`; unmerged as of last check [NEEDS VERIFICATION] |

**Correctness risk (not a filed bug):** `ReadScalar` in `include/flatbuffers/base.h` suppresses UBSan via `FLATBUFFERS_SUPPRESS_UBSAN("alignment")` rather than using a safe `memcpy`-based read. On RISC-V hardware without kernel-level unaligned-access emulation, this could fault. No filed issue exists for this on Linux riscv64 specifically, and the standard Linux riscv64 kernel emulates unaligned access transparently for most standard cores (or it is a non-issue on cores implementing `RISCV_ISA_EXTENSION_UNALIGNED_SCALAR_FAST`); on embedded RISC-V without alignment emulation this would be a genuine correctness bug. [NEEDS VERIFICATION]

Repeated fresh searches this session (`search_issues` for `riscv64 performance`, `riscv`, `riscv64 bug`, `riscv nan floating`, all scoped to `repo:google/flatbuffers`) return zero riscv64-related results; the closest "bug" matches returned are all unrelated, closed issues about other non-x86 architectures (s390x big-endian build failure #7366, mips big-endian Rust build failure #5091, powerpc strict-aliasing errors #303). No open riscv64-specific correctness or performance issue exists in `google/flatbuffers`.

No published, quantitative FlatBuffers-on-riscv64 performance benchmark exists anywhere searched (official FlatBuffers benchmarks page, GitHub, general web search, or the RISE project blog). The official [benchmarks page](https://flatbuffers.dev/benchmarks/) publishes only x86_64/Windows figures comparing FlatBuffers to Protobuf LITE, RapidJSON, pugixml, and raw structs, with no architecture breakdown. Since the library has no SIMD or hand-tuned paths for any architecture (Section 4), this is expected: performance is scalar and architecturally uniform by design, not a riscv64-specific data gap.

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support exist in any issue, PR, or project document. The project has no policy that limits CI or binaries to specific architectures.

**Technical blockers:** None. The library requires no riscv64-specific code changes and builds with standard C++11 toolchains; this is empirically demonstrated by three independent distributions (Debian, Arch Linux RISC-V, Ubuntu) successfully building it from unmodified upstream source for riscv64.

**Organizational blockers:** None identified. Google is a Premier RISE member; the primary maintainer (Derek Bailey, Google) has not stated any public position on riscv64 CI, and no open RISC-V CI PR exists to gauge maintainer response.

**Acceptance probability for a riscv64 CI PR:** High. [NEEDS VERIFICATION] The project accepts CI matrix additions routinely and has no policy barrier; adding a QEMU-based riscv64 job is a straightforward GitHub Actions change with no code-level dependencies, but no such PR has been filed to test this assumption in practice.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** FlatBuffers has zero riscv64 CI in `google/flatbuffers` (all 6 GitHub Actions workflows run only on x86/macOS/Windows runners, no riscv64 runner or QEMU step anywhere in [.github/workflows](https://github.com/google/flatbuffers/tree/master/.github/workflows)) and ships no riscv64 release binary (GitHub release assets are x86/macOS/Windows only), so it fails the CI-based test for the top color tiers. It qualifies for the distribution floor instead: Ubuntu 26.04 "resolute" ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=flatbuffers&suite=resolute&searchon=names&section=all)) and Debian sid both build `flatbuffers-compiler`/`libflatbuffers-dev` for riscv64 from unmodified upstream source, with no riscv64-specific patches found, consistent with the project having zero architecture-specific code anywhere in the codebase for any CPU (Section 4). This is a clean distro build with no upstream CI, which caps the color at yellow. FlatBuffers is not an optimization-purpose project, since its value is the zero-copy wire format and algorithm rather than hardware-accelerated throughput, so no optimization-level modifier applies.
- **Pending work that could change the grade:** No open RISC-V CI PR exists and no RISE funding or tracking exists for FlatBuffers. The only riscv64-adjacent issue (#7297, a generic cross-compile "Exec format error") is closed. Adding QEMU riscv64 CI to `build.yml` (high priority) and fixing the unaligned-read cast in `ReadScalar` (medium priority) are the concrete next steps identified that could move this project to blue or green if acted on.

## 14. Investment Analysis

RISE has no funded work on FlatBuffers (Section 1). The library requires no code changes for riscv64 correctness. The gap is entirely in CI coverage and upstream binary distribution, not functionality.

### 14.1 Functional Enablement

The library is fully functional on riscv64 today via standard C++ compilation; no functional enablement work is required for correctness on mainstream Linux riscv64. The one latent risk, the UBSan-suppressed unaligned cast in `ReadScalar` (Section 11), warrants a defensive fix: replace the reinterpret cast with a `memcpy`-based scalar read, which compilers optimize to a single load on little-endian architectures with fast unaligned access. This is a correctness hardening item, not a blocker.

### 14.2 Performance Optimization

FlatBuffers implements no SIMD for any architecture. Adding RVV-accelerated paths (e.g. bulk serialization loops) would be novel work relative to all existing platforms, not a gap-fill relative to amd64/arm64. Given the zero-copy design (no decode loop to vectorize), the performance upside is narrow and unproven. Low priority.

### 14.3 CI/CD Infrastructure

The primary actionable gap is adding riscv64 CI to the upstream repository: a QEMU user-mode emulation step in `build.yml`, or access to a RISE-provided native riscv64 runner. Distro buildds (Debian, Ubuntu) already validate the library on riscv64 but are not surfaced in upstream CI, so regressions on riscv64 would not be caught before an upstream release.

### 14.4 Ecosystem Enablement

The Python binding is pure Python and already works on riscv64 with no wheel-builder work needed. The Rust crate builds via standard Rust cross-compilation (`riscv64gc-unknown-linux-gnu`, Tier 2), and both its dependencies (`bitflags`, `serde`) are already available for riscv64 via crates.io and Debian/Ubuntu packages. Upstream pre-built `flatc` riscv64 binaries in GitHub releases would reduce friction for schema-first development workflows on riscv64 hardware but are not currently planned or tracked anywhere found.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU riscv64 job to `build.yml`; run `flattests` under `qemu-riscv64` | 1 | Google/RISE | High |
| Functional | Replace UBSan-suppressed `ReadScalar` cast with `memcpy`-based read in `base.h`; add riscv64 alignment test | 1 | Google/community | Medium |
| CI/CD | Add Dart binding riscv64 test coverage (pending fix for #9099/#9119) | 1 | Google/Dart team | Medium |
| Functional | Upstream pre-built `flatc` riscv64 binary in GitHub releases (cross-build step in `release.yml`) | 1 | Google | Low |
| Performance | RVV-accelerated bulk serialization (speculative; requires profiling to justify) | 4-8 | Qualcomm/RISE | Low |

## 15. References

- [google/flatbuffers repository](https://github.com/google/flatbuffers)
- [FlatBuffers homepage](https://flatbuffers.dev/)
- [FlatBuffers benchmarks (x86_64 only)](https://flatbuffers.dev/benchmarks/)
- [Issue #7297: Exec format error when cross compiling for RISC-V](https://github.com/google/flatbuffers/issues/7297)
- [Issue #7090: CMake: do not run generate_code.py if flatc is cross-compiled](https://github.com/google/flatbuffers/issues/7090)
- [Issue #9050: Bus error on armhf](https://github.com/google/flatbuffers/issues/9050)
- [Issue #9099: Dart struct builders do not prepare full inline struct alignment/size](https://github.com/google/flatbuffers/issues/9099)
- [PR #9119: Dart: Fix struct builder alignment](https://github.com/google/flatbuffers/issues/9119)
- [google/flatbuffers .github/workflows](https://github.com/google/flatbuffers/tree/master/.github/workflows)
- [google/flatbuffers include/flatbuffers/base.h](https://github.com/google/flatbuffers/blob/master/include/flatbuffers/base.h)
- [google/flatbuffers include/flatbuffers/flexbuffers.h](https://github.com/google/flatbuffers/blob/master/include/flatbuffers/flexbuffers.h)
- [google/flatbuffers CMakeLists.txt](https://github.com/google/flatbuffers/blob/master/CMakeLists.txt)
- [Debian buildd status: flatbuffers (sid)](https://buildd.debian.org/status/package.php?p=flatbuffers&suite=sid)
- [Arch Linux RISC-V extra repo](https://archriscv.felixc.at/repo/extra/)
- [Ubuntu packages: flatbuffers, resolute suite](https://packages.ubuntu.com/search?keywords=flatbuffers&suite=resolute&searchon=names&section=all)
- [PyPI: flatbuffers](https://pypi.org/project/flatbuffers/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE sw-ecosystem project report: FlatBuffers](https://riseproject-dev.github.io/sw-ecosystem/project-reports/flatbuffers.html)
- [grpc/grpc issue #41591: riscv64 grpcio PyPI wheels missing (closed)](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc issue #37791: SIGILL (closed)](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc issue #35839: undefined atomic symbol (closed)](https://github.com/grpc/grpc/issues/35839)
- [abseil/abseil-cpp issue #1702: riscv64 linker undefined atomic symbol](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp PR #1986: RISC-V CRC32C hardware acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [protocolbuffers/protobuf issue #12266: riscv64 support (closed)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protocolbuffers/protobuf issue #14549: Build fails on RISCV (closed)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [protocolbuffers/protobuf issue #17798: Maven riscv64 protoc prebuilt (closed)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [bitflags/bitflags repository](https://github.com/bitflags/bitflags)
- [serde-rs/serde repository](https://github.com/serde-rs/serde)