(function () {
    const popup = document.getElementById('explain-popup');
    const closeBtn = document.getElementById('explain-close');
    const desktopViewport = window.matchMedia('(min-width: 521px)');
    const INACTIVITY = 2500;
    let timer = null;
    let visible = false;

    function showPopup() {
        popup.classList.add('show');
        popup.setAttribute('aria-hidden', 'false');
        visible = true;
    }
    function hidePopup() {
        popup.classList.remove('show');
        popup.setAttribute('aria-hidden', 'true');
        visible = false;
    }
    function resetTimer() {
        clearTimeout(timer);
        if (!desktopViewport.matches) {
            hidePopup();
            return;
        }
        timer = setTimeout(showPopup, INACTIVITY);
    }

    // 初期タイマー開始
    resetTimer();

    // 活動を検知したらタイマーをリセット、表示中なら非表示にする
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => {
        document.addEventListener(evt, (e) => {
            resetTimer();
            if (visible) hidePopup();
        }, { passive: true });
    });

    closeBtn.addEventListener('click', () => { hidePopup(); resetTimer(); });
    desktopViewport.addEventListener('change', resetTimer);

})();
