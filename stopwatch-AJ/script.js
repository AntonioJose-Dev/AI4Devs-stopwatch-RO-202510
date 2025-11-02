// Estado global de la aplicación
// Contiene modo, si está ejecutando, tiempos y control del intervalo
const state = {
  // 'stopwatch' o 'countdown'
  mode: 'stopwatch',
  running: false,
  // Para cronómetro: milisegundos transcurridos
  // Para cuenta atrás: milisegundos restantes cuando está pausada o el valor actual durante ejecución
  elapsedTime: 0,
  // Para cuenta atrás: timestamp en ms cuando llegará a cero (Date.now() + remaining)
  targetTime: null,
  // id del intervalo (resultado de setInterval)
  intervalId: null,
  // AudioContext para la alarma (si está disponible)
  audioCtx: null
};

/* --------------------------------------------------
   UTILIDADES PURAS (sin efectos secundarios)
   --------------------------------------------------*/

// Convierte milisegundos a cadena HH:MM:SS
// ms - número >= 0
// Devuelve string con ceros a la izquierda, p.ej. "00:02:05"
function msToHHMMSS(ms){
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n) => String(n).padStart(2,'0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Parsea una cadena MM:SS exactamente con dos dígitos en minutos
// input: "05:30" => devuelve milisegundos
// Lanza Error si formato inválido o fuera de rango
function parseMMSS(input){
  // Validación exacta: dos dígitos para minutos, dos para segundos
  const re = /^([0-9]{2}):([0-5][0-9])$/;
  const m = re.exec(input);
  if(!m){
    throw new Error('Formato inválido. Usa MM:SS con ceros a la izquierda (ej. 05:30).');
  }
  const minutes = Number(m[1]);
  const seconds = Number(m[2]);
  if(minutes > 99) throw new Error('El minuto máximo permitido es 99.');
  const totalMs = (minutes * 60 + seconds) * 1000;
  if(totalMs === 0) throw new Error('El tiempo debe ser mayor que 00:00.');
  return totalMs;
}

/* --------------------------------------------------
   ACCESO AL DOM Y ACTUALIZACIÓN DE UI
   --------------------------------------------------*/
const dom = {
  timeDisplay: document.getElementById('timeDisplay'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  tabStopwatch: document.getElementById('tab-stopwatch'),
  tabCountdown: document.getElementById('tab-countdown'),
  inputSection: document.getElementById('inputSection'),
  countdownInput: document.getElementById('countdownInput'),
  inputError: document.getElementById('inputError'),
  inputHelper: document.getElementById('inputHelper'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  audioStatus: document.getElementById('audioStatus')
};

// Agregar referencia al botón mute (puede no existir antes de parche)
dom.muteBtn = document.getElementById('muteBtn');

// Estado adicional para silencio
state.muted = false;

// Actualiza la pantalla del tiempo según el modo
function updateDisplay(){
  if(state.mode === 'stopwatch'){
    dom.timeDisplay.textContent = msToHHMMSS(state.elapsedTime);
  } else {
    dom.timeDisplay.textContent = msToHHMMSS(state.elapsedTime);
  }
}

// Actualiza botones y estado visual (indicador)
function updateControls(){
  dom.tabStopwatch.setAttribute('aria-pressed', state.mode === 'stopwatch');
  dom.tabCountdown.setAttribute('aria-pressed', state.mode === 'countdown');

  // Mostrar u ocultar sección de input según modo
  dom.inputSection.style.display = state.mode === 'countdown' ? 'block' : 'none';

  // Estado de botones
  // Para cuenta atrás queremos habilitar el botón "Iniciar" cuando el input MM:SS sea válido
  if(state.mode === 'countdown'){
    const val = dom.countdownInput.value.trim();
    let valid = false;
    if(val !== ''){
      try{ parseMMSS(val); valid = true; } catch(e){ valid = false; }
    }
    dom.startBtn.disabled = state.running || !valid;
  } else {
    dom.startBtn.disabled = state.running;
  }
  dom.pauseBtn.disabled = !state.running;

  // Indicador visual
  if(state.running){
    dom.statusDot.classList.add('active');
    dom.statusDot.classList.remove('paused');
    dom.statusText.textContent = state.mode === 'stopwatch' ? 'Activo — cronómetro' : 'Activo — cuenta atrás';
  } else if(state.elapsedTime > 0){
    dom.statusDot.classList.remove('active');
    dom.statusDot.classList.add('paused');
    dom.statusText.textContent = 'Pausado';
  } else {
    dom.statusDot.classList.remove('active');
    dom.statusDot.classList.remove('paused');
    dom.statusText.textContent = 'Inactivo';
  }
}

/* --------------------------------------------------
   AUDIO: Alerta con Web Audio API
   Implementación segura con try-catch y degradación
   --------------------------------------------------*/

// Inicializa AudioContext si es posible
function initAudio(){
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) throw new Error('Web Audio API no soportado');
    // Crear AudioContext solo si no está en modo silenciado
    if(!state.muted){
      state.audioCtx = new AudioCtx();
    } else {
      state.audioCtx = null;
    }
    dom.audioStatus.textContent = 'Audio listo';
  } catch(err){
    state.audioCtx = null;
    dom.audioStatus.textContent = 'Alarma de audio no disponible';
    console.warn('No se pudo inicializar AudioContext:', err.message);
  }
}

// Reproduce una breve alerta sonora (tono ascendente) usando OscillatorNode
// catch para evitar excepciones en navegadores que bloquean audio sin interacción
function playAlarm(){
  try{
    if(state.muted) throw new Error('Muting activo');
    if(!state.audioCtx) initAudio();
    if(!state.audioCtx) throw new Error('AudioContext no disponible');
    const ctx = state.audioCtx;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, now);
    o.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.65);
  } catch(err){
    // Si falló reproducir sonido, intentar usar alert visual como degradación
    console.warn('No se pudo reproducir alarma:', err.message);
    // No usamos alert() automáticamente para no molestar, pero actualizamos texto
    dom.audioStatus.textContent = 'Alarma (no sonora) — tiempo cumplido';
  }
}

// Alternar mute y actualizar UI
function toggleMute(){
  state.muted = !state.muted;
  if(state.muted){
    // Cerrar contexto si existe para liberar recursos
    try{ if(state.audioCtx) state.audioCtx.close(); } catch(e){}
    state.audioCtx = null;
    dom.audioStatus.textContent = 'Alarma silenciada';
    if(dom.muteBtn) dom.muteBtn.setAttribute('aria-pressed','true');
  } else {
    dom.audioStatus.textContent = 'Audio listo';
    if(dom.muteBtn) dom.muteBtn.setAttribute('aria-pressed','false');
    try{ initAudio(); } catch(e){}
  }
}

/* --------------------------------------------------
   LÓGICA DE TIEMPO E INTERVALO
   --------------------------------------------------*/

// Función que ejecuta el tick periódico
// Actualiza state.elapsedTime y realiza acciones cuando llega a cero
function tick(){
  if(state.mode === 'stopwatch'){
    // Para cronómetro: elapsed = now - startTimestamp
    // Aquí usamos elapsedTime como tiempo transcurrido ya calculado en start
    const now = Date.now();
    state.elapsedTime = now - state._startTimestamp;
    updateDisplay();
  } else {
    // Para cuenta atrás: remaining = targetTime - now
    const now = Date.now();
    const remaining = state.targetTime - now;
    if(remaining <= 0){
      // Llegó a cero: detener, poner 0, reproducir alarma
      clearIntervalSafe();
      state.running = false;
      state.elapsedTime = 0;
      state.targetTime = null;
      updateDisplay();
      updateControls();
      try{ playAlarm(); } catch(e){}
      return;
    }
    state.elapsedTime = remaining;
    updateDisplay();
  }
}

// Crea intervalo y guarda id
function startInterval(){
  // Evitar crear múltiples intervalos
  if(state.intervalId) return;
  // Frecuencia razonable para buena precisión sin sobrecargar la UI
  state.intervalId = setInterval(tick, 200);
}

// Limpia intervalo si existe
function clearIntervalSafe(){
  if(state.intervalId){
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

/* --------------------------------------------------
   CONTROLADORES DE EVENTOS (nombres descriptivos)
   --------------------------------------------------*/

// Iniciar acción (cronómetro o cuenta atrás)
function handleStart(){
  if(state.running) return;
  if(state.mode === 'countdown'){
    // Si no hay tiempo válido, intentar parsear el input actual
    if(state.elapsedTime <= 0){
      const val = dom.countdownInput.value.trim();
      try{
        const ms = parseMMSS(val);
        state.elapsedTime = ms; // restante
      } catch(err){
        showInputError(err.message);
        return;
      }
    }
    // Calcular targetTime a partir de Date.now() + remaining
    state.targetTime = Date.now() + state.elapsedTime;
    state._startTimestamp = null;
  } else {
    // Cronómetro: establecer startTimestamp = now - elapsed
    state._startTimestamp = Date.now() - state.elapsedTime;
    state.targetTime = null;
  }

  state.running = true;
  hideInputError();
  startInterval();
  updateControls();
  // Ejecutar tick inmediatamente para actualizar visual
  tick();
}

// Pausar acción
function handlePause(){
  if(!state.running) return;
  // Para cronómetro, elapsedTime ya actualizado en tick; para seguridad, hacer un último tick
  tick();
  // Guardar el estado actual y limpiar targetTime
  if(state.mode === 'countdown'){
    // elapsedTime ya contiene el tiempo restante tras tick
    state.targetTime = null;
  } else {
    // cronómetro: elapsedTime guardado
    state._startTimestamp = null;
  }
  state.running = false;
  clearIntervalSafe();
  updateControls();
}

// Reiniciar acción
function handleReset(){
  clearIntervalSafe();
  state.running = false;
  state.elapsedTime = 0;
  state.targetTime = null;
  state._startTimestamp = null;
  // Borrar input solo si está en modo cuenta atrás
  if(state.mode === 'countdown'){
    dom.countdownInput.value = '';
    hideInputError();
  }
  updateDisplay();
  updateControls();
}

// Cambiar modo entre 'stopwatch' y 'countdown'
function handleModeChange(newMode){
  if(state.mode === newMode) return;
  // Antes de cambiar, pausar y reset parcial si es necesario
  handleReset();
  state.mode = newMode;
  // Ajustar visibilidad y controles
  updateDisplay();
  updateControls();
}

/* --------------------------------------------------
   VALIDACIÓN Y MENSAJES DE ERROR
   --------------------------------------------------*/
function showInputError(msg){
  dom.inputError.textContent = msg;
  dom.inputError.style.display = 'block';
}
function hideInputError(){
  dom.inputError.textContent = '';
  dom.inputError.style.display = 'none';
}

/* --------------------------------------------------
   BINDING DE EVENTOS
   --------------------------------------------------*/
dom.startBtn.addEventListener('click', handleStart);
dom.pauseBtn.addEventListener('click', handlePause);
dom.resetBtn.addEventListener('click', handleReset);

dom.tabStopwatch.addEventListener('click', () => handleModeChange('stopwatch'));
dom.tabCountdown.addEventListener('click', () => handleModeChange('countdown'));

// Manejar mute si existe el botón
if(dom.muteBtn){
  dom.muteBtn.addEventListener('click', () => toggleMute());
}

// Validación al perder foco: si el formato es inválido, se muestra error
dom.countdownInput.addEventListener('blur', () => {
  const val = dom.countdownInput.value.trim();
  if(val === ''){ hideInputError(); return; }
  try{ parseMMSS(val); hideInputError(); } catch(err){ showInputError(err.message); }
});

// Aceptar Enter para iniciar cuenta atrás rápidamente
dom.countdownInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){
    // Intentar iniciar
    handleStart();
  }
});

// Validación en tiempo real: no mostrar error inmediatamente, pero habilitar el botón cuando sea válido
dom.countdownInput.addEventListener('input', () => {
  const val = dom.countdownInput.value.trim();
  if(val === ''){ hideInputError(); updateControls(); return; }
  try{
    const ms = parseMMSS(val);
    hideInputError();
    // Actualizar helper con formato legible
    const totalSeconds = Math.floor(ms/1000);
    const minutes = Math.floor(totalSeconds/60);
    const seconds = totalSeconds % 60;
    const minLabel = minutes === 1 ? 'minuto' : 'minutos';
    const secLabel = seconds === 1 ? 'segundo' : 'segundos';
    dom.inputHelper.innerHTML = `Ejemplo: <strong>${val}</strong> — ${minutes} ${minLabel}, ${seconds} ${secLabel}`;
  } catch(err){ /* no mostrar error aún */ }
  updateControls();
});

// Limpiar intervalos al cerrar la página
window.addEventListener('beforeunload', () => {
  clearIntervalSafe();
  try{ if(state.audioCtx) state.audioCtx.close(); } catch(e){}
});

// Atajos de teclado: Espacio = iniciar/pausar, R = reiniciar, M = silenciar
window.addEventListener('keydown', (e) => {
  // Evitar que al escribir en el input se activen los atajos
  const active = document.activeElement;
  if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')){
    // Permitir M en cualquier caso para silenciar
    if(e.key.toLowerCase() === 'm'){
      e.preventDefault(); toggleMute();
    }
    return;
  }
  if(e.code === 'Space' || e.key === ' '){
    e.preventDefault();
    if(state.running) handlePause(); else handleStart();
    return;
  }
  if(e.key.toLowerCase() === 'r'){
    e.preventDefault(); handleReset(); return;
  }
  if(e.key.toLowerCase() === 'm'){
    e.preventDefault(); toggleMute(); return;
  }
});

/* --------------------------------------------------
   INICIALIZACIÓN
   --------------------------------------------------*/

// Inicializar valores y listeners
function init(){
  // Mostrar/ocultar input según modo inicial
  updateDisplay();
  updateControls();
  // Intentar inicializar audio de forma optimista
  try{ initAudio(); } catch(e){}
}

// Ejecutar init al cargar el script
init();

/* --------------------------------------------------
   NOTAS SOBRE RENDIMIENTO Y PRECISIÓN
   - Usamos Date.now() para la base temporal y setInterval de 200ms
   - Guardamos _startTimestamp para cronómetro para evitar deriva por acumulación
   - Limpiamos intervalos correctamente para prevenir fugas de memoria
   --------------------------------------------------*/