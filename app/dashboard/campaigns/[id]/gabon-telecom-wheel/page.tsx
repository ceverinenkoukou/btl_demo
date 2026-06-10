"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Gift, 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  Smartphone, 
  QrCode, 
  CheckCircle2,
  Wifi,
  Phone,
  MessageSquare,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Lots spécifiques Gabon Telecom
const GT_PRIZES = [
  { id: "1", name: "5 Go Internet", probability: 5, icon: Wifi, color: "#0066CC", value: "5000 FCFA" },
  { id: "2", name: "2 Go Internet", probability: 10, icon: Wifi, color: "#0099FF", value: "2000 FCFA" },
  { id: "3", name: "Crédit 5000 FCFA", probability: 8, icon: Phone, color: "#00CC66", value: "5000 FCFA" },
  { id: "4", name: "Crédit 2000 FCFA", probability: 15, icon: Phone, color: "#66FF99", value: "2000 FCFA" },
  { id: "5", name: "SMS Illimités 1j", probability: 20, icon: MessageSquare, color: "#FFCC00", value: "500 FCFA" },
  { id: "6", name: "T-Shirt GT", probability: 12, icon: Gift, color: "#FF6600", value: "Goodies" },
  { id: "7", name: "Casquette GT", probability: 15, icon: Gift, color: "#CC3300", value: "Goodies" },
  { id: "8", name: "500 Mo Bonus", probability: 15, icon: Wifi, color: "#9966FF", value: "500 FCFA" },
];

export default function GabonTelecomWheelPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  // Étapes du flux
  const [step, setStep] = useState<"validate" | "wheel" | "result">("validate");
  const [validationCode, setValidationCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  
  // États de la roue
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<typeof GT_PRIZES[0] | null>(null);
  const [showWinDialog, setShowWinDialog] = useState(false);
  
  // Informations client
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dessiner la roue
  useEffect(() => {
    drawWheel();
  }, [rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const anglePerSlice = (2 * Math.PI) / GT_PRIZES.length;
    const rotationRad = (rotation * Math.PI) / 180;

    GT_PRIZES.forEach((prize, index) => {
      const startAngle = index * anglePerSlice + rotationRad;
      const endAngle = (index + 1) * anglePerSlice + rotationRad;

      // Dessiner le segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dessiner l'icône/texte
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(prize.name, radius - 15, 5);
      ctx.restore();
    });

    // Cercle central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#0066CC";
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Logo GT dans le centre
    ctx.fillStyle = "#0066CC";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GT", centerX, centerY);

    // Pointeur
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 15, centerY);
    ctx.lineTo(centerX + radius - 10, centerY - 15);
    ctx.lineTo(centerX + radius - 10, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = "#FF6600";
    ctx.fill();
  };

  // Validation du téléchargement
  const handleValidation = () => {
    if (validationCode.length < 4) {
      toast.error("Veuillez entrer un code valide");
      return;
    }
    
    // Simulation validation
    setIsValidated(true);
    toast.success("Téléchargement validé !");
    setStep("wheel");
  };

  // Tourner la roue
  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setWonPrize(null);

    // Sélection pondérée
    const totalProbability = GT_PRIZES.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalProbability;
    let selectedPrize = GT_PRIZES[0];

    for (const prize of GT_PRIZES) {
      random -= prize.probability;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    // Calcul angle gagnant
    const prizeIndex = GT_PRIZES.findIndex((p) => p.id === selectedPrize.id);
    const anglePerSlice = 360 / GT_PRIZES.length;
    const prizeAngle = prizeIndex * anglePerSlice + anglePerSlice / 2;
    
    // Animation
    const totalSpins = 5 + Math.random() * 3;
    const finalAngle = 360 * totalSpins + (360 - prizeAngle);
    
    let currentRotation = rotation;
    const targetRotation = currentRotation + finalAngle;
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const newRotation = currentRotation + (targetRotation - currentRotation) * eased;
      setRotation(newRotation % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWonPrize(selectedPrize);
        setShowWinDialog(true);
        
        // Confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#0066CC", "#FF6600", "#00CC66", "#FFCC00"],
        });
      }
    };

    animate();
  };

  // Sauvegarder le gain
  const handleSaveWin = () => {
    if (!wonPrize) return;
    
    if (!customerName || !customerPhone) {
      toast.error("Veuillez remplir les informations du client");
      return;
    }

    // Simulation sauvegarde
    toast.success(`Gain enregistré : ${wonPrize.name} !`);
    setShowWinDialog(false);
    setStep("result");
  };

  // Réinitialiser pour un nouveau client
  const handleReset = () => {
    setStep("validate");
    setValidationCode("");
    setIsValidated(false);
    setWonPrize(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setRotation(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0066CC] to-[#FF6600] rounded-2xl mb-4">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Gabon Telecom
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Campagne Téléchargement App Mobile
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#0066CC]/10 text-[#0066CC] rounded-full text-sm font-medium">
            <Download className="w-4 h-4" />
            1 Téléchargement = 1 Tirage
          </div>
        </div>

        {/* Étape 1: Validation */}
        {step === "validate" && (
          <Card className="border-2 border-[#0066CC]/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <QrCode className="w-6 h-6 text-[#0066CC]" />
                Valider le téléchargement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Scannez le QR code sur l'écran du client ou entrez le code de validation
                </p>
                <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-xl border-2 border-dashed border-[#0066CC]/30">
                  <QrCode className="w-16 h-16 text-[#0066CC]/40" />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-center block">Code de validation</Label>
                <Input
                  value={validationCode}
                  onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                  placeholder="Ex: GT-2024-XXXX"
                  className="text-center text-lg tracking-wider uppercase"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 text-center">
                  Le code est affiché sur l'écran de confirmation du téléchargement
                </p>
              </div>
              
              <Button 
                size="lg" 
                className="w-full h-14 bg-gradient-to-r from-[#0066CC] to-[#FF6600] hover:opacity-90"
                onClick={handleValidation}
                disabled={validationCode.length < 4}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Valider et continuer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: La Roue */}
        {step === "wheel" && (
          <>
            <Card className="border-2 border-[#0066CC]/20">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Sparkles className="w-6 h-6 text-[#FF6600]" />
                  Tournez la roue et gagnez !
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-6">
                <div className="relative mb-8">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={380}
                    className="max-w-full"
                  />
                </div>

                <Button
                  size="lg"
                  className="h-16 px-16 text-lg bg-gradient-to-r from-[#0066CC] to-[#FF6600] hover:opacity-90"
                  onClick={spinWheel}
                  disabled={spinning}
                >
                  {spinning ? (
                    <>
                      <RotateCcw className="w-6 h-6 mr-2 animate-spin" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Lancer la roue
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Légende des lots */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lots à gagner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GT_PRIZES.map((prize) => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: prize.color }}
                      >
                        <prize.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{prize.name}</p>
                        <p className="text-xs text-gray-500">{prize.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Étape 3: Résultat */}
        {step === "result" && wonPrize && (
          <Card className="border-2 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gain enregistré avec succès !
              </h2>
              <p className="text-gray-600 mb-6">
                Le client a gagné : <strong>{wonPrize.name}</strong>
              </p>
              
              <div className="bg-gradient-to-r from-[#0066CC] to-[#FF6600] rounded-xl p-6 text-white mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <wonPrize.icon className="w-8 h-8" />
                  <span className="text-2xl font-bold">{wonPrize.name}</span>
                </div>
                <p className="text-white/80">Valeur: {prize.value}</p>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14"
                onClick={handleReset}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Nouveau client
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogue de gain */}
        <Dialog open={showWinDialog} onOpenChange={setShowWinDialog}>
          <DialogContent className="text-center max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-[#FF6600]" />
                Félicitations !
              </DialogTitle>
              <DialogDescription className="text-lg">
                Le client a gagné :
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className={cn(
                "mx-auto w-28 h-28 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-[#0066CC] to-[#FF6600]"
              )}>
                {wonPrize && <wonPrize.icon className="w-14 h-14 text-white" />}
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{wonPrize?.name}</p>
                <p className="text-gray-500">{wonPrize?.value}</p>
              </div>

              <div className="space-y-3 text-left bg-gray-50 p-4 rounded-xl">
                <div className="space-y-2">
                  <Label>Nom du client *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nom complet"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="06 XX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (optionnel)</Label>
                  <Input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setShowWinDialog(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 h-12 bg-gradient-to-r from-[#0066CC] to-[#FF6600]"
                  onClick={handleSaveWin}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
