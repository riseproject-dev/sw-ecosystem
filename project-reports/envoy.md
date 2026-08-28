---
title: Envoy
categories:
  - containers
---

# Envoy
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Envoy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Envoy is a high-performance L4/L7 proxy and service mesh data plane, originally created by Lyft. It graduated from the CNCF on November 28, 2018 (accepted September 13, 2017). License: Apache 2.0. Governed under the Linux Foundation trademark umbrella.

**Governance model:** Consensus-first with formal voting on disputes. Senior maintainers receive 2 votes; regular maintainers receive 1. New maintainers require roughly 2-3 months of progressive contribution and approximately 25% ongoing time commitment. xDS API shepherds govern the `api/` tree and coordinate with the CNCF xDS Working Group. No formal steering committee exists. `EXTENSION_POLICY.md` and `DEPENDENCY_POLICY.md` govern extensions and dependencies separately.

**Corporate maintainers (as of 2025, from OWNERS.md):**

Senior maintainers include Yan Avlasov (Google), Ryan Hamilton (Google), Boteng Yao (Google), Greg Greenway (Apple), Raven Black (Dropbox), Takeshi Yoneda (Netflix), Rohit Agrawal (Databricks), Kuo-Chung Hsu (Pinterest), and several independents (Matt Klein, Stephan Zuercher, Ryan Northey, Baiping Wang). Google holds roughly 7 of 22 named maintainer slots, making it the dominant corporate sponsor. Red Hat has one maintainer (Jonh Wendell).

**Community culture on new architecture ports:** Hostile-to-neutral via inaction. Both RISC-V issues were closed as "not planned" with no substantive maintainer engagement. The only on-record maintainer statement (yanavlasov, 2025-12-31) explicitly declined a roadmap. The project has no documented process for proposing a new architecture tier. The effective prerequisite -- RISC-V CI capacity on AWS or GCP -- does not currently exist.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-10-08 | [PR #18474](https://github.com/envoyproxy/envoy/pull/18474) merged, bumping zlib-ng to 2.0.5; zlib-ng upstream gains riscv32/riscv64 arch detection in its cmake scripts. RISC-V reference is incidental to the dependency bump, not a deliberate Envoy port. | GitHub PR #18474 |
| 2024-09-26 | [Issue #36342](https://github.com/envoyproxy/envoy/issues/36342) filed by Boring545: build failure on riscv64 compiling Envoy v1.26.4 -- missing QUICHE header due to `bazel/BUILD` not defining a `linux_riscv64` config_setting. User self-found the fix and reported it. | GitHub Issue #36342 |
| 2024-09-27 | Maintainer phlax notes v1.26 is end-of-life and asks whether the issue reproduces on supported versions. No further maintainer action. | GitHub Issue #36342 |
| 2024-09-28 | Boring545 reports a second blocker on current versions: `rules_python` lacks riscv64 support, preventing Bazel from running on current Envoy. | GitHub Issue #36342 |
| 2024-11-04 | Issue #36342 auto-closed as "not planned" / stale. Fix never upstreamed. | GitHub Issue #36342 |
| 2025-07-15 | [PR #40235](https://github.com/envoyproxy/envoy/pull/40235) opened as WIP: V8 dependency bump to 13.6.233.8, which incidentally includes a v8-riscv foundation component. Not a deliberate riscv64 enablement effort. | GitHub PR #40235 |
| 2025-07-23 | PR #40235 closed without merge. Superseded by an internal Google effort on the same V8 bump. No riscv64 work extracted. | GitHub PR #40235 |
| 2025-12-28 | [Issue #42787](https://github.com/envoyproxy/envoy/issues/42787) filed by wcz0910: formal feature request for official riscv64 support. Reporter states they successfully built v1.26.4 on a native riscv64 machine running Linux 6.6.0. | GitHub Issue #42787 |
| 2025-12-31 | Maintainer yanavlasov responds: "We do not have a roadmap for RISC-V. The main issue is that there is no RISC-V support on AWS, or GCP where we have CI capacity. [...] The best you can do at this point is to build Envoy releases using your own resources." | GitHub Issue #42787 |
| 2026-01-04 | wcz0910 acknowledges CI limitation; states intention to port patches to main branch and submit a PR. No PR is ever filed. | GitHub Issue #42787 |
| 2026-02-12 | Issue #42787 auto-closed as "not planned" / stale, 37 days after the only maintainer response. | GitHub Issue #42787 |

**Summary:** Zero riscv64-specific commits have ever landed in envoyproxy/envoy. The port does not exist upstream. No tracking issue is open. No contributor has submitted a patch since v1.26.4 (now end-of-life).

---

## 3. Upstream Support Tier

Envoy defines no formal tiered support framework (no Tier 1/2/3 architecture policy). Support is implicitly binary: an architecture either has CI and official binaries, or it does not.

**Effective support tiers inferred from build system and CI:**

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Bazel platform constraint in `bazel/BUILD` | Yes (19 references, composite groups, tcmalloc/http3 toggles) | Yes (8 references, engflow RBE runner, composite groups) | No (0 references) |
| CI build jobs (`.github/workflows/`) | Yes (primary target) | Yes (dedicated arm64 jobs) | No |
| BoringSSL FIPS build | Yes | Yes | Hard error if attempted |
| Official release binaries | Yes (`envoy-*-linux-x86_64`) | Yes (`envoy-*-linux-aarch_64`) | No |
| Official Docker images | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |
| `ci/do_ci.sh` explicit dispatch | Yes | Yes | No (falls through to unvalidated generic path) |
| Distro packages (Debian/Ubuntu/Arch) | No (Envoy not in distros) | No | No |
| Maintainer-stated support commitment | Yes | Yes | Explicitly declined (2025-12-31) |

riscv64 is not a supported architecture. It has no tier designation because no tier structure exists. The maintainer statement on record explicitly declines to establish one.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Envoy's own C++ source is largely architecture-agnostic. It contains essentially no `#ifdef __x86_64__` or `#ifdef __aarch64__` guards in its own code. Architecture-specific performance work is entirely delegated to dependencies (BoringSSL for TLS crypto, Abseil for CRC32C and hash, zlib-ng for compression, simdutf for Unicode transcoding, highway for SIMD dispatch). Envoy itself provides no hand-tuned assembly or SIMD intrinsics.

**Per-component architecture coverage:**

| Component | Role | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|---|
| Bazel build graph | Build system | Full | Full | Missing | No `linux_riscv64` config_setting; see Section 5 |
| BoringSSL crypto | TLS/AEAD/hash | Hand-tuned asm (AES-NI, AVX-512, SHA-NI) | Hand-tuned asm (NEON, SHA2, AES) | Scalar fallback only | No riscv64 crypto assembly; BoringSSL FIPS build rejects riscv64 with a hard error |
| QUICHE (HTTP/3) | HTTP/3 + QUIC | Full | Full | Build failure | GSO batch writer header missing on riscv64; root cause: `select()` not resolving riscv64 as linux target |
| LuaJIT | Lua filter JIT | Full JIT | Full JIT | Interpreter only | No riscv64 JIT backend; PR #1267 open since Sep 2024, unmerged |
| V8 | Wasm JIT | Full JIT | Full JIT | Active backend (experimental) | Full assembler and ISA-extension support (RVV, Zbb, Zba, Zbc) in `src/codegen/riscv/`; officially experimental |
| Hyperscan | Regex acceleration | Full (AVX-512) | No (not applicable) | No | x86-only; Envoy guards behind x86 feature detection |
| Vectorscan | Regex acceleration (ARM/SVE) | No | Full | No | Issue #74 ("Add riscv64 support") closed wontfix Feb 2026 |
| re2 | Regex fallback | Full | Full | Full | Pure C++; portable; no RISC-V issues |
| simdutf | UTF-8/Base64 | AVX-512, SSE4.2 | NEON | RVV partial | Multiple correctness bugs fixed 2024-2025; Base64 RVV path still missing (issue #380) |
| highway | SIMD dispatch | Full | Full | Partial | RVV runtime dispatch enabled for Clang 19+/GCC 15+ (Apr 2026); older toolchains fall back to scalar |
| zstd | Compression | Full | Full | Scalar only | Arch detection landed Dec 2025 (#4525); RVV optimizations in open PRs, not yet merged |
| BoringSSL FIPS | FIPS-mode TLS | Full | Full | Hard error | `boringssl_fips.genrule_cmd` rejects non-x86_64/non-aarch64 with a hard Bazel error |
| tcmalloc / gperftools | Memory allocator | tcmalloc (optimized) | tcmalloc (optimized) | gperftools or system allocator | tcmalloc disabled by default on unsupported archs |
| jemalloc | Memory allocator (option) | Yes | Yes | Unknown | Cross-build unresolved (issue #2399, open Mar 2023) |
| nghttp2 | HTTP/2 | Full | Full | Full (expected) | Pure C; no riscv64 issues; portable |
| c-ares | Async DNS | Full | Full | Full (expected) | Pure C; no riscv64 issues; portable |
| liburing | io_uring async I/O | Full | Full | Full (expected) | Linux kernel interface; works wherever kernel supports io_uring |

**ISA extensions in scope for Envoy workloads on RISC-V:** Zbb (bit manipulation, relevant for hash functions), Zbc (carry-less multiply, relevant for CRC/GCM), V/RVV (vectorized compression, Unicode, regex), Zba (address generation). None are currently used by Envoy or its critical-path dependencies in production builds for riscv64. V8 is the furthest along with explicit RVV support in its riscv64 backend.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake, no autoconf. All build flags are Bazel flags.

**Officially supported toolchain (x86_64 and aarch64, from `bazel/README.md`):**
- Clang >= 18 required (C++20); CI runs exactly Clang 18
- GCC >= 13 also supported
- Go >= 1.17 (BoringSSL and Buildifier)
- Python >= 3.8.0
- Bazel via Bazelisk (version pinned in `.bazelversion`)

No riscv64-specific toolchain requirements are documented because the architecture is unsupported.

**Official build commands (for supported architectures only):**

```
bazel build -c opt envoy
bazel build -c dbg envoy
bazel build --config=clang envoy
bazel build --config=gcc envoy
bazel --bazelrc=/dev/null build -c opt envoy.stripped
```

**Relevant flags for reduced/cross builds:**

| Flag | Effect |
|---|---|
| `--define tcmalloc=disabled` | Disable tcmalloc (required on non-x86_64/aarch64) |
| `--define tcmalloc=gperftools` | Use gperftools tcmalloc (non-x86_64/aarch64 default) |
| `--//bazel:http3=False` | Disable HTTP/3 and QUICHE entirely (workaround for riscv64 QUICHE build failure) |
| `--//source/extensions/wasm_runtime/v8:enabled=false` | Disable V8 Wasm runtime (required on riscv64 per issue #36342) |
| `--define hot_restart=disabled` | Disable hot restart |
| `--define signal_trace=disabled` | Disable signal handlers |

**Known riscv64 build failures:**

1. **QUICHE GSO batch writer header** (Issue #36342, closed "not planned", Nov 2024): `fatal error: quiche/quic/core/batch_writer/quic_gso_batch_writer.h: No such file or directory`. Root cause: `bazel/BUILD` does not define a `linux_riscv64` `config_setting`, so all `select({"@envoy//bazel:linux": [...]})` expressions evaluate to the empty default on riscv64. User Boring545 self-found the fix: add `config_setting(name = "linux_riscv64", values = {"cpu": "riscv64"})` and include `:linux_riscv64` in both the `linux` and `not_x86` `selects.config_setting_group` entries in `bazel/BUILD`. Fix never upstreamed. Workaround: pass `--//bazel:http3=False` to disable QUICHE.

2. **rules_python riscv64 incompatibility** (reported by Boring545, Sep 2024): `rules_python` does not support riscv64, blocking Bazel from running on current Envoy versions (post-1.26) even with the QUICHE fix applied. This is an unresolved second-order blocker. [NEEDS VERIFICATION -- no upstream rules_python issue linked in the Envoy issue]

3. **BoringSSL FIPS hard error** (from `bazel/external/boringssl_fips.genrule_cmd`): Explicitly rejects non-x86_64/non-aarch64 targets. Any attempt to build Envoy with `--config=boringssl-fips` on riscv64 will fail at the Bazel rule level.

**Docker / QEMU:** `ci/run_envoy_docker.sh` supports QEMU via `multiarch/qemu-user-static`, but the pinned build image (`envoyproxy/envoy-build-ubuntu:v0.1.6`) has no riscv64 variant and ships no riscv64 cross-compiler or sysroot. QEMU emulation cannot be used without a corresponding riscv64 build image, which does not exist.

**Toolchain arch dispatch in `ci/do_ci.sh`:**
```
if [[ "${ENVOY_BUILD_ARCH}" == "x86_64" ]]; then
  BUILD_ARCH_DIR="/linux/amd64"
elif [[ "${ENVOY_BUILD_ARCH}" == "aarch64" ]]; then
  BUILD_ARCH_DIR="/linux/arm64"
fi
```
riscv64 falls through to a generic `/linux/${ENVOY_BUILD_ARCH}` path with no corresponding Docker image or build path defined anywhere.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (features that cannot work at all on riscv64):**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| HTTP/3 / QUIC | Full | Full | Build failure | QUICHE `select()` does not resolve riscv64 as linux; workaround: disable HTTP/3 |
| BoringSSL FIPS mode | Full | Full | Hard build error | `boringssl_fips.genrule_cmd` rejects riscv64 at Bazel rule level |
| Hyperscan regex acceleration | Full (AVX-512) | Unavailable | Unavailable | x86-only; re2 fallback works |
| Vectorscan regex acceleration | Unavailable | Full (SVE) | Unavailable | wontfix for riscv64 (issue #74, closed Feb 2026); re2 fallback works |
| Lua filter JIT performance | Full (LuaJIT x86 JIT) | Full (LuaJIT ARM64 JIT) | ~10x slower (interpreter only) | No LuaJIT riscv64 JIT backend; PR #1267 open Sep 2024, not merged |
| V8 Wasm JIT | Full | Full | Experimental (must be explicitly disabled per user report) | V8 upstream has riscv64 backend; build-time integration in Envoy unresolved |
| Official binaries | Yes | Yes | No | No release artifacts exist |

**Performance gaps (from missing SIMD, hardware acceleration):**

- **TLS throughput:** BoringSSL has no riscv64 crypto assembly (no AES-GCM hardware acceleration, no SHA hardware acceleration). TLS termination throughput will be substantially lower than amd64/arm64. No benchmark data is available to quantify this gap.
- **Compression (zstd, zlib-ng):** Both lack RVV-vectorized paths on riscv64 at present. Scalar fallback is functional. RVV optimization PRs are open upstream for zstd but not yet merged.
- **Lua filter throughput:** Interpreter-only LuaJIT on riscv64 results in roughly 10x lower throughput for Lua-heavy filter chains compared to amd64/arm64. [NEEDS VERIFICATION -- 10x figure is a general LuaJIT JIT-vs-interpreter estimate, not a measured Envoy-specific benchmark]
- **Regex:** Hyperscan and Vectorscan acceleration unavailable; re2 fallback is functional but slower for complex regex patterns on high-traffic paths.

**Security hardening gaps:**

- BoringSSL FIPS mode unavailable on riscv64 (hard build error). Deployments requiring FIPS-validated cryptography cannot use Envoy on riscv64.

**Floating-point / NaN correctness:** No riscv64-specific floating-point or NaN correctness issues found in the envoyproxy/envoy issue tracker. Data not available: no riscv64-specific numerical correctness search was performed against Envoy dependencies.

---

## 7. CI/CD Infrastructure

**CI system:** GitHub Actions exclusively. 58 workflow YAML files in `.github/workflows/` were read in full. Zero files contain "riscv" in any form (case-insensitive). There is no riscv64 CI of any kind -- no build-only job, no QEMU-emulated job, no nightly job, no `workflow_dispatch`-only job.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build jobs | Yes (primary target) | Yes (dedicated jobs) | No |
| Test jobs | Yes | Yes | No |
| Release container jobs | Yes | Yes | No |
| QEMU emulation option | N/A | N/A | No (build image missing) |
| RBE (Remote Build Execution) | Yes (engflow) | Yes (engflow) | No |
| Self-hosted hardware runners | No | No | No |
| RISE-provided CI runners | No | No | No |

**Stated blocker (yanavlasov, 2025-12-31):** AWS and GCP do not offer riscv64 instance types. Envoy's CI infrastructure relies exclusively on these two providers. Until a major cloud provider offers riscv64 instances, adding riscv64 CI requires either a third-party CI provider (RISE, Equinix Metal, etc.) or self-hosted hardware, neither of which the Envoy maintainers have committed to pursuing.

**RISE involvement:** None. The RISE project blog (27 posts enumerated) has no post mentioning Envoy. The RISE riscv64 wheel builder lists 78 packages; Envoy is not among them. No RISE-funded work or RISE CI runners are associated with Envoy.

---

## 8. Distribution and Release Status

**Official release binaries (GitHub Releases, confirmed against v1.38.2, v1.37.4, v1.36.9, v1.36.8, v1.35.13):**

Each release publishes exactly: `envoy-<ver>-linux-aarch_64`, `envoy-<ver>-linux-x86_64`, `envoy-contrib-<ver>-linux-aarch_64`, `envoy-contrib-<ver>-linux-x86_64`, `debs.tar.gz`, `checksums.txt.asc`. No riscv64 asset exists in any release.

**Docker images:** Official `envoyproxy/envoy` images declare only `linux/amd64` and `linux/arm64` in their manifests. No `linux/riscv64` image is published.

**Debian:** The package name "envoy" does not exist in Debian (tracker.debian.org returns HTTP 404). The Debian archive contains only arch-independent helper libraries (`golang-github-envoyproxy-go-control-plane-dev`, `golang-github-envoyproxy-protoc-gen-validate-dev`, `python3-envoy-utils`). No binary proxy package for any architecture is in Debian.

**Ubuntu:** Envoy is not packaged in Ubuntu noble (24.04). Not available in any Ubuntu suite via `packages.ubuntu.com`.

**Arch Linux RISC-V:** Envoy is not present in the Arch Linux RISC-V mirror (archriscv.felixc.at).

**What a user must do to get a working riscv64 binary today:**
1. Apply an unpublished patch to `bazel/BUILD` to add `linux_riscv64` config_setting (self-found fix from issue #36342; never upstreamed)
2. Disable HTTP/3 via `--//bazel:http3=False`
3. Disable V8 Wasm runtime via `--//source/extensions/wasm_runtime/v8:enabled=false`
4. Disable tcmalloc via `--define tcmalloc=gperftools` or `--define tcmalloc=disabled`
5. Resolve the `rules_python` riscv64 incompatibility (no documented workaround for current versions)
6. Build on a native riscv64 machine or with a riscv64 cross-compiler (no official cross-compilation setup provided)
7. The result is an unofficial, untested binary with HTTP/3, Lua JIT, and Wasm JIT disabled

The last confirmed successful build is Envoy v1.26.4 (end-of-life). No confirmed successful build of a current supported release on riscv64 is documented.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| BoringSSL | TLS/crypto (default) | Partial (scalar fallback) | Unknown | No | No riscv64 crypto asm; FIPS mode hard error |
| aws-lc | TLS/crypto (alternative) | Partial | Unknown | No | BUILDING.md lists x86_64 and ARM/AArch64 only; no riscv64 CI detected |
| OpenSSL 3.x | TLS/crypto (alternative) | Yes | Partial | Yes (via distros) | Builds on riscv64; no RVV crypto acceleration |
| ipp-crypto | Crypto acceleration | No | No | No | Intel x86/AVX-512 only; not applicable to riscv64; skipped on non-x86 |
| LuaJIT | Lua scripting JIT | Interpreter only | No | No | No riscv64 JIT backend; PR #1267 open Sep 2024, unmerged |
| V8 | Wasm JIT host | Yes (experimental) | Partial | Experimental | Full riscv64 assembler + RVV/Zbb/Zba/Zbc in `src/codegen/riscv/`; officially experimental |
| Wasmtime | Wasm JIT (alternative) | Yes (active) | Partial | Yes (unofficial) | Cranelift riscv64 backend active; open: frame pointer ABI mismatch (#10281), TLSDESC TLS (#12087) |
| WAMR | Wasm interpreter | Partial | Partial | No | AOT relocation bugs at opt > 0 (issue #4765, Dec 2025); interpreter functional |
| Hyperscan | Regex acceleration | No | No | No | x86/SIMD only; incompatible with riscv64 by design |
| Vectorscan | Regex acceleration | No | No | No | Issue #74 closed wontfix Feb 2026 |
| re2 | Regex fallback | Yes | Yes | Yes | Pure C++; portable |
| simdutf | UTF-8/UTF-16/Base64 | Partial | Partial | Partial | RVV support exists; Base64 RVV path missing (issue #380); correctness bugs fixed 2024-2025 |
| google/highway | SIMD abstraction | Partial | Partial | Partial | RVV dispatch for Clang 19+/GCC 15+ (Apr 2026); older toolchains fall to scalar; mold linker issue (#2854) |
| zstd | Compression | Partial | Partial | Yes | Arch detection landed Dec 2025; RVV optimizations open PRs, not merged |
| zlib-ng | Compression (zlib) | Partial | Unknown | Yes | No riscv64 SIMD; scalar only |
| lz4 | Compression | Yes | Yes | Yes | Pure C fallback; no riscv64 issues |
| brotli | Compression | Yes | Yes | Yes | Pure C path; no riscv64 issues |
| Abseil-cpp | Base C++ utilities, CRC32C | Partial | Partial | Yes | Basic riscv64 since 2020; CRC32C HW acceleration PR #1986 open Dec 2025; stack alignment bug for ILP32E (#1236) |
| Protobuf | Serialization | Yes | Partial | Yes | Builds on riscv64; prior build failure (abseil-related) fixed 2023 |
| gRPC | RPC transport | Partial | Partial | No (Python wheels) | C++ core likely builds; Python riscv64 wheels not published (issue #41591, Feb 2026) |
| jemalloc | Memory allocator | Unknown | Unknown | Unknown | Cross-build unresolved (issue #2399, Mar 2023) |
| tcmalloc | Memory allocator | Unknown | Unknown | Unknown | No issues filed; likely falls back to system allocator on riscv64 |
| gperftools | CPU/heap profiler | Partial | Partial | Yes | Critical riscv64 stack trace bug fixed Jul 2023; slower generic stack trace method vs x86 optimized |
| nghttp2 | HTTP/2 | Yes | Yes | Yes | Pure C; portable |
| c-ares | Async DNS | Yes | Yes | Yes | Pure C; portable |
| liburing | io_uring async I/O | Yes | Yes | Yes | Linux kernel interface; portable |
| QATzip / QAT-ZSTD | Intel QAT HW compression | No | No | No | Intel x86 PCIe hardware; not applicable to riscv64 |

**Deep-dive on critical blocking dependencies:**

**LuaJIT:** The Lua filter is widely used for lightweight request/response transformation. LuaJIT has no riscv64 JIT backend. Upstream PR #1267 (riscv64 JIT port) has been open since September 2024 and has not merged. Without a JIT backend, LuaJIT runs in interpreter mode on riscv64, delivering roughly one-tenth the throughput of the JIT path. Envoy does not fall back to PUC Lua; it depends specifically on LuaJIT. Lua filter performance on riscv64 is severely degraded.

**BoringSSL:** BoringSSL is Envoy's default TLS provider. It has hand-tuned assembly for x86_64 (AES-NI, VAES, AVX-512, SHA-NI, PCLMULQDQ) and AArch64 (NEON, AES, SHA2, PMULL). riscv64 has no equivalent assembly paths; all crypto falls to the generic C implementation. TLS termination throughput will be materially lower. Exact throughput delta: data not available (no riscv64 BoringSSL benchmarks found in any public source). Additionally, BoringSSL FIPS mode (`boringssl_fips.genrule_cmd`) has a hard rejection for non-x86_64/non-aarch64, making FIPS-compliant Envoy deployments on riscv64 impossible without removing that guard.

**V8 (Wasm runtime):** V8 has a full riscv64 backend in `src/codegen/riscv/` with explicit support for RVV, Zbb, Zba, and Zbc extensions. This is the most complete RISC-V implementation among Envoy's major JIT dependencies. However, the Envoy-side build integration is unresolved: user Boring545 had to explicitly disable V8 (`--//source/extensions/wasm_runtime/v8:enabled=false`) to get a successful build of v1.26.4. The WIP PR #40235 that would have bumped V8 to a newer version was closed without merge.

**jemalloc:** Issue #2399 (Mar 2023, open) describes an unresolved cross-build problem for riscv64. No confirmed working riscv64 build of jemalloc is documented. If jemalloc fails to build or link on riscv64, Envoy must fall back to the system allocator, which may affect performance and memory fragmentation characteristics.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#36342](https://github.com/envoyproxy/envoy/issues/36342) | Build Error: Missing quiche header on RISC-V 64 (v1.26.4) | Closed "not planned" Nov 2024 | High (blocks build) | `bazel/BUILD` missing `linux_riscv64` config_setting; user self-found fix, never upstreamed; same root cause applies to all current versions |
| [#42787](https://github.com/envoyproxy/envoy/issues/42787) | arch: official support for RISC-V (riscv64) | Closed "not planned" Feb 2026 | Informational / strategic | Maintainer explicitly declined roadmap; CI blocker (no riscv64 on AWS/GCP) cited as primary reason |

**No open riscv64-specific correctness or performance bugs exist in the envoyproxy/envoy issue tracker.** Both riscv64-related issues are closed. No floating-point correctness issues, no NaN bugs, no runtime crashes specific to riscv64 are documented.

**Open bugs in dependencies affecting Envoy on riscv64 (not in envoyproxy/envoy itself):**

| Dependency | Issue | Severity |
|---|---|---|
| LuaJIT | PR #1267 (riscv64 JIT backend, open Sep 2024) | High (performance) |
| WAMR | Issue #4765 (AOT relocation bugs at opt > 0, Dec 2025) | Medium (Wasm AOT mode) |
| simdutf | Issue #380 (Base64 RVV path missing) | Low |
| Abseil-cpp | PR #1986 (CRC32C HW acceleration, open Dec 2025) | Low (performance) |
| jemalloc | Issue #2399 (riscv64 cross-build unresolved, Mar 2023) | Medium (build) |
| gRPC | Issue #41591 (Python riscv64 wheels not published, Feb 2026) | Low for C++ data plane |
| google/highway | Issue #2854 (mold linker on riscv64) | Low |
| Vectorscan | Issue #74 (riscv64 support, closed wontfix Feb 2026) | Medium (performance path unavailable) |

---

## 12. Objections and Upstream Blockers

**Stated objections (on record):**

1. **No CI capacity on major cloud providers (yanavlasov, 2025-12-31):** "There is no RISC-V support on AWS, or GCP where we have CI capacity." This is the maintainers' primary stated reason for declining a roadmap. Until a major cloud provider or a CI provider accepted by the Envoy project offers riscv64 instances, no CI integration is possible without external infrastructure contribution.

2. **No maintainer willing to own riscv64:** The governance model requires a contributor willing to commit approximately 25% of their time to maintaining the port. No such contributor has emerged. The reporter of #42787 (wcz0910) offered to contribute build configuration patches but did not follow through.

**Technical blockers (in order of severity):**

1. `bazel/BUILD` missing `linux_riscv64` config_setting -- self-found fix exists but not upstreamed. Trivial one-line change plus group membership additions.
2. `rules_python` riscv64 incompatibility -- blocks Bazel on current (post-1.26) Envoy versions. Requires upstream rules_python fix or a workaround.
3. BoringSSL FIPS hard rejection -- cannot be resolved without either patching `boringssl_fips.genrule_cmd` or accepting that FIPS mode is unavailable on riscv64.
4. LuaJIT has no riscv64 JIT backend -- requires upstream LuaJIT work (PR #1267, open 9+ months).
5. V8 Wasm runtime build integration unresolved in current Envoy versions.
6. jemalloc riscv64 cross-build unresolved.

**Organizational blockers:**

- Both riscv64 issues were closed "not planned" without follow-through from contributors. The stalebot closed both without maintainer action, which is a signal that riscv64 is not considered a priority by any active contributor.
- No RISE involvement, no CNCF working group, no chip vendor (including current Qualcomm, SiFive, or Alibaba DAMO Academy representation on the maintainer list) has proposed sponsoring riscv64 CI or a maintainer slot.

**Acceptance probability for an upstreaming PR:** Low in the short term if submitted without CI infrastructure. The maintainer position (yanavlasov) is that CI is a prerequisite for acceptance, and CI requires riscv64 instances on AWS or GCP. A PR that includes a CI provider agreement (RISE runners, Equinix Metal, Hetzner riscv64) alongside the build fix has a reasonable chance of acceptance based on the governance model's openness to new maintainers with resources.

---

## 13. Investment Analysis

RISE has no funded work on Envoy. No work is pre-done. All items below represent net new investment.

### 13.1 Functional Enablement

1. **Fix `bazel/BUILD` `linux_riscv64` config_setting** -- Add one `config_setting` block and two group membership entries. One engineer-day. The fix is already documented in issue #36342 and requires only upstreaming.
2. **Resolve `rules_python` riscv64 incompatibility** -- Requires diagnosing the exact failure mode on current Envoy versions and either contributing a fix upstream to `rules_python` or implementing a workaround in Envoy's Bazel setup. Estimated 2-4 person-weeks depending on rules_python root cause.
3. **Verify and enable HTTP/3 (QUICHE) on riscv64** -- Once `linux_riscv64` is registered as a linux target, the QUICHE build failure should resolve. Requires integration testing. Estimated 1-2 person-weeks.
4. **Resolve BoringSSL FIPS hard rejection** -- For non-FIPS deployments this is not blocking. For FIPS-required deployments, requires either upstreaming a riscv64 FIPS build to BoringSSL or substituting aws-lc (which has its own riscv64 gap). Estimated 4-8 person-weeks.
5. **V8 Wasm runtime build integration** -- Requires bumping V8 to a version with a working riscv64 backend and resolving the Envoy-side integration issues. Estimated 2-4 person-weeks.
6. **jemalloc riscv64 cross-build** -- Requires contributing to upstream jemalloc (issue #2399, open 3+ years). Estimated 2-4 person-weeks.

### 13.2 Performance Optimization

1. **LuaJIT riscv64 JIT backend** -- Blocked on upstream PR #1267 (open Sep 2024). Contributing to or taking ownership of that PR. Estimated 12-20 person-weeks for a production-quality JIT backend; partial JIT (basic blocks only) estimated 4-8 person-weeks. High leverage for Lua-filter-heavy deployments.
2. **BoringSSL riscv64 crypto assembly** -- AES-GCM, ChaCha20-Poly1305, SHA-256/384/512 using Zbc (CLMUL), Zbkb, and RVV. This is a substantial undertaking equivalent to the AArch64 crypto assembly effort. Estimated 16-24 person-weeks for a complete set matching the AArch64 coverage.
3. **zstd RVV optimization** -- Merge or contribute to open upstream PRs for RVV-vectorized compression/decompression paths. Estimated 4-8 person-weeks.
4. **simdutf Base64 RVV path** -- Issue #380. Estimated 2-4 person-weeks.

### 13.3 CI/CD Infrastructure

1. **Provision riscv64 CI runners accepted by Envoy** -- Requires agreement with Envoy maintainers on which CI provider is acceptable. RISE-hosted runners or a dedicated Equinix Metal / cloud provider arrangement. Estimated 2-4 person-weeks engineering plus ongoing infrastructure cost.
2. **riscv64 build image (`envoyproxy/envoy-build-ubuntu` variant)** -- Produce and maintain a riscv64-compatible Envoy build Docker image with Clang 18, Bazelisk, and required toolchain. Estimated 2-4 person-weeks initial, plus maintenance overhead.
3. **Native riscv64 CI jobs in `.github/workflows/`** -- Add build and test jobs mirroring the arm64 job structure. Estimated 1-2 person-weeks once runners and build image are available.

### 13.4 Ecosystem Enablement

Envoy is not distributed through a significant dependent package ecosystem (no PyPI wheels, no Maven JARs, no npm packages for the proxy binary itself). This section is not applicable. The primary distribution gap is official release binaries and Docker images.

1. **Official riscv64 release binary** -- Add `envoy-<ver>-linux-riscv64` to the GitHub release process. Requires CI to be in place first. Estimated 1-2 person-weeks once CI is operational.
2. **Official riscv64 Docker image** -- Add `linux/riscv64` to the Docker manifest. Requires build image and CI. Estimated 1-2 person-weeks.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `bazel/BUILD` `linux_riscv64` config_setting and upstream PR | 0.2 | Envoy contributor | Critical |
| Functional | Resolve `rules_python` riscv64 incompatibility | 2-4 | Envoy contributor + rules_python upstream | Critical |
| Functional | Verify QUICHE/HTTP3 on riscv64 after Bazel fix | 1-2 | Envoy contributor | High |
| Functional | V8 Wasm runtime build integration on riscv64 | 2-4 | Envoy + V8 contributor | High |
| Functional | jemalloc riscv64 cross-build (upstream contribution) | 2-4 | jemalloc upstream | Medium |
| Functional | BoringSSL FIPS riscv64 (FIPS deployments only) | 4-8 | BoringSSL / aws-lc upstream | Medium |
| CI/CD | Provision riscv64 CI runners + build image | 2-4 | Infrastructure / RISE | Critical (gate for upstreaming) |
| CI/CD | Add riscv64 CI jobs to `.github/workflows/` | 1-2 | Envoy contributor | Critical (gate for upstreaming) |
| CI/CD | Official riscv64 release binary + Docker image | 1-2 | Envoy contributor | High |
| Performance | LuaJIT riscv64 JIT backend (upstream PR #1267) | 12-20 | LuaJIT upstream | High |
| Performance | BoringSSL riscv64 crypto assembly (AES-GCM, SHA, ChaCha20) | 16-24 | BoringSSL upstream | Medium |
| Performance | zstd RVV vectorization (upstream PRs) | 4-8 | zstd upstream | Low |
| Performance | simdutf Base64 RVV path (issue #380) | 2-4 | simdutf upstream | Low |

**Critical path:** CI infrastructure (runners + build image) is the gate for all upstreaming. Without CI, the Envoy maintainers will not accept architecture additions. The Bazel config fix is trivial once CI is in place. LuaJIT JIT backend is the highest-leverage performance investment for workloads using the Lua filter.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #42787: arch: official support for RISC-V (riscv64)](https://github.com/envoyproxy/envoy/issues/42787)
- [Issue #36342: Build Error: Missing quiche header on RISC-V 64](https://github.com/envoyproxy/envoy/issues/36342)
- [PR #18474: deps: Bump com_github_zlib_ng_zlib_ng -> 2.0.5](https://github.com/envoyproxy/envoy/pull/18474)
- [PR #40235: WIP deps: bump up V8 to 13.6.233.8](https://github.com/envoyproxy/envoy/pull/40235)
- [Envoy GitHub Releases API (v1.38.2 assets)](https://api.github.com/repos/envoyproxy/envoy/releases?per_page=5)
- [Envoy OWNERS.md](https://github.com/envoyproxy/envoy/blob/main/OWNERS.md)
- [Envoy bazel/BUILD (architecture constraints)](https://github.com/envoyproxy/envoy/blob/main/bazel/BUILD)
- [Envoy ci/do_ci.sh (architecture dispatch)](https://github.com/envoyproxy/envoy/blob/main/ci/do_ci.sh)
- [Envoy bazel/toolchains.bzl](https://github.com/envoyproxy/envoy/blob/main/bazel/toolchains.bzl)
- [Envoy bazel/external/boringssl_fips.genrule_cmd](https://github.com/envoyproxy/envoy/blob/main/bazel/external/boringssl_fips.genrule_cmd)
- [Envoy bazel/README.md (toolchain requirements)](https://github.com/envoyproxy/envoy/blob/main/bazel/README.md)
- [Envoy ci/run_envoy_docker.sh (QEMU setup)](https://github.com/envoyproxy/envoy/blob/main/ci/run_envoy_docker.sh)
- [Vectorscan Issue #74: riscv64 support closed wontfix](https://github.com/VectorCamp/vectorscan/issues/74)
- [LuaJIT PR #1267: riscv64 JIT backend](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [jemalloc Issue #2399: riscv64 cross-build unresolved](https://github.com/jemalloc/jemalloc/issues/2399)
- [simdutf Issue #380: Base64 RVV path missing](https://github.com/simdutf/simdutf/issues/380)
- [gRPC Issue #41591: Python riscv64 wheels not published](https://github.com/grpc/grpc/issues/41591)
- [Abseil-cpp PR #1986: CRC32C riscv64 HW acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [google/highway Issue #2854: mold linker on riscv64](https://github.com/google/highway/issues/2854)
- [WAMR Issue #4765: AOT relocation bugs at opt > 0](https://github.com/bytecodealliance/wasm-micro-runtime/issues/4765)
- [RISE Project member list](https://riseproject.dev)
- [Envoy CNCF project page](https://www.cncf.io/projects/envoy/)
- [Envoy homepage](https://www.envoyproxy.io/)