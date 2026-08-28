---
title: RedisJSON
parent: Project Reports
---

# RedisJSON

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for RedisJSON<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

RedisJSON is a Redis module that implements the JSON data type for Redis. It is written entirely in Rust and compiled to a shared library (`librejson.so`) that is dynamically loaded into the Redis server process at startup. As of Redis 8, the JSON data type has been integrated into the main `redis/redis` repository; the standalone `RedisJSON/RedisJSON` module continues to track that integration.

The project is fully vendor-controlled by Redis Ltd. There is no neutral foundation governance (no Linux Foundation, CNCF, or Apache affiliation). All contributions require a Redis Software Grant and Contributor License Agreement assigning IP to Redis Ltd. There is no `MAINTAINERS` or `CODEOWNERS` file; core decisions are made inside Redis Ltd. Feature requests require pre-approval from project leads before coding begins. Community interaction occurs via Discord and Stack Overflow, not GitHub issues.

All active committers hold Redis Ltd. positions. The top contributors by commit count are Aviv David, Tom Gabsow, Tal Bar Yakar, Ephraim Feldblum, Liran Abir, and Gal Cohen, all Redis Ltd. employees. External community contributors account for approximately one commit each across the recorded history.

The community posture toward new architecture ports is effectively passive. The sole riscv64 issue has remained open and unresolved since September 2022. There is no stated platform tier policy, no `PLATFORMS.md` or `SUPPORT.md`, and no public roadmap referencing riscv64. The implicit organizational position is that riscv64 will not be supported unless Redis Ltd. decides to prioritize it internally.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-09-28 | Community user lecndav opens [Issue #830](https://github.com/RedisJSON/RedisJSON/issues/830): cross-compile to `riscv64gc-unknown-linux-gnu` fails at `bindgen`/`libclang` step | GitHub |
| 2022-12-12 | Redis maintainer rafie responds asking for access to a riscv64 machine | GitHub Issue #830 |
| 2022-12-13 | Reporter suggests riscv-gnu-toolchain and a commercial RISC-V SBC; no further maintainer activity | GitHub Issue #830 |
| 2026-06-17 (report date) | Issue #830 remains open with no commits, no PRs, and no CI additions for riscv64 | GitHub |

No contributor organization has driven a RISC-V port. RISE Project has no funded work on RedisJSON; a search of the RISE blog (34 posts, May 2024 through August 2026) returned no reference to RedisJSON, Redis, or databases. The RISE wheel builder does not list RedisJSON.

There is no riscv64 port. Nothing has been upstreamed.

---

## 3. Upstream Support Tier

RedisJSON has no formal published platform support tier document. The evidence from CI and releases establishes the de facto tiers:

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named in CI matrix | Yes (`x64` in `flow-linux.yml`) | Yes (`arm64` in `flow-linux.yml`) | No |
| CI runner available | `ubuntu-latest` | `ubuntu24-arm64-4-16` (self-hosted) | No |
| Official binary packages | Yes (Redis Stack bundles) | Yes (Redis Stack bundles) | No |
| Docker image | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |
| Release-blocking CI | Yes | Yes | N/A |
| Build known to work | Yes | Yes | No (fails at bindgen step) |

amd64 and arm64 are first-class supported targets. riscv64 is not a supported target by any criterion.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RedisJSON is a pure-Rust project with no JIT compiler, no SIMD intrinsics, no inline assembly, no crypto acceleration, and no GC barriers. A search across the entire repository for `target_arch`, `cfg(target_arch`, `vfloat32m1_t`, `rvv`, and similar patterns returned zero architecture-specific results. The one hit for `target_arch` is a `Makefile` line using `rustc --print cfg` to detect the host triple at build time, not conditional compilation.

The codebase consists of two crates: `redis_json` (the module entry point and command implementation) and `json_path` (a JSONPath engine using a PEG grammar). Neither crate contains architecture-specific code.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core JSON store (redis_json/) | scalar (portable Rust) | scalar (portable Rust) | scalar (portable Rust) - build untested |
| JSONPath engine (json_path/) | scalar (portable Rust) | scalar (portable Rust) | scalar (portable Rust) - build untested |
| C API header (rejson_api.h) | portable | portable | portable |
| C test module (module.c) | portable | portable | portable |
| SIMD | none | none | none (not applicable) |
| JIT | none | none | none (not applicable) |
| Inline assembly | none | none | none (not applicable) |
| Cryptography | none | none | none (not applicable) |

The architecture gap is entirely in the build toolchain (Section 5), not in missing riscv64 implementations. The Rust source itself is portable.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Rust/Cargo only. No CMake. The project does not use autotools. The entry point is `make build`, which runs `cargo build --all --all-targets --release` and copies `target/release/librejson.so` to `bin/linux-x64-release/rejson.so`.

**Toolchain pin:** `/rust-toolchain.toml` pins `channel = "1.92"`. `riscv64gc-unknown-linux-gnu` is a Tier 2 target in Rust 1.92.

**`.cargo/config.toml` content:**

```toml
[target.x86_64-unknown-linux-gnu]
rustflags = ["-L", "deps/readies/wd40/linux-x64"]

[target.'cfg(target_env = "musl")']
rustflags = ["-C", "target-feature=-crt-static"]
```

There is no `[target.riscv64gc-unknown-linux-gnu]` section. The `linux-x64` linker path is scoped to `x86_64-unknown-linux-gnu` and would not interfere with a riscv64 cross-build. No QEMU usage is referenced anywhere in the repository.

**Known build failure for riscv64:** [Issue #830](https://github.com/RedisJSON/RedisJSON/issues/830) (open since 2022-09-28). The failure occurs during `redismodule-rs` build, which invokes `bindgen` to generate Rust FFI bindings from `redismodule.h`. The sequence of failures:

1. Using the host (x86-64) `libclang.so`: fails with `error: unknown target triple 'riscv64gc-unknown-linux-gnu'`. The host LLVM 12 does not recognize the `gc` suffix in the riscv64 triple.
2. Using a riscv64-compiled `libclang.so.12` with `LIBCLANG_PATH` set: fails with `cannot open shared object file: No such file or directory`. The x86-64 host process cannot `dlopen()` a riscv64 ELF shared library.

The root cause is that `bindgen` requires a host-architecture `libclang` that also understands the target triple. The fix was merged into bindgen upstream as [rust-lang/rust-bindgen#2137](https://github.com/rust-lang/rust-bindgen/pull/2137) on 2022-01-29 and shipped in `bindgen 0.60.0`. However, the RedisJSON `Cargo.lock` pins `bindgen = 0.22.1`, which predates the fix. Updating the `bindgen` transitive dependency (routed through `redismodule-rs`) is required before any riscv64 build can succeed.

The same structural issue affects ARMv7 cross-compilation ([Issue #471](https://github.com/RedisJSON/RedisJSON/issues/471), [Issue #475](https://github.com/RedisJSON/RedisJSON/issues/475), both closed with community workarounds only, no upstream fix). Cross-compilation has been officially unsupported and undocumented since at least 2023 ([Issue #1148](https://github.com/RedisJSON/RedisJSON/issues/1148), open since 2023-11-29, zero responses).

**Steps required for a cross-compilation attempt:**

1. `rustup target add riscv64gc-unknown-linux-gnu --toolchain 1.92`
2. `apt-get install gcc-riscv64-linux-gnu` for the GNU cross-linker
3. Add to `.cargo/config.toml`:
   ```toml
   [target.riscv64gc-unknown-linux-gnu]
   linker = "riscv64-linux-gnu-gcc"
   ```
4. Update the `bindgen` transitive dependency to >= 0.60.0
5. `cargo build --release --target riscv64gc-unknown-linux-gnu`

Steps 4 requires a dependency version bump in `redismodule-rs`, which is a Redis Ltd.-owned project. No such bump has been submitted.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the codebase is architecturally neutral Rust with no SIMD and no JIT, there are no functional feature gaps conditional on architecture. Every JSON command (`JSON.GET`, `JSON.SET`, `JSON.DEL`, `JSON.ARRAPPEND`, `JSON.NUMINCRBY`, etc.) would behave identically on riscv64 if the project built successfully.

| Category | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All JSON commands | Available | Available | Unavailable (build fails) |
| SIMD acceleration | None | None | None |
| JIT compilation | None | None | None |
| Float16 storage (half crate) | Available | Available | Would be available (pure Rust) |
| zstd compression (internal) | Available | Available | Would be available (zstd has RVV CI) |
| Large integer precision | Loss (Issue #1216, all arches) | Loss (Issue #1216, all arches) | Would show same loss |
| Key expiration crash (Issue #1555) | Affected | Affected | Would be affected |

Performance gaps relative to amd64 and arm64 are not quantifiable: no riscv64 RedisJSON benchmark data exists. The Redis core benchmarks (Sections 8 and 13) from redis/redis PRs provide directional data for the host process but not for the JSON module workload specifically.

---

## 7. CI/CD Infrastructure

All 25 workflow files in `.github/workflows/` were inspected. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` was found.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ubuntu-latest) | Yes (ubuntu24-arm64-4-16) | No |
| Test CI | Yes | Yes | No |
| Nightly CI | Yes (event-nightly.yml) | Yes | No |
| Memory/sanitizer CI | Yes (flow-sanitizer.yml, flow-memory-nightly.yml) | No [NEEDS VERIFICATION] | No |
| Benchmark CI | Yes (benchmark-flow.yml, AWS EC2 x86_64) | No | No |
| Docker image build | Yes (linux/amd64) | Yes (linux/arm64) | No |
| QEMU emulation | No | No | No |
| RISE CI runners | No | No | No |

The `flow-linux.yml` `arch` input accepts exactly two values: `x64` and `arm64`. The `push-docker-images.yml` calls `add_platform` for `linux/amd64` and `linux/arm64` only. No riscv, riscv64, or RISCV string appears in any workflow file.

---

## 8. Distribution and Release Status

RedisJSON distributes pre-built binaries as part of Redis Stack bundles (amd64 and arm64 only). The GitHub releases for `RedisJSON/RedisJSON` carry zero binary assets; all five checked releases (v2.8.19, v2.6.24, v2.4.19, v2.8.16, v2.8.15) have an empty assets array.

| Distribution channel | riscv64 available |
|---|---|
| GitHub releases (RedisJSON/RedisJSON) | No - zero assets on all releases |
| Redis Stack bundles | No - amd64 and arm64 only |
| PyPI (redisjson) | No - package does not exist (HTTP 404) |
| Ubuntu noble packages | No - not packaged |
| Debian packages | No - not tracked (HTTP 404 on tracker) |
| Arch Linux RISC-V mirror | No - not packaged |
| RISE wheel builder | No - not listed |
| Docker Hub | No - linux/amd64 and linux/arm64 only |

To obtain a working riscv64 binary, a user must: fix the `bindgen` version pin, configure a riscv64 cross-compiler, build from source, and separately obtain a riscv64 Redis 8 binary to host the module. No supported path exists today.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Redis | Host process; loads librejson.so | Builds (scalar C); no riscv64 CI | No upstream CI; community-tested | No official riscv64 binaries | See project-reports/redis.md |
| redismodule-rs v2.1.3 | Rust FFI bindings to Redis Modules C API | Blocked (bindgen/libclang triple mismatch) | Not tested | Not released | Root cause of Issue #830 |
| bindgen (pinned 0.22.1) | C-to-Rust FFI codegen; requires libclang at build time | Broken at pinned version; fixed in >= 0.60.0 | N/A | N/A | Fix predates current pin by ~4 years |
| clang-sys (pinned 0.2.2) | libclang dynamic loader used by bindgen | No riscv64-specific issues post-bindgen-fix | N/A | N/A | Requires libclang-dev on host |
| ijson (RedisJSON fork) | Custom in-memory JSON value store with allocator | Should build; no arch-specific code | No riscv64 CI | Not released separately | Embedded in RedisJSON |
| zstd (via zstd-rs 0.13) | Compression inside ijson for large JSON values | Supported; RVV vectorization merged (upstream PR #4435, 2025-07) | Yes, QEMU riscv64 CI in upstream | Not applicable (compiled into .so) | See project-reports/zstd.md |
| serde_json (>= 1.0.0, < 1.0.147) | JSON serialization/deserialization | Supported; pure Rust | Passes on all Rust Tier 2+ targets | N/A | Version pin is for float formatting stability, not architecture |
| bson v2.11 | BSON type used in path queries | Supported; pure Rust | No riscv64-specific CI | N/A | No riscv64 issues found |
| pest / pest_derive v2.x | PEG parser for JSONPath grammar in json_path/ | Supported; pure Rust | No riscv64-specific CI | N/A | No riscv64 issues found |
| regex v1 | Filter expression matching in json_path/ | Supported; pure Rust NFA/DFA, no JIT on riscv64 | Passes on all Rust Tier 2+ targets | N/A | No JIT dependency (unlike PCRE2) |
| half v2 | IEEE 754 float16 storage in ijson and redis_json | Supported; pure Rust | No riscv64-specific CI | N/A | No riscv64 issues found |
| RediSearch | Runtime co-dependency; default Dockerfile loads redisearch.so | Not supported; CI is x86_64 and aarch64 only | No | No riscv64 release | See project-reports/redisearch.md |
| libc 0.2 | C runtime bindings | Supported since libc 0.2.87 | N/A | N/A | No blockers |

### Critical Dependency Deep-Dive: bindgen

The blocking issue traces to a transitive dependency chain: `RedisJSON` -> `redismodule-rs` -> `bindgen 0.22.1` -> `clang-sys 0.2.2`. The `redismodule-rs` `build.rs` invokes `bindgen` to parse `redismodule.h` and generate Rust FFI bindings. `bindgen` passes the Rust target triple directly to `libclang` to configure the compilation target.

In `bindgen` versions prior to 0.60.0, the Rust triple `riscv64gc-unknown-linux-gnu` was passed verbatim to `clang`, which does not recognize the `gc` ISA extension suffix. The fix ([rust-lang/rust-bindgen#2137](https://github.com/rust-lang/rust-bindgen/pull/2137)) translates between Rust triples and LLVM triples before calling `libclang`. The fix was merged 2022-01-29 and shipped in `bindgen 0.60.0`. The `Cargo.lock` in `RedisJSON/RedisJSON` pins `bindgen = 0.22.1`, which is from approximately 2019 and is about 14 major minor versions behind the fix.

Updating `bindgen` requires updating `redismodule-rs`, which is a separate Redis Labs-owned repository. No PR exists in either repo to perform this update.

### Critical Dependency Deep-Dive: RediSearch

The default `Dockerfile` co-loads `redisearch.so` alongside `rejson.so`. A complete RedisJSON deployment as packaged by Redis Ltd. therefore requires RediSearch to function on riscv64. Based on research data referenced in the dependency table, RediSearch has no riscv64 CI and no riscv64 release. This is a second-order deployment blocker independent of the build toolchain issue.

---

## 11. Known Bugs and Active Issues

### RISC-V-Specific

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#830](https://github.com/RedisJSON/RedisJSON/issues/830) | Cannot cross compile for riscv, libclang.so error | Open (no activity since 2022-12-13) | Critical (build blocker) | Root cause: bindgen 0.22.1 does not handle riscv64gc triple; fix exists in bindgen >= 0.60.0 but not applied |

### Cross-Compilation General (Architecture-Neutral but Relevant)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#471](https://github.com/RedisJSON/RedisJSON/issues/471) | Crosscompile RedisJSON (ARMv7) | Closed | Medium | Same root cause as #830; closed with community workaround only, no upstream fix |
| [#475](https://github.com/RedisJSON/RedisJSON/issues/475) | Cross-compile #2 for ARMv7 | Closed | Medium | Continuation of #471; Dockerfile workaround documented in thread |
| [#1148](https://github.com/RedisJSON/RedisJSON/issues/1148) | Is it possible to cross-compile | Open (no response since 2023-11-29) | Low | Confirms cross-compilation is officially unsupported |

### Correctness Bugs (All Architectures)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1555](https://github.com/RedisJSON/RedisJSON/issues/1555) | [BUG] [CRASH] Crash during key expiration | Open (2026-04-14) | Critical | SIGSEGV in IValue::drop -> type_methods::free -> dictObjectDestructor during activeExpireCycle; use-after-free or NULL deref under JSON.SET/JSON.DEL/EXPIRE load; RedisJSON 2.6.10, Redis 7.2.4, x86_64 |
| [#1216](https://github.com/RedisJSON/RedisJSON/issues/1216) | JSON numeric field values are automatically rounding | Open (2024-07-10) | High | Large integers (e.g., 8301034833169298414) silently rounded to 8301034833169298000; IEEE-754 double precision; affects all architectures identically |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. `bindgen 0.22.1` pin in `Cargo.lock`. Updating requires a PR to `redismodule-rs` (Redis Labs-owned, separate repo) to bump the `bindgen` dependency to >= 0.60.0, followed by a `cargo update` in RedisJSON. There is no evidence this has been attempted.

2. No riscv64 CI runner. Redis Ltd. uses a self-hosted `ubuntu24-arm64-4-16` runner for arm64. An equivalent riscv64 runner would be needed for CI gating. RISE has not offered runners for this project.

3. RediSearch has no riscv64 support. Deploying a complete Redis Stack on riscv64 requires both modules to work.

**Organizational blockers:**

1. Vendor-controlled project with CLA assignment to Redis Ltd. Any riscv64 enablement work must either be accepted by Redis Ltd. maintainers or be pursued as a fork. The maintainer response to the 2022 issue was a request for hardware access that was never followed up on. There is no stated roadmap for riscv64.

2. RedisJSON is being absorbed into the main `redis/redis` repository as of Redis 8. Future riscv64 decisions will likely be made at the Redis project level rather than in the standalone module repository. The `redis/redis` project has active riscv64 work (PRs #14251, #14342, #15204, #15273) but no completed riscv64 CI tier.

**Acceptance probability:** Low without direct engagement from Redis Ltd. The technical fixes are straightforward (bindgen version bump, linker config), but the organizational inertia is significant: three years of silence on an open build-blocker issue, no cross-compilation documentation, and a vendor-controlled governance model.

---

## 13. Investment Analysis

RISE has no existing investment in RedisJSON. All items below represent net-new work.

### 13.1 Functional Enablement

The primary work is unblocking the build:

- Update `bindgen` in `redismodule-rs` from 0.22.1 to >= 0.60.0. This requires understanding any API changes across 38+ minor versions and adjusting the `build.rs` accordingly. The `redismodule-rs` repository is Redis Labs-owned; a PR must be accepted there before RedisJSON can consume it.
- Add `[target.riscv64gc-unknown-linux-gnu]` linker config to `.cargo/config.toml` in RedisJSON.
- Validate that all transitive pure-Rust dependencies (`serde_json`, `bson`, `pest`, `regex`, `half`) build and pass tests on riscv64. Based on findings these are expected to pass without changes.
- Native build and smoke test on riscv64 hardware or QEMU.

### 13.2 Performance Optimization

No performance work is warranted until functional enablement is complete. The codebase has no SIMD paths and no JIT; there is no riscv64-specific optimization target within RedisJSON itself. Performance work on the host Redis process (hash functions, HyperLogLog, bitops) is tracked in `redis/redis` and is separate.

### 13.3 CI/CD Infrastructure

- Add a QEMU-based riscv64 build-and-smoke-test job to `flow-linux.yml`. This does not require native hardware but requires a QEMU riscv64 runner in the GitHub Actions environment.
- Add `linux/riscv64` platform to `push-docker-images.yml` once the build is unblocked.

### 13.4 Ecosystem Enablement

RedisJSON has no package ecosystem of dependent modules requiring separate enablement. Section 10 is omitted per scope rules.

The co-deployment dependency on RediSearch is tracked separately in `project-reports/redisearch.md`.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Update bindgen in redismodule-rs to >= 0.60.0; PR, review, merge | 2 | Redis Labs or RISE contributor | Critical |
| Functional | Add riscv64gc linker config to .cargo/config.toml in RedisJSON | 0.5 | Redis Labs or RISE contributor | Critical |
| Functional | Validate transitive pure-Rust deps on riscv64; fix any regressions | 1 | RISE contributor | Critical |
| Functional | Native or QEMU build + smoke test; produce librejson.so for riscv64 | 1 | RISE contributor | Critical |
| CI/CD | Add QEMU riscv64 build-and-smoke job to flow-linux.yml | 1 | RISE contributor | High |
| CI/CD | Add linux/riscv64 platform to push-docker-images.yml | 0.5 | RISE contributor | Medium |
| Distribution | Coordinate with Redis Ltd. to include riscv64 in Redis Stack bundles | -- | Redis Ltd. (requires vendor decision) | Medium |

Total estimated engineering effort: approximately 6 person-weeks, contingent on Redis Labs accepting the `redismodule-rs` PR. Without that acceptance, the functional blocker cannot be resolved in the upstream codebase.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #830: Cannot cross compile for riscv, libclang.so error](https://github.com/RedisJSON/RedisJSON/issues/830)
- [Issue #471: Crosscompile RedisJSON (ARMv7)](https://github.com/RedisJSON/RedisJSON/issues/471)
- [Issue #475: Cross-compile #2 for ARMv7](https://github.com/RedisJSON/RedisJSON/issues/475)
- [Issue #1148: Is it possible to cross-compile](https://github.com/RedisJSON/RedisJSON/issues/1148)
- [Issue #1555: CRASH during key expiration](https://github.com/RedisJSON/RedisJSON/issues/1555)
- [Issue #1216: JSON numeric field values are automatically rounding](https://github.com/RedisJSON/RedisJSON/issues/1216)
- [PR #1631: Improve get_index performance (merged 2026-08-23)](https://github.com/RedisJSON/RedisJSON/pull/1631)
- [PR #1629: Run benchmarks nightly and cover the LLAPI path](https://github.com/RedisJSON/RedisJSON/pull/1629)
- [PR #1626: ci: nightly day-over-day performance regression gate](https://github.com/RedisJSON/RedisJSON/pull/1626)
- [rust-lang/rust-bindgen PR #2137: Fix riscv64gc triple mapping (merged 2022-01-29)](https://github.com/rust-lang/rust-bindgen/pull/2137)
- [RedisJSON/RedisJSON repository](https://github.com/RedisJSON/RedisJSON)
- [RedisLabsModules/redismodule-rs](https://github.com/RedisLabsModules/redismodule-rs)
- [redis/redis PR #14251: USE_PROCESSOR_CLOCK for RISC-V](https://github.com/redis/redis/pull/14251)
- [redis/redis PR #14342: Unaligned access optimizations (Zicclsm)](https://github.com/redis/redis/pull/14342)
- [redis/redis PR #15204: RISC-V Zbb popcount](https://github.com/redis/redis/pull/15204)
- [redis/redis PR #15273: RVV SIMD for HyperLogLog](https://github.com/redis/redis/pull/15273)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RedisJSON homepage](https://redis.io/docs/data-types/json/)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [Debian package tracker (redisjson - not found)](https://tracker.debian.org/pkg/redisjson)