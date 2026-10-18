(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "stickzap_creator_studio_v2_projects";
  let projects = [];
  let currentProjectId = null;
  let currentOutline = [];
  let currentOutlineTitle = "";
  let firstFrameUrl = null, lastFrameUrl = null;

  function toast(message, type = "success") {
    const region = $("toast-region");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
  function safeLoad() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      projects = Array.isArray(parsed) ? parsed.filter(p => p && typeof p.id === "string" && typeof p.name === "string") : [];
    } catch (e) {
      projects = [];
      toast("Saved data could not be read. You can import a backup JSON file.", "error");
    }
    updateProjectCount();
  }
  function safeSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      updateProjectCount();
      return true;
    } catch (e) {
      toast("This browser could not save the project. Export a backup and free device storage.", "error");
      return false;
    }
  }
  function updateProjectCount() {
    const n = projects.length;
    if ($("project-count")) $("project-count").textContent = `${n} saved project${n === 1 ? "" : "s"}`;
  }
  function id() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
  function go(page) {
    const target = document.getElementById(`page-${page}`);
    if (!target) { toast("That section is not available.", "error"); return; }
    document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el === target));
    document.querySelectorAll("[data-page]").forEach(el => el.classList.toggle("active", el.classList.contains("nav-item") && el.dataset.page === page));
    const label = ({dashboard:"Dashboard",story:"Story Lab",viral:"Viral Radar",video:"Direct Video",frames:"Frame-to-frame",audio:"Audio Studio",library:"Project Library",settings:"Settings & setup"})[page] || "Workspace";
    $("current-section").textContent = label;
    $("sidebar").classList.remove("open");
    if (page === "library") renderLibrary();
    if (page === "dashboard") renderRecent();
    window.scrollTo({top:0, behavior:"smooth"});
  }
  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-page]");
    if (nav) { e.preventDefault(); go(nav.dataset.page); }
  });
  $("menu-toggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("new-project-top").addEventListener("click", openProjectDialog);
  $("new-project-empty").addEventListener("click", openProjectDialog);
  $("new-project-library").addEventListener("click", openProjectDialog);
  function openProjectDialog() { $("new-project-name").value = ""; $("project-dialog").showModal(); }
  $("project-form").addEventListener("submit", e => {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault();
    const name = $("new-project-name").value.trim();
    if (!name) { toast("Enter a project name first.", "error"); return; }
    const project = {id:id(), name, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), type:"story", idea:"", scenes:[]};
    projects.unshift(project); currentProjectId = project.id;
    if (safeSave()) {
      $("project-dialog").close(); $("story-title").value = name;
      renderRecent(); renderLibrary(); go("story"); toast("Project created.");
    }
  });
  function makeOutline(idea, genre, tone, count) {
    const seed = idea.trim();
    const short = seed.length > 150 ? seed.slice(0,147) + "..." : seed;
    const patterns = [
      ["The Spark","Introduce the main character, the world, and the unusual problem that changes an ordinary day."],
      ["The First Choice","The character makes a choice and discovers the first consequence. Show the goal clearly."],
      ["A Bigger Complication","A setback raises the stakes. Add a visual clue, funny surprise, or emotional obstacle."],
      ["The Turning Point","A new realization changes the plan. Let the character use something learned earlier."],
      ["The Payoff","Resolve the central question with a satisfying reveal, lesson, or memorable visual moment."],
      ["One Last Surprise","Add a small final twist or callback that rewards the audience for watching."],
      ["A New Beginning","End with a meaningful image or an open door for another episode."]
    ];
    return patterns.slice(0, count).map((p,i) => ({
      title:`Scene ${String(i+1).padStart(2,"0")}: ${p[0]}`,
      description:`Story idea: ${short}\n\n${p[1]} Genre: ${genre}. Tone: ${tone}. Keep this scene focused on one clear action and a visual change.`,
      dialogue:"", shot:"Wide establishing shot, then a clear character-focused shot."
    }));
  }
  $("local-outline").addEventListener("click", () => {
    const idea = $("story-idea").value.trim();
    if (!idea) { toast("Please enter a story idea first.", "error"); $("story-idea").focus(); return; }
    const title = $("story-title").value.trim() || "Untitled Story";
    currentOutlineTitle = title;
    currentOutline = makeOutline(idea, $("story-genre").value, $("story-tone").value, Number($("story-length").value) || 5);
    renderOutline();
    toast("Local outline generated. Edit any scene to make it yours.");
  });
  function renderOutline() {
    $("outline-heading").textContent = currentOutlineTitle || "Your storyboard";
    const out = $("outline-output"); out.replaceChildren();
    currentOutline.forEach((scene, index) => {
      const card = document.createElement("article"); card.className = "scene-card";
      const top = document.createElement("div"); top.className = "scene-top";
      const num = document.createElement("span"); num.className = "scene-number"; num.textContent = `SCENE ${String(index+1).padStart(2,"0")}`;
      const actions = document.createElement("div"); actions.className = "scene-actions";
      const up = document.createElement("button"); up.className = "mini-action"; up.textContent = "↑"; up.title = "Move scene up"; up.disabled = index === 0;
      up.addEventListener("click", () => { [currentOutline[index-1],currentOutline[index]]=[currentOutline[index],currentOutline[index-1]]; renderOutline(); });
      const down = document.createElement("button"); down.className = "mini-action"; down.textContent = "↓"; down.title = "Move scene down"; down.disabled = index === currentOutline.length-1;
      down.addEventListener("click", () => { [currentOutline[index+1],currentOutline[index]]=[currentOutline[index],currentOutline[index+1]]; renderOutline(); });
      const remove = document.createElement("button"); remove.className = "mini-action"; remove.textContent = "Delete"; remove.addEventListener("click", () => { currentOutline.splice(index,1); renderOutline(); });
      actions.append(up,down,remove); top.append(num,actions);
      const title = document.createElement("input"); title.value = scene.title; title.setAttribute("aria-label","Scene title"); title.addEventListener("input",()=>scene.title=title.value);
      const desc = document.createElement("textarea"); desc.value = scene.description; desc.rows=4; desc.setAttribute("aria-label","Scene description"); desc.addEventListener("input",()=>scene.description=desc.value);
      const dialogue = document.createElement("input"); dialogue.value=scene.dialogue || ""; dialogue.placeholder="Dialogue (optional)"; dialogue.setAttribute("aria-label","Scene dialogue"); dialogue.addEventListener("input",()=>scene.dialogue=dialogue.value);
      const shot = document.createElement("input"); shot.value=scene.shot || ""; shot.placeholder="Shot notes"; shot.setAttribute("aria-label","Shot notes"); shot.addEventListener("input",()=>scene.shot=shot.value);
      card.append(top,title,desc,dialogue,shot); out.append(card);
    });
    if (!currentOutline.length) out.innerHTML = '<div class="empty-output"><span>✧</span><p>No scenes yet. Generate an outline to begin.</p></div>';
  }
  $("save-story").addEventListener("click", saveStory);
  function saveStory() {
    const name = $("story-title").value.trim() || currentOutlineTitle || "Untitled Story";
    const idea = $("story-idea").value.trim();
    let p = projects.find(x=>x.id===currentProjectId);
    if (!p) { p={id:id(),createdAt:new Date().toISOString()}; projects.unshift(p); currentProjectId=p.id; }
    p.name=name; p.type="story"; p.idea=idea; p.scenes=currentOutline.map(s=>({...s})); p.genre=$("story-genre").value; p.tone=$("story-tone").value; p.updatedAt=new Date().toISOString();
    currentOutlineTitle=name;
    if(safeSave()){renderRecent();renderLibrary();toast("Project saved on this device.");}
  }
  function exportText(filename, content, mime="text/plain;charset=utf-8") {
    try {
      const blob = new Blob([content], {type:mime}); const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000); toast("Download prepared.");
    } catch(e) { toast("Could not create the download in this browser.", "error"); }
  }
  $("export-story").addEventListener("click", () => {
    if (!currentOutline.length) { toast("Generate an outline before exporting.", "error"); return; }
    const text = `${currentOutlineTitle || $("story-title").value || "Story"}\n\nIdea: ${$("story-idea").value}\nGenre: ${$("story-genre").value}\nTone: ${$("story-tone").value}\n\n` + currentOutline.map((s,i)=>`${i+1}. ${s.title}\n${s.description}\nDialogue: ${s.dialogue||"—"}\nShot notes: ${s.shot||"—"}`).join("\n\n");
    exportText("stickzap-story-outline.txt",text);
  });
  const ideaHooks = ["What if the smallest character had the biggest secret?","A normal day takes one completely unexpected turn.","Three tiny clues reveal a surprising truth.","The character tries the easy way—and makes everything harder.","A small act of kindness changes the whole ending.","Can you spot the detail that changes everything?"];
  const ideaFormats = ["A 20-second visual story with a clear reveal.","A fast before-and-after transformation.","A funny three-beat setup, escalation, and payoff.","A mini mystery with a clue in the opening shot.","A short emotional moment with a memorable final image.","A simple challenge with an unexpected result."];
  $("generate-ideas").addEventListener("click", () => {
    const topic = $("viral-topic").value.trim() || "creative animation";
    const platform = $("viral-format").value;
    const output = $("ideas-output"); output.replaceChildren();
    for(let i=0;i<6;i++){
      const card=document.createElement("article");card.className="idea-card";
      const title=document.createElement("h3");title.textContent=`${i+1}. ${["The Unexpected Twist","Tiny Hero, Huge Problem","A Secret in Plain Sight","One Choice Changes Everything","The Perfectly Wrong Plan","Wait for the Last Frame"][i]}`;
      const hook=document.createElement("p");hook.className="hook";hook.textContent=`Hook: ${ideaHooks[i]}`;
      const desc=document.createElement("p");desc.textContent=`Topic: ${topic}. Format: ${ideaFormats[i]} Optimized as a concept for ${platform}.`;
      const hash=document.createElement("p");hash.className="hashtags";hash.textContent=`#${topic.toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,20)||"animation"} #shortvideo #storytelling #creator`;
      const btn=document.createElement("button");btn.className="secondary";btn.textContent="Use in Story Lab";btn.addEventListener("click",()=>{$("story-title").value=title.textContent.replace(/^\\d+\\. /,"");$("story-idea").value=`${hook.textContent}\\n\\n${desc.textContent}\\n\\nMake this into a short, engaging story with a strong visual payoff.`;go("story");toast("Idea sent to Story Lab.");});
      card.append(title,hook,desc,hash,btn);output.append(card);
    }
    toast("Created six local idea concepts. These are not live trend data.");
  });
  $("make-video-brief").addEventListener("click",()=>{
    const prompt=$("video-prompt").value.trim();if(!prompt){toast("Describe the video first.","error");return;}
    const brief={title:"Video production brief",prompt,aspectRatio:$("video-ratio").value,duration:$("video-duration").value,visualStyle:$("video-style").value||"Not specified",status:"Planning brief only — no video has been rendered."};
    const out=$("video-output");out.className="result-box";out.textContent=JSON.stringify(brief,null,2);window.currentVideoBrief=brief;toast("Production brief created.");
  });
  $("export-video-brief").addEventListener("click",()=>{if(!window.currentVideoBrief){toast("Create a production brief first.","error");return;}exportText("stickzap-video-brief.json",JSON.stringify(window.currentVideoBrief,null,2),"application/json");});
  $("video-provider").addEventListener("click",()=>toast("No video provider is configured. This version supports planning and export only.","error"));
  function attachPreview(inputId, slot) {
    $(inputId).addEventListener("change", e=>{
      const file=e.target.files && e.target.files[0];if(!file)return;
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)){toast("Choose a PNG, JPEG, or WebP image.","error");e.target.value="";return;}
      if(file.size>8*1024*1024){toast("Image is too large. Choose an image under 8 MB.","error");e.target.value="";return;}
      const reader=new FileReader();reader.onload=()=>{if(slot==="first"){firstFrameUrl=reader.result;}else{lastFrameUrl=reader.result;}const label=e.target.closest(".upload-box");let img=label.querySelector("img");if(!img){img=document.createElement("img");img.alt=slot==="first"?"First frame preview":"Last frame preview";label.appendChild(img);}img.src=reader.result;label.querySelector("strong").textContent=file.name;toast("Image preview loaded locally.");};reader.onerror=()=>toast("Could not read this image.","error");reader.readAsDataURL(file);
    });
  }
  attachPreview("first-frame","first");attachPreview("last-frame","last");
  $("make-frame-plan").addEventListener("click",()=>{
    const transition=$("frame-transition").value.trim();if(!firstFrameUrl&&!lastFrameUrl&&!transition){toast("Upload a frame or describe the transition first.","error");return;}
    const text=`FRAME-TO-FRAME TRANSITION PLAN\n\nFirst frame: ${firstFrameUrl?"Uploaded and previewed locally":"Not provided"}\nLast frame: ${lastFrameUrl?"Uploaded and previewed locally":"Not provided"}\n\nTransition direction:\n${transition||"Describe the character action, camera movement, lighting continuity, and how the final frame should be reached."}\n\nContinuity checklist:\n- Keep character design, colors, and proportions consistent.\n- Use a clear, physically plausible movement between frames.\n- Keep camera direction and lighting intentional.\n- Verify that the final frame matches the intended composition.\n\nStatus: Planning only. No video has been rendered.`;
    $("frame-plan-output").textContent=text;$("frame-plan-output").classList.remove("hidden");toast("Transition plan created.");
  });
  $("prepare-audio").addEventListener("click",()=>{
    const text=$("audio-text").value.trim();if(!text){toast("Enter narration text first.","error");return;}
    const result=`NARRATION SCRIPT\n\nLanguage: ${$("audio-language").value}\nDelivery: ${$("audio-style").value}\n\n${text}\n\nRecording notes: Speak clearly, leave short pauses between ideas, and check pronunciation of names before recording.\n\nStatus: Script prepared. No audio has been generated.`;
    $("audio-output").className="result-box";$("audio-output").textContent=result;window.currentAudioScript=result;toast("Narration script prepared.");
  });
  $("export-audio").addEventListener("click",()=>{if(!window.currentAudioScript){toast("Prepare a narration script first.","error");return;}exportText("stickzap-narration-script.txt",window.currentAudioScript);});
  function renderRecent() {
    const box=$("recent-projects");box.replaceChildren();
    if(!projects.length){box.innerHTML='<div class="empty-state"><span>▤</span><strong>Your next idea starts here</strong><p>Create a project and it will appear here.</p><button class="secondary" id="new-project-empty">Create first project</button></div>'; $("new-project-empty").addEventListener("click",openProjectDialog);return;}
    projects.slice(0,3).forEach(p=>box.appendChild(projectRow(p,true)));
  }
  function projectRow(p, recent=false) {
    const row=document.createElement("div");row.className="library-item";
    const info=document.createElement("div");const name=document.createElement("strong");name.textContent=p.name;const meta=document.createElement("small");meta.textContent=`${p.scenes?.length||0} scenes · Updated ${new Date(p.updatedAt||p.createdAt||Date.now()).toLocaleDateString()}`;info.append(name,meta);
    const actions=document.createElement("div");actions.className="library-item-actions";
    const open=document.createElement("button");open.className="secondary";open.textContent="Open";open.addEventListener("click",()=>loadProject(p.id));
    const exportBtn=document.createElement("button");exportBtn.className="secondary";exportBtn.textContent="Export";exportBtn.addEventListener("click",()=>exportText(`${slug(p.name)}.json`,JSON.stringify(p,null,2),"application/json"));
    const del=document.createElement("button");del.className="danger-button";del.textContent="Delete";del.addEventListener("click",()=>deleteProject(p.id));
    actions.append(open,exportBtn,del);row.append(info,actions);return row;
  }
  function renderLibrary() {
    const list=$("library-list");list.replaceChildren();const q=($("library-search").value||"").toLowerCase();
    const matches=projects.filter(p=>p.name.toLowerCase().includes(q));
    if(!matches.length){const empty=document.createElement("div");empty.className="empty-state";empty.innerHTML="<span>▤</span><strong>No matching projects</strong><p>Create a project or try a different search.</p>";list.append(empty);return;}
    matches.forEach(p=>list.append(projectRow(p)));
  }
  function loadProject(projectId) {
    const p=projects.find(x=>x.id===projectId);if(!p){toast("Project not found.","error");return;}
    currentProjectId=p.id;currentOutlineTitle=p.name;currentOutline=Array.isArray(p.scenes)?p.scenes.map(s=>({...s})):[];$("story-title").value=p.name;$("story-idea").value=p.idea||"";
    if(p.genre)$("story-genre").value=p.genre;if(p.tone)$("story-tone").value=p.tone;
    if(currentOutline.length)renderOutline();else{$("outline-heading").textContent=p.name;$("outline-output").innerHTML='<div class="empty-output"><span>✧</span><p>This project has no scenes yet. Generate an outline to begin.</p></div>';}
    go("story");toast("Project opened.");
  }
  function deleteProject(projectId) {
    const p=projects.find(x=>x.id===projectId);if(!p)return;
    if(!confirm(`Delete "${p.name}" from this browser? Export a backup first if needed.`))return;
    projects=projects.filter(x=>x.id!==projectId);if(currentProjectId===projectId)currentProjectId=null;
    safeSave();renderLibrary();renderRecent();toast("Project deleted.");
  }
  function slug(s){return (s||"stickzap-project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"stickzap-project";}
  $("library-search").addEventListener("input",renderLibrary);
  $("import-projects").addEventListener("click",()=>$("import-file").click());
  $("import-file").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new Error("File is too large (maximum 2 MB).");
      const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:[parsed];
      const valid=incoming.filter(p=>p&&typeof p.name==="string");
      if(!valid.length)throw new Error("No valid project objects found.");
      const existing=new Set(projects.map(p=>p.id));valid.forEach(p=>{if(!p.id||existing.has(p.id))p.id=id();p.createdAt=p.createdAt||new Date().toISOString();p.updatedAt=new Date().toISOString();p.scenes=Array.isArray(p.scenes)?p.scenes:[];});
      projects=[...valid,...projects];if(safeSave()){renderLibrary();renderRecent();toast(`Imported ${valid.length} project(s).`);}
    }catch(err){toast(`Import failed: ${err.message}`,"error");}finally{e.target.value="";}
  });
  $("export-all").addEventListener("click",()=>exportText("stickzap-project-backup.json",JSON.stringify(projects,null,2),"application/json"));
  $("clear-data").addEventListener("click",()=>{if(!confirm("Delete all StickZap projects saved in this browser? This cannot be undone unless you have a backup."))return;projects=[];currentProjectId=null;safeSave();renderLibrary();renderRecent();toast("Local projects cleared.");});
  // Keep a minimal health endpoint file available for future backend integration; the static app does not require it.
  safeLoad();renderRecent();renderLibrary();
})();