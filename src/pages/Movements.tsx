import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Movement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  products: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  current_stock: number;
}

const Movements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "entry",
    quantity: 0,
    unit_price: 0,
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movementsRes, productsRes] = await Promise.all([
        supabase
          .from("stock_movements")
          .select(`
            *,
            products (name, sku, unit)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, sku, unit_price, current_stock")
          .order("name")
      ]);

      if (movementsRes.error) throw movementsRes.error;
      if (productsRes.error) throw productsRes.error;

      setMovements(movementsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      unit_price: product?.unit_price || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const product = products.find(p => p.id === formData.product_id);
    if (formData.movement_type === "exit" && product && formData.quantity > product.current_stock) {
      toast.error("Quantité insuffisante en stock");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("stock_movements")
        .insert([{
          ...formData,
          created_by: user?.id,
        }]);

      if (error) throw error;
      
      toast.success("Mouvement enregistré avec succès");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      movement_type: "entry",
      quantity: 0,
      unit_price: 0,
      reference: "",
      notes: "",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mouvements de Stock</h1>
          <p className="text-muted-foreground">Enregistrez les entrées et sorties de stock</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Mouvement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enregistrer un mouvement de stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produit *</Label>
                  <Select value={formData.product_id} onValueChange={handleProductChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku}) - Stock: {product.current_stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movement_type">Type de mouvement *</Label>
                  <Select value={formData.movement_type} onValueChange={(value) => setFormData({ ...formData, movement_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entrée</SelectItem>
                      <SelectItem value="exit">Sortie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Prix unitaire (FCFA) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Référence (bon de commande, facture, etc.)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Historique des Mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix Unit.</TableHead>
                  <TableHead>Valeur Totale</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.products.name} ({movement.products.sku})
                    </TableCell>
                    <TableCell>
                      {movement.movement_type === "entry" ? (
                        <Badge variant="outline" className="border-success text-success">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{movement.quantity} {movement.products.unit}</TableCell>
                    <TableCell>{formatCurrency(movement.unit_price)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(movement.total_value)}</TableCell>
                    <TableCell>{movement.reference || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Movements;
