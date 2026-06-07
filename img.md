# 기능 명세서: 스크롤 구동형 이미지 시퀀스 및 레이어 애니메이션
**Target Project:** Ayocin (Atmos Lamp) Showcase
**Focus Feature:** Scroll-Driven Image Interaction (스크롤 이미지 기능)

---

## 1. 핵심 시각 기능 정의 (Functional Overview)
이 페이지의 핵심 이미지 인터렉션은 단순히 이미지가 위아래로 움직이는 것이 아니라, **"스크롤 진행도(Progress)에 따라 제품의 시각적 상태가 유기적으로 변하는 효과"**입니다. 크게 두 가지 기법이 결합되어 있습니다.

1. **고정 핀(Pinning) 및 레이어 분리 (Exploded View):** * 특정 섹션에 도달하면 화면이 스크롤되더라도 뷰포트에 고정(`pin`)됩니다.
   * 스크롤을 더 내릴 때마다 제품의 단면 이미지(First Layer, Second Layer 등)가 z축 또는 y축으로 분리되면서 내부 구조를 보여줍니다.
2. **스크롤 기반 매핑 (Scroll Scrubbing):**
   * 스크롤 속도와 마우스 휠의 관성이 이미지 애니메이션의 프레임 속도와 1:1로 부드럽게 동기화됩니다.

---

## 2. 구현 가이드라인 & 메커니즘

###A. 레이어 셋업 구조 (HTML/CSS)
* 겹쳐서 연출되어야 하는 이미지들은 하나의 부모 컨테이너(`sticky-viewport`) 안에서 `position: absolute`로 절대 좌표 정렬되어야 합니다.
* 이미지가 깨지거나 흐려지는 것을 방지하기 위해 `will-change: transform, opacity` 속성을 사전에 부여하여 하드웨어 가속을 유도합니다.

### B. 부드러운 스크롤 (Smoothing)
* 오비스(Obys) 에이전시 특유의 묵직하고 부드러운 이미지 트랜지션을 구현하려면 가속도 기반의 가상 스크롤(Lerp/Smooth Scroll) 라이브러리가 필수적입니다. 본 가이드에서는 `Lenis`를 기준으로 합니다.

---

## 3. 참조 소스 코드 (Implementation Code)

### [HTML] 이미지 레이어 구조
```html
<div class="scroll-container">
  <section class="image-sequence-section" id="lamp-scene">
    <div class="sticky-viewport">
      
      <div class="image-layer layer-base">
        <img src="lamp-core.jpg" alt="Lamp Core Base">
      </div>
      
      <div class="image-layer layer-second" data-depth="1.5">
        <img src="lamp-second-layer.png" alt="Internal Structure View">
        <span class="label">SECOND LAYER</span>
      </div>
      
      <div class="image-layer layer-first" data-depth="2.5">
        <img src="lamp-first-layer.png" alt="Outer Shell Layer">
        <span class="label">FIRST LAYER</span>
      </div>

    </div>
  </section>
</div>