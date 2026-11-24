let selectedPosition = "";
let selectedLevel = "";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "auth.html";
    return;
  }

  const userName = localStorage.getItem("user_name");
  const email = localStorage.getItem("user_email");
  const userDisplay = document.getElementById("user-display");
  if (userDisplay) {
    userDisplay.innerText = userName || (email ? email.split("@")[0] : "Đã đăng nhập");
  }
});

// 1. CHỌN VỊ TRÍ
document.querySelectorAll(".position-card").forEach((card) => {
  card.addEventListener("click", function () {
    document.querySelectorAll(".position-card").forEach((item) => item.classList.remove("selected"));
    this.classList.add("selected");
    selectedPosition = this.dataset.position;

    document.getElementById("selected-position").innerText = selectedPosition;
    document.getElementById("position-count").innerText = "Đã chọn 1 vị trí";
    document.getElementById("selection-message").innerText = "";
  });
});

// 2. CHỌN CẤP ĐỘ
document.querySelectorAll(".level-card").forEach((card) => {
  card.addEventListener("click", function () {
    document.querySelectorAll(".level-card").forEach((item) => item.classList.remove("selected"));
    this.classList.add("selected");
    selectedLevel = this.dataset.level;

    document.getElementById("selected-level").innerText = selectedLevel;
    document.getElementById("level-count").innerText = "Đã chọn 1 cấp độ";
    document.getElementById("selection-message").innerText = "";
  });
});

// 3. XÁC NHẬN THIẾT LẬP VÀ SANG PHÒNG PHỎNG VẤN
document.getElementById("btn-continue").addEventListener("click", function () {
  const message = document.getElementById("selection-message");

  if (!selectedPosition) {
    message.style.color = "var(--danger)";
    message.innerText = "Vui lòng chọn 1 vị trí công việc.";
    return;
  }

  if (!selectedLevel) {
    message.style.color = "var(--danger)";
    message.innerText = "Vui lòng chọn 1 cấp độ kinh nghiệm.";
    return;
  }

  localStorage.setItem("selected_position", selectedPosition);
  localStorage.setItem("selected_level", selectedLevel);
  localStorage.removeItem("current_session_id");

  message.style.color = "var(--success)";
  message.innerText = `Đã chọn: ${selectedPosition} (${selectedLevel}). Đang vào phòng phỏng vấn...`;

  setTimeout(() => {
    window.location.href = "interview.html";
  }, 500);
});