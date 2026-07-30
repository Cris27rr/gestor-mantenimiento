import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Camera, CameraOff, RotateCcw, SwitchCamera, AlertCircle, Search, Stethoscope, Loader2, MapPin } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useSearchEquipos } from "@/hooks/use-data";
import type { Equipment } from "@/types";

export default function QRScannerPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null = checking
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scannerDivId = "qr-reader-scanner";
  const { data: searchResults = [], isFetching: isSearching } = useSearchEquipos(searchQuery);

  const stopScan = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScan = useCallback(async (cameraIdx?: number) => {
    const idx = cameraIdx ?? currentCameraIdx;
    try {
      // Stop any existing scanner
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }

      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setHasCamera(false);
        toast.error("No se detectó cámara en este dispositivo");
        return;
      }

      setHasCamera(true);
      const camList = devices.map((d, i) => ({
        id: d.id,
        label: d.label || `Cámara ${i + 1}`,
      }));
      setCameras(camList);

      const camIdx = idx < camList.length ? idx : 0;
      setCurrentCameraIdx(camIdx);

      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        camList[camIdx].id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          setLastScan(decodedText);
          handleScanResult(decodedText);
          stopScan();
        },
        () => {
          // scan failure callback - silent
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.error("QR Scanner error:", err);
      setHasCamera(false);
      if (err?.message?.includes("NotAllowed") || err?.name === "NotAllowedError") {
        toast.error("Permiso de cámara denegado. Verifique la configuración de su navegador.");
      } else {
        toast.error("Error al acceder a la cámara. Verifique que su dispositivo tenga cámara.");
      }
    }
  }, [currentCameraIdx, stopScan]);

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIdx + 1) % cameras.length;
    setCurrentCameraIdx(nextIdx);
    await startScan(nextIdx);
  }, [cameras, currentCameraIdx, startScan]);

  const handleScanResult = (text: string) => {
    try {
      const url = new URL(text);
      const match = url.pathname.match(/\/equipo\/([a-zA-Z0-9-]+)/);
      if (match) {
        navigate(`/equipo/${match[1]}`);
        return;
      }
    } catch {
      // Not a URL, try direct UUID match
    }
    // Try direct UUID pattern
    const uuidMatch = text.match(/^[a-zA-Z0-9-]+$/);
    if (uuidMatch) {
      navigate(`/equipo/${text.trim()}`);
    } else {
      toast.info("QR no válido: " + text.substring(0, 50));
    }
  };

  // Check camera availability on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setHasCamera(devices.length > 0);
        if (devices.length > 0) {
          setCameras(
            devices.map((d, i) => ({
              id: d.id,
              label: d.label || `Cámara ${i + 1}`,
            }))
          );
        }
      })
      .catch(() => setHasCamera(false));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const cameraLabel = cameras[currentCameraIdx]?.label ?? "Cámara";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Escanear Código QR</h1>
        <p className="text-slate-500">Apunte la cámara al código QR del equipo</p>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Scanner container - always rendered */}
          <div className="relative aspect-square max-h-[500px] bg-black">
            <div
              id={scannerDivId}
              className="w-full h-full"
              style={{ display: scanning ? "block" : "none" }}
            />

            {/* Scan frame overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[250px] h-[250px] border-2 border-teal-400 rounded-xl relative">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                </div>
              </div>
            )}

            {/* Placeholder when not scanning */}
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  {hasCamera === null ? (
                    <div className="space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400 mx-auto" />
                      <p className="text-sm text-slate-400">Verificando cámara...</p>
                    </div>
                  ) : hasCamera ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-10 h-10 text-white/60" />
                      </div>
                      <p className="text-sm text-white/60 mb-4">
                        {cameras.length > 0
                          ? `Cámara detectada: ${cameraLabel}`
                          : "La cámara está lista para escanear"}
                      </p>
                      <Button
                        onClick={() => startScan(0)}
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                      >
                        <Camera className="w-4 h-4" /> Iniciar Escaneo
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <CameraOff className="w-10 h-10 text-red-400/80" />
                      </div>
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <p className="text-sm text-white/70">No se detectó cámara en este dispositivo</p>
                      </div>
                      <p className="text-xs text-white/40 mb-4">
                        Puede acceder a un equipo ingresando su código manualmente abajo
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls when scanning */}
          {scanning && (
            <div className="p-4 flex justify-center gap-3 bg-white">
              <Button variant="outline" onClick={stopScan} className="gap-2">
                <CameraOff className="w-4 h-4" /> Detener
              </Button>
              {cameras.length > 1 && (
                <Button variant="outline" onClick={switchCamera} className="gap-2">
                  <SwitchCamera className="w-4 h-4" /> {cameras.length > 1 ? "Cambiar Cámara" : currentCameraIdx === 0 ? "Trasera" : "Frontal"}
                </Button>
              )}
              <p className="text-xs text-slate-400 self-center ml-2">{cameraLabel}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search + manual entry + last scan */}
      {!scanning && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscar Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Autocomplete search */}
            <div ref={searchContainerRef} className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // If there are search results and user presses Enter, go to first result
                  if (searchResults.length > 0) {
                    navigate(`/equipos/${searchResults[0].id}`);
                    setShowDropdown(false);
                  } else if (searchQuery.trim()) {
                    // Fallback: try as UUID/URL
                    handleScanResult(searchQuery.trim());
                  }
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) setShowDropdown(true);
                      else setShowDropdown(false);
                    }}
                    onFocus={() => { if (searchQuery.trim().length >= 2) setShowDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Buscar por nombre, serial, marca o modelo..."
                    className="pl-9 pr-10"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />
                  )}
                </div>
              </form>

              {/* Dropdown results */}
              {showDropdown && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-[320px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      Buscando...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-500 mb-2">No se encontraron equipos</p>
                      <p className="text-xs text-slate-400">
                        También puedes pegar un código UUID o URL del equipo y presionar Enter
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (searchQuery.trim()) {
                            handleScanResult(searchQuery.trim());
                            setShowDropdown(false);
                          }
                        }}
                        className="mt-3"
                      >
                        <Button type="submit" variant="outline" size="sm" className="text-xs gap-1">
                          <QrCode className="w-3 h-3" /> Ir a &quot;{searchQuery.substring(0, 30)}&quot;
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      {searchResults.map((eq: Equipment) => (
                        <button
                          key={eq.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate(`/equipos/${eq.id}`);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-slate-800 truncate">{eq.nombre}</span>
                              <Badge className="text-[9px] bg-teal-50 text-teal-700 flex-shrink-0">{eq.estado}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{eq.marca} {eq.modelo}{eq.serial ? ` — SN: ${eq.serial}` : ""}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                              <MapPin className="w-3 h-3" /> {eq.ubicacion}
                            </div>
                          </div>
                        </button>
                      ))}
                      {searchResults.length >= 8 && (
                        <p className="px-4 py-2 text-xs text-slate-400 text-center bg-slate-50">
                          Mostrando los primeros 8 resultados. Refina tu búsqueda para ver más.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* UUID direct entry */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const code = formData.get("code") as string;
                if (code) handleScanResult(code.trim());
              }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="code"
                  placeholder="O pega un código UUID o URL de equipo"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" className="flex-shrink-0">
                Ir
              </Button>
            </form>

            {lastScan && (
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Último escaneo: <span className="font-mono text-xs">{lastScan.substring(0, 60)}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleScanResult(lastScan)}
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Revisitar
                </Button>
              </div>
            )}
            {hasCamera && (
              <Button
                variant="outline"
                className="w-full gap-2 text-slate-600"
                onClick={() => startScan(0)}
              >
                <Camera className="w-4 h-4" /> Volver a Escanear
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
