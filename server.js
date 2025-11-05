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

      shipping_address_collection: { allowed_countries: ["AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH",]()_


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
