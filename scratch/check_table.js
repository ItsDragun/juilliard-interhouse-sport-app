const { exec } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const cmd = `"${chrome}" --headless=new --enable-logging=stderr --v=1 --virtual-time-budget=3000 --dump-dom "http://127.0.0.1:8080/index.html#/table"`;
exec(cmd, (err, stdout, stderr) => {
  console.log("STDOUT length:", stdout ? stdout.length : 0);
  console.log("STDERR:\n", stderr ? stderr.slice(-2000) : "no stderr");
});
