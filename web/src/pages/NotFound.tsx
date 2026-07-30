import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
          <Stethoscope className="w-10 h-10 text-teal-400" />
        </div>
        <h1 className="text-5xl font-bold text-slate-300 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Página no encontrada</h2>
        <p className="text-slate-500 mb-6">La página que busca no existe o ha sido movida.</p>
        <Button onClick={() => navigate("/")} className="bg-teal-600 hover:bg-teal-700 gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
