---
title: Ray
---

# Ray

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Ray<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Ray is a Python/C++ distributed-computing framework (task scheduling, actors, and higher-level libraries for data, training, tuning, and serving) originally created at UC Berkeley's RISELab (2016-2017) and commercialized by [Anyscale](https://www.anyscale.com/about), founded in 2019 by the RISELab team. Note the naming collision this creates: UC Berkeley's "RISELab" (the lab that created Ray) is an entirely different organization from the Linux Foundation's "RISE Project" (riseproject.dev, the RISC-V software ecosystem initiative discussed throughout this report) - the two share a similar name but no relationship.

Anyscale is venture-backed (investors listed on their about page include a16z, NEA, Addition, and Intel Capital), not foundation-governed. anyscale.com/about references a pending corporate development, "Anyscale to Join Nscale," described as combining to offer "a full-stack AI cloud platform" - this could not be corroborated via a second source in this session and should be treated as **unverified**. Individual founder names commonly reported elsewhere (e.g., Robert Nishihara, Philippe Moritz, Ion Stoica) could not be independently verified from a primary source this session and are flagged **[NEEDS VERIFICATION]**.

License: Apache License 2.0, confirmed directly from the `LICENSE` file in [ray-project/ray](https://github.com/ray-project/ray).

Governance: no independent foundation was found. There is no `GOVERNANCE.md`, `MAINTAINERS`, `OWNERS`, `PLATFORMS.md`, or `SUPPORT.md` file in the repository (all 404). The de facto governance instrument is [`.github/CODEOWNERS`](https://github.com/ray-project/ray/blob/master/.github/CODEOWNERS), which assigns code areas to GitHub teams (`@ray-project/ray-core`, `ray-ci`, `ray-data`, `ray-rllib`, `ray-tune`, `ray-train`, `ray-serve`, `ray-llm`, `ray-docs`) plus named individuals for narrower slices. Top contributors by commit count (edoakes, ericl, sven1977, aslonnie, robertnishihara, krfricke, bveeramani, can-anyscale, richardliaw, rkooo567, pcmoritz, jjyao, amogkam, simon-mo, stephanie-wang) are essentially all Anyscale-affiliated, confirming this is a corporate-controlled open-source project rather than a foundation-governed one. This inference is based on the absence of evidence of a foundation; no authoritative "Ray has no foundation" statement was located, so treat the framing itself as **[NEEDS VERIFICATION]** even though the supporting facts (no GOVERNANCE.md, Anyscale-dominated CODEOWNERS) are directly confirmed.

Community culture on new architecture ports: no evidence of any stated stance, positive or negative, toward RISC-V. There are no open issues, PRs, or discussion threads on the topic beyond one closed, non-technical bot report (see Section 2). This should be characterized as "no engagement yet," not "hostile" or "welcoming."

## 2. Port History and Upstreaming Timeline

There is no dedicated RISC-V port effort for Ray. Every riscv-related item found across the entire `ray-project` GitHub org (repo, issues, PRs, commits, code search) is incidental.

| Date | Event | Source |
|---|---|---|
| 2022-02-28 | [ray-project/mobius#29](https://github.com/ray-project/mobius/issues/29) opened: "Bazel can not support riscv64/mips64 instruction jni build with lastest bazel" (Ant Group's separate streaming project, not ray-project/ray itself) | [ray-project/mobius#29](https://github.com/ray-project/mobius/issues/29) |
| 2022-04-01 | [PR #23653](https://github.com/ray-project/ray/pull/23653) opened in ray-project/ray: bumps the Bazel `platforms` ruleset dependency to a version that declares `@platforms//cpu:riscv64`, fixing a JNI `select()` resolution failure | [ray-project/ray#23653](https://github.com/ray-project/ray/pull/23653) |
| 2022-04-03 | PR #23653 merged | [ray-project/ray#23653](https://github.com/ray-project/ray/pull/23653) |
| 2022-06-09 | Fix first shipped in release `ray-1.13.0` (confirmed absent from ray-1.12.0/1.12.1 via `git merge-base --is-ancestor`) | GitHub releases API |
| 2025-06-27 | [Issue #54162](https://github.com/ray-project/ray/issues/54162) opened: automated "RAX" tool architecture-porting-difficulty assessment, mentioning RISC-V only as a generic methodology example | [ray-project/ray#54162](https://github.com/ray-project/ray/issues/54162) |
| 2025-06-30 | Issue #54162 closed after maintainer richardliaw replied "Seems reasonable" | [ray-project/ray#54162](https://github.com/ray-project/ray/issues/54162) |

Key contributors: ashione (Lingxuan Zuo, MEMBER, Ant Group/mobius) authored both mobius#29 and PR #23653; mwtian (MEMBER) reviewed and approved PR #23653, noting "The problem should be specific to building on / for risc64." The true root cause traces to an upstream Bazel bug, [bazelbuild/bazel#14097](https://github.com/bazelbuild/bazel/issues/14097) (the `platforms` external repo not declaring a `riscv64` CPU constant); Ray's PR was a downstream dependency-version bump, not original RISC-V enablement work.

**Is it fully upstream?** No. There is no dedicated riscv64 port, upstream or otherwise. The only merged change (#23653) is a generic Bazel platform-dependency bump that incidentally unblocked a mips64/riscv64 JNI conditional for the unrelated `mobius` project; it is not evidence of any Ray-specific riscv64 enablement.

## 3. Upstream Support Tier

Ray states its officially supported platforms directly in [`doc/source/ray-overview/installation.rst`](https://github.com/ray-project/ray/blob/master/doc/source/ray-overview/installation.rst): "Ray currently officially supports x86_64, aarch64 (ARM) for Linux, and Apple silicon (M1) hardware," plus Windows in beta (amd64 only). RISC-V is not mentioned. This is reinforced programmatically in [`ci/ray_ci/configs.py`](https://github.com/ray-project/ray/blob/master/ci/ray_ci/configs.py), which hardcodes `ARCHITECTURE = ["x86_64", "aarch64"]`, and in [`ci/build/build_common.py`](https://github.com/ray-project/ray/blob/master/ci/build/build_common.py), whose `detect_host_arch()` (line 67) enumerates an explicit allowlist `{("darwin","aarch64"), ("linux","x86_64"), ("linux","aarch64")}` and raises `BuildError("Unsupported platform: ...")` for anything else, including riscv64.

There is no formal architecture-tier policy document (no Rust-style Tier 1/2/3 equivalent). Support is a simple binary allowlist, not a graduated tier system.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as officially supported (installation.rst) | Yes | Yes | No |
| CI build/test (Buildkite) | Yes (`_wheel-build.rayci.yml`) | Yes (`linux_aarch64.rayci.yml`) | None |
| Official PyPI wheel | Yes | Yes | No |
| Hard-coded in build-platform allowlist (`build_common.py`) | Yes | Yes | Explicitly excluded |
| Bazel `config_setting` target (`bazel/BUILD.bazel`) | Yes | Yes | None (falls to `//conditions:default`, a wrong-architecture x86_64 binary) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Ray's own codebase contains no CPU-architecture-specific subsystems. GitHub code search (`gh api search/code`) against `ray-project/ray` for `riscv`, `rvv`, `vfloat32m1_t`, `riscv64`, `arch/riscv`, `__riscv`, and `riscv_vector` all returned `total_count: 0`. As a control to validate the search mechanism itself, the same methodology returned real, nonzero hits for other architectures: `x86_64` -> 170 results, `aarch64` -> 76 results. A `SIMD` query returned only 3 hits, all unrelated (protobuf/serialization files and a requirements.txt) - Ray implements no CPU-specific SIMD dispatch, JIT, hand-written assembly, or GC-barrier code of its own.

Consequently there is no per-subsystem riscv64 implementation to grade within ray-project/ray itself: no JIT, no SIMD intrinsics, no crypto primitives, no inline assembly. Any architecture-specific behavior Ray exhibits is inherited transitively through its C++ build dependencies (protobuf, gRPC, BoringSSL, abseil-cpp, jemalloc, RocksDB) and Python dependencies (NumPy, pyarrow, LZ4, OpenSSL, xz/liblzma, FlatBuffers). These are analyzed in Section 9; there is no additional Ray-specific layer to assess here.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compiler | N/A - none exists in Ray | N/A | N/A |
| SIMD/vector code | N/A - none exists in Ray | N/A | N/A |
| Crypto/hashing | N/A - inherited from BoringSSL/OpenSSL (Section 9) | N/A | N/A |
| Hand-written assembly | N/A - none exists in Ray | N/A | N/A |

## 5. Build System, Cross-Compilation, and Toolchain

Ray builds with Bazel, not CMake (there is no top-level `CMakeLists.txt`). [`.bazelversion`](https://github.com/ray-project/ray/blob/master/.bazelversion) pins **Bazel 7.5.0**, and `WORKSPACE` enforces this exactly via `versions.check(minimum_bazel_version="7.5.0", maximum_bazel_version="7.5.0")`. The C++ standard is C++17, set in `.bazelrc` via `build:linux --cxxopt="-std=c++17"` / `--host_cxxopt="-std=c++17"`. No minimum compiler version is documented as policy; it is implicitly whatever ships in the build container.

**Wheel build containers:** wheels are built inside `quay.io/pypa/manylinux2014_${HOSTTYPE}:2026.01.02-1` per [`ci/docker/manylinux.Dockerfile`](https://github.com/ray-project/ray/blob/master/ci/docker/manylinux.Dockerfile), where `HOSTTYPE` is only ever `x86_64` or `aarch64` throughout the codebase (`ci/build/build-manylinux-forge.sh`, `.buildkite/linux_aarch64.rayci.yml`, `docker/base-slim/Dockerfile`). Critically, **no `manylinux2014_riscv64` image exists upstream from PyPA** at all, so this path is a dead end before any Ray-specific code is even reached.

**No cross-compilation toolchain files exist** in `bazel/` (its full contents: `BUILD.bazel`, `ci_require.bzl`, `cython.BUILD`, `hiredis.BUILD`, `jemalloc.BUILD`, `msgpack.BUILD`, `nlohmann_json.BUILD`, `python.bzl`, `ray.bzl`, `ray_deps_build_all.bzl`, `ray_deps_setup.bzl`, `redis.BUILD`, `rocksdb.BUILD`, `spdlog.BUILD`, `workspace_status.sh`). Nothing named `riscv64.cmake` or `toolchain-riscv64` exists (confirmed 404). `rocksdb.BUILD` invokes CMake only as a `rules_foreign_cc` sub-build, with no architecture-specific logic beyond an aarch64-manylinux comment about `-G "Unix Makefiles"` vs Ninja.

**No `-DUSE_X=OFF`-style feature flags** for disabling architecture-specific code exist anywhere in the build. **No QEMU usage** appears anywhere in the repo (no hits in CI configs, Dockerfiles, or docs).

**Platform allowlist (hard block):** [`ci/build/build_common.py`](https://github.com/ray-project/ray/blob/master/ci/build/build_common.py) line 67 hardcodes `supported = {("darwin", "aarch64"), ("linux", "x86_64"), ("linux", "aarch64")}` - riscv64 is programmatically excluded, not merely untested. [`bazel/BUILD.bazel`](https://github.com/ray-project/ray/blob/master/bazel/BUILD.bazel) defines exactly five `config_setting` targets (`linux_x86_64_config`, `linux_arm64_config`, `osx_x86_64_config`, `osx_arm64_config`, `windows_x86_64_config`); a riscv64 build would silently fall through to `//conditions:default`, which resolves to the **x86_64** prebuilt binary/alias for things like the vendored redis-server and `uv` - a wrong-architecture artifact that would fail to execute, not a working fallback. `build-wheel.sh`'s `case` statement maps only `Darwin-arm64`, `Linux-x86_64`, `Linux-aarch64` to wheel platform tags, with no riscv64 or default case.

**Known build failures:** none are documented, because a riscv64 build is never attempted - it is blocked by the hard-coded allowlist before compilation starts. There is nothing to report as a "build failure" in the conventional sense; the failure mode is an explicit `BuildError("Unsupported platform: ...")` raised deliberately by the tooling.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**
- `pip install ray` cannot succeed on riscv64: no PyPI wheel exists (Section 8).
- A source build is blocked by design: `build_common.py`'s allowlist raises `BuildError` for riscv64 before any compilation is attempted.
- Even if the allowlist and Bazel platform config were patched, the build would still be blocked downstream by dependencies with no riscv64 CI/release support: protobuf (maintainer has explicitly declined riscv64, "not on our roadmap" - Section 9), and gRPC (no PyPI wheel for riscv64, tracked in [grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591), closed without native support).
- `pyarrow`, a required (not optional) dependency for Ray Data, has no riscv64 wheel in its release pipeline ([apache/arrow#49555](https://github.com/apache/arrow/issues/49555) / unmerged [PR #49556](https://github.com/apache/arrow/pull/49556)), which would block `pip install ray[data]` even in an otherwise-successful environment.

**Performance gaps:** Data not available: no benchmark data comparing Ray on riscv64 vs. amd64/arm64 was found via GitHub search or WebSearch; no such comparison can exist today since no riscv64 build or wheel of Ray has ever been produced.

**Security hardening gaps:** BoringSSL (gRPC's TLS backend) has zero riscv64 hand-written assembly optimizations versus 23 for x86_64 and 15 for aarch64; its FIPS module is reported to reject riscv64 [NEEDS VERIFICATION - single-source claim from the BoringSSL dependency report]. No riscv64-specific security data exists for Ray itself, since Ray has no independent crypto/security code path.

**NaN / floating-point semantics:** Data not available: no NaN or floating-point-semantics issues specific to Ray on riscv64 were found in any search (GitHub issues, PRs, or WebSearch).

## 7. CI/CD Infrastructure

**No riscv64 CI exists for Ray, confirmed by directly reading the actual CI configuration files, not just search summaries.**

All four GitHub Actions workflows in [`.github/workflows/`](https://github.com/ray-project/ray/tree/master/.github/workflows) were read in full:
- `dependabot_recompile_deps.yml` - lockfile recompilation on `dependabot/pip/**` pushes, runs on `ubuntu-latest`.
- `on_auto_merge.yaml` - adds a label on `pull_request_target` auto_merge_enabled.
- `on_pull_request_synchronized.yml` - disables automerge via GraphQL on synchronize.
- `stale_pull_request.yaml` - cron-triggered stale-PR closer.

None of these four workflows perform any build or test work at all (they are bot/housekeeping automation); none mention riscv.

All 33 entries in [`.buildkite/`](https://github.com/ray-project/ray/tree/master/.buildkite) (the actual build/test pipeline definitions, `*.rayci.yml` plus `_forge`/`hooks`) were programmatically grepped case-insensitively for "risc" - zero hits across every file, including [`linux_aarch64.rayci.yml`](https://github.com/ray-project/ray/blob/master/.buildkite/linux_aarch64.rayci.yml), the ARM64 pipeline that would be the closest analog to a riscv64 job. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository (all 404).

Live GitHub code search corroborates this: `search/code?q=riscv+repo:ray-project/ray` and `q=riscv64+repo:ray-project/ray` both return `total_count: 0`.

Ray does not use RISE Project CI infrastructure (RISE RISC-V Runners, announced 2026-03-24 per the RISE blog) in any capacity - there is no evidence Ray has ever run any job, native or QEMU-emulated, on riscv64 hardware.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildkite pipeline file | `_wheel-build.rayci.yml` (and others) | `linux_aarch64.rayci.yml` | None |
| Hardware | x86_64 builder | `builder-arm64` instance type | None |
| Test execution | Yes | Yes | None |
| RISE Runners used | No (not needed) | No (not needed) | Not used |
| QEMU emulation | No | No | None (no QEMU usage anywhere in repo) |

## 8. Distribution and Release Status

**PyPI** (primary distribution channel): fetched the full JSON history for the `ray` project (versions 0.1.1 through the current 2.57.0). Platform tags present across the entire history are only `macosx_*`, `manylinux*_x86_64`, `manylinux*_aarch64`, and `win_amd64` variants. Zero filenames contain "riscv" or "riscv64" at any point in the project's history. The latest release (2.57.0) ships 18 wheel files across cp310-cp314, covering exactly four platform tags: `macosx_12_0_arm64`, `manylinux2014_aarch64`, `manylinux2014_x86_64`, `win_amd64`.

**GitHub releases**: the five most recent releases (2.57.0, 2.56.1, 2.56.0, 2.55.1, 2.55.0) all have empty `assets` arrays. Ray ships zero binary attachments via GitHub releases for any architecture - this distribution channel is unused, so it is moot rather than a riscv64-specific gap.

**Ubuntu 24.04 (noble)**: does not package ray-project/ray under the name `ray` at all. The 4 matches for "Ray" (`ray`, `ray-doc`, `ray-extra`, `raysession`) are all an unrelated genome-assembly bioinformatics tool and an audio session manager.

**Debian**: the source package named `ray` in Debian is also the unrelated bioinformatics genome-assembly tool (Debian Med Team), not ray-project/ray. That unrelated package does show riscv64 = "Installed" (version 2.3.1-9, built on `rv-osuosl-01`), matching amd64/arm64, but this is **not evidence of riscv64 support for the Ray distributed-computing framework** - it is a naming collision.

**Arch Linux RISC-V** (archriscv.felixc.at): inconclusive. The fetched page rendered as a static overview with no package-search results table; a follow-up at `/status.html` returned HTTP 404. Presence or absence of a `python-ray` package on Arch RISC-V could not be confirmed through the URLs checked - **unverified**.

**RISE Project Python wheel builder** (both `pypi.riseproject.dev` and the GitLab wheel_builder listing 74 supported riscv64 packages): `ray` is not present in either list.

**What a user must do today** to get a working Ray build on riscv64: there is no supported path. A user would need to (1) patch `ci/build/build_common.py` to add the `("linux","riscv64")` tuple, (2) add a `linux_riscv64_config` target to `bazel/BUILD.bazel`, (3) add a riscv64 case to `build-wheel.sh`, and (4) verify or fix the build of every C++ dependency in the chain (protobuf, gRPC, BoringSSL, abseil-cpp, jemalloc, RocksDB) on riscv64 - none of which have upstream riscv64 CI or release binaries (Section 9) - with no `manylinux2014_riscv64` container available from PyPA to build inside. This is an unsupported, untested, and currently unattempted path end-to-end.

## 9. Dependencies

| Dependency | Role in Ray | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Abseil-cpp | Google C++ base library (transitively via gRPC/protobuf) | Buildable, no CI | No | No official binaries | No riscv64 CI job; see [reports/abseil-cpp.md](abseil-cpp.md) |
| BoringSSL | TLS/crypto backend for gRPC (pinned commit `2ff4b968a`) | Compile-only CI (Android NDK cross builders) | No | No official binaries | 0 riscv64 asm files vs 23 (x86_64) / 15 (aarch64); FIPS rejection of riscv64 [NEEDS VERIFICATION]; see [reports/boringssl.md](boringssl.md) |
| Protocol Buffers | Core RPC/serialization for all Ray gRPC services (pinned `2c5fa078d`, and v3.20.3 for codegen) | No CI | No | No release artifact, no PyPI/Maven wheel | Maintainer stated riscv64 is "not on our roadmap"; 14 open/closed riscv64 items, none merged. Hard blocker for gRPC. See [reports/protobuf.md](protobuf.md) |
| gRPC | RPC transport for Ray Core/GCS (pinned v1.58.0) | No | No | No PyPI wheel ([grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591) closed without support) | Distros build out-of-tree; upstream takes no responsibility. Direct blocker for the `grpcio>=1.42.0` requirement. See [reports/grpc.md](grpc.md) |
| jemalloc | Optional embedded allocator (pinned 5.3.0) | Compiles via community patches, no CI | No | Source-only | [jemalloc/jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) unanswered. See [reports/jemalloc.md](jemalloc.md) |
| RocksDB | GCS fault-tolerance storage backend (pinned v10.6.2) | Buildable ([facebook/rocksdb#12139](https://github.com/facebook/rocksdb/issues/12139) closed) | No confirmed CI | No official binary | Required `-latomic` linking fixes ([#7060](https://github.com/facebook/rocksdb/issues/7060)/[#8183](https://github.com/facebook/rocksdb/issues/8183)). No dedicated status report exists yet in this project (pending, not in scope.yml with a completed report). |
| NumPy | Ray Data/Train/RLlib array plumbing (`numpy>=1.20`) | Yes, Tier 3 per NEP 57 | RISE-hosted CI, but riscv64 QEMU job `continue-on-error: true` | No PyPI wheel yet ([numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216)) | RISE-affiliated maintainers named. See [reports/numpy.md](numpy.md) |
| pyarrow (Apache Arrow) | Ray Data columnar interchange (`pyarrow>=17.0.0`) | Builds (older failures closed) | Open Gandiva/LLVM JIT issue [apache/arrow#50799](https://github.com/apache/arrow/issues/50799) | No riscv64 wheel ([#49555](https://github.com/apache/arrow/issues/49555)/[PR #49556](https://github.com/apache/arrow/pull/49556) unmerged) | Live blocker for `pip install ray[data]`. Not in scope.yml. |
| LZ4 | Serialization compression codec | Yes, QEMU CI since PR #1299 | Tier 3 QEMU | No official binary; PyPI status [NEEDS VERIFICATION] | Functional since v1.10.0; refined in PR #1648 (`__riscv_zicclsm`). See [reports/lz4.md](lz4.md) |
| OpenSSL | rules_foreign_cc build (pinned v1.1.1f, separate from BoringSSL) | Yes, dedicated `riscv-more-cross-compiles.yml` CI | Backported to all active branches | No official binaries (source-only) | Best-supported dependency; but Ray pins the EOL 1.1.1f branch, predating most riscv64 hardening. See [reports/openssl.md](openssl.md) |
| xz (liblzma) | Transitive Boost build dependency | Yes, riscv64 BCJ filter at parity with x86/arm64 | No upstream CI runner | Source-only | No hardware-accelerated CRC path for riscv64. See [reports/xz.md](xz.md) |
| FlatBuffers | Build-time schema compiler (pinned v25.2.10) | No CI, no binary | No | No release binary | Downstream distro packaging only. See [reports/flatbuffers.md](flatbuffers.md) |
| OpenTelemetry C++ | Tracing/metrics export (pinned v1.19.0) | Not verified | Not verified | Not verified | 0 riscv64 GitHub issues found; ambiguous signal [NEEDS VERIFICATION] |
| Redis / hiredis | Previous GCS storage backend (being migrated to RocksDB per REP-64) | Community riscv64 support, no upstream CI | No | No official binary | Two unreviewed riscv64 PRs (#15204, #15273) since May 2026. See [reports/redis.md](redis.md) |

**Deep-dive on the critical path:** Ray's build-time C++ RPC/serialization stack forms a chain of hard dependencies: gRPC depends on both protobuf and BoringSSL. Protobuf's maintainer has explicitly and repeatedly declined riscv64 support ("not on our roadmap," stated across multiple closed issues/PRs). Since Ray's GCS and Core communication run entirely over gRPC, this is the single most significant structural blocker to a native riscv64 build - it cannot be worked around by Ray-side changes alone; it requires either an upstream reversal at protobuf, or Ray switching its RPC transport, or a maintained out-of-tree riscv64 patch set for the entire protobuf/gRPC/BoringSSL chain. On the Python side, `pyarrow` (required for Ray Data) lacks a riscv64 wheel in its release pipeline, which independently blocks `pip install ray[data]` even if the native build succeeded. NumPy and OpenSSL are the most mature dependencies in this table (Tier 3 CI and first-class CI respectively) but neither yet ships a riscv64 PyPI wheel or has full parity with amd64/arm64.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [ray-project/ray#54162](https://github.com/ray-project/ray/issues/54162) | Assessment of the difficulty in porting CPU architecture for Ray | Closed (2025-06-30) | N/A (not a bug) | Automated bot ("RAX" tool) architecture-complexity survey; scored "Middle" (5,911 arch-related LOC, cyclomatic complexity 117,032); maintainer response was a one-word "Seems reasonable," no roadmap, no assignee, no follow-up |
| [ray-project/ray#23653](https://github.com/ray-project/ray/pull/23653) | [Bazel] ray deps import lastest bazel platform | Merged (2022-04-03) | N/A | Incidental riscv64/mips64 mention in an error log motivating a generic Bazel `platforms` dependency bump; not Ray-specific riscv64 work |
| [ray-project/mobius#29](https://github.com/ray-project/mobius/issues/29) | Bazel can not support riscv64/mips64 instruction jni build with lastest bazel | Closed (2022-04-19) | N/A | Cross-repo prerequisite issue in Ant Group's separate `mobius` project, not ray-project/ray |

No open correctness bugs, no open performance bugs, and no active riscv64 tracking issues exist for Ray. This was confirmed with a control-query methodology: searching for `arm64`/`aarch64` bugs on the same repo returns real results immediately (e.g., issue #19865, "[Bug] build ray project on arch64"), confirming the zero-result outcome for riscv64 queries reflects a genuine absence of data rather than a search-tooling failure.

## 12. Objections and Upstream Blockers

**Stated objections:** none found from Ray maintainers directly. The only maintainer engagement on the topic (richardliaw's "Seems reasonable" on the bot-generated #54162) is not an objection, but also not an endorsement or commitment - it is a perfunctory acknowledgment of an automated complexity score, with no roadmap follow-up.

**Technical blockers:**
- `ci/build/build_common.py`'s hard-coded platform allowlist explicitly raises `BuildError` for any tuple other than `("darwin","aarch64")`, `("linux","x86_64")`, `("linux","aarch64")`.
- No `linux_riscv64_config` Bazel platform target exists; a naive build would silently resolve to wrong-architecture (x86_64) default binaries for vendored tools.
- protobuf's maintainer has explicitly declined riscv64 support upstream - a hard blocker for gRPC, and thus for all of Ray's internal RPC transport.
- No `manylinux2014_riscv64` build container exists upstream from PyPA, so even the wheel-build infrastructure has no target environment to build inside.
- `pyarrow`, a required dependency for Ray Data, has no riscv64 wheel in its release pipeline.

**Organizational blockers:**
- Anyscale-dominated CODEOWNERS with no independent foundation governance structure to advocate for a new-architecture port.
- Ray is not a member of the RISE Project (confirmed absent from riseproject.dev member lists, working-group trackers, and the RISE Python wheel builder's package list).
- No evidence Anyscale has expressed public interest in RISC-V.

**Acceptance probability:** cannot be quantified from available data (no precedent exists), but the technical picture is more tractable than the organizational silence suggests: Ray's own codebase has zero architecture-specific code (Section 4), so a hypothetical Ray-side patch (allowlist + Bazel platform target) is small. The real gating factor is entirely in the dependency chain (protobuf/gRPC/BoringSSL), which is outside Ray maintainers' control. Given zero stated interest either way, and a hard external blocker at the protobuf layer, near-term upstream acceptance of a full riscv64 port is unlikely without first resolving protobuf/gRPC riscv64 support independently of Ray.

## 13. Investment Analysis

Before sizing new work, note what RISE has already funded relevant to Ray's dependency chain: NumPy is Tier 3 under NEP 57 with RISE-affiliated maintainers and RISE-hosted CI runners (though its riscv64 QEMU job is non-blocking and no PyPI wheel exists yet); OpenSSL has dedicated riscv64 CI; LZ4 and xz have functional riscv64 support; RocksDB's riscv64 build issues have been fixed upstream. None of this covers the critical blocker: **protobuf, gRPC, BoringSSL, and abseil-cpp have no RISE-funded or otherwise-funded riscv64 work**, and protobuf's maintainer has explicitly declined to prioritize it. RISE also has not touched Ray itself in any capacity (absent from RISE member lists, working-group issue trackers, and the RISE Python wheel builder's 74-package list).

### 13.1 Functional Enablement
- Patch `ci/build/build_common.py`, `bazel/BUILD.bazel`, and `build-wheel.sh` to recognize `linux/riscv64` (small, mechanical - Ray's own code has no arch-specific logic).
- Resolve or work around the protobuf/gRPC upstream refusal: either maintain an out-of-tree riscv64 patch set for protobuf+gRPC+BoringSSL, or pursue upstream re-engagement (protobuf maintainer has stated riscv64 is "not on our roadmap," so this is a negotiation/advocacy effort, not pure engineering).
- Land the pending pyarrow riscv64 wheel (unmerged [PR #49556](https://github.com/apache/arrow/pull/49556)) as a prerequisite for `ray[data]`.
- Produce a working `manylinux2014_riscv64`-equivalent build container (does not exist upstream from PyPA).

### 13.2 Performance Optimization
No benchmark data exists to size performance work against (Section 6). Since Ray's own code contains no SIMD/JIT, performance work would be entirely at the dependency level (NumPy, pyarrow) rather than in Ray core, and should follow functional enablement, not precede it.

### 13.3 CI/CD Infrastructure
Model a new `.buildkite/linux_riscv64.rayci.yml` on the existing `linux_aarch64.rayci.yml` pattern (forge image, manylinux build, wheel build/test, Docker publishing). RISE RISC-V Runners (native hardware, announced 2026-03-24 per the RISE blog) would be the preferred execution target over QEMU once functional enablement is complete.

### 13.4 Ecosystem Enablement
Not applicable as a standalone workstream for Ray itself (Section 10 omitted - no evidence of a significant Ray-specific plugin/package ecosystem distinct from the dependency chain already covered in Section 9). Note, however, that resolving the pyarrow/protobuf/gRPC riscv64 wheel gaps would benefit the broader Python data-science ecosystem beyond Ray alone.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch Ray's own build allowlist/Bazel platform config for riscv64 | Data not available: no estimate found in research; mechanical change, likely low effort given zero arch-specific code in Ray itself [NEEDS VERIFICATION] | Not assigned | Critical (prerequisite for everything else) |
| Functional | Resolve/patch protobuf + gRPC + BoringSSL riscv64 build/CI/release gap | Data not available: no estimate found; scope spans three separate upstream C++ projects with an explicit maintainer refusal at protobuf | Not assigned | Critical (hard blocker) |
| Functional | Land pyarrow riscv64 wheel (PR #49556) | Data not available: PR already exists upstream, unmerged; effort is advocacy/review-push rather than net-new engineering | Not assigned | High |
| Functional | Produce manylinux2014_riscv64-equivalent build container | Data not available: no PyPA upstream equivalent exists to adapt from | Not assigned | High |
| CI/CD | Add `.buildkite/linux_riscv64.rayci.yml` modeled on `linux_aarch64.rayci.yml` | Data not available: no estimate found | Not assigned | Medium (after functional enablement) |
| Performance | Benchmark Ray on riscv64 vs. arm64/amd64 | Data not available: no baseline exists to compare against | Not assigned | Low (blocked on functional enablement) |

All effort estimates in this table are marked "Data not available" because no engineering-hours or story-point sizing for a riscv64 Ray port exists anywhere in the research findings; providing invented numbers would violate the verification policy for this report.

## 14. Updates

No updates yet - initial report dated 2026-06-17.

## 15. References

- [ray-project/ray](https://github.com/ray-project/ray) - main repository
- [ray-project/ray issue #54162](https://github.com/ray-project/ray/issues/54162) - "Assessment of the difficulty in porting CPU architecture for Ray"
- [ray-project/ray PR #23653](https://github.com/ray-project/ray/pull/23653) - "[Bazel] ray deps import lastest bazel platform"
- [ray-project/mobius issue #29](https://github.com/ray-project/mobius/issues/29) - "Bazel can not support riscv64/mips64 instruction jni build with lastest bazel"
- [bazelbuild/bazel issue #14097](https://github.com/bazelbuild/bazel/issues/14097) - upstream Bazel `platforms` riscv64 declaration issue
- [ray-project/ray PR #62534](https://github.com/ray-project/ray/pull/62534) - Bump uv 0.8.9 to 0.11.6 (false-positive riscv64 match)
- [ray-project/ray PR #62564](https://github.com/ray-project/ray/pull/62564) - Bump uv dependency (false-positive riscv64 match)
- [ray-project/ray PR #62511](https://github.com/ray-project/ray/pull/62511) - Bump uv dependency (false-positive riscv64 match)
- [ray-project/ray PR #64226](https://github.com/ray-project/ray/pull/64226) - Bump msgpack dependency (false-positive riscv64 match)
- [ray-project/ray - installation.rst](https://github.com/ray-project/ray/blob/master/doc/source/ray-overview/installation.rst) - officially supported platforms
- [ray-project/ray - ci/ray_ci/configs.py](https://github.com/ray-project/ray/blob/master/ci/ray_ci/configs.py) - hardcoded ARCHITECTURE list
- [ray-project/ray - ci/build/build_common.py](https://github.com/ray-project/ray/blob/master/ci/build/build_common.py) - platform allowlist / detect_host_arch
- [ray-project/ray - bazel/BUILD.bazel](https://github.com/ray-project/ray/blob/master/bazel/BUILD.bazel) - config_setting targets
- [ray-project/ray - .buildkite/linux_aarch64.rayci.yml](https://github.com/ray-project/ray/blob/master/.buildkite/linux_aarch64.rayci.yml) - arm64 CI pipeline
- [ray-project/ray - .github/workflows/](https://github.com/ray-project/ray/tree/master/.github/workflows) - GitHub Actions workflows (housekeeping only)
- [ray-project/ray - .bazelversion](https://github.com/ray-project/ray/blob/master/.bazelversion) - Bazel version pin
- [ray-project/ray - LICENSE](https://github.com/ray-project/ray/blob/master/LICENSE) - Apache 2.0
- [ray-project/ray - .github/CODEOWNERS](https://github.com/ray-project/ray/blob/master/.github/CODEOWNERS) - governance/ownership
- [ray-project/kuberay DEVELOPMENT.md](https://github.com/ray-project/kuberay/blob/master/ray-operator/DEVELOPMENT.md) - only other org-wide riscv mention (unrelated Docker Buildx sample output)
- [PyPI - ray project](https://pypi.org/project/ray/) - wheel platform tags
- [Anyscale - About](https://www.anyscale.com/about) - corporate background, investors
- [RISE Project - home](https://riseproject.dev/) - RISE Project overview
- [RISE Project - blog](https://riseproject.dev/blog/) - blog post index (29 posts checked, none mention Ray)
- [RISE Project - members](https://riseproject.dev/members) - member list (Ray/Anyscale not present)
- [RISE riseproject-dev/ai-ml-wg](https://github.com/riseproject-dev/ai-ml-wg) - AI/ML working group repo
- [RISE riseproject-dev/language-runtimes-wg](https://github.com/riseproject-dev/language-runtimes-wg) - Language Runtimes working group repo
- [RISE Python wheel builder (GitLab)](https://gitlab.com/riseproject/python/wheel_builder/) - 74-package riscv64 wheel list (ray not present)
- [grpc/grpc issue #41591](https://github.com/grpc/grpc/issues/41591) - gRPC riscv64 wheel request, closed without native support
- [jemalloc/jemalloc issue #2399](https://github.com/jemalloc/jemalloc/issues/2399) - riscv64 cross-build question, unanswered
- [facebook/rocksdb issue #12139](https://github.com/facebook/rocksdb/issues/12139) - riscv64 support, closed as completed
- [facebook/rocksdb issue #7051](https://github.com/facebook/rocksdb/issues/7051) - riscv64 build failure, fixed
- [numpy/numpy issue #30216](https://github.com/numpy/numpy/issues/30216) - riscv64 PyPI wheel request, open
- [apache/arrow issue #50799](https://github.com/apache/arrow/issues/50799) - Gandiva/LLVM JIT relocation error on riscv64
- [apache/arrow issue #49555](https://github.com/apache/arrow/issues/49555) - riscv64 manylinux wheel request
- [apache/arrow PR #49556](https://github.com/apache/arrow/pull/49556) - riscv64 manylinux wheel PR, unmerged
- Debian package tracker for the unrelated bioinformatics "ray" tool: [tracker.debian.org/pkg/ray](https://tracker.debian.org/pkg/ray), [buildd.debian.org status](https://buildd.debian.org/status/package.php?p=ray)
- [Arch Linux RISC-V port overview](https://archriscv.felixc.at/) - package search inconclusive
- [Ubuntu package search - noble](https://packages.ubuntu.com/search?keywords=Ray&suite=noble&searchon=names&section=all) - unrelated "Ray" bioinformatics/audio packages only