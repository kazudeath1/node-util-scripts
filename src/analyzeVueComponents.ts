import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// 第一引数をディレクトリパスとして受け取る
if (process.argv.length !== 3) {
  console.error('Invalid arguments');
  process.exit(1);
}

const dirPath = process.argv[2];

const outputDir = path.join('output', path.basename(dirPath));
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// コンポーネント名とファイルパスを保存するSet
const componentNames = new Set<string>();
const componentPaths = new Set<string>();

// Vueファイルのパスを取得する関数
const getSearchTargetVueFilePaths = (dirPath: string): Promise<string[]> => {
  return glob(`${dirPath}/**/*.vue`, { ignore: [`${dirPath}/node_modules/**`] });
};

const getOutputTargetVueFilePaths = (dirPath: string): Promise<string[]> => {
  return glob(`${dirPath}/**/*.vue`, { ignore: [`${dirPath}/node_modules/**`, `${dirPath}/pages/**`, `${dirPath}/layouts/**`, `${dirPath}/*.vue`] });
};

// ファイルからコンポーネント名とパスを抽出する関数
const extractComponents = async (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const templateMatch = content.match(/^<template[\s\S\n]+<\/template>/gm);
  const scriptMatch = content.match(/^<script[\s\S]+<\/script>/gm);

  // キャメルケースのコンポーネント名を抽出
  if (templateMatch) {
    templateMatch.forEach((template) => {
      const names = template.match(/<([A-Z][a-zA-Z0-9]*)\b/g);
      names?.forEach((name) => componentNames.add(name.replace('<', '')));
    });
  }

  // import文からパスを抽出
  if (scriptMatch) {
    scriptMatch.forEach((script) => {
      const paths = script.match(/import .* from '.*\.vue'/g);
      paths?.forEach((p) => {
        const match = p.match(/'(.*)'/);
        if (match) componentPaths.add(match[1].replace(/^~/, dirPath));
      });
    });
  }
};

// パスが異なるがファイル名が同じ.vueファイルを検索し、出力する関数
const findAndLogSameNameFiles = async (vueFilePaths: string[]) => {
  const sameNameFiles: string[] = [];

  const fileNames = vueFilePaths.map((filePath) => path.basename(filePath, '.vue'));
  const uniqueFileNames = Array.from(new Set(fileNames));

  uniqueFileNames.forEach((fileName) => {
    const sameName = vueFilePaths.filter((filePath) => path.basename(filePath, '.vue') === fileName);
    if (sameName.length > 1) {
      sameNameFiles.push(...sameName);
    }
  });

  return sameNameFiles;
};

// 使用されていない.vueファイルを検索し、出力する関数
const findAndLogUnusedComponents = async (vueFilePaths: string[]) => {
  const unusedFiles: string[] = [];

  vueFilePaths.forEach((filePath) => {
    const fileName = path.basename(filePath, '.vue');
    if (!componentNames.has(fileName) && !componentNames.has('Lazy' + fileName) && !componentPaths.has(filePath)) {
      unusedFiles.push(filePath);
    }
  });

  return unusedFiles;
};

// メイン関数
const main = async () => {
  const vueFilePaths = await getSearchTargetVueFilePaths(dirPath);
  const outputVueFilePaths = await getOutputTargetVueFilePaths(dirPath);
  fs.writeFileSync(path.join(outputDir, 'vueFiles.txt'), vueFilePaths.sort().join('\n'));

  for (const filePath of vueFilePaths) {
    await extractComponents(filePath);
  }

  fs.writeFileSync(path.join(outputDir, 'usedComponentNames.txt'), Array.from(componentNames).sort().join('\n'));
  fs.writeFileSync(path.join(outputDir, 'usedComponentPaths.txt'), Array.from(componentPaths).sort().join('\n'));

  const unusedFiles = await findAndLogUnusedComponents(outputVueFilePaths);
  const outputFilePath = path.join(outputDir, 'unusedComponentPaths.txt');
  fs.writeFileSync(
    outputFilePath,
    unusedFiles
      .filter((f) => !f.includes(`${dirPath}/pages/`))
      .sort()
      .join('\n')
  );

  const sameNameFiles = await findAndLogSameNameFiles(vueFilePaths);
  const outputSameNameFilePath = path.join(outputDir, 'sameNameFiles.txt');
  fs.writeFileSync(outputSameNameFilePath, sameNameFiles.filter((f) => !f.includes(`${dirPath}/pages/`)).join('\n'));
};

main().catch(console.error);
