import { getActiveAlerts } from "@/lib/alerts";

function formatDate(value: Date | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function HomePage() {
  const alerts = await getActiveAlerts().catch(() => []);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-10 md:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/75 p-8 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-surge">Disaster Early Alert System</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink md:text-6xl">
              A live watchtower for insurance operations.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              DEAS monitors Philippine disaster coverage, extracts high-severity incidents,
              and estimates exposed policies at the barangay level.
            </p>
          </div>

          <div className="grid min-w-[240px] gap-3 rounded-[1.5rem] bg-ink p-5 text-white">
            <span className="text-sm uppercase tracking-[0.2em] text-slate-300">Active alerts</span>
            <strong className="text-5xl">{alerts.length}</strong>
            <p className="m-0 text-sm text-slate-300">
              Use <code>POST /api/watcher</code> to run the ingestion flow manually.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 text-2xl font-semibold text-ink">Active Red Alerts</h2>
            <p className="mt-1 text-sm text-slate-500">Most recent alerts detected by the watcher pipeline.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm uppercase tracking-[0.15em] text-slate-500">
                <th className="px-4">Event</th>
                <th className="px-4">Location</th>
                <th className="px-4">Impact Estimate</th>
                <th className="px-4">Detected</th>
                <th className="px-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No alerts yet. Seed the database, set your env vars, and trigger the watcher to populate this view.
                  </td>
                </tr>
              ) : null}

              {alerts.map((alert) => (
                <tr key={alert.id} className="rounded-3xl bg-slate-50 text-sm text-slate-700">
                  <td className="rounded-l-3xl px-4 py-5">
                    <div className="font-semibold text-ink">{alert.headline}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.15em] text-alert">
                      {alert.disasterType}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    {[alert.city, alert.barangay].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-5 font-semibold">{alert.atRiskCount.toLocaleString()}</td>
                  <td className="px-4 py-5">{formatDate(alert.createdAt)}</td>
                  <td className="rounded-r-3xl px-4 py-5">
                    <a
                      className="text-surge underline underline-offset-4"
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open article
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
