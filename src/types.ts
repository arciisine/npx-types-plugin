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
}

export const ID = '@npx-types';