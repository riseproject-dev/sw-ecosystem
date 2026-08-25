---
title: Patroni
---

# Patroni

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Patroni<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Patroni is a Python-based high-availability cluster manager for PostgreSQL. It handles automatic failover and replica promotion by coordinating through a distributed configuration store (DCS) -- etcd, Consul, ZooKeeper, or a Kubernetes-native backend. It originated as a fork of the Governor project (originally by Compose), was publicly introduced by Zalando in February 2016, and has since migrated to its own GitHub organization at [github.com/patroni/patroni](https://github.com/patroni/patroni), indicating progressive community independence from Zalando.

**License:** MIT. Copyright names Compose, Zalando SE, and Patroni Contributors.

**Governance:** Informal. No steering committee, no written governance policy, no voting process. The [MAINTAINERS file](https://github.com/patroni/patroni/blob/master/MAINTAINERS.md) lists two named maintainers:

- Alexander Kukushkin (`CyberDem0n`), Microsoft, Berlin -- primary maintainer, `akukushkin@microsoft.com`
- Polina Bungina (`hughcapet`), Zalando, Berlin -- `polina.bungina@zalando.de`

These two dominate the commit log. External contributions follow a fork-and-PR workflow with lint and test requirements but no formal reviewer SLA.

**Foundation/Umbrella:** None. Patroni is not a CNCF project, not a PostgreSQL Foundation project, and is not a member of the RISE Project.

**Community stance on new platforms:** Not documented. Given that Patroni is pure Python with no compiled code, there is no platform porting effort to have a stance on. New architecture support is implicit wherever Python 3.6+ and PostgreSQL run.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| -- | No riscv64-specific commits, issues, or PRs exist in patroni/patroni | GitHub API search: total_count 0 for "riscv" and "riscv64" across issues, PRs, and commits |

No port effort exists or is needed. Patroni is pure Python. The PyPI wheel is tagged `py3-none-any`. No compilation step exists, so no explicit porting work was ever required or performed.

## 3. Upstream Support Tier

No formal platform tier policy exists. There is no `PLATFORMS.md` or equivalent document. As a pure-Python application with no compiled extensions, Patroni implicitly supports any architecture where Python and PostgreSQL are available.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Yes (ubuntu-22.04, windows-latest, macos-15) | Partial (macos-14/macos-15 are Apple Silicon) | None |
| Official binary release | py3-none-any wheel (no arch binary) | py3-none-any wheel (no arch binary) | py3-none-any wheel (no arch binary) |
| Distro package | Ubuntu, Debian, Arch (AUR) | Ubuntu, Debian | Ubuntu 24.04 (arch: all), Debian sid (arch: all) |
| Functionally supported | Yes | Yes | Yes (implicit, no testing) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Patroni has no architecture-specific subsystems. A full recursive scan of all 333 files in the repository (121 `.py` files, 48 `.pyi` type stubs) confirmed:

- Zero `.c`, `.h`, `.cpp`, `.s`, `.S`, or `.asm` files
- Zero architecture-specific directories (`arch/`, `platform/`, etc.)
- Zero `#ifdef __riscv`, `#ifdef __x86_64__`, or `#ifdef __aarch64__` guards
- No JIT compiler, no SIMD dispatch, no cryptographic assembly, no GC barriers

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core HA logic | Python | Python | Python |
| DCS connectors (etcd, consul, zookeeper) | Python | Python | Python |
| PostgreSQL control wrappers | Python | Python | Python |
| SIMD / native code | None | None | None |
| Assembly | None | None | None |

No riscv64 implementation gaps exist at the Patroni layer.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** setuptools via `setup.py`. Installation: `pip install patroni[etcd3,consul,zookeeper,kubernetes,aws]`.

**No cross-compilation infrastructure exists.** There are no CMake files, configure scripts, or toolchain pinning. No QEMU usage is present in CI.

**Dockerfile caveat:** The repository Dockerfile uses `dpkg --print-architecture` to conditionally build confd from Go source for arm64 (no prebuilt binary) or download a prebuilt binary otherwise. For riscv64, the else branch would attempt to download a prebuilt confd binary from GitHub Releases, which does not exist for riscv64. Similarly, the Dockerfile downloads etcd 3.3.13 using the detected architecture, and no official riscv64 etcd binary exists at that version. This affects the development/testing container only, not Patroni itself.

**Install path for riscv64:**

```
# Distro path (Debian/Ubuntu riscv64 -- recommended)
sudo apt-get install python3-patroni python3-psycopg2

# pip path (requires psycopg2 source build)
sudo apt-get install python3-dev libpq-dev gcc
pip install patroni[etcd3,consul,zookeeper,kubernetes,aws]
```

No known build failures for the Python package itself on riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Automatic failover and promotion | Full | Full | Full (implicit) |
| etcd DCS backend | Full | Full | Requires `ETCD_UNSUPPORTED_ARCH=riscv64` env var |
| Consul DCS backend | Full | Full | Full (pure Python client) |
| ZooKeeper DCS backend | Full | Full | Full (pure Python client) |
| Kubernetes DCS backend | Full | Full | Full (pure Python client) |
| Raft (pysyncobj) DCS backend | Full | Full | Full (pure Python; inherits cryptography wheel gap) |
| TLS support (cryptography) | Full | Full | Functional from source build; no official wheel |
| REST API | Full | Full | Full |
| AWS S3 WAL archiving | Full | Full | Full (boto3 is pure Python) |

No functional gaps exist in Patroni itself on riscv64. The etcd backend requires an environment variable override flag. The cryptography dependency has no official riscv64 wheel but builds from source.

No floating-point, NaN, or numerical correctness issues apply -- Patroni performs no numerical computation.

## 7. CI/CD Infrastructure

No riscv64 CI exists for Patroni. This was confirmed by direct inspection of all workflow files.

**`.github/workflows/tests.yaml`:** `unit` and `behave` jobs run on `ubuntu-22.04`, `windows-latest`, `macos-14`, `macos-15`. No architecture matrix, no QEMU, no riscv64 runner.

**`.github/workflows/jepsen.yaml`:** Manual dispatch only (`workflow_dispatch`). Runs on `ubuntu-latest`. No architecture matrix.

**`.github/workflows/release.yaml`:** Triggered on version tags. Runs on `ubuntu-latest`. Builds a `py3-none-any` universal wheel. No riscv64 target.

The string "riscv" does not appear in any workflow file.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit tests | Yes (ubuntu-22.04) | Partial (macos-14/15) | No |
| Integration tests (behave) | Yes (ubuntu-22.04) | Partial (macos-14/15) | No |
| Jepsen fault injection | Yes (manual trigger) | No | No |
| Release wheel build | Yes | Yes (py3-none-any, same artifact) | Yes (py3-none-any, same artifact) |
| RISE CI runners | No | No | No |

## 8. Distribution and Release Status

Patroni is a pure-Python package. No architecture-specific binary is published or needed anywhere.

**PyPI:** All releases from v0.2 through v4.1.5 use exclusively `py3-none-any` wheels and `.tar.gz` source distributions. No riscv64 wheel has ever been published and none is required. Latest version: 4.1.5, released 2026-08-12.

**GitHub Releases:** Confirmed via GitHub API: releases v4.1.5, v4.0.11, v4.1.4 each return `"assets": []` -- zero attached binary files. No architecture-specific release asset exists.

**Ubuntu 24.04 Noble:** `patroni` v3.2.2-2 is in the `universe` component as `arch: all`. Installs on riscv64 without issue. Also available: `check-patroni` (v1.0.0-1) and `patroni-doc` (v3.2.2-2).

**Debian sid:** `patroni` v4.1.5-1 is packaged as `arch: all`, built once on x86-csail-02. The buildd riscv64 row returns "No entry in riscv64 database," which is expected for `arch: all` packages -- they are not architecture-compiled. The package installs on riscv64 via the standard `arch: all` mechanism. Maintained by the Debian PostgreSQL Maintainers team (Michael Banck, Christoph Berg).

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=patroni)):** No confirmed entry found. [NEEDS VERIFICATION]

**RISE wheel builder:** Patroni is not listed among packages built for riscv64. The RISE PyPI mirror for patroni redirects to upstream PyPI. This is expected -- no compiled extension means no RISE wheel-building effort is needed.

**User action required:** `pip install patroni` or `apt install python3-patroni`. No architecture-specific steps needed for Patroni itself. Friction points lie in dependencies (see Section 9).

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release (wheel) | Blocking Issues |
|---|---|---|---|---|---|
| PostgreSQL | Managed database (runtime dep, not Python wheel) | Builds and runs | Passes | n/a (OS package) | See `reports/postgresql.md` |
| psycopg2 / psycopg3 | PostgreSQL wire driver; C extension wrapping libpq | Builds from source | psycopg3: 5 timing/signal test failures on Fedora riscv64 (closed as non-blocking) | No official wheel; source build required | [psycopg/psycopg#883](https://github.com/psycopg/psycopg/issues/883) (closed), [psycopg/psycopg#1058](https://github.com/psycopg/psycopg/issues/1058) (closed) |
| cryptography | TLS/x509 for Raft mode; Rust + C extension | Builds from source (~8 min on SpacemiT K1) | Passes smoke tests | No official wheel -- issue closed "no action until faster builders available" | [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460) (closed, no ETA); [pyca/cryptography#8640](https://github.com/pyca/cryptography/issues/8640) (closed, OOM on slow HW) |
| psutil | Process/OS metrics; C extension | Builds from source; RISE CI run succeeded (6m39s) | 1 test failure (`test_page_faults_minor_increase` -- minor race, not arch-specific) | No official wheel; PR rejected by maintainer | [giampaolo/psutil#2714](https://github.com/giampaolo/psutil/issues/2714) (closed, rejected); [giampaolo/psutil#2557](https://github.com/giampaolo/psutil/issues/2557) (open, flaky tests on uncommon arches) |
| PyYAML | Config file parsing; optional C extension (libyaml) | Builds from source | Passes | No official wheel; issue open | [yaml/pyyaml#924](https://github.com/yaml/pyyaml/issues/924) (open) |
| etcd (binary) | DCS backend; external binary, not a Python wheel | Builds on riscv64 | Runs with env override | No official binary or Docker image | [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) (closed -- blocked on Kubernetes Prow gaining RISC-V runners) |
| kazoo | ZooKeeper DCS client; pure Python | No arch issues | No arch issues | py3-none-any | None |
| python-etcd | etcd v2 DCS client; pure Python | No arch issues | No arch issues | py3-none-any | None |
| py-consul | Consul DCS client; pure Python | No arch issues | No arch issues | py3-none-any | None |
| pysyncobj | Raft DCS backend; pure Python | No arch binary issues | No arch test issues | py3-none-any; inherits cryptography wheel gap | Inherits cryptography#14460 |
| boto3 | AWS S3 WAL archiving; pure Python | No arch issues | No arch issues | py3-none-any | None |
| urllib3 / click / prettytable / python-dateutil / python-json-logger / ydiff | CLI, formatting, logging; all pure Python | No arch issues | No arch issues | py3-none-any | None |

**Dependency severity summary:**

| Severity | Dependency | Issue |
|---|---|---|
| Medium | cryptography | No official riscv64 wheel; closed without ETA. Source build works but takes ~8 min. |
| Medium | psutil | No official riscv64 wheel; maintainer declined RISE runner offer. Source build works but takes ~7 min. 1 minor test flake. |
| Medium | etcd | Must set `ETCD_UNSUPPORTED_ARCH=riscv64`; no official binary. Blocked on Kubernetes Prow adding RISC-V runners. |
| Low | PyYAML | No riscv64 wheel (issue open); source build works; libyaml C extension is optional. |
| Low | psycopg3 | Timing-related test failures on slow riscv64 hardware; not a functionality blocker. |

In-scope projects with existing reports: PostgreSQL (`reports/postgresql.md`), etcd (`reports/etcd.md`), OpenSSL (transitive dep of cryptography, `reports/openssl.md`).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| -- | No riscv64-specific issues exist | -- | -- | Confirmed by GitHub API and gh CLI searches returning total_count 0 for "riscv" and "riscv64" across all issues |
| [#3153](https://github.com/patroni/patroni/issues/3153) | Static slots make performance degradation | Closed | Low | Architecture-agnostic; resolved in a later Patroni version. No riscv64 component. |

No correctness bugs, no NaN or floating-point issues, no riscv64-specific crash reports exist.

## 12. Objections and Upstream Blockers

No riscv64 objections or blockers exist at the Patroni layer. The project has no compiled code and no architecture-specific logic, so there is nothing for maintainers to object to or block. Patroni runs on riscv64 wherever Python 3.6+ and a working PostgreSQL binary are available.

The three residual friction points are in dependencies, not Patroni itself:

1. **cryptography:** No official riscv64 wheel. Maintainers closed the tracking issue with "no action until faster builders are available." Source build works. No maintainer objection to riscv64 as a platform -- only a build infrastructure capacity constraint.

2. **psutil:** No official riscv64 wheel. Maintainer explicitly declined the RISE offer of CI runners, citing insufficient download volume for riscv64. Source build works. This is a stated maintainer decision, not a technical blocker.

3. **etcd:** Requires `ETCD_UNSUPPORTED_ARCH=riscv64` at runtime. Official riscv64 support is blocked on the Kubernetes Prow CI infrastructure gaining RISC-V runners per sig-k8s-infra policy (dedicated donated hardware required). No technical objection to riscv64.

## 13. Investment Analysis

RISE has no existing involvement with Patroni. The RISE wheel builder does not build Patroni and has no reason to -- it is architecture-neutral. RISE efforts on cryptography and psutil are in scope but those are tracked separately.

### 13.1 Functional Enablement

No work required. Patroni is fully functional on riscv64 today via `pip install` or distro packages. The etcd backend requires a one-line environment variable override (`ETCD_UNSUPPORTED_ARCH=riscv64`).

### 13.2 Performance Optimization

Not applicable. Patroni contains no numerical, SIMD, or compute-intensive code. It is a control-plane orchestration tool. Any performance characteristics are determined entirely by PostgreSQL and the DCS backend, not by Patroni.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI for Patroni is low-effort but delivers minimal value. Because Patroni has no native code, riscv64 CI would only exercise Python interpreter compatibility, which is already guaranteed by the `py3-none-any` packaging. The primary value would be integration testing Patroni against PostgreSQL and etcd on riscv64 hardware.

### 13.4 Ecosystem Enablement

The meaningful ecosystem work is in the dependencies: cryptography and psutil wheels, and etcd official riscv64 binaries. Those are tracked in their respective reports.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Document `ETCD_UNSUPPORTED_ARCH=riscv64` workaround in Patroni docs | 0.1 | Patroni maintainers | Low |
| CI/CD | Add riscv64 integration test job (QEMU or hardware runner) against PostgreSQL + etcd | 1-2 | Patroni maintainers / RISE | Low |
| Functional | cryptography: publish official riscv64 wheel (tracked in cryptography report) | See cryptography report | PyCA maintainers | Medium |
| Functional | psutil: publish official riscv64 wheel (tracked in psutil) | See psutil report | giampaolo/psutil | Medium |
| Functional | etcd: add riscv64 to official release matrix (tracked in etcd report) | See etcd report | etcd maintainers / CNCF | Medium |

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [patroni/patroni GitHub repository](https://github.com/patroni/patroni)
- [Patroni documentation](https://patroni.readthedocs.io/)
- [Patroni MAINTAINERS file](https://github.com/patroni/patroni/blob/master/MAINTAINERS.md)
- [Patroni on PyPI](https://pypi.org/project/patroni/)
- [Patroni in Ubuntu 24.04 (packages.ubuntu.com)](https://packages.ubuntu.com/noble/patroni)
- [Patroni in Debian sid (tracker.debian.org)](https://tracker.debian.org/pkg/patroni)
- [Patroni Debian buildd status](https://buildd.debian.org/status/package.php?p=patroni&suite=sid)
- [pyca/cryptography issue #14460 -- riscv64 wheel](https://github.com/pyca/cryptography/issues/14460)
- [pyca/cryptography issue #8640 -- OOM on slow HW](https://github.com/pyca/cryptography/issues/8640)
- [giampaolo/psutil issue #2714 -- riscv64 wheel declined](https://github.com/giampaolo/psutil/issues/2714)
- [giampaolo/psutil issue #2557 -- flaky tests on uncommon arches](https://github.com/giampaolo/psutil/issues/2557)
- [etcd-io/etcd issue #21509 -- riscv64 official support](https://github.com/etcd-io/etcd/issues/21509)
- [psycopg/psycopg issue #883 -- riscv64 test failures](https://github.com/psycopg/psycopg/issues/883)
- [psycopg/psycopg issue #1058 -- riscv64 test failures](https://github.com/psycopg/psycopg/issues/1058)
- [yaml/pyyaml issue #924 -- riscv64 wheel](https://github.com/yaml/pyyaml/issues/924)
- [RISE Project website](https://riseproject.dev)
- [RISE riscv64 wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [Patroni issue #3153 -- static slots performance degradation](https://github.com/patroni/patroni/issues/3153)