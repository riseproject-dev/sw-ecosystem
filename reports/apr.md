---
title: APR
categories:
  - libraries
---

# APR
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for APR<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Apache Portable Runtime (APR)](https://apr.apache.org/) is a C library that provides a portable, platform-independent API for OS abstractions: threads, mutexes, atomic operations, memory pools, file I/O, network sockets, dynamic shared objects, and character encoding conversion. It is the foundation layer for Apache httpd and Apache Subversion. It is not a JIT, a runtime, or a language interpreter.

**Governance:** APR is a top-level subproject of the [Apache Software Foundation (ASF)](https://www.apache.org/) with its own Project Management Committee (PMC). License: Apache-2.0. The commit model is "Commit Then Review" (CTR): patches are committed first, then reviewed; problematic commits can be reverted. Voting uses +1/+0/-0/-1; vetoes require written justification. There is no documented formal tier policy for new platform ports; new architectures are accepted implicitly when community members submit patches that pass review.

**Committer base (as of trunk commit history and CHANGES file):**
- Graham Leggett -- most prolific recent contributor; no confirmed corporate affiliation.
- Yann Ylavic -- OpenSSL 3 compatibility, atomic API fixes; no confirmed corporate affiliation.
- Ivan Zhakov -- dominant committer as of May 2026, Windows work; no confirmed corporate affiliation.
- Branko Cibej ("brainy") -- build system and test fixes; affiliated with Digiverse, a Slovenian independent consultancy.
- Daniel Sahlberg -- STATUS file maintenance; no confirmed corporate affiliation.
- Additional named in CHANGES: Joe Orton, Ruediger Pluem, Jim Jagielski, Eric Covener, Lubos Uhliarik, Evgeny Kotkov, Sebastian Kemper, Nick Kew, Mladen Turk.

No committers are publicly affiliated with RISC-V ecosystem companies (Red Hat, NVIDIA, SiFive, Canonical, Qualcomm, Andes, etc.). Development is sustained by individual volunteers and independent consultants.

**RISE Project membership:** APR is not a member of the RISE Project. RISE premier members as of June 2026 include Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent. General members include Canonical, ByteDance, BOSC, SpacemiT, ZTE, and others. APR is absent from both tiers.

**Community culture on new ports:** The trajectory of removing legacy platforms (BeOS and Netware removed in May 2026) while maintaining broad POSIX support indicates the maintainers accept new POSIX-compliant architectures without special process, as long as patches are well-formed. The community is small, volunteer-driven, and has no stated corporate interest in RISC-V.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Never | No RISC-V-specific commit exists in the repository history | [GitHub commit search: riscv repo:apache/apr -- 0 results](https://github.com/apache/apr/commits/trunk) |
| Never | No riscv64 issue filed in GitHub Issues | [apache/apr issues](https://github.com/apache/apr/issues) |
| Never | No riscv64 issue filed in Apache JIRA | [Apache APR JIRA](https://issues.apache.org/jira/browse/APR) |
| Never | No riscv64 PR filed | [apache/apr pull requests](https://github.com/apache/apr/pulls) |
| Implicit | RISC-V handled silently by generic GCC `__sync_*`/`__atomic_*` builtins path since GCC gained riscv64 support | [atomic/unix/builtins.c](https://github.com/apache/apr/tree/trunk/atomic/unix) |

There is no dedicated RISC-V port. There are no key contributors for any RISC-V work. There is no tracking issue for a formal port. RISC-V support is entirely implicit -- the generic fallback code path produces a functioning build on any POSIX architecture where GCC provides `__atomic_*` intrinsics.

---

## 3. Upstream Support Tier

APR has no published architecture support tier policy. The de facto tier is determined by what receives CI coverage and dedicated code. By that metric:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated atomic implementation | Yes (`atomic/unix/ia32.c`, hand-tuned inline asm) | No (uses builtins.c) | No (uses builtins.c) |
| Dedicated arch header directory (`include/arch/`) | No (via `unix/`) | No (via `unix/`) | No (no `riscv/` subdir; only aix, os2, os390, unix, win32 exist) |
| CI runner | Yes (`ubuntu-latest`) | Yes (`ubuntu-22.04-arm`, native) | No |
| CI test coverage | Full | Limited (one default config) | None |
| Official upstream binary | No (ASF distributes source tarballs only) | No | No |
| Downstream distro binary | Debian, Ubuntu (primary) | Debian, Ubuntu (primary) | Debian sid (debports), Ubuntu Noble |
| `--enable-nonportable-atomics` effect | Yes (enables hand-tuned asm) | None | None |

amd64 has hand-tuned atomic assembly; arm64 and riscv64 both rely on the GCC builtins path. arm64 has a native CI runner; riscv64 has none. From upstream's perspective, riscv64 is an untested architecture that happens to build and function correctly via the generic fallback path.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

APR has no JIT, no GC, and no SIMD dispatch. The only architecture-specific subsystem is **atomic operations** in `atomic/unix/`.

**Atomic backend selection** is controlled by `include/arch/unix/apr_arch_atomic.h`. The dispatch chain:

1. If `HAVE_ATOMIC_BUILTINS` (compiler probe at configure time) -- use `atomic/unix/builtins.c` (`USE_ATOMICS_BUILTINS`).
2. Else if `__i386__` or `__x86_64__` -- `USE_ATOMICS_IA32` (hand-tuned inline asm in `ia32.c`).
3. Else if `__powerpc__`/`__PPC__`/`__ppc__` -- `USE_ATOMICS_PPC` (`ppc.c`, 242 lines, `lwarx/stwcx` inline asm).
4. Else if `__s390__`/`__s390x__` -- `USE_ATOMICS_S390` (`s390.c`).
5. Else -- `USE_ATOMICS_GENERIC` (mutex-based fallback).

riscv64 falls into case 1 with any modern GCC (12+ as shipped in Debian Bookworm / Ubuntu 24.04). This means `atomic/unix/builtins.c` is compiled, which uses `__atomic_*` or `__sync_*` GCC built-in intrinsics.

**Memory ordering:** `builtins.c` defines `WEAK_MEMORY_ORDERING` as 0 (strong) only for `__i386__`, `__x86_64__`, `__s390__`, `__s390x__`. riscv64 is absent from this list and therefore gets `WEAK_MEMORY_ORDERING 1`. This is the correct setting for RISC-V's weak memory model. It causes:
- Atomic load operations to use `__sync_fetch_and_add(mem, 0)` (with a full barrier) rather than a plain dereference.
- Store and exchange operations to use `__sync_synchronize()` barriers before the operation.

This is functionally correct. It imposes a small but real performance overhead compared to a hand-tuned implementation that could use `fence.r.r` or `fence.w.w` for lighter barriers where TSO-equivalent ordering is not required.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Atomic ops (32-bit) | Hand-tuned inline asm (`ia32.c`, `cmpxchg` etc.) | Scalar GCC builtins (`builtins.c`) | Scalar GCC builtins (`builtins.c`) |
| Atomic ops (64-bit) | Scalar GCC builtins (`builtins64.c`) | Scalar GCC builtins (`builtins64.c`) | Scalar GCC builtins (`builtins64.c`) |
| Memory ordering model | Strong (`WEAK_MEMORY_ORDERING 0`) | Weak (`WEAK_MEMORY_ORDERING 1`) | Weak (`WEAK_MEMORY_ORDERING 1`) |
| SIMD | None | None | None |
| JIT | None | None | None |
| Crypto | None (delegated to OpenSSL/NSS via apr-util) | None | None |
| DSO (`dlopen`) | glibc standard | glibc standard | glibc standard |
| Large file support | 64-bit native | 64-bit native | 64-bit native |
| ISA extensions used | None | None | None |

**No `__riscv`, `riscv64`, or `rvv` reference exists anywhere in the APR codebase.** A GitHub code search returns 0 results. There is no `include/arch/riscv/` directory and no `atomic/unix/riscv.c` or `riscv.S` file.

---

## 5. Build System, Cross-Compilation, and Toolchain

APR supports two build systems: autotools (primary, required for Linux/Unix) and CMake (Windows-only, as explicitly stated in `README.cmake`). There are no riscv64-specific Dockerfiles or CMake toolchain files in the repository.

**Native build on riscv64 (Debian/Ubuntu):**

```sh
./buildconf
./configure --prefix=/usr/local
make -j$(nproc)
make install
```

No special flags are needed. GCC 12+ on riscv64 provides `__atomic_*` builtins; `configure` detects them automatically and selects `USE_ATOMICS_BUILTINS`.

**Cross-compilation from x86_64 to riscv64:**

```sh
sudo apt-get install gcc-riscv64-linux-gnu

./buildconf

./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --prefix=/opt/apr-riscv64 \
  CC=riscv64-linux-gnu-gcc \
  AR=riscv64-linux-gnu-ar \
  RANLIB=riscv64-linux-gnu-ranlib \
  ac_cv_mmap__dev_zero=yes \
  ap_cv__atomic_builtins=yes \
  ap_cv__atomic_builtins64=yes \
  apr_cv_strerror_r_rc=0 \
  ac_cv_func_fdatasync=yes
```

**Why each override is required:**

- `ac_cv_mmap__dev_zero=yes`: `configure.in` uses `AC_TRY_RUN` (not `AC_TRY_COMPILE`) to test whether `mmap /dev/zero` works. Under cross-compilation this runtime test cannot execute and defaults to `no`. On Linux riscv64 the answer is `yes`.
- `ap_cv__atomic_builtins=yes` / `ap_cv__atomic_builtins64=yes`: The GCC atomic builtin probe uses `AC_TRY_RUN`. Under cross-compilation it defaults to `no`, causing `configure` to fall back to `USE_ATOMICS_GENERIC` (mutex-based) even though the cross-compiled binary would have working `__atomic_*` intrinsics. Setting these to `yes` forces the correct, faster path.
- `apr_cv_strerror_r_rc=0`: Tests whether `strerror_r` returns `int` (POSIX) or `char*` (GNU). On glibc/Linux riscv64 the POSIX form returns `int` (0 = success). Cannot be probed at cross-compile time.
- `ac_cv_func_fdatasync=yes`: `fdatasync` exists in glibc on Linux riscv64; the cross-compile probe defaults to `no`.

**Minimum toolchain versions:**
- GCC 7+: First version with stable riscv64-linux-gnu target in mainline GCC. Required to produce a working binary.
- GCC 4.9+: Required for `__atomic_*` built-ins. Without this, `configure` selects `USE_ATOMICS_GENERIC`.
- Clang 7+: Has riscv64 backend. No minimum is enforced in `configure.in`. [NEEDS VERIFICATION] -- the exact Clang version at which `ap_cv__atomic_builtins` passes on riscv64 has not been tested.

**QEMU usage:** No QEMU usage is referenced anywhere in the APR repository. The upstream CI does not use QEMU for any architecture.

**`--enable-nonportable-atomics`:** On riscv64 this flag is a no-op. The `configure.in` `case $host_cpu` block enumerates only `i[34]86` and `i[56]86` for the nonportable-atomics path; all other architectures fall through the `*)` wildcard without effect.

**Known build failures on riscv64:** None filed in GitHub Issues or Apache JIRA. Debian sid builds and installs cleanly on native RISC-V hardware (see Section 8).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Core portability APIs (files, sockets, threads, pools) | Full | Full | Full (implicit POSIX) | None |
| 32-bit atomic operations | Full (hand-tuned asm) | Full (builtins) | Full (builtins) | Performance only: no hand-tuned LR/SC or Zacas sequences |
| 64-bit atomic operations | Full (builtins) | Full (builtins) | Full (builtins) | None |
| Memory ordering overhead | Minimal (strong model assumed) | Standard weak barriers | Standard weak barriers | No difference vs arm64; small overhead vs amd64 |
| `--enable-nonportable-atomics` speedup | Yes | No | No | Same as arm64 |
| Cross-compile `configure` automation | Full (all probes pass natively) | Full | Requires manual cache overrides (see Section 5) | Developer experience gap |
| Upstream CI validation | Full | Partial (one config) | None | Correctness regressions would not be caught upstream |
| Large files (`apr_off_t` 64-bit) | Yes | Yes | Yes (64-bit arch) | None |
| Crypto (apr-util, delegated to OpenSSL) | Full | Full | Functional with caveats (see Section 9) | OpenSSL riscv64-specific bugs; not in APR itself |
| SIMD | N/A | N/A | N/A | None (APR has no SIMD) |
| Floating-point semantics | N/A | N/A | N/A | None (APR has no floating-point paths) |
| Security hardening (ASLR, stack canaries) | Compiler/OS | Compiler/OS | Compiler/OS | None -- no APR-specific hardening code |

There are no functional gaps between riscv64 and arm64 in APR. All APIs work. The gaps are:
1. **Performance:** 32-bit atomics use the `builtins.c` generic path rather than a hand-tuned LR/SC or Zacas implementation. Overhead is minor in absolute terms; APR atomics are not on any hot path in production httpd deployments.
2. **Developer experience:** Cross-compilation requires four manual `configure` cache overrides that amd64 and arm64 do not require when building natively.
3. **Upstream CI:** No riscv64 CI exists, so upstream has no regression detection for RISC-V.

Data not available: Quantitative performance comparison between riscv64 and arm64 for APR atomic operations. No benchmarks have been published for this library on RISC-V.

---

## 7. CI/CD Infrastructure

APR has four GitHub Actions workflow files in `.github/workflows/`: `linux.yml`, `macos.yml`, `windows.yml`, `windows-vcpkg.yml`. The word "riscv" does not appear in any of them.

| Workflow | Architectures tested |
|---|---|
| linux.yml | `ubuntu-latest` (x86_64), `ubuntu-22.04-arm` (arm64 native) |
| macos.yml | `macos-latest` (aarch64/x86_64) |
| windows.yml | `x64-windows`, `x86-windows`, `arm64` (via `windows-11-arm`) |
| windows-vcpkg.yml | `x64-windows`, `x86-windows` |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (`ubuntu-latest`) | Yes (`ubuntu-22.04-arm`) | No |
| QEMU emulated | No | No | No |
| Cross-compile CI | No | No | No |
| Build variants tested | Multiple (ASan, UBSan, shmem, crypto, LMDB, BerkeleyDB) | One (default) | None |
| RISE runner | No | No | No |
| Test suite executed in CI | Yes | Yes | No |

No RISE-provided riscv64 runners are used by APR. The RISE Project has no involvement with APR CI.

---

## 8. Distribution and Release Status

APR does not ship binary releases via GitHub. The ASF distributes source tarballs via [downloads.apache.org](https://downloads.apache.org/apr/). All binary packages for riscv64 are built and maintained exclusively by downstream Linux distributions.

| Channel | riscv64 Available | Version | Notes |
|---|---|---|---|
| GitHub Releases | No | N/A | No releases on GitHub at all |
| ASF official binaries | No | N/A | Source tarballs only |
| PyPI | No | N/A | APR is a C library; no PyPI package exists (HTTP 404) |
| RISE wheel builder | No | N/A | APR is not listed |
| Debian stable (bookworm) | No | N/A | riscv64 not in the stable set |
| Debian sid (unstable) | Yes | 1.7.6-3+b1 | Status: Installed; built on rv-osuosl-02 (native RISC-V hardware at OSUOSL) |
| Debian trixie | Yes | 1.7.5-1 | Status: Installed across all architectures |
| Ubuntu 24.04 Noble | Yes | 1.7.2-3.1build2 | `libapr1t64`, `libapr1-dev`, `libaprutil1t64`, `libaprutil1-dev` all riscv64-present |
| Ubuntu Noble (Rust binding) | Yes (amd64 + riscv64 only) | `librust-apr-dev` 0.1.9-1 | Available only on amd64 and riscv64 [NEEDS VERIFICATION -- unusual platform subset] |
| Arch Linux riscv64 | Unconfirmed | N/A | archriscv.felixc.at returned no usable search results; no patch record found in archriscv-packages repo; Arch official lists x86_64 only |
| Fedora riscv64 | Data not available | N/A | Not checked |

**What a user must do to get a working binary:**

- On Debian sid or Ubuntu Noble: `apt install libapr1-dev libaprutil1-dev` -- riscv64 packages are present in the standard repositories.
- On other distributions or for production use: build from ASF source tarballs using the commands in Section 5.

The Debian rv-osuosl-02 build confirms the full toolchain works on native RISC-V hardware with no patches to the upstream source.

---

## 9. Dependencies

APR-util (the companion library providing database, XML, LDAP, and crypto APIs) pulls in the dependencies below. APR core itself depends only on the C runtime, pthreads, and `libdl`.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL | Crypto backend for apr-util (`APU_HAVE_CRYPTO`); AES, SHA, PRNG, random entropy | Builds; dedicated `linux64-riscv64` target in `Configurations/10-main.conf` | Self-hosted CI runner (`linux-riscv64`), gated to upstream repo only; intermittent failures reported | `libssl-dev` 3.6.3-1 in Debian sid/riscv64 | 6+ open riscv64-specific issues (see below); none block the default non-vectorized build |
| expat | XML parsing backend for apr-util; default on non-Windows | Builds; pure C, no SIMD | No riscv64 CI in libexpat's own workflow (x86_64 and MinGW only) | `libexpat1-dev` 2.8.1-1 in Debian sid/riscv64 | None |
| libxml2 | Alternative XML backend for apr-util (`APR_XML_BACKEND=libxml2`) | Builds; pure C | No riscv64-specific CI observed | Available in Debian sid/riscv64 | None known |
| SQLite3 | DBD backend for apr-util's `apr_dbd` | Builds; pure C, no SIMD | No dedicated riscv64 CI in SQLite's own test suite | `libsqlite3-dev` 3.53.2-1 in Debian sid/riscv64 | None |
| PostgreSQL (libpq) | DBD backend for apr-util's `apr_dbd` | Builds; no arch-specific code in libpq client | No riscv64 CI observed in postgres/postgres GitHub repo; PostgreSQL buildfarm riscv64 coverage unknown | `libpq-dev` 18.4-1 in Debian sid/riscv64 | None |
| iconv (glibc) | Character encoding conversion; optional (`APU_HAVE_ICONV`) | Provided by glibc; riscv64 glibc port is mature | Covered by glibc's own riscv64 CI | `libc6-dev` in Debian sid/riscv64 | None |
| Cyrus SASL | Optional SASL authentication | Builds; pure C | No riscv64-specific CI observed | `libsasl2-dev` in Debian sid/riscv64 | None |
| OpenLDAP (libldap) | Optional LDAP support (`APR_HAS_LDAP`) | Builds; pure C | No riscv64-specific CI observed | `libldap-dev` in Debian sid/riscv64 | None |
| libuuid (util-linux) | UUID generation; optional | Standard; works on riscv64 | Standard glibc coverage | Part of `util-linux`; in Debian sid/riscv64 | None |
| APR internal atomics | Lock-free atomics; no external dep | No riscv64-specific file; GCC builtins path used | Covered by APR's own test suite when run on riscv64 natively | Part of `libapr1-dev` 1.7.6-3+b1 in Debian sid | None |

**OpenSSL riscv64 issues (the only dependency with tracked riscv64 bugs):**

| Issue | Title | Status |
|---|---|---|
| #30763 | Cross-compile with `no-deprecated` fails | Unmerged fix as of 2026-06-18; needs second reviewer |
| #30330 | Backwards null-key check in `rv64i_zkne` | Open |
| #25334 | Zknd and Zkne extensions must coexist | Open |
| #23011 | Unknown CSR `vlenb` | Open |
| #30880 | `test_lhash` intermittent flap in riscv64 CI | Open |
| #28550 | Deadlock in CI | Open |

None of these block a default APR build against OpenSSL on riscv64 unless the builder passes `no-deprecated` to the OpenSSL `./Configure` step. The constant-time AES/GHASH fallback issues are security-relevant in OpenSSL itself but do not affect APR's use of the OpenSSL API.

All other dependencies are pure-C libraries with no SIMD or JIT paths. The full APR + apr-util dependency chain resolves on Debian sid riscv64 as confirmed by the `libaprutil1t64` and all `libaprutil1-dbd-*` packages being present.

---

## 10. (Section omitted -- APR is a C system library with no dependent package ecosystem requiring riscv64 enablement.)

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs are filed for APR itself in any tracker searched.

| Source | Query | Results |
|---|---|---|
| GitHub apache/apr issues | "riscv" | 0 |
| GitHub apache/apr issues | "riscv64" | 0 |
| Apache JIRA (APR project) | riscv | 0 |
| Debian bug tracker (libapr1t64) | All open | 0 ("No reports found") |
| GitHub apache/apr PRs | "riscv", "riscv64" | 0 |

There are no correctness bugs, no performance bugs, and no open work items for riscv64 in APR upstream. The only live riscv64 bugs in the dependency tree are in OpenSSL (documented in Section 9).

**Architectural note:** The `WEAK_MEMORY_ORDERING 1` path in `builtins.c` applies `__sync_synchronize()` before atomic stores and exchange operations on riscv64. This is conservative (functionally safe) but not tuned. A hand-written implementation could use finer-grained RISC-V fence variants (`fence.r.rw`, `fence.rw.w`) where full sequential consistency is not required. No bug has been filed for this; it is a performance gap, not a correctness bug.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has expressed any objection to riscv64 support. No mailing list discussion on the topic was found. The absence of any tracking issue means the topic has never been raised.

**Technical blockers:** None. APR builds and runs correctly on riscv64 today via the generic GCC builtins path. The Debian native build on rv-osuosl-02 is the existence proof.

**Organizational blockers:** None structural. The CTR commit model means a well-formed patch for a riscv64 atomic backend or CI addition would land without a pre-approval vote. The community is small, so reviewer bandwidth is limited; patches would need to be high quality on first submission.

**Cross-compilation configure overrides:** These are a developer-experience issue, not a blocker. The four required overrides are documented above. They could be eliminated by replacing `AC_TRY_RUN` probes with `AC_TRY_COMPILE` probes for the affected checks, which would be a clean upstream contribution.

**Acceptance probability:** High. APR explicitly uses a generic builtins fallback path for new architectures by design. A PR adding riscv64 to the CI matrix (QEMU or RISE runner) would have no technical objections; reviewer availability is the only risk.

---

## 13. Investment Analysis

RISE has no funded work on APR. The entire riscv64 functional baseline comes from the generic GCC builtins path and downstream Debian packaging -- neither required upstream effort.

### 13.1 Functional Enablement

APR is already functionally complete on riscv64. No functional gaps exist. No work is required to make APR run correctly on riscv64.

### 13.2 Performance Optimization

A dedicated `atomic/unix/riscv.c` (or `riscv64.c`) using hand-tuned LR/SC sequences from the A extension, or CAS instructions from Zacas, could reduce atomic operation overhead. The existing `ppc.c` (242 lines) is a suitable template. Practical impact on APR-using applications (httpd, Subversion) is expected to be low because APR atomic operations are not on hot paths in those applications. Data not available: measured overhead of the builtins path vs. a hand-tuned path on current RISC-V silicon.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI runner (QEMU-based or native via RISE-provided hardware) to `linux.yml` would provide upstream regression detection. This is the highest-value item because upstream currently has zero visibility into riscv64 behavior. A RISE runner contribution is the standard mechanism for this pattern.

### 13.4 Ecosystem Enablement

Not applicable. APR is a system library; it has no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 matrix entry to `linux.yml` using RISE-provided native runner or QEMU | 0.5 | RISE infra / APR committer | High -- zero upstream regression detection today |
| Build system | Replace `AC_TRY_RUN` with `AC_TRY_COMPILE` for the four cross-compile probe overrides; eliminates need for manual cache vars | 1 | APR committer | Medium -- developer experience; no functional impact |
| Performance | Implement `atomic/unix/riscv.c` with LR/SC (A extension) and optional Zacas sequences; update `apr_arch_atomic.h` dispatch | 3-4 | C systems engineer with RISC-V ISA knowledge | Low -- functional gap is absent; performance gap is minor for typical APR workloads |
| Functional | None required | 0 | N/A | N/A |
| Ecosystem | None required | 0 | N/A | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [apache/apr GitHub repository](https://github.com/apache/apr)
- [apache/apr pull requests](https://github.com/apache/apr/pulls)
- [apache/apr atomic/unix directory](https://github.com/apache/apr/tree/trunk/atomic/unix)
- [apache/apr .github/workflows directory](https://github.com/apache/apr/tree/trunk/.github/workflows)
- [Apache APR JIRA](https://issues.apache.org/jira/browse/APR)
- [Apache APR homepage](https://apr.apache.org/)
- [Debian buildd status for apr (sid)](https://buildd.debian.org/status/package.php?p=apr&suite=sid)
- [Ubuntu Noble libapr1t64 package](https://packages.ubuntu.com/noble/libapr1t64)
- [Ubuntu Noble libaprutil1t64 package](https://packages.ubuntu.com/noble/libaprutil1t64)
- [RISE Project homepage](https://riseproject.dev/)
- [OpenSSL issue #30763 -- cross-compile no-deprecated](https://github.com/openssl/openssl/issues/30763)
- [OpenSSL issue #30330 -- rv64i_zkne null-key check](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #25334 -- Zknd/Zkne coexistence](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #23011 -- unknown CSR vlenb](https://github.com/openssl/openssl/issues/23011)