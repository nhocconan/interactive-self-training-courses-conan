#!/usr/bin/env python3
"""Audit SVG arrowheads in course HTML files.

Two bug classes, both invisible to tsc/eslint and easy to miss when skimming:

  A. MULTI-SUBPATH  — `<path d="M..A..M..B" marker-end="...">`
     SVG paints marker-end at the LAST vertex of the whole <path>, so a path
     holding N connectors renders exactly ONE arrowhead (on the last). Every
     other branch silently loses its head. Fix: one <path> per connector.

  B. REVERSED HEAD  — the path's final segment points AWAY from the box it
     terminates against (classic cause: a short backwards hook such as `h-4`).
     With orient="auto" the marker rotates to that final direction, so the
     arrowhead renders pointing out of its target box.

Usage:  python3 scripts/audit-svg-arrows.py [files...]     (default: courses/*.html)
Exit 1 if anything is flagged.
"""
import re, sys, glob, os, math

NUM = r'-?\d+(?:\.\d+)?'
HUG = 10.0     # tip this close to a box edge = the arrow is meant to touch it
AHEAD = 26.0   # look this far along the direction of travel for a target box


def subpaths(d):
    return [p.strip() for p in re.findall(r'[Mm][^Mm]*', d) if p.strip()]


def points(d):
    """Absolute endpoints for M/L/H/V (abs+rel) and curve endpoints."""
    flat = [('c', c) if c else ('n', float(n))
            for c, n in re.findall(r'([A-Za-z])|(' + NUM + r')', d)]
    pts, x, y, cmd, i = [], 0.0, 0.0, None, 0
    while i < len(flat):
        kind, val = flat[i]
        if kind == 'c':
            cmd = val
            i += 1
            continue
        nums = []
        while i < len(flat) and flat[i][0] == 'n':
            nums.append(flat[i][1])
            i += 1
        if cmd in 'ML':
            for j in range(0, len(nums) - 1, 2):
                x, y = nums[j], nums[j + 1]; pts.append((x, y))
        elif cmd in 'ml':
            for j in range(0, len(nums) - 1, 2):
                x, y = x + nums[j], y + nums[j + 1]; pts.append((x, y))
        elif cmd == 'H':
            for n in nums: x = n; pts.append((x, y))
        elif cmd == 'h':
            for n in nums: x += n; pts.append((x, y))
        elif cmd == 'V':
            for n in nums: y = n; pts.append((x, y))
        elif cmd == 'v':
            for n in nums: y += n; pts.append((x, y))
        elif cmd and cmd in 'CcSsQqTt' and len(nums) >= 2:
            if cmd.isupper():
                x, y = nums[-2], nums[-1]
            else:
                x, y = x + nums[-2], y + nums[-1]
            pts.append((x, y))
    return pts


def rects(svg):
    out = []
    for tag in re.findall(r'<rect[^>]*>', svg):
        vals = {}
        for a in ('x', 'y', 'width', 'height'):
            m = re.search(a + r'="(' + NUM + r')"', tag)
            if m: vals[a] = float(m.group(1))
        if len(vals) == 4:
            out.append((vals['x'], vals['y'], vals['width'], vals['height']))
    return out


def gap(pt, r):
    x, y = pt; rx, ry, rw, rh = r
    return math.hypot(min(max(x, rx), rx + rw) - x, min(max(y, ry), ry + rh) - y)


def audit(path):
    s = open(path, encoding='utf-8').read()
    found = []
    for sm in re.finditer(r'<svg\b.*?</svg>', s, re.S):
        svg = sm.group(0)
        lab = re.search(r'aria-label="([^"]{0,55})', svg)
        lab = lab.group(1) if lab else '(no aria-label)'
        boxes = rects(svg)
        for pm in re.finditer(r'<path\b[^>]*marker-(?:end|start)="url\(#[^)]+\)"[^>]*>', svg):
            dm = re.search(r'\sd="([^"]+)"', pm.group(0))
            if not dm:
                continue
            d = dm.group(1)
            if len(subpaths(d)) > 1:
                found.append((path, lab, d, 'A: multi-subpath under one marker — only the LAST branch draws an arrowhead; split into one <path> per connector'))
                continue
            pts = points(d)
            if len(pts) < 2:
                continue
            (x0, y0), (x1, y1) = pts[-2], pts[-1]
            dx, dy = x1 - x0, y1 - y0
            L = math.hypot(dx, dy)
            if not L:
                continue
            ux, uy = dx / L, dy / L
            hugging = [r for r in boxes if gap((x1, y1), r) <= HUG and gap((x1, y1), r) > 0]
            if not hugging:
                continue
            ahead = (x1 + ux * AHEAD, y1 + uy * AHEAD)
            # the arrow is fine if continuing along it actually LANDS INSIDE a box
            if any(gap(ahead, r) <= 1 for r in boxes):
                continue
            # A long last segment leaving a box is a deliberate stub, not a bug.
            # The hook bug is always a short final jog off the end of a connector.
            if L > 12 or len(pts) < 3:
                continue
            behind = (x1 - ux * AHEAD, y1 - uy * AHEAD)
            if any(gap(behind, r) < gap((x1, y1), r) - 1 for r in hugging):
                found.append((path, lab, d, 'B: final segment points AWAY from the box it terminates against — arrowhead renders backwards'))
    return found


if __name__ == '__main__':
    files = sys.argv[1:]
    if not files:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files = sorted(glob.glob(os.path.join(here, 'courses', '*.html')))
    hits = 0
    for f in files:
        for path, lab, d, why in audit(f):
            hits += 1
            print(f'{os.path.basename(path)} | {lab}\n    d="{d[:90]}"\n    -> {why}\n')
    print(f'SVG arrow audit: {hits} issue(s) across {len(files)} file(s)')
    sys.exit(1 if hits else 0)
