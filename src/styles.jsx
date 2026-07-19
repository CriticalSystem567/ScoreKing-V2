/* Styles are generated per-theme via getStyles(theme) — see ThemeContext.jsx.
   Every screen calls `const S = getStyles(theme)` instead of importing a
   static object, so every color updates instantly when the theme toggles. */
/* Styles are generated per-theme (and now per-viewport) via getStyles(theme, vp)
   — see ThemeContext.jsx / ViewportContext.jsx. Every screen calls
   `const S = getStyles(theme, vp)` so colors AND layout widths update
   instantly when the theme toggles or the window/device size changes. `vp`
   is optional — omitting it just falls back to mobile-sized defaults, so
   nothing breaks if a caller hasn't been updated yet. */
export function getStyles(t, vp) {
  const isTablet = !!vp?.isTablet;
  const isDesktop = !!vp?.isDesktop;
  const isWide = !!vp?.isWide;

  // Container widths grow in steps as the viewport grows, instead of the
  // mobile 480px cap stretching awkwardly across a laptop or desktop screen.
  const loginBoxMax = isDesktop ? 440 : isTablet ? 420 : 380;
  const appWrapMax = isWide ? 1180 : isDesktop ? 980 : isTablet ? 760 : 480;
  const appWrapPad = isDesktop ? "24px 32px" : isTablet ? "20px 24px" : "16px 14px";
  const winBoxMax = isDesktop || isTablet ? 360 : 320;

  const felt = t.feltTexture ? `${t.feltTexture}, ` : "";

  return {
    screen:      { position:"fixed",inset:0,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:100,overflowY:"auto",fontFamily:t.fontBody },
    loginBox:    { width:"100%",maxWidth:loginBoxMax,background:`${felt}${t.cardBg}`,backdropFilter:"blur(16px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:24,padding: isDesktop || isTablet ? "40px 36px" : "34px 26px",textAlign:"center",margin:"auto",boxShadow:t.shadow },
    logo:        { fontFamily:t.fontDisplay,fontSize:34,fontWeight:800,letterSpacing:".01em",color:t.gold,background:`linear-gradient(135deg,${t.goldLight || t.accentLight},${t.gold} 55%,${t.goldLight || t.accentLight})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" },
    logoSub:     { fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:t.textFaint,marginTop:4,marginBottom:26,fontFamily:t.fontBody },
    profileGrid: { display:"grid",gridTemplateColumns: isDesktop || isTablet ? "repeat(3,1fr)" : "1fr 1fr",gap:10,marginBottom:8 },
    profileBtn:  { background:t.surfaceStrong,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:14,padding:"16px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .18s" },
    pinDot:      { width:14,height:14,borderRadius:"50%",border:`2px solid ${t.surfaceBorder}`,transition:"all .15s" },
    pinPad:      { display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 },
    pinKey:      { background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,color:t.text,fontSize:20,fontWeight:600,minHeight:52,cursor:"pointer",fontFamily:t.fontMono },

    appWrap:     { background:t.bg,minHeight:"100vh",padding:appWrapPad,maxWidth:appWrapMax,margin:"0 auto",position:"relative",fontFamily:t.fontBody },
    topBar:      { display:"flex",alignItems:"center",justifyContent:"space-between",background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,borderRadius:10,padding:"10px 14px",marginBottom:14,gap:8,flexWrap:"wrap" },
    glass:       { background:`${felt}${t.surface}`,backdropFilter:"blur(12px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:16,padding:18,marginBottom:14,boxShadow:t.shadow },
    statBox:     { padding:"12px 8px",textAlign:"center",borderRadius:10,background:t.surface,border:`1px solid ${t.surfaceBorder}` },
    pcard:       { background:`${felt}${t.cardBg}`,backdropFilter:"blur(12px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:16,padding:16,boxShadow:t.shadow,transition:"opacity .5s ease, filter .5s ease" },
    // Player scoreboard cards: single column on phones, 2 columns on
    // iPad/tablet widths, 3 columns once there's real desktop real estate.
    playerGrid:  { display:"grid",gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "1fr",gap:10,marginBottom:14,alignItems:"start" },

    // ─── Game Arena ───────────────────────────────────────────────────────
    // A visually-bounded "table" that the live scoreboard + chart live
    // inside of, instead of just floating loose on the page background.
    // On desktop it's height-capped to the viewport with its OWN internal
    // scroll for the cards column; the chart column is a plain flex sibling
    // that stretches to match — it never scrolls or sticks, so nothing
    // "moves" underneath it while you scroll the cards.
    arenaFrame:  {
      position:"relative", borderRadius: isDesktop ? 26 : 22, padding:2.5, marginBottom:14,
      background:`linear-gradient(150deg, ${t.accentBorder}, rgba(201,168,76,.08) 35%, rgba(201,168,76,.03) 60%, ${t.accentBorder})`,
      animation:"skArenaGlow 6s ease-in-out infinite, skArenaIn .5s cubic-bezier(.2,.8,.2,1) both",
    },
    arenaBody:   {
      borderRadius: isDesktop ? 24 : 20, background:`${felt}${t.bg}`,
      display:"flex", flexDirection:"column", overflow:"hidden",
      minHeight: isDesktop ? "min(72vh, 700px)" : undefined,
      maxHeight: isDesktop ? "min(72vh, 700px)" : undefined,
    },
    arenaHeader: {
      flexShrink:0, padding: isDesktop ? "14px 20px" : "12px 14px",
      borderBottom:`1px solid ${t.divider}`, background:t.surfaceStrong,
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap",
    },
    arenaMain:   { flex:1, display:"flex", flexDirection: isDesktop ? "row" : "column", minHeight:0, overflow:"hidden" },
    arenaCards:  { flex: isDesktop ? "1.3 1 0" : "1 1 auto", overflowY:"auto", overflowX:"hidden", padding: isDesktop ? "16px 18px" : "12px 12px 16px", minHeight:0, WebkitOverflowScrolling:"touch" },
    arenaChart:  {
      flex: isDesktop ? "1 0 340px" : "0 0 auto", width: isDesktop ? 340 : undefined,
      borderLeft: isDesktop ? `1px solid ${t.divider}` : undefined,
      borderTop: !isDesktop ? `1px solid ${t.divider}` : undefined,
      padding: isDesktop ? "18px 18px 14px" : "14px 14px 16px",
      overflowY:"auto", overflowX:"hidden", display:"flex", flexDirection:"column",
    },
    outBadge:    { position:"absolute",top:14,right:14,fontSize:10,fontWeight:800,letterSpacing:".12em",color:t.dangerSoft,background:t.redBg,border:`1px solid ${t.redBorder}`,padding:"3px 9px",borderRadius:20,fontFamily:t.fontMono },
    dealerBadge: { position:"absolute",top:14,left:14,fontSize:10,fontWeight:800,letterSpacing:".06em",color:t.bg,background:`linear-gradient(135deg,${t.gold},${t.goldLight || t.orange})`,padding:"3px 9px",borderRadius:20,display:"flex",alignItems:"center",gap:4,animation:"skDealerPulse 2.4s ease-in-out infinite" },
    rankBubble:  { width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0,fontFamily:t.fontMono },
    nameInput:   { background:"transparent",border:"none",fontWeight:700,fontSize:16,flex:1,outline:"none",fontFamily:"inherit" },
    scoreInput:  { width:88,background:t.accentBg,border:`1.5px solid ${t.accentBorder}`,color:t.gold,borderRadius:10,padding:"10px 10px 10px 26px",fontSize:16,fontWeight:700,outline:"none",fontFamily:t.fontMono,minHeight:46 },
    metaLbl:     { fontSize:10,color:t.textFaint,textTransform:"uppercase",letterSpacing:".06em" },
    metaVal:     { fontSize:13,fontWeight:600,color:t.textDim,fontFamily:t.fontMono },
    sectionLabel:{ fontSize:10,letterSpacing:".14em",textTransform:"uppercase",color:t.gold,fontWeight:700,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${t.divider}` },
    fieldLabel:  { fontSize:11,color:t.textDim,marginBottom:6,display:"block" },
    select:      { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%",appearance:"none" },
    input:       { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%" },
    adminInput:  { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%" },
    btn:         { border:"none",borderRadius:10,fontFamily:t.fontBody,fontWeight:700,cursor:"pointer",transition:"all .18s",minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:14,padding:"10px 18px" },
    btnAccent:   { background:`linear-gradient(135deg,${t.gold},${t.goldLight || t.accentLight})`,color:t.bg },
    btnGreen:    { background:`linear-gradient(135deg,#1a9c5c,${t.green})`,color:"#052014" },
    btnRed:      { background:`linear-gradient(135deg,#c72636,${t.red})`,color:"#fff" },
    btnGhost:    { background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,color:t.textDim },
    overlayWrap: { position:"fixed",inset:0,background:t.overlayBg,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"skOverlayFade .35s ease both" },
    overlayWrapTop: { position:"fixed",inset:0,background:t.overlayBg,zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"skOverlayFade .35s ease both" },
    winBox:      { background:`${felt}${t.cardBg}`,border:`1px solid ${t.accentBorder}`,borderRadius:24,padding:"38px 30px",textAlign:"center",maxWidth:winBoxMax,width:"100%",boxShadow:`${t.shadow}, 0 0 80px rgba(201,168,76,.12)`,animation:"skWinnerEnter .65s cubic-bezier(.2,.85,.3,1.1) both",position:"relative" },
    toast:       { position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:t.cardBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,padding:"12px 22px",borderRadius:40,fontSize:14,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",backdropFilter:"blur(10px)",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis",boxShadow:t.shadow },
    th:          { padding:"8px 6px",textAlign:"center",color:t.textFaint,fontSize:11,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`1px solid ${t.divider}` },
    td:          { padding:"8px 6px",textAlign:"center",color:t.text,fontFamily:t.fontMono },
    linkBtn:     { background:"none",border:"none",color:t.gold,fontSize:13,cursor:"pointer",padding:6,textDecoration:"underline" },
    flex:        (dir="row",align="center",gap=0) => ({ display:"flex",flexDirection:dir,alignItems:align,gap }),
  };
}

export function Avatar({ avatar, size = 32 }) {
  const isPhoto = typeof avatar === "string" && avatar.startsWith("http");
  if (isPhoto) {
    return <img src={avatar} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", display:"block", flexShrink:0 }} />;
  }
  return <span style={{ fontSize:size, lineHeight:1 }}>{avatar}</span>;
}
