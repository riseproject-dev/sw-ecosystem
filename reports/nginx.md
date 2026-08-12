---
title: nginx
categories:
  - webservers
---

# nginx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for nginx<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

nginx is a high-performance HTTP server, reverse proxy, and load balancer. The source repository is at [github.com/nginx/nginx](https://github.com/nginx/nginx) (the original Mercurial hosting at hg.nginx.org is decommissioned). The project is licensed under BSD-2-Clause. nginx is a corporate open-source project owned by F5, Inc., which acquired NGINX, Inc. in 2019. Contributions require signing the F5 CLA. There is no independent foundation governance and no CNCF or Linux Foundation membership.

As of 2026-06-17, the current upstream releases are:

- Mainline: 1.31.2 (released 2026-06-17)
- Stable: 1.30.3 (released 2026-06-17)

nginx upstream ships source tarballs only. There are no official architecture-specific pre-built binaries for riscv64 from nginx.org. Official pre-built packages from [nginx.org/en/linux_packages.html](https://nginx.org/en/linux_packages.html) cover x86_64 and aarch64 only.

---

## 2. Port History and Upstreaming Timeline

There is no upstream RISC-V port history. The complete record of riscv64-related upstream activity is:

- Zero patches submitted via the nginx-devel mailing list (archives checked for January and September of each year from 2020 through 2025).
- Zero issues or pull requests referencing riscv or riscv64 in the [github.com/nginx/nginx](https://github.com/nginx/nginx) tracker (0 open, 0 closed).
- Zero entries in the [trac.nginx.org](https://trac.nginx.org) tracker for riscv (explicitly returned "No matches found").

The single upstream entry with any riscv64 content is one case block in `auto/os/conf`:

```sh
riscv64)
    have=NGX_ALIGNMENT value=16 . auto/define
    NGX_MACH_CACHE_LINE=64
;;
```

This sets 16-byte memory alignment and a 64-byte cache line size at build configuration time. No commit date or authorship information for this entry was retrievable from the research. This is the entirety of upstream riscv64 acknowledgment.

Debian build history at [buildd.debian.org](https://buildd.debian.org/status/logs.php?pkg=nginx&arch=riscv64) shows nginx has built successfully on riscv64 since version 1.13.10-1 (2018-04-04), which means the generic GCC atomic fallback path has been sufficient for distribution packaging for at least eight years, with zero upstream engagement on the architecture during that time.

---

## 3. Upstream Support Tier

nginx has no formal tier policy for architecture support. The `--with-cpu-opt` flag documents only the following CPU targets: pentium, pentiumpro, pentium3, pentium4, athlon, opteron, sparc32, sparc64, ppc64. CONTRIBUTING.md states changes "should work properly on a wide range of supported platforms" but defines no tier hierarchy.

riscv64 is, in practice, an untested secondary platform: it builds and runs via the generic GCC atomic builtin fallback path, but has no dedicated atomic implementation, no CI coverage, no `-march=` tuning, and no upstream maintainer ownership. The project has shown zero engagement with any riscv64 port proposal.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

nginx has no assembly code anywhere in its source tree. There is no JIT compiler. There is no SIMD dispatch infrastructure. The only architecture-specific code in the entire project is the inline atomic operation headers for x86, amd64, SPARC64, and PowerPC, plus the cache-line/alignment case block in `auto/os/conf`.

**Atomic operations**

`src/os/unix/ngx_atomic.h` is a cascading `#if`/`#elif` chain that dispatches to architecture-specific headers based on compiler predefined macros:

- `__i386__` - `ngx_gcc_atomic_x86.h`
- `__amd64__` - `ngx_gcc_atomic_amd64.h`
- `__sparc__` - `ngx_gcc_atomic_sparc64.h`
- `__powerpc__` - `ngx_gcc_atomic_ppc.h`

None of these macros fire on riscv64. There is no `ngx_gcc_atomic_riscv.h` file and no `__riscv` branch. The architecture falls through to the `NGX_HAVE_GCC_ATOMIC` path, which uses `__sync_bool_compare_and_swap`, `__sync_fetch_and_add`, and `__sync_synchronize`. On riscv64, GCC emits `lr.d`/`sc.d` A-extension instructions with acquire/release semantics for these builtins. This is correct and thread-safe but is generic compiler output rather than hand-tuned assembly.

**CPU pause / spinlock hint**

The `ngx_cpu_pause()` macro expands to the x86 `PAUSE` instruction on x86/amd64. On riscv64, no equivalent is defined; the macro produces nothing. This is a performance gap under high spinlock contention, not a correctness bug. The RISC-V `WRS.NTO` hint instruction (Wait-on-Reservation Set, Non-blocking Timeout) is not used.

**Cache line and alignment**

The `auto/os/conf` case block sets `NGX_ALIGNMENT=16` and `NGX_MACH_CACHE_LINE=64` for riscv64. The 64-byte value matches common RISC-V implementations (SiFive U74, Alibaba T-Head). This is a shell build script entry; it affects memory alignment macros only and involves no assembly or intrinsics.

**Summary by component**

| Subsystem | Implementation on riscv64 | Gap vs amd64 |
|---|---|---|
| CAS (compare-and-swap) | GCC `__sync_bool_compare_and_swap` | No hand-tuned `lr.d`/`sc.d` assembly |
| Fetch-and-add | GCC `__sync_fetch_and_add` | No hand-tuned assembly |
| Memory barrier | GCC `__sync_synchronize` | No hand-tuned fence |
| CPU pause hint | None | No `WRS.NTO` or equivalent |
| Cache line size | 64 bytes (build-system config) | Matches hardware; no gap |
| Memory alignment | 16 bytes (build-system config) | Correct for RISC-V ABI |
| Assembly files | None (nginx has no `.S` files) | No gap (no arch has them) |
| JIT | None (nginx has no JIT) | No gap |
| SIMD | None (nginx has no SIMD) | No gap |

---

## 5. Build System, Cross-Compilation, and Toolchain

nginx uses a custom shell-based build system. The entry point is `auto/configure`, which generates a Makefile. CMake is not used.

**Key riscv64 configure flags**

The Debian packaging for nginx on riscv64 uses the following flags specific to the architecture:

- `--override-machine=riscv64`: overrides `uname -m` for architecture detection. This is required because nginx's configure uses `uname -m` to identify the CPU. Without this flag, cross-compilation environments or emulated builds report the wrong machine string.
- `--override-system=Linux`: overrides `uname -s`.
- `--override-release=3.16.0`: sets a conservative kernel compatibility floor. Actual riscv64 Debian build hosts run Linux 6.12.74+deb13+1-riscv64.

These three flags are the complete set of riscv64-specific build machinery. There is no native riscv64 configure preset and no riscv64 detection in `auto/cc/gcc`.

**Compiler requirements**

`auto/cc/gcc` has explicit `-march=` entries for pentium, pentiumpro, athlon, opteron, sparc32, sparc64, and ppc64. There is no riscv64 entry. Builds on riscv64 use the compiler's default optimization level (`-O`) with no `-march=` tuning.

The minimum toolchain requirement for riscv64 is GCC 7+ (the first GCC release with a riscv64 backend) and the compiler must support `__sync_bool_compare_and_swap` (available since GCC 4.1, so not a constraint in practice). Verified working: GCC 15.2.0 on Debian sid riscv64. Clang is also supported via `auto/cc/clang`.

**libatomic**

`--with-libatomic` is not needed on riscv64. The RISC-V A extension (atomic instructions) is mandatory in the rv64gc baseline, so `NGX_HAVE_GCC_ATOMIC` fires at configure time via GCC builtins without requiring libatomic_ops.

**Build dependencies**

All build dependencies from Debian's `debian/control` (libexpat-dev, libgd-dev, libgeoip-dev, libpcre2-dev, libperl-dev, libssl-dev, libxslt1-dev, zlib1g-dev) are available on riscv64 in Debian sid with no architecture restrictions.

**Modules to avoid on riscv64**

LuaJIT-based modules (`lua-nginx-module` and similar) must not be used on riscv64. LuaJIT has no riscv64 JIT backend; the result is a non-functional module. Debian's packaging rules explicitly gate Lua module builds on architecture (gating ppc64le and s390x; riscv64 has the same constraint). Use interpreter-only LuaJIT 2.1 or avoid Lua modules entirely.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned atomic CAS | Yes (`ngx_gcc_atomic_amd64.h`) | Via GCC builtins | Via GCC builtins |
| CPU pause hint in spinlock | Yes (`PAUSE` instruction) | Partial (GCC builtin or `yield`) | None |
| Architecture-specific `-march=` flag | Yes (`pentium`, `opteron`, etc.) | Not in upstream build system | Not in upstream build system |
| Official pre-built packages from nginx.org | Yes | Yes | No |
| CI coverage | Yes | Yes | No |
| Upstream issue tracker entry | Yes | Yes | None |

The functional gap between riscv64 and arm64 on nginx is narrow: both use GCC-generated atomics rather than hand-written assembly (nginx's hand-tuned atomic headers cover only x86-family, SPARC64, and PowerPC). The cpu_pause gap is real but affects only spinlock-heavy multi-worker configurations under high contention. The HTTP/3 test failure documented in the Arch RISC-V build logs (see Section 11) is the only known behavioral difference.

---

## 7. CI/CD Infrastructure

nginx's CI is defined in [nginx/ci-self-hosted](https://github.com/nginx/ci-self-hosted). The main workflow is `.github/workflows/nginx-buildbot.yml`, which defines a matrix of 19 operating systems (Alpine, Amazon Linux, Debian, FreeBSD, RHEL, SLES, Ubuntu, Windows, and others) against exactly two architectures: `amd64` and `arm64`.

riscv64 is absent from this matrix entirely. There is no QEMU-based riscv64 build job, no physical board runner, no RISE runner integration, and no commented-out riscv64 placeholder. The string `riscv64` does not appear anywhere in any nginx CI configuration file.

The consequence is that any riscv64 regression introduced in nginx source would not be detected before release. The HTTP/3 test failure described in Section 11 has persisted undetected upstream for at least 18 months precisely because there is no upstream riscv64 CI.

---

## 8. Distribution and Release Status

| Distribution | riscv64 Status | Version | Notes |
|---|---|---|---|
| nginx.org official packages | Not available | - | x86_64 and aarch64 only |
| Debian sid (unstable) | Missing (build blocked) | 1.30.1-5 (no riscv64 binary) | "Missing build on riscv64"; blocks migration to testing; all other arches show Installed |
| Ubuntu 24.04 LTS (Noble) | Present | 1.24.0-2ubuntu7 | Available via Ubuntu Ports archive; 532,756-byte .deb confirmed downloadable; [packages.ubuntu.com](https://packages.ubuntu.com/noble/riscv64/nginx/download) |
| Arch Linux RISC-V | Present (current builds); FTBFS (pending updates) | 1.30.2-1 (stable), 1.31.1-1 (mainline) | Binaries at [archriscv.felixc.at](https://archriscv.felixc.at); 1.30.3-1 and 1.31.2-1 pending builds failing due to H3 test (see Section 11) |
| Fedora | Present [NEEDS VERIFICATION] | Version not confirmed (Koji access blocked during research) | No riscv64-specific issues found |

The Debian situation is the most significant distribution gap. nginx 1.30.1-5 has no riscv64 binary in sid, no build log, no assigned buildd, and no bug filed specifically for the missing build. Every dependent package (nginx modules, any package that Build-Depends on nginx) is also uninstallable on riscv64 in sid.

The Ubuntu Noble package lags the security patch level of the amd64 package. [NEEDS VERIFICATION: whether later security revisions (e.g., 1.24.0-2ubuntu7.1 and later) have been built for riscv64 via Ubuntu Ports.]

---

## 9. Dependencies

The following table covers the hard and common optional dependencies for a production nginx build on riscv64.

| Dependency | Role | riscv64 Build | riscv64 Test | Blocking Issues |
|---|---|---|---|---|
| glibc | C runtime, pthreads (`--with-threads`) | Green | Green | Historical bugs (vector memset SIGILL in 2.40, IFUNC gp-pointer crash in 2.41) fixed in current releases (2.43 in Debian sid). No current blockers. |
| OpenSSL | TLS/SSL, HTTP/3 QUIC (`--with-http_ssl_module`, `--with-http_v3_module`) | Green | Green (QEMU only; no native runners) | (1) AES T-table not constant-time on hardware without Zkn/Zvkned -- security-critical, fix PRs #31080/#31082 open upstream; (2) musl ISA detection silently broken (issue #28118, no fix); (3) no native riscv64 CI runners. See `reports/openssl.md`. |
| PCRE2 | URL rewriting (HTTP rewrite module, enabled by default) | Green | Green | PCRE2 SLJIT JIT backend supports riscv64. No blocking issues. |
| zlib | gzip compression (enabled by default) | Green | Mostly green (no native riscv64 CI upstream) | No riscv64 correctness bugs. No SIMD acceleration for riscv64 (x86 and ARM have optimized paths; riscv64 runs generic C). Performance gap only, not a blocker. |
| libatomic | Fallback atomics (`--with-libatomic`) | Green | Green | Not needed on riscv64; RV64A is mandatory in rv64gc baseline. |
| LuaJIT (via OpenResty or lua-nginx-module) | Embedded Lua scripting | Not functional | N/A | LuaJIT has no riscv64 JIT backend. nginx with LuaJIT modules is non-functional on riscv64. See [openresty/openresty#777](https://github.com/openresty/openresty/issues/777). |
| libgd (optional) | Image processing (`--with-http_image_filter_module`) | Green | Green | Available in Debian/Ubuntu/Arch for riscv64. No known issues. |
| libxslt (optional) | XSLT transforms (`--with-http_xslt_module`) | Green | Green | Available for riscv64. No known issues. |
| Perl (optional) | Embedded Perl (`--with-http_perl_module`) | Green | Green | Available for riscv64. No known issues. |

The OpenSSL AES constant-time gap is a deployment-relevant concern for any riscv64 hardware that does not implement the Zkn (scalar cryptography) or Zvkned (vector AES) extensions. This affects TLS-serving nginx deployments directly.

---

## 10. Ecosystem Status

**RISE Project involvement:** None. F5 and nginx are not RISE members. After scanning all 27 RISE blog posts (May 2024 through June 2026) and all 30 repositories in the riseproject-dev GitHub organization, no nginx content was found in any form -- no funded work, no benchmark report, no working group mention. nginx does not appear in the RISE wheel builder or any RISE CI initiative.

**Performance benchmarks:** No public nginx riscv64 performance benchmarks exist as of June 2026. No nginx riscv64 vs arm64 or riscv64 vs amd64 throughput or latency numbers were found in any upstream, distribution, RISE, vendor (SiFive, Andes, Scaleway), academic, or trade publication source.

**OpenResty:** The OpenResty distribution (nginx + LuaJIT + Lua modules) is non-functional on riscv64. [openresty/openresty#777](https://github.com/openresty/openresty/issues/777), opened October 2021, requests a build option to skip LuaJIT for riscv64 builds. The issue has received zero maintainer responses and has no label, assignee, or milestone. This represents a permanent feature gap for any riscv64 deployment that relies on OpenResty's Lua scripting capabilities.

---

## 11. Known Bugs and Active Issues

**Upstream nginx tracker:** Zero riscv64-specific entries in github.com/nginx/nginx (issues and PRs) and trac.nginx.org (tickets, changesets, wiki). No riscv64 bugs have ever been filed upstream.

**Distribution-level issues:**

| ID | Tracker | Description | Status | Impact |
|---|---|---|---|---|
| No bug number | [Debian tracker - nginx](https://tracker.debian.org/pkg/nginx) | nginx 1.30.1-5 missing riscv64 build; migration to testing blocked | Open (as of research date) | No current nginx in Debian testing/stable on riscv64 |
| Bug #912284 | [Debian BTS](https://bugs.debian.org/912284) | "nginx FTCBFS: multiple reasons" (fails to cross-build from source) | Open (filed Oct 2018) | Affects cross-build flows relevant to riscv64 ports |
| [openresty/openresty#777](https://github.com/openresty/openresty/issues/777) | GitHub | "disable luajit" -- OpenResty non-functional on riscv64 due to no LuaJIT JIT backend | Open (filed Oct 2021, zero responses) | OpenResty/Lua modules entirely non-functional on riscv64 |

**Arch Linux RISC-V FTBFS -- H3 rate limiting test (most significant active issue):**

Both the nginx stable and mainline packages in Arch Linux RISC-V have been failing to build (FTBFS) on the latest upstream versions due to a single failing test in the nginx test suite. The failure has been present continuously since at least September 2024 (nginx 1.26.2) and persists through the most recent logs (nginx 1.28.3 from March 2026 for stable; nginx 1.31.0 from May 2026 for mainline) -- a span of at least 18 months across both branches.

The failing test:

```
#   Failed test 'reset stream - log'
#   at ./h3_limit_req.t line 148.
#                   '200
# 200
# 200
# 200
# 400
# '
#     doesn't match '(?^:499)'
```

Test 6 of `h3_limit_req.t` ("reset stream - log") expects nginx to emit HTTP status 499 (client closed connection) when an HTTP/3 QUIC stream is reset under rate limiting. On riscv64, nginx returns HTTP 400 instead. The test passes on amd64 and arm64. The build compiles cleanly; only the test suite check phase fails.

This is a behavioral difference in HTTP/3 QUIC stream reset handling specific to riscv64. It has not been reported to nginx upstream (zero issues or patches referencing it in the nginx tracker). The downstream effect is that the riscv64 builds of nginx-stable and nginx-mainline in Arch RISC-V are stuck at one version behind upstream (1.30.2-1 and 1.31.1-1 respectively), and all downstream nginx-mod-* packages are also blocked.

Whether this is a nginx bug on riscv64 or a test harness issue (e.g., timing-dependent behavior that differs under QEMU or on RISC-V hardware) cannot be determined from the available data. No root cause analysis has been published.

---

## 12. Objections and Upstream Blockers

**nginx upstream contribution model:** nginx upstream accepts patches via the nginx-devel mailing list. There is no pull-request merge workflow; GitHub PRs are not accepted. Patches must meet the F5 CLA requirement and pass review by the core team. The project's conservatism toward external patches (especially for architecture-specific code) is well-documented by the long history of pending community contributions in other areas.

**Structural barriers to an riscv64 atomic header:**

The hand-tuned atomic headers for x86, amd64, SPARC64, and PowerPC exist because nginx historically targeted those platforms with specific performance goals. A patch adding `ngx_gcc_atomic_riscv.h` would need to demonstrate a measurable performance improvement over the GCC builtin path -- and would require RISC-V hardware benchmarks to do so. No such benchmarks exist (see Section 10). Without benchmark data, the upstream case for merging an riscv64 atomic header is weak.

**H3 test failure (Arch RISC-V FTBFS):** This bug has not been reported upstream. Filing a quality upstream report requires a reduced reproducer showing the HTTP/3 QUIC stream-reset behavioral difference on riscv64 vs x86_64. This requires a RISC-V hardware environment and familiarity with the nginx test framework.

**OpenResty/LuaJIT:** The openresty/openresty#777 issue (October 2021, zero responses) demonstrates that OpenResty maintainers have not prioritized riscv64 support. The root cause is in LuaJIT, not nginx itself. A complete solution requires either a LuaJIT riscv64 JIT backend (substantial work, separate project) or an OpenResty build option to use an interpreter-only Lua runtime.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

nginx builds and runs on riscv64 with no changes required. The generic GCC atomic path is correct and produces functional builds. The single active functional gap -- the HTTP/3 QUIC stream-reset behavioral difference causing the Arch RISC-V FTBFS -- is unknown in root cause and has no upstream bug filed.

Functional work items:

1. Reproduce and root-cause the `h3_limit_req.t` test failure on riscv64 (either a real nginx bug or a test harness artifact). File an upstream bug with a reproducer. Estimated effort: 2-4 person-weeks depending on access to RISC-V hardware and QUIC debugging complexity.

2. Unblock the Debian sid riscv64 build (1.30.1-5 "Needs-Build, no log"). This requires either contacting the Debian nginx maintainers or filing a bug against the package. The Debian buildd system may need a riscv64 builder assignment. Estimated effort: 1 person-week (coordination, not engineering).

### 13.2 Performance Optimization

No benchmark data exists to quantify the performance gap between the generic GCC atomic path and a hypothetical hand-tuned riscv64 atomic implementation. Any performance investment must begin with baseline measurement.

Performance work items:

1. Establish baseline nginx throughput and latency benchmarks on riscv64 hardware (e.g., SiFive HiFive Unmatched, Scaleway EM-RV1, or equivalent) vs arm64 for representative workloads (static file serving, reverse proxy, TLS termination). Estimated effort: 2-3 person-weeks.

2. If benchmarks show measurable spinlock contention overhead, implement `ngx_gcc_atomic_riscv.h` with hand-tuned `lr.d`/`sc.d` inline assembly and `WRS.NTO` cpu-pause equivalent. Submit via nginx-devel mailing list. Estimated effort: 3-4 person-weeks (implementation plus upstream negotiation).

3. Add riscv64 to `auto/cc/gcc` with appropriate `-march=` flag (e.g., `-march=rv64gc`). This is a one-line build-system change but requires upstream buy-in. Estimated effort: 1 person-week.

### 13.3 CI/CD Infrastructure

nginx has no riscv64 CI. Adding riscv64 to the nginx CI matrix requires either contributing RISC-V runners to the `nginx/ci-self-hosted` project or working with RISE to make runners available.

CI work items:

1. Add riscv64 to the nginx-buildbot matrix in `nginx/ci-self-hosted`. This requires F5/nginx maintainer agreement and either donated runner capacity or a funded arrangement with RISE or a hardware partner. Estimated effort: 2-3 person-weeks (infrastructure setup, upstream negotiation).

2. The H3 QUIC test failure must be resolved before riscv64 CI can be added to a blocking (non-informational) configuration, or the failing test must be explicitly excluded with a documented tracking issue.

### 13.4 Ecosystem Enablement

1. OpenResty LuaJIT gap: File a detailed issue on [openresty/openresty](https://github.com/openresty/openresty) (with a concrete proposal for an interpreter-only build mode) and a corresponding issue against LuaJIT for a riscv64 JIT backend. LuaJIT riscv64 JIT is out of scope for a nginx-focused investment but is a prerequisite for the large fraction of nginx deployments that use OpenResty. Estimated effort for the nginx side (build option): 2-3 person-weeks; LuaJIT JIT backend is a separate multi-month effort.

2. Upstream the `riscv64` cache-line/alignment entry formally (document it, add a comment, propose review). This is already present in `auto/os/conf` but has no upstream discussion record. Estimated effort: under 1 person-week.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Priority |
|---|---|---|---|
| Functional | Reproduce and file upstream bug for H3/QUIC `h3_limit_req.t` failure on riscv64 | 2-4 | High |
| Functional | Unblock Debian sid riscv64 build (coordination with Debian nginx maintainers) | 1 | High |
| Performance | Establish riscv64 baseline benchmarks (nginx throughput, latency, TLS) vs arm64 | 2-3 | High |
| Performance | Implement `ngx_gcc_atomic_riscv.h` with hand-tuned `lr.d`/`sc.d` and cpu-pause hint | 3-4 | Medium (pending benchmarks) |
| Performance | Add riscv64 `-march=` flag to `auto/cc/gcc` | 1 | Low |
| CI/CD | Add riscv64 to nginx-buildbot matrix in `nginx/ci-self-hosted` | 2-3 | Medium |
| Ecosystem | OpenResty: file issue and propose interpreter-only build mode for riscv64 | 1-2 | Medium |
| Ecosystem | Document and formalize the `auto/os/conf` riscv64 entry upstream | 0.5 | Low |

**Total estimated investment:** 12.5-18.5 person-weeks for the full scope. The minimum viable investment to unblock distribution packaging and file the one known behavioral bug is 3-5 person-weeks (Debian unblocking plus H3 bug filing).

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [nginx source repository](https://github.com/nginx/nginx)
- [nginx CI self-hosted workflows](https://github.com/nginx/ci-self-hosted)
- [nginx atomic operations header - ngx_atomic.h](https://github.com/nginx/nginx/blob/master/src/os/unix/ngx_atomic.h)
- [nginx build system - auto/os/conf](https://github.com/nginx/nginx/blob/master/auto/os/conf)
- [nginx build system - auto/cc/gcc](https://github.com/nginx/nginx/blob/master/auto/cc/gcc)
- [nginx official Linux packages](https://nginx.org/en/linux_packages.html)
- [Debian package tracker - nginx](https://tracker.debian.org/pkg/nginx)
- [Debian buildd riscv64 build history - nginx](https://buildd.debian.org/status/logs.php?pkg=nginx&arch=riscv64)
- [Debian BTS bug #912284 - nginx FTCBFS](https://bugs.debian.org/912284)
- [Ubuntu 24.04 Noble - nginx riscv64 package](https://packages.ubuntu.com/noble/riscv64/nginx/download)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)
- [OpenResty issue #777 - disable LuaJIT for riscv64](https://github.com/openresty/openresty/issues/777)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project GitHub organization](https://github.com/riseproject-dev)
- OpenSSL riscv64 status: `libraries/openssl.md`
- glibc riscv64 status: `libraries/glibc.md`