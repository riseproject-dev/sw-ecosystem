---
title: Eclipse Ditto
parent: Project Reports
color: orange
dependencies:
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: Apache Pekko
    relation: runtime-dependency
    criticality: critical
  - name: Netty
    relation: runtime-dependency
    criticality: critical
  - name: MongoDB Java Driver
    relation: runtime-dependency
    criticality: critical
  - name: lz4-java
    relation: runtime-dependency
    criticality: optional
  - name: Apache Kafka
    relation: runtime-dependency
    criticality: optional
  - name: AWS SDK for Java
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="eclipse-ditto" %}

# Eclipse Ditto

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Eclipse Ditto<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Eclipse Ditto is a Java/Scala, Akka/Pekko-based backend platform implementing the "digital twin" pattern for IoT devices: it exposes device state, telemetry, and commands through a unified API (HTTP, WebSocket, Ws-based messaging, MQTT, AMQP, Kafka connectors). It is a pure JVM microservices application (`gateway`, `things`, `connectivity`, `thingsearch`, `policies` modules), built with Maven, and shipped primarily as Docker images (`eclipse/ditto-*` on Docker Hub) plus Maven Central artifacts for client libraries. It contains no native code, no assembly, and no CPU-architecture-specific dispatch of its own anywhere in the codebase.

**Governance:** Eclipse Foundation, Eclipse IoT working group, standard Eclipse Development Process (contributors sign the Eclipse Contributor Agreement per `CONTRIBUTING.md`). License: Eclipse Public License 2.0. Project maturity phase on the [Eclipse project page](https://projects.eclipse.org/projects/iot.ditto) is listed as "Mature". No in-repo `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file exists; committers are tracked on the Eclipse "Who's Involved" page: Thomas Jaeckle (project lead), Hussein Ahmed, Aleksandar Stanchev (current); David Schwilk, Yannic Burgmann, Stefan Maute, Florian Fendt, Dominik Guggemos, Yufei Cai, Gerald Glocker, Johannes Schneider, Juergen Fickel, Daniel Fesenmeyer, Daniel Bohn (historical).

**Corporate sponsors:** Overwhelmingly **Robert Bosch GmbH** (Bosch.IO / Bosch Software Innovations, `bosch.io`/`bosch-si.com`/`bosch.com` commit-author domains), the founding and dominant sponsor across roughly 12,874 commits of full history. A newer contributor company, **beyonnex.io**, appears from approximately 2023 onward - the project lead and one committer moved there, indicating a spin-off now co-sponsoring active development alongside Bosch. No other named corporate sponsor was found on [eclipse.dev/ditto](https://eclipse.dev/ditto/) or the Eclipse project page.

**Community culture on new ports:** No formal architecture-support tier policy is documented anywhere in the repository. Platform support is de facto whatever the upstream Eclipse Temurin JVM base Docker images support (currently amd64 + arm64), added ad hoc via ordinary pull requests, not governed by any written policy. The one precedent - arm64 Docker support - was a straightforward, uncontroversial PR from a Bosch engineer merged the same day it was opened, suggesting new-architecture Docker support would likely be accepted readily if submitted. This is an inference from precedent, not a stated policy: no RISC-V request has ever been filed.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-03-22 | First arm64 Docker support merged: "Support for building arm64 ditto snapshot images", commit `41ba7a1`, authored by Michael Gantert (bosch.io), merged same day via PR #1011 by Thomas Jaeckle | [eclipse-ditto/ditto](https://github.com/eclipse-ditto/ditto) commit history (per research pass) |
| 2022-02-25 | Extended to proper `linux/amd64,linux/arm64` buildx multi-platform builds, commit `0c92562`, Thomas Jaeckle (bosch.io) | [eclipse-ditto/ditto](https://github.com/eclipse-ditto/ditto) commit history |
| 2023-06-13 | arm64-compatible curl fix in the Helm chart, Thomas Jaeckle (by then at beyonnex.io) | [eclipse-ditto/ditto](https://github.com/eclipse-ditto/ditto) commit history |
| N/A | No RISC-V port has ever been proposed, requested, or built | Confirmed via `search_commits`, `search_issues`, `search_pull_requests`, `search_code` for `riscv`/`riscv64`/`risc-v` against `eclipse-ditto/ditto` - all return 0 results |

There is no RISC-V port to describe as "fully upstream" or otherwise - none exists at any stage. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` documents exist in the repository.

## 3. Upstream Support Tier

No formal architecture-support tier policy is documented. De facto support is defined entirely by which platforms the multi-arch Docker build workflows target.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes, native (self-hosted `ditto-runner`, explicitly `--container-architecture linux/amd64`) | Yes, cross-built via QEMU (`docker/setup-qemu-action`) | No - absent from every `platforms:` line in all 3 multi-arch workflows |
| CI test execution | Yes, on native amd64 self-hosted runner (`system-tests.yml`) | No native arm64 test execution identified | No - no riscv64 job exists at all |
| Upstream Docker image | Yes, `linux/amd64` in every multi-arch build | Yes, `linux/arm64` in every multi-arch build, plus a dedicated `dockerfile-snapshot-arm64` | No - zero riscv64 platform entries in `docker-nightly.yml`, `push-dockerhub.yml`, `push-dockerhub-on-demand.yml` |
| Release-blocking | De facto yes (both platforms built on every tagged release) | De facto yes | N/A - never targeted |

Evidence: direct read of all 11 workflow files in `.github/workflows/` (`docker-nightly.yml`, `gh-pages.yml`, `helm-chart-release.yml`, `helm-chart.yml`, `license-check.yml`, `maven.yml`, `push-dockerhub-on-demand.yml`, `push-dockerhub.yml`, `system-tests.yml`, `ui-ci.yml`, `zizmor.yml`), confirming exactly `platforms: linux/amd64,linux/arm64` on all 30 `platforms:` lines across the three multi-arch Docker workflows, and confirming `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in the repository.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Ditto is not an optimization-purpose project and contains no architecture-specific subsystems of its own (no JIT, no hand-written SIMD, no custom crypto, no GC barrier code - all of that is delegated entirely to the JVM and its class libraries). A repository-wide search for `riscv`, `vfloat32m1_t`, `rvv`, `riscv64`, `Zba`/`Zbb`, and a check for any `arch/riscv/` directory returned zero genuine hits.

The only occurrences of any RISC-V-related string anywhere in the codebase are two transitive npm lockfile entries - `ui/package-lock.json` and `documentation/src/main/resources/openapi/sources/package-lock.json` - for `@esbuild/linux-riscv64`, esbuild's prebuilt native binary optional-dependency, pulled in automatically by npm's platform-binary resolution matrix. This is build-tooling metadata for the UI's Vite/esbuild toolchain, not Ditto's own code, and is never invoked (`ui-ci.yml` builds exclusively on `ubuntu-latest`). All other apparent "RVV"/"Zba"/"Zbb" text matches were confirmed to be false positives: random substrings inside base64-encoded SVG logo files or coincidental substrings in package-lock.json hashes/URLs.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / bytecode execution | JVM (Temurin), mature | JVM (Temurin), mature | Delegated entirely to host JVM; not part of Ditto's own code |
| SIMD / vectorized paths | None (pure Java/Scala) | None | None |
| Crypto | Delegated to JCE/JVM | Delegated to JCE/JVM | Delegated to JCE/JVM |
| Native transport (Netty epoll) | Native, mature | Native, mature | Fixed upstream (see Section 9); no Ditto-side code |
| Assembly | None | None | None |

Because Ditto contains zero per-architecture implementations of its own for any platform, the amd64/arm64/riscv64 comparison collapses to a single question: does the JVM and the transitive native dependencies run on riscv64. That question is addressed in Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

Ditto is a pure Java/Maven multi-module project (`<packaging>pom</packaging>` at the root). There is no CMake build system, no C/C++ source, and no native compilation step anywhere in the repository.

- Build command: `mvn clean install` (per `documentation/src/main/resources/pages/ditto/installation-building.md`) - no architecture-specific flags exist to check.
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist; the file above is the sole build documentation and contains nothing architecture-specific.
- No `CMakeLists.txt` exists anywhere in the repository, and no `cmake/` directory exists (so no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake`).
- Dockerfiles present: `dockerfile-release`, `dockerfile-snapshot`, `dockerfile-snapshot-arm64` (based on `arm64v8/eclipse-temurin:25-jdk`), plus `ui/Dockerfile` and `benchmark-tool/artillery-test/Dockerfile`. No riscv64 Dockerfile variant exists, and a full-repository grep for riscv64 in any `Dockerfile` returned zero hits.
- GCC/Clang minimum versions: not applicable - Ditto does not compile native code; it targets the JVM (currently built against `eclipse-temurin:25-jdk`).
- `-DUSE_X=OFF`-style build flags: not applicable, no CMake project exists.
- QEMU usage: not documented anywhere in the repository for Ditto's own build; QEMU is used only inside the Docker multi-arch build workflows via `docker/setup-qemu-action`, and only for the amd64/arm64 platform set.
- Known build failures on riscv64: none documented, because riscv64 has never been attempted - there is no record of anyone building Ditto on riscv64.

**Bottom line:** riscv64 build documentation for Ditto does not exist because Ditto has no native/CMake build system to cross-compile in the first place. It is built with Maven and shipped as JVM Docker images (amd64/arm64 only).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runs core Ditto services (gateway, things, connectivity, thingsearch, policies) | Yes, native CI-tested | Yes, cross-built, no evidence of native test execution | Untested; no CI, no release artifact, no build ever attempted per the issue/PR/commit history |
| Official Docker image available | Yes | Yes | No |
| Maven Central client artifacts (architecture-neutral bytecode) | Yes | Yes | Bytecode is architecture-neutral, but the underlying JVM and native transitive dependencies (Netty epoll, JNA/oshi, zstd-jni) have never been validated running Ditto's own workload on riscv64 |
| Helm chart deployment | Yes | Yes (arm64-compatible curl fix present) | Untested |

**Functional gaps:** None documented as "cannot do X" - because no one has ever run Ditto on riscv64 to discover functional gaps. The gap is one of complete absence of validation, not a documented feature deficiency.

**Performance gaps:** Not assessable. No riscv64 benchmark exists for Ditto anywhere (see Section 12). The only benchmark on record - the official [Eclipse Ditto Benchmark](https://eclipse.dev/ditto/2023-10-09-ditto-benchmark.html) (October 2023, k6 on AWS EKS, m5.4xlarge/x86_64 nodes) - contains no RISC-V data point and no arm64 data point either.

**Security hardening gaps:** Data not available: no riscv64-specific security posture (e.g., ASLR, stack protector defaults on riscv64 JVM builds) was searched or found for Ditto specifically; this would be inherited entirely from the host OpenJDK riscv64 build, which is outside Ditto's own scope.

**NaN / floating-point semantics issues:** Data not available: no RISC-V-specific floating-point or NaN-related issue exists in the eclipse-ditto/ditto issue tracker (confirmed via `search_issues` for `riscv nan floating`, `riscv64 bug`, `riscv64 performance` - all 0 results). Ditto performs no numerically sensitive floating-point computation of its own; this class of bug would not be expected to arise from the application layer itself.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Every one of the 11 GitHub Actions workflow files in `.github/workflows/` was read directly and grepped case-insensitively for `riscv`: zero matches in any file.

- `runs-on:` values found repo-wide: `ubuntu-latest` (most workflows), `ubuntu-20.04` (`gh-pages.yml`), and the self-hosted `ditto-runner` (`system-tests.yml`, explicitly amd64 per an inline `--container-architecture linux/amd64` comment). No riscv64 runner or riscv64-labeled self-hosted runner exists anywhere.
- `platforms:` values found in all three multi-arch Docker workflows (`docker-nightly.yml`, `push-dockerhub.yml`, `push-dockerhub-on-demand.yml`): exactly `platforms: linux/amd64,linux/arm64` on all 30 occurrences. `docker/setup-qemu-action` is used, but QEMU is invoked only for amd64/arm64 - riscv64 is never added to the QEMU platform set.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository (confirmed by direct filesystem check).
- No RISE runner reference of any kind exists in any workflow file, and no RISE involvement with Ditto was found anywhere (RISE blog, 34 posts enumerated; RISE GitHub org, 25 repos enumerated; RISE wheel builder, 88 packages listed - none reference Eclipse Ditto).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (native, self-hosted `ditto-runner`) | Yes (QEMU cross-build) | No |
| CI runs tests | Yes (native runner) | No native test execution identified | No |
| CI publishes artifact | Yes (Docker image) | Yes (Docker image) | No |
| Hardware | Native x86_64 self-hosted runner | QEMU emulation on GitHub-hosted `ubuntu-latest` | N/A - no job exists |

## 8. Distribution and Release Status

No official riscv64 binaries or images exist through any channel checked.

- **Docker Hub / GitHub Container Registry:** Multi-arch images (`eclipse/ditto-*`) are published for `linux/amd64` and `linux/arm64` only, per every `platforms:` line in the three Docker publishing workflows. No riscv64 image tag exists.
- **GitHub Releases:** Recent releases (3.9.7, 3.8.13, 3.9.6, 3.9.5, 3.9.4, and further back) each show only the standard 2 GitHub-auto-generated source assets (source zip + tarball), consistent with a project that does not upload custom platform binaries. No riscv64 filename evidence was found in any accessible release content. Exact per-file confirmation was constrained by session tool access (GitHub REST API blocked for this unattached repo, JS-rendered asset panel unreadable via WebFetch), so this is corroborating rather than absolutely conclusive - flagged as a minor gap, not a positive signal of anything different.
- **Maven Central:** Ditto's Java/Scala artifacts are published as architecture-neutral JVM bytecode (no native code of Ditto's own), so no "riscv64 build" concept applies to these artifacts directly - a JVM capable of running on riscv64 (which OpenJDK provides, see Section 9) can load them. This has never been validated for Ditto specifically because no one has attempted it.
- **PyPI:** `https://pypi.org/pypi/eclipse-ditto/json` returns HTTP 404 - no such package exists (expected, Ditto is not a Python project).
- **Ubuntu (26.04 "resolute"):** Project-graph SPARQL query for `eclipse ditto` / `python3-eclipse-ditto` / `libeclipse-ditto` binary packages targeting riscv64 in suite `resolute` returned an empty result set. Live cross-check at `packages.ubuntu.com` for "Eclipse Ditto" returned "Sorry, your search gave no results" - Ditto is not packaged in Ubuntu at all, on any architecture.
- **Debian/Fedora:** Data not available: not separately searched, but consistent with Ubuntu's absence and Ditto's Docker-native distribution model, no packaging is expected.
- **Arch Linux RISC-V (archriscv.felixc.at):** No "eclipse ditto" or "ditto" package entry found.

**What a user must do to get a working binary today:** Build Ditto from source on a riscv64 host with `mvn clean install` (untested, no known blocker but also no confirmation of success), then either run it directly on a riscv64 JVM (`java -jar`, bypassing Docker) or construct a custom Docker image from a riscv64-capable `eclipse-temurin` base image (Eclipse Temurin publishes riscv64 builds for recent OpenJDK versions per Section 9, though Ditto's own Dockerfiles do not reference one). No upstream, distro, or third-party channel provides a ready riscv64 artifact.

## 9. Dependencies

Ditto is a pure Java/Maven project with no CMakeLists.txt/setup.py/go.mod/Cargo.toml/package.json at the top level. Architecture risk is concentrated in dependencies carrying native (JNI) code, pulled transitively via `bom/pom.xml`. Pure-Java libraries (Jackson, Caffeine, Pekko, AWS SDK v2 core, SLF4J/Logback, JUnit/Mockito) are riscv64-portable by construction and are omitted as non-critical.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| OpenJDK (25/21) | JVM runtime substrate | Yes, mature upstream port | Yes | Yes, shipped in Ubuntu 26.04 (`openjdk-21-jdk`, `openjdk-25-jdk` found in project-graph riscv64 resolute check) | None significant |
| Netty (`netty-bom` 4.2.15.Final) | I/O transport, native epoll | Yes, fixed via [netty/netty#13667 "Add support for RISC-V"](https://github.com/netty/netty/issues/13667), closed 2023-12-11; riscv64 native-epoll jars ship since approximately 4.1.104+, well before Ditto's 4.2.15.Final pin | Yes (post-fix) | Yes, published to Maven Central with riscv64 classifier | `netty-tcnative` (BoringSSL, used only if native TLS/ALPN is enabled) has no riscv64 issue on record - untested; Ditto can fall back to JDK TLS |
| `at.yawk.lz4:lz4-java` 1.11.1 (fork of `lz4/lz4-java`) | Native JNI LZ4 compression, used by Pekko serialization | [NEEDS VERIFICATION] - unknown | [NEEDS VERIFICATION] - unknown | [NEEDS VERIFICATION] - unknown | Upstream `lz4/lz4-java` riscv64 requests (issues #215, #209) were still open/unmerged as of the last check (Oct 2023); the `yawkat` fork Ditto actually pins has no riscv64 issue history at all |
| zstd-jni (transitive, via Kafka/Pekko) | Native JNI Zstd compression | Yes, merged via `luben/zstd-jni` PR #282, CI-enablement issue #284 closed 2023-10-31 | Partial - upstream notes "tested locally, not regularly on GitHub CI" per issue #284 | Yes, published for riscv64 | CI coverage gap flagged by upstream itself (manual testing only) |
| snappy-java (transitive, via Kafka/MongoDB) | Native JNI Snappy compression | [NEEDS VERIFICATION] - unknown | [NEEDS VERIFICATION] - unknown | [NEEDS VERIFICATION] - unknown | No public riscv64 tracking issue exists on `xerial/snappy-java` (only an unrelated s390x regression, #464) - a visibility gap, not necessarily a support gap |
| Apache Kafka clients 3.9.2 | Messaging connector | Yes, pure Java client, no direct native code | Yes | Yes | Risk entirely inherited from lz4/zstd/snappy codecs above; no riscv64 issues found on `apache/kafka` directly |
| MongoDB Java driver 5.6.5 | Persistence client | Yes, pure Java BSON codec; native compression only if snappy/zstd codecs enabled | Yes | Yes | Depends on the host MongoDB server's own riscv64 support, which is out of scope (MongoDB itself is not in the Ubuntu archive at all, any architecture, due to its SSPL license) |
| oshi-core 6.12.0 (via Kamon system-metrics) | Native hardware/OS introspection via JNA | Yes - `libjna-jni` confirmed present for riscv64 in the Ubuntu 26.04 project-graph check; a GLIBC 2.34 regression ([java-native-access/jna#1557](https://github.com/java-native-access/jna/issues/1557)) was fixed 2023-11-01, and a MANIFEST.MF sync bug (#1622) was fixed 2024-09-14 | Yes (post-fixes) | Yes | No open riscv64 issues on `oshi/oshi` itself |
| AWS SDK for Java v2 2.46.15 (`sts`, `auth`) | SigV4 signing for MongoDB AWS IAM auth | Yes, pure Java crypto via JCE, no `aws-crt` native dependency present | Yes | Yes | No riscv64 issues found on `aws/aws-sdk-java-v2` |
| Apache Pekko (`pekko-bom`/`pekko-http-bom`) | Actor system / HTTP core | Yes, Scala/JVM bytecode, no native code | Yes | Yes | No riscv64 issues found on `apache/pekko` |

**Summary:** No hard riscv64 blocker was identified in Ditto's dependency stack: OpenJDK, Netty native epoll, JNA/OSHI, and zstd-jni have all had their riscv64 gaps closed upstream between 2023 and 2024, and Ubuntu 26.04 already carries riscv64 builds of OpenJDK 21/25 and the corresponding native codec/dispatch libraries. Two gaps remain genuinely unverified: the specific `at.yawk.lz4:lz4-java` fork Ditto pins has no riscv64 issue history at all (upstream `lz4/lz4-java` itself still shows open, unmerged riscv64 requests), and `xerial/snappy-java` has no riscv64 tracking issue of any kind. Both are optional wire-compression codecs (Kafka/MongoDB connectivity), not required for core Ditto functionality, so neither is a hard blocker to a minimal riscv64 deployment.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | N/A | - | No riscv64-related issue, open or closed, exists in `eclipse-ditto/ditto`. Confirmed via `search_issues` for `riscv`, `riscv64`, `riscv64 performance`, `riscv64 bug`, `riscv nan floating` - all return 0 results |

No correctness bugs to highlight separately, because no RISC-V-related issue of any kind - correctness, performance, or otherwise - has ever been filed against this repository.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or contributor has ever commented on RISC-V for Ditto, positively or negatively, because no RISC-V request has ever been filed.

**Technical blockers:** None confirmed as blocking. The dependency analysis in Section 9 found no hard blocker in the core stack (OpenJDK, Netty, JNA/OSHI, zstd-jni all resolved upstream); the two unverified items (lz4-java fork, snappy-java) are optional codecs, not required for baseline operation.

**Organizational blockers:** No documented architecture-support tier policy exists, meaning any riscv64 addition would need to be championed and submitted as an ordinary PR with no precedent-setting process to navigate - the one analogous precedent (arm64 Docker support) was accepted and merged the same day it was submitted by a Bosch engineer.

**Acceptance probability:** [NEEDS VERIFICATION] - no direct evidence exists of maintainer willingness specific to RISC-V, since it has never been proposed. The arm64 precedent (uncontroversial, same-day merge) is suggestive but is an inference from an analogous case, not a stated position on RISC-V.

## 13. Readiness Assessment

- **Color:** orange (no color_case sub-type applies cleanly - see justification)
- **Release provider:** none
- **Optimization gap:** N/A (Eclipse Ditto is not an optimization-purpose project; it is a standalone IoT digital-twin middleware platform, not a library whose value proposition rests on architecture-specific performance work)
- **Justification:** No upstream riscv64 CI exists - all 11 GitHub Actions workflow files were read directly and contain zero riscv64 references; the three multi-arch Docker build workflows target exactly `linux/amd64,linux/arm64` on all 30 `platforms:` lines (see [Section 7](#7-cicd-infrastructure)). No upstream riscv64 release artifact exists in any channel (Docker Hub, GitHub Releases, Maven Central classifier, PyPI, Ubuntu, Arch RISC-V - see [Section 8](#8-distribution-and-release-status)). No Linux distribution ships Ditto at all, on any architecture, so the distribution floor described in the color model (which would otherwise permit a yellow or orange floor from a clean or patched distro build) does not apply - there is no distro packaging to apply it to. This is a project with no upstream CI, no upstream release, and no distribution floor, which places it at orange rather than the unknown-unknown grey case, because there is a definitive negative answer (checked and confirmed absent) rather than insufficient data.
- **Pending work:** None. No open PR, no open issue, no RISE involvement of any kind was found anywhere - RISE's blog (34 posts enumerated), GitHub org (25 repos enumerated), and Python wheel builder (88 packages listed) contain zero references to Eclipse Ditto. Nothing in flight could change this grade without new work being initiated.

## 14. Investment Analysis

RISE has not funded or performed any work on Eclipse Ditto (confirmed absence across RISE's blog, GitHub org, and wheel builder - Section 12). All sizing below is therefore full incremental effort with no prior work to net out.

### 14.1 Functional Enablement

The core dependency chain (OpenJDK, Netty, JNA/OSHI, zstd-jni) already has upstream riscv64 support, so the primary functional-enablement task is validation, not new development: build Ditto from source on riscv64, run its test suite, produce a working riscv64 Docker image, and confirm the two unverified compression codecs (lz4-java fork, snappy-java) either work or can be safely disabled/substituted.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Ditto contains no architecture-specific code to optimize (Section 4). Any performance work would be standard JVM tuning (GC selection, heap sizing) on riscv64 hardware, not Ditto-specific optimization.

### 14.3 CI/CD Infrastructure

Add a `linux/riscv64` platform entry to the three existing multi-arch Docker build workflows (`docker-nightly.yml`, `push-dockerhub.yml`, `push-dockerhub-on-demand.yml`), following the same pattern used for arm64 (QEMU-based cross-build via `docker/setup-qemu-action`, or a native RISE-hosted runner if made available). Extend `system-tests.yml` test execution to riscv64, which currently only runs on the amd64 self-hosted `ditto-runner`.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per instructions. Ditto is a standalone microservices application, not a library with a dependent package ecosystem (npm, PyPI, Maven consumers do exist for its client libraries, but these are architecture-neutral JVM/JS artifacts with no riscv64-specific enablement work required beyond what Section 9 already covers).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Build from source on riscv64, run full Maven test suite, produce and validate a working riscv64 Docker image using a riscv64-capable `eclipse-temurin` base | 2-3 | Upstream contributor or RISE-funded engineer | High |
| Functional | Verify `at.yawk.lz4:lz4-java` fork and `xerial/snappy-java` native riscv64 binary coverage; substitute or disable if unavailable | 1 | Upstream contributor | Medium |
| CI/CD | Add `linux/riscv64` to the three multi-arch Docker workflows and wire riscv64 into `system-tests.yml` | 1-2 | Upstream contributor (Bosch/beyonnex.io precedent suggests low review friction) | Medium |
| CI/CD | Secure a riscv64 CI runner (RISE-hosted or self-hosted) for native test execution, matching the existing amd64 `ditto-runner` pattern | 1 (coordination, not implementation) | RISE or project maintainers | Low |
| Documentation | File a tracking issue and update platform-support documentation once riscv64 is validated | <1 | Upstream contributor | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Eclipse Ditto GitHub repository](https://github.com/eclipse-ditto/ditto)
- [Eclipse Ditto homepage](https://eclipse.dev/ditto/)
- [Eclipse Ditto project page (projects.eclipse.org)](https://projects.eclipse.org/projects/iot.ditto)
- [Eclipse Ditto official benchmark, October 2023](https://eclipse.dev/ditto/2023-10-09-ditto-benchmark.html)
- [Eclipse Ditto GitHub releases](https://github.com/eclipse-ditto/ditto/releases)
- [Ditto installation/build documentation](https://github.com/eclipse-ditto/ditto/blob/master/documentation/src/main/resources/pages/ditto/installation-building.md)
- [Ditto Maven BOM](https://github.com/eclipse-ditto/ditto/blob/master/bom/pom.xml)
- [netty/netty issue #13667 - Add support for RISC-V](https://github.com/netty/netty/issues/13667)
- [luben/zstd-jni PR #282 - RISC-V support](https://github.com/luben/zstd-jni)
- [luben/zstd-jni issue #284 - riscv64 CI enablement](https://github.com/luben/zstd-jni)
- [java-native-access/jna issue #1557 - GLIBC 2.34 regression](https://github.com/java-native-access/jna/issues/1557)
- [java-native-access/jna issue #1622 - MANIFEST.MF sync bug](https://github.com/java-native-access/jna/issues/1622)
- [lz4/lz4-java issue #215](https://github.com/lz4/lz4-java/issues/215)
- [lz4/lz4-java issue #209](https://github.com/lz4/lz4-java/issues/209)
- [xerial/snappy-java issue #464 - s390x regression (unrelated)](https://github.com/xerial/snappy-java/issues/464)
- [PyPI JSON API for "eclipse-ditto" - 404, package does not exist](https://pypi.org/pypi/eclipse-ditto/json)
- [Ubuntu package search - no results for "Eclipse Ditto"](https://packages.ubuntu.com/search?keywords=Eclipse%20Ditto&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [RISE project homepage](https://riseproject.dev)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)