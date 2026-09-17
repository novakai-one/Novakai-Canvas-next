export async function capture(page) {
  const out='output/playwright/nested-wires/presentation/m9d/';
  const images=IMAGES;
  await page.setViewportSize({width:1920,height:1440});
  await page.setContent(`<html><head><style>body{margin:0;background:#fff;color:#202b36;font:16px Arial}main{display:flex;gap:20px;padding:10px}section{width:940px}h2{margin:4px 0 8px;font-size:22px}p{margin:8px 0}.overview{width:940px;height:705px}.detail{width:940px;height:615px;overflow:hidden;border-top:1px solid #d9e0e8}.detail img{width:1920px;max-width:none;transform:translate(-240px,-170px)}</style></head><body><main>${images.map(({name,url})=>`<section><h2>${name[0].toUpperCase()+name.slice(1)} · same scene and camera</h2><img class="overview" src="${url}"><p>Overview above · actual-size detail below</p><div class="detail"><img src="${url}"></div></section>`).join('')}</main></body></html>`);
  await page.locator('img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));
  await page.screenshot({path:out+'compact-vs-expanded.png'});
  const svg=SVG;
  await page.setContent(`<body style="margin:0;background:white"><img style="width:1920px;height:1440px;object-fit:contain" src="${svg}"></body>`);
  await page.locator('img').evaluate(x=>x.decode());
  await page.screenshot({path:out+'export-preview.png'});
  return {viewport:{width:1920,height:1440},comparison:'Two unmodified full screenshots at half scale plus actual-size crops; same scene and camera; chrome shifts canvas origin only',export:'Actual native SVG rendered by headless Chromium'};
}
