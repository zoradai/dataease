import {
  EXTRA_FIELD,
  PivotSheet,
  S2Event,
  S2Options,
  TOTAL_VALUE,
  S2Theme,
  Totals,
  PivotDataSet,
  Query,
  VALUE_FIELD,
  QueryDataType,
  TotalStatus,
  Aggregation,
  S2DataConfig
} from '@antv/s2'
import { formatterItem, valueFormatter } from '../../../formatter'
import { hexColorToRGBA, isAlphaColor, parseJson } from '../../../util'
import { S2ChartView, S2DrawOptions } from '../../types/impl/s2'
import { TABLE_EDITOR_PROPERTY_INNER } from './common'
import { useI18n } from '@/hooks/web/useI18n'
import { isNumber, keys, maxBy, merge, minBy, some, isEmpty, get } from 'lodash-es'
import { copyContent, CustomDataCell } from '../../common/common_table'
import Decimal from 'decimal.js'

type DataItem = Record<string, any>

const { t } = useI18n()

class CustomPivotDataset extends PivotDataSet {
  getTotalValue(query: Query, totalStatus?: TotalStatus) {
    const { options } = this.spreadsheet
    const effectiveStatus = some(totalStatus)
    const status = effectiveStatus ? totalStatus : this.getTotalStatus(query)
    const { aggregation, calcFunc } =
      getAggregationAndCalcFuncByQuery(status, options?.totals) || {}

    // 聚合方式从用户配置的 s2Options.totals 取, 在触发前端兜底计算汇总逻辑时, 如果没有汇总的配置, 默认按 [求和] 计算,避免排序失效.
    const defaultAggregation =
      isEmpty(options?.totals) && !this.spreadsheet.isHierarchyTreeType() ? Aggregation.SUM : ''
    const calcAction = calcActionByType[aggregation || defaultAggregation]

    // 前端计算汇总值
    if (calcAction || calcFunc) {
      const data = this.getMultiData(query, {
        queryType: QueryDataType.DetailOnly
      })
      let totalValue: number
      if (calcFunc) {
        totalValue = calcFunc(query, data, this.spreadsheet, status)
      } else if (calcAction) {
        totalValue = calcAction(data, VALUE_FIELD)
      }

      return {
        ...query,
        [VALUE_FIELD]: totalValue,
        [query[EXTRA_FIELD]]: totalValue
      }
    }
  }
}
/**
 * 透视表
 */
export class TablePivot extends S2ChartView<PivotSheet> {
  properties: EditorProperty[] = [
    'border-style',
    'background-overall-component',
    'basic-style-selector',
    'table-header-selector',
    'table-cell-selector',
    'table-total-selector',
    'title-selector',
    'tooltip-selector',
    'function-cfg',
    'threshold',
    'linkage',
    'jump-set'
  ]
  propertyInner = {
    ...TABLE_EDITOR_PROPERTY_INNER,
    'table-header-selector': [
      'tableHeaderBgColor',
      'tableTitleFontSize',
      'tableHeaderFontColor',
      'tableTitleHeight',
      'tableHeaderAlign',
      'showColTooltip',
      'showRowTooltip',
      'showHorizonBorder',
      'showVerticalBorder'
    ],
    'table-total-selector': ['row', 'col'],
    'basic-style-selector': [
      'tableColumnMode',
      'tableBorderColor',
      'tableScrollBarColor',
      'alpha',
      'tableLayoutMode',
      'showHoverStyle'
    ]
  }
  axis: AxisType[] = ['xAxis', 'xAxisExt', 'yAxis', 'filter']
  axisConfig: AxisConfig = {
    xAxis: {
      name: `${t('chart.table_pivot_row')} / ${t('chart.dimension')}`,
      type: 'd'
    },
    xAxisExt: {
      name: `${t('chart.drag_block_table_data_column')} / ${t('chart.dimension')}`,
      type: 'd',
      allowEmpty: true
    },
    yAxis: {
      name: `${t('chart.drag_block_table_data_column')} / ${t('chart.quota')}`,
      type: 'q'
    }
  }

  public drawChart(drawOption: S2DrawOptions<PivotSheet>): PivotSheet {
    const { container, chart, chartObj, action } = drawOption
    const containerDom = document.getElementById(container)

    const { xAxisExt: columnFields, xAxis: rowFields, yAxis: valueFields } = chart
    const [c, r, v] = [columnFields, rowFields, valueFields].map(arr =>
      arr.map(i => i.dataeaseName)
    )

    // fields
    const { fields, customCalc } = chart.data
    if (!fields || fields.length === 0) {
      if (chartObj) {
        chartObj.destroy()
      }
      return
    }

    const columns = []
    const meta = []

    const valueFieldMap: Record<string, Axis> = [
      ...chart.xAxis,
      ...chart.xAxisExt,
      ...chart.yAxis
    ].reduce((p, n) => {
      p[n.dataeaseName] = n
      return p
    }, {})
    fields.forEach(ele => {
      const f = valueFieldMap[ele.dataeaseName]
      columns.push(ele.dataeaseName)
      meta.push({
        field: ele.dataeaseName,
        name: ele.chartShowName ?? ele.name,
        formatter: value => {
          if (!f) {
            return value
          }
          if (value === null || value === undefined) {
            return value
          }
          if (![2, 3].includes(f.deType) || !isNumber(value)) {
            return value
          }
          if (f.formatterCfg) {
            return valueFormatter(value, f.formatterCfg)
          } else {
            return valueFormatter(value, formatterItem)
          }
        }
      })
    })

    // total config
    const { basicStyle, tooltip, tableTotal } = parseJson(chart.customAttr)
    tableTotal.row.subTotalsDimensions = r
    tableTotal.col.subTotalsDimensions = c

    // 解析合计、小计排序
    const sortParams = []
    if (
      tableTotal.row.totalSort &&
      tableTotal.row.totalSort !== 'none' &&
      c.length > 0 &&
      tableTotal.row.showGrandTotals &&
      v.indexOf(tableTotal.row.totalSortField) > -1
    ) {
      const sort = {
        sortFieldId: c[0],
        sortMethod: tableTotal.row.totalSort.toUpperCase(),
        sortByMeasure: TOTAL_VALUE,
        query: {
          [EXTRA_FIELD]: tableTotal.row.totalSortField
        }
      }
      sortParams.push(sort)
    }
    if (
      tableTotal.col.totalSort &&
      tableTotal.col.totalSort !== 'none' &&
      r.length > 0 &&
      tableTotal.col.showGrandTotals &&
      v.indexOf(tableTotal.col.totalSortField) > -1
    ) {
      const sort = {
        sortFieldId: r[0],
        sortMethod: tableTotal.col.totalSort.toUpperCase(),
        sortByMeasure: TOTAL_VALUE,
        query: {
          [EXTRA_FIELD]: tableTotal.col.totalSortField
        }
      }
      sortParams.push(sort)
    }
    // 自定义总计小计
    const totals = [
      tableTotal.row.calcTotals,
      tableTotal.row.calcSubTotals,
      tableTotal.col.calcTotals,
      tableTotal.col.calcSubTotals
    ]
    const axisMap = {
      row: chart.xAxis,
      col: chart.xAxisExt,
      quota: chart.yAxis
    }
    totals.forEach(total => {
      if (total.cfg?.length) {
        delete total.aggregation
        const totalCfgMap = total.cfg.reduce((p, n) => {
          p[n.dataeaseName] = n
          return p
        }, {})
        total.calcFunc = (query, data, _, status) => {
          return customCalcFunc(query, data, status, chart, totalCfgMap, axisMap, customCalc)
        }
      }
    })
    // 空值处理
    const newData = this.configEmptyDataStrategy(chart)
    // data config
    const s2DataConfig: S2DataConfig = {
      fields: {
        rows: r,
        columns: c,
        values: v
      },
      meta: meta,
      data: newData,
      sortParams: sortParams
    }
    const s2Options: S2Options = {
      width: containerDom.offsetWidth,
      height: containerDom.offsetHeight,
      totals: tableTotal as Totals,
      conditions: this.configConditions(chart),
      tooltip: {
        getContainer: () => containerDom
      },
      hierarchyType: basicStyle.tableLayoutMode ?? 'grid',
      dataSet: spreadSheet => new CustomPivotDataset(spreadSheet),
      interaction: {
        hoverHighlight: !(basicStyle.showHoverStyle === false)
      },
      dataCell: meta => {
        return new CustomDataCell(meta, meta.spreadsheet)
      }
    }
    // options
    s2Options.style = this.configStyle(chart, s2DataConfig)
    s2Options.style.hierarchyCollapse = true
    // tooltip
    this.configTooltip(chart, s2Options)
    // 开始渲染
    const s2 = new PivotSheet(containerDom, s2DataConfig, s2Options as unknown as S2Options)
    // tooltip
    const { show } = tooltip
    if (show) {
      s2.on(S2Event.COL_CELL_HOVER, event => this.showTooltip(s2, event, meta))
      s2.on(S2Event.ROW_CELL_HOVER, event => this.showTooltip(s2, event, meta))
      s2.on(S2Event.DATA_CELL_HOVER, event => this.showTooltip(s2, event, meta))
    }
    // click
    s2.on(S2Event.DATA_CELL_CLICK, ev => this.dataCellClickAction(chart, ev, s2, action))
    s2.on(S2Event.ROW_CELL_CLICK, ev => this.headerCellClickAction(chart, ev, s2, action))
    s2.on(S2Event.COL_CELL_CLICK, ev => this.headerCellClickAction(chart, ev, s2, action))
    // right click
    s2.on(S2Event.GLOBAL_CONTEXT_MENU, event => copyContent(s2, event, meta))
    // theme
    const customTheme = this.configTheme(chart)
    s2.setThemeCfg({ theme: customTheme })

    return s2
  }
  private dataCellClickAction(chart: Chart, ev, s2Instance: PivotSheet, callback) {
    const cell = s2Instance.getCell(ev.target)
    const meta = cell.getMeta()
    const nameIdMap = chart.data.fields.reduce((pre, next) => {
      pre[next['dataeaseName']] = next['id']
      return pre
    }, {})
    const rowData = { ...meta.rowQuery, ...meta.colQuery }
    rowData[meta.valueField] = meta.fieldValue
    const dimensionList = []
    for (const key in rowData) {
      if (nameIdMap[key]) {
        dimensionList.push({ id: nameIdMap[key], value: rowData[key] })
      }
    }
    const param = {
      x: ev.x,
      y: ev.y,
      data: {
        dimensionList,
        name: nameIdMap[meta.valueField],
        sourceType: 'table-pivot',
        quotaList: []
      }
    }
    callback(param)
  }
  private headerCellClickAction(chart: Chart, ev, s2Instance: PivotSheet, callback) {
    const cell = s2Instance.getCell(ev.target)
    const meta = cell.getMeta()
    const rowData = meta.query
    const nameIdMap = chart.data.fields.reduce((pre, next) => {
      pre[next['dataeaseName']] = next['id']
      return pre
    }, {})
    const dimensionList = []
    for (const key in rowData) {
      if (nameIdMap[key]) {
        dimensionList.push({ id: nameIdMap[key], value: rowData[key] })
      }
    }
    const param = {
      x: ev.x,
      y: ev.y,
      data: {
        dimensionList,
        name: nameIdMap[meta.valueField],
        sourceType: 'table-pivot',
        quotaList: []
      }
    }
    callback(param)
  }
  protected configTheme(chart: Chart): S2Theme {
    const theme = super.configTheme(chart)
    const { basicStyle, tableHeader } = parseJson(chart.customAttr)
    let tableHeaderBgColor = tableHeader.tableHeaderBgColor
    if (!isAlphaColor(tableHeaderBgColor)) {
      tableHeaderBgColor = hexColorToRGBA(tableHeaderBgColor, basicStyle.alpha)
    }
    let tableBorderColor = basicStyle.tableBorderColor
    if (!isAlphaColor(tableBorderColor)) {
      tableBorderColor = hexColorToRGBA(tableBorderColor, basicStyle.alpha)
    }
    const tableHeaderFontColor = hexColorToRGBA(tableHeader.tableHeaderFontColor, basicStyle.alpha)
    const fontStyle = tableHeader.isItalic ? 'italic' : 'normal'
    const fontWeight = tableHeader.isBolder === false ? 'normal' : 'bold'
    const pivotTheme = {
      rowCell: {
        cell: {
          backgroundColor: tableHeaderBgColor,
          horizontalBorderColor: tableBorderColor,
          verticalBorderColor: tableBorderColor
        },
        text: {
          fill: tableHeaderFontColor,
          fontSize: tableHeader.tableTitleFontSize,
          textAlign: tableHeader.tableHeaderAlign,
          textBaseline: 'top',
          fontStyle,
          fontWeight
        },
        bolderText: {
          fill: tableHeaderFontColor,
          fontSize: tableHeader.tableTitleFontSize,
          textAlign: tableHeader.tableHeaderAlign,
          fontStyle,
          fontWeight
        },
        measureText: {
          fill: tableHeaderFontColor,
          fontSize: tableHeader.tableTitleFontSize,
          textAlign: tableHeader.tableHeaderAlign,
          fontStyle,
          fontWeight
        },
        seriesText: {
          fill: tableHeaderFontColor,
          fontSize: tableHeader.tableTitleFontSize,
          textAlign: tableHeader.tableHeaderAlign,
          fontStyle,
          fontWeight
        }
      }
    }
    merge(theme, pivotTheme)
    if (tableHeader.showHorizonBorder === false) {
      const tmp: S2Theme = {
        cornerCell: {
          cell: {
            horizontalBorderColor: tableHeaderBgColor,
            horizontalBorderWidth: 0
          }
        },
        rowCell: {
          cell: {
            horizontalBorderColor: tableHeaderBgColor,
            horizontalBorderWidth: 0
          }
        }
      }
      merge(theme, tmp)
    }
    if (tableHeader.showVerticalBorder === false) {
      const tmp: S2Theme = {
        cornerCell: {
          cell: {
            verticalBorderColor: tableHeaderBgColor,
            verticalBorderWidth: 0
          }
        },
        rowCell: {
          cell: {
            verticalBorderColor: tableHeaderBgColor,
            verticalBorderWidth: 0
          }
        }
      }
      merge(theme, tmp)
    }
    return theme
  }

  setupDefaultOptions(chart: ChartObj): ChartObj {
    const { customAttr } = chart
    if (customAttr.basicStyle.tableColumnMode === 'field') {
      customAttr.basicStyle.tableColumnMode = 'custom'
    }
    return chart
  }

  constructor() {
    super('table-pivot', [])
  }
}
function customCalcFunc(query, data, status, chart, totalCfgMap, axisMap, customCalc) {
  if (!data?.length || !query[EXTRA_FIELD]) {
    return 0
  }
  const aggregation = totalCfgMap[query[EXTRA_FIELD]]?.aggregation || 'SUM'
  switch (aggregation) {
    case 'SUM': {
      return data.reduce((p, n) => {
        return p + parseFloat(n[query[EXTRA_FIELD]] ?? 0)
      }, 0)
    }
    case 'AVG': {
      const sum = data.reduce((p, n) => {
        return p + parseFloat(n[query[EXTRA_FIELD]] ?? 0)
      }, 0)
      return sum / data.length
    }
    case 'MIN': {
      const result = minBy(data, n => {
        return parseFloat(n[query[EXTRA_FIELD]])
      })
      return result?.[query[EXTRA_FIELD]]
    }
    case 'MAX': {
      const result = maxBy(data, n => {
        return parseFloat(n[query[EXTRA_FIELD]])
      })
      return result?.[query[EXTRA_FIELD]]
    }
    case 'CUSTOM': {
      const val = getCustomCalcResult(query, axisMap, chart, status, customCalc || {})
      if (val === '') {
        return val
      }
      return parseFloat(val)
    }
    default: {
      return data.reduce((p, n) => {
        return p + parseFloat(n[query[EXTRA_FIELD]] ?? 0)
      }, 0)
    }
  }
}

function getCustomCalcResult(query, axisMap, chart: ChartObj, status: TotalStatus, customCalc) {
  const quotaField = query[EXTRA_FIELD]
  const { row, col } = axisMap
  // 行列交叉总计
  if (status.isRowTotal && status.isColTotal) {
    return customCalc.rowColTotal?.data?.[quotaField]
  }
  // 列总计
  if (status.isColTotal && !status.isRowSubTotal) {
    const { colTotal, rowSubInColTotal } = customCalc
    const { tableLayoutMode } = chart.customAttr.basicStyle
    const path = getTreePath(query, row)
    let val
    if (path.length) {
      if (tableLayoutMode === 'grid' && colTotal) {
        path.push(quotaField)
        val = get(colTotal.data, path)
      }
      // 树形模式的行小计放在列总计里面
      if (tableLayoutMode === 'tree') {
        const subLevel = getSubLevel(query, row)
        if (subLevel + 1 === row.length && colTotal) {
          path.push(quotaField)
          val = get(colTotal.data, path)
        }
        if (subLevel + 1 < row.length && rowSubInColTotal) {
          const data = rowSubInColTotal?.[subLevel]?.data
          path.push(quotaField)
          val = get(data, path)
        }
      }
    }
    return val
  }
  // 列小计
  if (status.isColSubTotal && !status.isRowTotal && !status.isRowSubTotal) {
    const { colSubTotal } = customCalc
    const subLevel = getSubLevel(query, col)
    const rowPath = getTreePath(query, row)
    const colPath = getTreePath(query, col)
    const path = [...rowPath, ...colPath]
    const { data } = colSubTotal?.[subLevel]
    let val
    if (path.length && data) {
      path.push(quotaField)
      val = get(data, path)
    }
    return val
  }
  // 行总计
  if (status.isRowTotal && !status.isColSubTotal) {
    const { rowTotal } = customCalc
    const path = getTreePath(query, col)
    let val
    if (path.length && rowTotal) {
      path.push(quotaField)
      val = get(rowTotal.data, path)
    }
    // 列维度为空，行维度不为空
    if (!col.length && row.length) {
      val = get(rowTotal.data, quotaField)
    }
    return val
  }
  // 行小计
  if (status.isRowSubTotal && !status.isColTotal && !status.isColSubTotal) {
    const { rowSubTotal } = customCalc
    const rowLevel = getSubLevel(query, row)
    const colPath = getTreePath(query, col)
    const rowPath = getTreePath(query, row)
    const path = [...colPath, ...rowPath]
    const { data } = rowSubTotal?.[rowLevel]
    let val
    if (path.length && rowSubTotal) {
      path.push(quotaField)
      val = get(data, path)
    }
    return val
  }
  // 行总计里面的列小计
  if (status.isRowTotal && status.isColSubTotal) {
    const { colSubInRowTotal } = customCalc
    const colLevel = getSubLevel(query, col)
    const { data } = colSubInRowTotal?.[colLevel]
    const colPath = getTreePath(query, col)
    let val
    if (colPath.length && colSubInRowTotal) {
      colPath.push(quotaField)
      val = get(data, colPath)
    }
    return val
  }
  // 列总计里面的行小计
  if (status.isColTotal && status.isRowSubTotal) {
    const { rowSubInColTotal } = customCalc
    const rowSubLevel = getSubLevel(query, row)
    const data = rowSubInColTotal?.[rowSubLevel]?.data
    const path = getTreePath(query, row)
    let val
    if (path.length && rowSubInColTotal) {
      path.push(quotaField)
      val = get(data, path)
    }
    return val
  }
  // 列小计里面的行小计
  if (status.isColSubTotal && status.isRowSubTotal) {
    const { rowSubInColSub } = customCalc
    const rowSubLevel = getSubLevel(query, row)
    const colSubLevel = getSubLevel(query, col)
    const { data } = rowSubInColSub?.[rowSubLevel]?.[colSubLevel]
    const rowPath = getTreePath(query, row)
    const colPath = getTreePath(query, col)
    const path = [...rowPath, ...colPath]
    let val
    if (path.length && rowSubInColSub) {
      path.push(quotaField)
      val = get(data, path)
    }
    return val
  }
}

function getSubLevel(query, axis) {
  const fields: [] = axis.map(a => a.dataeaseName)
  let subLevel = -1
  const queryFields = keys(query)
  for (let i = fields.length - 1; i >= 0; i--) {
    const field = fields[i]
    const index = queryFields.findIndex(f => f === field)
    if (index !== -1) {
      subLevel++
    }
  }
  return subLevel
}

function getTreePath(query, axis) {
  const path = []
  const fields = keys(query)
  axis.forEach(a => {
    const index = fields.findIndex(f => f === a.dataeaseName)
    if (index !== -1) {
      path.push(query[a.dataeaseName])
    }
  })
  return path
}

function getAggregationAndCalcFuncByQuery(totalsStatus, totalsOptions) {
  const { isRowTotal, isRowSubTotal, isColTotal, isColSubTotal } = totalsStatus
  const { row, col } = totalsOptions || {}
  const { calcTotals: rowCalcTotals = {}, calcSubTotals: rowCalcSubTotals = {} } = row || {}
  const { calcTotals: colCalcTotals = {}, calcSubTotals: colCalcSubTotals = {} } = col || {}

  const getCalcTotals = (dimensionTotals: CalcTotals, isTotal: boolean) => {
    if ((dimensionTotals.aggregation || dimensionTotals.calcFunc) && isTotal) {
      return {
        aggregation: dimensionTotals.aggregation,
        calcFunc: dimensionTotals.calcFunc
      }
    }
  }

  // 优先级: 列总计/小计 > 行总计/小计
  return (
    getCalcTotals(colCalcTotals, isColTotal) ||
    getCalcTotals(colCalcSubTotals, isColSubTotal) ||
    getCalcTotals(rowCalcTotals, isRowTotal) ||
    getCalcTotals(rowCalcSubTotals, isRowSubTotal)
  )
}

export const isNotNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isNaN(value)
  }
  if (!value) {
    return true
  }
  if (typeof value === 'string') {
    return Number.isNaN(Number(value))
  }
  return true
}

const processFieldValues = (data: DataItem[], field: string, filterIllegalValue = false) => {
  if (!data?.length) {
    return []
  }

  return data.reduce<Array<Decimal>>((resultArr, item) => {
    const fieldValue = get(item, field)
    const notNumber = isNotNumber(fieldValue)

    if (filterIllegalValue && notNumber) {
      // 过滤非法值
      return resultArr
    }

    const val = notNumber ? 0 : fieldValue
    resultArr.push(new Decimal(val))

    return resultArr
  }, [])
}

export const getDataSumByField = (data: DataItem[], field: string): number => {
  const fieldValues = processFieldValues(data, field)
  if (!fieldValues.length) {
    return 0
  }

  return Decimal.sum(...fieldValues).toNumber()
}

export const getDataExtremumByField = (
  method: 'min' | 'max',
  data: DataItem[],
  field: string
): number => {
  // 防止预处理时默认值 0 影响极值结果，处理时需过滤非法值
  const fieldValues = processFieldValues(data, field, true)
  if (!fieldValues?.length) {
    return
  }

  return Decimal[method](...fieldValues).toNumber()
}

export const getDataAvgByField = (data: DataItem[], field: string): number => {
  const fieldValues = processFieldValues(data, field)
  if (!fieldValues?.length) {
    return 0
  }

  return Decimal.sum(...fieldValues)
    .dividedBy(fieldValues.length)
    .toNumber()
}

const calcActionByType: {
  [type in Aggregation]: (data: DataItem[], field: string) => number
} = {
  [Aggregation.SUM]: getDataSumByField,
  [Aggregation.MIN]: (data, field) => getDataExtremumByField('min', data, field),
  [Aggregation.MAX]: (data, field) => getDataExtremumByField('max', data, field),
  [Aggregation.AVG]: getDataAvgByField
}
