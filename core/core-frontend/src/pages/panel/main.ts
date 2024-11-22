const suffix = `${import.meta.env.VITE_VERSION}-dataease`

const dom = document.querySelector('head')
const cb = dom.appendChild.bind(dom)

const formatterUrl = <T extends Node>(node: T, prefix: string) => {
  if (['SCRIPT', 'LINK'].includes(node.nodeName)) {
    let url = ''
    if (node instanceof HTMLLinkElement) {
      url = node.href
    } else if (node instanceof HTMLScriptElement) {
      url = node.src
    }

    if (url.includes(suffix) || url.includes('dataease-private')) {
      const currentUrlprefix = new URL(url).origin
      const newUrl = url.replace(currentUrlprefix, prefix)
      if (node instanceof HTMLLinkElement) {
        node.href = newUrl
      } else if (node instanceof HTMLScriptElement) {
        node.src = newUrl
      }
    }
  }
  return node
}

const getPrefix = (): string => {
  let prefix = ''
  Array.from(document.querySelector('head').children).some(ele => {
    if (['SCRIPT', 'LINK'].includes(ele.nodeName)) {
      let url = ''
      if (ele instanceof HTMLLinkElement) {
        url = ele.href
      } else if (ele instanceof HTMLScriptElement) {
        url = ele.src
      }
      if (url.includes(suffix)) {
        prefix = new URL(url).origin
        const index = url.indexOf(`/js/div_import_${suffix}`)
        if (index > 0) {
          prefix = url.substring(0, index)
        }
        return true
      }
    }
  })
  return prefix
}

document.querySelector('head').appendChild = <T extends Node>(node: T) => {
  const newNode = formatterUrl(node, getPrefix())
  cb(newNode)
  return newNode
}
import { App, createApp } from 'vue'
import '@/style/index.less'
import 'normalize.css/normalize.css'
import '@antv/s2/dist/style.min.css'
import AppElement from './App.vue'
import { setupI18n } from '@/plugins/vue-i18n'
import { setupStore } from '@/store'
import { useEmbedded } from '@/store/modules/embedded'
import { setupElementPlus, setupElementPlusIcons } from '@/plugins/element-plus'
import { setupRouter } from '@/router/embedded'
import { useCache } from '@/hooks/web/useCache'

const setupAll = async (
  dom: string,
  type: string,
  busiFlag: string,
  outerParams: string,
  suffixId: string,
  token: string,
  baseUrl: string,
  dvId: string,
  pid: string,
  chartId: string,
  resourceId: string,
  dfId: string
): Promise<App<Element>> => {
  const app = createApp(AppElement, { componentName: type })
  app.provide('embeddedParams', {
    chartId,
    resourceId,
    dfId,
    dvId,
    pid,
    busiFlag,
    outerParams,
    suffixId
  })
  await setupI18n(app)
  setupStore(app)
  setupRouter(app)
  setupElementPlus(app)
  setupElementPlusIcons(app)
  const embeddedStore = useEmbedded()
  embeddedStore.setType(type)
  embeddedStore.setBusiFlag(busiFlag)
  embeddedStore.setOuterParams(outerParams)
  embeddedStore.setSuffixId(suffixId)
  embeddedStore.setToken(token)
  embeddedStore.setBaseUrl(baseUrl)
  embeddedStore.setDvId(dvId)
  embeddedStore.setPid(pid)
  embeddedStore.setResourceId(resourceId)
  embeddedStore.setDfId(dfId)
  const directive = await import('@/directive')
  directive.installDirective(app)
  const res = await import('@/store/modules/user')
  const userStore = res.userStore()
  userStore.setUser()
  const appRes = await import('@/store/modules/app')
  const appStore = appRes.useAppStoreWithOut()
  appStore.setIsDataEaseBi(true)
  const appearanceRes = await import('@/store/modules/appearance')
  const appearanceStore = appearanceRes.useAppearanceStoreWithOut()
  appearanceStore.setAppearance(true)
  const getDefaultSort = await import('@/api/common')
  const defaultSort = await getDefaultSort.getDefaultSettings()
  const { wsCache } = useCache()
  wsCache.set('TreeSort-backend', defaultSort['basic.defaultSort'] ?? '1')
  wsCache.set('open-backend', defaultSort['basic.defaultOpen'] ?? '0')
  app.mount(dom)
  return app
}

interface Options {
  container: string
  lng: 'zh' | 'en'
  theme: 'default'
}

const defaultOptions = {
  container: '#designer',
  lng: 'zh',
  theme: 'default'
}

class DataEaseBi {
  baseUrl: string
  token: string
  type:
    | 'DashboardEditor'
    | 'VisualizationEditor'
    | 'ViewWrapper'
    | 'Dashboard'
    | 'ScreenPanel'
    | 'DashboardPanel'
    | 'DataFilling'
  dvId: string
  busiFlag: 'dashboard' | 'dataV'
  outerParams: string
  suffixId: string
  resourceId: string
  dfId: string
  pid: string
  chartId: string
  deOptions: Options
  vm: App<Element>

  constructor(type, options) {
    this.type = type
    this.token = options.token
    this.busiFlag = options.busiFlag
    this.outerParams = options.outerParams
    this.suffixId = options.suffixId
    this.baseUrl = options.baseUrl
    this.dvId = options.dvId
    this.pid = options.pid
    this.chartId = options.chartId
    this.resourceId = options.resourceId
    this.dfId = options.dfId
  }

  async initialize(options: Options) {
    this.deOptions = { ...defaultOptions, ...options }
    this.vm = await setupAll(
      this.deOptions.container,
      this.type,
      this.busiFlag,
      this.outerParams,
      this.suffixId,
      this.token,
      this.baseUrl,
      this.dvId,
      this.pid,
      this.chartId,
      this.resourceId,
      this.dfId
    )
  }

  destroy() {
    const embeddedStore = useEmbedded()
    embeddedStore.setType(null)
    embeddedStore.setBusiFlag(null)
    embeddedStore.setOuterParams(null)
    embeddedStore.setSuffixId(null)
    embeddedStore.setToken(null)
    embeddedStore.setBaseUrl(null)
    embeddedStore.setChartId(null)
    embeddedStore.clearState()
    this.vm.unmount()
    this.type = null
    this.token = null
    this.busiFlag = null
    this.outerParams = null
    this.suffixId = null
    this.baseUrl = null
    this.dvId = null
    this.pid = null
    this.chartId = null
    this.resourceId = null
    this.dfId = null
    this.vm = null
  }
}

window.DataEaseBi = DataEaseBi
