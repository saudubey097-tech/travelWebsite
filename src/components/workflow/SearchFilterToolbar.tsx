export interface FilterField {
  name: string;
  label: string;
  type: "text" | "select" | "date";
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

/** Plain GET-form filter bar — filters live in the URL, so results are
 *  shareable/bookmarkable and work without client JS. */
export function SearchFilterToolbar({ fields, action }: { fields: FilterField[]; action?: string }) {
  return (
    <form className="mb-8 flex flex-wrap items-end gap-3 border-b border-line pb-6" method="get" action={action}>
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">{f.label}</span>
          {f.type === "select" ? (
            <select name={f.name} defaultValue={f.defaultValue ?? ""} className="input">
              <option value="">All</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input type={f.type} name={f.name} defaultValue={f.defaultValue ?? ""} className="input" />
          )}
        </label>
      ))}
      <button type="submit" className="rounded-sm bg-pine px-4 py-2.5 font-body text-sm text-paper">
        Filter
      </button>
    </form>
  );
}
