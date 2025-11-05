import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// -----------------------------
// ✅ CORS
// -----------------------------
app.use(
  cors({
    origin: ["https://editionslacab.com", "https://www.editionslacab.com"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.options("*", cors());
app.use(express.json());

// -----------------------------
// ✅ Stripe
// -----------------------------
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ ERREUR : STRIPE_SECRET_KEY manquante");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

// -----------------------------
// ✅ Liste des pays valides Stripe
const ALLOWED_COUNTRIES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AR","AS","AT","AU","AW","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BM","BN","BO","BR","BS",
  "BT","BW","BY","BZ","CA","CD","CF","CG","CH","CI","CL","CM","CN","CO",
  "CR","CU","CV","CW","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
  "EG","ER","ES","ET","FI","FJ","FM","FR","GA","GB","GD","GE","GF","GG",
  "GH","GI","GL","GM","GN","GP","GQ","GR","GT","GU","GW","GY","HK","HN",
  "HR","HT","HU","ID","IE","IL","IM","IN","IQ","IR","IS","IT","JE","JM",
  "JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KZ","LA","LB",
  "LC","LI","LK","LR","LS","LT","LU","LV","MA","MC","MD","ME","MF","MG",
  "MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW",
  "MX","MY","MZ","NA","NC","NE","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PT","PW","PY","QA",
  "RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SK","SL",
  "SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TG","TH",
  "TN","TO","TR","TT","TV","TZ","UA","UG","US","UY","UZ","VC","VE","VG",
  "VI","VN","VU","WS","YE","ZA","ZM","ZW"
];

// -----------------------------
// ✅ Créer la session Checkout complète
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Construction sécurisée des articles
    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price)), // en centimes
      },
      quantity: Math.max(1, Number(item.quantity)),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "https://www.editionslacab.com/success.html",
      cancel_url: "https://www.editionslacab.com/cancel.html",
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
      shipping_options: [
        { shipping_rate: "shr_1SQ71YDzNoL5GslXBZHwg8c5" }, // livraison
        { shipping_rate: "shr_1SQ7jfDzNoL5GslXr5lJVyDM" }, // retrait
      ],
      metadata: {
        note: note || "",
        items: JSON.stringify(items.map(i => ({ name: i.name, qty: i.quantity }))),
      },
    });

    return res.json({ id: session.id });

  } catch (err) {
    console.error("❌ Erreur Stripe :", err.message);
    console.error("❌ Détails complets :", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// ✅ Route test
app.get("/", (req, res) => res.send("✅ Stripe server running"));

// -----------------------------
// ✅ Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
