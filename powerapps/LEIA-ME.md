# Sikkens Painting Process Scan — Power Apps (code app)

Este projeto publica o Sikkens Painting Process Scan dentro do Power Apps.
Os dados (scans, clientes, fotos e o resumo por país) ficam numa lista do SharePoint
chamada **SikkensDocumentos**, e o acesso é feito com a conta Microsoft da empresa.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | A ferramenta completa (telas, cálculos, relatório, fotos, idiomas) |
| `src/main.ts` | Carrega fontes e bibliotecas de PDF, Word e Excel junto com o app |
| `src/sikkens-bridge.ts` | Liga o app à lista do SharePoint |
| `package.json`, `vite.config.ts`, `tsconfig*.json` | Configuração do projeto |

A pasta `src/generated/` não vem no pacote: ela é criada pelo comando
`pa app add data-source` (passo 7 do guia).

## Comandos principais

```bash
npm install
pa auth login
pa app init --display-name "Sikkens Painting Process Scan" --environment-id <ID-DO-AMBIENTE>
pa app add data-source --connector "shared_sharepointonline" --connection-id <ID-DA-CONEXAO> --table "SikkensDocumentos" --dataset "https://SUAEMPRESA.sharepoint.com/sites/SEUSITE"
pa app run
npm run build
pa app push
```

## Lista do SharePoint "SikkensDocumentos"

| Coluna | Tipo | Observação |
|---|---|---|
| Title (Título) | já existe | Caminho do registro |
| Colecao | Uma linha de texto | Sem acento, exatamente assim |
| Dados | Várias linhas de texto, **texto sem formatação** | Sem acento, exatamente assim |

Indexe as colunas **Title** e **Colecao** (Configurações da lista → Colunas indexadas).

## Neste repositório

- A raiz (`index.html` e `firebase-config.js`) continua sendo o site do GitHub Pages com Firebase.
- Esta pasta `powerapps/` é a versão Power Apps, com dados na lista do SharePoint.
- O arquivo `.gitignore` impede que os IDs do seu ambiente vão para o repositório público.

No Codespaces, comece sempre com:

```bash
cd powerapps
```

Entre com `pa auth login --device-code` e publique com `npm run publicar`.
