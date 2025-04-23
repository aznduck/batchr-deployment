import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TopNav: React.FC = () => {
  return (
    <div className="h-14 fixed top-0 left-0 right-0 z-40 bg-card border-b border-border/40 px-4 flex items-center justify-between">
      <div className="flex items-center">
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
          <img src="/Clover.svg" alt="Batchr Logo" className="h-8 w-8" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <HelpCircle size={18} className="mr-1" />
          Help
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MessageCircle size={18} className="mr-1" />
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default TopNav;
