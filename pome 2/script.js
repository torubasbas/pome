// ==================================================
// ★★★★★ 重要 ★★★★★
// GASをデプロイして取得したWebアプリのURLをここに貼り付ける
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWZd4iQQg1tdo2WiJaN--T7WNHIJE6Ff-7Zq1SBIDSGKlsiCzsivSOs3oqRbakzyL1Wg/exec";
// ==================================================


// --- AOS(アニメーションライブラリ)の初期化 ---
AOS.init({
  once: true,
  duration: 600,
});


// --- DOM要素の取得 ---
const fixedSection = document.getElementById("fixed-section");
const fixedContainer = document.getElementById("fixed");
const fixedLoader = document.getElementById("fixed-loader");
const resultsContainer = document.getElementById("results");
const searchLoader = document.getElementById("loader");
const noresults = document.getElementById("noresults");
const keywordInput = document.getElementById("keyword");


// --- 関数定義 ---

/**
 * プレゼントデータからHTMLカード要素を生成する
 * @param {object} item - プレゼントのデータ
 * @returns {HTMLElement} - 生成されたカードのdiv要素
 */
function createCard(item) {
  const card = document.createElement("div");
  // ★ 修正: CSSで指定したクラス名 "result-item" に変更
  card.className = "result-item"; 
  card.setAttribute("data-aos", "fade-up");
  
  // limitTextはサンプルのHTMLにはなかったので、ご自身のカードデザインに合わせて調整してください
  const limitText = item.limit ? `<p class="limit">📅 配布期限: ${item.limit}</p>` : '';
  const titleText = item.desc ? `<h3>${item.desc}</h3>` : ''; // descをh3として表示する例
  
  // 前回のHTML提案に合わせたカード構造の例
  card.innerHTML = `
    <img src="${item.img}" alt="プレゼントのサムネイル" loading="lazy">
    ${titleText}
    ${limitText}
    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="button">受け取る</a>
  `;
  return card;
}


/**
 * 取得したデータを画面に表示する
 * @param {object} data - GASから受け取ったデータ (fixedとnormalの配列を含む)
 */
function displayAllResults(data) {
  // ローダーを全て非表示に
  fixedLoader.style.display = "none";
  searchLoader.style.display = "none";
  
  // 固定プレゼントの処理
  if (data && data.fixed && data.fixed.length > 0) {
    fixedContainer.innerHTML = "";
    data.fixed.forEach(item => fixedContainer.appendChild(createCard(item)));
    // ★ 修正: "grid" から "flex" に変更してFlexboxレイアウトを適用
    fixedContainer.style.display = "flex"; 
    fixedSection.style.display = "block";
  } else {
    fixedSection.style.display = "none";
  }

  // 通常プレゼントの処理
  if (data && data.normal && data.normal.length > 0) {
    noresults.style.display = "none";
    resultsContainer.innerHTML = "";
    data.normal.forEach(item => resultsContainer.appendChild(createCard(item)));
  } else {
    // 検索キーワードがあるのに結果が0件の場合のみ「見つからない」を表示
    if (keywordInput.value) {
      resultsContainer.innerHTML = "";
      noresults.style.display = "block";
    }
  }

  AOS.refresh();
}


/**
 * 検索を実行する
 */
function search() {
  const keyword = keywordInput.value.trim();
  // 検索キーワードが空なら何もしない
  if (!keyword) {
    // キーワードが空の場合は全件表示に戻す（固定＋通常）
    window.dispatchEvent(new Event('load'));
    return;
  }


  searchLoader.style.display = "block";
  resultsContainer.innerHTML = "";
  noresults.style.display = "none";
  fixedSection.style.display = "none"; // 検索中は固定プレゼントを非表示に
  
  // fetchを使ってGASのAPIにデータをリクエスト
  fetch(`${GAS_API_URL}?keyword=${encodeURIComponent(keyword)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 成功したらdisplayAllResultsを呼び出す (通常プレゼント部分だけが更新される)
      displayAllResults({ normal: data.normal }); // 通常検索なのでnormalだけ渡す
    })
    .catch(error => {
      console.error('Error fetching presents:', error);
      searchLoader.style.display = "none";
      alert("データの取得に失敗しました。時間をおいて再度お試しください。");
    });
}


// --- イベントリスナー ---

// ページ読み込み時の処理
window.addEventListener('load', () => {
  fixedLoader.style.display = "block";
  fixedSection.style.display = "block";
  searchLoader.style.display = "block"; // ローダーを両方表示
  resultsContainer.innerHTML = "";
  keywordInput.value = ""; // 検索ボックスを空にする

  // まずは固定プレゼントと通常プレゼントの全件を取得するためにキーワード空でリクエスト
  fetch(`${GAS_API_URL}?keyword=`)
    .then(response => response.json())
    .then(data => {
      displayAllResults(data);
    })
    .catch(error => {
      console.error('Error fetching initial data:', error);
      fixedLoader.style.display = "none";
      searchLoader.style.display = "none";
      alert("データの取得に失敗しました。ページを再読み込みしてください。");
    });
});

// Enterキーでも検索できるように
keywordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    search();
  }
});
