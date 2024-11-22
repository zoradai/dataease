import {
  G2PlotChartView,
  G2PlotDrawOptions
} from '@/views/chart/components/js/panel/types/impl/g2plot'
import type { Area as G2Area, AreaOptions } from '@antv/g2plot/esm/plots/area'
import {
  configPlotTooltipEvent,
  getPadding,
  getTooltipContainer,
  setGradientColor,
  TOOLTIP_TPL
} from '@/views/chart/components/js/panel/common/common_antv'
import { cloneDeep } from 'lodash-es'
import {
  flow,
  getLineConditions,
  getLineLabelColorByCondition,
  hexColorToRGBA,
  parseJson,
  setUpStackSeriesColor
} from '@/views/chart/components/js/util'
import { valueFormatter } from '@/views/chart/components/js/formatter'
import {
  LINE_AXIS_TYPE,
  LINE_EDITOR_PROPERTY,
  LINE_EDITOR_PROPERTY_INNER
} from '@/views/chart/components/js/panel/charts/line/common'
import { Label } from '@antv/g2plot/lib/types/label'
import { Datum } from '@antv/g2plot/esm/types/common'
import { useI18n } from '@/hooks/web/useI18n'
import { DEFAULT_LABEL } from '@/views/chart/components/editor/util/chart'
import { clearExtremum, extremumEvt } from '@/views/chart/components/js/extremumUitl'
import { Group } from '@antv/g-canvas'

const { t } = useI18n()
const DEFAULT_DATA = []
export class Area extends G2PlotChartView<AreaOptions, G2Area> {
  properties = LINE_EDITOR_PROPERTY
  propertyInner = {
    ...LINE_EDITOR_PROPERTY_INNER,
    'basic-style-selector': [
      ...LINE_EDITOR_PROPERTY_INNER['basic-style-selector'],
      'gradient',
      'seriesColor'
    ],
    'label-selector': ['seriesLabelVPosition', 'seriesLabelFormatter', 'showExtremum'],
    'tooltip-selector': [
      ...LINE_EDITOR_PROPERTY_INNER['tooltip-selector'],
      'seriesTooltipFormatter'
    ]
  }
  axis: AxisType[] = [...LINE_AXIS_TYPE]
  axisConfig = {
    ...this['axisConfig'],
    xAxis: {
      name: `${t('chart.drag_block_type_axis')} / ${t('chart.dimension')}`,
      type: 'd'
    },
    yAxis: {
      name: `${t('chart.drag_block_value_axis')} / ${t('chart.quota')}`,
      type: 'q'
    }
  }
  baseOptions: AreaOptions = {
    data: [],
    xField: 'field',
    yField: 'value',
    seriesField: 'category',
    isStack: false,
    interactions: [
      {
        type: 'legend-active',
        cfg: {
          start: [{ trigger: 'legend-item:mouseenter', action: ['element-active:reset'] }],
          end: [{ trigger: 'legend-item:mouseleave', action: ['element-active:reset'] }]
        }
      },
      {
        type: 'legend-filter',
        cfg: {
          start: [
            {
              trigger: 'legend-item:click',
              action: [
                'list-unchecked:toggle',
                'data-filter:filter',
                'element-active:reset',
                'element-highlight:reset'
              ]
            }
          ]
        }
      },
      {
        type: 'active-region',
        cfg: {
          start: [{ trigger: 'element:mousemove', action: 'active-region:show' }],
          end: [{ trigger: 'element:mouseleave', action: 'active-region:hide' }]
        }
      }
    ]
  }

  async drawChart(drawOptions: G2PlotDrawOptions<G2Area>): Promise<G2Area> {
    const { chart, container, action } = drawOptions
    if (!chart.data?.data?.length) {
      chart.container = container
      clearExtremum(chart)
      return
    }
    // data
    const data = cloneDeep(chart.data.data)

    const initOptions: AreaOptions = {
      ...this.baseOptions,
      data,
      appendPadding: getPadding(chart)
    }
    // options
    const options = this.setupOptions(chart, initOptions)
    const { Area: G2Area } = await import('@antv/g2plot/esm/plots/area')
    // 开始渲染
    const newChart = new G2Area(container, options)

    newChart.on('point:click', action)
    extremumEvt(newChart, chart, options, container)
    configPlotTooltipEvent(chart, newChart)
    return newChart
  }

  protected configLabel(chart: Chart, options: AreaOptions): AreaOptions {
    const tmpOptions = super.configLabel(chart, options)
    if (!tmpOptions.label) {
      return {
        ...tmpOptions,
        label: false
      }
    }
    const { label: labelAttr, basicStyle } = parseJson(chart.customAttr)
    const conditions = getLineConditions(chart)
    const formatterMap = labelAttr.seriesLabelFormatter?.reduce((pre, next) => {
      pre[next.id] = next
      return pre
    }, {})
    tmpOptions.label.style.fill = DEFAULT_LABEL.color
    const label = {
      fields: [],
      ...tmpOptions.label,
      layout: labelAttr.fullDisplay ? [{ type: 'limit-in-plot' }] : tmpOptions.label.layout,
      formatter: (data: Datum, _point) => {
        if (data.EXTREME) {
          return ''
        }
        if (!labelAttr.seriesLabelFormatter?.length) {
          return data.value
        }
        const labelCfg = formatterMap?.[data.quotaList[0].id] as SeriesFormatter
        if (!labelCfg) {
          return data.value
        }
        if (!labelCfg.show) {
          return
        }
        const position =
          labelCfg.position === 'top'
            ? -2 - basicStyle.lineSymbolSize
            : 10 + basicStyle.lineSymbolSize
        const value = valueFormatter(data.value, labelCfg.formatterCfg)
        const color =
          getLineLabelColorByCondition(conditions, data.value, data.quotaList[0].id) ||
          labelCfg.color
        const group = new Group({})
        group.addShape({
          type: 'text',
          attrs: {
            x: 0,
            y: position,
            text: value,
            textAlign: 'start',
            textBaseline: 'top',
            fontSize: labelCfg.fontSize,
            fill: color
          }
        })
        return group
      }
    }
    return {
      ...tmpOptions,
      label
    }
  }

  protected configBasicStyle(chart: Chart, options: AreaOptions): AreaOptions {
    // size
    const customAttr: DeepPartial<ChartAttr> = parseJson(chart.customAttr)
    const s: DeepPartial<ChartBasicStyle> = JSON.parse(JSON.stringify(customAttr.basicStyle))
    const smooth = s.lineSmooth
    const point = {
      size: s.lineSymbolSize,
      shape: s.lineSymbol
    }
    const line = {
      style: {
        lineWidth: s.lineWidth
      }
    }
    // custom color
    const { colors, alpha } = customAttr.basicStyle
    const areaColors = [...colors, ...colors]
    let areaStyle
    if (customAttr.basicStyle.gradient) {
      const colorMap = new Map()
      const yAxis = parseJson(chart.customStyle).yAxis
      const axisValue = yAxis.axisValue
      const start =
        !axisValue?.auto && axisValue.min && axisValue.max ? axisValue.min / axisValue.max : 0
      areaStyle = item => {
        let ele: string
        const key = `${item.field}-${item.category}`
        if (colorMap.has(key)) {
          ele = colorMap.get(key)
        } else {
          ele = areaColors.shift()
          colorMap.set(key, ele)
        }
        if (ele) {
          return {
            fill: setGradientColor(hexColorToRGBA(ele, alpha), true, 270, start)
          }
        }
        return {
          fill: 'rgba(255,255,255,0)'
        }
      }
    }
    return {
      ...options,
      smooth,
      line,
      point,
      areaStyle
    }
  }

  protected configYAxis(chart: Chart, options: AreaOptions): AreaOptions {
    const tmpOptions = super.configYAxis(chart, options)
    if (!tmpOptions.yAxis) {
      return tmpOptions
    }
    const yAxis = parseJson(chart.customStyle).yAxis
    if (tmpOptions.yAxis.label) {
      tmpOptions.yAxis.label.formatter = value => {
        return valueFormatter(value, yAxis.axisLabelFormatter)
      }
    }
    const axisValue = yAxis.axisValue
    if (!axisValue?.auto) {
      const axis = {
        yAxis: {
          ...tmpOptions.yAxis,
          min: axisValue.min,
          max: axisValue.max,
          minLimit: axisValue.min,
          maxLimit: axisValue.max,
          tickCount: axisValue.splitCount
        }
      }
      return { ...tmpOptions, ...axis }
    }
    return tmpOptions
  }

  protected configTooltip(chart: Chart, options: AreaOptions): AreaOptions {
    return super.configMultiSeriesTooltip(chart, options)
  }

  protected setupOptions(chart: Chart, options: AreaOptions): AreaOptions {
    return flow(
      this.configTheme,
      this.configEmptyDataStrategy,
      this.configColor,
      this.configLabel,
      this.configTooltip,
      this.configBasicStyle,
      this.configLegend,
      this.configXAxis,
      this.configYAxis,
      this.configSlider,
      this.configAnalyse,
      this.configConditions
    )(chart, options, {}, this)
  }

  constructor(name = 'area') {
    super(name, DEFAULT_DATA)
  }
}

/**
 * 堆叠面积图
 */
export class StackArea extends Area {
  propertyInner = {
    ...this['propertyInner'],
    'label-selector': ['vPosition', 'fontSize', 'color', 'labelFormatter'],
    'tooltip-selector': ['fontSize', 'color', 'tooltipFormatter', 'show']
  }
  axisConfig = {
    ...this['axisConfig'],
    extStack: {
      name: `${t('chart.stack_item')} / ${t('chart.dimension')}`,
      type: 'd',
      limit: 1,
      allowEmpty: true
    }
  }
  protected configLabel(chart: Chart, options: AreaOptions): AreaOptions {
    const { label: labelAttr, basicStyle } = parseJson(chart.customAttr)
    const conditions = getLineConditions(chart)
    if (!labelAttr?.show) {
      return {
        ...options,
        label: false
      }
    }
    const layout = []
    if (!labelAttr.fullDisplay) {
      const tmpOptions = super.configLabel(chart, options)
      layout.push(...tmpOptions.label.layout)
    } else {
      layout.push({ type: 'limit-in-plot' })
    }
    const position =
      labelAttr.position === 'top' ? -2 - basicStyle.lineSymbolSize : 8 + basicStyle.lineSymbolSize
    const label: Label = {
      position: labelAttr.position as any,
      offsetY: position,
      layout,
      style: {
        fill: labelAttr.color,
        fontSize: labelAttr.fontSize
      },
      formatter: function (param: Datum, point) {
        point.color =
          getLineLabelColorByCondition(conditions, param.value, point._origin.quotaList[0]) ||
          labelAttr.color
        return valueFormatter(param.value, labelAttr.labelFormatter)
      }
    }
    return { ...options, label }
  }

  public setupDefaultOptions(chart: ChartObj): ChartObj {
    chart.senior.functionCfg.emptyDataStrategy = 'ignoreData'
    return chart
  }

  protected configColor(chart: Chart, options: AreaOptions): AreaOptions {
    return this.configStackColor(chart, options)
  }
  public setupSeriesColor(chart: ChartObj, data?: any[]): ChartBasicStyle['seriesColor'] {
    return setUpStackSeriesColor(chart, data)
  }
  protected configTooltip(chart: Chart, options: AreaOptions): AreaOptions {
    const customAttr: DeepPartial<ChartAttr> = parseJson(chart.customAttr)
    const tooltipAttr = customAttr.tooltip
    if (!tooltipAttr.show) {
      return {
        ...options,
        tooltip: false
      }
    }
    const tooltip = {
      formatter: function (param: Datum) {
        const obj = {
          name: param.category,
          value: valueFormatter(param.value, tooltipAttr.tooltipFormatter)
        }
        return obj
      },
      container: getTooltipContainer(`tooltip-${chart.id}`),
      itemTpl: TOOLTIP_TPL,
      enterable: true
    }
    return { ...options, tooltip }
  }

  constructor() {
    super('area-stack')
    this.baseOptions = {
      ...this.baseOptions,
      isStack: true
    }
    this.axis.push('extStack')
  }
}
