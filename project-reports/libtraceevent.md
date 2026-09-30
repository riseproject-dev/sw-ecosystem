---
title: libtraceevent
parent: Project Reports
color: yellow
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: pkg-config
    relation: build-dependency
    criticality: optional
  - name: CUnit
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libtraceevent" %}

# libtraceevent

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libtraceevent<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libtraceevent is a userspace C library for parsing Linux kernel trace event data produced by the ftrace ring buffer subsystem: byte-swapping, struct unpacking, and string formatting of binary trace records, all inherently architecture-neutral operations. It ships a plugin system for decoding domain-specific event formats; direct source inspection this cycle confirmed at least 13 named plugins (cfg80211, function, futex, hrtimer, jbd2, kmem, kvm, mac80211, net, sched_switch, scsi, tlb, xen), all kernel-subsystem-specific rather than CPU-ISA-specific.

**Homepage discrepancy.** A fetch of `https://libtraceevent.org/` returned `getaddrinfo ENOTFOUND libtraceevent.org` - the domain does not resolve and no project website exists at that address. The actual project homepage and documentation live at [trace-cmd.org](https://www.trace-cmd.org/), a plain community kernel.org project page with no foundation, governance-model statement, membership claims, or RISC-V mention.

**Governance.** The project operates under informal Linux kernel governance conventions. Patches are submitted to the [linux-trace-devel@vger.kernel.org](mailto:linux-trace-devel@vger.kernel.org) mailing list (archived on lore.kernel.org), reviewed by maintainers, and merged to [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) as canonical upstream. There is no CLA, no steering committee, no bylaws, and no formal "tier policy" for architecture support - it works like any kernel.org subproject (maintainer review plus mailing-list consensus).

**License:** LGPL-2.1, with GPL-2.0 covering any kernel-linked components; both license files are present under `LICENSES/`.

**Maintainers.** Primary maintainer is Steven Rostedt (rostedt@goodmis.org), the long-time Linux ftrace maintainer, currently at Google. Tzvetomir Stoyanov (tz.stoyanov@gmail.com) performed the original extraction of the code from the kernel tree into a standalone library and is a co-maintainer/major contributor; his current corporate affiliation is not confirmed from available sources [NEEDS VERIFICATION]. Both maintainers appear to work on the project largely as part of kernel-tracing roles at their employers, but libtraceevent has no corporate "sponsor" structure of its own - it is classic kernel.org volunteer/employer-time maintainership, not a governed-foundation project. The Debian/Ubuntu package is separately maintained by Sudip Mukherjee. The raw `MAINTAINERS` file could not be fetched directly this cycle (git.kernel.org returned a 403/Anubis bot challenge on both tree and raw-file paths, and the paths tried on GitHub/Google mirrors 404'd), so maintainer identities above rest on mailing-list archives, the GitHub mirror, and trace-cmd.org rather than the raw file text.

**RISE involvement:** None. libtraceevent does not appear in RISE (riseproject.dev) member lists, blog posts, working-group project trackers, or funded workstreams. The full current RISE blog index (35 posts, May 2024 through September 2026, fetched via the site's own sitemap) contains zero posts mentioning libtraceevent, tracing, ftrace, or perf. The site's own search (`riseproject.dev/?s=libtraceevent`) returns "Sorry, no results were found." RISE's System Libraries and Kernel & Virtualization working groups - the two most plausibly relevant to a tracing library - do not track libtraceevent among their listed projects, and a GitHub issue search across the `riseproject-dev` org for "libtraceevent" returned zero matches. See Section 12 for the full membership/working-group detail.

**Community stance on new ports.** Because the library contains no architecture-specific code, there is no documented stance on riscv64 and no porting effort has ever been required. Any architecture that can compile portable C against Linux kernel headers produces a working binary.

---

## 2. Port History and Upstreaming Timeline

libtraceevent has required no architecture-specific port. It has been architecture-neutral since its creation as a standalone library (split out of the kernel's `tools/lib/traceevent`).

| Date | Event | Source |
|---|---|---|
| Initial release | Library created as pure portable C; riscv64 supported implicitly, no riscv-specific commit exists | [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) |
| 2022-04-22 | Debian riscv64 build of 1:1.5.3-1 produces "Maybe-Failed" on rv-mullvad-02, immediately retried successfully [NEEDS VERIFICATION - not re-confirmed this cycle] | [Debian buildd](https://buildd.debian.org/status/package.php?p=libtraceevent&suite=sid) |
| Dec 2022 | Gentoo bug [#887821](https://bugs.gentoo.org/887821): libtraceevent 1.7.0 not keyworded for riscv. Yixun Lan tested on a HiFive Unmatched board, confirmed functional, added the ~riscv keyword same day | [bugs.gentoo.org/887821](https://bugs.gentoo.org/887821) |
| 2026-02-05 | Alpine edge/main ships libtraceevent 1.9.0-r0 for riscv64 [NEEDS VERIFICATION - not re-confirmed this cycle] | Alpine Linux packages |
| 2026-06-15 | Debian sid reported building 1:1.9.0-2 successfully on rv-osuosl-01 [NEEDS VERIFICATION - not re-confirmed this cycle; see discrepancy note below] | Debian buildd |
| Feb 2026 | Latest upstream tag `libtraceevent-1.9.0` present on git.kernel.org, confirmed by direct fetch this cycle | [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) |

**Version-number discrepancy.** Research this cycle, while confirming general riscv64 packaging, referenced Debian sid at **1:1.8.4-2** (in the context of confirming riscv64 is built like every other architecture), which is a lower version than the 1:1.9.0-2 sid build reported for 2026-06-15. The two figures were not reconciled against a live Debian buildd fetch this cycle; both are reported here rather than silently resolved.

No riscv64-specific patch has ever been submitted or merged upstream. This was independently re-verified this cycle via three separate GitHub search modalities against `rostedt/libtraceevent`: `search_pull_requests` for "riscv" returned `total_count: 0`, `search_issues` for "riscv" returned `total_count: 0`, and `search_code` for "riscv" returned `total_count: 0`. A direct fetch of the kernel.googlesource.com mirror's 100 most recent commits found no riscv/riscv64 mentions. Patchwork and lore.kernel.org searches for "riscv" on linux-trace-devel returned zero results where accessible (both hosts are also gated by an Anubis bot challenge for some query paths).

**Key contributors:** None exist specifically for riscv64, because no riscv64-specific work was ever required.

**Upstreaming status:** Complete by definition - there is nothing to upstream.

---

## 3. Upstream Support Tier

libtraceevent has no formal tier policy because it has no architecture-specific code; any Linux architecture is implicitly supported at parity.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | None | None | None |
| Release blocking | N/A | N/A | N/A |
| Official upstream binaries | N/A (source tarballs only) | N/A | N/A |
| Debian packaging | Yes | Yes | Yes |
| Ubuntu 26.04 (resolute) packaging | Yes, 1:1.8.7-1 | Yes, 1:1.8.7-1 | Yes, 1:1.8.7-1 |
| Alpine packaging | Yes | Yes | Yes, 1.9.0-r0 [NEEDS VERIFICATION] |
| Gentoo keyword | Yes | Yes | Yes (~riscv, added Dec 2022) |

No architecture receives preferential upstream support because there is no upstream CI infrastructure at all (confirmed by direct repository tree inspection, Section 7). riscv64 is at parity with every other architecture.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libtraceevent contains no architecture-specific components of any kind, for any architecture. This was re-confirmed this cycle via direct source inspection (kernel.googlesource.com mirror, HEAD as of 2026-09-30) and GitHub code search against `rostedt/libtraceevent`:

- `grep -ril riscv .` across the entire tree (src/, plugins/, include/, samples/, utest/, Documentation/): zero matches. No `plugin_riscv.c`, no `#ifdef __riscv`.
- `grep -rlE "__x86_64__|__aarch64__|__powerpc__|__arm__|__riscv"`: zero matches. No CPU-architecture conditional compilation anywhere.
- GitHub code search for `riscv repo:rostedt/libtraceevent`: 0 results. Search for `arch repo:rostedt/libtraceevent`: 16 hits, all incidental substring matches (`bsearch`, `architecture`, a Xen hypercall constant `HYPERVISOR_arch_N`, a comment about an x86-64 ftrace quirk in `event-parse.c`, a SCSI opcode literal `0x86` in `plugin_scsi.c`) - none are architecture-dispatch code.
- Repository root tree: `Documentation/`, `LICENSES/`, `include/`, `plugins/`, `samples/`, `scripts/`, `src/`, `utest/`, plus top-level files. No `arch/` directory, no `.S` files, no JIT backend, no SIMD dispatch.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core event parser (event-parse.c) | scalar C | scalar C | scalar C | Pure portable C, no arch guards |
| Ring buffer reader (kbuffer-parse.c) | scalar C | scalar C | scalar C | Endianness and 32/64-bit handled via runtime flags, not compile-time arch conditions |
| Plugin system (plugins/) | scalar C | scalar C | scalar C | 13+ plugins identified (cfg80211, function, futex, hrtimer, jbd2, kmem, kvm, mac80211, net, sched_switch, scsi, tlb, xen), all arch-neutral |
| Assembly (.S files) | none | none | none | Zero .S files in repository |
| SIMD / intrinsics | none | none | none | No vectorizable hotpaths; the task is byte-level parsing |
| JIT backend | none | none | none | Not applicable to a parsing library |
| arch/ directory | none | none | none | Directory does not exist |
| Crypto | none | none | none | Not applicable |

The "full/partial/scalar/missing" grading taxonomy used for ISA-optimized libraries does not meaningfully apply here: the honest classification for riscv64 (and for x86_64, aarch64, ppc64el, s390x equally) is **N/A - architecture-generic by design**. This is not an incomplete or stub port; it is the reason no riscv64 patch, issue, commit, or CI job has ever been needed.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems available.** Two, confirmed by direct file read of `Makefile`, `Makefile.meson`, `meson.build`, and `meson_options.txt` via the GitHub mirror (`raw.githubusercontent.com`, since `git.kernel.org`'s cgit UI returned an Anubis bot-challenge page for both tree and raw paths):

1. **Plain Make** (kernel/perf-style; the primary path used by Debian packaging). There is no `configure` script anywhere in the tree. Cross-compilation uses `CROSS_COMPILE` to override `CC`/`AR`/`NM`:
   ```
   $(call allow-override,CC,$(CROSS_COMPILE)gcc)
   $(call allow-override,AR,$(CROSS_COMPILE)ar)
   $(call allow-override,NM,$(CROSS_COMPILE)nm)
   ```
   There is no `ARCH=` variable consulted anywhere in the Makefiles, only `CROSS_COMPILE` as a binutils/gcc prefix. Mechanical riscv64 cross-build:
   ```
   make CROSS_COMPILE=riscv64-linux-gnu- prefix=/usr
   ```
   A more complete sysroot-targeted invocation, using multiarch library paths rather than the default LP64 `lib64` path:
   ```
   make CROSS_COMPILE=riscv64-linux-gnu- \
        prefix=/usr \
        libdir_relative=lib/riscv64-linux-gnu \
        pkgconfig_dir=/usr/lib/riscv64-linux-gnu/pkgconfig \
        DESTDIR=/path/to/sysroot/
   ```

2. **Meson** (`meson.build` + `Makefile.meson` thin wrapper). `meson.build` declares `meson_version: '>= 0.58.0'` - the only version requirement stated anywhere in the project, and it is a Meson-tool minimum, not a compiler minimum. No riscv64 cross-file ships in the repository; a user must supply their own, e.g.:
   ```ini
   [binaries]
   c = 'riscv64-linux-gnu-gcc'
   ar = 'riscv64-linux-gnu-ar'
   strip = 'riscv64-linux-gnu-strip'
   pkgconfig = 'pkg-config'

   [host_machine]
   system = 'linux'
   cpu_family = 'riscv64'
   cpu = 'riscv64'
   endian = 'little'
   ```
   ```
   meson setup build --cross-file=riscv64-cross.txt --prefix /usr -Ddoc=false
   meson compile -C build
   meson install -C build
   ```

**meson_options.txt (verbatim content, direct file read):**
```
option('plugindir', type: 'string')
option('htmldir', type: 'string', value: 'share/doc/libtraceevent-doc')
option('asciidoctor', type: 'boolean', value: false)
option('docbook-xls-172', type: 'boolean', value: false)
option('asciidoc-no-roff', type: 'boolean', value: false)
option('man-bold-literal', type: 'boolean', value: false)
option('docbook-suppress-sp', type: 'boolean', value: false)
option('doc', type: 'boolean', value: true)
```
All eight options are documentation-related; none are architecture-related. No `USE_*`-style feature toggles exist anywhere in the build system.

**Compiler version requirements.** No GCC or Clang minimum is stated anywhere in the repository: no `configure` script exists to check one, `meson.build` performs no compiler-version `dependency()` check, and no README statement or CI matrix pins a version (there is no CI - Section 7). The only hard requirement is `c_std=gnu99` in `meson.build`; any GCC or Clang that supports `-std=gnu99` will build the library. No `-march=rv64gc` or ISA-extension flags are set by the build system; the host toolchain's defaults apply.

**QEMU.** Zero mentions of QEMU in any file reachable this cycle (all Makefiles, meson files, README, and the roughly 45 files under `Documentation/`, which are all man-page source for the library API, e.g. `libtraceevent-btf.txt`, `libtraceevent-filter.txt` - not build or architecture docs). The project provides no QEMU-based testing instructions or CI for any architecture; Debian's buildd instead runs riscv64 builds on native riscv64 hardware.

**Dockerfile.** None exists at the repository root or anywhere in the tree (confirmed root listing: `.gitignore`, `Documentation/`, `LICENSES/`, `Makefile`, `Makefile.meson`, `README`, `check-manpages.sh`, `include/`, `libtraceevent.pc.template`, `meson.build`, `meson_options.txt`, `plugins/`, `samples/`, `scripts/`, `src/`, `test.c`, `utest/`). Common CI paths (`.github/workflows/*.yml`, `.cirrus.yml`, `.travis.yml`) were probed and all returned 404.

**Known build failures on riscv64:**
- uftrace [issue #1855](https://github.com/namhyung/uftrace/issues/1855) (opened Dec 2023, open): on a VisionFive 2 board, `libtraceevent-dev` 1:1.6.0-1 installs but uftrace's configure script reports `libtraceevent: [ OFF ]` - pkg-config detection fails on the target board despite the package being present. This is a downstream consumer issue, not a libtraceevent build failure.
- Debian [#1105512](https://bugs.debian.org/1105512) (open, minor): `make --shuffle=reverse` fails because `lib/` directory creation is ordered after the link step. Not riscv64-specific; affects all architectures.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Event parsing | Full | Full | Full | None |
| Ring buffer reading | Full | Full | Full | None |
| Plugin system | Full | Full | Full | None |
| Cross-endian trace file reading | Full | Full | Full (little-endian host) | None; kbuffer handles cross-endian reads at runtime |
| Unit test suite (utest) | Full | Full | Full, gated by optional CUnit dependency | None structural; tests silently skip if CUnit is absent (Section 9) |
| pkg-config detection in downstream consumers | Works | Works | Intermittent, observed on VisionFive 2 hardware | uftrace #1855 (downstream, not in libtraceevent) |

No functional gaps exist. No performance gaps apply - the library has no SIMD-acceleratable code paths (Section 4). No floating-point or NaN semantics are involved; the library parses integer/struct binary records. Security hardening flags (e.g. `-fstack-protector-strong`, `-Werror=format-security`) apply identically on all architectures via distro packaging toolchains; this was not independently re-verified against a live riscv64 build log this cycle [NEEDS VERIFICATION].

---

## 7. CI/CD Infrastructure

**Upstream CI: none, for any architecture.** This was independently confirmed this cycle by direct inspection of the actual `git.kernel.org` repository tree (fetched via `curl` through the agent proxy after WebFetch 403'd, HTTP 200, authoritative upstream, not a mirror). The root tree contains exactly:
```
.gitignore  Documentation/  LICENSES/  Makefile  Makefile.meson  README
check-manpages.sh  include/  libtraceevent.pc.template  meson.build
meson_options.txt  plugins/  samples/  scripts/  src/  test.c  utest/
```
No `.github/` directory, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.travis.yml`, no `.cirrus.yml`, no buildbot config. The one plausible location for a build-automation script, `scripts/`, contains only `features.mk`, `utilities.mak`, and `utils.mk` - Makefile helper fragments, not CI definitions. `.gitignore` contains only build-artifact patterns. This was cross-checked against the GitHub mirror (`github.com/rostedt/libtraceevent`), which likewise has no `.github/workflows/` directory.

Because the project has zero CI infrastructure of any kind, it follows trivially that no riscv64 CI, riscv64 runner, or riscv64 test lane exists. The claim that riscv64-specific CI exists for this project is refuted by direct repository inspection.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | None | None | None |
| Debian/Ubuntu buildd | Yes | Yes | Yes (native riscv64 hardware) |
| RISE runners | No | No | No |
| Hardware type (distro buildd) | x86-64 | aarch64 | riscv64 native |

**Debian buildd** is distro packaging infrastructure, not upstream-maintained CI: it compiles every architecture-generic C package for riscv64 as a matter of course. This is a distinct claim from upstream CI and must not be conflated with it.

**RISE runners.** RISE separately operates a "RISE RISC-V Runners" program (announced 2026-03-24) that gives open-source projects access to real RISC-V hardware for GitHub Actions. This is a general RISE infrastructure offering; no evidence was found that libtraceevent uses it or has been onboarded to it.

---

## 8. Distribution and Release Status

The library is distributed as a compiled C library through Linux distribution packaging. It is not a Python, npm, or Maven package.

- **PyPI:** `https://pypi.org/pypi/libtraceevent/json` and `https://pypi.org/simple/libtraceevent/` both return HTTP 404. No PyPI project named "libtraceevent" exists, which is expected for a C library with no Python bindings.
- **RISE wheel builder (GitLab mirror):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libtraceevent/` redirects to the same 404'ing PyPI path; the RISE PyPI mirror carries no package by this name. The full 76-package RISE wheel-builder list (`riseproject.gitlab.io/python/wheel_builder/`) does not include libtraceevent.
- **Upstream (git.kernel.org):** source tarballs/tags only (latest `libtraceevent-1.9.0`, Feb 2026); no binary artifacts of any architecture are hosted upstream.

| Distribution | riscv64 status | Version | Notes |
|---|---|---|---|
| Ubuntu 26.04 LTS (resolute) | Available, confirmed by live fetch of packages.ubuntu.com | 1:1.8.7-1 | `libtraceevent-dev`, `libtraceevent1`, `libtraceevent1-plugin` all list riscv64 alongside amd64/arm64/armhf/ppc64el/s390x; `libtraceevent-doc` is arch:all |
| Ubuntu 24.04 LTS (Noble) | Available | 1:1.8.2-1ubuntu2 | All four packages explicitly list riscv64 [NEEDS VERIFICATION - not re-fetched this cycle] |
| Debian sid | Available, build "Installed" | 1:1.9.0-2 reported 2026-06-15 on rv-osuosl-01; a separate reference this cycle cited 1:1.8.4-2 | See version-number discrepancy note, Section 2 |
| Debian stable (bookworm) | Available | 1:1.8.4-2 [NEEDS VERIFICATION - not re-fetched this cycle] | Packages: libtraceevent1, libtraceevent1-plugin, libtraceevent-dev |
| Alpine Linux edge/main | Available | 1.9.0-r0 [NEEDS VERIFICATION - not re-fetched this cycle] | Built 2026-02-05 |
| Gentoo | Available | ~riscv keyworded Dec 2022 | Tested on HiFive Unmatched, [bugs.gentoo.org/887821](https://bugs.gentoo.org/887821) |
| Arch Linux RISC-V (archriscv.felixc.at) | Not applicable - no standalone package | - | The `.status/status.htm` table (~thousands of rows, fetched directly this cycle) contains zero `libtraceevent` or `*trace*` entries. Arch most plausibly does not ship libtraceevent as a standalone binary package, statically linking it into consumers such as trace-cmd/perf instead, so the archriscv port has nothing to track |
| Fedora/RHEL riscv64 | Data not available: not confirmed from sources searched | - | [NEEDS VERIFICATION] |

**Ubuntu MIR process.** Two Launchpad bugs track libtraceevent's promotion to Ubuntu `main`: [#2009715](https://bugs.launchpad.net/ubuntu/+source/libtraceevent/+bug/2009715) and [#2051916](https://bugs.launchpad.net/ubuntu/+source/libtraceevent/+bug/2051916) ("[MIR] promote libtraceevent as a trace-cmd dependency"). Both list riscv64 as a fully supported, successfully-building architecture with no riscv64-specific defects noted, and both are architecture-agnostic archive-admin process bugs, not riscv64-specific issues. Neither mentions RISE or attributes riscv64 support to RISE-funded work.

**Installed-size and dbgsym notes carried from prior review cycles, not re-verified this cycle [NEEDS VERIFICATION]:** riscv64 packages in Debian sid were reported to install at roughly 1,867 KB versus roughly 284 KB on amd64/arm64 (cause not determined); the riscv64 dbgsym package in sid was reported trailing the main package by two minor versions (via debports).

**What a user must do.** On Debian or Ubuntu, `apt install libtraceevent-dev` is sufficient. No source builds, patches, or workarounds are required on riscv64.

---

## 9. Dependencies

Source basis for this section: direct read of `Makefile`, `meson.build`, `meson_options.txt`, `libtraceevent.pc.template`, `README`, `Documentation/Makefile`, and `utest/meson.build` from `git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git` (fetched via `curl` through the proxy after WebFetch 403'd on this host). The runtime link line in the Makefile is `LIBS ?= -ldl` - the only runtime library dependency, and `-ldl` has been part of glibc itself since glibc 2.34, not a separate package. `libtraceevent.pc.template` has no `Requires:` field at all, confirming no other external runtime dependency.

Note on tooling: the `project-graph` MCP server was unavailable for this entire research cycle (`CONNECTION_CLOSED` on every connection attempt), so no graph-based riscv64 availability cross-check could be run for any dependency below. This is a tooling gap, not a negative result, and is noted per dependency rather than treated as "not found."

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc | Runtime-dependency, critical | Pass - riscv64 is a mature, Tier-1-equivalent glibc upstream port, ships in every riscv64 Linux distro | N/A (base libc, always present) | Released | Only symbol actually used is `-ldl`-class (merged into libc proper since glibc 2.34). See `project-reports/glibc.md` for the dedicated glibc status assessment |
| GCC | Build-dependency, critical (default Makefile path) | Pass - riscv64 GCC backend is mature and packaged on every major distro | N/A | Released | No minimum GCC version is declared anywhere in the repository (Section 5); any GCC supporting `-std=gnu99` works |
| GNU make | Build-dependency, critical (default Makefile path) | Pass - universal toolchain component | N/A | Released | The primary, Debian-packaging-used build path; no arch-specific Make features are used |
| Meson | Build-dependency, optional (alternate build path) | Pass - Meson is a pure-Python build generator; riscv64 support is a function of Python + Ninja, not native code | N/A | Released | `meson_version: '>= 0.58.0'` is required; no riscv64 cross-file ships in-tree (Section 5) |
| Ninja | Build-dependency, optional (paired with the Meson path) | Pass - small C++ build executor, routinely built for riscv64 across distros | N/A | Released | No native/arch-specific Ninja code paths are exercised by this project |
| pkg-config | Build-dependency, optional | Pass - universally packaged (`pkg-config`/`pkgconf`) across riscv64 distro ports | N/A | Released | Used by the Makefile to locate the pc-file install directory; absence prints a warning ("Failed to locate pkg-config directory") rather than failing the core `make` target |
| CUnit | Test-dependency, optional | Pass where packaged (Debian sid riscv64 shipped 2.1-3-dfsg-2.7+b2) [NEEDS VERIFICATION - not re-fetched this cycle] | `dependency('cunit', required: false)` in meson.build; the `utest/` unit-test subdir and `trace-utest` binary simply do not build/run if CUnit is absent - soft dependency, not a hard test blocker | Released | Debian bug [#1136394](https://bugs.debian.org/1136394): CUnit needs a new maintainer upstream in Debian - low risk to libtraceevent, which does not ship or statically link CUnit |
| asciidoc / asciidoctor | Docs-dependency, optional (additional, found via research - not in the required direct-dependency list) | N/A - pure text-processing tool, no architecture-specific code | N/A | N/A | Gates only `Documentation/` man-page/HTML generation via the `doc` meson option or explicit `make -C Documentation`; `Documentation/Makefile` hard-codes `ASCIIDOC=asciidoc` (or `asciidoctor` via `USE_ASCIIDOCTOR`) with explicit `missing_tools` detection |
| xmlto (or docbook-xsl + xsltproc) | Docs-dependency, optional (additional, found via research) | N/A | N/A | N/A | Paired with asciidoc for man-page generation; same gating as above |

**Downstream consumer note.** libtracefs depends on libtraceevent; Alpine edge/community riscv64 has shipped libtracefs 1.8.3-r0 with `so:libtraceevent.so.1` as a runtime dependency, with no riscv64-specific failures reported [NEEDS VERIFICATION - not re-fetched this cycle].

**No in-scope project is a direct dependency of libtraceevent** beyond glibc. The dependency graph is unusually lean, with no JIT backends, SIMD intrinsics, or crypto components anywhere in the dependency chain that would require architecture-specific porting.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64-specific | Notes |
|---|---|---|---|---|---|
| [Debian #1105512](https://bugs.debian.org/1105512) | Build fails with `make --shuffle=reverse` - linker cannot open output file because `lib/` dir creation is ordered after the link step | Open | Minor | No | Affects all architectures |
| [Debian #1047752](https://bugs.debian.org/1047752) | Fails to rebuild from source after an initial build - `make clean` does not remove utest binaries and generated .m files | Open | Minor | No | Causes a dpkg-source failure on second build |
| [uftrace #1855](https://github.com/namhyung/uftrace/issues/1855) | pkg-config detection of libtraceevent fails on VisionFive 2 (riscv64); uftrace's configure reports `libtraceevent: [ OFF ]` despite the package being installed | Open | Medium | Yes - observed only on riscv64 hardware | Affects downstream consumer uftrace, not libtraceevent itself; likely a pkg-config path issue on that board; no upstream fix confirmed |
| [Gentoo #887821](https://bugs.gentoo.org/887821) | libtraceevent 1.7.0 not keyworded for riscv | Resolved, Dec 2022 | Low | Yes | Yixun Lan tested on a HiFive Unmatched board, added the ~riscv keyword same day |
| Debian riscv64 build, 1:1.5.3-1 | "Maybe-Failed" result on rv-mullvad-02 (2022-04-22) | Resolved | Low | Yes (historical) | Immediately retried successfully; all subsequent versions build cleanly [NEEDS VERIFICATION - not re-confirmed this cycle] |

**No correctness bugs were found.** No upstream issue tracker (lore.kernel.org, patchwork, the GitHub mirror) contains any riscv64-specific correctness report; the GitHub mirror `rostedt/libtraceevent` has zero open issues in total, and searches for "riscv" across its issues, pull requests, and code all returned zero matches.

**Benchmark data on riscv64.** No source publishes libtraceevent-specific performance numbers on riscv64. This was checked this cycle via WebSearch query variants, a full parse of the riseproject.dev blog archive (35 posts), and GitHub-native search for benchmark repositories - none surfaced riscv64-vs-arm64 or any other libtraceevent-specific timing data. Two tangential, non-libtraceevent data points exist:
- [Nuclei-Software/nuclei-linux-sdk issue #26](https://github.com/Nuclei-Software/nuclei-linux-sdk/issues/26) (Aug 2024): `perf` (which links against libtraceevent 1.8.3) was cross-built for a Nuclei RV64 processor and used to profile a CoreMark workload (951.5M cycles, 1.22B instructions, IPC 1.28). This measures application performance using `perf` as the measurement tool, not libtraceevent's own parsing performance.
- An unrelated paper on long-term kernel/hardware event monitoring (arXiv 2601.10572) reports generic `ftrace_ops` overhead on a SpacemiT K1 (RISC-V) of roughly 13ns (no tracers) up to roughly 588ns (10 tracers). This measures ftrace overhead generically, not libtraceevent, and is not sourced from riseproject.dev.

No libtraceevent-specific latency, throughput, or parsing-speed benchmark on riscv64 exists in any publicly indexed source found.

---

## 12. Objections and Upstream Blockers

**No objections or technical blockers exist.** The library requires no riscv64-specific code and no upstream changes. There is no documented resistance from maintainers to riscv64-related work, because none has ever been proposed or needed - confirmed by the complete absence of riscv-tagged threads on linux-trace-devel, zero riscv-matching GitHub issues/PRs, and zero riscv commits across the project's history.

**RISE membership and working-group detail** (fetched from `riseproject.dev` and `riseproject.dev/members/` this cycle):
- Premier members: Alibaba Damo (Hangzhou) Technology Co., Ltd.; Google LLC; MediaTek Inc; NVIDIA Corporation; Qualcomm Technologies, Inc.; Red Hat LLC; SiFive; Tenstorrent.
- General members: Akeana; Andes Technology Corporation; Beijing ESWIN Computing Technology Co., Ltd.; Beijing Institute of Open Source Chip; Canonical Group Limited; Douyin Vision Co., Ltd.; Institute of Software, Chinese Academy of Sciences; Microchip Technology Inc.; NextSilicon; Quintauris GmbH; SpacemiT (Hangzhou) Technology Co. Ltd; ZTE Corporation; plus AMD and ByteDance noted in prior sweeps [NEEDS VERIFICATION].
- RISE organizes work into Working Groups (each with a GitHub repo under `github.com/riseproject-dev`): Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulator/Emulators, System Firmware, Security Software, AI/ML, Microcontroller Software. The System Libraries WG tracks projects such as xsimd, SLEEF, Eigen, dav1d, XNNPack, libjpeg-turbo, x265, OpenBLAS, libopus, and FFmpeg; the Kernel & Virtualization WG tracks tracing-adjacent items such as "Perf CTR support," "bpftrace status evaluation," and "Perf event discovery/encoding." **libtraceevent is not tracked by name in either group.**
- RISE's membership model is corporate, not per-project; there is no "member projects" registry, and libtraceevent appears nowhere in RISE's member materials, working-group pages, or blog archive (Section 1).

The only gap relative to other architectures is the total absence of upstream CI infrastructure, which applies equally to every architecture, not specifically riscv64 (Section 7). Proposing riscv64-specific CI to a project with no CI at all would first require convincing the maintainer (Steven Rostedt, Google) to adopt any CI system for the project; there is no precedent in the project's history for automated testing infrastructure of any kind.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project (a portable C trace-event parsing library with no architecture-differentiated performance paths, per Section 4), so no optimization-level rating applies.
- **Justification:** libtraceevent has no upstream CI of any kind - no GitHub Actions, GitLab CI, Jenkins, or Travis configuration anywhere in the repository tree at [git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) - which alone would place it at orange. The distribution floor upgrades it to yellow: Debian, Ubuntu (including 26.04 "resolute," confirmed at version 1:1.8.7-1 for riscv64 via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libtraceevent&suite=resolute&searchon=names&section=all)), Gentoo, and Alpine all build riscv64 packages from unmodified upstream source, with no riscv-specific patches found in any packaging repository or upstream commit history.
- **Pending work that could change the grade:** none identified. No open PR, patch, or tracking issue for a riscv64 port exists anywhere (Section 2), and no RISE involvement of any kind was found (Sections 1 and 12). The grade is stable absent a change in the project's CI posture (which would require the project to adopt CI at all, for any architecture) or a change in distro packaging status.

---

## 14. Investment Analysis

Before sizing any item: RISE has funded nothing for this project (Section 12), so no item below is already covered by external investment.

### 14.1 Functional Enablement

No functional enablement work is needed. The library builds and runs correctly on riscv64 with no patches and no missing features relative to amd64 or arm64 (Sections 4 and 6).

### 14.2 Performance Optimization

No performance optimization work is applicable. The library performs byte-level parsing of binary trace data; there are no vectorizable loops, no hot arithmetic paths, and no plausible use case where riscv64-specific intrinsics or assembly would yield measurable improvement (Section 4). No optimization-specific benchmark data exists to motivate such work in any case (Section 11).

### 14.3 CI/CD Infrastructure

The project has no upstream CI for any architecture (Section 7). Adding riscv64 CI would require introducing CI infrastructure to the project from zero - this is a project-maturity gap, not a riscv64-specific gap. If CI investment is desired here, the correctly scoped work item is "add CI for all architectures including riscv64," not "add riscv64 to an existing pipeline." The uftrace pkg-config detection failure on VisionFive 2 ([#1855](https://github.com/namhyung/uftrace/issues/1855)) is a low-cost downstream investigation, but it does not affect libtraceevent itself and should not be sized against this project's budget.

### 14.4 Ecosystem Enablement

Not applicable. libtraceevent has no dependent package ecosystem (PyPI, npm, Maven, or similar) requiring separate riscv64 enablement; confirmed this cycle by the absence of any PyPI project (404) and absence from the RISE wheel-builder's 76-package list.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None applicable | 0 | N/A | N/A |
| CI/CD | Investigate and fix uftrace pkg-config detection on riscv64 hardware (uftrace #1855) | 0.5 | Downstream consumer (uftrace), not libtraceevent | Low |
| CI/CD | Add upstream CI for libtraceevent (all architectures, not riscv64-specific) | 2-3 | Steven Rostedt (Google) coordination via linux-trace-devel | Low |
| Ecosystem | None required | 0 | N/A | N/A |

**Assessment.** libtraceevent requires zero investment to achieve full riscv64 support. It already works correctly and ships in all major distributions, including the current Ubuntu 26.04 release. The only actionable item is the pkg-config detection issue in uftrace, a 0.5 person-week investigation scoped to a different project. Upstream CI is a project-maturity gap affecting all architectures equally and is not a riscv64 investment item.

---

## 15. References

- [libtraceevent canonical repository (git.kernel.org)](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git)
- [libtraceevent GitHub mirror (rostedt/libtraceevent)](https://github.com/rostedt/libtraceevent)
- [trace-cmd.org - actual project homepage](https://www.trace-cmd.org/)
- [Ubuntu packages: libtraceevent, resolute (26.04)](https://packages.ubuntu.com/search?keywords=libtraceevent&suite=resolute&searchon=names&section=all)
- [Debian package tracker: libtraceevent](https://tracker.debian.org/pkg/libtraceevent)
- [Debian buildd status: libtraceevent sid](https://buildd.debian.org/status/package.php?p=libtraceevent&suite=sid)
- [Debian bug #1105512: libtraceevent fails to build with make --shuffle=reverse](https://bugs.debian.org/1105512)
- [Debian bug #1047752: libtraceevent fails to rebuild from source](https://bugs.debian.org/1047752)
- [Debian bug #1136394: CUnit needs a new maintainer](https://bugs.debian.org/1136394)
- [Gentoo bug #887821: libtraceevent 1.7.0 not keyworded for riscv](https://bugs.gentoo.org/887821)
- [uftrace issue #1855: libtraceevent pkg-config detection fails on VisionFive 2](https://github.com/namhyung/uftrace/issues/1855)
- [Nuclei-Software nuclei-linux-sdk issue #26: perf cross-build with libtraceevent on RV64](https://github.com/Nuclei-Software/nuclei-linux-sdk/issues/26)
- [Launchpad bug #2009715: Ubuntu MIR for libtraceevent](https://bugs.launchpad.net/ubuntu/+source/libtraceevent/+bug/2009715)
- [Launchpad bug #2051916: Ubuntu MIR, promote libtraceevent as a trace-cmd dependency](https://bugs.launchpad.net/ubuntu/+source/libtraceevent/+bug/2051916)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [archriscv.felixc.at package status table](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: libtraceevent (404, confirming no Python package exists)](https://pypi.org/pypi/libtraceevent/json)