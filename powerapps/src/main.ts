// Ponto de entrada do Sikkens Painting Process Scan como Power Apps code app.
// Carrega fontes e bibliotecas de exportação (PDF, Word, Excel) junto com o app,
// sem depender de CDN, e liga o app à lista do SharePoint.
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/800.css";
import * as docx from "docx";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { createBridge } from "./sikkens-bridge";

const w = window as any;
w.docx = docx;
w.jspdf = { jsPDF };
w.XLSX = XLSX;

createBridge()
  .then((bridge) => w.__sikkensPAResolve(bridge))
  .catch((err) => {
    console.error("Sikkens: falha ao ligar a lista do SharePoint", err);
    w.__sikkensPAResolve(null);
  });
