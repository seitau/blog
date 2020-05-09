---
banner: "img/coding.png"
date: "2019-01-13T16:58:06+02:00"
description: ""
images: []
menu: ""
categories: ["programming"]
tags: ["cryptocurrency", "litecoin", "bitcoincash", "blockchain"]
title: "Electrum Litecoin Wallet・Electron Cashをテストネットにつなぐ"
draft: false
---
開発に使う目的でインストールしたけどデフォルトでメインネットに接続してしまってテストネットへの切り替えボタンも見当たらなかったのでメモ。

<!--more-->

コマンドラインで以下のように開けばテストネットに繋がる。

## Electrum Litecoin Wallet
```bash
open -n /Applications/Electrum-LTC.app/ --args --testnet
```

## Electron Cash
```bash
open -n /Applications/Electron-Cash.app --args --testnet
```

