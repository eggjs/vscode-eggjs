'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as semver from 'semver';

export async function getFramework(cwd) {
  const pkgInfo = require(path.join(cwd, 'package.json'));
  const framework = pkgInfo.egg && pkgInfo.egg.framework;
  if (framework) return framework;

  const webnames = vscode.workspace.getConfiguration('eggjs').framework.concat([
    '@ali/larva',
    '@ali/nut',
    '@ali/begg',
    'chair',
    '@ali/egg',
    'egg',
  ]);

  for (const name of webnames) {
    const dirpath = path.join(cwd, 'node_modules', name);
    if (await fs.exists(dirpath)) {
      return name;
    }
  }
}

export async function isLegacyNode(cwd) {
  const pkgInfo = require(path.join(cwd, 'package.json'));
  const install = pkgInfo.engines && (pkgInfo.engines['install-alinode'] || pkgInfo.engines['install-node']);
  if (install) {
    return !semver.satisfies('7.6.0', install);
  }
}