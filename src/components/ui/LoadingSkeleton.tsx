export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-md border border-line bg-paper p-5" aria-hidden>
      <div className="h-3 w-24 rounded bg-sand" />
      <div className="mt-3 h-5 w-40 rounded bg-sand" />
      <div className="mt-4 h-3 w-full rounded bg-sand" />
      <div className="mt-2 h-3 w-2/3 rounded bg-sand" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse border-b border-line/70" aria-hidden>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <div className="h-3.5 w-full max-w-[10rem] rounded bg-sand" />
        </td>
      ))}
    </tr>
  );
}
