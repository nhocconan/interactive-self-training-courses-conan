# Reports & analytics

`/admin/reports` is the org-wide analytics dashboard. It's available to
ADMIN and HR. The page is SSR-only — every query runs against Postgres at
render time so there's no client-side data fetch and no third-party
analytics SDK.

Design draws from how these LMS leaders organise their pulse view:

- **Cornerstone OnDemand** — KPI band on top, mandatory-training panel below.
- **Docebo "Pulse"** — sparkline trends, top-courses and top-learners lists.
- **LinkedIn Learning Insights** — department headcount bars.
- **Moodle Workplace Reports Builder** — "compliance" as a first-class concept.

## Panels

### KPIs (last 90 days)
- Active users (out of total)
- Published courses (out of total)
- Certificates issued
- Quiz pass rate (%) with raw counts

### Completion trend
- 90-day sparkline of `CourseProgress.completedAt`.
- Big number = sum over the window. Sub-label = all-time total.

### Mandatory training compliance
- One row per course marked **Mandatory**.
- Compliance = `completed_count / active_users`. Displayed as both numeric
  ratio and a progress bar.

### Top courses by completion
- Top 8 courses ordered by `count(courseProgress where completedAt is not null)`.
- Shows a small `M` badge if the course is mandatory.

### Top learners
- Top 10 users ranked by completed courses.

### Headcount by department
- Department roster size with a proportional bar (relative to total active users).

## Exports

The HR per-employee table (`/hr`) keeps its existing CSV export at
`/api/hr/export?dept=…`. A `reports.export` permission is reserved for
future org-level CSV exports.

## Performance

The page issues a fixed set of `prisma.*.groupBy` and `count` queries in
parallel (`Promise.all`). On a 500-user, 50-course dataset the entire
render takes well under a second on the loopback Postgres container.

If you grow past ~10 000 completions, consider:

1. Materialising the sparkline buckets into a daily rollup table.
2. Caching the rendered page in Redis with a 5-minute TTL keyed by role.
