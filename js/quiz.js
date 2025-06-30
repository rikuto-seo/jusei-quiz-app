// グローバル変数で問題全体を保持
let allQuestions = [];

// ユーザーが選択したフィルター状態（例：UI連動用に今は固定）
let filter = {
  year: null,          // 例: 2023 または null で全年度
  subject: null,       // 例: "柔道整復師法" または null で全教科
  tags: []             // 例: ["基礎", "応用"] 複数選択可能。空配列は全て含む
};

// フィルターで問題絞り込み
function filterQuestions() {
  return allQuestions.filter(q => {
    if (filter.year && q.year !== filter.year) return false;
    if (filter.subject && q.subject !== filter.subject) return false;
    if (filter.tags.length > 0) {
      // タグが1つも一致しなければ除外
      if (!filter.tags.some(tag => q.tags.includes(tag))) return false;
    }
    return true;
  });
}

// シャッフル関数（Fisher-Yates）
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// クイズ表示関数
function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = ""; // クリア

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const title = document.createElement("h2");
    title.textContent = `【問${index + 1}】（${q.year}年・${q.subject}） ${q.question}`;
    qDiv.appendChild(title);

    // 選択肢を元のインデックス付きでシャッフル
    const shuffledChoices = shuffleArray(
      q.choices.map((choice, i) => ({ choice, originalIndex: i }))
    );

    shuffledChoices.forEach(({ choice, originalIndex }) => {
      const btn = document.createElement("button");
      btn.textContent = choice;

      btn.onclick = () => {
        // 一度回答したら何もしない
        if (qDiv.dataset.answered) return;

        qDiv.dataset.answered = "true";

        const isCorrect = originalIndex === q.answer;
        btn.classList.add(isCorrect ? "correct" : "incorrect");

        const feedback = document.createElement("div");
        feedback.className = "feedback";
        if (isCorrect) {
          feedback.textContent = "✅ 正解！";
        } else {
          feedback.textContent = `❌ 不正解。正解は「${q.choices[q.answer]}」`;
        }
        qDiv.appendChild(feedback);

        // すべてのボタンを無効化して回答確定状態にする
        qDiv.querySelectorAll("button").forEach(b => {
          b.disabled = true;
          // 正解ボタンは緑に、間違いは灰色にする
          if (b.textContent === q.choices[q.answer]) {
            b.classList.add("correct");
          } else {
            b.classList.add("disabled-btn");
          }
        });
      };

      qDiv.appendChild(btn);
    });

    container.appendChild(qDiv);
  });
}

// 初期ロード関数
async function loadQuiz() {
  try {
    const res = await fetch("data/sample_questions.json");
    allQuestions = await res.json();

    // 最初はフィルターなし（全部表示）
    const filtered = filterQuestions();
    renderQuiz(filtered);

  } catch (err) {
    console.error("問題の読み込みに失敗しました:", err);
    const container = document.getElementById("quiz-container");
    container.textContent = "問題の読み込みに失敗しました。";
  }
}

// フィルターを更新して再描画する関数（UIで呼ぶ用）
function updateFilter(newFilter) {
  filter = { ...filter, ...newFilter };
  const filtered = filterQuestions();
  renderQuiz(filtered);
}

// ページロード時に問題読み込み
loadQuiz();
