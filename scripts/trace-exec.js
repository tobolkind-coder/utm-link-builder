const cp = require('child_process');
const originalExec = cp.exec;
const originalExecSync = cp.execSync;
const originalSpawn = cp.spawn;

function logCaller(name, args) {
  const stack = new Error().stack;
  console.log(`\n=== ПЕРЕХВАЧЕН ВЫЗОВ ${name} ===`);
  console.log('Команда:', args[0]);
  console.log('Откуда вызвано:\n', stack);
  console.log('=== КОНЕЦ ===\n');
}

cp.exec = function(...args) {
  logCaller('exec', args);
  return originalExec.apply(this, args);
};
cp.execSync = function(...args) {
  logCaller('execSync', args);
  return originalExecSync.apply(this, args);
};
cp.spawn = function(...args) {
  logCaller('spawn', args);
  return originalSpawn.apply(this, args);
};

require('/app/server.js');
