/**
 * RolePath API Service Layer
 * ---------------------------------------------------------
 * Every call the UI makes for data goes through this file.
 * Today it reads /data/roadmaps.json and localStorage.
 * Tomorrow, swap USE_MOCK_DATA to false and point BASE_URL
 * at a running Spring Boot server — nothing else in the
 * codebase needs to change, because every function here
 * already returns the same shape either way.
 *
 * Real endpoints this maps to:
 *   GET  /api/roadmaps
 *   GET  /api/roadmaps/{slug}
 *   POST /api/progress
 *   POST /api/login
 *   POST /api/register
 *   GET  /api/roadmaps/{slug}/topics/{topicId}/videos
 * ---------------------------------------------------------
 */

const RolePathAPI = (() => {
  const BASE_URL = "/api";
  const USE_MOCK_DATA = true;
  const DATA_PATH = "data/roadmaps.json";
  const VIDEOS_DATA_PATH = "data/video-resources.json";
  const PROGRESS_KEY = "rolepath_progress";

  let cache = null;
  let videosCache = null;

  async function loadMockData() {
    if (cache) return cache;
    const res = await fetch(DATA_PATH);
    if (!res.ok) throw new Error("Failed to load roadmap data");
    cache = await res.json();
    return cache;
  }

  async function loadVideoMockData() {
    if (videosCache) return videosCache;
    const res = await fetch(VIDEOS_DATA_PATH);
    if (!res.ok) throw new Error("Failed to load video resource data");
    videosCache = await res.json();
    return videosCache;
  }

  function getProgressStore() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function setProgressStore(store) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  }

  /** GET /api/roadmaps — list of roadmaps with summary info only */
  async function getRoadmaps() {
    if (USE_MOCK_DATA) {
      const data = await loadMockData();
      return Object.values(data).map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        shortTitle: r.shortTitle,
        icon: r.icon,
        description: r.description,
        keyTopics: r.keyTopics,
        topicCount: r.topics.length,
      }));
    }
    const res = await fetch(`${BASE_URL}/roadmaps`);
    return res.json();
  }

  /** GET /api/roadmaps/{slug} — full roadmap with topics */
  async function getRoadmap(slug) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData();
      const roadmap = data[slug];
      if (!roadmap) return null;
      const progress = getProgressStore()[slug] || {};
      return {
        ...roadmap,
        topics: roadmap.topics.map((t) => ({
          ...t,
          completed: !!progress[t.id],
        })),
      };
    }
    const res = await fetch(`${BASE_URL}/roadmaps/${slug}`);
    return res.json();
  }

  /** GET /api/roadmaps/{slug}/topics/{topicId}/videos — a topic's video resources (subtopics + YouTube links) */
  async function getTopicVideoResources(slug, topicId) {
    if (USE_MOCK_DATA) {
      const [roadmapData, videosData] = await Promise.all([loadMockData(), loadVideoMockData()]);
      const roadmap = roadmapData[slug];
      const topic = roadmap ? roadmap.topics.find((t) => t.id === topicId) : null;
      if (!topic) return null;
      const entry = videosData[topicId];
      return {
        roadmapSlug: slug,
        roadmapTitle: roadmap.shortTitle,
        topicId: topic.id,
        topicOrder: topic.order,
        topicTitle: topic.title,
        topicDescription: topic.description,
        subtopics: entry ? entry.subtopics : [],
      };
    }
    const res = await fetch(`${BASE_URL}/roadmaps/${slug}/topics/${topicId}/videos`);
    return res.json();
  }

  /** POST /api/progress — persist a single topic's completion state */
  async function saveProgress(slug, topicId, completed) {
    if (USE_MOCK_DATA) {
      const store = getProgressStore();
      store[slug] = store[slug] || {};
      store[slug][topicId] = completed;
      setProgressStore(store);
      return { slug, topicId, completed };
    }
    const res = await fetch(`${BASE_URL}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, topicId, completed }),
    });
    return res.json();
  }

  /** GET progress summary for a roadmap: { completed, total, percent } */
  async function getProgressSummary(slug) {
    const roadmap = await getRoadmap(slug);
    if (!roadmap) return { completed: 0, total: 0, percent: 0 };
    const total = roadmap.topics.length;
    const completed = roadmap.topics.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  /** POST /api/login — stubbed for future auth wiring */
  async function login(credentials) {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ success: true, mock: true, user: credentials?.email || "guest" });
    }
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return res.json();
  }

  /** POST /api/register — stubbed for future auth wiring */
  async function register(details) {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ success: true, mock: true, user: details?.email || "guest" });
    }
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    return res.json();
  }

  /** POST /api/contact — contact form submission (mocked client-side today) */
  async function sendContactMessage(payload) {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ success: true, mock: true });
    }
    const res = await fetch(`${BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  return {
    getRoadmaps,
    getRoadmap,
    getTopicVideoResources,
    saveProgress,
    getProgressSummary,
    login,
    register,
    sendContactMessage,
  };
})();
