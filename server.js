import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ["https://editionslacab.com", "http://editionslacab.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, mode, address, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    let shippingCost = 0;

    if (mode === "delivery") {
      shippingCost = 700; // 7€
    }

    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Number(item.price) + (mode === "delivery" ? shippingCost : 0),
      },
      quantity: Number(item.quantity),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",

      // note visible dans Stripe
      metadata: {
        note: note || "",
        mode,
        address: address ? JSON.stringify(address) : "",
      },

      shipping_address_collection: mode === "delivery"
        ? { allowed_countries: ["FR"] }
        : undefined,
    });

    res.json({ id: session.id });

  } catch (err) {
    console.error("Erreur Stripe :", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Serveur Stripe démarré")
);
