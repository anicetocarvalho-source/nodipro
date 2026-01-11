import { useState } from "react";
import {
  Plus,
  Search,
  Upload,
  FolderOpen,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  MoreHorizontal,
  Grid,
  List,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const documents = [
  {
    id: "1",
    name: "Proposta Comercial - Sistema Financeiro.pdf",
    type: "pdf",
    project: "Sistema de Gestão Financeira",
    size: "2.4 MB",
    uploadedBy: "João Miguel",
    uploadedAt: "10 Jan 2026",
    starred: true,
  },
  {
    id: "2",
    name: "Diagrama de Arquitectura.png",
    type: "image",
    project: "App Mobile Bancário",
    size: "1.8 MB",
    uploadedBy: "Carlos Ferreira",
    uploadedAt: "09 Jan 2026",
    starred: false,
  },
  {
    id: "3",
    name: "Cronograma Detalhado.xlsx",
    type: "spreadsheet",
    project: "Portal de Serviços Públicos",
    size: "856 KB",
    uploadedBy: "Maria Silva",
    uploadedAt: "08 Jan 2026",
    starred: true,
  },
  {
    id: "4",
    name: "Especificação Funcional v2.docx",
    type: "document",
    project: "ERP Corporativo",
    size: "4.2 MB",
    uploadedBy: "Ana Costa",
    uploadedAt: "07 Jan 2026",
    starred: false,
  },
  {
    id: "5",
    name: "Manual do Utilizador.pdf",
    type: "pdf",
    project: "Plataforma E-commerce",
    size: "3.1 MB",
    uploadedBy: "Sofia Lima",
    uploadedAt: "06 Jan 2026",
    starred: false,
  },
  {
    id: "6",
    name: "Relatório de Testes.pdf",
    type: "pdf",
    project: "App Mobile Bancário",
    size: "1.2 MB",
    uploadedBy: "Pedro Alves",
    uploadedAt: "05 Jan 2026",
    starred: true,
  },
];

const templates = [
  { id: "1", name: "Proposta Comercial", downloads: 45 },
  { id: "2", name: "Plano de Projecto", downloads: 38 },
  { id: "3", name: "Relatório de Status", downloads: 56 },
  { id: "4", name: "Acta de Reunião", downloads: 72 },
  { id: "5", name: "Especificação Funcional", downloads: 31 },
];

const typeConfig = {
  pdf: { icon: FileText, color: "text-destructive" },
  image: { icon: FileImage, color: "text-success" },
  spreadsheet: { icon: FileSpreadsheet, color: "text-primary" },
  document: { icon: File, color: "text-info" },
};

export default function Documents() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Documentos</h1>
          <p className="text-muted-foreground">
            Gerir documentos, templates e ficheiros do projecto.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="h-4 w-4 mr-2" />
          Carregar Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favoritos</p>
                <p className="text-2xl font-bold">{documents.filter((d) => d.starred).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <FolderOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Download className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">{templates.reduce((a, t) => a + t.downloads, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-4">
          {/* Search & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar documentos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Document List */}
          {viewMode === "list" ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Projecto</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Tamanho</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Carregado por</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => {
                      const TypeIcon = typeConfig[doc.type as keyof typeof typeConfig].icon;
                      return (
                        <tr key={doc.id} className="border-b hover:bg-accent/50 cursor-pointer">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <TypeIcon
                                className={cn(
                                  "h-5 w-5",
                                  typeConfig[doc.type as keyof typeof typeConfig].color
                                )}
                              />
                              <span className="font-medium">{doc.name}</span>
                              {doc.starred && <Star className="h-4 w-4 text-warning fill-warning" />}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.project}</td>
                          <td className="p-4 text-sm">{doc.size}</td>
                          <td className="p-4 text-sm">{doc.uploadedBy}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.uploadedAt}</td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Descarregar</DropdownMenuItem>
                                <DropdownMenuItem>Partilhar</DropdownMenuItem>
                                <DropdownMenuItem>Renomear</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => {
                const TypeIcon = typeConfig[doc.type as keyof typeof typeConfig].icon;
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-4 rounded-lg bg-accent mb-3">
                          <TypeIcon
                            className={cn(
                              "h-8 w-8",
                              typeConfig[doc.type as keyof typeof typeConfig].color
                            )}
                          />
                        </div>
                        <p className="font-medium text-sm truncate w-full">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{doc.size}</p>
                        {doc.starred && (
                          <Star className="h-4 w-4 text-warning fill-warning mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.downloads} downloads
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
