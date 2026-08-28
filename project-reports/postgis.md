---
title: PostGIS
---

# PostGIS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for PostGIS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

PostGIS is a spatial database extension for PostgreSQL, adding geographic object support (geometry, geography, raster, topology types) and spatial query functions to the database. It is a project of **OSGeo** (Open Source Geospatial Foundation); the website footer reads "PostGIS PSC & OSGeo" ([PostGIS homepage](https://postgis.net/)).

Governance is by a **Project Steering Committee (PSC)**. Per the manual's Credits chapter, current PSC members are:
- Paul Ramsey (Chair) - co-founder, geography support, GEOS integration
- Regina Obe - CI/website maintenance, Windows builds, documentation
- Darafei Praliaskouski - index improvements, SFCGAL, raster, GitHub curation
- Sandro Santilli - bug fixes, topology support, raster framework

Source: [PostGIS Credits (manual-dev)](https://postgis.net/docs/manual-dev/postgis_credits.html). No MAINTAINERS or PSC.txt file could be located in the repository root; the OSGeo Gitea repository root itself returned HTTP 403 (Anubis bot-challenge protection), and the GitHub mirror contains only CREDITS, CONTRIBUTING.md, and CODE_OF_CONDUCT.md, not a PSC roster file.

License is widely documented as GPLv2+, but this was not independently re-confirmed from a primary source in this research pass (the fetched homepage excerpt showed only the CC BY-SA 4.0 license applying to *website content*) - [NEEDS VERIFICATION].

**Corporate sponsors** listed in the Credits chapter: Crunchy Data, Postgres Pro, Google, Carto, Camptocamp, Aiven, Boundless, Oslandia, PlanetScale, Palantir Technologies, Refractions Research, Azavea, HighGo, Kontur, OSGeo, plus government/academic sponsors (US Census Bureau, Natural Resources Canada, Universite Laval, UC Davis).

**Historically funded contributors** (per Credits chapter): Jorge Arevalo (raster, funded via Deimos Space), Mateusz Loskot (CMake support, funded via Cadcorp), Pierre Racine (raster architect, funded via Universite Laval), Bborie Park (raster, funded via UC Davis Center for Vectorborne Diseases). Current employers of active PSC members were not found - [NEEDS VERIFICATION].

**PostGIS is not a RISE Project member.** The RISE members list contains only semiconductor/hardware companies and no database or geospatial software projects. Source: [RISE Project members](https://riseproject.dev/members/).

No explicit PSC statement on RISC-V or on accepting new architecture ports was found. Given that PostGIS carries no architecture-specific code (see Section 4) and depends only on portable C plus its dependency stack, the implicit community stance appears to be "supported by default through the toolchain," rather than an actively managed port. This is an inference, not a documented policy.

## 2. Port History and Upstreaming Timeline

No dedicated riscv64 "port" work was found in the PostGIS project itself, because none was required: the codebase contains no CPU-architecture-conditional logic to port (see Section 4). The only riscv64-relevant events identified are in downstream packaging:

| Date | Event | Source |
|---|---|---|
| Unknown (Ubuntu 24.04 "noble" release cycle) | `postgis`, `postgresql-16-postgis-3`, `postgresql-postgis` version 3.4.2+dfsg-1ubuntu3 published with riscv64 listed among supported architectures | [Ubuntu Packages search](https://packages.ubuntu.com/search?keywords=PostGIS&suite=noble&searchon=names&section=all) |
| 2025-07-21 | NixOS/nixpkgs PR #424800 merged: "postgresqlPackages.postgis: fix cross-compilation," fixing `nix build .#pkgsCross.riscv64.postgis` failure (`configure: error: could not find libxml2`, `--with-json` cross-compile check) | [NixOS/nixpkgs PR #424800](https://github.com/NixOS/nixpkgs/pull/424800) |
| (after 2025-07-21) | Fix backported to release-25.05 via PR #427129 | [NixOS/nixpkgs PR #427129](https://github.com/NixOS/nixpkgs/pull/427129) |
| Prior to #424800 | NixOS/nixpkgs PR #410550 "postgis: Fix RiscV cross-compilation" opened but closed unmerged (diff touched unrelated files, apparent bad rebase) | [NixOS/nixpkgs PR #410550](https://github.com/NixOS/nixpkgs/pull/410550) |
| As of research check (age "60d 3h 18m" on the buildd counter) | `postgis 3.6.4+dfsg-2` shows status "Installed" on riscv64 in Debian sid, builder host `rv-osuosl-02` | [Debian buildd status for postgis](https://buildd.debian.org/status/package.php?p=postgis) |

No upstream OSGeo Gitea commit, issue, or pull request referencing "riscv" was found via GitHub code search (zero matches on `postgis/postgis`), GitHub search API (`api.github.com/search/issues?q=postgis+riscv64`, zero results), or repeated WebSearch queries. The OSGeo Gitea and Trac trackers were blocked by Anubis bot-challenge (HTTP 403) throughout this research, so a definitive "no ticket exists" conclusion for those trackers specifically cannot be fully confirmed - flagged as an access gap, not a confirmed negative.

**Is it fully upstream?** There is no separate "port" to be upstream or not - riscv64 support is a byproduct of PostGIS being a portable C codebase with no architecture branches. It builds and installs on riscv64 wherever the dependency stack (PostgreSQL, GEOS, PROJ, etc.) is available, without any PostGIS-specific patch.

## 3. Upstream Support Tier

**No formal architecture-support tier policy document exists for PostGIS**, unlike core PostgreSQL, which documents supported-platform tiers. This could not be located in accessible sources; the OSGeo Gitea wiki/Trac were inaccessible (403/Anubis), so this should be treated as "not found," not "confirmed absent."

Evidence of tier-like treatment by proxy (CI presence, release-blocking status, official binaries):

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI (`ci.yml`, `ci-freebsd.yml`, `ci-macos.yml`, `msys.yml`) | Yes (ubuntu-latest, freebsd, macos, windows/msys2) | No | No |
| Woodpecker CI (`portability.yml`) | Yes | Yes (armhf/arm32v7 and arm64/arm64v8 via QEMU) | No |
| Woodpecker CI (`regress.yml`, `qa.yml`, `garden.yml`, `qa-expensive.yml`, `mingw-wine.yml`, `tools.yml`) | Yes (all pinned `linux/amd64`) | No | No |
| Jenkins (debbie.postgis.net nodes) | Yes (bessie, docker, reallie) | Yes (berrie = Raspberry Pi 32-bit, berrie64 = Raspberry Pi 64-bit, native hardware) | No riscv64 worker |
| GitLab CI (`.gitlab/gitlab.com/ci.yml`, `.gitlab/inaf.it/ci.yml`) | Yes (debian amd64 + i386) | No | No |
| Official Docker images (`docker-postgis`) | Yes | Not documented in the fetched README | No; README states "Supported architecture: amd64 (x86-64)" only |
| Official upstream release binaries | Source tarball, distro packaging | Source tarball, distro packaging | Source tarball only; no upstream binary |
| Downstream distro binary packages | Debian, Ubuntu, others | Debian, Ubuntu, others | Debian sid ("Installed"), Ubuntu 24.04 noble |

Sources: [PostGIS CI status dashboard](https://postgis.net/ci/status.json), [docker-postgis repository](https://github.com/postgis/docker-postgis), [Debian buildd status](https://buildd.debian.org/status/package.php?p=postgis), [Ubuntu Packages search](https://packages.ubuntu.com/search?keywords=PostGIS&suite=noble&searchon=names&section=all).

Conclusion: riscv64 sits below even the informal tier implied for arm64 (which has both QEMU-based upstream CI and native Jenkins hardware). riscv64 has zero upstream CI coverage of any kind; its only support signal is downstream distro packaging succeeding independently of the PostGIS project.

## 4. Technical Architecture and RISC-V-Specific Subsystems

PostGIS contains **no CPU-architecture-conditional code of any kind** - not for x86, ARM, or RISC-V. This was verified directly:

- `configure.ac` contains no `host_cpu` case statement anywhere. The only `host_os` branches that exist are for `mingw*` and `darwin*` (Windows/macOS packaging concerns - RPATH, DLL naming), not CPU-architecture logic.
- Grep of `liblwgeom_internal.h`, `lwgeom_api.c`, `lwgeodetic_tree.c`, and `measures.c` for `SSE`, `AVX`, `NEON`, `__m128`, `intrinsic` returned zero matches.
- `gserialized2.c` (the geometry serialization/deserialization hot path, the most plausible place for alignment- or endianness-sensitive code) uses generic `memcpy()` calls specifically to avoid unaligned-access undefined behavior portably across architectures (source comments reference "aligned... double aligned" and "handle missaligned uint32_t data"). This is a portability pattern, not an architecture-specific optimization.
- Full `liblwgeom/` and `deps/` directory trees contain no architecture-named path (no `x86/`, `arm/`, `riscv/`, `simd/`). `deps/` holds only `flatgeobuf`, `ryu`, `uthash`, `wagyu`, none architecture-specific.
- The only repository-wide hit for the string "riscv" is `macros/host-cpu-c-abi.m4` ([postgis/postgis on GitHub](https://github.com/postgis/postgis/blob/master/macros/host-cpu-c-abi.m4)), a generic gnulib-derived autoconf macro that probes for `riscv32`/`riscv64` and ilp32/lp64 float-ABI variants for build configuration purposes. It contains no assembly, intrinsics, or performance logic - pure preprocessor probing imported wholesale from gnulib, shared by every project that uses that macro, not written for or by PostGIS.
- A GitHub code search for `__m128` and `riscv` across the full repository could not be executed live (authentication-gated), and `grep.app` was rate-limited (HTTP 429), so a fully independent repo-wide code-search cross-check was not completed - flagged as a residual verification gap.

There is no JIT backend in PostGIS (that is a PostgreSQL/LLVM feature, not part of PostGIS), no SIMD dispatch, no hand-written assembly, and no GC (PostGIS uses PostgreSQL's memory-context allocator, not a garbage collector).

Component table:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| liblwgeom (core geometry engine) | No arch-specific code; portable C | No arch-specific code; portable C | No arch-specific code; portable C |
| libpgcommon | No arch-specific code | No arch-specific code | No arch-specific code |
| Raster subsystem | No arch-specific code (delegates to GDAL) | Same | Same |
| Topology subsystem | No arch-specific code | Same | Same |
| shp2pgsql / loader tools | No arch-specific code | Same | Same |

Because there is no architecture-specific implementation surface in the codebase, "riscv64 implementation completeness" is not a meaningful axis for PostGIS the way it would be for a project with hand-tuned intrinsics or assembly (e.g., a codec or crypto library). All CPU-specific performance work, if any exists at all, is delegated entirely to dependencies (GEOS, PROJ, SFCGAL) which are outside the PostGIS repository and outside the scope of this research pass.

## 5. Build System, Cross-Compilation, and Toolchain

PostGIS builds via GNU autoconf (`configure.ac` / `autogen.sh`) against PostgreSQL's `pg_config`. Relevant configure flags (from upstream `configure.ac`, master branch, [raw source](https://raw.githubusercontent.com/postgis/postgis/master/configure.ac)):

```
--without-raster        (disable raster extension; raster requires GDAL >= 2.4.0)
--without-topology      (disable topology extension)
--without-protobuf      (needs libprotobuf-c >= 1.1.0)
--without-json          (needs json-c)
--with-sfcgal[=PATH]    (needs SFCGAL >= 1.3.1)
--with-gui              (needs GTK+ >= 2.8.0)
--with-projdir=PATH     (needs PROJ >= 6.1.0)
--with-geosconfig=FILE  (needs GEOS >= 3.10.0)
--with-pgconfig=FILE    (needs PostgreSQL >= 14)
--enable-lto
--enable-debug
--enable-assert
```

**No explicit minimum GCC/Clang version is stated anywhere** in `configure.ac`, INSTALL, or README. The build system only checks for compiler *capability*: gnu11 C standard support (`-std=gnu11`) and mandatory C++11 (`AX_CXX_COMPILE_STDCXX(11, noext, mandatory)`), plus LTO-flag probing (`-fno-semantic-interposition`, `-flto`). This is likely simply unspecified upstream rather than omitted from this research - [NEEDS VERIFICATION] if a stricter minimum exists in undiscovered docs.

**Debian's `debian/rules`** uses the same generic invocation on every architecture, with no riscv64-specific branch (source: [sources.debian.org debian/rules](https://sources.debian.org/src/postgis/3.6.4+dfsg-2/debian/rules/)):

```
--host=$(DEB_HOST_GNU_TYPE)
--build=$(DEB_BUILD_GNU_TYPE)
--prefix=/usr
--without-interrupt-tests
--without-phony-revision
--enable-lto
--datadir=${prefix}/share/postgresql-<VER>-postgis
--with-pgconfig=<path-to-pg_config>
```

**Docker**: the official `docker-postgis` Alpine Dockerfile (18-3.6) builds via `apk add gdal-dev geos-dev proj-dev sfcgal-dev ... autoconf gcc json-c-dev` followed by `./autogen.sh && ./configure --enable-lto && make && make install`, then runs regression tests before installing runtime dependencies. Its README explicitly states **"Supported architecture: amd64 (x86-64)"** and no riscv64 variant exists in the repository. Source: [docker-postgis Alpine Dockerfile](https://raw.githubusercontent.com/postgis/docker-postgis/master/18-3.6/alpine/Dockerfile), [postgis/docker-postgis repository](https://github.com/postgis/docker-postgis).

**QEMU**: No QEMU usage documentation was found anywhere in `postgis/postgis` or `postgis/docker-postgis`. Whether the Debian riscv64 buildd host `rv-osuosl-02` is native hardware or QEMU-emulated could not be confirmed directly; this was only inferred (not verified) from general Debian porterbox naming conventions - [NEEDS VERIFICATION].

**Known build failures**: The only concrete riscv64-specific build failure found is the NixOS/nixpkgs cross-compilation bug fixed in PR #424800 (Section 2) - a packaging-layer issue (the `--with-xml2config` flag not being passed correctly during cross-compilation, plus a `--with-json` check that fails when cross-compiling), not an upstream PostGIS bug. No riscv64 build-log content past the dependency-installation phase could be retrieved from Debian's buildd for `3.6.4+dfsg-2`, so the exact compiler version/flags used on that build were not directly confirmed - [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because PostGIS contains no architecture-conditional code (Section 4), no functional feature gaps attributable to riscv64-specific code were identified - every feature that compiles on amd64/arm64 is expected to compile identically on riscv64, contingent only on the dependency stack (GEOS, PROJ, GDAL, SFCGAL, protobuf-c, JSON-C) being available, which Debian sid and Ubuntu noble confirm is the case (Section 9).

| Aspect | Finding |
|---|---|
| Functional gaps (features unavailable on riscv64) | Data not available: no riscv64-specific functional gap was reported in any source searched (Debian BTS, GitHub, Gitea, Trac). No evidence exists either way for edge-case functions. |
| Performance gaps (delta from missing SIMD/vectorization) | Data not available: no PostGIS-specific riscv64 performance benchmark was found. [OpenBenchmarking.org](https://openbenchmarking.org/s/PostGIS) and [Phoronix](https://www.phoronix.com/search/PostGIS) were both blocked by Cloudflare bot challenges (HTTP 403), so existence of published benchmarks could not be ruled out, only confirmed as inaccessible. |
| Security hardening gaps | Data not available: no riscv64-specific hardening documentation, CVE, or advisory was found in any source. |
| NaN / floating-point semantics | Data not available: no report of riscv64-specific floating-point or NaN-handling discrepancy was found. Given the codebase performs no architecture-conditional arithmetic (Section 4), no mechanism for such a discrepancy was identified, but this was not empirically tested. |

## 7. CI/CD Infrastructure

**No riscv64 CI exists anywhere in PostGIS's own testing infrastructure.** This was confirmed by directly reading every CI configuration file the project uses:

- `.github/workflows/ci.yml`, `ci-freebsd.yml`, `ci-macos.yml`, `msys.yml` - ubuntu-latest/freebsd/macos/windows only, no riscv64.
- `.woodpecker/portability.yml` - an explicit multi-architecture matrix covering armhf/arm32v7 (QEMU), arm64/arm64v8 (QEMU), and s390x (QEMU). riscv64 is absent; the file's own comments note gaps for other architectures (e.g., no official Docker Hub Debian manifest for ppc) without ever mentioning riscv64.
- `.woodpecker/{regress,qa,garden,qa-expensive,mingw-wine,tools}.yml` - all pinned to `platform: linux/amd64`.
- `.gitlab/gitlab.com/ci.yml` and `.gitlab/inaf.it/ci.yml` - debian:bookworm/trixie amd64 + i386 only.
- Jenkins node list (`debbie.postgis.net/computer/api/json`) - nodes berrie (32-bit Raspberry Pi), berrie64 (64-bit Raspberry Pi), bessie, docker, reallie. No riscv64 worker.
- [PostGIS CI status dashboard](https://postgis.net/ci/status.json) - enumerates every active check across all providers (Jenkins Debbie/Berrie/Berrie64/Bessie/Winnie/Make Dist, Woodpecker, GitHub Actions Linux/FreeBSD/macOS/MSYS2/CodeQL/Codespell, GitLab mirror, INAF GitLab mirror, Cirrus CI [disabled]). No riscv64 entry among any provider.
- Full GitHub-mirrored repository tree (2437 paths) contains zero paths referencing "riscv".

An attempt to re-verify these files directly against the canonical OSGeo Gitea source (rather than the GitHub mirror) was blocked by Anubis bot-challenge (HTTP 403 via WebFetch, and a 200-status HTML challenge page rather than real content via curl). The verdict rests on GitHub-mirror content, which is consistent across every provider checked.

RISE runners are not involved: PostGIS is not a RISE member project (Section 1), and no RISE blog post, wheel-builder entry, or GitHub-org repository references PostGIS.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | Yes | No | No |
| Woodpecker (portability matrix, QEMU) | Yes | Yes (armhf, arm64v8) | No |
| Woodpecker (regress/qa/garden/etc.) | Yes | No | No |
| Jenkins | Yes | Yes (native Raspberry Pi hardware: berrie, berrie64) | No |
| GitLab CI | Yes | No | No |
| RISE-hosted runners | No | No | No |

## 8. Distribution and Release Status

**No official upstream riscv64 binaries exist.** PostGIS is source-distributed upstream; binaries come entirely from distro/OS packaging, and the official `docker-postgis` image README states support for amd64 only (Section 5).

Confirmed downstream binary availability, directly verified:

- **Debian sid**: `postgis` version `3.6.4+dfsg-2`, architecture riscv64, status **"Installed"**, built on buildd host `rv-osuosl-02`, section science. No failure flagged (unlike 11 other architectures - armhf, i386, alpha, hppa, hurd-amd64, hurd-i386, m68k, powerpc, ppc64, sh4, sparc64, x32 - which show `BD-Uninstallable`, mostly due to missing 64-bit-only build dependencies such as libsfcgal/boost-serialization requirements). Source: [Debian buildd status for postgis](https://buildd.debian.org/status/package.php?p=postgis).
- **Ubuntu 24.04 "noble"**: `postgis`, `postgresql-16-postgis-3`, `postgresql-postgis`, version `3.4.2+dfsg-1ubuntu3`, list architectures amd64, arm64, armhf, ppc64el, riscv64, s390x. Source: [Ubuntu Packages search](https://packages.ubuntu.com/search?keywords=PostGIS&suite=noble&searchon=names&section=all).

Unverified/retracted claim: an earlier pass reported an Arch Linux RISC-V package (`postgis-3.5.2-3-riscv64.pkg.tar.zst`), but a direct re-verification attempt against `archriscv.felixc.at` failed to locate any package-search endpoint or listing containing "postgis" (root page has no package table, `?q=postgis` returned no listing, `/packages` and `/riscv64/` returned HTTP 404). **This claim should not be treated as confirmed** - [NEEDS VERIFICATION, likely unsubstantiated].

The PyPI package named `postgis` ([PyPI JSON API](https://pypi.org/pypi/postgis/json)) is an unrelated pure-Python psycopg/asyncpg helper library, not the PostGIS database extension, and its build artifacts (`py3-none-any` wheel and sdist) carry no platform-specific signal - not applicable to native riscv64 extension availability.

**What a user must do to get a working riscv64 PostGIS binary today**: install it from Debian sid or Ubuntu 24.04+ package repositories, where riscv64 binaries are already published and confirmed installable. No upstream-provided binary, container image, or documented cross-compilation recipe exists as an alternative path; a user building outside these two distros must compile from source themselves, following the generic (non-riscv64-specific) `configure.ac` flags in Section 5.

## 9. Dependencies

| Dependency | Role | Min version required | riscv64 build (Debian sid/trixie) | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| PostgreSQL | Host database server | 14+ (12-18 per docs) | Built successfully (postgresql-17 17.10, trixie/sid) | Unverified | Released in trixie/sid | See [project-reports/postgresql.md](postgresql.md) |
| GEOS | Core 2D geometry/topology engine | 3.10.0 (configure.ac); docs cite 3.8.0 min, 3.12+ recommended | Built successfully (3.14.1-2+b1, sid) | Unverified | Released in sid | None found |
| PROJ | Coordinate reprojection (ST_Transform) | 6.1+ | Built successfully (9.8.1-1, sid) | Unverified | Released in sid | None found |
| LibXML2 | GML/KML parsing | 2.5.0+ | Built successfully (2.15.3+dfsg-1, sid) | Unverified | Released in sid | None found |
| JSON-C | GeoJSON parsing | 0.9+ | Built successfully (0.19+ds-1, sid) | Unverified | Released in sid | None found |
| GDAL | Raster support | 2.4.0 (configure.ac); README recommends 3+ | Built successfully (3.13.2+dfsg-1+b2, sid) | Unverified | Released in sid | Unrelated libpoppler162 rebuild note, not riscv64-specific |
| protobuf-c | Vector tile / Geobuf support (ST_AsMVT) | 1.1.0+ | Built successfully (1.5.1-1+b2, sid) | Unverified | Released in sid | None found |
| Protocol Buffers | Serialization used by protobuf-c toolchain | Not separately pinned | Built successfully (3.21.12-16, sid) | Unverified | Released in sid | Fails to build on alpha (unrelated arch). See [project-reports/protocol-buffers.md](protocol-buffers.md) |
| SFCGAL | Advanced 2D/3D analysis (optional) | 1.4.1+ (1.5.0+ recommended) | Built successfully (2.3.0-1, sid) | Unverified | Released in sid | Fails to build on alpha (unrelated arch) |
| PCRE2 | address-standardizer extension (optional) | Not version-pinned | Built successfully (10.46-1+b2, sid) | Unverified | Released in sid | None found |
| PostGIS itself | - | - | Built successfully (3.6.4+dfsg-2, sid) | Unverified | Released in trixie/sid | BD-Uninstallable on alpha only (unrelated arch) |

All required and optional build dependencies, and PostGIS itself, are built and installed for riscv64 in Debian sid/trixie as of the research check. No riscv64-specific blocking issue was found for any dependency. The one systematic caveat: **pass/fail of upstream regression test suites (`make check` / `installcheck`) specifically on riscv64 hardware was not confirmed for any package in this table** - Debian's buildd "Installed" status confirms the build+package step succeeded, but autopkgtest/regression results for riscv64 were not retrieved (attempts to fetch raw buildd logs past the dependency-installation phase returned truncated/empty content). None of GEOS, PROJ, GDAL, protobuf-c, or SFCGAL were deep-dived for SIMD/numerics-specific riscv64 issues in this pass; that would require dedicated per-dependency research beyond the scope of this report.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| NixOS/nixpkgs #424800 | postgresqlPackages.postgis: fix cross-compilation | Merged (2025-07-21) | Build-blocking for riscv64 cross-compilation via Nix | Fixed `--with-xml2config` flag propagation and disabled a `--with-json` check incompatible with cross-compilation |
| NixOS/nixpkgs #410550 | postgis: Fix RiscV cross-compilation | Closed, unmerged | N/A | Superseded/duplicate of #424800; diff touched unrelated files, likely a bad rebase |
| NixOS/nixpkgs #427129 | Backport of #424800 | Merged | N/A | Backported the riscv64 fix to release-25.05 |

No open correctness or performance issue specific to riscv64 was found in:
- The `postgis/postgis` GitHub mirror - issues/PRs are disabled upstream (`has_issues: false`); GitHub API search across issues, PRs, and commit messages for "riscv" returned zero hits.
- The Debian Bug Tracking System for the `postgis` source package: `bugs.debian.org` returned **"No reports found!"** for the entire package (any bug, not just riscv64-related) at time of check. Source: [Debian BTS for postgis](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=postgis).
- The OSGeo Gitea and Trac trackers - inaccessible (Anubis bot-challenge, HTTP 403) throughout this research, so this remains an unverified gap rather than a confirmed absence of tickets in those specific trackers.

No correctness bugs on riscv64 were identified in any accessible source. The only substantiated riscv64-related defect found anywhere is the resolved NixOS cross-compilation packaging bug above, which is not an upstream PostGIS defect.

## 12. Objections and Upstream Blockers

No stated PSC objection to riscv64 support was found. No technical blocker was identified - the codebase has no architecture-specific code to port, and the dependency stack already builds on riscv64 in Debian and Ubuntu. No organizational blocker (e.g., a policy requiring sponsor funding before adding an architecture) was found, though the absence of a formal tier policy document (Section 3) means this cannot be ruled out definitively; the OSGeo Gitea wiki and Trac, which might document such a policy, were inaccessible throughout this research (Anubis bot-challenge, HTTP 403).

**Acceptance probability if riscv64 CI were proposed**: Data not available for a direct estimate. Given (a) no architecture-specific code exists to review or maintain, (b) riscv64 already builds successfully via generic autoconf flags in two major distros, and (c) the project already runs a QEMU-based Woodpecker CI matrix for other secondary architectures (armhf, arm64, s390x) as precedent, the technical bar for adding a riscv64 CI job appears low. This is an inference based on observed project patterns, not a confirmed statement from the PSC - [NEEDS VERIFICATION].

## 13. Investment Analysis

RISE has not funded, sponsored, or performed any PostGIS-specific work: PostGIS is not a RISE member, has no RISE blog coverage, and is absent from the RISE wheel-builder list (also not applicable, since PostGIS is not distributed as a Python wheel). No existing RISE-funded work needs to be excluded from the sizing below.

### 13.1 Functional Enablement

No functional enablement work is required. PostGIS already builds, installs, and runs on riscv64 through generic portable C and its dependency stack (Debian sid, Ubuntu 24.04 confirm this). The only functional gap identified anywhere in this research is the now-resolved NixOS cross-compilation packaging bug (Section 11), which is already fixed upstream in nixpkgs.

### 13.2 Performance Optimization

No riscv64-specific SIMD/vectorization work applies, because PostGIS itself contains no SIMD code on any architecture (Section 4) - any vectorization opportunity would lie in its dependencies (GEOS, PROJ, SFCGAL), which are out of scope for this report. The immediate open need is **benchmarking**: no quantitative riscv64 vs. arm64/amd64 performance data exists for PostGIS anywhere that could be found (OpenBenchmarking.org and Phoronix were both inaccessible due to Cloudflare challenges, and no other source surfaced numbers).

### 13.3 CI/CD Infrastructure

This is the primary gap. No CI provider used by PostGIS (GitHub Actions, Woodpecker, Jenkins, GitLab) tests riscv64. Given the project already operates a QEMU-based multi-arch Woodpecker matrix (`portability.yml`) covering armhf, arm64, and s390x, adding riscv64 to that same matrix is the most direct, lowest-risk path to establishing upstream test coverage and would also validate the regression-test-on-riscv64 gap flagged throughout Section 9 and Section 11.

### 13.4 Ecosystem Enablement

Not applicable. Section 10 is omitted per the reporting criteria: PostGIS is a PostgreSQL database extension, not a package-manager-distributed library with a large dependent ecosystem (no npm/PyPI/Maven ecosystem of plugins depends on it in the way, for example, that Python packages depend on NumPy). Its dependency chain is covered in Section 9.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to Woodpecker `portability.yml` QEMU matrix (mirroring existing armhf/arm64/s390x jobs) | 1-2 | Not assigned | High |
| CI/CD | Add native or QEMU riscv64 job to `regress.yml`/`qa.yml` (regression-test verification, currently entirely unverified per Section 9) | 1-2 | Not assigned | High |
| Functional | None required (no arch-specific code, builds already succeed on riscv64 in Debian/Ubuntu) | 0 | N/A | N/A |
| Performance | Run and publish riscv64 vs. arm64/amd64 PostGIS benchmark (no existing data found) | 1 | Not assigned | Medium |
| Distribution | Publish an official riscv64 `docker-postgis` image variant (currently amd64-only per README) | 1-2 | Not assigned | Medium |
| Governance | Confirm/establish a documented architecture-support tier that explicitly includes riscv64 (none exists today) | 0.5 | Not assigned | Low |

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [PostGIS Credits (manual-dev)](https://postgis.net/docs/manual-dev/postgis_credits.html)
- [PostGIS Introduction (manual-dev)](https://postgis.net/docs/manual-dev/postgis_introduction.html)
- [PostGIS homepage](https://postgis.net/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [postgis/postgis GitHub mirror](https://github.com/postgis/postgis)
- [postgis/postgis configure.ac (raw)](https://raw.githubusercontent.com/postgis/postgis/master/configure.ac)
- [macros/host-cpu-c-abi.m4](https://github.com/postgis/postgis/blob/master/macros/host-cpu-c-abi.m4)
- [postgis/docker-postgis repository](https://github.com/postgis/docker-postgis)
- [docker-postgis Alpine Dockerfile (18-3.6)](https://raw.githubusercontent.com/postgis/docker-postgis/master/18-3.6/alpine/Dockerfile)
- [PostGIS CI status dashboard](https://postgis.net/ci/status.json)
- [Debian buildd status for postgis](https://buildd.debian.org/status/package.php?p=postgis)
- [Debian package tracker for postgis](https://tracker.debian.org/pkg/postgis)
- [Debian Bug Tracking System for postgis](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=postgis)
- [sources.debian.org debian/rules](https://sources.debian.org/src/postgis/3.6.4+dfsg-2/debian/rules/)
- [sources.debian.org debian/control](https://sources.debian.org/src/postgis/3.6.4+dfsg-2/debian/control/)
- [Ubuntu Packages search (noble)](https://packages.ubuntu.com/search?keywords=PostGIS&suite=noble&searchon=names&section=all)
- [PyPI postgis package JSON API](https://pypi.org/pypi/postgis/json)
- [Arch Linux RISC-V package listing](https://archriscv.felixc.at/) (queried, no postgis listing found - claim retracted)
- [NixOS/nixpkgs PR #424800](https://github.com/NixOS/nixpkgs/pull/424800)
- [NixOS/nixpkgs PR #410550](https://github.com/NixOS/nixpkgs/pull/410550)
- [NixOS/nixpkgs PR #427129](https://github.com/NixOS/nixpkgs/pull/427129)
- [OpenBenchmarking.org PostGIS search](https://openbenchmarking.org/s/PostGIS) (inaccessible, Cloudflare challenge)
- [Phoronix PostGIS search](https://www.phoronix.com/search/PostGIS) (inaccessible, Cloudflare challenge)
- gitea.osgeo.org/postgis/postgis (canonical source repository; inaccessible throughout research, Anubis bot-challenge HTTP 403)
- trac.osgeo.org/postgis (issue tracker; inaccessible throughout research, Anubis bot-challenge HTTP 403)
- [project-reports/postgresql.md](postgresql.md) (existing status report, PostgreSQL dependency)
- [project-reports/protocol-buffers.md](protocol-buffers.md) (existing status report, Protocol Buffers dependency)