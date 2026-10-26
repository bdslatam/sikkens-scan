// Ponte entre o app e a lista do SharePoint "SikkensDocumentos".
// Cada registro do app (scan, cliente, foto, resumo por país) vira um item da lista:
//   Title   = caminho do documento (ex.: paises/BR/scans/s123)
//   Colecao = coleção do documento (ex.: paises/BR/scans)
//   Dados   = conteúdo em JSON (dividido em partes de até 60 mil caracteres)
//
// O arquivo abaixo é gerado pelo comando:
//   pa app add data-source --connector "shared_sharepointonline" ... --table "SikkensDocumentos"
// Se o nome gerado for diferente, ajuste SOMENTE a linha de import a seguir.
import { SikkensDocumentosService } from "./generated/services/SikkensDocumentosService";

const Svc: any = SikkensDocumentosService;
const LIMIT = 60000;
const CHUNK_COL = "#partes";

type Row = { ID?: number | string; Id?: number | string; id?: number | string; Title?: string; Colecao?: string; Dados?: string };

const quote = (s: string) => s.replace(/'/g, "''");
const idOf = (r: Row) => String(r.ID ?? r.Id ?? r.id ?? "");
const rowsOf = (res: any): Row[] => {
  const d = res && (res.data ?? res);
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.value)) return d.value;
  return [];
};

async function where(field: "Title" | "Colecao", value: string): Promise<Row[]> {
  try {
    const res = await Svc.getAll({ filter: `${field} eq '${quote(value)}'`, top: 5000 });
    const rows = rowsOf(res);
    if (rows.length || (res && res.data)) return rows.filter((r) => r[field] === value);
  } catch (e) {
    console.warn("Sikkens: filtro no servidor indisponível, filtrando no app", e);
  }
  const all = rowsOf(await Svc.getAll({ top: 5000 }));
  return all.filter((r) => r[field] === value);
}

const partsOf = (dados?: string) => {
  const s = dados || "";
  const i = s.indexOf("|");
  const n = i > 0 ? parseInt(s.slice(0, i), 10) : 1;
  return { n: Number.isFinite(n) && n > 0 ? n : 1, body: i > 0 ? s.slice(i + 1) : s };
};

async function decode(row: Row): Promise<{ path: string; data: any } | null> {
  const path = row.Title || "";
  const { n, body } = partsOf(row.Dados);
  let json = body;
  for (let k = 1; k < n; k++) {
    const part = (await where("Title", `${path}#${k}`))[0];
    if (!part) return null;
    json += part.Dados || "";
  }
  try { return { path, data: JSON.parse(json) }; } catch { return null; }
}

async function upsert(title: string, colecao: string, dados: string, existing?: Row) {
  const row = existing ?? (await where("Title", title))[0];
  const payload = { Title: title, Colecao: colecao, Dados: dados };
  if (row) await Svc.update(idOf(row), payload);
  else await Svc.create(payload);
}

export async function createBridge() {
  // Teste rápido de acesso: se a lista não responder, o app avisa e usa o navegador.
  await Svc.getAll({ top: 1 });

  return {
    async list(colecao: string) {
      const rows = await where("Colecao", colecao);
      const out = await Promise.all(rows.map(decode));
      return out.filter((x): x is { path: string; data: any } => !!x);
    },
    async get(path: string) {
      const row = (await where("Title", path))[0];
      if (!row) return null;
      const d = await decode(row);
      return d ? d.data : null;
    },
    async set(path: string, colecao: string, data: any) {
      const json = JSON.stringify(data);
      const n = Math.max(1, Math.ceil(json.length / LIMIT));
      const current = (await where("Title", path))[0];
      const oldN = current ? partsOf(current.Dados).n : 1;
      for (let k = 1; k < n; k++) await upsert(`${path}#${k}`, CHUNK_COL, json.slice(k * LIMIT, (k + 1) * LIMIT));
      await upsert(path, colecao, `${n}|${json.slice(0, LIMIT)}`, current);
      for (let k = n; k < oldN; k++) {
        const old = (await where("Title", `${path}#${k}`))[0];
        if (old) await Svc.delete(idOf(old));
      }
    },
    async del(path: string) {
      const row = (await where("Title", path))[0];
      if (!row) return;
      const { n } = partsOf(row.Dados);
      for (let k = 1; k < n; k++) {
        const part = (await where("Title", `${path}#${k}`))[0];
        if (part) await Svc.delete(idOf(part));
      }
      await Svc.delete(idOf(row));
    },
  };
}
