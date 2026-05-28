require("dotenv").config();
const fs = require("fs");

const config = JSON.parse(
  fs.readFileSync("./config.json", "utf8")
);

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

// =========================
// PESQUISAR SITE
// =========================

async function pesquisarSite(pergunta) {

    try {

        const perguntaNormalizada = pergunta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        let resultados = "";

        // GOOGLE CUSTOM SEARCH
        const urlGoogle =
            `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(pergunta)}&num=5&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

        const responseGoogle = await fetch(urlGoogle);

        const dataGoogle = await responseGoogle.json();

        console.log("RESULTADOS GOOGLE:");
        console.log(JSON.stringify(dataGoogle, null, 2));

        // RESULTADOS GOOGLE
        if (dataGoogle.items && dataGoogle.items.length > 0) {

            dataGoogle.items.slice(0, 3).forEach((item, index) => {

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

        // PÁGINAS IMPORTANTES
        const paginas = [
            "https://www.cojaebarrildealva.pt/",
            "https://www.cojaebarrildealva.pt/pin/",
            "https://www.cojaebarrildealva.pt/assembleia-de-freguesia/",
            "https://www.cojaebarrildealva.pt/concursos-contratacao-publica/",
            "https://www.jfcojaturismo.pt/",
            "https://www.cojaebarrildealva.pt/category/noticias/",
            "https://www.cojaebarrildealva.pt/publicacoes-oficiais/",
            "https://www.cojaebarrildealva.pt/espaco-do-cidadao/",
            "https://www.cojaebarrildealva.pt/secretaria-online/",
            "https://www.cojaebarrildealva.pt/agenda-de-eventos/"
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

                // PESQUISA HTML
                if (htmlNormalizado.includes(perguntaNormalizada)) {

                    resultados += `
Foi encontrada informação relacionada com "${pergunta}" na página:
${pagina}

`;

                    encontrou = true;
                }

                // EXTRAIR LINKS
                const regexLinks = /href="([^"]+)"/g;

                let match;

                while ((match = regexLinks.exec(html)) !== null) {

                    const link = match[1];

                    if (!link.startsWith("http")) {
                        continue;
                    }

                    const linkNormalizado = link
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                    const slugLink = linkNormalizado
                        .replace("https://www.cojaebarrildealva.pt/", "")
                        .replace(/\//g, " ")
                        .replace(/-/g, " ")
                        .trim();

                    // LINK PRINCIPAL
                    if (slugLink.includes(perguntaNormalizada)) {

                        resultados =
`LINK PRINCIPAL ENCONTRADO:
${link}

` + resultados;

                        encontrou = true;
                    }

                    // LINK RELACIONADO
                    else if (linkNormalizado.includes(perguntaNormalizada)) {

                        resultados +=
`Link relacionado encontrado:
${link}

`;

                        encontrou = true;
                    }

                }

            } catch (e) {

                console.log("Erro ao verificar página:", pagina);

            }

        }

        // SEM RESULTADOS
        if (!encontrou && !resultados.trim()) {

            return `Não foram encontrados resultados oficiais sobre "${pergunta}".`;

        }

        return resultados;

    } catch (erro) {

        console.error("ERRO AO PESQUISAR SITE:");
        console.error(erro);

        return "Erro ao pesquisar o site.";

    }

}

// =========================
// CHAT
// =========================

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        console.log("Mensagem recebida:", message);

        // =========================
        // PALAVRAS-CHAVE INTELIGENTES
        // =========================

        const pergunta = message.toLowerCase();

        // ATAS
if (
    pergunta.includes("ata") ||
    pergunta.includes("atas")
) {

    return res.json({
        reply: `
Podes consultar as atas da União de Freguesias aqui:

${config.links.atas}
`
    });

}
const perguntaNormalizada = pergunta
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// OCORRÊNCIAS
if (
    perguntaNormalizada.includes("ocorrencia") ||
    perguntaNormalizada.includes("buraco") ||
    perguntaNormalizada.includes("iluminacao") ||
    perguntaNormalizada.includes("limpeza") ||
    perguntaNormalizada.includes("agua") ||
    perguntaNormalizada.includes("saneamento") ||
    perguntaNormalizada.includes("estrada") ||
    perguntaNormalizada.includes("lixo")
) {

    return res.json({
        reply: `
Podes comunicar ocorrências da freguesia aqui:

https://www.cojaebarrildealva.pt/pin/

Através desta plataforma podes enviar fotografias, localização e acompanhar o estado da ocorrência.
`
    });

}
// EDITAIS
if (
    pergunta.includes("edital") ||
    pergunta.includes("editais")
) {

    return res.json({
        reply: `
Podes consultar os editais e avisos aqui:

${config.links.editais}
`
    });

}

// EVENTOS
if (
    pergunta.includes("evento") ||
    pergunta.includes("eventos")
) {

    return res.json({
        reply: `
Podes consultar a agenda oficial de eventos aqui:

${config.links.eventos}
`
    });

}

// TURISMO
if (
    pergunta.includes("turismo") ||
    pergunta.includes("portal de turismo")
) {

    return res.json({
        reply: `
Podes consultar o portal oficial de turismo aqui:

${config.links.turismo}
`
    });

}

// EXECUTIVO / JUNTA / COMPOSIÇÃO
if (
    pergunta.includes("executivo") ||
    pergunta.includes("junta de freguesia") ||
    pergunta.includes("composicao") ||
    pergunta.includes("composição")
) {

    return res.json({
        reply: `
Podes consultar a composição do executivo da Junta de Freguesia aqui:

${config.links.executivo}
`
    });

}

        // PESQUISAR SITE
        const resultadosSite = await pesquisarSite(message);

        console.log("RESULTADOS FINAIS:");
        console.log(resultadosSite);

        // OPENAI
        const response = await client.chat.completions.create({

            model: "gpt-3.5-turbo",

            messages: [

                {
                    role: "system",
                    content: `
És o assistente virtual oficial da União de Freguesias de Coja e Barril de Alva.

Responde sempre em português de Portugal.

Usa SEMPRE os resultados encontrados no site oficial.

Se existirem links principais encontrados, dá prioridade máxima a esses links.

Nunca digas que não encontraste informação se existirem resultados.

Responde de forma curta, natural e objetiva.

Evita respostas demasiado longas.

Fala como um assistente virtual moderno e simpático.

Quando existir um link principal relevante, mostra-o logo no início da resposta.

Evita listar demasiados links desnecessários.

Resume a informação mais importante em poucas frases.

Se existirem links relevantes, menciona-os claramente.

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

// =========================
// SERVIDOR
// =========================

app.listen(3000, () => {

    console.log("Servidor IA ativo na porta 3000");

});
