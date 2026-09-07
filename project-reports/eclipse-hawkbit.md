---
title: Eclipse hawkBit
parent: Project Reports
color: green
---

# Eclipse hawkBit

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Eclipse hawkBit<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Eclipse hawkBit is a Java/Spring Boot backend service for managing software rollouts and OTA (over-the-air) updates to IoT and edge devices. It is hosted by the Eclipse Foundation under the IoT working group ([eclipse.dev/hawkbit](https://eclipse.dev/hawkbit/), project page [projects.eclipse.org/projects/iot.hawkbit](https://projects.eclipse.org/projects/iot.hawkbit)), licensed under EPL-2.0. The build requires Java 21 (`<java.version>21</java.version>` in the root `pom.xml`) on a Spring Boot 4.1.1 / Spring Cloud stack, with modules including `hawkbit-ddi`, `hawkbit-dmf`, `hawkbit-mgmt`, `hawkbit-rest`, `hawkbit-ui`, and `hawkbit-monolith`.

Governance is standard Eclipse Foundation process (Eclipse Contributor Agreement, DCO-style sign-off). No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. Per full git history (2085 commits), the project is effectively Bosch-led: Avgustin Marinov alone accounts for 1,064 commits (`@bosch.com`), with the remaining top committers (Stanislav Trailov, Dominic Schabel, Denislav Prinov, Vasil Ilchev, Ammar Bikic, Stefan Behl, Markus Block, Jeroen Laverman, Michael Herdt) all carrying `@bosch.io` / `@bosch.com` / `@bosch-si.com` addresses. One historical committer, Kai Zimmermann, carries a `@microsoft.com` address. Project Leads are listed as Avgustin Marinov and Jeroen Laverman on the Eclipse project page.

No RISC-V-related discussion, issue, PR, or commit exists anywhere in the project's history or tracker (see Section 2), so there is no evidence of community sentiment toward new architecture ports one way or the other; the topic has simply never arisen.

## 2. Port History and Upstreaming Timeline

There is no port history to report.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, issue, PR, or discussion exists | `git log --all --oneline -i --grep="riscv\|risc-v"` returned zero matches across all 2085 commits; GitHub issue/PR/commit search for `riscv`/`riscv64` against `eclipse-hawkbit/hawkbit` (and legacy slug `eclipse/hawkbit`) returned zero results |

No key contributors exist for a RISC-V port because none has been attempted. The question "is it fully upstream" does not apply in the usual sense: there is no separate riscv64 code path to be upstream or out-of-tree, because hawkBit's own codebase contains zero architecture-specific source (987 `.java` files, zero C/C++/assembly/headers).

## 3. Upstream Support Tier

No formal tier policy exists. hawkBit has no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory, and no architecture-support matrix of any kind. This is a direct consequence of hawkBit being pure JVM bytecode: architecture support is inherited entirely from the JVM (OpenJDK/Eclipse Temurin) and, for container deployment, from the base image, not curated per-CPU-architecture by the hawkBit project itself.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | yes (implicit, `ubuntu-latest` runners) | no dedicated job | no dedicated job |
| Upstream CI tests | yes | no dedicated job | no dedicated job |
| Upstream publishes binary release | Docker image only (amd64, no `--platform` flag) | no | no |
| Maven Central JAR | yes (architecture-neutral) | yes (same artifact) | yes (same artifact) |

The distinction between amd64/arm64/riscv64 is almost entirely moot for the Maven-distributed JAR artifacts, which are architecture-neutral JVM bytecode; it is meaningful only for the Docker image, which is currently built and published for amd64 only, per direct inspection of [`release_docker.yaml`](https://github.com/eclipse/hawkbit/blob/master/.github/workflows/release_docker.yaml) (`docker buildx build` invoked with no `--platform` flag, so it builds only the default host architecture on the `ubuntu-latest` runner).

## 4. Technical Architecture and RISC-V-Specific Subsystems

hawkBit has no architecture-specific subsystems of any kind. Full repo-wide case-insensitive grep for `riscv|__riscv|amd64|x86_64|aarch64|arm64` across every tracked file in the local clone (`/home/user/eclipse/hawkbit`) returned zero matches. There is no JIT of its own (it delegates entirely to the host JVM's HotSpot C1/C2 JIT), no SIMD code, no hand-written crypto (BouncyCastle, used only optionally for local CA/cert generation via `AuthenticationSetupHelper`, is pure Java with `<optional>true</optional>` in the pom), no assembly, and no GC-barrier code (GC is entirely the JVM's responsibility).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compiler | N/A (delegated to host JVM) | N/A (delegated to host JVM) | N/A (delegated to host JVM) |
| SIMD/vectorization | none in hawkBit itself | none in hawkBit itself | none in hawkBit itself |
| Cryptography | pure-Java BouncyCastle (optional) | same | same |
| Native/assembly code | none | none | none |

The only native-adjacent component anywhere in the dependency graph is the optional, transitive `zstd-jni` (JNI-wrapped native compression), pulled in only when MariaDB connection compression (`useCompression=true`) is explicitly enabled by a deployer, and not a hard/direct dependency of hawkBit.

## 5. Build System, Cross-Compilation, and Toolchain

hawkBit builds with Maven (`pom.xml` at the repo root); there is no `CMakeLists.txt`, `BUILDING.md`, or `docs/cross-compilation.md` anywhere in the tree, and no cross-compilation is needed because the build output is architecture-neutral JVM bytecode. Requirements:

- Java 21 for the main build (`<java.version>21</java.version>`); a lower `<java.client.version>17</java.client.version>` is used only for client-library artifacts that must stay compatible with older consumers.
- Parent POM: `spring-boot-starter-parent` 4.1.1.

Docker packaging (`docker/build/Dockerfile`, `Dockerfile_dev`, and two DB-init variants) builds on `eclipse-temurin:${JAVA_VERSION}-jre-alpine` (Java 21.0.12_8) using Spring Boot's layered-jar extraction (`java -Djarmode=tools ... extract --layers`). No `-DUSE_X=OFF`-style flags exist because there is no CMake configure step. No QEMU usage, no multi-arch `docker buildx --platform` matrix, and no known riscv64 build failures were found (none would be expected to exist, since no riscv64 build has ever been attempted or reported).

The practical dependency for riscv64 execution is entirely upstream of hawkBit: a working JDK/JRE (Eclipse Temurin or another OpenJDK distribution) for riscv64, and, for the Docker path, a riscv64 build of the `eclipse-temurin:*-jre-alpine` base image. Neither of these was independently verified in this research pass. **[NEEDS VERIFICATION]**

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core rollout/management functionality (via JAR) | full | full | full (architecture-neutral bytecode) |
| Official Docker image | yes (amd64 only, per CI) | not published | not published |
| Test coverage on this architecture (upstream CI) | yes | no | no |

There are no functional gaps: hawkBit's own code has no architecture-conditional feature (no `#ifdef`-equivalent, no SIMD-accelerated path that would be missing). There is no performance-gap analysis to report, because there are no architecture-specific optimizations in hawkBit's own code on any architecture, and no riscv64 benchmarks were found (see Section 11). There is no security-hardening gap specific to hawkBit's own code. No NaN/floating-point semantics issues were found or would be expected, since hawkBit is a device-management/rollout orchestration service, not a numerics library.

## 7. CI/CD Infrastructure

No riscv64 CI exists. All 15 GitHub Actions workflow files under `.github/workflows/` were read directly: `codeql.yaml`, `first-interaction.yaml`, `license-scan.yaml`, `release.yaml`, `release_docker.yaml`, `release_tag.yaml`, `reusable_workflow_license-scan.yaml`, `reusable_workflow_tag.yaml`, `reusable_workflow_trivy-scan.yaml`, `reusable_workflow_verify.yaml`, `stale.yaml`, `style_check.yaml`, `verify-hibernate-postgresql.yaml`, `verify-hibernate.yaml`, `verify-postgresql.yaml`, `verify.yaml`, `vulnerability-scan.yaml`. Every `runs-on:` is `ubuntu-latest`, with one unrelated exception in [`codeql.yaml`](https://github.com/eclipse/hawkbit/blob/master/.github/workflows/codeql.yaml) (`runs-on: ${{ (matrix.language == 'swift' && 'macos-latest') || 'ubuntu-latest' }}`, a macOS leg for a Swift CodeQL matrix). No self-hosted riscv64 runners, no RISE runner references, no `docker/setup-qemu-action` or equivalent, and no multi-arch `docker buildx --platform` matrix exist anywhere. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | yes (`ubuntu-latest`) | no | no |
| Test suite executed | yes | no | no |
| RISE runners used | no | no | no |

## 8. Distribution and Release Status

No official riscv64 (or any-architecture) binary exists. GitHub releases (`eclipse-hawkbit/hawkbit`, tags 1.1.0, 1.0.4, 1.0.3, 1.0.2, 1.0.1, checked via [the releases page](https://github.com/eclipse/hawkbit/releases) and its [expanded assets for 1.1.0](https://github.com/eclipse/hawkbit/releases/expanded_assets/1.1.0)) contain only `Source code (zip)` and `Source code (tar.gz)` archives, no compiled assets of any kind. There is no PyPI package (`https://pypi.org/pypi/eclipse-hawkbit/json` returns 404). No Ubuntu package exists for any architecture in the resolute suite (`packages.ubuntu.com` search returns no results). No Arch Linux RISC-V package exists ([archriscv.felixc.at](https://archriscv.felixc.at/?q=eclipse%20hawkbit) returns zero results).

In practice, hawkBit is consumed via:
1. **Maven Central JAR artifacts** (architecture-neutral bytecode, runs on any JVM including riscv64).
2. **Docker images** (`docker/build/Dockerfile`, built via `release_docker.yaml`) - currently amd64 only, since the `docker buildx build` invocation carries no `--platform` flag.

To get a working hawkBit deployment on riscv64 today, a user has two paths: (a) pull the Maven Central JAR and run it directly with a riscv64 JVM (no known blocker, but not independently benchmarked in this research), or (b) build the Docker image locally on riscv64 hardware/QEMU from the published `Dockerfile`, since no official multi-arch image is published.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| OpenJDK / Eclipse Temurin | JVM runtime, hosts all JIT compilation hawkBit relies on | not independently verified this session (project-graph server unreachable) | not independently verified | not independently verified | long-standing upstream riscv64 port per general awareness of the OpenJDK project; not re-confirmed with a primary source this session [NEEDS VERIFICATION] |
| Maven | build tool only, not a runtime dependency | not checked | not checked | not checked | n/a |
| pgjdbc (`org.postgresql:postgresql`) | JDBC driver, PostgreSQL profile | pure Java, architecture-independent by construction | same | same | 0 riscv64 issues found on `pgjdbc/pgjdbc` |
| RabbitMQ client (spring-rabbit / `spring-boot-starter-amqp`) | AMQP client for the DMF (device messaging) module | pure Java client | same | same | one loosely related closed issue (`#6515`, ARM64-specific, not riscv64) |
| mariadb-java-client | JDBC driver, MariaDB profile | pure Java, architecture-independent | same | same | 0 riscv64 issues found |
| BouncyCastle (`bcpkix-jdk18on`) | optional crypto provider for local CA/cert generation | pure Java, no JNI | same | same | 0 riscv64 issues found; marked `<optional>true</optional>` |
| zstd-jni | transitive/optional, used only if MariaDB `useCompression=true` | JNI native library; a closed upstream issue (`luben/zstd-jni#284`, "Please help to add CI support for riscv64") suggests recent releases may publish `linux-riscv64` native classifiers, not independently re-verified this session | not verified | not verified | one relevant closed issue, unresolved verification status [NEEDS VERIFICATION] |
| Vaadin + Node.js/esbuild/vite toolchain | build-time only, bundles the optional `hawkbit-ui` frontend | build-time only; esbuild is known to publish `esbuild-linux-riscv64` per general awareness, not independently reconfirmed | n/a (build-time) | n/a (build-time) | not checked against a primary source [NEEDS VERIFICATION] |

No dependency in this stack resembles a JIT-backend or SIMD/numerics C/Rust library of the kind that would need a deep-dive per the report template; the only genuinely native, architecture-sensitive component in the graph is `zstd-jni`, and it is optional/transitive, not a hard dependency exercised by default. The `project-graph` MCP server (Ubuntu package-graph SPARQL endpoint) was unreachable for the entire research session (`CONNECTION_CLOSED`, confirmed on retry); this is a verification gap for the Ubuntu-package-level facts in this table, not a negative finding, and should be re-run once that server is available.

## 11. Known Bugs and Active Issues

No riscv64-related issues or PRs exist. This was confirmed by GitHub issue search, PR search, and commit search for `riscv`/`riscv64` against both the current org slug (`eclipse-hawkbit/hawkbit`) and the legacy slug (`eclipse/hawkbit`), by GitHub's native code-search index (`repo:eclipse-hawkbit/hawkbit riscv`, `org:eclipse-hawkbit riscv`), and by a full repo-wide recursive grep - all returned zero matches.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | - | - | No riscv64-related issue, PR, or commit exists in the repository |

The only riscv64-adjacent artifact found anywhere is an unrelated third-party academic paper ("An open-source SWUpdate and Hawkbit framework for OTA Updates of RISC-V based resource constrained devices," found on ResearchGate) that uses hawkBit as a backend component. It is not a hawkBit GitHub issue, PR, commit, or project artifact, and has no corresponding thread in the repository. No correctness bugs, performance issues, or benchmark data specific to riscv64 exist to report.

## 12. Objections and Upstream Blockers

No objections exist because the topic has never been raised. No technical blocker was identified in hawkBit's own codebase (it is architecture-neutral JVM bytecode). No organizational blocker was identified: the Eclipse Foundation's standard contribution process (ECA sign-off) applies, and there is no evidence of any policy against new platform support. The only practical blocker to an official riscv64-labeled release is that no one has proposed adding a `--platform linux/riscv64` target to `release_docker.yaml`, or a riscv64-specific verification job. Given the total absence of any RISC-V-related activity, an acceptance-probability estimate would be speculative; there is no data (e.g., a rejected PR, a maintainer statement) to base one on. **[NEEDS VERIFICATION: no direct maintainer statement on RISC-V exists to cite either way.]**

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** upstream
- **Optimization gap:** N/A (hawkBit is not an optimization-purpose project; its value proposition is device-update orchestration functionality, not algorithmic speed relative to a simpler alternative)
- **Justification:** hawkBit ships no compiled, architecture-specific code. Its distributed artifact is a platform-neutral JVM jar (987 `.java` files, zero C/C++/assembly anywhere in the repository, confirmed by full repo-wide grep and by [`mcp__github__search_code`](https://github.com/eclipse-hawkbit/hawkbit) queries for `riscv`, `#ifdef __riscv`, and related terms all returning zero results). Per the color model's Step 0 shortcut, an architecture-independent artifact of this kind is classified green and inherits riscv64 support from its runtime (the OpenJDK/riscv64 JVM port) without needing dedicated upstream riscv64 CI. Maven Central, the primary upstream distribution channel for the JAR, is operated directly by the Eclipse hawkBit project (`release_provider: upstream`).
- **Pending work that could change the grade:** none identified. No open PRs or issues reference RISC-V in any form, and no RISE (RISC-V Software Ecosystem) involvement with hawkBit was found (Eclipse Foundation and Bosch are absent from RISE's [Premier and General member lists](https://riseproject.dev/members/), and no `riseproject-dev` GitHub org repository or RISE blog post references hawkBit). The one caveat that does not affect the color but is operationally relevant: hawkBit's official Docker image (`release_docker.yaml`) is currently amd64-only (no `--platform` multi-arch build), so a riscv64 deployer must build the container image locally rather than pull an official one; adding a `linux/riscv64` target to that workflow is a small, well-scoped upstreamable change if this becomes a priority.

## 14. Investment Analysis

RISE has not funded or performed any work on Eclipse hawkBit; there is nothing to avoid duplicating.

### 14.1 Functional Enablement

No functional enablement work is required. hawkBit's own code is architecture-neutral and requires no port. The only open functional question is upstream (Eclipse Temurin / OpenJDK riscv64 JVM availability and quality), which is outside hawkBit's own scope and not something this investment should target directly.

### 14.2 Performance Optimization

Not applicable. hawkBit is not an optimization-purpose project and has no architecture-specific hot paths in its own code to tune.

### 14.3 CI/CD Infrastructure

The only concrete, well-scoped gap is that `release_docker.yaml` builds Docker images without a `--platform` flag, so no official riscv64 (or arm64) container image is published. Adding a `linux/riscv64` (and, if desired, `linux/arm64`) target to the existing `docker buildx build` step, gated behind QEMU or native riscv64 runners, would close this gap. This is a small, contained infrastructure change (modifying one existing workflow file) rather than a new port.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report instructions, since hawkBit itself is a standalone server application (Maven artifacts plus a Docker image) with no significant dependent package ecosystem (npm, Kubernetes operator, or similar) that would separately need riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add `linux/riscv64` target to `docker buildx build` in `release_docker.yaml`, verified against a riscv64 runner or QEMU | 1-2 | hawkBit maintainers (Bosch) or a RISE-sponsored contributor | Low |
| Functional | Verify hawkBit's JAR runs correctly end-to-end on a riscv64 JVM (smoke test: boot the monolith module, run `verify.yaml`'s equivalent test suite under a riscv64 JDK) | 1 | hawkBit maintainers or RISE | Low |
| Dependencies | Re-verify `zstd-jni` riscv64 native classifier availability for the optional MariaDB-compression path | <1 | RISE / dependency maintainers | Low |

Given hawkBit's architecture-neutral distribution model, the overall investment required to establish riscv64 readiness is low relative to projects with native/compiled artifacts; the work is confirmatory (smoke-testing) and CI/packaging polish rather than a functional port.

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [Eclipse hawkBit GitHub repository](https://github.com/eclipse/hawkbit)
- [Eclipse hawkBit releases page](https://github.com/eclipse/hawkbit/releases)
- [Eclipse hawkBit 1.1.0 release assets](https://github.com/eclipse/hawkbit/releases/expanded_assets/1.1.0)
- [release_docker.yaml workflow](https://github.com/eclipse/hawkbit/blob/master/.github/workflows/release_docker.yaml)
- [codeql.yaml workflow](https://github.com/eclipse/hawkbit/blob/master/.github/workflows/codeql.yaml)
- [Eclipse hawkBit project page (Eclipse Foundation)](https://projects.eclipse.org/projects/iot.hawkbit)
- [Eclipse hawkBit homepage](https://eclipse.dev/hawkbit/)
- [PyPI package lookup for eclipse-hawkbit (404, no package exists)](https://pypi.org/pypi/eclipse-hawkbit/json)
- [Ubuntu package search for Eclipse hawkBit (resolute suite, no results)](https://packages.ubuntu.com/search?keywords=Eclipse%20hawkBit&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search (no results)](https://archriscv.felixc.at/?q=eclipse%20hawkbit)
- [RISE project members list](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [zstd-jni riscv64 CI request issue #284 (closed)](https://github.com/luben/zstd-jni/issues/284)
- [Local clone used for grep/file inspection](file:///home/user/eclipse/hawkbit) (path reference only, not a public URL)
