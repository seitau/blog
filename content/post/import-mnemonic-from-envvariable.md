---
banner: "img/ethereum-homestead.jpg"
narrowBanner: false
date: "2019-01-14T00:58:06+02:00"
description: ""
images: ["img/ethereum-homestead.jpg"]
menu: ""
categories: ["programming"]
tags: ["mnemonic", "ethereum"]
title: "環境変数からmnemonicを読み込んだら躓いたメモ"
draft: false
---

fishの環境変数にこんな感じでmnemonicを宣言してtruffle-hdwallet-providerでアドレスを導出したところ、[mnemonic code converter](https://iancoleman.io/bip39/)とは違うアドレスが出てきたので、あれ？ってなった。

<!--more-->

```fish
set -x MNEMONIC catalog park praise void alarm bright olive hidden box chicken squeeze shove
```

冷静に調べてみたところ、この環境変数を`process.env.MNEMONIC`で読み込むと、

```text
catalogparkpraisevoidalarmbrightolivehiddenboxchickensqueezeshove
```

mnemonicの単語間の空白が消えていたことが判明。
環境変数は基本的に文字列で読み込まれるからクオーテーションはいつもつけていなかったのですが、空白が消えるのは想定外でした。
あとmnemonicの空白がないと違うアドレスがでちゃうのも意外でした。

```fish
set -x MNEMONIC 'catalog park praise void alarm bright olive hidden box chicken squeeze shove'
```

よってクオーテーションをつけてあげたらちゃんと空白つきでmnemonicが読み込まれ、欲しかったアドレスが出てきました。
