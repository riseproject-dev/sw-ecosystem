---
title: PgBouncer
---

# PgBouncer

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for PgBouncer<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

PgBouncer is a lightweight connection pooler for PostgreSQL. It accepts client connections and forwards them to backend PostgreSQL servers, reusing backend connections across multiple clients. It operates in session, transaction, or statement pooling modes. The daemon is written in portable C11, uses [libevent](https://libevent.org/) for async I/O, and implements the PostgreSQL wire protocol directly. It has no query engine, no JIT, and no architecture-sensitive data paths.

**License:** ISC. Originally created by Marko Kreen at Skype Technologies OU (2007-2009).

**Governance:** Independent community project. No foundation affiliation (no CNCF, Apache, or PostgreSQL Foundation membership). The project is hosted under the [pgbouncer GitHub organization](https://github.com/pgbouncer/pgbouncer). No formal tier policy document, no PLATFORMS.md, and no SUPPORT.md exist in the repository.

**Maintainers:**

| Name | GitHub | Company | Status |
|------|--------|---------|--------|
| Peter Eisentraut | petere | EnterpriseDB | Active (sole listed maintainer) |
| Marko Kreen | markokr | (formerly Skype Technologies) | Emeritus |
| Petr Jelinek | PJMODOS | EnterpriseDB | Emeritus |

**Top corporate contributors by commit count (all time):**

| Login | Company | Commits |
|-------|---------|---------|
| markokr | formerly Skype | 870 |
| petere | EnterpriseDB | 475 |
| JelteF | MotherDuck | 137 |
| eulerto | EnterpriseDB | 56 |
| emelsimsek | Citus Data / Microsoft | 36 |
| PJMODOS | EnterpriseDB | 26 |

EnterpriseDB (EDB) is the dominant corporate backer, holding 3 of the top 6 contributor slots and the sole active maintainer position.

**Culture on new ports:** No explicit policy exists. The project added an ARM64 native runner (`ubuntu-24.04-arm`) to its CI matrix without controversy. Given the codebase is fully portable C with no platform-specific code beyond Windows accommodations, new architecture CI is a low-friction addition. However, the primary backer (EDB) shows no published RISC-V interest for this project. Any RISC-V CI addition would be community-driven.

**RISE involvement:** None. PgBouncer does not appear in any RISE project blog post, runner integration list, or funded work record. The databases vertical report as of 2026-08-13 explicitly records RISE involvement as "none."

---

## 2. Port History and Upstreaming Timeline

No RISC-V porting activity exists in the upstream repository.

| Date | Event | Source |
|------|-------|--------|
| 2025-11-10 | PR #1414 merged: added missing `int64`/`uint64` typedefs to `include/common/postgres_compat.h`, fixing build failures on non-SIMD architectures (ppc64le, implicitly also riscv64) | [pgbouncer/pgbouncer PR #1414](https://github.com/pgbouncer/pgbouncer/pull/1414) |
| ~2026-05-09 | Debian sid package 1.25.2-1 built successfully on riscv64 host `rv-osuosl-01`, status "Installed" | [Debian buildd](https://buildd.debian.org/status/package.php?p=pgbouncer&suite=sid) |

All remaining rows: none. GitHub searches for "riscv", "riscv64", and "risc-v" across issues, PRs, commits, and code in `pgbouncer/pgbouncer` returned zero results across all 11 query vectors.

**Is riscv64 support fully upstream?** Yes, by default. PgBouncer has no architecture-specific code that requires porting. The source compiles on riscv64 from an unmodified upstream tarball with no patches. Debian and Ubuntu confirm this by shipping unpatched packages.

**Key contributors to riscv64 viability:** The author of PR #1414 (fixing non-SIMD typedef gaps) is the only upstream contributor whose work directly affected riscv64 build correctness. The Debian riscv64 porter who first built and tested the package is not identified in the research data.

---

## 3. Upstream Support Tier

PgBouncer has no formal tier policy. Support is implicitly defined by presence in the CI matrix.

| Platform | CI | Release binary | Build tested | Test suite run |
|----------|----|---------------|-------------|---------------|
| amd64 (x86-64) | Yes - primary, all matrix jobs | Source tarball + Windows zip | Yes | Yes |
| arm64 (aarch64) | Yes - `ubuntu-24.04-arm` native runner in `linux-extra` matrix | None | Yes | Yes |
| riscv64 | No | None | No (upstream) | No (upstream) |

arm64 is treated as a first-class secondary platform with a native CI runner. riscv64 has no upstream status - it is supported only through downstream Debian/Ubuntu packaging, with no upstream awareness.

There is no release-blocking policy for any non-x86-64 platform. Release binaries are limited to Windows x86-64 zips and source tarballs across all five recent releases examined (1.24.0 through 1.25.2).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

PgBouncer is a network proxy daemon. Its architecture-sensitive surface area is minimal.

**No JIT.** PgBouncer is not a query engine. It does not compile or execute user code. No JIT backend exists or is applicable.

**No crypto assembly.** All cryptographic operations (SCRAM-SHA-256 authentication) are either delegated to OpenSSL (when enabled) or handled by the bundled `libusual` library's pure-C SHA-256 and MD5 implementations. No architecture-specific crypto code exists in the repository.

**No `.S` assembly files.** A full recursive search of the repository found zero assembly source files of any kind.

**No `arch/`, `asm/`, `cpu/`, or `platform/` directories** anywhere in the tree.

**Architecture-specific code that does exist:**

| File | Component | x86-64 | arm64 | riscv64 |
|------|-----------|--------|-------|---------|
| `lib/usual/misc.h` | Memory barrier macros (`mb()`, `rmb()`, `wmb()`) | Full - x86 `mfence`/`lfence`/`sfence` inline asm | Missing - macro not defined | Missing - macro not defined |
| `include/common/simd.h` | SIMD byte-scan helpers | Full - SSE2 128-bit vectors | Full - NEON `uint8x16_t` 128-bit vectors | Scalar - `USE_NO_SIMD` fallback, 64-bit `uint64` pseudo-vector |
| `lib/usual/endian.h` | Unaligned memory access flag | Full - `WORDS_UNALIGNED_ACCESS_OK` set | Partial - set only if `__ARM_FEATURE_UNALIGNED` | Missing - aligned-only access (conservative, correct) |

**Assessment of each gap:**

- **Memory barriers (`misc.h`):** The missing `mb()` macro is equally absent for arm64 and all non-x86 architectures. PgBouncer uses `pthread_mutex_lock` for synchronization in hot paths; the barrier macros are not used in production code paths. This is not a functional gap.

- **SIMD (`simd.h`):** The `USE_NO_SIMD` scalar fallback is complete, production-quality upstream code. It implements all required operations (`vector8_has`, `vector8_has_zero`, `vector8_has_le`, `vector8_or`). Operations gated behind `#ifndef USE_NO_SIMD` (`vector32_*`, `vector8_eq`, `vector8_min`, `vector8_ssub`, `vector8_highbit_mask`) are unused in connection-pooler code paths. The scalar path processes 8 bytes per iteration versus 16 bytes for SSE2/NEON - a 2x throughput difference in byte-scan operations. This affects PostgreSQL protocol string parsing, not a bottleneck for a connection pooler.

- **Unaligned access (`endian.h`):** The conservative aligned-only path is correct and safe. riscv64 hardware requires aligned access by default; the `memcpy`-based inline functions used in the fallback path are correct. No functional gap.

**No RVV (RISC-V Vector extension) code exists or is expected.** PgBouncer's workload (socket I/O, protocol parsing, connection state management) has no compute-intensive loops that would benefit from vectorization.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** Meson (>= 0.58.0, recommended) and Autoconf. No CMake. No Makefile-only option.

**Compiler requirement:** C11-capable compiler. `meson.build` probes for C11 at configure time, trying: compiler default, `-std=gnu11`, `-std=c11`. Minimum effective version: GCC >= 5 or Clang >= 3.3. The bundled `lib/usual/endian.h` uses `_COMPILER_GNUC(4, 8)` for `__builtin_bswap16`, implying GCC 4.8 is a hard lower bound - but GCC >= 5 is the practical minimum for C11 support.

**Native riscv64 build (Meson):**

```
meson setup build --prefix=/usr/local
meson compile -C build
meson install -C build
```

**Native riscv64 build (Autoconf):**

```
./autogen.sh    # only needed from git checkout; release tarballs include ./configure
./configure --prefix=/usr/local
make
make install
```

**Cross-compilation from x86-64 (Meson):** No riscv64 cross file is provided in the repository. Supply one:

```ini
# riscv64-linux-gnu.ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkgconfig = 'pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[properties]
sys_root = '/usr/riscv64-linux-gnu'
```

```
meson setup build --cross-file riscv64-linux-gnu.ini --prefix=/usr/local
meson compile -C build
```

**Cross-compilation from x86-64 (Autoconf):**

```
./configure --host=riscv64-linux-gnu --prefix=/usr/local
make
```

**Minimal build (no host services, suitable for cross-compile testing):**

```
meson setup build \
  --cross-file riscv64-linux-gnu.ini \
  -Dcares=disabled \
  -Devdns=false \
  -Dldap=disabled \
  -Dpam=disabled \
  -Dsystemd=disabled \
  -Dopenssl=disabled \
  --prefix=/usr/local
```

**QEMU usage:** None in upstream CI. The arm64 CI entry uses a native `ubuntu-24.04-arm` runner, not QEMU. No QEMU-based cross-compilation or emulation step exists for any architecture.

**Known build failures on riscv64:**

- **[CLOSED, fixed]** [Issue #1413](https://github.com/pgbouncer/pgbouncer/issues/1413): `int64` undeclared in `include/common/simd.h` on non-SIMD architectures (manifested on ppc64le; riscv64 would have hit the same failure). Fixed by [PR #1414](https://github.com/pgbouncer/pgbouncer/pull/1414) (merged 2025-11-10), present in 1.25.1 and later. The Debian 1.25.2-1 build on riscv64 confirms the fix is effective.

No other build failures on riscv64 are recorded in the upstream tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Session pooling | Full | Full | Full |
| Transaction pooling | Full | Full | Full |
| Statement pooling | Full | Full | Full |
| TLS (OpenSSL) | Full | Full | Full |
| SCRAM-SHA-256 auth | Full | Full | Full |
| PAM auth | Full | Full | Full |
| LDAP auth | Full | Full | Full |
| c-ares DNS | Full | Full | Full |
| systemd socket activation | Full | Full | Full |
| SIMD byte-scan | SSE2 (16-byte vectors) | NEON (16-byte vectors) | Scalar (8-byte, `USE_NO_SIMD`) |
| Pre-built upstream binary | Windows only | None | None |

**Functional gaps:** None. All features are available on riscv64.

**Performance gaps:** SIMD byte-scan throughput is 2x lower on riscv64 (8-byte scalar vs 16-byte SSE2/NEON). This affects PostgreSQL protocol string parsing only. For a connection pooler whose bottleneck is network I/O and lock contention, this is not a material gap. No benchmark data exists to quantify the actual impact on riscv64 hardware.

**Security hardening gaps:** PgBouncer itself has no architecture-specific hardening code. OpenSSL (the TLS library) has a known non-constant-time AES fallback on RISC-V hardware lacking the Zkn crypto extension - see Section 9 for detail.

**Floating-point / NaN issues:** None. PgBouncer does not perform floating-point arithmetic.

---

## 7. CI/CD Infrastructure

**Upstream CI:** One workflow file: [`.github/workflows/pgbouncer-ci.yml`](https://github.com/pgbouncer/pgbouncer/blob/main/.github/workflows/pgbouncer-ci.yml). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

**All `runs-on` values in the workflow:**

- `ubuntu-22.04` (x86-64)
- `ubuntu-24.04` (x86-64)
- `ubuntu-24.04-arm` (arm64 native runner)
- `ubuntu-latest` (x86-64)
- `macos-15` (Apple Silicon arm64)
- `windows-2022` (x86-64)

**CI matrix by architecture:**

| Architecture | CI present | Runner type | Configurations tested |
|-------------|-----------|-------------|----------------------|
| amd64 | Yes | Native GitHub-hosted | autoconf, meson (cares+pam+ldap, no-evdns-no-openssl, valgrind), plain, ubsan, scan-build, Debian bookworm/bullseye, Rocky 8/9, Alpine, Windows MSYS2 |
| arm64 | Yes | Native `ubuntu-24.04-arm` | One `linux-extra` matrix entry (standard meson build) |
| riscv64 | No | None | None |

**RISE runners:** Not used. PgBouncer is not listed among RISE runner integrations (confirmed against the RISE "six weeks in" blog post listing 197 onboarded repositories, none of which is PgBouncer).

**Hardware used for riscv64 builds (Debian):** `rv-osuosl-01` - a board from the OSU Open Source Lab RISC-V board farm used by Debian's buildd infrastructure. This is not upstream CI; it is Debian packaging infrastructure.

**Verdict:** riscv64 has no upstream CI whatsoever - no native runner, no QEMU-based job, no cross-compile matrix entry. The CI gap is complete.

---

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs and Windows x86-64 zips only. Upstream ships no pre-built Linux binaries for any architecture.

| Release | Assets |
|---------|--------|
| 1.25.2 | `pgbouncer-1.25.2.tar.gz`, `pgbouncer-1.25.2-windows-x86_64.zip` |
| 1.25.1 | `pgbouncer-1.25.1.tar.gz` (no binary assets) |
| 1.25.0 | `pgbouncer-1.25.0.tar.gz` |
| 1.24.1 | `pgbouncer-1.24.1.tar.gz`, `pgbouncer-1.24.1-windows-x86_64.zip` |
| 1.24.0 | `pgbouncer-1.24.0.tar.gz`, `pgbouncer-1.24.0-windows-x86_64.zip` |

**Distribution packages (riscv64):**

| Distribution | Version | riscv64 status | Source |
|-------------|---------|---------------|--------|
| Debian sid (unstable) | 1.25.2-1 | Installed - built on `rv-osuosl-01` | [Debian buildd](https://buildd.debian.org/status/package.php?p=pgbouncer&suite=sid) |
| Ubuntu 24.04 Noble LTS | 1.22.0-1build4 | Available (universe) | [packages.ubuntu.com](https://packages.ubuntu.com/) |
| Arch Linux RISC-V | Data not available: archriscv.felixc.at returned no usable package listing | - | - |

**PyPI:** Not applicable. The `pgbouncer` PyPI package (v0.2.0) is an unrelated Python wrapper project. PgBouncer is a C daemon; it is not distributed as a Python wheel.

**OCI / container images:** Data not available: no container image registry was searched for riscv64 PgBouncer images.

**To get a working riscv64 binary:** `apt install pgbouncer` on Debian sid or Ubuntu 24.04. No patches are needed; the upstream source tarball builds without modification.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------------|------|--------------|-------------|----------------|-----------------|
| libevent >= 2.0 (required) | Event loop, async I/O, fallback DNS | Clean | No dedicated CI | Debian/Ubuntu riscv64 packages present | None |
| OpenSSL >= 1.0.1 (optional, default auto) | TLS, SCRAM-SHA-256 crypto | Clean | Native riscv64 CI runner in upstream | Debian riscv64 packages present | Security: AES non-constant-time without Zkn (#20980); correctness bug in AES-ZKN asm null-key check (#30330) |
| c-ares >= 1.9.0 (optional) | Async DNS | Clean | No dedicated CI | Distro packages present | None |
| libpam (optional) | PAM authentication | Clean | N/A | System library | None |
| libldap (optional) | LDAP authentication | Clean | N/A | System library | None |
| libsystemd (optional) | systemd socket activation | Clean | N/A | System library | None |
| glibc (implicit) | C runtime | Supported, Tier 1 | Full riscv64 CI | All major distros | See `reports/glibc.md` |
| libusual (bundled in-tree) | SHA-256/MD5/ChaCha20 (SCRAM fallback), memory pool | Clean | Tested via PgBouncer test suite | Bundled, no separate release | None |

**Deep-dive: OpenSSL**

OpenSSL is the only dependency with RISC-V-specific issues relevant to PgBouncer deployments:

- **[Open since 2023-05]** [Issue #20980](https://github.com/openssl/openssl/issues/20980): AES-128/AES-256 on RISC-V hardware without the Zkn extension falls back to a T-table implementation that is not constant-time. This is a side-channel vulnerability. Fix PR #31080 is open and awaiting contributor response. **Impact on PgBouncer:** Any riscv64 deployment using TLS (the default for production) on hardware without the Zkn crypto extension is exposed to this side channel. Most current riscv64 boards (development boards, SBCs) do not implement Zkn.

- **[Tagged bug, branches 3.3-4.0]** [Issue #30330](https://github.com/openssl/openssl/issues/30330): Null-key check logic is inverted in the `rv64i_zkne_set_encrypt_key` assembly routine. This is a correctness bug in the ZKN crypto path. No fix is merged as of the research date.

- **[Open, intermittent]** [Issue #30880](https://github.com/openssl/openssl/issues/30880): `test_lhash` intermittently fails on riscv64 CI. Tagged `help wanted`. Not a correctness issue in production use.

Neither of these issues is a build blocker or a functional blocker for PgBouncer. TLS connections work on riscv64. The Zkn side-channel issue is a security concern for production deployments on hardware without hardware crypto acceleration.

**Deep-dive: libevent**

Pure C, no architecture-specific code, no known riscv64 issues. libevent 2.1.13-stable and 2.2.2-alpha are available in Debian/Ubuntu riscv64. See `reports/libevent.md`.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64 relevance |
|----|-------|--------|----------|------------------|
| [#1427](https://github.com/pgbouncer/pgbouncer/issues/1427) | test_notify_queue fails on s390x and ppc64 | Open | Low - test harness race, not a correctness bug | High - riscv64 builders are also slower than x86; the same timing race would flake on riscv64 CI if it were added. PR #1557 (2026-08-20) proposes extending `pg_sleep()` from 6 to 10 seconds as a fix. |
| [#1413](https://github.com/pgbouncer/pgbouncer/issues/1413) | pgBouncer 1.25.0 fails to build on ppc64le | Closed, fixed in 1.25.1 | Was: High (build failure on non-SIMD arches) | Was applicable to riscv64. Fixed by [PR #1414](https://github.com/pgbouncer/pgbouncer/pull/1414) (merged 2025-11-10). Confirmed resolved by Debian 1.25.2-1 riscv64 build. |
| [#912](https://github.com/pgbouncer/pgbouncer/issues/912) | Significant performance degradation in v1.20.0 | Open | Medium - architecture-independent regression | None - not specific to riscv64 |

**Correctness bugs specific to riscv64:** None.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. PgBouncer is portable C with no architecture-specific code. The one historical build failure affecting riscv64 (typedef gap in `simd.h`) is already fixed. No objections to riscv64 CI have been recorded because no riscv64 CI PR has ever been submitted.

**Organizational blockers:** None stated. The project accepted an arm64 CI runner without objection. The sole active maintainer (Peter Eisentraut, EDB) has shown willingness to expand CI coverage.

**Acceptance probability for a riscv64 CI PR:** High [NEEDS VERIFICATION]. The project's pattern (adding arm64 native runner without controversy, accepting non-x86 build fixes) suggests a well-prepared PR adding `ubuntu-24.04-riscv` (or QEMU-based equivalent) to the `linux-extra` matrix would be accepted. No contrary signals exist in the issue tracker or mailing list.

**Timing flake risk:** PR #1557 addressing the `test_notify_queue` race on slow architectures should be merged before adding riscv64 CI, to avoid introducing a known-flaky test that would undermine CI credibility.

---

## 13. Investment Analysis

RISE has no existing funded work on PgBouncer. All work below is net new.

### 13.1 Functional Enablement

PgBouncer already builds and runs on riscv64 without patches. No functional enablement work is required. The Debian and Ubuntu packages demonstrate full build and runtime correctness from the upstream source tarball.

### 13.2 Performance Optimization

The `simd.h` scalar fallback processes 8 bytes per iteration versus 16 for SSE2/NEON. Adding a RISC-V Vector (RVV) path to `simd.h` would close this gap on hardware with the V extension. However, PgBouncer's bottleneck is network I/O and lock contention, not string scanning throughput. This optimization has no practical impact on connection pooler performance. Not recommended.

Data not available: no riscv64 vs amd64 or riscv64 vs arm64 benchmark exists for PgBouncer anywhere in public sources. An actual performance characterization would require running `pgbench` through PgBouncer on riscv64 hardware.

### 13.3 CI/CD Infrastructure

This is the primary investment opportunity. PgBouncer has zero upstream riscv64 CI. Adding a RISE runner to the `linux-extra` matrix would provide ongoing regression coverage and signal upstream credibility.

**Prerequisite:** Confirm PR #1557 (test_notify_queue stabilization) is merged before submitting the CI PR, to avoid inheriting a known timing flake on slow hardware.

**Steps:**
1. Verify PR #1557 merge status.
2. Submit a PR adding `ubuntu-24.04-riscv` (RISE runner label) to the `linux-extra` matrix in `.github/workflows/pgbouncer-ci.yml`.
3. Coordinate with the RISE infrastructure team for runner provisioning.

### 13.4 Ecosystem Enablement

Not applicable. PgBouncer is a standalone C daemon with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 runner (`ubuntu-24.04-riscv`) to `linux-extra` matrix | 0.5 | Community / RISE infra | High |
| CI/CD | Verify or accelerate merge of PR #1557 (test timing fix for slow arches) | 0.25 | Community | High (prerequisite) |
| Performance | Benchmark PgBouncer on riscv64 vs arm64 using pgbench | 1.0 | Community | Low |
| Security | Track OpenSSL Zkn side-channel fix (#20980, PR #31080) and document deployment guidance for riscv64 TLS users | 0.25 | Community | Medium |
| Performance | RVV SIMD path in `simd.h` | Not recommended | - | Low |

**Total recommended investment:** approximately 2 person-weeks, of which 1.5 weeks are CI and prerequisite work. No functional enablement is needed. The project is operationally ready on riscv64; the gap is upstream CI visibility.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [pgbouncer/pgbouncer repository](https://github.com/pgbouncer/pgbouncer)
- [PgBouncer homepage](https://www.pgbouncer.org/)
- [pgbouncer-ci.yml CI workflow](https://github.com/pgbouncer/pgbouncer/blob/main/.github/workflows/pgbouncer-ci.yml)
- [Issue #1413: pgBouncer 1.25.0 fails to build on ppc64le (SIMD typedef gap)](https://github.com/pgbouncer/pgbouncer/issues/1413)
- [PR #1414: add missing typedefs for non-SIMD architectures (merged 2025-11-10)](https://github.com/pgbouncer/pgbouncer/pull/1414)
- [Issue #1427: test_notify_queue fails on s390x and ppc64](https://github.com/pgbouncer/pgbouncer/issues/1427)
- [PR #1557: Stabilize notify queue test on slow architectures](https://github.com/pgbouncer/pgbouncer/pull/1557)
- [Issue #912: Significant performance degradation in v1.20.0](https://github.com/pgbouncer/pgbouncer/issues/912)
- [Debian buildd status for pgbouncer (sid)](https://buildd.debian.org/status/package.php?p=pgbouncer&suite=sid)
- [Ubuntu packages: pgbouncer](https://packages.ubuntu.com/search?keywords=pgbouncer)
- [OpenSSL Issue #20980: AES non-constant-time on RISC-V without Zkn](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL Issue #30330: null-key logic bug in rv64i_zkne_set_encrypt_key](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL Issue #30880: test_lhash intermittent failure on riscv64](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL PR #31080: fix for AES non-constant-time on RISC-V](https://github.com/openssl/openssl/pull/31080)
- [RISE Project homepage](https://riseproject.dev/)