import { build, version } from 'esbuild';
import { join, relative } from 'node:path';

import { type TestResult, type PlatformInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

export class EsbuildTestCaseExecutor extends BundlingTestCaseExecutor<'esbuild'> {
  protected override async getPlatformInfo(): Promise<PlatformInfo<'esbuild'>> {
    return {
      ...PLATFORMS.esbuild,
      version,
    };
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    let buildResult;
    const outdir = join(cwd, '.tmp', pageContext.id);
    try {
      buildResult = await build({
        target: 'es2022',
        bundle: true,
        platform: 'browser',
        entryPoints: [
          {
            in: filename,
            out: 'main',
          },
        ],
        absWorkingDir: cwd,
        write: false,
        publicPath: `/${pageContext.id}`,
        outdir,
        logLevel: 'silent',
      });
    } catch (e) {
      return [
        {
          description: 'Build test suite',
          error: {
            message: `Test suite failed to build: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }

    if (buildResult.errors.length) {
      return buildResult.errors.map((err) => ({
        description: err.id,
        error: {
          message: err.text,
        },
      }));
    }

    for (const outFile of buildResult.outputFiles) {
      const relativePath = relative(outdir, outFile.path);
      pageContext.files.set(`/${relativePath}`, outFile.contents);
    }
    return null;
  }
}
