import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

const STORAGE_KEY = "alicia_dashboard_access";
const PASSWORD = "Vendemospizzas25";

interface PasswordGateProps {
  children: ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [granted, setGranted] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true"
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (granted) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setGranted(true);
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Acceso protegido</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false); }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">Contraseña incorrecta</p>
            )}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordGate;
