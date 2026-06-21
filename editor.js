// Elements
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');
const workspace = document.getElementById('workspace');

// Titlebar buttons
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnCopy = document.getElementById('btn-copy');
const btnSave = document.getElementById('btn-save');
const btnRotateCw = document.getElementById('btn-rotate-cw');
const btnRotateCcw = document.getElementById('btn-rotate-ccw');
const winMin = document.getElementById('win-min');
const winMax = document.getElementById('win-max');
const winClose = document.getElementById('win-close');

// Text Overlay elements
const textOverlay = document.getElementById('text-input-overlay');
const canvasTextarea = document.getElementById('canvas-textarea');

// Properties & Status Elements
const toolButtons = document.querySelectorAll('.tool-btn');
const strokeWidthInput = document.getElementById('stroke-width');
const strokeWidthVal = document.getElementById('stroke-width-val');
const fillShapeInput = document.getElementById('fill-shape');
const fillPropContainer = document.getElementById('fill-prop-container');
const colorSwatches = document.querySelectorAll('.color-palette .color-swatch:not(.custom)');
const customColorPicker = document.getElementById('custom-color-picker');
const customColorBtn = document.getElementById('custom-color-btn');
const statusDims = document.getElementById('status-dims');
const statusCoords = document.getElementById('status-coords');
const propLabelSize = document.querySelector('.property-item .prop-label');

// State Variables
let backgroundImage = new Image();
let objects = [];
let historyStack = [];
let redoStack = [];

let activeTool = 'select'; // 'select' | 'rect' | 'ellipse' | 'line' | 'arrow' | 'freehand' | 'text' | 'bubble' | 'highlight' | 'spotlight' | 'blur' | 'pixelate' | 'step' | 'crop'
let strokeColor = '#ff3b30';
let strokeWidth = 4;
let fillShape = false;
let fontName = "'Inter', sans-serif";

let isDrawing = false;
let drawStartX = 0;
let drawStartY = 0;
let currentMouseX = 0;
let currentMouseY = 0;

// Selection variables
let selectedObject = null;
let isDraggingObject = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartObjProps = null;

// Temporary active object being drawn
let activeDrawingObject = null;

// Text tool state
let isEditingText = false;
let textEditTarget = null; // { x, y } coordinates where text was clicked
let textEditSourceTool = 'text'; // 'text' | 'bubble'

// Window Events (Title Bar)
winMin.addEventListener('click', () => window.api.minimizeWindow());
winMax.addEventListener('click', () => window.api.maximizeWindow());
winClose.addEventListener('click', () => window.api.closeWindow());

const editorTranslations = {
  en: {
    'app-title': 'Feathershot',
    'btn-undo': 'Undo (Ctrl+Z)',
    'btn-redo': 'Redo (Ctrl+Y)',
    'btn-rotate-ccw': 'Rotate Counterclockwise',
    'btn-rotate-cw': 'Rotate Clockwise',
    'btn-copy': 'Copy to Clipboard (Ctrl+C)',
    'btn-save': 'Save to File (Ctrl+S)',
    'btn-copy-text': 'Copy',
    'btn-save-text': 'Save',
    'group-tools': 'Tools',
    'group-properties': 'Properties',
    'prop-size': 'Size',
    'prop-fill': 'Fill Shape',
    'tool-select': 'Select & Move Objects',
    'tool-rect': 'Rectangle',
    'tool-ellipse': 'Ellipse',
    'tool-line': 'Line',
    'tool-arrow': 'Arrow',
    'tool-freehand': 'Brush / Freehand Draw',
    'tool-text': 'Text',
    'tool-bubble': 'Speech Bubble',
    'tool-highlight': 'Highlighter',
    'tool-spotlight': 'Spotlight Highlight',
    'tool-blur': 'Blur Obfuscator',
    'tool-pixelate': 'Pixelate Obfuscator',
    'tool-step': 'Step Counter (Auto-increment)',
    'tool-crop': 'Crop Screenshot'
  },
  pt: {
    'app-title': 'Feathershot',
    'btn-undo': 'Desfazer (Ctrl+Z)',
    'btn-redo': 'Refazer (Ctrl+Y)',
    'btn-rotate-ccw': 'Girar no Sentido Anti-horário',
    'btn-rotate-cw': 'Girar no Sentido Horário',
    'btn-copy': 'Copiar para a Área de Transferência (Ctrl+C)',
    'btn-save': 'Salvar no Arquivo (Ctrl+S)',
    'btn-copy-text': 'Copiar',
    'btn-save-text': 'Salvar',
    'group-tools': 'Ferramentas',
    'group-properties': 'Propriedades',
    'prop-size': 'Tamanho',
    'prop-fill': 'Preencher Forma',
    'tool-select': 'Selecionar e Mover Objetos',
    'tool-rect': 'Retângulo',
    'tool-ellipse': 'Elipse',
    'tool-line': 'Linha',
    'tool-arrow': 'Seta',
    'tool-freehand': 'Pincel / Desenho Livre',
    'tool-text': 'Texto',
    'tool-bubble': 'Balão de Fala',
    'tool-highlight': 'Marca-texto',
    'tool-spotlight': 'Destaque Circular',
    'tool-blur': 'Desfocar Ofuscador',
    'tool-pixelate': 'Pixelar Ofuscador',
    'tool-step': 'Contador de Passos (Incremento automático)',
    'tool-crop': 'Recortar Captura'
  }
};

function applyTranslations(lang) {
  const t = editorTranslations[lang] || editorTranslations.en;
  
  const appTitle = document.querySelector('.title-left .app-title');
  if (appTitle) appTitle.textContent = t['app-title'];
  
  const btnUndo = document.getElementById('btn-undo');
  if (btnUndo) btnUndo.title = t['btn-undo'];
  
  const btnRedo = document.getElementById('btn-redo');
  if (btnRedo) btnRedo.title = t['btn-redo'];
  
  const btnRotateCcw = document.getElementById('btn-rotate-ccw');
  if (btnRotateCcw) btnRotateCcw.title = t['btn-rotate-ccw'];
  
  const btnRotateCw = document.getElementById('btn-rotate-cw');
  if (btnRotateCw) btnRotateCw.title = t['btn-rotate-cw'];
  
  const btnCopy = document.getElementById('btn-copy');
  if (btnCopy) btnCopy.title = t['btn-copy'];
  
  const btnSave = document.getElementById('btn-save');
  if (btnSave) btnSave.title = t['btn-save'];
  
  const copyText = document.querySelector('#btn-copy span');
  if (copyText) copyText.textContent = t['btn-copy-text'];
  
  const saveText = document.querySelector('#btn-save span');
  if (saveText) saveText.textContent = t['btn-save-text'];
  
  const groupTools = document.querySelector('#sidebar .tool-group:nth-child(1) .group-label');
  if (groupTools) groupTools.textContent = t['group-tools'];
  
  const groupProperties = document.querySelector('#sidebar .tool-group:nth-child(2) .group-label');
  if (groupProperties) groupProperties.textContent = t['group-properties'];
  
  const propSize = document.querySelector('.property-item:nth-of-type(1) .prop-label');
  if (propSize) propSize.textContent = t['prop-size'];
  
  const propFill = document.querySelector('.property-item:nth-of-type(2) .prop-label');
  if (propFill) propFill.textContent = t['prop-fill'];
  
  const tools = [
    'tool-select', 'tool-rect', 'tool-ellipse', 'tool-line', 'tool-arrow',
    'tool-freehand', 'tool-text', 'tool-bubble', 'tool-highlight', 'tool-spotlight',
    'tool-blur', 'tool-pixelate', 'tool-step', 'tool-crop'
  ];
  tools.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.title = t[id];
  });
}

// Setup Canvas and Listeners
window.api.onOpenImage((dataUrl, lang) => {
  applyTranslations(lang || 'en');
  backgroundImage.src = dataUrl;
  backgroundImage.onload = () => {
    // Reset state
    objects = [];
    historyStack = [];
    redoStack = [];
    selectedObject = null;
    updateUndoRedoButtons();
    
    // Set canvas dimensions to match the cropped image
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    
    resizeCanvasWrapper();
    
    // Set status bar dimensions
    statusDims.textContent = `${canvas.width} × ${canvas.height} px`;
    
    draw();
  };
});

function resizeCanvasWrapper() {
  const dpr = window.devicePixelRatio || 1;
  wrapper.style.width = `${canvas.width / dpr}px`;
  wrapper.style.height = `${canvas.height / dpr}px`;
}

// Tool Switching
toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    toolButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    activeTool = btn.getAttribute('data-tool');
    selectedObject = null; // Clear selection
    
    // Set UI hints/labels based on tool
    if (activeTool === 'text' || activeTool === 'bubble') {
      propLabelSize.textContent = 'Font Size';
      strokeWidthInput.min = '12';
      strokeWidthInput.max = '72';
      if (parseInt(strokeWidthInput.value) < 12) {
        strokeWidthInput.value = '24';
      }
      strokeWidthVal.textContent = `${strokeWidthInput.value}px`;
      fillPropContainer.style.display = 'none';
    } else {
      propLabelSize.textContent = 'Thickness';
      strokeWidthInput.min = '1';
      strokeWidthInput.max = '20';
      if (parseInt(strokeWidthInput.value) > 20) {
        strokeWidthInput.value = '4';
      }
      strokeWidthVal.textContent = `${strokeWidthInput.value}px`;
      
      // Only show fill toggle for rect/ellipse
      if (activeTool === 'rect' || activeTool === 'ellipse') {
        fillPropContainer.style.display = 'flex';
      } else {
        fillPropContainer.style.display = 'none';
      }
    }
    
    // Set cursor class on canvas
    canvas.className = (activeTool === 'select') ? 'tool-select' : '';
    
    draw();
  });
});

// Property Controls
strokeWidthInput.addEventListener('input', (e) => {
  strokeWidth = parseInt(e.target.value);
  strokeWidthVal.textContent = `${strokeWidth}px`;
  
  if (selectedObject && activeTool === 'select') {
    saveState();
    if (selectedObject.type === 'text' || selectedObject.type === 'bubble') {
      selectedObject.fontSize = strokeWidth;
      if (selectedObject.type === 'bubble') {
        // Re-measure bounds for speech bubble
        ctx.save();
        ctx.font = 'bold ' + selectedObject.fontSize + 'px ' + fontName;
        selectedObject.w = ctx.measureText(selectedObject.text).width + 20;
        selectedObject.h = selectedObject.fontSize + 20;
        ctx.restore();
      }
    } else {
      selectedObject.strokeWidth = strokeWidth;
    }
    draw();
  }
});

fillShapeInput.addEventListener('change', (e) => {
  fillShape = e.target.checked;
  if (selectedObject && activeTool === 'select' && (selectedObject.type === 'rect' || selectedObject.type === 'ellipse')) {
    saveState();
    selectedObject.fill = fillShape;
    draw();
  }
});

// Color Swatches Selection
colorSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    colorSwatches.forEach(s => s.classList.remove('active'));
    customColorBtn.classList.remove('active');
    swatch.classList.add('active');
    
    strokeColor = swatch.getAttribute('data-color');
    
    if (selectedObject && activeTool === 'select') {
      saveState();
      selectedObject.color = strokeColor;
      draw();
    }
  });
});

// Custom Color Picker
customColorPicker.addEventListener('input', (e) => {
  strokeColor = e.target.value;
  colorSwatches.forEach(s => s.classList.remove('active'));
  customColorBtn.classList.add('active');
  
  if (selectedObject && activeTool === 'select') {
    saveState();
    selectedObject.color = strokeColor;
    draw();
  }
});

customColorBtn.addEventListener('click', () => {
  customColorPicker.click();
});

// Canvas Mouse Interactions
canvas.addEventListener('mousedown', (e) => {
  if (isEditingText) {
    commitText();
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  
  drawStartX = mouseX;
  drawStartY = mouseY;
  currentMouseX = mouseX;
  currentMouseY = mouseY;
  
  if (activeTool === 'select') {
    const hit = findObjectAt(mouseX, mouseY);
    if (hit) {
      selectedObject = hit;
      isDraggingObject = true;
      dragStartX = mouseX;
      dragStartY = mouseY;
      
      if (hit.type === 'line' || hit.type === 'arrow') {
        dragStartObjProps = { x1: hit.x1, y1: hit.y1, x2: hit.x2, y2: hit.y2 };
      } else if (hit.type === 'freehand') {
        dragStartObjProps = { points: hit.points.map(p => ({ ...p })) };
      } else if (hit.type === 'bubble') {
        dragStartObjProps = { x: hit.x, y: hit.y, tipX: hit.tipX, tipY: hit.tipY };
      } else {
        dragStartObjProps = { x: hit.x, y: hit.y };
      }
      
      syncPropertyControls(hit);
    } else {
      selectedObject = null;
    }
    draw();
  } else if (activeTool === 'text') {
    startTextInput(mouseX, mouseY);
  } else if (activeTool === 'bubble') {
    isDrawing = true;
    activeDrawingObject = {
      id: generateId(),
      type: 'bubble',
      tipX: drawStartX,
      tipY: drawStartY,
      x: mouseX - 60,
      y: mouseY - 30,
      w: 120,
      h: 60,
      text: '',
      color: strokeColor,
      fontSize: strokeWidth
    };
  } else if (activeTool === 'step') {
    saveState();
    const stepNum = getNextStepNumber();
    objects.push({
      id: generateId(),
      type: 'step',
      x: mouseX,
      y: mouseY,
      number: stepNum,
      color: strokeColor
    });
    draw();
  } else if (activeTool === 'freehand') {
    isDrawing = true;
    activeDrawingObject = {
      id: generateId(),
      type: 'freehand',
      points: [{ x: mouseX, y: mouseY }],
      color: strokeColor,
      strokeWidth: strokeWidth
    };
  } else {
    // Spotlight, Crop, Blur, Pixelate, Rect, Ellipse, Line, Arrow, Highlight
    isDrawing = true;
    activeDrawingObject = {
      id: generateId(),
      type: activeTool,
      color: strokeColor,
      strokeWidth: strokeWidth,
      fill: fillShape,
      x: mouseX,
      y: mouseY,
      w: 0,
      h: 0
    };
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  
  currentMouseX = mouseX;
  currentMouseY = mouseY;
  
  statusCoords.textContent = `${Math.round(mouseX)}, ${Math.round(mouseY)} px`;
  
  if (isDraggingObject && selectedObject) {
    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    
    if (selectedObject.type === 'line' || selectedObject.type === 'arrow') {
      selectedObject.x1 = dragStartObjProps.x1 + dx;
      selectedObject.y1 = dragStartObjProps.y1 + dy;
      selectedObject.x2 = dragStartObjProps.x2 + dx;
      selectedObject.y2 = dragStartObjProps.y2 + dy;
    } else if (selectedObject.type === 'freehand') {
      selectedObject.points = dragStartObjProps.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
      }));
    } else if (selectedObject.type === 'bubble') {
      selectedObject.x = dragStartObjProps.x + dx;
      selectedObject.y = dragStartObjProps.y + dy;
      selectedObject.tipX = dragStartObjProps.tipX + dx;
      selectedObject.tipY = dragStartObjProps.tipY + dy;
    } else {
      selectedObject.x = dragStartObjProps.x + dx;
      selectedObject.y = dragStartObjProps.y + dy;
    }
    draw();
  } else if (isDrawing && activeDrawingObject) {
    if (activeDrawingObject.type === 'freehand') {
      activeDrawingObject.points.push({ x: mouseX, y: mouseY });
    } else {
      updateDrawingObject(mouseX, mouseY);
    }
    draw();
  }
});

canvas.addEventListener('mouseup', () => {
  if (isDraggingObject) {
    isDraggingObject = false;
    dragStartObjProps = null;
    saveState(); // Commit move
  } else if (isDrawing && activeDrawingObject) {
    isDrawing = false;
    
    if (activeDrawingObject.type === 'bubble') {
      startBubbleTextInput(activeDrawingObject);
      return;
    }
    
    let isValid = true;
    
    if (activeDrawingObject.type === 'crop') {
      const normX = Math.min(drawStartX, currentMouseX);
      const normY = Math.min(drawStartY, currentMouseY);
      const normW = Math.abs(drawStartX - currentMouseX);
      const normH = Math.abs(drawStartY - currentMouseY);
      
      if (normW > 10 && normH > 10) {
        performCropAction(normX, normY, normW, normH);
      }
      activeDrawingObject = null;
      draw();
      return;
    }
    
    if (activeDrawingObject.type === 'line' || activeDrawingObject.type === 'arrow') {
      const len = Math.hypot(activeDrawingObject.x2 - activeDrawingObject.x1, activeDrawingObject.y2 - activeDrawingObject.y1);
      if (len < 5) isValid = false;
    } else if (activeDrawingObject.type === 'freehand') {
      if (activeDrawingObject.points.length < 2) isValid = false;
    } else if (['rect', 'ellipse', 'highlight', 'blur', 'spotlight', 'pixelate'].includes(activeDrawingObject.type)) {
      const normX = Math.min(drawStartX, currentMouseX);
      const normY = Math.min(drawStartY, currentMouseY);
      const normW = Math.abs(drawStartX - currentMouseX);
      const normH = Math.abs(drawStartY - currentMouseY);
      
      activeDrawingObject.x = normX;
      activeDrawingObject.y = normY;
      activeDrawingObject.w = normW;
      activeDrawingObject.h = normH;
      
      if (normW < 4 || normH < 4) isValid = false;
    }
    
    if (isValid) {
      saveState();
      objects.push(activeDrawingObject);
    }
    activeDrawingObject = null;
    draw();
  }
});

// Sync properties bar to selected object
function syncPropertyControls(obj) {
  strokeColor = obj.color || strokeColor;
  
  colorSwatches.forEach(s => {
    if (s.getAttribute('data-color') === strokeColor) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });
  
  if (obj.type === 'text' || obj.type === 'bubble') {
    strokeWidth = obj.fontSize;
    strokeWidthInput.value = strokeWidth;
    strokeWidthVal.textContent = `${strokeWidth}px`;
    fillPropContainer.style.display = 'none';
  } else {
    strokeWidth = obj.strokeWidth || strokeWidth;
    strokeWidthInput.value = strokeWidth;
    strokeWidthVal.textContent = `${strokeWidth}px`;
    
    if (obj.type === 'rect' || obj.type === 'ellipse') {
      fillPropContainer.style.display = 'flex';
      fillShapeInput.checked = obj.fill || false;
      fillShape = obj.fill || false;
    } else {
      fillPropContainer.style.display = 'none';
    }
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getNextStepNumber() {
  const steps = objects.filter(o => o.type === 'step');
  if (steps.length === 0) return 1;
  const max = Math.max(...steps.map(s => s.number));
  return max + 1;
}

// Find object under cursor
function findObjectAt(x, y) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    
    if (['rect', 'highlight', 'blur', 'spotlight', 'pixelate'].includes(obj.type)) {
      const minX = Math.min(obj.x, obj.x + obj.w);
      const maxX = Math.max(obj.x, obj.x + obj.w);
      const minY = Math.min(obj.y, obj.y + obj.h);
      const maxY = Math.max(obj.y, obj.y + obj.h);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return obj;
      }
    } else if (obj.type === 'ellipse') {
      const minX = Math.min(obj.x, obj.x + obj.w);
      const maxX = Math.max(obj.x, obj.x + obj.w);
      const minY = Math.min(obj.y, obj.y + obj.h);
      const maxY = Math.max(obj.y, obj.y + obj.h);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        const rx = obj.w / 2;
        const ry = obj.h / 2;
        const cx = obj.x + rx;
        const cy = obj.y + ry;
        const normalizedX = (x - cx) / rx;
        const normalizedY = (y - cy) / ry;
        if ((normalizedX * normalizedX + normalizedY * normalizedY) <= 1.1) {
          return obj;
        }
      }
    } else if (obj.type === 'step') {
      const dist = Math.hypot(x - obj.x, y - obj.y);
      if (dist <= 15) {
        return obj;
      }
    } else if (obj.type === 'text') {
      const height = obj.fontSize;
      const width = obj.fontSize * 0.65 * (obj.text.length || 1);
      if (x >= obj.x && x <= obj.x + width && y >= obj.y - height && y <= obj.y) {
        return obj;
      }
    } else if (obj.type === 'bubble') {
      const insideBubble = (x >= obj.x && x <= obj.x + obj.w && y >= obj.y && y <= obj.y + obj.h);
      const tx = obj.tipX !== undefined ? obj.tipX : obj.x - 15;
      const ty = obj.tipY !== undefined ? obj.tipY : obj.y + obj.h + 15;
      const nearPointer = (Math.hypot(x - tx, y - ty) <= 15);
      if (insideBubble || nearPointer) {
        return obj;
      }
    } else if (obj.type === 'freehand') {
      const threshold = obj.strokeWidth + 6;
      for (let p of obj.points) {
        if (Math.hypot(x - p.x, y - p.y) <= threshold) {
          return obj;
        }
      }
    } else if (obj.type === 'line' || obj.type === 'arrow') {
      const dist = distToSegment({ x, y }, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 });
      if (dist <= (obj.strokeWidth + 6)) {
        return obj;
      }
    }
  }
  return null;
}

function distToSegment(p, v, w) {
  const l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
}
function dist2(v, w) { return (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y); }

function updateDrawingObject(x, y) {
  const w = x - drawStartX;
  const h = y - drawStartY;
  
  if (['rect', 'highlight', 'blur', 'spotlight', 'pixelate', 'crop'].includes(activeDrawingObject.type)) {
    activeDrawingObject.x = drawStartX;
    activeDrawingObject.y = drawStartY;
    activeDrawingObject.w = w;
    activeDrawingObject.h = h;
    
    if (activeDrawingObject.type === 'highlight') {
      activeDrawingObject.color = '#ffeb3b';
    }
  } else if (activeDrawingObject.type === 'ellipse') {
    activeDrawingObject.x = drawStartX;
    activeDrawingObject.y = drawStartY;
    activeDrawingObject.w = w;
    activeDrawingObject.h = h;
  } else if (activeDrawingObject.type === 'line' || activeDrawingObject.type === 'arrow') {
    activeDrawingObject.x1 = drawStartX;
    activeDrawingObject.y1 = drawStartY;
    activeDrawingObject.x2 = x;
    activeDrawingObject.y2 = y;
  } else if (activeDrawingObject.type === 'bubble') {
    activeDrawingObject.x = x - activeDrawingObject.w / 2;
    activeDrawingObject.y = y - activeDrawingObject.h / 2;
  }
}

// Render everything
function draw() {
  if (!backgroundImage.complete) return;
  
  // 1. Base Image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0);
  
  // 2. Finalized Objects
  objects.forEach(obj => {
    drawObject(ctx, obj);
  });
  
  // 3. Active Object Drawing
  if (isDrawing && activeDrawingObject) {
    drawObject(ctx, activeDrawingObject);
  }
  
  // 4. Selection box
  if (activeTool === 'select' && selectedObject) {
    drawSelectionOutline(ctx, selectedObject);
  }
}

// Draw individual object
function drawObject(c, obj) {
  c.save();
  
  if (obj.type === 'rect') {
    c.strokeStyle = obj.color;
    c.lineWidth = obj.strokeWidth;
    if (obj.fill) {
      c.fillStyle = obj.color + '26';
      c.fillRect(obj.x, obj.y, obj.w, obj.h);
    }
    c.strokeRect(obj.x, obj.y, obj.w, obj.h);
  } 
  
  else if (obj.type === 'ellipse') {
    c.strokeStyle = obj.color;
    c.lineWidth = obj.strokeWidth;
    c.beginPath();
    c.ellipse(
      obj.x + obj.w / 2, 
      obj.y + obj.h / 2, 
      Math.abs(obj.w / 2), 
      Math.abs(obj.h / 2), 
      0, 0, 2 * Math.PI
    );
    if (obj.fill) {
      c.fillStyle = obj.color + '26';
      c.fill();
    }
    c.stroke();
  } 
  
  else if (obj.type === 'line') {
    c.strokeStyle = obj.color;
    c.lineWidth = obj.strokeWidth;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(obj.x1, obj.y1);
    c.lineTo(obj.x2, obj.y2);
    c.stroke();
  } 
  
  else if (obj.type === 'arrow') {
    drawArrow(c, obj.x1, obj.y1, obj.x2, obj.y2, obj.color, obj.strokeWidth);
  } 
  
  else if (obj.type === 'freehand') {
    if (obj.points && obj.points.length > 0) {
      c.strokeStyle = obj.color;
      c.lineWidth = obj.strokeWidth;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) {
        c.lineTo(obj.points[i].x, obj.points[i].y);
      }
      c.stroke();
    }
  }
  
  else if (obj.type === 'highlight') {
    c.fillStyle = 'rgba(255, 235, 59, 0.32)';
    c.fillRect(obj.x, obj.y, obj.w, obj.h);
  } 
  
  else if (obj.type === 'spotlight') {
    c.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const x = Math.min(obj.x, obj.x + obj.w);
    const y = Math.min(obj.y, obj.y + obj.h);
    const w = Math.abs(obj.w);
    const h = Math.abs(obj.h);
    
    // Top
    c.fillRect(0, 0, canvas.width, y);
    // Bottom
    c.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
    // Left
    c.fillRect(0, y, x, h);
    // Right
    c.fillRect(x + w, y, canvas.width - (x + w), h);
    
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 1.5;
    c.strokeRect(x, y, w, h);
  }
  
  else if (obj.type === 'blur') {
    c.beginPath();
    c.rect(obj.x, obj.y, obj.w, obj.h);
    c.clip();
    
    c.filter = 'blur(10px)';
    c.drawImage(backgroundImage, 0, 0);
    c.filter = 'none';
  } 
  
  else if (obj.type === 'pixelate') {
    c.beginPath();
    c.rect(obj.x, obj.y, obj.w, obj.h);
    c.clip();
    
    const pixelSize = 8;
    const sw = Math.max(1, Math.abs(obj.w) / pixelSize);
    const sh = Math.max(1, Math.abs(obj.h) / pixelSize);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    tempCtx.drawImage(
      backgroundImage,
      obj.x, obj.y, obj.w, obj.h,
      0, 0, sw, sh
    );
    
    c.imageSmoothingEnabled = false;
    c.drawImage(
      tempCanvas,
      0, 0, sw, sh,
      obj.x, obj.y, obj.w, obj.h
    );
    c.imageSmoothingEnabled = true;
  }
  
  else if (obj.type === 'step') {
    c.beginPath();
    c.arc(obj.x, obj.y, 13, 0, 2 * Math.PI);
    c.fillStyle = obj.color;
    c.fill();
    
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.2;
    c.stroke();
    
    c.shadowColor = 'rgba(0, 0, 0, 0.4)';
    c.shadowBlur = 4;
    c.shadowOffsetY = 2;
    
    c.font = 'bold 12px ' + fontName;
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(obj.number, obj.x, obj.y + 0.5);
  } 
  
  else if (obj.type === 'text') {
    c.font = 'bold ' + obj.fontSize + 'px ' + fontName;
    c.fillStyle = obj.color;
    c.textBaseline = 'top';
    
    c.strokeStyle = '#000000';
    c.lineWidth = Math.max(3, obj.fontSize / 8);
    c.lineJoin = 'round';
    
    c.strokeText(obj.text, obj.x, obj.y);
    c.fillText(obj.text, obj.x, obj.y);
  }
  
  else if (obj.type === 'bubble') {
    const padding = 10;
    const bx = obj.x;
    const by = obj.y;
    const w = obj.w;
    const h = obj.h;
    
    // Handle legacy bubble objects or default coordinates
    const tx = obj.tipX !== undefined ? obj.tipX : bx - 15;
    const ty = obj.tipY !== undefined ? obj.tipY : by + h + 15;
    
    let p1 = null;
    let p2 = null;
    
    if (ty > by + h) {
      // Tip is below bubble
      p1 = { x: Math.max(bx + 5, bx + w/2 - 10), y: by + h };
      p2 = { x: Math.min(bx + w - 5, bx + w/2 + 10), y: by + h };
    } else if (ty < by) {
      // Tip is above bubble
      p1 = { x: Math.max(bx + 5, bx + w/2 - 10), y: by };
      p2 = { x: Math.min(bx + w - 5, bx + w/2 + 10), y: by };
    } else if (tx < bx) {
      // Tip is to the left
      p1 = { x: bx, y: Math.max(by + 5, by + h/2 - 10) };
      p2 = { x: bx, y: Math.min(by + h - 5, by + h/2 + 10) };
    } else if (tx > bx + w) {
      // Tip is to the right
      p1 = { x: bx + w, y: Math.max(by + 5, by + h/2 - 10) };
      p2 = { x: bx + w, y: Math.min(by + h - 5, by + h/2 + 10) };
    }
    
    // 1. Draw pointer fill
    if (p1 && p2) {
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(p1.x, p1.y);
      c.lineTo(p2.x, p2.y);
      c.closePath();
      c.fillStyle = obj.color;
      c.fill();
    }
    
    // 2. Draw bubble body fill
    c.beginPath();
    c.roundRect(bx, by, w, h, 8);
    c.fillStyle = obj.color;
    c.fill();
    
    // 3. Draw bubble body stroke
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.stroke();
    
    // 4. Draw pointer stroke (outer edges only) and hide inside border
    if (p1 && p2) {
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(p1.x, p1.y);
      c.moveTo(tx, ty);
      c.lineTo(p2.x, p2.y);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.5;
      c.stroke();
      
      // Cover the border connection line with a slightly thicker line in the bubble's color
      c.beginPath();
      c.moveTo(p1.x, p1.y);
      c.lineTo(p2.x, p2.y);
      c.strokeStyle = obj.color;
      c.lineWidth = 2.5;
      c.stroke();
    }
    
    // 5. Draw text inside bubble (multiline supported, black color)
    c.font = 'bold ' + obj.fontSize + 'px ' + fontName;
    c.fillStyle = '#000000';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    
    const lines = (obj.text || '').split('\n');
    let lineY = by + padding;
    lines.forEach(line => {
      c.fillText(line, bx + padding, lineY);
      lineY += obj.fontSize * 1.2;
    });
  }
  
  else if (obj.type === 'crop') {
    c.strokeStyle = '#ffeb3b';
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.strokeRect(obj.x, obj.y, obj.w, obj.h);
  }
  
  c.restore();
}

function drawArrow(c, x1, y1, x2, y2, color, width) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.stroke();
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = Math.max(12, width * 3);
  
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  c.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  c.closePath();
  
  c.fillStyle = color;
  c.fill();
}

function drawSelectionOutline(c, obj) {
  c.save();
  c.strokeStyle = '#007aff';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  
  if (obj.type === 'line' || obj.type === 'arrow') {
    const minX = Math.min(obj.x1, obj.x2) - 6;
    const maxX = Math.max(obj.x1, obj.x2) + 6;
    const minY = Math.min(obj.y1, obj.y2) - 6;
    const maxY = Math.max(obj.y1, obj.y2) + 6;
    c.strokeRect(minX, minY, maxX - minX, maxY - minY);
  } else if (obj.type === 'step') {
    c.beginPath();
    c.arc(obj.x, obj.y, 17, 0, 2 * Math.PI);
    c.stroke();
  } else if (obj.type === 'text') {
    const height = obj.fontSize;
    const width = obj.fontSize * 0.65 * obj.text.length;
    c.strokeRect(obj.x - 4, obj.y - 4, width + 8, height + 8);
  } else if (obj.type === 'bubble') {
    c.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
    const tx = obj.tipX !== undefined ? obj.tipX : obj.x - 15;
    const ty = obj.tipY !== undefined ? obj.tipY : obj.y + obj.h + 15;
    c.beginPath();
    c.arc(tx, ty, 4, 0, 2 * Math.PI);
    c.fillStyle = '#007aff';
    c.fill();
    c.stroke();
  } else if (obj.type === 'freehand') {
    const xs = obj.points.map(p => p.x);
    const ys = obj.points.map(p => p.y);
    const minX = Math.min(...xs) - 4;
    const maxX = Math.max(...xs) + 4;
    const minY = Math.min(...ys) - 4;
    const maxY = Math.max(...ys) + 4;
    c.strokeRect(minX, minY, maxX - minX, maxY - minY);
  } else {
    const minX = Math.min(obj.x, obj.x + obj.w) - 4;
    const maxX = Math.max(obj.x, obj.x + obj.w) + 4;
    const minY = Math.min(obj.y, obj.y + obj.h) - 4;
    const maxY = Math.max(obj.y, obj.y + obj.h) + 4;
    c.strokeRect(minX, minY, maxX - minX, maxY - minY);
  }
  
  c.restore();
}

// Text Input Manager
function startTextInput(x, y) {
  isEditingText = true;
  textEditTarget = { x, y };
  textEditSourceTool = activeTool;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const logicalX = x / scaleX;
  const logicalY = y / scaleY;
  
  textOverlay.style.display = 'block';
  textOverlay.style.left = `${wrapper.offsetLeft + logicalX}px`;
  textOverlay.style.top = `${wrapper.offsetTop + logicalY}px`;
  
  // Scale text input size to match scaled screen display
  canvasTextarea.style.color = strokeColor;
  canvasTextarea.style.fontSize = `${strokeWidth / scaleX}px`;
  canvasTextarea.value = '';
  
  setTimeout(() => {
    canvasTextarea.focus();
  }, 50);
}

function startBubbleTextInput(bubbleObj) {
  isEditingText = true;
  textEditTarget = bubbleObj;
  textEditSourceTool = 'bubble';
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Position input inside the bubble body
  const padding = 10;
  const logicalX = (bubbleObj.x + padding) / scaleX;
  const logicalY = (bubbleObj.y + padding) / scaleY;
  const logicalW = (bubbleObj.w - padding * 2) / scaleX;
  const logicalH = (bubbleObj.h - padding * 2) / scaleY;
  
  textOverlay.style.display = 'block';
  textOverlay.style.left = `${wrapper.offsetLeft + logicalX}px`;
  textOverlay.style.top = `${wrapper.offsetTop + logicalY}px`;
  
  canvasTextarea.style.color = '#000000'; // black text in bubble
  canvasTextarea.style.fontSize = `${bubbleObj.fontSize / scaleX}px`;
  canvasTextarea.style.width = `${logicalW}px`;
  canvasTextarea.style.height = `${logicalH}px`;
  canvasTextarea.value = '';
  
  setTimeout(() => {
    canvasTextarea.focus();
  }, 50);
}

function commitText() {
  if (!isEditingText) return;
  isEditingText = false;
  textOverlay.style.display = 'none';
  
  // Reset style overrides
  canvasTextarea.style.width = 'auto';
  canvasTextarea.style.height = 'auto';
  
  const textVal = canvasTextarea.value.trim();
  if (textVal.length > 0) {
    saveState();
    
    if (textEditSourceTool === 'bubble') {
      ctx.save();
      ctx.font = 'bold ' + textEditTarget.fontSize + 'px ' + fontName;
      const lines = textVal.split('\n');
      let maxW = 0;
      lines.forEach(line => {
        const w = ctx.measureText(line).width;
        if (w > maxW) maxW = w;
      });
      const totalH = lines.length * textEditTarget.fontSize * 1.2;
      ctx.restore();
      
      const padding = 10;
      const newW = maxW + padding * 2;
      const newH = totalH + padding * 2;
      
      // Re-center bubble body around its current center
      const centerX = textEditTarget.x + textEditTarget.w / 2;
      const centerY = textEditTarget.y + textEditTarget.h / 2;
      
      objects.push({
        id: textEditTarget.id,
        type: 'bubble',
        tipX: textEditTarget.tipX,
        tipY: textEditTarget.tipY,
        x: centerX - newW / 2,
        y: centerY - newH / 2,
        w: newW,
        h: newH,
        text: textVal,
        fontSize: textEditTarget.fontSize,
        color: textEditTarget.color
      });
    } else {
      objects.push({
        id: generateId(),
        type: 'text',
        x: textEditTarget.x,
        y: textEditTarget.y,
        text: textVal,
        fontSize: strokeWidth,
        color: strokeColor
      });
    }
  }
  
  activeDrawingObject = null;
  textEditTarget = null;
  draw();
  
  document.getElementById('tool-select').click();
}

canvasTextarea.addEventListener('input', () => {
  canvasTextarea.style.height = 'auto';
  canvasTextarea.style.height = `${canvasTextarea.scrollHeight}px`;
});

canvasTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    commitText();
  } else if (e.key === 'Escape') {
    isEditingText = false;
    textOverlay.style.display = 'none';
    textEditTarget = null;
    draw();
  }
});

// Undo Redo stack operations
function saveState() {
  const snap = JSON.stringify(objects);
  if (historyStack.length > 0 && historyStack[historyStack.length - 1] === snap) {
    return;
  }
  historyStack.push(snap);
  redoStack = [];
  updateUndoRedoButtons();
}

function undo() {
  if (isEditingText) return;
  
  if (historyStack.length > 0) {
    const currentState = JSON.stringify(objects);
    redoStack.push(currentState);
    
    const prevState = historyStack.pop();
    objects = JSON.parse(prevState);
    selectedObject = null;
    draw();
    updateUndoRedoButtons();
  }
}

function redo() {
  if (isEditingText) return;
  
  if (redoStack.length > 0) {
    const nextState = redoStack.pop();
    historyStack.push(JSON.stringify(objects));
    
    objects = JSON.parse(nextState);
    selectedObject = null;
    draw();
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  btnUndo.disabled = historyStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);

// Delete selected object
window.addEventListener('keydown', (e) => {
  if (isEditingText) return;
  
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
    saveState();
    objects = objects.filter(o => o.id !== selectedObject.id);
    selectedObject = null;
    draw();
  }
  
  const hasPrimaryModifier = e.ctrlKey || e.metaKey;
  if (hasPrimaryModifier) {
    if ((e.key === 'z' || e.key === 'Z') && e.shiftKey) {
      e.preventDefault();
      redo();
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      undo();
    } else if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      redo();
    } else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      copyToClipboard();
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      saveToDisk();
    }
  }
});

// Final Export Actions
async function copyToClipboard() {
  selectedObject = null;
  draw();
  
  const dataUrl = canvas.toDataURL('image/png');
  const success = await window.api.copyToClipboard(dataUrl);
  if (success) {
    showActionNotification('Copied to clipboard!');
  }
}

async function saveToDisk() {
  selectedObject = null;
  draw();
  
  const formatSelect = document.getElementById('editor-format-select');
  const selectedFormat = formatSelect ? formatSelect.value : 'png';
  
  const { canceled, filePath } = await window.api.showSaveDialog(selectedFormat);
  if (canceled || !filePath) return;
  
  const ext = filePath.split('.').pop().toLowerCase();
  let success = false;
  
  if (ext === 'gif') {
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const gifBytes = window.api.encodeGif(imgData.data, width, height);
    success = await window.api.saveFile(filePath, gifBytes);
  } else {
    let mimeType = 'image/png';
    let quality = 1.0;
    
    if (ext === 'jpg' || ext === 'jpeg') {
      mimeType = 'image/jpeg';
      quality = 0.92;
    } else if (ext === 'webp') {
      mimeType = 'image/webp';
      quality = 0.92;
    }
    
    const dataUrl = canvas.toDataURL(mimeType, quality);
    success = await window.api.saveFile(filePath, dataUrl);
  }
  
  if (success) {
    showActionNotification('Saved successfully!');
  }
}

// Initialize format select element to settings format
async function initFormatSelect() {
  try {
    const currentSettings = await window.api.getSettings();
    const formatSelect = document.getElementById('editor-format-select');
    if (formatSelect) {
      formatSelect.value = currentSettings.imageFormat || 'png';
    }
  } catch (err) {
    console.error('Failed to load format select settings:', err);
  }
}
initFormatSelect();

function showActionNotification(msg) {
  const notif = document.createElement('div');
  notif.style.position = 'absolute';
  notif.style.bottom = '48px';
  notif.style.left = '50%';
  notif.style.transform = 'translateX(-50%)';
  notif.style.background = 'rgba(52, 199, 89, 0.9)';
  notif.style.color = '#ffffff';
  notif.style.padding = '8px 18px';
  notif.style.borderRadius = '20px';
  notif.style.fontSize = '12px';
  notif.style.fontWeight = '600';
  notif.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  notif.style.pointerEvents = 'none';
  notif.style.zIndex = '9999';
  notif.style.opacity = '0';
  notif.style.transition = 'opacity 0.2s, transform 0.2s';
  notif.textContent = msg;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.opacity = '1';
    notif.style.transform = 'translateX(-50%) translateY(-5px)';
  }, 50);
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transform = 'translateX(-50%) translateY(5px)';
    setTimeout(() => {
      notif.remove();
    }, 200);
  }, 2200);
}

btnCopy.addEventListener('click', copyToClipboard);
btnSave.addEventListener('click', saveToDisk);

// Crop / Rotate Implementation
function performCropAction(x, y, w, h) {
  saveState();
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  
  const bakeCanvas = document.createElement('canvas');
  bakeCanvas.width = canvas.width;
  bakeCanvas.height = canvas.height;
  const bakeCtx = bakeCanvas.getContext('2d');
  bakeCtx.drawImage(backgroundImage, 0, 0);
  objects.forEach(obj => drawObject(bakeCtx, obj));
  
  tempCtx.drawImage(bakeCanvas, x, y, w, h, 0, 0, w, h);
  
  backgroundImage = new Image();
  backgroundImage.src = tempCanvas.toDataURL();
  backgroundImage.onload = () => {
    canvas.width = w;
    canvas.height = h;
    resizeCanvasWrapper();
    statusDims.textContent = `${w} × ${h} px`;
    objects = [];
    selectedObject = null;
    draw();
  };
  
  document.getElementById('tool-select').click();
}

btnRotateCw.addEventListener('click', () => rotateImage(90));
btnRotateCcw.addEventListener('click', () => rotateImage(-90));

function rotateImage(angleDegrees) {
  saveState();
  
  const oldW = canvas.width;
  const oldH = canvas.height;
  const newW = oldH;
  const newH = oldW;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = newW;
  tempCanvas.height = newH;
  const tempCtx = tempCanvas.getContext('2d');
  
  const bakeCanvas = document.createElement('canvas');
  bakeCanvas.width = oldW;
  bakeCanvas.height = oldH;
  const bakeCtx = bakeCanvas.getContext('2d');
  bakeCtx.drawImage(backgroundImage, 0, 0);
  objects.forEach(obj => drawObject(bakeCtx, obj));
  
  tempCtx.translate(newW / 2, newH / 2);
  tempCtx.rotate(angleDegrees * Math.PI / 180);
  tempCtx.drawImage(bakeCanvas, -oldW / 2, -oldH / 2);
  
  backgroundImage = new Image();
  backgroundImage.src = tempCanvas.toDataURL();
  backgroundImage.onload = () => {
    canvas.width = newW;
    canvas.height = newH;
    resizeCanvasWrapper();
    statusDims.textContent = `${newW} × ${newH} px`;
    objects = [];
    selectedObject = null;
    draw();
  };
}

// Bake all drawings into the background image
function bakeDrawings() {
  if (objects.length === 0) return;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(backgroundImage, 0, 0);
  objects.forEach(obj => drawObject(tempCtx, obj));
  backgroundImage = new Image();
  backgroundImage.src = tempCanvas.toDataURL('image/png');
  backgroundImage.onload = () => {
    objects = [];
    selectedObject = null;
    draw();
  };
}

// Drag & Drop Image Import
workspace.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

workspace.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        backgroundImage = new Image();
        backgroundImage.src = dataUrl;
        backgroundImage.onload = () => {
          objects = [];
          historyStack = [];
          redoStack = [];
          selectedObject = null;
          updateUndoRedoButtons();
          
          canvas.width = backgroundImage.width;
          canvas.height = backgroundImage.height;
          resizeCanvasWrapper();
          statusDims.textContent = `${canvas.width} × ${canvas.height} px`;
          draw();
        };
      };
      reader.readAsDataURL(file);
    }
  }
});

// Initialize and apply theme settings dynamically
async function initTheme() {
  try {
    const currentSettings = await window.api.getSettings();
    document.documentElement.setAttribute('data-theme', currentSettings.theme || 'dark');
  } catch (err) {
    console.error('Failed to load theme settings in editor:', err);
  }
}

initTheme();

// Listen for dynamic settings changes
if (window.api.onSettingsChanged) {
  window.api.onSettingsChanged((newSettings) => {
    if (newSettings && newSettings.theme) {
      document.documentElement.setAttribute('data-theme', newSettings.theme);
    }
  });
}
