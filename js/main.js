// The Small Garden – kleine Helfer (Öffnungsstatus, Navigation, Animationen)
(function () {
  // 0 = Sonntag … 6 = Samstag; Zeiten in Minuten
  var HOURS = {
    1: [480, 960], 2: [480, 960], 3: [480, 960], 4: [480, 960], 5: [480, 900], 6: null, 0: null
  };
  var DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function berlinNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      return { day: idx, min: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function fmt(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }

  function status() {
    var now = berlinNow();
    var today = HOURS[now.day];
    if (today && now.min >= today[0] && now.min < today[1]) {
      return { open: true, text: "Jetzt geöffnet · bis " + fmt(today[1]) + " Uhr", day: now.day };
    }
    if (today && now.min < today[0]) {
      return { open: false, text: "Geschlossen · öffnet heute um " + fmt(today[0]) + " Uhr", day: now.day };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (HOURS[d]) {
        var when = i === 1 ? "morgen" : DAY_NAMES[d];
        return { open: false, text: "Geschlossen · öffnet " + when + " um " + fmt(HOURS[d][0]) + " Uhr", day: now.day };
      }
    }
    return { open: false, text: "Geschlossen", day: now.day };
  }

  function applyStatus() {
    var s = status();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      var t = el.querySelector("[data-status-text]") || el;
      t.textContent = s.text;
    });
    document.querySelectorAll(".hours tr[data-day]").forEach(function (tr) {
      tr.classList.toggle("today", parseInt(tr.getAttribute("data-day"), 10) === s.day);
    });
  }
  applyStatus();
  setInterval(applyStatus, 60000);

  // Header-Schatten beim Scrollen
  var header = document.querySelector(".header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile-Navigation
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }

  // Einblenden beim Scrollen
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Speisekarte: aktiven Reiter markieren
  var tabs = document.querySelectorAll(".menu-tabs a");
  if (tabs.length && "IntersectionObserver" in window) {
    var byId = {};
    tabs.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && byId[e.target.id]) {
          tabs.forEach(function (a) { a.classList.remove("active"); });
          var a = byId[e.target.id];
          a.classList.add("active");
          if (a.scrollIntoView && a.parentElement.scrollWidth > a.parentElement.clientWidth) {
            a.parentElement.scrollTo({ left: a.offsetLeft - 40, behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-160px 0px -60% 0px" });
    document.querySelectorAll(".menu-cat").forEach(function (s) { spy.observe(s); });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
