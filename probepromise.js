

window['probePromise'] = (function() {
  var probeId = -1;
  var probes = [];

  function gatherProbe(tag) {
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

    probe.fetchResult.then(function (res) {
      probe.textResult = res.text();
      probe.textResult.then(function(textRes) {
        console.log('--- possibly out of order ---')
        logProbe(probe);
      });
    });
    return probe;
  }

  function logProbe(probe) {
    var isNativePromise = obj => obj instanceof probe.NativePromise;
    var isZoneAwarePromise = obj => !!probe.ZoneAwarePromise &&
                                    obj instanceof probe.ZoneAwarePromise;

    var out = [];
    var log = msg => out.push('| ' + msg);
    out.push('----------- Promise probe: {tag} -----------'.replace('{tag}', probe.tag));
    log('Promise.name: ' + probe.promiseName);
    log('zone.js present: ' + (probe.zoneJsPresent ? 'YES' : 'NO'));
    if (probe.NativePromise.name != 'Promise' &&
        probe.NativePromise.toString().indexOf('[native code]') == -1) {
      log('!!! Supposed native Promise is not native.');
      log('NativePromise.toString(): ' + probe.NativePromise.toString());
    }
    if (probe.zoneJsPresent &&
        probe.ZoneAwarePromise.name != 'ZoneAwarePromise') {
      log('!!! Expected window.Promise to be ZoneAwarePromise.');
    }
    log('promise instanceof NativePromise:    ' + isNativePromise(probe.promise));
    log('promise instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.promise));
    
    log('fetchResult instanceof NativePromise:    ' + isNativePromise(probe.fetchResult));
    log('fetchResult instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.fetchResult));
    if (!isNativePromise(probe.fetchResult) && !isZoneAwarePromise(probe.fetchResult)) {
      log('!!! fetchResult is neither instance of NativePromise nor ZoneAwarePromise');
      var Ctor = probe.fetchResult.constructor;
      log('!!! fetchResult.constructor.name: ' + Ctor.name);
      log('!!! fetchResult.constructor.toString(): ' + Ctor.toString());
    }

    log('textResult instanceof NativePromise:    ' + isNativePromise(probe.textResult));
    log('textResult instanceof ZoneAwarePromise: ' + isZoneAwarePromise(probe.textResult));
    if (!isNativePromise(probe.textResult) && !isZoneAwarePromise(probe.textResult)) {
      log('!!! textResult is neither instance of NativePromise nor ZoneAwarePromise');
      var Ctor = probe.textResult.constructor;
      log('!!! textResult.constructor.name: ' + Ctor.name);
      log('!!! textResult.constructor.toString(): ' + Ctor.toString());
    }

    console.log(out.join('\n'));    
  }

  return function(tag) {
    var probe = gatherProbe(tag);
    // logProbe(probe);
  }
})();
