---
title: bzip2
parent: Project Reports
color: yellow
categories:
  - libraries
---

{% include dependency-graph.html slug="dependencies" subset="bzip2" %}

# bzip2
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Scope:** RISC-V (riscv64/linux) support status for bzip2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

bzip2 is a lossless data compression library and command-line tool implementing the Burrows-Wheeler block-sorting algorithm combined with Huffman coding. It produces `.bz2` files. The codebase is approximately 8,000 lines of pure C89 with no architecture-specific assembly, no SIMD, and no JIT on any platform.

**Governance.** There is no foundation affiliation and no formal governance body for the original C codebase. The project is hosted on sourceware.org infrastructure (a community service associated with the GCC Steering Committee umbrella) but has no formal membership in that body. sourceware.org itself is not RISE Project-affiliated, and bzip2 (the C project) is not listed as a RISE member on [riseproject.dev](https://riseproject.dev) or its [members page](https://riseproject.dev/members/) [confirmed 2026-09-30].

**License.** BSD-style open-source license ("bzip2-1.0.6"). The original author noted the license is believed patent-free but could not guarantee it. Downstream Rust reimplementations (below) retain the same license text plus dual Apache-2.0/MIT terms for their Rust-specific code.

**Dual upstream, now effectively single-upstream-plus-a-corporate-backed rewrite.** As of the 2026-07-20 initial report, the project had two parallel C upstreams. That has changed:
- **Stable (1.0.x):** [sourceware.org/git/bzip2.git](https://sourceware.org/git/bzip2.git), maintained by Mark Wielaard (Red Hat employee). Still active; unchanged.
- **Feature (1.1+), now archived:** [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2), formerly maintained by Micah Snyder (corporate affiliation not publicly documented). **This repository was archived on or around 2026-07-08** [confirmed via direct fetch of the repository page, 2026-09-30], with the project's own description now reading: "This fork for v1.1+ development has been archived due to lack of interest, and because there are better options available through the Rust ecosystem." No 1.1.0 C release was ever tagged.

**New corporate-sponsored successor: Trifecta Tech Foundation's Rust rewrite.** The "better options" the archival notice refers to are two Rust projects maintained by the **Trifecta Tech Foundation** (a nonprofit whose stated mission is maintaining "digital commons" open-source software for critical infrastructure) under its Data Compression initiative:
- [**libbzip2-rs**](https://github.com/trifectatechfoundation/libbzip2-rs) - a from-scratch-safety-oriented Rust reimplementation of libbzip2, originally derived via c2rust translation of the original C source, publishing the drop-in-compatible `libbz2-rs-sys` C-ABI crate.
- [**bzip2-rs** (the `bzip2` crate)](https://github.com/trifectatechfoundation/bzip2-rs) - the higher-level Rust bindings crate; as of v0.6.0 (announced 2025-06-17) it defaults to the pure-Rust `libbz2-rs-sys` backend instead of linking the C library, citing simpler cross-compilation (WebAssembly, Windows, Android) and 4-14% performance gains over the C implementation.

**Corporate sponsors (of Trifecta Tech Foundation generally, not bzip2 specifically):** Gold sponsors Canonical and Google (each reported at €40,000/year for 2026); Silver sponsor AWS. The bzip2-rs/libbzip2-rs work itself was funded through project-specific grants: NLnet Foundation and NGI Zero Core (an NLnet-administered fund backed by the European Commission's Next Generation Internet programme), and the Dutch Ministry of the Interior (Ministerie van Binnenlandse Zaken en Koninkrijksrelaties) [confirmed via trifectatech.org, 2026-09-30]. No corporate sponsor is tied to the original C bzip2/libbzip2 codebase itself - the sponsorship attaches to the Rust rewrite, not to sourceware.org or gitlab.com/bzip2/bzip2.

**Prior maintainers.** Julian Seward (original author, 1996-2019, no corporate affiliation documented). Federico Mena Quintero (Red Hat/GNOME, Jun 2019 - Jun 2022). Micah Snyder took over the 1.1+ branch from Federico Mena Quintero in June 2022 and maintained it until its 2026-07 archival.

**Community stance on new ports.** For the original C codebase: not applicable. bzip2 is architecture-agnostic portable C; no porting work is required for any architecture with a C89 compiler, and the community has never tracked architecture support as a distinct concern. For the new libbzip2-rs/bzip2-rs Rust codebase: no stated stance on riscv64 either way was found. Its CI matrix (`.github/workflows/checks.yaml`, read in full from a shallow clone of the repository) tests x86_64, aarch64, i686, s390x, wasm32-wasip1, and Apple/Windows targets - **no riscv64 target is present** - and neither the repository's tracked files nor its GitHub issue search for "riscv" surfaced any riscv64-specific discussion, objection, or commit [confirmed 2026-09-30].

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (no date) | bzip2 first written in pure portable C89 with no architecture-specific code; all architectures supported by construction | [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) |
| 2019-07 | Last upstream release: 1.0.8 | [sourceware.org/bzip2](https://sourceware.org/bzip2/) (blocked; [NEEDS VERIFICATION] for exact date) |
| 2022-06 | Micah Snyder takes over 1.1+ branch; CMake and Meson build systems added | [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) NEWS.md |
| Ongoing | Debian sid ships 1.0.8-6+b2 on riscv64, built on builder rv-manda-04 | [buildd.debian.org bzip2](https://buildd.debian.org/status/package.php?p=bzip2) |
| Ongoing | Ubuntu 24.04 Noble ships 1.0.8-5.1 on riscv64 | [packages.ubuntu.com/noble/bzip2](https://packages.ubuntu.com/noble/bzip2) |
| 2025-06-17 | Trifecta Tech Foundation's `bzip2` Rust crate v0.6.0 switches its default backend from linked C `libbz2` to the pure-Rust `libbz2-rs-sys`, citing simplified cross-compilation and 4-14% performance gains | [trifectatech.org blog](https://trifectatech.org/blog/bzip2-crate-switches-from-c-to-rust/) |
| 2026-07-08 (approx.) | `gitlab.com/bzip2/bzip2` (the C 1.1+ feature branch) archived by its maintainer; archival notice cites "lack of interest" and "better options available through the Rust ecosystem" | [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) (repo description, read live) |

**No RISC-V-specific commit exists in any upstream, C or Rust.** A full review of all 40 GitLab issues (IID #20-#60) and all 69 merge requests (!29-!69) on the now-archived C 1.1+ branch returned zero mentions of riscv, riscv64, or RISC-V. The sourceware.org Bugzilla has 10 open bugs, none architecture-specific. The successor Rust project, `trifectatechfoundation/libbzip2-rs` (cloned shallow and grepped in full, 2026-09-30), contains zero references to "riscv" anywhere in its tracked files, and a GitHub issue search for "riscv" in that repository returns no results. bzip2 requires no porting work in either language and has never had any - **there is no "first riscv64 commit" in this project's history because riscv64 has never needed one.**

**Key contributors for riscv64:** None, in either the C or Rust codebase. The architecture works by construction (portable C89) and by Rust's own cross-platform target support (no riscv64 target is exercised in CI, but nothing in the Rust source is architecture-specific either).

**Fully upstream:** Yes, trivially - there is nothing to upstream, in the C project or its Rust successor.

---

## 3. Upstream Support Tier

bzip2 has no formal tier policy and no concept of architecture tiers. CI coverage defines the de facto support level.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | Yes | No | No |
| Release-blocking | Yes (implied) | No | No |
| Official upstream binaries | No (source only) | No | No |
| Distro binary packages | Yes | Yes | Yes (Debian, Ubuntu) |
| Upstream CI platform | Debian Testing, Fedora 35/rawhide, openSUSE Leap/Tumbleweed | - | - |

amd64 and i386 are the only architectures in the upstream `.gitlab-ci.yml`. ARM64 and riscv64 are both absent. riscv64 coverage is provided entirely by distro build farms (Debian buildd, Ubuntu Launchpad), not by upstream CI. This is not a gap relative to arm64 - both are equally absent from upstream CI.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

bzip2 has no architecture-specific subsystems on any platform. The full file tree of gitlab.com/bzip2/bzip2 (85 items, confirmed via GitLab API) contains:
- Zero `.S` assembly files
- Zero SIMD intrinsics
- Zero `arch/` directory
- Zero JIT components
- Zero crypto components
- Zero platform-conditioned `#ifdef` blocks for microarchitecture

The entire computation path is scalar portable C89.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Block sort (blocksort.c, ~62% of CPU time) | Scalar C | Scalar C | Scalar C |
| Compression (compress.c) | Scalar C | Scalar C | Scalar C |
| Decompression (decompress.c) | Scalar C | Scalar C | Scalar C |
| Huffman coding (huffman.c) | Scalar C | Scalar C | Scalar C |
| CRC table (crctable.c) | Scalar C | Scalar C | Scalar C |
| SIMD acceleration | None | None | None |
| Assembly | None | None | None |
| JIT | None | None | None |

The absence of riscv64-specific code is not a gap; it matches the project's design across all architectures.

**Performance note.** GitLab issue #40 ("mainGtU() improvement", opened 2022-03-28, still open) identifies that approximately 62% of bzip2 execution time is spent in `blocksort.c::mainGtU()`, a lexicographic compare loop. A proof-of-concept patch achieves 10-20% compression speedup on x86 and ARM64 by batching byte comparisons into 8-byte `unsigned long long` reads with an endian swap. No riscv64 measurements were taken. The patch fails 3 test cases from the large test suite and has not been merged. This opportunity applies equally to all architectures including riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Supported build systems:** CMake and Meson (Unix preferred). An unsupported nmake path exists for Windows/MSVC.

**Native riscv64 build (CMake):**

```sh
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DENABLE_SHARED_LIB=ON \
  -DENABLE_STATIC_LIB=ON \
  -DENABLE_APP=ON
cmake --build .
ctest -C Release -V
```

No architecture-specific flags are required or documented. No `-DUSE_X=OFF` workarounds needed for riscv64.

**Cross-compile to riscv64 from x86_64 (CMake).** No upstream toolchain file exists. Supply externally:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

**Cross-compile to riscv64 (Meson).** Supply a cross file:

```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
exe_wrapper = ['qemu-riscv64-static', '-L', '/usr/riscv64-linux-gnu']

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

**Toolchain version requirements.** bzip2 declares no explicit compiler minimum. The C standard is C89. Practical minimum for riscv64: GCC 7+ or Clang 5+ (first versions with solid riscv64 target support in the compiler itself). This is a compiler constraint, not a bzip2 constraint. Meson >= 0.50.0 and Python >= 3.5 are required for Meson builds.

**QEMU.** No QEMU usage in the build system, CI configuration, or test infrastructure. The `exe_wrapper` in the Meson cross file above must be supplied externally by the integrator.

**Dockerfile.** No Dockerfile exists in the bzip2 repository. CI uses stock distribution Docker images pulled directly.

**SONAME compatibility.** bzip2 1.0.x produces `libbz2.so.1.0`; 1.1.x produces `libbz2.so.1`. For ABI compatibility with packages expecting the old soname: `cmake .. -DUSE_OLD_SONAME=ON`.

**Known build failures on riscv64.** None found in any tracked source.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compression | Yes | Yes | Yes |
| Decompression | Yes | Yes | Yes |
| bzip2recover (damaged archive recovery) | Yes | Yes | Yes |
| Shared library (libbz2) | Yes | Yes | Yes |
| Static library (libbz2) | Yes | Yes | Yes |
| CLI tool (bzip2, bunzip2, bzcat) | Yes | Yes | Yes |
| SIMD acceleration | No (not implemented on any arch) | No | No |

**Functional gaps:** None. bzip2 provides identical functionality on riscv64 as on amd64 and arm64.

**Performance gaps.** The `mainGtU()` hot path (GitLab issue #40) accounts for approximately 62% of compression CPU time. The unmerged patch achieves 10-20% speedup. This is equally applicable to amd64, arm64, and riscv64 - the gap is not riscv64-specific.

Data not available: Published throughput benchmarks comparing riscv64 vs amd64 or arm64 for bzip2. No quantitative comparison was found in any accessible source (RISE blog, OpenBenchmarking.org, academic publications, 2024-2026 timeframe).

**Security hardening gaps.** GitLab MR !68 (open): off-by-one global-buffer-overflow in `bzip2recover` block scanner. GitLab MR !69 (open): allocation-size overflow-checked helper hardening. Neither is riscv64-specific; both affect all platforms equally.

**Floating-point / NaN semantics.** Not applicable. bzip2 uses no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

**Upstream CI (gitlab.com/bzip2/bzip2):** Defined in `.gitlab-ci.yml`, confirmed by reading the file in full.

| Job | Architecture | OS | Notes |
|---|---|---|---|
| debian-testing | amd64 | Debian Testing | Active |
| ubuntu-bionic | amd64 | Ubuntu 18.04 | Active |
| ubuntu-bionic-i386 | i386 | Ubuntu 18.04 | Active |
| fedora-35 | amd64 | Fedora 35 | Active |
| fedora-rawhide | amd64 | Fedora Rawhide | Active |
| opensuse-leap | amd64 | openSUSE Leap | Active |
| opensuse-tumbleweed | amd64 | openSUSE Tumbleweed | Active |

AppVeyor is used for Windows (MSVC and MinGW) builds.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | Yes | No | No |
| RISE runners | No | No | No |
| QEMU emulation in CI | No | No | No |
| Distro build farm | Yes | Yes | Yes (Debian rv-manda-04) |

**riscv64 CI verdict:** No upstream riscv64 CI exists. This is the same status as arm64. Distro build infrastructure (Debian buildd) provides the only automated riscv64 build validation.

---

## 8. Distribution and Release Status

**Latest upstream release:** 1.0.8, July 2019 (date [NEEDS VERIFICATION]; sourceware.org is blocked by Anubis). The gitlab.com/bzip2/bzip2 repository has 1.1.0 in development (`meson.build` declares version 1.1.0) but no 1.1.0 release tag has been cut.

| Distribution | Version | riscv64 Available | Notes |
|---|---|---|---|
| Debian sid | 1.0.8-6+b2 | Yes - INSTALLED | Built on rv-manda-04 approximately 60 days before research date |
| Ubuntu 24.04 Noble | 1.0.8-5.1 | Yes | All standard Ubuntu architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x |
| Arch Linux RISC-V | Unknown | Unknown | archriscv.felixc.at tracker did not return parseable data; status cannot be confirmed |
| PyPI | N/A | N/A | No PyPI package named "bzip2" exists; HTTP 404 confirmed |
| RISE wheel builder | N/A | N/A | bzip2 is not a Python wheel; RISE is not involved |
| Upstream source tarball | 1.0.8 | Source only | No architecture-specific patches required for riscv64 |

**What a user must do to get a working riscv64 binary:** Install from Debian or Ubuntu package manager (`apt install bzip2`). No special steps, no patches, no source build required.

---

## 9. Dependencies

bzip2 has no runtime library dependencies beyond the C standard library. It links only against libc.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glibc / libc | Runtime: only shared library bzip2 links against. Requires standard POSIX headers only. | Yes | Covered by glibc own test suite | Released; in all major distros | None |
| Python 3 | Build-time only: test runner (pytest or unittest) and doc-build scripts. Not linked at runtime. | Yes | Python tests riscv64 | Released for riscv64 | None |
| pytest | Optional test-time only: preferred test runner; falls back to `python3 -m unittest` if absent. | Available via pip and distro packages | N/A (host tool) | Available in distro packages | None |
| Valgrind | Optional test-time only, Linux: memory-check test mode; skipped if absent. Not linked. | riscv64 support present, still maturing | Partial riscv64 test coverage | riscv64 support present but less mature than x86_64 | Not a hard blocker; bzip2 CI gracefully skips memory-check tests when Valgrind is absent |
| CMake | Build-time only: one of two supported build systems. | Yes | N/A (host tool) | Available in all distros for riscv64 | None |
| Meson + ninja | Build-time only: alternative build system. | Yes | N/A (host tool) | Available in all distros for riscv64 | None |
| xsltproc / docbook-xml | Optional, documentation only (`ENABLE_DOCS=ON`). Not in binary packages. | Available on riscv64 | N/A (host tools) | Available in Debian/Ubuntu riscv64 | None |

No dependency has a JIT, SIMD, crypto, or numerics component that requires riscv64-specific work for bzip2's use case. The Valgrind dependency is optional and its absence is handled gracefully.

---

## 11. Known Bugs and Active Issues

**GitLab (gitlab.com/bzip2/bzip2) - issues with cross-architecture impact:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#40](https://gitlab.com/bzip2/bzip2/-/issues/40) | mainGtU() improvement | Open | Performance | ~62% of compression CPU time; PoC patch achieves 10-20% speedup on x86 and ARM64; fails 3 test cases; no riscv64 measurement; affects all architectures equally |
| [#56](https://gitlab.com/bzip2/bzip2/-/issues/56) | Weird return in BZ2_decompress | Open | Correctness (potential UB) | Plausible undefined behavior on invalid input; no riscv64-specific trigger identified; affects all architectures |

**GitLab - merge requests with correctness implications:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [!68](https://gitlab.com/bzip2/bzip2/-/merge_requests/68) | bzip2recover off-by-one global-buffer-overflow | Open | Correctness / Security | Buffer overflow in block scanner; affects all architectures |
| [!69](https://gitlab.com/bzip2/bzip2/-/merge_requests/69) | Allocation-size overflow-checked helper hardening | Open | Security hardening | Integer overflow hardening; affects all architectures |

**Debian Bug Tracking System:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1138255](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255) | CVE-2026-42250 | Open | Important | Filed 2026; details not retrieved in research; no riscv64-specific component identified |

**RISC-V-specific bugs:** Zero. No riscv64-specific open issues exist in the GitLab tracker (40 issues reviewed), Debian BTS (27 bugs reviewed), or sourceware.org Bugzilla (10 open bugs reviewed). The only mention of RISC-V in the entire GitLab issue history is in closed issue #6, which notes "Linux/RISC-V (core-only bare metal target, no std)" as a platform that cannot use Rust - a Rust bootstrapping concern, not a bzip2 correctness bug.

---

## 12. Objections and Upstream Blockers

**Stated objections to riscv64:** None. No upstream developer has objected to or commented on riscv64 support in any tracked forum.

**Technical blockers:** None. Pure C89 codebase compiles and runs correctly on riscv64 without modification.

**Organizational blockers:** None identified.

**Acceptance probability for riscv64 patches:** Not applicable - no patches are needed. If a performance patch (e.g., optimized `mainGtU()`) were submitted, acceptance probability is moderate given the existing open issue #40, but the existing proof-of-concept already fails 3 test cases on all architectures, indicating the project has correctness standards that must be satisfied first.

---

## 13. Investment Analysis

RISE has no involvement with bzip2. No prior work to deduct.

### 13.1 Functional Enablement

No work needed. bzip2 builds and runs correctly on riscv64 by construction. Debian sid and Ubuntu 24.04 ship working riscv64 packages with no upstream changes.

### 13.2 Performance Optimization

One actionable opportunity exists: the `mainGtU()` hot path (GitLab issue #40). A 10-20% compression throughput improvement is achievable on all architectures. The existing PoC patch targets x86 and ARM64 by batching byte comparisons into 8-byte word reads with endian swap. The same technique applies to riscv64 (little-endian, 64-bit). The work involves: fixing the 3 test failures in the existing PoC, benchmarking on riscv64 hardware, and upstream submission. This benefits all architectures, not only riscv64.

No riscv64-specific SIMD opportunity exists because bzip2 has no SIMD on any architecture.

### 13.3 CI/CD Infrastructure

The upstream CI covers only amd64 and i386. Adding riscv64 CI via QEMU emulation would improve regression detection. The Meson cross-file `exe_wrapper` mechanism supports QEMU-based cross-testing with no upstream code changes required - only CI configuration changes.

### 13.4 Ecosystem Enablement

Not applicable. bzip2 has no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | Fix and upstream mainGtU() optimization (issue #40): correct the 3 failing test cases, benchmark on riscv64, submit MR | 2-4 | Compiler/performance engineer | Low |
| Performance | Measure bzip2 throughput on riscv64 hardware vs amd64 and arm64 baselines | 0.5 | Performance engineer | Low |
| CI/CD | Add riscv64 QEMU job to upstream .gitlab-ci.yml | 0.5 | Build engineer | Low |
| Security | Review and upstream MR !68 (bzip2recover buffer overflow) and MR !69 (integer overflow hardening) | 1 | Security engineer | Medium |

**Overall investment recommendation.** bzip2 requires no investment for riscv64 functional support - it works today. The open security items (MR !68, CVE-2026-42250) warrant attention regardless of architecture. The performance work (issue #40) is low priority given that bzip2 is a mature format being displaced by zstd and xz in most new deployments. Total optional investment: 4-6 person-weeks for CI, security hardening, and performance measurement combined.

---

## 14. Updates

**2026-09-30 governance/sponsors/port-history refresh.** Re-researched governance, corporate sponsorship, and port history. Key change since the 2026-07-20 initial report: `gitlab.com/bzip2/bzip2`, the C 1.1+ feature branch, was **archived around 2026-07-08** (confirmed by fetching the live repository page, whose description now states it was archived "due to lack of interest, and because there are better options available through the Rust ecosystem"). Those "better options" are two corporate/foundation-backed Rust projects, `libbzip2-rs` and the `bzip2` crate, maintained by the **Trifecta Tech Foundation** and funded by NLnet Foundation, NGI Zero Core, and the Dutch Ministry of the Interior for the bzip2 work specifically, with the Foundation's general operations backed by Gold sponsors Canonical and Google and Silver sponsor AWS (confirmed via trifectatech.org). This is the first identified instance of corporate sponsorship reaching bzip2's ecosystem, though it attaches to the new Rust rewrite, not to sourceware.org's stable 1.0.x C branch (still unsponsored, maintained by Mark Wielaard/Red Hat) or to the archived GitLab C branch. Confirmed bzip2 has no RISE Project membership (checked riseproject.dev directly). Cloned `trifectatechfoundation/libbzip2-rs` (shallow, read-only) and confirmed by grep that it contains zero mentions of "riscv" anywhere in its tracked files, and its CI matrix (`.github/workflows/checks.yaml`) covers x86_64, aarch64, i686, s390x, wasm32, and Apple/Windows targets but no riscv64. A GitHub issue search on that repository for "riscv" returned zero results. No formal tier policy exists in either the C or Rust codebase; no community stance for or against a riscv64 port was found in any source, because none has ever been needed - the codebase (C or Rust) has no architecture-specific code. Sources: direct fetch of gitlab.com/bzip2/bzip2, sourceware.org/bzip2/ and sourceware.org/git/bzip2.git (both returned Anubis bot-protection pages with no additional governance detail beyond what the 2026-07-20 report already captured), riseproject.dev, trifectatech.org and its blog posts, github.com/trifectatechfoundation/{bzip2-rs,libbzip2-rs}, and a shallow clone of the libbzip2-rs repository.

---

**2026-09-30 CI refresh.** Re-checked all CI configuration for riscv64 references. Confirmed via the GitLab API repository tree (`gitlab.com/bzip2/bzip2`, ref `master`) that only two CI-related files exist in the repo: `.gitlab-ci.yml` (GitLab CI) and `.appveyor.yml` (AppVeyor, Windows-only). Both were fetched and read in full: neither contains any mention of `riscv64`, `riscv`, or `risc-v`. No `.github/workflows`, `.cirrus.yml`, `.travis.yml`, Jenkinsfile, or Buildbot configuration exists in the repository. `sourceware.org/git/bzip2.git` (the stable 1.0.x upstream) returned an Anubis bot-protection challenge page with no CI links, consistent with the original research (sourceware.org's cgit interface does not host or link to CI configuration). WebSearch for "bzip2 riscv64 CI buildbot jenkins gitlab" surfaced no dedicated riscv64 CI system for bzip2. bzip2 is not a kernel project, so lore.kernel.org was not applicable. No change to findings: riscv64 CI status remains "none" for both upstreams. No new riscv64-related issues, MRs, or commits were found since the initial 2026-07-20 report.

NO RISCV64 CI: confirmed by reading [.gitlab-ci.yml, .appveyor.yml, gitlab.com/bzip2/bzip2 repository file tree via GitLab API, sourceware.org/git/bzip2.git (blocked by Anubis, no CI links present)].

---

**2026-09-30 adversarial verification of riscv64 completeness.** Independently re-verified the "no architecture-specific code" claim by cloning actual source (not just search engines, which sourceware.org's Anubis challenge partially blocks) via two GitHub mirrors: `libarchive/bzip2` (tracks the archived 1.1+ CMake/Meson branch) and `nemequ/bzip2` (tracks the stable 1.0.x Makefile-based branch). Full-tree searches of both, run locally, found: zero `.S`/`.asm` files; zero hits for `riscv`, `__x86_64__`, `__aarch64__`, `__ARM_`, `__SSE`, `__AVX`, `__NEON`, `__asm__`, or `intrinsic`; zero endianness handling (`endian`, `__BYTE_ORDER`, `BIGENDIAN`); zero CPU-architecture `#ifdef` blocks of any kind. The only `#if`/`#ifdef` conditionals in the entire codebase are OS-level (`_WIN32`, `OS2`, `MSDOS`, `BZ_UNIX`, `_MSC_VER`, `BZ_DEBUG`), not CPU-architecture-level - riscv64 Linux takes the same `BZ_UNIX` path as amd64 and arm64 Linux. Core types in `bzlib_private.h` (`Int32`, `UInt32`, `Int16`, `UInt16`) are defined in terms of standard C `int`/`short`, not fixed-width or machine-specific types. Independently re-confirmed riscv64 binary package availability by direct fetch of `https://packages.ubuntu.com/resolute/bzip2` (Ubuntu 26.04, the current devel suite) - riscv64 download links are present alongside amd64/arm64. **Verdict: bzip2's riscv64 support is not a stub - there is no separate riscv64 code path to be a stub of.** Every listed component (block sort, compression, decompression, Huffman coding, CRC table, `bzip2recover`) rates as **scalar (C fallback)** uniformly across amd64, arm64, and riscv64; none rate as full (hand-tuned) or partial (intrinsics) on any architecture, including bzip2's primary amd64 target. This confirms, via direct source inspection rather than search-engine indexing, the report's existing Section 3/4/6 tables and Section 2/12 narrative. No correction to any prior finding was needed.

Initial report dated 2026-07-20.

---

## 15. References

- [bzip2 GitLab repository (gitlab.com/bzip2/bzip2)](https://gitlab.com/bzip2/bzip2) (archived ~2026-07-08; superseded by libbzip2-rs)
- [bzip2 sourceware.org homepage](https://sourceware.org/bzip2/) (blocked by Anubis bot protection during research)
- [bzip2 sourceware.org git](https://sourceware.org/git/bzip2.git) (blocked by Anubis bot protection during research)
- [libarchive/bzip2 GitHub mirror](https://github.com/libarchive/bzip2)
- [bzip2 .gitlab-ci.yml](https://gitlab.com/bzip2/bzip2/-/raw/master/.gitlab-ci.yml)
- [bzip2 COMPILING.md](https://github.com/libarchive/bzip2/blob/master/COMPILING.md)
- [bzip2 CMakeOptions.txt](https://github.com/libarchive/bzip2/blob/master/CMakeOptions.txt)
- [bzip2 meson.build](https://github.com/libarchive/bzip2/blob/master/meson.build)
- [Debian buildd status for bzip2](https://buildd.debian.org/status/package.php?p=bzip2)
- [Debian tracker for bzip2](https://tracker.debian.org/pkg/bzip2)
- [Ubuntu 24.04 Noble bzip2 package](https://packages.ubuntu.com/noble/bzip2)
- [GitLab issue #40 - mainGtU() improvement](https://gitlab.com/bzip2/bzip2/-/issues/40)
- [GitLab issue #56 - Weird return in BZ2_decompress](https://gitlab.com/bzip2/bzip2/-/issues/56)
- [GitLab MR !68 - bzip2recover buffer overflow](https://gitlab.com/bzip2/bzip2/-/merge_requests/68)
- [GitLab MR !69 - allocation-size overflow-checked helper](https://gitlab.com/bzip2/bzip2/-/merge_requests/69)
- [Debian bug #1138255 (CVE-2026-42250)](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project GitHub repositories](https://github.com/riseproject-dev)
- [RISE wheel builder package roster](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members page](https://riseproject.dev/members/)
- [Trifecta Tech Foundation homepage](https://trifectatech.org/)
- [Trifecta Tech Foundation - Data compression initiative](https://trifectatech.org/initiatives/data-compression/)
- [Trifecta Tech Foundation blog - "bzip2 crate switches from C to 100% rust"](https://trifectatech.org/blog/bzip2-crate-switches-from-c-to-rust/)
- [Canonical becomes Gold Sponsor of Trifecta Tech Foundation](https://canonical.com/blog/canonical-becomes-gold-sponsor-of-trifecta-tech-foundation)
- [libbzip2-rs GitHub repository](https://github.com/trifectatechfoundation/libbzip2-rs)
- [bzip2-rs (Rust bindings crate) GitHub repository](https://github.com/trifectatechfoundation/bzip2-rs)
- [libbzip2-rs CI workflow (.github/workflows/checks.yaml)](https://github.com/trifectatechfoundation/libbzip2-rs/blob/main/.github/workflows/checks.yaml)
- [scivision.dev - "BZip2 1.1 development archived"](https://www.scivision.dev/bzip-1.1-archived)