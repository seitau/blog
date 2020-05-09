---
title: "Hugoにブログカード埋め込みshortcodeを実装する"
date: 2019-01-29T11:24:15-08:00
banner: "img/hugo.png"
narrowBanner: true
description: ""
images: ["img/hugo.png"]
menu: ""
categories: ["programming"]
tags: ["hugo", "shortcode"]
draft: false
---
[先日書いた記事](https://seita.icu/2019/01/22/netlify-cms%E3%81%A7%E7%94%BB%E5%83%8F%E3%81%AE%E5%A4%A7%E3%81%8D%E3%81%95%E3%82%92%E5%A4%89%E6%9B%B4%E3%81%A7%E3%81%8D%E3%82%8B%E3%82%88%E3%81%86%E3%81%AB%E3%81%99%E3%82%8B/)で、他に自分が運営している[UCSB留学ブログ](https://ucsb.tokyo/)を記事に埋め込んで紹介したのですが、実はその埋め込み作業にかなり手間がかかったのでまとめます。

<!--more-->

# はてなのapiで埋め込めない

最初は[こちら](https://nelog.jp/hatenablogcard)の記事にも書かれているように、iframeではてなのapiを使用して手軽に済ませようと思ったのですが(以下例）、なぜかうまく画像が表示されず苦戦。
```html
<iframe class="hatenablogcard" style="width:100%;height:155px;max-width:680px;" title="URLを記入するだけ！はてなブログカード風にWordpress記事も表示させるカスタマイズ方法" src="https://hatenablog-parts.com/embed?url=http://nelog.jp/wordpress-blog-card" width="300" height="150" frameborder="0" scrolling="no"></iframe>
```

自分のサイトのogpがちゃんと設定されていないのかなとも思いましたが、twitterやfacebook
では綺麗に表示されているので大丈夫そう。。

# 自作しよう
いくら調べても原因がわからなかったのでhtmlをベタ書きして埋め込もうかとも思いましたが、悔しいのできっちり自作してやることにしました。参考にしたのは以下のサイト。

- [ブログのビルド用にOGPの情報をJSONで返すサーバーも作った - PIYO - Tech & Life -](https://blog.piyo.tech/posts/2018-04-04-ogp-json/)
- [URLのOGP情報をスクレイピングするだけのWebAPIを作った - Webuilder240's Blog](https://webuilder240.hatenablog.com/entry/2018/01/22/080000)

目標としては、hugoの[data driven content](https://gohugo.io/templates/data-templates/#data-driven-content)を利用してshortcodeでurlを指定するだけでogpの情報を埋め込める実装を目指しました。

## ogpの情報をJSONで返却するapiを実装する
早速cloud functions for firebaseを利用し、ogpの情報をスクレイプしてJSONで結果を返すapiを作ります。以下該当コード。

{{< highlight javascript "linenos=table" >}}
exports.ogp = functions.https.onRequest((req, res) => {
    const parser = require("ogp-parser");
    const params = req.query;
    const chacheControl = 'public, max-age=31557600, s-maxage=31557600';
    if (!params.hasOwnProperty('url')) {
        console.error("Error getting ogp data: please provide url");
        return res.json({ error: "Error getting ogp data: please provide url" });
    }
    return parser(encodeURI(params['url']), false)
        .then((data) => {
            console.log(data);
            console.log(params['url']);
            if (!data.hasOwnProperty('title')) {
                console.error("Error getting ogp data: no ogpData returned");
                return res.json({ error: "no ogpData returned" });
            }
            let ogpData = {};
            ogpData['siteName'] = data.title;
            for(let prop in data.ogp) {
                if (/^og:/g.test(prop)) {
                    ogpData[prop.split(':')[1]] = data.ogp[prop][0];
                }
            }
            return res.set('Cache-Control', chacheControl).json(ogpData);
        })
        .catch((err) => {
            console.error("Error getting ogp data: " + err);
            return res.json({ error: err });
        });
});
{{< /highlight >}}

apiのendpointにクエリパラメーターでurlを付与することでogpを取得できるようになっています。また、何度もapiを叩いて欲しくないのでCache-Controlでcacheを1年間有効にしています。

加えて、9行目でogpのparserにencodeURIしたurlを渡しているのは、素のurlをparserに渡す実装にしていたところ、urlに日本語が入っているページをリクエストしたら `404 page not found` でogpの情報が返ってきてしまっていたためです。しばらく原因がわからずハマったので注意してください。

## firebase hostingとfunctionsを連携する
このブログではfirebase hostingを採用しているため、同様にfirebaseのサービスであるfunctionsとは簡単に連携することができます。

[Cloud Functions による動的コンテンツの配信  |  Firebase](https://firebase.google.com/docs/hosting/functions?hl=ja#direct_hosting_requests_to_your_function)

上のdocumentに従って、`firebase.json` にrewritesの設定を追記します。これだけでfirebase hostingのbase domainに関数名を加えるだけでapiを叩けるようになります。

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [ {
      "source": "/ogp", "function": "ogp"
    } ]
  },
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ]
  }
}
```

## hugoのshortcodeを作る
続いてshortcodeを実装します。完成したコードは以下です。自分は `web-embed.html` としてshortcodeに追加しました。

{{< highlight go-html-template "linenos=table" >}}
{{ $url := .Get "url" }}
{{ $json := getJSON $.Page.Site.Params.OgpApiEndpoint $url }}
{{ $siteName := $json.siteName }}
{{ $title := $json.title }}
{{ $description := $json.description }}
{{ $image := $json.image }}
{{ $urlInfo := urls.Parse $url }}
{{ $host := path.Join $urlInfo.Scheme $urlInfo.Host }}
{{ $prefix := "https://www.google.com/s2/favicons?domain=" }}
{{ $favicon := printf "%s%s" $prefix $urlInfo.Host }}

<div class="body-iframe page-embed hatena-web-card">
    <div class="embed-wrapper">
        <div class="embed-wrapper-inner">
            <div class="embed-content with-thumb">
                <div class="thumb-wrapper">
                    <a href="{{ $url }}" target="_blank">
                        <img src="{{ $image }}" class="thumb">
                    </a>
                </div>
                <div class="entry-body">
                    <h2 class="entry-title">
                        <a href="{{ $url }}" target="_blank">
                            {{ $title }}
                        </a>
                    </h2>
                    <div class="entry-content">
                            {{ $description }}
                    </div>
                </div>
            </div>
            <div class="embed-footer">
                <a href="{{ $host }}"target="_blank">
                    <img src="{{ $favicon }}" alt="" title="{{ $title }}" class="favicon">
                    {{ $host }}
                </a>
            </div>
        </div>
    </div>
</div>
{{< /highlight >}}

サイトのconfigに設定したOgpApiEndpointにgetJSONした結果を利用しています。faviconに関してはgoogleのapiを利用して取得しています。

上記のshortcodeに対応するcssが以下です。はてなのcssを丸パクリしています。

{{< highlight css "linenos=table" >}}
div.page-embed.hatena-web-card{
    height: 155px;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

div.page-embed.hatena-web-card div.embed-wrapper-inner{
    padding: 12px;
}

div.page-embed.hatena-web-card div.embed-content.with-thumb{
    height: 100px;
    overflow: hidden;
    position: relative;
}

div.page-embed.hatena-web-card div.embed-content.with-thumb .thumb-wrapper{
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    overflow: hidden;
}
div.page-embed.hatena-web-card div.embed-content.with-thumb .thumb-wrapper .thumb{
    width: auto;
    max-width: 200%;
    height: 100px;
    border: none !important;
    display:block;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
}

div.page-embed.hatena-web-card div.embed-content.with-thumb .entry-body{
    margin-right: 110px;
}
div.page-embed.hatena-web-card div.embed-content.with-thumb .entry-body .entry-title{
    font-size: 17px;
    margin: 0 0 2px;
    line-height: 1.4;
    max-height: 47px;
    overflow: hidden;
    border: none;
}

div.page-embed.hatena-web-card div.embed-content.with-thumb .entry-body .entry-content{
    line-height: 1.5;
    font-size: 12px;
    max-height: 72px;
    overflow: hidden;
    border: none;
    padding-bottom:0;
}

div.page-embed.hatena-web-card div.embed-footer{
    margin-top: 8px;
    height: 15px;
    position: relative;
    font-size: 11px;
}

div.page-embed.hatena-web-card div.embed-footer img.favicon{
    width:16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
    border: none !important;
}
{{< /highlight >}}

## 結果
```go-html-template
{ {< web-embed url="https://seita.icu/" >} }
```
↑これがこうなる↓

{{< web-embed url="https://seita.icu/" >}}
<span class=emoji>:warning:</span>コードブロックがshortcodeとして解釈されるのを防ぐため波括弧にスペースを入れて対処しています。
