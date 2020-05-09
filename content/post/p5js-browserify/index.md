---
title: "browserify+babelでasync/awaitを使用した快適p5.js開発環境構築"
filename: "p5js-browserify"
date: 2019-04-26T20:09:30-07:00
banner: "img/p5js.png"
narrowBanner: false
description: ""
images: ["img/p5js.png"]
menu: ""
categories: ["programming"]
tags: ["p5.js", "processing", "babel", "browserify", "javascript"]
showTOC: false
draft: false
---
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.3/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.3/addons/p5.dom.min.js"></script>

今回は、[processing](https://processing.org/)のjs版として、ブラウザでインタラクティブなグラフィックを実装できる[p5js](https://p5js.org)を使用してwebsiteに以下のようなアニメーションを実装した経験から、自分がどのように快適な開発環境を構築したかをご紹介します。

<!--more-->

<div id="p5js-example" style="margin:0px 20%;width:60%;height:auto;background:rgb(0,0,0,0);position:relative;"></div>

{{< script path="script.js" >}}

## async/awaitを使おう

上記の例では使用していませんが、jsでapiを叩いたりするとpromiseのハンドリングが必要になります。しかし、promiseが頻繁に登場するとthen/catchが複雑になったりして可読性が損なわれることがあるので、モダンなasync/awaitで同期処理をスッキリ書きたいところです。

比較的新しい機能であるこのasync/awaitを各主要ブラウザで使用するには、babel等のツールでブラウザに互換性のある形式にjsをトランスパイルする必要があります。

babelとasync/awaitについてはこちらの記事で詳しく説明されているのでご参照ください。
{{< web-embed url="https://qiita.com/ea54595/items/e6e36fcf1d10deadc17a" >}}

### browserify+babel

数あるツールの中でも、今回はbrowserifyを選択しました。理由は機能が大きすぎず学習コストを抑えながら自分の目的を果たしてくれそうだったからです。

browserify+babelの基本的な使い方はこちらの記事で紹介されています。
{{< web-embed url="https://qiita.com/foursue/items/d80667eff2faed8613f2#browserify%E3%81%A7%E4%BD%BF%E3%81%86%E5%A0%B4%E5%90%88" >}}

念の為自分の`package.json`の一部を掲載しておきます。以下の内容でbrowserifyを走らせれば、module化されたファイルを`import`や`require`で複数読み込んでいる場合でもブラウザで実行できる形式によしなに変換してくれて、かつbabelがjsをトランスパイルしてくれます。ありがたや〜。

```json    
{
    "scripts": {
        "watch-js": "watchify -t babelify static/js/src/*.js -o static/js/dist/bundle.js -dv",
        "watch": "npm run watch-js",
        "build": "browserify static/js/src/main.js -o static/js/dist/bundle.js"
    },
    "browserify": {
        "transform": [["babelify", { "presets": ["@babel/preset-env"] }]]
    },
    "devDependencies": {
        "@babel/core": "^7.3.4",
        "@babel/preset-env": "^7.3.4",
        "babel-preset-env": "^1.7.0",
        "babelify": "^10.0.0",
        "babel-polyfill": "^6.26.0"
    },
    "dependencies": {
        "p5": "^0.8.0"
    }
}
```

localにwatchifyがインストールされていれば、以上の`watch-js`を実行するとjsファイルの変更を検知して自動ビルドしてくれるようになります。

## p5.jsを使おう

自分は以下のようにCDNでp5.jsをhtmlファイル内で読み込んで使用しています。適宜最新のバージョンを指定するようにしましょう。
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.3/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.3/addons/p5.dom.min.js"></script>
```

実際にp5.jsの処理を記述するファイルでは、まず冒頭で`import 'babel-polyfill';`とすることで一部機能が利用可能になります。

公式によると、

>This will emulate a full ES2015+ environment (no < Stage 4 proposals) and is intended to be used in an application rather than a library/tool. (this polyfill is automatically loaded when using babel-node).

>This means you can use new built-ins like Promise or WeakMap, static methods like Array.from or Object.assign, instance methods like Array.prototype.includes, and generator functions (provided you use the regenerator plugin). 

だそうで、プロミスだったり、WeakMapだったりの便利機能が実際には利用できるようになっているらしいです。

また、自分は[instance mode](https://github.com/processing/p5.js/wiki/Global-and-instance-mode)でp5.jsを記述しています。この方が、複数のsketchを管理したり、他のjsモジュールを使用する際に便利だからです。

以下にp5.jsのサンプルコードを貼り付けておきます。

```js
import 'babel-polyfill';

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const sketch = function(p5) {
    p5.setup = function() {
        p5.createCanvas(800, 800);
        p5.background(0);
    }

    p5.draw = async function() {
        p5.fill(255);
        const x = p5.mouseX;
        const y = p5.mouseY;
        await sleep(1000);
        p5.ellipse(x, y, 20, 20);
    }
}

new p5(sketch)
```

以上のサンプルが以下のcanvasで実行されています。draw関数の中でawaitをつかって1秒後に描画されるようにしました。canvasの上でマウスを動かすと1秒遅れで円がついてくるのがわかると思います。async/awaitが解釈され、ちゃんと動いてますね！

<div id=sample style="margin:0px 20%;width:60%;height:auto;background:rgb(0,0,0,0);position:relative;"></div>
