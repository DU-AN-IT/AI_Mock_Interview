const API_URL = "http://127.0.0.1:8000";
const position = localStorage.getItem("selected_position") || "";
const level = localStorage.getItem("selected_level") || "";
const token = localStorage.getItem("access_token") || "";
const answers = [];
let questions = [];
let sessionId = null;
let currentQuestion = 0;
let timeRemaining = 30 * 60;
let timerInterval = null;
let sessionStarted = false;
let sessionFinished = false;
let isSubmitting = false;

const questionNumber = document.getElementById("question-number");
const questionTag = document.getElementById("question-tag");
const questionTitle = document.getElementById("question-title");
const answerInput = document.getElementById("answer-input");
const wordCount = document.getElementById("word-count");
const timer = document.getElementById("timer");
const progressBar = document.querySelector('[role="progressbar"]');
const progressFill = document.getElementById("progress-fill");
const nextButton = document.getElementById("btn-next");
const previousButton = document.getElementById("btn-previous");
const sessionStatus = document.getElementById("session-status");
const endButton = document.getElementById("btn-end-session");
const loadingPanel = document.getElementById("question-loading");
const errorPanel = document.getElementById("question-error");
const submitStatus = document.getElementById("submit-status");

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("is_logged_in");
    }
    throw new Error(data.detail || "Máy chủ xử lý không thành công.");
  }
  return data;
}

function showError(message) {
  errorPanel.textContent = message;
  errorPanel.hidden = false;
  loadingPanel.hidden = true;
}

function setSubmitting(value, message = "") {
  isSubmitting = value;
  nextButton.disabled = value;
  previousButton.disabled = value || currentQuestion === 0;
  endButton.disabled = value;
  submitStatus.textContent = message;
}

async function initializeInterview() {
  if (!token) {
    showError("Bạn chưa đăng nhập bằng tài khoản hệ thống. Vui lòng quay lại trang đăng nhập.");
    return;
  }
  if (!position || !level) {
    showError("Thiếu vị trí hoặc cấp độ phỏng vấn. Vui lòng quay lại trang thiết lập.");
    return;
  }

  try {
    const created = await apiRequest("/api/interviews", {
      method: "POST",
      body: JSON.stringify({ position, level })
    });
    sessionId = created.data.session_id;

    const generated = await apiRequest(`/api/interviews/${sessionId}/questions/generate`, {
      method: "POST",
      body: JSON.stringify({})
    });
    questions = generated.questions.map(item => ({
      id: item.question_id,
      text: item.question_text
    }));
    if (questions.length !== 5) throw new Error("Hệ thống chưa nhận đủ 5 câu hỏi. Vui lòng thử tạo phiên mới.");

    answers.push(...Array(questions.length).fill(""));
    loadingPanel.hidden = true;
    errorPanel.hidden = true;
    document.getElementById("interview-content").hidden = false;
    renderQuestion();
  } catch (error) {
    showError(error.message || "Không thể tải câu hỏi. Vui lòng tải lại trang.");
  }
}

function renderQuestion() {
  if (!questions.length) return;
  questionNumber.textContent = `CÂU HỎI ${String(currentQuestion + 1).padStart(2, "0")} / 05`;
  questionTag.textContent = currentQuestion === 0 ? "CÂU HỎI KHỞI ĐỘNG" : "CÂU HỎI CHUYÊN MÔN";
  questionTitle.textContent = questions[currentQuestion].text;
  answerInput.value = answers[currentQuestion];
  previousButton.disabled = currentQuestion === 0 || isSubmitting;
  nextButton.textContent = currentQuestion === questions.length - 1 ? "Hoàn thành ✓" : sessionStarted ? "Lưu & câu tiếp →" : "Bắt đầu trả lời →";
  progressFill.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(currentQuestion + 1));
  updateWordCount();
  updateAnsweredCount();
}

function updateWordCount() {
  const words = answerInput.value.trim().match(/\S+/g);
  wordCount.textContent = `${words ? words.length : 0} từ`;
}

function updateAnsweredCount() {
  const answered = answers.filter(answer => answer.trim().length > 0).length;
  document.getElementById("answered-count").textContent = `${answered} / 5 câu đã trả lời`;
}

function updateTimer() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (timeRemaining <= 5 * 60) timer.classList.add("is-low");
  if (timeRemaining <= 0) {
    finishSession();
    return;
  }
  timeRemaining -= 1;
}

function startSession() {
  if (sessionStarted || sessionFinished) return;
  sessionStarted = true;
  sessionStatus.classList.add("is-live");
  sessionStatus.querySelector("span:last-child").textContent = "Đang diễn ra";
  timerInterval = window.setInterval(updateTimer, 1000);
  updateTimer();
  renderQuestion();
}

async function saveCurrentAnswer() {
  const text = answerInput.value.trim();
  answers[currentQuestion] = text;
  if (!text) {
    submitStatus.textContent = "Bạn chưa nhập câu trả lời. Hãy nhập trước khi tiếp tục.";
    answerInput.focus();
    return false;
  }
  setSubmitting(true, "Đang gửi câu trả lời...");
  try {
    await apiRequest(`/api/interviews/${sessionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ question_id: questions[currentQuestion].id, answer_text: text })
    });
    setSubmitting(false, "Đã lưu câu trả lời thành công.");
    updateAnsweredCount();
    return true;
  } catch (error) {
    setSubmitting(false, `Lỗi gửi câu trả lời: ${error.message}. Vui lòng thử lại.`);
    return false;
  }
}

async function finishSession() {
  if (sessionFinished || isSubmitting) return;
  if (answerInput.value.trim()) {
    const saved = await saveCurrentAnswer();
    if (!saved) return;
  }
  try {
    await apiRequest(`/api/interviews/${sessionId}/complete`, { method: "POST" });
  } catch (error) {
    setSubmitting(false, `Không thể kết thúc phiên: ${error.message}. Hãy thử lại.`);
    return;
  }

  sessionFinished = true;
  window.clearInterval(timerInterval);
  const answered = answers.filter(answer => answer.trim().length > 0).length;
  document.getElementById("completion-summary").textContent = `Bạn đã gửi ${answered} trên 5 câu trả lời cho vị trí ${position} (${level}). Câu trả lời đã được lưu vào cơ sở dữ liệu.`;
  document.getElementById("interview-content").hidden = true;
  document.querySelector(".session-heading").hidden = true;
  document.getElementById("completion-panel").hidden = false;
  sessionStatus.classList.remove("is-live");
}

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("user_email");
  if (email) document.getElementById("user-display").textContent = email.split("@")[0];
  document.getElementById("session-title").textContent = position ? `Phỏng vấn ${position}` : "Phỏng vấn thử";
  document.getElementById("session-description").textContent = position && level ? `Bộ câu hỏi ${position} dành cho cấp độ ${level}.` : "Đang chuẩn bị bộ câu hỏi phỏng vấn.";
  document.getElementById("selected-position").textContent = position || "Chưa thiết lập";
  document.getElementById("selected-level").textContent = level || "Chưa thiết lập";

  answerInput.addEventListener("input", () => {
    if (questions.length) answers[currentQuestion] = answerInput.value;
    updateWordCount();
    updateAnsweredCount();
  });

  nextButton.addEventListener("click", async () => {
    if (!questions.length || isSubmitting) return;
    if (!sessionStarted) startSession();
    const saved = await saveCurrentAnswer();
    if (!saved) return;
    if (currentQuestion === questions.length - 1) {
      sessionFinished = false;
      await finishSession();
      return;
    }
    currentQuestion += 1;
    renderQuestion();
  });

  previousButton.addEventListener("click", () => {
    if (currentQuestion === 0 || !sessionStarted || isSubmitting) return;
    answers[currentQuestion] = answerInput.value;
    currentQuestion -= 1;
    renderQuestion();
  });

  endButton.addEventListener("click", () => {
    if (window.confirm("Bạn có chắc muốn kết thúc buổi phỏng vấn? Câu trả lời hiện tại sẽ được gửi lên máy chủ.")) finishSession();
  });

  initializeInterview();
});
