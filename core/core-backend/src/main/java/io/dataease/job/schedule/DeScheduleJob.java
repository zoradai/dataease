package io.dataease.job.schedule;

import io.dataease.utils.LogUtil;
import org.quartz.*;

public abstract class DeScheduleJob implements Job {

    protected Long datasetTableId;
    protected String expression;
    protected Long taskId;
    protected String updateType;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getTrigger().getJobKey();
        JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
        this.datasetTableId = jobDataMap.getLong("datasetTableId");
        this.expression = jobDataMap.getString("expression");
        this.taskId = jobDataMap.getLong("taskId");
        this.updateType = jobDataMap.getString("updateType");
        LogUtil.info(jobKey.getName() + " Running: " + datasetTableId);
        LogUtil.info("CronExpression: " + expression);
        businessExecute(context);
    }

    abstract void businessExecute(JobExecutionContext context);
}
