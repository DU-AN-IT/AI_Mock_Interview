const state = {
  sessionId: null,
  positionName: "",
  levelName: "",
  sessionStatus: "CREATED",
  questions: [],
  currentIndex: 0,
  drafts: {},
  isLoadingSession: false,
  isSubmitting: false,
  lastFailedAction: null,
};

const els = {
  banner: document.getElementById("status-banner"),
  bannerText: document.getElementById("status-banner-text"),
  btnRetry: document.getElementById("btn-retry"),
  userStatus: document.getElementById("interview-user-status"),
  sessionBadgeInfo: document.getElementById("session-badge-info"),
  sessionIdLabel: document.getElementById("session-id-label"),
  metaPosition: document.getElementById("meta-position"),
  metaLevel: document.getElementById("meta-level"),
  metaStatus: document.getElementById("meta-status"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  questionSteps: document.getElementById("question-steps"),
  questionIndexBadge: document.getElementById("question-index-badge"),
  answerStateBadge: document.getElementById("answer-state-badge"),
  questionContent: document.getElementById("question-content"),
  answerInput: document.getElementById("answer-input"),
  evaluation: document.getElementById("answer-evaluation"),
  evaluationScore: document.getElementById("answer-score"),
  evaluationFeedback: document.getElementById("answer-feedback"),
  btnToggleModelAnswer: document.getElementById("btn-toggle-model-answer"),
  modelAnswerContainer: document.getElementById("model-answer-container"),
  modelAnswerText: document.getElementById("model-answer-text"),
  wordCount: document.getElementById("word-count"),
  btnPrev: document.getElementById("btn-prev"),
  btnSubmit: document.getElementById("btn-submit-answer"),
  btnNext: document.getElementById("btn-next"),
  btnLogout: document.getElementById("btn-logout"),
  emptyQuestionState: document.getElementById("empty-question-state"),
  btnEmptyRetry: document.getElementById("btn-empty-retry"),
  progressCard: document.querySelector(".progress-card"),
  qaCard: document.querySelector(".qa-card"),
  completedBanner: document.getElementById("session-completed-banner"),
  btnViewResults: document.getElementById("btn-view-results"),
};

function showBanner(type, message, showRetry = false) {
  els.banner.className = `status-banner show ${type}`;
  if (type === "loading") {
    els.bannerText.innerHTML = `<span class="spinner"></span> ${message}`;
  } else {
    els.bannerText.textContent = message;
  }
  els.btnRetry.style.display = showRetry ? "inline-flex" : "none";
}

function hideBanner() {
  els.banner.className = "status-banner";
  els.btnRetry.style.display = "none";
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function updateWordCount() {
  els.wordCount.textContent = `${countWords(els.answerInput.value)} từ`;
}

function renderStatusBadge() {
  const statusMap = {
    CREATED: "Mới tạo",
    IN_PROGRESS: "Đang phỏng vấn",
    COMPLETED: "Đã hoàn thành 5/5 câu",
    EVALUATED: "Đã chấm điểm",
  };
  els.metaStatus.textContent = statusMap[state.sessionStatus] || state.sessionStatus;
  els.metaStatus.className =
    state.sessionStatus === "COMPLETED" || state.sessionStatus === "EVALUATED"
      ? "badge badge-completed"
      : "badge badge-status";
}

function renderProgress() {
  const total = state.questions.length || 5;
  const answered = state.questions.filter((q) => q.answered).length;
  const percent = Math.round((answered / total) * 100);
  els.progressFill.style.width = `${percent}%`;
  els.progressText.textContent = `${answered} / ${total} câu đã gửi`;
}

function renderQuestionSteps() {
  els.questionSteps.innerHTML = "";
  state.questions.forEach((q, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-btn";
    if (idx === state.currentIndex) btn.classList.add("active");
    if (q.answered) btn.classList.add("answered");
    btn.textContent = q.answered ? `Câu ${q.question_order} ✓` : `Câu ${q.question_order}`;
    btn.disabled = state.isSubmitting;
    btn.addEventListener("click", () => {
      saveCurrentDraft();
      state.currentIndex = idx;
      hideBanner();
      renderCurrentQuestion();
    });
    els.questionSteps.appendChild(btn);
  });
}

function saveCurrentDraft() {
  const q = state.questions[state.currentIndex];
  if (q && !q.answered) {
    state.drafts[q.question_id] = els.answerInput.value;
  }
}

function renderCurrentQuestion() {
  const total = state.questions.length;
  if (!total) {
    els.progressCard.hidden = true;
    els.qaCard.hidden = true;
    els.emptyQuestionState.hidden = false;
    return;
  }

  els.progressCard.hidden = false;
  els.qaCard.hidden = false;
  els.emptyQuestionState.hidden = true;

  const q = state.questions[state.currentIndex];
  els.sessionIdLabel.textContent = `Phiên #${state.sessionId}`;
  els.sessionBadgeInfo.textContent = `Vị trí: ${state.positionName} | Cấp độ: ${state.levelName} | Tổng: ${total} câu hỏi`;
  els.metaPosition.textContent = `Vị trí: ${state.positionName}`;
  els.metaLevel.textContent = `Cấp độ: ${state.levelName}`;
  els.questionIndexBadge.textContent = `Câu hỏi ${q.question_order} / ${total}`;
  els.questionContent.textContent = q.question_content;
  els.evaluation.hidden = q.score === null || q.score === undefined;
  if (!els.evaluation.hidden) {
    els.evaluationScore.textContent = Number(q.score).toFixed(1);
    els.evaluationFeedback.textContent = q.feedback || "";

    if (els.btnToggleModelAnswer && els.modelAnswerContainer && els.modelAnswerText) {
      if (q.model_answer) {
        els.btnToggleModelAnswer.style.display = "inline-flex";
        els.modelAnswerText.textContent = q.model_answer;
        els.modelAnswerContainer.hidden = true;
        els.btnToggleModelAnswer.textContent = "💡 Xem câu trả lời chuẩn từ chuyên gia";
      } else {
        els.btnToggleModelAnswer.style.display = "none";
        els.modelAnswerContainer.hidden = true;
      }
    }
  }

  if (q.answered) {
    els.answerStateBadge.textContent = "Đã lưu lên hệ thống";
    els.answerStateBadge.className = "badge badge-completed";
    els.answerInput.value = q.answer_content || "";
    els.answerInput.disabled = true;
    els.btnSubmit.disabled = true;
    els.btnSubmit.textContent = "Đã gửi câu trả lời";
  } else {
    els.answerStateBadge.textContent = "Chưa gửi";
    els.answerStateBadge.className = "badge";
    els.answerInput.value = state.drafts[q.question_id] || "";
    els.answerInput.disabled = state.isSubmitting;
    els.btnSubmit.disabled = state.isSubmitting;
    els.btnSubmit.innerHTML = state.isSubmitting
      ? `<span class="spinner"></span> Đang gửi câu trả lời...`
      : "Gửi câu trả lời";
  }

  els.btnPrev.disabled = state.isSubmitting || state.currentIndex === 0;
  els.btnNext.disabled = state.isSubmitting || state.currentIndex >= total - 1;

  updateWordCount();
  renderStatusBadge();
  renderProgress();
  renderQuestionSteps();

  // Hiển thị banner hoàn thành nếu tất cả câu hỏi đã được trả lời
  if (els.completedBanner) {
    const isCompleted = state.sessionStatus === "COMPLETED" || (total > 0 && state.questions.every((item) => item.answered));
    els.completedBanner.hidden = !isCompleted;
    if (isCompleted && els.btnViewResults) {
      els.btnViewResults.href = `results.html?id=${state.sessionId}`;
    }
  }
}

function applySessionData(sessionData, keepCurrentIndex = false) {
  state.sessionId = sessionData.session_id;
  state.positionName = sessionData.position_name;
  state.levelName = sessionData.level_name;
  state.sessionStatus = sessionData.status;
  state.questions = sessionData.questions || [];
  localStorage.setItem("current_session_id", String(state.sessionId));

  if (!keepCurrentIndex) {
    const firstUnanswered = state.questions.findIndex((q) => !q.answered);
    state.currentIndex = firstUnanswered >= 0 ? firstUnanswered : 0;
  }
  renderCurrentQuestion();
}

async function initInterviewSession() {
  if (!getAccessToken()) {
    showBanner("error", "Bạn chưa đăng nhập. Vui lòng đăng nhập trước khi bắt đầu phỏng vấn.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
    return;
  }

  const userName = localStorage.getItem("user_name");
  if (els.userStatus && userName) {
    els.userStatus.textContent = userName;
  }

  state.isLoadingSession = true;
  state.lastFailedAction = initInterviewSession;
  showBanner("loading", "Đang tải phiên phỏng vấn và 5 câu hỏi từ AI...", false);

  const savedSessionId = localStorage.getItem("current_session_id");
  const selectedPosition =
    localStorage.getItem("selected_position") ||
    localStorage.getItem("interview_position") ||
    "Backend";
  const selectedLevel =
    localStorage.getItem("selected_level") ||
    localStorage.getItem("interview_level") ||
    "Fresher";

  try {
    let res;
    if (savedSessionId) {
      res = await apiRequest(`/api/interviews/${savedSessionId}`, { method: "GET" });
      if (!res.data.questions || res.data.questions.length < 5) {
        const gen = await apiRequest(`/api/interviews/${savedSessionId}/questions/generate`, {
          method: "POST",
          timeout: 125000,
        });
        res.data.questions = gen.questions;
        res.data.status = gen.status;
        res.data.ai_source = gen.ai_source;
      }
    } else {
      res = await apiRequest("/api/interviews", {
        method: "POST",
        timeout: 125000,
        body: {
          position: selectedPosition,
          level: selectedLevel,
        },
      });
    }

    applySessionData(res.data);
    if (res.data.ai_source === "fallback") {
      showBanner(
        "error",
        "Gemini chưa phản hồi được; phiên này đang dùng câu hỏi dự phòng."
      );
    } else {
      hideBanner();
    }
  } catch (err) {
    if (err.status === 401) {
      showBanner("error", "Phiên đăng nhập đã hết hạn. Đang chuyển về trang đăng nhập...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("current_session_id");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
      return;
    }
    if ((err.status === 404 || err.status === 403) && savedSessionId) {
      localStorage.removeItem("current_session_id");
      return initInterviewSession();
    }
    showBanner("error", `Lỗi tải phiên phỏng vấn: ${err.message}`, true);
  } finally {
    state.isLoadingSession = false;
  }
}

async function handleSubmitAnswer() {
  const q = state.questions[state.currentIndex];
  if (!q || q.answered || state.isSubmitting) return;

  const content = els.answerInput.value.trim();
  if (!content) {
    showBanner("error", "Vui lòng nhập nội dung câu trả lời trước khi gửi.");
    els.answerInput.focus();
    return;
  }
  if (content.length > 10000) {
    showBanner("error", "Câu trả lời quá dài (tối đa 10.000 ký tự).");
    return;
  }

  state.isSubmitting = true;
  state.drafts[q.question_id] = content;
  renderCurrentQuestion();
  showBanner("loading", `Đang gửi câu trả lời cho câu hỏi ${q.question_order}...`, false);

  try {
    const res = await apiRequest(`/api/interviews/${state.sessionId}/answers`, {
      method: "POST",
      timeout: 100000,
      body: {
        question_id: q.question_id,
        answer_content: content,
      },
    });

    q.answered = true;
    q.answer_content = res.data.answer_content;
    q.score = res.data.score;
    q.feedback = res.data.feedback;
    q.model_answer = res.data.model_answer;
    q.criteria_scores = res.data.criteria_scores;
    delete state.drafts[q.question_id];
    state.sessionStatus = res.data.session_status;

    if (state.sessionStatus === "COMPLETED") {
      showBanner(
        "success",
        "Bạn đã gửi đủ 5/5 câu trả lời và hoàn tất đánh giá cho phiên phỏng vấn."
      );
    } else {
      showBanner(
        "success",
        `Đã lưu và đánh giá câu trả lời câu ${q.question_order}. Xem nhận xét bên dưới trước khi tiếp tục.`
      );
    }
  } catch (err) {
    if (err.status === 401) {
      showBanner("error", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      localStorage.removeItem("access_token");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
      return;
    }
    if (err.status === 409) {
      try {
        const refreshed = await apiRequest(`/api/interviews/${state.sessionId}`, { method: "GET" });
        applySessionData(refreshed.data, true);
      } catch {
        q.answered = true;
        q.answer_content = content;
      }
      showBanner("error", "Câu hỏi này đã được nộp trước đó. Hệ thống đã đồng bộ lại nội dung đã lưu.");
    } else {
      showBanner(
        "error",
        `Gửi câu trả lời thất bại: ${err.message} (Nội dung bạn nhập vẫn được giữ nguyên).`,
        true
      );
    }
  } finally {
    state.isSubmitting = false;
    renderCurrentQuestion();
  }
}

els.answerInput.addEventListener("input", () => {
  saveCurrentDraft();
  updateWordCount();
});

els.btnSubmit.addEventListener("click", handleSubmitAnswer);

els.btnPrev.addEventListener("click", () => {
  if (state.currentIndex > 0) {
    saveCurrentDraft();
    state.currentIndex -= 1;
    hideBanner();
    renderCurrentQuestion();
  }
});

els.btnNext.addEventListener("click", () => {
  if (state.currentIndex < state.questions.length - 1) {
    saveCurrentDraft();
    state.currentIndex += 1;
    hideBanner();
    renderCurrentQuestion();
  }
});

els.btnRetry.addEventListener("click", () => {
  if (typeof state.lastFailedAction === "function") {
    state.lastFailedAction();
  }
});

if (els.btnToggleModelAnswer) {
  els.btnToggleModelAnswer.addEventListener("click", () => {
    if (els.modelAnswerContainer) {
      els.modelAnswerContainer.hidden = !els.modelAnswerContainer.hidden;
      els.btnToggleModelAnswer.textContent = els.modelAnswerContainer.hidden
        ? "💡 Xem câu trả lời chuẩn từ chuyên gia"
        : "Ẩn câu trả lời chuẩn";
    }
  });
}

if (els.btnEmptyRetry) {
  els.btnEmptyRetry.addEventListener("click", initInterviewSession);
}

if (els.btnLogout) {
  els.btnLogout.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("current_session_id");
  });
}

document.addEventListener("DOMContentLoaded", initInterviewSession);
