<h1>
  <sub><img src="https://github.com/arciisine/vscode-npx-scripts/raw/master/images/logo.png" height="40"></sub>
  npx scripts VSCode Plugin
</h1>

The [`plugin`](https://marketplace.visualstudio.com/items?itemName=arcsine.npx-scripts) provides general support for authoring npx scripts (Javascript files that include an `npx` in the `shebang` (e.g. `#!/usr/bin/env -S npx {module}`). The support includes:
* Automatic type acquisition for easier authoring
* Support for launching scripts within vscode (with performance enhancement)

This is a sister project of [`@arcsine/nodesh`](https://github.com/arciisine/nodesh), but is intended to be generic enough to support any other libraries that that work as an `npx` script.

## Type Acquisition

During editing, the plugin will download the library referenced in the shebang and add a line to the script to point to load the types. 

![Usage](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/usage.gif)

### How It Works

**Authoring a new npx-shebang script**
```javascript
#!/usr/bin/env -S npx @arcsine/nodesh
```

**Begin Installation of Types**
```javascript
#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts - installing ... */
```

**Typings successfully referenced**
```javascript
#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts - found */ // @ts-check
/** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} npxscripts__simple_ */ 
```

**Starting to Use new typings**
```javascript
#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts - found*/ // @ts-check 
/** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} npxscripts__simple_ */

[1, 2, 3]
  .$collect(2)
  .$console

```

### Version Support
The extension will honor any module with a version specified `#!/usr/bin/env -S npx @arcsine/nodesh@1.1.5`.  Multiple versions can be installed side-by-side without issue and the extension will manage them appropriately.

### Portability
If a file is loaded that happens to have a typedef, the plugin will check the path reference by the `@typedef`, and if it is not found on the machine it will update it, with a fresh install. When closing a document within vscode, the `@typedef` will be stripped out.

## Running Scripts
Given the context of executable scripts, you can run the script manually without problem. Additionally, the plugin provides the ability to execute the script with the loaded module, which will display in a vscode terminal.  One of the primary benefits here, is that npx will not be invoked, and so installation will be skipped.  This provides a speed boost across multiple executions.

![Running](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/run.gif)

## Release Notes

### 0.1.7
* Moved output from terminal to OutputChannel
* Allow for full reinstall of managed modules
* General refactor

### 0.1.6
* General refactor

### 0.1.5
* Support cleaning up files on close, leaving files as found

### 0.1.3
* Updated general documentation
* Migrated naming from `npx-types` to `npx-scripts` to better reflect the scope of the plugin.

### 0.0.5
* Support for library versions as specified in npx command
* Allow for running scripts via command `npx: Run npx script`

### 0.0.3

* Initial Release
