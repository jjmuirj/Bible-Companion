
let plan=[], current=null;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const doneSet=()=>new Set(JSON.parse(localStorage.getItem("bibleDone")||"[]"));
const saveDone=s=>localStorage.setItem("bibleDone",JSON.stringify([...s].sort((a,b)=>a-b)));
function todayISO(){return new Date().toLocaleDateString("en-CA")}
function pickToday(){
  const t=todayISO(); let x=plan.find(r=>r.date===t);
  if(x) return x;
  const d=doneSet();
  return plan.find(r=>!d.has(r.day))||plan[plan.length-1];
}
function todayStatus(){
  const now=new Date(), dow=now.getDay(), t=todayISO();
  if(plan.some(r=>r.date===t)) return "";
  if(dow===6) return "Saturday is a catch-up day. Showing your first unfinished reading.";
  if(dow===0) return "Sunday is left free for church. Showing your first unfinished reading if you want it.";
  if(t < plan[0].date) return "The plan begins January 1, 2027. Showing Day 1.";
  if(t > plan[plan.length-1].date) return "The scheduled plan is complete. Showing your first unfinished reading.";
  return "No reading is scheduled today. Showing your first unfinished reading.";
}
function showView(id){
  ["todayView","planView","settingsView"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id));
  $$("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
}
function renderDay(r){
  current=r; const d=doneSet(), isDone=d.has(r.day);
  $("#dayEyebrow").textContent=`Day ${r.day} • ${new Date(r.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}`;
  $("#dayTitle").textContent=r.reference;
  $("#daySubtitle").textContent=r.title;
  const status=todayStatus(); $("#todayStatus").textContent=status; $("#todayStatus").classList.toggle("hidden",!status);
  $("#explanation").textContent=r.explanation;
  $("#difficult").textContent=r.difficult||"No special difficult-text note for this reading.";
  $("#connections").textContent=r.connections||"Read this passage within the unfolding biblical story.";
  $("#doneBtn").textContent=isDone?"✓ Completed":"Mark completed";
  $("#doneBtn").classList.toggle("done",isDone);
  $("#prevBtn").disabled=r.day===1; $("#nextBtn").disabled=r.day===plan.length;
  updateProgress();
  showView("todayView");
  scrollTo({top:0,behavior:"smooth"});
}
function updateProgress(){
  const n=doneSet().size; $("#progressText").textContent=`${n} of ${plan.length} completed`;
  $("#progressBar").style.width=`${100*n/plan.length}%`;
}
function renderPlan(filter=""){
  const d=doneSet(), q=filter.toLowerCase().trim(), box=$("#planList"); box.innerHTML="";
  plan.filter(r=>!q||r.reference.toLowerCase().includes(q)||r.title.toLowerCase().includes(q)||r.date.includes(q)).forEach(r=>{
    const row=document.createElement("div"); row.className="dayrow";
    row.innerHTML=`<div><div class="dayref">${r.day}. ${r.reference}</div><div class="small">${r.date} · ${r.title}</div></div><div class="check">${d.has(r.day)?"✓":""}</div>`;
    row.onclick=()=>renderDay(r); box.appendChild(row);
  });
}
async function init(){
  plan=await fetch("plan.json").then(r=>r.json());
  renderDay(pickToday()); renderPlan(); updateProgress();
}
$("#doneBtn").onclick=()=>{let d=doneSet(); d.has(current.day)?d.delete(current.day):d.add(current.day); saveDone(d); renderDay(current); renderPlan($("#search").value)};
$("#prevBtn").onclick=()=>renderDay(plan[current.day-2]);
$("#nextBtn").onclick=()=>renderDay(plan[current.day]);
$("#continueBtn").onclick=()=>{let d=doneSet(); renderDay(plan.find(r=>!d.has(r.day))||plan[plan.length-1])};
$("#search").oninput=e=>renderPlan(e.target.value);
$$("nav button").forEach(b=>b.onclick=()=>{showView(b.dataset.view); if(b.dataset.view==="planView")renderPlan($("#search").value)});
$("#resetBtn").onclick=()=>{if(confirm("Clear all completion marks on this device?")){localStorage.removeItem("bibleDone");renderPlan();updateProgress();renderDay(pickToday())}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
init();
