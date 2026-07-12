# OpenAI platform digest — chốt ngày 2026-07-12

Nguồn sơ cấp:

- [Models](https://developers.openai.com/api/docs/models)
- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
- [The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)
- [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)

## Key concepts & definitions

- Tại ngày chốt, OpenAI docs chọn GPT-5.6 Sol làm điểm bắt đầu cho reasoning/coding phức tạp; GPT-5.6 Terra cân bằng năng lực và chi phí; GPT-5.6 Luna dành cho tải lớn nhạy chi phí. Ba model có cửa sổ ngữ cảnh 1,05M token. Không biến bảng model thành chân lý lâu dài: dạy người học kiểm docs và chạy eval trên task thật.
- Prompt engineering là viết chỉ dẫn để model tạo output đáp ứng yêu cầu một cách nhất quán. OpenAI khuyến nghị pin model snapshot trong production và xây test/eval để phát hiện thay đổi hành vi.
- Kỹ thuật bền vững giữa các model: chỉ dẫn rõ; tách identity/instructions/examples/context; few-shot bằng ví dụ đa dạng; đặt prefix ổn định trước để tận dụng prompt caching; cung cấp đúng context liên quan.
- Với reasoning model, ưu tiên mục tiêu, ràng buộc và tiêu chí thành công; không cần buộc model phơi toàn bộ chuỗi suy luận ẩn. Với agentic task, prompt phải nói rõ điều kiện hoàn tất, cách dùng tool, cách test và khi nào được dừng.
- OpenAI mô tả harness production bằng môi trường có cấu trúc, tool, sandbox, test, observability, feedback loop và repository knowledge. `AGENTS.md` nên là bản đồ ngắn; kiến thức chi tiết sống trong tài liệu có cấu trúc và được kiểm cơ học.
- Agents SDK 2026 bổ sung harness làm việc qua file/tool, sandbox execution, memory cấu hình được, MCP, Skills, `AGENTS.md`, shell và apply-patch. Harness và compute được tách để tăng an toàn, độ bền và khả năng scale.
- Codex app hỗ trợ nhiều thread/agent, worktree cô lập và Automation chạy theo lịch; đây là surface sản phẩm, không phải pattern kiến trúc phổ quát.

## Figures worth recreating

- **Prompt → context → harness:** ba lớp xếp chồng; mỗi lớp có một failure mode và một phép kiểm riêng.
- **Repository as map:** `AGENTS.md` nhỏ dẫn tới docs, skills, tests và observability; đối lập với một file chỉ dẫn khổng lồ làm nghẹt context.
- **Legibility loop:** agent thay đổi code → test/browser/log đo kết quả → lỗi trở thành feedback cụ thể → agent sửa; mũi tên quay lại chỉ đóng khi verifier pass.

## Worked examples with real numbers

- GPT-5.6 Sol/Terra/Luna: cửa sổ 1,05M token và tối đa 128K output theo trang Models tại ngày chốt. Các mức giá thay đổi nhanh nên course chỉ nên link tới docs, không đóng băng bảng giá nếu không thật cần.
- Bài Harness Engineering của OpenAI mô tả một thử nghiệm nội bộ khoảng một triệu dòng code và khoảng 1.500 PR trong năm tháng. Đây là case study của một nhóm cụ thể, không phải benchmark để hứa năng suất cho mọi đội.

## Relevance hooks

- Người không code: prompt tốt là một bản giao việc có mục tiêu, dữ liệu, tiêu chí và mẫu đầu ra; model name chỉ là một biến trong hệ.
- Người làm sản phẩm: đóng gói acceptance criteria và dữ liệu kiểm thử để AI có thể tự biết “đã xong chưa”.
- Kỹ sư: đầu tư vào test, sandbox, log và cấu trúc repo trước khi tăng mức tự chủ.

