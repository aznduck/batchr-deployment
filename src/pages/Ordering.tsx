
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getIngredientById,
  getIngredientsByUrgency,
  Ingredient,
  Supplier,
  suppliers as initialSuppliers,
} from "@/lib/data";
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

  // Get ingredients that need restocking
  const lowStockIngredients = getIngredientsByUrgency()
    .filter((ingredient) => ingredient.stock < ingredient.threshold)
    .slice(0, 5);

  const generateRandomPrice = (min: number, max: number): number => {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  };

  const supplierPrices: Record<string, Record<string, number>> = {};

  // Generate random prices for each supplier for each low stock ingredient
  lowStockIngredients.forEach((ingredient) => {
    suppliers.forEach((supplier) => {
      if (!supplierPrices[ingredient.id]) {
        supplierPrices[ingredient.id] = {};
      }
      
      // Base price with some variation per supplier
      const basePrice = ingredient.unit === 'kg' || ingredient.unit === 'L' 
        ? generateRandomPrice(15, 40)
        : generateRandomPrice(3, 12);
      
      // Preferred suppliers offer better prices
      const price = supplier.preferred
        ? basePrice * 0.9
        : basePrice;
        
      supplierPrices[ingredient.id][supplier.id] = price;
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
    const bestSupplier = getBestSupplier(ingredient.id);
    if (!bestSupplier) return;
    
    const price = supplierPrices[ingredient.id][bestSupplier.id];
    const quantity = ingredient.threshold - ingredient.stock;
    
    // Check if ingredient is already in cart
    const existingIndex = cart.findIndex(
      (item) => item.ingredientId === ingredient.id
    );
    
    if (existingIndex >= 0) {
      // Update quantity if already in cart
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: quantity,
      };
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          ingredientId: ingredient.id,
          quantity: quantity,
          price: price,
          supplierId: bestSupplier.id,
        },
      ]);
    }
    
    toast.success(`Added ${ingredient.name} to cart`);
  };

  const removeFromCart = (ingredientId: string) => {
    setCart(cart.filter((item) => item.ingredientId !== ingredientId));
    toast.info("Item removed from cart");
  };

  const getCartTotal = (): number => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setCart([]);
      toast.success("Order placed successfully!", {
        description: "Your ingredients will be delivered soon.",
      });
    }, 1500);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Ordering</h1>
          <p className="text-muted-foreground">
            Order ingredients from suppliers to restock your inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package size={18} className="text-destructive" />
                  Ingredients to Restock
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockIngredients.length === 0 ? (
                  <div className="text-center py-6">
                    <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      All ingredients are above threshold levels
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockIngredients.map((ingredient) => {
                      const bestSupplier = getBestSupplier(ingredient.id);
                      const price = bestSupplier
                        ? supplierPrices[ingredient.id][bestSupplier.id]
                        : 0;
                      const quantity = ingredient.threshold - ingredient.stock;
                      const inCart = cart.some(
                        (item) => item.ingredientId === ingredient.id
                      );
                      
                      return (
                        <div
                          key={ingredient.id}
                          className={cn(
                            "p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
                            inCart ? "bg-primary/5 border-primary/20" : ""
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{ingredient.name}</h3>
                              <Badge variant="outline" className="text-xs bg-danger/10 text-danger-foreground border-danger/20">
                                Low Stock
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Current: {ingredient.stock} {ingredient.unit} / Threshold: {ingredient.threshold} {ingredient.unit}
                            </div>
                            <div className="text-sm flex items-center gap-1">
                              <span>Best price:</span>
                              <span className="font-medium text-emerald-600">${price.toFixed(2)}</span>
                              <span className="text-muted-foreground">per {ingredient.unit}</span>
                              {bestSupplier && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center ml-1 text-muted-foreground">
                                        <InfoIcon size={14} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>From {bestSupplier.name}</p>
                                      <div className="flex items-center mt-1">
                                        <span className="text-xs text-muted-foreground">Rating: </span>
                                        <span className="text-xs ml-1 text-amber-500 flex items-center">
                                          {bestSupplier.rating} <Star size={10} className="fill-amber-500 ml-0.5" />
                                        </span>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-sm font-medium whitespace-nowrap">
                              Need: {quantity} {ingredient.unit}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(ingredient)}
                              disabled={inCart}
                            >
                              {inCart ? "Added" : "Add to Cart"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  Preferred Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suppliers
                    .filter((supplier) => supplier.preferred)
                    .map((supplier) => (
                      <div
                        key={supplier.id}
                        className="p-4 rounded-lg border flex justify-between items-start"
                      >
                        <div>
                          <h3 className="font-medium flex items-center gap-1">
                            {supplier.name}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Star
                                      size={14}
                                      className="text-amber-500 fill-amber-500 ml-1"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preferred Supplier</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <span>Rating: </span>
                            <span className="text-amber-500 ml-1 flex items-center">
                              {supplier.rating} <Star size={12} className="fill-amber-500 ml-0.5" />
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300/50 hover:border-amber-300 text-amber-600"
                          onClick={() => {
                            toast.info("This would open the supplier details");
                          }}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart size={18} className="text-blue-500" />
                Your Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add items from the ingredients list
                  </p>
                </div>
              ) : (
                <>
                  {cart.map((item) => {
                    const ingredient = getIngredientById(item.ingredientId);
                    const supplier = suppliers.find(
                      (s) => s.id === item.supplierId
                    );
                    if (!ingredient || !supplier) return null;
                    
                    const itemTotal = item.price * item.quantity;
                    
                    return (
                      <div key={item.ingredientId} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{ingredient.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} {ingredient.unit} × ${item.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              From: {supplier.name}
                              {supplier.preferred && (
                                <Star
                                  size={10}
                                  className="text-amber-500 fill-amber-500"
                                />
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${itemTotal.toFixed(2)}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.ingredientId)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    );
                  })}

                  <div className="pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Subtotal</span>
                      <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Shipping</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tax</span>
                      <span className="font-medium">${(getCartTotal() * 0.07).toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${(getCartTotal() * 1.07).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                disabled={cart.length === 0 || loading}
                onClick={placeOrder}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Place Order
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Orders typically ship within 2 business days
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <Truck size={14} className="text-muted-foreground" />
                <DollarSign size={14} className="text-muted-foreground" />
                <ArrowRight size={14} className="text-muted-foreground" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Ordering;
