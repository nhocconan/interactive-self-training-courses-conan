# Long-context research digest

Nguồn gốc:

- [Lost in the Middle: How Language Models Use Long Contexts](https://aclanthology.org/2024.tacl-1.9/) — TACL 2024
- [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://www.trychroma.com/research/context-rot) — Chroma Research 2025

## Key concepts & definitions

- `Lost in the Middle` cho thấy trên các task được thử nghiệm, performance thường cao hơn khi thông tin liên quan nằm ở đầu hoặc cuối input và giảm khi nó nằm giữa. Đây là kết quả thực nghiệm theo model/task, không phải định luật rằng mọi model luôn có một đường chữ U giống nhau.
- `Context rot` là tên mô tả hiện tượng performance trở nên kém ổn định khi input dài hơn, kể cả trên một số task đơn giản. Báo cáo cũng nhấn mạnh khó tách hoàn toàn ảnh hưởng của độ dài khỏi độ khó của task.
- Kết luận an toàn cho course: context window là giới hạn chứa; effective context phải được đo bằng eval trên task thật. Không có ngưỡng phổ quát kiểu “sau 120K chắc chắn giảm”.

## Figures worth recreating

- **Position experiment:** cùng một fact dịch từ đầu → giữa → cuối trong ba input bằng nhau; đường performance minh họa “có thể giảm ở giữa”, kèm nhãn “đo theo model/task”.
- **Signal/noise balance:** thêm đoạn liên quan giúp tới một điểm; thêm tài liệu trùng hoặc lạc đề làm chi phí tăng và có thể kéo độ chính xác xuống.

## Worked examples with real numbers

- Không mang benchmark số từ hai nguồn vào course nếu không tái hiện đúng model, dataset và setup. Dùng ví dụ minh họa có nhãn “giả lập” thay vì biến một biểu đồ nghiên cứu thành định luật phổ quát.

## Relevance hooks

- RAG: đo quality theo số chunk và vị trí, không mặc định top-50 tốt hơn top-5.
- Hội thoại dài: tách state bền vững khỏi transcript; compact/reset dựa trên dấu hiệu và eval, không dựa trên một phần trăm context cố định.
- Tài liệu dài: đặt câu hỏi/tiêu chí rõ và yêu cầu citation tới section nguồn để người dùng kiểm lại.

