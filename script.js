const addressInput = document.getElementById('addressInput');
const checkBtn = document.getElementById('checkBtn');
const loadingDiv = document.getElementById('loading');
const resultsArea = document.getElementById('resultsArea');
const errorDiv = document.getElementById('errorMessage');

// 숫자 포맷팅 함수 (콤마 찍기)
function formatNumber(num, maximumFractionDigits = 0) {
    return num.toLocaleString(undefined, { maximumFractionDigits });
}

async function checkWallet() {
    const address = addressInput.value.trim();

    if (!address) {
        showError("주소를 입력해주세요.");
        return;
    }

    // UI 초기화 상태로 설정
    loadingDiv.style.display = 'block';
    resultsArea.style.display = 'none';
    errorDiv.style.display = 'none';
    checkBtn.disabled = true;

    try {
        // API URL 설정
        const balanceUrl = `https://mempool.space/api/address/${address}`;
        const priceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,krw";

        // 두 API 동시에 호출
        const [balanceRes, priceRes] = await Promise.all([
            fetch(balanceUrl),
            fetch(priceUrl)
        ]);

        // 에러 체크
        if (!balanceRes.ok) {
            if(balanceRes.status === 400) throw new Error("잘못된 주소 형식입니다.");
            throw new Error("지갑 정보를 찾을 수 없습니다. 주소를 확인해주세요.");
        }
        if (!priceRes.ok) {
            // 코인게코 무료 API는 요청 제한이 걸릴 수 있음
            throw new Error("시세 정보를 가져오는데 실패했습니다. (잠시 후 다시 시도해주세요)");
        }

        const balanceData = await balanceRes.json();
        const priceData = await priceRes.json();

        // --- 데이터 계산 ---
        // 확정된 잔액만 계산 (받은거 - 보낸거)
        const chainStats = balanceData.chain_stats;
        const sats = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
        const btc = sats / 100_000_000;

        // 시세 정보
        const rateUSD = priceData.bitcoin.usd;
        const rateKRW = priceData.bitcoin.krw;

        // 가치 계산
        const totalUSD = btc * rateUSD;
        const totalKRW = btc * rateKRW;

        // --- UI 업데이트 ---
        document.getElementById('btcBalance').textContent = `${btc} BTC`;
        document.getElementById('satsBalance').textContent = `${formatNumber(sats)} sats`;

        document.getElementById('priceUSD').textContent = `$${formatNumber(rateUSD, 2)}`;
        document.getElementById('priceKRW').textContent = `₩${formatNumber(rateKRW)}`;

        document.getElementById('totalUSD').textContent = `$${formatNumber(totalUSD, 2)}`;
        document.getElementById('totalKRW').textContent = `${formatNumber(totalKRW)}`;

        // 결과창 표시
        resultsArea.style.display = 'block';

    } catch (error) {
        showError(error.message);
    } finally {
        // 로딩 종료 상태로 복구
        loadingDiv.style.display = 'none';
        checkBtn.disabled = false;
    }
}

function showError(message) {
    errorDiv.textContent = `❌ 오류: ${message}`;
    errorDiv.style.display = 'block';
}

// 버튼 클릭 이벤트 리스너
checkBtn.addEventListener('click', checkWallet);

// 엔터키 입력 시 조회
addressInput.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') checkWallet();
});
