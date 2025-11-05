import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// -----------------------------
// ✅ CORS (IMPORTANT pour Render)
// -----------------------------
app.use(cors({
  origin: ["https://editionslacab.com", "https://www.editionslacab.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Corrige le preflight OPTIONS
app.options("*", cors());

app.use(express.json());

// -----------------------------
// ✅ Stripe
// -----------------------------
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ ERREUR : STRIPE_SECRET_KEY manquante");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// -----------------------------
// ✅ Créer la session Checkout
// -----------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Construire les articles
    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
        },
        unit_amount: Number(item.price),
      },
      quantity: Number(item.quantity),
    }));

    // ✅ Crée la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",

      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",

      shipping_address_collection: {
        allowed_countries: ["FR"],
      },

      shipping_options: [
        { shipping_rate: "shr_1SQ71YDzNoL5GslXBZHwg8c5" }, // ✅ Remplace par ton ID livraison 7€
        { shipping_rate: "shr_1SQ7jfDzNoL5GslXr5lJVyDM" }, // ✅ Remplace par ton ID retrait 0€
      ],

      metadata: {
        note: note || "",
        items: JSON.stringify(items.map(i => ({ name: i.name, qty: i.quantity }))),
      },
    });

    return res.json({ id: session.id });

  } catch (err) {
    console.error("❌ Erreur Stripe :", err);
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// ✅ Route test
// -----------------------------
app.get("/", (req, res) => {
  res.send("✅ Stripe server running");
});

// -----------------------------
// ✅ Démarrage serveur
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
