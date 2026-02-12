// РљРѕРЅСЃС‚Р°РЅС‚С‹ РёРіСЂС‹
const GRID_SIZE = 8;
const MIN_MATCH = 3;
const COMBO_TIMEOUT = 1000;
const GRAVITY_DELAY = 300;

// Р¦РІРµС‚Р° РґР»СЏ Р±Р»РѕРєРѕРІ
const COLORS = [
  { color: '#9C2F1D', weight: 25 }, // РћСЂР°РЅР¶РµРІС‹Р№
  { color: '#2F6B5E', weight: 25 }, // Р—РµР»РµРЅС‹Р№
  { color: '#B06A2B', weight: 25 }, // Violet
  { color: '#D7A13C', weight: 25 }, // Р–РµР»С‚С‹Р№
  { color: '#E4C589', weight: 25 }  // Р РѕР·РѕРІС‹Р№
];

// РЎРѕСЃС‚РѕСЏРЅРёРµ РёРіСЂС‹
let draggedBlock = null;
let draggedBlockColors = [];
let highlightedCells = [];
let score = 0;
let gameOver = false;
let currentCombo = 0;
let comboTimeout = null;
let isGravityActive = false;
let placedBlocksCount = 0;
let hasExplosionInRound = false;
let megaComboActive = false;
let allBlocksExploded = false;
let currentMatchGroups = [];
let currentDraggedColors = null;
let lastComboTime = 0;

/**
 * РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РёРіСЂС‹
 * РЎРѕР·РґР°РµС‚ РёРіСЂРѕРІРѕРµ РїРѕР»Рµ Рё РЅР°С‡Р°Р»СЊРЅС‹Рµ Р±Р»РѕРєРё
 */
function initializeGame() {
  // РЎР±СЂРѕСЃ СЃРѕСЃС‚РѕСЏРЅРёСЏ
  score = 0;
  gameOver = false;
  currentCombo = 0;
  if (comboTimeout) clearTimeout(comboTimeout);
  
  // РћС‡РёСЃС‚РєР° Рё СЃРѕР·РґР°РЅРёРµ СЃРµС‚РєРё
  const grid = document.querySelector('.game-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // РЎРѕР·РґР°РЅРёРµ СЏС‡РµРµРє
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      cell.addEventListener('dragover', handleDragOver);
      cell.addEventListener('dragleave', handleDragLeave);
      cell.addEventListener('drop', handleDrop);
      
      grid.appendChild(cell);
    }
  }
  
  // Р“РµРЅРµСЂР°С†РёСЏ РЅР°С‡Р°Р»СЊРЅС‹С… Р±Р»РѕРєРѕРІ
  generateUpcomingBlocks();
  
  // РћР±РЅРѕРІР»РµРЅРёРµ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ
  updateScore();
  
  // РЈРґР°Р»РµРЅРёРµ СЃС‚Р°СЂРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РѕР± РѕРєРѕРЅС‡Р°РЅРёРё РёРіСЂС‹
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
}

/**
 * РџРѕР»СѓС‡РµРЅРёРµ СЃР»СѓС‡Р°Р№РЅРѕРіРѕ С†РІРµС‚Р°
 */
function getRandomColor(usedColors = []) {
  // Р¤РёР»СЊС‚СЂСѓРµРј С†РІРµС‚Р°, РєРѕС‚РѕСЂС‹Рµ СѓР¶Рµ РёСЃРїРѕР»СЊР·РѕРІР°РЅС‹ 2 СЂР°Р·Р°
  const colorCounts = {};
  usedColors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  const availableColors = COLORS.filter(item => 
    !colorCounts[item.color] || colorCounts[item.color] < 2
  );

  if (availableColors.length === 0) {
    return COLORS[Math.floor(Math.random() * COLORS.length)].color;
  }

  const totalWeight = availableColors.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of availableColors) {
    if (random < item.weight) return item.color;
    random -= item.weight;
  }
  
  return availableColors[0].color;
}

/**
 * Р“РµРЅРµСЂР°С†РёСЏ L-РѕР±СЂР°Р·РЅРѕРіРѕ Р±Р»РѕРєР° (СЃ СЃР»СѓС‡Р°Р№РЅС‹Рј РїРѕРІРѕСЂРѕС‚РѕРј)
 */
function generateLShapedBlock(blockColors) {
    const block = document.createElement('div');
    block.className = 'upcoming-block';
    block.draggable = true;
    
    const blockGrid = document.createElement('div');
    blockGrid.className = 'upcoming-block-grid l-shaped';
    
    // РЎР»СѓС‡Р°Р№РЅРѕ РІС‹Р±РёСЂР°РµРј РїРѕРІРѕСЂРѕС‚ (0, 90, 180, 270 РіСЂР°РґСѓСЃРѕРІ)
    const rotation = Math.floor(Math.random() * 4);
    blockGrid.dataset.rotation = rotation.toString();
    
    // РЎРѕР·РґР°РµРј 3 СЏС‡РµР№РєРё РґР»СЏ L-РѕР±СЂР°Р·РЅРѕРіРѕ Р±Р»РѕРєР°
    for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
    }
    
    block.appendChild(blockGrid);
    
    // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё СЃРѕР±С‹С‚РёР№
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragend', handleDragEnd);
    
    return block;
}

/**
 * Р“РµРЅРµСЂР°С†РёСЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° 1x3
 * @param {Array} blockColors - РјР°СЃСЃРёРІ РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРЅС‹С… С†РІРµС‚РѕРІ
 * @returns {HTMLElement} - СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅС‹Р№ Р±Р»РѕРє
 */
function generateHorizontalBlock(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid horizontal-1x3';
  
  // РЎРѕР·РґР°РµРј 3 СЏС‡РµР№РєРё РґР»СЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР°
  for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
      }
  
  block.appendChild(blockGrid);
  
  // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё СЃРѕР±С‹С‚РёР№
  block.addEventListener('dragstart', handleDragStart);
  block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Р“РµРЅРµСЂР°С†РёСЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° 1x3
 * @param {Array} blockColors - РјР°СЃСЃРёРІ РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРЅС‹С… С†РІРµС‚РѕРІ
 * @returns {HTMLElement} - СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅС‹Р№ Р±Р»РѕРє
 */
function generateVerticalBlock(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid vertical-1x3';
  
  // РЎРѕР·РґР°РµРј 3 СЏС‡РµР№РєРё РґР»СЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР°
  for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
      }
  
  block.appendChild(blockGrid);
  
  // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё СЃРѕР±С‹С‚РёР№
  block.addEventListener('dragstart', handleDragStart);
  block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Р“РµРЅРµСЂР°С†РёСЏ Р±Р»РѕРєР° 2x2
 * @param {Array} blockColors - РјР°СЃСЃРёРІ РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРЅС‹С… С†РІРµС‚РѕРІ
 * @returns {HTMLElement} - СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅС‹Р№ Р±Р»РѕРє
 */
function generate2x2Block(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid 2x2';
  
  // РЎРѕР·РґР°РµРј 4 СЏС‡РµР№РєРё РґР»СЏ Р±Р»РѕРєР° 2x2
  for (let i = 0; i < 4; i++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
    }
    
    block.appendChild(blockGrid);
    
  // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё СЃРѕР±С‹С‚РёР№
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Р“РµРЅРµСЂР°С†РёСЏ С‚СЂРµС… РЅРѕРІС‹С… Р±Р»РѕРєРѕРІ
 * РўРµРїРµСЂСЊ СЃ РѕРіСЂР°РЅРёС‡РµРЅРёРµРј РЅР° РєРѕР»РёС‡РµСЃС‚РІРѕ РѕРґРёРЅР°РєРѕРІС‹С… С†РІРµС‚РѕРІ
 */
function generateUpcomingBlocks() {
  const container = document.querySelector('.upcoming-blocks-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Р“РµРЅРµСЂРёСЂСѓРµРј 3 РЅРѕРІС‹С… Р±Р»РѕРєР°
  for (let i = 0; i < 3; i++) {
    const blockColors = [];
    const blockType = Math.random();
    let block;
    
    if (blockType < 0.25) {
      block = generateLShapedBlock(blockColors);
    } else if (blockType < 0.5) {
      block = generateHorizontalBlock(blockColors);
    } else if (blockType < 0.75) {
      block = generateVerticalBlock(blockColors);
    } else {
      block = generate2x2Block(blockColors);
    }
    
    container.appendChild(block);
  }
}

/**
 * РћР±СЂР°Р±РѕС‚РєР° РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ
 */
function handleDragStart(e) {
  if (gameOver) return;
  
  const block = e.target.closest('.upcoming-block');
  if (!block) return;
  
  const blockGrid = block.querySelector('.upcoming-block-grid');
  if (!blockGrid) return;
  
  const cells = blockGrid.querySelectorAll('.upcoming-block-cell');
  const colors = Array.from(cells).map(cell => cell.style.backgroundColor);
  
  let blockType = '2x2';
  if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
  
  const blockData = { type: blockType, colors: colors };
  e.dataTransfer.setData('text/plain', JSON.stringify(blockData));
  
  block.classList.add('dragging');
  draggedBlock = block;
  draggedBlockColors = colors;
}

/**
 * РџРѕРґСЃРІРµС‚РєР° РѕР±Р»Р°СЃС‚Рё РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ Р±Р»РѕРєР°
 * РџРѕРєР°Р·С‹РІР°РµС‚ СЃРёР»СѓСЌС‚ Р±Р»РѕРєР° РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РµРіРѕ С‚РёРїР° Рё РїРѕРІРѕСЂРѕС‚Р°
 */
function highlightPlacementArea(row, col, isValid) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // РћС‡РёС‰Р°РµРј РїСЂРµРґС‹РґСѓС‰РёРµ РїРѕРґСЃРІРµС‚РєРё
  clearHighlights();
  
  // РџРѕР»СѓС‡Р°РµРј С‚РёРї Р±Р»РѕРєР° Рё РїРѕРІРѕСЂРѕС‚ РёР· РїРµСЂРµС‚Р°СЃРєРёРІР°РµРјРѕРіРѕ Р±Р»РѕРєР°
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  let blockType;
  let rotation = 0;
  
  if (blockGrid.classList.contains('l-shaped')) {
    blockType = 'l-shaped';
    rotation = parseInt(blockGrid.dataset.rotation || '0');
  }
  else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else blockType = '2x2';
  
  const highlightClass = isValid ? 'valid-drop' : 'invalid-drop';
  
  // РџРѕРґСЃРІРµС‡РёРІР°РµРј СЏС‡РµР№РєРё РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ С‚РёРїР° Р±Р»РѕРєР° Рё РїРѕРІРѕСЂРѕС‚Р°
  switch (blockType) {
    case 'l-shaped':
      switch (rotation) {
        case 0: // в”—
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + col].classList.add(highlightClass);
          }
      break;
        case 1: // в”Џ
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + col].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
        case 2: // в”“
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
        case 3: // в”›
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
      }
      break;
      
    case 'horizontal':
      if (col < GRID_SIZE - 2) {
        for (let i = 0; i < 3; i++) {
          cells[row * GRID_SIZE + (col + i)].classList.add(highlightClass);
        }
      }
      break;
      
    case 'vertical':
      if (row < GRID_SIZE - 2) {
        for (let i = 0; i < 3; i++) {
          cells[(row + i) * GRID_SIZE + col].classList.add(highlightClass);
        }
      }
      break;
      
    case '2x2':
      if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            cells[(row + i) * GRID_SIZE + (col + j)].classList.add(highlightClass);
          }
        }
      }
      break;
  }
}

/**
 * РћР±СЂР°Р±РѕС‚С‡РёРє РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ РЅР°Рґ СЏС‡РµР№РєРѕР№
 */
function handleDragOver(e) {
  e.preventDefault();
  const cell = e.target.closest('.grid-cell');
  if (!cell || !draggedBlock) return;
  
  // РџРѕР»СѓС‡Р°РµРј РєРѕРѕСЂРґРёРЅР°С‚С‹ СЏС‡РµР№РєРё
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  // РџРѕР»СѓС‡Р°РµРј С‚РёРї Р±Р»РѕРєР°
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  let blockType;
  
  if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
  else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else blockType = '2x2';
  
  // РџСЂРѕРІРµСЂСЏРµРј РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ СЂР°Р·РјРµС‰РµРЅРёСЏ Рё РїРѕРєР°Р·С‹РІР°РµРј РїРѕРґСЃРІРµС‚РєСѓ
  const canPlace = canPlaceBlockAtPosition(row, col, blockType);
  highlightPlacementArea(row, col, canPlace);
}

/**
 * РћР±СЂР°Р±РѕС‚С‡РёРє РІС‹С…РѕРґР° Р·Р° РїСЂРµРґРµР»С‹ СЏС‡РµР№РєРё
 * РЈР±РёСЂР°РµС‚ РїРѕРґСЃРІРµС‚РєСѓ РѕР±Р»Р°СЃС‚Рё СЂР°Р·РјРµС‰РµРЅРёСЏ
 */
function handleDragLeave(e) {
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  clearHighlights();
}

/**
 * РћС‡РёСЃС‚РєР° РїРѕРґСЃРІРµС‚РєРё РІСЃРµС… СЏС‡РµРµРє
 */
function clearHighlights() {
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
}

/**
 * РџСЂРѕРІРµСЂСЏРµС‚, РјРѕР¶РЅРѕ Р»Рё СЂР°Р·РјРµСЃС‚РёС‚СЊ Р±Р»РѕРє РІ СѓРєР°Р·Р°РЅРЅРѕР№ РїРѕР·РёС†РёРё
 */
function canPlaceBlockAtPosition(row, col, blockType) {
  switch (blockType) {
    case 'l-shaped':
      return canPlaceLShapedBlock(row, col);
    case 'horizontal':
      return canPlaceHorizontalBlock(row, col);
    case 'vertical':
      return canPlaceVerticalBlock(row, col);
    case '2x2':
      return canPlace2x2Block(row, col);
    default:
      return false;
  }
}

/**
 * РџСЂРѕРІРµСЂСЏРµС‚ СЃС…РѕР¶РґРµРЅРёРµ С†РІРµС‚РѕРІ РґР»СЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ РёР»Рё РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР°
 * @param {number} startRow - РќР°С‡Р°Р»СЊРЅР°СЏ СЃС‚СЂРѕРєР° Р±Р»РѕРєР°
 * @param {number} startCol - РќР°С‡Р°Р»СЊРЅС‹Р№ СЃС‚РѕР»Р±РµС† Р±Р»РѕРєР°
 * @param {boolean} isHorizontal - true РґР»СЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР°, false РґР»СЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ
 * @param {Array} colors - РњР°СЃСЃРёРІ С†РІРµС‚РѕРІ Р±Р»РѕРєР°
 * @returns {boolean} - true РµСЃР»Рё РµСЃС‚СЊ СЃС…РѕР¶РґРµРЅРёРµ С†РІРµС‚РѕРІ, false РµСЃР»Рё РЅРµС‚
 */
function checkColorConvergence(startRow, startCol, isHorizontal, colors) {
  // РџСЂРѕРІРµСЂСЏРµРј СЃРѕСЃРµРґРЅРёРµ СЏС‡РµР№РєРё РЅР° СЃС…РѕР¶РґРµРЅРёРµ С†РІРµС‚РѕРІ
  if (isHorizontal) {
    // Р”Р»СЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° РїСЂРѕРІРµСЂСЏРµРј РІРµСЂС…РЅСЋСЋ Рё РЅРёР¶РЅСЋСЋ СЏС‡РµР№РєРё
    for (let i = 0; i < 3; i++) {
      const col = startCol + i;
      
      // РџСЂРѕРІРµСЂСЏРµРј РІРµСЂС…РЅСЋСЋ СЏС‡РµР№РєСѓ
      if (startRow > 0) {
        const topCell = document.querySelector(`.grid-cell[data-row="${startRow - 1}"][data-col="${col}"]`);
        const topFilledCell = topCell?.querySelector('.filled-cell');
        if (topFilledCell && colors.includes(topFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // РџСЂРѕРІРµСЂСЏРµРј РЅРёР¶РЅСЋСЋ СЏС‡РµР№РєСѓ
      if (startRow < 7) {
        const bottomCell = document.querySelector(`.grid-cell[data-row="${startRow + 1}"][data-col="${col}"]`);
        const bottomFilledCell = bottomCell?.querySelector('.filled-cell');
        if (bottomFilledCell && colors.includes(bottomFilledCell.style.backgroundColor)) {
          return true;
        }
      }
    }
  } else {
    // Р”Р»СЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° РїСЂРѕРІРµСЂСЏРµРј Р»РµРІСѓСЋ Рё РїСЂР°РІСѓСЋ СЏС‡РµР№РєРё
    for (let i = 0; i < 3; i++) {
      const row = startRow + i;
      
      // РџСЂРѕРІРµСЂСЏРµРј Р»РµРІСѓСЋ СЏС‡РµР№РєСѓ
      if (startCol > 0) {
        const leftCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${startCol - 1}"]`);
        const leftFilledCell = leftCell?.querySelector('.filled-cell');
        if (leftFilledCell && colors.includes(leftFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // РџСЂРѕРІРµСЂСЏРµРј РїСЂР°РІСѓСЋ СЏС‡РµР№РєСѓ
      if (startCol < 7) {
        const rightCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${startCol + 1}"]`);
        const rightFilledCell = rightCell?.querySelector('.filled-cell');
        if (rightFilledCell && colors.includes(rightFilledCell.style.backgroundColor)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * РџРѕРєР°Р·С‹РІР°РµС‚ СЃРѕРѕР±С‰РµРЅРёРµ Рѕ С‚РѕРј, С‡С‚Рѕ РЅРµС‚ СЃС…РѕР¶РґРµРЅРёСЏ С†РІРµС‚РѕРІ
 */
function showNoConvergenceMessage() {
  const message = document.createElement('div');
  message.className = 'no-convergence-message';
  message.textContent = 'РќРµС‚ СЃС…РѕР¶РґРµРЅРёСЏ С†РІРµС‚РѕРІ!';
  
  document.querySelector('.game-container').appendChild(message);
  
  setTimeout(() => {
    message.classList.add('fade-out');
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 500);
  }, 1500);
}

/**
 * Р Р°Р·РјРµС‰Р°РµС‚ Р±Р»РѕРє РЅР° РёРіСЂРѕРІРѕРј РїРѕР»Рµ
 * @param {number} row - РЅР°С‡Р°Р»СЊРЅР°СЏ СЃС‚СЂРѕРєР°
 * @param {number} col - РЅР°С‡Р°Р»СЊРЅС‹Р№ СЃС‚РѕР»Р±РµС†
 * @param {Object} blockData - РґР°РЅРЅС‹Рµ Р±Р»РѕРєР° (С‚РёРї Рё С†РІРµС‚Р°)
 * @returns {Array} - РјР°СЃСЃРёРІ СЂР°Р·РјРµС‰РµРЅРЅС‹С… СЏС‡РµРµРє
 */
function placeBlock(row, col, blockData) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  const placedCells = [];
  
  switch (blockData.type) {
    case 'l-shaped':
      const draggedBlock = document.querySelector('.upcoming-block.dragging');
      const blockGrid = draggedBlock?.querySelector('.upcoming-block-grid');
      const rotation = parseInt(blockGrid?.dataset.rotation || '0');
      
      let positions;
      switch (rotation) {
        case 0: // в”—
          positions = [
            {row: row, col: col},           // Р’РµСЂС…РЅСЏСЏ Р»РµРІР°СЏ
            {row: row, col: col + 1},       // Р’РµСЂС…РЅСЏСЏ РїСЂР°РІР°СЏ
            {row: row + 1, col: col}        // РќРёР¶РЅСЏСЏ Р»РµРІР°СЏ
          ];
          break;
        case 1: // в”Џ
          positions = [
            {row: row, col: col},           // Р’РµСЂС…РЅСЏСЏ Р»РµРІР°СЏ
            {row: row + 1, col: col},       // РќРёР¶РЅСЏСЏ Р»РµРІР°СЏ
            {row: row + 1, col: col + 1}    // РќРёР¶РЅСЏСЏ РїСЂР°РІР°СЏ
          ];
          break;
        case 2: // в”“
          positions = [
            {row: row, col: col},           // Р’РµСЂС…РЅСЏСЏ Р»РµРІР°СЏ
            {row: row, col: col + 1},       // Р’РµСЂС…РЅСЏСЏ РїСЂР°РІР°СЏ
            {row: row + 1, col: col + 1}    // РќРёР¶РЅСЏСЏ РїСЂР°РІР°СЏ
          ];
          break;
        case 3: // в”›
          positions = [
            {row: row, col: col},           // Р’РµСЂС…РЅСЏСЏ Р»РµРІР°СЏ
            {row: row, col: col + 1},       // Р’РµСЂС…РЅСЏСЏ РїСЂР°РІР°СЏ
            {row: row + 1, col: col + 1}    // РќРёР¶РЅСЏСЏ РїСЂР°РІР°СЏ
          ];
          break;
        default:
          return [];
      }
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const cell = cells[pos.row * GRID_SIZE + pos.col];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case 'horizontal':
      // Р Р°Р·РјРµС‰Р°РµРј РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Р№ Р±Р»РѕРє 1x3
      for (let i = 0; i < 3; i++) {
        const cell = cells[row * GRID_SIZE + (col + i)];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case 'vertical':
      // Р Р°Р·РјРµС‰Р°РµРј РІРµСЂС‚РёРєР°Р»СЊРЅС‹Р№ Р±Р»РѕРє 1x3
      for (let i = 0; i < 3; i++) {
        const cell = cells[(row + i) * GRID_SIZE + col];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case '2x2':
      // Р Р°Р·РјРµС‰Р°РµРј Р±Р»РѕРє 2x2
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const cell = cells[(row + i) * GRID_SIZE + (col + j)];
          if (!cell.classList.contains('filled')) {
            cell.classList.add('filled');
            cell.style.backgroundColor = blockData.colors[i * 2 + j];
            placedCells.push(cell);
          }
        }
      }
      break;
      
    default:
      console.error('РќРµРёР·РІРµСЃС‚РЅС‹Р№ С‚РёРї Р±Р»РѕРєР°:', blockData.type);
      return [];
  }
  
  return placedCells;
}

function highlightCells(row, col) {
  highlightedCells = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`);
      if (cell && !cell.classList.contains("filled")) {
        cell.classList.add("highlight");
        cell.classList.add("active");
        highlightedCells.push(cell);
      }
    }
  }
}

function clearHighlightedCells() {
  highlightedCells.forEach((cell) => {
    cell.classList.remove("highlight");
    cell.classList.remove("active");
  });
  highlightedCells = [];
}

/**
 * РџРѕРёСЃРє СЃРѕРІРїР°РґР°СЋС‰РёС… Р±Р»РѕРєРѕРІ
 */
function findMatches() {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  const matches = [];
  const visited = new Set();
  
  // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїСЂРѕРІРµСЂРєРё СЃРѕСЃРµРґРµР№
  function checkNeighbors(row, col, color, group) {
    const key = `${row},${col}`;
    if (visited.has(key)) return;

    const cell = cells[row * GRID_SIZE + col];
    if (!cell || !cell.classList.contains('filled') || cell.style.backgroundColor !== color) return;

    visited.add(key);
    group.push({row, col, cell});

    // РџСЂРѕРІРµСЂСЏРµРј РІСЃРµС… СЃРѕСЃРµРґРµР№
    if (row > 0) checkNeighbors(row - 1, col, color, group); // РІРµСЂС…
    if (row < GRID_SIZE - 1) checkNeighbors(row + 1, col, color, group); // РЅРёР·
    if (col > 0) checkNeighbors(row, col - 1, color, group); // Р»РµРІРѕ
    if (col < GRID_SIZE - 1) checkNeighbors(row, col + 1, color, group); // РїСЂР°РІРѕ
  }

  // РС‰РµРј РіСЂСѓРїРїС‹ РѕРґРёРЅР°РєРѕРІС‹С… Р±Р»РѕРєРѕРІ
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row},${col}`;
      if (visited.has(key)) continue;

      const cell = cells[row * GRID_SIZE + col];
      if (!cell.classList.contains('filled')) continue;

      const color = cell.style.backgroundColor;
      if (!color) continue;

      const group = [];
      checkNeighbors(row, col, color, group);

      // Р”РѕР±Р°РІР»СЏРµРј РіСЂСѓРїРїСѓ РµСЃР»Рё РІ РЅРµР№ 3 РёР»Рё Р±РѕР»РµРµ Р±Р»РѕРєРѕРІ
      if (group.length >= MIN_MATCH) {
        matches.push({
          color: color,
          cells: group
        });
      }
    }
  }

  return matches;
}

/**
 * РЈРґР°Р»РµРЅРёРµ СЃРѕРІРїР°РІС€РёС… Р±Р»РѕРєРѕРІ
 */
function removeMatches(matches) {
  if (!matches || matches.length === 0) return false;
  
  let hasExploded = false;
  let totalScore = 0;
  
  matches.forEach(match => {
    if (match.cells.length >= MIN_MATCH) {
      hasExploded = true;
      
      // РЎРѕР·РґР°РµРј СЌС„С„РµРєС‚ РІР·СЂС‹РІР° РґР»СЏ РєР°Р¶РґРѕР№ СЏС‡РµР№РєРё РІ РіСЂСѓРїРїРµ
      match.cells.forEach(({cell}) => {
        createExplosionEffect(cell, match.color);
        
        // РЈРґР°Р»СЏРµРј Р±Р»РѕРє
        cell.classList.add('exploding');
    setTimeout(() => {
          cell.classList.remove('filled', 'exploding');
          cell.style.backgroundColor = '';
      }, 300);
      });
      
      // РџРѕРґСЃС‡РёС‚С‹РІР°РµРј РѕС‡РєРё
      const baseScore = match.cells.length * 10;
      const bonusMultiplier = Math.floor(match.cells.length / 3);
      totalScore += baseScore * (1 + bonusMultiplier * 0.5);
    }
  });
  
  if (hasExploded) {
    // РџСЂРёРјРµРЅСЏРµРј РјРЅРѕР¶РёС‚РµР»СЊ РєРѕРјР±Рѕ
    if (currentCombo > 1) {
      totalScore = Math.floor(totalScore * (1 + currentCombo * 0.3));
    }
    
    // РћР±РЅРѕРІР»СЏРµРј СЃС‡РµС‚
    score += Math.floor(totalScore);
    updateScore();
    
    // РћР±РЅРѕРІР»СЏРµРј РєРѕРјР±Рѕ
    currentCombo++;
    if (comboTimeout) clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      currentCombo = 0;
    }, COMBO_TIMEOUT);
    
    // РџРѕРєР°Р·С‹РІР°РµРј СЌС„С„РµРєС‚ РєРѕРјР±Рѕ
    if (matches.length > 1) {
      const centerMatch = matches[0];
      showComboEffect(Math.floor(totalScore), findCenterCell(centerMatch.cells), centerMatch.color);
    } else if (matches[0].cells.length >= 4) {
      const match = matches[0];
      showComboEffect(Math.floor(totalScore), findCenterCell(match.cells), match.color);
    }
    
    // РџСЂРёРјРµРЅСЏРµРј РіСЂР°РІРёС‚Р°С†РёСЋ РїРѕСЃР»Рµ РІР·СЂС‹РІР°
    setTimeout(() => {
      applyGravity();
      
      // РџСЂРѕРІРµСЂСЏРµРј РЅРѕРІС‹Рµ СЃРѕРІРїР°РґРµРЅРёСЏ РїРѕСЃР»Рµ РїР°РґРµРЅРёСЏ Р±Р»РѕРєРѕРІ
      setTimeout(() => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
          removeMatches(newMatches);
        } else {
          // РџСЂРѕРІРµСЂСЏРµРј РѕРєРѕРЅС‡Р°РЅРёРµ РёРіСЂС‹ РїРѕСЃР»Рµ РІСЃРµС… РІР·СЂС‹РІРѕРІ Рё РїР°РґРµРЅРёР№
          setTimeout(() => {
            checkForGameOver();
          }, 100);
        }
      }, GRAVITY_DELAY);
    }, GRAVITY_DELAY);
  }
  
  return hasExploded;
}

/**
 * РџСЂРёРјРµРЅРµРЅРёРµ РіСЂР°РІРёС‚Р°С†РёРё
 */
function applyGravity() {
  let moved = false;
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // РџСЂРѕС…РѕРґРёРј СЃРЅРёР·Сѓ РІРІРµСЂС… РїРѕ РєР°Р¶РґРѕРјСѓ СЃС‚РѕР»Р±С†Сѓ
  for (let col = 0; col < GRID_SIZE; col++) {
    let emptyRow = GRID_SIZE - 1;
    
    // РС‰РµРј РїСѓСЃС‚С‹Рµ СЏС‡РµР№РєРё СЃРЅРёР·Сѓ РІРІРµСЂС…
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const cell = cells[row * GRID_SIZE + col];
      
      if (cell.classList.contains('filled')) {
        // Р•СЃР»Рё С‚РµРєСѓС‰Р°СЏ СЏС‡РµР№РєР° Р·Р°РїРѕР»РЅРµРЅР° Рё РµСЃС‚СЊ РєСѓРґР° РїР°РґР°С‚СЊ
        if (row < emptyRow) {
          // РџРµСЂРµРјРµС‰Р°РµРј Р±Р»РѕРє РІРЅРёР·
          const targetCell = cells[emptyRow * GRID_SIZE + col];
          targetCell.classList.add('filled');
          targetCell.style.backgroundColor = cell.style.backgroundColor;
          cell.classList.remove('filled');
          cell.style.backgroundColor = '';
          moved = true;
          emptyRow--;
        } else {
          emptyRow = row - 1;
        }
      }
    }
  }
  
  return moved;
}

/**
 * РџРµСЂРµРјРµС‰РµРЅРёРµ Р±Р»РѕРєР° РјРµР¶РґСѓ СЏС‡РµР№РєР°РјРё
 * РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ Р°РЅРёРјР°С†РёРё РїР°РґРµРЅРёСЏ
 */
function moveCell(fromRow, fromCol, toRow, toCol) {
  const sourceCell = document.querySelector(`.grid-cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
  const targetCell = document.querySelector(`.grid-cell[data-row="${toRow}"][data-col="${toCol}"]`);
  const filledCell = sourceCell.querySelector('.filled-cell');
  
  if (filledCell && targetCell) {
    const fallDistance = (toRow - fromRow) * 100;
    filledCell.style.setProperty('--fall-distance', `${fallDistance}%`);
    filledCell.classList.add('falling');
    
    targetCell.appendChild(filledCell);
    
    setTimeout(() => {
      filledCell.classList.remove('falling');
    }, 300);
    
    return true;
  }
  return false;
}

/**
 * РџСЂРѕРІРµСЂРєР° СЃРѕРІРїР°РґРµРЅРёР№ РїРѕСЃР»Рµ СЂР°Р·РјРµС‰РµРЅРёСЏ Р±Р»РѕРєР°
 * РћР±РЅРѕРІР»РµРЅРЅР°СЏ СЃРёСЃС‚РµРјР° РїРѕРґСЃС‡РµС‚Р° РѕС‡РєРѕРІ
 */
function checkForMatches() {
  // РџРѕР»СѓС‡Р°РµРј РІСЃРµ Р±Р»РѕРєРё РЅР° РїРѕР»Рµ
  const blocks = [];
  
  // РќР°С…РѕРґРёРј РІСЃРµ L-РѕР±СЂР°Р·РЅС‹Рµ Р±Р»РѕРєРё
  for (let row = 0; row < GRID_SIZE - 2; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      if (canPlaceLShapedBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col + 1}"]`)
        ];
        
        // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РІСЃРµ СЏС‡РµР№РєРё Р·Р°РїРѕР»РЅРµРЅС‹
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'l-shaped', cells });
        }
      }
    }
  }
  
  // РќР°С…РѕРґРёРј РІСЃРµ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Рµ Р±Р»РѕРєРё
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 2; col++) {
      if (canPlaceHorizontalBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 1}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 2}"]`)
        ];
        
        // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РІСЃРµ СЏС‡РµР№РєРё Р·Р°РїРѕР»РЅРµРЅС‹
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'horizontal', cells });
        }
      }
    }
  }
  
  // РќР°С…РѕРґРёРј РІСЃРµ РІРµСЂС‚РёРєР°Р»СЊРЅС‹Рµ Р±Р»РѕРєРё
  for (let row = 0; row < GRID_SIZE - 2; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (canPlaceVerticalBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col}"]`)
        ];
        
        // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РІСЃРµ СЏС‡РµР№РєРё Р·Р°РїРѕР»РЅРµРЅС‹
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'vertical', cells });
        }
      }
    }
  }
  
  // РќР°С…РѕРґРёРј РІСЃРµ Р±Р»РѕРєРё 2x2
  for (let row = 0; row < GRID_SIZE - 1; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      if (canPlace2x2Block(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 1}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col + 1}"]`)
        ];
        
        // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РІСЃРµ СЏС‡РµР№РєРё Р·Р°РїРѕР»РЅРµРЅС‹
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: '2x2', cells });
        }
      }
    }
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј РєР°Р¶РґС‹Р№ Р±Р»РѕРє РЅР° РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ РІР·СЂС‹РІР°
  let exploded = false;
  for (const block of blocks) {
    let canExplode = false;
    let points = 0;
    
    switch (block.type) {
      case 'l-shaped':
        canExplode = canExplodeLShapedBlock(block.cells);
        if (canExplode) {
          points = explodeLShapedBlock(block.cells);
          exploded = true;
        }
        break;
      case 'horizontal':
        canExplode = canExplodeHorizontalBlock(block.cells);
        if (canExplode) {
          points = explodeHorizontalBlock(block.cells);
          exploded = true;
        }
        break;
      case 'vertical':
        canExplode = canExplodeVerticalBlock(block.cells);
        if (canExplode) {
          points = explodeVerticalBlock(block.cells);
          exploded = true;
        }
        break;
      case '2x2':
        canExplode = canExplode2x2Block(block.cells);
        if (canExplode) {
          points = explode2x2Block(block.cells);
          exploded = true;
        }
        break;
    }
    
    // РћР±РЅРѕРІР»СЏРµРј СЃС‡РµС‚, РµСЃР»Рё Р±Р»РѕРє РІР·РѕСЂРІР°Р»СЃСЏ
    if (canExplode) {
      score += points;
    updateScore();
    }
    }
    
  // Р•СЃР»Рё С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ Р±Р»РѕРє РІР·РѕСЂРІР°Р»СЃСЏ, РїСЂРёРјРµРЅСЏРµРј РіСЂР°РІРёС‚Р°С†РёСЋ
  if (exploded) {
    setTimeout(() => {
      const moved = applyGravity();
      if (moved) {
        setTimeout(checkForMatches, 300);
      }
    }, 300);
  }
}

function findCenterCell(cells) {
  let sumRow = 0, sumCol = 0;
  cells.forEach(cell => {
    sumRow += cell.row;
    sumCol += cell.col;
  });
  const centerRow = Math.round(sumRow / cells.length);
  const centerCol = Math.round(sumCol / cells.length);
  
  let centerCell = cells[0];
  let minDistance = Number.MAX_VALUE;
  cells.forEach(cell => {
    const distance = Math.pow(cell.row - centerRow, 2) + Math.pow(cell.col - centerCol, 2);
    if (distance < minDistance) {
      minDistance = distance;
      centerCell = cell;
    }
  });
  
  return centerCell;
}

/**
 * РЎРѕР·РґР°РЅРёРµ СЌС„С„РµРєС‚Р° РІР·СЂС‹РІР°
 * Р“РµРЅРµСЂРёСЂСѓРµС‚ С‡Р°СЃС‚РёС†С‹ С†РІРµС‚Р° РІР·РѕСЂРІР°РІС€РµРіРѕСЃСЏ Р±Р»РѕРєР°
 */
function createExplosionEffect(cell, color) {
  // РЎРѕР·РґР°РµРј Р±РѕР»СЊС€Рµ С‡Р°СЃС‚РёС† РґР»СЏ Р±РѕР»РµРµ СЌС„С„РµРєС‚РЅРѕРіРѕ РІР·СЂС‹РІР°
  const particleCount = 16;
  const centerX = cell.offsetWidth / 2;
  const centerY = cell.offsetHeight / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    // Р’С‹С‡РёСЃР»СЏРµРј СѓРіРѕР» РґР»СЏ СЂР°РІРЅРѕРјРµСЂРЅРѕРіРѕ СЂР°СЃРїСЂРµРґРµР»РµРЅРёСЏ С‡Р°СЃС‚РёС†
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = 8 + Math.random() * 15; // РЎР»СѓС‡Р°Р№РЅР°СЏ СЃРєРѕСЂРѕСЃС‚СЊ
    
    // Р’С‹С‡РёСЃР»СЏРµРј РєРѕРЅРµС‡РЅСѓСЋ РїРѕР·РёС†РёСЋ С‡Р°СЃС‚РёС†С‹
    const x = Math.cos(angle) * velocity * (Math.random() + 0.5) * 10;
    const y = Math.sin(angle) * velocity * (Math.random() + 0.5) * 10;
    
    // РЎРѕР·РґР°РµРј РіСЂР°РґРёРµРЅС‚ РґР»СЏ С‡Р°СЃС‚РёС†С‹
    const particleColor = color;
    particle.style.background = `radial-gradient(circle at center, ${particleColor}, ${adjustColor(particleColor, -30)})`;
    
    // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј РЅР°С‡Р°Р»СЊРЅСѓСЋ РїРѕР·РёС†РёСЋ
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    
    // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј РїР°СЂР°РјРµС‚СЂС‹ Р°РЅРёРјР°С†РёРё
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    // Р”РѕР±Р°РІР»СЏРµРј С‚РµРЅСЊ РґР»СЏ РѕР±СЉРµРјРЅРѕРіРѕ СЌС„С„РµРєС‚Р°
    particle.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px ${particleColor}`;
    
    cell.appendChild(particle);
    
    // РЈРґР°Р»СЏРµРј С‡Р°СЃС‚РёС†Сѓ РїРѕСЃР»Рµ Р·Р°РІРµСЂС€РµРЅРёСЏ Р°РЅРёРјР°С†РёРё
        setTimeout(() => {
      if (cell.contains(particle)) {
        cell.removeChild(particle);
      }
    }, 600);
  }
}

/**
 * РР·РјРµРЅСЏРµС‚ СЏСЂРєРѕСЃС‚СЊ С†РІРµС‚Р°
 * @param {string} color - CSS С†РІРµС‚
 * @param {number} percent - РїСЂРѕС†РµРЅС‚ РёР·РјРµРЅРµРЅРёСЏ (-100 РґРѕ 100)
 * @returns {string} - РЅРѕРІС‹Р№ С†РІРµС‚
 */
function adjustColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

/**
 * РџРѕРєР°Р· СЌС„С„РµРєС‚Р° РєРѕРјР±Рѕ
 */
function showComboEffect(points, centerCell, color) {
  const gameContainer = document.querySelector(".game-container");
  const comboText = document.createElement("div");
  comboText.className = "combo-text";
  
  // Р”РѕР±Р°РІР»СЏРµРј С‚РµРєСЃС‚ РєРѕРјР±Рѕ СЃ РјРЅРѕР¶РёС‚РµР»РµРј
  if (currentCombo > 1) {
    const multiplier = 1 + currentCombo * 0.3;
    comboText.textContent = `${currentCombo}x КОМБО! (${multiplier.toFixed(1)}x)`;
    comboText.dataset.combo = currentCombo.toString();
  } else if (points >= 50) {
    comboText.textContent = "СОҢУН!";
  } else {
    comboText.textContent = "АЙКАЛЫШ!";
  }
  
  // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј РїРѕР·РёС†РёСЋ С‚РµРєСЃС‚Р° РєРѕРјР±Рѕ
  const cell = document.querySelector(`.grid-cell[data-row="${centerCell.row}"][data-col="${centerCell.col}"]`);
  const cellRect = cell.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  
  comboText.style.left = `${cellRect.left - containerRect.left + cell.offsetWidth/2}px`;
  comboText.style.top = `${cellRect.top - containerRect.top + cell.offsetHeight/2}px`;
  comboText.style.setProperty("--combo-color", color);
  
  // Р”РѕР±Р°РІР»СЏРµРј СЌС„С„РµРєС‚С‹ РґР»СЏ РєРѕРјР±Рѕ
  const wave = document.createElement("div");
  wave.className = "combo-wave";
  wave.style.setProperty("--combo-color", color);
  comboText.appendChild(wave);
  
  // Р”РѕР±Р°РІР»СЏРµРј РёСЃРєСЂС‹ РґР»СЏ РІС‹СЃРѕРєРёС… РєРѕРјР±Рѕ РёР»Рё Р±РѕР»СЊС€РёС… РѕС‡РєРѕРІ
  if (currentCombo >= 3 || points >= 50) {
    const sparkCount = currentCombo >= 3 ? currentCombo * 4 : 8;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement("div");
      spark.className = "combo-spark";
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      spark.style.animationDelay = `${Math.random() * 0.3}s`;
      spark.style.backgroundColor = color;
      comboText.appendChild(spark);
    }
  }
  
  gameContainer.appendChild(comboText);
  
  // РџРѕРєР°Р·С‹РІР°РµРј РѕС‡РєРё СЃ РЅРµР±РѕР»СЊС€РѕР№ Р·Р°РґРµСЂР¶РєРѕР№
  setTimeout(() => {
    const pointsText = document.createElement("div");
    pointsText.className = "points-text";
    pointsText.textContent = `+${points}`;
    pointsText.style.left = comboText.style.left;
    pointsText.style.top = `${parseInt(comboText.style.top) + 40}px`;
    pointsText.style.setProperty("--combo-color", color);
    
    // Р”РѕР±Р°РІР»СЏРµРј СЌС„С„РµРєС‚ СЃРІРµС‡РµРЅРёСЏ РґР»СЏ Р±РѕР»СЊС€РёС… РѕС‡РєРѕРІ
    if (points >= 100) {
      pointsText.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
      pointsText.style.fontSize = '2rem';
    }
    
    gameContainer.appendChild(pointsText);
    
    setTimeout(() => {
      pointsText.classList.add("fade-out");
      setTimeout(() => {
        if (gameContainer.contains(pointsText)) {
          gameContainer.removeChild(pointsText);
        }
      }, 500);
    }, 1200);
  }, 200);
  
  // РЈРґР°Р»СЏРµРј С‚РµРєСЃС‚ РєРѕРјР±Рѕ
  setTimeout(() => {
    comboText.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(comboText)) {
        gameContainer.removeChild(comboText);
      }
    }, 500);
  }, 1200);
}

/**
 * РџРѕРєР°Р· СЌС„С„РµРєС‚Р° РјРµРіР°-РєРѕРјР±Рѕ
 * РћС‚РѕР±СЂР°Р¶Р°РµС‚ СЃРїРµС†РёР°Р»СЊРЅСѓСЋ Р°РЅРёРјР°С†РёСЋ РґР»СЏ РјРµРіР°-РєРѕРјР±Рѕ
 */
function showMegaComboEffect(points) {
  const gameContainer = document.querySelector(".game-container");
  const megaComboText = document.createElement("div");
  megaComboText.className = "mega-combo-text";
  megaComboText.textContent = "МЕГА КОМБО!";
  
  const pointsContainer = document.createElement("div");
  pointsContainer.className = "mega-combo-points";
  pointsContainer.textContent = `+${points}`;
  
  const containerRect = gameContainer.getBoundingClientRect();
  megaComboText.style.left = `${containerRect.width / 2}px`;
  megaComboText.style.top = `${containerRect.height / 2 - 50}px`;
  pointsContainer.style.left = `${containerRect.width / 2}px`;
  pointsContainer.style.top = `${containerRect.height / 2 + 50}px`;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "mega-combo-particle";
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 100 + Math.random() * 100;
    particle.style.setProperty("--angle", angle + "rad");
    particle.style.setProperty("--distance", distance + "px");
    particle.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)].color;
    megaComboText.appendChild(particle);
  }
  
  gameContainer.appendChild(megaComboText);
  gameContainer.appendChild(pointsContainer);
  
      setTimeout(() => {
    megaComboText.classList.add("fade-out");
    pointsContainer.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(megaComboText)) {
        gameContainer.removeChild(megaComboText);
      }
      if (gameContainer.contains(pointsContainer)) {
        gameContainer.removeChild(pointsContainer);
      }
    }, 1000);
  }, 2000);
}

/**
 * РџРѕРєР°Р· СЌС„С„РµРєС‚Р° РїСЂРµСЂС‹РІР°РЅРёСЏ РјРµРіР°-РєРѕРјР±Рѕ
 * РћС‚РѕР±СЂР°Р¶Р°РµС‚ Р°РЅРёРјР°С†РёСЋ РїСЂРё РЅРµСѓРґР°С‡РЅРѕРј РјРµРіР°-РєРѕРјР±Рѕ
 */
function showMegaComboBreakEffect() {
  const gameContainer = document.querySelector(".game-container");
  const breakText = document.createElement("div");
  breakText.className = "mega-combo-break-text";
  breakText.textContent = "МЫКТЫ ЖАРЫЛУУ!";
  gameContainer.appendChild(breakText);

  for (let i = 0; i < 40; i++) {
    const spark = document.createElement("div");
    spark.className = "mega-combo-particle";
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 150 + Math.random() * 150;
    spark.style.setProperty("--angle", angle + "rad");
    spark.style.setProperty("--distance", distance + "px");
    spark.style.animationDelay = `${Math.random() * 0.5}s`;
    breakText.appendChild(spark);
  }

  setTimeout(() => {
    breakText.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(breakText)) {
        gameContainer.removeChild(breakText);
      }
    }, 1000);
  }, 1500);
}

/**
 * РџСЂРѕРІРµСЂРєР° РѕРєРѕРЅС‡Р°РЅРёСЏ РёРіСЂС‹
 */
function checkForGameOver() {
  if (gameOver) return true;

  const upcomingBlocks = document.querySelectorAll('.upcoming-block');
  if (!upcomingBlocks.length) return false;

  // РџСЂРѕРІРµСЂСЏРµРј РєР°Р¶РґС‹Р№ upcoming Р±Р»РѕРє
  for (const block of upcomingBlocks) {
    const blockGrid = block.querySelector('.upcoming-block-grid');
    if (!blockGrid) continue;

    // РћРїСЂРµРґРµР»СЏРµРј С‚РёРї Р±Р»РѕРєР°
    let blockType;
    if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
    else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
    else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
    else blockType = '2x2';

    // Р”Р»СЏ L-РѕР±СЂР°Р·РЅРѕРіРѕ Р±Р»РѕРєР° РїСЂРѕРІРµСЂСЏРµРј РІСЃРµ РїРѕРІРѕСЂРѕС‚С‹
    if (blockType === 'l-shaped') {
      const originalRotation = parseInt(blockGrid.dataset.rotation || '0');
      
      for (let rotation = 0; rotation < 4; rotation++) {
        blockGrid.dataset.rotation = rotation.toString();
        
        // РџСЂРѕРІРµСЂСЏРµРј РІСЃРµ РІРѕР·РјРѕР¶РЅС‹Рµ РїРѕР·РёС†РёРё РґР»СЏ С‚РµРєСѓС‰РµРіРѕ РїРѕРІРѕСЂРѕС‚Р°
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            // Р’СЂРµРјРµРЅРЅРѕ РґРµР»Р°РµРј Р±Р»РѕРє "РїРµСЂРµС‚Р°СЃРєРёРІР°РµРјС‹Рј" РґР»СЏ РїСЂРѕРІРµСЂРєРё
            block.classList.add('dragging');
            const canPlace = canPlaceBlockAtPosition(row, col, blockType);
            block.classList.remove('dragging');
            
            if (canPlace) {
              blockGrid.dataset.rotation = originalRotation.toString();
              return false; // РќР°С€Р»Рё РІРѕР·РјРѕР¶РЅРѕРµ СЂР°Р·РјРµС‰РµРЅРёРµ
            }
          }
        }
      }
      
      blockGrid.dataset.rotation = originalRotation.toString();
    } else {
      // Р”Р»СЏ РѕСЃС‚Р°Р»СЊРЅС‹С… Р±Р»РѕРєРѕРІ РїСЂРѕРІРµСЂСЏРµРј РІСЃРµ РїРѕР·РёС†РёРё
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (canPlaceBlockAtPosition(row, col, blockType)) {
            return false; // РќР°С€Р»Рё РІРѕР·РјРѕР¶РЅРѕРµ СЂР°Р·РјРµС‰РµРЅРёРµ
          }
        }
      }
    }
  }

  // Р•СЃР»Рё РґРѕС€Р»Рё РґРѕ СЌС‚РѕР№ С‚РѕС‡РєРё, Р·РЅР°С‡РёС‚ РЅРё РѕРґРёРЅ Р±Р»РѕРє РЅРµР»СЊР·СЏ СЂР°Р·РјРµСЃС‚РёС‚СЊ
    gameOver = true;
  showGameOver("Оюн бүттү! Жарактуу жүрүш калган жок!");
    return true;
}

/**
 * РџРѕРєР°Р· СЌРєСЂР°РЅР° РѕРєРѕРЅС‡Р°РЅРёСЏ РёРіСЂС‹
 * @param {string} reason - РїСЂРёС‡РёРЅР° РѕРєРѕРЅС‡Р°РЅРёСЏ РёРіСЂС‹
 */
function showGameOver(reason) {
  let gameOverMessage = document.getElementById("gameOverMessage");
  if (!gameOverMessage) {
    gameOverMessage = document.createElement("div");
    gameOverMessage.id = "gameOverMessage";
    gameOverMessage.className = "game-over-message";
    
    const messageContent = document.createElement("div");
    messageContent.className = "game-over-content";
    
    const title = document.createElement("h2");
    title.textContent = "Оюн бүттү!";
    
    const finalScore = document.createElement("p");
    finalScore.textContent = `Акыркы упай: ${score}`;
    
    const reasonText = document.createElement("p");
    reasonText.textContent = reason;
    reasonText.style.fontSize = "1.2rem";
    reasonText.style.marginTop = "10px";
    
    const restartButton = document.createElement("button");
    restartButton.textContent = "Кайра ойноо";
    restartButton.className = "restart-button";
    restartButton.addEventListener("click", restartGame);
    
    messageContent.appendChild(title);
    messageContent.appendChild(finalScore);
    messageContent.appendChild(reasonText);
    messageContent.appendChild(restartButton);
    gameOverMessage.appendChild(messageContent);
    
    const gameContainer = document.querySelector(".game-container");
    gameContainer.appendChild(gameOverMessage);
  } else {
    const finalScore = gameOverMessage.querySelector("p");
    finalScore.textContent = `Акыркы упай: ${score}`;
    const reasonText = gameOverMessage.querySelectorAll("p")[1];
    reasonText.textContent = reason;
    gameOverMessage.style.display = "flex";
  }
}

/**
 * РћР±РЅРѕРІР»СЏРµС‚ РѕС‚РѕР±СЂР°Р¶РµРЅРёРµ СЃС‡РµС‚Р° РЅР° СЌРєСЂР°РЅРµ
 */
function updateScore() {
  const scoreElement = document.querySelector('.score-display');
  if (scoreElement) {
    scoreElement.textContent = `Упай: ${score}`;
  }
}

/**
 * РџРµСЂРµР·Р°РїСѓСЃРє РёРіСЂС‹
 * РЎР±СЂР°СЃС‹РІР°РµС‚ РІСЃРµ РїР°СЂР°РјРµС‚СЂС‹ Рё РЅР°С‡РёРЅР°РµС‚ РЅРѕРІСѓСЋ РёРіСЂСѓ
 */
function restartGame() {
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
  
  score = 0;
  gameOver = false;
  placedBlocksCount = 0;
  comboCount = 0;
  
  initializeGame();
}

function handleDragEnd(e) {
  const block = e.target.closest('.upcoming-block');
  if (block) {
    block.classList.remove('dragging');
  }
  clearHighlights();
  draggedBlock = null;
  draggedBlockColors = [];
}

// Call addStyles when the game initializes
window.addEventListener('load', () => {
  initializeGame();
});

/**
 * РћР±СЂР°Р±РѕС‚С‡РёРє СЂР°Р·РјРµС‰РµРЅРёСЏ Р±Р»РѕРєР°
 * РСЃРїРѕР»СЊР·СѓРµС‚ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ С†РІРµС‚Р° РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ
 */
function handleDrop(e) {
  e.preventDefault();
  if (gameOver) return;
  
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  
  try {
    const blockData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!blockData || !blockData.type || !blockData.colors) return;
  
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
  
    if (canPlaceBlockAtPosition(row, col, blockData.type)) {
      const placedCells = placeBlock(row, col, blockData);
      
      if (placedCells.length > 0) {
        // РЈРґР°Р»СЏРµРј СЂР°Р·РјРµС‰РµРЅРЅС‹Р№ Р±Р»РѕРє
        const draggedBlock = document.querySelector('.upcoming-block.dragging');
        if (draggedBlock) draggedBlock.remove();
        
        // РџСЂРѕРІРµСЂСЏРµРј СЃРѕРІРїР°РґРµРЅРёСЏ
        setTimeout(() => {
          const matches = findMatches();
          if (matches.length > 0) {
            removeMatches(matches);
          }
          
          // Р“РµРЅРµСЂРёСЂСѓРµРј РЅРѕРІС‹Рµ Р±Р»РѕРєРё РµСЃР»Рё РЅСѓР¶РЅРѕ
          const upcomingContainer = document.querySelector('.upcoming-blocks-container');
          if (upcomingContainer && upcomingContainer.children.length === 0) {
            generateUpcomingBlocks();
            // РџСЂРѕРІРµСЂСЏРµРј РѕРєРѕРЅС‡Р°РЅРёРµ РёРіСЂС‹ РїРѕСЃР»Рµ РіРµРЅРµСЂР°С†РёРё РЅРѕРІС‹С… Р±Р»РѕРєРѕРІ
            setTimeout(() => {
              checkForGameOver();
            }, 100);
          } else {
            // РџСЂРѕРІРµСЂСЏРµРј РѕРєРѕРЅС‡Р°РЅРёРµ РёРіСЂС‹ СЃ С‚РµРєСѓС‰РёРјРё Р±Р»РѕРєР°РјРё
            setTimeout(() => {
              checkForGameOver();
            }, 100);
          }
        }, 100);
      }
    }
  } catch (error) {
    console.error('РћС€РёР±РєР° РїСЂРё СЂР°Р·РјРµС‰РµРЅРёРё Р±Р»РѕРєР°:', error);
  }
  
  clearHighlights();
}

/**
 * РџСЂРѕРІРµСЂСЏРµС‚, РјРѕР¶РЅРѕ Р»Рё СЂР°Р·РјРµСЃС‚РёС‚СЊ L-РѕР±СЂР°Р·РЅС‹Р№ Р±Р»РѕРє РІ СѓРєР°Р·Р°РЅРЅРѕР№ РїРѕР·РёС†РёРё
 */
function canPlaceLShapedBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Р”Р»СЏ РїСЂРѕРІРµСЂРєРё РІРѕ РІСЂРµРјСЏ РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ
  const draggedBlock = document.querySelector('.upcoming-block.dragging');
  const blockGrid = draggedBlock ? draggedBlock.querySelector('.upcoming-block-grid') : null;
  const rotation = blockGrid ? parseInt(blockGrid.dataset.rotation || '0') : 0;

  // Р‘Р°Р·РѕРІР°СЏ РїСЂРѕРІРµСЂРєР° РіСЂР°РЅРёС†
  if (row < 0 || col < 0) return false;

  // РџСЂРѕРІРµСЂСЏРµРј Р·Р°РЅСЏС‚РѕСЃС‚СЊ СЏС‡РµРµРє РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РїРѕРІРѕСЂРѕС‚Р°
  switch (rotation) {
    case 0: // в”—
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled')
      );
    case 1: // в”Џ
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    case 2: // в”“
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    case 3: // в”›
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    default:
      return false;
  }
}

/**
 * РџСЂРѕРІРµСЂСЏРµС‚ Рё СѓРґР°Р»СЏРµС‚ Р·Р°РїРѕР»РЅРµРЅРЅС‹Рµ Р»РёРЅРёРё
 * РћР±РЅРѕРІР»СЏРµС‚ СЃС‡РµС‚ РїРѕСЃР»Рµ СѓРґР°Р»РµРЅРёСЏ Р»РёРЅРёР№
 */
function checkLines() {
  const grid = document.querySelector('.grid');
  const cells = grid.querySelectorAll('.grid-cell');
  let linesCleared = 0;
  
  // РџСЂРѕРІРµСЂСЏРµРј РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Рµ Р»РёРЅРёРё
  for (let row = 0; row < GRID_SIZE; row++) {
    let isLineFull = true;
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = cells[row * GRID_SIZE + col];
      if (!cell.classList.contains('filled')) {
        isLineFull = false;
        break;
      }
    }
    
    if (isLineFull) {
      // РЈРґР°Р»СЏРµРј Р»РёРЅРёСЋ
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = cells[row * GRID_SIZE + col];
        cell.classList.remove('filled');
        cell.style.backgroundColor = '';
      }
      
      // РЎРґРІРёРіР°РµРј РІСЃРµ Р±Р»РѕРєРё РІС‹С€Рµ РІРЅРёР·
      for (let r = row; r > 0; r--) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cellAbove = cells[(r - 1) * GRID_SIZE + col];
          const cell = cells[r * GRID_SIZE + col];
          
          if (cellAbove.classList.contains('filled')) {
            cell.classList.add('filled');
            cell.style.backgroundColor = cellAbove.style.backgroundColor;
            cellAbove.classList.remove('filled');
            cellAbove.style.backgroundColor = '';
          }
        }
      }
      
      linesCleared++;
      row--; // РџСЂРѕРІРµСЂСЏРµРј С‚Сѓ Р¶Рµ СЃС‚СЂРѕРєСѓ СЃРЅРѕРІР°, С‚Р°Рє РєР°Рє Р±Р»РѕРєРё СЃРґРІРёРЅСѓР»РёСЃСЊ РІРЅРёР·
    }
  }
  
  // РћР±РЅРѕРІР»СЏРµРј СЃС‡РµС‚
  if (linesCleared > 0) {
    score += linesCleared * 100;
    updateScore();
  }
}

function canPlaceHorizontalBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // РџСЂРѕРІРµСЂСЏРµРј РіСЂР°РЅРёС†С‹ РїРѕР»СЏ РґР»СЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° 1x3
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE - 2) {
    return false;
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј Р·Р°РЅСЏС‚РѕСЃС‚СЊ СЏС‡РµРµРє
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 2)].classList.contains('filled')
  );
}

function canPlaceVerticalBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // РџСЂРѕРІРµСЂСЏРµРј РіСЂР°РЅРёС†С‹ РїРѕР»СЏ РґР»СЏ РІРµСЂС‚РёРєР°Р»СЊРЅРѕРіРѕ Р±Р»РѕРєР° 1x3
  if (row < 0 || col < 0 || row >= GRID_SIZE - 2 || col >= GRID_SIZE) {
    return false;
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј Р·Р°РЅСЏС‚РѕСЃС‚СЊ СЏС‡РµРµРє
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 2) * GRID_SIZE + col].classList.contains('filled')
  );
}

function canPlace2x2Block(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // РџСЂРѕРІРµСЂСЏРµРј РіСЂР°РЅРёС†С‹ РїРѕР»СЏ РґР»СЏ Р±Р»РѕРєР° 2x2
  if (row < 0 || col < 0 || row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) {
    return false;
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј Р·Р°РЅСЏС‚РѕСЃС‚СЊ СЏС‡РµРµРє
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
  );
}



