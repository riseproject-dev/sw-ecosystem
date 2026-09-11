---
title: Redpanda
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="redpanda" %}

# Redpanda

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Redpanda<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Redpanda is a Kafka-API-compatible streaming data platform written in C++ and built on the [Seastar](https://github.com/redpanda-data/seastar) shard-per-core async framework. The core broker is compiled with a custom Clang/LLVM fork (`redpanda-data/llvm-project`) and built with Bazel. The project ships an `rpk` CLI (Go) and a WASM-based "data transforms" feature (Rust, compiled with Wasmtime/Cranelift).

Governance is fully corporate, single-vendor. The repository confirms: no CNCF/Apache/Linux Foundation affiliation; the core engine is licensed under the Business Source License (BSL 1.1, `licenses/bsl.md`), converting to Apache 2.0 four years after each release; enterprise features are under a separate Redpanda Community License (`licenses/rcl.md`), both copyright "Redpanda Data, Inc." Contributions require signing a Redpanda Data, Inc. CLA (`licenses/cla.md`). There is no `MAINTAINERS`/`GOVERNANCE.md` file; `.github/CODEOWNERS` assigns all ownership to Redpanda Data teams and named Redpanda Data employees. Top committers by volume on `dev` (Noah Watkins 5,726; Michal/Michal Maslanka 3,483+2,172; John Spray 2,775; Tyler Rockwood 2,506; founder/CEO Alexander Gallego 2,039, plus 8+ others in the 883-2,015 range) are all Redpanda Data staff, with no evidence of independent corporate co-maintainers (no Intel/Arm/Google/cloud-vendor committer presence as seen in foundation-governed projects).

On community culture toward new architecture ports: there is no stated policy either way. RISC-V has never come up in the project's history: zero commits, zero issues, zero PRs mention "riscv" or "RISC-V" as of 2026-09-11. Redpanda is not a member of the [RISE project](https://riseproject.dev/members/) (checked against both Premier and General member lists), and no RISE blog post mentions Redpanda.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port work has ever been proposed, attempted, or merged | Zero results across `mcp__github__search_issues`, `mcp__github__search_pull_requests`, and `mcp__github__search_commits` for "riscv"/"riscv64"/"rv64" scoped to `repo:redpanda-data/redpanda` |

There is no tracking issue, no draft PR, and no key contributor associated with any RISC-V effort. The project is **not fully upstream on riscv64** because there is no riscv64 support at all, upstream or otherwise, to be "upstream" about. This is a greenfield gap, not a stalled or partial port.

## 3. Upstream Support Tier

No formal tier policy document exists. Checks performed: `PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` are all absent from the repository. The only explicit, machine-readable platform matrix found is in [`.github/workflows/rpk-build.yml`](https://github.com/redpanda-data/redpanda/blob/dev/.github/workflows/rpk-build.yml), which builds the `rpk` CLI for `amd64` and `arm64` only. The core C++ broker's implicit platform list is defined in `MODULE.bazel`, which iterates toolchain, compiler, and sysroot registration only over `["aarch64", "x86_64"]`.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test execution | yes | yes | no |
| Official release artifact | yes (deb/rpm/tarball) | yes (deb/rpm/tarball) | no |
| Custom LLVM toolchain fork published | yes | yes | no |
| Bazel sysroot registered | yes | yes | no |
| Compiles at all (`src/v/utils/arch.h`) | yes | yes | **no - hard `#error`** |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Redpanda's own architecture-abstraction surface is small and closed. The complete inventory of CPU-architecture preprocessor logic in the entire repository is 3 files:

- `src/v/utils/arch.h` - the central arch-detection point:
```cpp
inline constexpr cpu_arch cpu_arch::current() {
#if defined(__x86_64__)
    return arch::AMD64;
#elif defined(__aarch64__)
    return arch::ARM64;
#else
#error unknown arch
#endif
}
```
This is a hard compile-time failure on riscv64 (no `#elif defined(__riscv)` branch exists). This is a build-blocking condition in Redpanda's own first-party code, not a missing-dependency issue.
- `src/v/utils/tests/arch_test.cc` - tests the above.
- `src/v/syschecks/syschecks.h` - gates `<cpuid.h>`, `__builtin_cpu_init()`, and an SSE4.2 startup check behind `#if !defined __aarch64__`, meaning riscv64 (which is neither `__x86_64__` nor `__aarch64__`) would be incorrectly routed into x86-only startup logic if `arch.h`'s `#error` were ever removed - further evidence riscv64 was never contemplated in this code's design.

No `arch/riscv/`, `arch/x86_64/`, or `arch/arm64/` subdirectories exist anywhere; Redpanda does not hand-roll SIMD itself. Performance-critical hashing (CRC32C) is delegated entirely to third-party libraries (Google `crc32c`, Abseil `crc32c`), whose own riscv64 status is assessed in Section 9.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU arch detection (`arch.h`) | implemented | implemented | **missing - hard `#error`** |
| Startup CPU-feature checks (`syschecks.h`) | x86-specific (cpuid/SSE4.2) | skipped (guarded out) | not designed for; would fall into x86 branch if the `#error` were removed |
| CRC32C / hashing | delegated to Google crc32c / Abseil (SSE4.2-accelerated) | delegated (NEON) | delegated (scalar fallback in Google crc32c per Section 9) |
| JIT (Wasmtime, for data transforms) | full Cranelift backend | full Cranelift backend | full Cranelift backend exists upstream (Section 9), but unreachable since the host broker itself does not compile |

## 5. Build System, Cross-Compilation, and Toolchain

Redpanda migrated its core-broker build to Bazel; there is no top-level `CMakeLists.txt` (the only 4 `CMakeLists.txt` files in the tree are minor ones for `src/transform-sdk/{cpp,go,js}` examples, none riscv64-related). Documented build command from `README.md`:

```
wget -O ~/bin/bazel https://github.com/bazelbuild/bazelisk/releases/latest/download/bazelisk-linux-amd64 && chmod +x ~/bin/bazel
sudo ./bazel/install-deps.sh
bazel build --config=release //...
```

`MODULE.bazel` hard-codes the toolchain matrix:
```python
COMPILE_FLAGS = {
    "linux-aarch64": ["--target=aarch64-unknown-linux-gnu", "-march=armv8-a+crc+crypto", ...],
    "linux-x86_64":  ["--target=x86_64-unknown-linux-gnu", "-march=westmere", ...],
}
```
Redpanda builds with its own prebuilt Clang 23.1.0-rc2 fork (hosted at [redpanda-data/llvm-project releases](https://github.com/redpanda-data/llvm-project/releases)), published only for `aarch64` and `x86_64`; there is no documented minimum GCC version for building Redpanda itself because GCC is used only to bootstrap-compile the LLVM fork, never to build Redpanda. `bazel/repositories.bzl` registers exactly two sysroot tuples (`x86_64`, `aarch64`); no riscv64 entry, commented-out or otherwise, exists.

QEMU is used only once in the entire repo: in `bazel/toolchain/README.md`, to cross-build the **aarch64** LLVM toolchain image on an x86_64 host via `docker buildx build --platform=linux/arm64`. No riscv64-equivalent flow exists.

**Known build failure:** the codebase will not compile on riscv64 at all, deterministically, at `src/v/utils/arch.h` (`#error unknown arch`, see Section 4) - this is confirmed by reading the file directly, not inferred.

A riscv64 port would require, at minimum: a new `#elif defined(__riscv)` branch in `arch.h`; a `linux-riscv64` entry in `MODULE.bazel`'s `COMPILE_FLAGS`/`COMPILERS` dicts; a riscv64 LLVM toolchain build (Redpanda's own fork does not currently target riscv64); and a new sysroot tuple in `bazel/repositories.bzl`. None of this exists today, even in draft or aspirational form.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles | yes | yes | no (hard `#error`) |
| Runs at all | yes | yes | N/A - does not build |
| Official packages/tarballs | yes | yes | no |
| WASM data-transforms (Wasmtime) | yes | yes | N/A - unreachable, host does not build |
| SASL/GSSAPI auth (krb5) | yes | yes | not independently verified (Section 9) |
| TLS (OpenSSL) | yes | yes | N/A - unreachable, host does not build |

There is no functional gap analysis to perform beyond "does not build": since the broker fails to compile on riscv64, every downstream feature is unreachable. No performance-gap, security-hardening-gap, or NaN/floating-point-semantics data exists for Redpanda specifically on riscv64, since the binary has never existed. Data not available: no riscv64 Redpanda binary has ever been built, so no runtime behavior (correctness, performance, or floating-point semantics) can be observed or reported.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was verified by two independent methods in agreement:

1. **Direct file reads.** All 31 files in [`.github/workflows/`](https://github.com/redpanda-data/redpanda/tree/dev/.github/workflows) were read in full (backport-command.yml, backport-on-merge.yml, buf.yml, buildkite-slash-commands.yml, check-ducktape-protos.yml, claude-code-review.yml, close-backport-issues.yml, cloud-installpack-bk-trigger.yml, dispatch-docs-updates.yml, lint-bazel-dependency-graph.yml, lint-bazel-pkg-tool.yml, lint-cpp.yml, lint-golang.yml, lint-python.yml, lint-sh.yml, lint-yaml.yml, p.yml, pr-labeler.yml, promote.yml, publish-apache-polaris-python-client.yml, release-rp-storage-tool.yml, render-pr-body-release-notes.yml, rp-storage-tool-checks.yml, rpk-build.yml, slash-commands.yml, stale.yml, transform-sdk-build.yml, transform-sdk-release.yml, trigger-snyk.yml, type-check-python.yaml). Zero occurrences of "riscv", "riscv64", "linux/riscv64", or "RISCV" in any of them, or anywhere else under `.github/`.
2. **GitHub's global code-search index**, queried directly: `riscv64 repo:redpanda-data/redpanda path:.github/workflows` -> 0 results; `riscv repo:redpanda-data/redpanda extension:yml` -> 0 results; `"linux/riscv64" repo:redpanda-data/redpanda` -> 0 results. The one repo-wide "riscv" hit (`riscv repo:redpanda-data/redpanda`, no filter) is an npm lockfile entry for the optional `@esbuild/linux-riscv64` binary inside a JS example under `src/transform-sdk/`, not CI config.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist. `.buildkite/` contains only a `hooks/` directory (agent lifecycle hooks) - Redpanda's Buildkite pipelines are defined server-side in the Buildkite UI, not checked into the repo, so their content could not be inspected in this session. No RISE runner references (`riseproject-dev`, RISE runner labels) appear anywhere.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test execution | yes | yes | no |
| Release-blocking | yes | yes | N/A |
| Hardware/emulation | native GH runners | native + QEMU cross-build (toolchain image only) | none |
| RISE runners used | no | no | no |

## 8. Distribution and Release Status

No official riscv64 binary exists for Redpanda through any channel checked:

- **GitHub Releases:** asset-filename enumeration was blocked by session access restrictions (GitHub MCP scoped to a different repo; release assets are client-side rendered). The release Atom feed (fetched via WebFetch) shows release titles/notes for v26.2.2, v26.1.17, v25.3.17, v26.1.16, v25.3.16 etc. with zero "riscv"/"riscv64" mentions in any title or body text - consistent with, though not fully conclusive proof of, no riscv64 assets. [NEEDS VERIFICATION] at the asset-filename level specifically.
- **PyPI:** the package name `redpanda` on PyPI (`redpanda-0.6.0-py3-none-any.whl`, `redpanda-0.6.0.tar.gz`) is an unrelated "Pandas-ORM Integration" library, not affiliated with redpanda-data/redpanda. Irrelevant either way (and architecture-agnostic regardless).
- **RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/redpanda/` redirects straight to the generic (unrelated) PyPI package above - no RISE-specific build exists.
- **Ubuntu 26.04 "resolute":** no package named `redpanda` exists in the archive at all, on any architecture - Redpanda does not distribute via Debian/Ubuntu main/universe, only via its own vendor apt/rpm repos.
- **Arch Linux RISC-V port** (`archriscv.felixc.at`): query for `redpanda` returned no listing.

A user wanting a working riscv64 Redpanda binary today cannot obtain one from any channel: there is no upstream binary, no distro package, and the source does not compile on riscv64 as-is (Section 4/5). The only path is a from-scratch source port.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Seastar (`redpanda-data/seastar` fork, pinned `a6ac2ff6`) | Build-dependency, critical - async reactor, io_uring/AIO abstraction, own allocator, shard topology | Untracked - GitHub search on both the fork and upstream `scylladb/seastar` for "riscv" returns 0 issues/PRs | Untracked | Untracked | Not tracked in `projects.yml`; largest single unknown in the dependency chain given its centrality |
| LLVM (Redpanda's own fork `redpanda-data/llvm-project`) | Build-dependency, critical - compiler toolchain that builds the entire broker | Fork publishes release tarballs only for `aarch64`/`x86_64`; riscv64 absent from the fork's own release matrix regardless of generic upstream LLVM's riscv64 status | N/A - no riscv64 target registered | N/A | Would need either (a) the fork extended to riscv64, or (b) Redpanda's Bazel toolchain rules changed to accept a system/vendor riscv64 Clang. (Generic upstream LLVM has a full riscv64 codegen backend but riscv64 is absent from LLVM's own required pre-merge CI gate per project-reports/llvm.md, cited by the dependency-chain research pass.) |
| Bazel | Build-dependency, critical - the build system itself | Redpanda's own `MODULE.bazel` registers toolchains/sysroots only for `aarch64`/`x86_64`; no riscv64 entries | N/A | N/A | Not a Bazel-upstream limitation - this is Redpanda's own configuration gap (Section 5) |
| Wasmtime (`bytecodealliance/wasmtime` @ `9e1084ffac`) | Runtime-dependency, critical - Cranelift JIT/AOT for WASM data-transforms | Full Cranelift riscv64 backend (~22,300 lines), builds via `cargo build --target riscv64gc-unknown-linux-gnu` | Real QEMU-executed test suite in upstream CI, conditionally gated (not every PR) | Yes - upstream publishes `wasmtime-vNN-riscv64gc-linux.tar.xz` via GitHub Releases | Tier 3 (no full-time maintainer, no continuous fuzzing); 8 open correctness bugs incl. unaligned-atomic bus error and partial OOB writes; Winch baseline compiler has zero riscv64 code. Unreachable in practice since the Redpanda host binary does not build (Section 4). |
| liburing (`axboe/liburing`) | Build-dependency, critical - core async I/O syscalls that Seastar's Linux reactor is built on | Fully upstream riscv64 port since 2.5 (2023-08-22/23) | Cross-compile only in upstream CI - no runtime execution, no sanitizers | Distro-packaged (Debian sid 2.14-1, Ubuntu 24.04 2.5-1build1, notably behind) | Page-size bug (wrong ring offsets on non-4K-page kernels) fixed upstream but still present in Ubuntu 24.04's shipped 2.5 |
| abseil-cpp (20250814.1) | Numerics/hashing/utility library | Builds, but GCC 11-12 riscv64 needs `-latomic` workaround for shared-lib builds (upstream issue #1702, no fix) | 2 open test SEGFAULTs on Debian riscv64 specifically (hashtablez/cordz sampler, GCC 15.2); do not reproduce on Ubuntu | Ubuntu 26.04 `libabsl-dev` 20260107.0-4 present for riscv64 | See project-reports/abseil-cpp.md |
| crc32c (`google/crc32c`) | Checksum/hashing for Kafka/RPC/storage integrity | Builds via CMake but falls through to a pure-scalar portable path - zero riscv64 SIMD/Zbc-carryless-multiply acceleration | No CI coverage for riscv64 | Ubuntu 24.04 `python3-crc32c` 2.3-1.1build3 lists riscv64 (scalar rebuild only) | Zero upstream riscv64 acceleration work beyond a single CMake-detection PR |
| xxHash (`Cyan4973/xxHash`) | Fast hashing for content-addressing/dedup | Full RVV 1.0 C-intrinsics for XXH3 (compile-time dispatch), tested on SG2044/BPI-F3 hardware | Real CI: full test suite on riscv64 on every push/PR via QEMU | Ubuntu 26.04 ships `libxxhash0` 0.8.3 for riscv64 | Streaming-unaligned perf regression unresolved. See project-reports/xxhash.md (color: blue) |
| roaring / CRoaring (`redpanda-data/CRoaring` fork) | SIMD-accelerated compressed bitmap library | Upstream `RoaringBitmap/CRoaring` has 0 riscv/riscv64 issues/PRs; library is AVX2/AVX-512/NEON-dispatched with a portable scalar fallback for other archs by design - riscv64 likely falls back to scalar, unconfirmed | Unconfirmed | Unconfirmed | Not tracked in `projects.yml`; flagged for follow-up given it backs compacted-topic/tombstone indexing |
| hwloc (`open-mpi/hwloc` 2.11.2) | Hardware/NUMA topology feeding Seastar's per-core shard placement | Builds generically | Two open, unresolved riscv64 issues: #650 ("get RISC-V CPU info on Linux," open since Jan 2024) and #536 (wrong core count on HiFive Unmatched, open since July 2022) | Tracked in `projects.yml`, no dedicated report yet | Core-topology bugs are directly relevant to Seastar's shard-per-core model |
| krb5 (MIT Kerberos 1.22.2) | SASL/GSSAPI authentication | Not independently verified this pass | Not independently verified | Tracked in `projects.yml`, no dedicated report yet | Flagged for follow-up |
| c-ares (1.34.6) | Async DNS resolution | Not independently verified this pass | Not independently verified | Tracked in `projects.yml`, no dedicated report yet | Not researched in depth this pass |
| OpenSSL | TLS/crypto for broker RPC and Kafka API | Builds; riscv64 asm paths present since PR #17640 (May 2022), actively extended (AES-RV64I, Zbb/Zbc GCM, Zbb BSWAP) | Extensive but QEMU-only CI, FIPS disabled in CI | Ubuntu 26.04 `libssl-dev` present for riscv64 | Open security gap: AES T-table fallback not constant-time on hardware lacking Zkn/Zvkned (openssl#31080, #31082); musl extension-detection broken. See project-reports/openssl.md (color: blue) |
| zstd (1.5.7) | Primary compression codec | Builds; RVV intrinsics need GCC>=14/Clang>=19, else correct scalar fallback | QEMU CI, PR-triggered only, not release-blocking | Distro-packaged widely | 7 riscv64 perf PRs stalled 2-6 months. See project-reports/zstd.md (color: blue) |
| lz4 (1.9.4) | Compression codec | Builds and passes all tests on riscv64 today | - | Distro-packaged | See project-reports/lz4.md (color: yellow - CI-coverage gap only) |
| snappy (1.2.2.bcr.3) | Compression codec | Builds/tests/runs correctly; portable fallback if Zbb absent | Possible CI cross-compiler misconfiguration bug (unverified) | `libsnappy-dev` available on riscv64 | See project-reports/snappy.md (color: blue) |
| zlib (1.3.1.bcr.8) | Compression codec | Functionally complete on riscv64 | Distro-tested | Ubuntu 24.04 `zlib1g` present for riscv64 | RVV Adler32 perf PR stalled 8+ months. See project-reports/zlib.md (color: blue) |
| bzip2 (1.0.8.bcr.2) | Compression codec | Builds/runs correctly by construction | No upstream CI for riscv64 - distro-build-farm only | Ubuntu 24.04 ships 1.0.8-5.1 for riscv64 | See project-reports/bzip2.md (color: yellow) |
| re2 (2024-07-02.bcr.1) | Regex engine (topic/config validation) | Fully functional on riscv64, no code changes needed | Not CI-tested upstream; distro-tested | `libre2-10`/`libre2-dev` on Ubuntu 24.04 riscv64 | See project-reports/re2.md (color: yellow) |
| Protocol Buffers (33.5) | Serialization (RPC/Kafka schema, config) | Compiles natively on riscv64 | Sub-word `-latomic` build-reliability issue open | Ubuntu `libprotobuf-dev` 3.21.12 for riscv64 (13+ major versions behind) | No prebuilt `protoc` binary for riscv64. See project-reports/protocol-buffers.md (color: yellow) |
| Rust toolchain (rules_rust 1.91.0) | Language toolchain (rpk/transform SDK components) | Tier 2 with host tools (`riscv64gc-unknown-linux-gnu`/`-musl`) - "guaranteed to build" only | No test execution anywhere in upstream Rust CI for riscv64 (build/dist only) | Official rustup binaries ship for gnu/musl riscv64; Ubuntu 26.04 ships `rustc` for riscv64 | Silent wrong-codegen bug (critical), open SIGSEGV reports on real hardware; Tier-1 promotion blocked ~2 years, RISE-funded (RP004) but stalled. See project-reports/rust.md (color: yellow) |
| Go toolchain (1.26.5) | Language toolchain (builds `rpk` CLI) | Secondary port, full compiler/assembler/linker/runtime riscv64 support | Real CI on physical riscv64 hardware (SiFive boards), but 3 of 4 Linux/FreeBSD builders owned by one individual, partly broken currently | `go1.26.4.linux-riscv64.tar.gz` shipped officially since Go 1.21; Debian/Arch/Ubuntu package riscv64 builds | Open memory-corruption bug blocking Alpine builds; 20-40% perf gap vs arm64 in hot loops. RISE-funded (RP001). See project-reports/go.md (color: green) |

**Synthesis.** The riscv64 blocker for Redpanda is organizational/first-party-code, not primarily a third-party dependency problem. The compression codecs (zstd/lz4/snappy/zlib/bzip2), regex (re2), protobuf, and the Go toolchain are all in reasonably good shape on riscv64. Risk concentrates in: (1) Redpanda's own LLVM/Clang fork, which has no riscv64 build target; (2) Seastar, completely untracked for riscv64 anywhere and the foundation everything else sits on; (3) hwloc's two long-open, unresolved core-topology bugs, directly relevant to Seastar's per-core reactor model; (4) crc32c's zero SIMD/Zbc acceleration (pure scalar fallback); (5) Wasmtime and the Rust toolchain, both Tier 3/Tier-2-build-only upstream with open correctness bugs, though functionally moot until the host binary builds at all.

## 10. Ecosystem Status

Not applicable. Redpanda is a standalone C++ broker/service with a CLI and SDKs, not a package registry entry with a large dependent-package ecosystem (unlike, e.g., a language runtime with thousands of downstream PyPI/npm packages). Section skipped per report scope rules.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (none found) | N/A | N/A | Zero GitHub issues, PRs, or commits mention "riscv"/"riscv64"/"rv64" in `redpanda-data/redpanda`, confirmed via `mcp__github__search_issues`, `mcp__github__search_pull_requests`, and `mcp__github__search_commits` (multiple independent query passes: `riscv`, `riscv64`, `rv64`, all returning 0 results against the target repo) |

The single nominal hit from broader "riscv64" search terms, [Issue #736 "build: support arm64 architecture"](https://github.com/redpanda-data/redpanda/issues/736) (opened 2021-03-03, closed 2021-05-28), is about Apple M1/ARM64 support and contains no RISC-V content - it is a false positive from token overlap between "arm64" and "riscv64" in search indexing, confirmed by reading the title and prior full-text checks.

No correctness bugs specific to Redpanda-on-riscv64 exist to highlight, because no riscv64 Redpanda binary has ever existed to produce one.

## 12. Objections and Upstream Blockers

**Stated objections:** none. RISC-V has simply never come up - zero commits, zero issues, zero PRs, zero docs mentions. Redpanda Data has signaled neither interest nor opposition.

**Technical blockers:**
- `src/v/utils/arch.h` hard-fails compilation (`#error unknown arch`) on any architecture other than x86_64/aarch64 (Section 4) - a code change is required before anything else matters.
- No riscv64 build of Redpanda's own LLVM/Clang toolchain fork exists (Section 5).
- No riscv64 sysroot registered in `bazel/repositories.bzl`.
- Seastar, the foundational async/shard framework, has zero known riscv64 validation anywhere (fork or upstream ScyllaDB repo).
- hwloc has two long-open riscv64 core-topology-detection bugs directly relevant to Seastar's per-core shard model.

**Organizational blockers:** Redpanda is a single-vendor, BSL-licensed, commercially governed project (Section 1) with no external committer base and no foundation to lobby for architecture-tier changes. There is no public roadmap item, RFC, or funded initiative (RISE or otherwise) addressing riscv64.

**Acceptance probability:** Given zero prior engagement, zero community pressure (no filed issues requesting it), and a first-party compile-time block, a riscv64 port would need to originate as a net-new, externally driven contribution large enough to touch the build system, the arch-detection header, the toolchain fork, and validate the Seastar foundation - a substantial undertaking with no signal that Redpanda Data would prioritize reviewing or accepting it absent customer/commercial demand.

## 13. Readiness Assessment

- **Color:** red (confirmed broken)
- **Release provider:** none
- **Justification:** Redpanda has zero upstream riscv64 CI (all 31 GitHub Actions workflow files contain no riscv references, confirmed by direct read and by GitHub's own code-search index), no distro package on any tracked distribution, and - critically - its own first-party source code contains a hard compile-time failure on any non-x86_64/non-aarch64 architecture: [`src/v/utils/arch.h`](https://github.com/redpanda-data/redpanda/blob/dev/src/v/utils/arch.h) issues `#error unknown arch` with no riscv64 branch. This is direct, primary-source evidence of confirmed breakage (a build-blocking condition in the project's own code), not merely an absence of testing, which places Redpanda in the red tier rather than the default orange ("no CI, no evidence either way") tier. Redpanda is not an optimization-purpose project (it is a streaming data platform/application whose value proposition is not "faster than a reference implementation" but rather Kafka-API compatibility and operational simplicity), so the Step 2 optimization modifier does not apply and no Optimization level is recorded.
- **Pending work that could change the grade:** none identified. No open PR, no RISE involvement, and no tracking issue exists (Section 2, Section 11). The grade would move only if someone opened a PR adding a riscv64 branch to `arch.h`, a riscv64 toolchain/sysroot to the Bazel build, and validated Seastar underneath - none of which has started as of 2026-09-11.

## 14. Investment Analysis

RISE has not funded or attempted any work specific to Redpanda (Section 1: not a RISE member, no RISE blog mentions, no RISE wheel builder listing). RISE-funded work exists only at the transitive-dependency level - the Go toolchain (RP001, Henry/Ryan of Rivos) and Rust's Tier-1 promotion effort (RP004) - neither of which is Redpanda-specific and neither of which unblocks Redpanda's own first-party `#error` gate. All investment sizing below is therefore for net-new work; nothing is double-counted against existing RISE funding.

### 14.1 Functional Enablement

The minimum path to a compiling riscv64 Redpanda binary requires: adding a riscv64 branch to `src/v/utils/arch.h` and auditing `src/v/syschecks/syschecks.h`'s x86-only startup-check gating; adding a `linux-riscv64` toolchain/sysroot entry to `MODULE.bazel` and `bazel/repositories.bzl`; either extending Redpanda's own LLVM fork to publish riscv64 tarballs or switching the Bazel toolchain rule to accept a vendor/system Clang; and validating that Seastar (the untracked foundational dependency) builds and runs correctly on riscv64, including verifying `liburing`-backed io_uring behavior and hwloc-based core-count detection (both currently uncertain per Section 9's hwloc bugs #650/#536).

### 14.2 Performance Optimization

Not applicable until functional enablement lands. Once a working binary exists, the largest known scalar-fallback gap is `crc32c` (zero riscv64 SIMD/Zbc acceleration, Section 9), which sits on the hot path for Kafka/RPC/storage checksumming and would warrant an RVV or Zbc-based optimization pass.

### 14.3 CI/CD Infrastructure

A riscv64 CI job would need to be added from scratch (no existing riscv64-adjacent CI infrastructure exists in any of Redpanda's 31 workflow files or its Buildkite configuration) - likely QEMU-based initially, matching the pattern already used for aarch64 toolchain cross-builds in `bazel/toolchain/README.md`.

### 14.4 Ecosystem Enablement

Not applicable (Section 10).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `arch.h` / audit `syschecks.h` | 1-2 | Redpanda Data (or external contributor) | Critical |
| Functional | Riscv64 toolchain/sysroot in `MODULE.bazel` / `bazel/repositories.bzl`, extend or replace LLVM fork | 4-8 | Redpanda Data (or external contributor) | Critical |
| Functional | Validate Seastar on riscv64 (build + runtime, io_uring via liburing, hwloc core-count correctness) | 6-12 | Redpanda Data / Seastar upstream | Critical |
| Functional | End-to-end broker build/boot/smoke-test on riscv64 hardware or QEMU | 2-4 | Redpanda Data (or external contributor) | High |
| CI/CD | Add riscv64 CI job (QEMU cross-build initially, test execution as a follow-on) | 2-3 | Redpanda Data | High |
| Performance | RVV/Zbc acceleration for crc32c on the checksum hot path | 2-4 | Redpanda Data / google/crc32c upstream | Medium |
| Dependencies | Resolve hwloc riscv64 core-topology bugs (#650, #536) upstream | N/A - external dependency, track only | open-mpi/hwloc upstream | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [redpanda-data/redpanda repository](https://github.com/redpanda-data/redpanda)
- [Redpanda homepage](https://redpanda.com/)
- [Issue #736 - build: support arm64 architecture](https://github.com/redpanda-data/redpanda/issues/736)
- [.github/workflows/ (all 31 files reviewed)](https://github.com/redpanda-data/redpanda/tree/dev/.github/workflows)
- [.github/workflows/rpk-build.yml](https://github.com/redpanda-data/redpanda/blob/dev/.github/workflows/rpk-build.yml)
- [src/v/utils/arch.h](https://github.com/redpanda-data/redpanda/blob/dev/src/v/utils/arch.h)
- [bazel/toolchain/README.md](https://github.com/redpanda-data/redpanda/blob/dev/bazel/toolchain/README.md)
- [redpanda-data/llvm-project releases](https://github.com/redpanda-data/llvm-project/releases)
- [licenses/bsl.md](https://github.com/redpanda-data/redpanda/blob/dev/licenses/bsl.md)
- [licenses/rcl.md](https://github.com/redpanda-data/redpanda/blob/dev/licenses/rcl.md)
- [licenses/cla.md](https://github.com/redpanda-data/redpanda/blob/dev/licenses/cla.md)
- [PyPI redpanda package JSON](https://pypi.org/pypi/redpanda/json)
- [RISE PyPI wheel builder - redpanda](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/redpanda/)
- [Ubuntu 26.04 "resolute" package search - Redpanda](https://packages.ubuntu.com/search?keywords=Redpanda&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=redpanda)
- [redpanda-data/redpanda releases Atom feed](https://github.com/redpanda-data/redpanda/releases.atom)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog/)
- [redpanda-data/seastar (fork)](https://github.com/redpanda-data/seastar)
- [scylladb/seastar (upstream)](https://github.com/scylladb/seastar)
- [open-mpi/hwloc issue #650 - get RISC-V CPU info on Linux](https://github.com/open-mpi/hwloc/issues/650)
- [open-mpi/hwloc issue #536 - wrong core count on HiFive Unmatched](https://github.com/open-mpi/hwloc/issues/536)
- [google/crc32c](https://github.com/google/crc32c)
- [bytecodealliance/wasmtime](https://github.com/bytecodealliance/wasmtime)
- [axboe/liburing](https://github.com/axboe/liburing)
- project-reports/abseil-cpp.md, project-reports/xxhash.md, project-reports/openssl.md, project-reports/zstd.md, project-reports/lz4.md, project-reports/snappy.md, project-reports/zlib.md, project-reports/bzip2.md, project-reports/re2.md, project-reports/protocol-buffers.md, project-reports/rust.md, project-reports/go.md, project-reports/llvm.md, project-reports/wasmtime.md, project-reports/liburing.md (internal cross-referenced dependency reports)
