import { useEffect, useRef, useState } from "react";

type PickerArticle = {
  id: string;
  title: string;
  section: string;
  slug: string;
  heroImage?: string | null;
  publishedAt?: string;
};

export function ArticlePicker({
  onSelect,
}: {
  onSelect: (article: PickerArticle) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function runSearch(term: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/article-picker?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setResults(data);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // Live-search as the admin types: debounce so we're not firing a request on
  // every keystroke, then show a dropdown of matching articles to pick from.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close the dropdown when clicking outside the picker.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(article: PickerArticle) {
    onSelect(article);
    setShowDropdown(false);
    setQuery(article.title);
  }

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-zinc-200 bg-stone-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search published articles by title, section, or slug"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setShowDropdown(true);
            runSearch(query.trim());
          }}
          className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
          {results.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => handleSelect(article)}
              className="block w-full rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-zinc-950 hover:bg-stone-50"
            >
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{article.section}</div>
              <div className="mt-1 text-sm font-semibold text-zinc-950">{article.title}</div>
              <div className="mt-1 text-xs text-zinc-500">/{article.slug}</div>
            </button>
          ))}

          {!loading && results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-zinc-500">
              {query.trim() ? "No matching articles." : "Start typing to search for a story to pin into this slot."}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// import { useState } from "react";

// type PickerArticle = {
//   id: string;
//   title: string;
//   section: string;
//   slug: string;
//   heroImage?: string | null;
//   publishedAt?: string;
// };

// export function ArticlePicker({
//   onSelect,
// }: {
//   onSelect: (article: PickerArticle) => void;
// }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<PickerArticle[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function search() {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await fetch(`/api/admin/article-picker?q=${encodeURIComponent(query)}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.error || "Search failed");
//       setResults(data);
//     } catch (e: any) {
//       setError(e?.message || "Search failed");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="rounded-2xl border border-zinc-200 bg-stone-50 p-3">
//       <div className="flex flex-col gap-2 sm:flex-row">
//         <input
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search published articles by title, section, or slug"
//           className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
//         />
//         <button
//           type="button"
//           onClick={search}
//           className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
//         >
//           {loading ? "Searching..." : "Search"}
//         </button>
//       </div>

//       {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

//       <div className="mt-3 max-h-56 space-y-2 overflow-auto">
//         {results.map((article) => (
//           <button
//             key={article.id}
//             type="button"
//             onClick={() => onSelect(article)}
//             className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left transition hover:border-zinc-950"
//           >
//             <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{article.section}</div>
//             <div className="mt-1 text-sm font-semibold text-zinc-950">{article.title}</div>
//             <div className="mt-1 text-xs text-zinc-500">/{article.slug}</div>
//           </button>
//         ))}

//         {!loading && results.length === 0 ? (
//           <p className="text-sm text-zinc-500">Search for a story to pin into this slot.</p>
//         ) : null}
//       </div>
//     </div>
//   );
// }
