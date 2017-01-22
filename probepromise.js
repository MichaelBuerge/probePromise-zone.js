

function probePromise(tag) {
  var self = arguments.callee['static'];
  if (!self) {
    self = arguments.callee['static'] = {
      num: -1,
      probes: [],
    }
  }
  self.num++;

  var probe = {
    id: self.num,
    tag: tag || 'probe' + self.num,
    zoneJsPresent: false,
    Promise: null,
    promiseName: null,
    NativePromise: null,
    ZoneAwarePromise: null,
    promise: null,
    fetchResult: null,
  };
  self.probes.push(probe);

  var isNativePromise = obj => obj instanceof probe.NativePromise;
  var isZoneAwarePromise = obj => !!probe.ZoneAwarePromise &&
                                  obj instanceof probe.ZoneAwarePromise;

  var logProbe = function() {
    var out = [];
    var log = msg => out.push('| ' + msg);
    out.push('----------- Promise probe: {tag} -----------'.replace('{tag}', probe.tag));
    log('Promise.name: ' + probe.promiseName);
    log('zone.js present: ' + (probe.zoneJsPresent ? 'YES' : 'NO'));
    if (probe.NativePromise.name != 'Promise' &&
        probe.NativePromise.toString().indexOf('[native code]') == -1) {
      log('!!! Supposed native Promise is not native.');
    }
    if (probe.zoneJsPresent &&
        probe.ZoneAwarePromise.name != 'ZoneAwarePromise') {
      log('!!! Expected window.Promise to be ZoneAwarePromise.');
    }
    log('promise is of NativePromise:    ' + isNativePromise(probe.promise));
    log('promise is of ZoneAwarePromise: ' + isZoneAwarePromise(probe.promise));
    
    log('fetchResult is of NativePromise):    ' + isNativePromise(probe.fetchResult));
    log('fetchResult is of ZoneAwarePromise): ' + isZoneAwarePromise(probe.fetchResult));
    if (!isNativePromise(probe.fetchResult) && !isZoneAwarePromise(probe.fetchResult)) {
      log('!!! fetchResult is neither instance of NativePromise nor ZoneAwarePromise');
      var Ctor = probe.fetchResult.constructor;
      log('!!! fetchResult.constructor.name: ' + Ctor.name);
      log('!!! fetchResult.constructor.toString(): ' + Ctor.toString());
    }

    console.log(out.join('\n'));
  }

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

  logProbe();
};