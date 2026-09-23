"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  PansDocument,
  RagQueryResponse,
  VesselDetail,
  VesselEvent,
  VesselTrack,
  filterMatches,
  riskBand,
} from "./contracts";
import { MapPanel } from "./MapPanel";

type ReplayState = {
  scenario: string;
  status: string;
  trackCount: number;
  eventCount: number;
  zones: string[];
  fusion?: {
    radarActive: boolean;
    aisActive: boolean;
    eoSlewToCue: boolean;
    sarSatellite: boolean;
  };
};

type AnalyticsSummary = {
  trackId: string;
  name: string;
  distanceNm: number;
  avgSpeedKnots: number;
  turnDegrees: number;
};

const apiBase = "/msas/api/v1";

async function fetchEnvelope<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith("/api/v1") ? path.replace("/api/v1", "") : path;
  const staticPath = cleanPath.endsWith(".json") ? cleanPath : `${cleanPath}.json`;
  const res = await fetch(`${apiBase}${staticPath}`);
  const data = await res.json();
  return data as T;
}

function Crest() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#7ce0d3" strokeWidth="1"/>
      <circle cx="20" cy="20" r="14" fill="none" stroke="#3a8a80" strokeWidth="0.6"/>
      <path d="M20 6 L23 14 L32 14 L25 19 L28 28 L20 22 L12 28 L15 19 L8 14 L17 14 Z"
            fill="none" stroke="#7ce0d3" strokeWidth="0.9"/>
      <path d="M8 28 Q20 33 32 28" stroke="#7ce0d3" strokeWidth="0.8" fill="none"/>
      <text x="20" y="37" textAnchor="middle" fontSize="4" fill="#7ce0d3"
            fontFamily="JetBrains Mono, monospace" letterSpacing="0.3">ICG</text>
    </svg>
  );
}

export function ConsoleClient() {
  const [vessels, setVessels] = useState<VesselTrack[]>([]);
  const [events, setEvents] = useState<VesselEvent[]>([]);
  const [replayState, setReplayState] = useState<ReplayState | null>(null);
  const [, setAnalytics] = useState<AnalyticsSummary[]>([]);
  const [, setPansDocuments] = useState<PansDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VesselDetail | null>(null);
  const [search] = useState("");
  const [zone, setZone] = useState("All");
  const [minRisk, setMinRisk] = useState(0);
  const [ragQuery, setRagQuery] = useState("");
  const [ragResponse, setRagResponse] = useState<RagQueryResponse | null>(null);
  const [isRagPending] = useState(false);
  const [activeMod, setMod] = useState("WATCHKEEPER");
  const [feedModality, setFeedModality] = useState("EO");

  useEffect(() => {
    async function loadInitial() {
      const [vesselData, eventData, replayData, analyticsData, pansData] = await Promise.all([
        fetchEnvelope<VesselTrack[]>("/api/v1/vessels"),
        fetchEnvelope<VesselEvent[]>("/api/v1/events"),
        fetchEnvelope<ReplayState>("/api/v1/replay/state"),
        fetchEnvelope<AnalyticsSummary[]>("/api/v1/analytics/summary"),
        fetchEnvelope<PansDocument[]>("/api/v1/pans/documents"),
      ]);
      setVessels(vesselData);
      setEvents(eventData);
      setReplayState(replayData);
      setAnalytics(analyticsData);
      setPansDocuments(pansData);
      setSelectedId(vesselData[0]?.id ?? null);
    }
    void loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    async function loadDetail() {
      // fetchEnvelope will prepend /api/v1 and append .json
      const vesselDetail = await fetchEnvelope<VesselDetail>(`/vessels/${selectedId}`);
      setDetail(vesselDetail);
      setRagResponse(null);
    }
    void loadDetail();
  }, [selectedId]);

  const filteredVessels = useMemo(() => {
    return vessels
      .filter((vessel) => filterMatches(vessel, search))
      .filter((vessel) => (zone === "All" ? true : vessel.zone === zone))
      .filter((vessel) => vessel.riskScore >= minRisk);
  }, [vessels, search, zone, minRisk]);

  const activeVessel = detail?.vessel ?? filteredVessels.find(v => v.id === selectedId) ?? filteredVessels[0] ?? null;
  const activeDossier = detail?.dossier ?? null;
  const activePansRecords = activeDossier?.pansRecords ?? [];

  async function onRagSubmit(e: FormEvent, documentId: string) {
    e.preventDefault();
    setRagResponse({
      documentId,
      query: ragQuery,
      answer: "AI Intelligence Query is currently in 'Offline Demo' mode. In a live deployment, this would utilize the Agentic RAG engine to query the PANS documentation for this specific vessel.",
      evidence: []
    });
  }

  const vhfMock = [
    { t: "14:42:18", ch: "16", station: "RS OKHA", lang: "GU", speaker: "VRZR8", raw: "કોઈ ટ્રાફિક નથી, આગળ વધો", en: "No traffic visible, proceeding on course.", entities: ["TRAFFIC","PROCEED"], risk: "low" },
    { t: "14:41:02", ch: "16", station: "RS PORBANDAR", lang: "HI", speaker: "UNK", raw: "ठीक है, रात को मिलते हैं, लाइट बंद रखो", en: "OK — meet at night, keep lights off.", entities: ["NIGHT_RENDEZVOUS","LIGHTS_OFF"], risk: "high" },
    { t: "14:39:44", ch: "06", station: "RS VERAVAL", lang: "MR", speaker: "VT-XRA", raw: "इंजिन मध्ये problem आहे, थांबायला लागेल", en: "Engine has a problem — will need to stop.", entities: ["ENGINE_FAULT"], risk: "low" },
    { t: "14:37:11", ch: "16", station: "RS DWARKA", lang: "UR", speaker: "UNK", raw: "کارگو تیار ہے، پوزیشن پہ آؤ", en: "Cargo is ready, come to the position.", entities: ["CARGO_READY","RENDEZVOUS"], risk: "high" },
    { t: "14:34:50", ch: "16", station: "RS MUMBAI-N", lang: "EN", speaker: "VTXE7", raw: "Mumbai Port Control, ARABIAN DAWN requesting pilot ETA 1620", en: "Mumbai Port Control, ARABIAN DAWN requesting pilot ETA 1620.", entities: ["PILOT_REQUEST","ETA"], risk: "low" },
    { t: "14:31:09", ch: "06", station: "RS JAKHAU", lang: "SD", speaker: "UNK", raw: "سامان لاઓ، جلદી કરો", en: "Bring the goods, hurry.", entities: ["GOODS","URGENT"], risk: "medium" },
    { t: "14:28:44", ch: "16", station: "RS OKHA", lang: "EN", speaker: "IN-CG-V3", raw: "Unknown contact at 22.4N 68.2E, identify yourself on Channel 16", en: "Unknown contact at 22.4N 68.2E, identify yourself on Channel 16", entities: ["CHALLENGE","UNKNOWN_CONTACT"], risk: "medium" },
    { t: "14:25:12", ch: "16", station: "RS RATNAGIRI", lang: "MR", speaker: "RT-77", raw: "समुद्र शांत आहे, मासेमारी सुरू आहे", en: "Sea is calm, fishing in progress.", entities: ["FISHING","CALM_SEA"], risk: "low" },
  ];

  const mods = ["WATCHKEEPER","TARGET PROFILE","FEEDS","VHF INTEL","ANALYTICS","RAG / PANS","ADMIN"];

  return (
    <div className="msas-shell">
      <div className="classbar">
        {"◼ UNCLASSIFIED // FOR OFFICIAL USE ONLY // ICG-CSN ◼ HANDLE VIA SECURE CHANNELS"}
      </div>
      
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-crest"><Crest/></div>
          <div className="brand-txt">
            <div className="t1">M · S · A · S</div>
            <div className="t2">INDIAN COAST GUARD · CSN</div>
          </div>
        </div>
        <div className="navmod">
          {mods.map(m => (
            <button key={m} className={m===activeMod?'active':''} onClick={()=>setMod(m)}>{m}</button>
          ))}
        </div>
        <div className="statuscluster">
          <div className="stat"><div className="k">DTG</div><div className="v mono">{new Date().toISOString().slice(0,13).replace(/-/g,'')}Z</div></div>
          <div className="stat"><div className="k">CONDITION</div><div className="v mono amber"><span className="dot amber"/>WATCH-II</div></div>
          <div className="stat"><div className="k">ALERTS</div><div className="v mono red">{events.filter(e => e.severity === 'critical').length.toString().padStart(2, '0')} CRIT · {events.filter(e => e.severity === 'high').length.toString().padStart(2, '0')} WARN</div></div>
          <div className="stat"><div className="k">FUSION</div><div className="v mono phos">ACTIVE</div></div>
        </div>
      </div>

      {activeMod === "WATCHKEEPER" ? (
        <div className="main">
            {/* LEFT PANEL: VOI QUEUE */}
            <div className="panel">
            <div className="panel-header">
                <div className="ph-l"><span className="corner">▣</span>VOI QUEUE · RISK-RANKED</div>
                <div className="ph-r">{filteredVessels.length}/{vessels.length}</div>
            </div>
            <div className="voi-filter">
                <button className={zone==='All'?'active':''} onClick={()=>setZone('All')}>ALL</button>
                <button className={minRisk>=70?'active':''} onClick={()=>setMinRisk(70)}>CRIT</button>
                <button className={minRisk>=40 && minRisk<70?'active':''} onClick={()=>setMinRisk(40)}>WARN</button>
            </div>
            <div className="panel-body">
                {filteredVessels.map(v => {
                const rb = riskBand(v.riskScore);
                const rc = rb === 'critical' ? 'crit' : rb === 'high' ? 'warn' : 'norm';
                return (
                    <button key={v.id} className={'voi-item'+(v.id===selectedId?' selected':'')} onClick={()=>setSelectedId(v.id)}>
                    <div className="voi-row1">
                        <span className={`voi-risk mono ${rc}`}>{v.riskScore}</span>
                        <span className="voi-id">{v.id}</span>
                        <span className="voi-flag mono">{v.flag}</span>
                    </div>
                    <div className="voi-name">{v.name}</div>
                    <div className="voi-act">{v.type} · {v.status}</div>
                    <div className="voi-chips">
                        {v.suspicionFactors.slice(0,2).map(sf => (
                        <span key={sf} className={`chip ${rc==='crit'?'red':'amber'}`}>{sf}</span>
                        ))}
                    </div>
                    </button>
                );
                })}
            </div>
            </div>

            {/* CENTER PANEL: MAP */}
            <div className="map-stage" data-screen-label="Watchkeeper Console">
            <div className="map-chrome-top">
                <span className="mc-label">AOR · ARABIAN SEA / NW COAST</span>
                <span className="mc-sep"/>
                <span className="mc-label" style={{color:'var(--phos)'}}>{replayState?.scenario ?? "SCANNING SECTOR"}</span>
            </div>
            
            <MapPanel vessels={filteredVessels} selectedId={selectedId} detail={detail} onSelect={setSelectedId} />

            <div className="map-chrome-bottom">
                <div className="group">
                <span><span className="k">LAT</span><span className="v">{activeVessel?.lastPosition.lat.toFixed(3)}°N</span></span>
                <span><span className="k">LON</span><span className="v">{activeVessel?.lastPosition.lon.toFixed(3)}°E</span></span>
                <span><span className="k">SPD</span><span className="v">{activeVessel?.speedKnots} KN</span></span>
                </div>
                <div className="group">
                <span><span className="k">TRACKS</span><span className="v">{vessels.length}</span></span>
                <span><span className="k">REFRESH</span><span className="v">1.5s</span></span>
                </div>
            </div>
            </div>

            {/* RIGHT PANEL: DOSSIER */}
            <div className="panel last">
            <div className="panel-header">
                <div className="ph-l"><span className="corner">◈</span>VESSEL DOSSIER</div>
                <div className="ph-r mono">{activeVessel?.id}</div>
            </div>
            <div className="panel-body">
                {activeVessel && (
                <>
                    <div className="dossier-head">
                    <div className="name">{activeVessel.name}</div>
                    <div className="sub">{activeVessel.type} · FLAG {activeVessel.flag} · IMO {activeVessel.imo}</div>
                    <div className="risk-gauge">
                        <div className={`risk-num mono ${riskBand(activeVessel.riskScore)==='critical'?'crit':riskBand(activeVessel.riskScore)==='high'?'warn':'norm'}`}>{activeVessel.riskScore}</div>
                        <div style={{flex:1}}>
                        <div className="risk-bar"><div className="needle" style={{left:`${activeVessel.riskScore}%`}}/></div>
                        <div className="risk-label">DYNAMIC RISK SCORE · XAI-WEIGHTED</div>
                        </div>
                    </div>
                    </div>

                    {/* EO/SAR Visualization */}
                    <div className="eo-wrap">
                    <div className="eo-img" style={{ 
                        backgroundImage: `url(/msas/inference/sar/sar_000.jpg)`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(1.2) contrast(1.4) grayscale(1)'
                    }}/>
                    <div className="eo-horizon"/>
                    <div className="eo-bbox" style={{ left: '20%', top: '25%', width: '60%', height: '50%' }}>
                        <div className="eo-bbox-lbl mono">SAR TARGET · 0.94 CONF</div>
                    </div>
                    <svg className="eo-reticle" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="28" fill="none" stroke="#7ce0d3" strokeWidth="0.6" opacity="0.5"/>
                        <line x1="30" y1="6" x2="30" y2="18" stroke="#7ce0d3" strokeWidth="1"/>
                        <line x1="30" y1="42" x2="30" y2="54" stroke="#7ce0d3" strokeWidth="1"/>
                        <line x1="6" y1="30" x2="18" y2="30" stroke="#7ce0d3" strokeWidth="1"/>
                        <line x1="42" y1="30" x2="54" y2="30" stroke="#7ce0d3" strokeWidth="1"/>
                        <circle cx="30" cy="30" r="1.5" fill="#7ce0d3"/>
                    </svg>
                    <div className="eo-scan"/>
                    <div className="eo-overlay-tl mono">EO-07 / RS MUMBAI<br/>PTZ [SLEWED]<br/>ZOOM ×28</div>
                    <div className="eo-overlay-tr mono">{activeVessel.id}<br/>SPD {activeVessel.speedKnots}KN<br/>HDG {activeVessel.courseDegrees}°</div>
                    </div>

                    <div className="ds-section">
                    <div className="ds-title">AI/ML ANOMALIES</div>
                    <div className="anomaly-list">
                        {activeVessel.suspicionFactors.map(sf => (
                        <div key={sf} className={'anomaly '+(riskBand(activeVessel.riskScore)==='critical'?'':'warn')}>
                            <div className="code">{sf.replace(" ", "_").toUpperCase()}</div>
                            <div className="txt">{sf} confirmed by Multi-modal Fusion Engine</div>
                        </div>
                        ))}
                        {activeVessel.suspicionFactors.length === 0 && (
                            <div style={{fontSize:11, color:'var(--ink-3)'}}>No active behavioral anomalies detected.</div>
                        )}
                    </div>
                    </div>

                    <div className="ds-section">
                    <div className="ds-title">PANS · RAG INTELLIGENCE</div>
                    {activePansRecords.length > 0 ? (
                        activePansRecords.map(record => (
                        <div key={record.id} style={{marginBottom: 12}}>
                            <div style={{fontSize:11, color:'var(--phos)', marginBottom: 4}}>{record.sourceName}</div>
                            <form onSubmit={(e) => onRagSubmit(e, record.id)} style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
                            <input 
                                type="text" 
                                placeholder="Query document..." 
                                value={ragQuery} 
                                onChange={e => setRagQuery(e.target.value)}
                                style={{ flex: 1, padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "4px", color: "#fff", fontSize: 11 }}
                            />
                            <button type="submit" disabled={isRagPending} style={{ background: "var(--phos-weak)", border: "1px solid var(--phos-dim)", color: "var(--phos)", padding: "2px 8px", borderRadius: "4px", fontSize: 10 }}>
                                {isRagPending ? "..." : "ASK"}
                            </button>
                            </form>
                            {ragResponse && ragResponse.documentId === record.id && (
                            <div style={{fontSize:11, color:'var(--ink-1)', lineHeight:1.4, padding: 8, background: 'rgba(124,224,211,0.05)', borderLeft: '2px solid var(--phos)'}}>
                                {ragResponse.answer}
                            </div>
                            )}
                        </div>
                        ))
                    ) : (
                        <div style={{fontSize:11, color:'var(--ink-3)'}}>No PANS records linked.</div>
                    )}
                    </div>
                </>
                )}
            </div>
            </div>
        </div>
      ) : activeMod === "TARGET PROFILE" ? (
        <div className="main main-split">
            <div className="panel">
                <div className="panel-header">
                    <div className="ph-l"><span className="corner">▣</span>TARGET SELECTION</div>
                </div>
                <div className="panel-body">
                    {filteredVessels.map(v => (
                        <button key={v.id} className={'voi-item'+(v.id===selectedId?' selected':'')} onClick={()=>setSelectedId(v.id)}>
                            <div className="voi-row1">
                                <span className={`voi-risk mono ${riskBand(v.riskScore)==='critical'?'crit':'warn'}`}>{v.riskScore}</span>
                                <span className="voi-name">{v.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="panel last" style={{borderLeft: "1px solid var(--line-2)"}}>
                <div className="panel-header">
                    <div className="ph-l"><span className="corner">◈</span>MULTI-SENSOR DRILL-DOWN: {activeVessel?.name}</div>
                    <div className="ph-r mono">{activeVessel?.id}</div>
                </div>
                <div className="panel-body" style={{padding: "16px", overflow: "auto"}}>
                    <div className="fluid-grid">
                        {/* AIS & RADAR FUSION — FULL SCALE VISUAL */}
                        <div className="panel" style={{padding: "20px", background: "var(--bg-2)", border: "1px solid var(--line-3)"}}>
                            <div className="ds-title">MULTI-SENSOR TACTICAL SCOPE · AI-FUSED KINEMATICS</div>
                            
                            <div className="fluid-grid" style={{ alignItems: "center" }}>
                                {/* Immersive Radar Scope */}
                                <div style={{ 
                                    aspectRatio: "1 / 1",
                                    width: "100%",
                                    maxWidth: "380px",
                                    background: "radial-gradient(circle, #0a1816 0%, #05080a 100%)", 
                                    borderRadius: "12px", 
                                    border: "2px solid var(--line-1)", 
                                    position: "relative", 
                                    overflow: "hidden", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    boxShadow: "inset 0 0 40px rgba(124, 224, 211, 0.05)",
                                    margin: "0 auto"
                                }}>
                                    {/* Grid Pattern */}
                                    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--line-1) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.3 }} />
                                    
                                    <svg width="280" height="280" viewBox="0 0 200 200" style={{ filter: "drop-shadow(0 0 5px rgba(124, 224, 211, 0.2))" }}>
                                        {/* Radar Rings */}
                                        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--line-3)" strokeWidth="0.5" strokeDasharray="4 4" />
                                        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--line-3)" strokeWidth="0.5" />
                                        <circle cx="100" cy="100" r="30" fill="none" stroke="var(--line-3)" strokeWidth="0.5" />
                                        
                                        {/* Scanning Beam */}
                                        <g className="blink" style={{ animationDuration: "3s" }}>
                                            <line x1="100" y1="100" x2="100" y2="10" stroke="var(--phos)" strokeWidth="1" opacity="0.3" />
                                        </g>

                                        {/* Target Plot */}
                                        <g transform="translate(130, 80)">
                                            {/* Proximity Safety Zone */}
                                            <circle r="25" fill="rgba(255, 74, 61, 0.05)" stroke="var(--red)" strokeWidth="0.5" strokeDasharray="2 2" />
                                            
                                            {/* Trajectory Prediction */}
                                            <line x1="0" y1="0" x2={Math.sin((activeVessel?.courseDegrees || 0)*Math.PI/180)*50} y2={-Math.cos((activeVessel?.courseDegrees || 0)*Math.PI/180)*50} stroke="var(--amber)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                                            
                                            {/* Heading Vector */}
                                            <g transform={`rotate(${activeVessel?.courseDegrees || 0})`}>
                                                <line x1="0" y1="0" x2="0" y2="-30" stroke="var(--phos)" strokeWidth="2" />
                                                <polygon points="-4,-25 0,-35 4,-25" fill="var(--phos)" />
                                            </g>

                                            {/* Target Bracket */}
                                            <path d="M-12,-12 L-12,-18 L-4,-18 M4,-18 L12,-18 L12,-12 M12,12 L12,18 L4,18 M-4,18 L-12,18 L-12,12" fill="none" stroke="var(--phos)" strokeWidth="1" />
                                            
                                            <text x="16" y="-12" fontSize="7" fontFamily="JetBrains Mono" fill="var(--phos)" fontWeight="bold">ID: {activeVessel?.id}</text>
                                            <text x="16" y="-2" fontSize="6" fontFamily="JetBrains Mono" fill="var(--amber)">SOG: {activeVessel?.speedKnots}KT</text>
                                            <text x="16" y="8" fontSize="6" fontFamily="JetBrains Mono" fill="var(--grn)">COG: {activeVessel?.courseDegrees}°</text>
                                        </g>

                                        {/* Fixed Radar Stations in Sector */}
                                        <rect x="98" y="98" width="4" height="4" fill="var(--bg-0)" stroke="var(--phos)" strokeWidth="1" />
                                        <text x="105" y="105" fontSize="5" fontFamily="JetBrains Mono" fill="var(--ink-3)">SRC: NODE_ICG_STATION</text>
                                    </svg>

                                    {/* Hud Overlays */}
                                    <div className="mono" style={{ position: "absolute", top: "12px", left: "16px", fontSize: "10px", color: "var(--ink-2)", borderLeft: "2px solid var(--phos)", paddingLeft: "8px" }}>
                                        SCOPE RANGE: 24.0 NM<br/>MODE: AIS/RDR FUSION
                                    </div>
                                    <div className="mono" style={{ position: "absolute", bottom: "12px", right: "16px", fontSize: "10px", color: "var(--red)", textAlign: "right" }}>
                                        <span className="blink">● AI_ANALYSIS_LIVE</span><br/>
                                        EST_INTERCEPT: 12:44Z
                                    </div>
                                </div>

                                {/* Detailed Telemetry Grid */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div className="ds-grid" style={{ gridTemplateColumns: "1fr 1fr", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line-1)" }}>
                                        <div className="k">FUSED MMSI</div><div className="v">{activeVessel?.mmsi}</div>
                                        <div className="k">LATITUDE</div><div className="v phos mono" style={{fontSize: 10}}>{activeVessel?.lastPosition.lat.toFixed(5)}°N</div>
                                        <div className="k">LONGITUDE</div><div className="v phos mono" style={{fontSize: 10}}>{activeVessel?.lastPosition.lon.toFixed(5)}°E</div>
                                        <div className="k">SPEED (AIS)</div><div className="v amber">{activeVessel?.speedKnots} KN</div>
                                        <div className="k">SPEED (RDR)</div><div className="v amber">{activeVessel?.speedKnots ? (activeVessel.speedKnots + 0.2).toFixed(1) : "---"} KN</div>
                                        <div className="k">TRUE HEADING</div><div className="v">{activeVessel?.courseDegrees}°</div>
                                        <div className="k">CONFIDENCE</div><div className="v grn">98.2% FUSED</div>
                                    </div>
                                    
                                    <div style={{ padding: "16px", background: "rgba(124, 224, 211, 0.05)", borderRadius: "8px", border: "1px solid var(--phos-dim)" }}>
                                        <div className="k" style={{ fontSize: "9px", color: "var(--phos)", letterSpacing: "0.2em", marginBottom: "8px" }}>AI PREDICTIVE COMMENTARY</div>
                                        <div className="txt" style={{ fontSize: "11px", color: "var(--ink-1)", lineHeight: "1.4" }}>
                                            Target behavior is consistent with <strong>Cargo Transit</strong>. Model predicts 88% probability of remaining on course.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EO VISUAL CLASSIFICATION */}
                        <div className="panel" style={{padding: "20px", background: "var(--bg-2)", border: "1px solid var(--line-3)"}}>
                            <div className="ds-title">EO VISUAL VERIFICATION</div>
                            <div className="eo-wrap" style={{margin: "0 0 16px 0", aspectRatio: "1 / 1", height: "auto", width: "100%"}}>
                                <div className="eo-img" style={{ backgroundImage: `url(/msas/inference/eo/eo_152.jpg)`, backgroundSize: 'cover' }}/>
                                <div className="eo-overlay-br mono">VISUAL MATCH: {activeVessel?.type}<br/>CONF: 0.93</div>
                            </div>
                            <div className="ds-grid">
                                <div className="k">CV CLASSIFICATION</div><div className="v">{activeVessel?.type}</div>
                                <div className="k">STRUCTURAL MATCH</div><div className="v grn">92.4%</div>
                            </div>
                        </div>

                        {/* SAR SATELLITE INTERCEPT */}
                        <div className="panel" style={{padding: "20px", background: "var(--bg-2)", border: "1px solid var(--line-3)"}}>
                            <div className="ds-title">SAR SATELLITE INTELLIGENCE</div>
                            <div className="eo-wrap" style={{margin: "0 0 16px 0", aspectRatio: "1 / 1", height: "auto", width: "100%"}}>
                                <div className="eo-img" style={{ backgroundImage: `url(/msas/inference/sar/sar_042.jpg)`, backgroundSize: 'cover', filter: 'grayscale(1) contrast(1.5)' }}/>
                                <div className="eo-overlay-br mono">METALLIC SIG: HIGH<br/>RCS: 420m²</div>
                            </div>
                            <div className="ds-grid">
                                <div className="k">SATELLITE PASS</div><div className="v">SENTINEL-1B (04:12Z)</div>
                                <div className="k">METALLIC SIGNATURE</div><div className="v red">CONFIRMED TARGET</div>
                            </div>
                        </div>

                        {/* VHF & INTELLIGENCE */}
                        <div className="panel" style={{padding: "20px", background: "var(--bg-2)", border: "1px solid var(--line-3)"}}>
                            <div className="ds-title">SIGINT / VHF INTELLIGENCE</div>
                            <div className="list compact">
                                {vhfMock.slice(0,2).map((v, i) => (
                                    <div key={i} className="vhf-row" style={{padding: "8px 0", gridTemplateColumns: "1fr"}}>
                                        <div className="lg phos" style={{fontSize: 9}}>{v.station} · {v.t}</div>
                                        <div className="raw" style={{fontSize: 12}}>{v.en}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BEHAVIORAL ANOMALIES */}
                        <div className="panel" style={{padding: "20px", background: "var(--bg-2)", border: "1px solid var(--line-3)"}}>
                            <div className="ds-title">BEHAVIORAL ANOMALIES</div>
                            <div className="list compact">
                                {activeVessel?.suspicionFactors.map(sf => (
                                    <div key={sf} className="anomaly red" style={{marginBottom: "8px", background: "rgba(255,74,61,0.05)", borderLeft: "2px solid var(--red)", padding: "8px"}}>
                                        <div className="code" style={{fontSize: 9, fontWeight: "bold"}}>{sf.toUpperCase()}</div>
                                        <div className="txt" style={{fontSize: 11, color: "var(--ink-1)"}}>{sf} detected via sensor correlation.</div>
                                    </div>
                                ))}
                                {activeVessel?.suspicionFactors.length === 0 && (
                                    <div style={{fontSize:11, color:'var(--ink-3)'}}>No active behavioral anomalies detected.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : activeMod === "FEEDS" ? (
        <div className="main main-single">
            <div className="panel" style={{borderRight: 0}}>
                <div className="panel-header">
                    <div className="ph-l"><span className="corner">◈</span>MULTI-CHANNEL TACTICAL FEEDS · SENSOR GRID</div>
                    <div className="ph-r">
                        <div style={{display: "flex", gap: "8px"}}>
                            <button className={feedModality === "RADAR" ? "active" : ""} onClick={() => setFeedModality("RADAR")} style={{background: "none", border: "1px solid var(--line-3)", color: "var(--ink-2)", padding: "2px 10px", fontSize: "9px", cursor: "pointer"}}>RADAR</button>
                            <button className={feedModality === "EO" ? "active" : ""} onClick={() => setFeedModality("EO")} style={{background: "none", border: "1px solid var(--line-3)", color: "var(--ink-2)", padding: "2px 10px", fontSize: "9px", cursor: "pointer"}}>EO CAM</button>
                            <button className={feedModality === "SAR" ? "active" : ""} onClick={() => setFeedModality("SAR")} style={{background: "none", border: "1px solid var(--line-3)", color: "var(--ink-2)", padding: "2px 10px", fontSize: "9px", cursor: "pointer"}}>SAR SAT</button>
                        </div>
                    </div>
                </div>
                <div className="panel-body" style={{padding: "16px", background: "var(--bg-0)"}}>
                    <div className="fluid-grid">
                        {filteredVessels.slice(0, 9).map((v, i) => (
                            <div key={v.id} className="panel" style={{aspectRatio: "16/10", position: "relative", overflow: "hidden", border: "1px solid var(--line-2)", background: "var(--bg-1)"}}>
                                {/* Feed Content based on selection */}
                                {feedModality === "RADAR" ? (
                                    <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, #0a1a18 0%, #05080a 100%)"}}>
                                        <svg width="100%" height="100%" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--line-1)" strokeWidth="0.5" />
                                            <circle cx="50" cy="50" r="25" fill="none" stroke="var(--line-1)" strokeWidth="0.5" />
                                            <line x1="50" y1="50" x2={50 + Math.sin(i * 60) * 40} y2={50 - Math.cos(i * 60) * 40} stroke="var(--phos)" strokeWidth="1" opacity="0.4" />
                                            <rect x="48" y="48" width="4" height="4" fill="none" stroke="var(--phos)" strokeWidth="1" transform={`rotate(${v.courseDegrees}, 50, 50)`} />
                                        </svg>
                                    </div>
                                ) : feedModality === "EO" ? (
                                    <div style={{width: "100%", height: "100%", backgroundImage: `url(/msas/inference/eo/eo_${(i % 9).toString().padStart(3, '0')}.jpg)`, backgroundSize: "cover", backgroundPosition: "center"}}>
                                    </div>
                                ) : (
                                    <div style={{width: "100%", height: "100%", backgroundImage: `url(/msas/inference/sar/sar_${(i % 9).toString().padStart(3, '0')}.jpg)`, backgroundSize: "cover", backgroundPosition: "center", filter: "grayscale(1) contrast(1.5)"}}>
                                        <div style={{position: "absolute", top: "10px", right: "10px", color: "var(--red)", fontSize: "8px", fontWeight: "bold"}}>METALLIC_TARGET_CONFIRMED</div>
                                    </div>
                                )}

                                {/* Overlay HUD */}
                                <div style={{position: "absolute", top: 0, left: 0, right: 0, padding: "8px", background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)", display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                                    <div className="mono" style={{fontSize: "9px", color: "var(--phos)"}}>
                                        FEED_{v.id}<br/>
                                        {v.name.slice(0, 12)}
                                    </div>
                                    <div className={`pill severity-${riskBand(v.riskScore)}`} style={{fontSize: "8px", padding: "2px 6px"}}>{v.riskScore} RISK</div>
                                </div>
                                <div style={{position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line-1)"}}>
                                    <div className="mono" style={{fontSize: "8px", color: "var(--ink-2)"}}>SRC: RS_NODE_NORTH</div>
                                    <div className="mono" style={{fontSize: "8px", color: "var(--amber)"}}>{v.speedKnots}KN / {v.courseDegrees}°</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      ) : activeMod === "VHF INTEL" ? (
        <div className="main main-single">
            <div className="panel" style={{borderRight: 0}}>
                <div className="panel-header">
                    <div className="ph-l"><span className="corner">◈</span>VHF INTELLIGENCE TERMINAL · MULTI-LINGUAL TACTICAL FEED</div>
                    <div className="ph-r">{vhfMock.length} INTERCEPTS ACTIVE</div>
                </div>
                <div className="fluid-grid-wide" style={{ padding: "24px", background: "var(--bg-0)" }}>
                    <div className="panel" style={{padding: "16px", background: "var(--bg-1)", border: "1px solid var(--line-2)"}}>
                        <div className="k" style={{fontSize: "10px", color: "var(--ink-3)", letterSpacing: "0.2em"}}>TOTAL INTERCEPTS</div>
                        <div className="v phos mono" style={{fontSize: "24px", marginTop: "8px"}}>{vhfMock.length}</div>
                    </div>
                    <div className="panel" style={{padding: "16px", background: "var(--bg-1)", border: "1px solid var(--line-2)"}}>
                        <div className="k" style={{fontSize: "10px", color: "var(--ink-3)", letterSpacing: "0.2em"}}>HIGH RISK FLAGS</div>
                        <div className="v red mono" style={{fontSize: "24px", marginTop: "8px"}}>{vhfMock.filter(v => v.risk === 'high').length}</div>
                    </div>
                    <div className="panel" style={{padding: "16px", background: "var(--bg-1)", border: "1px solid var(--line-2)"}}>
                        <div className="k" style={{fontSize: "10px", color: "var(--ink-3)", letterSpacing: "0.2em"}}>MONITORING NODES</div>
                        <div className="v grn mono" style={{fontSize: "24px", marginTop: "8px"}}>08 ONLINE</div>
                    </div>
                </div>
                <div className="panel-body">
                    <div className="vhf-body" style={{padding: "0 24px 24px"}}>
                        <div className="vhf-row" style={{borderBottom: "2px solid var(--line-3)", padding: "12px", fontWeight: "bold", color: "var(--phos)"}}>
                            <div className="t">TIME</div>
                            <div className="ch">CHAN</div>
                            <div className="s">STATION</div>
                            <div className="lg">LANG</div>
                            <div className="raw">RAW INTERCEPT</div>
                            <div className="en">AI TRANSLATION</div>
                            <div className="ent">ENTITIES</div>
                        </div>
                        {vhfMock.map((v, i) => (
                        <div key={i} className={'vhf-row'+(v.risk==='high'?' high':'')} style={{padding: "16px 12px", minHeight: "60px"}}>
                            <div className="t">{v.t}</div>
                            <div className="ch">CH{v.ch}</div>
                            <div className="s">{v.station}</div>
                            <div className="lg">{v.lang}</div>
                            <div className="raw" style={{fontStyle: "italic"}}>{v.raw}</div>
                            <div className="en" style={{color: "var(--ink-0)", fontWeight: 500}}>{v.en}</div>
                            <div className="ent">
                                {v.entities.map(e => <span key={e} className="chip phos">{e}</span>)}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="main" style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{textAlign: "center"}}>
                <div className="phos mono" style={{fontSize: "24px", marginBottom: "16px"}}>MODULE UNDER DEVELOPMENT</div>
                <div className="ink-3" style={{letterSpacing: "0.2em"}}>SELECT WATCHKEEPER OR VHF INTEL FOR DEMO</div>
            </div>
        </div>
      )}

      {/* BOTTOM BAR (Shared or conditional) */}
      <div className="bottombar">
        <div className="vhf">
          <div className="vhf-head">
            <div>▶ VHF INTERCEPT · TACTICAL TRANSCRIPTION · LIVE</div>
            <div className="r">
              <span style={{color:'var(--phos)'}}><span className="dot"/>MONITORING CH-16</span>
            </div>
          </div>
          <div className="vhf-body">
             {vhfMock.map((v, i) => (
               <div key={i} className={'vhf-row'+(v.risk==='high'?' high':'')}>
                  <div className="t">{v.t}</div>
                  <div className="ch">CH{v.ch}</div>
                  <div className="s">{v.station}</div>
                  <div className="lg">{v.lang}</div>
                  <div className="raw">{v.raw}</div>
                  <div className="en">{v.en}</div>
                  <div className="ent">
                    {v.entities.map(e => <span key={e} className="chip">{e}</span>)}
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="sensor">
          <h4>SENSOR HEALTH · CSN-NODE</h4>
          <div className="sensor-grid">
            <div className="sensor-tile"><div className="n">RADAR</div><div className="v">ONLINE</div></div>
            <div className="sensor-tile"><div className="n">AIS</div><div className="v">ONLINE</div></div>
            <div className="sensor-tile warn"><div className="n">EO/IR</div><div className="v">DEG 2</div></div>
            <div className="sensor-tile"><div className="n">SAR</div><div className="v">READY</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
