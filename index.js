const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const mercadopago = new MercadoPagoConfig({
  accessToken: "APP_USR-5342420837637999-110116-9d289b7d9e2ec869ce628cdb7deeb26d-96300839"
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
  res.send("Servidor do MARCENEIRO.A.I rodando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
