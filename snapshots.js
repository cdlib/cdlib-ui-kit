const PercyScript = require('@percy/script');

PercyScript.run(async (page, percySnapshot) => {
  await page.goto('http://localhost:8080/components/preview/test.html');
  await page.evaluateHandle('document.fonts.ready');
  await percySnapshot('Toolkit Tests Page');
});
