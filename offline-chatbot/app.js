// Mi IA Offline — chatbot que corre 100% en el navegador (WebLLM + WebGPU),
// con búsqueda local (TF-IDF) sobre documentos propios como contexto (RAG).
// Nada de esto llama a un servidor: todo el procesamiento pasa en el dispositivo.

// Se importa dinámicamente (no como import estático) para que, si el CDN no
// está disponible (por ejemplo sin internet en la primera visita), el resto
// de la app (subir documentos, ver conversaciones guardadas) siga funcionando.
let webllm = null;
let webllmLoadError = null;
async function getWebllm() {
  if (webllm) return webllm;
  if (webllmLoadError) throw webllmLoadError;
  try {
    webllm = await import("https://esm.run/@mlc-ai/web-llm");
    return webllm;
  } catch (err) {
    webllmLoadError = err;
    throw err;
  }
}

// ---------- Modelos disponibles ----------
const MODELS = [
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", label: "Qwen2.5 7B (recomendado, ~4.5GB)" },
  { id: "Llama-3.1-8B-Instruct-q4f16_1-MLC", label: "Llama 3.1 8B (~4.6GB)" },
  { id: "gemma-2-9b-it-q4f16_1-MLC", label: "Gemma 2 9B (más pesado, ~5.5GB)" },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 mini (liviano, ~2.2GB, para PCs más limitadas)" },
  { id: "gemma-2-2b-it-q4f16_1-MLC", label: "Gemma 2 2B (muy liviano, ~1.5GB)" },
];

// ---------- IndexedDB ----------
const DB_NAME = "offline-chatbot-db";
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains("documents")) {
      db.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("messages")) {
      db.createObjectStore("messages", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "key" });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function dbAll(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbAdd(store, value) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbDelete(store, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
async function dbClear(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(store, value) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------- Búsqueda local en documentos (TF-IDF simple) ----------
const STOPWORDS = new Set(("de la que el en y a los del se las por un para con no una su al lo como mas pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mi antes algunos que the a an is are was were be been being of in on for to and or with").split(" "));

function tokenize(text) {
  return (text.toLowerCase().match(/[a-záéíóúüñ0-9]+/gi) || []).filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function chunkText(text, size = 800, overlap = 120) {
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > size && buf) {
      chunks.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap));
    }
    buf = buf ? buf + "\n\n" + p : p;
    while (buf.length > size * 1.5) {
      chunks.push(buf.slice(0, size));
      buf = buf.slice(size - overlap);
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text];
}

function buildTermFreq(text) {
  const terms = {};
  for (const t of tokenize(text)) terms[t] = (terms[t] || 0) + 1;
  return terms;
}

async function retrieveContext(query, topK = 4, maxChars = 2800) {
  const docs = await dbAll("documents");
  if (!docs.length) return null;

  const allChunks = [];
  for (const doc of docs) {
    for (const c of doc.chunks) allChunks.push({ doc: doc.name, ...c });
  }
  if (!allChunks.length) return null;

  const df = {};
  for (const c of allChunks) {
    for (const term of Object.keys(c.terms)) df[term] = (df[term] || 0) + 1;
  }
  const N = allChunks.length;
  const qterms = tokenize(query);
  if (!qterms.length) return null;

  const scored = allChunks.map(c => {
    let score = 0;
    for (const qt of qterms) {
      const tf = c.terms[qt] || 0;
      if (!tf) continue;
      const idf = Math.log((N + 1) / ((df[qt] || 1) + 1)) + 1;
      score += tf * idf;
    }
    return { ...c, score };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const picked = [];
  let total = 0;
  for (const c of scored.slice(0, topK)) {
    if (total + c.text.length > maxChars) break;
    picked.push(c);
    total += c.text.length;
  }
  if (!picked.length) return null;

  return {
    text: picked.map(p => `[Documento: ${p.doc}]\n${p.text}`).join("\n\n---\n\n"),
    sources: [...new Set(picked.map(p => p.doc))],
  };
}

// ---------- UI refs ----------
const $ = id => document.getElementById(id);
const statusEl = $("status"), loadbar = $("loadbar"), loadbarFill = $("loadbar-fill");
const msgsEl = $("msgs"), inp = $("inp"), sendbtn = $("sendbtn");
const warnEl = $("warn");
const modelModal = $("modelModal"), docsModal = $("docsModal");
const modelSelect = $("modelSelect"), modelHint = $("modelHint");
const docList = $("docList"), fileInput = $("fileInput");

let engine = null;
let modelReady = false;
let history = [];

// WebGPU check
if (!navigator.gpu) {
  warnEl.style.display = "block";
  warnEl.textContent = "⚠ Tu navegador no soporta WebGPU, así que no vas a poder cargar el modelo de IA. Probá con Chrome o Edge actualizado en una PC, o Chrome reciente en Android.";
}

// Populate model select
for (const m of MODELS) {
  const opt = document.createElement("option");
  opt.value = m.id; opt.textContent = m.label;
  modelSelect.appendChild(opt);
}
modelHint.textContent = "Elegí según la memoria de tu dispositivo. Si algo falla al cargar, probá una opción más liviana.";

function openModal(m) { m.classList.add("active"); }
function closeModal(m) { m.classList.remove("active"); }
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", e => closeModal(e.target.closest(".modal-bg"))));
$("btnModel").addEventListener("click", () => openModal(modelModal));
$("btnDocs").addEventListener("click", () => { renderDocList(); openModal(docsModal); });

function addMsgToUI(role, content, meta) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : role === "sys" ? "sys" : "bot");
  div.textContent = content;
  if (meta && meta.sources && meta.sources.length) {
    const tag = document.createElement("span");
    tag.className = "ctxtag";
    tag.textContent = "Fuente: " + meta.sources.join(", ");
    div.appendChild(tag);
  }
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
  return div;
}

async function loadHistory() {
  const rows = await dbAll("messages");
  history = rows.map(r => ({ role: r.role, content: r.content }));
  msgsEl.innerHTML = "";
  for (const r of rows) addMsgToUI(r.role, r.content);
}

// ---------- Cargar modelo ----------
$("btnLoadModel").addEventListener("click", async () => {
  const modelId = modelSelect.value;
  closeModal(modelModal);
  statusEl.textContent = "Preparando modelo...";
  loadbar.style.display = "block";
  inp.disabled = true; sendbtn.disabled = true;

  try {
    const wl = await getWebllm();
    engine = await wl.CreateMLCEngine(modelId, {
      initProgressCallback: (p) => {
        loadbarFill.style.width = Math.round((p.progress || 0) * 100) + "%";
        statusEl.textContent = p.text || "Cargando...";
      },
    });
    modelReady = true;
    loadbar.style.display = "none";
    statusEl.textContent = "Modelo listo (" + modelId + "). Ya podés escribir sin necesidad de internet.";
    inp.disabled = false; sendbtn.disabled = false;
    await dbPut("settings", { key: "lastModel", value: modelId });
    inp.focus();
  } catch (err) {
    loadbar.style.display = "none";
    const hint = webllmLoadError ? " (necesitás internet la primera vez para descargar el motor de IA)" : "";
    statusEl.textContent = "Error al cargar el modelo: " + err.message + hint;
    console.error(err);
  }
});

// ---------- Documentos ----------
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

fileInput.addEventListener("change", async () => {
  for (const file of fileInput.files) {
    try {
      const text = await readFileAsText(file);
      const rawChunks = chunkText(text);
      const chunks = rawChunks.map(t => ({ text: t, terms: buildTermFreq(t) }));
      await dbAdd("documents", { name: file.name, size: file.size, addedAt: Date.now(), chunks });
    } catch (err) {
      console.error("Error leyendo " + file.name, err);
    }
  }
  fileInput.value = "";
  renderDocList();
});

async function renderDocList() {
  const docs = await dbAll("documents");
  docList.innerHTML = "";
  if (!docs.length) {
    docList.innerHTML = '<li style="justify-content:center;color:var(--muted)">Todavía no subiste documentos.</li>';
    return;
  }
  for (const doc of docs) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${doc.name} (${(doc.size / 1024).toFixed(1)} KB)`;
    const del = document.createElement("button");
    del.textContent = "✕";
    del.addEventListener("click", async () => { await dbDelete("documents", doc.id); renderDocList(); });
    li.appendChild(label); li.appendChild(del);
    docList.appendChild(li);
  }
}

$("btnClearDocs").addEventListener("click", async () => {
  if (confirm("¿Borrar todos los documentos subidos?")) {
    await dbClear("documents");
    renderDocList();
  }
});

// ---------- Chat ----------
const SYSTEM_BASE = "Sos un asistente personal que responde en español de forma clara y directa. Si se te da contexto de documentos del usuario, priorizá esa información y citá de qué documento sale cuando sea relevante. Si no hay contexto relevante, respondé con tu conocimiento general y aclará que no encontraste eso en los documentos del usuario.";

async function sendMessage() {
  const text = inp.value.trim();
  if (!text || !modelReady) return;
  inp.value = "";
  inp.style.height = "auto";
  sendbtn.disabled = true;

  addMsgToUI("user", text);
  await dbAdd("messages", { role: "user", content: text, ts: Date.now() });
  history.push({ role: "user", content: text });

  const ctx = await retrieveContext(text);
  const messages = [{ role: "system", content: SYSTEM_BASE }];
  if (ctx) {
    messages.push({ role: "system", content: "Contexto de los documentos del usuario:\n\n" + ctx.text });
  }
  messages.push(...history.slice(-12));

  const botDiv = addMsgToUI("bot", "");
  let full = "";
  try {
    const stream = await engine.chat.completions.create({ messages, temperature: 0.6, stream: true });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      full += delta;
      botDiv.textContent = full;
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  } catch (err) {
    full = "Ocurrió un error generando la respuesta: " + err.message;
    botDiv.textContent = full;
  }

  if (ctx && ctx.sources.length) {
    const tag = document.createElement("span");
    tag.className = "ctxtag";
    tag.textContent = "Fuente: " + ctx.sources.join(", ");
    botDiv.appendChild(tag);
  }

  history.push({ role: "assistant", content: full });
  await dbAdd("messages", { role: "assistant", content: full, ts: Date.now() });
  sendbtn.disabled = false;
  inp.focus();
}

sendbtn.addEventListener("click", sendMessage);
inp.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
inp.addEventListener("input", () => {
  inp.style.height = "auto";
  inp.style.height = Math.min(inp.scrollHeight, 120) + "px";
});

$("btnNew").addEventListener("click", async () => {
  if (confirm("¿Borrar la conversación actual? (los documentos no se borran)")) {
    await dbClear("messages");
    history = [];
    msgsEl.innerHTML = "";
  }
});

// ---------- Init ----------
loadHistory();
if (navigator.serviceWorker) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
dbAll("settings").then(rows => {
  const last = rows.find(r => r.key === "lastModel");
  if (last) modelSelect.value = last.value;
});
