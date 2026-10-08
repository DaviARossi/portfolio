"use strict";

let savedTheme = null;

try {
  savedTheme = localStorage.getItem("davi-theme");
} catch {}

document.documentElement.dataset.theme =
  ["light", "dark"].includes(savedTheme) ? savedTheme : "dark";

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");

  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (!digits) return "";
  if (digits.length <= 2) return "(" + digits;

  const number = digits.slice(2);
  const split = digits.length === 11 ? 5 : 4;

  return (
    "(" + digits.slice(0, 2) + ") " +
    number.slice(0, split) +
    (number.length > split ? "-" + number.slice(split) : "")
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const $ = selector => document.querySelector(selector);
  const root = document.documentElement;
  const theme = $("#theme-toggle");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function updateThemeButton() {
    const dark = root.dataset.theme === "dark";

    theme.textContent = dark ? "☀" : "☾";
    theme.setAttribute(
      "aria-label",
      dark ? "Ativar modo claro" : "Ativar modo escuro"
    );
  }

  updateThemeButton();

  theme.addEventListener("click", () => {
    root.dataset.theme =
      root.dataset.theme === "dark" ? "light" : "dark";

    try {
      localStorage.setItem("davi-theme", root.dataset.theme);
    } catch {}

    updateThemeButton();
  });

  const menuButton = $("#menu-toggle");
  const menu = $("#nav-links");

  root.classList.add("menu-ready");
  menuButton.hidden = false;

  function closeMenu() {
    menu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
  }

  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Fechar menu" : "Abrir menu"
    );
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  matchMedia("(max-width: 760px)")
    .addEventListener("change", closeMenu);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      closeMenu();
      menuButton.focus();
    }
  });

  const typed = $("#typed");
  const phrase = "interfaces com propósito.";

  let typingTimer;
  let position = 0;

  function typeText() {
    typed.textContent = phrase.slice(0, position++);

    if (position <= phrase.length) {
      typingTimer = setTimeout(typeText, 60);
    }
  }

  if (!motion.matches) typeText();

  const blocks = document.querySelectorAll(".reveal");
  let observer;

  if (!motion.matches && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    blocks.forEach(block => {
      block.classList.add("pending");
      observer.observe(block);
    });
  }

  motion.addEventListener("change", event => {
    if (event.matches) {
      clearTimeout(typingTimer);
      typed.textContent = phrase;
      observer?.disconnect();

      blocks.forEach(block => {
        block.classList.remove("pending");
      });
    }
  });

  document.addEventListener("focusin", event => {
    event.target.closest(".reveal")?.classList.remove("pending");
  });

  const modal = $("#modal");
  let returnFocus = null;
  let draft = "";

  function openModal(title, intro, content, contact = false) {
    returnFocus = document.activeElement;

    $("#modal-title").textContent = title;
    $("#modal-intro").textContent = intro;
    $("#modal-content").textContent = content;
    $("#email-draft").hidden = !contact;
    $("#copy-message").hidden = !contact;
    $("#copy-status").textContent = "";

    modal.showModal();
    document.body.classList.add("modal-open");
  }

  $("#close-modal").addEventListener("click", () => modal.close());

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    returnFocus?.focus();
  });

  modal.addEventListener("click", event => {
    const box = modal.getBoundingClientRect();

    if (
      event.target === modal &&
      (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
    ) {
      modal.close();
    }
  });

  $("#project-details").addEventListener("click", () => {
    openModal(
      "Portfólio pessoal",
      "Uma apresentação profissional para a web.",
      "HTML: estrutura semântica e formulário.\n" +
      "CSS: responsividade, temas e transições.\n" +
      "JavaScript: máscara, validação, modal, digitação e animação ao rolar.\n\n" +
      "O projeto funciona sem instalar bibliotecas. O contato prepara um e-mail; " +
      "o visitante conclui o envio no aplicativo de e-mail."
    );
  });

  const form = $("#contact-form");
  const phone = $("#phone");

  const fields = ["name", "phone", "email", "message"].map(id => {
    return $("#" + id);
  });

  form.noValidate = true;

  phone.addEventListener("input", () => {
    const raw = phone.value;
    const start = phone.selectionStart ?? raw.length;
    const atEnd = start === raw.length;
    const digitsBefore = raw.slice(0, start).replace(/\D/g, "").length;

    phone.value = formatPhone(raw);

    let caret = 0;
    let count = 0;

    while (caret < phone.value.length && count < digitsBefore) {
      if (/\d/.test(phone.value[caret])) count++;
      caret++;
    }

    if (atEnd) caret = phone.value.length;
    phone.setSelectionRange(caret, caret);
  });

  phone.addEventListener("paste", event => {
    const text = event.clipboardData?.getData("text") || "";
    const digits = text.replace(/\D/g, "");

    if (
      (digits.length === 12 || digits.length === 13) &&
      digits.startsWith("55")
    ) {
      event.preventDefault();
      phone.value = formatPhone(text);
      phone.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  function validate(field) {
    const value = field.value.trim();
    let error = "";

    if (!value) {
      error = "Preencha este campo.";
    } else if (field.id === "name" && value.length < 2) {
      error = "Informe um nome com pelo menos 2 caracteres.";
    } else if (field.id === "phone") {
      const digits = value.replace(/\D/g, "");

      if (
        !/^[1-9]{2}\d{8,9}$/.test(digits) ||
        /^(\d)\1+$/.test(digits)
      ) {
        error = "Informe um telefone com DDD e 10 ou 11 dígitos.";
      }
    } else if (field.id === "email") {
      field.value = value;

      if (
        field.validity.typeMismatch ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        error = "Informe um e-mail válido.";
      }
    } else if (field.id === "message" && value.length < 10) {
      error = "Escreva pelo menos 10 caracteres.";
    }

    field.setAttribute("aria-invalid", String(Boolean(error)));
    $("#" + field.id + "-error").textContent = error;

    return !error;
  }

  fields.forEach(field => {
    field.addEventListener("blur", () => validate(field));

    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) validate(field);
      $("#form-status").textContent = "";
    });
  });

  $("#message").addEventListener("input", event => {
    $("#message-count").textContent =
      event.target.value.length + " / 2000";
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const invalid = fields.filter(field => !validate(field));

    if (invalid.length) {
      $("#form-status").textContent = "Revise os campos indicados.";
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(
      fields.map(field => [field.id, field.value.trim()])
    );

    draft =
      "Nome: " + data.name +
      "\nTelefone: " + data.phone +
      "\nE-mail: " + data.email +
      "\n\n" + data.message;

    $("#email-draft").href =
      "mailto:davirossi09@outlook.com?subject=" +
      encodeURIComponent("Contato pelo portfólio — " + data.name) +
      "&body=" + encodeURIComponent(draft);

    openModal(
      "Revise sua mensagem.",
      "A mensagem ainda não foi enviada. Abra seu aplicativo de e-mail para concluir.",
      draft,
      true
    );
  });

  $("#copy-message").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(draft);
      $("#copy-status").textContent = "Mensagem copiada.";
    } catch {
      $("#copy-status").textContent =
        "Selecione e copie manualmente o texto acima.";
    }
  });

  $("#year").textContent = new Date().getFullYear();
});