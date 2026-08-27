# Stage 1: grab the oxigraph binary from the official image
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} ghcr.io/oxigraph/oxigraph:latest AS oxigraph

# Base: rust + oxigraph binary + pg-collect installed once. All collectors derive from this.
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} rust:1-bookworm AS pg-collect-base

COPY --from=oxigraph /usr/local/bin/oxigraph /usr/local/bin/oxigraph

ADD https://github.com/packagegraph/platform.git#main:etl/pg-collect /pg-collect
RUN cargo install --path /pg-collect

# ---------------------------------------------------------------------------
# Phase 1: independent collectors -- built in parallel by BuildKit.
# Each is pinned to the native build arch and uses an isolated cache mount.
# ---------------------------------------------------------------------------

# Ubuntu resolute (main) / amd64
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-ubuntu-main
RUN --mount=type=cache,target=/tmp/cache,id=cache-ubuntu-main \
    pg-collect deb-full \
      --repo https://archive.ubuntu.com/ubuntu \
      --dist resolute --component main \
      --arch amd64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-resolute.nt

# Ubuntu resolute (universe) / amd64
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-ubuntu-universe
RUN --mount=type=cache,target=/tmp/cache,id=cache-ubuntu-universe \
    pg-collect deb-full \
      --repo https://archive.ubuntu.com/ubuntu \
      --dist resolute --component universe \
      --arch amd64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-universe-resolute.nt

# Ubuntu resolute (main, ports) / arm64, riscv64
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-ubuntu-ports-main
RUN --mount=type=cache,target=/tmp/cache,id=cache-ubuntu-ports-main \
    pg-collect deb-full \
      --repo https://ports.ubuntu.com/ubuntu-ports \
      --dist resolute --component main \
      --arch arm64 --arch riscv64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-ports-resolute.nt

# Ubuntu resolute (universe, ports) / arm64, riscv64
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-ubuntu-ports-universe
RUN --mount=type=cache,target=/tmp/cache,id=cache-ubuntu-ports-universe \
    pg-collect deb-full \
      --repo https://ports.ubuntu.com/ubuntu-ports \
      --dist resolute --component universe \
      --arch arm64 --arch riscv64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-ports-universe-resolute.nt

# PyPI
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-pypi
RUN --mount=type=bind,source=pypi-packages.txt,target=/pypi-packages.txt \
    --mount=type=cache,target=/tmp/cache,id=cache-pypi \
    pg-collect pypi \
      --packages-file /pypi-packages.txt \
      --max-depth 256 \
      --max-packages 100000 \
      --cache-dir /tmp/cache \
      -o /pypi.nt

# Maven
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS collect-maven
RUN --mount=type=bind,source=maven-packages.txt,target=/maven-packages.txt \
    --mount=type=cache,target=/tmp/cache,id=cache-maven \
    pg-collect maven \
      --packages-file /maven-packages.txt \
      --max-depth 256 \
      --max-packages 100000 \
      --cache-dir /tmp/cache \
      -o /maven.nt

# ---------------------------------------------------------------------------
# Phase 1 convergence: load all collected .nt files into the database.
# ---------------------------------------------------------------------------
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} pg-collect-base AS db-load-1
COPY --from=collect-ubuntu-main            /ubuntu-resolute.nt                 /ubuntu-resolute.nt
COPY --from=collect-ubuntu-universe        /ubuntu-universe-resolute.nt        /ubuntu-universe-resolute.nt
COPY --from=collect-ubuntu-ports-main      /ubuntu-ports-resolute.nt           /ubuntu-ports-resolute.nt
COPY --from=collect-ubuntu-ports-universe  /ubuntu-ports-universe-resolute.nt  /ubuntu-ports-universe-resolute.nt
COPY --from=collect-pypi                   /pypi.nt                         /pypi.nt
COPY --from=collect-maven                  /maven.nt                        /maven.nt
RUN oxigraph load \
      --location /project-graph \
      --file /ubuntu-resolute.nt \
      --file /ubuntu-universe-resolute.nt \
      --file /ubuntu-ports-resolute.nt \
      --file /ubuntu-ports-universe-resolute.nt \
      --file /pypi.nt \
      --file /maven.nt \
      --lenient

# ---------------------------------------------------------------------------
# Phase 2: enrichers -- built in parallel, each queries its own oxigraph server
# against the DB from db-load-1.
# ---------------------------------------------------------------------------

## FIXME: removing enrichement for now, it's taking too long

# # GitHub enrichment
# ARG BUILDARCH
# FROM --platform=linux/${BUILDARCH} db-load-1 AS enrich-github
# RUN --mount=type=cache,target=/tmp/cache,id=cache-github \
#     --mount=type=secret,id=GITHUB_TOKEN \
#     bash -eux -o pipefail <<'EOF'

#   # launch oxigraph server in the background
#   oxigraph serve --location /project-graph &
#   OXIGRAPH_PID=$!
#   # wait for the server to be ready
#   # until oxigraph info --location /project-graph; do sleep 1; done
#   sleep 5

#   # Enrich the database with GitHub data
#   pg-collect enrich-github \
#     --endpoint http://localhost:7878/ \
#     --github-token "$(cat /run/secrets/GITHUB_TOKEN)" \
#     --cache-dir /tmp/cache \
#     -o /github.nt

#   # kill the oxigraph server
#   kill $OXIGRAPH_PID || true
# EOF

# # Repology enrichment
# ARG BUILDARCH
# FROM --platform=linux/${BUILDARCH} db-load-1 AS enrich-repology
# RUN --mount=type=cache,target=/tmp/cache,id=cache-repology \
#     bash -eux -o pipefail <<'EOF'

#   # launch oxigraph server in the background
#   oxigraph serve --location /project-graph &
#   OXIGRAPH_PID=$!
#   # wait for the server to be ready
#   # until oxigraph info --location /project-graph; do sleep 1; done
#   sleep 5

#   # Enrich the database with Repology data
#   pg-collect enrich-repology \
#     --endpoint http://localhost:7878/ \
#     --cache-dir /tmp/cache \
#     -o /repology.nt

#   # kill the oxigraph server
#   kill $OXIGRAPH_PID || true
# EOF

# ---------------------------------------------------------------------------
# Phase 2 convergence: load enrichment data and optimize the final DB.
# Keeps the stage name `db-builder` so the final image's COPY is unchanged.
# ---------------------------------------------------------------------------
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} db-load-1 AS db-builder

# COPY --from=enrich-github   /github.nt   /github.nt
# COPY --from=enrich-repology /repology.nt /repology.nt
# RUN oxigraph load \
#       --location /project-graph \
#       --file /github.nt \
#       --file /repology.nt \
#       --lenient

RUN oxigraph optimize --location /project-graph

# Stage 3: build Python venv
FROM python:3.12-slim AS py-builder

COPY requirements.txt .
RUN python -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# Final image: Python MCP server with pyoxigraph reading the pre-built database
FROM python:3.12-slim

COPY --from=db-builder /project-graph /app/project-graph
COPY --from=py-builder /venv /venv
COPY server.py /app/server.py

ENV PROJECT_GRAPH_DB=/app/project-graph
CMD ["/venv/bin/python", "/app/server.py"]
