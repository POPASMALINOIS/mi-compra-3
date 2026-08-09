(()=>{
  const STORAGE='mc3_code';
  const NEW_SENTINEL='__MC3_NEW__';
  const API='https://khjuxuawpnfrtnsgxvaw.supabase.co/rest/v1';
  const KEY='sb_publishable_d1yDwGba4RoZ557lfAIqlA_BznMGiej';
  const H={'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json'};
  const STORE_NAMES=['Carrefour','Lidl','Ahorramas','Alcampo','Mercadona','Dia','Family Cash','Aldi'];

  const firstRun=!localStorage.getItem(STORAGE);
  if(firstRun) localStorage.setItem(STORAGE,NEW_SENTINEL);

  async function req(path,opts={}){
    const r=await fetch(API+path,{...opts,headers:{...H,...(opts.headers||{})}});
    const text=await r.text();
    if(!r.ok) throw new Error(text||('HTTP '+r.status));
    return text?JSON.parse(text):null;
  }
  function normaliseCode(v){return String(v||'').trim().toUpperCase();}
  async function exists(code){
    const rows=await req('/households?select=id&pairing_code=eq.'+encodeURIComponent(code)+'&limit=1');
    return !!rows?.length;
  }
  async function uniqueCode(){
    for(let i=0;i<12;i++){
      const code='CASA-'+String(Math.floor(100000+Math.random()*900000));
      if(!(await exists(code))) return code;
    }
    throw new Error('No se pudo generar un código único');
  }
  async function createHousehold(){
    const code=await uniqueCode();
    const rows=await req('/households',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:'Casa',code,pairing_code:code})});
    const house=rows?.[0];
    if(!house?.id) throw new Error('No se pudo crear la lista');
    await req('/stores',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(STORE_NAMES.map((name,sort_order)=>({household_id:house.id,name,sort_order})))});
    localStorage.setItem(STORAGE,code);
    return code;
  }
  async function linkHousehold(code){
    code=normaliseCode(code);
    if(!/^CASA-[A-Z0-9]{4,10}$/.test(code)) throw new Error('Código no válido');
    if(!(await exists(code))) throw new Error('Código no encontrado');
    localStorage.setItem(STORAGE,code);
    return code;
  }
  function css(){
    const s=document.createElement('style');
    s.textContent=`
      .mc3-onboard{position:fixed;z-index:9999;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;padding:26px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;color:#171717}
      .mc3-onboard-card{width:min(430px,100%);text-align:center}
      .mc3-mark{width:96px;height:96px;margin:0 auto 22px;border-radius:25px;background:#f6faf7;display:grid;place-items:center;font-size:52px;box-shadow:0 8px 30px #0000000d}
      .mc3-onboard h1{font-size:38px;line-height:1;letter-spacing:-1.5px;margin:0 0 12px}.mc3-onboard p{color:#777;font-size:17px;line-height:1.45;margin:0 auto 27px;max-width:360px}
      .mc3-o-btn{width:100%;border:0;border-radius:17px;padding:16px 18px;font-size:17px;font-weight:800;margin:6px 0;cursor:pointer}.mc3-o-primary{background:#16a052;color:#fff}.mc3-o-secondary{background:#f1f3f2;color:#171717}
      .mc3-pair{display:none;margin-top:18px;padding-top:18px;border-top:1px solid #eee}.mc3-pair.show{display:block}.mc3-pair input{width:100%;border:1px solid #ddd;border-radius:15px;padding:15px;text-align:center;text-transform:uppercase;font:800 19px ui-monospace,monospace;letter-spacing:.6px;outline:none;margin-bottom:8px}
      .mc3-o-status{min-height:22px;color:#777;margin-top:9px;font-size:14px}.mc3-created{background:#eef9f2;border-radius:20px;padding:18px;margin:16px 0}.mc3-created-code{font:900 25px ui-monospace,monospace;color:#118743;letter-spacing:1px;margin:7px 0}.mc3-note{font-size:13px!important;margin:8px 0 0!important}
    `;
    document.head.appendChild(s);
  }
  function mount(){
    if(!firstRun && localStorage.getItem(STORAGE)!==NEW_SENTINEL) return;
    css();
    const o=document.createElement('div');o.className='mc3-onboard';
    o.innerHTML=`<div class="mc3-onboard-card"><div class="mc3-mark">🛒</div><h1>Mi Compra</h1><p>Crea una lista nueva para tu casa o entra con el código de una lista que ya compartes.</p><button class="mc3-o-btn mc3-o-primary" id="mc3-create">Crear mi lista</button><button class="mc3-o-btn mc3-o-secondary" id="mc3-have">Ya tengo un código</button><div class="mc3-pair" id="mc3-pair"><input id="mc3-code" autocomplete="off" placeholder="CASA-123456"><button class="mc3-o-btn mc3-o-primary" id="mc3-link">Entrar con este código</button></div><div class="mc3-o-status" id="mc3-status"></div></div>`;
    document.body.appendChild(o);
    const status=o.querySelector('#mc3-status'),create=o.querySelector('#mc3-create'),have=o.querySelector('#mc3-have'),pair=o.querySelector('#mc3-pair'),input=o.querySelector('#mc3-code'),link=o.querySelector('#mc3-link');
    have.onclick=()=>{pair.classList.add('show');input.focus()};
    create.onclick=async()=>{
      create.disabled=true;have.disabled=true;status.textContent='Creando tu lista…';
      try{
        const code=await createHousehold();
        o.querySelector('.mc3-onboard-card').innerHTML=`<div class="mc3-mark">✓</div><h1>Lista creada</h1><p>Este es tu código privado para compartir la misma lista con otros móviles.</p><div class="mc3-created"><div>Tu código</div><div class="mc3-created-code">${code}</div><p class="mc3-note">Guárdalo. Quien tenga este código podrá entrar en esta lista.</p></div><button class="mc3-o-btn mc3-o-primary" id="mc3-go">Entrar en Mi Compra</button>`;
        o.querySelector('#mc3-go').onclick=()=>location.reload();
      }catch(e){status.textContent='No se pudo crear la lista. Inténtalo de nuevo.';create.disabled=false;have.disabled=false}
    };
    link.onclick=async()=>{
      link.disabled=true;status.textContent='Comprobando código…';
      try{await linkHousehold(input.value);location.reload()}catch(e){status.textContent=e.message||'Código no válido';link.disabled=false}
    };
    input.addEventListener('keydown',e=>{if(e.key==='Enter')link.click()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();