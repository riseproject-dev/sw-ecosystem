---
title: FoundationDB
parent: Project Reports
color: red
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Boost
    relation: runtime-dependency
    criticality: critical
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Rocky Linux
    relation: runtime-dependency
    criticality: critical
---

# FoundationDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for FoundationDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="foundationdb" %}

## 1. Project Overview

FoundationDB is a distributed, transactional key-value store with ACID semantics, developed and released by Apple Inc. under the Apache License 2.0 ([license and governance confirmed via CONTRIBUTING.md and LICENSE](https://github.com/apple/foundationdb)). There is no separate legal foundation (no Apache Software Foundation, CNCF, or Linux Foundation entity behind it) - governance is described in the repository's `CONTRIBUTING.md` as "a light governance structure" informally modeled on ASF's "community over code" ethos and the Swift community's structure, but FDB is not formally part of either body. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository.

Decision-making is informal: Apple FDB team members act as core committers who review all pull requests, and a "project technical lead" (informally understood to be Evan Tschannen) maintains an ad-hoc list of external committers who have earned merge rights through sustained contribution. Feature and design discussion happens on the community forums (forums.foundationdb.org); GitHub Issues are reserved for concrete, already-agreed-upon code changes. There is no formal RFC or voting process.

Corporate contribution analysis of the full commit history (31,399 commits) shows two dominant corporate affiliations beyond Apple itself: **Snowflake** (snowflake.com email domain, ~51-56 commits across several named committers including Evan Tschannen, A.J. Beamon, Steve Atherton, Xiaoxi Wang, and others in the 300-2,449 commit range) and **Apple** (apple.com domain, ~55 commits across Jingyu Zhou, Meng Xu, Alex Miller, Alec Grieser). The single highest-volume individual committer, Trevor Clinkenbeard (4,325 commits), carries an openai.com email domain. Snowflake is notable as FoundationDB's largest identified corporate contributor outside Apple, consistent with its public use of FDB as critical infrastructure. Minor contributions also trace to ibm.com, datadoghq.com, and apache.org, alongside a large body of individual/unaffiliated contributors (gmail.com: 112 commits, users.noreply.github.com: 97 commits).

**Community stance on new ports:** No documented policy, RFC process, or precedent exists for adding a new CPU architecture port. Under the informal governance model, a new port would need to proceed through the general path (forum discussion, community consensus, PR review by core or vetted external committers). As detailed in Sections 2 and 12, the one riscv64 request on record has met an explicit maintainer statement of non-support "any time soon."

FoundationDB/Apple is not a member of the RISE project (riseproject.dev). Its members page ([riseproject.dev/members](https://riseproject.dev/members/)) lists Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Canonical, Microchip, Quintauris, ZTE, and others) - Apple/FoundationDB appears in neither tier, and no RISE blog post, wheel-builder entry, or runner-usage record references FoundationDB (checked against the [full RISE blog index](https://riseproject.dev/blog) of 34 posts through 2026-08-24, none of which mention a database or FoundationDB).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-10-11 | Issue [#12445](https://github.com/apple/foundationdb/issues/12445) opened by external contributor `eshattow`: "Please add riscv64 to release builds." | [Issue #12445](https://github.com/apple/foundationdb/issues/12445) |
| 2025-10-17 | Maintainer `jzhou77` (apple.com) responds: "RISCV64 is not a platform we currently support. It'd be good someone can test and contribute back." | Issue #12445 comment thread |
| 2025-11-12 | `eshattow` opens PR [#12549](https://github.com/apple/foundationdb/pull/12549), "Update the base image to RockyLinux 10.2," framed as a prerequisite (RockyLinux 10 is the first release with an official riscv64 architecture) | [PR #12549](https://github.com/apple/foundationdb/pull/12549) |
| 2025-11-12 | Maintainers `dlambrig` and `vishesh` object on procedural grounds (need partner-team approval, version-pinning via env var, testing/maintenance overhead) and put the PR on hold | PR #12549 discussion |
| 2025-11-13 | `eshattow` clarifies the real blocker: EPEL riscv64 toolchain packages require an RHEL 10 derivative and are not expected until "sometime in 2026"; states that if FDB cannot be compiled on riscv64 he will "re-invest that time into gutting FDB from riscv64 releases" | PR #12549 discussion |
| 2026-08-17 | Maintainer `ploxiln` states explicitly: "FoundationDB will not be compiled for risc-v by this project any time soon" - see full quote in Section 12 | PR #12549 discussion |
| 2026-08-21 | PR #12549 merged into `main` (merge commit `b7bb49457086606ab382b0b6f7355d78a2faf05f`) - container base-image bump only, does not touch FDB source | [PR #12549](https://github.com/apple/foundationdb/pull/12549) |
| 2026-09-01 | Release `7.4.7` cut from a branch that still pins `rockylinux/rockylinux:9.x-minimal` in `packaging/docker/Dockerfile` - the RockyLinux 10.2 change has not been backported into any tagged release as of this report | Direct inspection of `packaging/docker/Dockerfile` at tag `7.4.7` |

**Key contributors:** `eshattow` (external, sole driver of the riscv64 request and PR #12549); `jzhou77` and `ploxiln` (Apple, core maintainers responding to the request); `dlambrig` and `vishesh` (Apple, procedural objectors).

**Is it fully upstream?** No. Zero commits across the full 31,399-commit history mention "riscv," "risc-v," or "rv64" (verified via full commit-message grep and `git log -S` content pickaxe across the unshallowed repository). There is no riscv64 branch, no riscv64 toolchain file, and no riscv64-specific source code anywhere in the tree. The only artifact that has merged is a build-container base-image bump that is explicitly described by its own author and by maintainer `ploxiln` as not itself enabling riscv64 builds.

## 3. Upstream Support Tier

No formal architecture-tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`). The only tier table in the repository, in `README.md`, governs **release branches** (Supported / Bug fixes / Experimental / Unsupported applied to version lines such as 7.3, 7.1, 7.0, 6.3), not CPU architectures. `documentation/sphinx/source/platforms.rst` documents OS-level operational quirks (CentOS/GCE shared-memory bug, Ubuntu 12.x kernel deadlock, VirtualBox CPU issue), not a porting policy.

De facto architecture support is inferred from official binary downloads and CI:

| Architecture | Official binaries | CI build | CI test | Status |
|---|---|---|---|---|
| amd64/x86_64 | Yes | Yes (AWS CodeBuild, external to this repo) | Yes | Fully supported, primary target |
| arm64/aarch64 | Yes, since ~7.3.46 (mid-2024) | Yes (referenced via AWS CodeBuild) | Compile/unit-tested, "not as thoroughly validated as x86_64 builds" per FoundationDB forums [NEEDS VERIFICATION - forum thread content not independently re-fetched, based on prior aggregated research] | Officially supported, secondary tier |
| riscv64 | None | None (confirmed: 5 GitHub Actions workflow files read in full, zero riscv references; no GitLab CI/Jenkins/Cirrus configs exist in the repo) | None | Not supported; maintainer has stated it is not planned "any time soon" ([PR #12549](https://github.com/apple/foundationdb/pull/12549)) |

Maintainer `ploxiln`'s stated policy rationale (Section 12) ties platform support directly to AWS availability and glibc-version compatibility rather than a documented architecture matrix - this is the closest thing to an explicit tier policy that exists for non-x86/arm64 architectures, and it excludes riscv64 by name alongside PPC64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

A repository-wide guard census found: `__x86_64__`/`__amd64__` in 15 files, `__aarch64__`/`__arm64__` in 8 files, `__riscv`/`__riscv64`/"riscv" (any casing) in **zero** files. Dedicated architecture directories exist for `flow/aarch64/` and `contrib/Implib.so/arch/{aarch64,x86_64}` - no `riscv64`/`riscv` directory exists anywhere.

Critically, this is not merely an absence of optimization - direct line-by-line reading of the foundational portability headers shows the code **fails to compile** on riscv64, because the `#else`/fallback branches hard-code x86-only headers and intrinsics rather than providing a portable scalar path:

- **`flow/include/flow/Platform.h`**: `timestampCounter()` falls through `#elif __linux__` (which riscv64 satisfies) into `#include <x86intrin.h>; #define timestampCounter() __rdtsc()` - a header that does not exist on riscv64. The atomics block similarly falls into `#elif defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_8)` (true on riscv64, which has native 64-bit atomics) and then `#include <xmmintrin.h>` on any non-aarch64 target, an x86-only header.
- **`contrib/crc32/crc32c.cpp`**: unconditionally includes `<cpuid.h>` and `<nmmintrin.h>` (both x86-only GCC headers) for any non-aarch64/non-ppc64 Unix target, including riscv64, before ever reaching the intended `#error Port me!` fallback.
- **`flow/include/flow/ThreadPrimitives.h`**: `ThreadSpinLock::enter()` has explicit asm for `__aarch64__` and `__powerpc64__`, but its catch-all `#else` branch calls `_mm_pause()` (an x86 SSE intrinsic) with no corresponding header included in the file - an undeclared-identifier compile error on riscv64.

These are ordinary, non-template translation-unit-level includes and function bodies, so the compiler fails immediately on these files regardless of whether the affected code path is ever executed at runtime.

| Component | amd64/x86_64 | arm64/aarch64 | riscv64 |
|---|---|---|---|
| CRC32C checksum | Full (hand-tuned SSE4.2 `_mm_crc32_u64`, 3-way interleaved) | Full (hand-tuned `crc32cb`/`crc32cw` inline asm) | Missing - fails to compile (x86-only headers pulled in via fallback path) |
| SIMD/intrinsics layer | Full (native SSE) | Partial (`sse2neon.h` shim translating SSE calls to NEON) | Missing - no shim, no guard, file assumes x86 |
| Cycle counter (`timestampCounter`) | Full (`__rdtsc`) | Full (hand-written `mrs cntvct_el0` asm) | Missing - compile error |
| Atomics/interlocked ops | Full (GCC `__sync_*` builtins via x86 header path) | Full (same builtins, aarch64-safe path) | Missing - compile error via `xmmintrin.h` |
| Spinlock pause instruction | Full (`_mm_pause`) | Full (`isb` asm) | Missing - undeclared symbol, compile error |
| memcpy (folly_memcpy) | Full (hand-written x86_64 asm) | Not applicable (falls to libc/compiler builtin, no arm64-specific guard needed) | Not reached - upstream compile errors occur first |
| Coroutine context switch (vendored `fdbrpc/libcoroutine`) | Full (hand-written asm for i386/amd64 context) | Present via non-Linux (Apple/OpenBSD) branches only in the code paths inspected | Missing - no riscv64 branch exists |
| Stacktrace unwinding | Full (`x86-inl.inc`, via Abseil) | Full path referenced (`aarch64-inl.inc`), though the body is an upstream Abseil "unimplemented" stub | Missing - no branch |
| Build/CI for the architecture | Full GitHub Actions + AWS CodeBuild coverage | Full (AWS CodeBuild multi-arch, referenced by the RockyLinux PR) | None - no workflow, no toolchain file, no package produced |

## 5. Build System, Cross-Compilation, and Toolchain

Build instructions (top-level `README.md`, "Compiling from source") describe only generic, x86_64-oriented paths:

```
mkdir /some/build_output_dir
cd /some/build_output_dir
CC=clang CXX=clang++ LD=lld cmake -D USE_LD=LLD -D USE_LIBCXX=1 -G Ninja /some/fdb/source_dir
ninja
```

or with GCC:

```
source /opt/rh/gcc-toolset-13/enable
gcc --version  # should say 13
cmake -G Ninja /some/fdb/source_dir
ninja
```

The recommended path is the official `foundationdb/build` Docker image, defined in a separate repository (`FoundationDB/fdb-build-support`) not visible to this research. The only hard-enforced version requirement in the CMake build system is `cmake_minimum_required(VERSION 3.24.2)`; "gcc-toolset-13" is a signal from the RockyLinux devtoolset used in the official container but is not gated by any `VERSION_LESS`/`VERSION_GREATER` check in `CMakeLists.txt` or `cmake/ConfigureCompiler.cmake`.

`cmake/ConfigureCompiler.cmake` contains the only architecture-conditional logic in the build system:
- `USE_AVX`/`USE_AVX512F` are gated to `CMAKE_HOST_SYSTEM_PROCESSOR MATCHES "^x86"` and auto-disable (with a status message) on any other architecture - these are the relevant `-DUSE_X=OFF` flags for a riscv64 target, though they already auto-disable.
- `aarch64` gets `-march=armv8.2-a+lse+crc` (targeting AWS Graviton2+).
- `ppc64le` gets `-m64 -mcpu=power9 -mtune=power9 -DNO_WARN_X86_INTRINSICS`.
- **No `riscv64` branch exists in either location.** A riscv64 build would receive no architecture-specific compiler flags at all and would need a new conditional added upstream (or `-march=`/`-mabi=` supplied manually at configure time), separate from the compile-blocking header issues in Section 4.

`FOUNDATIONDB_CROSS_COMPILING` is the only generic cross-compile flag in the build system; it exists solely to gate Swift-interop and unit-test build steps for the macOS-to-Linux toolchain file (`cmake/toolchain/macos-to-linux.cmake`, the only file in that directory) and carries no riscv64 logic, sysroot, or QEMU integration.

**QEMU:** No mention anywhere in the repository (zero grep hits for "qemu"). No documented emulation-based build or test path for any foreign architecture.

**Known build failures:** See Section 4 - `Platform.h`, `crc32c.cpp`, and `ThreadPrimitives.h` are all confirmed, by direct code reading, to fail to compile on riscv64 via x86-only header includes in their fallback branches. No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, or `Dockerfile.riscv64` exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles | Yes | Yes | No (confirmed compile-blocking includes, Section 4) |
| Official binary/package | Yes | Yes (since ~7.3.46) | No |
| Storage engine (RocksDB, default) runs | Yes | Yes | Not applicable - build never completes |
| TLS/crypto (OpenSSL) | Yes | Yes | Not applicable - build never completes |
| CI-validated | Yes | Yes (per AWS CodeBuild reference) | No |

**Functional gap:** Total. There is no point at which a riscv64 build of FoundationDB produces a working binary today - the build fails at the earliest translation units before any storage-engine, networking, or transactional-correctness question is even reachable.

**Performance gap:** Not assessable - see Section 4 for the specific hand-tuned paths (CRC32C, cycle counter, atomics, spinlock) that have amd64/arm64 implementations and no riscv64 equivalent, all of which would need to be added on top of first making the code compile.

**Security hardening gap:** Not assessable for the same reason - no riscv64 binary exists to evaluate.

**NaN / floating-point semantics:** No FoundationDB-specific riscv64 NaN-boxing or floating-point issue was found in any search (GitHub issue search for "riscv nan floating" returned only issue #12445; web search for "FoundationDB NaN riscv floating point bug" returned only generic, unrelated RISC-V NaN-boxing discussions in other projects such as CVA6 and Valgrind). Data not available: this question cannot be evaluated for a project that does not compile on the target architecture.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, of any kind.** This was verified twice independently by reading the complete, current content of all 5 files in `.github/workflows/` directly from the cloned repository (HEAD `10a002f6bc47996fb378da0fb2d93df5e0187e32`):

| File | Trigger | Runner | Purpose | riscv64 references |
|---|---|---|---|---|
| `codebuild-cleanup.yml` | `issue_comment: [created]` | N/A (JS action) | Minimizes stale bot comments on PRs | None |
| `format.yml` | `pull_request` to main/release-7.4 | `ubuntu-24.04` | `clang-format-19` check | None |
| `stale.yml` | `schedule` (cron) | N/A | Closes stale PRs via `actions/stale` | None |
| `tidy.yml` | `pull_request` to main | `ubuntu-24.04`, container `foundationdb/build:rockylinux9-latest` | `clang-tidy` | None |
| `windows-boost-test.yml` | `pull_request`/`push` | `windows-2025` | Boost-via-vcpkg config/build check | None |

All runners are x86_64 GitHub-hosted (`ubuntu-24.04`, `windows-2025`); there is no ARM runner, no riscv64 runner, no self-hosted runner, and no QEMU emulation step anywhere. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository. Actual multi-arch release builds are reportedly performed via external AWS CodeBuild (referenced by a badge in `README.md`) and a separate `fdb-build-support` Docker-image repository, both outside this repository's visibility to this research.

No RISE runner references, no RISE CI involvement, and no evidence of riscv64 hardware or QEMU use anywhere in the CI system.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (external AWS CodeBuild, inferred) | Yes (inferred, same mechanism) | No |
| CI test | Yes | Yes | No |
| CI release-blocking | Yes | Inferred yes | Not applicable - no job exists |

## 8. Distribution and Release Status

**No riscv64 binary or package exists for FoundationDB in any channel checked:**

- **GitHub releases:** Latest tagged releases `7.4.7` (2026-09-01), `7.3.79`, `7.3.78` show only x86_64 and aarch64 assets; the RockyLinux 10.2 base-image bump (PR #12549, merged 2026-08-21) has not been cut into any tagged release - `packaging/docker/Dockerfile` at tag `7.4.7` still pins `rockylinux/rockylinux:9.x-minimal`.
- **PyPI** ([pypi.org/pypi/foundationdb/json](https://pypi.org/pypi/foundationdb/json)): package `foundationdb` exists (versions 5.1.5 through 7.4.7), but every release asset is a `.tar.gz` source distribution (plus one universal, architecture-neutral wheel) - zero filenames contain "riscv" or "riscv64," and this channel ships only the Python client bindings source, not the compiled server/client shared library.
- **RISE Python wheel builder** ([gitlab.com/.../packages/pypi/simple/foundationdb](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/foundationdb/)): returns an HTTP 302 redirect straight to PyPI's own simple index, indicating RISE has no riscv64 wheel of its own and falls through to upstream.
- **Ubuntu/Debian:** confirmed absent - queried the authoritative Launchpad archive-publishing API directly for all three candidate package names (`foundationdb`, `python3-foundationdb`, `libfoundationdb`); each returned `{"total_size": 0, "entries": []}` across every Ubuntu suite. The [Debian package tracker](https://tracker.debian.org/pkg/foundationdb) independently returns 404. FoundationDB is not packaged in Ubuntu or Debian at all, for any architecture - this is not a riscv64-specific gap but a total absence from these distributions.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=foundationdb)): "foundationdb" does not appear on the page - not packaged.
- **OCI/container images:** Data not available: no dedicated search of DockerHub/GHCR platform tags was performed beyond the base-image (RockyLinux) discussion in Sections 2 and 5; the official `foundationdb/build` image repository itself is not visible to this research.

**What a user must do to get a working binary today:** There is currently no path. Building from source fails immediately at compile time (Section 4) due to x86-only header includes in `Platform.h`, `crc32c.cpp`, and `ThreadPrimitives.h`, none of which have riscv64 branches. A working riscv64 build would require, at minimum: (1) upstream patches to those three files (and any others surfaced once those are fixed) to add a riscv64 code path or a portable fallback, (2) a riscv64-capable build container (blocked, per `eshattow`'s comments, on RHEL10-derivative EPEL toolchain availability expected "sometime in 2026"), and (3) new architecture-specific compiler flags in `cmake/ConfigureCompiler.cmake`, since none currently exist for riscv64.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| CMake | Build-dependency (critical); `cmake_minimum_required(VERSION 3.24.2)`, the only hard version gate in the build system | Yes (CMake itself is broadly portable and packaged for riscv64 across distros) | Yes | Yes | Not a source of riscv64 risk for FDB |
| Boost (esp. Boost.Context 1.86.0) | Build-dependency (critical); `boost::context` fcontext asm is one of two coroutine/actor-switching backends (`COROUTINE_IMPL=boost`), plus filesystem/iostreams/serialization/system/url | Yes since >= ~1.84 - [boostorg/context#306](https://github.com/boostorg/context/issues/306) and [#243](https://github.com/boostorg/context/issues/243) (riscv64 asm support / not-compiled-on-1.83) both closed; tracking issue [#86](https://github.com/boostorg/context/issues/86) closed | Not independently verified for FDB's exact 1.86.0 pin [NEEDS VERIFICATION] | Distro Boost packages carry riscv64 asm | FDB's own `FDBComponents.cmake` defaults non-Windows/non-macOS/non-x86 hosts to the `boost` context-asm backend, so riscv64 hosts would land on this path by default - relevant but not currently reachable since the build fails before this stage matters |
| OpenJDK | Build-dependency (critical); required by the build toolchain (bindings, YCSB benchmarking image) | Yes, widely packaged | Yes | Yes | RockyLinux 10.x drops Java 11, forcing an unrelated Java 11 to Java 21 migration for the `foundationdb/ycsb` benchmarking image as a side effect of the PR #12549 base-image bump (flagged by maintainer `ploxiln`, 2026-08-17) |
| glibc | Runtime-dependency (critical); FDB's Linux builds dynamically link against glibc | Present on riscv64 Linux distros generally, but see blocker below | Not separately assessed | Not separately assessed | Direct blocker cited by maintainer `ploxiln`: "we need to build against an equal or older version of glibc than is present in the linux systems or images where FDB runs" - this is the stated technical reason RockyLinux 9.x (older glibc) remains the actual FDB build base, independent of the container used in PR #12549 |
| Rocky Linux | Build-dependency (critical); base OS for FDB's official build/release container | RockyLinux 10 is the first release with an official riscv64 architecture, per PR #12549's own rationale | Not applicable (OS-level) | RockyLinux 10.2 base-image bump merged (PR #12549) but is a container prerequisite only - it is not itself used to build FDB and has not been adopted for the actual FDB build toolchain, which remains RockyLinux 9.x | The gating dependency is EPEL riscv64 toolchain packages, which require an RHEL 10 derivative and are expected "sometime in 2026" per `eshattow` (issue #12445 comment thread) |
| jemalloc 5.3.0 | Default memory allocator (`USE_JEMALLOC`, optional but default-on) | Yes, builds on riscv64 with `-pthread` (auto-links `libatomic`) | Partial - no dedicated riscv64 CI; Debian buildd `rv-osuosl-03` green | Yes: Debian sid `libjemalloc2` 5.3.1-2 installed; Ubuntu 24.04 `libjemalloc2` present | Open: [jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) "Does jemalloc support cross build for RISCV64?" |
| RocksDB (pinned) | Pluggable storage engine (`WITH_ROCKSDB=ON`, default) | Yes - native riscv64 merged [facebook/rocksdb#12139](https://github.com/facebook/rocksdb/pull/12139) (Dec 2023) | No dedicated riscv64 CI job; manual QEMU/hardware only | Yes: Debian sid, Ubuntu 24.04 packages present | Vendored xxHash inside RocksDB has no RVV path - [facebook/rocksdb#14604](https://github.com/facebook/rocksdb/pull/14604) open to address; general non-x86 march handling tracked in [#11461](https://github.com/facebook/rocksdb/issues/11461) |
| OpenSSL | TLS and crypto primitives (required) | Yes, requires binutils >= 2.38 for Zvk vector-crypto asm paths | Mostly green; a `glibc riscv_hwprobe` SIGILL edge case was fixed (BZ #32932) | Yes: Debian sid, Ubuntu 24.04, Arch RISC-V all present | Open: [#28664](https://github.com/openssl/openssl/issues/28664) SHA256 perf, [#25334](https://github.com/openssl/openssl/issues/25334) AES cap-flag bug, [#30880](https://github.com/openssl/openssl/issues/30880) flaky riscv64 CI test |
| zlib | Required by OpenSSL and RocksDB compression | Yes, clean, pure C | Yes | Yes: present in Debian sid, Ubuntu 24.04, Arch RISC-V, Alpine | None open |
| LZ4 | Compression, feeds RocksDB (`WITH_LZ4=ON`, optional) | Yes, correctness passes | QEMU CI generic pass | Yes: Debian sid, Ubuntu 24.04 present | No RVV fast path merged yet; 4 open proposals unmerged ([lz4#1635](https://github.com/lz4/lz4/issues/1635)) |
| liburing | Async I/O (`WITH_LIBURING`, off by default in FDB; RocksDB sub-build can enable it) | Yes - dedicated `src/arch/riscv64/` since 2023 | Not upstream-CI-tested, Debian build green | Yes: Debian sid present; Ubuntu 24.04 ships a stale version with a known wrong-ring-offset bug on non-4K-page riscv64 kernels | Low priority for FDB since off by default |
| Abseil-cpp | Transitive via gRPC (`WITH_GRPC=ON`, default) | Mostly yes but [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) "Can't link using riscv64 toolchain" remains open | Debian sid `libabsl-dev` installed but [Debian bug #1126886](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886) documents two SEGFAULTs on riscv64 | Confirmed: Ubuntu 26.04 LTS (Resolute) `libabsl-dev` 20260107.0-4 present in main archive | CRC32C hardware-acceleration PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) is blocked on Google reviewer access to RISC-V hardware |
| gRPC | New RPC layer (`WITH_GRPC=ON`, default) | Yes on Linux, but historical SIGILL reports ([grpc/grpc#37791](https://github.com/grpc/grpc/issues/37791), closed) | Debian sid grpc 1.51.1-9 installed | Stale everywhere official: Ubuntu 24.04 and Debian sid both ship 1.51.1 (2+ major versions behind); no official riscv64 PyPI wheel ([grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591), open) - RISE publishes an unofficial riscv64 wheel (1.76.0, 5 minors behind) | Fragile but not confirmed blocking for FDB's own build |
| AWS SDK C++ / aws-c-common family | Optional S3 backup client (`BUILD_AWS_BACKUP`, off by default) | Not deeply characterized; no riscv64-specific issue history found in `aws-c-common` | Not deeply characterized | Not verified | Off by default in FDB's build - low priority unless S3 backup is enabled |
| fdbrpc/libcoroutine (vendored, in-tree) | Default coroutine backend on Linux/x86 (`COROUTINE_IMPL=libcoro`) | Unverified - no upstream tracker since this is FDB's own vendored code; a direct pass of `fdbrpc/libcoroutine/*.S` for a riscv64 asm stub was not completed in this research pass | Unknown | Not applicable (ships inside FDB source) | Flagged as an open, unresolved risk in prior research - the least-characterized piece of the coroutine stack |
| toml11, msgpack-c, fmt | Header-only config/serialization/formatting | Architecture-neutral, low risk | N/A | N/A | Not separately tabled in prior research due to negligible SIMD/crypto/allocator surface |

All of the above dependency-level findings are moot for FoundationDB today in the sense that the FDB codebase itself fails to compile on riscv64 before any of these dependencies come into play (Section 4) - but they represent the next layer of risk that would need to be resolved once FDB's own portability headers are fixed.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#12445](https://github.com/apple/foundationdb/issues/12445) | Build for RISC-V riscv64 | Open (opened 2025-10-11, last updated 2025-11-12) | Feature request, not a bug | The only dedicated riscv64 tracking issue in the repository. Body: "Please add riscv64 to release builds." Discussion led directly to PR #12549. |
| [#12549](https://github.com/apple/foundationdb/pull/12549) | Update the base image to RockyLinux 10.2 | Merged 2026-08-21 | Infrastructure, not a functional fix | Container-image prerequisite only; explicitly stated by its own author and by `johscheuer` and `ploxiln` to not itself build FDB or enable riscv64 releases. |

**No correctness bugs are filed** for FoundationDB on riscv64 - because no one appears to have attempted a build far enough to hit the compile-blocking issues identified directly in this report's own source-code trace (Section 4: `Platform.h`, `crc32c.cpp`, `ThreadPrimitives.h`). Those three issues are original findings from direct code inspection in this research pass, not upstream-tracked GitHub issues; they should be considered a leading indicator of what the first real riscv64 build attempt will encounter, not a confirmed-and-triaged bug list. Data not available: no other bug tracker (GitLab, Jira) was found for this project beyond GitHub Issues.

## 12. Objections and Upstream Blockers

**Stated technical objection (maintainer `ploxiln`, 2026-08-17, on PR #12549):**

> "FoundationDB will not be compiled for risc-v by this project any time soon. We will continue making linux builds on rockylinux 9.x because our linux builds dynamically link glibc, and we need to build against an equal or older version of glibc than is present in the linux systems or images where FDB runs. RISC-V is still in a very early state. PPC64 workstations and servers have been out in the world for a long time, and we don't build/test/support that either. I have nothing against PPC64 or RISCV64, just understand that if it's not commonly available on AWS then we're not building and testing it... As explained above, this container image being changed here is not the one used to build FoundationDB."

This is the single most important primary source in this report: it states two independent, durable blockers - (1) a glibc-ABI compatibility policy that keeps the actual FDB build environment on RockyLinux 9.x regardless of what the auxiliary container uses, and (2) an explicit platform-prioritization policy tied to AWS availability, under which riscv64 is grouped with PPC64 as architectures the project does not build or test.

**Organizational/procedural objections (maintainers `dlambrig`, `vishesh`, PR #12549, 2025-11-12):** concerns about upgrading the build container without partner-team approval, needing cross-team testing before a version bump, and a request to make the RockyLinux version an environment-variable-selectable option rather than a hard bump - these objections were about the container-image change itself, not about riscv64 specifically, but they illustrate the general caution applied to infrastructure changes touching this codebase.

**Technical blocker (toolchain availability, `eshattow`, PR #12549, 2025-11-13):** EPEL riscv64 toolchain packages require an RHEL 10-derivative base and are not expected to have pre-compiled releases until "sometime in the future... expected in 2026." This is the concrete supply-chain reason the RockyLinux 10.2 bump was pursued at all, even though it does not itself unblock FDB compilation.

**Path suggested by a maintainer (`dlambrig`, issue #12445, 2025-11-12):** "perhaps the Dockerfile could support both risc64 and x86_64/amd64... so likely the community would have to support the risc64 portion in the near term." This is the only concrete path forward on record: community-contributed, community-maintained riscv64 support, rather than an Apple-funded port.

**Acceptance probability:** Low in the near term. The maintainer statement in PR #12549 is an explicit, recent (2026-08-17), and specific deprioritization tied to durable criteria (AWS availability, glibc ABI policy) rather than a temporary resourcing gap. The one active external driver (`eshattow`) has stated a personal contingency of abandoning the effort if riscv64 compilation proves infeasible for him individually. No corporate sponsor identified in Section 1 (Apple, Snowflake, OpenAI-affiliated top committer) has stated any riscv64 interest.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists in any form - confirmed by reading all 5 GitHub Actions workflow files in full and confirming the absence of GitLab CI, Jenkins, or Cirrus configuration. Beyond the CI gap, riscv64 support is confirmed broken at the source level: direct inspection of `flow/include/flow/Platform.h`, `contrib/crc32/crc32c.cpp`, and `flow/include/flow/ThreadPrimitives.h` shows their non-riscv64 fallback branches unconditionally include x86-only headers (`x86intrin.h`, `xmmintrin.h`, `cpuid.h`, `nmmintrin.h`) and call x86-only intrinsics (`_mm_pause()`), producing compile errors before any storage, networking, or transactional code is reached. This is corroborated by an explicit maintainer statement that riscv64 compilation "will not" happen "any time soon" ([PR #12549](https://github.com/apple/foundationdb/pull/12549), comment by `ploxiln`, 2026-08-17), citing durable glibc-ABI and AWS-availability policy rather than a temporary gap. No distribution (Ubuntu, Debian, Arch RISC-V) ships a FoundationDB package at all, for any architecture, so the distribution floor described in the color model does not apply - there is no unpatched or patched distro build to fall back on. This combination - confirmed non-functional source code plus an explicit, current maintainer statement of non-support - meets the bar for red rather than the default orange for merely untested/unattempted architectures.
- **Optimization level:** Not applicable. FoundationDB is a distributed transactional database and storage engine, not a project whose primary value proposition is architecture-specific performance optimization (per the project-color-coding skill's test: running it with only generic scalar C code would still deliver its core functional value, even though several internal subsystems such as CRC32C are hand-tuned per architecture). The optimization-purpose modifier therefore does not apply, and no Optimization level cap is assessed.
- **Pending work that could change the grade:** Issue [#12445](https://github.com/apple/foundationdb/issues/12445) remains open, and PR [#12549](https://github.com/apple/foundationdb/pull/12549) is merged but only addresses a build-container prerequisite (RockyLinux 10.2), not FDB source portability - as of this report it has not even been backported into a tagged release (`7.4.7`, 2026-09-01, still pins RockyLinux 9.x). Maintainer `dlambrig` has suggested a community-maintained riscv64 path is the most plausible route forward if EPEL/RHEL10 riscv64 toolchain packages mature as expected in 2026. No RISE involvement of any kind was found. Absent a change in Apple's or Snowflake's own platform priorities, or a community contributor picking up the compile-blocking fixes identified in Section 4, this grade is unlikely to change in the near term.

## 14. Investment Analysis

RISE has no prior involvement with FoundationDB (Section 1) - no funded work, no wheel-builder entry, no blog coverage, no runner usage. All sizing below is therefore full-scope; nothing is already covered.

### 14.1 Functional Enablement

The minimum path to a compiling riscv64 build requires, at minimum: (1) fixing the three confirmed compile-blocking fallback branches in `flow/include/flow/Platform.h`, `contrib/crc32/crc32c.cpp`, and `flow/include/flow/ThreadPrimitives.h` to add riscv64-specific or genuinely portable scalar code paths; (2) auditing and fixing the vendored `fdbrpc/libcoroutine` asm for a riscv64 context-switch implementation, or forcing `COROUTINE_IMPL=boost` on riscv64 (which appears buildable per upstream Boost.Context riscv64 fixes); (3) adding a `riscv64` branch to `cmake/ConfigureCompiler.cmake` with correct `-march=`/`-mabi=` flags; (4) resolving the open [abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) riscv64 linking failure and Debian-documented SEGFAULTs, since `WITH_GRPC=ON` is default-on and pulls in Abseil transitively; and (5) securing or building a riscv64-capable build container, independent of PR #12549's RockyLinux 10.2 bump, which the maintainers state is not the container actually used to build FDB.

### 14.2 Performance Optimization

Not assessable as a distinct workstream until functional enablement (14.1) is complete - there is no working riscv64 binary today against which to compare performance. Once compiling, the known gaps (Section 4) are: CRC32C (would need RVV or Zbc/Zbkc-based CRC intrinsics to match the amd64/arm64 hand-tuned paths), cycle-counter access (RISC-V `rdcycle`/`rdtime` equivalent to replace `__rdtsc()`), and the RocksDB/LZ4 vendored xxHash RVV gap already tracked upstream ([facebook/rocksdb#14604](https://github.com/facebook/rocksdb/pull/14604)).

### 14.3 CI/CD Infrastructure

A net-new riscv64 GitHub Actions job would need to be added (no existing workflow has an architecture matrix to extend into), gated on functional enablement first landing. RISE-hosted riscv64 runners (referenced generally in prior research on riseproject.dev, e.g. the "RISE RISC-V Runners" program) could substitute for dedicated hardware procurement, but no RISE engagement with this specific project exists yet - this would be a new relationship to establish, not an existing one to extend.

### 14.4 Ecosystem Enablement

FoundationDB does not have a significant dependent package ecosystem in the sense defined for Section 10 (its official language bindings - Python, Java, Go, Ruby - are part of the upstream project itself, not a large body of third-party plugins/extensions that separately need riscv64 enablement), so this is not sized as a distinct ecosystem workstream. The closest analogue is the dependency-chain risk documented in Section 9: gRPC's lack of an official riscv64 wheel and Abseil's open linking issue would need resolution (or upstream patch contribution) as part of, not separate from, the functional-enablement work in 14.1.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix compile-blocking x86-only fallback includes in `Platform.h`, `crc32c.cpp`, `ThreadPrimitives.h` | 2-4 | Upstream FDB core or external contributor with core-committer sponsorship | Critical |
| Functional | Verify/port `fdbrpc/libcoroutine` riscv64 asm, or validate forcing `COROUTINE_IMPL=boost` on riscv64 | 2-3 | Upstream FDB core | Critical |
| Functional | Add riscv64 branch with correct `-march=`/`-mabi=` flags to `cmake/ConfigureCompiler.cmake` | 0.5-1 | Upstream FDB core or external contributor | High |
| Functional | Secure/build a riscv64-capable FDB build toolchain (distinct from PR #12549's container), pending RHEL10-derivative EPEL riscv64 toolchain maturity expected in 2026 | 4-8 (largely blocked on external timeline, not effort-bound) | Upstream FDB core (glibc ABI policy owner) | Critical, externally gated |
| Functional | Resolve Abseil riscv64 linking issue ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) and Debian-documented SEGFAULTs as a prerequisite for `WITH_GRPC=ON` default build | 1-2 (upstream Abseil work, tracked separately) | Abseil upstream, coordinated by FDB contributor | High |
| CI/CD | Add riscv64 CI job once functional build succeeds; evaluate RISE runner sponsorship | 1-2 | Upstream FDB core, RISE liaison | Medium |
| Performance | RVV/Zbc CRC32C path, riscv64 cycle-counter path | 2-3 | Upstream FDB core or external contributor | Medium |
| Organizational | Secure Apple/FDB maintainer buy-in given the explicit 2026-08-17 deprioritization statement; establish community-maintained-path agreement per `dlambrig`'s suggestion | Not effort-bound; organizational/relationship work | RISE or sponsoring silicon vendor liaison with Apple FDB team | Critical, precedes all technical work |

## 15. Updates

No updates yet - initial report dated 2026-09-11.

## 16. References

- [FoundationDB repository](https://github.com/apple/foundationdb)
- [FoundationDB homepage](https://www.foundationdb.org/)
- [Issue #12445 - Build for RISC-V riscv64](https://github.com/apple/foundationdb/issues/12445)
- [PR #12549 - Update the base image to RockyLinux 10.2](https://github.com/apple/foundationdb/pull/12549)
- [FoundationDB PyPI package JSON](https://pypi.org/pypi/foundationdb/json)
- [RISE Python wheel builder index for foundationdb](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/foundationdb/)
- [RISE project wheel builder (full list)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog index](https://riseproject.dev/blog)
- [RISE project members page](https://riseproject.dev/members/)
- [Debian package tracker - foundationdb (404, not packaged)](https://tracker.debian.org/pkg/foundationdb)
- [Arch Linux RISC-V port package search - foundationdb](https://archriscv.felixc.at/?q=foundationdb)
- [FoundationDB benchmarking documentation](https://apple.github.io/foundationdb/benchmarking.html)
- [FoundationDB performance documentation](https://apple.github.io/foundationdb/performance.html)
- [FoundationDB forums - ARM support thread](https://forums.foundationdb.org/t/arm-support-for-foundationdb/68)
- [jemalloc issue #2399 - riscv64 cross-build support](https://github.com/jemalloc/jemalloc/issues/2399)
- [Boost.Context issue #306 - riscv64 support](https://github.com/boostorg/context/issues/306)
- [Boost.Context issue #243 - asm parts not compiled on 1.83/riscv64](https://github.com/boostorg/context/issues/243)
- [Boost.Context issue #86 - riscv64 tracking issue](https://github.com/boostorg/context/issues/86)
- [OpenSSL issue #28664 - SHA256 performance](https://github.com/openssl/openssl/issues/28664)
- [OpenSSL issue #25334 - AES cap-flag bug](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #30880 - flaky riscv64 CI test](https://github.com/openssl/openssl/issues/30880)
- [RocksDB PR #12139 - native riscv64 support](https://github.com/facebook/rocksdb/pull/12139)
- [RocksDB issue #11461 - generic non-x86 march handling](https://github.com/facebook/rocksdb/issues/11461)
- [RocksDB PR #14604 - vendored xxHash RVV bump](https://github.com/facebook/rocksdb/pull/14604)
- [LZ4 issue #1635 - RVV proposal thread](https://github.com/lz4/lz4/issues/1635)
- [Abseil-cpp issue #1702 - riscv64 toolchain linking failure](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #1684 - NegativeNaN test failure (closed)](https://github.com/abseil/abseil-cpp/issues/1684)
- [Abseil-cpp PR #1986 - CRC32C hardware acceleration, blocked](https://github.com/abseil/abseil-cpp/pull/1986)
- [Debian bug #1126886 - abseil riscv64 SEGFAULTs](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886)
- [gRPC issue #37791 - SIGILL on riscv64 (closed)](https://github.com/grpc/grpc/issues/37791)
- [gRPC issue #35839 - undefined atomic symbol (closed)](https://github.com/grpc/grpc/issues/35839)
- [gRPC issue #41591 - no official riscv64 PyPI wheel](https://github.com/grpc/grpc/issues/41591)