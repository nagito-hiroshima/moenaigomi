var buttonContainer = document.getElementById('button-container');
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

// 追加: アニメーション制御用の変数
var animationFrameId = null;
var animationPaused = false;

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

  // 背景色を指定（スプレッドシートの値をそのまま使う）
  if (content.backgroundColor) {
    button.style.backgroundColor = content.backgroundColor;
  }

  // 文字色を背景色に合わせて自動設定
  var bgForCalc = content.backgroundColor || window.getComputedStyle(button).backgroundColor || window.getComputedStyle(document.body).backgroundColor;
  var contrast = getContrastColor(bgForCalc);
  button.style.color = contrast;
  text.style.color = contrast;

  var buttonWidth = button.offsetWidth;
  var buttonHeight = button.offsetHeight;

  var overlapping = true;
  var maxAttempts = 100; // 最大試行回数
  var attempt = 0;

  //サイズ調整(倍率)
  var sizeMultiplier = 1.0;
  if (content.size) {
    var sizeValue = parseFloat(content.size);
    if (!isNaN(sizeValue) && sizeValue > 0) {
      sizeMultiplier = sizeValue;
    }
  }
  button.style.transform = 'scale(' + sizeMultiplier + ')';
  buttonWidth = buttonWidth * sizeMultiplier;
  buttonHeight = buttonHeight * sizeMultiplier;

  while (overlapping && attempt < maxAttempts) {
    overlapping = false;

    var randomX = Math.floor(Math.random() * (windowWidth - 400 - buttonWidth));
    var randomY = Math.floor(Math.random() * (windowHeight - 400 - buttonHeight));

    // 他のボタンとの重なりをチェック
    var buttons = document.getElementsByClassName('floating-button');
    for (var i = 0; i < buttons.length; i++) {
      var otherButton = buttons[i];
      var otherButtonRect = otherButton.getBoundingClientRect();

      if (
        randomX + buttonWidth + 200 > otherButtonRect.left &&
        randomX < otherButtonRect.right &&
        randomY + buttonHeight + 200 > otherButtonRect.top &&
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

    var speedX1 = button1.speedX || Math.floor((Math.random() * 1.5) + 1); // 速度のランダムな初期値
    var speedY1 = button1.speedY || Math.floor((Math.random() * 1.5) + 1); // 速度のランダムな初期値


    var newX1 = currentX1 + speedX1;
    var newY1 = currentY1 + speedY1;


    // 壁に当たったら速度を反転させる
    if (newX1 <= 0 || newX1 >= windowWidth - button1.offsetWidth) {
      speedX1 = -speedX1; newX1 = Math.min(newX1, windowWidth - button1.offsetWidth);
    }
    if (newY1 <= 0 || newY1 >= windowHeight - button1.offsetHeight) {
      speedY1 = -speedY1;
      newY1 = Math.min(newY1, windowHeight - button1.offsetHeight);
    }

    for (var j = 0; j < buttons.length; j++) {
      if (i !== j) {
        var button2 = buttons[j];
        if (checkCollision(button1, button2)) {
          var tempX = speedX1;
          var tempY = speedY1;
          speedX1 = button2.speedX;
          speedY1 = button2.speedY;
          button2.speedX = tempX;
          button2.speedY = tempY;

          newX1 = currentX1 + speedX1;
          newY1 = currentY1 + speedY1;

          break;
        }
      }
    }

    button1.style.left = newX1 + 'px';
    button1.style.top = newY1 + 'px';

    button1.speedX = speedX1;
    button1.speedY = speedY1;
  }

  // フレームIDを保持してキャンセル可能にする
  animationFrameId = requestAnimationFrame(animateButtons);
}

// 追加: アニメーション開始/停止制御関数（グローバル）
function startAnimation() {
  if (animationFrameId === null) {
    animationPaused = false;
    // 最初のフレームを開始
    animateButtons();
    // ポーズボタンが存在すれば見た目を再生中に更新
    var pb = document.getElementById('pause-btn');
    if (pb) {
      pb.textContent = '⏸';
      // 変更: 再生中は薄色（色を逆転）
      pb.style.background = 'rgba(81, 81, 81, 0.39)';
    }
  }
}
function stopAnimation() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    animationPaused = true;
    var pb = document.getElementById('pause-btn');
    if (pb) {
      pb.textContent = '▶';
      // 変更: 停止時はグラデーション（色を逆転）
      pb.style.background = 'linear-gradient(135deg,#7c5cff,#4b3bdb)';
    }
  }
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
  document.getElementById("stylesheet").href = "/z-src/" + stylesheetId + ".css";
}

// スプレッドシートからデータを取得する
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
        return key.replace("作品名", "text").replace("画像", "imageSrc").replace("背景色", "backgroundColor").replace("掲載先リンク", "url").replace("サイズ", "size");
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

      startAnimation();

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
  lis[i].addEventListener("click", function () {
    for (let i = 0; i < lis.length; i++) {
      lis[i].classList.remove("active");
      a[i].classList.remove("active-text");
    }
    this.classList.add("active");
    a[i].classList.add("active-text");
  });
}

(function createFloatingTextToggle() {
  var showText = false;

  function applyStateToButton(btn) {
    if (!btn || !btn.classList) return;
    if (showText) btn.classList.add('show-text');
    else btn.classList.remove('show-text');
  }

  // トグルボタンを作成
  var toggle = document.createElement('button');
  toggle.id = 'toggle-text-btn';
  toggle.title = 'ラベル表示切替 (C)';
  toggle.textContent = 'Aa';
  Object.assign(toggle.style, {
    position: 'fixed',
    right: '16px',
    top: '10px',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(81, 81, 81, 0.39)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10000,
    backdropFilter: 'blur(6px)'
  });

  toggle.addEventListener('click', function () {
    showText = !showText;
    var buttons = document.getElementsByClassName('floating-button');
    for (var i = 0; i < buttons.length; i++) applyStateToButton(buttons[i]);
    toggle.style.background = showText ? 'linear-gradient(135deg,#7c5cff,#4b3bdb)' : 'rgba(81, 81, 81, 0.39)';
  });

  document.body.appendChild(toggle);

  // ポーズ／再開ボタン（トグルの下に表示） — 初期は「再生中」見た目にする
  var pauseBtn = document.createElement('button');
  pauseBtn.id = 'pause-btn';
  pauseBtn.title = 'アニメーション一時停止 / 再開（スペースキー）';
  pauseBtn.textContent = '⏸';
  Object.assign(pauseBtn.style, {
    position: 'fixed',
    right: '16px',
    top: '58px',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(81, 81, 81, 0.39)', // 変更: 初期（再生中）は薄色に
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10000,
    backdropFilter: 'blur(6px)'
  });

  pauseBtn.addEventListener('click', function () {
    if (animationFrameId === null) {
      // 再開
      startAnimation();
    } else {
      // 一時停止
      stopAnimation();
    }
  });

  //スペースキーでもトグル可能に
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      if (animationFrameId === null) {
        // 再開
        startAnimation();
      } else {
        // 一時停止
        stopAnimation();
      }
    }else if(e.code==="KeyC"){
      // Cキーでテキスト表示切替
      toggle.click();
    } 
  });

  document.body.appendChild(pauseBtn);

  // 新しく追加されるボタンにも現在の状態を適用
  var container = document.getElementById('button-container') || document.body;
  var mo = new MutationObserver(function (muts) {
    muts.forEach(function (mut) {
      mut.addedNodes.forEach(function (node) {
        if (node && node.classList && node.classList.contains('floating-button')) {
          applyStateToButton(node);
        }
      });
    });
  });
  mo.observe(container, { childList: true, subtree: false });

})();

/**
 * 色文字列（#hex, rgb(), rgba(), named）をパースして [r,g,b] を返す。
 * DOM を一時的に使ってブラウザの色解釈を利用する（信頼性高め）。
 */
function parseToRGB(colorStr) {
  if (!colorStr) return '#000000';
  var d = document.createElement('div');
  d.style.color = colorStr;
  d.style.display = 'none';
  document.body.appendChild(d);
  var cs = getComputedStyle(d).color;
  document.body.removeChild(d);
  var m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  return '#000000';
}

/**
 * 相対輝度を計算し、背景色に応じて文字色を '#000000' または '#ffffff' を返す。
 */
function getContrastColor(colorStr) {
  var rgb = parseToRGB(colorStr);
  if (!rgb) return '#ffffff';
  // sRGB -> linear
  var srgb = rgb.map(function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  var lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  // 輝度が高ければ黒、低ければ白
  return lum > 0.5 ? '#000000' : '#ffffff';
}
