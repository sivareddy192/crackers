export const valideURLConvert = (name) => {
  return name
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric character sequence with a single hyphen
    .replace(/^-+|-+$/g, "");    // Remove leading and trailing hyphens
};
