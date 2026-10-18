import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Sale } from "@/lib/phone-store";
import { PageHeader, SalesTable, DetailModal } from "@/lib/phone-ui";
import { useAppSelector } from "../store";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "IMEI Search — PhoneTrack" }] }),
  component: SearchView,
});

function SearchView() {
  const sales = useAppSelector((state) => state.phoneSales.items);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);

  const results = useMemo(() => {
    if (!q.trim()) return sales;
    const s = q.toLowerCase();
    return sales.filter((x) =>
      x.imei.toLowerCase().includes(s) ||
      x.customerName.toLowerCase().includes(s) ||
      x.customerPhone.toLowerCase().includes(s) ||
      x.invoiceNumber.toLowerCase().includes(s)
    );
  }, [q, sales]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto py-4 md:py-6">
      <PageHeader title="IMEI Search" subtitle="Find sales by IMEI, customer, phone or invoice number" />
      <div className="bg-card rounded-xl border p-4 mb-4">
        <div className="relative">
          <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Type IMEI, name, phone, or invoice..."
            className="w-full pl-10 pr-4 py-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground mt-2">{results.length} result{results.length !== 1 ? "s" : ""}</div>
      </div>
      <div className="bg-card rounded-xl border">
        <SalesTable sales={results} onSelect={setSelected} />
      </div>
      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
