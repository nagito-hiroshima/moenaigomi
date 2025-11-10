(function () {
    const overlay = document.getElementById('game-loading');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.getElementById('loading-text');
    const player = document.getElementById('player');

    let progress = 0;

    function setProgress(p) {
        progress = Math.min(100, Math.max(0, p));
        progressFill.style.width = progress + '%';
        const barRect = progressBar.getBoundingClientRect();
        const x = Math.max(0, Math.min(barRect.width, (barRect.width * (progress / 100))));
        player.style.left = `${x}px`;
        progressBar.setAttribute('aria-valuenow', String(Math.floor(progress)));
        loadingText.textContent = `LOADING ${Math.floor(progress)}%`;

        if (progress >= 100) {
            hideOverlay();
        }
    }

    function showOverlay() {
        overlay.style.display = 'flex';
        // allow CSS transition to run
        requestAnimationFrame(() => overlay.classList.remove('hidden'));
    }
    function hideOverlay() {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.style.display = 'none', 700);
    }

    // 簡易パーティクル背景（キャンバス）はそのまま動作
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (ctx) {
        function resize() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
        resize(); window.addEventListener('resize', resize);
        const particles = [];
        function spawn() {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + 6,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -(1 + Math.random() * 2),
                life: 60 + Math.random() * 80,
                size: 1 + Math.random() * 3,
                hue: 180 + Math.random() * 80
            });
        }
        for (let i = 0; i < 40; i++) spawn();
        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life--;
                ctx.fillStyle = `hsla(${p.hue},85%,60%,${Math.max(0, p.life / 120)})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                if (p.life <= 0 || p.y < -20) particles.splice(i, 1);
            }
            if (particles.length < 70 && Math.random() < 0.5) spawn();
            requestAnimationFrame(update);
        }
        update();
    }

    // 初期表示はオーバーレイを表示（必要ならページ側で hide() してください）
    showOverlay();
    setProgress(0);

    // 簡易ログ機能（下部に表示）
    const rogueEl = document.getElementById('rogue-log');
    function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function addLog(text) {
        if (!rogueEl) return;
        const t = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.className = 'line';
        div.innerHTML = `<span class="time">${t}</span>${escapeHtml(text)}`;
        rogueEl.appendChild(div);
        // 古い行を削る（最大200行）
        while (rogueEl.children.length > 200) rogueEl.removeChild(rogueEl.firstChild);
        rogueEl.scrollTop = rogueEl.scrollHeight;
    }

    // ログ表示はオーバーレイ表示/非表示時にも使える
    const prevShow = showOverlay;
    showOverlay = function () {
        prevShow();
        if (rogueEl) rogueEl.classList.remove('hidden'); // ログを表示
        addLog('Loading screen shown');
    };
    const prevHide = hideOverlay;
    hideOverlay = function () {
        // ログを記録してから非表示にする
        addLog('Loading screen hidden');
        if (rogueEl) rogueEl.classList.add('hidden'); // ログを非表示
        prevHide();
    };

    // 外部から関数で制御できるように公開
    window.__moenaigomi_loading = {
        show: showOverlay,           // ローディング画面を表示
        hide: hideOverlay,           // ローディング画面を非表示（フェードあり）
        set: (p) => setProgress(p),   // 進捗を0-100で設定
        inc: (d = 1) => setProgress(progress + d), // 進捗を増やす
        reset: () => setProgress(0),  // 0%にリセット（表示は維持）
        finish: () => setProgress(100),// 100%にする（自動で閉じる）
        isRunning: () => running,     // 実行中か
        getProgress: () => Math.floor(progress),
        // roguelike風ログ操作
        log: (msg) => { addLog(msg); },
        clearLog: () => { if (rogueEl) rogueEl.innerHTML = ''; }
    };
})();