document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const userName = localStorage.getItem("user_name");
    const userEmail = localStorage.getItem("user_email");
    const sidebarUser = document.getElementById("sidebar-username");
    if (sidebarUser) {
        sidebarUser.textContent = userName || (userEmail ? userEmail.split("@")[0] : "Ứng viên");
    }

    const historyBody = document.getElementById("history-body");
    const searchInput = document.getElementById("search-input");
    const levelFilter = document.getElementById("level-filter");
    const historyCount = document.getElementById("history-count");
    const historyEmpty = document.getElementById("history-empty");
    const demoNotice = document.getElementById("demo-notice");

    let sessions = [];

    function formatDate(value) {
        if (!value) return "Chưa hoàn thành";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Không rõ";
        return date.toLocaleString("vi-VN");
    }

    function getStatusLabel(status) {
        const map = {
            CREATED: "Mới tạo",
            IN_PROGRESS: "Đang diễn ra",
            COMPLETED: "Đã hoàn thành",
            EVALUATED: "Đã chấm điểm"
        };
        return map[status] || status;
    }

    function renderHistory() {
        const keyword = (searchInput.value || "").trim().toLowerCase();
        const selectedLevel = levelFilter.value;

        const filteredSessions = sessions.filter(function (session) {
            const matchPosition = String(session.position || "")
                .toLowerCase()
                .includes(keyword);

            const matchLevel =
                selectedLevel === "" ||
                session.level === selectedLevel;

            return matchPosition && matchLevel;
        });

        historyCount.textContent = filteredSessions.length;
        historyEmpty.hidden = filteredSessions.length !== 0;
        historyBody.innerHTML = "";

        filteredSessions.forEach(function (session) {
            const row = document.createElement("tr");

            // 1. Ngày thực hiện
            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(session.started_at || session.date);
            row.appendChild(dateCell);

            // 2. Vị trí
            const posCell = document.createElement("td");
            posCell.innerHTML = `<strong>${session.position}</strong>`;
            row.appendChild(posCell);

            // 3. Cấp độ
            const lvlCell = document.createElement("td");
            lvlCell.textContent = session.level;
            row.appendChild(lvlCell);

            // 4. Trạng thái
            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");
            statusBadge.className = session.status === "COMPLETED" ? "badge badge-completed" : "badge";
            statusBadge.style.fontSize = "12px";
            statusBadge.style.padding = "3px 8px";
            statusBadge.textContent = getStatusLabel(session.status);
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            // 5. Điểm tổng
            const scoreCell = document.createElement("td");
            const scoreBadge = document.createElement("span");
            scoreBadge.className = "history-score";
            if (session.score !== null && session.score !== undefined) {
                scoreBadge.textContent = `${session.score}/100`;
            } else {
                scoreBadge.textContent = "--";
                scoreBadge.style.color = "var(--text-muted)";
            }
            scoreCell.appendChild(scoreBadge);
            row.appendChild(scoreCell);

            // 6. Thao tác
            const actionCell = document.createElement("td");
            const detailLink = document.createElement("a");
            detailLink.className = "history-detail-link";
            const sessId = session.session_id || session.id;
            detailLink.href = "results.html?id=" + encodeURIComponent(sessId);
            detailLink.textContent = "Xem kết quả";
            actionCell.appendChild(detailLink);
            row.appendChild(actionCell);

            historyBody.appendChild(row);
        });
    }

    try {
        if (typeof apiRequest === "function") {
            const res = await apiRequest("/api/interviews/history", { method: "GET" });
            if (res && Array.isArray(res.data)) {
                sessions = res.data;
                if (demoNotice) demoNotice.hidden = true;
            }
        }
    } catch (err) {
        console.warn("Không thể tải lịch sử từ API, chuyển sang dữ liệu mẫu:", err);
        if (typeof getSessions === "function") {
            sessions = getSessions();
            if (demoNotice) {
                demoNotice.hidden = false;
                demoNotice.textContent = "Không thể kết nối máy chủ API. Đang hiển thị dữ liệu lịch sử cục bộ.";
            }
        }
    }

    searchInput.addEventListener("input", renderHistory);
    levelFilter.addEventListener("change", renderHistory);

    renderHistory();
});
