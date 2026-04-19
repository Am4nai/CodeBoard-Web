import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api/axiosInstance";
import ThemeToggle from "../ui/ThemeToggle";

type UserSearchResult = {
  id: number;
  username: string;
  avatar_url: string | null;
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [showUserResults, setShowUserResults] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const typingTimer = useRef<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  const userAvatar = user?.profile?.avatar_url || "https://placehold.co/32x32";

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setShowUserResults(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query") || "";
    setSearchText(q);

    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setShowUserResults(false);
  }, [location.search, location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowUserResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowUserResults(false);
    navigate(`/search?query=${encodeURIComponent(searchText)}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);

    if (value.startsWith("#")) {
      setShowUserResults(false);
      setUserResults([]);
      return;
    }

    if (value.trim().length === 0) {
      setShowUserResults(false);
      setUserResults([]);
      return;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);

    if (value.startsWith("@")) {
      typingTimer.current = window.setTimeout(async () => {
        const q = value.replace("@", "").trim();
        if (!q) {
          setShowUserResults(false);
          setUserResults([]);
          return;
        }

        try {
          setIsLoadingUsers(true);
          const res = await api.get<{ results: UserSearchResult[] }>(
            `/users/search?query=${encodeURIComponent(q)}`
          );
          setUserResults(res.data.results || []);
          setShowUserResults(true);
        } catch (err) {
          console.error(err);
          setUserResults([]);
          setShowUserResults(true);
        } finally {
          setIsLoadingUsers(false);
        }
      }, 250);
    } else {
      setShowUserResults(false);
      setUserResults([]);
    }
  };

  const handleLogout = () => {
    logout();
    closeAll();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-lite">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-lg sm:text-xl font-bold text-text shrink-0"
          onClick={() => {
            setSearchText("");
            closeAll();
          }}
        >
          CodeBoard
        </Link>

        <form
          onSubmit={handleSubmit}
          className="relative hidden sm:flex grow max-w-xl"
          ref={searchRef}
        >
          <input
            type="text"
            placeholder='Search posts… (use "#tag" or "@user")'
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg px-4 py-2 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out text-text"
          />

          {showUserResults && (
            <div className="absolute left-0 top-[110%] w-full bg-surface border border-surface-lite rounded-xl shadow-3xl p-2 z-50 glow-hover">
              {isLoadingUsers && <p className="p-2 text-text-secondary">Searching...</p>}

              {!isLoadingUsers && userResults.length === 0 && (
                <p className="p-2 text-text-secondary">No users found</p>
              )}

              {userResults.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => {
                    navigate(`/profile/${u.id}`);
                    setShowUserResults(false);
                    setSearchText("");
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-bg rounded-lg transition-colors text-left"
                >
                  <img
                    src={u.avatar_url || "https://placehold.co/32x32"}
                    className="w-8 h-8 rounded-full object-cover border border-surface-lite"
                    alt={u.username}
                  />
                  <span className="text-text font-medium">{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        <nav className="hidden md:flex items-center gap-6 text-text font-medium">
          <Link to="/" className="hover:text-primary-hover transition-colors">
            Home
          </Link>
          <Link to="/create" className="hover:text-primary-hover transition-colors">
            Create
          </Link>
          <Link to="/collections" className="hover:text-primary-hover transition-colors">
            Collections
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-2 hover:text-primary-hover transition-colors"
              >
                <img
                  src={userAvatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-surface-lite object-cover"
                />
                <span className="font-medium">{user.username}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-surface border border-surface-lite rounded-xl shadow-3xl overflow-hidden glow-hover">
                  <Link
                    to={`/profile/${user.id}`}
                    className="block px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    onClick={closeAll}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    onClick={closeAll}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-bg transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="py-2 text-text hover:text-primary-hover transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-text-buttons rounded-lg hover:bg-primary-hover transition-colors"
              >
                Register
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>

        <button
          className="md:hidden text-text hover:text-primary-hover transition-colors"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden px-4 pb-4 animate-fade-up">
          <div className="mt-3 flex justify-end">
            <ThemeToggle />
          </div>

          <form onSubmit={handleSubmit} className="relative mt-3" ref={searchRef}>
            <input
              type="text"
              placeholder='Search… ("#tag" or "@user")'
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors text-text"
            />

            {showUserResults && (
              <div className="absolute left-0 top-[110%] w-full bg-surface border border-surface-lite rounded-xl shadow-3xl p-2 z-50 glow-hover">
                {isLoadingUsers && <p className="p-2 text-text-secondary">Searching...</p>}

                {!isLoadingUsers && userResults.length === 0 && (
                  <p className="p-2 text-text-secondary">No users found</p>
                )}

                {userResults.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      navigate(`/profile/${u.id}`);
                      closeAll();
                      setSearchText("");
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-bg rounded-lg transition-colors text-left"
                  >
                    <img
                      src={u.avatar_url || "https://placehold.co/32x32"}
                      className="w-8 h-8 rounded-full object-cover border border-surface-lite"
                      alt={u.username}
                    />
                    <span className="text-text font-medium">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <nav className="mt-4 flex flex-col gap-2">
            <Link
              to="/"
              className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
              onClick={closeAll}
            >
              Home
            </Link>
            <Link
              to="/create"
              className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
              onClick={closeAll}
            >
              Create
            </Link>
            <Link
              to="/collections"
              className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
              onClick={closeAll}
            >
              Collections
            </Link>

            {user ? (
              <>
                <Link
                  to={`/profile/${user.id}`}
                  className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
                  onClick={closeAll}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
                  onClick={closeAll}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-4 py-3 bg-error/15 border border-error/25 text-error hover:bg-error/20 transition-colors text-left"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-3 bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text text-center"
                  onClick={closeAll}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg px-4 py-3 bg-primary hover:bg-primary-hover transition-colors text-text-buttons text-center"
                  onClick={closeAll}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}