import type { DesignSystem } from './types.js';
import type { Result } from './errors.js';
import type { ReactBindings } from './react-types.js';
import type { TokenFileBindings } from './ports/build-files.js';
import type { ScopeTarget, ScopeInstaller } from './ports/scope-target.js';
import type { StylesheetReader } from './ports/styles.js';
import { createDesignSystem } from './api.js';
import { createSha256 } from '../adapters/hash/sha256.js';
import { createInstaller } from '../core/tokens/install.js';
import { validateArtifacts } from '../core/artifacts/manifest.js';
import { readSources } from '../core/tokens/read.js';
import { protect, protectAsync } from '../core/validation/outcomes.js';
/** Pure portable composition; no CSS/DOM/filesystem modules load until explicit platform binding. */
export function composeDesignSystem(): DesignSystem {
  return createDesignSystem({ identity: createSha256() });
}
/** Scope target is a narrow role, allowing browser and deterministic contract targets without core changes. */
export function createScopeInstaller(target: ScopeTarget): Result<ScopeInstaller> {
  return protect(() => createInstaller(target));
}
/** Bind actual local source/artifact I/O only on request; build host owns failed-generation recovery. */
export function createTokenFileBindings(root: string): Promise<Result<TokenFileBindings>> {
  return protectAsync(async () => {
    const { createTokenFiles } = await import('../adapters/build/token-files.js');
    const identity = createSha256();
    return createTokenFiles(root, {
      source: (input) => protect(() => readSources(input)),
      artifacts: (input) => protect(() => validateArtifacts(input, identity)),
    });
  });
}
/** Style parser loads for build/audit use, never through a pure token-resolution import. */
export function createStylesheetBindings(): Promise<Result<StylesheetReader>> {
  return protectAsync(async () => {
    const { createStylesheetReader } = await import('../adapters/build/stylesheet-reader.js');
    return createStylesheetReader();
  });
}
/** Call once during host composition, before mounting; returned component identities remain stable across renders. */
export function createReactBindings(): Promise<Result<ReactBindings>> {
  return protectAsync(async () => {
    await import('../adapters/styles/entry.css');
    const [
      button,
      field,
      dialog,
      menu,
      tabs,
      tooltip,
      status,
      sidePanel,
      panelHeader,
      panelBody,
      bodyHeader,
      section,
      sectionHeader,
      sectionBody,
      scope,
    ] = await Promise.all([
      import('../adapters/react/Button.js'),
      import('../adapters/react/Field.js'),
      import('../adapters/react/Dialog.js'),
      import('../adapters/react/Menu.js'),
      import('../adapters/react/Tabs.js'),
      import('../adapters/react/Tooltip.js'),
      import('../adapters/react/StatusMessage.js'),
      import('../adapters/react/panels/SidePanel.js'),
      import('../adapters/react/panels/PanelHeader.js'),
      import('../adapters/react/panels/PanelBody.js'),
      import('../adapters/react/panels/PanelBodyHeader.js'),
      import('../adapters/react/panels/PanelSection.js'),
      import('../adapters/react/panels/PanelSectionHeader.js'),
      import('../adapters/react/panels/PanelSectionBody.js'),
      import('../adapters/browser/install-tokens.js'),
    ]);
    return {
      Button: button.Button,
      Field: field.Field,
      Dialog: dialog.createDialog(button.Button),
      Menu: menu.Menu,
      Tabs: tabs.Tabs,
      Tooltip: tooltip.Tooltip,
      StatusMessage: status.StatusMessage,
      SidePanel: sidePanel.SidePanel,
      PanelHeader: panelHeader.createPanelHeader(button.Button),
      PanelBody: panelBody.PanelBody,
      PanelBodyHeader: bodyHeader.PanelBodyHeader,
      PanelSection: section.createPanelSection(sectionBody.PanelSectionBody),
      PanelSectionHeader: sectionHeader.PanelSectionHeader,
      PanelSectionBody: sectionBody.PanelSectionBody,
      createScopeTarget: scope.createDomScopeTarget,
    };
  });
}
