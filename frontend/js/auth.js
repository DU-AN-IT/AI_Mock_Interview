// =========================================================
// CHUYỂN TAB ĐĂNG NHẬP / ĐĂNG KÝ
// =========================================================
function switchAuthMode(mode) {
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const heading = document.getElementById("auth-heading");
  const subheading = document.getElementById("auth-subheading");

  clearAllErrors();
  hideAlert();

  if (mode === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.style.display = "block";
    formRegister.style.display = "none";
    heading.innerText = "Chào mừng bạn quay trở lại";
    subheading.innerText = "Vui lòng đăng nhập để bắt đầu phiên phỏng vấn";
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.style.display = "block";
    formLogin.style.display = "none";
    heading.innerText = "Tạo tài khoản ứng viên";
    subheading.innerText = "Đăng ký tài khoản để bắt đầu rèn luyện cùng AI";
  }
}

// Helpers
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (field && errorEl) {
    field.classList.add("input-error");
    errorEl.innerText = message;
  }
}

function clearAllErrors() {
  document.querySelectorAll(".form-control").forEach(input => input.classList.remove("input-error"));
  document.querySelectorAll(".error-text").forEach(txt => txt.innerText = "");
}

function showAlert(message, type = "danger") {
  const alertEl = document.getElementById("auth-alert");
  alertEl.className = `alert-box alert-${type}`;
  alertEl.innerText = message;
  alertEl.style.display = "block";
}

function hideAlert() {
  const alertEl = document.getElementById("auth-alert");
  alertEl.style.display = "none";
  alertEl.innerText = "";
}

// =========================================================
// VALIDATION ĐĂNG NHẬP
// =========================================================
function handleLogin(event) {
  event.preventDefault();
  clearAllErrors();
  hideAlert();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  let hasError = false;

  if (!email) {
    setFieldError("login-email", "err-login-email", "Vui lòng nhập địa chỉ email.");
    hasError = true;
  } else if (!isValidEmail(email)) {
    setFieldError("login-email", "err-login-email", "Địa chỉ email không đúng định dạng.");
    hasError = true;
  }

  if (!password) {
    setFieldError("login-password", "err-login-password", "Vui lòng nhập mật khẩu.");
    hasError = true;
  }

  if (hasError) return;

  showAlert("Đang kiểm tra thông tin đăng nhập...", "success");
  console.log("Dữ liệu đăng nhập:", { email, password });
}

// =========================================================
// VALIDATION ĐĂNG KÝ
// =========================================================
function handleRegister(event) {
  event.preventDefault();
  clearAllErrors();
  hideAlert();

  const fullname = document.getElementById("reg-fullname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirmPassword = document.getElementById("reg-confirm-password").value;
  let hasError = false;

  if (!fullname) {
    setFieldError("reg-fullname", "err-reg-fullname", "Vui lòng nhập họ và tên.");
    hasError = true;
  } else if (fullname.length < 2) {
    setFieldError("reg-fullname", "err-reg-fullname", "Họ tên phải có ít nhất 2 ký tự.");
    hasError = true;
  }

  if (!email) {
    setFieldError("reg-email", "err-reg-email", "Vui lòng nhập địa chỉ email.");
    hasError = true;
  } else if (!isValidEmail(email)) {
    setFieldError("reg-email", "err-reg-email", "Email không đúng định dạng hợp lệ.");
    hasError = true;
  }

  if (!password) {
    setFieldError("reg-password", "err-reg-password", "Vui lòng nhập mật khẩu.");
    hasError = true;
  } else if (password.length < 6) {
    setFieldError("reg-password", "err-reg-password", "Mật khẩu phải từ 6 ký tự trở lên.");
    hasError = true;
  }

  if (!confirmPassword) {
    setFieldError("reg-confirm-password", "err-reg-confirm", "Vui lòng nhập lại mật khẩu.");
    hasError = true;
  } else if (confirmPassword !== password) {
    setFieldError("reg-confirm-password", "err-reg-confirm", "Mật khẩu xác nhận không khớp.");
    hasError = true;
  }

  if (hasError) return;

  showAlert("Tạo tài khoản thành công! Đang chuyển sang màn hình đăng nhập...", "success");
  setTimeout(() => {
    document.getElementById("form-register").reset();
    switchAuthMode("login");
    document.getElementById("login-email").value = email;
  }, 1200);
}