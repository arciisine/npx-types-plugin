<h1>
  <sub><img src="https://github.com/arciisine/vscode-npx-types/raw/master/images/logo.png" height="40"></sub>
  Npx-Types VSCode Plugin
</h1>

The [`plugin`](https://marketplace.visualstudio.com/items?itemName=arcsine.npx-types) provides automatic type support for javascript files that have an `npx` `shebang`. This is a sister project of [`@arcsine/nodesh`](https://github.com/arciisine/nodesh), but is intended to be generic enough to support any other libraries that that work as an `npx` shebang script.

## How it Works

During editing, the plugin will download the library referenced in the shebang and add a line to the script to point to load the types. 

![Usage](https://github.com/arciisine/vscode-npx-types/raw/master/images/usage.gif)

## Detailed View

### Step 1, Create a New Script

**Authoring a new npx-shebang script**
```javascript
#!/usr/bin/npx @arcsine/nodesh
```

### Step 2, Start Auto-Install Types
**Begin Installation of Types**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-types */ // Installing
```

### Step 3, Load Installed Types
**Typings successfully referenced**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-types */ /** @typedef {import('/tmp/npx-types-hPdAFW/node_modules/@arcsine/nodesh')} */ // @ts-check
```

### Step 4, Use Typing Information
**Starting to Use new typings**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/* @npx-types */ /** @typedef {import('/tmp/npx-types-hPdAFW/node_modules/@arcsine/nodesh')} */ // @ts-check

[1, 2, 3]
  .$collect(2)
  .$console

```

## Multiple Versions
The extension will honor any module with a version specified `#!/usr/bin/npx @arcsine/nodesh@1.1.5`.  Multiple versions can be installed side-by-side without issue and the extension will manage them appropriately.

## Running Scripts
Given the context of executable scripts, you can run the script manually without problem. Additionally, the plugin provides the ability to execute the script with the loaded module, which will display in a vscode terminal.  One of the primary benefits here, is that npx will not be invoked, and so installation will be skipped.  This provides a speed boost across multiple executions.

![Running](https://github.com/arciisine/vscode-npx-types/raw/master/images/run.gif)

## Sharing Scripts
Given that the plugin has to reference local scripts, there is some specific work that has to be done to allow for authoring on different machines.  The plugin will check the path reference by the `@typedef`, and if it is not found on the machine it will update it, with a fresh install. 

## Release Notes

### 0.0.5
* Support for library versions as specified in npx command
* Allow for running scripts via command `Npx-Types: Run script`

### 0.0.3

* Initial Release
