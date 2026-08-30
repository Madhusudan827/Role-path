/**
 * RolePath — renders roadmap data (from RolePathAPI) into the DOM.
 * Handles three surfaces: featured roadmaps on Home, the full
 * roadmap grid on Roadmaps, and a single roadmap's topic path.
 */
(function () {
  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function chip(text) {
    return `<span class="chip">${text}</span>`;
  }

  // Each roadmap now lives on its own dedicated page (no shared toggle page).
  function roadmapUrl(slug) {
    return slug === "python" ? "python-full-stack.html" : "java-full-stack.html";
  }

  // ---------- Home: Featured Roadmaps ----------
  async function renderFeatured() {
    const container = document.querySelector("[data-featured-roadmaps]");
    if (!container) return;
    container.innerHTML = `<div class="skeleton-row"><div class="skeleton-card"></div><div class="skeleton-card"></div></div>`;
    const roadmaps = await RolePathAPI.getRoadmaps();
    container.innerHTML = "";
    roadmaps.forEach((r) => {
      const card = el(
        "article",
        "roadmap-card reveal",
        `
        <div class="roadmap-card__icon">${r.icon}</div>
        <h3 class="roadmap-card__title">${r.title}</h3>
        <p class="roadmap-card__desc">${r.description}</p>
        <div class="roadmap-card__topics">${r.keyTopics.map(chip).join("")}</div>
        <a class="btn btn--outline" href="${roadmapUrl(r.slug)}">Explore Roadmap
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      `
      );
      container.appendChild(card);
    });
  }

  // ---------- Roadmaps listing page ----------
  async function renderRoadmapList() {
    const container = document.querySelector("[data-roadmap-list]");
    if (!container) return;
    container.innerHTML = `<div class="skeleton-row"><div class="skeleton-card skeleton-card--lg"></div><div class="skeleton-card skeleton-card--lg"></div></div>`;
    const roadmaps = await RolePathAPI.getRoadmaps();
    container.innerHTML = "";
    roadmaps.forEach((r) => {
      const card = el(
        "article",
        "roadmap-card roadmap-card--lg reveal",
        `
        <div class="roadmap-card__icon">${r.icon}</div>
        <h3 class="roadmap-card__title">${r.title}</h3>
        <p class="roadmap-card__desc">${r.description}</p>
        <p class="roadmap-card__meta">${r.topicCount} topics · self-paced</p>
        <div class="roadmap-card__topics">${r.keyTopics.map(chip).join("")}</div>
        <a class="btn btn--primary" href="${roadmapUrl(r.slug)}">Explore Roadmap
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      `
      );
      container.appendChild(card);
    });
  }

  // ---------- Single roadmap detail (the Path) ----------
  // Java and Python each have their own dedicated page now. A page declares
  // its roadmap via data-fixed-slug on [data-roadmap-page]; this keeps the
  // rendering code below shared while each roadmap's experience is independent.
  function getSlugFromUrl() {
    const main = document.querySelector("[data-roadmap-page]");
    const fixedSlug = main ? main.getAttribute("data-fixed-slug") : null;
    if (fixedSlug === "python" || fixedSlug === "java") return fixedSlug;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("path");
    return slug === "python" ? "python" : "java";
  }

  async function renderRoadmapDetail(slugOverride) {
    const main = document.querySelector("[data-roadmap-page]");
    if (!main) return;
    const slug = slugOverride || getSlugFromUrl();

    document.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.classList.toggle("is-active", tab.getAttribute("data-tab") === slug);
    });

    const roadmap = await RolePathAPI.getRoadmap(slug);
    if (!roadmap) {
      main.innerHTML = `<p class="empty-state">We couldn't find that roadmap.</p>`;
      return;
    }

    document.title = `${roadmap.title} · RolePath`;
    const titleEl = document.querySelector("[data-roadmap-title]");
    const descEl = document.querySelector("[data-roadmap-desc]");
    const crumbEl = document.querySelector("[data-roadmap-crumb]");
    if (titleEl) titleEl.textContent = roadmap.title;
    if (descEl) descEl.textContent = roadmap.description;
    if (crumbEl) crumbEl.textContent = roadmap.shortTitle;

    renderProgress(roadmap);
    renderPath(roadmap, slug);
  }

  function initRoadmapTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const slug = tab.getAttribute("data-tab");
        const url = new URL(window.location.href);
        url.searchParams.set("path", slug);
        window.history.pushState({}, "", url);
        renderRoadmapDetail(slug);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    window.addEventListener("popstate", () => renderRoadmapDetail());
  }

  function renderProgress(roadmap) {
    const total = roadmap.topics.length;
    const completed = roadmap.topics.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const bar = document.querySelector("[data-progress-fill]");
    const label = document.querySelector("[data-progress-label]");
    const marker = document.querySelector("[data-progress-marker]");
    if (bar) bar.style.width = `${percent}%`;
    if (marker) marker.style.left = `${percent}%`;
    if (label) label.textContent = `${completed} of ${total} topics complete (${percent}%)`;
  }

  // Videos → Video Resources: each topic's "Video" link opens a dedicated
  // page listing that topic's subtopics as individual YouTube links.
  function videoResourcesUrl(slug, topicId) {
    return `video-resources.html?path=${encodeURIComponent(slug)}&topic=${encodeURIComponent(topicId)}`;
  }

  function topicCardTemplate(topic, slug) {
    return `
      <div class="topic-node">
        <span class="topic-node__dot ${topic.completed ? "is-complete" : ""}" aria-hidden="true">${topic.order}</span>
      </div>
      <article class="topic-card ${topic.completed ? "is-complete" : ""}" data-topic-id="${topic.id}">
        <div class="topic-card__head">
          <h3 class="topic-card__title">${topic.title}</h3>
          <label class="checkbox">
            <input type="checkbox" data-topic-checkbox ${topic.completed ? "checked" : ""} aria-label="Mark ${topic.title} complete" />
            <span class="checkbox__box" aria-hidden="true"></span>
          </label>
        </div>
        <p class="topic-card__desc">${topic.description}</p>
        <div class="topic-card__links">
          <a href="${topic.notesLink}">Notes</a>
          <a href="${videoResourcesUrl(slug, topic.id)}">Video</a>
          <a href="${topic.practiceLink}">Practice</a>
        </div>
      </article>
    `;
  }

  function renderPath(roadmap, slug) {
    const track = document.querySelector("[data-path-track]");
    if (!track) return;
    track.innerHTML = "";
    roadmap.topics.forEach((topic) => {
      const item = el("div", "path-item", topicCardTemplate(topic, slug));
      track.appendChild(item);
    });

    track.addEventListener("change", async (event) => {
      const input = event.target.closest("[data-topic-checkbox]");
      if (!input) return;
      const card = input.closest(".topic-card");
      const topicId = card.getAttribute("data-topic-id");
      const completed = input.checked;
      card.classList.toggle("is-complete", completed);
      const item = card.closest(".path-item");
      const dot = item ? item.querySelector(".topic-node__dot") : null;
      if (dot) dot.classList.toggle("is-complete", completed);

      await RolePathAPI.saveProgress(slug, topicId, completed);
      const updated = await RolePathAPI.getRoadmap(slug);
      renderProgress(updated);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderFeatured();
    renderRoadmapList();
    initRoadmapTabs();
    renderRoadmapDetail();
  });
})();
