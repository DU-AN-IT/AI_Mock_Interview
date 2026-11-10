// Quản lý điều hướng layout và thanh điều hướng chung
const LayoutManager = {
  setActiveMenu(menuKey) {
    document.querySelectorAll(".menu-item").forEach(item => {
      item.classList.toggle("active", item.dataset.menu === menuKey);
    });
  },

  updatePageTitle(title, subtitle) {
    const titleEl = document.getElementById("page-header-title");
    const subEl = document.getElementById("page-header-sub");
    if (titleEl) titleEl.innerText = title;
    if (subEl) subEl.innerText = subtitle;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  // Gắn event click cho menu sidebar
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const menuKey = item.dataset.menu;
      LayoutManager.setActiveMenu(menuKey);
    });
  });
});