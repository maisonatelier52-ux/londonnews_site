import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { useRef, useState, type FormEvent } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { recommendedCategories } from "../../../lib/categories/recommended-categories";
import { setNoStore } from "../../../lib/server/api";
import { getSectionPath } from "../../../lib/taxonomy";
import { authOptions } from "../../api/auth/[...nextauth]";
import { canDeleteCategories, canManageCategories } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canManageCategories(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const categories = await prisma.section.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
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
          name: true
        }
      }
    }
  });

  return {
    props: {
      categories: JSON.parse(JSON.stringify(categories)),
      role: session.user.role
    }
  };
};

type CategoryRecord = InferGetServerSidePropsType<typeof getServerSideProps>["categories"][number];
type TaxonomyNode = CategoryRecord & { children: CategoryRecord[] };

function sortCategories(a: CategoryRecord, b: CategoryRecord) {
  return (a.position ?? 999) - (b.position ?? 999) || a.name.localeCompare(b.name);
}

function emptyCategory() {
  return {
    id: "",
    name: "",
    slug: "",
    navLabel: "",
    description: "",
    color: "",
    icon: "",
    isVisible: true,
    showInTopNav: false,
    position: 999,
    premium: false,
    seoTitle: "",
    seoDescription: "",
    seoImage: "",
    parentId: ""
  };
}

export default function CategoriesAdminPage({
  categories: initialCategories,
  role
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [form, setForm] = useState(emptyCategory());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const formSectionRef = useRef<HTMLElement | null>(null);

  const isEditing = Boolean(form.id);
  const canDelete = canDeleteCategories(role);
  const sortedCategories = [...categories].sort(sortCategories);
  const rootCategories = sortedCategories.filter((item: CategoryRecord) => !item.parentId);
  const taxonomyTree: TaxonomyNode[] = rootCategories.map((category) => ({
    ...category,
    children: sortedCategories.filter((item: CategoryRecord) => item.parentId === category.id)
  }));
  const topicCount = sortedCategories.filter((item: CategoryRecord) => Boolean(item.parentId)).length;
  const topNavPreview = rootCategories
    .filter((item: CategoryRecord) => item.isVisible && item.showInTopNav)
    .sort(sortCategories)
    .map((item: CategoryRecord) => item.navLabel || item.name);
  const availableParentCategories = rootCategories.filter(
    (item: CategoryRecord) => item.id !== form.id && item.slug !== "classifieds"
  );

  function resetForm() {
    setForm(emptyCategory());
    setMessage("");
    setError("");
  }

  async function reloadCategories() {
    const response = await fetch("/api/admin/categories");
    const data = await response.json().catch(() => []) as CategoryRecord[];
    if (response.ok) setCategories(data);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/admin/categories/${form.id}` : "/api/admin/categories";

    const payload = {
      ...form,
      position: Number(form.position || 999),
      isVisible: Boolean(form.isVisible),
      showInTopNav: form.parentId ? false : Boolean(form.showInTopNav),
      premium: Boolean(form.premium),
      parentId: form.parentId || null
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setError(data?.error || "Failed to save category.");
      return;
    }

    setMessage(isEditing ? "Category updated." : "Category created.");
    await reloadCategories();
    resetForm();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;

    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error || "Failed to delete category.");
      return;
    }

    setMessage("Category deleted.");
    await reloadCategories();
    if (form.id === id) resetForm();
  }

  function loadCategory(category: CategoryRecord) {
    setForm({
      id: category.id,
      name: category.name || "",
      slug: category.slug || "",
      navLabel: category.navLabel || "",
      description: category.description || "",
      color: category.color || "",
      icon: category.icon || "",
      isVisible: Boolean(category.isVisible),
      showInTopNav: Boolean(category.showInTopNav) && !category.parentId,
      position: category.position ?? 999,
      premium: Boolean(category.premium),
      seoTitle: category.seoTitle || "",
      seoDescription: category.seoDescription || "",
      seoImage: category.seoImage || "",
      parentId: category.parentId || ""
    });
    setMessage("");
    setError("");
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function seedRecommended() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const knownCategoryIds = new Map(categories.map((category) => [category.slug, category.id]));
      const orderedCategories = [...recommendedCategories].sort(
        (a, b) =>
          Number(Boolean(a.parentSlug)) - Number(Boolean(b.parentSlug)) ||
          a.position - b.position ||
          a.name.localeCompare(b.name)
      );

      for (const category of orderedCategories) {
        const existingId = knownCategoryIds.get(category.slug);
        const response = await fetch(existingId ? `/api/admin/categories/${existingId}` : "/api/admin/categories", {
          method: existingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...category,
            parentId: category.parentSlug ? knownCategoryIds.get(category.parentSlug) || "" : ""
          })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || `Failed to sync ${category.name}.`);
        }

        if (data?.slug && data?.id) {
          knownCategoryIds.set(data.slug, data.id);
        }
      }

      setMessage("Recommended taxonomy synced.");
      await reloadCategories();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sync the recommended taxonomy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Taxonomy</p>
              <h1 className="mt-3 font-news text-5xl text-zinc-950">London News categories</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
                Manage the editorial desk structure, control top-nav visibility, and tune section-level SEO and discovery.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={seedRecommended}
                disabled={saving}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
              >
                Seed recommended set
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
              >
                New category
              </button>
            </div>
          </div>

          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Top-nav preview</p>
              <h2 className="mt-2 font-news text-3xl text-zinc-950">Live navigation order</h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-700">
            {topNavPreview.length > 0 ? (
              topNavPreview.map((item: string) => (
                <span key={item} className="rounded-full border border-zinc-300 px-3 py-2">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-zinc-500">No categories marked for top nav yet.</span>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Primary desks" value={String(rootCategories.length)} helper="Top-level editorial sections" />
          <SummaryCard label="Topic pages" value={String(topicCount)} helper="Child pages under major desks" />
          <SummaryCard label="Top-nav desks" value={String(topNavPreview.length)} helper="Visible in the live header" />
          <SummaryCard
            label="Dedicated routes"
            value={String(rootCategories.filter((category: CategoryRecord) => category.slug === "classifieds").length)}
            helper="Special public section handling"
          />
        </section>

        <div className="grid grid-cols-1 gap-8">
          <section ref={formSectionRef} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="border-b border-zinc-200 pb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {isEditing ? "Edit category" : "Create category"}
              </p>
              <h2 className="mt-2 font-news text-3xl text-zinc-950">
                {isEditing ? form.name || "Category" : "New category"}
              </h2>
            </div>

            <form className="mt-5 space-y-4" onSubmit={saveCategory}>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nav label</span>
                  <input
                    value={form.navLabel}
                    onChange={(event) => setForm({ ...form, navLabel: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Position</span>
                  <input
                    type="number"
                    value={form.position}
                    onChange={(event) => setForm({ ...form, position: Number(event.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="min-h-[90px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Color</span>
                  <input
                    value={form.color}
                    onChange={(event) => setForm({ ...form, color: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="#14532d"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Icon</span>
                  <input
                    value={form.icon}
                    onChange={(event) => setForm({ ...form, icon: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="leaf / briefcase / train"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Parent category</span>
                <select
                  value={form.parentId}
                  onChange={(event) => setForm({ ...form, parentId: event.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="">No parent</option>
                  {availableParentCategories.map((category: CategoryRecord) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isVisible)}
                    onChange={(event) => setForm({ ...form, isVisible: event.target.checked })}
                  />
                  <span className="text-sm text-zinc-700">Visible</span>
                </label>
                <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.showInTopNav)}
                    disabled={Boolean(form.parentId)}
                    onChange={(event) => setForm({ ...form, showInTopNav: event.target.checked })}
                  />
                  <span className="text-sm text-zinc-700">Show in top nav</span>
                </label>
                <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.premium)}
                    onChange={(event) => setForm({ ...form, premium: event.target.checked })}
                  />
                  <span className="text-sm text-zinc-700">Premium section</span>
                </label>
              </div>

              {form.parentId ? (
                <p className="text-xs leading-6 text-zinc-500">
                  Topic pages inherit navigation from their parent desk and are hidden from the primary top nav automatically.
                </p>
              ) : null}

              <div className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO</p>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO title</span>
                    <input
                      value={form.seoTitle}
                      onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO description</span>
                    <textarea
                      value={form.seoDescription}
                      onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
                      className="min-h-[84px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO image URL</span>
                    <input
                      value={form.seoImage}
                      onChange={(event) => setForm({ ...form, seoImage: event.target.value })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : isEditing ? "Update category" : "Create category"}
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Current categories</p>
                <h2 className="mt-2 font-news text-3xl text-zinc-950">Editorial taxonomy tree</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {taxonomyTree.map((category: TaxonomyNode) => (
                <article key={category.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-zinc-950">{category.name}</h3>
                        {category.showInTopNav ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                            Top nav
                          </span>
                        ) : null}
                        {!category.isVisible ? (
                          <span className="rounded-full bg-zinc-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-700">
                            Hidden
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-sm text-zinc-600">
                        {getSectionPath({ slug: category.slug })}
                        {category.navLabel ? ` • Nav: ${category.navLabel}` : ""}
                        {category.slug === "classifieds" ? " • Dedicated public section" : ""}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
                        <span>{category._count.articles} articles</span>
                        <span>{category._count.children} children</span>
                        <span>Position {category.position}</span>
                      </div>

                      {category.description ? (
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">{category.description}</p>
                      ) : null}

                      {category.children.length > 0 ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {category.children.map((topic: CategoryRecord) => (
                            <div key={topic.id} className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Topic page</p>
                                  <h4 className="mt-2 text-base font-semibold text-zinc-950">{topic.name}</h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => loadCategory(topic)}
                                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
                                >
                                  Edit
                                </button>
                              </div>

                              <p className="mt-2 text-sm text-zinc-600">
                                {getSectionPath({ slug: topic.slug, parentId: topic.parentId })}
                                {topic.navLabel ? ` • Nav: ${topic.navLabel}` : ""}
                              </p>

                              {topic.description ? (
                                <p className="mt-3 text-sm leading-7 text-zinc-700">{topic.description}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loadCategory(category)}
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
                      >
                        Edit
                      </button>

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}

              {taxonomyTree.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
                  No categories created yet.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-5 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 font-news text-4xl text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{helper}</p>
    </div>
  );
}


// import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
// import { getServerSession } from "next-auth/next";
// import { useState, type FormEvent } from "react";
// import AdminLayout from "../../../components/AdminLayout";
// import { recommendedCategories } from "../../../lib/categories/recommended-categories";
// import { setNoStore } from "../../../lib/server/api";
// import { getSectionPath } from "../../../lib/taxonomy";
// import { authOptions } from "../../api/auth/[...nextauth]";
// import { canDeleteCategories, canManageCategories } from "../../../utils/auth";
// import { prisma } from "../../../utils/prisma";

// export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
//   setNoStore(res);
//   const session = await getServerSession(req, res, authOptions);
//   if (!session?.user) {
//     return { redirect: { destination: "/login", permanent: false } };
//   }

//   if (!canManageCategories(session.user.role)) {
//     return { redirect: { destination: "/admin", permanent: false } };
//   }

//   const categories = await prisma.section.findMany({
//     orderBy: [{ position: "asc" }, { name: "asc" }],
//     include: {
//       _count: {
//         select: {
//           articles: true,
//           children: true
//         }
//       },
//       parent: {
//         select: {
//           id: true,
//           name: true
//         }
//       }
//     }
//   });

//   return {
//     props: {
//       categories: JSON.parse(JSON.stringify(categories)),
//       role: session.user.role
//     }
//   };
// };

// type CategoryRecord = InferGetServerSidePropsType<typeof getServerSideProps>["categories"][number];
// type TaxonomyNode = CategoryRecord & { children: CategoryRecord[] };

// function sortCategories(a: CategoryRecord, b: CategoryRecord) {
//   return (a.position ?? 999) - (b.position ?? 999) || a.name.localeCompare(b.name);
// }

// function emptyCategory() {
//   return {
//     id: "",
//     name: "",
//     slug: "",
//     navLabel: "",
//     description: "",
//     color: "",
//     icon: "",
//     isVisible: true,
//     showInTopNav: false,
//     position: 999,
//     premium: false,
//     seoTitle: "",
//     seoDescription: "",
//     seoImage: "",
//     parentId: ""
//   };
// }

// export default function CategoriesAdminPage({
//   categories: initialCategories,
//   role
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//   const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
//   const [form, setForm] = useState(emptyCategory());
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");

//   const isEditing = Boolean(form.id);
//   const canDelete = canDeleteCategories(role);
//   const sortedCategories = [...categories].sort(sortCategories);
//   const rootCategories = sortedCategories.filter((item: CategoryRecord) => !item.parentId);
//   const taxonomyTree: TaxonomyNode[] = rootCategories.map((category) => ({
//     ...category,
//     children: sortedCategories.filter((item: CategoryRecord) => item.parentId === category.id)
//   }));
//   const topicCount = sortedCategories.filter((item: CategoryRecord) => Boolean(item.parentId)).length;
//   const topNavPreview = rootCategories
//     .filter((item: CategoryRecord) => item.isVisible && item.showInTopNav)
//     .sort(sortCategories)
//     .map((item: CategoryRecord) => item.navLabel || item.name);
//   const availableParentCategories = rootCategories.filter(
//     (item: CategoryRecord) => item.id !== form.id && item.slug !== "classifieds"
//   );

//   function resetForm() {
//     setForm(emptyCategory());
//     setMessage("");
//     setError("");
//   }

//   async function reloadCategories() {
//     const response = await fetch("/api/admin/categories");
//     const data = await response.json().catch(() => []) as CategoryRecord[];
//     if (response.ok) setCategories(data);
//   }

//   async function saveCategory(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setSaving(true);
//     setMessage("");
//     setError("");

//     const method = isEditing ? "PUT" : "POST";
//     const url = isEditing ? `/api/admin/categories/${form.id}` : "/api/admin/categories";

//     const payload = {
//       ...form,
//       position: Number(form.position || 999),
//       isVisible: Boolean(form.isVisible),
//       showInTopNav: form.parentId ? false : Boolean(form.showInTopNav),
//       premium: Boolean(form.premium),
//       parentId: form.parentId || null
//     };

//     const response = await fetch(url, {
//       method,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload)
//     });

//     const data = await response.json().catch(() => null);
//     setSaving(false);

//     if (!response.ok) {
//       setError(data?.error || "Failed to save category.");
//       return;
//     }

//     setMessage(isEditing ? "Category updated." : "Category created.");
//     await reloadCategories();
//     resetForm();
//   }

//   async function deleteCategory(id: string) {
//     if (!window.confirm("Delete this category?")) return;

//     const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
//     const data = await response.json().catch(() => null);

//     if (!response.ok) {
//       setError(data?.error || "Failed to delete category.");
//       return;
//     }

//     setMessage("Category deleted.");
//     await reloadCategories();
//     if (form.id === id) resetForm();
//   }

//   function loadCategory(category: CategoryRecord) {
//     setForm({
//       id: category.id,
//       name: category.name || "",
//       slug: category.slug || "",
//       navLabel: category.navLabel || "",
//       description: category.description || "",
//       color: category.color || "",
//       icon: category.icon || "",
//       isVisible: Boolean(category.isVisible),
//       showInTopNav: Boolean(category.showInTopNav) && !category.parentId,
//       position: category.position ?? 999,
//       premium: Boolean(category.premium),
//       seoTitle: category.seoTitle || "",
//       seoDescription: category.seoDescription || "",
//       seoImage: category.seoImage || "",
//       parentId: category.parentId || ""
//     });
//     setMessage("");
//     setError("");
//   }

//   async function seedRecommended() {
//     setSaving(true);
//     setMessage("");
//     setError("");

//     try {
//       const knownCategoryIds = new Map(categories.map((category) => [category.slug, category.id]));
//       const orderedCategories = [...recommendedCategories].sort(
//         (a, b) =>
//           Number(Boolean(a.parentSlug)) - Number(Boolean(b.parentSlug)) ||
//           a.position - b.position ||
//           a.name.localeCompare(b.name)
//       );

//       for (const category of orderedCategories) {
//         const existingId = knownCategoryIds.get(category.slug);
//         const response = await fetch(existingId ? `/api/admin/categories/${existingId}` : "/api/admin/categories", {
//           method: existingId ? "PUT" : "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             ...category,
//             parentId: category.parentSlug ? knownCategoryIds.get(category.parentSlug) || "" : ""
//           })
//         });

//         const data = await response.json().catch(() => null);

//         if (!response.ok) {
//           throw new Error(data?.error || `Failed to sync ${category.name}.`);
//         }

//         if (data?.slug && data?.id) {
//           knownCategoryIds.set(data.slug, data.id);
//         }
//       }

//       setMessage("Recommended taxonomy synced.");
//       await reloadCategories();
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Failed to sync the recommended taxonomy.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <AdminLayout>
//       <div className="space-y-8">
//         <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
//           <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//             <div>
//               <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Taxonomy</p>
//               <h1 className="mt-3 font-news text-5xl text-zinc-950">London News categories</h1>
//               <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
//                 Manage the editorial desk structure, control top-nav visibility, and tune section-level SEO and discovery.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <button
//                 type="button"
//                 onClick={seedRecommended}
//                 disabled={saving}
//                 className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
//               >
//                 Seed recommended set
//               </button>
//               <button
//                 type="button"
//                 onClick={resetForm}
//                 className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
//               >
//                 New category
//               </button>
//             </div>
//           </div>

//           {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
//           {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
//         </section>

//         <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
//           <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
//             <div>
//               <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Top-nav preview</p>
//               <h2 className="mt-2 font-news text-3xl text-zinc-950">Live navigation order</h2>
//             </div>
//           </div>

//           <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-700">
//             {topNavPreview.length > 0 ? (
//               topNavPreview.map((item: string) => (
//                 <span key={item} className="rounded-full border border-zinc-300 px-3 py-2">
//                   {item}
//                 </span>
//               ))
//             ) : (
//               <span className="text-zinc-500">No categories marked for top nav yet.</span>
//             )}
//           </div>
//         </section>

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <SummaryCard label="Primary desks" value={String(rootCategories.length)} helper="Top-level editorial sections" />
//           <SummaryCard label="Topic pages" value={String(topicCount)} helper="Child pages under major desks" />
//           <SummaryCard label="Top-nav desks" value={String(topNavPreview.length)} helper="Visible in the live header" />
//           <SummaryCard
//             label="Dedicated routes"
//             value={String(rootCategories.filter((category: CategoryRecord) => category.slug === "classifieds").length)}
//             helper="Special public section handling"
//           />
//         </section>

//         <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
//           <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
//             <div className="border-b border-zinc-200 pb-4">
//               <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
//                 {isEditing ? "Edit category" : "Create category"}
//               </p>
//               <h2 className="mt-2 font-news text-3xl text-zinc-950">
//                 {isEditing ? form.name || "Category" : "New category"}
//               </h2>
//             </div>

//             <form className="mt-5 space-y-4" onSubmit={saveCategory}>
//               <label className="block">
//                 <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Name</span>
//                 <input
//                   value={form.name}
//                   onChange={(event) => setForm({ ...form, name: event.target.value })}
//                   className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                 />
//               </label>

//               <label className="block">
//                 <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Slug</span>
//                 <input
//                   value={form.slug}
//                   onChange={(event) => setForm({ ...form, slug: event.target.value })}
//                   className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                 />
//               </label>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <label className="block">
//                   <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nav label</span>
//                   <input
//                     value={form.navLabel}
//                     onChange={(event) => setForm({ ...form, navLabel: event.target.value })}
//                     className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                   />
//                 </label>

//                 <label className="block">
//                   <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Position</span>
//                   <input
//                     type="number"
//                     value={form.position}
//                     onChange={(event) => setForm({ ...form, position: Number(event.target.value) })}
//                     className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                   />
//                 </label>
//               </div>

//               <label className="block">
//                 <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Description</span>
//                 <textarea
//                   value={form.description}
//                   onChange={(event) => setForm({ ...form, description: event.target.value })}
//                   className="min-h-[90px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                 />
//               </label>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <label className="block">
//                   <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Color</span>
//                   <input
//                     value={form.color}
//                     onChange={(event) => setForm({ ...form, color: event.target.value })}
//                     className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                     placeholder="#14532d"
//                   />
//                 </label>

//                 <label className="block">
//                   <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Icon</span>
//                   <input
//                     value={form.icon}
//                     onChange={(event) => setForm({ ...form, icon: event.target.value })}
//                     className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                     placeholder="leaf / briefcase / train"
//                   />
//                 </label>
//               </div>

//               <label className="block">
//                 <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Parent category</span>
//                 <select
//                   value={form.parentId}
//                   onChange={(event) => setForm({ ...form, parentId: event.target.value })}
//                   className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                 >
//                   <option value="">No parent</option>
//                   {availableParentCategories.map((category: CategoryRecord) => (
//                     <option key={category.id} value={category.id}>
//                       {category.name}
//                     </option>
//                   ))}
//                 </select>
//               </label>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
//                   <input
//                     type="checkbox"
//                     checked={Boolean(form.isVisible)}
//                     onChange={(event) => setForm({ ...form, isVisible: event.target.checked })}
//                   />
//                   <span className="text-sm text-zinc-700">Visible</span>
//                 </label>
//                 <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
//                   <input
//                     type="checkbox"
//                     checked={Boolean(form.showInTopNav)}
//                     disabled={Boolean(form.parentId)}
//                     onChange={(event) => setForm({ ...form, showInTopNav: event.target.checked })}
//                   />
//                   <span className="text-sm text-zinc-700">Show in top nav</span>
//                 </label>
//                 <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 md:col-span-2">
//                   <input
//                     type="checkbox"
//                     checked={Boolean(form.premium)}
//                     onChange={(event) => setForm({ ...form, premium: event.target.checked })}
//                   />
//                   <span className="text-sm text-zinc-700">Premium section</span>
//                 </label>
//               </div>

//               {form.parentId ? (
//                 <p className="text-xs leading-6 text-zinc-500">
//                   Topic pages inherit navigation from their parent desk and are hidden from the primary top nav automatically.
//                 </p>
//               ) : null}

//               <div className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
//                 <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO</p>

//                 <div className="mt-4 space-y-4">
//                   <label className="block">
//                     <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO title</span>
//                     <input
//                       value={form.seoTitle}
//                       onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
//                       className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                     />
//                   </label>

//                   <label className="block">
//                     <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO description</span>
//                     <textarea
//                       value={form.seoDescription}
//                       onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
//                       className="min-h-[84px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                     />
//                   </label>

//                   <label className="block">
//                     <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO image URL</span>
//                     <input
//                       value={form.seoImage}
//                       onChange={(event) => setForm({ ...form, seoImage: event.target.value })}
//                       className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//                     />
//                   </label>
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-2">
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
//                 >
//                   {saving ? "Saving..." : isEditing ? "Update category" : "Create category"}
//                 </button>

//                 {isEditing ? (
//                   <button
//                     type="button"
//                     onClick={resetForm}
//                     className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
//                   >
//                     Cancel edit
//                   </button>
//                 ) : null}
//               </div>
//             </form>
//           </section>

//           <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
//             <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
//               <div>
//                 <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Current categories</p>
//                 <h2 className="mt-2 font-news text-3xl text-zinc-950">Editorial taxonomy tree</h2>
//               </div>
//             </div>

//             <div className="mt-5 space-y-4">
//               {taxonomyTree.map((category: TaxonomyNode) => (
//                 <article key={category.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
//                   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                     <div>
//                       <div className="flex flex-wrap items-center gap-3">
//                         <h3 className="text-lg font-semibold text-zinc-950">{category.name}</h3>
//                         {category.showInTopNav ? (
//                           <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
//                             Top nav
//                           </span>
//                         ) : null}
//                         {!category.isVisible ? (
//                           <span className="rounded-full bg-zinc-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-700">
//                             Hidden
//                           </span>
//                         ) : null}
//                       </div>

//                       <div className="mt-2 text-sm text-zinc-600">
//                         {getSectionPath({ slug: category.slug })}
//                         {category.navLabel ? ` • Nav: ${category.navLabel}` : ""}
//                         {category.slug === "classifieds" ? " • Dedicated public section" : ""}
//                       </div>

//                       <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
//                         <span>{category._count.articles} articles</span>
//                         <span>{category._count.children} children</span>
//                         <span>Position {category.position}</span>
//                       </div>

//                       {category.description ? (
//                         <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">{category.description}</p>
//                       ) : null}

//                       {category.children.length > 0 ? (
//                         <div className="mt-4 grid gap-3 md:grid-cols-2">
//                           {category.children.map((topic: CategoryRecord) => (
//                             <div key={topic.id} className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
//                               <div className="flex items-center justify-between gap-3">
//                                 <div>
//                                   <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Topic page</p>
//                                   <h4 className="mt-2 text-base font-semibold text-zinc-950">{topic.name}</h4>
//                                 </div>
//                                 <button
//                                   type="button"
//                                   onClick={() => loadCategory(topic)}
//                                   className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
//                                 >
//                                   Edit
//                                 </button>
//                               </div>

//                               <p className="mt-2 text-sm text-zinc-600">
//                                 {getSectionPath({ slug: topic.slug, parentId: topic.parentId })}
//                                 {topic.navLabel ? ` • Nav: ${topic.navLabel}` : ""}
//                               </p>

//                               {topic.description ? (
//                                 <p className="mt-3 text-sm leading-7 text-zinc-700">{topic.description}</p>
//                               ) : null}
//                             </div>
//                           ))}
//                         </div>
//                       ) : null}
//                     </div>

//                     <div className="flex flex-wrap gap-2">
//                       <button
//                         type="button"
//                         onClick={() => loadCategory(category)}
//                         className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
//                       >
//                         Edit
//                       </button>

//                       {canDelete ? (
//                         <button
//                           type="button"
//                           onClick={() => deleteCategory(category.id)}
//                           className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700"
//                         >
//                           Delete
//                         </button>
//                       ) : null}
//                     </div>
//                   </div>
//                 </article>
//               ))}

//               {taxonomyTree.length === 0 ? (
//                 <div className="rounded-[1.5rem] border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
//                   No categories created yet.
//                 </div>
//               ) : null}
//             </div>
//           </section>
//         </div>
//       </div>
//     </AdminLayout>
//   );
// }

// function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
//   return (
//     <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-5 shadow-sm">
//       <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
//       <p className="mt-3 font-news text-4xl text-zinc-950">{value}</p>
//       <p className="mt-2 text-sm leading-6 text-zinc-600">{helper}</p>
//     </div>
//   );
// }
