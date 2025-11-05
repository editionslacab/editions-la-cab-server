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

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({ name, price: Number(price), quantity: 1 });
  saveCart();
  renderCart();
  // ouvrir la modale automatiquement quand on ajoute un produit
  const modal = document.getElementById("cart-modal");
  if (modal) modal.style.display = "block";
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  renderCart();
}

function updateQuantity(name, qty) {
  const item = cart.find(i => i.name === name);
  if (item) {
    item.quantity = Number(qty);
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
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="flex:1"><strong>${item.name}</strong><br><small>${(item.price/100).toFixed(2)} €</small></div>
        <div>
          <button class="qty-btn" onclick="updateQuantity('${item.name}', ${item.quantity - 1})">−</button>
          <span style="margin:0 8px;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.name}', ${item.quantity + 1})">+</button>
        </div>
        <div><button onclick="removeFromCart('${item.name}')">Supprimer</button></div>
      </div>
    `;
    cartList.appendChild(li);
  });

  const totalElement = document.getElementById("total");
  if (totalElement) totalElement.textContent = (total/100).toFixed(2);

  // si le panier est vide, cacher le bouton payer
  const checkoutBtn = document.getElementById("checkout-button");
  if (checkoutBtn) checkoutBtn.style.display = cart.length ? "inline-block" : "none";
}

// afficher les produits et charger le panier au départ
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
// MODALE PANIER (avec champ note)
// ---------------------------
const modal = document.getElementById("cart-modal");
const openBtn = document.getElementById("open-cart");
const closeBtn = document.getElementById("close-cart");

if (openBtn && modal && closeBtn) {
  openBtn.addEventListener("click", () => { renderCart(); modal.style.display = "block"; });
  closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", (event) => { if (event.target === modal) modal.style.display = "none"; });
}

// injecter le champ note dans la modale (si pas déjà dans ton HTML)
(function ensureNoteField() {
  const noteContainer = document.getElementById("order-note-container");
  if (!noteContainer) {
    // on attend que la modale existe
    const modalContent = document.getElementById("cart-content") || document.getElementById("cart-modal");
    if (!modalContent) return;
    const wrapper = document.createElement("div");
    wrapper.id = "order-note-container";
    wrapper.style.marginTop = "12px";
    wrapper.innerHTML = `
      <label for="order-note"><strong>Note pour la commande (facultatif)</strong></label><br>
      <textarea id="order-note" rows="3" style="width:100%;"></textarea>
    `;
    // place avant le bouton checkout si possible
    const checkoutBtn = document.getElementById("checkout-button");
    if (checkoutBtn && checkoutBtn.parentNode) checkoutBtn.parentNode.insertBefore(wrapper, checkoutBtn);
    else if (modalContent) modalContent.appendChild(wrapper);
  }
})();

// ---------------------------
// STRIPE CHECKOUT (envoi panier + note au serveur)
// ---------------------------
// Assure-toi d'avoir chargé la librairie Stripe (https://js.stripe.com/v3/) dans ton HTML
const stripe = Stripe("pk_live_51M2vLaDzNoL5GslX1wACazqTdZ0gnzctdcP4Sp94I3e4DRncElrSKuAw0BsqfjYLYLTQIO9buU8LhhTxDAPMWQBy00lJUBSINI");

const checkoutButton = document.getElementById("checkout-button");
if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    if (!cart.length) return alert("Votre panier est vide.");

    // note
    const note = (document.getElementById("order-note") && document.getElementById("order-note").value) || "";

    try {
      const response = await fetch("https://editions-la-cab-server.onrender.com/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.name, price: Number(i.price), quantity: Number(i.quantity) })),
          note
        })
      });

      const data = await response.json();

      if (data.error) {
        alert("Erreur : " + data.error);
        console.error("Erreur server:", data);
        return;
      }

      if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        alert("Erreur inconnue lors de la création de la session.");
        console.error("Aucune session id:", data);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur.");
    }
  });
}
