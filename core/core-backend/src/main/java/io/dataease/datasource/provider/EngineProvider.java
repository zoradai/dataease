package io.dataease.datasource.provider;

import io.dataease.datasource.dao.auto.entity.CoreDeEngine;
import io.dataease.datasource.request.EngineRequest;
import io.dataease.extensions.datasource.dto.TableField;

import java.util.List;

/**
 * @Author gin
 * @Date 2021/5/17 4:19 下午
 */
public abstract class EngineProvider {
    public abstract String createView(String name, String viewSQL);

    public abstract String dropTable(String name);

    public abstract String dropView(String name);

    public abstract String replaceTable(String name);

    public abstract String createTableSql(String name, List<TableField> tableFields, CoreDeEngine engine);

    public abstract String insertSql(String name, List<String[]> dataList, int page, int pageNumber);


}
