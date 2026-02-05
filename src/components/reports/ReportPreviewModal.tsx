import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { ReportData } from "@/hooks/useReportGeneration";
import { exportToCSV, printReport } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

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
            }
            .no-print { display: none !important; }
            .print-break { page-break-inside: avoid; }
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
          {/* Header */}
          <div className="border-b pb-4">
            <h1 className="text-xl font-bold hidden print:block">{reportData.title}</h1>
            <p className="text-sm text-muted-foreground">{reportData.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Organização: <strong>{reportData.organizationName}</strong></span>
              <span>Gerado em: <strong>{reportData.generatedAt}</strong></span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-break">
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
                          <th key={j} className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, j) => (
                        <tr key={j} className="border-t hover:bg-muted/30 transition-colors">
                          {row.map((cell, k) => (
                            <td key={k} className="p-3 whitespace-nowrap">{cell}</td>
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
          <div className="border-t pt-4 text-xs text-muted-foreground text-center">
            <p>Relatório gerado automaticamente pelo sistema NódiPro • {reportData.generatedAt}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
