import express from "express";
import Stripe from "stripe";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ ROUTE PRINCIPALE : CRÉATION DE LA SESSION CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, shippingOption } = req.body;

    // ✅ Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: [
          "FR", "BE", "CH", "DE", "NL", "ES", "IT",
          "US", "CA",
          "BR", "AR", "MX",
          "JP", "CN", "TW"
        ]
      },
      line_items: items.map(item => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shippingOption.label,
            fixed_amount: {
              amount: shippingOption.price * 100,
              currency: "eur"
            }
          }
        }
      ],

      success_url: "https://www.editions-la-cab.com/success.html",
      cancel_url: "https://www.editions-la-cab.com/cancel.html",

      // ✅ On stocke les infos produit + livraison dans Stripe
      metadata: {
        items: JSON.stringify(items),
        shippingOption: JSON.stringify(shippingOption)
      }
    });

    // ✅ ENVOI DIRECT À ZAPIER CATCH HOOK (GRATUIT)
    try {
      await fetch("https://hooks.zapier.com/hooks/catch/25260064/us5cxxh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          items,
          shippingOption
        })
      });
    } catch (zapErr) {
      console.error("Erreur envoi Zapier :", zapErr);
    }

    // ✅ Retourne l’URL Stripe Checkout
    res.json({ url: session.url });

  } catch (err) {
    console.error("Erreur création session Stripe :", err);
    res.status(500).json({
      error: "Impossible de créer la session Stripe",
    });
  }
});

// ✅ Lancer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
