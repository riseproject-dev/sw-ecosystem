import json
import os

import pyoxigraph
from fastmcp import FastMCP

DB_PATH = os.environ.get("PROJECT_GRAPH_DB", "/app/project-graph")

store = pyoxigraph.Store(DB_PATH)
mcp = FastMCP("project-graph")


@mcp.tool()
def project_graph_query(query: str) -> str:
    """Execute a SPARQL 1.1 query against the project graph database.

    Returns JSON (SELECT/ASK) or N-Triples (CONSTRUCT/DESCRIBE).
    """
    results = store.query(query)
    if isinstance(results, bool):
        return json.dumps({"boolean": results})
    if isinstance(results, pyoxigraph.QuerySolutions):
        return results.serialize(format=pyoxigraph.QueryResultsFormat.JSON).decode()
    return results.serialize(format=pyoxigraph.RdfFormat.N_TRIPLES).decode()


if __name__ == "__main__":
    mcp.run(transport="stdio")
