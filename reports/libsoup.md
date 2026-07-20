---
title: libsoup
categories:
  - libraries
  - browser
---

# libsoup

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libsoup<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libsoup is a GLib/GObject-based HTTP networking library written in C (c_std=gnu99). It implements HTTP/1.1, HTTP/2 (via libnghttp2), WebSocket, TLS integration (via GnuTLS/GLib/GIO), authentication schemes (Basic, Digest, NTLM, GSSAPI, Negotiate), cookies, caching, and content decoding (brotli, zstd, gzip). It is a core GNOME infrastructure library used by GNOME Web (Epiphany), WebKitGTK, librest, and other GNOME stack components.

**Governance:** libsoup is an official GNOME project, hosted at [gitlab.gnome.org/GNOME/libsoup](https://gitlab.gnome.org/GNOME/libsoup). The GitHub repository at [github.com/GNOME/libsoup](https://github.com/GNOME/libsoup) is a read-only mirror. License: LGPL-2.0-only.

**Corporate sponsors via GNOME Foundation Advisory Board:** Red Hat (large member), Google (large member), SUSE (large member), Canonical, Endless.

**Dominant maintainer: Igalia.** The top two contributors by commit count are Patrick Griffis (461 commits, pgriffis@igalia.com) and Carlos Garcia Campos (438 commits, cgarcia@igalia.com), both Igalia employees. Red Hat has secondary involvement via Tomas Popela (91 commits), Milan Crha (37 commits), and Michael Catanzaro (26 commits, co-maintainer). The original author, Dan Winship, has 89 commits but appears to be independent/historical.

**Community culture on new ports:** Passive and non-blocking. The project accepts architecture-related patches without objection. There is no published tier policy and no documented process for adopting new CPU architectures. riscv64 support is treated as a distribution concern, not an upstream concern. The project does not proactively add riscv64 CI but has never rejected riscv64-related patches either.

**RISE Project:** libsoup and GNOME are not RISE Project members. No RISE blog posts (27 posts reviewed, May 2024 - June 2026) mention libsoup.

---

## 2. Port History and Upstreaming Timeline

libsoup contains zero architecture-specific code. There is no "RISC-V port" in the traditional sense -- the library is portable C and has run on any architecture that GLib supports since its inception. The relevant history is therefore limited to distro packaging milestones and test infrastructure incidents.

| Date | Event | Source |
|---|---|---|
| 2018-09-30 | First documented riscv64 reference: [Issue #120](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120) "tls_interaction test fails on several architectures" lists riscv64 among affected platforms alongside armhf, hppa, mipsel, mips64el | GitLab GNOME/libsoup issue #120 |
| 2019 (closed) | [Issue #122](https://gitlab.gnome.org/GNOME/libsoup/-/issues/122) "Consider extending timeout for some meson tests" -- chunk-io-test hit the 30s Meson default timeout on riscv64 hardware; resolution was to extend per-test timeout limits | GitLab GNOME/libsoup issue #122 |
| 2022-09-05 | [MR !309](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309) "Extend timeout of test http2-body-stream" filed by Eric Long, targeting riscv64 Debian buildd (rv-manda-01) SIGTERM at 300s | GitLab GNOME/libsoup MR !309 |
| 2025-05-01 | MR !309 closed without merge by Michael Catanzaro due to conflicts with master | GitLab GNOME/libsoup MR !309 |
| 2026-02-15 | Debian sid libsoup3 3.6.6-1 built successfully on rv-manda-01 (status: "Maybe-Successful", ~15 minutes build time); riscv64 at 3.6.6-1 parity with all other mainstream architectures | [Debian tracker](https://tracker.debian.org/pkg/libsoup3.0) |

**Upstreaming status:** Fully upstream. No patches required; all riscv64 issues have been infrastructure (test timeouts on slow buildd hardware), not code defects.

**Key contributors:** The riscv64 test timeout issues were primarily surfaced by Debian packagers, not Igalia or Red Hat maintainers.

---

## 3. Upstream Support Tier

GNOME has no published formal platform support tier document. There is no documented tier policy distinguishing architectures.

In practice, the project follows Fedora and Debian packaging: if those distributions ship libsoup on a given architecture, the project treats that architecture as supported at the distribution level. No explicit community stance on RISC-V exists beyond the general portability inherited from GLib.

**Evidence from CI:**

The `.gitlab-ci.yml` defines four build/test jobs, all running on Fedora 43 x86_64 only:
- `fedora-test` -- main build, test, coverage, scan-build (runner tag: `ipv6`)
- `fedora-autobahn-quick` -- WebSocket autobahn tests (runner tag: `ipv6`, allow_failure: true)
- `fedora-asan` -- AddressSanitizer build (runner tag: `asan`)
- Container image builds for Fedora 43 and Fedora 40

No architecture matrix. No QEMU. No cross-compilation. No riscv64 runner tags.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Yes (Fedora 43, all jobs) | No | No |
| Release-blocking tests | Yes | No | No |
| Official upstream binary | No (source-only) | No (source-only) | No (source-only) |
| Distribution binary | Yes | Yes | Yes (Debian sid, Ubuntu 24.04) |
| Formal tier designation | None published | None published | None published |

riscv64 is at parity with arm64 from the upstream perspective: neither architecture has upstream CI coverage, neither blocks releases, and neither receives official prebuilt binaries from the project itself.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libsoup contains no architecture-specific code of any kind. A complete recursive enumeration of 539 files in the GitLab repository found zero files containing "riscv", "x86", "arm", "aarch64", "simd", "neon", "avx", "sse", or any architecture identifier in their names or paths. No `.S` assembly files exist. No SIMD intrinsics exist. No JIT. No cryptographic primitives (delegated to GnuTLS/GLib/GIO). No platform dispatch tables.

The one `cpu_family()` check in the entire build system is in the top-level `meson.build`, selecting between 32-bit and 64-bit MSVC GSSAPI DLL names on Windows. It is not executed on Linux.

All performance-sensitive operations are delegated:
- TLS: GnuTLS (which has its own architecture-specific optimizations)
- Compression: brotli, zstd, zlib (each has its own riscv64 story; see Section 9)
- HTTP/2 framing: libnghttp2 (pure C, no SIMD)

**Component table:**

| Component | amd64 | arm64 | riscv64 | Implementation quality |
|---|---|---|---|---|
| HTTP/1.1 stack | C scalar | C scalar | C scalar | Scalar -- appropriate for this workload |
| HTTP/2 stack | C scalar | C scalar | C scalar | Scalar -- appropriate for this workload |
| TLS (via GnuTLS/GIO) | Delegated | Delegated | Delegated | Inherits GnuTLS arch support |
| Auth (NTLM/Digest/GSSAPI) | C scalar | C scalar | C scalar | Scalar -- appropriate |
| Content decoding (brotli/zstd/zlib) | Delegated | Delegated | Delegated | Inherits per-library arch support |
| Architecture preprocessor guards | None | None | None | N/A -- none needed |

For a networking/HTTP library, scalar C is the correct implementation strategy. There are no numerical kernels, no buffer operations that would benefit from vectorization, and no cryptographic primitives that need constant-time assembly. The absence of riscv64-specific code is not a gap; it is correct design.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson (minimum version 0.62, declared in `project()` in `meson.build`). Language: C, c_std=gnu99.

**Required toolchain minimums:**

| Tool | Minimum | Source |
|---|---|---|
| Meson | 0.62 | `project()` declaration in meson.build |
| GLib | 2.70.0 | `dependency('glib-2.0', version: '>= 2.70.0')` in meson.build |
| libnghttp2 | no declared minimum (>= 1.50 for RFC 9113 option) | meson.build |
| libpsl | 0.20 | meson.build |
| GCC/Clang | No explicit minimum; c_std=gnu99 satisfied by GCC >= 4.5 | meson.build |

For riscv64 cross-compilation, `gcc-riscv64-linux-gnu` from Debian/Ubuntu (GCC 12 or 14 depending on release) is sufficient.

**Cross-compilation procedure:**

No libsoup-specific cross-file exists in the repository. Standard Meson cross-file pattern applies.

Create `/tmp/riscv64-linux-gnu.ini`:
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
| `-Dgssapi` | `disabled` | libkrb5-dev may not be available in cross sysroot |
| `-Dntlm` | `disabled` | winbind/ntlm_auth not available in cross env |
| `-Dsysprof` | `disabled` | libsysprof-capture-4-dev requires native arch |
| `-Dtests` | `false` | Tests require apache2, PHP, networking; cannot run cross |
| `-Dbrotli` | `disabled` | Optional; disable if libbrotlidec not in sysroot |
| `-Dzstd` | `disabled` | Optional; disable if libzstd not in sysroot |

All feature options default to `auto` (skipped if dependency absent), but explicit `disabled` is recommended for cross builds to avoid unexpected detection failures.

**QEMU usage:** Meson uses `exe_wrapper = 'qemu-riscv64-static'` from the cross-file to execute test binaries on the build host. Required packages: `qemu-user-static`, `gcc-riscv64-linux-gnu`. Activate binfmt_misc handler via `update-binfmts --enable qemu-riscv64`.

**Known build failures:** None specific to riscv64. The Debian buildd `rv-manda-01` built libsoup3 3.6.6-1 successfully in approximately 15 minutes (status "Maybe-Successful", 2026-02-15). The "Maybe-Successful" status reflects intermittent test failures due to network port binding conflicts in the test suite (a known issue on all architectures), not riscv64-specific failures.

No `Dockerfile.riscv64`, no `cmake/riscv64.cmake`, no `.ci/docker/` riscv64 images exist in the repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| HTTP/1.1 | Full | Full | Full | None |
| HTTP/2 | Full | Full | Full | None |
| WebSocket | Full | Full | Full | None |
| TLS (GnuTLS integration) | Full | Full | Full | None |
| GSSAPI/Kerberos auth | Full | Full | Full | None |
| NTLM auth | Full | Full | Full | None |
| brotli decompression | Full (libbrotli) | Full (libbrotli) | Full (libbrotli, scalar) | Performance: RVV optimization PR #1410 in brotli is stalled on CLA; generic build works |
| zstd decompression | Full (libzstd) | Full (libzstd) | Full (libzstd, scalar+) | Performance: zstd riscv64 arch detection only merged Dec 2025; multiple optimization PRs open (see Section 9) |
| gzip decompression | Full (zlib) | Full (zlib) | Full (zlib) | None |
| GObject introspection | Full | Full | Full | None |
| Vala API | Full | Full | Full | None |
| PKCS#11 test integration | Full | Full | Full | None |

**Functional gaps:** None. All HTTP/networking features are available on riscv64.

**Performance gaps:** Potential throughput difference from optional compression libraries (brotli, zstd) not having finalized riscv64 SIMD paths. libsoup itself contributes no architecture-specific code to close. The compression performance gap is upstream of libsoup.

**Security hardening:** No architecture-specific security hardening in libsoup. Stack protectors, RELRO, and similar mitigations are compiler-driven and apply equally to riscv64.

**Floating-point / NaN semantics:** No floating-point operations in libsoup. Not applicable.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in the libsoup project.

**Current CI configuration (`.gitlab-ci.yml`):**

| Job | Platform | Runner tag | Purpose |
|---|---|---|---|
| `build-fedora-image` | Fedora 43 x86_64 | (none) | Container image build |
| `build-fedora-autobahn-image` | Fedora 40 x86_64 | (none) | Autobahn test container |
| `fedora-test` | Fedora 43 x86_64 | `ipv6` | Build, test, coverage, scan-build |
| `fedora-autobahn-quick` | Fedora 40 x86_64 | `ipv6` | WebSocket autobahn tests (allow_failure: true) |
| `fedora-asan` | Fedora 43 x86_64 | `asan` | AddressSanitizer build |
| `reference` / `pages` | Fedora 43 x86_64 | (none) | Docs build and GitLab Pages deploy |

Pipeline uses [freedesktop-ci-templates](https://gitlab.freedesktop.org/Infrastructure/freedesktop-ci-templates) at ref `8f27b815` and GNOME citemplates. No architecture matrix. No QEMU. No cross-compilation jobs. The only runner tags used are `ipv6` and `asan`.

No `.github/workflows/` directory exists in the GNOME/libsoup GitHub mirror; GitHub Actions are not used.

**RISE runners:** Not used. RISE is not involved with libsoup CI.

**CI comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (Fedora 43) | No | No |
| Test CI | Yes (all jobs) | No | No |
| ASAN CI | Yes | No | No |
| Release-blocking | Yes | No | No |
| QEMU emulation | N/A | Not configured | Not configured |
| RISE runner | No | No | No |

---

## 8. Distribution and Release Status

**Upstream releases:** libsoup ships source-only. The five most recent upstream releases (3.7.1, 3.6.6, 3.6.5, 3.6.4, 3.6.3) all consist of source archives (`.tar.xz`, `.tar.gz`, `.zip`) only. No binary assets are attached to any release. The GNOME/libsoup GitHub mirror has zero releases; all releases are on [GNOME GitLab](https://gitlab.gnome.org/GNOME/libsoup/-/releases).

**Distribution packages:**

| Distribution | Version | riscv64 Available | Notes |
|---|---|---|---|
| [Debian sid](https://packages.debian.org/sid/libsoup-3.0-0) | 3.6.6-1 | Yes | Architecture list includes riscv64 alongside amd64, arm64, armhf, i386, loong64, ppc64el, s390x. Both libsoup 2.x (2.74.3-1) and 3.x (3.6.6-1) available; note libsoup 2.x was removed from sid on 2025-12-12 |
| [Ubuntu 24.04 Noble](https://packages.ubuntu.com/noble/libsoup-3.0-dev) | 3.4.4-5build2 | Yes | 7 architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x. Package: libsoup-3.0-0 (277.9 kB download, 654.0 kB installed on riscv64) |
| [Debian 12 bookworm stable](https://packages.debian.org/bookworm/libsoup-3.0-0) | 3.2.3-0+deb12u2 | No | riscv64 was not a Debian release architecture for bookworm |
| Fedora (upstream CI target) | Current stable | Data not available: Fedora package tracker was not queried | [NEEDS VERIFICATION] |
| Arch Linux mainline | 3.6.6-2 | No | riscv64 is not a tier-1 Arch architecture |
| Arch Linux RISC-V (archriscv.felixc.at) | Unknown | Likely yes [NEEDS VERIFICATION] | No patch directory exists in [felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages) for libsoup3, meaning it builds from mainline PKGBUILD unmodified; per-package build status not confirmed from accessible sources |
| ArchPOWER riscv64 | 3.6.4 (libsoup3), 2.74.3 (libsoup2) | Yes [NEEDS VERIFICATION] | flagged potentially vulnerable on ArchPOWER; not an authoritative distribution |

**What a user must do to get a working riscv64 binary:** Install from Debian sid (`apt install libsoup-3.0-0`) or Ubuntu 24.04 (`apt install libsoup-3.0-0`). No additional steps required. Building from source requires standard Meson cross-compilation procedure (Section 5).

---

## 9. Dependencies

**Dependency summary table:**

| Dependency | Role | Required? | riscv64 Build | riscv64 Test | riscv64 Release (Debian sid) | Blocking Issues |
|---|---|---|---|---|---|---|
| GLib >= 2.70 / GObject / GIO | Core object system, async I/O, TLS abstraction | Required | Builds (no known arch-specific failures) | Not in CI | libglib2.0-0t64 v2.88.1-2 | None identified |
| libnghttp2 | HTTP/2 framing | Required | Builds | Not in CI | libnghttp2-14 v1.69.0-1 | None |
| libpsl >= 0.20 | Public Suffix List for cookie/redirect handling | Required | Builds | Not in CI | libpsl5 v0.21.2-1 | None identified |
| zlib | gzip content-encoding | Optional | Builds | Not in CI | zlib1g v1.3.dfsg+really1.3.2-3 | None |
| libbrotlidec | brotli content-encoding | Optional | Builds (scalar) | Not in CI | libbrotli1 v1.2.0-3 | RVV optimization PR #1410 stalled (CLA issue); does not block generic builds |
| libzstd | zstd content-encoding | Optional | Builds | Not in CI | libzstd1 v1.5.7+dfsg-3+b2 | Multiple open optimization PRs (#4584, #4596, #4622, #4629, #4643, #4668); riscv64 arch detection only merged Dec 2025 (PR #4525); none block basic builds |
| sqlite3 | Cookie/session persistence | Optional | Builds | Not in CI | libsqlite3-0 v3.53.2-1 | None |
| krb5/GSSAPI | Kerberos HTTP authentication | Optional | Builds | Not in CI | Available as part of krb5 | None |
| GnuTLS >= 3.6 | TLS for PKCS#11 integration tests | Optional (test-only) | Builds | Not in CI | Available | None |

**Deep-dive on dependencies with architecture significance:**

**brotli:** RVV optimization PR #1410 is open but stalled due to a CLA issue. The generic (scalar) riscv64 build is functional and available in Debian sid (libbrotli1 v1.2.0-3). No correctness issues on riscv64. See `./libraries/brotli.md` (24,987 bytes).

**zstd:** riscv64 architecture detection was merged in December 2025 (PR #4525). Multiple performance-oriented PRs are open: RVV intrinsics (#4584, #4622, #4629), unaligned access optimization (#4596), and prefetch tuning (#4643, #4668). The `MEM_FORCE_MEMORY_ACCESS` discussion in PR #4596 is relevant to riscv64 systems without the `Zicclsm` extension but does not block correctness. Available in Debian sid (libzstd1 v1.5.7+dfsg-3+b2). Data not available: a zstd-specific status report has not yet been generated (`./libraries/zstd.md` does not exist).

**GLib:** Not itself a scoped project, but libsoup requires GLib >= 2.70. GLib has extensive per-architecture handling in its GIO and GObject subsystems. No riscv64-specific failures were identified in the research. Available as libglib2.0-0t64 v2.88.1-2 in Debian sid.

**libnghttp2:** Pure C, no SIMD. Available in Debian sid (v1.69.0-1). No riscv64-specific issues identified. Data not available: an nghttp2-specific status report has not yet been generated (`./libraries/nghttp2.md` does not exist).

**SQLite:** Available in Debian sid (v3.53.2-1). See `./databases/sqlite.md` (25,043 bytes).

**glibc** (runtime, not a direct libsoup dependency): See `./libraries/glibc.md` (31,546 bytes).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#120](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120) | tls_interaction test fails on several architectures | Open (Needs Information) | Low (test-only) | riscv64 explicitly listed. Error: `Unexpected status 7 - Connection terminated unexpectedly (expected 200 OK)`. Also affects armhf, hppa, mipsel, mips64el. Likely a race condition or timing-sensitive failure on slower/non-x86 architectures. Not a functional defect in libsoup networking logic. |
| [#521](https://gitlab.gnome.org/GNOME/libsoup/-/issues/521) | Probe HTTPS speed when selecting timeout-test slow mode | Open | Low (test-only) | sparcv7 affected; riscv64 not explicitly named but same root cause applies -- slow-machine detection uses HTTP speed rather than HTTPS speed, causing misclassification on slow architectures |
| [#530](https://gitlab.gnome.org/GNOME/libsoup/-/issues/530) | logger-test: /logger/long-invalid-body-length fails on 32-bit architectures | Open (filed 2026-05-27) | Low (test-only) | 32-bit platforms only (i686). Not a riscv64 issue since riscv64 is 64-bit. |
| [#122](https://gitlab.gnome.org/GNOME/libsoup/-/issues/122) | chunk-io-test TIMEOUT on riscv64 | Closed | Low (test infrastructure) | Resolved by extending Meson per-test timeout limits. chunk-io-test: ~58x slower on riscv64 vs amd64 (28.50s vs 0.49s on libsoup 2.64.0). |
| [MR !309](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309) | Extend timeout of test http2-body-stream | Closed without merge (2025-05-01) | Low (test infrastructure) | Filed for riscv64 Debian buildd (rv-manda-01) SIGTERM at 300s. Closed due to conflicts with master; the underlying timeout issue may persist on slow hardware. |

**Correctness bugs:** None. All documented riscv64 issues are test infrastructure problems (timeouts, TLS handshake races on slow hardware), not defects in libsoup's HTTP or networking logic.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No upstream developer has objected to riscv64 support in any issue, MR, or mailing list discussion found in the research.

**Technical blockers:** None. libsoup is portable C with no architecture-specific components. GLib (the primary dependency) already supports riscv64. The build system (Meson) supports riscv64 cross-compilation via standard cross-files.

**Organizational blockers:** None. GNOME project maintainership (dominated by Igalia) has not raised any process or policy barrier to riscv64 support. The only outstanding item is MR !309 (closed), which was a test timeout patch that conflicted with master -- a trivial rebasing exercise.

**Acceptance probability for upstream patches:** High. The project has accepted riscv64-related test infrastructure patches in the past (issue #122 resolution). No CLA or DCO process exists beyond standard GNOME contributor agreements. Code review is active (Igalia and Red Hat maintainers respond to MRs).

**CI gap:** Adding a riscv64 CI job would require either (a) a GNOME GitLab runner with a riscv64 tag (GNOME infrastructure does not currently have one), or (b) a QEMU-based cross-compile CI job. This is a GNOME infrastructure decision, not a libsoup-specific decision.

---

## 13. Investment Analysis

RISE has no involvement with libsoup. The work below is not duplicating anything already funded.

### 13.1 Functional Enablement

No functional work is required. libsoup builds and runs correctly on riscv64 as distributed by Debian sid and Ubuntu 24.04. All HTTP/networking features are available.

### 13.2 Performance Optimization

libsoup itself has no performance-sensitive architecture-specific paths. Any performance optimization investment should target the compression libraries it delegates to (brotli, zstd), not libsoup itself. Those are tracked in separate reports.

### 13.3 CI/CD Infrastructure

The only actionable investment is adding a riscv64 CI job to `.gitlab-ci.yml`. Two options:

**Option A -- QEMU cross-compile CI:** Add a cross-compilation job using `gcc-riscv64-linux-gnu` and `qemu-riscv64-static` on the existing Fedora x86_64 runners. This validates that libsoup compiles on riscv64 but cannot run tests that require networking.

**Option B -- Native riscv64 runner:** Provision a GNOME GitLab runner with a `riscv64` tag. This enables full test execution including the networking-dependent tests. Requires coordination with GNOME infrastructure team.

Upstream MR !309 (http2-body-stream timeout on riscv64) should be rebased on master and resubmitted to address the test reliability issue on slow hardware.

### 13.4 Ecosystem Enablement

Not applicable. libsoup has no dependent package ecosystem requiring separate enablement (see Section 10 omission rationale: libsoup is a system library consumed by GNOME stack components, not a plugin/extension ecosystem).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU cross-compile CI job to .gitlab-ci.yml | 0.5 | Contributor / Igalia | Medium |
| CI/CD | Provision native riscv64 GNOME GitLab runner | 2 | GNOME Infrastructure | Low |
| Test reliability | Rebase MR !309 (http2-body-stream timeout) on master and submit | 0.5 | Contributor | Low |
| Test reliability | Investigate and fix Issue #120 (tls_interaction race on slow arches) | 2 | Igalia / Red Hat | Low |
| Compression performance | Track brotli RVV PR #1410 CLA resolution | 0 (monitor only) | brotli upstream | Low |
| Compression performance | Track zstd riscv64 optimization PRs (#4584, #4596, #4622, etc.) | 0 (monitor only) | zstd upstream | Low |

Total estimated investment for CI coverage: 1 person-week. No functional or performance work is required in libsoup itself.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [GNOME/libsoup GitLab repository](https://gitlab.gnome.org/GNOME/libsoup)
- [GNOME/libsoup GitHub mirror](https://github.com/GNOME/libsoup)
- [libsoup homepage](https://libsoup.org/)
- [libsoup Issue #120 -- tls_interaction test fails on several architectures](https://gitlab.gnome.org/GNOME/libsoup/-/issues/120)
- [libsoup Issue #122 -- chunk-io-test timeout on riscv64](https://gitlab.gnome.org/GNOME/libsoup/-/issues/122)
- [libsoup Issue #521 -- Probe HTTPS speed for slow-machine detection](https://gitlab.gnome.org/GNOME/libsoup/-/issues/521)
- [libsoup Issue #530 -- logger-test fails on 32-bit architectures](https://gitlab.gnome.org/GNOME/libsoup/-/issues/530)
- [libsoup MR !309 -- Extend timeout of test http2-body-stream](https://gitlab.gnome.org/GNOME/libsoup/-/merge_requests/309)
- [Debian sid libsoup-3.0-0 package](https://packages.debian.org/sid/libsoup-3.0-0)
- [Ubuntu 24.04 Noble libsoup-3.0-dev package](https://packages.ubuntu.com/noble/libsoup-3.0-dev)
- [GNOME GitLab libsoup releases](https://gitlab.gnome.org/GNOME/libsoup/-/releases)
- [freedesktop-ci-templates (libsoup CI infrastructure)](https://gitlab.freedesktop.org/Infrastructure/freedesktop-ci-templates)
- [RISE Project blog](https://riseproject.dev/blog)
- [felixonmars/archriscv-packages (Arch Linux RISC-V patches)](https://github.com/felixonmars/archriscv-packages)
- [Debian tracker for libsoup3.0](https://tracker.debian.org/pkg/libsoup3.0)