package io.dataease.chart.manage;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.dataease.api.chart.vo.ChartBaseVO;
import io.dataease.api.chart.vo.ViewSelectorVO;
import io.dataease.chart.dao.auto.entity.CoreChartView;
import io.dataease.chart.dao.auto.mapper.CoreChartViewMapper;
import io.dataease.chart.dao.ext.entity.ChartBasePO;
import io.dataease.chart.dao.ext.mapper.ExtChartViewMapper;
import io.dataease.dataset.dao.auto.entity.CoreDatasetTableField;
import io.dataease.dataset.dao.auto.mapper.CoreDatasetTableFieldMapper;
import io.dataease.dataset.manage.DatasetTableFieldManage;
import io.dataease.dataset.manage.PermissionManage;
import io.dataease.dataset.utils.TableUtils;
import io.dataease.engine.constant.ExtFieldConstant;
import io.dataease.engine.func.FunctionConstant;
import io.dataease.engine.utils.Utils;
import io.dataease.exception.DEException;
import io.dataease.extensions.datasource.api.PluginManageApi;
import io.dataease.extensions.datasource.dto.CalParam;
import io.dataease.extensions.datasource.dto.DatasetTableFieldDTO;
import io.dataease.extensions.datasource.model.SQLObj;
import io.dataease.extensions.view.dto.*;
import io.dataease.extensions.view.filter.FilterTreeObj;
import io.dataease.i18n.Translator;
import io.dataease.license.config.XpackInteract;
import io.dataease.utils.BeanUtils;
import io.dataease.utils.IDUtils;
import io.dataease.utils.JsonUtil;
import io.dataease.visualization.dao.auto.entity.DataVisualizationInfo;
import io.dataease.visualization.dao.auto.mapper.DataVisualizationInfoMapper;
import jakarta.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @Author Junjun
 */
@Component
public class ChartViewManege {
    @Resource
    private CoreChartViewMapper coreChartViewMapper;
    @Resource
    private ChartDataManage chartDataManage;
    @Resource
    private CoreDatasetTableFieldMapper coreDatasetTableFieldMapper;
    @Resource
    private PermissionManage permissionManage;

    @Resource
    private DataVisualizationInfoMapper visualizationInfoMapper;

    @Resource
    private ExtChartViewMapper extChartViewMapper;

    @Resource
    private DatasetTableFieldManage datasetTableFieldManage;
    @Autowired(required = false)
    private PluginManageApi pluginManage;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ChartViewDTO save(ChartViewDTO chartViewDTO) throws Exception {
        if (chartViewDTO.getTitle().length() > 100) {
            DEException.throwException(Translator.get("i18n_name_limit_100"));
        }
        Long id = chartViewDTO.getId();
        if (id == null) {
            DEException.throwException(Translator.get("i18n_no_id"));
        }
        CoreChartView coreChartView = coreChartViewMapper.selectById(id);
        CoreChartView record = transDTO2Record(chartViewDTO);
        if (ObjectUtils.isEmpty(coreChartView)) {
            coreChartViewMapper.insert(record);
        } else {
            UpdateWrapper<CoreChartView> updateWrapper = new UpdateWrapper<>();
            updateWrapper.eq("id", record.getId());
            //富文本允许设置空的tableId 这里额外更新一下
            if (record.getTableId() == null) {
                updateWrapper.set("table_id", null);
            }
            coreChartViewMapper.update(record, updateWrapper);
        }
        return chartViewDTO;
    }

    public void delete(Long id) {
        coreChartViewMapper.deleteById(id);
    }

    @XpackInteract(value = "chartViewManage")
    public void disuse(List<Long> chartIdList) {
    }

    @Transactional
    public void deleteBySceneId(Long sceneId, List<Long> chartIds) {
        QueryWrapper<CoreChartView> wrapper = new QueryWrapper<>();
        wrapper.eq("scene_id", sceneId);
        wrapper.notIn("id", chartIds);
        coreChartViewMapper.delete(wrapper);
    }

    public ChartViewDTO getDetails(Long id) {
        CoreChartView coreChartView = coreChartViewMapper.selectById(id);
        if (ObjectUtils.isEmpty(coreChartView)) {
            return null;
        }
        ChartViewDTO dto = transRecord2DTO(coreChartView);
        return dto;
    }

    /**
     * sceneId 为仪表板或者数据大屏id
     */
    public List<ChartViewDTO> listBySceneId(Long sceneId) {
        QueryWrapper<CoreChartView> wrapper = new QueryWrapper<>();
        wrapper.eq("scene_id", sceneId);
        List<ChartViewDTO> chartViewDTOS = transChart(coreChartViewMapper.selectList(wrapper));
        for (ChartViewDTO dto : chartViewDTOS) {
            QueryWrapper<CoreDatasetTableField> wp = new QueryWrapper<>();
            wp.eq("dataset_group_id", dto.getTableId());
            List<CoreDatasetTableField> coreDatasetTableFields = coreDatasetTableFieldMapper.selectList(wp);
            dto.setCalParams(Utils.getParams(datasetTableFieldManage.transDTO(coreDatasetTableFields)));
        }
        return chartViewDTOS;
    }

    public List<ChartViewDTO> transChart(List<CoreChartView> list) {
        if (ObjectUtils.isEmpty(list)) {
            return Collections.emptyList();
        }
        return list.stream().map(ele -> {
            ChartViewDTO dto = transRecord2DTO(ele);
            return dto;
        }).collect(Collectors.toList());
    }

    public ChartViewDTO getChart(Long id) throws Exception {
        ChartViewDTO details = getDetails(id);
        if (details == null) {
            return null;
        }
        return chartDataManage.calcData(details);
    }

    public Map<String, List<ChartViewFieldDTO>> listByDQ(Long id, Long chartId, ChartViewDTO chartViewDTO) {
        QueryWrapper<CoreDatasetTableField> wrapper = new QueryWrapper<>();
        wrapper.eq("dataset_group_id", id);
        wrapper.eq("checked", true);
        wrapper.isNull("chart_id");

        TypeReference<List<CalParam>> typeToken = new TypeReference<>() {
        };
        List<CoreDatasetTableField> fields = coreDatasetTableFieldMapper.selectList(wrapper);
        List<DatasetTableFieldDTO> collect = fields.stream().map(ele -> {
            DatasetTableFieldDTO dto = new DatasetTableFieldDTO();
            BeanUtils.copyBean(dto, ele);
            dto.setParams(JsonUtil.parseList(ele.getParams(), typeToken));
            return dto;
        }).collect(Collectors.toList());
        // filter column disable field
        Map<String, ColumnPermissionItem> desensitizationList = new HashMap<>();
        List<DatasetTableFieldDTO> datasetTableFieldDTOS = permissionManage.filterColumnPermissions(collect, desensitizationList, id, null);
        datasetTableFieldDTOS.forEach(ele -> ele.setDesensitized(desensitizationList.containsKey(ele.getDataeaseName())));
        datasetTableFieldDTOS.add(createCountField(id));
        List<ChartViewFieldDTO> list = transFieldDTO(datasetTableFieldDTOS);

        // 获取图表计算字段
        wrapper.clear();
        wrapper.eq("chart_id", chartId);
        List<DatasetTableFieldDTO> chartFields = coreDatasetTableFieldMapper.selectList(wrapper).stream().map(ele -> {
            DatasetTableFieldDTO dto = new DatasetTableFieldDTO();
            BeanUtils.copyBean(dto, ele);
            return dto;
        }).collect(Collectors.toList());
        list.addAll(transFieldDTO(chartFields));

        // 获取list中的聚合函数，将字段的summary设置成空
        SQLObj tableObj = new SQLObj();
        tableObj.setTableAlias("");

        for (ChartViewFieldDTO ele : list) {
            if (Objects.equals(ele.getExtField(), ExtFieldConstant.EXT_CALC)) {
                List<DatasetTableFieldDTO> f = list.stream().map(e -> {
                    DatasetTableFieldDTO dto = new DatasetTableFieldDTO();
                    BeanUtils.copyBean(dto, e);
                    return dto;
                }).collect(Collectors.toList());
                String originField = Utils.calcFieldRegex(ele.getOriginName(), tableObj, f, true, null, Utils.mergeParam(Utils.getParams(f), null), pluginManage);
                for (String func : FunctionConstant.AGG_FUNC) {
                    if (Utils.matchFunction(func, originField)) {
                        ele.setSummary("");
                        ele.setAgg(true);
                        break;
                    }
                }
            }
        }

        List<ChartViewFieldDTO> dimensionList = list.stream().filter(ele -> StringUtils.equalsIgnoreCase(ele.getGroupType(), "d")).collect(Collectors.toList());
        List<ChartViewFieldDTO> quotaList = list.stream().filter(ele -> StringUtils.equalsIgnoreCase(ele.getGroupType(), "q")).collect(Collectors.toList());

        Map<String, List<ChartViewFieldDTO>> map = new LinkedHashMap<>();
        map.put("dimensionList", dimensionList);
        map.put("quotaList", quotaList);
        return map;
    }

    public void copyField(Long id, Long chartId) {
        CoreDatasetTableField coreDatasetTableField = coreDatasetTableFieldMapper.selectById(id);
        QueryWrapper<CoreDatasetTableField> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("dataset_group_id", coreDatasetTableField.getDatasetGroupId());
        List<CoreDatasetTableField> coreDatasetTableFields = coreDatasetTableFieldMapper.selectList(queryWrapper);
        HashMap<String, String> map = new HashMap<>();
        for (CoreDatasetTableField ele : coreDatasetTableFields) {
            map.put(ele.getName(), ele.getName());
        }
        newName(map, coreDatasetTableField, coreDatasetTableField.getName());
        coreDatasetTableField.setChartId(chartId);
        coreDatasetTableField.setExtField(2);
        coreDatasetTableField.setOriginName("[" + id + "]");
        coreDatasetTableField.setId(IDUtils.snowID());
        coreDatasetTableField.setDataeaseName(TableUtils.fieldNameShort(coreDatasetTableField.getId() + "_" + coreDatasetTableField.getOriginName()));
        coreDatasetTableField.setFieldShortName(coreDatasetTableField.getDataeaseName());
        coreDatasetTableFieldMapper.insert(coreDatasetTableField);
    }

    private void newName(HashMap<String, String> map, CoreDatasetTableField coreDatasetTableField, String name) {
        name = name + "_copy";
        if (map.containsKey(name)) {
            newName(map, coreDatasetTableField, name);
        } else {
            coreDatasetTableField.setName(name);
        }
    }

    public void deleteField(Long id) {
        coreDatasetTableFieldMapper.deleteById(id);
    }

    public void deleteFieldByChartId(Long chartId) {
        QueryWrapper<CoreDatasetTableField> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("chart_id", chartId);
        coreDatasetTableFieldMapper.delete(queryWrapper);
    }

    public ChartBaseVO chartBaseInfo(Long id) {
        ChartBasePO po = extChartViewMapper.queryChart(id);
        if (ObjectUtils.isEmpty(po)) return null;
        ChartBaseVO vo = BeanUtils.copyBean(new ChartBaseVO(), po);
        TypeReference<List<ChartViewFieldDTO>> tokenType = new TypeReference<>() {
        };
        vo.setXAxis(JsonUtil.parseList(po.getXAxis(), tokenType));
        vo.setXAxisExt(JsonUtil.parseList(po.getXAxisExt(), tokenType));
        vo.setYAxis(JsonUtil.parseList(po.getYAxis(), tokenType));
        vo.setYAxisExt(JsonUtil.parseList(po.getYAxisExt(), tokenType));
        vo.setExtStack(JsonUtil.parseList(po.getExtStack(), tokenType));
        vo.setExtBubble(JsonUtil.parseList(po.getExtBubble(), tokenType));
        vo.setFlowMapStartName(JsonUtil.parseList(po.getFlowMapStartName(), tokenType));
        vo.setFlowMapEndName(JsonUtil.parseList(po.getFlowMapEndName(), tokenType));
        if (StringUtils.isBlank(po.getExtColor()) || StringUtils.equals("null", po.getExtColor())) {
            vo.setExtColor(new ArrayList<>());
        } else {
            vo.setExtColor(JsonUtil.parseList(po.getExtColor(), tokenType));
        }
        vo.setExtLabel(JsonUtil.parseList(po.getExtLabel(), tokenType));
        vo.setExtTooltip(JsonUtil.parseList(po.getExtTooltip(), tokenType));
        return vo;
    }

    public DatasetTableFieldDTO createCountField(Long id) {
        DatasetTableFieldDTO dto = new DatasetTableFieldDTO();
        dto.setId(-1L);
        dto.setDatasetGroupId(id);
        dto.setOriginName("*");
        dto.setName("记录数*");
        dto.setDataeaseName("*");
        dto.setType("INT");
        dto.setChecked(true);
        dto.setColumnIndex(999);
        dto.setDeType(2);
        dto.setExtField(1);
        dto.setGroupType("q");
        return dto;
    }

    public List<ChartViewFieldDTO> transFieldDTO(List<DatasetTableFieldDTO> list) {
        return list.stream().map(ele -> {
            ChartViewFieldDTO dto = new ChartViewFieldDTO();
            if (ele == null) return null;
            BeanUtils.copyBean(dto, ele);
            dto.setDateStyle("y_M_d");
            dto.setDatePattern("date_sub");
            dto.setChartType("bar");

            if (dto.getId() == -1L || dto.getDeType() == 0 || dto.getDeType() == 1 || dto.getDeType() == 7) {
                dto.setSummary("count");
            } else {
                dto.setSummary("sum");
            }

            ChartFieldCompareDTO chartFieldCompareDTO = new ChartFieldCompareDTO();
            chartFieldCompareDTO.setType("none");
            dto.setCompareCalc(chartFieldCompareDTO);

            dto.setFormatterCfg(new FormatterCfgDTO());

            dto.setSort("none");
            dto.setFilter(Collections.emptyList());
            return dto;
        }).collect(Collectors.toList());
    }

    public CoreChartView transDTO2Record(ChartViewDTO dto) throws Exception {
        CoreChartView record = new CoreChartView();
        BeanUtils.copyBean(record, dto);

        record.setxAxis(objectMapper.writeValueAsString(dto.getXAxis()));
        record.setxAxisExt(objectMapper.writeValueAsString(dto.getXAxisExt()));
        record.setyAxis(objectMapper.writeValueAsString(dto.getYAxis()));
        record.setyAxisExt(objectMapper.writeValueAsString(dto.getYAxisExt()));
        record.setExtStack(objectMapper.writeValueAsString(dto.getExtStack()));
        record.setExtBubble(objectMapper.writeValueAsString(dto.getExtBubble()));
        record.setExtLabel(objectMapper.writeValueAsString(dto.getExtLabel()));
        record.setExtTooltip(objectMapper.writeValueAsString(dto.getExtTooltip()));
        record.setCustomAttr(objectMapper.writeValueAsString(dto.getCustomAttr()));
        if(dto.getCustomAttrMobile() != null){
            record.setCustomAttrMobile(objectMapper.writeValueAsString(dto.getCustomAttrMobile()));
        }
        record.setCustomStyle(objectMapper.writeValueAsString(dto.getCustomStyle()));
        if(dto.getCustomAttrMobile() != null) {
            record.setCustomStyleMobile(objectMapper.writeValueAsString(dto.getCustomStyleMobile()));
        }
        record.setSenior(objectMapper.writeValueAsString(dto.getSenior()));
        record.setDrillFields(objectMapper.writeValueAsString(dto.getDrillFields()));
        record.setCustomFilter(objectMapper.writeValueAsString(dto.getCustomFilter()));
        record.setViewFields(objectMapper.writeValueAsString(dto.getViewFields()));
        record.setFlowMapStartName(objectMapper.writeValueAsString(dto.getFlowMapStartName()));
        record.setFlowMapEndName(objectMapper.writeValueAsString(dto.getFlowMapEndName()));
        record.setExtColor(objectMapper.writeValueAsString(dto.getExtColor()));

        return record;
    }

    public ChartViewDTO transRecord2DTO(CoreChartView record) {
        ChartViewDTO dto = new ChartViewDTO();
        BeanUtils.copyBean(dto, record);

        TypeReference<List<ChartViewFieldDTO>> tokenType = new TypeReference<>() {
        };

        dto.setXAxis(JsonUtil.parseList(record.getxAxis(), tokenType));
        dto.setXAxisExt(JsonUtil.parseList(record.getxAxisExt(), tokenType));
        dto.setYAxis(JsonUtil.parseList(record.getyAxis(), tokenType));
        dto.setYAxisExt(JsonUtil.parseList(record.getyAxisExt(), tokenType));
        dto.setExtStack(JsonUtil.parseList(record.getExtStack(), tokenType));
        dto.setExtBubble(JsonUtil.parseList(record.getExtBubble(), tokenType));
        dto.setExtLabel(JsonUtil.parseList(record.getExtLabel(), tokenType));
        dto.setExtTooltip(JsonUtil.parseList(record.getExtTooltip(), tokenType));
        dto.setCustomAttr(JsonUtil.parse(record.getCustomAttr(), Map.class));
        if(record.getCustomAttrMobile() != null){
            dto.setCustomAttrMobile(JsonUtil.parse(record.getCustomAttrMobile(), Map.class));
        }
        dto.setCustomStyle(JsonUtil.parse(record.getCustomStyle(), Map.class));
        if(record.getCustomStyleMobile() != null) {
            dto.setCustomStyleMobile(JsonUtil.parse(record.getCustomStyleMobile(), Map.class));
        }
        dto.setSenior(JsonUtil.parse(record.getSenior(), Map.class));
        dto.setDrillFields(JsonUtil.parseList(record.getDrillFields(), tokenType));
        dto.setCustomFilter(JsonUtil.parseObject(record.getCustomFilter(), FilterTreeObj.class));
        dto.setViewFields(JsonUtil.parseList(record.getViewFields(), tokenType));
        dto.setFlowMapStartName(JsonUtil.parseList(record.getFlowMapStartName(), tokenType));
        dto.setFlowMapEndName(JsonUtil.parseList(record.getFlowMapEndName(), tokenType));
        dto.setExtColor(JsonUtil.parseList(record.getExtColor(), tokenType));

        return dto;

    }

    public String checkSameDataSet(String viewIdSource, String viewIdTarget) {
        QueryWrapper<CoreChartView> wrapper = new QueryWrapper<>();
        wrapper.select("distinct table_id");
        wrapper.in("id", Arrays.asList(viewIdSource, viewIdTarget));
        coreChartViewMapper.selectCount(wrapper);
        if (coreChartViewMapper.selectCount(wrapper) == 1) {
            return "YES";
        } else {
            return "NO";
        }

    }

    public List<ViewSelectorVO> viewOption(Long resourceId) {
        List<ViewSelectorVO> result = extChartViewMapper.queryViewOption(resourceId);
        DataVisualizationInfo dvInfo = visualizationInfoMapper.selectById(resourceId);
        if (dvInfo != null && !CollectionUtils.isEmpty(result)) {
            String componentData = dvInfo.getComponentData();
            return result.stream().filter(item -> componentData.indexOf(String.valueOf(item.getId())) > 0).toList();
        } else {
            return result;
        }
    }
}
