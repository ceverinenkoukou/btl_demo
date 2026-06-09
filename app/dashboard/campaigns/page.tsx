"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mockCampaigns, mockCompanies, mockZones, mockCampaignTeam, mockUsers, mockTastings, mockSales } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Search, Calendar, MapPin, Target, MoreVertical, Eye, Edit, Trash2,
  Loader2, Building2, Sparkles, UtensilsCrossed, ShoppingCart,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Campaign, Company, Zone, CampaignStatus, CampaignTeamMember } from "@/lib/types";

import { Gift, Beer, Wine } from 'lucide-react';

const GMS_CAMPAIGN_ID = "3";
const CHR_CAMPAIGN_ID = "4";

const STATUS_CFG: Record<CampaignStatus, { label: string; badge: string; strip: string }> = {
  draft:     { label: "Brouillon",  badge: "bg-slate-100 text-slate-600 border border-slate-200",         strip: "from-slate-400 to-slate-300" },
  planned:   { label: "Planifiée",  badge: "bg-blue-100 text-blue-700 border border-blue-200",            strip: "from-blue-500 to-cyan-400" },
  active:    { label: "Active",     badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",   strip: "from-emerald-500 to-teal-400" },
  paused:    { label: "En pause",   badge: "bg-amber-100 text-amber-700 border border-amber-200",         strip: "from-amber-400 to-yellow-300" },
  completed: { label: "Terminée",   badge: "bg-violet-100 text-violet-700 border border-violet-200",     strip: "from-violet-500 to-purple-400" },
  cancelled: { label: "Annulée",    badge: "bg-red-100 text-red-700 border border-red-200",               strip: "from-red-500 to-rose-400" },
};

// kept for compatibility with dialog form
const statusConfig = STATUS_CFG;

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getTeam(campaignId: string) {
  const members = mockCampaignTeam.filter(t => t.campaign_id === campaignId);
  return {
    hostess: members.find(m => m.role === "hostess"),
    supervisor: members.find(m => m.role === "supervisor"),
  };
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    zone_id: "",
    location_details: "",
    sales_objective: 0,
    tasting_objective: 0,
    free_objective: 0,
    goodies_objective: 0,
    start_date: "",
    end_date: "",
    status: "draft" as CampaignStatus,
    hostess_id: "",
    supervisor_id: "",
  });

  const availableHostesses = mockUsers.filter(u => u.role === "hostess" && u.is_active);
  const availableSupervisors = mockUsers.filter(u => ["supervisor", "manager", "coordinator"].includes(u.role) && u.is_active);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user?.role === "hostess") {
        const assignedIds = mockCampaignTeam
          .filter(t => t.user_id === user.id)
          .map(t => t.campaign_id);
        setCampaigns(mockCampaigns.filter(c => assignedIds.includes(c.id)));
      } else {
        setCampaigns([...mockCampaigns]);
      }
      setCompanies(mockCompanies);
      setZones(mockZones);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const campaignId = String(Date.now());
      const newCampaign: Campaign = {
        id: campaignId,
        ...formData,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company: companies.find(c => c.id === formData.company_id),
        zone: zones.find(z => z.id === formData.zone_id),
      };
      setCampaigns(prev => [newCampaign, ...prev]);

      const newTeamMembers: CampaignTeamMember[] = [];
      if (formData.hostess_id) {
        newTeamMembers.push({
          id: String(Date.now() + 1),
          campaign_id: campaignId,
          user_id: formData.hostess_id,
          role: "hostess",
          assigned_at: new Date().toISOString(),
          user: mockUsers.find(u => u.id === formData.hostess_id),
        });
      }
      if (formData.supervisor_id) {
        newTeamMembers.push({
          id: String(Date.now() + 2),
          campaign_id: campaignId,
          user_id: formData.supervisor_id,
          role: "supervisor",
          assigned_at: new Date().toISOString(),
          user: mockUsers.find(u => u.id === formData.supervisor_id),
        });
      }
      mockCampaignTeam.push(...newTeamMembers);

      toast.success("Campagne créée avec succès");
      setDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        company_id: "",
        zone_id: "",
        location_details: "",
        sales_objective: 0,
        tasting_objective: 0,
        free_objective: 0,
        goodies_objective: 0,
        start_date: "",
        end_date: "",
        status: "draft",
        hostess_id: "",
        supervisor_id: "",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Erreur lors de la création de la campagne");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne?")) return;

    try {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campagne supprimée");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManageCampaigns = user?.role && ["admin", "manager", "supervisor"].includes(user.role);
  const isAdmin = user?.role === "admin";

  const statCounts = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === "active").length,
    planned: campaigns.filter(c => c.status === "planned").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

  const CampaignForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la campagne *</Label>
          <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Entreprise *</Label>
          <Select value={formData.company_id} onValueChange={v => setFormData({ ...formData, company_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une entreprise" /></SelectTrigger>
            <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Zone</Label>
          <Select value={formData.zone_id} onValueChange={v => setFormData({ ...formData, zone_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une zone" /></SelectTrigger>
            <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} - {z.city}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Détails du lieu</Label>
          <Input id="location" value={formData.location_details} onChange={e => setFormData({ ...formData, location_details: e.target.value })} placeholder="Adresse, point de repère..." />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Objectif Distributions</Label>
          <Input type="number" min="0" value={formData.sales_objective} onChange={e => setFormData({ ...formData, sales_objective: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Objectif dégustations</Label>
          <Input type="number" min="0" value={formData.tasting_objective} onChange={e => setFormData({ ...formData, tasting_objective: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Objectif canettes offertes</Label>
          <Input type="number" min="0" value={formData.free_objective} onChange={e => setFormData({ ...formData, free_objective: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Objectif goodies</Label>
          <Input type="number" min="0" value={formData.goodies_objective} onChange={e => setFormData({ ...formData, goodies_objective: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début *</Label>
          <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin *</Label>
          <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as CampaignStatus })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(statusConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hôtesse assignée</Label>
          <Select value={formData.hostess_id} onValueChange={v => setFormData({ ...formData, hostess_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une hôtesse" /></SelectTrigger>
            <SelectContent>{availableHostesses.map(h => <SelectItem key={h.id} value={h.id}>{h.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Superviseur assigné</Label>
          <Select value={formData.supervisor_id} onValueChange={v => setFormData({ ...formData, supervisor_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un superviseur" /></SelectTrigger>
            <SelectContent>{availableSupervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
        <Button type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</> : "Créer la campagne"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">

      {/* ── Admin banner ── */}
      {isAdmin ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-500 p-6 md:p-8 text-white shadow-2xl shadow-indigo-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-20 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Administration</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campagnes Marketing</h1>
              <p className="text-white/70 mt-1 text-sm">Gérez et suivez toutes vos campagnes terrain</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm w-fit shrink-0">
                  <Plus className="w-4 h-4 mr-2" />Nouvelle campagne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une campagne</DialogTitle>
                  <DialogDescription>Remplissez les informations pour créer une nouvelle campagne</DialogDescription>
                </DialogHeader>
                <CampaignForm />
              </DialogContent>
            </Dialog>
          </div>
          {/* Quick stats chips */}
          <div className="relative z-10 grid grid-cols-4 gap-3 mt-6">
            {[
              { label: "Total",      value: statCounts.total,     icon: "📋" },
              { label: "Actives",    value: statCounts.active,    icon: "🟢" },
              { label: "Planifiées", value: statCounts.planned,   icon: "📅" },
              { label: "Terminées",  value: statCounts.completed, icon: "✅" },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                <div className="text-xs mb-0.5">{s.icon}</div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-white/65">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Campagnes</h1>
            <p className="text-muted-foreground mt-1">Gérez vos campagnes marketing terrain</p>
          </div>
          {canManageCampaigns && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nouvelle campagne</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une campagne</DialogTitle>
                  <DialogDescription>Remplissez les informations pour créer une nouvelle campagne</DialogDescription>
                </DialogHeader>
                <CampaignForm />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* ── Search & filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une campagne..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_CFG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-md animate-pulse">
              <div className="h-2 bg-slate-200" />
              <div className="p-5 space-y-3 bg-white">
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-16 bg-slate-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Aucune campagne trouvée</h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery || statusFilter !== "all" ? "Modifiez vos filtres pour voir plus de résultats" : "Créez votre première campagne pour commencer"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((campaign) => {
            const cfg = STATUS_CFG[campaign.status];
            const { hostess, supervisor } = getTeam(campaign.id);
            const tastingsDone = mockTastings.filter(t => t.campaign_id === campaign.id).length;
            const salesDone = mockSales.filter(s => s.campaign_id === campaign.id).length;
            const tastingPct = (campaign.tasting_objective ?? 0) > 0 ? Math.min(100, Math.round((tastingsDone / (campaign.tasting_objective ?? 1)) * 100)) : 0;
            const salesPct = campaign.sales_objective > 0 ? Math.min(100, Math.round((salesDone / campaign.sales_objective) * 100)) : 0;

            return (
              <div
                key={campaign.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden border border-slate-100"
              >
                {/* Status color strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.strip}`} />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-foreground leading-tight truncate">{campaign.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <span className="truncate">{campaign.company?.name ?? "—"}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Dates & zone */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString("fr-FR")}
                        {" → "}
                        {new Date(campaign.end_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    {campaign.zone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="truncate">{campaign.zone.name}{campaign.location_details ? ` · ${campaign.location_details}` : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress objectives - adaptés selon le type de campagne */}
                  {campaign.id === GMS_CAMPAIGN_ID ? (
                    // GMS: Distributions, Canettes offertes, Goodies
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <ShoppingCart className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs text-indigo-600 font-medium">Distributions</span>
                        </div>
                        <div className="text-lg font-bold text-indigo-700">{salesDone}<span className="text-xs font-normal text-indigo-400">/{campaign.sales_objective}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-700" style={{ width: `${salesPct}%` }} />
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Beer className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">Offertes</span>
                        </div>
                        <div className="text-lg font-bold text-amber-700">{Math.floor(salesDone / 4)}<span className="text-xs font-normal text-amber-400">/{campaign.free_objective ?? 315}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700" style={{ width: `${campaign.free_objective && campaign.free_objective > 0 ? Math.min(100, Math.round((Math.floor(salesDone / 4) / campaign.free_objective) * 100)) : 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Gift className="w-3 h-3 text-violet-500" />
                          <span className="text-xs text-violet-600 font-medium">Goodies</span>
                        </div>
                        <div className="text-lg font-bold text-violet-700">{Math.floor(salesDone / 6)}<span className="text-xs font-normal text-violet-400">/{campaign.goodies_objective ?? 720}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-violet-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700" style={{ width: `${campaign.goodies_objective && campaign.goodies_objective > 0 ? Math.min(100, Math.round((Math.floor(salesDone / 6) / campaign.goodies_objective) * 100)) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : campaign.id === CHR_CAMPAIGN_ID ? (
                    // CHR: Bouteilles vendues, Bouteilles offertes
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Wine className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs text-indigo-600 font-medium">Bouteilles</span>
                        </div>
                        <div className="text-lg font-bold text-indigo-700">{salesDone}<span className="text-xs font-normal text-indigo-400">/{campaign.sales_objective}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-700" style={{ width: `${salesPct}%` }} />
                        </div>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Gift className="w-3 h-3 text-rose-500" />
                          <span className="text-xs text-rose-600 font-medium">Offertes</span>
                        </div>
                        <div className="text-lg font-bold text-rose-700">{Math.floor(salesDone / 3)}<span className="text-xs font-normal text-rose-400">/est.</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-rose-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((Math.floor(salesDone / 3) / Math.max(1, Math.floor(campaign.sales_objective / 3))) * 100))}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Campagnes standard: Distributions et Dégustations
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <ShoppingCart className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs text-indigo-600 font-medium">Distributions</span>
                        </div>
                        <div className="text-lg font-bold text-indigo-700">{salesDone}<span className="text-xs font-normal text-indigo-400">/{campaign.sales_objective}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-700" style={{ width: `${salesPct}%` }} />
                        </div>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1.5">
                          <UtensilsCrossed className="w-3 h-3 text-violet-500" />
                          <span className="text-xs text-violet-600 font-medium">Dégustations</span>
                        </div>
                        <div className="text-lg font-bold text-violet-700">{tastingsDone}<span className="text-xs font-normal text-violet-400">/{campaign.tasting_objective ?? 0}</span></div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-violet-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700" style={{ width: `${tastingPct}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team */}
                  <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {hostess?.user ? initials(hostess.user.full_name) : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground leading-none mb-0.5">Hôtesse</p>
                        <p className="text-xs font-semibold text-foreground truncate">{hostess?.user?.full_name ?? "Non assignée"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {supervisor?.user ? initials(supervisor.user.full_name) : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground leading-none mb-0.5">Superviseur</p>
                        <p className="text-xs font-semibold text-foreground truncate">{supervisor?.user?.full_name ?? "Non assigné"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <Button size="sm" variant="outline" asChild className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Voir détails
                      </Link>
                    </Button>
                    {canManageCampaigns && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
