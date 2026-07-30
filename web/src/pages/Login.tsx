import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.ok) {
        toast.success("Bienvenido a MediMaint");
        navigate("/");
      } else if (result.locked) {
        toast.error(result.reason ?? "Cuenta bloqueada temporalmente");
      } else {
        toast.error(result.reason ?? "Credenciales incorrectas");
      }
    } catch {
      toast.error("Error al conectar con el servidor");
    }
    setIsLoading(false);
  };

  const handleDemoAccess = async () => {
    setIsDemoLoading(true);
    try {
      const ok = await loginDemo();
      if (ok) {
        toast.success("Acceso Demo activado — sesión temporal de 30 minutos");
        navigate("/");
      } else {
        toast.error("No se pudo iniciar la sesión demo");
      }
    } catch {
      toast.error("Error al iniciar demo");
    }
    setIsDemoLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
        </div>
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">MediMaint</CardTitle>
            <CardDescription className="text-slate-500">Gestión de Mantenimiento de Equipos Médicos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</span>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <p className="text-xs text-center text-slate-500 font-medium uppercase tracking-wider">
                Acceso Rápido
              </p>
              <Button
                variant="outline"
                className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 gap-2"
                onClick={handleDemoAccess}
                disabled={isDemoLoading}
              >
                {isDemoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {isDemoLoading ? "Iniciando demo..." : "Acceso Demo (Técnico)"}
              </Button>
              <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                Sesión temporal de 30 minutos con acceso de Técnico.{' '}
                <br />
                No requiere credenciales. Para acceso completo use su cuenta registrada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
