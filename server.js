const express = require('express');
const got = require('got');

const app = express();

const conf = {
  CPU_LOAD_PORT: 8888,
  CPU_LOAD_DEFAULT_PERCENTAGE: 40,
  CPU_LOAD_DEFAULT_PERCENTAGE_URL: null,
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

app.listen(conf.CPU_LOAD_PORT, async () => {
  console.log('App listening');
  console.log(JSON.stringify(conf, null, 2));
  await setDefaultPercentage();
  blockCpu({ pc: conf.CPU_LOAD_DEFAULT_PERCENTAGE });
  repeat(async () => {
    const change = await setDefaultPercentage();
    if (!change) return;
    blockCpu({ pc: conf.CPU_LOAD_DEFAULT_PERCENTAGE });
  }, 5000);
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

async function setDefaultPercentage() {
  const before = conf.CPU_LOAD_DEFAULT_PERCENTAGE;
  if (!conf.CPU_LOAD_DEFAULT_PERCENTAGE_URL) return false;
  try {
    const response = await got(conf.CPU_LOAD_DEFAULT_PERCENTAGE_URL);
    const pc = +response.body;
    if (Number.isNaN(pc)) throw new Error(`Bad pc from URL: ${response.body}`);
    conf.CPU_LOAD_DEFAULT_PERCENTAGE = pc;
  } catch (e) {
    console.log('Failed to load pc from url', conf.CPU_LOAD_DEFAULT_PERCENTAGE_URL);
    console.error(e);
  }
  if (before !== conf.CPU_LOAD_DEFAULT_PERCENTAGE) return true;
  return false;
}

function repeat(task, gap) {
  task().then(() => {
    setTimeout(() => repeat(task, gap), gap);
  });
}
