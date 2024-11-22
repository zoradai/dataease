package io.dataease.extensions.datafilling.factory;

import io.dataease.exception.DEException;
import io.dataease.extensions.datafilling.plugin.DataFillingPlugin;
import io.dataease.extensions.datafilling.provider.ExtDDLProvider;
import io.dataease.extensions.datafilling.vo.XpackPluginsDfVO;
import io.dataease.extensions.datasource.utils.SpringContextUtil;
import io.dataease.extensions.datasource.vo.DatasourceConfiguration;
import io.dataease.license.utils.LicenseUtil;
import io.dataease.license.utils.LogUtil;
import io.dataease.plugins.factory.DataEasePluginFactory;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ExtDDLProviderFactory {

    private static final Map<String, DataFillingPlugin> templateMap = new ConcurrentHashMap<>();

    public static ExtDDLProvider getExtDDLProvider(String type) {
        DatasourceConfiguration.DatasourceType datasourceType = DatasourceConfiguration.DatasourceType.valueOf(type);
        switch (datasourceType) {
            case mysql, mariadb -> {
                return SpringContextUtil.getApplicationContext().getBean("mysqlExtDDLProvider", ExtDDLProvider.class);
            }
        }
        ExtDDLProvider instance = getInstance(type);
        if (instance == null) {
            DEException.throwException("插件异常，请检查插件");
        }
        return instance;
    }

    public static ExtDDLProvider getInstance(String type) {
        //if (!LicenseUtil.licenseValid()) DEException.throwException("插件功能只对企业版本可用！");
        String key = "df_" + type;
        return templateMap.get(key);
    }

    public static void loadPlugin(String type, DataFillingPlugin plugin) {
        //if (!LicenseUtil.licenseValid()) DEException.throwException("插件功能只对企业版本可用！");
        String key = "df_" + type;
        if (templateMap.containsKey(key)) return;
        templateMap.put(key, plugin);
        try {
            String moduleName = plugin.getPluginInfo().getModuleName();
            DataEasePluginFactory.loadTemplate(moduleName, plugin);
        } catch (Exception e) {
            LogUtil.error(e.getMessage(), new Throwable(e));
            DEException.throwException(e);
        }
    }

    public static List<XpackPluginsDfVO> getDfConfigList() {
        //if (!LicenseUtil.licenseValid()) DEException.throwException("插件功能只对企业版本可用！");
        return templateMap.values().stream().map(DataFillingPlugin::getConfig).toList();
    }

}
