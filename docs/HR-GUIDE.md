# HR guide

## What HR sees

Visit `/hr`. The page shows, per employee:

- **Department** (filterable via the pill bar).
- **Assigned** courses — total of direct enrollments + category grants.
- **Completed** courses.
- **In progress** courses (started but `completedAt = null`).
- **Completion rate** as a progress bar.
- **Last activity** date.

Top-line tiles roll up the totals (active employees, departments,
completions, minutes learned).

## What HR can not do

- Cannot edit users, courses, categories, or LDAP — those are Admin-only.
- Cannot view raw passwords or LDAP bind details.

## Tips

- Use the **Department** filter to focus on a single org unit.
- The “Minutes learned” tile sums each completed course’s declared duration
  — adjust durations in `/admin/courses` if the defaults feel off.
- Need a deeper analytical dump? Connect to Postgres directly via `psql` over the loopback port
  (`psql -h 127.0.0.1 -p 3942 -U lms lms`) — `User`, `Course`, `CourseProgress`,
  `Enrollment`, `CategoryGrant` are all you need.
