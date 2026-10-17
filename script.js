/*
 * ==========================================
 * 学園祭 脱出ゲーム
 * ==========================================
 *
 * 問題を変更するときは QUESTIONS の
 * problem / answer / hint1 / hint2 を変更してください。
 *
 * answer は正解を1つ指定します。
 * 大文字・小文字は区別しません。
 * 前後の空白は無視します。
 *
 * hint1 は問題を開いてから45秒後、
 * hint2 はさらに45秒後（開始から90秒後）に公開されます。
 */

const QUESTIONS = [
  {
    title: "第1問",
    problem: "ここに第1問の問題文を入れてください。\n\n例：日本の首都は？",
    answer: "東京",
    hint1: "ここに第1問のヒント①を入れてください。",
    hint2: "ここに第1問のヒント②を入れてください。"
  },
  {
    title: "第2問",
    problem: "ここに第2問の問題文を入れてください。",
    answer: "答え2",
    hint1: "ここに第2問のヒント①を入れてください。",
    hint2: "ここに第2問のヒント②を入れてください。"
  },
  {
    title: "第3問",
    problem: "ここに第3問の問題文を入れてください。",
    answer: "答え3",
    hint1: "ここに第3問のヒント①を入れてください。",
    hint2: "ここに第3問のヒント②を入れてください。"
  },
  {
    title: "第4問",
    problem: "ここに第4問の問題文を入れてください。",
    answer: "答え4",
    hint1: "ここに第4問のヒント①を入れてください。",
    hint2: "ここに第4問のヒント②を入れてください。"
  },
  {
    title: "第5問",
    problem: "ここに第5問の問題文を入れてください。",
    answer: "答え5",
    hint1: "ここに第5問のヒント①を入れてください。",
    hint2: "ここに第5問のヒント②を入れてください。"
  },
  {
    title: "第6問",
    problem: "ここに第6問の問題文を入れてください。",
    answer: "答え6",
    hint1: "ここに第6問のヒント①を入れてください。",
    hint2: "ここに第6問のヒント②を入れてください。"
  },
  {
    title: "第7問",
    problem: "ここに第7問の問題文を入れてください。",
    answer: "答え7",
    hint1: "ここに第7問のヒント①を入れてください。",
    hint2: "ここに第7問のヒント②を入れてください。"
  },
  {
    title: "第8問",
    problem: "ここに第8問の問題文を入れてください。",
    answer: "答え8",
    hint1: "ここに第8問のヒント①を入れてください。",
    hint2: "ここに第8問のヒント②を入れてください。"
  },
  {
    title: "第9問",
    problem: "ここに第9問の問題文を入れてください。",
    answer: "答え9",
    hint1: "ここに第9問のヒント①を入れてください。",
    hint2: "ここに第9問のヒント②を入れてください。"
  }
];

// 一つ前の問題を解くまでサイドバーに表示しない問題（0始まり：第8問=7, 第9問=8）
const HIDDEN_UNTIL_UNLOCKED_FROM = 7;

// ヒントが公開される間隔（秒）
const HINT_INTERVAL = 45;

const STORAGE_KEY = "school_festival_escape_game_v1";

let state = loadState();
let currentPage = "start";
let gameTimerInterval = null;
let remainingSeconds = 12 * 60;
let currentQuestion = state.currentQuestion || 0;

function createInitialState() {
  return {
    solved: Array(QUESTIONS.length).fill(false),
    answers: Array(QUESTIONS.length).fill(""),
    hintSeconds: Array(QUESTIONS.length).fill(0),
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

    // 以前の保存データにはヒント用の配列がないので補う
    if (!Array.isArray(parsed.hintSeconds)) {
      parsed.hintSeconds = [];
    }

    while (parsed.solved.length < QUESTIONS.length) {
      parsed.solved.push(false);
    }

    while (parsed.answers.length < QUESTIONS.length) {
      parsed.answers.push("");
    }

    while (parsed.hintSeconds.length < QUESTIONS.length) {
      parsed.hintSeconds.push(0);
    }

    parsed.solved = parsed.solved.slice(0, QUESTIONS.length);
    parsed.answers = parsed.answers.slice(0, QUESTIONS.length);
    parsed.hintSeconds = parsed.hintSeconds
      .slice(0, QUESTIONS.length)
      .map((value) => (typeof value === "number" && value >= 0 ? value : 0));

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

function renderSidebar() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  QUESTIONS.forEach((question, index) => {
    const unlocked = getUnlockedQuestion(index);
    const solved = state.solved[index];

    // 第8問・第9問は、一つ前の問題を解くまで表示しない
    if (index >= HIDDEN_UNTIL_UNLOCKED_FROM && !unlocked) {
      return;
    }

    const button = document.createElement("button");
    button.className = "question-button";
    button.dataset.index = String(index);

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

    if (unlocked && currentPage !== "start") {
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

      ${
        solved
          ? ""
          : `<div id="hintArea" class="hint-area"></div>`
      }
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
    updateHintArea(false);
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

/* =========================
   ヒント
========================= */

function getRevealedHintCount(seconds) {
  if (seconds >= HINT_INTERVAL * 2) return 2;
  if (seconds >= HINT_INTERVAL) return 1;
  return 0;
}

function updateHintArea(announce) {
  const area = document.getElementById("hintArea");
  if (!area) return;

  const question = QUESTIONS[currentQuestion];
  const seconds = state.hintSeconds[currentQuestion] || 0;
  const revealed = getRevealedHintCount(seconds);

  // 初回描画のときは「新しく公開された」扱いにしない
  const previous =
    area.dataset.revealed === undefined
      ? revealed
      : Number(area.dataset.revealed);

  area.dataset.revealed = String(revealed);

  if (announce && revealed > previous) {
    showToast(`ヒント${revealed === 1 ? "①" : "②"}が公開されました`);
  }

  const hints = [
    { label: "ヒント①", text: question.hint1 },
    { label: "ヒント②", text: question.hint2 }
  ];

  area.innerHTML = hints
    .map((hint, index) => {
      if (revealed > index) {
        const isNew = revealed > previous && revealed === index + 1;

        return `
          <div class="hint-box open${isNew ? " hint-new" : ""}">
            <div class="hint-label">💡 ${hint.label}</div>
            <div class="hint-text">${escapeHtml(hint.text)}</div>
          </div>
        `;
      }

      let note;

      if (index === revealed) {
        const remain = HINT_INTERVAL * (index + 1) - seconds;
        note = `あと ${remain} 秒で公開`;
      } else {
        note = "ヒント①の公開後、さらに45秒で公開";
      }

      return `
        <div class="hint-box locked">
          <div class="hint-label">🔒 ${hint.label}</div>
          <div class="hint-text">${note}</div>
        </div>
      `;
    })
    .join("");
}

// 1秒ごとに呼ばれる：今開いている未解答の問題の経過時間を進める
function tickHint() {
  if (currentPage !== "question") return;
  if (state.solved[currentQuestion]) return;

  state.hintSeconds[currentQuestion] =
    (state.hintSeconds[currentQuestion] || 0) + 1;

  saveState();
  updateHintArea(true);
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

  const nextButton = document.querySelector(
    `.question-button[data-index="${nextIndex}"]`
  );

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

function updateGameTimer() {
  const timer = document.getElementById("gameTimer");
  if (!timer) return;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timer.classList.toggle("timer-warning", remainingSeconds <= 60);
}

function stopGameTimer() {
  if (gameTimerInterval !== null) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

function startGameTimer() {
  stopGameTimer();
  updateGameTimer();
  gameTimerInterval = setInterval(() => {
    if (currentPage === "start") {
      stopGameTimer();
      return;
    }

    // ヒント用の経過時間を進める
    tickHint();

    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      updateGameTimer();
    } else {
      stopGameTimer();
      showToast("制限時間終了！");
    }
  }, 1000);
}


document.getElementById("answersButton").addEventListener("click", () => {
  showAnswersPage();
});

document.getElementById("resetButton").addEventListener("click", () => {
  const confirmed = window.confirm(
    "進行状況と解答をすべて消去して、スタート画面に戻しますか？"
  );
  if (!confirmed) return;

  stopGameTimer();
  state = createInitialState();
  currentQuestion = 0;
  remainingSeconds = 12 * 60;
  saveState();
  window.location.href = "index.html";
});

currentPage = "question";
renderSidebar();
updateGameTimer();
renderQuestion();
startGameTimer();/*
 * ==========================================
 * 学園祭 脱出ゲーム
 * ==========================================
 *
 * 問題を変更するときは QUESTIONS の
 * problem / answer / hint1 / hint2 を変更してください。
 *
 * answer は正解を1つ指定します。
 * 大文字・小文字は区別しません。
 * 前後の空白は無視します。
 *
 * hint1 は問題を開いてから45秒後、
 * hint2 はさらに45秒後（開始から90秒後）に公開されます。
 */

const QUESTIONS = [
  {
    title: "第1問",
    problem: "ここに第1問の問題文を入れてください。\n\n例：日本の首都は？",
    answer: "東京",
    hint1: "ここに第1問のヒント①を入れてください。",
    hint2: "ここに第1問のヒント②を入れてください。"
  },
  {
    title: "第2問",
    problem: "ここに第2問の問題文を入れてください。",
    answer: "答え2",
    hint1: "ここに第2問のヒント①を入れてください。",
    hint2: "ここに第2問のヒント②を入れてください。"
  },
  {
    title: "第3問",
    problem: "ここに第3問の問題文を入れてください。",
    answer: "答え3",
    hint1: "ここに第3問のヒント①を入れてください。",
    hint2: "ここに第3問のヒント②を入れてください。"
  },
  {
    title: "第4問",
    problem: "ここに第4問の問題文を入れてください。",
    answer: "答え4",
    hint1: "ここに第4問のヒント①を入れてください。",
    hint2: "ここに第4問のヒント②を入れてください。"
  },
  {
    title: "第5問",
    problem: "ここに第5問の問題文を入れてください。",
    answer: "答え5",
    hint1: "ここに第5問のヒント①を入れてください。",
    hint2: "ここに第5問のヒント②を入れてください。"
  },
  {
    title: "第6問",
    problem: "ここに第6問の問題文を入れてください。",
    answer: "答え6",
    hint1: "ここに第6問のヒント①を入れてください。",
    hint2: "ここに第6問のヒント②を入れてください。"
  },
  {
    title: "第7問",
    problem: "ここに第7問の問題文を入れてください。",
    answer: "答え7",
    hint1: "ここに第7問のヒント①を入れてください。",
    hint2: "ここに第7問のヒント②を入れてください。"
  },
  {
    title: "第8問",
    problem: "ここに第8問の問題文を入れてください。",
    answer: "答え8",
    hint1: "ここに第8問のヒント①を入れてください。",
    hint2: "ここに第8問のヒント②を入れてください。"
  },
  {
    title: "第9問",
    problem: "ここに第9問の問題文を入れてください。",
    answer: "答え9",
    hint1: "ここに第9問のヒント①を入れてください。",
    hint2: "ここに第9問のヒント②を入れてください。"
  }
];

// 一つ前の問題を解くまでサイドバーに表示しない問題（0始まり：第8問=7, 第9問=8）
const HIDDEN_UNTIL_UNLOCKED_FROM = 7;

// ヒントが公開される間隔（秒）
const HINT_INTERVAL = 45;

const STORAGE_KEY = "school_festival_escape_game_v1";

let state = loadState();
let currentPage = "start";
let gameTimerInterval = null;
let remainingSeconds = 12 * 60;
let currentQuestion = state.currentQuestion || 0;

function createInitialState() {
  return {
    solved: Array(QUESTIONS.length).fill(false),
    answers: Array(QUESTIONS.length).fill(""),
    hintSeconds: Array(QUESTIONS.length).fill(0),
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

    // 以前の保存データにはヒント用の配列がないので補う
    if (!Array.isArray(parsed.hintSeconds)) {
      parsed.hintSeconds = [];
    }

    while (parsed.solved.length < QUESTIONS.length) {
      parsed.solved.push(false);
    }

    while (parsed.answers.length < QUESTIONS.length) {
      parsed.answers.push("");
    }

    while (parsed.hintSeconds.length < QUESTIONS.length) {
      parsed.hintSeconds.push(0);
    }

    parsed.solved = parsed.solved.slice(0, QUESTIONS.length);
    parsed.answers = parsed.answers.slice(0, QUESTIONS.length);
    parsed.hintSeconds = parsed.hintSeconds
      .slice(0, QUESTIONS.length)
      .map((value) => (typeof value === "number" && value >= 0 ? value : 0));

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

function renderSidebar() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  QUESTIONS.forEach((question, index) => {
    const unlocked = getUnlockedQuestion(index);
    const solved = state.solved[index];

    // 第8問・第9問は、一つ前の問題を解くまで表示しない
    if (index >= HIDDEN_UNTIL_UNLOCKED_FROM && !unlocked) {
      return;
    }

    const button = document.createElement("button");
    button.className = "question-button";
    button.dataset.index = String(index);

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

    if (unlocked && currentPage !== "start") {
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

      ${
        solved
          ? ""
          : `<div id="hintArea" class="hint-area"></div>`
      }
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
    updateHintArea(false);
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

/* =========================
   ヒント
========================= */

function getRevealedHintCount(seconds) {
  if (seconds >= HINT_INTERVAL * 2) return 2;
  if (seconds >= HINT_INTERVAL) return 1;
  return 0;
}

function updateHintArea(announce) {
  const area = document.getElementById("hintArea");
  if (!area) return;

  const question = QUESTIONS[currentQuestion];
  const seconds = state.hintSeconds[currentQuestion] || 0;
  const revealed = getRevealedHintCount(seconds);

  // 初回描画のときは「新しく公開された」扱いにしない
  const previous =
    area.dataset.revealed === undefined
      ? revealed
      : Number(area.dataset.revealed);

  area.dataset.revealed = String(revealed);

  if (announce && revealed > previous) {
    showToast(`ヒント${revealed === 1 ? "①" : "②"}が公開されました`);
  }

  const hints = [
    { label: "ヒント①", text: question.hint1 },
    { label: "ヒント②", text: question.hint2 }
  ];

  area.innerHTML = hints
    .map((hint, index) => {
      if (revealed > index) {
        const isNew = revealed > previous && revealed === index + 1;

        return `
          <div class="hint-box open${isNew ? " hint-new" : ""}">
            <div class="hint-label">💡 ${hint.label}</div>
            <div class="hint-text">${escapeHtml(hint.text)}</div>
          </div>
        `;
      }

      let note;

      if (index === revealed) {
        const remain = HINT_INTERVAL * (index + 1) - seconds;
        note = `あと ${remain} 秒で公開`;
      } else {
        note = "ヒント①の公開後、さらに45秒で公開";
      }

      return `
        <div class="hint-box locked">
          <div class="hint-label">🔒 ${hint.label}</div>
          <div class="hint-text">${note}</div>
        </div>
      `;
    })
    .join("");
}

// 1秒ごとに呼ばれる：今開いている未解答の問題の経過時間を進める
function tickHint() {
  if (currentPage !== "question") return;
  if (state.solved[currentQuestion]) return;

  state.hintSeconds[currentQuestion] =
    (state.hintSeconds[currentQuestion] || 0) + 1;

  saveState();
  updateHintArea(true);
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

  const nextButton = document.querySelector(
    `.question-button[data-index="${nextIndex}"]`
  );

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

function updateGameTimer() {
  const timer = document.getElementById("gameTimer");
  if (!timer) return;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timer.classList.toggle("timer-warning", remainingSeconds <= 60);
}

function stopGameTimer() {
  if (gameTimerInterval !== null) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

function startGameTimer() {
  stopGameTimer();
  updateGameTimer();
  gameTimerInterval = setInterval(() => {
    if (currentPage === "start") {
      stopGameTimer();
      return;
    }

    // ヒント用の経過時間を進める
    tickHint();

    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      updateGameTimer();
    } else {
      stopGameTimer();
      showToast("制限時間終了！");
    }
  }, 1000);
}


document.getElementById("answersButton").addEventListener("click", () => {
  showAnswersPage();
});

document.getElementById("resetButton").addEventListener("click", () => {
  const confirmed = window.confirm(
    "進行状況と解答をすべて消去して、スタート画面に戻しますか？"
  );
  if (!confirmed) return;

  stopGameTimer();
  state = createInitialState();
  currentQuestion = 0;
  remainingSeconds = 12 * 60;
  saveState();
  window.location.href = "index.html";
});

currentPage = "question";
renderSidebar();
updateGameTimer();
renderQuestion();
startGameTimer();