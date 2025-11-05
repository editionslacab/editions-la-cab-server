// ---------------------------
// PRODUITS
// ---------------------------
const products = [
  { name: "The Art of Living Twice", price: 4500, stock: true, container: "buysimen" },
  { name: "Neu-", price: 2500, stock: true, container: "buylucas" },
  { name: "Cataracta Solis", price: 2800, stock: true, container: "buyanna" },
  { name: "Djgerard", price: 800, stock: false, container: "buydjgerard" },
  { name: "La Nuit, Tu Mens", price: 2500, stock: true, container: "buyambre" },
  { name: "On est venus ici pour la vue", price: 3500, stock: true, container: "buypautom" },
  { name: "1h1km", price: 1800, stock: false, container: "buyalan" }
];

// ---------------------------
// PANIER PERSISTANT
// ---------------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let total = 0;

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({ name, price, quantity: 1 });

  saveCart();
  renderCart();
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  renderCart();
}

function changeQuantity(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(name);
    return;
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart");
  if (!cartList) return;

  cartList.innerHTML = "";
  total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.name}</strong><br>

      <button onclick="changeQuantity('${item.name}', -1)">−</button>
      <span style="padding:0 10px;">${item.quantity}</span>
      <button onclick="changeQuantity('${item.name}', +1)">+</button>

      <button onclick="removeFromCart('${item.name}')" style="margin-left:10px;">Supprimer</button>
    `;

    cartList.appendChild(li);
  });

  const totalElement = document.getElementById("total");
  if (totalElement) totalElement.textContent = (total / 100).toFixed(2);
}

// Recharge panier au démarrage
window.addEventListener("DOMContentLoaded", () => {
  renderCart();
  products.forEach(renderProduct);
});

// ---------------------------
// AFFICHAGE PRODUITS
// ---------------------------
function renderProduct(product) {
  const container = document.getElementById(product.container);
  if (!container) return;

  const div = document.createElement("div");
  div.style.textAlign = "center";
  div.style.margin = "10px";

  if (product.stock) {
    div.innerHTML =
      `<button class="buy" onclick="addToCart('${product.name}', ${product.price})">Ajouter au panier</button>`;
  } else {
    div.innerHTML =
      `<button class="buy" disabled><span style="text-decoration: line-through; color:#777;">Sold out</span></button>`;
  }

  container.appendChild(div);
}

// ---------------------------
// MODALE
// ---------------------------
const modal = document.getElementById("cart-modal");
const openBtn = document.getElementById("open-cart");
const closeBtn = document.getElementById("close-cart");

if (openBtn && modal && closeBtn) {
  openBtn.addEventListener("click", () => {
    renderCart();
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });
}

// ---------------------------
// STRIPE CHECKOUT
// ---------------------------
const stripe = Stripe("pk_live_51M2vLaDzNoL5G...REMPLACE_Ici");

const checkoutButton = document.getElementById("checkout-button");

if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Votre panier est vide.");

    try {
      const response = await fetch("https://editions-la-cab-server.onrender.com/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          note: "" // tu pourras ajouter une zone de note plus tard
        }),
      });

      const session = await response.json();

      if (session.id) {
        await stripe.redirectToCheckout({ sessionId: session.id });
      } else {
        alert("Erreur lors de la création de la session Stripe.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur.");
    }
  });
}
