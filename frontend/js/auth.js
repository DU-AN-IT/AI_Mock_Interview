const AUTH_API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://127.0.0.1:8000";

async function callAuthApi(endpoint, payload) {
  if (typeof apiRequest === "function") {
    return apiRequest(endpoint, { method: "POST", body: payload });
  }

  let response;
  try {
    response = await fetch(`${AUTH_API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Không thể kết nối đến Backend (http://127.0.0.1:8000). Hãy kiểm tra server FastAPI đang chạy.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && (data.detail || data.message)) || `Lỗi hệ thống (HTTP ${response.status}).`);
  }
  return data;
}

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
  document.querySelectorAll(".form-control").forEach((input) => input.classList.remove("input-error"));
  document.querySelectorAll(".error-text").forEach((txt) => (txt.innerText = ""));
}

function showAlert(message, type = "danger") {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;
  alertEl.className = `alert-box alert-${type}`;
  alertEl.innerText = message;
  alertEl.style.display = "block";
}

function hideAlert() {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;
  alertEl.style.display = "none";
  alertEl.innerText = "";
}

async function handleLogin(event) {
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

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  showAlert("Đang đăng nhập vào hệ thống...", "success");

  try {
    const res = await callAuthApi("/api/auth/login", { email, password });
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("user_email", res.user.email);
    localStorage.setItem("user_name", res.user.full_name);
    localStorage.removeItem("current_session_id");

    showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");
    setTimeout(() => {
      window.location.href = "positions.html";
    }, 600);
  } catch (err) {
    showAlert(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.", "danger");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleRegister(event) {
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

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  showAlert("Đang tạo tài khoản...", "success");

  try {
    await callAuthApi("/api/auth/register", {
      full_name: fullname,
      email,
      password,
    });

    showAlert("Tạo tài khoản thành công! Đang chuyển sang màn hình đăng nhập...", "success");
    setTimeout(() => {
      document.getElementById("form-register").reset();
      switchAuthMode("login");
      document.getElementById("login-email").value = email;
    }, 900);
  } catch (err) {
    showAlert(err.message || "Đăng ký thất bại. Vui lòng thử lại.", "danger");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}