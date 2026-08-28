---
title: pgvector
---

# pgvector

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for pgvector<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

pgvector is a PostgreSQL extension that adds vector similarity search (L2, inner product, cosine, Hamming, Jaccard distances) using HNSW and IVFFlat index types. It is the dominant open-source vector database solution built on PostgreSQL and is widely used in AI/ML retrieval-augmented generation (RAG) workloads.

**Governance:** The project has no foundation, no steering committee, and no formal governance body. It operates under the [PostgreSQL License](https://github.com/pgvector/pgvector/blob/master/LICENSE), a permissive BSD-style license. One person dominates it operationally.

**Corporate maintainers:**
- Andrew Kane (GitHub: `ankane`): 1,916 of approximately 1,950 total commits (>98%). No corporate affiliation listed publicly. Independent developer based in San Francisco.
- Heikki Linnakangas (`hlinnaka`): 18 commits. PostgreSQL core developer, employed by Supabase.
- All other contributors: 1-6 commits each, one-off community contributions.

**RISE membership:** pgvector is not a RISE Project member and does not appear in the [RISE Project member list](https://riseproject.dev). No RISE blog post mentions pgvector. pgvector is not listed in the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/).

**Community culture on new ports:** The maintainer is receptive to minimal-overhead portability fixes. PR #948 (riscv64 Makefile fix) was reviewed and merged within one day. The pattern established by both PowerPC and riscv64 is: suppress the unsupported `-march=native` flag via a Makefile conditional, merge immediately, add no CI runner. Architecture-specific SIMD work is a different story -- see Section 12.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-01-13 | PR #948 opened by MengMengDaXiaoJi (Jack Huang): clear OPTFLAGS on riscv64 to avoid unsupported `-march=native` | [PR #948](https://github.com/pgvector/pgvector/pull/948) |
| 2026-01-14 | PR #948 merged by ankane; fix ships as unreleased at this point | [PR #948 merge](https://github.com/pgvector/pgvector/pull/948) |
| 2026-02-25 | v0.8.2 released -- first release containing the riscv64 Makefile fix | [v0.8.2 release](https://github.com/pgvector/pgvector/releases/tag/v0.8.2) |

The merge commit SHA is `544686feb10b924587aa0059bbcc351988085131`. This is the only riscv64-specific commit in the entire repository history. There is no tracking issue, no roadmap entry, and no follow-on riscv64 work planned.

**Upstreaming status:** The single portability fix is fully upstream as of v0.8.2. No downstream patches exist in the research findings. No riscv64-specific functional or SIMD work has been proposed or merged.

---

## 3. Upstream Support Tier

pgvector has no formal platform tier policy and no published tier documentation. The CI matrix is the de facto definition of supported platforms.

| Tier criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner present | Yes (ubuntu-{22,24,26}.04) | Yes (ubuntu-{22,24,26}.04-arm) | No |
| Test suite passes | Yes (automated) | Yes (automated) | Unknown -- no CI |
| Official Docker image | Yes (linux/amd64) | Yes (linux/arm64) | No |
| Makefile builds | Yes | Yes | Yes (PR #948) |
| Release-blocking | Yes | Yes | No |

riscv64 is not a supported platform in any formal sense. It compiles and the Debian build daemon has produced a binary, but the maintainer has made no commitment to riscv64 correctness, test coverage, or release artifacts.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

pgvector performs distance computation (L2, inner product, cosine, Hamming, Jaccard) in tight loops over float32, float16 (halfvec), and bit vectors. These loops are the performance-critical paths and are the only place where SIMD matters.

**SIMD dispatch architecture (x86-64 only):**
- `src/halfvec.h`: defines `HALFVEC_DISPATCH` gated on `defined(__x86_64__) || defined(_M_AMD64)` exclusively. No `#elif defined(__riscv)` branch exists.
- `src/halfutils.c`: implements AVX + F16C + FMA dispatch table for half-float distances. Only compiled and dispatched on x86-64.
- `src/bitutils.c`: implements AVX-512 + VPOPCNTDQ dispatch for Hamming and Jaccard on bit vectors. Only compiled and dispatched on x86-64.
- `src/vector.c`: uses `__attribute__((target_clones(...)))` with `VECTOR_TARGET_CLONES` for float32 distance functions. This path requires `__gnu_linux__` and is irrelevant on riscv64.

**Component coverage table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| float32 L2 / inner product / cosine distance | Partial SIMD (FMA via target_clones) | Scalar | Scalar |
| float16 L2 / inner product / cosine / L1 distance | Full SIMD (AVX + F16C + FMA dispatch) | Scalar | Scalar |
| Bit Hamming / Jaccard distance | Full SIMD (AVX-512 VPOPCNTDQ dispatch) | Scalar | Scalar |
| JIT (LLVM bitcode) | Available (PostgreSQL JIT permitting) | Available (PostgreSQL JIT permitting) | Available (PostgreSQL JIT permitting) |
| Build system | Full | Full | Partial (only `-march=native` suppression) |
| CI | Full | Full | Absent |

**Note on arm64:** arm64 is in the same position as riscv64 for SIMD -- no NEON, no SVE intrinsics are present in the upstream source. Two PRs proposed arm64 SIMD (PR #852 NEON, PR #536 SVE) and both were closed without merge. riscv64 is not uniquely disadvantaged relative to arm64 on distance computation performance.

**JIT:** pgvector ships PostgreSQL bitcode (`.bc` files) for JIT inlining of distance kernels into query plans. This is not riscv64-specific; it depends entirely on whether PostgreSQL's LLVM JIT is available on riscv64. pgvector itself has no riscv64-specific JIT code.

**No assembly files, no crypto primitives, no GC barriers:** pgvector has no `.S` assembly files, no cryptographic code, and no garbage collector barriers. It is a pure C PGXS extension.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** PGXS (PostgreSQL Extension Build Infrastructure). No CMake, no Meson, no autoconf. The build is driven by `Makefile` at the repo root.

**Standard native build on riscv64:**
```sh
git clone --branch v0.8.6 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

**Effective compiler flags on riscv64 (post PR #948):**
```
-ftree-vectorize -fassociative-math -fno-signed-zeros -fno-trapping-math -ffp-contract=fast
```
The `-march=native` flag is stripped by the Makefile conditional:
```makefile
# RISC-V64 doesn't support -march=native
ifeq ($(shell uname -m), riscv64)
    OPTFLAGS =
endif
```

**Portability build (explicit, equivalent to riscv64 default):**
```sh
make OPTFLAGS=""
```
The official Dockerfile uses `make OPTFLAGS=""` unconditionally for portability.

**RVV auto-vectorization:** The auto-vectorization flags (`-ftree-vectorize` etc.) are applied on riscv64, but without `-march=...v` (V-extension suffix), the compiler cannot emit RVV instructions. Setting a custom OPTFLAGS with an appropriate `-march` would theoretically allow RVV auto-vectorization, but this is not documented, not tested, and not set by default.

**Toolchain requirements:** No explicit minimum GCC or Clang version is documented for riscv64. The SIMD dispatch path (which requires GCC >= 9 or Clang >= 7) is not activated on riscv64, so any C99-capable compiler that handles the PostgreSQL PGXS build environment will suffice [NEEDS VERIFICATION].

**Prerequisites for riscv64 native build:**
- PostgreSQL development headers: `apt install postgresql-server-dev-<version>` on Debian/Ubuntu
- `build-essential` (GCC, make)
- No cross-compilation toolchain files, no QEMU, no special setup

**QEMU:** No QEMU usage in the upstream repository for any architecture. There is no `Dockerfile.riscv64`, no QEMU-static setup, and no cross-compilation CI.

**Cross-compilation:** Not documented or supported upstream. Not tested. Possible in principle via standard PGXS cross-compilation patterns, but no evidence it has been attempted.

**Docker:** The official Dockerfile builds for `linux/amd64` and `linux/arm64` only. No `linux/riscv64` platform target exists in the `docker-release` target or in any CI job.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. pgvector compiles and runs on riscv64 using portable C scalar fallbacks for all distance functions. All index types (HNSW, IVFFlat), all vector types (vector, halfvec, bit, sparsevec), and all operators are available on riscv64.

**Performance gaps:**

| Distance kernel | amd64 relative throughput | arm64 relative throughput | riscv64 relative throughput |
|---|---|---|---|
| float32 L2 / IP / cosine | ~1x (FMA target_clones) | Scalar | Scalar |
| float16 L2 / IP / cosine | Highest (AVX + F16C + FMA dispatch) | Scalar | Scalar |
| Bit Hamming / Jaccard | Highest (AVX-512 VPOPCNTDQ) | Scalar | Scalar |

PR #852 (NEON, not merged) reported an 8.67x speedup on M-series Mac (scalar: 6906 ms vs NEON: 796 ms for 1536-dim vectors). This illustrates the magnitude of the throughput gap that applies equally to riscv64 and arm64 for float32 workloads. For halfvec and bit workloads, where amd64 has dedicated dispatch tables and arm64 and riscv64 have scalar only, the gap is likely larger.

Issue #967 (open, filed 2026-03-09) reports halfvec at 19-27% lower QPS than float32 vector in HNSW on a 768-dim 10M-vector dataset. The author attributes this to SIMD being "less optimized" for halfvec. On riscv64 (no SIMD at all), this gap would be larger.

**Security hardening gaps:** None identified for riscv64 specifically. PR #997 (aarch64 GCC pac-ret miscompile, closed without merge) does not affect riscv64 because PR #948 already strips `-march=native` on riscv64, removing the condition that triggered the pac-ret double-authentication bug.

**Floating-point semantics:** pgvector computes distances using `fassociative-math`, `fno-signed-zeros`, `fno-trapping-math`, and `ffp-contract=fast`. These flags are applied on riscv64. IEEE 754 compliance is not guaranteed. No riscv64-specific floating-point discrepancy has been reported.

---

## 7. CI/CD Infrastructure

The sole CI file is [`.github/workflows/build.yml`](https://github.com/pgvector/pgvector/blob/master/.github/workflows/build.yml). No other CI files exist (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` all return 404).

**Full CI matrix:**

| Job | Runners | Architecture |
|---|---|---|
| ubuntu | ubuntu-{22,24,26}.04, ubuntu-{22,24,26}.04-arm | x86-64, arm64 |
| mac | macos-26 (Apple Silicon), macos-15-intel | arm64, x86-64 |
| windows | windows-2022, windows-2025 | x86-64 |
| i386 | ubuntu-latest + Docker `--platform linux/386` | x86 32-bit |
| valgrind | ubuntu-latest | x86-64 |

**riscv64 CI status:** None. The string "riscv" does not appear anywhere in `build.yml`. No QEMU emulation, no `linux/riscv64` Docker target, no dedicated riscv64 runner, no label-gated riscv64 job.

**RISE runners:** RISE Project runners are not used by pgvector.

**Comparison table:**

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner present | Yes | Yes | No |
| PostgreSQL versions tested | 13-20 | 14, 16, 18 | None |
| Valgrind job | Yes | No | No |
| Test suite result visible | Yes | Yes | Unknown |

---

## 8. Distribution and Release Status

**Source releases:** pgvector distributes solely as source. GitHub releases (v0.8.2 through v0.8.6) attach zero binary assets. All users build from source or use a distribution package.

**GitHub Releases binary assets:** None for any architecture.

**PyPI:** The [`pgvector` PyPI package](https://pypi.org/project/pgvector/) (latest: 0.5.0) is a pure-Python client library, not the PostgreSQL extension itself. All wheels use the `py3-none-any` tag (platform-neutral). riscv64 is not applicable as a separate wheel target.

**Debian unstable (sid):** Version 0.8.6-1 has been built for riscv64 on build host rv-osuosl-03 (2026-08-02). Build status is "Maybe-Successful" per buildd.debian.org -- a weaker status than a clean "Installed," meaning the build log was not definitively parsed as a pass. The `arch: any` Debian packaging ensures riscv64 is in scope. 32-bit architectures (armel, armhf, i386) are blocked by pgvector's `architecture-is-64-bit` build dependency.

**Ubuntu 24.04 (noble):** Package `postgresql-16-pgvector` version 0.6.0-1 lists riscv64 as a supported architecture. The riscv64 build omits the `postgresql-16-jit-llvm` dependency because LLVM JIT is not available on riscv64 in noble.

**Arch Linux RISC-V:** pgvector is not found in the [Arch Linux RISC-V community port](https://archriscv.felixc.at/).

**PGDG (PostgreSQL Global Development Group) apt/yum:** No riscv64 binaries. PGDG does not ship riscv64 packages for any PostgreSQL version.

**Docker Hub official image:** `linux/amd64` and `linux/arm64` only. No `linux/riscv64`.

**What a user must do to get a working binary on riscv64:**
1. Install PostgreSQL from Debian/Ubuntu packages (riscv64 packages available in both).
2. Clone pgvector from GitHub and run `make && sudo make install` natively, or use the Debian `postgresql-16-pgvector` package (Ubuntu noble: 0.6.0-1; Debian sid: 0.8.6-1 tentative).
3. No pre-built binary exists from the upstream project itself.

---

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| PostgreSQL (>=13) | Runtime host; provides PGXS, executor, JIT infrastructure | Compiles (spinlock support added 2021-08-13) | Not in upstream CI | Debian/Ubuntu packages available; no PGDG riscv64 | Native atomics header absent (falls back to GCC `__sync_*`); no riscv64 in upstream CI |
| GCC / Clang | Compiler; auto-vectorization backend for distance kernels | GCC 12+ / Clang 14+ support riscv64 | Not tested in pgvector CI | N/A (toolchain) | `-march=native` stripped by PR #948; no `-march=rv64gcv` set, so RVV auto-vectorization does not fire |
| glibc | IFUNC mechanism for `USE_TARGET_CLONES` runtime dispatch | glibc 2.27+ supports riscv64; `USE_TARGET_CLONES` is a no-op on riscv64 (gated on `x86_64`) | N/A | N/A | None |
| LLVM / JIT | Optional: PostgreSQL JIT inlines pgvector bitcode for query compilation | LLVM 14+ supports riscv64; PostgreSQL JIT on riscv64 is experimental | Not tested | Not packaged in PGDG riscv64 (PGDG has no riscv64) | PostgreSQL JIT availability is the bottleneck, not pgvector |
| AVX2 / F16C / AVX-512 intrinsics | x86-64 SIMD kernels | Not applicable (compile-time `#ifdef __x86_64__` guard) | N/A | N/A | No blocking issue; scalar path is always present |

### PostgreSQL (critical dependency)

PostgreSQL is the only true runtime dependency. Its riscv64 status flows through to pgvector:
- Spinlock support landed 2021-08-13 (commit `c32fcac5`).
- Native atomics header (`arch-riscv.h`) is absent as of mid-2026; PostgreSQL falls back to GCC `__sync_*` builtins on riscv64.
- PGDG does not ship riscv64 binaries. Debian and Ubuntu provide distro packages.
- No riscv64 runner in upstream PostgreSQL CI.

Full details are in `project-reports/postgresql.md`.

---

## 11. Known Bugs and Active Issues

### Open Issues with riscv64 Relevance

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#967](https://github.com/pgvector/pgvector/issues/967) | halfvec 19-27% lower QPS than vector in HNSW (768-dim, 10M vectors) | Open | Medium | Author attributes to SIMD gap in halfvec. Worse on riscv64 where no SIMD exists at all. No maintainer response. |
| [#1003](https://github.com/pgvector/pgvector/issues/1003) | RaBitQ support request (binary quantization) | Open | Low | Feature request, performance impact on all platforms. |
| [#846](https://github.com/pgvector/pgvector/issues/846) | Unexpected Index Scan in ANN query without LIMIT | Open | Low | Not architecture-specific. |
| [#906](https://github.com/pgvector/pgvector/issues/906) | PostgreSQL 18 parallel I/O for index page reads | Open | Low | PostgreSQL 18 feature integration, not architecture-specific. |

### Closed Correctness Bugs

| ID | Title | Fixed in | riscv64 Affected? |
|---|---|---|---|
| [CVE-2026-3172](https://github.com/pgvector/pgvector/issues/959) | Buffer overflow in parallel HNSW index build (integer wraparound) | 0.8.2 | Yes -- affects all platforms, including riscv64, for 0.6.0-0.8.1 |
| [CVE-2026-18022](https://github.com/pgvector/pgvector/issues/1006) | Buffer overflow in IVFFlat index build on 32-bit systems | 0.8.6 | No -- riscv64 is 64-bit |

### No open riscv64-specific bugs.

Searches across all open and closed issues for "riscv", "riscv64", and "risc-v" returned zero results.

---

## 12. Objections and Upstream Blockers

**Maintainer stance on architecture-specific SIMD PRs:**

The maintainer's response pattern to SIMD PRs is to reject or close them when they introduce precision differences or maintenance surface:

- [PR #536](https://github.com/pgvector/pgvector/pull/536) (SVE, 2024-04-30, closed 2025-04-10): ankane's stated objection: "accumulation happens at half precision, which will produce different results than the current code." Closed as stale without merge.
- [PR #852](https://github.com/pgvector/pgvector/pull/852) (NEON, 2025-06-04): closed without maintainer comment. Reported 8.67x speedup but not merged.
- [PR #997](https://github.com/pgvector/pgvector/pull/997) (aarch64 GCC pac-ret fix, 2026-07-07): ankane preferred an upstream GCC fix over a pgvector workaround. Closed without merge.

**Implication for RVV:** An RVV SIMD PR for pgvector would face the same barriers as the SVE and NEON PRs. Precision-preserving accumulation in RVV would need to match the scalar float results exactly. The maintenance burden of a third SIMD backend (after x86-64 dispatch) would need to be justified to the sole maintainer. The probability of merge for an RVV patch that changes accumulation precision is low based on the pattern above.

**Technical blockers for riscv64 in CI:** No riscv64 GitHub Actions runner exists in the standard GitHub-hosted runner pool. RISE runners would need to be contributed or self-hosted runners registered, which requires an ongoing infrastructure commitment from an external party.

**No organizational blockers:** The maintainer merged PR #948 in one day. Portability fixes that do not add maintenance surface are accepted readily. The objections are specific to SIMD intrinsic patches.

---

## 13. Investment Analysis

RISE has no existing investment in pgvector. The baseline is: compiles on riscv64, no CI, no SIMD, one Makefile workaround.

### 13.1 Functional Enablement

No functional gaps exist. pgvector compiles and all features operate on riscv64 via scalar fallbacks. No work required for functional parity.

### 13.2 Performance Optimization

The scalar-only path means pgvector on riscv64 processes distance computations without vectorization. This is the primary performance gap relative to amd64.

Option A: RVV auto-vectorization via compiler flags. Adding `-march=rv64gcv` or equivalent to `OPTFLAGS` for riscv64 would allow the compiler to emit RVV instructions without any intrinsic code. This is a one-line Makefile change but requires determining the correct `-march` string for target hardware and acceptance by ankane (who may be reluctant to introduce hardware-specific tuning without a test mechanism).

Option B: Hand-written RVV intrinsics for the distance kernels, contributed as a PR. High implementation cost; faces the same maintainer objections as the NEON and SVE PRs unless accumulation precision is preserved exactly.

Option A is the lower-effort path. Whether it is sufficient depends on the target hardware's RVV implementation and the compiler's auto-vectorization quality for the specific loop patterns pgvector uses.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding riscv64 to the GitHub Actions matrix requires either a RISE-provided hosted runner or a self-hosted runner registered to the pgvector repository. The maintainer would need to accept the runner and the CI job, which adds ongoing operational dependency on the runner provider.

QEMU-based emulation is an alternative that does not require hardware but is slower and adds CI latency. pgvector CI currently uses Docker `--platform linux/386` for i386 testing, establishing a precedent for emulated platforms.

### 13.4 Ecosystem Enablement

pgvector has no dependent package ecosystem that requires separate riscv64 enablement (the PyPI package is pure Python). Section 10 is omitted. No ecosystem work is required.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Add `-march=rv64gcv` (or equivalent) to Makefile OPTFLAGS for riscv64 to enable RVV auto-vectorization; benchmark and propose PR | 1 | Contributor | High |
| CI/CD | Contribute riscv64 runner (RISE-hosted or self-hosted) and PR to add riscv64 job to `.github/workflows/build.yml` | 2 | RISE infra team | High |
| Performance | Hand-written RVV intrinsics for float32 and halfvec distance kernels, precision-preserving, proposed as upstream PR | 6-8 | Contributor | Medium |
| Distribution | Coordinate with PGDG to add riscv64 to official PostgreSQL apt/yum repository (prerequisite for pgvector PGDG packaging on riscv64) | External (PGDG decision) | PostgreSQL community | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [pgvector repository](https://github.com/pgvector/pgvector)
- [PR #948: Add RISC-V64 architecture support in Makefile](https://github.com/pgvector/pgvector/pull/948)
- [PR #536: SVE halfvec dot product (closed, not merged)](https://github.com/pgvector/pgvector/pull/536)
- [PR #852: NEON l2_distance and inner_product (closed, not merged)](https://github.com/pgvector/pgvector/pull/852)
- [PR #997: Drop -march=native on aarch64 GCC for pac-ret (closed, not merged)](https://github.com/pgvector/pgvector/pull/997)
- [Issue #967: halfvec QPS degradation vs vector in HNSW](https://github.com/pgvector/pgvector/issues/967)
- [Issue #1003: RaBitQ support request](https://github.com/pgvector/pgvector/issues/1003)
- [Issue #959 / CVE-2026-3172: HNSW parallel build buffer overflow](https://github.com/pgvector/pgvector/issues/959)
- [Issue #1006 / CVE-2026-18022: IVFFlat 32-bit buffer overflow](https://github.com/pgvector/pgvector/issues/1006)
- [pgvector CI workflow: .github/workflows/build.yml](https://github.com/pgvector/pgvector/blob/master/.github/workflows/build.yml)
- [Ubuntu 24.04 noble: postgresql-16-pgvector package](https://packages.ubuntu.com/noble/postgresql-16-pgvector)
- [Debian tracker: pgvector](https://tracker.debian.org/pkg/pgvector)
- [Debian buildd riscv64 log for pgvector](https://buildd.debian.org/status/logs.php?pkg=pgvector&arch=riscv64&suite=sid)
- [PyPI: pgvector 0.5.0](https://pypi.org/project/pgvector/)
- [RISE Project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [pgvector releases](https://github.com/pgvector/pgvector/releases)