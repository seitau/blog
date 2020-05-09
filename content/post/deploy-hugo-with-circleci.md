---
banner: "img/circleci.png"
narrowBanner: true
date: "2019-01-21T12:00:06+02:00"
description: ""
images: ["img/circleci.png"]
menu: ""
categories: ["programming"]
tags: ["hugo", "circleci"]
title: "Hugoをcircleciで自動デプロイする"
draft: false
---

最近このブログを含めて、hugoを使ってブログを構築する機会が多かったので、githubにプッシュしたらciが自動でfirebaseにデプロイしてくれる環境を作りました。

<!--more-->

ちなみに、このブログはgithub + firebase + hugo + circleciで実装してます。

# dockerイメージの作成

circleciからfirebaseへのデプロイに関しては[circleci公式ページ](https://circleci.com/docs/2.0/deployment-integrations/#firebase)に説明があるので省略しますが、公式で紹介されているdockerイメージにはhugoとfirebase-toolsがインストールされているものがなかったので、勉強を兼ねて自作しました。完成イメージは[docker hub](https://hub.docker.com/r/seitauc/docker-hugo-firebase)にupload済みです。

以下のdockerfileはnode.jsのv8をベースにしてhugoとfirebase-toolsをインストールしています。

{{< highlight dockerfile "linenos=table" >}}
# use latest Node (alpine)
FROM node:8

# Download and install hugo
ENV HUGO_VERSION 0.53
ENV HUGO_BINARY hugo_${HUGO_VERSION}_Linux-64bit.deb

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
{{< /highlight >}}

# CircleCIのconfig.ymlを設定

上で作成したimageをcircleciでpullしてfirebase hostingにデプロイします。

config.ymlは以下のような流れになりました。
circleciの環境変数には`$FIREBASE_DEPLOY_TOKEN`と`FIREBASE_PROJECT_ID`を設定しています。

{{< highlight yaml "linenos=table" >}}
version: 2
jobs:
  build:
    branches:
      only:
        - master
    docker:
      - image: seitauc/docker-hugo-firebase:latest
    steps:
      - checkout
        # install git submodules for managing third-party dependencies
      - run: git submodule sync && git submodule update --init
      - run:
          name: Build Hugo Website
          command: hugo -t hugo-icarus-theme
      - deploy:
          name: Deploy Website to Firebase Hosting
          branch: master
          command: firebase deploy --token=$FIREBASE_DEPLOY_TOKEN --project $FIREBASE_PROJECT_ID
{{< /highlight >}}

ここでは、git submoduleの更新、サイトのビルドとfirebaseへのデプロイを行なっています。

以上で、快適なci環境の完成です。
