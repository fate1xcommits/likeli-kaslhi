import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../lib/ThemeContext'
import './Navbar.css'

function Navbar({ onMenuClick }) {
    const [walletConnected, setWalletConnected] = useState(false)
    const { theme, toggleTheme } = useTheme()

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="logo">
                    <img src="/logo.png" alt="Likeli" className="logo-image" />
                    <span className="logo-text">Likeli</span>
                </div>
            </div>

            <div className="navbar-center">
                <NavLink to="/markets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Markets
                </NavLink>
                <NavLink to="/portfolio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Portfolio
                </NavLink>
                <NavLink to="/vaults" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Vaults
                </NavLink>
                <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Leaderboard
                </NavLink>
                <NavLink to="/ai-researcher" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    AI Researcher
                </NavLink>
                <span className="nav-link disabled" title="Coming Soon">Rivals</span>
                <span className="nav-link disabled" title="Coming Soon">Hedging</span>
                <span className="nav-link disabled" title="Coming Soon">Indexing</span>
                <span className="nav-link disabled" title="Coming Soon">Parlay</span>
            </div>

            <div className="navbar-right">
                <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
                <button
                    className={`wallet-btn ${walletConnected ? 'connected' : ''}`}
                    onClick={() => setWalletConnected(!walletConnected)}
                >
                    {walletConnected ? (
                        <>
                            <span className="wallet-dot"></span>
                            0x8F7d...c9E2
                        </>
                    ) : (
                        'Connect Wallet'
                    )}
                </button>
            </div>
        </nav>
    )
}

export default Navbar

