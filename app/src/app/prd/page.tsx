import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRD · Demo Learning Portal",
  description: "Product Requirements Document — Demo internal LMS",
};

// Public PRD page — no auth required.
// Single-file server component. All diagrams are inline SVG so the page
// is fully self-contained and renders identically online or offline.
export default function PRDPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopNav />
      <Hero />
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <TableOfContents />

        <Section id="overview" title="1 · Tổng quan sản phẩm" kicker="Overview">
          <p>
            <strong>Demo Learning Portal</strong> là LMS nội bộ của Demo Group,
            thay thế các đường link rời rạc trên Slack/Drive/Wiki bằng một cổng
            học tập duy nhất: tìm khóa học, học, làm quiz, nhận chứng chỉ, và
            cho HR/Manager nhìn thấy quá trình phát triển của mỗi nhân sự.
          </p>
          <Stats />
          <SystemOverviewSVG />
          <Note>
            Bản PRD này là <em>living document</em>. Phiên bản v1.0 mô tả phạm vi
            đã ship (P0 + P1.5 + P1.6). P2 / P3 nằm trong{" "}
            <code>docs/ROADMAP-PHASES.md</code>.
          </Note>
        </Section>

        <Section id="problem" title="2 · Vấn đề & cơ hội" kicker="Problem">
          <p>
            Demo đã tích lũy rất nhiều nội dung đào tạo HTML tương tác (AI
            Prompting, RAG, Harness Engineering, …). Hiện tại nội dung phân tán
            khắp nơi — không nơi nào để nhân viên có thể:
          </p>
          <ul className="list-disc pl-5">
            <li>khám phá khóa học phù hợp với vai trò của mình,</li>
            <li>tiếp tục học từ nơi đã dừng lại,</li>
            <li>chứng minh rằng đã hoàn thành,</li>
            <li>để HR & cấp quản lý thấy lộ trình phát triển.</li>
          </ul>
          <p>
            Mục tiêu là một cổng có trải nghiệm ngang tầm Bitrix24 / Google
            Workspace / Atlassian: hiện đại, nhanh, đẹp, ổn định — scale được
            từ 3 khóa hôm nay đến hàng trăm, từ 500 nhân viên lên hàng nghìn.
          </p>
        </Section>

        <Section id="goals" title="3 · Mục tiêu & non-goals" kicker="Goals">
          <Table
            head={["#", "Goal", "Success metric (12 tháng)"]}
            rows={[
              ["1", "Mỗi nhân viên Demo có thể tự enroll vào training phù hợp", "≥ 80% MAU"],
              ["2", "HR & manager xem được ai đã học gì, real-time", "< 5s cho bất kỳ HR report"],
              ["3", "Onboarding nhân sự mới chạy hoàn toàn trên portal", "100% new hire hoàn thành onboarding path trong 30 ngày"],
              ["4", "Tạo & publish khóa học không cần dev hỗ trợ", "< 1 ngày từ HTML đã viết → live"],
              ["5", "AD/LDAP SSO cho toàn bộ nhân viên corporate", "0 net-new local password cho AD users"],
              ["6", "AI hỗ trợ cả learner lẫn người tạo nội dung", "Course completion +20% nhờ AI"],
            ]}
          />
          <h3 className="mt-6 font-semibold">Non-goals (ngoài phạm vi)</h3>
          <ul className="list-disc pl-5">
            <li>Bán khóa học cho khách hàng bên ngoài — chỉ dùng nội bộ.</li>
            <li>Lớp học đồng bộ / video conferencing — dùng Google Meet / Zoom.</li>
            <li>Authoring SCORM phức tạp — P3 stretch.</li>
            <li>HR performance review — Bitrix24 / HRIS vẫn là nguồn chính.</li>
          </ul>
        </Section>

        <Section id="personas" title="4 · Personas" kicker="Users">
          <PersonaGrid />
        </Section>

        <Section id="status" title="5 · Trạng thái phát hành" kicker="Release">
          <p>
            Phân thành các pha nhỏ, mỗi pha ship được end-to-end. Bản dưới đây
            đồng bộ với <code>docs/ROADMAP-PHASES.md</code> tại thời điểm cập
            nhật PRD này.
          </p>
          <ReleaseTimelineSVG />
          <Legend />
          <PhaseTable />
        </Section>

        <Section id="features" title="6 · Yêu cầu chức năng (P1)" kicker="Functional">
          <FeatureBlock
            id="f-auth"
            title="6.1 · Authentication & accounts"
            bullets={[
              "Đăng nhập bằng email hoặc AD username + mật khẩu.",
              "LDAP/AD bind — cấu hình hoàn toàn trong Admin UI (Windows Server 2019+).",
              "Hai đường provisioning: JIT khi đăng nhập lần đầu, hoặc Admin sub-tree picker (/admin/ldap/sync).",
              "Nightly attribute sync cập nhật tên / phòng ban / chức danh.",
              "Vai trò: USER · HR · ADMIN, có ma trận quyền chi tiết (/admin/roles).",
              "Account lifecycle: enable / disable, force reset password.",
              "Allowed email domain enforced ở sign-up + LDAP login.",
            ]}
          />
          <AuthFlowSVG />

          <FeatureBlock
            id="f-content"
            title="6.2 · Khóa học & nội dung"
            bullets={[
              "7 kiểu nội dung: HTML · VIDEO_FILE · VIDEO_EMBED · PDF · PPTX/PPT · SLIDES_GOOGLE · MARKDOWN.",
              "Drag-and-drop upload (≤ 500 MB) cho các kiểu upload, lưu dưới COURSE_ASSETS_DIR.",
              "Category có màu, sort order, mô tả.",
              "Tags, level (beginner/intermediate/advanced), duration.",
              "Publish toggle (ẩn không xóa).",
              "Cờ isMandatory hiển thị trên dashboard analytics.",
              "Browse, search, filter; recently added; recommended for you.",
            ]}
          />
          <ContentKindsSVG />

          <FeatureBlock
            id="f-progress"
            title="6.3 · Tiến độ học (Progress)"
            bullets={[
              "Auto-save scroll-based mỗi 2s, debounce 1.2s trước khi persist.",
              "postMessage({type:\"lms:progress\", percent}) cho signal phong phú từ HTML khóa học.",
              "Action \"Mark complete\" thủ công.",
              "completedAt bất biến sau khi set; activity tiếp theo chỉ cập nhật lastSeenAt.",
            ]}
          />

          <FeatureBlock
            id="f-quiz"
            title="6.4 · Quiz & đánh giá"
            bullets={[
              "Question bank theo khóa hoặc dùng chung.",
              "Loại câu hỏi: single-choice · multiple-choice · true/false · fill-in-blank · short-answer.",
              "Cấu hình per-quiz: pass score %, max attempts, shuffle, time limit.",
              "Mỗi attempt lưu answers + score + duration.",
              "Pass → certificate (nếu khóa có).",
            ]}
          />
          <QuizFlowSVG />

          <FeatureBlock
            id="f-cert"
            title="6.5 · Chứng chỉ (Certificates)"
            bullets={[
              "Tự cấp khi pass (hoặc khi hoàn thành khóa không có quiz).",
              "Mã verify công khai /verify/<code> — bất cứ ai có URL đều xác thực được, không cần đăng nhập.",
              "In trực tiếp HTML certificate, style theo brand Demo.",
              "Tùy chọn expiresAt cho compliance training; HR thấy cảnh báo expire.",
            ]}
          />

          <FeatureBlock
            id="f-paths"
            title="6.6 · Learning paths"
            bullets={[
              "Chuỗi khóa học có thứ tự; tùy chọn prerequisite.",
              "Path completion = mọi bước hoàn thành.",
              "Path certificate (meta-credential).",
            ]}
          />

          <FeatureBlock
            id="f-access"
            title="6.7 · Phân quyền truy cập"
            bullets={[
              "USER chỉ thấy khóa được grant (direct hoặc qua CategoryGrant).",
              "HR thấy tất cả (read-only trên user data, full reports).",
              "ADMIN thấy tất cả + mutate.",
            ]}
          />
          <PermissionModelSVG />

          <FeatureBlock
            id="f-ai"
            title="6.8 · AI integration"
            bullets={[
              "Admin đăng ký nhiều AI provider: OpenAI · Anthropic · Google Gemini · Custom OpenAI-compatible (Azure / Together / Mistral / …).",
              "\"Fetch latest models\" kéo danh sách live; admin chọn model theo use case.",
              "Learner: Ask the course (RAG), Explain this concept, Summarize for me.",
              "Admin: Generate quiz từ nội dung, Suggest categories / tags.",
              "Mỗi call AI sinh AiUsage record (provider, model, tokens, cost, latency).",
              "Per-user daily token budget — admin cấu hình.",
            ]}
          />
          <AIFlowSVG />

          <FeatureBlock
            id="f-notify"
            title="6.9 · Thông báo"
            bullets={[
              "In-app bell với unread count, list, mark-as-read.",
              "Trigger (P1): course assigned · cert earned · announcement · quiz graded · cert sắp expire.",
              "Email delivery opt-in & adapter-pluggable (P1 console logger; SMTP ở P2).",
            ]}
          />

          <FeatureBlock
            id="f-audit"
            title="6.10 · Audit log"
            bullets={[
              "Mọi mutation của ADMIN / HR đều ghi nhận: actor, action, target, diff (JSON), timestamp, IP, UA.",
              "View filter trong Admin.",
            ]}
          />

          <FeatureBlock
            id="f-reports"
            title="6.11 · Báo cáo HR"
            bullets={[
              "Active employee theo phòng ban.",
              "Course / category completion rate.",
              "Mandatory training compliance (% completed + expiring).",
              "Lịch sử học cá nhân (timeline).",
              "CSV export.",
            ]}
          />

          <FeatureBlock
            id="f-org"
            title="6.11a · Org analytics dashboard"
            bullets={[
              "KPI band: active users · published courses · certificates · quiz pass rate.",
              "Sparkline 90-day completion + total.",
              "Mandatory compliance per course.",
              "Top courses, top learners, headcount by department.",
            ]}
          />

          <FeatureBlock
            id="f-sec"
            title="6.11b · Site security"
            bullets={[
              "Admin cấu hình: password policy (length + classes + age), brute-force lockout, session idle timeout, admin re-auth window, allowed email domain, admin IP CIDR allowlist, HSTS.",
              "Settings cache 60s; live change áp dụng trong lần sign-in kế.",
            ]}
          />

          <FeatureBlock
            id="f-rbac"
            title="6.11c · RBAC matrix"
            bullets={[
              "Admin gán bất kỳ trong 23 stable permission key cho bất kỳ 3 vai trò.",
              "Defaults theo seed; \"Reset to defaults\" khôi phục.",
              "Helper hasPermission(role, key) cho in-page gates.",
            ]}
          />

          <FeatureBlock
            id="f-i18n"
            title="6.12 · Internationalization (P1 minimum)"
            bullets={[
              "Toàn bộ string UI đã sẵn sàng dịch (VN + EN).",
              "Locale mặc định theo trình duyệt; user có thể override trong profile.",
              "Nội dung khóa học giữ nguyên locale của tác giả.",
            ]}
          />
        </Section>

        <Section id="nfr" title="7 · Non-functional requirements" kicker="NFR">
          <Table
            head={["Area", "Requirement"]}
            rows={[
              ["Performance", "TTFB p95 ≤ 250 ms · route navigation p95 ≤ 600 ms trên cable broadband"],
              ["Scalability", "App stateless, ≥ 4 replicas sau LB; DB primary + read replica đỡ 10k MAU"],
              ["Availability", "99.5% (internal SLA)"],
              ["Security", "OWASP top 10 mitigated · secrets encrypted at rest · CSP iframe · audit log immutable"],
              ["Privacy", "GDPR-aligned · user data export & deletion (P2)"],
              ["Accessibility", "WCAG 2.2 AA cho chrome; nội dung khóa do tác giả chịu trách nhiệm"],
              ["i18n", "Strings externalised · RTL-ready"],
              ["Browser support", "Chrome / Edge / Firefox / Safari (2 versions mới nhất); mobile Safari / Chrome"],
              ["Telemetry", "Server request log + structured app log · opt-out analytics cho learner"],
            ]}
          />
        </Section>

        <Section id="arch" title="8 · Kiến trúc kỹ thuật" kicker="Architecture">
          <p>
            Stack: <code>Next.js 16 App Router</code> · <code>Auth.js v5</code> ·{" "}
            <code>Prisma 6</code> · <code>PostgreSQL 16</code> ·{" "}
            <code>Tailwind v4</code> · <code>ldapts</code>. Triển khai qua Docker
            Compose (host port 3940 cho app, 3942 loopback-only cho DB).
          </p>
          <ArchitectureSVG />
          <h3 className="mt-6 font-semibold">Phân lớp dữ liệu khóa học</h3>
          <Table
            head={["Kind", "Storage", "Player route"]}
            rows={[
              ["HTML", "File trong COURSES_DIR", "/courses-html/[slug]"],
              ["VIDEO_FILE", "Upload trong COURSE_ASSETS_DIR", "/courses-asset/[file] (Range)"],
              ["VIDEO_EMBED", "External URL (embedUrl)", "provider iframe"],
              ["PDF", "Upload trong COURSE_ASSETS_DIR", "/courses-asset/[file]"],
              ["PPTX / PPT", "Upload + Office Online", "Office Online iframe"],
              ["SLIDES_GOOGLE", "External URL", "docs.google.com iframe"],
              ["MARKDOWN", "Inline contentMd", "rendered in-app"],
            ]}
          />
        </Section>

        <Section id="ux" title="9 · UX principles" kicker="Design">
          <ol className="list-decimal pl-5">
            <li><b>Content-first.</b> Nội dung khóa lấp đầy viewport; chrome co lại.</li>
            <li><b>Earned motion.</b> Animate state change, không trang trí.</li>
            <li><b>One bold accent.</b> Coral-red dành cho CTA quan trọng nhất.</li>
            <li><b>System theme by default.</b> Light & dark bình đẳng.</li>
            <li><b>Keyboard-first.</b> ⌘K palette mọi page; tab order hợp lý.</li>
            <li><b>Trust signals.</b> Status pill (saved / saving / offline) cho mọi auto-persist.</li>
          </ol>
        </Section>

        <Section id="risks" title="10 · Risks & mitigation" kicker="Risk">
          <Table
            head={["Risk", "Mitigation"]}
            rows={[
              ["HTML khóa học phá chrome (set document.title, …)", "Sandboxed iframe; CSP cấm navigation; portal sở hữu chrome bên ngoài frame"],
              ["LDAP cấu hình sai khóa toàn công ty", "Local admin luôn dùng được; \"test connection\" gated sau admin role"],
              ["AI chi phí phình", "Per-user token budget; cost log; admin pause provider 1 click"],
              ["Audit cần proof of training", "Audit log + verifiable certificate URL từ ngày đầu"],
              ["Roadmap lỗi thời", "Re-survey enterprise LMS mỗi 6 tháng, ghi gap vào PRD"],
            ]}
          />
        </Section>

        <Section id="links" title="11 · Tài liệu liên quan" kicker="Docs">
          <ul className="list-disc pl-5">
            <li><a className="underline" href="/manual">User Manual (tiếng Việt) ↗</a></li>
            <li><code>docs/PRD.md</code> · <code>docs/ROADMAP-PHASES.md</code></li>
            <li><code>docs/ARCHITECTURE.md</code> · <code>docs/TECH-ARCHITECTURE.md</code></li>
            <li><code>docs/SECURITY.md</code> · <code>docs/RBAC.md</code></li>
            <li><code>docs/AUTH-LDAP.md</code> · <code>docs/ADMIN-GUIDE.md</code></li>
            <li><code>docs/AUTHORING-COURSES.md</code> · <code>docs/REPORTS.md</code></li>
          </ul>
        </Section>

        <Footer />
      </div>
    </main>
  );
}

/* ──────────────────────────  Layout primitives  ──────────────────────── */

function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">Y</span>
          <span>Demo Learning</span>
          <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">PRD</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/manual" className="rounded-md px-3 py-1.5 hover:bg-[var(--muted)]">User manual</Link>
          <Link href="/login" className="rounded-md bg-[var(--primary)] px-3 py-1.5 font-medium text-[var(--primary-foreground)] hover:opacity-90">Mở portal</Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-mesh">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Product Requirements Document · v1.0 · 2026-05-19</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-gradient-brand">Demo Learning Portal</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted-foreground)]">
          LMS nội bộ cho ~500 nhân viên Demo — discover, learn, prove. Hỗ trợ
          7 kiểu nội dung, quiz & certificate, learning paths, AD/LDAP SSO, AI
          provider plug-and-play, RBAC matrix, audit log, và bảng phân tích cấp
          tổ chức.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          <Badge>Next.js 16</Badge>
          <Badge>Auth.js v5</Badge>
          <Badge>Prisma 6 + Postgres 16</Badge>
          <Badge>Tailwind v4</Badge>
          <Badge>LDAP / AD</Badge>
          <Badge>OpenAI · Anthropic · Gemini</Badge>
        </div>
      </div>
    </section>
  );
}

function TableOfContents() {
  const items = [
    ["overview", "1 · Tổng quan"],
    ["problem", "2 · Vấn đề"],
    ["goals", "3 · Mục tiêu"],
    ["personas", "4 · Personas"],
    ["status", "5 · Trạng thái phát hành"],
    ["features", "6 · Yêu cầu chức năng"],
    ["nfr", "7 · NFR"],
    ["arch", "8 · Kiến trúc"],
    ["ux", "9 · UX"],
    ["risks", "10 · Risks"],
    ["links", "11 · Tài liệu"],
  ];
  return (
    <nav aria-label="Mục lục" className="my-8 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      {kicker && <div className="text-xs uppercase tracking-widest text-[var(--brand-coral)]">{kicker}</div>}
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
      <div className="prose prose-sm mt-4 max-w-none space-y-3 text-[var(--foreground)] sm:prose-base">{children}</div>
    </section>
  );
}

function FeatureBlock({ id, title, bullets }: { id: string; title: string; bullets: string[] }) {
  return (
    <div id={id} className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted-foreground)]">
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <thead className="bg-[var(--muted)]">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((r, i) => (
            <tr key={i} className="bg-[var(--card)]">
              {r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[var(--muted-foreground)]">{children}</span>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border-l-4 border-[var(--brand-coral)] bg-[color-mix(in_oklab,var(--brand-coral)_8%,var(--card))] p-4 text-sm">
      {children}
    </div>
  );
}

function Stats() {
  const items = [
    ["~500", "nhân viên target"],
    ["7", "kiểu nội dung"],
    ["23", "permission keys"],
    ["3+1", "AI providers"],
    ["99.5%", "uptime SLA"],
  ];
  return (
    <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(([n, l]) => (
        <div key={l} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-2xl font-bold text-gradient-brand">{n}</div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
      <span>✅ done</span><span>🚧 in this build</span><span>⏳ planned</span><span>🧊 backlog</span>
    </div>
  );
}

function PhaseTable() {
  return (
    <Table
      head={["Pha", "Mục tiêu", "Trạng thái"]}
      rows={[
        ["P0 — Foundations", "Auth chain, catalog, viewer, admin scaffold, docker compose", "✅"],
        ["P1.5 — Production core", "Quiz, certificate, learning path, AI, notification, audit, profile, i18n, e2e", "✅"],
        ["P1.6 — Admin & content depth", "Multi-format content, 500MB upload, LDAP sub-tree picker, Security admin, RBAC matrix, Org analytics", "✅"],
        ["P2 — Engagement & scale", "Gamification, discussion, skills, SAML, SMTP/Slack, webhooks, adaptive reco, …", "⏳ Q3 2026"],
        ["P3 — Enterprise stretch", "SCORM, mobile app, MCP server, multi-tenant, e-commerce, …", "🧊"],
      ]}
    />
  );
}

function PersonaGrid() {
  const people = [
    { name: "Demo Marketing", role: "Marketing executive · Learner", color: "var(--brand-coral)", cares: ["Curated, byte-sized training", "Mobile-friendly trên đường đi làm", "Progress saved · badges · clear next step"] },
    { name: "Demo Engineering", role: "Engineering lead · Course author", color: "var(--brand-red)", cares: ["Push khóa lên category, grant cho team trong vài phút", "Quiz validate hiểu bài", "Analytics theo cohort"] },
    { name: "Demo HR", role: "HR Business Partner", color: "var(--success)", cares: ["Compliance training & onboarding", "Department dashboard, CSV export", "Cert verifiable · mandatory enforcement · renewal"] },
    { name: "Demo IT", role: "IT Admin · Platform owner", color: "var(--brand-navy)", cares: ["AD config · users · AI keys · backup", "Security posture · audit trail", "Uptime · scaling"] },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {people.map((p) => (
        <div key={p.name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full font-bold text-white" style={{ background: p.color }}>
              {p.name[0]}
            </div>
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{p.role}</div>
            </div>
          </div>
          <ul className="mt-3 list-disc pl-5 text-sm text-[var(--muted-foreground)]">
            {p.cares.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)]">
      <div>© {new Date().getFullYear()} Demo Group · Internal — distribute responsibly.</div>
      <div className="flex gap-3">
        <Link href="/manual" className="underline">User Manual (VI)</Link>
        <Link href="/login" className="underline">Mở portal</Link>
      </div>
    </footer>
  );
}

/* ──────────────────────────────  Diagrams  ───────────────────────────── */
/* Excalidraw-style: rounded rects, slight playful skew, sketchy stroke.   */

function SVGCard({ title, children, height = 360 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <figure className="my-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
      <svg viewBox={`0 0 900 ${height}`} className="h-auto w-full" role="img" aria-label={title}>
        {children}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-[var(--muted-foreground)]">{title}</figcaption>
    </figure>
  );
}

function SketchyBox({ x, y, w, h, fill = "#fff", stroke = "#0b1020", label, sub, rotate = 0 }: { x: number; y: number; w: number; h: number; fill?: string; stroke?: string; label: string; sub?: string; rotate?: number }) {
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={14} ry={14} fill={fill} stroke={stroke} strokeWidth={1.6} />
      <rect x={x + 3} y={y + 3} width={w} height={h} rx={14} ry={14} fill="none" stroke={stroke} strokeWidth={0.6} opacity={0.4} />
      <text x={cx} y={cy + (sub ? -4 : 5)} textAnchor="middle" fontSize={14} fontWeight={700} fill={stroke} fontFamily="Inter, system-ui">{label}</text>
      {sub && <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={stroke} opacity={0.7} fontFamily="Inter, system-ui">{sub}</text>}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label, color = "#0b1020", dashed }: { x1: number; y1: number; x2: number; y2: number; label?: string; color?: string; dashed?: boolean }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
  return (
    <g>
      <defs>
        <marker id={`ah-${color.replace(/[^a-z0-9]/gi, "")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? "5 4" : undefined} markerEnd={`url(#ah-${color.replace(/[^a-z0-9]/gi, "")})`} />
      {label && <text x={mx} y={my} textAnchor="middle" fontSize={11} fill={color} fontFamily="Inter, system-ui">{label}</text>}
    </g>
  );
}

function SystemOverviewSVG() {
  return (
    <SVGCard title="Hình 1 — Tổng quan hệ thống Demo Learning" height={380}>
      <rect x="20" y="20" width="860" height="340" rx="20" fill="#fff8f5" stroke="#ea403f" strokeDasharray="6 5" opacity="0.6" />
      <text x="40" y="46" fontSize="12" fill="#ea403f" fontWeight={700} fontFamily="Inter, system-ui">Demo Learning Portal</text>

      <SketchyBox x={50} y={90} w={170} h={70} label="Learner" sub="USER · ~500" fill="#fff" stroke="#0b1020" rotate={-1} />
      <SketchyBox x={50} y={180} w={170} h={70} label="HR" sub="reports + view" fill="#fff" stroke="#0b1020" />
      <SketchyBox x={50} y={270} w={170} h={70} label="Admin / IT" sub="configures everything" fill="#fff" stroke="#0b1020" rotate={1} />

      <SketchyBox x={310} y={90} w={280} h={250} label="Demo Portal" sub="Next.js 16 · Tailwind v4" fill="#ffffff" stroke="#d82827" />
      <text x={450} y={170} textAnchor="middle" fontSize={11} fill="#0b1020">Catalog · Viewer · Quiz</text>
      <text x={450} y={190} textAnchor="middle" fontSize={11} fill="#0b1020">Cert · Paths · AI · Reports</text>
      <text x={450} y={210} textAnchor="middle" fontSize={11} fill="#0b1020">Admin: Users · Roles · LDAP</text>
      <text x={450} y={230} textAnchor="middle" fontSize={11} fill="#0b1020">Security · Audit · Announcements</text>

      <SketchyBox x={670} y={90} w={190} h={70} label="PostgreSQL 16" sub="Prisma 6" fill="#fff" stroke="#15a37a" />
      <SketchyBox x={670} y={180} w={190} h={70} label="AD / LDAP" sub="ldapts client" fill="#fff" stroke="#0b1020" rotate={-1} />
      <SketchyBox x={670} y={270} w={190} h={70} label="AI providers" sub="OpenAI · Anthropic · Gemini" fill="#fff" stroke="#d97706" rotate={1} />

      <Arrow x1={220} y1={125} x2={310} y2={150} label="HTTPS" />
      <Arrow x1={220} y1={215} x2={310} y2={210} />
      <Arrow x1={220} y1={305} x2={310} y2={270} />
      <Arrow x1={590} y1={150} x2={670} y2={125} label="SQL" color="#15a37a" />
      <Arrow x1={590} y1={210} x2={670} y2={215} label="bind / search" />
      <Arrow x1={590} y1={270} x2={670} y2={305} label="HTTPS" color="#d97706" />
    </SVGCard>
  );
}

function ReleaseTimelineSVG() {
  const phases = [
    { x: 40, label: "P0", sub: "Foundations", color: "#15a37a", done: true },
    { x: 230, label: "P1.5", sub: "Production core", color: "#15a37a", done: true },
    { x: 420, label: "P1.6", sub: "Admin & depth", color: "#15a37a", done: true },
    { x: 610, label: "P2", sub: "Engagement", color: "#d97706", done: false },
    { x: 790, label: "P3", sub: "Enterprise", color: "#5b6478", done: false },
  ];
  return (
    <SVGCard title="Hình 2 — Lộ trình phát hành" height={180}>
      <line x1="40" y1="100" x2="860" y2="100" stroke="#0b1020" strokeWidth="2" />
      {phases.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={100} r={14} fill={p.done ? p.color : "#fff"} stroke={p.color} strokeWidth={2.5} />
          {p.done && <text x={p.x} y={105} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>✓</text>}
          <text x={p.x} y={60} textAnchor="middle" fontSize={14} fontWeight={700} fill={p.color}>{p.label}</text>
          <text x={p.x} y={140} textAnchor="middle" fontSize={11} fill="#0b1020">{p.sub}</text>
        </g>
      ))}
      <text x={450} y={170} textAnchor="middle" fontSize={11} fill="#5b6478" fontFamily="Inter, system-ui">2025 Q4 ─────────── 2026 Q1 ─────────── 2026 Q2 (now) ─────────── 2026 Q3 ─────────── 2026 Q4+</text>
    </SVGCard>
  );
}

function AuthFlowSVG() {
  return (
    <SVGCard title="Hình 3 — Authentication chain (local → LDAP/AD → JIT provision)" height={300}>
      <SketchyBox x={30} y={120} w={150} h={60} label="User" sub="email + pass" />
      <SketchyBox x={230} y={120} w={170} h={60} label="/login" sub="Server action" stroke="#d82827" />
      <SketchyBox x={450} y={40} w={170} h={60} label="Local store" sub="bcrypt compare" stroke="#15a37a" />
      <SketchyBox x={450} y={200} w={170} h={60} label="LDAP/AD" sub="bind + search" stroke="#d97706" />
      <SketchyBox x={680} y={120} w={180} h={60} label="JWT session" sub="{ uid, role, source }" stroke="#0b1020" />

      <Arrow x1={180} y1={150} x2={230} y2={150} label="POST" />
      <Arrow x1={400} y1={140} x2={450} y2={70} label="1) try local" color="#15a37a" />
      <Arrow x1={400} y1={160} x2={450} y2={230} label="2) fallback" color="#d97706" />
      <Arrow x1={620} y1={70} x2={680} y2={140} label="ok" color="#15a37a" />
      <Arrow x1={620} y1={230} x2={680} y2={160} label="JIT user" color="#d97706" />
    </SVGCard>
  );
}

function ContentKindsSVG() {
  const kinds = [
    { x: 40, color: "#d82827", label: "HTML", sub: "courses-html/[slug]" },
    { x: 200, color: "#5b6478", label: "VIDEO_FILE", sub: "Range stream" },
    { x: 360, color: "#5b6478", label: "VIDEO_EMBED", sub: "YT/Vimeo/Loom" },
    { x: 520, color: "#d97706", label: "PDF", sub: "browser viewer" },
    { x: 40, y: 200, color: "#d97706", label: "PPTX / PPT", sub: "Office Online" },
    { x: 200, y: 200, color: "#15a37a", label: "SLIDES_GOOGLE", sub: "docs.google.com" },
    { x: 360, y: 200, color: "#0b1020", label: "MARKDOWN", sub: "inline contentMd" },
    { x: 520, y: 200, color: "#ea403f", label: "Player", sub: "auth + canAccess" },
  ];
  return (
    <SVGCard title="Hình 4 — 7 kiểu nội dung khóa học" height={320}>
      {kinds.map((k, i) => (
        <SketchyBox key={i} x={k.x} y={k.y ?? 70} w={150} h={70} label={k.label} sub={k.sub} stroke={k.color} rotate={i % 2 === 0 ? -1 : 1} />
      ))}
      <SketchyBox x={720} y={130} w={150} h={80} label="Learner" sub="watches / reads" />
      <Arrow x1={670} y1={235} x2={720} y2={170} />
    </SVGCard>
  );
}

function QuizFlowSVG() {
  return (
    <SVGCard title="Hình 5 — Quiz · Pass · Certificate" height={220}>
      <SketchyBox x={40} y={70} w={150} h={70} label="Course" sub="content viewed" />
      <SketchyBox x={240} y={70} w={150} h={70} label="Quiz attempt" sub="answers + duration" stroke="#d82827" />
      <SketchyBox x={440} y={70} w={150} h={70} label="Score ≥ pass %" sub="QuestionBank" stroke="#0b1020" rotate={1} />
      <SketchyBox x={640} y={70} w={210} h={70} label="Certificate" sub="/verify/<code> · expiresAt?" stroke="#15a37a" />
      <Arrow x1={190} y1={105} x2={240} y2={105} />
      <Arrow x1={390} y1={105} x2={440} y2={105} />
      <Arrow x1={590} y1={105} x2={640} y2={105} label="auto-issue" color="#15a37a" />
    </SVGCard>
  );
}

function PermissionModelSVG() {
  return (
    <SVGCard title="Hình 6 — Mô hình phân quyền (3 vai trò × 23 keys + course grants)" height={320}>
      <SketchyBox x={40} y={40} w={170} h={70} label="USER" sub="enrol + read" />
      <SketchyBox x={40} y={130} w={170} h={70} label="HR" sub="reports + view" stroke="#d97706" />
      <SketchyBox x={40} y={220} w={170} h={70} label="ADMIN" sub="all + mutate" stroke="#d82827" />
      <SketchyBox x={290} y={130} w={250} h={70} label="RolePermission matrix" sub="23 keys × 3 roles (live editable)" stroke="#0b1020" />
      <SketchyBox x={620} y={40} w={240} h={70} label="CategoryGrant" sub="category → roles / users" stroke="#5b6478" />
      <SketchyBox x={620} y={130} w={240} h={70} label="Enrollment" sub="direct course grant" stroke="#5b6478" />
      <SketchyBox x={620} y={220} w={240} h={70} label="canAccessCourse(user, role, course)" sub="effective decision" stroke="#15a37a" />

      <Arrow x1={210} y1={75} x2={290} y2={150} />
      <Arrow x1={210} y1={165} x2={290} y2={165} />
      <Arrow x1={210} y1={255} x2={290} y2={185} />
      <Arrow x1={540} y1={150} x2={620} y2={75} />
      <Arrow x1={540} y1={165} x2={620} y2={165} />
      <Arrow x1={540} y1={185} x2={620} y2={255} label="enforce" color="#15a37a" />
    </SVGCard>
  );
}

function AIFlowSVG() {
  return (
    <SVGCard title="Hình 7 — Tích hợp AI provider · learner & admin tools" height={320}>
      <SketchyBox x={40} y={130} w={170} h={70} label="Learner" sub="ask · explain · summary" />
      <SketchyBox x={40} y={40} w={170} h={70} label="Admin author" sub="generate quiz · tags" stroke="#d82827" />
      <SketchyBox x={260} y={85} w={210} h={70} label="AI adapter library" sub="OpenAI · Anthropic · Gemini · Custom" stroke="#0b1020" />
      <SketchyBox x={520} y={40} w={170} h={70} label="OpenAI" stroke="#15a37a" />
      <SketchyBox x={520} y={130} w={170} h={70} label="Anthropic" stroke="#5b6478" />
      <SketchyBox x={520} y={220} w={170} h={70} label="Gemini · Custom" stroke="#d97706" />
      <SketchyBox x={720} y={130} w={150} h={70} label="AiUsage log" sub="tokens · cost · ms" stroke="#0b1020" />

      <Arrow x1={210} y1={75} x2={260} y2={110} />
      <Arrow x1={210} y1={165} x2={260} y2={130} />
      <Arrow x1={470} y1={110} x2={520} y2={75} />
      <Arrow x1={470} y1={120} x2={520} y2={165} />
      <Arrow x1={470} y1={140} x2={520} y2={255} />
      <Arrow x1={690} y1={165} x2={720} y2={165} dashed />
    </SVGCard>
  );
}

function ArchitectureSVG() {
  return (
    <SVGCard title="Hình 8 — Kiến trúc triển khai" height={360}>
      <rect x="20" y="20" width="860" height="320" rx="20" fill="#ffffff" stroke="#0b1020" strokeDasharray="5 4" opacity="0.6" />
      <text x="40" y="44" fontSize="12" fontWeight={700} fill="#0b1020">Browser ↔ Next.js 16 ↔ Prisma ↔ Postgres</text>

      <SketchyBox x={50} y={70} w={200} h={70} label="Browser" sub="Tailwind · React 19" />
      <SketchyBox x={50} y={170} w={200} h={70} label="Public routes" sub="/login · /verify · /prd · /manual" stroke="#15a37a" />
      <SketchyBox x={50} y={270} w={200} h={50} label="proxy.ts" sub="auth + RBAC + rate-limit + CSP" stroke="#d82827" />

      <SketchyBox x={310} y={70} w={260} h={250} label="" stroke="#0b1020" />
      <text x={440} y={95} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b1020">(app) authenticated shell</text>
      <text x={440} y={120} textAnchor="middle" fontSize={11} fill="#0b1020">/dashboard · /courses · /courses/[slug]</text>
      <text x={440} y={140} textAnchor="middle" fontSize={11} fill="#0b1020">/my-learning · /paths · /profile · /hr</text>
      <text x={440} y={160} textAnchor="middle" fontSize={11} fill="#d82827" fontWeight={700}>/admin/* (Users · Roles · Courses)</text>
      <text x={440} y={180} textAnchor="middle" fontSize={11} fill="#d82827">(Categories · LDAP · Security)</text>
      <text x={440} y={200} textAnchor="middle" fontSize={11} fill="#d82827">(AI · Audit · Reports · Quizzes · Paths)</text>
      <text x={440} y={230} textAnchor="middle" fontSize={11} fill="#0b1020">Server Components + Server Actions</text>
      <text x={440} y={250} textAnchor="middle" fontSize={11} fill="#0b1020">Route handlers (auth-gated)</text>
      <text x={440} y={280} textAnchor="middle" fontSize={11} fill="#0b1020">/courses-html/[slug] · /courses-asset/[file]</text>

      <SketchyBox x={620} y={70} w={240} h={60} label="Auth.js v5" sub="credentials + LDAP chain" stroke="#0b1020" />
      <SketchyBox x={620} y={150} w={240} h={60} label="Prisma 6" sub="schema · migrations" stroke="#5b6478" />
      <SketchyBox x={620} y={230} w={240} h={60} label="Postgres 16" sub="primary [+ read replica P2]" stroke="#15a37a" />

      <Arrow x1={250} y1={105} x2={310} y2={140} />
      <Arrow x1={250} y1={205} x2={310} y2={180} />
      <Arrow x1={570} y1={120} x2={620} y2={100} />
      <Arrow x1={570} y1={170} x2={620} y2={180} />
      <Arrow x1={570} y1={250} x2={620} y2={260} />
    </SVGCard>
  );
}
