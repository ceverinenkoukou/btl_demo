"use client";

import { useEffect, useState } from "react";
import { mockCampaigns, mockTastings, mockSales, mockCampaignTeam } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, UtensilsCrossed, Loader2, CheckCircle2,
  Frown, Meh, Smile, Laugh, Heart,
  Download, Search, Calendar, UserRound, Package, TrendingUp, X,
} from "lucide-react";
import type { Campaign, Product, Tasting, Sale, Gender, AgeRange, PurchaseIntent, TasteRating } from "@/lib/types";
import { cn } from "@/lib/utils";

const GMS_CAMPAIGN_ID = "3";
const CHR_CAMPAIGN_ID = "4";

type PromoGains = {
  canettesOffertes?: number; ticketsTombola?: number;
  packsOfferts?: number; goodies?: number;
  bouteillesOffertes?: number; tirages?: number;
};

function computePromoGains(campaignId: string, qty: number, promoType: "canettes" | "packs"): PromoGains | null {
  if (campaignId === GMS_CAMPAIGN_ID) {
    if (promoType === "canettes") return { canettesOffertes: Math.floor(qty / 4), ticketsTombola: Math.floor(qty / 6) };
    return { packsOfferts: Math.floor(qty / 4), goodies: Math.floor(qty / 4) };
  }
  if (campaignId === CHR_CAMPAIGN_ID) return { bouteillesOffertes: Math.floor(qty / 3), tirages: Math.floor(qty / 9) };
  return null;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

const ageOptions: { value: AgeRange; label: string }[] = [
  { value: "18-25", label: "18-25 ans" },
  { value: "26-35", label: "26-35 ans" },
  { value: "36-45", label: "36-45 ans" },
  { value: "46-55", label: "46-55 ans" },
  { value: "55+", label: "55+ ans" },
];

const intentOptions: { value: PurchaseIntent; label: string; color: string }[] = [
  { value: "low", label: "Faible", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "medium", label: "Moyenne", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "high", label: "Forte", color: "bg-green-100 text-green-700 border-green-200" },
];

const ratingEmojis: { value: TasteRating; icon: React.ReactNode; label: string }[] = [
  { value: "1", icon: <Frown className="w-8 h-8" />, label: "Mauvais" },
  { value: "2", icon: <Meh className="w-8 h-8" />, label: "Bof" },
  { value: "3", icon: <Smile className="w-8 h-8" />, label: "Correct" },
  { value: "4", icon: <Laugh className="w-8 h-8" />, label: "Bon" },
  { value: "5", icon: <Heart className="w-8 h-8" />, label: "Excellent" },
];

export default function TastingsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedTasting, setSelectedTasting] = useState<Tasting | null>(null);
  const [formData, setFormData] = useState({
    campaign_id: "",
    product_id: "",
    gender: "" as Gender | "",
    age_range: "" as AgeRange | "",
    taste_rating: "" as TasteRating | "",
    purchase_intent: "" as PurchaseIntent | "",
    has_purchased: false,
    quantity: 1,
    notes: "",
  });
  const [gmsPromoType, setGmsPromoType] = useState<"canettes" | "packs">("canettes");
  const [goodieGiven, setGoodieGiven]   = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let activeCampaigns = mockCampaigns.filter(c => c.status === "active");
      if (user?.role === "hostess") {
        const assignedIds = new Set(
          mockCampaignTeam
            .filter(m => m.user_id === user.id && m.role === "hostess")
            .map(m => m.campaign_id)
        );
        activeCampaigns = activeCampaigns.filter(c => assignedIds.has(c.id));
      }
      setCampaigns(activeCampaigns);
      setTastings([...mockTastings]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignChange = (campaignId: string) => {
    setFormData({ ...formData, campaign_id: campaignId, product_id: "", quantity: 1 });
    setGmsPromoType("canettes");
    setGoodieGiven(false);
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign?.products) {
      setProducts(campaign.products);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campaign_id || !formData.product_id || !formData.gender ||
        !formData.age_range || (!isPromoCampaign && (!formData.taste_rating || !formData.purchase_intent))) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);

    try {
      // Build promo note from automatic gains
      const gains = computePromoGains(formData.campaign_id, formData.quantity, gmsPromoType);
      let promoNote = "";
      if (isGMSCampaign) {
        promoNote = gmsPromoType === "canettes"
          ? `${formData.quantity} CAN → ${gains?.canettesOffertes ?? 0} offerte(s), ${gains?.ticketsTombola ?? 0} ticket(s) tombola`
          : `${formData.quantity} packs → ${gains?.packsOfferts ?? 0} pack offert, ${gains?.goodies ?? 0} goodie`;
        if (goodieGiven) promoNote += " | Goodie: ✓";
      } else if (isCHRCampaign) {
        promoNote = `${formData.quantity} bouteilles → ${gains?.bouteillesOffertes ?? 0} offerte(s), ${gains?.tirages ?? 0} tirage(s)`;
      }

      const newTasting: Tasting = {
        id: String(Date.now()),
        campaign_id: formData.campaign_id,
        hostess_id: user?.id || "",
        product_id: formData.product_id,
        gender: formData.gender as Gender,
        age_range: formData.age_range as AgeRange,
        taste_rating: (isPromoCampaign ? "3" : formData.taste_rating) as TasteRating,
        purchase_intent: (isPromoCampaign ? "high" : formData.purchase_intent) as PurchaseIntent,
        has_purchased: isPromoCampaign ? true : formData.has_purchased,
        notes: promoNote ? (formData.notes ? `${promoNote} — ${formData.notes}` : promoNote) : formData.notes,
        created_at: new Date().toISOString(),
      };
      setTastings(prev => [newTasting, ...prev]);

      if (newTasting.has_purchased) {
        const product = products.find((p) => p.id === formData.product_id);
        const campaign = campaigns.find((c) => c.id === formData.campaign_id);
        if (product) {
          const newSale: Sale = {
            id: String(Date.now() + 1),
            campaign_id: formData.campaign_id,
            tasting_id: newTasting.id,
            hostess_id: user?.id || "",
            product_id: formData.product_id,
            quantity: formData.quantity,
            unit_price: product.unit_price,
            total_amount: formData.quantity * product.unit_price,
            validated: false,
            created_at: new Date().toISOString(),
            campaign,
            product,
          };
          mockSales.unshift(newSale);
        }
      }

      toast.success("Dégustation enregistrée!");
      setDialogOpen(false);
      setFormData({
        campaign_id: formData.campaign_id,
        product_id: "",
        gender: "",
        age_range: "",
        taste_rating: "",
        purchase_intent: "",
        has_purchased: false,
        quantity: 1,
        notes: "",
      });
      setGoodieGiven(false);
      fetchData();
    } catch (error) {
      console.error("Error creating tasting:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const openDialog = () => {
    if (!formData.campaign_id && campaigns.length === 1) {
      handleCampaignChange(campaigns[0].id);
    }
    setDialogOpen(true);
  };

  const isHostess = user?.role === "hostess";
  const isAdmin = user?.role === "admin";
  const isGMSCampaign   = formData.campaign_id === GMS_CAMPAIGN_ID;
  const isCHRCampaign   = formData.campaign_id === CHR_CAMPAIGN_ID;
  const isPromoCampaign = isGMSCampaign || isCHRCampaign;
  const promoGains      = computePromoGains(formData.campaign_id, formData.quantity, gmsPromoType);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTastings = tastings.filter(t => {
    const matchesCampaign = !selectedCampaign || selectedCampaign === "all" || t.campaign_id === selectedCampaign;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (t.product?.name ?? "").toLowerCase().includes(q) ||
      (t.campaign?.name ?? "").toLowerCase().includes(q);
    return matchesCampaign && matchesSearch;
  });

  const stats = {
    total: tastings.length,
    purchased: tastings.filter(t => t.has_purchased).length,
    conversionRate: tastings.length > 0
      ? Math.round((tastings.filter(t => t.has_purchased).length / tastings.length) * 100)
      : 0,
    avgRating: tastings.length > 0
      ? (tastings.reduce((s, t) => s + Number(t.taste_rating), 0) / tastings.length).toFixed(1)
      : "—",
  };

  const downloadCSV = () => {
    const headers = ["ID", "Campagne", "Produit", "Genre", "Tranche d'âge", "Note goût", "Intention achat", "Achat réalisé", "Notes", "Date"];
    const rows = filteredTastings.map(t => [
      t.id,
      t.campaign?.name ?? "",
      t.product?.name ?? "",
      t.gender === "male" ? "Homme" : t.gender === "female" ? "Femme" : "Autre",
      t.age_range,
      t.taste_rating,
      t.purchase_intent === "high" ? "Forte" : t.purchase_intent === "medium" ? "Moyenne" : "Faible",
      t.has_purchased ? "Oui" : "Non",
      t.notes ?? "",
      new Date(t.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `degustations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredTastings.length} dégustation${filteredTastings.length > 1 ? "s" : ""} exportée${filteredTastings.length > 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-6">

      {/* ── Admin hero banner ── */}
      {isAdmin ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-500 text-white shadow-2xl shadow-indigo-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-28 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                    <UtensilsCrossed className="w-4.5 h-4.5" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dégustations</h1>
                </div>
                <p className="text-white/65 text-sm ml-12">Suivi en temps réel de toutes les dégustations</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-sm font-semibold transition-colors backdrop-blur-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exporter CSV</span>
                </button>
                <button
                  onClick={openDialog}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-white/90 text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nouvelle dégustation</span>
                </button>
              </div>
            </div>
            {/* KPI chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Dégustations",  value: stats.total,          sub: "enregistrées", icon: "🍷" },
                { label: "Achats",        value: stats.purchased,      sub: "réalisés",     icon: "🛒" },
                { label: "Conversion",    value: `${stats.conversionRate}%`, sub: "taux", icon: "📈" },
                { label: "Note moyenne",  value: stats.avgRating,      sub: "/ 5",          icon: "⭐" },
              ].map((s, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/20">
                  <div className="text-base mb-1">{s.icon}</div>
                  <div className="text-xl font-bold leading-none">
                    {s.value}
                    <span className="text-xs font-normal text-white/55 ml-1">{s.sub}</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Non-admin header */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dégustations</h1>
            <p className="text-muted-foreground mt-1">Enregistrez les dégustations et activations promo de vos campagnes</p>
          </div>
          <Button size="lg" className="w-full sm:w-auto" onClick={openDialog}>
            <Plus className="w-5 h-5 mr-2" />
            {isPromoCampaign ? "Nouvelle activation" : "Nouvelle dégustation"}
          </Button>
        </div>
      )}

      {/* Non-admin stats row */}
      {!isAdmin && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: stats.total,               label: "Dégustations", color: "text-indigo-600" },
            { value: stats.purchased,            label: "Achats",       color: "text-emerald-600" },
            { value: `${stats.conversionRate}%`, label: "Conversion",   color: "text-violet-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher produit, campagne..."
            className="pl-9 rounded-xl border-slate-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-52 rounded-xl border-slate-200">
            <SelectValue placeholder="Toutes les campagnes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les campagnes</SelectItem>
            {mockCampaigns.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isAdmin && (
          <Button variant="outline" className="rounded-xl" onClick={openDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {isPromoCampaign ? "Activation" : "Nouvelle"}
          </Button>
        )}
        {isAdmin && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV ({filteredTastings.length})
          </button>
        )}
      </div>

      {/* ── Tastings grid ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            {isHostess ? "Mes dégustations" : "Toutes les dégustations"}
          </h3>
          <span className="text-xs text-muted-foreground bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            {filteredTastings.length} résultat{filteredTastings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredTastings.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Aucun résultat</p>
            <p className="text-xs text-muted-foreground">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTastings.map(tasting => {
              const intent = intentOptions.find(i => i.value === tasting.purchase_intent);
              const rating = ratingEmojis.find(r => r.value === tasting.taste_rating);
              const stripColor = tasting.purchase_intent === "high"
                ? "bg-emerald-400" : tasting.purchase_intent === "medium"
                ? "bg-amber-400" : "bg-rose-400";
              return (
                <button
                  key={tasting.id}
                  type="button"
                  onClick={() => setSelectedTasting(tasting)}
                  className="relative text-left rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-indigo-200 transition-all group overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripColor}`} />
                  <div className="pl-4 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-indigo-100 transition-colors">
                          {rating?.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{tasting.product?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{tasting.campaign?.name}</p>
                        </div>
                      </div>
                      {tasting.has_purchased && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Achat ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {tasting.gender === "male" ? "♂ Homme" : tasting.gender === "female" ? "♀ Femme" : "Autre"}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tasting.age_range} ans</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tasting.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {"⭐".repeat(Number(tasting.taste_rating))}
                        <span className="text-muted-foreground ml-1">{rating?.label}</span>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border", intent?.color)}>
                        {intent?.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New tasting form dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isPromoCampaign ? "Enregistrer une activation promo" : "Enregistrer une dégustation"}
            </DialogTitle>
            <DialogDescription>
              {isPromoCampaign
                ? isGMSCampaign
                  ? "Saisissez l'achat client — les gains GMS sont calculés automatiquement"
                  : "Saisissez l'achat client — les gains CHR sont calculés automatiquement"
                : "Saisissez les informations du client"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Campagne *</Label>
                <Select value={formData.campaign_id} onValueChange={handleCampaignChange}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Produit *</Label>
                <Select value={formData.product_id} onValueChange={v => setFormData({ ...formData, product_id: v })} disabled={!formData.campaign_id}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sexe *</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v as Gender })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tranche d&apos;âge *</Label>
                <Select value={formData.age_range} onValueChange={v => setFormData({ ...formData, age_range: v as AgeRange })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{ageOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {isPromoCampaign ? (
              <>
                {/* ── Promo mechanic reminder ── */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                  <p className="text-xs font-bold text-amber-800 mb-1.5">🏷 Mécanique promotionnelle</p>
                  {isGMSCampaign ? (
                    <div className="space-y-0.5 text-xs text-amber-700">
                      <p>🍺 4 CAN achetées → 1 CAN offerte</p>
                      <p>🎟 6 CAN achetées → 1 ticket tombola</p>
                      <p>📦 4 packs achetés → 1 pack offert + 1 goodie</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-xs text-amber-700">
                      <p>🍾 3 bouteilles → 1 bouteille offerte</p>
                      <p>🎟 9 bouteilles → 1 tirage tombola</p>
                      <p>🏆 Finale 19 juil. — ticket tombola spécial</p>
                    </div>
                  )}
                </div>

                {/* ── GMS: type d'achat toggle ── */}
                {isGMSCampaign && (
                  <div className="space-y-2">
                    <Label>Type d&apos;achat *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setGmsPromoType("canettes")}
                        className={cn("py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2",
                          gmsPromoType === "canettes" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-border hover:border-amber-300")}>
                        🍺 Canettes 33cl
                      </button>
                      <button type="button" onClick={() => setGmsPromoType("packs")}
                        className={cn("py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2",
                          gmsPromoType === "packs" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border hover:border-orange-300")}>
                        📦 Packs ×6
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Quantité ── */}
                <div className="space-y-2">
                  <Label>
                    Quantité achetée *
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({isGMSCampaign ? (gmsPromoType === "canettes" ? "canettes" : "packs") : "bouteilles"})
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                      className="w-10 h-10 rounded-xl border-2 border-input flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors">−</button>
                    <Input type="number" min="1" value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 text-center font-semibold text-lg h-10" />
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                      className="w-10 h-10 rounded-xl border-2 border-input flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors">+</button>
                  </div>
                </div>

                {/* ── Auto-computed gains ── */}
                {promoGains && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                    <p className="text-xs font-bold text-green-800 mb-3 flex items-center gap-1.5">
                      🎁 Gains calculés automatiquement
                    </p>
                    <div className="space-y-2">
                      {isGMSCampaign && gmsPromoType === "canettes" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">🍺 Canettes offertes</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.canettesOffertes ?? 0) > 0 ? "text-amber-600" : "text-slate-300")}>
                              {promoGains.canettesOffertes ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">🎟 Tickets tombola</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.ticketsTombola ?? 0) > 0 ? "text-pink-600" : "text-slate-300")}>
                              {promoGains.ticketsTombola ?? 0}
                            </span>
                          </div>
                        </>
                      )}
                      {isGMSCampaign && gmsPromoType === "packs" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">📦 Packs offerts</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.packsOfferts ?? 0) > 0 ? "text-orange-600" : "text-slate-300")}>
                              {promoGains.packsOfferts ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">🎁 Goodies distribués</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.goodies ?? 0) > 0 ? "text-violet-600" : "text-slate-300")}>
                              {promoGains.goodies ?? 0}
                            </span>
                          </div>
                        </>
                      )}
                      {isCHRCampaign && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">🍾 Bouteilles offertes</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.bouteillesOffertes ?? 0) > 0 ? "text-emerald-600" : "text-slate-300")}>
                              {promoGains.bouteillesOffertes ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">🎟 Tirages tombola</span>
                            <span className={cn("text-2xl font-bold tabular-nums", (promoGains.tirages ?? 0) > 0 ? "text-blue-600" : "text-slate-300")}>
                              {promoGains.tirages ?? 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── GMS: goodie distribué (manuel) ── */}
                {isGMSCampaign && (
                  <div className="space-y-2">
                    <Label>Goodie distribué</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setGoodieGiven(false)}
                        className={cn("py-3 rounded-xl border-2 font-medium transition-all",
                          !goodieGiven ? "border-slate-400 bg-slate-50" : "border-border hover:border-slate-300")}>
                        Non
                      </button>
                      <button type="button" onClick={() => setGoodieGiven(true)}
                        className={cn("py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                          goodieGiven ? "border-violet-500 bg-violet-50 text-violet-700" : "border-border hover:border-violet-400")}>
                        🎁 Oui, distribué
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* ── Standard tasting form ── */}
                <div className="space-y-3">
                  <Label>Note du goût *</Label>
                  <div className="flex justify-between gap-2">
                    {ratingEmojis.map(r => (
                      <button key={r.value} type="button" onClick={() => setFormData({ ...formData, taste_rating: r.value })}
                        className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all flex-1",
                          formData.taste_rating === r.value ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-border hover:border-indigo-300")}>
                        {r.icon}
                        <span className="text-xs font-medium">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Intention d&apos;achat *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {intentOptions.map(o => (
                      <button key={o.value} type="button" onClick={() => setFormData({ ...formData, purchase_intent: o.value })}
                        className={cn("py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          formData.purchase_intent === o.value ? o.color + " border-current" : "border-border hover:border-indigo-300")}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Le client a-t-il acheté?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, has_purchased: false })}
                      className={cn("py-4 rounded-xl border-2 font-medium transition-all",
                        !formData.has_purchased ? "border-slate-400 bg-slate-50" : "border-border hover:border-slate-300")}>
                      Non
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, has_purchased: true })}
                      className={cn("py-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                        formData.has_purchased ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border hover:border-emerald-400")}>
                      <CheckCircle2 className="w-5 h-5" />
                      Oui, acheté!
                    </button>
                  </div>
                </div>
                {formData.has_purchased && (
                  <div className="space-y-2">
                    <Label>Quantité achetée *</Label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                        className="w-10 h-10 rounded-xl border-2 border-input flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors">−</button>
                      <Input type="number" min="1" value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-20 text-center font-semibold text-lg h-10" />
                      <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                        className="w-10 h-10 rounded-xl border-2 border-input flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors">+</button>
                      {(() => {
                        const p = products.find(pr => pr.id === formData.product_id);
                        return p ? (
                          <span className="text-sm text-muted-foreground">
                            = <span className="font-semibold text-foreground">{(formData.quantity * p.unit_price).toFixed(2)} €</span>
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Commentaires, observations..." rows={2} />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" disabled={saving}>
              {saving
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enregistrement...</>
                : <><CheckCircle2 className="w-5 h-5 mr-2" />{isPromoCampaign ? "Enregistrer l'activation" : "Enregistrer la dégustation"}</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Tasting detail dialog ── */}
      {selectedTasting && (() => {
        const campaignTastings = tastings.filter(t => t.campaign_id === selectedTasting.campaign_id);
        const avgRating = campaignTastings.length > 0
          ? (campaignTastings.reduce((s, t) => s + Number(t.taste_rating), 0) / campaignTastings.length).toFixed(1)
          : "—";
        const convRate = campaignTastings.length > 0
          ? Math.round((campaignTastings.filter(t => t.has_purchased).length / campaignTastings.length) * 100)
          : 0;
        const sale = mockSales.find(s => s.tasting_id === selectedTasting.id);
        const intent = intentOptions.find(i => i.value === selectedTasting.purchase_intent);
        const rating = ratingEmojis.find(r => r.value === selectedTasting.taste_rating);
        const ratingNum = Number(selectedTasting.taste_rating);
        const intentSteps = [
          { value: "low",    label: "Faible",  dotColor: "bg-rose-400",   textColor: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-200"   },
          { value: "medium", label: "Moyenne", dotColor: "bg-amber-400",  textColor: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200"  },
          { value: "high",   label: "Forte",   dotColor: "bg-emerald-400",textColor: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200" },
        ];
        const activeIntentIdx = intentSteps.findIndex(s => s.value === selectedTasting.purchase_intent);

        return (
          <Dialog open={!!selectedTasting} onOpenChange={open => { if (!open) setSelectedTasting(null); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0">

              {/* ── Hero banner ── */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-500 text-white px-6 pt-6 pb-5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
                {/* Close button */}
                <button
                  onClick={() => setSelectedTasting(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="relative z-10 flex items-start gap-4">
                  {/* Big emoji */}
                  <div className="w-16 h-16 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-lg">
                    {rating?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/55 font-medium uppercase tracking-widest mb-0.5">Dégustation</p>
                    <h2 className="text-lg font-bold leading-tight truncate">{selectedTasting.product?.name ?? "—"}</h2>
                    <p className="text-sm text-white/70 truncate">{selectedTasting.campaign?.name}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-white/55 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedTasting.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      <span className="opacity-50">·</span>
                      {new Date(selectedTasting.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                {/* Rating star track */}
                <div className="relative z-10 flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all",
                        i <= ratingNum ? "bg-white text-amber-500 shadow-sm" : "bg-white/20 text-white/40")}>
                        ★
                      </div>
                    ))}
                  </div>
                  <span className="text-white/70 text-xs font-medium">{rating?.label} ({ratingNum}/5)</span>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">

                {/* Profil dégustateur */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <UserRound className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Profil dégustateur</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
                      {selectedTasting.gender === "male" ? "♂" : selectedTasting.gender === "female" ? "♀" : "⚥"}
                      {selectedTasting.gender === "male" ? "Homme" : selectedTasting.gender === "female" ? "Femme" : "Autre"}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-sm font-medium">
                      🎂 {selectedTasting.age_range} ans
                    </span>
                  </div>
                </div>

                {/* Intention d'achat — 3-step tracker */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Intention d&apos;achat</p>
                  </div>
                  <div className="relative flex items-center gap-0">
                    {intentSteps.map((step, idx) => {
                      const isActive = idx === activeIntentIdx;
                      const isPast = idx < activeIntentIdx;
                      return (
                        <div key={step.value} className="flex-1 flex flex-col items-center relative">
                          {/* connector line */}
                          {idx < intentSteps.length - 1 && (
                            <div className={cn("absolute top-[13px] left-1/2 w-full h-0.5 z-0",
                              idx < activeIntentIdx ? "bg-emerald-300" : "bg-slate-200")} />
                          )}
                          {/* dot */}
                          <div className={cn("relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                            isActive
                              ? `${step.dotColor} border-transparent text-white shadow-md scale-110`
                              : isPast
                              ? "bg-emerald-400 border-emerald-400 text-white"
                              : "bg-white border-slate-200 text-slate-300")}>
                            {isPast ? "✓" : isActive ? "●" : "○"}
                          </div>
                          {/* label */}
                          <p className={cn("text-xs mt-1.5 font-semibold",
                            isActive ? step.textColor : isPast ? "text-emerald-600" : "text-slate-400")}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achat réalisé */}
                {selectedTasting.has_purchased ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-4 shadow-md shadow-emerald-100">
                    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-base">Achat réalisé ✓</p>
                          {sale && <p className="text-emerald-100 text-xs">{sale.quantity} unité{sale.quantity > 1 ? "s" : ""} × {sale.unit_price.toFixed(2)} €</p>}
                        </div>
                      </div>
                      {sale && (
                        <div className="text-right">
                          <p className="text-2xl font-black">{sale.total_amount.toFixed(2)} €</p>
                          <p className="text-emerald-200 text-xs">total</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500 text-sm">Aucun achat</p>
                      <p className="text-xs text-slate-400">Le client n'a pas acheté lors de cette dégustation</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedTasting.notes && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3.5">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-1.5">📝 Notes</p>
                    <p className="text-sm text-amber-900 leading-relaxed">{selectedTasting.notes}</p>
                  </div>
                )}

                {/* Campaign stats */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-400" />
                    Stats · {selectedTasting.campaign?.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: campaignTastings.length, label: "Dégustations", icon: "🍷", color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
                      { value: avgRating,               label: "Note moyenne",  icon: "⭐", color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"  },
                      { value: `${convRate}%`,          label: "Conversion",    icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    ].map((s, i) => (
                      <div key={i} className={cn("rounded-xl border p-3 text-center", s.bg, s.border)}>
                        <div className="text-xl mb-0.5">{s.icon}</div>
                        <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
