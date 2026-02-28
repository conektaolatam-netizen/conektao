import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Award, UserCheck, RefreshCw } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string;
  whatsapp: string;
  ciudad: string | null;
  fecha_registro: string;
  codigo_vendedor: string | null;
  estado: string;
  fecha_certificacion: string | null;
}

export default function AgenteVendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendedores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendedores_agente" as any)
      .select("*")
      .order("fecha_registro", { ascending: false });

    if (error) {
      console.error("Error fetching vendedores:", error);
      toast.error("Error al cargar vendedores");
    } else {
      setVendedores((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleCertificar = async (id: string) => {
    const { error } = await supabase
      .from("vendedores_agente" as any)
      .update({ estado: "certificado" } as any)
      .eq("id", id);

    if (error) {
      toast.error("Error al certificar vendedor");
      console.error(error);
    } else {
      toast.success("Vendedor certificado — código generado automáticamente");
      fetchVendedores();
    }
  };

  const handleActivar = async (id: string) => {
    const { error } = await supabase
      .from("vendedores_agente" as any)
      .update({ estado: "activo" } as any)
      .eq("id", id);

    if (error) {
      toast.error("Error al activar vendedor");
      console.error(error);
    } else {
      toast.success("Vendedor activado");
      fetchVendedores();
    }
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "certificado":
        return <Badge className="bg-blue-600 text-white">Certificado</Badge>;
      case "activo":
        return <Badge className="bg-green-600 text-white">Activo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const totalPendientes = vendedores.filter((v) => v.estado === "pendiente").length;
  const totalCertificados = vendedores.filter((v) => v.estado === "certificado").length;
  const totalActivos = vendedores.filter((v) => v.estado === "activo").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Alicia Vendedores
            </h1>
            <p className="text-muted-foreground text-sm">
              Panel de administración — Sistema independiente de reclutamiento
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchVendedores} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Certificados</CardTitle>
              <Award className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCertificados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedores.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay vendedores registrados aún
                    </TableCell>
                  </TableRow>
                ) : (
                  vendedores.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.nombre}</TableCell>
                      <TableCell>{v.whatsapp}</TableCell>
                      <TableCell>{v.ciudad || "—"}</TableCell>
                      <TableCell>{estadoBadge(v.estado)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {v.codigo_vendedor || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(v.fecha_registro).toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.fecha_certificacion
                          ? new Date(v.fecha_certificacion).toLocaleDateString("es-CO")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {v.estado === "pendiente" && (
                            <Button size="sm" variant="outline" onClick={() => handleCertificar(v.id)}>
                              Certificar
                            </Button>
                          )}
                          {v.estado === "certificado" && (
                            <Button size="sm" variant="outline" onClick={() => handleActivar(v.id)}>
                              Activar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
