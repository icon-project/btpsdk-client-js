import path from "path";
import fs from "fs";
import { Buffer } from "node:buffer";

function root(): string {
  let root = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(root, "package.json"))) {
      return root;
    }
    root = path.join(root, '..');
  }
}

export function read(name: string): Buffer {
  return fs.readFileSync(path.resolve(root(), 'src/test/fixtures', name));
}
