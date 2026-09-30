/*
 * ==========================================
 * 学園祭 脱出ゲーム
 * ==========================================
 *
 * 問題を変更するときは QUESTIONS の
 * problem / answer を変更してください。
 *
 * answer は正解を1つ指定します。
 * 大文字・小文字は区別しません。
 * 前後の空白は無視します。
 */

const QUESTIONS = [
  {
    title: "第1問",
    problem: "ここに第1問の問題文を入れてください。\n\n例：日本の首都は？",
    answer: "東京"
  },
  {
    title: "第2問",
    problem: "ここに第2問の問題文を入れてください。",
    answer: "答え2"
  },
  {
    title: "第3問",
    problem: "ここに第3問の問題文を入れてください。",
    answer: "答え3"
  },
  {
    title: "第4問",
    problem: "ここに第4問の問題文を入れてください。",
    answer: "答え4"
  },
  {
    title: "第5問",
    problem: "ここに第5問の問題文を入れてください。",
    answer: "答え5"
  },
  {
    title: "第6問",
    problem: "ここに第6問の問題文を入れてください。",
    answer: "答え6"
  },
  {
    title: "第7問",
    problem: "ここに第7問の問題文を入れてください。",
    answer: "答え7"
  },
  {
    title: "第8問",
    problem: "ここに第8問の問題文を入れてください。",
    answer: "答え8"
  },
  {
    title: "第9問",
    problem: "ここに第9問の問題文を入れてください。",
    answer: "答え9"
  }
];

const STORAGE_KEY = "school_festival_escape_game_v1";

let state = loadState();
let currentPage = "question";
let currentQuestion = state.currentQuestion || 0;

function createInitialState() {
  return {
    solved: Array(QUESTIONS.length).fill(false),
    answers: Array(QUESTIONS.length).fill(""),
    currentQuestion: 0
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createInitialState();
    }

    const parsed = JSON.parse(saved);

    if (
      !Array.isArray(parsed.solved) ||
      !Array.isArray(parsed.answers)
    ) {
      return createInitialState();
    }

    while (parsed.solved.length < QUESTIONS.length) {
      parsed.solved.push(false);
    }

    while (parsed.answers.length < QUESTIONS.length) {
      parsed.answers.push("");
    }

    parsed.solved = parsed.solved.slice(0, QUESTIONS.length);
    parsed.answers = parsed.answers.slice(0, QUESTIONS.length);

    if (
      typeof parsed.currentQuestion !== "number" ||
      parsed.currentQuestion < 0 ||
      parsed.currentQuestion >= QUESTIONS.length
    ) {
      parsed.currentQuestion = 0;
    }

    return parsed;
  } catch (error) {
    console.error("保存データの読み込みに失敗:", error);
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeAnswer(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getUnlockedQuestion(index) {
  if (index === 0) {
    return true;
  }

  return state.solved[index - 1] === true;
}

function getSolvedCount() {
  return state.solved.filter(Boolean).length;
}

function updateProgress() {
  const count = getSolvedCount();

  document.getElementById("progressText").textContent =
    `${count} / ${QUESTIONS.length}`;

  document.getElementById("progressBar").style.width =
    `${(count / QUESTIONS.length) * 100}%`;
}

function renderSidebar() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  QUESTIONS.forEach((question, index) => {
    const unlocked = getUnlockedQuestion(index);
    const solved = state.solved[index];

    const button = document.createElement("button");
    button.className = "question-button";

    if (!unlocked) {
      button.classList.add("locked");
      button.disabled = true;
    }

    if (
      currentPage === "question" &&
      currentQuestion === index
    ) {
      button.classList.add("selected");
    }

    let status = "🔒";

    if (solved) {
      status = "✓";
    } else if (unlocked) {
      status = "🔓";
    }

    button.innerHTML = `
      <span class="question-number">${String(index + 1).padStart(2, "0")}</span>
      <span>${question.title}</span>
      <span class="question-status">${status}</span>
    `;

    if (unlocked) {
      button.addEventListener("click", () => {
        currentQuestion = index;
        currentPage = "question";
        state.currentQuestion = index;
        saveState();

        renderSidebar();
        renderQuestion();
      });
    }

    list.appendChild(button);
  });

  updateProgress();
}

function renderQuestion() {
  const content = document.getElementById("content");

  const question = QUESTIONS[currentQuestion];
  const solved = state.solved[currentQuestion];

  content.className = "content";

  content.innerHTML = `
    <div class="question-header">
      <div class="question-label">
        QUESTION ${String(currentQuestion + 1).padStart(2, "0")} / ${QUESTIONS.length}
      </div>

      <h2 class="question-title">${escapeHtml(question.title)}</h2>

      ${
        solved
          ? `<div class="solved-label">✓ 正解済み</div>`
          : ""
      }
    </div>

    <section class="question-card">
      <p class="problem">${escapeHtml(question.problem)}</p>

      <div class="answer-area">
        <input
          id="answerInput"
          class="answer-input"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          placeholder="解答を入力"
          value="${solved ? escapeAttribute(state.answers[currentQuestion]) : ""}"
          ${solved ? "disabled" : ""}
        >

        <button
          id="submitButton"
          class="submit-button"
          ${solved ? "disabled" : ""}
        >
          ${solved ? "正解済み" : "解答する"}
        </button>

        <div id="message" class="message"></div>

        ${
          solved && currentQuestion < QUESTIONS.length - 1
            ? `<button id="nextButton" class="next-button">
                次の問題へ
              </button>`
            : ""
        }
      </div>
    </section>
  `;

  // 画面と問題カードを滑らかに登場させる
  content.classList.add("page-enter");

  const renderedCard = content.querySelector(".question-card");
  if (renderedCard) {
    renderedCard.classList.add("card-enter");
  }

  if (!solved) {
    setupAnswerInput();
  } else {
    const nextButton = document.getElementById("nextButton");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        const nextIndex = currentQuestion + 1;

        if (getUnlockedQuestion(nextIndex)) {
          currentQuestion = nextIndex;
          state.currentQuestion = nextIndex;
          currentPage = "question";
          saveState();

          renderSidebar();
          renderQuestion();
        }
      });
    }
  }
}

function setupAnswerInput() {
  const input = document.getElementById("answerInput");
  const button = document.getElementById("submitButton");

  input.focus();

  button.addEventListener("click", checkAnswer);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });
}

function checkAnswer() {
  const input = document.getElementById("answerInput");
  const button = document.getElementById("submitButton");
  const message = document.getElementById("message");
  const answerArea = document.querySelector(".answer-area");
  const card = document.querySelector(".question-card");

  const userAnswer = input.value;

  if (userAnswer.trim() === "") {
    message.className = "message incorrect";
    message.textContent = "解答を入力してください。";

    answerArea.classList.remove("wrong");
    void answerArea.offsetWidth;
    answerArea.classList.add("wrong");
    return;
  }

  const correctAnswer = QUESTIONS[currentQuestion].answer;

  if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
    /*
     * ==========================================
     * 正解した瞬間に回答を確定
     * ==========================================
     */
    state.solved[currentQuestion] = true;
    state.answers[currentQuestion] = userAnswer;

    saveState();

    input.disabled = true;
    button.disabled = true;

    input.classList.add("locked-success");

    message.className = "message correct";
    message.textContent = "✓ 正解！";

    if (card) {
      card.classList.remove("correct-flash");
      void card.offsetWidth;
      card.classList.add("correct-flash");
    }

    showToast("正解しました！");

    // まず現在の問題を正解済みに更新
    renderSidebar();

    // 次の問題がある場合は「鍵が外れる」演出
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => {
        showUnlockAnimation(currentQuestion + 1);
      }, 420);
    } else {
      // 全問クリア
      setTimeout(() => {
        showClearPage();
      }, 850);
    }

    // 入力欄を固定した状態を維持
    setTimeout(() => {
      if (currentPage === "question") {
        renderQuestion();
      }
    }, 900);

  } else {
    message.className = "message incorrect";
    message.textContent = "✕ 不正解です。もう一度考えてみよう。";

    answerArea.classList.remove("wrong");
    void answerArea.offsetWidth;
    answerArea.classList.add("wrong");
  }
}

function showUnlockAnimation(nextIndex) {
  // 次の問題を先に解放する
  state.currentQuestion = currentQuestion;
  saveState();

  const overlay = document.createElement("div");
  overlay.className = "unlock-overlay";

  overlay.innerHTML = `
    <div class="unlock-box">
      <div class="unlock-lock open">
        <div class="unlock-spark play">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="lock-shackle"></div>
        <div class="lock-body"></div>
        <div class="lock-keyhole"></div>
      </div>

      <h2 class="unlock-title">LOCK UNLOCKED</h2>
      <p class="unlock-subtitle">
        ${escapeHtml(QUESTIONS[nextIndex].title)} が解放されました
      </p>
      <div class="unlock-next">次の問題へ進めます</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // サイドバーの次問題をアニメーション
  renderSidebar();

  const buttons = document.querySelectorAll(".question-button");
  const nextButton = buttons[nextIndex];

  if (nextButton) {
    nextButton.classList.add("just-unlocked");
  }

  // 一定時間後に演出を閉じる
  setTimeout(() => {
    overlay.classList.add("hide");

    setTimeout(() => {
      overlay.remove();

      // 解放された問題を自動的に表示
      currentQuestion = nextIndex;
      currentPage = "question";
      state.currentQuestion = nextIndex;
      saveState();

      renderSidebar();
      renderQuestion();
    }, 350);
  }, 1500);
}

function renderAnswers() {
  const content = document.getElementById("content");

  content.className = "content answers-page";

  const records = QUESTIONS
    .map((question, index) => {
      if (!state.solved[index]) {
        return "";
      }

      return `
        <div class="answer-record">
          <div class="answer-record-title">${escapeHtml(question.title)}</div>
          <div class="answer-record-value">
            ${escapeHtml(state.answers[index])}
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  content.innerHTML = `
    <h2 class="page-title">過去の解答</h2>

    ${
      records
        ? `<div class="answers-list">${records}</div>`
        : `<div class="empty-answers">
            まだ正解した問題はありません。
           </div>`
    }
  `;
}

function showClearPage() {
  const content = document.getElementById("content");

  content.className = "content clear-page";

  content.innerHTML = `
    <div class="clear-icon">🔓</div>
    <h2 class="clear-title">脱出成功！</h2>
    <p class="clear-text">
      すべての問題をクリアしました。<br>
      おめでとうございます！
    </p>
  `;
}

function showAnswersPage() {
  currentPage = "answers";
  renderSidebar();
  renderAnswers();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

let toastTimer;

function showToast(text) {
  const toast = document.getElementById("toast");

  toast.textContent = text;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

document.getElementById("answersButton").addEventListener("click", () => {
  showAnswersPage();
});

document.getElementById("resetButton").addEventListener("click", () => {
  const confirmed = window.confirm(
    "進行状況と解答をすべて消去します。\n本当にリセットしますか？"
  );

  if (!confirmed) {
    return;
  }

  state = createInitialState();
  currentQuestion = 0;
  currentPage = "question";

  saveState();

  renderSidebar();
  renderQuestion();

  showToast("リセットしました");
});

renderSidebar();

if (getSolvedCount() === QUESTIONS.length) {
  showClearPage();
} else {
  renderQuestion();
}
