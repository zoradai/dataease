package io.dataease.dataset.dao.auto.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;

/**
 * <p>
 * table数据集表字段
 * </p>
 *
 * @author fit2cloud
 * @since 2024-08-07
 */
@TableName("core_dataset_table_field")
public class CoreDatasetTableField implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * ID
     */
    private Long id;

    /**
     * 数据源ID
     */
    private Long datasourceId;

    /**
     * 数据表ID
     */
    private Long datasetTableId;

    /**
     * 数据集ID
     */
    private Long datasetGroupId;

    /**
     * 视图ID
     */
    private Long chartId;

    /**
     * 原始字段名
     */
    private String originName;

    /**
     * 字段名用于展示
     */
    private String name;

    /**
     * 描述
     */
    private String description;

    /**
     * de字段名用作唯一标识
     */
    private String dataeaseName;

    /**
     * de字段别名
     */
    private String fieldShortName;

    /**
     * 维度/指标标识 d:维度，q:指标
     */
    private String groupType;

    /**
     * 原始字段类型
     */
    private String type;

    /**
     * 字段长度（允许为空，默认0）
     */
    private Integer size;

    /**
     * dataease字段类型：0-文本，1-时间，2-整型数值，3-浮点数值，4-布尔，5-地理位置，6-二进制
     */
    private Integer deType;

    /**
     * de记录的原始类型
     */
    private Integer deExtractType;

    /**
     * 是否扩展字段 0原始 1复制 2计算字段...
     */
    private Integer extField;

    /**
     * 是否选中
     */
    private Boolean checked;

    /**
     * 列位置
     */
    private Integer columnIndex;

    /**
     * 同步时间
     */
    private Long lastSyncTime;

    /**
     * 精度
     */
    private Integer accuracy;

    /**
     * 时间字段类型
     */
    private String dateFormat;

    /**
     * 时间格式类型
     */
    private String dateFormatType;

    /**
     * 计算字段参数
     */
    private String params;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public Long getDatasetTableId() {
        return datasetTableId;
    }

    public void setDatasetTableId(Long datasetTableId) {
        this.datasetTableId = datasetTableId;
    }

    public Long getDatasetGroupId() {
        return datasetGroupId;
    }

    public void setDatasetGroupId(Long datasetGroupId) {
        this.datasetGroupId = datasetGroupId;
    }

    public Long getChartId() {
        return chartId;
    }

    public void setChartId(Long chartId) {
        this.chartId = chartId;
    }

    public String getOriginName() {
        return originName;
    }

    public void setOriginName(String originName) {
        this.originName = originName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDataeaseName() {
        return dataeaseName;
    }

    public void setDataeaseName(String dataeaseName) {
        this.dataeaseName = dataeaseName;
    }

    public String getFieldShortName() {
        return fieldShortName;
    }

    public void setFieldShortName(String fieldShortName) {
        this.fieldShortName = fieldShortName;
    }

    public String getGroupType() {
        return groupType;
    }

    public void setGroupType(String groupType) {
        this.groupType = groupType;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Integer getDeType() {
        return deType;
    }

    public void setDeType(Integer deType) {
        this.deType = deType;
    }

    public Integer getDeExtractType() {
        return deExtractType;
    }

    public void setDeExtractType(Integer deExtractType) {
        this.deExtractType = deExtractType;
    }

    public Integer getExtField() {
        return extField;
    }

    public void setExtField(Integer extField) {
        this.extField = extField;
    }

    public Boolean getChecked() {
        return checked;
    }

    public void setChecked(Boolean checked) {
        this.checked = checked;
    }

    public Integer getColumnIndex() {
        return columnIndex;
    }

    public void setColumnIndex(Integer columnIndex) {
        this.columnIndex = columnIndex;
    }

    public Long getLastSyncTime() {
        return lastSyncTime;
    }

    public void setLastSyncTime(Long lastSyncTime) {
        this.lastSyncTime = lastSyncTime;
    }

    public Integer getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Integer accuracy) {
        this.accuracy = accuracy;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getDateFormatType() {
        return dateFormatType;
    }

    public void setDateFormatType(String dateFormatType) {
        this.dateFormatType = dateFormatType;
    }

    public String getParams() {
        return params;
    }

    public void setParams(String params) {
        this.params = params;
    }

    @Override
    public String toString() {
        return "CoreDatasetTableField{" +
        "id = " + id +
        ", datasourceId = " + datasourceId +
        ", datasetTableId = " + datasetTableId +
        ", datasetGroupId = " + datasetGroupId +
        ", chartId = " + chartId +
        ", originName = " + originName +
        ", name = " + name +
        ", description = " + description +
        ", dataeaseName = " + dataeaseName +
        ", fieldShortName = " + fieldShortName +
        ", groupType = " + groupType +
        ", type = " + type +
        ", size = " + size +
        ", deType = " + deType +
        ", deExtractType = " + deExtractType +
        ", extField = " + extField +
        ", checked = " + checked +
        ", columnIndex = " + columnIndex +
        ", lastSyncTime = " + lastSyncTime +
        ", accuracy = " + accuracy +
        ", dateFormat = " + dateFormat +
        ", dateFormatType = " + dateFormatType +
        ", params = " + params +
        "}";
    }
}
