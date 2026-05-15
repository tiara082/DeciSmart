require('dotenv').config();
const { suggestScores } = require('./services/groq');

async function test() {
  const criteria = [{ name: 'Harga' }, { name: 'Kualitas' }, { name: 'Fitur' }];
  const alts = ['Laptop A', 'Laptop B'];
  const res = await suggestScores('Pilih Laptop', 'Untuk pelajar', criteria, alts);
  console.log(res);
}

test();
