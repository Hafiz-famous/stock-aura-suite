import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Shield, BarChart3, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StockPro</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Connexion
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Gestion de Stock Professionnelle
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Optimisez votre gestion de stock avec une solution complète : traçabilité, rapports visuels et automatisation des calculs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Commencer Gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Se Connecter
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestion Produits</h3>
              <p className="text-muted-foreground text-sm">
                Gérez facilement votre catalogue avec suivi des stocks en temps réel
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Entrées & Sorties</h3>
              <p className="text-muted-foreground text-sm">
                Enregistrez et suivez tous les mouvements de stock avec traçabilité complète
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sécurisation</h3>
              <p className="text-muted-foreground text-sm">
                Système d'authentification sécurisé et contrôle des accès
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rapports Visuels</h3>
              <p className="text-muted-foreground text-sm">
                Graphiques et tableaux de bord pour analyser vos données
              </p>
            </div>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à optimiser votre gestion de stock ?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez StockPro dès aujourd'hui et bénéficiez d'une solution complète de gestion de stock.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Créer mon compte
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2025 StockPro. Gestion de stock professionnelle.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
