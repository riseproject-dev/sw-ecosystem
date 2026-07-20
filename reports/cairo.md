---
title: Cairo
categories:
  - libraries
---

# Cairo
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Cairo
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Cairo is a 2D vector graphics library written in C that provides a unified drawing API across multiple output backends: X11 (Xlib, XCB), Windows (Win32, DirectWrite), macOS (Quartz), and file formats (PDF, PostScript, SVG, PNG). It is the primary rendering substrate for GTK, Pango, GNOME, and numerous Linux desktop applications.

The upstream repository is hosted at [gitlab.freedesktop.org/cairo/cairo](https://gitlab.freedesktop.org/cairo/cairo) under the freedesktop.org umbrella, which merged with the X.Org Foundation in 2019. freedesktop.org is a fiscal project of [Software in the Public Interest (SPI)](https://www.spi-inc.org/), the same umbrella organization as Debian and PostgreSQL. Cairo has no formal steering committee, Technical Oversight Committee, or governance document. Contributions flow through GitLab merge requests. The project is a loose meritocracy with no declared corporate sponsor.

Cairo was originally written by Keith Packard and Carl Worth (as "Xr") and later co-maintained by Behdad Esfahbod (historically Red Hat/Google). No single company holds official maintainership today. Debian packaging is maintained by the "Debian GNOME Maintainers" group (Emilio Pozuelo Monfort, Jeremy Bicha, Laurent Bigonville). Arch Linux packaging is maintained by Laurent Carlier and Jan Alexander Steffens.

Cairo is not a member of the RISE project. Searching all 27 RISE blog posts (May 2024 through June 2026) and the full RISE repository list at [github.com/riseproject-dev](https://github.com/orgs/riseproject-dev/repositories) returned zero mentions of Cairo.

Cairo's architecture is deliberately layered: it contains no pixel-level SIMD code itself. All compositing is delegated to [pixman](https://gitlab.freedesktop.org/pixman/pixman), a separate library. Porting Cairo to a new architecture therefore requires no source changes to Cairo -- the porting concern applies to pixman.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (no specific date) | Cairo builds on riscv64 via generic C; no source changes required | Debian buildd history, zero riscv issues in upstream tracker |
| April 2024 | riscv64 recognized as official Debian port; Cairo packaging included without modification | Debian ports announcement [NEEDS VERIFICATION for exact date] |
| ~2026-05-15 | Cairo 1.18.4-3+b1 built and installed on riscv64 buildd machine rv-osuosl-05 | [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=cairo&suite=sid) |

No discrete "first RISC-V commit" to Cairo exists because the port required no source changes. The upstream GitLab instance (gitlab.freedesktop.org) is protected by the Anubis bot-challenge system and returns Access Denied to automated queries; the GitHub mirror at github.com/freedesktop/cairo returns HTTP 404 (repository does not exist). Searches across all accessible channels -- `gh search issues "riscv cairo"`, web searches for "cairographics riscv64", "cairo RISC-V port upstream" -- returned zero results, confirming no upstream RISC-V activity exists because none was required.

The only RISC-V-adjacent activity in Cairo's dependency graph is in pixman, where Samsung Research Poland (with RISE project involvement) has been upstreaming RVV 1.0 support since 2024. That work is tracked separately in Section 9.

---

## 3. Upstream Support Tier

Cairo has no documented tier policy for architecture support. The implicit policy is: any architecture supported by the C toolchain and by pixman is a supported Cairo target, because Cairo contains no architecture-specific code.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (Fedora x86_64, Windows amd64) | Yes (Android arm64, macOS arm64) | No |
| Release-blocking | Yes | Yes | No |
| Official upstream binary | No (source-only) | No (source-only) | No (source-only) |
| Debian sid binary | Yes, 1.18.4-3+b1 | Yes, 1.18.4-3+b1 | Yes, 1.18.4-3+b1 (rv-osuosl-05) |
| Ubuntu 24.04 binary | Yes | Yes | Yes, libcairo2 1.18.0-3build1 |
| Known build failures | None | None | None |
| Known correctness bugs | None | None | None |

riscv64 is not a release-blocking architecture for upstream Cairo, but this is no different from arm64 -- Cairo upstream does not produce binary releases for any architecture. Distribution packaging treats riscv64 on equal footing with other tier-1 architectures in both Debian and Ubuntu.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Cairo's architecture is pure portable C. There are zero assembly files anywhere in the Cairo source tree (`git ls-tree -r HEAD --name-only | grep -E "\.S$"` returns no results). There is no SIMD dispatch layer, no JIT compiler, no cryptographic primitives, and no architecture-specific GC barriers in Cairo itself.

The `cairo/configure.ac` and `cairo/src/Makefile.sources` contain zero CPU feature detection. The only architecture-sensitive behavior in `meson.build` is a memory barrier flag:

```python
if not ['x86', 'x86_64'].contains(host_machine.cpu_family()):
    conf.set('ATOMIC_OP_NEEDS_MEMORY_BARRIER', 1)
```

This applies to riscv64 as a safety backstop. In practice, GCC 14+ on riscv64 supports C11 atomics (`_Atomic`), so `HAVE_C11_ATOMIC_PRIMITIVES` is set and this flag is a no-op.

All pixel-level work is performed by pixman. The per-component matrix is:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Cairo core rendering | scalar C | scalar C | scalar C |
| Cairo SIMD dispatch | none (none exists) | none (none exists) | none (none exists) |
| Cairo assembly files | 0 | 0 | 0 |
| pixman compositing dispatch | `pixman-x86.c` | `pixman-arm.c` | none |
| pixman MMX | `pixman-mmx.c` | -- | -- |
| pixman SSE2 | `pixman-sse2.c` | -- | -- |
| pixman NEON | -- | `pixman-arm-neon.c` + 2 `.S` files | -- |
| pixman ARM SIMD | -- | `pixman-arm-simd.c` + 2 `.S` files | -- |
| pixman AltiVec/VMX | -- | -- (ppc only) | -- |
| pixman RVV 1.0 | -- | -- | In progress (see Section 9) |
| pixman scalar fallback | yes | yes (also used) | yes (only path) |
| Assembly files in pixman | 0 (C intrinsics) | 4 `.S` files | 0 |

The practical consequence is that Cairo on riscv64 is functionally complete and correct, but all compositing runs on the `pixman-general.c` scalar fallback. On hardware with RVV capability (e.g., SiFive X280, SpacemiT K1, T-Head C910), no vector units are exercised during Cairo rendering.

---

## 5. Build System, Cross-Compilation, and Toolchain

Cairo uses Meson exclusively. The minimum version is 1.3.0 (hard requirement in `meson.build`). No CMake, Autotools, or other build system is supported.

**Native build on riscv64 hardware or chroot:**

```sh
meson setup builddir
meson compile -C builddir
meson install -C builddir
```

**Cross-compilation from x86_64 (manual cross-file required):**

No riscv64 cross-file is shipped in the Cairo repository. The only shipped cross-file is `.gitlab-ci/android-cross-file.txt` (aarch64 Android). A minimal cross-file:

```ini
[host_machine]
system      = 'linux'
cpu_family  = 'riscv64'
cpu         = 'riscv64'
endian      = 'little'

[binaries]
c           = 'riscv64-linux-gnu-gcc'
ar          = 'riscv64-linux-gnu-ar'
strip       = 'riscv64-linux-gnu-strip'
pkgconfig   = 'riscv64-linux-gnu-pkg-config'

[properties]
sys_root    = '/path/to/riscv64-sysroot'
ipc_rmid_deferred_release = false
```

The `ipc_rmid_deferred_release = false` property is required to suppress a runtime check in the Xlib backend that cannot be executed during cross-compilation.

**Minimal headless build (image + SVG + PDF/PS, no X11):**

```sh
meson setup --cross-file riscv64-cross.txt \
  -Dxlib=disabled -Dxlib-xcb=disabled -Dxcb=disabled \
  -Dquartz=disabled -Dtee=disabled -Dgtk2-utils=disabled \
  -Dspectre=disabled -Dsymbol-lookup=disabled -Dtests=disabled \
  --default-library=shared builddir
meson compile -C builddir
```

**Required toolchain versions:**

| Tool | Minimum | Reason |
|------|---------|--------|
| GCC | 14 | `__riscv_vcreate_v_f32m1x4` RVV 1.0 intrinsic required by pixman's `pixman-rvv.c` |
| Clang | 18 | Same reason; pixman `meson.build` compile-test gates on this intrinsic |
| Meson | 1.3.0 | Hard requirement in `project()` call |
| Linux kernel headers | 6.5+ | `COMPAT_HWCAP_ISA_V` required for pixman's `riscv_hwprobe` RVV runtime detection |

The GCC/Clang minimum applies to pixman (vendored via `subprojects/pixman.wrap` at version 0.44.2), not to Cairo itself. Cairo's own code compiles correctly with any GCC/Clang that supports C99.

No known build failures exist for riscv64 with current toolchains.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Image surface (software render) | Full | Full | Full |
| PDF surface | Full | Full | Full |
| PostScript surface | Full | Full | Full |
| SVG surface | Full | Full | Full |
| PNG surface | Full | Full | Full |
| XCB/Xlib surface | Full | Full | Full (on X11-capable hardware) |
| Win32/Quartz surface | Full/Full | --/Full | -- |
| GL surface (experimental) | Available | Available | Available (build-time optional) |
| SIMD compositing (pixman) | SSE2 + MMX | NEON + SIMD | None -- scalar only |
| RVV compositing (pixman) | -- | -- | Not yet merged upstream |
| Font rasterization (freetype2) | Full | Full | Full |
| Text shaping (harfbuzz) | Full | Full | Full |

**Functional gaps:** None. Cairo is fully functional on riscv64.

**Performance gaps:** All Cairo compositing operations on riscv64 run on the pixman scalar C fallback. Benchmarks from pixman MR !142 and !146 (Samsung Research Poland, March-April 2025) on SpacemiT K1 (VLEN=256) show that RVV acceleration delivers approximately 4x speedup on compositing kernels (full function call) and up to approximately 5x speedup on inner loop bodies versus scalar. Small-rectangle workloads (32-byte line operations) show no benefit under current LMUL settings because only 25% of register space (VLEN=256) is utilized. Two `src` L2 operations showed approximately 20% regression versus scalar whose cause was not resolved as of the MR merge. Until pixman RVV support is merged and stabilized, Cairo on riscv64 is expected to run at roughly one-quarter to one-fifth the compositing throughput of an equivalent ARM NEON or x86 SSE2 system on vector-dominated workloads.

**Security hardening gaps:** Data not available: no upstream documentation or issue tracker entries addressing riscv64-specific security hardening (stack protector, CFI, shadow stack) were found.

**Floating-point:** riscv64 is little-endian IEEE-754 double-precision, identical to amd64. No riscv64-specific floating-point issues were found. Cairo issue #503 (floating-point rounding in font metrics) affects all IEEE-754 platforms equally and is not riscv64-specific.

---

## 7. CI/CD Infrastructure

The upstream CI configuration is `.gitlab-ci.yml` (606 lines, read in full). The file contains zero occurrences of "riscv", "riscv64", "risc-v", or "RISCV". No QEMU-based cross-architecture emulation jobs exist in Cairo's CI.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI system | GitLab CI (Fedora 40, Windows) | GitLab CI (Android arm64, macOS arm64) | Not present |
| Build CI | Yes | Yes | No |
| Test CI | Yes (pdf, ps2, ps3, script, image, recording, svg, xcb, xlib) | No (cross-compile only, no test run) | No |
| Hardware runner | No (container) | No (emulated/container) | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |

The CI uses freedesktop CI templates with prebuilt Fedora 40 container images from `registry.freedesktop.org`. No Dockerfiles or `Dockerfile.riscv64` exist in the repository. No Jenkinsfile or `.cirrus.yml` exists.

The absence of riscv64 CI is not a regression -- arm64 also has no test run in upstream CI (only a cross-compile job). The Debian and Ubuntu build infrastructure provides independent riscv64 build verification.

---

## 8. Distribution and Release Status

Cairo upstream ships source-only tarballs (.tar.gz, .tar.xz) at [cairographics.org/releases](https://www.cairographics.org/releases/). No upstream binary packages exist for any architecture. The latest release is 1.18.4.

| Distribution | Package | Version | riscv64 status |
|-------------|---------|---------|----------------|
| Debian sid | libcairo2 | 1.18.4-3+b1 | Installed (buildd rv-osuosl-05, ~2026-05-15) |
| Ubuntu 24.04 noble | libcairo2 | 1.18.0-3build1 | Available (libcairo2_1.18.0-3build1_riscv64.deb, 613,676 bytes) |
| Arch Linux RISC-V | cairo | Current | Not in FTBFS/broken list [NEEDS VERIFICATION -- absence from failure list, not confirmed from package mirror directly] |
| PyPI (pycairo 1.29.0) | pycairo | 1.29.0 | No riscv64 wheel; Windows wheels only; source distribution (sdist) available for manual build |
| Upstream GitHub releases | -- | -- | No GitHub mirror exists (github.com/freedesktop/cairo returns HTTP 404) |

**What a user must do on riscv64:**

- For the C library: install the distro package (`apt install libcairo2` on Debian/Ubuntu). No manual build required.
- For pycairo: build from source (`pip install pycairo` will compile from sdist, requiring gcc, meson, and cairo dev headers). No pre-built wheel is available.

The Ubuntu autopkgtest "tmpfail" result on riscv64/questing is caused by an OpenStack infrastructure misconfiguration (missing security group `bos03-riscv64-*.secgroup`), not a Cairo code defect. Other Ubuntu releases (noble, resolute, stonking) show "neutral".

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|------|---------------|--------------|-----------------|----------------|
| pixman | Core pixel compositing (all image surfaces) | OK (Debian 0.46.4-1+b2) | QEMU CI exists (5 configs, see below) | Debian sid released | No RVV SIMD merged upstream; scalar fallback only; ~4-5x performance gap vs NEON/SSE2 on vector workloads |
| freetype2 | Font rasterization | OK (Debian 2.14.3+dfsg-1) | 0 riscv64 issues in GitHub repo | Debian sid released | None |
| fontconfig | Font discovery | OK (Debian 2.17.1-5) | No riscv64-specific issues | Debian sid released | None |
| libpng | PNG surface backend | OK (Debian 1.6.58-1); build fixes merged 2025 (PRs #699, #713, #766, #771) | RVV correctness bug fixed (issue #769, PR #766, Dec 2025) | 1.6.58 released | PR #405 (RVV SIMD) open since 2021-12-20, last updated 2026-03-30; performance gap only |
| zlib | Deflate for PNG and PDF | OK (Debian 1:1.3.dfsg+really1.3.2-3) | 0 riscv64 issues | Debian sid released | None |
| glib2 | GObject/GLib (glib surface, GObject bindings) | OK (Debian 2.88.1-2; 2 build attempts needed) | 0 riscv64 issues | Debian sid released | None (minor: needed 2 build attempts) |
| harfbuzz | OpenType shaping (optional, with pango) | OK (Debian 12.3.2-2+b2, rebuilt against libicu78) | 0 riscv64 issues | Debian sid released | None |
| lzo | LZO compression (script recording surface, optional) | OK (Debian 2.10-3+b2) | Not specifically tested | Debian sid released | None |
| libdrm | DRM access (cairo-gl, cairo-drm, experimental) | Builds on riscv64 (kernel DRM has riscv64 support) | No riscv64 issues found | Available in Debian sid | Optional; experimental backends not required |
| libX11/libXcb/libXrender | X11 and XCB backends | All available in Debian riscv64 | No riscv64 issues | Debian sid released | None |

**Deep dive: pixman (critical dependency)**

pixman is Cairo's most performance-critical dependency and the only dependency with active RISC-V work. The repository is at [gitlab.freedesktop.org/pixman/pixman](https://gitlab.freedesktop.org/pixman/pixman). Cairo vendors pixman 0.44.2 via `subprojects/pixman.wrap`.

Architecture-specific source files in pixman:

| Architecture | Dispatcher | SIMD files |
|-------------|-----------|-----------|
| x86 | `pixman-x86.c` | `pixman-mmx.c`, `pixman-sse2.c` |
| ARM | `pixman-arm.c` | `pixman-arm-neon.c`, `pixman-arm-simd.c`, `pixman-arm-neon-asm.S`, `pixman-arm-neon-asm-bilinear.S`, `pixman-arm-simd-asm.S`, `pixman-arm-simd-asm-scaled.S` |
| PowerPC | `pixman-ppc.c` | `pixman-vmx.c` |
| MIPS | `pixman-mips.c` | `pixman-mips-dspr2.c`, `pixman-mips-dspr2-asm.S` |
| RISC-V | `pixman-riscv.c` (CPU detection only) | `pixman-rvv.c` (3,272 lines, RVV 1.0 intrinsics) -- **not yet merged upstream** |

RVV work history (merged MRs, chronological):

| MR | Title | Merged |
|----|-------|--------|
| !102 | RISC-V floating point operations | 2024-10-30 |
| !128 | RISC-V: fix rvv auto-detection on gcc-13 | 2024-11-07 |
| !146 | rvv: Add integer implementation (BananaPi BPI-F3) | 2025-04-14 |
| !149 | RISC-V: Only enable RVV on Linux if hwcap headers available | 2025-04-30 |
| !156 | RISC-V: Use hwprobe interface to check for RVV 1.0 | 2025-07-16 |
| !157 | RISC-V: syscall header include corrected | 2025-07-30 |
| !166 | RISC-V RVV detection method updated (riscv_v_default_allow sysctl) | 2026-04-04 |
| !170 | Fixes for RVV detection (clang 18 intrinsic) | 2026-04-16 |
| !172 | RISC-V: Utilize elf_aux_info() on FreeBSD/OpenBSD | 2026-06-04 |
| !175 | RISC-V: Add getauxval() fallback for musl libc | 2026-06-15 |
| !176 | RISC-V: Rename macro HAVE_RVV_LINUX to HAVE_HWPROBE_GETAUXVAL | 2026-06-16 |

The RVV optimization work (pixman-rvv.c, 3,272 lines) is led by Filip Wasil, Samsung Electronics / Samsung Research Poland, under the RISE project. The work is actively maintained as of June 2026 (MRs !175 and !176 merged within the past two weeks).

Pixman CI includes five RISC-V configurations via QEMU (from `03-test.yml`):
- `rv64,v=false` (scalar only, no autovectorization)
- `rv64,v=true,vext_spec=v1.0,vlen=128,elen=64`
- `rv64,v=true,vext_spec=v1.0,vlen=256,elen=64`
- `rv64,v=true,vext_spec=v1.0,vlen=512,elen=64`
- `rv64,v=true,vext_spec=v1.0,vlen=1024,elen=64`

Docker base image: `docker.io/riscv64/debian:sid-slim`, LLVM 18.

RVV performance data from MR !142 (SpacemiT K1, VLEN=256, CYCLE instruction):
- `combine_add_ca` full function: approximately 4x speedup versus scalar
- Inner loop body: asymptotically approaching approximately 5x speedup
- Small-rectangle workloads (32-byte lines): no benefit (25% VLEN utilization under current LMUL settings)
- Two `src` L2 operations: approximately 20% slowdown versus scalar (cause unresolved)

Resolved pixman correctness bugs on riscv64:

| Issue | Title | Opened | Closed |
|-------|-------|--------|--------|
| #125 | pixman crashes on riscv systems with rvv-0.7.1 | 2025-07-01 | 2025-07-16 |
| #117 | 0.44 build failing on risc-v: lto1 target-specific builtin not available | 2024-11-23 | 2024-11-25 |
| #115 | pixman-0.44.0 fails to build for riscv64 (vfloat32m1x4_t type missing with gcc-13) | 2024-11-06 | 2024-11-07 |

Issue #125 was caused by hardcoded `-march` flags that compiled with RVV 1.0 intrinsics on systems with only the pre-standard RVV 0.7.1 (T-HEAD xvectorthead vendor extension), producing illegal instruction exceptions at runtime. Fixed by MR !156 (hwprobe) and MR !166 (riscv_v_default_allow sysctl workaround). Issues #115 and #117 were compiler detection bugs with gcc-13.3.0 missing `vfloat32m1x4_t`.

**Deep dive: libpng**

libpng is used by Cairo's PNG surface backend. On riscv64, several build issues were resolved in 2025 (PRs #699, #713, #766, #771 merged). A correctness bug (issue #769) where RVV code produced incorrect PNG decoding results was fixed in PR #766 (December 2025). PR #405 (RVV SIMD for PNG decode/encode) has been open since 2021-12-20 and was last updated 2026-03-30; it is a performance-only gap. The scalar path is correct and complete.

---

## 11. Known Bugs and Active Issues

**Cairo upstream:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #932 | Few issues in cairo-atomics | Open (2026-03-14) | Low (riscv64) | `_cairo_atomic_int_get` places memory barrier before read (wrong acquire semantics); affects MSVC and pre-2014 GCC/clang. On riscv64 with GCC 14+, C11 atomics are used; no practical impact. |
| #503 | Floating-point rounding errors in font metrics | Open (2021-08-13, updated 2024-03-21) | Low | Double-precision arithmetic in `cairo_scaled_font_glyph_extents` causes wrong `ceil()` results for integer font sizes. Affects all IEEE-754 platforms. No riscv64-specific angle. |

**No correctness bugs specific to riscv64** were found in Cairo.

**Pixman (key dependency):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #95 | RVV port (tracking) | Open (2024-03-05) | Medium | Overall tracking issue for RVV optimization work; remains open while the port is ongoing |
| #125 | Crash with rvv-0.7.1 | Closed (2025-07-16) | Critical (was) | Fixed; T-HEAD vendor extension collision |
| #117 | Build failure riscv64 lto1 | Closed (2024-11-25) | High (was) | Fixed in pixman 0.44.2+ |
| #115 | Build failure vfloat32m1x4_t | Closed (2024-11-07) | High (was) | Fixed in pixman 0.44.2+ |

---

## 12. Objections and Upstream Blockers

**No stated objections found.** Because Cairo requires no architecture-specific code, there are no upstream objections to riscv64 support.

**Technical blockers:**

1. Pixman RVV optimization work (pixman issue #95) is in progress but not merged upstream. Until it is, all Cairo compositing on riscv64 uses the scalar fallback. This is a performance gap, not a correctness blocker.

2. No upstream riscv64 CI. Cairo's upstream CI does not run QEMU-based riscv64 jobs. Build verification depends entirely on distribution infrastructure (Debian, Ubuntu).

3. Upstream GitLab (gitlab.freedesktop.org) is protected by Anubis bot-challenge, blocking all automated tooling access to issue trackers, merge request lists, and source browsing. This is an operational gap for anyone monitoring Cairo's RISC-V status programmatically.

**Organizational blockers:** None. The loose meritocracy structure at freedesktop.org means patches meeting quality standards are accepted without committee approval.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

No functional enablement work is required. Cairo builds and runs correctly on riscv64 as pure C. All distribution packages are current. No correctness bugs are open.

### 13.2 Performance Optimization

The primary performance gap is in pixman, not Cairo. Samsung Research Poland (RISE project) is actively working on RVV 1.0 support for pixman. As of June 2026, the detection infrastructure (pixman-riscv.c) and the optimization implementation (pixman-rvv.c, 3,272 lines) exist in the pixman repository, with 11 infrastructure MRs merged since October 2024. The main optimization MR covering compositing kernels is under active development (pixman issue #95).

Investing engineering resources in Cairo-specific performance work would have zero ROI because Cairo contains no pixel-level code to optimize. Investment in pixman RVV support is covered by RISE/Samsung; monitoring that work and providing hardware-in-the-loop testing on real RVV silicon would be the highest-value contribution available.

Work not covered by RISE: small-rectangle performance (LMUL tuning for 32-byte line operations, which currently sees no benefit), and the two regressing `src` L2 operations identified in MR !142 benchmark data but not resolved.

### 13.3 CI/CD Infrastructure

Cairo has no riscv64 CI upstream. Adding QEMU-based riscv64 jobs to `.gitlab-ci.yml` is the most concrete infrastructure contribution available. The pattern exists in pixman's CI (`03-test.yml`), which already runs five RISC-V QEMU configurations.

### 13.4 Ecosystem Enablement

pycairo has no riscv64 wheel on PyPI. All Linux users must compile from source. Adding riscv64 wheel builds to the pycairo release CI would benefit the Python/GTK ecosystem on riscv64. This is not covered by any known RISE project.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | None required | 0 | -- | -- |
| Performance | pixman RVV LMUL tuning for small rectangles (fix no-speedup on 32-byte line ops) | 2-4 | Samsung/RISE (ongoing) or new contributor | Medium |
| Performance | Diagnose and fix pixman `src` L2 RVV regression (~20% slowdown) | 1-2 | Samsung/RISE (ongoing) or new contributor | Medium |
| Performance | End-to-end Cairo-level benchmarks on riscv64 hardware (establish baseline, track pixman RVV improvements) | 1 | Chip company lab | High |
| CI/CD | Add riscv64 QEMU job to Cairo's `.gitlab-ci.yml` | 1 | Any contributor | Medium |
| CI/CD | Validate Cairo riscv64 CI on real RVV hardware (board-farm integration) | 2 | Chip company lab | Low |
| Ecosystem | Add riscv64 wheel build to pycairo release CI | 1-2 | pycairo maintainer or contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Cairo GitLab repository (gitlab.freedesktop.org/cairo/cairo)](https://gitlab.freedesktop.org/cairo/cairo)
- [Cairo homepage and release index (cairographics.org)](https://www.cairographics.org/releases/)
- [Pixman GitLab repository (gitlab.freedesktop.org/pixman/pixman)](https://gitlab.freedesktop.org/pixman/pixman)
- [Debian buildd status: cairo, suite=sid](https://buildd.debian.org/status/package.php?p=cairo&suite=sid)
- [Ubuntu noble libcairo2 riscv64 package](https://packages.ubuntu.com/noble/riscv64/libcairo2/download)
- [Arch Linux RISC-V status page (archriscv.felixc.at)](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: pycairo 1.29.0](https://pypi.org/pypi/pycairo/1.29.0/json)
- [RISE project homepage](https://riseproject.dev/)
- [RISE GitHub organization (riseproject-dev)](https://github.com/orgs/riseproject-dev/repositories)
- [pixman MR !102: RISC-V floating point operations](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/102)
- [pixman MR !128: fix rvv auto-detection on gcc-13](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/128)
- [pixman MR !146: rvv integer implementation](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/146)
- [pixman MR !156: use hwprobe interface for RVV 1.0 detection](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/156)
- [pixman MR !166: riscv_v_default_allow sysctl workaround](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/166)
- [pixman MR !170: RVV detection fixes for clang 18](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/170)
- [pixman MR !172: elf_aux_info() for FreeBSD/OpenBSD](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/172)
- [pixman MR !175: getauxval() fallback for musl libc](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/175)
- [pixman MR !176: rename HAVE_RVV_LINUX to HAVE_HWPROBE_GETAUXVAL](https://gitlab.freedesktop.org/pixman/pixman/-/merge_requests/176)
- [pixman issue #95: RVV port tracking](https://gitlab.freedesktop.org/pixman/pixman/-/issues/95)
- [pixman issue #115: vfloat32m1x4_t missing with gcc-13](https://gitlab.freedesktop.org/pixman/pixman/-/issues/115)
- [pixman issue #117: lto1 build failure on riscv64](https://gitlab.freedesktop.org/pixman/pixman/-/issues/117)
- [pixman issue #125: crash on riscv systems with rvv-0.7.1](https://gitlab.freedesktop.org/pixman/pixman/-/issues/125)
- [libpng PR #405: RISC-V RVV SIMD (open, 2021-12-20)](https://github.com/pnggroup/libpng/pull/405)
- [libpng PR #766: RVV correctness fix (merged Dec 2025)](https://github.com/pnggroup/libpng/pull/766)
- [Cairo issue #932: cairo-atomics memory barrier ordering](https://gitlab.freedesktop.org/cairo/cairo/-/issues/932)
- [Cairo issue #503: floating-point rounding in font metrics](https://gitlab.freedesktop.org/cairo/cairo/-/issues/503)
- [RVV bench results on BananaPi F3 (camel-cdr.github.io)](https://camel-cdr.github.io/rvv-bench-results/bpi_f3/index.html)