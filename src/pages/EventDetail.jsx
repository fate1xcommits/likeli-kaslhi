import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { dflowAPI } from '../lib/dflow'
import { useDemo } from '../lib/DemoContext'
import { getYesPrice, getNoPrice, resetMarket, executeBuy } from '../lib/amm'
import TradeModal from '../components/TradeModal'
import './EventDetail.css'

function EventDetail() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const { userVaults, executeTrade, walletBalance, setWalletBalance, STAGE } = useDemo()

    const [event, setEvent] = useState(null)
    const [selectedOutcome, setSelectedOutcome] = useState(null)
    const [direction, setDirection] = useState('BUY') // BUY or SELL
    const [side, setSide] = useState('YES') // YES or NO
    const [contracts, setContracts] = useState(100)
    const [loading, setLoading] = useState(true)
    const [selectedVaultId, setSelectedVaultId] = useState(searchParams.get('vault') || '')
    const [tradeMode, setTradeMode] = useState('individual') // 'individual' or 'vault'
    const [showTradeModal, setShowTradeModal] = useState(false)
    const [tradeSuccess, setTradeSuccess] = useState('')
    const [chartView, setChartView] = useState('Both')
    const [timeFilter, setTimeFilter] = useState('1D')
    const [userPositions, setUserPositions] = useState([]) // Track individual positions

    const tradingVaults = userVaults.filter(v => v.stage === STAGE?.TRADING || v.stage === 'Trading')

    useEffect(() => {
        loadEvent()
    }, [id])

    useEffect(() => {
        const vaultParam = searchParams.get('vault')
        if (vaultParam && tradingVaults.find(v => v.id === vaultParam)) {
            setSelectedVaultId(vaultParam)
            setTradeMode('vault')
        }
    }, [searchParams, tradingVaults])

    const loadEvent = async () => {
        setLoading(true)
        try {
            const data = await dflowAPI.getEvents()
            const found = data.events?.find(e => e.id === id)
            if (found) {
                setEvent(found)
                if (found.markets?.[0]?.outcomes?.[0]) {
                    setSelectedOutcome(found.markets[0].outcomes[0])
                }
            }
        } catch (error) {
            console.error('Failed to load event:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTrade = () => {
        const marketId = event?.markets?.[0]?.id || id

        if (tradeMode === 'vault' && selectedVaultId) {
            // Trade through vault
            const result = executeTrade(selectedVaultId, marketId, event.title, side, contracts)
            if (result.success) {
                const newPrice = ((result.newMarketPrice || 0) * 100).toFixed(1)
                setTradeSuccess(`${side} ${(result.sharesAcquired || 0).toFixed(0)} shares @ ${((result.price || 0) * 100).toFixed(1)}¢ → Price now ${newPrice}¢`)
                loadEvent()
                setTimeout(() => setTradeSuccess(''), 5000)
            } else {
                setTradeSuccess(`Trade failed: ${result.error}`)
                setTimeout(() => setTradeSuccess(''), 3000)
            }
        } else {
            // Direct individual trade
            if (contracts > walletBalance) {
                setTradeSuccess('Insufficient balance!')
                setTimeout(() => setTradeSuccess(''), 3000)
                return
            }

            const result = executeBuy(marketId, side, contracts)
            if (result.success) {
                // Deduct from wallet
                setWalletBalance(prev => prev - contracts)

                // Track position
                setUserPositions(prev => [...prev, {
                    marketId,
                    marketName: event.title,
                    side,
                    shares: result.shares,
                    avgPrice: result.avgPrice,
                    costBasis: contracts
                }])

                const newPrice = ((result.newYesPrice || 0) * 100).toFixed(1)
                setTradeSuccess(`Bought ${(result.shares || 0).toFixed(0)} ${side} @ ${((result.avgPrice || 0) * 100).toFixed(1)}¢ → Price now ${newPrice}¢`)
                loadEvent()
                setTimeout(() => setTradeSuccess(''), 5000)
            } else {
                setTradeSuccess(`Trade failed: ${result.error}`)
                setTimeout(() => setTradeSuccess(''), 3000)
            }
        }
    }

    // Get market ID for AMM prices
    const marketId = event?.markets?.[0]?.id

    // Get live AMM prices - clamp to valid range
    const getClampedYesPrice = () => {
        if (!marketId) return 0.5
        const price = getYesPrice(marketId)
        // If price is invalid (NaN, Infinity, or out of range), reset market
        if (!isFinite(price) || price <= 0 || price >= 1) {
            console.log('Invalid price detected, resetting market:', marketId)
            resetMarket(marketId, 0.5)
            return 0.5
        }
        return price
    }

    if (loading) {
        return <div className="detail-loading">Loading...</div>
    }

    if (!event) {
        return <div className="detail-loading">Event not found</div>
    }

    // Use clamped AMM prices
    const yesPrice = getClampedYesPrice()
    const noPrice = 1 - yesPrice

    // Format prices as cents (0-100)
    const yesCents = (yesPrice * 100).toFixed(1)
    const noCents = (noPrice * 100).toFixed(1)

    const mainPrice = side === 'YES' ? yesCents : noCents
    const totalCost = (contracts * (side === 'YES' ? yesPrice : noPrice)).toFixed(0)

    return (
        <div className="poly-detail">
            <Link to="/markets" className="poly-back">← Back to Markets</Link>

            <div className="poly-card">
                {/* Header Row */}
                <div className="poly-header">
                    <div className="poly-header-left">
                        <div className="poly-icon">◈</div>
                        <div className="poly-title-area">
                            <h1>{event.title}</h1>
                            <div className="poly-meta">
                                <span className="poly-brand">LIKELI</span>
                                <span className="poly-live">● Live</span>
                                <span className="poly-sep">|</span>
                                <span className="poly-vol">Vol ${(event.volume / 1000).toFixed(0)}K</span>
                            </div>
                        </div>
                    </div>
                    <div className="poly-header-right">
                        <div className="poly-price">{yesCents}¢</div>
                        <div className="poly-change positive">YES probability</div>
                    </div>
                </div>

                {/* Chart Controls */}
                <div className="poly-chart-controls">
                    <div className="poly-toggles">
                        {['Market', 'BTC', 'Both'].map(v => (
                            <button key={v} className={chartView === v ? 'active' : ''} onClick={() => setChartView(v)}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="poly-times">
                        {['5M', '15M', '30M', '1H', '6H', '1D', '1W', '1M', 'MAX'].map(t => (
                            <button key={t} className={timeFilter === t ? 'active' : ''} onClick={() => setTimeFilter(t)}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Area */}
                <div className="poly-chart">
                    <div className="poly-y-left">
                        <span>100¢</span>
                        <span>{yesCents}¢</span>
                        <span>0¢</span>
                    </div>

                    <div className="poly-chart-area">
                        <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
                            {/* Likeli Red Market line */}
                            <path
                                d="M0,140 
                                   C50,135 80,130 120,125 
                                   C160,120 200,140 250,135 
                                   C300,130 350,115 400,120 
                                   C450,125 500,100 550,95 
                                   C600,90 650,110 700,85 
                                   C750,60 800,75 850,55 
                                   C900,35 950,50 1000,45"
                                fill="none"
                                stroke="#E63946"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {(chartView === 'Both' || chartView === 'BTC') && (
                                <path
                                    d="M0,120 
                                       C50,125 80,115 120,130 
                                       C160,145 200,120 250,115 
                                       C300,110 350,130 400,125 
                                       C450,120 500,90 550,100 
                                       C600,110 650,80 700,90 
                                       C750,100 800,60 850,70 
                                       C900,80 950,55 1000,60"
                                    fill="none"
                                    stroke="#00D4FF"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>
                        <div className="poly-legend">
                            <span className="legend-red">— Market</span>
                            {(chartView === 'Both' || chartView === 'BTC') && <span className="legend-blue">— BTC</span>}
                        </div>
                    </div>

                    <div className="poly-y-right">
                        <span>$85,437</span>
                        <span>$85,360</span>
                        <span>$85,156</span>
                    </div>
                </div>

                {/* Trade Section */}
                <div className="poly-trade">
                    <div className="poly-trade-tabs">
                        <button
                            className={direction === 'BUY' ? 'active' : ''}
                            onClick={() => setDirection('BUY')}
                        >
                            BUY
                        </button>
                        <button
                            className={direction === 'SELL' ? 'active' : ''}
                            onClick={() => setDirection('SELL')}
                        >
                            SELL
                        </button>
                        <div className="poly-levels">● 78 levels</div>
                    </div>

                    <div className="poly-trade-row">
                        <button
                            className={`poly-yes ${side === 'YES' ? 'active' : ''}`}
                            onClick={() => setSide('YES')}
                        >
                            <span className="label">YES</span>
                            <span className="value">{yesCents}¢</span>
                        </button>
                        <button
                            className={`poly-no ${side === 'NO' ? 'active' : ''}`}
                            onClick={() => setSide('NO')}
                        >
                            <span className="label">NO</span>
                            <span className="value">{noCents}¢</span>
                        </button>

                        <div className="poly-input">
                            <label>PRICE</label>
                            <span className="input-value">{side === 'YES' ? yesCents : noCents}¢</span>
                        </div>
                        <div className="poly-input">
                            <label>SIZE</label>
                            <input
                                type="number"
                                value={contracts}
                                onChange={(e) => setContracts(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="poly-input total">
                            <label>TOTAL</label>
                            <span className="total-value">${totalCost}</span>
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className="poly-action">
                        <div className="trade-mode-toggle">
                            <button
                                className={tradeMode === 'individual' ? 'active' : ''}
                                onClick={() => setTradeMode('individual')}
                            >
                                💰 Individual (${walletBalance?.toFixed(0) || 0})
                            </button>
                            <button
                                className={tradeMode === 'vault' ? 'active' : ''}
                                onClick={() => setTradeMode('vault')}
                            >
                                🏦 Vault
                            </button>
                        </div>

                        {tradeMode === 'vault' && tradingVaults.length > 0 && (
                            <select value={selectedVaultId} onChange={(e) => setSelectedVaultId(e.target.value)}>
                                <option value="">Select vault...</option>
                                {tradingVaults.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        )}

                        <button
                            className={`poly-execute ${side === 'YES' ? 'yes' : 'no'}`}
                            disabled={tradeMode === 'vault' && !selectedVaultId}
                            onClick={handleTrade}
                        >
                            {direction} {side}
                        </button>
                    </div>
                </div>
            </div>

            {tradeSuccess && <div className="poly-toast">{tradeSuccess}</div>}

            <TradeModal
                isOpen={showTradeModal}
                onClose={() => setShowTradeModal(false)}
                event={event}
                initialSide={side}
                vaultId={selectedVaultId}
            />
        </div>
    )
}

export default EventDetail
