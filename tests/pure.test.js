// Tests sencillos para las funciones puras msToHHMMSS y parseMMSS
// Este archivo se ejecuta con node y no depende del DOM.

// Copiamos las funciones tal como están en script.js para testarlas en aislamiento
function msToHHMMSS(ms){
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n) => String(n).padStart(2,'0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function parseMMSS(input){
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

let passes = 0; let fails = 0;
function assertEquals(actual, expected, msg){
  if(actual === expected){
    console.log(`PASS: ${msg}`);
    passes++;
  } else {
    console.error(`FAIL: ${msg} — esperado: ${expected}, obtenido: ${actual}`);
    fails++;
  }
}

function assertThrows(fn, expectedMsgPart, msg){
  try{
    fn();
    console.error(`FAIL: ${msg} — se esperaba excepción`);
    fails++;
  } catch(err){
    if(expectedMsgPart && err.message.indexOf(expectedMsgPart) === -1){
      console.error(`FAIL: ${msg} — excepción con mensaje inesperado: ${err.message}`);
      fails++;
    } else {
      console.log(`PASS: ${msg}`);
      passes++;
    }
  }
}

console.log('Ejecutando tests de funciones puras...');

// msToHHMMSS tests
assertEquals(msToHHMMSS(125000), '00:02:05', 'msToHHMMSS(125000) => 00:02:05');
assertEquals(msToHHMMSS(0), '00:00:00', 'msToHHMMSS(0) => 00:00:00');
assertEquals(msToHHMMSS(3661000), '01:01:01', 'msToHHMMSS(3661000) => 01:01:01');

// parseMMSS valid cases
try{
  let v1 = parseMMSS('05:30');
  assertEquals(v1, 5*60*1000 + 30*1000, "parseMMSS('05:30') => 330000");
  let v2 = parseMMSS('00:45');
  assertEquals(v2, 45*1000, "parseMMSS('00:45') => 45000");
  let v3 = parseMMSS('12:00');
  assertEquals(v3, 12*60*1000, "parseMMSS('12:00') => 720000");
} catch(e){ console.error('Error en casos válidos parseMMSS:', e.message); fails++; }

// parseMMSS invalid cases
assertThrows(() => parseMMSS('5:30'), 'Formato inválido', "parseMMSS('5:30') lanza formato inválido (sin ceros)");
assertThrows(() => parseMMSS('abc'), 'Formato inválido', "parseMMSS('abc') lanza formato inválido");
assertThrows(() => parseMMSS('100:00'), null, "parseMMSS('100:00') lanza (formato inválido o fuera de rango)");
assertThrows(() => parseMMSS('00:00'), 'El tiempo debe ser mayor', "parseMMSS('00:00') lanza por tiempo 0");

console.log('---');
console.log(`Resultados: ${passes} passed, ${fails} failed`);
process.exit(fails === 0 ? 0 : 1);
