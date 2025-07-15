const velocidadeInput = document.getElementById("velocidade");
const iniciarBtn = document.getElementById("iniciarBtn");

iniciarBtn.addEventListener("click", () => {
  const velocidadeSelecionada = parseInt(velocidadeInput.value);
  localStorage.setItem("velocidadeJogo", velocidadeSelecionada);
  window.location.href = ".././jogo.html"; 
});
