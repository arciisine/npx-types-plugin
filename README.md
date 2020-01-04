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
// Installing @npx-types
```

### Step 3, Load Installed Types
**Typings successfully referenced**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/** @typedef {import('/tmp/npx-types-hPdAFW/node_modules/@arcsine/nodesh')} */ /* @npx-types */ // @ts-check
```

### Step 4, Use Typing Information
**Starting to Use new typings**
```javascript
#!/usr/bin/npx @arcsine/nodesh
/** @typedef {import('/tmp/npx-types-hPdAFW/node_modules/@arcsine/nodesh')} */ /* @npx-types */ // @ts-check

[1, 2, 3]
  .$collect(2)
  .$console

```

## Sharing Scripts
Given that the plugin has to reference local scripts, there is some specific work that has to be done to allow for authoring on different machines.  The plugin will check the path reference by the `@typedef`, and if it is not found on the machine it will update it, with a fresh install. 

## Release Notes

### 0.0.3

* Initial Release
