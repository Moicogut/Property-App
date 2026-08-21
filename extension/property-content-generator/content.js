// Content Script para Google Labs Flow y Vibes AI
console.log("[Property AI Content Generator] Content script activo.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_PROPERTY_BATCH") {
    console.log("[Property AI Content Generator] Iniciando lote en ratio:", request.ratio);
    sendResponse({ status: "OK" });
  }
});
