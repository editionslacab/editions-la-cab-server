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
  { name: "1h1km", price: 1800, stock: false, container: "buyalan" },
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
  document.getElementById("cart-modal").style.display = "block"; 
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  renderCart();
}

function updateQuantity(name, quantity) {
  const item = cart.find(i => i.name === name);
  if (item) {
    item.quantity = Number(quantity);
    if (item.quantity <= 0) removeFromCart(name);
    saveCart();
    renderCart();
  }
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
      <b>${item.name}</b> — ${(item.price / 100).toFixed(2)}€
      <button onclick="updateQuantity('${item.name}', ${item.quantity - 1})">-</button>
      <span>${item.quantity}</span>
      <button onclick="updateQuantity('${item.name}', ${item.quantity + 1})">+</button>
      <button onclick="removeFromCart('${item.name}')">Supprimer</button>
    `;
    cartList.appendChild(li);
  });

  document.getElementById("total").textContent = (total / 100).toFixed(2);
}

// ---------------------------
// CHARGEMENT
// ---------------------------
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
    div.innerHTML = `<button class="buy" onclick="addToCart('${product.name}', ${product.price})">Ajouter au panier</button>`;
  } else {
    div.innerHTML = `<button class="buy" disabled><span style="text-decoration: line-through; color:#777;">Sold out</span></button>`;
  }

  container.appendChild(div);
}

// ---------------------------
// MODALE PANIER
// ---------------------------
const modal = document.getElementById("cart-modal");
document.getElementById("open-cart").onclick = () => modal.style.display = "block";
document.getElementById("close-cart").onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };

// ---------------------------
// STRIPE CHECKOUT
// ---------------------------
const stripe = Stripe("pk_live_**********************"); // ta clé publique

document.getElementById("checkout-button").addEventListener("click", async () => {
  if (cart.length === 0) return alert("Votre panier est vide.");

  const mode = document.querySelector('input[name="delivery-mode"]:checked');
  if (!mode) return alert("Choisissez : livraison ou retrait.");

  let address = null;

  // Si livraison → vérifier les champs
  if (mode.value === "delivery") {
    const street = document.getElementById("addr-street").value;
    const city = document.getElementById("addr-city").value;
    const zip = document.getElementById("addr-zip").value;

    if (!street || !city || !zip) {
      return alert("Veuillez remplir votre adresse.");
    }

    address = { street, city, zip };
  }

  const note = document.getElementById("order-note").value || "";

  try {
    const response = await fetch("https://editions-la-cab-server.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        mode: mode.value,
        address,
        note
      }),
    });

    const session = await response.json();

    if (session.id) {
      await stripe.redirectToCheckout({ sessionId: session.id });
    } else {
      alert("Erreur : " + session.error);
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau ou serveur.");
  }
});
