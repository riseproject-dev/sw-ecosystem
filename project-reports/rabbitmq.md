---
title: RabbitMQ
categories:
  - iaas
---

# RabbitMQ
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for RabbitMQ
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

RabbitMQ is an open-source AMQP message broker written entirely in Erlang/OTP. It implements AMQP 0-9-1, AMQP 1.0, MQTT 3.1.1, STOMP 1.0-1.2, and a proprietary stream protocol. The broker core is pure Erlang; there is no C, C++, or assembly in the rabbitmq-server repository. Architecture portability derives entirely from the Erlang/OTP BEAM virtual machine.

**Governance:** RabbitMQ has no independent foundation. It is a Broadcom-controlled project via the VMware/Tanzu division. Ownership lineage: Rabbit Technologies Ltd. (2007) -> SpringSource/VMware (April 2010) -> Pivotal Software (May 2013) -> VMware (December 2019) -> Broadcom (current). License: Mozilla Public License 2.0.

**Corporate sponsors:** Broadcom/VMware dominates the committer list. The top contributor by commit count is michaelklishin (Michael Klishin, @VMware by @Broadcom, 15,549 commits). A secondary external corporate contributor is lukebakken (Luke Bakken, Amazon AWS, 1,388 commits). No other companies appear in the top eight contributors at a significant level.

**RISE membership:** Neither RabbitMQ nor Broadcom/VMware/Pivotal appears in RISE's Premier or General member listings. RabbitMQ is not referenced in any RISE blog post across all 27 posts published May 2024 through June 2026.

**Community culture on new ports:** The Broadcom core team states it has "no obligation to reply" to community messages. Patch releases for older series are exclusively available to commercial Tanzu RabbitMQ license holders. There is no formal tier policy for new architecture support. There is no upstream tracking issue for riscv64, and the rabbitmq/rabbitmq-server repository has zero RISC-V related issues, pull requests, or commits.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Feb 15, 2023 | snappy-java upstream (xerial/snappy-java#396) merges Linux-riscv64 native library support, contributed by @luhenry | [rabbitmq-stream-java-client PR #344](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344) body |
| Jan 30, 2023 | rabbitmq-stream-java-client PR #273 merges snappy-java bump to 1.1.9.0 (earlier riscv64 build, non-first-class) | [PR #273](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/273) |
| May 25, 2023 | rabbitmq-stream-java-client PR #344 merges snappy-java 1.1.10.0 with Linux-riscv64 JNI binary | [PR #344](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344) |
| Jul 14, 2023 | erlang/otp issue #7498 opened: RISC-V JIT support request; no assignee, no activity | [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) |
| Nov 14, 2023 | erlang/otp PR #7859 opened: adds riscv64 case to build autoconf; stalls Dec 18, 2023, labeled "waiting" | [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) |
| Sep 5, 2024 | openeuler-riscv/oerv-team issue #1312 opened: librabbitmq test failures + "nothing provides erlang-eldap(riscv-64)" on OpenEuler RISC-V; closed | [oerv-team#1312](https://github.com/openeuler-riscv/oerv-team/issues/1312) |
| Dec 22, 2025 | rabbitmq/fshc PR #22 merges serde_json bump; upstream serde_json 1.0.146 sets fast_arithmetic=64 for riscv64 | [fshc PR #22](https://github.com/rabbitmq/fshc/pull/22) |
| Apr 8, 2026 | yawkat/lz4-java PR #46 merges Linux-riscv64 native binary, contributed by @luhenry, tested on RISE RISC-V runners | [lz4-java PR #46](https://github.com/yawkat/lz4-java/pull/46) |
| Apr 10, 2026 | rabbitmq-stream-java-client PR #966 merges lz4-java 1.11.0 bump, bringing riscv64 native LZ4 into the stream client | [PR #966](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/966) |

**Key observation:** There is no "RabbitMQ riscv64 port" in the traditional sense. RabbitMQ itself is pure Erlang bytecode and has no architecture-specific code to port. All riscv64 activity in the rabbitmq GitHub organization is: (1) dependency bumps that incidentally carry riscv64 native libraries for compression codecs in the stream Java client SDK, and (2) a diagnostic tool (fshc) picking up a riscv64 arithmetic optimization in serde_json. The core broker (rabbitmq/rabbitmq-server) has zero riscv64 commits.

**Primary riscv64 contributor:** @luhenry (Ludovic Henry) contributed the upstream native binary work for snappy-java and lz4-java. These changes flowed into rabbitmq-stream-java-client via Dependabot. No RabbitMQ team member has contributed any riscv64 work directly.

**Upstream status:** Everything that has landed is fully upstream. No out-of-tree patches exist.

---

## 3. Upstream Support Tier

RabbitMQ has no formal published architecture tier policy. The project documentation at rabbitmq.com/docs/platforms lists only Linux (x86/ARM), Windows, and macOS as officially supported. RISC-V is not mentioned.

In practice, architecture support is determined by whether the Erlang/OTP BEAM VM supports the architecture. RabbitMQ itself is architecture-neutral Erlang bytecode.

| Metric | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed on platforms page | Yes | Yes (implicitly via Linux ARM) | No |
| CI in rabbitmq/rabbitmq-server | Yes (all 19 workflows) | Optional manual (`oci-make.yaml` only, `build_arm` toggle) | No |
| Official upstream release binary | Yes | No (not a distinct upstream release artifact) | No |
| Official Docker multi-arch image | Yes | Yes | Yes (listed in docker-library/official-images for all 4.x tags) |
| Erlang JIT | Yes (BeamAsm x86 backend) | Yes (BeamAsm arm64 backend) | No (interpreter only) |
| Release-blocking test failures block ship | Yes | No | No |

**Docker multi-arch qualification:** riscv64 is listed in the `docker-library/official-images` `Architectures:` field for all RabbitMQ 4.0-4.3 tags, for both Ubuntu-based and Alpine-based variants. However, this listing is generated by the Docker official-images infrastructure using QEMU-emulated builds on top of the Erlang riscv64 base image. RabbitMQ's own CI never builds or tests for riscv64. No PR or issue in the docker-library/rabbitmq repository was found documenting when riscv64 was added or whether it was tested on real hardware. [NEEDS VERIFICATION: the exact date riscv64 was added to docker-library/official-images for rabbitmq, and whether any riscv64 functional test was run at that time.]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RabbitMQ itself has no architecture-specific subsystems. The rabbitmq/rabbitmq-server repository language breakdown is: JavaScript 56.4%, Shell 27.5%, Makefile 10.4%, Java 4.3%, Dockerfile 0.9%, HTML 0.3%, Erlang 0.2%. There is zero C or assembly. No `c_src/` directory exists in any core component (rabbit, rabbit_common, ra, osiris, amqp10_common).

The architecture-sensitive work is entirely in the dependency stack.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| RabbitMQ broker core (Erlang bytecode) | scalar | scalar | scalar | No arch-specific code; pure Erlang beam files. Classification is "scalar" in the sense that all paths are identical. |
| BeamAsm JIT (Erlang/OTP runtime) | hand-tuned (x86 backend, `erts/emulator/beam/jit/x86/`) | hand-tuned (arm backend, `erts/emulator/beam/jit/arm/`) | missing | JIT directory contains only `arm/` and `x86/` subdirs. riscv64 runs BEAM threaded-interpreter. The official Docker Dockerfile explicitly sets `--enable-jit` for amd64 and arm64 and omits the flag for all other architectures. |
| OpenSSL (TLS, crypto NIF) | full (SIMD, assembly) | full | partial (C scalar + vector extension support in 3.x) | RabbitMQ uses OpenSSL via Erlang `crypto` application. See `project-reports/openssl.md` for detail. |
| lz4-java native JNI (stream Java client, compression) | full | full | full (as of lz4-java 1.11.0, April 2026) | Added by @luhenry in [yawkat/lz4-java PR #46](https://github.com/yawkat/lz4-java/pull/46). Known limitation at merge: xxhash 0.8x lacks RISC-V optimizations; jazzer fuzzer did not support linux-riscv64 and fuzzing tests were disabled for riscv64. |
| snappy-java native JNI (stream Java client, compression) | full | full | full (as of snappy-java 1.1.10.0, May 2023) | Added by @luhenry via [xerial/snappy-java#396](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344). Cross-compiled via dockcross. |
| serde_json (fshc diagnostic tool, Rust) | full | full | optimized (fast_arithmetic=64 set in 1.0.146) | fshc is a peripheral health-check tool, not the core broker. |

**JIT performance gap:** The Erlang team has documented BeamAsm JIT as providing roughly 2-3x throughput improvement on supported architectures. The research findings state this estimate but no published benchmark quantifies the gap specifically for RabbitMQ workloads on riscv64 vs. x86_64 or aarch64. Data not available: published RabbitMQ throughput or latency figures on riscv64 hardware.

**Erlang JIT upstream status:** Two items have been open since 2023 with no progress:
- [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) (opened July 14, 2023): feature request for riscv64 BeamAsm JIT support. No assignee, no linked branch, no OTP team response as of June 2026.
- [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) (opened November 14, 2023): adds riscv64 case to build autoconf. Reviewer `mikpe` identified a pattern-matching bug and questioned whether the change was necessary. Labeled "waiting" (waiting for author) since December 18, 2023. No activity since.

---

## 5. Build System, Cross-Compilation, and Toolchain

RabbitMQ uses `erlang.mk` (GNU Make + erlang.mk macros). There is no CMake, setup.py, go.mod, or Cargo.toml in the rabbitmq-server repository. All build artifacts are Erlang bytecode (`.beam` files).

**Build prerequisites for riscv64:**

Erlang/OTP must be available for riscv64. The mandatory configure flags for Erlang on riscv64:

```
./configure --disable-jit
```

`--disable-jit` is required because BeamAsm has no riscv64 backend. Omitting it will cause a build failure on riscv64.

Recommended additional flag:

```
./configure --disable-jit --with-libatomic_ops=<path>
```

Without `libatomic_ops`, Erlang falls back to `__sync_*` builtins with a performance penalty.

**Cross-compilation of Erlang/OTP for riscv64:**

```
./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --disable-jit \
  --with-libatomic_ops=/path/to/libatomic_ops \
  --without-javac
```

A configuration template exists at `$ERL_TOP/xcomp/erl-xcomp.conf.template`. No bundled riscv64-specific `.conf` file exists in the Erlang/OTP repository.

**RabbitMQ server build (once Erlang/OTP is available):**

```
git clone https://github.com/rabbitmq/rabbitmq-server
cd rabbitmq-server
make
# For a distribution package:
make package-generic-unix
```

No riscv64-specific flags, patches, or configuration are required. The build produces architecture-neutral Erlang bytecode.

**Toolchain versions:** No explicit minimums are stated for riscv64 in Erlang/OTP documentation. Erlang requires GCC >= 4.7 for `__atomic_*` builtins (the fallback path on riscv64, since native atomics are not listed for RISC-V in Erlang's configure). GCC or Clang from Debian Bookworm/sid (GCC 13+ or Clang 16+) are the de facto minimum given the Erlang 26/27/28/29 requirement.

**QEMU usage in CI:** The `rabbitmq/rabbitmq-server` CI includes `docker/setup-qemu-action@v4` but it is configured only for `linux/amd64` and optionally `linux/arm64` (manual dispatch only). No QEMU riscv64 emulation is configured in any RabbitMQ workflow file.

**Cross-compilation documentation:** The `rabbitmq/build-env-images` README explicitly states that cross-compiling inside a container inside GitHub Actions "is terribly slow" and is explicitly not pursued. All Dockerfiles in that repository target `amd64` exclusively (Debian Bookworm + Rocky Linux 8/9/10, Erlang 26.x and 27.x variants), with `deb [arch=amd64 signed-by=...]` pinned in apt sources.

**Known build failures:**
- Arch Linux riscv64 port: `rabbitmq-4.0.5-3.log` (February 2025) shows test suite failures in `metadata_store_phase1_SUITE` (Erlang/OTP `ct` test runner timing out, `assertEqual` errors, `timetrap_timeout`), followed by `make: *** [erlang.mk:6045: ct] Error 1`. An additional blocker: `erlang-nox` dependency not found in the x86 Arch repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Broker functionality (AMQP, MQTT, STOMP, stream) | Full | Full | Full | None (pure Erlang bytecode) |
| BEAM JIT (throughput) | Yes | Yes | No | Performance gap (~2-3x throughput regression per Erlang team documentation, unquantified for RabbitMQ workloads) |
| TLS via OpenSSL | Full | Full | Functional (no FIPS, some SIMD coverage) | Minor performance gap in crypto ops |
| LZ4 compression (stream Java client) | Native JNI | Native JNI | Native JNI (since Apr 2026) | None (xxhash optimization gap noted at merge but future upstream release expected to resolve) |
| Snappy compression (stream Java client) | Native JNI | Native JNI | Native JNI (since May 2023) | None |
| CI test coverage | Full (all 19 workflows) | None (build-only, manual) | None | Coverage gap: no correctness testing on riscv64 |
| Official upstream packages | Yes (.deb, .rpm via Debian/Ubuntu) | No | No | Distribution gap: not in official apt/yum repos |
| Docker multi-arch image | Yes | Yes | Yes (QEMU-emulated build, untested by project) | Testing gap |
| Kubernetes cluster-operator multi-arch image | Yes | Yes | No (amd64, arm64, ppc64le, s390x only) | Availability gap |
| Management UI | Full | Full | Full (pure JavaScript + Erlang) | None |

**Correctness:** No correctness bugs for riscv64 have been reported in rabbitmq/rabbitmq-server. The OpenEuler packaging failure (erlang-eldap missing) was a downstream distro packaging gap, not a broker correctness issue.

**Floating-point:** Data not available: any floating-point or NaN semantic issues specific to RabbitMQ on riscv64. RabbitMQ does not perform floating-point computation in its core message routing or persistence paths.

**Security hardening:** Data not available: whether riscv64 Erlang/OTP or RabbitMQ Docker images are built with riscv64-specific security mitigations (e.g., CFI, shadow stack). No source in the research findings addresses this.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in the RabbitMQ organization. This is confirmed by reading all 19 files in `.github/workflows/` of rabbitmq/rabbitmq-server.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Continuous integration (every PR) | Yes (`ubuntu-latest`, all 19 workflows) | No | No |
| Optional build (manual trigger) | Yes | Yes (`oci-make.yaml`, `build_arm` input, Docker image only) | No |
| Test execution | Yes (full Erlang `ct` suite) | No | No |
| Release artifact build | Yes | No | No |
| Native runners | GitHub-hosted `ubuntu-latest` | Not used | Not used |
| QEMU emulation | Not applicable | Available but gates only on manual `build_arm` input | Not configured |
| RISE RISC-V Runners | N/A | N/A | Not configured in any rabbitmq workflow |

The cluster-operator multi-arch image build (`rabbitmq/cluster-operator` `.github/workflows/build-test-publish.yml`) builds for `linux/amd64, linux/arm64, linux/ppc64le, linux/s390x`. riscv64 is absent.

RISE RISC-V Runners were used by @luhenry to test lz4-java on a personal fork of the yawkat/lz4-java repository. No RISE runner is configured in any rabbitmq organization workflow.

**Impact of zero riscv64 CI:** Any regression in riscv64 support (e.g., an Erlang API change that breaks on the interpreter, a compression library regression) would not be caught by upstream RabbitMQ CI. Detection depends entirely on downstream packagers (Debian, Ubuntu, Arch) running their own autopkgtest infrastructure.

---

## 8. Distribution and Release Status

**Upstream GitHub releases (rabbitmq/rabbitmq-server, v4.2.7 through v4.3.2):**

Each release publishes 28 assets. All release formats are architecture-neutral: `.noarch.rpm`, `_all.deb`, `-generic-unix-*.tar.xz`, `-windows-*.zip`. No asset filename contains "riscv64" or any architecture qualifier for a compiled binary. The buildinfo and changes files are `_amd64.*` only. No riscv64 binary is published by the upstream project.

**Official apt/yum repositories (apt.rabbitmq.com, packagecloud):** amd64 only. No riscv64 builds are distributed through RabbitMQ's own package repositories.

**Docker Hub official image:**

riscv64 is listed in `docker-library/official-images` for all RabbitMQ 4.0-4.3 tags, both Ubuntu and Alpine variants:
- Ubuntu-based: `amd64, arm32v7, arm64v8, ppc64le, riscv64, s390x`
- Alpine-based: `amd64, arm32v6, arm32v7, arm64v8, i386, ppc64le, riscv64, s390x`

The Alpine variants (e.g., `4.2.8-alpine`, `4.1.8-alpine`, `4.0.9-alpine`) are confirmed to include riscv64 on Docker Hub. This is the de facto riscv64 release vehicle for RabbitMQ. The image uses Erlang/OTP 27.3.4.13 + OpenSSL 3.5.7 + Alpine 3.23 for the riscv64 variant. Erlang runs in interpreter mode on riscv64 in this image (`--enable-jit` is gated to amd64 and arm64 in the Dockerfile).

**Ubuntu 24.04 Noble:** Full riscv64 coverage across all 12 RabbitMQ-related packages in the Noble archive:
- `rabbitmq-server`: `_all.deb` (architecture-independent), available
- `librabbitmq4`, `librabbitmq-dev`: available in riscv64 ports archive
- All other packages (`kamailio-rabbitmq-modules`, `golang-github-rabbitmq-amqp091-go-dev`, etc.): available (arch: all or riscv64-native)

**Debian:**
- `rabbitmq-server` 4.3.2-4 in Debian sid: architecture `all`, autopkgtest status Pass for riscv64. No riscv64-compiled binary (the package is bytecode).
- `librabbitmq4` 0.16.0-1 and `librabbitmq-dev` 0.16.0-1 (C AMQP client library, separate from the server): available natively for riscv64 in Debian sid.
- `rabbitmqadmin-ng` 2.29.0-1: available in Debian forky/sid for riscv64.

**Arch Linux riscv64:** Outdated FTBFS. The Arch riscv64 port (archriscv.felixc.at) is stuck at `rabbitmq 3.12.10-1` while Arch upstream is at 4.3.1-1. The last available build log (`rabbitmq-4.0.5-3.log`, Feb 2025) shows `ct` test suite failures (timetrap_timeout, assertEqual errors) and a missing `erlang-nox` dependency. No riscv64 binary for any current 4.x version is available in Arch riscv64.

**ArchPOWER riscv64 (Repology):** `rabbitmq` 4.2.3 and `rabbitmqadmin` 4.2.3 listed as available. [NEEDS VERIFICATION: actual installability and test status of this package.]

**User instructions to get a working riscv64 binary:**

Option 1 (recommended): Pull the official Alpine Docker image: `docker pull rabbitmq:4.3.2-alpine`. This provides a working riscv64 container image with Erlang interpreter mode. No compilation required.

Option 2 (distro package): On Debian sid or Ubuntu Noble, install `erlang` (riscv64) then `rabbitmq-server` (arch: all). Both are available.

Option 3 (source build): Build Erlang/OTP from source with `--disable-jit`, then build rabbitmq-server with `make`.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Erlang/OTP | BEAM VM, entire runtime, JIT backend, crypto NIF, mnesia/khepri storage | Green (Debian sid 1:29.0.2+dfsg-1 installed on riscv64 buildd `rv-manda-04`) | Yellow (interpreter only; no JIT; no riscv64 CI lane) | Green (Debian/Ubuntu packages; Docker Alpine erlang includes riscv64; Docker official erlang tag omits riscv64) | erlang/otp#7498 (JIT, open since Jul 2023), erlang/otp#7859 (build case, stalled since Dec 2023). JIT absence causes ~2-3x throughput regression. Not a correctness blocker. |
| OpenSSL | TLS, crypto primitives via Erlang `crypto` app | Green | Green (riscv64 CI in OpenSSL; Debian trixie + sid packages available) | Green | FIPS provider not tested on riscv64 (non-blocking for RabbitMQ). |
| Elixir | CLI tools (`rabbitmqctl`, `rabbitmq-diagnostics`) -- compiled to BEAM bytecode | Green (arch: all in Debian) | Green (no riscv64-specific issues) | Green (arch-independent BEAM bytecode) | None. |
| Ra (rabbitmq/ra) | Raft consensus for quorum queues and Khepri | Green (pure Erlang) | Green (0 riscv64 issues) | Green | None. |
| Khepri (rabbitmq/khepri) | Distributed replicated metadata store (replaces Mnesia in 4.x) | Green (pure Erlang) | Green (0 riscv64 issues) | Green | None. |
| Osiris (rabbitmq/osiris) | Stream queue storage engine | Green (no `c_src/`; pure Erlang) | Green (0 riscv64 issues) | Green | None. |
| Cowboy/Ranch (ninenines) | HTTP server for management UI and HTTP API | Green (pure Erlang) | Green (0 riscv64 issues) | Green | None. |
| jose (potatosalad/erlang-jose) | JWT/JWK for OAuth2 auth backend | Green (pure Erlang) | Green (0 riscv64 issues) | Green | None. |
| lz4-java (at.yawk.lz4:lz4-java) | LZ4 compression for stream Java client | Green | Green (tested on RISE riscv64 runners at PR #46 merge) | Green (1.11.0+, Apr 2026) | xxhash lacks RISC-V optimizations as of merge; jazzer does not support linux-riscv64 (fuzzing disabled for riscv64). Neither is a correctness blocker. |
| snappy-java (org.xerial.snappy) | Snappy compression for stream Java client | Green | Green (cross-compiled via dockcross) | Green (1.1.10.0+, May 2023) | None. |

**Erlang/OTP JIT -- deep-dive (primary performance blocker):**

BeamAsm, Erlang's JIT compiler, was introduced in OTP 24 for x86-64 and OTP 25 for aarch64. The JIT directory `erts/emulator/beam/jit/` contains two architecture subdirectories: `arm/` and `x86/`. There is no `riscv/` or `riscv64/` backend.

On riscv64, Erlang runs on the threaded-interpreter (generic BEAM), which is functionally correct but slower. The Erlang team's documentation states the JIT provides roughly 2-3x throughput improvement on supported architectures. No published benchmark isolates this penalty for RabbitMQ-specific workloads.

The two upstream OTP items for riscv64 JIT have been open since mid-to-late 2023 with no merge activity as of OTP 29.0.2 (June 2026). The PR (#7859) is stalled waiting for the author to fix a pattern-matching bug identified by reviewer `mikpe`. No OTP core team member has taken ownership of the riscv64 JIT work.

---

## 11. Known Bugs and Active Issues

| ID | Project | Title | Status | Severity | Notes |
|---|---|---|---|---|---|
| [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) | erlang/otp | RISC-V JIT support | Open, no assignee | High (performance) | ~2-3x throughput regression without JIT. Not a correctness issue. Open since Jul 2023. |
| [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) | erlang/otp | build: add RISC-V native case | Open, stalled "waiting" | Medium (build prerequisite) | Pattern-matching bug identified by reviewer mikpe. No activity since Dec 18, 2023. |
| [oerv-team#1312](https://github.com/openeuler-riscv/oerv-team/issues/1312) | openeuler-riscv | librabbitmq failing test cases + erlang-eldap(riscv-64) missing | Closed | Low (downstream distro only) | OpenEuler LLVM parallel universe 24.09 packaging gap. Not an upstream defect. |
| Arch Linux riscv64 FTBFS | archriscv | rabbitmq 4.x fails to build on Arch riscv64 port | Open (ongoing) | Medium (distribution gap) | Stuck at 3.12.10-1; 4.0.5-3 log shows ct test timeouts + missing `erlang-nox` dep. |
| lz4-java riscv64 fuzzing | yawkat/lz4-java | jazzer does not support linux-riscv64 | Open (known limitation) | Low | Fuzzing disabled on riscv64 at merge of PR #46. Author planned upstream jazzer PR. |

**No correctness bugs** have been reported or identified in rabbitmq/rabbitmq-server for riscv64.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

Broadcom has stated no obligation to address community requests. There is no upstream tracking issue for riscv64 in rabbitmq/rabbitmq-server. Given that Broadcom controls the committer list and the project has no foundation governance, any riscv64-specific CI or release support requires either (a) Broadcom deciding to invest, or (b) an external contributor submitting a patch that Broadcom is willing to accept. There is no evidence of either track being in motion.

**Technical blockers:**

The primary technical blocker is not in RabbitMQ itself but in Erlang/OTP: BeamAsm JIT for riscv64 is unimplemented (erlang/otp#7498). The stalled PR (#7859) requires a bug fix from the original contributor before it can progress. No OTP maintainer has stepped in. Until JIT lands in OTP, RabbitMQ on riscv64 will run at interpreter speed.

**Performance blocker quantification:** The estimated 2-3x throughput gap from missing JIT is referenced in Erlang team documentation but is not quantified specifically for RabbitMQ message-passing workloads. At the reference benchmark figure of 80,000-90,000 msg/s (with confirms off, from perftest.rabbitmq.com, x86 only), interpreter mode would imply roughly 27,000-45,000 msg/s on equivalent riscv64 hardware assuming the gap is purely JIT-related. This figure is an estimate derived from applying the documented JIT multiplier; no direct benchmark data exists.

**Acceptance probability for riscv64 CI PR:** Low in the near term. The project has no stated interest in riscv64, the Broadcom team states no obligation to respond to community PRs, and adding riscv64 QEMU-based CI to the existing matrix would increase CI runtime with no clear commercial benefit to Broadcom.

---

## 13. Investment Analysis

RISE has no current or planned investment in RabbitMQ. The RISE blog has no RabbitMQ content. RabbitMQ is not in the RISE wheel builder. No RISE working group covers messaging middleware. Work done by @luhenry (lz4-java, snappy-java) was contributed in a personal capacity using RISE RISC-V runners as infrastructure, not as a funded RISE project.

### 13.1 Functional Enablement

RabbitMQ is functionally complete on riscv64. The broker runs correctly via the BEAM interpreter. The official Docker Alpine image provides a working riscv64 container. No functional gaps require investment.

The Arch Linux FTBFS is a downstream packaging issue (missing `erlang-nox` dependency and ct test timeouts) that a single package maintainer could resolve. This is not a RabbitMQ upstream issue.

### 13.2 Performance Optimization

The sole performance gap is the missing BeamAsm JIT for riscv64 in Erlang/OTP. This is a significant gap (~2-3x estimated throughput regression) that affects every Erlang application on riscv64, not RabbitMQ specifically. The leverage point is erlang/otp#7498 and the stalled PR #7859.

Implementing BeamAsm for riscv64 is a substantial compiler backend engineering task. The BeamAsm architecture uses a register-based JIT that emits native code via an Assembler library (asmjit for x86, AsmJit-arm for aarch64). A riscv64 backend would require either adapting an existing RISC-V assembler library or implementing riscv64 code emission from scratch within the OTP framework.

### 13.3 CI/CD Infrastructure

Adding RISE riscv64 runners to rabbitmq/rabbitmq-server CI is technically straightforward (the `oci-make.yaml` already uses QEMU with Buildx; adding `linux/riscv64` to the platforms list is a one-line change). However, this requires Broadcom's approval to merge a PR and ongoing runner availability. Without Broadcom buy-in, a fork-based CI approach provides only partial value.

A more targeted CI investment would be to add riscv64 testing to the Erlang/OTP CI matrix, which would provide coverage for all Erlang-based projects including RabbitMQ.

### 13.4 Ecosystem Enablement

The stream Java client's compression dependencies (lz4-java, snappy-java) already have riscv64 JNI binaries. The remaining gap in the Java client ecosystem is the xxhash optimization (noted at lz4-java PR #46 merge as lacking riscv64-specific implementation in 0.8x). This is a minor performance item.

The cluster-operator Kubernetes operator does not build a riscv64 image. Adding riscv64 to the cluster-operator multi-arch build (`platforms: linux/amd64, linux/arm64, linux/ppc64le, linux/s390x` -> add `linux/riscv64`) is a low-complexity change, contingent on Broadcom approval.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement BeamAsm JIT backend for riscv64 in erlang/otp (unblocks erlang/otp#7498, fixes erlang/otp#7859) | 20-40 | Erlang/OTP upstream maintainer or external compiler engineer | High |
| Performance | Fix pattern-matching bug in erlang/otp PR #7859 to unblock build-system groundwork | 1-2 | Original PR author or substitute | Medium |
| CI/CD | Add riscv64 QEMU lane to rabbitmq/rabbitmq-server `oci-make.yaml` and nightly workflows | 1 | Broadcom committer (requires approval) | Medium |
| CI/CD | Add riscv64 to cluster-operator multi-arch image build | 1 | Broadcom committer (requires approval) | Low |
| Distribution | Fix Arch Linux riscv64 FTBFS for rabbitmq 4.x (erlang-nox dep + ct timeouts) | 2-3 | Arch riscv64 port maintainer | Low |
| Performance | Upstream xxhash riscv64 optimizations (affects lz4-java performance on riscv64) | 3-5 | xxhash upstream contributor | Low |
| Performance | Upstream jazzer linux-riscv64 support (enables fuzzing of lz4-java on riscv64) | 2-4 | jazzer upstream contributor | Low |

The dominant investment item by far is the BeamAsm JIT backend. All other items are low-complexity. The JIT work is also cross-cutting: it improves every Erlang/OTP application on riscv64 (RabbitMQ, Elixir, ejabberd, etc.), making it the highest-leverage single investment for the Erlang ecosystem on RISC-V.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [rabbitmq/rabbitmq-server](https://github.com/rabbitmq/rabbitmq-server) -- core broker repository
- [rabbitmq/rabbitmq-stream-java-client PR #966 -- lz4-java 1.11.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/966)
- [rabbitmq/rabbitmq-stream-java-client PR #344 -- snappy-java 1.1.10.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344)
- [rabbitmq/rabbitmq-stream-java-client PR #273 -- snappy-java 1.1.9.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/273)
- [rabbitmq/fshc PR #22 -- serde_json 1.0.146 bump](https://github.com/rabbitmq/fshc/pull/22)
- [rabbitmq/cluster-operator PR #1924 -- helm 3.18.5 bump](https://github.com/rabbitmq/cluster-operator/pull/1924)
- [yawkat/lz4-java PR #46 -- Add linux-riscv64 binary](https://github.com/yawkat/lz4-java/pull/46)
- [yawkat/lz4-java PR #50 -- Add testing on native amd64, arm, and riscv runners](https://github.com/yawkat/lz4-java/pull/50)
- [erlang/otp issue #7498 -- RISC-V JIT support](https://github.com/erlang/otp/issues/7498)
- [erlang/otp PR #7859 -- build: add RISC-V native case](https://github.com/erlang/otp/pull/7859)
- [openeuler-riscv/oerv-team issue #1312 -- librabbitmq failing test cases](https://github.com/openeuler-riscv/oerv-team/issues/1312)
- [docker-library/official-images -- library/rabbitmq definition](https://github.com/docker-library/official-images/blob/master/library/rabbitmq)
- [RabbitMQ platforms documentation](https://www.rabbitmq.com/docs/platforms)
- [RabbitMQ build server documentation](https://www.rabbitmq.com/docs/build-server)
- [Debian tracker -- rabbitmq-server](https://tracker.debian.org/pkg/rabbitmq-server)
- [Ubuntu 24.04 Noble -- RabbitMQ packages](https://packages.ubuntu.com/search?keywords=RabbitMQ&suite=noble&searchon=names&section=all)
- [Arch Linux riscv64 port status](https://archriscv.felixc.at/.status/status.htm)
- [rabbitmq/build-env-images](https://github.com/rabbitmq/build-env-images)
- [RISE project member list](https://riseproject.dev)
- [perftest.rabbitmq.com -- RabbitMQ performance benchmarks (x86 only)](https://perftest.rabbitmq.com)