import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng · Demo Learning",
  description: "Sổ tay hướng dẫn sử dụng Conan Learning Portal — dành cho học viên, HR, và quản trị viên.",
};

// Public Vietnamese user manual. Server component, no auth required.
export default function ManualPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopNav />
      <Hero />
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <TableOfContents />

        <Section id="bat-dau" title="1 · Bắt đầu" kicker="Khởi động">
          <p>
            Mở trình duyệt và truy cập đường dẫn portal Demo (ví dụ{" "}
            <code>https://learning.demo.com</code>). Trang đăng nhập là{" "}
            <Link className="underline" href="/login">/login</Link>.
          </p>
          <h3 className="mt-4 font-semibold">Yêu cầu trình duyệt</h3>
          <ul className="list-disc pl-5">
            <li>Chrome / Edge / Firefox / Safari — 2 phiên bản mới nhất.</li>
            <li>Mobile Safari hoặc Chrome cho điện thoại.</li>
            <li>JavaScript bật, cookies cho phép cho domain portal.</li>
          </ul>

          <h3 className="mt-4 font-semibold">Ba kiểu tài khoản</h3>
          <RoleCards />
        </Section>

        <Section id="dang-nhap" title="2 · Đăng nhập" kicker="Auth">
          <Steps
            items={[
              <>Mở <Link className="underline" href="/login">/login</Link>. Có 2 ô: <b>Email / Username</b> và <b>Password</b>.</>,
              <>Nhập email công ty (vd. <code>demo@demo.com</code>) hoặc <b>username AD</b> (vd. <code>DEMO\\demo</code> hoặc <code>demo</code>).</>,
              <>Nhập mật khẩu. Đối với tài khoản AD, dùng mật khẩu máy tính công ty.</>,
              <>Nhấn <b>Đăng nhập</b>. Nếu chính xác, bạn sẽ được điều hướng tới <Link className="underline" href="/dashboard">/dashboard</Link>.</>,
              <>Quên mật khẩu: liên hệ IT (Trí) để reset, hoặc tự đăng nhập lại bằng tài khoản AD nếu công ty đã bật LDAP.</>,
            ]}
          />
          <Note>
            <b>Khóa tài khoản tạm thời:</b> nhập sai mật khẩu quá số lần cho phép sẽ bị
            khóa trong thời gian Admin cấu hình. Đợi qua thời gian khóa hoặc nhờ Admin
            unblock trong <code>/admin/users</code>.
          </Note>
          <AuthFlowSVG />
        </Section>

        <Section id="dashboard" title="3 · Bảng điều khiển (Dashboard)" kicker="Trang chính">
          <DashboardSVG />
          <Steps
            items={[
              <>Sau khi đăng nhập, dashboard hiển thị: <b>Tiếp tục học</b>, <b>Khuyến nghị cho bạn</b>, <b>Khóa mới thêm</b>, và <b>Chứng chỉ gần đây</b>.</>,
              <>Nhấn vào ảnh card bất kỳ để mở khóa học. Khóa đã từng học sẽ hiện thanh tiến độ và mở đúng vị trí lần trước.</>,
              <>Thanh navigation bên trái có: <b>Dashboard · Khóa học · Lộ trình · Học của tôi · Hồ sơ</b>.</>,
              <>Bên phải có chuông <b>Thông báo</b> — số đỏ là số thông báo chưa đọc.</>,
              <>Tổ hợp phím <b>⌘K (Cmd+K / Ctrl+K)</b> mở Command Palette để tìm nhanh khóa học, người dùng, hoặc trang admin.</>,
            ]}
          />
        </Section>

        <Section id="kham-pha" title="4 · Khám phá & học khóa học" kicker="Learn">
          <Steps
            items={[
              <>Vào <Link className="underline" href="/courses">/courses</Link>. Bạn sẽ thấy lưới card; mỗi card có tag, level, thời lượng.</>,
              <>Lọc theo <b>Danh mục</b> (Category), <b>Tag</b>, <b>Cấp độ</b> (beginner / intermediate / advanced).</>,
              <>Gõ vào ô <b>Tìm kiếm</b> để filter realtime.</>,
              <>Nhấn vào card → vào trang chi tiết khóa học. Trang này có mô tả, learning outcomes, danh sách quiz (nếu có), và nút <b>Bắt đầu / Tiếp tục</b>.</>,
              <>Bấm <b>Bắt đầu</b> để bắt đầu học. Nội dung mở trong khung — tùy kiểu (HTML / video / PDF / slide) sẽ có giao diện player phù hợp.</>,
            ]}
          />
          <h3 className="mt-4 font-semibold">7 kiểu nội dung bạn có thể gặp</h3>
          <ContentKindsSVG />
          <Table
            head={["Kiểu", "Trải nghiệm khi học"]}
            rows={[
              ["HTML", "Bài học tương tác toàn màn hình, có thể có hoạt ảnh / quiz nhúng / playground"],
              ["VIDEO_FILE", "Trình phát video gắn quyền — có tua, full-screen, tốc độ phát"],
              ["VIDEO_EMBED", "YouTube / Vimeo / Loom nhúng trong khung"],
              ["PDF", "Trình đọc PDF trong trình duyệt, có thu phóng và tải về"],
              ["PPTX / PPT", "Slide hiển thị qua Office Online — chuyển slide bằng phím mũi tên"],
              ["SLIDES_GOOGLE", "Google Slides / Docs nhúng, cần quyền xem chia sẻ với công ty"],
              ["MARKDOWN", "Bài đọc ngắn, dễ scroll, dùng cho primer ngắn"],
            ]}
          />

          <h3 className="mt-4 font-semibold">Tiến độ tự lưu</h3>
          <p>
            Khi bạn cuộn nội dung, hệ thống tự lưu tiến độ mỗi 2 giây. Góc trên có
            chỉ báo <b>“Saved · 1m ago”</b>. Khi bạn quay lại, bài học sẽ mở từ
            đúng đoạn lần trước.
          </p>
          <Note>
            Khi học xong, bấm nút <b>Đánh dấu hoàn thành</b> (Mark complete). Nếu
            khóa có quiz, bạn sẽ được mời làm quiz; pass quiz mới được cấp chứng chỉ.
          </Note>
        </Section>

        <Section id="quiz" title="5 · Làm quiz" kicker="Đánh giá">
          <QuizFlowSVG />
          <Steps
            items={[
              <>Từ trang khóa học, bấm <b>Vào quiz</b> (nếu có).</>,
              <>Đọc hướng dẫn: số câu, thời gian, số lần làm tối đa, điểm pass.</>,
              <>Trả lời từng câu. Các loại câu hỏi:
                <ul className="ml-4 list-disc">
                  <li><b>Một đáp án</b> — chọn 1 trong nhiều ô tròn.</li>
                  <li><b>Nhiều đáp án</b> — chọn ≥ 1 ô vuông.</li>
                  <li><b>Đúng/Sai</b>.</li>
                  <li><b>Điền vào chỗ trống</b>.</li>
                  <li><b>Trả lời ngắn</b>.</li>
                </ul>
              </>,
              <>Bấm <b>Nộp bài</b>. Hệ thống chấm và hiển thị điểm + bảng đáp án.</>,
              <>Nếu pass, chứng chỉ tự cấp và xuất hiện ở <Link className="underline" href="/my-learning">/my-learning</Link>.</>,
              <>Nếu chưa pass, bạn có thể làm lại trong giới hạn <b>Max attempts</b>.</>,
            ]}
          />
        </Section>

        <Section id="cert" title="6 · Chứng chỉ & xác minh" kicker="Certificate">
          <Steps
            items={[
              <>Vào <Link className="underline" href="/my-learning">/my-learning</Link> → tab <b>Chứng chỉ</b> để xem các chứng chỉ đã có.</>,
              <>Mỗi chứng chỉ có mã verify dạng <code>DEMO-XXXX-YYYY</code>. Mã này dán vào CV/email được.</>,
              <>Bất kỳ ai (không cần đăng nhập) mở <code>/verify/&lt;code&gt;</code> đều xác thực được chứng chỉ.</>,
              <>Bấm <b>In</b> để in / lưu PDF chứng chỉ theo bộ nhận diện Demo.</>,
              <>Một số chứng chỉ có <b>Ngày hết hạn</b> (compliance). HR sẽ nhắc bạn khi gần hết hạn.</>,
            ]}
          />
          <CertVerifySVG />
        </Section>

        <Section id="path" title="7 · Lộ trình học (Learning paths)" kicker="Paths">
          <Steps
            items={[
              <>Vào <Link className="underline" href="/paths">/paths</Link> để xem danh sách lộ trình (ví dụ: <em>Onboarding Demo</em>, <em>AI Foundations</em>).</>,
              <>Mở lộ trình → thấy chuỗi khóa học theo thứ tự. Có thể có prerequisite (phải xong khóa A mới mở được khóa B).</>,
              <>Hoàn thành mọi bước → nhận <b>Path certificate</b> (meta-credential cho cả lộ trình).</>,
            ]}
          />
        </Section>

        <Section id="hoc-cua-toi" title="8 · Học của tôi & hồ sơ" kicker="My learning">
          <Steps
            items={[
              <>Tab <b>Đang học</b>: các khóa chưa hoàn thành — kèm % tiến độ và link tiếp tục.</>,
              <>Tab <b>Đã hoàn thành</b>: lịch sử khóa đã xong, ngày hoàn thành, điểm quiz.</>,
              <>Tab <b>Chứng chỉ</b>: tất cả chứng chỉ, có link verify, nút in.</>,
              <>Vào <Link className="underline" href="/profile">/profile</Link> để cập nhật ảnh đại diện, ngôn ngữ (VN/EN), đổi mật khẩu (chỉ với tài khoản local).</>,
              <>Trong <Link className="underline" href="/profile">/profile</Link> có toggle <b>Nhận email thông báo</b> (opt-in).</>,
            ]}
          />
        </Section>

        <Section id="ai" title="9 · Trợ lý AI khi học" kicker="AI helper">
          <p>
            Mỗi khóa học có panel <b>Trợ lý AI</b> bên phải (nếu Admin đã bật ít
            nhất một provider). Bạn có 3 chế độ:
          </p>
          <ul className="list-disc pl-5">
            <li><b>Hỏi khóa học (Ask the course)</b> — trợ lý đọc nội dung khóa và trả lời câu hỏi của bạn.</li>
            <li><b>Giải thích đoạn này (Explain this concept)</b> — bôi đen đoạn văn → trợ lý giải thích bằng ngôn ngữ đời thường.</li>
            <li><b>Tóm tắt giúp tôi (Summarize for me)</b> — trả về 5 gạch đầu dòng quan trọng nhất.</li>
          </ul>
          <Note>
            Mỗi user có ngân sách token hàng ngày do Admin cấu hình. Khi dùng hết
            sẽ thấy thông báo. Quay lại ngày hôm sau hoặc nhờ Admin tăng quota.
          </Note>
          <AIHelperSVG />
        </Section>

        <Section id="thong-bao" title="10 · Thông báo" kicker="Notify">
          <Steps
            items={[
              <>Bấm icon chuông góc phải header. Danh sách thông báo hiện ra, số chấm đỏ = số chưa đọc.</>,
              <>Loại thông báo: <b>khóa mới được giao</b>, <b>chứng chỉ vừa được cấp</b>, <b>thông báo chung từ công ty</b>, <b>quiz đã chấm</b>, <b>chứng chỉ sắp hết hạn</b>.</>,
              <>Bấm vào thông báo → mở đúng trang liên quan. <b>Đánh dấu đã đọc</b> hoặc <b>Đánh dấu tất cả</b>.</>,
            ]}
          />
        </Section>

        <Section id="hr" title="11 · Dành cho HR" kicker="HR view">
          <p>
            Tài khoản vai trò HR có quyền xem báo cáo của toàn công ty, không
            chỉnh sửa người dùng (trừ khi Admin cấp quyền qua RBAC matrix).
          </p>
          <Steps
            items={[
              <>Vào <Link className="underline" href="/hr">/hr</Link> để xem dashboard HR: số nhân viên active, top khóa hoàn thành, % compliance.</>,
              <>Click một khóa để xem chi tiết: ai đã học xong, ai đang học dở, ai chưa bắt đầu.</>,
              <>Trong <Link className="underline" href="/admin/reports">/admin/reports</Link>: chọn <b>Xuất CSV</b> để tải báo cáo về Excel.</>,
              <>Theo dõi <b>Mandatory training</b> — khóa bắt buộc có cờ riêng; bảng compliance hiển thị % hoàn thành & danh sách sắp hết hạn.</>,
            ]}
          />
          <HRDashboardSVG />
        </Section>

        <Section id="admin" title="12 · Dành cho Quản trị viên (Admin)" kicker="Admin">
          <p>
            Vai trò ADMIN truy cập được mục <Link className="underline" href="/admin">/admin</Link>. Bản đồ các trang admin:
          </p>
          <AdminMapSVG />

          <FeatureBlock
            id="a-users"
            title="12.1 · Quản lý người dùng — /admin/users"
            steps={[
              "Bấm + Thêm user → nhập email + tên + role để tạo tài khoản local.",
              "Bấm vào user trong danh sách để xem chi tiết: đổi role, kích hoạt / vô hiệu hóa, force reset password, xem lịch sử học.",
              "Filter theo phòng ban, role, hoặc trạng thái.",
            ]}
          />
          <FeatureBlock
            id="a-ldap"
            title="12.2 · LDAP / AD — /admin/ldap"
            steps={[
              "Cấu hình bind DN, password, base DN, user filter — bấm Test connection trước khi lưu.",
              "Vào /admin/ldap/sync để mở Sub-tree picker: chọn OU, search user trong OU đó, đánh dấu rồi Import — provision local không cần user tự login.",
              "Bật Nightly attribute sync để giữ tên / phòng ban / chức danh đồng bộ với AD.",
            ]}
          />
          <FeatureBlock
            id="a-courses"
            title="12.3 · Khóa học — /admin/courses"
            steps={[
              "Bấm + Tạo khóa → nhập tiêu đề, slug, mô tả, danh mục, level, thời lượng, kiểu (Kind).",
              "Với kiểu HTML: chọn file dưới /courses/. Với upload: drag-and-drop file ≤ 500 MB.",
              "Bật Publish để hiện cho learner. Bật Mandatory nếu khóa bắt buộc.",
              "Quản lý quiz, grant truy cập, learning path từ tab tương ứng.",
            ]}
          />
          <FeatureBlock
            id="a-cat"
            title="12.4 · Danh mục — /admin/categories"
            steps={[
              "Tạo category với màu + thứ tự + mô tả. CategoryGrant cho phép gán cả danh mục cho phòng ban hoặc role.",
            ]}
          />
          <FeatureBlock
            id="a-roles"
            title="12.5 · Ma trận quyền — /admin/roles"
            steps={[
              "Bảng 23 permission key × 3 role. Tick/Untick để bật/tắt.",
              "Bấm Reset to defaults để khôi phục giá trị seed nếu lỡ tay.",
              "Thay đổi áp dụng ngay cho lần render tiếp theo (helper hasPermission).",
            ]}
          />
          <FeatureBlock
            id="a-sec"
            title="12.6 · Site security — /admin/security"
            steps={[
              "Cấu hình: độ dài + lớp ký tự + tuổi mật khẩu, brute-force lockout, idle timeout, admin re-auth window, allowed email domain, admin IP CIDR allowlist, HSTS.",
              "Settings cache 60s; thay đổi ảnh hưởng đến lần sign-in tiếp theo.",
            ]}
          />
          <FeatureBlock
            id="a-ai"
            title="12.7 · AI providers — /admin/ai"
            steps={[
              "Thêm provider: chọn loại (OpenAI / Anthropic / Gemini / Custom), nhập API key.",
              "Bấm Fetch latest models để lấy danh sách model live; chọn model cho từng use case (chat / explain / summary / quiz-gen).",
              "Đặt token budget mỗi user mỗi ngày. Pause provider 1 click nếu chi phí vọt.",
            ]}
          />
          <FeatureBlock
            id="a-quiz"
            title="12.8 · Quiz — /admin/quizzes"
            steps={[
              "Tạo question bank, gán cho 1 hoặc nhiều khóa.",
              "Bấm AI · Generate quiz từ nội dung để tạo nháp 10 câu, sau đó chỉnh tay.",
              "Cấu hình pass score %, max attempts, shuffle questions, time limit.",
            ]}
          />
          <FeatureBlock
            id="a-paths"
            title="12.9 · Learning paths — /admin/paths"
            steps={[
              "Tạo path; thêm khóa theo thứ tự bằng drag-and-drop.",
              "Bật prerequisite nếu khóa B yêu cầu khóa A xong trước.",
              "Bật certificate cho path nếu muốn cấp meta-credential.",
            ]}
          />
          <FeatureBlock
            id="a-reports"
            title="12.10 · Báo cáo & analytics — /admin/reports"
            steps={[
              "KPI band: active users · published courses · certificates · quiz pass rate.",
              "Sparkline 90 ngày completion, top khóa, top learner, headcount theo phòng ban.",
              "Bảng mandatory compliance cho từng khóa — % hoàn thành + danh sách sắp hết hạn.",
              "Bấm Xuất CSV để tải về.",
            ]}
          />
          <FeatureBlock
            id="a-audit"
            title="12.11 · Audit log — /admin/audit"
            steps={[
              "Mọi mutation của ADMIN/HR đều ghi: actor, action, target, diff JSON, IP, UA, timestamp.",
              "Filter theo actor / action / khoảng thời gian.",
            ]}
          />
          <FeatureBlock
            id="a-ann"
            title="12.12 · Thông báo công ty — /admin/announcements"
            steps={[
              "Soạn thông báo, chọn audience (toàn công ty / phòng ban / role). Bấm Đăng để gửi tới chuông thông báo của learner.",
            ]}
          />
        </Section>

        <Section id="tac-gia" title="13 · Mẹo cho tác giả khóa học" kicker="Authoring">
          <ul className="list-disc pl-5">
            <li>Khóa HTML đặt file dưới <code>./courses/</code>. File phải là <em>self-contained</em> (có thể dùng Tailwind CDN, Google Fonts, embed YouTube).</li>
            <li>Để portal lưu tiến độ tinh hơn, phát message: <code>{`postMessage({ type: "lms:progress", percent: 73 })`}</code>.</li>
            <li>Đừng set <code>document.title</code> trong khóa — portal sở hữu chrome bên ngoài iframe.</li>
            <li>Khi tạo quiz, nên có ≥ 5 câu, mix loại (single + multi + true/false).</li>
            <li>Đặt <code>isMandatory</code> chỉ cho khóa compliance — bảng HR sẽ track chặt.</li>
          </ul>
        </Section>

        <Section id="su-co" title="14 · Sự cố thường gặp & cách xử lý" kicker="Troubleshooting">
          <Table
            head={["Triệu chứng", "Nguyên nhân thường gặp", "Cách xử lý"]}
            rows={[
              ["Không đăng nhập được, sai mật khẩu liên tục", "Bị lockout sau quá nhiều lần thử", "Đợi qua cooldown, hoặc nhờ Admin unblock trong /admin/users"],
              ["AD đúng pass mà bị từ chối", "LDAP filter sai hoặc service account hết hạn", "Admin vào /admin/ldap → Test connection, kiểm tra bind DN / filter"],
              ["Video không phát", "Mạng chậm hoặc trình duyệt chặn cookie", "Refresh, đổi browser; với VIDEO_EMBED kiểm tra link public của YouTube/Vimeo"],
              ["Slide Google không xem được", "Quyền share chưa mở cho domain công ty", "Tác giả mở quyền “Anyone with link (Org)” cho file Google Slides"],
              ["Quiz tính sai đáp án", "Question bank chỉnh chưa lưu", "Admin vào /admin/quizzes → mở câu hỏi → Save lại"],
              ["Chứng chỉ verify trả Not found", "Mã sai hoặc cert bị thu hồi", "Đối chiếu mã trong /my-learning; nếu lỗi, mở ticket với HR"],
              ["AI không trả lời", "Hết token budget hoặc provider bị pause", "Đợi qua ngày hoặc nhờ Admin tăng quota / bật lại provider"],
              ["Trang trắng sau khi đăng nhập", "Session hết hạn / cookie bị clear", "Đăng nhập lại; nếu lặp, xóa cookie domain rồi thử lần nữa"],
            ]}
          />
        </Section>

        <Section id="phim-tat" title="15 · Phím tắt" kicker="Shortcuts">
          <Table
            head={["Phím", "Tác dụng"]}
            rows={[
              ["⌘K / Ctrl+K", "Mở Command Palette (tìm khóa, người dùng, trang admin)"],
              ["G → D", "Đi tới Dashboard"],
              ["G → C", "Đi tới Khóa học"],
              ["G → M", "Đi tới Học của tôi"],
              ["? (shift + /)", "Hiện danh sách phím tắt trong app"],
              ["Esc", "Đóng overlay / dialog đang mở"],
            ]}
          />
        </Section>

        <Section id="lien-he" title="16 · Liên hệ hỗ trợ" kicker="Support">
          <ul className="list-disc pl-5">
            <li>Vấn đề tài khoản / quyền: <b>HR + IT</b>.</li>
            <li>Vấn đề kỹ thuật / lỗi hệ thống: <b>IT Admin (Trí)</b> — kênh Slack <code>#learning-portal</code>.</li>
            <li>Đóng góp nội dung / khóa mới: <b>Course author</b> phụ trách lĩnh vực (vd. Nam cho kỹ thuật).</li>
            <li>Tài liệu thiết kế & lộ trình: xem <Link className="underline" href="/prd">PRD</Link>.</li>
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
          <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Manual</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/prd" className="rounded-md px-3 py-1.5 hover:bg-[var(--muted)]">PRD</Link>
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
        <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Sổ tay hướng dẫn · Tiếng Việt · v1.0 · 2026-05-19</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Hướng dẫn sử dụng <span className="text-gradient-brand">Demo Learning</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Từ lúc đăng nhập đến khi nhận chứng chỉ. Dành cho học viên, HR, và quản trị viên.
          Có hình minh họa và sơ đồ thao tác từng bước.
        </p>
      </div>
    </section>
  );
}

function TableOfContents() {
  const items = [
    ["bat-dau", "1 · Bắt đầu"],
    ["dang-nhap", "2 · Đăng nhập"],
    ["dashboard", "3 · Dashboard"],
    ["kham-pha", "4 · Khám phá & học"],
    ["quiz", "5 · Quiz"],
    ["cert", "6 · Chứng chỉ"],
    ["path", "7 · Lộ trình"],
    ["hoc-cua-toi", "8 · Học của tôi"],
    ["ai", "9 · Trợ lý AI"],
    ["thong-bao", "10 · Thông báo"],
    ["hr", "11 · HR"],
    ["admin", "12 · Admin"],
    ["tac-gia", "13 · Tác giả"],
    ["su-co", "14 · Sự cố"],
    ["phim-tat", "15 · Phím tắt"],
    ["lien-he", "16 · Liên hệ"],
  ];
  return (
    <nav aria-label="Mục lục" className="my-8 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(([id, label]) => (
        <a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
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

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="my-3 space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold">{i + 1}</span>
          <div className="leading-relaxed">{it}</div>
        </li>
      ))}
    </ol>
  );
}

function FeatureBlock({ id, title, steps }: { id: string; title: string; steps: string[] }) {
  return (
    <div id={id} className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="font-semibold">{title}</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-[var(--muted-foreground)]">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-xl border-l-4 border-[var(--brand-coral)] bg-[color-mix(in_oklab,var(--brand-coral)_8%,var(--card))] p-4 text-sm">
      {children}
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

function RoleCards() {
  const roles = [
    { name: "USER (Học viên)", color: "var(--brand-coral)", desc: "Học khóa được giao, làm quiz, nhận chứng chỉ, theo dõi tiến độ cá nhân." },
    { name: "HR", color: "var(--success)", desc: "Xem báo cáo toàn công ty, theo dõi compliance, xuất CSV. Không sửa người dùng (trừ khi được cấp qua RBAC)." },
    { name: "ADMIN (IT)", color: "var(--brand-red)", desc: "Quản trị toàn bộ: users, courses, LDAP, AI, security, roles, paths, reports, audit, announcements." },
  ];
  return (
    <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {roles.map((r) => (
        <div key={r.name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="font-semibold" style={{ color: r.color }}>{r.name}</div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)]">
      <div>© {new Date().getFullYear()} Demo Group · Nội bộ — vui lòng không chia sẻ ra ngoài.</div>
      <div className="flex gap-3">
        <Link href="/prd" className="underline">PRD</Link>
        <Link href="/login" className="underline">Mở portal</Link>
      </div>
    </footer>
  );
}

/* ──────────────────────────────  Diagrams  ───────────────────────────── */

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
  const id = `am-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? "5 4" : undefined} markerEnd={`url(#${id})`} />
      {label && <text x={mx} y={my} textAnchor="middle" fontSize={11} fill={color} fontFamily="Inter, system-ui">{label}</text>}
    </g>
  );
}

function AuthFlowSVG() {
  return (
    <SVGCard title="Hình A — Quy trình đăng nhập" height={240}>
      <SketchyBox x={30} y={90} w={150} h={60} label="Bạn" sub="email/AD + pass" />
      <SketchyBox x={230} y={90} w={170} h={60} label="/login" sub="Server action" stroke="#d82827" />
      <SketchyBox x={450} y={30} w={170} h={60} label="Local check" sub="bcrypt" stroke="#15a37a" />
      <SketchyBox x={450} y={150} w={170} h={60} label="AD / LDAP" sub="bind + search" stroke="#d97706" />
      <SketchyBox x={680} y={90} w={180} h={60} label="Vào dashboard" sub="JWT cookie" stroke="#0b1020" />
      <Arrow x1={180} y1={120} x2={230} y2={120} label="Submit" />
      <Arrow x1={400} y1={110} x2={450} y2={60} label="thử local" color="#15a37a" />
      <Arrow x1={400} y1={130} x2={450} y2={180} label="rồi LDAP" color="#d97706" />
      <Arrow x1={620} y1={60} x2={680} y2={110} label="ok" color="#15a37a" />
      <Arrow x1={620} y1={180} x2={680} y2={130} label="JIT user" color="#d97706" />
    </SVGCard>
  );
}

function DashboardSVG() {
  return (
    <SVGCard title="Hình B — Bố cục dashboard" height={300}>
      <rect x="20" y="20" width="860" height="260" rx="20" fill="#ffffff" stroke="#0b1020" strokeDasharray="6 4" opacity="0.6" />
      <SketchyBox x={40} y={40} w={170} h={220} label="Sidebar" sub="Dashboard · Khóa · Path · Học của tôi · Profile" />
      <text x={125} y={70} textAnchor="middle" fontSize={11} fill="#5b6478">→ điều hướng chính</text>
      <SketchyBox x={230} y={40} w={630} h={50} label="Header" sub="Logo · Search · Chuông 🔔 · Avatar" stroke="#d82827" />
      <SketchyBox x={230} y={110} w={300} h={150} label="Tiếp tục học" sub="Progress bar + Resume" stroke="#15a37a" />
      <SketchyBox x={550} y={110} w={310} h={70} label="Khuyến nghị cho bạn" sub="3 khóa tags theo role" />
      <SketchyBox x={550} y={190} w={310} h={70} label="Chứng chỉ gần đây" sub="link verify" stroke="#d97706" />
    </SVGCard>
  );
}

function ContentKindsSVG() {
  const kinds = [
    { x: 40, color: "#d82827", label: "HTML", sub: "tương tác" },
    { x: 200, color: "#5b6478", label: "VIDEO_FILE", sub: "upload mp4" },
    { x: 360, color: "#5b6478", label: "VIDEO_EMBED", sub: "YT/Vimeo" },
    { x: 520, color: "#d97706", label: "PDF", sub: "đọc inline" },
    { x: 40, y: 200, color: "#d97706", label: "PPTX / PPT", sub: "Office Online" },
    { x: 200, y: 200, color: "#15a37a", label: "SLIDES_GOOGLE", sub: "Google Slides" },
    { x: 360, y: 200, color: "#0b1020", label: "MARKDOWN", sub: "đọc ngắn" },
    { x: 520, y: 200, color: "#ea403f", label: "Player", sub: "kiểm tra quyền" },
  ];
  return (
    <SVGCard title="Hình C — Các kiểu nội dung học viên sẽ gặp" height={320}>
      {kinds.map((k, i) => <SketchyBox key={i} x={k.x} y={k.y ?? 70} w={150} h={70} label={k.label} sub={k.sub} stroke={k.color} rotate={i % 2 === 0 ? -1 : 1} />)}
      <SketchyBox x={720} y={130} w={150} h={80} label="Bạn (learner)" sub="watch · read" />
      <Arrow x1={670} y1={235} x2={720} y2={170} />
    </SVGCard>
  );
}

function QuizFlowSVG() {
  return (
    <SVGCard title="Hình D — Quiz → Chứng chỉ" height={220}>
      <SketchyBox x={40} y={70} w={150} h={70} label="Học xong" sub="Mark complete" />
      <SketchyBox x={240} y={70} w={150} h={70} label="Vào quiz" sub="5 loại câu hỏi" stroke="#d82827" />
      <SketchyBox x={440} y={70} w={150} h={70} label="Chấm điểm" sub="≥ pass %" stroke="#0b1020" rotate={1} />
      <SketchyBox x={640} y={70} w={210} h={70} label="Chứng chỉ" sub="link /verify/<code>" stroke="#15a37a" />
      <Arrow x1={190} y1={105} x2={240} y2={105} />
      <Arrow x1={390} y1={105} x2={440} y2={105} />
      <Arrow x1={590} y1={105} x2={640} y2={105} label="tự cấp" color="#15a37a" />
      <text x={315} y={180} textAnchor="middle" fontSize={11} fill="#d82827">Nếu chưa pass → làm lại trong Max attempts</text>
    </SVGCard>
  );
}

function CertVerifySVG() {
  return (
    <SVGCard title="Hình E — Xác minh chứng chỉ công khai" height={220}>
      <SketchyBox x={40} y={80} w={200} h={70} label="Người dùng ngoài" sub="không cần đăng nhập" />
      <SketchyBox x={290} y={80} w={260} h={70} label="/verify/DEMO-XXXX-YYYY" sub="public route" stroke="#d82827" />
      <SketchyBox x={600} y={30} w={260} h={70} label="Hợp lệ" sub="tên người + khóa + ngày cấp" stroke="#15a37a" />
      <SketchyBox x={600} y={130} w={260} h={70} label="Hết hạn / không tìm thấy" sub="thông báo cảnh báo đỏ" stroke="#d82827" />
      <Arrow x1={240} y1={115} x2={290} y2={115} />
      <Arrow x1={550} y1={100} x2={600} y2={65} color="#15a37a" />
      <Arrow x1={550} y1={130} x2={600} y2={165} color="#d82827" />
    </SVGCard>
  );
}

function AIHelperSVG() {
  return (
    <SVGCard title="Hình F — Trợ lý AI ngay cạnh nội dung" height={260}>
      <SketchyBox x={40} y={30} w={500} h={200} label="" />
      <text x={290} y={60} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b1020">Nội dung khóa học</text>
      <text x={290} y={90} textAnchor="middle" fontSize={11} fill="#5b6478">(HTML / video / PDF / slides …)</text>
      <text x={290} y={130} textAnchor="middle" fontSize={11} fill="#5b6478">Bôi đen đoạn văn để hỏi “Giải thích đoạn này”</text>

      <SketchyBox x={560} y={30} w={300} h={70} label="Hỏi khóa học" sub="Ask the course" stroke="#d82827" />
      <SketchyBox x={560} y={110} w={300} h={50} label="Giải thích đoạn này" sub="Explain this concept" stroke="#0b1020" />
      <SketchyBox x={560} y={170} w={300} h={60} label="Tóm tắt 5 ý" sub="Summarize for me" stroke="#15a37a" />

      <Arrow x1={540} y1={60} x2={560} y2={60} />
      <Arrow x1={540} y1={135} x2={560} y2={135} />
      <Arrow x1={540} y1={195} x2={560} y2={195} />
    </SVGCard>
  );
}

function HRDashboardSVG() {
  return (
    <SVGCard title="Hình G — HR/Org analytics dashboard" height={280}>
      <SketchyBox x={40} y={30} w={200} h={70} label="Active users" sub="theo phòng ban" stroke="#d82827" />
      <SketchyBox x={260} y={30} w={200} h={70} label="Published courses" stroke="#0b1020" />
      <SketchyBox x={480} y={30} w={200} h={70} label="Certificates" stroke="#15a37a" />
      <SketchyBox x={700} y={30} w={160} h={70} label="Quiz pass rate" stroke="#d97706" />

      <SketchyBox x={40} y={120} w={400} h={130} label="" />
      <text x={240} y={150} textAnchor="middle" fontSize={13} fontWeight={700}>90-day completion sparkline</text>
      <polyline points="60,230 110,210 160,220 210,180 260,200 310,160 360,170 410,140" fill="none" stroke="#d82827" strokeWidth="2.4" />
      <SketchyBox x={460} y={120} w={400} h={60} label="Top khóa theo completion" />
      <SketchyBox x={460} y={190} w={400} h={60} label="Top learner + headcount theo dept" />
    </SVGCard>
  );
}

function AdminMapSVG() {
  const groups = [
    { x: 40, y: 30, color: "#d82827", label: "Users", sub: "/admin/users" },
    { x: 220, y: 30, color: "#d82827", label: "LDAP", sub: "/admin/ldap [+ /sync]" },
    { x: 400, y: 30, color: "#d97706", label: "Courses", sub: "/admin/courses" },
    { x: 580, y: 30, color: "#d97706", label: "Categories", sub: "/admin/categories" },
    { x: 40, y: 130, color: "#0b1020", label: "Roles (RBAC)", sub: "/admin/roles" },
    { x: 220, y: 130, color: "#0b1020", label: "Security", sub: "/admin/security" },
    { x: 400, y: 130, color: "#15a37a", label: "AI providers", sub: "/admin/ai" },
    { x: 580, y: 130, color: "#15a37a", label: "Quizzes", sub: "/admin/quizzes" },
    { x: 40, y: 230, color: "#5b6478", label: "Paths", sub: "/admin/paths" },
    { x: 220, y: 230, color: "#5b6478", label: "Reports", sub: "/admin/reports" },
    { x: 400, y: 230, color: "#0b1020", label: "Audit", sub: "/admin/audit" },
    { x: 580, y: 230, color: "#d82827", label: "Announcements", sub: "/admin/announcements" },
  ];
  return (
    <SVGCard title="Hình H — Bản đồ trang Admin" height={340}>
      {groups.map((g, i) => (
        <SketchyBox key={i} x={g.x} y={g.y} w={170} h={70} label={g.label} sub={g.sub} stroke={g.color} rotate={i % 2 === 0 ? -1 : 1} />
      ))}
      <SketchyBox x={770} y={130} w={100} h={70} label="/admin" sub="root" stroke="#0b1020" />
    </SVGCard>
  );
}
