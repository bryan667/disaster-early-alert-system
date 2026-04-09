import { runWatcher } from "@/lib/watcher";

async function main() {
  const result = await runWatcher();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
