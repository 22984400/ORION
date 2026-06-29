import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, Settings, ChevronDown, Search } from "lucide-react"; // ✅ Search added
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { NotificationBadge } from "../ui/NotificationBadge";
import { GlobalSearch } from "../ui/GlobalSearch";

interface TopBarProps {
  onMenuToggle: () => void;
}

const getInitials = (name: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Utilisateur";
  const initials = getInitials(
    user?.user_metadata?.full_name || user?.email || "",
  );

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: menu + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global search (desktop) */}
          <div className="hidden sm:block flex-1 max-w-md">
            <GlobalSearch />
          </div>

          {/* Mobile search button */}
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-200 transition-colors sm:hidden"
            aria-label="Recherche"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-lg hover:bg-slate-700/40 transition-colors"
            aria-label="Notifications"
          >
            <NotificationBadge iconClassName="w-5 h-5 text-slate-400" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-sm font-medium text-primary-300">
                {initials}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform",
                  showUserMenu && "rotate-180",
                )}
              />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/40 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/40 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
