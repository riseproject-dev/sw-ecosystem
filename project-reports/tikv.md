---
title: TiKV
parent: Project Reports
color: orange
dependencies:
  - name: RocksDB
    relation: build-dependency
    criticality: critical
  - name: gRPC
    relation: build-dependency
    criticality: critical
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
  - name: jemalloc
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
---

# TiKV

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for TiKV<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="tikv" %}

## 1. Project Overview

TiKV is a distributed, transactional key-value database written in Rust, originally created by PingCAP to serve as the storage layer underneath TiDB. It is a **graduated project of the Cloud Native Computing Foundation (CNCF)** (graduated September 2020), licensed under Apache 2.0. It stores data via an embedded RocksDB (with the Titan blob engine) instance per node and coordinates via the Raft consensus protocol; client/peer RPC runs over gRPC.

**Governance** ([tikv/community GOVERNANCE.md](https://github.com/tikv/community)) is layered: Steering Committee to Maintainers to Committers to Reviewers, plus a non-decision-making Infra team. Decisions use three approval tiers: Consensus (2 binding +1s, no vetoes) for most role changes; Lazy Majority for new reviewers; and a **2/3 Majority** reserved for actions "affecting the foundation of the project," which explicitly includes "Adoption of New Codebase" (large external codebases, massive restructuring, or a new team) and changes to governance itself. New/removed Steering Committee members are explicitly referred to the CNCF.

**Corporate control of the steering committee**: of 10 named steering-committee members, **7 represent PingCAP** (Xiaoguang Sun, Siddon Tang, Wink Yao, Jinpeng Zhang, Qi Liu, Dongxu Huang, Qiu Cui), with the remaining 3 seats held by JD Cloud & AI (Daobing Li), Yidian Zixun (Fu Chen), and one unlisted affiliation (Jay Li). PingCAP effectively controls project direction.

**Adopters** listed on [tikv.org](https://tikv.org/): Dailymotion, ZaloPay, Ping An, JD Cloud, TiDB Cloud, Meitu, Zhuanzhuan, Ctrip, Tuya, JuiceFS.

**Community culture on new ports**: TiKV has no formal platform-tier policy document (no `PLATFORMS.md`/`SUPPORT.md`). The closest applicable governance mechanism for a new architecture port is the 2/3-majority "Adoption of New Codebase" vote category, which is framed for contributions large enough to "potentially change the shape and direction of the project with massive restructuring and future maintenance commitment." Given the project's current x86_64/aarch64-only stance and PingCAP's dominant steering-committee control, a RISC-V port would plausibly need to clear this high bar rather than land as an ordinary PR.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists and none has ever been attempted.

| Date | Event | Source |
|---|---|---|
| - | No first RISC-V commit found | Full-repo grep of master @ [`3c8e5f4`](https://github.com/tikv/tikv) returned zero matches for "riscv" |
| - | No riscv64 tracking issue ever opened | [`search_issues`](https://github.com/tikv/tikv/issues) for riscv/riscv64 in title/body: 0 results |
| - | No riscv64 pull request ever opened, merged, or closed | [`search_pull_requests`](https://github.com/tikv/tikv/pulls) for riscv/riscv64: 0 results |

**Key contributors:** none - there is no port to attribute.

**Fully upstream?** Not applicable. There is nothing upstream to be partial or complete; the architecture is entirely absent from the codebase, CI, and documentation.

## 3. Upstream Support Tier

TiKV has no formal, written platform-tier policy. The de facto tier is stated in [`CONTRIBUTING.md`](https://github.com/tikv/tikv/blob/master/CONTRIBUTING.md) and `README.md`: **x86_64 and aarch64 on Linux and macOS** are the supported build/runtime targets. The `tiup` binary-release download instructions in `README.md` are explicitly gated: `export GOARCH=amd64 # only {amd64, arm64} are supported`. CONTRIBUTING.md's only platform-conditional guidance is: "If you are targeting platforms other than x86_64/aarch64 Linux or macOS, you'll also need llvm and clang" - riscv64 is never named, and no flags or known-good toolchain versions are documented for that path.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (clippy job) | Yes (clippy job) | No |
| CI test suite runs | Not in this workflow (lint-only; fuller build/test pipelines exist but are routed through the external `PingCAP-QE/artifacts` repo, out of scope of this research) | Not in this workflow (same caveat) | No |
| Official binary release | Yes, via TiUP | Yes, via TiUP | No |
| Named in CONTRIBUTING.md/README.md as supported | Yes | Yes | No |
| Makefile arch-specific accommodations | None needed (baseline) | SSE disabled for RocksDB; `-Ctarget-feature=-outline-atomics` workaround | None exist |

## 4. Technical Architecture and RISC-V-Specific Subsystems

TiKV itself has **no JIT** and no vendored architecture-specific assembly or SIMD intrinsics. A repo-wide search for `target_arch` conditionals found only **3 files in the entire codebase**, none riscv-related:

- `components/in_memory_engine/src/statistics.rs`: gates `physical_core_id()` on `target_arch = "x86_64"` + linux; every other architecture (arm64, riscv64, everyone else) falls through to a stub `-1` return. This is an x86_64-only optimization with a universal fallback, not arm64- or riscv64-specific code.
- `components/cloud/azure/src/token_credentials/certificate_credentials.rs`: gates on `wasm32` only (Azure SDK compatibility shim, irrelevant to server architectures).
- `tests/benches/coprocessor_executors/mod.rs`: gates a perf-counter benchmark path on `x86_64`+linux, no-op fallback elsewhere.

**arm64 evidence** (6 hits total in the repo): Makefile disables RocksDB SSE on `arm`/`arm64`/`aarch64`; a `-Ctarget-feature=-outline-atomics` linker workaround is applied for `aarch64-unknown-linux-gnu`; Dockerfiles special-case the `protoc` download for `aarch64`; `diagnostics/sys.rs` maps `"aarch64" => "arm64"` for a CPU-info API field. These are **build-portability accommodations**, not hand-tuned SIMD/intrinsics - even TiKV's second-tier supported architecture gets no architecture-specific acceleration in this repo (TiKV's actual hot-path acceleration, e.g. SSE4.2/CRC, lives in its native C/C++ dependencies - RocksDB, gRPC, jemalloc - not in TiKV's own Rust code).

**riscv64 evidence:** zero. No `cfg(target_arch = "riscv64")`, no `#ifdef __riscv`, no Makefile/Dockerfile stanza, no CI job, no TODO/FIXME referencing it. riscv64 is silently swept into the generic `not(x86_64)` fallback paths along with every other unlisted architecture - it was never named or accounted for, not even as a stub.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core-affinity (`physical_core_id`) | Hand-tuned (`sched_getcpu`-based) | Stub (`-1` fallback, same as everyone else) | Stub (`-1` fallback) |
| RocksDB SSE build flag | Enabled (default) | Explicitly disabled in Makefile | No accommodation exists (undefined behavior if relevant) |
| Outline-atomics workaround | N/A | Applied for `aarch64-unknown-linux-gnu` | No accommodation exists |
| AFL fuzz target | Present (x86_64-gated) | Absent | Absent |
| Perf-counter benchmark | Present (x86_64-gated) | Absent | Absent |

## 5. Build System, Cross-Compilation, and Toolchain

TiKV is a Cargo (Rust) workspace, not CMake - there is no `CMakeLists.txt` anywhere in the repo; CMake appears only as a transitive dependency needed to build gRPC's C++ core (via `grpcio-sys`) and RocksDB/Titan (via `librocksdb_sys`/`libtitan_sys`) as native sub-builds through Cargo build scripts.

**Build commands:** `make build` / `make release` (wraps `cargo build [--release]`), or plain `cargo build --release`.

**Toolchain pin** (`rust-toolchain.toml`):
```
channel = "nightly-2026-01-30"
components = ["rustfmt", "clippy", "rust-src", "rust-analyzer"]
```
No stated minimum Rust version beyond this pinned nightly (auto-selected by rustup/cargo).

**Native prerequisites** (from `CONTRIBUTING.md`/`AGENTS.md`, mirrored in `Dockerfile`): `cmake` (required for gRPC); a C++ compiler, stated as **"gcc 5+ or clang"** (needed for C++11/14 support in gRPC's C++ core - this is the only explicit minimum-version toolchain requirement in the repo, and it is not riscv64-specific); `protoc`.

**Only non-x86/arm guidance in the repo**: "If you are targeting platforms other than x86_64/aarch64 Linux or macOS, you'll also need `llvm` and `clang`" - described as needed "to generate bindings for different platforms and build native libraries (required for grpcio, rocksdb)." riscv64 is never named; a contributor would have to infer it falls under "other platforms" with no documented flags, no known-good toolchain versions, and no CI to validate the result.

**Makefile arch-conditional logic** (none riscv64):
```makefile
# Disable SSE on ARM
ifeq ($(shell uname -p),aarch64)
ROCKSDB_SYS_SSE=0
endif
ifeq ($(shell uname -p),arm)
ROCKSDB_SYS_SSE=0
endif
ifeq ($(shell uname -p),arm64)
ROCKSDB_SYS_SSE=0
endif

# aarch64: work around undefined-symbol issue with outline atomics
ifeq ($(TIKV_BUILD_RUSTC_TARGET),aarch64-unknown-linux-gnu)
export RUSTFLAGS := $(RUSTFLAGS) -Ctarget-feature=-outline-atomics
endif
```
Other env-var knobs controlling Cargo features (not CMake defines, since TiKV has no CMake surface of its own): `ROCKSDB_SYS_PORTABLE=0`, `ROCKSDB_SYS_SSE=0`, `TCMALLOC=1`/`MIMALLOC=1`/`SNMALLOC=1`/`SYSTEM_ALLOC=1` (allocator selection; default is jemalloc), `TIKV_FRAME_POINTER=0`. None are documented as riscv64-specific.

**QEMU usage:** none in this repo - no QEMU-based emulation step or cross-arch release pipeline is defined anywhere in `tikv/tikv` (release Docker builds are pointed at the external `PingCAP-QE/artifacts` repo).

**No build documentation exists for riscv64**: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake` (n/a, no CMake), and any `Dockerfile.riscv64` were all checked and do not exist. The only Dockerfiles present (`Dockerfile`, `Dockerfile.FIPS`, `Dockerfile.test`) are not arch-specific.

**Known build failures:** none documented for TiKV itself (never attempted), but a known build failure exists one level down in `tikv/jemallocator#118` for the `riscv64gc-unknown-linux-musl` target (configure step error "cannot find sources (Makefile.in)"; see Section 11).

**What would be required to attempt a riscv64 build**, per this research: (a) confirm/add a `riscv64gc-unknown-linux-gnu` target to the pinned nightly toolchain; (b) provide gcc 5+/clang and cmake for riscv64 to satisfy the vendored gRPC and RocksDB/Titan C++ sub-builds; (c) independently determine whether the SSE-disable and outline-atomics workarounds (currently gated only for aarch64/arm/arm64) have a riscv64 analog that needs adding; (d) author a build recipe from scratch, since no existing QEMU or cross-Docker starting point exists in the repo.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | Yes (CI-verified via clippy job at minimum) | Yes (CI-verified via clippy job at minimum) | Unknown - never attempted, no toolchain integration exists |
| Runs / passes tests | Presumed via external PingCAP-QE pipeline (out of scope) | Presumed via external PingCAP-QE pipeline (out of scope); note `tikv/tikv#6639` "Cannot compile TiKV on ARM64" documents TiKV has had ARM64 build problems historically | Unknown |
| Official binary via TiUP | Yes | Yes | No |
| Hand-tuned core-affinity | Yes | No (stub) | No (stub) |
| RocksDB HW-accelerated CRC32C | Yes | Yes (per RocksDB support matrix, not independently verified here) | No - falls back to scalar CRC32C; hardware-accelerated PRs (`#14536` Zbc CRC32C, `#14894` Zvbc vector CRC32C) are open and stalled |
| TLS / encryption-at-rest (OpenSSL) | Yes, no known side-channel gap | Yes, no known side-channel gap | Functional, but carries an **open, unresolved AES T-table cache side-channel** on riscv64 hardware lacking Zkn/Zvkned extensions ([openssl/openssl#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)) |

**Functional gaps:** whether TiKV can build and run on riscv64 at all is presently **untested and undocumented** - this is an absence-of-data finding, not a confirmed pass or fail. No RocksDB, gRPC, or jemalloc build has been verified end-to-end for TiKV specifically on riscv64 in any source checked.

**Performance gaps:** no published benchmark numbers exist for TiKV on riscv64 from any source (TiKV, PingCAP, or RISE Project) - confirmed by targeted web search and a search of the RISE blog. Indirectly, TiKV's default production build (jemalloc allocator + RocksDB with default codecs) would inherit performance gaps from its dependencies: RocksDB's CRC32C hardware acceleration PRs are stalled (Section 9), and several optional RocksDB compression codecs (Snappy, zstd, LZ4, zlib) have open, unreviewed RVV-acceleration PRs that have not landed, meaning riscv64 currently gets scalar-only codec performance where amd64/arm64 get SIMD acceleration.

**Security hardening gaps:** the OpenSSL AES T-table side-channel (above) is directly relevant to TiKV's encryption-at-rest and FIPS build modes, since TiKV uses OpenSSL for both TLS and at-rest encryption. This is an open, unresolved issue as of mid-2026 per the fix PRs cited.

**NaN / floating-point semantics:** no data found. A targeted search for RISC-V-related NaN/floating-point bugs in `tikv/tikv` returned 0 results (consistent with there being no riscv64 activity in the repo at all).

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** The only CI workflow file in the entire repository is [`.github/workflows/tikv-clippy-darwin.yml`](https://github.com/tikv/tikv/blob/master/.github/workflows/tikv-clippy-darwin.yml):
- Trigger: `pull_request` to `master`/`feature/**` (with `paths-ignore` for docs/images).
- Runners: a 2-entry matrix - `macos-15-intel` (amd64) and `macos-15` (arm64). No Linux runner, no QEMU, no riscv64 runner of any kind.
- Job: `clippy-darwin` runs `make clippy` only - a static lint check, not a build of release binaries, not a test-suite execution, not a cross-compilation step.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository root. A repo-wide case-insensitive grep for "riscv" across the full working tree (1551 tracked files, commit `3c8e5f454ff54d2e4765be3e079ec9481b0eb690`) returned zero matches.

**RISE runners:** not used. TiKV does not appear in the `riseproject-dev` GitHub org's repos, is not referenced on the RISE blog, and is not listed in RISE's wheel builder.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes (`tikv-clippy-darwin.yml`) | Yes (`tikv-clippy-darwin.yml`) | No |
| Scope of that job | Clippy lint only | Clippy lint only | N/A |
| Runner type | macOS cloud runner (`macos-15-intel`) | macOS cloud runner (`macos-15`) | N/A |
| QEMU used | No | No | No (no job exists) |
| RISE runner used | No | No | No |
| Release-blocking | Gates PR merge to master/feature branches (lint only) | Same | N/A |

## 8. Distribution and Release Status

**No official riscv64 binary or package exists for TiKV in any channel checked.**

- **GitHub Releases:** checked `v8.5.8`, `v8.5.7`, `v8.5.6`. Every release carries only **GitHub's auto-generated source archives** (`v8.5.8.zip`, `v8.5.8.tar.gz`) - no uploaded binary artifacts of any kind, for any architecture. TiKV distributes compiled binaries via **TiUP** (PingCAP's component manager/mirror), not GitHub release assets; TiUP's riscv64 coverage was out of scope for this research and was not shown to carry riscv64 builds.
- **PyPI** ([`pypi.org/pypi/tikv/json`](https://pypi.org/pypi/tikv/json)): exactly one file, `tikv-0.0.1.tar.gz` (source sdist only, no wheels, no riscv64 filename). This package (version 0.0.1, generic summary "tikv") is almost certainly an unrelated name-squat, not the real Rust-based TiKV database.
- **Ubuntu 26.04 (resolute)** ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=TiKV&suite=resolute&searchon=names&section=all)): **no package literally named `tikv` exists at all**, for any architecture. The only substring matches are three unrelated Rust FFI crates - `librust-tikv-jemalloc-ctl-dev`, `librust-tikv-jemalloc-sys-dev`, `librust-tikv-jemallocator-dev` - which do list riscv64 among their supported architectures, but these are upstream jemalloc allocator bindings that happen to share the "tikv" name prefix, not the TiKV key-value store.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=tikv)): no `tikv` package listed at all, on any architecture.
- **RISE Python wheel builder** ([gitlab.com project 56254198](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tikv/)): redirects to upstream PyPI (no custom riscv64 wheel built).

Since no distribution ships a `tikv` package at all - not even unpatched - the distribution floor described in the color-grading model does not apply here; this is a stronger negative than "patched/downstream-only."

**What a user must do today to get a working riscv64 binary:** there is no path. A user would need to build from source after independently resolving the toolchain gaps described in Section 5, with no existing recipe, CI validation, or prior art to build from.

## 9. Dependencies

| Dependency (as named) | Role in TiKV | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **RocksDB** | Primary LSM storage engine (via `tikv/rust-rocksdb`, embeds Titan blob engine) | Builds (Makefile `-march`/`-latomic` fixes merged v7.1.1-v8.10.0) | No upstream riscv64 CI runs tests (0/14 workflow files mention riscv) | Source-only for every arch; no prebuilt binaries | 4 open/stalled PRs (`#14536` Zbc CRC32C, `#14894` Zvbc vector CRC32C blocked on `#14536`+`#14530`, `#14604` RVV xxhash sync, `#14530` `-march`/LLD fix), stalled 4+ months on a CLA registration conflict; falls back to scalar CRC32C on riscv64 today |
| **gRPC** | RPC transport for all client/peer communication (via `grpcio`/`grpcio-sys`, wraps `grpc/grpc` C core, embeds BoringSSL) | Distro-built only; no upstream riscv64 CI (build or test) | No | No official riscv64 wheel ([grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591), open) | `grpc/grpc#37791` (stale abseil RDCYCLE SIGILL) closed; `#35839` (`__atomic_compare_exchange_1` undefined symbol) closed but root cause unfixed upstream, traces to open `abseil-cpp#1702`/`#2002` |
| **OpenSSL** | TLS for gRPC/PD client, encryption-at-rest, FIPS build path | Yes, dedicated `riscv-more-cross-compiles.yml` CI, 13 extension configs | Yes, but flaky (`#30880`, intermittent `test_lhash` failures on linux-riscv64 CI, open) | Yes, treated as first-class target, backported across 3.4/3.5/3.6/4.0/master | **Critical, unresolved**: AES T-table cache side-channel on riscv64 hardware lacking Zkn/Zvkned (fix PRs `#31080`/`#31082` still open mid-2026); also `#22166` (SSL test races, open since 2023), `#28118` (extension detection broken under musl) |
| **jemalloc** | Default production memory allocator (via `tikv-jemalloc-sys`/`tikv-jemallocator`, `ENABLE_FEATURES += jemalloc` on Linux release builds) | Compiles, no upstream jemalloc patches needed | No upstream riscv64 CI (x86_64/x86-32/arm64 only) | Source-only for all arches | `tikv/jemallocator#118` (**open**): build fails for `riscv64gc-unknown-linux-musl` (configure error "cannot find sources (Makefile.in)"); `tikv/jemallocator#36` (closed, fixed via `autogen.sh`); upstream `jemalloc/jemalloc#2323` "Add support for riscv64gc" closed/fixed |
| **Rust** | Language/toolchain; TiKV pins `nightly-2026-01-30` via `rust-toolchain.toml` | riscv64gc target appears usable in principle (the jemalloc-crate issues above specifically reference `riscv64gc-unknown-linux-gnu`/`-musl` triples, implying compiler target availability) | Not directly assessed | Not directly assessed | [NEEDS VERIFICATION]: exact Rust platform-support tier for `riscv64gc-unknown-linux-gnu`/`-musl` was not directly confirmed in this research |
| **LLVM** | Optional cross-compilation helper toolchain, per CONTRIBUTING.md ("targeting platforms other than x86_64/aarch64 Linux or macOS ... you'll also need llvm and clang") | Not independently assessed as a dependency in this research; riscv64 never explicitly named in TiKV's own docs for this purpose | N/A | N/A | No documented flags or known-good toolchain versions for riscv64 in TiKV's docs |
| mimalloc (optional allocator, `--features mimalloc`) | Alternate allocator | Compiles via generic C fallback | No CI | No release binary | **Correctness risk**: `#939`/`#1299` - SV39-vs-SV48/SV57 VA-range assumption causes segfaults when a binary built on one MMU config runs on another; build-time workaround merged Dec 2024, runtime `hwprobe` fix (`#1299`) still open/unmerged; same root cause in `#610`/`#640` |
| tcmalloc (optional allocator, `--features tcmalloc`) | Alternate allocator | riscv64 not listed in `docs/platforms.md` at all | No CI, no per-CPU RSEQ path | Source-only | No riscv64 issues/PRs exist - zero signal either way |
| snmalloc-rs (optional allocator, `--features snmalloc`) | Alternate allocator | Not researched (opt-in only, low priority) | - | - | - |
| Snappy (optional RocksDB codec, via `tikv/rust-snappy` fork wrapping `google/snappy`) | Block compression | Yes, dedicated `riscv64-qemu-test.yaml` CI | Yes, via QEMU (no native runner, no RVV coverage) | No official binaries; distro packages available | `google/snappy#209` (open, perf not correctness), RVV PRs `#233`/`#235` open unreviewed for months |
| zstd (optional RocksDB codec, `zstd-sys`) | Block compression | Yes, CI on PRs to dev/release only | Yes, via QEMU user-mode on x86-64 host, non-blocking | No official binaries; Debian/Ubuntu package | Two now-fixed correctness bugs: PR `#4525` (riscv64 silently used 32-bit code paths through v1.5.7, fixed 2025-12-02), PR `#4502` (`ZSTD_row_getRVVMask()` silent corruption, fixed 2025-09-30); open: `#4546`, `#4557` |
| LZ4 (optional RocksDB codec, `lz4-sys`) | Block compression | Yes, lowest-priority CI tier (grouped with MIPS/M68K/SPARC) | Via QEMU, non-blocking | No Linux prebuilt binaries for any arch | No correctness bugs open; several stalled RVV perf PRs (`#1633`, `#1678`, `#1686`, `#1739`, `#1734`, `#1738`) |
| zlib (optional RocksDB codec, `libz-sys`, also used via `flate2`) | Block compression | Yes, but only on OpenBSD in CI via QEMU - Linux riscv64 cross-compile CI absent even though ARM/AARCH64/PPC/S390X have it | No | No official binaries; distro packages available | One stalled perf PR (`#1099`, RVV Adler32, no maintainer response since Oct 2025) |
| bzip2 (optional RocksDB codec, `bzip2-sys`) | Block compression | No upstream CI at all for any non-x86 arch (not riscv64-specific) | No | No official binaries; Debian/Ubuntu package | `#56`, MR `!68` - general correctness issues affecting all architectures, not riscv64-targeted |
| crc32fast / crc64fast | Checksums for RocksDB/raft-engine record integrity | Yes, pure Rust with runtime CPU-feature dispatch and portable scalar fallback | N/A (crate builds anywhere Rust targets riscv64gc) | Ships as a normal crates.io crate | Zero riscv64 issues found - lowest-risk dependency in this graph |
| Protocol Buffers (TiKV uses `pingcap/rust-protobuf` fork + `protobuf` 3.7.2, not `protocolbuffers/protobuf` directly) | Wire format for `kvproto`/`tipb` | Not deep-dived; build-time `protoc` binary is packaged for riscv64 in Debian/Ubuntu | - | - | Low architectural risk (no SIMD/asm in the Rust codegen path) |

**Cross-cutting findings:**
1. **`-latomic`/`__atomic_*` linkage is a recurring, systemic riscv64 blocker**, not a one-off: it previously broke RocksDB (fixed), and currently breaks the gRPC Python wheel build (`grpc/grpc#35839`, unfixed upstream), tracing to an open abseil-cpp bug (`#1702`, open since Jul 2024) that gRPC's C core depends on transitively.
2. **Pattern: CLA/maintainer-attention stalls, not technical blockers.** RocksDB's entire stack of open riscv64 performance PRs (`#14530`/`#14536`/`#14604`/`#14894`) is blocked on an unresolved CLA registration plus unanswered maintainer pings, not on unsolved technical problems (benchmarks reportedly show a 16.9x CRC32C speedup on SG2044 hardware in the unmerged PR). The same shape (technically complete, unreviewed for months) recurs in Snappy, LZ4, zlib, and mimalloc.
3. **Correctness bugs a TiKV riscv64 port would inherit directly**: the OpenSSL AES T-table side-channel (encryption-at-rest / FIPS builds, open) and mimalloc's SV39-vs-SV48/SV57 VA-range segfault (relevant only if built with `--features mimalloc`).
4. **project-graph MCP tool failure**: the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research, so Ubuntu 26.04 riscv64 package-graph queries and transitive-dependency enumeration for this table could not be run via that tool. This is a tooling gap, not evidence of package absence, and should be re-run once the server is reachable.

## 10. Ecosystem Status

Not applicable. TiKV is a standalone distributed database consumed as a compiled server binary (via TiUP) or as a component inside TiDB, not as a library with a large dependent package ecosystem (no significant tree of npm/PyPI/Maven/Kubernetes-operator packages depends on TiKV that would separately need riscv64 enablement). Section omitted per instructions.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [tikv/jemallocator#118](https://github.com/tikv/jemallocator/issues/118) | Build fails for `riscv64gc-unknown-linux-musl` | Open | High (blocks musl riscv64 builds of TiKV's default allocator) | Configure step errors "cannot find sources (Makefile.in)"; reporter targeting a BananaPi BPI-F3 board; upstream jemalloc supports the target, the tikv wrapper's build script does not handle it |
| [tikv/jemallocator#36](https://github.com/tikv/jemallocator/issues/36) | Bundled configure script didn't recognize `riscv64gc` | Closed | N/A (fixed) | Fix: use jemalloc's `autogen.sh` instead of the pre-generated configure (referenced fix PR #40); opened 2022-08-29 |
| [openssl/openssl PR#31080](https://github.com/openssl/openssl/pull/31080) / [#31082](https://github.com/openssl/openssl/pull/31082) | AES T-table cache side-channel on riscv64 hardware lacking Zkn/Zvkned | Open | **Critical (correctness/security, dependency-level)** | Directly relevant to TiKV's encryption-at-rest and FIPS build modes |
| [openssl/openssl#30880](https://github.com/openssl/openssl/issues/30880) | Intermittent `test_lhash` failures on linux-riscv64 CI | Open | Medium (dependency-level, test flakiness) | |
| [grpc/grpc#35839](https://github.com/grpc/grpc/issues/35839) | `__atomic_compare_exchange_1` undefined symbol, needs `-latomic` | Closed (root cause unfixed upstream) | Medium (dependency-level) | Traces to open `abseil-cpp#1702` |
| [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) | `-latomic` linker failure on riscv64 | Open since Jul 2024 | Medium (dependency-level, blocks clean `grpcio-sys` builds) | |
| [abseil/abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002) | SEGFAULTs in hashtable/cord tests on Debian riscv64 | Open, no maintainer response | Medium (dependency-level) | |
| RocksDB PRs [#14530](https://github.com/facebook/rocksdb/pull/14530) / [#14536](https://github.com/facebook/rocksdb/pull/14536) / [#14894](https://github.com/facebook/rocksdb/pull/14894) / [#14604](https://github.com/facebook/rocksdb/pull/14604) | `-march`/LLD fix, Zbc CRC32C, Zvbc vector CRC32C, RVV xxhash sync | Open, stalled 4+ months | Medium-High (perf; blocks HW-accelerated CRC32C on riscv64) | Blocked on a CLA registration conflict; last maintainer ping 2026-08-08 unanswered |
| mimalloc issues [#939](https://github.com/microsoft/mimalloc/issues/939) / [#1299](https://github.com/microsoft/mimalloc/issues/1299) / #610 / #640 | SV39 vs SV48/SV57 VA-range segfault | Open (build-time workaround merged Dec 2024; runtime `hwprobe` fix `#1299` unmerged) | **High correctness risk**, only if TiKV built with `--features mimalloc` (non-default) | |
| [tikv/tikv#6639](https://github.com/tikv/tikv/issues/6639) | "Cannot compile TiKV on ARM64" | Historical context | N/A | Shows TiKV has had build problems even on its second-tier supported architecture; no riscv64 equivalent has ever been filed since no one has attempted it |
| N/A | Zero riscv/riscv64 issues, PRs, commits, or code references exist in `tikv/tikv` itself | Confirmed absence | N/A | This reflects "untested/unknown," not "known broken" - an absence-of-data finding, not a clean bill of health |

**Correctness bugs highlighted separately**: the OpenSSL AES T-table side-channel (crypto correctness/security, open, affects encryption-at-rest/FIPS) and the mimalloc SV39/SV48/SV57 segfault (correctness, opt-in allocator only) are the two concrete correctness risks a TiKV riscv64 build would inherit today from its dependency chain.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist. No riscv64 port has ever been proposed, so there is no recorded maintainer objection or discussion thread to cite.

**Technical blockers:** TiKV's own code requires no changes to support riscv64 (there is no architecture-specific code to port - Section 4). The blockers are entirely in the native dependency chain: RocksDB's CRC32C acceleration PRs are stalled (Section 9/11), the `-latomic` linkage problem recurs across gRPC/abseil-cpp, and jemalloc's musl-target build is broken (`tikv/jemallocator#118`, open). None of these require TiKV-authored engineering per se, but they do block a clean, fully-accelerated riscv64 build today.

**Organizational blockers:** TiKV's governance requires a 2/3-majority steering-committee vote for "Adoption of New Codebase" ([GOVERNANCE.md](https://github.com/tikv/community)), the category a new architecture port would plausibly fall under given the absence of a formal platform-tier policy. PingCAP holds 7 of 10 steering-committee seats, so acceptance depends heavily on PingCAP's own resourcing priority. The one PingCAP-authored public content found on RISC-V ("RISC-V and TiDB: Enhancing Performance with Custom ISAs") is speculative/conceptual marketing content with no actual benchmark data or port commitment - there is no evidence PingCAP has an active riscv64 initiative for TiKV.

**Acceptance probability:** given zero prior engagement - no tracking issue, no community discussion thread, no RISE Project involvement, and TiKV appearing in RISE's own `sw-ecosystem` backlog as "queued but not yet researched" with no color previously assigned - there is currently no organizational momentum toward a port. Landing one would require an external contributor to both do the engineering work and clear PingCAP's 2/3-majority governance bar.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI" case per Step 1 of the color model)
- **Release provider:** none
- **Optimization gap:** N/A - TiKV is not an optimization-purpose project (it is a general-purpose distributed database/storage service, not a library whose sole value proposition is out-performing a reference implementation via architecture-specific code); the Step 2 optimization modifier does not apply and is not reflected in the header.
- **Justification:** TiKV has no upstream riscv64 CI of any kind - the repository's only CI workflow, [`tikv-clippy-darwin.yml`](https://github.com/tikv/tikv/blob/master/.github/workflows/tikv-clippy-darwin.yml), runs a macOS-only clippy lint job on `amd64`/`arm64` runners, with no Linux job, no QEMU, and no riscv64 target anywhere. No riscv64 code, issues, PRs, or commits exist in the repo (confirmed by exhaustive GitHub search and a full-repo grep of master). No distribution ships a `tikv` package at all - not Ubuntu 26.04 resolute, not Arch Linux's dedicated RISC-V port, not GitHub Releases (which carry no binary assets for any architecture) - so the distribution floor that could otherwise lift a no-CI project to yellow does not apply here, since there is no package, patched or unpatched, to apply it to. There is no positive evidence of breakage (no crash reports, no documented failed build attempt), so red is not warranted; and the absence of riscv64 support is well-documented and exhaustively confirmed rather than an unknown-unknown, so grey is not warranted either. This places TiKV squarely in the base "no upstream riscv64 CI" row of the color model: **orange**.
- **Pending work that could change the grade:** none of it is TiKV-specific yet. At the dependency level, RocksDB's stalled CRC32C acceleration PRs (`#14530`/`#14536`/`#14604`/`#14894`) and OpenSSL's already-strong riscv64 CI posture (dedicated `riscv-more-cross-compiles.yml`, build+test) are the most relevant upstream signals that a future TiKV riscv64 effort could build on. Within RISE's own tracking, TiKV sits in the `riseproject-dev/sw-ecosystem` project queue as "queued but not yet researched" (`project-reports/.queue.yml`) - no RISE grading, funding, or runner allocation has occurred for TiKV to date. Any of the following would raise the grade: an upstream riscv64 CI job added to `tikv/tikv` (build-only would move this to yellow; build+test to blue; build+test+riscv64 release artifact to green), or a distro shipping an unpatched `tikv` package from vanilla source (yellow via the distribution floor).

## 14. Investment Analysis

RISE has not funded, tracked, or otherwise engaged with TiKV to date - it is listed only as an unresearched entry in RISE's own project queue, with no prior grading, no wheel-builder listing, no blog coverage, and no RISE runner usage found anywhere in this research. All investment below is therefore un-covered scope, not duplicated work.

### 14.1 Functional Enablement
Primary work is dependency-chain plumbing, not TiKV-authored architecture code (none is needed - Section 4 shows TiKV has no arch-specific code to port). Concretely: fix or track the `riscv64gc-unknown-linux-musl` jemalloc build failure (`tikv/jemallocator#118`), verify TiKV's Cargo build resolves cleanly against RocksDB/gRPC/OpenSSL on a riscv64 target end-to-end (never attempted per this research), and determine whether the aarch64-only Makefile accommodations (SSE-disable, outline-atomics) need a riscv64 analog.

### 14.2 Performance Optimization
No work is needed inside TiKV's own repository (it has no hand-tuned code path for any architecture beyond a couple of x86_64-only helpers). The real performance work is at the dependency layer: helping land RocksDB's stalled CRC32C PRs (`#14530`/`#14536`/`#14604`/`#14894`) and the RVV-acceleration PRs open against Snappy, zstd, LZ4, and zlib (Section 9) - none of which requires TiKV-side changes, but which would directly affect TiKV's default production performance profile once functional support exists.

### 14.3 CI/CD Infrastructure
Add a Linux riscv64 build-and-test job to TiKV's GitHub Actions (the current single workflow is macOS-lint-only, so this is a net-new job, not an extension of existing Linux CI). Given TiKV has zero current RISE engagement, RISE RISC-V Runners would be a natural fit to avoid standing up dedicated hardware.

### 14.4 Ecosystem Enablement
Not applicable / minimal - per Section 10, TiKV has no significant dependent package ecosystem of its own. The only adjacent consideration is whether TiUP (TiKV's binary distribution channel) would need separate riscv64 packaging work, which is outside the scope of the `tikv/tikv` repository and was not researched here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `tikv-jemalloc-sys`/`tikv-jemallocator` build for `riscv64gc-unknown-linux-musl` (or confirm glibc-only is sufficient) | Data not available: no effort estimate found in research; [NEEDS VERIFICATION] | TiKV/PingCAP or jemalloc-rs maintainers | High |
| Functional | End-to-end validate `cargo build --release` for TiKV against RocksDB/gRPC/OpenSSL on a riscv64gc target (first attempt ever) | Data not available: no prior attempt exists to size against | TiKV/PingCAP | Critical |
| Functional | Determine whether aarch64-only Makefile workarounds (SSE-disable, outline-atomics) need a riscv64 equivalent | Data not available | TiKV/PingCAP | Medium |
| Performance | Support landing RocksDB's stalled `#14530`/`#14536`/`#14604`/`#14894` (CRC32C/RVV acceleration) | Data not available: PRs are code-complete per research, blocked on CLA/review, not effort | RocksDB upstream (external to TiKV) | Medium |
| Security | Track/mitigate OpenSSL AES T-table side-channel (`#31080`/`#31082`) before enabling encryption-at-rest/FIPS on riscv64 | Data not available | OpenSSL upstream (external to TiKV) | High |
| CI/CD | Add a Linux riscv64 build+test GitHub Actions job to `tikv/tikv` | Data not available | TiKV/PingCAP | High |
| CI/CD | Evaluate RISE RISC-V Runners for the new job | Data not available | TiKV/PingCAP, RISE | Medium |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [tikv/tikv repository](https://github.com/tikv/tikv)
- [TiKV homepage](https://tikv.org/)
- [tikv-clippy-darwin.yml CI workflow](https://github.com/tikv/tikv/blob/master/.github/workflows/tikv-clippy-darwin.yml)
- [tikv/tikv CONTRIBUTING.md](https://github.com/tikv/tikv/blob/master/CONTRIBUTING.md)
- [tikv/community GOVERNANCE.md](https://github.com/tikv/community)
- [tikv/tikv issue search for riscv](https://github.com/tikv/tikv/issues)
- [tikv/tikv#15926 (ARM64 regression, false-positive match on "riscv64" search)](https://github.com/tikv/tikv/issues/15926)
- [tikv/tikv#6639 (Cannot compile TiKV on ARM64)](https://github.com/tikv/tikv/issues/6639)
- [tikv/jemallocator#118 (riscv64gc-unknown-linux-musl build failure, open)](https://github.com/tikv/jemallocator/issues/118)
- [tikv/jemallocator#36 (riscv64gc configure recognition, closed)](https://github.com/tikv/jemallocator/issues/36)
- [tikv/pprof-rs (added RISC-V support in v0.11.1, PR #169)](https://github.com/tikv/pprof-rs)
- [jemalloc/jemalloc#2323 (Add support for riscv64gc, closed)](https://github.com/jemalloc/jemalloc/issues/2323)
- [openssl/openssl PR #31080 (AES T-table side-channel fix)](https://github.com/openssl/openssl/pull/31080)
- [openssl/openssl PR #31082 (AES T-table side-channel fix)](https://github.com/openssl/openssl/pull/31082)
- [openssl/openssl#30880 (intermittent test_lhash failures on linux-riscv64)](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl#22166 (SSL test races at HARNESS_JOBS>=38)](https://github.com/openssl/openssl/issues/22166)
- [openssl/openssl#28118 (extension detection broken under musl)](https://github.com/openssl/openssl/issues/28118)
- [grpc/grpc#41591 (no official riscv64 PyPI wheel, open)](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc#37791 (SIGILL from stale abseil RDCYCLE, closed)](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc#35839 (__atomic_compare_exchange_1 undefined symbol, closed)](https://github.com/grpc/grpc/issues/35839)
- [abseil/abseil-cpp#1702 (-latomic linker failure, open since Jul 2024)](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp#2002 (SEGFAULTs in hashtable/cord tests on Debian riscv64, open)](https://github.com/abseil/abseil-cpp/issues/2002)
- [facebook/rocksdb PR #14530 (-march/LLD fix, open)](https://github.com/facebook/rocksdb/pull/14530)
- [facebook/rocksdb PR #14536 (Zbc CRC32C, open)](https://github.com/facebook/rocksdb/pull/14536)
- [facebook/rocksdb PR #14894 (Zvbc vector CRC32C, open)](https://github.com/facebook/rocksdb/pull/14894)
- [facebook/rocksdb PR #14604 (RVV xxhash sync, open)](https://github.com/facebook/rocksdb/pull/14604)
- [google/snappy#209 (FindMatchLength scalar path on RISC-V, open)](https://github.com/google/snappy/issues/209)
- [google/snappy PR #220 (partial fix)](https://github.com/google/snappy/pull/220)
- [zstd PR #4525 (riscv64 not recognized as __64BIT__, fixed 2025-12-02)](https://github.com/facebook/zstd/pull/4525)
- [zstd PR #4502 (ZSTD_row_getRVVMask silent corruption, fixed 2025-09-30)](https://github.com/facebook/zstd/pull/4502)
- [zstd#4546 (RVV unaligned-access check, open)](https://github.com/facebook/zstd/issues/4546)
- [zstd#4557 (RISC-V sequence-decoding path, open)](https://github.com/facebook/zstd/issues/4557)
- [zlib PR #1099 (RVV-optimized Adler32, stalled)](https://github.com/madler/zlib/pull/1099)
- [microsoft/mimalloc#939 (SV39 VA-range segfault, open)](https://github.com/microsoft/mimalloc/issues/939)
- [microsoft/mimalloc#1299 (runtime hwprobe fix, open)](https://github.com/microsoft/mimalloc/issues/1299)
- [PyPI tikv package (unrelated placeholder)](https://pypi.org/pypi/tikv/json)
- [Ubuntu 26.04 resolute package search for TiKV](https://packages.ubuntu.com/search?keywords=TiKV&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=tikv)
- [RISE wheel builder simple index for tikv](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev/sw-ecosystem project queue (TiKV listed as queued, not yet researched)](https://github.com/riseproject-dev)
- [PingCAP: RISC-V and TiDB, Enhancing Performance with Custom ISAs (speculative, no benchmark data)](https://www.pingcap.com/article/risc-v-and-tidb-enhancing-performance-with-custom-isas/)
- [PingCAP: Porting TiDB to Arm64 for Greater Flexibility](https://www.pingcap.com/article)