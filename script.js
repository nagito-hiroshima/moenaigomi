var buttonContainer = document.getElementById('button-container');
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var buttonContents = getSpreadSheetData();

function createFloatingButton(content) {
  var button = document.createElement('button');
  button.classList.add('floating-button');

  var image = document.createElement('img');
  image.src = content.imageSrc;
  button.appendChild(image);

  var text = document.createElement('p');
  text.textContent = content.text;
  button.appendChild(text);

  button.style.backgroundColor = content.backgroundColor; // 背景色を指定

  var buttonWidth = button.offsetWidth;
  var buttonHeight = button.offsetHeight;

  var overlapping = true;
  var maxAttempts = 100; // 最大試行回数
  var attempt = 0;

  while (overlapping && attempt < maxAttempts) {
    overlapping = false;

    var randomX = Math.floor(Math.random() * (windowWidth-200 - buttonWidth));
    var randomY = Math.floor(Math.random() * (windowHeight-200 - buttonHeight));

    // 他のボタンとの重なりをチェック
    var buttons = document.getElementsByClassName('floating-button');
    for (var i = 0; i < buttons.length; i++) {
      var otherButton = buttons[i];
      var otherButtonRect = otherButton.getBoundingClientRect();

      if (
        randomX + buttonWidth+200 > otherButtonRect.left &&
        randomX < otherButtonRect.right &&
        randomY + buttonHeight+200 > otherButtonRect.top &&
        randomY < otherButtonRect.bottom
      ) {
        overlapping = true;
        break;
      }
    }

    attempt++;
  }

  if (!overlapping) {
    button.style.left = randomX + 'px';
    button.style.top = randomY + 'px';
  } else {
    console.log('Failed to position button without overlapping.'); // 重なりが解消できなかった場合にメッセージを表示
  }

  button.addEventListener('click', function () {
    window.open(content.url, '_blank');
  });

  buttonContainer.appendChild(button);
}




function animateButtons() {
  var buttons = document.getElementsByClassName('floating-button');

  for (var i = 0; i < buttons.length; i++) {
    var button1 = buttons[i];

    var currentX1 = parseInt(button1.style.left) || 0;
    var currentY1 = parseInt(button1.style.top) || 0;

    var speedX1 = button1.speedX || Math.floor((Math.random()*1.5)+1.5); // 速度のランダムな初期値
    var speedY1 = button1.speedY || Math.floor((Math.random()*1.5)+1.5) ; // 速度のランダムな初期値
    

    var newX1 = currentX1 + speedX1;
    var newY1 = currentY1 + speedY1;


// 壁に当たったら速度を反転させる
if (newX1 <= 0 || newX1 >= windowWidth - button1.offsetWidth) {
    speedX1 = -speedX1;    newX1 = Math.min(newX1, windowWidth - button1.offsetWidth); // X 座標が画面幅を超えないようにする
  }
  if (newY1 <= 0 || newY1 >= windowHeight - button1.offsetHeight) {
    speedY1 = -speedY1;
    newY1 = Math.min(newY1, windowHeight - button1.offsetHeight); // Y 座標が画面高さを超えないようにする
  }

   

    for (var j = 0; j < buttons.length; j++) {
      if (i !== j) {
        var button2 = buttons[j];
        if (checkCollision(button1, button2)) {
          // ボタン同士の位置と速度を交換する
          var tempX = speedX1;
          var tempY = speedY1;
          speedX1 = button2.speedX;
          speedY1 = button2.speedY;
          button2.speedX = tempX;
          button2.speedY = tempY;


          // 衝突後にボタン1の位置を更新する
          newX1 = currentX1 + speedX1;
          newY1 = currentY1 + speedY1;

          

          break; // 衝突が発生したらループを終了する
        }
      }
    }

    button1.style.left = newX1 + 'px';
    button1.style.top = newY1 + 'px';

    button1.speedX = speedX1;
    button1.speedY = speedY1;
  }

  requestAnimationFrame(animateButtons);
}

function checkCollision(element1, element2) {
  var rect1 = element1.getBoundingClientRect();
  var rect2 = element2.getBoundingClientRect();

  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}







function csschange(stylesheetId) {
  //hrefの値を変更する
  document.getElementById("stylesheet").href = "./"+stylesheetId+".css";
}
  

//スプレッドシートからデータを取得する
function getSpreadSheetData() {
    const url = "https://script.google.com/macros/s/AKfycbwJcyebutI6_tNCmV75O5FWMEqloMrPov62ShsT35D6CGOvacWuuwcAAW40pkxUGvBT/exec";
    fetch(url)
        .then((res) => {
        return res.json();
        })
        .then((data) => {
        console.log(data);
        //かえってきたオブジェクトのキーを変更
        const keys = Object.keys(data[0]);
        const newKeys = keys.map((key) => {
            return key.replace("作品名", "text").replace("画像", "imageSrc").replace("背景色", "backgroundColor").replace("掲載先リンク", "url");
        }
        );
        //オブジェクトのキーを変更
        const newData = data.map((d) => {
            const newObject = {};
            keys.forEach((key, index) => {
            newObject[newKeys[index]] = d[key];
            });
            return newObject;
        }
        );
        console.log(newData);

        for (var i = 0; i < newData.length; i++) {
            createFloatingButton(newData[i]);
          }
        
          animateButtons();
    
      })
      //エラーが発生した場合
        .catch((error) => {
        console.error("システムメンテナンス中");
        })
      ;
       
}

const lis = document.querySelectorAll("li");
const a = document.querySelectorAll("li a");

for (let i = 0; i < lis.length; i++) {
  lis[i].addEventListener("click", function() {
    for (let i = 0; i < lis.length; i++) {
      lis[i].classList.remove("active");
      a[i].classList.remove("active-text");
    }
    this.classList.add("active");
    a[i].classList.add("active-text");
  });
}
