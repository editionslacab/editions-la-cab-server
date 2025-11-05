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
  { name: "test", price: 100, stock: true, container: "buytest" },
  { name: "1h1km", price: 1800, stock: false, container: "buyalan" }
];

// ---------------------------
// PANIER (localStorage)
// ---------------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.quantity++;
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
  if (item.quantity <= 0) removeFromCart(name);

  saveCart();
  renderCart();
}

// ---------------------------
// AFFICHAGE DU PANIER
// ---------------------------
function renderCart() {
  const cartList = document.getElementById("cart");
  const totalElement = document.getElementById("total");
  if (!cartList || !totalElement) return;

  cartList.innerHTML = "";
  let total = 0;

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

  totalElement.textContent = (total / 100).toFixed(2);
}

// ---------------------------
// AFFICHAGE DES PRODUITS
// ---------------------------
function renderProduct(product) {
  const container = document.getElementById(product.container);
  if (!container) return;

  const div = document.createElement("div");
  div.style.textAlign = "center";

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
// MODALE PANIER
// ---------------------------
const modal = document.getElementById("cart-modal");
const openBtn = document.getElementById("open-cart");
const closeBtn = document.getElementById("close-cart");

if (openBtn && modal) {
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
const stripe = Stripe("pk_live_51M2vLaDzNoL5GslX1wACazqTdZ0gnzctdcP4Sp94I3e4DRncElrSKuAw0BsqfjYLYLTQIO9buU8LhhTxDAPMWQBy00lJUBSINI");

const checkoutButton = document.getElementById("checkout-button");

if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    try {
      const response = await fetch("https://editions-la-cab-server.onrender.com/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, note: "" })
      });

      const data = await response.json();

      if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        alert("Erreur lors de la création de la session Stripe.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur.");
    }
  });
}

// ---------------------------
// LANCEMENT AU CHARGEMENT
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  products.forEach(renderProduct); // ✅ tu utilises bien ton HTML
  renderCart();
});
