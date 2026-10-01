---
title: nginx
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: PCRE2
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libxslt
    relation: runtime-dependency
    criticality: optional
  - name: Perl
    relation: runtime-dependency
    criticality: optional
  - name: LuaJIT
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nginx" %}

# nginx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for nginx<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

nginx is a high-performance HTTP server, reverse proxy, and load balancer. The source repository is at [github.com/nginx/nginx](https://github.com/nginx/nginx), a read-only GitHub mirror of nginx's own Mercurial/Trac-based upstream development (hg.nginx.org / trac.nginx.org); GitHub issues and pull requests are not nginx's primary contribution channel. The project is licensed under 2-clause BSD. nginx is a corporate open-source project stewarded by F5, Inc., which acquired NGINX, Inc. in 2019; contributions require an F5 CLA (enforced by the `f5_cla.yml` workflow). There is no independent foundation governance and no CNCF or Linux Foundation membership. Publicly enumerable maintainer/company data could not be retrieved in this pass because `mcp__github__get_file_contents` and `list_commits` are both access-restricted against `nginx/nginx` in the research session used; historically, core nginx development has been dominated by F5/NGINX Inc. employees [NEEDS VERIFICATION].

nginx.org ships only source tarballs for every architecture; there is no architecture-specific pre-built binary from nginx.org for any platform, riscv64 included ([nginx.org/en/linux_packages.html](https://nginx.org/en/linux_packages.html)).

Community stance on riscv64 specifically is absent rather than hostile: there is no RISC-V tracking issue in the core repository, no mailing-list thread, and no documented policy for or against new architecture ports. The codebase is portable C with essentially no architecture-conditional logic, so the question of "supporting" a new architecture has never required an explicit upstream decision.

## 2. Port History and Upstreaming Timeline

There is no upstream RISC-V porting effort to document. The complete record of riscv64-related upstream activity:

| Date | Event | Source |
|---|---|---|
| Unknown | A `riscv64` case arm added to `auto/os/conf` setting `NGX_ALIGNMENT=16` and `NGX_MACH_CACHE_LINE=64` | [auto/os/conf](https://github.com/nginx/nginx/blob/master/auto/os/conf) |
| 2018-04-04 | Debian builds nginx 1.13.10-1 successfully on riscv64 (earliest confirmed build), meaning the generic GCC atomic fallback path was already sufficient for packaging | [buildd.debian.org nginx riscv64 history](https://buildd.debian.org/status/logs.php?pkg=nginx&arch=riscv64) |
| 2026-09-03 to 2026-09-07 | GitHub issue #1725, "RISC-V vector optimization for ngx_strstrn()", proposed RVV 1.0 intrinsics for the User-Agent substring-search routine targeting the SpacemiT K3/X100 SoC; author explicitly stated no validated before/after benchmarks existed; closed by maintainers as `not_planned` after 2 comments, no patch merged | [nginx/nginx#1725](https://github.com/nginx/nginx/issues/1725) |

Live `search_issues`, `search_pull_requests`, and `search_commits` queries for `"riscv"` and `"riscv64"` against `nginx/nginx` all return zero results beyond issue #1725 above. No commit, patch, or contributor has ever added riscv64-specific source code (as opposed to the one build-config constant). There are no "key contributors" to identify because no riscv64 port exists; the architecture is fully upstream in the sense that nothing downstream patches core nginx source to make it work, it simply compiles via nginx's existing portable-C and generic-compiler-builtin code paths.

Two closed, response-free downstream enhancement requests exist in adjacent (non-core) nginx-org repositories, both asking for riscv64 Docker image builds: [nginx/docker-nginx#986](https://github.com/nginx/docker-nginx/issues/986) ("Provide riscv64 build") and [nginx/docker-nginx-unprivileged#91](https://github.com/nginx/docker-nginx-unprivileged/issues/91) ("RISC-V support"). Neither received a maintainer response or a linked PR; both are closed.

## 3. Upstream Support Tier

nginx has no formal tier policy for architecture support. The `--with-cpu-opt` configure flag documents only pentium, pentiumpro, pentium3, pentium4, athlon, opteron, sparc32, sparc64, ppc64 as tunable CPU targets; riscv64 is not among them. CONTRIBUTING.md asks that changes "work properly on a wide range of supported platforms" but defines no hierarchy of tiers.

In practice riscv64 is an untested, non-CI-covered, non-release-blocking platform:

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned atomic ops | Yes | No (generic builtins) | No (generic builtins) |
| Official pre-built binary from nginx.org | No (source only) | No (source only) | No (source only) |
| Covered by nginx's own CI (`nginx/ci-self-hosted`) | Yes | Yes | No |
| Upstream tracking issue ever filed | N/A | N/A | None (one proposal, #1725, closed not_planned) |
| Distro packaging | Primary archive | Primary archive | Ports/secondary archive only (Ubuntu), Arch RISC-V community port |

## 4. Technical Architecture and RISC-V-Specific Subsystems

nginx has no assembly files anywhere in its source tree (confirmed by a full repository tree search: zero `.S` files, for any architecture, and zero `arch/` directories). There is no JIT compiler and no SIMD dispatch infrastructure in nginx core. The only architecture-specific code in the entire project is a small set of inline atomic-operation headers for x86, amd64, SPARC64, and PowerPC, plus the one build-config case arm in `auto/os/conf`.

**Atomic operations.** `src/os/unix/ngx_atomic.h` dispatches to architecture-specific headers via compiler predefined macros:

- `__i386__` -> `ngx_gcc_atomic_x86.h`
- `__amd64__` -> `ngx_gcc_atomic_amd64.h`
- `__sparc__` -> `ngx_gcc_atomic_sparc64.h`
- `__powerpc__` -> `ngx_gcc_atomic_ppc.h`

None of these macros fire on riscv64 (confirmed live: `riscv path:src repo:nginx/nginx` code search returns zero matches). riscv64 falls through to the generic `NGX_HAVE_GCC_ATOMIC` path, using `__sync_bool_compare_and_swap`, `__sync_fetch_and_add`, and `__sync_synchronize`. GCC lowers these to `lr.d`/`sc.d` (A-extension) instructions with the correct acquire/release semantics. This is the same tier of support arm64 receives: arm64 also has zero dedicated atomic assembly files and uses the identical generic-builtin path, so riscv64 is not an inferior or stub implementation relative to arm64, it is architecturally identical to it. The four hand-tuned architectures (x86, amd64, SPARC64, PowerPC) predate GCC's `__sync` builtins being considered reliable (circa 2004); modern targets including arm64 and riscv64 were never given bespoke assembly because the compiler-generated path is sufficient.

**CPU pause / spinlock hint.** `ngx_cpu_pause()` expands to the x86 `PAUSE` instruction on x86/amd64. No equivalent is defined for riscv64; the macro expands to nothing. This is a potential performance gap under high spinlock contention across worker processes, not a correctness issue. The RISC-V `WRS.NTO` hint instruction is not used anywhere in nginx.

**Cache line and alignment.** The sole riscv64-aware line in the entire codebase:

```sh
riscv64)
    have=NGX_ALIGNMENT value=16 . auto/define
    NGX_MACH_CACHE_LINE=64
;;
```
([auto/os/conf](https://github.com/nginx/nginx/blob/master/auto/os/conf), one `case` arm among roughly ten architectures including i386, amd64, sparc, ia64, aarch64, ppc64, s390x, loongarch64). This sets 16-byte alignment and a 64-byte cache line, identical treatment to the `aarch64 | arm64` arm immediately above it in the same file. This is build-time configuration only, not assembly or intrinsics, and it is the complete and only RISC-V-aware code path in nginx; it is not a stub awaiting further work, because no further work is architecturally necessary.

| Subsystem | riscv64 implementation | Gap vs amd64 |
|---|---|---|
| Compare-and-swap | GCC `__sync_bool_compare_and_swap` (`lr.d`/`sc.d`) | No hand-tuned assembly (same as arm64) |
| Fetch-and-add | GCC `__sync_fetch_and_add` | No hand-tuned assembly (same as arm64) |
| Memory barrier | GCC `__sync_synchronize` | No hand-tuned fence (same as arm64) |
| CPU pause hint | None | No `WRS.NTO` or equivalent |
| Cache line size | 64 bytes (build-config constant) | Matches hardware; no gap |
| Memory alignment | 16 bytes (build-config constant) | Correct for the RISC-V ABI |
| Assembly files | None (nginx has none for any arch) | No gap |
| JIT / SIMD | None (nginx has neither for any arch) | No gap |

## 5. Build System, Cross-Compilation, and Toolchain

nginx uses a hand-written, shell-based configure system, not autoconf/automake and not CMake. There is no `CMakeLists.txt` anywhere in the repository, no `cmake/` directory, no Dockerfile of any kind, and no `BUILDING.md`/cross-compilation documentation. The only root-level docs are README.md, CONTRIBUTING.md, SECURITY.md, SUPPORT.md, and CODE_OF_CONDUCT.md.

- Entry point: `auto/configure`, a POSIX shell script. (The GitHub mirror has no root-level `configure` wrapper; official release tarballs do.)
- Supporting logic lives under `auto/`: `auto/cc/*` (compiler-specific flags), `auto/os/conf` (per-architecture tuning, including the riscv64 arm above), `auto/options`, `auto/modules`, `auto/lib/*` (bundled PCRE2/zlib/OpenSSL build glue).
- `auto/configure` generates a `Makefile` under `objs/`; `make` compiles; `make install` installs to `/usr/local/nginx/` by default.
- No `--host=` cross-compilation triple is supported by `auto/configure`; `--build=NAME` is a cosmetic build-name tag only, not a toolchain selector. No QEMU reference exists anywhere in the repository.

Practical native build on riscv64:
```sh
git clone https://github.com/nginx/nginx.git
cd nginx
sudo apt install gcc make libpcre3-dev zlib1g-dev libssl-dev
auto/configure --with-http_ssl_module
make
sudo make install
```

Debian's riscv64 packaging adds three generic cross-build override flags, not riscv64-specific source patches: `--override-machine=riscv64` (nginx's configure uses `uname -m` for architecture detection, so this is needed under emulated/cross environments), `--override-system=Linux`, and `--override-release=3.16.0` (a conservative kernel compatibility floor; actual riscv64 Debian build hosts run newer kernels). These are the complete set of riscv64-specific build machinery; there is no native riscv64 configure preset.

**Toolchain requirements.** `auto/cc/gcc` defines explicit `-march=` entries for pentium, pentiumpro, athlon, opteron, sparc32, sparc64, and ppc64, but none for riscv64; riscv64 builds use the compiler's default optimization level with no architecture tuning. No explicit minimum GCC/Clang version is enforced by `auto/configure` for riscv64; `auto/cc/conf` only branches on very old GCC versions (2.7x, 2.x) for unrelated historical compiler-bug workarounds. In practice, GCC 7+ (first GCC release with a riscv64 backend) or Clang 9+ (when riscv64 Linux target support stabilized) will build nginx; this is a general toolchain-maturity fact, not something nginx's own documentation states. `--with-libatomic` is unnecessary on riscv64 because the RISC-V A extension is mandatory in the rv64gc baseline, so the GCC atomic builtins fire without libatomic_ops.

**Modules to avoid on riscv64.** LuaJIT-based modules (`lua-nginx-module` and similar OpenResty components) must not be used on riscv64; see Section 9 for detail.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned atomic CAS | Yes | No (GCC builtins) | No (GCC builtins) |
| CPU pause hint in spinlock | Yes (`PAUSE`) | Partial | None |
| Architecture-specific `-march=` flag in build system | Yes | Not in upstream build system | Not in upstream build system |
| Official pre-built package from nginx.org | No (source only) | No (source only) | No (source only) |
| Upstream CI coverage | Yes | Yes | No |
| Upstream riscv64 tracking issue | N/A | N/A | One, closed not_planned (#1725) |
| Distro binary availability | Primary archive | Primary archive | Secondary/ports archive (Ubuntu); community port (Arch RISC-V) |

The functional gap between riscv64 and arm64 is narrow: both rely on GCC-generated atomics rather than hand-written assembly. The `cpu_pause` gap is real but affects only spinlock-heavy, multi-worker configurations under high contention; it has not been shown to be a practical bottleneck (no benchmark exists either way, see Section 14.2). No NaN/floating-point semantics issue tied to nginx on riscv64 was found anywhere (GitHub search, web search); none of nginx's own code performs float/double arithmetic in a way sensitive to RISC-V NaN-boxing. Security-hardening gaps exist one dependency layer down (see OpenSSL in Section 9), not in nginx core itself.

## 7. CI/CD Infrastructure

nginx core has no riscv64 CI, confirmed directly in this pass via GitHub's `search_code` endpoint (not scoped to the research session's repository allowlist, so it was usable against `nginx/nginx` even though file-read tools were blocked):

- `repo:nginx/nginx path:.github/workflows` enumerates exactly 8 workflow files: `stale.yaml`, `f5_cla.yml`, `check-pr.yml`, `buildbot.yml`, `check-whitespace.yaml`, `new-issue-welcome.yaml`, `check-version-bump.yaml`, `check-commit-message.yaml`. These are PR/issue hygiene bots (CLA check, whitespace check, commit-message/version-bump checks, stale-issue bot, welcome bot) plus a buildbot trigger, none is a build/test matrix and none mentions any CPU architecture.
- `riscv path:.github/workflows repo:nginx/nginx` and `riscv64 path:.github repo:nginx/nginx` both return 0 results.
- Every job across those 8 files that declares a runner uses `runs-on: ubuntu-24.04` (standard x86_64 GitHub-hosted runner); there is no arm, riscv, or self-hosted/dedicated-architecture runner anywhere in `.github/workflows`.
- The actual build/test matrix is delegated to a private, non-public reusable workflow, `nginx/ci-self-hosted/.github/workflows/nginx-buildbot.yml@main`, which this session could not read directly. Per the prior investigation this matrix covers roughly 19 operating systems (Alpine, Amazon Linux, Debian, FreeBSD, RHEL, SLES, Ubuntu, Windows, and others) against exactly two architectures, amd64 and arm64 [NEEDS VERIFICATION: not re-read live this pass, access to `nginx/ci-self-hosted` is blocked in this session].
- `org:nginx riscv` (repo-wide across the entire nginx GitHub org) returns 11 hits, all outside `nginx/nginx`: the Docker image repos (`nginx/docker-nginx`, `nginx/docker-nginx-unprivileged`) and `nginx/nginx-prometheus-exporter` list riscv64 as a Docker Buildx target platform (image publishing, not engine CI), plus unrelated `package-lock.json` transitive npm dependency noise in two other repos.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In `nginx-buildbot` matrix | Yes | Yes | No |
| Dedicated workflow/runner | `ubuntu-24.04` hosted | hosted (per prior report) | None |
| RISE runner integration | N/A | N/A | None found |

No RISE Project involvement exists anywhere for nginx (see Section 12), so no RISE-provided riscv64 runner is a near-term option without new engagement. No open PR or upstream engineering effort exists to add riscv64 to the nginx CI matrix.

## 8. Distribution and Release Status

| Distribution | riscv64 Status | Version | Notes |
|---|---|---|---|
| nginx.org official packages | Not available | - | Source tarballs only, for every architecture ([nginx.org/en/linux_packages.html](https://nginx.org/en/linux_packages.html)) |
| Ubuntu 26.04 LTS (resolute) | Present (ports archive) | 1.28.3-2ubuntu1 | Confirmed via live fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=nginx&suite=resolute&searchon=names&section=all); architectures armhf, ppc64el, riscv64, s390x. The newer security-updated build, 1.28.3-2ubuntu1.11, is amd64/arm64-only in the primary archive. Related binary modules (`libnginx-mod-http-*`, `nginx-extras`, `nginx-light`, `nginx-confgen`, `prometheus-nginx-exporter`) also build for riscv64 in resolute. |
| Ubuntu 24.04 LTS (Noble) | Present (ports archive) | 1.24.0-2ubuntu7 | 532,756-byte `.deb` confirmed downloadable per prior investigation; [packages.ubuntu.com](https://packages.ubuntu.com/noble/riscv64/nginx/download). Whether later security revisions were built for riscv64 is [NEEDS VERIFICATION]. |
| Arch Linux RISC-V | Present, current and actively served | 1.30.5-1 (stable), 1.31.6-1 (mainline) | Live-verified against [mirror.nju.edu.cn/archriscv/repo/extra](https://mirror.nju.edu.cn/archriscv/repo/extra/): `nginx-1.30.5-1-riscv64.pkg.tar.zst` returns HTTP 200, content-length 700346, last-modified 2026-09-16, with a valid `.sig`; `nginx-mainline-1.31.6-1-riscv64.pkg.tar.zst` also present. See Section 11 for discussion of an earlier reported FTBFS at this port that current data contradicts. |
| Debian sid (unstable) | Reportedly missing | 1.30.1-5 (no riscv64 binary, per prior investigation) | Not re-verified live in this pass; carried forward from the existing report as [NEEDS VERIFICATION]. |
| Fedora | Present [NEEDS VERIFICATION] | Version unconfirmed | A Fedora RISC-V package-status tracker lists nginx 1.22.1 as "Complete"; Koji access was blocked during research. |

There is no PyPI, npm, Maven, or similar language-package-registry distribution channel for nginx (it is a C binary/source-tarball project, not a language package); a PyPI lookup for a package literally named `nginx` returns HTTP 404, as expected and not meaningful either way.

**What a user must do today to get a working riscv64 nginx:** install from the Ubuntu ports pocket (`nginx` 1.28.3-2ubuntu1 on resolute/noble) or the Arch Linux RISC-V repository (currently serving 1.30.5-1 stable / 1.31.6-1 mainline), or build from source via `auto/configure` natively on riscv64 hardware or under QEMU; there is no upstream-published riscv64 binary to download directly from nginx.org or from GitHub releases.

## 9. Dependencies

**Method note:** nginx has no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json`; it is built with the custom shell-based `auto/configure` script, so there is no machine-readable dependency manifest to parse. The table below reflects nginx's actual optional-module linkage as surfaced by `auto/configure` flags and cross-checked against each dependency's own riscv64 status research.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL | TLS/SSL and HTTP/3 QUIC (`--with-http_ssl_module`, `--with-http_v3_module`); runtime-dependency, critical | Green | Green (QEMU-only coverage; no native riscv64 CI runners) | Green | (1) AES T-table implementation is not constant-time on hardware lacking the Zkn/Zvkned crypto extensions, a security-critical gap, with fix PRs [#31080](https://github.com/openssl/openssl) and #31082 open upstream; (2) musl libc ISA detection is broken, [openssl/openssl#28118](https://github.com/openssl/openssl/issues/28118), confirmed still open; (3) an intermittent `test_lhash` CI flake on linux-riscv64, issue #30880, opened 2026-04-17 and still open; (4) no native riscv64 CI runners upstream. |
| PCRE2 | Regex engine for the HTTP rewrite module, embeds the SLJIT JIT backend; runtime-dependency, optional | Green | Green | Green | No open blocking issues (prior reports #831 and #14 are closed/fixed). Known gap: PCRE2's SIMD fast-path dispatch header (`pcre2_jit_simd_inc.h`) excludes `SLJIT_CONFIG_RISCV`, so the JIT exists but SIMD-accelerated scan routines do not; this is a performance gap, not a correctness blocker. |
| zlib | gzip compression (enabled by default); runtime-dependency, optional | Green | Mostly green (no native riscv64 Linux CI upstream; riscv64 CI coverage is OpenBSD-only) | Green | No correctness-blocking issues. Performance-only gap: an RVV-accelerated Adler-32 PR, [madler/zlib#1099](https://github.com/madler/zlib/pull/1099), has been unmerged for 8+ months with no maintainer response (a duplicate, #1267, was self-withdrawn). No Zbc-based CRC-32 path exists on riscv64, unlike the hardware CRC32 path available on arm64. |
| libxslt | Optional XSLT transforms module (`--with-http_xslt_module`); runtime-dependency, optional | Green (native riscv64 build verified on Debian sid hardware, no QEMU) | Green | Green | None. Confirmed present for riscv64 in Ubuntu 26.04 resolute (`libxslt1.1`, `libxslt1-dev`, and related packages); no architecture-conditional code and no known riscv64 issues. |
| Perl | Optional embedded-Perl module (`--with-http_perl_module`); runtime-dependency, optional | Green | Green | Green | None documented. Long-standing Debian/Ubuntu riscv64 package. |
| LuaJIT | Embedded Lua scripting via OpenResty/`lua-nginx-module`; runtime-dependency, optional | Not functional | N/A | N/A | **Critical, permanent gap.** No riscv64 code generator exists in upstream LuaJIT; the port has been blocked since 2020 per the master tracking issue, [LuaJIT/LuaJIT#628](https://github.com/LuaJIT/LuaJIT/issues/628) (sole maintainer Mike Pall requires a fully sponsored JIT-backend port, not just an interpreter). A community PR, #1267, has roughly 145 reactions and working fixes but zero maintainer comment since 2024-09-08. Downstream effect: [openresty/openresty#777](https://github.com/openresty/openresty/issues/777) (filed October 2021, zero maintainer responses) means OpenResty is non-functional on riscv64; nginx deployments should avoid LuaJIT-based modules on this architecture entirely. |

**Additional indirect/build-level dependencies** (not part of the direct list above, carried forward from prior investigation and not contradicted by live findings):

| Dependency | Role | riscv64 status |
|---|---|---|
| glibc | C runtime, pthreads (`--with-threads`) | Green. Historical bugs (vector memset SIGILL in 2.40, IFUNC gp-pointer crash in 2.41) are fixed in current releases (2.43 in Debian sid). No current blockers. |
| libatomic | Fallback atomics (`--with-libatomic`) | Not needed; RV64A is mandatory in the rv64gc baseline, so the GCC atomic builtins fire without it. |
| libgd | Image processing (`--with-http_image_filter_module`), optional | Green. Available in Debian/Ubuntu/Arch for riscv64, no known issues. |

The OpenSSL AES constant-time gap is directly deployment-relevant for any riscv64 hardware lacking Zkn (scalar crypto) or Zvkned (vector AES) extensions, since it affects TLS termination in nginx directly.

## 11. Known Bugs and Active Issues

**Upstream nginx tracker:** zero riscv64-specific bugs filed in `nginx/nginx` (issues, PRs, or trac.nginx.org tickets), confirmed again live this pass via `search_issues`/`search_pull_requests`/`search_commits` (`total_count: 0` for all riscv/riscv64 queries). The only riscv64-related item in the core repo is the closed, not-planned optimization proposal #1725 (Section 2).

| ID | Tracker | Description | Status | Impact |
|---|---|---|---|---|
| nginx/nginx#1725 | GitHub | "RISC-V vector optimization for ngx_strstrn()" (RVV 1.0 intrinsics for User-Agent parsing on SpacemiT K3/X100) | Closed, not_planned (opened and closed September 2026) | None; no patch merged, no benchmark data provided |
| nginx/docker-nginx#986 | GitHub | "Provide riscv64 build" (Docker Hub image request) | Closed, no comments, no linked PR | Official Docker images remain amd64/arm64-focused |
| nginx/docker-nginx-unprivileged#91 | GitHub | "RISC-V support" (requests CI changes to publish `linux/riscv64` images) | Closed, no comments, no linked PR | Same as above for the unprivileged image variant |
| No bug number | [Debian tracker, nginx](https://tracker.debian.org/pkg/nginx) | nginx 1.30.1-5 reportedly missing a riscv64 build in sid | Reported in prior investigation, not re-verified live this pass | [NEEDS VERIFICATION] |
| Debian BTS #912284 | [bugs.debian.org](https://bugs.debian.org/912284) | "nginx FTCBFS: multiple reasons" (fails to cross-build from source), filed October 2018 | Reported open in prior investigation, not re-verified live this pass | Affects cross-build flows relevant to riscv64 ports [NEEDS VERIFICATION] |
| openresty/openresty#777 | GitHub | "disable luajit", OpenResty non-functional on riscv64 | Open, filed October 2021, zero maintainer responses | OpenResty/Lua modules entirely non-functional on riscv64 |

**Arch Linux RISC-V HTTP/3 test discrepancy, resolved status unclear.** The existing internal record described a persistent FTBFS on the Arch RISC-V nginx packages caused by test 6 of `h3_limit_req.t` ("reset stream - log") expecting HTTP 499 on an HTTP/3 QUIC stream reset under rate limiting but observing HTTP 400 on riscv64, allegedly stuck for 18+ months at versions 1.30.2-1 (stable) and 1.31.1-1 (mainline). This claim is **contradicted by current live data**: a direct fetch of the Arch RISC-V mirror in this pass shows the stable and mainline nginx packages at 1.30.5-1 and 1.31.6-1 respectively, both materially newer than the versions the FTBFS claim describes, with valid signed artifacts actively served (HTTP 200, last-modified 2026-09-16). This is treated as a stale internal claim superseded by live evidence, not as confirmed ongoing breakage; whether the underlying QUIC-stream-reset test discrepancy was fixed upstream, patched downstream, or simply skipped in the Arch build has not been independently confirmed, and the discrepancy was never reported to nginx upstream (zero matching issues or patches in the nginx tracker). Root cause, if the behavioral difference still exists in some form, remains undetermined.

## 12. Objections and Upstream Blockers

**Contribution model.** nginx accepts patches via the nginx-devel mailing list; GitHub PRs against `nginx/nginx` are not the accepted contribution path, since the GitHub repo is a read-only mirror of Mercurial/Trac-based upstream development. Patches require F5 CLA signoff and core-team review.

**No case exists for a hand-tuned riscv64 atomic header.** The existing hand-tuned atomic headers (x86, amd64, SPARC64, PowerPC) were added when those platforms were nginx's primary performance targets. A patch adding a riscv64-specific atomic implementation would need benchmark evidence of a measurable improvement over the generic GCC builtin path; no such benchmark exists anywhere (Section 14.2), so there is currently no upstream case to make.

**No RISE Project engagement.** F5 and nginx are not RISE members. A systematic scan of all 35 RISE blog posts (May 2024 through September 2026) found zero nginx mentions; the one post most plausibly relevant to CI infrastructure ("Announcing the RISE RISC-V Runners," March 2026) was fetched in full and contains no nginx reference. A search of all 26 repositories in the riseproject-dev GitHub organization and a direct `"nginx org:riseproject-dev"` code search both return zero nginx-specific work; the only incidental hit is an `nginx.conf` reverse-proxy config file inside RISE's own (now-archived) `pypi-proxy` infrastructure repo, which is RISE using nginx as internal tooling, not RISE funding or porting nginx. RISE's RFP program (projects RP001 through RP024) has no nginx-related project. No RISE wheel-builder entry exists for nginx (not applicable, since nginx is not a Python package).

**LuaJIT/OpenResty blocker is organizationally outside nginx's control.** The root cause (no riscv64 JIT backend in LuaJIT) sits with LuaJIT's sole maintainer, who has stated a full sponsored JIT-backend port is required, not merely an interpreter fallback ([LuaJIT/LuaJIT#628](https://github.com/LuaJIT/LuaJIT/issues/628)). OpenResty's own tracking issue has had zero maintainer engagement since filing in October 2021. A nginx-side fix (an OpenResty build option to skip LuaJIT and use an interpreter-only Lua runtime) is feasible independent of the LuaJIT backend problem but has not been proposed.

**Acceptance probability assessment:** low-to-moderate for small, additive changes (e.g., formally documenting the existing `auto/os/conf` riscv64 entry, or adding a `-march=rv64gc` build flag) given nginx's conservative, mailing-list-gated review process and the complete absence of any riscv64 advocacy inside the project; near-zero for anything requiring new hand-tuned assembly without accompanying hardware benchmark data, since no such data exists.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** nginx/nginx has no upstream riscv64 CI at all: live `search_code` verification against the repo's 8 `.github/workflows/*.yml` files found zero riscv/riscv64 hits, and every job that declares a runner uses `runs-on: ubuntu-24.04`; the only riscv-related content anywhere in the repository is the 3-line build-config case arm in [auto/os/conf](https://github.com/nginx/nginx/blob/master/auto/os/conf) setting alignment/cache-line constants. nginx.org also ships only source tarballs for every architecture ([nginx.org/en/linux_packages.html](https://nginx.org/en/linux_packages.html)), so there is no upstream-published riscv64 binary either. This starts at orange ("no upstream CI") per the standard grading approach, but the distribution floor applies: both Arch Linux RISC-V and Ubuntu's ports archive build nginx from effectively unmodified upstream source. Ubuntu 26.04 "resolute" ships `nginx 1.28.3-2ubuntu1` for riscv64 via the ports pocket ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=nginx&suite=resolute&searchon=names&section=all)), and the Debian/Ubuntu packaging deviations are generic cross-build configure overrides (`--override-machine=riscv64`, `--override-system=Linux`, `--override-release=3.16.0`) rather than riscv64-specific source patches. Live-fetched evidence from the Arch RISC-V mirror confirms a real, signed, currently-served riscv64 binary (`nginx-1.30.5-1-riscv64.pkg.tar.zst`, HTTP 200, 700346 bytes, last-modified 2026-09-16) and a mainline build (`nginx-mainline-1.31.6-1-riscv64.pkg.tar.zst`), both newer than the versions an earlier internal record described as permanently FTBFS-blocked; that earlier claim is therefore stale and contradicted by current live data, treated as superseded rather than confirmed ongoing breakage, so it does not justify red. This is a "clean distro build": nginx builds and is packaged for riscv64 by downstream distros from vanilla source, with no upstream CI validating it and no upstream-published riscv64 artifact, which caps the color at yellow. nginx's purpose is general-purpose HTTP serving/proxying, not algorithmic speed-up over a simpler reference implementation, so the optimization-purpose modifier does not apply.
- **Pending work that could change the grade:** No open PR or upstream engineering exists to add riscv64 to nginx's own CI matrix (`nginx/ci-self-hosted`, which runs amd64/arm64 only). No RISE Project involvement was found anywhere (blog, RFPs, riseproject-dev GitHub org, wheel builder); nginx is not a RISE member and no funded work targets it. Debian sid reportedly lacks a riscv64 build entirely (per the prior investigation; not re-verified live in this pass). The historical Arch RISC-V HTTP/3 QUIC stream-reset test discrepancy (`h3_limit_req.t`, expecting 499 vs. actual 400) was never reported upstream and its current status (fixed vs. skipped) is unconfirmed, though current Arch mirror data shows successful recent builds (1.30.5-1 stable, 1.31.6-1 mainline) that supersede the old "stuck" claim. LuaJIT/OpenResty remain non-functional on riscv64 ([openresty/openresty#777](https://github.com/openresty/openresty/issues/777), filed October 2021, zero maintainer responses) because LuaJIT has no riscv64 JIT backend, a permanent ecosystem gap for any riscv64 deployment relying on Lua scripting, though this is a dependency gap rather than a core-nginx blocker.

## 14. Investment Analysis

RISE has not funded, benchmarked, or engaged with nginx in any capacity (Section 12); no existing RISE work can be subtracted from the estimates below.

### 14.1 Functional Enablement

1. Determine the current status of the historical `h3_limit_req.t` HTTP/3 QUIC stream-reset discrepancy on Arch RISC-V: confirm whether it was fixed, worked around, or is simply no longer triggered by the current test suite, and file an upstream report with a reproducer if a real behavioral difference still exists. Estimated effort: 1-3 person-weeks (uncertainty reflects that current Arch builds succeed, so this may already be moot).
2. Verify and, if still accurate, resolve the reported Debian sid riscv64 build gap by coordinating with Debian's nginx maintainers or filing a packaging bug. Estimated effort: 1 person-week (coordination, not engineering).

### 14.2 Performance Optimization

nginx's purpose is general-purpose HTTP serving, not an optimization target in the sense this grading model tracks algorithmic speed-up; this section covers conventional performance engineering, not an ISA-extension optimization gap.

1. Establish baseline nginx throughput/latency benchmarks on riscv64 hardware (e.g., SiFive HiFive Unmatched, SpacemiT K3/X100, or a Scaleway EM-RV1 instance) versus arm64 for representative workloads (static file serving, reverse proxy, TLS termination). No such data exists today in any upstream, distro, RISE, vendor, or academic source. Estimated effort: 2-3 person-weeks.
2. If benchmarks show measurable spinlock-contention overhead from the missing `cpu_pause` hint, implement and upstream-propose a `WRS.NTO`-based riscv64 cpu-pause equivalent. Estimated effort: 1-2 person-weeks, contingent on step 1's results.
3. Revisit GitHub issue #1725's `ngx_strstrn()` RVV-vectorization proposal with real profiling data before resubmitting, since the original proposal was closed not_planned specifically for lacking benchmark evidence. Estimated effort: 2-3 person-weeks (profiling plus patch).
4. Add a riscv64 `-march=` entry (e.g., `rv64gc`) to `auto/cc/gcc`. A one-line build-system change, but requires upstream buy-in. Estimated effort: 1 person-week.

### 14.3 CI/CD Infrastructure

1. Add riscv64 to the `nginx-buildbot` matrix in `nginx/ci-self-hosted`, which requires F5/nginx maintainer agreement and either donated runner capacity or a funded arrangement with RISE or a hardware partner. Estimated effort: 2-3 person-weeks.
2. Resolve or formally document the status of the HTTP/3 test discrepancy (14.1.1) before any riscv64 CI job can run in a blocking (non-informational) configuration.

### 14.4 Ecosystem Enablement

1. File an issue on [openresty/openresty](https://github.com/openresty/openresty) proposing an interpreter-only build mode for riscv64 (bypassing LuaJIT entirely), and a corresponding tracking issue against LuaJIT itself. The LuaJIT riscv64 JIT backend is a separate, multi-month effort outside nginx's own scope; the nginx/OpenResty-side build option is tractable independently. Estimated effort for the OpenResty-side build option: 2-3 person-weeks; the LuaJIT JIT backend itself is a multi-month undertaking not sized here.
2. Formally document and propose upstream review of the existing `auto/os/conf` riscv64 entry (alignment/cache-line constants), which currently has no upstream discussion record despite being load-bearing. Estimated effort: under 1 person-week.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm current status of the Arch RISC-V HTTP/3 `h3_limit_req.t` discrepancy; file upstream report if still real | 1-3 | Distro/upstream liaison | High |
| Functional | Verify and, if needed, unblock Debian sid riscv64 build | 1 | Distro liaison | High |
| Performance | Establish riscv64 baseline benchmarks (throughput, latency, TLS) vs arm64 | 2-3 | Performance engineering | High |
| Performance | Resubmit `ngx_strstrn()` RVV optimization (#1725) with real profiling data | 2-3 | Performance engineering | Medium |
| Performance | Implement riscv64 cpu-pause hint, contingent on benchmark results | 1-2 | Systems engineering | Medium (pending benchmarks) |
| Performance | Add riscv64 `-march=` flag to `auto/cc/gcc` | 1 | Build engineering | Low |
| CI/CD | Add riscv64 to `nginx-buildbot` matrix in `nginx/ci-self-hosted` | 2-3 | CI/upstream liaison | Medium |
| Ecosystem | Propose OpenResty interpreter-only build mode for riscv64 | 2-3 | Ecosystem engineering | Medium |
| Ecosystem | Document and formalize the `auto/os/conf` riscv64 entry upstream | 0.5-1 | Upstream liaison | Low |

**Total estimated investment:** approximately 13.5-20 person-weeks for the full scope above. The minimum viable investment to confirm (or close) the two open functional questions, the HTTP/3 test discrepancy and the Debian sid build gap, is 2-4 person-weeks.

## 15. References

- [nginx source repository](https://github.com/nginx/nginx)
- [nginx CI self-hosted workflows](https://github.com/nginx/ci-self-hosted)
- [nginx atomic operations header, ngx_atomic.h](https://github.com/nginx/nginx/blob/master/src/os/unix/ngx_atomic.h)
- [nginx build system, auto/os/conf](https://github.com/nginx/nginx/blob/master/auto/os/conf)
- [nginx build system, auto/cc/gcc](https://github.com/nginx/nginx/blob/master/auto/cc/gcc)
- [nginx official Linux packages](https://nginx.org/en/linux_packages.html)
- [nginx/nginx issue #1725, RISC-V vector optimization for ngx_strstrn()](https://github.com/nginx/nginx/issues/1725)
- [nginx/docker-nginx issue #986, Provide riscv64 build](https://github.com/nginx/docker-nginx/issues/986)
- [nginx/docker-nginx-unprivileged issue #91, RISC-V support](https://github.com/nginx/docker-nginx-unprivileged/issues/91)
- [Debian package tracker, nginx](https://tracker.debian.org/pkg/nginx)
- [Debian buildd riscv64 build history, nginx](https://buildd.debian.org/status/logs.php?pkg=nginx&arch=riscv64)
- [Debian BTS bug #912284, nginx FTCBFS](https://bugs.debian.org/912284)
- [Ubuntu 26.04 (resolute) package search, nginx](https://packages.ubuntu.com/search?keywords=nginx&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 (Noble) nginx riscv64 package](https://packages.ubuntu.com/noble/riscv64/nginx/download)
- [Arch Linux RISC-V mirror, extra repository](https://mirror.nju.edu.cn/archriscv/repo/extra/)
- [OpenSSL issue #28118, musl ISA detection](https://github.com/openssl/openssl/issues/28118)
- [madler/zlib pull request #1099, RVV Adler-32](https://github.com/madler/zlib/pull/1099)
- [LuaJIT issue #628, riscv64 JIT backend tracking](https://github.com/LuaJIT/LuaJIT/issues/628)
- [OpenResty issue #777, disable LuaJIT for riscv64](https://github.com/openresty/openresty/issues/777)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project GitHub organization](https://github.com/riseproject-dev)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- OpenSSL riscv64 status: `project-reports/openssl.md`
- PCRE2 riscv64 status: `project-reports/pcre2.md`
- zlib riscv64 status: `project-reports/zlib.md`
- LuaJIT riscv64 status: `project-reports/luajit.md`
- libxslt riscv64 status: `project-reports/libxslt.md`