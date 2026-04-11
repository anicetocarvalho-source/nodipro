import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { ExportReportData } from "./exportUtils";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A365D" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: { argb: "FF1A365D" },
};

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = Math.min(len + 2, 60);
    });
    col.width = max;
  });
}

export async function exportToExcel(reportData: ExportReportData, filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = reportData.organizationName;
  wb.created = new Date();

  // Summary sheet
  const summary = wb.addWorksheet("Resumo");
  summary.mergeCells("A1:D1");
  const titleCell = summary.getCell("A1");
  titleCell.value = reportData.title;
  titleCell.font = TITLE_FONT;

  summary.mergeCells("A2:D2");
  summary.getCell("A2").value = reportData.subtitle;
  summary.getCell("A2").font = { italic: true, size: 11 };

  summary.getCell("A3").value = `Organização: ${reportData.organizationName}`;
  summary.getCell("A4").value = `Gerado em: ${reportData.generatedAt}`;

  // Metrics
  let row = 6;
  summary.getCell(`A${row}`).value = "INDICADORES-CHAVE";
  summary.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;

  const metricsHeader = summary.getRow(row);
  ["Indicador", "Valor", "Detalhe"].forEach((h, i) => {
    const cell = metricsHeader.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  row++;

  for (const m of reportData.metrics) {
    const r = summary.getRow(row);
    r.getCell(1).value = m.label;
    r.getCell(2).value = m.value;
    r.getCell(3).value = m.subtext ?? "";
    row++;
  }

  // Recommendations
  if (reportData.recommendations?.length) {
    row += 2;
    summary.getCell(`A${row}`).value = "RECOMENDAÇÕES";
    summary.getCell(`A${row}`).font = { bold: true, size: 12 };
    row++;
    reportData.recommendations.forEach((rec, i) => {
      summary.getCell(`A${row}`).value = `${i + 1}. ${rec}`;
      row++;
    });
  }

  autoWidth(summary);

  // Data sheets for each table
  for (const table of reportData.tables) {
    const sheetName = table.title.substring(0, 31).replace(/[\\/*?:[\]]/g, "");
    const ws = wb.addWorksheet(sheetName);

    // Header row
    const headerRow = ws.getRow(1);
    table.headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { horizontal: "center" };
    });

    // Data rows
    table.rows.forEach((dataRow, ri) => {
      const wsRow = ws.getRow(ri + 2);
      dataRow.forEach((val, ci) => {
        wsRow.getCell(ci + 1).value = val;
      });
      // Alternating row colors
      if (ri % 2 === 1) {
        wsRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7FAFC" } };
        });
      }
    });

    autoWidth(ws);
    ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + table.headers.length)}1` };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

// Donor-specific report export
export async function exportDonorReport(
  reportData: ExportReportData & { donorSections?: DonorSection[] },
  filename: string,
  donorFormat: "worldbank" | "undp" | "generic" = "generic"
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = reportData.organizationName;
  wb.created = new Date();

  const formatLabels: Record<string, string> = {
    worldbank: "Banco Mundial - Relatório de Progresso",
    undp: "PNUD - Relatório de Resultados",
    generic: "Relatório para Doador",
  };

  // Cover sheet
  const cover = wb.addWorksheet("Capa");
  cover.mergeCells("A3:F3");
  cover.getCell("A3").value = formatLabels[donorFormat];
  cover.getCell("A3").font = { bold: true, size: 18, color: { argb: "FF1A365D" } };
  cover.getCell("A3").alignment = { horizontal: "center" };

  cover.mergeCells("A5:F5");
  cover.getCell("A5").value = reportData.title;
  cover.getCell("A5").font = { bold: true, size: 14 };
  cover.getCell("A5").alignment = { horizontal: "center" };

  cover.mergeCells("A7:F7");
  cover.getCell("A7").value = reportData.organizationName;
  cover.getCell("A7").font = { size: 12 };
  cover.getCell("A7").alignment = { horizontal: "center" };

  cover.mergeCells("A9:F9");
  cover.getCell("A9").value = `Data: ${reportData.generatedAt}`;
  cover.getCell("A9").alignment = { horizontal: "center" };

  cover.mergeCells("A11:F11");
  cover.getCell("A11").value = "CONFIDENCIAL";
  cover.getCell("A11").font = { bold: true, color: { argb: "FFCC0000" }, size: 11 };
  cover.getCell("A11").alignment = { horizontal: "center" };

  // Standard sections per donor format
  const sections = getDonorSections(donorFormat);

  for (const section of sections) {
    const ws = wb.addWorksheet(section.name.substring(0, 31));
    ws.mergeCells("A1:E1");
    ws.getCell("A1").value = section.name;
    ws.getCell("A1").font = TITLE_FONT;

    ws.getCell("A3").value = section.description;
    ws.getCell("A3").font = { italic: true };

    // Add relevant data from report tables
    const matchingTable = reportData.tables.find(t =>
      t.title.toLowerCase().includes(section.dataKey.toLowerCase())
    );
    if (matchingTable) {
      const startRow = 5;
      const headerRow = ws.getRow(startRow);
      matchingTable.headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
      });
      matchingTable.rows.forEach((dataRow, ri) => {
        const wsRow = ws.getRow(startRow + ri + 1);
        dataRow.forEach((val, ci) => {
          wsRow.getCell(ci + 1).value = val;
        });
      });
    }

    autoWidth(ws);
  }

  // Metrics summary sheet
  const metricsSheet = wb.addWorksheet("Indicadores");
  metricsSheet.mergeCells("A1:C1");
  metricsSheet.getCell("A1").value = "Indicadores-Chave de Desempenho";
  metricsSheet.getCell("A1").font = TITLE_FONT;

  const mHeader = metricsSheet.getRow(3);
  ["Indicador", "Valor", "Observação"].forEach((h, i) => {
    const cell = mHeader.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  reportData.metrics.forEach((m, i) => {
    const r = metricsSheet.getRow(4 + i);
    r.getCell(1).value = m.label;
    r.getCell(2).value = m.value;
    r.getCell(3).value = m.subtext ?? "";
  });
  autoWidth(metricsSheet);

  // Recommendations sheet
  if (reportData.recommendations?.length) {
    const recSheet = wb.addWorksheet("Recomendações");
    recSheet.mergeCells("A1:D1");
    recSheet.getCell("A1").value = "Recomendações e Próximos Passos";
    recSheet.getCell("A1").font = TITLE_FONT;

    reportData.recommendations.forEach((rec, i) => {
      recSheet.getCell(`A${i + 3}`).value = `${i + 1}.`;
      recSheet.mergeCells(`B${i + 3}:D${i + 3}`);
      recSheet.getCell(`B${i + 3}`).value = rec;
    });
    autoWidth(recSheet);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

interface DonorSection {
  name: string;
  description: string;
  dataKey: string;
}

function getDonorSections(format: "worldbank" | "undp" | "generic"): DonorSection[] {
  const common: DonorSection[] = [
    { name: "1. Contexto", description: "Contexto do projecto e enquadramento estratégico.", dataKey: "contexto" },
    { name: "2. Progresso", description: "Progresso físico e financeiro no período reportado.", dataKey: "projecto" },
    { name: "3. Execução Financeira", description: "Execução orçamental detalhada por componente.", dataKey: "financeiro" },
    { name: "4. Desembolsos", description: "Estado de tranches e desembolsos.", dataKey: "desembolso" },
    { name: "5. Riscos e Mitigação", description: "Riscos identificados e medidas de mitigação.", dataKey: "risco" },
  ];

  if (format === "worldbank") {
    return [
      ...common,
      { name: "6. Aquisições", description: "Estado dos processos de aquisição.", dataKey: "aquisição" },
      { name: "7. Salvaguardas", description: "Conformidade ambiental e social.", dataKey: "salvaguarda" },
      { name: "8. Próximos Passos", description: "Actividades planeadas para o próximo período.", dataKey: "próximo" },
    ];
  }
  if (format === "undp") {
    return [
      ...common,
      { name: "6. Resultados e Impacto", description: "Resultados alcançados vs. metas do quadro lógico.", dataKey: "resultado" },
      { name: "7. Lições Aprendidas", description: "Lições e boas práticas identificadas.", dataKey: "lição" },
      { name: "8. Sustentabilidade", description: "Estratégia de sustentabilidade pós-projecto.", dataKey: "sustentabilidade" },
    ];
  }
  return [
    ...common,
    { name: "6. Resultados", description: "Resultados alcançados no período.", dataKey: "resultado" },
    { name: "7. Próximos Passos", description: "Plano de acção para o próximo período.", dataKey: "próximo" },
  ];
}
