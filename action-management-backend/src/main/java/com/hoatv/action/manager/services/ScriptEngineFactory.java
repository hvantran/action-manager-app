package com.hoatv.action.manager.services;

import com.hoatv.action.manager.api.ScriptingEngine;
import com.hoatv.fwk.common.ultilities.ObjectUtils;
import com.oracle.truffle.js.scriptengine.GraalJSScriptEngine;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;

import javax.script.ScriptEngine;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public enum ScriptEngineFactory implements ScriptingEngine {

    GRAAL_JS {
        public ScriptEngine getScriptEngine() {
            System.setProperty("polyglot.engine.WarnInterpreterOnly", "false");

            // Init script engine context builder
            Map<String, String> options = new HashMap<>();
            options.put("js.nashorn-compat", "true");
            options.put("js.ecmascript-version", "2022");
            Context.Builder scripEngineContextBuilder = Context.newBuilder("js")
                    .allowHostAccess(HostAccess.ALL)
                    .allowExperimentalOptions(true)
                    .allowHostClassLookup(s -> true)
                    .options(options);

            ScriptEngine scriptEngine = GraalJSScriptEngine.create(null, scripEngineContextBuilder);
            ObjectUtils.checkThenThrow(Objects::isNull, scriptEngine, "Cannot init Script Engine");
            return scriptEngine;
        }
    };
}
