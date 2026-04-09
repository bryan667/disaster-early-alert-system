import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPool } from "@/lib/db";

const HOTSPOTS = [
  { city: "Quezon City", barangays: ["Batasan Hills", "Bagong Silangan", "Commonwealth"] },
  { city: "Manila", barangays: ["Tondo", "Ermita", "Sampaloc"] },
  { city: "Makati", barangays: ["Poblacion", "Bel-Air", "Bangkal"] },
  { city: "Imus", barangays: ["Alapan I-A", "Bucandala III", "Malagasang I-G"] },
  { city: "Bacoor", barangays: ["Molino III", "Talaba V", "Salinas I"] },
  { city: "Naga", barangays: ["Concepcion Grande", "Pacol", "Sabang"] },
] as const;

async function main() {
  const pool = getPool();
  const schema = await readFile(join(process.cwd(), "db", "schema.sql"), "utf8");
  await pool.query(schema);
  await pool.query("TRUNCATE TABLE processed_feed_items, disaster_events, policyholders");

  const totalRecords = 10000;
  const batchSize = 500;

  for (let start = 0; start < totalRecords; start += batchSize) {
    const values: string[] = [];
    const params: string[] = [];
    const end = Math.min(start + batchSize, totalRecords);

    for (let index = start; index < end; index += 1) {
      const hotspot = HOTSPOTS[index % HOTSPOTS.length];
      const barangay = hotspot.barangays[index % hotspot.barangays.length];
      const fullName = `Policyholder ${index + 1}`;
      const email = `policyholder${index + 1}@example.com`;
      const policyType = index % 2 === 0 ? "Property" : "Motor";
      const premiumAmount = (2000 + (index % 250) * 19.75).toFixed(2);

      const offset = (index - start) * 7;
      values.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      params.push(
        randomUUID(),
        fullName,
        email,
        hotspot.city,
        barangay,
        policyType,
        premiumAmount,
      );
    }

    await pool.query(
      `
        INSERT INTO policyholders (
          id,
          full_name,
          email,
          city,
          barangay,
          policy_type,
          premium_amount
        )
        VALUES ${values.join(", ")}
      `,
      params,
    );
  }

  console.log("Seeded 10,000 mock policyholders.");
  await pool.end();
}

main().catch(async (error) => {
  const pool = getPool();
  console.error(error);
  await pool.end();
  process.exit(1);
});
