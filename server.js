// ---------------------------
// server.js
// ---------------------------
import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// ✅ Autorise ton site à communiquer avec ton API Render
app.use(cors({
  origin: ["https://www.editionslacab.com", "https://editionslacab.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Permet à Express de traiter le JSON
app.use(express.json());

// ✅ Clé secrète Stripe (Render Environment Variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Gère explicitement les requêtes OPTIONS pour tous les endpoints
app.options("*", cors());

// ---------------------------
// Route Stripe Checkout
// ---------------------------
app.post("/create-checkout-session", async (req, res) => {
  console.log("Requête reçue :", req.body);

  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Number(item.price), // montant en centimes
      },
      quantity: Number(item.quantity),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------
// Lancement du serveur
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Serveur Stripe en ligne sur le port " + PORT);
});
