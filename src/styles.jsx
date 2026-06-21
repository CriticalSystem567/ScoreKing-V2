export const S = {
  screen:      { position:"fixed",inset:0,background:"#0d0d1a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:100,overflowY:"auto" },
  loginBox:    { width:"100%",maxWidth:380,background:"rgba(255,255,255,.04)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,.13)",borderRadius:24,padding:"32px 28px",textAlign:"center",margin:"auto" },
  logo:        { fontFamily:"monospace",fontSize:28,fontWeight:700,background:"linear-gradient(135deg,#a48cff,#f5c842)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" },
  logoSub:     { fontSize:11,letterSpacing:".15em",textTransform:"uppercase",color:"#6b6b8a",marginTop:2,marginBottom:24 },
  profileGrid: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8 },
  profileBtn:  { background:"rgba(255,255,255,.05)",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:14,padding:"16px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .18s" },
  pinDot:      { width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.13)",transition:"all .15s" },
  pinPad:      { display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 },
  pinKey:      { background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,color:"#f0f0ff",fontSize:20,fontWeight:600,minHeight:52,cursor:"pointer" },

  appWrap:     { background:"#0d0d1a",minHeight:"100vh",padding:"16px 14px",maxWidth:480,margin:"0 auto",position:"relative" },
  topBar:      { display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"10px 14px",marginBottom:14,gap:8,flexWrap:"wrap" },
  glass:       { background:"rgba(255,255,255,.04)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:18,marginBottom:14 },
  statBox:     { padding:"12px 8px",textAlign:"center",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)" },
  pcard:       { background:"rgba(255,255,255,.04)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:16 },
  outBadge:    { position:"absolute",top:14,right:14,fontSize:10,fontWeight:800,letterSpacing:".12em",color:"#6b6b8a",background:"rgba(255,255,255,.06)",padding:"3px 9px",borderRadius:20 },
  dealerBadge: { position:"absolute",top:14,left:14,fontSize:10,fontWeight:800,letterSpacing:".06em",color:"#0d0d1a",background:"linear-gradient(135deg,#f5c842,#f5a742)",padding:"3px 9px",borderRadius:20,display:"flex",alignItems:"center",gap:4 },
  rankBubble:  { width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0 },
  nameInput:   { background:"transparent",border:"none",fontWeight:700,fontSize:16,flex:1,outline:"none",fontFamily:"inherit" },
  scoreInput:  { width:88,background:"rgba(124,109,250,.12)",border:"1.5px solid rgba(124,109,250,.35)",color:"#f5c842",borderRadius:10,padding:"10px 10px 10px 26px",fontSize:16,fontWeight:700,outline:"none",fontFamily:"inherit",minHeight:46 },
  metaLbl:     { fontSize:10,color:"#6b6b8a",textTransform:"uppercase",letterSpacing:".06em" },
  metaVal:     { fontSize:13,fontWeight:600,color:"#9999bb" },
  sectionLabel:{ fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"#6b6b8a",fontWeight:600,marginBottom:10 },
  fieldLabel:  { fontSize:11,color:"#9999bb",marginBottom:6,display:"block" },
  select:      { background:"#1e1e32",border:"1px solid rgba(255,255,255,.13)",color:"#f0f0ff",borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%",appearance:"none" },
  input:       { background:"#1e1e32",border:"1px solid rgba(255,255,255,.13)",color:"#f0f0ff",borderRadius:10,padding:"10px 12px",fontSize:15,fontFamily:"inherit",outline:"none",width:"100%" },
  adminInput:  { background:"#1e1e32",border:"1px solid rgba(255,255,255,.13)",color:"#f0f0ff",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%" },
  btn:         { border:"none",borderRadius:10,fontFamily:"inherit",fontWeight:600,cursor:"pointer",transition:"all .18s",minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:14,padding:"10px 18px" },
  btnAccent:   { background:"linear-gradient(135deg,#7c6dfa,#9b60f5)",color:"#fff" },
  btnGreen:    { background:"linear-gradient(135deg,#16a860,#22c97a)",color:"#fff" },
  btnRed:      { background:"linear-gradient(135deg,#c93030,#ff5c5c)",color:"#fff" },
  btnGhost:    { background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.13)",color:"#9999bb" },
  overlayWrap: { position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" },
  overlayWrapTop: { position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" },
  winBox:      { background:"#1a1a2e",border:"1px solid rgba(124,109,250,.4)",borderRadius:24,padding:"36px 28px",textAlign:"center",maxWidth:320,width:"100%" },
  toast:       { position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(30,30,50,.96)",border:"1px solid rgba(255,255,255,.13)",color:"#f0f0ff",padding:"12px 22px",borderRadius:40,fontSize:14,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",backdropFilter:"blur(10px)",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis" },
  th:          { padding:"8px 6px",textAlign:"center",color:"#6b6b8a",fontSize:11,textTransform:"uppercase",letterSpacing:".05em",borderBottom:"1px solid rgba(255,255,255,.1)" },
  td:          { padding:"8px 6px",textAlign:"center" },
  linkBtn:     { background:"none",border:"none",color:"#a48cff",fontSize:13,cursor:"pointer",padding:6,textDecoration:"underline" },
  flex:        (dir="row",align="center",gap=0) => ({ display:"flex",flexDirection:dir,alignItems:align,gap }),
};

export function Avatar({ avatar, size = 32 }) {
  const isPhoto = typeof avatar === "string" && avatar.startsWith("http");
  if (isPhoto) {
    return <img src={avatar} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", display:"block", flexShrink:0 }} />;
  }
  return <span style={{ fontSize:size, lineHeight:1 }}>{avatar}</span>;
}
