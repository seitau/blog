---
title: "ディレクトリ移動/ファイル選択を爆速にするTerminalツール"
date: 2019-11-30T07:24:15-08:00
banner: "img/iterm2.png"
narrowBanner: true
description: ""
images: ["img/iterm2.png"]
menu: ""
categories: ["programming"]
tags: ["zsh", "command", "vim", "terminal", "advent calendar"]
draft: false
---

fishからzshに乗り換える際に、快適な環境を構築していく中で幾つか便利コマンドを発見したりスクリプトを作成したので紹介します。
<!--more-->

# 便利ツール群 
## "z"

特定の文字列にマッチしたディレクトリを利用頻度でsortして表示/移動してくれるコマンド。
{{< web-embed url="https://github.com/rupa/z" >}}

## "fasd"

上記のzを拡張し、ディレクトリ移動のみならずvimでのファイル編集や実行も可能にしたコマンド。
{{< web-embed url="https://github.com/clvv/fasd" >}}

## "fzf.vim"

有名なfuzzy finderであるfzfのvimプラグイン。vimから周辺ファイルをfuzzy findして編集できたり、各種gitコマンド結果をリッチに表示したりできる。
{{< web-embed url="https://github.com/junegunn/fzf.vim" >}}

# 自作スクリプト

普段ghq+pecoでプロジェクト間を移動しているので、ghqで管理するgitプロジェクトで頻繁にディレクトリの移動やファイル編集をします。
その際、上に挙げたツールでは少し物足りなかったり逆に機能が大きすぎたりしたので、自分に合ったものを自作しました。

## ghq+pecoでgitプロジェクト移動

以下の記事を参考に追加したスクリプト。もはやこれなしじゃ生きられない。
{{< web-embed url="https://qiita.com/strsk/items/9151cef7e68f0746820d" >}}

```zsh
function peco_select_src () {
  local selected_dir=$(ghq list -p | peco --query "$LBUFFER")
  if [ -n "$selected_dir" ]; then
    BUFFER="cd ${selected_dir}"
    zle accept-line
  fi
}
```

## 現在のディレクトリ以下のファイルを選択

対象ファイル数が多くなりすぎると重くなるので、ghqプロジェクト内のみで実行可能にしています。
選択結果がファイルの場合はvimで開き、ディレクトリの場合はcdするように`go_to`という関数を使用しています。

```zsh
function select_file_below_pwd() {
  if [ ! `pwd | grep "$(ghq root)"` ]; then
    echo "you are not in ghq path"
    zle accept-line
    return 0
  fi
  # grep -v -e で除外対象を指定
  local selected_path="\
    $(find . | \
    sed "s/^.//g" | \
    grep -v -e node_modules -e vendor -e /.git | \
    fzf --ansi --reverse --height 20% --border)"

  if [ -n "$selected_path" ]; then
    local dest_path=".$(echo $selected_path | awk '{print $1}')"
    go_to $dest_path
  fi
}
```

```zsh
function go_to() {
  if [ -f $1 ]; then
    nvim $1
    dir_path=$(echo $1 | rev | cut -d '/' -f 2- | rev)
    BUFFER="cd $dir_path"
  elif [ -d $1 ]; then
    BUFFER="cd $1"
  else
    echo "selected path is neither file nor directory"
  fi
  zle accept-line
}
```

## ghqで管理するgitプロジェクト内で飛ぶ

ここまで紹介しておいてなんですが、実際ほぼこれしか使ってないってくらい重宝しているスクリプトです。
ghqで管理するgitプロジェクト内の全てのファイル、ディレクトリへ瞬時に移動/編集でき、かつ`(root)`を選択するとプロジェクトルートに飛ぶことができます。

こちらも`go_to`を使用しています。

```zsh
function peco_select_file_within_project() {
  local base_path=$(pwd | grep -o "$(ghq list -p)")
  if [ -z $base_path ]; then
    echo "you are not in ghq project"
    zle accept-line
    return 0
  fi

  local trim_base_path="^$(echo $base_path | sed "s/\//./g")."
  local paths="\
    $(find $base_path | \
    sed "s/$trim_base_path//g" | \
    grep -v -e node_modules -e vendor -e .git)"
  local selected_path="$(echo "(root)\n$paths" | awk '{print $1}' | fzf --ansi --reverse --height 30% --border)"

  if [ -n "$selected_path" ]; then
    if [[ "$selected_path" = "(root)" ]]; then
      go_to $base_path
      return 0
    fi
    local dest_path="$base_path/$(echo $selected_path | awk '{print $1}')"
    go_to $dest_path
  fi
}

```
{{< figure src="/img/command-view.png" >}}


# おわりに

自作スクリプトは慣れてないのもありごちゃごちゃしている感が否めないので、もっとエレガントな書き方や代替コマンドをご存知の方がいらっしゃれば教えて下さい！
