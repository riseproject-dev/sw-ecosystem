---
title: EMQX
parent: Project Reports
color: orange
---

# EMQX

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for EMQX<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

EMQX is a distributed MQTT message broker written in Erlang/Elixir (BEAM VM), used as IoT/messaging middleware for device connectivity at scale. It is not an optimization-purpose project (no SIMD/JIT/numerics differentiator); its value proposition is protocol-compliant, clustered, high-connection-count MQTT messaging.

**Governance:** Single-vendor governed. No CNCF, Linux Foundation, or Apache Foundation affiliation was found on emqx.io or the GitHub org page. There is no `MAINTAINERS`/`OWNERS`/`GOVERNANCE.md` file in the repository; governance is expressed only through `.github/CODEOWNERS`, which names a single team, `@emqx/emqx-review-board` (HJianBo, id, ieQu1, keynslug, qzhuyan, savonarola, terry-xiaoyu, thalesmg, zhongwencool, zmstone), as default approver for nearly all code. Every identified review-board member's GitHub company field resolves to EMQ Technologies. Investors listed on emqx.com: Hillhouse Capital, GGV Capital.

**License:** Business Source License (BSL) 1.1 as of EMQX v5.9.0+ (unifies the prior Apache-2.0 core / proprietary Enterprise split into one BSL codebase; converts to Apache 2.0 four years after each version's publication). Single-node production use is free under the Additional Use Grant; multi-node clustering requires a commercial license.

**Community culture on new ports:** There is precedent for the community requesting new architecture support and it eventually being adopted: [issue #520 "Support for ARM?"](https://github.com/emqx/emqx/issues/520) (opened 2016-04-19, closed 2016-06-01) shows ARM being requested years before arm64 became an official build target. No equivalent request-and-build pattern exists for RISC-V; the only riscv-tagged issue ([#12813](https://github.com/emqx/emqx/issues/12813)) was closed as "we no longer support" an EOL 4.2.2 release rather than triaged as a port request.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 port has ever been proposed, attempted, or merged | `git log --all -i --grep=riscv` over the full 35,406-commit history returns 0 matches; [GitHub code search](https://github.com/search?q=riscv+repo%3Aemqx%2Femqx&type=code) returns 0 results |

There is no port to describe. No commit, pull request, or design discussion in `emqx/emqx` ever introduced riscv64 support. Key contributors (zmstone/Zaiming Shi, thalesmg, JimMoen, ieQu1, zhongwencool, HJianBo, Feng Lee - all EMQ Technologies) have made no riscv64-related commits. **It is not upstream because it has never been attempted upstream.**

## 3. Upstream Support Tier

EMQX publishes no formal architecture-tier policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repo). The de facto tier is defined by the CI build matrix in [`scripts/rel/build_matrix.py`](https://github.com/emqx/emqx): `LINUX_ARCH = ["amd64", "arm64"]`.

| Architecture | CI builds | CI tests | Official release binary |
|---|---|---|---|
| amd64 | yes | yes | yes (Ubuntu, Debian, RHEL/Rocky/Amazon Linux packages) |
| arm64 | yes | yes | yes (Linux packages + macOS) |
| riscv64 | no | no | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

EMQX (the core broker repository) has no architecture-specific code of its own: it is an Erlang/OTP application, and the BEAM VM abstracts CPU architecture from application code. There is no JIT, SIMD, hand-written assembly, or GC barrier code in `emqx/emqx` itself. Any architecture-specific concerns live either in the Erlang/OTP runtime (external dependency, not evaluated here) or in native NIF dependencies (Section 9).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Own JIT/SIMD/assembly | N/A (none exists; pure BEAM bytecode) | N/A | N/A |
| Native NIF deps (RocksDB, msquic, OpenSSL, jq, Oniguruma, Snappy, LZ4) | full, tested | full, tested | mixed - see Section 9 |

Because EMQX itself carries no architecture-specific source, Section 2 of the color model's optimization modifier does not apply to this project as a whole.

## 5. Build System, Cross-Compilation, and Toolchain

EMQX is not a CMake project. Build orchestration is `make` driving **rebar3** (Erlang) and **mix** (Elixir); no `CMakeLists.txt` or `cmake/` directory exists anywhere in the repository.

**Toolchain requirements** (from `README.md` and `env.sh`): pinned to Erlang/Elixir versions, not a C/C++ compiler minimum:
- EMQX 5.4+ requires OTP 25 or 26
- EMQX 5.9+ requires OTP 27
- EMQX 6.1+ requires OTP 28
- Current pinned builder: `OTP_VSN=28.4.1-4`, `ELIXIR_VSN=1.19.1`, image `ghcr.io/emqx/emqx-builder/6.1-8:1.19.1-28.4.1-4-ubuntu24.04`

**Build command:** `git clone ... && cd emqx && make`, producing `_build/emqx-enterprise/rel/emqx/bin/emqx console`.

**QEMU usage:** [`scripts/buildx.sh`](https://github.com/emqx/emqx/blob/master/scripts/buildx.sh) installs QEMU binfmt handlers via `tonistiigi/binfmt` and builds under `--platform=linux/$ARCH`, but `$ARCH` is validated/used only as `amd64` or `arm64` throughout the codebase. No `ghcr.io/emqx/emqx-builder/*` image is published for `linux/riscv64`, so this cross-build path does not currently extend to riscv64 without new builder images.

**Known build failures on riscv64:** None documented, because riscv64 has never been attempted. The single riscv64-tagged report ([#12813](https://github.com/emqx/emqx/issues/12813)) describes a successful QEMU riscv64 build of EMQX 4.2.2 on openEuler (`make -j$(nproc)` completed, broker started) that then failed at runtime with an HTTP 500 dashboard error and an unresponsive Erlang shell - closed by maintainer `ieQu1` as "v4.2.2 release is 4 years old... We no longer support it," with no further investigation on a supported version.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core MQTT broker | yes | yes | unverified - no build/release artifact exists to test |
| MQTT-over-QUIC (quicer/msquic) | yes | yes | **structurally blocked** - msquic's own `scripts/build.ps1` `-Arch` `ValidateSet` is `("x86","x64","arm","arm64","arm64ec")`, excluding riscv64, and no riscv64 toolchain file exists (compare `cmake/toolchains/aarch64-linux.cmake` for arm64) |
| Durable storage (RocksDB NIF) | yes | yes | dependency builds on riscv64 (Ubuntu 26.04 ships `librocksdb-dev` for riscv64), but never exercised by EMQX's own build/CI |
| Rule Engine JSON queries (jq NIF) | yes | yes | dependency packaged for riscv64 (Ubuntu `jq`, `libjq-dev`), never exercised by EMQX's own build/CI |
| Dashboard | yes | yes | reported broken in the one documented riscv64 attempt (EOL 4.2.2, unreproduced on a current version) |

No performance-gap or NaN/floating-point data exists because no riscv64 build has ever been produced or benchmarked (Section 11).

**Functional gap:** a full-featured riscv64 build (with MQTT-over-QUIC enabled) cannot be produced today because msquic has no riscv64 build target. A reduced build with `BUILD_WITHOUT_QUIC=true` would sidestep this, but has not been attempted or documented anywhere.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Verified by direct inspection of all 29 files in `.github/workflows/` at HEAD `d05d08494be2db16e3af4a686f5dfc8e01119066`, and independently re-confirmed via the GitHub Code Search API (`riscv repo:emqx/emqx` -> 0 results; `riscv64 language:YAML repo:emqx/emqx` -> 0 results).

- Runners referenced anywhere in CI: `ubuntu-latest`, `aws-ubuntu22.04-amd64`, `ubuntu-22.04-arm`. No riscv64 runner, no QEMU riscv64 step, no riscv64 Docker platform target.
- [`build_packages.yaml`](https://github.com/emqx/emqx/blob/master/.github/workflows/build_packages.yaml) matrix: `arch: [amd64, arm64]` only.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.
- No RISE runner usage (no reference to `riseproject-dev` or RISE runner labels anywhere in the workflow files).

| Architecture | CI builds | CI tests | Release-blocking | Runner type |
|---|---|---|---|---|
| amd64 | yes | yes | yes | `aws-ubuntu22.04-amd64` |
| arm64 | yes | yes | yes | `ubuntu-22.04-arm` |
| riscv64 | no | no | N/A | none exists |

## 8. Distribution and Release Status

No riscv64 binary exists through any checked channel:

- **GitHub Releases:** Recent releases (6.3.0, 6.2.3, 6.1.4, 6.2.2, 6.1.3) ship assets for `ubuntu24.04-{amd64,arm64}`, `debian13-amd64`, `el10-amd64`, `el9-arm64`, `macos{14,15}-arm64`. Zero filenames contain "riscv" or "riscv64" in any release checked. [https://github.com/emqx/emqx/releases](https://github.com/emqx/emqx/releases)
- **PyPI:** `https://pypi.org/pypi/emqx/json` returns HTTP 404 - no PyPI package named `emqx` exists (EMQX is not a Python package).
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=EMQX&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - EMQX is not packaged in Ubuntu for **any** architecture, not just riscv64.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=emqx)): no package listed.
- **Project graph query** (Ubuntu 26.04/resolute, `pkgName IN ("emqx","python3-emqx","libemqx")`, `architectureName="riscv64"`): empty result set.

**What a user must do to get a working binary today:** build from source on riscv64 hardware or under QEMU, following the process in the one documented (unsuccessful past a certain point) attempt in [#12813](https://github.com/emqx/emqx/issues/12813) - install Erlang/OTP, `make`, and separately resolve the msquic build gap (Section 6) by disabling QUIC. No official or community-maintained riscv64 build path is documented.

**Note (adjacent, non-EMQX):** EMQX's separate, unrelated project **NanoMQ** (a lighter-weight MQTT broker under the same GitHub org) does publish riscv64 RPM packages on `packages.emqx.com` (e.g. `nanomq-0.8.0-1.riscv64.rpm`). This is a different repository/product from `emqx/emqx` and does not affect this project's readiness. [NEEDS VERIFICATION: exact package URL was reported by a single source and not independently re-fetched.]

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| RocksDB (via `emqx/erlang-rocksdb` NIF) | Durable session/message storage | packaged for riscv64 on Ubuntu 26.04 (`librocksdb-dev`); upstream had riscv64 `-march` build issues (#10500, #7051, #11994), all closed | not exercised by EMQX's own CI | Ubuntu ships riscv64 binaries; no official upstream riscv64 binary release | active |
| msquic (via `emqx/quic` NIF, tag 0.4.9) | QUIC transport for MQTT-over-QUIC | **no riscv64 build target** - `scripts/build.ps1` `-Arch ValidateSet` excludes riscv64; no riscv64 toolchain file | not testable - build path does not exist | none (not packaged in Ubuntu at any arch) | none identified for riscv64 |
| OpenSSL | TLS/crypto for all MQTT TLS/mTLS listeners, JWT auth, msquic's TLS provider | packaged for riscv64 on Ubuntu 26.04 (`libssl-dev`); upstream runs an active `linux-riscv64` CI runner | actively tested upstream on riscv64; one open flaky test (#30880, minor) | distro-packaged, builds/runs on riscv64 today | active - open enhancement issues for RISC-V crypto-extension use (#25334, #28664, #29453, #28118), none functionality-blocking |
| jq (via `emqx/jq` NIF, tag v0.4.1) | Rule Engine JSON query/transform | packaged for riscv64 on Ubuntu 26.04 (`jq`, `libjq-dev`) | not exercised by EMQX CI; portable C | distro-packaged | no open riscv64 issues |
| Oniguruma | Regex engine used by jq | packaged for riscv64 on Ubuntu 26.04 (`libonig-dev`) | not directly tested by EMQX | distro-packaged | no riscv64 issues |
| Snappy (vendored in `erlang-rocksdb`) | RocksDB SST compression | packaged for riscv64 on Ubuntu (`libsnappy-dev`, for reference; EMQX vendors its own build) | one open upstream issue: [#209 "Performance Issue with Snappy FindMatchLength on RISC-V"](https://github.com/google/snappy/issues/209) - functional but with a documented perf regression | statically bundled | performance-only gap, not a build blocker |
| LZ4 (vendored in `erlang-rocksdb`) | RocksDB SST compression | packaged for riscv64 on Ubuntu (`liblz4-dev`) | closed upstream proposal [#1635 "RISC-V Architecture Optimizations"](https://github.com/lz4/lz4/issues/1635) indicates a working, tunable riscv64 target | statically bundled | none open |
| crc32cer (`zmstone/crc32cer` NIF, via kafka_protocol/pulsar-client-erl) | CRC32C for Kafka/Pulsar bridge wire format | not distro-packaged (Erlang-ecosystem-only); no equivalent Ubuntu `libcrc32c` package found for riscv64 | not tested by EMQX CI | built from source | none known; likely loses hardware CRC acceleration on riscv64, falling back to a software table [NEEDS VERIFICATION] |
| jiffy (JSON NIF) | JSON encode/decode | not distro-packaged; no riscv64 issues found upstream | not tested by EMQX CI | built from source | none known; portable C |

**Deep-dive: the one structural blocker.** msquic is the single dependency in EMQX's critical path with a concrete, structural riscv64 gap - not a missing test or a perf tune, but an absent build target. Everything else in the native/critical dependency set (RocksDB, OpenSSL, jq, Oniguruma, Snappy, LZ4) builds and is packaged for riscv64 today via Ubuntu 26.04, with only minor open performance-tuning issues (Snappy `FindMatchLength`, OpenSSL RISC-V crypto-extension usage) rather than functional blockers.

Excluded as non-dependencies despite superficially matching common project lists: zstd, bzip2, and jemalloc are all explicitly disabled in EMQX's RocksDB build (`DISABLE_JEMALLOC=1 ROCKSDB_DISABLE_ZSTD=1`, no bzip2 reference).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#12813](https://github.com/emqx/emqx/issues/12813) | "EMQX 2.4.3 dashboard: request failed with status code 500 error" (reported on riscv64/QEMU, EMQX 4.2.2) | Closed (2024-03-31) | Unresolved - closed as EOL, not fixed | Dashboard returned HTTP 500 on all pages; Erlang shell became unresponsive. Maintainer `ieQu1` closed with "v4.2.2 release is 4 years old... We no longer support it." No reproduction attempted on a current, supported EMQX version. This is a genuine correctness bug report on riscv64 that was never triaged as an architecture issue. |
| [#3543](https://github.com/emqx/emqx/issues/3543) | "docker-build fail" | Closed (2020-07-16) | N/A - false positive | Matched a "riscv" search only because the build log contains generic QEMU binfmt registration boilerplate (`qemu-riscv64-static`) used for all multi-arch Docker tooling. The actual reported failure was an x86_64 Erlang/OTP `.beam` version mismatch (`rebar3_run.beam` compiled for a newer OTP than the base image), unrelated to CPU architecture. Resolved via `make distclean`. |

**Correctness bug flagged separately:** #12813 is the only report of EMQX actually running (partially) on riscv64, and it describes a dashboard-breaking runtime error that was never investigated on a supported version. This is the closest thing to evidence of a functional problem, but sample size is one, on a 4-year-old EOL release, under QEMU emulation, with no independent reproduction.

No other riscv64-related issues, PRs, or commits exist in `emqx/emqx` (independently re-confirmed via `search_pull_requests` and `search_code` for `riscv`/`riscv64`/`risc-v`: 0 results each).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has stated an objection to riscv64 support; the topic has simply never been raised as a port proposal. The only maintainer comment touching riscv64 at all ([#12813](https://github.com/emqx/emqx/issues/12813)) dismissed the specific bug report for being on an unsupported EOL version, not for being on riscv64.

**Technical blockers:**
1. msquic has no riscv64 build target (Section 6/9) - blocks a full-featured build with MQTT-over-QUIC unless disabled via `BUILD_WITHOUT_QUIC=true`.
2. EMQX's own build/release pipeline (`scripts/rel/build_matrix.py`, all CI workflows) has no riscv64 leg - this is the dominant practical gap, independent of dependency readiness, since nearly all other native dependencies already build on riscv64 via Ubuntu 26.04.
3. No riscv64 builder Docker image (`ghcr.io/emqx/emqx-builder/*`) exists for `linux/riscv64`, which the cross-build tooling (`scripts/buildx.sh`) would require.

**Organizational blockers:** EMQX is single-vendor governed (EMQ Technologies Inc.) with no foundation oversight and no external contributor pressure evidenced in this research (no open feature request, no community PR). Precedent (#520, ARM support) shows the org has previously added architectures on request-and-build effort, but only after a concrete ask; none analogous exists for RISC-V. Notably the sibling project `emqx/neuron` (same GitHub org, different product) already has riscv64 handling in its `cmake/cross.cmake`, indicating the organization is not RISC-V-hostile, it has simply never applied that effort to the flagship broker.

**Acceptance probability:** [NEEDS VERIFICATION - no direct maintainer statement exists either way]. Given the precedent of ARM support being added after a sustained community ask, and evidence the org already ships riscv64 code for a sibling product, a well-scoped external contribution (CI leg + msquic workaround) has a plausible path to acceptance, but this is inference from indirect precedent, not a maintainer commitment.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI, no distribution, no release" case; no sub-type from the yellow/orange distro-floor rules applies because EMQX has no distribution package at all to float on)
- **Release provider:** none
- Not an optimization-purpose project - Section 2/optimization-level fields are omitted from the header and this section per the color model.
- **Justification:** EMQX's CI build matrix builds only `amd64`/`arm64` across all 29 workflow files, with zero riscv64 references confirmed both by direct file inspection and independent GitHub Code Search API queries ([`.github/workflows/build_packages.yaml`](https://github.com/emqx/emqx/blob/master/.github/workflows/build_packages.yaml)). No upstream riscv64 release artifact exists ([GitHub Releases](https://github.com/emqx/emqx/releases)), and no Linux distribution packages EMQX at all, for any architecture, so the distribution floor (which would otherwise be able to lift the grade to yellow or orange based on distro packaging) does not apply here since there is no distro package to float on - the project is simply orange on the strength of "no CI, no release" alone. This is not red, because there is no confirmed-broken riscv64 report on a currently supported version - the sole riscv64 bug report ([#12813](https://github.com/emqx/emqx/issues/12813)) was closed as an unsupported EOL version rather than triaged.
- **Pending work that could change the grade:** None identified. No open PR, no open tracking issue, and no RISE involvement exists for EMQX (confirmed against [riseproject.dev/members/](https://riseproject.dev/members/) and the full RISE blog post list - EMQX does not appear in either). Nothing is currently in flight that would move this grade.

## 14. Investment Analysis

**RISE prior work check:** RISE has not funded, tracked, or published anything related to EMQX. It is not a RISE member (checked against the Premier and General member lists on [riseproject.dev/members/](https://riseproject.dev/members/)), has no RISE blog coverage (checked all ~34 posts via the RISE blog sitemap), and is not eligible for RISE's Python wheel builder (EMQX is not a Python package). All sizing below is therefore unclaimed work.

### 14.1 Functional Enablement

- Add a riscv64 leg to EMQX's own build pipeline (`scripts/rel/build_matrix.py`, `.github/workflows/build_packages.yaml`, `build_slim_packages.yaml`, `build_and_push_docker_images.yaml`), most likely with `BUILD_WITHOUT_QUIC=true` initially given the msquic gap.
- Produce and validate a riscv64 builder Docker image (`ghcr.io/emqx/emqx-builder/*-riscv64`) equivalent to the existing amd64/arm64 builder images.
- Validate the vendored RocksDB+Snappy+LZ4 build on actual riscv64 hardware (not just confirm Ubuntu packaging, which EMQX does not consume directly - it vendors and builds RocksDB itself).
- Reproduce and triage the dashboard HTTP 500 / unresponsive-shell issue from [#12813](https://github.com/emqx/emqx/issues/12813) on a current, supported EMQX version to determine whether it is a genuine architecture-specific correctness bug or an artifact of the EOL 4.2.2 build.

### 14.2 Performance Optimization

Not applicable in the traditional sense (EMQX is not an optimization-purpose project), but two dependency-level performance gaps exist and would benefit riscv64 EMQX deployments once functional support lands: Snappy's [`FindMatchLength` performance issue on RISC-V (#209)](https://github.com/google/snappy/issues/209), and OpenSSL's pending RISC-V crypto-extension (Zknd/Zkne) work for AES/SHA256 acceleration (#25334, #28664). Both are upstream-owned; EMQX-side work would be limited to re-validating throughput once those land.

### 14.3 CI/CD Infrastructure

Add riscv64 to the GitHub Actions build matrix. Given no self-hosted riscv64 runner currently exists in EMQX's infrastructure, this would require either a RISE RISC-V runner (EMQX is not currently using RISE runners) or cloud riscv64 CI capacity (e.g. AWS Graviton-equivalent riscv64 offering, if/when available) comparable to the existing `aws-ubuntu22.04-{arch}` pattern.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the reporting rules. EMQX is a standalone broker binary with no dependent package ecosystem (no npm/PyPI/Maven consumers that themselves need separate riscv64 enablement); MQTT client libraries in other languages are independent projects with their own riscv64 status, out of scope here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 leg to build_matrix.py + CI workflows (build-only, QUIC disabled) | 2-3 | EMQ Technologies or external contributor | Critical |
| Functional | Build and publish riscv64 `emqx-builder` Docker image | 1-2 | EMQ Technologies or external contributor | Critical |
| Functional | Validate vendored RocksDB/Snappy/LZ4 build and runtime on riscv64 hardware | 1-2 | EMQ Technologies or external contributor | High |
| Functional | Reproduce/triage dashboard 500-error bug (#12813) on current EMQX version, riscv64 | 1 | EMQ Technologies | High |
| Functional | Add riscv64 support to msquic (upstream Microsoft project) or maintain a QUIC-disabled riscv64 build path | 4-8 (upstream dependency, not EMQX-controlled) | Microsoft (msquic) / EMQ Technologies (workaround) | Medium |
| CI/CD | Provision riscv64 CI runner capacity (RISE runner or cloud) | 1-2 | EMQ Technologies / RISE | High |
| Performance | Re-validate throughput once Snappy #209 and OpenSSL RISC-V crypto-extension work lands upstream | 0.5 (tracking only, no EMQX-side dev) | EMQ Technologies | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [emqx/emqx repository](https://github.com/emqx/emqx)
- [EMQX homepage](https://www.emqx.io/)
- [emqx/emqx CI workflows](https://github.com/emqx/emqx/tree/master/.github/workflows)
- [build_packages.yaml](https://github.com/emqx/emqx/blob/master/.github/workflows/build_packages.yaml)
- [scripts/buildx.sh](https://github.com/emqx/emqx/blob/master/scripts/buildx.sh)
- [emqx/emqx releases](https://github.com/emqx/emqx/releases)
- [PyPI emqx package lookup (404)](https://pypi.org/pypi/emqx/json)
- [Ubuntu 26.04 (resolute) package search for EMQX](https://packages.ubuntu.com/search?keywords=EMQX&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=emqx)
- [Issue #520 - "Support for ARM?"](https://github.com/emqx/emqx/issues/520)
- [Issue #12813 - EMQX 4.2.2 dashboard 500 error on riscv64/QEMU](https://github.com/emqx/emqx/issues/12813)
- [Issue #3543 - docker-build fail (false-positive riscv match)](https://github.com/emqx/emqx/issues/3543)
- [Issue #7361 - "Hope to add armhf version" (false-positive riscv64 match)](https://github.com/emqx/emqx/issues/7361)
- [emqx/erlang-rocksdb repository](https://github.com/emqx/erlang-rocksdb)
- [emqx/quic (quicer NIF) repository](https://github.com/emqx/quic)
- [microsoft/msquic repository](https://github.com/microsoft/msquic)
- [google/snappy issue #209 - FindMatchLength performance on RISC-V](https://github.com/google/snappy/issues/209)
- [lz4/lz4 issue #1635 - RISC-V Architecture Optimizations (closed)](https://github.com/lz4/lz4/issues/1635)
- [OpenSSL issue #25334 - RISC-V crypto extension AES/SHA256](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #28664 - related RISC-V crypto extension tracking](https://github.com/openssl/openssl/issues/28664)
- [OpenSSL issue #29453 - intrinsics vs inline asm](https://github.com/openssl/openssl/issues/29453)
- [OpenSSL issue #28118 - extension detection on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #30880 - flaky test_lhash on riscv64](https://github.com/openssl/openssl/issues/30880)
- [emqx/neuron cmake/cross.cmake (sibling project riscv64 handling)](https://github.com/emqx/neuron)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [emqx.com EMQX Edge product page (marketing claim of RISC-V support, uncorroborated)](https://www.emqx.com/)
- [NanoMQ riscv64 RPM package (separate, unrelated product)](https://packages.emqx.com/emqx/nanomq/packages/rpm_any/rpm_any/nanomq-0.8.0-1.riscv64.rpm) [NEEDS VERIFICATION]
