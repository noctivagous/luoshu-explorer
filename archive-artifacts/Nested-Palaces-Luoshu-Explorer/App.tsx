import { useState, useEffect, useMemo, useRef } from 'react';

const BASE = [4,9,2,3,5,7,8,1,6];
const BAGUA = [
  { pos:0, val:4, dir:"SE", tri:"Xun ☴", elem:"Wind", han:"巽", meaning:"Southeast" },
  { pos:1, val:9, dir:"S",  tri:"Li ☲", elem:"Fire", han:"離", meaning:"South" },
  { pos:2, val:2, dir:"SW", tri:"Kun ☷", elem:"Earth", han:"坤", meaning:"Southwest" },
  { pos:3, val:3, dir:"E",  tri:"Zhen ☳", elem:"Thunder", han:"震", meaning:"East" },
  { pos:4, val:5, dir:"C",  tri:"Center", elem:"Earth", han:"中", meaning:"Center Palace" },
  { pos:5, val:7, dir:"W",  tri:"Dui ☱", elem:"Lake", han:"兌", meaning:"West" },
  { pos:6, val:8, dir:"NE", tri:"Gen ☶", elem:"Mountain", han:"艮", meaning:"Northeast" },
  { pos:7, val:1, dir:"N",  tri:"Kan ☵", elem:"Water", han:"坎", meaning:"North" },
  { pos:8, val:6, dir:"NW", tri:"Qian ☰", elem:"Heaven", han:"乾", meaning:"Northwest" },
];

function transformCoord(r:number,c:number,t:number):[number,number]{
  switch(t){
    case 0: return [r,c];
    case 1: return [c,2-r];
    case 2: return [2-r,2-c];
    case 3: return [2-c,r];
    case 4: return [r,2-c];
    case 5: return [2-c,2-r];
    case 6: return [2-r,c];
    case 7: return [c,r];
    default: return [r,c];
  }
}
function buildSymmetry(t:number){
  const out = new Array(9);
  for(let r=0;r<3;r++) for(let c=0;c<3;c++){
    const v = BASE[r*3+c];
    const [nr,nc]=transformCoord(r,c,t);
    out[nr*3+nc]=v;
  }
  return out;
}
const SYMS = Array.from({length:8},(_,i)=>buildSymmetry(i));
const SYM_NAMES = ["Identity","Rot 90°","Rot 180°","Rot 270°","Mirror ↕","Mirror+90°","Mirror+180°","Mirror+270°"];

function getCellValue(r:number,c:number,depth:number,symms:number[]){
  let v=1;
  let pow=1;
  for(let k=0;k<depth;k++){
    const rk = Math.floor(r / Math.pow(3,k)) %3;
    const ck = Math.floor(c / Math.pow(3,k)) %3;
    const sIdx = symms[k] ?? 0;
    const L = SYMS[sIdx][rk*3+ck];
    v += (L-1)*pow;
    pow*=9;
  }
  return v;
}
function magicConst(n:number){ return n*(n*n+1)/2; }

type Focus = {r0:number,c0:number,size:number};

export default function App(){
  const [depth,setDepth]=useState(2);
  const [symms,setSymms]=useState<number[]>([0,0,0,0]);
  const [activeLevel,setActiveLevel]=useState(0);
  const [dark,setDark]=useState(false);
  const [showBagua,setShowBagua]=useState(true);
  const [showHeat,setShowHeat]=useState(true);
  const [hovered,setHovered]=useState<{r:number,c:number}|null>(null);
  const [focusStack,setFocusStack]=useState<Focus[]>([]);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const containerRef=useRef<HTMLDivElement>(null);

  const n = Math.pow(3,depth);
  const currentView:Focus = focusStack.length ? focusStack[focusStack.length-1] : {r0:0,c0:0,size:n};

  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const h = (e:MediaQueryListEvent)=>setDark(e.matches);
    mq.addEventListener('change',h);
    return ()=>mq.removeEventListener('change',h);
  },[]);

  useEffect(()=>{ setFocusStack([]); },[depth]);

  const viewSums = useMemo(()=>{
    const size = currentView.size;
    const r0=currentView.r0,c0=currentView.c0;
    const rows:number[]=[]; const cols:number[]=[];
    for(let rr=0; rr<size; rr++){
      let s=0;
      for(let cc=0; cc<size; cc++) s+=getCellValue(r0+rr,c0+cc,depth,symms);
      rows.push(s);
    }
    for(let cc=0; cc<size; cc++){
      let s=0;
      for(let rr=0; rr<size; rr++) s+=getCellValue(r0+rr,c0+cc,depth,symms);
      cols.push(s);
    }
    let d1=0,d2=0;
    for(let i=0;i<size;i++){
      d1+=getCellValue(r0+i,c0+i,depth,symms);
      d2+=getCellValue(r0+i,c0+size-1-i,depth,symms);
    }
    const allEqual = rows.every(v=>v===rows[0]) && cols.every(v=>v===rows[0]) && d1===rows[0] && d2===rows[0];
    return {rows,cols,d1,d2,allEqual,magic:rows[0]};
  },[currentView,depth,symms]);

  const hoverDecomp = useMemo(()=>{
    if(!hovered) return null;
    const parts=[];
    let pow=1;
    for(let k=0;k<depth;k++){
      const rk = Math.floor(hovered.r / Math.pow(3,k)) %3;
      const ck = Math.floor(hovered.c / Math.pow(3,k)) %3;
      const sIdx=symms[k]??0;
      const L=SYMS[sIdx][rk*3+ck];
      parts.push({k,level:k===0?'Inner':k===depth-1?'Outer':`L${k+1}`, rk,ck,L,pow,contrib:(L-1)*pow, sym:SYM_NAMES[sIdx]});
      pow*=9;
    }
    return parts;
  },[hovered,depth,symms]);

  const palaceChain = useMemo(()=>{
    if(!hovered) return [];
    const chain=[];
    for(let sz=3; sz<=currentView.size; sz*=3){
      const r0 = Math.floor(hovered.r / sz)*sz;
      const c0 = Math.floor(hovered.c / sz)*sz;
      if(r0<currentView.r0 || c0<currentView.c0 || r0+sz>currentView.r0+currentView.size) continue;
      const rows:number[]=[];
      for(let rr=0;rr<sz;rr++){
        let s=0;
        for(let cc=0;cc<sz;cc++) s+=getCellValue(r0+rr,c0+cc,depth,symms);
        rows.push(s);
      }
      const cols:number[]=[];
      for(let cc=0;cc<sz;cc++){
        let s=0;
        for(let rr=0;rr<sz;rr++) s+=getCellValue(r0+rr,c0+cc,depth,symms);
        cols.push(s);
      }
      let d1=0,d2=0;
      for(let i=0;i<sz;i++){ d1+=getCellValue(r0+i,c0+i,depth,symms); d2+=getCellValue(r0+i,c0+sz-1-i,depth,symms); }
      const isMagic = rows.every(v=>v===rows[0]) && cols.every(v=>v===rows[0]) && d1===rows[0] && d2===rows[0];
      chain.push({size:sz,r0,c0,rows,cols,d1,d2,isMagic,magic:rows[0]});
    }
    return chain.sort((a,b)=>a.size-b.size);
  },[hovered,currentView,depth,symms]);

  // canvas draw
  useEffect(()=>{
    if(depth<=2) return;
    const canvas=canvasRef.current;
    if(!canvas) return;
    const parent=containerRef.current;
    if(!parent) return;
    const rect=parent.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    const W=rect.width;
    const H=W;
    canvas.style.width=`${W}px`;
    canvas.style.height=`${H}px`;
    canvas.width=W*dpr;
    canvas.height=H*dpr;
    const ctx=canvas.getContext('2d');
    if(!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    const size=currentView.size;
    const cell=W/size;

    // background paper
    ctx.fillStyle=dark?"#1c1a17":"#fffbf0";
    ctx.fillRect(0,0,W,H);

    // cells
    for(let lr=0; lr<size; lr++){
      for(let lc=0; lc<size; lc++){
        const gr=currentView.r0+lr;
        const gc=currentView.c0+lc;
        const val=getCellValue(gr,gc,depth,symms);
        const norm=(val-1)/(Math.pow(9,depth)-1);
        if(showHeat){
          const alpha = 0.06 + norm*0.28;
          ctx.fillStyle=dark?`rgba(245,158,11,${alpha*0.9})`:`rgba(180,83,9,${alpha})`;
          ctx.fillRect(lc*cell, lr*cell, cell, cell);
        }
        if(cell>22){
          ctx.fillStyle=dark?"#f5f0e8":"#1c1917";
          ctx.font=`${Math.max(10,cell*0.38)}px ui-serif, Georgia, serif`;
          ctx.textAlign="center";
          ctx.textBaseline="middle";
          ctx.fillText(String(val), lc*cell+cell/2, lr*cell+cell/2+0.5);
        } else if(cell>12){
          ctx.fillStyle=dark?"#e7e0d6":"#44403b";
          ctx.font=`${Math.max(7,cell*0.32)}px ui-monospace, monospace`;
          ctx.textAlign="center";
          ctx.textBaseline="middle";
          ctx.fillText(String(val), lc*cell+cell/2, lr*cell+cell/2);
        }
      }
    }

    // hover highlight
    if(hovered){
      if(hovered.r>=currentView.r0 && hovered.r<currentView.r0+size && hovered.c>=currentView.c0 && hovered.c<currentView.c0+size){
        const lr=hovered.r-currentView.r0;
        const lc=hovered.c-currentView.c0;
        ctx.fillStyle=dark?"rgba(245,158,11,0.18)":"rgba(180,83,9,0.12)";
        ctx.fillRect(lc*cell, lr*cell, cell, cell);
        ctx.strokeStyle=dark?"#fbbf24":"#b45309";
        ctx.lineWidth=1.5;
        ctx.strokeRect(lc*cell+0.5, lr*cell+0.5, cell-1, cell-1);
        // row col highlight
        ctx.fillStyle=dark?"rgba(245,158,11,0.06)":"rgba(180,83,9,0.05)";
        ctx.fillRect(0, lr*cell, W, cell);
        ctx.fillRect(lc*cell, 0, cell, H);
      }
    }

    // nested borders
    for(let k=1;k<=depth;k++){
      const step=Math.pow(3,k);
      const lw = k===1?0.6: k===2?1.2: k===3?1.9:2.6;
      const alpha = 0.18 + k*0.14;
      ctx.strokeStyle=dark?`rgba(245,240,232,${alpha})`:`rgba(28,25,23,${alpha})`;
      ctx.lineWidth=lw;
      const firstC = Math.ceil(currentView.c0/step)*step;
      for(let c=firstC; c<=currentView.c0+size; c+=step){
        const x=(c-currentView.c0)*cell;
        if(x<0||x>W) continue;
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      }
      const firstR = Math.ceil(currentView.r0/step)*step;
      for(let r=firstR; r<=currentView.r0+size; r+=step){
        const y=(r-currentView.r0)*cell;
        if(y<0||y>H) continue;
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      }
    }
    ctx.strokeStyle=dark?"#f5f0e8":"#1c1917";
    ctx.lineWidth=2.2;
    ctx.strokeRect(0.5,0.5,W-1,H-1);

  },[depth,symms,dark,showHeat,currentView,hovered]);

  const handleCanvasMove=(e:React.MouseEvent)=>{
    const canvas=canvasRef.current;
    if(!canvas||!containerRef.current) return;
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;
    const size=currentView.size;
    const cell=rect.width/size;
    const lc=Math.floor(x/cell);
    const lr=Math.floor(y/cell);
    const gr=currentView.r0+lr;
    const gc=currentView.c0+lc;
    if(gr>=0&&gr<n&&gc>=0&&gc<n) setHovered({r:gr,c:gc});
  };
  const handleCanvasClick=()=>{
    if(!hovered) return;
    const size=currentView.size;
    if(size<=3) return;
    const newSize=size/3;
    const r0 = Math.floor((hovered.r-currentView.r0)/newSize)*newSize + currentView.r0;
    const c0 = Math.floor((hovered.c-currentView.c0)/newSize)*newSize + currentView.c0;
    setFocusStack(prev=>[...prev,{r0,c0,size:newSize}]);
  };

  const handleDomClick=(gr:number,gc:number)=>{
    if(currentView.size<=3) return;
    const newSize=currentView.size/3;
    const r0 = Math.floor((gr-currentView.r0)/newSize)*newSize + currentView.r0;
    const c0 = Math.floor((gc-currentView.c0)/newSize)*newSize + currentView.c0;
    setFocusStack(prev=>[...prev,{r0,c0,size:newSize}]);
  };

  const resetView=()=>setFocusStack([]);

  const displayedConstants = [1,2,3,4].map(d=>({d,n:Math.pow(3,d),m:magicConst(Math.pow(3,d))}));

  return (
    <div data-safe-area-inset-root style={{boxSizing:'border-box', paddingTop:'var(--safe-area-inset-top)', minHeight:'100vh'}} className={dark?"bg-[#0f0e0c] text-[#f5f0e8]":"bg-[#fdf8ef] text-[#1c1917]"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family: "Crimson Pro", ui-serif, Georgia, serif;}
        .mono{font-family:"JetBrains Mono", ui-monospace, monospace;}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-thumb{background:${dark?"#3a3530":"#d6c7b0"};border-radius:8px}
      `}</style>

      <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)'}} className={`sticky z-30 backdrop-blur-xl border-b ${dark?"bg-[#0f0e0c]/80 border-[#2a2622]":"bg-[#fdf8ef]/80 border-[#e7ddd0]"}`}>
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 grid place-items-center rounded-[10px] border ${dark?"border-[#3a3530] bg-[#1c1a17]":"border-[#e7ddd0] bg-white"} mono text-[11px] font-semibold`}>洛書</div>
            <div>
              <h1 className="text-[22px] leading-[1.1] tracking-[-0.02em] font-semibold">Nested Palaces · Luoshu Explorer</h1>
              <p className={`text-[12px] tracking-wide mono opacity-70`}>九宫 · RECURSIVE MAGIC · 3ⁿ COMPOUND</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${dark?"border-[#2a2622] bg-[#1c1a17]":"border-[#e7ddd0] bg-white"}`}>
              <span className="mono text-[11px]">DEPTH</span>
              <input type="range" min={1} max={4} value={depth} onChange={e=>setDepth(parseInt(e.target.value))} className="w-[88px] accent-[#b45309]" />
              <span className="mono text-[12px] font-semibold">{depth} → {n}×{n}</span>
            </div>
            <button onClick={()=>setDark(!dark)} className={`w-9 h-9 grid place-items-center rounded-full border transition ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-white border-[#e7ddd0]"}`} title="toggle theme">{dark?"☀":"☾"}</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-3 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-6">
        {/* left: grid */}
        <div className="flex flex-col gap-4">
          <div className={`rounded-[20px] border p-3 md:p-5 ${dark?"bg-[#151310] border-[#2a2622]":"bg-white border-[#e7ddd0]"} shadow-[0_1px_0_0_rgba(0,0,0,0.04)]`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="mono text-[11px] tracking-widest opacity-60">VIEW</div>
                <div className="flex items-center gap-1">
                  {focusStack.length===0 ? (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] mono border ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>全图 {n}×{n} · M={magicConst(n)}</span>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={resetView} className={`px-2 py-1 rounded-full text-[11px] mono border hover:opacity-80 ${dark?"bg-[#1c1a17] border-[#3a3530]":"bg-white border-[#e7ddd0]"}`}>全图 {n}×{n}</button>
                      {focusStack.map((f,idx)=>(
                        <span key={idx} className="flex items-center gap-1">
                          <span className="opacity-40">›</span>
                          <button onClick={()=>setFocusStack(prev=>prev.slice(0,idx+1))} className={`px-2 py-1 rounded-full text-[11px] mono border ${idx===focusStack.length-1? (dark?"bg-[#fbbf24] text-black border-[#fbbf24]":"bg-[#1c1917] text-white border-[#1c1917]") : (dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]")}`}>{f.size}×{f.size} @({f.r0},{f.c0})</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 mono text-[11px]"><input type="checkbox" checked={showHeat} onChange={e=>setShowHeat(e.target.checked)} />HEAT</label>
                <label className="flex items-center gap-1.5 mono text-[11px]"><input type="checkbox" checked={showBagua} onChange={e=>setShowBagua(e.target.checked)} />BAGUA</label>
                <button onClick={resetView} disabled={focusStack.length===0} className={`px-2.5 py-1 rounded-full mono text-[11px] border disabled:opacity-30 ${dark?"border-[#2a2622]":"border-[#e7ddd0]"}`}>RESET ZOOM</button>
              </div>
            </div>

            {/* Grid rendering */}
            <div ref={containerRef} className="w-full aspect-square max-w-[760px] mx-auto relative rounded-[12px] overflow-hidden">
              {depth<=2 ? (
                <div className="w-full h-full grid" style={{gridTemplateColumns:`repeat(${currentView.size}, minmax(0,1fr))`, gridTemplateRows:`repeat(${currentView.size}, minmax(0,1fr))`}}>
                  {Array.from({length:currentView.size*currentView.size},(_,i)=>{
                    const lr=Math.floor(i/currentView.size);
                    const lc=i%currentView.size;
                    const gr=currentView.r0+lr;
                    const gc=currentView.c0+lc;
                    const val=getCellValue(gr,gc,depth,symms);
                    const isHovered=hovered?.r===gr && hovered?.c===gc;
                    const isRow = hovered && hovered.r===gr;
                    const isCol = hovered && hovered.c===gc;
                    const norm=(val-1)/(Math.pow(9,depth)-1);
                    // nested borders
                    let bl=1, bt=1;
                    for(let k=1;k<=depth;k++){
                      const step=Math.pow(3,k);
                      if(gc%step===0) bl=Math.max(bl, 1+k*0.9);
                      if(gr%step===0) bt=Math.max(bt, 1+k*0.9);
                    }
                    const baguaIdx = (Math.floor(gr/ Math.pow(3,depth-1))%3)*3 + (Math.floor(gc/ Math.pow(3,depth-1))%3);
                    const bagua = BAGUA[baguaIdx];
                    return (
                      <div key={i}
                        onMouseEnter={()=>setHovered({r:gr,c:gc})}
                        onMouseLeave={()=>setHovered(null)}
                        onClick={()=>handleDomClick(gr,gc)}
                        className={`relative flex flex-col items-center justify-center select-none cursor-pointer transition-[background] ${isHovered?"z-10":""} ${isRow||isCol?"":""}`}
                        style={{
                          borderLeftWidth:bl, borderTopWidth:bt, borderLeftStyle:'solid', borderTopStyle:'solid',
                          borderColor: dark?`rgba(245,240,232,${0.18+bl*0.06})`:`rgba(28,25,23,${0.12+bl*0.05})`,
                          background: showHeat ? (dark?`rgba(245,158,11,${0.05+norm*0.22})`:`rgba(180,83,9,${0.04+norm*0.16})`) : (isHovered? (dark?"#25211e":"#fff7e6") : (isRow||isCol? (dark?"rgba(245,158,11,0.06)":"rgba(180,83,9,0.05)") : "transparent")),
                          boxShadow: isHovered? `inset 0 0 0 1.6px ${dark?"#fbbf24":"#b45309"}` : undefined
                        }}
                      >
                        <span className={`mono font-semibold leading-none ${currentView.size>3?"text-[11px]":"text-[18px] md:text-[22px]"}`}>{val}</span>
                        {showBagua && currentView.size>=9 && lr%Math.pow(3,depth-1)===1 && lc%Math.pow(3,depth-1)===1 && (
                          <span className="mono text-[8px] opacity-50 mt-0.5">{bagua.han}</span>
                        )}
                        {showBagua && depth===1 && (
                          <span className="mono text-[8px] opacity-60 mt-0.5">{BAGUA[gr*3+gc].han}·{BAGUA[gr*3+gc].dir}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <canvas ref={canvasRef} onMouseMove={handleCanvasMove} onClick={handleCanvasClick} onMouseLeave={()=>setHovered(null)} className="w-full h-full block cursor-crosshair" />
              )}
              {/* palace corner label */}
              <div className={`absolute left-2 top-2 px-2 py-1 rounded-full mono text-[10px] border backdrop-blur ${dark?"bg-[#0f0e0c]/70 border-[#2a2622]":"bg-white/80 border-[#e7ddd0]"}`}>DRILL: CLICK A PALACE TO ZOOM · {currentView.size}×{currentView.size}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
              {displayedConstants.map(c=>(
                <div key={c.d} className={`rounded-xl border p-2.5 ${c.d===depth? (dark?"bg-[#fbbf24] text-black border-[#fbbf24]":"bg-[#1c1917] text-white border-[#1c1917]") : (dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]")}`}>
                  <div className="mono text-[10px] opacity-70">DEPTH {c.d} · {c.n}×{c.n}</div>
                  <div className="mono text-[13px] font-semibold">M = {c.m.toLocaleString()}</div>
                  <div className="mono text-[10px] opacity-60">{c.n}·({c.n}²+1)/2</div>
                </div>
              ))}
              <div className={`rounded-xl border p-2.5 col-span-3 md:col-span-4 lg:col-span-4 ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fffbf0] border-[#e7ddd0]"}`}>
                <div className="mono text-[10px] tracking-widest opacity-60 mb-1">COMPOUND FORMULA · PROOF OF NESTABILITY</div>
                <div className="mono text-[12px] leading-[1.5]">value = 1 + Σ 9ᵏ·(Lₖ−1) &nbsp; for k=0..D−1</div>
                <div className="mono text-[10px] opacity-60 mt-1">Each Lₖ is Lo Shu (or D4 variant) at that palace level. Guarantees every 3ᵏ sub-palace is magic-pattern, and whole n×n is normal magic (1…n²).</div>
              </div>
            </div>
          </div>

          <div className={`rounded-[16px] border p-4 ${dark?"bg-[#151310] border-[#2a2622]":"bg-white border-[#e7ddd0]"}`}>
            <div className="mono text-[11px] tracking-widest opacity-60 mb-2">NINE PALACES · 九宫方位</div>
            <div className="grid grid-cols-3 gap-1.5 max-w-[340px]">
              {BAGUA.map(b=>(
                <div key={b.pos} className={`rounded-lg border p-2 text-center ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                  <div className="text-[16px] font-semibold">{b.han} {b.val}</div>
                  <div className="mono text-[10px] opacity-70">{b.tri}</div>
                  <div className="mono text-[9px] opacity-50">{b.dir} · {b.elem}</div>
                </div>
              ))}
            </div>
            <p className="mono text-[11px] leading-[1.5] opacity-70 mt-3">Lo Shu maps the River Chart: 1 Kan North Water, 9 Li South Fire. Nesting repeats the Bagua at every scale — a palace contains nine palaces, each contains nine again. This is the ancient intuition of fractal magic.</p>
          </div>
        </div>

        {/* right panel */}
        <div className="flex flex-col gap-4">
          <div className={`rounded-[20px] border p-4 md:p-5 ${dark?"bg-[#151310] border-[#2a2622]":"bg-white border-[#e7ddd0]"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="mono text-[11px] tracking-widest opacity-60">REFLECTION EXPLORER · D4 (8 SYMMETRIES)</div>
              <div className="flex items-center gap-1">
                {Array.from({length:depth},(_,i)=>(
                  <button key={i} onClick={()=>setActiveLevel(i)} className={`px-2 py-1 rounded-full mono text-[10px] border ${activeLevel===i? (dark?"bg-[#fbbf24] text-black border-[#fbbf24]":"bg-[#1c1917] text-white border-[#1c1917]") : (dark?"border-[#2a2622]":"border-[#e7ddd0]")}`}>{i===0?"Inner":i===depth-1?"Outer":`L${i+1}`}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SYMS.map((sq,idx)=>{
                const isActive = symms[activeLevel]===idx;
                return (
                  <button key={idx} onClick={()=>setSymms(prev=>{const n=[...prev]; n[activeLevel]=idx; return n;})} className={`rounded-[12px] border p-1.5 text-center transition ${isActive? (dark?"bg-[#fbbf24] border-[#fbbf24] text-black":"bg-[#1c1917] border-[#1c1917] text-white") : (dark?"bg-[#1c1a17] border-[#2a2622] hover:border-[#3a3530]":"bg-[#fdf8ef] border-[#e7ddd0] hover:border-[#c7b8a0]")}`}>
                    <div className="grid grid-cols-3 gap-px w-full aspect-square mono text-[9px] font-semibold">
                      {sq.map((v,j)=><div key={j} className={`grid place-items-center rounded-[2px] ${isActive?"bg-black/10":""} ${dark&&!isActive?"bg-[#25211e]":"bg-white/60"}`}>{v}</div>)}
                    </div>
                    <div className="mono text-[8px] mt-1 leading-tight opacity-80">{SYM_NAMES[idx]}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 mono text-[11px] leading-[1.5] opacity-70">
              Lo Shu stays magic under all 8 dihedral transformations. Change <span className="font-semibold">{activeLevel===0?"inner":"outer"}</span> level symmetry; the compound remains magic. This demonstrates invariance under reflection — a core property for nestability.
            </div>
          </div>

          <div className={`rounded-[20px] border p-4 md:p-5 ${dark?"bg-[#151310] border-[#2a2622]":"bg-white border-[#e7ddd0]"}`}>
            <div className="mono text-[11px] tracking-widest opacity-60 mb-3">MAGIC PROOF · ON HOVER</div>
            {!hovered ? (
              <div className="mono text-[12px] opacity-60 py-6 text-center">Hover any cell in the palace to see its row / col / diag sums and decomposition.<br/>Click to drill into that palace.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mono text-[11px] opacity-60">HOVERED CELL</div>
                    <div className="text-[22px] font-semibold leading-none">{getCellValue(hovered.r,hovered.c,depth,symms)} <span className="mono text-[12px] opacity-60">@({hovered.r},{hovered.c})</span></div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full mono text-[11px] border ${viewSums.allEqual?"bg-emerald-600 text-white border-emerald-600":"bg-amber-600 text-white border-amber-600"}`}>{viewSums.allEqual?"MAGIC ✓":"CHECK"}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-xl border p-2.5 ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                    <div className="mono text-[10px] opacity-60">CURRENT VIEW ROW {hovered.r-currentView.r0}</div>
                    <div className="mono text-[12px] font-semibold">{viewSums.rows[hovered.r-currentView.r0]?.toLocaleString()} {viewSums.rows[hovered.r-currentView.r0]===viewSums.magic?"✓":""}</div>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                    <div className="mono text-[10px] opacity-60">COL {hovered.c-currentView.c0}</div>
                    <div className="mono text-[12px] font-semibold">{viewSums.cols[hovered.c-currentView.c0]?.toLocaleString()} {viewSums.cols[hovered.c-currentView.c0]===viewSums.magic?"✓":""}</div>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                    <div className="mono text-[10px] opacity-60">DIAG \</div>
                    <div className="mono text-[12px] font-semibold">{viewSums.d1.toLocaleString()}</div>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                    <div className="mono text-[10px] opacity-60">DIAG /</div>
                    <div className="mono text-[12px] font-semibold">{viewSums.d2.toLocaleString()}</div>
                  </div>
                </div>

                {hoverDecomp && (
                  <div>
                    <div className="mono text-[10px] tracking-widest opacity-60 mb-1.5">DECOMPOSITION · 1 + Σ 9ᵏ(Lₖ−1)</div>
                    <div className="space-y-1">
                      {hoverDecomp.map(d=>(
                        <div key={d.k} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 mono text-[11px] ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
                          <span>L{d.k} {d.level} · {d.sym}</span>
                          <span>L={d.L} @({d.rk},{d.ck}) · ×{d.pow} = +{d.contrib}</span>
                        </div>
                      ))}
                      <div className="flex justify-between mono text-[11px] font-semibold px-2.5 py-1">
                        <span>→ 1 + Σ</span>
                        <span>= {getCellValue(hovered.r,hovered.c,depth,symms)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mono text-[10px] tracking-widest opacity-60 mb-1.5">NESTED PALACES CONTAINING CELL · PROOF</div>
                  <div className="space-y-2">
                    {palaceChain.map(p=>(
                      <div key={p.size} className={`rounded-xl border p-2.5 ${p.isMagic? (dark?"bg-[#1a2a1e] border-[#2a4a2e]":"bg-[#f0fdf4] border-[#bbf7d0]") : (dark?"bg-[#2a1e1e] border-[#4a2a2a]":"bg-[#fef2f2] border-[#fecaca]")}`}>
                        <div className="flex items-center justify-between">
                          <span className="mono text-[11px] font-semibold">{p.size}×{p.size} palace @({p.r0},{p.c0})</span>
                          <span className={`mono text-[10px] px-1.5 py-0.5 rounded-full ${p.isMagic?"bg-emerald-600 text-white":"bg-red-600 text-white"}`}>{p.isMagic?"MAGIC ✓":"FAIL"}</span>
                        </div>
                        <div className="mono text-[10px] opacity-70 mt-1">rows {p.rows.slice(0,3).map(v=>v.toLocaleString()).join(" = ")} {p.size>3?" …":""} → Mₚ={p.magic.toLocaleString()}</div>
                        <div className="mono text-[10px] opacity-50">This palace's values = {(p.r0===0&&p.c0===0)?"1…":""} contiguous block + magic pattern. Row/col/diag sums equal internally.</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-[20px] border p-4 ${dark?"bg-[#151310] border-[#2a2622]":"bg-white border-[#e7ddd0]"}`}>
            <div className="mono text-[11px] tracking-widest opacity-60 mb-2">HOW NESTING WORKS</div>
            <ol className="mono text-[11px] leading-[1.6] list-decimal list-inside space-y-1.5 opacity-80">
              <li>Base Lo Shu 4 9 2 / 3 5 7 / 8 1 6 is magic M=15. 8 reflections/rotations also magic.</li>
              <li>To nest: treat each cell as a palace. Value = 1+ Σ 9ᵏ(Lₖ−1). Outer level chooses offset ×9ᵏ.</li>
              <li>Result is normal magic 1…n². Each 3ᵏ block contains 9ᵏ contiguous numbers, still magic-pattern.</li>
              <li>Thus infinite recursion: 3→9→27→81… each level magic, each sub-palace magic.</li>
              <li>Drill by clicking: you are moving down the palace hierarchy, seeing self-similarity.</li>
            </ol>
          </div>

          <div className={`rounded-[16px] border px-4 py-3 flex items-center justify-between ${dark?"bg-[#1c1a17] border-[#2a2622]":"bg-[#fdf8ef] border-[#e7ddd0]"}`}>
            <span className="mono text-[10px] opacity-60">BUILT FOR NESTABILITY DEMO · INK / PAPER AESTHETIC · 洛書 · CANVAS VIRTUALIZATION FOR 81×81</span>
            <span className="mono text-[10px]">M₈₁ = {magicConst(81).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <footer className="max-w-[1440px] mx-auto px-8 pb-10 pt-2 mono text-[10px] opacity-50 text-center">Nested Palaces Luoshu — recursive magic squares preserve row/col/diag under D4 and compounding. No external build.</footer>
    </div>
  );
}
