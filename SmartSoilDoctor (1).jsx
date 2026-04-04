import { useState, useEffect, useRef } from "react";

const theme = {
  bg: "#0a0f0a",
  surface: "#111811",
  surfaceAlt: "#161e16",
  border: "#1e2e1e",
  accent: "#4ade80",
  accentDim: "#22c55e",
  accentGlow: "rgba(74,222,128,0.15)",
  warn: "#facc15",
  danger: "#f87171",
  text: "#e2f0e2",
  textMuted: "#6b8f6b",
  textDim: "#3d5c3d",
};

const CROPS = ["Buğda", "Pambıq", "Üzüm", "Kartof", "Pomidor"];
const REGIONS = ["Kür-Araz Ovalığı", "Mil Düzü", "Muğan", "Şirvan", "Lənkəran"];

function useSensorData() {
  const [data, setData] = useState({
    moisture: 38,
    temperature: 24.3,
    ph: 6.8,
    salinity: 1.2,
    nitrogen: 42,
    score: 61,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        moisture: Math.max(10, Math.min(90, prev.moisture + (Math.random() - 0.48) * 2)),
        temperature: Math.max(12, Math.min(40, prev.temperature + (Math.random() - 0.5) * 0.4)),
        ph: Math.max(5.5, Math.min(8.5, prev.ph + (Math.random() - 0.5) * 0.05)),
        salinity: Math.max(0.1, Math.min(5, prev.salinity + (Math.random() - 0.45) * 0.05)),
        nitrogen: Math.max(10, Math.min(90, prev.nitrogen + (Math.random() - 0.48) * 1.5)),
        score: Math.max(20, Math.min(95, prev.score + (Math.random() - 0.45) * 1.2)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

function useForecast() {
  const generateForecast = (startScore, startMoisture, startSalinity) => {
    const withSSD = [];
    const withoutSSD = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      withSSD.push({
        day: i,
        score: Math.max(55, startScore + 10 * Math.sin(t * Math.PI * 0.7) - t * 3 + (Math.random() - 0.5) * 2),
        moisture: Math.max(35, startMoisture + 8 * Math.sin(t * Math.PI) - t * 2 + (Math.random() - 0.5) * 3),
        salinity: Math.max(0.8, startSalinity - t * 0.3 + (Math.random() - 0.5) * 0.05),
      });
      withoutSSD.push({
        day: i,
        score: Math.max(15, startScore - t * 28 - (Math.random() * 3)),
        moisture: Math.max(8, startMoisture - t * 22 - (Math.random() * 4)),
        salinity: Math.min(6, startSalinity + t * 2.1 + (Math.random() * 0.2)),
      });
    }
    return { withSSD, withoutSSD };
  };

  const [forecast, setForecast] = useState(() => generateForecast(61, 38, 1.2));
  return forecast;
}

function RadialGauge({ value, min, max, label, unit, color, danger, warn }) {
  const pct = (value - min) / (max - min);
  const angle = pct * 240 - 120;
  const r = 38;
  const cx = 50, cy = 54;
  const arcStart = polarToXY(cx, cy, r, -120);
  const arcEnd = polarToXY(cx, cy, r, 120);
  const valEnd = polarToXY(cx, cy, r, -120 + pct * 240);

  function polarToXY(cx, cy, r, deg) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const trackPath = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 1 1 ${arcEnd.x} ${arcEnd.y}`;
  const valuePath = pct > 0
    ? `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${valEnd.x} ${valEnd.y}`
    : "";

  const statusColor = danger && value >= danger ? theme.danger
    : warn && value >= warn ? theme.warn
    : color;

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 100 80" style={{ width: "100%", maxWidth: 120 }}>
        <path d={trackPath} fill="none" stroke={theme.border} strokeWidth="6" strokeLinecap="round" />
        {valuePath && (
          <path d={valuePath} fill="none" stroke={statusColor} strokeWidth="6" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${statusColor})` }} />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={statusColor}
          style={{ fontSize: 14, fontFamily: "monospace", fontWeight: "bold" }}>
          {typeof value === "number" ? value.toFixed(1) : value}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={theme.textMuted}
          style={{ fontSize: 7, fontFamily: "monospace" }}>
          {unit}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: -4, fontFamily: "monospace", letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const pct = score / 100;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = score >= 70 ? theme.accent : score >= 45 ? theme.warn : theme.danger;
  const label = score >= 70 ? "YAXŞI" : score >= 45 ? "ORTA" : "KRİTİK";

  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
      <svg viewBox="0 0 130 130" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke={theme.border} strokeWidth="10" />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", textAlign: "center"
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "monospace", lineHeight: 1 }}>
          {Math.round(score)}
        </div>
        <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: 2, fontFamily: "monospace" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data, color, height = 50 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      <polyline points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#grad-${color.replace("#", "")})`} stroke="none" opacity="0.15" />
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ForecastChart({ withSSD, withoutSSD, metric, label, yMin, yMax }) {
  const w = 400, h = 120;
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const toXY = (day, val) => ({
    x: pad.l + (day / 30) * iw,
    y: pad.t + ih - ((val - yMin) / (yMax - yMin)) * ih,
  });

  const pathFor = (arr) =>
    arr.map((d, i) => {
      const { x, y } = toXY(d.day, d[metric]);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");

  const days = [0, 7, 14, 21, 30];
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
        {days.map((d) => {
          const x = pad.l + (d / 30) * iw;
          return (
            <g key={d}>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + ih} stroke={theme.border} strokeWidth="0.5" />
              <text x={x} y={h - 8} textAnchor="middle" fill={theme.textMuted} style={{ fontSize: 8, fontFamily: "monospace" }}>
                {d === 0 ? "Bu gün" : `+${d}g`}
              </text>
            </g>
          );
        })}
        {yTicks.map((v) => {
          const y = pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
          return (
            <g key={v}>
              <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y} stroke={theme.border} strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} textAnchor="end" fill={theme.textMuted} style={{ fontSize: 7, fontFamily: "monospace" }}>
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {/* Without SSD - danger */}
        <path d={pathFor(withoutSSD)} fill="none" stroke={theme.danger} strokeWidth="1.5"
          strokeDasharray="4,3" opacity="0.7" />
        {/* With SSD - accent */}
        <path d={pathFor(withSSD)} fill="none" stroke={theme.accent} strokeWidth="2.5"
          style={{ filter: `drop-shadow(0 0 4px ${theme.accent})` }} />
        {/* Today marker */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ih} stroke={theme.accentDim} strokeWidth="1" />
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 10, fontFamily: "monospace", color: theme.textMuted, marginTop: 4 }}>
        <span style={{ color: theme.accent }}>━━ Smart Soil Doctor ilə</span>
        <span style={{ color: theme.danger }}>╌╌ Müdaxilə olmadan</span>
      </div>
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 100,
      background: `${color}22`, border: `1px solid ${color}55`,
      color, fontSize: 10, fontFamily: "monospace", letterSpacing: 1
    }}>{label}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 12, padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: "monospace", letterSpacing: 3,
      color: theme.accentDim, marginBottom: 14, textTransform: "uppercase",
      display: "flex", alignItems: "center", gap: 8
    }}>
      <div style={{ width: 16, height: 1, background: theme.accentDim }} />
      {children}
    </div>
  );
}

export default function App() {
  const sensor = useSensorData();
  const forecast = useForecast();
  const [crop, setCrop] = useState(CROPS[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [irrigating, setIrrigating] = useState(false);
  const [log, setLog] = useState([
    { time: "08:14", msg: "Suvarma 22 dəqiqə icra edildi", type: "ok" },
    { time: "06:30", msg: "Gündəlik analiz tamamlandı", type: "info" },
    { time: "23:51", msg: "Duz səviyyəsi yüksəlir — diqqət", type: "warn" },
  ]);
  const [history, setHistory] = useState({
    moisture: Array.from({ length: 20 }, (_, i) => 38 + Math.sin(i * 0.5) * 8 + Math.random() * 3),
    score: Array.from({ length: 20 }, (_, i) => 61 + Math.sin(i * 0.4) * 6 + Math.random() * 2),
  });

  useEffect(() => {
    setHistory((h) => ({
      moisture: [...h.moisture.slice(-19), sensor.moisture],
      score: [...h.score.slice(-19), sensor.score],
    }));
  }, [sensor.moisture]);

  const handleIrrigate = () => {
    if (irrigating) return;
    setIrrigating(true);
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLog((l) => [{ time, msg: "Manuel suvarma başladıldı — 20 dəq.", type: "ok" }, ...l.slice(0, 8)]);
    setTimeout(() => {
      setIrrigating(false);
      const now2 = new Date();
      const t2 = `${now2.getHours().toString().padStart(2, "0")}:${now2.getMinutes().toString().padStart(2, "0")}`;
      setLog((l) => [{ time: t2, msg: "Suvarma tamamlandı ✓", type: "ok" }, ...l.slice(0, 8)]);
    }, 4000);
  };

  const prescription = sensor.score >= 70
    ? `Torpaq vəziyyəti yaxşıdır. Bu gün ${Math.round(10 + (80 - sensor.moisture) * 0.4)} litr su tövsiyə olunur.`
    : sensor.score >= 45
    ? `Nəmlik aşağıdır. Dərhal ${Math.round(15 + (70 - sensor.moisture) * 0.6)} litr su tətbiq edin. Gübrəni 20% azaldın.`
    : `KRİTİK: Duz həddini aşır! Zəif minerallaşmış su ilə yuyulma aparın. Suvarmanı dayandırın.`;

  const scoreColor = sensor.score >= 70 ? theme.accent : sensor.score >= 45 ? theme.warn : theme.danger;

  const selectStyle = {
    background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
    borderRadius: 8, color: theme.text, padding: "6px 10px",
    fontSize: 12, fontFamily: "monospace", outline: "none", cursor: "pointer"
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, color: theme.text,
      fontFamily: "'Courier New', monospace", padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${theme.border}`,
        padding: "16px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `linear-gradient(to right, ${theme.surface}, ${theme.bg})`,
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 0 16px ${theme.accentGlow}`
          }}>🌱</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, color: theme.accent }}>
              SMART SOIL DOCTOR
            </div>
            <div style={{ fontSize: 9, color: theme.textMuted, letterSpacing: 3 }}>
              AZƏRBAYCAN · TORPAQ İNTELLEKT SİSTEMİ
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="● CANLI" color={theme.accent} />
          <select value={region} onChange={(e) => setRegion(e.target.value)} style={selectStyle}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} style={selectStyle}>
            {CROPS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* Top row: Score + Prescription + Irrigate */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 16, marginBottom: 16 }}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <SectionTitle>Torpaq Skoru</SectionTitle>
            <ScoreRing score={sensor.score} />
            <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
              {region}<br />{crop}
            </div>
          </Card>

          <Card>
            <SectionTitle>Günlük Resept</SectionTitle>
            <div style={{
              fontSize: 14, lineHeight: 1.8, color: theme.text,
              background: `${scoreColor}11`, border: `1px solid ${scoreColor}33`,
              borderLeft: `3px solid ${scoreColor}`,
              borderRadius: 8, padding: "12px 16px",
              marginBottom: 14
            }}>
              {prescription}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label={`NƏMLİK ${sensor.moisture.toFixed(0)}%`}
                color={sensor.moisture < 30 ? theme.danger : sensor.moisture < 50 ? theme.warn : theme.accent} />
              <Pill label={`DUZ ${sensor.salinity.toFixed(2)} dS/m`}
                color={sensor.salinity > 3 ? theme.danger : sensor.salinity > 1.5 ? theme.warn : theme.accent} />
              <Pill label={`pH ${sensor.ph.toFixed(1)}`}
                color={sensor.ph < 6 || sensor.ph > 7.5 ? theme.warn : theme.accent} />
            </div>
          </Card>

          <Card style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", minWidth: 160 }}>
            <SectionTitle>Suvarma</SectionTitle>
            <button onClick={handleIrrigate} disabled={irrigating} style={{
              background: irrigating ? `${theme.warn}22` : `${theme.accent}22`,
              border: `1px solid ${irrigating ? theme.warn : theme.accent}`,
              borderRadius: 10, padding: "14px 10px", cursor: irrigating ? "not-allowed" : "pointer",
              color: irrigating ? theme.warn : theme.accent,
              fontSize: 11, fontFamily: "monospace", letterSpacing: 1,
              transition: "all 0.3s",
              boxShadow: irrigating ? `0 0 12px ${theme.warn}44` : `0 0 12px ${theme.accentGlow}`,
            }}>
              {irrigating ? "⟳ İŞLƏYİR..." : "▶ SU VER"}
            </button>
            <div style={{
              fontSize: 9, color: theme.textMuted, textAlign: "center", lineHeight: 1.6
            }}>
              Vanası: {irrigating ? <span style={{ color: theme.warn }}>AÇIQ</span> : <span style={{ color: theme.textDim }}>BAĞLI</span>}<br />
              WiFi: <span style={{ color: theme.accent }}>BAĞLI</span><br />
              Offline: <span style={{ color: theme.accent }}>AKTİV</span>
            </div>
          </Card>
        </div>

        {/* Sensor gauges */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Real Vaxt Sensor Oxunuşu</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            <RadialGauge value={sensor.moisture} min={0} max={100} label="NƏMLİK" unit="%"
              color={theme.accent} warn={30} danger={15} />
            <RadialGauge value={sensor.temperature} min={0} max={50} label="TEMPERATUR" unit="°C"
              color="#60a5fa" warn={35} danger={42} />
            <RadialGauge value={sensor.ph} min={4} max={9} label="pH" unit="pH"
              color={theme.warn} />
            <RadialGauge value={sensor.salinity} min={0} max={6} label="DUZLULUQ" unit="dS/m"
              color={theme.accent} warn={1.5} danger={3} />
            <RadialGauge value={sensor.nitrogen} min={0} max={100} label="AZOT" unit="mg/kg"
              color="#a78bfa" warn={25} />
          </div>
        </Card>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Card>
            <SectionTitle>Nəmlik Tarixi (Son 20 ölçüm)</SectionTitle>
            <MiniChart data={history.moisture} color={theme.accent} height={70} />
            <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 6, fontFamily: "monospace" }}>
              Min: {Math.min(...history.moisture).toFixed(1)}% · Maks: {Math.max(...history.moisture).toFixed(1)}%
            </div>
          </Card>
          <Card>
            <SectionTitle>Torpaq Skoru Tarixi</SectionTitle>
            <MiniChart data={history.score} color={scoreColor} height={70} />
            <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 6, fontFamily: "monospace" }}>
              Ortalama: {(history.score.reduce((a, b) => a + b, 0) / history.score.length).toFixed(1)}/100
            </div>
          </Card>
        </div>

        {/* 30-day forecast */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>30 Günlük Proqnoz — AI Modeli</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontFamily: "monospace" }}>
                TORPAQ SKORU (0–100)
              </div>
              <ForecastChart withSSD={forecast.withSSD} withoutSSD={forecast.withoutSSD}
                metric="score" label="Skoru" yMin={10} yMax={95} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontFamily: "monospace" }}>
                DUZLULUQ (dS/m)
              </div>
              <ForecastChart withSSD={forecast.withSSD} withoutSSD={forecast.withoutSSD}
                metric="salinity" label="Duzluluq" yMin={0} yMax={6} />
            </div>
          </div>
          <div style={{
            marginTop: 16, padding: "10px 14px",
            background: `${theme.accent}11`, border: `1px solid ${theme.accent}33`,
            borderRadius: 8, fontSize: 11, color: theme.textMuted, lineHeight: 1.7
          }}>
            <span style={{ color: theme.accent }}>AI proqnozu:</span> Cari vəziyyətdə müdaxilə olmasa,
            torpaq skoru 30 gün ərzində <span style={{ color: theme.danger }}>kritik həddə (~22/100)</span> düşəcək.
            Smart Soil Doctor avtomatik suvarma protokolu ilə skoru{" "}
            <span style={{ color: theme.accent }}>65+ saxlaya bilər</span> və duzluluq artımını 3x yavaşlada bilər.
          </div>
        </Card>

        {/* Log */}
        <Card>
          <SectionTitle>Sistem Jurnal</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "6px 10px", borderRadius: 6,
                background: entry.type === "warn" ? `${theme.warn}0a`
                  : entry.type === "ok" ? `${theme.accent}0a` : theme.surfaceAlt,
                borderLeft: `2px solid ${entry.type === "warn" ? theme.warn
                  : entry.type === "ok" ? theme.accent : theme.border}`,
                fontSize: 11, fontFamily: "monospace"
              }}>
                <span style={{ color: theme.textMuted, minWidth: 40 }}>{entry.time}</span>
                <span style={{
                  color: entry.type === "warn" ? theme.warn
                    : entry.type === "ok" ? theme.accent : theme.textMuted
                }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div style={{
          marginTop: 28, textAlign: "center", fontSize: 9,
          color: theme.textDim, fontFamily: "monospace", letterSpacing: 2, lineHeight: 2
        }}>
          SMART SOIL DOCTOR · GreenTech III · Azərbaycan Texnologiya Universiteti 2026<br />
          TinyML Edge AI · Offline-First · Kür-Araz Torpaq Modeli
        </div>
      </div>
    </div>
  );
}
