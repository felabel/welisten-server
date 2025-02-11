import fs from "fs";
const categoriesFile = "./data/categories.json";

export const readCategories = () => {
  try {
    if (!fs.existsSync(categoriesFile)) {
      fs.writeFileSync(categoriesFile, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(categoriesFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading categories file:", err);
    return [];
  }
};
