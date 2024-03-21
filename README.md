# node-util-scripts

このリポジトリは、様々なユーティリティスクリプトを集めたものです。主にNode.jsで動作するスクリプトを取り扱っています。

## 環境設定

### インストール

リポジトリをクローンした後、以下のコマンドを実行して必要な依存関係をインストールしてください。

```bash
npm i
```

## スクリプトの実行

スクリプトは`npx ts-node`を使用して実行します。例えば、特定のスクリプトを実行するには、以下のようにコマンドを実行します。

```bash
npx ts-node <スクリプトのパス> <引数>
```


### analyzeVueComponents
  
- Vueファイルのパス取得: 指定されたディレクトリ内のすべてのVueファイルのパスを取得します。
- コンポーネント名とパスの抽出: Vueファイル内のコンポーネント名と、import文からパスを抽出します。
- 同名の.vueファイルの検索: パスは異なるがファイル名が同じ.vueファイルを検索します。
- 使用されていない.vueファイルの検索: プロジェクト内で使用されていない.vueファイルを検索します。


```bash
npx ts-node scripts/analyzeVueComponents.ts ../red-student.front
```

