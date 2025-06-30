// グローバル変数で問題全体を保持
let allQuestions = [];

// URLクエリからフィルターを取得
const params = new URLSearchParams(window.location.search);
const yearParam = params.get("year");
const subjectParam = params.get("subject");
const tagsParam = params.getAll("tag"); // 複数可: ?tag=基礎&tag=応用

// フィルター状態を設定
let filter = {
  year: yearParam ? parseInt(yearParam) : null,
  subject: subjectParam || null,
  tags: tagsParam.length > 0 ? tagsParam : []
};

// 試験回数を計算
function getExamNumber(year) {
  const firstYear = 1993;
  return `第${year - firstYear + 1}回`;
}

// 午前・午後表示を取得（例: "am" → "午前"）
function getSessionLabel(session) {
  if (session === "am") return "午前";
  if (session === "pm") return "午後";
  return "";
}

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

// クイズ表示
function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const title = document.createElement("h2");
    const examNum = getExamNumber(q.year);
    const sessionLabel = getSessionLabel(q.session);
    const questionNo = q.questionNumber || index + 1;

    title.textContent = `【問${questionNo}】 ${q.question}（${q.year}年・${examNum}・問${questionNo}・${q.subject}）`;

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
  try {
    const targetYear = filter.year || new Date().getFullYear();
    const session = params.get("session"); // "am", "pm" または null

    // JSONファイルの読み込み先
    const paths = [];

    if (session === "am" || session === "pm") {
      paths.push(`data/questions_${targetYear}_${session}.json`);
    } else {
      paths.push(`data/questions_${targetYear}_am.json`);
      paths.push(`data/questions_${targetYear}_pm.json`);
    }

    const filePromises = paths.map(path =>
      fetch(path).then(res => {
        if (!res.ok) throw new Error(`ファイル取得失敗: ${path}`);
        return res.json();
      })
    );

    const results = await Promise.all(filePromises);
    allQuestions = results.flat();

    const filtered = filterQuestions();
    renderQuiz(filtered);

  } catch (err) {
    console.error("問題の読み込みに失敗:", err);
    document.getElementById("quiz-container").textContent = "問題の読み込みに失敗しました。";
  }
}

// フィルター更新＆再描画
function updateFilter(newFilter) {
  filter = { ...filter, ...newFilter };
  const filtered = filterQuestions();
  renderQuiz(filtered);
}

// 初期化
loadQuiz();
