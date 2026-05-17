import { useEffect, useState, useRef } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Legend,
} from "recharts";
import { ShieldAlert, Activity, Database, Wifi, WifiOff, AlertTriangle, MapPin } from "lucide-react";

// ── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "https://gnn-api-t7k7.onrender.com";
const POLL_MS  = 2000;

// ── Attack colours ────────────────────────────────────────────────────────────
const ATTACK_COLORS = {
  ddos:            "#ef4444",
  xss:             "#f97316",
  password:        "#3b82f6",
  "sql injection": "#a855f7",
  "port scan":     "#eab308",
  "brute force":   "#ec4899",
  mitm:            "#06b6d4",
  other:           "#6b7280",
};
function getAttackColor(label = "") {
  return ATTACK_COLORS[label.toLowerCase()] || ATTACK_COLORS.other;
}
function isAttack(pred) {
  return pred.toLowerCase() !== "benign";
}
function isPrivateIP(ip = "") {
  return ip.startsWith("192.168.") || ip.startsWith("10.") || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip === "127.0.0.1";
}

// ── Geo cache ─────────────────────────────────────────────────────────────────
const geoCache = {};
async function geolocateIP(ip) {
  if (!ip || isPrivateIP(ip)) return null;
  if (geoCache[ip]) return geoCache[ip];
  try {
    const res  = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    if (data.latitude && data.longitude) {
      const r = { ip, lat: data.latitude, lng: data.longitude, city: data.city || "Unknown", country: data.country_name || "Unknown", org: data.org || "" };
      geoCache[ip] = r;
      return r;
    }
  } catch {}
  return null;
}

// ── Leaflet Map ───────────────────────────────────────────────────────────────
function ThreatMap({ geoPoints }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const loadedRef    = useRef(false);

  // Load Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link");
      link.id     = "leaflet-css";
      link.rel    = "stylesheet";
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Init map once container is mounted
  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;

    function initMap() {
      if (loadedRef.current || !containerRef.current) return;
      loadedRef.current = true;

      const L   = window.L;
      const map = L.map(containerRef.current, {
        center: [20, 10], zoom: 2, minZoom: 1,
        zoomControl: true, attributionControl: false,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    if (window.L) {
      initMap();
    } else {
      const script    = document.createElement("script");
      script.src      = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload   = initMap;
      script.onerror  = () => console.error("Leaflet failed to load");
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; loadedRef.current = false; }
    };
  }, []);

  // Update markers
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    geoPoints.forEach(pt => {
      const color = getAttackColor(pt.attackType);
      const icon  = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:28px;height:28px;">
          <div style="position:absolute;top:6px;left:6px;width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color};"></div>
          <div style="position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:ripple 1.8s ease-out infinite;"></div>
          <div style="position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;border:2px solid ${color};opacity:0.25;animation:ripple 1.8s ease-out 0.6s infinite;"></div>
        </div>`,
        iconSize: [28, 28], iconAnchor: [14, 14],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:monospace;font-size:12px;min-width:170px;">
            <div style="font-weight:800;color:${color};margin-bottom:6px;font-size:13px;">${pt.attackType.toUpperCase()}</div>
            <div style="color:#94a3b8;margin-bottom:2px;">IP: <span style="color:#e2e8f0">${pt.ip}</span></div>
            <div style="color:#94a3b8;margin-bottom:2px;">City: <span style="color:#e2e8f0">${pt.city}</span></div>
            <div style="color:#94a3b8;margin-bottom:2px;">Country: <span style="color:#e2e8f0">${pt.country}</span></div>
            <div style="color:#94a3b8;margin-bottom:2px;">Org: <span style="color:#e2e8f0">${pt.org || "—"}</span></div>
            <div style="color:#94a3b8;">Hits: <span style="color:#ef4444;font-weight:700">${pt.count}</span></div>
          </div>`);

      markersRef.current.push(marker);
    });
  }, [geoPoints]);

  return (
    <>
      <style>{`
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(3);opacity:0} }
        .leaflet-popup-content-wrapper { background:#1e293b!important;border:1px solid #334155!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,0.5)!important; }
        .leaflet-popup-content { color:#e2e8f0!important;margin:12px 14px!important; }
        .leaflet-popup-tip { background:#1e293b!important; }
        .leaflet-popup-close-button { color:#64748b!important;font-size:16px!important; }
        .leaflet-control-zoom a { background:#1e293b!important;color:#e2e8f0!important;border-color:#334155!important; }
        .leaflet-control-zoom a:hover { background:#334155!important; }
      `}</style>
      <div ref={containerRef} style={{ width:"100%", height:"100%", borderRadius:14 }} />
    </>
  );
}

// ── UI components ─────────────────────────────────────────────────────────────
function Card({ title, value, icon, color, subtitle }) {
  return (
    <div style={{ background:"linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))", padding:24, borderRadius:20, border:`1px solid ${color}30`, boxShadow:`0 0 40px ${color}15,inset 0 1px 0 rgba(255,255,255,0.05)`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-30,right:-30,width:100,height:100,background:`${color}25`,borderRadius:"50%",filter:"blur(30px)" }} />
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
        <div style={{ background:`${color}20`,padding:10,borderRadius:12,color }}>{icon}</div>
        <span style={{ fontWeight:600,fontSize:14,color:"#94a3b8" }}>{title}</span>
      </div>
      <div style={{ fontSize:48,fontWeight:800,color:"white",lineHeight:1,fontVariantNumeric:"tabular-nums" }}>
        {typeof value==="number"?value.toLocaleString():value}
      </div>
      {subtitle && <p style={{ color:"#475569",marginTop:8,fontSize:12 }}>{subtitle}</p>}
    </div>
  );
}

function ThreatBadge({ label }) {
  const color = getAttackColor(label);
  return (
    <span style={{ background:`${color}20`,color,border:`1px solid ${color}40`,padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function SeverityBar({ attackRate }) {
  const pct   = Math.min(100, Math.round(attackRate));
  const color = pct>70?"#ef4444":pct>40?"#f97316":pct>10?"#eab308":"#22c55e";
  const label = pct>70?"CRITICAL":pct>40?"HIGH":pct>10?"MEDIUM":"LOW";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
      <div style={{ flex:1,height:6,background:"#1e293b",borderRadius:3,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.5s" }} />
      </div>
      <span style={{ fontSize:11,fontWeight:700,color,minWidth:80 }}>{label} {pct}%</span>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active||!payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"10px 14px",fontSize:13 }}>
      <div style={{ color:getAttackColor(name),fontWeight:700,marginBottom:2 }}>{name.toUpperCase()}</div>
      <div style={{ color:"#e2e8f0" }}>{value} flows</div>
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"10px 14px",fontSize:12 }}>
      <div style={{ color:"#64748b",marginBottom:6 }}>Event #{label}</div>
      {payload.map(p => <div key={p.dataKey} style={{ color:p.color,marginBottom:2 }}>{p.dataKey}: <strong>{p.value}</strong></div>)}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [logs,      setLogs]      = useState([]);
  const [status,    setStatus]    = useState("idle");
  const [polling,   setPolling]   = useState(false);
  const [newAlert,  setNewAlert]  = useState(null);
  const [geoPoints, setGeoPoints] = useState([]);
  const [geoStatus, setGeoStatus] = useState("idle");
  const prevCountRef = useRef(0);

  const fetchLogs = async () => {
    try {
      const res  = await fetch(`${API_BASE}/logs?limit=100`);
      const data = await res.json();
      setLogs(data);
      setStatus("connected");
      if (data.length > prevCountRef.current) {
        const preds = data[0]?.response?.predictions || [];
        const hit   = preds.find(isAttack);
        if (hit) { setNewAlert({ type:hit, time:new Date().toLocaleTimeString() }); setTimeout(()=>setNewAlert(null),4000); }
      }
      prevCountRef.current = data.length;
    } catch { setStatus("error"); }
  };

  useEffect(() => {
    if (!polling) return;
    fetchLogs();
    const iv = setInterval(fetchLogs, POLL_MS);
    return () => clearInterval(iv);
  }, [polling]);

  // Geolocate attacker IPs
  useEffect(() => {
    if (!logs.length) return;
    const ipMap = {};
    logs.forEach(log => {
      (log.response?.predictions || []).forEach((p, i) => {
        if (!isAttack(p)) return;
        const ip = log.request?.[i]?.src_ip || log.request?.[0]?.src_ip;
        if (!ip || isPrivateIP(ip)) return;
        if (!ipMap[ip]) ipMap[ip] = { attackType: p, count: 0 };
        ipMap[ip].count++;
      });
    });
    const uniqueIPs = Object.entries(ipMap);
    if (!uniqueIPs.length) return;
    setGeoStatus("loading");
    Promise.allSettled(
      uniqueIPs.map(async ([ip, meta]) => {
        const geo = await geolocateIP(ip);
        return geo ? { ...geo, ...meta } : null;
      })
    ).then(results => {
      const pts = results.filter(r=>r.status==="fulfilled"&&r.value).map(r=>r.value);
      setGeoPoints(pts);
      setGeoStatus("done");
    });
  }, [logs]);

  // Derived metrics
  const totalFlows  = logs.reduce((a,l)=>a+(l.response?.num_flows||0),0);
  const attackTypeCounts = {};
  let totalAttacks = 0;
  logs.forEach(log=>{
    (log.response?.predictions||[]).forEach(p=>{
      if(!isAttack(p))return;
      totalAttacks++;
      const k=p.toLowerCase();
      attackTypeCounts[k]=(attackTypeCounts[k]||0)+1;
    });
  });
  const attackRate = totalFlows>0?(totalAttacks/totalFlows)*100:0;
  const pieData    = Object.entries(attackTypeCounts).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  const allAttackTypes = [...new Set(logs.flatMap(l=>(l.response?.predictions||[]).filter(isAttack).map(p=>p.toLowerCase())))];
  const lineData   = logs.slice(0,30).reverse().map((log,i)=>{
    const byType={};
    (log.response?.predictions||[]).forEach(p=>{ if(!isAttack(p))return; const k=p.toLowerCase(); byType[k]=(byType[k]||0)+1; });
    return {name:i+1,...byType};
  });
  const ipCounts={};
  logs.forEach(log=>{ if(!(log.response?.predictions||[]).some(isAttack))return; const ip=log.request?.[0]?.src_ip; if(ip)ipCounts[ip]=(ipCounts[ip]||0)+1; });
  const topIPs = Object.entries(ipCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div style={{ background:"#020817",minHeight:"100vh",color:"white",padding:"24px 28px",fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#0f172a;}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{box-shadow:0 0 0 0 #ef444440}50%{box-shadow:0 0 0 8px #ef444400}}
      `}</style>

      <div style={{ maxWidth:1280,margin:"0 auto" }}>

        {/* Alert */}
        {newAlert && (
          <div style={{ background:"linear-gradient(90deg,#7f1d1d,#991b1b)",border:"1px solid #ef444460",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10,animation:"slideDown 0.3s ease" }}>
            <AlertTriangle size={18} color="#fca5a5"/>
            <span style={{ color:"#fca5a5",fontWeight:600 }}>NEW THREAT — <ThreatBadge label={newAlert.type}/> at {newAlert.time}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:status==="connected"?"#22c55e":"#475569",animation:polling?"blink 1.5s infinite":"none" }}/>
              <h1 style={{ fontSize:28,fontWeight:800,margin:0,background:"linear-gradient(135deg,#e2e8f0,#94a3b8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
                GNN Intrusion Detection System
              </h1>
            </div>
            <p style={{ color:"#475569",margin:0,fontSize:14 }}>AI-powered real-time network threat analysis · geotracking enabled</p>
          </div>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:99,background:status==="connected"?"#14532d30":"#1e293b",border:`1px solid ${status==="connected"?"#22c55e40":"#334155"}`,fontSize:13,fontWeight:600,color:status==="connected"?"#86efac":status==="error"?"#fca5a5":"#475569" }}>
              {status==="connected"?<Wifi size={14}/>:<WifiOff size={14}/>}
              {status==="connected"?"Live":status==="error"?"Error":"Offline"}
            </div>
            <button onClick={()=>setPolling(p=>!p)} style={{ padding:"10px 22px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:polling?"linear-gradient(135deg,#7f1d1d,#991b1b)":"linear-gradient(135deg,#1d4ed8,#2563eb)",color:"white",boxShadow:polling?"0 0 20px #ef444430":"0 0 20px #3b82f630",transition:"all 0.2s" }}>
              {polling?"Stop Polling":"Start Polling"}
            </button>
          </div>
        </div>

        {/* Endpoint bar */}
        <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:14,padding:"14px 20px",marginBottom:24,display:"flex",gap:24,flexWrap:"wrap",alignItems:"center" }}>
          <span style={{ fontSize:11,color:"#22c55e",fontWeight:700,fontFamily:"monospace" }}>GET</span>
          <code style={{ fontSize:12,color:"#38bdf8",fontFamily:"monospace" }}>{API_BASE}/logs</code>
          <span style={{ fontSize:11,color:"#f97316",fontWeight:700,fontFamily:"monospace" }}>POST</span>
          <code style={{ fontSize:12,color:"#a3e635",fontFamily:"monospace" }}>{API_BASE}/predict</code>
          <span style={{ marginLeft:"auto",fontSize:11,color:"#334155" }}>polling every {POLL_MS/1000}s</span>
        </div>

        {/* Metrics */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:24 }}>
          <Card title="Total Flows" value={totalFlows} icon={<Database size={18}/>} color="#3b82f6" subtitle="All flows processed by GNN"/>
          <Card title="Attacks Detected" value={totalAttacks} icon={<ShieldAlert size={18}/>} color="#ef4444" subtitle={`${attackRate.toFixed(1)}% of total flows`}/>
          <Card title="Attack Types" value={pieData.length} icon={<AlertTriangle size={18}/>} color="#f97316" subtitle="Distinct threat categories"/>
          <Card title="Geolocated IPs" value={geoPoints.length} icon={<MapPin size={18}/>} color="#a855f7" subtitle={geoStatus==="loading"?"Resolving…":"Attacker locations mapped"}/>
        </div>

        {/* Severity */}
        <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:14,padding:"16px 20px",marginBottom:24 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:13,fontWeight:600,color:"#94a3b8" }}>THREAT SEVERITY LEVEL</span>
            <span style={{ fontSize:12,color:"#475569" }}>{totalAttacks} attacks / {totalFlows} flows</span>
          </div>
          <SeverityBar attackRate={attackRate}/>
        </div>

        {/* ── GLOBAL THREAT MAP ── */}
        <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px",marginBottom:24 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <MapPin size={16} color="#a855f7"/>
              <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Global Threat Map</h3>
              {geoStatus==="loading"&&<span style={{ fontSize:11,color:"#eab308",background:"#eab30815",padding:"2px 10px",borderRadius:99,border:"1px solid #eab30830" }}>Resolving IPs…</span>}
              {geoStatus==="done"&&geoPoints.length>0&&<span style={{ fontSize:11,color:"#22c55e",background:"#22c55e15",padding:"2px 10px",borderRadius:99,border:"1px solid #22c55e30" }}>{geoPoints.length} attackers mapped</span>}
              {geoPoints.length===0&&polling&&geoStatus!=="loading"&&<span style={{ fontSize:11,color:"#475569" }}>Waiting for public IPs — private IPs (192.168.x, 10.x) cannot be geolocated</span>}
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {Object.entries(ATTACK_COLORS).filter(([k])=>k!=="other").map(([k,c])=>(
                <span key={k} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#94a3b8" }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:c,display:"inline-block",boxShadow:`0 0 6px ${c}` }}/>
                  {k.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          {/* Map always renders */}
          <div style={{ height:440,borderRadius:14,overflow:"hidden",position:"relative" }}>
            <ThreatMap geoPoints={geoPoints}/>
            {geoPoints.length===0&&(
              <div style={{ position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,pointerEvents:"none",zIndex:1000 }}>
                <div style={{ background:"rgba(2,8,23,0.75)",backdropFilter:"blur(4px)",border:"1px solid #1e293b",borderRadius:12,padding:"16px 24px",textAlign:"center" }}>
                  <MapPin size={24} color="#334155" style={{ marginBottom:8 }}/>
                  <p style={{ color:"#475569",fontSize:13,margin:0 }}>
                    {!polling?"Start polling to enable geotracking":"No public IPs yet — private IPs can't be geolocated"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24 }}>
          <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px" }}>
            <h3 style={{ margin:"0 0 18px",fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Attack Flows Over Time</h3>
            {lineData.length===0
              ?<div style={{ height:260,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:13 }}>No attack data yet</div>
              :<ResponsiveContainer width="100%" height={260}>
                <AreaChart data={lineData}>
                  <defs>{allAttackTypes.map(t=>(<linearGradient key={t} id={`g-${t}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={getAttackColor(t)} stopOpacity={0.3}/><stop offset="95%" stopColor={getAttackColor(t)} stopOpacity={0}/></linearGradient>))}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="name" tick={{ fontSize:10,fill:"#475569" }}/>
                  <YAxis tick={{ fontSize:10,fill:"#475569" }} allowDecimals={false}/>
                  <Tooltip content={<LineTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:12,color:"#94a3b8" }}/>
                  {allAttackTypes.map(t=>(<Area key={t} type="monotone" dataKey={t} stroke={getAttackColor(t)} strokeWidth={2} fill={`url(#g-${t})`}/>))}
                </AreaChart>
              </ResponsiveContainer>
            }
          </div>

          <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px" }}>
            <h3 style={{ margin:"0 0 18px",fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Attack Type Distribution</h3>
            {pieData.length===0
              ?<div style={{ height:260,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:13 }}>No attacks detected yet</div>
              :<div style={{ display:"flex",alignItems:"center",gap:16 }}>
                <ResponsiveContainer width="55%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={105} paddingAngle={3} label={false}>
                      {pieData.map((e,i)=><Cell key={i} fill={getAttackColor(e.name)} stroke="transparent"/>)}
                    </Pie>
                    <Tooltip content={<PieTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
                  {pieData.map(({name,value})=>{
                    const color=getAttackColor(name);
                    const pct=totalAttacks>0?((value/totalAttacks)*100).toFixed(1):0;
                    return (
                      <div key={name}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                          <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#cbd5e1" }}>
                            <span style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block" }}/>{name.toUpperCase()}
                          </span>
                          <span style={{ fontSize:12,fontWeight:700,color }}>{pct}%</span>
                        </div>
                        <div style={{ height:4,background:"#1e293b",borderRadius:2 }}>
                          <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.5s" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            }
          </div>
        </div>

        {/* Top IPs */}
        {topIPs.length>0&&(
          <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px",marginBottom:24 }}>
            <h3 style={{ margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Top Attacker IPs</h3>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {topIPs.map(([ip,count],i)=>{
                const pct=(count/topIPs[0][1])*100;
                const geo=geoCache[ip];
                return (
                  <div key={ip} style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <span style={{ fontSize:12,color:"#475569",width:18,textAlign:"right" }}>#{i+1}</span>
                    <span style={{ fontFamily:"monospace",fontSize:13,color:"#e2e8f0",width:130 }}>{ip}</span>
                    <span style={{ fontSize:11,color:"#64748b",width:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {geo?`📍 ${geo.city}, ${geo.country}`:"Private / Unresolved"}
                    </span>
                    <div style={{ flex:1,height:6,background:"#1e293b",borderRadius:3 }}>
                      <div style={{ width:`${pct}%`,height:"100%",background:"#ef4444",borderRadius:3,transition:"width 0.5s" }}/>
                    </div>
                    <span style={{ fontSize:12,fontWeight:700,color:"#ef4444",width:32,textAlign:"right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Events table */}
        <div style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Live Threat Events</h3>
            <span style={{ fontSize:12,color:"#475569" }}>{logs.length} events captured</span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1e293b" }}>
                  {["Time","Source IP","Location","Dst IP","Proto","Prediction","Bytes","Packets"].map(h=>(
                    <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length===0?(
                  <tr><td colSpan={8} style={{ padding:"40px",textAlign:"center",color:"#334155",fontSize:13 }}>
                    {polling?"Waiting for events… POST to /predict":"Start polling to see live events"}
                  </td></tr>
                ):logs.map((log,i)=>{
                  const req=log.request?.[0]||{};
                  const pred=log.response?.predictions?.[0]||"unknown";
                  const attack=isAttack(pred);
                  const geo=geoCache[req.src_ip];
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #0a1120",background:attack?"rgba(239,68,68,0.04)":"transparent" }}>
                      <td style={{ padding:"10px 14px",fontSize:12,color:"#64748b",fontFamily:"monospace",whiteSpace:"nowrap" }}>{new Date(log.timestamp*1000).toLocaleTimeString()}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,fontFamily:"monospace",color:attack?"#fca5a5":"#94a3b8" }}>{req.src_ip||"—"}</td>
                      <td style={{ padding:"10px 14px",fontSize:11,color:"#64748b",whiteSpace:"nowrap" }}>{geo?`📍 ${geo.city}, ${geo.country}`:<span style={{ color:"#334155" }}>Private IP</span>}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,fontFamily:"monospace",color:"#64748b" }}>{req.dst_ip||"—"}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:"#64748b",textTransform:"uppercase" }}>{req.proto||"—"}</td>
                      <td style={{ padding:"10px 14px" }}><ThreatBadge label={pred}/></td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:"#64748b",fontFamily:"monospace" }}>{((req.src_bytes||0)+(req.dst_bytes||0)).toLocaleString()}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:"#64748b",fontFamily:"monospace" }}>{(req.src_pkts||0)+(req.dst_pkts||0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}