"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  export33Campaign, export33CampaignCHR,
  gmsPromoData, chrPromoData,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, TrendingUp, MapPin, Calendar,
  Users, Tag, RefreshCw, Beer, Package, Gift, Ticket, ShoppingCart,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const GMS_ID = "3";
const CHR_ID = "4";

// ── CSV export helper ────────────────────────────────────────────────────────
function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const lines = [
    cols.join(","),
    ...rows.map(r => cols.map(c => `"${r[c]}"`).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="leading-5">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── KPI definition types ─────────────────────────────────────────────────────
interface KPI {
  label: string; icon: string; value: number; target: number;
  bar: string; track: string; text: string; badge: string;
}

// ── GMS KPIs ─────────────────────────────────────────────────────────────────
// Utilise les objectifs définis dans export33Campaign: free_objective=315, goodies_objective=720
const GMS_KPIS: KPI[] = [
  {
    label: "Distributions (canettes)",
    icon: "🛒", value: 1050, target: export33Campaign.sales_objective,
    bar: "bg-red-500",    track: "bg-red-100",    text: "text-red-700",    badge: "bg-red-50 border-red-100",
  },
  {
    label: "Canettes offertes",
    icon: "🍺", value: gmsPromoData.canettePromo.canetteOffertes, target: export33Campaign.free_objective ?? 315,
    bar: "bg-amber-500",  track: "bg-amber-100",  text: "text-amber-700",  badge: "bg-amber-50 border-amber-100",
  },
  {
    label: "Packs offerts",
    icon: "📦", value: gmsPromoData.packPromo.packsOfferts, target: 105,
    bar: "bg-orange-500", track: "bg-orange-100", text: "text-orange-700", badge: "bg-orange-50 border-orange-100",
  },
  {
    label: "Goodies distribués",
    icon: "🎁", value: gmsPromoData.packPromo.goodiesGagnés, target: export33Campaign.goodies_objective ?? 720,
    bar: "bg-violet-500", track: "bg-violet-100", text: "text-violet-700", badge: "bg-violet-50 border-violet-100",
  },
  {
    label: "Tickets tombola",
    icon: "🎟️",
    value: gmsPromoData.packPromo.ticketsOfferts + gmsPromoData.canettePromo.ticketsTombola,
    target: 700,
    bar: "bg-pink-500",   track: "bg-pink-100",   text: "text-pink-700",   badge: "bg-pink-50 border-pink-100",
  },
];

// ── CHR KPIs ─────────────────────────────────────────────────────────────────
const CHR_KPIS: KPI[] = [
  {
    label: "Distributions (bouteilles)",
    icon: "🛒", value: 292, target: 320,
    bar: "bg-blue-500",    track: "bg-blue-100",    text: "text-blue-700",    badge: "bg-blue-50 border-blue-100",
  },
  {
    label: "Bouteilles offertes",
    icon: "🍾", value: chrPromoData.bouteillePromo.bouteillesOffertes, target: 106,
    bar: "bg-emerald-500", track: "bg-emerald-100", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-100",
  },
  {
    label: "Tickets tombola distribués",
    icon: "🎟️", value: chrPromoData.bouteillePromo.tiragesTombola, target: 35,
    bar: "bg-pink-500",    track: "bg-pink-100",    text: "text-pink-700",    badge: "bg-pink-50 border-pink-100",
  },
  // {
  //   label: "Tirages gagnants",
  //   icon: "�", value: Math.floor(chrPromoData.bouteillePromo.tiragesTombola * 0.3), target: 10,
  //   bar: "bg-violet-500",  track: "bg-violet-100",  text: "text-violet-700",  badge: "bg-violet-50 border-violet-100",
  // },
];

// ── Per-site data ─────────────────────────────────────────────────────────────
const gmsSiteRows = gmsPromoData.canettePromo.bySite.map((s, i) => ({
  site:        s.site,
  canettes:    s.canettes,
  offertes:    s.offertes,
  tickets:     s.tickets,
  packs:       gmsPromoData.packPromo.bySite[i].packs,
  packsOfferts:gmsPromoData.packPromo.bySite[i].packsOfferts,
  goodies:     gmsPromoData.packPromo.bySite[i].goodies,
}));

const chrSiteRows = chrPromoData.bouteillePromo.bySite;

// ── Daily chart data ──────────────────────────────────────────────────────────
const gmsChartData = gmsPromoData.sitePerDay.map(d => ({
  date:     d.date,
  canettes: d.sites.reduce((s, x) => s + x.canettes, 0),
  offertes: d.sites.reduce((s, x) => s + x.offertes, 0),
  tickets:  d.sites.reduce((s, x) => s + x.tickets, 0),
}));

const chrChartData = chrPromoData.sitePerDay.map(d => ({
  date:       d.date,
  bouteilles: d.sites.reduce((s, x) => s + x.bouteilles, 0),
  offertes:   d.sites.reduce((s, x) => s + x.offertes, 0),
  tirages:    d.sites.reduce((s, x) => s + x.tirages, 0),
}));

// ── Activity feed ───────────────────────────────────────────────────────────
interface Activity {
  id: string; label: string; icon: string;
  site: string; time: string;
  dotBg: string; textColor: string; badgeBg: string;
}

const GMS_SITES = ["Géant CKDO", "Super Gros (Carrefour SNI)", "Mbolo", "Super gros", "Prix import"];
const CHR_SITES = ["Radisson Blu", "LMB (Mindoubé)"];

const GMS_POOL = [
  { label: "Canette offerte",      icon: "🍺", dotBg: "bg-amber-500",  textColor: "text-amber-700",  badgeBg: "bg-amber-50"  },
  { label: "Pack offert",          icon: "📦", dotBg: "bg-orange-500", textColor: "text-orange-700", badgeBg: "bg-orange-50" },
  { label: "Goodie distribué",     icon: "🎁", dotBg: "bg-violet-500", textColor: "text-violet-700", badgeBg: "bg-violet-50" },
  { label: "Ticket tombola gagné", icon: "🎟️", dotBg: "bg-pink-500",   textColor: "text-pink-700",   badgeBg: "bg-pink-50"   },
];
const CHR_POOL = [
  { label: "Bouteille offerte",    icon: "🍾", dotBg: "bg-emerald-500", textColor: "text-emerald-700", badgeBg: "bg-emerald-50" },
  { label: "Goodie distribué",     icon: "🎁", dotBg: "bg-amber-500",   textColor: "text-amber-700",   badgeBg: "bg-amber-50"   },
  { label: "Tirage tombola",       icon: "🎟️", dotBg: "bg-blue-500",    textColor: "text-blue-700",    badgeBg: "bg-blue-50"    },
];

function makeActivity(isGMS: boolean, minsAgo: number, idx: number): Activity {
  const pool  = isGMS ? GMS_POOL  : CHR_POOL;
  const sites = isGMS ? GMS_SITES : CHR_SITES;
  const tpl   = pool[idx % pool.length];
  const site  = sites[idx % sites.length];
  const d     = new Date(Date.now() - minsAgo * 60_000);
  const time  = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { id: `${d.getTime()}-${idx}`, ...tpl, site, time };
}

function buildInitialFeed(isGMS: boolean): Activity[] {
  return [2, 5, 9, 14, 18, 24, 31, 39, 47, 56, 68, 82, 97, 115, 134]
    .map((mins, i) => makeActivity(isGMS, mins, i));
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CompanyCampaignDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [feed, setFeed] = useState<Activity[]>([]);

  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  // Build initial feed after mount (avoids SSR mismatch)
  useEffect(() => {
    if (id === GMS_ID || id === CHR_ID) {
      setFeed(buildInitialFeed(id === GMS_ID));
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push("/auth/login"); return; }
      if (user.role !== "company") { router.push("/dashboard"); return; }
      if (id !== GMS_ID && id !== CHR_ID) { router.push("/dashboard/company"); return; }
    }
  }, [user, authLoading, router, id]);

  // Simulate live refresh every 30 s — adds a new activity to the feed
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setLastUpdate(now);
      setFeed(prev => [
        makeActivity(id === GMS_ID, 0, Math.floor(Math.random() * (id === GMS_ID ? GMS_POOL.length : CHR_POOL.length))),
        ...prev,
      ].slice(0, 20));
    }, 30_000);
    return () => clearInterval(t);
  }, [id]);

  const isGMS    = id === GMS_ID;
  const campaign = isGMS ? export33Campaign : export33CampaignCHR;
  const kpis     = isGMS ? GMS_KPIS : CHR_KPIS;

  // ── Export handlers ───────────────────────────────────────────────────────
  function handleExportDaily() {
    if (isGMS) {
      const rows = gmsPromoData.sitePerDay.flatMap(d =>
        d.sites.map(s => ({
          Date:               d.date,
          Site:               s.site,
          "Canettes vendues": s.canettes,
          "Canettes offertes":s.offertes,
          "Tickets tombola":  s.tickets,
        }))
      );
      downloadCSV(rows, "GMS_33Export_performance_par_jour.csv");
    } else {
      const rows = chrPromoData.sitePerDay.flatMap(d =>
        d.sites.map(s => ({
          Date:                  d.date,
          Site:                  s.site,
          "Bouteilles vendues":  s.bouteilles,
          "Bouteilles offertes": s.offertes,
          "Tirages tombola":     s.tirages,
        }))
      );
      downloadCSV(rows, "CHR_33Export_performance_par_jour.csv");
    }
  }

  function handleExportBilan() {
    if (isGMS) {
      const rows = gmsSiteRows.map(s => ({
        Site:                  s.site,
        "Canettes vendues":    s.canettes,
        "Canettes offertes":   s.offertes,
        "Tickets tombola can.":s.tickets,
        "Packs vendus":        s.packs,
        "Packs offerts":       s.packsOfferts,
        "Goodies":             s.goodies,
      }));
      downloadCSV(rows, "GMS_33Export_bilan_final.csv");
    } else {
      const rows = chrSiteRows.map(s => ({
        Site:                  s.site,
        "Bouteilles vendues":  s.bouteilles,
        "Bouteilles offertes": s.offertes,
        "Tirages tombola":     s.tirages,
      }));
      downloadCSV(rows, "CHR_33Export_bilan_final.csv");
    }
  }

  if (authLoading || !campaign) return null;

  const gradFrom   = isGMS ? "from-red-700 via-red-600 to-red-500" : "from-blue-700 via-blue-600 to-blue-500";
  const shadowHero = isGMS ? "shadow-red-400/30" : "shadow-blue-400/30";
  const accentIcon = isGMS ? "text-amber-500" : "text-blue-500";
  const accentBg   = isGMS ? "bg-amber-100"   : "bg-blue-100";
  const accentText = isGMS ? "text-amber-600"  : "text-blue-600";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradFrom} p-6 md:p-8 text-white shadow-2xl ${shadowHero}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        {/* Nav row */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/company"
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-white/60 text-xs hidden sm:block">
              Tableau de bord /&nbsp;{isGMS ? "GMS — Animation 33 Export" : "CHR LBV — Coupe du Monde"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-400/30 border border-green-300/40 text-white px-3 py-1 rounded-full font-semibold">
              Active
            </span>
            {!isGMS && (
              <span className="text-xs bg-amber-400/30 border border-amber-300/40 text-white px-3 py-1 rounded-full font-semibold">
                🏆 Finale 19 juil.
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">{campaign.name}</h1>
          <p className="text-white/70 text-sm mt-1 line-clamp-2">{campaign.description}</p>
          <div className="flex flex-wrap gap-4 text-white/70 text-xs mt-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(campaign.start_date).toLocaleDateString("fr-FR")} →{" "}
              {new Date(campaign.end_date).toLocaleDateString("fr-FR")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {campaign.location_details}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {isGMS ? "10 hôtesses VAC · 5 PDV" : "8 hôtesses · 2 Fans Zones"}
            </span>
          </div>
        </div>

        {/* KPI chips */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {kpis.slice(0, 4).map((k, i) => {
            const pct = Math.min(Math.round((k.value / k.target) * 100), 100);
            return (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-base mb-1">{k.icon}</div>
                <div className="text-xl font-bold leading-none">
                  {k.value}
                  <span className="text-xs font-normal text-white/55 ml-1">/ {k.target}</span>
                </div>
                <div className="text-xs text-white/60 mt-0.5">{k.label}</div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live indicator + Export buttons ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span>
            Mis à jour : {lastUpdate ? lastUpdate.toLocaleTimeString("fr-FR") : "—"}
          </span>
          <span className="text-slate-300">·</span>
          <RefreshCw className="w-3 h-3" />
          <span>Actualisation toutes les 30 s</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportDaily}
            className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export par jour
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportBilan}
            className={cn("gap-1.5 text-xs border-red-200 hover:bg-red-50", isGMS ? "text-red-700" : "text-blue-700")}>
            <Download className="w-3.5 h-3.5" />
            Bilan final
          </Button>
        </div>
      </div>

      {/* ── Promo objectives progress ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="flex items-center gap-2 font-bold text-sm text-foreground mb-5">
          <div className={`w-6 h-6 ${accentBg} rounded-lg flex items-center justify-center shrink-0`}>
            <Tag className={`w-3.5 h-3.5 ${accentText}`} />
          </div>
          Avancement des objectifs promo
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Objectifs calculés sur la base de {isGMS ? "1 140" : "320"} Distributions
          </span>
        </h2>
        <div className="space-y-5">
          {kpis.map((k, i) => {
            const pct = Math.min(Math.round((k.value / k.target) * 100), 100);
            return (
              <div key={i}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="text-base">{k.icon}</span>
                    {k.label}
                  </span>
                  <span className={`font-bold ${k.text} flex items-center gap-1.5`}>
                    {k.value}
                    <span className="text-muted-foreground font-normal text-xs">/ {k.target}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.badge} font-semibold`}>{pct}%</span>
                  </span>
                </div>
                <div className={`h-3 ${k.track} rounded-full overflow-hidden shadow-inner`}>
                  <div
                    className={`h-full ${k.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Daily performance chart ──────────────────────────────────────────── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${accentIcon}`} />
            Performance journalière — tous sites confondus
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isGMS
              ? "Canettes vendues · Canettes offertes (÷4) · Tickets tombola (÷6)"
              : "Bouteilles vendues · Bouteilles offertes (÷3) · Tirages tombola (÷9)"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={isGMS ? gmsChartData : chrChartData}
                margin={{ top: 4, right: 10, bottom: 28, left: -20 }}
                barSize={isGMS ? 8 : 11}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 8 }}
                  axisLine={false} tickLine={false}
                  angle={-18} textAnchor="end" interval={0}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                {isGMS ? (
                  <>
                    <Bar dataKey="canettes" name="Canettes vendues"  fill="#F59E0B" radius={[3,3,0,0]} />
                    <Bar dataKey="offertes" name="Canettes offertes" fill="#F97316" radius={[3,3,0,0]} />
                    <Bar dataKey="tickets"  name="Tickets tombola"   fill="#EC4899" radius={[3,3,0,0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="bouteilles" name="Bouteilles vendues"  fill="#3B82F6" radius={[3,3,0,0]} />
                    <Bar dataKey="offertes"   name="Bouteilles offertes" fill="#10B981" radius={[3,3,0,0]} />
                    <Bar dataKey="tirages"    name="Tirages tombola"     fill="#F59E0B" radius={[3,3,0,0]} />
                  </>
                )}
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Dernières actions ──────────────────────────────────────────────── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Dernières actions
            </CardTitle>
            <span className="text-xs text-muted-foreground bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              {feed.length} événements
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Actions enregistrées en temps réel sur tous les sites</p>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chargement du flux…</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {feed.map((a, i) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    i === 0 ? "bg-green-50 border border-green-100" : "hover:bg-slate-50",
                  )}
                >
                  {/* Dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.dotBg}`} />
                  {/* Icon + label */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base leading-none">{a.icon}</span>
                    <span className={`text-sm font-semibold ${a.textColor}`}>{a.label}</span>
                    {i === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>
                    )}
                  </div>
                  {/* Site */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${a.badgeBg} ${a.textColor}`}>
                    {a.site}
                  </span>
                  {/* Time */}
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Per-site performance table ───────────────────────────────────────── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${accentIcon}`} />
            Performance par {isGMS ? "PDV (point de vente)" : "Fans Zone"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground rounded-tl-xl">Site</th>
                  {isGMS ? (
                    <>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-amber-600">Canettes vendues</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-orange-600">Canettes offertes</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-pink-600">Tickets tombola</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-red-600">Packs vendus</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-amber-600">Packs offerts</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-violet-600 rounded-tr-xl">Goodies</th>
                    </>
                  ) : (
                    <>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-blue-600">Bouteilles vendues</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-emerald-600">Bouteilles offertes</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-amber-600 rounded-tr-xl">Tirages tombola</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isGMS
                  ? gmsSiteRows.map((s, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{s.site}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-700">{s.canettes}</td>
                        <td className="py-3 px-4 text-right text-orange-600">{s.offertes}</td>
                        <td className="py-3 px-4 text-right text-pink-600">{s.tickets}</td>
                        <td className="py-3 px-4 text-right text-red-700">{s.packs}</td>
                        <td className="py-3 px-4 text-right text-amber-700">{s.packsOfferts}</td>
                        <td className="py-3 px-4 text-right font-bold text-violet-700">{s.goodies}</td>
                      </tr>
                    ))
                  : chrSiteRows.map((s, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{s.site}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">{s.bouteilles}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{s.offertes}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{s.tirages}</td>
                      </tr>
                    ))
                }
                {/* Totals row */}
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="py-3 px-4 text-foreground">Total</td>
                  {isGMS ? (
                    <>
                      <td className="py-3 px-4 text-right text-amber-700">{gmsSiteRows.reduce((s, x) => s + x.canettes, 0)}</td>
                      <td className="py-3 px-4 text-right text-orange-600">{gmsSiteRows.reduce((s, x) => s + x.offertes, 0)}</td>
                      <td className="py-3 px-4 text-right text-pink-600">{gmsSiteRows.reduce((s, x) => s + x.tickets, 0)}</td>
                      <td className="py-3 px-4 text-right text-red-700">{gmsSiteRows.reduce((s, x) => s + x.packs, 0)}</td>
                      <td className="py-3 px-4 text-right text-amber-700">{gmsSiteRows.reduce((s, x) => s + x.packsOfferts, 0)}</td>
                      <td className="py-3 px-4 text-right text-violet-700">{gmsSiteRows.reduce((s, x) => s + x.goodies, 0)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-right text-blue-700">{chrSiteRows.reduce((s, x) => s + x.bouteilles, 0)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{chrSiteRows.reduce((s, x) => s + x.offertes, 0)}</td>
                      <td className="py-3 px-4 text-right text-amber-600">{chrSiteRows.reduce((s, x) => s + x.tirages, 0)}</td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Promo rule reminder ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 text-xs text-muted-foreground ${isGMS ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"}`}>
        <p className="font-semibold text-foreground mb-1">
          {isGMS ? "📋 Mécaniques GMS" : "📋 Mécaniques CHR LBV"}
        </p>
        {isGMS ? (
          <p>
            <strong>Canettes :</strong> 4 canettes achetées = 1 canette offerte · 6 canettes achetées = 1 ticket tombola
            {" "}&nbsp;&nbsp;<strong>Packs :</strong> 1 pack acheté = 1 ticket · 4 packs achetés = 1 pack offert + ticket + lot
          </p>
        ) : (
          <p>
            <strong>Bouteilles :</strong> 3 bouteilles achetées = 1 bouteille offerte · 9 bouteilles achetées = 1 tirage tombola
            {" "}&nbsp;&nbsp;<strong>Finale 19 juillet :</strong> 1 ticket tombola spécial distribué
          </p>
        )}
      </div>

    </div>
  );
}
