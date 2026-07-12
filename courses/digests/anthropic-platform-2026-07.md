# Anthropic platform digest — chốt ngày 2026-07-12

Nguồn sơ cấp:

- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview)
- [Choosing the right model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)

## Key concepts & definitions

- Claude Sonnet 5 ra ngày 2026-06-30; Opus 4.8 ra ngày 2026-05-28. Tại ngày chốt, docs cũng liệt kê Claude Fable 5 cho long-running agents. Không dùng nhãn mơ hồ “Claude 5 flagship”; chọn model theo capability, speed, cost và eval riêng.
- Sonnet 5 có context 1M và tối đa 128K output. Context lớn là sức chứa, không phải cam kết mọi token được sử dụng tốt như nhau.
- Context engineering là tuyển chọn và duy trì tập token có ích nhất cho mỗi lần inference, gồm system instructions, tool definitions, external data và message history — không chỉ câu prompt.
- Prompt caching của Claude dùng prefix. Cache read có giá bằng 0,1 lần base input; cache write 5 phút bằng 1,25 lần, cache write một giờ bằng 2 lần. Cache hit đòi prefix giống hệt; nội dung động nên đặt sau prefix ổn định.
- Harness là loop gọi model và route tool call tới hạ tầng. Anthropic tách session (event log), harness (brain/loop) và sandbox (hands/compute) để từng phần có thể fail hoặc được thay độc lập.
- Harness dài hơi dùng artifact/state bền vững, task decomposition và evaluator độc lập. Tuy nhiên mỗi scaffold mã hóa một giả định về điểm yếu của model; khi đổi model phải chạy ablation và tháo phần không còn tạo giá trị.
- Sonnet 5 bật adaptive thinking mặc định. `effort` là đòn bẩy capability/latency/cost tốt hơn việc thêm prompt “hãy nghĩ kỹ” một cách mơ hồ.

## Figures worth recreating

- **Context workbench:** mặt bàn chỉ giữ tài liệu đang dùng; tủ hồ sơ là retrieval; sổ bàn giao là state ngoài context. Chỉ đồ cần cho bước hiện tại nằm trên bàn.
- **Brain / session / hands:** harness và model ở giữa; session log ở một bên; sandbox/tool ở bên kia; ba interface có thể thay độc lập.
- **Scaffold ablation:** baseline → thêm verifier → thêm planner → thêm reset; khi model nâng cấp, bỏ từng lớp và đo để tìm phần còn load-bearing.

## Worked examples with real numbers

- Sonnet 5: 1M input context, 128K output theo release notes tại ngày chốt.
- Prompt caching: cache read 0,1× base input; cache write 5 phút 1,25×; cache write 1 giờ 2×. Không nói chung “cache làm input chỉ còn 10%” vì lần ghi đầu tiên vẫn tốn thêm và hit phụ thuộc prefix/TTL.
- Anthropic ghi nhận evaluator-generator có thể chạy nhiều vòng và plateau; số vòng phải lấy từ trace/eval của workload, không mặc định “1–3 vòng” cho mọi task.

## Relevance hooks

- Người không code: đừng nhét toàn bộ folder vào chat; cho AI đúng tài liệu của quyết định hiện tại và giữ một bản bàn giao ngắn.
- Người làm sản phẩm: viết rubric trước khi giao AI tự chấm; tách người làm và người kiểm khi chất lượng chủ quan.
- Kỹ sư: version harness cùng model; mỗi lần model đổi, chạy lại eval và bỏ scaffold không còn cần.

