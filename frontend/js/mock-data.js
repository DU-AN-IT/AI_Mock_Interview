/* =========================================================
   DỮ LIỆU MẪU CHO KẾT QUẢ VÀ LỊCH SỬ
   ========================================================= */

const SAMPLE_SESSIONS = [
    {
        id: "DEMO-003",
        date: "2026-11-18T14:30:00",
        position: "Frontend",
        level: "Junior",
        score: 82,
        feedback: "Bạn nắm khá tốt kiến thức giao diện và trình bày rõ ràng. Nên bổ sung thêm ví dụ thực tế.",
        strengths: [
            "Nắm được HTML, CSS và JavaScript",
            "Giải thích rõ ràng, dễ hiểu",
            "Có tư duy cải thiện trải nghiệm người dùng"
        ],
        weaknesses: [
            "Cần bổ sung kiến thức tối ưu hiệu năng",
            "Nên luyện tập kiểm thử giao diện"
        ]
    },
    {
        id: "DEMO-002",
        date: "2026-11-15T09:15:00",
        position: "Backend",
        level: "Fresher",
        score: 75,
        feedback: "Bạn có kiến thức nền tảng về API và cơ sở dữ liệu. Cần luyện thêm xử lý lỗi và bảo mật.",
        strengths: [
            "Hiểu REST API",
            "Biết các thao tác SQL cơ bản"
        ],
        weaknesses: [
            "Cần tìm hiểu thêm về JWT",
            "Nên bổ sung cách xử lý lỗi máy chủ"
        ]
    },
    {
        id: "DEMO-001",
        date: "2026-11-12T19:00:00",
        position: "Tester",
        level: "Intern",
        score: 88,
        feedback: "Bạn xác định được nhiều tình huống kiểm thử hợp lý. Nên luyện thêm cách phân loại mức độ lỗi.",
        strengths: [
            "Viết Test Case rõ ràng",
            "Chú ý trường hợp dữ liệu không hợp lệ"
        ],
        weaknesses: [
            "Cần thực hành báo cáo lỗi có minh chứng"
        ]
    }
];

function getSessions() {
    const raw = localStorage.getItem("ai_mock_interview_history");

    if (raw !== null) {
        try {
            const sessions = JSON.parse(raw);

            if (Array.isArray(sessions)) {
                return sessions;
            }
        } catch (error) {
            console.log("Dữ liệu lịch sử không hợp lệ");
        }
    }

    return SAMPLE_SESSIONS;
}

function isDemoData() {
    return localStorage.getItem("ai_mock_interview_history") === null;
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Không rõ";
    }

    return date.toLocaleString("vi-VN");
}
