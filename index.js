require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const admin = require("firebase-admin");

// 🔐 Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK); // O JSON do Service Account em uma variável/secreto no Cloud Run
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔐 Middleware de verificação do Firebase Auth
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
};

// 🔧 Configuração do Mongoose (MongoDB Atlas)
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB conectado com sucesso"))
.catch((err) => {
  console.error("❌ Erro ao conectar ao MongoDB:", err);
  process.exit(1);
});

// 🔐 Configuração do Mercado Pago
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN
});

const app = express();
app.use(cors());
app.use(express.json());

// 💳 Planos disponíveis
const planos = {
  plus: { title: "Plano Plus", price: 29.9 },
  profissional: { title: "Plano Profissional", price: 59.9 }
};

// 💸 Criar checkout Mercado Pago
app.post("/criar-checkout/:plano", async (req, res) => {
  const plano = req.params.plano;

  try {
    const preferenceData = {
      items: [
        {
          title: planos[plano].title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: planos[plano].price
        }
      ],
      back_urls: {
        success: "https://marceneiro-ai.com/sucesso",
        failure: "https://marceneiro-ai.com/falha",
        pending: "https://marceneiro-ai.com/pendente"
      },
      auto_return: "approved"
    };

    const preferenceClient = new Preference(mercadopago);
    const response = await preferenceClient.create({ body: preferenceData });

    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ error: "Erro ao criar o checkout." });
  }
});

// 🌐 Rota pública
app.get("/", (req, res) => {
  res.send("🚀 Backend do MARCENEIRO.A.I está rodando!");
});

// 🔐 Rota protegida por Firebase Auth
app.get("/protegido", verifyFirebaseToken, (req, res) => {
  res.json({ message: `Bem-vindo, ${req.user.email}` });
});

// 🧱 Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

