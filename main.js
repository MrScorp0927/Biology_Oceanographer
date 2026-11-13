/**
 * ==========================================================================
 * ОКЕАНОЛОГ — ИССЛЕДОВАТЕЛЬ МИРОВОГО ОКЕАНА
 * Чистый интерактивный скрипт (Vanilla JavaScript)
 * Фоновый сонар на Canvas, фильтрация карточек, табы зарплат и мини-тест
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initRadarCanvas();
  initHeaderAndNav();
  initActivitiesFilter();
  initSalaryTabs();
  initQuiz();
  initBackToTop();
});

/* ==========================================================================
   1. АТМОСФЕРНЫЙ ГИДРОЛОКАТОР (RADAR CANVAS)
   Мягкие концентрические кольца, плавно вращающийся луч и затухающие блипы
   ========================================================================== */
function initRadarCanvas() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let centerX, centerY, maxRadius;
  let sweepAngle = 0;

  // Эхо-метки на гидролокаторе
  const radarBlips = [
    { angle: 0.95, dist: 0.42, size: 4, alpha: 0 },
    { angle: 1.60, dist: 0.68, size: 6, alpha: 0 },
    { angle: 2.75, dist: 0.54, size: 4.5, alpha: 0 },
    { angle: 4.20, dist: 0.76, size: 7, alpha: 0 },
    { angle: 5.30, dist: 0.38, size: 4, alpha: 0 }
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    centerX = width * 0.5;
    centerY = height * 0.42;
    maxRadius = Math.min(width, height) * 0.45;
  }

  window.addEventListener('resize', resize);
  resize();

  function renderRadar() {
    ctx.clearRect(0, 0, width, height);

    // 1. Концентрические кольца дальности
    const ringCount = 4;
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 1; i <= ringCount; i++) {
      const r = (maxRadius / ringCount) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Мягкая отметка дальности в метрах
      ctx.fillStyle = 'rgba(20, 184, 166, 0.22)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${i * 1000} м`, centerX + 6, centerY - r + 12);
    }

    // 2. Осевые линии сетки
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();

    // 3. Сканирующий луч сонара с мягким градиентным шлейфом
    const trailSpan = 0.5;
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const a1 = sweepAngle - (trailSpan * (i / steps));
      const a2 = sweepAngle - (trailSpan * ((i + 1) / steps));
      const alpha = (1 - (i / steps)) * 0.12;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, a2, a1);
      ctx.closePath();
      ctx.fillStyle = `rgba(20, 184, 166, ${alpha})`;
      ctx.fill();
    }

    // Линия луча
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(sweepAngle) * maxRadius, centerY + Math.sin(sweepAngle) * maxRadius);
    ctx.stroke();

    // 4. Отрисовка эхо-блипов
    radarBlips.forEach(blip => {
      let diff = (sweepAngle - blip.angle) % (Math.PI * 2);
      if (diff < 0) diff += Math.PI * 2;

      if (diff < 0.08) {
        blip.alpha = 1.0;
      }

      if (blip.alpha > 0) {
        blip.alpha -= 0.006;
        if (blip.alpha < 0) blip.alpha = 0;
      }

      if (blip.alpha > 0.04) {
        const bx = centerX + Math.cos(blip.angle) * (maxRadius * blip.dist);
        const by = centerY + Math.sin(blip.angle) * (maxRadius * blip.dist);

        ctx.beginPath();
        ctx.arc(bx, by, blip.size * blip.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20, 184, 166, ${blip.alpha * 0.9})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(20, 184, 166, 0.7)';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(bx, by, (blip.size + 6) * (1 - blip.alpha * 0.5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(229, 169, 60, ${blip.alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Скорость вращения
    sweepAngle += 0.015;
    if (sweepAngle >= Math.PI * 2) {
      sweepAngle = 0;
    }

    requestAnimationFrame(renderRadar);
  }

  renderRadar();
}

/* ==========================================================================
   2. ШАПКА, НАВИГАЦИЯ И МОБИЛЬНОЕ МЕНЮ
   ========================================================================== */
function initHeaderAndNav() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateActiveLink();
  }, { passive: true });

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', false);
      });
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', false);
      }
    });
  }

  function updateActiveLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(sec => {
      const secH = sec.offsetHeight;
      const secTop = sec.offsetTop - 120;
      const secId = sec.getAttribute('id');

      if (scrollY >= secTop && scrollY < secTop + secH) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${secId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }
}

/* ==========================================================================
   3. ФИЛЬТРАЦИЯ КАРТОЧЕК ДЕЯТЕЛЬНОСТИ
   ========================================================================== */
function initActivitiesFilter() {
  const filterBtns = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.activity-box');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCat = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');

        if (filterCat === 'all' || cat === filterCat) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 180);
        }
      });
    });
  });
}

/* ==========================================================================
   4. ВКЛАДКИ УРОВНЕЙ ЗАРПЛАТЫ
   ========================================================================== */
function initSalaryTabs() {
  const tabBtns = document.querySelectorAll('.salary-tab-btn');
  const tabPanels = document.querySelectorAll('.salary-card-panel');

  if (!tabBtns.length || !tabPanels.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

/* ==========================================================================
   5. ИНТЕРАКТИВНЫЙ МИНИ-ТЕСТ
   ========================================================================== */
function initQuiz() {
  const questions = [
    {
      question: "Что в исследованиях океана вдохновляет тебя сильнее всего?",
      options: [
        { text: "Жизнь морских обитателей: от планктона до кораллов, гигантских китов и глубоководных рыб.", type: "bio" },
        { text: "Морские походы на исследовательских судах, батискафы и подводная робототехника.", type: "expedition" },
        { text: "Океанические течения, динамика водных масс и их влияние на климат планеты.", type: "physics" },
        { text: "Защита экосистем морей, мониторинг чистоты воды и борьба с пластиковым загрязнением.", type: "eco" }
      ]
    },
    {
      question: "Как ты относишься к морским экспедициям на борту научного судна?",
      options: [
        { text: "С восторгом! Готов(а) проводить месяцы в открытом океане ради научной истины и открытий.", type: "expedition" },
        { text: "С удовольствием выйду в рейс для сбора биоматериала, но люблю и работу в уютной лаборатории.", type: "bio" },
        { text: "Интересуют береговые станции, спутниковый гидрологический мониторинг и математический анализ.", type: "physics" },
        { text: "Готов(а) работать в морских экспедициях при проведении экологических экспертиз и аудита.", type: "eco" }
      ]
    },
    {
      question: "Какие фундаментальные предметы вызывают у тебя наибольший интерес?",
      options: [
        { text: "Биология и генетика — всё, что связано с живыми клетками, флорой и фауной океана.", type: "bio" },
        { text: "География, навигация и информатика — картография, спутниковые приборы и робототехника.", type: "expedition" },
        { text: "Физика, гидродинамика и высшая математика — термодинамика течений и климатические модели.", type: "physics" },
        { text: "Химия и экология — качество воды, гидрохимия, токсикология и биогеохимические циклы.", type: "eco" }
      ]
    },
    {
      question: "Какое профессиональное свершение кажется тебе лучшим карьерным достижением?",
      options: [
        { text: "Описать новый вид глубоководных существ и разгадать секреты биолюминесценции морской фауны.", type: "bio" },
        { text: "Возглавить научный рейс в Арктику или погрузиться на дно океана в исследовательском батискафе.", type: "expedition" },
        { text: "Создать высокоточную модель динамики океанских течений для прогнозирования климата Земли.", type: "physics" },
        { text: "Разработать государственную программу сохранения коралловых рифов и очистки морской среды.", type: "eco" }
      ]
    }
  ];

  let currentIdx = 0;
  let userAnswers = [];
  let selectedType = null;

  const quizStep = document.getElementById('quizStep');
  const quizProgressFill = document.getElementById('quizProgressFill');
  const quizQuestionTitle = document.getElementById('quizQuestionTitle');
  const quizOptionsList = document.getElementById('quizOptionsList');
  const quizNextBtn = document.getElementById('quizNextBtn');
  const quizCardQuestion = document.getElementById('quizCardQuestion');
  const quizResultView = document.getElementById('quizResultView');
  const resultVerdictTitle = document.getElementById('resultVerdictTitle');
  const resultVerdictDesc = document.getElementById('resultVerdictDesc');
  const resultMatchPercentage = document.getElementById('resultMatchPercentage');
  const quizRestartBtn = document.getElementById('quizRestartBtn');

  if (!quizQuestionTitle || !quizOptionsList) return;

  function renderQ(idx) {
    const q = questions[idx];
    quizStep.textContent = `Вопрос ${idx + 1} из ${questions.length}`;
    quizProgressFill.style.width = `${((idx + 1) / questions.length) * 100}%`;
    quizQuestionTitle.textContent = q.question;

    quizOptionsList.innerHTML = '';
    selectedType = null;
    quizNextBtn.disabled = true;

    if (idx === questions.length - 1) {
      quizNextBtn.innerHTML = `Узнать результат <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    } else {
      quizNextBtn.innerHTML = `Следующий вопрос <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }

    const letters = ['А', 'Б', 'В', 'Г'];
    q.options.forEach((opt, oIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-btn';
      btn.innerHTML = `
        <span class="quiz-option-key">${letters[oIdx]}</span>
        <span>${opt.text}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedType = opt.type;
        quizNextBtn.disabled = false;
      });

      quizOptionsList.appendChild(btn);
    });
  }

  quizNextBtn.addEventListener('click', () => {
    if (!selectedType) return;
    userAnswers.push(selectedType);

    if (currentIdx < questions.length - 1) {
      currentIdx++;
      renderQ(currentIdx);
    } else {
      showVerdict();
    }
  });

  function showVerdict() {
    quizCardQuestion.style.display = 'none';
    quizResultView.style.display = 'block';

    const tally = { bio: 0, expedition: 0, physics: 0, eco: 0 };
    userAnswers.forEach(t => tally[t] = (tally[t] || 0) + 1);

    let top = 'bio';
    let max = -1;
    for (const [k, v] of Object.entries(tally)) {
      if (v > max) { max = v; top = k; }
    }

    let title = '';
    let desc = '';
    let score = '98%';

    if (top === 'bio') {
      title = 'Прирождённый биоокеанолог и исследователь морских организмов!';
      desc = 'Твоё призвание — изучение морской жизни, глубоководных видов и продуктивности морей. Программы «Биология» (профиль «Морская биология») в МГУ, СПбГУ или ДВФУ станут идеальной базой для твоих будущих научных открытий!';
      score = '98%';
    } else if (top === 'expedition') {
      title = 'Экспедиционный океанолог и покоритель глубин!';
      desc = 'Твой путь — открытый океан, исследовательский флот и пилотирование глубоководных аппаратов! Тебя ждут рейсы на судах РАН и управление батискафами. Океанологические программы РГГМУ, СПбГУ и ДВФУ открывают прямую дорогу к морю.';
      score = '96%';
    } else if (top === 'physics') {
      title = 'Океанолог-климатолог и физик морских стихий!';
      desc = 'Ты мыслишь глобальными масштабами! Движение водных масс, океанические течения (Гольфстрим, Куросио) и их роль в формировании климата Земли — твоя стихия. Профили «Океанология» и «Гидрометеорология» в МГУ и РГГМУ станут твоим стартом.';
      score = '95%';
    } else {
      title = 'Морской эколог и хранитель гидросферы!';
      desc = 'Твоя миссия — мониторинг чистоты акваторий, сохранение уникальных коралловых рифов и защита морей от антропогенного загрязнения. Специальности по морской экологии и рациональному природопользованию обеспечат карьеру в НИИ и заповедниках.';
      score = '97%';
    }

    resultVerdictTitle.textContent = title;
    resultVerdictDesc.textContent = desc;
    resultMatchPercentage.textContent = score;

    quizResultView.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (quizRestartBtn) {
    quizRestartBtn.addEventListener('click', () => {
      currentIdx = 0;
      userAnswers = [];
      selectedType = null;
      quizResultView.style.display = 'none';
      quizCardQuestion.style.display = 'block';
      renderQ(0);
    });
  }

  renderQ(0);
}

/* ==========================================================================
   6. КНОПКА «НАВЕРХ»
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
