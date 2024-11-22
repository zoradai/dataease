package io.dataease.cache.impl;

import io.dataease.cache.DECacheService;
import io.dataease.utils.CommonBeanFactory;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@ConditionalOnExpression("'${spring.cache.type}'.equals('redis')")
@Component("dECacheService")
public class RedisCacheImpl implements DECacheService {

    private static final String SEPARATOR = "::";

    @Resource
    private RedisTemplate redisTemplate;

    private static CacheManager cacheManager;


    private static CacheManager getCacheManager() {
        if (cacheManager == null)
            cacheManager = CommonBeanFactory.getBean(CacheManager.class);
        return cacheManager;
    }


    private ValueOperations ops() {
        ValueOperations valueOperations = redisTemplate.opsForValue();
        return valueOperations;
    }

    @Override
    public void put(String cacheName, String key, Object value, Long expTime, TimeUnit unit) {
        ValueOperations ops = ops();
        String realKey = cacheName + SEPARATOR + key;
        if (expTime <= 0) {
            ops.set(realKey, value);
            return;
        }
        if (ObjectUtils.isEmpty(unit)) {
            unit = TimeUnit.SECONDS;
        }
        ops.set(realKey, value, expTime, unit);
    }

    @Override
    public Object get(String cacheName, String key) {
        ValueOperations ops = ops();
        return ops.get(cacheName + SEPARATOR + key);
    }

    @Override
    public boolean cacheExist(String cacheName) {
        return true;
    }

    @Override
    public boolean keyExist(String cacheName, String key) {
        return redisTemplate.hasKey(cacheName + SEPARATOR + key);
    }

    @Override
    public void keyRemove(String cacheName, String key) {
        Cache cache = getCacheManager().getCache(cacheName);
        if (null == cache) return;
        cache.evictIfPresent(key);
        cache.clear();
        redisTemplate.delete(cacheName + SEPARATOR + key);
    }

    @PostConstruct
    public void init() {
    }
}
