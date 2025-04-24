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
import {
  AlertCircle,
  Package,
  ShoppingCart,
  Building2,
  Trash2,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );

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
    // Find the actual supplier for this ingredient
    const supplier = userSuppliers.find((s) => ingredient.supplierId === s._id);
    const orderItem: OrderItem = {
      ingredientId: ingredient._id,
      ingredient: ingredient,
      quantity: Math.max(ingredient.threshold - ingredient.stock, 0),
      unit: ingredient.unit,
      supplier: supplier,
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
      quantity: Math.max(item.ingredient.threshold - item.ingredient.stock, 0),
    }));
    setCartItems(updatedItems);
  };

  // Validate order
  const validateOrder = (): boolean => {
    const errors: { [key: string]: string } = {};

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit order
  const submitOrder = async () => {
    // Validate order
    if (!validateOrder()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      // Create a unique order ID
      const orderId = Math.random().toString(36).substring(2, 15);

      // Update ingredient stock levels first
      const stockUpdatePromises = cartItems.map(async (item) => {
        const updatedStock = item.ingredient.stock + item.quantity;
        try {
          await ingredientsApi.update(item.ingredientId, {
            ...item.ingredient,
            stock: updatedStock,
          });
          return { success: true, ingredientId: item.ingredientId };
        } catch (error) {
          console.error(
            `Failed to update stock for ${item.ingredient.name}:`,
            error
          );
          return { success: false, ingredientId: item.ingredientId, error };
        }
      });

      const stockUpdateResults = await Promise.all(stockUpdatePromises);
      const failedUpdates = stockUpdateResults.filter(
        (result) => !result.success
      );

      if (failedUpdates.length > 0) {
        toast.error(
          `Failed to update stock for ${failedUpdates.length} ingredients.`
        );
      }

      // Create order record
      const newOrder: Order = {
        id: orderId,
        supplierId: "multiple", // Using "multiple" since we may have items from different suppliers
        supplier: undefined, // Can be left undefined since we're tracking suppliers at the item level
        items: cartItems.map((item) => ({
          ingredientId: item.ingredientId,
          ingredient: item.ingredient,
          quantity: item.quantity,
          unit: item.unit,
          supplier: item.supplier,
        })),
        status: "pending",
        orderDate: new Date().toISOString(),
      };

      // Here you would typically send to backend
      // For now we'll just show a success message
      toast.success("Order submitted successfully");

      // Clear the cart
      setCartItems([]);

      // Refresh ingredients to show updated stock
      const refreshedIngredients = await ingredientsApi.getAll();
      setUserIngredients(refreshedIngredients);
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast.error("Failed to submit order");
    }
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
    const supplier = userSuppliers.find((s) => s._id === supplierId);
    if (!supplier) return;

    try {
      await suppliersApi.update(supplierId, {
        preferred: !supplier.preferred,
      });

      // Update local state
      setUserSuppliers(
        userSuppliers.map((s) =>
          s._id === supplierId ? { ...s, preferred: !s.preferred } : s
        )
      );
      toast.success(
        `${supplier.name} is ${
          !supplier.preferred ? "now" : "no longer"
        } a preferred supplier`
      );
    } catch (error) {
      console.error("Failed to update supplier:", error);
      toast.error("Failed to update supplier preference");
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await suppliersApi.delete(supplierToDelete._id);

      // Update local state
      setUserSuppliers(
        userSuppliers.filter((s) => s._id !== supplierToDelete._id)
      );

      toast.success(`${supplierToDelete.name} has been deleted`);
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      toast.error("Failed to delete supplier");
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
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
                      setNewSupplier({
                        ...newSupplier,
                        supplierLink: e.target.value,
                      })
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
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteClick(supplier)}
                          title="Delete supplier"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {supplierToDelete?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
