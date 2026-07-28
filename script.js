/**
 * PINK CALCULATOR - 100% UNBEATABLE CORE APPLICATION SCRIPT
 * Direct Window Handlers + Immediate Init + Event Listener Fallbacks
 */

(function () {
  // State Variables
  let expression = '';
  let currentInput = '0';
  let isEvaluated = false;
  let isDegreeMode = true;
  let soundEnabled = true;
  let historyLog = [];

  // DOM Cache
  let expressionDisplay, mainDisplay, copyBtn, soundToggleBtn;
  let themeDropdownBtn, themeMenu, historyToggleBtn, historyDrawer;
  let closeHistoryBtn, clearHistoryBtn, drawerOverlay, historyList;
  let degRadBtn, toast, toastMsg, tabBtns, scientificPanel;
  let keypadSection, converterSection, converterCategory;
  let converterFromUnit, converterToUnit, converterInputVal;
  let converterOutputVal, converterSwapBtn;

  function cacheDOMElements() {
    expressionDisplay = document.getElementById('expressionDisplay');
    mainDisplay = document.getElementById('mainDisplay');
    copyBtn = document.getElementById('copyBtn');
    soundToggleBtn = document.getElementById('soundToggleBtn');
    themeDropdownBtn = document.getElementById('themeDropdownBtn');
    themeMenu = document.getElementById('themeMenu');
    historyToggleBtn = document.getElementById('historyToggleBtn');
    historyDrawer = document.getElementById('historyDrawer');
    closeHistoryBtn = document.getElementById('closeHistoryBtn');
    clearHistoryBtn = document.getElementById('clearHistoryBtn');
    drawerOverlay = document.getElementById('drawerOverlay');
    historyList = document.getElementById('historyList');
    degRadBtn = document.getElementById('degRadBtn');
    toast = document.getElementById('toastNotification');
    toastMsg = document.getElementById('toastMsg');

    tabBtns = document.querySelectorAll('.tab-btn');
    scientificPanel = document.getElementById('scientificPanel');
    keypadSection = document.getElementById('keypadSection');
    converterSection = document.getElementById('converterSection');

    converterCategory = document.getElementById('converterCategory');
    converterFromUnit = document.getElementById('converterFromUnit');
    converterToUnit = document.getElementById('converterToUnit');
    converterInputVal = document.getElementById('converterInputVal');
    converterOutputVal = document.getElementById('converterOutputVal');
    converterSwapBtn = document.getElementById('converterSwapBtn');
  }

  function init() {
    cacheDOMElements();

    // Safe History Load
    try {
      const stored = localStorage.getItem('pink_calc_history');
      if (stored) historyLog = JSON.parse(stored);
    } catch (e) {
      historyLog = [];
    }

    // Safe Theme Load
    try {
      const savedTheme = localStorage.getItem('pink_calc_theme') || 'pastel';
      window.selectTheme(savedTheme);
    } catch {
      window.selectTheme('pastel');
    }

    updateDisplay();
    renderHistory();
    initConverterUI();
    attachKeyboardListeners();
  }

  // ==========================================
  // WEB AUDIO API SYNTHESIZER
  // ==========================================
  let audioCtx = null;

  function initAudio() {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {}
  }

  function playClickSound(type = 'number') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'number') {
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (type === 'operator') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1050, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      } else if (type === 'action') {
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      } else if (type === 'equals') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // ==========================================
  // DISPLAY UPDATE
  // ==========================================
  function updateDisplay() {
    if (!mainDisplay || !expressionDisplay) cacheDOMElements();
    if (expressionDisplay) {
      expressionDisplay.textContent = formatExpressionForDisplay(expression);
    }
    if (mainDisplay) {
      mainDisplay.textContent = formatNumberForDisplay(currentInput);
      mainDisplay.scrollLeft = mainDisplay.scrollWidth;
    }
  }

  function formatNumberForDisplay(val) {
    if (val === 'Error' || val === 'NaN' || val === 'Infinity') return 'Error 🌸';
    if (val.length > 14 && !val.includes('e')) {
      const num = parseFloat(val);
      if (!isNaN(num)) return num.toPrecision(9);
    }
    return val;
  }

  function formatExpressionForDisplay(expr) {
    return expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/sqrt\(/g, '√(')
      .replace(/pi/g, 'π');
  }

  // ==========================================
  // GLOBAL EXPOSED ACTION HANDLERS
  // ==========================================
  window.pressValue = function (val) {
    if (isEvaluated) {
      currentInput = val === '.' ? '0.' : val;
      expression = '';
      isEvaluated = false;
    } else {
      if (val === '.') {
        if (!currentInput.includes('.')) {
          currentInput += '.';
        }
      } else {
        if (currentInput === '0') {
          currentInput = val;
        } else {
          currentInput += val;
        }
      }
    }
    updateDisplay();
    playClickSound('number');
  };

  window.pressOperator = function (op) {
    playClickSound('operator');
    if (isEvaluated) {
      expression = currentInput + ' ' + op + ' ';
      currentInput = '0';
      isEvaluated = false;
    } else {
      if (currentInput !== '0' || expression === '') {
        expression += currentInput + ' ' + op + ' ';
        currentInput = '0';
      } else if (expression !== '') {
        expression = expression.trim().slice(0, -1) + ' ' + op + ' ';
      }
    }
    updateDisplay();
  };

  window.pressAction = function (action) {
    switch (action) {
      case 'clear-all':
        playClickSound('action');
        expression = '';
        currentInput = '0';
        isEvaluated = false;
        break;

      case 'delete':
        playClickSound('action');
        if (!isEvaluated) {
          if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
          } else {
            currentInput = '0';
          }
        }
        break;

      case 'plus-minus':
        playClickSound('action');
        if (currentInput !== '0') {
          if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
          } else {
            currentInput = '-' + currentInput;
          }
        }
        break;

      case 'percent':
        playClickSound('operator');
        try {
          const num = parseFloat(currentInput);
          currentInput = (num / 100).toString();
        } catch {
          currentInput = 'Error';
        }
        break;

      case 'calculate':
        evaluateExpression();
        break;

      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case 'ln':
      case 'sqrt':
        playClickSound('operator');
        applyScientificFunc(action);
        break;

      case 'pow':
        window.pressOperator('^');
        break;

      case 'pi':
        playClickSound('number');
        currentInput = Math.PI.toString();
        break;

      case 'e':
        playClickSound('number');
        currentInput = Math.E.toString();
        break;

      case 'fact':
        playClickSound('operator');
        calculateFactorial();
        break;

      case 'bracket-open':
        playClickSound('operator');
        expression += ' ( ';
        updateDisplay();
        break;

      case 'bracket-close':
        playClickSound('operator');
        expression += currentInput + ' ) ';
        currentInput = '0';
        updateDisplay();
        break;

      case 'deg-rad':
        isDegreeMode = !isDegreeMode;
        if (degRadBtn) degRadBtn.textContent = isDegreeMode ? 'DEG' : 'RAD';
        playClickSound('action');
        break;
    }
    updateDisplay();
  };

  function applyScientificFunc(func) {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;

    let res = 0;
    let rad = isDegreeMode ? (val * Math.PI) / 180 : val;

    switch (func) {
      case 'sin': res = Math.sin(rad); break;
      case 'cos': res = Math.cos(rad); break;
      case 'tan': res = Math.tan(rad); break;
      case 'log': res = Math.log10(val); break;
      case 'ln': res = Math.log(val); break;
      case 'sqrt': res = Math.sqrt(val); break;
    }

    res = Math.round(res * 1e12) / 1e12;
    expression = `${func}(${currentInput})`;
    currentInput = res.toString();
    isEvaluated = true;
    updateDisplay();
  }

  function calculateFactorial() {
    let num = parseInt(currentInput);
    if (isNaN(num) || num < 0) {
      currentInput = 'Error';
      return;
    }
    if (num > 170) {
      currentInput = 'Infinity';
      return;
    }
    let fact = 1;
    for (let i = 2; i <= num; i++) fact *= i;
    expression = `${num}!`;
    currentInput = fact.toString();
    isEvaluated = true;
    updateDisplay();
  }

  function evaluateExpression() {
    playClickSound('equals');

    let fullExpr = expression + (isEvaluated ? '' : currentInput);
    if (!fullExpr.trim()) return;

    try {
      let sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      const result = new Function(`'use strict'; return (${sanitized})`)();

      if (isNaN(result) || !isFinite(result)) {
        currentInput = 'Error';
      } else {
        const roundedResult = Math.round(result * 1e12) / 1e12;
        addHistoryItem(fullExpr, roundedResult);
        expression = fullExpr + ' =';
        currentInput = roundedResult.toString();
        isEvaluated = true;
      }
    } catch (err) {
      currentInput = 'Error';
    }

    updateDisplay();
  }

  // ==========================================
  // HISTORY LOGIC
  // ==========================================
  function addHistoryItem(expr, res) {
    historyLog.unshift({
      id: Date.now(),
      expression: expr,
      result: res
    });
    if (historyLog.length > 30) historyLog.pop();
    try {
      localStorage.setItem('pink_calc_history', JSON.stringify(historyLog));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;
    if (historyLog.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No hay cálculos aún 🌸</div>';
      return;
    }

    historyList.innerHTML = historyLog.map(item => `
      <div class="history-item" data-res="${item.result}" onclick="window.loadHistoryItem('${item.result}')">
        <div class="hist-expr">${formatExpressionForDisplay(item.expression)}</div>
        <div class="hist-res">= ${formatNumberForDisplay(item.result.toString())}</div>
      </div>
    `).join('');
  }

  window.loadHistoryItem = function (resVal) {
    currentInput = resVal;
    isEvaluated = true;
    updateDisplay();
    window.toggleHistory(false);
    showToast('¡Valor cargado al display! 💖');
  };

  window.toggleHistory = function (open) {
    if (!historyDrawer || !drawerOverlay) cacheDOMElements();
    if (open) {
      historyDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
    } else {
      historyDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
    }
  };

  window.clearHistory = function () {
    historyLog = [];
    try { localStorage.removeItem('pink_calc_history'); } catch {}
    renderHistory();
    showToast('Historial borrado 🌸');
  };

  // ==========================================
  // THEME & SOUND CONTROLS
  // ==========================================
  window.selectTheme = function (themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    try { localStorage.setItem('pink_calc_theme', themeName); } catch {}

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === themeName);
    });
  };

  window.toggleThemeMenu = function (e) {
    if (e) e.stopPropagation();
    if (!themeMenu) cacheDOMElements();
    if (themeMenu) themeMenu.classList.toggle('hidden');
  };

  document.addEventListener('click', () => {
    if (themeMenu) themeMenu.classList.add('hidden');
  });

  window.toggleSound = function () {
    soundEnabled = !soundEnabled;
    if (!soundToggleBtn) cacheDOMElements();
    const iconSpan = soundToggleBtn ? soundToggleBtn.querySelector('.sound-icon') : null;
    if (iconSpan) iconSpan.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? 'Sonido activado 🎶' : 'Sonido en silencio 🤫');
  };

  window.copyResult = function () {
    navigator.clipboard.writeText(currentInput).then(() => {
      showToast('¡Copiado al portapapeles! 💖');
      playClickSound('action');
    }).catch(() => {
      showToast('¡Resultado listo!');
    });
  };

  function showToast(msg) {
    if (!toast || !toastMsg) cacheDOMElements();
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      if (toast) toast.classList.add('hidden');
    }, 2200);
  }

  // ==========================================
  // MODE TABS & CONVERTER
  // ==========================================
  window.switchTab = function (targetTab) {
    if (!keypadSection || !converterSection) cacheDOMElements();

    tabBtns.forEach(b => {
      const isActive = b.dataset.tab === targetTab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    playClickSound('action');

    if (targetTab === 'standard') {
      if (scientificPanel) scientificPanel.classList.add('hidden');
      if (keypadSection) keypadSection.classList.remove('hidden');
      if (converterSection) converterSection.classList.add('hidden');
    } else if (targetTab === 'scientific') {
      if (scientificPanel) scientificPanel.classList.remove('hidden');
      if (keypadSection) keypadSection.classList.remove('hidden');
      if (converterSection) converterSection.classList.add('hidden');
    } else if (targetTab === 'converter') {
      if (keypadSection) keypadSection.classList.add('hidden');
      if (converterSection) converterSection.classList.remove('hidden');
    }
  };

  const unitData = {
    length: {
      units: { m: 'Metros (m)', km: 'Kilómetros (km)', cm: 'Centímetros (cm)', mm: 'Milímetros (mm)', in: 'Pulgadas (in)', ft: 'Pies (ft)', yd: 'Yardas (yd)', mi: 'Millas (mi)' },
      rates: { m: 1, km: 1000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.34 }
    },
    weight: {
      units: { kg: 'Kilogramos (kg)', g: 'Gramos (g)', mg: 'Miligramos (mg)', lb: 'Libras (lb)', oz: 'Onzas (oz)' },
      rates: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 }
    },
    temperature: {
      units: { c: 'Celsius (°C)', f: 'Fahrenheit (°F)', k: 'Kelvin (K)' }
    },
    digital: {
      units: { b: 'Bytes (B)', kb: 'Kilobytes (KB)', mb: 'Megabytes (MB)', gb: 'Gigabytes (GB)', tb: 'Terabytes (TB)' },
      rates: { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }
    }
  };

  function initConverterUI() {
    if (!converterCategory) return;
    populateUnitSelects('length');
    updateConversion();

    converterCategory.addEventListener('change', () => {
      populateUnitSelects(converterCategory.value);
      updateConversion();
    });
    if (converterFromUnit) converterFromUnit.addEventListener('change', updateConversion);
    if (converterToUnit) converterToUnit.addEventListener('change', updateConversion);
    if (converterInputVal) converterInputVal.addEventListener('input', updateConversion);
  }

  function populateUnitSelects(category) {
    const catData = unitData[category];
    if (!catData || !converterFromUnit || !converterToUnit) return;
    const unitKeys = Object.keys(catData.units);

    converterFromUnit.innerHTML = unitKeys.map(k => `<option value="${k}">${catData.units[k]}</option>`).join('');
    converterToUnit.innerHTML = unitKeys.map(k => `<option value="${k}">${catData.units[k]}</option>`).join('');

    if (unitKeys.length > 1) {
      converterToUnit.selectedIndex = 1;
    }
  }

  function updateConversion() {
    if (!converterCategory || !converterFromUnit || !converterToUnit || !converterInputVal || !converterOutputVal) return;
    const category = converterCategory.value;
    const fromUnit = converterFromUnit.value;
    const toUnit = converterToUnit.value;
    const val = parseFloat(converterInputVal.value) || 0;

    let res = 0;
    if (category === 'temperature') {
      res = convertTemperature(val, fromUnit, toUnit);
    } else {
      const rates = unitData[category].rates;
      const baseVal = val * rates[fromUnit];
      res = baseVal / rates[toUnit];
    }

    converterOutputVal.textContent = Math.round(res * 1e6) / 1e6;
  }

  function convertTemperature(val, from, to) {
    if (from === to) return val;
    let celsius = val;
    if (from === 'f') celsius = (val - 32) * (5 / 9);
    if (from === 'k') celsius = val - 273.15;

    if (to === 'c') return celsius;
    if (to === 'f') return (celsius * 9 / 5) + 32;
    if (to === 'k') return celsius + 273.15;
  }

  window.swapUnits = function () {
    if (!converterFromUnit || !converterToUnit) return;
    const temp = converterFromUnit.value;
    converterFromUnit.value = converterToUnit.value;
    converterToUnit.value = temp;
    updateConversion();
    playClickSound('action');
  };

  // ==========================================
  // PHYSICAL KEYBOARD LISTENERS
  // ==========================================
  function attachKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if (['Enter', 'Backspace', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key >= '0' && e.key <= '9') {
        window.pressValue(e.key);
        animateKey(e.key);
      } else if (e.key === '.' || e.key === ',') {
        window.pressValue('.');
        animateKey('.');
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        window.pressOperator(e.key);
        animateKey(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        window.pressAction('calculate');
        animateKey('=');
      } else if (e.key === 'Backspace') {
        window.pressAction('delete');
        animateKey('⌫');
      } else if (e.key === 'Escape') {
        window.pressAction('clear-all');
        animateKey('AC');
      } else if (e.key === '%') {
        window.pressAction('percent');
      }
    });
  }

  function animateKey(valOrAction) {
    document.querySelectorAll('.key').forEach(k => {
      if (k.getAttribute('data-value') === valOrAction || k.textContent.trim() === valOrAction) {
        k.classList.add('pressed');
        setTimeout(() => k.classList.remove('pressed'), 150);
      }
    });
  }

  // ==========================================
  // UNCONDITIONAL IMMEDIATE INIT EXECUTION
  // ==========================================
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
