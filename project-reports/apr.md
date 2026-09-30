---
title: APR
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: expat
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: PostgreSQL
    relation: runtime-dependency
    criticality: optional
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: optional
  - name: OpenLDAP
    relation: runtime-dependency
    criticality: optional
  - name: UUID library
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="apr" %}

# APR

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for APR<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="apr" %}

## 1. Project Overview

[Apache Portable Runtime (APR)](https://apr.apache.org/) is a C library that provides a portable, platform-independent API for OS abstractions: threads, mutexes, atomic operations, memory pools, file I/O, network sockets, dynamic shared objects, and character encoding conversion. It is the foundation layer for Apache httpd and Apache Subversion. It is not a JIT, a runtime, or a language interpreter.

**Governance:** APR is a top-level project of the [Apache Software Foundation (ASF)](https://www.apache.org/), governed by its own Project Management Committee (PMC), under Apache-2.0 license. The commit model is Commit-Then-Review (CTR): patches land first, review/revert follows if needed. Voting uses +1/+0/-0/-1 with written justification required for vetoes. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. Roster/release history lives in the `STATUS` file, which does not enumerate current PMC membership. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists anywhere in the tree, so there is no published, formal architecture-tier support policy; new-platform acceptance is implicit and ad hoc, driven by whatever patches committers submit and review.

**Committer base** (from commit history since 2024-01-01):

| Contributor | Recent commits | Known corporate affiliation |
|---|---|---|
| Ivan Zhakov | 161 | None confirmed |
| Graham Leggett | 50 | None confirmed |
| Joe Orton | 31 | None confirmed |
| Yann Ylavic | 17 | None confirmed |
| Eric Covener | 15 | None confirmed |
| Branko Cibej | 14 | Digiverse (independent Slovenian consultancy) |
| Ruediger Pluem | 13 | None confirmed |
| Rainer Jung | 8 | None confirmed |
| Daniel Sahlberg | 6 | None confirmed |

No committer is publicly tied to a RISC-V-ecosystem company. Corporate sponsorship exists only at the ASF-foundation level, not APR-project-specific: Platinum tier includes Apple, AWS, Meta, Google, Huawei, Microsoft, Snowflake, VISA; Gold includes Aiven, Bloomberg, ByteDance, Cloudera, Confluent; Silver includes IBM, Red Hat, Amex, Capital One. This funds ASF infrastructure and legal overhead broadly, not APR development directly.

**RISE Project membership:** APR is not a member of the RISE Project. Current RISE membership ([riseproject.dev/members](https://riseproject.dev/members/)): Premier - Alibaba DAMO, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent. General - Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision (ByteDance), Institute of Software Chinese Academy of Sciences (ISCAS), Microchip Technology, NextSilicon, Quintauris, SpacemiT, ZTE. There is no `/projects/` page on riseproject.dev (404); RISE tracks individual projects/RFPs via GitHub rather than a static list. APR is absent from every RISE channel checked (member list, blog archive, GitHub org, Python wheel builder).

**Community culture on new ports:** The trajectory of removing legacy platforms (BeOS and Netware) while relying on a generic GCC-builtins fallback for new POSIX architectures indicates new ports are accepted implicitly if a well-formed patch is submitted. No mailing-list thread, issue, or PR raising riscv64 was found. Reviewer bandwidth is limited: it is a small, largely volunteer/consultant-driven committer base with no dedicated tier-review process.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2014-09-21 | Commit `be286b1f` by Rainer Jung ("Update config.guess and config.sub from [http://git.savannah.gnu.org/cgit/config.git](http://git.savannah.gnu.org/cgit/config.git)") adds `riscv32 \| riscv64` to the recognized-triplet list in `build/config.sub`. This is a mechanical, vendored sync from the upstream GNU config project, repeated in later routine syncs (2016, 2017, 2019, 2021) by the same author. It is not APR-authored RISC-V port work. | [apache/apr build/config.sub](https://github.com/apache/apr/blob/trunk/build/config.sub) |
| Never | No commit message in the full history (3,109 commits scanned, `git log -i --grep=riscv`) is about RISC-V. No dedicated `atomic/unix/riscv.c`, `include/arch/riscv/`, or similar file has ever existed. | Local clone full-history search |
| Never | No riscv64 issue filed in GitHub Issues | [apache/apr issues](https://github.com/apache/apr/issues) |
| Never | No riscv64 pull request filed | [apache/apr pull requests](https://github.com/apache/apr/pulls) |
| Implicit | RISC-V handled silently by the generic GCC `__sync_*`/`__atomic_*` builtins path since GCC gained riscv64 support | [atomic/unix/builtins.c](https://github.com/apache/apr/tree/trunk/atomic/unix) |

There is no dedicated RISC-V port and no key contributor for any RISC-V work. There is no tracking issue for a formal port. The only string match for "riscv" in the project's authored history is the mechanical config-triplet sync above; RISC-V support today is entirely implicit, via the generic fallback code path that produces a functioning build on any POSIX architecture where GCC provides `__atomic_*` intrinsics.

## 3. Upstream Support Tier

APR has no published architecture support tier policy. The de facto tier is determined by what receives CI coverage and dedicated code:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated atomic implementation | Yes (`atomic/unix/ia32.c`, hand-tuned inline asm) | No (uses builtins.c) | No (uses builtins.c) |
| Dedicated arch header directory (`include/arch/`) | No (via `unix/`) | No (via `unix/`) | No (only aix, os2, os390, unix, win32 exist) |
| CI runner | Yes (`ubuntu-latest`) | Yes (`ubuntu-22.04-arm`, native) | No |
| CI test coverage | Full | Limited (one default config) | None |
| Official upstream binary | No (ASF distributes source tarballs only) | No | No |
| Downstream distro binary | Debian, Ubuntu (primary) | Debian, Ubuntu (primary) | Debian sid/trixie, Ubuntu Noble and 26.04 Resolute |

amd64 has hand-tuned atomic assembly; arm64 and riscv64 both rely on the GCC builtins path. arm64 has a native CI runner; riscv64 has none. From upstream's perspective, riscv64 is an untested architecture that happens to build and function correctly via the generic fallback path, and that has now been independently confirmed to build cleanly downstream (Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

APR has no JIT, no GC, and no SIMD dispatch. The only architecture-specific subsystem is atomic operations in `atomic/unix/`.

**Files examined (full source read), `atomic/unix/`:**

| File | Lines | Arch guard | Nature |
|---|---|---|---|
| `ia32.c` | 131 | `USE_ATOMICS_IA32` (`__i386__`/`__x86_64__`) | Hand-tuned inline asm (`cmpxchg`, `xadd`) |
| `ppc.c` | 242 | `USE_ATOMICS_PPC` (`__powerpc__`/`__PPC__`/`__ppc__`) | Hand-tuned inline asm (`lwarx`/`stwcx`) |
| `s390.c` | 159 | `USE_ATOMICS_S390` (`__s390__`/`__s390x__`) | Hand-tuned inline asm |
| `solaris.c` | 83 | `SOLARIS2>=10` | Solaris atomic_* API wrappers |
| `builtins.c` | 139 | none (arch-agnostic) | GCC `__atomic_*`/`__sync_*` intrinsics |
| `builtins64.c` | 110 | none (arch-agnostic) | Same, 64-bit ops |
| `mutex.c` / `mutex64.c` | 206 / 185 | `#else` fallback, `#warning "using stubs for all atomic operations"` | Genuine last-resort mutex-based stub, used only when no atomic builtins exist at all; irrelevant to riscv64 since GCC provides `__atomic_*` there |

**Atomic backend selection** is controlled by `include/arch/unix/apr_arch_atomic.h`:

1. If `HAVE_ATOMIC_BUILTINS` (compiler probe at configure time) - use `atomic/unix/builtins.c` (`USE_ATOMICS_BUILTINS`).
2. Else if `__i386__` or `__x86_64__` - `USE_ATOMICS_IA32`.
3. Else if `__powerpc__`/`__PPC__`/`__ppc__` - `USE_ATOMICS_PPC`.
4. Else if `__s390__`/`__s390x__` - `USE_ATOMICS_S390`.
5. Else - `USE_ATOMICS_GENERIC` (mutex-based fallback).

`HAVE_ATOMIC_BUILTINS` is checked before any architecture-specific guard, so riscv64 (identically to arm64) resolves to `USE_ATOMICS_BUILTINS` under any modern GCC/Clang and never reaches an arch-specific branch or the mutex stub. A repository-wide search for `__riscv` across all `.c`/`.h`/`.S` files returns zero matches; a GitHub code search for `__riscv repo:apache/apr` also returns zero results. There is no `include/arch/riscv/` directory. riscv64 is therefore not a stub: it is a real, working, generic implementation, byte-for-byte the same code path arm64 uses.

**Memory ordering:** `builtins.c` sets `WEAK_MEMORY_ORDERING` to 0 (strong) only for `__i386__`, `__x86_64__`, `__s390__`, `__s390x__`. riscv64 is absent from this list and therefore gets `WEAK_MEMORY_ORDERING 1`, the correct setting for RISC-V's weak memory model. This causes atomic loads to use `__sync_fetch_and_add(mem, 0)` (full barrier) rather than a plain dereference, and store/exchange operations to use `__sync_synchronize()` barriers. This is functionally correct but imposes a small overhead versus a hand-tuned implementation that could use lighter RISC-V fence variants where full sequential consistency is not required.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Atomic ops (32-bit) | Hand-tuned inline asm (`ia32.c`) | Scalar GCC builtins (`builtins.c`) | Scalar GCC builtins (`builtins.c`) |
| Atomic ops (64-bit) | Scalar GCC builtins (`builtins64.c`) | Scalar GCC builtins (`builtins64.c`) | Scalar GCC builtins (`builtins64.c`) |
| Memory ordering model | Strong (`WEAK_MEMORY_ORDERING 0`) | Weak (`WEAK_MEMORY_ORDERING 1`) | Weak (`WEAK_MEMORY_ORDERING 1`) |
| SIMD | None | None | None |
| JIT | None | None | None |
| Crypto | None (delegated to OpenSSL/NSS via apr-util) | None | None |
| DSO (`dlopen`) | glibc standard | glibc standard | glibc standard |
| Large file support | 64-bit native | 64-bit native | 64-bit native |
| ISA extensions used | None | None | None |

## 5. Build System, Cross-Compilation, and Toolchain

APR supports two build systems: autotools (primary, required for Linux/Unix) and CMake, which `README.cmake` states explicitly is "currently intended only for Microsoft Windows" (`cmake_minimum_required(VERSION 3.5)`; `build/vcpkg/apr-2/portfile.cmake`'s configure block is gated `if (VCPKG_TARGET_IS_WINDOWS)`, and the non-Windows branch is the literal comment `# In development`). There is no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` (the repo has no `cmake/` directory at all) and no Dockerfile of any kind exists in the repository.

**Native build on riscv64 (Debian/Ubuntu):**

```sh
./buildconf
./configure --prefix=/usr/local
make -j$(nproc)
make install
```

No special flags are needed. GCC 12+ on riscv64 provides `__atomic_*` builtins; `configure` detects them automatically and selects `USE_ATOMICS_BUILTINS`.

**Cross-compilation from x86_64 to riscv64:**

```sh
sudo apt-get install gcc-riscv64-linux-gnu

./buildconf

./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --prefix=/opt/apr-riscv64 \
  CC=riscv64-linux-gnu-gcc \
  AR=riscv64-linux-gnu-ar \
  RANLIB=riscv64-linux-gnu-ranlib \
  ac_cv_mmap__dev_zero=yes \
  ap_cv__atomic_builtins=yes \
  ap_cv__atomic_builtins64=yes \
  apr_cv_strerror_r_rc=0 \
  ac_cv_func_fdatasync=yes
```

**Why each override is required:**

- `ac_cv_mmap__dev_zero=yes`: `configure.in` uses `AC_TRY_RUN` (not `AC_TRY_COMPILE`) to test whether `mmap /dev/zero` works. Under cross-compilation this runtime test cannot execute and defaults to `no`. On Linux riscv64 the answer is `yes`.
- `ap_cv__atomic_builtins=yes` / `ap_cv__atomic_builtins64=yes`: The GCC atomic builtin probe uses `AC_TRY_RUN`. Under cross-compilation it defaults to `no`, causing `configure` to fall back to `USE_ATOMICS_GENERIC` (mutex-based) even though the cross-compiled binary would have working `__atomic_*` intrinsics. Setting these to `yes` forces the correct, faster path.
- `apr_cv_strerror_r_rc=0`: Tests whether `strerror_r` returns `int` (POSIX) or `char*` (GNU). On glibc/Linux riscv64 the POSIX form returns `int` (0 = success). Cannot be probed at cross-compile time.
- `ac_cv_func_fdatasync=yes`: `fdatasync` exists in glibc on Linux riscv64; the cross-compile probe defaults to `no`.

**Minimum toolchain versions:**
- GCC 7+: first version with a stable riscv64-linux-gnu target in mainline GCC. Required to produce a working binary.
- GCC 4.9+: required for `__atomic_*` built-ins. Without this, `configure` selects `USE_ATOMICS_GENERIC`.
- Clang 7+ has a riscv64 backend; no minimum is enforced in `configure.in`. [NEEDS VERIFICATION] - the exact Clang version at which `ap_cv__atomic_builtins` passes on riscv64 has not been tested.

**QEMU usage:** none, anywhere in the repository (`grep -ril qemu .` returns nothing). Upstream CI does not use QEMU for any architecture.

**`--enable-nonportable-atomics`:** on riscv64 this flag is a no-op. The `configure.in` `case $host_cpu` block enumerates only `i[34]86` and `i[56]86` for the nonportable-atomics path; all other architectures fall through the `*)` wildcard without effect.

**Known build failures on riscv64:** none filed in GitHub Issues. Debian sid builds and installs cleanly on native RISC-V hardware (rv-osuosl-02, see Section 8), with no patches to the upstream source.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Core portability APIs (files, sockets, threads, pools) | Full | Full | Full (implicit POSIX) | None |
| 32-bit atomic operations | Full (hand-tuned asm) | Full (builtins) | Full (builtins) | Performance only: no hand-tuned LR/SC or Zacas sequences |
| 64-bit atomic operations | Full (builtins) | Full (builtins) | Full (builtins) | None |
| Memory ordering overhead | Minimal (strong model assumed) | Standard weak barriers | Standard weak barriers | No difference vs arm64; small overhead vs amd64 |
| `--enable-nonportable-atomics` speedup | Yes | No | No | Same as arm64 |
| Cross-compile `configure` automation | Full (all probes pass natively) | Full | Requires manual cache overrides (Section 5) | Developer experience gap |
| Upstream CI validation | Full | Partial (one config) | None | Correctness regressions would not be caught upstream |
| Large files (`apr_off_t` 64-bit) | Yes | Yes | Yes (64-bit arch) | None |
| Crypto (apr-util, delegated to OpenSSL) | Full | Full | Functional with caveats (Section 9) | OpenSSL riscv64-specific issues, not in APR itself |
| SIMD | N/A | N/A | N/A | None (APR has no SIMD) |
| Floating-point semantics | N/A | N/A | N/A | None (APR has no floating-point paths) |
| Security hardening (ASLR, stack canaries) | Compiler/OS | Compiler/OS | Compiler/OS | None: no APR-specific hardening code |

There are no functional gaps between riscv64 and arm64 in APR. All APIs work. The gaps are performance (generic builtins path rather than hand-tuned LR/SC or Zacas atomics), developer experience (four manual configure cache overrides for cross-compilation), and upstream CI (none for riscv64).

Data not available: quantitative performance comparison between riscv64 and arm64 for APR atomic operations. No benchmarks have been published for this library on RISC-V; an exhaustive search of GitHub issues/PRs, the RISE blog, and general web search found no numeric riscv64 throughput/latency figures for APR.

## 7. CI/CD Infrastructure

APR has four GitHub Actions workflow files in `.github/workflows/`: `linux.yml`, `macos.yml`, `windows.yml`, `windows-vcpkg.yml`. Direct fetches of all four from `raw.githubusercontent.com` confirm the string "riscv" appears in none of them.

| Workflow | Trigger | Architectures tested |
|---|---|---|
| `linux.yml` | push (any branch/tag) + PR to trunk | `ubuntu-latest` (x86_64), `ubuntu-22.04-arm` (arm64, native); an 18-19 entry build matrix across repeated read passes (minor entry-count discrepancy between passes, not architecture-relevant: both confirm only these two runner types) |
| `macos.yml` | push + PR to trunk | `macos-latest` |
| `windows.yml` | push + PR to trunk | `windows-latest`/`windows-11-arm`; x64/x86/arm64 vcpkg triplets |
| `windows-vcpkg.yml` | push to trunk | `windows-latest`; x64/x86 static/dynamic triplets |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`, or `appveyor.yml` exists in the repository (all probed directly, HTTP 404). No fifth workflow file exists (12 plausible filenames probed, all 404).

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (`ubuntu-latest`) | Yes (`ubuntu-22.04-arm`) | No |
| QEMU emulated | No | No | No |
| Cross-compile CI | No | No | No |
| Build variants tested | Multiple (ASan, UBSan, shmem, crypto, LMDB, BerkeleyDB) | One (default) | None |
| RISE runner | No | No | No |
| Test suite executed in CI | Yes | Yes | No |

The only "riscv" hits anywhere in the repository are in `build/config.sub` (GNU autoconf CPU-triplet recognition) and `build/config.guess` (generic host-triplet auto-detection), both unmodified vendored GNU config scripts that never run on any GitHub Actions runner. No RISE-provided riscv64 runners are used by APR, and no funded RISE work on APR was found anywhere (RISE blog archive of 35 posts, RISE GitHub org of 26 repositories, RISE Python wheel builder listing of 80 packages: none mention APR).

## 8. Distribution and Release Status

APR does not ship binary releases via GitHub: `apache/apr` has no GitHub Releases at all ("There aren't any releases here"), for any architecture. The ASF distributes source tarballs via [downloads.apache.org](https://downloads.apache.org/apr/). All binary packages for riscv64 are built and maintained exclusively by downstream Linux distributions.

| Channel | riscv64 Available | Version | Notes |
|---|---|---|---|
| GitHub Releases | No | N/A | No releases on GitHub at all |
| ASF official binaries | No | N/A | Source tarballs only |
| PyPI | No | N/A | APR is a C library; no `apr` project exists on PyPI (HTTP 404, confirmed on `/pypi/apr/json` and `/simple/apr/`) |
| RISE wheel builder | No | N/A | Redirects to the (nonexistent) PyPI project; nothing to mirror |
| Debian stable (bookworm) | No | N/A | riscv64 not in the stable set |
| Debian sid (unstable) | Yes | 1.7.6-3+b1 | Built on rv-osuosl-02, native RISC-V hardware at OSUOSL; no patches to upstream source |
| Debian trixie | Yes | 1.7.5-1 | Installed across all architectures |
| Ubuntu 24.04 Noble | Yes | 1.7.2-3.1build2 | `libapr1t64`, `libapr1-dev`, `libaprutil1t64`, `libaprutil1-dev` all riscv64-present |
| Ubuntu 26.04 Resolute | Yes | 1.7.6-3 | `libapr1t64` and `libapr1-dev` both build for `amd64 arm64 armhf i386 ppc64el riscv64 s390x`; independently reconfirmed via a fresh, uncached HTTP-200 fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=apr&suite=resolute&searchon=names&section=all). The companion `libaprutil1t64` also builds for riscv64, via the ports pocket (1.6.3-3ubuntu3) rather than the security pocket (1.6.3-3ubuntu3.1, amd64/arm64/i386 only) |
| Ubuntu Noble (Rust binding) | Yes (amd64 + riscv64 only) | `librust-apr-dev` 0.1.9-1 | Available only on amd64 and riscv64 [NEEDS VERIFICATION - unusual platform subset] |
| Arch Linux riscv64 | Unconfirmed | N/A | `archriscv.felixc.at` lists no `apr`/`libapr` package; Arch official repos list x86_64 only |
| Fedora riscv64 | Data not available | N/A | Not checked |

Note on package naming: no package is named `apr`, `python3-apr`, or `libapr` in Debian/Ubuntu; the actual binary package names are `libapr1t64` / `libapr1-dev`, a result of the 64-bit-time_t (`t64`) package-renaming transition. A naive exact-name lookup for `apr`/`libapr` would miss the real, riscv64-available packages.

**What a user must do to get a working binary:** on Debian sid/trixie or Ubuntu Noble/26.04, `apt install libapr1-dev libaprutil1-dev`; riscv64 packages are present in the standard repositories. On other distributions, or for production use tied to a specific ASF release, build from the ASF source tarball using the commands in Section 5.

## 9. Dependencies

APR core depends only on the C runtime, pthreads, `libdl`, and a working GCC toolchain (with autoconf needed only when building from a git/SVN checkout rather than a released tarball). APR-util, the companion library providing database, XML, LDAP, and crypto APIs, pulls in the optional runtime dependencies below.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| GCC | Build-dependency (critical): compiler; also the source of the `__atomic_*`/`__sync_*` builtins APR's atomic layer relies on for every non-hand-tuned architecture, including riscv64 | GCC 7+ required for a working riscv64-linux-gnu target; GCC 4.9+ required for atomic builtins | N/A (toolchain, not a runtime dependency) | Mature riscv64 GCC packages across all major distributions | None specific to APR's use |
| autoconf | Build-dependency (optional): only needed to run `./buildconf` from a git/SVN checkout (requires autoconf, libtool, python); not needed when building from an ASF release tarball, which ships a pre-generated `configure` | N/A (build-time only) | N/A | Mature riscv64 packages across all major distributions | None |
| OpenSSL | Crypto backend for apr-util (`APU_HAVE_CRYPTO`): AES, SHA, PRNG, random entropy | Builds; dedicated `linux64-riscv64` target in `Configurations/10-main.conf`, hand-tuned riscv64 asm/intrinsics (SHA256, Zknd/Zkne) | Self-hosted `linux-riscv64` CI runner, gated to the upstream repo only; intermittent flakes reported | `libssl-dev` 3.6.3-1, Debian sid/riscv64 | See issue table below |
| expat | XML parsing backend for apr-util (default on non-Windows) | Builds; pure C, no SIMD | No riscv64 CI in libexpat's own workflows (x86_64 and MinGW only) | `libexpat1-dev` 2.8.1-1, Debian sid/riscv64 | None found |
| libxml2 | Alternative XML backend (`APR_XML_BACKEND=libxml2`) | Builds; pure C | No riscv64-specific CI observed | Available, Debian sid/riscv64 | None found |
| SQLite | DBD backend for `apr_dbd` | Builds; pure C, no SIMD | No dedicated riscv64 CI in SQLite's own test suite | `libsqlite3-dev` 3.53.2-1, Debian sid/riscv64 | None found |
| PostgreSQL | DBD backend for `apr_dbd` (via libpq) | Builds; no arch-specific code in the libpq client | No riscv64 CI observed in postgres/postgres; buildfarm riscv64 coverage unknown | `libpq-dev` 18.4-1, Debian sid/riscv64 | None found |
| Cyrus SASL | Optional SASL authentication | Builds; pure C | No riscv64-specific CI observed; one unrelated issue found (#618, Apple Silicon feature request, closed) | `libsasl2-dev`, Debian sid/riscv64 | None found |
| OpenLDAP | Optional LDAP support (`APR_HAS_LDAP`) | Builds; pure C | No riscv64-specific CI observed | `libldap-dev`, Debian sid/riscv64 | Search not completed this cycle (rate-limited); not independently re-verified |
| UUID library | UUID generation, optional (util-linux) | Standard; mature riscv64 glibc/util-linux support | Standard glibc coverage | Part of `util-linux`, Debian sid/riscv64 | None found |

**OpenSSL riscv64 issues** (the only dependency in this chain with tracked riscv64 GitHub activity; issues live in `openssl/openssl`, not `apache/apr`, and none block APR's default, non-`no-deprecated` build):

| Issue | Title | Status |
|---|---|---|
| [#30763](https://github.com/openssl/openssl/issues/30763) | Cross-compile with `no-deprecated` fails | Carried over from prior baseline; not individually re-verified this cycle (rate-limited) |
| [#30330](https://github.com/openssl/openssl/issues/30330) | Backwards null-key check in `rv64i_zkne` | Open (carried over, not freshly re-confirmed this cycle) |
| [#25334](https://github.com/openssl/openssl/issues/25334) | Zknd and Zkne extensions must coexist | Open (carried over, not freshly re-confirmed this cycle) |
| [#23011](https://github.com/openssl/openssl/issues/23011) | Unknown CSR `vlenb` | Open (carried over, not freshly re-confirmed this cycle) |
| #29453 | Use intrinsics, not inline asm | Open |
| #29269 | Additional arch testing | Open |
| #28664 | SHA256 performance | Open |
| #30880 | `test_lhash` intermittent flake in riscv64 CI | Open, independently reconfirmed this cycle |
| #28550 | Deadlock in CI | Closed since the prior baseline |
| #32229 | RISC-V runner CI failures | Opened and closed 2026-08-06 |
| #29357 | `no-deprecated` cross-compile fix | Closed since the prior baseline |

All other dependencies are pure-C libraries with no SIMD or JIT paths of their own. The full APR + apr-util dependency chain resolves on Debian sid riscv64, as confirmed by the `libaprutil1t64` and `libaprutil1-dbd-*` packages all being present alongside `libapr1t64`.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs are filed for APR itself in any tracker searched, and this was independently re-verified in this reporting cycle.

| Source | Query | Results |
|---|---|---|
| GitHub apache/apr issues | "riscv" | 0 |
| GitHub apache/apr issues | "riscv64" | 0 |
| GitHub apache/apr pull requests | "riscv", "riscv64" | 0 |
| GitHub apache/apr commits | "riscv" | 0 |
| Debian bug tracker (libapr1t64) | All open | 0 ("No reports found") |

There are no correctness bugs, no performance bugs, and no open work items for riscv64 in APR upstream. The only live riscv64 bugs anywhere in the dependency tree are in OpenSSL (Section 9), and none of them block APR's default build against OpenSSL on riscv64 unless the builder passes `no-deprecated` to OpenSSL's `./Configure` step.

**Architectural note:** the `WEAK_MEMORY_ORDERING 1` path in `builtins.c` applies `__sync_synchronize()` before atomic stores and exchange operations on riscv64. This is conservative and functionally safe but not tuned; a hand-written implementation could use finer-grained RISC-V fence variants (for example `fence.r.rw`, `fence.rw.w`) where full sequential consistency is not required. No bug has been filed for this; it is a performance gap, not a correctness bug.

## 12. Objections and Upstream Blockers

**Stated objections:** none. No maintainer has expressed any objection to riscv64 support, and no mailing-list discussion on the topic was found. The absence of any tracking issue means the topic has never been raised.

**Technical blockers:** none. APR builds and runs correctly on riscv64 today via the generic GCC builtins path. The Debian native build on rv-osuosl-02, and the independently reconfirmed Ubuntu 26.04 Resolute build, are the existence proof.

**Organizational blockers:** none structural. The CTR commit model means a well-formed patch for a riscv64 atomic backend or CI addition would land without a pre-approval vote. The community is small, so reviewer bandwidth is limited; patches would need to be high quality on first submission.

**Cross-compilation configure overrides:** a developer-experience issue, not a blocker. The four required overrides (Section 5) are documented above and could be eliminated by replacing the affected `AC_TRY_RUN` probes with `AC_TRY_COMPILE` probes, a clean, low-risk upstream contribution.

**Acceptance probability:** high. APR explicitly uses a generic builtins fallback path for new architectures by design. A PR adding a riscv64 CI matrix entry (via QEMU or a RISE-provided runner) would face no technical objection; reviewer availability is the only risk. No such PR is currently open or proposed.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project: APR is a general OS-portability library (threads, mutexes, atomics, file I/O, DSO) with no SIMD/crypto/numerics performance claim of its own, so no optimization level applies and the optimization gap is not applicable.
- **Justification:** APR has zero riscv64 upstream CI: only `ubuntu-latest` (x86_64) and `ubuntu-22.04-arm` (arm64) runners exist in [.github/workflows/linux.yml](https://github.com/apache/apr/blob/trunk/.github/workflows/linux.yml), and `macos.yml`/`windows.yml`/`windows-vcpkg.yml` have no riscv reference, so the CI-only grade would be orange. The distribution floor raises this one notch to yellow (clean-distro-build): Debian sid/trixie and Ubuntu Noble/26.04 build and ship `libapr1t64`/`libapr1-dev` 1.7.6-3 for riscv64 from unmodified upstream source, confirmed via a native build on Debian's rv-osuosl-02 riscv64 hardware with no patches to the upstream source.
- **Pending work that could change the grade:** no open riscv64 tracking issue, PR, or commit exists in `apache/apr` (confirmed via repeated GitHub issue, PR, and commit searches across this reporting cycle). No RISE involvement or funded work on APR was found. A low-effort upstream contribution, such as adding a riscv64 CI matrix entry using a RISE-provided runner, would raise this to blue or green, since the project already builds cleanly on riscv64 downstream; nothing of this kind is currently proposed.

## 14. Investment Analysis

RISE has no funded work on APR. The entire riscv64 functional baseline comes from the generic GCC builtins path and downstream Debian/Ubuntu packaging; neither required upstream effort.

### 14.1 Functional Enablement

APR is already functionally complete on riscv64. No functional gaps exist and no work is required to make APR run correctly on riscv64.

### 14.2 Performance Optimization

A dedicated `atomic/unix/riscv.c` (or `riscv64.c`) using hand-tuned LR/SC sequences from the A extension, or CAS instructions from Zacas, could reduce atomic-operation overhead. The existing `ppc.c` (242 lines) is a suitable template. Practical impact on APR-using applications (httpd, Subversion) is expected to be low, since APR atomic operations are not on hot paths in those applications. Data not available: measured overhead of the builtins path versus a hand-tuned path on current RISC-V silicon.

### 14.3 CI/CD Infrastructure

Adding a riscv64 CI runner (QEMU-based or native, via RISE-provided hardware) to `linux.yml` would provide upstream regression detection, currently absent entirely. This is the highest-value item, since upstream has zero visibility into riscv64 behavior today, and it is the specific change identified in Section 13 as sufficient to raise the readiness grade. A RISE runner contribution is the standard mechanism for this pattern.

### 14.4 Ecosystem Enablement

Not applicable. APR is a system library with no dependent package ecosystem requiring separate enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 matrix entry to `linux.yml` using a RISE-provided native runner or QEMU | 0.5 | RISE infra / APR committer | High: zero upstream regression detection today, and the specific gap holding the grade at yellow |
| Build system | Replace `AC_TRY_RUN` with `AC_TRY_COMPILE` for the four cross-compile probe overrides, eliminating the need for manual cache variables | 1 | APR committer | Medium: developer-experience improvement, no functional impact |
| Performance | Implement `atomic/unix/riscv.c` with LR/SC (A extension) and optional Zacas sequences; update `apr_arch_atomic.h` dispatch | 3-4 | C systems engineer with RISC-V ISA knowledge | Low: functional gap is absent, performance gap is minor for typical APR workloads |
| Functional | None required | 0 | N/A | N/A |
| Ecosystem | None required | 0 | N/A | N/A |

## 15. References

- [apache/apr GitHub repository](https://github.com/apache/apr)
- [apache/apr pull requests](https://github.com/apache/apr/pulls)
- [apache/apr atomic/unix directory](https://github.com/apache/apr/tree/trunk/atomic/unix)
- [apache/apr .github/workflows directory](https://github.com/apache/apr/tree/trunk/.github/workflows)
- [apache/apr build/config.sub](https://github.com/apache/apr/blob/trunk/build/config.sub)
- [Apache APR homepage](https://apr.apache.org/)
- [Debian buildd status for apr (sid)](https://buildd.debian.org/status/package.php?p=apr&suite=sid)
- [Ubuntu Noble libapr1t64 package](https://packages.ubuntu.com/noble/libapr1t64)
- [Ubuntu Noble libaprutil1t64 package](https://packages.ubuntu.com/noble/libaprutil1t64)
- [Ubuntu 26.04 Resolute package search: apr](https://packages.ubuntu.com/search?keywords=apr&suite=resolute&searchon=names&section=all)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [OpenSSL issue #30763, cross-compile no-deprecated](https://github.com/openssl/openssl/issues/30763)
- [OpenSSL issue #30330, rv64i_zkne null-key check](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #25334, Zknd/Zkne coexistence](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #23011, unknown CSR vlenb](https://github.com/openssl/openssl/issues/23011)
- [OpenSSL issue #30880, test_lhash flake](https://github.com/openssl/openssl/issues/30880)