"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  Smartphone,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Search,
  FileSpreadsheet,
  Wifi,
  Phone,
  MessageSquare,
  Gift,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

// Types pour les stats
interface DownloadRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  prizeWon: string;
  prizeValue: string;
  validationCode: string;
  hostessName: string;
  location: string;
  createdAt: string;
  claimed: boolean;
}

interface DailyStats {
  date: string;
  downloads: number;
  prizesGiven: number;
  topPrize: string;
}

interface PrizeStats {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// Mock data
const MOCK_DOWNLOADS: DownloadRecord[] = [
  { id: "1", customerName: "Jean Dupont", customerPhone: "074123456", prizeWon: "2 Go Internet", prizeValue: "2000 FCFA", validationCode: "GT-2024-A001", hostessName: "Marie K.", location: "OKOUME PALACE", createdAt: "2025-06-10T14:30:00Z", claimed: true },
  { id: "2", customerName: "Alice Moussavou", customerPhone: "066789012", prizeWon: "T-Shirt GT", prizeValue: "Goodies", validationCode: "GT-2024-A002", hostessName: "Marie K.", location: "OKOUME PALACE", createdAt: "2025-06-10T15:15:00Z", claimed: true },
  { id: "3", customerName: "Paul Nkoghe", customerPhone: "077234567", prizeWon: "500 Mo Bonus", prizeValue: "500 FCFA", validationCode: "GT-2024-A003", hostessName: "Sophie L.", location: "SOCAPRO", createdAt: "2025-06-10T16:00:00Z", claimed: true },
  { id: "4", customerName: "Marie Okemba", customerPhone: "074345678", prizeWon: "Crédit 2000 FCFA", prizeValue: "2000 FCFA", validationCode: "GT-2024-A004", hostessName: "Marie K.", location: "OKOUME PALACE", createdAt: "2025-06-10T16:45:00Z", claimed: false },
  { id: "5", customerName: "Pierre Mabikou", customerPhone: "066456789", prizeWon: "SMS Illimités 1j", prizeValue: "500 FCFA", validationCode: "GT-2024-A005", hostessName: "Sophie L.", location: "SOCAPRO", createdAt: "2025-06-10T17:30:00Z", claimed: true },
  { id: "6", customerName: "Claire Mbadinga", customerPhone: "077567890", prizeWon: "Casquette GT", prizeValue: "Goodies", validationCode: "GT-2024-A006", hostessName: "Marie K.", location: "OKOUME PALACE", createdAt: "2025-06-11T09:00:00Z", claimed: true },
  { id: "7", customerName: "François Ndong", customerPhone: "074678901", prizeWon: "5 Go Internet", prizeValue: "5000 FCFA", validationCode: "GT-2024-A007", hostessName: "Sophie L.", location: "SOCAPRO", createdAt: "2025-06-11T10:30:00Z", claimed: true },
  { id: "8", customerName: "Sylvie Ondo", customerPhone: "066789012", prizeWon: "Crédit 5000 FCFA", prizeValue: "5000 FCFA", validationCode: "GT-2024-A008", hostessName: "Marie K.", location: "OKOUME PALACE", createdAt: "2025-06-11T11:15:00Z", claimed: true },
];

const PRIZE_COLORS: Record<string, string> = {
  "5 Go Internet": "#0066CC",
  "2 Go Internet": "#0099FF",
  "Crédit 5000 FCFA": "#00CC66",
  "Crédit 2000 FCFA": "#66FF99",
  "SMS Illimités 1j": "#FFCC00",
  "T-Shirt GT": "#FF6600",
  "Casquette GT": "#CC3300",
  "500 Mo Bonus": "#9966FF",
};

const PRIZE_ICONS: Record<string, typeof Wifi> = {
  "5 Go Internet": Wifi,
  "2 Go Internet": Wifi,
  "Crédit 5000 FCFA": Phone,
  "Crédit 2000 FCFA": Phone,
  "SMS Illimités 1j": MessageSquare,
  "T-Shirt GT": Gift,
  "Casquette GT": Gift,
  "500 Mo Bonus": Wifi,
};

export default function GabonTelecomStatsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [downloads, setDownloads] = useState<DownloadRecord[]>(MOCK_DOWNLOADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [prizeFilter, setPrizeFilter] = useState("all");

  // Calculer les statistiques
  const totalDownloads = downloads.length;
  const totalPrizesValue = downloads.reduce((sum, d) => {
    const value = d.prizeValue === "Goodies" ? 0 : parseInt(d.prizeValue.replace(/\D/g, ""));
    return sum + value;
  }, 0);
  const claimedPrizes = downloads.filter(d => d.claimed).length;
  const pendingPrizes = downloads.filter(d => !d.claimed).length;

  // Stats par lot
  const prizeStats: PrizeStats[] = Object.entries(
    downloads.reduce((acc, d) => {
      acc[d.prizeWon] = (acc[d.prizeWon] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalDownloads) * 100),
    color: PRIZE_COLORS[name] || "#666",
  })).sort((a, b) => b.count - a.count);

  // Stats par jour
  const dailyStats: DailyStats[] = Object.entries(
    downloads.reduce((acc, d) => {
      const date = new Date(d.createdAt).toLocaleDateString("fr-FR");
      if (!acc[date]) {
        acc[date] = { date, downloads: 0, prizesGiven: 0, topPrize: "" };
      }
      acc[date].downloads++;
      acc[date].prizesGiven++;
      return acc;
    }, {} as Record<string, DailyStats>)
  ).map(([_, stats]) => stats);

  // Filtrer les downloads
  const filteredDownloads = downloads.filter(d => {
    const matchesSearch = 
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerPhone.includes(searchTerm) ||
      d.validationCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || d.location === locationFilter;
    const matchesPrize = prizeFilter === "all" || d.prizeWon === prizeFilter;
    
    if (dateFilter === "today") {
      const today = new Date().toDateString();
      const matchesDate = new Date(d.createdAt).toDateString() === today;
      return matchesSearch && matchesLocation && matchesPrize && matchesDate;
    }
    
    return matchesSearch && matchesLocation && matchesPrize;
  });

  // Export Excel
  const handleExport = () => {
    const csvContent = [
      ["Date", "Nom", "Téléphone", "Email", "Lot gagné", "Valeur", "Code", "Hôtesse", "Lieu", "Récupéré"],
      ...filteredDownloads.map(d => [
        new Date(d.createdAt).toLocaleString("fr-FR"),
        d.customerName,
        d.customerPhone,
        d.customerEmail || "",
        d.prizeWon,
        d.prizeValue,
        d.validationCode,
        d.hostessName,
        d.location,
        d.claimed ? "Oui" : "Non"
      ])
    ].map(row => row.join(";")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stats-gabon-telecom-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast.success("Export Excel généré !");
  };

  const uniqueLocations = [...new Set(downloads.map(d => d.location))];
  const uniquePrizes = [...new Set(downloads.map(d => d.prizeWon))];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/campaigns/${campaignId}/gabon-telecom-wheel`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Statistiques Campagne GT
              </h1>
              <p className="text-gray-500">
                Suivi des téléchargements et gains
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exporter Excel
            </Button>
            <Link href={`/dashboard/campaigns/${campaignId}/gabon-telecom-wheel`}>
              <Button className="gap-2 bg-gradient-to-r from-[#0066CC] to-[#FF6600]">
                <Smartphone className="w-4 h-4" />
                Roue
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#0066CC] to-[#0099FF] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Téléchargements</p>
                  <p className="text-3xl font-bold">{totalDownloads}</p>
                </div>
                <Download className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#00CC66] to-[#66FF99] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Valeur lots</p>
                  <p className="text-3xl font-bold">{totalPrizesValue.toLocaleString()} F</p>
                </div>
                <Trophy className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#FF6600] to-[#CC3300] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Lots récupérés</p>
                  <p className="text-3xl font-bold">{claimedPrizes}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">En attente</p>
                  <p className="text-3xl font-bold">{pendingPrizes}</p>
                </div>
                <Calendar className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Répartition des lots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FF6600]" />
                Répartition des lots gagnés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prizeStats.map((prize) => {
                  const Icon = PRIZE_ICONS[prize.name] || Gift;
                  return (
                    <div key={prize.name} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: prize.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{prize.name}</span>
                          <span className="text-sm text-gray-500">{prize.count} ({prize.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${prize.percentage}%`,
                              backgroundColor: prize.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats journalières */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0066CC]" />
                Téléchargements par jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-gray-500">{day.downloads} téléchargements</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0066CC]">{day.downloads}</p>
                      <p className="text-xs text-gray-500">tirages</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et Tableau */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0066CC]" />
              Liste des participants ({filteredDownloads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtres */}
            <div className="grid md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Lieu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lieux</SelectItem>
                  {uniqueLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={prizeFilter} onValueChange={setPrizeFilter}>
                <SelectTrigger>
                  <Trophy className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lots</SelectItem>
                  {uniquePrizes.map(prize => (
                    <SelectItem key={prize} value={prize}>{prize}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tableau */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Lot gagné</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Hôtesse</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDownloads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Aucun résultat trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDownloads.map((download) => {
                      const Icon = PRIZE_ICONS[download.prizeWon] || Gift;
                      return (
                        <TableRow key={download.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(download.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{download.customerName}</p>
                              <p className="text-sm text-gray-500">{download.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: PRIZE_COLORS[download.prizeWon] || "#666" }}
                              >
                                <Icon className="w-3 h-3" />
                              </div>
                              <span>{download.prizeWon}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {download.validationCode}
                          </TableCell>
                          <TableCell>{download.hostessName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{download.location}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={download.claimed ? "default" : "secondary"}
                              className={download.claimed ? "bg-green-500" : ""}
                            >
                              {download.claimed ? "Récupéré" : "En attente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
