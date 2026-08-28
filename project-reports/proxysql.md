---
title: ProxySQL
parent: Project Reports
---

# ProxySQL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for ProxySQL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

ProxySQL is a high-performance, protocol-aware TCP proxy for MySQL and MariaDB. It performs connection multiplexing, query routing, load balancing, query caching, and firewall functions at the MySQL wire-protocol level. It is a critical piece of infrastructure in large-scale MySQL deployments where the application tier cannot manage database connection counts directly.

**Governance:** ProxySQL is governed entirely by ProxySQL LLC. There is no foundation affiliation (not CNCF, Apache, or Linux Foundation), no steering committee, and no community governance body. The IP assignment CLA (automated via cla-assistant.io, modeled on the ASF CLA) assigns rights to ProxySQL LLC. All decisions on architecture support, release policy, and feature acceptance are internal.

**License:** GPL-3.0 (community edition). Commercial Professional and Enterprise tiers exist on top.

**Corporate maintainers:** The contributor base is almost entirely internal to ProxySQL/SysOwn. Top committers by count: Rene Cannao (renecannao, 7,538 commits, founder), Javier Jaramago Fernandez (JavierJF, 1,170 commits, ProxySQL), Rahim Kanji (rahim-kanji, 954 commits). External contributors average under 10 commits each. Percona is an ecosystem partner but not a code contributor.

**Release tiers (v3/v4):**

- Stable (v3.0.x): conservative, long-support.
- Innovative (v3.1.x): stable plus FFTO and TSDB.
- AI/MCP (v4.0.x): all features including AI/MCP plugin chassis.

**Community culture on new ports:** Architecture support decisions have been static at amd64 + arm64 since 2020. No RISC-V issue or request has been filed by any community member. The CLA requirement and single-company governance create a high barrier for community-driven port efforts: all merges require CLA signing and internal approval. There is no public roadmap item for RISC-V.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-29 | ARM64 (aarch64) support introduced in v2.0.15; packages for ARM64 including repository packages and Docker Hub images shipped | [v2.0.15 release notes](https://github.com/sysown/proxysql/releases/tag/v2.0.15) |
| 2025-07-08 | PR #5034 opened by community contributor pengjunjie2100: adds riscv64 Makefile packaging targets and documents OS versions for riscv64 compilation | [PR #5034](https://github.com/sysown/proxysql/pull/5034) |
| 2025-07-08 | Maintainer renecannao responds asking an admin to verify; no further maintainer action | [PR #5034 comment](https://github.com/sysown/proxysql/pull/5034) |
| 2025-09-30 | Last update to PR #5034; still in triage, unmerged | [PR #5034](https://github.com/sysown/proxysql/pull/5034) |
| 2026-07-31 | v4.0.10 released; binaries for amd64 and arm64 only; riscv64 absent | [v4.0.10 release](https://github.com/sysown/proxysql/releases/tag/v4.0.10) |

**Key contributors on riscv64:** pengjunjie2100 (external, no other activity in the repo). No ProxySQL LLC employee has committed any riscv64 work.

**Upstream status:** No riscv64 work is merged. The single community contribution (PR #5034) is documentation and Makefile targets only -- no binary, no CI, no code. It is not upstream.

---

## 3. Upstream Support Tier

**Formal tier policy:** ProxySQL LLC publishes no written policy on adding new CPU architectures. Architecture expansion (amd64 -> arm64 in 2020) was driven by internal ProxySQL LLC decisions, not community requests. No equivalent decision has been made for riscv64.

**Evidence of tier by architecture:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Binary releases (RPM, DEB, tar.gz) | Yes | Yes | No |
| CI runners in upstream repo | ubuntu-latest, ubuntu-24.04 | ubuntu-24.04-arm | None |
| Official Docker images | Yes | Yes | No |
| Distro packages (Debian/Ubuntu) | Not in Debian/Ubuntu | Not in Debian/Ubuntu | Not in Debian/Ubuntu |
| Package build Makefile targets | amd64-* | arm64-* | riscv64-* (unmerged PR only) |
| Documented as supported | Yes | Yes | No |

ProxySQL is not packaged in Debian, Ubuntu, or Arch Linux for any architecture. All official binaries are shipped via the upstream GitHub releases page and the proxysql.com repository. riscv64 is entirely absent.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

ProxySQL is written in C++17. The core functionality -- connection pooling, query routing, query firewall, load balancing, multiplexing -- is pure portable C++ with no architecture-specific SIMD or assembly in the core logic.

**Architecture-specific components identified:**

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Coredump generation | `lib/proxysql_coredump.cpp` | Supported (coredumper lib, `__i386__` or `__x86_64__` guard) | Partial (`__ARM_ARCH_3__` covered, not arm64) | Missing (excluded by arch guard, silently disabled) |
| Valgrind instrumentation headers | `include/valgrind.h` (vendored) | Full (`PLAT_amd64_linux`) | Partial (`PLAT_arm_linux` for 32-bit ARM only) | Missing (not in dispatch table; would emit `#error` at compile time if macros invoked) |
| Coroutine context switching | `deps/mariadb-client-library/ma_context.h` | Yes (ucontext dispatch) | Yes (aarch64 ucontext path in upstream MariaDB Connector/C) | Untested (upstream MariaDB Connector/C has riscv64 ucontext support, but ProxySQL's patch does not test or validate it) |
| Packaging build targets | `Makefile` | amd64-* targets | arm64-* targets | riscv64-* (unmerged PR #5034 only) |
| SIMD intrinsics | repo-wide | None | None | None |
| Assembly files (.S) | repo-wide | None | None | None |
| JIT backend | repo-wide | None | None | None |

**Assessment:** ProxySQL has no custom SIMD, no JIT, and no hand-tuned assembly anywhere in its own source code. Architecture sensitivity is confined to three areas: coredump capture (feature disabled on riscv64), Valgrind client headers (compile-time error risk), and context switching in the vendored MariaDB Connector/C dependency.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make at the top level (no CMakeLists.txt at root). Sub-Makefiles in `deps/`, `lib/`, `src/`. CMake is used internally by bundled dependencies (notably mariadb-connector-c).

**Compiler minimum:** C++17, enforced at configure time:

```makefile
CPLUSPLUS := $(shell ${CC} -std=c++17 -dM -E -x c++ /dev/null 2>/dev/null | grep -F __cplusplus | egrep -o '[0-9]{6}L')
ifneq ($(CPLUSPLUS),201703L)
    $(error Compiler must support at least c++17)
endif
```

GCC 7+ or Clang 5+ satisfies this. Ubuntu 24.04 ships GCC 13; AlmaLinux 9 ships GCC 11. GCC 13 on riscv64 is available in Ubuntu 24.04.

**Standard native riscv64 build commands (if attempted):**

```bash
make build_deps -j$(nproc)
make build_lib -j$(nproc)
make build_src -j$(nproc)
sudo make install
```

**Key riscv64 build knobs:**

- `NOJEMALLOC=1 make` -- disables bundled jemalloc (recommended for riscv64 bring-up; see jemalloc issue below).
- `JE_LG_PAGE=12 make build_deps` -- sets 4KB page size for jemalloc cross-compilation (Linux/riscv64 default; required only when cross-compiling from a host with a different page size).

**Known build failures on riscv64:**

1. **jemalloc 5.2.0 `./configure` failure:** ProxySQL vendors jemalloc 5.2.0. The `riscv64gc` toolchain triple is not recognized by the `config.sub` shipped in 5.2.0 -- that fix landed in 5.3.1. On a GCC riscv64-linux-gnu toolchain, `./configure` may fail with "Invalid configuration." Workaround: `NOJEMALLOC=1`. No in-tree fix has been applied.

2. **coredumper build failure:** `coredumper` is a Linux-only mandatory dependency (`ifeq ($(UNAME_S),Linux)` adds it unconditionally; no `-DUSE_COREDUMPER=OFF` equivalent exists in the Makefile). The coredumper library is x86/x86-64/ARM-centric upstream. If the coredumper CMake build fails on riscv64, the `build_deps` step fails entirely. No skip flag is documented. This is a hard build blocker absent a patch or fork.

3. **Valgrind header `#error`:** If any translation unit exercises the vendored `include/valgrind.h` platform dispatch on riscv64 (which is not in the table), compilation fails with `#error "Valgrind client interface not supported on this platform"`. This depends on which macros are exercised. [NEEDS VERIFICATION -- actual compilation test on riscv64 not performed.]

**QEMU usage:** Not documented anywhere in the repo. No Dockerfile or CI workflow uses QEMU for riscv64.

**Required apt packages for Debian/Ubuntu build:**

```bash
apt-get install -y automake bzip2 cmake make g++ gcc git openssl libssl-dev \
    libgnutls28-dev libmysqlclient-dev libunwind8 libunwind-dev uuid-dev \
    libncurses-dev libicu-dev libevent-dev libtirpc-dev
```

Note: `libunwind` is listed as a dependency. On riscv64, `libunwind` is available but less mature than on x86-64/aarch64 -- unwinding across signal boundaries can be unreliable. This does not affect normal operation.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Connection pooling and multiplexing | Full | Full | Full (portable C++) |
| Query routing and firewall | Full | Full | Full (portable C++) |
| MySQL/MariaDB protocol handling | Full | Full | Full (portable C++) |
| PostgreSQL protocol (v4.0.x) | Full | Full | Full (portable C++) |
| MCP/AI plugin chassis (v4.0.x) | Full | Full | Blocked (protobuf upstream refusal) |
| Coredump capture | Full | Partial (ARM_ARCH_3 only, not arm64) | Missing (silently disabled by arch guard) |
| Valgrind instrumentation | Full | Partial (32-bit ARM only) | Missing (compile error if invoked) |
| NOJEMALLOC scalar allocator | Available | Available | Recommended as workaround |
| Binary packages | RPM, DEB, tar.gz | RPM, DEB, tar.gz | None |
| Docker images | Yes | Yes | No |
| ASAN/TSAN builds | Yes (with NOJEMALLOC=1) | Yes (with NOJEMALLOC=1) | Untested |

**Functional gaps:**

- Coredump capture is disabled on riscv64 by the `__i386__ || __x86_64__ || __ARM_ARCH_3__ || __mips__` guard in `lib/proxysql_coredump.cpp`. The feature silently does not compile in rather than emitting an error -- crash forensics would be unavailable.
- The MCP/AI plugin chassis (PROXYSQL40 tier) links protobuf. Upstream protobuf maintainers state riscv64 is "not on our roadmap" ([issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798)). The `-latomic` link workaround ([issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549)) allows compilation via distro-packaged protobuf, but there are no upstream binary releases for riscv64.

**Performance gaps:**

- No SIMD anywhere in ProxySQL's own code. The only performance-sensitive architecture-specific code is in dependencies (jemalloc allocator, OpenSSL crypto, LZ4/zstd compression). All of those fall back to scalar paths on riscv64 with correctness intact.
- cityhash (query fingerprinting): SSE4.2 path is skipped on riscv64; falls to portable CRC32 path. Performance impact on query routing throughput is unknown without a benchmark.

**Benchmark data:** Data not available: no ProxySQL riscv64 vs amd64 or arm64 throughput benchmarks were found in any public source (GitHub issues, RISE publications, web search).

**NaN/floating-point issues:** Data not available: no floating-point-specific riscv64 issues were found in the ProxySQL issue tracker (0 results for relevant queries).

---

## 7. CI/CD Infrastructure

**riscv64 CI status: None.**

Confirmed by exhaustive inspection of all 260+ files in `.github/workflows/`, the `GH-Actions` branch, and the absence of any QEMU or Docker `linux/riscv64` platform flags anywhere in the repository.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions runner | ubuntu-latest, ubuntu-24.04 | ubuntu-24.04-arm | None |
| Self-hosted runner | proxysql-ci (internal) | None documented | None |
| QEMU emulation | N/A | N/A | None |
| Docker buildx multi-arch | linux/amd64 | linux/arm64 | None |
| Build CI | Yes | Yes | No |
| Test CI | Yes | No (build only via arm runner) | No |
| Package build CI | Yes (CI-package-*-ubuntu24.yml) | Yes (CI-package-arm64-ubuntu24.yml) | No |

**RISE runners:** ProxySQL is not listed among projects using RISE RISC-V GitHub Actions runners. The RISE "six weeks in" post (May 2026) lists 197 repos; ProxySQL is not among them. No RISE blog post or publication mentions ProxySQL.

---

## 8. Distribution and Release Status

**Upstream binaries:** ProxySQL releases (v3.0.x, v3.1.x, v4.0.x) ship RPM, DEB, and tar.gz for x86_64/amd64 and aarch64/arm64 only. Zero riscv64 assets in any release from v4.0.10 back through all checked versions.

**Distro packaging:**

| Distribution | riscv64 Package | Status |
|---|---|---|
| Debian | Not packaged (tracker.debian.org/pkg/proxysql -> 404) | Absent |
| Ubuntu 24.04 (noble) | Not in Ubuntu archive | Absent |
| Arch Linux RISC-V (archriscv.felixc.at) | Not listed | Absent |
| PyPI | No proxysql package (pypi.org/pypi/proxysql/json -> 404) | Absent |
| RISE wheel builder | Not listed (no PyPI package) | Absent |

**What a user must do to get a working binary on riscv64:**

1. Build from source on a native riscv64 host or via cross-compilation.
2. Apply `NOJEMALLOC=1` to work around the jemalloc 5.2.0 config.sub issue.
3. Patch or skip the coredumper dependency (no upstream skip flag exists; requires Makefile modification).
4. Resolve the coredumper CMake build on riscv64 manually.
5. No packaged path exists.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| OpenSSL | TLS/crypto | Green | Green (cross-CI on GHA) | Green (Debian sid, Ubuntu 24.04) | No |
| jemalloc 5.2.0 (pinned) | Memory allocator | Amber (config.sub failure on riscv64gc triple) | Red (no CI) | N/A (source only) | Yes (build blocker; workaround: NOJEMALLOC=1) |
| MariaDB Connector/C 3.3.8 (pinned) | MySQL wire protocol | Amber (lib path fix in 3.4.9, not 3.3.8) | Red (no CI) | N/A | No (functional; install path may deviate) |
| re2 | Query routing regex | Green | Green | Green (Debian/Ubuntu) | No |
| SQLite3 | Internal stats/admin DB | Green | Green | Green (Debian/Ubuntu) | No |
| PCRE (v1, bundled) | Query routing legacy regex | Green (sljit riscv64 JIT since Jul 2022) | Amber (PCRE1 CI matrix unknown) | Green (Debian libpcre3-dev) | No |
| LZ4 | MySQL compressed protocol | Green (QEMU CI since Oct 2023) | Green | Green (Debian/Ubuntu) | No |
| zstd | MySQL/PostgreSQL compression | Green (QEMU CI, RVV CI since Jul 2025) | Green | Green (Debian/Ubuntu) | No |
| libcurl | Health check HTTP client | Green (cross-compile CI) | Amber (build-only, no test execution on riscv64) | Amber (Debian sid only, not stable) | No |
| libev | Async I/O event loop | Green (pure C, no arch code) | Unknown (no GitHub repo; no CI data) | Green (Debian/Ubuntu) | No |
| cityhash | Query fingerprinting | Green (SSE4.2 falls back to portable) | Unknown (no active maintenance) | Green | No |
| libmicrohttpd | Admin HTTP API | Green (pure C) | Unknown | Green (Debian/Ubuntu) | No |
| prometheus-cpp | Metrics exposition | Green (pure C++) | Unknown | Green | No |
| coredumper (Linux-only) | Crash capture | Red (x86/ARM-centric; no skip flag in Makefile) | Red | N/A | Yes (build blocker if CMake fails; no upstream bypass) |
| protobuf 3.21.12 (PROXYSQL40 tier) | Plugin chassis serialization | Amber (-latomic workaround; scalar only) | Red (upstream explicitly unsupported) | Amber (Debian sid only) | Partial (blocks PROXYSQL40 tier; not needed for v3.x) |
| libunwind | Stack unwinding (crash reporting) | Amber (available but signal-boundary reliability lower than x86/arm64) | Unknown | Green (Debian/Ubuntu) | No |

### Deep Dives

**jemalloc (pinned 5.2.0):** The critical blocker. ProxySQL's `deps/Makefile` vendors jemalloc 5.2.0; upstream current is 5.3.1. The `riscv64gc` toolchain triple recognition fix landed in 5.3.1 (commit c51949e, March 2026). On a standard GCC riscv64-linux-gnu toolchain, `./configure` inside the bundled jemalloc may fail. [Issue #2399](https://github.com/jemalloc/jemalloc/issues/2399) (cross-build riscv64, open since March 2023) has received zero maintainer response. The `NOJEMALLOC=1` workaround causes ProxySQL to link against the system jemalloc, which may be a different version. See `project-reports/jemalloc.md`.

**coredumper:** The `deps/Makefile` adds `coredumper` unconditionally for all Linux builds (`ifeq ($(UNAME_S),Linux)`). There is no `-DUSE_COREDUMPER=OFF` cmake flag and no `NOCOREDUMPER=1` make variable in the ProxySQL build system. If coredumper's CMake configuration fails on riscv64 (expected given its x86/ARM-centric history), `make build_deps` fails and the entire build stops. This requires a Makefile patch to add a skip path.

**OpenSSL:** Fully ported to riscv64 with assembly optimizations (RV64I, Zbb, Zbc, Zkn, Zvk, RVV). Green on all fronts. The musl ISA-detection bug ([#28118](https://github.com/openssl/openssl/issues/28118)) affects musl-linked builds only; ProxySQL targets glibc-based distros. See `project-reports/openssl.md`.

**MariaDB Connector/C (pinned 3.3.8):** Compiles via generic CMake/C path. The riscv64 `lib64` install path fix landed in 3.4.9 but ProxySQL pins 3.3.8. No correctness blocker -- scalar fallback works. Library install path may deviate on riscv64, requiring a manual override or patch. See `project-reports/mariadb-connector-c.md`.

**protobuf (PROXYSQL40 tier only):** Upstream maintainers explicitly state riscv64 is "not on our roadmap" ([#17798](https://github.com/protocolbuffers/protobuf/issues/17798)). The `-latomic` linker workaround ([#14549](https://github.com/protocolbuffers/protobuf/issues/14549)) allows compilation from distro-packaged protobuf. Blocks only the v4.0.x plugin chassis tier. v3.x builds are unaffected. See `project-reports/protocol-buffers.md`.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #5034](https://github.com/sysown/proxysql/pull/5034) | Add OS information that supports riscv64 | Open, triage | Documentation | Adds riscv64 Makefile packaging targets; has a known bug (riscv64-almalinux not wired into riscv64-packages); stalled since 2025-09-30; no maintainer approval |
| N/A | coredumper unconditional Linux dep | N/A (no issue filed) | Build blocker | No skip flag in ProxySQL Makefile; fails riscv64 build if coredumper CMake fails |
| N/A | jemalloc pinned at 5.2.0 | N/A (no issue filed in ProxySQL repo) | Build blocker | riscv64gc triple fix requires 5.3.1+; workaround: NOJEMALLOC=1 |
| [jemalloc #2399](https://github.com/jemalloc/jemalloc/issues/2399) | jemalloc cross-build riscv64 | Open (zero maintainer response since Mar 2023) | High (build) | Upstream zero traction; affects ProxySQL's pinned 5.2.0 |
| [protobuf #17798](https://github.com/protocolbuffers/protobuf/issues/17798) | riscv64 upstream refusal | Closed (maintainer wontfix) | High (PROXYSQL40 tier) | Affects v4.0.x plugin chassis only |
| [protobuf #14549](https://github.com/protocolbuffers/protobuf/issues/14549) | -latomic link failure on riscv64 | Open | Medium | Workaround available; build succeeds with distro protobuf |

**Correctness bugs on riscv64:** None found. Zero riscv64 correctness issues in the ProxySQL issue tracker.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

- Single-company governance (ProxySQL LLC) with CLA requirement. Any community contribution requires CLA signing and internal maintainer approval. PR #5034 (Makefile targets) has been in triage since July 2025 with no action. The founder asked an admin to review it and then went silent.
- No public roadmap for riscv64. No RISC-V issue has ever been filed by a ProxySQL team member.
- Architecture list has been static at amd64 + arm64 for six years (since arm64 was added in October 2020).

**Technical blockers:**

1. coredumper: mandatory Linux dependency with no upstream skip flag. Requires a patch to the ProxySQL Makefile to add a conditional or bypass.
2. jemalloc 5.2.0: pinned version does not recognize riscv64gc triple. Workaround (NOJEMALLOC=1) exists but uses system allocator rather than the tuned bundled version.
3. protobuf (v4.0.x only): upstream maintainer refusal to support riscv64 means the PROXYSQL40 plugin chassis tier cannot be built from upstream binaries; requires distro-packaged protobuf with the -latomic workaround.

**Acceptance probability:** Low without direct ProxySQL LLC engagement. The CLA and single-company governance mean a community RISC-V port cannot be merged without ProxySQL LLC interest. The stalled PR #5034 (13+ months in triage with zero action) is the clearest signal of current maintainer priority.

---

## 13. Investment Analysis

RISE has no involvement with ProxySQL. No prior funded work exists to account for.

### 13.1 Functional Enablement

The core proxy (connection pooling, query routing, multiplexing, MySQL/MariaDB protocol) is portable C++ and will compile and run correctly on riscv64 once the build blockers are resolved. The functional work is build-system repair, not porting.

Required work:
- Patch the ProxySQL Makefile to add a conditional skip for coredumper on non-supported architectures (`NOCOREDUMPER=1` or an `ifeq ($(SYS_ARCH),riscv64)` guard).
- Update jemalloc from 5.2.0 to 5.3.1 in `deps/` or apply the `config.sub` patch from 5.3.1 to the vendored 5.2.0.
- Fix the PR #5034 bug: wire `riscv64-almalinux` into `riscv64-packages`.
- Validate that the vendored valgrind.h macros are not invoked on riscv64 (confirm no compile-time `#error`).
- Build and smoke-test on Ubuntu 24.04 riscv64 with a live MySQL instance.

### 13.2 Performance Optimization

ProxySQL's own code has no SIMD and no JIT. Performance on riscv64 relative to arm64 is determined entirely by:
- jemalloc allocation performance (recoverable once 5.3.1 is vendored).
- cityhash CRC32 vs SSE4.2 (portable path, performance gap unknown without benchmarks).
- OpenSSL crypto throughput (RVV-accelerated; already upstream; not a ProxySQL work item).

No ProxySQL-specific performance optimization work is indicated until functional enablement is complete and baseline benchmarks exist.

Data not available: no riscv64 vs arm64 throughput benchmarks for ProxySQL in any public source.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI exists. Adding CI requires either RISE runners or QEMU-based emulation. Given that the maintainer has not approved even a documentation PR in 13 months, adding CI requires ProxySQL LLC buy-in or a fork.

If ProxySQL LLC engagement is secured, CI additions mirror the existing `CI-package-arm64-ubuntu24.yml` structure with a riscv64 runner.

### 13.4 Ecosystem Enablement

ProxySQL has no package ecosystem (no plugins, no extensions, no dependent packages). Section 10 is omitted per scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch Makefile: add NOCOREDUMPER=1 skip flag and riscv64 guard | 0.5 | Contributor + ProxySQL LLC review | Critical |
| Functional | Vendor jemalloc 5.3.1 (or backport config.sub patch to 5.2.0) | 1 | Contributor + ProxySQL LLC review | Critical |
| Functional | Fix PR #5034 bug (wire riscv64-almalinux into riscv64-packages) | 0.2 | pengjunjie2100 or any contributor | High |
| Functional | Build and smoke-test on Ubuntu 24.04 riscv64 with live MySQL | 1 | Contributor | Critical |
| Functional | Validate valgrind.h riscv64 compile path (confirm no #error) | 0.5 | Contributor | High |
| CI/CD | Add riscv64 build CI (GitHub Actions + RISE runner or QEMU) | 2 | Contributor + ProxySQL LLC approval | High |
| CI/CD | Add riscv64 package build targets to release pipeline | 1 | ProxySQL LLC | Medium |
| Functional | Engage ProxySQL LLC: CLA path, roadmap inclusion, maintainer assignment | 3 (BD/eng combined) | Chip company BD + Contributor | Critical (gates all other items) |
| Performance | Baseline benchmark: proxysql riscv64 vs arm64 throughput and latency | 2 | Contributor | Medium (after functional complete) |

**Total functional enablement (excluding BD/engagement):** approximately 5-6 person-weeks of engineering, contingent on ProxySQL LLC approval to merge.

**Gating dependency:** ProxySQL LLC engagement is the critical path. Without maintainer buy-in, patches can be maintained as an out-of-tree fork but cannot be shipped as an official ProxySQL build. The 13-month stall on PR #5034 (a trivial documentation change) indicates that without direct relationship engagement, upstream acceptance is unlikely on any timeline relevant to a chip company investment decision.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [ProxySQL GitHub repository (sysown/proxysql)](https://github.com/sysown/proxysql)
- [ProxySQL homepage](https://proxysql.com/)
- [PR #5034: Add OS information that supports riscv64](https://github.com/sysown/proxysql/pull/5034)
- [ProxySQL v4.0.10 release (July 2026)](https://github.com/sysown/proxysql/releases/tag/v4.0.10)
- [ProxySQL v2.0.15 release: ARM64 support introduction (October 2020)](https://github.com/sysown/proxysql/releases/tag/v2.0.15)
- [jemalloc issue #2399: cross-build riscv64 (open since March 2023)](https://github.com/jemalloc/jemalloc/issues/2399)
- [protobuf issue #17798: riscv64 upstream refusal](https://github.com/protocolbuffers/protobuf/issues/17798)
- [protobuf issue #14549: -latomic link failure on riscv64](https://github.com/protocolbuffers/protobuf/issues/14549)
- [OpenSSL issue #28118: musl ISA-detection bug on riscv64](https://github.com/openssl/openssl/issues/28118)
- [MariaDB Connector/C PR #295: riscv64 lib64 path fix (December 2025)](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295)
- [Debian tracker: proxysql (404 -- not packaged)](https://tracker.debian.org/pkg/proxysql)
- [Ubuntu 24.04 package search: proxysql (absent)](https://packages.ubuntu.com/search?keywords=ProxySQL&suite=noble)
- [Arch Linux RISC-V package search: proxysql (absent)](https://archriscv.felixc.at/?q=proxysql)
- [PyPI proxysql (404 -- no package)](https://pypi.org/pypi/proxysql/json)