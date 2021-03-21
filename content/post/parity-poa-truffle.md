---
title: "ParityのPOAプライベートネット建ててtruffleを使う時はbyzantium対応をお忘れなく"
date: 2019-07-23T23:04:21+09:00
banner: "img/parity-ethereum.png"
narrowBanner: false
description: ""
images: ["img/parity-ethereum.png"]
menu: ""
categories: ["programming"]
tags: ["truffle", "ethereum", "parity", "poa", "privatenet", "smartcontract"]
showTOC: false
draft: false
---

以下のtutorialに従ってparityのpoaプライベートネットを構築してから、
{{< web-embed url="https://github.com/openethereum/parity-ethereum" >}}

truffleでコントラクトをデプロイしようとしたら以下のエラーに遭遇、

<!--more-->

```text
Error: Transaction ran out of gas. Please provide more gas.
```

とか

```text
The contract code couldn't be stored, please check your gas limit.
```

など。

どれもtruffleで開発をしてると馴染みがある感じのエラーなので、configでgasの設定いじったりdeploy時にgasをちゃんと指定すれば治るかなーと思ったのですが、全然治らず。

試しに`truffle console`で普通のtxを発行してみると、tx自体は発行され、送金も正常に行われるものの、なぜか


```text
Error: Transaction has been reverted by the EVM:
```

というエラーだけが吐かれる。実際にはrevertされてないのに奇妙である。

試しに`curl`で素のrpcを叩いてreceiptを確認してみると、

```json
{
  "jsonrpc": "2.0",
  "result": {
    "blockHash": "0x9664e8fe7be2ec3579b0b17b4ccd83fc0054adf6ca4ee227f794561e225a289f",
    "blockNumber": "0x12",
    "contractAddress": null,
    "cumulativeGasUsed": "0x5208",
    "from": "0x004ec07d2329997267ec62b4166639513386f32e",
    "gasUsed": "0x5208",
    "logs": [],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "root": null,
    "status": null, <--- nullになっとる！！！！！
    "to": "0xa43e00a4d376d14117e7c97bfb57b54409f9b2b4",
    "transactionHash": "0x60b0ea2f7fff204391119ecf68620b83df4be67a2add3660ef00e056b758ccbf",
    "transactionIndex": "0x0"
  },
  "id": 1
}
```

statusがnullになっていた。これが原因でtruffle側でtxの結果がfalseと判断されerrorが出ていたのだろう。

これってもしかしてparity特有の問題？と疑ったりもしたのだが、以下のpageを発見。

{{< web-embed url="https://ethereum.stackexchange.com/questions/61879/why-root-and-status-is-null-in-transaction-receipts" >}}

どうやらparityのnodeを建てる時のchain specの設定でbyzantiumへの対応ができていなかったらしい。(statusはbyzantiumから導入されたのでnullになっていた)

ということで以下のissueに倣い、chain specにparamsとaccountを書き足してnodeを起動したら、何事もなく上手くいった。
{{< web-embed url="https://github.com/paritytech/parity-ethereum/issues/7124#issuecomment-346647725" >}}

