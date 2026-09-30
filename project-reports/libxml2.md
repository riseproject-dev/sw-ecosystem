---
title: libxml2
parent: Project Reports
color: yellow
dependencies:
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: libiconv
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libxml2" %}

# libxml2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libxml2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libxml2 is a C XML parsing and manipulation library implementing XML 1.0, HTML 4/5 parsing, XPath 1.0, XPointer, XInclude, XML Schemas, and RelaxNG. It is the de facto XML library on Linux and macOS, consumed by GNOME, Python (via the separate `lxml` package), PHP, Ruby (via `nokogiri`), and a very large number of downstream projects. The codebase is portable ANSI C with no architecture-specific SIMD, inline assembly, or JIT components; a full repository tree inspection found no `arch/`, `simd/`, `x86/`, `arm/`, or `riscv/` directories, and GitHub code search for `riscv`, `simd`, and `extension:S` against the repository each returned zero results.

**Governance:** libxml2 is hosted on GNOME's GitLab instance at [gitlab.gnome.org/GNOME/libxml2](https://gitlab.gnome.org/GNOME/libxml2) but is not GNOME-Foundation-governed; it is an independent, informally run volunteer project that merely uses GNOME's infrastructure. There is no foundation, no steering committee, no charter, and no platform support tier policy. Leadership has passed maintainer-to-maintainer:

- Daniel Veillard - original author, historically at Red Hat.
- Nick Wellnhofer (nwellnhof) - de facto sole maintainer from roughly 2013/2015 until he announced stepping down on 2025-09-15, citing unpaid-volunteer burden. He briefly stepped back in 2021 over funding and resumed in 2022 after a one-time Google donation.
- Ivan Chavero and Daniel Garcia Moreno - took over as co-maintainers as of 2025-12-09. Neither appears to be corporately assigned to this work: Chavero uses a personal email address, and Garcia Moreno's day job (Endless OS) is unrelated to libxml2 maintenance. This is presently unpaid volunteer labor. (The existing project record for this report previously described Daniel Garcia as SUSE-employed; the governance research conducted for this report found his day job to be at Endless OS instead - the SUSE attribution could not be reconfirmed and should be treated as superseded.)

**License:** MIT (a common misconception is LGPL; the repository's `Copyright` file confirms standard MIT text).

**Corporate sponsorship:** Despite underpinning products at Apple, Google, Microsoft, and effectively every Linux distribution, libxml2 receives minimal corporate funding - lifetime Open Collective funding is approximately $11,000-17,000, dominated by a single one-time $10,000 Google gift in 2022. Wellnhofer publicly criticized this as "irresponsible" corporate freeloading, a story picked up by [Phoronix](https://www.phoronix.com/news/Libxml2-No-Maintainer), [LWN](https://lwn.net/Articles/1025971/), [BigGo](https://biggo.com/news/202506270132_libxml2-rejects-security-embargoes), and [Hackaday](https://hackaday.com/2025/12/23/libxml2-narrowly-avoids-becoming-unmaintained/). In 2025 Wellnhofer announced libxml2 would no longer honor embargoed CVE disclosure, and has since started a commercial fork, "libxml2-ee" (Enterprise Edition), re-licensed under AGPL, as a monetization response.

**Community stance on new ports:** The repository's README states, verbatim: "The main rule is to be kind. Do not pressure developers to fix a CVE or to work on a functionality that you need, because that won't work. This is a community project, developers will work on the issues that they consider interesting and when they want. All contributions are welcome, so if something is important for you, you can always get involved, implement it yourself and be part of the open source community." In practice this means new-platform support is welcome as a contribution but is the requester's responsibility to implement; maintainers will not prioritize it. [NEEDS VERIFICATION: an explicit "no AI/LLM-generated contributions" policy was noted in an earlier version of this project's tracking but could not be reconfirmed in this round of research.]

**RISE Project involvement:** No RISE Project involvement with libxml2 was found. All checked channels - the RISE blog (35 posts, 2024-05-15 through 2026-09-28, checked via sitemap and RSS), the [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (~65 packages, libxml2 absent), the [RISE member list](https://riseproject.dev/members) (Premier and General members, GNOME/libxml2 not among them), and GitHub search of `riseproject-dev` repositories - show zero dedicated involvement. The sole hit across all searches is an incidental mention in `riseproject-dev/python-wheels` PR #2403, which lists libxml2 as a pre-existing distro-supplied transitive build dependency for the `lalsuite` Python wheel, not a RISE-authored libxml2 port or patch.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 1998 [NEEDS VERIFICATION] | libxml2 created by Daniel Veillard in portable C; no architecture-specific code from the start | Project history context |
| Undated | Debian, Gentoo, and Arch (AUR: `android-riscv64-libxml2`) build libxml2 for riscv64 without any upstream patch, via generic C portability | [GNOME GitLab governance research](https://gitlab.gnome.org/GNOME/libxml2) |
| 2023-05-18 | Alpine Linux built `libxml2-utils 2.11.4-r0` for riscv64 (edge, predating Alpine's 3.20 stable riscv64 port) | [Alpine Linux package index](https://pkgs.alpinelinux.org/package/edge/main/riscv64/libxml2-static) |
| 2025-05-03 | GNOME/librsvg#1168 opened: SVG reference tests fail with libxml2 2.14.2 specifically on riscv64 | [GitLab issue librsvg#1168](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168) |
| 2025-05-04 to 2025-05-07 | GNOME/libxml2#904 (cross-posted duplicate of librsvg#1168) opened and closed as not-a-libxml2-bug | [GitLab issue libxml2#904](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904) |
| 2025-09-15 | Nick Wellnhofer announces stepping down as maintainer | [GNOME Discourse thread](https://discourse.gnome.org/t/stepping-down-as-libxml2-maintainer/31398) |
| 2025-12-09 | Ivan Chavero and Daniel Garcia Moreno become co-maintainers | Governance research (Phoronix, Hackaday coverage) |
| 2026-01-08 to 2026-01-13 | GNOME/libxml2#1032 (testlimits timeout under qemu-riscv64) opened and closed by merge of !375 | [GitLab issue #1032](https://gitlab.gnome.org/GNOME/libxml2/-/issues/1032), [MR !375](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/375) |
| 2026-03-03 | v2.15.2 released, first release to ship the !375 `testlimits -timeout` fix | Release-tag diff verification against GitLab API |
| 2026-03-15 to 2026-03-16 | MR !399 merged (tangential `int`->`clock_t` fix in the same `testlimits.c` timeout code) | [MR !399](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/399) |
| 2026-04-15 | v2.15.3 released, ships !399 | Release-tag diff verification |

There is no "first RISC-V commit" in libxml2's history: `git log --all -i --grep="riscv"` returns zero commits, and `git grep -i riscv` across `HEAD` returns zero matches in any tracked file. The library compiled on riscv64 the first time a RISC-V toolchain was pointed at it, with no source modification required. The only person who has filed a riscv64-specific issue against libxml2 is Levi Zim (kxxt, Arch Linux RISC-V packager, issue #904); Trevor Gamblin (BayLibre, Yocto Project RISC-V maintainer) filed and got merged the one riscv64-adjacent CI/tooling improvement (#1032/!375). Neither contribution constitutes a "port" in any technical sense - both are test-harness ergonomics, not code enabling riscv64 execution.

## 3. Upstream Support Tier

libxml2 has no formal tier policy. No README, MAINTAINERS file, CI configuration, or discussion thread defines a Tier-1/2/3 or supported-architecture classification. Given the project's minimal volunteer governance and lack of even a riscv64 CI runner, this absence is consistent with its overall capacity.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Yes (all 29 GitLab CI jobs) | No | No |
| Release-blocking tests | Yes | No | No |
| Official upstream binaries | No (source tarballs only) | No | No |
| Distro binary packages | Yes (primary archive) | Yes (primary archive) | Yes (Ubuntu: ports pocket) |
| Distro build status (Ubuntu 26.04) | Current, security-patched | Current, security-patched | Current, ports pocket |

amd64 is the only architecture with any upstream CI. arm64 and riscv64 sit in the same position relative to upstream: both are validated exclusively through downstream distribution builds, with zero upstream project involvement.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libxml2 has no architecture-specific subsystems. The complete source tree contains no `arch/`, `simd/`, `x86/`, `arm/`, or `riscv/` directories; the only non-portable directory is `win32/`, which holds Windows DLL export definitions (an OS-level, not CPU-level, distinction). This was confirmed via direct repository tree inspection and GitHub code search (`repo:GNOME/libxml2 riscv` -> 0 results; `repo:GNOME/libxml2 simd OR __ARM_NEON OR __SSE2__ OR __AVX2__` -> 0 results; `extension:S repo:GNOME/libxml2` -> 0 results). Earlier "simd" text matches in the codebase are false positives from the HTML entity name `&simdot;`, not SIMD code.

| Architecture | Dedicated source files | SIMD intrinsics | Arch-guarded code paths |
|---|---|---|---|
| x86 / x86_64 | 0 | 0 | 0 |
| AArch64 / ARM | 0 | 0 | 0 |
| riscv64 | 0 | 0 | 0 |

The only architecture-sensitive items anywhere in the codebase [NEEDS VERIFICATION, single-source]: `configure.ac` applies a `-mieee` compiler flag on Alpha (`alpha*`) for IEEE float handling, and a preprocessor limit flag on HP-UX (`hppa*`); `parser.c` has a z/OS EBCDIC `#pragma convert` block; `encoding.c` does portable runtime endianness detection with no arch guards. None of these touch riscv64.

**Component quality matrix:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| XML parsing core | scalar C | scalar C | scalar C |
| String operations | scalar C | scalar C | scalar C |
| Encoding/conversion | scalar C | scalar C | scalar C |
| Hash / dict | scalar C | scalar C | scalar C |
| XPath / XPointer | scalar C | scalar C | scalar C |
| XSD / RelaxNG | scalar C | scalar C | scalar C |

riscv64 is not disadvantaged relative to amd64 or arm64 because no architecture receives SIMD or hand-tuned code in the open-source library; the scalar C implementation is the only implementation, for every architecture. Consequently the "full/partial/scalar/missing" rubric used elsewhere in this report series does not meaningfully apply to libxml2: there is no fuller riscv64-adjacent implementation elsewhere in the project that riscv64 falls short of. Wellnhofer's commercial libxml2-ee fork reportedly adds SIMD acceleration and security hardening, but this is not upstreamed and not available in the open-source library under review here [NEEDS VERIFICATION - fork contents not independently inspected].

## 5. Build System, Cross-Compilation, and Toolchain

libxml2 supports GNU Autotools, CMake, and Meson, producing equivalent binaries; the README describes CMake support as "mainly for Windows." No riscv64-specific toolchain file, Dockerfile, or cross-compilation guide exists anywhere in the repository - a direct grep of README.md, configure.ac, CMakeLists.txt, meson.build, meson_options.txt, .gitlab-ci.yml, and both `.gitlab-ci/Dockerfile*` files for `riscv`, `qemu`, `aarch`, `arm`, and `cross` returned zero matches in every file.

**Generic build commands (architecture-neutral; these are all that upstream documents):**

Autotools:
```
./autogen.sh [options]   # from git checkout
./configure [options]     # from tarball
make
make check
make install
```

CMake:
```
cmake -S libxml2-xxx -B builddir [options]
cmake --build builddir
ctest --test-dir builddir
cmake --install builddir
```

Meson:
```
meson setup [options] builddir
ninja -C builddir
meson test -C builddir
ninja -C builddir install
```

**Toolchain requirements:** `configure.ac` requires Autotools `AC_PREREQ([2.63])`; `CMakeLists.txt` requires `cmake_minimum_required(VERSION 3.18)` and sets `CMAKE_C_STANDARD 11`; `meson.build` requires Meson `>= 0.61`. The README states "Besides build system tools, only a C compiler should be required" and that code must conform to C89 for contributions. No riscv64-specific compiler minimum is documented anywhere, and none is needed since no architecture-conditional code exists to require one.

**QEMU:** No CI job, script, or documentation anywhere in the repository references QEMU, cross-compilation, or emulation. The only documented riscv64/QEMU interaction is downstream: the Yocto Project runs libxml2's `testlimits` test under `qemuriscv64` in its own Autobuilder CI (external to libxml2), which surfaced the timeout addressed by issue #1032/MR !375.

**CI build images:** Both of libxml2's Dockerfiles (`.gitlab-ci/Dockerfile`, based on `ubuntu:26.04`, and `.gitlab-ci/Dockerfile.docs`, based on `archlinux:base-devel`) build only x86_64 toolchains and dependencies; neither references riscv64.

**Known build failures:** None documented for riscv64 in any upstream source.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None found. libxml2 has no architecture-conditional feature flags; every XML feature (XPath, XPointer, XSD, RelaxNG, HTML parsing, catalogs, namespace handling) compiles and runs identically on riscv64, amd64, and arm64.

**Performance gaps:** libxml2 has no SIMD acceleration on any architecture in the open-source library, so there is no architecture-specific performance delta attributable to the library's own code; any riscv64-vs-amd64/arm64 performance difference is purely a function of microarchitecture, not libxml2. No riscv64-specific benchmark data was locatable through GitHub, web search, or the RISE blog in this research round. A generic Phoronix Test Suite profile (`pts/system-libxml2`, timing a libxml2 build) is indexed on openbenchmarking.org but could not be retrieved - the site returned a Cloudflare bot-check (HTTP 403) to both WebFetch and curl, and web.archive.org is blocked by this environment's egress policy; this is a real, unexploited data source worth revisiting with different tooling. [NEEDS VERIFICATION, single-source from prior tracking, unconfirmed this round] MR !95 (closed without merging, 2020-12-29) reportedly measured `xmlStrlen` at 9.91x-30.32x slower than glibc `strlen` on x86_64, with an unmerged patch showing ~12% end-to-end parsing speedup; this data could not be reconfirmed in this research pass and has no riscv64 dimension in any case.

**Security hardening gaps:** None specific to riscv64. Clang ASan/MSan CI runs only on x86_64 in upstream CI; the same gap applies equally to arm64, so riscv64 is not singled out.

**Floating-point / NaN semantics:** RISC-V mandates IEEE 754 compliance. No libxml2-level floating-point issue specific to riscv64 is documented in any source checked.

## 7. CI/CD Infrastructure

**libxml2 has no riscv64 CI of any kind, and no GitHub Actions CI at all.** This was verified by direct byte-for-byte comparison of `.gitlab-ci.yml` fetched from both the canonical GitLab source (`gitlab.gnome.org/GNOME/libxml2/-/raw/master/.gitlab-ci.yml`) and the GitHub mirror (`raw.githubusercontent.com/GNOME/libxml2/master/.gitlab-ci.yml`): both are identical, containing 26-29 jobs (counts differ slightly between two independent passes due to how sub-jobs were enumerated; both confirm the same job set) covering gcc variants (c89, minimum, medium, legacy, static), clang:asan/msan, MinGW (w64-x86_64, i686), CMake (Linux gcc/clang, MinGW, MSVC v141 x64/x86), Meson, `dist`, `pages`, and three downstream integration jobs (lxml, Nokogiri, php). The strings "riscv64", "riscv", "RISC-V", "arm", "aarch64", "ppc64", and "s390x" are absent from the file entirely - not merely absent as CI targets. `.github/workflows` returns HTTP 404, confirming no GitHub Actions workflows exist.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI jobs | Yes (all jobs) | No | No |
| RISE CI runners | No | No | No |
| Hardware runners | Yes (GitLab.com shared) | No | No |
| Release-blocking | Yes | No | No |

riscv64 CI coverage is identical to arm64: zero. What should not be mistaken for riscv64 CI: (1) Ubuntu/Debian/Alpine/Arch shipping riscv64 binary packages is downstream distro infrastructure, not libxml2 CI; (2) issue #1032/MR !375 (the `testlimits -timeout` flag) reflects a Yocto maintainer running tests under riscv64 QEMU emulation on Yocto's own Autobuilder infrastructure, and a merged patch enabling that - it does not add a riscv64 job to libxml2's own `.gitlab-ci.yml`, which still has none as of master; (3) issues #904 and librsvg#1168 are evidence that riscv64 hardware/emulation is used by third parties who hit a regression, not evidence that libxml2 runs riscv64 in its own CI.

## 8. Distribution and Release Status

libxml2 upstream publishes source tarballs only, at [download.gnome.org/sources/libxml2](https://download.gnome.org/sources/libxml2/); there are no official upstream binaries for any architecture.

**riscv64 binary package status (primary verified source: Ubuntu 26.04 "resolute"):**

| Distribution | Packages | Version | Status | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 (resolute) | `libxml2-16`, `libxml2-dev`, `libxml2-doc`, `libxml2-source`, `libxml2-utils`, `python3-libxml2` | 2.15.2+dfsg-0.1 | Available, ports pocket | Same version as armhf, ppc64el, s390x; amd64/arm64/i386 get a separately patched `2.15.2+dfsg-0.1ubuntu0.2` via the primary/security archive. No riscv64-specific packaging patches found. |
| Debian, Gentoo, Arch (generic) | libxml2 and related packages | Not independently re-verified this session | Available | Built via generic C portability, not a libxml2-authored port (governance research) |
| Alpine Linux | `libxml2-utils` | 2.11.4-r0 (as of 2023-05-18, edge) | Available | Predates Alpine 3.20 stable riscv64 port (2024) |

The Ubuntu riscv64 packages live in the secondary "ports" pocket rather than the primary/security archive used by amd64/arm64/i386, meaning weaker QA and update guarantees than primary-archive architectures - this is the basis for the "clean-distro-build" sub-classification discussed in Section 13. Users get a working riscv64 binary simply via `apt install libxml2-dev` on Ubuntu/Debian riscv64, or the equivalent for their distribution; no source build is required.

**PyPI:** No package named `libxml2` exists on PyPI - confirmed via `pypi.org/pypi/libxml2/json` (HTTP 404), `pypi.org/simple/libxml2/` (HTTP 404), and `pypi.org/pypi/libxml2-python3/json` (HTTP 404). The RISE wheel-builder mirror redirects to the same nonexistent PyPI path. Python bindings to libxml2 are distributed either as distro packages (`python3-libxml2`) or via the separate `lxml` project, which does publish its own riscv64 wheels on PyPI and is listed as built for riscv64 on the [RISE wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/). [NEEDS VERIFICATION, single-source, unconfirmed this round] An earlier tracking pass counted 14 riscv64 `lxml` wheels across CPython 3.9-3.14 on manylinux/musllinux; this exact count was not reconfirmed in this research pass.

## 9. Dependencies

| Dependency | Role | riscv64 build status | riscv64 test status | riscv64 release status | Notes |
|---|---|---|---|---|---|
| zlib | Runtime dependency (optional) - gzip-compressed XML stream I/O, enabled by default | Not independently queried this session (project-graph server connection failed) | Not queried | Ubuntu 26.04 ships riscv64 zlib packages generally, consistent with libxml2's own riscv64 availability | Also independently tracked: see `project-reports/zlib.md` |
| zlib-ng | Runtime dependency (optional) - drop-in zlib replacement, can be linked in place of zlib | Not independently queried this session | Not queried | Not separately confirmed for riscv64 this session | [NEEDS VERIFICATION, single-source] zlib-ng implements RVV (RISC-V Vector) acceleration for hash/inflate; on Linux kernels older than 6.5, unsafe `hwcap` detection at this code path has been reported to risk SIGILL crashes on hardware without RVV. This is a zlib-ng concern, not a libxml2 defect - libxml2 simply links whichever zlib-compatible implementation the system provides. Deployments using standard zlib are unaffected. |
| ICU | Runtime dependency (optional) - alternate/extended Unicode encoding engine, disabled by default in libxml2's build (`meson_options.txt`: `feature('icu')` defaults to `disabled`) | Not independently queried this session | Not queried | Also independently tracked: see `project-reports/icu.md` | ICU has no RISC-V-specific SIMD code found in this research; a generic C library from libxml2's perspective |
| libiconv | Runtime dependency (optional) - character-encoding conversion; on by default (`want_iconv`); glibc provides it built-in on Linux, musl/BSD need a standalone `libiconv` | Not independently queried this session | Not queried | Part of glibc on Linux riscv64, generally available | No standalone Ubuntu package for this on glibc-based systems (bundled in libc6) |
| readline | Runtime dependency (optional) - interactive `xmllint --shell` line editing; off by default (`with_readline` empty) | Not independently queried this session | Not queried | Also independently tracked: see `project-reports/readline.md` | Not required for typical library use, only for the interactive shell mode of the `xmllint` tool |
| Python | Build dependency (optional) - `libxml2-python` bindings; enabled in GNOME's own CI baseline config (`BASE_CONFIG: "--with-http --with-schematron --with-zlib --with-python"`) | Not independently queried this session | Not queried | Also independently tracked: see `project-reports/python.md`; `python3-libxml2` ships for riscv64 in Ubuntu 26.04 resolute at 2.15.2+dfsg-0.1 | Confirms the Python-bindings build path itself works on riscv64 at the distro level |

A dedicated dependency-graph query (`project-graph` MCP server) to independently verify each dependency's riscv64 build/test/release status against Ubuntu 26.04 failed to connect this session (`CONNECTION_CLOSED`); this is a tool-availability gap, not evidence of absence, and should be re-run once the server is reachable. Build-file inspection of `configure.ac`, `meson.build`, and `meson_options.txt` confirms current libxml2 (master) has **no liblzma dependency** - this is not present in the current build system, contrary to what older libxml2 2.9.x-era assumptions might suggest.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|---|---|---|---|---|
| [librsvg#1168](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168) | SVG reference tests failing with libxml2 2.14.2 on riscv64 | Open since 2025-05-03, stalled since 2025-06-13 awaiting reporter follow-up | Test-correctness regression, cross-project | 28 `reference` tests + 1 `primitives` test fail only on riscv64 with libxml2 2.14.2 (fine on x86_64, fine on riscv64 with 2.13.8). The reporter's working theory (a stale `libpixbufloader_svg.so` left over from the libxml2 SONAME bump 2->16) was disputed by the librsvg maintainer, who noted librsvg 2.60 does not use gdk-pixbuf for its own test SVGs and suspects the `image` crate's raster/AVIF decoding instead. Root cause remains unconfirmed; no fix exists. |
| [libxml2#904](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904) | libxml2 2.14.2 breaks librsvg tests specifically on riscv64 | Closed 2025-05-07 (opened 2025-05-04) | Duplicate/cross-post of librsvg#1168 | Closed by the reporter's own comment: "After a closer investigation, I think this is a bug in librsvg instead of libxml2." No libxml2 code fix was made or needed. |
| [libxml2#1032](https://gitlab.gnome.org/GNOME/libxml2/-/issues/1032) | Extending timeout for testlimits | Closed 2026-01-13 (opened 2026-01-08), fixed by merged [MR !375](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/375) | Enhancement, CI/tooling | Yocto Project's `testlimits` test (deliberately RAM/CPU-heavy) intermittently timed out under `qemuriscv64` emulation on loaded Autobuilder hosts, due to a hardcoded 2-second default timeout. Fixed by an optional `-timeout` CLI flag, default unchanged. Shipped in v2.15.2. |
| [MR !399](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/399) | test: fix mismatched signed/unsigned comparison (fixes #1079) | Merged 2026-03-16 | Tangential bugfix | Not riscv64-specific, but changes the same `max_time` variable !375 introduced (`int` -> `clock_t` to avoid negative timeout values), directly touching the code path riscv64/QEMU users depend on for `testlimits`. Shipped in v2.15.3. |

**Discrepancy note:** An earlier version of this project's tracking referenced an open issue "#971" describing a double-checked-locking / weak-memory-model thread-safety problem in catalog code, framed as directly affecting riscv64. This research round searched the GNOME/libxml2 tracker explicitly for "riscv", "risc-v", "rv64", and "RISCV" as of 2026-09-30 and found no such open riscv64-tagged issue remaining, and no independent confirmation of #971's content could be obtained this round. This claim should be treated as unconfirmed and not relied upon without direct re-verification against the live tracker.

No other riscv64/RISC-V-tagged issues exist in the GNOME/libxml2 tracker as of 2026-09-30. One superficially matching hit, issue #214 ("SIGBUS in xmlmemory.c"), is a false positive - it matched only because the reporter's email signature lists "RISC-V/SPARC/PPC/ARM/CISC"; the actual bug was reproduced on a SPARC system (Oracle/Fujitsu M8000), not RISC-V, and is excluded here.

## 12. Objections and Upstream Blockers

No upstream objections to riscv64 support are documented anywhere. The project has no acceptance barrier for new architectures because it makes no architecture-specific commitments in the first place.

**Practical blockers:**

1. **No upstream riscv64 CI.** The project does not gate releases on any riscv64 test results (Section 7). A regression would only be caught by downstream distribution build/test infrastructure, potentially with a lag - this is the mechanism by which the librsvg#1168 regression was first surfaced, by a distro packager (Arch Linux RISC-V), not by upstream.
2. **No open PR or issue proposes adding a riscv64 CI job to `.gitlab-ci.yml`.** No such proposal was found in this or prior research rounds.
3. **No SIMD path for riscv64 (or any architecture) in the open-source library.** Because libxml2's value proposition is XML spec compliance and feature completeness rather than performance leadership, this is not treated by the project as a gap requiring closure (see Section 13).
4. **Maintainer capacity is thin and newly transitioned.** Two volunteer co-maintainers took over in December 2025 after the prior maintainer's announced departure; neither has RISC-V hardware access noted anywhere in the research, and the prior maintainer explicitly stated in the librsvg#1168/libxml2#904 thread that he had no access to a RISC-V machine to debug the regression himself.
5. **librsvg#1168 remains open and unresolved** as of 2026-09-30, over a year after being filed, stalled on reporter follow-up since 2025-06-13. It is not clear this will ever land as a libxml2-side fix, since the current diagnostic direction points at librsvg's `image` crate rather than libxml2.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** libxml2's own GitLab CI (`.gitlab-ci.yml`, verified byte-for-byte via both the canonical GitLab raw file and the GitHub mirror) runs 26-29 jobs covering only x86_64/i686/Win32 (gcc/clang variants, MinGW, MSVC, CMake, Meson, downstream lxml/nokogiri/php) with zero riscv64 references and no GitHub Actions workflows at all - so there is no upstream riscv64 CI (build or test). The distribution floor applies: Ubuntu 26.04 (resolute) builds and ships `libxml2-16`, `libxml2-dev`, `libxml2-utils`, `python3-libxml2` for riscv64 at the same version (2.15.2+dfsg-0.1) as its other ports architectures (armhf, ppc64el, s390x), via the ports pocket, with no evidence of riscv64-specific packaging patches (see [Ubuntu package search](https://packages.ubuntu.com/search?keywords=libxml2&suite=resolute&searchon=names&section=all)) - i.e., a clean build from unmodified upstream source, matching the "clean-distro-build" sub-type and capping the color at yellow. libxml2 is not an optimization-purpose project - its value proposition is XML spec compliance and feature completeness, not out-performing a reference implementation via SIMD or architecture-specific code - so no optimization-level modifier applies here.

**Pending work that could change the grade:** GNOME/librsvg#1168 remains open and unresolved as of 2026-09-30, though the paired libxml2-side issue #904 was closed as not-a-libxml2-bug and the librsvg maintainer disputes the reporter's libxml2-SONAME theory - this is unlikely to change libxml2's own grade, since the defect (if any) is attributed to librsvg or a dependent Rust crate, not libxml2. The merged MRs !375 (`testlimits -timeout` flag for qemu-riscv64, shipped in v2.15.2) and !399 (related signed/unsigned fix, shipped in v2.15.3) improve riscv64/QEMU test-under-emulation ergonomics but do not add upstream riscv64 CI. No RISE Project involvement with libxml2 was found (not in the RISE blog, wheel builder, or member list), and no open PR or issue proposes adding a riscv64 CI job to `.gitlab-ci.yml`. Absent such a CI job, the grade has no near-term path upward beyond yellow.

## 14. Investment Analysis

RISE has no documented involvement with libxml2 (Section 1), so none of the items below are already covered by RISE funding or effort.

### 14.1 Functional Enablement

libxml2 is functionally complete on riscv64: no functional gap was identified in this research (Section 6). No functional enablement work is needed for the library itself. The one open cross-project item, librsvg#1168, is not clearly a libxml2 defect and any fix, if one is needed, likely belongs in librsvg or its `image` crate dependency rather than in libxml2.

### 14.2 Performance Optimization

Not applicable in the sense of closing an architecture-specific gap: libxml2 has no SIMD implementation for any architecture in the open-source codebase, so riscv64 is not disadvantaged relative to amd64 or arm64 (Section 4). Because libxml2 is not an optimization-purpose project, investing in RVV-accelerated parsing/tokenization would be a novel feature contribution rather than gap-closing work, and would require upstream buy-in from two newly-transitioned volunteer maintainers with a documented "implement it yourself" contribution stance and no evident RISC-V hardware access. No riscv64-specific benchmark data exists to size or justify such work; a first step would be benchmarking, not implementation.

### 14.3 CI/CD Infrastructure

The only concrete, low-risk investment identified is adding a riscv64 job to libxml2's existing `.gitlab-ci.yml`, mirroring the existing x86_64 gcc job. This would require a self-hosted GitLab CI runner on riscv64 hardware (or QEMU-emulated) and upstream coordination with the current maintainers, who have shown themselves receptive to well-scoped, low-friction contributions (e.g., !375, merged within about 17 hours of submission).

### 14.4 Ecosystem Enablement

Not applicable as a distinct investment area: libxml2 is a system library with a downstream-consumer relationship to `lxml`, `nokogiri`, `php`, etc., but has no dependent package ecosystem of its own that requires separate riscv64 enablement (Section 10 omitted; see rule basis in report template). Section 9's dependency table is the relevant enablement surface, and its riscv64 build/test/release status could not be independently confirmed this session due to a `project-graph` connection failure - re-running that verification is a prerequisite before sizing any dependency-side work.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 job to `.gitlab-ci.yml` (self-hosted runner + upstream MR) | 2-3 | Infrastructure engineer + upstream coordination | Medium |
| Verification | Re-run `project-graph` dependency queries for zlib, zlib-ng, ICU, libiconv, readline, Python against Ubuntu 26.04 riscv64 once the MCP server reconnects | 0.5 | Any engineer with tool access | High (blocks confident Section 9 conclusions) |
| Cross-project | Monitor/assist librsvg#1168 diagnosis (likely not a libxml2-side fix, but bears on riscv64 XML-adjacent rendering correctness) | 1 (monitoring) | RISC-V ecosystem engineer | Low |
| Performance | Benchmark libxml2 parsing throughput on riscv64 vs arm64/amd64 (no existing data found) | 1 | Performance engineer | Low (not an optimization-purpose project) |

## 15. References

- [libxml2 GitLab upstream](https://gitlab.gnome.org/GNOME/libxml2)
- [libxml2 GitHub mirror](https://github.com/GNOME/libxml2)
- [libxml2 source releases](https://download.gnome.org/sources/libxml2/)
- [libxml2 .gitlab-ci.yml](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/.gitlab-ci.yml)
- [libxml2 .gitlab-ci.yml, GitHub mirror raw](https://raw.githubusercontent.com/GNOME/libxml2/master/.gitlab-ci.yml)
- [libxml2 CMakeLists.txt](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/CMakeLists.txt)
- [libxml2 meson.build](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/meson.build)
- [libxml2 configure.ac](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/configure.ac)
- [GitLab issue libxml2#904 - 2.14.2 breaks librsvg tests on riscv64](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904)
- [GitLab issue librsvg#1168 - SVG reference tests failing with libxml2 2.14.2 on riscv64](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168)
- [GitLab issue libxml2#1032 - Extending timeout for testlimits](https://gitlab.gnome.org/GNOME/libxml2/-/issues/1032)
- [GitLab MR libxml2!375 - testlimits: optionally accept '-timeout' input](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/375)
- [GitLab MR libxml2!399 - test: fix mismatched signed/unsigned comparison](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/399)
- [Ubuntu 26.04 (resolute) libxml2 package search](https://packages.ubuntu.com/search?keywords=libxml2&suite=resolute&searchon=names&section=all)
- [Alpine Linux libxml2-static riscv64 package](https://pkgs.alpinelinux.org/package/edge/main/riscv64/libxml2-static)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project member list](https://riseproject.dev/members)
- [riseproject-dev/python-wheels PR #2403 (lalsuite riscv64 wheel, incidental libxml2 distro-dependency mention)](https://github.com/riseproject-dev/python-wheels/pull/2403)
- [GNOME Discourse - Nick Wellnhofer stepping down as libxml2 maintainer](https://discourse.gnome.org/t/stepping-down-as-libxml2-maintainer/31398)
- [Phoronix - Libxml2 No Maintainer](https://www.phoronix.com/news/Libxml2-No-Maintainer)
- [LWN - libxml2 no security embargoes](https://lwn.net/Articles/1025971/)
- [BigGo - libxml2 rejects security embargoes](https://biggo.com/news/202506270132_libxml2-rejects-security-embargoes)
- [Hackaday - libxml2 narrowly avoids becoming unmaintained](https://hackaday.com/2025/12/23/libxml2-narrowly-avoids-becoming-unmaintained/)
- [Yocto Project bugzilla #15912 - testlimits timeout under qemuriscv64](http://bugzilla.yoctoproject.org/15912)