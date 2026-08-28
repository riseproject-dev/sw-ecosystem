#!/usr/bin/env python3
"""Render a RISC-V stack-report software stack as an SVG diagram.

Two subcommands:

  build   <project-reports/scope.yml> <report.md> -o <slug>.yml
          Join the layout (from the scope spec) with the per-node color + gap text
          (from the report's Artifact 2 status table) into a self-contained view-model
          YAML that the renderer consumes.

  render  <slug>.yml -o <slug>.svg
          Render the view-model to an SVG. As a convenience, `render --scope <f>
          --report <f>` builds the view-model in memory and renders in one shot.

The view-model is the stable interface: the stack-report prompt/workflow emits it
alongside <slug>.md, so the renderer never has to parse free-text markdown. See
examples/stack-report/stack-report.md (Artifact 4) for the schema.

Dependencies: Python 3.8+ and PyYAML. No other third-party packages.
"""

import argparse
import re
import sys
import xml.sax.saxutils as sax

import yaml


# ---------------------------------------------------------------------------
# Color model (skills/project-color-coding/SKILL.md). One fill per state.
# ---------------------------------------------------------------------------

PALETTE = {
    "green":  "#3FA34D",
    "blue":   "#2F6FB0",
    "yellow": "#E6B800",
    "orange": "#E8730C",
    "red":    "#B5342A",
    "grey":   "#9E9E9E",
}

# Text color per fill, chosen for contrast (dark on the light fills).
DARK_TEXT = {"yellow", "grey"}

# Default legend: all six states, in the color-model's ordering. Reusable across
# verticals, so it is baked into the view-model at build time.
#
# Each color encodes TWO axes at once (see skills/project-color-coding/SKILL.md): the upstream
# build/test/release posture, and -- for optimization-purpose projects -- the
# RISC-V optimization level. Both axes are spelled out in each label; the chip
# conveys the color, so the label itself carries no color name. Rendered as a
# 2-column x 3-row grid at the top-right.
DEFAULT_LEGEND = [
    {"color": "green",  "label": "upstream builds+tests+releases; optimized"},
    {"color": "blue",   "label": "upstream builds+tests; mostly optimized"},
    {"color": "yellow", "label": "upstream builds; some optimized"},
    {"color": "orange", "label": "no upstream build, distributions only; no optimizations"},
    {"color": "red",    "label": "not working"},
    {"color": "grey",   "label": "unknown or N/A"},
]


# ---------------------------------------------------------------------------
# build: project-reports/scope.yml + report.md -> view-model dict
# ---------------------------------------------------------------------------

def parse_scope(path):
    """Return (title_vertical, target_profile, columns, product_layers,
    shared_layers, node_layout) from a scope spec.

    node_layout is a list of (name, criticality, column_or_None, row_layer,
    full_title) in scope order, where full_title is the original layer title (used
    to join against the report's Layer column). Layer titles of the form
    "<Product> -- <Row>" define the product grid (columns x rows); any other title
    is a full-width shared layer.
    """
    scope = yaml.safe_load(open(path, encoding="utf-8"))
    vertical = scope.get("vertical") or scope.get("slug") or "Software stack"
    target_profile = scope.get("target_profile") or "RVA23U64"

    columns, product_layers, shared_layers, node_layout = [], [], [], []
    for layer in scope.get("layers") or []:
        title = layer["title"]
        if " -- " in title:
            product, row = title.split(" -- ", 1)
            if product not in columns:
                columns.append(product)
            if row not in product_layers:
                product_layers.append(row)
            col, layer_title = product, row
        else:
            if title not in shared_layers:
                shared_layers.append(title)
            col, layer_title = None, title
        for node in (layer.get("nodes") or []):
            # A node in a shared layer may name an explicit `column:` to sit under
            # a product column; product-layer nodes take their column from the title.
            node_col = col if col is not None else node.get("column")
            node_layout.append((node["name"], node.get("criticality", "critical"),
                                node_col, layer_title, title))
    return vertical, target_profile, columns, product_layers, shared_layers, node_layout


def parse_report(path):
    """Parse the report's Artifact 2(a) full status table.

    The full table has >= 9 columns:
      Node | Layer | Criticality | Color | Release provider | Justification | ...
    The narrow slide-ready table (b) has 4 columns and is skipped. Color is the
    first word of the Color cell (e.g. "orange (downstream-only)" -> "orange").

    Returns (by_pair, by_name):
      by_pair: {(layer, node): {color, release_provider, gap}} for a precise join
               that disambiguates a node listed under two columns.
      by_name: {node: {...}} fallback for older reports whose Layer column is
               collapsed and does not match the scope layer titles.
    """
    md = open(path, encoding="utf-8").read()
    by_pair, by_name = {}, {}
    for line in md.splitlines():
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 9:
            continue
        node = cells[0]
        if node == "Node" or set(node) <= set("-: "):
            continue
        color = cells[3].split()[0].lower() if cells[3] else ""
        if color not in PALETTE:
            continue
        rec = {"color": color, "release_provider": cells[4], "gap": cells[5]}
        by_pair[(cells[1], node)] = rec
        by_name[node] = rec
    return by_pair, by_name


def parse_report_columns(path, columns):
    """Return {node_name: product} for shared-layer nodes that the report's
    Artifact 1 places under a specific product column.

    The layered outline splits a shared layer such as "Orchestration &
    Observability" into per-product subsections headed like
    "### Layer 4.a -- PostgreSQL: Orchestration & Observability" (or
    "... -- Orchestration & Observability" following a "Layer N.x -- <Product>:"
    heading that established the letter->product map). Nodes bulleted under such a
    subsection belong to that product's column; nodes under the un-lettered
    "### Layer N -- <shared>" heading stay shared (no column).

    This lets a shared layer show per-product items beneath their product column
    (matching the reference diagram) even though the scope spec lists the layer
    flat. Returns {} if the report has no per-product subsections.
    """
    heading = re.compile(r"^#{2,4}\s+Layer\s+\d+(?:\.([a-z]))?\s+--\s+(.+?)\s*$")
    bullet = re.compile(r"^-\s+\*\*(.+?)\*\*")
    letter_to_product = {}
    mapping = {}
    current_product = None
    for line in open(path, encoding="utf-8").read().splitlines():
        h = heading.match(line)
        if h:
            letter, title = h.group(1), h.group(2)
            # A "Layer N.x -- <Product>: <...>" heading defines letter->product.
            if letter and ":" in title:
                product = title.split(":", 1)[0].strip()
                letter_to_product[letter] = product
                current_product = product if product in columns else None
            elif letter and letter in letter_to_product:
                # e.g. "Layer 4.a -- Orchestration & Observability" reuses letter a.
                current_product = letter_to_product[letter]
                current_product = current_product if current_product in columns else None
            else:
                current_product = None   # un-lettered shared subsection
            continue
        b = bullet.match(line)
        if b and current_product:
            mapping.setdefault(b.group(1).strip(), current_product)
    return mapping


def build_viewmodel(scope_path, report_path):
    vertical, profile, columns, product_layers, shared_layers, layout = parse_scope(scope_path)
    by_pair, by_name = parse_report(report_path)
    report_columns = parse_report_columns(report_path, columns)

    def lookup(name, full_title):
        # Prefer a precise (layer, node) match (disambiguates a node under two
        # columns); fall back to name-only for older collapsed-Layer reports.
        return by_pair.get((full_title, name)) or by_name.get(name)

    missing = sorted({name for name, _, _, _, ft in layout if lookup(name, ft) is None})
    if missing:
        raise SystemExit(
            "ERROR: {} scope node(s) have no color match in the report table:\n  {}"
            .format(len(missing), "\n  ".join(missing)))

    nodes = []
    for name, criticality, column, layer, full_title in layout:
        rec = lookup(name, full_title)
        provider = rec["release_provider"]
        # A shared-layer node (column is None) may still be placed under a product
        # column by the report's Artifact 1 per-product subsections.
        if column is None:
            column = report_columns.get(name)
        nodes.append({
            "name": name,
            "color": rec["color"],
            "criticality": criticality,
            "column": column,
            "layer": layer,
            "release_provider": provider,
            "upstream_release": provider.strip().lower() == "upstream",
            "gap": rec["gap"],
        })

    return {
        "title": vertical,
        "target_profile": profile,
        "hardware_label": "Hardware: RISC-V CPU ({})".format(profile),
        "columns": columns,
        "product_layers": product_layers,
        "shared_layers": shared_layers,
        "legend": [dict(e) for e in DEFAULT_LEGEND],
        "nodes": nodes,
    }


def write_yaml(vm, out_path):
    with open(out_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(vm, f, sort_keys=False, allow_unicode=True,
                       default_flow_style=False, width=100)


# ---------------------------------------------------------------------------
# Text fitting (no font-metrics library: estimate width from font size)
# ---------------------------------------------------------------------------

CHAR_W = 0.60   # average glyph width as a fraction of font size
LINE_H = 1.20   # line height as a multiple of font size


def _greedy_wrap(text, max_chars):
    """Wrap on spaces; break over-long tokens after '/' then hard-break."""
    lines, cur = [], ""

    def flush():
        nonlocal cur
        if cur:
            lines.append(cur)
            cur = ""

    for word in text.split():
        if cur and len(cur) + 1 + len(word) <= max_chars:
            cur = cur + " " + word
            continue
        flush()
        if len(word) <= max_chars:
            cur = word
            continue
        for part in re.split(r"(?<=/)", word):   # keep '/' on the left part
            if not part:
                continue
            if len(cur) + len(part) <= max_chars:
                cur += part
            else:
                flush()
                while len(part) > max_chars:
                    lines.append(part[:max_chars])
                    part = part[max_chars:]
                cur = part
    flush()
    return lines or [""]


def fit_text(text, box_w, box_h):
    """Return (font_size, lines) that fit inside the box, shrinking font and
    ellipsizing as a last resort."""
    avail_w, avail_h = box_w - 8, box_h - 6
    for fs in (11, 10, 9, 8, 7):
        max_chars = max(1, int(avail_w / (CHAR_W * fs)))
        max_lines = max(1, int(avail_h / (fs * LINE_H)))
        lines = _greedy_wrap(text, max_chars)
        if len(lines) <= max_lines:
            return fs, lines
    # Last resort: min font, clip and ellipsize.
    fs = 7
    max_chars = max(1, int(avail_w / (CHAR_W * fs)))
    max_lines = max(1, int(avail_h / (fs * LINE_H)))
    lines = _greedy_wrap(text, max_chars)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        lines[-1] = (last[:max_chars - 1] + "…") if len(last) >= max_chars else (last + "…")
    return fs, lines


# ---------------------------------------------------------------------------
# render: view-model dict -> SVG string
# ---------------------------------------------------------------------------

# Geometry constants (px). BOX_W is the fundamental unit: every node box is one
# BOX_W wide, and a column's width is a whole number of boxes (its boxes-per-row),
# so wider columns simply fit more boxes side by side.
MARGIN = 12
GUTTER_W = 168
BOX_W = 98
BOX_H = 32
BOX_GAP = 5
CELL_PAD = 5
ROW_PAD = 6
TITLE_H = 42
COLHDR_H = 26
HW_H = 34
SUBBAND_GAP = 6          # gap between a shared band's per-product part and its shared strip
TARGET_ROWS = 3          # a column is widened until its busiest cell wraps to <= this many rows

FONT = "Helvetica, Arial, sans-serif"
HW_FILL = "#37474F"          # slate; distinct from the palette "blue"
BAND_BG = "#f4f4f4"
SEP = "#dddddd"
INK = "#1a1a1a"
SUBSEP = "#c8c8c8"


def esc(s):
    return sax.escape(str(s))


def _cell_rows(n, bpr):
    return (n + bpr - 1) // bpr if n else 0


class SvgBuilder:
    def __init__(self, vm, mark_nonupstream=False):
        self.vm = vm
        self.mark = mark_nonupstream
        self.parts = []
        self.columns = vm["columns"]
        self.grid_x0 = MARGIN + GUTTER_W
        self._group_nodes()
        self._size_columns()
        # A shared strip packs across the full product-grid width at BOX_W.
        self.shared_bpr = max(1, int((self.content_w - 2 * CELL_PAD + BOX_GAP) /
                                     (BOX_W + BOX_GAP)))

    # -- grouping -----------------------------------------------------------
    def _group_nodes(self):
        # Product grid cells, and -- for shared layers -- a per-product part
        # (nodes the report placed under a product column) plus a flat shared part.
        self.product_cells = {}          # (column, layer) -> [node]
        self.shared_pp = {}              # (shared_layer, column) -> [node]
        self.shared_flat = {}            # shared_layer -> [node]
        for layer in self.vm["shared_layers"]:
            self.shared_flat[layer] = []
        for node in self.vm["nodes"]:
            col, layer = node.get("column"), node["layer"]
            if layer in self.shared_flat:
                if col in self.columns:
                    self.shared_pp.setdefault((layer, col), []).append(node)
                else:
                    self.shared_flat[layer].append(node)
            else:
                self.product_cells.setdefault((col, layer), []).append(node)

    def _size_columns(self):
        """Choose each column's boxes-per-row from its busiest cell, so a column
        with many elements is wider (fewer stacked rows) than a sparse one.

        When there are no product columns (single-vertical scope with only shared
        layers), derive content_w from the widest shared layer instead, ensuring
        the canvas is always wide enough to show all nodes plus the legend."""
        self.col_bpr, self.col_w, self.col_x = {}, {}, {}
        x = self.grid_x0
        for col in self.columns:
            busiest = 1
            for layer in self.vm["product_layers"]:
                busiest = max(busiest, len(self.product_cells.get((col, layer), [])))
            for layer in self.vm["shared_layers"]:
                busiest = max(busiest, len(self.shared_pp.get((layer, col), [])))
            bpr = max(1, -(-busiest // TARGET_ROWS))   # ceil
            w = bpr * BOX_W + (bpr - 1) * BOX_GAP + 2 * CELL_PAD
            self.col_bpr[col], self.col_w[col], self.col_x[col] = bpr, w, x
            x += w
        self.content_w = sum(self.col_w.values())

        if not self.columns:
            # No product columns: size the canvas from the widest shared layer.
            max_flat = max(
                (len(self.shared_flat.get(L, [])) for L in self.vm["shared_layers"]),
                default=1)
            bpr = max(1, -(-max_flat // TARGET_ROWS))
            self.content_w = bpr * BOX_W + (bpr - 1) * BOX_GAP + 2 * CELL_PAD
            # shared_bpr is recomputed after total_w is known; store a placeholder.
        # Ensure total_w is wide enough to show the legend + a minimum title area.
        # (legend_w is computed later; reserve 600px for a typical 2-col legend.)
        LEGEND_RESERVE = 600
        TITLE_MIN = 250
        min_content = max(0, LEGEND_RESERVE + TITLE_MIN - GUTTER_W - MARGIN)
        self.content_w = max(self.content_w, min_content)
        self.total_w = self.grid_x0 + self.content_w + MARGIN

    # -- primitives ---------------------------------------------------------
    def rect(self, x, y, w, h, fill, rx=0, stroke=None, sw=1, opacity=None):
        s = '<rect x="{:.1f}" y="{:.1f}" width="{:.1f}" height="{:.1f}" fill="{}"'.format(
            x, y, w, h, fill)
        if rx:
            s += ' rx="{}" ry="{}"'.format(rx, rx)
        if stroke:
            s += ' stroke="{}" stroke-width="{}"'.format(stroke, sw)
        if opacity is not None:
            s += ' opacity="{}"'.format(opacity)
        self.parts.append(s + "/>")

    def line(self, x1, y1, x2, y2, stroke=SEP, sw=1):
        self.parts.append(
            '<line x1="{:.1f}" y1="{:.1f}" x2="{:.1f}" y2="{:.1f}" stroke="{}" stroke-width="{}"/>'
            .format(x1, y1, x2, y2, stroke, sw))

    def text(self, x, y, s, size, fill=INK, anchor="middle", weight="normal", style=None):
        extra = ' font-style="{}"'.format(style) if style else ""
        self.parts.append(
            '<text x="{:.1f}" y="{:.1f}" font-family="{}" font-size="{}" fill="{}" '
            'text-anchor="{}" font-weight="{}"{}>{}</text>'.format(
                x, y, FONT, size, fill, anchor, weight, extra, esc(s)))

    def wrapped_text(self, cx, cy, w, h, s, fill, weight="normal", anchor="middle"):
        fs, lines = fit_text(s, w, h)
        total = len(lines) * fs * LINE_H
        base = cy - total / 2 + fs * 0.95
        for i, ln in enumerate(lines):
            self.text(cx, base + i * fs * LINE_H, ln, fs, fill=fill,
                      anchor=anchor, weight=weight)

    # -- node box -----------------------------------------------------------
    def node_box(self, node, x, y, w, h):
        fill = PALETTE.get(node["color"], PALETTE["grey"])
        txt_fill = INK if node["color"] in DARK_TEXT else "#ffffff"
        self.parts.append("<g>")
        # Native tooltip: name, color, criticality, release provider, gap.
        tip = "{} - {} ({})".format(node["name"], node["color"], node.get("criticality", ""))
        if node.get("release_provider"):
            tip += "\nRelease: {}".format(node["release_provider"])
        if node.get("gap"):
            tip += "\nGap: {}".format(node["gap"])
        self.parts.append("<title>{}</title>".format(esc(tip)))
        self.rect(x, y, w, h, fill, rx=3, stroke="#00000022", sw=1)
        if self.mark and not node.get("upstream_release", False):
            # subtle folded corner: release is not from upstream
            marker = "#ffffff" if node["color"] not in DARK_TEXT else "#00000055"
            self.parts.append(
                '<path d="M{:.1f},{:.1f} L{:.1f},{:.1f} L{:.1f},{:.1f} Z" fill="{}" opacity="0.7"/>'
                .format(x + w - 9, y, x + w, y, x + w, y + 9, marker))
        self.wrapped_text(x + w / 2, y + h / 2, w, h, node["name"], txt_fill,
                          weight="bold" if node.get("criticality") == "critical" else "normal")
        self.parts.append("</g>")

    # -- height helpers -----------------------------------------------------
    def band_height(self, rows):
        return 2 * ROW_PAD + rows * BOX_H + max(0, rows - 1) * BOX_GAP

    def product_band_rows(self, layer):
        return max([1] + [_cell_rows(len(self.product_cells.get((c, layer), [])),
                                     self.col_bpr[c]) for c in self.columns])

    def shared_pp_rows(self, layer):
        return max([0] + [_cell_rows(len(self.shared_pp.get((layer, c), [])),
                                     self.col_bpr[c]) for c in self.columns])

    def shared_band_height(self, layer):
        pp_rows = self.shared_pp_rows(layer)
        flat_rows = _cell_rows(len(self.shared_flat.get(layer, [])), self.shared_bpr)
        rows = max(1, pp_rows + flat_rows)
        h = self.band_height(rows)
        if pp_rows and flat_rows:
            h += SUBBAND_GAP
        return h

    # -- packing ------------------------------------------------------------
    def pack_grid(self, nodes, x0, y0, bpr, box_w):
        for i, node in enumerate(nodes):
            r, c = divmod(i, bpr)
            self.node_box(node, x0 + c * (BOX_W + BOX_GAP), y0 + r * (BOX_H + BOX_GAP),
                          box_w, BOX_H)

    def pack_cell(self, nodes, col, y0, inner_h):
        """A single node fills the whole cell (prominent engine / client box);
        several wrap in the column's boxes-per-row grid."""
        x0 = self.col_x[col] + CELL_PAD
        if len(nodes) == 1:
            self.node_box(nodes[0], x0, y0, self.col_w[col] - 2 * CELL_PAD, inner_h)
        else:
            self.pack_grid(nodes, x0, y0, self.col_bpr[col], BOX_W)

    # -- top-level render ---------------------------------------------------
    def render(self):
        vm = self.vm
        legend_w, legend_h = self._legend_size()
        header_h = max(TITLE_H, legend_h)
        hdr_gap = COLHDR_H if self.columns else 0   # no column-name row for single-vertical stacks
        prod_h = {L: self.band_height(self.product_band_rows(L)) for L in vm["product_layers"]}
        shared_h = {L: self.shared_band_height(L) for L in vm["shared_layers"]}
        grid_top = MARGIN + header_h + hdr_gap
        total_h = grid_top + sum(prod_h.values()) + sum(shared_h.values()) + HW_H + MARGIN

        self.parts.append(
            '<svg xmlns="http://www.w3.org/2000/svg" width="{}" height="{}" '
            'viewBox="0 0 {} {}" font-family="{}">'.format(
                int(self.total_w), int(total_h), int(self.total_w), int(total_h), FONT))
        self.rect(0, 0, self.total_w, total_h, "#ffffff")

        # Header: title on the left, legend as a vertical list on the right.
        legend_left = self.total_w - MARGIN - legend_w
        self.wrapped_text((MARGIN + legend_left) / 2, MARGIN + header_h / 2,
                          legend_left - MARGIN - 8, header_h,
                          "{}  --  RISC-V readiness".format(vm["title"]),
                          INK, weight="bold")
        self._legend(legend_left, MARGIN + (header_h - legend_h) / 2, legend_h)

        # Column headers (variable width).
        hdr_y = MARGIN + header_h
        for col in self.columns:
            self.rect(self.col_x[col], hdr_y, self.col_w[col], COLHDR_H, "#eceff1",
                      stroke=SEP, sw=1)
            self.wrapped_text(self.col_x[col] + self.col_w[col] / 2, hdr_y + COLHDR_H / 2,
                              self.col_w[col], COLHDR_H, col, INK, weight="bold")

        # Product grid.
        y = grid_top
        band_idx = 0
        for layer in vm["product_layers"]:
            h = prod_h[layer]
            self._band_bg(y, h, band_idx)
            self._gutter_label(y, h, layer)
            for col in self.columns:
                nodes = self.product_cells.get((col, layer), [])
                if nodes:
                    self.pack_cell(nodes, col, y + ROW_PAD, h - 2 * ROW_PAD)
            y += h
            band_idx += 1
        grid_bottom = y
        # Column separators spanning the product grid only.
        for col in self.columns:
            self.line(self.col_x[col], grid_top, self.col_x[col], grid_bottom, stroke=SEP, sw=1)
        self.line(self.grid_x0 + self.content_w, grid_top, self.grid_x0 + self.content_w,
                  grid_bottom, stroke=SEP, sw=1)

        # Shared bands: per-product cells (under their columns) on top, then a
        # full-width strip of the cross-cutting nodes.
        for layer in vm["shared_layers"]:
            h = shared_h[layer]
            self._band_bg(y, h, band_idx)
            self._gutter_label(y, h, layer)
            pp_rows = self.shared_pp_rows(layer)
            flat = self.shared_flat.get(layer, [])
            if pp_rows:
                for col in self.columns:
                    cell = self.shared_pp.get((layer, col), [])
                    if cell:
                        self.pack_grid(cell, self.col_x[col] + CELL_PAD, y + ROW_PAD,
                                       self.col_bpr[col], BOX_W)
                # column separators over the per-product part
                pp_h = self.band_height(pp_rows) - 2 * ROW_PAD
                for col in self.columns:
                    self.line(self.col_x[col], y, self.col_x[col], y + 2 * ROW_PAD + pp_h,
                              stroke=SUBSEP, sw=1)
                self.line(self.grid_x0 + self.content_w, y, self.grid_x0 + self.content_w,
                          y + 2 * ROW_PAD + pp_h, stroke=SUBSEP, sw=1)
                strip_y = y + 2 * ROW_PAD + pp_h + (SUBBAND_GAP if flat else 0)
                if flat:
                    self.line(self.grid_x0, strip_y - SUBBAND_GAP / 2,
                              self.grid_x0 + self.content_w, strip_y - SUBBAND_GAP / 2,
                              stroke=SUBSEP, sw=1)
            else:
                strip_y = y + ROW_PAD
            if flat:
                self.pack_grid(flat, self.grid_x0 + CELL_PAD, strip_y, self.shared_bpr, BOX_W)
            y += h
            band_idx += 1

        # Hardware footer (full width).
        self.rect(MARGIN, y, self.total_w - 2 * MARGIN, HW_H, HW_FILL, rx=3)
        self.wrapped_text(self.total_w / 2, y + HW_H / 2, self.total_w - 2 * MARGIN, HW_H,
                          vm.get("hardware_label", "Hardware"), "#ffffff", weight="bold")

        self.parts.append("</svg>")
        return "\n".join(self.parts)

    def _band_bg(self, y, h, idx):
        if idx % 2 == 0:
            self.rect(self.grid_x0, y, self.content_w, h, BAND_BG)
        self.line(MARGIN, y, self.total_w - MARGIN, y, stroke=SEP, sw=1)

    def _gutter_label(self, y, h, label):
        self.wrapped_text(MARGIN + GUTTER_W / 2, y + h / 2, GUTTER_W - 12, h,
                          label, INK, weight="bold")

    # -- legend (2-column x 3-row grid, top-right; column-major fill) -------
    LEGEND_FS = 12
    LEGEND_CHIP = 14
    LEGEND_LINE_H = 22
    LEGEND_CHIP_GAP = 6
    LEGEND_COL_GAP = 24      # gap between the two legend columns
    LEGEND_ROWS = 3          # 6 states -> 2 columns of 3 rows

    def _legend_entries(self):
        return self.vm.get("legend") or DEFAULT_LEGEND

    def _legend_columns(self):
        """Split entries column-major into LEGEND_ROWS-tall columns, so the first
        column holds entries 0..2 (green/blue/yellow) and the second 3..5."""
        entries = self._legend_entries()
        rows = self.LEGEND_ROWS
        return [entries[i:i + rows] for i in range(0, len(entries), rows)]

    def _legend_col_w(self, col):
        longest = max((len(e["label"]) for e in col), default=0)
        return self.LEGEND_CHIP + self.LEGEND_CHIP_GAP + longest * self.LEGEND_FS * CHAR_W + 4

    def _legend_size(self):
        """(width, height) of the 2-column legend block."""
        cols = self._legend_columns()
        w = sum(self._legend_col_w(c) for c in cols) + self.LEGEND_COL_GAP * max(0, len(cols) - 1)
        h = max((len(c) for c in cols), default=0) * self.LEGEND_LINE_H
        return w, h

    def _legend(self, x, y, legend_h):
        chip, fs = self.LEGEND_CHIP, self.LEGEND_FS
        cx = x
        for col in self._legend_columns():
            cw = self._legend_col_w(col)
            cy = y
            for e in col:
                self.rect(cx, cy + (self.LEGEND_LINE_H - chip) / 2, chip, chip,
                          PALETTE.get(e["color"], "#ccc"), rx=2, stroke="#00000022", sw=1)
                self.text(cx + chip + self.LEGEND_CHIP_GAP,
                          cy + self.LEGEND_LINE_H / 2 + fs * 0.35,
                          e["label"], fs, fill=INK, anchor="start")
                cy += self.LEGEND_LINE_H
            cx += cw + self.LEGEND_COL_GAP


def render_svg(vm, mark_nonupstream=False):
    return SvgBuilder(vm, mark_nonupstream=mark_nonupstream).render()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def cmd_build(args):
    vm = build_viewmodel(args.scope, args.report)
    write_yaml(vm, args.out)
    n = len(vm["nodes"])
    uniq = len({x["name"] for x in vm["nodes"]})
    sys.stderr.write(
        "built {}: {} node entries ({} unique) | {} columns | {} product + {} shared layers\n"
        .format(args.out, n, uniq, len(vm["columns"]),
                len(vm["product_layers"]), len(vm["shared_layers"])))


def cmd_render(args):
    if args.scope and args.report:
        vm = build_viewmodel(args.scope, args.report)
    elif args.viewmodel:
        vm = yaml.safe_load(open(args.viewmodel, encoding="utf-8"))
    else:
        raise SystemExit("render: provide a view-model yml, or --scope and --report")
    svg = render_svg(vm, mark_nonupstream=args.mark_nonupstream)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(svg)
    sys.stderr.write("wrote {} ({} nodes)\n".format(args.out, len(vm.get("nodes", []))))


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build", help="project-reports/scope.yml + report.md -> view-model yml")
    b.add_argument("scope")
    b.add_argument("report")
    b.add_argument("-o", "--out", required=True)
    b.set_defaults(func=cmd_build)

    r = sub.add_parser("render", help="view-model yml -> svg")
    r.add_argument("viewmodel", nargs="?", help="view-model yml (or use --scope/--report)")
    r.add_argument("--scope", help="build from this project-reports/scope.yml instead of a view-model")
    r.add_argument("--report", help="build from this report.md instead of a view-model")
    r.add_argument("-o", "--out", required=True)
    r.add_argument("--mark-nonupstream", action="store_true",
                   help="draw a corner marker on nodes whose release is not from upstream")
    r.set_defaults(func=cmd_render)

    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
