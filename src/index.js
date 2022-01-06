/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */

function extendConf (conf) {  
  conf.boot.push('~quasar-app-extension-color-scheme/src/boot/color-scheme.js')
  conf.build.transpileDependencies.push(/quasar-app-extension-color-scheme[\\/]src/)
  conf.framework.plugins.push('AppVisibility')
}

module.exports = function (api) {
  api.compatibleWith('quasar', '^2.0.0')
  api.compatibleWith('@quasar/app', '^3.0.0')
  api.extendQuasarConf(extendConf)
}
