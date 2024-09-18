// scripts/commit-msg-validator.js
const fs = require('fs');
const commitMsg = fs.readFileSync(process.argv[2], 'utf8');

const pattern = /^cds-[0-9]+ (feat|fix|chore|docs|style|refactor|perf|test): .+/;

if (!pattern.test(commitMsg)) {
  console.error('A mensagem de commit deve seguir o padrão: cds-{número da task} {tipo de commit}: {descrição}');
  process.exit(1);
}
