//ランダムでカラーを返す関数
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i=0; i<6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    //id="color"の要素にcolorを変更する
    document.getElementById("color").innerHTML = color;
    return color;
    }

//bodyの背景色を変更する関数
function changeColor() {
    var colorBg = getRandomColor();
    document.body.style.backgroundColor = colorBg;
    }

//クリップボードにコピーする関数
    function copyColor() {
  copyToClipboard(document.getElementById("color").innerHTML);
    }

    // テキストをクリップボードにコピーする関数
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('テキストがクリップボードにコピーされました: ', text);
        //id="copy"の要素にコピーされたことを表示する
        document.getElementById("copy").innerHTML = "コピーされました";
        //id="copy"の要素を1秒後に消す
        setTimeout(function(){
            document.getElementById("copy").innerHTML = "カラーコードコピー";
        },1000);
      })
      .catch((error) => {
        console.error('クリップボードへのコピーに失敗しました: ', error);
      });
  }
  
  
changeColor()