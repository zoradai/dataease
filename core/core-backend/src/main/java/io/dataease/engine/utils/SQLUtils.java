package io.dataease.engine.utils;

import java.util.Optional;

/**
 * @Author Junjun
 */
public class SQLUtils {
    public static String transKeyword(String value) {
        return Optional.ofNullable(value).orElse("").replaceAll("'", "''");
    }

    public static String buildOriginPreviewSql(String sql, int limit, int offset) {
        return "SELECT * FROM (" + sql + ") tmp LIMIT " + limit + " OFFSET " + offset;
    }

    public static String buildOriginPreviewSqlWithOrderBy(String sql, int limit, int offset, String orderBy) {
        return "SELECT * FROM (" + sql + ") tmp ORDER BY " + orderBy + " LIMIT " + limit + " OFFSET " + offset;
    }
}
