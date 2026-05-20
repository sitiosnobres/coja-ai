require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {

  try {

    const message = req.body.message;

    console.log("Mensagem recebida:", message);

    const response = await client.chat.completions.create({

      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content: "És o assistente virtual da União de Freguesias de Coja e Barril de Alva. Responde sempre em português de Portugal."
        },
        {
          role: "user",
          content: message
        }
      ]

    });

    const reply = response.choices[0].message.content;

    res.json({
      reply: reply
    });

  } catch (error) {

    console.log("ERRO:");
    console.log(error);

    res.status(500).json({
      reply: "Erro no servidor."
    });

  }

});

app.listen(3000, () => {
  console.log("Servidor IA ativo na porta 3000");
});