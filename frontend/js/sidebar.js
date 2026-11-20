document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("history-toggle");
    const submenu = document.getElementById("history-submenu");

    if (!toggle || !submenu) {
        return;
    }

    const currentPage = window.location.pathname.split("/").pop();

    const submenuLinks = submenu.querySelectorAll(".submenu-item");

    submenuLinks.forEach(function (link) {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    function setMenuOpen(isOpen) {
        submenu.hidden = !isOpen;
        toggle.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
    }

    // Mặc định mở khi đang ở trang lịch sử hoặc kết quả
    const isHistoryPage =
        currentPage === "history.html" ||
        currentPage === "results.html";

    setMenuOpen(isHistoryPage);

    toggle.addEventListener("click", function () {
        setMenuOpen(submenu.hidden);
    });
});
