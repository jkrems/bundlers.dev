import {
  default as rspack,
  type Configuration,
  type OutputFileSystem,
  type Stats,
} from '@rspack/core';
import { createFsFromVolume, Volume } from 'memfs';
import { join } from 'node:path';

import { type TestResult, type EnvInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';

export class RspackTestCaseExecutor extends BundlingTestCaseExecutor {
  protected override async getEnvInfo(): Promise<EnvInfo> {
    return {
      id: 'rspack',
      version: rspack.rspackVersion,
    };
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    let stats: Stats;
    const outdir = join(cwd, '.tmp', pageContext.id);
    const volume = new Volume();
    const fs = createFsFromVolume(volume);
    try {
      const options: Configuration = {
        target: 'web',
        mode: 'development',
        context: cwd,
        entry: { main: `./${filename}` },
        output: {
          path: outdir,
          publicPath: `/${pageContext.id}/`,
        },
      };
      const compiler = rspack(options);
      compiler.outputFileSystem = fs as OutputFileSystem;

      stats = await new Promise((resolve, reject) => {
        compiler.run((err: Error | null, stats?: Stats) => {
          err ? reject(err) : resolve(stats!);
        });
      });
    } catch (e) {
      console.error('???', e);
      return [
        {
          description: 'Build test suite',
          error: {
            message: `Test suite failed to build: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }

    if (stats.hasErrors()) {
      return stats.toJson().errors!.map((err) => ({
        description: err.message,
        error: {
          message: err.message,
        },
      }));
    }

    function forwardFiles(subPath: string = '') {
      const fsPath = `${outdir}${subPath}`;
      for (const outFile of fs.readdirSync(fsPath)) {
        const newSubPath = `${subPath}/${outFile}`;
        const newFsPath = `${outdir}${newSubPath}`;
        try {
          const contents = fs.readFileSync(newFsPath);
          pageContext.files.set(newSubPath, contents);
          continue;
        } catch (e) {
          if ((e as any)?.code !== 'EISDIR') {
            throw e;
          }
        }
        forwardFiles(newSubPath);
      }
    }

    forwardFiles();

    return null;
  }
}