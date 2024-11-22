package io.dataease.config;

import com.fit2cloud.autoconfigure.QuartzAutoConfiguration;
import io.dataease.utils.CommonThreadPool;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
@AutoConfigureBefore(QuartzAutoConfiguration.class)
public class CommonConfig {

    @Bean(destroyMethod = "shutdown")
    public CommonThreadPool resourcePoolThreadPool() {
        CommonThreadPool commonThreadPool = new CommonThreadPool();
        commonThreadPool.setCorePoolSize(50);
        commonThreadPool.setMaxQueueSize(100);
        commonThreadPool.setKeepAliveSeconds(3600);
        return commonThreadPool;
    }
}
