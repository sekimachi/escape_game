
/*
 * ==========================================
 * 七不思議の向こう側 — ゲーム
 * ==========================================
 *
 * 第1〜6問：自由に解答
 * 第7問：第1〜6問の正解後に解放
 * 第8問：第7問の正解後に解放
 *
 * ヒント①：45秒後
 * ヒント②：90秒後
 *
 * 第7問クリア後：
 * ロック解除演出 → 第二倉庫への案内
 *
 * 最終問題は1回のみ解答可能
 */

// ==========================================
// 問題データ
// ==========================================

const QUESTIONS = [
  {
    title: "階段",
    problem: "この学校では、階段の段数が日によって異なるらしい...\n目の前にある階段は3段だけど、本当に3段だったのかな...",
    answer: "かいだん",
    hint1: "最初の階段は、同じ色がそろえられていて、右から順に高くなっていたな",
    hint2: "裏側を見ると何か文字ができそうだから、その文字を向きを合わせて解いていくと解きやすいかも"
  },
  {
    title: "教室",
    problem: "あれ、もう誰もいないはずの教室なのに何故かペットボトルが置いてある...\nしかもよく見ると何か書いてあるな...不気味だ",
    answer: "おもいで",
    hint1: "ペットボトルに書いてあるマークとメジャーに書いてあるマークは同じものが多いね",
    hint2: "同じマーク同士を合わせてみよう。矢印を辿ると何か文字が浮かび上がってきそうだ。"
  },
  {
    title: "家庭科室",
    problem: "うわっ...！誰だ、こんなにたくさんのまち針をめちゃくちゃに刺したのは...\nただのいたずらなのか、それとも何か意味があるのだろうか。",
    answer: "にちじょう",
    hint1: "見る方向を変えてみよう。別の方角から見ると、何か文字が浮かび上がるかもしれない。",
    hint2: "黒い背景があるってことは、その表面から見れば文字が分かりそうだな"
  },
  {
    title: "音楽室",
    problem: "ここでは夜に変な音が聞こえてくるらしい...けど噂によると楽器の音じゃなくて人が動いている音っぽい...？\nあれ、この紙、何かゴミがついてると思ったらただの数学のプリントか...",
    answer: "そらみみ",
    hint1: "このゴミの形、妙にそろっているな……。しかも、どれもきれいな楕円形だ。",
    hint2: "そういえば今持ってるクリアファイルにも、変な模様が入っていたような"
  },
  {
    title: "図書館",
    problem: "あれ？ いつも綺麗な図書館が今日は何故か本がぐちゃぐちゃだ...\nいったい何でこんなことになったんだろう",
    answer: "へいこう",
    hint1: "数字順に並べてみよう。下に出てくるひらがなにはなんて書いてあるかな",
    hint2: "1番左上から斜めに呼んでみよう"
  },
  {
    title: "理科室",
    problem: "あ、元の場所に標本がないって思ったらこんなところに...なんでこんなに動いてるんだろう\n指示どうりに標本を合わせて、正しい位置に戻そう",
    answer: "やくひんじこ",
    hint1: "上から矢印が示している文字を読んでいけばいいみたい",
    hint2: "哺乳類はイルカと猫っぽいけど、一匹足りないな... あ！この生き物、別の角度から見てみるとあの動物にも見えてこないか？"
  },
  {
    title: "七不思議？",
    problem: "ここまでの問題、何故か妙に引っかかるんだよなぁ...なんでだろう...これが七不思議なのかな？\nそれぞれの場所に貼ってあったあの数字の紙が何か手掛かりに繋がるのかな？",
    answer: "だいにそうこ",
    hint1: "今までの問題の答えってなんだっけ...？",
    hint2: "答えと数字...1問目の答えから考えていくとよさそう"
  },
  {
    title: "七不思議の正体は？",
    problem: "七不思議の正体は一体なんだろうか？",
    answer: "あなた",
    hint1: "このマスの大きさとマーク、どこかで見た気がするんだよなぁ",
    hint2: "さっきの理科室の標本の裏に何か模様が書いてあるぞ..."
  }
];

// ==========================================
// 基本設定
// ==========================================

const HIDDEN_UNTIL_UNLOCKED_FROM = 6;
const HINT_INTERVAL = 45;
const FREE_COUNT = 6;
const LAST_INDEX = QUESTIONS.length - 1;

const STORAGE_KEY = "school_festival_escape_game_v1";

let state = loadState();
let currentPage = "question";
let currentQuestion = state.currentQuestion || 0;

let gameTimerInterval = null;
let remainingSeconds = 12 * 60;
let toastTimer = null;

// ==========================================
// 初期状態
// ==========================================

function createInitialState() {
  return {
    solved: Array(QUESTIONS.length).fill(false),
    answers: Array(QUESTIONS.length).fill(""),
    hintSeconds: Array(QUESTIONS.length).fill(0),
    currentQuestion: 0,
    finalResult: null
  };
}

// ==========================================
// 保存データ読み込み
// ==========================================

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
      .map(value =>
        typeof value === "number" && value >= 0
          ? value
          : 0
      );

    if (
      typeof parsed.currentQuestion !== "number" ||
      parsed.currentQuestion < 0 ||
      parsed.currentQuestion >= QUESTIONS.length
    ) {
      parsed.currentQuestion = 0;
    }

    if (
      parsed.finalResult !== "correct" &&
      parsed.finalResult !== "wrong"
    ) {
      parsed.finalResult = null;
    }

    return parsed;

  } catch (error) {
    console.error("保存データの読み込みに失敗:", error);
    return createInitialState();
  }
}

// ==========================================
// 保存
// ==========================================

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

// ==========================================
// 解答の正規化
// ==========================================

function normalizeAnswer(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

// ==========================================
// 問題の解放判定
// ==========================================

function getUnlockedQuestion(index) {
  if (index < FREE_COUNT) {
    return true;
  }

  if (index === FREE_COUNT) {
    return state.solved
      .slice(0, FREE_COUNT)
      .every(Boolean);
  }

  return state.solved[index - 1] === true;
}

// ==========================================
// 次の問題
// ==========================================

function getNextIndex(index) {
  if (index < FREE_COUNT) {
    for (let k = 1; k < FREE_COUNT; k++) {
      const j = (index + k) % FREE_COUNT;

      if (!state.solved[j]) {
        return j;
      }
    }

    return FREE_COUNT;
  }

  return index + 1 < QUESTIONS.length
    ? index + 1
    : -1;
}

// ==========================================
// サイドバー
// ==========================================

function renderSidebar() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  QUESTIONS.forEach((question, index) => {
    const unlocked = getUnlockedQuestion(index);
    const solved = state.solved[index];

    if (
      index >= HIDDEN_UNTIL_UNLOCKED_FROM &&
      !unlocked
    ) {
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
    } else if (index < FREE_COUNT) {
      status = "";
    } else if (unlocked) {
      status = "🔓";
    }

    button.innerHTML = `
      <span class="question-number">
        ${String(index + 1).padStart(2, "0")}
      </span>

      <span>${escapeHtml(question.title)}</span>

      <span class="question-status">
        ${status}
      </span>
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

// ==========================================
// 問題画面
// ==========================================

function renderQuestion() {
  const content = document.getElementById("content");

  const question = QUESTIONS[currentQuestion];
  const solved = state.solved[currentQuestion];

  if (
    currentQuestion === LAST_INDEX &&
    state.finalResult
  ) {
    showFinalResult();
    return;
  }

  content.className = "content";

  // 正解の文字数を自動計算
  const answerLength = Array.from(question.answer).length;

  content.innerHTML = `
    <div class="question-header">
      <div class="question-label">
        QUESTION ${String(currentQuestion + 1).padStart(2, "0")}
        / ${QUESTIONS.length}
      </div>

      <h2 class="question-title">
        ${escapeHtml(question.title)}
      </h2>

      ${
        solved
          ? `<div class="solved-label">✓ 正解済み</div>`
          : ""
      }
    </div>

    <section class="question-card">
      <p class="problem">
        ${escapeHtml(question.problem)}
      </p>

      ${
        currentQuestion === LAST_INDEX
          ? `
            <div class="final-warning">
              ⚠ この問題は
              <strong>1回しか解答できません</strong>。
              慎重に答えてください。
            </div>
          `
          : ""
      }

      <div class="answer-area">

        <div class="answer-length">
          答えは <strong>${answerLength}文字</strong>
        </div>

        <input
          id="answerInput"
          class="answer-input"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          placeholder="解答を入力"
          value="${
            solved
              ? escapeAttribute(state.answers[currentQuestion])
              : ""
          }"
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
          solved && getNextIndex(currentQuestion) !== -1
            ? `
              <button id="nextButton" class="next-button">
                ${
                  currentQuestion < FREE_COUNT &&
                  getNextIndex(currentQuestion) < FREE_COUNT
                    ? "未解答の問題へ"
                    : "次の問題へ"
                }
              </button>
            `
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

  content.classList.add("page-enter");

  const renderedCard =
    content.querySelector(".question-card");

  if (renderedCard) {
    renderedCard.classList.add("card-enter");
  }

  if (!solved) {
    setupAnswerInput();
    updateHintArea(false);
  } else {
    const nextButton =
      document.getElementById("nextButton");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        const nextIndex = getNextIndex(currentQuestion);

        if (
          nextIndex !== -1 &&
          getUnlockedQuestion(nextIndex)
        ) {
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

// ==========================================
// ヒント公開数
// ==========================================

function getRevealedHintCount(seconds) {
  if (seconds >= HINT_INTERVAL * 2) {
    return 2;
  }

  if (seconds >= HINT_INTERVAL) {
    return 1;
  }

  return 0;
}

// ==========================================
// ヒント表示
// ==========================================

function updateHintArea(announce) {
  const area = document.getElementById("hintArea");

  if (!area) return;

  const question = QUESTIONS[currentQuestion];
  const seconds = state.hintSeconds[currentQuestion] || 0;
  const revealed = getRevealedHintCount(seconds);

  const previous =
    area.dataset.revealed === undefined
      ? revealed
      : Number(area.dataset.revealed);

  area.dataset.revealed = String(revealed);

  if (announce && revealed > previous) {
    showToast(
      `ヒント${revealed === 1 ? "①" : "②"}が公開されました`
    );
  }

  const hints = [
    {
      label: "ヒント①",
      text: question.hint1
    },
    {
      label: "ヒント②",
      text: question.hint2
    }
  ];

  area.innerHTML = hints
    .map((hint, index) => {
      if (revealed > index) {
        const isNew =
          revealed > previous &&
          revealed === index + 1;

        return `
          <div class="hint-box open${isNew ? " hint-new" : ""}">
            <div class="hint-label">
              💡 ${hint.label}
            </div>
            <div class="hint-text">
              ${escapeHtml(hint.text)}
            </div>
          </div>
        `;
      }

      let note;

      if (index === revealed) {
        const remain =
          HINT_INTERVAL * (index + 1) - seconds;

        note = `あと ${remain} 秒で公開`;
      } else {
        note = "ヒント①の公開後、さらに45秒で公開";
      }

      return `
        <div class="hint-box locked">
          <div class="hint-label">
            🔒 ${hint.label}
          </div>
          <div class="hint-text">
            ${note}
          </div>
        </div>
      `;
    })
    .join("");
}

// ==========================================
// ヒント用タイマー
// ==========================================

function tickHint() {
  if (currentPage !== "question") return;
  if (state.solved[currentQuestion]) return;

  state.hintSeconds[currentQuestion] =
    (state.hintSeconds[currentQuestion] || 0) + 1;

  saveState();
  updateHintArea(true);
}

// ==========================================
// 解答入力欄
// ==========================================

function setupAnswerInput() {
  const input = document.getElementById("answerInput");
  const button = document.getElementById("submitButton");

  input.focus();

  button.addEventListener("click", checkAnswer);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });
}

// ==========================================
// 解答判定
// ==========================================

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

  // ========================================
  // 最終問題：1回のみ
  // ========================================

if (currentQuestion === LAST_INDEX) {
  const ok =
    normalizeAnswer(userAnswer) ===
    normalizeAnswer(QUESTIONS[LAST_INDEX].answer);

  const confirmed = window.confirm(
    "この問題は1回しか解答できません。\nこの答えで確定しますか?"
  );

  if (!confirmed) return;

  state.answers[LAST_INDEX] = userAnswer;
  state.solved[LAST_INDEX] = ok;
  state.finalResult = ok ? "correct" : "wrong";

  saveState();

  input.disabled = true;
  button.disabled = true;

  // 判定中の演出
  const overlay = document.createElement("div");
  overlay.className = "final-judging-overlay";

  overlay.innerHTML = `
    <div class="final-judging-box">
      <div class="final-judging-label">FINAL ANSWER</div>
      <div class="final-judging-text">
        判定中<span id="judgingDots"></span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const dots = document.getElementById("judgingDots");
  let count = 0;

  const dotTimer = setInterval(() => {
    count = (count % 3) + 1;
    dots.textContent = "・".repeat(count);
  }, 400);

  // 約2秒後に結果を表示
  setTimeout(() => {
    clearInterval(dotTimer);
    overlay.remove();
    showFinalResult();
  }, 2000);

  return;
}

  // ========================================
  // 通常問題
  // ========================================

  const correctAnswer = QUESTIONS[currentQuestion].answer;

  if (
    normalizeAnswer(userAnswer) ===
    normalizeAnswer(correctAnswer)
  ) {
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
    renderSidebar();

    const nextIndex = getNextIndex(currentQuestion);

    if (nextIndex === -1) {
      setTimeout(() => {
        showClearPage();
      }, 850);

    } else if (nextIndex >= FREE_COUNT) {
      setTimeout(() => {
        showUnlockAnimation(nextIndex);
      }, 420);
    }

    setTimeout(() => {
      if (currentPage === "question") {
        renderQuestion();
      }
    }, 900);

  } else {
    message.className = "message incorrect";
    message.textContent =
      "✕ 不正解です。もう一度考えてみよう。";

    answerArea.classList.remove("wrong");
    void answerArea.offsetWidth;
    answerArea.classList.add("wrong");
  }
}

// ==========================================
// ロック解除アニメーション
// ==========================================

function showUnlockAnimation(nextIndex) {
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

      <h2 class="unlock-title">
        LOCK UNLOCKED
      </h2>

      <p class="unlock-subtitle">
        ${escapeHtml(QUESTIONS[nextIndex].title)}
        が解放されました
      </p>

      <div class="unlock-next">
        次の問題へ進めます
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  renderSidebar();

  const nextButton = document.querySelector(
    `.question-button[data-index="${nextIndex}"]`
  );

  if (nextButton) {
    nextButton.classList.add("just-unlocked");
  }

  setTimeout(() => {
    overlay.classList.add("hide");

    setTimeout(() => {
      overlay.remove();

      // 第7問クリア後だけ特別ポップアップ
      if (nextIndex === LAST_INDEX) {
        showFinalMessage(() => {
          currentQuestion = nextIndex;
          currentPage = "question";
          state.currentQuestion = nextIndex;

          saveState();
          renderSidebar();
          renderQuestion();
        });
      } else {
        currentQuestion = nextIndex;
        currentPage = "question";
        state.currentQuestion = nextIndex;

        saveState();
        renderSidebar();
        renderQuestion();
      }

    }, 350);

  }, 1500);
}

// ==========================================
// 第7問クリア後の特別ポップアップ
// ==========================================

function showFinalMessage(onContinue) {
  const popup = document.createElement("div");
  popup.className = "story-popup-overlay";

  popup.innerHTML = `
    <div class="story-popup">
      <div class="story-popup-icon">✦</div>

      <div class="story-popup-label">
        FINAL MYSTERY
      </div>

      <h2 class="story-popup-title">
        最後の謎へ
      </h2>

      <p class="story-popup-text">
        ここまでよく辿り着いたね！<br>
        最終問題を解くために第二倉庫へ行こう！
      </p>

      <button
        id="storyContinueButton"
        class="story-popup-button"
        type="button"
      >
        次へ進む
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document
    .getElementById("storyContinueButton")
    .addEventListener("click", () => {
      popup.classList.add("hide");

      setTimeout(() => {
        popup.remove();
        onContinue();
      }, 350);
    });
}

// ==========================================
// 過去の解答
// ==========================================

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
          <div class="answer-record-title">
            ${escapeHtml(question.title)}
          </div>

          <div class="answer-record-value">
            ${escapeHtml(state.answers[index])}
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  content.innerHTML = `
    <h2 class="page-title">
      過去の解答
    </h2>

    ${
      records
        ? `<div class="answers-list">${records}</div>`
        : `
          <div class="empty-answers">
            まだ正解した問題はありません。
          </div>
        `
    }
  `;
}

// ==========================================
// 最終結果
// ==========================================

function showFinalResult() {
  currentPage = "clear";

  stopGameTimer();
  renderSidebar();

  const ok = state.finalResult === "correct";
  const content = document.getElementById("content");

  content.className = "content clear-page";

  content.innerHTML = ok
    ? `
      <div class="clear-icon">🔓</div>

      <h2 class="clear-title">
        正解
      </h2>

      <p class="clear-text">
        君たちは正しく七不思議の真実に<br>
        辿り着くことができたようだ...
      </p>
    `
    : `
      <div class="clear-icon">🔒</div>

      <h2 class="clear-title fail">
        不正解
      </h2>

      <p class="clear-text">
        君たちは七不思議の真実に<br>
        辿り着くことができなかったみたいだ...
      </p>
    `;
}

function showClearPage() {
  showFinalResult();
}

// ==========================================
// 過去の解答画面へ
// ==========================================

function showAnswersPage() {
  currentPage = "answers";

  renderSidebar();
  renderAnswers();
}

// ==========================================
// HTMLエスケープ
// ==========================================

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

// ==========================================
// 通知
// ==========================================

function showToast(text) {
  const toast = document.getElementById("toast");

  toast.textContent = text;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

// ==========================================
// ゲームタイマー表示
// ==========================================

function updateGameTimer() {
  const timer = document.getElementById("gameTimer");

  if (!timer) return;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  timer.textContent =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;

  timer.classList.toggle(
    "timer-warning",
    remainingSeconds <= 60
  );
}

// ==========================================
// タイマー停止
// ==========================================

function stopGameTimer() {
  if (gameTimerInterval !== null) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

// ==========================================
// タイマー開始
// ==========================================

function startGameTimer() {
  stopGameTimer();
  updateGameTimer();

  gameTimerInterval = setInterval(() => {
    if (currentPage === "start") {
      stopGameTimer();
      return;
    }

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

// ==========================================
// 過去の解答ボタン
// ==========================================

document
  .getElementById("answersButton")
  .addEventListener("click", () => {
    showAnswersPage();
  });

// ==========================================
// リセットボタン
// ==========================================

document
  .getElementById("resetButton")
  .addEventListener("click", () => {
    const confirmed = window.confirm(
      "進行状況と解答をすべて消去して、スタート画面に戻しますか？"
    );

if (!confirmed) return;

// 最終問題の解答確定時にタイマー停止
stopGameTimer();

// 残り時間の表示を固定
updateGameTimer();

// 最終結果を保存
state.answers[LAST_INDEX] = userAnswer;
state.solved[LAST_INDEX] = ok;
state.finalResult = ok ? "correct" : "wrong";

saveState();

    window.location.href = "index.html";
  });

// ==========================================
// 初期起動
// ==========================================

renderSidebar();
updateGameTimer();
renderQuestion();
startGameTimer();
