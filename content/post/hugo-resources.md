---
title: "HugoのPage Resourcesの使い方"
date: 2019-04-17T16:23:27-07:00
banner: "img/hugo.png"
narrowBanner: true
description: ""
images: ["img/hugo.png"]
menu: ""
categories: ["programming"]
tags: ["hugo"]
showTOC: false
draft: false
---

初めて使用するhugoのthemeを読んでいてpage resourceの使い方がすぐ理解できなかったのでメモ。

<!--more-->

### 参考ページ
- [Hugo Page Resources
and how to use them...](https://regisphilibert.com/blog/2018/01/hugo-page-resources-and-how-to-use-them/)
- [Page Resources -HUGO公式ドキュメント-](https://gohugo.io/content-management/page-resources/)

## postごとにディレクトリを作る

以下は上記の[Hugo Page Resources
and how to use them...](https://regisphilibert.com/blog/2018/01/hugo-page-resources-and-how-to-use-them/)からお借りした図。

自分は普段postごとにディレクトリを作ることはしませんが、以下のようにディレクトリをポストのスラッグ名(例では`"i-love-eating-cupcakes"`)で作成し、その中に`index.md`、`images`とファイルを分けて置くことも可能です。こうしておくと、staticフォルダに画像が溜まりまくって何が何だか分からなくなるのを防げるので良いですね。

```text
.
└── content
    ├── post
    │   ├── i-love-eating-cupcakes
    │   │   ├── index.md //index.mdにfont matterとか記事を書く
    │   │   └── images
    │   │       ├── yummy-cupcake.jpg
    │   │       └── shiny-glaze.jpg
    │   └── i-hate-baking-cupcakes
    │       ├── index.md 
    │       └── images
    │           ├── overcooked-dough.jpg
    │           └── sloppy-icing.jpg
    └── recipes
```

## pageからresourceにアクセスする
今回の例では、`images`がpage resourcesにあたります。例えば、`i-love-eating-cupcakes`のpostの`yummy-cupcake.jpg`にアクセスしたい場合、以下のように取得することができます。

```go-html-template
{{ with .Site.GetPage "/post/i-love-eating-cupcakes" }}
  {{ .Resources.Match "images/yummy-cupcake.jpg" }} 
{{ end }}
```

`.Resources.Match "images/yummy-cupcake.jpg"`で"images/yummy-cupcake.jpg"にマッチするファイルを取得しています。Matchの他にもMethodがありますので、詳しくは[こちら](https://gohugo.io/content-management/page-resources/#methods)を参照してください。 

## resourceにメタデータを与える
上の図で言うindex.mdのfont matterに以下のようにpage resourceのメタデータを記載することができます。toml記法で表記しています。

```toml
---
title: "HugoのPage Resourcesの使い方"
date: 2019-04-17T16:23:27-07:00
draft: false

[[resources]]
  src = "images/yummy-cupcake.jpg"
  name = "featured-image"
  title = "yummy-cupcake"
  [resources.params]
    icon = "photo"
---
```

このように`name`をつけてあげることで、先ほど`.Resources.Match "images/yummy-cupcake.jpg"`としていたところを、`.Resources.Match "featured-image"`とわかりやすく短縮することができます。詳しくは[こちら](https://gohugo.io/content-management/page-resources/#resources-metadata-example)を参照してください。


