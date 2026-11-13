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
   5. ИНТЕРАКТИВНЫЙ МИНИ-ТЕСТ (15 ВОПРОСОВ)
   ========================================================================== */
function initQuiz() {
  const questions = [
    {
      question: "1. Что в изучении океана вызывает у тебя наибольший исследовательский интерес?",
      options: [
        { text: "Многообразие морских обитателей: от планктона и кораллов до китов и глубоководных рыб.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Морские экспедиции на научно-исследовательских судах, батискафы и подводные дроны.", fit: 4, type: "expedition", scores: { field: 3, bio: 1, analytical: 2 } },
        { text: "Океанические течения, динамика водных масс и их ключевое влияние на глобальный климат.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Океан интересен скорее как фон для пляжного отдыха, а наука о нём кажется слишком сложной.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "2. Готов(а) ли ты провести от 1 до 3 месяцев в рейсе на судне вдали от дома и привычного комфорта?",
      options: [
        { text: "Да, это мечта! Романтика океанских просторов, вахты и закаты стоят любых бытовых ограничений.", fit: 4, type: "expedition", scores: { field: 3, bio: 2, analytical: 1 } },
        { text: "С удовольствием пойду в рейс ради научных задач, но мне важна и работа в сухопутной лаборатории.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Предпочту береговые станции или спутниковый мониторинг без длительной изоляции в открытом море.", fit: 3, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Нет, долгая разлука с близкими, качка и жизнь в тесной каюте для меня категорически неприемлемы.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "3. Морская болезнь (укачивание в шторм) — частое испытание на судне. Как ты к этому относишься?",
      options: [
        { text: "Меня почти не укачивает или организм быстро адаптируется («прикачивается») за первые 1–2 дня.", fit: 4, type: "expedition", scores: { field: 3, bio: 2, analytical: 2 } },
        { text: "Готов(а) преодолевать дискомфорт с помощью тренировок вестибулярного аппарата и медикаментов.", fit: 4, type: "bio", scores: { field: 2, bio: 2, analytical: 2 } },
        { text: "Тяжело переношу сильную качку, поэтому выбрал(а) бы аналитическую работу на суше: базы данных и ГИС.", fit: 3, type: "tech", scores: { field: 0, bio: 2, analytical: 3 } },
        { text: "Не выношу даже небольшую качку на катере, физический дискомфорт перечеркнёт любое желание работать.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "4. Какие школьные или университетские дисциплины вызывают у тебя наибольший отклик?",
      options: [
        { text: "Биология, экология и основы генетики — завораживает живая природа и устройство экосистем.", fit: 4, type: "bio", scores: { field: 1, bio: 3, analytical: 2 } },
        { text: "География, физика и информатика — люблю карты, навигацию, приборы и технику.", fit: 4, type: "expedition", scores: { field: 3, bio: 1, analytical: 2 } },
        { text: "Высшая математика, физика и гидродинамика — термодинамика течений и численные модели.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Исключительно гуманитарные предметы или творчество, а естественные науки вызывают скуку.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "5. Океанология требует усидчивости. Как ты относишься к кропотливой лабораторной работе с пробами?",
      options: [
        { text: "С искренним азартом! Рассматривать микромир планктона под микроскопом — это чистое вдохновение.", fit: 4, type: "bio", scores: { field: 1, bio: 3, analytical: 3 } },
        { text: "Положительно: первичный разбор проб воды и кернов грунта на палубе — обязательная часть экспедиции.", fit: 4, type: "eco", scores: { field: 2, bio: 2, analytical: 2 } },
        { text: "Предпочитаю автоматизацию: пусть сканеры и нейросети анализируют планктон, а я напишу код.", fit: 3, type: "tech", scores: { field: 0, bio: 1, analytical: 3 } },
        { text: "Очень плохо: монотонная рутинная возня с пробирками и записями в журнал наводит уныние.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "6. Что ты думаешь об управлении глубоководными телеуправляемыми роботами (ТНПА) и батискафами?",
      options: [
        { text: "Это вершина исследовательской робототехники! Управлять манипулятором на глубине 3000 м — восторг.", fit: 4, type: "tech", scores: { field: 3, bio: 1, analytical: 3 } },
        { text: "Отличный инструмент: роботы позволяют наблюдать за поведением морских созданий прямо на дне.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Полезный метод, но главное — показания приборов: солёность, температура и батиметрия дна.", fit: 4, type: "climate", scores: { field: 2, bio: 1, analytical: 3 } },
        { text: "Сложная подводная техника, кабели и электроника меня совершенно не привлекают.", fit: 2, type: "neutral", scores: { field: 0, bio: 1, analytical: 0 } }
      ]
    },
    {
      question: "7. Экспедиция — это жизнь в замкнутом научном коллективе из 25–40 человек на борту. Как ты ладишь с людьми?",
      options: [
        { text: "Отлично! Ценю крепкое научное братство, взаимовыручку, вечерние споры в кают-компании и общий труд.", fit: 4, type: "expedition", scores: { field: 3, bio: 2, analytical: 2 } },
        { text: "Легко адаптируюсь: я неконфликтный человек, умею уважать личные границы и слышать коллег.", fit: 4, type: "bio", scores: { field: 2, bio: 2, analytical: 2 } },
        { text: "Ценю уединение, поэтому на судне мне понадобится отдельный спокойный угол для работы за ноутбуком.", fit: 3, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Меня быстро утомляет постоянное нахождение среди одних и тех же людей в замкнутом пространстве.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "8. Проблема пластикового загрязнения и гибели кораллов в океане. Какова твоя личная позиция?",
      options: [
        { text: "Это острая экологическая катастрофа, которой я хочу посвятить свою карьеру и спасение гидросферы.", fit: 4, type: "eco", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Стремлюсь изучать, как морские экосистемы и микроорганизмы адаптируются к микропластику.", fit: 4, type: "bio", scores: { field: 1, bio: 3, analytical: 2 } },
        { text: "Вижу решение в глобальном математическом моделировании переноса загрязнений океанскими течениями.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Считаю эту проблему преувеличенной, вопросы глобальной экологии океана меня мало волнуют.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "9. Готов(а) ли ты к ночным вахтам (например, спуск гидрологической кассеты «Розетта» в 3 часа ночи)?",
      options: [
        { text: "Без проблем! Судовой график строг, а ночной океан под прожекторами судна полон особой магии.", fit: 4, type: "expedition", scores: { field: 3, bio: 2, analytical: 2 } },
        { text: "Ради сбора ценных ночных биолюминесцентных организмов готов(а) перестроить режим дня на время рейса.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Готов(а), если этот график чередуется с полноценным сном и необходим для непрерывного ряда данных.", fit: 3, type: "climate", scores: { field: 2, bio: 1, analytical: 3 } },
        { text: "Категорически не выношу сбитый режим сна и холод, ночная работа на палубе быстро лишит меня сил.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "10. Какой географический регион манит тебя сильнее всего для будущих экспедиций?",
      options: [
        { text: "Полярные моря Арктики и Антарктики: суровый север, айсберги, киты, белые медведи и ледники.", fit: 4, type: "expedition", scores: { field: 3, bio: 2, analytical: 2 } },
        { text: "Тропические коралловые рифы и лагуны с невероятным буйством подводных видов и прозрачной водой.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 1 } },
        { text: "Открытые просторы океанов, глубоководные желоба и районы планетарных апвеллингов.", fit: 4, type: "climate", scores: { field: 2, bio: 1, analytical: 3 } },
        { text: "Предпочитаю оставаться на суше в привычном мегаполисе и не выезжать в дикую природу.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "11. Как ты относишься к освоению профессионального софта (ГИС, спутниковые базы, Python, Ocean Data View)?",
      options: [
        { text: "С энтузиазмом! Современный учёный обязан уметь программировать и строить цифровые карты глубин.", fit: 4, type: "tech", scores: { field: 1, bio: 2, analytical: 3 } },
        { text: "Освою как практический инструмент для визуализации ареалов морских животных и миграций видов.", fit: 4, type: "bio", scores: { field: 1, bio: 3, analytical: 2 } },
        { text: "Это моё призвание: обожаю численные расчеты, гидрофизические алгоритмы и обработку массивов данных.", fit: 4, type: "climate", scores: { field: 0, bio: 1, analytical: 3 } },
        { text: "Сложные программы, код, графики и базы данных вызывают у меня сильное отторжение.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "12. В рейсе возможны нештатные ситуации: запутался трос зонда, начался шторм. Как ты реагируешь на стресс?",
      options: [
        { text: "Быстро мобилизуюсь, сохраняю хладнокровие и вместе с коллегами ищу нестандартный выход.", fit: 4, type: "expedition", scores: { field: 3, bio: 1, analytical: 2 } },
        { text: "Строго соблюдаю правила судовой безопасности, сохраняю выдержку и поддерживаю команду.", fit: 4, type: "eco", scores: { field: 2, bio: 2, analytical: 2 } },
        { text: "Анализирую риски системно, заранее продумываю дублирующие алгоритмы и протоколы действий.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Легко впадаю в панику, растерянность и стресс полностью парализуют мою работоспособность.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "13. Что ты считаешь наивысшей наградой за свой многолетний труд в науке?",
      options: [
        { text: "Открыть новый биологический вид или разгадать тайну выживания фауны гидротермальных источников.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Успешно провести сложнейший арктический рейс и поднять уникальные донные осадки из впадины.", fit: 4, type: "expedition", scores: { field: 3, bio: 1, analytical: 2 } },
        { text: "Создать климатическую модель, которая убережёт прибрежные города от ударов штормов и цунами.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Только высокий доход без особого интеллектуального напряжения, а сам предмет науки мне безразличен.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "14. Экспедиция длится 2 месяца, а камеральная обработка собранных данных в лаборатории — целый год. Готов(а)?",
      options: [
        { text: "Да, это гармоничный баланс: яркие впечатления в море сменяются вдумчивой аналитикой за компьютером.", fit: 4, type: "climate", scores: { field: 2, bio: 2, analytical: 3 } },
        { text: "С удовольствием: именно в лаборатории при секвенировании ДНК открывается ценность собранных проб.", fit: 4, type: "bio", scores: { field: 1, bio: 3, analytical: 3 } },
        { text: "Больше люблю морскую стихию, но написание статей и отчётов принимаю как обязательный долг учёного.", fit: 3, type: "expedition", scores: { field: 3, bio: 2, analytical: 1 } },
        { text: "Терпеть не могу писать научные отчёты, сводить таблицы и подолгу работать за рабочим столом.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    },
    {
      question: "15. Какой образ будущей профессиональной карьеры вдохновляет тебя сильнее всего?",
      options: [
        { text: "Ведущий биоокеанолог в Институте океанологии РАН, автор открытий в области глубоководной фауны.", fit: 4, type: "bio", scores: { field: 2, bio: 3, analytical: 2 } },
        { text: "Начальник научного отряда на флагманском судне («Академик Мстислав Келдыш») академического флота.", fit: 4, type: "expedition", scores: { field: 3, bio: 1, analytical: 2 } },
        { text: "Ведущий климатолог в Росгидромете или международном центре, прогнозирующий будущее планеты.", fit: 4, type: "climate", scores: { field: 1, bio: 1, analytical: 3 } },
        { text: "Работа в офисе, банке или торговле, никак не связанная с морями, природой и исследованиями.", fit: 1, type: "neutral", scores: { field: 0, bio: 0, analytical: 0 } }
      ]
    }
  ];

  let currentIdx = 0;
  let userAnswers = new Array(questions.length).fill(null);

  const quizStep = document.getElementById('quizStep');
  const quizProgressFill = document.getElementById('quizProgressFill');
  const quizQuestionTitle = document.getElementById('quizQuestionTitle');
  const quizOptionsList = document.getElementById('quizOptionsList');
  const quizNextBtn = document.getElementById('quizNextBtn');
  const quizPrevBtn = document.getElementById('quizPrevBtn');
  const quizStatusHint = document.getElementById('quizStatusHint');
  const quizCardQuestion = document.getElementById('quizCardQuestion');
  const quizResultView = document.getElementById('quizResultView');
  const resultVerdictTitle = document.getElementById('resultVerdictTitle');
  const resultVerdictDesc = document.getElementById('resultVerdictDesc');
  const resultMatchPercentage = document.getElementById('resultMatchPercentage');
  const resultLevelTag = document.getElementById('resultLevelTag');
  const resultBreakdownGrid = document.getElementById('resultBreakdownGrid');
  const quizRestartBtn = document.getElementById('quizRestartBtn');

  if (!quizQuestionTitle || !quizOptionsList) return;

  function renderQ(idx) {
    const q = questions[idx];
    quizStep.textContent = `Вопрос ${idx + 1} из ${questions.length}`;
    quizProgressFill.style.width = `${((idx + 1) / questions.length) * 100}%`;
    quizQuestionTitle.textContent = q.question;

    quizOptionsList.innerHTML = '';

    // Управление кнопкой «Назад»
    if (quizPrevBtn) {
      if (idx > 0) {
        quizPrevBtn.style.display = 'inline-flex';
      } else {
        quizPrevBtn.style.display = 'none';
      }
    }

    // Состояние кнопки «Далее / Результат»
    const previousAnswer = userAnswers[idx];
    if (previousAnswer) {
      quizNextBtn.disabled = false;
      if (quizStatusHint) quizStatusHint.textContent = 'Ответ сохранён';
    } else {
      quizNextBtn.disabled = true;
      if (quizStatusHint) quizStatusHint.textContent = 'Выберите вариант ответа';
    }

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
      if (previousAnswer && previousAnswer.text === opt.text) {
        btn.classList.add('selected');
      }

      btn.innerHTML = `
        <span class="quiz-option-key">${letters[oIdx]}</span>
        <span>${opt.text}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        userAnswers[idx] = opt;
        quizNextBtn.disabled = false;
        if (quizStatusHint) quizStatusHint.textContent = 'Вариант выбран, нажмите «Далее»';
      });

      quizOptionsList.appendChild(btn);
    });
  }

  if (quizPrevBtn) {
    quizPrevBtn.addEventListener('click', () => {
      if (currentIdx > 0) {
        currentIdx--;
        renderQ(currentIdx);
      }
    });
  }

  quizNextBtn.addEventListener('click', () => {
    if (!userAnswers[currentIdx]) return;

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

    // 1. Подсчёт баллов совместимости (от 15 до 60)
    let totalFit = 0;
    let fieldScore = 0;
    let bioScore = 0;
    let analyticalScore = 0;
    const tally = { bio: 0, expedition: 0, climate: 0, eco: 0, tech: 0, neutral: 0 };

    userAnswers.forEach(ans => {
      if (!ans) return;
      totalFit += ans.fit || 1;
      fieldScore += ans.scores ? ans.scores.field : 0;
      bioScore += ans.scores ? ans.scores.bio : 0;
      analyticalScore += ans.scores ? ans.scores.analytical : 0;
      if (ans.type) {
        tally[ans.type] = (tally[ans.type] || 0) + 1;
      }
    });

    // Расчёт точного процента совместимости (от 20% до 98%)
    let matchPct = Math.round(((totalFit - 15) / 45) * 75 + 23);
    matchPct = Math.max(20, Math.min(98, matchPct));

    // Максимальные баллы по суб-критериям:
    // field max ~ 40, bio max ~ 38, analytical max ~ 36
    const fieldPct = Math.max(15, Math.min(99, Math.round((fieldScore / 38) * 100)));
    const bioPct = Math.max(15, Math.min(99, Math.round((bioScore / 36) * 100)));
    const analyticalPct = Math.max(15, Math.min(99, Math.round((analyticalScore / 35) * 100)));

    // Ведущее научное направление
    let topType = 'bio';
    let maxVotes = -1;
    ['bio', 'expedition', 'climate', 'eco', 'tech'].forEach(key => {
      if ((tally[key] || 0) > maxVotes) {
        maxVotes = tally[key];
        topType = key;
      }
    });

    let levelTitle = '';
    let levelTagText = '';
    let levelTagClass = 'level-high';
    let verdictTitle = '';
    let verdictDesc = '';

    if (matchPct >= 85) {
      levelTagText = 'Высокая совместимость';
      levelTagClass = 'level-high';

      if (topType === 'bio') {
        verdictTitle = 'Прирождённый биоокеанолог и исследователь морских экосистем!';
        verdictDesc = 'У тебя выдающийся потенциал для работы с живыми системами гидросферы! Ты сочетаешь неподдельный интерес к морской биологии, планктону, кораллам и глубоководной фауне с готовностью к экспедиционной жизни. Тебе идеально подойдут программы профиля «Морская биология» и «Биоокеанология» в МГУ им. М. В. Ломоносова, СПбГУ или ДВФУ.';
      } else if (topType === 'expedition') {
        verdictTitle = 'Экспедиционный океанолог и покоритель глубин!';
        verdictDesc = 'Твоя главная стихия — открытый океан, исследовательские суда и погружения на батискафах! Ты обладаешь высокой стрессоустойчивостью, готовностью к ночным вахтам и морской закалкой. Твоё будущее — флагманы академического флота России и институты РАН (ИО РАН, ТОИ ДВО РАН). Обрати внимание на океанологический факультет РГГМУ и ДВФУ.';
      } else if (topType === 'climate') {
        verdictTitle = 'Физический океанолог и исследователь климата Земли!';
        verdictDesc = 'Ты мыслишь глобальными планетарными категориями! Термодинамика течений, теплообмен океана с атмосферой и численное моделирование климатических сдвигов — твоё призвание. Тебе открыты ведущие научные институты Росгидромета, Институт физики атмосферы РАН и кафедры океанологии МГУ и СПбГУ.';
      } else if (topType === 'eco') {
        verdictTitle = 'Морской эколог и защитник гидросферы!';
        verdictDesc = 'Твоя миссия — сохранение чистоты морей, защита хрупких рифов и борьба с микропластиком и нефтяными загрязнениями. Программы экологического мониторинга и рационального природопользования в БФУ им. И. Канта, СПбГУ и РГГМУ станут твоим мощным стартом.';
      } else {
        verdictTitle = 'Инженер океанографических систем и подводной робототехники!';
        verdictDesc = 'Современный океан исследуется телеуправляемыми роботами, спутниками и сенсорными сетями. Твой аналитический ум и любовь к технике откроют дорогу в лаборатории подводной робототехники, шельфовые компании и океанографические IT-центры.';
      }

    } else if (matchPct >= 68) {
      levelTagText = 'Хорошая совместимость';
      levelTagClass = 'level-medium';
      verdictTitle = 'Перспективный исследователь: баланс лаборатории и науки';
      verdictDesc = `Твоя совместимость с профессией составляет ${matchPct}%. Тебе близки идеи изучения океана и природы, однако комфортнее работать в стабильном ритме — например, на береговых биостанциях, в лабораториях анализа проб или в сфере спутниковой океанологии без многомесячных изнурительных походов. Рассмотри направления биоинформатики, гидрохимии или экологического аудита прибрежных зон.`;

    } else if (matchPct >= 50) {
      levelTagText = 'Умеренная совместимость';
      levelTagClass = 'level-medium';
      verdictTitle = 'Смежные научные и прикладные направления';
      verdictDesc = `Совместимость с полевой океанологией — ${matchPct}%. Морская специфика (шторма, ночные вахты, многомесячная изоляция в море) может стать для тебя источником дискомфорта. При этом интерес к природе можно отлично реализовать в смежных областях: аквариумистике, общей экологии суши, ландшафтном дизайне, ветеринарии или естественно-научной журналистике.`;

    } else {
      levelTagText = 'Низкая совместимость';
      levelTagClass = 'level-low';
      verdictTitle = 'Профессия океанолога вряд ли станет твоим призванием';
      verdictDesc = `Твоя совместимость — ${matchPct}%. Океанология требует очень высокой специфической выносливости, любви к полевой полевой жизни и многочасовой рутинной работе с образцами и приборами. Твои сильные стороны и истинные склонности, судя по ответам, лежат в совершенно других сферах: возможно, в IT, бизнесе, дизайне или гуманитарных направлениях.`;
    }

    resultVerdictTitle.textContent = verdictTitle;
    resultVerdictDesc.textContent = verdictDesc;
    resultMatchPercentage.textContent = `${matchPct}%`;

    if (resultLevelTag) {
      resultLevelTag.textContent = levelTagText;
      resultLevelTag.className = `result-level-tag ${levelTagClass}`;
    }

    // Отрисовка 3 суб-показателей
    if (resultBreakdownGrid) {
      resultBreakdownGrid.innerHTML = `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Экспедиционная готовность</span>
            <span class="breakdown-val">${fieldPct}%</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${fieldPct}%;"></div>
          </div>
          <span class="breakdown-subtext">Стойкость к морским рейсам, качке, вахтам и командной жизни на судне</span>
        </div>

        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Биологическая вовлечённость</span>
            <span class="breakdown-val">${bioPct}%</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${bioPct}%;"></div>
          </div>
          <span class="breakdown-subtext">Интерес к морским организмам, экосистемам, планктону и защите гидросферы</span>
        </div>

        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Аналитика и технологии</span>
            <span class="breakdown-val">${analyticalPct}%</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${analyticalPct}%;"></div>
          </div>
          <span class="breakdown-subtext">Работа с приборами, роботами, базами данных, картами и камеральными отчётами</span>
        </div>
      `;
    }

    quizResultView.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (quizRestartBtn) {
    quizRestartBtn.addEventListener('click', () => {
      currentIdx = 0;
      userAnswers = new Array(questions.length).fill(null);
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
