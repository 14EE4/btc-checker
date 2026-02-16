const WALLET_ADDRESSES = [
    'bc1quy2ld2rrudtt098h9vkp9s2a6hrpfx6rlvkm8z',
    'bc1qkhmnqek2n33nd6rmylj08xnyp9z92taamjtnqw',
    'bc1q9dkww5c4tzhukdjl2m44kajzvr6p0pfhcz5pdr'
];
const checkBtn = document.getElementById('checkBtn');
const loadingDiv = document.getElementById('loading');
const resultsArea = document.getElementById('resultsArea');
const errorDiv = document.getElementById('errorMessage');

// 숫자 포맷팅 함수 (콤마 찍기)
function formatNumber(num, maximumFractionDigits = 0) {
    return num.toLocaleString(undefined, { maximumFractionDigits });
}

async function checkWallet() {
    const addresses = WALLET_ADDRESSES.filter(Boolean);
    console.log('checkWallet 시작:', addresses);

    if (addresses.length === 0) {
        showError('지갑 주소가 비어 있습니다. WALLET_ADDRESSES를 확인해주세요.');
        return;
    }

    // UI 초기화 상태로 설정 (존재할 때만 적용)
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (resultsArea) resultsArea.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (checkBtn) checkBtn.disabled = true;

    try {
        console.log('API 호출 시작...');
        const priceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,krw";

        const balanceRequests = addresses.map((address) =>
            fetch(`https://mempool.space/api/address/${address}`).then((res) => ({ address, res }))
        );

        const [balanceResults, priceRes] = await Promise.all([
            Promise.all(balanceRequests),
            fetch(priceUrl)
        ]);

        if (!priceRes.ok) {
            // 코인게코 무료 API는 요청 제한이 걸릴 수 있음
            throw new Error("시세 정보를 가져오는데 실패했습니다. (잠시 후 다시 시도해주세요)");
        }

        let sats = 0;
        for (const { address, res } of balanceResults) {
            if (!res.ok) {
                if (res.status === 400) throw new Error(`잘못된 주소 형식입니다: ${address}`);
                throw new Error(`지갑 정보를 찾을 수 없습니다: ${address}`);
            }

            const balanceData = await res.json();
            const chainStats = balanceData.chain_stats;
            sats += chainStats.funded_txo_sum - chainStats.spent_txo_sum;
        }

        const priceData = await priceRes.json();
        console.log('API 응답 수신:', { priceData, addressCount: addresses.length });

        const btc = sats / 100_000_000;

        // 시세 정보
        const rateUSD = priceData.bitcoin.usd;
        const rateKRW = priceData.bitcoin.krw;

        // 가치 계산
        const totalUSD = btc * rateUSD;
        const totalKRW = btc * rateKRW;

        // --- UI 업데이트 ---
        // QR 코드 이미지 설정 (로컬 파일 사용, 존재할 때만)
        const qrEl = document.getElementById('qrCode');
        if (qrEl) qrEl.src = 'bitcoin_qr_8x.png';

        const btcEl = document.getElementById('btcBalance');
        if (btcEl) btcEl.textContent = `${btc} BTC`;
        const satsEl = document.getElementById('satsBalance');
        if (satsEl) satsEl.textContent = `${formatNumber(sats)} sats`;

        const usdEl = document.getElementById('priceUSD');
        if (usdEl) usdEl.textContent = `$${formatNumber(rateUSD, 2)}`;
        const krwEl = document.getElementById('priceKRW');
        if (krwEl) krwEl.textContent = `₩${formatNumber(rateKRW)}`;

        const totalUsdEl = document.getElementById('totalUSD');
        if (totalUsdEl) totalUsdEl.textContent = `$${formatNumber(totalUSD, 2)}`;
        const totalKrwEl = document.getElementById('totalKRW');
        if (totalKrwEl) totalKrwEl.textContent = `${formatNumber(totalKRW)}`;

        // 결과창 표시 (존재할 때만)
        if (resultsArea) resultsArea.style.display = 'block';

    } catch (error) {
        console.error('에러 발생:', error);
        showError(error.message);
    } finally {
        // 로딩 종료 상태로 복구
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (checkBtn) checkBtn.disabled = false;
    }
}

function showError(message) {
    if (!errorDiv) return;
    errorDiv.textContent = `❌ 오류: ${message}`;
    errorDiv.style.display = 'block';
}

// 버튼 클릭 이벤트 리스너 (존재할 때만)
if (checkBtn) checkBtn.addEventListener('click', checkWallet);

// 페이지 로드 시 자동으로 조회
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 이벤트 발생');
    checkWallet();
});

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .catch((err) => console.error('Service Worker 등록 실패:', err));
    });
}
