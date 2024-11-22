package io.dataease.dataset.dao.auto.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;

/**
 * <p>
 * 
 * </p>
 *
 * @author fit2cloud
 * @since 2023-04-14
 */
@TableName("core_dataset_table")
public class CoreDatasetTable implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * ID
     */
    private Long id;

    /**
     * 名称
     */
    private String name;

    /**
     * 物理表名
     */
    private String tableName;

    /**
     * 数据源ID
     */
    private Long datasourceId;

    /**
     * 数据集ID
     */
    private Long datasetGroupId;

    /**
     * db,sql,union,excel,api
     */
    private String type;

    /**
     * 表原始信息,表名,sql等
     */
    private String info;

    /**
     * SQL参数
     */
    private String sqlVariableDetails;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public Long getDatasetGroupId() {
        return datasetGroupId;
    }

    public void setDatasetGroupId(Long datasetGroupId) {
        this.datasetGroupId = datasetGroupId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }

    public String getSqlVariableDetails() {
        return sqlVariableDetails;
    }

    public void setSqlVariableDetails(String sqlVariableDetails) {
        this.sqlVariableDetails = sqlVariableDetails;
    }

    @Override
    public String toString() {
        return "CoreDatasetTable{" +
        "id = " + id +
        ", name = " + name +
        ", tableName = " + tableName +
        ", datasourceId = " + datasourceId +
        ", datasetGroupId = " + datasetGroupId +
        ", type = " + type +
        ", info = " + info +
        ", sqlVariableDetails = " + sqlVariableDetails +
        "}";
    }
}
