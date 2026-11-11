
/* =========================================================
   QUẢN LÝ ĐIỀU HƯỚNG LAYOUT
   ========================================================= */

const LayoutManager = {

    // Cập nhật menu đang được chọn
    setActiveMenu(menuKey) {

        document.querySelectorAll(".menu-item").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.menu === menuKey
            );
        });

    },

    // Cập nhật tiêu đề trang
    updatePageTitle(title, subtitle) {

        const titleEl = document.getElementById("page-header-title");
        const subEl = document.getElementById("page-header-sub");

        if (titleEl) titleEl.innerText = title;
        if (subEl) subEl.innerText = subtitle;

    },

    // Chuyển đổi nội dung trang
    showPage(menuKey) {

        const authPage = document.getElementById("auth-page");
        const positionsPage = document.getElementById("positions-page");

        if (menuKey === "auth") {

            authPage.style.display = "block";
            positionsPage.style.display = "none";

            this.updatePageTitle(
                "Xác thực hệ thống",
                "Sprint 2 – Ngày 8 | AI Mock Interview"
            );

        } else if (menuKey === "positions") {

            authPage.style.display = "none";
            positionsPage.style.display = "block";

            this.updatePageTitle(
                "Vị trí & Cấp độ",
                "Lựa chọn vị trí công việc và cấp độ phỏng vấn"
            );

        }

        this.setActiveMenu(menuKey);

    }

};

// =========================================================
// KHỞI TẠO SỰ KIỆN
// =========================================================

window.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".menu-item").forEach(item => {

        item.addEventListener("click", (e) => {

            e.preventDefault();

            const menuKey = item.dataset.menu;

            if (menuKey === "auth" || menuKey === "positions") {
                LayoutManager.showPage(menuKey);
            }

        });

    });

});
