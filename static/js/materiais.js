// static/js/materiais.js

const MATERIAIS_API_BASE_URL = "/api";

// Estilo conhecido para as categorias originais; categorias novas criadas
// por um admin recebem uma cor da paleta de fallback abaixo.
const KNOWN_CATEGORY_STYLES = {
  Apostilas: { icon: "fa-book", bg: "#EDE9FE", text: "#6B21A8", border: "#C4B5FD" },
  "Sequências Didáticas": { icon: "fa-list", bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" },
  "Atividades Práticas": { icon: "fa-flask", bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  "Planos de Aula": { icon: "fa-file-lines", bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  Artigos: { icon: "fa-scroll", bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" },
};

const FALLBACK_PALETTE = [
  { icon: "fa-tag", bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
  { icon: "fa-tag", bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
  { icon: "fa-tag", bg: "#ECFCCB", text: "#3F6212", border: "#D9F99D" },
  { icon: "fa-tag", bg: "#CFFAFE", text: "#155E75", border: "#A5F3FC" },
];

function getCategoryStyle(category) {
  if (KNOWN_CATEGORY_STYLES[category]) return KNOWN_CATEGORY_STYLES[category];
  // hash simples só pra escolher sempre a mesma cor de fallback para a mesma categoria
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

// ---- ESTADO ----
let allMaterials = [];
let activeCategory = "Todos";
let searchTerm = "";

// ---- HELPERS DE AUTENTICAÇÃO ----
function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch (err) {
    return null;
  }
}

function isAdmin() {
  const usuario = getUsuarioLogado();
  return !!(usuario && usuario.isAdmin);
}

function getToken() {
  return localStorage.getItem("token");
}

// ---- HELPERS GERAIS ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function categoryBadgeHtml(category) {
  const style = getCategoryStyle(category);
  return `
    <div class="category-badge" style="background:${style.bg};color:${style.text};border-color:${style.border};">
      <i class="fa-solid ${style.icon}"></i>
      ${escapeHtml(category)}
    </div>
  `;
}

function getCategories() {
  const categorias = [];
  allMaterials.forEach((m) => {
    if (!categorias.includes(m.category)) categorias.push(m.category);
  });
  return ["Todos", ...categorias];
}

function getCounts() {
  const counts = { Todos: allMaterials.length };
  allMaterials.forEach((m) => {
    counts[m.category] = (counts[m.category] || 0) + 1;
  });
  return counts;
}

function getFiltered() {
  const term = searchTerm.trim().toLowerCase();
  return allMaterials.filter((m) => {
    const matchesCategory = activeCategory === "Todos" || m.category === activeCategory;
    const matchesSearch =
      term === "" ||
      m.title.toLowerCase().includes(term) ||
      m.description.toLowerCase().includes(term) ||
      (m.tags || []).some((t) => t.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });
}

// ---- RENDER ----
function renderStats() {
  const counts = getCounts();
  const categorias = getCategories().filter((c) => c !== "Todos");
  const el = document.getElementById("heroStats");

  if (categorias.length === 0) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = categorias
    .map(
      (cat) => `
      <div class="stat">
        <div class="stat-number">${counts[cat]}</div>
        <div class="stat-label">${escapeHtml(cat)}</div>
      </div>
    `
    )
    .join("");
}

function renderPills() {
  const counts = getCounts();
  const categorias = getCategories();
  const el = document.getElementById("categoryPills");

  el.innerHTML = categorias
    .map((cat) => {
      const isActive = activeCategory === cat;
      const icon = cat !== "Todos" ? `<i class="fa-solid ${getCategoryStyle(cat).icon}"></i>` : "";
      return `
        <button class="pill ${isActive ? "active" : ""}" data-cat="${escapeHtml(cat)}">
          ${icon}
          ${escapeHtml(cat)}
          <span class="pill-count">${counts[cat]}</span>
        </button>
      `;
    })
    .join("");

  el.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderPills();
      renderGrid();
    });
  });

  // mantém o datalist de categorias do formulário de admin atualizado
  const datalist = document.getElementById("categoryOptions");
  if (datalist) {
    datalist.innerHTML = categorias
      .filter((c) => c !== "Todos")
      .map((c) => `<option value="${escapeHtml(c)}"></option>`)
      .join("");
  }
}

function renderGrid() {
  const filtered = getFiltered();
  const grid = document.getElementById("materialsGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsCount = document.getElementById("resultsCount");

  resultsCount.textContent =
    filtered.length === 0
      ? ""
      : `${filtered.length} ${filtered.length === 1 ? "material encontrado" : "materiais encontrados"}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  grid.innerHTML = filtered
    .map(
      (m) => `
      <div class="material-card" data-id="${m.id}">
        <div class="material-card-img-wrap">
          <img src="${m.image}" alt="${escapeHtml(m.title)}" loading="lazy">
        </div>
        <div class="material-card-body">
          ${categoryBadgeHtml(m.category)}
          <h3>${escapeHtml(m.title)}</h3>
          <p>${escapeHtml(m.description)}</p>
          <div class="material-card-footer">
            Ver mais <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  grid.querySelectorAll(".material-card").forEach((card) => {
    card.addEventListener("click", () => {
      const material = allMaterials.find((m) => m.id === Number(card.dataset.id));
      if (material) openModal(material);
    });
  });
}

function renderAll() {
  renderStats();
  renderPills();
  renderGrid();
}

// ---- CARREGAR DADOS DA API ----
async function fetchMaterials() {
  try {
    const res = await fetch(`${MATERIAIS_API_BASE_URL}/materiais`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Erro ao carregar materiais:", data.message);
      allMaterials = [];
    } else {
      allMaterials = data.data || [];
    }
  } catch (err) {
    console.error("Erro de conexão ao carregar materiais:", err);
    allMaterials = [];
  }

  renderAll();
}

// ---- MODAL DE DETALHES ----
let materialSelecionado = null;

function openModal(material) {
  materialSelecionado = material;

  document.getElementById("modalImage").src = material.image;
  document.getElementById("modalImage").alt = material.title;
  document.getElementById("modalBadge").innerHTML = categoryBadgeHtml(material.category);
  document.getElementById("modalTitle").textContent = material.title;
  document.getElementById("modalDescription").textContent = material.fullDescription;
  document.getElementById("modalTags").innerHTML = (material.tags || [])
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join("");

  const downloadBtn = document.getElementById("modalDownload");
  const downloadLabel = document.getElementById("modalDownloadLabel");
  if (material.arquivoUrl) {
    downloadLabel.textContent = "Baixar material";
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => window.open(material.arquivoUrl, "_blank");
  } else {
    downloadLabel.textContent = "Nenhum arquivo disponível";
    downloadBtn.disabled = true;
    downloadBtn.onclick = null;
  }

  const deleteBtn = document.getElementById("modalDeleteBtn");
  deleteBtn.style.display = isAdmin() ? "flex" : "none";

  document.getElementById("modalOverlay").classList.add("active");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
  materialSelecionado = null;
}

async function excluirMaterialSelecionado() {
  if (!materialSelecionado) return;
  if (!confirm(`Remover "${materialSelecionado.title}"? Essa ação não pode ser desfeita.`)) return;

  try {
    const res = await fetch(`${MATERIAIS_API_BASE_URL}/materiais/${materialSelecionado.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Não foi possível remover o material.");
      return;
    }

    closeModal();
    fetchMaterials();
  } catch (err) {
    alert("Erro de conexão com o servidor.");
  }
}

// ---- MODAL DE ADMINISTRAÇÃO (adicionar material) ----
function setupUploadTabs() {
  document.querySelectorAll(".upload-tabs").forEach((group) => {
    const target = group.dataset.target; // "Image" ou "Arquivo"
    const fileWrap = document.getElementById(`mat${target}FileWrap`);
    const fileInput = document.getElementById(`mat${target}File`);
    const urlInput = document.getElementById(target === "Image" ? "matImage" : "matArquivoUrl");

    group.querySelectorAll(".upload-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        group.querySelectorAll(".upload-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const isFileMode = tab.dataset.mode === "file";
        fileWrap.style.display = isFileMode ? "" : "none";
        urlInput.style.display = isFileMode ? "none" : "";

        // limpa o campo escondido, pra não mandar os dois ao mesmo tempo
        if (isFileMode) {
          urlInput.value = "";
        } else {
          fileInput.value = "";
          atualizarNomeArquivo(fileInput);
        }
      });
    });
  });

  // Mostra o nome do arquivo escolhido ao lado do botão "Escolher arquivo"
  document.querySelectorAll(".file-picker-input").forEach((input) => {
    input.addEventListener("change", () => atualizarNomeArquivo(input));
  });
}

function atualizarNomeArquivo(fileInput) {
  const nomeEl = document.getElementById(`${fileInput.id}Name`);
  if (!nomeEl) return;
  nomeEl.textContent = fileInput.files[0] ? fileInput.files[0].name : "Nenhum arquivo escolhido";
}

function openAdminModal() {
  const form = document.getElementById("addMaterialForm");
  form.reset();

  // volta as abas para o modo "arquivo" (padrão) em cada grupo
  document.querySelectorAll(".upload-tabs").forEach((group) => {
    const target = group.dataset.target;
    const fileWrap = document.getElementById(`mat${target}FileWrap`);
    const fileInput = document.getElementById(`mat${target}File`);
    const urlInput = document.getElementById(target === "Image" ? "matImage" : "matArquivoUrl");
    group.querySelectorAll(".upload-tab").forEach((t, idx) => t.classList.toggle("active", idx === 0));
    fileWrap.style.display = "";
    urlInput.style.display = "none";
    atualizarNomeArquivo(fileInput);
  });

  hideAdminAlert();
  document.getElementById("adminModalOverlay").classList.add("active");
}

function closeAdminModal() {
  document.getElementById("adminModalOverlay").classList.remove("active");
}

function showAdminAlert(message, type = "error") {
  const box = document.getElementById("adminAlertBox");
  box.textContent = message;
  box.className = `alert alert-${type}`;
}

function hideAdminAlert() {
  const box = document.getElementById("adminAlertBox");
  box.className = "alert";
  box.textContent = "";
}

async function handleAddMaterialSubmit(e) {
  e.preventDefault();
  hideAdminAlert();

  const imageFile = document.getElementById("matImageFile").files[0];
  const imageUrl = document.getElementById("matImage").value.trim();
  if (!imageFile && !imageUrl) {
    showAdminAlert("Envie uma imagem (arquivo do computador ou link).");
    return;
  }

  // FormData em vez de JSON, porque agora pode ir arquivo binário no corpo
  const formData = new FormData();
  formData.append("title", document.getElementById("matTitle").value.trim());
  formData.append("category", document.getElementById("matCategory").value.trim());
  formData.append("description", document.getElementById("matDescription").value.trim());
  formData.append("fullDescription", document.getElementById("matFullDescription").value.trim());
  formData.append("tags", document.getElementById("matTags").value.trim());

  if (imageFile) formData.append("imageFile", imageFile);
  else formData.append("image", imageUrl);

  const arquivoFile = document.getElementById("matArquivoFile").files[0];
  const arquivoUrl = document.getElementById("matArquivoUrl").value.trim();
  if (arquivoFile) formData.append("arquivoFile", arquivoFile);
  else if (arquivoUrl) formData.append("arquivoUrl", arquivoUrl);

  const submitBtn = document.getElementById("adminSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando...";

  try {
    // Sem "Content-Type" manual: o navegador define o boundary do
    // multipart/form-data sozinho quando o body é um FormData.
    const res = await fetch(`${MATERIAIS_API_BASE_URL}/materiais`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminAlert(data.message || "Não foi possível salvar o material.");
      return;
    }

    closeAdminModal();
    fetchMaterials();
  } catch (err) {
    showAdminAlert("Erro de conexão com o servidor.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Salvar material";
  }
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  fetchMaterials();
  setupUploadTabs();

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderGrid();
  });

  // Modal de detalhes
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.getElementById("modalDeleteBtn").addEventListener("click", excluirMaterialSelecionado);

  // Botão + modal de administração (só aparece para quem tem isAdmin no localStorage)
  const addBtn = document.getElementById("addMaterialBtn");
  if (isAdmin()) {
    addBtn.style.display = "inline-flex";
  }
  addBtn.addEventListener("click", openAdminModal);
  document.getElementById("adminModalClose").addEventListener("click", closeAdminModal);
  document.getElementById("adminModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "adminModalOverlay") closeAdminModal();
  });
  document.getElementById("addMaterialForm").addEventListener("submit", handleAddMaterialSubmit);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal();
    closeAdminModal();
  });
});