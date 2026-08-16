// static/js/auth.js

const API_BASE_URL = "/api"; // backend no mesmo domínio do Flask (troque para
                              // "http://localhost:5000/api" se o front rodar em outra origem

function showAlert(message, type = "error") {
  const box = document.getElementById("alertBox");
  if (!box) return;
  box.textContent = message;
  box.className = `alert alert-${type}`;
}

function hideAlert() {
  const box = document.getElementById("alertBox");
  if (box) box.className = "alert";
}

function setLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = loading ? "Aguarde..." : button.dataset.originalText;
}

// ---- CADASTRO ----
const cadastroForm = document.getElementById("cadastroForm");
if (cadastroForm) {
  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha.length < 6) {
      showAlert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      showAlert("As senhas não coincidem.");
      return;
    }

    const submitBtn = document.getElementById("submitBtn");
    setLoading(submitBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 'confirmarSenha' NÃO é enviado: o backend só espera nome, email e senha
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "Não foi possível concluir o cadastro.");
        return;
      }

      showAlert("Cadastro realizado com sucesso! Redirecionando para o login...", "success");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err) {
      showAlert("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---- LOGIN ----
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    const submitBtn = document.getElementById("submitBtn");
    setLoading(submitBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "E-mail ou senha incorretos.");
        return;
      }

      // Guarda o token para autenticar as próximas requisições.
      // Use sessionStorage no lugar de localStorage se preferir que o
      // login não persista após fechar a aba.
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("usuario", JSON.stringify(data.data.usuario));

      window.location.href = "/home";
    } catch (err) {
      showAlert("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---- ESTADO DE LOGIN NA NAVBAR ----
// Troca "Entrar / Inscreva-se" por "Olá, <primeiro nome>" quando já
// existe um usuário logado (usado em home.html, materiais.html, etc.)
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/home";
}

function renderAuthNav() {
  const navActions = document.getElementById("navActions");
  if (!navActions) return;

  const usuarioRaw = localStorage.getItem("usuario");
  const token = localStorage.getItem("token");
  if (!usuarioRaw || !token) return; // mantém Entrar / Inscreva-se

  let usuario;
  try {
    usuario = JSON.parse(usuarioRaw);
  } catch (err) {
    return; // dado corrompido no localStorage, ignora
  }

  const primeiroNomeRaw = (usuario.nome || "").trim().split(" ")[0] || "usuário";
  const div = document.createElement("div");
  div.textContent = primeiroNomeRaw;
  const primeiroNome = div.innerHTML; // escapado

  navActions.innerHTML = `
    <span class="nav-greeting">Olá, ${primeiroNome}</span>
    <button type="button" class="btn-logout" id="logoutBtn">Sair</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", renderAuthNav);