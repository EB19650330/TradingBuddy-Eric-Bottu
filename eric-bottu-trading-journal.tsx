import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from "recharts";

/* ============================================================
   ERIC BOTTU — Trading Journal (in de geest van bitease.io)
   Eén bestand. Data bewaard via window.storage.
   Nieuw t.o.v. v1: logo, stop-loss + R-multiples, CSV-import,
   kalenderoverzicht van winst/verlies per dag.
   ============================================================ */

const BLUE = "#5BA3DD";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
:root{
  --bg:#0A0E12;--bg2:#0E141A;--surface:#121A21;--surface2:#17222C;
  --line:#223040;--line2:#2C3D4E;--text:#E9F0F4;--muted:#7E909E;--muted2:#566571;
  --profit:#34D399;--profit-dim:#0F3A2C;--loss:#FF5C63;--loss-dim:#3A1418;
  --blue:#5BA3DD;--blue-deep:#3F86C2;--blue-dim:#16324A;
}
*{box-sizing:border-box}
.app{font-family:'Inter',system-ui,sans-serif;color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;letter-spacing:.1px;
  background:radial-gradient(1100px 560px at 82% -12%,rgba(91,163,221,.10),transparent 60%),
             radial-gradient(900px 480px at -10% 112%,rgba(52,211,153,.05),transparent 55%),var(--bg);}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}.disp{font-family:'Sora',sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px 80px}

.topbar{position:sticky;top:0;z-index:30;backdrop-filter:blur(14px);background:rgba(10,14,18,.74);border-bottom:1px solid var(--line)}
.topbar-in{max-width:1080px;margin:0 auto;padding:13px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px}
.brand-txt{font-family:'Sora';font-weight:800;font-size:17px;letter-spacing:.3px;line-height:1.05}
.brand-txt small{display:block;color:var(--muted);font-weight:500;font-family:'Inter';font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase}
.spacer{flex:1}
.tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:4px}
.tab{border:0;background:none;color:var(--muted);font-weight:600;font-size:13px;padding:7px 13px;border-radius:7px;cursor:pointer;transition:.18s}
.tab:hover{color:var(--text)}.tab.active{background:var(--surface2);color:var(--text)}
.cur-sel{background:var(--surface);border:1px solid var(--line);color:var(--muted);border-radius:9px;padding:8px 9px;font-family:'IBM Plex Mono';font-size:13px;cursor:pointer}
.btn{border:0;cursor:pointer;font-weight:600;font-size:13px;border-radius:9px;padding:9px 15px;transition:.16s;display:inline-flex;align-items:center;gap:7px}
.btn-accent{background:linear-gradient(135deg,var(--blue),var(--blue-deep));color:#04253f;box-shadow:0 6px 18px rgba(91,163,221,.28)}
.btn-accent:hover{filter:brightness(1.07);transform:translateY(-1px)}
.btn-ghost{background:var(--surface);border:1px solid var(--line);color:var(--text)}
.btn-ghost:hover{border-color:var(--line2);background:var(--surface2)}
.btn-sm{padding:6px 11px;font-size:12px;border-radius:7px}
.eyebrow{font-family:'IBM Plex Mono';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);margin:30px 0 12px}
.card{background:linear-gradient(180deg,var(--surface),var(--bg2));border:1px solid var(--line);border-radius:16px}
.grid{display:grid;gap:14px}
.hero{grid-template-columns:300px 1fr;align-items:stretch}@media(max-width:780px){.hero{grid-template-columns:1fr}}
.score-card{padding:22px;display:flex;flex-direction:column;align-items:center;gap:2px}
.score-card .label,.pnl-card .label{font-family:'IBM Plex Mono';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2)}
.gauge-num{font-family:'Sora';font-weight:800;font-size:46px;line-height:1;margin-top:-46px}
.gauge-sub{font-size:12px;color:var(--muted);margin-top:6px;text-align:center}
.gauge-tier{font-family:'Sora';font-weight:700;font-size:14px;margin-top:10px;padding:4px 12px;border-radius:20px;border:1px solid}
.pnl-card{padding:22px;display:flex;flex-direction:column;justify-content:center}
.pnl-big{font-family:'Sora';font-weight:800;font-size:40px;line-height:1.05;margin:8px 0 2px}@media(max-width:480px){.pnl-big{font-size:32px}}
.pnl-row{display:flex;gap:24px;margin-top:16px;flex-wrap:wrap}
.pnl-mini .k{font-family:'IBM Plex Mono';font-size:11px;color:var(--muted2);letter-spacing:1px;text-transform:uppercase}
.pnl-mini .v{font-family:'Sora';font-weight:700;font-size:18px;margin-top:3px}
.stats{grid-template-columns:repeat(4,1fr)}@media(max-width:780px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{padding:16px}.stat .k{font-family:'IBM Plex Mono';font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted2)}
.stat .v{font-family:'Sora';font-weight:700;font-size:23px;margin-top:8px}.stat .hint{font-size:11px;color:var(--muted);margin-top:4px}
.pos{color:var(--profit)}.neg{color:var(--loss)}.neutral{color:var(--blue)}
.chart-card{padding:20px}
.chart-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:8px}
.chart-title{font-family:'Sora';font-weight:700;font-size:16px}.chart-meta{font-family:'IBM Plex Mono';font-size:12px;color:var(--muted)}
.t-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.input,.select,.textarea{background:var(--bg2);border:1px solid var(--line);color:var(--text);border-radius:9px;padding:9px 11px;font-family:'Inter';font-size:13px;width:100%}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(91,163,221,.14)}
.input.mono{font-family:'IBM Plex Mono'}
.select{cursor:pointer;-webkit-appearance:none;appearance:none;padding-right:30px;background-repeat:no-repeat;background-position:right 10px center;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237E909E' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")}
.table-card{overflow:hidden}.tscroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:840px}
thead th{font-family:'IBM Plex Mono';font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted2);text-align:left;padding:13px 14px;border-bottom:1px solid var(--line);white-space:nowrap;font-weight:500}
tbody td{padding:13px 14px;border-bottom:1px solid rgba(34,48,64,.5);white-space:nowrap}
tbody tr:hover{background:var(--surface)}tbody tr:last-child td{border-bottom:0}
.num{font-family:'IBM Plex Mono';font-size:12.5px;text-align:right}th.num{text-align:right}
.sym{font-family:'Sora';font-weight:700;font-size:13px}
.badge{font-family:'IBM Plex Mono';font-size:10px;letter-spacing:.5px;text-transform:uppercase;padding:3px 8px;border-radius:6px;border:1px solid;font-weight:500}
.b-long{color:var(--profit);border-color:var(--profit-dim);background:rgba(52,211,153,.07)}
.b-short{color:var(--loss);border-color:var(--loss-dim);background:rgba(255,92,99,.07)}
.b-open{color:var(--blue);border-color:var(--blue-dim);background:rgba(91,163,221,.08)}
.tag{font-size:11px;color:var(--muted);background:var(--surface2);padding:3px 9px;border-radius:6px;border:1px solid var(--line)}
.iconbtn{background:none;border:0;cursor:pointer;color:var(--muted);padding:5px;border-radius:6px;transition:.15s}
.iconbtn:hover{color:var(--text);background:var(--surface2)}.iconbtn.del:hover{color:var(--loss)}
.empty{padding:54px 20px;text-align:center}.empty h3{font-family:'Sora';font-weight:700;font-size:18px;margin:0 0 6px}
.empty p{color:var(--muted);font-size:14px;margin:0 auto 18px;max-width:360px}
.overlay{position:fixed;inset:0;z-index:60;background:rgba(4,7,10,.66);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:28px 16px;overflow-y:auto}
.modal{background:var(--bg2);border:1px solid var(--line2);border-radius:18px;width:100%;max-width:560px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:pop .22s ease}
.modal.wide{max-width:720px}
@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line)}
.modal-head h2{font-family:'Sora';font-weight:700;font-size:18px;margin:0}
.modal-body{padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.modal-body .full{grid-column:1/-1}
.fld label{display:block;font-family:'IBM Plex Mono';font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted2);margin-bottom:7px}
.seg{display:flex;background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:3px}
.seg button{flex:1;border:0;background:none;color:var(--muted);font-weight:600;font-size:13px;padding:8px;border-radius:6px;cursor:pointer;transition:.15s}
.seg button.on-long{background:var(--profit-dim);color:var(--profit)}.seg button.on-short{background:var(--loss-dim);color:var(--loss)}
.modal-foot{padding:16px 22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.live{font-family:'IBM Plex Mono';font-size:12.5px;color:var(--muted);display:flex;gap:16px}
.live b{font-size:15px}
.footer-note{margin-top:34px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.7}
.footer-note code{font-family:'IBM Plex Mono';background:var(--surface);padding:2px 6px;border-radius:5px;color:var(--muted)}
.loading{display:grid;place-items:center;min-height:60vh;color:var(--muted);font-family:'IBM Plex Mono';font-size:13px;letter-spacing:1px}
/* calendar */
.calbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap}
.calbar h2{font-family:'Sora';font-weight:700;font-size:18px;margin:0;text-transform:capitalize}
.calbar .navs{display:flex;gap:6px}
.cal-total{font-family:'IBM Plex Mono';font-size:13px}
.calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal-dow{font-family:'IBM Plex Mono';font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted2);text-align:center;padding:4px 0}
.cal-cell{aspect-ratio:1/1;border:1px solid var(--line);border-radius:10px;padding:7px 8px;display:flex;flex-direction:column;justify-content:space-between;min-height:62px;position:relative;overflow:hidden}
.cal-cell.empty-cell{border-color:transparent;background:none}
.cal-cell.today{outline:1.5px solid var(--blue);outline-offset:-1px}
.cal-day{font-family:'IBM Plex Mono';font-size:11px;color:var(--muted)}
.cal-pnl{font-family:'Sora';font-weight:700;font-size:13px}
.cal-cnt{font-family:'IBM Plex Mono';font-size:9.5px;color:var(--muted2)}
@media(max-width:560px){.cal-cell{min-height:46px;padding:5px}.cal-pnl{font-size:11px}}
.legend{display:flex;gap:14px;justify-content:center;margin-top:16px;font-family:'IBM Plex Mono';font-size:11px;color:var(--muted)}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-2px}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

/* ---------- logo ---------- */
function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 60" fill="none" aria-label="Eric Bottu">
      {/* swoosh */}
      <path d="M4 49 C 16 60 36 57 46 47 S 58 31 60 22" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <circle cx="46.5" cy="46" r="4.4" fill={BLUE} />
      {/* bars */}
      <rect x="9"  y="34" width="7.5" height="15" rx="1.2" fill={BLUE} />
      <rect x="20" y="26" width="7.5" height="23" rx="1.2" fill="currentColor" />
      <rect x="31" y="18" width="7.5" height="31" rx="1.2" fill={BLUE} />
      <rect x="42" y="8"  width="7.5" height="38" rx="1.2" fill="currentColor" />
    </svg>
  );
}

/* ---------- helpers ---------- */
const ASSETS = ["Aandeel", "Crypto", "Forex", "Derivaat", "Index"];
const uid = () => Math.random().toString(36).slice(2, 10);
const num = (v) => {
  if (v == null || v === "") return NaN;
  return parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
};
function tradePnl(t) {
  if (t.exit === "" || t.exit == null || isNaN(t.exit)) return null;
  const g = t.direction === "long" ? (t.exit - t.entry) * t.quantity : (t.entry - t.exit) * t.quantity;
  return g - (Number(t.fees) || 0);
}
function tradeRisk(t) {
  if (t.stop === "" || t.stop == null || isNaN(t.stop)) return null;
  const r = Math.abs(t.entry - t.stop) * t.quantity;
  return r > 0 ? r : null;
}
function tradeR(t) {
  const p = tradePnl(t), risk = tradeRisk(t);
  return p != null && risk ? p / risk : null;
}
const isClosed = (t) => tradePnl(t) !== null;
const pct = (n) => (n * 100).toFixed(1) + "%";
const MONTHS_NL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const DOW_NL = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function seed() {
  const mk = (d, sym, at, dir, e, x, st, q, f, setup) => ({
    id: uid(), symbol: sym, assetType: at, direction: dir,
    entry: e, exit: x, stop: st, quantity: q, fees: f, setup, openedAt: d, closedAt: d, notes: "",
  });
  return [
    mk("2026-04-02", "AAPL", "Aandeel", "long", 168.2, 174.5, 164, 30, 4, "Breakout"),
    mk("2026-04-05", "BTC", "Crypto", "long", 61200, 59800, 59500, 0.15, 6, "Pullback"),
    mk("2026-04-09", "EURUSD", "Forex", "short", 1.092, 1.0855, 1.0955, 50000, 3, "Range"),
    mk("2026-04-14", "NVDA", "Aandeel", "long", 870, 905, 852, 12, 4, "Breakout"),
    mk("2026-04-18", "ETH", "Crypto", "short", 3450, 3520, 3505, 4, 5, "Reversal"),
    mk("2026-04-23", "TSLA", "Aandeel", "long", 168, 159, 162, 25, 4, "Pullback"),
    mk("2026-04-29", "SOL", "Crypto", "long", 142, 168, 134, 30, 4, "Breakout"),
    mk("2026-05-06", "GBPUSD", "Forex", "long", 1.252, 1.261, 1.247, 40000, 3, "Range"),
    mk("2026-05-12", "MSFT", "Aandeel", "long", 412, 408, 405, 18, 4, "Reversal"),
    mk("2026-05-19", "BTC", "Crypto", "long", 64000, 67800, 62500, 0.2, 7, "Breakout"),
    mk("2026-05-21", "ADBE", "Aandeel", "short", 540, 524, 552, 10, 4, "Reversal"),
    { id: uid(), symbol: "AMD", assetType: "Aandeel", direction: "long", entry: 158.4, exit: "", stop: 152,
      quantity: 20, fees: 4, setup: "Pullback", openedAt: "2026-05-28", closedAt: "", notes: "Wacht op uitbraak >165" },
  ];
}

/* ====================================================== */
export default function App() {
  const [trades, setTrades] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [editing, setEditing] = useState(undefined);
  const [importing, setImporting] = useState(false);
  const [filterAsset, setFilterAsset] = useState("Alle");
  const [filterSetup, setFilterSetup] = useState("Alle");
  const [cur, setCur] = useState("$");

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("eb:trades"); setTrades(r && r.value ? JSON.parse(r.value) : seed()); }
      catch { setTrades(seed()); }
      try { const c = await window.storage.get("eb:cur"); if (c && c.value) setCur(c.value); } catch {}
    })();
  }, []);
  useEffect(() => { if (trades != null) window.storage.set("eb:trades", JSON.stringify(trades)).catch(() => {}); }, [trades]);
  useEffect(() => { window.storage.set("eb:cur", cur).catch(() => {}); }, [cur]);

  const money = (n, sign = false) => {
    if (n == null || isNaN(n)) return "—";
    const abs = cur + Math.abs(n).toLocaleString("nl-NL", { maximumFractionDigits: 2 });
    return n < 0 ? "-" + abs : (sign && n > 0 ? "+" : "") + abs;
  };

  const stats = useMemo(() => {
    if (!trades) return null;
    const closed = trades.filter(isClosed).map((t) => ({ ...t, pnl: tradePnl(t), r: tradeR(t) }));
    closed.sort((a, b) => (a.closedAt > b.closedAt ? 1 : -1));
    const wins = closed.filter((t) => t.pnl > 0), losses = closed.filter((t) => t.pnl < 0);
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const net = closed.reduce((s, t) => s + t.pnl, 0);
    const winRate = closed.length ? wins.length / closed.length : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const pf = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const rrPrice = avgLoss ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const expectancy = closed.length ? net / closed.length : 0;
    const best = closed.reduce((m, t) => Math.max(m, t.pnl), 0);
    const worst = closed.reduce((m, t) => Math.min(m, t.pnl), 0);
    const withR = closed.filter((t) => t.r != null);
    const totalR = withR.reduce((s, t) => s + t.r, 0);
    const avgR = withR.length ? totalR / withR.length : null;

    let run = 0;
    const curve = closed.map((t, i) => { run += t.pnl; return { i: i + 1, date: t.closedAt, equity: Math.round(run * 100) / 100, sym: t.symbol }; });

    const wScore = Math.min(winRate / 0.6, 1) * 100;
    const pfScore = pf === Infinity ? 100 : Math.min(Math.max((pf - 1) / 2, 0), 1) * 100;
    const rScore = avgR == null ? Math.min(rrPrice / 2, 1) * 100 : Math.min(Math.max(avgR / 1, 0), 1) * 100;
    let score = closed.length ? Math.round(wScore * 0.3 + pfScore * 0.35 + rScore * 0.35) : 0;
    if (net < 0) score = Math.min(score, 45);

    const bySetup = {};
    closed.forEach((t) => { bySetup[t.setup || "—"] = (bySetup[t.setup || "—"] || 0) + t.pnl; });
    const setupData = Object.entries(bySetup).map(([name, pnl]) => ({ name, pnl: Math.round(pnl * 100) / 100 })).sort((a, b) => b.pnl - a.pnl);

    return { closed, openCount: trades.length - closed.length, net, winRate, pf, rrPrice, avgWin, avgLoss,
      expectancy, best, worst, score, curve, setupData, wins: wins.length, losses: losses.length, totalR, avgR };
  }, [trades]);

  const setups = useMemo(() => ["Alle", ...Array.from(new Set((trades || []).map((t) => t.setup).filter(Boolean)))], [trades]);
  const visibleTrades = useMemo(() => {
    if (!trades) return [];
    return [...trades]
      .filter((t) => filterAsset === "Alle" || t.assetType === filterAsset)
      .filter((t) => filterSetup === "Alle" || t.setup === filterSetup)
      .sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
  }, [trades, filterAsset, filterSetup]);

  const saveTrade = (t) => {
    setTrades((prev) => (t.id && prev.some((p) => p.id === t.id) ? prev.map((p) => (p.id === t.id ? t : p)) : [...prev, { ...t, id: uid() }]));
    setEditing(undefined);
  };
  const removeTrade = (id) => setTrades((prev) => prev.filter((p) => p.id !== id));
  const addMany = (rows) => { setTrades((prev) => [...prev, ...rows]); setImporting(false); };
  const resetAll = () => { if (confirm("Alles wissen en demo-data opnieuw laden?")) setTrades(seed()); };

  if (trades == null) return (<div className="app"><style>{STYLES}</style><div className="loading">trades laden…</div></div>);

  return (
    <div className="app">
      <style>{STYLES}</style>
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <Logo size={34} />
            <div className="brand-txt">Eric Bottu<small>Trading journaal</small></div>
          </div>
          <div className="spacer" />
          <div className="tabs">
            <button className={"tab" + (tab === "dashboard" ? " active" : "")} onClick={() => setTab("dashboard")}>Dashboard</button>
            <button className={"tab" + (tab === "trades" ? " active" : "")} onClick={() => setTab("trades")}>Trades</button>
            <button className={"tab" + (tab === "kalender" ? " active" : "")} onClick={() => setTab("kalender")}>Kalender</button>
          </div>
          <select className="cur-sel" value={cur} onChange={(e) => setCur(e.target.value)} title="Valuta">
            <option value="$">$</option><option value="€">€</option><option value="£">£</option>
          </select>
          <button className="btn btn-accent" onClick={() => setEditing(null)}><PlusIcon /> Trade</button>
        </div>
      </header>

      <main className="wrap">
        {tab === "dashboard" && <Dashboard stats={stats} money={money} cur={cur} onAdd={() => setEditing(null)} />}
        {tab === "trades" && (
          <Trades trades={visibleTrades} money={money}
            filterAsset={filterAsset} setFilterAsset={setFilterAsset}
            filterSetup={filterSetup} setFilterSetup={setFilterSetup} setups={setups}
            onEdit={setEditing} onDelete={removeTrade} onAdd={() => setEditing(null)} onImport={() => setImporting(true)} />
        )}
        {tab === "kalender" && <Calendar trades={trades} money={money} />}

        <div className="footer-note">
          Prototype in de geest van bitease.io · data lokaal bewaard ·{" "}
          <button className="iconbtn" style={{ font: "inherit", color: "var(--blue)" }} onClick={resetAll}>demo resetten</button>
          <br />Logo & naam <code>Eric Bottu</code> · backend met accounts staat in het aparte project.
        </div>
      </main>

      {editing !== undefined && <TradeModal trade={editing} cur={cur} onSave={saveTrade} onClose={() => setEditing(undefined)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onImport={addMany} />}
    </div>
  );
}

/* ================= DASHBOARD ================= */
function Dashboard({ stats, money, cur, onAdd }) {
  if (!stats.closed.length)
    return (<><div className="eyebrow">Overzicht</div>
      <div className="card empty"><h3>Nog geen afgeronde trades</h3>
        <p>Log je eerste trade met entry- én exitprijs. Voeg een stop-loss toe en je krijgt automatisch je R-multiple.</p>
        <button className="btn btn-accent" onClick={onAdd}><PlusIcon /> Voeg je eerste trade toe</button></div></>);

  const tier = stats.score >= 75 ? { t: "Scherp", c: "var(--profit)" }
    : stats.score >= 50 ? { t: "Solide", c: "var(--blue)" }
    : stats.score >= 30 ? { t: "Wisselend", c: "var(--blue)" }
    : { t: "Kwetsbaar", c: "var(--loss)" };

  return (<>
    <div className="eyebrow">Overzicht · {stats.closed.length} afgeronde trades · {stats.openCount} open</div>
    <div className="grid hero">
      <div className="card score-card">
        <div className="label">Trade-score</div>
        <Gauge value={stats.score} />
        <div className="gauge-sub">win ratio · profit factor · R-multiple</div>
        <div className="gauge-tier" style={{ color: tier.c, borderColor: tier.c }}>{tier.t}</div>
      </div>
      <div className="card pnl-card">
        <div className="label">Netto resultaat</div>
        <div className={"pnl-big " + (stats.net >= 0 ? "pos" : "neg")}>{money(stats.net, true)}</div>
        <div className="pnl-row">
          <div className="pnl-mini"><div className="k">Win ratio</div><div className="v">{pct(stats.winRate)}</div></div>
          <div className="pnl-mini"><div className="k">Profit factor</div><div className="v neutral">{stats.pf === Infinity ? "∞" : stats.pf.toFixed(2)}</div></div>
          <div className="pnl-mini"><div className="k">Totaal R</div><div className={"v " + (stats.totalR >= 0 ? "pos" : "neg")}>{stats.totalR >= 0 ? "+" : ""}{stats.totalR.toFixed(1)}R</div></div>
          <div className="pnl-mini"><div className="k">W / L</div><div className="v">{stats.wins}<span style={{ color: "var(--muted2)" }}> / </span>{stats.losses}</div></div>
        </div>
      </div>
    </div>

    <div className="eyebrow">Equity-curve</div>
    <div className="card chart-card">
      <div className="chart-head"><div className="chart-title">Cumulatief resultaat</div>
        <div className="chart-meta">{money(stats.net, true)} over {stats.closed.length} trades</div></div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={stats.curve} margin={{ top: 8, right: 6, left: -6, bottom: 0 }}>
          <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.34} /><stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient></defs>
          <CartesianGrid stroke="#1c2a37" vertical={false} />
          <XAxis dataKey="i" stroke="#566571" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#566571" fontSize={11} tickLine={false} axisLine={false}
            tickFormatter={(v) => cur + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v)} />
          <ReferenceLine y={0} stroke="#32485a" strokeDasharray="3 3" />
          <Tooltip content={<EqTip money={money} />} />
          <Area type="monotone" dataKey="equity" stroke={BLUE} strokeWidth={2.4} fill="url(#eq)" dot={false} activeDot={{ r: 4, fill: BLUE }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div className="eyebrow">Statistieken</div>
    <div className="grid stats">
      <Stat k="Gem. winst" v={money(stats.avgWin)} cls="pos" />
      <Stat k="Gem. verlies" v={money(-stats.avgLoss)} cls="neg" />
      <Stat k="Gem. R" v={stats.avgR == null ? "—" : (stats.avgR >= 0 ? "+" : "") + stats.avgR.toFixed(2) + "R"} cls="neutral" hint="winst in eenheden risico" />
      <Stat k="Profit factor" v={stats.pf === Infinity ? "∞" : stats.pf.toFixed(2)} cls="neutral" hint="bruto winst ÷ verlies" />
      <Stat k="Beste trade" v={money(stats.best, true)} cls="pos" />
      <Stat k="Slechtste trade" v={money(stats.worst, true)} cls="neg" />
      <Stat k="Verwachting" v={money(stats.expectancy, true)} cls={stats.expectancy >= 0 ? "pos" : "neg"} hint="per trade" />
      <Stat k="Win ratio" v={pct(stats.winRate)} hint={`${stats.wins} van ${stats.closed.length}`} />
    </div>

    <div className="eyebrow">Resultaat per setup</div>
    <div className="card chart-card">
      <ResponsiveContainer width="100%" height={Math.max(140, stats.setupData.length * 46)}>
        <BarChart data={stats.setupData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#1c2a37" horizontal={false} />
          <XAxis type="number" stroke="#566571" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => cur + v} />
          <YAxis type="category" dataKey="name" stroke="#9fb3c0" fontSize={12} tickLine={false} axisLine={false} width={78} />
          <ReferenceLine x={0} stroke="#32485a" />
          <Tooltip content={<SetupTip money={money} />} cursor={{ fill: "rgba(255,255,255,.03)" }} />
          <Bar dataKey="pnl" radius={[0, 5, 5, 0]} barSize={20}>
            {stats.setupData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#34D399" : "#FF5C63"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </>);
}

function Stat({ k, v, cls = "", hint }) {
  return (<div className="card stat"><div className="k">{k}</div><div className={"v " + cls}>{v}</div>{hint && <div className="hint">{hint}</div>}</div>);
}
function Gauge({ value }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(id); }, [value]);
  const color = value >= 75 ? "#34D399" : value >= 30 ? BLUE : "#FF5C63";
  return (<div style={{ width: 200, marginTop: 8 }}>
    <svg viewBox="0 0 200 116" width="100%">
      <path d="M 18 100 A 82 82 0 0 1 182 100" fill="none" stroke="#1c2a37" strokeWidth="14" strokeLinecap="round" />
      <path d="M 18 100 A 82 82 0 0 1 182 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        pathLength="100" strokeDasharray="100" strokeDashoffset={100 - v} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }} />
    </svg>
    <div className="gauge-num disp" style={{ color, textAlign: "center" }}>{value}</div>
  </div>);
}
const tipStyle = { background: "#0E141A", border: "1px solid #2C3D4E", borderRadius: 10, padding: "9px 12px", fontFamily: "IBM Plex Mono, monospace", fontSize: 12 };
function EqTip({ active, payload, money }) {
  if (!active || !payload?.length) return null; const d = payload[0].payload;
  return (<div style={tipStyle}><div style={{ color: "#7E909E", fontSize: 11 }}>Trade #{d.i} · {d.sym} · {d.date}</div>
    <div className="disp" style={{ fontWeight: 700, color: d.equity >= 0 ? "#34D399" : "#FF5C63" }}>{money(d.equity, true)}</div></div>);
}
function SetupTip({ active, payload, money }) {
  if (!active || !payload?.length) return null; const d = payload[0].payload;
  return (<div style={tipStyle}><div style={{ color: "#7E909E", fontSize: 11 }}>{d.name}</div>
    <div className="disp" style={{ fontWeight: 700, color: d.pnl >= 0 ? "#34D399" : "#FF5C63" }}>{money(d.pnl, true)}</div></div>);
}

/* ================= TRADES ================= */
function Trades({ trades, money, filterAsset, setFilterAsset, filterSetup, setFilterSetup, setups, onEdit, onDelete, onAdd, onImport }) {
  return (<>
    <div className="eyebrow">Trades · {trades.length}</div>
    <div className="t-tools">
      <select className="select" style={{ width: "auto" }} value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)}>
        {["Alle", ...ASSETS].map((a) => <option key={a}>{a}</option>)}
      </select>
      <select className="select" style={{ width: "auto" }} value={filterSetup} onChange={(e) => setFilterSetup(e.target.value)}>
        {setups.map((s) => <option key={s}>{s}</option>)}
      </select>
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost btn-sm" onClick={onImport}><UploadIcon /> CSV importeren</button>
      <button className="btn btn-accent btn-sm" onClick={onAdd}><PlusIcon /> Nieuwe trade</button>
    </div>
    {trades.length === 0 ? (
      <div className="card empty"><h3>Geen trades gevonden</h3><p>Pas je filters aan, voeg een trade toe of importeer een CSV van je broker.</p></div>
    ) : (
      <div className="card table-card"><div className="tscroll"><table>
        <thead><tr>
          <th>Symbool</th><th>Type</th><th>Richting</th>
          <th className="num">Entry</th><th className="num">Stop</th><th className="num">Exit</th>
          <th className="num">Aantal</th><th className="num">PnL</th><th className="num">R</th>
          <th>Setup</th><th>Datum</th><th></th>
        </tr></thead>
        <tbody>
          {trades.map((t) => {
            const pnl = tradePnl(t), r = tradeR(t), open = pnl === null;
            return (<tr key={t.id}>
              <td className="sym">{t.symbol}</td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{t.assetType}</td>
              <td>{open ? <span className="badge b-open">open</span> : <span className={"badge " + (t.direction === "long" ? "b-long" : "b-short")}>{t.direction}</span>}</td>
              <td className="num">{t.entry}</td>
              <td className="num" style={{ color: "var(--muted)" }}>{t.stop === "" || t.stop == null ? "—" : t.stop}</td>
              <td className="num">{open ? "—" : t.exit}</td>
              <td className="num">{t.quantity}</td>
              <td className={"num " + (open ? "" : pnl >= 0 ? "pos" : "neg")} style={{ fontWeight: 600 }}>{open ? "—" : money(pnl, true)}</td>
              <td className={"num " + (r == null ? "" : r >= 0 ? "pos" : "neg")}>{r == null ? "—" : (r >= 0 ? "+" : "") + r.toFixed(2) + "R"}</td>
              <td><span className="tag">{t.setup || "—"}</span></td>
              <td className="num" style={{ color: "var(--muted)", textAlign: "left" }}>{t.openedAt}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="iconbtn" onClick={() => onEdit(t)} title="Bewerken"><EditIcon /></button>
                <button className="iconbtn del" onClick={() => onDelete(t.id)} title="Verwijderen"><TrashIcon /></button>
              </td>
            </tr>);
          })}
        </tbody>
      </table></div></div>
    )}
  </>);
}

/* ================= KALENDER ================= */
function Calendar({ trades, money }) {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const daily = useMemo(() => {
    const map = {};
    trades.filter(isClosed).forEach((t) => {
      const d = t.closedAt || t.openedAt; if (!d) return;
      map[d] = map[d] || { pnl: 0, n: 0 };
      map[d].pnl += tradePnl(t); map[d].n += 1;
    });
    return map;
  }, [trades]);

  const { y, m } = ym;
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; // ma=0
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const key = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthEntries = Object.entries(daily).filter(([k]) => k.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`));
  const monthTotal = monthEntries.reduce((s, [, v]) => s + v.pnl, 0);
  const maxAbs = Math.max(1, ...monthEntries.map(([, v]) => Math.abs(v.pnl)));
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const step = (dir) => setYm(({ y, m }) => { const n = new Date(y, m + dir, 1); return { y: n.getFullYear(), m: n.getMonth() }; });

  return (<>
    <div className="eyebrow">Kalender</div>
    <div className="card chart-card">
      <div className="calbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2>{MONTHS_NL[m]} {y}</h2>
          <div className="navs">
            <button className="btn btn-ghost btn-sm" onClick={() => step(-1)}>‹</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setYm({ y: today.getFullYear(), m: today.getMonth() })}>vandaag</button>
            <button className="btn btn-ghost btn-sm" onClick={() => step(1)}>›</button>
          </div>
        </div>
        <div className="cal-total">Maand: <b className={monthTotal >= 0 ? "pos" : "neg"} style={{ fontFamily: "Sora" }}>{money(monthTotal, true)}</b>
          <span style={{ color: "var(--muted2)" }}> · {monthEntries.reduce((s, [, v]) => s + v.n, 0)} trades</span></div>
      </div>
      <div className="calgrid">{DOW_NL.map((d) => <div key={d} className="cal-dow">{d}</div>)}</div>
      <div className="calgrid" style={{ marginTop: 6 }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} className="cal-cell empty-cell" />;
          const k = key(d), cell = daily[k];
          let bg = "transparent", border = "var(--line)";
          if (cell) {
            const a = 0.12 + 0.45 * (Math.abs(cell.pnl) / maxAbs);
            bg = cell.pnl >= 0 ? `rgba(52,211,153,${a})` : `rgba(255,92,99,${a})`;
            border = cell.pnl >= 0 ? "rgba(52,211,153,.45)" : "rgba(255,92,99,.45)";
          }
          return (<div key={i} className={"cal-cell" + (k === todayKey ? " today" : "")} style={{ background: bg, borderColor: border }}>
            <div className="cal-day">{d}</div>
            {cell && (<div>
              <div className="cal-pnl" style={{ color: cell.pnl >= 0 ? "#bff3df" : "#ffc9cc" }}>{money(cell.pnl, true)}</div>
              <div className="cal-cnt">{cell.n} {cell.n === 1 ? "trade" : "trades"}</div>
            </div>)}
          </div>);
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: "rgba(52,211,153,.5)" }} />winstdag</span>
        <span><i style={{ background: "rgba(255,92,99,.5)" }} />verliesdag</span>
        <span><i style={{ background: "transparent", border: "1.5px solid var(--blue)" }} />vandaag</span>
      </div>
    </div>
  </>);
}

/* ================= TRADE MODAL ================= */
function TradeModal({ trade, cur, onSave, onClose }) {
  const blank = { symbol: "", assetType: "Aandeel", direction: "long", entry: "", exit: "", stop: "",
    quantity: "", fees: "0", setup: "", openedAt: new Date().toISOString().slice(0, 10), closedAt: "", notes: "" };
  const [f, setF] = useState(trade ? { ...trade } : blank);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const nf = { ...f, entry: num(f.entry), exit: f.exit === "" ? "" : num(f.exit), stop: f.stop === "" ? "" : num(f.stop), quantity: num(f.quantity), fees: num(f.fees) || 0 };
  const pnl = tradePnl(nf), risk = tradeRisk(nf), r = tradeR(nf);
  const valid = f.symbol.trim() && !isNaN(nf.entry) && !isNaN(nf.quantity);

  const submit = () => {
    if (!valid) return;
    onSave({ ...f, symbol: f.symbol.trim().toUpperCase(), entry: nf.entry, quantity: nf.quantity, fees: nf.fees,
      exit: f.exit === "" ? "" : nf.exit, stop: f.stop === "" ? "" : nf.stop, setup: f.setup.trim(),
      closedAt: f.exit === "" ? "" : (f.closedAt || f.openedAt) });
  };
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  return (<div className="overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head"><h2>{trade ? "Trade bewerken" : "Nieuwe trade"}</h2><button className="iconbtn" onClick={onClose}><CloseIcon /></button></div>
      <div className="modal-body">
        <div className="fld"><label>Symbool</label><input className="input mono" placeholder="bv. AAPL" value={f.symbol} onChange={set("symbol")} autoFocus /></div>
        <div className="fld"><label>Type</label><select className="select" value={f.assetType} onChange={set("assetType")}>{ASSETS.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="fld full"><label>Richting</label><div className="seg">
          <button className={f.direction === "long" ? "on-long" : ""} onClick={() => setF((p) => ({ ...p, direction: "long" }))}>Long</button>
          <button className={f.direction === "short" ? "on-short" : ""} onClick={() => setF((p) => ({ ...p, direction: "short" }))}>Short</button>
        </div></div>
        <div className="fld"><label>Entry-prijs</label><input className="input mono" type="number" step="any" placeholder="0.00" value={f.entry} onChange={set("entry")} /></div>
        <div className="fld"><label>Stop-loss <span style={{ color: "var(--muted2)" }}>(optie)</span></label><input className="input mono" type="number" step="any" placeholder="—" value={f.stop} onChange={set("stop")} /></div>
        <div className="fld"><label>Exit-prijs <span style={{ color: "var(--muted2)" }}>(leeg = open)</span></label><input className="input mono" type="number" step="any" placeholder="—" value={f.exit} onChange={set("exit")} /></div>
        <div className="fld"><label>Aantal</label><input className="input mono" type="number" step="any" placeholder="0" value={f.quantity} onChange={set("quantity")} /></div>
        <div className="fld"><label>Kosten / fees</label><input className="input mono" type="number" step="any" placeholder="0" value={f.fees} onChange={set("fees")} /></div>
        <div className="fld"><label>Setup / strategie</label><input className="input" placeholder="bv. Breakout" value={f.setup} onChange={set("setup")} /></div>
        <div className="fld full"><label>Datum</label><input className="input mono" type="date" value={f.openedAt} onChange={set("openedAt")} /></div>
        <div className="fld full"><label>Notities</label><textarea className="textarea" rows={2} placeholder="Wat ging goed / fout?" value={f.notes} onChange={set("notes")} /></div>
      </div>
      <div className="modal-foot">
        <div className="live">
          {risk != null && <span>Risico: <b className="neutral">{cur + risk.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</b></span>}
          {pnl != null ? <span>PnL: <b className={pnl >= 0 ? "pos" : "neg"}>{(pnl >= 0 ? "+" : "-") + cur + Math.abs(pnl).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</b></span>
            : <span style={{ color: "var(--muted2)" }}>Open positie</span>}
          {r != null && <span>R: <b className={r >= 0 ? "pos" : "neg"}>{(r >= 0 ? "+" : "") + r.toFixed(2)}R</b></span>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuleren</button>
          <button className="btn btn-accent" onClick={submit} disabled={!valid} style={{ opacity: valid ? 1 : 0.45 }}>{trade ? "Opslaan" : "Toevoegen"}</button>
        </div>
      </div>
    </div>
  </div>);
}

/* ================= CSV IMPORT ================= */
const FIELD_DEFS = [
  { key: "symbol", label: "Symbool", aliases: ["symbol", "ticker", "instrument", "asset", "symbool", "pair", "market", "product"] },
  { key: "direction", label: "Richting", aliases: ["direction", "side", "richting", "position", "l/s", "buy/sell", "type", "action"] },
  { key: "entry", label: "Entry-prijs", aliases: ["entry", "entryprice", "entry price", "open", "openprice", "open price", "buy", "instap", "price"] },
  { key: "exit", label: "Exit-prijs", aliases: ["exit", "exitprice", "exit price", "close", "closeprice", "close price", "sell", "uitstap"] },
  { key: "stop", label: "Stop-loss", aliases: ["stop", "stoploss", "stop loss", "sl", "stop-loss"] },
  { key: "quantity", label: "Aantal", aliases: ["quantity", "qty", "size", "amount", "aantal", "volume", "contracts", "shares", "units"] },
  { key: "fees", label: "Fees", aliases: ["fees", "fee", "commission", "cost", "kosten", "commissie"] },
  { key: "setup", label: "Setup", aliases: ["setup", "strategy", "strategie", "tag", "note", "notes"] },
  { key: "assetType", label: "Type", aliases: ["assettype", "asset type", "class", "category", "markt"] },
  { key: "date", label: "Datum", aliases: ["date", "opened", "open date", "datum", "time", "opened at", "entry date", "closed", "close date"] },
];

function guessMap(cols) {
  const map = {};
  FIELD_DEFS.forEach((fd) => {
    const hit = cols.find((c) => fd.aliases.includes(c.trim().toLowerCase()));
    map[fd.key] = hit || "";
  });
  return map;
}
function parseDir(v) {
  const s = String(v || "").toLowerCase();
  if (/short|sell|verkoop|sl\b/.test(s)) return "short";
  return "long";
}
function parseAsset(v) {
  const s = String(v || "").toLowerCase();
  const hit = ASSETS.find((a) => s.includes(a.toLowerCase().slice(0, 4)));
  if (/crypto|btc|eth|coin/.test(s)) return "Crypto";
  if (/forex|fx|usd|eur/.test(s)) return "Forex";
  return hit || "Aandeel";
}

function ImportModal({ onClose, onImport }) {
  const [rows, setRows] = useState(null);
  const [cols, setCols] = useState([]);
  const [map, setMap] = useState({});
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setErr("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        if (!res.data?.length) { setErr("Geen rijen gevonden in dit bestand."); return; }
        const c = res.meta.fields || Object.keys(res.data[0]);
        setCols(c); setMap(guessMap(c)); setRows(res.data);
      },
      error: () => setErr("Kon dit bestand niet lezen. Is het een geldige CSV?"),
    });
  };

  const preview = useMemo(() => {
    if (!rows) return [];
    return rows.map((row) => {
      const g = (k) => (map[k] ? row[map[k]] : "");
      const entry = num(g("entry")), qty = num(g("quantity"));
      const exitRaw = g("exit"), stopRaw = g("stop");
      return {
        symbol: String(g("symbol") || "").trim().toUpperCase(),
        assetType: parseAsset(g("assetType") || g("symbol")),
        direction: parseDir(g("direction")),
        entry, quantity: qty,
        exit: exitRaw === "" || exitRaw == null ? "" : num(exitRaw),
        stop: stopRaw === "" || stopRaw == null ? "" : num(stopRaw),
        fees: num(g("fees")) || 0,
        setup: String(g("setup") || "").trim(),
        date: String(g("date") || "").trim(),
      };
    });
  }, [rows, map]);

  const valid = preview.filter((p) => p.symbol && !isNaN(p.entry) && !isNaN(p.quantity));

  const doImport = () => {
    const out = valid.map((p) => {
      let d = p.date;
      const m = d.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || d.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (m) d = m[1].length === 4 ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      else d = new Date().toISOString().slice(0, 10);
      return { id: uid(), symbol: p.symbol, assetType: p.assetType, direction: p.direction,
        entry: p.entry, exit: p.exit, stop: p.stop, quantity: p.quantity, fees: p.fees,
        setup: p.setup, openedAt: d, closedAt: p.exit === "" ? "" : d, notes: "" };
    });
    onImport(out);
  };

  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  return (<div className="overlay" onClick={onClose}>
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head"><h2>CSV importeren</h2><button className="iconbtn" onClick={onClose}><CloseIcon /></button></div>

      {!rows ? (
        <div style={{ padding: 30, textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 420, margin: "0 auto 20px" }}>
            Exporteer je trades als CSV bij je broker en kies het bestand. Kolommen worden automatisch herkend; daarna kun je ze nalopen.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: "none" }} />
          <button className="btn btn-accent" onClick={() => fileRef.current?.click()}><UploadIcon /> Kies CSV-bestand</button>
          {err && <div style={{ color: "var(--loss)", marginTop: 16, fontSize: 13 }}>{err}</div>}
        </div>
      ) : (<>
        <div style={{ padding: "20px 22px", maxHeight: "52vh", overflowY: "auto" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            <b style={{ color: "var(--text)" }}>{rows.length}</b> rijen gelezen · koppel je kolommen:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {FIELD_DEFS.map((fd) => (
              <div className="fld" key={fd.key}>
                <label>{fd.label}{["symbol", "entry", "quantity"].includes(fd.key) && <span style={{ color: "var(--loss)" }}> *</span>}</label>
                <select className="select" value={map[fd.key] || ""} onChange={(e) => setMap((m) => ({ ...m, [fd.key]: e.target.value }))}>
                  <option value="">— niet koppelen —</option>
                  {cols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <div className="live"><span><b className={valid.length ? "pos" : "neg"}>{valid.length}</b> van {rows.length} rijen klaar voor import</span></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setRows(null)}>Ander bestand</button>
            <button className="btn btn-accent" onClick={doImport} disabled={!valid.length} style={{ opacity: valid.length ? 1 : 0.45 }}>Importeer {valid.length} trades</button>
          </div>
        </div>
      </>)}
    </div>
  </div>);
}

/* ================= icons ================= */
const PlusIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>);
const EditIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
const TrashIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>);
const UploadIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>);
