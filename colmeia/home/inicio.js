const menuOptions = document.querySelectorAll(".menu-option[data-option]");
const iniciarBtn = document.getElementById("iniciarBtn");
const allOptions = [...menuOptions, iniciarBtn];
let currentSelection = 0;
let scanSpeed = 800;
let scanInterval = null;
let velocidadeSelecionada = "medium";

function startMenuScan(startIndex = 0) {
  let index = startIndex;
  stopMenuScan();
  scanInterval = setInterval(() => {
    allOptions.forEach(opt => opt.blur());
    allOptions[index].focus();
    currentSelection = index;
    index = (index + 1) % allOptions.length;
  }, scanSpeed);
}

function stopMenuScan() {
  if (scanInterval) clearInterval(scanInterval);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    const selected = allOptions[currentSelection];

    if (selected.dataset.option) {
    
      const opt = selected.dataset.option;
      velocidadeSelecionada = opt.replace("speed-", "");

    
      scanSpeed = velocidadeSelecionada === "slow" ? 2000 :
                  velocidadeSelecionada === "medium" ? 1000 : 500;

    
      startMenuScan(currentSelection);
    } else if (selected.id === "iniciarBtn") {
      
      localStorage.setItem("velocidadeJogo", velocidadeSelecionada);
      stopMenuScan();
      window.location.href = "../jogo.html";
    }
  }
});

startMenuScan();
