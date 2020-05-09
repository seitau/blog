---
title: "PuppeteerでHeadlessブラウザ入門"
date: 2019-01-28T00:20:37-08:00
banner: "img/puppeteer.png"
narrowBanner: true
description: ""
images: ["img/puppeteer.png"]
menu: ""
categories: ["programming"]
tags: ["puppeteer", "headless-browser", "chrome", "scraping"]
draft: false
---
大好きなgoogle cloud functionsでheadlessブラウザを動かしてスクレイピングできると聞きつけたので早速入門。

<!--more-->

APIのdocumentは[こちら](https://github.com/GoogleChrome/puppeteer/blob/v1.11.0/docs/api.md#browserpages)。

# Amazonにログインしてみる
いままでkindleでハイライトした箇所が[Amazon Kindle](https://read.amazon.co.jp/notebook?ref_=kcr_notebook_lib)で確認できることは知っていたのですが、いまいち有効活用できてなかったので、自分がkindleで読んだ本の情報をスクレイピングしてなにか作ろう!と思い立ち、まずはログイン処理を実装しました。コードは以下。

{{< highlight javascript "linenos=table" >}}
const puppeteer = require('puppeteer');
const fs = require('fs');

const cookies_path = './cookies_amazon.json';
const AMAZON_EMAIL = process.env.AMAZON_EMAIL;
const AMAZON_PASSWORD = process.env.AMAZON_PASSWORD;
const amazon_kindle_url = 'https://read.amazon.co.jp/notebook?ref_=kcr_notebook_lib';

async function login(page) {
    await page.goto(amazon_kindle_url);
    await page.waitFor(2000);

    await page.type('#ap_password', AMAZON_PASSWORD);
    await page.type('#ap_email', AMAZON_EMAIL);

    await page.click('#signInSubmit');
    await page.waitFor(5000);
    await page.screenshot({path: 'images/amazon_logined.png'});
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const pc = {
        'name': 'Chrome Mac',
        'userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
        'viewport': {
            'width': 1024,
            'height': 820,
            'deviceScaleFactor': 1,
            'isMobile': false,
            'hasTouch': false,
            'isLandscape': false
        }
    };
    const page = await browser.newPage();
    await page.emulate(pc);

    await login(page);

    await page.screenshot({path: 'images/amazon_login.png'});

    const cookies = await page.cookies();
    fs.writeFileSync(cookies_path, JSON.stringify(cookies));

    browser.close();
})();
{{< /highlight >}}

適当なpcの設定をemulateしたのち、[Amazon Kindle](https://read.amazon.co.jp/notebook?ref_=kcr_notebook_lib)のサイトに飛び、環境変数から読み込んだemailとpasswordを入力してログインしています。また、最後に確認のためのスクリーンショットを撮っています。

お気付きの方も多いと思いますが、実は今回headlessブラウザ機能を使用していません。理由はheadless状態だとamazonにロボット判定されて弾かれちゃうからです。情けない限り。。

次回からはcookieを利用してちゃんとheadlessブラウザでアクセスしたいと思います。

# 感想
いざChromeを自動で動かしてみるとPuppeteer(人形遣い)っていうネーミングは秀逸だなと思いました。

あと、スクレイピングに詳しい方、amazonにheadlessブラウザでログインする方法教えてください!

