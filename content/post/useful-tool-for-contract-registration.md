---
banner: "img/ethereum-homestead.jpg"
narrowBanner: false
date: "2019-01-13T21:58:06+02:00"
description: ""
images: ["img/ethereum-homestead.jpg"]
menu: ""
categories: ["programming"]
tags: ["cryptocurrency", "ethereum", "blockchain"]
title: "Etherscanにコントラクトを登録するときに便利なツール"
draft: false
---
Ropstenでコントラクトをテストしようと思い、せっかくだからEtherscanに登録して弄ってみようと思ったものの、スムーズにいかなかったのでメモ。

<!--more-->

Etherscanにコントラクトを登録して内容を公開するには、deployしたコントラクトのソースを用意する必要があります。ここで問題なのが、コントラクトでたくさんimportしていた時に、すべてのコントラクトのコードを一箇所にまとめなきゃいけないという点です。初めて知った時は地獄だと思いました。

## 複数ファイルにまたがるコントラクトをまとめる
でも世の中には便利なツールを開発してくださる先駆者の方々がいらっしゃいます。

自分はtruffleで開発していたので[truffle-flattener](https://www.npmjs.com/package/truffle-flattener)一択でした。truffleを使っていないなら[solidity-flattener](https://github.com/BlockCatIO/solidity-flattener)もありだと思いますが、自分の場合はpipを使ったことがなくて導入に苦労したのと、openzeppelin-solidityとかの継承関係を解決してくれないので使えませんでした。

truffle-flattenerはコマンドラインで

```fish
truffle-flattener original.sol >> output.sol
```

とやれば、継承関係も重複なく一箇所に出力してくれます。超便利。
これでまとめたコードをEtherscanにコピペして登録完了！と思いきや、うまく行かない。なんで。

## コンストラクタに与えた引数のabiを取得する

ここでもう一つ問題が。deploy時にコンストラクタに与えた引数のabiを入力しなきゃいけないんですね。これは面倒臭い。
※ちなみにcontract abiの詳細はこちらの[wiki](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI)に書いてあります。

幸い手元にdeploy時の引数のデータが残っていたので、6つあった引数を最悪全部エンコードして繋げればよかったのですが、なんせ泥臭いので何か方法はないかと模索したところ出会ったのが、こちらの[Ethereum Contract ABI Converter](https://abi.sonnguyen.ws/)というサイト。

めっちゃ簡単にabi出せるやん。超便利。

ということでめでたくEtherscanにコントラクトを登録できました。
過去に数回登録してたのにめっちゃ手間取った。。。
