import { defineConfig } from '#q-app'

export default defineConfig((ctx) => ({
  boot: [],
  css: ['app.scss'],
  extras: ['roboto-font', 'material-icons'],
  build: {
    vueRouterMode: ctx.mode.capacitor ? 'hash' : 'history',
    publicPath: '/',
    versionName: Date.now().toString(),
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node20',
    },
    distDir: process.env.QUASAR_DIST_DIR || undefined,
    allowOutsideProjectDistDir: Boolean(process.env.QUASAR_DIST_DIR),
    vitePlugins: [
      [
        'vite-plugin-checker',
        {
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
        },
        { server: false },
      ],
    ],
  },
  devServer: { open: true },
  framework: {
    config: {},
    lang: 'es',
    plugins: ['Notify', 'Dialog', 'Loading'],
  },
  animations: [],
  capacitor: { hideSplashscreen: true },
  electron: {
    preloadScripts: ['electron-preload'],
    bundler: 'packager',
    builder: { appId: 'mark-front' },
  },
}))
