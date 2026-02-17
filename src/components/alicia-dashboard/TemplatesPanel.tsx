import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Loader2, CheckCircle2, Clock, XCircle, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: any;
}

interface Template {
  name: string;
  category: string;
  language: string;
  status: string;
  components: TemplateComponent[];
  id?: string;
}

interface GeneratedTemplate {
  name: string;
  category: string;
  language: string;
  components: TemplateComponent[];
  preview_text?: string;
}

interface TemplatesPanelProps {
  wabaId: string;
}

export default function TemplatesPanel({ wabaId }: TemplatesPanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<GeneratedTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-templates?action=list&waba_id=${wabaId}`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setTemplates(data.templates || []);
      }
    } catch (e) {
      toast.error("Error cargando plantillas");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (wabaId) fetchTemplates();
  }, [wabaId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-templates?action=generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ description: prompt }),
        }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setPreview(data.template);
        toast.success("¡Plantilla generada! Revísala antes de enviarla a Meta");
      }
    } catch {
      toast.error("Error generando plantilla");
    }
    setGenerating(false);
  };

  const handleSubmitToMeta = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const { preview_text, ...templateData } = preview;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-templates?action=create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ waba_id: wabaId, template: templateData }),
        }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("¡Plantilla enviada a Meta para aprobación!");
        setPreview(null);
        setPrompt("");
        setShowCreate(false);
        fetchTemplates();
      }
    } catch {
      toast.error("Error enviando plantilla");
    }
    setSubmitting(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`¿Eliminar la plantilla "${name}"?`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-templates?action=delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ waba_id: wabaId, template_name: name }),
        }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Plantilla eliminada");
        fetchTemplates();
      }
    } catch {
      toast.error("Error eliminando plantilla");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "PENDING": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: "Aprobada",
      PENDING: "En revisión",
      REJECTED: "Rechazada",
    };
    return map[status] || status;
  };

  const categoryBadge = (cat: string) => {
    const variant = cat === "MARKETING" ? "default" : cat === "UTILITY" ? "secondary" : "outline";
    return <Badge variant={variant}>{cat}</Badge>;
  };

  const getBodyText = (components: TemplateComponent[]) => {
    const body = components.find(c => c.type === "BODY");
    return body?.text || "";
  };

  const renderPhonePreview = (components: TemplateComponent[]) => {
    const header = components.find(c => c.type === "HEADER");
    const body = components.find(c => c.type === "BODY");
    const footer = components.find(c => c.type === "FOOTER");

    return (
      <div className="mx-auto w-[280px] bg-muted rounded-2xl p-4 shadow-inner">
        <div className="bg-background rounded-xl p-3 shadow-sm space-y-1">
          {header?.text && (
            <p className="font-bold text-sm text-foreground">{header.text}</p>
          )}
          {body?.text && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{body.text}</p>
          )}
          {footer?.text && (
            <p className="text-xs text-muted-foreground mt-2">{footer.text}</p>
          )}
          <p className="text-[10px] text-muted-foreground text-right mt-1">12:00 p.m. ✓✓</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Plantillas de mensaje</h2>
          <p className="text-xs text-muted-foreground">
            {templates.length} plantilla{templates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setPreview(null); setPrompt(""); }} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nueva
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Template list or Create */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-border">
          {showCreate ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Describe la plantilla que necesitas
                </label>
                <Textarea
                  placeholder='Ej: "Quiero avisarle al cliente que su pedido va en camino con el tiempo estimado de llegada"'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? "Generando..." : "Generar con IA"}
              </Button>

              {preview && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Vista previa</span>
                    </div>
                    {categoryBadge(preview.category)}
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <span className="font-medium">Nombre:</span> {preview.name}
                    {preview.preview_text && (
                      <p className="mt-1">{preview.preview_text}</p>
                    )}
                  </div>

                  {renderPhonePreview(preview.components)}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPreview(null)}
                    >
                      Regenerar
                    </Button>
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={handleSubmitToMeta}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Enviar a Meta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-sm">No tienes plantillas aún</p>
                  <p className="text-xs">Crea tu primera plantilla con ayuda de IA</p>
                </div>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${selectedTemplate?.name === t.name ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {getBodyText(t.components).substring(0, 80)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {statusIcon(t.status)}
                        <span className="text-xs text-muted-foreground">{statusLabel(t.status)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {categoryBadge(t.category)}
                      <span className="text-xs text-muted-foreground">{t.language}</span>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          )}
        </div>

        {/* Right: Preview pane */}
        <div className="hidden md:flex flex-col flex-1 items-center justify-center p-6">
          {selectedTemplate ? (
            <div className="space-y-4 w-full max-w-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(selectedTemplate.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(selectedTemplate.status)}
                <span className="text-sm">{statusLabel(selectedTemplate.status)}</span>
                {categoryBadge(selectedTemplate.category)}
              </div>
              {renderPhonePreview(selectedTemplate.components)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground space-y-2">
              <Eye className="w-10 h-10 mx-auto opacity-20" />
              <p className="text-sm">Selecciona una plantilla para previsualizarla</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
