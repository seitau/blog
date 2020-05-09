---
title: "HugoでSCSS/SASSをCSSに変換するならVersionに注意"
date: 2019-04-24T01:44:39-07:00
banner: "img/hugo.png"
narrowBanner: true
description: ""
images: ["img/hugo.png"]
menu: ""
categories: ["programming"]
tags: ["hugo", "circleci", "docker", "sass", "scss"]
showTOC: false
draft: false
---

Hugoにbulmaを導入した際にbulmaのSASSをCSSに変換していたのが、なぜかCircleCIでビルドする時に`error: failed to transform resource: TOCSS: failed to transform "bulma/bulma.sass" (text/x-scss): this feature is not available`というエラーを吐いていたので報告。

<!--more-->

## SCSS/SASSをCSSに変換してくれる
Hugoでは以下のようにSCSS/SASSをCSSに変換してくれる機能があるので非常に便利です。

```go-html-template
{{ $bulma := resources.Get "bulma/bulma.sass"}}
{{ $scss := $bulma }}
{{ $options := (dict "targetPath" "style.css" "outputStyle" "compressed" "enableSourceMap" true) }}
{{ $style := $scss | resources.ToCSS $options }}
<link href="{{ $style.Permalink }}" rel="stylesheet"/>
```

## Hugoのversionにextendedが必要
しかしながら、以下のFAQにある通り、この機能を使用するにはHugoのversionにextendedがついている必要があります。
{{< web-embed url="https://gohugo.io/troubleshooting/faq/#i-get-tocss-this-feature-is-not-available-in-your-current-hugo-version" >}}

自分はCircleCIでDocker HubからpullしていたimageでextendedのついていないHugoのversionをinstallしていたため、直ちに修正しました。

念の為修正後のDockerfileを晒しておきます。

```Dockerfile
# use latest Node (alpine)
FROM node:8

# Download and install hugo ここ!!
ENV HUGO_VERSION 0.55.3
ENV HUGO_BINARY hugo_extended_${HUGO_VERSION}_Linux-64bit.deb

#ADD https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/${HUGO_BINARY} /tmp/hugo.deb
RUN curl -sL -o /tmp/hugo.deb \
    https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/${HUGO_BINARY} && \
    dpkg -i /tmp/hugo.deb && \
    rm /tmp/hugo.deb && \
    mkdir /usr/share/blog

WORKDIR /usr/share/blog

RUN  npm -g config set user root && \
     npm install -g firebase-tools

# Expose default hugo port
EXPOSE 1313
```

それでは良いHugoライフを。


