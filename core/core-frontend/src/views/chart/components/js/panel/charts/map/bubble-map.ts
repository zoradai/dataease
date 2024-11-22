import { useI18n } from '@/hooks/web/useI18n'
import {
  L7PlotChartView,
  L7PlotDrawOptions
} from '@/views/chart/components/js/panel/types/impl/l7plot'
import { Choropleth, ChoroplethOptions } from '@antv/l7plot/dist/esm/plots/choropleth'
import { Dot, DotOptions, IPlotLayer } from '@antv/l7plot'
import {
  MAP_AXIS_TYPE,
  MAP_EDITOR_PROPERTY,
  MAP_EDITOR_PROPERTY_INNER,
  MapMouseEvent
} from '@/views/chart/components/js/panel/charts/map/common'
import { flow, getGeoJsonFile, hexColorToRGBA, parseJson } from '@/views/chart/components/js/util'
import { cloneDeep } from 'lodash-es'
import { FeatureCollection } from '@antv/l7plot/dist/esm/plots/choropleth/types'
import {
  handleGeoJson,
  mapRendered,
  mapRendering
} from '@/views/chart/components/js/panel/common/common_antv'
import { valueFormatter } from '@/views/chart/components/js/formatter'
import { deepCopy } from '@/utils/utils'
import { configCarouselTooltip } from '@/views/chart/components/js/panel/charts/map/tooltip-carousel'

const { t } = useI18n()

/**
 * 气泡地图
 */
export class BubbleMap extends L7PlotChartView<ChoroplethOptions, Choropleth> {
  properties: EditorProperty[] = [...MAP_EDITOR_PROPERTY, 'bubble-animate']
  propertyInner = {
    ...MAP_EDITOR_PROPERTY_INNER,
    'tooltip-selector': [...MAP_EDITOR_PROPERTY_INNER['tooltip-selector'], 'carousel'],
    'basic-style-selector': [...MAP_EDITOR_PROPERTY_INNER['basic-style-selector'], 'areaBaseColor']
  }
  axis = MAP_AXIS_TYPE
  axisConfig: AxisConfig = {
    xAxis: {
      name: `${t('chart.area')} / ${t('chart.dimension')}`,
      type: 'd',
      limit: 1
    },
    yAxis: {
      name: `${t('chart.bubble_size')} / ${t('chart.quota')}`,
      type: 'q',
      limit: 1
    }
  }
  constructor() {
    super('bubble-map')
  }

  async drawChart(drawOption: L7PlotDrawOptions<Choropleth>): Promise<Choropleth> {
    const { chart, level, areaId, container, action } = drawOption
    if (!areaId) {
      return
    }
    chart.container = container
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
        data: chart.data?.data || [],
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
      tooltip: {},
      legend: false,
      // 禁用线上地图数据
      customFetchGeoData: () => null
    }
    const context = { drawOption, geoJson }
    options = this.setupOptions(chart, options, context)

    const tooltip = deepCopy(options.tooltip)
    options = { ...options, tooltip: { ...tooltip, showComponent: false } }
    const view = new Choropleth(container, options)
    const dotLayer = this.getDotLayer(chart, geoJson, drawOption)
    dotLayer.options = { ...dotLayer.options, tooltip }
    this.configZoomButton(chart, view)
    mapRendering(container)
    view.once('loaded', () => {
      // 修改地图鼠标样式为默认
      view.scene.map._canvasContainer.lastElementChild.style.cursor = 'default'
      dotLayer.addToScene(view.scene)
      dotLayer.once('add', () => {
        mapRendered(container)
      })
      view.scene.map['keyboard'].disable()
      dotLayer.on('dotLayer:click', (ev: MapMouseEvent) => {
        const data = ev.feature.properties
        const adcode = view.currentDistrictData.features.find(
          i => i.properties.name === ev.feature.properties.name
        )?.properties.adcode
        action({
          x: ev.x,
          y: ev.y,
          data: {
            data,
            extra: { adcode: adcode }
          }
        })
      })
      dotLayer.once('loaded', () => {
        chart.container = container
        configCarouselTooltip(chart, view, chart.data?.data || [], null)
      })
    })
    return view
  }

  private getDotLayer(
    chart: Chart,
    geoJson: FeatureCollection,
    drawOption: L7PlotDrawOptions<Choropleth>
  ): IPlotLayer {
    const areaMap = chart.data?.data?.reduce((obj, value) => {
      obj[value['field']] = { value: value.value, data: value }
      return obj
    }, {})
    const dotData = []
    geoJson.features.forEach(item => {
      const name = item.properties['name']
      if (areaMap?.[name]?.value) {
        dotData.push({
          x: item.properties['centroid'][0],
          y: item.properties['centroid'][1],
          size: areaMap[name].value,
          properties: areaMap[name].data,
          name: name
        })
      }
    })
    const { basicStyle } = parseJson(chart.customAttr)
    const { bubbleCfg } = parseJson(chart.senior)
    const { offsetHeight, offsetWidth } = document.getElementById(drawOption.container)
    const options: DotOptions = {
      source: {
        data: dotData,
        parser: {
          type: 'json',
          x: 'x',
          y: 'y'
        }
      },
      shape: 'circle',
      size: {
        field: 'size',
        value: [5, Math.min(offsetHeight, offsetWidth) / 20]
      },
      visible: true,
      zIndex: 0.05,
      color: hexColorToRGBA(basicStyle.colors[0], basicStyle.alpha),
      name: 'bubbleLayer',
      style: {
        opacity: 1
      },
      state: {
        active: { color: 'rgba(30,90,255,1)' }
      },
      tooltip: {}
    }
    if (bubbleCfg && bubbleCfg.enable) {
      return new Dot({
        ...options,
        size: {
          field: 'size',
          value: [10, Math.min(offsetHeight, offsetWidth) / 10]
        },
        animate: {
          enable: true,
          speed: bubbleCfg.speed,
          rings: bubbleCfg.rings
        }
      })
    }
    return new Dot(options)
  }

  private configBasicStyle(
    chart: Chart,
    options: ChoroplethOptions,
    context: Record<string, any>
  ): ChoroplethOptions {
    const { areaId }: L7PlotDrawOptions<any> = context.drawOption
    const geoJson: FeatureCollection = context.geoJson
    const { basicStyle, label } = parseJson(chart.customAttr)
    const senior = parseJson(chart.senior)
    const curAreaNameMapping = senior.areaMapping?.[areaId]
    handleGeoJson(geoJson, curAreaNameMapping)
    options.color = basicStyle.areaBaseColor
    if (!chart.data?.data?.length || !geoJson?.features?.length) {
      options.label && (options.label.field = 'name')
      return options
    }
    const data = chart.data.data
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
    return options
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
      this.configBasicStyle
    )(chart, options, context)
  }
}
