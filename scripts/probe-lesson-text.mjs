// Runs in the browser after the course sweep reveals the lesson articles.
export function probeLessonText() {
  document.querySelectorAll('article[data-lesson] details').forEach(details => { details.open = true; });
  const issues = [];
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
