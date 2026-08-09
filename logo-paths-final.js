(()=>{
  const ASSET_LOGOS={
    Carrefour:'./assets/carrefour.webp?v=20260809-final2',
    Lidl:'./assets/lidl.png?v=20260809-final2',
    Ahorramas:'./assets/ahorramas.webp?v=20260809-final2',
    Alcampo:'./assets/alcampo.webp?v=20260809-final2',
    Mercadona:'./assets/mercadona.png?v=20260809-final2',
    Dia:'./assets/dia.png?v=20260809-final2',
    'Family Cash':'./assets/family-cash.webp?v=20260809-final2',
    Aldi:'./assets/aldi.png?v=20260809-final2'
  };
  for(const [name,path] of Object.entries(ASSET_LOGOS)){
    if(typeof LOGOS!=='undefined' && LOGOS[name]) LOGOS[name]=()=>path;
  }
})();