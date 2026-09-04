/*
 * Renders <slug>.graph.json (see prompts/stack-report/stack-report.md, Artifact 4) as an
 * interactive dependency graph: a top-to-bottom DAG (dagre-d3 + d3 v5, loaded via CDN in
 * _includes/dependency-graph.html -- no build step), with zoom/pan, click-a-node to focus its
 * ancestor+descendant subgraph, hover to highlight neighbors, a search box, and a legend.
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

  // A node's "focused subgraph" is itself plus every ancestor and descendant -- clicking a node
  // zooms into just that context, mirroring conda-forge's DependencyGraph component.
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

  function nodeClass(n) {
    var cls = 'dg-node dg-node-' + (n.color || 'grey');
    if (n.in_scope === false) cls += ' dg-node-external';
    return cls;
  }

  function nodeTooltip(n) {
    var tip = n.name + ' - ' + (n.color || 'grey') + (n.criticality ? ' (' + n.criticality + ')' : '');
    if (n.release_provider && n.release_provider !== 'none') tip += '\nRelease: ' + n.release_provider;
    if (n.gap) tip += '\nGap: ' + n.gap;
    return tip;
  }

  function buildDagreGraph(ds, showExternal) {
    var g = new dagreD3.graphlib.Graph({ directed: true })
      .setGraph({ nodesep: 40, ranksep: 70, rankdir: 'TB' })
      .setDefaultEdgeLabel(function () { return {}; });

    ds.allNodeIds.forEach(function (id) {
      var n = ds.nodeMap[id].data;
      if (!showExternal && n.in_scope === false) return;
      g.setNode(id, { label: n.name, rx: 5, ry: 5, padding: 10, class: nodeClass(n) });
    });
    Object.keys(ds.edgeMap).forEach(function (eid) {
      var e = ds.edgeMap[eid];
      if (!g.hasNode(e.source) || !g.hasNode(e.target)) return;
      g.setEdge(e.source, e.target, {
        edgeId: eid,
        style: e.type === 'implicit'
          ? 'stroke: #888; stroke-width: 1.5px; stroke-dasharray: 4,3; fill: none;'
          : 'stroke: #555; stroke-width: 1.5px; fill: none;',
        arrowheadStyle: 'fill: #555;',
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
        '<label class="dg-toggle"><input type="checkbox" class="dg-toggle-external" checked> Show external dependencies</label>' +
        '<button type="button" class="dg-reset" hidden>Reset view</button>' +
      '</div>' +
      '<div class="dg-canvas"><svg></svg></div>' +
      '<div class="dg-legend"></div>' +
      '<p class="dg-instructions">Arrows point from a node to what it depends on. Solid = explicit dependency, ' +
      'dashed = implicit ("needs it to be useful"). Scroll to zoom, drag to pan, click a node to focus its ' +
      'subgraph (click it again to open its report/repo), click the background or Reset view to return, ' +
      'hover to highlight neighbors.</p>';
    container.appendChild(wrap);

    renderLegend(wrap.querySelector('.dg-legend'));

    var svg = d3.select(wrap.querySelector('svg'));
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
        var selected = null;

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
            svgGroup.selectAll('g.edgePath').style('opacity', 1);
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
          var ds = focusedSubgraph(selected, fullDs);
          var showExternal = externalToggle.checked;
          var g = buildDagreGraph(ds, showExternal);

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
              var n = ds.nodeMap[id].data;
              if (selected === id) {
                // Always the project-report URL, even if that page doesn't exist yet (404) --
                // never silently fall back to repo/home.
                if (n.report) window.open(n.report, '_blank');
                return;
              }
              selected = id;
              resetBtn.hidden = false;
              draw();
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
    ext.appendChild(document.createTextNode('external dependency (outside this stack)'));
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
