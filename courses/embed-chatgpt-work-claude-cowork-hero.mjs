import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const coursesDir = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(coursesDir, "chatgpt-work-claude-cowork-practical-guide.html");
const imagePath = join(coursesDir, "assets", "ai-work-agent-desk.webp");
let html = readFileSync(htmlPath, "utf8");

const anchor = `            <a class="btn btn-ghost" href="#curriculum">Xem lộ trình</a>
          </div>`;
if (!html.includes('data-hero-illustration="ai-work-agent-desk"')) {
  const image = readFileSync(imagePath).toString("base64");
  const figure = `${anchor}
          <figure class="figure" data-hero-illustration="ai-work-agent-desk" style="margin-top:32px"><img src="data:image/webp;base64,${image}" alt="Một nhân viên văn phòng giao mục tiêu cho hai không gian AI xử lý file và tạo báo cáo, sau đó tự kiểm tra trước khi phê duyệt đầu ra"><figcaption><b>Bản đồ khoá học</b> — Bạn giao việc và nguồn cho AI, kiểm file kết quả rồi mới quyết định sử dụng hoặc chạy lại.</figcaption></figure>`;

  if (!html.includes(anchor)) {
    throw new Error("Không tìm thấy vị trí chèn hero trong output của assembler.");
  }
  html = html.replace(anchor, figure);
}

const oldToggle = `<button class="mobile-toggle" aria-label="Mở menu điều hướng" onclick="toggleSidebar()">`;
const accessibleToggle = `<button type="button" class="mobile-toggle" id="mobile-toggle" aria-label="Mở menu điều hướng" aria-controls="sidebar" aria-expanded="false" onclick="toggleSidebar()">`;
html = html.replace(oldToggle, accessibleToggle);
html = html.replace(
  `<div class="backdrop" id="backdrop" onclick="toggleSidebar()"></div>`,
  `<div class="backdrop" id="backdrop" aria-hidden="true" onclick="toggleSidebar()"></div>`,
);
html = html.replaceAll(`<button class="nav-complete"`, `<button type="button" class="nav-complete"`);
html = html.replace(
  `if(window.innerWidth<1024){document.getElementById('sidebar').classList.remove('open');document.getElementById('backdrop').classList.remove('show')}`,
  `if(window.innerWidth<1024)setSidebarOpen(false)`,
);

const ungatedCompletion = `async function markComplete(id){
  const k=DONE_KEY(id), was=(await sGet(k))==='done';
  if(was){await sDel(k);markUI(id,false)} else{await sSet(k,'done');markUI(id,true)}
  await refreshProgress();
  if(!was){const i=LESSONS.findIndex(l=>l.id===id);location.hash=i<LESSONS.length-1?LESSONS[i+1].id:'complete'}
}`;
const gatedCompletion = `async function markComplete(id){
  const k=DONE_KEY(id), was=(await sGet(k))==='done';
  if(!was){
    const lesson=document.getElementById(id),quiz=lesson?.querySelector('.quiz');
    if(quiz&&quiz.dataset.done!=='1'){
      const feedback=quiz.querySelector('.quiz-feedback');
      if(feedback){feedback.className='quiz-feedback show no';feedback.textContent='Hãy trả lời câu hỏi tình huống trước khi đánh dấu bài đã hoàn thành.'}
      quiz.querySelector('.quiz-opt')?.focus();
      return;
    }
  }
  if(was){await sDel(k);markUI(id,false)} else{await sSet(k,'done');markUI(id,true)}
  await refreshProgress();
  if(!was){const i=LESSONS.findIndex(l=>l.id===id);location.hash=i<LESSONS.length-1?LESSONS[i+1].id:'complete'}
}`;
html = html.replace(ungatedCompletion, gatedCompletion);

const oldSidebarScript = `function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('backdrop').classList.toggle('show')}`;
const accessibleSidebarScript = `function setSidebarOpen(open){
  const sidebar=document.getElementById('sidebar'),backdrop=document.getElementById('backdrop'),button=document.getElementById('mobile-toggle');
  sidebar.classList.toggle('open',open);backdrop.classList.toggle('show',open);
  backdrop.setAttribute('aria-hidden',String(!open));button.setAttribute('aria-expanded',String(open));
  button.setAttribute('aria-label',open?'Đóng menu điều hướng':'Mở menu điều hướng');
}
function toggleSidebar(){setSidebarOpen(!document.getElementById('sidebar').classList.contains('open'))}
const mobileBreakpoint=window.matchMedia('(max-width:1024px)');
mobileBreakpoint.addEventListener('change',event=>{if(!event.matches)setSidebarOpen(false)});`;
html = html.replace(oldSidebarScript, accessibleSidebarScript);

if (!html.includes("/* course-anchor-offset */")) {
  html = html.replace(
    "</head>",
    `<style>/* course-anchor-offset */ .lesson{scroll-margin-top:80px}</style>\n</head>`,
  );
}

writeFileSync(htmlPath, html);
