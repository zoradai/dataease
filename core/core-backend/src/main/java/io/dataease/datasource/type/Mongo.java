package io.dataease.datasource.type;

import io.dataease.extensions.datasource.vo.DatasourceConfiguration;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Data
@Component("mongo")
public class Mongo extends DatasourceConfiguration {
    private String driver = "com.mysql.cj.jdbc.Driver";
    private String extraParams = "characterEncoding=UTF-8&connectTimeout=5000&useSSL=false&allowPublicKeyRetrieval=true&zeroDateTimeBehavior=convertToNull";
    private List<String> illegalParameters = Arrays.asList("autoDeserialize", "queryInterceptors", "statementInterceptors", "detectCustomCollations");
    private List<String> showTableSqls = Arrays.asList("show tables");

    public String getJdbc() {
        if(StringUtils.isNoneEmpty(getUrlType()) && !getUrlType().equalsIgnoreCase("hostName")){
            return getJdbcUrl();
        }
        if (StringUtils.isEmpty(extraParams.trim())) {
            return "jdbc:mysql://HOSTNAME:PORT/DATABASE"
                    .replace("HOSTNAME", getLHost().trim())
                    .replace("PORT", getLPort().toString().trim())
                    .replace("DATABASE", getDataBase().trim());
        } else {
            for (String illegalParameter : illegalParameters) {
                if (getExtraParams().contains(illegalParameter)) {
                    throw new RuntimeException("Illegal parameter: " + illegalParameter);
                }
            }

            return "jdbc:mysql://HOSTNAME:PORT/DATABASE?EXTRA_PARAMS"
                    .replace("HOSTNAME", getLHost().trim())
                    .replace("PORT", getLPort().toString().trim())
                    .replace("DATABASE", getDataBase().trim())
                    .replace("EXTRA_PARAMS", getExtraParams().trim());
        }
    }
}
