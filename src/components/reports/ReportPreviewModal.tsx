import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, FileSpreadsheet, AlertTriangle, Building2, Download } from "lucide-react";
import { ReportData } from "@/hooks/useReportGeneration";
import { exportToCSV, printReport } from "@/lib/exportUtils";
import { exportToExcel, exportDonorReport } from "@/lib/excelExport";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ReportPreviewModalProps {
  reportData: ReportData | null;
  onClose: () => void;
}

export function ReportPreviewModal({ reportData, onClose }: ReportPreviewModalProps) {
  if (!reportData) return null;

  const handlePrint = () => printReport();
  const handleExportCSV = () => {
    exportToCSV(reportData, `relatorio-${reportData.type}-${Date.now()}`);
  };
  const handleExportExcel = () => {
    exportToExcel(reportData, `relatorio-${reportData.type}-${Date.now()}`);
  };
  const handleDonorExport = (format: "worldbank" | "undp" | "generic") => {
    exportDonorReport(reportData, `relatorio-doador-${format}-${Date.now()}`, format);
  };

  return (
    <Dialog open={!!reportData} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <style>{`
          @media print {
            body > *:not(.report-print-root) { display: none !important; }
            [role="dialog"] { 
              position: static !important; 
              max-width: none !important; 
              max-height: none !important; 
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            .no-print { display: none !important; }
            .print-break { page-break-inside: avoid; }
            .print-only { display: block !important; }
            .report-header-print {
              border-bottom: 3px solid #1a365d !important;
              padding-bottom: 16px !important;
              margin-bottom: 24px !important;
            }
            table { font-size: 11px !important; }
            @page { margin: 20mm 15mm; size: A4; }
          }
        `}</style>

        <div className="no-print">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">{reportData.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (CSV)
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir / PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div id="report-content" className="space-y-6">
          {/* Institutional Header */}
          <div className="report-header-print border-b-2 border-primary pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-wide">
                    {reportData.organizationName}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-foreground">{reportData.title}</h1>
                <p className="text-sm text-muted-foreground">{reportData.subtitle}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <p>Gerado em: <strong>{reportData.generatedAt}</strong></p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  Documento Confidencial
                </p>
                <p className="text-[10px]">Ref: {reportData.type.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="print-break">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Indicadores Principais
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportData.metrics.map((metric, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className={cn(
                      "text-xl font-bold mt-1",
                      metric.variant === "success" && "text-success",
                      metric.variant === "warning" && "text-warning",
                      metric.variant === "danger" && "text-destructive"
                    )}>
                      {metric.value}
                    </p>
                    {metric.subtext && (
                      <p className="text-xs text-muted-foreground mt-0.5">{metric.subtext}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tables */}
          {reportData.tables.map((table, i) => (
            <div key={i} className="print-break">
              <h3 className="text-sm font-semibold mb-3">{table.title}</h3>
              {table.rows.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        {table.headers.map((h, j) => (
                          <th key={j} className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap text-xs uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, j) => (
                        <tr key={j} className={cn("border-t hover:bg-muted/30 transition-colors", j % 2 === 0 ? "" : "bg-muted/10")}>
                          {row.map((cell, k) => (
                            <td key={k} className="p-3 whitespace-nowrap text-xs">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg bg-muted/20">
                  Sem dados para apresentar nesta secção.
                </p>
              )}
            </div>
          ))}

          {/* Recommendations */}
          {reportData.recommendations && reportData.recommendations.length > 0 && (
            <div className="print-break">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Recomendações
              </h3>
              <div className="space-y-2">
                {reportData.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <span className="text-warning font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-xs text-muted-foreground text-center space-y-1">
            <p className="font-medium">NódiPro — Sistema de Gestão de Projectos</p>
            <p>Relatório gerado automaticamente • {reportData.generatedAt}</p>
            <p className="text-[10px] text-muted-foreground/50">Este documento é confidencial e destinado exclusivamente ao uso interno da organização.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
