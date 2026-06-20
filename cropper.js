const canvas = document.getElementById('view-canvas');
const ctx = canvas.getContext('2d');
const magnifier = document.getElementById('magnifier');
const magCanvas = document.getElementById('mag-canvas');
const magCtx = magCanvas.getContext('2d');
const magText = document.getElementById('mag-text');

let screenshotImg = new Image();
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let dpr = window.devicePixelRatio || 1;

let isFrozen = false;
let croppedRect = null;
let mouseOnScreen = false;

// Monitor mouse entering and leaving the window boundaries
window.addEventListener('mouseenter', () => {
  mouseOnScreen = true;
  draw();
});

window.addEventListener('mouseleave', () => {
  mouseOnScreen = false;
  magnifier.style.display = 'none';
  draw();
});

const quickMenu = document.getElementById('quick-menu');
const btnEditor = document.getElementById('menu-editor');
const btnClipboard = document.getElementById('menu-clipboard');
const btnDesktop = document.getElementById('menu-desktop');
const btnPrint = document.getElementById('menu-print');

// Magnifier Canvas dimensions & Zoom state
const MAG_SIZE = 130;
magCanvas.width = MAG_SIZE;
magCanvas.height = MAG_SIZE;
let zoomPixels = 16; // default zoom width in physical pixels (approx 8x zoom)

const cropperTranslations = {
  en: {
    'menu-editor': 'Open in Editor',
    'menu-clipboard': 'Copy to Clipboard',
    'menu-desktop': 'Save to Desktop',
    'menu-print': 'Print',
    'hint-overlay': 'Drag to crop | Esc to cancel'
  },
  pt: {
    'menu-editor': 'Abrir no Editor',
    'menu-clipboard': 'Copiar para a Área de Transferência',
    'menu-desktop': 'Salvar na Área de Trabalho',
    'menu-print': 'Imprimir',
    'hint-overlay': 'Arraste para cortar | Esc para cancelar'
  }
};

function applyTranslations(lang) {
  const t = cropperTranslations[lang] || cropperTranslations.en;
  
  const menuEditor = document.querySelector('#menu-editor span');
  const menuClipboard = document.querySelector('#menu-clipboard span');
  const menuDesktop = document.querySelector('#menu-desktop span');
  const menuPrint = document.querySelector('#menu-print span');
  const hintOverlay = document.querySelector('#hint-overlay span');

  if (menuEditor) menuEditor.textContent = t['menu-editor'];
  if (menuClipboard) menuClipboard.textContent = t['menu-clipboard'];
  if (menuDesktop) menuDesktop.textContent = t['menu-desktop'];
  if (menuPrint) menuPrint.textContent = t['menu-print'];
  if (hintOverlay) hintOverlay.textContent = t['hint-overlay'];
}

// Listen for screenshot from Main Process
window.api.onCaptureImage((dataUrl, lang) => {
  applyTranslations(lang || 'en');
  screenshotImg.src = dataUrl;
  screenshotImg.onload = () => {
    resizeCanvas();
    draw();
  };
});

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  if (screenshotImg.src) {
    resizeCanvas();
    draw();
  }
});

// Event Listeners
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Left click only
  
  if (isFrozen) {
    // If click is outside the quick menu, cancel freeze and start new drag
    if (!quickMenu.contains(e.target)) {
      isFrozen = false;
      croppedRect = null;
      quickMenu.style.display = 'none';
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = e.clientX;
      currentY = e.clientY;
      draw();
      updateMagnifier(e.clientX, e.clientY);
    }
    return;
  }

  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
  draw();
});

window.addEventListener('mousemove', (e) => {
  if (isFrozen) return;
  mouseOnScreen = true;
  currentX = e.clientX;
  currentY = e.clientY;
  
  if (screenshotImg.src) {
    draw();
    updateMagnifier(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', (e) => {
  if (isFrozen) return;
  if (!isDragging) return;
  isDragging = false;
  
  const rect = getSelectedRect();
  
  // If the selection is larger than 5x5 pixels, freeze and show menu
  if (rect.w > 5 && rect.h > 5) {
    isFrozen = true;
    croppedRect = rect;
    magnifier.style.display = 'none';
    showQuickMenu(e.clientX, e.clientY);
  } else {
    // Single click/too small crop - redraw clean
    draw();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.api.cancelCrop();
  }
});

function showQuickMenu(x, y) {
  const menuWidth = 240;
  const menuHeight = 160;
  let menuX = x + 10;
  let menuY = y + 10;
  
  // Keep inside screen bounds
  if (menuX + menuWidth > window.innerWidth) {
    menuX = window.innerWidth - menuWidth - 10;
  }
  if (menuY + menuHeight > window.innerHeight) {
    menuY = window.innerHeight - menuHeight - 10;
  }
  
  quickMenu.style.left = `${menuX}px`;
  quickMenu.style.top = `${menuY}px`;
  quickMenu.style.display = 'flex';
}

function getCroppedDataUrl() {
  if (!croppedRect) return null;
  const cropCanvas = document.createElement('canvas');
  const scaleX = screenshotImg.naturalWidth / window.innerWidth;
  const scaleY = screenshotImg.naturalHeight / window.innerHeight;
  
  cropCanvas.width = croppedRect.w * scaleX;
  cropCanvas.height = croppedRect.h * scaleY;
  const cropCtx = cropCanvas.getContext('2d');
  
  cropCtx.drawImage(
    screenshotImg,
    croppedRect.x * scaleX, croppedRect.y * scaleY, croppedRect.w * scaleX, croppedRect.h * scaleY,
    0, 0, croppedRect.w * scaleX, croppedRect.h * scaleY
  );
  return cropCanvas.toDataURL('image/png');
}

btnEditor.addEventListener('click', () => {
  const dataUrl = getCroppedDataUrl();
  if (dataUrl) {
    window.api.cropCompleted(dataUrl, croppedRect.w, croppedRect.h);
  }
});

btnClipboard.addEventListener('click', async () => {
  const dataUrl = getCroppedDataUrl();
  if (dataUrl) {
    await window.api.copyToClipboard(dataUrl);
    window.api.cancelCrop();
  }
});

btnDesktop.addEventListener('click', async () => {
  const dataUrl = getCroppedDataUrl();
  if (dataUrl) {
    await window.api.saveToDesktop(dataUrl);
    window.api.cancelCrop();
  }
});

btnPrint.addEventListener('click', () => {
  const dataUrl = getCroppedDataUrl();
  if (dataUrl) {
    window.api.printImage(dataUrl);
    window.api.cancelCrop();
  }
});

// Scroll to Zoom In / Zoom Out Magnifier
window.addEventListener('wheel', (e) => {
  if (!screenshotImg.src) return;
  
  // deltaY < 0 = Scroll Up = Zoom In (less source pixels displayed)
  // deltaY > 0 = Scroll Down = Zoom Out (more source pixels displayed)
  if (e.deltaY < 0) {
    zoomPixels = Math.max(4, zoomPixels - 2); // Limit zoom in to 4x4 area
  } else {
    zoomPixels = Math.min(64, zoomPixels + 2); // Limit zoom out to 64x64 area
  }
  
  if (screenshotImg.complete) {
    updateMagnifier(currentX, currentY);
  }
});

function getSelectedRect() {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const w = Math.abs(startX - currentX);
  const h = Math.abs(startY - currentY);
  return { x, y, w, h };
}

function draw() {
  if (!screenshotImg.complete) return;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw full screenshot background
  ctx.drawImage(screenshotImg, 0, 0, width, height);
  
  // Draw dark translucent layer
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, width, height);
  
  if (mouseOnScreen) {
    // Draw full-screen dotted cyan crosshair lines (intersecting at currentX, currentY)
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); // dotted lines
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();
    ctx.restore();

    // Draw target crosshair at the cursor
    ctx.save();
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(currentX, currentY, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Draw current coordinate pill next to cursor (e.g. 1032 x 833)
    const coordText = `${Math.round(currentX)} × ${Math.round(currentY)}`;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    const textW = ctx.measureText(coordText).width;
    
    const px = currentX + 12;
    const py = currentY + 4;
    
    // Light mint green background pill
    ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
    ctx.beginPath();
    ctx.roundRect(px, py, textW + 12, 18, 4);
    ctx.fill();
    
    // Border stroke
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, textW + 12, 18);
    
    // Dark green text
    ctx.fillStyle = '#065f46';
    ctx.fillText(coordText, px + 6, py + 13);
    ctx.restore();
  }

  if (isDragging || isFrozen) {
    const rect = getSelectedRect();
    
    // Clear dark overlay for the crop region by redrawing screenshot
    const scaleX = screenshotImg.naturalWidth / window.innerWidth;
    const scaleY = screenshotImg.naturalHeight / window.innerHeight;
    ctx.drawImage(
      screenshotImg,
      rect.x * scaleX, rect.y * scaleY, rect.w * scaleX, rect.h * scaleY, // Source coordinates (physical)
      rect.x, rect.y, rect.w, rect.h // Destination coordinates (logical)
    );
    
    // Draw neon blue border around the cropping area
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    
    // Draw corner guides for a premium design look
    const guideSize = 8;
    ctx.fillStyle = '#00e5ff';
    // Top-left
    ctx.fillRect(rect.x - 1, rect.y - 1, guideSize, 2);
    ctx.fillRect(rect.x - 1, rect.y - 1, 2, guideSize);
    // Top-right
    ctx.fillRect(rect.x + rect.w - guideSize + 1, rect.y - 1, guideSize, 2);
    ctx.fillRect(rect.x + rect.w - 1, rect.y - 1, 2, guideSize);
    // Bottom-left
    ctx.fillRect(rect.x - 1, rect.y + rect.h - 1, guideSize, 2);
    ctx.fillRect(rect.x - 1, rect.y + rect.h - guideSize + 1, 2, guideSize);
    // Bottom-right
    ctx.fillRect(rect.x + rect.w - guideSize + 1, rect.y + rect.h - 1, guideSize, 2);
    ctx.fillRect(rect.x + rect.w - 1, rect.y + rect.h - guideSize + 1, 2, guideSize);

    // Draw dimensions tag (e.g. 800 x 600)
    const tagText = `${rect.w} × ${rect.h}`;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    const tagWidth = ctx.measureText(tagText).width;
    
    ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
    
    // Position tag on top of the selection or inside depending on coordinates
    let tagY = rect.y - 8;
    if (tagY < 20) {
      tagY = rect.y + 18;
    }
    let tagX = rect.x + (rect.w / 2) - (tagWidth / 2) - 8;
    
    // Background pill for dimensions
    ctx.beginPath();
    ctx.roundRect(tagX, tagY - 12, tagWidth + 16, 20, 4);
    ctx.fill();
    
    // Text color
    ctx.fillStyle = '#000000';
    ctx.fillText(tagText, tagX + 8, tagY + 2);
  }
}

function updateMagnifier(mouseX, mouseY) {
  if (!screenshotImg.complete) return;
  
  magCtx.clearRect(0, 0, MAG_SIZE, MAG_SIZE);
  
  const scaleX = screenshotImg.naturalWidth / window.innerWidth;
  const scaleY = screenshotImg.naturalHeight / window.innerHeight;
  
  // Zoom into zoomPixels window of physical pixels
  const zoomSrcX = (mouseX * scaleX) - (zoomPixels / 2);
  const zoomSrcY = (mouseY * scaleY) - (zoomPixels / 2);
  
  magCtx.imageSmoothingEnabled = false;
  magCtx.drawImage(
    screenshotImg,
    zoomSrcX, zoomSrcY, zoomPixels, zoomPixels,
    0, 0, MAG_SIZE, MAG_SIZE
  );
  
  // 1. Draw pixel grid inside magnifier
  const pixelSize = MAG_SIZE / zoomPixels;
  magCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  magCtx.lineWidth = 0.5;
  for (let x = 0; x <= MAG_SIZE; x += pixelSize) {
    magCtx.beginPath();
    magCtx.moveTo(x, 0);
    magCtx.lineTo(x, MAG_SIZE);
    magCtx.stroke();
  }
  for (let y = 0; y <= MAG_SIZE; y += pixelSize) {
    magCtx.beginPath();
    magCtx.moveTo(0, y);
    magCtx.lineTo(MAG_SIZE, y);
    magCtx.stroke();
  }
  
  // 2. Draw magnifier crosshair (large cross spanning full circular viewport)
  magCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  magCtx.lineWidth = 1;
  // Horizontal line
  magCtx.beginPath();
  magCtx.moveTo(0, MAG_SIZE / 2);
  magCtx.lineTo(MAG_SIZE, MAG_SIZE / 2);
  magCtx.stroke();
  // Vertical line
  magCtx.beginPath();
  magCtx.moveTo(MAG_SIZE / 2, 0);
  magCtx.lineTo(MAG_SIZE / 2, MAG_SIZE);
  magCtx.stroke();
  
  // 3. Highlight central pixel (cyan box)
  magCtx.strokeStyle = '#00e5ff';
  magCtx.lineWidth = 1;
  magCtx.strokeRect((MAG_SIZE - pixelSize) / 2, (MAG_SIZE - pixelSize) / 2, pixelSize, pixelSize);
  
  // Position magnifier bubble
  let magX = mouseX + 15;
  let magY = mouseY + 15;
  
  if (magX + MAG_SIZE > window.innerWidth) {
    magX = mouseX - MAG_SIZE - 15;
  }
  if (magY + MAG_SIZE > window.innerHeight) {
    magY = mouseY - MAG_SIZE - 15;
  }
  
  if (mouseOnScreen) {
    magnifier.style.left = `${magX}px`;
    magnifier.style.top = `${magY}px`;
    magnifier.style.display = 'block';
    magText.textContent = `X: ${Math.round(mouseX)} | Y: ${Math.round(mouseY)}`;
  } else {
    magnifier.style.display = 'none';
  }
}
