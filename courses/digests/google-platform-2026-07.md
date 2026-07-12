# Google AI platform digest — chốt ngày 2026-07-12

Nguồn sơ cấp:

- [Gemini API release notes](https://ai.google.dev/gemini-api/docs/changelog)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [Image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Video generation](https://ai.google.dev/gemini-api/docs/video)
- [Enterprise security controls for Workspace with Gemini](https://workspace.google.com/blog/ai-and-machine-learning/enterprise-security-controls-google-workspace-gemini)

## Key concepts & definitions

- Tại ngày chốt, Gemini 3.5 Flash là bản GA cho agentic/coding workload; Gemini 3.1 Flash-Lite là tier tối ưu tốc độ/chi phí. Tên model và alias đổi nhanh nên course dạy cách kiểm model page/changelog và chạy eval, không đóng đinh “model tốt nhất”.
- Native image GA hiện gồm `gemini-3.1-flash-image` (Nano Banana 2) và `gemini-3-pro-image` (Nano Banana Pro). Các endpoint Imagen 4 và Gemini 3 Image cũ được thông báo ngừng ngày 2026-08-17.
- Veo 2/3.0 API đã bị thay thế; hướng migration trong changelog là Veo 3.1 preview hoặc GA qua Gemini Enterprise Agent Platform. Course dùng tên họ sản phẩm, không khuyên model ID cũ.
- Deep Research agent có các biến thể 2026 với planning, visualization, MCP và File Search. Đây là agent nhiều bước, nên brief/source criteria cần được review trước khi chạy.
- Managed Agents public preview cung cấp sandbox Linux cô lập và stateful agent; đây là surface sản phẩm, còn verifier, quyền hạn, state và budget vẫn là trách nhiệm thiết kế.
- Workspace with Gemini áp dụng quyền Drive hiện có, DLP/IRM, audit log và retention control. Không rút gọn điều này thành “Enterprise = zero retention”; cấu hình và policy cụ thể mới quyết định dữ liệu được giữ và ai truy cập được.

## Figures worth recreating

- **Model lifecycle:** preview → GA → deprecation → shutdown; người học kiểm changelog trước khi copy model ID.
- **Data boundary:** user permission → Drive/DLP policy → Gemini retrieval → audit log; model chỉ thấy tài liệu user có quyền và policy cho phép.
- **Deep research contract:** câu hỏi → source tier/date window → research plan → evidence table → synthesis → human verification.

## Worked examples with real numbers

- Ngày 2026-05-19: Gemini 3.5 Flash GA; ngày 2026-05-28: Nano Banana 2/Pro GA; ngày 2026-06-15: công bố timeline deprecation image/video model cũ. Các ngày này minh họa vì sao model table cần “ngày chốt”.

## Relevance hooks

- Người không code: chọn theo loại việc và quyền dữ liệu, không theo tên model nghe mạnh.
- Người làm nội dung: với ảnh/video, kiểm chữ, logo, mặt/tay, quyền tham chiếu và disclosure trước khi publish.
- Kỹ sư: pin model ID khi có thể, theo dõi deprecation, dựng eval và budget trước khi nâng model.
