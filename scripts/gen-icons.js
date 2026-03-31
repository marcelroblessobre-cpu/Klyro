// Script para generar iconos SVG para la PWA
// Los iconos PNG reales se generan con sharp si está disponible,
// si no se usan SVG que los navegadores modernos aceptan

const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

// SVG icon - K sobre fondo negro con acento verde lima
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#111111"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" 
    font-family="Arial Black, sans-serif" font-weight="900" 
    font-size="${size * 0.58}" fill="#C8F135">K</text>
</svg>`

fs.writeFileSync(path.join(dir, 'icon-192.svg'), svg(192))
fs.writeFileSync(path.join(dir, 'icon-512.svg'), svg(512))

// También copiar como PNG placeholder (los navegadores modernos aceptan SVG en manifest)
// Para PNG reales, instalar sharp: npm install sharp --save-dev
// y ejecutar: node scripts/gen-icons.js
try {
  const sharp = require('sharp')
  ;[192, 512].forEach(size => {
    sharp(Buffer.from(svg(size)))
      .png()
      .toFile(path.join(dir, `icon-${size}.png`))
      .then(() => console.log(`icon-${size}.png generado`))
  })
} catch {
  // Si no hay sharp, copiamos los SVG como PNG (funciona en la mayoría de navegadores)
  fs.copyFileSync(path.join(dir, 'icon-192.svg'), path.join(dir, 'icon-192.png'))
  fs.copyFileSync(path.join(dir, 'icon-512.svg'), path.join(dir, 'icon-512.png'))
  console.log('Iconos SVG copiados como PNG (instala sharp para PNG reales)')
}
