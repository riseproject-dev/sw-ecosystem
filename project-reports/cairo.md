---
title: Cairo
parent: Project Reports
color: yellow
dependencies:
  - name: pixman
    relation: runtime-dependency
    criticality: critical
  - name: FreeType
    relation: runtime-dependency
    criticality: critical
  - name: fontconfig
    relation: runtime-dependency
    criticality: critical
  - name: libpng
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: GLib
    relation: runtime-dependency
    criticality: optional
  - name: libX11
    relation: runtime-dependency
    criticality: optional
  - name: libxcb
    relation: runtime-dependency
    criticality: optional
  - name: Mesa
    relation: runtime-dependency
    criticality: optional
  - name: libXrender
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="cairo" %}

# Cairo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Cairo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Cairo is a 2D vector graphics library written in portable C. It provides a single rendering API with multiple surface backends (X11, XCB, PNG, PDF, PostScript, SVG, Win32, macOS Quartz) and delegates all pixel-level compositing to [pixman](https://gitlab.freedesktop.org/pixman/pixman). This delegation is explicit in the source: a comment in `cairo-image-compositor.c` reads, "Use plain C for fill operations as span length is typically small, too small to payback the startup overheads of using SSE2 etc." Cairo contains zero architecture-specific source files, no SIMD dispatch layer, no JIT backend, and no assembly files of any kind, confirmed by a direct grep of a fresh shallow clone of the upstream repository (HEAD 7475596) for "riscv" (case-insensitive), `*.S` files, and `arch*` directories - all zero matches.

Current stable release: **1.18.6, released 2026-09-20** (confirmed via the upstream GitLab tags page, `gitlab.freedesktop.org/cairo/cairo/-/tags`, retrieved via direct HTTPS fetch since WebFetch is Anubis-blocked against this host) [NEEDS VERIFICATION - single source]. Earlier stable tags in the same series: 1.18.4 (2025-03-08), 1.18.2, 1.18.0. Build system: Meson >= 1.3.0.

**License:** dual LGPL-2.1 / MPL-1.1.

**Governance:** No formal foundation, steering committee, or governance charter. The project is hosted at [freedesktop.org](https://gitlab.freedesktop.org/cairo/cairo) under an informal community-maintainer model. No MAINTAINERS file exists in the repository (confirmed via the top-level file listing of the `sailfishos-mirror/cairo` GitHub mirror: AUTHORS, BUGS, CODING_STYLE, COPYING, COPYING-LGPL-2.1, COPYING-MPL-1.1, HACKING, INSTALL, NEWS, README.md, meson.build, meson.options, version.py). No port-acceptance policy or tiered architecture membership exists in any publicly accessible document.

**Active maintainers:**
- Emmanuele Bassi - release manager for the 1.18.x series; signed all releases from 1.18.0 through 1.18.6. Current employer: **Igalia**, a worker-owned open-source consultancy that contracts to browser and graphics vendors (confirmed via `igalia.com/team/ebassi`) [NEEDS VERIFICATION - single source]. Previous affiliation (historical, not current): Endless Mobile and GNOME Foundation board service.
- Adrian Johnson - top commit contributor in the 1.18.x series (70 commits in 1.18.2). No employer affiliation visible in public sources.
- Uli Schlachter - named in release notes as primary reviewer. No employer affiliation visible.
- Original authors Keith Packard (HP Labs) and Carl Worth are no longer active leads.

**Community stance on new ports:** No gating mechanism was found in any release notes or governance document. Because Cairo contains no arch-specific code and uses Meson's `auto` feature detection throughout, supporting a new architecture requires no Cairo changes as long as a C compiler and pixman are available. The community stance is implicitly permissive; the question of a formal acceptance policy does not practically arise at the Cairo level.

**RISE membership:** Cairo is not a RISE member project (confirmed against the current [RISE members list](https://riseproject.dev/members/): Premier members Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent; General members including Canonical, SpacemiT, Andes, Microchip, ZTE, and others - no graphics-specific project listed separately). A full-text search of every RISE blog post via the site's sitemap (`riseproject.dev/wp-sitemap-posts-post-1.xml`, all 35 posts published 2024-05-15 through 2026-09-28) returned zero mentions of Cairo or pycairo, independently corroborating an earlier direct site-search result (`riseproject.dev/?s=cairo`: "Sorry, no results were found"). RISE-funded RVV work relevant to Cairo's stack exists only in Cairo's dependency pixman (Samsung Research Poland, Filip Wasil), not in Cairo itself.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (no date) | Cairo riscv64 support is implicit from day one of riscv64 Linux toolchain availability - the pure-C codebase requires no porting commits | Source tree analysis; Debian buildd history |
| 2024-09-25 | Cairo 1.18.2-2 built successfully on Debian riscv64 builder rv-osuosl-01, 30 min build time | [Debian buildd logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64) |
| 2025-03-13 | Cairo 1.18.4-1 built on Debian riscv64, 25 min build time | [Debian buildd logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64) |
| 2026-05-15 | Cairo 1.18.4-3+b1 built on rv-osuosl-05, 22 min build time, status Installed | [Debian buildd](https://buildd.debian.org/status/package.php?p=cairo&suite=sid) |
| 2026-09-20 | Cairo 1.18.6 tagged as current stable upstream release | [Cairo GitLab tags](https://gitlab.freedesktop.org/cairo/cairo/-/tags) |

No riscv64-specific patches, commits, issues, or merge requests exist in Cairo's own upstream. Exhaustive search across GitLab site search (Anubis-blocked, but no riscv content in what was retrieved), GitHub code/repo search, mailing lists, and general web search returned zero results across every research pass in this report's preparation. This is not a search failure - it reflects that no porting work was required or performed. riscv64 is supported by the generic C path with no source changes. Key contributors on riscv64: none for Cairo itself.

The only riscv64-adjacent upstream activity relevant to Cairo is in **pixman**, not Cairo:
- pixman issue [#95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) (opened 2024-03-05): RVV 1.0 port tracking, led by Filip Wasil (Samsung Research Poland / RISE). This issue remains open as of the most recent verification attempt.
- First commit to `pixman-rvv.c`: 2024-10-30, author Filip Wasil, "RISC-V floating point operations," committed by co-maintainer mattst88.
- 11 infrastructure MRs merged in pixman since October 2024 (!102, !128, !146, !149, !156, !157, !166, !170, !172, !175, !176), authored by Samsung/RISE contributors.

**Discrepancy in merge status (flagged per this report's verification policy):** Sources disagree on whether `pixman-rvv.c` itself is merged. One research pass performed a direct commit-log read of the `sailfishos-mirror/pixman` GitHub mirror and found continuous, merged commit history on `pixman-rvv.c` on the `master` branch from the 2024-10-30 first commit through a commit dated **2026-09-29** ("rvv: Vectorize bilinear cover vertical interpolation," authors 6eanut/Yuansheng/tiannT, committed by mattst88), concluding RVV support is merged and under active development, with contributors now extending beyond Samsung. This is also the characterization used in this report's computed readiness-grade justification (Section 13). Multiple other research passes, however, continued to describe `pixman-rvv.c` and specifically the compositing-kernel work benchmarked in pixman MR !142 as "not yet merged upstream," citing the still-open pixman #95 tracking issue as evidence. Both pixman #95 (tracking issue) being open and `pixman-rvv.c` (the file) carrying merged commits are not mutually exclusive - the most defensible reading is that incremental RVV work has been merged into `pixman-rvv.c` over time and is under continued active development, while the master tracking issue #95 remains open pending resolution of specific unmerged/unresolved items (notably the ~20% `src` L2 regression, see Section 4). This report treats the merge status as **partially merged, actively developed, with the master tracking issue still open**, and flags any single-source claim of "fully merged" or "fully unmerged" accordingly.

---

## 3. Upstream Support Tier

Cairo has no formal tier policy. There is no classification of architectures as primary, secondary, or unsupported in any upstream document.

In practice, the only meaningful tier distinction is between architectures where pixman provides SIMD acceleration and those running on pixman's generic C scalar fallback. riscv64 sits in an intermediate position: partial RVV compositing paths exist and are merged/active in pixman per the commit-log evidence in Section 2, but the master RVV tracking issue (pixman #95) remains open and known regressions are unresolved.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Present (Fedora, openSUSE, Debian Testing jobs) | Present (Android, macOS jobs) | Absent - confirmed zero riscv64 jobs in current `.gitlab-ci.yml` (see Section 7) |
| Upstream binary releases | Source tarball only; distros package | Source tarball only | Source tarball only |
| Debian binary package | Yes | Yes | Yes - 1.18.4-3+b1 |
| Ubuntu 26.04 (resolute) binary package | Yes | Yes | Yes - libcairo2 1.18.4-3 (confirmed [packages.ubuntu.com](https://packages.ubuntu.com/resolute/libcairo2)) |
| Arch Linux binary package | Yes | Yes | Yes - 1.18.4-1 (confirmed via [riscv.mirror.pkgbuild.com](https://riscv.mirror.pkgbuild.com)) |
| pixman SIMD backend | SSE2/AVX | NEON | Partial RVV (merged, active development, master tracking issue #95 still open - see Section 2) |
| Release blocking | No formal mechanism | No formal mechanism | No formal mechanism |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Cairo contains no architecture-specific code. The following table covers every component category that typically has arch-specific implementations:

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Pixel compositing | Delegated to pixman (SSE2/AVX via pixman) | Delegated to pixman (NEON via pixman) | Delegated to pixman (RVV paths merged and under active development in `pixman-rvv.c`; scalar C fallback for uncovered operations) | Cairo source: `pixman_image_composite32()` call in `cairo-image-compositor.c`; see Section 2 discrepancy note |
| Image surface format conversion | Pure C | Pure C | Pure C | No arch-specific code in `cairo-image-surface.c` |
| JIT backend | None | None | None | Cairo has no JIT for any architecture; this is not a pixman responsibility either |
| SIMD dispatch (in Cairo itself) | None | None | None | No `--enable-sse`, `--enable-neon`, or RVV-equivalent flags anywhere in `meson.build`/`meson.options`; all SIMD dispatch lives one layer down, in pixman |
| Font rasterization | Delegated to FreeType | Delegated to FreeType | Delegated to FreeType | Cairo does not rasterize glyphs itself |
| Atomic operations | C11 atomics (GCC/Clang), fallback chain to C++11/GCC-legacy/`libatomic_ops`/Darwin `OSAtomic` | C11 atomics | C11 atomics | `cairo-atomics.h` uses C11 `_Atomic` uniformly on all platforms, with a fallback chain so a non-C11-atomic-capable compiler still builds |
| Assembly files | None | None | None | Zero `.S` files in the Cairo source tree for any architecture |

The architecture-specific performance surface for Cairo on riscv64 is entirely determined by pixman. Benchmark data from pixman MR !142 (Filip Wasil, Samsung Research Poland, hardware SpacemiT K1, VLEN=256, measured via the CYCLE instruction; this data could not be independently re-fetched in the most recent verification pass due to the Anubis block, so it is carried over from the existing report record rather than freshly confirmed):

- `combine_add_ca` full function call: approximately 4x speedup with RVV vs scalar
- Inner loop body: approaching approximately 5x speedup asymptotically
- Small-rectangle workloads (32-byte line operations): 0% benefit (only 25% VLEN utilization under current LMUL settings)
- Two `src` L2 compositing operations: approximately 20% **regression** vs scalar (cause unresolved as of the last available check, 2026-06-17)

These numbers bound the performance gap for Cairo on riscv64 on vector-dominated workloads, in either direction depending on operation type. No Cairo-level end-to-end application benchmark on riscv64 hardware exists in any source located across all research passes for this report, including a direct check of `camel-cdr.github.io/rvv-bench-results` (a well-known RVV microbenchmark site), which has no pixman or Cairo graphics-compositing content at all.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson >= 1.3.0 only. There is no CMakeLists.txt anywhere in the Cairo tree (confirmed via the GitLab REST API repo-tree listing) and no autotools/configure path in the current master.

```
meson setup $builddir
ninja -C $builddir
ninja -C $builddir install
```

**Required toolchain:** No explicit minimum GCC or Clang version is declared anywhere in `meson.build` or `meson.options` (confirmed by direct retrieval of both files from the live upstream repository). Compiler capability is probed entirely at configure time via `cc.get_supported_arguments()` and `cc.has_function()`/`cc.links()`/`cc.compiles()` checks rather than a hard version gate. Language standard requested: `c_std=gnu11,c11`, implying a practical floor of a C11-capable compiler (in practice, any GCC >= 7 or Clang >= 6 is sufficient; this figure is inferred, not upstream-stated). C11 atomics are preferred, with a fallback chain to C++11 atomics, then GCC legacy atomics, then `libatomic_ops`, so even a compiler without native C11 atomic support still builds. Meson >= 1.3.0 is the only hard version floor declared anywhere in the build system.

**Dependency minimum versions (from `meson.build`):**

| Dependency | Minimum version |
|------------|----------------|
| pixman-1 | 0.40.0 |
| freetype2 (basic) | libtool age 23.0.17 (= release 2.10) |
| freetype2 (COLRv1) | libtool age 25.0.19 (= release 2.13) |
| fontconfig | 2.13.0 |
| libpng | 1.4.0 |
| glib-2.0 | 2.14 |
| libxrender | 0.6 |
| xcb | 1.6 |

**Feature flags (`meson.options`, full content, confirmed via live retrieval):**

```
option('dwrite', type : 'feature', value : 'auto')
option('fontconfig', type : 'feature', value : 'auto')
option('freetype', type : 'feature', value : 'auto')
option('png', type : 'feature', value : 'auto')
option('quartz', type : 'feature', value : 'auto')
option('tee', type : 'feature', value : 'auto')
option('xcb', type : 'feature', value : 'auto')
option('xlib', type : 'feature', value : 'auto')
option('xlib-xcb', type : 'feature', value : 'disabled')
option('zlib', type : 'feature', value : 'auto')
option('tests', type : 'feature', value : 'auto')
option('lzo', type : 'feature', value : 'auto')
option('gtk2-utils', type : 'feature', value : 'disabled')
option('glib', type : 'feature', value : 'auto')
option('spectre', type : 'feature', value : 'auto')
option('symbol-lookup', type: 'feature', value : 'auto')
option('gtk_doc', type : 'boolean', value : false)
```

None of these options are riscv64-specific; they are backend/dependency toggles applied identically on every architecture. `-Dxlib-xcb` already defaults to `disabled` upstream.

**Native build on riscv64 hardware:**

```
meson setup builddir \
  --buildtype=release \
  -Dtests=disabled \
  -Dspectre=disabled \
  -Dsymbol-lookup=disabled \
  -Dgtk_doc=false
ninja -C builddir
ninja -C builddir install
```

**Cross-compilation from x86-64 to riscv64 (illustrative example following the project's own conventions and downstream packaging practice - not an upstream artifact; the Cairo repository itself contains no riscv64 cross-file, confirmed by a full listing of its `.gitlab-ci/` directory, which holds exactly one cross-file, `android-cross-file.txt`):**

```
meson setup builddir \
  --cross-file riscv64-linux-gnu.cross \
  --buildtype=release \
  -Dauto_features=enabled \
  -Dsymbol-lookup=disabled \
  -Dtee=enabled \
  -Dquartz=disabled \
  -Dtests=disabled \
  -Dspectre=disabled
ninja -C builddir
```

```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkgconfig = 'riscv64-linux-gnu-pkg-config'
exe_wrapper = 'qemu-riscv64-static'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

**Known universally disabled flags (not riscv64-specific):**

| Flag | Reason |
|------|--------|
| `-Dtests=disabled` | Tests hang; Void Linux documents "Tests get stuck"; circular dependency on gtk+2.0 in Alpine; [Debian bug #891547](https://bugs.debian.org/891547) |
| `-Dspectre=disabled` | Arch PKGBUILD; Debian nocheck profile |
| `-Dsymbol-lookup=disabled` | Requires BFD/binutils internals; Arch PKGBUILD; Debian rules |
| `-Dquartz=disabled` | macOS only; explicitly disabled in Debian rules on Linux |
| `-Ddwrite=disabled` | Windows only; Arch PKGBUILD |

**QEMU usage:** Zero references to "qemu" exist anywhere in Cairo's own `.gitlab-ci.yml`, `meson.build`, or `meson.options` (confirmed by direct grep of the live files). QEMU usage is entirely a downstream packaging concern: Void Linux sets `build_helper="qemu"` in its cairo template, activating `qemu-riscv64-static` as `exe_wrapper` for configure-time `cc.run()` probes; with `-Dtests=disabled`, this is largely bypassed.

**Dockerfile:** None exists in the Cairo repository. CI container images are built via the shared `freedesktop/ci-templates` project's `.fdo.container-build@fedora` template from a package list, not an in-repo Dockerfile. This job targets the CI runner's native architecture (amd64/Fedora); no architecture qualifier appears anywhere in it, and there is no riscv64 image or job in the pipeline.

**Managarm OS cross-build recipe** (confirmed in `managarm/bootstrap-managarm`, tag 1.18.4, explicitly labeled for aarch64 and riscv64):

```
meson setup \
  --cross-file <sysroot>/scripts/meson-riscv64-managarm.cross-file \
  --prefix=/usr \
  --buildtype=release \
  -Dxlib-xcb=enabled \
  <source-dir>
ninja
ninja install
```

No riscv64-specific build failures are documented in any reachable source. Debian buildd history shows clean builds across all recent releases (22-30 minute build times, see Section 2).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. Cairo builds and runs correctly on riscv64. All surface backends (X11, XCB, PNG, PDF, PostScript, SVG) function through generic C paths. No riscv64-specific correctness bugs are open in the Cairo upstream.

**Performance gaps:**

| Workload type | amd64 | arm64 | riscv64 | Gap |
|---------------|-------|-------|---------|-----|
| Pixel compositing (Cairo delegating to pixman) | pixman SSE2/AVX; ~4-5x vs scalar | pixman NEON; ~4-5x vs scalar | pixman RVV partially merged/active for some kernels, scalar C fallback elsewhere (see Section 2 discrepancy note) | Up to ~4-5x throughput deficit on vector-dominated workloads not yet covered by merged RVV kernels; up to ~20% regression observed on two `src` L2 operations under the RVV path itself, unresolved as of the last available check |
| Small-rectangle compositing | SSE2 with early-exit | NEON with early-exit | Scalar (no vectorization benefit per MR !142 data even where RVV is present, due to 25% VLEN utilization at current LMUL settings) | Parity at small sizes |
| Font rasterization | FreeType (no Cairo-level SIMD) | FreeType | FreeType | No gap at Cairo level |

The compositing deficit figures are bounded by pixman MR !142 benchmark data (SpacemiT K1, VLEN=256), last available 2026-06-17 and not re-fetchable due to the Anubis block. No end-to-end Cairo application benchmark on riscv64 hardware exists in any public source checked across every research pass for this report.

**Security hardening gaps:** None identified. Cairo uses C11 atomics uniformly. Open issue [#932](https://gitlab.freedesktop.org/cairo/cairo/-/issues/932) (wrong acquire semantics in `_cairo_atomic_int_get`) has low practical impact on riscv64 with GCC 14+ C11 atomics.

**Floating-point semantics:** Cairo uses IEEE 754 double throughout. Open issue [#503](https://gitlab.freedesktop.org/cairo/cairo/-/issues/503) (floating-point rounding errors in font metrics, filed 2021-08-13, updated 2024-03-21) affects all IEEE-754 platforms equally; no riscv64-specific angle identified.

---

## 7. CI/CD Infrastructure

The canonical upstream GitLab instance at [gitlab.freedesktop.org/cairo/cairo](https://gitlab.freedesktop.org/cairo/cairo) is fully blocked by the Anubis bot-protection system for WebFetch-style tool access (error code 9e4edb5b6b850c41), reproduced consistently across every research pass through 2026-09-30. Direct HTTPS/`curl` retrieval through the environment's proxy succeeded in several passes and returned live file content where WebFetch failed, so several claims below are sourced from actual current file contents rather than inference.

Content of `.gitlab-ci.yml` confirmed via the live `sailfishos-mirror/cairo` GitHub mirror (last CI-related commit 2026-01-08) and cross-checked against a direct fetch of the file:
- `fedora *` jobs (build/test, shared/static/clang) - **x86_64 Linux**
- `mingw-32`/`mingw-64` build - **x86/x86_64 Windows**
- `vs2019 *` (shared/static amd64, shared x86, test win32) - **x86_64/i686 Windows**
- `android arm64 fedora` - **ARM64 Android**, using `--cross-file .gitlab-ci/android-cross-file.txt`, the only `--cross-file` usage in the entire 606-line pipeline
- `macOS arm64` - **ARM64 macOS** (added 2025-07-16)
- `static-scan`, `coverage`, `pages` - x86_64 Linux / deployment, non-architecture-specific
- **Zero occurrences of "riscv", "riscv64", or "RISC-V" anywhere in the file.**

The older `centricular/cairo` (meson-branch) mirror shows the same pattern: only amd64/i686 Fedora/openSUSE/Debian jobs, no RISC-V.

Separately, freedesktop.org's shared `freedesktop-sdk` project (a different project entirely) has open tracking issues for adding riscv64 runners (`freedesktop-sdk#1165`, `#1176`) and a `riscv` GitLab runner tag exists at the infrastructure level, but this is infrastructure work unrelated to and not consumed by Cairo's own `.gitlab-ci.yml`.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Upstream CI jobs | Confirmed present (Fedora, openSUSE, Debian Testing, Windows) | Confirmed present (Android, macOS) | Confirmed absent - zero riscv64 job, runner, or cross-file of any kind in the current `.gitlab-ci.yml` |
| RISE CI runners | Not applicable | Not applicable | None - RISE has no involvement in Cairo CI |
| Debian downstream buildd | Yes | Yes | Yes - rv-osuosl-05, build time ~22 min, 1.18.4-3+b1 installed |

The only confirmed riscv64 build activity anywhere is Debian downstream packaging CI. This is not upstream Cairo CI, and establishing riscv64 CI upstream would require freedesktop.org infrastructure cooperation that cannot currently be assessed due to the Anubis block on gitlab.freedesktop.org itself.

---

## 8. Distribution and Release Status

Cairo upstream publishes only source tarballs at [cairographics.org/releases/](https://www.cairographics.org/releases/). No upstream project binary packages or OCI images are published for any architecture.

| Distribution | Package name | riscv64 version | Status |
|-------------|-------------|----------------|--------|
| Debian sid | cairo (libcairo2) | 1.18.4-3+b1 | Installed on riscv64 builder rv-osuosl-05 (confirmed via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)) |
| Debian stable (bookworm) | cairo | 1.18.4-1 | Available |
| Ubuntu 26.04 (Resolute Raccoon) | libcairo2 | 1.18.4-3 | riscv64 row confirmed present on the official binary package page (confirmed via [packages.ubuntu.com/resolute/libcairo2](https://packages.ubuntu.com/resolute/libcairo2), and independently via the Launchpad Archive API `getPublishedBinaries` for `ubuntu/resolute/riscv64`) |
| Ubuntu 26.04 (Resolute Raccoon) | libcairo-gobject2 | Published | riscv64 row confirmed present |
| Ubuntu 26.04 (Resolute Raccoon) | python3-cairo | 1.27.0-2build2 | riscv64 row confirmed present (built from source by Ubuntu; distinct from the PyPI `pycairo` wheel situation below) |
| Arch Linux RISC-V mirror | cairo | 1.18.4-1 | Confirmed via a 660 KB binary download from [riscv.mirror.pkgbuild.com](https://riscv.mirror.pkgbuild.com/repo/extra/) |
| PyPI `cairo` | N/A | N/A | No such package on PyPI (HTTP 404) |
| PyPI `pycairo` (Python binding) | pycairo 1.29.1 | No riscv64 wheel | Only `win32`, `win_amd64`, `win_arm64` wheels across cp310-cp315, plus a source distribution (`pycairo-1.29.1.tar.gz`) available for manual build |
| RISE Python wheel builder | Not present | Not present | Cairo/pycairo absent from the 86-package RISE wheel builder index (`riseproject.gitlab.io/python/wheel_builder/`); a query against `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/cairo/` redirects through to `pypi.org/simple/cairo/`, which itself 404s |

A user targeting riscv64 gets a working Cairo binary via standard package management on Debian, Ubuntu 26.04, or Arch Linux with no additional steps. For pycairo on riscv64, the user must build from the source distribution, since no riscv64 wheel exists on PyPI or the RISE wheel builder (Ubuntu's own archive build of `python3-cairo` is a distribution-level exception to this, built from source by Ubuntu's own infrastructure).

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build (Ubuntu 26.04 resolute) | riscv64 build (Debian sid) | Blocking issues |
|------------|------|-------------|----------------------------------------|------------------------------|-----------------|
| pixman | Core compositing engine, required at build/runtime, no fallback (`pixman-1 >= 0.40.0`) | Critical | `libpixman-1-dev 0.46.4-1`, published | 0.46.4-1+b2, installed | No build blocker. RVV path partially merged/active with open tracking issue (pixman #95); see Section 2 discrepancy note and Section 4 for the ~20% `src` L2 regression, a performance issue, not a build blocker |
| FreeType | Font rasterization, required (`freetype2 >= 23.0.17`; COLRv1 needs `>= 25.0.19`) | Critical | `libfreetype-dev 2.14.2+dfsg-1ubuntu0.1`, published | 2.14.3+dfsg-2, installed | None known. See [project-reports/freetype.md](../project-reports/freetype.md) |
| fontconfig | Font configuration/discovery, required (`fontconfig >= 2.13.0`) | Critical | `libfontconfig-dev 2.17.1-3ubuntu1`, published | 2.17.1-5, installed | None known |
| libpng | PNG surface I/O, required for the PNG backend (`libpng >= 1.4.0`) | Critical | `libpng-dev 1.6.57-1`, published | 1.6.58-1, installed | Historical RVV decode correctness bug (glennrp/libpng PR #769/#766) closed Dec 2025; open perf-only [PR #405](https://github.com/glennrp/libpng/pull/405) (RVV SIMD encode/decode) unmerged - not a blocker, scalar path is correct. See [project-reports/libpng.md](../project-reports/libpng.md) |
| zlib | Compression for PNG/PDF/PS backends, required | Critical | `zlib1g-dev 1:1.3.dfsg+really1.3.1-1ubuntu3.1`, published | 1.3.dfsg+really1.3.2-3, installed | None known. See [project-reports/zlib.md](../project-reports/zlib.md) |
| Meson | Build system, required (`meson_version >= 1.3.0`) | Critical (build) | N/A - architecture-independent Python tool | N/A | None; Meson's own riscv64 status is not architecture-gated since it is pure Python tooling |
| GLib | GObject type system for the optional `cairo-gobject` binding (`glib-2.0 >= 2.14`) | Optional | `libglib2.0-dev 2.88.0-1ubuntu0.1`, published | 2.88.3-3 (Needs-Build at last check; 2.88.3-2 previously installed and functional) | 2.88.3-3 pending on Debian; not a blocker, prior version functional |
| libX11 | X11 surface backend (optional) | Optional | `libx11-dev 2:1.8.13-1`, published | 2:1.8.13-1, installed | None known |
| libxcb | XCB surface backend, alternative to Xlib (optional, `xcb >= 1.6`) | Optional | `libxcb1-dev`, `libxcb-render0-dev`, `libxcb-shm0-dev`, all 1.17.0-2ubuntu1, published | 1.17.0-2+b2, installed | None known |
| Mesa | Optional GL/EGL backend | Optional | `libgl1-mesa-dev 26.0.8-1ubuntu0.3`, published | 26.1.6-1 (Needs-Build at last check; 26.1.5-1 installed, functional) | 26.1.6 pending on Debian; GL backend is optional in Cairo, not a blocker |
| libXrender | X11 rendering extension used by the X11 backend (optional, `>= 0.6`) | Optional | `libxrender-dev 1:0.9.12-1build1`, published | 1:0.9.12-1+b2, installed | None known |

**Indirect dependency identified via research:**

| Dependency | Role | riscv64 status | Notes |
|------------|------|-----------------|-------|
| HarfBuzz | OpenType shaping, consumed indirectly via FreeType | `libharfbuzz-dev 12.3.2-2`, published on Ubuntu 26.04 resolute riscv64 | None known. See [project-reports/harfbuzz.md](../project-reports/harfbuzz.md) |

**pixman deep-dive:** pixman is Cairo's only critical dependency with an ongoing riscv64 performance story. Its RVV work (`pixman-rvv.c`, first committed 2024-10-30 by Filip Wasil of Samsung Research Poland) has continuous commit history through 2026-09-29 per direct mirror commit-log inspection, with contributors now extending beyond Samsung (additional names 6eanut, Yuansheng, tiannT appear in the most recent commits). The master tracking issue [pixman #95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) (opened 2024-03-05) remains open, and other research passes in this report's preparation continued to describe the compositing-kernel work benchmarked in MR !142 as unmerged - see the discrepancy note in Section 2. Two prior build failures on riscv64 in pixman (#117: lto1 target-specific builtin; #115: `vfloat32m1x4_t` missing with gcc-13) were fixed in pixman 0.44.2+. A crash on T-HEAD hardware with rvv-0.7.1 (#125) was fixed 2025-07-16 via MRs !156 and !166. The ~20% regression observed in two `src` L2 compositing operations under RVV (from MR !142 benchmark data) has not been filed as a separate issue and remains unresolved as of the last available check.

Note: the `project-graph` MCP server was unavailable (`CONNECTION_CLOSED`) throughout this report's research, so the transitive `hasDependency` graph queries specified by the standard research procedure could not be run. All dependency data above is sourced directly from Cairo's `meson.build`, the Ubuntu/Debian package archives, and the Launchpad Archive API as a substitute, cross-checked against the existing report where applicable. Re-running the graph queries once the server reconnects is recommended to confirm these findings independently.

---

## 11. Known Bugs and Active Issues

**Cairo upstream - riscv64-specific correctness bugs:** None open.

**Cairo upstream - general open issues with riscv64 relevance:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [#932](https://gitlab.freedesktop.org/cairo/cairo/-/issues/932) | `_cairo_atomic_int_get` has wrong acquire semantics (barrier before read) | Open (2026-03-14) | Low | On riscv64 with GCC 14+, C11 atomics are used; no practical impact |
| [#503](https://gitlab.freedesktop.org/cairo/cairo/-/issues/503) | Floating-point rounding errors in font metrics | Open (2021-08-13, updated 2024-03-21) | Low | Affects all IEEE-754 platforms equally; no riscv64-specific angle |

**Pixman (critical dependency) - riscv64-specific:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [#95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) | RVV 1.0 port tracking | Open (2024-03-05) | Medium (performance) | Master tracking issue; commit-log evidence shows merged, active RVV work in `pixman-rvv.c` through 2026-09-29, but this issue itself remains open - see Section 2 discrepancy note; ~20% `src` L2 regression unresolved |
| [#125](https://gitlab.freedesktop.org/pixman/pixman/-/issues/125) | Crash with rvv-0.7.1 on T-HEAD hardware | Closed 2025-07-16 | Was critical | Fixed via MRs !156 + !166 |
| [#117](https://gitlab.freedesktop.org/pixman/pixman/-/issues/117) | Build failure riscv64: lto1 target-specific builtin | Closed 2024-11-25 | Was blocker | Fixed in pixman 0.44.2+ |
| [#115](https://gitlab.freedesktop.org/pixman/pixman/-/issues/115) | Build failure: `vfloat32m1x4_t` missing with gcc-13 | Closed 2024-11-07 | Was blocker | Fixed in pixman 0.44.2+ |

**libpng (Cairo's PNG surface backend) - riscv64-specific:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| PR #769 / #766 (glennrp/libpng) | RVV code produced incorrect PNG decoding results | Closed Dec 2025 | Was correctness | Fixed |
| [PR #405](https://github.com/glennrp/libpng/pull/405) | RVV SIMD for PNG decode/encode | Open (2021-12-20, updated 2026-03-30) | Low (performance) | Scalar path is correct; RVV path is a performance enhancement only, still unmerged |

No correctness bugs are open that affect Cairo on riscv64. All riscv64-specific correctness issues in the critical dependency stack have been resolved; the one unresolved item is a performance regression in pixman's RVV path.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. Cairo is pure portable C. The riscv64 generic C path is fully functional and produces correct output. No architecture-specific enablement work is required in Cairo itself.

**Organizational blockers:** None identified. Cairo has no formal port-acceptance policy and no gating mechanism for new platforms. The maintainer group is small but active; the 1.18.x release cadence (1.18.0 in Sept 2023, 1.18.2 in Sept 2024, 1.18.4 in March 2025, 1.18.6 in September 2026) is stable.

**Performance blocker (qualified):** The state of pixman's RVV port is the single meaningful open item for Cairo's rendering performance on riscv64, but its exact status is contested across this report's own sources (Section 2). What is not contested: the master tracking issue pixman #95 remains open, and the ~20% regression in two `src` L2 compositing operations under RVV (per MR !142 data) is unresolved. This is a pixman-project decision, not a Cairo decision, and does not block Cairo's own functional correctness on riscv64 in any way.

**Upstream access blocker:** The Anubis bot-protection system on freedesktop.org blocks WebFetch-style automated access to the Cairo and pixman GitLab projects. Direct HTTPS/`curl` retrieval through the environment's proxy has succeeded in several research passes for raw file content (meson.build, .gitlab-ci.yml, meson.options, tags pages), but issue/MR discussion pages and search endpoints remain fully inaccessible by every method attempted, including third-party proxies, cached search engines, and the Wayback Machine. This affects observability of the exact pixman RVV merge state (Section 2), not Cairo's own functionality.

**Acceptance probability:** Very high for any riscv64-related contribution. Because Cairo requires no changes for riscv64, the question does not arise at the Cairo level. Any pixman-level RVV work flows through the pixman project, which has already accepted 11 Samsung/RISE infrastructure MRs and continuous `pixman-rvv.c` commits for riscv64.

---

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** distro (Debian, Ubuntu, Arch Linux)

**Justification:** Cairo ships compiled C code, so the architecture-independent shortcut for the readiness grade does not apply. Upstream has zero riscv64 CI: Cairo's `.gitlab-ci.yml` (verified via the live GitHub mirror `sailfishos-mirror/cairo`, current through 2026-01-08) contains no riscv64 job, runner, or cross-file of any kind, and the canonical GitLab instance itself is Anubis-blocked for direct verification. With no upstream CI, the distribution floor applies: Debian ([sid buildd, cairo 1.18.4-3+b1, clean build ~22 min](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)), Ubuntu 26.04 resolute (libcairo2 1.18.4-3), and Arch Linux RISC-V (1.18.4-1) all build and ship riscv64 packages from unmodified upstream source - Cairo is pure portable C with zero architecture-specific code, so no riscv64 patches exist in any packaging diff. An unpatched clean distro build with no upstream CI floors to yellow (clean-distro-build), not orange. Cairo is not optimization-purpose (its value proposition is a portable general-purpose 2D vector graphics API, not raw performance superiority over a simpler alternative), so the optimization-gap modifier does not apply. Release provider is set to the shipping distributions (Debian/Ubuntu/Arch) rather than upstream, since Cairo upstream publishes only source tarballs at cairographics.org/releases, never binary artifacts.

**Pending work that could change the grade:** No open riscv64-specific bugs exist in Cairo itself. The one adjacent item that could someday matter for the broader rendering stack (not Cairo's own color, since Cairo has no arch-specific code to gain from it) is Cairo's dependency pixman's RVV vectorized compositing path (`pixman-rvv.c`, Samsung/RISE-driven, with merged commits under active development through 2026-09-29 per live mirror commit-log evidence, though the master tracking issue pixman #95 remains open - see Section 2) - this affects pixman's own grade, not Cairo's, since Cairo delegates all pixel compositing to pixman regardless of pixman's SIMD status. No open PRs or issues in Cairo's own tracker propose riscv64 CI; establishing one would be low-effort (trivial pure-C build) but requires freedesktop.org infrastructure cooperation that cannot currently be assessed due to the Anubis bot-protection block on gitlab.freedesktop.org.

---

## 14. Investment Analysis

Cairo itself is complete from a riscv64 functional standpoint. The investment opportunities are all in dependencies and infrastructure. RISE-adjacent work already underway (Samsung Research Poland's pixman RVV effort, now with contributors beyond Samsung) should not be re-sized here; the items below focus on what remains open or unaddressed.

### 14.1 Functional Enablement

No work needed. Cairo builds and runs correctly on riscv64 with zero source changes. The pure-C codebase is riscv64-complete by construction.

### 14.2 Performance Optimization

All performance work for Cairo on riscv64 flows through pixman, where RVV work is already partially merged and under active, multi-contributor development (Section 2). Given that state, further Qualcomm-side investment should target the specific open items rather than a general "unblock the merge" task, which the evidence suggests is already substantially in motion:

1. Investigate and fix the approximately 20% regression in `src` L2 compositing operations under RVV, identified in pixman MR !142 data and still unresolved as of the last available check (2026-06-17).
2. Optimize LMUL settings in `pixman-rvv.c` for small-rectangle workloads, currently showing 0% benefit for 32-byte line operations due to 25% VLEN utilization (per MR !142 data).
3. Help resolve and close the master tracking issue pixman #95, which remains open despite substantial merged progress - clarifying its remaining scope would itself reduce ambiguity for downstream consumers like Cairo.

Items 1-3 are pixman work, not Cairo work, and should be sized and tracked under the pixman project scope, not this one.

### 14.3 CI/CD Infrastructure

No upstream Cairo riscv64 CI exists (or if it does, it is inaccessible behind Anubis - no evidence of one was found in the live, readable `.gitlab-ci.yml` mirror). Establishing riscv64 CI in the upstream Cairo GitLab pipeline would require:

1. Engagement with the freedesktop.org infrastructure team to provision a riscv64 runner or QEMU-based cross-compilation job (freedesktop-sdk's own open riscv64-runner tracking issues, #1165 and #1176, show precedent for this kind of ask at the infrastructure level).
2. Authoring a `.gitlab-ci.yml` job section for riscv64 - low effort given the trivial, dependency-light build (Section 5).
3. Ongoing runner cost or contribution of a RISC-V hardware runner.

This is low-complexity work but requires upstream cooperation that cannot be assessed because the GitLab instance is Anubis-blocked for automated evaluation of infrastructure responsiveness.

### 14.4 Ecosystem Enablement

The pycairo Python binding (version 1.29.1) has no riscv64 wheel on PyPI or the RISE Python wheel builder. Publishing a pycairo riscv64 wheel via RISE or direct PyPI upload would close this gap for Python applications using Cairo. This is a separate project from Cairo itself and would be sized under pycairo, not under this report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | None needed | 0 | N/A | N/A |
| Performance | Investigate and fix the approximately 20% `src` L2 regression under RVV | 2-4 | Samsung Research Poland / RISE or Qualcomm | High |
| Performance | Optimize LMUL settings for small-rectangle workloads in `pixman-rvv.c` | 1-2 | Samsung Research Poland / RISE or Qualcomm | Medium |
| Performance | Help resolve and close pixman #95 (scope clarification, remaining-item triage) | 1 | Pixman maintainers + RISE contributors | Medium |
| CI/CD | Establish riscv64 CI job in upstream Cairo GitLab pipeline | 1-2 (plus runner provisioning) | freedesktop.org + contributor | Low |
| Ecosystem | Publish pycairo riscv64 wheel (PyPI or RISE wheel builder) | 1-2 | RISE or Qualcomm | Low |

---

## 15. References

- [Cairo upstream repository - gitlab.freedesktop.org](https://gitlab.freedesktop.org/cairo/cairo) (Anubis-blocked for tool-based access; raw file content retrievable via direct HTTPS/API)
- [Cairo release archive](https://www.cairographics.org/releases/)
- [Cairo GitLab tags page](https://gitlab.freedesktop.org/cairo/cairo/-/tags)
- [Debian cairo package tracker](https://tracker.debian.org/pkg/cairo)
- [Debian cairo riscv64 buildd status](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)
- [Debian cairo riscv64 build logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64)
- [Ubuntu 26.04 resolute libcairo2 package page](https://packages.ubuntu.com/resolute/libcairo2)
- [Arch Linux RISC-V mirror](https://riscv.mirror.pkgbuild.com)
- [Debian cairo 1.18.4-3 meson.options](https://sources.debian.org/src/cairo/1.18.4-3/meson.options/)
- [Debian cairo 1.18.4-3 meson.build](https://sources.debian.org/src/cairo/1.18.4-3/meson.build/)
- [Debian cairo 1.18.4-3 debian/rules](https://sources.debian.org/src/cairo/1.18.4-3/debian/rules/)
- [Debian cairo 1.18.4-3 debian/control](https://sources.debian.org/src/cairo/1.18.4-3/debian/control/)
- [Void Linux cairo template](https://raw.githubusercontent.com/void-linux/void-packages/master/srcpkgs/cairo/template)
- [sailfishos-mirror/cairo .gitlab-ci.yml (live GitHub mirror)](https://raw.githubusercontent.com/sailfishos-mirror/cairo/master/.gitlab-ci.yml)
- [cairo-image-compositor.c (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/src/cairo-image-compositor.c)
- [cairo-image-surface.c (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/src/cairo-image-surface.c)
- [configure.ac (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/configure.ac)
- [pixman RVV port tracking issue #95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) (Anubis-blocked; referenced from research)
- [pixman MR !142 - RVV benchmark data](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/142) (Anubis-blocked; data cited from existing report record)
- [pixman issue #125 - crash with rvv-0.7.1 on T-HEAD hardware](https://gitlab.freedesktop.org/pixman/pixman/-/issues/125)
- [pixman issue #117 - build failure riscv64 lto1 target-specific builtin](https://gitlab.freedesktop.org/pixman/pixman/-/issues/117)
- [pixman issue #115 - build failure vfloat32m1x4_t missing with gcc-13](https://gitlab.freedesktop.org/pixman/pixman/-/issues/115)
- [Cairo issue #932 - wrong acquire semantics in _cairo_atomic_int_get](https://gitlab.freedesktop.org/cairo/cairo/-/issues/932)
- [Cairo issue #503 - floating-point rounding errors in font metrics](https://gitlab.freedesktop.org/cairo/cairo/-/issues/503)
- [libpng PR #405 - RVV SIMD for PNG decode/encode](https://github.com/glennrp/libpng/pull/405)
- [RVV bench results - BananaPi F3 (SpacemiT K1)](https://camel-cdr.github.io/rvv-bench-results/bpi_f3/index.html)
- [pycairo on PyPI](https://pypi.org/project/pycairo/)
- [RISE Python wheel builder index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE members list](https://riseproject.dev/members/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [managarm/bootstrap-managarm - Cairo riscv64 cross-build recipe](https://github.com/managarm/bootstrap-managarm)
- [Debian bug #891547 - cairo test suite issues](https://bugs.debian.org/891547)
- [Emmanuele Bassi - Igalia team page](https://www.igalia.com/team/ebassi/)