/*
 * Renders <slug>.graph.json (see prompts/stack-report/stack-report.md, Artifact 4) as an
 * interactive dependency graph: a d3-force layout (d3 v5, loaded via CDN in
 * _includes/dependency-graph.html -- no build step), with zoom/pan, click-a-node to open its
 * report/repo/home, hover to highlight neighbors, a search box (which can also focus a node's
 * ancestor+descendant subgraph), and a legend.
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

  // A node's "focused subgraph" is itself plus every ancestor and descendant -- selecting a node
  // (via search; see doSearch below) zooms into just that context, mirroring conda-forge's
  // DependencyGraph component. Clicking a node in the graph instead opens its report/repo/home
  // directly (see the node click handler in draw()).
  function focusedSubgraph(nodeId, ds) {
    if (!nodeId || !ds.nodeMap[nodeId]) return ds;
    var ancestors = findAllAncestors(nodeId, ds);
    var descendants = findAllDescendants(nodeId, ds);
    var visible = new Set([nodeId].concat(Array.from(ancestors), Array.from(descendants)));
    var nodeMap = {}, edgeMap = {};
    visible.forEach(function (id) {
      var n = ds.nodeMap[id];
      nodeMap[id] = {
        data: n.data,
        incoming: n.incoming.filter(function (eid) { return visible.has(ds.edgeMap[eid].source); }),
        outgoing: n.outgoing.filter(function (eid) { return visible.has(ds.edgeMap[eid].target); }),
      };
    });
    Object.keys(ds.edgeMap).forEach(function (eid) {
      var e = ds.edgeMap[eid];
      if (visible.has(e.source) && visible.has(e.target)) edgeMap[eid] = e;
    });
    return { nodeMap: nodeMap, edgeMap: edgeMap, allNodeIds: Array.from(visible) };
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

  // Solid = a hard runtime dependency. Dashed = build/test-time only, or (for stack-report graphs,
  // whose `relation` is free text -- see prompts/stack-report/stack-report.md) any other relation
  // that isn't purely about runtime, e.g. "requires-to-be-useful" or "build-and-runtime-dependency".
  function edgeClass(relation) {
    var r = (relation || '').toLowerCase();
    var isRuntimeOnly = r.indexOf('runtime') !== -1 && r.indexOf('build') === -1 && r.indexOf('test') === -1;
    return 'dg-edge ' + (isRuntimeOnly ? 'dg-edge-runtime' : 'dg-edge-other');
  }

  function nodeTooltip(n) {
    var tip = n.name + ' - ' + (n.color || 'grey') + (n.criticality ? ' (' + n.criticality + ')' : '');
    if (n.release_provider && n.release_provider !== 'none') tip += '\nRelease: ' + n.release_provider;
    if (n.gap) tip += '\nGap: ' + n.gap;
    return tip;
  }

  // ---- node sizing (a plain <canvas> text measurement, since there is no DOM layout pass
  // before the force simulation needs a collision radius for every node) --------------------

  var NODE_FONT = '12px Helvetica, Arial, sans-serif';
  var NODE_H = 30;
  var NODE_PAD_X = 12;
  var measureCanvas = null;
  function textWidth(text) {
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    var ctx = measureCanvas.getContext('2d');
    ctx.font = NODE_FONT;
    return ctx.measureText(text).width;
  }
  function nodeSize(name) {
    return { w: Math.max(textWidth(name) + NODE_PAD_X * 2, 44), h: NODE_H };
  }

  // Where a line from a node's center towards (x2,y2) exits that node's rectangle -- used so an
  // edge's arrowhead lands on the target's border instead of being buried at its center.
  function clipToRectBorder(x1, y1, x2, y2, w, h) {
    var dx = x1 - x2, dy = y1 - y2;
    if (dx === 0 && dy === 0) return { x: x2, y: y2 };
    var hw = w / 2, hh = h / 2;
    var scale = Math.min(
      dx !== 0 ? hw / Math.abs(dx) : Infinity,
      dy !== 0 ? hh / Math.abs(dy) : Infinity
    );
    return { x: x2 + dx * scale, y: y2 + dy * scale };
  }

  // Runs a d3-force simulation (link + charge + collision + weak centering) to completion
  // synchronously (a fixed number of ticks, no animation), then returns plain layout data --
  // node positions/sizes and resolved links -- for the caller to draw. Re-run on every redraw
  // (selection change, external-dependency toggle) since the visible node set can change.
  function buildForceLayout(ds, showExternal) {
    var visibleIds = ds.allNodeIds.filter(function (id) {
      var n = ds.nodeMap[id].data;
      return showExternal || n.in_scope !== false;
    });
    var visibleSet = new Set(visibleIds);

    var nodes = visibleIds.map(function (id) {
      var n = ds.nodeMap[id].data;
      var size = nodeSize(n.name);
      return { id: id, data: n, w: size.w, h: size.h };
    });

    var links = [];
    var connected = new Set();
    Object.keys(ds.edgeMap).forEach(function (eid) {
      var e = ds.edgeMap[eid];
      if (!visibleSet.has(e.source) || !visibleSet.has(e.target)) return;
      links.push({ edgeId: eid, relation: e.relation, source: e.source, target: e.target });
      connected.add(e.source);
      connected.add(e.target);
    });

    // A node with no edges at all (rare, but real -- e.g. a leaf with no discovered
    // dependencies) has nothing else pulling it back in, so charge repulsion alone flings it
    // arbitrarily far from everything else. Only isolated nodes get this pull-to-center spring,
    // so it never fights "spread out more" for anything that actually has a link.
    function isolatedStrength(d) { return connected.has(d.id) ? 0 : 0.3; }

    var simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(130).strength(0.15))
      .force('charge', d3.forceManyBody().strength(-520))
      .force('collide', d3.forceCollide().radius(function (d) { return Math.hypot(d.w, d.h) / 2 + 16; }).iterations(2))
      .force('center', d3.forceCenter(0, 0))
      .force('x', d3.forceX(0).strength(isolatedStrength))
      .force('y', d3.forceY(0).strength(isolatedStrength))
      .stop();
    for (var i = 0; i < 400; i++) simulation.tick();

    return { nodes: nodes, links: links };
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
        '<label class="dg-toggle"><input type="checkbox" class="dg-toggle-external"> Show external dependencies</label>' +
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
    var defs = svg.append('defs');
    // A <marker>'s fill/opacity is fixed by its own definition, not by the CSS opacity of the
    // <line> that references it via marker-end -- so a hovered/highlighted edge (whose line the
    // "highlight" function below brings to full opacity) needs a second, fully-opaque marker to
    // switch to, or its arrowhead stays faint even while the line itself is highlighted.
    function defineArrowhead(id, fill, fillOpacity) {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 9)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', fill)
        .attr('fill-opacity', fillOpacity);
    }
    defineArrowhead('dg-arrowhead', '#000', 0.7);
    defineArrowhead('dg-arrowhead-active', '#000', 1);
    var svgGroup = svg.append('g');
    var canvas = wrap.querySelector('.dg-canvas');
    var searchInput = wrap.querySelector('.dg-search');
    var searchResults = wrap.querySelector('.dg-search-results');
    var externalToggle = wrap.querySelector('.dg-toggle-external');
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
        var selected = container.getAttribute('data-focus') || null;
        if (selected && !fullDs.nodeMap[selected]) selected = null;
        if (selected) resetBtn.hidden = false;

        function fitToView(layout) {
          var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          layout.nodes.forEach(function (n) {
            minX = Math.min(minX, n.x - n.w / 2); maxX = Math.max(maxX, n.x + n.w / 2);
            minY = Math.min(minY, n.y - n.h / 2); maxY = Math.max(maxY, n.y + n.h / 2);
          });
          if (!isFinite(minX)) { minX = 0; maxX = 100; minY = 0; maxY = 100; }
          var gw = (maxX - minX) || 100, gh = (maxY - minY) || 100;
          var cw = canvas.clientWidth || 600, ch = canvas.clientHeight || 500;
          var scale = Math.min(cw / gw, ch / gh, 1) * 0.9;
          var tx = cw / 2 - ((minX + maxX) / 2) * scale;
          var ty = ch / 2 - ((minY + maxY) / 2) * scale;
          svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }

        function highlight(ds, nodeId) {
          if (!nodeId) {
            svgGroup.selectAll('g.dg-node').style('opacity', 1);
            // Clear the inline opacity override entirely (not reset to 1) so the CSS baseline
            // opacity (.dg-edge, dependency-graph.css) takes back over; setting it to 1 here
            // would leave every edge permanently at full opacity after the first hover.
            svgGroup.selectAll('line.dg-edge')
              .style('opacity', null)
              .classed('dg-edge-active', false)
              .attr('marker-end', 'url(#dg-arrowhead)');
            return;
          }
          var n = ds.nodeMap[nodeId];
          if (!n) return;
          var related = new Set([nodeId]);
          var relatedEdges = new Set();
          (n.incoming || []).forEach(function (eid) { relatedEdges.add(eid); related.add(ds.edgeMap[eid].source); });
          (n.outgoing || []).forEach(function (eid) { relatedEdges.add(eid); related.add(ds.edgeMap[eid].target); });
          svgGroup.selectAll('g.dg-node').style('opacity', function (d) { return related.has(d.id) ? 1 : 0.15; });
          svgGroup.selectAll('line.dg-edge')
            .style('opacity', function (d) { return relatedEdges.has(d.edgeId) ? 1 : 0.1; })
            .classed('dg-edge-active', function (d) { return relatedEdges.has(d.edgeId); })
            .attr('marker-end', function (d) { return relatedEdges.has(d.edgeId) ? 'url(#dg-arrowhead-active)' : 'url(#dg-arrowhead)'; });
        }

        function draw() {
          var ds = focusedSubgraph(selected, fullDs);
          var showExternal = externalToggle.checked;
          var layout = buildForceLayout(ds, showExternal);

          svgGroup.selectAll('*').remove();
          var edgeG = svgGroup.append('g').attr('class', 'edgePaths');
          var nodeG = svgGroup.append('g').attr('class', 'nodes');

          edgeG.selectAll('line.dg-edge')
            .data(layout.links)
            .enter().append('line')
            .attr('class', function (d) { return edgeClass(d.relation); })
            .attr('data-edge-id', function (d) { return d.edgeId; })
            .attr('x1', function (d) { return d.source.x; })
            .attr('y1', function (d) { return d.source.y; })
            .attr('x2', function (d) { return clipToRectBorder(d.source.x, d.source.y, d.target.x, d.target.y, d.target.w, d.target.h).x; })
            .attr('y2', function (d) { return clipToRectBorder(d.source.x, d.source.y, d.target.x, d.target.y, d.target.w, d.target.h).y; })
            .attr('marker-end', 'url(#dg-arrowhead)');

          var nodeSel = nodeG.selectAll('g.dg-node')
            .data(layout.nodes, function (d) { return d.id; })
            .enter().append('g')
            .attr('class', function (d) { return nodeClass(d.data); })
            .attr('data-node-id', function (d) { return d.id; })
            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
            .style('cursor', 'pointer');

          nodeSel.append('rect')
            .attr('x', function (d) { return -d.w / 2; })
            .attr('y', function (d) { return -d.h / 2; })
            .attr('width', function (d) { return d.w; })
            .attr('height', function (d) { return d.h; })
            .attr('rx', 5).attr('ry', 5);

          nodeSel.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.32em')
            .text(function (d) { return d.data.name; });

          nodeSel.append('title').text(function (d) { return nodeTooltip(d.data); });

          nodeSel
            .on('mouseenter', function (d) { highlight(ds, d.id); })
            .on('mouseleave', function () { highlight(ds, null); })
            .on('click', function (d) {
              d3.event.stopPropagation();
              // Clicking a node opens a link, preferring the richest destination that exists: the
              // per-project report (only set when one actually exists), then the source
              // repository, then the homepage. A node with none stays inert rather than 404ing.
              // To focus a node's ancestor+descendant subgraph instead, use the search box.
              var url = d.data.report ? resolveReportUrl(d.data.report)
                      : d.data.repo ? d.data.repo
                      : d.data.home ? d.data.home
                      : null;
              if (url) window.open(url, '_blank');
            });

          fitToView(layout);
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
          var matches = fullDs.allNodeIds
            .filter(function (id) { return fullDs.nodeMap[id].data.name.toLowerCase().indexOf(term) !== -1; })
            .slice(0, 15);
          searchResults.hidden = matches.length === 0;
          matches.forEach(function (id) {
            var item = document.createElement('div');
            item.className = 'dg-search-item';
            item.textContent = fullDs.nodeMap[id].data.name;
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
        externalToggle.addEventListener('change', draw);
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
