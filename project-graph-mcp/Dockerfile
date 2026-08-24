# Stage 1: grab the oxigraph binary from the official image
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} ghcr.io/oxigraph/oxigraph:latest AS oxigraph

# Stage 2: compile pg-collect, generate .nt data, build and optimize the DB
ARG BUILDARCH
FROM --platform=linux/${BUILDARCH} rust:1-bookworm AS db-builder

COPY --from=oxigraph /usr/local/bin/oxigraph /usr/local/bin/oxigraph

ADD https://github.com/packagegraph/platform.git#main:etl/pg-collect /pg-collect
RUN cargo install --path /pg-collect

# Ubuntu noble (main) / amd64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://archive.ubuntu.com/ubuntu \
      --dist noble --component main \
      --arch amd64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-noble.nt

# Ubuntu noble (universe) / amd64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://archive.ubuntu.com/ubuntu \
      --dist noble --component universe \
      --arch amd64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-universe-noble.nt

# Ubuntu noble (main, ports) / arm64, riscv64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://ports.ubuntu.com/ubuntu-ports \
      --dist noble --component main \
      --arch arm64 --arch riscv64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-ports-noble.nt

# Ubuntu noble (universe, ports) / arm64, riscv64
RUN --mount=type=cache,target=/tmp/cache \
    pg-collect deb-full \
      --repo https://ports.ubuntu.com/ubuntu-ports \
      --dist noble --component universe \
      --arch arm64 --arch riscv64 \
      --with-sources --with-salsa \
      --cache-dir /tmp/cache \
      -o /ubuntu-ports-universe-noble.nt

# PyPI
RUN --mount=type=bind,source=pypi-packages.txt,target=/pypi-packages.txt \
    pg-collect pypi \
      --packages-file /pypi-packages.txt \
      --max-depth 256 \
      --max-packages 100000 \
      --cache-dir /tmp/cache \
      -o /pypi.nt

# Maven
RUN --mount=type=bind,source=maven-packages.txt,target=/maven-packages.txt \
    pg-collect maven \
      --packages-file /maven-packages.txt \
      --max-depth 256 \
      --max-packages 100000 \
      --cache-dir /tmp/cache \
      -o /maven.nt

RUN oxigraph load \
      --location /project-graph \
      --file /ubuntu-noble.nt \
      --file /ubuntu-universe-noble.nt \
      --file /ubuntu-ports-noble.nt \
      --file /ubuntu-ports-universe-noble.nt \
      --file /pypi.nt \
      --file /maven.nt \
      --lenient

RUN --mount=type=cache,target=/tmp/cache \
    --mount=type=secret,id=GITHUB_TOKEN \
    bash -eux -o pipefail <<'EOF'

  # launch oxigraph server in the background
  oxigraph serve --location /project-graph &
  OXIGRAPH_PID=$!
  # wait for the server to be ready
  # until oxigraph info --location /project-graph; do sleep 1; done
  sleep 5

  # Enrich the database with GitHub data
  pg-collect enrich-github \
    --endpoint http://localhost:7878/ \
    --github-token "$(cat /run/secrets/GITHUB_TOKEN)" \
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
