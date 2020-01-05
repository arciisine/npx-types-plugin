export class Mod {
  name: string;
  version?: string;

  constructor(public full: string = '') {
    let splitAt = full.indexOf('@', 1); // Find interior @
    if (splitAt >= 0) {
      this.name = full.substring(0, splitAt);
      this.version = full.substring(splitAt + 1);
    } else {
      this.name = full;
    }
  }

  get safe() {
    return this.full.replace(/[@/]/g, '.').replace(/(^[.]+)|([.]+$)/, '').replace(/[.][.]+/, '.');
  }
}

export const ID = '@npx-scripts';