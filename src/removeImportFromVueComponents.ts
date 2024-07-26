import { readFileSync, writeFileSync } from 'fs';
import { parse, compileTemplate, compileScript, compileStyle } from '@vue/compiler-sfc';
import { glob } from 'glob';
import path from 'path';

const processVueFile = (filePath: string) => {
  const fileContent = readFileSync(filePath, 'utf8');
  const { descriptor } = parse(fileContent);

  if (descriptor.script) {
    let scriptContent = descriptor.script.content;
    const importRegex = /import ([\S]+?) from '[\S]+?.vue'\n/g;

    const importStatements = scriptContent.matchAll(importRegex);
    const componentNames = Array.from(importStatements).map((statement) => {
      return statement[1];
    });
    console.log(componentNames.join(', '));

    scriptContent = scriptContent.replaceAll(importRegex, '');

    componentNames.forEach((name) => {
      const regExp = new RegExp(`\\b${name}\\b,?`, 'g');
      scriptContent = scriptContent.replace(regExp, '');
    });

    descriptor.script.content = scriptContent;

    // SFCファイルを再構築
    let content = '';

    if (descriptor.template) {
      content += `<template>${descriptor.template.content}</template>\n\n`;
    }

    if (descriptor.script) {
      content += `<script>${descriptor.script.content}</script>\n\n`;
    }

    descriptor.styles.forEach((style) => {
      content += `<style${style.lang ? ` lang="${style.lang}"` : ''}${style.scoped ? ' scoped' : ''}>${style.content}</style>\n`;
    });

    writeFileSync(filePath, content, 'utf8');
    console.log(`${filePath} has been updated.`);
  }
};

const processDirectory = async (dirPath: string) => {
  const files = await glob(`${dirPath}/**/*.vue`, { ignore: ['**/node_modules/**'] });
  files.forEach(processVueFile);
};

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: npx ts-node remove-imports.ts <directory-path>');
  process.exit(1);
}

const directoryPath = path.resolve(args[0]);
processDirectory(directoryPath);
