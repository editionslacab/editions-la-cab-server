import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// CORS
app.use(cors({
  origin: ["https://editionslacab.com", "https://www.editionslacab.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ ROUTE CHECKOUT
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
          description: note ? `Note client : ${note}` : undefined,
        },
        unit_amount: Number(item.price),
      },
      quantity: Number(item.quantity),
    }));

    // ✅ CRÉATION SESSION CHECKOUT AVEC SHIPPING
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",

      // Adresse obligatoire pour tarif de livraison
      shipping_address_collection: {
        allowed_countries: ["FR"],
      },

      // ✅ OBLIGATOIRE pour voir "Livraison / Retrait" sur Stripe Checkout
      shipping_options: [
        { shipping_rate: "shr_1SQ71YDzNoL5GslXBZHwg8c5" }, // Livraison 7€
        { shipping_rate: "shr_1SQ73RDzNoL5GslXpcWpUPif" }, // Retrait 0€
      ],

      // URLs
      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",

      // Metadata utiles
      metadata: {
        note: note || "",
        items: JSON.stringify(items),
      },
    });

    res.json({ id: session.id });

  } catch (err) {
    console.error("Erreur create-checkout-session:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route test
app.get("/", (req, res) => res.send("Stripe server running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
