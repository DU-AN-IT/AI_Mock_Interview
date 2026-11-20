document.addEventListener("DOMContentLoaded", function () {
    const sessions = getSessions();

    const historyBody = document.getElementById("history-body");
    const searchInput = document.getElementById("search-input");
    const levelFilter = document.getElementById("level-filter");
    const historyCount = document.getElementById("history-count");
    const historyEmpty = document.getElementById("history-empty");

    if (isDemoData()) {
        document.getElementById("demo-notice").hidden = false;
    }

    function renderHistory() {
        const keyword = searchInput.value.trim().toLowerCase();
        const selectedLevel = levelFilter.value;

        const filteredSessions = sessions.filter(function (session) {
            const matchPosition = String(session.position)
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

            const values = [
                formatDate(session.date),
                session.position,
                session.level
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const scoreCell = document.createElement("td");
            const scoreBadge = document.createElement("span");

            scoreBadge.className = "history-score";
            scoreBadge.textContent = (session.score ?? "--") + "/100";

            scoreCell.appendChild(scoreBadge);
            row.appendChild(scoreCell);

            const actionCell = document.createElement("td");
            const detailLink = document.createElement("a");

            detailLink.className = "history-detail-link";
            detailLink.href = "results.html?id=" +
                encodeURIComponent(session.id);
            detailLink.textContent = "Xem chi tiết";

            actionCell.appendChild(detailLink);
            row.appendChild(actionCell);

            historyBody.appendChild(row);
        });
    }

    searchInput.addEventListener("input", renderHistory);
    levelFilter.addEventListener("change", renderHistory);

    renderHistory();
});
