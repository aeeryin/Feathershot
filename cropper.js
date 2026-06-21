const canvas = document.getElementById('view-canvas');
const ctx = canvas.getContext('2d');
const magnifier = document.getElementById('magnifier');
const magCanvas = document.getElementById('mag-canvas');
const magCtx = magCanvas.getContext('2d');
const magText = document.getElementById('mag-text');

const quickMenu = document.getElementById('quick-menu');
const btnEditor = document.getElementById('menu-editor');
const btnClipboard = document.getElementById('menu-clipboard');
const btnDesktop = document.getElementById('menu-desktop');
const btnPrint = document.getElementById('menu-print');

// --- Display geometry for THIS window ---
let displayOffset = { x: 0, y: 0 }; // This window's position in virtual desktop
let displayWidth = 0;
let displayHeight = 0;

// --- Composite canvas (full virtual desktop screenshot) ---
let compositeCanvas = null;
let compositeReady = false;

// --- Drag state (all in GLOBAL virtual desktop coordinates) ---
let isDragging = false;
let globalStartX = 0;
let globalStartY = 0;
let globalCurrentX = 0;
let globalCurrentY = 0;

let isFrozen = false;
let croppedRect = null; // In GLOBAL coords { x, y, w, h }
let mouseOnScreen = false;
let isMouseCurrentlyActiveHere = false;
let localMouseX = 0;
let localMouseY = 0;

let dpr = window.devicePixelRatio || 1;

// --- Magnifier ---
const MAG_SIZE = 130;
magCanvas.width = MAG_SIZE;
magCanvas.height = MAG_SIZE;
let zoomPixels = 16;

// --- Coordinate conversion ---
function toGlobal(lx, ly) {
  return { x: lx + displayOffset.x, y: ly + displayOffset.y };
}

function toLocal(gx, gy) {
  return { x: gx - displayOffset.x, y: gy - displayOffset.y };
}

// --- Translations ---
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

// --- Receive capture data from Main Process ---
// data = { displayCaptures: [...], displayOffset, displaySize, totalSize }
window.api.onCaptureImage((data, lang) => {
  applyTranslations(lang || 'en');
  if (data.theme) {
    document.documentElement.setAttribute('data-theme', data.theme);
  }

  displayOffset = data.displayOffset;
  displayWidth = data.displaySize.width;
  displayHeight = data.displaySize.height;

  // Build composite canvas from all display screenshots
  compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = data.totalSize.width;
  compositeCanvas.height = data.totalSize.height;
  const compCtx = compositeCanvas.getContext('2d');

  let loaded = 0;
  const captures = data.displayCaptures;

  captures.forEach((capture) => {
    const img = new Image();
    img.onload = () => {
      compCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
        capture.x, capture.y, capture.width, capture.height);
      if (++loaded === captures.length) {
        compositeReady = true;
        resizeCanvas();
        draw();
        window.api.sendCropperReady();
      }
    };
    img.onerror = () => {
      console.error('Failed to load display capture at', capture.x, capture.y);
      if (++loaded === captures.length) {
        compositeReady = true;
        resizeCanvas();
        draw();
        window.api.sendCropperReady();
      }
    };
    img.src = capture.url;
  });
});

// --- Canvas setup ---
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  if (compositeReady) {
    resizeCanvas();
    draw();
  }
});

// --- Mouse boundary tracking ---
window.addEventListener('mouseenter', () => {
  mouseOnScreen = true;
  draw();
});

window.addEventListener('mouseleave', () => {
  mouseOnScreen = false;
  isMouseCurrentlyActiveHere = false;
  magnifier.style.display = 'none';
  // Do NOT stop dragging on mouseleave — drag continues on next window
  draw();
});

// --- Mouse events (all coords converted to global) ---
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  if (isFrozen) {
    if (!quickMenu.contains(e.target)) {
      isFrozen = false;
      croppedRect = null;
      quickMenu.style.display = 'none';
      const g = toGlobal(e.clientX, e.clientY);
      isDragging = true;
      globalStartX = g.x;
      globalStartY = g.y;
      globalCurrentX = g.x;
      globalCurrentY = g.y;
      localMouseX = e.clientX;
      localMouseY = e.clientY;
      window.api.sendCropperEvent({ type: 'start', sx: g.x, sy: g.y });
      draw();
      updateMagnifier(e.clientX, e.clientY);
    }
    return;
  }

  const g = toGlobal(e.clientX, e.clientY);
  isDragging = true;
  globalStartX = g.x;
  globalStartY = g.y;
  globalCurrentX = g.x;
  globalCurrentY = g.y;
  localMouseX = e.clientX;
  localMouseY = e.clientY;
  window.api.sendCropperEvent({ type: 'start', sx: g.x, sy: g.y });
  draw();
});

window.addEventListener('mousemove', (e) => {
  if (isFrozen) return;
  mouseOnScreen = true;
  localMouseX = e.clientX;
  localMouseY = e.clientY;

  const g = toGlobal(e.clientX, e.clientY);
  globalCurrentX = g.x;
  globalCurrentY = g.y;

  if (compositeReady) {
    if (isDragging) {
      window.api.sendCropperEvent({ type: 'move', cx: g.x, cy: g.y });
    }
    draw();
    updateMagnifier(e.clientX, e.clientY);

    if (!isMouseCurrentlyActiveHere) {
      isMouseCurrentlyActiveHere = true;
      window.api.reportMouseActive();
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (isFrozen) return;
  if (!isDragging) return;
  isDragging = false;

  const g = toGlobal(e.clientX, e.clientY);
  globalCurrentX = g.x;
  globalCurrentY = g.y;
  localMouseX = e.clientX;
  localMouseY = e.clientY;

  const rect = getGlobalSelectionRect();

  if (rect.w > 5 && rect.h > 5) {
    isFrozen = true;
    croppedRect = rect;
    magnifier.style.display = 'none';
    window.api.sendCropperEvent({ type: 'end', frozen: true, rect });
    showQuickMenu(e.clientX, e.clientY);
  } else {
    window.api.sendCropperEvent({ type: 'end', frozen: false });
    draw();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.api.cancelCrop();
  }
});

// --- Receive sync events from other cropper windows ---
window.api.onCropperSync((data) => {
  switch (data.type) {
    case 'start':
      if (isFrozen) {
        isFrozen = false;
        croppedRect = null;
        quickMenu.style.display = 'none';
      }
      isDragging = true;
      globalStartX = data.sx;
      globalStartY = data.sy;
      globalCurrentX = data.sx;
      globalCurrentY = data.sy;
      draw();
      break;
    case 'move':
      globalCurrentX = data.cx;
      globalCurrentY = data.cy;
      if (isDragging) draw();
      break;
    case 'end':
      isDragging = false;
      if (data.frozen) {
        isFrozen = true;
        croppedRect = data.rect;
      }
      draw();
      break;
  }
});

// --- Scroll to zoom magnifier ---
window.addEventListener('wheel', (e) => {
  if (!compositeReady) return;
  if (e.deltaY < 0) {
    zoomPixels = Math.max(4, zoomPixels - 2);
  } else {
    zoomPixels = Math.min(64, zoomPixels + 2);
  }
  updateMagnifier(localMouseX, localMouseY);
});

// --- Selection rect (global coordinates) ---
function getGlobalSelectionRect() {
  return {
    x: Math.min(globalStartX, globalCurrentX),
    y: Math.min(globalStartY, globalCurrentY),
    w: Math.abs(globalStartX - globalCurrentX),
    h: Math.abs(globalStartY - globalCurrentY)
  };
}

// --- Quick menu ---
function showQuickMenu(x, y) {
  const menuWidth = 240;
  const menuHeight = 160;
  let menuX = x + 10;
  let menuY = y + 10;

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

// --- Crop extraction (from composite using global coords) ---
function getCroppedDataUrl() {
  if (!croppedRect || !compositeCanvas) return null;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = croppedRect.w;
  cropCanvas.height = croppedRect.h;
  const cropCtx = cropCanvas.getContext('2d');

  cropCtx.drawImage(compositeCanvas,
    croppedRect.x, croppedRect.y, croppedRect.w, croppedRect.h,
    0, 0, croppedRect.w, croppedRect.h
  );
  return cropCanvas.toDataURL('image/png');
}

// --- Quick menu buttons ---
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

// --- Drawing ---
function draw() {
  if (!compositeReady) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.clearRect(0, 0, w, h);

  // Draw this window's portion of the composite screenshot
  ctx.drawImage(compositeCanvas,
    displayOffset.x, displayOffset.y, w, h,
    0, 0, w, h
  );

  // Dark translucent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, w, h);

  // Crosshair (only when mouse is on this window and not frozen)
  if (mouseOnScreen && !isFrozen) {
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, localMouseY);
    ctx.lineTo(w, localMouseY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(localMouseX, 0);
    ctx.lineTo(localMouseX, h);
    ctx.stroke();
    ctx.restore();

    // Target crosshair circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(localMouseX, localMouseY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(localMouseX, localMouseY, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Coordinate pill
    const coordText = `${Math.round(localMouseX)} × ${Math.round(localMouseY)}`;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    const textW = ctx.measureText(coordText).width;
    const px = localMouseX + 12;
    const py = localMouseY + 4;

    ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
    ctx.beginPath();
    ctx.roundRect(px, py, textW + 12, 18, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, textW + 12, 18);

    ctx.fillStyle = '#065f46';
    ctx.fillText(coordText, px + 6, py + 13);
    ctx.restore();
  }

  // Selection rectangle
  if (isDragging || isFrozen) {
    const globalRect = getGlobalSelectionRect();

    // Convert to local coordinates for this window
    const localX = globalRect.x - displayOffset.x;
    const localY = globalRect.y - displayOffset.y;
    const localRight = localX + globalRect.w;
    const localBottom = localY + globalRect.h;

    // Compute visible portion (intersection with this window)
    const visLeft = Math.max(0, localX);
    const visTop = Math.max(0, localY);
    const visRight = Math.min(w, localRight);
    const visBottom = Math.min(h, localBottom);

    if (visRight > visLeft && visBottom > visTop) {
      // Clear dark overlay in the visible selection area by redrawing composite
      ctx.drawImage(compositeCanvas,
        visLeft + displayOffset.x, visTop + displayOffset.y,
        visRight - visLeft, visBottom - visTop,
        visLeft, visTop,
        visRight - visLeft, visBottom - visTop
      );

      // Selection border (may extend beyond window edges — that's OK, canvas clips)
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(localX, localY, globalRect.w, globalRect.h);

      // Corner guides
      const guideSize = 8;
      ctx.fillStyle = '#00e5ff';
      // Top-left
      ctx.fillRect(localX - 1, localY - 1, guideSize, 2);
      ctx.fillRect(localX - 1, localY - 1, 2, guideSize);
      // Top-right
      ctx.fillRect(localRight - guideSize + 1, localY - 1, guideSize, 2);
      ctx.fillRect(localRight - 1, localY - 1, 2, guideSize);
      // Bottom-left
      ctx.fillRect(localX - 1, localBottom - 1, guideSize, 2);
      ctx.fillRect(localX - 1, localBottom - guideSize + 1, 2, guideSize);
      // Bottom-right
      ctx.fillRect(localRight - guideSize + 1, localBottom - 1, guideSize, 2);
      ctx.fillRect(localRight - 1, localBottom - guideSize + 1, 2, guideSize);

      // Dimensions tag
      const tagText = `${globalRect.w} × ${globalRect.h}`;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      const tagWidth = ctx.measureText(tagText).width;

      ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';

      let tagY = localY - 8;
      if (tagY < 20) tagY = localY + 18;
      let tagX = localX + (globalRect.w / 2) - (tagWidth / 2) - 8;

      ctx.beginPath();
      ctx.roundRect(tagX, tagY - 12, tagWidth + 16, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.fillText(tagText, tagX + 8, tagY + 2);
    }
  }
}

// --- Magnifier ---
function updateMagnifier(mouseX, mouseY) {
  if (!compositeReady) return;

  magCtx.clearRect(0, 0, MAG_SIZE, MAG_SIZE);

  // Convert local mouse to global for sampling from composite
  const gx = mouseX + displayOffset.x;
  const gy = mouseY + displayOffset.y;

  const zoomSrcX = gx - (zoomPixels / 2);
  const zoomSrcY = gy - (zoomPixels / 2);

  magCtx.imageSmoothingEnabled = false;
  magCtx.drawImage(compositeCanvas,
    zoomSrcX, zoomSrcY, zoomPixels, zoomPixels,
    0, 0, MAG_SIZE, MAG_SIZE
  );

  // Pixel grid
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

  // Crosshair
  magCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  magCtx.lineWidth = 1;
  magCtx.beginPath();
  magCtx.moveTo(0, MAG_SIZE / 2);
  magCtx.lineTo(MAG_SIZE, MAG_SIZE / 2);
  magCtx.stroke();
  magCtx.beginPath();
  magCtx.moveTo(MAG_SIZE / 2, 0);
  magCtx.lineTo(MAG_SIZE / 2, MAG_SIZE);
  magCtx.stroke();

  // Central pixel highlight
  magCtx.strokeStyle = '#00e5ff';
  magCtx.lineWidth = 1;
  magCtx.strokeRect((MAG_SIZE - pixelSize) / 2, (MAG_SIZE - pixelSize) / 2, pixelSize, pixelSize);

  // Position magnifier bubble
  let magX = mouseX + 15;
  let magY = mouseY + 15;
  if (magX + MAG_SIZE > window.innerWidth) magX = mouseX - MAG_SIZE - 15;
  if (magY + MAG_SIZE > window.innerHeight) magY = mouseY - MAG_SIZE - 15;

  if (mouseOnScreen) {
    magnifier.style.left = `${magX}px`;
    magnifier.style.top = `${magY}px`;
    magnifier.style.display = 'block';
    magText.textContent = `X: ${Math.round(mouseX)} | Y: ${Math.round(mouseY)}`;
  } else {
    magnifier.style.display = 'none';
  }
}

// --- Hide magnifier when another window is active ---
window.api.onHideMagnifier(() => {
  isMouseCurrentlyActiveHere = false;
  mouseOnScreen = false;
  magnifier.style.display = 'none';
  draw();
});
