import { useI18n } from '@/hooks/web/useI18n'
import {
  L7ChartView,
  L7Config,
  L7DrawConfig,
  L7Wrapper
} from '@/views/chart/components/js/panel/types/impl/l7'
import { MAP_EDITOR_PROPERTY_INNER } from '@/views/chart/components/js/panel/charts/map/common'
import { hexColorToRGBA, parseJson, svgStrToUrl } from '@/views/chart/components/js/util'
import { deepCopy } from '@/utils/utils'
import { GaodeMap } from '@antv/l7-maps'
import { Scene } from '@antv/l7-scene'
import { PointLayer } from '@antv/l7-layers'
import { LayerPopup } from '@antv/l7'
import { mapRendered, mapRendering } from '@/views/chart/components/js/panel/common/common_antv'
import { configCarouselTooltip } from '@/views/chart/components/js/panel/charts/map/tooltip-carousel'
import { DEFAULT_BASIC_STYLE } from '@/views/chart/components/editor/util/chart'
const { t } = useI18n()

/**
 * 符号地图
 */
export class SymbolicMap extends L7ChartView<Scene, L7Config> {
  properties: EditorProperty[] = [
    'background-overall-component',
    'border-style',
    'basic-style-selector',
    'title-selector',
    'label-selector',
    'tooltip-selector'
  ]
  propertyInner: EditorPropertyInner = {
    ...MAP_EDITOR_PROPERTY_INNER,
    'basic-style-selector': [
      'colors',
      'alpha',
      'mapBaseStyle',
      'symbolicMapStyle',
      'zoom',
      'showLabel',
      'autoFit',
      'mapCenter',
      'zoomLevel'
    ],
    'label-selector': ['color', 'fontSize', 'showFields', 'customContent'],
    'tooltip-selector': [
      'color',
      'fontSize',
      'showFields',
      'customContent',
      'show',
      'backgroundColor',
      'carousel'
    ]
  }
  axis: AxisType[] = ['xAxis', 'xAxisExt', 'extBubble', 'filter', 'extLabel', 'extTooltip']
  axisConfig: AxisConfig = {
    xAxis: {
      name: `经纬度 / ${t('chart.dimension')}`,
      type: 'd',
      limit: 2
    },
    xAxisExt: {
      name: `颜色 / ${t('chart.dimension')}`,
      type: 'd',
      limit: 1,
      allowEmpty: true
    },
    extBubble: {
      name: `${t('chart.bubble_size')} / ${t('chart.quota')}`,
      type: 'q',
      limit: 1,
      tooltip:
        '该指标生效时，样式基础样式中的大小属性将失效，同时可在样式基础样式中的大小区间配置大小区间',
      allowEmpty: true
    }
  }
  constructor() {
    super('symbolic-map', [])
  }

  async drawChart(drawOption: L7DrawConfig<L7Config>) {
    const { chart, container, action } = drawOption
    const containerDom = document.getElementById(container)
    const rect = containerDom?.getBoundingClientRect()
    if (rect?.height <= 0) {
      return new L7Wrapper(drawOption.chartObj?.getScene(), [])
    }
    const xAxis = deepCopy(chart.xAxis)
    let basicStyle
    let miscStyle
    if (chart.customAttr) {
      basicStyle = parseJson(chart.customAttr).basicStyle
      miscStyle = parseJson(chart.customAttr).misc
    }

    let mapStyle = basicStyle.mapStyleUrl
    if (basicStyle.mapStyle !== 'custom') {
      mapStyle = `amap://styles/${basicStyle.mapStyle ? basicStyle.mapStyle : 'normal'}`
    }
    const mapKey = await this.getMapKey()
    let center: [number, number] = [
      DEFAULT_BASIC_STYLE.mapCenter.longitude,
      DEFAULT_BASIC_STYLE.mapCenter.latitude
    ]
    if (basicStyle.autoFit === false) {
      center = [basicStyle.mapCenter.longitude, basicStyle.mapCenter.latitude]
    }
    const chartObj = drawOption.chartObj as unknown as L7Wrapper<L7Config, Scene>
    let scene = chartObj?.getScene()
    if (!scene) {
      scene = new Scene({
        id: container,
        logoVisible: false,
        map: new GaodeMap({
          token: mapKey?.key ?? undefined,
          style: mapStyle,
          pitch: miscStyle.mapPitch,
          center,
          zoom: basicStyle.autoFit === false ? basicStyle.zoomLevel : 2.5,
          showLabel: !(basicStyle.showLabel === false)
        })
      })
    } else {
      if (scene.getLayers()?.length) {
        await scene.removeAllLayer()
        scene.setCenter(center)
        scene.setPitch(miscStyle.mapPitch)
        scene.setZoom(basicStyle.autoFit === false ? basicStyle.zoomLevel : 2.5)
        scene.setMapStyle(mapStyle)
        scene.map.showLabel = !(basicStyle.showLabel === false)
      }
    }
    mapRendering(container)
    scene.once('loaded', () => {
      mapRendered(container)
    })
    if (xAxis?.length < 2) {
      return new L7Wrapper(scene, undefined)
    }
    const configList: L7Config[] = []
    const symbolicLayer = await this.buildSymbolicLayer(chart, scene)
    configList.push(symbolicLayer)
    const tooltipLayer = this.buildTooltip(chart, container, symbolicLayer)
    if (tooltipLayer) {
      scene.addPopup(tooltipLayer)
    }
    this.buildLabel(chart, configList)
    this.configZoomButton(chart, scene)
    symbolicLayer.on('inited', ev => {
      chart.container = container
      configCarouselTooltip(chart, symbolicLayer, symbolicLayer.sourceOption.data, scene)
    })
    symbolicLayer.on('click', ev => {
      const data = ev.feature
      const dimensionList = []
      const quotaList = []
      chart.data.fields.forEach((item, index) => {
        Object.keys(data).forEach(key => {
          if (key.startsWith('f_') && item.dataeaseName === key) {
            if (index === 0) {
              dimensionList.push({
                id: item.id,
                dataeaseName: item.dataeaseName,
                value: data[key]
              })
            } else {
              quotaList.push({
                id: item.id,
                dataeaseName: item.dataeaseName,
                value: data[key]
              })
            }
          }
        })
      })
      action({
        x: ev.x,
        y: ev.y,
        data: {
          data: {
            ...data,
            value: quotaList[0].value,
            name: dimensionList[0].id,
            dimensionList: dimensionList,
            quotaList: quotaList
          }
        }
      })
    })

    return new L7Wrapper(scene, configList)
  }

  /**
   * 构建符号图层
   * @param chart
   */
  buildSymbolicLayer = async (chart, scene: Scene) => {
    const { basicStyle } = parseJson(chart.customAttr) as ChartAttr
    const xAxis = deepCopy(chart.xAxis)
    const xAxisExt = deepCopy(chart.xAxisExt)
    const extBubble = deepCopy(chart.extBubble)
    const {
      mapSymbolOpacity,
      mapSymbolSize,
      mapSymbol,
      mapSymbolStrokeWidth,
      colors,
      alpha,
      mapSymbolSizeMin,
      mapSymbolSizeMax
    } = deepCopy(basicStyle)
    const colorsWithAlpha = colors.map(color => hexColorToRGBA(color, alpha))
    let colorIndex = 0
    // 存储已分配的颜色
    const colorAssignments = new Map()
    const sizeKey = extBubble.length > 0 ? extBubble[0].dataeaseName : ''
    const data = chart.data?.tableRow
      ? chart.data.tableRow.map(item => {
          // 颜色标识
          const identifier = item[xAxisExt[0]?.dataeaseName]
          // 检查该标识是否已有颜色分配，如果没有则分配
          let color = colorAssignments.get(identifier)
          if (!color) {
            color = colorsWithAlpha[colorIndex++ % colorsWithAlpha.length]
            // 记录分配的颜色
            colorAssignments.set(identifier, color)
          }
          return {
            ...item,
            color,
            size: parseInt(item[sizeKey]) ?? mapSymbolSize,
            name: identifier
          }
        })
      : []
    const pointLayer = new PointLayer({ autoFit: !(basicStyle.autoFit === false) })
      .source(data, {
        parser: {
          type: 'json',
          x: xAxis[0].dataeaseName,
          y: xAxis[1].dataeaseName
        }
      })
      .active(true)
    if (xAxisExt[0]?.dataeaseName) {
      if (basicStyle.mapSymbol === 'custom' && basicStyle.customIcon) {
        // 图片无法改色
        if (basicStyle.customIcon.startsWith('data')) {
          scene.removeImage('customIcon')
          await scene.addImage('customIcon', basicStyle.customIcon)
          pointLayer.shape('customIcon')
        } else {
          const parser = new DOMParser()
          for (let index = 0; index < Math.min(colorsWithAlpha.length, colorIndex + 1); index++) {
            const color = colorsWithAlpha[index]
            const fillRegex = /(fill="[^"]*")/g
            const svgStr = basicStyle.customIcon.replace(fillRegex, '')
            const doc = parser.parseFromString(svgStr, 'image/svg+xml')
            const svgEle = doc.documentElement
            svgEle.setAttribute('fill', color)
            scene.removeImage(`icon-${color}`)
            await scene.addImage(`icon-${color}`, svgStrToUrl(svgEle.outerHTML))
          }
          pointLayer.shape('color', c => {
            return `icon-${c}`
          })
        }
      } else {
        pointLayer.shape(mapSymbol).color(xAxisExt[0]?.dataeaseName, colorsWithAlpha)
        pointLayer.style({
          stroke: {
            field: 'color'
          },
          strokeWidth: mapSymbolStrokeWidth,
          opacity: mapSymbolOpacity / 10
        })
      }
    } else {
      if (basicStyle.mapSymbol === 'custom' && basicStyle.customIcon) {
        scene.removeImage('customIcon')
        if (basicStyle.customIcon.startsWith('data')) {
          await scene.addImage('customIcon', basicStyle.customIcon)
          pointLayer.shape('customIcon')
        } else {
          const parser = new DOMParser()
          const color = colorsWithAlpha[0]
          const fillRegex = /(fill="[^"]*")/g
          const svgStr = basicStyle.customIcon.replace(fillRegex, '')
          const doc = parser.parseFromString(svgStr, 'image/svg+xml')
          const svgEle = doc.documentElement
          svgEle.setAttribute('fill', color)
          await scene.addImage(`customIcon`, svgStrToUrl(svgEle.outerHTML))
          pointLayer.shape('customIcon')
        }
      } else {
        pointLayer
          .shape(mapSymbol)
          .color(colorsWithAlpha[0])
          .style({
            stroke: colorsWithAlpha[0],
            strokeWidth: mapSymbolStrokeWidth,
            opacity: mapSymbolOpacity / 10
          })
      }
    }
    if (sizeKey) {
      pointLayer.size('size', [mapSymbolSizeMin, mapSymbolSizeMax])
    } else {
      pointLayer.size(mapSymbolSize)
    }
    return pointLayer
  }

  /**
   * 合并详情到 map
   * @param details
   * @returns {Map<string, any>}
   */
  mergeDetailsToMap = details => {
    const resultMap = new Map()
    details.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (resultMap.has(key)) {
          const existingValue = resultMap.get(key)
          if (existingValue !== value) {
            resultMap.set(key, `${existingValue}, ${value}`)
          }
        } else {
          resultMap.set(key, value)
        }
      })
    })
    return resultMap
  }

  /**
   * 清除 popup
   * @param container
   */
  clearPopup = container => {
    const containerElement = document.getElementById(container)
    containerElement?.querySelectorAll('.l7-popup').forEach((element: Element) => element.remove())
  }

  /**
   * 构建 tooltip
   * @param chart
   * @param pointLayer
   */
  buildTooltip = (chart, container, pointLayer) => {
    const customAttr = chart.customAttr ? parseJson(chart.customAttr) : null
    this.clearPopup(container)
    if (customAttr?.tooltip?.show) {
      const { tooltip } = deepCopy(customAttr)
      let showFields = tooltip.showFields || []
      if (!tooltip.showFields || tooltip.showFields.length === 0) {
        showFields = [
          ...chart.xAxisExt.map(i => `${i.dataeaseName}@${i.name}`),
          ...chart.xAxis.map(i => `${i.dataeaseName}@${i.name}`)
        ]
      }
      // 修改背景色
      const styleId = 'tooltip-' + container
      const styleElement = document.getElementById(styleId)
      if (styleElement) {
        styleElement.remove()
        styleElement.parentNode?.removeChild(styleElement)
      }
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
          #${container} .l7-popup-content {
            background-color: ${tooltip.backgroundColor} !important;
            padding: 6px 10px 6px;
            line-height: 1.6;
            border-top-left-radius: 3px;
          }
          #${container} .l7-popup-tip {
           border-top-color: ${tooltip.backgroundColor} !important;
          }
        `
      document.head.appendChild(style)
      const htmlPrefix = `<div style='font-size:${tooltip.fontSize}px;color:${tooltip.color}'>`
      const htmlSuffix = '</div>'
      const containerElement = document.getElementById(container)
      if (containerElement) {
        containerElement.addEventListener('mousemove', event => {
          const rect = containerElement.getBoundingClientRect()
          const mouseX = event.clientX - rect.left
          const mouseY = event.clientY - rect.top
          const tooltipElement = containerElement.getElementsByClassName('l7-popup')
          for (let i = 0; i < tooltipElement?.length; i++) {
            const element = tooltipElement[i] as HTMLElement
            element.firstElementChild.style.display = 'none'
            element.style.transform = 'translate(15px, 12px)'
            const isNearRightEdge =
              containerElement.clientWidth - mouseX <= element.clientWidth + 10
            const isNearBottomEdge = containerElement.clientHeight - mouseY <= element.clientHeight
            let transform = ''
            if (isNearRightEdge) {
              transform += 'translateX(-120%) translateY(15%) '
            }
            if (isNearBottomEdge) {
              transform += 'translateX(15%) translateY(-80%) '
            }
            if (transform) {
              element.style.transform = transform.trim()
            }
          }
        })
      }
      return new LayerPopup({
        anchor: 'top-left',
        items: [
          {
            layer: pointLayer,
            customContent: item => {
              const fieldData = {
                ...item,
                ...Object.fromEntries(this.mergeDetailsToMap(item.details))
              }
              const content = this.buildTooltipContent(tooltip, fieldData, showFields)
              return `${htmlPrefix}${content}${htmlSuffix}`
            }
          }
        ],
        trigger: 'hover'
      })
    }
    return undefined
  }

  /**
   * 构建 tooltip 内容
   * @param tooltip
   * @param fieldData
   * @param showFields
   * @returns {string}
   */
  buildTooltipContent = (tooltip, fieldData, showFields) => {
    let content = ``
    if (tooltip.customContent) {
      content = tooltip.customContent
      showFields.forEach(field => {
        content = content.replace(`\${${field.split('@')[1]}}`, fieldData[field.split('@')[0]])
      })
    } else {
      showFields.forEach(field => {
        content += `<span style="margin-bottom: 4px">${field.split('@')[1]}: ${
          fieldData[field.split('@')[0]]
        }</span><br>`
      })
    }
    return content.replace(/\n/g, '<br>')
  }

  /**
   * 构建 label
   * @param chart
   * @param configList
   */
  buildLabel = (chart, configList) => {
    const xAxis = deepCopy(chart.xAxis)

    const customAttr = chart.customAttr ? parseJson(chart.customAttr) : null
    if (customAttr?.label?.show) {
      const { label } = customAttr
      const data = chart.data?.tableRow || []
      let showFields = label.showFields || []
      if (!label.showFields || label.showFields.length === 0) {
        showFields = [
          ...chart.xAxisExt.map(i => `${i.dataeaseName}@${i.name}`),
          ...chart.xAxis.map(i => `${i.dataeaseName}@${i.name}`)
        ]
      }
      data.forEach(item => {
        const fieldData = {
          ...item,
          ...Object.fromEntries(this.mergeDetailsToMap(item.details))
        }
        let content = label.customContent || ''

        if (content) {
          showFields.forEach(field => {
            const [fieldKey, fieldName] = field.split('@')
            content = content.replace(`\${${fieldName}}`, fieldData[fieldKey])
          })
        } else {
          content = showFields.map(field => fieldData[field.split('@')[0]]).join(',')
        }

        content = content.replace(/\n/g, '')
        item.textLayerContent = content
      })

      configList.push(
        new PointLayer()
          .source(data, {
            parser: {
              type: 'json',
              x: xAxis[0].dataeaseName,
              y: xAxis[1].dataeaseName
            }
          })
          .shape('textLayerContent', 'text')
          .color(label.color)
          .size(label.fontSize)
          .style({
            textAllowOverlap: label.fullDisplay,
            textAnchor: 'center',
            textOffset: [0, 0]
          })
      )
    }
  }

  setupDefaultOptions(chart: ChartObj): ChartObj {
    chart.customAttr.label = {
      ...chart.customAttr.label,
      show: false
    }
    chart.customAttr.basicStyle = {
      ...chart.customAttr.basicStyle,
      mapSymbolOpacity: 5,
      mapStyle: 'normal'
    }
    return chart
  }
}
