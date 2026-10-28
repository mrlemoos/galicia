import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';

const colour = Boolean(process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb');
export const ink = {
  blue: (value: string) => colour ? `\x1b[38;5;75m${value}\x1b[0m` : value,
  green: (value: string) => colour ? `\x1b[38;5;79m${value}\x1b[0m` : value,
  muted: (value: string) => colour ? `\x1b[38;5;245m${value}\x1b[0m` : value,
};

export function banner(): void {
  console.log(`\n${ink.blue('       +       ')}   ${ink.blue('galicia')}\n${ink.blue('    +  o  +    ')}   ${ink.muted('Spend less. Keep meaning.')}\n${ink.blue('    + \\_/ +    ')}\n${ink.blue('    +  |  +    ')}   ${ink.muted('Project-local. Evidence first.')}\n${ink.blue('      _|_      ')}\n`);
}

export async function ask(question: string, fallback = ''): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Non-interactive input: provide explicit flags. See --help.');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''} `)).trim() || fallback; }
  finally { rl.close(); }
}

export async function choose(title: string, choices: readonly string[], defaults: string[], multiple = true): Promise<string[]> {
  if (!process.stdin.isTTY) throw new Error('Selection needs terminal or explicit flags.');
  if (!colour) {
    console.log(`\n${title}\n${choices.map((item, index) => `  ${index + 1}. ${item}`).join('\n')}`);
    const raw = await ask(multiple ? 'Comma-separated names' : 'Name', defaults.join(','));
    const values = raw.split(',').map(v => v.trim());
    if (!values.length || values.some(v => !choices.includes(v)) || (!multiple && values.length !== 1)) throw new Error('Invalid selection. Use displayed names.');
    return [...new Set(values)];
  }
  return new Promise((accept, reject) => {
    let index = Math.max(0, choices.indexOf(defaults[0] ?? ''));
    const selected = new Set(defaults);
    let rendered = false;
    function draw() {
      if (rendered) process.stdout.write(`\x1b[${choices.length + 2}A`);
      console.log(`\x1b[2K${title}`);
      choices.forEach((choice, row) => console.log(`\x1b[2K  ${row === index ? ink.green('>') : ' '} ${multiple ? `[${selected.has(choice) ? 'x' : ' '}] ` : ''}${row === index ? ink.blue(choice) : choice}`));
      console.log(`\x1b[2K${ink.muted(multiple ? '  arrows move / space select / enter continue' : '  arrows move / enter select')}`);
      rendered = true;
    }
    function finish(error?: Error) {
      process.stdin.off('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\x1b[?25h');
      if (error) reject(error);
      else accept(multiple ? choices.filter(v => selected.has(v)) : [choices[index]!]);
    }
    function onKey(_text: string, key: { name?: string; ctrl?: boolean }) {
      if (key.ctrl && key.name === 'c' || key.name === 'escape') return finish(new Error('Cancelled. No installation started.'));
      if (key.name === 'up') index = (index + choices.length - 1) % choices.length;
      if (key.name === 'down') index = (index + 1) % choices.length;
      if (key.name === 'space' && multiple) {
        const choice = choices[index]!;
        if (selected.has(choice)) selected.delete(choice); else selected.add(choice);
      }
      if (key.name === 'return') {
        if (multiple && !selected.size) { process.stdout.write('\x07'); return; }
        return finish();
      }
      draw();
    }
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKey);
    process.stdout.write('\x1b[?25l');
    draw();
  });
}
