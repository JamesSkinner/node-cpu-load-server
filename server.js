'use strict'

const express = require('express');
const app = express();
const PORT = 8888;

app.get('/', (req, res) => res.send('hello\n'))
app.get('/cpu-load/percentage/:pc/seconds/:secs', (req, res) => {
  const secs = +req.params.secs;
  const pc = +req.params.pc;
  if(Number.isNaN(secs * pc)){
    res.status(400).send('Need to pass in number of secs and pecentage\n')
    return
  }
  if(pc > 100 || pc < 1){
    res.status(400).send('Percentage needs to be...a percentage\n')
    return
  }
  blockCpuFor(secs, pc)
  res.send(`Blocking for ${secs} seconds\n`)
})

app.listen(PORT, () => console.log(`App listening on port ${PORT}`))

function blockCpuFor(secs, pc) {
	const end = Date.now() + (secs * 1000);

  blockUntil(end, pc);
}

// For every second-long chunk, wait for a bit then block for a bit then
// schedule the next chunk
function blockUntil(end, pc = 100){
  if(end < Date.now()) return
  const blockFor = (1000 / 100) * pc
  const waitFor = 1000 - blockFor
  setTimeout(() => {
    // block for a certain amount of time them schedule the next chunk
    const blockEnd = Date.now() + blockFor
    while(Date.now() < blockEnd) {
      Math.random() * Math.random();
    }
    blockUntil(end, pc)
  }, waitFor)
}
