const API_BASE_URL = "http://127.0.0.1:8000";

function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

async function apiRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errMsg =
        (data && (data.detail || data.message)) ||
        `Yêu cầu thất bại (HTTP ${response.status}).`;
      const error = new Error(errMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutError = new Error("Quá thời gian kết nối máy chủ. Vui lòng thử lại.");
      timeoutError.status = 408;
      throw timeoutError;
    }
    if (err instanceof TypeError) {
      const netError = new Error(
        "Không thể kết nối đến Backend (http://127.0.0.1:8000). Hãy kiểm tra server FastAPI đang chạy."
      );
      netError.status = 0;
      throw netError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}