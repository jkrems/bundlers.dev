import { useComputed, useSignal } from '@preact/signals';
import { useCallback, useMemo } from 'preact/hooks';

import styles from './CompatTable.module.css';
import ExperimentalInline from './ExperimentalInline.tsx';
import {
  type Platform,
  type PlatformId,
  type PlatformType,
  type PlatformTypeObj,
  type SupportHistoryEntry,
  type SupportStatement,
  type Compat,
} from '../../scripts/compat-runner/compat_data_schema.ts';

export interface PlatformGroup extends PlatformTypeObj<PlatformType> {
  children: Platform<PlatformId>[];
}

interface CompatEntry extends Compat {
  level: number;
}

export interface CompatTableProps {
  platforms: PlatformGroup[];
  compats: CompatEntry[];
}

function normalizeSupport(
  support: SupportStatement | undefined,
): SupportHistoryEntry[] {
  if (!support || (Array.isArray(support) && support.length === 0)) {
    return [
      {
        version_added: null,
      },
    ];
  }

  if (!Array.isArray(support)) {
    return [support];
  }

  return support;
}

function formatVersionAdded(support: SupportHistoryEntry): string | null {
  if (!support.version_added) {
    return 'No';
  }
  if (support.version_added === true) {
    return 'Yes';
  }
  const pretty = support.version_added.replace(/(?:\.0)+$/, '');
  return pretty;
}

export function CompatTable({ platforms, compats }: CompatTableProps) {
  const totalPlatforms = useMemo(
    () => platforms.reduce((count, p) => count + p.children.length, 0),
    [platforms],
  );

  const activeCompatEntry = useSignal<
    [number, string, SupportHistoryEntry[]] | null
  >(null);

  const compatsBeforeDetails = useComputed(() => {
    if (!activeCompatEntry.value) {
      return compats;
    }
    return compats.slice(0, activeCompatEntry.value[0] + 1);
  });
  const compatsAfterDetails = useComputed(() => {
    if (!activeCompatEntry.value) {
      return [];
    }
    return compats.slice(activeCompatEntry.value[0] + 1);
  });

  const selectCompatEntry = useCallback(
    (e: MouseEvent) => {
      const el = e.currentTarget as HTMLTableCellElement;
      const compatIndex = Number(el.dataset['compatIndex']);
      const platformId = String(el.dataset['platformId']) as PlatformId;
      const compat = compats[compatIndex];

      const support = normalizeSupport(compat.support[platformId]);

      if (
        activeCompatEntry.value &&
        activeCompatEntry.value[0] === compatIndex &&
        activeCompatEntry.value[1] === platformId
      ) {
        activeCompatEntry.value = null;
        return;
      }

      activeCompatEntry.value = [compatIndex, platformId, support];
    },
    [compats],
  );

  function renderCompatHistoryRow() {
    if (!activeCompatEntry.value) {
      return null;
    }

    const [, , history] = activeCompatEntry.value;

    function getNotes(entry: SupportHistoryEntry): string[] {
      if (entry.notes?.length) {
        return Array.isArray(entry.notes) ? entry.notes : [entry.notes];
      }
      return ['[default description]'];
    }

    return (
      <tr class={styles['history-row']}>
        <th></th>
        <td colspan={totalPlatforms}>
          {history.map((entry) => {
            const notes = getNotes(entry);
            return (
              <ol>
                <li>
                  {formatVersionAdded(entry)}
                  <ul>
                    {notes.map((note) => (
                      <li dangerouslySetInnerHTML={{ __html: note }}></li>
                    ))}
                  </ul>
                </li>
              </ol>
            );
          })}
        </td>
      </tr>
    );
  }

  function renderCompatRow(compat: CompatEntry) {
    const compatIndex = compats.indexOf(compat);
    return (
      <tr key={compatIndex}>
        <th
          class={`${styles['feature-desc']} ${styles[`feature-level-${compat.level}`]}`}
        >
          <span dangerouslySetInnerHTML={{ __html: compat.description }} />
          {compat.status.experimental && <ExperimentalInline />}
        </th>
        {platforms.flatMap((p) =>
          p.children.map((pc) => {
            const support: SupportHistoryEntry = normalizeSupport(
              compat.support[pc.id],
            )[0];
            const prettyVersion = formatVersionAdded(support);
            const isActive =
              activeCompatEntry.value?.[0] === compatIndex &&
              activeCompatEntry.value[1] === pc.id;

            return (
              <td
                onClick={selectCompatEntry}
                data-compat-index={compatIndex}
                data-platform-id={pc.id}
                aria-expanded={isActive}
              >
                <button
                  class={
                    support.version_added
                      ? support.partial_implementation
                        ? styles['support-partial']
                        : styles['support-supported']
                      : styles['support-unsupported']
                  }
                >
                  <abbr
                    class={`icon ${styles['icon-support']}`}
                    title={
                      support.version_added ? 'Full support' : 'No Support'
                    }
                  />
                  <div class="version-added">{prettyVersion}</div>
                  {support.notes?.length && (
                    <abbr
                      class="icon icon-notes"
                      title="See implementation notes."
                    />
                  )}
                </button>
              </td>
            );
          }),
        )}
      </tr>
    );
  }

  return (
    <table class={styles['compat-table']}>
      <thead>
        <tr>
          <td rowspan={2}></td>
          {platforms.map((p) => (
            <th colspan={p.children.length}>{p.name}</th>
          ))}
        </tr>
        <tr>
          {platforms.flatMap((p) =>
            p.children.map((pc) => (
              <th>
                <div class={styles['platform-name-label']}>{pc.name}</div>
                <div
                  class={`icon ${styles['platform-logo']} icon-logo-${pc.id}`}
                />
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {compatsBeforeDetails.value.map(renderCompatRow)}
        {renderCompatHistoryRow()}
        {compatsAfterDetails.value.map(renderCompatRow)}
      </tbody>
    </table>
  );
}
