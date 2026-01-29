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
    <div className="min-h-screen relative overflow-hidden">
      {/* Organic background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-okeefe-sage/20 to-okeefe-sky/20 organic-blob opacity-40" style={{animation: 'morph 12s ease-in-out infinite'}} />
        <div className="absolute bottom-40 left-40 w-80 h-80 bg-gradient-to-br from-okeefe-terracotta/15 to-okeefe-rose/15 organic-blob opacity-30" style={{animation: 'morph 15s ease-in-out infinite reverse'}} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-okeefe-sand/20 to-okeefe-cream/10 organic-blob opacity-25" style={{animation: 'morph 10s ease-in-out infinite'}} />
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        
        :root {
          --okeefe-sage: #a8b5a0;
          --okeefe-terracotta: #d4998c;
          --okeefe-cream: #f5f1e8;
          --okeefe-sand: #e8d5c4;
          --okeefe-rose: #daa699;
          --okeefe-sky: #b8cdd9;
          --okeefe-earth: #8b7b6f;
        }
        
        body {
          background: linear-gradient(135deg, #f5f1e8 0%, #e8d5c4 50%, #ddd0c6 100%);
        }
        
        .organic-blob {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: morph 8s ease-in-out infinite;
        }
        
        .organic-glow {
          box-shadow: 0 20px 60px rgba(168, 181, 160, 0.3);
          filter: blur(0.5px);
        }
        
        .okeefe-gradient {
          background: linear-gradient(135deg, var(--okeefe-terracotta) 0%, var(--okeefe-rose) 100%);
        }
        
        .nav-item-active {
          background: linear-gradient(90deg, rgba(212, 153, 140, 0.2) 0%, transparent 100%);
          border-left: 4px solid transparent;
          border-image: linear-gradient(180deg, var(--okeefe-terracotta), var(--okeefe-sage)) 1;
        }
        
        .flowing-shape {
          clip-path: ellipse(70% 60% at 50% 50%);
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .soft-shadow {
          box-shadow: 0 10px 40px rgba(139, 123, 111, 0.15);
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
        "fixed top-0 left-0 h-full w-72 backdrop-blur-xl z-50 transform transition-transform duration-300 ease-out",
        "bg-gradient-to-b from-okeefe-cream/95 to-okeefe-sand/95",
        "border-r-4 border-okeefe-earth/20",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-okeefe-earth/20">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 group">
              <div className="w-14 h-14 organic-blob okeefe-gradient flex items-center justify-center soft-shadow group-hover:scale-105 transition-all duration-500">
                <Clapperboard className="w-6 h-6 text-okeefe-cream" />
              </div>
              <div>
                <h1 className="text-2xl font-serif italic text-okeefe-earth tracking-wide">Shilpi</h1>
                <p className="text-xs text-okeefe-earth/60 font-light">Film Production</p>
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
                    "flex items-center gap-3 px-4 py-3 text-sm font-light transition-all duration-300",
                    "rounded-full",
                    isActive 
                      ? "nav-item-active text-okeefe-terracotta bg-okeefe-rose/10 border-l-4 border-okeefe-terracotta" 
                      : "text-okeefe-earth/70 hover:text-okeefe-terracotta hover:bg-okeefe-sand/30"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-okeefe-terracotta")} />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-okeefe-terracotta" />}
                </Link>
              );
            })}
          </nav>

          {/* AI Badge */}
          <div className="p-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-okeefe-sage/20 to-okeefe-sky/15 border-2 border-okeefe-sage/30 soft-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-okeefe-sage" />
                <span className="text-xs font-light text-okeefe-earth">AI-Powered</span>
              </div>
              <p className="text-xs text-okeefe-earth/60 leading-relaxed">
                Script analysis, location matching & smart scheduling
              </p>
            </div>
          </div>

          {/* User section */}
          {user && (
            <div className="p-4 border-t-2 border-okeefe-earth/20">
              <div className="flex items-center gap-3 p-3 rounded-full bg-okeefe-sand/40 soft-shadow">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-okeefe-terracotta to-okeefe-rose flex items-center justify-center text-okeefe-cream font-light text-sm organic-blob">
                  {user.full_name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-okeefe-earth truncate">{user.full_name || "User"}</p>
                  <p className="text-xs text-okeefe-earth/50 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-okeefe-earth/50 hover:text-okeefe-terracotta transition-colors duration-300"
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
        <header className="lg:hidden sticky top-0 z-30 backdrop-blur-xl border-b-2 border-okeefe-earth/20 bg-okeefe-cream/95">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-okeefe-earth/70 hover:text-okeefe-terracotta"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full okeefe-gradient flex items-center justify-center organic-blob">
                <Clapperboard className="w-4 h-4 text-okeefe-cream" />
              </div>
              <span className="font-serif italic text-lg text-okeefe-earth">Shilpi</span>
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