<h1>
  <sub><img src="https://github.com/arciisine/vscode-npx-scripts/raw/master/images/logo.png" height="40"></sub>
  npx-scripts VSCode Plugin
</h1>

The [`plugin`](https://marketplace.visualstudio.com/items?itemName=arcsine.npx-scripts) provides general support for authoring `npx` scripts (`javascript` files that include `npx` in the `shebang` (e.g. `#!/usr/bin/env -S npx {module}`). The support includes:
* Snippet for authoring `npx` shebangs
* Type acquisition for easier authoring
* Support for launching scripts (with performance enhancement)

This is a sister project of [`@arcsine/nodesh`](https://github.com/arciisine/nodesh), but is intended to be generic enough to support any other libraries that that work as an `npx` script.

## Example

![Usage](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/usage.gif)

```javascript
#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" lib="npx-scripts" />

'https://en.wikipedia.org/wiki/Special:Random'
  .$http()
  .$match(/\b[A-Z][a-z]+/, 'extract') // Read proper names
  .$console;
```

## Shebang Snippet

When authoring a new script, the `shebang` snippet will help to provide a shebang.  The shebang has everything necessary except for the `npm` module that the script will run with.  

![Shebang](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/shebang.gif)

The `nodesh-shebang` will provide support for a `nodesh` declaration.

## Type Acquisition

During the editing process, the plugin will attempt to assist with acquiring types.  If a file with an `npx` shebang is opened, or an `npx` shebang is added to a file, the plugin will check the referenced `npm` module.  If the module contains types, the user will be prompted to add a type reference to the script.

![Acquisition](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/acquisition.gif)

If a script is opened that already has the typing information in it, the plugin will alert the user to the invalid typings, and offer to fix them.

![Invalid Typings](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/invalid-typings.gif)

### Version Support
The extension will honor any module with a version specified `#!/usr/bin/env -S npx @arcsine/nodesh@1.1.5`.  Multiple versions can be installed side-by-side without issue and the extension will manage them appropriately.

### Portability
If a file is loaded that happens to have an existing reference (`/// <reference />`), the plugin will check the path, and if it is not found it will be updated with a fresh install. When closing a document within vscode, the all inserted text will be stripped out.

## Running Scripts
Given the context of executable scripts, you can run the script manually without problem. Additionally, the plugin provides the ability to execute the script with the loaded module, which will stream the output to an output channel.  One of the primary benefits here, is that npx will not be invoked, and so installation will be skipped.  This provides a speed boost across multiple executions. 

Additionally, there is a command to `Run Script With Input`, which will prompt for a file to use as stdin for the script execution.

![Running](https://github.com/arciisine/vscode-npx-scripts/raw/master/images/run.gif)

**NOTE**: To get colorized output from the script runner, consider installing the [Output Colorizer](https://marketplace.visualstudio.com/items?itemName=IBM.output-colorizer) extension.

## Release Notes

### 1.0.5
* Updating logo

### 1.0.4
* Standardized naming on `npx-scripts`

### 1.0.3
* Resolved issue with `require` caching modules

### 1.0.1
* Documentation update
* Resolved issues with reinstallation

### 1.0.0
* Change general flow of plugin, no long attempts to auto add typings
* Allow for manual adding/removal/verifying of typings
* Utilizes code lens for a less obtrusive interface
* Provides editor title bar quick actions for running scripts
* Supports running scripts with a file as stdin

### 0.1.9
* Resolved formatting issues when cleaning file on close
* Changed preamble use triple slash, and work with formatters better

### 0.1.8
* Fixed bugs with previous process writing to new output
* Allow for more flexible detection of line equality, should work better with formatters
* Separated out tag line from typedef for better support with formatters

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
