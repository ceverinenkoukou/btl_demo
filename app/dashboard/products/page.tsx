"use client";

import { useState, useMemo } from "react";
import { mockProducts, mockCompanies } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package, Plus, Building2, Edit2, Trash2, X, Check,
  Tag, DollarSign, FileText, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, Company } from "@/lib/types";

const COMPANY_GRADIENTS = [
  { from: "from-sky-500",    to: "to-blue-600",   light: "bg-sky-50",    border: "border-sky-100",    text: "text-sky-700",    dot: "bg-sky-400"    },
  { from: "from-violet-500", to: "to-purple-600",  light: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", dot: "bg-violet-400" },
  { from: "from-emerald-500",to: "to-teal-600",    light: "bg-emerald-50",border: "border-emerald-100",text: "text-emerald-700",dot: "bg-emerald-400"},
  { from: "from-orange-500", to: "to-amber-600",   light: "bg-orange-50", border: "border-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
  { from: "from-pink-500",   to: "to-rose-600",    light: "bg-pink-50",   border: "border-pink-100",   text: "text-pink-700",   dot: "bg-pink-400"   },
];

type FormData = {
  company_id: string;
  name: string;
  sku: string;
  unit_price: string;
  description: string;
  is_active: boolean;
};

const EMPTY_FORM: FormData = {
  company_id: "",
  name: "",
  sku: "",
  unit_price: "",
  description: "",
  is_active: true,
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [products,  setProducts]  = useState<Product[]>([...mockProducts]);
  const [companies]               = useState<Company[]>([...mockCompanies]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Product | null>(null);
  const [form,       setForm]       = useState<FormData>({ ...EMPTY_FORM });
  const [filterCo,   setFilterCo]  = useState<string>("all");

  // ── Computed ─────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const source = filterCo === "all"
      ? products
      : products.filter(p => p.company_id === filterCo);

    return companies
      .map((company, idx) => ({
        company,
        style: COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length],
        items: source.filter(p => p.company_id === company.id),
      }))
      .filter(g => g.items.length > 0);
  }, [products, companies, filterCo]);

  const kpis = useMemo(() => ({
    total:    products.length,
    active:   products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    companies: new Set(products.map(p => p.company_id)).size,
  }), [products]);

  // ── Helpers ───────────────────────────────────────────────────
  const field = (k: keyof FormData, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      company_id:  p.company_id,
      name:        p.name,
      sku:         p.sku ?? "",
      unit_price:  String(p.unit_price),
      description: p.description ?? "",
      is_active:   p.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const idx = mockProducts.findIndex(p => p.id === id);
    if (idx >= 0) mockProducts.splice(idx, 1);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Produit supprimé");
  };

  const toggleActive = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, is_active: !p.is_active, updated_at: new Date().toISOString() };
      const idx = mockProducts.findIndex(x => x.id === id);
      if (idx >= 0) mockProducts[idx] = updated;
      return updated;
    }));
  };

  const handleSubmit = () => {
    if (!form.company_id) { toast.error("Sélectionnez une entreprise"); return; }
    if (!form.name.trim()) { toast.error("Le nom est requis"); return; }

    const now      = new Date().toISOString();
    const company  = companies.find(c => c.id === form.company_id);
    const price    = parseFloat(form.unit_price) || 0;

    if (editing) {
      const updated: Product = {
        ...editing,
        company_id:  form.company_id,
        name:        form.name.trim(),
        sku:         form.sku.trim()         || undefined,
        description: form.description.trim() || undefined,
        unit_price:  price,
        is_active:   form.is_active,
        updated_at:  now,
        company,
      };
      const idx = mockProducts.findIndex(p => p.id === editing.id);
      if (idx >= 0) mockProducts[idx] = updated;
      setProducts(prev => prev.map(p => p.id === editing.id ? updated : p));
      toast.success("Produit mis à jour");
    } else {
      const newProduct: Product = {
        id:          String(Date.now()),
        company_id:  form.company_id,
        name:        form.name.trim(),
        sku:         form.sku.trim()         || undefined,
        description: form.description.trim() || undefined,
        unit_price:  price,
        is_active:   form.is_active,
        created_at:  now,
        updated_at:  now,
        company,
      };
      mockProducts.push(newProduct);
      setProducts(prev => [...prev, newProduct]);
      toast.success("Produit créé");
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* ── Hero banner — Lime/Green ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-600 text-white shadow-2xl shadow-green-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_65%)]" />
        <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-32 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Produits</h1>
          </div>
          <p className="text-white/65 text-sm ml-12 mb-6">Gérez les produits par entreprise cliente</p>

          {/* KPI chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "📦", label: "Total produits",  value: kpis.total    },
              { icon: "✅", label: "Actifs",           value: kpis.active   },
              { icon: "⏸️", label: "Inactifs",         value: kpis.inactive },
              { icon: "🏢", label: "Entreprises",      value: kpis.companies},
            ].map((s, i) => (
              <div key={i} className="bg-white/18 backdrop-blur-sm rounded-xl p-3.5 border border-white/20">
                <div className="text-base mb-1">{s.icon}</div>
                <div className="text-2xl font-bold leading-none">{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Select value={filterCo} onValueChange={setFilterCo}>
          <SelectTrigger className="w-52 rounded-xl">
            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Toutes les entreprises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={openCreate}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md shadow-green-200 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {/* ── Grouped by company ── */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8 text-green-200" />
          </div>
          <p className="font-semibold text-foreground mb-1">Aucun produit</p>
          <p className="text-xs text-muted-foreground mb-4">Commencez par ajouter un produit</p>
          <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ company, style, items }) => (
            <div key={company.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Company header */}
              <div className={cn(
                "flex items-center justify-between gap-3 px-5 py-4 border-b",
                style.light, style.border
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shrink-0", style.from, style.to)}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">{company.name}</h2>
                    <p className={cn("text-xs font-medium", style.text)}>
                      {items.length} produit{items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full", style.dot)} />
              </div>

              {/* Product cards grid */}
              <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(product => (
                  <div
                    key={product.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all group",
                      product.is_active
                        ? "border-slate-100 bg-white hover:border-green-200 hover:shadow-sm"
                        : "border-slate-100 bg-slate-50/60 opacity-60"
                    )}
                  >
                    {/* Product header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white",
                          style.from, style.to
                        )}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">#{product.sku}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className={cn("text-base font-black", style.text)}>
                        {product.unit_price.toLocaleString("fr-FR")} F
                      </span>
                      <button
                        onClick={() => toggleActive(product.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                          product.is_active
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {product.is_active
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Actif</>
                          : <><ToggleLeft  className="w-3.5 h-3.5" /> Inactif</>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Form dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-md p-0">

          {/* Dialog header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-lime-600 via-green-600 to-emerald-600 text-white p-5 rounded-t-lg">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <DialogTitle className="text-white text-base font-bold">
                    {editing ? "Modifier le produit" : "Nouveau produit"}
                  </DialogTitle>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/35 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </DialogHeader>
          </div>

          {/* Form body */}
          <div className="p-5 space-y-4">
            {/* Company */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Entreprise <span className="text-rose-500">*</span></Label>
              <Select value={form.company_id} onValueChange={v => field("company_id", v)}>
                <SelectTrigger className="rounded-xl">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Nom du produit <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: FreshUp Orange"
                  value={form.name}
                  onChange={e => field("name", e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            {/* SKU + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">SKU</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="FU-001"
                    value={form.sku}
                    onChange={e => field("sku", e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Prix (F)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number" min="0" placeholder="0"
                    value={form.unit_price}
                    onChange={e => field("unit_price", e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  placeholder="Description courte du produit"
                  value={form.description}
                  onChange={e => field("description", e.target.value)}
                  rows={2}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold">Produit actif</span>
              <button
                onClick={() => field("is_active", !form.is_active)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                  form.is_active
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                )}
              >
                {form.is_active
                  ? <><ToggleRight className="w-4 h-4" /> Actif</>
                  : <><ToggleLeft  className="w-4 h-4" /> Inactif</>
                }
              </button>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl text-muted-foreground"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md shadow-green-200"
              >
                <Check className="w-4 h-4 mr-2" />
                {editing ? "Enregistrer" : "Créer le produit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
