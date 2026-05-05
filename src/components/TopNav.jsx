import { useState } from 'react';
import { CheckSquare, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TopNav() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Người dùng';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
          <CheckSquare size={18} />
        </div>
        <span className="font-bold text-lg text-gray-800 hidden sm:block">Quản Lý Nhiệm Vụ</span>
        <span className="font-bold text-lg text-gray-800 sm:hidden">Nhiệm Vụ</span>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {avatarLetter}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[140px] truncate">
            {displayName}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Đăng nhập với</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
