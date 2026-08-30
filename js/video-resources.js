/**
 * RolePath — Videos → Video Resources
 * Renders the YouTube video resources for a single roadmap topic.
 * Reads ?path=<java|python>&topic=<topicId> from the URL, looks up the
 * topic (from RolePathAPI.getRoadmap) and its subtopic video list
 * (from RolePathAPI.getTopicVideoResources), then lists them out.
 */
(function () {
  function roadmapUrl(slug) {
    return slug === "python" ? "python-full-stack.html" : "java-full-stack.html";
  }

  function getParams() {
    const params = new URLSearchParams(window.location.search);
    const path = params.get("path") === "python" ? "python" : "java";
    const topic = params.get("topic") || "";
    return { path, topic };
  }

  function youtubeThumb() {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="1.6"/>
        <path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor"/>
      </svg>
    `;
  }

  function videoItemTemplate(subtopic, index) {
    const isPlaceholder = !subtopic.youtubeUrl || subtopic.youtubeUrl === "#";
    return `
      <a class="video-resource-item${isPlaceholder ? " is-placeholder" : ""}"
         href="${subtopic.youtubeUrl || "#"}"
         ${isPlaceholder ? "" : 'target="_blank" rel="noopener noreferrer"'}>
        <span class="video-resource-item__icon" aria-hidden="true">${youtubeThumb()}</span>
        <span class="video-resource-item__body">
          <span class="video-resource-item__label">Video ${index + 1}</span>
          <span class="video-resource-item__title">${subtopic.title}</span>
        </span>
        <span class="video-resource-item__cta">${isPlaceholder ? "Coming soon" : "Watch on YouTube"}</span>
      </a>
    `;
  }

  async function render() {
    const main = document.querySelector("[data-video-resources-page]");
    if (!main) return;
    const { path, topic } = getParams();

    const list = document.querySelector("[data-video-resources-list]");
    if (list) {
      list.innerHTML = `<div class="skeleton-row"><div class="skeleton-card"></div></div>`;
    }

    const data = await RolePathAPI.getTopicVideoResources(path, topic);

    const crumbRoadmap = document.querySelector("[data-video-roadmap-crumb]");
    const crumbTopic = document.querySelector("[data-video-topic-crumb]");
    const titleEl = document.querySelector("[data-video-topic-title]");
    const descEl = document.querySelector("[data-video-topic-desc]");

    if (!data) {
      document.title = "Video Resources · RolePath";
      if (titleEl) titleEl.textContent = "Topic not found";
      if (descEl) descEl.textContent = "We couldn't find video resources for that topic.";
      if (list) {
        list.innerHTML = `<p class="empty-state">This topic doesn't exist. <a href="roadmaps.html">Back to Roadmaps</a></p>`;
      }
      return;
    }

    document.title = `${data.topicTitle} — Video Resources · RolePath`;
    if (crumbRoadmap) {
      crumbRoadmap.textContent = data.roadmapTitle;
      crumbRoadmap.setAttribute("href", roadmapUrl(data.roadmapSlug));
    }
    if (crumbTopic) crumbTopic.textContent = `${data.topicTitle} · Video Resources`;
    if (titleEl) titleEl.textContent = `${data.topicTitle} — Video Resources`;
    if (descEl) descEl.textContent = data.topicDescription;

    if (list) {
      if (!data.subtopics || !data.subtopics.length) {
        list.innerHTML = `<p class="empty-state">No video resources for this topic yet.</p>`;
      } else {
        list.innerHTML = data.subtopics.map((s, i) => videoItemTemplate(s, i)).join("");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", render);
})();
