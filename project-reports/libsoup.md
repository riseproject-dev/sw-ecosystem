---
title: libsoup
parent: Project Reports
color: orange
dependencies:
  - name: GLib
    relation: runtime-dependency
    criticality: critical
  - name: nghttp2
    relation: runtime-dependency
    criticality: critical
  - name: SQLite
    relation: runtime-dependency
    criticality: critical
  - name: libpsl
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: GnuTLS
    relation: test-dependency
    criticality: optional
  - name: Kerberos
    relation: runtime-dependency
    criticality: optional
  - name: sysprof
    relation: runtime-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libsoup" %}

# libsoup

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libsoup<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libsoup is a GLib/GObject-based HTTP networking library written in C (`c_std=gnu99`). It implements HTTP/1.1, HTTP/2 (via libnghttp2), WebSocket, TLS integration (through GLib's pluggable TLS backend, typically backed by GnuTLS), authentication schemes (Basic, Digest, NTLM, GSSAPI/Negotiate), cookies, HSTS enforcement, caching, and content decoding (brotli, zstd, gzip). It is core GNOME infrastructure, consumed by GNOME Web (Epiphany), WebKitGTK, librest, and other GNOME stack components. 4,190 commits, 102 branches, 339 tags, 7 official releases as of the last GitLab project-page fetch.

**Governance:** libsoup is an official GNOME module hosted at [gitlab.gnome.org/GNOME/libsoup](https://gitlab.gnome.org/GNOME/libsoup); GitHub hosts only a read-only mirror. License: LGPL-2.0-or-later (per `meson.build`; earlier documentation cites LGPL-2.0-only). There is no separate "libsoup Foundation" and no dedicated per-architecture tier policy; the module is governed under standard GNOME Project/GNOME Foundation structures (module maintainers have final say over changes to their component, per the GNOME handbook).

**Homepage caveat:** The domain `libsoup.org` no longer belongs to the project - it currently resolves to an unrelated, repurposed page and must not be cited as a source. The canonical project references are the GitLab repository above and `libsoup.gnome.org`.

**Corporate sponsorship / maintainers:** Per `libsoup.doap` (GNOME/libsoup master branch), the current maintainers are Carlos Garcia Campos (cgarcia@igalia.com) and Patrick Griffis (pgriffis@igalia.com) - both Igalia employees, confirming Igalia as the de facto corporate sponsor of ongoing maintenance (consistent with Igalia's broader role across WebKit/GNOME infrastructure). Michael Catanzaro (Red Hat) is an active co-maintainer/reviewer based on recent GitLab activity. Dan Winship, the original author, is a historical/former maintainer per GNOME wiki (page retired). [NEEDS VERIFICATION]: specific commit counts attributed to individual maintainers (e.g., "461 commits Griffis, 438 Garcia Campos") and GNOME Foundation Advisory Board membership claims (Red Hat, Google, SUSE, Canonical, Endless as sponsors) come from a single prior source and were not independently reconfirmed this cycle.

**Community culture on new ports:** Passive and non-blocking. No documented process or RFC exists for adopting new CPU architectures; architecture support is treated as a downstream distribution concern, not an upstream governance matter. The only observed friction is slower riscv64 CI/test hardware causing timeout-related flakiness in downstream distro packaging (Debian/Ubuntu), not any upstream objection to riscv64 itself.

**RISE Project:** Neither GNOME nor libsoup appears in the [RISE members list](https://riseproject.dev/members/) (Premier: Google, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent, MediaTek, Alibaba Damo; General: Canonical, Andes, Microchip, ZTE, and others - all corporate/organizational members, not open-source library projects). No RISE blog post (35+ posts reviewed, 2024-2026) mentions libsoup, and the RISE Python wheel builder does not list it (expected, since libsoup is a C library, not a Python package). No RISE runner usage or funded work on libsoup was found.

## 2. Port History and Upstreaming Timeline

libsoup contains no architecture-specific code. There is no "RISC-V port" in the traditional sense - the library is portable C and compiles identically on any architecture GLib supports. The relevant history is limited to distro packaging milestones and test-infrastructure incidents caused by riscv64 build hardware being slower than x86_64.

| Date | Event | Source |
|---|---|---|
| 2018-09-30 | First documented riscv64 reference: [GitLab Issue #120](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120) "tls_interaction test fails on several architectures" lists riscv64 among affected platforms alongside armhf, hppa, mipsel, mips64el | GitLab GNOME/libsoup issue #120 |
| 2022-09-02 | [Debian Bug#1018709](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg1868207.html) filed: `libsoup3` FTBFS on riscv64, `http2-body-stream-test` timing out on Debian build daemons. Packager patch extended the test timeout and was noted as intended to be proposed upstream | Debian BTS #1018709 |
| 2022-09-05 | [MR !309](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309) "Extend timeout of test http2-body-stream" filed by Eric Long, targeting riscv64 Debian buildd (rv-manda-01) SIGTERM at 300s - plausibly the upstream submission referenced by Debian Bug#1018709 | GitLab GNOME/libsoup MR !309 |
| MR !309 closed without merge, due to conflicts with master | GitLab GNOME/libsoup MR !309 | Closed (date per prior report: 2025-05-01) [NEEDS VERIFICATION - exact close date single-sourced] |
| 2025-01-19 to 2025-01-22 | [Debian Bug#1093564](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1093564): `libsoup3` 3.6.4-1 FTBFS on riscv64, `server-test` reported as SIGSEGV but actually an insufficient test timeout on riscv64 build daemons. Fixed by raising `debian/rules --timeout-multiplier` from 5 to 6; closed in libsoup3 3.6.4-2 | Debian BTS #1093564 |
| 2025-05-01 | mcatanzaro comment on Issue #120 suggests the tls_interaction flakiness is "probably fixed by !180," pending confirmation | GitLab GNOME/libsoup issue #120 |

**Discrepancy note:** An earlier pass of this research characterized MR !309 as "unrelated to riscv64" (an http2 test-timeout MR with no riscv64 connection), while the same research's MR description and the computed readiness justification both describe it explicitly as fixing a riscv64 Debian buildd timeout. The weight of evidence (the MR's own description referencing rv-manda-01, and its citation in the readiness justification) supports treating MR !309 as riscv64-relevant; the "unrelated" characterization is very likely a search-classification error and is flagged here rather than silently dropped.

**Upstreaming status:** Functionally, libsoup needs no riscv64 port - it already builds and runs correctly. The two riscv64-specific fixes that have been needed (Debian Bug#1018709 in 2022, Debian Bug#1093564 in 2025) were both packaging-level timeout-multiplier adjustments in Debian's `debian/rules`, not upstream GNOME/libsoup code changes. No upstream commit in the GNOME/libsoup repository has been required to support riscv64.

**Key contributors:** All riscv64-specific issues were surfaced and fixed by Debian packagers (Aurelien Jarno, a Debian RISC-V porter, and Jeremy Bicha), not by Igalia or Red Hat upstream maintainers.

## 3. Upstream Support Tier

GNOME publishes no formal platform/architecture support tier document for libsoup or for GNOME modules generally. In practice, the project's de facto support model is whatever Fedora (for upstream CI) and Debian/Ubuntu/Arch (for downstream distribution) choose to build.

**Evidence from CI:** `.gitlab-ci.yml` (read directly from `gitlab.gnome.org/GNOME/libsoup/-/raw/master/.gitlab-ci.yml`, and cross-checked identical against the GitHub mirror) defines exactly these jobs, all on Fedora containers (implicitly x86_64): `build-fedora-image`, `build-fedora-autobahn-image` (Fedora 43, tag `2026-04-29-v1`, and Fedora 40 python2-compat image, tag `2025-01-14-python2-v3`), `gobject-linter`, `fedora-test`, `fedora-autobahn-quick`, `fedora-asan`, `reference`, `pages`. Runner tags used are only `ipv6` and `asan`. There is no architecture matrix, no QEMU job, no cross-compilation job, and the string "riscv" appears zero times in the file.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Yes (Fedora 43/40, all jobs) | No | No |
| Release-blocking tests | Yes | No | No |
| Official upstream binary | No (source-only releases) | No (source-only) | No (source-only) |
| Distribution binary | Yes | Yes | Yes (Debian sid, Ubuntu ports, Arch RISC-V) |
| Formal tier designation | None published | None published | None published |

riscv64 is at rough parity with arm64 from the pure-upstream perspective (neither has upstream CI, neither blocks releases, neither gets an official prebuilt binary from GNOME itself); it differs in that it required two riscv64-specific packaging fixes downstream to get building reliably, which arm64 did not.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libsoup contains no architecture-specific code of any kind. A recursive directory enumeration of the repository (`.gitlab-ci/`, `docs/`, `examples/`, `fuzzing/`, `libsoup/` with subdirectories `auth`, `cache`, `content-decoder`, `content-sniffer`, `cookies`, `hsts`, `http1`, `http2`, `include`, `server/http1`, `server/http2`, `websocket`, `po/`, `subprojects/`, `tests/`) found no `arch/` directory, no `riscv*`, `.S`/`.asm` files, and no `x86`/`arm64`/`aarch64`-named directories or files. (Two independent tree fetches returned slightly different total file counts - 449 and 539 - likely reflecting different points in repository history or counting methodology; neither changed the conclusion that zero architecture-specific files exist.) There is no SIMD, no JIT, and no cryptographic primitives implemented in libsoup itself (TLS is delegated to GLib's pluggable TLS backend/GnuTLS).

The single `host_machine.cpu_family()`-style check in the entire build system selects between 32-bit and 64-bit MSVC GSSAPI DLL names on Windows; it is not exercised on Linux/riscv64.

**Component table:**

| Component | amd64 | arm64 | riscv64 | Implementation quality |
|---|---|---|---|---|
| HTTP/1.1 stack | C scalar | C scalar | C scalar | Scalar - appropriate for this workload |
| HTTP/2 stack | C scalar | C scalar | C scalar | Scalar - appropriate for this workload |
| TLS (via GLib/GnuTLS) | Delegated | Delegated | Delegated | Inherits GnuTLS's own architecture support |
| Auth (NTLM/Digest/GSSAPI) | C scalar | C scalar | C scalar | Scalar - appropriate |
| Content decoding (brotli/zstd/zlib) | Delegated | Delegated | Delegated | Inherits per-library architecture support |
| Architecture preprocessor guards | None | None | None | N/A - none needed |

For an HTTP protocol/session-management library with no vectorizable hot path, scalar C is the correct and complete implementation strategy on every architecture, including riscv64. This is not a gap; adversarial re-verification this cycle reached the same conclusion: the "hand-tuned / intrinsics / scalar-fallback / missing" implementation-quality rubric used for compute-bound libraries (codecs, crypto, math kernels) simply does not apply to libsoup, because it has no such hot path.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson, minimum version 0.62 (declared in `project()` in `meson.build`, version 3.7.3). Language: C, `c_std=gnu99`. There is no CMake and no autotools `configure` in this project; any cmake/configure-specific riscv64 instructions would not apply.

**Required dependency minimums (from `meson.build`):**

| Tool/Dependency | Minimum | Source |
|---|---|---|
| Meson | 0.62 | `project()` in meson.build |
| GLib (glib-2.0/gobject-2.0/gio-2.0/gmodule-no-export-2.0, gio-unix-2.0) | >= 2.70.0 | meson.build |
| libnghttp2 | >= 1.50 (for RFC 9113 support) | meson.build |
| libpsl | >= 0.20 | meson.build |
| libzstd | >= 1.4.0 (optional) | meson.build |
| GnuTLS | >= 3.6.0 (test-only, PKCS#11 tests) | meson.build |
| GCC/Clang | No pinned minimum version; `c_std=gnu99` compatibility is the only constraint | meson.build |

For riscv64 cross-compilation, the Debian/Ubuntu `gcc-riscv64-linux-gnu` package is sufficient; no riscv64-specific compiler version floor is documented by upstream.

**Cross-compilation procedure:** No libsoup-specific cross-file exists in the repository; the standard Meson cross-file pattern applies. Example `/tmp/riscv64-linux-gnu.ini`:

```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
objcopy = 'riscv64-linux-gnu-objcopy'
exe_wrapper = 'qemu-riscv64-static'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[properties]
needs_exe_wrapper = true
```

Configure and build:

```bash
meson setup builddir \
  --cross-file /tmp/riscv64-linux-gnu.ini \
  -Dintrospection=disabled \
  -Dvapi=disabled \
  -Ddocs=disabled \
  -Dautobahn=disabled \
  -Dgssapi=disabled \
  -Dntlm=disabled \
  -Dsysprof=disabled \
  -Dtests=false

meson compile -C builddir
```

**Recommended flags for cross-compilation:**

| Flag | Value | Reason |
|---|---|---|
| `-Dintrospection` | `disabled` | g-ir-scanner cannot introspect cross-compiled binaries |
| `-Dvapi` | `disabled` | Vala API generation requires introspection |
| `-Ddocs` | `disabled` | gi-docgen requires introspection |
| `-Dautobahn` | `disabled` | WebSocket autobahn test suite not needed for build |
| `-Dgssapi` | `disabled` | libkrb5-dev may not be present in cross sysroot |
| `-Dntlm` | `disabled` | winbind/ntlm_auth not available in cross env |
| `-Dsysprof` | `disabled` | libsysprof-capture-4-dev requires native arch |
| `-Dtests` | `false` | Test suite requires apache2, PHP, networking; cannot run cross |
| `-Dbrotli` / `-Dzstd` | `disabled` (optional) | Disable if the corresponding `-dev` package is absent from the sysroot |

All feature options default to `auto` (silently skipped if the dependency is absent), but explicit `disabled` avoids unexpected auto-detection failures in a cross sysroot.

**QEMU usage:** The cross-file's `exe_wrapper = 'qemu-riscv64-static'` lets Meson execute test binaries under emulation on the build host. Requires `qemu-user-static` and `gcc-riscv64-linux-gnu`, with the `qemu-riscv64` binfmt_misc handler enabled (`update-binfmts --enable qemu-riscv64`). No QEMU usage exists anywhere in the project's own `.gitlab-ci.yml`.

**Known build failures:** None specific to libsoup's own source. Both documented riscv64 build failures (Debian Bug#1018709, Debian Bug#1093564) were false-alarm SIGSEGV/timeout reports on Debian's riscv64 build daemons, resolved by raising the test timeout multiplier in `debian/rules`, not by changing libsoup source. No `Dockerfile.riscv64`, `cmake/riscv64.cmake`, or riscv64-specific CI image exists in the repository (confirmed: no Dockerfile exists in the project at all - CI pulls prebuilt Fedora container images by tag rather than building from an in-repo Dockerfile).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| HTTP/1.1 | Full | Full | Full | None |
| HTTP/2 | Full | Full | Full | None |
| WebSocket | Full | Full | Full | None |
| TLS (GLib/GnuTLS integration) | Full | Full | Full | None |
| GSSAPI/Kerberos auth | Full | Full | Full | None |
| NTLM auth | Full | Full | Full | None |
| brotli decompression | Full | Full | Full (scalar) | None functional; see Section 9 for brotli's own riscv64 optimization status |
| zstd decompression | Full | Full | Full | None functional; see Section 9 for zstd's own riscv64 optimization status |
| gzip decompression | Full | Full | Full | None |
| GObject introspection | Full | Full | Full | None |
| Vala API | Full | Full | Full | None |
| PKCS#11 test integration | Full | Full | Full | None |

**Functional gaps:** None identified. Every HTTP/networking feature libsoup offers on amd64/arm64 is present and working on riscv64, as evidenced by feature-complete Ubuntu and Debian riscv64 packages.

**Performance gaps:** No RISC-V-specific performance benchmark data for libsoup exists in any public source found (RISE blog, general web search, GitHub benchmark repositories were all checked and returned nothing libsoup-specific). Any performance delta versus amd64/arm64 would flow entirely from libsoup's delegated dependencies (brotli, zstd compression) rather than from libsoup's own code, since libsoup has no vectorizable hot path of its own.

**Security hardening:** No architecture-specific hardening exists in libsoup; stack protectors, RELRO, and similar mitigations are compiler-driven and apply uniformly across architectures including riscv64.

**Floating-point / NaN semantics:** Not applicable - libsoup performs no floating-point computation.

## 7. CI/CD Infrastructure

No riscv64 CI exists for libsoup, confirmed by direct reading of `.gitlab-ci.yml` from both `gitlab.gnome.org/GNOME/libsoup/-/raw/master/.gitlab-ci.yml` and the GitHub mirror (identical content).

**Current CI configuration:**

| Job | Platform | Runner tag | Purpose |
|---|---|---|---|
| `build-fedora-image` | Fedora 43 x86_64 | (none) | Container image build |
| `build-fedora-autobahn-image` | Fedora 40 x86_64 | (none) | Autobahn test container |
| `gobject-linter` | external ghcr.io image | (none) | Lint stage |
| `fedora-test` | Fedora 43 x86_64 | `ipv6` | Build, meson test, coverage, scan-build static analysis |
| `fedora-autobahn-quick` | Fedora 40 x86_64 | `ipv6` | WebSocket autobahn tests (`allow_failure: true`) |
| `fedora-asan` | Fedora 43 x86_64 | `asan` | AddressSanitizer build |
| `reference` / `pages` | Fedora 43 x86_64 | (none) | Docs build (gi-docgen) and GitLab Pages deploy |

The pipeline uses [freedesktop-ci-templates](https://gitlab.freedesktop.org/Infrastructure/freedesktop-ci-templates) pinned at commit `8f27b815f07b7ebc3546863a2b386425291b7349` plus GNOME `citemplates` (release-service). No architecture matrix, no QEMU job, no cross-compilation job. The only runner tags in use are `ipv6` and `asan`. No `.github/workflows/` directory exists in the GNOME/libsoup GitHub mirror.

**RISE runners:** Not used. RISE has no involvement in libsoup CI.

**CI comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (Fedora 43) | No | No |
| Test CI | Yes (all jobs) | No | No |
| ASAN CI | Yes | No | No |
| Release-blocking | Yes | No | No |
| QEMU emulation | N/A | Not configured | Not configured |
| RISE runner | No | No | No |

This absence of upstream riscv64 CI is the primary driver of the orange readiness grade (Section 13): the two riscv64-specific build failures that did occur (Debian Bug#1018709, Debian Bug#1093564) were caught only by downstream Debian buildd infrastructure, never by an upstream CI signal, because none exists.

## 8. Distribution and Release Status

**Upstream releases:** libsoup ships source-only. The most recent releases (3.7.1, 3.6.6, 3.6.5, 3.6.4, 3.6.3) consist solely of `.tar.xz`/`.tar.gz`/`.zip` source archives with no binary assets attached. All releases live on [GNOME GitLab](https://gitlab.gnome.org/GNOME/libsoup/-/releases); the GitHub mirror has zero releases.

**Distribution packages:**

| Distribution | Version | riscv64 Available | Notes |
|---|---|---|---|
| [Debian sid](https://packages.debian.org/sid/libsoup-3.0-0) | 3.6.6-1 | Yes | Built across amd64, arm64, armhf, i386, loong64, ppc64el, riscv64, s390x. libsoup 2.x (2.74.3-1) removed from sid 2025-12-12; libsoup3 remains |
| Ubuntu 26.04 "Resolute" (ports archive) | libsoup-3.0-0 3.6.6-1; libsoup-2.4-1 2.74.3-10.1ubuntu5 | Yes | Confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libsoup&suite=resolute&searchon=names&section=all): `libsoup-3.0-0`, `-dev`, `-tests`, `libsoup-2.4-1`, `libsoup-gnome-2.4-1`, `libsoup-gnome2.4-dev`, `libsoup2.4-dev` all list riscv64 explicitly among built architectures (ports pocket) |
| Ubuntu 24.04 Noble | 3.4.4-5build2 | Yes | Package `libsoup-3.0-0`, 7 architectures including riscv64 (277.9 kB download / 654.0 kB installed) |
| Debian 12 bookworm (stable) | 3.2.3-0+deb12u2 | No | riscv64 was not a Debian release architecture for bookworm |
| Arch Linux RISC-V (archriscv.felixc.at mirror) | libsoup 2.74.3-4; libsoup3 3.6.5-1 | Yes | Confirmed directly against `mirrors.felixc.at/archriscv/repo/extra/`: actual riscv64 binary artifacts present (`libsoup-2.74.3-4-riscv64.pkg.tar.zst`, `libsoup3-3.6.5-1-riscv64.pkg.tar.zst`, plus signatures and `-docs` packages). No patch directory exists for libsoup3 in [felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages), implying it builds from the mainline PKGBUILD unmodified |
| Fedora | Current stable | Data not available: Fedora package tracker was not queried this cycle | [NEEDS VERIFICATION] |
| Arch Linux mainline (x86_64-centric) | 3.6.6-2 | No | riscv64 is not a tier-1 Arch architecture |

PyPI, npm, Maven, and OCI registries are not applicable release channels for libsoup - it is a C library with no PyPI package (`pypi.org/pypi/libsoup/json` returns HTTP 404) and no equivalent packages in those ecosystems.

**What a user must do to get a working riscv64 binary:** Install from Debian sid, Ubuntu 24.04/26.04 (`apt install libsoup-3.0-0`), or Arch Linux RISC-V. No source patching is required. Building from source requires only the standard Meson cross-compilation procedure in Section 5.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release (Ubuntu 26.04 resolute / Debian sid) | Blocking Issues |
|---|---|---|---|---|---|---|
| GLib | runtime-dependency (glib-2.0/gobject-2.0/gio-2.0, >= 2.70.0) - core object system, main loop, networking primitives | Critical | Archive presence confirms successful riscv64 build (`libglib2.0-dev`) | Not separately tracked in this research | Shipped (Ubuntu resolute security pocket; libglib2.0-0t64 v2.88.1-2 in Debian sid) | None identified |
| nghttp2 | runtime-dependency - HTTP/2 framing (libnghttp2, >= 1.50) | Critical | Archive presence confirms riscv64 build (`libnghttp2-dev`) | Not separately tracked | Shipped (libnghttp2-14 v1.69.0-1 Debian sid) | None; pure C, no SIMD. See `project-reports/nghttp2.md` |
| SQLite | runtime-dependency - backing store for HSTS enforcer and cookie-jar persistence | Critical | Archive presence confirms riscv64 build (`libsqlite3-dev`) | Not separately tracked | Shipped (libsqlite3-0 v3.53.2-1 Debian sid) | None. See `project-reports/sqlite.md` |
| libpsl | runtime-dependency - Public Suffix List lookups for cookie-domain validation (>= 0.20) | Critical | Archive presence confirms riscv64 build (`libpsl-dev`, Ubuntu universe) | Not separately tracked | Shipped (libpsl5 v0.21.2-1 Debian sid) | None identified |
| zlib | runtime-dependency - gzip/deflate Content-Encoding compression | Critical | Archive presence confirms riscv64 build (`zlib1g-dev`, security pocket) | Not separately tracked | Shipped (zlib1g v1.3.dfsg+really1.3.2-3 Debian sid) | None. See `project-reports/zlib.md` (notes a conservative maintainer culture toward architecture-specific PRs) |
| brotli | runtime-dependency, optional (`-Dbrotli`, libbrotlidec/libbrotlienc) - Brotli Content-Encoding | Optional | Archive presence confirms riscv64 build (`libbrotli-dev`, Ubuntu universe) | Not separately tracked | Shipped (libbrotli1 v1.2.0-3 Debian sid) | See `project-reports/brotli.md`: a 2018-merged riscv64 platform-configuration PR exists; no RISE investment; generic scalar build is functional |
| zstd | runtime-dependency, optional (`-Dzstd`, libzstd >= 1.4.0) - Zstandard Content-Encoding | Optional | Archive presence confirms riscv64 build (`libzstd-dev`, Ubuntu universe) | Not separately tracked | Shipped (libzstd1 v1.5.7+dfsg-3+b2 Debian sid) | See `project-reports/zstd.md`: riscv64 arch detection only merged into upstream zstd in December 2025; multiple optimization PRs remain open; none block correctness |
| GnuTLS | test-dependency, optional (>= 3.6.0, only pulled in for `-Dpkcs11_tests`; TLS itself goes through GLib's pluggable backend, not a direct libsoup runtime dependency) | Optional | Archive presence confirms riscv64 build (`libgnutls28-dev`, security pocket) | Not separately tracked | Shipped (Debian sid) | None identified |
| Kerberos | runtime-dependency, optional (`-Dgssapi`, krb5-gssapi) - NTLM/Negotiate (SPNEGO) HTTP authentication | Optional | Archive presence confirms riscv64 build (`libkrb5-dev`, security pocket) | Not separately tracked | Shipped (part of krb5, Debian sid) | None identified |
| sysprof | runtime-dependency, optional (`-Dsysprof`, sysprof-capture-4) - profiling/tracing capture integration | Optional | Archive presence confirms riscv64 build (`libsysprof-capture-4-dev`) | Not separately tracked | Shipped (Ubuntu resolute) | Not tracked in this repo's project registry; no dedicated report |
| Meson | build-dependency (>= 0.62) | Critical | Meson itself is architecture-independent (a Python build-system generator); no riscv64-specific concerns | N/A | N/A (host-side build tool, not a shipped runtime dependency) | None |

**Notes on methodology:** All ten runtime/test dependencies plus Meson have a `-dev` (or equivalent) package built for riscv64 in the live Ubuntu 26.04 "resolute" archive, so nothing at the Ubuntu-packaging level currently blocks a riscv64 build of libsoup. The `project-graph` internal tool, which would normally supply authoritative transitive-dependency and per-architecture test/CI data, failed to connect this cycle (`CONNECTION_CLOSED`); archive-presence data from `packages.ubuntu.com` was used as a fallback and represents a flatter signal (build success implied by package presence) than a true CI/test-pass record. This should be re-run once that tool is available. Five of the eleven dependencies (nghttp2, SQLite, zlib, brotli, zstd) have dedicated RISC-V status reports elsewhere in this repository with deeper build/test/CI detail; GLib, libpsl, GnuTLS, and Kerberos are tracked in the project registry without a dedicated report; sysprof is not tracked at all. `glibc`, while not a direct libsoup dependency, underlies the whole stack; see `project-reports/glibc.md` for its own riscv64 status.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #120](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120) | tls_interaction test fails on several architectures | Open (label: "Needs Information," last comment 2025-05-01) | Low (test-only) | riscv64 explicitly listed alongside armhf, hppa, mipsel, mips64el. Error: `Unexpected status 7 - Connection terminated unexpectedly (expected 200 OK)` in `ssl-test.c`. Full 8-comment thread shows the detailed reproduction/debugging (smcv 2020, mcatanzaro 2025) concerns x86_64/armhf timing, not riscv64 specifically - riscv64 appears only in the original architecture list, with zero riscv64-specific logs or discussion in the thread. mcatanzaro's 2025-05-01 comment suggests it may be fixed by MR !180, unconfirmed as of this writing. Not a functional networking defect. |
| [Debian Bug#1093564](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1093564) | libsoup3 FTBFS on riscv64: server-test fails | Closed (fixed in libsoup3 3.6.4-2, 2025-01-22) | Was serious (build-blocking) | Reported SIGSEGV was actually an insufficient meson test timeout for riscv64 build daemons; fixed via Debian `debian/rules` `--timeout-multiplier` 5 -> 6. A Debian packaging-only fix; no upstream GNOME/libsoup code change |
| Debian Bug#1018709 | libsoup3 FTBFS on riscv64 (test timeout, http2-body-stream-test) | Closed (2022) | Was serious | Earlier instance of the same class of riscv64-hardware-speed timeout issue; patch extended the test timeout and was intended to be proposed upstream (plausibly the origin of MR !309) |
| [MR !309](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309) | Extend timeout of test http2-body-stream | Closed without merge, due to conflicts with master | Low (test infrastructure) | Filed for riscv64 Debian buildd (rv-manda-01) SIGTERM at 300s. Could be resubmitted; one research pass mischaracterized this MR as "unrelated to riscv64," which conflicts with the MR's own description and the computed readiness justification - the "riscv64-relevant" characterization is judged more reliable (see Section 2 discrepancy note) |
| [Issue #122](https://gitlab.gnome.org/GNOME/libsoup/-/issues/122) | chunk-io-test TIMEOUT on riscv64 | Closed | Low (test infrastructure) | Resolved by extending Meson per-test timeout limits; reported ~58x slower on riscv64 vs amd64 (28.50s vs 0.49s on libsoup 2.64.0). [NEEDS VERIFICATION - not reconfirmed by this cycle's live research; carried from a prior report pass] |
| [Issue #521](https://gitlab.gnome.org/GNOME/libsoup/-/issues/521) | Probe HTTPS speed when selecting timeout-test slow mode | Open | Low (test-only) | sparcv7 explicitly affected; riscv64 not explicitly named but same root cause (slow-machine detection using HTTP speed rather than HTTPS speed) plausibly applies. [NEEDS VERIFICATION - not reconfirmed this cycle] |
| [Issue #530](https://gitlab.gnome.org/GNOME/libsoup/-/issues/530) | logger-test: /logger/long-invalid-body-length fails on 32-bit architectures | Open | Low (test-only) | 32-bit platforms only (i686); not applicable to riscv64 (64-bit). [NEEDS VERIFICATION - not reconfirmed this cycle] |

**Correctness bugs:** None. Every documented riscv64-related item is a test-infrastructure problem - timeout thresholds calibrated for faster x86_64 hardware, or a generic multi-architecture TLS-handshake race condition - not a defect in libsoup's HTTP or networking logic. General libsoup CVEs found in current searches (CRLF injection, request smuggling, duplicate-header rejection) are architecture-independent and are not riscv64 issues.

**Performance/benchmark data:** No published quantitative riscv64-vs-arm64 (or vs-amd64) performance benchmark exists for libsoup from RISE or any other source found.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No upstream developer has objected to riscv64 support in any issue, merge request, or discussion located in this research.

**Technical blockers:** None. libsoup is portable C with no architecture-specific components. Its critical dependency, GLib, already supports riscv64, and Meson supports riscv64 cross-compilation via standard cross-files.

**Organizational blockers:** None from GNOME/Igalia maintainership. The only outstanding item is MR !309 (closed without merge, due to conflicts with master), which is a small, mechanical rebase-and-resubmit task, not a policy dispute.

**Acceptance probability for upstream patches:** High. The project has previously accepted riscv64-motivated test-infrastructure patches (e.g., Issue #122's timeout extension). No unusual CLA/DCO process exists beyond standard GNOME contribution norms, and Igalia/Red Hat maintainers are active reviewers.

**CI gap:** Adding riscv64 CI would require either (a) a GNOME GitLab runner tagged `riscv64` (GNOME infrastructure does not currently provide one), or (b) a QEMU-based cross-compile job added to `.gitlab-ci.yml`. This is a GNOME infrastructure decision, not something libsoup's maintainers can unilaterally resolve.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification:** libsoup has no upstream riscv64 CI at all - GNOME's [.gitlab-ci.yml](https://gitlab.gnome.org/GNOME/libsoup/-/raw/master/.gitlab-ci.yml) runs exclusively on Fedora x86_64 containers with no architecture matrix, QEMU, or riscv tags - so the CI-based primary grade starts at orange. riscv64 binaries are shipped only downstream (Debian sid/Ubuntu 26.04 ports, Arch RISC-V), and getting there required riscv64-specific packaging patches to fix FTBFS test-timeout failures at least twice ([Debian Bug#1093564](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1093564), closed 2025-01-22, `debian/rules` timeout-multiplier 5 -> 6 "for riscv64"; also Debian Bug#1018709 in 2022 for http2-body-stream-test), which per the distribution floor caps the result at orange (downstream-only) rather than yellow (clean-distro-build). libsoup is a portable GLib/GObject HTTP library with no architecture-specific code paths, so no optimization-purpose modifier applies.

**Pending work that could change the grade:** GNOME GitLab [Issue #120](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120) (open since 2018, tls_interaction test flakiness across armhf/hppa/mipsel/mips64el/riscv64) remains open, possibly fixed by MR !180 per a 2025-05-01 comment but unconfirmed. [MR !309](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309) (rebasing the http2-body-stream timeout extension for the riscv64 Debian buildd) was closed without merging due to conflicts with master and could be resubmitted. No RISE Project involvement exists or is planned for libsoup.

## 14. Investment Analysis

RISE has no involvement with libsoup; none of the work below duplicates any funded or planned RISE activity.

### 14.1 Functional Enablement

No functional work is required. libsoup already builds and runs correctly on riscv64, as distributed by Debian sid, Ubuntu (24.04 and 26.04 ports), and Arch Linux RISC-V. All HTTP/networking features are present.

### 14.2 Performance Optimization

libsoup itself has no performance-sensitive architecture-specific code path to optimize. Any performance investment should target the compression libraries it delegates to (brotli, zstd) rather than libsoup itself; those are tracked in their own reports. No riscv64-vs-other-architecture performance benchmark for libsoup exists to establish a baseline, so a benchmarking pass (not an optimization pass) would be the prerequisite step if this were ever prioritized.

### 14.3 CI/CD Infrastructure

The only concrete, actionable investment is adding riscv64 CI to `.gitlab-ci.yml`:

- **Option A - QEMU cross-compile CI:** Add a cross-compilation job on the existing Fedora x86_64 runners using `gcc-riscv64-linux-gnu` and `qemu-riscv64-static`. Validates that libsoup compiles for riscv64 but cannot exercise the networking-dependent test suite.
- **Option B - Native riscv64 runner:** Provision a GNOME GitLab runner tagged `riscv64`, enabling full test execution including networking tests. Requires coordination with the GNOME infrastructure team, outside libsoup maintainers' unilateral control.

Separately, resubmitting MR !309 (rebased http2-body-stream timeout fix) would close the one concrete, already-drafted riscv64 fix currently sitting unmerged.

### 14.4 Ecosystem Enablement

Not applicable. libsoup is a system library consumed directly by GNOME stack components (Epiphany, WebKitGTK, librest); it has no dependent plugin/extension package ecosystem (npm, PyPI, Maven, etc.) requiring separate riscv64 enablement. (See omission of Section 10.)

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU cross-compile CI job to `.gitlab-ci.yml` | 0.5 | Contributor / Igalia | Medium |
| CI/CD | Provision native riscv64 GNOME GitLab runner | 2 | GNOME Infrastructure | Low |
| Test reliability | Rebase and resubmit MR !309 (http2-body-stream timeout) | 0.5 | Contributor | Low |
| Test reliability | Investigate/confirm fix status of Issue #120 (tls_interaction race, MR !180) on riscv64 | 1 | Igalia / Red Hat | Low |
| Benchmarking | Establish a riscv64-vs-arm64/amd64 performance baseline (none currently published) | 1 | Contributor | Low |
| Compression performance (upstream, monitor only) | Track brotli's riscv64 platform-configuration status | 0 (monitor) | brotli upstream | Low |
| Compression performance (upstream, monitor only) | Track zstd's riscv64 arch-detection/optimization PRs | 0 (monitor) | zstd upstream | Low |

Total estimated investment for libsoup-specific CI coverage and cleanup: approximately 2 person-weeks (Option A) to 5 person-weeks (Option B including infrastructure coordination). No functional or performance work is required in libsoup's own source.

## 15. References

- [GNOME/libsoup GitLab repository](https://gitlab.gnome.org/GNOME/libsoup)
- [GNOME/libsoup GitHub mirror](https://github.com/GNOME/libsoup)
- [libsoup .gitlab-ci.yml (master, raw)](https://gitlab.gnome.org/GNOME/libsoup/-/raw/master/.gitlab-ci.yml)
- [GitLab Issue #120 - tls_interaction test fails on several architectures](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120)
- [GitLab Issue #122 - chunk-io-test timeout on riscv64](https://gitlab.gnome.org/GNOME/libsoup/-/issues/122)
- [GitLab Issue #521 - Probe HTTPS speed for slow-machine detection](https://gitlab.gnome.org/GNOME/libsoup/-/issues/521)
- [GitLab Issue #530 - logger-test fails on 32-bit architectures](https://gitlab.gnome.org/GNOME/libsoup/-/issues/530)
- [GitLab MR !309 - Extend timeout of test http2-body-stream](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309)
- [Debian Bug#1093564 - libsoup3 FTBFS on riscv64: server-test fails](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1093564)
- [Debian Bug#1093564 closure notice](https://www.mail-archive.com/debian-bugs-closed@lists.debian.org/msg791980.html)
- [Debian Bug#1018709 report](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg1868207.html)
- [Debian sid libsoup-3.0-0 package](https://packages.debian.org/sid/libsoup-3.0-0)
- [Ubuntu 26.04 "Resolute" package search for libsoup](https://packages.ubuntu.com/search?keywords=libsoup&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 Noble libsoup-3.0-dev package](https://packages.ubuntu.com/noble/libsoup-3.0-dev)
- [Arch Linux RISC-V mirror, extra repo listing](https://mirrors.felixc.at/archriscv/repo/extra/)
- [felixonmars/archriscv-packages (Arch Linux RISC-V patches)](https://github.com/felixonmars/archriscv-packages)
- [GNOME GitLab libsoup releases](https://gitlab.gnome.org/GNOME/libsoup/-/releases)
- [freedesktop-ci-templates (libsoup CI infrastructure)](https://gitlab.freedesktop.org/Infrastructure/freedesktop-ci-templates)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Debian tracker for libsoup3.0](https://tracker.debian.org/pkg/libsoup3.0)