/*
 * ══════════════════════════════════════════
 *  سیستەمی توێژینەوە — CIS سلێمانی
 *  JAVASCRIPT — لۆجیکی سیستەم لێرەوە
 * ══════════════════════════════════════════
 *  پێکهاتەی فایلەکە:
 *  1.  STATE             — گۆڕاوە گشتیەکان
 *  2.  FIREBASE          — بەستنەوەی Firebase
 *  3.  AUTH              — چوونەژووەوە / تۆمارکردن / Admin
 *  4.  APP ENTER/LEAVE   — داخڵبوون بۆ سیستەم
 *  5.  SIDEBAR           — دروستکردنی منیۆ
 *  6.  STUDENT SUBMIT    — پێشکەشکردنی توێژینەوە
 *  7.  STUDENT MY-RES    — توێژینەوەکانی خوێندکار
 *  8.  TEACHER LOAD      — بارکردنی داتای مامۆستا
 *  9.  TEACHER RENDER    — نیشاندانی خشتەی مامۆستا
 *  10. SCORE SAVE        — پاشەکەوتکردنی نمرە
 *  11. STATUS CHANGE     — گۆڕینی باری توێژینەوە
 *  12. ADMIN LOAD        — بارکردنی داتای بەڕێوەبەر
 *  13. ADMIN USERS       — خشتەی بەکارهێنەران
 *  14. ADD STAFF         — زیادکردنی مامۆستا
 *  15. MODAL RESEARCH    — مۆدالی توێژینەوە
 *  16. MODAL STUDENT     — مۆدالی خوێندکار
 *  17. HELPERS           — یارمەتیدەرەکان
 * ══════════════════════════════════════════
 */

/* ═══════════════════════════════════
   STATE
═══════════════════════════════════ */
let CU=null, CUD=null;
let allRes=[], allUsers=[];
let teacherRes=[], tFilter='all', aFilter='all';
let activeMemberDept=null; // for chair: which dept member tab is active

const ADMIN_EMAIL='majidtehran36@gmail.com';
const ADMIN_UIDS=['CXfzqJ7TFMXoINeAgzg4pxcgHkg2','NXj35MqtNmSBjjSiOFJDFX1bd2n1'];
const SETUP_SECRET='CIS@Admin2025';

/* ═══════════════════════════════════
   FIREBASE
═══════════════════════════════════ */
window.addEventListener('fbReady',()=>{
  window._onAuth(window._auth, async user=>{
    if(user){
      if(window._skipAuth) return; // skip during admin creation
      CU=user; CUD=await dbUser(user.uid); enterApp();
    }
    else { CU=null; CUD=null; leaveApp(); }
  });
});

async function dbUser(uid){
  try{ const s=await window._get(window._ref(window._db,'users/'+uid)); return s.exists()?s.val():null; }
  catch(e){ return null; }
}

/* ═══════════════════════════════════
   AUTH
═══════════════════════════════════ */
function aTab(t){
  document.querySelectorAll('.a-tab').forEach((b,i)=>b.classList.toggle('on',(i===0&&t==='login')||(i===1&&t==='reg')));
  document.getElementById('ap-login').classList.toggle('on',t==='login');
  document.getElementById('ap-reg').classList.toggle('on',t==='reg');
}

async function doLogin(){
  const email=gv('lEmail'),pass=gv('lPass');
  clr(['lerr','lok']);
  if(!email||!pass){sa('lerr','ئیمەیل و پاسوۆرد داخڵ بکە','err');return;}
  bl('btnL','spL',true);
  try{
    await window._signIn(window._auth,email,pass);
    // پاسوۆرد پاشەکەوت بکە بۆ re-auth کاتی زیادکردنی مامۆستا
    if(ADMIN_UIDS.includes(window._auth.currentUser?.uid) || email===ADMIN_EMAIL){
      window._adminPass = pass;
    }
  }
  catch(e){ sa('lerr',feErr(e.code),'err'); }
  bl('btnL','spL',false);
}

/* switchRegRole — گۆڕین نێوان خوێندکار و مامۆستا */
function switchRegRole(role){
  document.getElementById('rs-student').classList.toggle('on', role==='student');
  document.getElementById('rs-teacher').classList.toggle('on', role==='teacher');
  document.getElementById('reg-student-panel').style.display = role==='student' ? 'block' : 'none';
  document.getElementById('reg-teacher-panel').style.display = role==='teacher' ? 'block' : 'none';
  // alerts پاک بکەرەوە
  ['rerr','rok','trerr','trok'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});
}

/* switchTRegDept — گۆڕینی بەشی مامۆستا لە فۆرمی تۆمارکردن */
function switchTRegDept(dept, el){
  document.querySelectorAll('#tregDeptTabs .dept-tab').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  const inp = document.getElementById('trDept');
  if(inp) inp.value = dept;
  const badge = document.getElementById('tregDeptBadge');
  if(badge){
    const labels = {WEB:'WEB — ووێب', NET:'NET — نیتۆرک', PROGRAM:'PROGRAM — پرۆگرامینگ'};
    const cls    = {WEB:'b-web', NET:'b-net', PROGRAM:'b-prg'};
    badge.textContent = labels[dept]||dept;
    badge.className = 'badge '+(cls[dept]||'b-web');
  }
}

/* doRegTeacher — تۆمارکردنی مامۆستا */
async function doRegTeacher(){
  const name  = (document.getElementById('trName')?.value||'').trim();
  const email = (document.getElementById('trEmail')?.value||'').trim();
  const pass  = (document.getElementById('trPass')?.value||'').trim();
  const dept  = document.getElementById('trDept')?.value||'WEB';
  clr(['trerr','trok']);
  if(!name||!email||!pass){sa('trerr','هەموو خانەکان پڕ بکەرەوە','err');return;}
  if(pass.length<6){sa('trerr','وشەی نهێنی لانیکەم ٦ پیت','err');return;}
  bl('btnTR','spTR',true);
  try{
    window._skipAuth = true; // ئەوتۆ چوونەژووەوە ڕێگری بکە
    const c = await window._createUser(window._auth, email, pass);
    await window._set(window._ref(window._db,'users/'+c.user.uid),{
      name, email, dept, role:'teacher', memberNum:'', level:'-', createdAt:Date.now()
    });
    await window._signOut(window._auth);
    window._skipAuth = false;
    sa('trerr','','err'); // پاککردنەوە
    document.getElementById('trerr').classList.remove('on');
    document.getElementById('trok').textContent='✅ تۆمارکرا! ئێستا بچۆ چوونەژووەوە';
    document.getElementById('trok').className='al al-ok on';
    ['trName','trEmail','trPass'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    setTimeout(()=>{ window._skipAuth=false; aTab('login'); }, 1800);
  }catch(e){
    window._skipAuth = false;
    sa('trerr', feErr(e.code),'err');
  }
  bl('btnTR','spTR',false);
}

/* switchRegDept — گۆڕینی بەشی تۆمارکردن */
function switchRegDept(dept, el){
  document.querySelectorAll('.dept-tab').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  // hidden input نوێ بکەرەوە
  const inp = document.getElementById('rDept');
  if(inp) inp.value = dept;
  // badge نیشاندان
  const badge = document.getElementById('regDeptBadge');
  if(badge){
    const labels = {WEB:'WEB — ووێب', NET:'NET — نیتۆرک', PROGRAM:'PROGRAM — پرۆگرامینگ'};
    const cls    = {WEB:'b-web', NET:'b-net', PROGRAM:'b-prg'};
    badge.textContent = labels[dept] || dept;
    badge.className = 'badge ' + (cls[dept]||'b-web');
  }
}

/* switchStaffDept — گۆڕینی تابی مامۆستا */
function switchStaffDept(dept, el){
  document.querySelectorAll('.dnt').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.staff-pane').forEach(p=>p.classList.remove('on'));
  document.getElementById('sp-'+dept)?.classList.add('on');
}

/* addStaffDept — زیادکردنی مامۆستا بەپێی بەش */
async function addStaffDept(dept){
  const name=(document.getElementById('tName-'+dept)?.value||'').trim();
  const email=(document.getElementById('tEmail-'+dept)?.value||'').trim();
  const pass=(document.getElementById('tPass-'+dept)?.value||'').trim();
  const role=document.getElementById('tRole-'+dept)?.value||'teacher';
  const mnum=(role==='supervisor'||role==='academic')?'':(document.getElementById('tMemberNum-'+dept)?.value||'1');
  const errId='tAddErr-'+dept, okId='tAddOk-'+dept;
  clr([errId,okId]);
  if(!name||!email||!pass){sa2(errId,'هەموو خانەکان پڕ بکەرەوە','err');return;}
  if(pass.length<6){sa2(errId,'وشەی نهێنی لانیکەم ٦ پیت','err');return;}
  if(!window._adminPass){
    const ap=prompt('🔐 وشەی نهێنی ئادمین داخڵ بکە:');
    if(!ap){sa2(errId,'هەڵوەشاندەوە','err');return;}
    window._adminPass=ap;
  }
  const btnId='btnAddT-'+dept, spId='spAddT-'+dept;
  bl(btnId,spId,true);
  try{
    const adminEmail=CU.email;
    window._skipAuth=true;
    const c=await window._createUser(window._auth,email,pass);
    await window._set(window._ref(window._db,'users/'+c.user.uid),{
      name,email,dept,role,memberNum:mnum,level:'-',createdAt:Date.now()
    });
    await window._signOut(window._auth);
    try{
      await window._signIn(window._auth,adminEmail,window._adminPass);
    }catch(reAuthErr){
      window._adminPass=null; window._skipAuth=false;
      sa2(okId,'✅ زیادکرا: '+name+' — تکایە دەرچوو و دووبارە داخڵ بکەرەوە','ok');
      bl(btnId,spId,false); return;
    }
    window._skipAuth=false;
    sa2(okId,'✅ زیادکرا: '+name+' ('+roleLbl(role)+' — '+dept+')','ok');
    document.getElementById('tName-'+dept).value='';
    document.getElementById('tEmail-'+dept).value='';
    document.getElementById('tPass-'+dept).value='';
    await loadAllUsers(); buildAdminStats();
  }catch(e){
    window._skipAuth=false;
    if(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential') window._adminPass=null;
    sa2(errId,feErr(e.code),'err');
  }
  bl(btnId,spId,false);
}

function toggleMemberNumVisibility(dept){
  const role=document.getElementById('tRole-'+dept)?.value||'teacher';
  const wrap=document.getElementById('tMemberNumWrap-'+dept);
  if(wrap) wrap.style.display=(role==='supervisor'||role==='academic')?'none':'';
}

/* autoFillYear — پشتگیری کۆنەکە */
function autoFillYear(){}

async function doReg(){
  const name=gv('rName'),sid=gv('rSid'),email=gv('rEmail'),pass=gv('rPass');
  const dept=document.getElementById('rDept')?.value||'WEB';
  clr(['rerr','rok']);
  if(!name||!email||!pass||!dept){sa('rerr','هەموو خانەکان پڕ بکەرەوە','err');return;}
  if(pass.length<6){sa('rerr','پاسوۆرد لانیکەم ٦ پیت','err');return;}
  bl('btnR','spR',true);
  try{
    window._skipAuth=true;
    const c=await window._createUser(window._auth,email,pass);
    await window._set(window._ref(window._db,'users/'+c.user.uid),{name,studentId:sid,email,dept,level:'5',role:'student',createdAt:Date.now()});
    await window._signOut(window._auth);
    window._skipAuth=false;
    sa('rok','✅ تۆمارکردن سەرکەوتوو بوو! ئێستا بچۆ چوونەژووەوە','ok');
    setTimeout(()=>aTab('login'),1600);
  }catch(e){ window._skipAuth=false; sa('rerr',feErr(e.code),'err'); }
  bl('btnR','spR',false);
}

async function doAdminLogin(){
  const email=(document.getElementById('saEmail')?.value||'').trim();
  const pass=(document.getElementById('saPass')?.value||'').trim();
  clr(['saErr','saOk']);
  if(!email||!pass){sa('saErr','ئیمەیل و وشەی نهێنی داخڵ بکە','err');return;}
  bl('btnSA','spSA',true);
  try{
    await window._signIn(window._auth,email,pass);
    document.getElementById('secretBox').style.display='none';
  }catch(e){ sa('saErr',feErr(e.code),'err'); }
  bl('btnSA','spSA',false);
}

async function doLogout(){ await window._signOut(window._auth); }

function toggleSecret(){
  const b=document.getElementById('secretBox');
  b.style.display=b.style.display==='none'||!b.style.display?'block':'none';
}

async function createAdmin(){
  const sec=gv('saSecret'),pass=gv('saPass');
  clr(['saErr','saOk']);
  if(sec!==SETUP_SECRET){sa('saErr','کلیلی نهێنی هەڵەیە ❌','err');return;}
  if(!pass||pass.length<6){sa('saErr','پاسوۆرد لانیکەم ٦ پیت','err');return;}
  bl('btnSA','spSA',true);
  window._skipAuth=true; // prevent onAuth from entering app
  try{
    try{
      const c=await window._createUser(window._auth,ADMIN_EMAIL,pass);
      const uid=c.user.uid;
      await window._set(window._ref(window._db,'users/'+uid),{name:'بەڕێوەبەر',email:ADMIN_EMAIL,role:'admin',dept:'',level:'-',createdAt:Date.now()});
      await window._signOut(window._auth);
      window._skipAuth=false;
      sa('saOk','✅ ئەکاونتی بەڕێوەبەر دروست کرا! ئێستا داخڵ بکە → admin@cis.edu.iq','ok');
      document.getElementById('lEmail').value=ADMIN_EMAIL;
      setTimeout(()=>aTab('login'),2200);
    }catch(e){
      window._skipAuth=false;
      if(e.code==='auth/email-already-in-use'){
        sa('saOk','✅ ئەکاونتی بەڕێوەبەر پێشتر هەیە! بچۆ چوونەژووەوە: admin@cis.edu.iq','ok');
        document.getElementById('lEmail').value=ADMIN_EMAIL;
        setTimeout(()=>aTab('login'),2200);
      } else throw e;
    }
  }catch(e){ window._skipAuth=false; sa('saErr',feErr(e.code),'err'); }
  bl('btnSA','spSA',false);
}

/* ═══════════════════════════════════
   APP ENTER / LEAVE
═══════════════════════════════════ */
function enterApp(){
  show('appScr'); hide('authScr');
  // ئەگەر role نەبوو بەڵام ئیمەیل یان UID ئادمینە — بە ئادمین بناسە
  let role = CUD?.role || '';
  const isAdmin = CU?.email === ADMIN_EMAIL || ADMIN_UIDS.includes(CU?.uid);
  if(!role && isAdmin) role = 'admin';
  if(!role) role = 'student';

  // ئەگەر ئادمینە و role:admin نەبوو لە DB — ئێستا ڕاستەوخۆ چاکی بکە
  if(isAdmin && CUD && CUD.role !== 'admin'){
    window._update(window._ref(window._db,'users/'+CU.uid),{role:'admin',dept:'',level:'-'});
    CUD.role='admin';
  }

  const dept = CUD?.dept||'';
  document.getElementById('topName').textContent = CUD?.name||CU.email;
  document.getElementById('topRole').textContent = roleLbl(role);
  document.getElementById('topRole').className = 'rbadge r-'+(role==='chair'?'chair':role);
  if(dept){
    const d=document.getElementById('topDept');
    d.textContent=dept; d.className='dbadge d-'+dept; d.style.display='inline-block';
  }
  if(role==='student') document.getElementById('sWelcomeName').textContent='بەخێربێیت، '+(CUD?.name||'')+'!';
  buildSidebar(role);
  if(role==='admin'){
    const heroName=document.getElementById('adminHeroName');
    if(heroName) heroName.textContent='بەخێربێیت، '+(CUD?.name||'بەڕێوەبەر')+'!';
    startAdminClock();
    loadAdminRes(); loadAllUsers(); showPanel('pn-a-dash'); buildAdminStats();
  }
  else if(role==='chair'||role==='teacher'||role==='supervisor'||role==='academic'){ loadTeacherRes(); showPanel('pn-t-dash'); }
  else { loadMyRes(); showPanel('pn-s-sub'); }
}

function leaveApp(){
  hide('appScr'); show('authScr');
  document.getElementById('topDept').style.display='none';
  allRes=[]; allUsers=[]; teacherRes=[];
}

/* ═══════════════════════════════════
   SIDEBAR
═══════════════════════════════════ */
const SIDES={
  student:[
    {ico:'📄',lbl:'پێشکەشکردنی توێژینەوە',pn:'pn-s-sub'},
    {ico:'📋',lbl:'توێژینەوەکانم',pn:'pn-s-my'},
  ],
  teacher:[
    {ico:'📊',lbl:'داشبۆرد',pn:'pn-t-dash'},
    {ico:'📚',lbl:'توێژینەوەکانی بەشم',pn:'pn-t-res'},
  ],
  chair:[
    {ico:'📊',lbl:'داشبۆرد',pn:'pn-t-dash'},
    {ico:'📚',lbl:'توێژینەوەکانی بەشم',pn:'pn-t-res'},
  ],
  supervisor:[
    {ico:'📊',lbl:'داشبۆردم',pn:'pn-t-dash'},
    {ico:'📚',lbl:'توێژینەوەکانم',pn:'pn-t-res'},
  ],
  academic:[
    {ico:'📊',lbl:'داشبۆرد',pn:'pn-t-dash'},
    {ico:'📚',lbl:'توێژینەوەکانی بەشم',pn:'pn-t-res'},
  ],
  admin:[
    {ico:'🏛️',lbl:'داشبۆرد',pn:'pn-a-dash'},
    {ico:'📚',lbl:'هەموو توێژینەوەکان',pn:'pn-a-res'},
    {ico:'👥',lbl:'بەکارهێنەران',pn:'pn-a-users'},
    {ico:'🧑‍🏫',lbl:'زیادکردنی مامۆستا',pn:'pn-a-staff'},
  ]
};

function buildSidebar(role){
  const sb=document.getElementById('sidebar');
  const items=SIDES[role]||SIDES.student;
  sb.innerHTML=items.map((it,i)=>`<div class="si${i===0?' on':''}" onclick="showPanel('${it.pn}',this)"><span class="ico">${it.ico}</span>${it.lbl}</div>`).join('');
}

function showPanel(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.si').forEach(s=>s.classList.remove('on'));
  document.getElementById(id)?.classList.add('on');
  if(el) el.classList.add('on');
  if(id==='pn-s-my') loadMyRes();
  if(id==='pn-a-users') renderUTbl();
  if(id==='pn-t-res') renderTbl();
  if(id==='pn-a-res') renderATbl();
}

/* ═══════════════════════════════════
   STUDENT: PDF UPLOAD
═══════════════════════════════════ */
function onFileChange(input){
  const file = input.files[0];
  if(!file) return;
  if(file.type !== 'application/pdf'){
    sa2('sSubErr','تەنها فایلی PDF قبوڵ دەکرێت','err'); input.value=''; return;
  }
  if(file.size > 20*1024*1024){
    sa2('sSubErr','فایلەکە زۆر گەورەیە — زۆرینە ٢٠MB','err'); input.value=''; return;
  }
  const box = document.getElementById('uploadBox');
  const txt = document.getElementById('uploadTxt');
  box.classList.add('ub-selected');
  txt.textContent = '📄 ' + file.name;
}

async function uploadPDF(file, resId){
  return new Promise((resolve, reject)=>{
    const path = `researches/${CU.uid}/${resId}/${file.name}`;
    const storageRef = window._sRef(window._storage, path);
    const task = window._uploadBytesResumable(storageRef, file);

    document.getElementById('uploadProgress').style.display='flex';

    task.on('state_changed',
      snap => {
        const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
        document.getElementById('upBar').style.width = pct+'%';
        document.getElementById('upPct').textContent = pct+'%';
      },
      err => reject(err),
      async ()=>{
        const url = await window._getDownloadURL(task.snapshot.ref);
        document.getElementById('sStoragePath').value = path;
        resolve({url, path});
      }
    );
  });
}

/* ═══════════════════════════════════
   STUDENT: SUBMIT
═══════════════════════════════════ */
async function submitRes(){
  const title=gv('sTitle'),type=gv('sType'),year=gv('sYear'),
        abst=gv('sAbst'),sup=gv('sSup');
  clr(['sSubErr','sSubOk']);
  if(!title||!type||!year){sa2('sSubErr','ناونیشان، جۆر، ساڵ پێویستن','err');return;}

  const fileInput = document.getElementById('sPdfFile');
  const file = fileInput?.files[0];

  bl('btnSub','spSub',true);
  try{
    const r = window._push(window._ref(window._db,'researches'));
    const resId = r.key;

    let pdfUrl='', pdfPath='';
    if(file){
      const res = await uploadPDF(file, resId);
      pdfUrl = res.url;
      pdfPath = res.path;
    }

    await window._set(r,{
      title, type, year, abstract:abst, supervisor:sup,
      link: pdfUrl, storagePath: pdfPath,
      userId:CU.uid, userName:CUD?.name||CU.email, userDept:CUD?.dept||'',
      status:'pending', score:'', submittedAt:Date.now()
    });

    sa2('sSubOk','✅ پێشکەش کرا! چاوەڕوانی پەسەندکردن بکە','ok');
    ['sTitle','sType','sYear','sAbst','sSup'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    if(fileInput) fileInput.value='';
    document.getElementById('uploadTxt').textContent='کلیک بکە فایلی PDF هەڵبژێرە';
    document.getElementById('uploadBox').classList.remove('ub-selected');
    document.getElementById('uploadProgress').style.display='none';
    document.getElementById('upBar').style.width='0%';
    document.getElementById('sStoragePath').value='';

  }catch(e){ sa2('sSubErr','هەڵە: '+e.message,'err'); }
  bl('btnSub','spSub',false);
}

/* ═══════════════════════════════════
   STUDENT: MY RESEARCH
═══════════════════════════════════ */
async function loadMyRes(){
  const el=document.getElementById('myList');
  el.innerHTML=emHTML('⏳','بارکردن...');
  try{
    const s=await window._get(window._ref(window._db,'researches'));
    if(!s.exists()){el.innerHTML=emHTML('📂','هیچ توێژینەوەیەک نییە');return;}
    const items=Object.entries(s.val()).map(([id,v])=>({id,...v})).filter(r=>r.userId===CU.uid).sort((a,b)=>b.submittedAt-a.submittedAt);
    if(!items.length){el.innerHTML=emHTML('📂','هیچ توێژینەوەیەک نییە');return;}
    el.innerHTML=`<div class="tw"><table class="tbl"><thead><tr><th>#</th><th>ناونیشان</th><th>جۆر</th><th>ساڵ</th><th>نمرە</th><th>بار</th><th>کردار</th></tr></thead><tbody>
    ${items.map((r,i)=>`<tr>
      <td>${i+1}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</td>
      <td>${r.type||'-'}</td><td>${r.year||'-'}</td>
      <td>${r.score?`<span style="color:var(--green);font-weight:700">${r.score}</span>`:'-'}</td>
      <td><span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span></td>
      <td><button class="btn-onav" onclick="openResModal('${r.id}')">بینین</button></td>
    </tr>`).join('')}
    </tbody></table></div>`;
  }catch(e){el.innerHTML=emHTML('❌','هەڵە: '+e.message);}
}

/* ═══════════════════════════════════
   TEACHER: LOAD + RENDER
═══════════════════════════════════ */
async function loadTeacherRes(){
  const role=CUD?.role||'teacher', dept=CUD?.dept||'';
  try{
    const s=await window._get(window._ref(window._db,'researches'));
    const all=!s.exists()?[]:Object.entries(s.val()).map(([id,v])=>({id,...v}));
    if(role==='supervisor'){
      // سەرپەرشتیار: تەنها توێژینەوەکانی خوێندکارانی خۆی
      teacherRes=all.filter(r=>r.supervisorId===CU.uid||r.supervisor===CUD?.name).sort((a,b)=>b.submittedAt-a.submittedAt);
    } else {
      // chair/teacher/academic: توێژینەوەکانی بەشەکە
      teacherRes=all.filter(r=>r.userDept===dept).sort((a,b)=>b.submittedAt-a.submittedAt);
    }
    buildTeacherDash();
    renderTbl();
  }catch(e){}
}

function buildTeacherDash(){
  const role=CUD?.role||'teacher', dept=CUD?.dept||'';
  const cls=dept==='WEB'?'db-web':dept==='NET'?'db-net':'db-prg';
  let roleTxt='';
  if(role==='chair') roleTxt='سەرۆکی لیژنە — '+dept;
  else if(role==='supervisor') roleTxt='سەرپەرشتیاری توێژینەوە';
  else if(role==='academic') roleTxt='مامۆستای ئەکادیمی — '+dept;
  else roleTxt='ئەندامی '+(CUD?.memberNum||'١')+' — '+dept;

  const dashTitle=document.getElementById('tDashTitle');
  if(dashTitle){
    if(role==='chair') dashTitle.textContent='📊 داشبۆردی سەرۆکی لیژنە';
    else if(role==='supervisor') dashTitle.textContent='📊 داشبۆردی سەرپەرشتیار';
    else if(role==='academic') dashTitle.textContent='📊 داشبۆردی مامۆستای ئەکادیمی';
    else dashTitle.textContent='📊 داشبۆردی ئەندامی لیژنە';
  }

  document.getElementById('tBanner').innerHTML=`
    <div class="dept-banner ${cls}">
      <div class="db-txt">
        <h2>بەخێربێیت، ${CUD?.name||''}!</h2>
        <p>${role==='supervisor'?'سەرپەرشتیاری توێژینەوە':deptFull(dept)+' — قۆناغی پێنجەم'}</p>
      </div>
      <span class="db-role">${roleTxt}</span>
    </div>`;

  const total=teacherRes.length;
  const pending=teacherRes.filter(r=>r.status==='pending').length;
  const approved=teacherRes.filter(r=>r.status==='approved').length;
  const rejected=teacherRes.filter(r=>r.status==='rejected').length;
  const scored=teacherRes.filter(r=>r.score||r.finalScore).length;

  if(role==='chair'){
    document.getElementById('tStats').innerHTML=`
      ${sc('ic-b','📚',total,'کۆی توێژینەوەکان')}
      ${sc('ic-gl','⏳',pending,'چاوەڕوانکراو')}
      ${sc('ic-g','✅',approved,'پەسەندکراو')}
      ${sc('ic-r','❌',rejected,'ڕەتکراوەتەوە')}
      ${sc('ic-p','🏅',scored,'نمرەدراو')}
      ${sc('ic-t','📊',total>0?Math.round(approved/total*100)+'%':'0%','ڕێژەی پەسەند')}`;
  } else if(role==='supervisor'){
    document.getElementById('tStats').innerHTML=`
      ${sc('ic-b','📚',total,'توێژینەوەکانم')}
      ${sc('ic-gl','⏳',pending,'چاوەڕوانکراو')}
      ${sc('ic-g','✅',approved,'پەسەندکراو')}
      ${sc('ic-p','🏅',scored,'نمرەدراو')}`;
  } else {
    document.getElementById('tStats').innerHTML=`
      ${sc('ic-b','📚',total,'کۆی توێژینەوەکان')}
      ${sc('ic-gl','⏳',pending,'چاوەڕوانکراو')}
      ${sc('ic-g','✅',approved,'پەسەندکراو')}
      ${sc('ic-r','❌',rejected,'ڕەتکراوەتەوە')}`;
  }

  document.getElementById('tResTitle').textContent=
    role==='supervisor'?'📚 توێژینەوەکانم':'📚 توێژینەوەکانی بەشم — '+dept;

  const mTabsWrap=document.getElementById('memberTabsWrap');
  if(role==='chair'){mTabsWrap.style.display='block';buildMemberTabs(dept);}
  else{mTabsWrap.style.display='none';}

  buildTeacherDashExtra(dept,role);
}

async function buildTeacherDashExtra(dept, role){
  const extra=document.getElementById('tDashExtra');
  if(!extra) return;
  extra.innerHTML='';
  if(role!=='chair') return;

  try{
    const s=await window._get(window._ref(window._db,'users'));
    const users=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
    const members=users.filter(u=>(u.role==='teacher'||u.role==='chair'||u.role==='supervisor'||u.role==='academic')&&u.dept===dept)
                        .sort((a,b)=>a.role==='chair'?-1:1);
    const students=users.filter(u=>u.role==='student'&&u.dept===dept);

    // ── پەسەندکردنی خێرا
    const pendingItems=teacherRes.filter(r=>r.status==='pending').slice(0,5);
    const pendingHTML=pendingItems.length===0
      ?`<div class="empty"><div class="ei">🎉</div><p>هیچ توێژینەوەیەکی چاوەڕوان نییە</p></div>`
      :`<div class="pq-list">
          ${pendingItems.map(r=>`
          <div class="pq-item">
            <div class="pq-info">
              <div class="pq-ttl">${r.title}</div>
              <div class="pq-meta">${r.userName||'-'} · ${r.type||'-'}</div>
            </div>
            <div class="pq-actions">
              <button class="btn-ok" onclick="chStatus('${r.id}','approved','t');event.stopPropagation()">✅ پەسەند</button>
              <button class="btn-red" onclick="chStatus('${r.id}','rejected','t');event.stopPropagation()">❌ ڕەتکردن</button>
              <button class="btn-onav" onclick="openResModal('${r.id}')">بینین</button>
            </div>
          </div>`).join('')}
          ${teacherRes.filter(r=>r.status==='pending').length>5
            ?`<div style="text-align:center;padding:8px;font-size:.78rem;color:var(--muted)">و ${teacherRes.filter(r=>r.status==='pending').length-5} تریش...</div>`:''}
        </div>`;

    // ── ئەندامان — هەر یەکێک کلیک دەکرێت
    const membersHTML=members.length===0
      ?`<div class="empty"><div class="ei">👤</div><p>هیچ ئەندامێک نییە</p></div>`
      :members.map(m=>{
          const isSelf=m.id===CU?.uid;
          const mScored=teacherRes.filter(r=>r.memberScores&&r.memberScores[m.id]).length;
          const roleCls=m.role==='chair'?'b-chair':m.role==='supervisor'?'b-supervisor':m.role==='academic'?'b-academic':'b-member';
          return `<div class="people-item${isSelf?' pi-self':''}" style="cursor:pointer" onclick="openTeacherScoreModal('${m.id}')">
            <div class="pi-avatar pi-tea">${(m.name||'?')[0]}</div>
            <div class="pi-body">
              <div class="pi-name">${m.name}${isSelf?' <span style="font-size:.68rem;color:var(--muted)">(تۆ)</span>':''}</div>
              <div class="pi-meta">
                <span class="badge ${roleCls}">${roleLbl(m.role)}</span>
              </div>
            </div>
            <div class="pi-count${mScored>0?' pi-ok':''}">
              <span>${mScored}</span><span>نمرەدا</span>
            </div>
          </div>`;
        }).join('');

    // ── خوێندکاران
    const studentsHTML=students.length===0
      ?`<div class="empty"><div class="ei">🎓</div><p>هیچ خوێندکارێک نییە</p></div>`
      :students.map(u=>{
          const myRes=teacherRes.filter(r=>r.userId===u.id);
          const apv=myRes.filter(r=>r.status==='approved').length;
          const fs=myRes.map(r=>r.finalScore||r.score).filter(Boolean).map(Number);
          const avg=fs.length?Math.round(fs.reduce((a,b)=>a+b,0)/fs.length):null;
          return `<div class="people-item stu-score-item" onclick="openStuModal('${u.id}')">
            <div class="pi-avatar pi-stu">${(u.name||'?')[0]}</div>
            <div class="pi-body">
              <div class="pi-name">${u.name}</div>
              <div class="pi-meta">
                ${u.studentId?`<span style="font-size:.7rem;color:var(--muted)">${u.studentId}</span>`:''}
                <span class="badge b-p">${myRes.length} توێژینەوە</span>
                ${apv?`<span class="badge b-a">✅${apv}</span>`:''}
              </div>
            </div>
            <div class="pi-count${avg?' pi-ok':''}">
              ${avg!==null?`<span style="font-size:1.1rem;font-weight:900;color:var(--green)">${avg}</span><span>مامناوەند</span>`
                          :`<span style="font-size:.75rem;color:var(--muted)">نمرە<br>نەدراوە</span>`}
            </div>
          </div>`;
        }).join('');

    extra.innerHTML=`
      <div class="section-ttl">⚡ پەسەندکردنی خێرا (${pendingItems.length})</div>
      <div class="card" style="margin-bottom:22px">${pendingHTML}</div>
      <div class="t-two-col">
        <div>
          <div class="section-ttl">🧑‍🏫 ستافی لیژنەی ${deptFull(dept)} <span style="font-size:.72rem;color:var(--muted)">(کلیک بکە بۆ نمرەدان)</span></div>
          <div class="card" style="padding:0;overflow:hidden">${membersHTML}</div>
        </div>
        <div>
          <div class="section-ttl">🎓 خوێندکاران و نمرەکانیان (${students.length})</div>
          <div class="card" style="padding:0;overflow:hidden;max-height:400px;overflow-y:auto">${studentsHTML}</div>
        </div>
      </div>`;
  }catch(e){
    extra.innerHTML=`<div class="card"><div class="empty"><div class="ei">⚠️</div><p>هەڵەی بارکردن: ${e.message}</p></div></div>`;
  }
}


async function buildMemberTabs(dept){
  const mTabs=document.getElementById('memberTabs');
  try{
    const s=await window._get(window._ref(window._db,'users'));
    const users=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
    const members=users.filter(u=>(u.role==='teacher'||u.role==='chair'||u.role==='supervisor'||u.role==='academic')&&u.dept===dept);
    const tabs=[{lbl:'هەموو',val:'all'},...members.map(m=>({lbl:m.name,val:m.id}))];
    activeMemberDept='all';
    mTabs.innerHTML=tabs.map((t,i)=>`<button class="m-tab${i===0?' on':''}" onclick="setMemberTab('${t.val}',this)">${t.lbl}</button>`).join('');
  }catch(e){
    // ئەگەر یاسا ڕێگری کرد — تەنها هەموو نیشان بدە
    mTabs.innerHTML=`<button class="m-tab on" onclick="setMemberTab('all',this)">هەموو</button>`;
  }
}

let activeMember='all';
function setMemberTab(uid,el){
  activeMember=uid;
  document.querySelectorAll('.m-tab').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  renderTbl();
}

function renderTbl(){
  const tbody=document.getElementById('tTbody');
  const q=gv('tSrch').toLowerCase();
  let items=[...teacherRes];
  if(tFilter!=='all') items=items.filter(r=>r.status===tFilter);
  if(q) items=items.filter(r=>r.title?.toLowerCase().includes(q)||r.userName?.toLowerCase().includes(q));
  if(activeMember&&activeMember!=='all') items=items.filter(r=>r.userId===activeMember);
  if(!items.length){tbody.innerHTML=`<tr><td colspan="8">${emHTML('📂','نەدۆزرایەوە')}</td></tr>`;return;}
  const role=CUD?.role||'teacher';
  const isChair=role==='chair';
  const canScore=role==='chair'||role==='teacher'||role==='academic';
  tbody.innerHTML=items.map((r,i)=>`<tr>
    <td>${i+1}</td>
    <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
      <button class="btn-onav" style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;display:block" onclick="openResModal('${r.id}')">${r.title}</button>
    </td>
    <td><button class="name-link" onclick="openStuModal('${r.userId}')">${r.userName||'-'}</button></td>
    <td>${r.type||'-'}</td><td>${r.year||'-'}</td>
    <td>
      ${canScore
        ?`<div class="score-cell">
            <input class="score-inp" type="number" min="0" max="100" placeholder="--" value="${r.finalScore||r.score||''}" id="sc-${r.id}" onkeydown="if(event.key==='Enter')saveScore('${r.id}')">
            <button class="btn-ok" onclick="saveScore('${r.id}')">✓</button>
          </div>`
        :r.finalScore||r.score
          ?`<span class="score-show">🏅 ${r.finalScore||r.score}/100</span>`
          :`<span style="color:var(--muted);font-size:.78rem">نەدراوە</span>`}
    </td>
    <td><span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span></td>
    <td>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${isChair&&r.status!=='approved'?`<button class="btn-ok" onclick="chStatus('${r.id}','approved','t')">✅</button>`:''}
        ${isChair&&r.status!=='rejected'?`<button class="btn-red" onclick="chStatus('${r.id}','rejected','t')">❌</button>`:''}
        ${!isChair?`<button class="btn-onav" onclick="openResModal('${r.id}')">بینین</button>`:''}
      </div>
    </td>
  </tr>`).join('');
}

function setTF(f,el){tFilter=f;document.querySelectorAll('#tChips .chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');renderTbl();}

/* ═══════════════════════════════════
   SCORE SAVE
═══════════════════════════════════ */
async function saveScore(id){
  const val=document.getElementById('sc-'+id)?.value;
  if(val===''||isNaN(val)) return;
  const score=Math.min(100,Math.max(0,parseInt(val)));
  try{
    await window._update(window._ref(window._db,'researches/'+id),{score});
    // update local
    const item=[...teacherRes,...allRes].find(r=>r.id===id);
    if(item) item.score=score;
    renderTbl(); renderATbl();
  }catch(e){alert('هەڵە: '+e.message);}
}

/* ═══════════════════════════════════
   STATUS CHANGE
═══════════════════════════════════ */
async function chStatus(id,status,src){
  try{
    await window._update(window._ref(window._db,'researches/'+id),{status});
    [teacherRes,allRes].forEach(arr=>{const it=arr.find(r=>r.id===id);if(it)it.status=status;});
    renderTbl(); renderATbl(); buildTeacherDash(); buildAdminStats();
  }catch(e){alert('هەڵە: '+e.message);}
}

/* ═══════════════════════════════════
   ADMIN: LOAD + RENDER
═══════════════════════════════════ */
async function loadAdminRes(){
  try{
    const s=await window._get(window._ref(window._db,'researches'));
    allRes=!s.exists()?[]:Object.entries(s.val()).map(([id,v])=>({id,...v})).sort((a,b)=>b.submittedAt-a.submittedAt);
    renderATbl(); buildAdminStats();
  }catch(e){}
}

async function loadAllUsers(){
  try{
    const s=await window._get(window._ref(window._db,'users'));
    allUsers=!s.exists()?[]:Object.entries(s.val()).map(([id,v])=>({id,...v}));
    buildAdminStats();
  }catch(e){}
}

function buildAdminStats(){
  const total=allRes.length,
        pending=allRes.filter(r=>r.status==='pending').length,
        approved=allRes.filter(r=>r.status==='approved').length,
        rejected=allRes.filter(r=>r.status==='rejected').length,
        students=allUsers.filter(u=>u.role==='student').length,
        teachers=allUsers.filter(u=>u.role==='teacher'||u.role==='chair'||u.role==='supervisor'||u.role==='academic').length;

  // ── Stats cards ──────────────────────────────────────
  document.getElementById('aStats').innerHTML=`
    ${sc('ic-b','👥',allUsers.length,'کۆی بەکارهێنەران')}
    ${sc('ic-p','🧑‍🎓',students,'خوێندکاران')}
    ${sc('ic-t','🧑‍🏫',teachers,'مامۆستایان')}
    ${sc('ic-gl','📄',total,'کۆی توێژینەوەکان')}
    ${sc('ic-gl','⏳',pending,'چاوەڕوانکراو')}
    ${sc('ic-g','✅',approved,'پەسەندکراو')}
  `;

  // ── Dept cards ────────────────────────────────────────
  document.getElementById('aDeptCards').innerHTML=['WEB','NET','PROGRAM'].map(d=>{
    const dr=allRes.filter(r=>r.userDept===d);
    const cl=d==='WEB'?'dsc-web':d==='NET'?'dsc-net':'dsc-prg';
    const ll=d==='WEB'?'lw':d==='NET'?'ln':'lp';
    const nl=d==='WEB'?'nw':d==='NET'?'nn':'np';
    const pct=dr.length>0?Math.round(dr.filter(r=>r.status==='approved').length/dr.length*100):0;
    const dstu=allUsers.filter(u=>u.role==='student'&&u.dept===d).length;
    const dtea=allUsers.filter(u=>(u.role==='teacher'||u.role==='chair')&&u.dept===d).length;
    return `<div class="dsc ${cl}" onclick="filterByDept('${d}')">
      <div class="dsc-lbl ${ll}">${deptFull(d)} — ${d}</div>
      <div class="dsc-num ${nl}">${dr.length}</div>
      <div class="dsc-sub">✅ ${dr.filter(r=>r.status==='approved').length} &nbsp;|&nbsp; ⏳ ${dr.filter(r=>r.status==='pending').length} &nbsp;|&nbsp; 🎓 ${dstu} &nbsp;|&nbsp; 🧑‍🏫 ${dtea}</div>
      <div class="dsc-bar"><div class="dsc-bar-fill" style="width:${pct}%;background:${d==='WEB'?'#7c3aed':d==='NET'?'#0891b2':'#dc2626'}"></div></div>
      <div style="font-size:.67rem;color:var(--muted);margin-top:4px">${pct}% پەسەندکراو</div>
    </div>`;
  }).join('');

  // ── Teachers list ─────────────────────────────────────
  const teachEl=document.getElementById('aTeachersList');
  if(teachEl){
    const tlist=allUsers.filter(u=>u.role==='teacher'||u.role==='chair'||u.role==='supervisor'||u.role==='academic').sort((a,b)=>(a.dept||'').localeCompare(b.dept||''));
    if(!tlist.length){
      teachEl.innerHTML=`<div class="empty"><div class="ei">👤</div><p>هیچ مامۆستایەک نییە</p></div>`;
    } else {
      teachEl.innerHTML=tlist.map(u=>{
        const resCount=allRes.filter(r=>r.userDept===u.dept).length;
        return `<div class="people-item" onclick="openStuModal('${u.id}')">
          <div class="pi-avatar pi-tea">${(u.name||'?')[0]}</div>
          <div class="pi-body">
            <div class="pi-name">${u.name||'-'}</div>
            <div class="pi-meta">
              ${deptBadge(u.dept)}
              <span class="badge b-${u.role==='chair'?'chair':'member'}">${roleLbl(u.role)}</span>
            </div>
          </div>
          <div class="pi-count">${resCount}<span>توێژینەوە</span></div>
        </div>`;
      }).join('');
    }
  }

  // ── Students list ─────────────────────────────────────
  const stuEl=document.getElementById('aStudentsList');
  if(stuEl){
    const slist=allUsers.filter(u=>u.role==='student').sort((a,b)=>(a.dept||'').localeCompare(b.dept||''));
    if(!slist.length){
      stuEl.innerHTML=`<div class="empty"><div class="ei">🎓</div><p>هیچ خوێندکارێک نییە</p></div>`;
    } else {
      stuEl.innerHTML=slist.map(u=>{
        const myRes=allRes.filter(r=>r.userId===u.id);
        const approved=myRes.filter(r=>r.status==='approved').length;
        return `<div class="people-item" onclick="openStuModal('${u.id}')">
          <div class="pi-avatar pi-stu">${(u.name||'?')[0]}</div>
          <div class="pi-body">
            <div class="pi-name">${u.name||'-'}</div>
            <div class="pi-meta">
              ${deptBadge(u.dept)}
              ${u.studentId?`<span style="font-size:.7rem;color:var(--muted)">${u.studentId}</span>`:''}
            </div>
          </div>
          <div class="pi-count ${approved>0?'pi-ok':''}">
            ${myRes.length}<span>توێژینەوە</span>
            ${approved>0?`<span class="pi-apv">✅${approved}</span>`:''}
          </div>
        </div>`;
      }).join('');
    }
  }

  // ── Recent Activity ───────────────────────────────────
  const recentEl=document.getElementById('aRecentActivity');
  if(recentEl){
    const recent=[...allRes].sort((a,b)=>b.submittedAt-a.submittedAt).slice(0,8);
    if(!recent.length){
      recentEl.innerHTML=`<div class="empty"><div class="ei">📭</div><p>هیچ کاریەک نییە</p></div>`;
    } else {
      recentEl.innerHTML=recent.map(r=>`
        <div class="act-item" onclick="openResModal('${r.id}')">
          <div class="act-ico act-${r.status==='approved'?'ok':r.status==='rejected'?'no':'wait'}">
            ${r.status==='approved'?'✅':r.status==='rejected'?'❌':'📄'}
          </div>
          <div class="act-body">
            <div class="act-ttl">${r.title}</div>
            <div class="act-meta">
              <span>${r.userName||'-'}</span>
              ${deptBadge(r.userDept)}
              <span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span>
            </div>
          </div>
          <div class="act-time">${r.submittedAt?timeAgo(r.submittedAt):''}</div>
        </div>`).join('');
    }
  }

  // ── Pending Quick Approve ─────────────────────────────
  const pendingEl=document.getElementById('aPendingQuick');
  if(pendingEl){
    const pendingItems=allRes.filter(r=>r.status==='pending').slice(0,5);
    if(!pendingItems.length){
      pendingEl.innerHTML=`<div class="empty"><div class="ei">🎉</div><p>هیچ توێژینەوەیەکی چاوەڕوان نییە</p></div>`;
    } else {
      pendingEl.innerHTML=`<div class="pq-list">
        ${pendingItems.map(r=>`
        <div class="pq-item">
          <div class="pq-info">
            <div class="pq-ttl">${r.title}</div>
            <div class="pq-meta">${r.userName||'-'} &nbsp;·&nbsp; ${deptBadge(r.userDept)} &nbsp;·&nbsp; ${r.type||'-'}</div>
          </div>
          <div class="pq-actions">
            <button class="btn-ok" onclick="chStatus('${r.id}','approved','a');event.stopPropagation()">✅ پەسەند</button>
            <button class="btn-red" onclick="chStatus('${r.id}','rejected','a');event.stopPropagation()">❌ ڕەتکردن</button>
            <button class="btn-onav" onclick="openResModal('${r.id}');event.stopPropagation()">بینین</button>
          </div>
        </div>`).join('')}
        ${allRes.filter(r=>r.status==='pending').length>5?`<div style="text-align:center;padding:10px;font-size:.78rem;color:var(--muted)">و ${allRes.filter(r=>r.status==='pending').length-5} تریش... <button class="btn-onav" onclick="showPanel('pn-a-res',document.querySelector('.si:nth-child(2)'))">هەموو ببینە</button></div>`:''}
      </div>`;
    }
  }
}

function timeAgo(ts){
  const diff = Date.now()-ts;
  const m=Math.floor(diff/60000), h=Math.floor(diff/3600000), d=Math.floor(diff/86400000);
  if(d>0) return d+'ڕۆژ';
  if(h>0) return h+'سەعات';
  if(m>0) return m+'خولەک';
  return 'ئێستا';
}

function startAdminClock(){
  const el=document.getElementById('adminDateTime');
  if(!el) return;
  function update(){
    const n=new Date();
    el.innerHTML=`<div class="admin-clock">${n.toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}</div>
    <div class="admin-date">${n.toLocaleDateString('ar-IQ',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>`;
  }
  update(); setInterval(update,1000);
}

function filterByDept(d){
  document.getElementById('aDeptF').value=d;
  showPanel('pn-a-res',document.querySelector('.si:nth-child(2)'));
  renderATbl();
}

function renderATbl(){
  const tbody=document.getElementById('aTbody');
  const q=gv('aSrch').toLowerCase();
  const dept=document.getElementById('aDeptF')?.value||'all';
  let items=allRes;
  if(aFilter!=='all') items=items.filter(r=>r.status===aFilter);
  if(dept!=='all') items=items.filter(r=>r.userDept===dept);
  if(q) items=items.filter(r=>r.title?.toLowerCase().includes(q)||r.userName?.toLowerCase().includes(q));
  if(!items.length){tbody.innerHTML=`<tr><td colspan="8">${emHTML('📂','نەدۆزرایەوە')}</td></tr>`;return;}
  tbody.innerHTML=items.map((r,i)=>`<tr>
    <td>${i+1}</td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
      <button class="name-link" onclick="openResModal('${r.id}')">${r.title}</button>
    </td>
    <td><button class="name-link" onclick="openStuModal('${r.userId}')">${r.userName||'-'}</button></td>
    <td><span class="badge b-${(r.userDept||'').toLowerCase().replace('program','prg')}">${r.userDept||'-'}</span></td>
    <td>${r.type||'-'}</td>
    <td>${r.score?`<span style="color:var(--green);font-weight:700">${r.score}</span>`:'-'}</td>
    <td><span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span></td>
    <td>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn-onav" onclick="openResModal('${r.id}')">بینین</button>
        ${r.status!=='approved'?`<button class="btn-ok" onclick="chStatus('${r.id}','approved','a')">✅</button>`:''}
        ${r.status!=='rejected'?`<button class="btn-red" onclick="chStatus('${r.id}','rejected','a')">❌</button>`:''}
        <button class="btn-red" onclick="delRes('${r.id}')">🗑</button>
      </div>
    </td>
  </tr>`).join('');
}

function setAF(f,el){aFilter=f;document.querySelectorAll('#aChips .chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');renderATbl();}

/* ═══════════════════════════════════
   ADMIN: USERS TABLE
═══════════════════════════════════ */
function renderUTbl(){
  const tbody=document.getElementById('uTbody');
  const q=gv('uSrch').toLowerCase();
  const rf=document.getElementById('uRoleF')?.value||'all';
  let items=allUsers;
  if(rf!=='all') items=items.filter(u=>u.role===rf);
  if(q) items=items.filter(u=>u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q));
  if(!items.length){tbody.innerHTML=`<tr><td colspan="6">${emHTML('👥','نەدۆزرایەوە')}</td></tr>`;return;}
  tbody.innerHTML=items.map((u,i)=>`<tr>
    <td>${i+1}</td>
    <td><button class="name-link" onclick="openStuModal('${u.id}')">${u.name||'-'}</button></td>
    <td style="direction:ltr;text-align:right;font-size:.78rem">${u.email||'-'}</td>
    <td>${roleBadge(u.role)}</td>
    <td>${u.dept?`<span class="badge b-${u.dept.toLowerCase().replace('program','prg')}">${u.dept}</span>`:'-'}</td>
    <td><button class="btn-red" onclick="delUser('${u.id}')">🗑</button></td>
  </tr>`).join('');
}

async function delUser(id){
  if(!confirm('دڵنیای لە سڕینەوەی ئەم بەکارهێنەرە؟')) return;
  try{ await window._remove(window._ref(window._db,'users/'+id)); allUsers=allUsers.filter(u=>u.id!==id); renderUTbl(); buildAdminStats(); }
  catch(e){alert('هەڵە: '+e.message);}
}

async function delRes(id){
  if(!confirm('دڵنیای لە سڕینەوەی توێژینەوەکە؟')) return;
  try{ await window._remove(window._ref(window._db,'researches/'+id)); allRes=allRes.filter(r=>r.id!==id); renderATbl(); buildAdminStats(); }
  catch(e){alert('هەڵە: '+e.message);}
}

/* ═══════════════════════════════════
   ADD STAFF
═══════════════════════════════════ */
async function addStaff(){
  const name=gv('tName'),email=gv('tEmail'),pass=gv('tPass'),dept=gv('tDept'),role=gv('tRole'),mnum=gv('tMemberNum');
  clr(['tAddErr','tAddOk']);
  if(!name||!email||!pass||!dept){sa2('tAddErr','هەموو خانەکان پڕ بکەرەوە','err');return;}
  bl('btnAddT','spAddT',true);
  try{
    const c=await window._createUser(window._auth,email,pass);
    await window._set(window._ref(window._db,'users/'+c.user.uid),{
      name,email,dept,role,memberNum:mnum,level:'-',createdAt:Date.now()
    });
    sa2('tAddOk','✅ زیادکرا: '+name+' ('+roleLbl(role)+'  — '+dept+')','ok');
    ['tName','tEmail','tPass'].forEach(i=>document.getElementById(i).value='');
    await loadAllUsers();
  }catch(e){sa2('tAddErr',feErr(e.code),'err');}
  bl('btnAddT','spAddT',false);
}

/* ═══════════════════════════════════
   MODAL: RESEARCH DETAIL
═══════════════════════════════════ */
async function openResModal(id){
  let r=[...allRes,...teacherRes].find(x=>x.id===id);
  if(!r){
    try{ const s=await window._get(window._ref(window._db,'researches/'+id)); if(s.exists())r={id,...s.val()}; }catch(e){}
  }
  if(!r) return;
  document.getElementById('resModalTitle').textContent=r.title;
  document.getElementById('resModalBody').innerHTML=`
    ${dr('ناونیشان',r.title)}
    ${dr('توێژەر',`<button class="name-link" onclick="openStuModal('${r.userId}');closeMod('resModal')">${r.userName||'-'}</button>`)}
    ${dr('بەش',deptBadge(r.userDept))}
    ${dr('جۆر',r.type||'-')}
    ${dr('ساڵ',r.year||'-')}
    ${dr('سەرپەرشتیار',r.supervisor||'-')}
    ${dr('نمرە',r.score?`<span style="color:var(--green);font-weight:700;font-size:1.1rem">${r.score} / 100</span>`:'هێشتا نەدراوە')}
    ${dr('بار',`<span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span>`)}
    ${r.abstract?dr('کورتە',`<span style="line-height:1.7">${r.abstract}</span>`):''}
    ${r.link?dr('فایلی PDF',`
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <a href="${r.link}" target="_blank" class="btn-pdf-open">📄 کردنەوەی PDF</a>
        <a href="${r.link}" download class="btn-pdf-dl">⬇ داونلۆد</a>
      </div>
      <div class="pdf-preview-wrap">
        <iframe src="${r.link}" class="pdf-iframe" title="PDF Preview"></iframe>
      </div>`):'<span style="color:var(--muted);font-size:.82rem">فایل نەدراوە</span>'}
    ${dr('کات',r.submittedAt?new Date(r.submittedAt).toLocaleDateString('ar-IQ'):'-')}
  `;
  openMod('resModal');
}

/* ═══════════════════════════════════
   MODAL: STUDENT PROFILE (admin/teacher)
═══════════════════════════════════ */
/* ═══════════════════════════════════
   MODAL: TEACHER SCORE (chair clicks staff member)
═══════════════════════════════════ */
async function openTeacherScoreModal(uid){
  try{
    const us=await window._get(window._ref(window._db,'users/'+uid));
    const u=us.exists()?us.val():null;
    if(!u){alert('بەکارهێنەر نەدۆزرایەوە');return;}
    const dept=CUD?.dept||'';
    const resOfDept=[...teacherRes];

    document.getElementById('stuModalTitle').textContent='📋 نمرەکانی: '+u.name;
    document.getElementById('stuModalBody').innerHTML=`
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#059669,#047857);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#fff;flex-shrink:0">${(u.name||'?')[0]}</div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--navy)">${u.name}</div>
          <div style="font-size:.78rem;color:var(--muted)">${u.email||''}</div>
          <div style="margin-top:4px">${roleBadge(u.role)} ${deptBadge(u.dept)}</div>
        </div>
      </div>
      <div style="background:rgba(37,99,235,.07);border:1px solid rgba(37,99,235,.18);border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#1e40af;line-height:1.7">
        🏅 نمرەی ئەم ستافە بۆ هەر توێژینەوەیەک داننێ — نمرەی کۆتایی خوێندکار <strong>مامناوەندی</strong> نمرەی هەموو ئەندامەکانە.
      </div>
      <div class="s-section">
        <div class="s-sec-ttl">📚 نمرەدان بۆ توێژینەوەکانی بەش (${resOfDept.length})</div>
        ${resOfDept.length===0
          ?'<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:14px">هیچ توێژینەوەیەک نییە</p>'
          :resOfDept.map(r=>{
              const myScore=r.memberScores&&r.memberScores[uid]!==undefined?r.memberScores[uid]:'';
              const finalScore=r.finalScore||r.score||'';
              const mCount=r.memberScores?Object.keys(r.memberScores).length:0;
              return `<div class="res-item">
                <div class="res-item-ttl">${r.title}</div>
                <div class="res-meta">
                  <span>🎓 ${r.userName||'-'}</span>
                  <span>📁 ${r.type||'-'}</span>
                  <span>📅 ${r.year||'-'}</span>
                  <span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span>
                  ${finalScore?`<span style="color:var(--green);font-weight:700">کۆتایی: 🏅${finalScore}</span>`:''}
                  ${mCount>0?`<span style="color:var(--muted);font-size:.72rem">(${mCount} ئەندام نمرەیان داوە)</span>`:''}
                </div>
                <div class="res-score-row" style="margin-top:8px">
                  <span style="font-size:.8rem;color:var(--muted);font-weight:600">نمرەی ${u.name}:</span>
                  <input class="score-inp" type="number" min="0" max="100"
                    value="${r.memberScores&&r.memberScores[uid]!==undefined?r.memberScores[uid]:''}"
                    id="ms-${r.id}-${uid}" placeholder="0-100"
                    onkeydown="if(event.key==='Enter')saveMemberScore('${r.id}','${uid}')">
                  <button class="btn-ok" onclick="saveMemberScore('${r.id}','${uid}')">✓ پاشەکەوت</button>
                </div>
              </div>`;
            }).join('')
        }
      </div>`;
    openMod('stuModal');
  }catch(e){alert('هەڵە: '+e.message);}
}

async function saveMemberScore(resId,uid){
  const inp=document.getElementById('ms-'+resId+'-'+uid);
  if(!inp) return;
  const val=inp.value;
  if(val===''||isNaN(val)) return;
  const score=Math.min(100,Math.max(0,parseInt(val)));
  try{
    await window._update(window._ref(window._db,'researches/'+resId+'/memberScores'),{[uid]:score});
    // نمرەی کۆتایی حیساب بکە
    const s=await window._get(window._ref(window._db,'researches/'+resId+'/memberScores'));
    if(s.exists()){
      const scores=Object.values(s.val()).map(Number).filter(v=>!isNaN(v));
      if(scores.length){
        const avg=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
        await window._update(window._ref(window._db,'researches/'+resId),{finalScore:avg,score:avg});
        const item=[...teacherRes,...allRes].find(r=>r.id===resId);
        if(item){item.finalScore=avg;item.score=avg;}
      }
    }
    // local cache
    const item=[...teacherRes,...allRes].find(r=>r.id===resId);
    if(item){if(!item.memberScores)item.memberScores={};item.memberScores[uid]=score;}
    inp.style.borderColor='var(--green)';
    setTimeout(()=>{inp.style.borderColor='';},1500);
    renderTbl(); renderATbl();
  }catch(e){alert('هەڵەی پاشەکەوتکردن: '+e.message);}
}

/* ═══════════════════════════════════
   MODAL: STUDENT PROFILE
═══════════════════════════════════ */
async function openStuModal(uid){
  try{
    const us=await window._get(window._ref(window._db,'users/'+uid));
    const u=us.exists()?us.val():null;
    if(!u){alert('بەکارهێنەر نەدۆزرایەوە');return;}
    // ئەگەر ستافە — مۆدالی نمرەدان بکەرەوە
    if(u.role==='teacher'||u.role==='chair'||u.role==='supervisor'||u.role==='academic'){
      openTeacherScoreModal(uid); return;
    }
    const rs=await window._get(window._ref(window._db,'researches'));
    const ures=rs.exists()?Object.entries(rs.val()).map(([id,v])=>({id,...v})).filter(r=>r.userId===uid).sort((a,b)=>b.submittedAt-a.submittedAt):[];
    const isChairViewing=CUD?.role==='chair'||CUD?.role==='admin';

    document.getElementById('stuModalTitle').textContent='🎓 پرۆفایلی: '+u.name;
    document.getElementById('stuModalBody').innerHTML=`
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--blue));display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;flex-shrink:0">${(u.name||'؟')[0]}</div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--navy)">${u.name||'-'}</div>
          <div style="font-size:.78rem;color:var(--muted);margin-top:2px">${u.email||'-'}</div>
          <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
            ${u.dept?deptBadge(u.dept):''}
            <span class="badge b-p">قۆناغی ${u.level||'-'}</span>
          </div>
        </div>
      </div>
      ${dr('ژمارەی خوێندکاری',u.studentId||'-')}
      ${dr('بەش',deptFull(u.dept))}
      ${dr('کاتی تۆمارکردن',u.createdAt?new Date(u.createdAt).toLocaleDateString('ar-IQ'):'-')}
      <div class="s-section">
        <div class="s-sec-ttl">📚 توێژینەوەکان (${ures.length})</div>
        ${ures.length===0?'<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:10px">هیچ توێژینەوەیەک نییە</p>':
          ures.map(r=>{
            const finalScore=r.finalScore||r.score||null;
            const mScores=r.memberScores?Object.values(r.memberScores):[];
            return `<div class="res-item">
              <div class="res-item-ttl">${r.title}</div>
              <div class="res-meta">
                <span>📁 ${r.type||'-'}</span>
                <span>📅 ${r.year||'-'}</span>
                ${r.supervisor?`<span>👨‍🏫 ${r.supervisor}</span>`:''}
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:6px">
                <span class="badge b-${r.status==='approved'?'a':r.status==='rejected'?'r':'p'}">${stLbl(r.status)}</span>
                ${finalScore?`<span style="color:var(--green);font-weight:900;font-size:1.05rem">🏅 نمرەی کۆتایی: ${finalScore}/100</span>`
                            :'<span style="color:var(--muted);font-size:.8rem">نمرەی کۆتایی نەدراوە</span>'}
              </div>
              ${mScores.length>0?`
              <div style="margin-top:8px;background:var(--bg);border-radius:8px;padding:8px 12px">
                <div style="font-size:.73rem;color:var(--muted);font-weight:600;margin-bottom:5px">📊 نمرەی ئەندامەکان:</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px">
                  ${mScores.map(sc=>`<span style="background:#fff;border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:.8rem;font-weight:700">${sc}<span style="color:var(--muted);font-weight:400">/100</span></span>`).join('')}
                </div>
              </div>`:''}
              ${isChairViewing?`
              <div class="res-score-row" style="margin-top:10px">
                <span style="font-size:.78rem;color:var(--muted)">نمرەی کۆتایی دەستکاری:</span>
                <input class="score-inp" type="number" min="0" max="100" value="${finalScore||''}" id="sm-sc-${r.id}" placeholder="0-100">
                <button class="btn-ok" onclick="saveScoreModal('${r.id}')">✓</button>
                ${r.link?`<a href="${r.link}" target="_blank" class="btn-pdf-open" style="font-size:.75rem;padding:4px 10px">📄 PDF</a>`:''}
              </div>
              ${r.link?`<div class="pdf-preview-wrap" style="margin-top:10px"><iframe src="${r.link}" class="pdf-iframe" title="PDF"></iframe></div>`:''}
              `:''}
            </div>`;
          }).join('')}
      </div>`;
    openMod('stuModal');
  }catch(e){alert('هەڵە: '+e.message);}
}

async function saveScoreModal(id){
  const val=document.getElementById('sm-sc-'+id)?.value;
  if(val===''||isNaN(val)) return;
  const score=Math.min(100,Math.max(0,parseInt(val)));
  try{
    await window._update(window._ref(window._db,'researches/'+id),{score,finalScore:score});
    [teacherRes,allRes].forEach(arr=>{const it=arr.find(r=>r.id===id);if(it){it.score=score;it.finalScore=score;}});
    const el=document.getElementById('sm-sc-'+id);
    if(el){el.style.borderColor='var(--green)';setTimeout(()=>el.style.borderColor='',1500);}
    renderTbl(); renderATbl();
  }catch(e){alert('هەڵە: '+e.message);}
}

/* ═══════════════════════════════════
   MODAL HELPERS
═══════════════════════════════════ */
function openMod(id){ document.getElementById(id)?.classList.add('on'); }
function closeMod(id,e){ if(!e||e.target===document.getElementById(id)) document.getElementById(id)?.classList.remove('on'); }

/* ═══════════════════════════════════
   HELPERS
═══════════════════════════════════ */
function gv(id){return (document.getElementById(id)?.value||'').trim();}
function show(id){document.getElementById(id)?.classList.add('on');}
function hide(id){document.getElementById(id)?.classList.remove('on');}
function bl(btn,sp,on){const b=document.getElementById(btn);const s=document.getElementById(sp);if(b)b.disabled=on;if(s)s.style.display=on?'inline-block':'none';}

// auth alerts (white on dark)
function sa(id,msg,t){const el=document.getElementById(id);if(!el)return;el.textContent=msg;el.className='al '+(t==='ok'?'al-ok':'al-err')+' on';setTimeout(()=>el.classList.remove('on'),5000);}
// app alerts (coloured on white)
function sa2(id,msg,t){const el=document.getElementById(id);if(!el)return;el.textContent=msg;el.className='al2 '+(t==='ok'?'al2-ok':'al2-err')+' on';setTimeout(()=>el.classList.remove('on'),5000);}
function clr(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});}

function stLbl(s){return s==='approved'?'پەسەندکراو':s==='rejected'?'ڕەتکراوەتەوە':'چاوەڕوانکراو';}
function roleLbl(r){return r==='admin'?'بەڕێوەبەر':r==='chair'?'سەرۆکی لیژنە':r==='teacher'?'ئەندامی لیژنە':r==='supervisor'?'سەرپەرشتیاری توێژینەوە':r==='academic'?'مامۆستای ئەکادیمی':'خوێندکار';}
function deptFull(d){return d==='WEB'?'ووێب':d==='NET'?'نیتۆرک':d==='PROGRAM'?'پرۆگرامینگ':d||'-';}
function emHTML(ico,msg){return `<div class="empty"><div class="ei">${ico}</div><p>${msg}</p></div>`;}
function sc(cls,ico,num,lbl){return `<div class="sc"><div class="sc-ico ${cls}">${ico}</div><div><div class="sc-num">${num}</div><div class="sc-lbl">${lbl}</div></div></div>`;}
function dr(l,v){return `<div class="dr"><span class="dl">${l}:</span><span class="dv">${v}</span></div>`;}
function deptBadge(d){if(!d)return '-';const c=d==='WEB'?'b-web':d==='NET'?'b-net':'b-prg';return `<span class="badge ${c}">${d}</span>`;}
function roleBadge(r){const m={'admin':'b-chair','chair':'b-chair','teacher':'b-member','supervisor':'b-supervisor','academic':'b-academic','student':'b-p'};return `<span class="badge ${m[r]||'b-p'}">${roleLbl(r)}</span>`;}

function feErr(code){
  const m={'auth/email-already-in-use':'ئەم ئیمەیلە پێشتر بەکارهاتووە','auth/invalid-email':'ئیمەیلی نادروست','auth/weak-password':'پاسوۆرد نەرمە','auth/user-not-found':'بەکارهێنەر نەدۆزرایەوە','auth/wrong-password':'پاسوۆرد هەڵەیە','auth/too-many-requests':'زۆر هەوڵ، کەمێ چاوەڕوان بکە','auth/network-request-failed':'هەڵەی تۆڕ','auth/invalid-credential':'ئیمەیل یان پاسوۆرد هەڵەیە'};
  return m[code]||'هەڵە: '+code;
}
