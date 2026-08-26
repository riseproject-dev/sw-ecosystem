---
title: psycopg
---

# psycopg

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for psycopg<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

psycopg is the standard PostgreSQL database adapter for Python. It provides a DB-API 2.0-compliant interface wrapping libpq (the official PostgreSQL C client library). The project has two active major lines: psycopg2 (mature, C-extension only, widely deployed) and psycopg3 (active development, Python 3.8+, pure-Python core with optional compiled C extension). This report covers the psycopg3 line ([psycopg/psycopg](https://github.com/psycopg/psycopg)) with notes on psycopg2 where relevant.

**License:** LGPL-3.0.

**Governance:** No foundation affiliation (not PSF, NumFOCUS, or RISE). Governance is informal, controlled by the project founder and sole primary maintainer, Daniele Varrazzo (GitHub: dvarrazzo, employer: codicelieve). No formal steering committee, no CODEOWNERS or MAINTAINERS file exists in the repository. The psycopg GitHub organization was created 2020-03-15 for the psycopg3 rewrite.

**Contributor concentration:** The top three contributors by commit count are Daniele Varrazzo (3,299 commits), Denis Laxalde (258 commits, independent), and Dylan Young (26 commits, independent). All riscv64 port work was done by community contributor Miguel Liezun (mliezun / foundational-bio), not the core maintainer.

**Corporate sponsors (from BACKERS.yaml):**
- Top tier: Postgres Professional (postgrespro.com), Command Prompt Inc. (commandprompt.com), bit.io
- Mid tier: YouGov, Materialize Inc., Sentry, Dalibo, Logilab, and approximately a dozen others

No single corporate parent controls the project. Funding is through GitHub Sponsors.

**RISE membership:** Not a member. psycopg does not appear on riseproject.dev. The RISE wheel builder (pypi.riseproject.dev) does not include psycopg because upstream already provides official riscv64 binary wheels on PyPI.

**Community stance on new ports:** The maintainer's documented position, stated in [issue #883](https://github.com/psycopg/psycopg/issues/883) (2024): "It is not a platform I have run any test on... If you want us to consider the riscv64 platform supported you should add it to the CI test grid so we can monitor regressions." This is pragmatic rather than hostile - the project does not block ports but requires CI coverage before claiming support. The 2025-10-28 community contribution (PR #1197) adding riscv64 to the binary wheel CI was accepted and merged without objection.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-07-31 | Issue #883 opened by jmontleon (Fedora packager): 5 test failures on Fedora 41 riscv64 | [#883](https://github.com/psycopg/psycopg/issues/883) |
| 2024-08-01 | jmontleon attributes signal-handling failures to slow riscv64 hardware; epoch-date failure separately noted | [#883 comment](https://github.com/psycopg/psycopg/issues/883) |
| 2025-04 | Issue #1058 opened by zanpeeters: independently reproduces `test_date_from_ticks` epoch failure on macOS Apple M4 in UTC-7; references #883 | [#1058](https://github.com/psycopg/psycopg/issues/1058) |
| 2025-05-04 | PR #1061 merged (commit 2fe2885c direct to master): fix `DateFromTicks`/`TimeFromTicks` to use UTC, resolving epoch date failure | [#1061](https://github.com/psycopg/psycopg/pull/1061) |
| 2025-05-11 | psycopg 3.2.8 released, first release containing the epoch-date fix | [NEEDS VERIFICATION - derived from commit date] |
| 2025-10-28 | PR #1197 opened by mliezun: adds riscv64 to manylinux and musllinux binary wheel CI; companion to psycopg2 PR #1813 | [#1197](https://github.com/psycopg/psycopg/pull/1197) |
| 2025-10-28 | First RISC-V CI commit: SHA 67e3590c by Miguel Liezun; message "ci: update CI configuration to support riscv64 architecture and Rocky Linux" | [commit 67e3590c](https://github.com/psycopg/psycopg/commit/67e3590c) |
| 2025-10-29 | PR #1813 (psycopg2) merged: adds riscv64 binary wheel CI to psycopg2; dvarrazzo confirms "riscv64 packages released" | [psycopg2 #1813](https://github.com/psycopg/psycopg2/pull/1813) |
| 2025-10-30 | PR #1197 (psycopg3) merged (merge commit 3b2a589b): riscv64 in binary wheel CI | [#1197](https://github.com/psycopg/psycopg/pull/1197) |
| 2025-11-21 | psycopg 3.2.13 released: first psycopg3 release shipping riscv64 binary wheels | [NEEDS VERIFICATION - derived from PR merge date vs tag sequence] |
| 2026-04-21 | psycopg2 2.9.12 released: first psycopg2 release shipping riscv64 binary wheels | [NEEDS VERIFICATION - derived from PR merge date] |

**Key contributor:** Miguel Liezun (mliezun / foundational-bio) opened and drove both PR #1197 (psycopg3) and PR #1813 (psycopg2). No organizational affiliation is stated in the GitHub profiles. dvarrazzo reviewed, fixed a blocking proxy test regression (missing cherry-pick of commit 2905e07f from maint-3.2), and merged both PRs.

**Fully upstream:** Yes. The riscv64 build matrix is in the default branch of both psycopg/psycopg and psycopg/psycopg2. No out-of-tree patches, no external patchset, no fork required.

---

## 3. Upstream Support Tier

psycopg publishes no formal platform support tier document. The following table reflects the de facto treatment of each architecture based on CI, binary distribution, and maintainer statements.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tests run in upstream CI (`tests.yml`) | Yes, every PR | Yes (macOS-14) | No |
| Binary wheels built in CI | Yes (weekly + path trigger) | Yes (weekly + path trigger) | Yes (weekly + path trigger) |
| Binary wheels on PyPI (`psycopg_binary`) | Yes, all Python 3.10-3.14 | Yes, all Python 3.10-3.14 | Yes, all Python 3.10-3.14 (manylinux_2_39 + musllinux_1_2) |
| Native CI runner | Yes (ubuntu-latest) | Yes (macOS-14) | No - QEMU emulation only |
| Release-blocking failures | Yes | Yes | No - not tested per-PR |
| Signal-handling tests passing | Yes | Yes | Unknown - failures reported (#883), never confirmed fixed |
| Formal tier designation | Tier 1 (implicit) | Tier 1 (implicit) | Tier 2 (built and distributed, not PR-tested) |

riscv64 is a first-class binary distribution target as of psycopg 3.2.13 and psycopg2 2.9.12. It is not a first-class test target - no riscv64 runner exists in the per-PR `tests.yml` workflow.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

psycopg is not a compute-intensive library. Its performance-critical path is protocol I/O and type marshalling, implemented in portable C via Cython-generated code. There are no JIT, SIMD, or assembly components in the psycopg codebase itself.

**Architecture-specific code inventory:**

A search of the entire repository (`riscv repo:psycopg/psycopg`, `rvv`, `vfloat32m1_t`, arch/ directory scan, .S file scan) returned zero architecture-specific source files. The only C file in the project is `psycopg_c/psycopg_c/types/numutils.c` (218 lines). It uses `__builtin_clzl`/`__builtin_clzll` with a portable lookup-table fallback guarded by `#if !defined(HAVE__BUILTIN_CLZ) || ...`. No `#ifdef __riscv`, `#ifdef __x86_64__`, or any other architecture preprocessor guard exists in non-CI source files.

Endian handling (`psycopg_c/psycopg_c/_psycopg/endian.pxd`) uses a portable shim via `#include <endian.h>` on Linux - a single branch covering all Linux architectures with no per-architecture specialization.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Pure-Python psycopg core | scalar/portable | scalar/portable | scalar/portable | py3-none-any wheel |
| C extension (psycopg_c, numutils.c) | scalar | scalar | scalar | __builtin_clz + lookup-table fallback; portable on riscv64 |
| Endian handling | portable | portable | portable | #include <endian.h> for all Linux |
| JIT | none | none | none | Not applicable |
| SIMD / vectorized type conversion | none | none | none | Not applicable |
| Crypto | none (delegated to libpq/OpenSSL) | none | none | psycopg itself has no crypto code |
| Assembly | none | none | none | No .S files in repository |

**ISA extension usage:** None. psycopg does not use RVV, Zba, Zbb, Zbc, Zkn, or any other RISC-V extension. There is no extension-detection code and no dispatch path.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** The `psycopg` pure-Python package uses standard Python packaging (setuptools, pyproject.toml). The `psycopg_c` C extension uses setuptools with a custom build backend (`psycopg_build_ext`) that calls `pg_config --includedir` and `pg_config --libdir` to locate libpq headers and library, then compiles Cython-generated C code. No CMake, no Meson, no dedicated cross-compilation toolchain files.

**Build steps for riscv64 binary wheel:**
1. Start QEMU binfmt emulation: `docker/setup-qemu-action@v4` with `tonistiigi/binfmt:qemu-v8.1.5`
2. Run `tools/ci/build_libpq.sh` inside `quay.io/pypa/manylinux_2_39_riscv64` container to cross-compile libpq and OpenSSL from source
3. Run cibuildwheel v3.4.1 with `CIBW_ARCHS_LINUX: auto aarch64 ppc64le riscv64`
4. Build psycopg_c extension against the vendored libpq inside the container
5. Strip and repair wheel: `tools/ci/strip_wheel.sh {wheel} && auditwheel repair -w {dest_dir} {wheel}`

**libpq vendoring:** For manylinux wheels, psycopg does not use the system libpq. It compiles libpq (PostgreSQL 18.0 in packages-bin.yml, 18.3 in build-and-cache-libpq.yml) and OpenSSL (3.5.7) from source inside the container via `build_libpq.sh`. The libpq `./configure` command enables: `--with-gssapi --with-openssl --with-pam --with-ldap --without-readline --without-icu`. One patch is applied: `gssencmode` default changed from `"prefer"` to `"disable"` in `src/interfaces/libpq/fe-connect.c`.

**manylinux baseline for riscv64:** `manylinux_2_39` (glibc 2.39). This is a higher baseline than x86_64 (`manylinux2014`, glibc 2.17) or aarch64 (`manylinux_2_28`, glibc 2.28). The higher baseline is required because riscv64 Linux distributions did not exist at the time of older manylinux baselines.

**Toolchain requirements:** The compiler is whatever is pre-installed in the `quay.io/pypa/manylinux_2_39_riscv64` container. No explicit GCC or Clang minimum version is documented. Cython >= 3.1.1 is required only when building from a git checkout (not from sdist). For Alpine/musllinux, the build installs: `flex krb5-dev linux-pam-dev openldap-dev openssl-dev zlib-devel`. For manylinux: `flex cyrus-sasl-devel krb5-devel pam-devel perl perl-IPC-Cmd perl-Time-Piece zlib-devel`.

**QEMU requirement:** All riscv64 builds run under QEMU emulation. No native riscv64 CI runner is used anywhere in the psycopg GitHub Actions workflows.

**Known build failures:** PR #1197 initially failed due to a proxy test error (`ValueError: the proxy didn't start listening in time`) caused by a missing cherry-pick of commit `2905e07f` from the `maint-3.2` branch. dvarrazzo resolved this by adding the commit to master and rebasing the PR. No riscv64-specific build failures remain open.

**Cache key format (libpq):**
`libpq-<platform>-riscv64-<LIBPQ_VERSION>-<OPENSSL_VERSION>-gssencmode-disable`

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

psycopg is a protocol adapter. Feature completeness is defined by libpq feature availability and Python version support, not by architecture-specific implementation.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Core DB-API 2.0 operations | Full | Full | Full | None |
| Async support (asyncio) | Full | Full | Full | None |
| Connection pooling (psycopg_pool) | Full | Full | Full | None |
| SSL/TLS connections | Full | Full | Full | None |
| COPY protocol | Full | Full | Full | None |
| Server-side cursors | Full | Full | Full | None |
| Binary format wire protocol | Full | Full | Full | None |
| Prepared statements | Full | Full | Full | None |
| Compiled C extension (psycopg_c) | Full | Full | Full | None |
| NumPy array adapters (optional) | Full | Full | Full (via RISE or source build) | No official PyPI riscv64 NumPy wheel yet (issue #30216 open); RISE wheels available |
| gevent integration (optional) | Full | Full | Full | Historical issue #1372 (struct stat mismatch) resolved |
| Signal handling in tests | Pass | Pass | Flaky [NEEDS VERIFICATION] | test_eintr/test_ctrl_c_handler failures reported on riscv64 (#883); never confirmed fixed |
| manylinux glibc baseline | 2.17 | 2.28 | 2.39 | Requires glibc >= 2.39; older riscv64 distros incompatible |
| Free-threaded Python (3.13t+) | Supported | Supported | Not built | CIBW_SKIP: cp31?t-* excludes free-threaded builds for riscv64 in psycopg2 CI [NEEDS VERIFICATION for psycopg3] |

**Security hardening:** psycopg itself has no cryptographic code. TLS is handled entirely by libpq and the vendored OpenSSL 3.5.7. On riscv64 hardware without the Zkn (AES) or Zbc (GHASH/CLMUL) extensions, OpenSSL's scalar fallback paths are not constant-time (OpenSSL issues [#31080](https://github.com/openssl/openssl/issues/31080) and [#31082](https://github.com/openssl/openssl/issues/31082), both open). This is a security concern for TLS-protected database connections on riscv64 hardware lacking those extensions, not a functionality gap.

**NaN/floating-point semantics:** No open issues about NaN or floating-point correctness in data handling on riscv64. Issue #1346 (unhandled `OverflowError` on `connect_timeout='inf'`) is about connection parameter parsing, not data type handling, and is architecture-independent.

---

## 7. CI/CD Infrastructure

**Per-PR testing (`tests.yml`):** Runs on `ubuntu-latest` (x86_64), `macos-14` (arm64), and Windows. riscv64 is absent from this workflow. No code change triggers riscv64 testing.

**Binary wheel building (`packages-bin.yml`):** Runs on `ubuntu-latest` with QEMU. Trigger is `push` to `.github/workflows/packages-bin.yml` path, `workflow_dispatch`, and weekly schedule (`28 7 * * sun`). The matrix is `arch: [x86_64, ppc64le, aarch64, riscv64]` x `platform: [manylinux, musllinux]` x Python versions `[cp310, cp311, cp312, cp313, cp314]`. Tests are run inside the QEMU environment against a `postgres:14` service container with filter `-m 'not slow and not flakey'`.

**libpq cache building (`build-and-cache-libpq.yml`):** Runs on `ubuntu-latest` with QEMU. Trigger is `workflow_dispatch` and `push` to the workflow file path. Matrix: same arch/platform combinations. Builds libpq and OpenSSL from source; no test step.

**Run history (from findings):**
- Run 31934852707 (around 2026-08-16): all 10 riscv64 jobs succeeded
- Run 32626682630 (around 2026-08-23): 5 riscv64 jobs failed alongside failures on Windows, macOS, and other Linux arches - cross-platform infrastructure failure, not riscv64-specific regression

**RISE runners:** None used. All builds use GitHub-hosted `ubuntu-latest` runners.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Per-PR test run | Yes (tests.yml) | Yes (tests.yml, macOS-14) | No |
| Weekly binary build | Yes | Yes | Yes |
| Tests in binary build CI | Yes (native) | Yes (native) | Yes (QEMU only) |
| Native runner | Yes | Yes | No |
| Release-blocking | Yes | Yes | No |
| flakey/slow tests excluded | Yes | Yes | Yes (same filter) |

---

## 8. Distribution and Release Status

**PyPI - `psycopg` (pure Python):**
- Latest: 3.3.4
- Wheel: `psycopg-3.3.4-py3-none-any.whl` - platform-independent, installs on riscv64 without any special action
- No riscv64-specific wheel needed or present

**PyPI - `psycopg_binary` (C extension + vendored libpq, single-package install):**
- Latest: 3.3.4
- riscv64 wheels present: 10 files covering Python 3.10-3.14, manylinux_2_39 and musllinux_1_2:
  - `psycopg_binary-3.3.4-cp310-cp310-manylinux_2_38_riscv64.manylinux_2_39_riscv64.whl`
  - `psycopg_binary-3.3.4-cp310-cp310-musllinux_1_2_riscv64.whl`
  - (same pattern for cp311, cp312, cp313, cp314)
- First release with riscv64 wheels: psycopg 3.2.13 (2025-11-21) [NEEDS VERIFICATION]

**PyPI - `psycopg2-binary`:**
- Latest: 2.9.12
- riscv64 wheels present: manylinux_2_38/manylinux_2_39 and musllinux_1_2 for Python 3.9-3.14
- First release with riscv64 wheels: psycopg2 2.9.12 (2026-04-21) [NEEDS VERIFICATION]

**Ubuntu 24.04 (Noble):**
- `python3-psycopg` v3.1.17-2 (universe): architecture=all, available on riscv64
- `python3-psycopg-pool` v3.1.17-2 (universe): architecture=all, available on riscv64
- `python3-psycopg2` v2.9.9-1build1: compiled binary, explicitly listed for riscv64 alongside amd64, arm64, ppc64el, s390x
- `python3-psycopg-c` (C extension for psycopg3): not found as a separate Ubuntu Noble package

**Debian (sid/unstable):**
- psycopg3 v3.3.4-1 confirmed built and installed on riscv64 by buildd `rv-osuosl-04` (native riscv64 build daemon). No FTBFS.

**Fedora riscv64:**
- Issue #883 was filed by the Fedora RISC-V packager (jmontleon). No follow-up on current Fedora riscv64 package status is available in the research findings.

**Arch Linux RISC-V port:** Not found at archriscv.felixc.at.

**RISE wheel builder (pypi.riseproject.dev):** psycopg is absent from the 49-package RISE wheel index. This is not a gap - the stated reason is that upstream already provides official riscv64 wheels.

**Summary for a user on riscv64:**
- `pip install psycopg` - works immediately, installs pure-Python package
- `pip install psycopg[binary]` or `pip install psycopg_binary` - works on systems with glibc >= 2.39 (manylinux_2_39 tag) or musl; pulls prebuilt riscv64 wheel from PyPI
- On systems with glibc < 2.39 (e.g., Ubuntu 22.04 riscv64 with glibc 2.35): `psycopg_binary` riscv64 wheel is incompatible; user must install `psycopg` + system libpq and build `psycopg_c` from source

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| libpq (PostgreSQL) | Core runtime - all connections use libpq for protocol and SSL | Builds from source via `build_libpq.sh` in CI | No riscv64-specific open issues | Vendored into psycopg_binary wheels for riscv64 | See [postgresql.md](../reports/postgresql.md) |
| OpenSSL 3.5.7 | Vendored into libpq build for manylinux | Builds on riscv64 | Issues [#31080](https://github.com/openssl/openssl/issues/31080) and [#31082](https://github.com/openssl/openssl/issues/31082) open: scalar AES and GHASH paths not constant-time without Zkn/Zbc | Vendored into psycopg_binary via libpq | Crypto side-channel risk on hardware without Zkn/Zbc; not a build blocker. See [openssl.md](../reports/openssl.md) |
| CPython | Interpreter; psycopg supports 3.10-3.14 | Builds on riscv64 | Issue [#121201](https://bugs.python.org/issue121201) open: perf JIT fails to compile on riscv64. Issue [#153777](https://bugs.python.org/issue153777) open: free-threading GC segfault on riscv64 | No official python.org riscv64 binary; distro packages available | Perf JIT and free-threading issues non-blocking for normal psycopg use. See [python.md](../reports/python.md) |
| Cython | Build-time: compiles psycopg_c .pyx files to C | Builds on riscv64; issue [#7646](https://github.com/cython/cython/issues/7646) closed confirming RISE-runner-based riscv64 wheel builds | Confirmed working | riscv64 wheels available | None blocking |
| manylinux (pypa/manylinux) | Wheel build infrastructure; `quay.io/pypa/manylinux_2_39_riscv64` used in CI | Image exists and is used in CI | Issues #1843, #1860, #1969 all closed | manylinux_2_39_riscv64 image published | None blocking |
| cibuildwheel v3.4.1 | Wheel build orchestration | riscv64 support added in v3.1.2 (issue #2263 closed) | Confirmed working in PR #1197 | riscv64 enabled by default since v3.1.2 | None blocking |
| NumPy | Optional: array/numeric type adapters | Builds on riscv64 | Issues [#26743](https://github.com/numpy/numpy/issues/26743) and [#31753](https://github.com/numpy/numpy/issues/31753) (both closed): fp_noncontiguous and fpclass riscv64 fixes merged | No official upstream riscv64 PyPI wheel (issue [#30216](https://github.com/numpy/numpy/issues/30216) open); RISE wheels available | Blocker is `actions/setup-python` lacking riscv64 support. See [numpy.md](../reports/numpy.md) |
| gevent | Optional: async concurrency integration | Builds on riscv64 | Issue [#1372](https://github.com/gevent/gevent/issues/1372) closed: `struct stat` size mismatch fixed | No dedicated riscv64 wheel tracking found | None blocking |
| dnspython | Optional: DNS-name resolution for connection strings | Pure Python | No riscv64 issues found | Works on all platforms | None |
| libffi | Indirect via CPython ctypes/cffi | Builds on riscv64; upstream supports it | No open riscv64 issues | Packaged in all major distros | See [libffi.md](../reports/libffi.md) |

**OpenSSL deep-dive (crypto security on riscv64):** OpenSSL 3.5.7 is vendored into the psycopg_binary wheel via libpq. On riscv64 hardware without the Zkn extension (AES-based operations) or the Zbc extension (GHASH/CLMUL for GCM mode), OpenSSL falls back to scalar C implementations. Two open issues ([#31080](https://github.com/openssl/openssl/issues/31080) and [#31082](https://github.com/openssl/openssl/issues/31082)) document that these scalar fallbacks are not constant-time, creating potential timing side-channel exposure in TLS connections. This affects database connections using TLS (sslmode=require or verify-full). It does not prevent connections from working.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#883](https://github.com/psycopg/psycopg/issues/883) | Tests failing on riscv64 | Closed (2025-05-01) | Medium | 5 failures: 4 signal/timing tests, 1 epoch-date test. Epoch-date fixed in PR #1061. Signal tests not explicitly fixed - attributed to slow QEMU/hardware; no skip added for riscv64 |
| [#1058](https://github.com/psycopg/psycopg/issues/1058) | test_date_from_ticks fails | Closed (2025-05-04) | Low | Root cause: `TimestampFromTicks` used `time.localtime(0)` instead of `time.gmtime(0)`; `.date()` on localized datetime returns wrong date west of UTC. Fixed by PR #1061 |
| [#1351](https://github.com/psycopg/psycopg/issues/1351) | `psycopg.Timestamp()` and `psycopg.TimestampFromTicks()` produce timezone-inconsistent `datetime` objects | Open (2026-07-08) | Low | Correctness bug: `Timestamp()` returns naive datetime, `TimestampFromTicks()` returns UTC-aware datetime. Causes different PostgreSQL column types (timestamp vs timestamptz). Not riscv64-specific; unfixed |
| [#1164](https://github.com/psycopg/psycopg/issues/1164) | Introduce performance regression tests | Open (2025-09-09) | Low | Meta-request for cross-adapter (psycopg3 vs psycopg2 vs asyncpg) benchmarks in CI. Architecture-agnostic; no riscv64 content |

**Signal-handling test failures:** `test_concurrency.py::test_eintr[ITIMER_REAL-SIGALRM]` and `test_concurrency.py::test_ctrl_c_handler` (sync and async variants) were reported failing on Fedora 41 riscv64. The maintainer attributed these to slow riscv64 hardware timing. Issue #883 was closed without a code fix or skip added for riscv64. The current binary wheel CI uses `-m 'not slow and not flakey'` which may exclude these tests - that cannot be confirmed from the available findings without reading the test markers in source.

**No open riscv64-specific correctness bugs.** All closed issues were resolved by May 2025 (epoch-date) and October 2025 (CI and binary wheels). No riscv64-specific issues are currently open.

---

## 12. Objections and Upstream Blockers

**No active upstream objections.** The maintainer (dvarrazzo) accepted PR #1197 and PR #1813 from a community contributor with minor review comments (path scope, trigger paths, commit message hygiene). The primary condition the maintainer stated for riscv64 support - "add it to the CI test grid" - was met by PR #1197.

**Remaining gaps that could become blockers:**

1. riscv64 absent from `tests.yml`: the per-PR test suite does not run on riscv64. A correctness regression in psycopg3 on riscv64 would not be caught until the weekly binary build - and only if the test is not excluded by the flakey/slow filter. Adding a native or QEMU riscv64 job to `tests.yml` would require a workflow change that would likely be accepted given the existing investment in PR #1197.

2. manylinux_2_39 baseline: systems with glibc < 2.39 cannot use the prebuilt riscv64 wheels. Ubuntu 24.04 riscv64 ships glibc 2.39 and is compatible. Ubuntu 22.04 riscv64 ships glibc 2.35 and is not. No workaround exists except installing from source or using distro packages.

3. Signal-handling test flakiness: the timing-sensitive signal tests were never confirmed fixed or skipped for riscv64. On slow riscv64 hardware these may still fail. No blocking consequence for end users but relevant for downstream packagers running the full test suite.

4. Free-threaded Python (cp313t, cp314t): psycopg2's CI explicitly skips free-threaded builds (`CIBW_SKIP: cp31?t-*`). The status of free-threaded riscv64 builds for psycopg3 was not confirmed in the findings.

---

## 13. Investment Analysis

psycopg riscv64 support is substantially complete. Binary wheels ship for both psycopg3 and psycopg2 across all supported Python versions on both manylinux and musllinux. The pure-Python package has always worked. No RISE funding or involvement is documented.

### 13.1 Functional Enablement

No functional gaps exist. psycopg works fully on riscv64. The manylinux_2_39 baseline requirement is a constraint, not a bug - it reflects the actual state of riscv64 Linux ecosystem maturity.

### 13.2 Performance Optimization

psycopg has no SIMD or architecture-specific optimization paths on any architecture. Performance is bounded by network I/O to the PostgreSQL server and libpq protocol processing. No riscv64-specific performance work is warranted in psycopg itself. If TLS-heavy workloads on riscv64 are performance-sensitive, the relevant investment is in OpenSSL (Zkn/Zbc assembly paths), not psycopg.

No riscv64 benchmark data for psycopg exists. Data not available: no architecture-comparative throughput or latency benchmarks were found in RISE blog, GitHub, or PyPI for psycopg on riscv64.

### 13.3 CI/CD Infrastructure

The primary gap is the absence of riscv64 in `tests.yml` (per-PR test suite). Adding QEMU-based riscv64 testing to `tests.yml` would provide regression detection on every code change. This is straightforward given the existing `packages-bin.yml` QEMU setup.

### 13.4 Ecosystem Enablement

The optional NumPy adapter dependency lacks an official riscv64 PyPI wheel (NumPy issue [#30216](https://github.com/numpy/numpy/issues/30216) open). RISE wheels are available as a workaround. psycopg itself has no further ecosystem dependencies that require riscv64 enablement work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 QEMU job to tests.yml (per-PR test suite) | 0.5 | Community/RISE | Medium |
| CI/CD | Investigate and add skip markers for signal-handling tests on riscv64/QEMU | 0.5 | Community | Low |
| Functional | Confirm free-threaded (cp313t/cp314t) psycopg3 riscv64 wheel status and enable if missing | 1 | Community | Low |
| Dependency | Unblock official NumPy riscv64 PyPI wheels (NumPy #30216; blocker is actions/setup-python) | 3 (upstream NumPy/actions) | RISE or NumPy community | Medium |
| Security | Contribute Zkn/Zbc constant-time crypto paths to OpenSSL for vendored libpq TLS | 8-16 (OpenSSL scope) | OpenSSL / RISE | Medium (hardware-dependent) |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [psycopg/psycopg GitHub repository](https://github.com/psycopg/psycopg)
- [psycopg/psycopg2 GitHub repository](https://github.com/psycopg/psycopg2)
- [psycopg homepage](https://www.psycopg.org/)
- [Issue #883: Tests failing on riscv64](https://github.com/psycopg/psycopg/issues/883)
- [Issue #1058: test_date_from_ticks fails](https://github.com/psycopg/psycopg/issues/1058)
- [Issue #1164: Introduce performance regression tests](https://github.com/psycopg/psycopg/issues/1164)
- [Issue #1351: Timestamp/TimestampFromTicks timezone inconsistency](https://github.com/psycopg/psycopg/issues/1351)
- [PR #1061: Fix return value of DateFromTicks and TimeFromTicks](https://github.com/psycopg/psycopg/pull/1061)
- [PR #1197: Add riscv64 support for linux builds (psycopg3)](https://github.com/psycopg/psycopg/pull/1197)
- [PR #1813 (psycopg2): Add riscv64 support for linux builds](https://github.com/psycopg/psycopg2/pull/1813)
- [psycopg_binary 3.3.4 on PyPI](https://pypi.org/project/psycopg-binary/3.3.4/)
- [psycopg2-binary 2.9.12 on PyPI](https://pypi.org/project/psycopg2-binary/2.9.12/)
- [Ubuntu Noble: python3-psycopg package](https://packages.ubuntu.com/noble/python3-psycopg)
- [Ubuntu Noble: python3-psycopg2 package](https://packages.ubuntu.com/noble/python3-psycopg2)
- [OpenSSL issue #31080: AES scalar fallback not constant-time on riscv64 without Zkn](https://github.com/openssl/openssl/issues/31080)
- [OpenSSL issue #31082: GHASH scalar fallback not constant-time on riscv64 without Zbc](https://github.com/openssl/openssl/issues/31082)
- [NumPy issue #30216: riscv64 PyPI wheel publication blocked on actions/setup-python](https://github.com/numpy/numpy/issues/30216)
- [CPython issue #121201: perf JIT trampoline fails to compile on riscv64](https://bugs.python.org/issue121201)
- [CPython issue #153777: free-threading GC segfault on riscv64](https://bugs.python.org/issue153777)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [manylinux_2_39_riscv64 image on quay.io](https://quay.io/pypa/manylinux_2_39_riscv64)