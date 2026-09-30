---
title: Envoy
parent: Project Reports
color: orange
dependencies:
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: rules_python
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: aws-lc
    relation: runtime-dependency
    criticality: optional
  - name: LuaJIT
    relation: runtime-dependency
    criticality: optional
  - name: V8
    relation: runtime-dependency
    criticality: optional
  - name: Wasmtime
    relation: runtime-dependency
    criticality: optional
  - name: WAMR
    relation: runtime-dependency
    criticality: optional
  - name: hyperscan
    relation: runtime-dependency
    criticality: optional
  - name: Vectorscan
    relation: runtime-dependency
    criticality: critical
  - name: re2
    relation: runtime-dependency
    criticality: critical
  - name: simdutf
    relation: runtime-dependency
    criticality: optional
  - name: Highway
    relation: runtime-dependency
    criticality: optional
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: gRPC
    relation: runtime-dependency
    criticality: critical
  - name: quiche
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: tcmalloc
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: xxHash
    relation: runtime-dependency
    criticality: optional
  - name: ipp-crypto
    relation: runtime-dependency
    criticality: optional
  - name: qatlib
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="envoy" %}

# Envoy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (no-upstream-ci-no-release-no-distro)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Envoy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Envoy is a high-performance L4/L7 proxy and service mesh data plane, originally created by Lyft. It is a [Cloud Native Computing Foundation graduated project](https://www.envoyproxy.io/) (accepted 2017-09-13, graduated 2018-11-28). License: Apache-2.0. Companies listed as users on envoyproxy.io include Airbnb, AWS, Booking.com, Databricks, Datadog, Google, Microsoft, Netflix, Stripe and Uber, though the site does not distinguish "users" from formal financial sponsors.

**Governance model** ([GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md)): two maintainer tiers, Senior Maintainers and (regular) Maintainers, plus a separate API Shepherds tier for xDS API changes. Becoming a maintainer requires expressing interest to envoy-maintainers, contributing increasingly complex PRs under guidance for roughly 2-3 months, then a formal review. Maintainers must commit at least 25% of their time (about 1.25 days/week) and take on-call/triage rotations. Disputes are resolved amicably first; unresolved issues escalate to a maintainer vote in which senior maintainers get 2 votes and regular maintainers get 1.

**Maintainers and corporate affiliation** (from [OWNERS.md](https://github.com/envoyproxy/envoy/blob/main/OWNERS.md), inferred from email domains):

Senior Maintainers: Matt Klein (independent), Harvey Tuch (independent), Greg Greenway (Apple), Yan Avlasov (Google), Ryan Northey (Synca, consultancy), Ryan Hamilton (Google), Baiping Wang (independent), Boteng Yao (Google), Rohit Agrawal (Databricks), Kateryna Nezdolii (independent).

Maintainers: Kevin Baichoo, Keith Smiley, Tony Allen, Takeshi Yoneda, Mike Krinkin (independent); Kuat Yessenov, Tianyu Xia, Paul Ogilby, Yanjun Xiang (Google); Raven Black (Dropbox); Jonh Wendell (Red Hat).

Google holds the largest single-company share of named maintainer slots (7 of roughly 21), followed by single representatives from Apple, Databricks, Dropbox and Red Hat. No RISC-V silicon vendor (SiFive, Andes, Alibaba DAMO, Qualcomm, etc.) has a maintainer seat. CODEOWNERS confirms `@envoyproxy/maintainers` as the default owner, with sub-teams for docs/CI and many extensions marked `@UNOWNED`.

**Community culture on new architecture ports:** Inaction rather than active rejection. Both RISC-V issues on record were closed `not_planned` by stalebot with a single substantive maintainer reply each and no further engagement. The only maintainer statement on RISC-V (`yanavlasov`, 2025-12-31, on [issue #42787](https://github.com/envoyproxy/envoy/issues/42787)): *"We do not have a roadmap for RISC-V. The main issue is that there is no RISC-V support on AWS, or GCP where we have CI capacity."* There is no documented process for proposing a new architecture tier, and the stated prerequisite, riscv64 CI capacity on AWS or GCP, does not currently exist for Envoy's CI setup.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-10-08 | [PR #18474](https://github.com/envoyproxy/envoy/pull/18474) merged (zlib-ng bump to 2.0.5); zlib-ng upstream gains riscv32/riscv64 arch-detection logic in its cmake scripts. Incidental to the dependency bump, not a deliberate Envoy port. First release: v1.21.0 (2022-01-12). | GitHub PR #18474 |
| 2024-09-26 | [Issue #36342](https://github.com/envoyproxy/envoy/issues/36342) filed by Boring545: build failure on riscv64 compiling Envoy v1.26.4, missing QUICHE header (`quic_gso_batch_writer.h`), caused by `bazel/BUILD` having no `linux_riscv64` config_setting so all `select()` expressions evaluate to empty on riscv64. | GitHub Issue #36342 |
| 2024-09-27 | Boring545 self-patches by adding a `linux_riscv64` `config_setting` and updating the `linux`/`not_x86` `select()` groups in `bazel/BUILD`; build then succeeds except for the V8 extension, which fails to compile on riscv64 and must be disabled. Maintainer `phlax` notes v1.26 is already EOL and asks if the problem reproduces on a current release. | GitHub Issue #36342 |
| 2024-09-28 | Boring545 reports a second blocker: `rules_python` is incompatible with riscv64, preventing any test on a current, supported Envoy version. The maintainer's reproduction request is never answered. | GitHub Issue #36342 |
| 2024-11-04 | Issue #36342 auto-closed `not_planned` by stalebot after 37 days of inactivity. Fix never upstreamed. | GitHub Issue #36342 |
| 2025-11-12 to 2025-11-19 | [PR #41975](https://github.com/envoyproxy/envoy/pull/41975) (dependabot: bump frozendict 2.4.6 to 2.4.7) opened and then closed unmerged ("no longer needed") on 2025-11-19. Matched the riscv search only because frozendict's own changelog added riscv64 wheels; irrelevant to Envoy itself. | GitHub PR #41975 |
| 2025-12-28 | [Issue #42787](https://github.com/envoyproxy/envoy/issues/42787) filed by wcz0910: formal request for an official riscv64 support roadmap. Reporter states successful native compilation of Envoy v1.26.4 on RISC-V hardware (`Linux 6.6.0.mlu370 riscv64`). | GitHub Issue #42787 |
| 2025-12-31 | Maintainer `yanavlasov` replies there is no roadmap because Envoy's CI providers (AWS, GCP) have no RISC-V capacity. | GitHub Issue #42787 |
| 2026-01-04 | wcz0910 states intent to port the v1.26.4 patches to `main` and open a PR, using a native RISC-V environment for build/test. No PR is ever filed. | GitHub Issue #42787 |
| 2026-01-09 to 2026-01-11 | [PR #42919](https://github.com/envoyproxy/envoy/pull/42919) (draft, Copilot bot, emsdk bzlmod patch) opened and closed unmerged; matched incidentally, not riscv-related, and left no trace in any branch history. | GitHub PR #42919 |
| 2026-02-12 | Issue #42787 auto-closed `not_planned` by stalebot, 37 days after the only maintainer reply and with no PR from wcz0910 ever materializing. | GitHub Issue #42787 |

**Merge-status verification** (via anonymous filtered clone of all branches/tags, cross-checked against rendered GitHub PR pages): of the PRs that incidentally matched a "riscv" search, only [#18474](https://github.com/envoyproxy/envoy/pull/18474) (zlib-ng bump) actually merged, landing in v1.21.0. [#42919](https://github.com/envoyproxy/envoy/pull/42919), [#41975](https://github.com/envoyproxy/envoy/pull/41975) and [#40235](https://github.com/envoyproxy/envoy/pull/40235) (WIP V8 bump to 13.6.233.8, closed 2025-07-23 without merge) never merged. GitHub commit search for "riscv", "riscv64" and "risc-v" scoped to `envoyproxy/envoy` returns zero results. A downstream, out-of-tree fork ([rcore-os/tgoskits PR #1559](https://github.com/rcore-os/tgoskits/pull/1559), via the "higress" project) cross-compiles Envoy v1.38.3 from source for riscv64/loongarch64 using musl and clang-18, but this work is not part of envoyproxy/envoy and has not been proposed upstream.

**Summary:** Zero riscv64-specific commits have ever landed in envoyproxy/envoy. No tracking issue is open. No contributor has submitted a patch against a version newer than v1.26.4 (now end-of-life). The closest thing to a tracking issue, #42787, is closed.

## 3. Upstream Support Tier

Envoy defines no formal tiered architecture-support policy (no Tier 1/2/3 document, no `PLATFORMS.md`, `SUPPORT.md` or `docs/platforms/` file; each path returns 404 on the main branch). The authoritative statement instead lives in the public install docs: *"The Envoy project currently supports `amd64` and `arm64` architectures for its Linux build and images."* riscv64 is absent. Support is effectively binary: an architecture either has CI and official binaries, or it does not.

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Bazel platform constraint in `bazel/BUILD`, `bazel/platforms/BUILD` | Full | Full | Missing (no platform entry, no `@platforms//cpu:riscv64` constraint) |
| CI build/test jobs | Yes (primary target) | Yes (dedicated jobs) | No |
| BoringSSL-FIPS crypto backend | Full, officially supported | Full, officially supported | Not supported, `bazel/SSL.md` lists only "Linux x86_64, aarch64[, ppc64le]" |
| tcmalloc allocator selection (`envoy_internal.bzl`) | `-DTCMALLOC` selected | `-DTCMALLOC` selected | Falls through to the generic, untuned branch |
| Official release binaries | Yes | Yes | No (direct probe of v1.39.1's riscv64 asset URL: HTTP 404) |
| Official Docker images | `linux/amd64` | `linux/arm64` | No `linux/riscv64` manifest |
| Distro packages (Debian, Ubuntu, Arch) | Not packaged (Envoy itself is not in major distros) | Not packaged | Not packaged |
| Maintainer-stated commitment | Yes | Yes | Explicitly declined, 2025-12-31 |

riscv64 is not a supported architecture under any definition the project uses, and the one maintainer statement on record explicitly declines to create a roadmap for it.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Envoy's own C++ source contains essentially no per-architecture guards (`#ifdef __x86_64__`, `#ifdef __aarch64__`, or `#ifdef __riscv`); a repository-wide code search for `__riscv` returns zero matches anywhere in `source/`, `contrib/` or `bazel/`. Architecture-specific performance work is delegated entirely to vendored dependencies: BoringSSL (TLS crypto asm), Abseil (CRC32C, hashing), zlib-ng/zstd/brotli (compression SIMD), simdutf (Unicode transcoding), Highway (SIMD dispatch), LuaJIT/V8/Wasmtime/WAMR (script/Wasm JIT backends), Hyperscan/Vectorscan (regex acceleration). Envoy itself contributes no hand-tuned assembly or intrinsics of its own.

| Component | Role | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Bazel build graph | Build system | Full | Full | Missing: no `linux_riscv64` config_setting (see Section 5) |
| BoringSSL crypto | TLS/AEAD/hash | Hand-tuned asm (AES-NI, AVX-512, SHA-NI) | Hand-tuned asm (NEON, SHA2, AES) | Scalar C fallback only; zero riscv64 asm files (vs. 23 for x86_64); compile-tested only via Android NDK cross-compile CI |
| QUICHE (HTTP/3) | HTTP/3 + QUIC | Full | Full | Build failure (missing header), root cause is the missing `linux_riscv64` platform, not QUICHE itself |
| LuaJIT | Lua filter JIT | Full JIT | Full JIT | Interpreter only; no upstream riscv64 DynASM backend exists outside an unmerged PR |
| V8 | Wasm JIT | Full JIT | Full JIT | "Unofficially supported" external port (ISCAS/PLCT team); Google's core owners retain veto over merges; not Google-committed |
| Wasmtime | Wasm JIT (Cranelift) | Full | Full | Formal Tier 3, but CI does build, test (QEMU) and release official riscv64gc and C-API artifacts; Winch baseline compiler has zero riscv64 support |
| WAMR | Wasm JIT/AOT/interpreter | Full | Full | Self-classified "Tier C" (experimental, "users accept full responsibility"), the lowest of WAMR's three tiers |
| Hyperscan | Regex acceleration | Full (AVX-512/SSE intrinsics) | Not applicable | Not applicable by design; hand-written x86 SIMD only, Intel has not pursued a port |
| Vectorscan | Regex acceleration (portable Hyperscan fork) | N/A | Full (SVE) | Confirmed build failures on real riscv64 hardware; no RVV1.0 backend in its SIMDe scalar-emulation fallback |
| re2 | Regex fallback | Full | Full | Builds (confirmed via Debian buildd), but no upstream CI exists for riscv64 or even for arm64 |
| simdutf | UTF-8/UTF-16/Base64 | AVX-512, SSE4.2 | NEON | RVV support exists but partial; a Base64 RVV path is still missing |
| Highway | SIMD dispatch | Full | Full | Partial; RVV runtime dispatch requires Clang 19+/GCC 15+, older toolchains fall back to scalar |
| zlib-ng | Compression (gzip) | Full SIMD | Full SIMD | Dedicated `arch/riscv/` directory with RVV and Zbc SIMD paths; CI-tested but QEMU-only (no native runner); binaries limited to Alpine edge |
| zstd | Compression | Full | Full | Arch detection added; RVV optimization work exists in open PRs, not yet merged |
| brotli | Compression | Full | Full | No CI build job at all for riscv64; upstream PR #1410 is CLA-blocked 6+ months, PR #1489 has zero maintainer comments |
| xxHash | Hashing (LB/consistent-hash) | Full | Full | RVV scalar+vector support merged and CI-tested on real hardware (SpacemiT X60, BananaPi BPI-F3, Sophgo SG2044) since v0.8.2 (2025-07), but not yet in a tagged release |
| Abseil | Base C++ utilities, CRC32C | Full | Full | Compiles (source-only for every arch), but has no CI at all for riscv64 (no GitHub Actions for any arch; internal Kokoro covers only amd64/arm64) |
| tcmalloc | Allocator | Optimized (per-CPU RSEQ asm) | Optimized (per-CPU RSEQ asm) | Not officially supported; riscv64 is absent from Google's own supported-platform docs, no per-CPU RSEQ assembly exists |
| jemalloc | Allocator (option) | Full | Full | Builds via generic fallback, not in upstream CI matrix; no riscv64-specific atomics/spin-wait (falls back to libatomic and a no-op spin-wait), functional but unoptimized |

**ISA extensions relevant to Envoy's workload:** Zbb (bit manipulation, hash functions), Zbc (carry-less multiply, CRC/GCM), V/RVV (compression, Unicode transcoding, regex), Zba (address generation). xxHash and zlib-ng already ship RVV/Zbc paths; simdutf and zstd have partial or in-flight RVV work; BoringSSL, Hyperscan/Vectorscan, LuaJIT and Highway (on older toolchains) have none. No Envoy-critical-path dependency has production-quality RVV coverage across the board.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively (bzlmod, `MODULE.bazel`). No CMake, autoconf, or other build backend exists for Envoy.

**Officially documented toolchain (amd64/arm64 only):**
- Clang >= 18 required for C++20; CI runs exactly Clang 18
- GCC >= 13 also supported
- Go >= 1.17 (used for BoringSSL and Buildifier tooling)
- Python >= 3.8.0
- Bazel via Bazelisk, version pinned in `.bazelversion`

No riscv64-specific toolchain requirements are documented anywhere because the architecture is unsupported.

**Official build commands (supported architectures only):**

```
bazel build -c opt envoy
bazel build -c dbg envoy
bazel build --config=clang envoy
bazel build --config=gcc envoy
bazel --bazelrc=/dev/null build -c opt envoy.stripped
```

**Flags relevant to a reduced/riscv64-shaped build:**

| Flag | Effect |
|---|---|
| `--define tcmalloc=disabled` | Disable tcmalloc (required off x86_64/aarch64) |
| `--define tcmalloc=gperftools` | Use the gperftools-based allocator path instead |
| `--//bazel:http3=False` | Disable HTTP/3 and QUICHE (workaround for the riscv64 QUICHE build failure) |
| `--//source/extensions/wasm_runtime/v8:enabled=false` | Disable the V8 Wasm runtime (required per issue #36342's self-patch) |

**Known riscv64 build failures:**

1. **QUICHE GSO batch writer header** ([issue #36342](https://github.com/envoyproxy/envoy/issues/36342), closed `not_planned`, 2024-11-04): `fatal error: quiche/quic/core/batch_writer/quic_gso_batch_writer.h: No such file or directory`. Root cause: `bazel/BUILD` defines no `linux_riscv64` `config_setting`, so `select({"@envoy//bazel:linux": [...]})` expressions never match on riscv64. Reporter's self-found fix (add `config_setting(name = "linux_riscv64", values = {"cpu": "riscv64"})` and add it to the `linux` and `not_x86` group memberships) was never upstreamed. Workaround: `--//bazel:http3=False`.
2. **`rules_python` riscv64 incompatibility** (reported by Boring545, 2024-09-28): blocks Bazel from running on any Envoy version newer than the unsupported v1.26.4, which is why the maintainer's request to reproduce on a current release was never answered. [NEEDS VERIFICATION: no linked upstream `rules_python` issue was found in the Envoy thread itself.]
3. **BoringSSL FIPS hard error:** `bazel/external/boringssl_fips.genrule_cmd` explicitly rejects non-x86_64/non-aarch64 targets; any `--config=boringssl-fips` build on riscv64 fails at the Bazel rule level, independent of the QUICHE issue.
4. **V8 Wasm extension:** failed to compile on riscv64 in the reporter's v1.26.4 build and had to be explicitly disabled.

**Cross-compilation and QEMU:** `ci/run_envoy_docker.sh` uses `multiarch/qemu-user-static`/`tonistiigi/binfmt` for multi-arch Docker builds, but the pinned build image (`envoyproxy/envoy-build-ubuntu:v0.1.6`) has no riscv64 variant and ships no riscv64 cross-compiler or sysroot, so QEMU emulation cannot be exercised without a corresponding build image that does not exist. `ci/do_ci.sh` maps `ENVOY_BUILD_ARCH` to `amd64`/`arm64` build-arch directories explicitly; riscv64 falls through to a generic, undefined path.

**Out-of-tree alternative:** the only documented successful riscv64 build path beyond the abandoned v1.26.4 self-patch is [rcore-os/tgoskits PR #1559](https://github.com/rcore-os/tgoskits/pull/1559), which cross-compiles Envoy v1.38.3 from source for riscv64 using musl and clang-18, entirely outside envoyproxy/envoy's own build infrastructure.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (cannot work at all on riscv64):**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| HTTP/3 / QUIC | Full | Full | Build failure | `select()` never resolves riscv64 as a linux target; workaround is to disable HTTP/3 entirely |
| BoringSSL FIPS mode | Full | Full | Hard build error | `boringssl_fips.genrule_cmd` rejects riscv64 at the Bazel rule level |
| Hyperscan regex acceleration | Full (AVX-512) | Not applicable | Not applicable | x86-only by design; [intel/hyperscan#340](https://github.com/intel/hyperscan/issues/340) confirms non-x86 is out of scope |
| Vectorscan regex acceleration | N/A | Full (SVE) | Not applicable | [#74](https://github.com/VectorCamp/vectorscan/issues/74) "Add RISC-V support" closed duplicate/wontfix; confirmed build failures on real hardware |
| Lua filter JIT | Full (x86 JIT) | Full (ARM64 JIT) | Interpreter only | No upstream LuaJIT riscv64 backend; PR #1267 open since Sep 2024, unmerged |
| V8 Wasm JIT | Full | Full | Externally maintained, non-Google-committed | Reachable only via an unofficial third-party port |
| Official binaries/images | Yes | Yes | No | No GitHub release assets, no Docker manifest entry |

**Performance gaps (from missing SIMD/hardware acceleration):**

- **TLS throughput:** BoringSSL has no riscv64 crypto assembly (no AES-GCM or SHA hardware acceleration). TLS termination throughput will be materially lower than amd64/arm64. Data not available: no public riscv64 BoringSSL benchmark was found.
- **Compression:** zlib-ng has RVV/Zbc SIMD paths but only QEMU-tested; zstd and brotli lag behind, with brotli having no riscv64 CI build at all.
- **Lua filter throughput:** interpreter-only LuaJIT on riscv64 is expected to be substantially slower than the JIT path on amd64/arm64 for Lua-heavy filter chains. [NEEDS VERIFICATION: no Envoy-specific measured figure exists; this is inferred from LuaJIT's general JIT-vs-interpreter characteristics, not a measured benchmark.]
- **Regex:** neither Hyperscan nor Vectorscan is usable on riscv64; Envoy would fall back to re2, which itself has no riscv64 CI of its own.

**Security hardening gaps:** BoringSSL FIPS mode is unavailable on riscv64 (hard build error), so FIPS-validated cryptography cannot currently be achieved with Envoy on riscv64 through the default TLS provider.

**Ecosystem consumer impact:** two independent downstream projects have dropped or limited Envoy specifically because of the missing riscv64 image: KinD v0.33 substitutes HAProxy for Envoy because "the upstream Envoy image does not publish `linux/riscv64`," and Cilium's riscv64 support is explicitly marked experimental with cilium-envoy (its L7 proxy) excluded, meaning no HTTP-aware policies are available on riscv64 Cilium deployments.

**Floating-point / NaN correctness:** No riscv64-specific floating-point or NaN correctness issues were found in the envoyproxy/envoy issue tracker via targeted searches ("riscv64 performance", "riscv64 bug", "riscv nan floating point"), all of which returned zero results. Data not available: no riscv64-specific numerical-correctness investigation of Envoy's dependencies was performed beyond issue-tracker search.

## 7. CI/CD Infrastructure

**CI system:** GitHub Actions exclusively. All 60 files in `.github/workflows/` were read and grepped in full (a secondary source, RISE's own Envoy report, cites 58 files; the discrepancy is likely due to a different point-in-time snapshot, and the 60-file count here reflects a direct, current full-clone read). Zero files contain "riscv" in any casing. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. There is no riscv64 CI of any kind: no build-only job, no QEMU-emulated job, no nightly job, no `workflow_dispatch`-only job. A repository-wide, case-insensitive grep for "riscv" surfaces exactly two non-CI, vendored-boilerplate matches (a BoringSSL compat patch script and an auto-generated Rust/cargo target-triple table), neither under `.github/` and neither defining any trigger, runner, or build/test step.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build jobs | Yes, primary target | Yes, dedicated jobs | No |
| Test jobs | Yes | Yes | No |
| Release container jobs | Yes | Yes | No |
| QEMU emulation option | N/A | N/A | No (no matching build image exists) |
| RBE (Remote Build Execution) | Yes (engflow) | Yes (engflow) | No |
| Self-hosted hardware runners | No | No | No |
| RISE-provided CI runners | No | No | No |

**Stated blocker** (`yanavlasov`, 2025-12-31): Envoy's CI runs exclusively on AWS and GCP, neither of which offers riscv64 instance types. Until a major cloud provider (or an alternative CI provider the maintainers accept) offers riscv64 compute, there is no way to build or test riscv64 binaries in CI.

**RISE involvement:** None found. The RISE project blog (36 posts, May 2024-Sept 2026, fully enumerated) contains no post about Envoy; topics covered instead include Go on RISC-V, Rust's Tier 1 port, LLVM/SLEEF vectorized math, V8 for RISC-V, PyTorch and Python's official RISC-V support, OpenSBI, IREE, Yocto, and RISC-V CI runners. The RISE riscv64 wheel builder lists 78 packages; Envoy is not among them. The RISE GitHub org (52 repos across both enumerated pages, including `cilium` but not `envoy`) has no Envoy-related repository. No RISE-funded work or RISE CI runners are associated with Envoy.

## 8. Distribution and Release Status

**Official release binaries:** confirmed against v1.39.1 (latest), v1.39.0, v1.38.4, v1.37.6 and v1.36.10. Each release publishes exactly: `envoy-<ver>-linux-aarch_64`, `envoy-<ver>-linux-x86_64`, `envoy-contrib-<ver>-linux-aarch_64`, `envoy-contrib-<ver>-linux-x86_64`, `debs.tar.gz`, `checksums.txt.asc`, and source archives. No riscv64 asset exists in any release. Direct HTTP probes confirm this live: `.../releases/download/v1.39.1/envoy-1.39.1-linux-x86_64` and `...-linux-aarch_64` both return HTTP 200, while `...-linux-riscv64` and `envoy-contrib-1.39.1-linux-riscv64` both return HTTP 404.

**Docker images:** the official `envoyproxy/envoy` Docker Hub repository lists only `linux/amd64` and `linux/arm64` manifests for current tags (e.g. `tools-dev`: amd64 179.6 MB, arm64 171.73 MB). No `linux/riscv64` variant exists. This absence is the documented reason KinD v0.33 substitutes HAProxy for Envoy.

**PyPI:** there is a package literally named `envoy` on PyPI (`envoy-0.0.3-py2.py3-none-any.whl`, `.tar.gz`), but it is an unrelated project (Kenneth Reitz's "Python Subprocesses for Humans" subprocess wrapper, abandoned since 2013), not envoyproxy/envoy. It is architecture-independent and irrelevant to the C++ proxy's riscv64 status.

**RISE wheel builder:** the same PyPI `envoy` package name redirects through the RISE GitLab wheel-builder API to plain PyPI, with no riscv64-specific wheel and, per the above, no relevance to the actual Envoy proxy.

**Ubuntu (26.04 "resolute"):** there is no package literally named `envoy` for any architecture, including riscv64. The only name matches are `golang-github-envoyproxy-protoc-gen-validate-dev` (an unrelated Go protobuf codegen tool) and `python3-envoy-utils` (utilities for Enphase Envoy solar inverter hardware, an unrelated product). Debian similarly has no `envoy` binary package; its only matches are the same category of unrelated, architecture-independent helper packages.

**Arch Linux RISC-V port** (archriscv.felixc.at): no package named `envoy` or `envoyproxy` is listed.

**What a user must do to get a working riscv64 binary today:**
1. Apply the unpublished `bazel/BUILD` patch adding a `linux_riscv64` `config_setting` (from issue #36342; never upstreamed).
2. Disable HTTP/3 via `--//bazel:http3=False`.
3. Disable the V8 Wasm runtime via `--//source/extensions/wasm_runtime/v8:enabled=false`.
4. Disable tcmalloc via `--define tcmalloc=gperftools` or `--define tcmalloc=disabled`.
5. Resolve the `rules_python` riscv64 incompatibility (no documented fix exists for current Envoy versions).
6. Build natively on riscv64 hardware or via an out-of-tree cross-compile path such as the musl/clang-18 approach used by [rcore-os/tgoskits PR #1559](https://github.com/rcore-os/tgoskits/pull/1559).
7. The result is an unofficial, unpublished binary with HTTP/3, Lua JIT acceleration, and the V8 Wasm runtime disabled.

The last confirmed successful native build is Envoy v1.26.4 (end-of-life). No confirmed successful build of a current supported release exists in any source reviewed.

## 9. Dependencies

| Dependency | Relation | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|---|
| Bazel | build-dependency | critical | Data not available | Data not available | Data not available | No Bazel-proper riscv64 build/CI research was performed; Envoy's use of it is already blocked indirectly by the `rules_python` gap below |
| LLVM | build-dependency | critical | Data not available | Data not available | Data not available | Envoy requires Clang (LLVM) >= 18; no riscv64-specific LLVM/Clang status was researched for this report |
| GCC | build-dependency | critical | Data not available | Data not available | Data not available | Envoy also supports GCC >= 13 as a toolchain option; no riscv64-specific research performed |
| Go | build-dependency | critical | Data not available | Data not available | Data not available | Required for BoringSSL and Buildifier tooling; no riscv64-specific research performed for this report (RISE's blog inventory lists a "Go on RISC-V" post, but its content was not reviewed here) |
| Python | build-dependency | critical | Data not available | Data not available | Data not available | Required >= 3.8; RISE's blog inventory lists a "Python official RISC-V support" post, but its content was not reviewed here |
| rules_python | build-dependency | critical | No | No | No | Confirmed incompatible with riscv64 per [issue #36342](https://github.com/envoyproxy/envoy/issues/36342); this blocks Bazel itself from running on any current Envoy version on riscv64, independent of the QUICHE fix |
| googletest | test-dependency | critical | Data not available | Data not available | Data not available | No riscv64-specific research performed for this report |
| BoringSSL | runtime-dependency | critical | Partial (Android NDK cross-compile CI only, compile-only, 2 builders) | No | No (source-only) | Zero riscv64 assembly optimizations (0 asm files vs. 23 for x86_64); FIPS-module riscv64 status is [NEEDS VERIFICATION] |
| OpenSSL | runtime-dependency | optional | Yes | Yes | Yes (backported across active stable branches) | Dedicated `riscv-more-cross-compiles.yml` CI covering 13 RVV-extension configurations; the strongest riscv64 story of any Envoy crypto dependency |
| aws-lc | runtime-dependency | optional | Partial [NEEDS VERIFICATION] | Unknown | No | BUILDING.md reportedly lists x86_64 and ARM/AArch64 only, with no riscv64 CI detected; single-source claim |
| LuaJIT | runtime-dependency | optional | No (interpreter only) | No | No | No upstream riscv64 DynASM backend outside [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) (Sep 2024, 11k+ lines, unmerged; sole maintainer Mike Pall has never commented); Ubuntu Noble excludes the riscv64 JIT binary entirely; Debian trixie/sid ship a JIT build only via the OpenResty fork, not upstream |
| V8 | runtime-dependency | optional | Partial (community-maintained) | Partial (RISC-V team's own CI, non-release-blocking) | No official binaries | "Unofficially supported" port owned by an external ISCAS/PLCT team; Google's core owners retain a required second `+2` veto; CLs can stall behind `Review-Enforcement` |
| Wasmtime | runtime-dependency | optional | Yes | Yes (QEMU only, no native hardware runner, no continuous fuzzing) | Yes (official riscv64gc-linux and C-API tarballs) | No full-time maintainer for the port (organizational, not technical); Winch baseline compiler has zero riscv64 support; open Cranelift crashes: [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) |
| WAMR | runtime-dependency | optional | Experimental | Partial (QEMU+NuttX job only, non-blocking) | No | Self-classified "Tier C" ("experimental...users accept full responsibility"), the lowest of WAMR's three tiers; no committed maintainer, no release path |
| hyperscan | runtime-dependency | optional | No | No | No | x86-only by design (hand-written SSE/AVX intrinsics); [intel/hyperscan#340](https://github.com/intel/hyperscan/issues/340) confirms non-x86 is out of scope |
| Vectorscan | runtime-dependency | critical | No (confirmed build failures on real hardware) | No (no RVV1.0 backend in SIMDe) | No | [#74](https://github.com/VectorCamp/vectorscan/issues/74) "Add RISC-V support" closed duplicate/wontfix; [#329](https://github.com/VectorCamp/vectorscan/issues/329) "How can I build on real RISC-V?" unanswered/closed; [#330](https://github.com/VectorCamp/vectorscan/issues/330) RVV1.0 optimization request, no timeline |
| re2 | runtime-dependency | critical | Yes (confirmed via Debian buildd) | No (no upstream CI for riscv64, or even arm64) | No official binaries (distro packages exist) | Treated as "equivalent to arm64," but this is unverified by upstream CI |
| simdutf | runtime-dependency | optional | Partial | Partial | Partial | RVV support exists; Base64 RVV path still missing ([issue #380](https://github.com/simdutf/simdutf/issues/380)) |
| Highway | runtime-dependency | optional | Partial | Partial | Partial | RVV runtime dispatch requires Clang 19+/GCC 15+; older toolchains fall back to scalar; mold linker issue reported |
| Abseil | runtime-dependency | critical | Yes (compiles, source-only) | No CI at all for riscv64 (no GitHub Actions for any arch; internal Kokoro covers amd64/arm64 only) | No official binaries | Zero CI gating for riscv64 means regressions ship undetected |
| Protocol Buffers | runtime-dependency | critical | Yes | Partial | Yes | Builds on riscv64; a prior abseil-related build failure was fixed in 2023 [carried from prior report, NEEDS VERIFICATION] |
| gRPC | runtime-dependency | critical | Partial | Partial | No (Python wheels not published; [grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591), Feb 2026) | C++ core likely builds; the missing item is Python riscv64 wheel publication, lower impact for Envoy's C++ data plane |
| quiche | runtime-dependency | optional | Blocked by Envoy-side integration, not QUICHE itself | N/A | N/A | Envoy's own `select()` gap (Section 5) is the proximate cause of the riscv64 QUICHE build failure, not a QUICHE upstream defect |
| jemalloc | runtime-dependency | optional | Yes, via generic fallback (not in upstream CI matrix) [contradicts a separate, single-source claim that riscv64 cross-builds are unresolved per jemalloc/jemalloc#2399 -- flagged as a discrepancy] | No | No official binaries (distro packages work unpatched) | No riscv64-specific atomics/spin-wait optimization; falls back to libatomic and a no-op spin-wait, functional but unoptimized |
| tcmalloc | runtime-dependency | optional | Not officially supported | No CI runner | N/A (source-only, zero GitHub releases for any arch) | riscv64 absent from Google's own supported-platform docs entirely; no per-CPU RSEQ assembly for riscv64, the core tcmalloc performance mechanism |
| zlib-ng | runtime-dependency | optional | Yes, dedicated `arch/riscv/` directory with RVV + Zbc SIMD paths | Yes, but QEMU-only (no native runner; test corpora skipped for QEMU slowness) | Alpine edge only; no broad official binaries | Corrects an earlier, weaker "scalar only" characterization; zlib-ng's riscv64 story is materially better than previously assessed |
| zstd | runtime-dependency | optional | Partial | Partial | Yes | Architecture detection landed; RVV optimizations exist in open PRs, not yet merged |
| brotli | runtime-dependency | optional | No (no CI build job at all for riscv64) | No | No official binaries (distro packages exist) | Upstream PR #1410 is CLA-blocked 6+ months; PR #1489 has zero maintainer comments; this corrects an earlier, overly optimistic "portable, no issues" characterization |
| xxHash | runtime-dependency | optional | Yes, RVV scalar+vector CI since v0.8.2 (Jul 2025), tested on real SpacemiT X60 / BananaPi BPI-F3 / Sophgo SG2044 hardware | Yes, full `make check` under QEMU and real-hardware benchmarks | No, RVV support exists only on the dev branch, not yet in a tagged release | A pure release-cadence gap, not a technical one |
| ipp-crypto | runtime-dependency | optional | No | N/A | N/A | Architecturally x86-only (AVX2/AVX-512/SSE intrinsics); the GitHub repo could not be resolved via search this session (possibly renamed/archived) |
| qatlib | runtime-dependency | optional | N/A | N/A | N/A | Tied to Intel QuickAssist PCIe accelerator hardware, which has no RISC-V equivalent; should be disabled/excluded on riscv64 builds rather than tracked as "blocked." Related packages QATzip and QAT-ZSTD-Plugin share the same status |
| nghttp2 (indirect) | runtime-dependency | optional | Data not available | Data not available | Data not available | Confirmed as an actual Envoy dependency (a dedicated `project-reports/nghttp2.md` exists per live research), but its riscv64 specifics were not re-verified in this pass |
| libevent (indirect) | runtime-dependency | optional | Data not available | Data not available | Data not available | Confirmed as an actual Envoy dependency; riscv64 specifics not re-verified here |
| flatbuffers (indirect) | runtime-dependency | optional | Data not available | Data not available | Data not available | Confirmed as an actual Envoy dependency; riscv64 specifics not re-verified here |
| uadk (indirect) | runtime-dependency | optional | N/A | N/A | N/A | Linaro/Huawei Kunpeng (ARM64) accelerator offload; no riscv64 hardware target exists, same disposition as qatlib |

**Correction to prior assumptions:** Envoy's `MODULE.bazel` does not depend on gperftools; only tcmalloc, via the Bazel Central Registry. gperftools was investigated as a candidate dependency and dropped after confirming it is not actually referenced. (For context, an unrelated `gperftools/gperftools` riscv64 stack-trace issue, #1359, exists and is closed, but it is not a live Envoy dependency issue.)

**Deep-dive on the critical blocking dependencies:**

**LuaJIT.** The Lua filter is widely used for lightweight request/response transformation, and Envoy depends specifically on LuaJIT, not PUC Lua. With no riscv64 JIT backend, LuaJIT runs in interpreter mode on riscv64. PR #1267 has been open, unmerged, and uncommented by LuaJIT's sole maintainer since September 2024. This is the single largest identified performance gap for Lua-heavy Envoy deployments on riscv64.

**BoringSSL.** Envoy's default TLS provider. Hand-tuned assembly exists for x86_64 (AES-NI, VAES, AVX-512, SHA-NI, PCLMULQDQ) and AArch64 (NEON, AES, SHA2, PMULL); riscv64 has none, and the only CI coverage is a compile-only Android NDK cross-compile job with two builders. TLS termination throughput on riscv64 will be materially lower than amd64/arm64; exact delta is data not available. The FIPS build path additionally hard-rejects riscv64 at the Bazel rule level.

**Vectorscan / Hyperscan.** Envoy's default regex engine since v1.30 is Vectorscan (a portable Hyperscan fork). Neither Hyperscan (x86-only by design) nor Vectorscan (confirmed riscv64 build failures, no RVV1.0 SIMDe backend) works on riscv64. Envoy's fallback, re2, itself has no upstream riscv64 CI, so the entire regex-matching stack on riscv64 is either unusable or unverified by any upstream CI signal.

**V8 (Wasm runtime).** The most technically advanced RISC-V implementation among Envoy's JIT dependencies is owned by an external team (ISCAS/PLCT), not by Google's core V8 owners, who retain merge veto. This is an organizational risk as much as a technical one: V8's riscv64 capability exists, but its integration path into Envoy is unresolved, and the one WIP PR attempting a V8 version bump (#40235) closed unmerged.

**Wasmtime.** The strongest link among Envoy's optional runtime dependencies: official riscv64gc release artifacts exist, and CI builds, tests (via QEMU) and releases them. The gaps are organizational (no full-time riscv64 maintainer) and in the Winch baseline compiler (zero riscv64 support), not in the default Cranelift JIT path.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#36342](https://github.com/envoyproxy/envoy/issues/36342) | Build Error: Missing quiche header on RISC-V 64 (v1.26.4) | Closed `not_planned`, 2024-11-04 | High (blocks build) | `bazel/BUILD` missing `linux_riscv64` config_setting; user self-found fix never upstreamed; root cause applies to all current versions |
| [#42787](https://github.com/envoyproxy/envoy/issues/42787) | arch: official support for RISC-V (riscv64) | Closed `not_planned`, 2026-02-12 | Informational/strategic | Maintainer explicitly declined a roadmap, citing no riscv64 CI capacity on AWS/GCP; submitter's stated intent to port a PR never materialized |

No open riscv64-specific correctness or performance bugs exist in the envoyproxy/envoy issue tracker: targeted searches for "riscv64 performance," "riscv64 bug," and "riscv nan floating point" scoped to the repo all returned zero results. Both riscv64-related issues that do exist are closed.

**Open bugs in dependencies affecting Envoy on riscv64 (tracked in the dependency projects, not in envoyproxy/envoy itself):**

| Dependency | Issue | Severity |
|---|---|---|
| LuaJIT | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267), riscv64 JIT backend, open since Sep 2024, uncommented by the maintainer | High (performance) |
| Vectorscan | [#74](https://github.com/VectorCamp/vectorscan/issues/74) closed wontfix; [#329](https://github.com/VectorCamp/vectorscan/issues/329), [#330](https://github.com/VectorCamp/vectorscan/issues/330) open/unanswered | High (regex path unavailable) |
| Hyperscan | [intel/hyperscan#340](https://github.com/intel/hyperscan/issues/340), non-x86 out of scope | High (regex path unavailable) |
| Wasmtime | [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), open Cranelift riscv64 crashes | Medium |
| brotli | [PR #1410](https://github.com/google/brotli) CLA-blocked 6+ months; PR #1489 uncommented | Medium (compression path) |
| simdutf | [#380](https://github.com/simdutf/simdutf/issues/380), Base64 RVV path missing | Low |
| jemalloc | [#2399](https://github.com/jemalloc/jemalloc/issues/2399), riscv64 cross-build (single-source claim; contradicted by a separate finding that jemalloc builds via generic fallback) | Medium, [NEEDS VERIFICATION due to the contradiction] |
| gRPC | [#41591](https://github.com/grpc/grpc/issues/41591), Python riscv64 wheels not published | Low for Envoy's C++ data plane |

## 12. Objections and Upstream Blockers

**Stated objections (on record):**

1. **No CI capacity on major cloud providers** (`yanavlasov`, 2025-12-31, [issue #42787](https://github.com/envoyproxy/envoy/issues/42787)): *"There is no RISC-V support on AWS, or GCP where we have CI capacity."* This is the sole documented maintainer reason for declining a roadmap.
2. **No maintainer willing to own riscv64:** the governance model requires roughly 25% time commitment from an owning maintainer. No such contributor has emerged. The submitter of #42787 (wcz0910) offered to contribute build patches but never followed through with a PR.

**Technical blockers, in order of severity:**

1. `bazel/BUILD` missing a `linux_riscv64` config_setting; a self-found fix exists but was never upstreamed. Small, well-scoped change.
2. `rules_python` riscv64 incompatibility, blocking Bazel itself on any current, supported Envoy version.
3. BoringSSL FIPS hard rejection of non-x86_64/non-aarch64 targets.
4. LuaJIT has no riscv64 JIT backend (upstream PR #1267, open 12+ months, uncommented).
5. V8 Wasm runtime integration on riscv64 is unresolved on the Envoy side and depends on an externally-owned, Google-vetoed port.
6. Vectorscan/Hyperscan regex acceleration is entirely unavailable, forcing a fallback to re2, which itself carries no riscv64 CI signal.

**Organizational blockers:**

- Both riscv64 issues closed `not_planned` via stalebot without follow-through from either submitter.
- No RISE involvement of any kind was found (Section 7). RISE's Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) include Google, a company with seven Envoy maintainer seats, yet no RISE-Envoy connection of any kind (blog post, wheel-builder entry, CI runner arrangement) was found despite that overlap.
- No chip vendor with a current Envoy maintainer seat exists; the one company (Google) that sits on both the RISE Premier member list and the Envoy maintainer list has not, per available evidence, directed any riscv64 effort toward Envoy specifically.

**Acceptance probability for an upstreaming PR:** Low in the short term if submitted without accompanying CI infrastructure. The maintainer's position is that CI capability is a prerequisite, and CI capability requires riscv64 instances on AWS or GCP (neither currently available) or an alternative CI provider the maintainers agree to accept. A PR paired with a concrete, maintainer-accepted CI provider arrangement (for example RISE-hosted runners) has a materially better chance, consistent with the project's stated willingness to add maintainers who bring resources.

## 13. Readiness Assessment

**Color:** orange (no-upstream-ci-no-release-no-distro)

**Release provider:** none

**Justification:** Envoy has zero riscv64 upstream CI (all ~58-60 `.github/workflows/*.yml` files contain no riscv/riscv64 references, and no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml` exist), publishes no riscv64 release binaries or container images (only `linux-aarch_64`/`linux-x86_64` GitHub release assets and `linux/amd64,linux/arm64` Docker images; a direct probe of v1.39.1's riscv64 asset URL returned HTTP 404), and is not packaged for riscv64 by any major distro (Ubuntu resolute, Debian, Arch RISC-V all lack an "envoy" package). Maintainer `yanavlasov` stated on [issue #42787](https://github.com/envoyproxy/envoy/issues/42787) (2025-12-31): "We do not have a roadmap for RISC-V. The main issue is that there is no RISC-V support on AWS, or GCP where we have CI capacity." This is not "confirmed broken" (red) because the one documented build failure, [issue #36342](https://github.com/envoyproxy/envoy/issues/36342), was against an EOL v1.26.4 build and was never re-verified on a current supported release. It lands at orange under the "no upstream CI / no test / no release" classification.

**Pending work that could change the grade:** Issue #42787, the closest thing to a tracking issue, was closed `not_planned` by stalebot on 2026-02-12 after the submitter (wcz0910) stated intent to port patches to `main` and open a PR, which never materialized. Issue #36342's self-found fix (adding a `linux_riscv64` Bazel `config_setting`) was likewise never upstreamed. No RISE involvement was found anywhere (no RISE blog post, wheel-builder entry, or CI-runner arrangement mentions Envoy). The hard blocker maintainers cite is CI capacity: no riscv64 instances on AWS or GCP, Envoy's only current CI providers. Absent a change in cloud-provider riscv64 availability, a maintainer willing to own the port, or a third-party CI arrangement the maintainers accept, this grade is not expected to change.

## 14. Investment Analysis

RISE has no funded work on Envoy of any kind (Section 7, Section 12). Every item below is net-new, unfunded investment; nothing is pre-done.

### 14.1 Functional Enablement

1. **Fix `bazel/BUILD` `linux_riscv64` config_setting and upstream it.** The fix is already documented (issue #36342); this is a one-block `config_setting` plus two group-membership additions. Roughly 1 engineer-day.
2. **Resolve `rules_python` riscv64 incompatibility.** Requires diagnosing the exact failure mode on a current Envoy version and either contributing a fix upstream to `rules_python` or implementing a Bazel-side workaround. Estimated 2-4 person-weeks.
3. **Verify and enable HTTP/3 (QUICHE) on riscv64** once `linux_riscv64` is a registered linux target; requires integration testing. Estimated 1-2 person-weeks.
4. **Resolve the BoringSSL FIPS hard rejection.** Not blocking for non-FIPS deployments. For FIPS-required deployments, requires either upstreaming a riscv64 FIPS build to BoringSSL or substituting aws-lc (which has its own, weaker, single-source riscv64 story). Estimated 4-8 person-weeks.
5. **V8 Wasm runtime build integration.** Requires engaging the externally-owned ISCAS/PLCT riscv64 port and resolving Google's `Review-Enforcement` veto path, in addition to Envoy-side integration. Estimated 2-4 person-weeks of Envoy-side work, contingent on unblocking merges upstream in V8 (outside Envoy's control).

### 14.2 Performance Optimization

1. **LuaJIT riscv64 JIT backend.** Blocked on upstream PR #1267 (open since Sep 2024, uncommented by the sole maintainer). Contributing to or effectively taking ownership of that PR. Estimated 12-20 person-weeks for a production-quality backend; a partial JIT (basic blocks only) is estimated at 4-8 person-weeks. Highest-leverage item for Lua-filter-heavy deployments.
2. **BoringSSL riscv64 crypto assembly** (AES-GCM, ChaCha20-Poly1305, SHA-256/384/512 using Zbc/Zbkb/RVV). Comparable in scope to the existing AArch64 crypto-assembly effort. Estimated 16-24 person-weeks.
3. **Vectorscan riscv64 RVV1.0 backend** (per open issue #330). No current upstream commitment exists; this would need to be driven externally. Estimated 8-16 person-weeks, speculative given no stated maintainer interest.
4. **zstd RVV vectorization.** Merge or contribute to existing open upstream PRs. Estimated 4-8 person-weeks.
5. **simdutf Base64 RVV path** (issue #380). Estimated 2-4 person-weeks.
6. **brotli riscv64 CI and build enablement**, unblocking the CLA-stalled PR #1410 or contributing a fresh one. Estimated 4-6 person-weeks, contingent on resolving the CLA blocker (outside engineering control).

### 14.3 CI/CD Infrastructure

1. **Provision riscv64 CI runners acceptable to Envoy maintainers.** Requires explicit agreement with maintainers on provider (RISE-hosted runners or a dedicated cloud/bare-metal arrangement), since AWS/GCP are ruled out. Estimated 2-4 person-weeks engineering, plus ongoing infrastructure cost. This is the gating item for all upstreaming per the maintainer's own stated position.
2. **riscv64 build image** (an `envoyproxy/envoy-build-ubuntu` riscv64 variant with Clang 18, Bazelisk, and the required toolchain). Estimated 2-4 person-weeks initial, plus maintenance overhead.
3. **Native riscv64 CI jobs in `.github/workflows/`**, mirroring the existing arm64 job structure. Estimated 1-2 person-weeks once runners and a build image exist.

### 14.4 Ecosystem Enablement

Envoy itself has no significant dependent package ecosystem (no PyPI wheels, no npm packages, no Maven JARs distribute the proxy binary; the PyPI package named "envoy" is an unrelated project). The relevant gap is distribution of the proxy binary and image itself, not a dependent-package ecosystem.

1. **Official riscv64 release binary**: add `envoy-<ver>-linux-riscv64` to the GitHub release process. Requires CI to exist first. Estimated 1-2 person-weeks once CI is operational.
2. **Official riscv64 Docker image**: add a `linux/riscv64` manifest entry. Requires the build image and CI from Section 14.3. Estimated 1-2 person-weeks. This single change would directly restore Envoy as a viable L7 proxy for downstream consumers such as KinD and Cilium, which currently work around its absence.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `bazel/BUILD` `linux_riscv64` config_setting and upstream PR | 0.2 | Envoy contributor | Critical |
| Functional | Resolve `rules_python` riscv64 incompatibility | 2-4 | Envoy contributor + rules_python upstream | Critical |
| Functional | Verify QUICHE/HTTP3 on riscv64 after the Bazel fix | 1-2 | Envoy contributor | High |
| Functional | V8 Wasm runtime build integration on riscv64 | 2-4 (plus upstream-dependent V8 work) | Envoy + V8/ISCAS-PLCT contributor | High |
| Functional | BoringSSL FIPS on riscv64 (FIPS deployments only) | 4-8 | BoringSSL / aws-lc upstream | Medium |
| CI/CD | Provision riscv64 CI runners + build image | 2-4 | Infrastructure / RISE | Critical, gates all upstreaming |
| CI/CD | Add riscv64 CI jobs to `.github/workflows/` | 1-2 | Envoy contributor | Critical, gates upstreaming |
| CI/CD | Official riscv64 release binary + Docker image | 1-2 each | Envoy contributor | High, restores downstream ecosystem viability (KinD, Cilium) |
| Performance | LuaJIT riscv64 JIT backend (upstream PR #1267) | 12-20 | LuaJIT upstream | High |
| Performance | BoringSSL riscv64 crypto assembly | 16-24 | BoringSSL upstream | Medium |
| Performance | Vectorscan riscv64 RVV1.0 backend | 8-16 | Vectorscan upstream | Medium, speculative |
| Performance | zstd RVV vectorization (merge open PRs) | 4-8 | zstd upstream | Low |
| Performance | simdutf Base64 RVV path | 2-4 | simdutf upstream | Low |
| Performance | brotli riscv64 CI/build enablement | 4-6 | brotli upstream | Low, CLA-blocked |

**Critical path:** CI infrastructure (runners plus build image) is the gate for all upstreaming, per the maintainers' own stated position. The Bazel config fix is trivial once CI exists. LuaJIT's JIT backend is the highest-leverage performance investment for Lua-filter-heavy workloads; BoringSSL crypto assembly is the highest-leverage investment for TLS-heavy workloads.

## 15. References

- [Issue #42787: arch: official support for RISC-V (riscv64)](https://github.com/envoyproxy/envoy/issues/42787)
- [Issue #36342: Build Error: Missing quiche header on RISC-V 64](https://github.com/envoyproxy/envoy/issues/36342)
- [PR #18474: deps: Bump com_github_zlib_ng_zlib_ng -> 2.0.5](https://github.com/envoyproxy/envoy/pull/18474)
- [PR #40235: WIP deps: bump up V8 to 13.6.233.8](https://github.com/envoyproxy/envoy/pull/40235)
- [PR #41975: build(deps): bump frozendict 2.4.6 to 2.4.7](https://github.com/envoyproxy/envoy/pull/41975)
- [PR #42919: Add bzlmod-only patch for emsdk 4.0.22](https://github.com/envoyproxy/envoy/pull/42919)
- [PR #15386: Attempt to fix buildx/multiarch build flakiness](https://github.com/envoyproxy/envoy/pull/15386)
- [Envoy GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md)
- [Envoy OWNERS.md](https://github.com/envoyproxy/envoy/blob/main/OWNERS.md)
- [Envoy bazel/BUILD](https://github.com/envoyproxy/envoy/blob/main/bazel/BUILD)
- [Envoy bazel/SSL.md](https://github.com/envoyproxy/envoy/blob/main/bazel/SSL.md)
- [Envoy bazel/external/boringssl_fips.genrule_cmd](https://github.com/envoyproxy/envoy/blob/main/bazel/external/boringssl_fips.genrule_cmd)
- [Envoy bazel/README.md](https://github.com/envoyproxy/envoy/blob/main/bazel/README.md)
- [Envoy ci/do_ci.sh](https://github.com/envoyproxy/envoy/blob/main/ci/do_ci.sh)
- [Envoy ci/run_envoy_docker.sh](https://github.com/envoyproxy/envoy/blob/main/ci/run_envoy_docker.sh)
- [Envoy install docs (architecture support statement)](https://www.envoyproxy.io/)
- [rcore-os/tgoskits PR #1559 (out-of-tree riscv64/loongarch64 cross-compile)](https://github.com/rcore-os/tgoskits/pull/1559)
- [LuaJIT PR #1267: riscv64 JIT backend](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [Vectorscan Issue #74: Add RISC-V support, closed wontfix](https://github.com/VectorCamp/vectorscan/issues/74)
- [Vectorscan Issue #329: How can I build on real RISC-V?](https://github.com/VectorCamp/vectorscan/issues/329)
- [Vectorscan Issue #330: RVV1.0 optimization request](https://github.com/VectorCamp/vectorscan/issues/330)
- [intel/hyperscan Issue #340: non-x86 architecture support out of scope](https://github.com/intel/hyperscan/issues/340)
- [Wasmtime Issue #12195](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [Wasmtime Issue #11050](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [Wasmtime Issue #13959](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [simdutf Issue #380: Base64 RVV path missing](https://github.com/simdutf/simdutf/issues/380)
- [gRPC Issue #41591: Python riscv64 wheels not published](https://github.com/grpc/grpc/issues/41591)
- [jemalloc Issue #2399: riscv64 cross-build status](https://github.com/jemalloc/jemalloc/issues/2399)
- [gperftools Issue #1359: broken stack trace on riscv64 (unrelated, non-dependency reference)](https://github.com/gperftools/gperftools/issues/1359)
- [go-riscv/kind: HAProxy retained in place of Envoy for riscv64](https://github.com/go-riscv/kind)
- [Cilium riscv64 release notes: cilium-envoy excluded](https://github.com/12345qwert123456/k3s.RISC-V/releases/tag/v1.20.2-cilium-riscv64)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/category/blog/)
- [Envoy CNCF project page](https://www.cncf.io/projects/envoy/)
- [Envoy homepage](https://www.envoyproxy.io/)