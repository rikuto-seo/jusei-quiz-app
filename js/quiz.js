window.addEventListener("DOMContentLoaded", () => {
  loadQuiz();
});

let allQuestions = [];
let correctCount = 0;
let answeredCount = 0;

const params = new URLSearchParams(window.location.search);
const yearParam = params.get("year");
const subjectParam = params.get("subject");
const tagsParam = params.getAll("tag");

let filter = {
  year: yearParam ? parseInt(yearParam) : null,
  subject: subjectParam || null,
  tags: tagsParam.length > 0 ? tagsParam : []
};

function getExamNumber(year) {
  const firstYear = 1993;
  return `第${year - firstYear + 1}回`;
}

function getSessionLabel(session) {
  if (session === "am") return "午前";
  if (session === "pm") return "午後";
  return "";
}

function filterQuestions() {
  return allQuestions.filter(q => {
    if (filter.year && q.year !== filter.year) return false;
    if (filter.subject) {
      if (Array.isArray(q.subject)) {
        if (!q.subject.includes(filter.subject)) return false;
      } else {
        if (q.subject !== filter.subject) return false;
      }
    }
    if (filter.tags.length > 0 && !filter.tags.some(tag => q.tags.includes(tag))) return false;
    return true;
  });
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showResult() {
  let resultDiv = document.getElementById("quiz-result");
  if (!resultDiv) {
    resultDiv = document.createElement("div");
    resultDiv.id = "quiz-result";
    resultDiv.style.marginTop = "20px";
    resultDiv.style.fontSize = "1.2em";
    resultDiv.style.fontWeight = "bold";
    document.getElementById("quiz-container").appendChild(resultDiv);
  }
  resultDiv.textContent = `正答数: ${correctCount} / ${answeredCount} 問`;
}

function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  correctCount = 0;
  answeredCount = 0;

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const title = document.createElement("h2");
    const examNum = getExamNumber(q.year);
    const sessionLabel = getSessionLabel(q.session);
    const questionNo = q.questionNumber || index + 1;

    title.textContent = `【問${questionNo}】 ${q.question}（${q.year}年・${examNum}・問${questionNo}・${q.subject}）`;
    qDiv.appendChild(title);

    const shuffledChoices = shuffleArray(
      q.choices.map((choice, i) => ({ choice, originalIndex: i }))
    );

    const isMultiAnswer = Array.isArray(q.answer);
    const correctAnswers = isMultiAnswer ? q.answer.slice().sort() : [q.answer];

    if (isMultiAnswer) {
      // 複数選択ボタンに変更
      const choiceButtons = [];

      shuffledChoices.forEach(({ choice, originalIndex }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = choice;
        btn.dataset.selected = "false";

        btn.onclick = () => {
          if (qDiv.dataset.answered) return;

          // 選択状態をトグル
          const selected = btn.dataset.selected === "true";
          if (selected) {
            btn.dataset.selected = "false";
            btn.classList.remove("selected");
          } else {
            btn.dataset.selected = "true";
            btn.classList.add("selected");
          }
        };

        qDiv.appendChild(btn);
        choiceButtons.push({ btn, originalIndex });
      });

      const submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.textContent = "決定";

      // スタイル追加
      submitBtn.style.backgroundColor = "green";
      submitBtn.style.fontWeight = "bold";
      submitBtn.style.color = "white";

      submitBtn.onclick = () => {
        if (qDiv.dataset.answered) return;
        qDiv.dataset.answered = "true";

        const selected = choiceButtons
          .filter(({ btn }) => btn.dataset.selected === "true")
          .map(({ originalIndex }) => originalIndex)
          .sort();

        const isCorrect = JSON.stringify(selected) === JSON.stringify(correctAnswers);

        if (isCorrect) correctCount++;
        answeredCount++;

        const feedback = document.createElement("div");
        feedback.className = "feedback";
        feedback.textContent = isCorrect
          ? "✅ 正解！"
          : `❌ 不正解。正解は「${correctAnswers.map(i => q.choices[i]).join("・")}」`;
        qDiv.appendChild(feedback);

        // ボタンと決定ボタン無効化
        choiceButtons.forEach(({ btn }) => {
          btn.disabled = true;
          btn.classList.remove("selected");
        });
        submitBtn.disabled = true;

        if (answeredCount === questions.length) showResult();
      };

      qDiv.appendChild(submitBtn);
    }
    else {
      // ✅ 単一回答（ボタン）
      shuffledChoices.forEach(({ choice, originalIndex }) => {
        const btn = document.createElement("button");
        btn.textContent = choice;

        btn.onclick = () => {
          if (qDiv.dataset.answered) return;
          qDiv.dataset.answered = "true";

          const isCorrect = originalIndex === q.answer;
          if (isCorrect) correctCount++;
          answeredCount++;

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

          if (answeredCount === questions.length) showResult();
        };

        qDiv.appendChild(btn);
      });
    }

    container.appendChild(qDiv);
  });
}

async function loadQuiz() {
  try {
    const targetYear = filter.year || new Date().getFullYear();
    const session = params.get("session");

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
    const container = document.getElementById("quiz-container");
    if (container) {
      container.textContent = "問題の読み込みに失敗しました。\n" + err.message;
    } else {
      alert("quiz-containerが見つかりません");
    }
  }
}

function updateFilter(newFilter) {
  filter = { ...filter, ...newFilter };
  const filtered = filterQuestions();
  renderQuiz(filtered);
}
