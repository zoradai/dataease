import {
  L7PlotChartView,
  L7PlotDrawOptions
} from '@/views/chart/components/js/panel/types/impl/l7plot'
import type { Choropleth, ChoroplethOptions } from '@antv/l7plot/dist/esm/plots/choropleth'
import {
  filterChartDataByRange,
  flow,
  getDynamicColorScale,
  getGeoJsonFile,
  hexColorToRGBA,
  parseJson,
  getMaxAndMinValueByData,
  filterEmptyMinValue
} from '@/views/chart/components/js/util'
import {
  handleGeoJson,
  mapRendered,
  mapRendering
} from '@/views/chart/components/js/panel/common/common_antv'
import type { FeatureCollection } from '@antv/l7plot/dist/esm/plots/choropleth/types'
import { cloneDeep, defaultsDeep } from 'lodash-es'
import { useI18n } from '@/hooks/web/useI18n'
import { valueFormatter } from '../../../formatter'
import {
  MAP_AXIS_TYPE,
  MAP_EDITOR_PROPERTY,
  MAP_EDITOR_PROPERTY_INNER,
  MapMouseEvent
} from '@/views/chart/components/js/panel/charts/map/common'
import type { CategoryLegendListItem } from '@antv/l7plot-component/dist/lib/types/legend'
import createDom from '@antv/dom-util/esm/create-dom'
import {
  CONTAINER_TPL,
  ITEM_TPL,
  LIST_CLASS
} from '@antv/l7plot-component/dist/esm/legend/category/constants'
import substitute from '@antv/util/esm/substitute'
import { configCarouselTooltip } from '@/views/chart/components/js/panel/charts/map/tooltip-carousel'

const { t } = useI18n()

/**
 * 地图
 */
export class Map extends L7PlotChartView<ChoroplethOptions, Choropleth> {
  properties: EditorProperty[] = [...MAP_EDITOR_PROPERTY, 'legend-selector']
  propertyInner: EditorPropertyInner = {
    ...MAP_EDITOR_PROPERTY_INNER,
    'basic-style-selector': [
      'colors',
      'alpha',
      'areaBorderColor',
      'areaBaseColor',
      'zoom',
      'gradient-color'
    ],
    'legend-selector': ['icon', 'fontSize', 'color'],
    'tooltip-selector': [...MAP_EDITOR_PROPERTY_INNER['tooltip-selector'], 'carousel']
  }
  axis = MAP_AXIS_TYPE
  axisConfig: AxisConfig = {
    xAxis: {
      name: `${t('chart.area')} / ${t('chart.dimension')}`,
      type: 'd',
      limit: 1
    },
    yAxis: {
      name: `${t('chart.chart_data')} / ${t('chart.quota')}`,
      type: 'q',
      limit: 1
    }
  }

  constructor() {
    super('map', [])
  }

  async drawChart(drawOption: L7PlotDrawOptions<Choropleth>): Promise<Choropleth> {
    const { chart, level, areaId, container, action } = drawOption
    if (!areaId) {
      return
    }
    chart.container = container
    const sourceData = JSON.parse(JSON.stringify(chart.data?.data || []))
    let data = []
    const { misc } = parseJson(chart.customAttr)
    const { legend } = parseJson(chart.customStyle)
    // 自定义图例
    if (!misc.mapAutoLegend && legend.show) {
      let minValue = misc.mapLegendMin
      let maxValue = misc.mapLegendMax
      let legendNumber = 9
      if (misc.mapLegendRangeType === 'custom') {
        maxValue = 0
        minValue = 0
        legendNumber = misc.mapLegendNumber
      }
      getMaxAndMinValueByData(sourceData, 'value', maxValue, minValue, (max, min) => {
        maxValue = max
        minValue = min
        action({
          from: 'map',
          data: {
            max: maxValue,
            min: minValue ?? filterEmptyMinValue(sourceData, 'value'),
            legendNumber: legendNumber
          }
        })
      })
      data = filterChartDataByRange(sourceData, maxValue, minValue)
    } else {
      data = sourceData
    }
    const geoJson = cloneDeep(await getGeoJsonFile(areaId))
    let options: ChoroplethOptions = {
      preserveDrawingBuffer: true,
      map: {
        type: 'mapbox',
        style: 'blank'
      },
      geoArea: {
        type: 'geojson'
      },
      source: {
        data: data,
        joinBy: {
          sourceField: 'name',
          geoField: 'name',
          geoData: geoJson
        }
      },
      viewLevel: {
        level,
        adcode: 'all'
      },
      autoFit: true,
      chinaBorder: false,
      color: {
        field: 'value'
      },
      style: {
        opacity: 1,
        lineWidth: 0.6,
        lineOpacity: 1
      },
      label: {
        field: '_DE_LABEL_',
        style: {
          textAnchor: 'center'
        }
      },
      state: {
        active: { stroke: 'green', lineWidth: 1 }
      },
      tooltip: {},
      // 禁用线上地图数据
      customFetchGeoData: () => null
    }
    const context = { drawOption, geoJson }
    options = this.setupOptions(chart, options, context)
    const { Choropleth } = await import('@antv/l7plot/dist/esm/plots/choropleth')
    const view = new Choropleth(container, options)
    this.configZoomButton(chart, view)
    mapRendering(container)
    view.once('loaded', () => {
      mapRendered(container)
      view.scene.map['keyboard'].disable()
      view.on('fillAreaLayer:click', (ev: MapMouseEvent) => {
        const data = ev.feature.properties
        action({
          x: ev.x,
          y: ev.y,
          data: {
            data,
            extra: { adcode: data.adcode }
          }
        })
      })
      chart.container = container
      configCarouselTooltip(chart, view, data, null)
    })
    return view
  }

  private configBasicStyle(
    chart: Chart,
    options: ChoroplethOptions,
    context: Record<string, any>
  ): ChoroplethOptions {
    const { areaId }: L7PlotDrawOptions<any> = context.drawOption
    const geoJson: FeatureCollection = context.geoJson
    const { basicStyle, label, misc } = parseJson(chart.customAttr)
    const senior = parseJson(chart.senior)
    const curAreaNameMapping = senior.areaMapping?.[areaId]
    handleGeoJson(geoJson, curAreaNameMapping)
    options.color = {
      field: 'value',
      value: [basicStyle.colors[0]],
      scale: {
        type: 'quantize',
        unknown: basicStyle.areaBaseColor
      }
    }
    if (!chart.data?.data?.length || !geoJson?.features?.length) {
      options.label && (options.label.field = 'name')
      return options
    }
    const sourceData = JSON.parse(JSON.stringify(chart.data.data))
    const colors = basicStyle.colors.map(item => hexColorToRGBA(item, basicStyle.alpha))
    const { legend } = parseJson(chart.customStyle)
    let data = []
    data = sourceData
    let colorScale = []
    let minValue = misc.mapLegendMin
    let maxValue = misc.mapLegendMax
    if (legend.show) {
      let mapLegendNumber = misc.mapLegendNumber
      getMaxAndMinValueByData(sourceData, 'value', maxValue, minValue, (max, min) => {
        maxValue = max
        minValue = min
        mapLegendNumber = 9
      })
      // 非自动，过滤数据
      if (!misc.mapAutoLegend) {
        data = filterChartDataByRange(sourceData, maxValue, minValue)
      } else {
        mapLegendNumber = 9
      }
      // 定义最大值、最小值、区间数量和对应的颜色
      colorScale = getDynamicColorScale(minValue, maxValue, mapLegendNumber, colors)
    } else {
      colorScale = colors
    }
    const areaMap = data.reduce((obj, value) => {
      obj[value['field']] = value.value
      return obj
    }, {})
    geoJson.features.forEach(item => {
      const name = item.properties['name']
      // trick, maybe move to configLabel, here for perf
      if (label.show) {
        const content = []
        if (label.showDimension) {
          content.push(name)
        }
        if (label.showQuota) {
          areaMap[name] && content.push(valueFormatter(areaMap[name], label.quotaLabelFormatter))
        }
        item.properties['_DE_LABEL_'] = content.join('\n\n')
      }
    })
    if (colorScale.length) {
      options.color['value'] = colorScale.map(item => (item.color ? item.color : item))
      if (colorScale[0].value && !misc.mapAutoLegend) {
        options.color['scale']['domain'] = [
          minValue ?? filterEmptyMinValue(sourceData, 'value'),
          maxValue
        ]
      }
    }
    return options
  }

  private customConfigLegend(
    chart: Chart,
    options: ChoroplethOptions,
    _context: Record<string, any>
  ): ChoroplethOptions {
    const { basicStyle, misc } = parseJson(chart.customAttr)
    const colors = basicStyle.colors.map(item => hexColorToRGBA(item, basicStyle.alpha))
    if (basicStyle.suspension === false && basicStyle.showZoom === undefined) {
      return options
    }
    const { legend } = parseJson(chart.customStyle)
    if (!legend.show) {
      return options
    }
    // 内部函数 创建自定义图例的内容
    const createLegendCustomContent = showItems => {
      const containerDom = createDom(CONTAINER_TPL) as HTMLElement
      const listDom = containerDom.getElementsByClassName(LIST_CLASS)[0] as HTMLElement
      showItems.forEach(item => {
        let value = '-'
        if (item.value !== '') {
          if (Array.isArray(item.value)) {
            item.value.forEach((v, i) => {
              item.value[i] = Number.isNaN(v) || v === 'NaN' ? 'NaN' : parseFloat(v).toFixed(0)
            })
            value = item.value.join('-')
          } else {
            const tmp = item.value as string
            value = Number.isNaN(tmp) || tmp === 'NaN' ? 'NaN' : parseFloat(tmp).toFixed(0)
          }
        }
        const substituteObj = { ...item, value }

        const domStr = substitute(ITEM_TPL, substituteObj)
        const itemDom = createDom(domStr)
        // 给 legend 形状用的
        itemDom.style.setProperty('--bgColor', item.color)
        listDom.appendChild(itemDom)
      })
      return listDom
    }
    const LEGEND_SHAPE_STYLE_MAP = {
      circle: {
        borderRadius: '50%'
      },
      square: {},
      triangle: {
        border: 'unset',
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom: '10px solid var(--bgColor)',
        background: 'unset'
      },
      diamond: {
        transform: 'rotate(45deg)'
      }
    }
    const customLegend = {
      position: 'bottomleft',
      domStyles: {
        'l7plot-legend__category-value': {
          fontSize: legend.fontSize + 'px',
          color: legend.color
        },
        'l7plot-legend__category-marker': {
          ...LEGEND_SHAPE_STYLE_MAP[legend.icon],
          width: '9px',
          height: '9px',
          ...(legend.icon === 'triangle' ? {} : { border: '0.01px solid #f4f4f4' })
        }
      }
    }
    // 不是自动图例、自定义图例区间、不是下钻时
    if (!misc.mapAutoLegend && misc.mapLegendRangeType === 'custom' && !chart.drill) {
      // 获取图例区间数据
      const items = []
      // 区间数组
      const ranges = misc.mapLegendCustomRange
        .slice(0, -1)
        .map((item, index) => [item, misc.mapLegendCustomRange[index + 1]])
      ranges.forEach((range, index) => {
        const tmpRange = [range[0], range[1]]
        const colorIndex = index % colors.length
        // 当区间第一个值小于最小值时，颜色取地图底色
        const isLessThanMin = range[0] < ranges[0][0] && range[1] < ranges[0][0]
        let rangeColor = colors[colorIndex]
        if (isLessThanMin) {
          rangeColor = hexColorToRGBA(basicStyle.areaBaseColor, basicStyle.alpha)
        }
        items.push({
          value: tmpRange,
          color: rangeColor
        })
      })
      customLegend['customContent'] = (_: string, _items: CategoryLegendListItem[]) => {
        if (items?.length) {
          return createLegendCustomContent(items)
        }
        return ''
      }
      options.color['value'] = ({ value }) => {
        const item = items.find(item => value >= item.value[0] && value <= item.value[1])
        return item ? item.color : hexColorToRGBA(basicStyle.areaBaseColor, basicStyle.alpha)
      }
      options.color.scale.domain = [ranges[0][0], ranges[ranges.length - 1][1]]
    } else {
      customLegend['customContent'] = (_: string, items: CategoryLegendListItem[]) => {
        const showItems = items?.length > 30 ? items.slice(0, 30) : items
        if (showItems?.length) {
          return createLegendCustomContent(showItems)
        }
        return ''
      }
    }
    // 下钻时按照数据值计算图例
    if (chart.drill) {
      getMaxAndMinValueByData(options.source.data, 'value', 0, 0, (max, min) => {
        options.color.scale.domain = [min, max]
      })
    }
    defaultsDeep(options, { legend: customLegend })
    return options
  }

  setupDefaultOptions(chart: ChartObj): ChartObj {
    chart.customAttr.basicStyle.areaBaseColor = '#f4f4f4'
    return chart
  }

  protected setupOptions(
    chart: Chart,
    options: ChoroplethOptions,
    context: Record<string, any>
  ): ChoroplethOptions {
    return flow(
      this.configEmptyDataStrategy,
      this.configLabel,
      this.configStyle,
      this.configTooltip,
      this.configBasicStyle,
      this.customConfigLegend
    )(chart, options, context)
  }
}
