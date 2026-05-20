require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fetch = require("node-fetch");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
async function pesquisarSite(pergunta) {

    try {

        const url = `https://www.googleapis.com/customsearch/v1?q=site:cojaebarrildealva.pt ${encodeURIComponent(pergunta)}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

        const response = await fetch(url);

        const data = await response.json();

        if (!data.items) {
            return "Não foram encontrados conteúdos relevantes no site.";
        }

        let resultados = "";

        data.items.slice(0, 3).forEach((item, index) => {

            resultados += `
Resultado ${index + 1}:
Título: ${item.title}
Link: ${item.link}
Resumo: ${item.snippet}

`;

        });

        return resultados;

    } catch (erro) {

        console.error(erro);

        return "Erro ao pesquisar o site.";
    }
}

app.post("/chat", async (req, res) => {

  try {

    const message = req.body.message;
    const resultadosSite = await pesquisarSite(message);

    console.log("Mensagem recebida:", message);

    const response = await client.chat.completions.create({

      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content: `És o assistente virtual oficial da União de Freguesias de Coja e Barril de Alva.

Responde sempre em português de Portugal.

Usa prioritariamente os conteúdos encontrados no site oficial.

Se não encontrares informação no site, diz claramente que não encontraste informação oficial disponível.

Nunca inventes respostas.

Resultados encontrados no site:

${resultadosSite}
`
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
