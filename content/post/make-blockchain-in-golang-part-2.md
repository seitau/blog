---
title: "Goでブロックチェーンを作る Part 2: プルーフオブワーク"
date: 2019-02-02T09:24:09-08:00
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

この記事はIvan Kuznetsovさんの[Building Blockchain in Go. Part 2: Proof-of-Work](https://jeiwan.cc/posts/building-blockchain-in-go-part-2/)を本人の許可を得て翻訳したものです。

<!--more-->

# Introduction
以前の記事では、ブロックチェーンのデータベースの本質的でかつ単純なデータ構造を作りました。そして一つ一つのブロックが過去のものと鎖状に繋がるようブロックを追加できるようにもしました。しかしながら、まだ私たちの実装には決定的な欠陥があります。ブロックの追加が簡単すぎるのです。ブロックチェーンやビットコインにとってブロックの追加が困難であることは非常に重要であるため、今回はこの欠陥を修正していきます。

# Proof-of-Work
ブロックチェーンの鍵となる考えとして、ブロックにデータを保存するには少なからず労力を払う必要があることが挙げられます。この労力こそが、ブロックチェーンを安全で一貫したものにしています。また、この労力には報酬が支払われます(マイニングでお金儲けができるのはこのためです）。

この仕組みは、生活を維持するために働き、収入を得るといった、実社会における考え方と似ています。ブロックチェーンでは、数名の参加者（マイナー）がネットワークを維持し、新しいブロックを追加するために労力を支払い、報酬を得ます。彼らの労働により、ブロックチェーンの堅牢性は支えられ、ブロックが安全にデータベースに取り込まれるのです。ひとつ、このブロックを取り込むという作業を遂行した人は自ら申告して、それが自分の仕事であることを証明する必要があるということを覚えておきましょう。

この「労働して証明する」という一連の仕組みをプルーフオブワークといいます。この「労働」は高性能なコンピュターでも素早く処理できないほど高難度で、大量の計算リソースが必要になります。さらに、計算の難度はブロックの生成間隔が一時間約6ブロックになるよう調整されていて、時間により難易が増すこともあります。ビットコインにおけるこの「労働」の内容は、ブロック生成のためにある要件を満たしたハッシュ値を見つけるというものです。実はこのハッシュ値が「労働の証明」を果たします。すなわち、証明書を見つけるのが実際の仕事ということになります。

最後に、プルーフオブワークは必ず「労働は困難であるがその証明は簡単」であることを頭に置いておいてください。労働の証明は大抵労働者以外の手に委ねられるため、困難である必要はないのです。

# Hashing
この節では、ハッシュ化について話します。もしすでにハッシュ化の概念をご存知なら、この部分は読み飛ばしていただいても構いません。

ハッシュ化とは特定のデータのためのハッシュ値を得るための工程のことを指します。ハッシュ値はある算出されたデータを指し示す唯一無二の値です。また、ハッシュ関数は任意のサイズのデータを受けて一定のサイズのハッシュ値を生成する関数です。以下にハッシュ化の主な特徴を挙げます。

1. ハッシュ値からはその元となったデータは復元できない。つまり、ハッシュ化は暗号化ではない。
2. 一定のデータは一つのハッシュ値のみ持つことができ、その値は唯一無二である。
3. インプットのデータがたとえ１バイトでも違えば結果として得られるハッシュ値は全く異なるものになる。

{{< figure src="https://jeiwan.cc/images/hashing-example.png" >}}

ハッシュ関数はデータの一貫性を確かめるために幅広く使用されています。ソフトウェアのパッケージにチェックサムを添付する企業もあり、パッケージをダウンロードしたのちにその製品から得られたハッシュ値と添付されたハッシュ値を比較することができるようになっています。

ブロックチェーンでは、ハッシュ化はブロックの一貫性を保証するために用いられています。新しいブロックを生成する際にハッシュアルゴリズムへ投入されるデータは以前のブロックのハッシュ値を含んでおり、ブロックチェーン上のブロックのデータを改ざんすることは不可能（もしくは非常に困難）になっています。なぜなら、数珠つなぎになったブロックそれぞれのハッシュ値を再度計算しなければならないからです。

# Hashcash

ビットコインはもともとemailのスパムを防止するために開発されたハッシュキャッシュというプルーフオブワークアルゴリズムを採用しています。このアルゴリズムは以下のステップに分割されます。

1. 何かしらの公開されたデータを用意する。(emailの場合は受信者のアドレス、ビットコインの場合はブロックヘッダー)
2. そのデータに0から始まるカウンターを追加する。
3. データとカウンターを組み合わてハッシュ化する。
4. そのハッシュ値が一定の要件を満たしているか確認する。
5. もし満たしていれば、終了。
6. もし満たしていなければ、カウンターを増加させステップ3と4を繰り返す。

つまり、これはブルートフォースアルゴリズム([力まかせ探索](https://ja.wikipedia.org/wiki/%E5%8A%9B%E3%81%BE%E3%81%8B%E3%81%9B%E6%8E%A2%E7%B4%A2))です。カウンターを変化させ、新しいハッシュ値を取得し、確認する作業を繰り返します。計算リソースを大量に消費する理由がお分りいただけたでしょうか。

ここで、ハッシュ値が満たすべき要件に目を向けてみましょう。ハッシュキャッシュのもともとの実装では、この要件は「ハッシュ値の先頭の20ビットはゼロでなくてはならない」というようなものです。ビットコインでは、設計上、マイナーの増減による計算リソースの変化に関わらずブロックの生成間隔を10分ごとに保つ必要があるため、この要件は時間ごとに調整されます。

このアルゴリズムを実際に試してみるため、一つ前の例からデータを拝借して("I like donuts")、先頭の3バイトが0から始まるハッシュ値を見つけました。

{{< figure src="https://jeiwan.cc/images/hashcash-example.png" >}}

`ca07ca` はカウンターの16進数の値です。10進数では13240266になります。

# Implementation

以上で、理論の解説は済みました。ここからはコードを書いていきましょう。最初に、マイニングの難易度を定義します。

```go
const targetBits = 24
```

ビットコインでは、"target bits"は掘られたブロックのヘッダーに格納されますが、今回は難易度の調整アルゴリズムは実装しないため、クローバル定数として定義してしまいましょう。

24は適当な数字です、私たちの目標はメモリーを256ビット以上消費しないtargetを取得することです。また、targetのビット数と256ビットの差分は十分に大きくしますが、あまりにも大きいと適当なハッシュ値を得るのが困難になるためほどほどにしましょう。

```go
type ProofOfWork struct {
	block  *Block
	target *big.Int
}

func NewProofOfWork(b *Block) *ProofOfWork {
	target := big.NewInt(1)
	target.Lsh(target, uint(256-targetBits))

	pow := &ProofOfWork{b, target}

	return pow
}
```

ここで`block`と`target`へのポインターを持った`ProofOfWork`構造体を定義しています。`target`とは、少し前の節で説明した「要件」の別名です。今回は、ハッシュ値をbig integerに変換して`target`よりも小さいか確認するため、型にはbig integerを用いています。

`NewProofOfWork`関数では、big.Intを1で初期化し、256-targetBitsだけ左にシフトしています。256はSHA-256ハッシュ値のビット数を表していて、今回はSHA-256ハッシュ関数を使用してハッシュ値を導出しています。targetを16進数表記にすると以下のようになります。

```text
0x10000000000000000000000000000000000000000000000000000000000
```

この値は29バイトのメモリを消費します。そして以下が前述したハッシュの比較になります。
```text
0fac49161af82ed938add1d8725835cc123a1a87b1b196488360e58d4bfb51e3 (I like donuts)
0000010000000000000000000000000000000000000000000000000000000000 (target)
0000008b0f41ec78bab747864db66bcb9fb89920ee75f43fdaaeb5544f7f76ca (I like donutsca07ca)
```

最初のハッシュ値（"I like donuts"をハッシュ化したもの）はtargetよりも大きいため、妥当なプルーフオブワークではありません。二つ目のハッシュ値("I like donutsca07ca"をハッシュ化したもの)はtargetよりも小さいため、妥当な証明になります。

targetは範囲の上限というように考えていただければいいでしょう。もしも数字（もしくはハッシュ値)が境界値よりも小さければ、妥当な値であり、逆も然りです。境界値を低くすれば妥当な数は減るため、より適当な値を見つけるのが困難になります。

それでは、ハッシュ化するデータを用意しましょう。

```go
func (pow *ProofOfWork) prepareData(nonce int) []byte {
	data := bytes.Join(
		[][]byte{
			pow.block.PrevBlockHash,
			pow.block.Data,
			IntToHex(pow.block.Timestamp),
			IntToHex(int64(targetBits)),
			IntToHex(int64(nonce)),
		},
		[]byte{},
	)

	return data
}
```

上の箇所はブロックのフィールドをtargetとnonceとマージしているだけです。nonceは暗号学の用語で、ハッシュキャッシュの説明でいうcounterです。

それでは、すべての準備が整いましたので、プルーフオブワークのアルゴリズムを実装していきましょう。

```go
func (pow *ProofOfWork) Run() (int, []byte) {
	var hashInt big.Int
	var hash [32]byte
	nonce := 0

	fmt.Printf("Mining the block containing \"%s\"\n", pow.block.Data)
	for nonce < maxNonce {
		data := pow.prepareData(nonce)
		hash = sha256.Sum256(data)
		fmt.Printf("\r%x", hash)
		hashInt.SetBytes(hash[:])

		if hashInt.Cmp(pow.target) == -1 {
			break
		} else {
			nonce++
		}
	}
	fmt.Print("\n\n")

	return nonce, hash[:]
}
```

まず、変数を初期化しています。`hashInt`はハッシュ値を整数で表記したものです。nonceはカウンターです。次に、有限ループ(math.MaxInt64と等しい`maxNonce`により制限されている）を回します。この制限はnonceのオーバーフローを予防するためのものです。プルーフオブワークの難易度はnonceのオーバーフローが発生するには低すぎますが、念の為実装しておきましょう。

ループの中では、

1. データの用意
2. SHA-256ハッシュ関数を用いてハッシュ値を得る
3. ハッシュ値をbig integerに変換
4. targetとintegerを比較

という処理が行われています。前述した内容のとおりなので簡単ですね。ではBlockのSetHashメソッドを削除し、NewBlock関数を修正していきましょう。

```go
func NewBlock(data string, prevBlockHash []byte) *Block {
	block := &Block{time.Now().Unix(), []byte(data), prevBlockHash, []byte{}, 0}
	pow := NewProofOfWork(block)
	nonce, hash := pow.Run()

	block.Hash = hash[:]
	block.Nonce = nonce

	return block
}
```

ここで、Blockのプロパティとしてnonceが保存されていることに注目してください。nonceは証明を検証する時に必要になるためです。Block構造体は現在以下のようになっています。

```go
type Block struct {
	Timestamp     int64
	Data          []byte
	PrevBlockHash []byte
	Hash          []byte
	Nonce         int
}
```

それでは、ちゃんと動くかプログラムを実行して確認してみましょう。

```bash
Mining the block containing "Genesis Block"
00000041662c5fc2883535dc19ba8a33ac993b535da9899e593ff98e1eda56a1

Mining the block containing "Send 1 BTC to Ivan"
00000077a856e697c69833d9effb6bdad54c730a98d674f73c0b30020cc82804

Mining the block containing "Send 2 more BTC to Ivan"
000000b33185e927c9a989cc7d5aaaed739c56dad9fd9361dea558b9bfaf5fbe
```

```bash
Prev. hash:
Data: Genesis Block
Hash: 00000041662c5fc2883535dc19ba8a33ac993b535da9899e593ff98e1eda56a1

Prev. hash: 00000041662c5fc2883535dc19ba8a33ac993b535da9899e593ff98e1eda56a1
Data: Send 1 BTC to Ivan
Hash: 00000077a856e697c69833d9effb6bdad54c730a98d674f73c0b30020cc82804

Prev. hash: 00000077a856e697c69833d9effb6bdad54c730a98d674f73c0b30020cc82804
Data: Send 2 more BTC to Ivan
Hash: 000000b33185e927c9a989cc7d5aaaed739c56dad9fd9361dea558b9bfaf5fbe
```

良さそうですね！ハッシュの生成にある程度時間がかかり、全て3つのゼロから始まっているのが確認できます。

まだ1つやることが残っています。プルーフオブワークを検証できるようにしましょう。

```go
func (pow *ProofOfWork) Validate() bool {
	var hashInt big.Int

	data := pow.prepareData(pow.block.Nonce)
	hash := sha256.Sum256(data)
	hashInt.SetBytes(hash[:])

	isValid := hashInt.Cmp(pow.target) == -1

	return isValid
}
```

ここで先ほど保存したnonceが必要になります。

もう一度うまくいっているか確認してみましょう。

```go
func main() {
	...

	for _, block := range bc.blocks {
		...
		pow := NewProofOfWork(block)
		fmt.Printf("PoW: %s\n", strconv.FormatBool(pow.Validate()))
		fmt.Println()
	}
}
```

Output:

```bash
Prev. hash:
Data: Genesis Block
Hash: 00000093253acb814afb942e652a84a8f245069a67b5eaa709df8ac612075038
PoW: true

Prev. hash: 00000093253acb814afb942e652a84a8f245069a67b5eaa709df8ac612075038
Data: Send 1 BTC to Ivan
Hash: 0000003eeb3743ee42020e4a15262fd110a72823d804ce8e49643b5fd9d1062b
PoW: true

Prev. hash: 0000003eeb3743ee42020e4a15262fd110a72823d804ce8e49643b5fd9d1062b
Data: Send 2 more BTC to Ivan
Hash: 000000e42afddf57a3daa11b43b2e0923f23e894f96d1f24bfd9b8d2d494c57a
PoW: true
```

# Conclusion
ブロックの追加に労力が必要になり、私たちのブロックチェーンがまた一歩本格的な実装に近づきました。しかし、まだまだ不足している要素があります。データベースの一貫性、ウォレット、アドレス、トランザクションやコンセンサスメカニズムなどです。これらの要素は今後の記事で実装していきます。ひとまず、ハッピーマイニング！

