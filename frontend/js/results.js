document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("id");

    const sessions = getSessions();
    let session = null;

    if (sessionId) {
        session = sessions.find(function (item) {
            return String(item.id) === sessionId;
        });
    } else {
        session = sessions[0];
    }

    if (isDemoData()) {
        document.getElementById("demo-notice").hidden = false;
    }

    if (!session) {
        document.querySelector(".results-wrapper").innerHTML = `
            <section class="result-card">
                <h3>Không tìm thấy kết quả</h3>
                <p>Phiên phỏng vấn không tồn tại.</p>
                <div class="result-actions">
                    <a href="history.html" class="result-btn">
                        Quay lại lịch sử
                    </a>
                </div>
            </section>
        `;
        return;
    }

    function setText(id, value) {
        document.getElementById(id).textContent = value;
    }

    let positionName = session.position;

    if (positionName === "Frontend" || positionName === "Backend") {
        positionName += " Developer";
    }

    setText("result-position", positionName);
    setText("result-meta", session.level + " · " + formatDate(session.date));
    setText("result-score", session.score ?? "--");

    setText(
        "result-status",
        isDemoData() ? "Dữ liệu mẫu" : "Dữ liệu đã lưu"
    );

    setText(
        "result-feedback",
        session.feedback || "Chưa có nhận xét AI."
    );

    setText("result-id", session.id);
    setText("result-date", formatDate(session.date));
    setText("result-position-detail", session.position);
    setText("result-level", session.level);

    function showList(elementId, items) {
        const list = document.getElementById(elementId);
        list.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Chưa có dữ liệu";
            list.appendChild(li);
            return;
        }

        items.forEach(function (item) {
            const li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
        });
    }

    showList("result-strengths", session.strengths);
    showList("result-weaknesses", session.weaknesses);
});
