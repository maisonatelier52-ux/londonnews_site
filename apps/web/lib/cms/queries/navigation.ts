import { defaultTopNavItems } from "../../categories/recommended-categories";
import { getTopNavCategories } from "../../categories/queries";
import { getSectionPath } from "../../taxonomy";

export async function getDynamicTopNav() {
  try {
    const categories = await getTopNavCategories();

    if (categories.length === 0) {
      return defaultTopNavItems;
    }

    return [
      ...categories.map((category) => ({
        label: category.navLabel || category.name,
        href: getSectionPath(category),
        children: (category.children || []).map((topic) => ({
          label: topic.navLabel || topic.name,
          href: getSectionPath(topic)
        }))
      })),
      {
        label: "More",
        href: "/sections"
      }
    ];
  } catch {
    return defaultTopNavItems;
  }
}
