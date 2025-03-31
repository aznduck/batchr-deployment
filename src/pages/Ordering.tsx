import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Supplier, suppliers as initialSuppliers } from "@/lib/data";
import {
  ArrowRight,
  Check,
  CreditCard,
  DollarSign,
  InfoIcon,
  Loader2,
  Package,
  ShoppingCart,
  Star,
  StarOff,
  Truck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Ingredient {
  _id: string;
  name: string;
  stock: number;
  unit: string;
  threshold: number;
}

interface CartItem {
  ingredientId: string;
  quantity: number;
  price: number;
  supplierId: string;
}

const Ordering = () => {
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ingredients`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        setIngredients(data);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
        toast.error("Failed to load ingredients");
      }
    };

    fetchIngredients();
  }, []);

  // Get ingredients that need restocking
  const lowStockIngredients = ingredients
    .filter((ingredient) => ingredient.stock < ingredient.threshold)
    .sort((a, b) => a.stock / a.threshold - b.stock / b.threshold);

  const generateRandomPrice = (min: number, max: number): number => {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  };

  const supplierPrices: Record<string, Record<string, number>> = {};

  // Generate random prices for each supplier for each low stock ingredient
  lowStockIngredients.forEach((ingredient) => {
    suppliers.forEach((supplier) => {
      if (!supplierPrices[ingredient._id]) {
        supplierPrices[ingredient._id] = {};
      }

      // Base price with some variation per supplier
      const basePrice =
        ingredient.unit === "kg" || ingredient.unit === "L"
          ? generateRandomPrice(15, 40)
          : generateRandomPrice(3, 12);

      // Preferred suppliers offer better prices
      const price = supplier.preferred ? basePrice * 0.9 : basePrice;

      supplierPrices[ingredient._id][supplier.id] = price;
    });
  });

  const getBestSupplier = (ingredientId: string): Supplier | undefined => {
    if (!supplierPrices[ingredientId]) return undefined;

    const bestSupplierId = Object.entries(supplierPrices[ingredientId]).reduce(
      (best, [supplierId, price]) => {
        if (!best.supplierId || price < best.price) {
          return { supplierId, price };
        }
        return best;
      },
      { supplierId: "", price: Infinity }
    ).supplierId;

    return suppliers.find((supplier) => supplier.id === bestSupplierId);
  };

  const addToCart = (ingredient: Ingredient) => {
    const bestSupplier = getBestSupplier(ingredient._id);
    if (!bestSupplier) return;

    const price = supplierPrices[ingredient._id][bestSupplier.id];
    const suggestedQuantity = Math.ceil(
      ingredient.threshold - ingredient.stock
    );

    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.ingredientId === ingredient._id
      );
      if (existingItem) {
        return prev.map((item) =>
          item.ingredientId === ingredient._id
            ? { ...item, quantity: item.quantity + suggestedQuantity }
            : item
        );
      }
      return [
        ...prev,
        {
          ingredientId: ingredient._id,
          quantity: suggestedQuantity,
          price,
          supplierId: bestSupplier.id,
        },
      ];
    });

    toast.success(`Added ${ingredient.name} to cart`);
  };

  const removeFromCart = (ingredientId: string) => {
    setCart((prev) =>
      prev.filter((item) => item.ingredientId !== ingredientId)
    );
  };

  const updateQuantity = (ingredientId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId ? { ...item, quantity } : item
      )
    );
  };

  const placeOrder = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Order placed successfully!");
    setCart([]);
    setLoading(false);
  };

  const getIngredientById = (id: string) => {
    return ingredients.find((ing) => ing._id === id);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Ordering</h1>
          <p className="text-muted-foreground">
            Manage your ingredient orders and suppliers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  Low Stock Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockIngredients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      All ingredients are well-stocked
                    </p>
                  ) : (
                    lowStockIngredients.map((ingredient) => {
                      const bestSupplier = getBestSupplier(ingredient._id);
                      const inCart = cart.some(
                        (item) => item.ingredientId === ingredient._id
                      );

                      return (
                        <div
                          key={ingredient._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{ingredient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Stock: {ingredient.stock} {ingredient.unit} /{" "}
                              Threshold: {ingredient.threshold}{" "}
                              {ingredient.unit}
                            </div>
                            {bestSupplier && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  Best price:
                                </span>
                                <span className="font-medium">
                                  $
                                  {supplierPrices[ingredient._id][
                                    bestSupplier.id
                                  ].toFixed(2)}
                                  /{ingredient.unit}
                                </span>
                                <span className="text-muted-foreground">
                                  from
                                </span>
                                <span className="font-medium flex items-center gap-1">
                                  {bestSupplier.name}
                                  {bestSupplier.preferred && (
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant={inCart ? "secondary" : "default"}
                            onClick={() =>
                              inCart
                                ? removeFromCart(ingredient._id)
                                : addToCart(ingredient)
                            }
                          >
                            {inCart ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                In Cart
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Your cart is empty
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const ingredient = getIngredientById(item.ingredientId);
                      if (!ingredient) return null;

                      return (
                        <div
                          key={item.ingredientId}
                          className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="font-medium">{ingredient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)}/{ingredient.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.ingredientId,
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              {ingredient.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              {cart.length > 0 && (
                <>
                  <Separator />
                  <CardFooter className="flex flex-col gap-4 pt-4">
                    <div className="flex items-center justify-between w-full text-lg font-medium">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={placeOrder}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Ordering;
