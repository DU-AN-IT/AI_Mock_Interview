// Trạng thái lựa chọn
let selectedPosition = "";
let selectedLevel = "";

// Cập nhật tên hiển thị nếu có
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("user_email");
  if (email) {
    const userDisplay = document.getElementById("user-display");
    if (userDisplay) userDisplay.innerText = email.split("@")[0];
  }
});

// 1. CHỌN VỊ TRÍ
document.querySelectorAll(".position-card").forEach(card => {
  card.addEventListener("click", function() {
    document.querySelectorAll(".position-card").forEach(item => item.classList.remove("selected"));
    this.classList.add("selected");
    selectedPosition = this.dataset.position;

    document.getElementById("selected-position").innerText = selectedPosition;
    document.getElementById("position-count").innerText = "Đã chọn 1 vị trí";
    document.getElementById("selection-message").innerText = "";
  });
});

// 2. CHỌN CẤP ĐỘ
document.querySelectorAll(".level-card").forEach(card => {
  card.addEventListener("click", function() {
    document.querySelectorAll(".level-card").forEach(item => item.classList.remove("selected"));
    this.classList.add("selected");
    selectedLevel = this.dataset.level;

    document.getElementById("selected-level").innerText = selectedLevel;
    document.getElementById("level-count").innerText = "Đã chọn 1 cấp độ";
    document.getElementById("selection-message").innerText = "";
  });
});

// 3. XÁC NHẬN THIẾT LẬP
document.getElementById("btn-continue").addEventListener("click", function() {
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

  // Lưu cấu hình vào localStorage
  localStorage.setItem("selected_position", selectedPosition);
  localStorage.setItem("selected_level", selectedLevel);

  message.style.color = "var(--success)";
  message.innerText = `Đã lưu: ${selectedPosition} (${selectedLevel}). Thiết lập hoàn tất!`;
});