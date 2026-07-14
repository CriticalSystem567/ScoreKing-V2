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

  return {
    screen:      { position:"fixed",inset:0,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:100,overflowY:"auto" },
    loginBox:    { width:"100%",maxWidth:loginBoxMax,background:t.surface,backdropFilter:"blur(16px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:24,padding: isDesktop || isTablet ? "36px 34px" : "32px 28px",textAlign:"center",margin:"auto",boxShadow:t.shadow },
    logo:        { fontFamily:"monospace",fontSize:28,fontWeight:700,color:t.accentLight,background:`linear-gradient(135deg,${t.accentLight},${t.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" },
    logoSub:     { fontSize:11,letterSpacing:".15em",textTransform:"uppercase",color:t.textFaint,marginTop:2,marginBottom:24 },
    profileGrid: { display:"grid",gridTemplateColumns: isDesktop || isTablet ? "repeat(3,1fr)" : "1fr 1fr",gap:10,marginBottom:8 },
    profileBtn:  { background:t.surfaceStrong,border:`1.5px solid ${t.surfaceBorder}`,borderRadius:14,padding:"16px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .18s" },
    pinDot:      { width:14,height:14,borderRadius:"50%",border:`2px solid ${t.surfaceBorder}`,transition:"all .15s" },
    pinPad:      { display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 },
    pinKey:      { background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,color:t.text,fontSize:20,fontWeight:600,minHeight:52,cursor:"pointer" },

    appWrap:     { background:t.bg,minHeight:"100vh",padding:appWrapPad,maxWidth:appWrapMax,margin:"0 auto",position:"relative" },
    topBar:      { display:"flex",alignItems:"center",justifyContent:"space-between",background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,borderRadius:10,padding:"10px 14px",marginBottom:14,gap:8,flexWrap:"wrap" },
    glass:       { background:t.surface,backdropFilter:"blur(12px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:16,padding:18,marginBottom:14,boxShadow:t.shadow },
    statBox:     { padding:"12px 8px",textAlign:"center",borderRadius:10,background:t.surface,border:`1px solid ${t.surfaceBorder}` },
    pcard:       { background:t.surface,backdropFilter:"blur(12px)",border:`1px solid ${t.surfaceBorder}`,borderRadius:16,padding:16,boxShadow:t.shadow },
    // Player scoreboard cards: single column on phones, 2 columns on
    // iPad/tablet widths, 3 columns once there's real desktop real estate.
    playerGrid:  { display:"grid",gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : isTablet ? "repeat(2,1fr)" : "1fr",gap:10,marginBottom:14,alignItems:"start" },
    outBadge:    { position:"absolute",top:14,right:14,fontSize:10,fontWeight:800,letterSpacing:".12em",color:t.textFaint,background:t.surfaceStrong,padding:"3px 9px",borderRadius:20 },
    dealerBadge: { position:"absolute",top:14,left:14,fontSize:10,fontWeight:800,letterSpacing:".06em",color:t.bg,background:`linear-gradient(135deg,${t.gold},${t.orange})`,padding:"3px 9px",borderRadius:20,display:"flex",alignItems:"center",gap:4 },
    rankBubble:  { width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0 },
    nameInput:   { background:"transparent",border:"none",fontWeight:700,fontSize:16,flex:1,outline:"none",fontFamily:"inherit" },
    scoreInput:  { width:88,background:t.accentBg,border:`1.5px solid ${t.accentBorder}`,color:t.gold,borderRadius:10,padding:"10px 10px 10px 26px",fontSize:16,fontWeight:700,outline:"none",fontFamily:"inherit",minHeight:46 },
    metaLbl:     { fontSize:10,color:t.textFaint,textTransform:"uppercase",letterSpacing:".06em" },
    metaVal:     { fontSize:13,fontWeight:600,color:t.textDim },
    sectionLabel:{ fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:t.textFaint,fontWeight:600,marginBottom:10 },
    fieldLabel:  { fontSize:11,color:t.textDim,marginBottom:6,display:"block" },
    select:      { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%",appearance:"none" },
    input:       { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%" },
    adminInput:  { background:t.inputBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%" },
    btn:         { border:"none",borderRadius:10,fontFamily:"inherit",fontWeight:600,cursor:"pointer",transition:"all .18s",minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:14,padding:"10px 18px" },
    btnAccent:   { background:`linear-gradient(135deg,${t.accent},${t.accentLight})`,color:"#fff" },
    btnGreen:    { background:`linear-gradient(135deg,#16a860,${t.green})`,color:"#fff" },
    btnRed:      { background:`linear-gradient(135deg,#c93030,${t.red})`,color:"#fff" },
    btnGhost:    { background:t.surfaceStrong,border:`1px solid ${t.surfaceBorder}`,color:t.textDim },
    overlayWrap: { position:"fixed",inset:0,background:t.overlayBg,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" },
    overlayWrapTop: { position:"fixed",inset:0,background:t.overlayBg,zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" },
    winBox:      { background:t.cardBg,border:`1px solid ${t.accentBorder}`,borderRadius:24,padding:"36px 28px",textAlign:"center",maxWidth:winBoxMax,width:"100%",boxShadow:t.shadow },
    toast:       { position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:t.cardBg,border:`1px solid ${t.surfaceBorder}`,color:t.text,padding:"12px 22px",borderRadius:40,fontSize:14,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",backdropFilter:"blur(10px)",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis",boxShadow:t.shadow },
    th:          { padding:"8px 6px",textAlign:"center",color:t.textFaint,fontSize:11,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`1px solid ${t.surfaceBorder}` },
    td:          { padding:"8px 6px",textAlign:"center",color:t.text },
    linkBtn:     { background:"none",border:"none",color:t.accentLight,fontSize:13,cursor:"pointer",padding:6,textDecoration:"underline" },
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
