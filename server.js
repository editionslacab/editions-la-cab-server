// server.js
import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// === METS ICI TA CLE SECRETE STRIPE ===
const stripe = new Stripe("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"); // <-- Ta clé secrète

// Route pour créer la session Stripe
app.post("/create-checkout-session", async (req, res) => {
  console.log("Requête reçue :", req.body);
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Préparation des produits pour Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: item.price, // en centimes
      },
      quantity: item.quantity,
    }));

    // Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Erreur Stripe :", err);
    res.status(500).json({ error: err.message });
  }
});

// Démarrage du serveur
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
