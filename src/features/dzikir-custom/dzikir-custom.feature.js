import { registerCommand } from '../../app/command-bus.js';
import { renderCustomList } from './dzikir-list.js';

const loadEditor = () => import('./dzikir-editor.js');
const loadLibrary = () => import('./dzikir-library.js');
const loadShare = () => import('./dzikir-share-ui.js');
let aiMod = null;
const withAi = (fn) => (aiMod ? fn(aiMod) : import('./dzikir-ai.js').then((m) => fn((aiMod = m))));

export function initFeature() {
  registerCommand('dzikir:render-custom-list', renderCustomList);
  registerCommand('dzikir:open-editor', async (p) => (await loadEditor()).openEditor(p?.type ?? p?.arg, p?.id ?? p?.arg2 ?? null));
  registerCommand('dzikir:editor-add-page', async () => (await loadEditor()).addEditorPage());
  registerCommand('dzikir:editor-save', async () => (await loadEditor()).saveEditorSession());
  registerCommand('dzikir:editor-restore', async () => (await loadEditor()).confirmRestoreGuided());
  registerCommand('dzikir:open-library', async () => (await loadLibrary()).showLibraryModal());
  registerCommand('dzikir:close-library', async () => (await loadLibrary()).closeLibraryModal(false));
  registerCommand('dzikir:filter-library', async (p) => (await loadLibrary()).filterLibrary(p?.value ?? p ?? ''));
  registerCommand('dzikir:open-custom-azkar', async () => (await loadLibrary()).openCustomAzkarModal());
  registerCommand('dzikir:close-custom-azkar', async () => (await loadLibrary()).closeCustomAzkarModal(false));
  registerCommand('dzikir:save-custom-azkar', async () => (await loadLibrary()).saveCustomAzkar());
  registerCommand('dzikir:share', async (p) => (await loadShare()).shareCustomDzikir(p?.id ?? p?.arg));
  registerCommand('dzikir:close-share', async () => (await loadShare()).closeShareDzikirModal(false));
  registerCommand('dzikir:copy-share-link', async () => (await loadShare()).copyShareLink());
  registerCommand('dzikir:copy-share-code', async () => (await loadShare()).copyShareCode());
  registerCommand('dzikir:open-receive', async () => (await loadShare()).openReceiveDzikirModal());
  registerCommand('dzikir:close-receive', async () => (await loadShare()).closeReceiveDzikirModal(false));
  registerCommand('dzikir:receive-back', async () => (await loadShare()).backToReceiveInput());
  registerCommand('dzikir:receive-preview', async () => (await loadShare()).previewDzikirFromInput());
  registerCommand('dzikir:receive-save', async () => (await loadShare()).confirmSaveReceivedDzikir());
  registerCommand('dzikir:handle-deeplink', async (p) => (await loadShare()).handleSharedDzikirDeepLink(p?.token ?? p));
  registerCommand('dzikir:open-ai', () => withAi((m) => m.openAiDzikirModal()));
  registerCommand('dzikir:close-ai', () => withAi((m) => m.closeAiDzikirModal(false)));
  registerCommand('dzikir:ai-update-prompt', () => withAi((m) => m.updateAiPromptPreview()));
  registerCommand('dzikir:ai-copy-prompt', () => withAi((m) => m.copyAiPrompt()));
  registerCommand('dzikir:ai-accept', () => withAi((m) => m.acceptAiResponse()));
}
