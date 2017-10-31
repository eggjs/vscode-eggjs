# vscode-eggjs README

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/atian25.eggjs.svg)](https://marketplace.visualstudio.com/items?itemName=atian25.eggjs)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/atian25.eggjs.svg)](https://marketplace.visualstudio.com/items?itemName=atian25.eggjs)
[![Rating](https://vsmarketplacebadge.apphb.com/rating/atian25.eggjs.svg)](https://marketplace.visualstudio.com/items?itemName=atian25.eggjs)

vscode extension for [eggjs]

https://github.com/eggjs/vscode-eggjs

## Features

### Snippet

- config `eggjs.snippet.fnStyle` to your prefer function style such as `async`, keep `null` to show prompt.

![](https://github.com/eggjs/vscode-eggjs/raw/master/snapshot/snippet.gif)

### Debugger

![](https://github.com/eggjs/vscode-eggjs/raw/master/snapshot/debugger.gif)

### Config Inspect

![](https://github.com/eggjs/vscode-eggjs/raw/master/snapshot/config.gif)

## TODO

- snippets
  - [x] service
  - [x] controller
  - [x] plugin
  - [x] config
  - [ ] auto detect async / generator style
  - [ ] support create command
- debugger
  - [x] init debug configuration
  - [ ] debug configuration snippets
  - [ ] support `inspect-brk`
  - [ ] auto attach
- smart intellisense
  - [ ] complete items
  - [ ] language server
  - [ ] ts
- config inspector
  - [x] tree panel
  - [ ] refactor to `Find All References`, no panel.
- test support
  - [ ] test tree panel
  - [ ] run only
  - [ ] toggle skip / only


## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

<!--
Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something
-->

## Known Issues

## Release Notes

<!-- https://atian25.visualstudio.com/_details/security/tokens -->

-----------------------------------------------------------------------------------------------------------

[eggjs]: https://eggjs.org/