// ==================================================
// ★★★★★ 重要 ★★★★★
// GASをデプロイして取得したWebアプリのURLをここに貼り付ける
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxJzHptKebMlaNeO-U7xiXF3UyEYaWzgp_dUfj3bKGcURRMZHJc9HglXonKGcsW_PELLA/exec";
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
  card.className = "card";
  card.setAttribute("data-aos", "fade-up");
  
  const limitText = item.limit ? `<p class="limit">📅 配布期限: ${item.limit}</p>` : '';
  
  card.innerHTML = `
    <img src="${item.img}" alt="プレゼントのサムネイル" loading="lazy">
    <div class="card-content">
      <p class="desc">${item.desc}</p>
      ${limitText}
    </div>
    <div class="card-action">
      <a href="${item.url}" target="_blank" rel="noopener noreferrer">受け取る</a>
    </div>
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
    fixedContainer.style.display = "grid";
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
  if (!keyword) return;

  searchLoader.style.display = "block";
  resultsContainer.innerHTML = "";
  noresults.style.display = "none";
  
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

  // まずは固定プレゼントだけを取得するためにキーワード空でリクエスト
  fetch(`${GAS_API_URL}?keyword=`)
    .then(response => response.json())
    .then(data => {
      displayAllResults(data);
    })
    .catch(error => {
      console.error('Error fetching initial data:', error);
      fixedLoader.style.display = "none";
      // ここでエラー表示をしても良い
    });
});

// Enterキーでも検索できるように
keywordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    search();
  }
});

