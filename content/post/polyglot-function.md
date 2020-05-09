---
title: "PolyglotとGoogle Cloud Functionで形態素解析apiを作る"
date: 2019-03-21T00:11:18-07:00
banner: "img/google-cloud-functions.png"
narrowBanner: true
description: ""
images: ["img/google-cloud-functions.png"]
menu: ""
categories: ["programming"]
tags: ["polyglot", "python", "google-cloud-functions"]
showTOC: false
draft: false
---

現在大学の授業で行なっているプロジェクトで英語の文章を形態素に分割することがあったため、pythonの[polyglot](https://polyglot.readthedocs.io/en/latest/Installation.html)を使用し、ついでにgoogle cloud functionでベータ版として提供されている[pythonランタイム](https://cloud.google.com/functions/docs/concepts/python-runtime)で形態素解析apiを作成しました。

<!--more-->

## Polyglotとは

Polyglotは英語で多言語話者のことを指すのですが、pythonの[polyglot](https://polyglot.readthedocs.io/en/latest/Installation.html)はその名の通り多数の自然言語を処理するツールを提供するパッケージです。

Googleの[Cloud Natural Language Api](https://cloud.google.com/natural-language/)の構文解析のように文章を品詞分解してくれるパッケージはよくあるのですが、polyglotのように英語の文章を形態素に分解する機能があるものは珍しいのではないでしょうか。

:eye:形態素(英: morpheme)とは、言語学の用語で、意味をもつ表現要素の最小単位のことを指します。


### 形態素解析
Polyglotには様々な機能がありますが、今回は形態素解析だけを使用します。

例えば、以下のコードで"This is a sample text"というテキストを形態素に分解すると、

```python
from polyglot.text import Text, Word

text = "This is a sample text"
words = text.replace(",", "").split()

for w in words:
    word = Word(w, language="en")
    print(word.morphemes)
```

以下のように一つ一つの単語を形態素に分解した結果が得られます。

```text
['Thi', 's']
['is']
['a']
['s', 'ample']
['text']
```

## API作成

今回はこのpolyglotの機能をフロントのjavascriptで利用したかったため、google cloud functionのpythonランタイムでpolyglotを使って形態素解析apiを作成しブラウザからアクセスできるようにしました。

以下が作成したコードです。

```python
from polyglot.text import Text, Word
from polyglot.downloader import downloader
from flask import Flask, jsonify, request, Response
import simplejson as json

def parse_morpheme(request):
    request_json = request.get_json()
    response = Response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    try:
        if request.method == 'OPTIONS':
            headers = request.headers.get('Access-Control-Request-Headers')

            if headers:
                response.headers['Access-Control-Allow-Headers'] = headers
                response.status_code = 200
                return response

        if request_json and 'text' in request_json:
            downloader.download("morph2.en")
            text = request_json['text'].replace(" ", "")
            parsedText = Text(text)
            parsedText.language = "en"
            response.set_data(json.dumps({ "result": parsedText.morphemes }))
            response.status_code = 200
            return response

        else:
            response.set_data(json.dumps({ "error": 'invalid request' }))
            response.status_code = 400
            return response

    except:
        response.set_data(json.dumps({ "error": 'internal server error' }))
        response.status_code = 500
        return response

```

以下のrequest methodが`OPTIONS`か判定するブロックで、CORSに対応しています。

```python
if request.method == 'OPTIONS':
  headers = request.headers.get('Access-Control-Request-Headers')

  if headers:
    response.headers['Access-Control-Allow-Headers'] = headers
    response.status_code = 200
    return response
```

### テスト

書いた関数を毎度デプロイしてテストするのも時間がかかるので、以下のようにflaskを使用してlocalで先ほど定義した`parse_morpheme`関数をテストします。

```python
from flask import Flask, jsonify, request, Response
from main import parse_morpheme

if __name__ == "__main__":
    app = Flask(__name__)

    @app.route('/', methods=['POST'])
    def index():
        return parse_morpheme(request)

    app.run('127.0.0.1', 8000, debug=True)
```

上のコードを`python`コマンドで実行し、"this is an apple"をデータに`http://127.0.0.1:8000/`へPOSTリクエストを送信すると、

```bash
curl -X POST --data '{"text":"this is an apple" }' -H "Content-Type: application/json" http://127.0.0.1:8000/ | jq .
```

以下のように結果が返ってきました。良さそうですね。

```json
{
  "result": [
    "th",
    "is",
    "is",
    "an",
    "apple"
  ]
}
```

#### 参考記事
{{< web-embed url="https://stackoverflow.com/a/53700497" >}}

### デプロイ

`parse_morpheme`関数を以下のコマンドでgcpにデプロイします。

```bash
gcloud functions deploy parse_morpheme --runtime python37 --trigger-http
```

### 結果

試しに、"this is an apple"というテキストをparseしてみると、

```bash
curl -X POST --data '{"text":"thisisanapple" }' -H "Content-Type: application/json" https:cloud-functions-endpoint/parse_morpheme | jq .
```

```json
{
  "result": [
    "th",
    "is",
    "is",
    "an",
    "apple"
  ]
}
```

とリスポンスが返ってきました。うまく行ってそう。

## 感想
普段cloud functionはjavascriptで書いてますが、pythonの方が数倍楽に書ける気がしました。同期処理がdefaultの言語は直感的で良いですね。

