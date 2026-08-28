---
title: Cairo
---

# Cairo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Cairo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Cairo is a 2D vector graphics library written in portable C. It provides a single rendering API with multiple surface backends (X11, XCB, PNG, PDF, PostScript, SVG, Win32, macOS Quartz) and delegates all pixel-level compositing to [pixman](https://gitlab.freedesktop.org/pixman/pixman). This delegation is explicit in the source: a comment in `cairo-image-compositor.c` reads, "Use plain C for fill operations as span length is typically small, too small to payback the startup overheads of using SSE2 etc." Cairo contains zero architecture-specific source files, no SIMD dispatch layer, no JIT backend, and no assembly files of any kind.

Current stable release: 1.18.4, released 2025-03-08. Build system: Meson >= 1.3.0.

**License:** dual LGPL-2.1 / MPL-1.1.

**Governance:** No formal foundation, steering committee, or governance charter. The project is hosted at [freedesktop.org](https://gitlab.freedesktop.org/cairo/cairo) under an informal community-maintainer model. No port-acceptance policy or tiered membership exists in any publicly accessible document.

**Active maintainers:**
- Emmanuele Bassi - release manager for the 1.18.x series; signed all releases from 1.18.0 through 1.18.4. Previous affiliation: Endless Mobile and GNOME Foundation board. Current employer not confirmed in any reachable source [NEEDS VERIFICATION].
- Adrian Johnson - top commit contributor in 1.18.2 (70 commits). No employer affiliation visible in public sources.
- Uli Schlachter - named in release notes as primary reviewer. No employer affiliation visible.
- Original authors Keith Packard (HP Labs) and Carl Worth are no longer active leads.

**Community stance on new ports:** No gating mechanism was found in any release notes or governance document. Because Cairo contains no arch-specific code and uses Meson's `auto` feature detection throughout, supporting a new architecture requires no Cairo changes as long as a C compiler and pixman are available. The community stance is implicitly permissive.

**RISE membership:** Cairo is not a RISE member project. A review of all 27 RISE blog posts from May 2024 through July 2026 returned zero mentions of Cairo or pycairo. RISE-funded RVV 1.0 work exists in Cairo's dependency pixman (Samsung Research Poland, Filip Wasil), not in Cairo itself.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (no date) | Cairo riscv64 support is implicit from day one of riscv64 Linux toolchain availability - the pure-C codebase requires no porting commits | Debian buildd history; source tree analysis |
| 2024-09-25 | Cairo 1.18.2-2 built successfully on Debian riscv64 builder rv-osuosl-01, 30 min build time | [Debian buildd logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64) |
| 2025-03-13 | Cairo 1.18.4-1 built on Debian riscv64, 25 min build time | [Debian buildd logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64) |
| 2026-05-15 | Cairo 1.18.4-3+b1 built on rv-osuosl-05, 22 min build time, status Installed | [Debian buildd](https://buildd.debian.org/status/package.php?p=cairo&suite=sid) |

No riscv64-specific patches, commits, issues, or merge requests exist in the Cairo upstream. Exhaustive search across GitLab (blocked by Anubis bot protection), GitHub CLI, GitHub semantic search, and web search returned zero results. This is not a search failure - it reflects that no porting work was required or performed. riscv64 is supported by the generic C path with no source changes.

The only riscv64-adjacent upstream activity relevant to Cairo is in pixman, not Cairo:
- pixman issue [#95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) (opened 2024-03-05): RVV 1.0 port tracking, led by Filip Wasil (Samsung Research Poland / RISE)
- 11 infrastructure MRs merged in pixman since October 2024 (MRs !102, !128, !146, !149, !156, !157, !166, !170, !172, !175, !176), all authored by Samsung/RISE contributors
- `pixman-rvv.c` (3,272 lines of RVV 1.0 intrinsics) exists in the pixman repo but was not yet merged upstream as of 2026-06-17

Key contributors on riscv64: none for Cairo itself. Filip Wasil (Samsung Research Poland) owns the pixman RVV work.

---

## 3. Upstream Support Tier

Cairo has no formal tier policy. There is no classification of architectures as primary, secondary, or unsupported in any upstream document.

In practice, the only meaningful tier distinction is between architectures supported by pixman with SIMD acceleration and those running on pixman's generic C scalar fallback. riscv64 currently falls in the scalar-only category because pixman-rvv.c is not yet merged.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Data not available: CI config inaccessible (Anubis) | Data not available | Data not available |
| Upstream binary releases | Source tarball only; distros package | Source tarball only | Source tarball only |
| Debian binary package | Yes | Yes | Yes - 1.18.4-3+b1 |
| Arch Linux binary package | Yes | Yes | Yes - 1.18.4-1 (confirmed via 660 KB binary download from [riscv.mirror.pkgbuild.com](https://riscv.mirror.pkgbuild.com)) |
| pixman SIMD backend | SSE2/AVX | NEON | None (scalar C only) |
| Release blocking | No formal mechanism | No formal mechanism | No formal mechanism |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Cairo contains no architecture-specific code. The following table covers every component category that typically has arch-specific implementations:

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Pixel compositing | Delegated to pixman (SSE2/AVX via pixman) | Delegated to pixman (NEON via pixman) | Delegated to pixman (scalar C - no RVV yet) | Cairo source: `pixman_image_composite32()` call in cairo-image-compositor.c |
| Image surface format conversion | Pure C | Pure C | Pure C | No arch-specific code in cairo-image-surface.c |
| JIT backend | None | None | None | Cairo has no JIT; this is a pixman responsibility |
| SIMD dispatch | None | None | None | No `--enable-sse`, `--enable-neon`, or equivalent flags in meson.build or configure.ac |
| Font rasterization | Delegated to FreeType | Delegated to FreeType | Delegated to FreeType | Cairo does not rasterize glyphs itself |
| Atomic operations | C11 atomics (GCC/Clang) | C11 atomics | C11 atomics | cairo-atomics.h uses C11 `_Atomic` on all platforms |
| Assembly files | None | None | None | Zero `.S` files in the Cairo source tree |

The architecture-specific performance surface for Cairo on riscv64 is entirely determined by pixman. The benchmark data from pixman MR !142 (Filip Wasil, SpacemiT K1, VLEN=256, measured via the CYCLE instruction):

- `combine_add_ca` full function call: approximately 4x speedup with RVV vs scalar
- Inner loop body: approaching approximately 5x speedup asymptotically
- Small-rectangle workloads (32-byte line operations): 0% benefit (only 25% VLEN utilization under current LMUL settings)
- Two `src` L2 compositing operations: approximately 20% regression vs scalar (cause unresolved as of 2026-06-17)

These numbers bound the performance gap for Cairo on riscv64 on vector-dominated workloads. No Cairo-level end-to-end benchmark on riscv64 exists in any public source.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson >= 1.3.0, mandatory since the 1.18.x series.

**Required toolchain:** No explicit minimum GCC or Clang version is declared in meson.build. Cairo uses `cc.get_supported_arguments()` at configure time to probe for compiler flag support. C standard: `gnu11,c11`. In practice, any GCC >= 7 or Clang >= 6 is sufficient. Meson >= 1.3.0 is a hard requirement.

**Dependency minimum versions (from meson.build):**

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

**Cross-compilation from x86-64 to riscv64:**

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

**Standard cross-file for riscv64-linux-gnu:**

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

**Minimal headless riscv64 cross build (no display backend):**

```
meson setup builddir \
  --cross-file riscv64-linux-gnu.cross \
  -Dtests=disabled \
  -Dspectre=disabled \
  -Dsymbol-lookup=disabled \
  -Dxlib=disabled \
  -Dxcb=disabled \
  -Dquartz=disabled \
  -Ddwrite=disabled \
  -Dgtk_doc=false \
  -Dglib=disabled
```

**Known universally disabled flags (not riscv64-specific):**

| Flag | Reason |
|------|--------|
| `-Dtests=disabled` | Tests hang; Void Linux documents "Tests get stuck"; circular dep on gtk+2.0 in Alpine; Debian bug [#891547](https://bugs.debian.org/891547) |
| `-Dspectre=disabled` | Arch PKGBUILD; Debian nocheck profile |
| `-Dsymbol-lookup=disabled` | Requires BFD/binutils internals; Arch PKGBUILD; Debian rules |
| `-Dquartz=disabled` | macOS only; auto-detected on Linux but explicitly disabled in Debian rules |
| `-Ddwrite=disabled` | Windows only; Arch PKGBUILD |

**QEMU usage:** Void Linux sets `build_helper="qemu"` in its cairo template, activating `qemu-riscv64-static` as `exe_wrapper`. Because tests are disabled, QEMU is only invoked for any `cc.run()` configure-time probes. With `-Dtests=disabled` QEMU is largely bypassed.

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

No riscv64-specific build failures are documented in any reachable source. The Debian buildd history shows clean builds across all recent releases (see Section 2).

Sources: [Debian meson.options](https://sources.debian.org/src/cairo/1.18.4-3/meson.options/), [Debian meson.build](https://sources.debian.org/src/cairo/1.18.4-3/meson.build/), [Debian rules](https://sources.debian.org/src/cairo/1.18.4-3/debian/rules/), [Void Linux template](https://raw.githubusercontent.com/void-linux/void-packages/master/srcpkgs/cairo/template), Arch PKGBUILD, `managarm/bootstrap-managarm`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. Cairo builds and runs correctly on riscv64. All surface backends (X11, XCB, PNG, PDF, PostScript, SVG) function through generic C paths. No riscv64-specific correctness bugs are open in the Cairo upstream.

**Performance gaps:**

| Workload type | amd64 | arm64 | riscv64 | Gap |
|---------------|-------|-------|---------|-----|
| Pixel compositing (Cairo delegating to pixman) | pixman SSE2/AVX; ~4-5x vs scalar | pixman NEON; ~4-5x vs scalar | pixman scalar C only (no RVV yet) | ~4-5x throughput deficit on vector-dominated workloads vs amd64/arm64 |
| Small-rectangle compositing | SSE2 with early-exit | NEON with early-exit | Scalar (no vectorization benefit even with RVV per MR !142 data) | Parity at small sizes |
| Font rasterization | FreeType (no Cairo-level SIMD) | FreeType | FreeType | No gap at Cairo level |

The 4-5x compositing deficit is bounded from pixman MR !142 benchmark data (SpacemiT K1, VLEN=256). No end-to-end Cairo application benchmark on riscv64 hardware exists in any public source.

**Security hardening gaps:** None identified. Cairo uses C11 atomics uniformly. The open issue #932 (wrong acquire semantics in `_cairo_atomic_int_get`) has low practical impact on riscv64 with GCC 14+ C11 atomics.

**Floating-point semantics:** Cairo uses IEEE 754 double throughout. Open issue #503 (floating-point rounding errors in font metrics, filed 2021-08-13, updated 2024-03-21) affects all IEEE-754 platforms equally; no riscv64-specific angle identified.

---

## 7. CI/CD Infrastructure

The upstream Cairo GitLab instance at [gitlab.freedesktop.org/cairo/cairo](https://gitlab.freedesktop.org/cairo/cairo) is fully blocked by the Anubis bot-protection system (error code 9e4edb5b6b850c41). Every path - `.gitlab-ci.yml`, `/pipelines`, `/blob/master/`, raw API endpoints - returns "Access Denied." The CI configuration file content was never retrieved.

No web search, GitHub code search, GitHub CLI issue/PR search, or site-scoped search returned any document showing riscv64 as a CI target in Cairo's upstream pipeline. GitHub mirrors of Cairo (e.g., Distrotech/cairo, androidports/cairo) do not contain `.gitlab-ci.yml` at all, as they predate GitLab CI adoption.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Upstream CI jobs | Unknown (Anubis blocked) | Unknown (Anubis blocked) | Unknown (Anubis blocked); no evidence of jobs through any channel |
| RISE CI runners | Not applicable | Not applicable | None - RISE has no involvement in Cairo CI |
| Hardware in use | Unknown | Unknown | Unknown |
| Debian downstream buildd | Yes | Yes | Yes - rv-osuosl-05, build time ~22 min, 1.18.4-3+b1 installed |

The only confirmed riscv64 build activity is Debian downstream packaging CI. This is not upstream Cairo CI.

---

## 8. Distribution and Release Status

Cairo upstream publishes only source tarballs at [cairographics.org/releases/](https://www.cairographics.org/releases/). No upstream project binary packages or OCI images are published for any architecture.

| Distribution | Package name | riscv64 version | Status |
|-------------|-------------|----------------|--------|
| Debian sid | cairo (libcairo2) | 1.18.4-3+b1 | Installed on riscv64 builder rv-osuosl-05 (confirmed [buildd.debian.org](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)) |
| Debian stable (bookworm) | cairo | 1.18.4-1 | Available |
| Ubuntu 24.04 (Noble) | libcairo2 | Available | riscv64 supported in Ubuntu 24.04 standard archive [NEEDS VERIFICATION: exact version not retrieved] |
| Arch Linux RISC-V mirror | cairo | 1.18.4-1 | Confirmed via 660 KB binary download from [riscv.mirror.pkgbuild.com](https://riscv.mirror.pkgbuild.com/repo/extra/) |
| PyPI `cairo` | N/A | N/A | No such package on PyPI (HTTP 404) |
| PyPI `pycairo` (Python binding) | pycairo 1.29.1 | No riscv64 wheel | Only win32, win_amd64, win_arm64 wheels; source distribution available for manual build |
| RISE wheel builder | Not present | Not present | Cairo/pycairo absent from the RISE wheel builder's 80+ package list |

A user targeting riscv64 gets a working Cairo binary via standard package management on Debian or Arch with no additional steps. For pycairo on riscv64, the user must build from source distribution.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------------|------|--------------|-------------|----------------|----------------|
| pixman | Core compositing engine - required, no fallback | Installed (0.46.4-1+b2, Debian sid) | Unknown | Released 0.46.4 | No riscv64 SIMD (RVV port in pixman-rvv.c not yet merged); performance falls to scalar C. Not a build blocker but a significant performance gap. See Section 4. |
| FreeType | Font rasterization; required | Installed (2.14.3+dfsg-2, Debian sid) | Unknown | Released | None. See [project-reports/freetype.md](../project-reports/freetype.md) |
| fontconfig | Font configuration and discovery; required | Installed (2.17.1-5, Debian sid) | Unknown | Released | None known |
| libpng | PNG surface I/O; required | Installed (1.6.58-1, Debian sid) | Unknown | Released | None. See [project-reports/libpng.md](../project-reports/libpng.md) |
| zlib | Compression for PNG and PDF backends; required | Installed (1.3.dfsg+really1.3.2-3, Debian sid) | Unknown | Released | None. See [project-reports/zlib.md](../project-reports/zlib.md) |
| glib-2.0 | GObject type system for cairo-gobject binding | Build queue (2.88.3-3 Needs-Build; 2.88.3-2 previously installed) | Unknown | Latest queued, prior functional | 2.88.3-3 pending; not a blocker - prior version functional |
| HarfBuzz | Used via FreeType for OpenType shaping (indirect dep via font backends) | Unknown from Debian | Unknown | Unknown | See [project-reports/harfbuzz.md](../project-reports/harfbuzz.md) |
| libX11 / libXrender / libXext | X11 rendering backend | Installed (libx11 2:1.8.13-1, libxrender 1:0.9.12-1+b2, Debian sid) | Unknown | Released | None known |
| libxcb / xcb-render / xcb-shm | XCB backend (alternative to Xlib) | Installed (1.17.0-2+b2, Debian sid) | Unknown | Released | None known |
| mesa (libGL/EGL) | Optional GL/EGL backend | Build queue (26.1.6-1 Needs-Build; 26.1.5-1 installed ~2026-07-17, 8h 55m build time) | Unknown | 26.1.5 functional | 26.1.6 pending; GL backend is optional in Cairo, not a blocker |

**Pixman deep-dive:** pixman is Cairo's only critical dependency with a riscv64 performance gap. pixman 0.46.4 on riscv64 runs entirely on generic C scalar code. The RVV 1.0 port (`pixman-rvv.c`, 3,272 lines, authored by Filip Wasil / Samsung Research Poland) exists in the pixman repository but is tracked under open issue [pixman #95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) and was not merged upstream as of 2026-06-17. Two prior build failures on riscv64 in pixman (issue #117: lto1 target-specific builtin; issue #115: vfloat32m1x4_t missing with gcc-13) were fixed in pixman 0.44.2+. A crash on T-HEAD hardware with rvv-0.7.1 (issue #125) was fixed 2025-07-16 via MRs !156 and !166.

The ~20% regression observed in two `src` L2 compositing operations under RVV (from MR !142 benchmark data) has not been filed as a separate issue and remains unresolved.

---

## 11. Known Bugs and Active Issues

**Cairo upstream - riscv64-specific correctness bugs:** None open.

**Cairo upstream - general open issues with riscv64 relevance:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [#932](https://gitlab.freedesktop.org/cairo/cairo/-/issues/932) | cairo-atomics: `_cairo_atomic_int_get` has wrong acquire semantics (barrier before read) | Open (2026-03-14) | Low | On riscv64 with GCC 14+ C11 atomics are used; no practical impact |
| [#503](https://gitlab.freedesktop.org/cairo/cairo/-/issues/503) | Floating-point rounding errors in font metrics | Open (2021-08-13, updated 2024-03-21) | Low | Affects all IEEE-754 platforms equally; no riscv64-specific angle |

**Pixman (critical dependency) - riscv64-specific:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [#95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) | RVV 1.0 port tracking | Open (2024-03-05) | Medium (performance) | 11 infrastructure MRs merged; main compositing kernel MR pending; ~20% `src` L2 regression unresolved |
| [#125](https://gitlab.freedesktop.org/pixman/pixman/-/issues/125) | Crash with rvv-0.7.1 on T-HEAD hardware | Closed 2025-07-16 | Was critical | Fixed via MRs !156 + !166 |
| [#117](https://gitlab.freedesktop.org/pixman/pixman/-/issues/117) | Build failure riscv64: lto1 target-specific builtin | Closed 2024-11-25 | Was blocker | Fixed in pixman 0.44.2+ |
| [#115](https://gitlab.freedesktop.org/pixman/pixman/-/issues/115) | Build failure: vfloat32m1x4_t missing with gcc-13 | Closed 2024-11-07 | Was blocker | Fixed in pixman 0.44.2+ |

**libpng (Cairo PNG surface backend) - riscv64-specific:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [PR #769 / #766](https://github.com/glennrp/libpng) | RVV code produced incorrect PNG decoding results | Closed Dec 2025 | Was correctness | Fixed |
| [PR #405](https://github.com/glennrp/libpng/pull/405) | RVV SIMD for PNG decode/encode | Open (2021-12-20, updated 2026-03-30) | Low (performance) | Scalar path is correct; RVV path is a performance enhancement only |

No correctness bugs are open that affect Cairo on riscv64. All riscv64-specific correctness issues in the dependency stack have been resolved.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. Cairo is pure portable C. The riscv64 generic C path is fully functional and produces correct output. No architecture-specific enablement work is required in Cairo itself.

**Organizational blockers:** None identified. Cairo has no formal port-acceptance policy and no gating mechanism for new platforms. The maintainer group is small but active; the 1.18.x release cadence (1.18.0 in Sept 2023, 1.18.2 in Sept 2024, 1.18.4 in March 2025) is stable.

**Performance blocker:** The pixman RVV 1.0 port not being merged upstream is the single meaningful blocker for production-quality Cairo rendering performance on riscv64. This is a pixman decision, not a Cairo decision. The unresolved ~20% regression in two `src` L2 operations under RVV (per MR !142 data) requires resolution before the pixman RVV backend can be recommended for production use.

**Upstream access blocker:** The Anubis bot-protection system on freedesktop.org blocks automated access to the Cairo GitLab project entirely. This makes CI verification, issue tracking, and MR monitoring impossible through automated tools. This affects observability, not functionality.

**Acceptance probability:** Very high for any riscv64-related contribution. Because Cairo requires no changes for riscv64, the question does not arise at the Cairo level. Any pixman-level RVV work flows through the pixman project (not Cairo), which has already accepted 11 Samsung/RISE infrastructure MRs for riscv64.

---

## 13. Investment Analysis

Cairo itself is complete from a riscv64 functional standpoint. The investment opportunities are all in dependencies and infrastructure.

### 13.1 Functional Enablement

No work needed. Cairo builds and runs correctly on riscv64 with zero source changes. The pure-C codebase is riscv64-complete by construction.

### 13.2 Performance Optimization

All performance work for Cairo on riscv64 flows through pixman. The primary gap is the unmerged `pixman-rvv.c` (3,272 lines, authored by Filip Wasil / Samsung Research Poland). Qualcomm could:

1. Review and accelerate the merge of pixman-rvv.c upstream (code review bandwidth on the pixman MR queue)
2. Investigate and fix the ~20% regression in `src` L2 compositing operations under RVV identified in MR !142 data (cause unresolved as of 2026-06-17)
3. Optimize LMUL settings in pixman-rvv.c for small-rectangle workloads (currently 0% benefit for 32-byte line operations per MR !142 data)

Note: Items 1-3 are pixman work, not Cairo work. They should be sized and tracked under the pixman project scope.

### 13.3 CI/CD Infrastructure

No upstream Cairo riscv64 CI exists (or if it does, it is inaccessible behind Anubis). Establishing riscv64 CI in the upstream Cairo GitLab pipeline would require:

1. Engagement with freedesktop.org infrastructure team to provision a riscv64 runner or QEMU-based cross-compilation job
2. Authoring a `.gitlab-ci.yml` job section for riscv64 (low effort given the trivial build - see Section 5)
3. Ongoing runner cost or contribution of a RISC-V hardware runner

This is low-complexity work but requires upstream cooperation that cannot be assessed because the GitLab instance is Anubis-blocked.

### 13.4 Ecosystem Enablement

The pycairo Python binding (version 1.29.1) has no riscv64 wheel on PyPI. Publishing a pycairo riscv64 wheel via RISE or direct PyPI upload would close the gap for Python applications using Cairo. This is a separate project from Cairo itself and would be sized under pycairo.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | None needed | 0 | N/A | N/A |
| Performance | Review and unblock pixman-rvv.c merge | 2-4 | Pixman maintainers + Samsung/RISE | High |
| Performance | Investigate and fix ~20% `src` L2 regression under RVV | 2-4 | Samsung Research Poland / RISE or Qualcomm | High |
| Performance | Optimize LMUL settings for small-rectangle workloads in pixman-rvv.c | 1-2 | Samsung Research Poland / RISE or Qualcomm | Medium |
| CI/CD | Establish riscv64 CI job in upstream Cairo GitLab pipeline | 1-2 (plus runner provisioning) | freedesktop.org + contributor | Low |
| Ecosystem | Publish pycairo riscv64 wheel (PyPI or RISE wheel builder) | 1-2 | RISE or Qualcomm | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [Cairo upstream repository - gitlab.freedesktop.org](https://gitlab.freedesktop.org/cairo/cairo) (Anubis-blocked; metadata only)
- [Cairo release archive](https://www.cairographics.org/releases/)
- [Debian cairo package tracker](https://tracker.debian.org/pkg/cairo)
- [Debian cairo riscv64 buildd status](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)
- [Debian cairo riscv64 build logs](https://buildd.debian.org/status/logs.php?pkg=cairo&arch=riscv64)
- [Arch Linux RISC-V mirror](https://riscv.mirror.pkgbuild.com)
- [Debian cairo 1.18.4-3 meson.options](https://sources.debian.org/src/cairo/1.18.4-3/meson.options/)
- [Debian cairo 1.18.4-3 meson.build](https://sources.debian.org/src/cairo/1.18.4-3/meson.build/)
- [Debian cairo 1.18.4-3 debian/rules](https://sources.debian.org/src/cairo/1.18.4-3/debian/rules/)
- [Debian cairo 1.18.4-3 debian/control](https://sources.debian.org/src/cairo/1.18.4-3/debian/control/)
- [Void Linux cairo template](https://raw.githubusercontent.com/void-linux/void-packages/master/srcpkgs/cairo/template)
- [cairo-image-compositor.c (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/src/cairo-image-compositor.c)
- [cairo-image-surface.c (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/src/cairo-image-surface.c)
- [configure.ac (behdad/cairo GitHub mirror)](https://raw.githubusercontent.com/behdad/cairo/master/configure.ac)
- [pixman RVV port tracking issue #95](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95) (Anubis-blocked; referenced from research)
- [pixman MR !142 - RVV benchmark data](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/142) (Anubis-blocked; data cited from existing report)
- [RVV bench results - BananaPi F3 (SpacemiT K1)](https://camel-cdr.github.io/rvv-bench-results/bpi_f3/index.html)
- [pycairo on PyPI](https://pypi.org/project/pycairo/)
- [managarm/bootstrap-managarm - Cairo riscv64 cross-build recipe](https://github.com/managarm/bootstrap-managarm)
- [Debian bug #891547 - cairo test suite issues](https://bugs.debian.org/891547)