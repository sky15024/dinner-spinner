// ============================================
// 今晚吃什麼 — 文青轉盤
// ============================================

(() => {
    'use strict';

    // --- Soft pastel colors (low saturation, warm & bright) ---
    const SEGMENT_COLORS = [
        ['#fce8b2', '#f5dea0'], // 鵝黃
        ['#b8dff0', '#a5d2e8'], // 天空藍
        ['#f5c6d0', '#edb3bf'], // 淡粉
        ['#d4c4ed', '#c5b2e3'], // 薰衣草
        ['#b8e8cf', '#a3dfc0'], // 薄荷綠
        ['#fad4b8', '#f2c5a3'], // 蜜桃
        ['#c8e0b8', '#bbd8a8'], // 嫩葉綠
        ['#f0d4e8', '#e5c2dc'], // 淡紫粉
        ['#d8ecf0', '#c8e2e8'], // 水藍
        ['#f5e0c0', '#edd4ae'], // 奶油
        ['#d0e8e0', '#c0ddd2'], // 淡青
        ['#f0dcc8', '#e5d0b8'], // 杏仁
    ];

    const DEFAULT_OPTIONS = ['麥當勞', '牛排', '鐵板燒', '炒飯/炒麵', '滷味', '火鍋'];

    const PRESET_SETS = [
        ['壽司', '拉麵', '咖哩飯', '丼飯', '居酒屋', '日式定食'],
        ['滷肉飯', '牛肉麵', '小籠包', '鹹酥雞', '便當', '水餃'],
        ['披薩', '義大利麵', '漢堡', '泰式料理', '韓式烤肉', '越南河粉'],
        ['自己煮', '叫外送', '出去吃', '吃泡麵', '吃水果', '不吃了'],
    ];

    // --- State ---
    let options = [];
    let isSpinning = false;
    let currentRotation = 0;

    // --- DOM Elements ---
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const optionInput = document.getElementById('optionInput');
    const addBtn = document.getElementById('addBtn');
    const optionsList = document.getElementById('optionsList');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const presetBtn = document.getElementById('presetBtn');
    const resultModal = document.getElementById('resultModal');
    const resultText = document.getElementById('resultText');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');

    // --- Canvas sizing ---
    let wheelSize = 420;
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
        // Use document.documentElement.clientWidth to avoid circular parent-width calculation which overflows on mobile
        const viewportW = document.documentElement.clientWidth;
        const padding = viewportW <= 480 ? 32 : 40; // 16px padding on each side for mobile
        const maxW = Math.min(viewportW - padding, 420);
        wheelSize = maxW;

        canvas.style.width = wheelSize + 'px';
        canvas.style.height = wheelSize + 'px';
        canvas.width = wheelSize * dpr;
        canvas.height = wheelSize * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;

        drawWheel();
    }

    // --- Persistence ---
    function saveOptions() {
        localStorage.setItem('dinnerSpinner_options', JSON.stringify(options));
    }

    function loadOptions() {
        options = [...DEFAULT_OPTIONS];
    }

    // --- Draw Wheel ---
    function drawWheel() {
        const cx = wheelSize / 2;
        const cy = wheelSize / 2;
        const radius = wheelSize / 2 - 14;

        ctx.clearRect(0, 0, wheelSize, wheelSize);

        if (options.length === 0) {
            // Empty state
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ede6d8';
            ctx.fill();
            ctx.strokeStyle = 'rgba(160, 140, 110, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#a89e8c';
            ctx.font = `700 ${wheelSize * 0.035}px "Noto Sans TC", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('請新增選項開始使用', cx, cy);
            return;
        }

        const segAngle = (Math.PI * 2) / options.length;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(currentRotation);

        options.forEach((opt, i) => {
            const startAngle = i * segAngle;
            const endAngle = startAngle + segAngle;
            const colors = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

            // Segment fill — soft pastel gradient
            const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Segment border — soft white dividers
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Text
            ctx.save();
            const textAngle = startAngle + segAngle / 2;
            ctx.rotate(textAngle);

            const textRadius = radius * 0.6;
            const maxFontSize = Math.min(segAngle * radius * 0.2, 17);
            const fontSize = Math.max(11, maxFontSize);

            ctx.fillStyle = '#5c4a35';
            ctx.font = `900 ${fontSize}px "Noto Sans TC", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Truncate text
            let displayText = opt;
            const maxWidth = radius * 0.42;
            while (ctx.measureText(displayText).width > maxWidth && displayText.length > 1) {
                displayText = displayText.slice(0, -1);
            }
            if (displayText !== opt) displayText += '…';

            ctx.fillText(displayText, textRadius, 0);
            ctx.restore();
        });

        // Outer ring — soft warm border
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180, 165, 140, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180, 165, 140, 0.12)';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Inner decorative circle
        ctx.beginPath();
        ctx.arc(0, 0, 33, 0, Math.PI * 2);
        ctx.fillStyle = '#eef3e8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 140, 80, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small tick marks
        for (let i = 0; i < options.length; i++) {
            const angle = i * segAngle;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(radius - 8, 0);
            ctx.lineTo(radius, 0);
            ctx.strokeStyle = 'rgba(180, 165, 140, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    // --- Spin Logic ---
    function spin() {
        if (isSpinning || options.length < 2) {
            if (options.length < 2) {
                shakeInput();
            }
            return;
        }

        isSpinning = true;
        spinBtn.classList.add('spinning');

        const extraRotations = 5 + Math.random() * 5;
        const randomAngle = Math.random() * Math.PI * 2;
        const totalSpin = extraRotations * Math.PI * 2 + randomAngle;
        const targetRotation = currentRotation + totalSpin;

        const duration = 4500 + Math.random() * 1500;
        const startTime = performance.now();
        const startRotation = currentRotation;

        let lastTickSegment = -1;

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth deceleration easing
            const eased = 1 - Math.pow(1 - progress, 4);
            currentRotation = startRotation + totalSpin * eased;

            // Tick on segment change
            if (options.length > 0) {
                const segAngle = (Math.PI * 2) / options.length;
                const normalizedAngle = ((Math.PI * 2 - (currentRotation % (Math.PI * 2))) + Math.PI * 2) % (Math.PI * 2);
                const currentSeg = Math.floor(normalizedAngle / segAngle) % options.length;
                if (currentSeg !== lastTickSegment) {
                    lastTickSegment = currentSeg;
                    const pointer = document.querySelector('.wheel-pointer');
                    pointer.style.transform = 'translateX(-50%) scale(1.25)';
                    setTimeout(() => {
                        pointer.style.transform = 'translateX(-50%) scale(1)';
                    }, 50);
                }
            }

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Determine winner
                const segAngle = (Math.PI * 2) / options.length;
                const normalizedAngle = ((Math.PI * 2 - (currentRotation % (Math.PI * 2))) + Math.PI * 2) % (Math.PI * 2);
                const pointerAngle = (normalizedAngle + Math.PI * 1.5) % (Math.PI * 2);
                const winnerIndex = Math.floor(pointerAngle / segAngle) % options.length;
                const winner = options[winnerIndex];

                isSpinning = false;
                spinBtn.classList.remove('spinning');

                setTimeout(() => {
                    showResult(winner);
                }, 350);
            }
        }

        requestAnimationFrame(animate);
    }

    function shakeInput() {
        optionInput.style.animation = 'none';
        optionInput.offsetHeight;
        optionInput.style.animation = 'shake 0.4s ease';
        optionInput.style.borderColor = '#b06b4f';
        setTimeout(() => {
            optionInput.style.borderColor = '';
            optionInput.style.animation = '';
        }, 600);
    }

    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // --- Result Modal ---
    function showResult(text) {
        resultText.textContent = text;
        resultModal.classList.add('active');
        launchConfetti();
    }

    function closeModal() {
        resultModal.classList.remove('active');
    }

    // --- Confetti (warm tones) ---
    let confettiPieces = [];
    let confettiAnimating = false;

    function launchConfetti() {
        confettiPieces = [];
        const colors = ['#fce8b2', '#b8dff0', '#f5c6d0', '#d4c4ed', '#b8e8cf', '#fad4b8', '#c8e0b8', '#f0d4e8'];

        for (let i = 0; i < 100; i++) {
            confettiPieces.push({
                x: Math.random() * confettiCanvas.width,
                y: -20 - Math.random() * 180,
                w: 5 + Math.random() * 5,
                h: 3 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 3,
                vy: 1.5 + Math.random() * 3,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 6,
                opacity: 0.85,
            });
        }

        if (!confettiAnimating) {
            confettiAnimating = true;
            animateConfetti();
        }
    }

    function animateConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        let alive = 0;
        confettiPieces.forEach(p => {
            if (p.opacity <= 0) return;
            alive++;

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06;
            p.rotation += p.rotSpeed;

            if (p.y > confettiCanvas.height + 20) {
                p.opacity = 0;
                return;
            }

            if (p.y > confettiCanvas.height - 120) {
                p.opacity = Math.max(0, p.opacity - 0.015);
            }

            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate((p.rotation * Math.PI) / 180);
            confettiCtx.globalAlpha = p.opacity;
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            confettiCtx.restore();
        });

        if (alive > 0) {
            requestAnimationFrame(animateConfetti);
        } else {
            confettiAnimating = false;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // --- Option Management ---
    function addOption(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        if (options.length >= 20) {
            alert('最多只能新增 20 個選項喔！');
            return;
        }
        if (options.includes(trimmed)) {
            shakeInput();
            return;
        }
        options.push(trimmed);
        saveOptions();
        renderOptions();
        drawWheel();
    }

    function removeOption(index) {
        options.splice(index, 1);
        saveOptions();
        renderOptions();
        drawWheel();
    }

    function clearOptions() {
        if (options.length === 0) return;
        options = [];
        saveOptions();
        renderOptions();
        drawWheel();
    }

    function loadPreset() {
        const set = PRESET_SETS[Math.floor(Math.random() * PRESET_SETS.length)];
        options = [...set];
        saveOptions();
        renderOptions();
        drawWheel();
    }

    function renderOptions() {
        optionsList.innerHTML = '';

        if (options.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = '尚無任何選項，新增幾個心儀的餐廳吧⋯';
            optionsList.appendChild(empty);
            return;
        }

        options.forEach((opt, i) => {
            const tag = document.createElement('div');
            tag.className = 'option-tag';
            tag.style.animationDelay = `${i * 0.04}s`;

            const colorDot = document.createElement('span');
            colorDot.className = 'tag-color';
            const colors = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            colorDot.style.background = colors[0];

            const label = document.createElement('span');
            label.textContent = opt;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'tag-remove';
            removeBtn.innerHTML = '✕';
            removeBtn.setAttribute('aria-label', `移除 ${opt}`);
            removeBtn.addEventListener('click', () => removeOption(i));

            tag.appendChild(colorDot);
            tag.appendChild(label);
            tag.appendChild(removeBtn);
            optionsList.appendChild(tag);
        });
    }

    // --- Event Listeners ---
    spinBtn.addEventListener('click', spin);

    addBtn.addEventListener('click', () => {
        addOption(optionInput.value);
        optionInput.value = '';
        optionInput.focus();
    });

    optionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addOption(optionInput.value);
            optionInput.value = '';
        }
    });

    clearAllBtn.addEventListener('click', clearOptions);
    presetBtn.addEventListener('click', loadPreset);
    modalCloseBtn.addEventListener('click', closeModal);

    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    window.addEventListener('resize', () => {
        dpr = window.devicePixelRatio || 1;
        resizeCanvas();
    });

    // --- Init ---
    loadOptions();
    renderOptions();
    resizeCanvas();
})();
