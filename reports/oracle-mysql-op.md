---
title: Oracle MySQL-op
---

# Oracle MySQL-op

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Oracle MySQL-op<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[MySQL Operator for Kubernetes](https://dev.mysql.com/doc/mysql-operator/en/) is a Kubernetes controller that manages MySQL InnoDB Cluster, replica sets, and backups on Kubernetes. The operator is written entirely in Python. The container image bundles MySQL Shell (mysqlsh), which is a C++ binary that the operator invokes for cluster management, backup execution, and SQL initialization. The operator code itself contains no compiled C or C++ and no architecture-specific native code.

**Repository:** [github.com/mysql/mysql-operator](https://github.com/mysql/mysql-operator)

**Governance:** Fully Oracle-controlled. The repository is under the `mysql` GitHub organization, owned and copyrighted by Oracle Corporation (copyright 1997-2026). There is no foundation affiliation - not CNCF, not Linux Foundation. The project requires all contributors to sign the Oracle Contributor Agreement (OCA) before any PR can be merged.

**License:** Universal Permissive License (UPL) v1.0 for operator code. The `manifest.sh` script carries GPL v2 copied from MySQL server infrastructure.

**Maintainers (by commit volume on `trunk` branch):**
- Andrey Hristov (ahorcom): 525 commits, Oracle [NEEDS VERIFICATION - org inferred from project affiliation]
- Darek Slusarczyk (marinesovitch): 413 commits, Oracle MySQL team through 2023 [NEEDS VERIFICATION - GitHub profile lists Splunk, possibly a stale affiliation]
- Alfredo Kengi Kojima (akojima): 294 commits, Oracle (GitHub profile explicit)
- Johannes Schluter (johannes): 55 commits, Oracle MySQL team [NEEDS VERIFICATION - no GitHub company field]
- Lars Tangvald (ltangvald): 12 commits
- Rene Ramirez (rennox): initial squash commit 2020-08-10

In practice this is an exclusively Oracle-staffed project. The OCA requirement and Oracle copyright mean no external governance is possible without Oracle's cooperation.

**RISE membership:** Oracle is not a RISE Project member. The [RISE member list](https://riseproject.dev/members/) includes Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 11 General Members - Oracle is absent. MySQL Operator does not appear in any RISE working group issue tracker.

**Culture on new ports:** There is no public signal of Oracle planning riscv64 support. The build tooling actively rejects riscv64 as an invalid architecture (see Section 5). Given the OCA gate and Oracle-only maintainership, a community-driven riscv64 port would require Oracle staff to add riscv64 to the build matrix and Docker Hub publish pipeline.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2020-08-10 | Initial squash commit by rennox; repository origin | [github.com/mysql/mysql-operator](https://github.com/mysql/mysql-operator) commit history |
| 2021-05-26 | Repository created on GitHub | GitHub repo metadata |
| ~2023 | arm64 added to multi-arch manifest (`manifest.sh` shows arm64+amd64) [NEEDS VERIFICATION - exact date not in findings] | `manifest.sh` in repository trunk |
| present | riscv64 port: not started | 10 independent searches, all returning 0 results |

No contributors have filed issues, submitted PRs, or committed any code referencing RISC-V. There is no tracking issue for a port. The port history is empty.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project has no PLATFORMS.md, SUPPORT.md, or docs/platforms/ directory. Support is inferred from the build tooling and release artifacts.

| Tier indicator | amd64 | arm64 | riscv64 |
|----------------|-------|-------|---------|
| Official Oracle binary tarball | yes (`mysql-operator-26.7.0-2.3.0-docker.tar.gz`) | yes (`mysql-operator-26.7.0-2.3.0-aarch64-docker.tar.gz`) | no |
| Docker Hub container image | yes (linux/amd64) | no image published [NEEDS VERIFICATION - findings say amd64 only on Docker Hub, arm64 present as tarball only] | no |
| `build.sh` arch validation (`^(amd64\|arm64)$`) | accepted | accepted | rejected with `exit 1` |
| CI pipeline coverage | yes (Jenkinsfile) | not explicit | no |
| GitHub release assets | n/a - no GitHub Releases published | n/a | n/a |

Official artifacts are published at [dev.mysql.com/downloads/operator/](https://dev.mysql.com/downloads/operator/). The latest release 26.7.0-2.3.0 ships two Docker tarballs: x86_64 and aarch64. No riscv64 tarball exists.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The operator Python code (`mysqloperator/` package) contains no compiled code, no JIT backend, no SIMD dispatch, and no assembly. The operator itself is architecture-transparent Python.

The architecture-relevant component is **MySQL Shell** (`mysqlsh`), which is a C++ binary installed inside the container image from Oracle's RPM repository for Oracle Linux 9. MySQL Shell contains a V8 JavaScript engine (JIT) and C++ code. The operator container `Dockerfile` installs mysqlsh via `microdnf install mysql-shell-<version>` from Oracle's RPM repo.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Operator Python code | architecture-transparent | architecture-transparent | architecture-transparent |
| MySQL Shell (C++, V8 JIT) | Oracle RPM published | Oracle RPM published | no Oracle binary; no riscv64 RPM |
| Container base (Oracle Linux 9) | supported | supported | no Oracle Linux 9 riscv64 image |
| Architecture guards (`#ifdef __riscv`) in repo | 0 occurrences | 0 occurrences | 0 occurrences |
| Assembly / SIMD / intrinsics in repo | none | none | none |

A search for `rvv repo:mysql/mysql-operator` returned 10 results, all false positives: binary TLS certificate files under `tests/data/ssl/` and one Python test file where "rvv" appears as a substring in an unrelated upgrade test context, not as an RVV intrinsic or ISA reference.

**Conclusion:** There are no riscv64-specific subsystems to implement in the operator code because there are no architecture-specific subsystems at all. The blocking gap is the MySQL Shell binary dependency (see Section 9).

---

## 5. Build System, Cross-Compilation, and Toolchain

The build system is Docker-based container image construction, not native C/C++ compilation.

**Key scripts:**

- `build.sh`: Takes `-a <arch>` flag. Validates with `^(amd64|arm64)$` regex. Passing `-a riscv64` causes `exit 1` with "Error: Invalid architecture 'riscv64'". riscv64 is actively rejected, not silently ignored.
- `manifest.sh`: Constructs Docker multi-arch manifests by pulling only `-arm64` and `-amd64` tagged images. No provision for additional architectures.
- `gen_dockerfile.sh`: Accepts an `ARCH` parameter, defaults to `amd64`. No riscv64 variant listed or documented.
- `build_deps.sh`: Defaults `ARCH=amd64`, accepts positional `$ARCH`. No riscv64 branching logic.
- `docker-build/Dockerfile`: `FROM %%MYSQL_OPERATOR_PYTHON_DEPS%%`, then installs MySQL Shell RPM on Oracle Linux 9.
- `docker-deps/Dockerfile`: Oracle Linux 9 base, `dnf install gcc git tar`, builds Python from tarball, installs pip dependencies.

There is no CMakeLists.txt, no cross-compilation toolchain file, no QEMU reference, and no Dockerfile.riscv64 anywhere in the repository.

**Required toolchain for a riscv64 port (not yet possible):** Oracle would need to publish Oracle Linux 9 riscv64 base images, MySQL Shell riscv64 RPMs, and extend `build.sh` to accept `riscv64`. No third-party cross-compilation path exists because mysqlsh must come from Oracle's RPM repo.

**Build documentation:** CONTRIBUTING.md describes patching pre-built Oracle-published container images. No riscv64 path is mentioned.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Operator deployment (Python controller) | functional | functional | not deployable - no container image |
| InnoDB Cluster management (via mysqlsh) | functional | functional | blocked - no mysqlsh binary |
| Backup execution (via mysqlsh) | functional | functional | blocked - no mysqlsh binary |
| SQL initialization scripts (via mysqlsh) | functional | functional | blocked - no mysqlsh binary |
| Helm chart installation | functional | functional | image pull fails - no riscv64 manifest |
| Kubernetes RBAC / CRD registration | functional | functional | would work if image existed (pure YAML/Python) |

There are no SIMD, floating-point, or cryptographic gaps in the operator code itself because it has none. The gap is total: no container image exists, so the operator cannot be deployed on riscv64 at all.

---

## 7. CI/CD Infrastructure

| CI indicator | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `.github/workflows` directory | does not exist (HTTP 404, GitHub contents API confirmed) | n/a | n/a |
| Jenkins regular pipeline (`tests/ci/pipeline/regular/Jenkinsfile`) | tested | not explicitly listed [NEEDS VERIFICATION] | no reference |
| Jenkins weekly pipeline (`tests/ci/pipeline/weekly/Jenkinsfile`) | tested | not explicitly listed [NEEDS VERIFICATION] | no reference |
| "riscv" / "riscv64" in any CI file | 0 occurrences | n/a | 0 occurrences |
| RISE CI runners | no | no | no |

There are no GitHub Actions workflows of any kind. All CI runs through two Jenkinsfiles and shell scripts under `tests/ci/`. Neither Jenkinsfile nor any other file in the repository contains any reference to "riscv" or "riscv64" (code search confirmed 0 results across the full repository, SHA fd5c6bcf).

The adversarial verification confirms: `.github/workflows` returns HTTP 404 from the GitHub contents API. No `.gitlab-ci.yml`, no `.cirrus.yml`. The evidence is unambiguous.

---

## 8. Distribution and Release Status

| Channel | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| [Oracle official Docker tarball](https://dev.mysql.com/downloads/operator/) | yes (v26.7.0-2.3.0) | yes (v26.7.0-2.3.0-aarch64) | no |
| [Docker Hub mysql/mysql-operator](https://hub.docker.com/r/mysql/mysql-operator/tags) | yes (linux/amd64) | no published image | no |
| PyPI `oracle-mysql-op` | 404 - does not exist | 404 | 404 |
| PyPI `mysql-operator` (unrelated project) | pure-Python any-arch | pure-Python any-arch | pure-Python any-arch |
| Ubuntu noble package | no | no | no |
| Debian package tracker | 404 - does not exist | n/a | n/a |
| [Arch Linux RISC-V port](https://archriscv.felixc.at/) | n/a | n/a | no |
| GitHub Releases | none (empty array from API) | none | none |

Oracle publishes artifacts exclusively via [dev.mysql.com](https://dev.mysql.com/downloads/operator/), not as GitHub release assets.

**What a user must do to get a working binary on riscv64:** It is not possible with current upstream artifacts. There is no supported path.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|-----------|------|--------------|-------------|----------------|-------|
| MySQL Shell (mysqlsh) | Core: InnoDB Cluster mgmt, backup, SQL interface | no Oracle binary | none | none | Hard blocker. Oracle publishes no riscv64 RPM. |
| MySQL Server | Database backend managed by operator | builds from source (Debian sid 9.7.2-1) | limited | Debian only | No Oracle riscv64 binary. See [reports/mysql.md]. |
| kopf 1.43.0 | Kubernetes operator framework | yes | yes | yes (pure-Python) | No riscv64 issues. |
| kubernetes 35.0.0 | Kubernetes API client | yes | yes | yes (pure-Python) | No riscv64 issues. |
| aiohttp 3.13.3 (pinned) | Async HTTP client | yes | yes | yes (>=3.14.x) | Pinned 3.13.3 predates riscv64 wheels; 3.14.x has manylinux+musllinux riscv64 wheels. |
| frozenlist 1.8.0 | Mutable/frozen list, C speedup | yes (from source) | limited | no (issue #744 closed 2026-05-06 but no release ships riscv64 wheels yet) | Falls back to sdist build. |
| multidict 6.7.1 | HTTP headers multidict, C speedup | yes (from source) | limited | no | No riscv64 issue filed. Falls back to sdist. |
| yarl 1.23.0 (pinned) | URL parsing, C speedup | yes | yes | yes (>=1.24.x, issue #1626 closed 2026-02-05) | Pinned 1.23.0 predates riscv64 wheels; >=1.24.x has prebuilt wheels. |
| propcache 0.4.1 (pinned) | Property cache, C speedup | yes | yes | yes (>=0.5.1, added 2026-05-08) | Pinned 0.4.1 predates riscv64 wheels; >=0.5.1 has prebuilt wheels. |
| PyYAML 6.0.3 | YAML parsing, C speedup via libyaml | yes (from source) | limited | no (issue #924 open, filed 2026-03-11, no maintainer response) | Falls back to pure-Python mode or sdist. Not a hard blocker. |
| requests / urllib3 / certifi / idna / charset-normalizer | HTTP for kubernetes client | yes | yes | yes (pure-Python or fallback) | No riscv64 issues. |
| aiosignal / aiohappyeyeballs / attrs / iso8601 / packaging / python-json-logger / click / six / python-dateutil / websocket-client / requests-oauthlib / oauthlib / durationpy | HTTP plumbing, data parsing, TLS glue | yes | yes | yes | All pure Python. No riscv64 issues. |

**Blocker severity classification:**

1. **Critical (hard blocker):** MySQL Shell has no Oracle-published riscv64 binary. The container image installs mysqlsh via `microdnf install mysql-shell-<version>` from Oracle's RPM repo for Oracle Linux 9. Oracle does not produce a riscv64 RPM. Without mysqlsh the operator cannot manage InnoDB Cluster, run backups, or execute SQL initialization. This is the single deployment-blocking dependency. MySQL Server itself has a Debian riscv64 build (9.7.2-1 in sid) but no Oracle binary; a community PR (#639, CRC32C RISC-V acceleration) was auto-closed by the OCA bot.

2. **Moderate (pinning lag, not hard blockers):** Three aio-libs packages have riscv64 wheels available in releases newer than pinned versions: aiohttp (needs >=3.14.x), yarl (needs >=1.24.x), propcache (needs >=0.5.1). Pinned versions fall back to source builds which work but add install time.

3. **Minor (no riscv64 wheels, source build works):** frozenlist, multidict, PyYAML lack riscv64 PyPI wheels. All install cleanly from sdist on riscv64. PyYAML issue #924 is the only open upstream request for any of these.

---

## 11. Known Bugs and Active Issues

There are 8 open issues in mysql/mysql-operator as of August 2026. None are RISC-V related.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #56 | podSpec changes on InnoDBCluster silently ignored | open | medium | 2026-07-26 |
| #55 | Helm chart drops prior versions on new releases | open | medium | 2026-08-12 |
| #53 | Miscellaneous user complaint | open | low | 2026-07-16 |
| #52 | Regression in 2.2.8 - operator restart may not recover OFFLINE clusters | open | high | 2026-07-15 |
| #51 | Pod startup failures when Kopf writes oversized annotations | open | high | 2026-07-01 |
| #50 | Can't upgrade to 9.7.1 | open | medium | 2026-06-21 |
| #47 | Read replica reconcile misclassifies replicas | open | medium | 2026-06-08 |
| #46 | Helm-Chart image not available | open | medium | 2026-05-29 |

No RISC-V correctness bugs exist because the project has never targeted riscv64.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

1. **OCA gate:** All contributions require signing the Oracle Contributor Agreement before any PR can be merged. This blocks community-driven riscv64 work unless contributors sign the OCA, and Oracle must still review and merge any changes.

2. **Oracle-only publish pipeline:** Oracle controls the RPM repo for Oracle Linux 9, the Docker Hub publish pipeline, and the dev.mysql.com artifact distribution. A riscv64 port requires Oracle to produce: an Oracle Linux 9 riscv64 base image, a MySQL Shell riscv64 RPM, updated `build.sh` / `manifest.sh` scripts, and publish riscv64 tarballs to dev.mysql.com.

3. **No public signal of intent:** Zero issues, PRs, or commits reference riscv64. No roadmap item is publicly documented.

4. **Upstream MySQL Shell blocker:** Even if the operator build tooling were updated, MySQL Shell has its own C++ build with a V8 JavaScript JIT engine. Oracle does not publish riscv64 binaries for MySQL Shell and there is no public tracking for a port.

**Technical blockers:**

1. `build.sh` must be modified to remove the `^(amd64|arm64)$` hard validation.
2. `manifest.sh` must be extended to include riscv64 image references.
3. Oracle Linux 9 must have a riscv64 container base image (not confirmed to exist).
4. MySQL Shell must be available as a riscv64 RPM.

**Acceptance probability:** Low without Oracle commitment. The operator Python code itself is architecture-transparent and requires no changes. The entire barrier is the binary supply chain controlled by Oracle.

---

## 13. Investment Analysis

RISE has no involvement with this project (confirmed: not in RISE portfolio, Oracle not a RISE member, no RISE working group issues mentioning MySQL Operator).

### 13.1 Functional Enablement

The operator Python code requires no changes for riscv64. The work is entirely in the container image supply chain:
- Oracle Linux 9 riscv64 base image availability (prerequisite, outside scope of this project)
- MySQL Shell riscv64 RPM from Oracle or alternative packaging (prerequisite, see mysql-shell separately)
- `build.sh` arch validation extension (trivial code change, ~1 hour, but requires OCA and Oracle merge)
- `manifest.sh` multi-arch manifest extension (trivial, same constraint)
- `gen_dockerfile.sh` and `build_deps.sh` riscv64 path documentation (minimal)

If Oracle Shell and Oracle Linux 9 riscv64 prerequisites are met externally, the operator-specific code changes are less than 1 person-week. Without those prerequisites, the operator cannot be deployed on riscv64 regardless.

### 13.2 Performance Optimization

Data not available: no benchmarks for MySQL Operator on riscv64 vs arm64/x86 exist in any public source. No web searches, GitHub issues, or RISE materials contain performance comparison data.

The operator itself (Python controller loop) has no architecture-specific performance paths. MySQL Server performance on riscv64 vs arm64 is covered separately in `reports/mysql.md`.

### 13.3 CI/CD Infrastructure

riscv64 CI would require adding a riscv64 agent to the Jenkins pipeline. The project uses Oracle-internal Jenkins infrastructure (no `.github/workflows` exists). External parties cannot add CI to Oracle's internal Jenkins. A community fork with GitHub Actions QEMU-emulated riscv64 CI is possible but would not count as upstream CI.

Estimated effort for upstream riscv64 CI: 2-4 person-weeks for Jenkins agent provisioning and Jenkinsfile extension, assuming Oracle cooperation. Without Oracle cooperation: not achievable upstream.

### 13.4 Ecosystem Enablement

Not applicable. Oracle MySQL Operator is a Kubernetes operator with no dependent package ecosystem on riscv64. The operator itself is the leaf artifact.

The aio-libs pin lag (aiohttp, yarl, propcache) can be resolved by updating `docker-deps/requirements.txt` pins to versions with prebuilt riscv64 wheels. This is a 1-2 hour change but requires OCA signature and Oracle merge.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | MySQL Shell riscv64 RPM (prerequisite, separate project) | 8-16 (estimate for mysqlsh port; V8 JIT required) | Oracle or community with OCA | Critical |
| Functional | Oracle Linux 9 riscv64 base image (prerequisite) | Oracle internal | Oracle | Critical |
| Functional | Extend `build.sh`, `manifest.sh`, `gen_dockerfile.sh` for riscv64 | <1 | Oracle (OCA required) | High |
| CI/CD | Add riscv64 Jenkins agent to Oracle CI pipeline | 2-4 | Oracle internal | High |
| Dependencies | Update aiohttp / yarl / propcache pins to riscv64-wheel-bearing versions | <1 | Oracle (OCA required) | Medium |
| Dependencies | PyYAML riscv64 wheel publication (issue #924) | 1-2 | PyYAML maintainers (upstream) | Low |

**Net assessment:** Oracle MySQL Operator for Kubernetes has no riscv64 support at any layer. The operator Python code is architecture-transparent and requires no porting work. The total blocker is the binary supply chain: Oracle Linux 9 riscv64 base images and MySQL Shell riscv64 binaries, both controlled by Oracle and neither currently available. Without Oracle commitment, this operator cannot run on riscv64 regardless of community investment.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [MySQL Operator for Kubernetes repository](https://github.com/mysql/mysql-operator)
- [MySQL Operator documentation](https://dev.mysql.com/doc/mysql-operator/en/)
- [MySQL Operator official downloads (dev.mysql.com)](https://dev.mysql.com/downloads/operator/)
- [Docker Hub mysql/mysql-operator](https://hub.docker.com/r/mysql/mysql-operator/tags)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Oracle Contributor Agreement](https://oca.opensource.oracle.com)
- [PyPI mysql-operator package](https://pypi.org/project/mysql-operator/)
- [aiohttp v3.14.3 release assets (riscv64 wheels)](https://pypi.org/project/aiohttp/#files)
- [yarl issue #1626 - riscv64 wheel request (closed 2026-02-05)](https://github.com/aio-libs/yarl/issues/1626)
- [propcache v0.5.2 release (riscv64 wheels added)](https://pypi.org/project/propcache/#files)
- [frozenlist issue #744 - riscv64 wheel request](https://github.com/aio-libs/frozenlist/issues/744)
- [PyYAML issue #924 - riscv64 wheel request (open)](https://github.com/yaml/pyyaml/issues/924)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [Debian tracker mysql-server](https://tracker.debian.org/pkg/mysql-server)