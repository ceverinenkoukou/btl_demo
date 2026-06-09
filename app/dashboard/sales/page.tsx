"use client";

import { useEffect, useState, useMemo } from "react";
import { mockSales, mockCampaigns, mockCompanies, mockCampaignTeam } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ShoppingCart, Check, CheckCircle2, Loader2, Edit2, Trash2,
  Download, TrendingUp, Package, FileText, Building2,
} from "lucide-react";
import type { Sale, Campaign, Product, Company } from "@/lib/types";
import * as XLSX from "xlsx";

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const isHostess = user?.role === "hostess";
  const isAdmin = user?.role === "admin";

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let filteredCampaigns = mockCampaigns.filter(c => ["active", "completed"].includes(c.status));
      if (user?.role === "hostess") {
        const assignedIds = new Set(
          mockCampaignTeam
            .filter(m => m.user_id === user.id && m.role === "hostess")
            .map(m => m.campaign_id)
        );
        filteredCampaigns = filteredCampaigns.filter(c => assignedIds.has(c.id));
      }
      setCampaigns(filteredCampaigns);

      let filteredSalesData = [...mockSales];
      if (user?.role === "hostess") {
        filteredSalesData = filteredSalesData.filter(s => s.hostess_id === user?.id);
      }
      setSales(filteredSalesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (saleId: string) => {
    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return;

      const newTotal = editQuantity * sale.unit_price;
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, quantity: editQuantity, total_amount: newTotal } : s));

      toast.success("Vente mise à jour");
      setEditingSale(null);
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette vente?")) return;

    try {
      setSales(prev => prev.filter(s => s.id !== saleId));
      toast.success("Vente supprimée");
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleValidateAll = async () => {
    const unvalidatedSales = filteredSales.filter((s) => !s.validated);
    if (unvalidatedSales.length === 0) {
      toast.info("Toutes les ventes sont déjà validées");
      return;
    }

    setValidating(true);
    try {
      const ids = unvalidatedSales.map(s => s.id);
      setSales(prev => prev.map(s => ids.includes(s.id) ? { ...s, validated: true, validated_at: new Date().toISOString() } : s));

      toast.success(`${unvalidatedSales.length} vente(s) validée(s)`);
    } catch (error) {
      console.error("Error validating sales:", error);
      toast.error("Erreur lors de la validation");
    } finally {
      setValidating(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredSales.map((sale) => ({
      Date: new Date(sale.created_at).toLocaleDateString("fr-FR"),
      Heure: new Date(sale.created_at).toLocaleTimeString("fr-FR"),
      Campagne: sale.campaign?.name || "",
      Produit: sale.product?.name || "",
      "Prix unitaire": sale.unit_price,
      Quantité: sale.quantity,
      Total: sale.total_amount,
      Validé: sale.validated ? "Oui" : "Non",
      Hôtesse: sale.hostess?.full_name || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventes");
    XLSX.writeFile(wb, `ventes_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Export téléchargé");
  };

  const filteredSales = sales.filter(
    (sale) => selectedCampaign === "all" || sale.campaign_id === selectedCampaign
  );

  // Stats
  const stats = {
    total: filteredSales.length,
    validated: filteredSales.filter((s) => s.validated).length,
    revenue: filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0),
    pending: filteredSales.filter((s) => !s.validated).length,
  };

  // Group by company → campaign (admin view)
  const companySalesGroups = useMemo(() => {
    const companyMap = new Map<string, {
      company: Company;
      campaignMap: Map<string, { campaign: Campaign | undefined; sales: Sale[] }>;
    }>();
    filteredSales.forEach(sale => {
      const company = sale.campaign?.company as Company | undefined;
      if (!company) return;
      if (!companyMap.has(company.id)) companyMap.set(company.id, { company, campaignMap: new Map() });
      const cg = companyMap.get(company.id)!;
      if (!cg.campaignMap.has(sale.campaign_id)) cg.campaignMap.set(sale.campaign_id, { campaign: sale.campaign, sales: [] });
      cg.campaignMap.get(sale.campaign_id)!.sales.push(sale);
    });
    return [...companyMap.values()].map(cg => {
      const allSales = [...cg.campaignMap.values()].flatMap(c => c.sales);
      return {
        company: cg.company,
        campaigns: [...cg.campaignMap.values()],
        totalRevenue: allSales.reduce((sum, s) => sum + Number(s.total_amount), 0),
        totalSales: allSales.length,
        totalValidated: allSales.filter(s => s.validated).length,
      };
    });
  }, [filteredSales]);

  const exportCompanyPDF = (companyId: string) => {
    const company = mockCompanies.find(c => c.id === companyId);
    const companySales = sales.filter(s => s.campaign?.company_id === companyId || (s.campaign?.company as Company | undefined)?.id === companyId);
    const campMap = new Map<string, { name: string; sales: Sale[] }>();
    companySales.forEach(s => {
      const key = s.campaign_id;
      if (!campMap.has(key)) campMap.set(key, { name: s.campaign?.name ?? "—", sales: [] });
      campMap.get(key)!.sales.push(s);
    });
    const totalRevenue = companySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalValidated = companySales.filter(s => s.validated).length;
    const campaignRows = [...campMap.values()].map(camp => {
      const campRev = camp.sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      return `
        <tr class="camp-row"><td colspan="5" class="camp-name">📍 ${camp.name}</td></tr>
        ${camp.sales.map(s => `<tr class="${s.validated ? "val" : "pend"}">
          <td>${new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
          <td>${s.product?.name ?? "—"}</td>
          <td class="r">${s.quantity}</td>
          <td class="r">${s.unit_price.toLocaleString("fr-FR")} F</td>
          <td class="r b">${Number(s.total_amount).toLocaleString("fr-FR")} F</td>
        </tr>`).join("")}
        <tr class="sub"><td colspan="4" class="r">Sous-total ${camp.name}</td><td class="r b">${campRev.toLocaleString("fr-FR")} F</td></tr>
      `;
    }).join("");
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Ventes – ${company?.name ?? "Entreprise"}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;padding:28px}
      .hdr{background:linear-gradient(135deg,#065f46,#0d9488);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px}
      .hdr h1{font-size:20px;font-weight:800}.hdr p{opacity:.7;margin-top:3px;font-size:11px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
      .kpi{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;text-align:center}
      .kpi .v{font-size:17px;font-weight:800;color:#065f46}.kpi .l{font-size:10px;color:#6b7280;margin-top:2px}
      table{width:100%;border-collapse:collapse}
      th{background:#065f46;color:#fff;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
      td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
      .camp-row td{background:#f0fdf4;font-weight:700;color:#065f46;padding:8px 10px}
      .sub td{background:#dcfce7;font-size:11px}.val{background:#fff}.pend{background:#fffbeb}
      .r{text-align:right}.b{font-weight:700}
      .tot td{background:#065f46;color:#fff;font-weight:800;padding:9px 10px}
      .foot{margin-top:20px;text-align:center;color:#94a3b8;font-size:10px}
      @media print{body{padding:12px}}
    </style></head><body>
      <div class="hdr"><h1>${company?.name ?? "Entreprise"}</h1><p>Rapport de ventes · Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${companySales.length}</div><div class="l">Total ventes</div></div>
        <div class="kpi"><div class="v">${totalValidated}</div><div class="l">Validées</div></div>
        <div class="kpi"><div class="v">${companySales.length - totalValidated}</div><div class="l">En attente</div></div>
        <div class="kpi"><div class="v">${totalRevenue.toLocaleString("fr-FR")} F</div><div class="l">Chiffre d'affaires</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>Produit</th><th class="r">Qté</th><th class="r">Prix unit.</th><th class="r">Total</th></tr></thead>
      <tbody>${campaignRows}<tr class="tot"><td colspan="4" class="r">TOTAL GÉNÉRAL</td><td class="r">${totalRevenue.toLocaleString("fr-FR")} F</td></tr></tbody></table>
      <div class="foot">Document généré automatiquement · ${company?.name ?? ""}</div>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.onload = () => setTimeout(() => win.print(), 300);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success(`Rapport PDF de ${company?.name} prêt à imprimer`);
  };

  return (
    <div className="space-y-6">

      {isAdmin ? (
        /* ══════════════════════════════════════════
           ADMIN — Emerald/teal theme, grouped by company
           ══════════════════════════════════════════ */
        <>
          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-500 text-white shadow-2xl shadow-emerald-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-28 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ventes</h1>
                  </div>
                  <p className="text-white/65 text-sm ml-12">Organisées par entreprise et campagne</p>
                </div>
                <button
                  onClick={handleValidateAll}
                  disabled={validating || stats.pending === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-700 hover:bg-white/90 text-sm font-bold transition-colors shadow-sm disabled:opacity-50 shrink-0"
                >
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="hidden sm:inline">Valider tout ({stats.pending})</span>
                </button>
              </div>
              {/* KPI chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: "🛒", label: "Total ventes",     value: stats.total,          sub: "enregistrées" },
                  { icon: "✅", label: "Validées",          value: stats.validated,      sub: "confirmées"   },
                  { icon: "⏳", label: "En attente",        value: stats.pending,        sub: "à valider"    },
                  { icon: "💰", label: "Chiffre d'aff.",    value: fmt(stats.revenue),   sub: ""             },
                ].map((s, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/20">
                    <div className="text-base mb-1">{s.icon}</div>
                    <div className="text-xl font-bold leading-none">
                      {s.value}
                      {s.sub && <span className="text-xs font-normal text-white/55 ml-1">{s.sub}</span>}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter + global export */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-52 rounded-xl border-slate-200">
                <SelectValue placeholder="Toutes les campagnes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les campagnes</SelectItem>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter tout (XLSX)
            </button>
          </div>

          {/* Company sections */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : companySalesGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Aucune vente</p>
              <p className="text-xs text-muted-foreground">Aucune vente ne correspond aux filtres sélectionnés</p>
            </div>
          ) : (
            <div className="space-y-5">
              {companySalesGroups.map(({ company, campaigns: compCampaigns, totalRevenue, totalSales, totalValidated: compValidated }) => (
                <div key={company.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Company header */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100 px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-foreground truncate">{company.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {compCampaigns.length} campagne{compCampaigns.length > 1 ? "s" : ""} · {totalSales} vente{totalSales > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-700">{fmt(totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{compValidated}/{totalSales} validées</p>
                      </div>
                      <button
                        onClick={() => exportCompanyPDF(company.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-semibold transition-colors shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Campaigns within company */}
                  <div className="divide-y divide-slate-50">
                    {compCampaigns.map(({ campaign, sales: campSales }) => {
                      const campRevenue = campSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
                      const campValidated = campSales.filter(s => s.validated).length;
                      const campPending = campSales.length - campValidated;
                      const convRate = campSales.length > 0 ? Math.round((campValidated / campSales.length) * 100) : 0;
                      return (
                        <div key={campaign?.id ?? "x"} className="p-4">
                          {/* Campaign title row */}
                          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                              <span className="font-semibold text-sm text-foreground">{campaign?.name ?? "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-emerald-700">{fmt(campRevenue)}</span>
                              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                {campValidated} validée{campValidated > 1 ? "s" : ""}
                              </span>
                              {campPending > 0 && (
                                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
                                  {campPending} en attente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Campaign mini-stats */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { label: "Ventes",     value: campSales.length, color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-100" },
                              { label: "Validées",   value: campValidated,    color: "text-teal-700",    bg: "bg-teal-50",     border: "border-teal-100"    },
                              { label: "En attente", value: campPending,      color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-100"   },
                              { label: "Taux valid.", value: `${convRate}%`,  color: "text-cyan-700",    bg: "bg-cyan-50",     border: "border-cyan-100"    },
                            ].map((s, i) => (
                              <div key={i} className={cn("rounded-xl border p-2.5 text-center", s.bg, s.border)}>
                                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Sales mini-table */}
                          <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  {["Produit", "Qté", "Prix unit.", "Total", "Statut", "Actions"].map((h, i) => (
                                    <th key={h} className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground",
                                      i === 0 ? "text-left" : i < 4 ? "text-right" : "text-center")}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {campSales.map(sale => (
                                  <tr key={sale.id} className={cn("transition-colors",
                                    sale.validated ? "bg-white hover:bg-slate-50/50" : "bg-amber-50/30 hover:bg-amber-50/60")}>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <span className="font-medium text-foreground text-xs">{sale.product?.name ?? "—"}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      {editingSale === sale.id ? (
                                        <Input type="number" min="1" value={editQuantity}
                                          onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                                          className="w-14 h-7 text-right text-xs" />
                                      ) : <span className="font-medium">{sale.quantity}</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-muted-foreground text-xs">{fmt(sale.unit_price)}</td>
                                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700 text-xs">
                                      {fmt(editingSale === sale.id ? editQuantity * sale.unit_price : sale.total_amount)}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border",
                                        sale.validated
                                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                          : "bg-amber-100 text-amber-700 border-amber-200")}>
                                        {sale.validated ? "Validé" : "En attente"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {!sale.validated && (
                                        <div className="flex items-center justify-center gap-1">
                                          {editingSale === sale.id ? (
                                            <>
                                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateQuantity(sale.id)}>
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                              </Button>
                                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingSale(null)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingSale(sale.id); setEditQuantity(sale.quantity); }}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteSale(sale.id)}>
                                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ══════════════════════════════════════════
           NON-ADMIN — existing behavior preserved
           ══════════════════════════════════════════ */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ventes</h1>
              <p className="text-muted-foreground mt-1">Gérez et validez les ventes de la journée</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Exporter</Button>
              <Button onClick={handleValidateAll} disabled={validating || stats.pending === 0}>
                {validating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validation...</> : <><Check className="w-4 h-4 mr-2" />Valider tout ({stats.pending})</>}
              </Button>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total ventes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
            <p className="text-sm text-muted-foreground">Validées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                maximumFractionDigits: 0,
              }).format(stats.revenue)}
            </div>
            <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm text-muted-foreground">Campagne:</Label>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Toutes les campagnes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les campagnes</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sales view */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {isHostess ? "Mes ventes" : "Ventes du jour"}
            </CardTitle>
            {isHostess && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>
          {isHostess && (
            <p className="text-xs text-muted-foreground mt-1">Cliquez sur une vente pour voir les détails et statistiques</p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune vente enregistrée</p>
            </div>
          ) : isHostess ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSales.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelectedSale(sale)}
                  className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all space-y-3 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{sale.product?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{sale.campaign?.name}</p>
                      </div>
                    </div>
                    <Badge variant={sale.validated ? "default" : "secondary"} className="shrink-0 text-xs">
                      {sale.validated ? "Validé" : "En attente"}
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-foreground">{fmt(sale.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} unité{sale.quantity > 1 ? "s" : ""} × {fmt(sale.unit_price)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {sale.validated && sale.validated_at && (
                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Validée le {new Date(sale.validated_at).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Heure</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Campagne</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {new Date(sale.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>{sale.product?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.campaign?.name}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("fr-FR").format(sale.unit_price)} F
                      </TableCell>
                      <TableCell className="text-right">
                        {editingSale === sale.id ? (
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                        ) : (
                          sale.quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat("fr-FR").format(
                          editingSale === sale.id ? editQuantity * sale.unit_price : sale.total_amount
                        )}{" "}F
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sale.validated ? "default" : "secondary"}>
                          {sale.validated ? "Validé" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!sale.validated && (
                          <div className="flex items-center justify-end gap-1">
                            {editingSale === sale.id ? (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => handleUpdateQuantity(sale.id)}>
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingSale(null)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => { setEditingSale(sale.id); setEditQuantity(sale.quantity); }}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteSale(sale.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale detail & stats dialog */}
      {selectedSale && (() => {
        const campaignSales = sales.filter(s => s.campaign_id === selectedSale.campaign_id);
        const campRevenue = campaignSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const contribution = campRevenue > 0
          ? Math.round((Number(selectedSale.total_amount) / campRevenue) * 100)
          : 0;
        const avgSale = campaignSales.length > 0
          ? campRevenue / campaignSales.length
          : 0;
        return (
          <Dialog open={!!selectedSale} onOpenChange={(open) => { if (!open) setSelectedSale(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Détails de la vente</DialogTitle>
                <DialogDescription>
                  {new Date(selectedSale.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Product & campaign */}
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedSale.product?.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">{selectedSale.campaign?.name}</p>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Qté</p>
                    <p className="text-xl font-bold text-foreground">{selectedSale.quantity}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Prix unit.</p>
                    <p className="text-sm font-bold text-foreground">{fmt(selectedSale.unit_price)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-sm font-bold text-primary">{fmt(selectedSale.total_amount)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className={cn(
                  "rounded-xl p-4 border flex items-center justify-between",
                  selectedSale.validated ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                )}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={cn("w-5 h-5", selectedSale.validated ? "text-green-600" : "text-yellow-500")} />
                    <span className="font-medium text-sm">
                      {selectedSale.validated ? "Vente validée" : "En attente de validation"}
                    </span>
                  </div>
                  {selectedSale.validated && selectedSale.validated_at && (
                    <span className="text-xs text-green-700">
                      {new Date(selectedSale.validated_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {/* Campaign stats */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stats de la campagne</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xl font-bold text-foreground">{campaignSales.length}</p>
                      <p className="text-xs text-muted-foreground">Ventes</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-sm font-bold text-primary">{contribution}%</p>
                      <p className="text-xs text-muted-foreground">De ma part</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-bold text-foreground">{fmt(avgSale)}</p>
                      <p className="text-xs text-muted-foreground">Moy. vente</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">CA total campagne</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{fmt(campRevenue)}</p>
                  </div>
                </div>

                {/* Export this sale */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet([{
                      Date: new Date(selectedSale.created_at).toLocaleDateString("fr-FR"),
                      Heure: new Date(selectedSale.created_at).toLocaleTimeString("fr-FR"),
                      Campagne: selectedSale.campaign?.name ?? "",
                      Produit: selectedSale.product?.name ?? "",
                      "Prix unitaire": selectedSale.unit_price,
                      Quantité: selectedSale.quantity,
                      Total: selectedSale.total_amount,
                      Validé: selectedSale.validated ? "Oui" : "Non",
                    }]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Vente");
                    XLSX.writeFile(wb, `vente_${selectedSale.id}.xlsx`);
                    toast.success("Vente exportée");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter cette vente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
        </>
      )}

    </div>
  );
}
