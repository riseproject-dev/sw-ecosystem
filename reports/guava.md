---
title: guava
---

# guava

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for guava<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Google Guava](https://guava.dev/) is Google's core Java utility library, covering collections, caching, I/O, hashing, concurrency helpers, and string processing. It is distributed as two Maven artifacts: a JRE flavor (JDK 8+) and an Android flavor (Android API 24+). Both are architecture-neutral JARs with no native code.

Governance is unilateral. The [google/guava](https://github.com/google/guava) GitHub repository is a read-only mirror of Google's internal monorepo. Pull requests cannot be merged directly; Google engineers apply changes internally and sync them to GitHub. Contributors must sign the Google CLA. License is Apache 2.0.

There is no external foundation membership, no MAINTAINERS or CODEOWNERS file, and no formal process for community contributors to influence roadmap. Dominant committer is Chris Povirk (`cpovirk`, Google), responsible for 24 of the last 30 commits. Secondary committer is Kurt Alfred Kluever (`kluever`, Google). Patrick Strawderman (`kilink`, Netflix) is an occasional external contributor.

The project has no tier policy for new platform ports and no stated position on RISC-V, because portability is inherited entirely from the JVM. No architecture-specific porting work is tracked or planned.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (all dates) | Zero riscv64 commits, issues, or PRs filed against google/guava | [github.com/google/guava](https://github.com/google/guava), all search queries returned 0 results |

There is no RISC-V port history for Guava. The concept does not apply: Guava has no native code and requires no porting. Wherever a JDK runs on riscv64, Guava runs unchanged. No contributor from any organization has filed a RISC-V-related issue or PR.

---

## 3. Upstream Support Tier

Guava has no formal tier policy for processor architectures. Support is implicitly universal: any architecture running JDK 8 or later can use Guava without modification.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes | No | No |
| Release-blocking tests | Yes (x86) | No | No |
| Official binary (JAR) | Yes (arch-neutral) | Yes (same JAR) | Yes (same JAR) |
| Architecture-specific code | Yes (Unsafe fast path) | Yes (Unsafe fast path) | No (fallback only) |

No architecture receives a "supported" designation distinct from any other. The only observable differentiation is that CI runs on x86_64 only, which means riscv64 functional correctness depends entirely on the JVM's bytecode correctness guarantee rather than upstream test execution.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Guava has no JIT, no GC barriers, no crypto implementations, and no assembly. It is pure Java. The entire repository contains zero `.c`, `.h`, `.S`, or `.cpp` files.

Two files contain architecture-conditional logic in Java via JVM introspection:

**LittleEndianByteArray.java**

The method `tryToUseUnsafe()` checks `sun.os.arch` against an explicit allowlist:

```java
if (Objects.equals(arch, "amd64") || Objects.equals(arch, "aarch64")) {
    return ByteOrder.nativeOrder().equals(ByteOrder.LITTLE_ENDIAN)
        ? UnsafeByteArray.UNSAFE_LITTLE_ENDIAN
        : UnsafeByteArray.UNSAFE_BIG_ENDIAN;
}
```

`riscv64` is not in this allowlist. On riscv64, the code falls back to `JavaLittleEndianBytes.INSTANCE`, a pure-Java mask-and-shift byte reader. The comment in the source states the optimization is restricted to "platforms we specifically know to work" because `sun.misc.Unsafe` causes crashes on 32-bit Android. On JDK 9+, a VarHandle path takes priority over both the Unsafe path and the pure-Java fallback, closing this gap on any JVM that supports VarHandles.

**UnsignedBytes.java**

Gates the `UnsafeComparator` on `sun.arch.data.model == "64"`. This check is architecture-neutral and passes on riscv64. The Unsafe-based 8-byte comparator is available on riscv64 through this path.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native / JNI code | None | None | None |
| `LittleEndianByteArray` Unsafe fast path | Yes (explicit allowlist) | Yes (explicit allowlist) | No -- Java fallback; VarHandle path available on JDK 9+ |
| `UnsignedBytes` Unsafe comparator | Yes | Yes | Yes (64-bit JVM check passes) |
| VarHandle path (JDK 9+) | Yes | Yes | Yes |
| All other Guava functionality | Full | Full | Full |

No ISA extensions are used or relevant. riscv64 receives full functional correctness from the pure-Java fallback paths on all JDK versions, and closes the `LittleEndianByteArray` performance gap on JDK 9+.

---

## 5. Build System, Cross-Compilation, and Toolchain

Build system: Maven only. No CMake, Autoconf, Makefile, or native compilation of any kind.

Build commands from CI:

```bash
./mvnw -B -ntp -Dtoolchain.skip install -U -DskipTests=true -f pom.xml
./mvnw -B -ntp -P!standard-with-extra-repos -Dtoolchain.skip verify -U \
  -Dmaven.javadoc.skip=true -Dsurefire.toolchain.version=<java-version> -f pom.xml
```

To build or test on riscv64, the only requirement is a riscv64 JDK >= 8. No cross-compilation toolchain, no QEMU, no architecture flags, and no `-D` overrides are needed. The Maven build is identical on all platforms.

No riscv64-specific build documentation exists because none is needed.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. riscv64 has full functional coverage of all Guava APIs.

**Performance gaps:**

| Component | amd64 | arm64 | riscv64 | Gap description |
|---|---|---|---|---|
| `LittleEndianByteArray` (hashing internals) | Single `Unsafe.getLong()` call | Single `Unsafe.getLong()` call | Byte-by-byte mask-and-shift (JDK 8); VarHandle single read (JDK 9+) | Minor throughput delta in hashing on JDK 8 only |
| `UnsignedBytes` comparator | Unsafe 8-byte compare | Unsafe 8-byte compare | Unsafe 8-byte compare | No gap |
| All other components | Full | Full | Full | No gap |

**Security hardening gaps:** None. Guava has no platform-specific security code. Crypto is delegated entirely to `javax.crypto.Mac` via the JVM security provider (SunJCE), which is identical across architectures.

**Floating-point:** Issue [#2834](https://github.com/google/guava/issues/2834) ("Sortable floating point to integer", filed 2017, open) concerns floating-point semantics but is not architecture-specific. No riscv64 floating-point issues exist.

**NaN semantics:** No riscv64-specific NaN issues found.

---

## 7. CI/CD Infrastructure

Guava's CI is defined in two workflow files:

- [`.github/workflows/ci.yml`](https://github.com/google/guava/blob/master/.github/workflows/ci.yml): build and test matrix
- [`.github/workflows/scorecard.yml`](https://github.com/google/guava/blob/master/.github/workflows/scorecard.yml): OSSF supply-chain security scan only; does not build or test Guava

The CI matrix in `ci.yml`:
- Runners: `ubuntu-latest` (x86_64) and `windows-latest`
- JDK versions: 8, 11, 17, 25 on Ubuntu; 25 on Windows
- Maven pom files: `pom.xml` (JRE) and `android/pom.xml` (Android flavor)

The string "riscv" does not appear anywhere in either workflow file. No QEMU step, no arm runner, no architecture matrix axis.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (`ubuntu-latest`) | No | No |
| Tests executed upstream | Yes | No | No |
| RISE-provided runner | No | No | No |
| QEMU emulation | No | No | No |

RISE has no involvement in Guava's CI. Google is a RISE Premier Member, but no RISE activity targeting google/guava has been identified.

---

## 8. Distribution and Release Status

Guava distributes exclusively via [Maven Central](https://central.sonatype.com/artifact/com.google.guava/guava). Artifacts are architecture-neutral JARs (`arch: all`). No GitHub Release binary assets exist; the releases page for v33.7.1, v33.7.0, v33.6.0, v33.5.0, and v33.4.8 each have zero attached assets.

Latest upstream release: 33.7.1.

**Linux distribution packages:**

| Distribution | Package | Version | riscv64 |
|---|---|---|---|
| Ubuntu 24.04 Noble | `libguava-java` | 32.0.1-1 | Yes (arch: all) |
| Ubuntu 24.04 Noble | `libguava-testlib-java` | 32.0.1-1 | Yes (arch: all) |
| Debian sid | `libguava-java` | 32.0.1-1 | Yes (arch: all) |
| Arch Linux | Not packaged standalone | N/A | Unknown |

Note: `gap-guava-bin` (version 3.18+ds-1, Ubuntu Noble) explicitly lists riscv64 as a supported architecture, but this is the GAP computer algebra system's coding-theory library, an entirely unrelated software project. It is not Google Guava.

The Debian `guava` source package was removed in 2014. The current `libguava-java` package originates from the `libguava-java` source package.

Debian packages version 32.0.1-1 against upstream 33.7.1 -- an update is flagged as high priority in the Debian tracker.

To use Guava on riscv64, a user needs only a riscv64 JDK and either a Maven dependency declaration or the arch-neutral JAR from Maven Central. No riscv64-specific build step is required.

---

## 9. Dependencies

All of Guava's direct runtime dependencies are pure Java with no native code.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| [failureaccess 1.0.3](https://github.com/google/guava) | `ListenableFuture` completion helper, co-published with Guava | Green | Green | Green (arch-neutral JAR) | None |
| listenablefuture (empty stub) | Sentinel artifact to avoid classpath conflict | Green | N/A | Green | None |
| [jspecify 1.0.1](https://github.com/jspecify/jspecify) | Nullness annotations (`@Nullable`, `@NonNull`) | Green | N/A (annotations only) | Green (arch-neutral JAR) | None |
| [error_prone_annotations 2.50.0](https://github.com/google/error-prone) | Compile-time annotations (`@Immutable`, `@CheckReturnValue`) | Green | N/A (annotations only) | Green (arch-neutral JAR) | None |
| [j2objc-annotations 3.1](https://github.com/google/j2objc) | Objective-C interop annotations, no-op on JVM/Linux | Green | N/A (no-op) | Green | None |

**Critical indirect dependency: OpenJDK**

The only platform-sensitive dependency is the JVM itself. OpenJDK received a production-quality riscv64 port in JDK 19 via [JEP 422](https://openjdk.org/jeps/422) (released September 2022), including full C1/C2 JIT support. Eclipse Adoptium runs native riscv64 tests on Scaleway EM-RV1 bare metal via RISE partnership (announced September 2024). Temurin JDK 21 LTS is confirmed available for riscv64. JDK 17 riscv64 Temurin binary availability is [NEEDS VERIFICATION]. JDK 11 has no riscv64 Temurin binary. Debian sid ships openjdk-21 riscv64 (EA milestone build).

See `reports/openjdk.md` for the full OpenJDK riscv64 status assessment.

None of Guava's other direct dependencies appear in `scope.yml`.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist in the google/guava tracker. All searches for "riscv", "riscv64", and "risc-v" across issues, PRs, and commits returned zero results.

Architecture-neutral open issues that may affect riscv64 identically to all other platforms:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7140](https://github.com/google/guava/issues/7140) | `Suppliers.memoize()` thread pinning | Open (2024-04-08) | Low | Virtual thread concern; architecture-neutral |
| [#6205](https://github.com/google/guava/issues/6205) | Lock contention in `RateLimiter#acquire` | Open (2022) | Low | `synchronized` overhead; architecture-neutral |
| [#2834](https://github.com/google/guava/issues/2834) | Sortable floating point to integer | Open (2017) | Low | Not architecture-specific |
| [#5271](https://github.com/google/guava/issues/5271) | ppc64le Travis CI support | Open (2020) | Low | Architecture CI expansion; shows maintainers have not prioritized non-x86 CI |

No correctness bugs affecting riscv64 specifically.

---

## 12. Objections and Upstream Blockers

**No objections or blockers exist for riscv64 functional support.** Guava runs on riscv64 today without any changes.

The only observable gap is the `LittleEndianByteArray` Unsafe allowlist excluding riscv64. This is not an objection; it is a conservative safety measure. Adding riscv64 to the allowlist is a straightforward change requiring a patch and upstream review. The precedent (aarch64 was added after x86 initially) shows the maintainers will accept such additions with evidence that the platform behaves correctly.

The open issue [#5271](https://github.com/google/guava/issues/5271) (ppc64le CI, open since 2020 with no merge) indicates that architecture-specific CI additions move slowly. An riscv64 CI request would likely face the same trajectory: technically unblocked but deprioritized against Google's internal roadmap.

Organizational blocker: the read-only mirror model means all changes require internal Google buy-in and internal commit, then external sync. There is no mechanism for an external party to merge a PR directly.

---

## 13. Investment Analysis

Google is a RISE Premier Member. No RISE-funded work targeting google/guava specifically has been identified, because none is needed for functional correctness.

### 13.1 Functional Enablement

No functional enablement work is required. Guava runs on riscv64 today via any riscv64 JDK.

### 13.2 Performance Optimization

One performance gap exists: `LittleEndianByteArray` uses a byte-by-byte fallback on riscv64 instead of the `Unsafe.getLong()` single-instruction path used on amd64 and aarch64. This affects hashing throughput (Murmur3, SipHash, etc.) on JDK 8. On JDK 9+, the VarHandle path closes this gap automatically.

The fix is to add `riscv64` to the arch allowlist in `LittleEndianByteArray.java`. The patch is a 1-line change. The effort is in validating correct behavior (unit tests pass, no Unsafe crash on riscv64 JDK) and shepherding it through Google's internal review process.

### 13.3 CI/CD Infrastructure

Guava has no riscv64 CI. Adding it would require either a GitHub-hosted riscv64 runner (not yet offered by GitHub as of the research date) or a self-hosted runner. RISE operates RISC-V CI infrastructure and could provide a runner for this purpose. However, given that Guava is a pure-Java library and any regression would originate in the JVM rather than Guava itself, the value of dedicated riscv64 CI for Guava is lower than for native-code projects.

### 13.4 Ecosystem Enablement

Not applicable. Guava is a library dependency, not a platform with a dependent ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Add riscv64 to `LittleEndianByteArray` Unsafe allowlist; validate on riscv64 JDK 8 | 0.5 | Qualcomm or RISE contributor, requires Google internal merge | Low |
| CI/CD | Add riscv64 runner to `.github/workflows/ci.yml`; coordinate with RISE for hardware | 1 | RISE + Google, requires Google CI infrastructure approval | Low |
| Dependency | Track OpenJDK riscv64 JDK 17/21 Temurin availability | 0 (monitoring only) | RISE / Adoptium | Medium |

Total estimated investment: under 2 person-weeks. No investment is required for functional correctness. The performance optimization is optional and low-impact except in hashing-intensive workloads on JDK 8.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/guava GitHub repository](https://github.com/google/guava)
- [Guava homepage](https://guava.dev/)
- [Guava CI workflow .github/workflows/ci.yml](https://github.com/google/guava/blob/master/.github/workflows/ci.yml)
- [Guava scorecard workflow .github/workflows/scorecard.yml](https://github.com/google/guava/blob/master/.github/workflows/scorecard.yml)
- [LittleEndianByteArray.java (arch allowlist)](https://github.com/google/guava/blob/master/guava/src/com/google/common/hash/LittleEndianByteArray.java)
- [UnsignedBytes.java (64-bit Unsafe comparator)](https://github.com/google/guava/blob/master/guava/src/com/google/common/primitives/UnsignedBytes.java)
- [JEP 422: Linux/RISC-V Port](https://openjdk.org/jeps/422)
- [Ubuntu 24.04 Noble -- libguava-java package](https://packages.ubuntu.com/noble/libguava-java)
- [Ubuntu 24.04 Noble -- gap-guava-bin package (unrelated to Google Guava)](https://packages.ubuntu.com/noble/gap-guava-bin)
- [Debian tracker -- libguava-java](https://tracker.debian.org/pkg/libguava-java)
- [Maven Central -- com.google.guava:guava](https://central.sonatype.com/artifact/com.google.guava/guava)
- [RISE Project -- Eclipse Adoptium partnership announcement](https://riseproject.dev/)
- [Guava issue #5271 -- ppc64le CI support](https://github.com/google/guava/issues/5271)
- [Guava issue #7140 -- Suppliers.memoize() thread pinning](https://github.com/google/guava/issues/7140)
- [Guava issue #6205 -- RateLimiter lock contention](https://github.com/google/guava/issues/6205)
- [Guava issue #2834 -- Sortable floating point to integer](https://github.com/google/guava/issues/2834)