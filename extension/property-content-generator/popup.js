let loadedScript = null;
let selectedRatio = "9:16";

const btn916 = document.getElementById("btn916");
const btn169 = document.getElementById("btn169");
const btnSelectFolder = document.getElementById("btnSelectFolder");
const btnStartBatch = document.getElementById("btnStartBatch");
const statusText = document.getElementById("statusText");

btn916.addEventListener("click", () => {
  selectedRatio = "9:16";
  btn916.classList.add("active");
  btn169.classList.remove("active");
});

btn169.addEventListener("click", () => {
  selectedRatio = "16:9";
  btn169.classList.add("active");
  btn916.classList.remove("active");
});

btnSelectFolder.addEventListener("click", async () => {
  try {
    statusText.innerHTML = "Leyendo script.json...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || (!tab.url.includes("labs.google") && !tab.url.includes("vibes.ai"))) {
      statusText.innerHTML = "<span style='color:#F43F5E;'>⚠️ Abre una pestaña con Google Labs Flow o Vibes AI primero.</span>";
      return;
    }

    statusText.innerHTML = "✅ Conectado a Flow/Vibes. Asegúrate de tener script.json en tu carpeta seleccionada.";
    btnStartBatch.style.display = "flex";
  } catch (err) {
    statusText.innerHTML = `<span style='color:#F43F5E;'>Error: ${err.message}</span>`;
  }
});

btnStartBatch.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "START_PROPERTY_BATCH", ratio: selectedRatio }, (response) => {
      if (response && response.status === "OK") {
        statusText.innerHTML = "🚀 Lote iniciado en segundo plano. Puedes cerrar este popup.";
      }
    });
  }
});
