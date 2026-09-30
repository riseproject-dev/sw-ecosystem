---
title: Apache httpd
parent: Project Reports
color: orange
dependencies:
  - name: APR
    relation: runtime-dependency
    criticality: critical
  - name: APR-util
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: PCRE2
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Perl
    relation: test-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: nghttp2
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: Jansson
    relation: runtime-dependency
    criticality: optional
  - name: Lua
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="apache-httpd" %}

# Apache httpd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache httpd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache httpd is the Apache HTTP Server, a general-purpose HTTP server maintained by the [Apache Software Foundation](https://www.apache.org/) (ASF), a Delaware 501(c)(3) nonprofit. It is one of the most widely deployed web servers on the public internet. License: Apache License 2.0. The primary source of record is SVN; the GitHub repository at [apache/httpd](https://github.com/apache/httpd) is a mirror. The project's bug tracker is [ASF Bugzilla](https://bz.apache.org/bugzilla/), which requires authentication and could not be searched in this research.

**Governance:** ASF Members elect a Board of Directors, which charters Project Management Committees (PMCs). The httpd PMC votes on new committers and PMC members, sets project policy, and approves releases under the standard ASF lazy-consensus model, reporting quarterly to the Board, not to any corporate sponsor. Corporate independence is explicit ASF policy: sponsors are not part of corporate governance at the ASF. Commit rights are granted to individuals on merit ("the Apache Way"), never to companies, and contributors must sign an Individual CLA to become committers. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository; committer status lives in PMC records on the ASF website, not in the repo.

**Corporate affiliations of contributors** (self-reported bios from [httpd.apache.org/contributors/](https://httpd.apache.org/contributors/), employer at time of major contribution, not necessarily current):

| Contributor | Company | Contribution area |
|---|---|---|
| Rich Bowen | Red Hat | Docs, community |
| Mark Cox | Red Hat, Inc. | mod_status, cookies, DBM code |
| Ken Coar | IBM Corporation | mod_autoindex, FAQ |
| Eric Covener | IBM | LDAP, bug fixes |
| Rasmus Lerdorf | IBM | Core contributions |
| Victor J. Orlikowski | IBM | Core contributions |
| Dan Poirier | IBM | Core contributions |
| Paul J. Reder | IBM | Core contributions |
| Bill Stoddard | IBM | Core contributions |
| Stefan Eissing | greenbytes GmbH | mod_http2 / HTTP/2 support |
| William A. Rowe Jr. | SpringSource/VMware | Win32 kernel/porting |
| Ruediger Pluem | Vodafone | Infra, bug fixes |
| Paul Querna | Rackspace Hosting | Architecture |
| Aaron Bannert | Codemass, Inc. | APR, worker MPM |
| Brad Nicholes | Novell, Inc. | NetWare port |
| Madhusudan Mathihalli | Hewlett Packard | HP-UX contributions |

A large share of the historic contributor base is either "Independent" or affiliated with hosting/infrastructure vendors (Covalent, C2Net, kippdata, HEAnet), consistent with a vendor-neutral, individual-merit community rather than single-company control. No corporate sponsorship is directed at the httpd project specifically; the ASF is sponsored as a whole and funds are not earmarked for individual projects. ASF-wide Platinum sponsors include Apple, Amazon Web Services, Meta, Google, Huawei, Microsoft, Snowflake, and Visa; Silver tier includes Red Hat and IBM (per [apache.org/foundation/thanks.html](https://www.apache.org/foundation/thanks.html)).

**Community culture on new ports:** There is no formal platform/architecture tier system, no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` tier matrix, and no visible RFC/porting-request process for new CPU architectures. This is consistent with httpd delegating platform portability to APR and autoconf rather than handling it explicitly. The `STATUS` file has historically listed legacy platforms (OS/2, NetWare) as candidates for removal, indicating the project actively prunes unused platform support rather than adding new tiers. Community activity on riscv64 specifically is zero: no mailing-list threads, GitHub issues, PRs, or commits reference riscv64 anywhere in the repository, independently reconfirmed multiple times in this research cycle (`git grep -i riscv` across the full tracked tree at HEAD `4a521896a65ffcce6648ff379d0a81265ace04eb`, zero matches; `mcp__github__search_issues`, `search_pull_requests`, `search_commits`, and `search_code` against `repo:apache/httpd`, all `total_count: 0`). Apache httpd has no RISE Project membership or involvement (Section 12).

## 2. Port History and Upstreaming Timeline

Apache httpd has no RISC-V port history in its upstream repository and no first RISC-V commit to report.

| Date | Event | Source |
|---|---|---|
| -- | No riscv/riscv64 commit, issue, or PR has ever been created in apache/httpd | `git grep -i riscv` (0 matches), `search_issues`/`search_pull_requests`/`search_commits`/`search_code` (all `total_count: 0`) against `repo:apache/httpd`, independently re-verified this cycle |

The project contains no architecture-specific code at any level. The httpd `os/` directory contains only `unix/`, `win32/`, `os2/`, `netware/`, `bs2000/`. No `riscv/` or `riscv64/` subdirectory has ever existed, and there are no `.S` assembly files anywhere in the repository for any architecture. riscv64 works without a dedicated port because httpd is pure portable C with no CPU-ISA-specific code paths; all architecture-sensitive functionality (atomics, thread primitives) is delegated to [APR](https://github.com/apache/apr), which handles riscv64 via GCC/Clang `__atomic_*` compiler intrinsics (Section 4).

**Negative-control check on the search methodology:** the same `__riscv` code search run with `org:apache` (no repo filter) returns real hits across other ASF projects -- `apache/brpc` has hand-written RVV vector intrinsics and inline `rdcycle` assembly; `apache/nuttx` has riscv assembly (`arch_strcmp.S`); `apache/orc`, `apache/arrow`, `apache/trafficserver` (via vendored Highway), `apache/hadoop`, `apache/doris`, `apache/mynewt-core`, `apache/fory`, and `apache/couchdb` all have genuine `__riscv`/`__riscv_vector`-guarded code. This confirms the absence in httpd/APR is a real finding, not a search blind spot: sibling ASF projects in the same organization demonstrably write riscv-specific code when they need to; httpd/APR never needed to.

The APR repository (`apache/apr`) also contains no riscv-specific implementation code: its `.github/workflows/` files (linux.yml, macos.yml, windows.yml, windows-vcpkg.yml) have zero riscv references, and `atomic/unix/builtins.c` / `builtins64.c` implement every required atomic primitive via `__atomic_*` builtins with no gaps. The string "riscv" appears in APR's `build/config.guess` and `build/config.sub`, the standard GNU autoconf target-triplet recognition scripts shared by virtually all autoconf projects -- generic boilerplate, not APR-specific implementation code.

Is httpd "fully upstream" for riscv64? There is nothing to be upstream or downstream of: no port was ever required, proposed, or merged, because the codebase needed no architecture-specific changes to run on riscv64.

## 3. Upstream Support Tier

Apache httpd does not publish a formal tiered-support policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repository). `README.platforms` covers Darwin, FreeBSD, HP-UX, AIX, Solaris, and Ubuntu, with no RISC-V mention and no compiler-version minimums stated for any platform.

riscv64 is not listed as a supported, unsupported, or experimental target by the upstream project. The upstream project has no stated position on riscv64 at all: it is neither included nor excluded.

| Architecture | Upstream CI | Upstream release binaries | De-facto distro support |
|---|---|---|---|
| amd64 | Yes (`ubuntu-latest`) | Source only | Full |
| arm64 | Yes (`ubuntu-24.04-arm`, native) | Source only | Full |
| riscv64 | None | Source only | Full (Debian Sid, Ubuntu 24.04, Ubuntu 26.04) |

De-facto support status, based on distribution evidence, is strong: riscv64 builds successfully and is treated as a first-class architecture by both Debian and Ubuntu packaging teams (Section 8). The upstream project is unaware of this because no issues, patches, or CI work has ever been contributed upstream for riscv64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache httpd is a pure-C POSIX server. It has no JIT, no SIMD dispatch, no inline assembly, and no architecture-specific code paths anywhere in the source tree, for any ISA -- amd64 and arm64 also have zero dedicated files in httpd itself. This was independently re-audited this cycle via a full-tree search for every plausible arch-guard pattern (`riscv`, `__riscv`, `__x86_64__`, `__aarch64__`, `__arm__`, `__i386__`, `_M_X64`, `_M_ARM`, `__amd64`, `__ARM_`, `__powerpc`, `__ppc__`): zero matches, with one exception -- a single `#if !__sparc__` guard in `server/core.c` (lines 5861-5863) working around a GCC <4.8 codegen bug (PR 52900) in a random-number function, unrelated to performance or feature implementation. No `.s`/`.asm` files exist anywhere in the repository, and `srclib/` contains only `Makefile.in` (APR, APR-util, PCRE2, and OpenSSL are external build dependencies, not vendored).

All crypto and compression SIMD acceleration is delegated to external libraries (OpenSSL, zlib, brotli). Those libraries handle their own architecture dispatch internally and are out of scope for the httpd source tree (Section 9).

**APR atomics on riscv64.** The only architecture-specific layer that httpd depends on is APR's atomic operations. APR's `include/arch/unix/apr_arch_atomic.h` selects an implementation by cascading through architecture checks. There is no `riscv.c` or `riscv64.c` in APR. `HAVE_ATOMIC_BUILTINS` is checked before the `__i386__`/`__x86_64__` (IA32), `__powerpc__` (PPC), and `__s390__` (S390) hand-asm branches; riscv64 matches none of those architecture guards and takes the compiler-builtins path (`builtins.c` / `builtins64.c`) via the same fallthrough arm64 uses. This is a deliberate, intentional selection, not an accidental omission.

`builtins.c` and `builtins64.c` fully implement every required primitive (`read`, `set`, `add`, `sub`, `inc`, `dec`, `cas`, `xchg`, `casptr`/`xchgptr`) using `__atomic_*` GCC/Clang builtins at `__ATOMIC_SEQ_CST`, with zero TODO/FIXME/"not implemented" markers in either file:

```c
#if defined(__i386__) || defined(__x86_64__) \
    || defined(__s390__) || defined(__s390x__)
#define WEAK_MEMORY_ORDERING 0
#else
#define WEAK_MEMORY_ORDERING 1   // riscv64 lands here
#endif
```

With `WEAK_MEMORY_ORDERING 1`, all atomic operations use `__ATOMIC_SEQ_CST` ordering, correct for RISC-V's weak memory model, and apply `__sync_synchronize()` before atomic stores and exchange operations -- conservative and functionally safe but not tuned to RISC-V-specific fence variants. arm64 (AArch64) is in the same category and is considered fully supported by the project.

APR also contains a genuine stub path for platforms lacking compiler atomic support at all (`atomic/unix/mutex.c` / `mutex64.c`, carrying a literal `#warning`). Since GCC/Clang have supported `__atomic` builtins for RISC-V since baseline RV64 support landed, riscv64 never reaches this stub path -- it is a real, complete, non-stub implementation, just not hand-tuned assembly.

| Architecture | Dedicated arch files (httpd) | Dedicated APR atomic files | Rating |
|---|---|---|---|
| amd64 / x86_64 | 0 | 1 (`ia32.c`, hand-tuned inline asm) | full (hand-tuned) |
| arm64 / aarch64 | 0 | 0 (uses `builtins.c`) | partial (C intrinsics) |
| PowerPC | 0 | 1 (`ppc.c`, hand-tuned inline asm) | full (hand-tuned) |
| IBM S390 | 0 | 1 (`s390.c`, hand-tuned inline asm) | full (hand-tuned) |
| riscv64 | 0 | 0 (uses `builtins.c`) | partial (C intrinsics) |

The absence of a dedicated `riscv64.c` in APR is not a functional gap: riscv64 and arm64 receive identical treatment. Outside httpd/APR's own code, the remaining architecture-sensitive components are external dependencies: TLS/crypto (OpenSSL -- which, per this cycle's findings, has extensive dedicated riscv64 vector-crypto assembly, see Section 9), compression (zlib, generic C, no RVV path merged), and pattern-matching JIT (PCRE2/SLJIT -- which has a full upstream riscv64 JIT backend including RVV, see Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

The CMake build (`CMakeLists.txt`, 1,284 lines at repo root) is Windows-only, per its companion `README.cmake`: "Experimental cmake-based build support for Apache httpd on Microsoft Windows... This build support is currently intended only for Microsoft Windows." `grep -i riscv` on the full file returns zero matches, and the file uses no `-DUSE_X=OFF`-style flags at all; its module-toggle flags are named `-DENABLE_<module>=A|I|O|a|i` (Activate/Inactive/Omit). All Linux and riscv64 builds use the autoconf path.

**Standard native build** (from `INSTALL`, the actual build doc; `README.md` is a project-overview stub):

```bash
./buildconf   # from SVN/git only; not needed for release tarballs
./configure \
  --prefix=/usr/local/apache2 \
  --with-apr=/path/to/apr \
  --with-apr-util=/path/to/apr-util \
  --enable-mods-shared=reallyall \
  --enable-mpms-shared=all
make -j$(nproc)
make install
```

`BUILDING.md`, `docs/building.md`, and `docs/cross-compilation.md` do not exist in the repository.

**Cross-compilation for riscv64.** There is no upstream cross-compilation toolchain file for riscv64 (`cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` are both absent; there is no `cmake/` toolchain-file directory at all). `configure.in` establishes host/build/target triplets via `AC_CANONICAL_HOST`; the only OS/arch-specific branch in the entire `case $host in ... esac` is `*os2*` -- every other host, including any `riscv64-*-linux-gnu` triplet, falls through to the generic `*)` branch with no special-casing. The only documented cross-compilation procedure for riscv64 anywhere is from the Debian packaging team (`debian/rules`), addressing a single known issue: the build system runs `server/gen_test_char` at build time, which must be compiled for the build host, not the target:

```bash
export CC=riscv64-linux-gnu-gcc
gcc -DCROSS_COMPILE server/gen_test_char.c -o server/gen_test_char
./server/gen_test_char > server/test_char.h
touch server/gen_test_char.lo

./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --with-pcre=/usr/bin/pcre2-config \
  CC=riscv64-linux-gnu-gcc
```

This is standard Autoconf convention inferred from `configure.in`, not an httpd-published procedure; no riscv64-specific `configure` flags or known-broken-module list exist in the source.

**Known test suite issue in emulated/cross environments** (`test/travis_before_linux.sh`):

```bash
# non-x86 builds have an IPv6 configuration which breaks the test suite.
# Apache::Test only configures Listen on 0.0.0.0 but
# Apache::TestServer::wait_till_is_up() tries to connect via ::1.
if grep ip6-localhost /etc/hosts; then
    sudo sed -i "/ip6-/d" /etc/hosts
fi
```

This affects all non-x86 build environments including riscv64 QEMU VMs and native boards. The test suite (`t/`) is driven by the Perl `Apache::Test` framework, making a working Perl toolchain a test-time (not runtime) dependency; no riscv64-specific issues against Perl were found.

No QEMU references, no riscv64-specific Dockerfiles, and no `.ci/`, `docker/`, or `.asf.yaml` directories exist in the repository. The only two Dockerfiles in the whole repo (`test/travis_Dockerfile_slapd` and `test/travis_Dockerfile_slapd.centos`) are LDAP test fixtures for x86 CI, unrelated to riscv64.

**Minimum toolchain versions:**

| Component | Minimum | Reason |
|---|---|---|
| GCC (riscv64-linux-gnu-gcc) | 7.1 | First upstream RISC-V support (RV64GC, lp64d ABI) |
| GNU binutils | 2.28 | First upstream RISC-V support; note binutils < 2.38 (pre-Ubuntu-Noble) fails to assemble OpenSSL's Zvk vector-crypto instructions -- a toolchain floor, not a code defect (Section 9) |
| glibc | 2.27 | First upstream RISC-V port |
| APR | 1.7.x or trunk (2.x) | httpd trunk requires APR 2.0 or APR 1.7.x + APR-util 1.7.x |
| PCRE2 | 10.x (any) | Required; `--with-pcre2` or system `libpcre2-dev` |
| QEMU (emulated native) | 2.12+ | First QEMU with riscv64 virt machine complete enough for Linux |
| Linux kernel | 4.15+ (4.19+ recommended) | First kernel with upstream RISC-V port |

No GCC/Clang minimum version is documented anywhere in the repository specifically for riscv64. No riscv64-specific `--disable-X` flags are required. The `gen_test_char` cross-compilation workaround and the IPv6 `/etc/hosts` workaround are the only known build/test-time issues.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| APR atomic 32-bit ops | hand-tuned inline asm (`ia32.c`) | C intrinsics (`builtins.c`) | C intrinsics (`builtins.c`) | Functional parity; amd64 may have marginal latency advantage |
| APR atomic 64-bit ops | hand-tuned inline asm (`ia32.c`) | C intrinsics (`builtins64.c`) | C intrinsics (`builtins64.c`) | Same as above |
| APR mutex / locks | POSIX pthreads | POSIX pthreads | POSIX pthreads | Identical |
| httpd MPM (event/worker/prefork) | pure C | pure C | pure C | Identical |
| httpd connection handling | pure C | pure C | pure C | Identical |
| httpd module architecture | OS-level only | OS-level only | OS-level only | Identical |
| TLS (mod_ssl via OpenSSL) | full hardware acceleration | full hardware acceleration | full vector-crypto acceleration on Zvkned/Zvbb/Zvkg/Zbb/Zvk hardware; software fallback (T-table, not constant-time) otherwise | Dedicated riscv64 asm exists for AES, SHA-256/512, GCM/GHASH, ChaCha20, Montgomery bignum, SM2; gap is hardware-dependent, not code-dependent (Section 9) |
| Compression (mod_deflate via zlib) | SIMD (SSE2/AVX512) | SIMD (NEON) | generic C only; one unmerged RVV Adler32 PR (#1099) | Performance gap, not correctness gap |
| Compression (mod_brotli via brotli) | architecture-optimized | architecture-optimized | base port upstream since 2018 (PR #669); RVV-accelerated PR #1489 open, unreviewed | Functional; performance-optimization work in flight upstream |
| HTTP/2 (mod_http2 via nghttp2) | full | full | full (pure C/C++, no arch-specific code by design) | No material open riscv64 issues found |
| Pattern matching (mod_rewrite via PCRE2) | JIT-accelerated (SLJIT) | JIT-accelerated (SLJIT) | Full riscv64 JIT backend upstream (integer ops 2022-04, FPU 2022-05, RVV SIMD 2024-06, RVC compressed-instruction support Jan 2025) | Strongest riscv64 story of any httpd dependency; a reviewer flagged a possible RISC-V SIMD crash concern on PR #583 (Nov 2024, unresolved in thread) and sljit PR #350 (Dec 2025) fixed an overflow-check correctness bug |
| Lua scripting (mod_lua) | reference Lua interpreter | reference Lua interpreter | reference Lua interpreter, LP64D ABI maps cleanly | httpd uses reference Lua, not LuaJIT; no JIT gap |

**Summary:** For the httpd core and all standard modules, riscv64 is at feature parity with arm64. The measurable gaps are OpenSSL TLS acceleration on hardware lacking vector-crypto extensions (security-relevant) and zlib/brotli SIMD throughput (performance only, with community RVV work already open upstream for both).

## 7. CI/CD Infrastructure

Apache httpd upstream CI has no riscv64 coverage. Independently re-verified this cycle via a fresh clone (HEAD `4a521896a65ffcce6648ff379d0a81265ace04eb`, 2026-09-30) with a full-tree `git grep -i riscv` (zero matches) and `git grep -i qemu` (zero matches); no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exists anywhere in the repository. `git log --all -i --grep=riscv` returns no commits.

The repository contains exactly three workflow files, all read in full: [`.github/workflows/linux.yml`](https://github.com/apache/httpd/blob/trunk/.github/workflows/linux.yml) (~30 matrix jobs: MPM variants, ASan/UBSan, OpenSSL/APR version combinations), `.github/workflows/sanity.yml` (three jobs: aplogno, buildconf, docs checks), and `.github/workflows/windows.yml`. Triggers in every workflow are `push` (all branches, path-filtered) and `pull_request` (branches `trunk`, `2.4.x`) only; there is no `workflow_dispatch` or `schedule` trigger anywhere in any file.

| Workflow | Runner | Architecture |
|---|---|---|
| linux.yml | `ubuntu-latest` (~29 matrix configs) | x86_64 |
| linux.yml | `ubuntu-24.04-arm` (1 matrix entry: "Shared MPMs, all-modules, 64-bit ARM") | arm64, native GitHub-hosted runner, not QEMU |
| sanity.yml | `ubuntu-latest` (3 jobs) | x86_64 |
| windows.yml | `windows-latest` | x64 |

The single arm64 matrix entry builds with `--enable-mods-shared=reallyall --enable-mpms-shared=all`, the identical generic configuration used by the x86_64 jobs -- no arch-specific flags, no emulation layer. There is no `ubuntu-24.04-riscv64` GitHub Actions runner (none exists in GHA as of this report date), nor any QEMU-based riscv64 emulation job.

riscv64 builds are tested exclusively by downstream distribution infrastructure (Debian buildd, Ubuntu Launchpad/ports), entirely outside apache/httpd's own CI. As a cross-check, APR's own CI (`apache/apr`, linux.yml/macos.yml/windows.yml/windows-vcpkg.yml) was also confirmed to have zero riscv references.

**New infrastructure note (not yet used by httpd):** RISE announced free, native RISC-V GitHub Actions runners on 2026-03-24 ("Announcing the RISE RISC-V Runners"), and a 2026-05-12 follow-up post lists the runners' adopter projects as of that date: llama.cpp, PyTorch, k0s, Kairos, k3s, Kubernetes, containerd, mldsa-native, mlkem-native, NumPy, alibaba/zvec, kubetail, Home Assistant, DuckDB, Docker, armbian/os, wazero, pyca/cryptography, Portable-Network-Archive, mullvadvpn-app-riscv, and uiua. Apache httpd is not among them, and no RISE blog post or GitHub search surfaced any indication that httpd has requested or evaluated this runner pool. This is now a concrete, low-effort mechanism available for adding riscv64 CI to apache/httpd's `linux.yml` matrix (Section 14.3), where none existed as a real option when GitHub Actions had no riscv64 runner of its own.

## 8. Distribution and Release Status

Apache httpd upstream does not publish binary releases. The official download at [httpd.apache.org/download.cgi](https://httpd.apache.org/download.cgi) provides only source tarballs (`httpd-2.4.68.tar.bz2`, `httpd-2.4.68.tar.gz`). Architecture-specific binary packaging is entirely delegated to downstream OS distributions.

| Distribution | Package name | riscv64 available | Version | Build status |
|---|---|---|---|---|
| Debian Sid | apache2 | YES | 2.4.68-2 | Installed on native riscv64 buildd hardware at OSU Open Source Lab |
| Ubuntu 24.04 Noble | apache2 (binary `apache2-bin`) | YES | 2.4.58-1ubuntu8 | `.deb` confirmed via [packages.ubuntu.com/noble/riscv64/apache2](https://packages.ubuntu.com/noble/riscv64/apache2) |
| Ubuntu 26.04 "resolute" (main) | apache2 (binary `apache2-bin`) | YES | 2.4.66-2ubuntu2 | Ports pocket; confirmed live via [packages.ubuntu.com/resolute/riscv64/apache2-bin](https://packages.ubuntu.com/resolute/riscv64/apache2-bin), HTTP 200, package files listed |
| Ubuntu 26.04 "resolute-updates" | apache2 (binary `apache2-bin`) | YES | 2.4.66-2ubuntu2.4 and 2.4.68-1ubuntu4 | Confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=apache2&searchon=names&suite=all&section=all); riscv64 listed alongside amd64/arm64/armhf/i386/ppc64el/s390x |
| openSUSE Tumbleweed | apache2 | Reported YES [NEEDS VERIFICATION] | 2.4.62-1.1 | Web search only; not cross-checked against a build log |
| AlmaLinux / Fedora RPM | httpd | Reported YES [NEEDS VERIFICATION] | e.g. `httpd-2.4.63-13.el10.riscv64` | Web search only; not cross-checked against a build log |
| Docker Official Images | `riscv64/httpd` | Reported YES [NEEDS VERIFICATION] | e.g. tag 2.4.66 | Web search only; not independently re-confirmed against Docker Hub's manifest |
| Arch Linux RISC-V | apache | Likely YES [NEEDS VERIFICATION] | -- | Not present in the archriscv FTBFS failure tracker; no positive package URL confirmed |
| GitHub Releases (apache/httpd) | -- | NO | -- | Repo is a source-only SVN mirror; no prebuilt binary assets for any architecture. Direct `list_releases`/API confirmation was blocked this session (apache/httpd not in this session's allowed GitHub-API repo list), so this rests on the confirmed architectural fact (source-tarball-only distribution model) rather than a fresh API call |
| PyPI (`apache-httpd`) | -- | NO | -- | HTTP 404 on `pypi.org/pypi/apache-httpd/json`, independently reproduced this cycle; also 404 via the RISE GitLab wheel-builder proxy (redirects to the same nonexistent PyPI project). Expected: httpd is a native C server, not Python-packaged |

**Patch-status discrepancy (material to Section 13):** one verification pass this cycle fetched Debian's `apache2` source-package patch list directly ([sources.debian.org/src/apache2/2.4.68-2/debian/patches/](https://sources.debian.org/src/apache2/2.4.68-2/debian/patches/)) and reported 16 patches total, none mentioning riscv or any CPU architecture, concluding this is a clean, unpatched distro build and arguing for a yellow (clean-distro-build) grade. This finding was not corroborated by a second pass in this research cycle, and the authoritative readiness grade for this report (Section 13) treats Debian/Ubuntu's riscv64 patch status as unconfirmed. Both are recorded here rather than silently reconciled: the patch-list read, if independently reproduced, would be the single action that resolves this ambiguity (Section 13, Section 14.5).

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build status | riscv64 test status | riscv64 release | Notes / open issues |
|---|---|---|---|---|---|---|
| APR | Core I/O, threading, memory pools, atomics | Critical (runtime) | Generic GCC `__atomic_*` builtins path (Section 4); Debian Sid `libapr1t64`/`libapr1-dev` 1.7.6-3 | No upstream riscv64 CI; validated via distro build farms | Ubuntu 26.04 "resolute" and Noble, Debian Sid | 0 open riscv64 issues in `apache/apr` |
| APR-util | APR extension: crypto, DBD, LDAP | Critical (runtime) | Not independently deep-dived; follows APR | Same gap as APR | Ubuntu Noble ships `libaprutil1t64`/`-dev` for riscv64 via ports pocket | Flagged as a research gap, not "no issues"; merged into APR 2.x upstream |
| OpenSSL | TLS for mod_ssl | Critical (runtime) | Extensive dedicated riscv64 asm: AES (4 variants incl. Zvkned/Zvbb/Zvkg vector-crypto), SHA-256/512 (Zbb + Zvk vector), GCM/GHASH (Zbc/Zvbc/Zvkg), ChaCha20 (V+Zbb), Montgomery bignum (RV64I+M), SM2; Debian Sid 3.6.3-1 | Dedicated `riscv-more-cross-compiles.yml` CI, 13 extension-specific configs, on `ubuntu-latest` | Ubuntu 24.04 Noble: core `openssl` supports riscv64; 26.04/resolute not independently reconfirmed | No material blocking issue found this cycle; binutils <2.38 fails Zvk assembly (toolchain floor, not a code bug). Hardware without Zkn/Zvkned falls back to software T-table AES, which is not constant-time -- security-relevant for TLS on such hardware |
| PCRE2 (bundles sljit) | URL pattern matching for mod_rewrite; includes JIT backend | Critical (runtime) | Full riscv64 JIT backend upstream (integer ops 2022-04, FPU 2022-05, RVV SIMD 2024-06, RVC support Jan 2025); Debian Sid 10.46-1+b2 | riscv64 CI job added 2025-01 (opportunistic, not release-gating); `pcre2_jit_test` confirmed passing on real riscv64 hardware (Fedora, Jan 2023) | Ubuntu 24.04 Noble: 14 riscv64 packages incl. `libpcre2-8-0`/`-dev`; Gentoo unmasked `jit` USE flag for riscv64 Oct 2025 | Reviewer-flagged possible SIMD crash concern on PR #583 (Nov 2024, unresolved in thread); sljit PR #350 (Dec 2025) fixed an overflow-check bug |
| GCC | Toolchain compiler | Critical (build) | riscv64-linux-gnu-gcc >= 7.1 required | N/A | Ubuntu 26.04 ships riscv64 GCC as a primary architecture | Data not available: no dedicated GCC issue-tracker search performed against httpd's own build this cycle |
| GNU binutils | Toolchain assembler/linker | Critical (build) | >= 2.28 required; >= 2.38 needed for OpenSSL's Zvk assembly | N/A | Ubuntu 26.04 ships riscv64 binutils as a primary architecture | Data not available: no dedicated binutils issue-tracker search performed this cycle |
| glibc | C runtime | Critical (runtime) | >= 2.27 required, installed | Historical (fixed) | Ubuntu 26.04 ships riscv64 glibc as a primary architecture | Historical SIGILL bug for RVV prctl-disabled contexts in `memset`, fixed in glibc 2.43 |
| Perl | Test framework (`Apache::Test`) for httpd's own test suite | Critical (test) | N/A (test-time only) | Drives `t/` via `Apache::Test`/`Apache::TestServer` (Section 5) | -- | Data not available: no riscv64-specific Perl packaging issues searched this cycle |
| zlib | Compression for mod_deflate | Optional (runtime) | Pure portable C, zero arch-specific code (`#ifdef __riscv` appears nowhere); one unmerged RVV Adler32 PR (#1099, open); Debian Sid 1.3.dfsg-3.1ubuntu2 | No Linux riscv64 CI entry (OpenBSD/riscv64 via vmactions merged 2026-01; Linux QEMU matrix covers arm/ppc/s390x but not riscv64) | Ubuntu 24.04 Noble: `zlib1g`/`-dev` riscv64-present | None blocking |
| brotli | Compression for mod_brotli | Optional (runtime) | Base riscv64 port fully upstream since 2018 (PR #669, SiFive HiFive board); RVV-accelerated match-length/memmove PR #1489 open, unreviewed | No upstream riscv64 CI/build coverage; best-effort community port | Ubuntu 24.04 Noble: `brotli`, `libbrotli1`, `libbrotli-dev` present | None blocking; RVV PR unmerged but base port complete |
| nghttp2 | HTTP/2 for mod_http2 | Optional (runtime) | Pure portable C/C++, no arch-specific code by design | No upstream CI; distro-infra-only build | Ubuntu 24.04 Noble: claimed present [NEEDS VERIFICATION]; Arch Linux RISC-V confirmed shipping 1.69.0 | Issue #2195: FreeBSD14/riscv64 cross-compile fails under GCC14 (closed "not planned"; does not affect native Linux builds) |
| libcurl | ACME/Let's Encrypt for mod_md | Optional (runtime) | Same C implementation as all platforms; only a minor unaligned-read MD5-fallback micro-optimization missing vs amd64 | riscv64 is a live musl cross-compile CI target (`linux-musl-llvm`); full test suite never runs on riscv64 in any upstream CI | Debian sid: RC pre-release only, blocked from migrating to testing by riscv64 `pycurl`/`trurl` autopkgtest regressions; Ubuntu 24.04 Noble available via ports mirror with a lagging security pocket | Debian sid autopkgtest regressions (riscv64-specific) blocking stable propagation; historical atomic-builtins link failure (#9055, 2022, resolved) |
| libxml2 | XML parsing for mod_proxy_html, mod_dav | Optional (runtime) | No architecture-specific code at all (no `arch/`/`simd/`/`riscv/` dirs); compiles unmodified; Debian Sid 2.15.3+dfsg-1 | No dedicated riscv64 CI confirmation found | Ubuntu 24.04 Noble present via ports channel, but security-patch revision lags amd64 | Ubuntu riscv64 security-patch gap [NEEDS VERIFICATION]; catalog double-checked-locking issue (#971) flagged unsafe on weak-memory architectures including riscv64 |
| Jansson | JSON for mod_md / mod_heartmonitor | Optional (runtime) | Not independently deep-dived; reported as build-queued on Debian buildd (scheduling lag, not a code defect) | -- | -- | 1 closed, unrelated issue (armv7, 2014); research gap, not "no issues" |
| Lua | Scripting for mod_lua (reference interpreter, not LuaJIT) | Optional (runtime) | No arch guards anywhere in lua/lua; riscv64 LP64D ABI maps cleanly; Debian sid `lua5.4` 5.4.8-2 | No dedicated riscv64 CI found | Ubuntu 24.04 Noble ships lua5.4 + ~89 related packages for riscv64 | None for plain Lua. LuaJIT (separate, not an httpd dependency) ships JIT-disabled/interpreter-fallback on riscv64 in Debian sid and is masked entirely as unsupported on Gentoo -- relevant only if LuaJIT is conflated with Lua |

**Deep dive -- OpenSSL (critical, security-relevant):** OpenSSL has the deepest riscv64-specific investment of any httpd dependency examined: dedicated assembly for AES (including Zvkned/Zvbb/Zvkg vector-crypto variants), SHA-256/512, GCM/GHASH, ChaCha20, Montgomery bignum, and SM2, plus a dedicated `riscv-more-cross-compiles.yml` CI workflow with 13 extension-specific configurations. The practical gap is entirely hardware-dependent: on riscv64 hardware lacking Zkn (scalar crypto) or Zvkned (vector AES) extensions, OpenSSL falls back to a software T-table AES implementation, which is not constant-time and is theoretically vulnerable to cache-timing side channels -- relevant for any production TLS deployment on such hardware. This is the single most consequential riscv64-related fact for httpd deployments, even though the fix belongs entirely to OpenSSL and hardware provisioning, not to httpd.

**Deep dive -- PCRE2/sljit (critical, JIT backend):** the bundled sljit JIT compiler is the one genuine JIT dependency in httpd's tree and has the strongest riscv64 story of any httpd dependency: real, upstream, fully merged riscv64 support including RVV SIMD and RVC compressed-instruction support. `pcre2_jit_test` has been confirmed passing on real riscv64 hardware.

**Deep dive -- APR (critical, memory allocator):** APR has no dedicated riscv64 port code at all -- it rides the generic GCC atomic-builtins fallback, identical to arm64 (Section 4) -- yet is explicitly reconfirmed present as an Ubuntu 26.04 "resolute" riscv64 package.

**Summary against JIT / SIMD / numerics / crypto / compression / memory-allocator framing:** no dependency examined has an open, upstream-acknowledged riscv64 blocking bug that prevents httpd from working on riscv64 today. The closest things to blockers are (a) libcurl's Debian sid autopkgtest regressions holding back stable propagation, and (b) libxml2's lagging riscv64 security-patch revision on Ubuntu, neither of which is httpd-specific.

## 11. Known Bugs and Active Issues

**Apache httpd (upstream):** no riscv64-specific bugs found. Independently re-verified multiple times this cycle via `mcp__github__search_issues`, `search_pull_requests`, `search_commits`, and `search_code` against `repo:apache/httpd` for the terms `riscv`, `riscv64`, `riscv64 performance`, `riscv64 bug`, and `riscv nan floating` -- all return `total_count: 0`, open and closed. There is no tracking issue, no correctness bug, no CI-addition PR, and no feature PR mentioning riscv64 anywhere in `apache/httpd`. ASF Bugzilla requires authentication and could not be searched; a residual uncertainty exists there, but given the clean Debian/Ubuntu build record, active riscv64-specific bug reports are unlikely.

| PR/patch number | Title | Status | Merged date | First release |
|---|---|---|---|---|
| -- | -- | N/A: no riscv64-related PR, issue, or commit exists in apache/httpd | -- | -- |

**Dependency issues affecting riscv64 httpd deployments:**

| Issue | Component | Severity | Status |
|---|---|---|---|
| Software T-table AES is not constant-time on hardware without Zkn/Zvkned | OpenSSL | Security-relevant for TLS serving on such hardware | Open (hardware-dependent fallback, not a code defect) |
| binutils < 2.38 fails to assemble Zvk vector-crypto instructions | OpenSSL / toolchain | Build, on older distro toolchains | Known toolchain floor, not a code bug |
| Possible SIMD crash concern flagged on riscv64 (PCRE2 PR #583, Nov 2024) | PCRE2/sljit | Correctness (potential) | Open, unresolved in review thread |
| Overflow-check correctness bug | sljit (PCRE2 dependency) | Correctness | Fixed (PR #350, Dec 2025) |
| Debian sid `pycurl`/`trurl` autopkgtest regressions on riscv64 | libcurl | Blocks stable propagation | Open |
| riscv64 security-patch revision lag vs amd64 | libxml2 (Ubuntu packaging) | Security (unenumerated CVEs) | [NEEDS VERIFICATION] |
| IPv6 test suite failure in non-x86 environments | Apache httpd test infrastructure | Test infrastructure only | Known workaround exists (`test/travis_before_linux.sh`) |

No correctness bugs are known for the httpd core itself on riscv64.

## 12. Objections and Upstream Blockers

There are no upstream blockers for riscv64 httpd deployment. The following objections are pre-empted by existing evidence:

**"APR does not support riscv64":** Incorrect. APR falls through to `builtins.c` on riscv64, using GCC `__atomic_*` intrinsics with `__ATOMIC_SEQ_CST` ordering, correct for RISC-V's weak memory model. Debian Sid `libapr1` builds and installs on riscv64 without issue.

**"httpd requires a port to build on riscv64":** Incorrect. httpd contains zero architecture-specific code. It is pure portable C. No port work has ever been needed or done.

**"No upstream CI means the build is untested":** Partially true. The upstream CI has no riscv64 coverage. The Debian buildd infrastructure (native riscv64 hardware at OSU OSL) and Ubuntu Launchpad ports both provide continuous integration for every upload, covering production-relevant configurations. Upstream CI gaps are a documentation/trust-surface issue, not a functional one.

**"LuaJIT is missing on riscv64":** Not relevant to httpd. `mod_lua` uses the reference Lua 5.4 interpreter, not LuaJIT.

**"PCRE2 JIT is unconfirmed on riscv64":** No longer an open question. The riscv64 SLJIT backend is fully upstream (integer ops 2022, FPU 2022, RVV SIMD 2024, RVC 2025) and `pcre2_jit_test` has passed on real riscv64 hardware. The one residual item is an unresolved reviewer concern about a possible RISC-V SIMD crash on PR #583, not an absence of JIT support.

**Organizational blocker check -- RISE membership:** RISE Premier Members (checked via [riseproject.dev/members/](https://riseproject.dev/members/)) are Alibaba Damo (Hangzhou) Technology Co., Ltd., Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, and Tenstorrent; General Members are Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip Technology, NextSilicon, Quintauris, SpacemiT (Hangzhou) Technology, and ZTE Corporation. Neither the Apache Software Foundation nor Apache httpd is a RISE member. RISE membership is corporate/silicon-vendor based; ASF policy structurally keeps individual projects like httpd outside such corporate-membership bodies.

A direct check of all 35 posts in the RISE blog (via its WordPress sitemap, [riseproject.dev/wp-sitemap-posts-post-1.xml](https://riseproject.dev/wp-sitemap-posts-post-1.xml)), the RISE Python wheel-builder page (80+ packages), the riseproject-dev GitHub org (26 public repos), and the RISE RISC-V Runners adopter list (Section 7) all independently confirm: no RISE blog post, funded RFP, repo, or CI-runner adopter references Apache httpd. RISE-funded work is concentrated in compilers/toolchains (LLVM SPEC optimization, RP009), language runtimes (Rust Tier-1 port RP004, Go, OpenJDK/SLEEF, V8), and infrastructure (OpenSBI, Yocto, IREE) -- none touching httpd or APR. No organized RISC-V push within the httpd project was found anywhere.

**Acceptance probability if a patch were submitted:** high on technical grounds. httpd's merit-based commit model and APR's generic-builtins-by-design fallback mean a well-formed PR adding a riscv64 CI matrix entry -- now easier than before given the availability of free RISE-provided native riscv64 GitHub Actions runners (Section 7) -- would face no technical objection; reviewer bandwidth (a small, volunteer PMC) is the only practical risk. No such PR is currently open or proposed.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- Apache httpd is a general-purpose web server, not an optimization-purpose project; the optimization-level modifier does not apply.
- **Justification:** No upstream riscv64 CI exists in apache/httpd (all `.github/workflows/{linux,sanity,windows}.yml` jobs run on `ubuntu-latest`/`windows-latest`/native `ubuntu-24.04-arm`; [linux.yml](https://github.com/apache/httpd/blob/trunk/.github/workflows/linux.yml)). With no upstream CI, the distribution floor applies: Ubuntu 26.04 "resolute" and 24.04 "noble" ship working riscv64 `apache2-bin` packages ([packages.ubuntu.com/resolute/riscv64/apache2-bin](https://packages.ubuntu.com/resolute/riscv64/apache2-bin)), but whether the Debian/Ubuntu packaging carries riscv64-specific patches versus unmodified upstream source was never confirmed, so per the grading rule ("patch status unknown, defaults to orange") the grade is capped at orange/downstream-only rather than yellow/clean-distro-build.
- **Contradictory evidence on record:** one research pass this cycle fetched Debian's `apache2` patch list ([sources.debian.org/src/apache2/2.4.68-2/debian/patches/](https://sources.debian.org/src/apache2/2.4.68-2/debian/patches/)) and reported 16 patches, none riscv-related, arguing for a clean-distro-build (yellow) classification. This has not been independently corroborated in this research cycle and is not reflected in the authoritative grade above; it is recorded here as a discrepancy rather than resolved, per verification policy.
- **Pending work that could change the grade:** Verifying Debian/Ubuntu's `debian/patches` for apache2 to confirm whether the riscv64 build uses unpatched upstream source (would move the grade to yellow if clean) or carries riscv64-specific fixes (would confirm orange). No RISE involvement, no open riscv64 GitHub issues/PRs/commits in apache/httpd, and no upstream riscv64 CI proposal currently open. The existence of free RISE RISC-V Runners (Section 7), unused by httpd today, lowers the practical cost of eventually adding upstream riscv64 CI, which would independently resolve this grade's CI-floor dependency regardless of the patch-status question.

## 14. Investment Analysis

RISE has no funded work on Apache httpd or on APR (Section 12). The entire riscv64 functional baseline comes from the generic GCC/Clang builtins path in APR and downstream Debian/Ubuntu packaging; neither required upstream effort. RISE does, however, now operate infrastructure (RISC-V Runners, announced 2026-03-24) that lowers the cost of any future upstream CI work, discussed in 14.3.

### 14.1 Functional Enablement

No functional enablement work is needed. Apache httpd builds, packages, and runs on riscv64 today. Debian Sid and both Ubuntu 24.04 and 26.04 carry current riscv64 binary packages, independently confirmed via primary-source package pages. The `gen_test_char` cross-compilation workaround (Section 5) is already documented by Debian packaging.

The only functional gap requiring attention is in the dependency layer: OpenSSL AES constant-time behavior on hardware without Zkn/Zvkned. This issue is in the OpenSSL project, not in httpd (Section 9).

### 14.2 Performance Optimization

Performance data for Apache httpd specifically on riscv64 does not exist in any publicly accessible source. This was checked repeatedly this cycle: web search for "Apache httpd riscv64 benchmark" and "Apache httpd riscv performance 2025 2026" returned no riscv64-specific results (only generic Apache Bench/Siege tooling docs and unrelated Nginx-vs-Apache comparison articles); OpenBenchmarking.org's `pts/apache` test-profile page returned HTTP 403 to the fetcher in both this cycle and the prior one, so its presence or absence of riscv64 results remains genuinely unconfirmed rather than ruled out; cloud-v.co's active RISC-V SBC benchmark series (CoreMark, Geekbench 6, SPEC CPU2017, general Phoronix Test Suite runs) has no `pts/apache`/web-server post; and the RISE blog's WordPress sitemap (all 35-37 posts, checked both this cycle and previously) has no post mentioning Apache, httpd, or web-server performance.

The only available riscv64 performance context is indirect and not httpd-specific: RISE RP009 (LLVM SPEC CPU 2017, May 2025, SpacemiT-X60) showed up to 15.7% reduction in SPEC CPU execution time from compiler scheduling-model improvements -- a compiler benchmark, not an httpd benchmark. An academic paper comparing RISC-V and AArch64 ISAs generally (ACM, "An Empirical Comparison of the RISC-V and AArch64 Instruction Sets") found the two ISAs closely matched with no inherent architectural advantage either way, but is not httpd-specific and no raw figures were retrieved from it.

Known performance gaps vs arm64 and amd64, none requiring work in the httpd repository itself:

1. **zlib deflate (mod_deflate):** riscv64 runs generic C; amd64 uses SSE2/AVX512, arm64 uses NEON. An RVV Adler32 PR (#1099) is open but unmerged. The fix is in zlib.
2. **OpenSSL AES (mod_ssl):** on hardware without Zkn/Zvkned, AES runs on the software T-table path, slower and not constant-time. The fix is in OpenSSL plus hardware provisioning.
3. **brotli (mod_brotli):** RVV-accelerated match-length/memmove PR #1489 is open and unreviewed. The fix is in brotli.
4. **PCRE2 JIT (mod_rewrite):** the JIT backend is complete and upstream, so this is no longer a gap in the way earlier assessments framed it; the one residual item is an unresolved review concern on PR #583.

### 14.3 CI/CD Infrastructure

The upstream CI gap (no riscv64 runner or QEMU job) is the highest-value improvement available within the httpd project, and the specific change identified in Section 13 as part of what could move the readiness grade upward, alongside resolving distro-patch status. GitHub Actions does not offer a hosted `ubuntu-24.04-riscv64` runner, but RISE now operates a free, native RISC-V CI runner pool for GitHub Actions (announced 2026-03-24), already adopted by 20 projects including Kubernetes, containerd, PyTorch, Docker, and NumPy (Section 7). Onboarding apache/httpd onto this runner pool (rather than standing up a bespoke self-hosted runner or a QEMU-based job) is now the lowest-friction path to real upstream riscv64 CI, and no evidence this cycle indicates httpd has explored it. The test suite's IPv6 workaround (Section 5) would need to be applied in any such CI environment.

### 14.4 Ecosystem Enablement

Apache httpd has no RISE Project involvement and no community activity around riscv64 (Section 1, Section 12). This is not a gap requiring remediation: it reflects that the project works without intervention. Apache httpd itself has no dependent package ecosystem (no PyPI, npm, or similar downstream package universe built on top of it) requiring separate riscv64 enablement; the only ecosystem-shaped work available is visibility-oriented (a RISE RFP proposal, a blog post, or a CI contribution), not a technical necessity.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required -- httpd builds and runs on riscv64 today | 0 | -- | -- |
| Functional (dependency) | OpenSSL AES constant-time fallback verification / hardware provisioning guidance for riscv64 without Zkn/Zvkned | 2-4 (mostly documentation/advisory, not code) | Chip vendor / OpenSSL maintainers | High: security-relevant for TLS deployments |
| CI/CD | Add riscv64 CI job to upstream `linux.yml` using RISE RISC-V Runners | 1-2 | httpd PMC contributor | High: directly closes the CI-floor gap driving the orange grade |
| Verification | Confirm whether Debian's `apache2` packaging carries riscv64-specific patches (`debian/patches`) | 0.5 | Chip vendor / distro liaison | Medium: resolves the orange-versus-yellow ambiguity in Section 13 |
| Performance | zlib RVV Adler32 PR (#1099) review/merge | 1-2 (in zlib, not httpd) | zlib maintainers | Low: no correctness impact |
| Performance | brotli RVV match-length/memmove PR (#1489) review/merge | 1-2 (in brotli, not httpd) | brotli maintainers | Low: no correctness impact |
| Correctness | Resolve reviewer-flagged riscv64 SIMD crash concern, PCRE2 PR #583 | 1 (in PCRE2, not httpd) | PCRE2 maintainers | Medium: open correctness question in a critical dependency |
| Documentation | Document riscv64 cross-compilation in upstream `INSTALL` or `README.platforms` | 0.5 | httpd PMC contributor | Low |
| Ecosystem | RISE RFP proposal for httpd riscv64 CI onboarding | 0.5-1 | Chip vendor / ASF | Low |

## 15. References

- [apache/httpd GitHub mirror](https://github.com/apache/httpd)
- [apache/httpd linux.yml CI workflow](https://github.com/apache/httpd/blob/trunk/.github/workflows/linux.yml)
- [Apache httpd homepage](https://httpd.apache.org/)
- [Apache httpd downloads](https://httpd.apache.org/download.cgi)
- [Apache httpd contributors](https://httpd.apache.org/contributors/)
- [ASF Bugzilla](https://bz.apache.org/bugzilla/) -- authentication required; not searchable anonymously
- [ASF foundation sponsors](https://www.apache.org/foundation/thanks.html)
- [Debian Sid apache2 buildd status](https://buildd.debian.org/status/package.php?p=apache2&suite=sid)
- [Debian apache2 2.4.68-2 patch list](https://sources.debian.org/src/apache2/2.4.68-2/debian/patches/)
- [Ubuntu 24.04 Noble apache2 riscv64 package](https://packages.ubuntu.com/noble/riscv64/apache2)
- [Ubuntu 26.04 resolute apache2-bin riscv64 package](https://packages.ubuntu.com/resolute/riscv64/apache2-bin)
- [Ubuntu packages.ubuntu.com apache2 search (all suites)](https://packages.ubuntu.com/search?keywords=apache2&searchon=names&suite=all&section=all)
- [Debian package tracker: apache2](https://tracker.debian.org/pkg/apache2)
- [Arch Linux RISC-V failure tracker](https://archriscv.felixc.at/)
- [apache/apr GitHub](https://github.com/apache/apr)
- [RISE Project](https://riseproject.dev/)
- [RISE Project Members](https://riseproject.dev/members/)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE 2024 End-of-Year Ecosystem Update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE Project RP004: Rust Tier 1 riscv64 Linux port](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [Milk-V Jupiter review (geerlingguy/sbc-reviews#47)](https://github.com/geerlingguy/sbc-reviews/issues/47)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)