// ---------------------------
// PRODUITS
// ---------------------------
const products = [
  { name: "The Art of Living Twice", price: 45, stock: true, container: "buysimen" },
  { name: "Neu-", price: 25, stock: true, container: "buylucas" },
  { name: "Cataracta Solis", price: 28, stock: true, container: "buyanna" },
  { name: "Djgerard", price: 8, stock: false, container: "buydjgerard" },
  { name: "La Nuit, Tu Mens", price: 25, stock: true, container: "buyambre" },
  { name: "On est venus ici pour la vue", price: 35, stock: true, container: "buypautom" },
  { name: "test", price: 1, stock: true, container: "buytest" },
  { name: "1h1km", price: 18, stock: false, container: "buyalan" }
];

// ---------------------------
// PANIER
// ---------------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

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
// AFFICHAGE PANIER
// ---------------------------
function renderCart() {
  const cartList = document.getElementById("cart");
  const totalElement = document.getElementById("total");

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

  totalElement.textContent = total.toFixed(2);
}

// ---------------------------
// AFFICHAGE PRODUITS
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
// STRIPE CHECKOUT
// ---------------------------
const checkoutButton = document.getElementById("checkout-button");

checkoutButton.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Votre panier est vide");
    return;
  }

  const shippingOption = {
    label: document.querySelector("input[name='shipping']:checked").dataset.label,
    price: parseFloat(document.querySelector("input[name='shipping']:checked").value)
  };

  const response = await fetch("https://editions-la-cab-server.onrender.com/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart, shippingOption })
  });

  const data = await response.json();
  window.location.href = data.url; // ✅ redirection directe
});

// ---------------------------
// CHARGEMENT
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  products.forEach(renderProduct);
  renderCart();
});
