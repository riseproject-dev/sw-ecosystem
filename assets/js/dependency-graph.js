/*
 * Renders <slug>.graph.json (see prompts/stack-report/stack-report.md, Artifact 4) as an
 * interactive dependency graph: a top-to-bottom layered DAG (dagre-d3 + d3 v5, both loaded via
 * CDN in _includes/dependency-graph.html -- no build step), with zoom/pan, click-a-node to open
 * its report/repo/home, hover to highlight neighbors, a search box (which can also focus a node's
 * ancestor+descendant subgraph), and a legend. A container's data-subset, when set, additionally
 * bounds the whole instance to one node's descendants (see descendantSubgraph below). The main/
 * root node ends up at the top of each rank, with its dependencies laid out in ranks below it,
 * mirroring conda-forge's DependencyGraph component.
 *
 * Loaded once per page; initializes every ".dependency-graph" container it finds.
 */
(function () {
  'use strict';

  var PALETTE = {
    green: '#3FA34D', blue: '#2F6FB0', yellow: '#E6B800',
    orange: '#E8730C', red: '#B5342A', grey: '#9E9E9E',
  };

  var LEGEND = [
    { color: 'green', label: 'upstream builds+tests+releases; optimized' },
    { color: 'blue', label: 'upstream builds+tests; mostly optimized' },
    { color: 'yellow', label: 'upstream builds; some optimized' },
    { color: 'orange', label: 'no upstream build, distributions only; no optimizations' },
    { color: 'red', label: 'not working' },
    { color: 'grey', label: 'unknown or N/A' },
  ];

  // ---- graph data structure (adjacency by edge id, so a node's incoming/outgoing edges are
  // O(1) to look up) ----------------------------------------------------------------------

  function buildGraphDataStructure(graphJson) {
    var nodeMap = {}, edgeMap = {};
    (graphJson.nodes || []).forEach(function (n) {
      nodeMap[n.id] = { data: n, incoming: [], outgoing: [] };
    });
    (graphJson.edges || []).forEach(function (e, i) {
      if (!nodeMap[e.source] || !nodeMap[e.target]) return;
      var edgeId = e.source + '->' + e.target + '#' + i;
      edgeMap[edgeId] = e;
      nodeMap[e.source].outgoing.push(edgeId);
      nodeMap[e.target].incoming.push(edgeId);
    });
    return { nodeMap: nodeMap, edgeMap: edgeMap, allNodeIds: Object.keys(nodeMap) };
  }

  function findAllAncestors(nodeId, ds) {
    var seen = new Set([nodeId]), queue = [nodeId], out = new Set();
    while (queue.length) {
      var cur = queue.shift();
      (ds.nodeMap[cur].incoming || []).forEach(function (eid) {
        var src = ds.edgeMap[eid].source;
        if (!seen.has(src)) { seen.add(src); out.add(src); queue.push(src); }
      });
    }
    return out;
  }

  function findAllDescendants(nodeId, ds) {
    var seen = new Set([nodeId]), queue = [nodeId], out = new Set();
    while (queue.length) {
      var cur = queue.shift();
      (ds.nodeMap[cur].outgoing || []).forEach(function (eid) {
        var tgt = ds.edgeMap[eid].target;
        if (!seen.has(tgt)) { seen.add(tgt); out.add(tgt); queue.push(tgt); }
      });
    }
    return out;
  }

  // True for a "runtime-dependency" relation, and (since stack-report graphs give `relation` as
  // free text -- see prompts/stack-report/stack-report.md) anything else that reads as purely
  // about runtime, e.g. not "build-and-runtime-dependency". Shared by edgeStyle (solid vs. dashed
  // stroke) and findDescendantsRuntimeOnlyBeyondRoot below, so "renders as a solid runtime edge"
  // and "counts as runtime for subset traversal" never disagree.
  function isRuntimeRelation(relation) {
    var r = (relation || '').toLowerCase();
    return r.indexOf('runtime') !== -1 && r.indexOf('build') === -1 && r.indexOf('test') === -1;
  }

  // Same BFS as findAllDescendants, except only rootId's own outgoing edges may be any relation --
  // every hop past that follows runtime-dependency edges only. Used for a per-project subset (see
  // descendantSubgraph below), so a direct dependency's own build/test tooling (a "dependency of a
  // dependency", several links removed from the project itself) never drags itself into view; the
  // runtime chain, which does end up in the project's own runtime footprint, is still followed
  // arbitrarily deep.
  function findDescendantsRuntimeOnlyBeyondRoot(rootId, ds) {
    var seen = new Set([rootId]), queue = [rootId], out = new Set();
    while (queue.length) {
      var cur = queue.shift();
      (ds.nodeMap[cur].outgoing || []).forEach(function (eid) {
        var e = ds.edgeMap[eid];
        if (cur !== rootId && !isRuntimeRelation(e.relation)) return;
        if (!seen.has(e.target)) { seen.add(e.target); out.add(e.target); queue.push(e.target); }
      });
    }
    return out;
  }

  // Rebuilds a graph data structure containing only `visible` node ids -- both nodeMap's own
  // incoming/outgoing lists and edgeMap are pruned to edges whose endpoints are both visible, so
  // callers (focusedSubgraph, descendantSubgraph below) never leak a dangling reference to a node
  // that got filtered out. `edgeFilter`, when given, can additionally drop an edge between two
  // visible nodes outright (used by descendantSubgraph to suppress indirect build/test edges whose
  // endpoints both happen to be visible via some other path).
  function restrictToVisible(visible, ds, edgeFilter) {
    function edgeVisible(eid) {
      var e = ds.edgeMap[eid];
      if (!visible.has(e.source) || !visible.has(e.target)) return false;
      return !edgeFilter || edgeFilter(e);
    }
    var nodeMap = {}, edgeMap = {};
    visible.forEach(function (id) {
      var n = ds.nodeMap[id];
      nodeMap[id] = {
        data: n.data,
        incoming: n.incoming.filter(edgeVisible),
        outgoing: n.outgoing.filter(edgeVisible),
      };
    });
    Object.keys(ds.edgeMap).forEach(function (eid) {
      if (edgeVisible(eid)) edgeMap[eid] = ds.edgeMap[eid];
    });
    return { nodeMap: nodeMap, edgeMap: edgeMap, allNodeIds: Array.from(visible) };
  }

  // A node's "focused subgraph" is itself plus every ancestor and descendant -- selecting a node
  // (via search; see doSearch below) zooms into just that context, mirroring conda-forge's
  // DependencyGraph component. Clicking a node in the graph instead opens its report/repo/home
  // directly (see the node click handler in draw()).
  function focusedSubgraph(nodeId, ds) {
    if (!nodeId || !ds.nodeMap[nodeId]) return ds;
    var ancestors = findAllAncestors(nodeId, ds);
    var descendants = findAllDescendants(nodeId, ds);
    var visible = new Set([nodeId].concat(Array.from(ancestors), Array.from(descendants)));
    return restrictToVisible(visible, ds);
  }

  // A node's "descendant subset" is itself plus every descendant, with ancestors excluded
  // entirely -- used (via data-subset; see init() below) to bound a per-project graph instance to
  // just what that project depends on, transitively. Unlike focusedSubgraph, this is not a
  // temporary zoom-in: it replaces the base graph the instance ever operates on (drawing,
  // search, and focus/reset all stay within it), so that e.g. a project depended on by hundreds
  // of others never pulls all of them onto that project's own page. Beyond the project's own
  // direct dependencies, only the runtime-dependency chain is included/rendered -- see
  // findDescendantsRuntimeOnlyBeyondRoot -- so a dependency's build/test tooling doesn't clutter
  // a project page it's several links removed from.
  function descendantSubgraph(nodeId, ds) {
    if (!nodeId || !ds.nodeMap[nodeId]) return ds;
    var descendants = findDescendantsRuntimeOnlyBeyondRoot(nodeId, ds);
    var visible = new Set([nodeId].concat(Array.from(descendants)));
    return restrictToVisible(visible, ds, function (e) {
      return e.source === nodeId || isRuntimeRelation(e.relation);
    });
  }

  // A node's `report` is baked in at generation time as a production URL, e.g.
  // "/sw-ecosystem/project-reports/<slug>.html" (see stack-report-workflow.js reportUrl(), or for
  // the shared project-dependency graph, _plugins/dependency_graph_generator.rb), or is null when
  // no per-project report exists (the click handler then falls back to repo/home).
  // A PR preview is served one level deeper, at ".../pr-preview/pr-<N>/stack-reports/..." or
  // ".../pr-preview/pr-<N>/project-reports/...", so a bare production link would incorrectly
  // point at the live site instead of the preview. Rewrite the baked-in site prefix to whatever
  // base path this page is actually being served under, detected from the page's own URL (which
  // itself lives under one of those same two directories), so the link is correct in both.
  function resolveReportUrl(reportPath) {
    if (!reportPath) return reportPath;
    var idx = reportPath.indexOf('/project-reports/');
    if (idx === -1) return reportPath;
    var m = /^(.*)\/(?:stack-reports|project-reports)\//.exec(window.location.pathname);
    var currentBase = m ? m[1] : '';
    return currentBase + reportPath.slice(idx);
  }

  function nodeClass(n) {
    var cls = 'dg-node dg-node-' + (n.color || 'grey');
    if (n.in_scope === false) cls += ' dg-node-external';
    return cls;
  }

  // Solid black = a hard runtime dependency. Dashed black = build/test-time only, or (for
  // stack-report graphs, whose `relation` is free text -- see prompts/stack-report/stack-report.md)
  // any other relation that isn't purely about runtime, e.g. "requires-to-be-useful" or
  // "build-and-runtime-dependency". Returned as an inline style string, not a CSS class, because
  // dagre-d3 applies an edge's `class` option to the outer <g class="edgePath">, not the <path>
  // that actually carries the stroke.
  function edgeStyle(relation) {
    return isRuntimeRelation(relation)
      ? 'stroke: #000; stroke-width: 1px; fill: none;'
      : 'stroke: #000; stroke-width: 1px; stroke-dasharray: 4,3; fill: none;';
  }
  var EDGE_ARROWHEAD_STYLE = 'fill: #000; stroke: #000;';

  function nodeTooltip(n) {
    var tip = n.name + ' - ' + (n.color || 'grey') + (n.criticality ? ' (' + n.criticality + ')' : '');
    if (n.release_provider && n.release_provider !== 'none') tip += '\nRelease: ' + n.release_provider;
    if (n.gap) tip += '\nGap: ' + n.gap;
    return tip;
  }

  // ---- dagre-d3 layout (a plain top-to-bottom layered DAG -- no per-product clustering, to
  // match conda-forge's DependencyGraph) ----------------------------------------------------

  // Re-run on every redraw (selection change, external-dependency toggle) since the visible node
  // set can change. dagre-d3's own `render()` performs the actual rank/position layout; this only
  // builds the graphlib.Graph it lays out.
  function buildDagreGraph(ds) {
    var g = new dagreD3.graphlib.Graph({ directed: true })
      .setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 70 })
      .setDefaultEdgeLabel(function () { return {}; });

    ds.allNodeIds.forEach(function (id) {
      var n = ds.nodeMap[id].data;
      g.setNode(id, { label: n.name, rx: 5, ry: 5, padding: 10, class: nodeClass(n) });
    });
    Object.keys(ds.edgeMap).forEach(function (eid) {
      var e = ds.edgeMap[eid];
      g.setEdge(e.source, e.target, {
        edgeId: eid,
        style: edgeStyle(e.relation),
        arrowheadStyle: EDGE_ARROWHEAD_STYLE,
      });
    });
    return g;
  }

  // ---- one graph instance per container ---------------------------------------------------

  function init(container) {
    var graphUrl = container.getAttribute('data-graph');
    if (!graphUrl) return;

    var wrap = document.createElement('div');
    wrap.className = 'dg-wrap';
    wrap.innerHTML =
      '<div class="dg-toolbar">' +
        '<div class="dg-search-wrap">' +
          '<input type="text" class="dg-search" placeholder="Search node...">' +
          '<div class="dg-search-results" hidden></div>' +
        '</div>' +
        '<button type="button" class="dg-reset" hidden>Reset view</button>' +
      '</div>' +
      '<div class="dg-canvas"><svg></svg></div>' +
      '<div class="dg-legend"></div>' +
      '<p class="dg-instructions">Arrows point from a node to what it depends on. Solid black = runtime ' +
      'dependency, dashed black = build/test-time (or other non-runtime) dependency. Scroll to zoom, drag to ' +
      'pan, click a node to open its report/repo/home, search for a node to focus its subgraph (click the ' +
      'background or Reset view to return), hover to highlight neighbors.</p>';
    container.appendChild(wrap);

    renderLegend(wrap.querySelector('.dg-legend'));

    var svg = d3.select(wrap.querySelector('svg'));
    var svgGroup = svg.append('g');
    var canvas = wrap.querySelector('.dg-canvas');
    var searchInput = wrap.querySelector('.dg-search');
    var searchResults = wrap.querySelector('.dg-search-results');
    var resetBtn = wrap.querySelector('.dg-reset');

    var zoomBehavior = d3.zoom().on('zoom', function () {
      svgGroup.attr('transform', d3.event.transform);
    });
    svg.call(zoomBehavior);
    svg.on('dblclick.zoom', null);

    fetch(graphUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (graphJson) {
        var fullDs = buildGraphDataStructure(graphJson);
        var subsetId = container.getAttribute('data-subset') || null;
        // baseDs, not fullDs, is what the rest of this instance (drawing, search, focus/reset)
        // ever operates on -- when data-subset is set, nodes outside that project's own
        // descendant tree (most of all, other projects that merely also depend on it) never
        // appear here, no matter what the user clicks or searches for.
        var baseDs = subsetId ? descendantSubgraph(subsetId, fullDs) : fullDs;
        var selected = container.getAttribute('data-focus') || null;
        if (selected && !baseDs.nodeMap[selected]) selected = null;
        if (selected) resetBtn.hidden = false;

        function fitToView(g) {
          var gw = g.graph().width || 100, gh = g.graph().height || 100;
          var cw = canvas.clientWidth || 600, ch = canvas.clientHeight || 500;
          var scale = Math.min(cw / gw, ch / gh, 1) * 0.9;
          var tx = (cw - gw * scale) / 2, ty = (ch - gh * scale) / 2;
          svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }

        function highlight(ds, nodeId) {
          if (!nodeId) {
            svgGroup.selectAll('g.node').style('opacity', 1);
            // Clear the inline opacity override entirely (not reset to 1) so the CSS baseline
            // opacity (.edgePath, dependency-graph.css) takes back over; setting it to 1 here
            // would leave every edge permanently at full opacity after the first hover.
            svgGroup.selectAll('g.edgePath').style('opacity', null);
            return;
          }
          var n = ds.nodeMap[nodeId];
          if (!n) return;
          var related = new Set([nodeId]);
          var relatedEdges = new Set();
          (n.incoming || []).forEach(function (eid) { relatedEdges.add(eid); related.add(ds.edgeMap[eid].source); });
          (n.outgoing || []).forEach(function (eid) { relatedEdges.add(eid); related.add(ds.edgeMap[eid].target); });
          svgGroup.selectAll('g.node').style('opacity', function (id) { return related.has(id) ? 1 : 0.15; });
          svgGroup.selectAll('g.edgePath').style('opacity', function () {
            var eid = d3.select(this).attr('data-edge-id');
            return relatedEdges.has(eid) ? 1 : 0.1;
          });
        }

        function draw() {
          var ds = focusedSubgraph(selected, baseDs);
          var g = buildDagreGraph(ds);

          svgGroup.selectAll('*').remove();
          var renderFn = new dagreD3.render();
          renderFn(svgGroup, g);

          // Correlate rendered edgePath groups back to our edge ids by render order (dagre-d3
          // renders g.edges() in order), so hover-highlight can look edges up by id.
          var edgeObjs = g.edges();
          svgGroup.selectAll('g.edgePath').each(function (d, i) {
            var edgeObj = edgeObjs[i];
            if (!edgeObj) return;
            var label = g.edge(edgeObj);
            d3.select(this).attr('data-edge-id', label.edgeId);
          });

          svgGroup.selectAll('g.node')
            .attr('data-node-id', function (id) { return id; })
            .style('cursor', 'pointer')
            .each(function (id) {
              d3.select(this).append('title').text(nodeTooltip(ds.nodeMap[id].data));
            })
            .on('mouseenter', function (id) { highlight(ds, id); })
            .on('mouseleave', function () { highlight(ds, null); })
            .on('click', function (id) {
              d3.event.stopPropagation();
              // Clicking a node opens a link, preferring the richest destination that exists: the
              // per-project report (only set when one actually exists), then the source
              // repository, then the homepage. A node with none stays inert rather than 404ing.
              // To focus a node's ancestor+descendant subgraph instead, use the search box.
              var n = ds.nodeMap[id].data;
              var url = n.report ? resolveReportUrl(n.report)
                      : n.repo ? n.repo
                      : n.home ? n.home
                      : null;
              if (url) window.open(url, '_blank');
            });

          fitToView(g);
        }

        svg.on('click', function () {
          if (d3.event.target === svg.node()) {
            selected = null;
            resetBtn.hidden = true;
            draw();
          }
        });

        function doSearch(term) {
          term = term.trim().toLowerCase();
          searchResults.innerHTML = '';
          if (!term) { searchResults.hidden = true; return; }
          var matches = baseDs.allNodeIds
            .filter(function (id) { return baseDs.nodeMap[id].data.name.toLowerCase().indexOf(term) !== -1; })
            .slice(0, 15);
          searchResults.hidden = matches.length === 0;
          matches.forEach(function (id) {
            var item = document.createElement('div');
            item.className = 'dg-search-item';
            item.textContent = baseDs.nodeMap[id].data.name;
            item.addEventListener('click', function () {
              selected = id;
              resetBtn.hidden = false;
              searchInput.value = '';
              searchResults.hidden = true;
              draw();
            });
            searchResults.appendChild(item);
          });
        }
        searchInput.addEventListener('input', function () { doSearch(searchInput.value); });
        document.addEventListener('click', function (evt) {
          if (!wrap.querySelector('.dg-search-wrap').contains(evt.target)) searchResults.hidden = true;
        });
        resetBtn.addEventListener('click', function () {
          selected = null;
          resetBtn.hidden = true;
          draw();
        });

        draw();
      })
      .catch(function (err) {
        wrap.querySelector('.dg-canvas').innerHTML =
          '<p class="dg-error">Could not load the dependency graph (' + (err && err.message ? err.message : err) + ').</p>';
      });
  }

  function renderLegend(el) {
    LEGEND.forEach(function (entry) {
      var item = document.createElement('span');
      item.className = 'dg-legend-item';
      var chip = document.createElement('span');
      chip.className = 'dg-legend-chip';
      chip.style.background = PALETTE[entry.color];
      item.appendChild(chip);
      item.appendChild(document.createTextNode(entry.label));
      el.appendChild(item);
    });
    var ext = document.createElement('span');
    ext.className = 'dg-legend-item';
    var chip2 = document.createElement('span');
    chip2.className = 'dg-legend-chip dg-legend-chip-external';
    ext.appendChild(chip2);
    ext.appendChild(document.createTextNode('external dependency (no report yet)'));
    el.appendChild(ext);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    Array.prototype.forEach.call(document.querySelectorAll('.dependency-graph'), init);
  });
})();
