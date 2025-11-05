import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// CORS : autorise ton domaine (ajoute d'autres variantes si besoin)
app.use(cors({
  origin: ["https://editionslacab.com", "https://www.editionslacab.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// create checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Construire les line_items à partir du panier (prix en centimes)
    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          // description affichée dans Stripe : ici on ajoute la note (optionnel)
          description: note ? `Note client : ${note}` : undefined,
        },
        unit_amount: Number(item.price),
      },
      quantity: Number(item.quantity),
    }));

    // Création de la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",

      // URL de redirection (ajuste si nécessaire)
      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",

      // Metadata pour retrouver la note et le panier côté vendeur
      metadata: {
        note: note || "",
        items: JSON.stringify(items.map(i => ({ name: i.name, price: i.price, qty: i.quantity }))),
      },

      // Demande à Stripe de collecter l'adresse si le client choisit Livraison et
      // d'afficher les tarifs de livraison que tu as configurés dans le Dashboard.
      shipping_address_collection: { allowed_countries: ["FR"] },
      // NOTE:
      // Les "Tarifs de livraison" que tu as créés dans Stripe apparaîtront sur la page Checkout.
      // Stripe affichera aussi l'option de retrait (0€) si tu l'as créée.
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Erreur create-checkout-session:", err);
    res.status(500).json({ error: err.message || "Erreur serveur" });
  }
});

app.get("/", (req, res) => res.send("Stripe server running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
