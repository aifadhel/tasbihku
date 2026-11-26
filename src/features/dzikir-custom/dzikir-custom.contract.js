// @feature dzikir-custom | domain: dzikir | slots: menu-custom,editor-view,dzikir-modals | cmds: dzikir:render-custom-list,dzikir:open-editor,dzikir:editor-add-page,dzikir:editor-save,dzikir:editor-restore,dzikir:open-library,dzikir:close-library,dzikir:filter-library,dzikir:open-custom-azkar,dzikir:close-custom-azkar,dzikir:save-custom-azkar,dzikir:share,dzikir:close-share,dzikir:copy-share-link,dzikir:copy-share-code,dzikir:open-receive,dzikir:close-receive,dzikir:receive-back,dzikir:receive-preview,dzikir:receive-save,dzikir:handle-deeplink,dzikir:open-ai,dzikir:close-ai,dzikir:ai-update-prompt,dzikir:ai-copy-prompt,dzikir:ai-accept | summary: Custom dzikir list, editor, azkar library, AI prompt, and share codec

export const featureManifest = {
  id: 'dzikir-custom',
  domain: 'dzikir',
  slots: ['menu-custom', 'editor-view', 'dzikir-modals'],
  cmds: [
    'dzikir:render-custom-list',
    'dzikir:open-editor',
    'dzikir:editor-add-page',
    'dzikir:editor-save',
    'dzikir:editor-restore',
    'dzikir:open-library',
    'dzikir:close-library',
    'dzikir:filter-library',
    'dzikir:open-custom-azkar',
    'dzikir:close-custom-azkar',
    'dzikir:save-custom-azkar',
    'dzikir:share',
    'dzikir:close-share',
    'dzikir:copy-share-link',
    'dzikir:copy-share-code',
    'dzikir:open-receive',
    'dzikir:close-receive',
    'dzikir:receive-back',
    'dzikir:receive-preview',
    'dzikir:receive-save',
    'dzikir:handle-deeplink',
    'dzikir:open-ai',
    'dzikir:close-ai',
    'dzikir:ai-update-prompt',
    'dzikir:ai-copy-prompt',
    'dzikir:ai-accept'
  ],
  enabled: true,
  load: () => import('./dzikir-custom.feature.js')
};
