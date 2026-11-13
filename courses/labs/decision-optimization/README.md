# Phân bổ có ràng buộc chung

Python 3.11+; phần chính chỉ dùng thư viện chuẩn, không mạng hoặc tài khoản.
Mọi số là dữ liệu giả lập, điểm utility do tác giả đặt; không phải forecast/lift.

```sh
python3 allocation.py
python3 allocation.py --write my-results.json --tables my-tables.md
```

`fixture.json` giữ ba hạng mục A/B/C, ngân sách 10 và hai suất việc dùng chung.
`expected.json` và `tables.md` được tạo bằng chính `allocation.py`, không chép tay.
Chương trình liệt kê tám tập con, kiểm các trường hợp định sẵn rồi xuất JSON.
Mỗi phương án solver được kiểm lại bằng phép trừ tài nguyên theo ID, tách khỏi
vòng liệt kê. Giới hạn mười hạng mục là giới hạn oracle giảng dạy, không phải
ngưỡng hiệu năng CP-SAT.

Kết quả chuẩn: BC điểm 18; greedy A điểm 12; nghiệm phân số [1,4/5,0] điểm 96/5;
round xuống A điểm 12; round gần nhất AB tốn 11 nên bị chặn. Đây là nghiệm LP
cho đúng fixture: giá trị = (9/5) × tổng_cost + (6/5) × x_A <=18+6/5=96/5,
và vector phân số đạt cận đó với 9/5 suất <=2. Không phải một LP solver tổng quát.

Budget 9 + yêu cầu ít nhất 2 hạng mục là INFEASIBLE. Bản mềm chỉ cho thiếu mục
tiêu phục vụ, phạt 4/việc; ngân sách và suất vẫn cứng. Chọn A, thiếu 1, gross 12,
net 8. Đây là mô hình khác phải được duyệt, không gọi mô hình cũ là khả thi.

Bốn kịch bản cố định gồm nominal, điểm B/C giảm xuống 4, budget 9, capacity 1.
Báo cả khả thi của BC đã chọn trước và nghiệm tối ưu mới. So max-min riêng trên
hai kịch bản điểm cho A đạt worst 12 so với BC worst 8. Không gán xác suất hoặc
bảo đảm ngoài hai kịch bản. Marginal conformal outcome coverage không phải
joint/adaptive selection coverage, không chứng minh treatment lift.

Bài tập: trong bản sao riêng, thay capacity thành 1. Trước khi chạy, ghi dự đoán
nghiệm; các assert chuẩn sẽ cố ý không còn khớp. Gọi `solve` với dữ liệu đã sửa trong phiên Python, rồi dùng `audit` kiểm lại
nghiệm; giữ báo cáo chuẩn làm đối chứng. `build_report` chứa các phép đối chiếu
riêng cho fixture gốc, không phải bộ báo cáo tổng quát.
Không sửa nhãn chuẩn chỉ để báo cáo xanh.

## OR-Tools tùy chọn

`requirements-optional.txt` dùng bản 9.15.6755; không cần cài
để học phần chính. Ba ca bên dưới cho kết quả lần lượt OPTIMAL (BC,18), INFEASIBLE và OPTIMAL (A,net 8), đối chiếu với oracle.
Cài trong môi trường riêng nếu muốn chạy adapter:

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-optional.txt
python3 cp_sat_optional.py --case nominal
python3 cp_sat_optional.py --case infeasible
python3 cp_sat_optional.py --case relaxed
```

Thiếu dependency hoặc sai version là lỗi adapter riêng, không phải UNKNOWN.
Chỉ đọc nghiệm khi OPTIMAL/FEASIBLE. FEASIBLE không tự được execute: vẫn cần
kiểm khả thi, quy tắc gap và approval đã đặt trước. Adapter báo bound và tham
số, dùng một worker/seed 0/time cap 10 s/gap limits 0, kiểm lại nghiệm và so với
oracle trên fixture nhỏ. UNKNOWN không chứng minh infeasibility. MODEL_INVALID
là mô hình sai, không phải nghiệp vụ không có lời giải. Không có lệnh thực thi
hành động hoặc LLM call trong companion này.
