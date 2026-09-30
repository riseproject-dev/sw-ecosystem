---
title: Apache httpd
parent: Project Reports
color: orange
categories:
  - webservers
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
  - name: binutils
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

---

## 1. Project Overview

Apache httpd is the Apache HTTP Server, a general-purpose HTTP server maintained by the [Apache Software Foundation](https://www.apache.org/) (ASF), a Delaware 501(c)(3) nonprofit. It is one of the most widely deployed web servers on the public internet. License: Apache License 2.0. The primary source of record is SVN; the GitHub repository at [apache/httpd](https://github.com/apache/httpd) is a mirror. The project's bug tracker is [ASF Bugzilla](https://bz.apache.org/bugzilla/), which requires authentication and could not be searched in this research.

**Governance:** ASF Members elect a Board of Directors, which charters Project Management Committees (PMCs). The httpd PMC (57 listed members) votes on new committers and PMC members, sets project policy, and approves releases under the standard ASF lazy-consensus model, reporting to the Board, not to any corporate sponsor. PMC Chair: Joe Orton (jorton), Red Hat. Corporate independence is explicit ASF policy: "sponsors are not part of corporate governance at the ASF." Commit rights are granted to individuals on merit ("the Apache Way"), never to companies, and commits are made under personal `@apache.org` identities rather than employer accounts. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository; committer status lives in PMC records on the ASF website, not in the repo.

**Corporate affiliations of contributors** (self-reported bios from [httpd.apache.org/contributors/](https://httpd.apache.org/contributors/), employer at time of major contribution, not necessarily current):

| Contributor | Company | Contribution area |
|---|---|---|
| Rich Bowen | Red Hat | Docs, community |
| Mark Cox | Red Hat, Inc. | mod_status, cookies |
| Ken Coar | IBM Corporation | mod_autoindex, FAQ |
| Eric Covener | IBM | LDAP, bug fixes |
| Stefan Eissing | greenbytes GmbH | mod_http2 |
| William A. Rowe Jr. | SpringSource/VMware | Win32 kernel |
| Ruediger Pluem | Vodafone | Infra, bug fixes |
| Paul Querna | Rackspace Hosting | Architecture |
| Aaron Bannert | Codemass, Inc. | APR, worker MPM |
| Ralf S. Engelschall | Cable and Wireless Deutschland | mod_rewrite, DSO |

By commit volume in the last 5,000 trunk commits (2017-10-06 through 2026-09-30, from a local clone of `apache/httpd`): Yann Ylavic (871), Joe Orton (841), Lucien Gentis (579), Stefan Eissing (534), Rich Bowen (491), Christophe Jaillet (418), Eric Covener (341), Ruediger Pluem (207), Graham Leggett (115), Rainer Jung (95), Jim Jagielski (80). All commit via `@apache.org` addresses, so current employer cannot be confirmed from git metadata alone.

No corporate sponsorship is directed at the httpd project specifically; the ASF is sponsored as a whole and funds are not earmarked for individual projects. ASF-wide sponsors (per [apache.org/foundation/thanks.html](https://www.apache.org/foundation/thanks.html)): Platinum tier includes Apple, Amazon Web Services, Meta, Google, Huawei, Microsoft, Snowflake, and Visa; Silver tier includes Red Hat and IBM.

**Community culture on new ports:** There is no formal platform/architecture tier system, no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` tier matrix, and no visible RFC/porting-request process for new CPU architectures. This is consistent with httpd delegating platform portability to APR and autoconf rather than handling it explicitly. The `STATUS` file lists OS/2 and NetWare support as candidates for removal, indicating the project actively prunes unused platform support rather than adding new tiers. Community activity on riscv64 specifically is zero: no mailing list threads, GitHub issues, PRs, or commits reference riscv64 anywhere in the repository, confirmed repeatedly across this research (Section 2, Section 11). The architecture works without any upstream intervention, so it has attracted no community discussion, and Apache httpd has no RISE Project membership or involvement (Section 12).

---

## 2. Port History and Upstreaming Timeline

Apache httpd has no RISC-V port history in its upstream repository and no first RISC-V commit to report. This was independently re-verified via a fresh `git clone --depth 1` of `apache/httpd` (resolving to commit `4a521896a65ffcce6648ff379d0a81265ace04eb`, 2026-09-30 07:51:35 +0000) and a repo-wide `grep -rniE riscv .` across the entire working tree: zero matches. GitHub search (`mcp__github__search_issues`, `search_pull_requests`, `search_commits`, all with queries `riscv` and `riscv64` against `repo:apache/httpd`) independently returns zero results across every query variant, corroborating the clone-level grep.

The project contains no architecture-specific code at any level. The httpd `os/` directory contains only: `unix/`, `win32/`, `os2/`, `netware/`, `bs2000/`. No `riscv/` or `riscv64/` subdirectory has ever existed. The `modules/arch/` directory contains only OS-level modules: `unix/`, `win32/`, `netware/`. A GitHub code search for `#ifdef __riscv repo:apache/httpd` returns 0 matches, and there are no `.S` assembly files anywhere in the httpd repository for any architecture.

riscv64 works without a port because httpd is pure portable C with no CPU-ISA-specific code paths. All architecture-sensitive functionality (atomics, thread primitives) is delegated to [APR](https://github.com/apache/apr) (Apache Portable Runtime), which handles riscv64 via GCC/Clang `__atomic_*` compiler intrinsics (Section 4).

**Negative-control check on the search methodology:** the same `__riscv` code search run with `org:apache` (no repo filter) returns 40 real hits across other ASF projects: `apache/brpc` has hand-written RVV vector intrinsics (`string_compare_rvv.cc`, `crc32c.cc` with `__riscv_vclmul_vv_u64m1`, etc.) and inline `rdcycle` assembly; `apache/nuttx` has riscv assembly (`arch_strcmp.S`); `apache/orc`, `apache/arrow`, `apache/trafficserver` (via vendored Highway), `apache/hadoop`, `apache/doris`, `apache/mynewt-core`, `apache/fory`, and `apache/couchdb` all have genuine `__riscv`/`__riscv_vector`-guarded code. This confirms the absence in httpd/APR is a real finding, not a search blind spot: sibling ASF projects in the same organization demonstrably write riscv-specific code when they need to; httpd/APR never needed to.

The APR repository (`apache/apr`) also contains no riscv-specific *implementation* code: its `.github/workflows/` (linux.yml, macos.yml, windows.yml, windows-vcpkg.yml) has zero riscv references, and `atomic/unix/builtins.c` / `builtins64.c` implement every required atomic primitive via `__atomic_*` builtins with no gaps. The string "riscv" does appear twice in APR's `build/config.guess` and `build/config.sub`, the standard GNU autoconf target-triplet recognition scripts shared by virtually all autoconf projects; this is generic boilerplate, not APR-specific implementation code, so the substantive claim of "no riscv-specific implementation" holds even though "zero references to the string riscv anywhere in the repository" would be overstated.

---

## 3. Upstream Support Tier

Apache httpd does not publish a formal tiered-support policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repository). `README.platforms` covers Darwin, FreeBSD, HP-UX, AIX, Solaris, and Ubuntu, with no RISC-V mention.

riscv64 is not listed as a supported, unsupported, or experimental target by the upstream project. The upstream project has no stated position on riscv64 at all: it is neither included nor excluded.

| Architecture | Upstream CI | Upstream release binaries | De-facto distro support |
|---|---|---|---|
| amd64 | Yes (`ubuntu-latest`) | Source only | Full |
| arm64 | Yes (`ubuntu-24.04-arm`, native) | Source only | Full |
| riscv64 | None | Source only | Full (Debian Sid, Ubuntu 24.04/26.04) |

De-facto support status, based on distribution evidence, is strong: riscv64 builds successfully and is treated as a first-class architecture by both Debian and Ubuntu packaging teams (Section 8). The upstream project is unaware of this because no issues, patches, or CI work has ever been contributed upstream for riscv64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache httpd is a pure-C POSIX server. It has no JIT, no SIMD dispatch, no inline assembly, and no architecture-specific code paths anywhere in the source tree, for any ISA (not only RISC-V: amd64 and arm64 also have zero dedicated files in httpd itself). The following areas were audited against the `trunk` tree:

- `modules/ssl/` -- pure C, no assembly
- `modules/http2/` -- pure C, no assembly
- `modules/filters/` -- pure C, no assembly
- `server/` -- no `.S` files, no arch-specific C
- `build/` -- build system covers AIX, NetWare, Win32 only
- `acinclude.m4` -- no riscv references
- `configure.in` -- no riscv references; platform list: OS/2, Linux, BSD, Solaris, Cygwin, MinGW, AIX, OS/390, Darwin

All crypto and compression SIMD acceleration is delegated to external libraries (OpenSSL, zlib, brotli). Those libraries handle their own architecture dispatch internally and are out of scope for the httpd source tree (Section 9).

**APR atomics on riscv64.** The only architecture-specific layer that httpd depends on is APR's atomic operations. APR's `include/arch/unix/apr_arch_atomic.h` selects an implementation by cascading through architecture checks. There is no `riscv.c` or `riscv64.c` in APR. `HAVE_ATOMIC_BUILTINS` is checked before the `__i386__`/`__x86_64__` (IA32), `__powerpc__` (PPC), and `__s390__` (S390) hand-asm branches; riscv64 matches none of those architecture guards and takes the compiler-builtins path (`builtins.c` / `builtins64.c`) via the same fallthrough arm64 uses. This is a deliberate, intentional selection, not an accidental omission.

`builtins.c` and `builtins64.c` (139 and 110 lines, fetched directly from `apache/apr`) fully implement every required primitive (`read`, `set`, `add`, `sub`, `inc`, `dec`, `cas`, `xchg`, `casptr`/`xchgptr`) using `__atomic_*` GCC/Clang builtins at `__ATOMIC_SEQ_CST`, with zero TODO/FIXME/XXX/"not implemented" comments in either file:

```c
#if defined(__i386__) || defined(__x86_64__) \
    || defined(__s390__) || defined(__s390x__)
#define WEAK_MEMORY_ORDERING 0
#else
#define WEAK_MEMORY_ORDERING 1   // riscv64 lands here
#endif
```

With `WEAK_MEMORY_ORDERING 1`, all atomic operations use `__ATOMIC_SEQ_CST` ordering, which is correct for RISC-V's weak memory model, and applies `__sync_synchronize()` before atomic stores and exchange operations; this is conservative and functionally safe but not tuned to RISC-V-specific fence variants. arm64 (AArch64) is in the same category and is considered fully supported by the project.

APR also contains a genuine stub path for platforms lacking compiler atomic support at all: `atomic/unix/mutex.c` / `mutex64.c` carry a literal `#warning Be warned: using stubs for all atomic operations`. Since GCC/Clang have supported `__atomic` builtins for RISC-V since their baseline RV64 support landed, riscv64 never reaches this stub path -- it is a real, complete, non-stub implementation, just not hand-tuned assembly.

Architecture-specific file count comparison (APR + httpd combined):

| Architecture | Dedicated arch files (httpd) | Dedicated APR atomic files | Rating |
|---|---|---|---|
| amd64 / x86_64 | 0 | 1 (`ia32.c`, hand-tuned inline asm) | full (hand-tuned) |
| arm64 / aarch64 | 0 | 0 (uses `builtins.c`) | partial (C intrinsics) |
| PowerPC | 0 | 1 (`ppc.c`, hand-tuned inline asm) | full (hand-tuned) |
| IBM S390 | 0 | 1 (`s390.c`, hand-tuned inline asm) | full (hand-tuned) |
| riscv64 | 0 | 0 (uses `builtins.c`) | partial (C intrinsics) |

The absence of a dedicated `riscv64.c` in APR is not a functional gap. amd64, PowerPC, and S390 have hand-tuned inline assembly for atomics; riscv64 and arm64 both rely on compiler intrinsics and receive identical treatment. Outside httpd/APR's own code, the remaining architecture-sensitive components are external dependencies: TLS/crypto (OpenSSL, scalar/soft AES without Zkn/Zvkned), compression (zlib, generic C, no RVV path), and pattern-matching JIT (PCRE2/SLJIT, status not independently confirmed for riscv64 in this research) -- see Section 9.

---

## 5. Build System, Cross-Compilation, and Toolchain

The CMake build (`CMakeLists.txt`, 1,284 lines at repo root) is Windows-only: it is gated by `IF(WIN32)`, links `libapr-2.lib`/`libaprutil-1.lib`, and builds `mpm_winnt`/`mod_isapi`. `grep -i riscv` on the full file returns zero matches, and the file uses no `-DUSE_X=OFF`-style flags at all (that naming convention does not match httpd's CMake or Autoconf option schemes, which use `ENABLE_MODULES`/`OPTION()` and `--enable-`/`--disable-mods-shared=` respectively). All Linux and riscv64 builds use the autoconf path.

**Standard native build** (from `INSTALL`, 141 lines, the actual build doc; `README.md` is an empty stub):

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

**Cross-compilation for riscv64.** There is no upstream cross-compilation toolchain file for riscv64 (`cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` are both absent; there is no `cmake/` toolchain-file directory at all). `configure.in` establishes host/build/target triplets via `AC_CANONICAL_HOST` (line 79); the only OS/arch-specific branch in the entire `case $host in ... esac` (line 302) is `*os2*` -- every other host, including any `riscv64-*-linux-gnu` triplet, falls through to the generic `*)` branch with no special-casing. The only documented cross-compilation procedure for riscv64 anywhere is from the Debian packaging team (`debian/rules`), addressing a single known issue: the build system runs `server/gen_test_char` at build time, which must be compiled for the build host, not the target. The Debian workaround:

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

**Known test suite issue in emulated/cross environments** (documented in `test/travis_before_linux.sh`, and confirmed as a real, not fabricated, `CROSS_COMPILE`-guarded build-host-vs-target split via a direct fetch of `server/gen_test_char.c`):

```bash
# non-x86 builds have an IPv6 configuration which breaks the test suite.
# Apache::Test only configures Listen on 0.0.0.0 but
# Apache::TestServer::wait_till_is_up() tries to connect via ::1.
if grep ip6-localhost /etc/hosts; then
    sudo sed -i "/ip6-/d" /etc/hosts
fi
```

This affects all non-x86 build environments including riscv64 QEMU VMs and native boards. IPv6 entries must be removed from `/etc/hosts` before running the test suite. The test suite (`t/`) itself is driven by the Perl `Apache::Test` framework, so a working Perl toolchain is a test-time (not runtime) dependency for exercising httpd's own test suite; no riscv64-specific issues were found against Perl in this research.

No QEMU references, no riscv64-specific Dockerfiles, and no `.ci/`, `docker/`, or `.asf.yaml` directories were found in the repository (probed directly against `raw.githubusercontent.com`, since this session's GitHub MCP access is scoped only to `riseproject-dev/sw-ecosystem` and denies `apache/httpd`/`apache/apr` file and directory listing).

**Minimum toolchain versions:**

| Component | Minimum | Reason |
|---|---|---|
| GCC (riscv64-linux-gnu-gcc) | 7.1 | First upstream RISC-V support (RV64GC, lp64d ABI) |
| binutils | 2.28 | First upstream RISC-V support |
| glibc | 2.27 | First upstream RISC-V port |
| APR | 1.7.x or trunk (2.x) | httpd trunk requires APR 2.0 or APR 1.7.x + APR-util 1.7.x |
| PCRE2 | 10.x (any) | Required; `--with-pcre2` or system `libpcre2-dev` |
| QEMU (emulated native) | 2.12+ | First QEMU with riscv64 virt machine complete enough for Linux |
| Linux kernel | 4.15+ (4.19+ recommended) | First kernel with upstream RISC-V port |

No GCC/Clang minimum version is documented anywhere in the repository specifically for riscv64; the only compiler-version signal in CI pins `CC=gcc-12` for one Ubuntu maintainer-mode job, unrelated to architecture. No riscv64-specific `--disable-X` flags are required. The `gen_test_char` cross-compilation issue and the IPv6 `/etc/hosts` workaround are the only known build/test-time workarounds.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| APR atomic 32-bit ops | hand-tuned inline asm (`ia32.c`) | C intrinsics (`builtins.c`) | C intrinsics (`builtins.c`) | Functional parity; amd64 may have marginal latency advantage |
| APR atomic 64-bit ops | hand-tuned inline asm (`ia32.c`) | C intrinsics (`builtins64.c`) | C intrinsics (`builtins64.c`) | Same as above |
| APR mutex / locks | POSIX pthreads | POSIX pthreads | POSIX pthreads | Identical |
| httpd MPM (event/worker/prefork) | pure C | pure C | pure C | Identical |
| httpd connection handling | pure C | pure C | pure C | Identical |
| httpd module architecture | OS-level only | OS-level only | OS-level only | Identical |
| TLS (mod_ssl via OpenSSL) | full hardware acceleration | full hardware acceleration | hardware acceleration requires Zkn or Zvkned; soft/T-table otherwise | See Section 9; security-relevant |
| Compression (mod_deflate via zlib) | SIMD (SSE2/AVX512) | SIMD (NEON) | generic C only | Performance gap, not correctness gap |
| Compression (mod_brotli via brotli) | architecture-optimized | architecture-optimized | supported [NEEDS VERIFICATION] | Brotli GitHub issue #669 (riscv64 support) is closed; not independently re-confirmed this cycle |
| HTTP/2 (mod_http2 via nghttp2) | full | full | full | No open riscv64 issues in nghttp2 |
| Pattern matching (mod_rewrite via PCRE2) | JIT-accelerated (SLJIT) | JIT-accelerated (SLJIT) | Contradictory evidence [NEEDS VERIFICATION] | See Section 9: closed issue #831 suggests JIT is exercised on riscv64, but this has not resolved the open question cleanly (Section 13) |
| Lua scripting (mod_lua) | reference Lua interpreter | reference Lua interpreter | reference Lua interpreter | httpd uses reference Lua (not LuaJIT); no JIT gap |

**Summary:** For the httpd core and all standard modules, riscv64 is at feature parity with arm64. The two areas with a measurable gap are OpenSSL TLS acceleration (security-critical on hardware without scalar/vector crypto extensions) and zlib deflate throughput (performance only); PCRE2 JIT status carries residual uncertainty (Section 9, Section 13).

---

## 7. CI/CD Infrastructure

**Apache httpd upstream CI has no riscv64 coverage.** This was independently re-verified via a fresh clone (commit `4a521896a65ffcce6648ff379d0a81265ace04eb`, 2026-09-30) with a full-tree `grep -rniE riscv .` (0 matches, exit code 1) and `grep -rniE qemu .` (0 matches), plus a `find` confirming no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

The repository contains exactly three workflow files: [`.github/workflows/linux.yml`](https://github.com/apache/httpd/blob/trunk/.github/workflows/linux.yml) (510 lines), `.github/workflows/sanity.yml` (64 lines, three jobs: aplogno, buildconf, docs, all `ubuntu-latest`), and `.github/workflows/windows.yml` (132 lines). All three were read in full; none contains any reference to "riscv", "riscv64", or QEMU-based cross-compilation. Triggers in every workflow are `push` (all branches) and `pull_request` only; there is no `workflow_dispatch` or `schedule` trigger anywhere.

Current upstream CI matrix:

| Workflow | Runner | Architecture |
|---|---|---|
| linux.yml | ubuntu-latest (~30 matrix configs: MPM variants, ASan/UBSan, OpenSSL/APR versions) | x86_64 |
| linux.yml | ubuntu-24.04-arm (1 matrix entry: "Shared MPMs, all-modules, 64-bit ARM") | arm64, native runner, not QEMU |
| sanity.yml | ubuntu-latest (3 jobs) | x86_64 |
| windows.yml | windows-latest | x64 |

There is no `ubuntu-24.04-riscv64` GitHub Actions runner (none exists in GHA as of this report date), nor any QEMU-based riscv64 emulation job anywhere in the repository.

riscv64 builds are tested exclusively by downstream distribution infrastructure (Debian buildd, Ubuntu Launchpad). The Debian apache2 package builds on native riscv64 buildd hardware at Oregon State University Open Source Lab (Section 8), entirely outside apache/httpd's own CI. As a cross-check, the dependency APR's own CI (`apache/apr`, `.github/workflows/linux.yml`, `macos.yml`, `windows.yml`, `windows-vcpkg.yml`) was also confirmed to have zero riscv references.

---

## 8. Distribution and Release Status

Apache httpd upstream does not publish binary releases. The official download at [httpd.apache.org/download.cgi](https://httpd.apache.org/download.cgi) provides only source tarballs (`httpd-2.4.68.tar.bz2`, `httpd-2.4.68.tar.gz`). Architecture-specific binary packaging is entirely delegated to downstream OS distributions.

| Distribution | Package name | riscv64 available | Version | Build status |
|---|---|---|---|---|
| Debian Sid | apache2 | YES | 2.4.68-2 | [Installed](https://buildd.debian.org/status/package.php?p=apache2&suite=sid) on buildd host `rv-osuosl-01` (native RISC-V hardware at OSU OSL); an earlier check in this reporting cycle observed version 2.4.68-1 on host `rv-osuosl-04`, consistent with normal package/builder rotation rather than a discrepancy in fact |
| Ubuntu 24.04 Noble | apache2 | YES | 2.4.58-1ubuntu8 | `.deb` file `apache2_2.4.58-1ubuntu8_riscv64.deb` (90240 bytes); independently re-confirmed byte-exact via direct `curl` of [packages.ubuntu.com/noble/riscv64/apache2/download](https://packages.ubuntu.com/noble/riscv64/apache2/download); riscv64 listed as an officially supported architecture |
| Ubuntu 26.04 (resolute) | apache2 | YES | 2.4.66-2ubuntu2 | `.deb` file `apache2_2.4.66-2ubuntu2_riscv64.deb`, confirmed via [packages.ubuntu.com/resolute/riscv64/apache2/download](https://packages.ubuntu.com/resolute/riscv64/apache2) with live mirror links; the `resolute` (26.04 LTS) suite is confirmed live with riscv64 as a listed architecture |
| openSUSE Tumbleweed | apache2 | Reported YES [NEEDS VERIFICATION] | 2.4.62-1.1 | Found via web search only; not cross-checked against a build log in this research |
| AlmaLinux Kitten 10 AppStream | httpd | Reported YES [NEEDS VERIFICATION] | 2.4.63 | Found via web search only; not cross-checked against a build log in this research |
| Docker Official Images | riscv64/httpd | Reported YES [NEEDS VERIFICATION] | -- (~43.5 MB image) | Found via web search only; not independently re-confirmed against Docker Hub's manifest in this research |
| Arch Linux RISC-V | apache | Likely YES [NEEDS VERIFICATION] | -- | Not present in the archriscv FTBFS failure tracker; no positive `.pkg.tar.zst` URL confirmed |
| GitHub Releases (apache/httpd) | -- | NO | -- | No releases published; GitHub repo is source mirror only. This check could not be run through this session's GitHub MCP (scoped only to `riseproject-dev/sw-ecosystem`, `apache/httpd` denied as "not configured for this session"), so it rests on the confirmed fact that the repo is a source-only SVN mirror rather than a direct `list_releases` call |
| PyPI (`apache-httpd`) | -- | NO | -- | HTTP 404 on `pypi.org/pypi/apache-httpd/json`; also 404 via the RISE wheel-builder GitLab proxy. Expected: httpd is a native C server, not Python-packaged, and "apache-httpd" is not a real upstream PyPI project name |

The Debian Sid and both Ubuntu (24.04 and 26.04) rows are independently confirmed via primary-source package-manager pages and, for Ubuntu 24.04, an independent `curl` byte-count match. None of the research performed in this cycle confirmed whether the Debian/Ubuntu packaging carries riscv64-specific source patches versus building unmodified upstream source with only the `gen_test_char` cross-compile workaround (Section 5); this ambiguity is the deciding factor in the Section 13 readiness grade.

---

## 9. Dependencies

Dependency riscv64 status below is sourced from Debian Sid buildd records, the relevant upstream issue trackers, and each dependency's own project report in this repository, cross-recursed one level for the critical dependencies (APR, OpenSSL, PCRE2). The `project-graph` MCP server failed to connect for the entirety of this research (`CONNECTION_CLOSED`); every "graph" data point below reflects that connection failure honestly, not a "not found" result, and should be retried once the server is reachable.

| Dependency | Role | Criticality | riscv64 build status | riscv64 test status | Open riscv64 issues |
|---|---|---|---|---|---|
| APR | Core I/O, threading, memory pools | Critical (runtime) | Installed (Debian Sid 1.7.6-3+b1) | No riscv-specific test gaps known | 0 open (`apache/apr`) |
| APR-util | APR extension: crypto, DBD, LDAP | Critical (runtime) | Installed, follows APR | No gaps known | 0 open (`apache/apr-util`); merged into APR 2.x |
| OpenSSL | TLS for mod_ssl | Critical (runtime) | Installed (Debian Sid 3.6.3-1) | riscv64 CI has open flakiness | 6 open (see below) |
| PCRE2 | URL pattern matching for mod_rewrite | Critical (runtime) | Installed (Debian Sid 10.46-1+b2) | See JIT discussion below | 0 open; 1 historical closed (#14, RISC-V support, 2023) |
| GCC | Toolchain compiler | Critical (build) | riscv64-linux-gnu-gcc >= 7.1 required (Section 5) | N/A | Data not available: no dedicated GCC issue-tracker search performed against httpd's own build in this cycle |
| binutils | Toolchain assembler/linker | Critical (build) | >= 2.28 required (Section 5) | N/A | Data not available: no dedicated binutils issue-tracker search performed in this cycle |
| glibc | C runtime | Critical (runtime) | >= 2.27 required (Section 5); installed | Historical (fixed) | Historical SIGILL bug for RVV prctl-disabled contexts in `memset`, fixed in glibc 2.43 |
| Perl | Test framework (`Apache::Test`) for httpd's own test suite | Critical (test) | N/A (test-time only) | Data not available: no riscv64-specific Perl packaging issues searched in this cycle; Perl drives `t/` via `Apache::Test`/`Apache::TestServer` (Section 5) | Data not available |
| zlib | gzip/deflate for mod_deflate | Optional | Installed (Debian Sid 1.3.dfsg+really1.3.2-3) | No riscv-specific failures found | 0 found (only unrelated s390x/32-bit/ARM64 build issues) |
| brotli | Compression for mod_brotli | Optional | Installed (Debian Sid 1.2.0-3) | -- | 1 historical closed issue (unrelated riscv-edk2 question); #669 (riscv64 platform config) cited as closed in the existing dependency report, not independently re-confirmed this cycle |
| nghttp2 | HTTP/2 for mod_http2 | Optional | Installed (Debian Sid 1.69.0-1) | -- | 1 closed (m4/autoconf-archive update, incidental riscv mention); 2 historical closed issues cited previously (GCC 14 warning, m4 update) |
| libcurl | ACME/Let's Encrypt for mod_md | Optional | Installed (Debian Sid) | -- | Search returned no riscv64-specific hits on `curl/curl` this cycle (only unrelated 32-bit/ARM/Solaris issues); an earlier pass cited "10 closed" riscv64 issues, which is weaker/older evidence and should be re-checked with exact-text search |
| libxml2 | XML parsing for mod_proxy_html, mod_dav | Optional | Installed (Debian Sid 2.15.3+dfsg-1) | -- | 0 found |
| Jansson | JSON for mod_md | Optional | Reported as build-queued on Debian buildd (scheduling lag, not a code defect) | -- | 1 closed, unrelated (armv7, 2014). No dedicated project-report entry exists for Jansson in this repository's `projects.yml` |
| Lua | Scripting for mod_lua (reference interpreter, not LuaJIT) | Optional | Installed (Debian Sid 5.4.8-1+b2) | -- | 0 found |

**OpenSSL (deep dive, critical, security-relevant):** the existing report previously carried 2 open riscv64 issues for OpenSSL; a fresh search this cycle found 6: #28118 (riscv extension detection broken on musl), #30880 (`test_lhash` occasionally fails on linux-riscv64 CI), #29453 (use intrinsics instead of inline asm), #28664 (further SHA-256 performance optimization), #25334 (`_zknd`/`_zkne` must both be present in `OPENSSL_riscvcap` for AES), and #29269 (additional arch-specific testing). This is a larger open-issue set than previously documented; treat the 6-issue count as current. The single dependency with active, security-relevant open upstream issues is OpenSSL: on riscv64 hardware without Zkn (scalar cryptography) or Zvkned (vector AES) extensions, OpenSSL's AES implementation uses T-tables, which are not constant-time and are vulnerable to cache-timing attacks. This is security-critical for any production httpd TLS deployment on riscv64 hardware lacking those extensions (tracked in issue #25334 above).

**PCRE2 (deep dive, critical, JIT status):** GitHub issue #831, "`-march=rv64gcb_zicond` with JIT enabled causes tests to fail on RISC-V," is closed, indicating SLJIT/JIT-on-riscv64 has been exercised and that specific failure resolved. This is evidence toward resolving the report's longstanding JIT [NEEDS VERIFICATION] flag in a positive direction. However, no further independent confirmation that SLJIT's riscv64 backend is complete and production-ready was obtained in this cycle, and the readiness grade's pending-work notes (Section 13) still treat PCRE2 JIT/SLJIT riscv64 status as unconfirmed for mod_rewrite; this discrepancy between the closed-issue evidence and the grade's own pending-work language is noted rather than resolved here.

---

## 11. Known Bugs and Active Issues

**Apache httpd (upstream):** no riscv64-specific bugs found. Independently re-verified multiple times this cycle: `mcp__github__search_issues` and `search_pull_requests` for `riscv` and `riscv64` against `repo:apache/httpd` both return 0 results (`total_count: 0`); a further pair of targeted searches for `riscv64`, `riscv`, and `nan floating point RVV vector` (aimed at surfacing any RISC-V vector-extension floating-point correctness report) also returned 0 results, open or closed. ASF Bugzilla requires authentication and could not be searched; a residual uncertainty exists there, but given the clean Debian/Ubuntu build record, active riscv64-specific bug reports are unlikely.

There is no tracking issue, no correctness bug, no CI-addition PR, and no feature PR mentioning riscv64 anywhere in `apache/httpd`, so there is nothing to deep-read for merge status, review comments, or PR history. A PR/patch merge-status table was attempted and is empty by construction:

| PR/patch number | Title | Status | Merged date | First release |
|---|---|---|---|---|
| -- | -- | N/A: no riscv64-related PR, issue, or commit exists in apache/httpd | -- | -- |

**Dependency issues affecting riscv64 httpd deployments:**

| Issue | Component | Severity | Status |
|---|---|---|---|
| AES T-table not constant-time on hardware without Zkn/Zvkned (OpenSSL #25334) | OpenSSL | Security-critical for TLS serving | Open |
| `test_lhash` occasionally fails on linux-riscv64 CI (OpenSSL #30880) | OpenSSL | Test infrastructure | Open |
| riscv extension detection broken on musl (OpenSSL #28118) | OpenSSL | Build | Open |
| Use intrinsics instead of inline asm (OpenSSL #29453) | OpenSSL | Code quality / maintainability | Open |
| Further SHA-256 performance optimization (OpenSSL #28664) | OpenSSL | Performance | Open |
| Additional arch-specific testing (OpenSSL #29269) | OpenSSL | Test infrastructure | Open |
| IPv6 test suite failure in non-x86 environments | Apache httpd test infrastructure | Test infrastructure only | Known workaround exists (`test/travis_before_linux.sh`) |

No correctness bugs are known for the httpd core itself on riscv64. OpenSSL is the only dependency with active, security-relevant open upstream issues.

---

## 12. Objections and Upstream Blockers

There are no upstream blockers for riscv64 httpd deployment. The following objections are pre-empted by existing evidence:

**"APR does not support riscv64":** Incorrect. APR falls through to `builtins.c` on riscv64, which uses GCC `__atomic_*` intrinsics with `__ATOMIC_SEQ_CST` ordering. This is correct for RISC-V's weak memory model. Debian Sid `libapr1` builds and installs on riscv64 without issue.

**"httpd requires a port to build on riscv64":** Incorrect. httpd contains zero architecture-specific code. It is pure portable C. No port work has ever been needed or done.

**"No upstream CI means the build is untested":** Partially true. The upstream CI has no riscv64 coverage. However, the Debian buildd infrastructure (native riscv64 hardware at OSU OSL) provides continuous integration for every upload, which covers all production-relevant configurations. Upstream CI gaps are a documentation and trust-surface issue, not a functional one.

**"LuaJIT is missing on riscv64":** Not relevant to httpd. `mod_lua` uses the reference Lua 5.4 interpreter, not LuaJIT. This is distinct from nginx+OpenResty, which depends on LuaJIT.

**"PCRE2 JIT is unconfirmed on riscv64":** Bounded either way. PCRE2 operates in interpreter mode when JIT is unavailable, which is a performance regression for heavy mod_rewrite workloads, not a correctness issue (Section 9).

**Organizational blocker check -- RISE membership:** RISE Premier Members (per [riseproject.dev/members/](https://riseproject.dev/members/), checked 2026-09-30) are Alibaba DAMO (Hangzhou) Technology, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, and Tenstorrent; General Members are Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip Technology, NextSilicon, Quintauris, SpacemiT (Hangzhou) Technology, and ZTE Corporation. Neither the Apache Software Foundation nor Apache httpd is a RISE member. RISE membership is corporate/silicon-vendor based; ASF policy structurally keeps individual projects like httpd outside such corporate-membership bodies. A direct fetch of the RISE blog sitemap ([riseproject.dev/wp-sitemap-posts-post-1.xml](https://riseproject.dev/wp-sitemap-posts-post-1.xml)) lists 35 posts as of 2026-09-30, none referencing Apache, httpd, or web-server performance, and the RISE RFP list (RP001-RP016) has no httpd entry. No organized RISC-V push within the httpd project was found anywhere.

**Acceptance probability if a patch were submitted:** high on technical grounds. httpd's merit-based commit model and APR's generic-builtins-by-design fallback mean a well-formed PR adding a riscv64 CI matrix entry would face no technical objection; reviewer bandwidth (a small, volunteer PMC) is the only practical risk. No such PR is currently open or proposed.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- Not an optimization-purpose project: Apache httpd is a general-purpose web server, not a performance-optimization-purpose project, so the optimization-level modifier does not apply.
- **Justification:** Apache httpd has zero upstream riscv64 CI: the repository's three workflow files (`.github/workflows/linux.yml`, `sanity.yml`, `windows.yml`) run only on `ubuntu-latest`, one native `ubuntu-24.04-arm` (arm64) matrix entry, and `windows-latest`, with no riscv64 job, no QEMU, and a repo-wide `grep -rniE riscv` returning zero matches (independently re-verified via a fresh clone at commit [`4a521896a`](https://github.com/apache/httpd/blob/trunk/.github/workflows/linux.yml)). With no upstream CI at all, the distribution floor applies: Debian Sid and Ubuntu (24.04/26.04) both build and ship a working riscv64 `apache2` package from native riscv64 buildd hardware (see [Debian buildd status](https://buildd.debian.org/status/package.php?p=apache2&suite=sid) and [Ubuntu package page](https://packages.ubuntu.com/noble/riscv64/apache2)), but none of the research passes confirmed whether Debian/Ubuntu's packaging carries riscv64-specific patches versus building unmodified upstream source, so per the skill's "patch status unknown, defaults to orange" rule this is classified orange/downstream-only rather than yellow.
- **Pending work that could change the grade:** No open riscv64 issues, PRs, or commits exist anywhere in apache/httpd (repeatedly re-verified). Dependency-level open issues remain in OpenSSL (AES T-table not constant-time without Zkn/Zvkned, security-relevant for mod_ssl on riscv64) and PCRE2 JIT/SLJIT riscv64 status is unconfirmed for mod_rewrite. No RISE Project involvement or RFP exists for Apache httpd. A follow-up check of Debian's `apache2` packaging diff (`debian/patches`) for riscv64-specific changes could resolve the orange-versus-yellow ambiguity noted above; if that diff shows unmodified upstream source, the grade would move to yellow.

---

## 14. Investment Analysis

RISE has no funded work on Apache httpd or on APR. The entire riscv64 functional baseline comes from the generic GCC/Clang builtins path in APR and downstream Debian/Ubuntu packaging; neither required upstream effort.

### 14.1 Functional Enablement

No functional enablement work is needed. Apache httpd builds, packages, and runs on riscv64 today. Debian Sid and both Ubuntu 24.04 and 26.04 carry current riscv64 binary packages, independently confirmed via primary-source package pages. The `gen_test_char` cross-compilation workaround (Section 5) is already documented by Debian packaging.

The only functional gap requiring attention is in the dependency layer: OpenSSL AES constant-time behavior on hardware without Zkn/Zvkned. This issue is in the OpenSSL project, not in httpd (Section 9).

### 14.2 Performance Optimization

Performance data for Apache httpd specifically on riscv64 does not exist in any publicly accessible source. This was checked repeatedly across this reporting cycle: web search for "Apache httpd riscv64 benchmark" and "Apache httpd riscv performance 2025 2026" (via WebSearch where available, and via Bing directly once the WebSearch quota was exhausted) returned no riscv64-specific results; the RISE Project blog's WordPress sitemap has no post mentioning Apache, httpd, or web-server performance; a direct GitHub search for `apache httpd riscv64 benchmark` (repositories and issues) found zero relevant results; and `geerlingguy/sbc-reviews#47` (Milk-V Jupiter, a SpacemiT K1 riscv64 SBC review with CPU, disk, network, and GPU benchmarks) was checked directly and contains no HTTP/web-server benchmark section, only raw iperf3 network throughput.

The only available riscv64 performance context is indirect and not httpd-specific: RISE RP009 (LLVM SPEC CPU 2017, May 2025, SpacemiT-X60) showed up to 15.7% reduction in SPEC CPU execution time from compiler scheduling model improvements, a compiler benchmark, not an httpd benchmark.

Known performance gaps vs arm64 and amd64, none requiring work in the httpd repository itself:

1. **zlib deflate (mod_deflate):** riscv64 runs generic C. amd64 uses SSE2/AVX512; arm64 uses NEON. This is a throughput gap for compression-heavy workloads. The fix is in zlib.
2. **OpenSSL AES (mod_ssl):** on hardware without Zkn/Zvkned, AES runs on the T-table software path, which is slower and not constant-time. The fix is in OpenSSL plus hardware provisioning.
3. **PCRE2 JIT (mod_rewrite):** JIT status on riscv64 carries residual uncertainty despite one closed test-failure issue (#831, Section 9). If JIT is unavailable, mod_rewrite pattern matching runs the interpreter. The fix, if needed, is in PCRE2/SLJIT.

### 14.3 CI/CD Infrastructure

The upstream CI gap (no riscv64 runner or QEMU job) is the highest-value improvement available within the httpd project, and the specific change identified in Section 13 that could move the readiness grade upward once distro-patch status is also resolved. Adding riscv64 to the upstream CI matrix would catch regressions before they reach distributions, signal upstream support commitment, and reduce reliance on downstream Debian buildd as sole gating infrastructure. GitHub Actions does not currently offer a hosted `ubuntu-24.04-riscv64` runner, so a riscv64 CI job would require either a self-hosted RISC-V runner (a RISE-provided runner is the standard mechanism for this pattern in sibling ASF/Apache-adjacent projects) or a QEMU-based job. The test suite IPv6 workaround (Section 5) is already documented and must be applied in any non-x86 CI environment.

### 14.4 Ecosystem Enablement

Apache httpd has no RISE Project involvement and no community activity around riscv64 (Section 1, Section 12). This is not a gap requiring remediation: it reflects that the project works without intervention. Apache httpd itself has no dependent package ecosystem (no PyPI, npm, or similar downstream package universe built on top of it) requiring separate riscv64 enablement; the only ecosystem-shaped work available is visibility-oriented (a RISE RFP proposal, a blog post, or a CI contribution), not a technical necessity.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required -- httpd builds and runs on riscv64 today | 0 | -- | -- |
| Functional (dependency) | OpenSSL AES constant-time fix on riscv64 without Zkn/Zvkned | ~4-8 (in OpenSSL, not httpd) | OpenSSL maintainers | High: security-critical for TLS deployments |
| CI/CD | Add riscv64 QEMU or RISE-runner CI job to upstream `linux.yml` | 1-2 | httpd PMC contributor | High: the specific change identified as able to move the readiness grade |
| CI/CD | Self-hosted native riscv64 runner for upstream httpd CI | 2-4 (infra setup) | ASF infra or chip vendor | Medium |
| Verification | Confirm whether Debian's `apache2` packaging carries riscv64-specific patches (`debian/patches`) | 0.5 | Chip vendor / distro liaison | Medium: resolves the orange-versus-yellow ambiguity in Section 13 |
| Performance | zlib SIMD for riscv64 (RVV deflate path) | ~4-8 (in zlib, not httpd) | zlib maintainers | Low: no correctness impact |
| Performance | PCRE2 SLJIT JIT status verification on riscv64 | 1 | PCRE2 maintainers | Low |
| Documentation | Document riscv64 cross-compilation in upstream `INSTALL` or `README.platforms` | 0.5 | httpd PMC contributor | Low |
| Ecosystem | RISE RFP proposal for httpd riscv64 CI | 1 | Chip vendor / ASF | Low |

---

## 15. References

- [apache/httpd GitHub mirror](https://github.com/apache/httpd)
- [Apache httpd homepage](https://httpd.apache.org/)
- [Apache httpd downloads](https://httpd.apache.org/download.cgi)
- [Apache httpd contributors](https://httpd.apache.org/contributors/)
- [ASF Bugzilla](https://bz.apache.org/bugzilla/) -- authentication required; not searchable anonymously
- [ASF foundation sponsors](https://www.apache.org/foundation/thanks.html)
- [Debian Sid apache2 buildd status](https://buildd.debian.org/status/package.php?p=apache2&suite=sid)
- [Ubuntu 24.04 Noble apache2 riscv64 package](https://packages.ubuntu.com/noble/riscv64/apache2/download)
- [Ubuntu 24.04 Noble apache2 package info](https://packages.ubuntu.com/noble/apache2)
- [Ubuntu 26.04 (resolute) apache2 riscv64 package](https://packages.ubuntu.com/resolute/riscv64/apache2)
- [Debian package tracker: apache2](https://tracker.debian.org/pkg/apache2)
- [Arch Linux RISC-V failure tracker](https://archriscv.felixc.at/)
- [apache/apr GitHub](https://github.com/apache/apr)
- [RISE Project](https://riseproject.dev/)
- [RISE Project Members](https://riseproject.dev/members/)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [Milk-V Jupiter review (geerlingguy/sbc-reviews#47)](https://github.com/geerlingguy/sbc-reviews/issues/47)
- [RISE RP009 LLVM SPEC Optimization report](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [Igalia LLVM RISC-V optimization blog post](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [RISE RFP list](https://lf-rise.atlassian.net/wiki/display/HOME/RISE+RFP)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)
