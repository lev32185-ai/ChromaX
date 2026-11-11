
const homeSection = document.getElementById("homeSection");
const productSection = document.getElementById("productSection");
const palette = document.getElementById("colorPalette");
const ctx = palette.getContext("2d");
const paletteCursor = document.getElementById("paletteCursor");
const brightnessSlider = document.getElementById("brightnessSlider");
const whiteSlider = document.getElementById("whiteSlider");
const colorPreview = document.getElementById("colorPreview");
const hexCode = document.getElementById("hexCode");
const rgbCode = document.getElementById("rgbCode");
const brightnessTrack = document.getElementById("brightnessTrack");
const whiteTrack = document.querySelector(".white-track");

const paintTypes = {
  metal: {
    title: "Фарба для металу",
    prices: { 250: 159, 500: 269, 1000: 459 }
  },
  wall: {
    title: "Фарба для стін",
    prices: { 250: 89, 500: 149, 1000: 249 }
  },
  wood: {
    title: "Фарба для дерева",
    prices: { 250: 179, 500: 289, 1000: 499 }
  },
  universal: {
    title: "Універсальна фарба",
    prices: { 250: 169, 500: 279, 1000: 479 }
  }
};

let currentType = "metal";
let selectedVolume = 250;
let hue = 120;
let saturation = 100;
let brightness = 100;
let whiteMix = 0;
let selectedColor = "#00A000";
let cart = [];
let toastTimeout;
let authMode = "login";
let currentUser = null;

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", event => {
    if (event.target === overlay) overlay.classList.remove("open");
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach(modal => modal.classList.remove("open"));
  }
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function openProduct(type) {
  currentType = type;
  homeSection.classList.add("hidden");
  productSection.classList.remove("hidden");
  document.getElementById("productTitle").textContent = paintTypes[type].title;
  selectedVolume = 250;
  updateVolumeButtons();
  drawPalette();
  updateColor();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => openProduct(button.dataset.type));
});

function goHome() {
  productSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("backButton").addEventListener("click", goHome);
document.getElementById("homeButton").addEventListener("click", event => {
  event.preventDefault();
  goHome();
});
document.getElementById("homeIcon").addEventListener("click", goHome);

function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function getCurrentRgb() {
  let [r, g, b] = hsvToRgb(hue, saturation, brightness);
  const mix = whiteMix / 100;

  r = Math.round(r + (255 - r) * mix);
  g = Math.round(g + (255 - g) * mix);
  b = Math.round(b + (255 - b) * mix);

  return [r, g, b];
}

function drawPalette() {
  const width = palette.width;
  const height = palette.height;
  const image = ctx.createImageData(width, height);

  for (let x = 0; x < width; x++) {
    const currentHue = (x / (width - 1)) * 360;

    for (let y = 0; y < height; y++) {
      const currentSaturation = 100 - (y / (height - 1)) * 100;
      const [r, g, b] = hsvToRgb(currentHue, currentSaturation, brightness);

      const index = (y * width + x) * 4;
      image.data[index] = r;
      image.data[index + 1] = g;
      image.data[index + 2] = b;
      image.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  updateCursor();
}

function updateCursor() {
  paletteCursor.style.left = `${(hue / 360) * 100}%`;
  paletteCursor.style.top = `${100 - saturation}%`;
}

function updateColor() {
  const [r, g, b] = getCurrentRgb();
  selectedColor = rgbToHex(r, g, b);

  colorPreview.style.background = selectedColor;
  hexCode.value = selectedColor;
  rgbCode.textContent = `RGB: ${r}, ${g}, ${b}`;

  const fullColor = rgbToHex(...hsvToRgb(hue, saturation, 100));
  brightnessTrack.style.background = `linear-gradient(to right, #000, ${fullColor})`;
  brightnessSlider.style.setProperty("--thumb-color", selectedColor);

  const whiteColor = rgbToHex(...hsvToRgb(hue, saturation, brightness));
  whiteTrack.style.background = `linear-gradient(to right, ${whiteColor}, #fff)`;
  whiteSlider.style.setProperty("--thumb-color", selectedColor);
  paletteCursor.style.borderColor = brightness < 55 || whiteMix > 40 ? "#111" : "#fff";
}

function selectPaletteColor(event) {
  const rect = palette.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  hue = x * 360;
  saturation = (1 - y) * 100;

  updateCursor();
  updateColor();
}

let draggingPalette = false;

palette.addEventListener("pointerdown", event => {
  draggingPalette = true;
  palette.setPointerCapture(event.pointerId);
  selectPaletteColor(event);
});

palette.addEventListener("pointermove", event => {
  if (draggingPalette) selectPaletteColor(event);
});

palette.addEventListener("pointerup", () => draggingPalette = false);
palette.addEventListener("pointercancel", () => draggingPalette = false);

brightnessSlider.addEventListener("input", () => {
  brightness = Number(brightnessSlider.value);
  drawPalette();
  updateColor();
});

whiteSlider.addEventListener("input", () => {
  whiteMix = Number(whiteSlider.value);
  updateColor();
});

hexCode.addEventListener("change", () => {
  const value = hexCode.value.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    showToast("Введіть правильний HEX-код");
    updateColor();
    return;
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }

  hue = (h + 360) % 360;
  saturation = max === 0 ? 0 : (delta / max) * 100;
  brightness = max / 255 * 100;
  whiteMix = 0;

  brightnessSlider.value = brightness;
  whiteSlider.value = 0;

  drawPalette();
  updateColor();
});

document.getElementById("copyColor").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(selectedColor);
    showToast("Код кольору скопійовано");
  } catch {
    hexCode.select();
    document.execCommand("copy");
    showToast("Код кольору скопійовано");
  }
});

function updateVolumeButtons() {
  document.querySelectorAll(".volume-button").forEach(button => {
    const volume = Number(button.dataset.volume);
    button.classList.toggle("active", volume === selectedVolume);
    button.querySelector("strong").textContent = `${paintTypes[currentType].prices[volume]} ₴`;
  });

  document.getElementById("selectedPrice").textContent =
    `${paintTypes[currentType].prices[selectedVolume]} ₴`;
}

document.querySelectorAll(".volume-button").forEach(button => {
  button.addEventListener("click", () => {
    selectedVolume = Number(button.dataset.volume);
    updateVolumeButtons();
  });
});

document.getElementById("addToCart").addEventListener("click", () => {
  cart.push({
    id: Date.now() + Math.random(),
    type: currentType,
    title: paintTypes[currentType].title,
    volume: selectedVolume,
    color: selectedColor,
    price: paintTypes[currentType].prices[selectedVolume],
    quantity: 1
  });

  updateCart();
  showToast("Товар додано до кошика");
});

function formatVolume(volume) {
  return volume === 1000 ? "1 л" : `${volume} мл`;
}

function updateCart() {
  const container = document.getElementById("cartItems");
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = `${total} ₴`;
  document.getElementById("checkoutTotal").textContent = `${total} ₴`;
  document.getElementById("checkoutButton").disabled = cart.length === 0;

  if (!cart.length) {
    container.innerHTML = `<div class="empty-cart"><span>🛒</span>Твій кошик поки порожній</div>`;
    return;
  }

  container.innerHTML = cart.map(item => `
    <article class="cart-item">
      <div class="cart-color" style="background:${item.color}"></div>
      <div class="cart-item-info">
        <strong>${item.title}</strong>
        <small>${formatVolume(item.volume)} · ${item.color}</small>
        <div class="cart-item-actions">
          <button class="quantity-button" data-action="minus" data-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button class="quantity-button" data-action="plus" data-id="${item.id}">+</button>
          <button class="remove-button" data-action="remove" data-id="${item.id}">Видалити</button>
        </div>
      </div>
      <div class="cart-item-price">${item.price * item.quantity} ₴</div>
    </article>
  `).join("");
}

document.getElementById("cartItems").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const item = cart.find(product => product.id === id);
  if (!item) return;

  if (button.dataset.action === "plus") item.quantity++;
  if (button.dataset.action === "minus") item.quantity--;

  if (button.dataset.action === "remove" || item.quantity <= 0) {
    cart = cart.filter(product => product.id !== id);
  }

  updateCart();
});

document.getElementById("cartButton").addEventListener("click", () => {
  updateCart();
  openModal("cartModal");
});

document.getElementById("checkoutButton").addEventListener("click", () => {
  if (!cart.length) return;
  closeModal("cartModal");
  openModal("checkoutModal");
});

function updateAuthView() {
  const form = document.getElementById("authForm");
  const accountInfo = document.getElementById("accountInfo");
  const switchArea = document.querySelector(".auth-switch");

  if (currentUser) {
    form.classList.add("hidden");
    switchArea.classList.add("hidden");
    accountInfo.classList.remove("hidden");

    document.getElementById("accountName").textContent = currentUser.name;
    document.getElementById("accountEmail").textContent = currentUser.email;
    document.getElementById("accountAvatar").textContent =
      currentUser.name.charAt(0).toUpperCase();
    return;
  }

  form.classList.remove("hidden");
  switchArea.classList.remove("hidden");
  accountInfo.classList.add("hidden");

  const isRegister = authMode === "register";

  document.getElementById("authTitle").textContent =
    isRegister ? "Створення акаунта" : "Вхід в акаунт";

  document.getElementById("authSubtitle").textContent =
    isRegister ? "Приєднуйся до ChromaX!" : "Раді бачити тебе знову!";

  document.getElementById("authSubmit").textContent =
    isRegister ? "Зареєструватися" : "Увійти";

  document.getElementById("authSwitchText").textContent =
    isRegister ? "Вже маєш акаунт?" : "Ще не маєш акаунта?";

  document.getElementById("authSwitchButton").textContent =
    isRegister ? "Увійти" : "Зареєструватися";

  document.getElementById("nameField").classList.toggle("hidden", !isRegister);
  document.getElementById("confirmPasswordField").classList.toggle("hidden", !isRegister);
  document.getElementById("authError").textContent = "";
}

function openAuth() {
  const savedUser = localStorage.getItem("chromaxCurrentUser");
  currentUser = savedUser ? JSON.parse(savedUser) : null;
  authMode = "login";
  updateAuthView();
  openModal("authModal");
}

document.getElementById("profileButton").addEventListener("click", openAuth);

document.getElementById("authSwitchButton").addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  document.getElementById("authForm").reset();
  updateAuthView();
});

document.getElementById("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const password = document.getElementById("authPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const error = document.getElementById("authError");

  error.textContent = "";

  if (authMode === "register") {
    if (name.length < 2) {
      error.textContent = "Введіть ім'я (мінімум 2 символи).";
      return;
    }

    if (password.length < 6) {
      error.textContent = "Пароль має містити щонайменше 6 символів.";
      return;
    }

    if (password !== confirmPassword) {
      error.textContent = "Паролі не збігаються.";
      return;
    }

    const users = JSON.parse(localStorage.getItem("chromaxUsers") || "[]");

    if (users.some(user => user.email === email)) {
      error.textContent = "Акаунт з такою поштою вже існує.";
      return;
    }

    const user = { name, email, password };
    users.push(user);
    localStorage.setItem("chromaxUsers", JSON.stringify(users));

    currentUser = { name, email };
    localStorage.setItem("chromaxCurrentUser", JSON.stringify(currentUser));

    updateAuthView();
    showToast("Акаунт успішно створено!");
    return;
  }

  const users = JSON.parse(localStorage.getItem("chromaxUsers") || "[]");
  const user = users.find(item => item.email === email && item.password === password);

  if (!user) {
    error.textContent = "Неправильна пошта або пароль.";
    return;
  }

  currentUser = { name: user.name, email: user.email };
  localStorage.setItem("chromaxCurrentUser", JSON.stringify(currentUser));

  updateAuthView();
  showToast("Вітаємо! Ви увійшли.");
});

document.getElementById("logoutButton").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("chromaxCurrentUser");
  authMode = "login";
  updateAuthView();
  showToast("Ви вийшли з акаунта");
});

document.getElementById("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  const recipient = document.getElementById("recipientName").value.trim();
  const phone = document.getElementById("recipientPhone").value.trim();
  const payment = document.querySelector('input[name="payment"]:checked');
  const delivery = document.querySelector('input[name="delivery"]:checked');
  const address = document.getElementById("deliveryAddress").value.trim();

  if (!recipient || !phone || !payment || !delivery || !address) {
    showToast("Будь ласка, заповніть усі поля");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  closeModal("checkoutModal");

  alert(
    "Дякуємо за замовлення!\n\n" +
    `Отримувач: ${recipient}\n` +
    `Телефон: ${phone}\n` +
    `Оплата: ${payment.value}\n` +
    `Доставка: ${delivery.value}\n` +
    `Адреса: ${address}\n` +
    `Сума: ${total} ₴\n\n` +
    "Це демонстраційне замовлення. Воно ще не передане магазину."
  );

  cart = [];
  updateCart();
  event.target.reset();
});

drawPalette();
updateColor();
updateVolumeButtons();
updateCart();
