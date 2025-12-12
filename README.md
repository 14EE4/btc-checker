# BTC Checker - 비트코인 지갑 조회기

## 설명
고정된 비트코인 지갑 주소의 잔액과 자산 가치를 실시간으로 확인할 수 있는 웹 애플리케이션입니다.

## 기능
- ✅ 비트코인 지갑 주소 조회
- ✅ 보유 BTC 및 Satoshi 표시
- ✅ 실시간 USD/KRW 시세 조회
- ✅ 자산 총 가치 계산 (USD/KRW)
- ✅ 다크 모드 인터페이스

## API
- **mempool.space** - 비트코인 지갑 정보
- **CoinGecko API** - 비트코인 가격 정보

## 사용법
1. `script.js` 파일의 `WALLET_ADDRESS` 변수에서 원하는 비트코인 주소로 변경
   ```javascript
   const WALLET_ADDRESS = 'bc1qkhmnqek2n33nd6rmylj08xnyp9z92taamjtnqw'; // 여기를 수정
   ```
2. 「조회」 버튼 클릭
3. 잔액과 자산 가치 확인