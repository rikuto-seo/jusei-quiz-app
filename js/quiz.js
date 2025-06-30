async function loadQuiz() {
  const res = await fetch("data/sample_questions.json");
  const questions = await res.json();
  const container = document.getElementById("quiz-container");

  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";

    const title = document.createElement("h2");
    title.textContent = `【問${index + 1}】 ${q.question}`;
    qDiv.appendChild(title);

    const shuffledChoices = q.choices
      .map(choice => ({ choice, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(obj => obj.choice);

    shuffledChoices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice;
      btn.onclick = () => {
        if (btn.dataset.answered) return;

        btn.dataset.answered = true;
        const isCorrect = choice === q.correct;
        btn.classList.add(isCorrect ? "correct" : "incorrect");

        const feedback = document.createElement("div");
        feedback.textContent = isCorrect
          ? "✅ 正解！"
          : `❌ 不正解。正解は「${q.correct}」`;
        feedback.className = "feedback";
        qDiv.appendChild(feedback);
      };
      qDiv.appendChild(btn);
    });

    container.appendChild(qDiv);
  });
}

loadQuiz();
