<h1>
  <sub><img src="https://github.com/arciisine/vscode-npx-scripts/raw/master/images/logo.png" height="40"></sub>
  npx scripts VSCode Plugin
</h1>

The [`plugin`](https://marketplace.visualstudio.com/items?itemName=arcsine.npx-scripts) provides general support for authoring npx scripts (Javascript files that include an `npx` `shebang` (`#!/usr/bin/npx module`).  The support includes:
* Automatic type acquisition for easier authoring
* Support for launching scripts within vscode (with performance enhancement)

This is a sister project of [`@arcsine/nodesh`](https://github.com/arciisine/nodesh), but is intended to be generic enough to support any other libraries that that work as an `npx` script.

## Type Acquisition

During editing, the plugin will download the library referenced in the shebang and add a line to the script to point to load the types. 

![Usage](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/usage.gif)

### How It Works

**Authoring a new npx-shebang script**
```javascript
#!/usr/bin/npx @arcsine/nodesh
```

**Begin Installation of Types**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-scripts */ // Installing
```

**Typings successfully referenced**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts-hPdAFW/node_modules/@arcsine/nodesh')} */ // @ts-check
```

**Starting to Use new typings**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts-hPdAFW/node_modules/@arcsine/nodesh')} */ // @ts-check

[1, 2, 3]
  .$collect(2)
  .$console

```

### Version Support
The extension will honor any module with a version specified `#!/usr/bin/npx @arcsine/nodesh@1.1.5`.  Multiple versions can be installed side-by-side without issue and the extension will manage them appropriately.

### Portability
Given that the plugin has to reference local scripts, there is some specific work that has to be done to allow for authoring on different machines.  The plugin will check the path reference by the `@typedef`, and if it is not found on the machine it will update it, with a fresh install. 

## Running Scripts
Given the context of executable scripts, you can run the script manually without problem. Additionally, the plugin provides the ability to execute the script with the loaded module, which will display in a vscode terminal.  One of the primary benefits here, is that npx will not be invoked, and so installation will be skipped.  This provides a speed boost across multiple executions.

![Running](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/run.gif)

## Release Notes

### 0.1.3
* Updated general documentation
* Migrated naming from `npx-types` to `npx-scripts` to better reflect the scope of the plugin.

### 0.0.5
* Support for library versions as specified in npx command
* Allow for running scripts via command `npx: Run npx script`

### 0.0.3

* Initial Release
