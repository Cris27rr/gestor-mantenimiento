import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Shield, UserCheck, UserCog, Trash2, Pencil, Camera, Mail, Phone, Building, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from "@/hooks/use-data";
import type { UserRole, User } from "@/types";

const roleLabels: Record<string, string> = { admin: "Administrador", director_departamento: "Director de Departamento", tecnico: "Técnico", clinico: "Clínico" };
const roleIcons: Record<string, React.ReactNode> = { admin: <Shield className="w-4 h-4" />, director_departamento: <Shield className="w-4 h-4" />, tecnico: <UserCog className="w-4 h-4" />, clinico: <UserCheck className="w-4 h-4" /> };
const roleColors: Record<string, string> = { admin: "bg-violet-100 text-violet-700", director_departamento: "bg-indigo-100 text-indigo-700", tecnico: "bg-blue-100 text-blue-700", clinico: "bg-emerald-100 text-emerald-700" };

// Avatar color palette based on name initial
const avatarColors = [
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(nombre: string): string {
  const charCode = nombre.charCodeAt(0) || 0;
  return avatarColors[charCode % avatarColors.length];
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form with extended customization fields
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "tecnico" as UserRole,
    avatar: "",
    telefono: "",
    cargo: "",
    departamento: "",
  });

  const { data: usuarios = [] } = useUsuarios();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  const filtered = useMemo(() => usuarios.filter((u) => search === "" || u.nombre.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())), [usuarios, search]);

  const resetForm = () => {
    setForm({ nombre: "", email: "", password: "", rol: "tecnico", avatar: "", telefono: "", cargo: "", departamento: "" });
    setEditUser(null);
    setAvatarPreview("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setForm((prev) => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrEdit = async () => {
    if (!form.nombre || !form.email) { toast.error("Complete los campos obligatorios"); return; }
    if (!editUser && !form.password) { toast.error("La contraseña es obligatoria para nuevos usuarios"); return; }
    if (form.password && form.password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    const emailLower = form.email.toLowerCase();
    if (editUser) {
      const emailTaken = usuarios.some((u) => u.email.toLowerCase() === emailLower && u.id !== editUser.id);
      if (emailTaken) { toast.error("Ya existe otro usuario con ese email"); return; }
      const updates: Partial<User> = {
        nombre: form.nombre,
        email: emailLower,
        rol: form.rol,
        avatar: form.avatar || undefined,
      };
      if (form.password) updates.passwordHash = form.password;
      await updateUsuario.mutateAsync({ id: editUser.id, updates });
      toast.success("Usuario actualizado correctamente");
    } else {
      const emailTaken = usuarios.some((u) => u.email.toLowerCase() === emailLower);
      if (emailTaken) { toast.error("Ya existe un usuario con ese email"); return; }
      await createUsuario.mutateAsync({
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        nombre: form.nombre,
        email: emailLower,
        passwordHash: form.password,
        rol: form.rol,
        avatar: form.avatar || undefined,
        createdAt: new Date().toISOString(),
      } as User);
      toast.success("Usuario creado correctamente");
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (u: User) => {
    setEditUser(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol,
      avatar: u.avatar ?? "",
      telefono: "",
      cargo: "",
      departamento: "",
    });
    setAvatarPreview(u.avatar ?? "");
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteUser) {
      if (deleteUser.email === "cristian98arr@gmail.com") {
        toast.error("No se puede eliminar la cuenta administrador principal");
        setDeleteUser(null);
        return;
      }
      await deleteUsuario.mutateAsync(deleteUser.id);
      toast.success("Usuario eliminado");
      setDeleteUser(null);
    }
  };

  const handleResetPassword = async () => {
    if (resetPassUser && newPassword) {
      if (newPassword.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
      await updateUsuario.mutateAsync({ id: resetPassUser.id, updates: { passwordHash: newPassword } });
      toast.success("Contraseña actualizada");
      setResetPassUser(null);
      setNewPassword("");
    }
  };

  const isCurrentUser = (u: User) => currentUser?.id === u.id;
  const isMainAdmin = (u: User) => u.email === "cristian98arr@gmail.com";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500">Administración de roles, permisos y perfiles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">{editUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
              {/* Avatar selector */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${getAvatarColor(form.nombre || "?")}`}>
                      {form.nombre.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Foto de Perfil</p>
                  <p className="text-xs text-slate-500 mb-2">Click en el círculo para subir una imagen</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-3 h-3 mr-1" /> Subir
                    </Button>
                    {avatarPreview && (
                      <Button type="button" variant="ghost" size="sm" className="text-xs h-7 text-red-500" onClick={() => { setAvatarPreview(""); setForm((prev) => ({ ...prev, avatar: "" })); }}>
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@clinica.com" className="pl-9" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{editUser ? "Nueva contraseña (vacío = sin cambio)" : "Contraseña *"}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editUser ? "••••••••" : "Mínimo 6 caracteres"} />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="director_departamento">Director de Departamento</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="clinico">Clínico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+57 300 123 4567" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ej: Jefe de Mantenimiento" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Departamento / Área</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} placeholder="Ej: Mantenimiento Biomédico" className="pl-9" />
                </div>
              </div>

              <Button onClick={handleCreateOrEdit} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createUsuario.isPending || updateUsuario.isPending}>
                {editUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current user profile card */}
      {currentUser && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.nombre} className="w-14 h-14 rounded-full object-cover border-2 border-teal-200" />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getAvatarColor(currentUser.nombre)}`}>
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{currentUser.nombre}</p>
                <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                <Badge className={`text-[10px] mt-1 ${roleColors[currentUser.rol] ?? ""}`}>
                  <span className="flex items-center gap-1">{roleIcons[currentUser.rol]} {roleLabels[currentUser.rol] ?? currentUser.rol}</span>
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
                const u = usuarios.find((x) => x.id === currentUser.id);
                if (u) handleEdit(u);
              }}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Mi Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Información de Acceso</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-3 bg-teal-50 rounded-lg text-sm">
              <p className="font-medium text-teal-800">Acceso Demo</p>
              <p className="text-xs text-teal-600">Botón "Acceso Demo" en el login</p>
              <p className="text-xs text-teal-500 mt-1">Sesión de Técnico · 30 minutos</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-800">Cuenta Administrador</p>
              <p className="text-xs text-slate-500">Inicie sesión con su correo y contraseña</p>
              <p className="text-xs text-slate-400 mt-1">Acceso completo al sistema</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuarios por nombre o email..." className="pl-9" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="w-[160px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className={isCurrentUser(u) ? "bg-teal-50/40" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.nombre} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(u.nombre)}`}>
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-slate-800 block">{u.nombre}</span>
                          {isCurrentUser(u) && <span className="text-[10px] text-teal-600 font-medium">Tú</span>}
                          {isMainAdmin(u) && <span className="text-[10px] text-violet-600 font-medium">Admin Principal</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${roleColors[u.rol] ?? ""}`}>
                        <span className="flex items-center gap-1">{roleIcons[u.rol]} {roleLabels[u.rol] ?? u.rol}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(u)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setResetPassUser(u); setNewPassword(""); }} title="Resetear contraseña">
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                        {!isMainAdmin(u) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteUser(u)} title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{deleteUser?.nombre}</strong> ({deleteUser?.email}). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetPassUser} onOpenChange={(o) => { if (!o) setResetPassUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-lg">Resetear Contraseña</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">Usuario: <strong>{resetPassUser?.nombre}</strong> ({resetPassUser?.email})</p>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <Button onClick={handleResetPassword} className="w-full bg-teal-600 hover:bg-teal-700">Actualizar Contraseña</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
