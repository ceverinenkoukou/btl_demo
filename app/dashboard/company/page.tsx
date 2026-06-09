"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { mock33ExportStats, export33CampaignCHR, export33CampaignSites, export33CampaignSitesCHR, mockCampaigns, gmsPromoData, chrPromoData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, Trophy, ShoppingCart, TrendingUp, Users,
  CalendarDays, MapPin, ArrowUp, Gift, Beer, Package, Tag, Ticket,
  Download, RefreshCw, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const RED        = "#DC2626";
const RED_LIGHT  = "#EF4444";
const AMBER      = "#F59E0B";
const GREEN      = "#10B981";
const PIE_COLORS = [RED, AMBER, "#3B82F6", "#8B5CF6", "#06B6D4"];
const GENDER_PIE = [RED, "#3B82F6", "#94A3B8"];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}
function fmtXOF(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
}

// ── CSV export ──────────────────────────────────────────────────────────────────────────────
function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(","), ...rows.map(r => cols.map(c => `"${r[c]}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

// ── Activity feed ────────────────────────────────────────────────────────────────────────────
interface IActivity {
  id: string; label: string; icon: string;
  campaign: "GMS" | "CHR"; site: string; time: string;
  dotBg: string; textColor: string; badgeBg: string;
}

const _GMS_SITES = ["Géant CKDO", "Super Gros (Carrefour SNI)", "Mbolo", "Super gros", "Prix import"];
const _CHR_SITES = ["Radisson Blu", "LMB (Mindoubé)"];

const _GMS_POOL = [
  { label: "Canette offerte",      icon: "🍺", dotBg: "bg-amber-500",  textColor: "text-amber-700",  badgeBg: "bg-amber-50"  },
  { label: "Pack offert",          icon: "📦", dotBg: "bg-orange-500", textColor: "text-orange-700", badgeBg: "bg-orange-50" },
  { label: "Goodie distribué",     icon: "🎁", dotBg: "bg-violet-500", textColor: "text-violet-700", badgeBg: "bg-violet-50" },
  { label: "Ticket tombola gagné", icon: "🎟️", dotBg: "bg-pink-500",   textColor: "text-pink-700",   badgeBg: "bg-pink-50"   },
];
const _CHR_POOL = [
  { label: "Bouteille offerte",    icon: "🍾", dotBg: "bg-emerald-500", textColor: "text-emerald-700", badgeBg: "bg-emerald-50" },
  { label: "Goodie distribué",     icon: "🎁", dotBg: "bg-amber-500",   textColor: "text-amber-700",   badgeBg: "bg-amber-50"   },
  { label: "Tirage tombola",       icon: "🎟️", dotBg: "bg-blue-500",    textColor: "text-blue-700",    badgeBg: "bg-blue-50"    },
];

function _makeActivity(isGMS: boolean, minsAgo: number, idx: number): IActivity {
  const pool  = isGMS ? _GMS_POOL  : _CHR_POOL;
  const sites = isGMS ? _GMS_SITES : _CHR_SITES;
  const tpl   = pool[Math.abs(idx) % pool.length];
  const site  = sites[Math.abs(idx) % sites.length];
  const d     = new Date(Date.now() - minsAgo * 60_000);
  return {
    id: `${d.getTime()}-${idx}`,
    ...tpl,
    campaign: isGMS ? "GMS" : "CHR",
    site,
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function _buildInitialFeed(): IActivity[] {
  const offsets = [1, 3, 6, 9, 12, 16, 21, 27, 33, 40, 50, 62, 76, 92, 110];
  return offsets.map((mins, i) => _makeActivity(i % 3 !== 0, mins, i));
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-3 text-xs min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function CompanyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState("Géant CKDO");
  const [selectedCHRSite, setSelectedCHRSite] = useState("Radisson Blu");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [feed, setFeed] = useState<IActivity[]>([]);
  const stats = mock33ExportStats;

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push("/auth/login"); return; }
      if (user.role !== "company") { router.push("/dashboard"); return; }
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setLastUpdate(new Date());
    setFeed(_buildInitialFeed());
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLastUpdate(new Date());
      const isGMS = Math.random() > 0.35;
      setFeed(prev => [
        _makeActivity(isGMS, 0, Math.floor(Math.random() * (isGMS ? _GMS_POOL.length : _CHR_POOL.length))),
        ...prev,
      ].slice(0, 25));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  function handleExportGMSDaily() {
    const rows = gmsPromoData.sitePerDay.flatMap(d =>
      d.sites.map(s => ({
        Date: d.date, Site: s.site,
        "Canettes vendues": s.canettes, "Canettes offertes": s.offertes, "Tickets tombola": s.tickets,
      }))
    );
    downloadCSV(rows, "GMS_33Export_par_jour.csv");
  }
  function handleExportCHRDaily() {
    const rows = chrPromoData.sitePerDay.flatMap(d =>
      d.sites.map(s => ({
        Date: d.date, Site: s.site,
        "Bouteilles vendues": s.bouteilles, "Bouteilles offertes": s.offertes, "Tirages tombola": s.tirages,
      }))
    );
    downloadCSV(rows, "CHR_33Export_par_jour.csv");
  }
  function handleExportBilan() {
    const gms = gmsPromoData.canettePromo.bySite.map((s, i) => ({
      Campagne: "GMS", Site: s.site,
      "Canettes vendues": s.canettes, "Canettes offertes": s.offertes, "Tickets can.": s.tickets,
      "Packs vendus": gmsPromoData.packPromo.bySite[i].packs,
      "Packs offerts": gmsPromoData.packPromo.bySite[i].packsOfferts,
      "Goodies": gmsPromoData.packPromo.bySite[i].goodies,
    }));
    const chr = chrPromoData.bouteillePromo.bySite.map(s => ({
      Campagne: "CHR", Site: s.site,
      "Bouteilles vendues": s.bouteilles, "Bouteilles offertes": s.offertes, "Tirages tombola": s.tirages,
      "Canettes vendues": "-", "Canettes offertes": "-", "Tickets can.": "-", "Packs vendus": "-", "Packs offerts": "-", "Goodies": "-",
    }));
    downloadCSV([...gms, ...chr], "33Export_bilan_final.csv");
  }

  // Only show campaigns belonging to this company
  const companyCampaigns = mockCampaigns.filter(
    c => c.company_id === user?.company_id
  );
  const sites = [...export33CampaignSites, ...export33CampaignSitesCHR];

  const today        = new Date();
  const startDate    = new Date(export33CampaignCHR.start_date);  // plus tôt : CHR 16 juin
  const endDate      = new Date(export33CampaignCHR.end_date);    // plus tard : CHR 19 juil.
  const totalDays    = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);
  const daysElapsed  = Math.min(Math.max(Math.floor((today.getTime() - startDate.getTime()) / 86_400_000), 0), totalDays);
  const daysLeft     = Math.max(Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000), 0);

  const kpis = [
    {
      label: "Interactions consommateurs",
      value: fmt(stats.totalTastings),
      icon: <Beer className="w-6 h-6" />,
      trend: `${stats.conversionRate}% conv.`,
      gradient: "from-red-600 via-red-500 to-orange-400",
      shadow: "shadow-red-300/50",
    },
    {
      label: "Distributions réalisées",
      value: fmt(stats.totalSales),
      icon: <ShoppingCart className="w-6 h-6" />,
      trend: `${stats.objectiveSalesPct}% obj.`,
      gradient: "from-amber-500 via-orange-500 to-yellow-400",
      shadow: "shadow-amber-300/50",
    },
    {
      label: "Chiffre d’affaires",
      value: fmtXOF(stats.totalRevenue),
      icon: <TrendingUp className="w-6 h-6" />,
      trend: "+8%",
      gradient: "from-emerald-600 via-green-500 to-teal-400",
      shadow: "shadow-emerald-300/50",
    },
    {
      label: "Goodies distribués",
      value: fmt(stats.goodiesDistributed),
      icon: <Gift className="w-6 h-6" />,
      trend: `${fmt(stats.goodiesDistributed)} lots`,
      gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
      shadow: "shadow-violet-300/50",
    },
  ];

  if (authLoading || loading) return <CompanySkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 p-6 md:p-8 text-white shadow-2xl shadow-red-400/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-yellow-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shrink-0">
              <span className="text-red-600 font-black text-2xl md:text-3xl leading-none">"33"</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-white/25 text-white border-white/40 text-xs backdrop-blur-sm">
                  Sobraga SA
                </Badge>
                <Badge className="bg-green-400/30 text-white border-green-300/40 text-xs backdrop-blur-sm">
                  En cours
                </Badge>
              </div>
              <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
                33 Export — 2 Campagnes Actives
              </h1>
              <p className="text-white/80 text-sm mt-0.5">GMS × CHR Libreville 🏆</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <CalendarDays className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="font-bold text-lg">{daysElapsed}</p>
              <p className="text-white/70 text-xs">Jours écoulés</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <Target className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="font-bold text-lg">{daysLeft}</p>
              <p className="text-white/70 text-xs">Jours restants</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <MapPin className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="font-bold text-lg">{sites.length}</p>
              <p className="text-white/70 text-xs">PDV actifs</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <Target className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="font-bold text-lg">{companyCampaigns.length}</p>
              <p className="text-white/70 text-xs">Campagnes</p>
            </div>
          </div>
        </div>

        {/* Campaign dates */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3 text-white/75 text-xs">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="font-semibold text-white/90">CHR LBV :</span>
            16 juin → 19 juillet 2025 (16 jours animés)
          </span>
          <span className="text-white/40">•</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="font-semibold text-white/90">GMS :</span>
            24 juin → 11 juillet 2025 (12 jours animés)
          </span>
        </div>
      </div>

      {/* ── Objectives progress (Distributions uniquement) ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <ProgressCard
          label="Objectif distribution GMS (1 140 Distributions)"
          current={1050}
          objective={1140}
          pct={Math.round((1050 / 1140) * 100)}
          icon={<ShoppingCart className="w-4 h-4" />}
          color="bg-amber-500"
          trackColor="bg-amber-100"
        />
        <ProgressCard
          label="Objectif distribution CHR LBV (320 Distributions)"
          current={292}
          objective={320}
          pct={Math.round((292 / 320) * 100)}
          icon={<ShoppingCart className="w-4 h-4" />}
          color="bg-red-500"
          trackColor="bg-red-100"
        />
      </div>

      {/* ── Live indicator + Export buttons ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span>Mis à jour : <strong className="text-foreground">{lastUpdate ? lastUpdate.toLocaleTimeString("fr-FR") : "—"}</strong></span>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="hidden sm:flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Actualisation toutes les 30 s
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportGMSDaily} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export GMS par jour
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCHRDaily} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CHR par jour
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportBilan} className="gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50">
            <Download className="w-3.5 h-3.5" /> Bilan final (toutes campagnes)
          </Button>
        </div>
      </div>

      {/* ── Objectifs Promo Campagnes ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* GMS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Beer className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="font-bold text-sm text-foreground">Objectifs Promo GMS</p>
            <Link href="/dashboard/company/campaigns/3"
              className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 hover:underline">
              Voir le détail →
            </Link>
          </div>
          <div className="space-y-4">
            <PromoProgressRow label="Canettes offertes" current={262} target={285} colorBar="bg-amber-500" colorText="text-amber-600" trackColor="bg-amber-100" />
            <PromoProgressRow label="Goodies distribués" current={105} target={120} colorBar="bg-violet-500" colorText="text-violet-600" trackColor="bg-violet-100" />
            <PromoProgressRow label="Tickets tombola" current={175} target={190} colorBar="bg-red-500" colorText="text-red-600" trackColor="bg-red-100" />
          </div>
        </div>
        {/* CHR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Beer className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="font-bold text-sm text-foreground">Objectifs Promo CHR LBV</p>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-amber-600 font-semibold">🏆 Finale 19 juil.</span>
              <Link href="/dashboard/company/campaigns/4"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline">
                Voir le détail →
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <PromoProgressRow label="Bouteilles offertes" current={97}  target={106} colorBar="bg-blue-500"    colorText="text-blue-600"    trackColor="bg-blue-100"    />
            <PromoProgressRow label="Goodies distribués" current={32}  target={35}  colorBar="bg-emerald-500" colorText="text-emerald-600" trackColor="bg-emerald-100" />
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 text-white shadow-xl ${kpi.shadow} hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 cursor-default`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.08),transparent)]" />
            <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {kpi.icon}
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full bg-white/25">
                  <ArrowUp className="w-3 h-3" />{kpi.trend}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight leading-tight">{kpi.value}</div>
              <p className="text-white/80 text-xs mt-1 font-medium">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Daily chart ── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Progression journalière — 16 Juin au 19 Juillet (GMS + CHR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gTastings33" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSales33" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="tastings" stroke={RED} strokeWidth={3}
                  fill="url(#gTastings33)" name="Dégustations" dot={false}
                  activeDot={{ r: 6, fill: RED, stroke: "#fff", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="sales" stroke={AMBER} strokeWidth={3}
                  fill="url(#gSales33)" name="Distributions" dot={false}
                  activeDot={{ r: 6, fill: AMBER, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RED }} />
              <span className="text-xs text-muted-foreground font-medium">Dégustations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AMBER }} />
              <span className="text-xs text-muted-foreground font-medium">Distributions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Site breakdown + Gender pie ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-lg shadow-slate-100 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Performance par site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byZone} margin={{ top: 5, right: 10, bottom: 30, left: -20 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="zone" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false}
                    angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="tastings" name="Dégustations" fill={RED} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sales"    name="Distributions"       fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Profil consommateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.byGender} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                    paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {stats.byGender.map((_, idx) => (
                      <Cell key={idx} fill={GENDER_PIE[idx % GENDER_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-1">
              {stats.byGender.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GENDER_PIE[i] }} />
                  <span className="text-muted-foreground flex-1">{item.name}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sites & Team detail ── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            Détail des sites &amp; équipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sites.map((site) => {
              const supervisors = site.team?.filter(m => m.role === "supervisor") ?? [];
              const hostesses   = site.team?.filter(m => m.role === "hostess") ?? [];
              const siteStats   = stats.byZone.find(z => z.zone === site.name);
              return (
                <div key={site.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{site.zone?.city}, {site.zone?.region}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs shrink-0">Actif</Badge>
                  </div>
                  {siteStats && (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white rounded-lg p-2 text-center border border-slate-100">
                        <p className="text-xs text-muted-foreground">Dégust.</p>
                        <p className="font-bold text-red-600 text-sm">{fmt(siteStats.tastings)}</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-2 text-center border border-slate-100">
                        <p className="text-xs text-muted-foreground">Distributions</p>
                        <p className="font-bold text-amber-600 text-sm">{fmt(siteStats.sales)}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {supervisors.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Superviseur{supervisors.length > 1 ? "s" : ""}</p>
                        {supervisors.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                              {m.user?.full_name?.charAt(0) ?? "S"}
                            </div>
                            <span className="text-foreground">{m.user?.full_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {hostesses.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Hôtesse{hostesses.length > 1 ? "s" : ""}</p>
                        <div className="flex flex-wrap gap-1">
                          {hostesses.map((m, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                              {m.user?.full_name?.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Product performance + Age breakdown ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Beer className="w-4 h-4 text-red-500" />
              Performance produits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.byProduct.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground truncate max-w-[55%]">{p.name}</span>
                  <span className="text-sm font-bold text-red-600">{fmt(p.sales)} Distributions</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((p.sales / (stats.byProduct[0].sales || 1)) * 100)}%`,
                      background: i === 0 ? RED : AMBER,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtXOF(p.revenue)}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total CA</span>
              <span className="text-base font-bold text-foreground">{fmtXOF(stats.totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Tranches d&apos;âge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byAge} margin={{ top: 5, right: 10, bottom: 0, left: -20 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="value" name="Part (%)" radius={[4, 4, 0, 0]}>
                    {stats.byAge.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── GMS Mécaniques Promotionnelles ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5 text-red-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">GMS — Mécaniques Promotionnelles</h2>
          <span className="ml-auto text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">Animation 33 Export GMS</span>
        </div>

        {/* Pack promo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-red-500" />
            <p className="font-semibold text-sm text-foreground">Écoulement Packs</p>
            <span className="text-xs text-muted-foreground ml-1">1 pack = 1 ticket · 4 packs = 1 pack offert + ticket + lot</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Packs vendus",     value: gmsPromoData.packPromo.packsSold,     color: "text-red-700",    bg: "bg-red-50 border-red-100"    },
              { label: "Tickets tombola",  value: gmsPromoData.packPromo.ticketsOfferts, color: "text-amber-700",  bg: "bg-amber-50 border-amber-100"  },
              { label: "Packs offerts",    value: gmsPromoData.packPromo.packsOfferts,  color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
              { label: "Goodies gagnés",   value: gmsPromoData.packPromo.goodiesGagnés, color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl p-3 border text-center ${k.bg}`}>
                <p className={`text-2xl font-bold ${k.color}`}>{fmt(k.value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gmsPromoData.packPromo.bySite} margin={{ top: 5, right: 10, bottom: 28, left: -20 }} barSize={13}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="site" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} angle={-18} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="packs"        name="Packs vendus"  fill={RED}       radius={[3,3,0,0]} />
                <Bar dataKey="packsOfferts" name="Packs offerts" fill={AMBER}     radius={[3,3,0,0]} />
                <Bar dataKey="goodies"      name="Goodies"       fill="#8B5CF6"  radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Canette promo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Beer className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-sm text-foreground">Écoulement Canettes</p>
            <span className="text-xs text-muted-foreground ml-1">4 can = 1 offerte · 6 can = 1 ticket tombola</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Canettes vendues",  value: gmsPromoData.canettePromo.canettesVendues, color: "text-amber-700",  bg: "bg-amber-50 border-amber-100"  },
              { label: "Canettes offertes", value: gmsPromoData.canettePromo.canetteOffertes, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
              { label: "Tickets tombola",   value: gmsPromoData.canettePromo.ticketsTombola,  color: "text-red-700",   bg: "bg-red-50 border-red-100"    },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl p-3 border text-center ${k.bg}`}>
                <p className={`text-2xl font-bold ${k.color}`}>{fmt(k.value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gmsPromoData.canettePromo.bySite} margin={{ top: 5, right: 10, bottom: 28, left: -20 }} barSize={13}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="site" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} angle={-18} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="canettes" name="Canettes vendues"  fill={AMBER}     radius={[3,3,0,0]} />
                <Bar dataKey="offertes" name="Canettes offertes" fill="#F97316"   radius={[3,3,0,0]} />
                <Bar dataKey="tickets"  name="Tickets tombola"   fill={RED}       radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Performance canettes GMS par site / par jour ── */}
      <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 shrink-0">
              <Ticket className="w-4 h-4 text-red-500" />
              Performance Canettes GMS — par site / par jour
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              {gmsPromoData.sitePerDay[0].sites.map(s => (
                <button
                  key={s.site}
                  onClick={() => setSelectedSite(s.site)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                    selectedSite === s.site
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-muted-foreground border-slate-200 hover:border-red-300"
                  )}
                >
                  {s.site}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary KPIs for selected site */}
          {(() => {
            const siteCan  = gmsPromoData.canettePromo.bySite.find(s => s.site === selectedSite);
            const sitePack = gmsPromoData.packPromo.bySite.find(s => s.site === selectedSite);
            if (!siteCan || !sitePack) return null;
            return (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                {[
                  { label: "Canettes vendues",  value: siteCan.canettes,    color: "text-amber-600" },
                  { label: "Canettes offertes", value: siteCan.offertes,    color: "text-orange-600" },
                  { label: "Tickets can.",       value: siteCan.tickets,    color: "text-red-600" },
                  { label: "Packs vendus",       value: sitePack.packs,     color: "text-red-700" },
                  { label: "Packs offerts",      value: sitePack.packsOfferts, color: "text-amber-700" },
                  { label: "Goodies",            value: sitePack.goodies,   color: "text-violet-600" },
                ].map((k, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className={`text-xl font-bold ${k.color}`}>{fmt(k.value)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{k.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Per-day bar chart for selected site */}
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gmsPromoData.sitePerDay.map(d => {
                  const s = d.sites.find(x => x.site === selectedSite);
                  return { date: d.date, canettes: s?.canettes ?? 0, offertes: s?.offertes ?? 0, tickets: s?.tickets ?? 0 };
                })}
                margin={{ top: 5, right: 10, bottom: 24, left: -20 }} barSize={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} angle={-18} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="canettes" name="Canettes vendues"  fill={AMBER}   radius={[3,3,0,0]} />
                <Bar dataKey="offertes" name="Canettes offertes" fill="#F97316" radius={[3,3,0,0]} />
                <Bar dataKey="tickets"  name="Tickets tombola"   fill={RED}     radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── CHR LBV — Mécanique Promotionnelle ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">CHR LBV — Mécanique Promotionnelle</h2>
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">Animation CHR LBV</span>
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">🏆 Finale 19 juillet</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Beer className="w-4 h-4 text-blue-500" />
            <p className="font-semibold text-sm text-foreground">Écoulement Bouteilles 65cl</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4 ml-6">
            3 bouteilles achetées = 1 bouteille offerte · 9 bouteilles = 1 tirage tombola · Finale = 1 ticket tombola spécial
          </p>

          {/* KPI chips */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Bouteilles vendues",  value: chrPromoData.bouteillePromo.bouteillesVendues,  color: "text-blue-700",   bg: "bg-blue-50 border-blue-100"   },
              { label: "Bouteilles offertes", value: chrPromoData.bouteillePromo.bouteillesOffertes, color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-100" },
              { label: "Tirages tombola",     value: chrPromoData.bouteillePromo.tiragesTombola,     color: "text-amber-700",  bg: "bg-amber-50 border-amber-100"   },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl p-3 border text-center ${k.bg}`}>
                <p className={`text-2xl font-bold ${k.color}`}>{fmt(k.value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Per-site summary + per-day chart */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {chrPromoData.bouteillePromo.bySite.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">{s.site}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vendues",  value: s.bouteilles, color: "text-blue-700"    },
                    { label: "Offertes", value: s.offertes,   color: "text-emerald-700" },
                    { label: "Tirages",  value: s.tirages,    color: "text-amber-700"   },
                  ].map((m, j) => (
                    <div key={j} className="text-center">
                      <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Site selector + per-day chart */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <p className="text-xs font-medium text-muted-foreground">Vue par jour :</p>
            {chrPromoData.sitePerDay[0].sites.map(s => (
              <button
                key={s.site}
                onClick={() => setSelectedCHRSite(s.site)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                  selectedCHRSite === s.site
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-muted-foreground border-slate-200 hover:border-blue-300"
                )}
              >
                {s.site}
              </button>
            ))}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chrPromoData.sitePerDay.map(d => {
                  const s = d.sites.find(x => x.site === selectedCHRSite);
                  return { date: d.date, bouteilles: s?.bouteilles ?? 0, offertes: s?.offertes ?? 0, tirages: s?.tirages ?? 0, finale: d.isFinale };
                })}
                margin={{ top: 5, right: 10, bottom: 28, left: -20 }} barSize={11}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 8 }} axisLine={false} tickLine={false} angle={-18} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="bouteilles" name="Bouteilles vendues"  fill="#3B82F6" radius={[3,3,0,0]} />
                <Bar dataKey="offertes"   name="Bouteilles offertes" fill={GREEN}   radius={[3,3,0,0]} />
                <Bar dataKey="tirages"    name="Tirages tombola"     fill={AMBER}   radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <span>🏆</span>
            <span className="font-medium">19 juil. (Finale)</span> — ticket tombola spécial distribué lors de la finale de la Coupe du Monde
          </p>
        </div>
      </div>

      {/* ── Dernières actions (flux en temps réel) ── */}
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
          <p className="text-xs text-muted-foreground">Actions GMS + CHR enregistrées en temps réel</p>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chargement du flux…</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {feed.map((a, i) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    i === 0 ? "bg-green-50 border border-green-100" : "hover:bg-slate-50",
                  )}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.dotBg}`} />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base leading-none">{a.icon}</span>
                    <span className={`text-sm font-semibold ${a.textColor}`}>{a.label}</span>
                    {i === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold shrink-0",
                    a.campaign === "GMS" ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100",
                  )}>
                    {a.campaign}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${a.badgeBg} ${a.textColor}`}>
                    {a.site}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Goodies + Team summary ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Goodies distribués</p>
                <div className="text-5xl font-bold mt-1 text-violet-600">{fmt(stats.goodiesDistributed)}</div>
                <p className="text-sm text-muted-foreground mt-1">lots remportés sur la roue</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-300">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taux de participation</span>
                <span className="font-semibold text-violet-600">11%</span>
              </div>
              <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
                <div className="h-full w-[11%] bg-gradient-to-r from-violet-600 to-fuchsia-400 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Taux de conversion</p>
                <div className="text-5xl font-bold mt-1 text-red-600">{stats.conversionRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">dégustations → achats</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-red-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Objectif 50%</span>
                <span className="font-semibold text-red-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />{stats.conversionRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-red-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stats.conversionRate * 2, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PromoProgressRow({
  label, current, target, colorBar, colorText, trackColor,
}: {
  label: string; current: number; target: number;
  colorBar: string; colorText: string; trackColor: string;
}) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${colorText} shrink-0 ml-2`}>
          {fmt(current)}
          <span className="text-muted-foreground font-normal"> / {fmt(target)}</span>
        </span>
      </div>
      <div className={`h-2 ${trackColor} rounded-full overflow-hidden`}>
        <div className={`h-full ${colorBar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-xs mt-0.5 font-semibold ${colorText}`}>{pct}%</p>
    </div>
  );
}

function ProgressCard({
  label, current, objective, pct, icon, color, trackColor,
}: {
  label: string; current: number; objective: number; pct: number;
  icon: ReactNode; color: string; trackColor: string;
}) {
  const colorText = color === "bg-red-500" ? "text-red-600" : "text-amber-600";
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${color} bg-opacity-10 rounded-lg flex items-center justify-center ${colorText}`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className={`text-sm font-bold ${colorText}`}>{pct}%</span>
      </div>
      <div className={`h-3 ${trackColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{fmt(current)} réalisés</span>
        <span>Objectif: {fmt(objective)}</span>
      </div>
    </div>
  );
}

function CompanySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
