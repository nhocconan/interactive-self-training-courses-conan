# Bài lab: đề xuất AI, kiểm tra, phê duyệt, ghi nhận

Bài thực hành cho khóa [Xây ứng dụng AI có kiểm thử](../../ai-application-engineering.html).
Dùng Python 3.11+ và thư viện chuẩn; không cần cài package, tài khoản hay mạng để học phần chính. Đây là
workflow cố định quanh một đề xuất AI. Chỉ có một hành động giả lập: giữ chỗ bộ
lọc trong SQLite. Không có email, hoàn tiền hay thay đổi hệ thống bên ngoài.

## Chạy lần đầu

Mở terminal trong thư mục chứa README này. Chọn đường dẫn DB mới cho mỗi lần
thử độc lập; `setup` giữ nguyên dữ liệu đã có, không reset kho.

```sh
python3 --version
python3 lab.py --db demo.sqlite demo
python3 lab.py --db demo.sqlite status --actor linh
python3 -m unittest discover -v
python3 lab.py evaluate
```

Demo tạo `demo-1`, phê duyệt bằng fixture `mai`, rồi gửi cùng yêu cầu commit hai
lần. `first.replayed` là `false`, `replay.replayed` là `true`, hai receipt giống
nhau. SQL phải cho thấy kho từ **10 → 8**, revision **1 → 2**, một effect, một
receipt. Các số và ID đều là dữ liệu tổng hợp tự đặt cho bài lab.

Đọc trạng thái thật bằng thư viện chuẩn:

```sh
python3 - <<'PY'
from contextlib import closing
import sqlite3
with closing(sqlite3.connect("demo.sqlite")) as db:
    print(db.execute("SELECT available,revision FROM stock").fetchall())
    print(db.execute("SELECT COUNT(*) FROM effects").fetchone())
    print(db.execute("SELECT COUNT(*) FROM receipts").fetchone())
PY
```

Kết quả dự kiến: `[(8, 2)]`, `(1,)`, `(1,)`. Không suy kết quả từ câu trả lời
của provider hoặc chỉ từ mã thoát.

## Tự nối từng bước

```sh
python3 lab.py --db lesson.sqlite setup
python3 lab.py --db lesson.sqlite propose --actor linh --intent lesson-1 --fixture valid
python3 lab.py --db lesson.sqlite approve --actor mai --intent lesson-1 --decision allow
```

Đọc `draft` và `payload_hash`, rồi sao chép `approval_id` vừa in vào hai lệnh sau:

```sh
python3 lab.py --db lesson.sqlite commit --actor linh --intent lesson-1 --approval APPROVAL_ID --key delivery-1
python3 lab.py --db lesson.sqlite commit --actor linh --intent lesson-1 --approval APPROVAL_ID --key delivery-1
```

`APPROVAL_ID` là chỗ cần thay, không phải ID có sẵn. Phê duyệt mặc định hết hạn
sau 300 giây, tối đa 3600 giây qua `--ttl`. Muốn thử từ chối: dùng một intent
mới và `--decision deny`; commit phải báo `approval_denied`, kho không đổi.

Draft đúng có đúng năm trường:

```json
{"request_id":"REQ-7","action":"reserve_filter","quantity":2,"evidence_ids":["EV-7"],"evidence_version":1}
```

`--input draft.json` đọc JSON do bạn tự viết; `--fixture untrusted-evidence`
dùng đầu ra có sẵn trong `fixtures.json`. Hai cách đều qua cùng verifier.
Model không được chọn actor, tự phê duyệt, thay policy hoặc gửi SQL. Schema
đúng chưa đủ: ứng dụng kiểm tra ID bằng chứng thuộc scope/yêu cầu, độ tin cậy,
phiên bản và hạn mức có trong dữ liệu chính sách tổng hợp. Nó không chứng minh
mọi ý nghĩa của một tài liệu văn bản tùy ý.

`linh` được propose/commit, `mai` được approve, `guest` chỉ đọc, `outsider` thuộc
`workshop-b`. `--scope workshop-a` đặt trước subcommand. Đây là fixture danh
tính mà mã host tin cậy; bất kỳ ai chạy CLI đều có thể chọn tên. **`--actor`
không xác thực người dùng.**

## Bài tập có phần cần viết

1. Đọc `policy.py` như hợp đồng tham chiếu, rồi đóng file. Trong `checkpoint.py`,
   hoàn thành TODO: chỉ cho phép action khớp policy và quantity không vượt hạn
   mức bằng chứng đã được host kiểm tra.
2. Chạy `python3 checkpoint_gate.py`. Bản starter cố ý thất bại **0/4** và exit
   **1**. Sau khi viết đúng, gate phải **4/4**, exit **0**.
3. Chạy `python3 checkpoint_gate.py --module policy`: bản tham chiếu đạt **4/4**.
   Chạy `python3 checkpoint_gate.py --inject-fault`: lỗi “cho phép tất cả” chỉ
   đạt **1/4**, exit **1**; đọc stock/effects/receipts của các ca bị lọt.

Gate thay đúng hàm policy trong workflow thật và kiểm tra SQLite sau mỗi ca.
`fixtures.json` là ca phát triển; `heldout.json` là tập hợp đồng riêng đã đóng
băng, có nhãn do tác giả đặt. Không sửa nhãn để làm gate xanh. Các tập này đo
kiểm soát của mã trên các tình huống đã nêu; không đo chất lượng suy luận hay
khả năng chống prompt injection của model.

Bài chuyển giao: trong một bản sao riêng, đổi thành giữ chỗ dây cáp
(`reserve_cable`), viết dữ liệu bằng chứng và nhãn kỳ vọng mới trước khi sửa
schema/policy. Giữ nguyên ranh giới phê duyệt và giao dịch. Đối chiếu SQL cho cả
ca cho phép và vượt hạn mức; không chỉ đổi tên trường trong câu trả lời.

## Crash, replay và cạnh tranh

Trước khi chạy, dự đoán kho và số receipt. Tạo intent/phê duyệt mới, rồi thêm
`--crash before-commit` hoặc `--crash after-commit` vào lệnh `commit`:

- `before-commit`: tiến trình thoát **81** sau khi ghi nhưng trước COMMIT;
  kho/effect/receipt và trạng thái intent được rollback.
- `after-commit`: tiến trình thoát **82** sau COMMIT nhưng trước khi in kết quả;
  kho/effect/receipt và intent hoàn tất đã bền vững.

Chạy lại **cùng intent, approval và key**, bỏ `--crash`. Trường hợp đầu thực
thi một lần; trường hợp sau đọc receipt cũ với `replayed:true`. Test dùng tiến
trình con thật, không chỉ bắt một exception. Test cạnh tranh cho hai tiến trình
độc lập chờ cùng barrier rồi commit; cả hai nhận cùng receipt, chỉ một effect.

Host giữ payload chuẩn hóa/hash, phiên bản kho, scope trong intent. Approval
ràng buộc đúng intent/hash/phiên bản bằng chứng/phiên bản kho/scope. Commit
kiểm tra lại trong `BEGIN IMMEDIATE`; stock, effect, intent `committed` và
receipt nằm trong cùng giao dịch. Cùng intent đổi payload báo `intent_conflict`;
cùng key đổi intent/payload/approval báo `key_conflict`. Key khác cho intent đã
hoàn tất báo `intent_already_committed`. Intent mới hợp lệ vẫn có thể thực thi
dù các tham số miền giống intent trước.

Replay receipt đã hoàn tất được đọc trước kiểm tra bằng chứng/hạn phê duyệt
hiện tại: đó là kết quả cũ, không phải quyền tạo effect mới. Quyền fixture của
actor gọi commit vẫn được kiểm tra trước replay. Một approval ID là một quyết
định riêng; bài lab không xây lifecycle thu hồi toàn bộ approval trước đó.

## Provider thật: bước tùy chọn

`provider.py` có adapter REST OpenAI Responses. Chỉ `propose --live` mới gọi
mạng; không có tên model mặc định. Tự đặt `OPENAI_API_KEY` và `OPENAI_MODEL`
trong môi trường terminal của bạn; không lưu key vào bài tập hoặc commit.

```sh
python3 lab.py --db live.sqlite setup
python3 lab.py --db live.sqlite propose --actor linh --intent live-1 --live
```

Lệnh này có thể tính phí. Adapter gửi `store:false`, `max_output_tokens:500`,
schema strict, timeout 15 giây, không tự retry. Mã xử lý refusal/incomplete/lỗi
request và đọc `output[].content[]` của REST; usage có sẵn được giữ trong
`intents.provider`. Thiếu usage không được bịa số. Lỗi không in body provider
hay giá trị credential. JSON từ provider vẫn qua verifier cục bộ.

**Chưa gọi provider thật trong lúc phát triển.** Test transport giả xác nhận
request/parser/error handling; không xác nhận khả năng tương thích mạng hay
chất lượng model đang cấu hình. Thí nghiệm chất lượng riêng cần đóng băng task,
input, model/config và nhãn trước khi gọi; không dùng fixture name để định tuyến
đầu ra live hoặc báo 9/9 control checks thành độ chính xác AI.

## Phạm vi và đọc mã

`lab.py`: state machine và CLI; `provider.py`: hai nguồn draft; `policy.py`:
đáp án checkpoint; `checkpoint.py`: phần học viên viết; `checkpoint_gate.py`:
grader; `test_lab.py`: kiểm thử; hai JSON: ca tổng hợp có nhãn.

SQLite đảm bảo giao dịch cục bộ này; điều đó không tạo exactly-once cho API bên
ngoài. Ai điều khiển file DB hoặc mã fixture đều có thể vượt kiểm soát. Chuyển
sang hệ thống thật cần xác thực phía server, quản lý scope/phê duyệt đáng tin,
idempotency ở backend công cụ và đối soát lỗi mạng. Không có function-calling
loop tự chủ, streaming/cancel/reconnect, retrieval đầy đủ hay tuyên bố production.

Nguồn: [sqlite3](https://docs.python.org/3/library/sqlite3.html),
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
Các số giới hạn trong lab là lựa chọn giảng dạy tổng hợp, không phải SLA của provider.
