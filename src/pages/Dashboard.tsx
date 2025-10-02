import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface Stats {
  totalProducts: number;
  totalValue: number;
  entriesThisMonth: number;
  exitsThisMonth: number;
  lowStockProducts: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalValue: 0,
    entriesThisMonth: 0,
    exitsThisMonth: 0,
    lowStockProducts: 0,
  });
  const [movementData, setMovementData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch products stats
      const { data: products } = await supabase
        .from("products")
        .select("*");

      const totalProducts = products?.length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0) || 0;
      const lowStockProducts = products?.filter(p => p.current_stock <= p.min_stock_level).length || 0;

      // Fetch movements this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: movements } = await supabase
        .from("stock_movements")
        .select("*")
        .gte("created_at", startOfMonth.toISOString());

      const entriesThisMonth = movements?.filter(m => m.movement_type === "entry").reduce((sum, m) => sum + m.quantity, 0) || 0;
      const exitsThisMonth = movements?.filter(m => m.movement_type === "exit").reduce((sum, m) => sum + m.quantity, 0) || 0;

      // Prepare movement data for chart (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartData = last7Days.map(date => {
        const dayMovements = movements?.filter(m => m.created_at.startsWith(date)) || [];
        return {
          date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          entrées: dayMovements.filter(m => m.movement_type === "entry").reduce((sum, m) => sum + m.quantity, 0),
          sorties: dayMovements.filter(m => m.movement_type === "exit").reduce((sum, m) => sum + m.quantity, 0),
        };
      });

      setStats({
        totalProducts,
        totalValue,
        entriesThisMonth,
        exitsThisMonth,
        lowStockProducts,
      });
      setMovementData(chartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre stock</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produits en catalogue
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valeur totale
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées du Mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.entriesThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unités entrées
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties du Mois</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.exitsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unités sorties
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.lowStockProducts > 0 && (
        <Card className="border-warning shadow-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>Alerte Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {stats.lowStockProducts} produit(s) ont atteint ou sont en dessous du seuil minimum de stock.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Mouvements de Stock (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="entrées" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="sorties" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
