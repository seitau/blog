---
title: "Goでブロックチェーンを作る  Part 1: 基本型"
date: 2019-02-01T00:41:08-08:00
banner: "img/gopher.png"
narrowBanner: true
description: ""
images: ["img/gopher.png"]
menu: ""
categories: ["programming"]
tags: ["blockchain", "golang", "translation"]
showTOC: true
draft: false
---

### この記事について

この記事はIvan Kuznetsovさんの[Building Blockchain in Go. Part 1: Basic Prototype](https://jeiwan.cc/posts/building-blockchain-in-go-part-1/)を本人の許可を得て翻訳したものです。他のパートの翻訳記事は随時アップロードしていきます。

<!--more-->

- [Part 1: 基本型](https://seita.icu/2019/02/01/go%E3%81%A7%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3%E3%82%92%E4%BD%9C%E3%82%8B-part-1-%E5%9F%BA%E6%9C%AC%E5%9E%8B/)
- [Part 2: プルーフオブワーク](https://seita.icu/2019/02/02/go%E3%81%A7%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3%E3%82%92%E4%BD%9C%E3%82%8B-part-2-%E3%83%97%E3%83%AB%E3%83%BC%E3%83%95%E3%82%AA%E3%83%96%E3%83%AF%E3%83%BC%E3%82%AF/)

翻訳経験に乏しいため、誤訳や不足等がありましたらご指摘お願い致します。

<div id="toc-position"></div>

# Introduction

ブロックチェーンは21世紀における最も革新的な技術の一つであり、その秘めたる可能性は未だ最大限に発揮されずに成熟過程にあります。ブロックチェーンとは要するに分散したデータベースなのですが、他と一線を画しているのは、それがプライベートなものではなく、パブリックなものであるということです。利用する者全てがデータベースの一部もしくは全体のコピーを持っており、新しい記録は他のデータベースの保持者の同意のもと追加されます。そしてこのブロックチェーンこそが暗号通貨やスマートコントラクトを可能にしたのです*1。

この一連の記事を通じて、シンプルなブロックチェーンを土台とした簡単な暗号通貨の作成を目指していきます。

*1 訳注：ブロックチェーン上で実行されるスマートコントラクトを指すと思われます。

# Block

それでは、「ブロックチェーン」の「ブロック」から始めましょう。

ブロックチェーンにおいて重要な情報を格納するのがブロックです。例えば、ビットコインのブロックはトランザクションのデータを格納している、あらゆる暗号通貨の肝です。この他にも、ブロックは技術的な情報を格納しています。バージョンや現時点のタイムスタンプ、以前のブロックのハッシュ値などです。

今回の記事では、いわゆる本格的なブロックチェーンやビットコインで用いられるようなブロックの実装はしません。代わりに、重要な情報のみを含んだわかりやすいものを使用します。それが以下のブロックです:

```Go
type Block struct {
        Timestamp     int64
        Data          []byte
        PrevBlockHash []byte
        Hash          []byte
}
```

`Timestamp`はブロック生成時点のタイムスタンプ、`Data`はブロックに格納されている重要な情報、`PrevBlockHash`は以前のブロックのハッシュ値を示しており、`Hash`はこのブロックのハッシュ値を指しています。ビットコインに限った話をすると、`Timestamp`、`PrevBlockHash`と`Hash`はブロックヘッダーに記録されて独立したデータ構造を形成しており、トランザクション（上記のブロックの`Data`にあたる情報）は個々のデータ構造を有しているのですが、ここでは分かりやすさを優先してそれらの情報を一箇所にまとめています。

では、ハッシュ値はどのように算出するのでしょうか？ハッシュ値の算出方法はブロックチェーンの重要な特徴の一つであり、ブロックチェーンの堅牢性を支えるものです。

ハッシュ値を算出するのは計算上とても困難な作業であり、高性能なコンピュータをもってしても少なからず時間がかかるプロセスです（これがビットコインのマイニングのために高性能なGPUが売れている理由である）。このように設計することで新しいブロックの生成を困難にし、一度生成されたブロックが保持するデータの改ざんを防いでいるのです。このメカニズムについてはまた今度実装する予定です。

とりあえずここでは、上記のブロックを連結し、連結した組み合わせからSHA-256ハッシュを算出します。以下の`SetHash`メソッドで実行してみましょう:

```Go
func (b *Block) SetHash() {
        timestamp := []byte(strconv.FormatInt(b.Timestamp, 10))
        headers := bytes.Join([][]byte{b.PrevBlockHash, b.Data, timestamp}, []byte{})
        hash := sha256.Sum256(headers)

        b.Hash = hash[:]
}
```

次はGo言語の慣習に従い、簡単なブロックの生成機能を実装します:

```Go
func NewBlock(data string, prevBlockHash []byte) *Block {
        block := &Block{time.Now().Unix(), []byte(data), prevBlockHash, []byte{}}
        block.SetHash()
        return block
}
```

「ブロック」については以上です！

# Blockchain

それでは、ブロックチェーンの実装に移りましょう。

ブロックチェーンは順序だった後部リンク型のリスト構造を持つデータベースです。つまりブロックは生成された順番で格納され、それぞれ一つ前のブロックとリンクしています。こういった構造によりチェーンに存在する最新のブロックを（効率的に）参照することが可能になっているのです。

Go言語では配列とマップを使用することでこの構造を実装できます。配列は順に並べられたハッシュ値を保持し（Go言語の配列には順序があります)、マップはハッシュ値とブロックのペア情報を保持します（マップに順序はありません)。しかし今回はハッシュ値からブロックを取得する必要はないので、配列のみを使用しましょう:

```Go
type Blockchain struct {
        blocks []*Block
}
```

これで初めてのブロックチェーンができました。予想以上に簡単でしたね😉

それでは、ブロックの追加ができるようにしましょう:

```Go

func (bc *Blockchain) AddBlock(data string) {
        prevBlock := bc.blocks[len(bc.blocks)-1]
        newBlock := NewBlock(data, prevBlock.Hash)
        bc.blocks = append(bc.blocks, newBlock)
}
```

完成?

いやまだやることがあります...

ブロックを追加するにはブロックが存在している必要がありますが、まだブロックチェーン上にブロックが一つもありません。どんなブロックチェーンでも最低一つはブロックが必要です。そしてその一番最初のブロックはgenesis blockと呼ばれています。

それでは、メソッドを実装してgenesis blockを生成しましょう:

```Go
func NewGenesisBlock() *Block {
        return NewBlock("Genesis Block", []byte{})
}
```

これで、genesis blockを伴ったブロックチェーンを生成する関数を実装できます:

```Go
func NewBlockchain() *Blockchain {
        return &Blockchain{[]*Block{NewGenesisBlock()}}
}
```

実際に予想通り動くか確認しましょう:

```Go
func main() {
        bc := NewBlockchain()

        bc.AddBlock("Send 1 BTC to Ivan")
        bc.AddBlock("Send 2 more BTC to Ivan")

        for _, block := range bc.blocks {
                fmt.Printf("Prev. hash: %x\n", block.PrevBlockHash)
                fmt.Printf("Data: %s\n", block.Data)
                fmt.Printf("Hash: %x\n", block.Hash)
                fmt.Println()
        }
}
```

実行結果：

```Go
Prev. hash:
Data: Genesis Block
Hash: aff955a50dc6cd2abfe81b8849eab15f99ed1dc333d38487024223b5fe0f1168

Prev. hash: aff955a50dc6cd2abfe81b8849eab15f99ed1dc333d38487024223b5fe0f1168
Data: Send 1 BTC to Ivan
Hash: d75ce22a840abb9b4e8fc3b60767c4ba3f46a0432d3ea15b71aef9fde6a314e1

Prev. hash: d75ce22a840abb9b4e8fc3b60767c4ba3f46a0432d3ea15b71aef9fde6a314e1
Data: Send 2 more BTC to Ivan
Hash: 561237522bb7fcfbccbc6fe0e98bbbde7427ffe01c6fb223f7562288ca2295d1
```

これで以上です！

# Conclusion

ここではとてもシンプルなブロックチェーンの基本型を作成しました。それぞれが一つ前のブロックと繋がったブロックの配列です。しかし実際のブロックチェーンはもっと複雑になっています。上記のブロックチェーンでは早く簡単にブロックを生成することができますが、実際にはもっと作業が必要になります。ブロックを追加する権利を得るために大変な計算をしなければならないのです（このメカニズムはProof-of-Workと呼ばれます）。さらに、分散型データベースには意思決定者が存在しません。つまり新しいブロックはネットワークの参加者によって承認されなければなりません（このメカニズムはコンセンサスと呼ばれます）。しかも、今回作成したブロックチェーンにはトランザクションが何もありません。

それぞれの特徴については今後掲載する記事の中で触れていきたいと思います。



