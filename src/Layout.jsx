import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  Film, 
  FileText, 
  MapPin, 
  Users, 
  Calendar, 
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  Clapperboard,
  LogOut,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", page: "Dashboard", icon: Clapperboard },
  { name: "Projects", page: "Projects", icon: Film },
  { name: "Script Analysis", page: "ScriptAnalysis", icon: FileText },
  { name: "Locations", page: "Locations", icon: MapPin },
  { name: "Crew", page: "Crew", icon: Users },
  { name: "Schedule", page: "Schedule", icon: Calendar },
  { name: "Call Sheets", page: "CallSheets", icon: ClipboardList },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  // Hide layout for crew join page
  if (currentPageName === "CrewJoin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        :root {
          --shilpi-primary: #f59e0b;
          --shilpi-primary-dark: #d97706;
          --shilpi-accent: #fbbf24;
          --shilpi-bg-dark: #0f172a;
          --shilpi-bg-darker: #020617;
        }
        
        .shilpi-glow {
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.15);
        }
        
        .shilpi-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .nav-item-active {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%);
          border-left: 3px solid #f59e0b;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-50 transform transition-transform duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/50">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl shilpi-gradient flex items-center justify-center shilpi-glow group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Shilpi</h1>
                <p className="text-xs text-slate-500">Film Production OS</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "nav-item-active text-amber-400 bg-amber-500/10" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-amber-400")} />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* AI Badge */}
          <div className="p-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">AI-Powered</span>
              </div>
              <p className="text-xs text-slate-400">
                Script analysis, location matching & smart scheduling
              </p>
            </div>
          </div>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-slate-800/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.full_name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.full_name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg shilpi-gradient flex items-center justify-center">
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Shilpi</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}