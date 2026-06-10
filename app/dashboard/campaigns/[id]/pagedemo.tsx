"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { mockCampaigns, mockTastings, mockSales, mockCampaignTeam, export33CampaignSites } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, MapPin, Target, Users, Building2, Loader2,
  UtensilsCrossed, CheckCircle2, ShoppingCart, TrendingUp, BarChart3,
  Package, Sparkles, Edit,
} from "lucide-react";
import type {
  Campaign, Tasting, Sale, Gender, AgeRange, TasteRating, PurchaseIntent,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Beer, Gift } from 'lucide-react';

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

const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  draft:     { label: "Brouillon",  badge: "bg-slate-100 text-slate-600 border border-slate-200" },
  planned:   { label: "Planifiée",  badge: "bg-blue-100 text-blue-700 border border-blue-200" },
  active:    { label: "Active",     badge: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  paused:    { label: "En pause",   badge: "bg-amber-100 text-amber-700 border border-amber-200" },
  completed: { label: "Terminée",   badge: "bg-violet-100 text-violet-700 border border-violet-200" },
  cancelled: { label: "Annulée",    badge: "bg-red-100 text-red-700 border border-red-200" },
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    gender: "" as Gender | "",
    age_range: "" as AgeRange | "",
    taste_rating: "" as TasteRating | "",
    purchase_intent: "" as PurchaseIntent | "",
    has_purchased: false,
    quantity: 1,
    notes: "",
    client_name: "",
  });
  const [gmsPromoType, setGmsPromoType] = useState<"canettes" | "packs">("canettes");
  const [goodieGiven, setGoodieGiven]   = useState(false);

  useEffect(() => {
    const found = mockCampaigns.find((c) => c.id === id);
    if (!found) {
      router.push("/dashboard/campaigns");
      return;
    }
    setCampaign(found);
    setTastings(mockTastings.filter((t) => t.campaign_id === id && t.hostess_id === user?.id));
    if (found.products && found.products.length > 0) {
      setFormData(prev => ({ ...prev, product_id: found.products![0].id }));
    }
  }, [id, user]);

  const isHostess = user?.role === "hostess";
  const isAdmin = user?.role === "admin";
  const isGMSCampaign   = id === GMS_CAMPAIGN_ID;
  const isCHRCampaign   = id === CHR_CAMPAIGN_ID;
  const isPromoCampaign = isGMSCampaign || isCHRCampaign;
  const promoGains      = computePromoGains(id, formData.quantity, gmsPromoType);

  // Team
  const teamMembers = mockCampaignTeam.filter(t => t.campaign_id === id);
  const hostessMember = teamMembers.find(m => m.role === "hostess");
  const supervisorMember = teamMembers.find(m => m.role === "supervisor");

  // Get hostess assigned site for this campaign
  const hostessTeamMember = teamMembers.find(m => m.user_id === user?.id && m.role === "hostess");
  const hostessSite = export33CampaignSites.find(s => s.id === hostessTeamMember?.site_id);

  // Stats
  const allTastings = mockTastings.filter(t => t.campaign_id === id);
  const allSales = mockSales.filter(s => s.campaign_id === id);
  const totalRevenue = allSales.reduce((sum, s) => sum + s.total_amount, 0);
  const validatedSales = allSales.filter(s => s.validated).length;
  const purchasedCount = allTastings.filter(t => t.has_purchased).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.product_id ||
      !formData.gender ||
      !formData.age_range ||
      (!isPromoCampaign && (!formData.taste_rating || !formData.purchase_intent))
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const gains = computePromoGains(id, formData.quantity, gmsPromoType);
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
        campaign_id: id,
        hostess_id: user?.id || "",
        product_id: formData.product_id,
        gender: formData.gender as Gender,
        age_range: formData.age_range as AgeRange,
        taste_rating: (isPromoCampaign ? "3" : formData.taste_rating) as TasteRating,
        purchase_intent: (isPromoCampaign ? "high" : formData.purchase_intent) as PurchaseIntent,
        has_purchased: isPromoCampaign ? true : formData.has_purchased,
        notes: promoNote ? (formData.notes ? `${promoNote} — ${formData.notes}` : promoNote) : formData.notes,
        created_at: new Date().toISOString(),
        campaign: campaign ?? undefined,
        product: campaign?.products?.find((p) => p.id === formData.product_id),
      };

      mockTastings.unshift(newTasting);
      setTastings((prev) => [newTasting, ...prev]);

      if (newTasting.has_purchased) {
        const product = campaign?.products?.find((p) => p.id === formData.product_id);
        if (product) {
          const newSale: Sale = {
            id: String(Date.now() + 1),
            campaign_id: id,
            tasting_id: newTasting.id,
            hostess_id: user?.id || "",
            product_id: formData.product_id,
            quantity: formData.quantity,
            unit_price: product.unit_price,
            total_amount: formData.quantity * product.unit_price,
            validated: false,
            created_at: new Date().toISOString(),
            campaign: campaign ?? undefined,
            product,
          };
          mockSales.unshift(newSale);
        }
      }

      toast.success(isPromoCampaign ? "Activation enregistrée !" : "Dégustation enregistrée !");
      setSubmitted(true);
      setFormData(prev => ({
        product_id: prev.product_id,
        gender: "",
        age_range: "",
        taste_rating: "",
        purchase_intent: "",
        has_purchased: false,
        quantity: 1,
        notes: "",
        client_name: "",
      }));
      setGoodieGiven(false);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (!campaign) return null;

  const cfg = STATUS_CFG[campaign.status] ?? STATUS_CFG.draft;
  const tastingPct = (campaign.tasting_objective ?? 0) > 0
    ? Math.min(100, Math.round((allTastings.length / (campaign.tasting_objective ?? 1)) * 100))
    : 0;
  const salesPct = campaign.sales_objective > 0
    ? Math.min(100, Math.round((allSales.length / campaign.sales_objective) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Admin hero banner ── */}
      {isAdmin ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-500 text-white shadow-2xl shadow-indigo-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-24 -bottom-10 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 p-6 md:p-8">
            {/* Nav row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/campaigns"
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <span className="text-white/50 text-xs hidden sm:block">Campagnes / {campaign.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 border border-white/30">
                  {cfg.label}
                </span>
                <Link href={`/dashboard/campaigns/${id}/edit`}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            {/* Title block */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-yellow-200" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">{campaign.name}</h1>
                <div className="flex flex-wrap gap-4 text-white/70 text-sm mt-2">
                  {campaign.company && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{campaign.company.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(campaign.start_date).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(campaign.end_date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {campaign.zone && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{campaign.zone.name}{campaign.location_details ? ` · ${campaign.location_details}` : ""}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* KPI chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                ...(!isGMSCampaign ? [{ label: "Dégustations", value: allTastings.length, sub: `/ ${campaign.tasting_objective ?? 0}`, icon: "🍷" }] : []),
                { label: "Acheteurs",    value: purchasedCount,     sub: "ont acheté",                      icon: "🛒" },
                { label: "Distributions valid.", value: validatedSales,    sub: `/ ${allSales.length}`,             icon: "✅" },
                { label: "Chiffre d'aff.", value: `${totalRevenue.toFixed(0)} €`, sub: "généré",            icon: "💰" },
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
        /* Non-admin compact header */
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/campaigns"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{campaign.company?.name}</p>
          </div>
        </div>
      )}

      {/* ── Admin two-column layout ── */}
      {isAdmin && (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                Description de la campagne
              </h3>
              {campaign.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Aucune description disponible.</p>
              )}
              <div className="grid sm:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Du {new Date(campaign.start_date).toLocaleDateString("fr-FR")} au {new Date(campaign.end_date).toLocaleDateString("fr-FR")}</span>
                </div>
                {(campaign.zone || campaign.location_details) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>{campaign.zone?.name}{campaign.location_details ? ` — ${campaign.location_details}` : ""}</span>
                  </div>
                )}
                {!isGMSCampaign && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Objectif : <strong className="text-foreground">{campaign.tasting_objective ?? 0}</strong> dégustations</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Objectif : <strong className="text-foreground">{campaign.sales_objective}</strong> Distributions</span>
                </div>
              </div>
            </div>

            {/* Objectives progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
                </div>
                Avancement des objectifs
              </h3>
              {/* Dégustations */}
              {!isGMSCampaign && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <UtensilsCrossed className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-foreground">Dégustations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-indigo-700">{allTastings.length}</span>
                      <span className="text-muted-foreground">/ {campaign.tasting_objective ?? 0}</span>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">{tastingPct}%</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-indigo-50 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full shadow-sm transition-all duration-700"
                      style={{ width: `${tastingPct}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Distributions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4 text-violet-500" />
                    <span className="font-medium text-foreground">Distributions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-violet-700">{allSales.length}</span>
                    <span className="text-muted-foreground">/ {campaign.sales_objective}</span>
                    <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold">{salesPct}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-violet-50 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full shadow-sm transition-all duration-700"
                    style={{ width: `${salesPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent tastings */}
            {!isGMSCampaign && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  Dernières dégustations
                </h3>
                <span className="text-xs text-muted-foreground bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                  {allTastings.length} total
                </span>
              </div>
              {allTastings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UtensilsCrossed className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucune dégustation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allTastings.slice(0, 6).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50/60 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{t.product?.name ?? "—"}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-xs text-muted-foreground">
                            {t.gender === "female" ? "Femme" : t.gender === "male" ? "Homme" : "Autre"}, {t.age_range} ans
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-amber-500">{"⭐".repeat(Number(t.taste_rating))}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.purchase_intent === "high" ? "Intention élevée" : t.purchase_intent === "medium" ? "Intention moyenne" : "Faible intention"}
                          </span>
                        </div>
                      </div>
                      {t.has_purchased && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold shrink-0 border border-emerald-200">
                          Achat ✓
                        </span>
                      )}
                    </div>
                  ))}
                  {allTastings.length > 6 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      +{allTastings.length - 6} autres dégustations
                    </p>
                  )}
                </div>
              )}
            </div>
            )}
          </div>

          {/* ── Right (1/3) ── */}
          <div className="space-y-5">

            {/* Team */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Équipe assignée
              </h3>
              <div className="space-y-3">
                {/* Hostess */}
                <div className="flex items-center gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                    {hostessMember?.user ? initials(hostessMember.user.full_name) : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-rose-500 font-semibold uppercase tracking-wider mb-0.5">Hôtesse</p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {hostessMember?.user?.full_name ?? "Non assignée"}
                    </p>
                    {hostessMember?.user?.email && (
                      <p className="text-xs text-muted-foreground truncate">{hostessMember.user.email}</p>
                    )}
                  </div>
                </div>
                {/* Supervisor */}
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                    {supervisorMember?.user ? initials(supervisorMember.user.full_name) : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-0.5">Superviseur</p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {supervisorMember?.user?.full_name ?? "Non assigné"}
                    </p>
                    {supervisorMember?.user?.email && (
                      <p className="text-xs text-muted-foreground truncate">{supervisorMember.user.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            {campaign.products && campaign.products.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  Produits ({campaign.products.length})
                </h3>
                <div className="space-y-2">
                  {campaign.products.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-700 shrink-0 ml-2">{p.unit_price?.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Chiffre d'affaires</span>
                </div>
                <div className="text-3xl font-bold">{totalRevenue.toFixed(2)} €</div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20 text-xs text-white/65">
                  <span>{allSales.length} vente{allSales.length !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{validatedSales} validée{validatedSales !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{purchasedCount} acheteur{purchasedCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Non-admin brief info card ── */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          {campaign.description && (
            <p className="text-muted-foreground leading-relaxed text-sm">{campaign.description}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>Du {new Date(campaign.start_date).toLocaleDateString("fr-FR")} au {new Date(campaign.end_date).toLocaleDateString("fr-FR")}</span>
            </div>
            {(campaign.zone || campaign.location_details) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-violet-400" />
                <span>{campaign.zone?.name}{campaign.location_details ? ` — ${campaign.location_details}` : ""}</span>
              </div>
            )}
            {/* Objectifs GMS - sans dégustations */}
            {isGMSCampaign ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Objectif Distributions : <strong className="text-foreground">{campaign.sales_objective}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beer className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Objectif canettes offertes : <strong className="text-foreground">{campaign.free_objective ?? 0}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gift className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Objectif goodies : <strong className="text-foreground">{campaign.goodies_objective ?? 0}</strong></span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UtensilsCrossed className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Objectif : <strong className="text-foreground">{campaign.tasting_objective ?? 0}</strong> dégustations</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Objectif : <strong className="text-foreground">{campaign.sales_objective}</strong> Distributions</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Hostess: tasting form ── */}
      {isHostess && campaign.status === "active" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            {isPromoCampaign ? "Enregistrer une activation promo" : "Enregistrer une dégustation"}
          </h3>
          {submitted && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{isPromoCampaign ? "Activation enregistrée avec succès !" : "Dégustation enregistrée avec succès !"}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Campagne</Label>
                <div className="h-10 px-3 flex items-center rounded-xl border border-input bg-muted/40 text-sm font-medium">{campaign.name}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Hôtesse</Label>
                <div className="h-10 px-3 flex items-center rounded-xl border border-input bg-muted/40 text-sm font-medium">{user?.full_name}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs  tracking-wide">Nom du client </Label>
                <Input
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Nom du client"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Site de vente de l'hôtesse</Label>
                <div className="h-10 px-3 flex items-center rounded-xl border border-input bg-muted/40 text-sm font-medium">{hostessSite?.name || "—"}</div>
              </div>
            </div>
            {/* ── Produit : read-only ── */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Produit</Label>
              <div className="h-10 px-3 flex items-center rounded-xl border border-input bg-muted/40 text-sm font-medium">
                {campaign.products?.find(p => p.id === formData.product_id)?.name ?? campaign.products?.[0]?.name ?? "—"}
              </div>
            </div>

            {/* ── Sexe + Âge ── */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Genre *</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v as Gender })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tranche d&apos;âge *</Label>
                <Select value={formData.age_range} onValueChange={v => setFormData({ ...formData, age_range: v as AgeRange })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{["18-25","26-35","36-45","46-55","55+"].map(a => <SelectItem key={a} value={a}>{a} ans</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Promo OR standard fields ── */}
            {isPromoCampaign ? (
              <>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                  <p className="text-xs font-bold text-amber-800 mb-1.5">🏷 Mécanique promotionnelle</p>
                  {isGMSCampaign ? (
                    <div className="space-y-0.5 text-xs text-amber-700">
                      <p>🍺 4 CAN achetées → 1 CAN offerte</p>
                      <p>🎟 6 CAN achetées → 1 ticket tombola</p>
                      <p>🏆 1 pack acheté → 1 ticket de tombola</p>
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
                {isGMSCampaign && (
                  <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label>
                    Quantité achetée *
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({isGMSCampaign ? (gmsPromoType === "canettes" ? "canettes" : "packs") : "bouteilles"})
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                      className="w-9 h-9 rounded-xl border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">−</button>
                    <Input type="number" min="1" value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 text-center font-semibold text-lg" />
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                      className="w-9 h-9 rounded-xl border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">+</button>
                  </div>
                </div>
                {promoGains && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                    <p className="text-xs font-bold text-green-800 mb-3">🎁 Gains calculés automatiquement</p>
                    <div className="space-y-2">
                      {isGMSCampaign && gmsPromoType === "canettes" && (<>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🍺 Canettes offertes</span>
                          <span className={cn("text-2xl font-bold", (promoGains.canettesOffertes ?? 0) > 0 ? "text-amber-600" : "text-slate-300")}>{promoGains.canettesOffertes ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🎟 Tickets tombola</span>
                          <span className={cn("text-2xl font-bold", (promoGains.ticketsTombola ?? 0) > 0 ? "text-pink-600" : "text-slate-300")}>{promoGains.ticketsTombola ?? 0}</span>
                        </div>
                      </>)}
                      {isGMSCampaign && gmsPromoType === "packs" && (<>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">📦 Packs offerts</span>
                          <span className={cn("text-2xl font-bold", (promoGains.packsOfferts ?? 0) > 0 ? "text-orange-600" : "text-slate-300")}>{promoGains.packsOfferts ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🎁 Goodies distribués</span>
                          <span className={cn("text-2xl font-bold", (promoGains.goodies ?? 0) > 0 ? "text-violet-600" : "text-slate-300")}>{promoGains.goodies ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🎟 Tickets tombola</span>
                          <span className={cn("text-2xl font-bold", (promoGains.ticketsTombola ?? 0) > 0 ? "text-pink-600" : "text-slate-300")}>{promoGains.ticketsTombola ?? 0}</span>
                        </div>
                      </>)}
                      {isCHRCampaign && (<>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🍾 Bouteilles offertes</span>
                          <span className={cn("text-2xl font-bold", (promoGains.bouteillesOffertes ?? 0) > 0 ? "text-emerald-600" : "text-slate-300")}>{promoGains.bouteillesOffertes ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">🎟 Tirages tombola</span>
                          <span className={cn("text-2xl font-bold", (promoGains.tirages ?? 0) > 0 ? "text-blue-600" : "text-slate-300")}>{promoGains.tirages ?? 0}</span>
                        </div>
                      </>)}
                    </div>
                  </div>
                )}
                {/* {isGMSCampaign && (
                  <div className="space-y-1.5">
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
                )} */}
              </>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Note de goût *</Label>
                    <Select value={formData.taste_rating} onValueChange={v => setFormData({ ...formData, taste_rating: v as TasteRating })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>{["1","2","3","4","5"].map(r => <SelectItem key={r} value={r}>{"⭐".repeat(Number(r))} — {r}/5</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Intention d&apos;achat *</Label>
                    <Select value={formData.purchase_intent} onValueChange={v => setFormData({ ...formData, purchase_intent: v as PurchaseIntent })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 py-1">
                    <Checkbox id="has_purchased" checked={formData.has_purchased}
                      onCheckedChange={v => setFormData({ ...formData, has_purchased: !!v, quantity: 1 })} />
                    <Label htmlFor="has_purchased" className="cursor-pointer font-normal">Le client a effectué un achat</Label>
                  </div>
                  {formData.has_purchased && (
                    <div className="space-y-1.5 pl-1">
                      <Label>Quantité achetée *</Label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                          className="w-9 h-9 rounded-xl border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">−</button>
                        <Input type="number" min="1" value={formData.quantity}
                          onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-20 text-center font-semibold text-lg" />
                        <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                          className="w-9 h-9 rounded-xl border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">+</button>
                        {(() => {
                          const p = campaign?.products?.find(pr => pr.id === formData.product_id);
                          return p ? (
                            <span className="text-sm text-muted-foreground ml-1">
                              = <span className="font-semibold text-foreground">{(formData.quantity * p.unit_price).toFixed(2)} €</span>
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Notes / observations</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Commentaires, remarques du client..." rows={3} />
            </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700" 
                  disabled={saving}
                >              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                :<>
    <UtensilsCrossed className="w-4 h-4 mr-2 text-white" />
    <span className="text-white">
      {isPromoCampaign ? "Enregistrer le client" : "Enregistrer la dégustation"}
    </span>
  </>}
            </Button>
          </form>
        </div>
      )}

      {/* ── Hostess: tastings counter ── */}
      {isHostess && tastings.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {tastings.length} Distribution{tastings.length > 1 ? "s" : ""} enregistrée{tastings.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {tastings.filter(t => t.has_purchased).length} achat{tastings.filter(t => t.has_purchased).length > 1 ? "s" : ""} réalisé{tastings.filter(t => t.has_purchased).length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* ── Supervisor/manager simple progress ── */}
      {!isAdmin && !isHostess && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 text-teal-600" />
            </div>
            Suivi de la campagne
          </h3>
          {!isGMSCampaign && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dégustations enregistrées</span>
                <span className="font-semibold">{allTastings.length} / {campaign.tasting_objective ?? 0}</span>
              </div>
              <div className="h-3 rounded-full bg-teal-50 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${tastingPct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
