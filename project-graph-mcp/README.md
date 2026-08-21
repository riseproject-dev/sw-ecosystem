# project-graph-mcp

A SPARQL query interface over the sw-ecosystem project graph, served as an MCP tool via stdio.

The container exposes one tool: `project_graph_query(query: str)`. Pass any SPARQL 1.1 query; it returns JSON (SELECT/ASK) or N-Triples (CONSTRUCT/DESCRIBE).

## Prerequisites

Docker must be installed and running.

## Claude Code

```bash
claude mcp add project-graph -- docker run -i --rm ghcr.io/riseproject-dev/sw-ecosystem/project-graph-mcp:latest
```

Restart Claude Code. The `project_graph_query` tool is now available in every session.

To remove it:

```bash
claude mcp remove project-graph
```

## Codex

Add the following to `~/.codex/config.toml`:

```toml
[mcp_servers.project-graph]
command = "docker"
args = ["run", "-i", "--rm", "ghcr.io/riseproject-dev/sw-ecosystem/project-graph-mcp:latest"]
```

Restart Codex. The `project_graph_query` tool is available immediately.

## Gemini CLI

Add the following to `~/.gemini/settings.json` (create the file if it does not exist):

```json
{
  "mcpServers": {
    "project-graph": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/riseproject-dev/sw-ecosystem/project-graph-mcp:latest"]
    }
  }
}
```

Restart Gemini CLI. The `project-graph_project_graph_query` tool is available immediately.

## Example query

+Returns the names of all packages that `postgresql` (Debian Trixie, amd64) transitively depends on.

```sparql
PREFIX deb: <https://purl.org/packagegraph/ontology/deb#>
PREFIX core: <https://purl.org/packagegraph/ontology/core#>

SELECT DISTINCT ?depName WHERE {
  <https://packagegraph.github.io/d/pkg/debian/trixie/amd64/postgresql/17%2B278>
      deb:debDepends+ ?dep .
  ?dep core:packageName ?depName .
}
```
