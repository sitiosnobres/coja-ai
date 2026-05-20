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

        // PESQUISA GOOGLE CUSTOM SEARCH
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(pergunta)}&num=5&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

        const response = await fetch(url);

        const data = await response.json();

        console.log("RESULTADOS GOOGLE:");
        console.log(JSON.stringify(data, null, 2));

        let resultados = "";

        // RESULTADOS GOOGLE
        if (data.items && data.items.length > 0) {

            data.items.slice(0, 3).forEach((item, index) => {

                resultados += `
Resultado ${index + 1}:

Título:
${item.title}

Link:
${item.link}

Resumo:
${item.snippet}

`;

            });

        }

        // FALLBACK HTML DO SITE
        const paginas = [
            "https://cojaebarrildealva.pt",
            "https://cojaebarrildealva.pt/category/noticias/",
            "https://cojaebarrildealva.pt/publicacoes-oficiais/",
            "https://cojaebarrildealva.pt/espaco-do-cidadao/",
            "https://cojaebarrildealva.pt/secretaria-online/"
        ];

        let encontrou = false;

        for (const pagina of paginas) {

            try {

                const respostaSite = await fetch(pagina);

                const html = await respostaSite.text();

                const htmlNormalizado = html
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                const perguntaNormalizada = pergunta
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                if (htmlNormalizado.includes(perguntaNormalizada)) {

                    resultados += `
Foi encontrada referência a "${pergunta}" na página:
${pagina}

`;

                    encontrou = true;

                }

            } catch (e) {

                console.log("Erro ao verificar página:", pagina);

            }

        }

        // SE ENCONTROU REFERÊNCIAS
        if (encontrou) {

            return resultados;

        }

        // SEM RESULTADOS
        if (!resultados.trim()) {

            return `Não foram encontrados resultados oficiais sobre "${pergunta}".`;

        }

        return resultados;

    } catch (erro) {

        console.error("ERRO AO PESQUISAR SITE:");
        console.error(erro);

        return "Erro ao pesquisar o site.";

    }

}

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        console.log("Mensagem recebida:", message);

        const resultadosSite = await pesquisarSite(message);

        console.log("RESULTADOS FINAIS:");
        console.log(resultadosSite);

        const response = await client.chat.completions.create({

            model: "gpt-3.5-turbo",

            messages: [

                {
                    role: "system",
                    content: `
És o assistente virtual oficial da União de Freguesias de Coja e Barril de Alva.

Responde sempre em português de Portugal.

Usa SEMPRE os resultados encontrados no site oficial.

Se existirem resultados encontrados, responde obrigatoriamente com base nesses resultados.

Nunca digas que não encontraste informação se existirem resultados.

Resume os conteúdos encontrados de forma clara, útil e amigável.

Se existirem links relevantes, menciona-os.

Se realmente não existirem resultados, então informa claramente que não foi encontrada informação oficial disponível.

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

        console.log("ERRO NO SERVIDOR:");
        console.log(error);

        res.status(500).json({
            reply: "Erro no servidor."
        });

    }

});

app.listen(3000, () => {

    console.log("Servidor IA ativo na porta 3000");

});
