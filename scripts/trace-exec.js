const cp = require('child_process');
const http = require('http');
const https = require('https');

function logIt(label, detail) {
  const stack = new Error().stack;
  // Убираем первые 2 строки стека (сама logIt и вызвавший её перехватчик)
  const lines = stack.split('\n');
  const callerStack = lines.slice(2).join('\n');
  console.log(`\n=== ПЕРЕХВАЧЕНО: ${label} ===`);
  console.log(detail);
  console.log('Стек вызова:\n', callerStack);
  console.log('=== КОНЕЦ ===\n');
}

// --- Перехват child_process (exec/spawn) ---
const origExec = cp.exec;
const origExecSync = cp.execSync;
const origSpawn = cp.spawn;

cp.exec = function(...args) {
  logIt('exec', 'Команда: ' + args[0]);
  return origExec.apply(this, args);
};
cp.execSync = function(...args) {
  logIt('execSync', 'Команда: ' + args[0]);
  return origExecSync.apply(this, args);
};
cp.spawn = function(...args) {
  logIt('spawn', 'Команда: ' + args[0]);
  return origSpawn.apply(this, args);
};

// --- Перехват eval ---
const origEval = global.eval;
global.eval = function(code) {
  logIt('eval', 'Код (первые 2000 символов):\n' + String(code).slice(0, 2000));
  return origEval(code);
};

// --- Перехват Function() ---
const OrigFunction = global.Function;
global.Function = new Proxy(OrigFunction, {
  construct(target, args) {
    logIt('new Function()', 'Аргументы (первые 2000 символов):\n' + args.join('\n---\n').slice(0, 2000));
    return Reflect.construct(target, args);
  },
  apply(target, thisArg, args) {
    // Function может вызываться и без new: Function('return 1')()
    logIt('Function()', 'Аргументы (первые 2000 символов):\n' + args.join('\n---\n').slice(0, 2000));
    return Reflect.apply(target, thisArg, args);
  }
});

// --- Перехват http.request ---
const origHttpRequest = http.request;
http.request = function(...args) {
  let url = '';
  if (typeof args[0] === 'string') {
    url = args[0];
  } else if (args[0] && typeof args[0] === 'object') {
    url = args[0].hostname || args[0].host || '';
    if (args[0].path) url += args[0].path;
    if (args[0].port) url = args[0].hostname + ':' + args[0].port + (args[0].path || '');
  }
  logIt('http.request', 'Куда: ' + url);
  return origHttpRequest.apply(this, args);
};

// --- Перехват https.request ---
const origHttpsRequest = https.request;
https.request = function(...args) {
  let url = '';
  if (typeof args[0] === 'string') {
    url = args[0];
  } else if (args[0] && typeof args[0] === 'object') {
    url = args[0].hostname || args[0].host || '';
    if (args[0].path) url += args[0].path;
    if (args[0].port) url = args[0].hostname + ':' + args[0].port + (args[0].path || '');
  }
  logIt('https.request', 'Куда: ' + url);
  return origHttpsRequest.apply(this, args);
};

// Запуск приложения
require('/app/server.js');