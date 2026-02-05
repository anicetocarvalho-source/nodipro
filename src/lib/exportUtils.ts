export interface ExportReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  organizationName: string;
  metrics: { label: string; value: string | number; subtext?: string }[];
  tables: { title: string; headers: string[]; rows: (string | number)[][] }[];
  recommendations?: string[];
}

function escapeCSV(str: string): string {
  const s = String(str ?? '');
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(reportData: ExportReportData, filename: string) {
  const lines: string[] = [];

  lines.push(escapeCSV(reportData.title));
  lines.push(escapeCSV(reportData.subtitle));
  lines.push(`Organização: ${escapeCSV(reportData.organizationName)}`);
  lines.push(`Gerado em: ${escapeCSV(reportData.generatedAt)}`);
  lines.push('');

  // Metrics
  lines.push('INDICADORES');
  lines.push(reportData.metrics.map(m => escapeCSV(m.label)).join(','));
  lines.push(reportData.metrics.map(m => escapeCSV(String(m.value))).join(','));
  lines.push('');

  // Tables
  for (const table of reportData.tables) {
    lines.push(escapeCSV(table.title));
    lines.push(table.headers.map(escapeCSV).join(','));
    for (const row of table.rows) {
      lines.push(row.map(cell => escapeCSV(String(cell ?? ''))).join(','));
    }
    lines.push('');
  }

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    lines.push('RECOMENDAÇÕES');
    reportData.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${escapeCSV(rec)}`);
    });
  }

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function printReport() {
  window.print();
}
