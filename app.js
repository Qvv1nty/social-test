(function () {
  const app = document.getElementById("app");
  const total = QUESTIONS.length;
  const KEY = "social-test-state-v1";
  let state = load();
  let shownProgress = 0;

  function fresh() { return { answers: Array(total).fill(null), current: 0, done: false }; }
  function load() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY));
      if (s && Array.isArray(s.answers) && s.answers.length === total &&
          s.answers.every(a => a === null || (Number.isInteger(a) && a >= 0 && a <= 3)) &&
          Number.isInteger(s.current) && s.current >= 0 && s.current < total) {
        if (s.done && s.answers.includes(null)) s.done = false;
        return s;
      }
    } catch (e) {}
    return fresh();
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function render(focusHeading) {
    save();
    state.done ? renderResult() : renderQuestion();
    const h = app.querySelector("[data-focus]");
    if (focusHeading && h) h.focus({ preventScroll: false });
  }

  function renderQuestion() {
    const i = state.current, q = QUESTIONS[i], last = i === total - 1;
    const target = ((i + 1) / total) * 100;
    app.innerHTML = `
      <section class="card enter" aria-labelledby="qtext">
        <div class="meta">
          <span class="counter">Вопрос ${i + 1} из ${total}</span>
          <div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${i + 1}" aria-label="Прогресс теста"><span id="fill" style="width:${shownProgress}%"></span></div>
        </div>
        <fieldset>
          <legend id="qtext" tabindex="-1" data-focus>${q.text}</legend>
          <div class="options">
            ${q.options.map((o, k) => `
              <label class="option${state.answers[i] === k ? " selected" : ""}">
                <input type="radio" name="q${i}" value="${k}"${state.answers[i] === k ? " checked" : ""}>
                <span class="dot" aria-hidden="true"></span><span>${o}</span>
              </label>`).join("")}
          </div>
        </fieldset>
        <p class="msg" id="msg" role="status"></p>
        <div class="nav">
          <button type="button" class="btn ghost" id="prev"${i === 0 ? " disabled" : ""}>Назад</button>
          <button type="button" class="btn" id="next">${last ? "Узнать результат" : "Далее"}</button>
        </div>
      </section>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const f = document.getElementById("fill");
      if (f) f.style.width = target + "%";
      shownProgress = target;
    }));
    app.querySelectorAll("input[type=radio]").forEach(inp => inp.addEventListener("change", () => {
      state.answers[i] = Number(inp.value);
      save();
      app.querySelectorAll(".option").forEach(l => l.classList.toggle("selected", l.contains(inp) && inp.checked));
      document.getElementById("msg").textContent = "";
    }));
    document.getElementById("prev").addEventListener("click", () => { if (state.current > 0) { state.current--; render(true); } });
    document.getElementById("next").addEventListener("click", () => {
      const msg = document.getElementById("msg");
      if (state.answers[i] === null) { msg.textContent = "Выбери один из вариантов, чтобы продолжить."; return; }
      if (!last) { state.current++; render(true); return; }
      const missing = state.answers.indexOf(null);
      if (missing !== -1) {
        state.current = missing; render(true);
        document.getElementById("msg").textContent = "Нужно ответить на все вопросы — вернул тебя к пропущенному.";
        return;
      }
      state.done = true; render(true);
    });
  }

  function renderResult() {
    const score = calcScore(state.answers), r = getResult(score);
    const pct = ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
    const seg = RESULTS.map(x => `<span class="seg ${x.id}${x.id === r.id ? " on" : ""}" style="flex:${x.max - x.min + 1}"></span>`).join("");
    app.innerHTML = `
      <section class="card result enter" aria-labelledby="rtitle">
        <p class="counter">Тест пройден</p>
        <h2 id="rtitle" tabindex="-1" data-focus>${r.title}</h2>
        <p class="score"><strong>${score}</strong> из ${MAX_SCORE} баллов</p>
        <div class="meter" role="img" aria-label="Результат ${score} из ${MAX_SCORE} баллов">
          <div class="segs">${seg}</div><span class="marker" id="marker" style="left:0%"></span>
          <div class="ticks"><span>${MIN_SCORE}</span><span>${MAX_SCORE}</span></div>
        </div>
        <p>${r.description}</p>
        <h3>Рекомендации</h3>
        <ul class="tips">${r.tips.map(t => `<li>${t}</li>`).join("")}</ul>
        <p class="note">${DISCLAIMER}</p>
        <div class="nav"><button type="button" class="btn" id="restart">Пройти тест заново</button></div>
      </section>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { document.getElementById("marker").style.left = pct + "%"; }));
    document.getElementById("restart").addEventListener("click", () => {
      state = fresh(); shownProgress = 0; render(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  render(false);
})();
