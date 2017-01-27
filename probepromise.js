

window['probePromise'] = (function() {
  var probeId = -1;
  var probes = [];

  // Whether to skip the async part of gathering to probe.
  // Namely: Waiting for fetch() to complete to obtain the result promise from
  // Response#text()
  var skipAsync = false;


  function gatherProbe(tag, done) {
    probeId++;
    var probe = {
      id: probeId,
      tag: tag || 'probe' + probeId,
      zoneJsPresent: false,
      Promise: null,
      promiseName: null,
      NativePromise: null,
      ZoneAwarePromise: null,
      promise: null,
      fetchResult: null,
      textResult: null,
    };
    probes.push(probe);

    probe.Promise = window['Promise'];
    probe.promiseName = probe.Promise.name;

    probe.zoneJsPresent = !!window['__zone_symbol__Promise'];
    if (probe.zoneJsPresent) {
      probe.NativePromise = window['__zone_symbol__Promise'];
      probe.ZoneAwarePromise = Promise;
    } else {
       probe.NativePromise = Promise;
    }

    probe.promise = new Promise(() => null);
    probe.fetchResult = window['fetch']('');

    if (skipAsync) {
      done && done(probe);
      return probe;
    }

    probe.fetchResult.then(function (res) {
      probe.textResult = res.text();
      probe.textResult.then(function(textRes) {
        done && done(probe);
      });
    });

    return probe;
  }

  function logProbe(probe) {
    var isNativePromise = obj => obj instanceof probe.NativePromise;
    var isZoneAwarePromise = obj => !!probe.ZoneAwarePromise &&
                                    obj instanceof probe.ZoneAwarePromise;
    var toString = (fn) => fn.toString().replace(/\s*\n\s*/g, ' ');

    var out = [];
    var log = function(msg, shout) { out.push('| ' + (shout ? '(!!!) ' : '') + msg); }
    var SHOUT = true;

    out.push(`----------- Promise probe: ${probe.id} / ${probe.tag} -----------`);
    log('Promise.name: ' + probe.promiseName);
    log('zone.js present: ' + (probe.zoneJsPresent ? 'YES' : 'NO'));
    if (probe.NativePromise.name != 'Promise' &&
        probe.NativePromise.toString().indexOf('[native code]') == -1) {
      log('Supposed native Promise is not native.', SHOUT);
      log('NativePromise.toString(): ' + toString(probe.NativePromise));
    }
    // If ActualNativePromise exists, it is assumed to contain the actual native promise.
    var ActualNativePromise = window['ActualNativePromise'];
    if (ActualNativePromise) {
      var actuallyNative = (probe.NativePromise == window['ActualNativePromise']);
      log('NativePromise == window.ActualNativePromise: ' + actuallyNative, !actuallyNative);
    }
    if (probe.zoneJsPresent &&
        probe.ZoneAwarePromise.name != 'ZoneAwarePromise') {
      log('Expected window.Promise to be ZoneAwarePromise.', SHOUT);
    }
    log('promise instanceof NativePromise:    ' + isNativePromise(probe.promise));
    log('promise instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.promise));
    
    log('fetchResult instanceof NativePromise:    ' + isNativePromise(probe.fetchResult));
    log('fetchResult instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.fetchResult));
    if (!isNativePromise(probe.fetchResult) && !isZoneAwarePromise(probe.fetchResult)) {
      log('fetchResult is neither instance of NativePromise nor ZoneAwarePromise', SHOUT);
      var Ctor = probe.fetchResult.constructor;
      log('fetchResult.constructor.name: ' + Ctor.name, SHOUT);
      log('fetchResult.constructor.toString(): ' + toString(Ctor), SHOUT);
    }

    if (probe.textResult) {
      log('textResult instanceof NativePromise:    ' + isNativePromise(probe.textResult));
      log('textResult instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.textResult));
      if (!isNativePromise(probe.textResult) && !isZoneAwarePromise(probe.textResult)) {
        log('textResult is neither instance of NativePromise nor ZoneAwarePromise', SHOUT);
        var Ctor = probe.textResult.constructor;
        log('textResult.constructor.name: ' + Ctor.name, SHOUT);
        log('textResult.constructor.toString(): ' + toString(Ctor), SHOUT);
      }
    }

    console.log(out.join('\n'));    
  }


  var ret = function(tag) {
    gatherProbe(tag, function(probe) { logProbe(probe); });
  }
  ret.probes = probes;
  return ret;
})();
