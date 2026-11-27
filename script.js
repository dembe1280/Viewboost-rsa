"use strict";
/* PD MULTI-PLAYER · PD | Web & App Development · official YouTube IFrame API only */
const MAX=24,QMS=350,$=s=>document.querySelector(s);
const ERR={2:"Invalid video ID.",5:"The player hit an HTML5 error.",100:"Video not found, private or removed.",101:"The owner does not allow embedding.",150:"The owner does not allow embedding."};
/* Extract the 11-character video ID from common YouTube URL shapes */
function parseId(u){try{const x=new URL(u.trim()),h=x.hostname.replace(/^(www|m|music)\./,"");let id="";
 if(h==="youtu.be")id=x.pathname.slice(1);
 else if(h==="youtube.com"||h==="youtube-nocookie.com")id=x.searchParams.get("v")||(x.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/)||[])[2]||"";
 return /^[\w-]{11}$/.test(id)?id:null}catch(e){return null}}
/* Load the official YouTube IFrame API once. The API is cross-origin:
   use its documented callback, not fetch(), to detect readiness. */
let apiP=null;
function api(){
 if(window.YT&&typeof window.YT.Player==="function")return Promise.resolve(window.YT);
 if(apiP)return apiP;
 apiP=new Promise((resolve,reject)=>{
  let settled=false;
  const timeout=setTimeout(()=>finish(new Error("YouTube IFrame API timed out. Check your network, content blockers or site security policy.")),15000);
  function finish(err){
   if(settled)return;
   settled=true;clearTimeout(timeout);
   if(err){apiP=null;reject(err)}
   else if(window.YT&&typeof window.YT.Player==="function")resolve(window.YT);
   else {apiP=null;reject(new Error("YouTube API callback ran but YT.Player is unavailable."))}
  }
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){
   try{if(typeof previous==="function")previous()}catch(e){console.warn("Previous YouTube API callback failed:",e)}
   finish();
  };
  let tag=document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
  if(!tag){
   tag=document.createElement("script");
   tag.src="https://www.youtube.com/iframe_api";
   tag.async=true;
   tag.onerror=()=>finish(new Error("The browser could not load the YouTube IFrame API. Check your connection, VPN, DNS or content blocker."));
   document.head.appendChild(tag);
  }else{
   tag.addEventListener("error",()=>finish(new Error("The YouTube IFrame API script failed to load.")),{once:true});
  }
 });
 return apiP;
}
/* Tabs */
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("on",x===b));
 document.querySelectorAll(".tab").forEach(t=>t.hidden=t.id!=="t_"+b.dataset.tab)});
/* ===== EMBED TESTER ===== */
let tp=null;const SN={"-1":"Not started",0:"Ended",1:"Playing",2:"Paused",3:"Buffering",5:"Cued"};
const LBL={id:"Video ID found",api:"YouTube API loaded",ready:"Player ready",embed:"Playback confirmation"};
function chk(k,ok,t){const e=$("#k_"+k);e.className=ok===null?"":ok?"ok":"bad";e.textContent=(ok===null?"…":ok?"✓":"✗")+" "+(t||LBL[k])}
$("#tgo").onclick=async()=>{const id=parseId($("#turl").value),m=$("#tmsg");m.textContent="";
 if(!id){m.textContent="That doesn’t look like a valid YouTube link.";return}
 Object.keys(LBL).forEach(k=>chk(k,null));chk("id",true,"Video ID found: "+id);$("#tinfo").textContent="";
 try{await api()}catch(e){console.error(e);chk("api",false,"YouTube API could not load");m.textContent=e.message||"Could not load YouTube. Check your connection or content blockers, then try again.";return}
 chk("api",true);if(tp){try{tp.destroy()}catch(e){}tp=null}
 $("#tbox").innerHTML='<div id="tp"></div>';
 tp=new YT.Player("tp",{videoId:id,width:"100%",height:"100%",playerVars:{playsinline:1,rel:0},events:{
  onReady:()=>{chk("ready",true);chk("embed",null,"Press play to confirm playback");const d=tp.getVideoData();$("#tinfo").textContent=(d&&d.title)||"";m.textContent="Player initialized. Press play to verify that this video can be embedded and played."},
  onStateChange:e=>{$("#tstate").textContent=SN[e.data]||"…";if(e.data===1||e.data===5)chk("embed",true,"Video playback confirmed")},
  onError:e=>{const t=ERR[e.data]||"Playback error ("+e.data+").";chk("embed",false,t);m.textContent=t}}})};
/* ===== GALLERY ===== */
let list=[],removed=0;const pl={},st={},q=[];
try{list=JSON.parse(localStorage.getItem("pd_list")||"[]").filter(i=>/^[\w-]{11}$/.test(i)).slice(0,MAX)}catch(e){}
const save=()=>{try{localStorage.setItem("pd_list",JSON.stringify(list))}catch(e){}};
function stats(){const v=Object.values(st),c=s=>v.filter(x=>x===s).length;
 $("#s_tot").textContent=list.length;$("#s_rdy").textContent=c("ready")+c("playing")+c("paused");
 $("#s_play").textContent=c("playing");$("#s_err").textContent=c("error");$("#s_rem").textContent=removed;$("#cnt").textContent=list.length+" / "+MAX}
function setS(id,s,t){st[id]=s;const e=$("#t_"+id);if(e)e.textContent=t;stats()}
const flash=m=>{$("#gmsg").textContent=m;setTimeout(()=>{if($("#gmsg").textContent===m)$("#gmsg").textContent=""},4000)};
/* Lazy loading: a card joins the queue when it scrolls into view */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const id=e.target.id.slice(2);io.unobserve(e.target);if(st[id]==="wait")q.push(id)}}),{rootMargin:"200px"});
/* Queue: one player is initialised every QMS milliseconds */
setInterval(()=>{const id=q.shift();if(id&&st[id]==="wait")start(id)},QMS);
function start(id){setS(id,"loading","Loading…");const box=$("#c_"+id+" .box");
 api().then(()=>{box.innerHTML='<div id="p_'+id+'"></div>';
  pl[id]=new YT.Player("p_"+id,{videoId:id,width:"100%",height:"100%",playerVars:{playsinline:1,rel:0},events:{
   onReady:()=>setS(id,"ready","Ready"),
   onStateChange:e=>{if(e.data===1)setS(id,"playing","Playing");else if(e.data===2)setS(id,"paused","Paused");else if(e.data===0)setS(id,"paused","Ended");else if(e.data===3)setS(id,"loading","Buffering")},
   onError:e=>{box.classList.add("fail");setS(id,"error",ERR[e.data]||"Error")}}})})
 .catch(e=>{console.error(e);box.classList.add("fail");box.innerHTML='<div class="msg">YouTube API unavailable</div>';setS(id,"error","YouTube API unavailable")})}
function addCard(id){const c=document.createElement("div");c.className="vc";c.id="c_"+id;
 c.innerHTML='<div class="box"></div><div class="ft"><span class="stt" id="t_'+id+'">Waiting</span><button class="ib" data-f title="Fullscreen">⛶</button><button class="ib" data-r title="Remove">✕</button></div>';
 c.querySelector("[data-r]").onclick=()=>rem(id);
 c.querySelector("[data-f]").onclick=()=>{const f=pl[id]&&pl[id].getIframe&&pl[id].getIframe();
  if(f&&f.requestFullscreen)f.requestFullscreen();else flash("Fullscreen isn’t available for this player yet.")};
 $("#grid").appendChild(c);st[id]="wait";io.observe(c);stats()}
function rem(id,count=true){try{pl[id]&&pl[id].destroy()}catch(e){}delete pl[id];delete st[id];
 const c=$("#c_"+id);if(c)c.remove();list=list.filter(x=>x!==id);if(count)removed++;save();stats()}
$("#gadd").onclick=()=>{const id=parseId($("#gurl").value);
 if(!id)return flash("That doesn’t look like a valid YouTube link.");
 if(list.includes(id))return flash("That video is already in the gallery. Each video can be added once.");
 if(list.length>=MAX)return flash("Gallery is full ("+MAX+" videos). Remove one first.");
 list.push(id);save();addCard(id);$("#gurl").value=""};
$("#gurl").onkeydown=e=>{if(e.key==="Enter")$("#gadd").click()};$("#turl").onkeydown=e=>{if(e.key==="Enter")$("#tgo").click()};
$("#gclr").onclick=()=>{[...list].forEach(id=>rem(id))};
const setCols=n=>{$("#grid").style.setProperty("--cols",n);$("#cols").value=n};
$("#cols").onchange=e=>setCols(e.target.value);
setCols(matchMedia("(max-width:700px)").matches?2:4);
list.forEach(addCard);stats();
