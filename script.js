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
    problem: "ここに第1問の問題文を入れてください。\\n\\n例：日本の首都は？",
    answer: "東京",
    hint1: "学校の中にあるものに注目してみよう。",
    hint2: "地図や場所を表す言葉を思い出してみよう。"
  },
  {
    title: "第2問",
    problem: "ここに第2問の問題文を入れてください。",
    answer: "答え2",
    hint1: "問題文の中で、特に気になる言葉を一つ選んでみよう。",
    hint2: "その言葉を別の言い方にすると何になるかな？"
  },
  {
    title: "第3問",
    problem: "ここに第3問の問題文を入れてください。",
    answer: "答え3",
    hint1: "数字や順番に秘密がないか確認してみよう。",
    hint2: "一つずつ順番に並べ直して考えてみよう。"
  },
  {
    title: "第4問",
    problem: "ここに第4問の問題文を入れてください。",
    answer: "答え4",
    hint1: "文字の形や読み方に注目してみよう。",
    hint2: "声に出して読んでみると気づくかもしれない。"
  },
  {
    title: "第5問",
    problem: "ここに第5問の問題文を入れてください。",
    answer: "答え5",
    hint1: "教室にあるものを思い浮かべてみよう。",
    hint2: "黒板の近くにあるものから考えてみよう。"
  },
  {
    title: "第6問",
    problem: "ここに第6問の問題文を入れてください。",
    answer: "答え6",
    hint1: "ここまでに見つけた情報を使えないか考えてみよう。",
    hint2: "前の問題の答えが、この問題の鍵になっているかも。"
  },
  {
    title: "第7問",
    problem: "ここに第7問の問題文を入れてください。",
    answer: "答え7",
    hint1: "学校にまつわる言葉を手がかりにしてみよう。",
    hint2: "「誰が・どこで・いつ」を整理すると見えてくるかも。"
  },
  {
    title: "第8問",
    problem: "ここに第8問の問題文を入れてください。",
    answer: "答え8"
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
    questionStartedAt: Array(QUESTIONS.length).fill(null),
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

    if (!Array.isArray(parsed.questionStartedAt)) {
      parsed.questionStartedAt = Array(QUESTIONS.length).fill(null);
    }

    while (parsed.questionStartedAt.length < QUESTIONS.length) {
      parsed.questionStartedAt.push(null);
    }

    parsed.solved = parsed.solved.slice(0, QUESTIONS.length);
    parsed.answers = parsed.answers.slice(0, QUESTIONS.length);
    parsed.questionStartedAt = parsed.questionStartedAt.slice(0, QUESTIONS.length);

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

    // 第7問・第8問は、解放されるまでサイドバーにも存在させない。
    // 第7問(index 6)は第6問(index 5)正解後、第8問(index 7)は第7問(index 6)正解後に初めて表示。
    if (index >= 6 && !unlocked) {
      return;
    }

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


let hintTimer = null;

function ensureQuestionTimer(index) {
  if (state.solved[index]) return;
  if (!state.questionStartedAt[index]) {
    state.questionStartedAt[index] = Date.now();
    saveState();
  }
}

function clearHintTimer() {
  if (hintTimer) {
    clearInterval(hintTimer);
    hintTimer = null;
  }
}

function getHintLevel(index) {
  if (state.solved[index] || index > 6 || !state.questionStartedAt[index]) {
    return 0;
  }
  const elapsed = Date.now() - state.questionStartedAt[index];
  if (elapsed >= 90000) return 2;
  if (elapsed >= 45000) return 1;
  return 0;
}

function updateHintDisplay() {
  const hintArea = document.getElementById("hintArea");
  if (!hintArea) return;

  const level = getHintLevel(currentQuestion);
  const question = QUESTIONS[currentQuestion];

  hintArea.innerHTML = "";

  if (level >= 1) {
    const box = document.createElement("div");
    box.className = "hint-box hint-one";
    box.innerHTML = `
      <div class="hint-heading"><span class="hint-icon">💡</span> ヒント① <span class="hint-time">45秒経過</span></div>
      <div class="hint-text">${escapeHtml(question.hint1)}</div>
    `;
    hintArea.appendChild(box);
  }

  if (level >= 2) {
    const box = document.createElement("div");
    box.className = "hint-box hint-two";
    box.innerHTML = `
      <div class="hint-heading"><span class="hint-icon">🔎</span> ヒント② <span class="hint-time">90秒経過</span></div>
      <div class="hint-text">${escapeHtml(question.hint2)}</div>
    `;
    hintArea.appendChild(box);
  }

  const timer = document.getElementById("hintTimer");
  if (timer && level === 0) {
    const elapsed = Math.max(0, Date.now() - state.questionStartedAt[currentQuestion]);
    const remaining = Math.max(0, 45000 - elapsed);
    const sec = Math.ceil(remaining / 1000);
    timer.textContent = `ヒント①まで ${sec}秒`;
  } else if (timer && level === 1) {
    const elapsed = Math.max(0, Date.now() - state.questionStartedAt[currentQuestion]);
    const remaining = Math.max(0, 90000 - elapsed);
    const sec = Math.ceil(remaining / 1000);
    timer.textContent = `ヒント②まで ${sec}秒`;
  } else if (timer) {
    timer.textContent = "ヒントがすべて開示されています";
  }
}

function startHintTimer(index) {
  clearHintTimer();
  if (state.solved[index] || index > 6) return;

  ensureQuestionTimer(index);
  updateHintDisplay();

  hintTimer = setInterval(() => {
    if (currentPage !== "question" || currentQuestion !== index || state.solved[index]) {
      clearHintTimer();
      return;
    }
    updateHintDisplay();
  }, 1000);
}

function renderQuestion() {
  const content = document.getElementById("content");

  const question = QUESTIONS[currentQuestion];
  const solved = state.solved[currentQuestion];

  if (!solved) {
    ensureQuestionTimer(currentQuestion);
  }
  clearHintTimer();

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

      ${
        !solved && currentQuestion <= 6
          ? `<div class="hint-panel">
              <div class="hint-status-row">
                <span class="hint-status-label">捜査メモ / HINT</span>
                <span id="hintTimer" class="hint-timer">ヒント①まで 45秒</span>
              </div>
              <div id="hintArea" class="hint-area"></div>
            </div>`
          : ""
      }

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
    if (currentQuestion <= 6) {
      startHintTimer(currentQuestion);
    }
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

    clearHintTimer();
    state.questionStartedAt[currentQuestion] = null;
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

  clearHintTimer();
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
