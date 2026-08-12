---
title: libcurl
categories:
  - libraries
---

# libcurl

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libcurl
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libcurl is the library component of the curl project ([curl.se](https://curl.se/libcurl/)), a portable C library for data transfer over a broad range of protocols (HTTP/1.1, HTTP/2, HTTP/3, FTP, SFTP, SMTP, and others). It is one of the most widely deployed networking libraries in existence, present in embedded firmware, operating systems, language runtimes, and end-user applications.

**Governance:** curl follows a BDFL model. Daniel Stenberg is the sole decision-maker. The project has no foundation, no legal entity, and no formal governance board. Copyrights belong to individual contributors and their employers. Donations are held by Open Collective (a US non-profit). The project is independent -- not affiliated with Apache Foundation, Linux Foundation, CNCF, or any umbrella organization.

**Corporate sponsors and employer affiliations:**
- wolfSSL employs Daniel Stenberg and funds his hours on curl directly.
- Haxx owns and funds the primary server infrastructure (hosted by Glesys, Stockholm). Daniel Stenberg is also associated with Haxx.
- Fastly provides CDN and web delivery for curl.se.
- GitHub provides CI infrastructure.
- TeamViewer provides test and CI infrastructure.
- Automattic, Elastic, and CodeRabbit are Gold sponsors.
- Kamil Dudka (contributor rank ~13) works at Red Hat.
- Alessandro Ghedini (contributor rank ~19) works at Cloudflare.

**RISE Project membership:** curl/libcurl is not a RISE member or listed RISE project. No RISE blog posts, no RISE-funded work, and no RISE wheel builder entries exist for libcurl.

**Community posture on new ports:** The project accepts any patch that compiles and passes tests, with Daniel Stenberg having final say. There is no formal process for adding new architecture ports -- they are treated as ordinary contributions. The original RISC-V atomics fix (see Section 2) was triaged and committed within one day of being reported, indicating a responsive and welcoming stance toward RISC-V users.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-06-27 | Issue #9055 filed by Adam Sampson: building curl 7.84.0 for riscv64 Linux with GCC 12 fails with undefined references to `__atomic_exchange_1`. | [curl/curl#9055](https://github.com/curl/curl/issues/9055) |
| 2022-06-28 | Daniel Stenberg commits fix (issue #9061, commit `ceaa5dfb`): switches `easy_lock` from `atomic_bool` to `atomic_int` to avoid requiring `-latomic` on RISC-V. First RISC-V-specific code change. | [curl/curl commit ceaa5dfb](https://github.com/curl/curl/commit/ceaa5dfb) |
| Before August 2025 | riscv64 is already a live cross-compilation target in the `curl-for-win` CI job `linux-musl-llvm`. Exact addition date not determined from searches performed. | [PR #18191](https://github.com/curl/curl/pull/18191) (cosmetic rename confirms prior existence) |
| 2025-02-05 | Commit `14f26f5` (PR #16187, vszakats): silence `-Warray-bounds` on GCC 13+ in `lib/smb.c`, triggered by riscv64 build among others. | [curl/curl commit 14f26f5](https://github.com/curl/curl/commit/14f26f5) |
| 2025-07-25 | Commit `054f69f` (PR #18030, vszakats): silence `-Warray-bounds` on GCC 13+ in `lib/http.c`, triggered exclusively by riscv64 cross-compilation. | [curl/curl commit 054f69f](https://github.com/curl/curl/commit/054f69f) |
| 2025-08-05 | Commit `7aa04d3` (PR #18191, vszakats): cosmetic rename of CI job display names to include architecture labels, making riscv64 explicit: "Linux llvm MUSL (amd64, riscv64)". | [curl/curl commit 7aa04d3](https://github.com/curl/curl/commit/7aa04d3) |
| 2025-11-05 | Commit `ede6a8e` (PR #19378, vszakats): silence `-Wnull-dereference` on GCC 14 riscv64 in `lib/conncache.c`. | [curl/curl commit ede6a8e](https://github.com/curl/curl/commit/ede6a8e) |
| 2026-04-30 | PR #21475 (vszakats): switch riscv CI job from `debian:testing` to `debian:stable` due to `musl-dev` cross-architecture version conflict. Merged same day. | [curl/curl PR #21475](https://github.com/curl/curl/pull/21475) |

**Key contributors to RISC-V work:**
- Viktor Szakats (vszakats, independent) -- all compiler-warning fixes and CI maintenance for riscv64 in the curl-for-win build system.
- Daniel Stenberg (bagder, wolfSSL/Haxx) -- original atomics fix in 2022.

**Upstreaming status:** Fully upstream. All RISC-V fixes are in the curl/curl main repository. There is no downstream fork carrying RISC-V patches.

---

## 3. Upstream Support Tier

curl has no formal platform tier policy document (no PLATFORMS.md or equivalent exists in the repository). RISC-V is listed as one of 28 supported CPU architectures in [docs/INSTALL.md](https://github.com/curl/curl/blob/master/docs/INSTALL.md), alongside Alpha, ARC, ARM, LoongArch, MIPS, POWER, x86, and others.

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Listed in INSTALL.md supported architectures | Yes | Yes | Yes |
| CI build job exists | Yes (linux.yml, multiple) | Yes (linux.yml) | Yes (curl-for-win.yml only) |
| CI test suite runs | Yes | Yes | No |
| CI runner type | Native | Native | x86_64 host, cross-compile only |
| CI workflow | linux.yml (main) | linux.yml (main) | curl-for-win.yml (auxiliary) |
| Official prebuilt binaries from upstream | No (source-only releases) | No | No |
| Debian sid package builds | Yes | Yes | Yes |
| Release-blocking status | Yes | Yes | No evidence of riscv64 being release-blocking |

**Assessment:** riscv64 is a Tier-2 CI-tested build target for the cross-compiled Linux/musl static binary. It is not tested in the main `linux.yml` CI workflow. The curl test suite is never executed on riscv64 in any upstream CI configuration.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libcurl is a pure C networking library with a deliberate design philosophy of strict portability. It contains no SIMD intrinsics, no assembly files (zero `.S` or `.asm` files anywhere in the repository), no JIT compilation, and no GC. All performance-critical cryptographic operations are fully delegated to the configured TLS backend (OpenSSL, mbedTLS, wolfSSL, GnuTLS, or others).

The single arch-specific guard in the entire codebase is in `lib/md5.c`:
```c
#if defined(__i386__) || defined(__x86_64__) || defined(__vax__)
```
This allows unaligned 32-bit reads in the fallback MD5 implementation, providing a minor speed improvement on those platforms. There is no equivalent for arm64 or riscv64. The fallback MD5 is only used when no system crypto library provides MD5, which is rare in practice.

**Component inventory:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Crypto (TLS, hashing) | Delegated to TLS backend | Delegated to TLS backend | Delegated to TLS backend |
| HTTP/2 framing (nghttp2) | Pure C | Pure C | Pure C |
| HTTP/3 / QUIC (ngtcp2+nghttp3) | Pure C | Pure C | Pure C |
| Compression (zlib, zstd, brotli) | Delegated to library | Delegated to library | Delegated to library |
| DNS (c-ares) | Pure C | Pure C | Pure C |
| MD5 fallback (lib/md5.c) | Unaligned-read optimization | Scalar C | Scalar C |
| Assembly | None | None | None |
| SIMD / intrinsics | None | None | None |
| JIT | None | None | None |

The riscv64 implementation is not a stub. It is the same complete C implementation used across all curl-supported platforms. The only missing element relative to amd64 is the unaligned-read micro-optimization in the rarely-invoked MD5 fallback path, which has no meaningful performance consequence in practice.

There is no `arch/riscv/` directory or any equivalent in the curl repository. No `__riscv` or `__riscv_xlen` preprocessor guards appear in `CMakeLists.txt`, `configure.ac`, or `lib/curl_setup.h`.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Autotools

Standard cross-compilation via `--host`:

```bash
export CC=riscv64-linux-gnu-gcc
export AR=riscv64-linux-gnu-ar
export AS=riscv64-linux-gnu-as
export LD=riscv64-linux-gnu-ld
export RANLIB=riscv64-linux-gnu-ranlib
export NM=riscv64-linux-gnu-nm
export STRIP=riscv64-linux-gnu-strip

./configure \
  --host=riscv64-linux-gnu \
  --build=$(gcc -dumpmachine) \
  --prefix=/usr/local \
  --with-openssl
```

No riscv64-specific example exists in curl's own documentation. The generic cross-compile pattern applies.

### CMake (curl-for-win, authoritative CI source)

```cmake
cmake \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=clang-21 \
  -DCMAKE_CXX_COMPILER=clang++-21 \
  -DCMAKE_ASM_COMPILER=clang-21 \
  -DCMAKE_C_COMPILER_TARGET=riscv64-unknown-linux-musl \
  -DCMAKE_CXX_COMPILER_TARGET=riscv64-unknown-linux-musl \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
```

No `CMAKE_TOOLCHAIN_FILE` for riscv64 is provided by the curl project. Headers and libraries are supplied via compiler flags (`-isystem /usr/riscv64-linux-gnu/include`, `-L/usr/riscv64-linux-gnu/lib`), not via `CMAKE_SYSROOT`.

Dynamic linker override for musl targets: `-Wl,--dynamic-linker=/lib/ld-musl-riscv64.so.1`

### Required toolchain versions and rationale

| Toolchain | Version | Reason |
|-----------|---------|--------|
| Clang/LLVM | 21 (`CW_CCSUFFIX='-21'`) in curl-for-win; 19 in curl/curl CI | Active CI versions for Linux musl riscv64 builds |
| GCC | 14 (`CW_GCCSUFFIX='-14'`) | Required even in clang builds; labeled `# FIXME: workaround for glibc-llvm-riscv64 builds` -- a known gap in clang's riscv64 glibc support |
| libclang-rt | 21 | `libclang-rt-21-dev:riscv64` is not directly installable via apt on an x86_64 host; the CI script downloads the .deb with `apt-get download` and extracts with `dpkg-deb --extract` |

**clang-rt RISC-V relocation issue:** clang-rt is skipped entirely for `CRT=gnu + CPU=r64` due to a known `R_RISCV_PCREL_HI20` relocation issue. libgcc is used as fallback. [NEEDS VERIFICATION] (sourced from curl-for-win CI scripts only)

### Debian cross-build setup

```bash
dpkg --add-architecture riscv64
apt-get update
apt-get install \
  gcc-14-riscv64-linux-gnu \
  g++-14-riscv64-linux-gnu \
  libc6-dev-riscv64-cross \
  musl:riscv64 \
  musl-dev:riscv64 \
  qemu-user-static \
  cmake ninja-build

# clang-rt requires manual extraction:
apt-get download libclang-rt-21-dev:riscv64
dpkg-deb --extract libclang-rt-21-dev_*.deb my-pkg/
```

### QEMU usage

`qemu-user-static` is installed in the CI environment and the runner `qemu-riscv64-static` is used to execute the cross-compiled curl binary for version string extraction during the build process. QEMU is not used to run the curl test suite. No tests are executed on riscv64.

### Known build failures (historical)

- `debian:testing` musl-dev version conflict (April 2026): `musl-dev:amd64=1.2.5-3+b1` vs `musl-dev:riscv64=1.2.5-3` skew broke the cross-build. Fixed by switching to `debian:stable` ([PR #21475](https://github.com/curl/curl/pull/21475), merged 2026-04-30).
- GCC 14 false-positive `-Wnull-dereference` in `lib/conncache.c` on riscv64: fixed by null-check guard ([commit ede6a8e](https://github.com/curl/curl/commit/ede6a8e), 2025-11-05).
- GCC 13+ false-positive `-Warray-bounds` in `lib/http.c` on riscv64: fixed by diagnostic pragma ([commit 054f69f](https://github.com/curl/curl/commit/054f69f), 2025-07-25).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All protocol handlers, authentication methods, TLS backends, compression methods, and transport layers available on amd64 and arm64 are equally available on riscv64. curl's feature set is controlled by which libraries it is compiled against, not by the host architecture.

**Performance gaps:** curl itself contributes no SIMD-accelerated code paths on any architecture. Performance is entirely determined by the TLS backend and compression libraries. See Section 9 for per-dependency analysis. The only libcurl-internal performance gap is the unaligned-read shortcut in the MD5 fallback path, which is architecturally negligible.

**Security hardening gaps:** None known in libcurl itself. The TLS backend (typically OpenSSL) has known riscv64 security concerns -- see Section 9.

**Floating-point and NaN semantics:** No issues found. libcurl has no floating-point computation paths relevant to RISC-V correctness (zero issues in this area in the repository).

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| HTTP/1.1, HTTP/2, HTTP/3 | Full | Full | Full |
| All TLS backends (OpenSSL, mbedTLS, wolfSSL, GnuTLS) | Full | Full | Full |
| All compression backends (zlib, zstd, brotli) | Full | Full | Full |
| SSH/SFTP (libssh2) | Full | Full | Full |
| Async DNS (c-ares) | Full | Full | Full |
| LDAP, SMB, IMAP, SMTP, FTP, RTSP, etc. | Full | Full | Full |
| MD5 unaligned-read optimization (lib/md5.c) | Present | Absent | Absent |
| SIMD in curl itself | None | None | None |

---

## 7. CI/CD Infrastructure

**Main Linux CI (`linux.yml`):** Covers amd64 and arm64 with native runners and executes the full curl test suite. Zero riscv64 references. riscv64 receives no test coverage from this workflow.

**curl-for-win CI (`curl-for-win.yml`):** Contains the only riscv64 CI job in the entire curl repository. Job ID: `linux-musl-llvm`. Job name: "Linux llvm MUSL (amd64, riscv64)". This job cross-compiles a static curl binary for both amd64 and riscv64 in a single invocation.

| Parameter | Value |
|-----------|-------|
| Trigger | `push` to master or `*/ci` branches; `pull_request` targeting master |
| Runner | `ubuntu-latest` (x86_64 host) |
| Container | Debian stable (Podman) |
| Compiler | LLVM/Clang 19, GCC 14 (suffix pins: `CW_CCSUFFIX=-19`, `CW_GCCSUFFIX=-14`) |
| Build config | `CW_CONFIG='-main-werror-unitybatch-nocertdata-linux-musl-r64-x64'` |
| Timeout | 10 minutes |
| Test execution | None |
| Build system | curl-for-win (cross-compilation scripts), not upstream autotools/cmake directly |

**No RISE runners.** No riscv64 native hardware runners exist in curl's CI. No QEMU emulation is used for test execution.

**Assessment of CI signal quality:** Cross-compilation success is a weak signal. It confirms the code compiles on riscv64 but provides no assurance that libcurl behaves correctly at runtime. No correctness, conformance, or performance testing occurs on riscv64.

| CI Criterion | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI | Yes (main linux.yml) | Yes (main linux.yml) | Yes (auxiliary curl-for-win.yml) |
| Test suite runs in CI | Yes | Yes | No |
| Native runner | Yes | Yes | No (cross-compile on x86_64) |
| RISE-funded runner | No | No | No |
| Release-blocking | Yes | Yes | No evidence |

---

## 8. Distribution and Release Status

**Upstream releases:** curl/curl publishes source-only releases on GitHub. Every asset across the five most recent releases (8.21.0, 8.20.0, 8.19.0, 8.18.0, 8.17.0) is a source tarball or zip (`.tar.bz2`, `.tar.gz`, `.tar.xz`, `.zip`) with `.asc` signatures. No prebuilt binaries are published by the upstream project for any architecture.

**Debian sid:** `libcurl4t64` at version `8.21.0~rc3-1` is available for riscv64, built on `rv-manda-01` with status "Installed" per the Debian buildd tracker. This is an RC pre-release in Debian unstable (sid), not a stable release. The `pycurl` and `trurl` autopkgtests on riscv64 show regressions that are blocking curl from migrating from sid to Debian testing, meaning the riscv64 packages do not propagate to Debian stable.

**Debian stable (bookworm):** No direct evidence that riscv64 packages are available in Debian stable. Absence of data -- no confirmed presence.

**Ubuntu 24.04 (noble):** `libcurl4t64` (version 8.5.0-2ubuntu10), `libcurl3t64-gnutls`, `libcurl4-openssl-dev`, and `libcurl4-gnutls-dev` are available for riscv64 via the ubuntu-ports mirror. The security pocket lags: riscv64 is at `8.5.0-2ubuntu10` while amd64/i386 are at `8.5.0-2ubuntu10.9`.

**Arch Linux RISC-V:** Data not available -- the archriscv.felixc.at frontend did not return parseable package listings, and the riscv.mirror.pkgbuild.com mirror returned 404.

**PyPI:** No `libcurl` package exists on PyPI. Not applicable.

| Channel | riscv64 available | Version | Notes |
|---------|------------------|---------|-------|
| Upstream GitHub Releases | No | -- | Source-only, no binaries for any arch |
| Debian sid | Yes | 8.21.0~rc3-1 | RC pre-release, blocked from migrating to testing |
| Debian stable | Data not available | -- | Not confirmed |
| Ubuntu 24.04 noble | Yes | 8.5.0-2ubuntu10 | Via ubuntu-ports; security pocket lags |
| PyPI | No | -- | Package does not exist under this name |
| Arch Linux RISC-V | Data not available | -- | Page not parseable |

**To get a working riscv64 libcurl binary:** On Debian/Ubuntu, `apt-get install libcurl4t64` on a riscv64 system works. For static builds or non-Debian targets, cross-compilation from source using the curl-for-win toolchain approach is required.

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release/Package | Open Blockers |
|-----------|------|--------------|-------------|------------------------|---------------|
| OpenSSL | TLS/crypto (default backend) | Builds (Debian sid installed) | Flaky: `test_lhash` intermittent (issue #30880) | Debian riscv64 installed | #29357 (cross-build with `--no-deprecated` fails); #31080/#31082 (AES/GHASH fallbacks not constant-time on no-RVV); multiple crypto asm PRs pending |
| zlib | HTTP compression (gzip) | Builds | No open riscv64 issues | Debian riscv64 installed | None identified |
| zlib-ng | High-perf zlib replacement | Builds (issue #2148 closed; fixed without RVV in 2.3.4+) | All 21 riscv64 issues closed | Available in some distros | None open |
| zstd | Content encoding (Zstandard) | Builds (Debian sid installed) | #4622 open: 4-way fast Huffman decode loop not enabled on riscv64 | Debian riscv64 installed | #4622 (performance gap, not correctness; CLA signed, PR open) |
| brotli | Content encoding (Brotli) | Builds (Debian sid installed) | No open riscv64 issues | Debian riscv64 installed | None; generic C fallback used on riscv64 |
| nghttp2 | HTTP/2 framing | Builds (Debian sid installed) | No open riscv64 issues | Debian riscv64 installed | None; pure C |
| ngtcp2 + nghttp3 | HTTP/3 / QUIC (optional) | Builds (Debian ngtcp2 installed) | No open riscv64 issues | Debian riscv64 installed | None identified |
| c-ares | Async DNS resolver (optional) | Builds (Debian sid installed) | No riscv64 issues | Debian riscv64 installed | None; pure C |
| libssh2 | SSH/SFTP transport (optional) | Builds (Debian sid installed) | No riscv64 issues | Debian riscv64 installed | None; crypto delegated to TLS backend |
| libidn2 | IDN domain names | Builds (Debian sid installed) | No riscv64 issues | Debian riscv64 installed | None; pure C |
| libpsl | Public Suffix List | Builds (Debian sid installed) | No riscv64 issues | Debian riscv64 installed | None |

### Critical dependency deep-dives

**OpenSSL (default TLS backend):** The most significant source of risk in the libcurl riscv64 stack.

- Build blocker: [issue #29357](https://github.com/openssl/openssl/issues/29357) -- cross-compilation with `--no-deprecated` fails on `linux64-riscv64`. Affects CI/CD pipelines doing cross-builds; native builds are unaffected.
- Security concern: [issues #31080](https://github.com/openssl/openssl/issues/31080) and [#31082](https://github.com/openssl/openssl/issues/31082) -- AES and GHASH fallback paths (used when hardware crypto extensions such as Zkn/Zbc are absent) are not constant-time on riscv64. This is a side-channel risk on boards without the relevant RISC-V crypto extensions.
- Performance: Multiple open PRs adding riscv64 assembly for ChaCha20, Poly1305, SM4, SHA-3, and Zksed. All are performance improvements, not correctness blockers.
- CI: `test_lhash` intermittently fails on riscv64 OS Zoo CI ([issue #30880](https://github.com/openssl/openssl/issues/30880)).
- Full analysis is in `./libraries/openssl.md`.

**zstd:** [Issue #4622](https://github.com/facebook/zstd/issues/4622) -- the `HUF_4X2_4WAY` fast 4-way Huffman decode loop is not enabled on riscv64. This reduces decompression throughput below what the hardware can achieve. A PR exists with CLA signed; not yet merged. Not a correctness blocker, but a meaningful performance gap for workloads dominated by decompressed transfer.

**zlib-ng:** Was broken on riscv64 when built without the RVV extension (issue #2148); fixed in version 2.3.4+. All 21 riscv64 issues are closed. For RVV-accelerated builds, zlib-ng provides CRC32/inflate acceleration on RISC-V hardware with the V extension. Full analysis is in `./libraries/zlib-ng.md`.

---

## 11. Known Bugs and Active Issues

**As of June 2026, there are zero open issues or PRs in curl/curl mentioning riscv or riscv64.**

All historical RISC-V issues in curl/curl have been closed. The following table covers all confirmed RISC-V-related items:

| ID | Title | Status | Type | Notes |
|----|-------|--------|------|-------|
| [PR #21475](https://github.com/curl/curl/pull/21475) | GHA/curl-for-win: switch riscv job to debian:stable (testing broke) | Merged 2026-04-30 | CI infrastructure | musl-dev cross-arch version conflict in debian:testing |
| [PR #19378](https://github.com/curl/curl/pull/19378) | conncache: silence -Wnull-dereference on gcc 14 RISC-V 64 | Merged 2025-11-05 | Compiler false positive | GCC 14 analyzer exclusive to riscv64 cross-compilation |
| [PR #18030](https://github.com/curl/curl/pull/18030) | http: silence -Warray-bounds with gcc 13+ | Merged 2025-07-25 | Compiler false positive | Triggered on riscv64 only; amd64/arm64 unaffected |
| [PR #16187](https://github.com/curl/curl/pull/16187) | smb: silence -Warray-bounds with gcc 13+ | Merged 2025-02-05 | Compiler false positive | Affected amd64, arm64, and riscv64 |
| Issue #9055 / #9061 | Building for riscv64 Linux with GCC 12 fails: undefined `__atomic_exchange_1` | Fixed 2022-06-28 | Build failure | `easy_lock` switched from `atomic_bool` to `atomic_int` |

No correctness bugs, test failures, or runtime issues have been reported for libcurl on riscv64.

---

## 12. Objections and Upstream Blockers

**No technical objections or upstream blockers** exist for libcurl itself on riscv64. The maintainers have accepted every RISC-V contribution without objection. The BDFL governance model means a single responsive maintainer (Daniel Stenberg) can approve RISC-V patches without committee overhead.

**Organizational blockers:** None. wolfSSL (Stenberg's employer) has its own RISC-V interest, which aligns with continued riscv64 support in curl.

**CI gap:** The absence of test-suite execution on riscv64 in any upstream CI workflow is a structural gap, not a blocker for individual patches. Patches that fix riscv64 build issues are accepted without requiring riscv64 test-suite coverage as a precondition.

**Dependency blockers:** OpenSSL's riscv64 issues (Section 9) represent the primary risk surface. These are outside curl's control but affect libcurl's security posture on RISC-V hardware lacking crypto extensions.

---

## 13. Investment Analysis

RISE has no existing investment in libcurl. The curl project itself is low-risk for RISC-V enablement -- the library is fully functional, builds cleanly, and has a cooperative maintainer. Investment options are narrow and targeted.

### 13.1 Functional Enablement

No functional gaps exist in libcurl on riscv64. No investment required.

### 13.2 Performance Optimization

libcurl delegates all performance-sensitive operations to its dependencies (TLS backend, compression libraries). There are no SIMD or assembly code paths in libcurl itself to optimize. Performance investment should target OpenSSL (crypto assembly), zstd (Huffman decode loop), and zlib-ng (RVV-accelerated inflate). These are covered in separate reports.

### 13.3 CI/CD Infrastructure

The primary gap is the absence of riscv64 test-suite execution in upstream curl CI. Adding QEMU-based or native riscv64 test execution to `linux.yml` would provide a meaningful signal improvement. This requires upstream acceptance (likely given the maintainer's track record) and runner infrastructure.

Estimated scope: integration into `linux.yml` using QEMU `linux/riscv64` emulation is a 1-2 week engineering task. A native riscv64 runner would require infrastructure provisioning beyond code changes.

### 13.4 Ecosystem Enablement

libcurl has no package ecosystem of its own that requires separate riscv64 enablement. The library itself is the ecosystem primitive. Not applicable.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 test-suite execution to `linux.yml` (QEMU-based) | 2 | Contributor to curl/curl | Medium |
| CI/CD | Provision native riscv64 runner for curl CI | Infrastructure task, not engineering | RISE or hardware partner | Low |
| Dependencies | OpenSSL AES/GHASH constant-time fix on riscv64 (#31080/#31082) | See `reports/openssl.md` | OpenSSL contributor | High (security) |
| Dependencies | zstd 4-way Huffman decode loop on riscv64 (#4622) | See `reports/zstd.md` | Facebook/zstd contributor | Medium (performance) |
| Functional | None | N/A | N/A | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [curl/curl repository](https://github.com/curl/curl)
- [libcurl homepage](https://curl.se/libcurl/)
- [PR #21475: switch riscv job to debian:stable](https://github.com/curl/curl/pull/21475)
- [PR #19378: conncache: silence -Wnull-dereference on gcc 14 RISC-V 64](https://github.com/curl/curl/pull/19378)
- [PR #18030: http: silence -Warray-bounds with gcc 13+](https://github.com/curl/curl/pull/18030)
- [PR #16187: smb: silence -Warray-bounds with gcc 13+](https://github.com/curl/curl/pull/16187)
- [PR #18191: GHA/curl-for-win: include CPU archs in job names](https://github.com/curl/curl/pull/18191)
- [commit ceaa5df: switch riscv job to debian:stable](https://github.com/curl/curl/commit/ceaa5df)
- [commit ede6a8e: conncache: silence -Wnull-dereference on gcc 14 RISC-V 64](https://github.com/curl/curl/commit/ede6a8e)
- [commit 054f69f: http: silence -Warray-bounds with gcc 13+](https://github.com/curl/curl/commit/054f69f)
- [commit 14f26f5: smb: silence -Warray-bounds with gcc 13+](https://github.com/curl/curl/commit/14f26f5)
- [commit 7aa04d3: include CPU archs in job names](https://github.com/curl/curl/commit/7aa04d3)
- [curl/curl .github/workflows/curl-for-win.yml](https://github.com/curl/curl/blob/master/.github/workflows/curl-for-win.yml)
- [curl/curl docs/INSTALL.md](https://github.com/curl/curl/blob/master/docs/INSTALL.md)
- [Debian tracker: curl](https://tracker.debian.org/pkg/curl)
- [Debian buildd: curl riscv64](https://buildd.debian.org/status/package.php?p=curl&suite=sid)
- [Ubuntu 24.04 noble: libcurl4t64](https://packages.ubuntu.com/noble/libcurl4t64)
- [OpenSSL issue #29357: cross-compilation with --no-deprecated fails on linux64-riscv64](https://github.com/openssl/openssl/issues/29357)
- [OpenSSL issue #30880: test_lhash intermittent failure on riscv64](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL issue #31080: AES fallback not constant-time on riscv64](https://github.com/openssl/openssl/issues/31080)
- [OpenSSL issue #31082: GHASH fallback not constant-time on riscv64](https://github.com/openssl/openssl/issues/31082)
- [zstd issue #4622: HUF_4X2_4WAY fast decode loop not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)
- [RISE Project: riseproject.dev](https://riseproject.dev)