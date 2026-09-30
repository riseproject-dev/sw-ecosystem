---
title: HarfBuzz
parent: Project Reports
color: yellow
dependencies:
  - name: FreeType
    relation: runtime-dependency
    criticality: critical
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: GLib
    relation: runtime-dependency
    criticality: optional
  - name: Cairo
    relation: runtime-dependency
    criticality: optional
  - name: Graphite2
    relation: runtime-dependency
    criticality: optional
  - name: WAMR
    relation: runtime-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="harfbuzz" %}

# HarfBuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for HarfBuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

HarfBuzz is an open-source text shaping engine written in portable C++11. It accepts Unicode text and a font file and returns glyph indices and positioning offsets for rendering. It is the dominant text shaping library in Linux desktop stacks (GTK, Qt, LibreOffice), mobile stacks (Android), browsers (Firefox, Chrome), and print pipelines (Adobe InDesign, LaTeX via LuaTeX). The most recent releases are CalVer-like: 14.5.1 (2026-09-30, current), 14.5.0, 14.4.0, 14.3.1, 14.3.0, 14.2.1 (2026-06-02).

**Governance.** There is no foundation, fiscal sponsor, or standards body. The project operates under the `harfbuzz` GitHub organization. No MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE, PLATFORMS.md, or SUPPORT.md file exists; governance is informal and maintainer-led. Behdad Esfahbod (personal domain behdad@behdad.org) is the de facto lead, with 1,904 of the most recent 2,329 commits (about 82 percent). The repository does carry an unusual `CODE_OF_AI_CONDUCT.md`, requiring two-human review of any AI-assisted change over roughly 100 lines, `Assisted-by:` commit trailers, and a ban on unreviewed AI output.

**Corporate involvement.** No formal sponsorship program or GitHub Sponsors/OpenCollective page exists. Active non-lead committers in the recent history include Khaled Hosny (khaled@aliftype.com, 113 commits, runs his own type foundry Alif Type), Garret Rieger (grieger@google.com, 54 commits, Google Fonts team), Dominik Roettsches (drott@chromium.org, Google/Chromium), and Qunxin Liu (qxliu@google.com, Google). The `COPYING` file's historical copyright headers additionally name Google, Facebook/Meta, Mozilla Foundation, Red Hat, Adobe, SIL International, Nokia, Igalia, and Codethink as past corporate contributors. The `AUTHORS` file also lists Lars Knoll and Simon Hausmann (Qt/KDE), Owen Taylor (Red Hat/GNOME), Martin Hosken (SIL International), and David Turner (FreeType).

**License.** "Old MIT" (`COPYING`), multi-party copyright spanning the corporate contributors above and Behdad Esfahbod personally.

**RISE relationship.** HarfBuzz is not a RISE Project member. The RISE member roster (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) contains no font/text-shaping vendor, and no RISE blog post, wiki page, or RFP project targets HarfBuzz directly (see Section 14).

**Community stance on new ports.** No tiering or platform-support policy document exists anywhere in the repository (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all absent). No explicit objection to RISC-V has ever been raised in the tracker, CI, README, or AUTHORS/THANKS files. Because HarfBuzz needs no architecture-specific porting work to run on a new ISA (see Section 4), RISC-V support has never been an active policy topic for the project one way or the other.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (none) | No RISC-V-specific commit, issue, or PR has ever been filed against harfbuzz/harfbuzz. Confirmed via `search_issues`, `search_pull_requests`, and `search_commits` for "riscv"/"riscv64" (0 genuine hits across all), a full-tree `git grep -il riscv` on a local clone (0 hits), and independent `search_code` (`riscv64 OR riscv repo:harfbuzz/harfbuzz` -> total_count 0) | [harfbuzz/harfbuzz code search](https://github.com/harfbuzz/harfbuzz/search?q=riscv&type=commits) |
| 2025-08-18 | PR #5478 merged: Dependabot bump of `ninja` from 1.11.1.4 to 1.13.0 in `/.ci`. Matched a "riscv64" search only because the linked upstream `ninja-python-distributions` changelog mentions adding riscv64 wheels in that unrelated project; the PR itself has no RISC-V content | [PR #5478](https://github.com/harfbuzz/harfbuzz/pull/5478) |
| 2026-09-07 | PR #6247 merged: Dependabot bump of `hendrikmuhs/ccache-action` from 1.2.23 to 1.2.24. Same pattern: matched only via the linked `ccache-action` changelog mentioning a riscv64 ccache release; no RISC-V content in the PR itself | [PR #6247](https://github.com/harfbuzz/harfbuzz/pull/6247) |

There is no HarfBuzz RISC-V port in the conventional sense, and consequently no "upstreaming" question applies. HarfBuzz is a portable C++ library with zero architecture-specific code for any platform (see Section 4); it builds on riscv64 via a standard cross-compilation or native toolchain with no HarfBuzz-authored RISC-V work of any kind. Ubuntu 26.04 ("resolute") builds and ships 12 of 15 HarfBuzz-related binary packages for riscv64 from unmodified upstream source, confirmed by direct HTTP fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=HarfBuzz&suite=resolute&searchon=names&section=all) (version 12.3.2-2, `amd64 arm64 armhf i386 ppc64el riscv64 s390x`). No key contributors exist for "RISC-V support" because riscv64 is handled entirely by compiler and toolchain portability, not by any HarfBuzz-side effort.

## 3. Upstream Support Tier

HarfBuzz has no documented platform-tier policy. Effective support is inferred entirely from what CI exercises and what carries binary releases.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (all 15 GitHub Actions workflows run on ubuntu-22.04/24.04/26.04, macos-latest, or windows-latest x86_64/Windows runners) | Partial (`arm.yml` targets `arm-none-eabi` bare-metal, Nintendo 3DS via devkitARM, itself built on an ubuntu-22.04 x86_64 runner; no Linux arm64 job exists) | No (confirmed zero across all 15 workflow files, and no `.gitlab-ci.yml`/`.cirrus.yml`/`Jenkinsfile` exist in the repo) |
| Release-blocking | Yes | No | No |
| Official GitHub Release binaries | None for Linux (source tarball only); Windows win32/win64 ZIPs shipped for some releases, e.g. 14.4.0/14.5.0, but not the current 14.5.1 | No | No |
| Ubuntu 26.04 "resolute" packaging | Yes | Yes | Yes (12 of 15 matched HarfBuzz packages carry a riscv64 build at 12.3.2-2, confirmed by direct HTML fetch) |

HarfBuzz upstream provides no Linux binary for any architecture, including amd64: the latest release (14.5.1, 2026-09-30) ships only `harfbuzz-14.5.1.tar.xz` plus auto-generated zip/tar.gz source archives, with no Windows zips this cycle either. In that specific respect, riscv64 is on par with amd64 (neither gets an upstream Linux binary). Where riscv64 falls behind every other architecture is CI: it has zero coverage of any kind, versus full x86_64 coverage and partial (bare-metal-only) ARM coverage.

## 4. Technical Architecture and RISC-V-Specific Subsystems

HarfBuzz has no architecture-specific code for any platform, RISC-V included. This was independently verified, not assumed: `search_code` queries for `#ifdef __riscv`, `__x86_64__ OR __aarch64__ OR __riscv`, `sse OR avx OR neon OR simd path:src`, and `immintrin.h OR arm_neon.h OR riscv_vector.h`, all scoped to `repo:harfbuzz/harfbuzz`, each returned 0 results. A sanity check (`hb_buffer_t repo:harfbuzz/harfbuzz`, 120 hits) confirmed the search tooling itself works correctly against this repository, so the zero-results above reflect genuine absence rather than a blocked search.

There is no SIMD dispatch layer, no JIT backend, no cryptographic primitive, no hand-written assembly, and no ISA-specific intrinsic header anywhere in `src/`. The only internal "SIMD-like" abstraction is `hb_vector_size_t` in `src/hb-bit-page.hh`, a plain C++ template performing bitwise operations element-wise with no `#ifdef` guards; vectorization, if any, is left entirely to the compiler's auto-vectorizer. Atomic operations (`src/hb-atomic.hh`) delegate to compiler builtins (`__atomic_*`) or `std::atomic`, dispatching on compiler, not CPU architecture. `src/hb-algs.hh` uses `__builtin_bswap16/32/64`, `__builtin_clz/ctz`, and `__builtin_popcount*`, all with defined behavior on GCC/Clang for riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bit-page operations (`hb_vector_size_t`) | Scalar C++ template (compiler may auto-vectorize to SSE/AVX) | Scalar C++ template (compiler may auto-vectorize to NEON) | Scalar C++ template (compiler may auto-vectorize to RVV with `-march=rv64gcv`) |
| Atomics | Compiler builtins / `std::atomic` | Same | Same |
| Endian byte-swap | `__builtin_bswap{16,32,64}` | Same | Same |
| Bit count (popcount/clz/ctz) | `__builtin_popcount*` | Same | Same |
| Shaping engine (OpenType, AAT, Graphite) | Pure C++, no ISA guards | Pure C++, no ISA guards | Pure C++, no ISA guards |
| JIT | None | None | None |
| Crypto | None | None | None |
| Assembly (.S) files | None (0 confirmed by file-count comparison) | None (0) | None (0) |
| Hand-tuned SIMD intrinsics | None | None | None |
| RVV (RISC-V Vector) intrinsics | N/A | N/A | None |
| Zba/Zbb/Zbc extension usage | N/A | N/A | None |

An independent file-count comparison (amd64 vs arm64 vs riscv64 arch-specific source files) found zero for all three architectures. HarfBuzz's entire shaping/layout hot path (`hb-ot-shape*.cc`, `hb-buffer.cc`, `OT/Layout/GPOS/GSUB`, the Arabic/Khmer/Myanmar/USE shapers) is portable ISO C++ with no per-architecture source split. The characterization "riscv64 implementation is a stub" does not apply: there is no per-arch implementation surface in this codebase at all, so riscv64 gets exactly the same scalar, portable code every other architecture gets, unvalidated by upstream CI but not gated behind any incomplete or architecture-specific code path either.

The one architecture-conditional line in `meson.build` sets `-mstructure-size-boundary=8` for `cpu_family == 'arm'`; no equivalent exists for riscv64, nor is one needed.

**Performance implication.** Because the vectorizable code paths rely entirely on compiler auto-vectorization, riscv64 throughput depends on compiler version and whether it emits RVV instructions for the bit-page loop. No benchmark data exists anywhere (RISE, Phoronix, or general web search all returned nothing HarfBuzz-and-riscv64-specific) to quantify this gap; see Section 6.

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build system:** Meson (`meson.build`, `meson_version: '>= 0.60.0'`, `version: '14.5.0'` at last check, `default_options: ['cpp_std=c++11', ...]`). Generic build: `meson build && ninja -Cbuild && meson test -Cbuild`.

**CMake** exists as a community-maintained secondary path, explicitly flagged as unsupported: `CMakeLists.txt` emits `message(WARNING "The main build system for HarfBuzz is Meson. CMake build support is community-maintained...")`. `cmake_minimum_required(VERSION 3.14)`, default `CMAKE_CXX_STANDARD 11`.

**C++ standard:** C++11 minimum; auto-upgrades to C++17 only if ICU >= 75.1 is linked. No minimum GCC/Clang version is documented for any architecture, riscv64 included; the only stated floor is C++11 support.

**Files that do not exist:** `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md` (the real top-level doc is `BUILD.md`); `cmake/riscv64.cmake` or any `cmake/` directory (the one `.cmake` file in the repo, `replace-enum-strings.cmake`, is an unrelated helper); any Dockerfile anywhere in the repo (`.ci/` holds only `build-win.sh`, `deploy-docs.sh`, Python requirements files, and the MinGW cross files `win32-cross-file.txt`/`win64-cross-file.txt`).

**Native riscv64 build (Debian/Ubuntu buildd configuration pattern, confirmed successful without patches):**

```bash
export LC_ALL=C.UTF-8
export DEB_BUILD_MAINT_OPTIONS="hardening=+all"
meson setup build-main -Dauto_features=enabled -Dgraphite2=enabled
meson compile -C build-main
```

**Cross-compilation for riscv64.** No upstream cross-file exists for riscv64; the only precedent in-tree is the MinGW cross files (`.ci/win32-cross-file.txt`, `.ci/win64-cross-file.txt`). A cross-file following that pattern:

```ini
[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkg-config = 'riscv64-linux-gnu-pkg-config'
exe_wrapper = 'qemu-riscv64'
```

```bash
meson setup build --cross-file riscv64-cross-file.txt \
  -Dauto_features=disabled \
  -Dfreetype=enabled -Dglib=enabled -Dsubset=enabled \
  -Dtests=disabled
```

Flags worth disabling without a full riscv64 sysroot, per `meson_options.txt`: `-Dgpu=disabled` (requires OpenGL/GLEW/GLFW), `-Dintrospection=disabled` (needs to run binaries on host), `-Ddocs=disabled`, `-Dtests=disabled` (execution needs `qemu-riscv64`), `-Dbenchmark=disabled`, `-Dutilities=disabled` (hb-view/hb-shape need GLib+Cairo at runtime), `-Dwasm=disabled` (disabled by default already), `-Dharfrust=disabled` (Rust shaper, needs a riscv64 Rust target).

The equivalent CMake path: `cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=<your-riscv64-toolchain>.cmake -DHB_HAVE_FREETYPE=OFF -DHB_HAVE_GLIB=OFF -DHB_HAVE_ICU=OFF -DHB_BUILD_UTILS=OFF`.

**Minimal single-file build (no build system):** `g++ -std=c++11 src/harfbuzz.cc -DHB_TINY -Os -o harfbuzz.o` (`-DHB_TINY` restricts to OpenType-only shaping, drops thread-safety and debug features, for a smaller embedded footprint).

**Closest in-tree analog for cross/embedded builds** is `.github/workflows/arm.yml` in full:

```yaml
jobs:
  arm-none-eabi:
    runs-on: ubuntu-22.04
    container:
      image: devkitpro/devkitarm:latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Configure CMake
        run: |
          cmake -S . -B build \
            -DBUILD_SHARED_LIBS=OFF \
            -DCMAKE_TOOLCHAIN_FILE=${DEVKITPRO}/cmake/3DS.cmake
      - name: Build
        run: make CXX_FLAGS="-w -DHB_NO_MT"
        working-directory: build
```

This targets Nintendo 3DS bare-metal (`arm-none-eabi`), not Linux ARM, and its build runs on a standard x86_64 GitHub-hosted runner; the toolchain container is pulled from Docker Hub rather than built in-repo. No riscv64 equivalent exists.

**Known build failures on riscv64:** None found. No upstream issue mentions a riscv64 build failure, and downstream distro builds (Ubuntu 26.04, and per the existing packaging record, Debian) succeed from unmodified source.

**QEMU usage.** Not referenced anywhere in the harfbuzz/harfbuzz repository or its CI. `exe_wrapper = 'qemu-riscv64'` above is a user-supplied convention (modeled on Meson's standard cross-file pattern for running cross-built test binaries under emulation), not something HarfBuzz ships or documents.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| OpenType shaping (Latin, CJK, Indic, RTL) | Full | Full | Full |
| AAT (Apple Advanced Typography) shaping | Full | Full | Full |
| Graphite2 smart-font shaping (optional dep) | Full | Full | Full |
| Font subsetting (hb-subset) | Full | Full | Full |
| SVG / COLRv1 / CBDT/sbix color fonts | Full | Full | Full |
| GPU-accelerated rendering (hb-gpu, experimental) | Experimental | Experimental | Experimental |
| WASM shaper backend (`-Dwasm`, experimental, disabled by default) | Experimental | Experimental | Experimental (see Section 9 for the WAMR/iwasm backend's own riscv64 gaps if enabled) |
| Harfrust shaper (experimental) | Experimental | Experimental | Experimental |
| Upstream GitHub Release binary | Source tarball only as of 14.5.1 (Windows zips shipped in some earlier releases, not this one) | None | None |
| Upstream CI coverage | Full | None (Linux); bare-metal only | None |
| Distro packaging | Full | Full | Full (Ubuntu 26.04 confirmed live; prior Debian/Arch RISC-V packaging also on record) |

**Functional gaps:** None. Every HarfBuzz feature is available on riscv64 because the library has no architecture-conditional feature compilation.

**Performance gaps:** Unquantified. No benchmark comparing HarfBuzz on riscv64 to arm64 or amd64 exists in any indexed public source as of 2026-09-30; this was checked directly (RISE site, Phoronix, general web, GitHub) and confirmed absent rather than merely hard to find. For context only (not RISC-V data): Phoronix reported HarfBuzz 12.3 was 12 percent faster on an Apple Silicon AAT benchmark and 20 percent faster on an x86/Apple-silicon OpenType-shaping benchmark from fast-path/Coverage-caching work ([Phoronix](https://www.phoronix.com/news/HarfBuzz-12.3-Released)); this has no riscv64 figures and should not be read as one. A separate web search result claiming a "HarfBuzz 14.0 GPU-accelerated text rendering" announcement dated April 1 could not be verified against any release note and is flagged as likely a hoax, not a fact.

**Security hardening gaps:** None specific to riscv64 identified.

**Floating-point / integer-overflow issues:** Three open, architecture-neutral UB issues exist that could in principle surface differently under riscv64 compilers or optimization levels, though none is riscv64-specific: #5975 (signed integer overflow in GPOS attachment-offset propagation), #5604 (invalid pointer conversion in `coverage-graph.hh`), and #6031 (CFF1 subsetting Card8 overflow). See Section 11.

## 7. CI/CD Infrastructure

HarfBuzz uses GitHub Actions exclusively. All 15 workflow files were read directly (via a local clone of HEAD `82ec48207b446afcf787a86d2ca4f768685e68d`, since this session's GitHub MCP access was restricted to a different repository) and cross-checked with a repository-wide `git grep -il riscv` (0 matches) and `search_code` (`riscv64 OR riscv repo:harfbuzz/harfbuzz` -> 0). No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists.

| Workflow | Platforms covered | riscv64 |
|---|---|---|
| linux.yml | ubuntu-24.04/26.04 x86_64 | No |
| macos.yml | macOS (x86_64/arm64 GitHub runners) | No |
| msvc.yml | Windows MSVC x86/amd64 | No |
| msys2.yml | Windows MSYS2 MINGW64/CLANG64 | No |
| crossbuild-mingw.yml | Windows win32/win64 cross-build | No |
| arm.yml | ARM bare-metal (`arm-none-eabi`, Nintendo 3DS devkitARM), built on ubuntu-22.04 | No |
| sanitizers.yml | asan/ubsan/tsan/msan on ubuntu | No |
| valgrind.yml | valgrind on ubuntu | No |
| cifuzz.yml | Fuzzing on ubuntu-latest | No |
| coverity-scan.yml | Static analysis | No |
| c++-versions.yml | x86_64 compiler version matrix | No |
| configs-build.yml | Build config flag variants on ubuntu-24.04, plain x86_64 | No |
| rust.yml | Rust nightly, x86_64 | No |
| docs.yml | Documentation build | No |
| scorecard.yml | Supply-chain security (OSSF Scorecard) | No |

Every `runs-on:` line across all 15 workflows resolves to a GitHub-hosted x86_64 runner (`ubuntu-22.04/24.04/26.04/latest`, `macos-latest`, `windows-latest`) or a Windows matrix variant. No riscv64 runner (hosted or self-hosted), no riscv64 matrix entry, and no QEMU riscv64 emulation step exists anywhere in CI. No RISE CI runner infrastructure is used by this project.

| CI criterion | amd64 | arm64 (Linux) | riscv64 |
|---|---|---|---|
| Build tested | Yes | No | No |
| Tests executed | Yes | No | No |
| Sanitizers (asan/ubsan/tsan/msan) | Yes | No | No |
| Fuzzing (cifuzz/OSS-Fuzz) | Yes | No | No |
| Valgrind | Yes | No | No |
| Static analysis (Coverity) | Yes | No | No |
| Hardware runners | GitHub-hosted x86_64 | N/A | N/A |
| QEMU used | No | N/A | N/A |

## 8. Distribution and Release Status

**Upstream GitHub Releases.** Confirmed directly against the current release (14.5.1, published 2026-09-30): assets are `harfbuzz-14.5.1.tar.xz` plus auto-generated `.zip`/`.tar.gz` source archives only, no Windows zips this cycle. The prior releases checked (14.5.0, 14.4.0) each carried `harfbuzz-<ver>.tar.xz`, `harfbuzz-win32-<ver>.zip`, `harfbuzz-win64-<ver>.zip`. No release, current or recent, contains a riscv64 (or any Linux) binary asset.

**Ubuntu 26.04 "resolute".** Confirmed via direct HTTP fetch (not just a summarized crawl) of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=HarfBuzz&suite=resolute&searchon=names&section=all): 15 matching packages, 12 of which carry a riscv64 build at version 12.3.2-2 (`amd64 arm64 armhf i386 ppc64el riscv64 s390x`): `libharfbuzz0b`, `libharfbuzz-bin`, `libharfbuzz-dev`, `libharfbuzz-cairo0`, `libharfbuzz-gobject0`, `libharfbuzz-icu0`, `libharfbuzz-subset0`, `libharfbuzz-shaper-perl`, `gir1.2-harfbuzz-0.0`, `python3-uharfbuzz`, `r-cran-freetypeharfbuzz`, and the Haskell `libghc-gi-harfbuzz-dev`/`-prof` bindings. `libharfbuzz-doc` and `libghc-gi-harfbuzz-doc` are architecture-independent (`arch: all`).

**Arch Linux RISC-V.** The suggested verification method (`archriscv.felixc.at/?q=harfbuzz`) does not function as a package search; it returns a static page that ignores the query string regardless of input, so no positive or negative claim about core `harfbuzz` availability can be made from it. The site's status/problem table (`archriscv.felixc.at/.status/status.htm`) lists only `haskell-gi-harfbuzz` (binding-layer, flagged DEP BROKEN against `ghc-libs`/`ghc`) and does not show a core `harfbuzz` entry, but that table tracks only flagged/changed packages, not a full index, so absence there is not proof of a working build. **Arch Linux riscv64 status for the core package is therefore unresolved and should not be cited either way.**

**PyPI.** No package literally named `harfbuzz` exists (`https://pypi.org/pypi/harfbuzz/json` returns HTTP 404; `https://pypi.org/simple/harfbuzz/` likewise 404). The actual Python binding is the separately named project `uharfbuzz`, packaged in Ubuntu as `python3-uharfbuzz` (confirmed riscv64-built in Ubuntu 26.04, see above). The RISE wheel-builder GitLab index for the literal name `harfbuzz` (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/harfbuzz/`) redirects to the same 404 PyPI page, consistent with no such package name existing at all; see Section 10 for `uharfbuzz` itself.

**What a user needs today to get a working riscv64 binary:** install the distro package (e.g. `apt install libharfbuzz-dev` on an Ubuntu 26.04 riscv64 system) or build from the upstream source tarball with the standard Meson toolchain. No patches or workarounds are required in either path.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| FreeType | Font outline rasterization (runtime, critical) | Portable C; no known riscv64-specific gap | No riscv64-specific CI found | Packaged for riscv64 in Ubuntu 26.04 (part of the confirmed distro chain) | No upstream issues mentioning riscv64 found |
| ICU | Optional `icu-uc` Unicode-callback shaping backend (`meson` feature `icu`, `auto`); runtime, optional | Architecture-neutral C++; portable | No ICU-specific riscv64 CI; `search_issues query="riscv64" repo:unicode-org/icu` returned 0 open/recent hits this session | Distro packages only; no upstream binary releases | One historical bug: 2021 UB in `ComplexUnitsConverter::applyRounder()` producing wrong results on riscv64 (masked on x86_64), fixed the same year via PR #1946 (duplicate of stalled PR #1715). No live blocking issue found |
| zlib | Compression codec feeding the raster/PNG output path (`zlib` feature, `auto`); runtime, optional | Portable C, no arch-specific code; upstream CI merged an OpenBSD/riscv64 build+test job (PR #1139, merged 2026-01-28) | OpenBSD/riscv64 passes in upstream CI; no native Linux/riscv64 CI job found | Source-only releases (v1.3.2 latest); no prebuilt binaries for any architecture, distro packages are the release channel | No merged or open blocking issues. Two unmerged RVV-Adler32 performance PRs (#1099, #1267, both self-closed) from a contributor are optional acceleration, not correctness blockers |
| libpng | PNG raster image output for color bitmap glyphs (`png` feature, `auto`); runtime, optional | Confirmed in Ubuntu 26.04 riscv64 (`libpng16-16t64`, `libpng-dev`, `libpng-tools`, 1.6.57-1) | No upstream CI tests riscv64 (all 4 GitHub Actions workflows plus AppVeyor have zero "riscv" references); distro build is the only verification | No upstream GitHub Release binaries for any architecture; distro-packaged only | An RVV-accelerated path exists on the stable `libpng16` branch but is orphaned/dead on the new default `libpng18` branch (missing `riscv/check.h` dispatch wiring); this is a real regression only for someone building the GitHub default branch directly, not for packaged builds (RVV is off by default regardless) |
| GLib | Unicode functions, optional GObject bindings (`glib`/`gobject` features); runtime, optional | Packaged for riscv64 in Ubuntu 26.04 (`gir1.2-harfbuzz-0.0` and related bindings confirmed) | Not independently checked this pass | Distro-packaged | No riscv64-specific issues found |
| Cairo | 2D rendering backend (`cairo` feature); runtime, optional | Packaged for riscv64 (`libharfbuzz-cairo0` confirmed in Ubuntu 26.04) | Not independently checked this pass | Distro-packaged | No riscv64-specific issues found |
| Graphite2 | SIL Graphite smart-font shaping (`graphite`/`graphite2` features); runtime, optional | Packaged for riscv64 | Prior data showed a sparc64 bus error in "underflow" tests, riscv64 clean | Distro-packaged | No active upstream GitHub repo; Debian-maintained |
| WAMR (iwasm) | Experimental WebAssembly shaper backend (`wasm` feature, **disabled by default**); runtime, optional | Not packaged for riscv64 (or any architecture) in any distro checked | riscv64 is WAMR's lowest self-declared tier ("Tier C, experimental, users accept full responsibility"); only CI coverage is QEMU+NuttX spec-tests, not release-blocking | Zero riscv64 assets across the last 5 WAMR GitHub Releases (2.4.1-2.4.5); all release binaries are x86_64-only | No Fast-JIT codegen backend for riscv64 at all (`fast-jit/cg/` has only `x86-64/`; riscv64 JIT delegates entirely to LLVM ORC-JIT); Wasm SIMD (`v128`) is unconditionally disabled on riscv64 with no RVV intrinsics anywhere in the tree; open correctness bug in the AOT relocation resolver at opt-level>0 (WAMR issue #4765); XIP AOT is explicitly excluded from riscv64 CI. Since this backend is opt-in and disabled by default in HarfBuzz, none of this affects HarfBuzz's core build |
| Meson | Primary build system; build, critical | N/A (build tool, not a target-platform dependency) | N/A | Packaged for riscv64 across major distros | No known riscv64 issues |
| Ninja | Backing build tool for Meson; build, critical | N/A | N/A | Packaged for riscv64 | No known riscv64 issues |
| CMake | Community-maintained alternate build system; build, optional | N/A | N/A | Packaged for riscv64 | Explicitly unsupported by core HarfBuzz maintainers regardless of architecture |
| QEMU | Used via `exe_wrapper = 'qemu-riscv64'` to run cross-built riscv64 test binaries; test, optional | N/A | N/A | Packaged for riscv64 host systems (runs riscv64 binaries under emulation on other host architectures) | Not referenced anywhere in HarfBuzz's own CI; relevant only to a user-constructed cross-build/test workflow |

**Bottom line.** None of the four dependencies with architecture-sensitive code (zlib, libpng, ICU, WAMR) has a riscv64 gap that reaches HarfBuzz's default build. zlib and libpng are portable C with no functional riscv64 gap beyond libpng's dead-branch RVV regression on its own unstable default branch (irrelevant to distro packages and to HarfBuzz, which does not enable that path). ICU's one riscv64-triggered bug was fixed in 2021. WAMR, the only dependency with a real riscv64 weakness (Tier-C, no Fast-JIT, SIMD disabled, unpackaged, no release binaries), is an experimental, disabled-by-default optional shaper backend, not a requirement for HarfBuzz's core functionality.

## 10. Ecosystem Status

HarfBuzz's core library has no dependent package ecosystem of the kind this section targets (it is a system library consumed via C ABI, not a package-manager-distributed unit with a large downstream dependent graph analogous to, say, an npm or PyPI ecosystem). However, its official Python binding, `uharfbuzz` (a separate PyPI/Debian project, not literally named `harfbuzz`), is the subject of active, concrete, RISE-funded riscv64 enablement work, and other packages bundle or depend on HarfBuzz in ways that surface riscv64-specific tradeoffs, so this section is included to cover that binding-and-consumer layer.

**RISE `python-wheels` project.** Confirmed via direct inspection of `riseproject-dev/python-wheels` (created 2026-06-16, 809 open issues, actively updated through 2026-09-30; this is the project backing `pypi.riseproject.dev`, RISE's supplementary riscv64 wheel index):

- **uharfbuzz**, HarfBuzz's official Python binding, has riscv64 wheels built and released: [uharfbuzz-v0.56.1](https://github.com/riseproject-dev/python-wheels/releases/tag/uharfbuzz-v0.56.1-20260918204720) and [uharfbuzz-v0.56.2](https://github.com/riseproject-dev/python-wheels/releases/tag/uharfbuzz-v0.56.2-20260924124714). [PR #1930](https://github.com/riseproject-dev/python-wheels/pull/1930) (author luhenry, merged 2026-09-14) fixed a versioning defect where a riscv64-compatibility patch (staging the vendored HarfBuzz license file) left the git checkout dirty relative to the v0.56.0 tag, causing `setuptools_scm` to emit a dev version instead of a clean release string; fixed via `CIBW_ENVIRONMENT: SETUPTOOLS_SCM_PRETEND_VERSION=...`.
- **pygame-ce**: [PR #1819](https://github.com/riseproject-dev/python-wheels/pull/1819) ("add build-pygame-ce.yml for riscv64 wheels", author luhenry, 2026-09-21) deliberately excludes HarfBuzz-based text shaping from SDL_ttf on riscv64. Although Rocky Linux 10 ships `harfbuzz-devel` for riscv64, `libharfbuzz` pulls in `libglib-2.0`/`libgraphite2`, which `auditwheel` would vendor into the wheel and create copyleft-licensing exposure; the PR instead adds a patch marking HarfBuzz-dependent tests (`test_font_set_script`, `test_font_set_direction`) as requiring system dependencies.
- **kivy**: [PR #2548](https://github.com/riseproject-dev/python-wheels/pull/2548) ("Add version 2.3.1", author luhenry, opened 2026-09-30) bundles HarfBuzz from source into kivy's riscv64 wheel (alongside SDL2, SDL2_image, SDL2_mixer, SDL2_ttf, libtiff, libwebp, libxmp, FreeType, libpng), since upstream kivy ships no riscv64 wheel at all; testing used Xvfb and Mesa installed via apt on a RISE riscv64 runner.
- All three efforts run on RISE's native riscv64 CI runner fleet (Rocky Linux 10 riscv64 hardware), the same infrastructure announced in RISE's ["Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (2026-03-24) and ["RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) (2026-05-12) posts, though neither post names HarfBuzz specifically.
- All three PRs/releases are authored by Ludovic Henry (luhenry) under RISE's `python-wheels` initiative. This is the entirety of the funded work connecting RISE to HarfBuzz: making the Python binding and HarfBuzz-dependent consumer packages installable via `pip` on riscv64, not any change to HarfBuzz's own C/C++ core or its upstream CI.

**Coverage note.** RISE's curated wheel-builder tracking dashboard ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), roughly 70 top packages such as aiohttp, numpy, pandas, pillow, scipy, tokenizers) does not list `uharfbuzz`; the wheel-release evidence above comes from the `python-wheels` GitHub repo directly, not from that dashboard, so `uharfbuzz`'s riscv64 wheel availability would not be visible to someone consulting only the dashboard.

This ecosystem work is downstream of, and does not by itself raise the grade of, the core `harfbuzz` C library covered in the rest of this report (see Section 13).

## 11. Known Bugs and Active Issues

No riscv64-specific bug has ever been filed against harfbuzz/harfbuzz. This was checked exhaustively: `riscv64 performance repo:harfbuzz/harfbuzz` returned one semantic false positive (#1034, sparc64, not riscv64, closed 2018); `riscv64 bug repo:harfbuzz/harfbuzz` (open) returned five semantic matches, none of which actually mention "riscv" or "RISC-V" in title or body; `riscv nan floating repo:harfbuzz/harfbuzz` returned zero; `riscv repo:harfbuzz/harfbuzz` returned zero; `RISC-V vector SIMD repo:harfbuzz/harfbuzz` returned two unrelated closed issues with no RISC-V mention.

Open issues with potential (architecture-neutral) relevance to riscv64 under aggressive optimization:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5975](https://github.com/harfbuzz/harfbuzz/issues/5975) | UBSAN: signed integer overflow in `propagate_attachment_offsets` (GPOS) | Open | Medium | `hb_position_t` overflow: `41600 + 2147450240`; architecture-neutral UB that could theoretically surface differently under riscv64 compilers/optimization levels; not riscv64-specific and not a blocker |
| [#5604](https://github.com/harfbuzz/harfbuzz/issues/5604) | Invalid pointer conversion in `coverage-graph.hh` | Open | Medium | C++ pointer-interconvertibility UB; architecture-neutral; stricter compilers may expose it |
| [#6031](https://github.com/harfbuzz/harfbuzz/issues/6031) | `hb-subset`: assertion failure in CFF1 Encoding subsetting (Card8 overflow) | Open | Medium | Integer overflow in the subsetting path; architecture-neutral |

Other open issues found during this research with no riscv64 relevance (listed for completeness, not investment-relevant): #6035 (empty Coverage/ClassDef objects), #5677 (x_advance regression since 11.3.0, high severity, all architectures), #5756 (subsetting a specific color font), #5804 (`sbix` dupe glyph handling), #5961 (header include completeness), #5951 (Porter-Duff compositing feature request), #5922 (GPU PNG color font support), #5936 (work-counter design), #5595 (API usefulness question), #5794 (ARMv7 32-bit build issue, unrelated architecture), #5787 (fuzzer pointer bug), #2049 (64-bit detection macro), #2319 (stress-test SIGSEGV).

The three UB issues above (#5975, #5604, #6031) are the only ones with any plausible connection to riscv64 deployment risk, and none is a blocker for the current grade (see Section 13).

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has ever stated an objection to riscv64 support, riscv64 CI, or RVV intrinsics; the topic has never been raised in the tracker, mailing list, or CI configuration.

**Technical blockers:** None for functional support; the library builds and works on riscv64 today via unmodified upstream source (Ubuntu 26.04 confirms this). Blockers to closing the CI/tier gap specifically:

1. No upstream riscv64 CI job. Adding one requires either a self-hosted riscv64 hardware runner (a RISE-member hardware vendor could plausibly contribute one) or a QEMU-based emulation step in a standard Ubuntu container. Neither requires any change to HarfBuzz's source.
2. No RVV SIMD optimization exists for the one vectorization-sensitive path (`hb_vector_size_t` in `hb-bit-page.hh`). This is a performance question, not a functional one, and there is no benchmark data yet to justify or size the work (Section 6).
3. No upstream riscv64 Meson cross-file exists in the repository; the Windows cross-files are the only template.

**Organizational blockers:** Governance is effectively a single-maintainer bottleneck (Behdad Esfahbod reviews all non-trivial patches). He is independent and reachable; response time for patches has historically varied from days to weeks. The `CODE_OF_AI_CONDUCT.md` adds a two-human-review requirement for any AI-assisted change over roughly 100 lines, which would apply to any AI-assisted riscv64 CI or intrinsics patch.

**Acceptance probability for a well-prepared riscv64 CI patch:** High. The project has previously accepted architecture/toolchain-specific CI contributions (the ARM bare-metal workflow). A QEMU-based riscv64 job following the `arm.yml` pattern has no obvious grounds for rejection.

**Acceptance probability for an RVV intrinsics patch:** Medium. The codebase currently has zero hand-written SIMD for any architecture (no SSE, no NEON, no RVV). Introducing the first ISA-specific intrinsics would set a precedent a maintainer may resist, or may want matched with equivalent SSE/NEON work for consistency, or may prefer to leave entirely to the compiler's auto-vectorizer, as is the current practice for all architectures.

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** HarfBuzz has zero upstream riscv64 CI: an exhaustive review of all 15 GitHub Actions workflow files (and confirmed absence of `.gitlab-ci.yml`/`.cirrus.yml`/`Jenkinsfile`) shows no riscv64 build, test, or matrix entry ([workflows directory](https://github.com/harfbuzz/harfbuzz/tree/main/.github/workflows)), and upstream GitHub Releases ship only a source tarball plus Windows zips (when shipped at all), with no riscv64 asset ([releases](https://github.com/harfbuzz/harfbuzz/releases)). However, Ubuntu 26.04 "resolute" builds and ships 12+ HarfBuzz binary packages (`libharfbuzz0b`, `libharfbuzz-dev`, `libharfbuzz-bin`, and others) for riscv64 from unmodified upstream source with no riscv64-specific patches required ([Ubuntu package search](https://packages.ubuntu.com/search?keywords=HarfBuzz&suite=resolute&searchon=names&section=all)), which applies the clean-distro-build floor, yielding Yellow. HarfBuzz's value proposition is correctness and feature completeness of text shaping (OpenType/AAT/complex-script support), not RISC-V-specific performance via SIMD/JIT/crypto, so the optimization-purpose modifier does not apply to this project.
- **Pending work that could change the grade:** RISE's `riseproject-dev/python-wheels` project is actively building riscv64 wheels for HarfBuzz's Python binding (`uharfbuzz`, PR #1930 and releases uharfbuzz-v0.56.1/0.56.2) and for HarfBuzz-dependent packages (kivy PR #2548, pygame-ce PR #1819), but this is downstream/binding-layer work, not upstream HarfBuzz CI, and does not by itself raise the core library's grade. No open PR adds riscv64 CI or a riscv64 cross-file to harfbuzz/harfbuzz itself. The three open, architecture-neutral UB issues (#5975 GPOS integer overflow, #5604 invalid pointer conversion, #6031 CFF1 subsetting overflow) could theoretically surface differently under riscv64 compilers or optimization levels but are not riscv64-specific and are not blockers to the current grade.

## 14. Investment Analysis

RISE has no involvement with HarfBuzz's own upstream repository, CI, or core C/C++ codebase; HarfBuzz is not a RISE Project member, and no RISE blog post, wiki page, or RFP project targets it. RISE's only touchpoint is the `python-wheels` binding/consumer-layer work described in Section 10, which should not be re-sized below.

### 14.1 Functional Enablement

HarfBuzz's core library is already fully functional on riscv64 via unmodified upstream source and distro packaging (Ubuntu 26.04 confirmed). No functional enablement work is required for the core library.

### 14.2 Performance Optimization

The primary opportunity is implementing RVV intrinsics for the bit-page operations in `src/hb-bit-page.hh` (`hb_vector_size_t`), the sole vectorization-sensitive code path in the library. No benchmark data exists to size the potential gain; establishing a riscv64-vs-arm64-vs-amd64 baseline is a prerequisite before committing to intrinsics work. A secondary, lower-effort opportunity is fixing the three open architecture-neutral UB issues (#5975, #5604, #6031), which improves robustness under riscv64 compilers/optimization levels and benefits every architecture equally.

### 14.3 CI/CD Infrastructure

Adding riscv64 CI requires either a self-hosted riscv64 hardware runner (a natural ask of a RISE Premier hardware member) or a QEMU-based `qemu-riscv64-static` emulation step in a standard Ubuntu container job, following the existing `arm.yml` pattern. Neither requires any HarfBuzz source change. This is independent of, and would sit upstream of, the RISE `python-wheels` work already in progress.

### 14.4 Ecosystem Enablement

The concrete ecosystem gap remaining after RISE's `python-wheels` work (Section 10) is narrow: `uharfbuzz` riscv64 wheels already exist and are released; the pygame-ce riscv64 wheel deliberately drops HarfBuzz shaping for licensing-exposure reasons rather than a technical riscv64 gap, and would require a differently-licensed build strategy (e.g. dynamic linking against a system HarfBuzz rather than vendoring) to close, not a code fix. Kivy's riscv64 wheel already bundles HarfBuzz successfully. No further Python ecosystem work is evidently required beyond what RISE has already funded and shipped.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required, core library is fully functional on riscv64 | 0 | N/A | N/A |
| CI/CD | Benchmark HarfBuzz on riscv64 hardware vs arm64/amd64 (prerequisite for sizing performance work) | 1 | Any contributor with riscv64 hardware | High |
| CI/CD | Add a QEMU-based (or RISE-hardware-backed) riscv64 CI job to `linux.yml` or a new `riscv64.yml`, following the `arm.yml` pattern | 1 | Contributor familiar with GitHub Actions, possibly RISE-supplied hardware | High |
| CI/CD | Provide an upstream riscv64 Meson cross-file in `.ci/`, modeled on the existing win32/win64 cross-files | 0.5 | Any contributor | Low |
| Performance | Fix the three open architecture-neutral UB issues (#5975, #5604, #6031) | 2 | Contributor with C++ UB experience | Medium |
| Performance | Implement RVV intrinsics for `hb_vector_size_t` in `hb-bit-page.hh`, contingent on the benchmark above | 3-5 | Contributor with RVV expertise | Medium (gated on benchmark results) |
| Ecosystem | Re-enable HarfBuzz text shaping in the pygame-ce riscv64 wheel via a non-vendoring (dynamic link) build strategy, avoiding the copyleft exposure that caused it to be dropped | 1-2 | RISE `python-wheels` maintainer | Low |

Total estimated investment for CI plus correctness plus benchmark baselining: approximately 4.5 person-weeks. RVV performance work is an additional 3-5 person-weeks contingent on the benchmark results justifying it.

## 15. References

- [harfbuzz/harfbuzz GitHub repository](https://github.com/harfbuzz/harfbuzz)
- [HarfBuzz homepage](https://harfbuzz.github.io/)
- [GitHub code search: riscv in harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz/search?q=riscv&type=commits)
- [HarfBuzz GitHub Actions workflows directory](https://github.com/harfbuzz/harfbuzz/tree/main/.github/workflows)
- [GitHub release assets for harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz/releases)
- [PR #5478: Bump ninja from 1.11.1.4 to 1.13.0 in /.ci](https://github.com/harfbuzz/harfbuzz/pull/5478)
- [PR #6247: Bump hendrikmuhs/ccache-action from 1.2.23 to 1.2.24](https://github.com/harfbuzz/harfbuzz/pull/6247)
- [Ubuntu 26.04 "resolute": HarfBuzz packages](https://packages.ubuntu.com/search?keywords=HarfBuzz&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: uharfbuzz](https://pypi.org/simple/uharfbuzz/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Python Now Officially Supports RISC-V (RISE blog)](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE python-wheels PR #1930 (uharfbuzz versioning fix)](https://github.com/riseproject-dev/python-wheels/pull/1930)
- [RISE python-wheels PR #1819 (pygame-ce riscv64 wheels)](https://github.com/riseproject-dev/python-wheels/pull/1819)
- [RISE python-wheels PR #2548 (kivy 2.3.1 riscv64 wheel)](https://github.com/riseproject-dev/python-wheels/pull/2548)
- [uharfbuzz-v0.56.1 release](https://github.com/riseproject-dev/python-wheels/releases/tag/uharfbuzz-v0.56.1-20260918204720)
- [uharfbuzz-v0.56.2 release](https://github.com/riseproject-dev/python-wheels/releases/tag/uharfbuzz-v0.56.2-20260924124714)
- [RISE wheel builder tracking dashboard](https://riseproject.gitlab.io/python/wheel_builder/)
- [Phoronix: HarfBuzz 12.3 Released](https://www.phoronix.com/news/HarfBuzz-12.3-Released)
- [Issue #5975: UBSAN signed integer overflow in propagate_attachment_offsets](https://github.com/harfbuzz/harfbuzz/issues/5975)
- [Issue #5604: Invalid pointer conversion in coverage-graph.hh](https://github.com/harfbuzz/harfbuzz/issues/5604)
- [Issue #6031: hb-subset assertion failure in CFF1 Encoding subsetting](https://github.com/harfbuzz/harfbuzz/issues/6031)
- [Issue #1034: tests/variations-rvrn.tests fails on linux-sparc64](https://github.com/harfbuzz/harfbuzz/issues/1034)
- [Issue #5794: Build issues on ARMv7 32-bit platforms](https://github.com/harfbuzz/harfbuzz/issues/5794)