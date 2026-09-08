---
title: Home Assistant
parent: Project Reports
color: orange
---

# Home Assistant

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Home Assistant<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Home Assistant Core is a pure-Python (3.13+, asyncio-based) open-source home automation platform, distributed under the Apache License 2.0. It is governed by the **Open Home Foundation**, a Swiss non-profit (Stiftung) that states it "cannot be sold or acquired" and which governs 250+ open-source projects, standards, drivers and libraries beyond Home Assistant core itself (e.g. WLED, Zigbee2MQTT).

Governance structure: a 4-seat board (Paulus Schoutsen - President, Pascal Vizeli - Treasurer, J. Nick Koston - Member, and a rotating seat, currently Trevor Schirmer, reserved for a commercial-partner representative), plus a Leadership Committee chaired by Franck Nijhof over six departments (Marketing, Product & UX, Ecosystem, Community, Back Office). Two corporate sponsors fund the foundation via product/subscription revenue-share: **Nabu Casa** (original commercial partner, makes Home Assistant Cloud and the Green/Yellow hardware) and **Apollo Automation** (joined end of 2025). There is no numeric/tiered membership schema (e.g. Platinum/Gold); the foundation states it will "welcome other organizations with a proven track record."

There is no `MAINTAINERS`/`OWNERS` file in `home-assistant/core`; code ownership is tracked through a machine-generated `CODEOWNERS` file with roughly 3,500+ path-to-team/user mappings.

Community culture toward new architecture ports is conservative and hardware-adoption-driven: maintainers state their "supported architecture list is driven by real hardware that a meaningful portion of our user base actually runs HA on" ([home-assistant/architecture Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107)). The team is receptive to infrastructure changes that make forks/downstream ports easier (e.g. parameterizing build-arg architecture strings) but resistant to carrying new-architecture support directly in core, or to changes whose CI/maintenance burden would fall on the 95%-of-users container base ([core PR #75318](https://github.com/home-assistant/core/pull/75318) rejection).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-07-16 | [core PR #75318](https://github.com/home-assistant/core/pull/75318) (author Arnie97) "Make orjson an optional dependency" opened and closed unmerged same day - earliest documented riscv64/mips build blocker in core (orjson's maturin/Rust build unavailable for those targets) | core PR #75318 |
| 2024-07-05 | [architecture Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107) opened by contributor eshattow, proposing official riscv64 support, citing StarFive JH7110 hardware | Discussion #1107 |
| 2024-07-11 | Maintainer agners lays out bring-up requirements: Alpine 3.20+ riscv64 support, wheels-builder extension, auditwheel/PyPI riscv64 gaps | Discussion #1107 |
| 2025-01-07 | [wheels PR #821](https://github.com/home-assistant/wheels/pull/821) (eshattow) opened and closed same day - riscv64 proof-of-concept; maintainer edenhaus questioned scope ("Why are you adding riscv64?") | wheels PR #821 |
| 2025-01-13 | [wheels PR #822](https://github.com/home-assistant/wheels/pull/822) (eshattow) merged - scoped-down auditwheel 6.2.0 update, the real prerequisite for musllinux/riscv64 wheel tooling; first shipped in wheels release 2025.02.0 (tagged 2025-02-27) | wheels PR #822 |
| 2026-04-19 to 2026-04-20 | [docker-base PR #360](https://github.com/home-assistant/docker-base/pull/360) (eshattow) merged - parameterizes distro Dockerfile repo/URL/arch strings via `TARGETARCH`, explicitly to ease "developing a port to an unsupported architecture" from a fork; first shipped in 2026.05.0 (tagged 2026-05-20) | docker-base PR #360 |
| ~May 2026 | eshattow reports first fully working riscv64 Home Assistant build (per progress updates in Discussion #1107) | Discussion #1107 |
| 2026-05-07 | Maintainer edenhaus (Collaborator) posts the official, marked answer in Discussion #1107: riscv64 officially declined "for the time being," citing lack of consumer hardware adoption | Discussion #1107 |
| 2026-05-12 | RISE blog post ["RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) reports GitHub user eshattow logged 1,707 riscv64 Home Assistant container-build jobs on RISE's runners | RISE blog |
| 2026-05-19 to 2026-07-03 | [docker-base PR #365](https://github.com/home-assistant/docker-base/pull/365) (bdraco) opened, then closed/superseded by #380 after eshattow reports it fails to compile on riscv64 (LLVM `preserve_none` ABI unsupported) | docker-base PR #365 |

**Key contributors:** eshattow (independent/community contributor - all substantive riscv64 groundwork), agners (maintainer - requirements scoping), edenhaus (Collaborator - final riscv64 decision and wheels-PR review), bdraco (maintainer - docker-base clang/ThinLTO PR), frenck (maintainer - orjson PR rejection, wheels #822 merge approval), sairon (docker-base #360 reviewer), Arnie97 (distinct individual, author of core PR #75318, predates eshattow's work by roughly two years).

**Is it fully upstream?** No. `home-assistant/core` itself contains zero riscv64 code, CI, or configuration. The only two merged riscv64-adjacent PRs (wheels #822, docker-base #360) live in sibling infrastructure repos and are explicitly framed by their author and reviewers as enabling *fork-friendly, out-of-tree* riscv64 work, not official platform support.

## 3. Upstream Support Tier

Home Assistant has no formally published, numeric architecture-tier policy. The operative bar, stated directly by a maintainer, is: "our supported architecture list is driven by real hardware that a meaningful portion of our user base actually runs HA on" ([Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107)). By this bar, amd64 and aarch64 are the only two supported architectures; riscv64 is explicitly excluded pending consumer hardware adoption.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| Official release (Docker Hub `homeassistant/home-assistant`) | yes | yes | no |
| Official HAOS board/machine target | yes | yes | no |

Docker Hub is confirmed as the actual official multi-architecture distribution channel; its manifest for `homeassistant/home-assistant:latest` lists only `amd64` and `arm64` platforms - no riscv64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Home Assistant Core is a pure-Python application with **no compiled, architecture-specific source code of its own**: no `#ifdef __riscv` guards, no SIMD/vector intrinsics, no hand-written assembly, no `arch/riscv/` directory. Confirmed via live GitHub code search against the repo: queries for `__riscv`, `riscv`, `riscv64` (all forms), and `riscv64 language:YAML` each return 0 results; a sanity-check query for `"amd64"` returns 22 real hits, confirming the search index itself is functioning and that amd64/aarch64 references genuinely exist while riscv64 references genuinely do not.

The only place "architecture" appears in `core` is at the build/packaging/telemetry layer:

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| `.github/workflows/wheels.yml` build matrix | full | full | missing |
| `.github/workflows/builder.yml` `ARCHITECTURES` list | full | full | missing |
| `script/hassfest/docker.py` `_MACHINES` arch table (per-board Dockerfile generation) | full | full | missing |
| Generated machine Dockerfiles (`machine/generic-x86-64`, etc. -> `ghcr.io/home-assistant/<arch>-homeassistant`) | full | full | missing (no `machine/*riscv*` file, no `ghcr.io/home-assistant/riscv64-homeassistant` image) |
| `homeassistant/helpers/system_info.py` arch normalization (`{"x86_64":"amd64"}` map) | full | full (aarch64 already canonical, passes through unmapped) | not addressed - riscv64 would pass through unmapped with no explicit handling either way |
| Supervisor/analytics arch enums in tests/fixtures | full | full | missing |
| Wheel/binary-dependency build (Rust/maturin deps, e.g. orjson) | full | full | broken/blocked - [core PR #75318](https://github.com/home-assistant/core/pull/75318) exists precisely because orjson's maturin build is unavailable for riscv64/mips, and the PR was closed unmerged |

There is no full/partial/scalar-fallback tier to award for Home Assistant core itself; every applicable component is either full (amd64, aarch64) or missing (riscv64). All architecture-specific SIMD/crypto/JIT concerns that exist in the broader deployment live in compiled dependencies, covered in Section 9, not in this repository.

## 5. Build System, Cross-Compilation, and Toolchain

`home-assistant/core` has no C/C++/CMake build system. Confirmed directly against a live clone (branch `dev`): no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist (there is no `docs/` directory at all); no `CMakeLists.txt` exists anywhere in the tree (GitHub code search: 0 results); no `cmake/` directory exists; and code search for `riscv64 repo:home-assistant/core filename:Dockerfile` returns 0 results. The only Dockerfiles present (`Dockerfile`, `Dockerfile.dev`, `script/hassfest/docker/Dockerfile`) mention no architecture toolchain at all.

`pyproject.toml`: `[build-system] requires = ["setuptools==78.1.1"]`, `build-backend = "setuptools.build_meta"` - a pure-Python package build. The repo's `Dockerfile` simply `pip3`/`uv pip install`s Python wheels; it invokes no compiler toolchain and no CMake/configure step. No QEMU cross-architecture build usage for riscv64 was found (QEMU only appears as board-name substrings such as `qemuarm-64`/`qemux86-64`, unrelated machine identifiers).

**Known build failure (in sibling repo, not core):** [docker-base PR #365](https://github.com/home-assistant/docker-base/pull/365) attempted to switch Python 3.14 builds to clang+lld+ThinLTO+tail-call interpreter. eshattow reported the build fails on riscv64: LLVM's `preserve_none` calling-convention attribute, required by the tail-call interpreter, is implemented only for X86-64 and AArch64 targets. A workaround (`-target-abi=lp64d`) produced 6-hour build timeouts with ABI-mismatch complaints. The PR was closed and superseded by #380, which keeps `CC=gcc` for wheel compilation and uses clang only for the Python runtime itself, sidestepping the riscv64 gap rather than closing it.

**Bottom line:** any riscv64 build system for Home Assistant would have to live in a repo or PR that does not currently exist - there is nothing further to document for `core` itself.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Official Docker image (`homeassistant/home-assistant`) | yes | yes | no |
| Official HAOS board/machine image | yes | yes | no |
| Upstream CI tested | yes | yes | no |
| Official PyPI wheel (arch-specific) | n/a - universal wheel | n/a - universal wheel | n/a - universal wheel, but compiled dependency wheels missing (Section 9) |
| Community/unofficial builds | n/a | n/a | yes - e.g. [fede2cr/riscv64-homeassistant](https://github.com/fede2cr/riscv64-homeassistant) |

**Functional gap:** the entire riscv64 platform target is absent - no HAOS image, no machine board target, no official container image. A riscv64 user cannot obtain any official artifact and must resort to unofficial community Docker images or manual pip-install with self-sourced dependency wheels.

**Performance gap:** no benchmark data comparing Home Assistant on riscv64 vs amd64/aarch64 was found anywhere (three targeted GitHub searches for riscv64 performance/bug/NaN issues against `home-assistant/core` returned no genuine riscv-related hits). The only available timing data, from Discussion #1107's community bring-up, is CI/manual-install elapsed time, not runtime throughput: manual Alpine install of Home Assistant on a StarFive JH7110 board took roughly 5 hours total (initial package install 1h42m47s, constraint-dependency build 3h24m44s); a full riscv64 docker-base build took 4h3m57s. No comparable timing figures for amd64/aarch64 were captured in the same source for direct comparison. General (non-Home-Assistant) SBC benchmarks found separately show the VisionFive 2 (same JH7110 SoC) trailing Raspberry Pi 4/CM3-class ARM performance significantly on Geekbench 6, attributed to immature JH7110 compiler/software optimization [NEEDS VERIFICATION - not Home-Assistant-specific, single source].

**Security hardening gap:** not directly assessed for Home Assistant's own code (it has none that is architecture-specific). The relevant exposure is in crypto dependencies: no official PyPI riscv64 wheel exists for `cryptography` (Section 9), and a community forum user reported a runtime `undefined symbol: EVP_PKEY_id` error with `cryptography` on RISC-V [NEEDS VERIFICATION - single source, community forum].

**NaN/floating-point issues:** NumPy, a transitive Home Assistant dependency used by several integrations (recorder statistics, sensors, media), has two open riscv64-specific failing tests - `test_unary_spurious_fpexception` and `test_floor_division_errors` - tracked in [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461) and [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376).

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in `home-assistant/core`, confirmed via two independent live clones (commit `62c3cc8871ddb4312c006353fa17d1d7fb92a6e5`, dated 2026-09-08; and commit `dd8fd40b3a4a2eb5ed3e773ec50030453f3eda03`). A case-insensitive recursive grep for "riscv" across the entire `.github` directory (all 15 workflow files plus the `matchers/` subdirectory) returns zero matches.

- `.github/workflows/builder.yml`, line 18: `ARCHITECTURES: '["amd64", "aarch64"]'`. Runners used: `ubuntu-latest`, `ubuntu-24.04`, and `ubuntu-24.04-arm` (native ARM runner - not RISC-V).
- `.github/workflows/wheels.yml`, lines 111 and 162: `arch: ["amd64", "aarch64"]` matrix.
- `.github/workflows/ci.yaml` (main test/lint pipeline): all jobs run on `runs-on: ubuntu-24.04` (x86_64); no architecture matrix at all.

No RISE runner references exist anywhere in `home-assistant/core`'s own CI. RISE runners *are* used for riscv64 Home Assistant builds, but only by the independent community project associated with GitHub user eshattow (1,707 jobs recorded per RISE's own blog post), entirely outside official Home Assistant infrastructure.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| CI release/publish | yes | yes | no |
| Runner type | GitHub-hosted (`ubuntu-latest`/`24.04`) | native ARM (`ubuntu-24.04-arm`) | none |

## 8. Distribution and Release Status

No official riscv64 binary exists for Home Assistant in any channel checked:

- **PyPI** (`homeassistant`): pure-Python universal wheel (`py3-none-any`) plus sdist only - no architecture-specific artifact of any kind, checked live against the JSON API for v2026.9.1.
- **Docker Hub** (`homeassistant/home-assistant`, the actual official multi-arch channel): manifest platform list is `amd64`, `arm64` only - riscv64 absent, verified via the Docker Hub API.
- **GitHub releases** (`home-assistant/core`): source tarballs/changelogs only, not per-architecture compiled binaries; no riscv64 mention anywhere on the latest release page (2026.9.1).
- **Ubuntu 26.04 (resolute):** no `home-assistant`/`homeassistant` application package exists for any architecture at all (project-graph SPARQL query empty for the exact package names; a broader fuzzy query surfaces only an unrelated pure-Python helper library, `python3-home-assistant-bluetooth`, which is not the Home Assistant application and is riscv64-available only because it is architecture-independent Python).
- **Arch Linux RISC-V unofficial port** (archriscv.felixc.at): zero results for "home assistant" / "homeassistant."
- **RISE wheel builder** (GitLab project 56254198): a query for `homeassistant` 302-redirects to plain PyPI - RISE provides no custom riscv64 wheel for this package specifically.

**What a user must do today to get a working riscv64 binary:** use an unofficial third-party community Docker image (e.g. [fede2/riscv64-homeassistant](https://hub.docker.com/r/fede2/riscv64-homeassistant) on Docker Hub, or `nakata5321/riscv-homeassistant`), or manually `pip install` the universal `homeassistant` wheel and separately source or build riscv64 wheels for its compiled dependencies (cryptography, numpy, orjson, pillow, grpcio, etc. - none of which have official riscv64 PyPI wheels either; see Section 9). Community forum reports describe this taking roughly 5 hours end-to-end on real riscv64 hardware (StarFive JH7110), and at least one user reported abandoning riscv64 for a Raspberry Pi after `av==13.1.0` failed to install due to no riscv64 ffmpeg binaries [NEEDS VERIFICATION - single source, community forum].

## 9. Dependencies

Home Assistant core itself is pure Python; the riscv64-relevant risk lives entirely in its compiled dependencies (crypto, numerics/SIMD, compression, FFI). Ubuntu 26.04 (resolute) availability queried via the project graph.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| **cryptography** `==48.0.1` | TLS/crypto core (pyOpenSSL, PyJWT, aiohttp TLS, cloud auth) | Ubuntu 26.04 riscv64 package exists (`python3-cryptography`, builds from source in ~8 min) | No riscv64-specific test failures found | No official PyPI riscv64 wheel (v50.0.1 checked); 3rd-party RISE index provides prebuilt wheels | [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460), closed but unresolved |
| **OpenSSL** (underlies cryptography/pyOpenSSL) | Crypto primitives | Ubuntu 26.04 riscv64 package exists; upstream has active riscv64 CI | Flaky: `test_lhash` occasionally fails on linux-riscv64 CI | Source releases/distro-packaged | [#28118](https://github.com/openssl/openssl/issues/28118), [#30880](https://github.com/openssl/openssl/issues/30880), [#29453](https://github.com/openssl/openssl/issues/29453), [#28664](https://github.com/openssl/openssl/issues/28664), [#25334](https://github.com/openssl/openssl/issues/25334) |
| **PyNaCl** (wraps libsodium) | Crypto (hass-nabucasa cloud paths) | Ubuntu 26.04 package exists, but its cffi ABI dependency (`python3-cffi`) is **not built for riscv64** in resolute (amd64/arm64 only) | No riscv64-specific issues found | No riscv64 PyPI wheel (v1.6.2 checked) | No direct filing, but exposed to the cffi gap below |
| **bcrypt** (Rust) | Password hashing for HA auth | Ubuntu 26.04 package exists | No riscv64 issues found | No riscv64 PyPI wheel (v5.0.0 checked) | None identified |
| **cffi** | FFI backend used transitively by PyNaCl/older bcrypt/crypto backends | **Not built for riscv64 in Ubuntu 26.04 resolute** (amd64/arm64 only) | n/a (not built) | No riscv64 PyPI wheel (v2.1.1 checked) | [python-cffi/cffi#233](https://github.com/python-cffi/cffi/issues/233), open ask for riscv64 wheel - the one genuine missing-from-archive gap found |
| **NumPy** `==2.3.2` | Numerics/SIMD (recorder stats, sensors, media) | Ubuntu 26.04 package exists; upstream has QEMU-based riscv64 CI | Open: 2 failing riscv64-specific FP-exception tests | No official PyPI riscv64 wheel; RISE has independently built/distributed riscv64 numpy wheels for over a year | [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216), [#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376), [#26200](https://github.com/numpy/numpy/issues/26200) |
| **pandas** `==2.3.3` | Numerics (statistics/recorder-adjacent integrations) | **Not built for riscv64 in Ubuntu 26.04 resolute** (amd64/arm64 only) | n/a (not built) | No riscv64 PyPI wheel found; essentially untracked upstream for riscv64 | No open riscv64 issue found upstream at all - unaddressed, not merely unfinished |
| **Pillow** `==12.3.0` | Image processing (camera/media) | Ubuntu 26.04 package exists; a tested riscv64 wheel exists and imports fine on real hardware (BananaPi F3) | [python-pillow/Pillow#9603](https://github.com/python-pillow/Pillow/issues/9603), AVIF write test failure (closed) | No official PyPI riscv64 wheel (v12.3.0 checked) despite all infra (manylinux_2_28_riscv64, cibuildwheel, auditwheel) already supporting it | [python-pillow/Pillow#9462](https://github.com/python-pillow/Pillow/issues/9462), open, PR #9463 pending |
| **orjson** `==3.11.9` | Fast/SIMD JSON serializer (Rust) - HA's primary serializer | Ubuntu 26.04 package exists | No riscv64 issues found | No riscv64 PyPI wheel found (v3.12.0 checked) | None filed |
| **Protocol Buffers/protobuf** `==7.36.0` | Serialization (used transitively by grpcio) | Ubuntu 26.04 package exists | Historical Abseil `__atomic_exchange_1` link failure, now closed/fixed | Distro-packaged; no explicit riscv64 PyPI wheel tracking | [protocolbuffers/protobuf#14549](https://github.com/protocolbuffers/protobuf/issues/14549) closed/fixed, [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) closed |
| **gRPC/grpcio** `==1.83.1` | RPC (Google/OpenAI backend integrations) | Ubuntu 26.04 package exists; RISE has built/tested working riscv64 wheels for over a year | Historical: SIGILL and undefined-symbol bugs, both closed | No official PyPI riscv64 wheel; 3rd-party RISE index available | [grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591) closed without merge |
| **Brotli** | HTTP compression (via aiohttp) | Ubuntu 26.04 package exists | No riscv64 issues found | Distro-packaged riscv64 available | None found |
| **FFmpeg** (via PyAV `av==17.0.1`) | Media/codec pipelines (camera/audio) | Ubuntu 26.04 package exists | No riscv64 issues found | Distro-packaged riscv64 available | None found; but a community user reported install failure with pinned `av==13.1.0` due to missing riscv64 ffmpeg binaries [NEEDS VERIFICATION - single source] |

**Key takeaways:**
1. Every dependency checked resolves to a real riscv64 Ubuntu 26.04 binary except **pandas** and **cffi** (amd64/arm64 only). The `cffi` gap is a latent risk because PyNaCl's declared dependency chain resolves through the cffi ABI virtual packages.
2. The PyPI wheel layer is the recurring gap: none of cryptography, numpy, pillow, orjson, grpcio, protobuf, pandas, pynacl, bcrypt, or cffi ship an official `linux_riscv64` wheel on PyPI. All the underlying C/Rust code builds and runs on riscv64 - this is a CI/release-engineering backlog, not a portability blocker. RISE is cited repeatedly across these upstream issues as already building and offering riscv64 wheels via unofficial indices.
3. Open, riscv64-specific correctness bugs are concentrated in **NumPy** (FP-exception test failures) and **OpenSSL** (flaky CI test, missing musl capability detection, intrinsics/perf work).
4. **pandas** has essentially zero riscv64 attention upstream - no riscv64 issue exists at all, and no Ubuntu riscv64 package - the single largest unaddressed dependency gap if any Home Assistant integration pulls it in on a riscv64 host.

## 10. Ecosystem Status

Home Assistant's own critical build/runtime dependency set is covered in Section 9. Two additional ecosystem-level gaps specific to the Home Assistant deployment stack (beyond core's direct Python dependencies) were identified in the master tracking discussion but not independently re-verified in this research pass:

- **netifaces**: cited by eshattow in [Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107) as an unmaintained wheel that remains a blocker for a clean riscv64 install [NEEDS VERIFICATION - single source].
- **go2rtc**: cited in the same discussion as lacking a riscv64 Docker image, blocking the media/streaming component of a full Home Assistant riscv64 deployment [NEEDS VERIFICATION - single source].

Data not available: a systematic survey of riscv64 wheel coverage across Home Assistant's broader per-integration PyPI dependency set (the individual libraries each of Home Assistant's many integrations pulls in) was not performed in this research; only the core/critical dependency set in Section 9 was checked against Ubuntu 26.04, PyPI, and the RISE wheel builder.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [core#178700](https://github.com/home-assistant/core/issues/178700) | raspberrypi5-64 arm64 image 0-byte `/init`, exec format error | Open | N/A to riscv64 | False-positive keyword match - this is an aarch64/arm64 defect, not riscv64. Listed for completeness/exclusion only. |
| [docker-base#365](https://github.com/home-assistant/docker-base/pull/365) | LLVM `preserve_none`/tail-call interpreter unsupported on riscv64 | Closed, superseded by #380 | Medium (toolchain gap, unresolved for riscv64 specifically) | Confirmed technical build failure; workaround caused 6-hour timeouts |
| [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376) | riscv64-specific floating-point exception test failures | Open | Correctness | Affects `test_unary_spurious_fpexception`, `test_floor_division_errors`; relevant to any HA integration using numpy |
| [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460) | riscv64 wheel infra needed | Closed, unresolved | Release-blocking | Needs pyca infra changes (containerized build, static OpenSSL cross-compile) |
| [python-cffi/cffi#233](https://github.com/python-cffi/cffi/issues/233) | riscv64 wheel request | Open | Release-blocking | Blocks PyNaCl's cffi backend on Ubuntu 26.04 riscv64 |
| Community forum report | `cryptography` runtime error `undefined symbol: EVP_PKEY_id` on RISC-V | Unresolved, not formally tracked | Correctness (crash-class) | [NEEDS VERIFICATION - single source, community forum, not a filed GitHub issue] |
| Community forum report | USB device recognition failure on Debian riscv64 (Zigbee dongles not appearing under `/dev/tty*`) | Unresolved, not formally tracked | Functional | [NEEDS VERIFICATION - single source, community forum] |
| Community forum report | `av==13.1.0` install failure - no riscv64 ffmpeg binaries published | Unresolved, not formally tracked | Functional | [NEEDS VERIFICATION - single source, community forum] |

**Correctness bugs highlighted:** the `cryptography` `EVP_PKEY_id` runtime symbol error (crash-class, single-source, unverified against a second source) and NumPy's two open riscv64-specific floating-point exception test failures (upstream-confirmed, open) are the only concrete correctness issues found.

## 12. Objections and Upstream Blockers

**Stated objection (formal, canonical):** maintainer edenhaus, in the marked answer to [Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107) (2026-05-07): "For the time being we don't plan to add official support for riscv64 ... the current lack of widely available, popular consumer boards." / "our supported architecture list is driven by real hardware that a meaningful portion of our user base actually runs HA on." / "RISC-V isn't quite there yet in terms of mainstream adoption." This is a market/hardware-adoption decision, not a technical one; the team stated core fixes will not be blocked on riscv64 and welcomed community contributions outside core infrastructure, and signaled willingness to reconsider if consumer riscv64 hardware adoption grows.

**Technical blockers (secondary, largely resolved or contained to sibling repos):**
- auditwheel/musllinux riscv64 support - resolved ([wheels#822](https://github.com/home-assistant/wheels/pull/822), merged 2025-01-13).
- Missing PyPI riscv64 wheels for orjson, pynacl, cryptography, pillow, grpcio, numpy, pandas, cffi, bcrypt - all confirmed absent (Section 9).
- LLVM `preserve_none` ABI gap blocking clang/ThinLTO Python 3.14 builds on riscv64 ([docker-base#365](https://github.com/home-assistant/docker-base/pull/365), open/superseded).
- go2rtc lacking a riscv64 Docker build (per Discussion #1107) [NEEDS VERIFICATION - single source].
- netifaces unmaintained wheel (per Discussion #1107) [NEEDS VERIFICATION - single source].
- A paid external translation-tooling provider requirement, noted in Discussion #1107 as tangential friction.

**Organizational blockers:** frenck's 2022 rejection of [core#75318](https://github.com/home-assistant/core/pull/75318) set the bar: "I personally would only accept this if both paths (with and without orjson) are actively tested in our CI for all things that use this" - dual-path CI coverage that nobody has since attempted. Maintainer edenhaus's pushback on [wheels#821](https://github.com/home-assistant/wheels/pull/821) shows the team wants riscv64 changes proposed deliberately via a future Architectural Decision Record (ADR), not folded into unrelated infra PRs.

**Acceptance probability:** Low in the near term. The technical bring-up is largely complete - eshattow reported a first fully working riscv64 build by May 2026 - but the stated blocker is an explicit business/hardware-adoption gate, not a remaining engineering task. The maintainers have shown they will accept fork-friendly infrastructure ([docker-base#360](https://github.com/home-assistant/docker-base/pull/360)) but not official riscv64 support absent a shift in consumer hardware adoption or a formal ADR. No corporate sponsor pressure toward riscv64 was identified: Home Assistant, Nabu Casa, and Open Home Foundation are all absent from RISE's Premier and General member lists (checked directly against [riseproject.dev/members](https://riseproject.dev/)).

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** third-party (unofficial community Docker images, e.g. [fede2/riscv64-homeassistant](https://hub.docker.com/r/fede2/riscv64-homeassistant), `nakata5321/riscv-homeassistant`; no official upstream, RISE, or Linux-distribution release exists - Ubuntu 26.04 does not package Home Assistant at all, and the RISE wheel builder redirects `homeassistant` queries to plain PyPI with no custom wheel)
- Not an optimization-purpose project (Home Assistant is an end-user application whose value does not derive from ISA-specific hot-path optimization); Section 2 of the color model does not apply, and no Optimization level is reported.

**Justification:** No riscv64 CI exists anywhere in `home-assistant/core` - confirmed via two independent live clones and a full `.github` grep; `builder.yml` and `wheels.yml` matrices list only `["amd64", "aarch64"]` ([builder.yml](https://github.com/home-assistant/core/blob/dev/.github/workflows/builder.yml)). No official riscv64 release exists on PyPI, Docker Hub, GitHub releases, or any Linux distribution - Ubuntu 26.04 (resolute) does not package Home Assistant at all, and Docker Hub's `homeassistant/home-assistant` manifest lists only amd64/arm64. Maintainers formally and explicitly declined official riscv64 support in [architecture Discussion #1107](https://github.com/home-assistant/architecture/discussions/1107) (2026-05-07), citing lack of consumer hardware adoption rather than a technical blocker. With no upstream CI and no distribution shipping the package (so the yellow/orange distribution floor from unpatched-vs-patched distro builds does not apply - there simply is no distro package to floor against), and only unofficial third-party community builds available, this project sits at orange: a real, technically-buildable riscv64 path exists via community effort, but nothing is upstream-CI'd, upstream-tested, or upstream-released.

**Pending work that could change the grade:** [wheels#822](https://github.com/home-assistant/wheels/pull/822) (merged) and [docker-base#360](https://github.com/home-assistant/docker-base/pull/360) (merged) provide fork-friendly riscv64-enabling infrastructure already in place upstream. [docker-base#365](https://github.com/home-assistant/docker-base/pull/365) remains an open toolchain gap (LLVM `preserve_none` unsupported on riscv64), superseded by #380 rather than resolved. RISE runners are used by an independent community contributor (eshattow, 1,707 jobs per RISE's blog post) for unofficial riscv64 container builds, but RISE has no formal involvement, funding, or membership relationship with Home Assistant, Nabu Casa, or the Open Home Foundation. None of this pending work changes the grade absent either (a) a formal ADR proposal accepted by maintainers, or (b) a shift in the maintainers' stated consumer-hardware-adoption criterion.

## 14. Investment Analysis

Before sizing new work: RISE has not built dedicated riscv64 artifacts for the `homeassistant` PyPI package itself (checked directly against the RISE wheel builder's 99-package listing - not present), but RISE-adjacent work already exists for several of Home Assistant's critical dependencies - numpy, cryptography, and grpcio riscv64 wheels have been built and distributed independently by RISE via its third-party index for over a year (Section 9). RISE runners are also already in active use (unofficially) for Home Assistant riscv64 container CI, at meaningful volume (1,707 jobs, per RISE's blog post), driven entirely by one community contributor (eshattow) rather than any RISE-Home-Assistant partnership.

### 14.1 Functional Enablement

Home Assistant core requires no code changes for riscv64 - it is pure Python with zero riscv64-specific gaps at the application layer. The functional gap is entirely in (a) getting official riscv64 CI/release support merged into `home-assistant/wheels`, `home-assistant/docker-base`, `home-assistant/builder`, and `home-assistant/core`'s own `builder.yml`/`wheels.yml` architecture matrices, and (b) closing the PyPI riscv64 wheel gaps for cryptography, numpy, orjson, pillow, grpcio, pandas, pynacl, bcrypt, and cffi (Section 9). Per Discussion #1107, most of this bring-up work has already been done informally by community contributor eshattow (auditwheel updates, working base-image builds, a documented end-to-end successful install) - the remaining work is primarily upstreaming and formal maintainer acceptance (an ADR), not new engineering from scratch.

### 14.2 Performance Optimization

Not applicable in the traditional sense: Home Assistant core is a pure-Python application with no ISA-specific hot paths to optimize. What reads as "performance" work here is ensuring dependencies (numpy, cryptography, grpcio) have riscv64-optimized builds available - this is a build-availability gap tracked under Functional Enablement and Section 9's dependency table, not an algorithmic optimization gap.

### 14.3 CI/CD Infrastructure

Requires adding riscv64 to `home-assistant/core`'s `builder.yml` and `wheels.yml` `ARCHITECTURES` matrices (currently `["amd64", "aarch64"]` only), plus resolving the LLVM `preserve_none` ABI gap in docker-base (the #365/#380 line of work) before riscv64 can use the same clang/ThinLTO Python 3.14 build path as amd64/aarch64.

### 14.4 Ecosystem Enablement

PyPI riscv64 wheels are needed for cryptography, numpy, orjson, pillow, grpcio, pandas, pynacl, bcrypt, and cffi - each independently tracked in upstream issues (Section 9). RISE is already engaged with several of these (numpy, grpcio, cryptography wheel building) independent of any Home Assistant-specific effort. `pandas` and `cffi` stand out as having essentially no upstream riscv64 tracking at all and would need fresh issue-filing/engagement to start.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream and formalize eshattow's existing riscv64 wheels-builder and docker-base groundwork via a maintainer-accepted ADR | Data not available: no effort estimate found in research; the technical work is largely already done by a community contributor, so remaining effort is primarily upstreaming/process, not engineering | Home Assistant core team + eshattow | High |
| Functional | Add riscv64 to `home-assistant/core`'s `builder.yml` and `wheels.yml` architecture matrices | Data not available: no effort estimate found | Home Assistant core team | High |
| CI/CD | Resolve LLVM `preserve_none`/tail-call interpreter gap for riscv64 in docker-base's clang/ThinLTO Python 3.14 build path | Data not available: no effort estimate found | Home Assistant docker-base maintainers / LLVM upstream | Medium |
| Ecosystem | Close PyPI riscv64 wheel gaps for cryptography, numpy, orjson, pillow, grpcio, pandas, pynacl, bcrypt, cffi | Data not available: no effort estimate found; RISE has partial existing coverage for numpy/cryptography/grpcio via its third-party index | RISE / respective upstream projects | High |
| Organizational | Secure a formal maintainer decision reversal (requires consumer riscv64 hardware adoption evidence or a corporate sponsor push) | Data not available: not an engineering task, no effort estimate applicable | Chip-company advocacy / Open Home Foundation board | Low (outside engineering control) |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [home-assistant/architecture Discussion #1107 - Supported boards/hardware/machines: riscv64](https://github.com/home-assistant/architecture/discussions/1107)
- [home-assistant/core issue #118996 (false positive, aarch64/RPi4 isal build failure)](https://github.com/home-assistant/core/issues/118996)
- [home-assistant/core PR #75318 - Make orjson an optional dependency](https://github.com/home-assistant/core/pull/75318)
- [home-assistant/wheels PR #821 - Update auditwheel to 6.2.0 (riscv64 PoC, closed)](https://github.com/home-assistant/wheels/pull/821)
- [home-assistant/wheels PR #822 - Update auditwheel to 6.2.0 (merged)](https://github.com/home-assistant/wheels/pull/822)
- [home-assistant/docker-base PR #365 - python 3.14 clang/lld/ThinLTO/tail-call (closed, superseded)](https://github.com/home-assistant/docker-base/pull/365)
- [home-assistant/docker-base PR #360 - Repository fork friendly distro Dockerfile updates (merged)](https://github.com/home-assistant/docker-base/pull/360)
- [home-assistant/core issue #178700 - raspberrypi5-64 arm64 image 0-byte /init (not riscv-related)](https://github.com/home-assistant/core/issues/178700)
- [fede2cr/riscv64-homeassistant (GitHub)](https://github.com/fede2cr/riscv64-homeassistant)
- [fede2/riscv64-homeassistant (Docker Hub)](https://hub.docker.com/r/fede2/riscv64-homeassistant)
- [Community forum: Support Risc-v 64 as host platform for haas](https://community.home-assistant.io/t/support-risc-v-64-as-host-platform-for-haas/507928)
- [Community forum: Home assistant core installation on risc-v](https://community.home-assistant.io/t/home-assistant-core-installation-on-risc-v/519399)
- [RISE RISC-V Runners: six weeks in (riseproject.dev, 2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members](https://riseproject.dev/)
- [pyca/cryptography issue #14460](https://github.com/pyca/cryptography/issues/14460)
- [openssl/openssl issue #28118](https://github.com/openssl/openssl/issues/28118)
- [openssl/openssl issue #30880](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl issue #29453](https://github.com/openssl/openssl/issues/29453)
- [openssl/openssl issue #28664](https://github.com/openssl/openssl/issues/28664)
- [openssl/openssl issue #25334](https://github.com/openssl/openssl/issues/25334)
- [python-cffi/cffi issue #233](https://github.com/python-cffi/cffi/issues/233)
- [numpy/numpy issue #30216](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy issue #32461](https://github.com/numpy/numpy/issues/32461)
- [numpy/numpy issue #32376](https://github.com/numpy/numpy/issues/32376)
- [numpy/numpy issue #26200](https://github.com/numpy/numpy/issues/26200)
- [python-pillow/Pillow issue #9603](https://github.com/python-pillow/Pillow/issues/9603)
- [python-pillow/Pillow issue #9462](https://github.com/python-pillow/Pillow/issues/9462)
- [protocolbuffers/protobuf issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549)
- [protocolbuffers/protobuf issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protocolbuffers/protobuf issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798)
- [grpc/grpc issue #41591](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc issue #37791](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc issue #35839](https://github.com/grpc/grpc/issues/35839)
- [PyPI: homeassistant package](https://pypi.org/pypi/homeassistant/2026.9.1/json)
- [Docker Hub: homeassistant/home-assistant](https://hub.docker.com/r/homeassistant/home-assistant)
- [Ubuntu package search (resolute)](https://packages.ubuntu.com/search?keywords=Home%20Assistant&suite=resolute)
- [Arch Linux RISC-V unofficial port](https://archriscv.felixc.at/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)