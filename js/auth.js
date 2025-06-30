function checkPassword() {
  const password = document.getElementById("password").value;
  const correctPassword = "teitanjusei"; // 🔒 ←ここで設定！

  if (password === correctPassword) {
    window.location.href = "index.html";
  } else {
    document.getElementById("error").textContent = "パスワードが違います";
  }
}
