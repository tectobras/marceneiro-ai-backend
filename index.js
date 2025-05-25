require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB conectado com sucesso"))
.catch((err) => {
  console.error("❌ Erro ao conectar ao MongoDB:", err);
  process.exit(1);
});

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN
});

const app = express();
app.use(cors());
app.use(express.json());

const planos = {
  plus: { title: "Plano Plus", price: 29.9 },
  profissional: { title: "Plano Profissional", price: 59.9 }
};

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

app.get("/", (req, res) => {
  res.send("🚀 Backend do MARCENEIRO.A.I está rodando!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


