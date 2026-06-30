import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <label className="flex h-10 w-full items-center gap-3 rounded-full border border-black/8 bg-white px-4 text-sm text-slate-500 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)]">
      <Search className="size-4 shrink-0 text-slate-400" />
      <input
        type="search"
        placeholder="Search workspace"
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
