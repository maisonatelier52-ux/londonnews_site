import { prisma } from "../../utils/prisma";

export async function getVisibleCategories() {
  return prisma.section.findMany({
    where: { isVisible: true },
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: "APPROVED",
              publishedAt: { not: null }
            }
          },
          children: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
          navLabel: true
        }
      }
    },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });
}

export async function getVisibleCategoryTree() {
  return prisma.section.findMany({
    where: {
      isVisible: true,
      parentId: null
    },
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: "APPROVED",
              publishedAt: { not: null }
            }
          },
          children: true
        }
      },
      children: {
        where: { isVisible: true },
        include: {
          _count: {
            select: {
              articles: {
                where: {
                  status: "APPROVED",
                  publishedAt: { not: null }
                }
              }
            }
          }
        },
        orderBy: [{ position: "asc" }, { name: "asc" }]
      }
    },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });
}

export async function getTopNavCategories() {
  return prisma.section.findMany({
    where: {
      isVisible: true,
      showInTopNav: true,
      parentId: null
    },
    include: {
      children: {
        where: { isVisible: true },
        select: {
          id: true,
          name: true,
          slug: true,
          navLabel: true,
          description: true,
          parentId: true
        },
        orderBy: [{ position: "asc" }, { name: "asc" }]
      }
    },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });
}

export async function getCategoryById(id: string) {
  return prisma.section.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          articles: true,
          children: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}
