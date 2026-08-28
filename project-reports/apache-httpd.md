---
title: Apache httpd
parent: Project Reports
categories:
  - webservers
---

# Apache httpd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache httpd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Apache httpd is the Apache HTTP Server, a general-purpose HTTP server maintained by the Apache Software Foundation (ASF). It is one of the most widely deployed web servers on the public internet. The project is governed by a PMC (Project Management Committee) of 57 listed members under the standard ASF lazy-consensus model. Decisions are made via mailing lists. The primary source repository is SVN; the GitHub repository at [apache/httpd](https://github.com/apache/httpd) is a mirror. The project's primary bug tracker is [ASF Bugzilla](https://bz.apache.org/bugzilla/). License: Apache License 2.0.

PMC Chair: Joe Orton (jorton), Red Hat.

No formal corporate sponsorship exists for the httpd project specifically. ASF-level platinum sponsors include Apple, Amazon Web Services, Meta, Google, Huawei, Microsoft, Snowflake, and VISA.

Top active committers by commit count in the last 100 commits on the GitHub mirror:

| Committer | Commits | Affiliation |
|---|---|---|
| Rich Bowen (rbowen) | 42 | Red Hat / IBM |
| Joe Orton (jorton) | 22 | Red Hat |
| Rainer Jung (rainerjung) | 10 | -- |
| Lucien Gentis (lgentis) | 9 | -- |
| Jim Jagielski (jimjag) | 7 | -- |
| Eric Covener (covener) | 6 | IBM |

---

## 2. Port History and Upstreaming Timeline

Apache httpd has no RISC-V port history in its upstream repository. Searches across the GitHub mirror returned zero results for "riscv" or "riscv64" across issues, pull requests, commits, and code. There is no first RISC-V commit to report.

The project contains no architecture-specific code at any level. The httpd `os/` directory contains only: `unix/`, `win32/`, `os2/`, `netware/`, `bs2000/`. No `riscv/` or `riscv64/` subdirectory has ever existed. The `modules/arch/` directory contains only OS-level modules: `unix/`, `win32/`, `netware/`.

The STATUS file in the repository lists OS/2 and NetWare support as candidates for removal, indicating the project actively prunes unused platform support rather than adding new tiers.

riscv64 works without a port because httpd is pure portable C with no CPU-ISA-specific code paths. All architecture-sensitive functionality (atomics, thread primitives) is delegated to APR (Apache Portable Runtime), which handles riscv64 correctly via GCC `__atomic_*` compiler intrinsics.

The APR repository (`apache/apr`) also contains zero references to "riscv" or "riscv64". APR falls through to its `builtins.c` / `builtins64.c` implementation on riscv64, the same path used by arm64.

---

## 3. Upstream Support Tier

Apache httpd does not publish a formal tiered-support policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repository). `README.platforms` covers Darwin, FreeBSD, HP-UX, AIX, Solaris, and Ubuntu -- no RISC-V mention.

riscv64 is not listed as a supported, unsupported, or experimental target by the upstream project. The upstream project has no position on riscv64 at all.

De-facto support status, based on distribution evidence: riscv64 builds successfully and is treated as a first-class architecture by both Debian and Ubuntu packaging teams. The upstream project is unaware of this because no issues, patches, or CI work has been contributed upstream.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache httpd is a pure-C POSIX server. It has no JIT, no SIMD dispatch, no inline assembly, and no architecture-specific code paths anywhere in the source tree. The following audit was performed against the `trunk` tree:

- `modules/ssl/` -- pure C, no assembly
- `modules/http2/` -- pure C, no assembly
- `modules/filters/` -- pure C, no assembly
- `server/` -- no `.S` files, no arch-specific C
- `build/` -- build system covers AIX, NetWare, Win32 only
- `acinclude.m4` -- no riscv references
- `configure.in` -- no riscv references; platform list: OS/2, Linux, BSD, Solaris, Cygwin, MinGW, AIX, OS/390, Darwin

Code search for `#ifdef __riscv` in apache/httpd: 0 matches.

All crypto and compression SIMD acceleration is delegated to external libraries (OpenSSL, zlib, brotli). Those libraries handle their own architecture dispatch internally and are out of scope for the httpd source tree.

**APR atomics on riscv64**

The only architecture-specific layer that httpd depends on is APR's atomic operations. APR's `include/arch/unix/apr_arch_atomic.h` selects an implementation by cascading through architecture checks. There is no `riscv.c` or `riscv64.c` in APR. On riscv64 with GCC >= 4.7 or Clang >= 3.1, APR detects `HAVE__ATOMIC_BUILTINS` at configure time and selects `builtins.c` / `builtins64.c`.

`builtins.c` correctly identifies riscv64 as a weak-memory-ordering architecture:

```c
#if defined(__i386__) || defined(__x86_64__) \
    || defined(__s390__) || defined(__s390x__)
#define WEAK_MEMORY_ORDERING 0
#else
#define WEAK_MEMORY_ORDERING 1   // riscv64 lands here
#endif
```

With `WEAK_MEMORY_ORDERING 1`, all atomic operations use `__ATOMIC_SEQ_CST` ordering, which is correct for RISC-V's weak memory model. The implementation is not a stub. arm64 (AArch64) is in the same category and is considered fully supported by the project.

Architecture-specific file count comparison (APR + httpd combined):

| Architecture | Dedicated arch files (httpd) | Dedicated APR atomic files | Total |
|---|---|---|---|
| amd64 / x86_64 | 0 | 1 (`ia32.c`, hand-tuned inline asm) | 1 |
| arm64 / aarch64 | 0 | 0 (uses `builtins.c`) | 0 |
| PowerPC | 0 | 1 (`ppc.c`, hand-tuned inline asm) | 1 |
| IBM S390 | 0 | 1 (`s390.c`, hand-tuned inline asm) | 1 |
| riscv64 | 0 | 0 (uses `builtins.c`) | 0 |

The absence of a dedicated `riscv64.c` in APR is not a gap. amd64 has hand-tuned inline assembly for atomics; riscv64 and arm64 both rely on compiler intrinsics. The compiler intrinsic path is a complete, production-quality implementation.

---

## 5. Build System, Cross-Compilation, and Toolchain

The CMake build (`CMakeLists.txt`) is Windows-only and experimental. All Linux and riscv64 builds use the autoconf path.

**Standard native build:**

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

**Cross-compilation for riscv64**

There is no upstream cross-compilation toolchain file for riscv64. The only documented cross-compilation procedure is from the Debian packaging team (`debian/rules`). A single known issue exists: the build system runs `server/gen_test_char` at build time, which must be compiled for the build host, not the target. The Debian workaround:

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

**Known test suite issue in emulated/cross environments** (documented in `test/travis_before_linux.sh`):

```bash
# non-x86 builds have an IPv6 configuration which breaks the test suite.
# Apache::Test only configures Listen on 0.0.0.0 but
# Apache::TestServer::wait_till_is_up() tries to connect via ::1.
if grep ip6-localhost /etc/hosts; then
    sudo sed -i "/ip6-/d" /etc/hosts
fi
```

This affects all non-x86 build environments including riscv64 QEMU VMs and native boards. IPv6 entries must be removed from `/etc/hosts` before running the test suite.

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

No riscv64-specific `--disable-X` flags are required. The `gen_test_char` cross-compilation issue is the only known build-time workaround.

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
| TLS (mod_ssl via OpenSSL) | full hardware acceleration | full hardware acceleration | hardware acceleration requires Zkn or Zvkned; soft otherwise | See section 9 |
| Compression (mod_deflate via zlib) | SIMD (SSE2/AVX512) | SIMD (NEON) | generic C only | Performance gap, not correctness gap |
| Compression (mod_brotli via brotli) | architecture-optimized | architecture-optimized | supported [NEEDS VERIFICATION] | Brotli GitHub issue #669 (riscv64 support) is closed |
| HTTP/2 (mod_http2 via nghttp2) | full | full | full | No riscv64 issues in nghttp2 |
| Pattern matching (mod_rewrite via PCRE2) | JIT-accelerated (SLJIT) | JIT-accelerated (SLJIT) | JIT status unconfirmed [NEEDS VERIFICATION] | SLJIT claims riscv64 support; no PCRE2 code hits for riscv64 in GitHub |
| Lua scripting (mod_lua) | reference Lua interpreter | reference Lua interpreter | reference Lua interpreter | httpd uses reference Lua (not LuaJIT); no JIT gap |

**Summary:** For the httpd core and all standard modules, riscv64 is at feature parity with arm64. The two areas with a measurable gap are OpenSSL TLS acceleration (security-critical on hardware without scalar/vector crypto extensions) and zlib deflate throughput (performance only).

---

## 7. CI/CD Infrastructure

**Apache httpd upstream CI has no riscv64 coverage.**

The repository contains exactly two workflow files: `.github/workflows/linux.yml` and `.github/workflows/windows.yml`. Both were read in full. Neither contains any reference to "riscv", "riscv64", or QEMU-based cross-compilation. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

Current upstream CI matrix:

| Workflow | Runner | Architecture |
|---|---|---|
| linux.yml | ubuntu-latest | x86_64 |
| linux.yml | ubuntu-24.04-arm | arm64 |
| windows.yml | windows-latest | x64 |

There is no `ubuntu-24.04-riscv64` GitHub Actions runner (none exists in GHA as of this report date), nor any QEMU-based riscv64 emulation job.

riscv64 builds are tested exclusively by downstream distribution infrastructure (Debian buildd, Ubuntu Launchpad). The Debian apache2 package is built on buildd host `rv-osuosl-04`, a native RISC-V machine at Oregon State University Open Source Lab. This is entirely outside the apache/httpd upstream CI.

---

## 8. Distribution and Release Status

Apache httpd upstream does not publish binary releases. The official download at [httpd.apache.org/download.cgi](https://httpd.apache.org/download.cgi) provides only source tarballs (`httpd-2.4.68.tar.bz2`, `httpd-2.4.68.tar.gz`). Architecture-specific binary packaging is entirely delegated to downstream OS distributions.

| Distribution | Package name | riscv64 available | Version | Build status |
|---|---|---|---|---|
| Debian Sid | apache2 | YES | 2.4.68-1 | Installed on buildd host rv-osuosl-04 (native RISC-V hardware at OSU OSL) |
| Ubuntu 24.04 Noble | apache2 | YES | 2.4.58-1ubuntu8 | .deb file `apache2_2.4.58-1ubuntu8_riscv64.deb` (90240 bytes); riscv64 listed as an officially supported architecture |
| Arch Linux RISC-V | apache | Likely YES [NEEDS VERIFICATION] | -- | Not present in the archriscv FTBFS failure tracker; no positive .pkg.tar.zst URL confirmed |
| GitHub Releases (apache/httpd) | -- | NO | -- | No releases published; GitHub repo is source mirror only |
| PyPI (apache-httpd) | -- | NO | -- | HTTP 404; package does not exist |

The distribution picture is strong. Both Debian Sid and Ubuntu 24.04 LTS carry current riscv64 binary packages built from standard packaging with no architecture-specific patches beyond the `gen_test_char` cross-compilation workaround.

---

## 9. Dependencies

All dependency build status data is sourced from Debian Sid buildd records and the relevant upstream issue trackers.

| Dependency | Role | riscv64 build status | Open riscv64 issues | Notes |
|---|---|---|---|---|
| APR | Core I/O, threading, memory pools -- mandatory | Installed (Debian Sid 1.7.6-3+b1) | None | No riscv-specific code; uses `builtins.c` GCC `__atomic_*` intrinsics. Functionally correct. |
| APR-Util | APR extension: crypto, DBD, LDAP -- mandatory with APR 1.x | Installed (follows APR) | None | Merged into APR 2.x, removing separate dependency. |
| OpenSSL | TLS for mod_ssl -- production-essential | Installed (Debian Sid 3.6.3-1) | **2 open** | (1) AES T-table not constant-time on hardware without Zkn/Zvkned scalar crypto -- security-critical for TLS. (2) SSL tests fail under high `HARNESS_JOBS` on riscv64. Cross-compile with `no-deprecated` also has an open issue. |
| PCRE2 | URL pattern matching for mod_rewrite -- mandatory | Installed (Debian Sid 10.46-1+b2) | None active | JIT backend (SLJIT) claims riscv64 support [NEEDS VERIFICATION]. No riscv64 correctness bugs. |
| zlib | gzip/deflate for mod_deflate -- optional but common | Installed (Debian Sid 1.3.dfsg+really1.3.2-3) | None | No riscv64 SIMD paths; generic C only. Performance gap vs x86/ARM. No correctness issue. |
| libbrotli | Brotli compression for mod_brotli -- optional | Installed (Debian Sid 1.2.0-3) | None | GitHub issue #669 "Add RISC-V 64-bit (riscv64) platform configuration" is closed. Supported. |
| nghttp2 | HTTP/2 for mod_http2 -- optional | Installed (Debian Sid 1.69.0-1) | None | Two historical riscv64 issues both closed (GCC 14 compile warning, m4 file update). |
| libcurl | ACME/Let's Encrypt for mod_md -- optional | Installed (Debian Sid) | None | All 10 riscv64 issues in curl/curl are closed; most were compiler warning suppressions. |
| libxml2 | XML parsing for mod_proxy_html, mod_dav -- optional | Installed (Debian Sid 2.15.3+dfsg-1) | None | 0 riscv64 issues in GNOME/libxml2. |
| libjansson | JSON for mod_md -- optional | Maybe-Successful older build; 2.15.0-1 queued | None | `Needs-Build` status is Debian buildd scheduling lag, not a code defect. 0 upstream riscv64 issues. |
| liblua5.4 | Lua scripting for mod_lua -- optional | Installed (Debian Sid 5.4.8-1+b2) | None | Reference Lua interpreter only (not LuaJIT). No JIT gap. 0 riscv64 issues. |
| glibc | C runtime -- mandatory | Installed | Historical (fixed) | Historical SIGILL bug for RVV prctl-disabled contexts in memset; fixed in 2.43. |

**The single dependency with active, security-relevant open upstream issues is OpenSSL.** On riscv64 hardware without Zkn (scalar cryptography) or Zvkned (vector AES) extensions, OpenSSL's AES implementation uses T-tables, which are not constant-time and are vulnerable to cache-timing attacks. This is a security-critical issue for any production httpd TLS deployment on riscv64 hardware lacking those extensions.

---

## 10. Ecosystem Status

**RISE Project involvement:** None. Apache httpd is not a member project, has no RISE RFP, and has received no RISE blog coverage. A review of all 27 RISE blog posts from May 2024 through June 2026 found zero mentions of Apache httpd. The RISE RFP list (RP001-RP016) has no httpd entry. The term "apache" appears in RISE content only in the phrase "Apache 2.0 license" in a post about Python wheels (RP011).

RISE Premier Members include Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent. The RISE project's focus is on compilers (LLVM/GCC), language runtimes (Go, Rust, Java, Python, V8), AI/ML (PyTorch, llama.cpp), firmware (EDK2, OpenSBI), and CI infrastructure.

**Community activity on riscv64:** Zero. There are no mailing list threads, no GitHub issues, no PRs, and no commits in the upstream repository related to riscv64. The architecture works without intervention, so it has attracted no community discussion.

---

## 11. Known Bugs and Active Issues

**Apache httpd (upstream):** No riscv64-specific bugs found. The GitHub repository contains zero issues or PRs mentioning riscv64. ASF Bugzilla required authentication and could not be searched; a residual uncertainty exists, but given the clean Debian/Ubuntu build record, active riscv64-specific bug reports are unlikely.

**Dependency issues affecting riscv64 httpd deployments:**

| Issue | Component | Severity | Status |
|---|---|---|---|
| AES T-table not constant-time on hardware without Zkn/Zvkned | OpenSSL | Security-critical for TLS serving | Open |
| SSL tests fail under high `HARNESS_JOBS` | OpenSSL | Test infrastructure | Open |
| Cross-compile with `no-deprecated` fails | OpenSSL | Build | Open |
| IPv6 test suite failure in non-x86 environments | Apache httpd test infrastructure | Test infrastructure only | Known workaround exists (documented in `travis_before_linux.sh`) |

No correctness bugs are known for the httpd core itself on riscv64. The OpenSSL TLS issue is the only security-relevant open item in the dependency chain.

---

## 12. Objections and Upstream Blockers

There are no upstream blockers for riscv64 httpd deployment. The following objections are pre-empted by existing evidence:

**"APR does not support riscv64":** Incorrect. APR falls through to `builtins.c` on riscv64, which uses GCC `__atomic_*` intrinsics with `__ATOMIC_SEQ_CST` ordering. This is correct for RISC-V's weak memory model. Debian Sid `libapr1` builds and installs on riscv64 without issue.

**"httpd requires a port to build on riscv64":** Incorrect. httpd contains zero architecture-specific code. It is pure portable C. No port work has ever been needed or done.

**"No upstream CI means the build is untested":** Partially true. The upstream CI has no riscv64 coverage. However, the Debian buildd infrastructure (native riscv64 hardware at OSU OSL) provides continuous integration for every upload, which covers all production-relevant configurations. Upstream CI gaps are a documentation and trust-surface issue, not a functional one.

**"LuaJIT is missing on riscv64":** Not relevant to httpd. `mod_lua` uses the reference Lua 5.4 interpreter, not LuaJIT. This is distinct from nginx+OpenResty, which depends on LuaJIT.

**"PCRE2 JIT is unconfirmed on riscv64":** True but bounded. PCRE2 operates in interpreter mode when JIT is unavailable. This is a performance regression for heavy mod_rewrite workloads, not a correctness issue.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

No functional enablement work is needed. Apache httpd builds, packages, and runs on riscv64 today. Debian Sid and Ubuntu 24.04 LTS carry current binary packages. The gen_test_char cross-compilation workaround is already documented and handled by Debian packaging.

The only functional gap requiring attention is in the dependency layer: OpenSSL AES constant-time behavior on hardware without Zkn/Zvkned. This issue is in the OpenSSL project, not in httpd.

### 13.2 Performance Optimization

Performance data for Apache httpd specifically on riscv64 does not exist in any publicly accessible source (no benchmarks found in the RISE blog, GitHub, or web search). The available riscv64 performance context is indirect: RISE RP009 (LLVM SPEC CPU 2017, May 2025, SpacemiT-X60) showed up to 15.7% reduction in SPEC CPU execution time from compiler scheduling model improvements. This is a compiler benchmark, not an httpd benchmark.

Known performance gaps vs arm64 and amd64:

1. **zlib deflate (mod_deflate):** riscv64 runs generic C. amd64 uses SSE2/AVX512; arm64 uses NEON. This is a throughput gap for compression-heavy workloads. The fix is in zlib, not httpd.
2. **OpenSSL AES (mod_ssl):** On hardware without Zkn/Zvkned, AES runs on the T-table software path, which is slower and not constant-time. The fix is in OpenSSL + hardware provisioning.
3. **PCRE2 JIT (mod_rewrite):** JIT status on riscv64 is unconfirmed. If disabled, mod_rewrite pattern matching runs the interpreter. The fix is in PCRE2/SLJIT.

None of these gaps require work in the httpd repository itself.

### 13.3 CI/CD Infrastructure

The upstream CI gap (no riscv64 runner or QEMU job) is the highest-value improvement available within the httpd project. Adding riscv64 to the upstream CI matrix would:

- Catch regressions before they reach distributions
- Signal upstream support commitment to the community
- Reduce reliance on downstream Debian buildd as sole gating infrastructure

GitHub Actions does not currently offer a hosted `ubuntu-24.04-riscv64` runner. A riscv64 CI job would require either a self-hosted RISC-V runner or a QEMU-based job. The test suite IPv6 workaround (removing `ip6-localhost` from `/etc/hosts`) is already documented and must be applied in any non-x86 CI environment.

### 13.4 Ecosystem Enablement

Apache httpd has no RISE project involvement and no community activity around riscv64. This is not a gap requiring remediation -- it reflects that the project works without intervention. Ecosystem work (RISE RFP proposal, blog post, CI contribution) would be primarily a visibility exercise, not a technical necessity.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required -- httpd builds and runs on riscv64 today | 0 | -- | -- |
| Functional (dependency) | OpenSSL AES constant-time fix on riscv64 without Zkn/Zvkned | ~4-8 (in OpenSSL, not httpd) | OpenSSL maintainers | High (security-critical for TLS deployments) |
| CI/CD | Add riscv64 QEMU CI job to upstream linux.yml | 1-2 | httpd PMC contributor | Medium |
| CI/CD | Self-hosted native riscv64 runner for upstream httpd CI | 2-4 (infra setup) | ASF infra or chip vendor | Medium |
| Performance | zlib SIMD for riscv64 (RVV deflate path) | ~4-8 (in zlib, not httpd) | zlib maintainers | Low (no correctness impact) |
| Performance | PCRE2 SLJIT JIT verification on riscv64 | 1 | PCRE2 maintainers | Low |
| Documentation | Document riscv64 cross-compilation in upstream INSTALL or README.platforms | 0.5 | httpd PMC contributor | Low |
| Ecosystem | RISE RFP proposal for httpd riscv64 CI | 1 | Chip vendor / ASF | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [apache/httpd GitHub mirror](https://github.com/apache/httpd)
- [Apache httpd homepage](https://httpd.apache.org/)
- [Apache httpd downloads](https://httpd.apache.org/download.cgi)
- [ASF Bugzilla](https://bz.apache.org/bugzilla/) -- authentication required; not searchable anonymously
- [Debian Sid apache2 buildd status](https://buildd.debian.org/status/package.php?p=apache2&suite=sid)
- [Ubuntu 24.04 Noble apache2 riscv64 package](https://packages.ubuntu.com/noble/riscv64/apache2/download)
- [Ubuntu 24.04 Noble apache2 package info](https://packages.ubuntu.com/noble/apache2)
- [Debian package tracker: apache2](https://tracker.debian.org/pkg/apache2)
- [Arch Linux RISC-V failure tracker](https://archriscv.felixc.at/)
- [apache/apr GitHub](https://github.com/apache/apr)
- [RISE Project](https://riseproject.dev/)
- [RISE RP009 LLVM SPEC Optimization report](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [Igalia LLVM RISC-V optimization blog post](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [RISE RFP list](https://lf-rise.atlassian.net/wiki/display/HOME/RISE+RFP)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)