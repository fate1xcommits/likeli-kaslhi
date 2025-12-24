import { useState } from 'react'
import { Link } from 'react-router-dom'
import './EventCard.css'

function formatCurrency(num) {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`
    return `$${num.toFixed(0)}`
}

function formatPrice(price) {
    return `${Math.round(price * 100)}¢`
}

function EventCard({ event, style, onTrade, vaultSelected }) {
    const market = event.markets?.[0]
    const outcomes = market?.outcomes || []
    const isBinary = outcomes.length === 2 && !outcomes[0].abbr
    const isTeamMatch = outcomes.length === 2 && outcomes[0].abbr
    const isMultiOutcome = outcomes.length > 2

    // Get team colors based on abbreviation (simplified)
    const getTeamColor = (abbr) => {
        const colors = {
            'NE': '#002244', 'BAL': '#241773', 'BUF': '#00338D', 'CLE': '#311D00',
            'PIT': '#FFB612', 'DET': '#0076B6', 'MIN': '#4F2683', 'NYG': '#0B2265',
            'LV': '#A5ACAF', 'HOU': '#03202F', 'AVL': '#670E36', 'MUN': '#DA291C',
            'TIE': '#666666'
        }
        return colors[abbr] || 'var(--color-primary)'
    }

    const handleTradeClick = (e, side) => {
        e.preventDefault()
        e.stopPropagation()
        if (onTrade) {
            onTrade(event, side)
        }
    }

    return (
        <Link to={`/event/${event.id}`} className="event-card glass animate-fade-in-up" style={style}>
            {/* Hover Trading Interface (Chart + Buttons) */}
            <div className="hover-trade-interface">
                <div className="card-chart-overlay" /> {/* Chart Background */}

                {/* Y-Axis Labels (Scale) */}
                <div className="chart-y-axis">
                    <span className="axis-label">99¢</span>
                    <span className="axis-label">50¢</span>
                    <span className="axis-label">2¢</span>
                </div>

                {/* Volume & Add Icon overlaying chart */}
                <div className="hover-stats-row">
                    <span className="hover-volume">{formatCurrency(event.volume)}</span>
                    <span className="hover-add-icon">⊕</span>
                </div>

                {/* Compact Trading Bar at Bottom */}
                <div className="mini-trade-bar">
                    {(outcomes.slice(0, 2)).map((outcome, idx) => (
                        <button
                            key={idx}
                            className={`mini-trade-btn ${idx === 0 ? 'yes' : 'no'}`}
                            onClick={(e) => handleTradeClick(e, outcome.name)}
                        >
                            <div className="mini-btn-top">
                                <span className="mini-label">{outcome.abbr || outcome.name.slice(0, 3).toUpperCase()}</span>
                            </div>
                            <div className="mini-btn-main">
                                <span className="mini-price">{Math.floor(outcome.price * 100)}¢</span>
                            </div>
                            <div className="mini-btn-bottom">
                                <span className="mini-payout">$100 → ${outcome.price > 0 ? Math.floor(100 / outcome.price) : '--'}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="event-header">
                <span className="event-category">{event.category}</span>
                {event.isLive && <span className="live-badge">REG TIME ● LIVE</span>}
                {event.frequency && <span className="frequency-badge">◷ {event.frequency}</span>}
            </div>

            <h3 className="event-title">{event.title}</h3>

            {/* Team Match Layout (e.g., NE vs BAL) */}
            {isTeamMatch && (
                <div className="team-match">
                    {outcomes.map((outcome, idx) => (
                        <button
                            key={idx}
                            className={`team-btn ${vaultSelected ? 'tradeable' : ''}`}
                            style={{ backgroundColor: getTeamColor(outcome.abbr) }}
                            onClick={(e) => handleTradeClick(e, outcome.name)}
                        >
                            <span className="team-abbr">{outcome.abbr}</span>
                            <span className="team-price">{formatPrice(outcome.price)}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Multi-outcome Layout (e.g., Champion picks) */}
            {isMultiOutcome && (
                <div className="multi-outcomes">
                    {outcomes.slice(0, 3).map((outcome, idx) => (
                        <div key={idx} className="outcome-row">
                            <span className="outcome-name">{outcome.name}</span>
                            <span className="outcome-percent">{Math.round(outcome.price * 100)}%</span>
                            <button
                                className={`yes-btn ${vaultSelected ? 'tradeable' : ''}`}
                                onClick={(e) => handleTradeClick(e, 'YES')}
                            >
                                Yes
                            </button>
                            <button
                                className={`no-btn ${vaultSelected ? 'tradeable' : ''}`}
                                onClick={(e) => handleTradeClick(e, 'NO')}
                            >
                                No
                            </button>
                        </div>
                    ))}
                    {outcomes.length > 3 && (
                        <div className="more-outcomes">+{outcomes.length - 3} more</div>
                    )}
                </div>
            )}

            {/* Binary Yes/No Layout */}
            {isBinary && (
                <div className="multi-outcomes">
                    {outcomes.map((outcome, idx) => (
                        <div key={idx} className="outcome-row">
                            <span className="outcome-name">{outcome.name}</span>
                            <span className="outcome-percent">{Math.round(outcome.price * 100)}%</span>
                            <button
                                className={`yes-btn ${vaultSelected ? 'tradeable' : ''}`}
                                onClick={(e) => handleTradeClick(e, 'YES')}
                            >
                                Yes
                            </button>
                            <button
                                className={`no-btn ${vaultSelected ? 'tradeable' : ''}`}
                                onClick={(e) => handleTradeClick(e, 'NO')}
                            >
                                No
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="event-footer">
                <span className="event-volume">{formatCurrency(event.volume)}</span>
                <button className="add-btn" onClick={(e) => e.preventDefault()}>
                    <span>⊕</span>
                </button>
            </div>

            {/* Payout hints for team matches */}
            {isTeamMatch && (
                <div className="payout-hints">
                    {outcomes.map((outcome, idx) => (
                        <span key={idx} className="payout-hint">
                            $100 → ${Math.round(100 / outcome.price)}
                        </span>
                    ))}
                </div>
            )}

            {/* Trade indicator */}
            {vaultSelected && (
                <div className="trade-indicator">
                    Click YES/NO to trade
                </div>
            )}
        </Link>
    )
}

export default EventCard
