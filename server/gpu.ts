/**
 * Local inference hardware telemetry.
 *
 * An appliance that runs models on the customer's own silicon should be able to
 * show that silicon working. Returns null wherever there is no NVIDIA GPU, so the
 * UI simply omits it.
 */
export type GpuStat = { name: string; util: number; memUsed: number; memTotal: number };

let lastProbe = 0;
let cached: GpuStat | null = null;
let supported = true;

export async function gpuStat(): Promise<GpuStat | null> {
  if (!supported) return null;
  if (Date.now() - lastProbe < 400) return cached;
  lastProbe = Date.now();

  try {
    const proc = Bun.spawn(
      ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"],
      { stdout: "pipe", stderr: "ignore" }
    );
    const out = (await new Response(proc.stdout).text()).trim();
    if ((await proc.exited) !== 0 || !out) {
      supported = false;
      return null;
    }
    const [name, util, used, total] = out.split("\n")[0].split(",").map((s) => s.trim());
    cached = { name, util: Number(util), memUsed: Number(used), memTotal: Number(total) };
    return cached;
  } catch {
    supported = false;
    return null;
  }
}
