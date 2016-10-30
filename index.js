(function (global) {
  'use strict'

  // initialize vue-meta
  var VueMeta = {}

  // initialize manager
  var _manager = {}

  /**
   * Registers the plugin with Vue.js
   * Pass it like so: Vue.use(VueMeta)
   * @param {Function} Vue - the Vue constructor
   */
  VueMeta.install = function install (Vue) {
    // if we've already installed, don't do anything
    if (VueMeta.install.installed) return

    // set installation inspection flag
    VueMeta.install.installed = true

    // listen for when components mount - when they do,
    // update the meta info & the DOM
    Vue.mixin({
      mounted: function mounted () {
        this.$root.$vueMeta.updateMetaInfo()
      }
    })

    // guard against `$vueMeta` being redefined on new server requests
    if (!Vue.prototype.hasOwnProperty('$vueMeta')) {
      // define API methods on the `$vueMeta` instance property
      Object.defineProperty(Vue.prototype, '$vueMeta', {
        enumerable: true,

        /**
         * Meta info manager API factory
         * @return {Object} - the API for this plugin
         */
        get: function get () {
          _manager.getMetaInfo = _manager.getMetaInfo || Vue.util.bind(getMetaInfo, this)
          _manager.updateMetaInfo = _manager.updateMetaInfo || updateMetaInfo
          return _manager
        }
      })
    }

    /**
     * Updates meta info and renders it to the DOM
     */
    function updateMetaInfo () {
      var newMeta = this.getMetaInfo()
      if (newMeta.title) {
        updateTitle(newMeta.title)
      }
    }

    /**
     * Fetches corresponding meta info for the current component state
     * @return {Object} - all the meta info for currently matched components
     */
    function getMetaInfo () {
      var info = getMetaInfoDefinition(Vue, this)
      if (info.titleTemplate) {
        info.title = info.titleTemplate.replace('%s', info.title)
      }
      return info
    }
  }

  /**
   * Recursively traverses each component, checking for a `metaInfo`
   * option. It then merges all these options into one object, giving
   * higher priority to deeply nested components.
   *
   * NOTE: This function uses Vue.prototype.$children, the results of which
   *       are not gauranted to be in order. For this reason, try to avoid
   *       using the same `metaInfo` property in sibling components.
   *
   * @param  {Function} Vue - the Vue constructor
   * @param  {Object} $instance - the current instance
   * @param  {Object} [metaInfo={}] - the merged options
   * @return {Object} metaInfo - the merged options
   */
  function getMetaInfoDefinition (Vue, $instance, metaInfo) {
    // set default for first run
    metaInfo = metaInfo || {}

    // if current instance has a metaInfo option...
    if ($instance.$options.metaInfo) {
      var componentMetaInfo = $instance.$options.metaInfo
      var key

      // ...convert all function type keys to raw data
      // (this allows meta info to be inferred from props & data)...
      for (key in componentMetaInfo) {
        if (componentMetaInfo.hasOwnProperty(key)) {
          var val = componentMetaInfo[key]
          if (typeof val === 'function') {
            componentMetaInfo[key] = val.call($instance)
          }
        }
      }

      // ...then merge the data into metaInfo
      metaInfo = Vue.util.mergeOptions(metaInfo, componentMetaInfo)
    }

    // check if any children also have a metaInfo option, if so, merge
    // them into existing data
    var len = $instance.$children.length
    if (len) {
      var i = 0
      for (; i < len; i++) {
        metaInfo = getMetaInfoDefinition(Vue, $instance.$children[i], metaInfo)
      }
    }

    // meta info is ready for consumption
    return metaInfo
  }

  /**
   * updates the document title
   * @param  {String} title - the new title of the document
   */
  function updateTitle (title) {
    document.title = title || document.title
  }

  // automatic installation when global context
  if (typeof Vue !== 'undefined') {
    Vue.use(VueMeta)
  }

  // export VueMeta
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = VueMeta
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return VueMeta })
  } else {
    global.VueMeta = VueMeta
  }
})(this)