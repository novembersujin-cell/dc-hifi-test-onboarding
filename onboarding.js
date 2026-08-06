(() => {
  const LANG_KEY = "macroverse-onboarding-lang";
  const MODE_KEY = "macroverse-onboarding-mode";
  const AGE_KEY = "macroverse-onboarding-age";
  const CUBE_KEY = "macroverse-onboarding-cube";
  const USERNAME_KEY = "macroverse-onboarding-username";
  const PLAYERS_KEY = "macroverse-onboarding-players";

  const USERNAME_RESULTS = {
    1: {
      name: "Collaborative Penguin!",
      src: "assets/avatar-1.png",
      crop: true,
    },
    2: {
      name: "Dynamic Dog!",
      src: "assets/avatar-2.png",
      crop: true,
    },
    3: {
      name: "Curious Koala!",
      src: "assets/avatar-3.png",
      crop: true,
    },
    4: {
      name: "Tenacious Tiger!",
      src: "assets/avatar-4.svg",
      crop: false,
    },
  };

  function readLang() {
    return sessionStorage.getItem(LANG_KEY) === "es" ? "es" : "en";
  }

  function writeLang(lang) {
    sessionStorage.setItem(LANG_KEY, lang === "es" ? "es" : "en");
  }

  function readPlayers() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(PLAYERS_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function writePlayers(list) {
    sessionStorage.setItem(PLAYERS_KEY, JSON.stringify(list));
  }

  function clearPartyData() {
    sessionStorage.removeItem(PLAYERS_KEY);
    sessionStorage.removeItem(CUBE_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(AGE_KEY);
  }

  function commitCurrentPlayer(box) {
    const result = USERNAME_RESULTS[box] || USERNAME_RESULTS[1];
    const players = readPlayers();
    players.push({
      box: String(box),
      name: result.name,
      src: result.src,
    });
    writePlayers(players);
    return players;
  }

  function applyLangToggle() {
    const lang = readLang();
    document.querySelectorAll(".lang-toggle").forEach((toggle) => {
      toggle.dataset.lang = lang;
      toggle.querySelectorAll(".lang-btn").forEach((btn) => {
        const active = btn.dataset.langOption === lang;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
    // Toggle only — do not swap any copy yet.
    document.documentElement.lang = lang === "es" ? "es" : "en";
  }

  function bindLangToggles() {
    document.querySelectorAll(".lang-toggle").forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        const btn = event.target.closest(".lang-btn");
        if (!btn) return;
        writeLang(btn.dataset.langOption);
        applyLangToggle();
      });
    });
  }

  function bindModeLinks() {
    document.querySelectorAll("a[data-mode]").forEach((link) => {
      link.addEventListener("click", () => {
        sessionStorage.setItem(MODE_KEY, link.dataset.mode);
        clearPartyData();
      });
    });
  }

  function hydrateFlowPage() {
    const stage = document.getElementById("stage");
    if (!stage?.dataset.mode) return;
    sessionStorage.setItem(MODE_KEY, stage.dataset.mode);
  }

  function bindWristbandTap() {
    const stage = document.getElementById("stage");
    if (!stage || stage.dataset.screen !== "wristband") return;

    const action = document.getElementById("wristband-action");
    const doneState = stage.querySelector(".wristband-state-done");
    const idleState = stage.querySelector(".wristband-state-idle");
    let confirming = false;
    const CONFIRM_HOLD_MS = 1200;

    const goNext = () => {
      const mode = stage.dataset.mode || "solo";
      sessionStorage.setItem(MODE_KEY, mode);
      window.location.href =
        mode === "together" ? "together-age.html" : "solo-age.html";
    };

    // Tap → Registered! → age
    const onAdvance = (event) => {
      if (event.target.closest(".back-btn, .lang-toggle, a.back-btn, button.lang-btn")) {
        return;
      }
      if (confirming) return;
      confirming = true;

      if (action) action.disabled = true;
      stage.classList.remove("is-pulsing");
      stage.classList.add("is-confirmed");
      if (action) action.setAttribute("aria-label", "Registered!");
      if (idleState) idleState.setAttribute("aria-hidden", "true");
      if (doneState) doneState.removeAttribute("aria-hidden");
      window.setTimeout(goNext, CONFIRM_HOLD_MS);
    };

    stage.addEventListener("click", onAdvance);
  }

  function colWidth(wheel) {
    const sample = wheel.querySelector(".age-digit");
    return sample ? sample.getBoundingClientRect().width : 64;
  }

  function selectedIndex(wheel) {
    const w = colWidth(wheel);
    if (!w) return 0;
    return Math.round(wheel.scrollLeft / w);
  }

  function markSelected(wheel) {
    const idx = selectedIndex(wheel);
    wheel.querySelectorAll(".age-digit").forEach((el, i) => {
      el.classList.toggle("is-selected", i === idx);
      el.setAttribute("aria-selected", i === idx ? "true" : "false");
    });
    return idx;
  }

  function snapWheel(wheel, maxIdx = 100) {
    const w = syncWheelPadding(wheel) || colWidth(wheel);
    const idx = Math.max(0, Math.min(maxIdx, selectedIndex(wheel)));
    wheel.scrollTo({ left: idx * w, behavior: "smooth" });
    return markSelected(wheel);
  }

  function formatAgeLabel(n) {
    return String(n);
  }

  function readAge() {
    const wheel = document.getElementById("age-wheel");
    if (!wheel) return 0;
    return markSelected(wheel);
  }

  function syncWheelPadding(wheel) {
    const w = colWidth(wheel);
    if (!w) return 0;
    const pad = Math.max(0, (wheel.clientWidth - w) / 2);
    wheel.style.paddingLeft = `${pad}px`;
    wheel.style.paddingRight = `${pad}px`;
    wheel.style.paddingTop = "0";
    wheel.style.paddingBottom = "0";
    return w;
  }

  function fillAgeWheel(wheel, initial) {
    wheel.innerHTML = "";
    for (let n = 0; n <= 100; n += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "age-digit";
      btn.textContent = formatAgeLabel(n);
      btn.dataset.value = String(n);
      btn.setAttribute("role", "option");
      btn.tabIndex = -1;
      wheel.appendChild(btn);
    }

    const apply = () => {
      const w = syncWheelPadding(wheel);
      if (!w) {
        window.setTimeout(apply, 40);
        return;
      }
      wheel.scrollLeft = initial * w;
      markSelected(wheel);
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.setTimeout(apply, 120);
  }

  function bindWheelDrag(wheel, maxIdx = 100) {
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let raf = 0;

    const stopInertia = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const settle = () => {
      stopInertia();
      snapWheel(wheel, maxIdx);
    };

    const inertia = () => {
      velocity *= 0.92;
      if (Math.abs(velocity) < 0.25) {
        settle();
        return;
      }
      wheel.scrollLeft -= velocity;
      markSelected(wheel);
      const max = wheel.scrollWidth - wheel.clientWidth;
      if (wheel.scrollLeft <= 0 || wheel.scrollLeft >= max) {
        settle();
        return;
      }
      raf = requestAnimationFrame(inertia);
    };

    wheel.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      stopInertia();
      dragging = true;
      wheel.classList.add("is-dragging");
      startX = event.clientX;
      lastX = event.clientX;
      lastT = performance.now();
      startScroll = wheel.scrollLeft;
      velocity = 0;
      try {
        wheel.setPointerCapture(event.pointerId);
      } catch {
        // capture unavailable (e.g. synthetic events)
      }
      event.preventDefault();
    });

    const onMove = (event) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = event.clientX - startX;
      wheel.scrollLeft = startScroll - dx;
      const dt = Math.max(1, now - lastT);
      velocity = ((event.clientX - lastX) / dt) * 16;
      lastX = event.clientX;
      lastT = now;
      markSelected(wheel);
    };

    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      wheel.classList.remove("is-dragging");
      try {
        if (event?.pointerId != null) wheel.releasePointerCapture(event.pointerId);
      } catch {
        // already released
      }
      if (Math.abs(velocity) > 0.8) raf = requestAnimationFrame(inertia);
      else settle();
    };

    wheel.addEventListener("pointermove", onMove);
    wheel.addEventListener("pointerup", endDrag);
    wheel.addEventListener("pointercancel", endDrag);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    let timer;
    wheel.addEventListener(
      "scroll",
      () => {
        if (dragging || raf) return;
        markSelected(wheel);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => snapWheel(wheel, maxIdx), 90);
      },
      { passive: true }
    );
  }

  function bindAgePicker() {
    const stage = document.getElementById("stage");
    if (!stage || stage.dataset.screen !== "age") return;

    const wheel = document.getElementById("age-wheel");
    const cont = document.getElementById("age-continue");
    if (!wheel) return;

    const raw = sessionStorage.getItem(AGE_KEY);
    const saved = raw == null || raw === "" ? 0 : Number(raw);
    const start = Number.isFinite(saved) ? Math.max(0, Math.min(100, saved)) : 0;
    fillAgeWheel(wheel, start);
    bindWheelDrag(wheel, 100);

    window.addEventListener("resize", () => {
      const age = readAge();
      syncWheelPadding(wheel);
      const w = colWidth(wheel);
      wheel.scrollLeft = age * w;
      markSelected(wheel);
    });

    cont?.addEventListener("click", () => {
      const age = readAge();
      const mode = stage.dataset.mode || sessionStorage.getItem(MODE_KEY) || "solo";
      sessionStorage.setItem(AGE_KEY, String(age));
      sessionStorage.setItem(MODE_KEY, mode);
      window.location.href =
        mode === "together" ? "together-username.html" : "solo-username.html";
    });
  }

  function bindCubeSelect() {
    const stage = document.getElementById("stage");
    if (!stage || stage.dataset.screen !== "username") return;

    const buttons = stage.querySelectorAll(".cube-btn[data-cube]");
    const saved = sessionStorage.getItem(CUBE_KEY);
    buttons.forEach((btn) => {
      if (saved && btn.dataset.cube === saved) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }

      btn.addEventListener("click", () => {
        const cube = btn.dataset.cube;
        const mode =
          stage.dataset.mode || sessionStorage.getItem(MODE_KEY) || "solo";
        sessionStorage.setItem(CUBE_KEY, cube);
        sessionStorage.setItem(MODE_KEY, mode);
        buttons.forEach((other) => {
          const on = other === btn;
          other.classList.toggle("is-selected", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        });
        const result = USERNAME_RESULTS[cube];
        if (result) sessionStorage.setItem(USERNAME_KEY, result.name);
        window.location.href =
          mode === "together"
            ? `together-username-${cube}.html`
            : `solo-username-${cube}.html`;
      });
    });
  }

  function bindUsernameResult() {
    const stage = document.getElementById("stage");
    if (!stage || stage.dataset.screen !== "username-result") return;

    const box = String(stage.dataset.box || sessionStorage.getItem(CUBE_KEY) || "1");
    const result = USERNAME_RESULTS[box] || USERNAME_RESULTS[1];
    const mode =
      stage.dataset.mode || sessionStorage.getItem(MODE_KEY) || "solo";
    sessionStorage.setItem(CUBE_KEY, box);
    sessionStorage.setItem(USERNAME_KEY, result.name);
    sessionStorage.setItem(MODE_KEY, mode);

    const chip = document.getElementById("username-chip");
    const img = document.getElementById("username-avatar-img");
    const avatar = document.getElementById("username-avatar");
    if (chip) chip.textContent = result.name;
    if (img) {
      img.src = result.src;
      img.alt = result.name.replace(/!$/, "");
    }
    if (avatar) {
      avatar.dataset.box = box;
      avatar.classList.toggle("is-tiger", box === "4");
    }

    // Solo: Ready → summary
    document.getElementById("username-continue")?.addEventListener("click", () => {
      commitCurrentPlayer(box);
      window.location.href = "solo-summary.html";
    });

    // Together: Ready → summary; New → wristband again
    document.getElementById("username-ready")?.addEventListener("click", () => {
      commitCurrentPlayer(box);
      window.location.href = "together-summary.html";
    });

    document.getElementById("username-add")?.addEventListener("click", () => {
      commitCurrentPlayer(box);
      sessionStorage.removeItem(CUBE_KEY);
      sessionStorage.removeItem(USERNAME_KEY);
      sessionStorage.removeItem(AGE_KEY);
      window.location.href = "together.html";
    });
  }

  function renderSummaryAvatar(player) {
    const wrap = document.createElement("div");
    wrap.className = "summary-avatar";
    wrap.dataset.box = player.box;
    if (player.box === "4") wrap.classList.add("is-tiger");

    const img = document.createElement("img");
    img.className = "summary-avatar-img";
    img.src = player.src;
    img.alt = String(player.name || "").replace(/!$/, "");
    img.draggable = false;
    wrap.appendChild(img);
    return wrap;
  }

  function bindSummary() {
    const stage = document.getElementById("stage");
    if (!stage || stage.dataset.screen !== "summary") return;

    const mode =
      stage.dataset.mode || sessionStorage.getItem(MODE_KEY) || "solo";
    sessionStorage.setItem(MODE_KEY, mode);

    let players = readPlayers();
    if (!players.length) {
      const box = String(sessionStorage.getItem(CUBE_KEY) || "1");
      const result = USERNAME_RESULTS[box] || USERNAME_RESULTS[1];
      players = [{ box, name: result.name, src: result.src }];
    }

    const list = document.getElementById("summary-avatar-list");
    const soloAvatar = document.getElementById("summary-avatar");
    const soloImg = document.getElementById("summary-avatar-img");

    if (list) {
      list.replaceChildren(...players.map(renderSummaryAvatar));
    } else if (soloAvatar && soloImg) {
      const player = players[0];
      soloAvatar.dataset.box = player.box;
      soloAvatar.classList.toggle("is-tiger", player.box === "4");
      soloImg.src = player.src;
      soloImg.alt = String(player.name || "").replace(/!$/, "");
    }

    // Ready → clear session → home
    document.getElementById("summary-continue")?.addEventListener("click", () => {
      clearPartyData();
      window.location.href = "index.html";
    });
  }

  applyLangToggle();
  bindLangToggles();
  bindModeLinks();
  hydrateFlowPage();
  bindWristbandTap();
  bindAgePicker();
  bindCubeSelect();
  bindUsernameResult();
  bindSummary();
})();
