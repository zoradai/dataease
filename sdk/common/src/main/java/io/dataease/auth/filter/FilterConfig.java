package io.dataease.auth.filter;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean orderFilter() {
        FilterRegistrationBean filter = new FilterRegistrationBean<>();
        filter.setName("tokenFilter");
        filter.setFilter(new TokenFilter());
        filter.addUrlPatterns("/*");
        filter.setOrder(0);
        return filter;
    }

    @Bean
    public FilterRegistrationBean communityFilter() {
        FilterRegistrationBean filter = new FilterRegistrationBean<>();
        filter.setName("communityTokenFilter");
        filter.setFilter(new CommunityTokenFilter());
        filter.addUrlPatterns("/*");
        filter.setOrder(5);
        return filter;
    }
}
