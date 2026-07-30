import { Bell, QrCode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMarcarNotificacionLeida, useNotificaciones } from "@/hooks/use-data";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notificacionesAll = [] } = useNotificaciones(user?.id);
  const marcarLeida = useMarcarNotificacionLeida();

  if (!user) return null;

  const notificaciones = notificacionesAll.filter((n) => !n.leida);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-4 sticky top-0 z-30">
      <button
        onClick={() => navigate("/escanear")}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
      >
        <QrCode className="w-4 h-4" />
        <span className="hidden sm:inline">Escanear QR</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificaciones.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notificaciones.length}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500 text-center">Sin notificaciones nuevas</p>
                ) : (
                  notificaciones.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        marcarLeida.mutate(n.id);
                        setNotifOpen(false);
                        if (n.entidadId) {
                          if (n.tipo === "ot") navigate(`/ordenes`);
                          if (n.tipo === "falla") navigate(`/equipos`);
                        }
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                        n.leida ? "text-slate-500" : "text-slate-800 font-medium"
                      )}
                    >
                      {n.mensaje}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
