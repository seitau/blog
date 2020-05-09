---
title: "Firebase Cloud Functionsの環境変数にJSONをサクッと設定する方法"
date: 2019-03-13T18:49:04-07:00
banner: "img/firebase.png"
narrowBanner: false
description: ""
images: ["img/firebase.png"]
menu: ""
categories: ["programming"]
tags: ["firebase"]
showTOC: false
draft: false
---

サービスアカウントを環境変数に設定するときに使うけど毎回忘れるので備忘録としてご紹介。

<!--more-->

{{< web-embed url="https://github.com/firebase/firebase-tools/issues/406#issuecomment-353017349" >}}

```bash
firebase functions:config:set service_account="$(cat service_account.json)"
```

基本的にはこれで間に合うけど、[jq](https://stedolan.github.io/jq/)が入っていれば以下みたいなかっこいいこともできる。

```bash
firebase functions:config:set service_account.(jq -r 'to_entries[] | [.key, (.value | tojson)] | join("=")' < service_account.json  )
```
