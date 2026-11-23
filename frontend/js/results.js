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

    const params = new URLSearchParams(window.location.search);
    let sessionId = params.get("id") || localStorage.getItem("current_session_id");

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatDate(value) {
        if (!value) return "Chưa hoàn thành";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Không rõ";
        return date.toLocaleString("vi-VN");
    }

    function showList(elementId, items) {
        const list = document.getElementById(elementId);
        if (!list) return;
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

    // ==========================================
    // VẼ BIỂU ĐỒ RADAR (SPIDER CHART) BẰNG CANVAS
    // ==========================================
    function drawRadarChart(radarData) {
        const canvas = document.getElementById("radarCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Support high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const width = 340;
        const height = 340;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = 110;

        const axes = [
            { key: "accuracy", label: "Tính chính xác", color: "#2563eb" },
            { key: "completeness", label: "Độ đầy đủ", color: "#059669" },
            { key: "clarity", label: "Tính mạch lạc", color: "#d97706" },
            { key: "examples", label: "Lập luận & Ví dụ", color: "#7c3aed" },
        ];

        const totalAxes = axes.length;
        const angleStep = (Math.PI * 2) / totalAxes;
        // Bắt đầu từ trục hướng lên trên (-PI/2)
        const startAngle = -Math.PI / 2;

        // 1. Vẽ các vòng đa giác đồng tâm (Grid rings: 25%, 50%, 75%, 100%)
        const levels = [0.25, 0.5, 0.75, 1.0];
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;

        levels.forEach((level) => {
            ctx.beginPath();
            for (let i = 0; i < totalAxes; i++) {
                const angle = startAngle + i * angleStep;
                const r = maxRadius * level;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // Nhãn mức phần trăm
            ctx.fillStyle = "#94a3b8";
            ctx.font = "10px sans-serif";
            ctx.fillText(Math.round(level * 100) + "%", centerX + 4, centerY - maxRadius * level + 11);
        });

        // 2. Vẽ các trục tia từ tâm ra ngoài
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        for (let i = 0; i < totalAxes; i++) {
            const angle = startAngle + i * angleStep;
            const x = centerX + maxRadius * Math.cos(angle);
            const y = centerY + maxRadius * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // 3. Tính tọa độ dữ liệu ứng viên
        const dataPoints = [];
        axes.forEach((axis, i) => {
            const rawVal = radarData ? (radarData[axis.key] || 0) : 0;
            const val = Math.max(5, Math.min(100, rawVal));
            const ratio = val / 100;
            const angle = startAngle + i * angleStep;
            const x = centerX + maxRadius * ratio * Math.cos(angle);
            const y = centerY + maxRadius * ratio * Math.sin(angle);
            dataPoints.push({ x, y, val });
        });

        // 4. Vẽ vùng đa giác dữ liệu của ứng viên
        if (dataPoints.length > 0) {
            ctx.beginPath();
            dataPoints.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();

            // Tô màu gradient mờ
            const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.45)");
            gradient.addColorStop(1, "rgba(37, 99, 235, 0.15)");
            ctx.fillStyle = gradient;
            ctx.fill();

            // Viền đa giác
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // 5. Vẽ các chấm điểm tại các đỉnh
            dataPoints.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.strokeStyle = "#2563eb";
                ctx.lineWidth = 2.5;
                ctx.stroke();
            });
        }

        // 6. Vẽ nhãn văn bản tên trục
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelOffset = 26;
        axes.forEach((axis, i) => {
            const angle = startAngle + i * angleStep;
            const lx = centerX + (maxRadius + labelOffset) * Math.cos(angle);
            const ly = centerY + (maxRadius + labelOffset) * Math.sin(angle);
            ctx.fillText(axis.label, lx, ly);
        });

        // 7. Render danh sách các thanh tiêu chí bên cạnh biểu đồ
        renderRadarMetrics(radarData, axes);
    }

    function renderRadarMetrics(radarData, axes) {
        const container = document.getElementById("radar-metrics");
        if (!container) return;
        container.innerHTML = "";

        axes.forEach((axis) => {
            const rawVal = radarData ? (radarData[axis.key] || 0) : 0;
            const val = Math.round(rawVal);

            let statusText = "Khá";
            let statusColor = "var(--primary)";
            if (val >= 80) {
                statusText = "Xuất sắc";
                statusColor = "var(--success)";
            } else if (val < 60) {
                statusText = "Cần cải thiện";
                statusColor = "#e11d48";
            }

            const item = document.createElement("div");
            item.className = "metric-item";
            item.innerHTML = `
                <div class="metric-header">
                    <span>${axis.label}</span>
                    <span><strong style="color: ${statusColor};">${val}%</strong> (${statusText})</span>
                </div>
                <div class="metric-bar-bg">
                    <div class="metric-bar-fill" style="width: ${val}%;"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ==========================================
    // RENDER CHI TIẾT CÂU HỎI KÈM MODEL ANSWER
    // ==========================================
    function renderQuestionsList(questions) {
        const container = document.getElementById("result-questions-container");
        if (!container) return;
        container.innerHTML = "";

        if (!Array.isArray(questions) || questions.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">Không có câu hỏi nào trong phiên này.</p>`;
            return;
        }

        questions.forEach((q, idx) => {
            const card = document.createElement("div");
            card.className = "question-result-card";

            const scoreDisplay = q.score !== null && q.score !== undefined
                ? `<span class="question-result-score">${q.score} / 10 điểm</span>`
                : `<span class="question-result-score" style="background:#f1f5f9; color:#64748b; border-color:#cbd5e1;">Chưa chấm</span>`;

            const answerHtml = q.answer_content
                ? `<div class="question-result-answer"><strong>Câu trả lời của bạn:</strong><br>${q.answer_content}</div>`
                : `<div class="question-result-answer" style="color: var(--text-muted); font-style: italic;">Chưa gửi câu trả lời</div>`;

            const feedbackHtml = q.feedback
                ? `<div class="question-result-feedback"><strong>Đánh giá từ AI:</strong><br>${q.feedback}</div>`
                : "";

            // Nút & Hộp xem gợi ý chuẩn từ chuyên gia
            const modelAnsId = `model-ans-${q.question_id || idx}`;
            let modelAnsHtml = "";
            if (q.model_answer) {
                modelAnsHtml = `
                    <div style="margin-top: 10px;">
                        <button type="button" class="btn-view-model-ans" data-target="${modelAnsId}">
                            💡 Xem câu trả lời chuẩn từ chuyên gia
                        </button>
                        <div id="${modelAnsId}" class="model-ans-box" hidden>
                            <strong style="display: block; margin-bottom: 4px;">Gợi ý câu trả lời chuẩn:</strong>
                            <div style="white-space: pre-wrap;">${q.model_answer}</div>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="question-result-header">
                    <span class="question-result-badge">Câu ${q.question_order}</span>
                    ${scoreDisplay}
                </div>
                <div class="question-result-content">${q.question_content}</div>
                ${answerHtml}
                ${feedbackHtml}
                ${modelAnsHtml}
            `;

            container.appendChild(card);
        });

        // Gắn sự kiện toggle cho các nút xem model answer
        container.querySelectorAll(".btn-view-model-ans").forEach((btn) => {
            btn.addEventListener("click", function () {
                const targetId = this.getAttribute("data-target");
                const targetBox = document.getElementById(targetId);
                if (targetBox) {
                    targetBox.hidden = !targetBox.hidden;
                    this.textContent = targetBox.hidden
                        ? "💡 Xem câu trả lời chuẩn từ chuyên gia"
                        : "Ẩn câu trả lời chuẩn";
                }
            });
        });
    }

    function renderResultData(session, isDemo = false) {
        const demoNotice = document.getElementById("demo-notice");
        if (demoNotice) {
            demoNotice.hidden = !isDemo;
        }

        let positionName = session.position;
        if (positionName === "Frontend" || positionName === "Backend") {
            positionName += " Developer";
        }

        setText("result-position", positionName);
        setText("result-meta", session.level + " · " + formatDate(session.started_at || session.date));
        setText("result-score", session.score !== null && session.score !== undefined ? session.score : "--");
        setText("result-status", isDemo ? "Dữ liệu mẫu" : (session.status === "COMPLETED" ? "Đã hoàn thành" : "Đang thực hiện"));
        setText("result-feedback", session.feedback || "Chưa có nhận xét tổng quan.");
        setText("result-id", session.session_id || session.id || "--");
        setText("result-date", formatDate(session.started_at || session.date));
        setText("result-position-detail", session.position);
        setText("result-level", session.level);

        showList("result-strengths", session.strengths);
        showList("result-weaknesses", session.weaknesses);

        // Vẽ biểu đồ Radar
        const radar = session.radar_data || {
            accuracy: session.score ? Math.min(100, session.score + 2) : 75,
            completeness: session.score ? Math.min(100, session.score - 3) : 70,
            clarity: session.score ? Math.min(100, session.score + 1) : 78,
            examples: session.score ? Math.max(30, session.score - 5) : 65,
        };
        drawRadarChart(radar);

        if (session.questions) {
            renderQuestionsList(session.questions);
        } else {
            const container = document.getElementById("result-questions-container");
            if (container) container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">Không có chi tiết câu hỏi.</p>`;
        }
    }

    // Cố gắng gọi API
    let loadedFromApi = false;
    if (sessionId && typeof apiRequest === "function") {
        try {
            const res = await apiRequest(`/api/interviews/${sessionId}/result`, { method: "GET" });
            if (res && res.data) {
                renderResultData(res.data, false);
                loadedFromApi = true;
            }
        } catch (err) {
            console.warn("Không thể tải kết quả từ API:", err);
        }
    }

    // Nếu không có sessionId hoặc API thất bại, thử lấy phiên đầu tiên từ API history
    if (!loadedFromApi && typeof apiRequest === "function") {
        try {
            const historyRes = await apiRequest("/api/interviews/history", { method: "GET" });
            if (historyRes && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
                const firstSession = historyRes.data[0];
                const detailRes = await apiRequest(`/api/interviews/${firstSession.session_id}/result`, { method: "GET" });
                if (detailRes && detailRes.data) {
                    renderResultData(detailRes.data, false);
                    loadedFromApi = true;
                }
            }
        } catch (err) {
            console.warn("Không thể tải phiên từ lịch sử API:", err);
        }
    }

    // Dự phòng dữ liệu mẫu nếu chưa có dữ liệu nào
    if (!loadedFromApi) {
        if (typeof getSessions === "function") {
            const sessions = getSessions();
            let session = null;
            if (sessionId) {
                session = sessions.find((item) => String(item.id) === sessionId);
            }
            if (!session) {
                session = sessions[0];
            }
            if (session) {
                renderResultData(session, true);
                return;
            }
        }

        document.querySelector(".results-wrapper").innerHTML = `
            <section class="result-card">
                <h3>Không tìm thấy kết quả</h3>
                <p>Chưa có phiên phỏng vấn nào để hiển thị kết quả.</p>
                <div class="result-actions">
                    <a href="positions.html" class="result-btn">Bắt đầu phỏng vấn</a>
                </div>
            </section>
        `;
    }
});
