# Stage 1: grab the oxigraph binary from the official image
FROM ghcr.io/oxigraph/oxigraph:latest AS oxigraph

# Stage 2: compile pg-collect, generate .nt data, build and optimize the DB
FROM rust:1-bookworm AS db-builder

COPY --from=oxigraph /usr/local/bin/oxigraph /usr/local/bin/oxigraph

RUN git clone --depth 1 https://github.com/packagegraph/platform.git /platform

WORKDIR /platform/etl/pg-collect

RUN cargo install --path .

# Ubuntu noble / amd64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://archive.ubuntu.com/ubuntu \
      --dist noble --component main \
      --arch amd64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-noble.nt

# Ubuntu noble (ports) / arm64, riscv64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://ports.ubuntu.com/ubuntu-ports \
      --dist noble --component main \
      --arch arm64 --arch riscv64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-ports-noble.nt

# PyPI
RUN --mount=type=bind,source=pypi-packages.txt,target=/pypi-packages.txt \
    pg-collect pypi \
      --packages-file /pypi-packages.txt \
      --max-depth 256 \
      --max-packages 100000 \
      -o /pypi.nt

# Conda / amd64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect conda \
      --subdir linux-64 \
      -o /conda-linux-amd64.nt
# Conda / arm64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect conda \
      --subdir linux-arm64 \
      -o /conda-linux-arm64.nt
# Conda / riscv64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect conda \
      --subdir linux-riscv64 \
      -o /conda-linux-riscv64.nt

RUN oxigraph load \
      --location /project-graph \
      --file /ubuntu-noble.nt \
      --file /ubuntu-ports-noble.nt \
      --file /pypi.nt \
      --file /conda-linux-amd64.nt \
      --file /conda-linux-arm64.nt \
      --file /conda-linux-riscv64.nt \
      --lenient

ARG GITHUB_TOKEN
RUN --mount=type=cache,target=/tmp/cache \
    bash -eux -o pipefail <<'EOF'

  # launch oxigraph server in the background
  oxigraph server --location /project-graph &
  OXIGRAPH_PID=$!
  # wait for the server to be ready
  until oxigraph info --location /project-graph; do sleep 1; done

  # Enrich the database with GitHub data
  pg-collect enrich-github \
    --endpoint http://localhost:7878/ \
    --github-token "${GITHUB_TOKEN}" \
    --cache-dir /tmp/cache \
    -o github.nt

  # Enrich the database with Repology data
  pg-collect enrich-repology \
    --endpoint http://localhost:7878/ \
    --cache-dir /tmp/cache \
    -o repology.nt

  # kill the oxigraph server
  kill $OXIGRAPH_PID
EOF

RUN oxigraph load \
      --location /project-graph \
      --file /github.nt \
      --file /repology.nt \
      --lenient

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
