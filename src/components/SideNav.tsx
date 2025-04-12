import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen fixed left-0 top-0 z-50 flex flex-col bg-card border-r border-border/40 w-[240px]">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="font-sf-pro text-xl font-bold bg-clip-text whitespace-nowrap"
            style={{
              fontFamily:
                "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 700,
            }}
          >
            batchr
          </span>
          <div className="flex items-center justify-center rounded-full bg-primary w-6 h-6 text-white text-xs font-bold flex-shrink-0">
            β
          </div>
        </Link>
      </div>

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
                <span className="text-sm font-medium truncate">
                  {username}
                </span>
                <span className="text-xs text-muted-foreground">
                  Logged in
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 ml-auto"
            >
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
