package io.dataease.config;

import io.dataease.constant.AuthConstant;
import io.dataease.share.interceptor.LinkInterceptor;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import static io.dataease.constant.StaticResourceConstants.*;
import static io.dataease.utils.StaticResourceUtils.ensureBoth;
import static io.dataease.utils.StaticResourceUtils.ensureSuffix;
@Configuration
public class DeMvcConfig implements WebMvcConfigurer {

    @Resource
    private LinkInterceptor linkInterceptor;

    /**
     * Configuring static resource path
     *
     * @param registry registry
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String workDir = FILE_PROTOCOL + ensureSuffix(WORK_DIR, FILE_SEPARATOR);
        String uploadUrlPattern = ensureBoth(URL_SEPARATOR + UPLOAD_URL_PREFIX, AuthConstant.DE_API_PREFIX, URL_SEPARATOR) + "**";
        registry.addResourceHandler(uploadUrlPattern).addResourceLocations(workDir);

        // map
        String mapDir = FILE_PROTOCOL + ensureSuffix(MAP_DIR, FILE_SEPARATOR);
        String mapUrlPattern = ensureBoth(MAP_URL, AuthConstant.DE_API_PREFIX, URL_SEPARATOR) + "**";
        registry.addResourceHandler(mapUrlPattern).addResourceLocations(mapDir);

        String geoDir = FILE_PROTOCOL + ensureSuffix(CUSTOM_MAP_DIR, FILE_SEPARATOR);
        String geoUrlPattern = ensureBoth(GEO_URL, AuthConstant.DE_API_PREFIX, URL_SEPARATOR) + "**";
        registry.addResourceHandler(geoUrlPattern).addResourceLocations(geoDir);

    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(linkInterceptor).addPathPatterns("/**");
    }
}
