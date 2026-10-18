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
  function setVideoStatus(message, type="") {
    const el = $("story-video-status"); el.className = `video-status${type ? " " + type : ""}`; el.textContent = message;
  }
  function storyForVideo() {
    const title = ($("story-title").value || currentOutlineTitle || "Untitled Story").trim();
    const idea = $("story-idea").value.trim();
    const scenes = currentOutline.map((scene, i) => `Scene ${i+1}: ${scene.title}. Visual action: ${scene.description}. Dialogue: ${scene.dialogue || "none"}. Camera: ${scene.shot || "clear cinematic framing"}`).join("\n");
    const story = [idea ? `Story premise: ${idea}` : "", scenes ? `Storyboard scenes:\n${scenes}` : ""].filter(Boolean).join("\n\n");
    return {title, story};
  }
  $("story-video-quality").addEventListener("change", () => {
    if (Number($("story-video-duration").value) !== 8 && $("story-video-quality").value !== "720p") {
      $("story-video-quality").value = "720p";
      toast("1080p and 4K require an 8-second Veo clip. Quality reset to 720p.", "error");
    }
  });
  $("story-video-duration").addEventListener("change", () => {
    if (Number($("story-video-duration").value) !== 8 && $("story-video-quality").value !== "720p") {
      $("story-video-quality").value = "720p";
      toast("Quality reset to 720p because 1080p/4K require 8 seconds.", "error");
    }
  });
  $("story-generate-video").addEventListener("click", async () => {
    const {title, story} = storyForVideo();
    if (!story.trim()) { setVideoStatus("Add a story idea or generate an outline first. You do not need to rewrite it.", "error"); $("story-idea").focus(); return; }
    const button = $("story-generate-video"); const result = $("story-video-result");
    button.disabled = true; result.classList.add("hidden"); result.replaceChildren();
    const style = $("story-video-style").value;
    const ratio = $("story-video-ratio").value;
    const duration = Number($("story-video-duration").value);
    const resolution = $("story-video-quality").value;
    const prompt = `Create one coherent ${duration}-second video based on this story. Visual style: ${style}. Aspect ratio: ${ratio}. Preserve character appearance and story continuity. Condense the story into a clear visual sequence with a beginning, action, and payoff; no titles or subtitles unless story requires them. Story title: ${title}. ${story}`;
    setVideoStatus("Starting secure video-generation job…", "working");
    try {
      const start = await fetch("/.netlify/functions/generate-video", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,aspectRatio:ratio,durationSeconds:duration,resolution,style})});
      const started = await start.json().catch(()=>({}));
      if (!start.ok) throw new Error(started.error || `Video service returned HTTP ${start.status}.`);
      if (!started.operationName) throw new Error("The provider did not return a generation job ID.");
      let finished = null;
      for (let attempt=0; attempt<36; attempt++) {
        setVideoStatus(`Video generation in progress… checking status (${attempt+1}/36). This may take several minutes.`, "working");
        await new Promise(resolve=>setTimeout(resolve,8000));
        const poll = await fetch(`/.netlify/functions/video-status?operation=${encodeURIComponent(started.operationName)}`);
        const status = await poll.json().catch(()=>({}));
        if (!poll.ok) throw new Error(status.error || `Could not check job status (HTTP ${poll.status}).`);
        if (status.error) throw new Error(status.error);
        if (status.done && status.videoUrl) { finished=status; break; }
      }
      if (!finished) throw new Error("This job is taking longer than expected. Check again later or try a shorter prompt; the provider may still be processing it.");
      const video = document.createElement("video"); video.controls=true; video.playsInline=true; video.preload="metadata"; video.src=finished.videoUrl;
      const download = document.createElement("button"); download.className="primary"; download.textContent="Download video";
      download.addEventListener("click", async () => {
        download.disabled=true; const oldLabel=download.textContent; download.textContent="Preparing download…";
        try {
          const parts=[]; let start=0; const chunkSize=2*1024*1024; let total=null;
          while(total===null || start<total) {
            const end=start+chunkSize-1;
            const chunk=await fetch(finished.videoUrl,{headers:{Range:`bytes=${start}-${end}`}});
            if(!chunk.ok && chunk.status!==206) throw new Error(`Download failed (HTTP ${chunk.status}).`);
            const bytes=await chunk.arrayBuffer(); parts.push(bytes);
            const range=chunk.headers.get("content-range");
            if(range) { const match=range.match(/bytes\s+\d+-\d+\/(\d+)/i); if(match) total=Number(match[1]); }
            if(chunk.status!==206) { total=bytes.byteLength; break; }
            if(bytes.byteLength===0) throw new Error("The provider returned an empty video chunk.");
            start+=bytes.byteLength;
            if(total===null && bytes.byteLength<chunkSize) { total=start; break; }
            download.textContent=`Downloading… ${total ? Math.min(100,Math.round(start/total*100)) : ""}%`;
            if(parts.length>100) throw new Error("Video download exceeded the safety limit.");
          }
          const blob=new Blob(parts,{type:"video/mp4"}); const localUrl=URL.createObjectURL(blob); const a=document.createElement("a");a.href=localUrl;a.download=`${slug(title)}-video.mp4`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(localUrl),60000);download.textContent="Download again";
        } catch(err) { setVideoStatus(`Video generated, but download failed: ${err.message}. The provider file may have expired or may not support byte-range downloads.`, "error"); download.textContent=oldLabel; }
        finally { download.disabled=false; }
      });
      const note=document.createElement("p");note.className="helper";note.textContent="Generated with Google Veo. Provider-hosted video files are temporary; download a copy to keep it.";
      result.append(video,download,note); result.classList.remove("hidden");
      setVideoStatus("Video generated successfully. Preview it below and download a copy.", "success");
    } catch (error) {
      setVideoStatus(`${error.message || "Video generation failed."} Check Netlify function logs and confirm GEMINI_API_KEY is set in Netlify → Site configuration → Environment variables.`, "error");
    } finally { button.disabled=false; }
  });
  $("story-link-to-story").addEventListener("click", async () => {
    const link=$("story-video-link").value.trim(); const transcript=$("story-video-transcript").value.trim();
    const file=$("story-video-upload").files?.[0]; const status=$("story-link-status");
    status.className="video-status working";
    if (transcript) {
      $("story-title").value=$("story-title").value.trim() || "Story from video transcript";
      $("story-idea").value=transcript;
      currentOutlineTitle=$("story-title").value;
      currentOutline=makeOutline(transcript,$("story-genre").value,$("story-tone").value,Number($("story-length").value)||5);
      renderOutline(); status.className="video-status success";status.textContent="Story created from the transcript. Review the outline above, then choose Generate Video from Story."; toast("Story created from transcript."); return;
    }
    if (file) {
      status.className="video-status error"; status.textContent=`Selected ${file.name} (${Math.round(file.size/1024/1024*10)/10} MB). This version does not upload or analyze video files; paste accessible captions/transcript above, then press this button again.`; return;
    }
    if (!link) {status.className="video-status error";status.textContent="Paste a video link or provide a transcript first.";return;}
    try {
      const response=await fetch("/.netlify/functions/video-link-story",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:link})});
      const data=await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error||`Could not inspect this link (HTTP ${response.status}).`);
      if(data.title) { $("story-title").value=$("story-title").value.trim()||`${data.title} — Story`; }
      status.className="video-status";
      status.textContent=(data.title?`Found title: ${data.title}. `:"")+`${data.message||"Captions or a transcript were not available from this link."} Paste the captions/transcript above to turn the source into a story. This app does not download protected videos.`;
    } catch(error) {status.className="video-status error";status.textContent=`${error.message} If the platform blocks access, paste its captions/transcript instead.`;}
  });
  $("story-video-upload").addEventListener("change", e => { const f=e.target.files?.[0]; if(f) $("story-link-file-note").textContent=`Selected ${f.name}. This local-first edition does not upload or analyze the file; paste a transcript/captions to create a story.`; });

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
      const actions=document.createElement("div");actions.className="button-row";
      const btn=document.createElement("button");btn.className="secondary";btn.textContent="Use in Story Lab";btn.addEventListener("click",()=>{$("story-title").value=title.textContent.replace(/^\d+\. /,"");$("story-idea").value=`${hook.textContent}\n\n${desc.textContent}\n\n${hash.textContent}\n\nMake this into a short, engaging story with a strong visual payoff.`;go("story");toast("Idea sent to Story Lab.");});
      const copy=document.createElement("button");copy.className="secondary";copy.textContent="Copy idea";copy.addEventListener("click",async()=>{const text=`${title.textContent}\n${hook.textContent}\n${desc.textContent}\n${hash.textContent}`;try{await navigator.clipboard.writeText(text);toast("Idea copied to clipboard.");}catch{const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove();toast("Idea copied.");}});
      actions.append(btn,copy);card.append(title,hook,desc,hash,actions);output.append(card);
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
