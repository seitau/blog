---
title: "PuppeteerをFirebase Cloud Functionsで動かす"
date: 2019-03-21T17:59:07-07:00
banner: "img/firebase.png"
narrowBanner: false
description: ""
images: ["img/firebase.png"]
menu: ""
categories: ["programming"]
tags: ["puppeteer", "firebase", "scraping"]
showTOC: false
draft: false
---

先日Puppeteer入門の記事を書きましたが、今回はその続きで、Puppeteerを用いたスクレイピングプログラムをfirebase cloud functionsにデプロイしたいと思います。

<!--more-->

firebase cloud functionsの環境はtypescriptを使用しています。

#### 参考記事
{{< web-embed url="https://angularfirebase.com/lessons/how-to-use-puppeteer-on-firebase-cloud-functions/" >}}

## Node8を指定する
Puppeteerを使用するにはNodeのバージョンが8かそれ以上である必要があるため、firebase functionsのプロジェクトにある`package.json`でベータ版であるNode8ランタイムを指定します。

```json
{
    // 省略
    "engines": {
        "node": "8"
    }
}
```

要参照: [Node.js のバージョンを設定する - firebase](https://firebase.google.com/docs/functions/manage-functions?hl=ja#set_nodejs_version)

## tsconfigにdom libraryを追加する

Puppeteerはウェブブラウザーなので、domの操作が必要になります。デフォルトでは`tsconfig.json`にDOM libは含まれていないので、追記しましょう。

```json
{
    "compilerOptions": {
        "lib": ["es7", "dom"], // <-- ここ
            // ...
    }
}
```

## メモリ割り当てを指定する
Puppeteerはメモリを多く消費するため、メモリの割り当てを指定しましょう。
自分の作った関数は処理に時間がかかったため、defaultのtimeoutである1分を超えるようであればmemoryと一緒に`runWith`で指定しましょう。

```javascript
import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';


export default functions.runWith({
  timeoutSeconds: 200,
  memory: '1GB'
}).// 省略

```

firebaseの[タイムアウトとメモリ割り当てを設定する](https://firebase.google.com/docs/functions/manage-functions?hl=ja#set_timeout_and_memory_allocation)によると、memoryとtimeoutは以下の値まで設定できるようです。

>timeoutSeconds の最大値は 540（9 分）です。memory に有効な値は次のとおりです。
>
>- 128MB
>- 256MB
>- 512MB
>- 1GB
>- 2GB

要参照: [タイムアウトとメモリ割り当てを設定する - firebase](https://firebase.google.com/docs/functions/manage-functions?hl=ja#set_timeout_and_memory_allocation)

## 関数を作成する

あとは自由にpuppeteerの処理を関数に記述するだけです。

```javascript
export functions
    .runWith({
        timeoutSeconds: 200,
        memory: '1GB'
    })
    .https.onRequest(async (req, res) => {

        // headlessブラウザー指定と'--no-sandbox'のオプションを忘れずに
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // puppeteerの処理を記述する

        return res.status(200).json({
            result: "finished",
        });
    });
```

以上！
