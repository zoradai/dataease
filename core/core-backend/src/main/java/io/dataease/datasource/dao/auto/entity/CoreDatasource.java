package io.dataease.datasource.dao.auto.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;

/**
 * <p>
 * 数据源表
 * </p>
 *
 * @author fit2cloud
 * @since 2024-07-09
 */
@TableName("core_datasource")
public class CoreDatasource implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 名称
     */
    private String name;

    /**
     * 描述
     */
    private String description;

    /**
     * 类型
     */
    private String type;

    /**
     * 父级ID
     */
    private Long pid;

    /**
     * 更新方式：0：替换；1：追加
     */
    private String editType;

    /**
     * 详细信息
     */
    private String configuration;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 变更人
     */
    private Long updateBy;

    /**
     * 创建人ID
     */
    private String createBy;

    /**
     * 状态
     */
    private String status;

    /**
     * 状态
     */
    private String qrtzInstance;

    /**
     * 任务状态
     */
    private String taskStatus;

    /**
     * 开启数据填报
     */
    private Boolean enableDataFill;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getPid() {
        return pid;
    }

    public void setPid(Long pid) {
        this.pid = pid;
    }

    public String getEditType() {
        return editType;
    }

    public void setEditType(String editType) {
        this.editType = editType;
    }

    public String getConfiguration() {
        return configuration;
    }

    public void setConfiguration(String configuration) {
        this.configuration = configuration;
    }

    public Long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }

    public Long getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(Long updateTime) {
        this.updateTime = updateTime;
    }

    public Long getUpdateBy() {
        return updateBy;
    }

    public void setUpdateBy(Long updateBy) {
        this.updateBy = updateBy;
    }

    public String getCreateBy() {
        return createBy;
    }

    public void setCreateBy(String createBy) {
        this.createBy = createBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrtzInstance() {
        return qrtzInstance;
    }

    public void setQrtzInstance(String qrtzInstance) {
        this.qrtzInstance = qrtzInstance;
    }

    public String getTaskStatus() {
        return taskStatus;
    }

    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
    }

    public Boolean getEnableDataFill() {
        return enableDataFill;
    }

    public void setEnableDataFill(Boolean enableDataFill) {
        this.enableDataFill = enableDataFill;
    }

    @Override
    public String toString() {
        return "CoreDatasource{" +
        "id = " + id +
        ", name = " + name +
        ", description = " + description +
        ", type = " + type +
        ", pid = " + pid +
        ", editType = " + editType +
        ", configuration = " + configuration +
        ", createTime = " + createTime +
        ", updateTime = " + updateTime +
        ", updateBy = " + updateBy +
        ", createBy = " + createBy +
        ", status = " + status +
        ", qrtzInstance = " + qrtzInstance +
        ", taskStatus = " + taskStatus +
        ", enableDataFill = " + enableDataFill +
        "}";
    }
}
