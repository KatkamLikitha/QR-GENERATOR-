const qrInput = document.getElementById("qrInput");
const qrImage = document.getElementById("qrImage");
const historyList = document.getElementById("historyList");

const generateBtn = document.getElementById("generateBtn");
const tabBtn = document.getElementById("tabBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

let history = JSON.parse(localStorage.getItem("qrHistory")) || [];
let pinned = JSON.parse(localStorage.getItem("qrPinned")) || [];

/* ------------------ EVENTS ------------------ */

generateBtn.addEventListener("click", () => {
  if (qrInput.value.trim()) {
    generateQR(qrInput.value.trim());
  }
});

tabBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    generateQR(tabs[0].url);
  });
});

downloadBtn.addEventListener("click", downloadQR);

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  pinned = [];
  localStorage.removeItem("qrHistory");
  localStorage.removeItem("qrPinned");
  loadHistory();
});

/* ------------------ QR FUNCTIONS ------------------ */

function generateQR(data) {
  const qrURL =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
    encodeURIComponent(data);

  qrImage.src = qrURL;
  saveToHistory(data);
}

async function downloadQR() {
  if (!qrImage.src) return;

  try {
    const response = await fetch(qrImage.src);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "qr-code.png";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    alert("Download failed");
  }
}

/* ------------------ HISTORY ------------------ */

function saveToHistory(value) {
  if (!history.includes(value) && !pinned.includes(value)) {
    history.unshift(value);
  }

  if (history.length > 10) history.pop();

  localStorage.setItem("qrHistory", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  historyList.innerHTML = "";

  const combined = [
    ...pinned.map(v => ({ value: v, pinned: true })),
    ...history
      .filter(v => !pinned.includes(v))
      .map(v => ({ value: v, pinned: false }))
  ];

  combined.forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent =
      item.value.length > 30 ? item.value.slice(0, 30) + "..." : item.value;
    text.onclick = () => generateQR(item.value);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const pin = document.createElement("span");
    pin.className = "pin";
    pin.textContent = item.pinned ? "📌" : "⭐";
    pin.title = item.pinned ? "Unpin" : "Pin";
    pin.onclick = () => togglePin(item.value);

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "❌";
    del.title = "Delete";
    del.onclick = () => deleteItem(item.value);

    actions.appendChild(pin);
    actions.appendChild(del);

    li.appendChild(text);
    li.appendChild(actions);
    historyList.appendChild(li);
  });
}

function deleteItem(value) {
  history = history.filter(v => v !== value);
  pinned = pinned.filter(v => v !== value);

  localStorage.setItem("qrHistory", JSON.stringify(history));
  localStorage.setItem("qrPinned", JSON.stringify(pinned));
  loadHistory();
}

function togglePin(value) {
  if (pinned.includes(value)) {
    pinned = pinned.filter(v => v !== value);
  } else {
    pinned.unshift(value);
    history = history.filter(v => v !== value);
  }

  localStorage.setItem("qrPinned", JSON.stringify(pinned));
  localStorage.setItem("qrHistory", JSON.stringify(history));
  loadHistory();
}

/* ------------------ INIT ------------------ */

loadHistory();
document.getElementById("closeBtn").addEventListener("click", () => {
  window.close();
});

