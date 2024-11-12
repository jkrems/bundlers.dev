import { Glob } from 'bun';

export async function* glob(
  patterns: string[],
  { cwd }: { cwd: string },
): AsyncIterator<string> {
  for (const pattern of patterns) {
    const g = new Glob(pattern);
    yield* g.scan(cwd);
  }
}
