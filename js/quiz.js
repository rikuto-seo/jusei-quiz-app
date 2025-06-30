// グローバル変数で問題全体を保持
let allQuestions = [];

// URLクエリからフィルターを取得
const params = new URLSearchParams(window.location.search);
const yearParam = params.get("year");
const subjectParam = params.get("subject");
const tagsParam = params.getAll("tag"); // 複数可: ?tag=基礎&tag=応用

// ユーザーが選択したフィルター状態
let filter = {
  year: yearParam ? parseInt(yearParam) : null,
  subject: subjectParam || null,
  tags: tagsParam.length > 0 ? tagsParam : []
};

// フィルターで問題絞り込み
function filterQuestions() {
  return allQuestions.filter(q => {
    if (filter.year && q.year !== filter.year) return false;
    if (filter.subject && q.subject !== filter.subject) return false;
    if (filter.tags.length > 0 && !filter.tags.some(tag => q.tags.includes(tag))) return false;
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
  container.innerHTML = ""; // 初期化

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const title = document.createElement("h2");
    title.textContent = `【問${q.number || index + 1}】（${q.year}年・${q.subject}）${q.question}`;
    qDiv.appendChild(title);

    const shuffledChoices = shuffleArray(
      q.choices.map((choice, i) => ({ choice, originalIndex: i }))
    );

    shuffledChoices.forEach(({ choice, originalIndex }) => {
      const btn = document.createElement("button");
      btn.textContent = choice;

      btn.onclick = () => {
        if (qDiv.dataset.answered) return;
        qDiv.dataset.answered = "true";

        const isCorrect = originalIndex === q.answer;
        btn.classList.add(isCorrect ? "correct" : "incorrect");

        const feedback = document.createElement("div");
        feedback.className = "feedback";
        feedback.textContent = isCorrect
          ? "✅ 正解！"
          : `❌ 不正解。正解は「${q.choices[q.answer]}」`;
        qDiv.appendChild(feedback);

        qDiv.querySelectorAll("button").forEach(b => {
          b.disabled = true;
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
  const targetYear = filter.year || new Date().getFullYear();
  const jsonPath = `data/questions_${targetYear}.json`;

  try {
    const res = await fetch(jsonPath);
    allQuestions = await res.json();
    const filtered = filterQuestions();
    renderQuiz(filtered);
  } catch (err) {
    console.error("問題の読み込みに失敗:", err);
    document.getElementById("quiz-container").textContent = "問題の読み込みに失敗しました。";
  }
}

// フィルターを更新して再描画（必要ならUIから呼び出し）
function updateFilter(newFilter) {
  filter = { ...filter, ...newFilter };
  const filtered = filterQuestions();
  renderQuiz(filtered);
}

// ページ読み込み時に実行
loadQuiz();
