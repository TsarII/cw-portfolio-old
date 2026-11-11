const DATA_FILES = [
  ["costumes-additional.json", "Дополняющие"],
  ["costumes-overlapping.json", "Перекрывающие"],
  ["items.json", "Предметы"],
  ["medals.json", "Медали"],
  ["illustrations.json", "Иллюстрации"],
  ["backgrounds-full.json", "Полноценный"],
  ["backgrounds-decoration.json", "Украшение"]
];

const GITHUB_OWNER = "TsarII";
const GITHUB_REPO = "cw-portfolio";
const GITHUB_BRANCH = "main";

const $ = (selector) => document.querySelector(selector);
let visibleWorks = [];
let currentWorkIndex = 0;

function setLink(id, url, label) {
  const el = document.getElementById(id);
  if (!url) return;
  el.href = url;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
  el.textContent = label;
  el.hidden = false;
}

function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return path.replace(/^\.?\//, "");
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
  return response.json();
}

function createArtwork(item, index, allWorks) {
  const button = document.createElement("button");
  button.className = "artwork";
  button.type = "button";
  button.setAttribute("aria-label", `Открыть работу ${item.title || index + 1}`);

  const img = document.createElement("img");
  img.src = assetUrl(item.image);
  img.alt = item.title || item.description || "Работа из портфолио";
  img.loading = "lazy";
  img.decoding = "async";
  button.appendChild(img);

  if (item.title || item.description) {
    const caption = document.createElement("span");
    caption.className = "artwork-caption";
    if (item.title) {
      const title = document.createElement("span");
      title.className = "artwork-title";
      title.textContent = item.title;
      caption.appendChild(title);
    }
    if (item.description) {
      const description = document.createElement("span");
      description.textContent = item.description;
      caption.appendChild(description);
    }
    button.appendChild(caption);
  }

  button.addEventListener("click", () => openLightbox(allWorks, index));
  return button;
}

function makeMasonry(items) {
  const grid = document.createElement("div");
  grid.className = "masonry";
  const sorted = [...items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const allWorks = sorted.filter(item => item.image);
  allWorks.forEach((item, index) => grid.appendChild(createArtwork(item, index, allWorks)));
  if (!allWorks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = "Работы пока не добавлены.";
    grid.appendChild(empty);
  }
  return grid;
}

function addSubsection(parent, title, items) {
  const subsection = document.createElement("section");
  subsection.className = "subsection";
  const heading = document.createElement("h3");
  heading.className = "subsection-title";
  heading.textContent = title;
  subsection.appendChild(heading);
  subsection.appendChild(makeMasonry(items));
  parent.appendChild(subsection);
}

async function renderGallery() {
  const gallery = $("#gallery");
  try {
    const collections = await Promise.all(DATA_FILES.map(async ([file, label]) => ({
      file, label, items: await loadJson(`data/${file}`)
    })));

    gallery.replaceChildren();

    const costumes = document.createElement("section");
    costumes.className = "gallery-section";
    const costumesTitle = document.createElement("h2");
    costumesTitle.className = "section-title";
    costumesTitle.textContent = "Костюмы";
    costumes.appendChild(costumesTitle);
    addSubsection(costumes, "Дополняющие", collections[0].items);
    addSubsection(costumes, "Перекрывающие", collections[1].items);
    gallery.appendChild(costumes);

    const standalone = [
      ["Предметы", collections[2].items],
      ["Медали", collections[3].items],
      ["Иллюстрации", collections[4].items]
    ];
    standalone.forEach(([title, items]) => {
      const section = document.createElement("section");
      section.className = "gallery-section";
      const heading = document.createElement("h2");
      heading.className = "section-title";
      heading.textContent = title;
      section.appendChild(heading);
      section.appendChild(makeMasonry(items));
      gallery.appendChild(section);
    });

    const backgrounds = document.createElement("section");
    backgrounds.className = "gallery-section";
    const backgroundsTitle = document.createElement("h2");
    backgroundsTitle.className = "section-title";
    backgroundsTitle.textContent = "Фоны";
    backgrounds.appendChild(backgroundsTitle);
    addSubsection(backgrounds, "Полноценный", collections[5].items);
    addSubsection(backgrounds, "Украшение", collections[6].items);
    gallery.appendChild(backgrounds);

    visibleWorks = collections.flatMap(c => c.items.filter(item => item.image));
  } catch (error) {
    gallery.innerHTML = '<p class="empty-section">Не удалось загрузить галерею. Проверь, что файлы данных опубликованы вместе с сайтом.</p>';
    console.error(error);
  }
}

function openLightbox(works, index) {
  visibleWorks = works;
  currentWorkIndex = index;
  updateLightbox();
  $("#lightbox").showModal();
}

function updateLightbox() {
  const work = visibleWorks[currentWorkIndex];
  if (!work) return;
  $("#lightbox-image").src = assetUrl(work.image);
  $("#lightbox-image").alt = work.title || work.description || "Работа из портфолио";
  $("#lightbox-caption").textContent = [work.title, work.description].filter(Boolean).join(" — ");
  const multiple = visibleWorks.length > 1;
  $("#lightbox-prev").hidden = !multiple;
  $("#lightbox-next").hidden = !multiple;
}

function moveLightbox(direction) {
  if (!visibleWorks.length) return;
  currentWorkIndex = (currentWorkIndex + direction + visibleWorks.length) % visibleWorks.length;
  updateLightbox();
}

async function loadSiteSettings() {
  try {
    const settings = await loadJson("data/site.json");
    if (settings.logo) {
      $("#logo").src = assetUrl(settings.logo);
      $("#logo").hidden = false;
    }
    setLink("vk-link", settings.vk, "VK");
    setLink("telegram-link", settings.telegram, "TG");
    setLink("catwar-link", settings.catwar, "CW");
    setLink("price-link", settings.price, "Прайс");
    setLink("channel-link", settings.telegram_channel, "ТГК");

    const individual = settings.individual_orders || "не указано";
    const siteOrders = settings.site_orders || "не указано";
    $("#order-status").textContent =
      `Индивидуальные заказы: ${individual} | Сайтовые и фракционные заказы: ${siteOrders}`;
  } catch (error) {
    console.error("Не удалось загрузить настройки сайта:", error);
  }
}

async function loadUpdatedDate() {
  const dateEl = $("#updated-date");
  try {
    const paths = [
      "data/costumes-additional.json",
      "data/costumes-overlapping.json",
      "data/items.json",
      "data/medals.json",
      "data/illustrations.json",
      "data/backgrounds-full.json",
      "data/backgrounds-decoration.json"
    ];
    const commits = await Promise.all(paths.map(async path => {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`;
      const response = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });
      if (!response.ok) throw new Error("GitHub API недоступен");
      const data = await response.json();
      return data[0]?.commit?.committer?.date || data[0]?.commit?.author?.date || null;
    }));
    const latest = commits.filter(Boolean).sort().at(-1);
    if (!latest) throw new Error("Нет опубликованных работ");
    const date = new Date(latest);
    dateEl.dateTime = date.toISOString();
    dateEl.textContent = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Tallinn"
    }).format(date);
  } catch (error) {
    dateEl.textContent = "обновится после публикации";
    console.warn("Не удалось определить дату обновления:", error);
  }
}

$("#lightbox-close").addEventListener("click", () => $("#lightbox").close());
$("#lightbox-prev").addEventListener("click", () => moveLightbox(-1));
$("#lightbox-next").addEventListener("click", () => moveLightbox(1));
$("#lightbox").addEventListener("click", event => {
  if (event.target === $("#lightbox")) $("#lightbox").close();
});
document.addEventListener("keydown", event => {
  if (!$("#lightbox").open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

loadSiteSettings();
renderGallery();
loadUpdatedDate();
