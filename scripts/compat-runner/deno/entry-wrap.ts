import { runTests } from '../../../.tmp/expect-bundle.mjs';

await import(`../../../${Deno.args[0]}`).then(runTests);
