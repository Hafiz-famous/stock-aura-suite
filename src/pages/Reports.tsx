import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ReportData {
  stockByCategory: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; stock: number; value: number }>;
  monthlyMovements: Array<{ month: string; entries: number; exits: number }>;
}

const COLORS = ['hsl(220 85% 52%)', 'hsl(142 76% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(280 65% 60%)'];

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    stockByCategory: [],
    topProducts: [],
    monthlyMovements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const { data: products } = await supabase
        .from("products")
        .select("*");

      // Stock by category
      const categoryMap = new Map<string, number>();
      products?.forEach(p => {
        const cat = p.category || "Non catégorisé";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + p.current_stock);
      });
      const stockByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

      // Top products by value
      const topProducts = products
        ?.map(p => ({
          name: p.name,
          stock: p.current_stock,
          value: p.current_stock * p.unit_price,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) || [];

      // Monthly movements (last 6 months)
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString(),
        };
      });

      const monthlyMovements = await Promise.all(
        monthlyData.map(async ({ month, startDate, endDate }) => {
          const { data: movements } = await supabase
            .from("stock_movements")
            .select("*")
            .gte("created_at", startDate)
            .lte("created_at", endDate);

          return {
            month,
            entries: movements?.filter(m => m.movement_type === "entry").reduce((sum, m) => sum + m.quantity, 0) || 0,
            exits: movements?.filter(m => m.movement_type === "exit").reduce((sum, m) => sum + m.quantity, 0) || 0,
          };
        })
      );

      setReportData({
        stockByCategory,
        topProducts,
        monthlyMovements,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Rapport de Stock - " + new Date().toLocaleDateString('fr-FR')],
      [],
      ["Top 10 Produits par Valeur"],
      ["Produit", "Stock", "Valeur (FCFA)"],
      ...reportData.topProducts.map(p => [p.name, p.stock, p.value]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-stock-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Rapport exporté avec succès");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rapports & Analyses</h1>
          <p className="text-muted-foreground">Visualisez vos données de stock</p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Répartition du Stock par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.stockByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.stockByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Mouvements Mensuels (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.monthlyMovements}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="entries" name="Entrées" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="exits" name="Sorties" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Top 10 Produits par Valeur en Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">Stock: {product.stock} unités</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(product.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
