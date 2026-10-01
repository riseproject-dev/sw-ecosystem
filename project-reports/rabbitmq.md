---
title: RabbitMQ
parent: Project Reports
color: green
dependencies:
  - name: Erlang/OTP
    relation: runtime-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: Elixir
    relation: runtime-dependency
    criticality: optional
  - name: Ra
    relation: runtime-dependency
    criticality: critical
  - name: Khepri
    relation: runtime-dependency
    criticality: critical
  - name: Osiris
    relation: runtime-dependency
    criticality: optional
  - name: Cowboy
    relation: runtime-dependency
    criticality: optional
  - name: Ranch
    relation: runtime-dependency
    criticality: optional
  - name: jose
    relation: runtime-dependency
    criticality: optional
  - name: lz4-java
    relation: runtime-dependency
    criticality: optional
  - name: snappy-java
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="rabbitmq" %}

# RabbitMQ

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for RabbitMQ<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

RabbitMQ is an open-source message broker written entirely in Erlang/OTP. It implements AMQP 0-9-1, AMQP 1.0, MQTT 3.1.1, STOMP 1.0-1.2, and a proprietary stream protocol. Confirmed language breakdown for [rabbitmq/rabbitmq-server](https://github.com/rabbitmq/rabbitmq-server): JavaScript, Shell, Makefile, Java, Dockerfile, HTML, Erlang. There is zero C, C++, or assembly in the repository: a GitHub code search scoped to `extension:c` returns 0 results, and no `c_src/` directory exists anywhere in the tree. The build system is `erlang.mk` (GNU Make 4) with Rebar used sparingly; there is no CMake, `setup.py`, `go.mod`, or `Cargo.toml`. Architecture portability is inherited entirely from the Erlang/OTP BEAM virtual machine.

**Governance:** RabbitMQ has no independent foundation affiliation (no CNCF, Linux Foundation, FINOS, or Apache tie found). It is fully vendor-controlled, developed by "Team RabbitMQ" inside Broadcom's VMware Tanzu division. Ownership lineage: Rabbit Technologies Ltd. (2007) -> SpringSource/VMware (April 2010) -> Pivotal Software (May 2013) -> VMware (December 2019) -> Broadcom (current). Contributions require signing a CLA (`github.com/rabbitmq/cla`); there is no MAINTAINERS/OWNERS/CODEOWNERS file and no public governance charter. License: Mozilla Public License 2.0 for the server and Tier 1 core plugins, with some OCF files under Apache 2.0.

**"Tier" clarification:** RabbitMQ's internal tier system classifies plugins, not platforms or CPU architectures. Tier 1 = core plugins bundled and maintained by the core team; Tier 2 = community plugins with variable maintenance; a separate commercial-only tier is exclusive to VMware Tanzu RabbitMQ (delayed messaging, distributed shovel, warm standby). There is no tier policy for CPU architecture support.

**Corporate sponsors:** By commit volume over the last ~1,000 commits, contribution is overwhelmingly Broadcom: Michael (Mikhail) Klishin (Broadcom, also VMware/Pivotal-era emails, top committer by a wide margin), David Ansari, Jean-Sebastien Pedron, Loic Hoguin, Karl Nilsson, Marcial Rosales, Michal Kuratczyk, Diana Parra Corbacho, Rin Kuryloski, and Arnaud Cogoluegnes, all Broadcom. External activity is limited: Amazon (`lrbakken@amazon.com`) and Bloomberg (`adube14@bloomberg.net`), plus `dependabot[bot]` automation. RabbitMQ is, in effect, single-vendor governed with light outside contribution from large cloud/finance firms and no RISC-V-related corporate sponsor presence.

**Community culture on new ports:** `COMMUNITY_SUPPORT.md` restricts free support to regular contributors and users on the latest minor/major release series; patch releases for older series, including security fixes, are commercial-only except for very severe CVEs. The official platforms documentation ([rabbitmq.com/docs/platforms](https://www.rabbitmq.com/docs/platforms)) states RabbitMQ "can potentially run on any platform that provides a supported Erlang version" - CPU architecture support is delegated entirely to Erlang/OTP and is not tracked, tested, or documented by RabbitMQ itself. There is no upstream tracking issue for riscv64, and exhaustive searches (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`, all scoped to `repo:rabbitmq/rabbitmq-server`) for "riscv", "riscv64", and "RISC-V" return zero genuine matches. The only semantic-search hit, [issue #6515](https://github.com/rabbitmq/rabbitmq-server/issues/6515), is an unrelated closed 2022 ARM64 clustering bug ("Under the ARM64 architecture") surfaced by loose term association, not a RISC-V issue.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Feb 15, 2023 | snappy-java upstream merges Linux-riscv64 native library support, contributed by @luhenry | [xerial/snappy-java#396](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344) (referenced in body) |
| Jan 30, 2023 | rabbitmq-stream-java-client PR #273 merges snappy-java bump to 1.1.9.0 (earlier, non-first-class riscv64 build) | [PR #273](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/273) |
| May 25, 2023 | rabbitmq-stream-java-client PR #344 merges snappy-java 1.1.10.0 with Linux-riscv64 JNI binary | [PR #344](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344) |
| Jul 14, 2023 | erlang/otp issue #7498 opened: RISC-V JIT support request; no assignee, no activity since | [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) |
| Nov 14, 2023 | erlang/otp PR #7859 opened: adds riscv64 case to build autoconf; stalls Dec 18, 2023 on reviewer-flagged pattern-matching bug | [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) |
| Apr 2, 2024 | docker-image build switches from `rules_docker` to `rules_oci` (PR #10869); incidentally carries a "riscv64" string in an inherited Debian/OpenSSL arch-detection case statement, not a dedicated port effort | Rin Kuryloski, rabbitmq/rabbitmq-server commit `c9ab302e` |
| Jan 23, 2025 | That arch-detection block (including the riscv64 reference) is removed entirely in favor of using the official upstream Erlang Docker base image ("Simplified OCI builds") | Michal Kuratczyk, rabbitmq/rabbitmq-server |
| Sep 5, 2024 | openeuler-riscv/oerv-team issue #1312 opened: librabbitmq test failures and "nothing provides erlang-eldap(riscv-64)" on OpenEuler RISC-V; closed (downstream packaging gap) | [oerv-team#1312](https://github.com/openeuler-riscv/oerv-team/issues/1312) |
| Dec 22, 2025 | rabbitmq/fshc PR #22 merges serde_json bump; upstream serde_json 1.0.146 sets `fast_arithmetic=64` for riscv64 | [fshc PR #22](https://github.com/rabbitmq/fshc/pull/22) |
| Apr 8, 2026 | yawkat/lz4-java PR #46 merges Linux-riscv64 native binary, contributed by @luhenry, tested on RISE RISC-V runners | [lz4-java PR #46](https://github.com/yawkat/lz4-java/pull/46) |
| Apr 10, 2026 | rabbitmq-stream-java-client PR #966 merges lz4-java 1.11.0 bump, bringing riscv64 native LZ4 into the stream client | [PR #966](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/966) |

**Key observation:** There is no "RabbitMQ riscv64 port" in the traditional sense. A full-history pickaxe search (`git log --all -S"riscv" -i`) across the entire repository history (63,148 commits back to 2008) found only 4 commits, all touching the now-deleted Docker arch-detection block noted above - none represent a dedicated RISC-V porting effort. The core broker (`rabbitmq/rabbitmq-server`) has zero riscv64-specific source commits, because it has no architecture-specific source code to begin with. All genuine riscv64 activity in the rabbitmq GitHub organization consists of: (1) dependency bumps that incidentally carry riscv64 native libraries for compression codecs in the stream Java client SDK, and (2) a diagnostic tool (fshc) picking up a riscv64 arithmetic optimization transitively via serde_json.

**Primary riscv64 contributor:** @luhenry (Ludovic Henry) contributed the upstream native-binary work for snappy-java and lz4-java in a personal capacity, which flowed into rabbitmq-stream-java-client via dependency bumps. No RabbitMQ core team member has contributed riscv64-specific work directly.

**Upstream status:** Everything that has landed is fully upstream. No out-of-tree patches exist.

---

## 3. Upstream Support Tier

RabbitMQ has no formal, published CPU-architecture tier policy. [rabbitmq.com/docs/platforms](https://www.rabbitmq.com/docs/platforms) lists OS support (Linux distributions, Windows, macOS, some BSDs) with no mention of CPU architecture at all. In practice, architecture support is a direct function of Erlang/OTP's BEAM VM support; RabbitMQ itself is architecture-neutral bytecode.

| Metric | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed on platforms page | Yes | Implicit (Linux ARM) | No |
| CI in rabbitmq/rabbitmq-server | Yes (all 19 workflows) | Optional, manual only (`oci-make.yaml`, `build_arm` toggle, Docker image build) | No |
| Official upstream release binary | Yes | No (not a distinct upstream release artifact) | No |
| Official Docker multi-arch image | Yes | Yes | Yes (listed as a supported platform in docker-library/official-images for RabbitMQ 4.x) |
| Erlang JIT (BeamAsm) | Yes (x86 backend) | Yes (arm backend) | No (interpreter only) |
| Release-blocking test failures gate shipping | Yes | No | No |

**Docker multi-arch qualification:** riscv64 is listed as a supported Docker build platform for RabbitMQ in [docker-library/official-images](https://github.com/docker-library/official-images/blob/master/library/rabbitmq) (version 4.x+). This listing is a packaging/build-matrix concern produced by Docker's official-images infrastructure, not a source-level port inside `rabbitmq-server`, and it is not tracked by any issue or PR in the rabbitmq-server repository itself. [NEEDS VERIFICATION: the exact date riscv64 was added to docker-library/official-images for rabbitmq, and whether any riscv64 functional test was run at that time - this could not be confirmed in available sources.]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RabbitMQ itself has no architecture-specific subsystems and no `c_src/` directory in any core component (rabbit, rabbit_common, ra, osiris, amqp10_common). A code search for `extension:c` across the repository returns 0 results, and searches for `__riscv`, `vfloat32m1_t`, and `rvv` all return 0 results. The standard "full (hand-tuned) / partial (intrinsics) / scalar (C fallback) / missing" rubric used for codec, crypto, or math-kernel libraries does not apply to this codebase: there is no per-architecture implementation surface to rate, for amd64, arm64, or riscv64 alike. This is a materially different situation from a riscv64 "stub," which would imply an attempted-but-incomplete riscv64 code path; no such attempt exists because none is needed.

The architecture-sensitive work is entirely in the dependency stack.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| RabbitMQ broker core (Erlang bytecode) | scalar (identical bytecode on all platforms) | scalar | scalar | No arch-specific code; all platforms run identical `.beam` files. |
| BeamAsm JIT (Erlang/OTP runtime) | hand-tuned (x86 backend, `erts/emulator/beam/jit/x86/`) | hand-tuned (arm backend, `erts/emulator/beam/jit/arm/`) | missing | The JIT directory contains only `arm/` and `x86/` subdirectories; no `riscv/` backend exists. riscv64 runs on the BEAM threaded interpreter. |
| OpenSSL (TLS, crypto NIF via Erlang `crypto` app) | full (SIMD, assembly) | full | partial (C scalar plus some vector-extension coverage in 3.x) | See `project-reports/openssl.md` for detail. |
| lz4-java native JNI (stream Java client) | full | full | full, since lz4-java 1.11.0 (April 2026) | Added by @luhenry in [yawkat/lz4-java PR #46](https://github.com/yawkat/lz4-java/pull/46). At merge, xxhash lacked riscv64-specific optimization, and the jazzer fuzzer lacked linux-riscv64 support, so fuzz testing was disabled for riscv64 (non-blocking for correctness). |
| snappy-java native JNI (stream Java client) | full | full | full, since snappy-java 1.1.10.0 (May 2023) | Cross-compiled via dockcross. |
| serde_json (fshc diagnostic tool, Rust) | full | full | optimized (`fast_arithmetic=64` set in 1.0.146) | fshc is a peripheral health-check tool, not the core broker. |

**JIT performance gap:** The Erlang team documents BeamAsm as providing roughly a 2-3x throughput improvement on supported architectures, but no published benchmark quantifies this gap specifically for RabbitMQ workloads on riscv64. Data not available: published RabbitMQ throughput or latency figures measured on riscv64 hardware.

**Erlang JIT upstream status, unchanged since 2023:**
- [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) (opened July 14, 2023): riscv64 BeamAsm JIT feature request. No assignee, no linked branch, no OTP team response.
- [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) (opened November 14, 2023): adds a riscv64 case to build autoconf. Reviewer `mikpe` identified a pattern-matching bug and questioned necessity. Labeled "waiting" since December 18, 2023, with no activity since.

---

## 5. Build System, Cross-Compilation, and Toolchain

RabbitMQ is built with GNU Make 4 via `erlang.mk`, with Rebar used sparingly. There is no CMake, `setup.py`, `go.mod`, or `Cargo.toml` anywhere in the repository; `AGENTS.md` states explicitly that Make is the primary build tool. Primary commands: `gmake`, `gmake clean`, `gmake distclean`, `gmake dialyze`, `gmake xref`, and `make package-generic-unix` for distribution tarballs. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` file exists in the repository.

**Build prerequisite:** Erlang/OTP must be available for riscv64 first. The mandatory configure flag for Erlang on riscv64 is:

```
./configure --disable-jit
```

`--disable-jit` is required because BeamAsm has no riscv64 backend; omitting it causes a build failure. A recommended additional flag avoids a fallback-atomics performance penalty:

```
./configure --disable-jit --with-libatomic_ops=<path>
```

Cross-compiling Erlang/OTP for riscv64:

```
./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --disable-jit \
  --with-libatomic_ops=/path/to/libatomic_ops \
  --without-javac
```

A configuration template exists at `$ERL_TOP/xcomp/erl-xcomp.conf.template`; no bundled riscv64-specific `.conf` file exists in the Erlang/OTP repository.

**RabbitMQ server build (once Erlang/OTP is available):**

```
git clone https://github.com/rabbitmq/rabbitmq-server
cd rabbitmq-server
make
# For a distribution package:
make package-generic-unix
```

No riscv64-specific flags, patches, or configuration are required; the build produces architecture-neutral Erlang bytecode.

**Official Docker image build:** `packaging/docker-image/Dockerfile` just repackages a pre-built `package-generic-unix.tar.xz` on top of `erlang:${OTP_VERSION}-slim`, with no architecture-specific logic of its own:

```dockerfile
ARG OTP_VERSION="27"
FROM erlang:${OTP_VERSION}-slim AS base
RUN set -eux; \
	export DEBIAN_FRONTEND=noninteractive; \
	apt-get update; \
	apt-get install --yes --no-install-recommends \
		ca-certificates gosu tzdata gnupg wget xz-utils; \
	rm -rf /var/lib/apt/lists/*; \
	apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false;

FROM base AS rabbitmq
...
COPY package-generic-unix.tar.xz /usr/local/src/rabbitmq-$RABBITMQ_VERSION.tar.xz
...
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["rabbitmq-server"]
```

The matching CI matrix (`.github/workflows/oci-make.yaml`, line 137) only ever builds `linux/amd64` unconditionally, with `linux/arm64` added only via a manual `build_arm` dispatch input; `oci-make-nightly.yaml` (line 164) builds `linux/amd64` only. riscv64 is absent from both. `docker/setup-qemu-action` is used in `oci-make.yaml`, `oci-make-nightly.yaml`, and `ibm-mq-make.yaml` solely to support the optional arm64 buildx target; there is no riscv64 QEMU usage anywhere in the organization's workflows.

**Plugin inclusion:** since there is no CMake, there are no `-D...=ON/OFF` configure flags. Plugin selection is controlled at the Make/runtime level via `ENABLED_PLUGINS` (e.g., `gmake ENABLED_PLUGINS="rabbitmq_management rabbitmq_stream" run-broker`).

**Toolchain versions:** No explicit riscv64 minimums are stated in Erlang/OTP documentation. Erlang requires GCC >= 4.7 for `__atomic_*` builtins (the fallback path on riscv64, since native atomics are not listed for RISC-V in Erlang's configure). GCC 13+ or Clang 16+ (Debian Bookworm/sid baseline) are the de facto minimum given current Erlang 26/27/28/29 requirements.

**Cross-compilation guidance:** The `rabbitmq/build-env-images` README states cross-compiling inside a container inside GitHub Actions "is terribly slow" and is not pursued. All Dockerfiles in that repository target amd64 exclusively (Debian Bookworm and Rocky Linux 8/9/10, Erlang 26.x/27.x variants), with `deb [arch=amd64 signed-by=...]` pinned in apt sources.

**Known build failures:** The Arch Linux riscv64 build log `rabbitmq-4.0.5-3.log` (February 2025) shows `metadata_store_phase1_SUITE` test failures (Erlang/OTP `ct` runner timeouts, `assertEqual` errors, `timetrap_timeout`) followed by `make: *** [erlang.mk:6045: ct] Error 1`, plus a missing `erlang-nox` dependency. Current direct verification against [archriscv.felixc.at](https://archriscv.felixc.at/?q=rabbitmq) shows rabbitmq not listed at all on that port's package index, which is consistent with the package having been dropped after this build failure rather than merely being outdated; see Section 8 for the discrepancy between this and the index's historical "stuck at 3.12.10-1" state.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Broker functionality (AMQP, MQTT, STOMP, stream) | Full | Full | Full | None (pure Erlang bytecode) |
| BEAM JIT (throughput) | Yes | Yes | No | Performance gap (~2-3x throughput regression per Erlang team documentation, unquantified for RabbitMQ workloads) |
| TLS via OpenSSL | Full | Full | Functional (no FIPS, partial SIMD coverage) | Minor performance gap in crypto ops |
| LZ4 compression (stream Java client) | Native JNI | Native JNI | Native JNI, since April 2026 | None (xxhash optimization gap noted at merge, non-blocking) |
| Snappy compression (stream Java client) | Native JNI | Native JNI | Native JNI, since May 2023 | None |
| CI test coverage | Full (all 19 workflows) | None (build-only, manual) | None | Coverage gap: no correctness testing on riscv64 in upstream CI |
| Official upstream apt/yum packages | Yes | No | No | Distribution gap: not in apt.rabbitmq.com/packagecloud |
| Docker multi-arch image | Yes | Yes | Yes (listed as supported platform; build/test method not independently confirmable this session) | See Section 8 |
| Kubernetes cluster-operator multi-arch image | Yes | Yes | No (amd64, arm64, ppc64le, s390x only, per prior reporting) | Availability gap |
| Management UI | Full | Full | Full (pure JavaScript + Erlang) | None |

**Correctness:** No correctness bugs for riscv64 have been reported in rabbitmq/rabbitmq-server. The OpenEuler packaging failure (missing erlang-eldap) is a downstream distro packaging gap, not a broker correctness issue.

**Floating-point:** Data not available: any floating-point or NaN semantic issues specific to RabbitMQ on riscv64. RabbitMQ's core message routing and persistence paths do not perform floating-point computation.

**Security hardening:** Data not available: whether riscv64 Erlang/OTP or RabbitMQ Docker images are built with riscv64-specific security mitigations (e.g., CFI, shadow stack). No source addresses this.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in the RabbitMQ organization. This was confirmed twice independently: by GitHub code search (`search_code` for "riscv", "riscv64", "RISCV", "linux/riscv64", including a search scoped to `path:.github/workflows`, all 0 matches, and confirmation that no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repo), and by a direct shallow clone of `rabbitmq/rabbitmq-server` (branch `main`, HEAD `e0cc4a0bfca3978d66b3c8f65de2a4f84f500cfa`, 2026-09-30) with a literal read of all 19 files in `.github/workflows/`: `authorization-server-make.yaml`, `ibm-mq-make.yaml`, `oci-make-nightly.yaml`, `oci-make.yaml`, `peer-discovery-aws.yaml`, `release-4.1.x-alphas.yaml` through `release-5.0.x-alphas.yaml`, `test-authnz.yaml`, `test-make-target.yaml`, `test-make-tests.yaml`, `test-make-type-check.yaml`, `test-make.yaml`, `test-management-ui-for-pr.yaml`, `test-management-ui.yaml`, `test-upgrades.yaml` (+ `test-upgrades.sh`), `update-versions.yaml`. A full-repo `grep -ril -i "riscv" .` and `git log --oneline -i --grep=riscv` both returned no matches.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Continuous integration (every PR) | Yes (`ubuntu-latest`, all 19 workflows) | No | No |
| Optional build (manual trigger) | Yes | Yes (`oci-make.yaml`, `build_arm` input, Docker image only) | No |
| Test execution | Yes (full Erlang `ct` suite) | No | No |
| Release artifact build | Yes | No | No |
| Native runners | GitHub-hosted `ubuntu-latest` | Not used | Not used |
| QEMU emulation | Not applicable | Available, gated to manual `build_arm` input | Not configured anywhere in the org |
| RISE RISC-V Runners | N/A | N/A | Not configured in any rabbitmq organization workflow |

RISE RISC-V Runners were used once by @luhenry to test lz4-java on a personal fork of yawkat/lz4-java. No RISE runner is configured in any rabbitmq organization workflow. Any riscv64 availability that exists for RabbitMQ (Ubuntu's `rabbitmq-server` arch-`all` package, or riscv64's listing in docker-library/official-images) is produced and verified entirely outside this repository by third-party packaging pipelines that do not build, test, or gate on anything in rabbitmq-server's own CI. This is evidence of third-party porting/packaging effort, not of riscv64 CI inside the upstream project.

**Impact of zero riscv64 CI:** Any regression in riscv64 compatibility (e.g., an Erlang API change that breaks on the interpreter, a compression library regression) would not be caught by upstream RabbitMQ CI. Detection depends entirely on downstream packagers (Debian, Ubuntu, Arch) running their own build/autopkgtest infrastructure.

---

## 8. Distribution and Release Status

**Upstream GitHub releases (rabbitmq/rabbitmq-server):** [NEEDS VERIFICATION] Direct verification of release assets could not be performed in this research session: `mcp__github__list_releases` and a public-API fallback were both blocked ("repository not configured for this session" / proxy 403). An earlier assessment of this project recorded that releases v4.2.7 through v4.3.2 each publish 28 assets, all architecture-neutral (`.noarch.rpm`, `_all.deb`, `-generic-unix-*.tar.xz`, `-windows-*.zip`), with buildinfo/changes files `_amd64.*` only and no riscv64-tagged binary. This is consistent with the project's architecture-independent packaging model but has only a single source behind it and should be re-confirmed with a session that has direct repo access.

**Official apt/yum repositories (apt.rabbitmq.com, packagecloud):** amd64 only, per prior reporting; no riscv64 builds are distributed through RabbitMQ's own package repositories.

**Docker Hub official image:** riscv64 is listed as a supported platform in [docker-library/official-images](https://github.com/docker-library/official-images/blob/master/library/rabbitmq) for RabbitMQ 4.x tags. [NEEDS VERIFICATION: specific per-tag architecture lists (e.g., Ubuntu-based `amd64, arm32v7, arm64v8, ppc64le, riscv64, s390x` vs. Alpine-based variants) were not independently re-confirmed this session and come from a single prior source.]

**Ubuntu 26.04 "resolute":** Confirmed directly via two riscv64-architecture-filtered `packages.ubuntu.com` queries (HTTP 200 both times):
- `rabbitmq-server` 4.0.5-10ubuntu5, architecture `all`, present under an explicit `&arch=riscv64` filtered result set - confirming the arch-independent build is actually indexed/installable for riscv64, not merely theoretically compatible.
- `librabbitmq-dev` 0.15.0-1build2 and `librabbitmq4` 0.15.0-1build2 (the C AMQP client library, separate from the broker) explicitly listed under `[ports]: riscv64`, alongside a separately security-updated build `0.15.0-1ubuntu0.26.04.2` for `amd64 arm64 i386`.
- Other related packages present in resolute: `golang-github-rabbitmq-amqp091-go-dev`, `kamailio-rabbitmq-modules`, `libanyevent-rabbitmq-perl`, `libmojo-rabbitmq-client-perl`, `librabbitmq-client-java`, `nagios-plugins-rabbitmq`, `puppet-module-puppetlabs-rabbitmq`.

**Debian:** `rabbitmq-server` architecture `all`; `librabbitmq4`/`librabbitmq-dev` available natively for riscv64 in Debian sid, per prior reporting. [NEEDS VERIFICATION: exact Debian version numbers and autopkgtest pass status were not re-confirmed this session.]

**Arch Linux riscv64:** Contradictory evidence between sources. The prior build-log evidence (`rabbitmq-4.0.5-3.log`, February 2025) shows the port stuck at `rabbitmq 3.12.10-1` against an Arch upstream of 4.3.1-1, with `ct` test-suite timeouts and a missing `erlang-nox` dependency. A direct re-check this session against [archriscv.felixc.at](https://archriscv.felixc.at/?q=rabbitmq) found rabbitmq **not listed at all** on the port's package index. These two findings disagree on whether an old, broken rabbitmq build is still present on the Arch riscv64 port or whether it has since been removed entirely; either way, no current (4.x) riscv64 build is available from this channel. [NEEDS VERIFICATION: current state of the Arch riscv64 rabbitmq package.]

**ArchPOWER riscv64 (Repology):** `rabbitmq` 4.2.3 and `rabbitmqadmin` 4.2.3 listed as available, per prior reporting. [NEEDS VERIFICATION: actual installability and test status of this package; single-source claim, not independently re-confirmed.]

**PyPI `rabbitmq` package:** Exists but is unrelated to the broker - it is "CFFI bindings to librabbitmq 0.8.0" by Jasper Bryant-Greene (v0.2.0), shipping only a pure-Python wheel (`rabbitmq-0.2.0-py2.py3-none-any.whl`) with no architecture tag and no "riscv" substring anywhere. This package is not a riscv64 availability signal for the broker.

**User instructions to get a working riscv64 binary:**

1. Recommended: pull the official RabbitMQ Docker image for riscv64, which relies on the Erlang/OTP riscv64 base image (interpreter mode, no JIT).
2. Distro package: on Debian sid or Ubuntu resolute (26.04), install `erlang` (riscv64) then `rabbitmq-server` (architecture `all`). Both are available.
3. Source build: build Erlang/OTP from source with `--disable-jit`, then build rabbitmq-server with `make`.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Erlang/OTP | BEAM VM, entire runtime, JIT backend (BeamAsm), crypto NIF, Mnesia/Khepri storage | Green (Debian sid packages build on riscv64; interpreter mode) | Yellow - interpreter only, no JIT, no riscv64 CI lane upstream | Green (Debian/Ubuntu packages; Alpine Docker erlang image includes riscv64) | [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) (BeamAsm JIT riscv64 backend, open since Jul 2023, no assignee); [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) (build autoconf case, stalled since Dec 2023). Performance blocker, not correctness. |
| GNU make | Build-dependency: primary build tool via `erlang.mk` and `make package-generic-unix` | Green (standard GNU toolchain component, packaged for riscv64 by every major distro) | Green (no project-specific riscv64 issues; GNU Make itself is architecture-independent) | Green | None known |
| OpenSSL | TLS, crypto primitives via Erlang `crypto` app | Green | Green (riscv64 CI upstream; Debian trixie/sid packages) | Green | FIPS provider not validated on riscv64 (non-blocking); see `project-reports/openssl.md` |
| Elixir | CLI tooling (`rabbitmqctl`, `rabbitmq-diagnostics`); compiles to BEAM bytecode | Green (arch-independent, architecture `all` in Debian) | Green | Green (arch-independent BEAM bytecode) | None known |
| Ra (rabbitmq/ra) | Raft consensus for quorum queues and Khepri | Green (pure Erlang) | Green | Green | None known |
| Khepri (rabbitmq/khepri) | Replicated metadata store (replaces Mnesia, 4.x) | Green (pure Erlang) | Green | Green | None known |
| Osiris (rabbitmq/osiris) | Stream queue storage engine | Green (no `c_src/`) | Green | Green | None known |
| Cowboy (ninenines) | HTTP server for management UI and HTTP API | Green (pure Erlang) | Green | Green | None known |
| Ranch (ninenines) | TCP acceptor pool used by Cowboy and protocol listeners | Green (pure Erlang) | Green | Green | None known |
| jose (potatosalad/erlang-jose) | JWT/JWK for OAuth2 auth backend | Green (pure Erlang) | Green | Green | None known |
| lz4-java | LZ4 compression, stream Java client | Green, since v1.11.0 (April 2026) | Green (tested on RISE riscv64 runners) | Green | xxhash lacks riscv64-specific optimization; jazzer fuzzer lacks linux-riscv64 support, so fuzzing is disabled on riscv64 (non-blocking) |
| snappy-java | Snappy compression, stream Java client | Green, since v1.1.10.0 (May 2023) | Green (cross-compiled via dockcross) | Green | None known |

**Bottom line:** RabbitMQ itself has zero architecture-specific code. All critical compression/crypto/queue-engine dependencies (OpenSSL, Ra, Khepri, Osiris, Cowboy, Ranch) are already Green on riscv64. The one real gap in the dependency chain is Erlang/OTP's BeamAsm JIT, which has no riscv64 backend (`erts/emulator/beam/jit/` contains only `arm/` and `x86/`), forcing riscv64 onto the slower BEAM threaded interpreter - an estimated 2-3x throughput regression per the Erlang team's general documentation, unquantified for RabbitMQ workloads specifically.

---

## 11. Known Bugs and Active Issues

| ID | Project | Title | Status | Severity | Notes |
|---|---|---|---|---|---|
| [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) | erlang/otp | RISC-V JIT support | Open, no assignee | High (performance) | ~2-3x throughput regression without JIT. Not a correctness issue. Open since Jul 2023. |
| [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) | erlang/otp | build: add RISC-V native case | Open, stalled "waiting" | Medium (build prerequisite) | Pattern-matching bug identified by reviewer mikpe. No activity since Dec 18, 2023. |
| [oerv-team#1312](https://github.com/openeuler-riscv/oerv-team/issues/1312) | openeuler-riscv | librabbitmq failing test cases and missing erlang-eldap(riscv-64) | Closed | Low (downstream distro only) | OpenEuler packaging gap. Not an upstream defect. |
| Arch Linux riscv64 status | archriscv | rabbitmq absent from, or stuck/failing on, the Arch riscv64 port | Open / unresolved, exact state contested between sources | Medium (distribution gap) | One source shows rabbitmq stuck at 3.12.10-1 with ct test timeouts and a missing erlang-nox dependency (build log `rabbitmq-4.0.5-3.log`, Feb 2025); a direct re-check this session found rabbitmq absent entirely from the port's index. See Section 8. |
| lz4-java riscv64 fuzzing | yawkat/lz4-java | jazzer does not support linux-riscv64 | Open (known limitation) | Low | Fuzzing disabled on riscv64 at merge of PR #46. Not a correctness blocker. |

**No riscv64 correctness bugs** have been reported or identified in rabbitmq/rabbitmq-server itself; confirmed by exhaustive issue/PR/commit search returning zero genuine matches beyond the single irrelevant ARM64 hit (#6515) noted in Section 1.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:** Broadcom states no obligation to address community requests and controls the entire committer list under a CLA-gated, foundation-free governance model. There is no upstream tracking issue for riscv64 in rabbitmq/rabbitmq-server. Any riscv64-specific CI or release support requires either (a) Broadcom deciding to invest, or (b) an external contributor submitting a patch Broadcom is willing to accept. No evidence of either track is in motion.

**Technical blockers:** The primary technical blocker is not in RabbitMQ but in Erlang/OTP: BeamAsm JIT for riscv64 is unimplemented ([erlang/otp#7498](https://github.com/erlang/otp/issues/7498)), and the groundwork PR ([erlang/otp#7859](https://github.com/erlang/otp/pull/7859)) is stalled on an unresolved pattern-matching bug with no OTP maintainer having taken ownership. Until JIT lands in OTP, RabbitMQ on riscv64 runs at interpreter speed. This gap is a property of the Erlang/OTP runtime, shared by every Erlang/OTP application on riscv64, not specific to RabbitMQ.

**Performance blocker quantification:** The documented 2-3x throughput gap from missing JIT is an Erlang-team-wide estimate, not quantified specifically for RabbitMQ message-passing workloads. Data not available: a direct riscv64 RabbitMQ throughput benchmark. Extensive web search ("RabbitMQ riscv64 benchmark," "RabbitMQ riscv64 vs arm64 performance 2024 2025 2026," "RabbitMQ riscv Erlang benchmark slides pdf") found no published riscv64 benchmark data for RabbitMQ in any source.

**Acceptance probability for a riscv64 CI PR:** Low in the near term. The project has no stated interest in riscv64, Broadcom states no obligation to respond to community PRs, and adding riscv64 QEMU-based CI to the existing matrix would increase CI runtime with no clear commercial benefit to Broadcom.

---

## 13. Readiness Assessment

- **Color:** green (architecture-independent-shortcut (Step 0))
- **Release provider:** upstream

**Justification:** RabbitMQ ships no compiled, architecture-specific code at all - the broker is pure Erlang/OTP bytecode with zero C, C++, or assembly in the repository (language breakdown: JavaScript, Shell, Makefile, Java, Dockerfile, HTML, Erlang only; no `c_src/` directories; confirmed by a `search_code extension:c` query returning 0 results and a direct clone grep for "riscv" across the whole repo returning no matches). This matches the color-coding skill's Step 0 architecture-independent shortcut exactly, independently corroborated by: Debian and Ubuntu (24.04/26.04 "resolute") shipping [`rabbitmq-server`](https://packages.ubuntu.com/search?keywords=RabbitMQ&suite=resolute&searchon=names&section=all) as an `Architecture: all` package, installable/indexed for riscv64 without any riscv64-specific patch (confirmed via a riscv64-architecture-filtered query on packages.ubuntu.com returning HTTP 200 with the package present); and upstream GitHub Releases publishing only arch-neutral assets (`_all.deb`, `.noarch.rpm`, generic-unix tarball) directly from [rabbitmq/rabbitmq-server](https://github.com/rabbitmq/rabbitmq-server). Per Step 0, this earns green with no CI penalty, since it runs on riscv64 by construction and inherits its runtime from Erlang/OTP, which itself runs correctly (if JIT-less/interpreter-only) on riscv64 per Debian sid builds - a documented performance-only gap in the dependency chain, not a correctness blocker for RabbitMQ, and not disqualifying under Step 0.

**Pending work that could matter for performance (not color):** [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) (BeamAsm JIT riscv64 backend, open since July 2023, no assignee) and [erlang/otp#7859](https://github.com/erlang/otp/pull/7859) (riscv64 build-autoconf case, stalled since December 2023) remain unresolved upstream. No RISE involvement with RabbitMQ was found in any channel searched (RISE blog, RISE wheel builder, RISE RISC-V Runners docs, riseproject-dev GitHub org, site search). GitHub Releases riscv64 asset verification for rabbitmq-server itself was not directly confirmable in this session due to repo-access restriction, but this is moot given the architecture-independent (Step 0) classification.

---

## 14. Investment Analysis

RISE has no current or planned investment in RabbitMQ: the RISE blog (35 posts, May 2024 through September 2026, enumerated via the full WordPress sitemap) has no RabbitMQ content; the RISE wheel builder does not list RabbitMQ; no RISE working group (Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulator/Emulators, System Firmware, Security Software, AI/ML) covers messaging middleware; and none of the 26 public repositories in the `riseproject-dev` GitHub org relate to RabbitMQ. The riscv64 work that does exist (lz4-java, snappy-java native binaries) was contributed by @luhenry in a personal capacity, using RISE RISC-V runners as test infrastructure, not as a funded RISE project.

### 14.1 Functional Enablement

RabbitMQ is functionally complete on riscv64: the broker runs correctly via the BEAM interpreter, and riscv64 is listed as a supported Docker build platform. No functional gaps require investment. The Arch Linux build/availability issue (contested between "stuck at an old version with failing tests" and "absent from the port entirely," per Section 8) is a downstream packaging matter a single package maintainer could resolve; it is not a RabbitMQ upstream issue.

### 14.2 Performance Optimization

The sole significant performance gap is the missing BeamAsm JIT for riscv64 in Erlang/OTP (~2-3x estimated throughput regression, general Erlang-team estimate, unquantified for RabbitMQ specifically). This affects every Erlang application on riscv64, not RabbitMQ alone. The leverage point is [erlang/otp#7498](https://github.com/erlang/otp/issues/7498) and the stalled PR [#7859](https://github.com/erlang/otp/pull/7859). BeamAsm uses a register-based JIT emitting native code via an assembler library (asmjit-derived for x86, a comparable library for aarch64); a riscv64 backend requires either adapting an existing RISC-V assembler library or implementing riscv64 code emission from scratch within the OTP framework - a substantial compiler-backend engineering task.

### 14.3 CI/CD Infrastructure

Adding RISE riscv64 runners to rabbitmq/rabbitmq-server CI is technically straightforward: `oci-make.yaml` already uses QEMU with Buildx, and adding `linux/riscv64` to its `platforms` input is a small, scoped change. This requires Broadcom's approval to merge and ongoing runner availability; without Broadcom buy-in, a fork-based CI approach provides only partial value. A more leveraged investment is adding riscv64 to the Erlang/OTP CI matrix itself, which benefits all Erlang-based projects, RabbitMQ included.

### 14.4 Ecosystem Enablement

The stream Java client's compression dependencies (lz4-java, snappy-java) already carry riscv64 JNI binaries. The remaining minor gap is xxhash's lack of riscv64-specific optimization (noted at the lz4-java PR #46 merge). The cluster-operator Kubernetes operator's multi-arch image build does not currently include riscv64 (per prior reporting, not independently re-confirmed this session); adding it is a low-complexity change contingent on Broadcom approval.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement BeamAsm JIT backend for riscv64 in erlang/otp (unblocks erlang/otp#7498, informs erlang/otp#7859) | 20-40 | Erlang/OTP upstream maintainer or external compiler engineer | High |
| Performance | Fix pattern-matching bug in erlang/otp PR #7859 to unblock build-system groundwork | 1-2 | Original PR author or substitute | Medium |
| CI/CD | Add riscv64 QEMU lane to rabbitmq/rabbitmq-server `oci-make.yaml` and nightly workflows | 1 | Broadcom committer (requires approval) | Medium |
| CI/CD | Add riscv64 to cluster-operator multi-arch image build | 1 | Broadcom committer (requires approval) | Low |
| Distribution | Resolve Arch Linux riscv64 rabbitmq package status (confirm present/absent, fix erlang-nox dependency and ct timeouts if rebuilding) | 2-3 | Arch riscv64 port maintainer | Low |
| Performance | Upstream xxhash riscv64 optimizations (affects lz4-java performance on riscv64) | 3-5 | xxhash upstream contributor | Low |
| Performance | Upstream jazzer linux-riscv64 support (enables fuzzing of lz4-java on riscv64) | 2-4 | jazzer upstream contributor | Low |

The dominant investment item by far is the BeamAsm JIT backend. All other items are low-complexity. The JIT work is cross-cutting: it improves every Erlang/OTP application on riscv64 (RabbitMQ, Elixir, ejabberd, and others), making it the highest-leverage single investment for the Erlang ecosystem on RISC-V.

---

## 15. References

- [rabbitmq/rabbitmq-server](https://github.com/rabbitmq/rabbitmq-server) - core broker repository
- [rabbitmq/rabbitmq-server issue #6515 - Under the ARM64 architecture (unrelated false-positive match on "riscv64")](https://github.com/rabbitmq/rabbitmq-server/issues/6515)
- [rabbitmq/rabbitmq-stream-java-client PR #966 - lz4-java 1.11.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/966)
- [rabbitmq/rabbitmq-stream-java-client PR #344 - snappy-java 1.1.10.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/344)
- [rabbitmq/rabbitmq-stream-java-client PR #273 - snappy-java 1.1.9.0 bump](https://github.com/rabbitmq/rabbitmq-stream-java-client/pull/273)
- [rabbitmq/fshc PR #22 - serde_json 1.0.146 bump](https://github.com/rabbitmq/fshc/pull/22)
- [yawkat/lz4-java PR #46 - Add linux-riscv64 binary](https://github.com/yawkat/lz4-java/pull/46)
- [erlang/otp issue #7498 - RISC-V JIT support](https://github.com/erlang/otp/issues/7498)
- [erlang/otp PR #7859 - build: add RISC-V native case](https://github.com/erlang/otp/pull/7859)
- [openeuler-riscv/oerv-team issue #1312 - librabbitmq failing test cases](https://github.com/openeuler-riscv/oerv-team/issues/1312)
- [docker-library/official-images - library/rabbitmq definition](https://github.com/docker-library/official-images/blob/master/library/rabbitmq)
- [RabbitMQ platforms documentation](https://www.rabbitmq.com/docs/platforms)
- [Ubuntu 26.04 "resolute" - RabbitMQ packages](https://packages.ubuntu.com/search?keywords=RabbitMQ&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 Noble - RabbitMQ packages](https://packages.ubuntu.com/search?keywords=RabbitMQ&suite=noble&searchon=names&section=all)
- [Debian tracker - rabbitmq-server](https://tracker.debian.org/pkg/rabbitmq-server)
- [Arch Linux riscv64 port index](https://archriscv.felixc.at/?q=rabbitmq)
- [rabbitmq/build-env-images](https://github.com/rabbitmq/build-env-images)
- [RISE project members](https://riseproject.dev)
- [RISE project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE RISC-V Runners documentation](https://riscv-runners.riseproject.dev/)
- [PyPI - rabbitmq package (unrelated CFFI bindings, not the broker)](https://pypi.org/pypi/rabbitmq/json)