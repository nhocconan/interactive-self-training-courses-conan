// Runs in the browser after the course sweep reveals the lesson articles.
export function probeLessonText() {
  document.querySelectorAll('article[data-lesson] details').forEach(details => { details.open = true; });
  const issues = [];
  // A paragraph can fit its own box perfectly yet wrap early inside the lesson.
  // Compare single-column blocks to the body content box, excluding its gutters.
  for (const body of document.querySelectorAll('article[data-lesson] .lesson-body, .hero-inner, .module-header, .complete')) {
    const style = getComputedStyle(body);
    if (style.display !== 'block') continue;
    const available = body.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    for (const child of body.children) {
      if (!child.matches('p, ul, ol, .note, .objectives, .concept, .callout, .takeaway, .quiz, .accordion, .steps, .checklist')) continue;
      const bounds = child.getBoundingClientRect();
      if (!bounds.width || available - bounds.width < 96 || bounds.width >= available * 0.85) continue;
      const leaves = child.matches('p') ? [child] : child.querySelectorAll('p, li, summary, button');
      for (const leaf of leaves) {
        if (leaf.querySelector('ul, ol, p, br, pre, table, svg')) continue;
        const nodes = document.createTreeWalker(leaf, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        const halfLine = (parseFloat(getComputedStyle(leaf).lineHeight) || 16) / 2;
        let top = Infinity, bottom = -Infinity;
        while (nodes.nextNode()) {
          if (!nodes.currentNode.textContent.trim()) continue;
          range.selectNodeContents(nodes.currentNode);
          for (const rect of range.getClientRects()) {
            if (!rect.width) continue;
            top = Math.min(top, rect.top);
            bottom = Math.max(bottom, rect.top);
          }
        }
        if (bottom - top <= halfLine) continue;
        issues.push({
          lesson: body.closest('article, [data-pane]')?.id || `module ${body.dataset.module}`,
          text: leaf.textContent.trim().replace(/\s+/g, ' ').slice(0, 70),
          problem: `wrapped prose uses ${Math.round(bounds.width)}px of ${Math.round(available)}px available`,
        });
        break;
      }
    }
  }
  for (const title of document.querySelectorAll('.nav-link[data-lesson] .nav-title')) {
    if (!title.clientWidth) continue;
    if (title.scrollWidth <= title.clientWidth + 1 && title.scrollHeight <= title.clientHeight + 1) continue;
    issues.push({
      lesson: title.closest('[data-lesson]').dataset.lesson,
      text: title.textContent.trim(),
      problem: 'sidebar lesson title is cut off',
    });
  }
  for (const block of document.querySelectorAll('article[data-lesson] :is(p, td, th)')) {
    const bounds = block.getBoundingClientRect();
    if (!bounds.width) continue;
    const cell = block.matches('td, th');
    if (cell && bounds.width >= 160) continue;
    const range = document.createRange();
    const nodes = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const tops = [];
    let spill = 0;
    while (nodes.nextNode()) {
      const node = nodes.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest('svg, pre, table table')) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (!rect.width) continue;
        spill = Math.max(spill, rect.right - bounds.right, bounds.left - rect.left);
        tops.push(rect.top);
      }
    }
    let problem;
    if (cell) {
      // Inline code and superscripts can have different baselines on the same line.
      const halfLine = (parseFloat(getComputedStyle(block).lineHeight) || 16) / 2;
      let lastTop = -Infinity;
      let lines = 0;
      for (const top of tops.sort((a, b) => a - b)) {
        if (top - lastTop < halfLine) continue;
        lastTop = top;
        lines++;
      }
      if (lines >= 12) problem = `table cell ${Math.round(bounds.width)}px wide needs ${lines} lines`;
    } else if (spill > 2) {
      problem = `paragraph text extends ${Math.round(spill)}px beyond its reading column`;
    }
    if (problem) issues.push({
      lesson: block.closest('article').id,
      text: block.textContent.trim().replace(/\s+/g, ' ').slice(0, 70),
      problem,
    });
  }
  return issues;
}
