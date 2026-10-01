---
title: nghttp2
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: wolfSSL
    relation: runtime-dependency
    criticality: optional
  - name: ngtcp2
    relation: runtime-dependency
    criticality: optional
  - name: nghttp3
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: libevent
    relation: runtime-dependency
    criticality: optional
  - name: c-ares
    relation: runtime-dependency
    criticality: optional
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: Jansson
    relation: runtime-dependency
    criticality: optional
  - name: systemd
    relation: runtime-dependency
    criticality: optional
  - name: libev
    relation: runtime-dependency
    criticality: optional
  - name: mruby
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nghttp2" %}

# nghttp2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for nghttp2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

nghttp2 is a C/C++ implementation of HTTP/2 ([RFC 7540](https://tools.ietf.org/html/rfc7540)) and HPACK header compression ([RFC 7541](https://tools.ietf.org/html/rfc7541)). It ships as a library (`libnghttp2`), a reverse proxy (`nghttpx`), a client (`nghttp`), a server (`nghttpd`), and a load-test tool (`h2load`). It is widely consumed as the HTTP/2 backend of libcurl, among other projects.

**Governance:** There is no foundation affiliation, no steering committee, and no written governance document (no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, or SUPPORT.md exist in the repository or on [nghttp2.org](https://nghttp2.org/)). The project is a single-maintainer ("BDFL"-style) effort created and still led by Tatsuhiro Tsujikawa (originally a fork of his earlier `spdylay` project). nghttp2.org states only that the project participates in the IETF httpbis working group.

**License:** MIT (`COPYING`: "Copyright (c) 2012, 2014, 2015, 2016 Tatsuhiro Tsujikawa" and "nghttp2 contributors").

**Primary maintainer and contributor base** (full commit history, 9,145 commits from 2012-01-18 through 2026-09-29):

| Contributor | Commits | Email domain / inferred affiliation |
|---|---|---|
| Tatsuhiro Tsujikawa | 8,547 | gmail.com (independent maintainer, approximately 93% of all commits) |
| dependabot[bot] | 92 | automated |
| Peter Wu | 68 | lekensteyn.nl (independent; Wireshark developer) |
| Alexis La Goutte | 55 | gmail.com (independent; Wireshark developer) |
| Jim Morrison | 35 | twist.com |
| Nora Shoemaker | 27 | corp.yahoo.com in some commits, suggesting Yahoo |
| Soham Sinha | 12 | google.com in some commits, suggesting Google |
| Lucas Pardue | 12 | bbc.co.uk, suggesting BBC |
| Daniel Stenberg | 12 | haxx.se (curl author; employed by wolfSSL) |

No company holds a formal sponsorship or governance seat; these are individual contributors whose commit metadata shows employer email addresses at various points, not corporate maintainership.

**RISE Project involvement:** nghttp2 is not a RISE member project. RISE's full published member roster (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) contains no reference to nghttp2, and a review of the RISE blog feed (including all posts from July-September 2026, e.g. the Kairos, Python, PyTorch, SALTyRN, OpenSBI, and IREE posts) found zero mentions of nghttp2 or HTTP/2.

**Community stance on new architectures:** No tiered platform-support policy exists, so there is no documented stance on new ports. The maintainer has made no public statement on RISC-V. Platform support is handled informally through GitHub issues and PRs.

---

## 2. Port History and Upstreaming Timeline

There was no discrete "port" event, and no riscv64-targeted commit, patch series, or announcement has ever landed in `nghttp2/nghttp2`. A full-history search (`git log --all --grep`, and content pickaxe `git log -S"riscv"`/`"risc-v"`) across all 9,145 commits and all branches/tags, and GitHub's commit-search API (`search_commits query="riscv repo:nghttp2/nghttp2"`), both returned zero matches. nghttp2 is pure portable C/C++; riscv64 availability arrived entirely through downstream distribution packaging, with no upstream code change required.

| Date | Event | Source |
|---|---|---|
| 2022-08-17 | Issue [#1778](https://github.com/nghttp2/nghttp2/issues/1778) filed, requesting `ax_boost_base.m4` be updated to probe `lib64` on riscv64 for Boost detection (used only by the now-removed `libnghttp2_asio`) | GitHub Issues |
| N/A (shipped in v1.52.0) | PR [#1844](https://github.com/nghttp2/nghttp2/pull/1844) by maintainer tatsuhiro-t: removes `libnghttp2_asio` and the `ENABLE_ASIO_LIB`/`ENABLE_PYTHON_BINDINGS` build options entirely, eliminating the Boost dependency that made #1778 relevant | GitHub PRs |
| 2024-04-13 | Stale-bot flags #1778 as inactive | GitHub Issues |
| 2024-04-15 | Reporter (steelman) posts "Ping?" | GitHub Issues |
| 2024-06-17 | #1778 closed by the reporter himself, citing PR #1844 ("Fixed by #1844 ... Remove deprecated libnghttp2_asio") as having made the request moot; no m4 patch was ever merged | GitHub Issues |

This is the entire universe of RISC-V-related activity in `nghttp2/nghttp2`: exhaustive repeated searches (`riscv`, `riscv64`, `RISCV`, `risc-v`) against issues, pull requests, and commits each return exactly one match, issue #1778, and zero PR or commit matches. A prior research pass in this report line referenced a second issue, #2195, describing a FreeBSD/riscv64 GCC 14 cross-compilation failure; this could not be corroborated by the exhaustive live verification performed here (multiple independent search passes, including a direct repo-wide `grep` of a cloned HEAD tree, each confirm only #1778 exists) and is treated as unverified / likely erroneous. One tangential issue, [#2648](https://github.com/nghttp2/nghttp2/issues/2648) ("1.68 Build failure in llparser when cross compiling for ARM," closed, not_planned), surfaced in a "riscv64 bug" query only because the reporter's build-path string contained the substring "riscv64"; the issue itself is an ARM NEON cross-compile problem and is unrelated to RISC-V.

Downstream packaging milestones (external to the nghttp2 project, provided for context):
- Ubuntu 26.04 "resolute" ships `libnghttp2-14`, `libnghttp2-dev`, and the `nghttp2-client`/`proxy`/`server` binaries for riscv64 via its Ports architecture tier ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=nghttp2&suite=resolute&searchon=names&section=all)).
- conda-forge/nghttp2-feedstock PR [#57](https://github.com/conda-forge/nghttp2-feedstock/pull/57) ("Support linux-riscv64 platform") merged, per page summary, 2026-08-19 [NEEDS VERIFICATION - date read from an AI-summarized page fetch, not raw API data].
- AOSC-Dev/aosc-os-abbs PR [#17530](https://github.com/AOSC-Dev/aosc-os-abbs) (nghttp2 1.70.0 security update), merged, per page summary, 2026-09-04 [NEEDS VERIFICATION, same caveat]; this is a routine multi-arch version bump, not riscv64-specific work.

No upstream commit or pull request addresses RISC-V directly, and the one issue that mentioned it was resolved only incidentally, by the removal of an unrelated dependency.

---

## 3. Upstream Support Tier

nghttp2 has no formal tier policy and no documented platform-support matrix.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (`ubuntu-26.04`) | Yes (`ubuntu-26.04-arm`, native) | No |
| Release-blocking tests | Yes | Yes | No |
| Official upstream binaries | Source tarball only | Source tarball only | Source tarball only |
| Distro packages shipped | Yes | Yes | Yes (Ubuntu Ports confirmed; also Debian, Gentoo, AOSC, conda-forge per packaging pages) |
| Maintainer stated policy | None | None | None |
| Architecture-specific code | AVX2 fast path (2 files) | ARM NEON fast path (1 vendored file) | None |

riscv64 is de facto outside the CI matrix entirely (Tier "unsupported-but-buildable"): no upstream CI job, no release-blocking test run, but the code builds and runs correctly on major distributions without patches, because the codebase contains no architecture-specific logic that would need porting.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

A full-text search of the repository (`search_code` for `riscv`, `__riscv`, `vfloat32m1_t`, `rvv`, `arch/riscv`, and RISC-V-targeted `.S` files) returned zero matches, and `#ifdef __riscv`, `__aarch64__`, `__x86_64__`, and `arm_neon.h` as literal strings also return zero matches in nghttp2's own code. A clone of HEAD (`19d06e62185d9...`) confirms there is no `arch/riscv/` or similar directory anywhere in the tree.

Exactly two files in the entire repository contain any CPU-architecture-specific code:

| File | Owned by nghttp2? | Arch guards present | Size |
|---|---|---|---|
| `lib/sfparse.c` | Yes (RFC 8941 Structured Field Values parser) | `__AVX2__` only, 16 ifdef/endif pairs | 1,516 lines |
| `third-party/llhttp/src/llhttp.c` | No, vendored from the llhttp project | `__SSE4_2__` and `__ARM_NEON__`/`__ARM_NEON` | 10,268 lines |

Every arch-guarded block wraps a provably-equivalent, always-compiled scalar fallback, for example (`lib/sfparse.c:189-224`):

```c
#ifdef __AVX2__
  if (sfp->end - sfp->pos >= 32) {
    sfp->pos = find_char_key(sfp->pos, last);   // 32-byte AVX2 scan
    if (sfp->pos != last) goto fin;
  }
#endif
  for (; !parser_eof(sfp) && key_tbl[*sfp->pos]; ++sfp->pos)   // scalar fallback, always present
    ;
```

The scalar loop is the reference implementation the SIMD variants must match byte-for-byte, not a degraded stand-in.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `lib/sfparse.c` token/key scanning | partial (AVX2 intrinsics) | scalar (no NEON path exists even for arm64) | scalar |
| vendored `llhttp.c` whitespace/token scanning | partial (SSE4.2 intrinsics) | partial (NEON intrinsics) | scalar |
| HPACK encode/decode, frame/session state machine, flow control, stream management, ALPN, rate limiting (over 95% of the codebase) | scalar | scalar | scalar |
| Hand-tuned assembly anywhere in nghttp2 | missing | missing | missing |

No architecture, including amd64 and arm64, has a hand-tuned "full" implementation of anything in this project. riscv64 runs the identical, complete, portable-C scalar path that the large majority of the codebase uses unconditionally on every architecture; it has no reduced feature set and no disabled code paths. A scan of `lib/` for TODO/FIXME/stub markers found 11 comments, all generic protocol-logic notes (stream timeout, priority signaling edge cases); none reference RISC-V or an incomplete port.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain minimums (from `README.rst`, generic, not RISC-V-specific):**

| Scope | Minimum version | Reason |
|---|---|---|
| C library (`lib/`) | C99 compiler, "gcc 4.8 is known to be adequate" | `libnghttp2` core is pure C99 |
| C++ layer (`src/`, mruby bindings, etc.) | C++23-compliant; "At least g++ >= 14 and clang++ >= 19 are known to work" | General ISO C++23 feature requirement, not architecture-driven |
| pkg-config | >= 0.20 | Build dependency discovery |

CI itself (`.github/workflows/build.yml`) uses `clang-19`/`clang-21` and `gcc-15`/`g++-15` on `ubuntu-26.04` and native `ubuntu-26.04-arm` runners.

**Native build on riscv64 (library only), autotools:**

```sh
autoreconf -i
./configure --disable-dependency-tracking --enable-lib-only
make -j$(nproc)
```

**Native build, CMake (mirrors the flags used in CI):**

```sh
cmake -DENABLE_LIB_ONLY=1 .
make -j$(nproc)
```

**Cross-compilation:** No project-provided riscv64 toolchain file exists (`cmake/` contains only `Find*.cmake` modules, `ExtractValidFlags.cmake`, `PickyWarningsC/CXX.cmake`, and `Version.cmake`; no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake`). A user-supplied toolchain file is required:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_SYSROOT /usr/riscv64-linux-gnu)
```

The only `CMAKE_SYSTEM_PROCESSOR`-dependent logic in `CMakeLists.txt` is a generic Debian-multiarch include-path hack for libbpf headers (`/usr/include/${CMAKE_SYSTEM_PROCESSOR}-linux-gnu`), which applies identically to any architecture triplet, including `riscv64-linux-gnu`; it is not RISC-V-specific.

**QEMU usage:** None anywhere in the repository. The only cross-compilation job in CI (`build-cross`) targets Windows via mingw-w64 and Wine (`x86_64-w64-mingw32`, `i686-w64-mingw32`), not RISC-V and not QEMU.

**Documented build artifact (`docker/Dockerfile`, Debian 13 base, no architecture pinning):** builds `h2load`, `nghttpx`, `nghttp`, `nghttpd` using clang-19, and notably links against **aws-lc** (AWS-LC, cloned at tag v5.4.0) rather than OpenSSL for the container image's TLS backend, alongside source builds of nghttp3 (v1.18.0), ngtcp2 (v1.25.0, with `--with-boringssl` against the aws-lc build), and libbpf (v1.7.0). This Dockerfile has no riscv64 variant and is not architecture-gated.

**Known build issues:** None specific to riscv64 are documented upstream. The sole historical riscv64-adjacent build item, issue #1778 (Boost `lib64` detection in `ax_boost_base.m4`), was closed without a code fix after the Boost-dependent component was removed entirely (Section 2). No other riscv64 build failure is recorded in the issue tracker, the CI logs, or the `README.rst`.

**Flags useful for constrained environments:** `-DENABLE_LIB_ONLY=1` / `--enable-lib-only` (library only, minimal dependencies); `-DENABLE_HTTP3=OFF` (default, skips ngtcp2/nghttp3/libbpf); `--without-jemalloc`; `--without-libbpf`; `--disable-threads`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| libnghttp2 core HTTP/2 | Full | Full | Full | Pure C, no arch-specific code |
| HPACK encoder/decoder | Full | Full | Full | Table-driven, no SIMD variant on any arch |
| h2load benchmarking tool | Full | Full | Full | Requires C++23 toolchain |
| nghttpx reverse proxy | Full | Full | Full | Requires C++23 toolchain |
| HTTP/3 (QUIC) via ngtcp2/nghttp3 | Full (optional) | Full (optional) | Buildable from source; blocked from Ubuntu 26.04 packages alone (Section 9 version lag) | Depends on ngtcp2/nghttp3 packaged versions |
| TLS via OpenSSL | Full | Full | Full | See Section 9 for dependency-level caveats |
| TLS via wolfSSL | Full | Full | Full | riscv64 has dedicated asm fast paths; see Section 9 |
| eBPF socket acceleration (libbpf) | Full | Full | Full | riscv64 is a native Linux eBPF target; zero upstream CI for libbpf on any arch, no functional blocker |
| Brotli compression | Full (scalar) | Full (scalar) | Full (scalar) | RVV SIMD PR stalled; scalar fallback fully functional |
| Upstream CI validation | Yes | Yes | No | riscv64 absent from CI matrix |

**Functional gaps:** None. Every feature buildable on amd64 is buildable on riscv64 from source; the only caveat is that Ubuntu 26.04's packaged ngtcp2/nghttp3 versions lag nghttp2 HEAD's minimums, which affects HTTP/3 availability from packages, not from source.

**Performance gaps:** None attributable to nghttp2 itself; it performs no SIMD-accelerated operations outside the two files noted in Section 4, and those are optional fast paths with full scalar equivalents. Any riscv64-vs-arm64 performance delta would originate in dependencies (OpenSSL, brotli, jemalloc); see Section 9. No published benchmark data of any kind (upstream, academic, or RISE) compares nghttp2 performance on riscv64 against any other architecture.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening analysis was found in upstream issues, downstream packaging notes, or RISE blog posts.

**Floating-point semantics:** Not applicable. nghttp2 uses no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

All five workflow files that exist in `.github/workflows/` were read in full, both via GitHub's code-search index and via a direct fetch of raw file content from `raw.githubusercontent.com` (bypassing the API restriction on this session), and independently via a full clone of HEAD. All three methods agree.

| CI job | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `build` ([build.yml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/build.yml)), Linux | `ubuntu-26.04` | `ubuntu-26.04-arm` (native) | Not present |
| `build-cross` (Windows via mingw/Wine) | `x86_64-w64-mingw32` | `i686-w64-mingw32` | Not present |
| Windows native | `windows-latest` | -- | Not present |
| macOS | `macos-26`, `macos-15` | Apple Silicon | Not present |
| OSS-Fuzz ([fuzz.yml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/fuzz.yml)) | `ubuntu-latest` | -- | Not present |
| Android ([android.yml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/android.yml)) | `ubuntu-26.04` | -- | Not present |
| Docker ([docker.yaml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/docker.yaml)) | `ubuntu-26.04` | -- | Not present |
| Stale-issue bot ([stale.yaml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/stale.yaml)) | `ubuntu-26.04` (scheduled cron) | -- | Not present |

Grepping the concatenated text of all five files for "riscv" (case-insensitive) returns zero matches; a search for "arm64" in the same files also returns zero matches, confirming the search method does detect architecture strings when present (it finds none for either term in this exact form, since the arm64 runner is spelled `ubuntu-26.04-arm`). No `docker/setup-qemu-action` or any QEMU reference appears in any workflow. The only Docker workflow (`docker.yaml`) runs `docker/build-push-action` with no `platforms:`/buildx-QEMU configuration, i.e. a single-arch (amd64) build.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository (confirmed via raw-CDN fetch returning HTTP 404 for each, and via filename-targeted code search returning zero results).

**RISE runners:** Not used by nghttp2 itself. RISE's self-hosted riscv64 runners (`ubuntu-24.04-riscv`) are used by the separate `riseproject-dev/python-wheels` repository, where nghttp2 appears only as a bundled transitive dependency (Section 9/11), not as a CI target in its own right.

**Downstream distro CI (not upstream):** Ubuntu, Debian, Gentoo, and AOSC build nghttp2 on their own riscv64 build infrastructure as part of their standard architecture matrices. This activity is entirely external to the nghttp2 project and provides no feedback into nghttp2's own CI pipeline.

---

## 8. Distribution and Release Status

**Upstream releases:** nghttp2 ships source tarballs only. The 5 most recent tags are v1.70.0, v1.69.0, v1.68.1, v1.68.0, and v1.67.1; asset filenames for v1.70.0 and v1.69.0 were checked directly and contain only `checksums.txt`, `nghttp2-X.Y.Z.tar.{bz2,gz,xz}` with `.asc` signatures, and GitHub's auto-generated source archives. No architecture-specific binary asset of any kind, for any platform, exists in any GitHub release.

**PyPI:** nghttp2 is not a PyPI package. `https://pypi.org/pypi/nghttp2/json` and `https://pypi.org/simple/nghttp2/` both return HTTP 404 ("Not Found"). RISE's own wheel-builder index (`gitlab.com/.../packages/pypi/simple/nghttp2/`) redirects to the same 404. The question of a riscv64 wheel is therefore moot: no package of any kind exists on PyPI under this name.

**Ubuntu 26.04 "resolute":** Confirmed via direct fetch of the raw packages.ubuntu.com page (not an AI summary). Eight matching package names exist: `nghttp2`, `libnghttp2-14`, `libnghttp2-dev`, `libnghttp2-doc`, `librust-libnghttp2-sys-dev`, `nghttp2-client`, `nghttp2-proxy`, `nghttp2-server`. Six of these (`libnghttp2-14`, `libnghttp2-dev`, `librust-libnghttp2-sys-dev`, `nghttp2-client`, `nghttp2-proxy`, `nghttp2-server`) list riscv64 at version 1.68.0-2, built via Ubuntu's Ports tier (alongside armhf, ppc64el, s390x), separately from the primary amd64/arm64/i386 "security"-supported tier, which carries the newer 1.68.0-2ubuntu0.2.

| Distribution | riscv64 package(s) | Version | Status |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libnghttp2-14`, `libnghttp2-dev`, `nghttp2-client/proxy/server`, `librust-libnghttp2-sys-dev` | 1.68.0-2 (Ports tier; one minor version behind the amd64/arm64 security-tier 1.68.0-2ubuntu0.2) | Confirmed, direct HTML fetch |
| Debian sid | `libnghttp2-dev`, `libnghttp2-14`, `nghttp2-client/proxy/server` | Data not available this pass: not re-queried; a prior pass recorded 1.69.0-1 on builder `rv-manda-03` [NEEDS VERIFICATION, not re-confirmed live] | Not re-verified |
| Arch Linux RISC-V | `libnghttp2` | A prior pass recorded `libnghttp2-1.69.0-1-riscv64.pkg.tar.zst` (2026-04-20) [NEEDS VERIFICATION]; this pass's attempt to re-check `archriscv.felixc.at` was inconclusive, since the page has no working package-search endpoint and guessed repo-tree URLs returned 404 | Inconclusive this pass |
| conda-forge | `nghttp2-feedstock` | PR [#57](https://github.com/conda-forge/nghttp2-feedstock/pull/57) adds linux-riscv64 support, reported merged | Downstream packaging repo, not upstream |
| AOSC OS | `nghttp2` | PR [#17530](https://github.com/AOSC-Dev/aosc-os-abbs), 1.70.0, general multi-arch bump | AOSC already builds nghttp2 across its standard arch matrix including riscv64 |

**What a user must do to get a working binary:** Install from a distribution package manager, e.g. `apt install libnghttp2-dev` on Ubuntu/Debian riscv64. No source build is required for normal library use. HTTP/3 features require a source build of ngtcp2 and nghttp3 at sufficiently current versions (Section 9).

---

## 9. Dependencies

The dependency manifest below reflects nghttp2's current `CMakeLists.txt` `find_package` calls (OpenSSL, WolfSSL, Libngtcp2, Libnghttp3, Libbrotlienc/dec, ZLIB, Jemalloc, Libevent, Libcares, Libbpf, LibXml2, Jansson, Systemd, Libev, Threads) plus the configure-only `mruby` option, cross-referenced against Ubuntu 26.04 "resolute" package availability (checked directly, not via the project-graph tool, which returned `CONNECTION_CLOSED` on every attempt this pass and could not be used).

| Dependency | Role | riscv64 build | riscv64 test (upstream CI) | riscv64 release (Ubuntu 26.04 "resolute") | Notes |
|---|---|---|---|---|---|
| OpenSSL | TLS/crypto, primary backend, critical | Yes | No | Yes, `libssl3t64` 3.5.5-1ubuntu3 | A prior pass's dependency table cited open issue [#30330](https://github.com/openssl/openssl/issues/30330) (Zkne key-check logic) as an open riscv64 blocker; this report's own dedicated OpenSSL report does not corroborate #30330 and documents only issue [#29357](https://github.com/openssl/openssl/issues/29357) (no-deprecated cross-compile, fix PR #30763 open/unmerged) [NEEDS VERIFICATION on #30330 - treat as a possibly stale or incorrect citation pending a human check]. See `project-reports/openssl.md`. |
| wolfSSL | TLS/crypto, alternative backend, optional | Yes, 6 riscv64-specific asm files (AES, ChaCha, Poly1305, SHA) | No | Yes, `libwolfssl-dev` 5.9.1-0.1 (universe/ports) | No open riscv64 issues as of the most recent pass (2026-07-20). |
| ngtcp2 | QUIC transport (HTTP/3), optional | Yes | No | `libngtcp2-16` found, 1.16.0-1 (universe/ports) | nghttp2 HEAD requires `>=1.23.0`; Ubuntu 26.04's packaged version is well behind this minimum, so HTTP/3 cannot be enabled from Ubuntu packages alone. |
| nghttp3 | HTTP/3 framing, optional | Yes | No | `libnghttp3-9` found, 1.12.0-1 (universe/ports) | nghttp2 HEAD requires `>=1.17.0`; same version-lag blocker as ngtcp2. |
| brotli | HTTP compression, optional | Yes (scalar) | No | `libbrotli1` found, 1.2.0-3build1 (ports) | RVV SIMD PR [#1410](https://github.com/google/brotli/pull/1410) (ISCAS) open 6+ months with zero maintainer review; successor PR [#1489](https://github.com/google/brotli/pull/1489) closed/abandoned (author deleted fork) June 2026. Scalar fallback fully functional. See `project-reports/brotli.md`. |
| zlib | HTTP compression (deflate/gzip), optional | Yes (scalar) | No | `zlib1g` found, 1:1.3.dfsg+really1.3.1-1ubuntu3 (ports) | No riscv64 SIMD anywhere upstream; no open riscv64 issues found. See `project-reports/zlib.md`. |
| jemalloc | Memory allocator, optional | Yes, but least-tuned of the three major architectures (1 arch-specific file vs 5 for amd64/arm64) | No | `libjemalloc2` found, 5.3.0-4 (ports) | Issue [#2399](https://github.com/jemalloc/jemalloc/issues/2399) (riscv64 cross-build support) unanswered since 2023-03-21, still open as of the latest check. Falls back to a generic spin-wait (no Zihintpause `pause` use) and a generic VA-width assumption (disables `RTREE_LEAF_COMPACT`). See `project-reports/jemalloc.md`. |
| libevent | Async I/O (nghttpx, examples), optional | Yes | No | `libevent-2.1-7t64` found, 2.1.12-stable-10build2 | No known riscv64 issues. See `project-reports/libevent.md`. |
| c-ares | Async DNS, optional | Yes | No | `libc-ares2` found, 1.34.6-1ubuntu0.1 | No known riscv64 issues; pure C. |
| libbpf | eBPF socket acceleration, optional | Yes, source-level parity with arm64 | Zero upstream CI of any kind for riscv64 (confirmed by reading all 9 of its workflow files) | Yes, `libbpf1` 1:1.7.0-1 | No open functional blockers; the kernel-side JIT (`arch/riscv/net/bpf_jit_comp64.c`) is a separate codebase outside libbpf's scope. See `project-reports/libbpf.md`. |
| libxml2 | XML parsing (nghttp tool), optional | Yes | No | Package renamed to `libxml2-16`/`libxml2-dev`; found, 2.15.2+dfsg-0.1, listed under the ports architecture set | No known riscv64 issues. See `project-reports/libxml2.md`. |
| Jansson | JSON (nghttpd/nghttpx tools), optional | Yes | No | `libjansson4` found, 2.14-2build4 (ports) | No known issues; pure C. |
| systemd | Socket activation, optional | Yes | N/A | `libsystemd0` found, 259.5-0ubuntu3 (ports) | No known riscv64 concerns. |
| libev | Async I/O event loop, optional | Yes (pure C, epoll backend on Linux) | No | Package renamed to `libev4t64`; found, 1:4.33-2.1build2 (universe/ports) | No known riscv64 issues. |
| mruby | Scripting/JIT-adjacent VM for nghttpx config, optional | Unknown; never investigated upstream or downstream | No | Not packaged in Ubuntu (`libmruby3`: "No such package.") or confirmed in Debian | Not a blocker for core HTTP/2 functionality, since it is an optional feature; no dedicated project report exists. |

**Hard blockers (correctness):** The only candidate is OpenSSL issue #30330, which this report's own dedicated OpenSSL research could not corroborate; it should not be treated as confirmed without further checking (see note above). OpenSSL issue #29357 (cross-compile with `no-deprecated`) remains open with an unmerged fix PR.

**Soft blockers (performance / completeness gaps, none in nghttp2 itself):**
- brotli: RVV SIMD PR #1410 stalled, successor abandoned; scalar fallback is fully functional.
- jemalloc: issue #2399 unanswered since 2023; riscv64 is the least-tuned of the three major architectures but functional via generic fallbacks.
- ngtcp2 / nghttp3: Ubuntu 26.04's packaged versions (1.16.0 / 1.12.0) are behind nghttp2 HEAD's required minimums (1.23.0 / 1.17.0), a harder version lag than previously recorded against Debian sid (1.22.1 / 1.15.0); HTTP/3 cannot be enabled from Ubuntu packages alone and requires a source build of both libraries.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1778](https://github.com/nghttp2/nghttp2/issues/1778) | update ax_boost_base.m4 and other m4 files from autoconf-archive (riscv64 lib64 Boost detection) | Closed, completed | Resolved, indirectly | Opened 2022-08-17, stale-flagged twice, self-closed by the reporter 2024-06-17 citing PR [#1844](https://github.com/nghttp2/nghttp2/pull/1844) ("Remove deprecated libnghttp2_asio"), which removed the Boost dependency entirely rather than patching the m4 macro. No code change for riscv64 lib64 detection was ever merged. |
| [#2648](https://github.com/nghttp2/nghttp2/issues/2648) | 1.68 Build failure in llparser when cross compiling for ARM | Closed, not_planned | Low, tangential | An ARM NEON cross-compile/llhttp intrinsics issue; "riscv64" appears only inside the reporter's build-path string, not as a RISC-V bug. Surfaced only in a broad "riscv64" search sweep. |

This is the complete universe of riscv/riscv64-tagged activity in `nghttp2/nghttp2`: repeated searches for "riscv", "riscv64", "RISCV", and "risc-v" across issues, pull requests, and commits return these two items (one genuinely RISC-V-related and closed, one a false-positive string match) and nothing else. A previously circulated reference to an issue #2195 describing a FreeBSD/riscv64 GCC 14 cross-compilation failure could not be found by any live search performed for this report and is not included here; it should be treated as unverified.

**Correctness bugs:** None open in nghttp2/nghttp2 itself.

**Performance issues:** None filed, and no quantitative RISC-V benchmark data exists in any source checked, upstream issues, RISE blog, general web search, or nghttp2's own benchmark documentation (the `h2load` HOW-TO and a 2015 benchmark gist, both architecture-agnostic and pre-dating RISC-V-capable server hardware relevant to this comparison).

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The maintainer has made no public comment on RISC-V, and no RISC-V-related patch has ever been rejected.

**Technical blockers:** None for the library itself. The codebase is portable C99/C++23 with no platform assumptions; any standards-compliant toolchain targeting riscv64 builds it correctly, as already demonstrated by Ubuntu, Debian, Gentoo, AOSC, and conda-forge packaging.

**Organizational blockers:** The project has a single maintainer handling roughly 93% of all commits, with no co-maintainer or documented succession plan visible from public data. A patch requiring maintainer review has an unpredictable timeline, though the project has historically accepted uncontroversial infrastructure and cleanup changes (e.g. PR #1844) without extended review friction.

**CI acceptance:** Adding a riscv64 job to `build.yml` requires no architecture-specific code changes; it is purely a CI-matrix addition (a QEMU job, or a RISE-hosted runner entry). The primary friction is maintainer bandwidth, not technical complexity.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** nghttp2 ships compiled C/C++ code, so the architecture-independent exemption does not apply. All 5 upstream GitHub Actions workflows (`build.yml`, `fuzz.yml`, `android.yml`, `docker.yaml`, `stale.yaml`) were read in full and contain zero riscv64/riscv mentions, no QEMU, and no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml` exist, so there is no upstream riscv64 CI at all ([build.yml](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/build.yml)). The distribution floor applies: Ubuntu 26.04 "resolute" ships riscv64 binaries for `libnghttp2-14`, `libnghttp2-dev`, and `nghttp2-client`/`proxy`/`server` via its Ports tier ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=nghttp2&suite=resolute&searchon=names&section=all)), and the codebase is confirmed pure portable C99/C++23 with zero architecture-specific files or ifdefs for riscv64 anywhere (only generic x86 AVX2/SSE4.2 and ARM NEON scalar-fallback fast paths exist), consistent with an unpatched, unmodified-source distro build rather than a riscv64-patched one. This meets the clean-distro-build yellow floor (no upstream CI, but a clean build from vanilla upstream source confirmed via distro packaging), capped at yellow since blue/green require upstream CI with test execution. nghttp2 is an HTTP/2 protocol library, not a performance-optimization-purpose project (its value is protocol correctness and compliance, not out-performing a simpler alternative via SIMD/ISA tuning), so no optimization-level modifier applies.
- **Pending work that could change the grade:** No open PRs or issues target riscv64 CI in `nghttp2/nghttp2`; the sole riscv64-related item, issue #1778 (an autoconf/Boost `lib64`-detection request), is closed and was resolved only incidentally by PR #1844 removing the Boost-dependent `libnghttp2_asio` component, not by any riscv64 fix. RISE's only touchpoint is indirect: nghttp2 appears as a transitive bundled dependency of libcurl in `riseproject-dev/python-wheels`' pycurl riscv64 wheel build (PR #940), with no direct RISE funding, blog coverage, or dedicated riscv64 CI/benchmark work on nghttp2 itself. Adding a riscv64 job to `build.yml` (or a RISE-hosted runner) would be a low-effort, uncontroversial path to blue/green given the codebase has no architecture-specific blockers.

---

## 14. Investment Analysis

RISE has performed no direct, funded work on nghttp2. The only RISE touchpoint found is incidental: nghttp2 is listed as one of several permissively-licensed native libraries bundled into the statically-linked libcurl used by RISE's `python-wheels` pycurl riscv64 wheel build (PR [#940](https://github.com/riseproject-dev/python-wheels), merged by luhenry 2026-09-05, running on RISE's self-hosted `ubuntu-24.04-riscv` runners). There is no dedicated nghttp2 repository, wheel, blog post, or benchmark under the RISE org.

### 14.1 Functional Enablement

No functional enablement work is needed. nghttp2 builds and runs correctly on riscv64 today without any upstream changes, as demonstrated by existing Ubuntu, Debian, Gentoo, and AOSC packages built from unmodified upstream source. No open functional bug blocks riscv64 use.

### 14.2 Performance Optimization

nghttp2 itself has no SIMD-amenable code paths beyond the two optional, non-blocking fast paths described in Section 4 (neither of which has a riscv64 variant on any project, including arm64 for `sfparse.c`). Performance optimization effort, if any, should target dependencies instead:
- brotli RVV SIMD (PR #1410, stalled; successor PR #1489 abandoned)
- jemalloc riscv64 tuning (issue #2399, open since 2023, no maintainer response)
- OpenSSL riscv64 crypto work (see `project-reports/openssl.md`)

No performance work on nghttp2 itself is warranted.

### 14.3 CI/CD Infrastructure

This is the one addressable gap. Upstream CI tests amd64 and arm64 (native) but not riscv64. Adding a riscv64 job to `build.yml`, either QEMU-based or on a RISE-hosted runner, requires no architecture-specific code changes and would catch regressions before they reach distributions.

Estimated effort: 1-2 person-weeks for a QEMU-based job (write the job, validate a clean build, submit PR, iterate through review). If a RISE-hosted riscv64 runner is already available as shared infrastructure, the effort for this project alone drops to under 0.5 person-weeks (the `build.yml` change only).

### 14.4 Ecosystem Enablement

Not applicable. nghttp2 is not distributed via a package ecosystem of its own (it has no PyPI, npm, or similar package; see Section 8); it is consumed as a native library directly by curl, Nginx, and similar projects, each of which has its own independent riscv64 enablement story. No action on nghttp2 itself is needed to unblock any dependent ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 job (QEMU or RISE-hosted runner) to `.github/workflows/build.yml`, library-only build | 1-2 (or under 0.5 with an existing RISE runner) | RISE or chip vendor | Medium |
| Functional | None required | - | - | - |
| Performance | brotli RVV SIMD (PR #1410) revival/merge, not nghttp2 work | See `project-reports/brotli.md` | brotli upstream / RISE | High (for brotli, not nghttp2) |
| Performance | jemalloc riscv64 tuning (issue #2399), not nghttp2 work | See `project-reports/jemalloc.md` | jemalloc upstream | Medium (for jemalloc, not nghttp2) |
| Performance | OpenSSL riscv64 issue #29357 (and #30330, pending verification), not nghttp2 work | See `project-reports/openssl.md` | OpenSSL upstream | Critical (for OpenSSL, not nghttp2) |
| Dependency hygiene | Track ngtcp2/nghttp3 version lag in Ubuntu packaging that blocks packaged HTTP/3 on riscv64 | Monitoring only | Distro maintainers | Low |

**Overall assessment:** nghttp2 is not a RISC-V investment priority in its own right. The library is fully functional on riscv64 today and requires no engineering investment to use; it is correctly graded yellow (clean-distro-build) solely because upstream has never added riscv64 to its CI matrix, not because of any functional or correctness gap. The only actionable, low-effort item is a CI PR to catch future regressions. Resources with a genuine riscv64 gap sit in nghttp2's dependencies (brotli, jemalloc, and possibly OpenSSL), not in nghttp2 itself.

---

## 15. References

- [nghttp2/nghttp2 GitHub repository](https://github.com/nghttp2/nghttp2)
- [nghttp2 homepage](https://nghttp2.org/)
- [Issue #1778 - update ax_boost_base.m4 for riscv64 lib64](https://github.com/nghttp2/nghttp2/issues/1778)
- [Issue #2648 - 1.68 Build failure in llparser when cross compiling for ARM](https://github.com/nghttp2/nghttp2/issues/2648)
- [PR #1844 - Remove deprecated libnghttp2_asio (resolves #1778)](https://github.com/nghttp2/nghttp2/pull/1844)
- [nghttp2 build.yml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/build.yml)
- [nghttp2 fuzz.yml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/fuzz.yml)
- [nghttp2 android.yml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/android.yml)
- [nghttp2 docker.yaml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/docker.yaml)
- [nghttp2 stale.yaml workflow](https://github.com/nghttp2/nghttp2/blob/master/.github/workflows/stale.yaml)
- [nghttp2 docker/Dockerfile](https://github.com/nghttp2/nghttp2/blob/master/docker/Dockerfile)
- [Ubuntu 26.04 "resolute" packages - nghttp2](https://packages.ubuntu.com/search?keywords=nghttp2&suite=resolute&searchon=names&section=all)
- [conda-forge/nghttp2-feedstock PR #57 - Support linux-riscv64 platform](https://github.com/conda-forge/nghttp2-feedstock/pull/57)
- [AOSC-Dev/aosc-os-abbs - nghttp2 security update to 1.70.0](https://github.com/AOSC-Dev/aosc-os-abbs)
- [riseproject-dev/python-wheels PR #940 - pycurl riscv64 wheel build](https://github.com/riseproject-dev/python-wheels)
- [brotli PR #1410 - RVV SIMD optimization](https://github.com/google/brotli/pull/1410)
- [brotli PR #1489 - second RVV attempt (closed)](https://github.com/google/brotli/pull/1489)
- [OpenSSL issue #30330 - Zkne key-check logic bug on riscv64 (citation not corroborated)](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #29357 - cross-compile failure with no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [jemalloc issue #2399 - riscv64 cross-build undocumented](https://github.com/jemalloc/jemalloc/issues/2399)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)