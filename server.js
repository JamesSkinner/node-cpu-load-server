

const express = require('express');

const app = express();

const conf = {
  CPU_LOAD_PORT: 8888,
  CPU_LOAD_DEFAULT_PERCENTAGE: 40,
  ...filterObj(process.env, (v, k) => k.startsWith('CPU_LOAD_')),
};

app.get('/', (req, res) => res.send('hello\n'));
app.get('/cpu-load', (req, res) => {
  console.log(req.query);
  const secs = +req.query.secs;
  const pc = +req.query.pc;
  if (Number.isNaN(pc)) {
    res.status(400).send('Percentage must be number\n');
    return;
  }
  if (req.params.secs && Number.isNaN(secs)) {
    res.status(400).send('Secs must be number\n');
    return;
  }
  if (pc > 100 || pc < 1) {
    res.status(400).send('Percentage needs to be...a percentage\n');
    return;
  }
  blockCpu({ secs, pc });
  res.send(`Blocking ${pc}% for ${secs} seconds\n`);
});

app.listen(conf.CPU_LOAD_PORT, () => {
  console.log('App listening');
  console.log(JSON.stringify(conf, null, 2));

  blockCpu({ pc: conf.CPU_LOAD_DEFAULT_PERCENTAGE });
});

let activeInteval;

// Set an interval which blocks for given % of a second, then waits for the
// remaining part of the second before doing the same again
function blockCpu({ secs, pc }) {
  console.log(`Blocking CPU ${pc}% for ${secs || '∞'}s`);
  clearSingleInterval();

  const blockFor = (1000 / 100) * pc;
  const waitFor = 1000 - blockFor;

  const handler = singleInterval(() => block(blockFor), waitFor);
  activeInteval = handler;
  if (secs) {
    setTimeout(() => {
      if (activeInteval === handler) {
        blockCpu({ pc: conf.CPU_LOAD_DEFAULT_PERCENTAGE });
      }
    }, secs * 1000);
  }
}

function block(blockFor) {
  const blockEnd = Date.now() + blockFor;
  while (Date.now() < blockEnd) {
    Math.random(); // eslint-disable-line
  }
}

let intervalId;
function singleInterval(f, timeout, id) {
  if (!id) {
    id = Date.now();
    intervalId = id;
  }
  setTimeout(() => {
    if (id !== intervalId) return;
    f();
    singleInterval(f, timeout, id);
  }, timeout);
  return id;
}
function clearSingleInterval() {
  intervalId = null;
}

function filterObj(obj, filter) {
  return Object.entries(obj)
    .filter(([k, v]) => filter(v, k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}
