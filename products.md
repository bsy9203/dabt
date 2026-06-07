# 웹 아카이브 사이트 개발 및 기획 스펙 (Products Page)

본 문서는 상단 네비게이션과 `PRODUCTS` 메뉴 내의 인터랙티브 이미지 호버(Hover) 효과 구현을 위한 기술 스펙 및 기획 가이드라인입니다. 본 기획은 와이어프레임 특유의 미니멀하고 기하학적인 감성을 그대로 유지하는 웹 디자인을 목표로 합니다.

---

## 1. 디자인 톤앤매너 및 전역 레이아웃

* **디자인 콘셉트:** 실사 이미지를 사용하지 않고, 와이어프레임의 기하학적 도형(선, 면, 그레이톤 단색)과 미니멀한 레이아웃을 전면에 내세운 아방가르드한 감성을 그대로 유지합니다.
* **상단 메뉴 구성:** `HOME` / `STORY` / `PRODUCTS` / `ABOUT` (상단 고정 및 여백 최적화)
* **하단 푸터:** `© 2026 dabt. all rights reserved.` (우측 하단 고정)

---

## 2. PRODUCTS 페이지 인터랙션 스펙

`PRODUCTS` 메인 화면에는 3개의 대표 카테고리가 배치되며, 각 카테고리가 차지하는 **독립된 사각형 영역 내에서만** 호버 시 상세 레이아웃 변화가 일어납니다. 타 영역이나 메뉴를 침범하지 않고 지정된 그리드 안에서 컴포지션이 완성되는 구조입니다.

### 2.1 카테고리별 경계 영역 (Bounding Box) 및 호버 매핑
1. **(1) juice 영역 (왼쪽 상단 그리드)**
   * **기본 상태 (`products.png`):** 독립된 사각형 경계 내에 심플한 주스 썸네일 노출.
   * **호버 상태 (`products-3.png`):** 해당 사각형 박스 내부에서 가로형 바, 배경 면, '엽서' 원형 오브젝트 등의 상세 레이아웃이 페이드인(Fade-in) 됩니다.
2. **(2) spread 영역 (중앙 하단 그리드)**
   * **기본 상태 (`products.png`):** 독립된 사각형 경계 내에 심플한 스프레드 썸네일 노출.
   * **호버 상태 (`products-1.png`):** 해당 사각형 박스 내부에서 거대한 세로형 기둥 및 4개의 원형 오브젝트 조합이 나타납니다.
3. **(3) chips 영역 (우측 중앙 그리드)**
   * **기본 상태 (`products.png`):** 독립된 사각형 경계 내에 심플한 칩스 썸네일 노출.
   * **호버 상태 (`products-2.png`):** 해당 사각형 박스 내부에서 대각선 사각형들과 우측 하단 4분할 그리드가 나타납니다.

---

## 3. 웹 구현 코드 예시 (HTML / CSS)

각 카테고리의 영역을 `position: relative;`와 `overflow: hidden;`(필요 시 경계 제한을 위함)으로 묶어 독립된 컴포넌트로 관리하는 방식입니다.

### 3.1 HTML 구조
```html
<nav class="navbar">
  <div class="menu-item">HOME</div>
  <div class="menu-item">STORY</div>
  <div class="menu-item active">PRODUCTS</div>
  <div class="menu-item">ABOUT</div>
</nav>

<main class="products-grid-container">
  <div class="product-box juice-box">
    <div class="display-area">
      <img src="products-default-juice.png" class="img-default" alt="Juice Default">
      <img src="products-3.png" class="img-hover" alt="Juice Detailed">
    </div>
    <span class="label">(1) juice</span>
  </div>

  <div class="product-box spread-box">
    <div class="display-area">
      <img src="products-default-spread.png" class="img-default" alt="Spread Default">
      <img src="products-1.png" class="img-hover" alt="Spread Detailed">
    </div>
    <span class="label">(2) spread</span>
  </div>

  <div class="product-box chips-box">
    <div class="display-area">
      <img src="products-default-chips.png" class="img-default" alt="Chips Default">
      <img src="products-2.png" class="img-hover" alt="Chips Detailed">
    </div>
    <span class="label">(3) chips</span>
  </div>
</main>

<footer class="footer">
  © 2026 dabt. all rights reserved.
</footer>