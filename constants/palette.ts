const paletteColors = {
  darkteal: "#004e5f",
  raspberry: "#7c406f",
  green: "#5d956f",
  paleblue: "#9ab8cb",
  blue: "#4871bf",
  orange: "#cb6158",
  lightpink: "#c7a7b4",
  darkblue: "#073570",
  darkpink: "#ab4e66",
  lavender: "#7f85a9",
  yellow: "#ccb479",
  purple: "#594176",
  lightblue: "#5a99b7",
  lightgreen: "#97b386",
  red: "#802f3e",
  teal: "#00827f",
  lightbg: "#B8D4D3",
  tan: "#D4896C",
} as const;

const categoryColors: Record<string, string> = {
  "Commentary": "#4871bf",
  "Tanakh": "#00827f",
  "Midrash": "#5d956f",
  "Mishnah": "#5a99b7",
  "Talmud": "#ccb479",
  "Halakhah": "#802f3e",
  "Kabbalah": "#594176",
  "Jewish Thought": "#7f85a9",
  "Liturgy": "#c7a7b4",
  "Tosefta": "#97b386",
  "Chasidut": "#5d956f",
  "Musar": "#594176",
  "Responsa": "#802f3e",
  "Second Temple": "#ab4e66",
  "Targum": "#5d956f",
  "Modern Commentary": "#4871bf",
  "Reference": "#cb6158",
};

function categoryColor(cat: string | undefined): string {
  if (cat && cat in categoryColors) {
    return categoryColors[cat];
  }

  // For unknown categories, map the string to a color (random, but stable)
  const colors = Object.values(paletteColors);
  let idx = 0;
  const categoryString = typeof cat === "string" ? cat : "";
  categoryString.split("").forEach((letter) => {
    idx += letter.charCodeAt(0);
  });
  idx = idx % colors.length;

  return colors[idx];
}

function randomColor(): string {
  const colors = Object.values(paletteColors);
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
}

const palette = {
  colors: paletteColors,
  categoryColors,
  categoryColor,
  randomColor,
};

export default palette;
