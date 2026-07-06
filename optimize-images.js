// Verkleint grote foto's in de gebouwde site (_site) ná de build.
// De bronbestanden in de repo blijven ongewijzigd; enkel wat gepubliceerd
// wordt, wordt geoptimaliseerd. Zo blijven pagina's snel, ook als het comité
// grote gsm-foto's uploadt via het CMS.

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = "_site/images";
const MAX_BREEDTE = 1600;   // px — ruim genoeg voor volledige weergave
const KWALITEIT = 80;       // JPEG-kwaliteit

function verzamel(dir, uit) {
  if (!fs.existsSync(dir)) return;
  for (const naam of fs.readdirSync(dir)) {
    const p = path.join(dir, naam);
    if (fs.statSync(p).isDirectory()) verzamel(p, uit);
    else if (/\.(jpe?g|png)$/i.test(p)) uit.push(p);
  }
}

(async () => {
  const bestanden = [];
  verzamel(ROOT, bestanden);
  let aantal = 0;

  for (const p of bestanden) {
    try {
      const meta = await sharp(p).metadata();
      if (!meta.width || meta.width <= MAX_BREEDTE) continue;

      const isPng = /\.png$/i.test(p);
      let pijp = sharp(p).resize({ width: MAX_BREEDTE, withoutEnlargement: true });
      pijp = isPng ? pijp.png({ compressionLevel: 9 }) : pijp.jpeg({ quality: KWALITEIT });
      const buffer = await pijp.toBuffer();
      fs.writeFileSync(p, buffer);

      aantal++;
      console.log(`  verkleind: ${p}  (${meta.width}px -> ${MAX_BREEDTE}px)`);
    } catch (e) {
      console.warn(`  overslaan ${p}: ${e.message}`);
    }
  }
  console.log(`Foto-optimalisatie klaar: ${aantal} foto('s) verkleind.`);
})();
