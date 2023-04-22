package com.hoatv.action.manager.services;

import com.hoatv.action.manager.api.JobLauncher;
import com.hoatv.action.manager.api.Launcher;
import com.hoatv.fwk.common.services.CheckedSupplier;
import com.hoatv.fwk.common.services.HttpClientService;
import com.hoatv.system.health.metrics.MethodStatisticCollector;
import com.hoatv.task.mgmt.services.TaskFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import java.util.Map;

@Service
public class ScriptEngineService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ScriptEngineService.class);

    private final MethodStatisticCollector methodStatisticCollector;

    @Autowired
    public ScriptEngineService(MethodStatisticCollector methodStatisticCollector) {
        this.methodStatisticCollector = methodStatisticCollector;
    }

    public <T> T execute(String scriptContent, Map<String, Object> executionContext) {
        return execute(JobLauncher.class, scriptContent, executionContext);
    }

    public <T> T execute(Class<? extends Launcher> klass, String scriptContent,
                               Map<String, Object> executionContext) {
        ScriptEngine scriptEngine = ScriptEngineFactory.GRAAL_JS.getScriptEngine();

        scriptEngine.put("httpClientService", HttpClientService.INSTANCE);
        scriptEngine.put("taskFactory", TaskFactory.INSTANCE);
        scriptEngine.put("methodStatisticCollector", methodStatisticCollector);
        scriptEngine.put("LOGGER", LOGGER);

        LOGGER.info("Putting execution context into script engine: {}", executionContext);
        executionContext.forEach(scriptEngine::put);

        LOGGER.info("Eval the script content {}", scriptContent);
        CheckedSupplier<Object> evalObjectSupplier = () -> scriptEngine.eval(scriptContent);
        evalObjectSupplier.get();

        Invocable invocable = (Invocable) scriptEngine;
        Launcher launcher = invocable.getInterface(klass);
        LOGGER.info("Executing the job {}", launcher);
        return launcher.execute();
    }
}
