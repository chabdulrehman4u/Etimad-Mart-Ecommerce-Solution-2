export function replaceBulletsWithCheck(html) {
  if (!html) return "";
  const customIcon = `<img src="/custom-bullet.png" alt="icon" style="width:16px;height:16px;display:inline;margin-right:8px;vertical-align:middle;" />`;

  // Use DOMParser to parse the HTML string
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;

    // Increase font size for all <h2> elements
    const h2Elements = root.querySelectorAll("h2");
    h2Elements.forEach((h2) => {
      h2.style.fontSize = "20px"; // Or any size you prefer
    });

  // Remove default bullets/numbers for ALL lists so only checks show
  const allLists = root.querySelectorAll("ul, ol");
  allLists.forEach((list) => {
    list.style.listStyleType = "none";
    list.style.paddingLeft = "0"; // counteract default indent from prose
    list.style.marginLeft = "0";
  });

  // Prepend check icon to EVERY list item
  const allLis = root.querySelectorAll("li");
  allLis.forEach((li) => {
    const trimmed = li.innerHTML.trim();
    if (!trimmed.startsWith(customIcon)) {
      li.innerHTML = customIcon + li.innerHTML;
    }
  });

  return root.innerHTML;
}
