# Agent loops, harnesses and evals digest

Nguồn sơ cấp:

- [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [Reflexion](https://arxiv.org/abs/2303.11366)
- [Self-Refine](https://proceedings.neurips.cc/paper_files/paper/2023/file/91edff07232fb1b55a505a9e9f6c0ff3-Paper-Conference.pdf)

## Key concepts & definitions

- Workflow: luồng LLM/tool đi theo code path định trước. Agent: model tự quyết process và tool use. Bắt đầu từ giải pháp đơn giản nhất; chỉ thêm autonomy khi task cần flexibility và lợi ích bù latency/cost.
- Loop tối thiểu có mục tiêu, hành động/tool, observation từ environment và policy quyết định bước tiếp. Tên pha có thể khác; `Plan → Act → Observe → Reflect` là mental model, không phải API chuẩn.
- Verifier cứng (test, schema, constraint, reconciliation) cho tín hiệu khách quan hơn LLM judge. Với chất lượng chủ quan, evaluator riêng + rubric cụ thể đáng tin hơn câu “tự chấm 1–10”.
- Long-running work cần decomposition, progress artifact, clean handoff và cách khởi tạo lại environment. Compaction không thay thế được state bền vững.
- Self-Refine và Reflexion cho thấy feedback bằng ngôn ngữ có thể cải thiện một số task; không chứng minh mọi loop tự phản biện sẽ tốt hơn hoặc nên chạy vô hạn.
- Evals cho agent phải kiểm cả outcome và trajectory khi cần: agent làm đúng việc, không phá thứ khác, dùng tool/chi phí trong biên, và để lại bằng chứng tái dựng được.

## Figures worth recreating

- **Closed loop:** goal → act → environment → observable evidence → verifier → next action/stop. Verifier nhận evidence, không nhận “cảm giác đã xong”.
- **Workflow vs agent:** cùng một task; bên trái code chọn từng bước, bên phải model chọn bước trong một sandbox có policy và budget.
- **Three-agent harness:** planner tạo contract; generator làm; evaluator lái app/test output; feedback chỉ quay lại generator khi tiêu chí fail.
- **Durable handoff:** session A ghi task state + evidence + next step; session B đọc artifact và tiếp tục trong context sạch.

## Worked examples with real numbers

- Không dùng một số vòng reflection cố định. Đặt cap ban đầu, theo dõi improvement per iteration và dừng khi verifier không cải thiện hoặc budget chạm trần.
- Case study Anthropic dùng sprint contract và Playwright evaluator cho full-stack app; đây là architecture tham khảo, không phải yêu cầu mọi loop phải có ba agent.

## Relevance hooks

- Content: draft → rubric-based critique → revise, tối đa theo improvement thực đo.
- Spreadsheet: transform → reconcile row count/totals/schema → chỉ xuất khi pass.
- Coding: patch → unit/type/lint/browser checks → sửa theo failure cụ thể → dừng khi toàn bộ acceptance criteria pass.

