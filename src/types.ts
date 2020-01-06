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
export const ID_SAFE = ID.substring(1);
export const ID_TAG = `/* ${ID} */`;
export const ID_TAG_MATCH = new RegExp(`/[*] ${ID} [*]/`);
export const ID_LINE_MATCH = new RegExp(`^${ID_TAG_MATCH.source} /.*?\n`, 'smg');