---
title: libcurl
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: nghttp2
    relation: runtime-dependency
    criticality: optional
  - name: ngtcp2
    relation: runtime-dependency
    criticality: optional
  - name: nghttp3
    relation: runtime-dependency
    criticality: optional
  - name: c-ares
    relation: runtime-dependency
    criticality: optional
  - name: libssh2
    relation: runtime-dependency
    criticality: optional
  - name: libidn2
    relation: runtime-dependency
    criticality: optional
  - name: libpsl
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Perl
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libcurl" %}

# libcurl

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libcurl<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libcurl is the library component of the curl project ([curl.se](https://curl.se/libcurl/)), a portable C library for data transfer over a broad range of protocols (HTTP/1.1, HTTP/2, HTTP/3, FTP, SFTP, SMTP, and others). It is one of the most widely deployed networking libraries in existence, present in embedded firmware, operating systems, language runtimes, and end-user applications. License: MIT/X-derivative "curl license" (SPDX identifier "curl").

**Governance:** curl follows a BDFL (Benevolent Dictator For Life) model led by Daniel Stenberg, documented at [curl.se/docs/governance.html](https://curl.se/docs/governance.html). The project is explicitly "not a democracy": community discussion is preferred, but a maintainer knowledgeable in a given area takes an "executive" decision when consensus is unclear. Maintainers are volunteers with repo push access and no mandatory duties beyond reviewing in their area of expertise; 2FA is required. A core/security team handles confidential matters (code-of-conduct violations, vulnerability reports). A documented succession plan has the core team vote for a new BDFL, or move to council governance, if Daniel Stenberg departs. curl has no foundation, no legal entity, and no CNCF/Linux Foundation/Apache-style membership.

**Corporate sponsors and employer affiliations:**
- wolfSSL employs Daniel Stenberg and funds his work hours on curl ([curl.se/sponsors.html](https://curl.se/sponsors.html)).
- Haxx is described as "the primary sponsor of the curl project."
- Infrastructure sponsors: Fastly (CDN/website), GitHub (CI), TeamViewer (CI), Kirei (DNS).
- Gold sponsors: Automattic, CodeRabbit, Elastic. 15 silver sponsors (Icons8, Airbnb, BairesDev, Scrapingbee, and others).
- curl.se/docs/companies.html lists roughly 289 organizations that use curl/libcurl (Apple, Microsoft, Google, Tesla, NASA, and others) - these are users, not sponsors or maintainers.
- The most active non-Daniel contributor by recent commit volume is Viktor Szakats (GitHub: vszakats); no employer affiliation was found for him on curl.se. His work is concentrated in the curl-for-win CI/build infrastructure, and he authored essentially every riscv64-related commit found this cycle.

**RISE Project membership:** curl/libcurl is not listed among RISE's Premier or General members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - [riseproject.dev/members](https://riseproject.dev/members/)). A full scan of 36 RISE blog posts (2024-05 through 2026-09) found none mentioning curl or libcurl, and a search of the riseproject-dev/system-libraries-wg issue tracker for "curl" returned zero results. The one confirmed touchpoint is indirect: riseproject-dev/python-wheels [PR #940](https://github.com/riseproject-dev/python-wheels/pull/940) ("pycurl: add build-pycurl.yml for riscv64 wheels"), merged 2026-09-05, adds riscv64 manylinux wheels for pycurl (the separate Python binding project), compiled against the riscv64 manylinux image's libcurl-devel. This is RISE-funded engineering that consumes libcurl, not work on curl/libcurl itself.

**Community posture on new ports:** curl accepts any patch that compiles and passes tests, with Daniel Stenberg having final say; there is no formal process for new architecture ports. The original riscv64 atomics fix (Section 2) was triaged and committed within one day of being reported, and all subsequent riscv64 compiler-warning and CI patches (all from a single author, vszakats) were merged without contention or objection, indicating a routine, non-controversial acceptance path for RISC-V-related contributions.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-06-27 | Issue #9055 filed by Adam Sampson: building curl 7.84.0 for riscv64 Linux with GCC 12 fails with undefined references to `__atomic_exchange_1`. | [curl/curl#9055](https://github.com/curl/curl/issues/9055) |
| 2022-06-28 | Daniel Stenberg (bagder) commits a fix switching `easy_lock` from `atomic_bool` to `atomic_int` to avoid requiring `-latomic` on RISC-V. First RISC-V-specific code change in the repository. | [curl/curl commit 50efb08](https://github.com/curl/curl/commit/50efb0822aa0e0ab165158dd0a26e65a2290e6d2) |
| 2024-08-30 | Viktor Szakats (vszakats) lands "the first RISC-V 64 build in curl's CI" - the initial riscv64 cross-target for curl-for-win's Linux MUSL job. | [curl/curl commit 04e3621](https://github.com/curl/curl/commit/04e3621dce409f1c4a6055cde54cf030a22199e7) |
| 2025-02-05 | Commit `14f26f5` (PR #16187, vszakats): silences `-Warray-bounds` on GCC 13+/14 in `lib/smb.c`, first seen on riscv64 builds among others. First release: 8.12.1 (2025-02-13), not the same-day 8.12.0 (2025-02-05), which was cut just before this merge. | [curl/curl commit 14f26f5](https://github.com/curl/curl/commit/14f26f5ee78204c15bf906f3cf7480308e2feb28) |
| 2025-07-25/26 | Commit `054f69f` (PR #18030, vszakats): silences `-Warray-bounds` on GCC 13+ in `lib/http.c`, first observed on RISC-V (musl and glibc) builds. First release: 8.16.0 (2025-09-10). | [curl/curl commit 054f69f](https://github.com/curl/curl/commit/054f69ffb79fc916a3f0a278eb8e45b407f815b2) |
| 2025-11-05/06 | Commit `ede6a8e` (PR #19378, vszakats): silences `-Wnull-dereference` on GCC 14 for `lib/conncache.c`, seen specifically in RISC-V 64 cross-builds. First release: 8.18.0 (2026-01-07), missing 8.17.0 (2025-11-05) by one day. | [curl/curl commit ede6a8e](https://github.com/curl/curl/commit/ede6a8e08762321d95864ad384b8ff5ac44ac459) |
| 2026-04-30 | PR #21475 (vszakats): switches the curl-for-win riscv64 CI Docker base from `debian:testing` to `debian:stable` after a `musl-dev` cross-architecture version conflict broke the testing image. Merged same day. First release: 8.21.0 (2026-06-24). | [curl/curl commit ceaa5df](https://github.com/curl/curl/commit/ceaa5dfba001223132ed2e125cf7bb688e07cda2) |
| 2026-08-15/16 | PR #22590 (bump cross-build-actions, new FreeBSD riscv64 job, ~4.5 min) and PR #22601/#22602 (BSD build improvements: disabling typecheck gives a 3-4x speedup for riscv64 emulated compilation; BSD tflags sync notes a full riscv64 test run takes 8.5-12 minutes) land. | [curl/curl commit 91323de](https://github.com/curl/curl/commit/91323de7f3ddfad2fb6860a695ffa805e9389afe), [commit bf59422](https://github.com/curl/curl/commit/bf594226d66dc2bbf62a18f3dea1ceabe5b26dcf), [commit d000006](https://github.com/curl/curl/commit/d00000673d05fdf6ceee8941ccd63ad2906257e4) |
| 2026-08-18 | PR #22617 (vszakats): replaces the hand-tuned riscv64 test subset with the new `--subset` runtests parameter, accepting roughly 3.5 extra minutes of CI time (Perl install, test compile, ~100 test cases) in exchange for randomized coverage. | [curl/curl commit 79132a1](https://github.com/curl/curl/commit/79132a1daf8f3b2b6db101be386fa9e8cb3f73f5) |
| 2026-08-30/31 | PR #22748 (bump cross-platform-actions to 1.5.0) and PR #22760 (temporarily disable the FreeBSD riscv64 job after the upstream FreeBSD riscv64 package repo started returning 404s) land. | [curl/curl commit 73f1836](https://github.com/curl/curl/commit/73f18365ab8e47912afcd5ee9404c7493d9d0fb2) |
| 2026-09-03 | PR #22814 (vszakats): re-enables the FreeBSD riscv64 CI job after the upstream package-repo outage was resolved. Merged but **not yet shipped in a tagged release**; the next release is expected around 2026-10-14 (post-dates 8.22.0, released 2026-09-02). | [curl/curl commit 0f2e0af](https://github.com/curl/curl/commit/0f2e0af0da0dd31652cd73a7d5a52c0246416eec) |

**[NEEDS VERIFICATION] / discrepancy note:** The prior version of this report attributed commit hash `ceaa5dfb` to the 2022-06-28 atomics fix. Live commit-log research this cycle instead identifies `ceaa5dfba001223132ed2e125cf7bb688e07cda2` as the 2026-04-30 debian:stable-switch commit (PR #21475), and gives a different hash, `50efb0822aa0e0ab165158dd0a26e65a2290e6d2`, for the 2022 atomics fix. The table above uses the freshly re-derived hashes; the original `ceaa5dfb` attribution for the 2022 fix appears to have been an error carried in the prior report and is superseded here.

**Key contributors to RISC-V work:** Viktor Szakats (vszakats, independent, no employer affiliation found) authored essentially every riscv64 CI-maintenance commit and compiler-warning fix from 2025 onward. Daniel Stenberg (bagder, wolfSSL/Haxx) authored the original 2022 atomics fix.

**Upstreaming status:** Fully upstream. No dedicated "riscv64 port" tracking issue exists, nor has one ever existed - RISC-V support is handled entirely as incremental CI-infrastructure maintenance and a small number of GCC false-positive-warning suppressions, not as a tracked feature or port effort. There is no downstream fork carrying RISC-V-specific patches.

---

## 3. Upstream Support Tier

curl has no formal platform-tier policy document. No `PLATFORMS.md`, `SUPPORT.md`, `BUILDING.md`, or `docs/cross-compilation.md` exists in the repository (all checked paths 404 against `curl/curl` on `master`, fetched 2026-09-30). RISC-V is one of several CPU architectures listed generically in `docs/INSTALL.md`, alongside Alpha, ARC, ARM, LoongArch, MIPS, POWER, and x86, but INSTALL.md gives no riscv64-specific build example (see Section 5).

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Native runner in `linux.yml` (full test suite, release-gating) | Yes | Yes | No - riscv64 does not appear in `linux.yml` at all |
| Build job exists anywhere in CI | Yes | Yes | Yes - two jobs: `non-native.yml` (FreeBSD/riscv64) and `curl-for-win.yml` (Linux MUSL/riscv64) |
| Test execution in CI | Full suite, native | Full suite, native | Partial: a random 1/10 subset of the HTTP test suite runs on an emulated FreeBSD/riscv64 VM (`non-native.yml`); the Linux MUSL job (`curl-for-win.yml`) runs no tests at all |
| CI trigger | push/PR to master | push/PR to master | push/PR to master (both riscv64 jobs run on ordinary commits, not manually gated) |
| Official prebuilt binaries from upstream GitHub Releases | No (source-only) | No (source-only) | No (source-only) - true for every architecture, not a riscv64-specific gap |
| Release-blocking | Yes | Yes | No - neither riscv64 CI job gates a tagged release |
| Packaged by major distros | Yes | Yes | Yes (Ubuntu ports, Debian, Alpine, AlmaLinux, Arch Linux RISC-V) |

**Assessment:** riscv64 is a CI-maintained, partially-tested cross-compilation/emulation target. It receives real, if narrow, test execution (a randomized subset via an emulated FreeBSD VM) but is entirely absent from `linux.yml`, the workflow that runs curl's full native test suite and is understood to gate releases. This is a materially better position than "build-only," but short of the native, full-suite tier that amd64 and arm64 receive.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libcurl is a pure C networking library with a deliberate design philosophy of strict portability. Adversarial source-level verification (GitHub code search across `curl/curl`) confirms: zero `__riscv`/`__riscv64` guards anywhere in the source; no `arch/riscv/` directory or equivalent; no `.S`/assembly files; no JIT; no per-architecture SIMD dispatch. All performance-critical cryptographic operations are delegated entirely to the configured TLS backend (OpenSSL, mbedTLS, wolfSSL, GnuTLS, or others), which is graded separately.

The entire universe of CPU-architecture-conditional code in curl's own source is four files:

| File | Guard | Purpose |
|------|-------|---------|
| `lib/easy_lock.h` | `__x86_64__` / `__aarch64__` | Spinlock `pause`/`yield` instruction hints; falls back to `sched_yield()` on every other architecture, including riscv64. Scheduler-friendliness micro-optimization, not correctness-bearing. |
| `lib/md5.c` | `__i386__` / `__x86_64__` / `__vax__` | Unaligned 32-bit-read fast path in the fallback MD5 implementation. The code comment itself states "Nothing will break if it does not work." riscv64 uses the always-correct byte-copy fallback. |
| `lib/md4.c` | same pattern as md5.c | Same unaligned-read fast path, same fallback behavior on riscv64. |
| `include/curl/system.h` | `__LP64__` / `__ILP32__` | Generic pointer-width/ABI detection, not an architecture-specific branch; riscv64 is caught automatically via the compiler-provided `__LP64__` macro, identically to every other 64-bit LP64 target. |

**Component inventory:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Crypto (TLS, hashing) | Delegated to TLS backend | Delegated to TLS backend | Delegated to TLS backend |
| HTTP/2 framing (nghttp2) | Pure C | Pure C | Pure C |
| HTTP/3 / QUIC (ngtcp2+nghttp3) | Pure C | Pure C | Pure C |
| Compression (zlib, zstd, brotli) | Delegated to library | Delegated to library | Delegated to library |
| DNS (c-ares) | Pure C | Pure C | Pure C |
| Spinlock hint (easy_lock.h) | `pause` intrinsic | `yield` asm | `sched_yield()` generic fallback |
| MD4/MD5 fallback unaligned-read optimization | Present | Absent | Absent |
| Assembly | None | None | None |
| SIMD / intrinsics | None | None | None |
| JIT | None | None | None |

The riscv64 implementation is not a stub in any meaningful sense - it runs the identical, fully-functional generic C code path used by every non-x86/non-arm64 architecture curl supports (MIPS, PowerPC, SPARC, s390, and others). The only components present on amd64/arm64 and absent on riscv64 are two trivial micro-optimizations (a spinlock instruction hint, and an unaligned-memory-read shortcut in a rarely-invoked MD4/MD5 fallback path) that the code's own comments describe as non-load-bearing. Applying a "hand-tuned / intrinsics / scalar / missing" rubric designed for SIMD-heavy codecs is not a meaningful lens for this library: curl has no such tier for any architecture, including amd64.

---

## 5. Build System, Cross-Compilation, and Toolchain

curl has no dedicated riscv64 build documentation, no riscv64 CMake toolchain file, and no riscv64 Dockerfile in `curl/curl`. Direct file checks against `master` (fetched 2026-09-30) confirm: `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` (and `CMake/` equivalents) all do not exist; `CMakeLists.txt` contains zero occurrences of "riscv"; no riscv64-tagged Dockerfile exists anywhere in the repository; and `search_code query="qemu riscv64 repo:curl/curl"` returns zero results.

### Where riscv64 actually appears (two CI workflow files only)

**`.github/workflows/non-native.yml`** (job `cross`, FreeBSD/riscv64 matrix entry, line 79 on the cloned `master` at `0b0063174bc6a42ce027931ab855757f4acdd9b2`):
```yaml
- { os: 'freebsd', version: '15.1', build: 'cmake', arch: 'riscv64', cc: 'clang',
    desc: 'openssl !examples', tflags: 'HTTP --min=0 --subset=0/10 -R --seed',
    install: 'cmake-core ninja perl5',
    options: '-D_CURL_PREFILL=ON -DBUILD_LIBCURL_DOCS=OFF -DBUILD_MISC_DOCS=OFF -DENABLE_CURL_MANUAL=OFF -DCURL_DISABLE_HTTPSIG=OFF -DCURL_DISABLE_TYPECHECK=ON' }
```
Runs on `ubuntu-latest` (x86_64 host); the FreeBSD/riscv64 guest is booted via `cross-platform-actions/action` (a VM action), not QEMU user-mode emulation inside a container. This job both builds and runs a random 1/10 subset of the HTTP test suite. Toolchain: `clang`, unversioned (whatever ships in FreeBSD 15.1 base); build tools `cmake-core`, `ninja`, `perl5` install and run successfully in this environment.

**`.github/workflows/curl-for-win.yml`** (job `linux-musl-llvm`, runs on `ubuntu-26.04-arm`):
```yaml
linux-musl-llvm:
  name: 'Linux llvm MUSL (amd64, riscv64)'
  runs-on: ubuntu-26.04-arm
  timeout-minutes: 10
  steps:
    - name: 'build'
      run: |
        git clone --depth 1 https://github.com/curl/curl-for-win
        mv curl-for-win/* .
        export CW_CONFIG='-main-werror-unitybatch-nocertdata-linux-musl-r64-x64'
        export CW_CCSUFFIX='-19'
        export CW_GCCSUFFIX='-14'
        podman run --volume "$(pwd):$(pwd)" --workdir "$(pwd)" \
          "${OCI_IMAGE_DEBIAN_STABLE}" sh -c ./_ci-linux-debian.sh
```
This job cross-compiles curl for Linux MUSL riscv64 (and amd64) via Podman in a `debian:stable` container, using build scripts pulled from the separate `curl/curl-for-win` repository. It is a cross-compile/packaging job only - no test execution occurs. Pinned toolchain: Clang 19 (`CW_CCSUFFIX='-19'`) and GCC 14 (`CW_GCCSUFFIX='-14'`).

**Discrepancy note:** The prior version of this report stated Clang/LLVM 21 was used in curl-for-win's riscv64 job, with GCC 14 as a fallback for a documented clang-rt relocation workaround, and described QEMU (`qemu-user-static`, `qemu-riscv64-static`) being used to run the cross-compiled binary for version-string extraction. Direct, freshly-cloned inspection of the workflow file this cycle shows `CW_CCSUFFIX='-19'` (Clang 19, not 21), and a full repository grep for "qemu riscv64" returns zero matches. The Clang-21/QEMU claims could not be reconfirmed this cycle and are treated as superseded by the direct file read; the specific internal mechanics of the `curl-for-win` companion repo's own build script (`_ci-linux-debian.sh`), including any clang-rt extraction workaround or `R_RISCV_PCREL_HI20` relocation issue, were not independently re-verified this cycle since that script lives in a separate repository that was not fetched. Those specific internals remain [NEEDS VERIFICATION].

### Generic cross-compilation pattern (no riscv64-specific example exists in curl's own docs)

`docs/INSTALL.md` gives no riscv64 example; the closest applicable pattern is curl's generic cross-compile guidance, adapted:
```sh
export CC=riscv64-linux-gnu-gcc
export AR=riscv64-linux-gnu-ar
export AS=riscv64-linux-gnu-as
export LD=riscv64-linux-gnu-ld
export RANLIB=riscv64-linux-gnu-ranlib
./configure --host=riscv64-linux-gnu --build=$(gcc -dumpmachine)
```

### Known build failures (historical)

- `debian:testing` `musl-dev` version skew (April 2026) broke the curl-for-win riscv64 cross-build; fixed by switching to `debian:stable` ([PR #21475](https://github.com/curl/curl/pull/21475), merged 2026-04-30).
- GCC 13+/14 false-positive `-Warray-bounds` in `lib/smb.c` and `lib/http.c`, and false-positive `-Wnull-dereference` in `lib/conncache.c`, all first surfaced specifically on riscv64 cross-compiles and fixed with compiler-diagnostic suppressions, no functional changes ([PR #16187](https://github.com/curl/curl/pull/16187), [PR #18030](https://github.com/curl/curl/pull/18030), [PR #19378](https://github.com/curl/curl/pull/19378)).
- 2026-08-30/31: the upstream FreeBSD riscv64 package repository began returning 404s, breaking the `non-native.yml` FreeBSD/riscv64 job; it was temporarily disabled ([PR #22760](https://github.com/curl/curl/pull/22760)) and re-enabled three days later once the upstream repo issue was fixed ([PR #22814](https://github.com/curl/curl/pull/22814), merged 2026-09-03, not yet in a tagged release).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All protocol handlers, authentication methods, TLS backends, compression methods, and transport layers available on amd64 and arm64 are equally available on riscv64. curl's feature set is controlled by which libraries it is compiled against, not by host architecture.

**Performance gaps:** curl itself contributes no SIMD-accelerated code paths on any architecture; performance is entirely a function of the linked TLS backend and compression libraries (Section 9). The only libcurl-internal difference is the unaligned-read shortcut in the MD4/MD5 fallback path (Section 4), which is architecturally negligible and, per the code's own comments, has no correctness or meaningful performance consequence.

**Test coverage gap:** Unlike amd64/arm64, riscv64 does not receive full-suite native test execution. It receives only a randomized 1/10 subset of the HTTP test suite on an emulated FreeBSD VM (`non-native.yml`); the Linux MUSL cross-compile job (`curl-for-win.yml`) runs no tests at all. This is a coverage gap relative to amd64/arm64, not a functional gap in curl itself.

**Security hardening gaps:** None identified in libcurl itself. The default TLS backend (OpenSSL) carries open riscv64-specific issues of its own - see Section 9.

**Floating-point / NaN semantics:** No issues found. A targeted search ("riscv nan floating repo:curl/curl") returned zero results, and libcurl has essentially no floating-point computation paths where RISC-V NaN-boxing or FP semantics would be correctness-relevant.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| HTTP/1.1, HTTP/2, HTTP/3 | Full | Full | Full |
| All TLS backends (OpenSSL, mbedTLS, wolfSSL, GnuTLS) | Full | Full | Full |
| All compression backends (zlib, zlib-ng, zstd, brotli) | Full | Full | Full |
| SSH/SFTP (libssh2) | Full | Full | Full |
| Async DNS (c-ares) | Full | Full | Full |
| LDAP, SMB, IMAP, SMTP, FTP, RTSP, and other protocols | Full | Full | Full |
| MD4/MD5 unaligned-read optimization | Present | Absent | Absent |
| SIMD in curl itself | None | None | None |
| Full native test-suite execution in CI | Yes | Yes | No (subset only, non-gating) |

---

## 7. CI/CD Infrastructure

**Main Linux CI (`linux.yml`):** Covers amd64 and arm64 with native runners and executes curl's full test suite; this is the workflow understood to gate releases. Zero riscv64 references exist in this file.

**`non-native.yml` (FreeBSD/riscv64, real but partial test execution):** Triggered on ordinary `push` (branches master, `curl-*`, `*/ci`) and `pull_request` (branches master, `curl-*`) events - not manually gated. Runs on `ubuntu-latest` (x86_64 host); the riscv64 target is a FreeBSD 15.1 guest booted via the `cross-platform-actions/action` VM action, built with CMake/clang/OpenSSL, and executing `tflags: 'HTTP --min=0 --subset=0/10 -R --seed'` - a genuine, randomized 1/10 subset of the HTTP test suite, not a build-only or skip-only entry. A full riscv64 run of the whole suite was measured at 8.5-12 minutes, which is why the maintainers moved to randomized subsetting (PR #22617) rather than running everything every time.

**`curl-for-win.yml` (Linux MUSL/riscv64, build-only):** Job `linux-musl-llvm`, name "Linux llvm MUSL (amd64, riscv64)", runs on `ubuntu-26.04-arm` (an ARM64 GitHub-hosted runner, not riscv64 hardware). Cross-compiles a static curl binary for amd64 and riscv64 together via Podman/`debian:stable`, using build scripts from the separate `curl/curl-for-win` repository. No test execution occurs in this job. Toolchain: Clang 19 / GCC 14, 10-minute timeout.

**No native riscv64 runner exists anywhere in curl's CI**, and no RISE-provided riscv64 runners are used. Where riscv64 code actually executes (the `non-native.yml` subset tests), it does so on an emulated/virtualized FreeBSD guest, not bare metal.

| CI Criterion | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI | Yes (`linux.yml`, native) | Yes (`linux.yml`, native) | Yes (`non-native.yml` emulated VM; `curl-for-win.yml` cross-compile) |
| Test suite execution | Yes, full suite, native | Yes, full suite, native | Partial: random 1/10 HTTP subset on emulated FreeBSD VM only |
| Native runner | Yes | Yes | No |
| Release-gating workflow coverage | Yes (`linux.yml`) | Yes (`linux.yml`) | No - absent from `linux.yml` entirely |
| RISE-funded runner | No | No | No |

**Assessment of CI signal quality:** The FreeBSD/riscv64 job provides a genuine, if narrow and non-gating, correctness signal via its randomized test subset. The Linux MUSL riscv64 job provides only a build/cross-compile signal (code compiles, nothing about runtime behavior). Neither job blocks a curl release, and neither appears in the workflow that does.

---

## 8. Distribution and Release Status

**Upstream GitHub Releases:** Source-only. Every asset in the most recent releases (8.22.0, Sep 2026; 8.21.0, Jun 2026; 8.20.0; 8.19.0; 8.18.0) is a source tarball or zip (`.tar.bz2`, `.tar.gz`, `.tar.xz`, `.zip`) plus `.asc` signatures - no prebuilt binaries for any architecture. This is confirmed both by direct inspection of `releases/expanded_assets/curl-8_22_0` and `curl-8_21_0`, and by curl's own download page. The absence of riscv64 assets upstream is therefore a consequence of curl shipping no binaries at all, not a riscv64-specific gap.

**Third-party riscv64 binaries listed on curl's own official download page** ([curl.se/download.html](https://curl.se/download.html)):

| Channel | riscv64 version | Notes |
|---|---|---|
| stunnel/static-curl | 8.22.0 | Static glibc/musl binaries |
| Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/)) | 8.22.0 | Confirmed live: `curl-8.22.0-1-riscv64.pkg.tar.zst`, `libcurl-compat-8.22.0-1-riscv64.pkg.tar.zst`, `libcurl-gnutls-8.22.0-1-riscv64.pkg.tar.zst` plus detached signatures in `/repo/core/`; `curl-rustls`, `python-pycurl` in `/repo/extra/`. The package-search UI on that site is broken (returns a static status page, not search results), but direct repository-directory browsing confirms current, actively-built packages. |
| Fedora rawhide ([fedora.riscv.rocks](https://fedora.riscv.rocks/)) | 8.11.1 | Lags upstream |
| Slackware / Slarm64 ([dl.slarm64.org](https://dl.slarm64.org/)) | 8.4.0 | Lags upstream significantly |

**Ubuntu 26.04 ("resolute"):** `libcurl4t64`, `libcurl4-openssl-dev`, `libcurl4-gnutls-dev`, `libcurl3t64-gnutls` are available for riscv64, confirmed via live `packages.ubuntu.com` search:
```
libcurl4t64:          8.18.0-1ubuntu2.7 [security]: amd64 arm64 i386
                       8.18.0-1ubuntu2   [ports]:    armhf ppc64el riscv64 s390x
```
riscv64 ships from the secondary `[ports]` archive, one point-revision behind the primary `[security]` pocket build that serves amd64/arm64/i386 - riscv64 is not a primary Ubuntu architecture. `libcurl-ocaml`/`libcurl-ocaml-dev` (0.9.2-3build21) and `libcurlpp-dev`/`libcurlpp0t64` (0.8.1-6build1) are also available for riscv64 via the same ports pocket.

**Debian sid:** The prior version of this report cited `libcurl4t64` at `8.21.0~rc3-1` as installed for riscv64 on Debian's buildd tracker, with `pycurl`/`trurl` autopkgtest regressions blocking migration from sid to testing. This was not independently re-queried this cycle (the `project-graph` MCP server was unreachable throughout, and no direct Debian buildd re-check was performed), so it is carried forward from the prior report as a single-sourced, potentially stale data point [NEEDS VERIFICATION].

**PyPI:** No package named `libcurl` exists (`https://pypi.org/pypi/libcurl/json` and `https://pypi.org/simple/libcurl/` both return HTTP 404, confirmed twice this cycle). The RISE wheel-builder PyPI mirror also has no `libcurl` package. Not applicable - the Python binding is the separate `pycurl` project, which does now ship riscv64 wheels via RISE-funded work (Section 1).

| Channel | riscv64 available | Version | Notes |
|---------|------------------|---------|-------|
| Upstream GitHub Releases | No | - | Source-only, no binaries for any architecture |
| Ubuntu 26.04 resolute | Yes | 8.18.0-1ubuntu2 | Ports pocket, one revision behind security pocket |
| Debian sid | Yes (per prior report, not reverified this cycle) | 8.21.0~rc3-1 | [NEEDS VERIFICATION]; RC pre-release, autopkgtest regressions reported as blocking promotion to testing |
| Arch Linux RISC-V | Yes | 8.22.0 | Current; confirmed via live repo directory listing |
| stunnel/static-curl | Yes | 8.22.0 | Static binaries, current |
| Fedora rawhide | Yes | 8.11.1 | Lagging |
| Slarm64 | Yes | 8.4.0 | Lagging significantly |
| PyPI | No | - | No package named `libcurl`; not applicable |

**To get a working riscv64 libcurl binary today:** `apt-get install libcurl4t64` on Ubuntu riscv64 (via the ports archive) or Arch Linux RISC-V (`pacman -S libcurl-compat` or `libcurl-gnutls`, current at 8.22.0) are the most current options. Debian sid availability should be reconfirmed before relying on it. For anything requiring a specific or newer version, cross-compilation from source using curl's generic cross-compile pattern (Section 5) is required, since upstream ships no riscv64 binaries of its own.

---

## 9. Dependencies

### Summary table

All direct dependencies of libcurl, as tracked by this project:

| Dependency | Relation | Criticality | Role | riscv64 status |
|---|---|---|---|---|
| OpenSSL | runtime-dependency | critical | Default TLS/crypto backend | Builds on riscv64; test coverage is flaky/partial; packaged for riscv64 (Debian sid per prior report; see deep-dive below). Primary risk surface in the whole libcurl dependency stack. |
| zlib | runtime-dependency | optional | HTTP compression (gzip/deflate) | Builds on riscv64 per prior report (Debian sid). This cycle's GitHub issue search for madler/zlib riscv64 was rate-limited (HTTP 403, twice) and not completed; no open-issue claim could be independently reconfirmed. Data not available: madler/zlib riscv64 issue search not completed this session. |
| zlib-ng | runtime-dependency | optional | High-performance zlib replacement, RVV-accelerated on hardware with the V extension | Clean. All riscv64 issues found are closed: #1670 (unaligned memory access), #1997 (Zbc extension detection, fixed), #2148 (`crc32_riscv64_zbc` undeclared, fixed in 2.3.4+), #1936 (cross-build `-static-pie` illegal instruction, fixed), #941 (riscv64 CMake support, 2021, fixed). No open riscv64 issues. |
| zstd | runtime-dependency | optional | Content-encoding (Zstandard) | Builds on riscv64. Two open, non-blocking performance/feature gaps this cycle: [#4471](https://github.com/facebook/zstd/issues/4471) (RVV support for XXH3 not yet added), [#4546](https://github.com/facebook/zstd/issues/4546) (RISC-V unaligned-access request). Closed: #4069 (weak-symbol support for RISC-V), #3134 (contrib build failure on riscv64 hardware, fixed). **Discrepancy:** the prior version of this report instead cited [#4622](https://github.com/facebook/zstd/issues/4622) (a 4-way Huffman fast-decode loop not enabled on riscv64, PR pending) as the open issue; this cycle's search did not surface #4622 and instead surfaced #4471/#4546. Both sets are plausible open zstd riscv64 issues at different points in time; neither was cross-confirmed against the other this cycle. [NEEDS VERIFICATION] |
| brotli | runtime-dependency | optional | Content-encoding (Brotli) | Clean. No riscv64-specific issues found in either research pass; builds on riscv64 (Debian sid per prior report). Generic C fallback used where no SIMD path exists. |
| nghttp2 | runtime-dependency | optional | HTTP/2 framing | Pure C, no SIMD/crypto/JIT surface. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle beyond the general absence of riscv64-specific search hits. |
| ngtcp2 | runtime-dependency | optional | HTTP/3 / QUIC | Pure C. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| nghttp3 | runtime-dependency | optional | HTTP/3 / QUIC | Pure C. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| c-ares | runtime-dependency | optional | Asynchronous DNS resolver | Pure C. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| libssh2 | runtime-dependency | optional | SSH/SFTP transport | Pure C; crypto delegated to the configured TLS backend. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| libidn2 | runtime-dependency | optional | Internationalized domain name (IDN) handling | Pure C. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| libpsl | runtime-dependency | optional | Public Suffix List handling | Pure C. Builds on riscv64 per prior report (Debian sid); not independently reverified this cycle. |
| CMake | build-dependency | critical | Primary build-system generator used by curl's own CI for riscv64 (both `non-native.yml` and implicitly `curl-for-win.yml`'s tooling) | Installs and runs successfully as `cmake-core` on the FreeBSD/riscv64 CI guest (`non-native.yml`). No dedicated riscv64 package-availability research was performed for CMake itself this cycle; availability is inferred from its successful, unblocked use in curl's own riscv64 CI job. |
| Ninja | build-dependency | critical | Build backend invoked by curl's CMake-based riscv64 CI job | Installs and runs successfully on the FreeBSD/riscv64 CI guest (`non-native.yml`). Data not available beyond its demonstrated, unblocked use in that CI job; no separate riscv64 package-availability research was performed. |
| GCC | build-dependency | critical | Compiler pinned for the Linux MUSL riscv64 cross-build (`GCC 14`, via `CW_GCCSUFFIX='-14'`) | Used successfully to cross-compile riscv64 targets in `curl-for-win.yml`. GCC 14 is also the compiler version whose false-positive `-Warray-bounds`/`-Wnull-dereference` warnings on riscv64 required suppression in curl's own source (Section 5); this reflects compiler-diagnostic noise, not a build failure. |
| LLVM | build-dependency | critical | Clang 19 (`CW_CCSUFFIX='-19'`) cross-compiles the Linux MUSL riscv64 target in `curl-for-win.yml`; unversioned clang builds the FreeBSD/riscv64 target in `non-native.yml` | Used successfully in both riscv64 CI jobs. No dedicated riscv64 package-availability research was performed for LLVM/Clang beyond its demonstrated use in curl's own CI. |
| Perl | test-dependency | critical | curl's test-suite runner (runtests.pl) and the HTTP test subset executed on riscv64 | Installs successfully as `perl5` on the FreeBSD/riscv64 CI guest (`non-native.yml`) and is what actually drives the 1/10 HTTP test subset described in Sections 3 and 7. A same-day commit in the port-history timeline (2026-08-16) also records dropping a "leftover perl5 install" step from the riscv64 job, consistent with Perl being a working, already-available dependency there. |

### Critical dependency deep-dive: OpenSSL

OpenSSL is the single largest risk surface in the libcurl riscv64 stack because it is the default TLS backend and curl delegates essentially all cryptographic correctness and performance to it.

This cycle's dependency research identified the following OpenSSL riscv64 items: open [#30880](https://github.com/openssl/openssl/issues/30880) (`test_lhash` intermittent failure on riscv64 CI), open [#28118](https://github.com/openssl/openssl/issues/28118) (RISC-V CPU-extension detection broken on musl), open [#29269](https://github.com/openssl/openssl/issues/29269) (request for more arch-specific testing), open [#29453](https://github.com/openssl/openssl/issues/29453) (request to use intrinsics instead of inline asm for RISC-V), open [#28664](https://github.com/openssl/openssl/issues/28664) (SHA-256 performance-optimization request), open [#25334](https://github.com/openssl/openssl/issues/25334) (zknd+zkne capability flags need to be required together for AES speed); closed #32229 ("some CI tests fail on the RISC-V runner," closed 2026-08-13), closed #20091 ("expand RISC-V testing"), closed #29357 (cross-compile `--no-deprecated` fix), closed #26989 (rv32 zksed SM4 provider failure).

**Discrepancy note:** The prior version of this report instead cited open issues [#31080](https://github.com/openssl/openssl/issues/31080) and [#31082](https://github.com/openssl/openssl/issues/31082) (AES and GHASH fallback paths not constant-time on riscv64 hardware lacking the Zkn/Zbc crypto extensions) as the headline security concern, alongside the same #29357 cross-compile fix cited this cycle. Neither research pass cross-confirmed the other's issue set; both are plausible at different points in OpenSSL's issue tracker. Given the materially different substance (this cycle: flaky CI plus feature/performance requests; prior report: a constant-time/side-channel concern), this should be treated as [NEEDS VERIFICATION] and reconciled directly against OpenSSL's own tracker rather than assumed resolved in either direction. Full OpenSSL-specific analysis, including this discrepancy, belongs in `project-reports/openssl.md`.

None of the OpenSSL items identified in either pass are release-blocking for libcurl itself; they represent a mix of CI flakiness, musl-specific detection bugs, and open performance/hardening requests that sit entirely outside curl's own control.

---

## 11. Known Bugs and Active Issues

**Zero open issues or pull requests in curl/curl mention riscv or riscv64**, as of 2026-09-30. GitHub's search API confirms `total_count: 0` for both `is:open is:issue riscv repo:curl/curl` and the `riscv64` variant. A broader semantic search for "riscv64" across issues returns six results, all confirmed false positives on manual read (an ARM64 build report, a C64/cc65 joke issue, a 32-bit ARM test failure, an x86/x64 link error, a 32-bit compile issue, and a Solaris/SPARC build error - none mention RISC-V in their body).

All historical riscv64-touching items are merged pull requests, all authored by vszakats, all landed without contention:

| PR | Title | Status | Merged | Type |
|----|-------|--------|--------|------|
| [#22814](https://github.com/curl/curl/pull/22814) | GHA/non-native: re-enable FreeBSD riscv64 | Merged | 2026-09-03 | CI infrastructure; not yet in a tagged release |
| [#22760](https://github.com/curl/curl/pull/22760) | GHA/non-native: disable riscv64 FreeBSD job due to upstream issue | Merged | 2026-08-31 | CI infrastructure |
| [#22748](https://github.com/curl/curl/pull/22748) | GHA/non-native: bump cross-platform-actions to 1.5.0 | Merged | 2026-08-30 | CI infrastructure |
| [#22617](https://github.com/curl/curl/pull/22617) | GHA: use `--subset` runtests option, run random subset in riscv64 job | Merged | 2026-08-18 | CI infrastructure |
| [#22602](https://github.com/curl/curl/pull/22602) | GHA/non-native: sync BSD tflags logic with other workflows | Merged | 2026-08-16 | CI infrastructure |
| [#22601](https://github.com/curl/curl/pull/22601) | GHA/non-native: BSD build improvements | Merged | 2026-08-16 | CI infrastructure |
| [#22590](https://github.com/curl/curl/pull/22590) | GHA/non-native: bump cross-build-actions, NetBSD 11.0, FreeBSD riscv64 | Merged | 2026-08-15 | CI infrastructure |
| [#21475](https://github.com/curl/curl/pull/21475) | GHA/curl-for-win: switch riscv job to debian:stable (testing broke) | Merged | 2026-04-30 | CI infrastructure / build failure fix |
| [#19378](https://github.com/curl/curl/pull/19378) | conncache: silence `-Wnull-dereference` on gcc 14 RISC-V 64 | Merged | 2025-11-05/06 | Compiler false-positive suppression |
| [#18030](https://github.com/curl/curl/pull/18030) | http: silence `-Warray-bounds` with gcc 13+ | Merged | 2025-07-25/26 | Compiler false-positive suppression |
| [#16187](https://github.com/curl/curl/pull/16187) | smb: silence `-Warray-bounds` with gcc 13+ | Merged | 2025-02-05 | Compiler false-positive suppression |

**Correctness bugs:** None. The three compiler-warning PRs (#19378, #18030, #16187) are all GCC 13/14 false positives triggered by legitimate over-allocation and flexible-array patterns, first surfaced on riscv64 builds but not riscv64-specific logic bugs; all were fixed by warning suppression with no functional code change. No runtime correctness issue on riscv64 has ever been reported against curl/curl.

---

## 12. Objections and Upstream Blockers

**No technical objections or upstream blockers exist for libcurl itself on riscv64.** Every riscv64-related contribution identified (11 merged PRs, one original 2022 atomics fix) was accepted without recorded objection or dispute. The BDFL governance model means a single maintainer can approve changes without committee overhead, and in practice nearly all riscv64 maintenance has been carried by one contributor (vszakats) acting unilaterally on CI infrastructure.

**Organizational blockers:** None identified. wolfSSL (Daniel Stenberg's employer) has its own RISC-V interests that do not conflict with continued riscv64 support in curl.

**Structural gap:** riscv64 is absent from `linux.yml`, the release-gating, full-native-test-suite workflow. No open issue or PR proposes adding it there. This is not a blocker in the sense of a rejected request - no such request has been made - but it is the structural reason riscv64 sits below amd64/arm64 in test rigor.

**Dependency-chain risk:** OpenSSL's open riscv64 issues (Section 9) represent the primary risk surface outside curl's direct control. These affect libcurl's correctness and security posture on RISC-V hardware but cannot be resolved by curl maintainers.

**RISE involvement:** No RISE working group tracks libcurl, and no RISE blog post or funded engineering effort targets curl/libcurl directly. The one adjacent RISE item (python-wheels PR #940) funds riscv64 wheel builds for the separate pycurl bindings project, not curl/libcurl itself.

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- **Justification:** libcurl ships compiled C, so the architecture-independence shortcut does not apply, and the CI-table decision rule governs. Upstream CI does build riscv64 via two GitHub Actions jobs: [`non-native.yml`](https://github.com/curl/curl/blob/master/.github/workflows/non-native.yml), which builds FreeBSD/riscv64 via a `cross-platform-actions` VM and runs only a random subset of the HTTP test suite, and [`curl-for-win.yml`](https://github.com/curl/curl/blob/master/.github/workflows/curl-for-win.yml), which cross-compiles Linux/MUSL riscv64 with no test execution at all. The main [`linux.yml`](https://github.com/curl/curl/blob/master/.github/workflows/linux.yml) workflow, which runs curl's full native test suite and gates releases, does not include riscv64 at all, and upstream GitHub Releases ship source-only archives with no riscv64 (or any architecture-specific) binaries. This matches the yellow classification exactly: "yes (build step, no tests)" for CI build, "no" for a full-test-suite pass, and "no" release artifact from upstream. The consumable riscv64 libcurl package comes from Ubuntu (ports), Debian (sid/testing), and Alpine, not from curl upstream, which is why the release provider is the distro channel rather than upstream; this does not itself change the color, since yellow was already reached via the CI table. libcurl is not an optimization-purpose project - its value proposition is broad protocol portability, not raw speed, and all performance-sensitive work is delegated to its TLS/compression backends, which are graded separately - so the optimization modifier does not apply.
- **Pending work that could change the grade:** [PR #22814](https://github.com/curl/curl/pull/22814) (merged 2026-09-03) re-enabled the FreeBSD riscv64 CI job after an upstream outage but has not shipped in a tagged release yet (next release expected around 2026-10-14) - worth a follow-up check once that release lands, though it would not change the grade since it is the same subset-test, non-release-blocking job. No open PR or issue proposes adding riscv64 to the main `linux.yml` full-test-suite workflow. No RISE funding or involvement touches curl/libcurl itself; the one adjacent RISE item, python-wheels PR #940, funds riscv64 wheels for the separate pycurl bindings project, not curl/libcurl.

---

## 14. Investment Analysis

RISE has no existing investment in curl/libcurl itself. The project is low-risk for further RISC-V enablement: the library is fully functional on riscv64, builds cleanly across the CI it does have, and has a cooperative, responsive maintainer path. Investment options are narrow and targeted.

### 14.1 Functional Enablement

No functional gaps exist in libcurl on riscv64 (Sections 4 and 6). No investment required.

### 14.2 Performance Optimization

libcurl delegates all performance-sensitive operations to its dependencies (TLS backend, compression libraries); it has no SIMD or assembly code paths of its own to optimize. Performance investment should target OpenSSL (crypto intrinsics/assembly, per the open requests in Section 9), zstd (RVV support for XXH3, per #4471), and zlib-ng (RVV-accelerated inflate, already largely closed out). These belong in their own dependency-specific reports, not in libcurl investment.

### 14.3 CI/CD Infrastructure

The primary structural gap is the absence of riscv64 from `linux.yml`, curl's release-gating full-test-suite workflow. Adding riscv64 there (whether via a native runner or QEMU/VM-based emulation modeled on the existing `non-native.yml` pattern) would close the gap between riscv64's current partial-subset coverage and the full-suite coverage amd64/arm64 receive. This is a modest, well-scoped engineering task given the maintainers' demonstrated willingness to accept riscv64 CI patches (11 of 11 merged without contention) and the existing `non-native.yml` job as a working template to extend or promote. A native riscv64 runner, if pursued instead of further emulation, is an infrastructure-provisioning task rather than an engineering one.

### 14.4 Ecosystem Enablement

Not applicable. libcurl has no dependent package ecosystem of its own requiring separate riscv64 enablement; it is a consumed library, not an ecosystem root (Section 10 is omitted from this report for that reason).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 to `linux.yml` (full native test suite, release-gating), building on the existing `non-native.yml` pattern | 2-3 | Contributor to curl/curl | Medium |
| CI/CD | Provision native riscv64 hardware runner for curl CI (if emulation is judged insufficient) | Infrastructure task, not engineering | RISE or hardware partner | Low |
| Dependencies | Reconcile the OpenSSL riscv64 issue discrepancy noted in Section 9 (#30880/#28118/#29453/#28664/#25334/#29269 vs. prior #31080/#31082) and track resolution | See `project-reports/openssl.md` | OpenSSL contributor | High (dependency risk, not libcurl-owned) |
| Dependencies | zstd RVV support for XXH3 (#4471) and unaligned-access handling (#4546) | See `project-reports/zstd.md` | zstd contributor | Medium (performance) |
| Functional | None | N/A | N/A | N/A |

---

## 15. References

- [curl/curl repository](https://github.com/curl/curl)
- [libcurl homepage](https://curl.se/libcurl/)
- [curl governance](https://curl.se/docs/governance.html)
- [curl sponsors](https://curl.se/sponsors.html)
- [curl companies using curl](https://curl.se/docs/companies.html)
- [curl download page (third-party riscv64 binaries)](https://curl.se/download.html)
- [curl issue #9055: riscv64 build fails, undefined __atomic_exchange_1](https://github.com/curl/curl/issues/9055)
- [curl commit 50efb08: easy_lock atomic_int switch (2022-06-28)](https://github.com/curl/curl/commit/50efb0822aa0e0ab165158dd0a26e65a2290e6d2)
- [curl commit 04e3621: first RISC-V 64 build in curl's CI (2024-08-30)](https://github.com/curl/curl/commit/04e3621dce409f1c4a6055cde54cf030a22199e7)
- [curl PR #16187: smb.c -Warray-bounds suppression](https://github.com/curl/curl/pull/16187)
- [curl commit 14f26f5](https://github.com/curl/curl/commit/14f26f5ee78204c15bf906f3cf7480308e2feb28)
- [curl PR #18030: http.c -Warray-bounds suppression](https://github.com/curl/curl/pull/18030)
- [curl commit 054f69f](https://github.com/curl/curl/commit/054f69ffb79fc916a3f0a278eb8e45b407f815b2)
- [curl PR #19378: conncache.c -Wnull-dereference suppression](https://github.com/curl/curl/pull/19378)
- [curl commit ede6a8e](https://github.com/curl/curl/commit/ede6a8e08762321d95864ad384b8ff5ac44ac459)
- [curl PR #21475: switch riscv job to debian:stable](https://github.com/curl/curl/pull/21475)
- [curl commit ceaa5df](https://github.com/curl/curl/commit/ceaa5dfba001223132ed2e125cf7bb688e07cda2)
- [curl PR #22590: bump cross-build-actions, FreeBSD riscv64](https://github.com/curl/curl/pull/22590)
- [curl commit 91323de](https://github.com/curl/curl/commit/91323de7f3ddfad2fb6860a695ffa805e9389afe)
- [curl PR #22601: GHA/non-native BSD build improvements](https://github.com/curl/curl/pull/22601)
- [curl commit bf59422](https://github.com/curl/curl/commit/bf594226d66dc2bbf62a18f3dea1ceabe5b26dcf)
- [curl PR #22602: sync BSD tflags logic](https://github.com/curl/curl/pull/22602)
- [curl commit d000006](https://github.com/curl/curl/commit/d00000673d05fdf6ceee8941ccd63ad2906257e4)
- [curl PR #22617: --subset runtests on riscv64 job](https://github.com/curl/curl/pull/22617)
- [curl commit 79132a1](https://github.com/curl/curl/commit/79132a1daf8f3b2b6db101be386fa9e8cb3f73f5)
- [curl PR #22748: bump cross-platform-actions to 1.5.0](https://github.com/curl/curl/pull/22748)
- [curl PR #22760: disable riscv64 FreeBSD job due to upstream issue](https://github.com/curl/curl/pull/22760)
- [curl commit 73f1836](https://github.com/curl/curl/commit/73f18365ab8e47912afcd5ee9404c7493d9d0fb2)
- [curl PR #22814: re-enable FreeBSD riscv64](https://github.com/curl/curl/pull/22814)
- [curl commit 0f2e0af](https://github.com/curl/curl/commit/0f2e0af0da0dd31652cd73a7d5a52c0246416eec)
- [curl .github/workflows/non-native.yml](https://github.com/curl/curl/blob/master/.github/workflows/non-native.yml)
- [curl .github/workflows/curl-for-win.yml](https://github.com/curl/curl/blob/master/.github/workflows/curl-for-win.yml)
- [curl .github/workflows/linux.yml](https://github.com/curl/curl/blob/master/.github/workflows/linux.yml)
- [curl docs/INSTALL.md](https://github.com/curl/curl/blob/master/docs/INSTALL.md)
- [Ubuntu resolute package search: libcurl](https://packages.ubuntu.com/search?keywords=libcurl&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V repo, core](https://archriscv.felixc.at/repo/core/)
- [Arch Linux RISC-V repo, extra](https://archriscv.felixc.at/repo/extra/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE python-wheels PR #940: pycurl riscv64 wheels](https://github.com/riseproject-dev/python-wheels/pull/940)
- [OpenSSL issue #30880: test_lhash intermittent failure on riscv64](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL issue #28118: RISC-V extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #29269: request for more arch-specific testing](https://github.com/openssl/openssl/issues/29269)
- [OpenSSL issue #29453: use intrinsics instead of inline asm for RISC-V](https://github.com/openssl/openssl/issues/29453)
- [OpenSSL issue #28664: SHA-256 performance optimization request](https://github.com/openssl/openssl/issues/28664)
- [OpenSSL issue #25334: zknd+zkne capability flags needed together for AES speed](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #31080: AES fallback not constant-time on riscv64 (prior-report citation, not reconfirmed this cycle)](https://github.com/openssl/openssl/issues/31080)
- [OpenSSL issue #31082: GHASH fallback not constant-time on riscv64 (prior-report citation, not reconfirmed this cycle)](https://github.com/openssl/openssl/issues/31082)
- [zstd issue #4471: RVV support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [zstd issue #4546: RISC-V unaligned access request](https://github.com/facebook/zstd/issues/4546)
- [zstd issue #4622: HUF_4X2_4WAY fast decode loop not enabled on riscv64 (prior-report citation, not reconfirmed this cycle)](https://github.com/facebook/zstd/issues/4622)
- [zlib-ng issue #2148: crc32_riscv64_zbc undeclared](https://github.com/zlib-ng/zlib-ng/issues/2148)