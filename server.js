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

        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(pergunta)}&num=5&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

        const response = await fetch(url);

        const data = await response.json();
      console.log(JSON.stringify(data, null, 2));

        if (!data.items || data.items.length === 0) {

    const respostaAlternativa = await fetch(
        `https://cojaebarrildealva.pt/?s=${encodeURIComponent(pergunta)}`
    );

    const html = await respostaAlternativa.text();

    return `Foram encontrados resultados diretamente no motor de pesquisa interno do site sobre: ${pergunta}`;
}

        let resultados = "";

        data.items.slice(0, 3).forEach((item, index) => {

            resultados += `
Resultado ${index + 1}:
Título: ${item.title}
Link HTML: <a href="${item.link}" target="_blank">${item.link}</a>
Resumo: ${item.snippet}

Abrir página:
<a href="${item.link}" target="_blank">${item.link}</a>

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

Usa os resultados encontrados no site oficial para responder.

Se existirem resultados encontrados, responde SEMPRE com base nesses resultados.

Nunca digas que não encontraste informação se existirem resultados.

Resume os conteúdos encontrados de forma clara e útil.

Se houver links relevantes, menciona-os.

Se realmente não existirem resultados, então informa que não foi encontrada informação oficial.

Resultados encontrados no site:

${resultadosSite}
`
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
