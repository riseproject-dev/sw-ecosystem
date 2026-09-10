---
title: OSTree / rpm-ostree
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="ostree-rpm-ostree" %}

# OSTree / rpm-ostree

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for OSTree / rpm-ostree<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OSTree is a content-addressed, git-like versioning and atomic-upgrade system for Linux filesystem trees, implemented in portable C on top of GLib/GIO. rpm-ostree layers RPM-based dependency resolution (via a vendored libdnf/libsolv/librepo/rpm stack) on top of OSTree to provide hybrid image/package management for Fedora CoreOS, Fedora Silverblue/Kinoite, Fedora IoT, RHEL CoreOS/OpenShift 4, and the Red Hat In-Vehicle OS.

**Governance:** No formal foundation (no CNCF, Apache, Linux Foundation, or SFC affiliation) governs either project; both are maintainer-led. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file exists in `ostreedev/ostree` or `coreos/rpm-ostree`. The closest governance artifact is `ostree.doap`, which names a single formal maintainer, Colin Walters, and tags the project `gnome-infrastructure` (mailing list `ostree-list@gnome.org`) - loosely GNOME-affiliated for hosting/infra but not a GNOME Foundation-governed core module. `CONTRIBUTING.md` describes an informal consensus-of-current-maintainers model; PRs merge via a bot (`cgwalters-bot`, running Homu) rather than GitHub's native merge button. License: LGPLv2+ for code, CC-BY-SA-3.0/GFDL-1.3-or-later for docs; rpm-ostree is GPLv2+/LGPLv2+/(Apache-2.0 OR MIT) mixed. rpm-ostree's own README states development focus has shifted to `bootc` and `dnf5`, i.e. rpm-ostree is in maintenance mode, not active feature growth.

**Corporate sponsors (by commit volume and email domain):** Red Hat is the dominant, de facto corporate steward - it employs the project creator (Colin Walters, 4,099 commits on ostree) and the large majority of top committers (Jonathan Lebon, Alexander Larsson, Giuseppe Scrivano, Matthew Barnes, and, post-2018 acquisition, former CoreOS Inc. staff such as Luca Bruno). Endless OS Foundation (Philip Withnall, Dan Nicholson, Matthew Leeds) and Collabora (Denis Pynkin, Simon McVittie) are the next-largest corporate contributors. rpm-ostree shows the same Red Hat-dominant pattern (Colin Walters, Jonathan Lebon, Luca Bruno, Joseph Marrero, Timothee Ravier, Huijing Hei, all `@redhat.com`), with Oracle (Benno Rice) contributing as well.

**Community culture on new ports:** No documented policy on adding new architecture ports exists in either repository. Given the complete absence of RISC-V commits, issues, or code references over 15+ years of project history, and no CI/build-target machinery for riscv64, the stance reads as passive rather than either welcoming or hostile - the project would likely accept a well-formed portability patch (both projects already build across many architectures via standard autotools+GLib portability), but there has been no upstream initiative, sponsor, or contributor push to add or officially support RISC-V.

## 2. Port History and Upstreaming Timeline

**No RISC-V port exists or has ever been attempted upstream.** Full commit history search (deepened clones, `git log --all -i --grep`, `-S"riscv"` pickaxe search) and GitHub code/issue/PR search returned zero genuine RISC-V development activity in either `ostreedev/ostree` or `coreos/rpm-ostree`.

| Date | Event | Source |
|---|---|---|
| 2019-11-08 | [PR #1971](https://github.com/ostreedev/ostree/pull/1971) merged - a generic autotools build-race fix (`tests/` directory not created before test-file generation under `--disable-dependency-tracking`). The underlying bug report's build log happened to show a Yocto build path `riscv64-yoe-linux-musl/...`, but the fix is architecture-agnostic; this is not RISC-V enablement work. | [PR #1971](https://github.com/ostreedev/ostree/pull/1971) |
| 2018-06-23 to 2018-06-27 | [Issue #1640](https://github.com/ostreedev/ostree/issues/1640), a big-endian test-failure bug (s390x/hppa/ppc64), cites riscv64 only as an example little-endian architecture that did *not* fail. Not RISC-V-related work. | [Issue #1640](https://github.com/ostreedev/ostree/issues/1640) |

No master tracking issue for a riscv64 port exists in either repository. No key contributors for RISC-V work exist, because no such work exists. The question "is it fully upstream" does not apply - there is no RISC-V-specific code, in-flight or merged, to be upstream or not; riscv64 support is entirely incidental to the project's general architecture portability (see Section 4).

## 3. Upstream Support Tier

No formal tier policy is documented in either repository. Support is implicit/best-effort via the portable autotools+GLib build, tested officially only on the architectures named in CI configuration:

- ostree's Packit config (`.packit.yaml`) builds/tests only `x86_64` and `aarch64` (Fedora 43/44, CentOS Stream 9/10) - no riscv64 target.
- All 6 GitHub Actions workflow files (`tests.yml`, `rust.yml`, `bootc.yaml`, `docs.yml`, `release.yml`, `labeler.yml`) run exclusively on `ubuntu-latest`/`ubuntu-24.04` (x86_64) runners or x86_64 containers. The only non-native-architecture matrix entry anywhere is a 32-bit i386 job in `tests.yml`, explicitly commented as a proxy for 32-bit armv7 - not riscv64.
- rpm-ostree's spec file (`packaging/rpm-ostree.spec`) sets `ExcludeArch: %{ix86}` only; riscv64 is neither explicitly excluded nor explicitly tested - it is simply absent from every CI/build matrix.

| Architecture | Upstream GH Actions CI | Packit CI (Fedora/CentOS) | Release-blocking | Upstream riscv64 binary |
|---|---|---|---|---|
| amd64 | Yes (build+test) | Yes (x86_64) | Yes | N/A (native) |
| arm64 | No (GH Actions is x86_64-only) | Yes (aarch64) | Yes (Packit) | Data not available: release asset enumeration blocked this session |
| riscv64 | No | No | No | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Neither OSTree nor rpm-ostree contains SIMD intrinsics, JIT compilation, GC barriers, or hand-written assembly for any architecture. Both are portable userspace C/GLib codebases; performance-sensitive work (hashing, compression) is delegated entirely to dependencies (see Section 9). Direct source-level verification found only 5 CPU-architecture preprocessor conditionals across 3 files in the entire ostree tree, and zero in rpm-ostree:

| File | Guard | Purpose |
|---|---|---|
| `src/libostree/ostree-bootloader-grub2.c` | `!WITH_MODERN_GRUB && (defined(__i386__)\|\|defined(__x86_64__))` | Legacy `-16` BIOS-mode suffix for GRUB menu entries |
| `src/libostree/ostree-bootloader-grub2.c` | `WITH_MODERN_GRUB \|\| defined(__aarch64__)` | Drop legacy `-efi` suffix on arm64 |
| `src/libostree/ostree-bootloader-zipl.c` | `!HAVE_LIBARCHIVE && defined(__s390x__)` | Build error if libarchive missing on s390x |
| `src/libostree/ostree-bootloader-zipl.c` | `defined(__s390x__)` | zipl bootloader backend is only "active" on s390x |
| `src/libostree/ostree-repo-private.h` | `!defined(__s390x__)` | Default bootloader-detection string |

`grep -rni riscv` across the entire local ostree tree and `search_code` for `riscv`/`__riscv` in `coreos/rpm-ostree` both returned zero hits.

| Component | amd64 | arm64 | s390x | riscv64 |
|---|---|---|---|---|
| Bootloader-suffix logic | Scalar/quirk-only (legacy BIOS suffix) | Scalar/quirk-only (EFI suffix override) | Dedicated backend (zipl is s390x-exclusive, no GRUB) | N/A - falls through to the shared default branch used by every other non-legacy architecture (ppc64le, 32-bit arm, mips, riscv64) |
| SIMD/vectorized code | None | None | None | None (project has none for any architecture) |
| JIT | None | None | None | None (not applicable to this project class) |
| Crypto/hashing | Delegated to OpenSSL/gcrypt/glib (see Section 9) | Same | Same | Same |

There is no `#ifdef __riscv` anywhere in either codebase - not because riscv64 is unsupported, but because the project's three narrow legacy-boot-firmware quirks (x86 BIOS real-mode suffix, arm64 modern-EFI suffix, s390x's unique zipl bootloader and lack of GRUB) do not apply to riscv64, which boots via U-Boot/EFI+GRUB like most modern arm64/ppc64le systems. This is working-as-designed portability, not an incomplete port.

## 5. Build System, Cross-Compilation, and Toolchain

Both projects use GNU Autotools; neither uses CMake or Meson. No `CMakeLists.txt`, `cmake/riscv64.cmake`, `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in either repository.

Standard (only documented) build sequence for ostree:
```
git submodule update --init
env NOCONFIGURE=1 ./autogen.sh
./configure --prefix=...
make
make install DESTDIR=/path/to/dest
```
rpm-ostree follows the same autotools pattern (`configure.ac`, no meson/CMake).

- No riscv64-specific Dockerfile exists; standard build Dockerfiles (`ostree/Dockerfile`, `rpm-ostree/Dockerfile`, `ci/prow/Dockerfile*`) contain no cross-compilation logic for riscv64.
- No minimum GCC/Clang version is specified for riscv64 or any architecture; `configure.ac` only performs generic `AC_PROG_CC`/`AC_PROG_CC_C_O` checks plus a clang-specific warning-flag branch (`configure.ac:57`).
- The autotools analogue of CMake's `-DUSE_X=OFF` flags is `./configure --without-X`/`--disable-X` (e.g. `--without-curl --without-soup --without-selinux --without-libmount --disable-rofiles-fuse`, used in the "minimal" CI build job) - none are riscv-related.
- No QEMU usage is referenced anywhere in either project's build or CI scripts.
- No riscv64 build failures are documented anywhere upstream (none exist to document, since riscv64 has never been built in upstream CI).

**Conclusion:** any riscv64 build today relies solely on generic autotools/gcc cross-compilation or native-riscv64 building, untested, unsupported, and undocumented by upstream. Downstream distro packaging (see Section 8) confirms this works in practice.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the codebase has no architecture-specific feature gating beyond the three bootloader quirks in Section 4 (none of which apply to riscv64), there is no known functional feature gap between riscv64 and arm64/amd64 for OSTree itself.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core OSTree repo/commit operations | Full | Full | Full (default code path, same as arm64) |
| GRUB2 bootloader backend | Full (legacy BIOS suffix quirk) | Full (modern EFI, no suffix) | Full (same as modern arm64 path) [NEEDS VERIFICATION - not tested by upstream CI] |
| zipl bootloader backend | N/A (s390x-only) | N/A | N/A |
| rpm-ostree image/package layering | Full | Data not available: no upstream riscv64 or dedicated arm64 GH Actions test found | Untested; no Fedora koji riscv64 build exists at all (Section 8) |

**Performance gaps:** none attributable to missing SIMD/vectorization, because no such code paths exist for any architecture in this project (it is not compute-bound).

**Security hardening gaps:** Data not available: no riscv64-specific security-hardening comparison was found or searched for in this research pass.

**NaN/floating-point semantics:** Not applicable - no floating-point-sensitive code paths were identified in OSTree/rpm-ostree's own source. (OpenSSL, a dependency, has open riscv64 issues; see Section 9.)

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `ostreedev/ostree`**, confirmed by directly reading the full contents of all 6 GitHub Actions workflow files (`tests.yml`, `rust.yml`, `bootc.yaml`, `docs.yml`, `release.yml`, `labeler.yml`) and `.cci.jenkinsfile` (the Fedora CoreOS coreos-ci Jenkins pipeline). No `.gitlab-ci.yml` or `.cirrus.yml` file exists in the repository. Every job runs on `ubuntu-latest`/`ubuntu-24.04` GitHub-hosted runners or x86_64 Docker containers (`quay.io/coreos-assembler/fcos-buildroot`, various Debian/Ubuntu images). No QEMU cross-arch matrix entries exist anywhere; the sole non-native-arch entry in `tests.yml`'s distro matrix is an i386 (32-bit x86) build. No RISE runner references (`riseproject-dev` or RISE-labeled runners) were found in any CI file. This verdict was independently re-confirmed against a live-fetched, current clone (`git fetch` + empty `diff --stat` against `origin/main`, HEAD `42b345e1`, 2026-09-02).

No corresponding riscv64 CI evidence was found for `coreos/rpm-ostree` either (no dedicated workflow research located a riscv64 job).

| Architecture | GH Actions build | GH Actions test | Packit build/release | RISE runners used |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes (x86_64) | No |
| arm64 | No (GH Actions is x86_64-only) | No | Yes (aarch64, Fedora/CentOS) | No |
| riscv64 | No | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases:** Direct API/HTML enumeration of release assets for `ostreedev/ostree` and `coreos/rpm-ostree` was blocked in this research session (GitHub API access was not attached for these repositories). By upstream convention both projects' releases ship source tarballs (`.tar.xz`) only, not prebuilt architecture-specific binaries, so no riscv64 release asset would be expected there regardless [NEEDS VERIFICATION - could not directly enumerate assets].

**PyPI:** Not applicable - `ostree`/`rpm-ostree` are C system tools, not Python packages. A PyPI project literally named `ostree` exists but is an unrelated, homonymous, pure-Python package (arch-independent wheels only, `ostree-0.1.1-py3-none-any.whl`, etc.) - confirmed via `https://pypi.org/pypi/ostree/json` - not the real libostree bindings.

**Ubuntu 26.04 (resolute) - CONFIRMED via direct raw-HTML fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=ostree&suite=resolute&searchon=names&section=all):**
- `ostree` 2025.7-3build1: architectures `amd64 arm64 armhf ppc64el riscv64 s390x` - riscv64 explicitly listed.
- Same version and architecture list (including riscv64) for `libostree-1-1`, `libostree-dev`, `gir1.2-ostree-1.0`, `ostree-boot`, `ostree-tests`.
- This is a clean build from unmodified upstream source (the codebase requires no riscv64-specific patches, per Section 4's portability analysis) - it satisfies the "clean-distro-build" distribution floor.

**rpm-ostree - not available on riscv64 anywhere checked:**
- `https://packages.ubuntu.com/search?keywords=rpm-ostree&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - rpm-ostree is not packaged for Ubuntu at all, on any architecture (it targets the Fedora/RHEL libdnf/rpm ecosystem, not Debian's archive).
- Fedora koji (rpm-ostree's native distribution channel), checked directly against current builds (September 2026): `rpm-ostree-2026.2-4.fc46`, `-4.fc45`, and `-4.eln159` all show arch directories `aarch64, ppc64le, s390x, x86_64, src` only - **riscv64 is explicitly absent** across all three current builds.

**What a user must do to get a working binary:**
- OSTree/libostree on riscv64: `apt install ostree` on Ubuntu 26.04 (resolute) works today via the confirmed distro package. [Debian/openSUSE riscv64 status per the research summary is asserted but not independently re-verified with raw HTML in this pass - NEEDS VERIFICATION.]
- rpm-ostree on riscv64: no prebuilt package exists anywhere found; a user must build from source via autotools, entirely unsupported and untested by any distro or upstream CI.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GLib/GIO | Core object system, I/O, main loop | No riscv64-specific issues found | None found | Standard distro package | None found |
| liblzma/xz | Required compression codec | Portable; 1 closed feature request (#146, unaligned-access tuning for RISC-V), already resolved | None open | Standard distro package | None open |
| zlib | Required generic compression | No riscv64-specific issues | - | Standard distro package | None found |
| e2fsprogs/libext2fs | Extended-attribute handling | No riscv64-specific issues | - | Standard distro package | None found |
| libcurl | HTTP fetch backend (default) | No riscv64-titled issues found | - | Tracked separately - see [libcurl status report](project-reports/libcurl.md) | None found |
| libsoup/libsoup3 | Alternate HTTP backend | Data not available: not queried this pass | Not queried | Listed in project scope, no dedicated report yet | Not queried |
| GPGME + libgpg-error | GPG commit-signature verification | No riscv64-specific issues on either project | - | Standard distro package | None found |
| OpenSSL | Checksum/crypto backend option; also used by rpm-ostree's Rust crates and libdnf | 66 riscv64-related issues found on openssl/openssl, several open: extension-detection issues on musl, intermittent `test_lhash` CI failures on linux-riscv64, requests to replace inline asm with intrinsics, SHA-256 perf optimization, AES zknd/zkne flag requirements, requests to expand arch-specific testing | Functional but has documented CI flakiness and unfinished performance/assembly work on riscv64 | Tracked separately - see [openssl status report](project-reports/openssl.md) | Open issues are perf/flakiness, not correctness blockers |
| libsodium | Optional Ed25519 signing backend | No riscv64-specific issues | - | Not in project scope | None found |
| libarchive | Required by rpm-ostree; optional tar import/export in OSTree | No riscv64-specific issues (1 open ppc64le CI-failure issue suggests general minor-arch CI gaps) | Minor-arch CI gaps observed for ppc64le, not riscv64-specific | Not in project scope | None riscv64-specific |
| composefs | Optional verity-backed overlay store | GitHub issue search failed (repository not resolvable in this session's index) - not verified | Not verified | Not in project scope | Recommend re-check |
| libselinux | SELinux labeling of deployments | 1 unrelated closed issue (i386 compile error); no riscv64 issues | - | Listed in project scope, no dedicated report yet | None found |
| rpm | RPM library, hard dependency of rpm-ostree | 5 issues found, all closed - historical requests for RISC-V rpmbuild/cross-compilation (#2085, #1327), both resolved | Historical requests resolved | Standard distro package | None open |
| libdnf | Dependency-resolution engine, vendored via libdnf-sys | 1 closed multi-arch test-failure issue (armv7hl/ppc64/aarch64), not riscv64-specific | - | Not in project scope | None riscv64-specific |
| librepo | Repo metadata fetching, used by libdnf | No riscv64-specific issues | - | Not in project scope | None found |
| libsolv | SAT-based dependency solver core of libdnf transactions | 1 unrelated issue (aarch64 32-bit compat query) | - | Not in project scope | None found |
| systemd/libsystemd | Journal/logind bindings, bootloader/deployment integration | 13 riscv64-related issues found, all closed/resolved: build failures on riscv32 musl, ELF `.dynamic` missing on riscv64-linux/NixOS, LTO build failure, non-deterministic startup hangs, `systemd-detect-virt` permission issue under qemu-riscv64 on Ubuntu 25.10, `ukify` uncompressed riscv64 kernel handling | Historical bugs, all fixed upstream; no open riscv64 issues found | Listed in project scope, no dedicated report yet | None open |
| zstd | Transitive/optional, used by libdnf's optional zchunk metadata-compression backend | Data not available: not re-queried this pass due to rate limiting | - | Tracked separately - see [zstd status report](project-reports/zstd.md) | Defer to existing report |
| glibc | Underlying C library for the whole stack | Data not available: not re-queried this pass | - | Tracked separately - see [glibc status report](project-reports/glibc.md) | Defer to existing report |

**No JIT-backend, SIMD-kernel, or dedicated numerics/allocator dependency exists in this stack** - these are system-management tools. The closest "numerics" component is libsolv's SAT solver (combinatorial, not floating-point), and neither project uses a custom allocator (jemalloc/mimalloc); both rely on glibc's malloc. Crypto (OpenSSL, GPGME/libgpg-error, libsodium) and compression (xz/liblzma, zlib, libarchive, zstd-via-zchunk) are the only categories where riscv64 activity concentrates, and **OpenSSL is the single dependency with a meaningful open riscv64 backlog** (performance optimization and CI flakiness, not correctness blockers). systemd had the largest historical riscv64 bug count of any dependency, but every one found is closed, consistent with riscv64 having become a well-supported systemd target over roughly the past two years.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [ostreedev/ostree#1640](https://github.com/ostreedev/ostree/issues/1640) | Test failures on 64-bit big-endian (`g_str_has_prefix` assertion) | Closed (completed), 2018 | N/A - not riscv64 | riscv64 cited only as an example little-endian arch that passed; bug is about s390x/hppa/ppc64 endianness |
| [ostreedev/ostree#1971](https://github.com/ostreedev/ostree/pull/1971) | build: create tests directory for split builds | Merged 2019-11-08, first released in v2019.6 | N/A - not riscv64 | Generic build-race fix; underlying bug report's build log incidentally referenced a Yocto riscv64 path |

**No open GitHub issue in `ostreedev/ostree` or `coreos/rpm-ostree` references RISC-V, riscv64, or a riscv-specific correctness/performance/floating-point bug.** This was confirmed via multiple direct `search_issues`/`search_pull_requests`/`search_code` queries scoped to both repositories, none of which returned genuine RISC-V matches.

Two general (non-riscv64-specific) architecture bugs surfaced as semantic-search false positives and are noted for completeness, not because they concern RISC-V: [#2527](https://github.com/ostreedev/ostree/issues/2527) (s390x test flakiness, open) and [#381](https://github.com/ostreedev/ostree/issues/381) (ARM SIGBUS/use-after-free, closed 2016).

No correctness bugs, no performance bugs, and no benchmark data (see Section 14) specific to riscv64 exist for either project in any source searched (GitHub issue search, general web search, Phoronix/OpenBenchmarking search, riseproject.dev blog).

## 12. Objections and Upstream Blockers

**Stated objections:** none found - there is no discussion of RISC-V, positive or negative, anywhere in either repository's issue tracker, pull requests, or commit history.

**Technical blockers:** none identified. The codebase is portable autotools+GLib C with no architecture-specific machine code beyond the three narrow bootloader quirks in Section 4, none of which are riscv64-relevant. The one dependency with an open riscv64 backlog is OpenSSL (performance/CI-flakiness issues, not correctness blockers - Section 9), which would not block a functional riscv64 build of OSTree/rpm-ostree today.

**Organizational blockers:** OSTree/rpm-ostree is not a RISE member project - neither project appears anywhere on [riseproject.dev](https://riseproject.dev) or its blog/sitemap ([full 34-post sitemap fetched](https://riseproject.dev/wp-sitemap-posts-post-1.xml)), the RISE Distro Integration Working Group's public tracker, or the RISE Python wheel builder. This is despite Red Hat LLC - OSTree's dominant corporate sponsor by commit volume - being a RISE Premier Member; that corporate membership has not translated into any RISC-V-specific work on OSTree or rpm-ostree. There is no evidence of RISE-funded work, RISE RISC-V Runner usage, or RISE blog coverage tied to either project.

**Acceptance probability:** Likely high for a well-formed, narrowly-scoped patch (e.g., adding a riscv64 CI job or Packit target) given the project's history of accepting portability-adjacent build fixes (e.g., [PR #1971](https://github.com/ostreedev/ostree/pull/1971)) and its otherwise-portable design, but there is currently zero organizational or contributor impetus driving such a submission.

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro) - the only channel that ships a consumable riscv64 binary; not upstream, not RISE.
- Optimization gap: N/A. OSTree/rpm-ostree are not optimization-purpose projects (no compute kernels, no numerics, no JIT, no SIMD anywhere in the codebase for any architecture - see Section 4), so the Step 2 optimization modifier does not apply and no optimization level is assigned.
- **Justification:** No upstream CI builds, tests, or releases riscv64 for `ostreedev/ostree` (confirmed by directly reading all GitHub Actions workflow files and `.packit.yaml`, [Section 7](#7-cicd-infrastructure)), which on its own would set the color to orange. However, Ubuntu 26.04 (resolute) ships `ostree`/`libostree-1-1`/`libostree-dev` built for riscv64 from unmodified upstream source, confirmed via direct raw-HTML fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=ostree&suite=resolute&searchon=names&section=all) (`ostree 2025.7-3build1`, arches `amd64 arm64 armhf ppc64el riscv64 s390x`). Because the codebase requires no riscv64-specific patches (its only architecture conditionals are three narrow bootloader-firmware quirks that do not touch riscv64, [Section 4](#4-technical-architecture-and-risc-v-specific-subsystems)), this is a clean, unpatched distro build, which applies the "clean-distro-build" distribution floor and raises the grade from orange to **yellow**.
- **rpm-ostree caveat:** graded separately, rpm-ostree alone would sit at orange or below - it has no upstream CI, is not packaged in Ubuntu at all, and is explicitly absent from Fedora koji's current riscv64-excluded build set (fc45/fc46/eln159, confirmed via direct koji directory listings, [Section 8](#8-distribution-and-release-status)). The yellow grade above applies to the named repository, `ostreedev/ostree` (OSTree/libostree); rpm-ostree is materially worse off and should not be assumed to inherit OSTree's grade.
- **Pending work that could change the grade:** none identified. No open PR, tracking issue, or RISE initiative exists for either project ([Section 2](#2-port-history-and-upstreaming-timeline), [Section 12](#12-objections-and-upstream-blockers)). The grade would move to blue only if upstream added a riscv64 GitHub Actions or Packit job that runs (not just builds) the test suite; it would move toward orange for rpm-ostree specifically if Fedora koji's riscv64 exclusion is confirmed as a deliberate policy rather than a resourcing gap [NEEDS VERIFICATION].

## 14. Investment Analysis

RISE has not funded, tracked, or produced any work on OSTree or rpm-ostree (Section 12). No prior RISE investment exists to net out of the estimates below.

### 14.1 Functional Enablement

OSTree already builds and functions on riscv64 today via Ubuntu's clean, unpatched distro build (Section 8), so no functional porting work is required for OSTree/libostree itself. The gap is entirely one of upstream validation, not code: add a riscv64 target to `.packit.yaml` and/or a riscv64 job (native or QEMU) to `.github/workflows/tests.yml`. For rpm-ostree, the gap is larger: it has never been built for riscv64 in any known channel, so functional enablement work should start with a manual native/cross build attempt against the vendored libdnf/libsolv/librepo stack to surface any latent issues before proposing upstream CI.

### 14.2 Performance Optimization

Not applicable. Neither project contains SIMD, JIT, or hand-tuned architecture-specific hot paths (Section 4); there is no optimization surface to invest in beyond what is inherited from dependencies (notably OpenSSL's open riscv64 performance backlog, Section 9, which is out of scope for OSTree/rpm-ostree investment and belongs to the OpenSSL project).

### 14.3 CI/CD Infrastructure

Add a riscv64 entry to ostree's Packit config and/or GitHub Actions `tests.yml` matrix, ideally running (not just building) the existing test suite to qualify for a blue grade. RISE RISC-V Runners were not found referenced anywhere in either project's CI and could serve as the native-hardware backend for such a job if RISE chooses to sponsor this work.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because neither OSTree nor rpm-ostree has a significant dependent package ecosystem (no PyPI/npm/Maven consumer base; they are standalone system tools/libraries consumed via distro packaging and C/Rust bindings).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Attempt native/cross riscv64 build of rpm-ostree (incl. vendored libdnf/libsolv/librepo) to surface latent issues | 1-2 | Upstream or contributor | Medium |
| CI/CD | Add riscv64 target to ostree's `.packit.yaml` (build+test, mirroring existing aarch64 target) | 1 | Upstream (Red Hat) | Medium |
| CI/CD | Add riscv64 job to ostree's `.github/workflows/tests.yml`, running the existing test suite (not build-only) | 1-2 | Upstream (Red Hat) or RISE-sponsored contribution | Medium |
| CI/CD | Add riscv64 build target to rpm-ostree's Fedora koji configuration | 1-2 (plus Fedora release-engineering coordination) | Upstream (Red Hat) / Fedora | Low-Medium |
| Ecosystem | N/A (no dependent package ecosystem) | - | - | - |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [ostreedev/ostree repository](https://github.com/ostreedev/ostree)
- [OSTree homepage](https://ostreedev.github.io/ostree/)
- [coreos/rpm-ostree repository](https://github.com/coreos/rpm-ostree)
- [PR #1971 - build: create tests directory for split builds](https://github.com/ostreedev/ostree/pull/1971)
- [Issue #1640 - test failures on 64-bit big-endian](https://github.com/ostreedev/ostree/issues/1640)
- [Issue #2527 - s390x test flakiness](https://github.com/ostreedev/ostree/issues/2527)
- [Issue #381 - ARM SIGBUS/use-after-free](https://github.com/ostreedev/ostree/issues/381)
- [Ubuntu 26.04 (resolute) package search - ostree](https://packages.ubuntu.com/search?keywords=ostree&suite=resolute&searchon=names&section=all)
- [Ubuntu 26.04 (resolute) package search - rpm-ostree](https://packages.ubuntu.com/search?keywords=rpm-ostree&suite=resolute&searchon=names&section=all)
- [PyPI ostree package JSON API](https://pypi.org/pypi/ostree/json)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Working Groups move their project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [libcurl status report](project-reports/libcurl.md)
- [openssl status report](project-reports/openssl.md)
- [zstd status report](project-reports/zstd.md)
- [glibc status report](project-reports/glibc.md)
- [coreos/bootupd repository (riscv64 UEFI target reference)](https://github.com/coreos/bootupd)
- [OSnews - Fedora struggles bringing its RISC-V variant online due to slow build times](https://www.osnews.com/story/144582/fedora-struggles-bringing-its-risc-v-variant-online-due-to-slow-build-times/)