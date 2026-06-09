"use client";

import { useState, useMemo } from "react";
import { mockCampaigns, mockCompanies } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Trophy, Gift, Building2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/types";
import * as XLSX from "xlsx";

// ── Mock goodies data per campaign ──────────────────────────────
const GOODIES_DATA: Record<string, { id: string; name: string; icon: string; quantity_available: number; quantity_won: number }[]> = {
  "1": [
    { id: "1", name: "T-Shirt",        icon: "👕", quantity_available: 50,  quantity_won: 12 },
    { id: "2", name: "Casquette",      icon: "🧢", quantity_available: 100, quantity_won: 27 },
    { id: "3", name: "Porte-clés",     icon: "🔑", quantity_available: 200, quantity_won: 48 },
    { id: "4", name: "Stylo",          icon: "🖊️", quantity_available: 500, quantity_won: 87 },
    { id: "5", name: "Réduction 10%",  icon: "🎟️", quantity_available: 100, quantity_won: 18 },
  ],
  "2": [
    { id: "1", name: "T-Shirt",        icon: "👕", quantity_available: 30,  quantity_won: 5  },
    { id: "2", name: "Casquette",      icon: "🧢", quantity_available: 60,  quantity_won: 11 },
    { id: "3", name: "Porte-clés",     icon: "🔑", quantity_available: 120, quantity_won: 19 },
    { id: "4", name: "Stylo",          icon: "🖊️", quantity_available: 300, quantity_won: 42 },
    { id: "5", name: "Réduction 10%",  icon: "🎟️", quantity_available: 80,  quantity_won: 9  },
  ],
};

export default function GoodiesPage() {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  // ── Group by company → campaign ──────────────────────────────
  const companyGroups = useMemo(() => {
    const map = new Map<string, {
      company: Company;
      campaigns: {
        campaign: typeof mockCampaigns[0];
        prizes: typeof GOODIES_DATA[string];
        totalWon: number;
        totalAvail: number;
      }[];
      totalWon: number;
      totalAvail: number;
    }>();

    mockCampaigns.forEach(campaign => {
      const prizes = GOODIES_DATA[campaign.id];
      if (!prizes) return;
      const company = campaign.company as Company | undefined;
      if (!company) return;

      if (!map.has(company.id)) map.set(company.id, { company, campaigns: [], totalWon: 0, totalAvail: 0 });
      const cg = map.get(company.id)!;
      const totalWon   = prizes.reduce((s, p) => s + p.quantity_won, 0);
      const totalAvail = prizes.reduce((s, p) => s + p.quantity_available, 0);
      cg.campaigns.push({ campaign, prizes, totalWon, totalAvail });
      cg.totalWon   += totalWon;
      cg.totalAvail += totalAvail;
    });

    const groups = [...map.values()];
    return selectedCompany === "all" ? groups : groups.filter(g => g.company.id === selectedCompany);
  }, [selectedCompany]);

  // ── Global KPIs ───────────────────────────────────────────────
  const globalStats = useMemo(() => {
    const all = Object.values(GOODIES_DATA).flat();
    const totalWon   = all.reduce((s, p) => s + p.quantity_won, 0);
    const totalAvail = all.reduce((s, p) => s + p.quantity_available, 0);
    const remaining  = totalAvail - totalWon;
    const rate       = totalAvail > 0 ? Math.round((totalWon / totalAvail) * 100) : 0;
    return { totalWon, totalAvail, remaining, rate, campaigns: Object.keys(GOODIES_DATA).length };
  }, []);

  // ── Per-company XLSX export ──────────────────────────────────
  const handleExportCompany = (companyId: string) => {
    const group = companyGroups.find(g => g.company.id === companyId);
    if (!group) return;
    const wb = XLSX.utils.book_new();
    group.campaigns.forEach(({ campaign, prizes }) => {
      const rows = prizes.map(p => ({
        "Goodie":          p.name,
        "Disponibles":     p.quantity_available,
        "Gagnés":          p.quantity_won,
        "Restants":        p.quantity_available - p.quantity_won,
        "Taux (%)":        p.quantity_available > 0 ? Math.round((p.quantity_won / p.quantity_available) * 100) : 0,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), campaign.name.slice(0, 31));
    });
    XLSX.writeFile(wb, `goodies_${group.company.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Color helper for distribution rate ───────────────────────
  const rateColor = (pct: number) =>
    pct >= 80 ? "text-rose-600" : pct >= 50 ? "text-amber-600" : "text-emerald-600";
  const barColor = (pct: number) =>
    pct >= 80 ? "from-rose-500 to-pink-400" : pct >= 50 ? "from-amber-500 to-orange-400" : "from-fuchsia-500 to-pink-400";

  return (
    <div className="space-y-6">

      {/* ── Hero banner — Fuchsia/Pink ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-400 text-white shadow-2xl shadow-fuchsia-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_65%)]" />
        <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-32 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Goodies gagnés</h1>
              </div>
              <p className="text-white/65 text-sm ml-12">Suivi des goodies distribués par entreprise et campagne</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-44 bg-white/20 border-white/30 text-white rounded-xl text-sm [&>svg]:text-white">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entreprises</SelectItem>
                  {mockCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "🎁", label: "Total gagnés",     value: globalStats.totalWon,   sub: "goodies" },
              { icon: "📦", label: "Disponibles",      value: globalStats.totalAvail, sub: "au total" },
              { icon: "📬", label: "Restants",          value: globalStats.remaining,  sub: "en stock" },
              { icon: "📊", label: "Taux distribution", value: `${globalStats.rate}%`, sub: "" },
            ].map((s, i) => (
              <div key={i} className="bg-white/18 backdrop-blur-sm rounded-xl p-3.5 border border-white/20">
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

      {/* ── Company sections ── */}
      {companyGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Gift className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Aucune donnée</p>
          <p className="text-xs text-muted-foreground">Aucun goodie trouvé pour les filtres sélectionnés</p>
        </div>
      ) : (
        <div className="space-y-5">
          {companyGroups.map(({ company, campaigns, totalWon, totalAvail }) => {
            const compRate = totalAvail > 0 ? Math.round((totalWon / totalAvail) * 100) : 0;
            return (
              <div key={company.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Company header */}
                <div className="bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 border-b border-fuchsia-100 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 bg-fuchsia-100 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-fuchsia-700" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-foreground truncate">{company.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} · {totalWon} goodies distribués
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-black text-fuchsia-700">{totalWon}<span className="text-sm font-normal text-muted-foreground">/{totalAvail}</span></p>
                      <p className="text-xs text-muted-foreground">{compRate}% distribué</p>
                    </div>
                    <button
                      onClick={() => handleExportCompany(company.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-fuchsia-200 bg-white hover:bg-fuchsia-50 text-fuchsia-700 text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      XLSX
                    </button>
                  </div>
                </div>

                {/* Campaigns within company */}
                <div className="divide-y divide-slate-50">
                  {campaigns.map(({ campaign, prizes, totalWon: campWon, totalAvail: campAvail }) => {
                    const campRate = campAvail > 0 ? Math.round((campWon / campAvail) * 100) : 0;
                    return (
                      <div key={campaign.id} className="p-5">
                        {/* Campaign header */}
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                            <span className="font-semibold text-sm text-foreground">{campaign.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-fuchsia-700">{campWon} gagnés</span>
                            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                              campRate >= 80 ? "bg-rose-50 text-rose-700 border-rose-200" :
                              campRate >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                              {campRate}% distribué
                            </span>
                          </div>
                        </div>

                        {/* Campaign mini KPIs */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: "Types de goodies", value: prizes.length,                bg: "bg-fuchsia-50", border: "border-fuchsia-100", color: "text-fuchsia-700" },
                            { label: "Total disponibles",  value: campAvail,                  bg: "bg-pink-50",    border: "border-pink-100",    color: "text-pink-700"    },
                            { label: "Restants en stock",  value: campAvail - campWon,        bg: "bg-rose-50",    border: "border-rose-100",    color: "text-rose-700"    },
                          ].map((s, i) => (
                            <div key={i} className={cn("rounded-xl border p-2.5 text-center", s.bg, s.border)}>
                              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Prize progress bars */}
                        <div className="bg-slate-50/60 rounded-xl p-4 space-y-3">
                          {prizes.map(prize => {
                            const pct = prize.quantity_available > 0
                              ? Math.round((prize.quantity_won / prize.quantity_available) * 100)
                              : 0;
                            return (
                              <div key={prize.id} className="flex items-center gap-3">
                                <span className="text-lg w-7 text-center">{prize.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-foreground">{prize.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {prize.quantity_won} / {prize.quantity_available}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full bg-gradient-to-r transition-all", barColor(pct))}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className={cn("text-xs font-bold w-10 text-right shrink-0", rateColor(pct))}>
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
