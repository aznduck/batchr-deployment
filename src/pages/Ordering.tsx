import React, { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, ShoppingCart, Building2 } from "lucide-react";
import {
  getIngredientById,
  getStockStatus,
  Ingredient,
  Supplier,
  suppliers,
  OrderItem,
  Order,
} from "@/lib/data";
import { ingredientsApi, suppliersApi } from "@/lib/api";
import { toast } from "sonner";

interface CartItem extends OrderItem {
  ingredient: Ingredient;
  supplier?: Supplier;
}

export default function Ordering() {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Ingredient[]>([]);
  const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
  const [userSuppliers, setUserSuppliers] = useState<Supplier[]>([]);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    supplierLink: "",
    preferred: false,
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  useEffect(() => {
    // Fetch user's ingredients from the backend
    const fetchIngredients = async () => {
      try {
        const data = await ingredientsApi.getAll();
        setUserIngredients(data);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    // Fetch user's suppliers from the backend
    const fetchSuppliers = async () => {
      try {
        const data = await suppliersApi.getAll();
        setUserSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    // Get low stock items from user's ingredients
    const lowStock = userIngredients.filter((item) => {
      const status = getStockStatus(item);
      return status === "warning" || status === "critical";
    });
    setLowStockItems(lowStock);
  }, [userIngredients]);

  // Group cart items by supplier
  const itemsBySupplier = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const supplierId = item.supplier?._id || "unassigned";
      if (!acc[supplierId]) {
        acc[supplierId] = [];
      }
      acc[supplierId].push(item);
      return acc;
    }, {} as { [key: string]: OrderItem[] });
  }, [cartItems]);

  // Add item to cart
  const addToCart = (ingredient: Ingredient) => {
    // Find the preferred supplier for this ingredient
    const supplier = suppliers.find((s) => s.preferred);
    const orderItem: OrderItem = {
      ingredientId: ingredient._id,
      ingredient: ingredient,
      quantity: Math.max(ingredient.threshold - ingredient.stock, 0),
      unit: ingredient.unit,
      supplier: supplier,
      minimumOrderQuantity: ingredient.minimumOrderQuantity,
    };
    setCartItems([...cartItems, orderItem]);
  };

  // Update item quantity
  const updateQuantity = (ingredientId: string, quantity: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.ingredientId === ingredientId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (ingredientId: string) => {
    setCartItems(
      cartItems.filter((item) => item.ingredientId !== ingredientId)
    );
  };

  // Bring all quantities to PAR
  const bringAllToPar = () => {
    const updatedItems = cartItems.map((item) => ({
      ...item,
      quantity: Math.max(
        item.ingredient.threshold - item.ingredient.stock,
        item.minimumOrderQuantity || 0
      ),
    }));
    setCartItems(updatedItems);
  };

  // Validate order
  const validateOrder = (): boolean => {
    const errors: { [key: string]: string } = {};
    const supplierTotals: {
      [key: string]: { quantity: number; value: number };
    } = {};

    // Calculate totals by supplier
    cartItems.forEach((item) => {
      if (item.supplier) {
        const supplierId = item.supplier._id;
        if (!supplierTotals[supplierId]) {
          supplierTotals[supplierId] = { quantity: 0, value: 0 };
        }
        supplierTotals[supplierId].quantity += item.quantity;
        // TODO: Add price calculation when available
        // supplierTotals[supplierId].value += item.quantity * item.price;
      }

      // Check individual item minimum order quantity
      if (
        item.minimumOrderQuantity &&
        item.quantity < item.minimumOrderQuantity
      ) {
        errors[
          item.ingredientId
        ] = `Minimum order quantity is ${item.minimumOrderQuantity} ${item.unit}`;
      }
    });

    // Check supplier minimum requirements
    Object.entries(supplierTotals).forEach(([supplierId, totals]) => {
      const supplier = suppliers.find((s) => s._id === supplierId);
      if (supplier?.minimumOrderRequirements) {
        const { quantity, value, unit } = supplier.minimumOrderRequirements;

        if (quantity && totals.quantity < quantity) {
          errors[`supplier_${supplierId}`] = `Minimum order quantity for ${
            supplier.name
          } is ${quantity} ${unit || "units"}`;
        }

        if (value && totals.value < value) {
          errors[
            `supplier_${supplierId}`
          ] = `Minimum order value for ${supplier.name} is $${value}`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit order
  const submitOrder = () => {
    if (!validateOrder()) {
      return;
    }

    // Group items by supplier
    const ordersBySupplier = Object.entries(itemsBySupplier).map(
      ([supplierId, items]) => {
        const supplier = items[0]?.supplier;
        const order: Order = {
          id: Math.random().toString(36).substr(2, 9),
          supplierId: supplier?._id || "unassigned",
          supplier: supplier,
          items: items.map((item) => ({
            ingredientId: item.ingredientId,
            ingredient: item.ingredient,
            quantity: item.quantity,
            unit: item.unit,
            supplier: item.supplier,
            minimumOrderQuantity: item.minimumOrderQuantity,
          })),
          status: "pending",
          orderDate: new Date().toISOString(),
        };
        return order;
      }
    );

    // TODO: Submit orders to backend
    console.log("Submitting orders:", ordersBySupplier);
    setCartItems([]);
    setValidationErrors({});
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: { [key: string]: string } = {};
    if (!newSupplier.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    try {
      const newSupplierData = await suppliersApi.create(newSupplier);
      setUserSuppliers([...userSuppliers, newSupplierData]);
      toast.success("Supplier added successfully!");
      
      // Reset form and close dialog
      setNewSupplier({
        name: "",
        supplierLink: "",
        preferred: false,
      });
      setValidationErrors({});
      setShowAddSupplier(false);
    } catch (error) {
      console.error("Failed to add supplier:", error);
      toast.error("Failed to add supplier");
    }
  };

  const togglePreferredSupplier = async (supplierId: string) => {
    try {
      const supplier = userSuppliers.find((s) => s._id === supplierId);
      if (!supplier) return;
      
      const updatedSupplier = await suppliersApi.update(supplierId, {
        preferred: !supplier.preferred,
      });

      // Update the suppliers list with the updated supplier
      setUserSuppliers(
        userSuppliers.map((s) => (s._id === supplierId ? updatedSupplier : s))
      );

      toast.success(
        `${updatedSupplier.name} is ${
          updatedSupplier.preferred ? "now" : "no longer"
        } a preferred supplier`
      );
    } catch (error) {
      console.error("Failed to update supplier:", error);
      toast.error("Failed to update supplier preference");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Ordering</h1>
            <p className="text-muted-foreground">
              Manage your ingredient orders and track low stock items
            </p>
          </div>
          {cartItems.length > 0 && (
            <Button onClick={bringAllToPar}>Bring All to PAR</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Low Stock Items
              </CardTitle>
              <CardDescription>
                Items that need to be ordered soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    All ingredients are well-stocked
                  </p>
                ) : (
                  lowStockItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Stock: {item.stock} {item.unit} / PAR:{" "}
                          {item.threshold} {item.unit}
                        </div>
                      </div>
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={cartItems.some(
                          (i) => i.ingredientId === item._id
                        )}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Shopping Cart
              </CardTitle>
              <CardDescription>
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} to
                order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Your cart is empty
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(itemsBySupplier).map(
                    ([supplierId, items]) => (
                      <div key={supplierId} className="space-y-4">
                        <h3 className="font-semibold">
                          {items[0]?.supplier?.name || "Unassigned Supplier"}
                        </h3>
                        {items[0]?.supplier?.minimumOrderRequirements && (
                          <div className="text-sm text-muted-foreground">
                            Minimum Order:{" "}
                            {
                              items[0].supplier.minimumOrderRequirements
                                .quantity
                            }{" "}
                            {items[0].supplier.minimumOrderRequirements.unit}
                            {items[0].supplier.minimumOrderRequirements.value &&
                              ` or $${items[0].supplier.minimumOrderRequirements.value}`}
                          </div>
                        )}
                        {validationErrors[`supplier_${supplierId}`] && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {validationErrors[`supplier_${supplierId}`]}
                            </AlertDescription>
                          </Alert>
                        )}
                        {items.map((item) => (
                          <div
                            key={item.ingredientId}
                            className="grid grid-cols-6 gap-4 items-center p-4 border rounded-lg"
                          >
                            <div className="col-span-2">
                              <Label>{item.ingredient.name}</Label>
                              <div className="text-sm text-muted-foreground">
                                Current: {item.ingredient.stock} {item.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                PAR: {item.ingredient.threshold} {item.unit}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <Label>Order Quantity ({item.unit})</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.ingredientId,
                                    Number(e.target.value)
                                  )
                                }
                                min={0}
                              />
                              {item.minimumOrderQuantity && (
                                <div className="text-sm text-muted-foreground">
                                  Min: {item.minimumOrderQuantity} {item.unit}
                                </div>
                              )}
                            </div>
                            <div className="col-span-1">
                              {validationErrors[item.ingredientId] && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    {validationErrors[item.ingredientId]}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                            <div className="col-span-1 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeFromCart(item.ingredientId)
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  <div className="flex justify-end mt-4">
                    <Button onClick={submitOrder} size="lg">
                      Submit Order
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supplier Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Supplier Management
            </CardTitle>
            <CardDescription>
              Manage your suppliers and their preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Add New Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={newSupplier.name}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, name: e.target.value })
                    }
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <Label>Supplier Link</Label>
                  <Input
                    value={newSupplier.supplierLink}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, supplierLink: e.target.value })
                    }
                    placeholder="Enter supplier website"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddSupplier}>Add Supplier</Button>
                </div>
                {validationErrors.supplier && (
                  <Alert variant="destructive" className="col-span-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationErrors.supplier}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Supplier List */}
              <div className="space-y-4">
                {userSuppliers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No suppliers added yet
                  </p>
                ) : (
                  userSuppliers.map((supplier) => (
                    <div
                      key={supplier._id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.supplierLink && (
                          <a
                            href={supplier.supplierLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Visit Website
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant={supplier.preferred ? "default" : "outline"}
                          onClick={() => togglePreferredSupplier(supplier._id)}
                        >
                          {supplier.preferred
                            ? "Preferred"
                            : "Set as Preferred"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
