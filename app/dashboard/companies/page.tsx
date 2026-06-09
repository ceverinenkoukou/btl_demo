"use client";

import { useState, useMemo } from "react";
import { mockCompanies, mockProducts, mockCampaigns } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, Plus, Package, Target, Mail, Phone, MapPin,
  Trash2, Edit2, ChevronRight, ChevronLeft, X, Check, Tag, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Company, Product } from "@/lib/types";

type ProductEntry = { name: string; sku: string; unit_price: string; description: string };
const EMPTY_PRODUCT: ProductEntry = { name: "", sku: "", unit_price: "", description: "" };

const CARD_GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([...mockCompanies]);
  const [products, setProducts]   = useState<Product[]>([...mockProducts]);

  // Dialog
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [step, setStep]                   = useState<1 | 2>(1);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Step-1 fields
  const [cName,    setCName]    = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cEmail,   setCEmail]   = useState("");
  const [cPhone,   setCPhone]   = useState("");

  // Step-2 fields
  const [entries, setEntries] = useState<ProductEntry[]>([{ ...EMPTY_PRODUCT }]);

  // Quick-add product dialog
  const [pOpen,    setPOpen]    = useState(false);
  const [pCompany, setPCompany] = useState<Company | null>(null);
  const [pName,    setPName]    = useState("");
  const [pSku,     setPSku]     = useState("");
  const [pPrice,   setPPrice]   = useState("");
  const [pDesc,    setPDesc]    = useState("");

  // ── Computed ─────────────────────────────────────────────────
  const stats = useMemo(() => companies.reduce((acc, c) => {
    acc[c.id] = {
      products:  products.filter(p => p.company_id === c.id).length,
      campaigns: mockCampaigns.filter(k => k.company_id === c.id).length,
    };
    return acc;
  }, {} as Record<string, { products: number; campaigns: number }>), [companies, products]);

  const kpis = {
    companies: companies.length,
    products:  products.length,
    campaigns: mockCampaigns.length,
  };

  // ── Helpers ───────────────────────────────────────────────────
  const initials  = (s: string) => s.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const gradient  = (id: string) => CARD_GRADIENTS[parseInt(id, 10) % CARD_GRADIENTS.length];
  const resetForm = () => { setCName(""); setCAddress(""); setCEmail(""); setCPhone(""); setEntries([{ ...EMPTY_PRODUCT }]); };

  // ── Dialog open helpers ──────────────────────────────────────
  const openCreate = () => {
    setEditingCompany(null);
    resetForm();
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setCName(company.name);
    setCAddress(company.address ?? "");
    setCEmail(company.contact_email ?? "");
    setCPhone(company.contact_phone ?? "");
    setEntries([{ ...EMPTY_PRODUCT }]);
    setStep(1);
    setDialogOpen(true);
  };

  // ── Actions ──────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette entreprise et tous ses produits ?")) return;
    const idxC = mockCompanies.findIndex(c => c.id === id);
    if (idxC >= 0) mockCompanies.splice(idxC, 1);
    mockProducts.splice(0, mockProducts.length, ...mockProducts.filter(p => p.company_id !== id));
    setCompanies(prev => prev.filter(c => c.id !== id));
    setProducts(prev => prev.filter(p => p.company_id !== id));
    toast.success("Entreprise supprimée");
  };

  const handleStep1Next = () => {
    if (!cName.trim()) { toast.error("Le nom de l'entreprise est requis"); return; }
    setStep(2);
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();

    if (editingCompany) {
      const updated: Company = {
        ...editingCompany,
        name:          cName.trim(),
        address:       cAddress.trim() || undefined,
        contact_email: cEmail.trim()   || undefined,
        contact_phone: cPhone.trim()   || undefined,
        updated_at:    now,
      };
      const idx = mockCompanies.findIndex(c => c.id === editingCompany.id);
      if (idx >= 0) mockCompanies[idx] = updated;
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? updated : c));

      // Add any new valid products
      const valid = entries.filter(e => e.name.trim());
      valid.forEach((entry, i) => {
        const p: Product = {
          id: String(Date.now() + i + 1),
          company_id:  editingCompany.id,
          name:        entry.name.trim(),
          description: entry.description.trim() || undefined,
          sku:         entry.sku.trim()         || undefined,
          unit_price:  parseFloat(entry.unit_price) || 0,
          is_active:   true,
          created_at:  now,
          updated_at:  now,
          company:     updated,
        };
        mockProducts.push(p);
        setProducts(prev => [...prev, p]);
      });

      toast.success(valid.length ? `Mis à jour + ${valid.length} produit(s) ajouté(s)` : "Entreprise mise à jour");
    } else {
      const newCompany: Company = {
        id:            String(Date.now()),
        name:          cName.trim(),
        address:       cAddress.trim() || undefined,
        contact_email: cEmail.trim()   || undefined,
        contact_phone: cPhone.trim()   || undefined,
        created_by:    user?.id,
        created_at:    now,
        updated_at:    now,
      };
      mockCompanies.push(newCompany);
      setCompanies(prev => [...prev, newCompany]);

      const valid = entries.filter(e => e.name.trim());
      valid.forEach((entry, i) => {
        const p: Product = {
          id:          String(Date.now() + i + 1),
          company_id:  newCompany.id,
          name:        entry.name.trim(),
          description: entry.description.trim() || undefined,
          sku:         entry.sku.trim()          || undefined,
          unit_price:  parseFloat(entry.unit_price) || 0,
          is_active:   true,
          created_at:  now,
          updated_at:  now,
          company:     newCompany,
        };
        mockProducts.push(p);
        setProducts(prev => [...prev, p]);
      });

      toast.success(`Entreprise créée avec ${valid.length} produit${valid.length > 1 ? "s" : ""}`);
    }
    setDialogOpen(false);
  };

  const openAddProduct = (company: Company) => {
    setPCompany(company);
    setPName(""); setPSku(""); setPPrice(""); setPDesc("");
    setPOpen(true);
  };

  const handleAddProduct = () => {
    if (!pName.trim()) { toast.error("Le nom du produit est requis"); return; }
    if (!pCompany) return;
    const now = new Date().toISOString();
    const newP: Product = {
      id:          String(Date.now()),
      company_id:  pCompany.id,
      name:        pName.trim(),
      sku:         pSku.trim()   || undefined,
      description: pDesc.trim()  || undefined,
      unit_price:  parseFloat(pPrice) || 0,
      is_active:   true,
      created_at:  now,
      updated_at:  now,
      company:     pCompany,
    };
    mockProducts.push(newP);
    setProducts(prev => [...prev, newP]);
    toast.success("Produit ajouté");
    setPOpen(false);
  };

  const addEntry    = () => setEntries(prev => [...prev, { ...EMPTY_PRODUCT }]);
  const removeEntry = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, f: keyof ProductEntry, v: string) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  // ── Company products list (for card expand) ──────────────────
  const companyProducts = (id: string) => products.filter(p => p.company_id === id);

  return (
    <div className="space-y-6">

      {/* ── Hero banner — Sky/Blue ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-sky-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_65%)]" />
        <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-32 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Entreprises</h1>
              </div>
              <p className="text-white/65 text-sm ml-12">Gérez vos clients et leurs produits associés</p>
            </div>
          </div>
          {/* KPI chips */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "🏢", label: "Entreprises",  value: kpis.companies  },
              { icon: "📦", label: "Produits",      value: kpis.products   },
              { icon: "🎯", label: "Campagnes",     value: kpis.campaigns  },
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {companies.length} entreprise{companies.length !== 1 ? "s" : ""} enregistrée{companies.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={openCreate}
          className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-200 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle entreprise
        </Button>
      </div>

      {/* ── Company grid ── */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-8 h-8 text-sky-200" />
          </div>
          <p className="font-semibold text-foreground mb-1">Aucune entreprise</p>
          <p className="text-xs text-muted-foreground mb-4">Commencez par créer votre première entreprise</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une entreprise
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {companies.map(company => {
            const s       = stats[company.id] ?? { products: 0, campaigns: 0 };
            const prods   = companyProducts(company.id);
            const grad    = gradient(company.id);
            return (
              <div key={company.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                {/* Card header */}
                <div className={cn("relative p-5 bg-gradient-to-br text-white overflow-hidden", grad)}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center text-lg font-black shrink-0">
                        {initials(company.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-base leading-tight truncate">{company.name}</h2>
                        <p className="text-white/60 text-xs mt-0.5">
                          Créée le {new Date(company.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(company)}
                        className="w-7 h-7 bg-white/20 hover:bg-white/35 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="w-7 h-7 bg-white/20 hover:bg-red-500/80 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3 relative z-10">
                    <span className="flex items-center gap-1 text-xs bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 font-semibold">
                      <Package className="w-3 h-3" />
                      {s.products} produit{s.products > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 font-semibold">
                      <Target className="w-3 h-3" />
                      {s.campaigns} campagne{s.campaigns > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="p-4 space-y-2">
                  {company.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      <span className="truncate">{company.contact_email}</span>
                    </div>
                  )}
                  {company.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      <span>{company.contact_phone}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-400 mt-0.5" />
                      <span className="line-clamp-2">{company.address}</span>
                    </div>
                  )}
                  {!company.contact_email && !company.contact_phone && !company.address && (
                    <p className="text-xs text-muted-foreground/50 italic">Aucune information de contact</p>
                  )}
                </div>

                {/* Products list */}
                <div className="border-t border-slate-50 px-4 pt-3 pb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Produits</p>
                  {prods.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      {prods.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 bg-sky-50 rounded-md flex items-center justify-center shrink-0">
                              <Package className="w-3 h-3 text-sky-500" />
                            </div>
                            <span className="text-xs font-medium text-foreground truncate">{p.name}</span>
                            {p.sku && <span className="text-xs text-muted-foreground/60 shrink-0">#{p.sku}</span>}
                          </div>
                          <span className="text-xs font-bold text-sky-700 shrink-0">
                            {p.unit_price.toLocaleString("fr-FR")} F
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic mb-3">Aucun produit encore</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddProduct(company)}
                    className="w-full rounded-xl border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 mb-3 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Ajouter un produit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick add product dialog ── */}
      <Dialog open={pOpen} onOpenChange={open => { if (!open) setPOpen(false); }}>
        <DialogContent className="max-w-sm p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white p-5 rounded-t-lg">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-white text-sm font-bold">
                    Ajouter un produit — {pCompany?.name}
                  </DialogTitle>
                </div>
                <button onClick={() => setPOpen(false)} className="w-6 h-6 bg-white/20 hover:bg-white/35 rounded-md flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nom du produit <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Ex: FreshUp Orange" value={pName} onChange={e => setPName(e.target.value)} className="pl-8 rounded-xl text-sm h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">SKU</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="FU-001" value={pSku} onChange={e => setPSku(e.target.value)} className="pl-8 rounded-xl text-sm h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Prix (F)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" min="0" placeholder="0" value={pPrice} onChange={e => setPPrice(e.target.value)} className="pl-8 rounded-xl text-sm h-9" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input placeholder="Description courte" value={pDesc} onChange={e => setPDesc(e.target.value)} className="rounded-xl text-sm h-9" />
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setPOpen(false)} className="flex-1 rounded-xl text-xs">Annuler</Button>
              <Button onClick={handleAddProduct} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs shadow-sm">
                <Check className="w-3.5 h-3.5 mr-1" /> Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Multi-step Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">

          {/* Dialog header */}
          <div className={cn(
            "relative overflow-hidden p-6 text-white",
            "bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600"
          )}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {step === 1 ? <Building2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  </div>
                  <DialogTitle className="text-white text-base font-bold">
                    {editingCompany ? "Modifier l'entreprise" : step === 1 ? "Nouvelle entreprise" : `Produits de ${cName}`}
                  </DialogTitle>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/35 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-3">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                      step === s ? "bg-white text-sky-700 border-white" :
                      step > s   ? "bg-white/30 border-white/50 text-white" :
                                    "bg-white/10 border-white/30 text-white/50")}>
                      {step > s ? <Check className="w-3 h-3" /> : s}
                    </div>
                    <span className={cn("text-xs", step === s ? "text-white font-semibold" : "text-white/50")}>
                      {s === 1 ? "Entreprise" : "Produits"}
                    </span>
                    {s < 2 && <div className="w-6 h-px bg-white/30 ml-1" />}
                  </div>
                ))}
              </div>
            </DialogHeader>
          </div>

          {/* ── Step 1: Company info ── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cname" className="text-sm font-semibold">Nom de l&apos;entreprise <span className="text-rose-500">*</span></Label>
                <Input
                  id="cname" placeholder="Ex: FreshUp Beverages"
                  value={cName} onChange={e => setCName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cemail" className="text-sm font-semibold">Email de contact</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cemail" type="email" placeholder="contact@entreprise.com"
                    value={cEmail} onChange={e => setCEmail(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cphone" className="text-sm font-semibold">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cphone" placeholder="+33 1 23 45 67 89"
                    value={cPhone} onChange={e => setCPhone(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caddress" className="text-sm font-semibold">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    id="caddress" placeholder="123 Rue du Commerce, Paris"
                    value={cAddress} onChange={e => setCAddress(e.target.value)}
                    rows={2}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStep1Next}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition-colors"
                >
                  Suivant : Produits
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Products ── */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-xs text-sky-700">
                <span className="font-semibold">📦 Produits de {cName}</span> — Ajoutez les produits directement liés à cette entreprise. Vous pourrez en ajouter d&apos;autres plus tard.
              </div>

              {/* Product rows */}
              <div className="space-y-3">
                {entries.map((entry, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Produit {i + 1}</span>
                      {entries.length > 1 && (
                        <button onClick={() => removeEntry(i)} className="w-5 h-5 rounded-md bg-rose-100 hover:bg-rose-200 flex items-center justify-center transition-colors">
                          <X className="w-3 h-3 text-rose-600" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Nom du produit *"
                          value={entry.name}
                          onChange={e => updateEntry(i, "name", e.target.value)}
                          className="rounded-lg text-sm h-8"
                        />
                      </div>
                      <Input
                        placeholder="SKU (ex: FU-001)"
                        value={entry.sku}
                        onChange={e => updateEntry(i, "sku", e.target.value)}
                        className="rounded-lg text-sm h-8"
                      />
                      <Input
                        placeholder="Prix unitaire (F)"
                        type="number"
                        min="0"
                        value={entry.unit_price}
                        onChange={e => updateEntry(i, "unit_price", e.target.value)}
                        className="rounded-lg text-sm h-8"
                      />
                      <div className="col-span-2">
                        <Input
                          placeholder="Description (optionnel)"
                          value={entry.description}
                          onChange={e => updateEntry(i, "description", e.target.value)}
                          className="rounded-lg text-sm h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addEntry}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-sky-200 hover:border-sky-400 text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un autre produit
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-muted-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition-colors shadow-md shadow-sky-200"
                >
                  <Check className="w-4 h-4" />
                  {editingCompany ? "Enregistrer" : "Créer l'entreprise"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
