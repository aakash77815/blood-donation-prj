import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 relative">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary" onClick={closeMenu}>
          🩸 Blood Donor Finder
        </Link>

        {/* Desktop nav — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user?.name}</span>
              <Link to="/search" className="text-sm font-medium text-gray-700 hover:text-primary">
                Search Donors
              </Link>
              <Link to="/requests" className="text-sm font-medium text-gray-700 hover:text-primary">
                Requests
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary">
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-primary">
                    Admin
                  </Link>
                  <Link to="/admin/requests" className="text-sm font-medium text-gray-700 hover:text-primary">
                    Manage Requests
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger button — only visible below sm breakpoint */}
        <button
          className="sm:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
          {isAuthenticated ? (
            <>
              <p className="text-sm text-gray-600">Hi, {user?.name}</p>
              <Link
                to="/search"
                onClick={closeMenu}
                className="block text-sm font-medium text-gray-700 hover:text-primary"
              >
                Search Donors
              </Link>
              <Link
                to="/requests"
                onClick={closeMenu}
                className="block text-sm font-medium text-gray-700 hover:text-primary"
              >
                Requests
              </Link>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="block text-sm font-medium text-gray-700 hover:text-primary"
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="block text-sm font-medium text-gray-700 hover:text-primary"
                  >
                    Admin
                  </Link>
                  <Link
                    to="/admin/requests"
                    onClick={closeMenu}
                    className="block text-sm font-medium text-gray-700 hover:text-primary"
                  >
                    Manage Requests
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className="block text-sm font-medium text-gray-700 hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="block text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white text-center hover:bg-primary-dark transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
