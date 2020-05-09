---
title: "Netlify CMSで画像の大きさを変更できるようにする"
date: 2019-01-22T10:22:36-08:00
banner: "img/netlify.png"
narrowBanner: true
description: ""
images: ["img/netlify.png"]
menu: ""
categories: ["programming"]
tags: ["netlify", "netlify-cms", "hugo"]
draft: false
---

2019年に入ってから友人と[UCSB留学ブログ](https://ucsb.tokyo/)を運営しており、主に友人が記事の執筆、自分はブログサイトの開発を担当しています。

そこで現在、[Netlify CMS](https://www.netlifycms.org/)を利用して執筆と開発を分離しているのですが、CMSからアップロードした画像のサイズが変更できないという苦情を受けたのでごにょごにょして修正しました。

<!--more-->

{{< web-embed url="https://ucsb.tokyo/post/2019-01-14-%E3%81%9D%E3%82%82%E3%81%9D%E3%82%82%E3%82%AB%E3%83%AA%E3%83%95%E3%82%A9%E3%83%AB%E3%83%8B%E3%82%A2%E5%A4%A7%E5%AD%A6%E3%81%A3%E3%81%A6%E3%81%A9%E3%82%93%E3%81%AA%E3%81%A8%E3%81%93/" >}}


# EditorComponentを追加する
Netlify CMSはreactで書かれているということで、最初はカスタマイズできるか自信がなかったのですが、[document](https://www.netlifycms.org/docs/custom-widgets/#registereditorcomponent)を確認してみると、意外にもeditorのcomponentを簡単にカスタマイズできるようになっていて素敵でした。Hugoのfront matterに合わせて適当にボタンとかインプットとか増やせるみたいですね。

早速documentに従って、`/static/admin/index.html`に記述していきます。

{{< highlight javascript "linenos=table" >}}
CMS.registerEditorComponent({
  id: "customImage",
  label: "CustomImage",
  fields: [
    {label: "Image", name: "image", widget: "image"},
    {label: "Width", name: "width", widget: "number", min: 1, default: 400}
  ],
  pattern: /^{ {< customImage "(\S+)" (\S+) >} }$/,
  fromBlock: function(match) {
    console.log(match)
    return {
      image: match[1],
      width: match[2]
    };
  },
  toBlock: function(obj) {
    return '{ {< customImage "' + obj.image + '" ' + obj.width + ' >} }'
  },
  toPreview: function(obj) {
    return (
          '<figure><img src=' + obj.image + ' width=' + obj.width + ' style="height:auto;"/></figure>'
         );
  }
});
{{< /highlight >}}

上記のようにindex.htmlにscriptを追加すると、CMSからcustomImageという項目を選択することができるようになります。

これで終わりかと思いきや、まだ一つやることがあります。

上記のEditorComponentを使用してcustomImageを選択し画像を挿入すると、

```go-html-template
{ {< customImage "example.jpg" 400 >} } 
```

このようなshortcodeが実際のmarkdownファイルには記述されます。

このままではまだhugoがimageとして解釈してくれないため、[custom shortcode](https://gohugo.io/templates/shortcode-templates/#create-custom-shortcodes)を追加しましょう。

# hugoのcustom shortcodeを追加する
hugoのプロジェクトルートにある`/layout/shortcodes`に`customImage.html`というファイルを作成し、以下のコードを保存してください。

```go-html-template
<figure>
    <img src="{{.Get 0}}" width="{{.Get 1}}" style="height:auto;"/>
</figure>
```

shortcodeの第一引数にimageへのパス、第二引数にwidthの数値を入れることでサイズ可変のfigureを挿入することが可能になっています。

これで、CMSからサイズの変更できるcustomImageを挿入することができるようになりました。

# Netlify CMS良き
CMSを選定する際に[forestly.io](https://forestry.io/)とも迷いましたが、もともとの機能がシンプルな分Netlify CMSのほうが拡張性があったので、選んで正解だったかなと思いました。

