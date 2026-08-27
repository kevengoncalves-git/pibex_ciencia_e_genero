// static/js/labxchange.js
// Tudo dentro de uma IIFE para nunca colidir com identificadores de
// materiais.js ou auth.js (já tivemos um bug assim antes com API_BASE_URL).
(function () {
  const API_BASE = "/api";

  const TYPES = ["Todos", "Simulação", "Grupo", "Vídeo", "Artigo"];

  const TYPE_CONFIG = {
    Simulação: { bg: "#1B3A6B", icon: "fa-microscope" },
    Grupo: { bg: "#0C5E7D", icon: "fa-users" },
    Vídeo: { bg: "#5B21B6", icon: "fa-play" },
    Artigo: { bg: "#155B38", icon: "fa-file-lines" },
  };

  const EMOJI_OPTIONS = [
    "🧬", "🔬", "⚗️", "🔭", "🧪", "⚡", "🧫", "🦠", "🌱", "💡",
    "🚀", "⭐", "🧲", "🌊", "🔋", "🧊", "🦋", "🌿", "🔩", "💻",
  ];

  const GRADIENT_PRESETS = [
    { from: "#1B3A6B", to: "#2563EB", label: "Azul" },
    { from: "#0C5E7D", to: "#06B6D4", label: "Ciano" },
    { from: "#1B5E40", to: "#16A34A", label: "Verde" },
    { from: "#5B21B6", to: "#9333EA", label: "Roxo" },
    { from: "#7C2D12", to: "#EA580C", label: "Laranja" },
    { from: "#0C1440", to: "#1E3A8A", label: "Noite" },
  ];

  // ---- ESTADO ----
  let allItems = [];
  let activeType = "Todos";
  let searchTerm = "";
  let selectedType = "Simulação";
  let selectedGradientIdx = 0;
  let selectedEmoji = EMOJI_OPTIONS[0];
  let itemSelecionado = null;

  // ---- AUTENTICAÇÃO (cópia local, isolada dentro da IIFE) ----
  function getUsuarioLogado() {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "null");
    } catch (err) {
      return null;
    }
  }

  function isAdminUser() {
    const usuario = getUsuarioLogado();
    return !!(usuario && usuario.isAdmin);
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  // ---- HELPERS ----
  function typeBadgeHtml(type) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["Simulação"];
    return `
      <span class="labx-type-badge" style="background:${cfg.bg};">
        <i class="fa-solid ${cfg.icon}"></i> ${escapeHtml(type.toUpperCase())}
      </span>
    `;
  }

  function getCounts() {
    const counts = { Todos: allItems.length };
    TYPES.slice(1).forEach((t) => (counts[t] = 0));
    allItems.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return counts;
  }

  function getFiltered() {
    const term = searchTerm.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesType = activeType === "Todos" || item.type === activeType;
      const matchesSearch =
        term === "" ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }

  // ---- RENDER ----
  function renderStats() {
    const el = document.getElementById("labxStats");
    el.innerHTML = `
      <div class="labx-stat">
        <div class="labx-stat-number">${allItems.length}</div>
        <div class="labx-stat-label">Total</div>
      </div>
    `;
  }

  function renderPills() {
    const counts = getCounts();
    const el = document.getElementById("labxTypePills");

    el.innerHTML = TYPES.map((type) => {
      const isActive = activeType === type;
      const cfg = type !== "Todos" ? TYPE_CONFIG[type] : null;
      const icon = cfg ? `<i class="fa-solid ${cfg.icon}"></i>` : "";
      const activeBg = cfg ? cfg.bg : "#1E3A8A";
      return `
        <button
          class="labx-pill ${isActive ? "active" : ""}"
          data-type="${escapeHtml(type)}"
          style="${isActive ? `background:${activeBg};` : ""}"
        >
          ${icon}
          ${escapeHtml(type)}
          <span class="labx-pill-count">${counts[type] || 0}</span>
        </button>
      `;
    }).join("");

    el.querySelectorAll(".labx-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeType = btn.dataset.type;
        renderPills();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const filtered = getFiltered();
    const grid = document.getElementById("labxGrid");
    const emptyState = document.getElementById("labxEmptyState");
    const resultsCount = document.getElementById("labxResultsCount");

    resultsCount.textContent =
      filtered.length === 0
        ? ""
        : `${filtered.length} ${filtered.length === 1 ? "simulação encontrada" : "simulações encontradas"}`;

    if (filtered.length === 0) {
      grid.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    grid.innerHTML = filtered
      .map(
        (item) => `
        <div class="labx-card" data-id="${item.id}">
          <div class="labx-card-thumb" style="background: linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo});">
            <span class="labx-card-emoji">${item.emoji}</span>
            ${typeBadgeHtml(item.type)}
            <div class="labx-card-x">X</div>
          </div>
          <div class="labx-card-body">
            <div class="labx-card-source"><span class="labx-dot"></span>LabXchange</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <div class="labx-card-tags">
              ${(item.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join("")}
            </div>
            <div class="labx-card-actions">
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="labx-btn-visit">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Acessar no LabXchange
              </a>
              <button class="labx-btn-delete" data-id="${item.id}" style="display:none;" title="Remover simulação">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    if (isAdminUser()) {
      grid.querySelectorAll(".labx-btn-delete").forEach((btn) => {
        btn.style.display = "flex";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          excluirItem(Number(btn.dataset.id));
        });
      });
    }
  }

  function renderAll() {
    renderStats();
    renderPills();
    renderGrid();
  }

  // ---- CARREGAR DADOS ----
  async function fetchItems() {
    try {
      const res = await fetch(`${API_BASE}/labxchange`);
      const data = await res.json();
      allItems = res.ok ? data.data || [] : [];
    } catch (err) {
      console.error("Erro ao carregar simulações LabXchange:", err);
      allItems = [];
    }
    renderAll();
  }

  // ---- EXCLUSÃO ----
  async function excluirItem(id) {
    const item = allItems.find((i) => i.id === id);
    if (!item) return;
    if (!confirm(`Remover "${item.title}"? Essa ação não pode ser desfeita.`)) return;

    try {
      const res = await fetch(`${API_BASE}/labxchange/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Não foi possível remover a simulação.");
        return;
      }

      fetchItems();
    } catch (err) {
      alert("Erro de conexão com o servidor.");
    }
  }

  // ---- MODAL DE ADMINISTRAÇÃO ----
  function renderTypeSelect() {
    const el = document.getElementById("labxTypeSelect");
    el.innerHTML = TYPES.slice(1)
      .map((t) => {
        const cfg = TYPE_CONFIG[t];
        const isSelected = selectedType === t;
        return `
          <button
            type="button"
            class="labx-type-option ${isSelected ? "active" : ""}"
            data-type="${escapeHtml(t)}"
            style="${isSelected ? `background:${cfg.bg};` : ""}"
          >
            <i class="fa-solid ${cfg.icon}"></i> ${escapeHtml(t)}
          </button>
        `;
      })
      .join("");

    el.querySelectorAll(".labx-type-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedType = btn.dataset.type;
        renderTypeSelect();
      });
    });
  }

  function renderEmojiPicker() {
    const el = document.getElementById("labxEmojiPicker");
    el.innerHTML = EMOJI_OPTIONS.map(
      (em) => `
        <button type="button" class="labx-emoji-option ${em === selectedEmoji ? "active" : ""}" data-emoji="${em}">
          ${em}
        </button>
      `
    ).join("");

    el.querySelectorAll(".labx-emoji-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedEmoji = btn.dataset.emoji;
        renderEmojiPicker();
      });
    });
  }

  function renderGradientPicker() {
    const el = document.getElementById("labxGradientPicker");
    el.innerHTML = GRADIENT_PRESETS.map(
      (p, idx) => `
        <button
          type="button"
          class="labx-gradient-option ${idx === selectedGradientIdx ? "active" : ""}"
          data-idx="${idx}"
          title="${escapeHtml(p.label)}"
          style="background: linear-gradient(135deg, ${p.from}, ${p.to});"
        ></button>
      `
    ).join("");

    el.querySelectorAll(".labx-gradient-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedGradientIdx = Number(btn.dataset.idx);
        renderGradientPicker();
      });
    });
  }

  function openAdminModal() {
    document.getElementById("addLabxForm").reset();
    selectedType = "Simulação";
    selectedGradientIdx = 0;
    selectedEmoji = EMOJI_OPTIONS[0];
    renderTypeSelect();
    renderEmojiPicker();
    renderGradientPicker();
    hideAlert();
    document.getElementById("labxUrlWarning").style.display = "none";
    document.getElementById("labxModalOverlay").classList.add("active");
  }

  function closeAdminModal() {
    document.getElementById("labxModalOverlay").classList.remove("active");
  }

  function showAlert(message) {
    const box = document.getElementById("labxAlertBox");
    box.textContent = message;
    box.className = "alert alert-error";
  }

  function hideAlert() {
    const box = document.getElementById("labxAlertBox");
    box.className = "alert";
    box.textContent = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    hideAlert();

    const url = document.getElementById("labxUrl").value.trim();
    const title = document.getElementById("labxTitle").value.trim();
    const description = document.getElementById("labxDescription").value.trim();
    const tags = document.getElementById("labxTags").value.trim();

    if (!url || !title) {
      showAlert("URL e título são obrigatórios.");
      return;
    }

    const preset = GRADIENT_PRESETS[selectedGradientIdx];
    const payload = {
      url,
      title,
      type: selectedType,
      description,
      tags,
      emoji: selectedEmoji,
      gradientFrom: preset.from,
      gradientTo: preset.to,
    };

    const submitBtn = document.getElementById("labxSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Salvando...";

    try {
      const res = await fetch(`${API_BASE}/labxchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "Não foi possível salvar a simulação.");
        return;
      }

      closeAdminModal();
      fetchItems();
    } catch (err) {
      showAlert("Erro de conexão com o servidor.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Salvar na Coleção';
    }
  }

  // ---- INIT ----
  document.addEventListener("DOMContentLoaded", () => {
    fetchItems();

    document.getElementById("labxSearchInput").addEventListener("input", (e) => {
      searchTerm = e.target.value;
      renderGrid();
    });

    document.getElementById("labxUrl").addEventListener("input", (e) => {
      const val = e.target.value.trim();
      const warning = document.getElementById("labxUrlWarning");
      warning.style.display = val.length > 0 && !val.includes("labxchange.org") ? "flex" : "none";
    });

    const addBtn = document.getElementById("labxAddBtn");
    if (isAdminUser()) {
      addBtn.style.display = "inline-flex";
    }
    addBtn.addEventListener("click", openAdminModal);

    document.getElementById("labxModalClose").addEventListener("click", closeAdminModal);
    document.getElementById("labxModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "labxModalOverlay") closeAdminModal();
    });
    document.getElementById("addLabxForm").addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAdminModal();
    });
  });
})();