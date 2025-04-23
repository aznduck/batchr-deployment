import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Package,
  ClipboardList,
  ShoppingCart,
  UtensilsCrossed,
  LogOut,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ingredientsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/", icon: BarChart3 },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Recipes", path: "/recipes", icon: UtensilsCrossed },
  { name: "Production", path: "/production", icon: ClipboardList },
  { name: "Ordering", path: "/ordering", icon: ShoppingCart },
  { name: "Planning", path: "/production-planning", icon: Calendar },
];

export const SideNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth();
  const [lowStockIngredients, setLowStockIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLowStockIngredients = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const ingredients = await ingredientsApi.getAll();
        // Filter ingredients that are below their threshold
        const lowStock = (ingredients as any[]).filter(
          (ingredient) => ingredient.stock < ingredient.threshold
        );
        setLowStockIngredients(lowStock);
      } catch (error) {
        console.error("Error fetching low stock ingredients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockIngredients();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-[calc(100vh-56px)] fixed left-0 top-14 z-40 flex flex-col bg-card border-r border-border/40 w-[240px]">
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Low Stock Items Section */}
        {isAuthenticated && (
          <div className="mt-8 px-2">
            <Separator className="mb-4" />
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle size={16} className="text-orange-500" />
                  <span>Low Stock Items</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isLoading ? "-" : lowStockIngredients.length}
                </Badge>
              </div>
            </div>

            <div className="px-1 mt-2 overflow-hidden">
              {isLoading ? (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : lowStockIngredients.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No ingredients below threshold
                </div>
              ) : (
                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                  {lowStockIngredients.map((ingredient) => (
                    <Link
                      key={ingredient._id}
                      to="/inventory"
                      className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="font-medium truncate max-w-[120px]">
                        {ingredient.name}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {ingredient.stock}/{ingredient.threshold}{" "}
                        {ingredient.unit}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-2 px-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  asChild
                >
                  <Link to="/inventory">View All</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-border/40 p-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User size={16} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{username}</span>
                <span className="text-xs text-muted-foreground">Logged in</span>
              </div>
            </div>

            <Button size="sm" onClick={handleLogout} className="gap-2 ml-auto">
              <LogOut size={14} />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="w-full">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideNav;
