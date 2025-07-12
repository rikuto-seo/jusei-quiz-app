window.addEventListener("DOMContentLoaded", () => {
  loadQuiz();

  const overlay = document.getElementById("image-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.classList.contains("close-button")) {
        overlay.style.display = "none";
      }
    });
  }
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

function showImageModal(imageSources) {
  const overlay = document.createElement("div");
  overlay.className = "image-overlay";

  const modal = document.createElement("div");
  modal.className = "image-modal";

  imageSources.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "問題画像";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "80vh";
    img.style.marginBottom = "1em";
    modal.appendChild(img);
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "閉じる";
  closeBtn.onclick = () => overlay.remove();
  closeBtn.style.marginTop = "1em";
  closeBtn.style.padding = "0.5em 1em";
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  correctCount = 0;
  answeredCount = 0;

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const examNum = getExamNumber(q.year);
    const sessionLabel = getSessionLabel(q.session);
    const questionNo = q.questionNumber || index + 1;

    // ------- 問題文上部の画像表示（ポップアップ対応） -------
    if (Array.isArray(q.questionImages) && q.questionImages.length > 0) {
      const btn = document.createElement("button");
      btn.textContent = "画像を見る";
      btn.className = "image-button";
      btn.style.marginBottom = "0.5em";
      btn.onclick = () => {
        const overlay = document.getElementById("image-overlay");
        const content = document.getElementById("image-modal-content");
        content.innerHTML = "";
        q.questionImages.forEach(src => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = "問題画像";
          content.appendChild(img);
        });
        overlay.style.display = "flex";
      };
      qDiv.appendChild(btn);
    }

    const title = document.createElement("h2");

    const questionText = document.createElement("span");
    questionText.className = "question-main";
    questionText.textContent = `【問${questionNo}】 ${q.question}`;

    const metaText = document.createElement("div");
    metaText.className = "question-meta";
    metaText.textContent = `（${q.year}年・${examNum}・問${questionNo}・${Array.isArray(q.subject) ? q.subject.join("／") : q.subject}）`;

    title.appendChild(questionText);
    title.appendChild(metaText);
    qDiv.appendChild(title);

    const shuffledChoices = shuffleArray(
      q.choices.map((choice, i) => ({ choice, originalIndex: i }))
    );

    const isMultiAnswer = Array.isArray(q.answer);
    const correctAnswers = isMultiAnswer ? q.answer.slice().sort() : [q.answer];

    if (isMultiAnswer) {
      const choiceButtons = [];

      shuffledChoices.forEach(({ choice, originalIndex }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = choice;
        btn.dataset.selected = "false";

        const choiceImage = q.choiceImages?.[originalIndex];
        if (choiceImage) {
          const imgBtn = document.createElement("button");
          imgBtn.textContent = "画像を見る";
          imgBtn.style.display = "block";
          imgBtn.style.marginTop = "0.3em";
          imgBtn.onclick = () => showImageModal([choiceImage]);
          btn.appendChild(document.createElement("br"));
          btn.appendChild(imgBtn);
        }

        btn.onclick = () => {
          if (qDiv.dataset.answered) return;
          const selected = btn.dataset.selected === "true";
          btn.dataset.selected = selected ? "false" : "true";
          btn.classList.toggle("selected", !selected);
        };

        qDiv.appendChild(btn);
        choiceButtons.push({ btn, originalIndex });
      });

      const submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.textContent = "決定";
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

        choiceButtons.forEach(({ btn }) => {
          btn.disabled = true;
          btn.classList.remove("selected");
        });
        submitBtn.disabled = true;

        if (answeredCount === questions.length) showResult();
      };

      qDiv.appendChild(submitBtn);
    } else {
      shuffledChoices.forEach(({ choice, originalIndex }) => {
        const btn = document.createElement("button");
        btn.textContent = choice;

        const choiceImage = q.choiceImages?.[originalIndex];
        if (choiceImage) {
          const imgBtn = document.createElement("button");
          imgBtn.textContent = "画像を見る";
          imgBtn.style.display = "block";
          imgBtn.style.marginTop = "0.3em";
          imgBtn.onclick = () => showImageModal([choiceImage]);
          btn.appendChild(document.createElement("br"));
          btn.appendChild(imgBtn);
        }

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
    const session = params.get("session");

    const paths = [];

    if (filter.year) {
      if (session === "am" || session === "pm") {
        paths.push(`data/questions_${filter.year}_${session}.json`);
      } else {
        paths.push(`data/questions_${filter.year}_am.json`);
        paths.push(`data/questions_${filter.year}_pm.json`);
      }
    } else {
      const currentYear = new Date().getFullYear();
      for (let y = 1993; y <= currentYear; y++) {
        if (session === "am" || session === "pm") {
          paths.push(`data/questions_${y}_${session}.json`);
        } else {
          paths.push(`data/questions_${y}_am.json`);
          paths.push(`data/questions_${y}_pm.json`);
        }
      }
    }

    const filePromises = paths.map(path =>
      fetch(path)
        .then(res => {
          if (!res.ok) throw new Error(`ファイル取得失敗: ${path}`);
          return res.json();
        })
        .catch(err => {
          console.warn(err.message);
          return [];
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