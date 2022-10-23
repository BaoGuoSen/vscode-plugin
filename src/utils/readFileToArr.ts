const fs = require('fs');
const readline = require('readline');

export default function readFileToArr (fReadName: string): Promise<string[]> {
  return new Promise(resolve => {
    const arr: string[] = [];
    const fRead = fs.createReadStream(fReadName);
    const objReadLine = readline.createInterface({ input: fRead });

    objReadLine.on('line', (line: string) => { arr.push(line); });
    objReadLine.on('close', () => { resolve(arr); });
  });
}
