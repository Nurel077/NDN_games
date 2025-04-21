const rainbowColors = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#60a5fa", // blue
  "#c084fc"  // purple
];

let draggedBlock = null;
let draggedBlockColors = [];
let highlightedCells = [];
let score = 0;
let gameOver = false;
let currentCombo = 0;
let isComboActive = false;
let placedBlocksCount = 0;
let hasExplosionInRound = false;
let megaComboActive = false;
let allBlocksExploded = false;
let currentMatchGroups = [];
let currentDraggedColors = null;
let lastComboTime = 0;

/**
 * Инициализация игры
 * Создает игровое поле и начальные блоки
 */
function initializeGame() {
  const grid = document.querySelector('.game-grid');
  if (!grid) return;

  // Очищаем сетку
  grid.innerHTML = '';

  // Создаем ячейки сетки
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      grid.appendChild(cell);
    }
  }

  // Добавляем обработчики событий для drag and drop
  grid.addEventListener('dragover', handleDragOver);
  grid.addEventListener('drop', handleDrop);

  // Генерируем начальные блоки
  generateUpcomingBlocks();
}

/**
 * Создание игровой сетки 8x8
 * Очищает предыдущее состояние и создает новую сетку
 */
function initializeGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = '';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
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
  
  score = 0;
  updateScore();
  gameOver = false;
  placedBlocksCount = 0;
  
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
}

/**
 * Получение случайного цвета с учетом уже использованных цветов
 * @param {Array} usedColors - массив уже использованных цветов в текущем блоке
 * @returns {string} - цвет в формате HEX
 */
function getRandomColor(usedColors = []) {
  const colorProbabilities = [
    { color: '#FF69B4', weight: 25 }, // Розовый - обычный
    { color: '#FF4500', weight: 25 }, // Оранжевый - обычный
    { color: '#9370DB', weight: 20 }, // Фиолетовый - редкий
    { color: '#32CD32', weight: 20 }, // Зеленый - редкий
    { color: '#FFD700', weight: 10 }  // Золотой - очень редкий
  ];

  // Подсчитываем количество каждого цвета в текущем блоке
  const colorCounts = {};
  usedColors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  // Фильтруем цвета, которые уже использованы 2 раза
  const availableColors = colorProbabilities.filter(item => 
    !colorCounts[item.color] || colorCounts[item.color] < 2
  );

  // Если все цвета использованы по 2 раза (что не должно случиться),
  // возвращаем случайный цвет из всех возможных
  if (availableColors.length === 0) {
    return colorProbabilities[Math.floor(Math.random() * colorProbabilities.length)].color;
  }

  // Считаем общий вес доступных цветов
  const totalWeight = availableColors.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  // Выбираем цвет с учетом весов
  for (const item of availableColors) {
    if (random < item.weight) {
      return item.color;
    }
    random -= item.weight;
  }
  return availableColors[0].color;
}

/**
 * Генерация трех новых блоков
 * Теперь с ограничением на количество одинаковых цветов
 */
function generateUpcomingBlocks() {
  const container = document.querySelector('.upcoming-blocks-container');
  if (!container) return;

  container.innerHTML = '';
  
  for (let i = 0; i < 3; i++) {
    const block = document.createElement('div');
    block.className = 'upcoming-block';
    block.draggable = true;
    
    const blockGrid = document.createElement('div');
    blockGrid.className = 'upcoming-block-grid';
    
    // Вероятности для разных типов блоков
    const blockTypeRandom = Math.random() * 100;
    let blockType;
    
    if (blockTypeRandom < 40) { // 40% шанс для 2x2
      blockType = 0;
    } else if (blockTypeRandom < 70) { // 30% шанс для горизонтального 1x3
      blockType = 1;
    } else { // 30% шанс для вертикального 1x3
      blockType = 2;
    }
    
    // Массив для отслеживания использованных цветов в текущем блоке
    const blockColors = [];
    
    if (blockType === 0) {
      // Блок 2x2
    for (let j = 0; j < 4; j++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
      }
    } else if (blockType === 1) {
      // Горизонтальный блок 1x3
      blockGrid.classList.add('horizontal-1x3');
      for (let j = 0; j < 3; j++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
      }
    } else {
      // Вертикальный блок 1x3
      blockGrid.classList.add('vertical-1x3');
      for (let j = 0; j < 3; j++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
      }
    }
    
    block.appendChild(blockGrid);
    container.appendChild(block);
    
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragend', handleDragEnd);
  }
}

/**
 * Обработчик начала перетаскивания блока
 * Сохраняет цвета текущего блока и добавляет класс dragging
 */
function handleDragStart(e) {
  const block = e.target.closest('.upcoming-block');
  if (!block) return;
  
  draggedBlock = block;
  block.classList.add('dragging');
  
  // Сохраняем цвета текущего блока
  const cells = block.querySelectorAll('.upcoming-block-cell');
  currentDraggedColors = Array.from(cells).map(cell => cell.style.backgroundColor);
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');
}

/**
 * Обработчик перетаскивания над ячейкой
 * Показывает область размещения блока 2x2
 */
function handleDragOver(e) {
  e.preventDefault();
  const cell = e.target.closest('.grid-cell');
  if (!cell || !draggedBlock) return;
  
  // Очищаем предыдущие подсветки
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
  
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  // Определяем тип блока
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  const blockType = blockGrid.classList.contains('horizontal-1x3') ? 'horizontal' :
                   blockGrid.classList.contains('vertical-1x3') ? 'vertical' : '2x2';
  
  // Определяем размеры блока
  let width, height;
  switch (blockType) {
    case '2x2':
      width = 2; height = 2;
      break;
    case 'horizontal':
      width = 3; height = 1;
      break;
    case 'vertical':
      width = 1; height = 3;
      break;
  }
  
  // Проверяем возможность размещения и подсвечиваем ячейки
  const canPlace = canPlaceBlockAtPosition(row, col, blockType);
  if (canPlace) {
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        const targetCell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
        if (targetCell) {
          targetCell.classList.add('valid-drop');
        }
      }
    }
  } else {
    cell.classList.add('invalid-drop');
  }
}

/**
 * Обработчик выхода за пределы ячейки
 * Убирает подсветку области размещения
 */
function handleDragLeave(e) {
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  clearHighlights();
}

/**
 * Очистка подсветки всех ячеек
 * Убирает классы valid-drop и invalid-drop
 */
function clearHighlights() {
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
}

/**
 * Подсветка области 2x2 для размещения блока
 * Показывает зеленым если можно разместить, красным если нельзя
 */
function highlightPlacementArea(row, col, isValid) {
  for (let r = row; r < row + 2 && r < 8; r++) {
    for (let c = col; c < col + 2 && c < 8; c++) {
      const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) {
        cell.classList.add(isValid ? 'valid-drop' : 'invalid-drop');
      }
    }
  }
}

/**
 * Проверка наличия свободного места для блока
 * @param {number} row - начальная строка
 * @param {number} col - начальный столбец
 * @param {string} blockType - тип блока ('2x2', 'horizontal', 'vertical')
 * @returns {boolean} - true если блок можно разместить
 */
function canPlaceBlockAtPosition(row, col, blockType) {
  // Проверяем базовые границы
  if (row < 0 || col < 0) return false;

  // Определяем размеры и ограничения для каждого типа блока
  let width, height;
  switch (blockType) {
    case '2x2':
      width = 2; height = 2;
      if (row > 6 || col > 6) return false;
      break;
    case 'horizontal':
      width = 3; height = 1;
      if (row > 7 || col > 5) return false;
      break;
    case 'vertical':
      width = 1; height = 3;
      if (row > 5 || col > 7) return false;
      break;
    default:
      return false;
  }

  // Проверяем каждую ячейку в области блока
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
      if (!cell || cell.querySelector('.filled-cell')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Проверяет схождение цветов для вертикального или горизонтального блока
 * @param {number} startRow - Начальная строка блока
 * @param {number} startCol - Начальный столбец блока
 * @param {boolean} isHorizontal - true для горизонтального блока, false для вертикального
 * @param {Array} colors - Массив цветов блока
 * @returns {boolean} - true если есть схождение цветов, false если нет
 */
function checkColorConvergence(startRow, startCol, isHorizontal, colors) {
  // Проверяем соседние ячейки на схождение цветов
  if (isHorizontal) {
    // Для горизонтального блока проверяем верхнюю и нижнюю ячейки
    for (let i = 0; i < 3; i++) {
      const col = startCol + i;
      
      // Проверяем верхнюю ячейку
      if (startRow > 0) {
        const topCell = document.querySelector(`.grid-cell[data-row="${startRow - 1}"][data-col="${col}"]`);
        const topFilledCell = topCell?.querySelector('.filled-cell');
        if (topFilledCell && colors.includes(topFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // Проверяем нижнюю ячейку
      if (startRow < 7) {
        const bottomCell = document.querySelector(`.grid-cell[data-row="${startRow + 1}"][data-col="${col}"]`);
        const bottomFilledCell = bottomCell?.querySelector('.filled-cell');
        if (bottomFilledCell && colors.includes(bottomFilledCell.style.backgroundColor)) {
          return true;
        }
      }
    }
  } else {
    // Для вертикального блока проверяем левую и правую ячейки
    for (let i = 0; i < 3; i++) {
      const row = startRow + i;
      
      // Проверяем левую ячейку
      if (startCol > 0) {
        const leftCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${startCol - 1}"]`);
        const leftFilledCell = leftCell?.querySelector('.filled-cell');
        if (leftFilledCell && colors.includes(leftFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // Проверяем правую ячейку
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
 * Показывает сообщение о том, что нет схождения цветов
 */
function showNoConvergenceMessage() {
  const message = document.createElement('div');
  message.className = 'no-convergence-message';
  message.textContent = 'Нет схождения цветов!';
  
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

function placeBlockInGrid(row, col, colors) {
  let colorIndex = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`);
      if (cell) {
        const filledCell = document.createElement('div');
        filledCell.className = 'filled-cell';
        filledCell.style.backgroundColor = colors[colorIndex];
        
        // Remove any existing filled cell
        const existingFilledCell = cell.querySelector('.filled-cell');
        if (existingFilledCell) {
          existingFilledCell.remove();
        }
        
        // Add animation class
        filledCell.style.transform = 'scale(0)';
        cell.appendChild(filledCell);
        
        // Trigger animation
    setTimeout(() => {
          filledCell.style.transform = 'scale(1)';
        }, 50 * colorIndex);
        
        colorIndex++;
      }
    }
  }
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
 * Поиск совпадающих блоков
 * Ищет группы из 3+ соединенных блоков одного цвета
 * Возвращает массив групп совпадений
 */
function findMatches() {
  const matchGroups = [];
  const visited = new Set();
  
  function getBlockColor(row, col) {
    const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    const filledCell = cell?.querySelector('.filled-cell');
    return filledCell ? filledCell.style.backgroundColor : null;
  }
  
  // Функция для проверки соединенных блоков
  function checkConnectedBlocks(startRow, startCol) {
    const color = getBlockColor(startRow, startCol);
    if (!color) return [];
    
    const connected = [];
    const queue = [{row: startRow, col: startCol}];
    const localVisited = new Set();
    
    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.row},${current.col}`;
      
      if (localVisited.has(key)) continue;
      localVisited.add(key);
      
      const currentColor = getBlockColor(current.row, current.col);
      if (currentColor !== color) continue;
      
      connected.push(current);
      
      // Проверяем соседние ячейки
      const directions = [
        {row: -1, col: 0}, // вверх
        {row: 1, col: 0},  // вниз
        {row: 0, col: -1}, // влево
        {row: 0, col: 1}   // вправо
      ];
      
      for (const dir of directions) {
        const newRow = current.row + dir.row;
        const newCol = current.col + dir.col;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const newKey = `${newRow},${newCol}`;
          if (!localVisited.has(newKey) && getBlockColor(newRow, newCol) === color) {
            queue.push({row: newRow, col: newCol});
          }
        }
      }
    }
    
    // Добавляем все посещенные ячейки в глобальный набор
    localVisited.forEach(key => visited.add(key));
    
    return connected;
  }
  
  // Проверяем все ячейки
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const key = `${row},${col}`;
      if (!visited.has(key)) {
        const connected = checkConnectedBlocks(row, col);
        if (connected.length >= 3) {
          matchGroups.push({
            color: getBlockColor(row, col),
            cells: connected
          });
        }
      }
    }
  }
  
  return matchGroups;
}

/**
 * Удаление совпавших блоков
 * Создает эффект взрыва и удаляет блоки
 */
function removeMatches(matches) {
  matches.forEach(({ row, col }) => {
    const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    const filledCell = cell?.querySelector('.filled-cell');
      if (filledCell) {
      filledCell.classList.add('explode');
    setTimeout(() => {
        filledCell.remove();
      }, 300);
    }
  });
}

/**
 * Применение гравитации
 * Заставляет блоки падать вниз в пустые ячейки
 */
function applyGravity() {
  let moved = false;
  
  for (let col = 0; col < 8; col++) {
    for (let row = 7; row >= 0; row--) {
      const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
      if (!cell?.querySelector('.filled-cell')) {
        for (let r = row - 1; r >= 0; r--) {
          const upperCell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${col}"]`);
          const filledCell = upperCell?.querySelector('.filled-cell');
          if (filledCell) {
            const fallDistance = (row - r) * 100;
            filledCell.style.setProperty('--fall-distance', `${fallDistance}%`);
            filledCell.classList.add('falling');
            
            cell.appendChild(filledCell);
            moved = true;
            
            setTimeout(() => {
              filledCell.classList.remove('falling');
            }, 300);
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

/**
 * Перемещение блока между ячейками
 * Используется для анимации падения
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
 * Проверка совпадений после размещения блока
 * Обновленная система подсчета очков
 */
function checkForMatches() {
  const matchGroups = findMatches();
  
  if (matchGroups.length > 0) {
    hasExplosionInRound = true;
    let totalPoints = 0;
    let maxGroupSize = 0;
    
    // Обрабатываем каждую группу как отдельное комбо
    matchGroups.forEach(group => {
      if (group.cells.length >= 3) {
        // Базовые очки теперь зависят от цвета блока
        let basePoints = 0;
        switch (group.color) {
          case '#FFD700': // Золотой
            basePoints = 200;
            break;
          case '#9370DB': // Фиолетовый
          case '#32CD32': // Зеленый
            basePoints = 150;
            break;
          default:
            basePoints = 100;
        }
        
        // Базовые очки за группу
        let groupPoints = group.cells.length * basePoints;
        
        // Бонус за большие группы (уменьшен)
        if (group.cells.length > 3) {
          groupPoints *= (1 + (group.cells.length - 3) * 0.3); // +30% за каждый дополнительный блок
        }
        
        // Множитель комбо (уменьшен)
        groupPoints *= (1 + currentCombo * 0.2); // +20% за каждое комбо
        
        // Штраф за слишком частые комбо
        if (Date.now() - lastComboTime < 2000) { // Если прошло менее 2 секунд
          groupPoints *= 0.8; // Уменьшаем очки на 20%
        }
        
        totalPoints += Math.round(groupPoints);
        maxGroupSize = Math.max(maxGroupSize, group.cells.length);
        
        // Показываем эффект комбо для этой группы
        const centerCell = findCenterCell(group.cells);
        showComboEffect(Math.round(groupPoints), centerCell, group.color);
        
        // Создаем эффект взрыва для каждой ячейки в группе
        group.cells.forEach(({row, col}) => {
          const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
          const filledCell = cell?.querySelector('.filled-cell');
          
          if (filledCell) {
            createExplosionEffect(cell, filledCell.style.backgroundColor);
            filledCell.classList.add('explode');
            setTimeout(() => {
              if (filledCell.parentNode) {
                filledCell.remove();
              }
            }, 300);
          }
        });
      }
    });
    
    // Добавляем очки к общему счету
    score += totalPoints;
    updateScore();
    
    // Показываем мега-комбо эффект только при действительно впечатляющих комбинациях
    if (matchGroups.length >= 3 || maxGroupSize >= 6) {
      showMegaComboEffect(totalPoints);
    }
    
    // Применяем гравитацию после всех взрывов
    setTimeout(() => {
      const moved = applyGravity();
      if (moved) {
        setTimeout(checkForMatches, 300);
      } else {
        setTimeout(() => {
          currentCombo = 0;
        }, 500);
      }
    }, 300);
  } else {
    setTimeout(() => {
      currentCombo = 0;
    }, 500);
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
 * Создание эффекта взрыва
 * Генерирует частицы цвета взорвавшегося блока
 */
function createExplosionEffect(cell, color) {
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    // Случайное направление для частиц
    const angle = (Math.random() * Math.PI * 2);
    const distance = 20 + Math.random() * 30;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    particle.style.backgroundColor = color;
    particle.style.left = `calc(50% + ${x}px)`;
    particle.style.top = `calc(50% + ${y}px)`;
    
    // Добавляем случайное вращение
    particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    cell.appendChild(particle);
    
        setTimeout(() => {
      if (cell.contains(particle)) {
        cell.removeChild(particle);
      }
    }, 500);
  }
}

/**
 * Показ эффекта комбо
 * Отображает текст и анимацию для комбо
 */
function showComboEffect(points, centerCell, color) {
  const gameContainer = document.querySelector(".game-container");
  const comboText = document.createElement("div");
  comboText.className = "combo-text";
  
  // Добавляем текст комбо с множителем
  if (currentCombo > 1) {
    const multiplier = 1 + currentCombo * 0.3;
    comboText.textContent = `${currentCombo}x COMBO! (${multiplier.toFixed(1)}x)`;
    comboText.dataset.combo = currentCombo.toString();
  } else {
    comboText.textContent = "MATCH!";
  }
  
  // Устанавливаем позицию текста комбо
  const cell = document.querySelector(`.grid-cell[data-row="${centerCell.row}"][data-col="${centerCell.col}"]`);
  const cellRect = cell.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  
  comboText.style.left = `${cellRect.left - containerRect.left + cell.offsetWidth/2}px`;
  comboText.style.top = `${cellRect.top - containerRect.top + cell.offsetHeight/2}px`;
  comboText.style.setProperty("--combo-color", color);
  
  // Добавляем эффекты для комбо
  const wave = document.createElement("div");
  wave.className = "combo-wave";
  wave.style.setProperty("--combo-color", color);
  comboText.appendChild(wave);
  
  // Добавляем искры для высоких комбо
  if (currentCombo >= 3) {
    for (let i = 0; i < currentCombo * 4; i++) {
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
  
  // Показываем очки с небольшой задержкой
  setTimeout(() => {
    const pointsText = document.createElement("div");
    pointsText.className = "points-text";
    pointsText.textContent = `+${points}`;
    pointsText.style.left = comboText.style.left;
    pointsText.style.top = `${parseInt(comboText.style.top) + 40}px`;
    pointsText.style.setProperty("--combo-color", color);
    
    // Добавляем эффект свечения для больших очков
    if (points >= 1000) {
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
  
  // Удаляем текст комбо
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
 * Показ эффекта мега-комбо
 * Отображает специальную анимацию для мега-комбо
 */
function showMegaComboEffect(points) {
  const gameContainer = document.querySelector(".game-container");
  const megaComboText = document.createElement("div");
  megaComboText.className = "mega-combo-text";
  megaComboText.textContent = "MEGA COMBO!";
  
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
    particle.style.backgroundColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
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
 * Показ эффекта прерывания мега-комбо
 * Отображает анимацию при неудачном мега-комбо
 */
function showMegaComboBreakEffect() {
  const gameContainer = document.querySelector(".game-container");
  const breakText = document.createElement("div");
  breakText.className = "mega-combo-break-text";
  breakText.textContent = "PERFECT BLAST!";
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
 * Проверка окончания игры
 * @returns {boolean} - true если игра окончена
 */
function checkForGameOver() {
  // Сначала проверяем, есть ли возможные совпадения на поле
  function checkForPossibleMatches() {
    // Получаем все заполненные ячейки
    const filledCells = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        const filledCell = cell?.querySelector('.filled-cell');
        if (filledCell) {
          filledCells.push({
            row,
            col,
            color: filledCell.style.backgroundColor
          });
        }
      }
    }

    // Проверяем каждую ячейку на возможные совпадения
    for (let i = 0; i < filledCells.length; i++) {
      const current = filledCells[i];
      let sameColorCount = 1;
      
      // Проверяем соседние ячейки того же цвета
      for (let j = 0; j < filledCells.length; j++) {
        if (i !== j) {
          const other = filledCells[j];
          if (current.color === other.color) {
            // Проверяем, являются ли ячейки соседними
            const rowDiff = Math.abs(current.row - other.row);
            const colDiff = Math.abs(current.col - other.col);
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
              sameColorCount++;
              if (sameColorCount >= 3) {
                return true; // Найдено возможное совпадение
              }
            }
          }
        }
      }
    }
    return false;
  }

  // Проверяем возможность размещения блока 2x2
  function canPlace2x2() {
    for (let row = 0; row <= 6; row++) {
      for (let col = 0; col <= 6; col++) {
        let canPlace = true;
        // Проверяем все 4 ячейки блока 2x2
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 2; c++) {
            const cell = document.querySelector(`.grid-cell[data-row="${row + r}"][data-col="${col + c}"]`);
            if (!cell || cell.querySelector('.filled-cell')) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        if (canPlace) return true;
      }
    }
    return false;
  }

  // Проверяем возможность размещения горизонтального блока 1x3
  function canPlaceHorizontal() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col <= 5; col++) {
        let canPlace = true;
        for (let c = 0; c < 3; c++) {
          const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col + c}"]`);
          if (!cell || cell.querySelector('.filled-cell')) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) return true;
      }
    }
    return false;
  }

  // Проверяем возможность размещения вертикального блока 1x3
  function canPlaceVertical() {
    for (let row = 0; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        let canPlace = true;
        for (let r = 0; r < 3; r++) {
          const cell = document.querySelector(`.grid-cell[data-row="${row + r}"][data-col="${col}"]`);
          if (!cell || cell.querySelector('.filled-cell')) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) return true;
      }
    }
    return false;
  }

  const hasPossibleMatches = checkForPossibleMatches();
  if (hasPossibleMatches) {
    return false; // Игра продолжается, если есть возможные совпадения
  }

  // Проверяем возможность размещения каждого типа блока
  const can2x2 = canPlace2x2();
  const canHorizontal = canPlaceHorizontal();
  const canVertical = canPlaceVertical();

  // Проверяем текущий блок
  const currentBlock = document.querySelector('.upcoming-block');
  if (currentBlock) {
    const blockGrid = currentBlock.querySelector('.upcoming-block-grid');
    const isHorizontal = blockGrid.classList.contains('horizontal-1x3');
    const isVertical = blockGrid.classList.contains('vertical-1x3');
    
    // Если текущий блок 2x2 и нет места для него - игра окончена
    if (!isHorizontal && !isVertical && !can2x2) {
      gameOver = true;
      showGameOver("Game Over! No space for current block!");
      return true;
    }
    
    // Если текущий блок горизонтальный 1x3 и нет места для него
    if (isHorizontal && !canHorizontal) {
      gameOver = true;
      showGameOver("Game Over! No space for current block!");
      return true;
    }
    
    // Если текущий блок вертикальный 1x3 и нет места для него
    if (isVertical && !canVertical) {
      gameOver = true;
      showGameOver("Game Over! No space for current block!");
      return true;
    }
  }

  // Если нет возможных совпадений и нет места для любых блоков
  if (!hasPossibleMatches && !can2x2 && !canHorizontal && !canVertical) {
    gameOver = true;
    showGameOver("Game Over! No possible matches and no space for new blocks!");
    return true;
  }

  return false;
}

/**
 * Показ экрана окончания игры
 * @param {string} reason - причина окончания игры
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
    title.textContent = "Game Over!";
    
    const finalScore = document.createElement("p");
    finalScore.textContent = `Final Score: ${score}`;
    
    const reasonText = document.createElement("p");
    reasonText.textContent = reason;
    reasonText.style.fontSize = "1.2rem";
    reasonText.style.marginTop = "10px";
    
    const restartButton = document.createElement("button");
    restartButton.textContent = "Play Again";
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
    finalScore.textContent = `Final Score: ${score}`;
    const reasonText = gameOverMessage.querySelectorAll("p")[1];
    reasonText.textContent = reason;
    gameOverMessage.style.display = "flex";
  }
}

/**
 * Обновление счета
 * Обновляет отображение счета с анимацией
 */
function updateScore() {
  const scoreDisplay = document.querySelector('.score-display');
  if (scoreDisplay) {
    // Анимируем изменение счета
    const oldScore = parseInt(scoreDisplay.dataset.score || '0');
    const scoreDiff = score - oldScore;
    
    if (scoreDiff > 0) {
      // Добавляем эффект увеличения для счета
      scoreDisplay.style.transform = 'scale(1.2)';
      scoreDisplay.style.color = '#FFD700'; // Золотой цвет для увеличения счета
      
      setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
        scoreDisplay.style.color = '#fff';
      }, 300);
    }
    
    scoreDisplay.dataset.score = score.toString();
    scoreDisplay.innerHTML = `Score: <span class="score-value">${score}</span>`;
    
    // Добавляем класс для высоких счетов
    if (score >= 10000) {
      scoreDisplay.classList.add('high-score');
    }
  }
}

/**
 * Перезапуск игры
 * Сбрасывает все параметры и начинает новую игру
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
  if (draggedBlock) {
    draggedBlock.classList.remove('dragging');
  }
}

// Call addStyles when the game initializes
window.addEventListener('load', () => {
  initializeGame();
});

/**
 * Обработчик размещения блока
 * Использует сохраненные цвета для размещения
 */
function handleDrop(e) {
  e.preventDefault();
  const cell = e.target.closest('.grid-cell');
  if (!cell || !draggedBlock || !currentDraggedColors) return;
  
  // Очищаем подсветку
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
  
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  const isHorizontal1x3 = blockGrid.classList.contains('horizontal-1x3');
  const isVertical1x3 = blockGrid.classList.contains('vertical-1x3');
  
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  // Определяем тип блока
  let blockType = '2x2';
  if (isHorizontal1x3) blockType = 'horizontal';
  if (isVertical1x3) blockType = 'vertical';
  
  // Проверяем возможность размещения
  if (!canPlaceBlockAtPosition(row, col, blockType)) return;
  
  // Сбрасываем флаг взрывов для нового хода
  hasExplosionInRound = false;
  
  // Собираем целевые ячейки
  const targetCells = [];
  if (blockType === '2x2') {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        targetCells.push(document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`));
      }
    }
  } else if (blockType === 'horizontal') {
    for (let i = 0; i < 3; i++) {
      targetCells.push(document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col + i}"]`));
    }
  } else {
    for (let i = 0; i < 3; i++) {
      targetCells.push(document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col}"]`));
    }
  }
  
  // Размещаем блок
  targetCells.forEach((targetCell, index) => {
    const filledCell = document.createElement('div');
    filledCell.className = 'filled-cell';
    filledCell.style.backgroundColor = currentDraggedColors[index];
    targetCell.appendChild(filledCell);
  });
  
  draggedBlock.remove();
  draggedBlock = null;
  currentDraggedColors = null;
  
  // Проверяем совпадения после размещения блока
  setTimeout(() => {
    checkForMatches();
    
    // Проверяем, нужно ли сгенерировать новые блоки
    const container = document.querySelector('.upcoming-blocks-container');
    if (!container || container.children.length === 0) {
      generateUpcomingBlocks();
    }
    
    // Проверяем возможность продолжения игры после того, как все эффекты завершены
    setTimeout(() => {
      checkForGameOver();
    }, 1000);
  }, 100);
}

