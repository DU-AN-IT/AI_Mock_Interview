const questionSets = {
  Frontend: [
    "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn chọn phát triển Frontend.",
    "Bạn giải thích sự khác nhau giữa let, const và var trong JavaScript như thế nào?",
    "Bạn thường tổ chức CSS thế nào để giao diện dễ bảo trì và hoạt động tốt trên nhiều kích thước màn hình?",
    "Hãy kể về một lỗi giao diện khó mà bạn từng gặp và cách bạn xử lý.",
    "Bạn sẽ làm gì để cải thiện hiệu năng tải trang web?"
  ],
  Backend: [
    "Hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm phát triển Backend của bạn.",
    "Bạn thiết kế một REST API dễ sử dụng và dễ mở rộng như thế nào?",
    "Bạn sẽ xử lý xác thực và phân quyền người dùng trong một ứng dụng ra sao?",
    "Hãy kể về một vấn đề hiệu năng hoặc lỗi hệ thống mà bạn từng xử lý.",
    "Bạn sẽ bảo vệ API và dữ liệu trước các truy cập không hợp lệ như thế nào?"
  ],
  Tester: [
    "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn chọn công việc kiểm thử phần mềm.",
    "Bạn sẽ viết test case cho chức năng đăng nhập như thế nào?",
    "Bạn phân biệt kiểm thử hồi quy và kiểm thử xác nhận ra sao?",
    "Hãy mô tả cách bạn báo cáo một lỗi để nhóm phát triển có thể tái hiện.",
    "Khi thời gian kiểm thử bị giới hạn, bạn ưu tiên kiểm thử những gì?"
  ],
  BA: [
    "Hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm phân tích nghiệp vụ của bạn.",
    "Bạn sẽ làm rõ một yêu cầu còn mơ hồ từ khách hàng như thế nào?",
    "Bạn thường dùng cách nào để mô hình hóa quy trình nghiệp vụ?",
    "Hãy kể về một lần các bên liên quan có yêu cầu mâu thuẫn và cách bạn xử lý.",
    "Bạn xác nhận một yêu cầu đã được đáp ứng bằng cách nào?"
  ]
};

const position = localStorage.getItem("selected_position") || "";
const level = localStorage.getItem("selected_level") || "";
const questions = questionSets[position] || [
  "Hãy giới thiệu ngắn gọn về bản thân và mục tiêu nghề nghiệp của bạn.",
  "Bạn tự hào nhất về kỹ năng hoặc dự án nào của mình?",
  "Bạn thường giải quyết một vấn đề mới mà mình chưa biết như thế nào?",
  "Hãy kể về một lần bạn nhận được góp ý và đã cải thiện bản thân.",
  "Bạn mong muốn phát triển điều gì trong công việc tiếp theo?"
];
const answers = Array(questions.length).fill("");
const sessionDuration = 30 * 60;

let currentQuestion = 0;
let timeRemaining = sessionDuration;
let timerInterval = null;
let sessionStarted = false;
let sessionFinished = false;

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

function renderQuestion() {
  const questionIndex = currentQuestion;
  questionNumber.textContent = `CÂU HỎI ${String(questionIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
  questionTag.textContent = questionIndex === 0 ? "CÂU HỎI KHỞI ĐỘNG" : "CÂU HỎI CHUYÊN MÔN";
  questionTitle.textContent = questions[questionIndex];
  answerInput.value = answers[questionIndex];
  previousButton.disabled = questionIndex === 0;
  nextButton.innerHTML = sessionStarted
    ? questionIndex === questions.length - 1 ? "Hoàn thành <span aria-hidden=\"true\">✓</span>" : "Lưu &amp; câu tiếp <span aria-hidden=\"true\">→</span>"
    : "Bắt đầu trả lời <span aria-hidden=\"true\">→</span>";
  progressFill.style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(questionIndex + 1));
  updateWordCount();
}

function updateWordCount() {
  const words = answerInput.value.trim().match(/\S+/g);
  wordCount.textContent = `${words ? words.length : 0} từ`;
}

function updateAnsweredCount() {
  const answered = answers.filter(answer => answer.trim().length > 0).length;
  document.getElementById("answered-count").textContent = `${answered} / ${questions.length} câu đã trả lời`;
}

function updateTimer() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (timeRemaining <= 5 * 60) {
    timer.classList.add("is-low");
  }

  if (timeRemaining <= 0) {
    finishSession();
    return;
  }

  timeRemaining -= 1;
}

function startSession() {
  if (sessionStarted || sessionFinished) {
    return;
  }

  sessionStarted = true;
  sessionStatus.classList.add("is-live");
  sessionStatus.querySelector("span:last-child").textContent = "Đang diễn ra";
  timerInterval = window.setInterval(updateTimer, 1000);
  updateTimer();
  renderQuestion();
}

function finishSession() {
  if (sessionFinished) {
    return;
  }

  sessionFinished = true;
  window.clearInterval(timerInterval);
  answers[currentQuestion] = answerInput.value;
  updateAnsweredCount();

  const answered = answers.filter(answer => answer.trim().length > 0).length;
  document.getElementById("completion-summary").textContent =
    `Bạn đã trả lời ${answered} trên ${questions.length} câu hỏi${position ? ` cho vị trí ${position}` : ""}. Câu trả lời chỉ tồn tại trong phiên hiện tại và không được gửi lên máy chủ.`;
  document.getElementById("interview-content").hidden = true;
  document.querySelector(".session-heading").hidden = true;
  document.getElementById("completion-panel").hidden = false;
  sessionStatus.classList.remove("is-live");
}

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("user_email");
  if (email) {
    document.getElementById("user-display").textContent = email.split("@")[0];
  }

  document.getElementById("session-title").textContent =
    position ? `Phỏng vấn ${position}` : "Phỏng vấn thử";
  document.getElementById("session-description").textContent =
    position && level ? `Bộ câu hỏi ${position} dành cho cấp độ ${level}.` : "Bạn có thể chọn vị trí và cấp độ để cá nhân hóa bộ câu hỏi.";
  document.getElementById("selected-position").textContent = position || "Chưa thiết lập";
  document.getElementById("selected-level").textContent = level || "Chưa thiết lập";

  renderQuestion();

  answerInput.addEventListener("input", () => {
    answers[currentQuestion] = answerInput.value;
    updateWordCount();
    updateAnsweredCount();
  });

  nextButton.addEventListener("click", () => {
    if (!sessionStarted) {
      startSession();
      return;
    }

    answers[currentQuestion] = answerInput.value;
    updateAnsweredCount();
    if (currentQuestion === questions.length - 1) {
      finishSession();
      return;
    }

    currentQuestion += 1;
    renderQuestion();
  });

  previousButton.addEventListener("click", () => {
    if (currentQuestion === 0 || !sessionStarted) {
      return;
    }

    answers[currentQuestion] = answerInput.value;
    currentQuestion -= 1;
    renderQuestion();
    updateAnsweredCount();
  });

  endButton.addEventListener("click", () => {
    if (window.confirm("Bạn có chắc muốn kết thúc buổi phỏng vấn?")) {
      finishSession();
    }
  });
});
