---
title: nghttp2
categories:
  - libraries
---

# nghttp2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for nghttp2
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

nghttp2 is a C/C++ implementation of HTTP/2 ([RFC 7540](https://tools.ietf.org/html/rfc7540)) and HPACK header compression ([RFC 7541](https://tools.ietf.org/html/rfc7541)). It ships as a library (`libnghttp2`), a reverse proxy (`nghttpx`), a client (`nghttp`), and a load test tool (`h2load`). The project is the reference HTTP/2 implementation used by curl, among many others.

**Governance:** There is no foundation affiliation. nghttp2 operates under no steering committee, TSC, or documented contribution policy beyond standard open-source practices. It is hosted at the [nghttp2 GitHub organization](https://github.com/nghttp2/nghttp2) but is functionally a single-maintainer project.

**Primary maintainer:** Tatsuhiro Tsujikawa (GitHub: `tatsuhiro-t`), 8,455 of approximately 8,700 total commits (approximately 97%). No employer is listed on his GitHub profile. No corporate sponsorship is documented. GitHub Sponsors shows three individual sponsors; no companies are identified among them.

**Second-tier contributors with corporate affiliations** (historical, not active as maintainers): Daniel Stenberg (bagder, curl project), Piotr Sikora (PiotrSikora, formerly Cloudflare), Kazuho Oku (kazuho, Fastly).

**License:** MIT.

**RISE Project involvement:** None. nghttp2 is not a RISE member project. A full scan of all 27 RISE blog posts (May 2024 through June 2026) found zero mentions of nghttp2, HTTP/2, or network performance.

**Community stance on new architectures:** The project contains no architecture-specific code for any platform. New architecture support requires no upstream changes; distributors pick it up automatically. The maintainer has made no statements on RISC-V in any public forum.

---

## 2. Port History and Upstreaming Timeline

There was no discrete "port" event. nghttp2 is pure portable C/C++. RISC-V support arrived implicitly when Debian's packaging infrastructure added riscv64 as a build target.

| Date | Event | Source |
|---|---|---|
| 2022-08-17 | Issue [#1778](https://github.com/nghttp2/nghttp2/issues/1778) filed requesting `ax_boost_base.m4` update to recognize `lib64` on riscv64 for Boost detection | GitHub Issues |
| 2022-12-26 | PR [#1844](https://github.com/nghttp2/nghttp2/pull/1844) merged (v1.52.0): removes `libnghttp2_asio` entirely, eliminating the Boost dependency and closing the riscv64 lib64 detection gap indirectly | GitHub PRs |
| 2024-05-13 | Issue [#2195](https://github.com/nghttp2/nghttp2/issues/2195) filed: cross-compilation failure for FreeBSD 14/riscv64 with GCC 14 | GitHub Issues |
| 2024-06-17 | Issue #1778 closed as "completed" (resolved by #1844) | GitHub Issues |
| 2024-06-25 | Issue #2195 closed as "not planned" (stale, no upstream fix) | GitHub Issues |
| 2026-04-20 | Arch Linux RISC-V ships `libnghttp2-1.69.0-1-riscv64.pkg.tar.zst` | [archriscv.felixc.at](https://archriscv.felixc.at/repo/core/) |
| 2026 (approx.) | Debian sid 1.69.0-1 built successfully on `rv-manda-03` | [Debian buildd](https://buildd.debian.org/status/package.php?p=nghttp2&suite=sid) |

No upstream commits or pull requests address RISC-V directly. The only work done was downstream (distro packaging) and one indirect resolution via dependency removal. No contributor with a RISC-V mandate has touched the project.

Debian's first riscv64 build date is cited in prior research as 2018-03-28 (version 1.31.0-1, builder rv-mit-02), but this claim comes from a single agent and is [NEEDS VERIFICATION].

---

## 3. Upstream Support Tier

nghttp2 has no formal tier policy and no documented platform support matrix.

**De facto tier assignment by evidence:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No |
| Release-blocking tests | Yes | Yes | No |
| Official upstream binaries | Source only | Source only | Source only |
| Distro packages shipped | Yes | Yes | Yes (Debian, Ubuntu ports, Arch) |
| Maintainer stated policy | None | None | None |
| Architecture-specific code | None (pure C) | None (pure C) | None (pure C) |

riscv64 is effectively Tier 3: no upstream CI, no release-blocking tests, but builds and packages correctly on major distributions without patches.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

nghttp2 performs three categories of work: HPACK header compression (Huffman coding, header table management), HTTP/2 frame serialization and parsing, and optional TLS (delegated entirely to external libraries). None of these benefit meaningfully from SIMD or other ISA extensions.

A full recursive scan of all 646 files in the repository found zero architecture-specific preprocessor guards, zero inline assembly, zero `.S` or `.asm` files, zero `arch/` directories, and zero references to AVX, SSE, NEON, or RVV.

| Component | amd64 | arm64 | riscv64 | Classification |
|---|---|---|---|---|
| HPACK encoder/decoder | Scalar C | Scalar C | Scalar C | Scalar by design; no SIMD version exists for any arch |
| Huffman codec | Table-driven C | Table-driven C | Table-driven C | Scalar by design |
| Frame parser/serializer | Scalar C | Scalar C | Scalar C | Scalar by design |
| TLS (OpenSSL/wolfSSL) | Arch-specific (external) | Arch-specific (external) | Arch-specific (external) | Delegated to OpenSSL/wolfSSL |
| eBPF socket acceleration | libbpf (external) | libbpf (external) | libbpf (external) | Linux-native; riscv64 is a supported target |

The absence of riscv64-specific code is correct and intentional, not a gap. The performance-critical code paths have no SIMD-amenable operations.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Compiler requirements:**

| Scope | Minimum version | Reason |
|---|---|---|
| GCC/Clang (applications layer: `src/`) | GCC >= 14 or Clang >= 19 | C++23 required by `src/` |
| GCC (library only: `lib/`) | Any C99-capable compiler | `libnghttp2` core is pure C99 |
| Autoconf | >= 2.61 (tarball), >= 2.68 (git) | `AC_PREREQ(2.61)` in `configure.ac` |
| Python | >= 3.8 | `AM_PATH_PYTHON([3.8])` in `configure.ac` |

**Native build on riscv64 (library only):**

```sh
cmake -B build -DENABLE_LIB_ONLY=ON
cmake --build build
```

or with autotools:

```sh
./configure --enable-lib-only
make
```

**Cross-compilation from x86_64:** No official toolchain file is provided. The project ships no `cmake/riscv64.cmake`. A user-supplied toolchain file is required:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_SYSROOT /usr/riscv64-linux-gnu)
```

```sh
cmake -B build-riscv64 -DCMAKE_TOOLCHAIN_FILE=riscv64-toolchain.cmake -DENABLE_LIB_ONLY=ON
cmake --build build-riscv64
```

With autotools:

```sh
./configure --host=riscv64-linux-gnu \
    --build=$(dpkg-architecture -qDEB_BUILD_GNU_TYPE) \
    --enable-lib-only
```

**BPF include path:** `CMakeLists.txt` uses `CMAKE_SYSTEM_PROCESSOR` directly to form `/usr/include/${CMAKE_SYSTEM_PROCESSOR}-linux-gnu`. On riscv64 this resolves to `/usr/include/riscv64-linux-gnu`, which is correct for Debian multiarch.

**Known cross-compilation failure:** Issue [#2195](https://github.com/nghttp2/nghttp2/issues/2195) documents a build failure when cross-compiling for FreeBSD 14/riscv64 using GCC 14. GCC 14 promoted implicit function declarations from warnings to hard errors. The functions `htons`/`htonl`/`ntohs`/`ntohl` in `lib/nghttp2_helper.c` and `lib/nghttp2_hd_huffman.c` are used without `#include <arpa/inet.h>`. The proximate trigger is `config.h` shadowing from a co-embedded CMake project (e.g., Onigmo), which prevents nghttp2's conditional `#include <arpa/inet.h>` from firing. The issue was closed as "not planned" with no upstream fix merged. This affects embedded CMake use cases; it does not affect standalone native builds on Linux/riscv64.

**QEMU usage:** None in upstream CI. No `docker/setup-qemu-action` reference appears in any workflow file.

**Flags useful for constrained environments:**

| Flag | Effect |
|---|---|
| `-DENABLE_LIB_ONLY=ON` | Builds only `libnghttp2`; minimal dependencies |
| `-DENABLE_HTTP3=OFF` | Default off; skips ngtcp2, nghttp3, libbpf |
| `--without-jemalloc` | Required on musl/Alpine; jemalloc not supported there |
| `--without-libbpf` | Skip eBPF support when not needed |
| `--disable-threads` | Disables thread support when `std::future` is unavailable |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| libnghttp2 core HTTP/2 | Full | Full | Full | Pure C, no arch-specific code |
| HPACK encoder/decoder | Full | Full | Full | Table-driven, no SIMD variant |
| h2load benchmarking tool | Full | Full | Full | C++23 required |
| nghttpx reverse proxy | Full | Full | Full | C++23 required |
| HTTP/3 (QUIC) via ngtcp2 | Full (optional) | Full (optional) | Full (optional) | Depends on ngtcp2/nghttp3 packaging |
| TLS via OpenSSL | Full | Full | Full (with caveats) | OpenSSL has open riscv64 bugs; see Section 9 |
| TLS via wolfSSL | Full | Full | Full | No open riscv64 issues as of June 2026 |
| eBPF socket acceleration | Full | Full | Full | libbpf supports riscv64 |
| Brotli compression | Full (scalar) | Full (scalar) | Full (scalar) | RVV SIMD PR not yet merged; scalar fallback works |
| Upstream CI validation | Yes | Yes | No | riscv64 not in CI matrix |

**Functional gaps:** None. Every feature available on amd64 is available on riscv64.

**Performance gaps:** None attributable to nghttp2 itself. nghttp2 performs no SIMD-accelerated operations. Any performance gap on riscv64 versus arm64 would originate in dependencies (OpenSSL crypto, brotli compression, zlib compression) -- see Section 9.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening analysis was found in upstream issues, downstream packaging notes, or RISE blog posts.

**Floating-point semantics:** Not applicable. nghttp2 uses no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

All five workflow files in `.github/workflows/` were read in full. The verdict is definitive.

| CI job | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `build` (Linux) | ubuntu-24.04 | ubuntu-24.04-arm | Not present |
| `build-cross` (Windows cross) | x86_64-w64-mingw32 | i686-w64-mingw32 | Not present |
| `build-windows` | windows-latest | -- | Not present |
| `build-cygwin` | Cygwin/x86 | -- | Not present |
| macOS | macos-26, macos-15 | Apple Silicon | Not present |
| OSS-Fuzz (`fuzz.yml`) | ubuntu-latest | -- | Not present |
| Android (`android.yml`) | ubuntu-24.04 | -- | Not present |
| Docker (`docker.yaml`) | ubuntu-24.04 | -- | Not present |

The string "riscv", "riscv64", "qemu", and "RISCV" do not appear in any workflow file. The `ubuntu-24.04-arm` runner is GitHub's hosted AArch64 runner; it is not RISC-V.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**RISE runners:** Not used. nghttp2 is not a RISE project.

**Distribution CI (not upstream):** Debian builds nghttp2 on its own riscv64 build infrastructure (`rv-manda-03`). Ubuntu ports follow Debian. Arch Linux RISC-V maintains its own build. These are entirely external to the nghttp2 project and do not provide feedback into the upstream CI pipeline.

---

## 8. Distribution and Release Status

**Upstream releases:** nghttp2 ships source tarballs only (`.tar.bz2`, `.tar.gz`, `.tar.xz` plus checksums and GPG signatures). No architecture-specific binary assets exist in any GitHub release, including v1.69.0 (current).

**PyPI:** Not applicable. nghttp2 is a C library with no Python wheel on PyPI. The package does not exist on PyPI (`pypi.org/pypi/nghttp2/json` returns HTTP 404).

| Distribution | Package | riscv64 version | Status |
|---|---|---|---|
| Debian sid | `libnghttp2-dev`, `libnghttp2-14`, `nghttp2-client`, `nghttp2-proxy`, `nghttp2-server` | 1.69.0-1 | Built on `rv-manda-03`, status "Installed" |
| Debian stable (bookworm) | same | 1.64.0-1.1 | Available |
| Ubuntu 24.04 (Noble) | same (ports pocket) | Follows Debian | Claimed present [NEEDS VERIFICATION -- not re-fetched in final verification round] |
| Arch Linux RISC-V | `libnghttp2` | 1.69.0-1 | `libnghttp2-1.69.0-1-riscv64.pkg.tar.zst` confirmed in core repo (2026-04-20, 101 KB) |
| Alpine, Fedora | present | unknown | Data not available: versions and build status not retrieved |

**Installed size anomaly:** The Debian riscv64 installed size for `libnghttp2-dev` is approximately 1,927-2,101 kB versus approximately 603 kB on amd64. The cause is likely unstripped debug symbols or relocation data in the Debian packaging; no correctness implication has been identified. [NEEDS VERIFICATION -- root cause not confirmed by a second source.]

**What a user must do to get a working binary:** Install from the distribution package manager. On Debian/Ubuntu: `apt install libnghttp2-dev`. No source build is required for normal use.

---

## 9. Dependencies

The table below covers runtime and optional build dependencies declared in `CMakeLists.txt` and `configure.ac`.

| Dependency | Role | riscv64 build | riscv64 test CI | riscv64 distro release | Notes |
|---|---|---|---|---|---|
| OpenSSL (>= 1.1.1) | TLS/crypto (primary backend) | Yes | No | Yes -- `libssl-dev` 3.6.3-1 (Debian sid) | 2 open correctness bugs on riscv64: issue [#30330](https://github.com/openssl/openssl/issues/30330) (Zkne key-check logic) and issue [#29357](https://github.com/openssl/openssl/issues/29357) (cross-compile with `no-deprecated`). See `project-reports/openssl.md` |
| wolfSSL (>= 5.7.0) | TLS/crypto (alternative backend) | Yes -- 6 riscv64-specific files: AES, ChaCha, Poly1305, SHA-256/512/3 | No | Yes -- `libwolfssl-dev` 5.9.1-0.1 (Debian sid) | All riscv64 bugs closed as of June 2026. No open blockers. |
| libngtcp2 (>= 1.23.0) | QUIC transport layer | Yes | No | Partial -- `libngtcp2-dev` 1.22.1-1 in Debian sid (behind required 1.23.0) | Version lag may prevent HTTP/3 on riscv64 from Debian packages alone. No riscv64 correctness issues filed. |
| libnghttp3 (>= 1.16.0) | HTTP/3 framing | Yes | No | Partial -- `libnghttp3-dev` 1.15.0-1 in Debian sid (behind required 1.16.0) | Same version lag concern as libngtcp2. |
| brotli (>= 1.0.9) | HTTP compression | Yes (scalar) | No | Yes -- `libbrotli-dev` 1.2.0-3 (Debian sid) | RVV SIMD PR [#1410](https://github.com/google/brotli/pull/1410) open since December 2025, not merged. Second attempt PR [#1489](https://github.com/google/brotli/pull/1489) closed June 2026. Scalar fallback functional. See `project-reports/brotli.md` |
| zlib (>= 1.2.3) | HTTP compression (deflate/gzip) | Yes (scalar) | No | Yes -- `zlib1g-dev` (standard Debian) | No riscv64 SIMD optimizations. No riscv64 issues in `madler/zlib`. See `project-reports/zlib.md` (pending) |
| jemalloc | Memory allocator (optional) | Partial | No | Yes -- `libjemalloc-dev` 5.3.1-2 (Debian sid) | Issue [#2399](https://github.com/jemalloc/jemalloc/issues/2399) (open since 2023): riscv64 cross-build undocumented and untested. No maintainer response. See `project-reports/jemalloc.md` |
| libev (>= 4.11) | Async I/O event loop | Yes (pure C, epoll backend on Linux) | No | Yes -- `libev-dev` 1:4.33-2.1+b3 | No riscv64 issues. Architecture-agnostic. |
| libevent (>= 2.0.8) | Async I/O (nghttpx) | Yes | No | Yes -- `libevent-dev` 2.1.12-stable-10+b2 | No riscv64 issues. See `project-reports/libevent.md` |
| c-ares (>= 1.7.5) | Async DNS | Yes | No | Yes -- `libc-ares-dev` 1.34.6-1+b1 | No riscv64 issues. Pure C. |
| libxml2 (>= 2.6.26) | XML parsing (tools) | Yes | No | Yes -- `libxml2-dev` 2.15.3+dfsg-1 | No riscv64 issues found. See `project-reports/libxml2.md` (pending) |
| jansson (>= 2.5) | JSON (nghttpd/nghttpx) | Yes | No | Yes -- `libjansson-dev` 2.15.0-1 | No riscv64 issues. Pure C. |
| libbpf (>= 0.7.0) | eBPF socket acceleration (optional) | Yes | No | Yes -- `libbpf-dev` 1:1.7.0-1 | riscv64 is a Linux-native eBPF target. No issues. See `project-reports/libbpf.md` (pending) |
| systemd (>= 209) | Socket activation (optional) | Yes | N/A | Yes | Standard Debian. No riscv64 concerns. |
| MRuby | Scripting in nghttpx (optional) | Unknown | No | Not packaged as `libmruby-dev` in Debian | Data not available: no riscv64 investigation was performed. Optional feature, not required for HTTP/2 core. |

**Hard blockers (correctness):**
- OpenSSL issue [#30330](https://github.com/openssl/openssl/issues/30330): Zkne key-check logic bug on riscv64 (open).
- OpenSSL issue [#29357](https://github.com/openssl/openssl/issues/29357): cross-compile failure with `no-deprecated` (open).

**Soft blockers (performance gaps):**
- brotli: RVV SIMD PR [#1410](https://github.com/google/brotli/pull/1410) not merged; scalar fallback functional.
- zlib/zlib-ng: no riscv64 vector optimizations; scalar only on all platforms.
- jemalloc: issue [#2399](https://github.com/jemalloc/jemalloc/issues/2399) unanswered since 2023; riscv64 cross-build support undocumented.

**Version lag risk:** libngtcp2 (1.22.1 packaged vs 1.23.0 required) and libnghttp3 (1.15.0 packaged vs 1.16.0 required) mean that HTTP/3 support cannot be enabled using only Debian sid packages. A source build of those two libraries would be required to enable HTTP/3 on riscv64 today.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2195](https://github.com/nghttp2/nghttp2/issues/2195) | Compiling nghttp2 with GCC 14 fails (FreeBSD 14 riscv64) | Closed, not planned | Low (build-time only, embedded CMake use case) | Root cause: `config.h` shadowing from co-embedded CMake subproject (Onigmo) suppresses `#include <arpa/inet.h>`; GCC 14 made implicit function declarations fatal. Not fixed upstream. Workaround: add `#include <arpa/inet.h>` manually to `lib/nghttp2_helper.c` and `lib/nghttp2_hd_huffman.c`. Does not affect standalone native Linux/riscv64 builds. |
| [#1778](https://github.com/nghttp2/nghttp2/issues/1778) | ax_boost_base.m4 does not try lib64 on riscv64 | Closed, completed | Resolved | Resolved indirectly by PR [#1844](https://github.com/nghttp2/nghttp2/pull/1844) (v1.52.0) removing `libnghttp2_asio` and eliminating the Boost dependency. |

No open RISC-V correctness or performance bugs exist in the nghttp2 upstream tracker. The GitHub issues search for "riscv" and "riscv64" returns only the two closed issues above.

**Correctness bugs:** None open.

**Performance issues:** None filed. No quantitative RISC-V benchmark data exists in any source checked (upstream issues, RISE blog, academic literature, distribution CI logs). The only published h2load benchmark is an architecture-agnostic documentation sample (141,164 req/s on unspecified x86 localhost; this number is not actionable for riscv64 comparison).

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The maintainer has not commented on RISC-V in any public forum. No rejection of RISC-V-related patches exists in the issue or PR history.

**Technical blockers:** None for the library itself. The codebase is portable pure C/C++ with no platform assumptions. Any standards-compliant C99/C++23 toolchain targeting riscv64 will build it correctly.

**Organizational blockers:** The project has a single maintainer with a high bus factor. There is no contributor ladder, no co-maintainer, and no succession plan visible from public data. A patch requiring maintainer review has an unpredictable merge timeline.

**CI acceptance:** Adding a riscv64 runner to the GitHub Actions matrix requires only a pull request modifying `build.yml`. No architecture-specific code changes would be needed. The primary friction is maintainer bandwidth, not technical complexity.

**Acceptance probability for a riscv64 CI PR:** High for a well-tested, minimally invasive change (QEMU or hosted runner). The maintainer merged PR [#1844](https://github.com/nghttp2/nghttp2/pull/1844) without review comments, suggesting he accepts uncontroversial infrastructure improvements. However, response latency is unpredictable for a single-maintainer project.

---

## 13. Investment Analysis

RISE has performed no work on nghttp2. No funded work, no runner coverage, no blog posts.

### 13.1 Functional Enablement

No functional enablement work is needed. nghttp2 builds and runs correctly on riscv64 today without any upstream changes. The only outstanding functional issue is the GCC 14 implicit declaration bug in embedded CMake use cases (issue [#2195](https://github.com/nghttp2/nghttp2/issues/2195)), which affects FreeBSD cross-compilation scenarios, not Linux riscv64 native builds.

Optional: a one-line fix (add `#include <arpa/inet.h>` to two files) could be submitted as a cleanup PR to eliminate the embedded-project footgun. Effort: less than 0.5 person-weeks including review cycles.

### 13.2 Performance Optimization

nghttp2 itself has no SIMD-amenable code paths. Performance optimization must target dependencies:
- OpenSSL RVV crypto acceleration (in progress upstream; see `project-reports/openssl.md`)
- brotli RVV SIMD (PR [#1410](https://github.com/google/brotli/pull/1410) pending merge)
- zlib/zlib-ng riscv64 SIMD (not yet started anywhere)

No performance work on nghttp2 itself is warranted.

### 13.3 CI/CD Infrastructure

The gap is real and addressable. Upstream CI tests x86_64 and arm64 but not riscv64. A riscv64 QEMU-based GitHub Actions job could be added to `build.yml` for the library-only build. This would catch regressions before they reach distributions.

Estimated effort: 1-2 person-weeks (write QEMU job, validate it builds cleanly, submit PR, iterate on review). No architecture-specific code changes required.

A RISE-hosted riscv64 runner would be preferable to QEMU for performance. If RISE infrastructure is available, the effort drops to under 0.5 person-weeks for the `build.yml` change.

### 13.4 Ecosystem Enablement

Not applicable. nghttp2 has no dependent package ecosystem requiring riscv64 enablement. The library is consumed directly by curl, Nginx, and similar projects, each of which has its own riscv64 story.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `#include <arpa/inet.h>` in `nghttp2_helper.c` and `nghttp2_hd_huffman.c` (GCC 14 embedded CMake fix) | 0.5 | Any contributor | Low |
| CI/CD | Add riscv64 QEMU job to `.github/workflows/build.yml` (library-only) | 1-2 | RISE or chip vendor | Medium |
| CI/CD | Provide RISE-hosted riscv64 runner (reduces QEMU overhead; not project-specific) | Shared infrastructure | RISE | Low (for nghttp2 alone; high if shared across projects) |
| Performance | brotli RVV SIMD (PR [#1410](https://github.com/google/brotli/pull/1410)) -- not nghttp2 work | see `project-reports/brotly.md` | brotli upstream | High |
| Performance | OpenSSL riscv64 correctness bugs (#30330, #29357) -- not nghttp2 work | see `project-reports/openssl.md` | OpenSSL upstream | Critical |
| Performance | zlib riscv64 SIMD -- not nghttp2 work | see `project-reports/zlib.md` | zlib/zlib-ng upstream | Medium |

**Overall assessment:** nghttp2 is not a RISC-V investment priority. The library itself is fully functional on riscv64 and requires no engineering investment to use. The only actionable item is a low-effort CI PR to catch future regressions. Resources should be directed at nghttp2's dependencies (OpenSSL, brotli) where genuine riscv64 blockers and performance gaps exist.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [nghttp2/nghttp2 GitHub repository](https://github.com/nghttp2/nghttp2)
- [nghttp2 homepage](https://nghttp2.org/)
- [Issue #2195 -- Compiling nghttp2 with GCC 14 fails (riscv64 FreeBSD cross-compile)](https://github.com/nghttp2/nghttp2/issues/2195)
- [Issue #1778 -- update ax_boost_base.m4 for riscv64 lib64](https://github.com/nghttp2/nghttp2/issues/1778)
- [PR #1844 -- Remove deprecated libnghttp2_asio (resolves #1778)](https://github.com/nghttp2/nghttp2/pull/1844)
- [nghttp2 build.yml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/build.yml)
- [nghttp2 docker.yaml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/docker.yaml)
- [nghttp2 android.yml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/android.yml)
- [nghttp2 CMakeLists.txt](https://github.com/nghttp2/nghttp2/blob/master/CMakeLists.txt)
- [nghttp2 CMakeOptions.txt](https://github.com/nghttp2/nghttp2/blob/master/CMakeOptions.txt)
- [nghttp2 configure.ac](https://github.com/nghttp2/nghttp2/blob/master/configure.ac)
- [nghttp2 docker/Dockerfile](https://github.com/nghttp2/nghttp2/blob/master/docker/Dockerfile)
- [Debian package tracker -- nghttp2](https://tracker.debian.org/pkg/nghttp2)
- [Debian buildd status -- nghttp2 sid](https://buildd.debian.org/status/package.php?p=nghttp2&suite=sid)
- [Ubuntu 24.04 packages -- nghttp2](https://packages.ubuntu.com/search?keywords=nghttp2&suite=noble)
- [Arch Linux RISC-V core repo -- libnghttp2](https://archriscv.felixc.at/repo/core/)
- [brotli PR #1410 -- RVV SIMD optimization](https://github.com/google/brotli/pull/1410)
- [brotli PR #1489 -- second RVV attempt (closed)](https://github.com/google/brotli/pull/1489)
- [OpenSSL issue #30330 -- Zkne key-check logic bug on riscv64](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #29357 -- cross-compile failure with no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [jemalloc issue #2399 -- riscv64 cross-build undocumented](https://github.com/jemalloc/jemalloc/issues/2399)
- [RISE Project blog](https://riseproject.dev/blog)