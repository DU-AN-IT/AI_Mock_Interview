
/* =========================================================
   TASK 3: XỬ LÝ CHỌN VỊ TRÍ VÀ CẤP ĐỘ
   ========================================================= */

// Lưu thông tin được lựa chọn
let selectedPosition = "";
let selectedLevel = "";

// =========================================================
// CHỌN VỊ TRÍ
// =========================================================

document.querySelectorAll(".position-card").forEach(card => {

    card.addEventListener("click", function() {

        // Bỏ trạng thái đã chọn của các card khác
        document.querySelectorAll(".position-card").forEach(item => {
            item.classList.remove("selected");
        });

        // Đánh dấu card được chọn
        this.classList.add("selected");

        // Lưu vị trí
        selectedPosition = this.dataset.position;

        // Cập nhật giao diện
        document.getElementById("selected-position").innerText =
            selectedPosition;

        document.getElementById("position-count").innerText =
            "Đã chọn 1 vị trí";

        document.getElementById("selection-message").innerText = "";
    });

});

// =========================================================
// CHỌN CẤP ĐỘ
// =========================================================

document.querySelectorAll(".level-card").forEach(card => {

    card.addEventListener("click", function() {

        // Bỏ trạng thái đã chọn của các card khác
        document.querySelectorAll(".level-card").forEach(item => {
            item.classList.remove("selected");
        });

        // Đánh dấu card được chọn
        this.classList.add("selected");

        // Lưu cấp độ
        selectedLevel = this.dataset.level;

        // Cập nhật giao diện
        document.getElementById("selected-level").innerText =
            selectedLevel;

        document.getElementById("level-count").innerText =
            "Đã chọn 1 cấp độ";

        document.getElementById("selection-message").innerText = "";
    });

});

// =========================================================
// KIỂM TRA VÀ TIẾP TỤC
// =========================================================

document.getElementById("btn-continue").addEventListener("click", function() {

    const message = document.getElementById("selection-message");

    // Kiểm tra vị trí
    if (selectedPosition === "") {
        message.innerText = "Vui lòng chọn vị trí ứng tuyển.";
        return;
    }

    // Kiểm tra cấp độ
    if (selectedLevel === "") {
        message.innerText = "Vui lòng chọn cấp độ kinh nghiệm.";
        return;
    }

    // Hiển thị thông tin đã chọn
    message.style.color = "var(--success)";

    message.innerText =
        "Đã xác nhận: " + selectedPosition + " - " + selectedLevel;

    console.log("Thông tin phỏng vấn:", {
        position: selectedPosition,
        level: selectedLevel
    });

});
